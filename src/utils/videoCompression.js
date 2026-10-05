/**
 * Compresses a video in the browser before upload: 720p H.264 in an MP4, the
 * same target the server-side job used to produce (the API no longer
 * compresses uploads).
 *
 * Uses WebCodecs (hardware-accelerated decode/encode) with two small
 * libraries loaded on demand from a CDN - mp4box to read the source file and
 * mp4-muxer to write the result - so nothing is added to the bundle and
 * nothing loads until a video is actually sent.
 *
 * Resolves to the ORIGINAL file whenever compressing can't be done or
 * wouldn't help: the browser has no WebCodecs, the file isn't MP4/MOV, its
 * codec can't be decoded here, it is already small enough, or anything
 * fails along the way. Uploading always still works.
 */

const MP4BOX_URL = "https://cdn.jsdelivr.net/npm/mp4box@0.5.2/+esm";
const MP4_MUXER_URL = "https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/+esm";

// 720p: the shorter side is at most 720 pixels.
const MAX_SHORT_SIDE = 720;
// Enough for a good-looking 720p30 H.264 picture, at about half the size of
// the 4.7 Mbps used before.
const MAX_BITRATE = 2_500_000;
// Frames per second: a 60 fps recording keeps every other frame.
const MAX_FPS = 30;
// A keyframe every ~2 seconds keeps seeking responsive.
const KEYFRAME_INTERVAL_US = 2_000_000;
// How many frames may wait in the decoder/encoder before feeding more.
const MAX_QUEUE = 12;

