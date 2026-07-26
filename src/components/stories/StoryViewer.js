"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useDrag } from "@use-gesture/react";
import { animated, useSpring, config } from "@react-spring/web";
import { Drawer, message } from "antd";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCube } from "swiper/modules";
import { useRouter } from "@bprogress/next/app";
import { X, ChevronLeft, ChevronRight, VolumeX, Volume2, Link2, Smartphone, Trash2, Send } from "lucide-react";
import { markStoryAsViewed, deleteStory, reactToStory, removeStoryReaction } from "@/app/Api";
import { postRequest } from "@/services/api/ApiByAxios";
import { Modal } from "antd";
import Link from "next/link";
import { openDeepLink } from "@/lib/deepLink";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-cube";
import "swiper/css/navigation";
import "swiper/css/pagination";

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) {
    return "Vừa xong";
  }

  let interval = seconds / 31536000;
  if (interval > 1) {
    return `${Math.floor(interval)} năm`;
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return `${Math.floor(interval)} tháng`;
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return `${Math.floor(interval)} ngày`;
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return `${Math.floor(interval)} giờ`;
  }
  interval = seconds / 60;
  if (interval > 1) {
    return `${Math.floor(interval)} phút`;
  }
  return `${Math.floor(seconds)} giây`;
};

const StoryProgress = ({ stories, currentStoryIndex, progress }) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
      {stories.map((_, index) => (
        <div
          key={index}
          className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{
              width:
                index < currentStoryIndex
                  ? "100%"
                  : index === currentStoryIndex
                  ? `${progress}%`
                  : "0%",
            }}
          />
        </div>
      ))}
    </div>
  );
};

