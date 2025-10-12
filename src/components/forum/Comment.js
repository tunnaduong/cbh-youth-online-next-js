"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthContext } from "@/contexts/Support";
// // import { usePage, router } from "@inertiajs/react"; // TODO: Replace with Next.js equivalent // TODO: Replace with Next.js equivalent
import { Button, ConfigProvider, Input, message, Dropdown, Modal } from "antd";
import { voteOnComment, destroyCommentVote } from "@/app/Api";
import {
  MessageCircle,
  Edit,
  Check,
  X,
  Share,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { FaEdit, FaEye } from "react-icons/fa";
import { IoArrowUpSharp, IoArrowDownSharp } from "react-icons/io5";
import { CommentInput } from "./CommentInput";
import { useRouter } from "@bprogress/next/app";
import Badges from "../ui/Badges";
import MarkdownRenderer from "../ui/MarkdownRenderer";

export default function Comment({
  comment,
  level = 0,
  onEdit,
  onReply,
  onDelete,
  userAvatar,
  getTimeDisplay,
  isLast,
  parentConnectorHovered,
}) {
  const { currentUser } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || "");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isConnectorHovered, setIsConnectorHovered] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localVotes, setLocalVotes] = useState(comment.votes || []);
  const router = useRouter();

  const handleSaveEdit = async () => {
    if (comment.isPending) return;

    try {
      // Call parent callback to handle the API call and state update
      if (onEdit) {
        await onEdit(comment.id, editContent);
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating comment:", error);
      message.error("Có lỗi xảy ra khi cập nhật bình luận. Vui lòng thử lại.");
    }
  };

  const handleCancelEdit = () => {
    // Use raw markdown/text for editing, not HTML
    setEditContent(comment.content || "");
    setIsEditing(false);
    setIsPreviewMode(false);
  };

  const handleTogglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const handleSubmitReply = (content, isAnonymous = false) => {
    if (comment.isPending) return;
    if (onReply) {
      onReply(comment.id, content, isAnonymous);
    }
    setIsReplying(false);
  };

  const handleCancelReply = () => {
    setIsReplying(false);
  };

  const handleVote = async (voteValue) => {
    if (comment.isPending) return;
    if (!currentUser) {
      message.error("Bạn cần đăng nhập để thực hiện hành động này");
      router.push(
        "/login?continue=" + encodeURIComponent(window.location.href)
      );
      return;
    }

    const username = currentUser.username;
    const existingVote = localVotes.find((vote) => vote.username === username);

    // Optimistically update the UI
    let newVotes = [...localVotes];

    if (existingVote) {
      if (existingVote.vote_value === voteValue) {
        // User is undoing their vote
        newVotes = localVotes.filter((vote) => vote.username !== username);
      } else {
        // User is changing their vote
        newVotes = localVotes.map((vote) =>
          vote.username === username ? { ...vote, vote_value: voteValue } : vote
        );
      }
    } else {
      // User is voting for the first time
      newVotes = [...localVotes, { username, vote_value: voteValue }];
    }

    setLocalVotes(newVotes);

    try {
      if (existingVote && existingVote.vote_value === voteValue) {
        // User is undoing their vote - remove the vote
        await destroyCommentVote(comment.id);
      } else {
        // User is voting or changing their vote
        await voteOnComment(comment.id, { vote_value: voteValue });
      }
    } catch (error) {
      // Revert the optimistic update on error
      setLocalVotes(localVotes);
      message.error("Có lỗi xảy ra khi vote bình luận. Vui lòng thử lại.");
      console.error("Error voting on comment:", error);
    }
  };

  const voteCount = localVotes
    ? localVotes.reduce((acc, vote) => acc + vote.vote_value, 0)
    : 0;

  const userVote = currentUser
    ? localVotes.find((vote) => vote.username === currentUser.username)
    : null;

  const userVoteValue = userVote ? userVote.vote_value : 0;

  const CollapseIcon = () => (
    <ChevronDown className="w-4 h-4 dark:text-neutral-300" />
  );

  const ExpandIcon = () => (
    <ChevronRight className="w-4 h-4 dark:text-neutral-300" />
  );

  const UpvoteIcon = () => <IoArrowUpSharp size={16} />;
  const DownvoteIcon = () => <IoArrowDownSharp size={16} />;

  const canDelete =
    !!currentUser && currentUser.id === comment.author.id && !comment.isPending;

  const confirmDelete = () => {
    if (!currentUser) {
      message.error("Bạn cần đăng nhập để thực hiện hành động này");
      router.push(
        "/login?continue=" + encodeURIComponent(window.location.href)
      );
      return;
    }
    if (!canDelete) return;

    Modal.confirm({
      title: "Xác nhận xóa bình luận",
      content: "Bạn có chắc chắn muốn xóa bình luận này không?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: () => {
        if (onDelete) onDelete(comment.id);
      },
    });
  };

  const menuItems = [
    {
      key: "delete",
      label: "Xóa bình luận",
      danger: true,
      onClick: confirmDelete,
    },
  ];

  return (
    <div className="relative">
      {/* Reddit-style curved connector lines for nested comments */}
      {comment.replies?.length > 0 && !isCollapsed && (
        <div
          className={`absolute ${
            isConnectorHovered
              ? "bg-black dark:!bg-white"
              : "bg-gray-200 dark:!bg-gray-600"
          }`}
          style={{
            left: "20px",
            top: "40px",
            height: "100%",
            width: "1px",
          }}
          onMouseEnter={() => setIsConnectorHovered(true)}
          onMouseLeave={() => setIsConnectorHovered(false)}
        />
      )}

      {level > 0 && (
        <div className="absolute" style={{ left: "-12px", top: "7px" }}>
          {/* Curved connector like Reddit */}
          <div
            className={`box-border h-md border-0 border-tone-4 border-solid border-b-[1px] cursor-pointer w-[12px] border-s-[1px] rounded-es-[12px] ${
              parentConnectorHovered
                ? "border-black dark:!border-white"
                : "border-gray-200 dark:!border-gray-600"
            }`}
            style={{ height: "14px" }}
          />
        </div>
      )}

      {isLast && (
        <div
          className="absolute bg-background"
          style={{ left: "-12px", top: "12px", height: "128%", width: "1px" }}
        />
      )}

      {/* Comment content */}
      <div className={"mb-4"}>
        <div className="flex gap-3">
          {/* Avatar or Collapse Button */}
          <div className="flex-shrink-0">
            {isCollapsed ? (
              <div
                className="w-10 h-10 rounded-full bg-white dark:!bg-[#3C3C3C] flex items-center justify-center cursor-pointer border border-gray-200 dark:!border-gray-600"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <ExpandIcon />
              </div>
            ) : comment.is_anonymous ? (
              <div className="w-10 h-10 rounded-full bg-[#e9f1e9] dark:bg-[#1d281b] flex items-center justify-center border border-gray-200">
                <span className="text-2xl text-white font-medium">?</span>
              </div>
            ) : (
              <Link href={`/${comment.author.username}`}>
                <img
                  src={`https://api.chuyenbienhoa.com/v1.0/users/${comment.author.username}/avatar`}
                  alt={`${comment.author.profile_name}'s avatar`}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              </Link>
            )}
          </div>

          {/* Comment text or edit form */}
          <div className="flex-1 min-w-0" style={{ paddingTop: "8px" }}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              {comment.is_anonymous ? (
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Người dùng ẩn danh
                </span>
              ) : (
                <Link href={`/${comment.author.username}`}>
                  <span className="inline">
                    <span className="line-clamp-1 inline dark:text-white">
                      {comment.author.profile_name}
                    </span>
                    {comment.author.verified && (
                      <Badges className="ml-1 mb-[1.9px]" />
                    )}
                  </span>
                </Link>
              )}
              <span className="text-gray-400">•</span>
              <span className="text-gray-500 dark:!text-gray-400 text-sm shrink-0">
                {comment.created_at}
                {comment.updated_at &&
                  comment.updated_at !== comment.created_at && (
                    <span className="ml-1">(đã chỉnh sửa)</span>
                  )}
              </span>
            </div>

            {/* Comment text or edit form */}
            {isEditing ? (
              <div className="space-y-2 mb-3">
                {isPreviewMode ? (
                  <div className="min-h-[60px] p-2 text-sm bg-gray-50 dark:bg-gray-800 rounded border">
                    <MarkdownRenderer content={editContent} />
                  </div>
                ) : (
                  <Input.TextArea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[60px] p-2 text-sm"
                    placeholder="Sửa bình luận của bạn..."
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    size="small"
                    type="primary"
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Lưu
                  </Button>
                  <Button
                    size="small"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Hủy
                  </Button>
                  <Button
                    size="small"
                    onClick={handleTogglePreview}
                    className={`flex items-center gap-1 ${
                      isPreviewMode
                        ? "bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300"
                        : ""
                    }`}
                  >
                    {isPreviewMode ? (
                      <FaEdit className="w-3 h-3" />
                    ) : (
                      <FaEye className="w-3 h-3" />
                    )}

                    {isPreviewMode ? "Chỉnh sửa" : "Xem trước"}
                  </Button>
                </div>
              </div>
            ) : (
              !isCollapsed && (
                <div className="relative">
                  <div
                    className="text-gray-700 dark:text-gray-300 text-sm mb-1 prose custom-prose markdown-preview dark:prose-invert flex flex-col"
                    dangerouslySetInnerHTML={{ __html: comment.comment }}
                  />
                  {/* Show optimistic update indicator */}
                  {comment.isOptimistic && (
                    <div className="absolute top-0 right-0 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                      Đang cập nhật...
                    </div>
                  )}
                </div>
              )
            )}

            {/* Actions */}
            {!isCollapsed && !comment.isPending && (
              <div
                className="flex items-center gap-1 relative"
                style={{ marginLeft: "-10px" }}
              >
                {comment.replies?.length > 0 && (
                  <div
                    className="absolute cursor-pointer z-10"
                    style={{ left: "-31px", top: "8px" }}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                  >
                    <div className="bg-white dark:!bg-[#3C3C3C] rounded-full border border-gray-200 dark:!border-gray-600">
                      <CollapseIcon />
                    </div>
                  </div>
                )}

                {/* Vote buttons */}
                <Button
                  size="small"
                  className={`h-8 px-2 rounded-full border-0 ${
                    userVoteValue === 1
                      ? "text-primary-500"
                      : "text-gray-500 hover:!text-primary-500"
                  }`}
                  onClick={() => handleVote(1)}
                >
                  <UpvoteIcon />
                </Button>
                <span
                  className={`text-xs font-medium min-w-[1rem] text-center ${
                    userVoteValue === 1
                      ? "text-primary-500"
                      : userVoteValue === -1
                      ? "text-red-600"
                      : "text-gray-500 dark:!text-gray-400"
                  }`}
                >
                  {voteCount}
                </span>
                <ConfigProvider
                  theme={{
                    components: {
                      Button: {
                        colorPrimaryHover: "#df0909",
                        colorPrimaryActive: "#df0909",
                      },
                    },
                  }}
                >
                  <Button
                    size="small"
                    className={`h-8 px-2 text-gray-500 hover:!text-red-500 hover:!bg-red-50 dark:hover:!bg-[rgba(69,10,10,0.2)] rounded-full
                    border-0 ${
                      userVoteValue === -1
                        ? "text-red-600"
                        : "text-gray-500 hover:!text-red-500"
                    }`}
                    onClick={() => handleVote(-1)}
                  >
                    <DownvoteIcon />
                  </Button>
                </ConfigProvider>

                {/* Action buttons */}
                <Button
                  size="small"
                  className="h-8 px-2 text-xs text-gray-500 dark:!text-gray-400 hover:text-gray-700 border-0 rounded-full"
                  onClick={() => {
                    if (!currentUser) {
                      message.error(
                        "Bạn cần đăng nhập để thực hiện hành động này"
                      );
                      router.push(
                        "/login?continue=" +
                          encodeURIComponent(window.location.href)
                      );
                    } else {
                      setIsReplying(!isReplying);
                    }
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Trả lời</span>
                </Button>
                {currentUser && currentUser.id === comment.author.id && (
                  <Button
                    size="small"
                    className="h-8 px-2 text-xs text-gray-500 dark:!text-gray-400 hover:text-gray-700 border-0 rounded-full"
                    onClick={() => {
                      // Use raw markdown/text for editing, not HTML
                      setEditContent(comment.content || "");
                      setIsEditing(!isEditing);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {canDelete && (
                  <Dropdown
                    menu={{ items: menuItems }}
                    trigger={["click"]}
                    placement="bottomLeft"
                  >
                    <Button
                      size="small"
                      className="h-8 px-2 text-xs text-gray-500 dark:!text-gray-400 hover:text-gray-700 border-0 rounded-full"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </Dropdown>
                )}
              </div>
            )}

            {/* Reply Input */}
            {isReplying && !isCollapsed && !comment.isPending && (
              <div className="mt-4">
                <CommentInput
                  placeholder="Nhập trả lời của bạn..."
                  onSubmit={handleSubmitReply}
                  userAvatar={userAvatar}
                  onCancel={handleCancelReply}
                  focus={isReplying}
                />
              </div>
            )}

            {/* Pending state helper text */}
            {comment.isPending && !isCollapsed && (
              <div className="text-sm text-gray-400 mt-2">Đang viết...</div>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies?.length > 0 && !isCollapsed && (
        <div className="ml-8 space-y-0">
          {comment.replies.map((reply, index) => (
            <Comment
              key={reply.id}
              comment={reply}
              isReply={true}
              level={level + 1}
              onEdit={onEdit}
              onReply={onReply}
              onDelete={onDelete}
              userAvatar={userAvatar}
              getTimeDisplay={getTimeDisplay}
              isLast={index === comment.replies.length - 1}
              parentConnectorHovered={isConnectorHovered}
            />
          ))}
        </div>
      )}
    </div>
  );
}