// H.264 High, Main, Baseline at level 4.0 - the first one the device supports.
const H264_CODECS = ["avc1.640028", "avc1.4d0028", "avc1.420028"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isMp4Like(file) {
  return (
    file.type === "video/mp4" ||
    file.type === "video/quicktime" ||
    /\.(mp4|mov|m4v)$/i.test(file.name || "")
  );
}

async function loadLibraries() {
  const [mp4boxModule, muxerModule] = await Promise.all([
    import(/* webpackIgnore: true */ MP4BOX_URL),
    import(/* webpackIgnore: true */ MP4_MUXER_URL),
  ]);
  // The CDN's ESM build of mp4box (a CommonJS package) may expose its API as
  // named exports or under `default`.
  const MP4Box = mp4boxModule.createFile ? mp4boxModule : mp4boxModule.default;
  const Muxer = muxerModule.Muxer || muxerModule.default?.Muxer;
  const ArrayBufferTarget = muxerModule.ArrayBufferTarget || muxerModule.default?.ArrayBufferTarget;
  if (!MP4Box?.createFile || !Muxer || !ArrayBufferTarget) {
    throw new Error("Video libraries failed to load");
  }
  return { MP4Box, Muxer, ArrayBufferTarget };
}

/**
 * Reads the whole file with mp4box: track info plus every video and audio
 * sample (the encoded frames).
 */
async function demux(MP4Box, file) {
  const mp4 = MP4Box.createFile();
  const samples = { video: [], audio: [] };
  let info = null;
  let videoTrack = null;
  let audioTrack = null;

  const ready = new Promise((resolve, reject) => {
    mp4.onError = (error) => reject(new Error(String(error)));
    mp4.onReady = (fileInfo) => {
      info = fileInfo;
      videoTrack = fileInfo.videoTracks?.[0] || null;
      audioTrack = fileInfo.audioTracks?.[0] || null;
      if (videoTrack) mp4.setExtractionOptions(videoTrack.id, "video", { nbSamples: 200 });
      if (audioTrack) mp4.setExtractionOptions(audioTrack.id, "audio", { nbSamples: 200 });
      mp4.start();
      resolve();
    };
  });

  mp4.onSamples = (_id, kind, batch) => {
    samples[kind].push(...batch);
  };

  // Fed in slices so a large file isn't copied in one piece.
  const SLICE = 8 * 1024 * 1024;
  for (let offset = 0; offset < file.size; offset += SLICE) {
    const buffer = await file.slice(offset, offset + SLICE).arrayBuffer();
    buffer.fileStart = offset;
    mp4.appendBuffer(buffer);
  }
  mp4.flush();

  // onReady fires as soon as the header has been read; if it never did, this
  // isn't a file mp4box understands.
  await Promise.race([
    ready,
    sleep(0).then(() => {
      if (!info) throw new Error("Not a readable MP4");
    }),
  ]);

  return { mp4, info, videoTrack, audioTrack, samples };
}

/** The codec configuration record (avcC / hvcC...) the decoder needs. */
function videoDescription(MP4Box, mp4, trackId) {
  const trak = mp4.getTrackById(trackId);
  for (const entry of trak.mdia.minf.stbl.stsd.entries) {
    const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
    if (box) {
      const stream = new MP4Box.DataStream(undefined, 0, MP4Box.DataStream.BIG_ENDIAN);
      box.write(stream);
      // Skip the 8-byte box header (size + type).
      return new Uint8Array(stream.buffer, 8);
    }
  }
  return null;
}

/** AAC's AudioSpecificConfig, needed to copy the audio track as it is. */
function audioDescription(mp4, trackId) {
  const trak = mp4.getTrackById(trackId);
  const esds = trak.mdia.minf.stbl.stsd.entries?.[0]?.esds;
  const data = esds?.esd?.descs?.[0]?.descs?.[0]?.data;
  return data ? new Uint8Array(data) : null;
}

/** 0, 90, 180 or 270: how the player must turn the picture (phone videos). */
function rotationOf(track) {
  const matrix = track.matrix;
  if (!matrix || matrix.length < 2) return 0;
  const degrees = Math.round((Math.atan2(matrix[1], matrix[0]) * 180) / Math.PI);
  const normalized = ((degrees % 360) + 360) % 360;
  return [0, 90, 180, 270].includes(normalized) ? normalized : 0;
}

const even = (value) => Math.max(2, Math.round(value / 2) * 2);

/**
 * @param {File} file
 * @param {{ onProgress?: (ratio: number) => void }} [options]  ratio is 0..1
 * @returns {Promise<File>}
 */
export async function compressVideoForUpload(file, { onProgress } = {}) {
  if (
    typeof window === "undefined" ||
    typeof VideoEncoder === "undefined" ||
    typeof VideoDecoder === "undefined" ||
    typeof OffscreenCanvas === "undefined" ||
    !isMp4Like(file)
  ) {
    return file;
  }

  let decoder = null;
  let encoder = null;

  try {
    const { MP4Box, Muxer, ArrayBufferTarget } = await loadLibraries();
    const { mp4, info, videoTrack, audioTrack, samples } = await demux(MP4Box, file);
    if (!videoTrack || samples.video.length === 0) return file;

    const sourceWidth = videoTrack.video?.width || videoTrack.track_width;
    const sourceHeight = videoTrack.video?.height || videoTrack.track_height;
    if (!sourceWidth || !sourceHeight) return file;

    const durationSeconds = info.duration / info.timescale || 0;
    const sourceBitrate = videoTrack.bitrate || (durationSeconds ? (file.size * 8) / durationSeconds : 0);
    const isH264 = /^avc[13]/.test(videoTrack.codec || "");
    const shortSide = Math.min(sourceWidth, sourceHeight);
    const sourceFps = Math.round(samples.video.length / (durationSeconds || 1)) || MAX_FPS;

    // Already what we would produce: H.264, 720p or smaller, 30 fps or less,
    // within the bitrate ceiling. Re-encoding would only lose quality.
    // (+1: a "30 fps" file is often 30.x when counted from its samples.)
    if (
      isH264 &&
      shortSide <= MAX_SHORT_SIDE &&
      sourceFps <= MAX_FPS + 1 &&
      sourceBitrate > 0 &&
      sourceBitrate <= MAX_BITRATE
    ) {
      return file;
    }

    const description = videoDescription(MP4Box, mp4, videoTrack.id);
    const decoderConfig = {
      codec: videoTrack.codec,
      codedWidth: sourceWidth,
      codedHeight: sourceHeight,
      ...(description ? { description } : null),
    };
    if (!(await VideoDecoder.isConfigSupported(decoderConfig)).supported) return file;

    // The audio is copied, not re-encoded - only possible for AAC. Rather
    // than silently drop a soundtrack we can't copy, keep the original file.
    let audio = null;
    if (audioTrack && samples.audio.length > 0) {
      const audioConfig = /^mp4a/.test(audioTrack.codec || "") ? audioDescription(mp4, audioTrack.id) : null;
      if (!audioConfig) return file;
      audio = {
        description: audioConfig,
        numberOfChannels: audioTrack.audio?.channel_count || 2,
        sampleRate: audioTrack.audio?.sample_rate || 44100,
        codec: audioTrack.codec,
      };
    }

    const scale = Math.min(1, MAX_SHORT_SIDE / shortSide);
    const width = even(sourceWidth * scale);
    const height = even(sourceHeight * scale);
    const frameRate = Math.min(MAX_FPS, sourceFps);
    // Above the cap, frames closer together than this are dropped (with a
    // little slack, so a steady 30 fps source loses nothing to jitter).
    const dropFrames = sourceFps > MAX_FPS + 1;
    const minFrameGapUs = (1_000_000 / MAX_FPS) * 0.9;
    // Never above the source's own bitrate (that would only grow the file).
    const bitrate = Math.round(
      Math.min(MAX_BITRATE, sourceBitrate > 0 ? Math.max(sourceBitrate, 800_000) : MAX_BITRATE)
    );

    let encoderConfig = null;
    for (const codec of H264_CODECS) {
      const candidate = { codec, width, height, bitrate, framerate: frameRate, avc: { format: "avc" } };
      if ((await VideoEncoder.isConfigSupported(candidate)).supported) {
        encoderConfig = candidate;
        break;
      }
    }
    if (!encoderConfig) return file;

    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: {
        codec: "avc",
        width,
        height,
        // Frames are stored unrotated; this tells players how to turn them.
        rotation: rotationOf(videoTrack),
      },
      ...(audio
        ? { audio: { codec: "aac", numberOfChannels: audio.numberOfChannels, sampleRate: audio.sampleRate } }
        : null),
      // Index at the front, so the video starts playing before it has fully
      // downloaded.
      fastStart: "in-memory",
      firstTimestampBehavior: "offset",
    });

    let failure = null;
    let decodedFrames = 0;
    const totalFrames = samples.video.length;

    encoder = new VideoEncoder({
      output: (chunk, meta) => {
        muxer.addVideoChunk(chunk, meta);
      },
      error: (error) => {
        failure = error;
      },
    });
    encoder.configure(encoderConfig);

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    let lastKeyframeAt = -Infinity;
    let lastKeptAt = -Infinity;

    decoder = new VideoDecoder({
      output: (frame) => {
        try {
          decodedFrames += 1;
          onProgress?.(Math.min(0.99, decodedFrames / totalFrames));

          // The 30 fps cap: skip a frame that comes too soon after the last
          // one kept (frames arrive in display order).
          if (dropFrames && frame.timestamp - lastKeptAt < minFrameGapUs) return;
          lastKeptAt = frame.timestamp;

          // Drawing through a canvas does the downscale in every browser
          // (not all encoders resize frames themselves).
          context.drawImage(frame, 0, 0, width, height);
          const scaled = new VideoFrame(canvas, {
            timestamp: frame.timestamp,
            // A kept frame now also covers the one dropped after it.
            duration: dropFrames
              ? Math.round(1_000_000 / frameRate)
              : frame.duration || undefined,
          });
          const keyFrame = frame.timestamp - lastKeyframeAt >= KEYFRAME_INTERVAL_US;
          if (keyFrame) lastKeyframeAt = frame.timestamp;
          encoder.encode(scaled, { keyFrame });
          scaled.close();
        } catch (error) {
          failure = error;
        } finally {
          frame.close();
        }
      },
      error: (error) => {
        failure = error;
      },
    });
    decoder.configure(decoderConfig);

    const toMicros = (value, timescale) => Math.round((value * 1_000_000) / timescale);

    for (const sample of samples.video) {
      if (failure) throw failure;

      // Don't let frames pile up in memory faster than they are processed.
      while (decoder.decodeQueueSize > MAX_QUEUE || encoder.encodeQueueSize > MAX_QUEUE) {
        await sleep(8);
        if (failure) throw failure;
      }

      decoder.decode(
        new EncodedVideoChunk({
          type: sample.is_sync ? "key" : "delta",
          timestamp: toMicros(sample.cts, sample.timescale),
          duration: toMicros(sample.duration, sample.timescale),
          data: sample.data,
        })
      );
    }

    await decoder.flush();
    await encoder.flush();
    if (failure) throw failure;

    if (audio) {
      samples.audio.forEach((sample, index) => {
        muxer.addAudioChunkRaw(
          new Uint8Array(sample.data),
          "key",
          toMicros(sample.cts, sample.timescale),
          toMicros(sample.duration, sample.timescale),
          index === 0
            ? {
                decoderConfig: {
                  codec: audio.codec,
                  numberOfChannels: audio.numberOfChannels,
                  sampleRate: audio.sampleRate,
                  description: audio.description,
                },
              }
            : undefined
        );
      });
    }

    muxer.finalize();
    onProgress?.(1);

    const output = target.buffer;
    // Only take a real win.
    if (!output || output.byteLength === 0 || output.byteLength >= file.size) return file;

    const base = (file.name || "video").replace(/\.[^.]*$/, "") || "video";
    return new File([output], `${base}.mp4`, { type: "video/mp4", lastModified: file.lastModified });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Video compression skipped:", error);
    return file;
  } finally {
    try {
      if (decoder && decoder.state !== "closed") decoder.close();
      if (encoder && encoder.state !== "closed") encoder.close();
    } catch {
      // Already closed after an error.
    }
  }
}
