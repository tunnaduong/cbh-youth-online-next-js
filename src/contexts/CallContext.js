"use client";

import { createContext } from "react";

const CallContext = createContext({
  // State
  callStatus: "idle", // 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'
  callType: "audio", // 'audio' | 'video'
  activeCall: null, // Call object { id, conversation_id, caller, receiver, ... }
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  isMinimized: false,
  callDuration: 0,

  // Actions
  startCall: () => {},
  answerCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
  toggleVideo: () => {},
  toggleScreenShare: () => {},
  toggleMinimize: () => {},
});

export default CallContext;
