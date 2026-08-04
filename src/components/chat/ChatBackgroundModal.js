"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { Button, message as antdMessage, Popconfirm } from "antd";
import { X, Upload, RotateCcw, Check } from "lucide-react";
import {
  getConversationBackground,
  uploadConversationBackground,
  selectConversationBackground,
  resetConversationBackground,
} from "@/app/Api";

// Background picker for a chat conversation (private or group — never the
// public chat, which the caller is responsible for not opening this for).
// Any participant may change it; it applies to everyone in the conversation.
export default function ChatBackgroundModal({ conversationId, show, onClose, onBackgroundChanged }) {
  const [loading, setLoading] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [history, setHistory] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [applyingId, setApplyingId] = useState(null);
  const [resetting, setResetting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show && conversationId) {
      loadBackground();
    } else {
      setBackgroundUrl(null);
      setHistory([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, conversationId]);

  const loadBackground = async () => {
    setLoading(true);
    try {
      const response = await getConversationBackground(conversationId);
      const data = response?.data || response;
      setBackgroundUrl(data?.background_url || null);
      setHistory(Array.isArray(data?.history) ? data.history : []);
    } catch (error) {
      antdMessage.error("Không thể tải hình nền cuộc trò chuyện");
    } finally {
      setLoading(false);
    }
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await uploadConversationBackground(conversationId, formData);
      const data = response?.data || response;
      setBackgroundUrl(data?.background_url || null);
      onBackgroundChanged?.(data?.background_url || null);
      await loadBackground();
      antdMessage.success("Đã đổi hình nền cuộc trò chuyện");
    } catch (error) {
      antdMessage.error("Không thể tải ảnh lên, vui lòng thử lại");
    } finally {
      setUploading(false);
    }
  };

  const handleSelectHistory = async (entry) => {
    if (entry.url === backgroundUrl) return;
    setApplyingId(entry.id);
    try {
      const response = await selectConversationBackground(conversationId, entry.id);
      const data = response?.data || response;
      setBackgroundUrl(data?.background_url || null);
      onBackgroundChanged?.(data?.background_url || null);
    } catch (error) {
      antdMessage.error("Không thể đổi hình nền, vui lòng thử lại");
    } finally {
      setApplyingId(null);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetConversationBackground(conversationId);
      setBackgroundUrl(null);
      onBackgroundChanged?.(null);
      antdMessage.success("Đã đặt lại hình nền mặc định");
    } catch (error) {
      antdMessage.error("Không thể đặt lại hình nền, vui lòng thử lại");
    } finally {
      setResetting(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="md">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold dark:text-white">Hình nền đoạn chat</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-600"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-300" />
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Đang tải...</div>
        ) : (
          <>
            {/* Current preview */}
            <div
              className="relative w-full h-32 rounded-lg overflow-hidden mb-4 border border-gray-200 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center"
              style={
                backgroundUrl
                  ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : undefined
              }
            >
              {backgroundUrl ? (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50" />
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">Mặc định</span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Button
                icon={<Upload className="w-4 h-4" />}
                onClick={handlePickFile}
                loading={uploading}
                className="flex items-center gap-1.5"
              >
                Tải ảnh lên
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
              />
              {backgroundUrl && (
                <Popconfirm
                  title="Đặt lại hình nền mặc định?"
                  onConfirm={handleReset}
                  okText="Đặt lại"
                  cancelText="Hủy"
                >
                  <Button icon={<RotateCcw className="w-4 h-4" />} loading={resetting} danger>
                    Mặc định
                  </Button>
                </Popconfirm>
              )}
            </div>

            {history.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Lịch sử hình nền
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {history.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => handleSelectHistory(entry)}
                      disabled={applyingId === entry.id}
                      className="relative aspect-square rounded-md overflow-hidden border-2 transition-colors"
                      style={{
                        borderColor: entry.url === backgroundUrl ? "#22c55e" : "transparent",
                        backgroundImage: `url(${entry.url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                      title="Chọn lại hình nền này"
                    >
                      {entry.url === backgroundUrl && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Check className="w-4 h-4 text-white" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
