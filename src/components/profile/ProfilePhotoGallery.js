"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Images, Video, ChevronDown, Play } from "lucide-react";
import { getUserPhotos, getUserVideos } from "@/app/Api";
import { generatePostSlug } from "@/utils/slugify";

const PAGE_SIZE = 12;

// Media gallery for user profiles (Photos and Videos from visible posts).
// `defaultOpen` controls the accordion's initial state.
export default function ProfilePhotoGallery({
  username,
  profileUsername,
  defaultOpen = false,
}) {
  const [activeMedia, setActiveMedia] = useState("photos"); // "photos" | "videos"
  const [photos, setPhotos] = useState([]);
  const [photosTotal, setPhotosTotal] = useState(0);
  const [photosPage, setPhotosPage] = useState(1);
  const [photosHasMore, setPhotosHasMore] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [photosLoadingMore, setPhotosLoadingMore] = useState(false);

  const [videos, setVideos] = useState([]);
  const [videosTotal, setVideosTotal] = useState(0);
  const [videosPage, setVideosPage] = useState(1);
  const [videosHasMore, setVideosHasMore] = useState(false);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosLoadingMore, setVideosLoadingMore] = useState(false);

  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setPhotosLoading(true);
    setVideosLoading(true);

    // Fetch photos
    getUserPhotos(username, 1, PAGE_SIZE)
      .then((response) => {
        if (cancelled) return;
        setPhotos(response.data?.data || []);
        setPhotosTotal(response.data?.total || 0);
        setPhotosHasMore(!!response.data?.has_more);
        setPhotosPage(1);
      })
      .catch(() => {
        if (!cancelled) setPhotos([]);
      })
      .finally(() => {
        if (!cancelled) setPhotosLoading(false);
      });

    // Fetch videos
    getUserVideos(username, 1, PAGE_SIZE)
      .then((response) => {
        if (cancelled) return;
        setVideos(response.data?.data || []);
        setVideosTotal(response.data?.total || 0);
        setVideosHasMore(!!response.data?.has_more);
        setVideosPage(1);
      })
      .catch(() => {
        if (!cancelled) setVideos([]);
      })
      .finally(() => {
        if (!cancelled) setVideosLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const loadMorePhotos = async () => {
    setPhotosLoadingMore(true);
    try {
      const response = await getUserPhotos(username, photosPage + 1, PAGE_SIZE);
      setPhotos((prev) => [...prev, ...(response.data?.data || [])]);
      setPhotosHasMore(!!response.data?.has_more);
      setPhotosPage((prev) => prev + 1);
    } catch (error) {
      setPhotosHasMore(false);
    } finally {
      setPhotosLoadingMore(false);
    }
  };

  const loadMoreVideos = async () => {
    setVideosLoadingMore(true);
    try {
      const response = await getUserVideos(username, videosPage + 1, PAGE_SIZE);
      setVideos((prev) => [...prev, ...(response.data?.data || [])]);
      setVideosHasMore(!!response.data?.has_more);
      setVideosPage((prev) => prev + 1);
    } catch (error) {
      setVideosHasMore(false);
    } finally {
      setVideosLoadingMore(false);
    }
  };

  // If both are empty and finished loading, keep UI clean
  if (!photosLoading && !videosLoading && photos.length === 0 && videos.length === 0) {
    return null;
  }

  const postHref = (item) =>
    "/" +
    (item.post_anonymous ? "anonymous" : profileUsername || username) +
    "/posts/" +
    generatePostSlug(item.post_id, item.post_title);

  const totalCount = photosTotal + videosTotal;

  return (
    <div className="mt-2 border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-neutral-700 text-sm font-semibold text-gray-700 dark:text-gray-200"
      >
        <span className="flex items-center gap-x-1.5">
          <Images className="w-[16px] h-[16px]" />
          Ảnh &amp; Video{totalCount > 0 && ` (${totalCount})`}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="p-2">
          {/* Photos and Videos Toggle */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-neutral-800 rounded-lg mb-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveMedia("photos")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                activeMedia === "photos"
                  ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <Images className="w-3.5 h-3.5" />
              Ảnh {photosTotal > 0 && `(${photosTotal})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveMedia("videos")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                activeMedia === "videos"
                  ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video {videosTotal > 0 && `(${videosTotal})`}
            </button>
          </div>

          {activeMedia === "photos" ? (
            /* Photos Tab Content */
            photosLoading ? (
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-md bg-gray-100 dark:bg-neutral-800 animate-pulse"
                  />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <p className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                Chưa có ảnh nào
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  {photos.map((photo) => (
                    <Link
                      key={`${photo.post_id}-${photo.id}`}
                      href={postHref(photo)}
                      title={photo.post_title}
                      className="block aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-neutral-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.post_title || "Ảnh bài viết"}
                        loading="lazy"
                        className="media-loading h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                      />
                    </Link>
                  ))}
                </div>

                {photosHasMore && (
                  <button
                    type="button"
                    onClick={loadMorePhotos}
                    disabled={photosLoadingMore}
                    className="mt-2 text-sm font-medium text-primary-500 hover:underline disabled:opacity-60"
                  >
                    {photosLoadingMore ? "Đang tải..." : "Xem thêm ảnh"}
                  </button>
                )}
              </>
            )
          ) : (
            /* Videos Tab Content */
            videosLoading ? (
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-md bg-gray-100 dark:bg-neutral-800 animate-pulse"
                  />
                ))}
              </div>
            ) : videos.length === 0 ? (
              <p className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                Chưa có video nào
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  {videos.map((video) => (
                    <Link
                      key={`${video.post_id}-${video.id}`}
                      href={postHref(video)}
                      title={video.post_title}
                      className="group relative block aspect-square overflow-hidden rounded-md bg-gray-900"
                    >
                      <video
                        src={video.url}
                        preload="metadata"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                          <Play className="h-3.5 w-3.5 fill-white translate-x-0.5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {videosHasMore && (
                  <button
                    type="button"
                    onClick={loadMoreVideos}
                    disabled={videosLoadingMore}
                    className="mt-2 text-sm font-medium text-primary-500 hover:underline disabled:opacity-60"
                  >
                    {videosLoadingMore ? "Đang tải..." : "Xem thêm video"}
                  </button>
                )}
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
