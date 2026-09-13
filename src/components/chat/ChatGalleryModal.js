"use client";

import { useEffect, useState, useCallback } from "react";
import moment from "moment";
import { Dropdown, message as antdMessage } from "antd";
import Modal from "@/components/ui/Modal";
import { X, FileText, Link as LinkIcon, PlayCircle, MoreVertical, Share2, Download, ExternalLink, Copy } from "lucide-react";
import { getConversationMedia, getPublicChatMedia } from "@/app/Api";
import { useChatContext } from "@/contexts/Support";
import ChatMediaLightbox from "./ChatMediaLightbox";

// Same cross-origin-safe download used by the lightbox.
async function downloadFile(url, filename) {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

const TABS = [
  { key: "image", label: "Ảnh/Video" },
  { key: "file", label: "Tệp" },
  { key: "link", label: "Liên kết" },
];

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  try {
    moment.locale("vi");
    return moment(timestamp).fromNow();
  } catch {
    return "";
  }
};

// Messenger-style per-conversation "Gallery": every photo/video, file, or
// link ever shared in this chat, in three paginated tabs. Mirrors
// GroupInfoModal's modal shell and reuses the existing ChatMediaLightbox
// (already supports a { list, index } gallery shape) for the Photos/Videos
// tab instead of building a new viewer.
export default function ChatGalleryModal({ conversationId, isPublic = false, show, onClose }) {
  const { setHighlightMessageId } = useChatContext();
  const [activeTab, setActiveTab] = useState("image");
  const [itemsByTab, setItemsByTab] = useState({ image: [], file: [], link: [] });
  const [pageByTab, setPageByTab] = useState({ image: 1, file: 1, link: 1 });
  const [lastPageByTab, setLastPageByTab] = useState({ image: 1, file: 1, link: 1 });
  const [loading, setLoading] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState(null);

  const fetchMedia = useCallback(
    (type, page) =>
      isPublic ? getPublicChatMedia(type, page) : getConversationMedia(conversationId, type, page),
    [isPublic, conversationId]
  );

  const fetchTab = useCallback(
    async (tab, page = 1) => {
      if (!isPublic && !conversationId) return;
      setLoading(true);
      try {
        if (tab === "image") {
          const [imagesRes, videosRes] = await Promise.all([
            fetchMedia("image", page),
            fetchMedia("video", page),
          ]);
          const merged = [...(imagesRes.data.data || []), ...(videosRes.data.data || [])].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setItemsByTab((prev) => ({
            ...prev,
            image: page === 1 ? merged : [...prev.image, ...merged],
          }));
          setLastPageByTab((prev) => ({
            ...prev,
            image: Math.max(imagesRes.data.last_page, videosRes.data.last_page),
          }));
        } else {
          const res = await fetchMedia(tab, page);
          setItemsByTab((prev) => ({
            ...prev,
            [tab]: page === 1 ? res.data.data : [...prev[tab], ...res.data.data],
          }));
          setLastPageByTab((prev) => ({ ...prev, [tab]: res.data.last_page }));
        }
        setPageByTab((prev) => ({ ...prev, [tab]: page }));
      } catch (error) {
        console.error("[ChatGalleryModal] failed to load media:", error);
      } finally {
        setLoading(false);
      }
    },
    [isPublic, conversationId, fetchMedia]
  );

  // Reset and fetch fresh whenever the modal is (re)opened for a conversation.
  useEffect(() => {
    if (!show || (!isPublic && !conversationId)) return;
    setActiveTab("image");
    setItemsByTab({ image: [], file: [], link: [] });
    setPageByTab({ image: 1, file: 1, link: 1 });
    setLastPageByTab({ image: 1, file: 1, link: 1 });
    fetchTab("image", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, conversationId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (itemsByTab[tab].length === 0) fetchTab(tab, 1);
  };

  const loadMore = () => {
    if (loading || pageByTab[activeTab] >= lastPageByTab[activeTab]) return;
    fetchTab(activeTab, pageByTab[activeTab] + 1);
  };

  const currentItems = itemsByTab[activeTab];
  const hasMore = pageByTab[activeTab] < lastPageByTab[activeTab];

  const openLightbox = (index) => {
    const images = itemsByTab.image;
    setLightboxMedia({
      list: images.map((m) => ({
        type: m.type,
        url: m.file_url,
        poster: m.thumbnail_url,
        sender: m.user,
        createdAt: m.created_at,
        messageId: m.message_id,
      })),
      index,
    });
  };

  // Jump back to where this photo/video was actually sent, so it's not just
  // a floating attachment with no context. Only scrolls if the message is
  // already in the currently loaded page of the conversation (same
  // limitation as other highlightMessageId jumps in this app).
  const handleJumpToMessage = (messageId) => {
    setLightboxMedia(null);
    onClose();
    setHighlightMessageId(messageId);
  };

  return (
    <>
      {/* Hide the modal itself while the lightbox is open, rather than relying
          on z-index to keep it from covering the image - headlessui's Dialog
          portals its content in a way that can still paint over a plain
          fixed-position sibling like ChatMediaLightbox regardless of z-index. */}
      <Modal show={show && !lightboxMedia} onClose={onClose} maxWidth="lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">Bộ sưu tập</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-600 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex border-b dark:border-neutral-600 mb-3">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-[#319527] text-[#319527] dark:text-[#6bcf60]"
                    : "border-transparent text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {currentItems.length === 0 && !loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                Chưa có gì ở đây.
              </p>
            ) : activeTab === "image" ? (
              <div className="grid grid-cols-3 gap-1">
                {currentItems.map((item, index) => (
                  <button
                    key={`${item.message_id}-${index}`}
                    type="button"
                    className="relative aspect-square bg-gray-100 dark:bg-neutral-700 overflow-hidden"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={item.thumbnail_url || item.file_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle className="w-7 h-7 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : activeTab === "file" ? (
              <div className="flex flex-col gap-1">
                {currentItems.map((item, index) => (
                  <div
                    key={`${item.message_id}-${index}`}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <FileText className="w-6 h-6 flex-shrink-0 text-gray-500 dark:text-gray-300" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900 dark:text-white truncate">
                          {item.content || "Tệp đính kèm"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(item.created_at)}
                        </p>
                      </div>
                    </a>
                    <Dropdown
                      trigger={["click"]}
                      menu={{
                        items: [
                          {
                            key: "share",
                            label: "Chia sẻ",
                            icon: <Share2 className="w-4 h-4" />,
                            onClick: () => {
                              if (typeof navigator !== "undefined" && navigator.share) {
                                navigator.share({ url: item.file_url }).catch(() => {});
                              } else {
                                downloadFile(item.file_url, item.content).catch(() =>
                                  window.open(item.file_url, "_blank")
                                );
                              }
                            },
                          },
                          {
                            key: "download",
                            label: "Tải xuống",
                            icon: <Download className="w-4 h-4" />,
                            onClick: () =>
                              downloadFile(item.file_url, item.content).catch(() =>
                                window.open(item.file_url, "_blank")
                              ),
                          },
                          {
                            key: "jump",
                            label: "Xem tin nhắn gốc",
                            icon: <ExternalLink className="w-4 h-4" />,
                            onClick: () => handleJumpToMessage(item.message_id),
                          },
                        ],
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-400 flex-shrink-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </Dropdown>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {currentItems.map((item, index) => (
                  <div
                    key={`${item.message_id}-${index}`}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <LinkIcon className="w-5 h-5 flex-shrink-0 text-gray-500 dark:text-gray-300" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#319527] dark:text-[#6bcf60] truncate">{item.url}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.user?.profile_name || item.user?.username} · {formatTimestamp(item.created_at)}
                        </p>
                      </div>
                    </a>
                    <Dropdown
                      trigger={["click"]}
                      menu={{
                        items: [
                          {
                            key: "open",
                            label: "Mở liên kết",
                            icon: <ExternalLink className="w-4 h-4" />,
                            onClick: () => window.open(item.url, "_blank"),
                          },
                          {
                            key: "copy",
                            label: "Sao chép liên kết",
                            icon: <Copy className="w-4 h-4" />,
                            onClick: () => {
                              navigator.clipboard?.writeText(item.url);
                              antdMessage.success("Đã sao chép");
                            },
                          },
                          {
                            key: "share",
                            label: "Chia sẻ",
                            icon: <Share2 className="w-4 h-4" />,
                            onClick: () => {
                              if (typeof navigator !== "undefined" && navigator.share) {
                                navigator.share({ url: item.url }).catch(() => {});
                              } else {
                                navigator.clipboard?.writeText(item.url);
                                antdMessage.success("Đã sao chép");
                              }
                            },
                          },
                          {
                            key: "jump",
                            label: "Xem tin nhắn gốc",
                            icon: <ExternalLink className="w-4 h-4" />,
                            onClick: () => handleJumpToMessage(item.message_id),
                          },
                        ],
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-400 flex-shrink-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </Dropdown>
                  </div>
                ))}
              </div>
            )}

            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="w-full mt-2 py-2 text-sm text-[#319527] dark:text-[#6bcf60] hover:underline disabled:opacity-50"
              >
                {loading ? "Đang tải..." : "Tải thêm"}
              </button>
            )}
          </div>
        </div>
      </Modal>

      <ChatMediaLightbox
        media={lightboxMedia}
        onClose={() => setLightboxMedia(null)}
        onJumpToMessage={handleJumpToMessage}
      />
    </>
  );
}
