"use client";

import { useCallContext, useAuthContext } from "@/contexts/Support";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AvatarFrameWrap from "@/components/profile/AvatarFrameWrap";
import UserName from "@/components/profile/UserName";
import { Phone, PhoneOff, Video } from "lucide-react";

export default function IncomingCallModal() {
  const { callStatus, callType, activeCall, answerCall, rejectCall } = useCallContext();
  const { currentUser } = useAuthContext();

  if (
    callStatus !== "ringing" ||
    !activeCall ||
    (currentUser?.id && activeCall.caller?.id === currentUser?.id)
  ) {
    return null;
  }

  const caller = activeCall.caller;
  const isVideo = callType === "video";
  const callerName = caller?.profile_name || caller?.username || "Người dùng";
  const avatarUrl = caller?.avatar_url;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-800 p-6 shadow-2xl border border-gray-100 dark:border-neutral-700 text-center flex flex-col items-center">
        {/* Pulsing Avatar Rings */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute w-28 h-28 rounded-full bg-primary-500/20 animate-ping" />
          <div className="absolute w-24 h-24 rounded-full bg-primary-500/30" />
          <div className="relative z-10">
            <AvatarFrameWrap theme={caller?.profile_theme}>
              <Avatar className="w-20 h-20 border-2 border-white dark:border-neutral-800 shadow-lg">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={callerName} />
                ) : (
                  <AvatarFallback className="bg-primary-500 text-white text-2xl font-bold">
                    {callerName[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                )}
              </Avatar>
            </AvatarFrameWrap>
          </div>
        </div>

        {/* Caller Info */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2 flex items-center justify-center gap-1.5">
          <UserName
            name={callerName}
            theme={caller?.profile_theme}
            variant="full"
          />
        </h3>

        <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400">
          {isVideo ? (
            <>
              <Video className="w-4 h-4 animate-pulse" />
              <span>Cuộc gọi video đến...</span>
            </>
          ) : (
            <>
              <Phone className="w-4 h-4 animate-pulse" />
              <span>Cuộc gọi thoại đến...</span>
            </>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
          @{caller?.username || "cbh"}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8 mt-8 w-full">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => rejectCall("rejected")}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
              title="Từ chối"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Từ chối
            </span>
          </div>

          {/* Answer Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={answerCall}
              className="w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
              title="Trả lời"
            >
              {isVideo ? (
                <Video className="w-6 h-6" />
              ) : (
                <Phone className="w-6 h-6" />
              )}
            </button>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Trả lời
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
