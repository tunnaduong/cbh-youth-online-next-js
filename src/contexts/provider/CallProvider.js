"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import CallContext from "../CallContext";
import { useAuthContext } from "../Support";
import { getEcho } from "@/lib/echo";
import {
  getIceServers,
  getActiveCall,
  initiateCall as initiateCallApi,
  answerCall as answerCallApi,
  rejectCall as rejectCallApi,
  endCall as endCallApi,
  sendCallSignal as sendCallSignalApi,
} from "@/app/Api";
import {
  playOutgoingRing,
  playIncomingRing,
  playConnectedTone,
  playEndTone,
  stopAllSounds,
} from "@/utils/callSounds";
import { message as antdMessage } from "antd";

const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

function filterDeadIceServers(list) {
  if (!Array.isArray(list)) return [...DEFAULT_ICE_SERVERS];
  const filtered = list.filter((s) => {
    if (!s || !s.urls) return false;
    return !JSON.stringify(s.urls).includes("openrelay.metered.ca");
  });
  return filtered.length > 0 ? filtered : [...DEFAULT_ICE_SERVERS];
}

function enhanceSdpOpus(sdpStr) {
  if (!sdpStr || typeof sdpStr !== "string") return sdpStr;
  return sdpStr.replace(/a=fmtp:111 (.*)/g, (match, params) => {
    let next = params;
    if (!next.includes("useinbandfec=")) next += ";useinbandfec=1";
    if (!next.includes("maxaveragebitrate=")) next += ";maxaveragebitrate=64000";
    return `a=fmtp:111 ${next}`;
  });
}

