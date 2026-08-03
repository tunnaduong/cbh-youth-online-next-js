"use client";

import { useEffect, useRef, useState } from "react";
import Input from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import { searchUserSuggestions } from "@/app/Api";

const DEBOUNCE_MS = 300;

/**
 * Reusable "type a name/username, pick multiple" widget for chat features
 * (new group members, add participants). Debounce-searches
 * GET /chat/search/user-suggestions as the user types, same as @mention autocomplete.
 *
 * @param {object} props
 * @param {number[]} props.selectedUserIds
 * @param {(ids: number[]) => void} props.onChange
 * @param {number[]} [props.excludeUserIds] - users to hide from results (e.g. already in the group)
 * @param {number} [props.excludeConversationId] - pass the group's id when adding to an existing group
 */
export default function UserMultiSelect({
  selectedUserIds = [],
  onChange,
  excludeUserIds = [],
  excludeConversationId,
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = { q: query.trim() };
        if (excludeConversationId) {
          params.exclude_conversation_id = excludeConversationId;
        }
        const response = await searchUserSuggestions(params);
        const data = response?.data || response;
        setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, excludeConversationId]);

  const toggleUser = (user) => {
    const isSelected = selectedUserIds.includes(user.id);
    if (isSelected) {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
      onChange(selectedUserIds.filter((id) => id !== user.id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
      onChange([...selectedUserIds, user.id]);
    }
  };

  const removeSelected = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
    onChange(selectedUserIds.filter((id) => id !== userId));
  };

  const visibleSuggestions = suggestions.filter(
    (u) => !excludeUserIds.includes(u.id)
  );

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nhập tên hoặc username"
        className="w-full"
      />

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

      {searching && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Đang tìm kiếm...</p>
      )}

      {!searching && query.trim() && visibleSuggestions.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Không tìm thấy người dùng phù hợp
        </p>
      )}

      {visibleSuggestions.length > 0 && (
        <div className="flex flex-col mt-2 gap-1 max-h-48 overflow-y-auto">
          {visibleSuggestions.map((user) => (
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
              <div className="min-w-0">
                <p className="text-sm dark:text-white truncate">
                  {user.profile_name || user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  @{user.username}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
