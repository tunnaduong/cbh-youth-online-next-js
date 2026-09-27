"use client";
import { useEffect, useRef } from "react";

/**
 * Plays the soundtrack attached to the story on screen.
 *
 * Browsers block autoplaying audio until the page has been interacted with;
 * opening a story always involves a click, so in practice the first play()
 * succeeds - and if it does not, the rejection is swallowed rather than
 * breaking the viewer.
 */
const StoryMusicPlayer = ({ music, playing, muted }) => {
  const audioRef = useRef(null);
  const previewUrl = music?.previewUrl;

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !previewUrl) return;

    if (playing) {
      audio.play().catch(() => {
        // Autoplay blocked - the story still plays, just silently.
      });
    } else {
      audio.pause();
    }
  }, [playing, previewUrl]);

  if (!previewUrl) return null;

  return (
    <audio
      key={previewUrl}
      ref={audioRef}
      src={previewUrl}
      loop
      muted={muted}
      onLoadedMetadata={(event) => {
        if (music?.startMs) {
          event.currentTarget.currentTime = music.startMs / 1000;
        }
      }}
    />
  );
};

export default StoryMusicPlayer;
