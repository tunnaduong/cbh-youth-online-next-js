"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Monitor, Smartphone } from "lucide-react";
import { message } from "antd";
import {
  getGame,
  startGameSession,
  gameSessionHeartbeat,
  endGameSession,
} from "@/app/Api";
import { useAuthContext } from "@/contexts/Support";

const HEARTBEAT_INTERVAL_MS = 20000;

const detectPlatform = () => {
  if (typeof navigator === "undefined") return "pc";
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    ? "mobile"
    : "pc";
};

export default function GamePlayClient({ slug }) {
  const { loggedIn } = useAuthContext();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const sessionIdRef = useRef(null);
  const heartbeatRef = useRef(null);
  const [platform, setPlatform] = useState("pc");

  useEffect(() => {
    setPlatform(detectPlatform());
    getGame(slug)
      .then((res) => setGame(res?.data || res))
      .catch(() => message.error("Không tìm thấy game này"))
      .finally(() => setLoading(false));
  }, [slug]);

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const endSession = () => {
    stopHeartbeat();
    if (sessionIdRef.current && loggedIn) {
      endGameSession(sessionIdRef.current).catch(() => {});
      sessionIdRef.current = null;
    }
  };

  // End the play session if the user navigates away/closes the tab mid-game.
  useEffect(() => {
    return () => endSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleUnload = () => endSession();
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const handleStart = async () => {
    setPlaying(true);
    if (!loggedIn) return; // guests can still play, just don't earn XP
    try {
      const res = await startGameSession(slug);
      sessionIdRef.current = (res?.data || res)?.session_id;
      heartbeatRef.current = setInterval(() => {
        if (sessionIdRef.current) {
          gameSessionHeartbeat(sessionIdRef.current).catch(() => {});
        }
      }, HEARTBEAT_INTERVAL_MS);
    } catch {
      // XP tracking is best-effort - a failed session start shouldn't block play
    }
  };

  const handleBack = () => {
    endSession();
    window.history.back();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        Đang tải...
      </div>
    );
  }

  if (!game) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white gap-4">
        <p>Không tìm thấy game này.</p>
        <Link
          href="/games"
          className="px-4 py-2 rounded-full bg-[#319527] text-sm font-medium"
        >
          Về trang Game
        </Link>
      </div>
    );
  }

  const unsupported =
    (game.platform === "pc" && platform === "mobile") ||
    (game.platform === "mobile" && platform === "pc");

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <button
        onClick={handleBack}
        aria-label="Quay lại"
        className="absolute top-4 left-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {playing && !unsupported ? (
        <iframe
          src={game.iframe_url}
          title={game.name}
          className="w-full h-full border-0"
          allow="fullscreen; autoplay; gamepad; accelerometer; gyroscope"
          allowFullScreen
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-full max-w-sm">
            <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-gray-800 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={game.image_url}
                alt={game.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {game.name}
            </h1>
            {game.description && (
              <p className="text-gray-300 text-sm mb-4">{game.description}</p>
            )}

            {unsupported ? (
              <div className="bg-yellow-500/10 border border-yellow-500/40 text-yellow-300 rounded-xl px-4 py-3 text-sm flex items-center gap-2 justify-center">
                {game.platform === "pc" ? (
                  <Monitor className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Smartphone className="w-4 h-4 flex-shrink-0" />
                )}
                {game.platform === "pc"
                  ? "Game này chỉ hỗ trợ trên máy tính, không hỗ trợ trên điện thoại."
                  : "Game này chỉ hỗ trợ trên điện thoại, không hỗ trợ trên máy tính."}
              </div>
            ) : (
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 bg-[#319527] hover:bg-[#3dbb31] text-white font-semibold px-6 py-3 rounded-full transition-colors"
              >
                <Play className="w-5 h-5" />
                Bắt đầu chơi
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
