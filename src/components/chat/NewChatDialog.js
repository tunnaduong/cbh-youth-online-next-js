"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Input from "@/components/ui/input";
import { Button } from "antd";
import { searchUserForChat } from "@/app/Api";

export default function NewChatDialog({ onClose, onConversationCreated }) {
  const [username, setUsername] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!username.trim()) {
      setError("Vui lòng nhập username");
      return;
    }

    setLoading(true);
    setError("");
    setSearchResult(null);

    try {
      // Search for exact username match
      const response = await searchUserForChat({ username: username.trim() });
      const data = response?.data || response;

      // API returns { user: {...}, existing_conversation_id: ... }
      if (data && data.user) {
        setSearchResult(data.user);

        // If conversation already exists, use it instead of creating new one
        if (data.existing_conversation_id && onConversationCreated) {
          // Select existing conversation
          onConversationCreated({ id: data.existing_conversation_id });
          if (onClose) {
            onClose();
          }
          return;
        }
      } else {
        setSearchResult(null);
        setError("Không tìm thấy người dùng với username này");
      }
    } catch (error) {
      console.error("[NewChatDialog] Error searching user:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Không tìm thấy người dùng với username này";
      setError(errorMessage);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleStartChat = () => {
    if (!searchResult || !searchResult.id) {
      return;
    }

    // If conversation already exists, use it
    // Otherwise, just show preview (conversation will be created when first message is sent)
    if (onConversationCreated) {
      // Pass user info for preview (with null id to indicate it's a preview)
      onConversationCreated({
        id: null, // null means it's a preview, not a real conversation
        participant: searchResult,
      });
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-700 rounded-lg">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Search Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nhập username <span className="text-red-500">*</span>
          </label>
          <Input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
              setSearchResult(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm người dùng theo username"
            className="w-full"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Tìm kiếm người dùng theo username để trò chuyện với họ.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Search Result */}
        {loading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Đang tìm kiếm...
          </div>
        )}

        {!loading && searchResult && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Kết quả tìm kiếm:
            </h3>
            <div className="flex items-center gap-3 p-3 border dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage
                  src={searchResult.avatar_url}
                  alt={searchResult.profile_name || searchResult.username}
                />
                <AvatarFallback>
                  {searchResult.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm dark:text-white truncate">
                  {searchResult.profile_name || searchResult.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  @{searchResult.username}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6">
          <Button onClick={onClose} className="flex-1" disabled={loading}>
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={searchResult ? handleStartChat : handleSearch}
            loading={loading}
            disabled={!username.trim() || loading}
            className="flex-1 bg-[#319527] hover:bg-[#3dbb31]"
          >
            {searchResult ? "Bắt đầu trò chuyện" : "Tìm kiếm"}
          </Button>
        </div>
      </div>
    </div>
  );
}
