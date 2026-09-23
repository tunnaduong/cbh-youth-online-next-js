"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Images } from "lucide-react";
import { getUserPhotos } from "@/app/Api";
import { generatePostSlug } from "@/utils/slugify";

const PAGE_SIZE = 12;

// Every image from a profile's posts, newest post first. The backend
// (UserController::getUserPhotos) already applies the same visibility rules as
// the posts list, so archived/anonymous posts only contribute photos on the
// author's own profile.
export default function ProfilePhotoGallery({ username, profileUsername }) {
  const [photos, setPhotos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setLoading(true);
    getUserPhotos(username, 1, PAGE_SIZE)
      .then((response) => {
        if (cancelled) return;
        setPhotos(response.data?.data || []);
        setTotal(response.data?.total || 0);
        setHasMore(!!response.data?.has_more);
        setPage(1);
      })
      .catch(() => {
        if (!cancelled) setPhotos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const response = await getUserPhotos(username, page + 1, PAGE_SIZE);
      setPhotos((prev) => [...prev, ...(response.data?.data || [])]);
      setHasMore(!!response.data?.has_more);
      setPage((prev) => prev + 1);
    } catch (error) {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Nothing to show and nothing coming: stay out of the way entirely rather
  // than leaving an empty card in the profile column.
  if (!loading && photos.length === 0) return null;

  const postHref = (photo) =>
    "/" +
    (photo.post_anonymous ? "anonymous" : profileUsername || username) +
    "/posts/" +
    generatePostSlug(photo.post_id, photo.post_title);

  return (
    <div className="mt-2">
      <div className="mb-2 flex items-center gap-x-1.5 text-gray-500 dark:text-neutral-400">
        <Images className="w-[18px] h-[18px]" />
        <span className="text-sm font-semibold">Thư viện ảnh</span>
        {total > 0 && <span className="text-sm">({total})</span>}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-md bg-gray-100 dark:bg-neutral-800 animate-pulse"
            />
          ))}
        </div>
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
                  className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                />
              </Link>
            ))}
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-2 text-sm font-medium text-primary-500 hover:underline disabled:opacity-60"
            >
              {loadingMore ? "Đang tải..." : "Xem thêm ảnh"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
