"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, message as antdMessage, Popconfirm } from "antd";
import { X, Pencil, Check, UserPlus, LogOut } from "lucide-react";
import {
  getGroupDetails,
  updateGroupConversation,
  addGroupParticipants,
  removeGroupParticipant,
  leaveGroup,
} from "@/app/Api";
import UserMultiSelect from "./UserMultiSelect";

export default function GroupInfoModal({ conversationId, show, onClose, onGroupUpdated, onLeftGroup }) {
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [newMemberIds, setNewMemberIds] = useState([]);
  const [savingMembers, setSavingMembers] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (show && conversationId) {
      loadDetails();
    } else {
      setGroup(null);
      setEditingName(false);
      setAddingMembers(false);
      setNewMemberIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, conversationId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const response = await getGroupDetails(conversationId);
      const data = response?.data || response;
      setGroup(data);
      setNameDraft(data?.name || "");
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không thể tải thông tin nhóm"
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameDraft.trim() || nameDraft.trim() === group.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await updateGroupConversation(conversationId, { name: nameDraft.trim() });
      const updated = { ...group, name: nameDraft.trim() };
      setGroup(updated);
      setEditingName(false);
      onGroupUpdated?.(updated);
      antdMessage.success("Đã đổi tên nhóm");
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Chỉ trưởng nhóm mới có thể đổi tên nhóm."
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleAddMembers = async () => {
    if (newMemberIds.length === 0) return;
    setSavingMembers(true);
    try {
      const response = await addGroupParticipants(conversationId, {
        participants: newMemberIds,
      });
      const participants = response?.data?.participants || response?.participants;
      if (participants) {
        setGroup((prev) => ({ ...prev, participants }));
      } else {
        loadDetails();
      }
      setAddingMembers(false);
      setNewMemberIds([]);
      antdMessage.success("Đã thêm thành viên");
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không thể thêm thành viên"
      );
    } finally {
      setSavingMembers(false);
    }
  };

  const handleKick = async (userId) => {
    try {
      await removeGroupParticipant(conversationId, userId);
      setGroup((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p.id !== userId),
      }));
      antdMessage.success("Đã xóa thành viên khỏi nhóm");
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không thể xóa thành viên"
      );
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leaveGroup(conversationId);
      antdMessage.success("Đã rời nhóm");
      onLeftGroup?.(conversationId);
      onClose();
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không thể rời nhóm"
      );
    } finally {
      setLeaving(false);
    }
  };

  const existingMemberIds = (group?.participants || []).map((p) => p.id);

  return (
    <Modal show={show} onClose={onClose} maxWidth="md">
      <div className="flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-neutral-600">
          <h3 className="font-medium text-gray-900 dark:text-white">Thông tin nhóm</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-600 text-gray-500 dark:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading || !group ? (
          <div className="flex items-center justify-center py-10 text-gray-500 dark:text-gray-400 text-sm">
            Đang tải...
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b dark:border-neutral-600">
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    type="primary"
                    icon={<Check className="w-4 h-4" />}
                    loading={savingName}
                    onClick={handleSaveName}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex-1 truncate">
                    {group.name}
                  </h4>
                  {group.is_owner && (
                    <button
                      type="button"
                      onClick={() => setEditingName(true)}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-600 text-gray-400"
                      title="Đổi tên nhóm"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {group.participants?.length || 0} thành viên
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {group.participants?.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-3 border-b dark:border-neutral-600 last:border-b-0"
                >
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src={participant.avatar_url} alt={participant.username} />
                    <AvatarFallback>
                      {participant.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm dark:text-white truncate">
                      {participant.profile_name || participant.username}
                    </p>
                    {participant.role === "owner" && (
                      <p className="text-xs text-[#319527] dark:text-[#6bcf60]">Trưởng nhóm</p>
                    )}
                  </div>
                  {group.is_owner && participant.role !== "owner" && (
                    <Popconfirm
                      title="Xóa thành viên này khỏi nhóm?"
                      okText="Xóa"
                      cancelText="Hủy"
                      onConfirm={() => handleKick(participant.id)}
                    >
                      <button
                        type="button"
                        className="text-xs text-red-500 hover:underline flex-shrink-0"
                      >
                        Xóa
                      </button>
                    </Popconfirm>
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t dark:border-neutral-600">
              {addingMembers ? (
                <div>
                  <UserMultiSelect
                    selectedUserIds={newMemberIds}
                    onChange={setNewMemberIds}
                    excludeUserIds={existingMemberIds}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setAddingMembers(false);
                        setNewMemberIds([]);
                      }}
                      disabled={savingMembers}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="primary"
                      className="flex-1 bg-[#319527] hover:bg-[#3dbb31]"
                      loading={savingMembers}
                      disabled={newMemberIds.length === 0}
                      onClick={handleAddMembers}
                    >
                      Thêm
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 inline-flex items-center justify-center gap-1.5"
                    onClick={() => setAddingMembers(true)}
                  >
                    <UserPlus className="w-4 h-4" /> Thêm thành viên
                  </Button>
                  <Popconfirm
                    title="Bạn có chắc muốn rời nhóm này?"
                    okText="Rời nhóm"
                    cancelText="Hủy"
                    onConfirm={handleLeave}
                  >
                    <Button
                      danger
                      loading={leaving}
                      className="flex-1 inline-flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" /> Rời nhóm
                    </Button>
                  </Popconfirm>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