function linearToUlaw(sample) {
  const BIAS = 0x84;
  const CLIP = 32635;
  let sign = (sample >> 8) & 0x80;
  if (sign !== 0) sample = -sample;
  if (sample > CLIP) sample = CLIP;
  sample = sample + BIAS;
  let exponent = 7;
  for (
    let expMask = 0x4000;
    (sample & expMask) === 0 && exponent > 0;
    exponent--, expMask >>= 1
  ) {}
  const mantissa = (sample >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

function ulawToLinear(uVal) {
  uVal = ~uVal & 0xff;
  let t = ((uVal & 0x0f) << 3) + 0x84;
  t <<= (uVal & 0x70) >> 4;
  return uVal & 0x80 ? 0x84 - t : t - 0x84;
}

function serializeSdp(desc) {
  if (!desc) return null;
  return {
    type: desc.type,
    sdp: enhanceSdpOpus(desc.sdp),
  };
}

function serializeCandidate(cand) {
  if (!cand) return null;
  const inner =
    cand.candidate && typeof cand.candidate === "object"
      ? cand.candidate
      : cand;
  return {
    candidate: inner.candidate,
    sdpMid: inner.sdpMid ?? null,
    sdpMLineIndex: inner.sdpMLineIndex ?? null,
    usernameFragment: inner.usernameFragment ?? null,
  };
}

export const CallProvider = ({ children }) => {
  const { loggedIn, currentUser } = useAuthContext();

  const [callStatus, setCallStatus] = useState("idle"); // 'idle' | 'calling' | 'ringing' | 'ringingOutward' | 'connected' | 'ended'
  const [callType, setCallType] = useState("audio"); // 'audio' | 'video'
  const [activeCall, setActiveCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // References to keep async callbacks updated with latest state
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const activeCallRef = useRef(null);
  const callStatusRef = useRef("idle");
  const callTypeRef = useRef("audio");
  const timerIntervalRef = useRef(null);
  const ringingTimeoutRef = useRef(null);
  const connectingTimeoutRef = useRef(null);
  const ringingRetryTimersRef = useRef([]);
  const pendingOfferRef = useRef(null);
  const offerCreatedForCallRef = useRef(null);
  const answerProcessedForCallRef = useRef(null);
  const offerProcessedForCallRef = useRef(null);
  const ringingAckReceivedRef = useRef(false);
  const sdpChunksBufferRef = useRef({});
  const processedSignalSeqRef = useRef(0);
  const processedAudioSeqRef = useRef(0);
  const processedCandidatesSetRef = useRef(new Set());
  const persistentAudioRef = useRef(null);
  const persistentVideoAudioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const remoteGainNodeRef = useRef(null);
  const remoteMediaSourceRef = useRef(null);
  const captureSourceRef = useRef(null);
  const captureProcessorRef = useRef(null);
  const captureSilentGainRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const webrtcAudioReceivingRef = useRef(false);
  const lastInboundBytesRef = useRef(0);
  const nextRelayPlayTimeRef = useRef(0);
  const isMutedRef = useRef(false);

  const clearConnectingTimeout = useCallback(() => {
    if (connectingTimeoutRef.current) {
      clearTimeout(connectingTimeoutRef.current);
      connectingTimeoutRef.current = null;
    }
  }, []);

  const clearRingingRetryTimers = useCallback(() => {
    ringingRetryTimersRef.current.forEach((t) => clearTimeout(t));
    ringingRetryTimersRef.current = [];
  }, []);

  const iceCandidatesQueueRef = useRef([]);

  const clearRingingTimeout = useCallback(() => {
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
  }, []);

  const iceServersRef = useRef(DEFAULT_ICE_SERVERS);
  const originalVideoTrackRef = useRef(null);

  // Update refs on state changes
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    callTypeRef.current = callType;
  }, [callType]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const ensureCallAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (audioCtxRef.current && !remoteGainNodeRef.current) {
        const gain = audioCtxRef.current.createGain();
        gain.gain.value = 1.15;
        gain.connect(audioCtxRef.current.destination);
        remoteGainNodeRef.current = gain;
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  const stopAudioFallbackCapture = useCallback(() => {
    if (captureProcessorRef.current) {
      try {
        captureProcessorRef.current.disconnect();
        captureProcessorRef.current.onaudioprocess = null;
      } catch {}
      captureProcessorRef.current = null;
    }
    if (captureSourceRef.current) {
      try {
        captureSourceRef.current.disconnect();
      } catch {}
      captureSourceRef.current = null;
    }
    if (captureSilentGainRef.current) {
      try {
        captureSilentGainRef.current.disconnect();
      } catch {}
      captureSilentGainRef.current = null;
    }
  }, []);

  const startAudioFallbackCapture = useCallback(
    (stream, callId) => {
      stopAudioFallbackCapture();
      if (!stream || stream.getAudioTracks().length === 0) return;
      try {
        const ctx = ensureCallAudioContext();
        if (!ctx) return;
        const inRate = ctx.sampleRate || 48000;
        const outRate = 8000;
        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        const silentGain = ctx.createGain();
        silentGain.gain.value = 0;

        let sampleBuf = [];
        let lastSentAt = 0;

        processor.onaudioprocess = (e) => {
          const activeId = callId || activeCallRef.current?.id;
          if (
            isMutedRef.current ||
            webrtcAudioReceivingRef.current ||
            !activeId ||
            callStatusRef.current !== "connected"
          ) {
            sampleBuf = [];
            return;
          }
          const input = e.inputBuffer.getChannelData(0);
          const ratio = inRate / outRate;
          let sumSq = 0;
          for (let i = 0; i < input.length; i += ratio) {
            const idx = Math.floor(i);
            const s = idx < input.length ? input[idx] : 0;
            sumSq += s * s;
            const pcm16 = Math.max(
              -32768,
              Math.min(32767, Math.round(s * 32767))
            );
            sampleBuf.push(linearToUlaw(pcm16));
          }

          const now = Date.now();
          if (sampleBuf.length >= 2000 && now - lastSentAt >= 220) {
            lastSentAt = now;
            const chunkBytes = sampleBuf.splice(0, sampleBuf.length);
            const rms = Math.sqrt(sumSq / Math.max(1, input.length / ratio));
            if (rms < 0.002) return;
            let binary = "";
            for (let j = 0; j < chunkBytes.length; j++) {
              binary += String.fromCharCode(chunkBytes[j]);
            }
            sendCallSignalApi(activeId, "audio_chunk", {
              d: btoa(binary),
              sr: outRate,
            }).catch(() => {});
          }
        };

        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(ctx.destination);

        captureSourceRef.current = source;
        captureProcessorRef.current = processor;
        captureSilentGainRef.current = silentGain;
      } catch {}
    },
    [ensureCallAudioContext, stopAudioFallbackCapture]
  );

  const playIncomingAudioChunk = useCallback(
    (payload) => {
      if (webrtcAudioReceivingRef.current || !payload) return;
      const b64 =
        typeof payload === "string" ? payload : payload.d || payload.chunk;
      if (!b64) return;
      const sr = payload?.sr || payload?.sampleRate || 8000;
      try {
        const ctx = ensureCallAudioContext();
        if (!ctx) return;
        const bin = atob(b64);
        const len = bin.length;
        if (len === 0) return;
        const audioBuffer = ctx.createBuffer(1, len, sr);
        const channel = audioBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) {
          channel[i] = ulawToLinear(bin.charCodeAt(i)) / 32768.0;
        }
        const src = ctx.createBufferSource();
        src.buffer = audioBuffer;
        src.connect(remoteGainNodeRef.current || ctx.destination);
        const now = ctx.currentTime;
        if (
          nextRelayPlayTimeRef.current < now ||
          nextRelayPlayTimeRef.current > now + 0.6
        ) {
          nextRelayPlayTimeRef.current = now + 0.03;
        }
        src.start(nextRelayPlayTimeRef.current);
        nextRelayPlayTimeRef.current += audioBuffer.duration;
      } catch {}
    },
    [ensureCallAudioContext]
  );

  const attachRemoteStreamToAllOutputs = useCallback(
    (stream) => {
      if (!stream) return;
      const ctx = ensureCallAudioContext();

      if (persistentAudioRef.current) {
        if (persistentAudioRef.current.srcObject !== stream) {
          persistentAudioRef.current.srcObject = stream;
        }
        persistentAudioRef.current.muted = false;
        persistentAudioRef.current.volume = 1.0;
        const p1 = persistentAudioRef.current.play();
        if (p1 && typeof p1.catch === "function") {
          p1.catch(() => {
            setTimeout(() => {
              try {
                persistentAudioRef.current?.play().catch(() => {});
              } catch {}
            }, 250);
          });
        }
      }

      if (persistentVideoAudioRef.current) {
        if (persistentVideoAudioRef.current.srcObject !== stream) {
          persistentVideoAudioRef.current.srcObject = stream;
        }
        persistentVideoAudioRef.current.muted = false;
        persistentVideoAudioRef.current.volume = 1.0;
        const p2 = persistentVideoAudioRef.current.play();
        if (p2 && typeof p2.catch === "function") {
          p2.catch(() => {
            setTimeout(() => {
              try {
                persistentVideoAudioRef.current?.play().catch(() => {});
              } catch {}
            }, 250);
          });
        }
      }

      if (ctx) {
        try {
          if (remoteMediaSourceRef.current) {
            try {
              remoteMediaSourceRef.current.disconnect();
            } catch {}
          }
          const srcNode = ctx.createMediaStreamSource(stream);
          srcNode.connect(remoteGainNodeRef.current || ctx.destination);
          remoteMediaSourceRef.current = srcNode;
        } catch {}
      }
    },
    [ensureCallAudioContext]
  );

  // Fetch STUN/TURN servers on mount
  useEffect(() => {
    if (!loggedIn) return;
    getIceServers()
      .then((res) => {
        if (res?.data?.ice_servers && Array.isArray(res.data.ice_servers)) {
          iceServersRef.current = filterDeadIceServers(res.data.ice_servers);
        }
      })
      .catch(() => {
        // Fallback already in place
      });
  }, [loggedIn]);

  /**
   * Complete reset and cleanup of media streams, WebRTC connections and timers.
   */
  const cleanupCall = useCallback(() => {
    stopAllSounds();
    clearConnectingTimeout();
    clearRingingTimeout();
    clearRingingRetryTimers();

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    stopAudioFallbackCapture();

    if (remoteMediaSourceRef.current) {
      try {
        remoteMediaSourceRef.current.disconnect();
      } catch {}
      remoteMediaSourceRef.current = null;
    }

    if (persistentAudioRef.current) {
      try {
        persistentAudioRef.current.srcObject = null;
      } catch {}
    }

    if (persistentVideoAudioRef.current) {
      try {
        persistentVideoAudioRef.current.srcObject = null;
      } catch {}
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      remoteStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {}
      peerConnectionRef.current = null;
    }

    iceCandidatesQueueRef.current = [];
    originalVideoTrackRef.current = null;
    pendingOfferRef.current = null;
    offerCreatedForCallRef.current = null;
    answerProcessedForCallRef.current = null;
    offerProcessedForCallRef.current = null;
    ringingAckReceivedRef.current = false;
    sdpChunksBufferRef.current = {};
    processedSignalSeqRef.current = 0;
    processedAudioSeqRef.current = 0;
    processedCandidatesSetRef.current = new Set();
    webrtcAudioReceivingRef.current = false;
    lastInboundBytesRef.current = 0;
    nextRelayPlayTimeRef.current = 0;

    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    callStatusRef.current = "idle";
    setCallStatus("idle");
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setIsMinimized(false);
  }, [clearConnectingTimeout, clearRingingTimeout, clearRingingRetryTimers, stopAudioFallbackCapture]);

  /**
   * Helper to start the duration timer once connected.
   */
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setCallDuration(0);
    timerIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  /**
   * Initialize a new RTCPeerConnection with listeners.
   */
  const createPeerConnection = useCallback((callId) => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {}
    }

    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && callId) {
        sendCallSignalApi(
          callId,
          "candidate",
          serializeCandidate(event.candidate)
        ).catch((err) => {
          console.warn("[WebRTC] send ICE candidate error:", err?.message);
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("[WebRTC] ontrack received remote track:", event.track.kind);
      const existing = remoteStreamRef.current || new MediaStream();
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((t) => {
          if (!existing.getTracks().includes(t)) {
            existing.addTrack(t);
          }
        });
      } else if (event.track) {
        if (!existing.getTracks().includes(event.track)) {
          existing.addTrack(event.track);
        }
      }
      const updatedStream = new MediaStream(existing.getTracks());
      remoteStreamRef.current = updatedStream;
      setRemoteStream(updatedStream);
      attachRemoteStreamToAllOutputs(updatedStream);
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] connectionState changed:", pc.connectionState);
      if (pc.connectionState === "connected") {
        stopAllSounds();
        playConnectedTone();
        if (remoteStreamRef.current) {
          attachRemoteStreamToAllOutputs(remoteStreamRef.current);
        }
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        webrtcAudioReceivingRef.current = false;
        console.warn("[WebRTC] Connection lost or failed");
      }
    };

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
    }
    lastInboundBytesRef.current = 0;
    webrtcAudioReceivingRef.current = false;
    statsIntervalRef.current = setInterval(() => {
      const curPc = peerConnectionRef.current;
      if (!curPc) return;
      ensureCallAudioContext();
      if (
        persistentAudioRef.current &&
        persistentAudioRef.current.paused &&
        persistentAudioRef.current.srcObject
      ) {
        try {
          persistentAudioRef.current.play().catch(() => {});
        } catch {}
      }
      if (
        persistentVideoAudioRef.current &&
        persistentVideoAudioRef.current.paused &&
        persistentVideoAudioRef.current.srcObject
      ) {
        try {
          persistentVideoAudioRef.current.play().catch(() => {});
        } catch {}
      }
      if (typeof curPc.getStats === "function") {
        curPc
          .getStats(null)
          .then((stats) => {
            let currentBytes = 0;
            stats.forEach((report) => {
              if (
                report.type === "inbound-rtp" &&
                (report.kind === "audio" || report.mediaType === "audio")
              ) {
                currentBytes += report.bytesReceived || 0;
              }
            });
            if (currentBytes > lastInboundBytesRef.current + 200) {
              webrtcAudioReceivingRef.current = true;
            } else if (
              curPc.connectionState === "disconnected" ||
              curPc.connectionState === "failed"
            ) {
              webrtcAudioReceivingRef.current = false;
            }
            lastInboundBytesRef.current = currentBytes;
          })
          .catch(() => {});
      }
    }, 1000);

    peerConnectionRef.current = pc;
    return pc;
  }, [attachRemoteStreamToAllOutputs, ensureCallAudioContext]);

  /**
   * Get user media stream for audio and/or video.
   */
  const acquireMedia = useCallback(async (type) => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error(
        "Trình duyệt hiện tại không hỗ trợ truy cập Microphone/Camera (yêu cầu kết nối HTTPS hoặc localhost)."
      );
    }

    const attempts = [
      {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video:
          type === "video"
            ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              }
            : false,
      },
      {
        audio: true,
        video: type === "video",
      },
    ];

    let lastError = null;
    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
        localStreamRef.current = stream;
        return stream;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error("Không thể truy cập Microphone.");
  }, []);

  /**
   * Acquire media with automatic fallback (video -> audio -> receive-only).
   */
  const acquireMediaWithFallback = useCallback(
    async (requestedType) => {
      try {
        const stream = await acquireMedia(requestedType);
        return { stream, effectiveType: requestedType };
      } catch (firstErr) {
        if (requestedType === "video") {
          try {
            const audioStream = await acquireMedia("audio");
            setCallType("audio");
            callTypeRef.current = "audio";
            antdMessage.info(
              "Không tìm thấy camera, tự động chuyển sang cuộc gọi thoại."
            );
            return { stream: audioStream, effectiveType: "audio" };
          } catch {}
        }
        console.warn(
          "[WebRTC] Proceeding without local microphone/camera (receive-only fallback):",
          firstErr?.message
        );
        antdMessage.warning(
          "Không truy cập được Microphone, bạn vẫn có thể nghe cuộc gọi."
        );
        return { stream: null, effectiveType: "audio" };
      }
    },
    [acquireMedia]
  );

  const attachLocalTracksOrTransceivers = useCallback((pc, stream, type) => {
    if (stream && stream.getTracks().length > 0) {
      const existingTracks = pc
        .getSenders()
        .map((s) => s.track)
        .filter(Boolean);
      stream.getTracks().forEach((track) => {
        if (track.kind === "audio") {
          track.enabled = !isMutedRef.current;
        }
        if (!existingTracks.includes(track)) {
          pc.addTrack(track, stream);
        }
      });
      try {
        pc.getTransceivers().forEach((t) => {
          if (t.sender && t.sender.track && t.direction !== "sendrecv") {
            t.direction = "sendrecv";
          }
        });
      } catch {}
    } else {
      try {
        pc.addTransceiver("audio", { direction: "recvonly" });
        if (type === "video") {
          pc.addTransceiver("video", { direction: "recvonly" });
        }
      } catch {}
    }
  }, []);

  const drainIceCandidates = useCallback(async (pc) => {
    while (iceCandidatesQueueRef.current.length > 0) {
      const candidate = iceCandidatesQueueRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[WebRTC] addIceCandidate error:", err?.message);
      }
    }
  }, []);

  const startOutgoingRingingPhase = useCallback(() => {
    clearConnectingTimeout();
    if (callStatusRef.current === "calling") {
      callStatusRef.current = "ringingOutward";
      setCallStatus("ringingOutward");
      playOutgoingRing();

      clearRingingTimeout();
      ringingTimeoutRef.current = setTimeout(async () => {
        if (
          callStatusRef.current === "calling" ||
          callStatusRef.current === "ringingOutward"
        ) {
          console.log(
            "[WebRTC] Outgoing call timed out after 60s without answer."
          );
          antdMessage.info("Người nhận không trả lời.");
          const cur = activeCallRef.current;
          if (cur?.id) {
            try {
              await endCallApi(cur.id);
            } catch {}
          }
          cleanupCall();
        }
      }, 60000);
    }
  }, [clearConnectingTimeout, clearRingingTimeout, cleanupCall]);

  /**
   * Start an outgoing call (called from ChatHeader).
   */
  const startCall = useCallback(
    async (conversationId, type = "audio", initialConversation = null) => {
      if (!conversationId) {
        antdMessage.error("Không tìm thấy thông tin cuộc trò chuyện.");
        return;
      }

      // If running inside React Native WebView, trigger native mobile call flow
      if (typeof window !== "undefined" && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "START_CALL",
            callType: type,
            conversationId,
          })
        );
        return;
      }

      if (callStatusRef.current !== "idle") {
        antdMessage.warning("Bạn đang có một cuộc gọi khác.");
        return;
      }

      ringingAckReceivedRef.current = false;
      processedSignalSeqRef.current = 0;

      // Immediate visual feedback so the modal opens right away with receiver name & avatar
      const receiver =
        initialConversation?.participants?.find(
          (p) => String(p.id) !== String(currentUser?.id)
        ) || initialConversation?.participants?.[0];

      const tempCall = {
        conversation_id: conversationId,
        type,
        status: "calling",
        caller: currentUser
          ? {
              id: currentUser.id,
              username: currentUser.username,
              profile_name: currentUser.profile_name || currentUser.username,
              avatar_url: currentUser.avatar_url,
            }
          : null,
        receiver: receiver
          ? {
              id: receiver.id,
              username: receiver.username,
              profile_name: receiver.profile_name || receiver.username,
              avatar_url: receiver.avatar_url,
              profile_theme: receiver.profile_theme,
            }
          : null,
      };

      activeCallRef.current = tempCall;
      setActiveCall(tempCall);
      callTypeRef.current = type;
      setCallType(type);
      callStatusRef.current = "calling";
      setCallStatus("calling");

      try {
        const { effectiveType } = await acquireMediaWithFallback(type);
        type = effectiveType;

        // 10s connection timeout: If callee does not acknowledge ringing within 10s
        clearConnectingTimeout();
        clearRingingTimeout();
        connectingTimeoutRef.current = setTimeout(async () => {
          if (callStatusRef.current === "calling") {
            console.log(
              "[WebRTC] Callee unreachable / connect timeout after 10s."
            );
            antdMessage.warning("Không thể kết nối đến người kia.");
            const cur = activeCallRef.current;
            if (cur?.id) {
              try {
                await endCallApi(cur.id);
              } catch {}
            }
            cleanupCall();
          }
        }, 10000);

        // Call backend API to initiate call session
        const res = await initiateCallApi(conversationId, type);
        const callData = res?.data?.call;

        if (!callData) {
          throw new Error("Không nhận được dữ liệu cuộc gọi từ máy chủ.");
        }

        activeCallRef.current = callData;
        setActiveCall(callData);

        if (ringingAckReceivedRef.current) {
          startOutgoingRingingPhase();
        }
      } catch (err) {
        console.error("[startCall] error:", err);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Không thể thực hiện cuộc gọi. Vui lòng thử lại.";
        antdMessage.error(errMsg);
        cleanupCall();
      }
    },
    [
      currentUser,
      acquireMediaWithFallback,
      clearConnectingTimeout,
      clearRingingTimeout,
      startOutgoingRingingPhase,
      cleanupCall,
    ]
  );

  /**
   * Accept an incoming call.
   */
  const answerCall = useCallback(async () => {
    const current = activeCallRef.current;
    if (!current || callStatusRef.current !== "ringing") return;

    try {
      clearRingingTimeout();
      clearRingingRetryTimers();
      stopAllSounds();
      const requestedType = current.type || "audio";

      // 1. Acquire local media (with graceful fallback)
      ensureCallAudioContext();
      const { stream, effectiveType } =
        await acquireMediaWithFallback(requestedType);

      // 2. Create peer connection & attach tracks BEFORE calling answerCallApi
      // so we are ready the exact millisecond Caller sends the SDP offer!
      const pc = createPeerConnection(current.id);
      attachLocalTracksOrTransceivers(pc, stream, effectiveType);
      startAudioFallbackCapture(stream, current.id);

      callStatusRef.current = "connected";
      setCallStatus("connected");
      startTimer();

      // 3. If an offer already arrived early, answer it immediately
      if (pendingOfferRef.current) {
        const earlyOffer = pendingOfferRef.current;
        pendingOfferRef.current = null;
        offerProcessedForCallRef.current = String(current.id);
        await pc.setRemoteDescription(new RTCSessionDescription(earlyOffer));
        await drainIceCandidates(pc);
        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: effectiveType === "video",
        });
        answer.sdp = enhanceSdpOpus(answer.sdp);
        await pc.setLocalDescription(answer);
        await sendCallSignalApi(
          current.id,
          "answer",
          serializeSdp(pc.localDescription)
        );
      }

      // 4. Inform API that we answered (triggers .call.answered on Caller)
      await answerCallApi(current.id);
    } catch (err) {
      console.error("[answerCall] error:", err);
      cleanupCall();
    }
  }, [
    ensureCallAudioContext,
    acquireMediaWithFallback,
    createPeerConnection,
    attachLocalTracksOrTransceivers,
    startAudioFallbackCapture,
    drainIceCandidates,
    clearRingingTimeout,
    clearRingingRetryTimers,
    startTimer,
    cleanupCall,
  ]);

  /**
   * Reject an incoming call.
   */
  const rejectCall = useCallback(
    async (reason = "rejected") => {
      const current = activeCallRef.current;
      if (!current) return;

      try {
        clearRingingRetryTimers();
        await rejectCallApi(current.id, reason);
      } catch (err) {
        console.warn("[rejectCall] error:", err?.message);
      } finally {
        cleanupCall();
      }
    },
    [clearRingingRetryTimers, cleanupCall]
  );

  /**
   * End an ongoing call.
   */
  const endCall = useCallback(async () => {
    const current = activeCallRef.current;
    if (!current) {
      cleanupCall();
      return;
    }

    try {
      playEndTone();
      if (current.id) {
        await endCallApi(current.id);
      }
    } catch (err) {
      console.warn("[endCall] error:", err?.message);
    } finally {
      cleanupCall();
    }
  }, [cleanupCall]);

  /**
   * Toggle microphone mute.
   */
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  /**
   * Toggle camera video on/off.
   */
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  }, []);

  /**
   * Toggle screen sharing.
   */
  const toggleScreenShare = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      const originalTrack = originalVideoTrackRef.current;
      if (originalTrack) {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(originalTrack);
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        const currentVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (currentVideoTrack) {
          originalVideoTrackRef.current = currentVideoTrack;
        }

        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack);
        } else {
          pc.addTrack(screenTrack, screenStream);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("[WebRTC] Screen share cancelled or failed:", err);
      }
    }
  }, [isScreenSharing]);

  /**
   * Toggle minimizing the active call window to Picture-in-Picture.
   */
  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // --- Realtime WebSocket Event Handlers ---

  /**
   * When caller receives '.call.answered':
   * Caller initiates the WebRTC offer.
   */
  const handleCallAnswered = useCallback(
    async (data) => {
      const callData = data?.call;
      if (!callData) return;

      const current = activeCallRef.current;
      if (
        !current ||
        (current.id && String(current.id) !== String(callData.id))
      ) {
        return;
      }

      // If we are the callee (already answered), ignore our own answered broadcast
      if (String(callData.caller?.id) !== String(currentUser?.id)) {
        return;
      }

      // Deduplicate in case received on both userChannel, conversationChannel, and HTTP sync
      if (offerCreatedForCallRef.current === String(callData.id)) {
        return;
      }
      offerCreatedForCallRef.current = String(callData.id);

      console.log("[WebRTC] Callee answered the call. Creating offer...");
      clearConnectingTimeout();
      clearRingingTimeout();
      stopAllSounds();

      try {
        ensureCallAudioContext();
        const pc = createPeerConnection(callData.id);

        attachLocalTracksOrTransceivers(
          pc,
          localStreamRef.current,
          callTypeRef.current
        );
        startAudioFallbackCapture(localStreamRef.current, callData.id);

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callTypeRef.current === "video",
        });
        offer.sdp = enhanceSdpOpus(offer.sdp);
        await pc.setLocalDescription(offer);

        await sendCallSignalApi(
          callData.id,
          "offer",
          serializeSdp(pc.localDescription)
        );

        callStatusRef.current = "connected";
        setCallStatus("connected");
        startTimer();
      } catch (err) {
        console.error("[WebRTC] Error creating offer:", err);
        cleanupCall();
      }
    },
    [
      currentUser?.id,
      clearConnectingTimeout,
      clearRingingTimeout,
      ensureCallAudioContext,
      createPeerConnection,
      attachLocalTracksOrTransceivers,
      startAudioFallbackCapture,
      startTimer,
      cleanupCall,
    ]
  );

  /**
   * When someone rejects or declines a call.
   */
  const handleCallRejected = useCallback(
    (data) => {
      const current = activeCallRef.current;
      if (
        !current ||
        (current.id && String(current.id) !== String(data?.call_id))
      ) {
        return;
      }

      stopAllSounds();
      playEndTone();

      if (data?.reason === "busy") {
        antdMessage.info("Người nhận hiện đang bận.");
      } else {
        antdMessage.info("Cuộc gọi đã bị từ chối.");
      }
      cleanupCall();
    },
    [cleanupCall]
  );

  /**
   * When a call ends.
   */
  const handleCallEnded = useCallback(
    (data) => {
      const callData = data?.call;
      const current = activeCallRef.current;
      if (
        !current ||
        (current.id && callData && String(current.id) !== String(callData.id))
      ) {
        return;
      }

      stopAllSounds();
      playEndTone();
      antdMessage.info("Cuộc gọi đã kết thúc.");
      cleanupCall();
    },
    [cleanupCall]
  );

  /**
   * Process WebRTC signaling packets (Offer, Answer, ICE Candidates, Chunked SDP).
   */
  const handleCallSignaled = useCallback(
    async (data) => {
      const current = activeCallRef.current;
      if (!current) return;
      if (
        current.id &&
        data?.call_id &&
        String(current.id) !== String(data.call_id)
      ) {
        return;
      }
      if (
        data?.conversation_id &&
        current.conversation_id &&
        String(data.conversation_id) !== String(current.conversation_id)
      ) {
        return;
      }
      if (String(data?.sender_id) === String(currentUser?.id)) return;

      const pc = peerConnectionRef.current;
      let { type, payload } = data;
      const callIdKey = String(data?.call_id || current.id || "");

      try {
        if (type === "sdp_chunk" && payload) {
          const {
            chunk_group_id,
            chunk_index,
            total_chunks,
            original_type,
            chunk,
          } = payload;
          if (!chunk_group_id || typeof chunk_index !== "number") return;
          if (!sdpChunksBufferRef.current[chunk_group_id]) {
            sdpChunksBufferRef.current[chunk_group_id] = {
              total: total_chunks,
              parts: {},
            };
          }
          sdpChunksBufferRef.current[chunk_group_id].parts[chunk_index] = chunk;
          const group = sdpChunksBufferRef.current[chunk_group_id];
          if (Object.keys(group.parts).length < group.total) {
            return;
          }
          let fullJson = "";
          for (let i = 0; i < group.total; i++) {
            fullJson += group.parts[i] || "";
          }
          delete sdpChunksBufferRef.current[chunk_group_id];
          type = original_type;
          payload = JSON.parse(fullJson);
        }

        if (type === "ringing") {
          console.log("[WebRTC] Callee received call and started ringing.");
          ringingAckReceivedRef.current = true;
          if (callStatusRef.current === "calling") {
            startOutgoingRingingPhase();
          }
          return;
        } else if (type === "offer") {
          if (offerProcessedForCallRef.current === callIdKey) {
            return;
          }
          console.log("[WebRTC] Received remote offer.");
          if (!pc) {
            pendingOfferRef.current = payload;
            return;
          }

          offerProcessedForCallRef.current = callIdKey;
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          await drainIceCandidates(pc);

          const answer = await pc.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callTypeRef.current === "video",
          });
          answer.sdp = enhanceSdpOpus(answer.sdp);
          await pc.setLocalDescription(answer);

          await sendCallSignalApi(
            current.id || data.call_id,
            "answer",
            serializeSdp(pc.localDescription)
          );
        } else if (type === "answer") {
          if (answerProcessedForCallRef.current === callIdKey) {
            return;
          }
          if (!pc) return;
          if (pc.signalingState !== "have-local-offer") return;

          answerProcessedForCallRef.current = callIdKey;
          console.log(
            "[WebRTC] Received remote answer. Setting remote description..."
          );

          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          await drainIceCandidates(pc);
        } else if (type === "candidate") {
          const normCand = serializeCandidate(payload);
          if (!normCand || !normCand.candidate) return;
          const candKey = normCand.candidate;
          if (processedCandidatesSetRef.current.has(candKey)) return;
          processedCandidatesSetRef.current.add(candKey);

          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(normCand));
            } catch {}
          } else {
            iceCandidatesQueueRef.current.push(normCand);
          }
        } else if (type === "audio_chunk" && payload) {
          playIncomingAudioChunk(payload);
        }
      } catch (err) {
        console.error("[WebRTC] Signaling handling error:", err);
      }
    },
    [
      currentUser?.id,
      startOutgoingRingingPhase,
      drainIceCandidates,
      playIncomingAudioChunk,
    ]
  );

  /**
   * Handle incoming call notification from user's private channel.
   */
  const handleIncomingCall = useCallback(
    (data) => {
      const callData = data?.call;
      if (!callData) return;

      // Don't ring if we are the caller
      if (String(callData?.caller?.id) === String(currentUser?.id)) return;

      // If running inside React Native WebView, let native mobile CallContext handle incoming calls
      if (typeof window !== "undefined" && window.ReactNativeWebView) {
        return;
      }

      if (callStatusRef.current !== "idle") {
        if (String(activeCallRef.current?.id) !== String(callData.id)) {
          rejectCallApi(callData.id, "busy").catch(() => {});
        }
        return;
      }

      console.log("[WebRTC] Incoming call received:", callData);
      processedSignalSeqRef.current = 0;
      activeCallRef.current = callData;
      setActiveCall(callData);
      callTypeRef.current = callData.type || "audio";
      setCallType(callData.type || "audio");
      callStatusRef.current = "ringing";
      setCallStatus("ringing");

      // Acknowledge to caller immediately + retry at 1.5s & 3.5s so Caller never misses it
      sendCallSignalApi(callData.id, "ringing", {}).catch(() => {});
      clearRingingRetryTimers();
      ringingRetryTimersRef.current = [
        setTimeout(() => {
          if (
            callStatusRef.current === "ringing" &&
            String(activeCallRef.current?.id) === String(callData.id)
          ) {
            sendCallSignalApi(callData.id, "ringing", {}).catch(() => {});
          }
        }, 1500),
        setTimeout(() => {
          if (
            callStatusRef.current === "ringing" &&
            String(activeCallRef.current?.id) === String(callData.id)
          ) {
            sendCallSignalApi(callData.id, "ringing", {}).catch(() => {});
          }
        }, 3500),
      ];

      // Start incoming ringtone
      playIncomingRing();

      // Auto-disconnect callee after 60s if not answered
      clearRingingTimeout();
      ringingTimeoutRef.current = setTimeout(async () => {
        if (activeCallRef.current && callStatusRef.current === "ringing") {
          console.log("[WebRTC] Incoming call ringing timed out after 60s.");
          try {
            await rejectCallApi(callData.id, "missed");
          } catch {}
          cleanupCall();
        }
      }, 60000);
    },
    [
      currentUser?.id,
      clearRingingRetryTimers,
      clearRingingTimeout,
      cleanupCall,
    ]
  );

  // Continuous HTTP signal & call state sync while a call is active
  // (guarantees 100% signal delivery even if WebSocket drops or SDP exceeds Reverb limits)
  useEffect(() => {
    if (!loggedIn || callStatus === "idle") return;

    let cancelled = false;
    const syncCallSignals = async () => {
      const cur = activeCallRef.current;
      if (!cur?.id || cancelled) return;

      try {
        const res = await getActiveCall(cur.id);
        if (cancelled) return;
        const remoteCall = res?.data?.call;
        const signals = res?.data?.signals;
        const audioChunks = res?.data?.audio_chunks;

        if (Array.isArray(signals)) {
          for (const sig of signals) {
            if (sig.seq && sig.seq > processedSignalSeqRef.current) {
              processedSignalSeqRef.current = sig.seq;
            }
            if (String(sig.sender_id) !== String(currentUser?.id)) {
              await handleCallSignaled(sig);
            }
          }
        }

        if (Array.isArray(audioChunks)) {
          for (const chunk of audioChunks) {
            if (chunk.aseq && chunk.aseq <= processedAudioSeqRef.current) {
              continue;
            }
            if (chunk.aseq) {
              processedAudioSeqRef.current = chunk.aseq;
            }
            if (
              String(chunk.sender_id) !== String(currentUser?.id) &&
              chunk.payload
            ) {
              playIncomingAudioChunk(chunk.payload);
            }
          }
        }

        if (remoteCall && String(remoteCall.id) === String(cur.id)) {
          if (
            remoteCall.status === "accepted" &&
            String(remoteCall.caller?.id) === String(currentUser?.id)
          ) {
            await handleCallAnswered({ call: remoteCall });
          } else if (
            remoteCall.status === "rejected" ||
            remoteCall.status === "busy"
          ) {
            handleCallRejected({
              call_id: remoteCall.id,
              reason: remoteCall.end_reason || remoteCall.status,
            });
          } else if (
            remoteCall.status === "ended" ||
            remoteCall.status === "cancelled" ||
            remoteCall.status === "missed"
          ) {
            handleCallEnded({ call: remoteCall });
          }
        }
      } catch {}
    };

    const interval = setInterval(syncCallSignals, 1200);
    syncCallSignals();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    loggedIn,
    callStatus,
    activeCall?.id,
    currentUser?.id,
    handleCallSignaled,
    playIncomingAudioChunk,
    handleCallAnswered,
    handleCallRejected,
    handleCallEnded,
  ]);

  const checkActiveCalls = useCallback(async () => {
    if (!loggedIn || callStatusRef.current !== "idle") return;
    try {
      const res = await getActiveCall();
      const call = res?.data?.call;
      if (
        call &&
        call.status === "ringing" &&
        String(call.caller?.id) !== String(currentUser?.id)
      ) {
        handleIncomingCall({ call });
      }
    } catch {}
  }, [loggedIn, currentUser?.id, handleIncomingCall]);

  // Hook Echo reconnection and window online/visibility to recover incoming calls
  useEffect(() => {
    if (!loggedIn) return;

    checkActiveCalls();

    const echo = getEcho();
    const handleConnected = () => {
      checkActiveCalls();
    };

    if (echo?.connector?.pusher?.connection) {
      echo.connector.pusher.connection.bind("connected", handleConnected);
    }

    const handleOnline = () => checkActiveCalls();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkActiveCalls();
    };

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (echo?.connector?.pusher?.connection) {
        echo.connector.pusher.connection.unbind("connected", handleConnected);
      }
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loggedIn, checkActiveCalls]);

  // Subscribe to user's personal private channel for incoming calls & direct signaling
  useEffect(() => {
    if (!loggedIn || !currentUser?.id) return;

    const echo = getEcho();
    if (!echo) return;

    const userChannel = echo.private(`App.Models.User.${currentUser.id}`);
    userChannel
      .listen(".call.initiated", handleIncomingCall)
      .listen(".call.answered", handleCallAnswered)
      .listen(".call.rejected", handleCallRejected)
      .listen(".call.ended", handleCallEnded)
      .listen(".call.signaled", handleCallSignaled);

    return () => {
      userChannel
        .stopListening(".call.initiated")
        .stopListening(".call.answered")
        .stopListening(".call.rejected")
        .stopListening(".call.ended")
        .stopListening(".call.signaled");
    };
  }, [
    loggedIn,
    currentUser?.id,
    handleIncomingCall,
    handleCallAnswered,
    handleCallRejected,
    handleCallEnded,
    handleCallSignaled,
  ]);

  // Subscribe to active call's conversation presence channel for call signaling and lifecycle
  useEffect(() => {
    if (!loggedIn || !activeCall?.conversation_id) return;

    const echo = getEcho();
    if (!echo) return;

    const conversationChannel = echo.join(`chat.${activeCall.conversation_id}`);

    conversationChannel
      .listen(".call.answered", handleCallAnswered)
      .listen(".call.rejected", handleCallRejected)
      .listen(".call.ended", handleCallEnded)
      .listen(".call.signaled", handleCallSignaled);

    return () => {
      conversationChannel
        .stopListening(".call.answered")
        .stopListening(".call.rejected")
        .stopListening(".call.ended")
        .stopListening(".call.signaled");
    };
  }, [
    loggedIn,
    activeCall?.conversation_id,
    handleCallAnswered,
    handleCallRejected,
    handleCallEnded,
    handleCallSignaled,
  ]);

  // Cleanup on unmount or logout
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  const value = {
    callStatus,
    callType,
    activeCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isMinimized,
    callDuration,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleMinimize,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      <audio
        ref={persistentAudioRef}
        autoPlay
        playsInline
        style={{
          position: "fixed",
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0.01,
          pointerEvents: "none",
        }}
      />
      <video
        ref={persistentVideoAudioRef}
        autoPlay
        playsInline
        style={{
          position: "fixed",
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0.01,
          pointerEvents: "none",
        }}
      />
    </CallContext.Provider>
  );
};

export default CallProvider;
