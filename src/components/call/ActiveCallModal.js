"use client";

import { useEffect, useRef } from "react";
import { useCallContext, useAuthContext } from "@/contexts/Support";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AvatarFrameWrap from "@/components/profile/AvatarFrameWrap";
import UserName from "@/components/profile/UserName";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  PhoneOff,
  Minimize2,
  Maximize2,
} from "lucide-react";

function formatSeconds(secs) {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ActiveCallModal() {
  const {
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
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleMinimize,
  } = useCallContext();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const { currentUser } = useAuthContext();

  // Remote audio is played by CallProvider's single <audio> element; a second
  // one here doubled the voice. The remote <video> below stays muted.
  // Attach local media stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isMinimized, callStatus]);

  // Attach remote media stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isMinimized, callStatus]);

  const isCaller =
    Boolean(
      currentUser?.id &&
        activeCall?.caller?.id &&
        String(activeCall.caller.id) === String(currentUser.id)
    ) ||
    Boolean(
      currentUser?.username &&
        activeCall?.caller?.username &&
        activeCall.caller.username === currentUser.username
    ) ||
    Boolean(!activeCall?.caller && activeCall?.receiver);

  // Never render ActiveCallModal for incoming ringing calls (IncomingCallModal handles those)
  if (!activeCall) {
    return null;
  }
  if (callStatus === "ringing" && !isCaller) {
    return null;
  }
  if (
    callStatus !== "calling" &&
    callStatus !== "ringing" &&
    callStatus !== "ringingOutward" &&
    callStatus !== "connected"
  ) {
    return null;
  }

  const isConnected = callStatus === "connected";
  const isVideo = callType === "video";
  const otherUser = isCaller
    ? activeCall?.receiver || activeCall?.caller
    : activeCall?.caller || activeCall?.receiver;
  const otherName =
    otherUser?.profile_name || otherUser?.username || "Người dùng";
  const avatarUrl = otherUser?.avatar_url;

  // --- MINIMIZED FLOATING PIP WIDGET ---
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-6 z-[99999] flex items-center gap-3 bg-gray-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-gray-700 animate-in slide-in-from-bottom-5">
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-neutral-800 flex items-center justify-center">
          {isVideo && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <AvatarFrameWrap theme={otherUser?.profile_theme}>
              <Avatar className="w-12 h-12">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={otherName} />
                ) : (
                  <AvatarFallback className="bg-primary-500 text-white font-bold">
                    {otherName[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                )}
              </Avatar>
            </AvatarFrameWrap>
          )}
        </div>

        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-xs font-semibold truncate max-w-[120px]">
            {otherName}
          </span>
          <span className="text-xs text-green-400 font-mono">
            {isConnected
              ? formatSeconds(callDuration)
              : callStatus === "ringing" || callStatus === "ringingOutward"
                ? "Đang đổ chuông..."
                : "Đang kết nối..."}
          </span>
        </div>

        {/* Maximize Button */}
        <button
          onClick={toggleMinimize}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-300 hover:text-white"
          title="Mở rộng"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Quick End Button */}
        <button
          onClick={endCall}
          className="p-2 bg-red-600 hover:bg-red-700 rounded-xl transition-colors text-white"
          title="Kết thúc cuộc gọi"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // --- FULL SCREEN / MODAL VIEW ---
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[720px] rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col justify-between">
        {/* Top Header Bar */}
        <div className="relative z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <AvatarFrameWrap theme={otherUser?.profile_theme}>
              <Avatar className="w-10 h-10 border border-white/20">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={otherName} />
                ) : (
                  <AvatarFallback className="bg-primary-500 text-white font-bold">
                    {otherName[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                )}
              </Avatar>
            </AvatarFrameWrap>

            <div className="flex flex-col text-white">
              <span className="font-semibold text-sm flex items-center gap-1.5">
                <UserName
                  name={otherName}
                  theme={otherUser?.profile_theme}
                  variant="compact"
                />
              </span>
              <span className="text-xs text-neutral-300 font-mono flex items-center gap-1">
                {isConnected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>{formatSeconds(callDuration)}</span>
                  </>
                ) : (
                  <span className="text-amber-400 animate-pulse">
                    {callStatus === "ringing" || callStatus === "ringingOutward"
                      ? "Đang đổ chuông..."
                      : "Đang kết nối..."}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Minimize Button */}
          <button
            onClick={toggleMinimize}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Thu nhỏ để lướt diễn đàn"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Main Stage View */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
          {/* VIDEO MODE */}
          {isVideo ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* Remote Video Stream */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-white">
                  <div className="relative flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary-500/20 animate-ping absolute" />
                    <AvatarFrameWrap theme={otherUser?.profile_theme}>
                      <Avatar className="w-24 h-24 border-2 border-primary-500 shadow-xl">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt={otherName} />
                        ) : (
                          <AvatarFallback className="bg-primary-500 text-white text-3xl font-bold">
                            {otherName[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </AvatarFrameWrap>
                  </div>
                  <p className="text-sm text-neutral-400">
                    {isConnected
                      ? "Đang tải luồng video..."
                      : "Đang chờ đối phương trả lời..."}
                  </p>
                </div>
              )}

              {/* Local Video Thumbnail (Picture-in-Picture) */}
              {localStream && (
                <div className="absolute top-4 right-4 z-20 w-32 sm:w-44 aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-neutral-800">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
                  />
                  {isVideoOff && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-neutral-400">
                      <VideoOff className="w-6 h-6" />
                      <span className="text-[10px] mt-1">Đã tắt Camera</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
                    Bạn
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* AUDIO / VOICE MODE */
            <div className="flex flex-col items-center justify-center gap-6 text-white p-6">
              <div className="relative flex items-center justify-center my-4">
                {isConnected ? (
                  <>
                    <div className="w-36 h-36 rounded-full bg-primary-500/10 animate-ping absolute" />
                    <div className="w-44 h-44 rounded-full bg-primary-500/5 absolute" />
                  </>
                ) : (
                  <div className="w-36 h-36 rounded-full bg-amber-500/20 animate-ping absolute" />
                )}
                <AvatarFrameWrap theme={otherUser?.profile_theme}>
                  <Avatar className="w-32 h-32 border-4 border-primary-500 shadow-2xl">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={otherName} />
                    ) : (
                      <AvatarFallback className="bg-primary-500 text-white text-4xl font-bold">
                        {otherName[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </AvatarFrameWrap>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold">{otherName}</h2>
                <p className="text-sm text-neutral-400 mt-1">
                  {isConnected ? (
                    <span className="text-primary-400 font-mono text-base">
                      {formatSeconds(callDuration)}
                    </span>
                  ) : callStatus === "ringing" || callStatus === "ringingOutward" ? (
                    <span className="text-primary-400 font-medium animate-pulse">
                      Đang đổ chuông...
                    </span>
                  ) : (
                    "Đang kết nối..."
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls Bar */}
        <div className="relative z-20 flex items-center justify-center gap-4 sm:gap-6 py-6 px-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          {/* Mute Mic Button */}
          <button
            onClick={toggleMute}
            className={`p-3.5 sm:p-4 rounded-full transition-all active:scale-95 shadow-lg ${
              isMuted
                ? "bg-red-500/90 hover:bg-red-600 text-white"
                : "bg-white/15 hover:bg-white/25 text-white"
            }`}
            title={isMuted ? "Bật Micro" : "Tắt Micro"}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          {/* Toggle Video Camera Button */}
          {isVideo && (
            <button
              onClick={toggleVideo}
              className={`p-3.5 sm:p-4 rounded-full transition-all active:scale-95 shadow-lg ${
                isVideoOff
                  ? "bg-red-500/90 hover:bg-red-600 text-white"
                  : "bg-white/15 hover:bg-white/25 text-white"
              }`}
              title={isVideoOff ? "Bật Camera" : "Tắt Camera"}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6" />
              ) : (
                <VideoIcon className="w-6 h-6" />
              )}
            </button>
          )}

          {/* Screen Share Button (Web) */}
          {isVideo && isConnected && (
            <button
              onClick={toggleScreenShare}
              className={`p-3.5 sm:p-4 rounded-full transition-all active:scale-95 shadow-lg ${
                isScreenSharing
                  ? "bg-primary-500 hover:bg-primary-600 text-white"
                  : "bg-white/15 hover:bg-white/25 text-white"
              }`}
              title={isScreenSharing ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
            >
              <Monitor className="w-6 h-6" />
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="p-3.5 sm:p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-transform active:scale-95 shadow-xl"
            title="Kết thúc cuộc gọi"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
