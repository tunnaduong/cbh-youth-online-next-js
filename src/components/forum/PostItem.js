"use client";

import Link from "next/link";
import { useAuthContext } from "@/contexts/Support";
// import { router, usePage } from "@inertiajs/react"; // TODO: Replace with Next.js equivalent
import {
  ArrowUpOutline,
  ArrowDownOutline,
  Bookmark,
  EyeOutline,
  ChatboxOutline,
} from "react-ionicons";
import { generatePostSlug } from "@/utils/slugify";
import { ReactPhotoCollage } from "react-photo-collage";
import VerifiedBadge from "@/components/ui/Badges";
import getCollageSetting from "@/utils/getCollageSetting";
import { useState, useEffect } from "react";
import { Button, ConfigProvider, message, Tooltip, Dropdown, Modal } from "antd";
import { useRouter } from "@bprogress/next/app";
import {
  savePost as savePostApi,
  unsavePost as unsavePostApi,
  deletePost,
} from "@/app/Api";
import {
  MoreHorizontal,
  Share,
  Edit,
  Trash,
  Flag,
} from "lucide-react";
import { usePostRefresh } from "@/contexts/PostRefreshContext";
import CreatePostModal from "../modals/CreatePostModal";

export default function PostItem({ post, single = false, onVote, onRefresh = null }) {
  const { currentUser } = useAuthContext();
  const [showFullContent, setShowFullContent] = useState(false);
  const [isSaved, setIsSaved] = useState(!!(post.is_saved || post.saved));
  const maxLength = 300; // Số ký tự tối đa trước khi truncate
  const myVote =
    post.votes?.find((v) => v.username === currentUser?.username)?.vote_value ||
    0;
  const votesCount =
    post?.votes?.reduce((sum, v) => sum + v.vote_value, 0) || 0;
  const router = useRouter();

  const { triggerRefresh } = usePostRefresh();
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    setIsSaved(!!(post.is_saved || post.saved));
  }, [post.is_saved, post.saved]);

  const toggleShowFullContent = (e) => {
    e.preventDefault();
    setShowFullContent(!showFullContent);
  };

  const savePost = async (topicId) => {
    try {
      await savePostApi(topicId);
    } catch (error) {
      // If the post is already saved, we can consider this a success
      if (error?.response?.data?.message?.includes("already saved")) {
        return; // Don't throw error for already saved posts
      }
      throw error;
    }
  };

  const unsavePost = async (topicId) => {
    try {
      await unsavePostApi(topicId);
    } catch (error) {
      throw error;
    }
  };

  const handleSavePost = async () => {
    if (!currentUser) {
      router.push(
        "/login?continue=" + encodeURIComponent(window.location.href)
      );
      message.error("Bạn cần đăng nhập để thực hiện hành động này");
      return;
    }

    const newSavedStatus = !isSaved;
    setIsSaved(newSavedStatus);

    try {
      if (newSavedStatus) {
        message.success("Đã lưu bài viết");
        await savePost(post.id);
      } else {
        await unsavePost(post.id);
      }
    } catch (error) {
      // Revert UI if API call fails
      setIsSaved(!newSavedStatus);

      // Handle specific error cases
      if (error?.response?.data?.message) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes("already saved")) {
          message.info("Bài viết đã được lưu trước đó");
        } else {
          message.error(errorMessage);
        }
      } else {
        message.error("Có lỗi xảy ra khi lưu/bỏ lưu");
      }
    }
  };

  const truncateHtml = (html, maxLength) => {
    // Tạo một temporary div để parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Lấy text content (không có HTML tags)
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    if (textContent.length <= maxLength) {
      return html;
    }

    // Truncate text và thêm dấu ...
    const truncatedText = textContent.substring(0, maxLength);
    const lastSpaceIndex = truncatedText.lastIndexOf(" ");
    const finalText =
      lastSpaceIndex > 0
        ? truncatedText.substring(0, lastSpaceIndex)
        : truncatedText;

    // Trả về HTML đã được truncate (giữ lại formatting cơ bản)
    tempDiv.textContent = finalText + "...";
    return tempDiv.innerHTML;
  };

  // Helper function to wrap iframes in responsive containers
  const wrapIframes = (html) => {
    if (!html) return html;

    // Regex to match iframe tags
    const iframeRegex = /<iframe[^>]+src="([^"]+)"[^>]*>.*?<\/iframe>/gis;

    return html.replace(iframeRegex, (match) => {
      // Check if iframe is from whitelisted sources (YouTube, Vimeo)
      const srcMatch = match.match(/src="([^"]+)"/);
      if (srcMatch) {
        const src = srcMatch[1];
        const isWhitelisted =
          /^(https?:)?\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//.test(
            src
          );

        if (isWhitelisted) {
          // Wrap in responsive container
          return `<div class="iframe-wrapper">${match}</div>`;
        }
      }

      return match; // Return original if not whitelisted
    });
  };

  const getContentWithReadMore = () => {
    const textContent = post.content?.replace(/<[^>]*>/g, ""); // Remove HTML tags để đếm text
    const needsTruncation = textContent?.length > maxLength;

    let content;
    if (showFullContent) {
      content = post.content;
    } else {
      content = truncateHtml(post.content, maxLength);
    }

    // Wrap iframes in responsive containers
    content = wrapIframes(content);

    if (!needsTruncation) {
      return content;
    }

    const readMoreLink = showFullContent
      ? ' <span class="text-[var(--tw-prose-body)] dark:text-[rgb(209_213_219)] hover:underline text-base font-medium read-more-link cursor-pointer">Thu gọn</span>'
      : ' <span class="text-[var(--tw-prose-body)] dark:text-[rgb(209_213_219)] hover:underline text-base font-medium read-more-link cursor-pointer">Xem thêm</span>';

    return content + readMoreLink;
  };

  const setting = {
    ...getCollageSetting(post.image_urls),
    photos: post.image_urls?.map((url) => ({ source: url })),
    showNumOfRemainingPhotos: true,
  };

  const handleShare = () => {
    const url =
      window.location.origin +
      "/" +
      post.author.username +
      "/posts/" +
      generatePostSlug(post.id, post.title) + "?utm_source=desktop_share";
    navigator.clipboard.writeText(url);
    message.success("Đã sao chép liên kết vào bộ nhớ tạm");
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Xác nhận xóa bài viết",
      content:
        "Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await deletePost(post.id);
          message.success("Đã xóa bài viết");

          triggerRefresh();
          router.push("/");
          router.refresh();
        } catch (error) {
          message.error("Có lỗi xảy ra khi xóa bài viết");
        }
      },
    });
  };

  const handleReport = () => {
    message.info("Tính năng đang phát triển");
  };

  const menuItems = [
    {
      key: "share",
      label: "Chia sẻ",
      icon: <Share size={16} />,
      onClick: handleShare,
    },
    {
      key: "report",
      label: "Báo cáo bài viết",
      icon: <Flag size={16} />,
      onClick: handleReport,
    },
  ];

  if (
    currentUser &&
    (currentUser.username === post.author.username ||
      currentUser.role === "admin" ||
      post.is_owner)
  ) {
    menuItems.push({
      key: "edit",
      label: "Chỉnh sửa",
      icon: <Edit size={16} />,
      onClick: handleEdit,
    });
    menuItems.push({
      key: "delete",
      label: "Xóa",
      icon: <Trash size={16} />,
      danger: true,
      onClick: handleDelete,
    });
  }

  return (
    <div
      className="px-1.5 md:px-0 md:max-w-[775px] mx-auto w-full"
      key={post.id}
    >
      <div className="post-container-post post-container mb-4 shadow-lg rounded-xl !p-6 bg-white flex flex-col-reverse md:flex-row">
        <div className="min-w-[72px]">
          <div className="sticky-reaction-bar items-center md:!mt-1 mt-3 gap-x-3 flex md:!flex-col flex-row md:ml-[-20px] text-[13px] font-semibold text-gray-400">
            <Button
              size="small"
              className={`w-8 px-2 rounded-full border-0 ${myVote === 1 ? "text-primary-500" : "text-gray-400"
                }`}
              onClick={() => onVote && onVote(post.id, myVote === 1 ? 0 : 1)}
            >
              <ArrowUpOutline height="26px" width="26px" color="currentColor" />
            </Button>
            <span
              className={`select-none text-lg vote-count ${myVote === 1
                ? "text-primary-500"
                : myVote === -1
                  ? "text-red-600"
                  : "text-gray-400"
                }`}
            >
              {votesCount}
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
                className={`w-8 px-2 hover:!text-red-500 hover:!bg-red-50 dark:hover:!bg-[rgba(69,10,10,0.2)] rounded-full border-0
                downvote-button ${myVote === -1 ? "text-red-600" : "text-gray-400"
                  }`}
                onClick={() =>
                  onVote && onVote(post.id, myVote === -1 ? 0 : -1)
                }
              >
                <ArrowDownOutline
                  height="26px"
                  width="26px"
                  color="currentColor"
                />
              </Button>
            </ConfigProvider>
            <Button
              size="small"
              onClick={handleSavePost}
              aria-label={isSaved ? "Bỏ lưu bài viết" : "Lưu bài viết"}
              className={`border-0 rounded-lg w-[33.6px] h-[33.6px] md:mt-3 flex items-center justify-center dark:bg-neutral-500 dark:hover:!bg-neutral-600 ${isSaved
                ? "bg-green-100 hover:!bg-green-200"
                : "bg-[#EAEAEA] hover:!bg-[#e1e2e4]"
                }`}
            >
              <Bookmark
                height="20px"
                width="20px"
                color={isSaved ? "#16a34a" : "#9ca3af"}
              />
            </Button>
            <div className="flex-1"></div>
            {/* Mobile view */}
            <div className="flex-1 flex md:hidden flex-row-reverse items-center text-gray-500">
              <span>
                {(post.view_count || post.views_count || post.views) ?? 0}
              </span>
              <EyeOutline
                height="20px"
                width="20px"
                color={"#9ca3af"}
                className="ml-2 mr-1"
              />
              {!single ? (
                <Link
                  href={
                    "/" +
                    (post.anonymous ? "anonymous" : post.author.username) +
                    "/posts/" +
                    generatePostSlug(post.id, post.title)
                  }
                  className="flex flex-row-reverse items-center"
                >
                  <span className="flex flex-row-reverse items-center">
                    <span>{post.reply_count || post.comments}</span>
                    <ChatboxOutline
                      height="20px"
                      width="20px"
                      color={"#9ca3af"}
                      className="mr-1"
                    />
                  </span>
                </Link>
              ) : (
                <span className="flex flex-row-reverse items-center">
                  <span>{post.reply_count || post.comments}</span>
                  <ChatboxOutline
                    height="20px"
                    width="20px"
                    color={"#9ca3af"}
                    className="mr-1"
                  />
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden break-words">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              {single ? (
                <h1 className="text-xl font-semibold mb-1 dark:text-neutral-300">
                  {post.title || (
                    <span className="text-gray-500">(Chưa có tiêu đề)</span>
                  )}
                </h1>
              ) : (
                <Link
                  href={
                    "/" +
                    (post.anonymous ? "anonymous" : post.author.username) +
                    "/posts/" +
                    generatePostSlug(post.id, post.title)
                  }
                >
                  <h1 className="text-xl font-semibold mb-1 dark:text-neutral-300">
                    {post.title || (
                      <span className="text-gray-500">Chưa có tiêu đề</span>
                    )}
                  </h1>
                </Link>
              )}
            </div>
            <div className="pt-1">
              <Dropdown
                menu={{ items: menuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-neutral-400">
                  <MoreHorizontal size={20} />
                </button>
              </Dropdown>
            </div>
          </div>
          <div
            className="text-base max-w-[600px] overflow-wrap prose mt-[0.75em]"
            dangerouslySetInnerHTML={{
              __html:
                !post.content || post.content.trim() === ""
                  ? '<span style="color: #9ca3af;">(Chưa có nội dung)</span>'
                  : single
                    ? wrapIframes(post.content)
                    : getContentWithReadMore(),
            }}
            onClick={(e) => {
              if (!single && e.target.classList.contains("read-more-link")) {
                toggleShowFullContent(e);
              }
            }}
          />

          {post.document_urls && post.document_urls.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.document_urls?.map((doc, index) => {
                const fileName = doc.split("/").pop();
                const fileNameWithoutExt = fileName
                  .split(".")
                  .slice(0, -1)
                  .join(".");
                const fileExt = fileName.split(".").pop().toLowerCase();
                const iconColor =
                  fileExt === "pdf"
                    ? "text-red-500"
                    : fileExt === "doc" || fileExt === "docx"
                      ? "text-blue-500"
                      : "text-gray-500";

                // Get file size from post.document_sizes if available
                const fileSize =
                  post.document_sizes && post.document_sizes[index]
                    ? (post.document_sizes[index] / (1024 * 1024)).toFixed(2) +
                    " MB"
                    : fileExt.toUpperCase();

                return (
                  <Tooltip key={index} title={fileName}>
                    <a
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-gray-100 dark:bg-neutral-700 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
                      style={{ height: "150px", width: "150px" }}
                    >
                      <div className="flex flex-col items-center justify-center w-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`h-12 w-12 mb-2 ${iconColor}`}
                        >
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="text-xs text-center line-clamp-2 w-full px-2 mb-1 dark:text-neutral-300">
                          {fileNameWithoutExt.slice(25)}
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                          {fileSize}
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                          {fileExt.toUpperCase()}
                        </span>
                      </div>
                    </a>
                  </Tooltip>
                );
              })}
            </div>
          )}

          {post.image_urls?.length != 0 && (
            <div className="square-wrapper mt-3 rounded overflow-hidden">
              <ReactPhotoCollage {...setting} />
            </div>
          )}
          <hr className="!my-5 border-t-2" />
          <div className="flex-row flex text-[13px] items-center">
            {post.anonymous ? (
              <>
                <span className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                  <div className="border rounded-full aspect-square h-full w-full bg-[#e9f1e9] dark:bg-[#1d281b] dark:!border-gray-500 flex items-center justify-center">
                    <span className="text-lg font-bold text-white dark:text-gray-300">
                      ?
                    </span>
                  </div>
                </span>
                <span className="text-gray-500 hidden md:block ml-2">
                  Đăng bởi
                </span>
                <span className="flex flex-row items-center ml-2 md:ml-1 text-[#319527] font-bold">
                  Người dùng ẩn danh
                </span>
              </>
            ) : (
              <>
                <Link href={"/" + post.author.username}>
                  <span className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                    <img
                      className="border rounded-full aspect-square h-full w-full"
                      alt={post.author.username + " avatar"}
                      src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${post.author.username}/avatar`}
                    />
                  </span>
                </Link>
                <span className="text-gray-500 hidden md:block ml-2">
                  Đăng bởi
                </span>
                <Link
                  className="flex flex-row items-center ml-2 md:ml-1 text-[#319527] hover:text-[#319527] font-bold hover:underline inline-verified truncate"
                  href={"/" + post.author.username}
                >
                  <span className="inline-verified__text truncate">
                    {post.author?.profile_name ||
                      post.author.profile?.profile_name}
                  </span>
                  {(post.author.verified ||
                    post.author?.profile?.verified === true ||
                    post.author?.profile?.verified === "1") && (
                      <VerifiedBadge className="inline-verified__badge" />
                    )}
                </Link>
              </>
            )}
            <span className="mb-2 ml-0.5 text-sm text-gray-500">.</span>
            <span className="ml-0.5 text-gray-500 shrink-0">
              {post.created_at_human || post.created_at || post.time}
            </span>
            {/* Desktop view */}
            <div className="flex-1 flex-row-reverse items-center text-gray-500 hidden md:flex">
              <span>
                {(post.view_count || post.views_count || post.views) ?? 0}
              </span>
              <EyeOutline
                height="20px"
                width="20px"
                color={"#9ca3af"}
                className="ml-2 mr-1"
              />
              {!single ? (
                <Link
                  href={
                    "/" +
                    (post.anonymous ? "anonymous" : post.author.username) +
                    "/posts/" +
                    generatePostSlug(post.id, post.title)
                  }
                  className="flex flex-row-reverse items-center"
                >
                  <span>{post.reply_count || post.comments}</span>
                  <ChatboxOutline
                    height="20px"
                    width="20px"
                    color={"#9ca3af"}
                    className="mr-1"
                  />
                </Link>
              ) : (
                <span className="flex flex-row-reverse items-center">
                  <span>{post.reply_count || post.comments}</span>
                  <ChatboxOutline
                    height="20px"
                    width="20px"
                    color={"#9ca3af"}
                    className="mr-1"
                  />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <CreatePostModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        isEditMode={true}
        postData={post}
        onSuccess={() => {
          if (onRefresh) {
            onRefresh();
          } else {
            router.refresh();
          }
          triggerRefresh();
        }}
      />
    </div>
  );
}
