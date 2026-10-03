import { message } from "antd";
import { compressImageForUpload } from "@/utils/imageUpload";
import { compressVideoForUpload } from "@/utils/videoCompression";

// Below this a video isn't worth the time it takes to re-encode.
const VIDEO_MIN_BYTES = 3 * 1024 * 1024;

const isVideo = (file) =>
  file?.type?.startsWith("video/") || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(file?.name || "");

/**
 * Compress a photo or video before it is uploaded. The API no longer
 * compresses uploads itself, so every place that sends media calls this (or
 * the two helpers it wraps) first.
 *
 * Photos are quick and silent. A video can take a while, so a "Đang nén
 * video..." notice with the progress stays on screen until it is done.
 * Anything that isn't a photo or video is returned unchanged.
 *
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function compressMediaForUpload(file) {
  if (!file || typeof window === "undefined") return file;

  if (file.type?.startsWith("image/")) {
    return compressImageForUpload(file);
  }

  if (!isVideo(file) || file.size < VIDEO_MIN_BYTES) {
    return file;
  }

  const key = `compress-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let lastPercent = -1;
  message.loading({ content: "Đang nén video...", key, duration: 0 });

  try {
    return await compressVideoForUpload(file, {
      onProgress: (ratio) => {
        const percent = Math.round(ratio * 100);
        // The notice is re-rendered on every call; whole percents are enough.
        if (percent === lastPercent) return;
        lastPercent = percent;
        message.loading({ content: `Đang nén video... ${percent}%`, key, duration: 0 });
      },
    });
  } finally {
    message.destroy(key);
  }
}