const UserHeader = ({
  user,
  onClose,
  storyType,
  isMuted,
  onToggleMute,
  createdAt,
  storyId,
  isOwner,
  onDelete,
  isMuteLocked,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMobile = () => {
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
      };
      checkMobile();
    }
  }, []);

  const handleCopyLink = () => {
    if (!storyId) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?storyId=${storyId}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        message.success("Đã sao chép liên kết đến tin này!");
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        message.error("Không thể sao chép liên kết.");
      });
  };

  const handleOpenInApp = () => {
    if (!storyId) return;
    openDeepLink("story", storyId, {
      onFallback: (storeUrl) => {
        Modal.confirm({
          title: "Mở trong ứng dụng",
          content: "Chưa cài app CBH Youth? Tải về để trải nghiệm tốt hơn!",
          okText: "Tải app",
          cancelText: "Đóng",
          onOk: () => {
            window.open(storeUrl, "_blank");
          },
        });
      },
    });
  };

  return (
    <div className="absolute top-10 left-4 right-4 z-50 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <Link href={`/${user.username}`} className="flex-shrink-0">
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${user.username}/avatar`}
            alt={user.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover"
          />
        </Link>
        <div className="flex flex-col leading-tight min-w-0">
          <Link href={`/${user.username}`}>
            <span className="text-white font-medium text-xs sm:text-sm drop-shadow truncate block">
              {user.name}
            </span>
          </Link>
          {createdAt && (
            <span className="text-white/80 text-[10px] sm:text-xs drop-shadow truncate block">
              {formatTimeAgo(createdAt)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {(storyType === "video" || storyType === "audio") && (
          <button
            onClick={onToggleMute}
            disabled={isMuteLocked}
            className={`transition-colors p-1.5 sm:p-2 flex-shrink-0 ${isMuteLocked ? "text-white/70 cursor-not-allowed" : "text-white hover:text-white/80"}`}
            title={isMuteLocked ? "Âm thanh của tin này bị khóa" : isMuted ? "Bật âm" : "Tắt âm"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
            ) : (
              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
            )}
          </button>
        )}
        {isMobile && (
          <button
            onClick={handleOpenInApp}
            className="text-white hover:text-white/80 transition-colors p-1.5 sm:p-2 flex-shrink-0"
            title="Mở trong App"
          >
            <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
          </button>
        )}
        <button
          onClick={handleCopyLink}
          className="text-white hover:text-white/80 transition-colors p-1.5 sm:p-2 flex-shrink-0"
          title="Sao chép liên kết"
        >
          <Link2 className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
        </button>
        {isOwner && (
          <button
            onClick={onDelete}
            className="text-white hover:text-red-400 transition-colors p-1.5 sm:p-2 flex-shrink-0"
            title="Xóa tin này"
          >
            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
          </button>
        )}
        <button
          onClick={onClose}
          className="text-white hover:text-white/80 transition-colors p-1.5 sm:p-2 flex-shrink-0"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
        </button>
      </div>
    </div>
  );
};

const StoryContent = ({ story, isActive, isPaused, onNext, isMuted }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!story) return;
    if (story.type === "video" && videoRef.current) {
      if (isActive && !isPaused) {
        videoRef.current.play().catch((err) => console.log("Play video failed:", err));
      } else {
        videoRef.current.pause();
      }
    }
    if (story.type === "audio" && audioRef.current) {
      if (isActive && !isPaused) {
        audioRef.current.play().catch((err) => console.log("Play audio failed:", err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isActive, isPaused, story?.type]);

  // Cleanup effect to stop all media when component unmounts
  useEffect(() => {
    const currentVideo = videoRef.current;
    const currentAudio = audioRef.current;
    return () => {
      if (currentVideo) {
        currentVideo.pause();
        currentVideo.currentTime = 0;
      }
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, []);

  if (!story) return null;

  if (story.type === "video") {
    return (
      <video
        ref={videoRef}
        src={process.env.NEXT_PUBLIC_API_URL + story.media_url}
        poster={
          story.video_first_frame_url
            ? process.env.NEXT_PUBLIC_API_URL + story.video_first_frame_url
            : undefined
        }
        className="w-full h-full object-cover"
        autoPlay={isActive}
        muted={isMuted}
        playsInline
        onEnded={onNext}
      />
    );
  }

  if (story.type === "text") {
    return (
      <div
        className="w-full h-full flex items-center justify-center text-white text-2xl font-bold text-center p-4"
        style={{
          background: (() => {
            if (!story.background_color) return "#1877f2";

            if (
              story.background_color.startsWith("[") ||
              story.background_color.startsWith("{")
            ) {
              try {
                const bgColor = JSON.parse(story.background_color);
                if (Array.isArray(bgColor) && bgColor.length === 2) {
                  return `linear-gradient(135deg, ${bgColor[0]}, ${bgColor[1]})`;
                }
              } catch (error) {
                console.log("Error parsing background_color:", error);
              }
            }

            return story.background_color;
          })(),
          fontStyle: story.font_style || "normal",
        }}
      >
        {story.text_content}
      </div>
    );
  }

  if (story.type === "audio") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-[#3c3c3c]">
        <div className="text-6xl mb-2">🎵</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center px-2">
          Tin âm thanh
        </div>
        <audio
          ref={audioRef}
          src={process.env.NEXT_PUBLIC_API_URL + story.media_url}
          autoPlay={isActive}
          muted={isMuted}
          playsInline
          onEnded={onNext}
          onTimeUpdate={(e) => {
            // This can be used for progress if needed in the future
          }}
        />
      </div>
    );
  }

  return (
    <img
      src={
        (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
          ? process.env.NEXT_PUBLIC_API_URL + story.media_url
          : story.media_url) || "/placeholder.svg"
      }
      alt="Story content"
      className="h-full object-contain mx-auto"
    />
  );
};

const REACTIONS = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "haha", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
  { type: "angry", emoji: "😡" },
];

const FLOAT_ROTATE_CSS = `
  @keyframes emojiFloat {
    0%   { opacity: 0;   transform: translate(-50%, -50%) scale(0.3) rotate(0deg); }
    12%  { opacity: 1;   transform: translate(-50%, -50%) scale(1.5) rotate(-12deg); }
    30%  { opacity: 1;   transform: translate(calc(-50% + 12px), calc(-50% - 90px))  scale(1.2) rotate(14deg); }
    50%  { opacity: 1;   transform: translate(calc(-50% - 10px), calc(-50% - 180px)) scale(1.15) rotate(-10deg); }
    70%  { opacity: 0.8; transform: translate(calc(-50% + 8px),  calc(-50% - 265px)) scale(1.1) rotate(8deg); }
    85%  { opacity: 0.4; transform: translate(calc(-50% - 6px),  calc(-50% - 320px)) scale(1.05) rotate(-6deg); }
    100% { opacity: 0;   transform: translate(calc(-50% + 4px),  calc(-50% - 370px)) scale(1) rotate(4deg); }
  }
  .emoji-float-rotate {
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    font-size: 2.4rem;
    line-height: 1;
    animation: emojiFloat 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
`;

const StoryFooter = ({
  currentReaction,
  onReact,
  replyText,
  setReplyText,
  onSendReply,
  onInputFocus,
  onInputBlur,
  isSending,
  isLoggedIn,
  isOwner,
}) => {
  const [flyingEmojis, setFlyingEmojis] = useState([]);

  const handleReactClick = (type, emoji, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Spawn 3 copies with slight offset + staggered delay for richness
    const spawns = [
      { dx: 0,   dy: 0,  delay: 0   },
      { dx: -12, dy: -6, delay: 80  },
      { dx: 12,  dy: -4, delay: 160 },
    ];
    spawns.forEach(({ dx, dy, delay }) => {
      const id = Date.now() + Math.random();
      setTimeout(() => {
        setFlyingEmojis((prev) => [...prev, { id, emoji, x: cx + dx, y: cy + dy }]);
        setTimeout(() => {
          setFlyingEmojis((prev) => prev.filter((f) => f.id !== id));
        }, 1200);
      }, delay);
    });
    onReact(type);
  };

  return (
    <>
      <style>{FLOAT_ROTATE_CSS}</style>

      {/* Flying emojis layer — fixed so they escape the story container */}
      {flyingEmojis.map(({ id, emoji, x, y }) => (
        <div key={id} className="emoji-float-rotate" style={{ left: x, top: y }}>
          {emoji}
        </div>
      ))}

      {/* Footer: stacked vertically */}
      <div
        className="absolute bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-10 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Reaction row */}
        <div className="flex items-center gap-4">
          {REACTIONS.map(({ type, emoji }) => {
            const isSelected = currentReaction === type;
            return (
              <button
                key={type}
                onClick={(e) => handleReactClick(type, emoji, e)}
                className="relative flex flex-col items-center select-none focus:outline-none"
                style={{
                  fontSize: isSelected ? "2rem" : "1.75rem",
                  filter: isSelected ? "drop-shadow(0 0 8px rgba(255,255,255,0.9))" : "none",
                  transform: isSelected ? "scale(1.2)" : "scale(1)",
                  transition: "transform 0.15s, filter 0.15s, font-size 0.15s",
                }}
              >
                {emoji}
                {isSelected && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>

        {/* Reply input row — hidden for story owner */}
        {!isOwner && (
          <div className="w-full flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
              placeholder={isLoggedIn ? "Gửi tin nhắn..." : "Đăng nhập để phản hồi"}
              disabled={!isLoggedIn || isSending}
              maxLength={500}
              className="flex-1 bg-white/15 text-white placeholder-white/50 rounded-full px-4 py-2 text-sm outline-none disabled:opacity-50"
              style={{ border: "1.5px solid rgba(255,255,255,0.25)", boxShadow: "none" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendReply();
                }
              }}
            />
            <button
              onClick={onSendReply}
              disabled={!replyText.trim() || !isLoggedIn || isSending}
              className="text-white/80 hover:text-white disabled:opacity-30 transition-opacity flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const StorySlide = ({
  user,
  isActive,
  isViewerOpen,
  onClose,
  onUserChange,
  initialStoryIndex = 0,
  currentUser,
  onStoryDeleted,
}) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const progressIntervalRef = useRef();

  const isOwner = Boolean(
    currentUser && (
      String(currentUser.id) === String(user.id) ||
      currentUser.username?.toLowerCase() === user.username?.toLowerCase()
    )
  );

  const currentStory = user.stories[currentStoryIndex];

  useEffect(() => {
    if (currentStory) {
      setIsMuted(Boolean(currentStory.is_muted));
      setCurrentReaction(currentStory.user_reaction || null);

      // Mark story as viewed using API call
      markStoryAsViewed(currentStory.id)
        .then((response) => {
          console.log("Story marked as viewed:", response);
        })
        .catch((error) => {
          console.error("Failed to mark story as viewed:", error);
        });
    }
  }, [currentStory?.id, currentStory?.is_muted]);

  const handleReact = useCallback(async (reactionType) => {
    if (!currentUser) {
      message.warning("Bạn cần đăng nhập để thả cảm xúc.");
      return;
    }
    const storyId = currentStory?.id;
    if (!storyId) return;

    if (currentReaction === reactionType) {
      setCurrentReaction(null);
      try {
        await removeStoryReaction(storyId);
      } catch {
        setCurrentReaction(reactionType);
      }
    } else {
      const prev = currentReaction;
      setCurrentReaction(reactionType);
      try {
        await reactToStory(storyId, { reaction_type: reactionType });
      } catch {
        setCurrentReaction(prev);
      }
    }
  }, [currentUser, currentStory?.id, currentReaction]);

  const handleSendReply = useCallback(async () => {
    if (!replyText.trim() || !currentUser || sendingRef.current) return;
    const storyId = currentStory?.id;
    if (!storyId) return;

    sendingRef.current = true;
    setIsSending(true);
    const text = replyText;
    setReplyText("");
    try {
      await postRequest(`/v1.0/stories/${storyId}/reply`, { content: text });
      message.success("Đã gửi tin nhắn!");
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      console.error("[StoryReply] failed:", status, serverMsg || err?.message, err);
      setReplyText(text);
      message.error(serverMsg || "Không thể gửi. Vui lòng thử lại.");
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }, [replyText, currentUser, currentStory?.id]);

  const handleToggleMute = useCallback(() => {
    if (currentStory?.is_muted) return;
    setIsMuted((prev) => !prev);
  }, [currentStory?.is_muted]);

  const stopProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const resetProgress = useCallback(() => {
    stopProgress();
    setProgress(0);
  }, [stopProgress]);

  const startProgress = useCallback(() => {
    stopProgress();
    if (currentStory?.type === "image" || currentStory?.type === "text") {
      let duration = currentStory.duration;

      if (!duration || duration <= 0) {
        duration = 5000;
      } else if (duration < 100) {
        // A heuristic to treat small numbers as seconds
        duration *= 1000;
      }

      const interval = 50;
      const increment = (interval / duration) * 100;
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + increment;
          return next >= 100 ? 100 : next;
        });
      }, interval);
    }
  }, [currentStory, stopProgress]);

  const handleNextStory = useCallback(() => {
    stopProgress();
    setProgress(0);
    setCurrentStoryIndex((prev) => {
      if (prev < user.stories.length - 1) return prev + 1;
      // last story -> change user
      onUserChange("next");
      return prev;
    });
  }, [user.stories.length, onUserChange, stopProgress]);

  const handlePrevStory = useCallback(() => {
    stopProgress();
    setProgress(0);
    setCurrentStoryIndex((prev) => {
      if (prev > 0) return prev - 1;
      onUserChange("prev");
      return prev;
    });
  }, [onUserChange, stopProgress]);

  useEffect(() => {
    if (
      progress >= 100 &&
      (currentStory?.type === "image" || currentStory?.type === "text")
    ) {
      handleNextStory();
    }
  }, [progress, currentStory?.type, handleNextStory]);

  useEffect(() => {
    if (
      isActive &&
      !isPaused &&
      (currentStory?.type === "image" || currentStory?.type === "text")
    ) {
      startProgress();
    } else {
      stopProgress();
    }

    return () => stopProgress();
  }, [isActive, isPaused, currentStoryIndex, currentStory, startProgress, stopProgress]);

  // RESET khi user thay đổi hoặc khi initialStoryIndex thay đổi (ví dụ khi remount)
  useEffect(() => {
    setCurrentStoryIndex(initialStoryIndex || 0);
    resetProgress();
  }, [user.id, initialStoryIndex, resetProgress]);

  // Reset/update query parameters when story changes on active slide
  useEffect(() => {
    if (isActive && isViewerOpen && currentStory?.id) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("storyId") !== String(currentStory.id)) {
        params.set("storyId", currentStory.id);
        const newSearch = params.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [isActive, isViewerOpen, currentStory?.id]);

  return (
    <div className="relative w-full h-full bg-black">
      <div className="absolute inset-x-0 top-0 h-1/6 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

      <StoryProgress
        stories={user.stories}
        currentStoryIndex={currentStoryIndex}
        progress={progress}
      />

      <UserHeader
        user={user}
        onClose={onClose}
        storyType={currentStory?.type}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        createdAt={currentStory?.created_at}
        storyId={currentStory?.id}
        isMuteLocked={Boolean(currentStory?.is_muted)}
        isOwner={isOwner}
        onDelete={() => {
          Modal.confirm({
            title: "Xóa tin này?",
            content: "Bạn có chắc chắn muốn xóa tin này không? Hành động này không thể hoàn tác.",
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
              try {
                await deleteStory(currentStory.id);
                message.success("Đã xóa tin thành công!");
                if (onStoryDeleted) onStoryDeleted(currentStory.id);
                onClose();
              } catch (err) {
                console.error("Failed to delete story:", err);
                message.error("Không thể xóa tin. Vui lòng thử lại.");
              }
            },
          });
        }}
      />

      <StoryContent
        story={currentStory}
        isActive={isActive && isViewerOpen}
        isPaused={isPaused}
        onNext={handleNextStory}
        isMuted={isMuted}
      />

      {/* Touch areas for navigation — exclude bottom footer */}
      <div className="absolute inset-x-0 top-0 bottom-16 flex">
        <div className="flex-1 cursor-pointer" onClick={handlePrevStory} />
        <div className="flex-1 cursor-pointer" onClick={handleNextStory} />
      </div>

      {/* Navigation arrows for desktop */}
      <div className="hidden md:block">
        <button
          onClick={handlePrevStory}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-40"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          onClick={handleNextStory}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-40"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      <StoryFooter
        currentReaction={currentReaction}
        onReact={handleReact}
        replyText={replyText}
        setReplyText={setReplyText}
        onSendReply={handleSendReply}
        onInputFocus={() => setIsPaused(true)}
        onInputBlur={() => setIsPaused(false)}
        isOwner={isOwner}
        isSending={isSending}
        isLoggedIn={Boolean(currentUser)}
      />
    </div>
  );
};

export const StoryViewer = ({
  users,
  isOpen = false,
  onClose,
  onOpacityChange,
  selectedUserIndex = 0,
  selectedStoryIndex = 0,
  currentUser,
  onStoryDeleted,
}) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(selectedUserIndex);
  const swiperRef = useRef(null);
  const [{ y, opacity }, api] = useSpring(() => ({
    y: 0,
    opacity: 1,
    config: config.gentle,
    onChange: ({ value }) => {
      if (onOpacityChange) {
        onOpacityChange(value.opacity);
      }
    },
  }));

  const handleClose = useCallback(() => {
    api.start({
      y: window.innerHeight,
      opacity: 0,
      immediate: false,
      onResolve: onClose,
    });
  }, [api, onClose]);

  // when component mount / isOpen true -> di chuyển swiper đến selectedUserIndex
  useEffect(() => {
    if (isOpen) {
      api.start({ y: 0, opacity: 1, immediate: true });
      setCurrentUserIndex(selectedUserIndex);
      if (
        swiperRef.current &&
        typeof swiperRef.current.slideTo === "function"
      ) {
        swiperRef.current.slideTo(selectedUserIndex, 0); // no animation
      }
    }
  }, [isOpen, selectedUserIndex, api]);

  const handleUserChange = useCallback(
    (direction) => {
      if (direction === "next" && currentUserIndex < users.length - 1) {
        const newIndex = currentUserIndex + 1;
        setCurrentUserIndex(newIndex);
        if (swiperRef.current) {
          swiperRef.current.slideNext();
        }
      } else if (direction === "prev" && currentUserIndex > 0) {
        const newIndex = currentUserIndex - 1;
        setCurrentUserIndex(newIndex);
        if (swiperRef.current) {
          swiperRef.current.slidePrev();
        }
      } else if (
        direction === "next" &&
        currentUserIndex === users.length - 1
      ) {
        handleClose();
      }
    },
    [currentUserIndex, users.length, handleClose]
  );

  const handleSlideChange = useCallback((swiper) => {
    setCurrentUserIndex(swiper.activeIndex);
  }, []);

  const bind = useDrag(
    ({ last, movement: [, my], velocity: [, vy], direction: [, dy] }) => {
      const isDraggingDown = dy > 0;
      const yPos = my > 0 ? my : 0;

      if (last) {
        if (yPos > window.innerHeight / 3 || (vy > 0.5 && isDraggingDown)) {
          handleClose();
        } else {
          api.start({ y: 0, opacity: 1 }); // Spring back
        }
      } else {
        const newOpacity = 1 - yPos / window.innerHeight;
        api.start({ y: yPos, opacity: newOpacity, immediate: true });
      }
    },
    {
      axis: "y",
      filterTaps: true,
      bounds: { top: 0 },
    }
  );

  return (
    <animated.div
      {...bind()}
      style={{ transform: y.to(v => `translateY(${v}px)`), touchAction: "pan-x", opacity }}
      className="w-full h-dvh bg-black fixed inset-0"
    >
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        effect="cube"
        grabCursor={true}
        cubeEffect={{
          shadow: true,
          slideShadows: true,
          shadowOffset: 20,
          shadowScale: 0.94,
        }}
        modules={[EffectCube]}
        className="w-full h-full"
        onSlideChange={handleSlideChange}
        initialSlide={currentUserIndex}
      >
        {users.map((user, index) => (
          <SwiperSlide key={user.id}>
            <StorySlide
              user={user}
              isActive={index === currentUserIndex}
              isViewerOpen={isOpen}
              onClose={handleClose}
              onUserChange={handleUserChange}
              initialStoryIndex={
                index === selectedUserIndex ? selectedStoryIndex : 0
              }
              currentUser={currentUser}
              onStoryDeleted={onStoryDeleted}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </animated.div>
  );
};
