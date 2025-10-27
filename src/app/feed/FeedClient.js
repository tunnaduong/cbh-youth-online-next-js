"use client";

import HomeLayout from "@/layouts/HomeLayout";
import PostItem from "@/components/forum/PostItem";
import { useState, useEffect, useCallback, useRef } from "react";
import Lottie from "lottie-react";
import refresh from "@/assets/refresh.json";
import { message } from "antd";
import { useAuthContext } from "@/contexts/Support";
import { getFeedPosts, votePost } from "@/app/Api";
import { useRouter } from "next/navigation";
import SkeletonPost from "@/components/home/skeletonPost";
import { useViewTracking } from "@/hooks/useViewTracking";

export default function FeedClient() {
  const { currentUser, loggedIn } = useAuthContext();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    has_more_pages: true,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);

  // Load initial posts
  const loadInitialPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getFeedPosts(1);

      // Laravel pagination format: { data: [...], current_page: 1, last_page: 5, total: 50, ... }
      const { data: newPosts, current_page, last_page, total } = response.data;

      setPosts(newPosts);

      // Defensive programming to avoid "A non-numeric value encountered" error
      const currentPageNum = parseInt(current_page) || 1;
      const lastPageNum = parseInt(last_page) || 1;
      const totalNum = parseInt(total) || 0;

      setPagination({
        current_page: currentPageNum,
        has_more_pages: currentPageNum < lastPageNum,
        total: totalNum,
      });
    } catch (err) {
      setError("Không thể tải bài viết. Vui lòng thử lại.");
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial posts on mount
  useEffect(() => {
    loadInitialPosts();
  }, [loadInitialPosts]);

  // Load more posts function
  const loadMorePosts = useCallback(async () => {
    if (loading || !pagination.has_more_pages) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getFeedPosts(pagination.current_page + 1);

      // Laravel pagination format: { data: [...], current_page: 1, last_page: 5, total: 50, ... }
      const { data: newPosts, current_page, last_page, total } = response.data;

      setPosts((prevPosts) => [...prevPosts, ...newPosts]);

      // Defensive programming to avoid "A non-numeric value encountered" error
      const currentPageNum = parseInt(current_page) || 1;
      const lastPageNum = parseInt(last_page) || 1;
      const totalNum = parseInt(total) || 0;

      setPagination({
        current_page: currentPageNum,
        has_more_pages: currentPageNum < lastPageNum,
        total: totalNum,
      });
    } catch (err) {
      setError("Không thể tải thêm bài viết. Vui lòng thử lại.");
      console.error("Error loading more posts:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, pagination.has_more_pages, pagination.current_page]);

  // Intersection Observer for precise infinite scroll detection
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || !pagination.has_more_pages) return;

    // Add debounce to prevent rapid successive loads
    let debounceTimer = null;
    let hasTriggered = false; // Flag to prevent multiple triggers

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          !loading &&
          pagination.has_more_pages &&
          !hasTriggered
        ) {
          // Clear existing timer
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          // Set flag to prevent multiple triggers
          hasTriggered = true;

          // Set a delay to debounce rapid intersections
          debounceTimer = setTimeout(() => {
            // Double-check conditions before loading
            if (!loading && pagination.has_more_pages) {
              loadMorePosts().finally(() => {
                // Reset flag after loading completes
                hasTriggered = false;
              });
            } else {
              // Reset flag if conditions changed
              hasTriggered = false;
            }
          }, 200);
        }
      },
      {
        root: null,
        rootMargin: "500px", // Start loading 100px before the sentinel is visible
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      hasTriggered = false; // Reset flag on cleanup
    };
  }, [loadMorePosts, loading, pagination.has_more_pages]);

  // Handle voting
  const handleVote = (postId, value) => {
    if (!loggedIn) {
      router.push(
        "/login?continue=" + encodeURIComponent(window.location.href)
      );
      message.error("Bạn cần đăng nhập để thực hiện hành động này");
      return;
    }

    // value: 1 (up), -1 (down), 0 (remove)
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const myVote = p.votes.find(
          (v) => v.username === currentUser?.username
        );
        let newVotes;

        if (value === 0) {
          // remove vote
          newVotes = p.votes.filter(
            (v) => v.username !== currentUser?.username
          );
        } else if (!myVote) {
          // new vote
          newVotes = [
            ...p.votes,
            { username: currentUser?.username, vote_value: value },
          ];
        } else {
          // update existing vote
          newVotes = p.votes.map((v) =>
            v.username === currentUser?.username
              ? { ...v, vote_value: value }
              : v
          );
        }

        return { ...p, votes: newVotes };
      })
    );

    // Call API to vote
    votePost(postId, { vote_value: value }).catch(() => {
      message.error("Vote thất bại");
      // Revert the optimistic update on error
      loadInitialPosts();
    });
  };

  //  if initial load then show loading
  if (loading && posts.length === 0) {
    return (
      <HomeLayout activeNav="home" activeBar={"feed"}>
        <div className="px-1 xl:min-h-screen pt-4 md:max-w-[775px] mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 px-1">
            Bảng tin
          </h1>
          {/* 5 skeleton posts */}
          <div className="px-1.5 md:px-0">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonPost key={index} />
            ))}
          </div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout activeNav="home" activeBar={"feed"}>
      <div className="px-1 xl:min-h-screen pt-4 md:max-w-[775px] mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 px-1">
          Bảng tin
        </h1>

        {/* Posts */}
        {posts.map((post, index) => {
          const PostWithViewTracking = () => {
            const { ref: viewTrackingRef } = useViewTracking(post.id, {
              threshold: 0.3, // 30% của bài viết phải visible
              delay: 0, // Không delay
              cooldown: 0, // Không cooldown
            });

            return (
              <div ref={viewTrackingRef}>
                <PostItem post={post} single={false} onVote={handleVote} />
              </div>
            );
          };

          return (
            <div key={post.id}>
              <PostWithViewTracking />
              {/* Place sentinel after the last post of current page */}
              {index === posts.length - 1 && pagination.has_more_pages && (
                <div ref={sentinelRef} className="h-1 w-full" />
              )}
            </div>
          );
        })}

        {/* Loading indicator - subtle like Facebook */}
        {loading && (
          <div className="flex justify-center items-center py-4">
            <Lottie
              animationData={refresh}
              loop={true}
              style={{ width: 50, height: 50 }}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center items-center py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
              <button
                onClick={loadMorePosts}
                className="ml-2 underline hover:no-underline"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* End of posts message */}
        {!pagination.has_more_pages && posts.length > 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <img src="/images/pingpong.png" className="h-20 mx-auto" />
            <br />
            Bạn đã xem hết tất cả bài viết
          </div>
        )}

        {/* No posts message */}
        {posts.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <img src="/images/pingpong.png" className="h-20 mx-auto" />
            <br />
            Chưa có bài viết nào
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
