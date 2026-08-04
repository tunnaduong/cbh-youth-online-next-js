"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, message as antdMessage, Popconfirm, Dropdown, Select } from "antd";
import { X, Pencil, Check, UserPlus, LogOut, Trash2, Camera, Link as LinkIcon, MoreVertical, Image as ImageIcon, ShieldCheck } from "lucide-react";
import {
  getGroupDetails,
  updateGroupConversation,
  updateGroupAvatar,
  updateGroupPermissions,
  addGroupParticipants,
  removeGroupParticipant,
  leaveGroup,
  deleteGroupConversation,
  addGroupDeputy,
  removeGroupDeputy,
  transferGroupOwnership,
  getGroupInviteLink,
} from "@/app/Api";
import UserMultiSelect from "./UserMultiSelect";
import ChatBackgroundModal from "./ChatBackgroundModal";
import { useAuthContext } from "@/contexts/Support";

const PERMISSION_FIELDS = [
  { key: "perm_change_name", label: "Đổi tên nhóm", options: ["owner", "deputy", "member"] },
  { key: "perm_change_avatar", label: "Đổi ảnh đại diện nhóm", options: ["owner", "deputy", "member"] },
  { key: "perm_change_background", label: "Đổi ảnh nền cuộc trò chuyện", options: ["owner", "deputy", "member"] },
  { key: "perm_remove_members", label: "Xóa thành viên", options: ["owner", "deputy"] },
  { key: "perm_share_invite_link", label: "Chia sẻ liên kết mời", options: ["owner", "deputy", "member", "none"] },
  { key: "perm_invite_members", label: "Mời thành viên", options: ["owner", "deputy", "member"] },
];

const PERMISSION_VALUE_LABELS = {
  owner: "Chỉ trưởng nhóm",
  deputy: "Trưởng & phó nhóm",
  member: "Tất cả thành viên",
  none: "Không có ai",
};

