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
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

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

  // Fetch STUN/TURN servers on mount
  useEffect(() => {
    if (!loggedIn) return;
    getIceServers()
      .then((res) => {
        if (res?.data?.ice_servers && Array.isArray(res.data.ice_servers)) {
          const merged = [...res.data.ice_servers];
          const hasTurn = merged.some((s) =>
            JSON.stringify(s.urls || "").includes("turn:")
          );
          if (!hasTurn) {
            merged.push(DEFAULT_ICE_SERVERS[DEFAULT_ICE_SERVERS.length - 1]);
          }
          iceServersRef.current = merged;
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
  }, [clearConnectingTimeout, clearRingingTimeout, clearRingingRetryTimers]);

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
        sendCallSignalApi(callId, "candidate", event.candidate).catch((err) => {
          console.warn("[WebRTC] send ICE candidate error:", err?.message);
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("[WebRTC] ontrack received remote track:", event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        remoteStreamRef.current = event.streams[0];
      } else {
        const existing = remoteStreamRef.current || new MediaStream();
        existing.addTrack(event.track);
        const updatedStream = new MediaStream(existing.getTracks());
        setRemoteStream(updatedStream);
        remoteStreamRef.current = updatedStream;
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] connectionState changed:", pc.connectionState);
      if (pc.connectionState === "connected") {
        stopAllSounds();
        playConnectedTone();
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        console.warn("[WebRTC] Connection lost or failed");
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

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

    const constraints = {
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
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setLocalStream(stream);
    localStreamRef.current = stream;
    return stream;
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
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
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
    if (
      callStatusRef.current === "calling" ||
      callStatusRef.current === "ringingOutward"
    ) {
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
      const { stream, effectiveType } =
        await acquireMediaWithFallback(requestedType);

      // 2. Create peer connection & attach tracks BEFORE calling answerCallApi
      // so we are ready the exact millisecond Caller sends the SDP offer!
      const pc = createPeerConnection(current.id);
      attachLocalTracksOrTransceivers(pc, stream, effectiveType);

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
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendCallSignalApi(current.id, "answer", answer);
      }

      // 4. Inform API that we answered (triggers .call.answered on Caller)
      await answerCallApi(current.id);
    } catch (err) {
      console.error("[answerCall] error:", err);
      cleanupCall();
    }
  }, [
    acquireMediaWithFallback,
    createPeerConnection,
    attachLocalTracksOrTransceivers,
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
      // Revert to original camera video track
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

        // Store current webcam track to restore later
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
          // Revert when user stops sharing via browser UI
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

      // Deduplicate in case received on both userChannel and conversationChannel
      if (offerCreatedForCallRef.current === String(callData.id)) {
        return;
      }
      offerCreatedForCallRef.current = String(callData.id);

      console.log("[WebRTC] Callee answered the call. Creating offer...");
      clearConnectingTimeout();
      clearRingingTimeout();
      stopAllSounds();

      try {
        const pc = createPeerConnection(callData.id);

        attachLocalTracksOrTransceivers(
          pc,
          localStreamRef.current,
          callTypeRef.current
        );

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callTypeRef.current === "video",
        });
        await pc.setLocalDescription(offer);

        await sendCallSignalApi(callData.id, "offer", offer);

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
      createPeerConnection,
      attachLocalTracksOrTransceivers,
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
   * Process WebRTC signaling packets (Offer, Answer, ICE Candidates).
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
      const { type, payload } = data;
      const callIdKey = String(data?.call_id || current.id || "");

      try {
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
            // Queue offer until answerCall initializes pc
            pendingOfferRef.current = payload;
            return;
          }

          offerProcessedForCallRef.current = callIdKey;
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          await drainIceCandidates(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          await sendCallSignalApi(current.id || data.call_id, "answer", answer);
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
          if (!payload) return;
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload));
            } catch {}
          } else {
            iceCandidatesQueueRef.current.push(payload);
          }
        }
      } catch (err) {
        console.error("[WebRTC] Signaling handling error:", err);
      }
    },
    [currentUser?.id, startOutgoingRingingPhase, drainIceCandidates]
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

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export default CallProvider;
