"use client";

import { useState } from "react";
import Input from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, message as antdMessage } from "antd";
import { Search, X } from "lucide-react";
import { searchUserForChat } from "@/app/Api";

/**
 * Reusable "search by username, pick multiple" widget for chat features
 * (new group members, add participants, forward-to-user).
 *
 * @param {object} props
 * @param {number[]} props.selectedUserIds
 * @param {(users: object[]) => void} props.onChange - called with the full list of selected user objects
 * @param {number[]} [props.excludeUserIds] - users to hide from results (e.g. already in the group)
 */
export default function UserMultiSelect({ selectedUserIds = [], onChange, excludeUserIds = [] }) {
  const [username, setUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUsers, setFoundUsers] = useState([]);

  const selectedUsers = foundUsers.filter((u) => selectedUserIds.includes(u.id));

  const handleSearch = async () => {
    if (!username.trim()) return;
    setSearching(true);
    try {
      const response = await searchUserForChat({ username: username.trim() });
      const data = response?.data || response;
      if (data?.user) {
        if (excludeUserIds.includes(data.user.id)) {
          antdMessage.info("Người dùng này đã ở trong danh sách");
        } else {
          setFoundUsers((prev) =>
            prev.some((u) => u.id === data.user.id) ? prev : [...prev, data.user]
          );
        }
      } else {
        antdMessage.error("Không tìm thấy người dùng với username này");
      }
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không tìm thấy người dùng với username này"
      );
    } finally {
      setSearching(false);
      setUsername("");
    }
  };

  const toggleUser = (user) => {
    const next = selectedUserIds.includes(user.id)
      ? selectedUserIds.filter((id) => id !== user.id)
      : [...selectedUserIds, user.id];
    onChange(next, foundUsers);
  };

  const removeSelected = (userId) => {
    onChange(selectedUserIds.filter((id) => id !== userId), foundUsers);
  };

  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Tìm người dùng theo username"
          className="flex-1"
        />
        <Button
          onClick={handleSearch}
          loading={searching}
          disabled={!username.trim() || searching}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedUsers.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-600 text-xs text-gray-700 dark:text-gray-200"
            >
              <Avatar className="w-4 h-4">
                <AvatarImage src={user.avatar_url} alt={user.username} />
                <AvatarFallback className="text-[9px]">
                  {user.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              {user.profile_name || user.username}
              <button type="button" onClick={() => removeSelected(user.id)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {foundUsers.length > 0 && (
        <div className="flex flex-col mt-2 gap-1 max-h-48 overflow-y-auto">
          {foundUsers
            .filter((u) => !excludeUserIds.includes(u.id))
            .map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-neutral-600 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleUser(user)}
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
  );
}
