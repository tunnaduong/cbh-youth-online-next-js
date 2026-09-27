"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye, Heart, Lock } from "lucide-react";
import PostItem from "@/components/forum/PostItem";

const TABS = [
  { key: "posts", label: "Bài viết" },
  { key: "stories", label: "Tin" },
];

// Story media paths come back either absolute or relative to the API host.
const resolveAssetUrl = (url) => {
  if (typeof url !== "string" || !url.trim()) return null;
  const normalized = url.trim();
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return `${base}/${normalized.replace(/^\/+/, "")}`;
};

// Videos have a rendered first frame; a static <img> can't decode the video
// file itself.
const resolveStoryThumbnail = (story) => {
  if (String(story?.type || "").toLowerCase() === "video" && story?.video_first_frame_url) {
    return resolveAssetUrl(story.video_first_frame_url);
  }
  return resolveAssetUrl(story?.media_url);
};

const storyBackground = (story) => {
  const raw = story?.background_color;
  if (!raw) return "#0f172a";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 1) {
      return `linear-gradient(180deg, ${parsed.join(", ")})`;
    }
    if (Array.isArray(parsed) && parsed.length === 1) return String(parsed[0]);
    if (typeof parsed === "string") return parsed;
  } catch {
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return "#0f172a";
};

function EmptyState({ children }) {
  return (
    <div className="text-center py-12">
      <Image
        src="/images/sad_frog.png"
        alt="Empty state"
        width={136}
        height={136}
        className="mx-auto"
      />
      <p className="text-gray-500 dark:text-gray-400">{children}</p>
    </div>
  );
}

function StoryTile({ story }) {
  const thumbnail = resolveStoryThumbnail(story);

  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800">
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt={story.text_content || "Tin đã lưu trữ"}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center p-2"
          style={{ background: storyBackground(story) }}
        >
          <span className="line-clamp-3 text-center text-sm font-semibold text-white">
            {story.text_content || "Tin"}
          </span>
        </div>
      )}

      {story.is_expired && (
        <span className="absolute top-1.5 right-1.5 rounded-full bg-black/55 p-1 text-white">
          <Lock className="h-3 w-3" />
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[12px] font-medium text-white">
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {story.viewers_count ?? 0}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" />
          {story.reactions_count ?? 0}
        </span>
      </div>
    </div>
  );
}

export default function MyArchivesClient({ archivedTopics, archivedStories }) {
  const [activeTab, setActiveTab] = useState("posts");
  const [topics, setTopics] = useState(archivedTopics);

  useEffect(() => {
    setTopics(archivedTopics);
  }, [archivedTopics]);

  // PostItem does the restore call itself; this only drops the post from the
  // list once it's no longer archived.
  const handleArchiveChange = (postId, archived) => {
    if (!archived) {
      setTopics((prev) => prev.filter((topic) => topic.id !== postId));
    }
  };

  const storyGroups = Array.isArray(archivedStories) ? archivedStories : [];

  return (
    <div className="px-3 xl:min-h-screen py-4 md:max-w-[775px] mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Kho lưu trữ
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Những bài viết và tin chỉ mình bạn thấy.
      </p>

      <div className="mb-6 flex border-b border-gray-200 dark:border-neutral-700">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px flex-1 border-b-2 px-4 py-2.5 text-[15px] transition-colors ${
              activeTab === tab.key
                ? "border-primary-500 font-semibold text-primary-500"
                : "border-transparent font-medium text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "posts" ? (
        topics.length === 0 ? (
          <EmptyState>Chưa có bài viết nào trong kho lưu trữ</EmptyState>
        ) : (
          <div className="flex flex-col">
            {topics.map((topic) => (
              <PostItem
                key={topic.id}
                post={topic}
                onArchiveChange={handleArchiveChange}
              />
            ))}
          </div>
        )
      ) : storyGroups.length === 0 ? (
        <EmptyState>Chưa có tin nào trong kho lưu trữ</EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {storyGroups.map((group) => (
            <div key={group.date}>
              <h2 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                {group.date_human || group.date}
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {(group.stories || []).map((story) => (
                  <StoryTile key={story.id} story={story} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
