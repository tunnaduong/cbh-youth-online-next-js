"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, message as antdMessage } from "antd";
import { X, Search } from "lucide-react";
import { useChatContext } from "@/contexts/Support";
import { forwardMessage, searchUserForChat } from "@/app/Api";

export default function ForwardMessageModal({ message, onClose }) {
  const { conversations } = useChatContext();
  const [selectedConversationIds, setSelectedConversationIds] = useState([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUsers, setFoundUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [sending, setSending] = useState(false);

  const show = !!message;

  const filteredConversations = conversations.filter(
    (conversation) =>
      !(conversation.type === "group" && conversation.name === "Tán gẫu linh tinh")
  );

  const getThreadDisplayName = (conversation) => {
    if (conversation.display_name) return conversation.display_name;
    if (conversation.type === "group" && conversation.name) return conversation.name;
    if (conversation.participants?.[0]) {
      return conversation.participants[0].profile_name || conversation.participants[0].username;
    }
    return "Unknown";
  };

  const toggleConversation = (id) => {
    setSelectedConversationIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const handleSearchUser = async () => {
    if (!searchUsername.trim()) return;
    setSearching(true);
    try {
      const response = await searchUserForChat({ username: searchUsername.trim() });
      const data = response?.data || response;
      if (data?.user) {
        setFoundUsers((prev) => {
          if (prev.some((u) => u.id === data.user.id)) return prev;
          return [...prev, data.user];
        });
      } else {
        antdMessage.error("Không tìm thấy người dùng với username này");
      }
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không tìm thấy người dùng với username này"
      );
    } finally {
      setSearching(false);
    }
  };

  const handleClose = () => {
    setSelectedConversationIds([]);
    setSelectedUserIds([]);
    setFoundUsers([]);
    setSearchUsername("");
    onClose();
  };

  const handleForward = async () => {
    if (!message) return;
    if (selectedConversationIds.length === 0 && selectedUserIds.length === 0) {
      antdMessage.warning("Vui lòng chọn ít nhất một nơi để chuyển tiếp");
      return;
    }

    setSending(true);
    try {
      const params = {};
      if (selectedConversationIds.length > 0) {
        params.conversation_ids = selectedConversationIds;
      }
      if (selectedUserIds.length > 0) {
        params.user_ids = selectedUserIds;
      }

      const response = await forwardMessage(message.id, params);
      const results = response?.data?.results;

      if (Array.isArray(results)) {
        const failed = results.filter((r) => !r.success);
        if (failed.length === 0) {
          antdMessage.success("Đã chuyển tiếp tin nhắn");
        } else if (failed.length === results.length) {
          antdMessage.error("Chuyển tiếp tin nhắn thất bại");
        } else {
          antdMessage.warning(
            `Đã chuyển tiếp tới ${results.length - failed.length}/${results.length} nơi`
          );
        }
      } else {
        antdMessage.success("Đã chuyển tiếp tin nhắn");
      }

      handleClose();
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Chuyển tiếp tin nhắn thất bại"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal show={show} onClose={handleClose} maxWidth="md">
      <div className="flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-neutral-600">
          <h3 className="font-medium text-gray-900 dark:text-white">Chuyển tiếp tin nhắn</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-600 text-gray-500 dark:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b dark:border-neutral-600">
          <div className="flex gap-2">
            <Input
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchUser();
                }
              }}
              placeholder="Tìm người dùng theo username"
              className="flex-1"
            />
            <Button
              onClick={handleSearchUser}
              loading={searching}
              disabled={!searchUsername.trim() || searching}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          {foundUsers.length > 0 && (
            <div className="flex flex-col mt-2 gap-1">
              {foundUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-neutral-600 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                  />
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={user.avatar_url} alt={user.username} />
                    <AvatarFallback>{user.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm dark:text-white truncate">
                    {user.profile_name || user.username}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
              Chưa có cuộc trò chuyện nào
            </p>
          ) : (
            filteredConversations.map((conversation) => (
              <label
                key={conversation.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-neutral-600 cursor-pointer border-b dark:border-neutral-600 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selectedConversationIds.includes(conversation.id)}
                  onChange={() => toggleConversation(conversation.id)}
                />
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarImage
                    src={conversation.display_avatar_url || conversation.participants?.[0]?.avatar_url}
                    alt={getThreadDisplayName(conversation)}
                  />
                  <AvatarFallback>
                    {getThreadDisplayName(conversation)?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm dark:text-white truncate min-w-0 flex-1">
                  {getThreadDisplayName(conversation)}
                </span>
              </label>
            ))
          )}
        </div>

        <div className="flex gap-2 px-4 py-3 border-t dark:border-neutral-600">
          <Button onClick={handleClose} className="flex-1" disabled={sending}>
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={handleForward}
            loading={sending}
            className="flex-1 bg-[#319527] hover:bg-[#3dbb31]"
          >
            Chuyển tiếp
          </Button>
        </div>
      </div>
    </Modal>
  );
}
