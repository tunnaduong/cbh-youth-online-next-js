"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import CallContext from "../CallContext";
import { useAuthContext } from "../Support";
import { getEcho } from "@/lib/echo";
import {
  getIceServers,
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

export const CallProvider = ({ children }) => {
  const { loggedIn, currentUser } = useAuthContext();

  const [callStatus, setCallStatus] = useState("idle"); // 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'
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
  const iceCandidatesQueueRef = useRef([]);

  const clearRingingTimeout = useCallback(() => {
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
  }, []);
  const iceServersRef = useRef([{ urls: "stun:stun.l.google.com:19302" }]);
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
          iceServersRef.current = res.data.ice_servers;
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
    clearRingingTimeout();

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

    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setCallStatus("idle");
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setIsMinimized(false);
  }, []);

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
        const inboundStream = new MediaStream([event.track]);
        setRemoteStream(inboundStream);
        remoteStreamRef.current = inboundStream;
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
    try {
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
    } catch (err) {
      console.error("[WebRTC] Error acquiring media:", err);
      let errorText =
        err?.message || "Không thể truy cập Microphone hoặc Camera của bạn.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorText = "Bạn cần cấp quyền truy cập Microphone và Camera trong trình duyệt.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorText = "Không tìm thấy thiết bị Microphone hoặc Camera phù hợp.";
      }
      antdMessage.error(errorText);
      throw err;
    }
  }, []);

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

      // Immediate visual feedback so the modal opens right away with receiver name & avatar
      const receiver = initialConversation?.participants?.find(
        (p) => String(p.id) !== String(currentUser?.id)
      ) || initialConversation?.participants?.[0];

      setActiveCall({
        conversation_id: conversationId,
        type,
        status: "calling",
        receiver: receiver
          ? {
              id: receiver.id,
              username: receiver.username,
              profile_name: receiver.profile_name || receiver.username,
              avatar_url: receiver.avatar_url,
              profile_theme: receiver.profile_theme,
            }
          : null,
      });
      setCallType(type);
      setCallStatus("calling");

      try {
        // Request user media first (with video -> audio fallback if no webcam found)
        let stream;
        try {
          stream = await acquireMedia(type);
        } catch (mediaErr) {
          if (type === "video") {
            try {
              stream = await acquireMedia("audio");
              type = "audio";
              setCallType("audio");
              antdMessage.info("Không tìm thấy camera, tự động chuyển sang cuộc gọi thoại.");
            } catch (audioErr) {
              throw mediaErr;
            }
          } else {
            throw mediaErr;
          }
        }

        // Call backend API to initiate call session
        const res = await initiateCallApi(conversationId, type);
        const callData = res?.data?.call;

        if (!callData) {
          throw new Error("Không nhận được dữ liệu cuộc gọi từ máy chủ.");
        }

        setActiveCall(callData);

        // Play outgoing ringing tone
        playOutgoingRing();

        // Auto-disconnect caller after 60s if receiver does not answer
        clearRingingTimeout();
        ringingTimeoutRef.current = setTimeout(async () => {
          if (callStatusRef.current === "calling") {
            console.log("[WebRTC] Outgoing call timed out after 60s without answer.");
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
    [currentUser, acquireMedia, cleanupCall]
  );

  /**
   * Accept an incoming call.
   */
  const answerCall = useCallback(async () => {
    const current = activeCallRef.current;
    if (!current || callStatusRef.current !== "ringing") return;

    try {
      clearRingingTimeout();
      stopAllSounds();
      const type = current.type || "audio";

      // Acquire local media
      const stream = await acquireMedia(type);

      // Inform API that we answered
      await answerCallApi(current.id);

      // Create peer connection and attach local tracks
      const pc = createPeerConnection(current.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      setCallStatus("connected");
      startTimer();
    } catch (err) {
      console.error("[answerCall] error:", err);
      cleanupCall();
    }
  }, [acquireMedia, createPeerConnection, startTimer, cleanupCall]);

  /**
   * Reject an incoming call.
   */
  const rejectCall = useCallback(
    async (reason = "rejected") => {
      const current = activeCallRef.current;
      if (!current) return;

      try {
        await rejectCallApi(current.id, reason);
      } catch (err) {
        console.warn("[rejectCall] error:", err?.message);
      } finally {
        cleanupCall();
      }
    },
    [cleanupCall]
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
      await endCallApi(current.id);
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
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
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

        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
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
      if (!current || String(current.id) !== String(callData.id)) return;

      console.log("[WebRTC] Callee answered the call. Creating offer...");
      clearRingingTimeout();
      stopAllSounds();

      try {
        const pc = createPeerConnection(current.id);

        // Add local tracks to peer connection
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current);
          });
        }

        // Create and set local offer
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callTypeRef.current === "video",
        });
        await pc.setLocalDescription(offer);

        // Send offer to callee via signaling API
        await sendCallSignalApi(current.id, "offer", offer);

        setCallStatus("connected");
        startTimer();
      } catch (err) {
        console.error("[WebRTC] Error creating offer:", err);
        cleanupCall();
      }
    },
    [createPeerConnection, startTimer, cleanupCall]
  );

  /**
   * When someone rejects or declines a call.
   */
  const handleCallRejected = useCallback(
    (data) => {
      const current = activeCallRef.current;
      if (!current || String(current.id) !== String(data?.call_id)) return;

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
      if (!current || (callData && String(current.id) !== String(callData.id))) return;

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
      if (!current || String(current.id) !== String(data?.call_id)) return;
      if (String(data?.sender_id) === String(currentUser?.id)) return;

      const pc = peerConnectionRef.current;
      const { type, payload } = data;

      try {
        if (type === "offer") {
          console.log("[WebRTC] Received remote offer. Creating answer...");
          if (!pc) return;

          await pc.setRemoteDescription(new RTCSessionDescription(payload));

          // Process queued ICE candidates
          while (iceCandidatesQueueRef.current.length > 0) {
            const candidate = iceCandidatesQueueRef.current.shift();
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          await sendCallSignalApi(current.id, "answer", answer);
        } else if (type === "answer") {
          console.log("[WebRTC] Received remote answer. Setting remote description...");
          if (!pc) return;

          await pc.setRemoteDescription(new RTCSessionDescription(payload));

          // Process queued ICE candidates
          while (iceCandidatesQueueRef.current.length > 0) {
            const candidate = iceCandidatesQueueRef.current.shift();
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } else if (type === "candidate") {
          if (!payload) return;
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(payload));
          } else {
            // Queue until remote description is set
            iceCandidatesQueueRef.current.push(payload);
          }
        }
      } catch (err) {
        console.error("[WebRTC] Signaling handling error:", err);
      }
    },
    [currentUser?.id]
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

      // If user is already busy in another call, automatically reject as busy
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
        rejectCallApi(callData.id, "busy").catch(() => {});
        return;
      }

      console.log("[WebRTC] Incoming call received:", callData);
      setActiveCall(callData);
      setCallType(callData.type || "audio");
      setCallStatus("ringing");

      // Start melodic incoming ringtone
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
    [currentUser?.id]
  );

  // Subscribe to user's personal private channel for incoming calls
  useEffect(() => {
    if (!loggedIn || !currentUser?.id) return;

    const echo = getEcho();
    if (!echo) return;

    const userChannel = echo.private(`App.Models.User.${currentUser.id}`);
    userChannel.listen(".call.initiated", handleIncomingCall);

    return () => {
      userChannel.stopListening(".call.initiated");
    };
  }, [loggedIn, currentUser?.id, handleIncomingCall]);

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
