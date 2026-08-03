"use client";

import { useState } from "react";
import Input from "@/components/ui/input";
import { Button, message as antdMessage } from "antd";
import { createGroupConversation } from "@/app/Api";
import UserMultiSelect from "./UserMultiSelect";

export default function NewGroupDialog({ onClose, onGroupCreated }) {
  const [name, setName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      antdMessage.warning("Vui lòng nhập tên nhóm");
      return;
    }
    if (selectedUserIds.length === 0) {
      antdMessage.warning("Vui lòng chọn ít nhất một thành viên");
      return;
    }

    setCreating(true);
    try {
      const response = await createGroupConversation({
        name: name.trim(),
        participants: selectedUserIds,
      });
      const group = response?.data || response;
      antdMessage.success("Đã tạo nhóm");
      onGroupCreated?.(group);
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không thể tạo nhóm"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-700 rounded-lg">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tên nhóm <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên nhóm"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Thành viên <span className="text-red-500">*</span>
          </label>
          <UserMultiSelect
            selectedUserIds={selectedUserIds}
            onChange={setSelectedUserIds}
          />
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={onClose} className="flex-1" disabled={creating}>
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={handleCreate}
            loading={creating}
            disabled={!name.trim() || selectedUserIds.length === 0}
            className="flex-1 bg-[#319527] hover:bg-[#3dbb31]"
          >
            Tạo nhóm
          </Button>
        </div>
      </div>
    </div>
  );
}
