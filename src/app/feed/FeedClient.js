"use client";

import HomeLayout from "@/layouts/HomeLayout";
import PostItem from "@/components/forum/PostItem";
import { useState, useEffect, useCallback, useRef } from "react";
import Lottie from "lottie-react";
import refresh from "@/assets/refresh.json";
import { message } from "antd";
import { useAuthContext, useTopUsersContext } from "@/contexts/Support";
import {
  getLatestFeedPosts,
  getPersonalizedFeedPosts,
  votePost,
} from "@/app/Api";
import { useRouter } from "next/navigation";
import SkeletonPost from "@/components/home/skeletonPost";
import { useViewTracking } from "@/hooks/useViewTracking";

const FEED_TABS = [
  { key: "for-you", label: "Dành cho bạn" },
  { key: "latest", label: "Mới nhất" },
];

const FEED_TAB_STORAGE_KEY = "cyo_feed_tab";

// A fresh seed per page load makes the ranked feed deal a different order every
// visit ("slot machine"), instead of showing the same posts again after a reload.
const makeSeed = () => Math.floor(Math.random() * 2147483647) + 1;

export default function FeedClient() {
  const { currentUser, loggedIn, authLoading, refreshUser } = useAuthContext();
  const { fetchTopUsers } = useTopUsersContext();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [feedTab, setFeedTab] = useState("for-you");
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Id of the last ranked post, once the personalized feed ran out and we
  // continued with the chronological one — used to draw a divider.
  const [overflowAfterId, setOverflowAfterId] = useState(null);
  const sentinelRef = useRef(null);

  const seedRef = useRef(null);
  const pageRef = useRef(1);
  // Which endpoint is currently being paginated. Starts as the selected tab and
  // switches to "latest" when the personalized feed is exhausted.
  const sourceRef = useRef("for-you");
  const deliveredIdsRef = useRef(new Set());
  const lastDeliveredIdRef = useRef(null);
  const loadingRef = useRef(false);
  // Bumped on every reset so a response from a superseded load (tab switch,
  // login) can be dropped instead of landing in the new feed.
  const runIdRef = useRef(0);

  // Restore the previously selected tab (defaults to "Dành cho bạn").
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FEED_TAB_STORAGE_KEY);
      if (saved && FEED_TABS.some((tab) => tab.key === saved)) {
        setFeedTab(saved);
      }
    } catch {
      // localStorage unavailable (private mode) — keep the default tab.
    }
  }, []);

  const fetchPosts = useCallback(
    async (reset, keepSeed = false) => {
      if (!reset && loadingRef.current) return;

      if (reset) runIdRef.current += 1;
      const runId = runIdRef.current;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      if (reset) {
        if (!keepSeed || !seedRef.current) seedRef.current = makeSeed();
        pageRef.current = 1;
        // Guests have no personalized ranking (the API falls back to the
        // chronological feed), so never run the ranked source for them.
        sourceRef.current =
          loggedIn && feedTab === "for-you" ? "for-you" : "latest";
        deliveredIdsRef.current = new Set();
        lastDeliveredIdRef.current = null;
        setOverflowAfterId(null);
        setHasMorePosts(true);
      }

      const usingLatest = sourceRef.current === "latest";
      const requestedPage = pageRef.current;

      try {
        const response = usingLatest
          ? await getLatestFeedPosts(requestedPage)
          : await getPersonalizedFeedPosts(requestedPage, seedRef.current);

        // A newer reset started while this request was in flight — drop it.
        if (runId !== runIdRef.current) return;

        // Laravel pagination format: { data: [...], current_page: 1, last_page: 5, total: 50, ... }
        const payload = response?.data || {};
        const batch = Array.isArray(payload.data) ? payload.data : [];

        // The chronological fallback re-serves posts the ranked feed already
        // delivered, so drop anything that is on screen already.
        const freshPosts = batch.filter(
          (post) => post?.id == null || !deliveredIdsRef.current.has(post.id)
        );
        freshPosts.forEach(
          (post) => post?.id != null && deliveredIdsRef.current.add(post.id)
        );

        setPosts((prevPosts) =>
          reset ? freshPosts : [...prevPosts, ...freshPosts]
        );
        if (freshPosts.length > 0) {
          lastDeliveredIdRef.current =
            freshPosts[freshPosts.length - 1]?.id ?? lastDeliveredIdRef.current;
        }
        pageRef.current = requestedPage + 1;

        // Defensive parsing to avoid "A non-numeric value encountered" errors
        const currentPageNum = parseInt(payload.current_page) || requestedPage;
        const lastPageNum = parseInt(payload.last_page) || 1;

        if (usingLatest) {
          const ranOut =
            batch.length === 0 ||
            currentPageNum >= lastPageNum ||
            // Nothing new left to reveal after the ranked feed was exhausted.
            (overflowAfterId !== null && freshPosts.length === 0);
          setHasMorePosts(!ranOut);
        } else if (payload.exhausted || batch.length === 0) {
          // Seen every ranked post: keep scrolling with the chronological feed,
          // which also surfaces posts created after the ranking was built.
          sourceRef.current = "latest";
          pageRef.current = 1;
          setOverflowAfterId(lastDeliveredIdRef.current);
          setHasMorePosts(true);
        } else {
          setHasMorePosts(true);
        }
      } catch (err) {
        if (runId === runIdRef.current) {
          setError(
            reset
              ? "Không thể tải bài viết. Vui lòng thử lại."
              : "Không thể tải thêm bài viết. Vui lòng thử lại."
          );
        }
        console.error("Error loading posts:", err);
      } finally {
        if (runId === runIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [feedTab, loggedIn, overflowAfterId]
  );

  // Reload the current feed as-is (same seed, same order) — used to undo an
  // optimistic update that the server rejected.
  const loadInitialPosts = useCallback(
    () => fetchPosts(true, true),
    [fetchPosts]
  );

  // (Re)load from scratch on mount and whenever the selected tab changes.
  // Waits for the stored session to be restored, so a logged-in user doesn't
  // first get served the guest (chronological) feed. The stored token alone is
  // enough to start — no need to also wait for the /user refresh to come back.
  useEffect(() => {
    if (authLoading && !loggedIn) return;
    fetchPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedTab, loggedIn, authLoading]);

  const loadMorePosts = useCallback(() => {
    if (loadingRef.current || !hasMorePosts) return;
    return fetchPosts(false);
  }, [fetchPosts, hasMorePosts]);

  const handleTabChange = useCallback(
    (tabKey) => {
      if (tabKey === feedTab) return;
      try {
        window.localStorage.setItem(FEED_TAB_STORAGE_KEY, tabKey);
      } catch {
        // Ignore storage failures — the tab still applies for this visit.
      }
      setPosts([]);
      setFeedTab(tabKey);
    },
    [feedTab]
  );

  // Intersection Observer for precise infinite scroll detection
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || !hasMorePosts) return;

    // Add debounce to prevent rapid successive loads
    let debounceTimer = null;
    let hasTriggered = false; // Flag to prevent multiple triggers

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          !loading &&
          hasMorePosts &&
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
            if (!loading && hasMorePosts) {
              Promise.resolve(loadMorePosts()).finally(() => {
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
  }, [loadMorePosts, loading, hasMorePosts]);

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
    votePost(postId, { vote_value: value })
      .then(() => {
        // Refresh points and ranking
        refreshUser();
        if (fetchTopUsers) fetchTopUsers(true);
      })
      .catch(() => {
        message.error("Vote thất bại");
        // Revert the optimistic update on error
        loadInitialPosts();
      });
  };

  // Segmented switch between the ranked feed and the chronological one.
  // Guests only ever get the chronological feed, so it's hidden for them.
  const feedTabsBar = loggedIn ? (
    <div className="px-1 mb-5">
      <div className="inline-flex w-full xs:w-auto p-1 rounded-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
        {FEED_TABS.map((tab) => {
          const isActive = tab.key === feedTab;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              aria-pressed={isActive}
              className={`flex-1 xs:flex-none px-6 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                isActive
                  ? "bg-white dark:bg-neutral-700 text-[#319527] dark:text-green-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  //  if initial load then show loading
  if (loading && posts.length === 0) {
    return (
      <HomeLayout activeNav="home" activeBar={"feed"}>
        <div className="px-1 xl:min-h-screen pt-4 md:max-w-[775px] mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 px-1">
            Bảng tin
          </h1>
          {feedTabsBar}
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 px-1">
          Bảng tin
        </h1>

        {feedTabsBar}

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
              {/* Ranked posts ran out — everything below is chronological */}
              {overflowAfterId != null && post.id === overflowAfterId && (
                <div className="flex items-center gap-3 py-4 px-1 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  <span className="h-px flex-1 bg-gray-200 dark:bg-neutral-700" />
                  Bài viết mới nhất
                  <span className="h-px flex-1 bg-gray-200 dark:bg-neutral-700" />
                </div>
              )}
              {/* Place sentinel after the last post of current page */}
              {index === posts.length - 1 && hasMorePosts && (
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
        {!hasMorePosts && posts.length > 0 && (
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