export default function GroupInfoModal({ conversationId, show, onClose, onGroupUpdated, onLeftGroup, onBackgroundChanged }) {
  const { currentUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [newMemberIds, setNewMemberIds] = useState([]);
  const [savingMembers, setSavingMembers] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [invitingLoading, setInvitingLoading] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [savingPermission, setSavingPermission] = useState(null);
  const avatarInputRef = useRef(null);

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

  const handleDeleteGroup = async () => {
    setDeletingGroup(true);
    try {
      await deleteGroupConversation(conversationId);
      antdMessage.success("Đã xóa nhóm");
      onLeftGroup?.(conversationId);
      onClose();
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không thể xóa nhóm"
      );
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await updateGroupAvatar(conversationId, formData);
      const avatarUrl = response?.data?.avatar_url || response?.avatar_url;
      const updated = { ...group, avatar_url: avatarUrl };
      setGroup(updated);
      onGroupUpdated?.(updated);
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không thể đổi ảnh đại diện nhóm"
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleMakeDeputy = async (participant) => {
    try {
      await addGroupDeputy(conversationId, participant.id);
      setGroup((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === participant.id ? { ...p, role: "deputy" } : p
        ),
      }));
      antdMessage.success("Đã chỉ định phó nhóm");
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không thể chỉ định phó nhóm"
      );
    }
  };

  const handleRemoveDeputy = async (participant) => {
    try {
      await removeGroupDeputy(conversationId, participant.id);
      setGroup((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === participant.id ? { ...p, role: "member" } : p
        ),
      }));
      antdMessage.success("Đã gỡ vai trò phó nhóm");
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không thể gỡ vai trò phó nhóm"
      );
    }
  };

  const handleTransferOwnership = async (participant) => {
    try {
      await transferGroupOwnership(conversationId, participant.id);
      antdMessage.success("Đã chuyển quyền trưởng nhóm");
      loadDetails();
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không thể chuyển quyền trưởng nhóm"
      );
    }
  };

  const handleInvite = async () => {
    setInvitingLoading(true);
    try {
      const response = await getGroupInviteLink(conversationId);
      const inviteUrl = response?.data?.invite_url || response?.invite_url;
      await navigator.clipboard.writeText(inviteUrl);
      antdMessage.success("Đã sao chép liên kết mời vào bộ nhớ tạm");
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không thể tạo liên kết mời"
      );
    } finally {
      setInvitingLoading(false);
    }
  };

  const handlePermissionChange = async (key, value) => {
    setSavingPermission(key);
    try {
      const response = await updateGroupPermissions(conversationId, { [key]: value });
      const permissions = response?.data?.permissions || response?.permissions;
      setGroup((prev) => ({ ...prev, permissions: permissions || prev.permissions }));
      antdMessage.success("Đã cập nhật cài đặt quản lý nhóm");
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Không thể cập nhật cài đặt"
      );
    } finally {
      setSavingPermission(null);
    }
  };

  const getParticipantMenuItems = (participant) => {
    if (participant.id === currentUser?.id || participant.role === "owner") return [];

    const items = [];

    if (group.is_owner) {
      if (participant.role === "deputy") {
        items.push({
          key: "remove-deputy",
          label: "Gỡ vai trò phó nhóm",
          onClick: () => handleRemoveDeputy(participant),
        });
      } else {
        items.push({
          key: "make-deputy",
          label: "Chỉ định làm phó nhóm",
          onClick: () => handleMakeDeputy(participant),
        });
      }
      items.push({
        key: "transfer",
        label: "Chuyển quyền trưởng nhóm",
        onClick: () => handleTransferOwnership(participant),
      });
    }

    if (group.permissions?.can?.perm_remove_members) {
      items.push({
        key: "kick",
        label: <span className="text-red-500">Xóa khỏi nhóm</span>,
        onClick: () => handleKick(participant.id),
      });
    }

    return items;
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
              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => group.permissions?.can?.perm_change_avatar && avatarInputRef.current?.click()}
                  disabled={uploadingAvatar || !group.permissions?.can?.perm_change_avatar}
                  className="relative flex-shrink-0 disabled:cursor-not-allowed"
                  title={group.permissions?.can?.perm_change_avatar ? "Đổi ảnh đại diện nhóm" : "Bạn không có quyền đổi ảnh đại diện nhóm"}
                >
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={group.avatar_url} alt={group.name} />
                    <AvatarFallback>{group.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  {group.permissions?.can?.perm_change_avatar && (
                    <span className="absolute -right-0.5 -bottom-0.5 w-5 h-5 rounded-full bg-[#319527] border-2 border-white dark:border-neutral-800 flex items-center justify-center">
                      <Camera className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
                <div className="flex-1 min-w-0">
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
                      {group.permissions?.can?.perm_change_name && (
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
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 inline-flex items-center justify-center gap-1.5"
                  onClick={() => setShowBackgroundModal(true)}
                >
                  <ImageIcon className="w-4 h-4" /> Đổi ảnh nền
                </Button>
                {group.is_owner && (
                  <Button
                    className="flex-1 inline-flex items-center justify-center gap-1.5"
                    onClick={() => setShowPermissions((v) => !v)}
                  >
                    <ShieldCheck className="w-4 h-4" /> Quản lý nhóm
                  </Button>
                )}
              </div>
              {showPermissions && group.is_owner && (
                <div className="mt-3 space-y-2.5 border-t dark:border-neutral-600 pt-3">
                  {PERMISSION_FIELDS.map((field) => (
                    <div key={field.key} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
                      <Select
                        size="small"
                        className="w-[168px]"
                        value={group.permissions?.settings?.[field.key] || field.options[field.options.length - 1]}
                        loading={savingPermission === field.key}
                        onChange={(value) => handlePermissionChange(field.key, value)}
                        options={field.options.map((opt) => ({
                          value: opt,
                          label: PERMISSION_VALUE_LABELS[opt],
                        }))}
                      />
                    </div>
                  ))}
                </div>
              )}
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
                    {participant.role === "deputy" && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phó nhóm</p>
                    )}
                  </div>
                  {(() => {
                    const menuItems = getParticipantMenuItems(participant);
                    if (menuItems.length === 0) return null;
                    return (
                      <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                        <button
                          type="button"
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-600 text-gray-400 flex-shrink-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </Dropdown>
                    );
                  })()}
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
                    excludeConversationId={conversationId}
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
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {group.permissions?.can?.perm_invite_members && (
                      <Button
                        className="flex-1 inline-flex items-center justify-center gap-1.5"
                        onClick={() => setAddingMembers(true)}
                      >
                        <UserPlus className="w-4 h-4" /> Thêm thành viên
                      </Button>
                    )}
                    {group.permissions?.can?.perm_share_invite_link && (
                      <Button
                        className="flex-1 inline-flex items-center justify-center gap-1.5"
                        loading={invitingLoading}
                        onClick={handleInvite}
                      >
                        <LinkIcon className="w-4 h-4" /> Mời qua liên kết
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
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
                    {group.is_owner && (
                      <Popconfirm
                        title="Xóa nhóm và toàn bộ tin nhắn vĩnh viễn?"
                        okText="Xóa nhóm"
                        cancelText="Hủy"
                        onConfirm={handleDeleteGroup}
                      >
                        <Button
                          danger
                          loading={deletingGroup}
                          className="flex-1 inline-flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" /> Xóa nhóm
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <ChatBackgroundModal
        conversationId={conversationId}
        show={showBackgroundModal}
        onClose={() => setShowBackgroundModal(false)}
        onBackgroundChanged={onBackgroundChanged}
      />
    </Modal>
  );
}
