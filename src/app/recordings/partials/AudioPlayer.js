"use client";

import { useState, useRef, useEffect } from "react";
import { PlayCircle, PauseCircle, Volume2, VolumeX } from "lucide-react";
import { Button } from "antd";
import Link from "next/link";
import { generatePostSlug } from "@/utils/slugify";

export default function AudioPlayer({
  src,
  title,
  className,
  thumbnail,
  content,
  id,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Handle metadata loading
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (
      audio &&
      audio.duration &&
      !isNaN(audio.duration) &&
      isFinite(audio.duration)
    ) {
      console.log("Duration loaded:", audio.duration);
      setDuration(audio.duration);
    }
  };

  // Handle time updates
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  };

  // Handle audio ended
  const handleEnded = () => {
    setIsPlaying(false);
  };

  // Setup event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplay", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleLoadedMetadata);

    // Try to load metadata, but don't force if CORS fails
    if (src) {
      try {
        audio.load();
      } catch (error) {
        console.log("Cannot load audio metadata due to CORS:", error.message);
      }
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplay", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleLoadedMetadata);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
        // Try to get duration after play starts
        setTimeout(() => {
          if (
            audio.duration &&
            !isNaN(audio.duration) &&
            isFinite(audio.duration)
          ) {
            setDuration(audio.duration);
          }
        }, 100);
      } catch (error) {
        console.log("Cannot play audio:", error.message);
      }
    }
  };

  const handleSeek = (value) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={className}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
      />

      <div>
        <div className="flex gap-4 mt-1">
          {/* Thumbnail and Play Button */}
          <div className="shrink-0 relative w-[110px] h-[110px] rounded-lg overflow-hidden">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={"/images/soundwaves.png"}
                alt={title}
                className="w-full h-full object-cover"
              />
            )}
            <button
              onClick={togglePlay}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transform hover:scale-105 transition-all duration-300"
            >
              {isPlaying ? (
                <PauseCircle className="w-12 h-12 text-white drop-shadow-lg" />
              ) : (
                <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
              )}
            </button>
          </div>

          {/* Track Info and Controls */}
          <div className="flex-1 min-w-0">
            <div className="max-w-full">
              <h3 className="text-xl font-medium truncate">{title}</h3>
              {content ? (
                <p className="text-gray-500 text-sm mt-1 w-[80%] inline-block">
                  {content.replace(/<[^>]*>/g, "").length > 75 ? (
                    <>
                      {content.replace(/<[^>]*>/g, "").substring(0, 75)}
                      <Link
                        className="inline text-primary-500"
                        href={`/recordings/${generatePostSlug(id, title)}`}
                      >
                        ...Xem thêm
                      </Link>
                    </>
                  ) : (
                    content.replace(/<[^>]*>/g, "")
                  )}
                </p>
              ) : (
                <div className="h-[45.5px]"></div>
              )}
            </div>

            <div className="flex gap-x-3">
              {/* Progress Bar */}
              <div className="flex-1 flex items-center gap-x-3">
                <div className="flex text-sm text-gray-500 gap-x-1 min-w-[100px] tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <input
                  type="range"
                  value={currentTime}
                  max={duration || 100}
                  step={1}
                  onChange={(e) => handleSeek([parseFloat(e.target.value)])}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Volume Controls */}
              <div className="flex items-center gap-1">
                <Button
                  onClick={toggleMute}
                  className="p-2 w-10 h-10 rounded-full border-0"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-gray-500" />
                  )}
                </Button>

                <div className="w-32 -mt-1">
                  <input
                    type="range"
                    value={isMuted ? 0 : volume}
                    max={1}
                    step={0.1}
                    onChange={(e) =>
                      handleVolumeChange([parseFloat(e.target.value)])
                    }
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
