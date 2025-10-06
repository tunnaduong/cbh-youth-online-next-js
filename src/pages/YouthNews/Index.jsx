import HomeLayout from "@/layouts/HomeLayout";
// // import { Head, router, usePage } from "@inertiajs/react"; // TODO: Replace with Next.js equivalent // TODO: Replace with Next.js equivalent
import PostItem from "@/components/PostItem";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Lottie from "lottie-react";
import refresh from "@/Assets/refresh.json";
import { message } from "antd";

export default function Index({ youthNews: initialYouthNews, pagination: initialPagination }) {
  const { auth } = usePage().props;
  const [youthNews, setYouthNews] = useState(initialYouthNews || []);
  const [pagination, setPagination] = useState(initialPagination || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);

  // Load more youth news function
  const loadMoreYouthNews = useCallback(async () => {
    if (loading || !pagination.has_more_pages) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("/api/youth-news", {
        params: {
          page: pagination.current_page + 1,
        },
      });

      const { youthNews: newYouthNews, pagination: newPagination } = response.data;

      setYouthNews((prevYouthNews) => [...prevYouthNews, ...newYouthNews]);
      setPagination(newPagination);
    } catch (err) {
      setError("Không thể tải thêm tin tức. Vui lòng thử lại.");
      console.error("Error loading more youth news:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, pagination.has_more_pages, pagination.current_page]);

  // Intersection Observer for precise infinite scroll detection
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Add debounce to prevent rapid successive loads
    let debounceTimer = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && pagination.has_more_pages) {
          // Clear existing timer
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          // Set a small delay to debounce rapid intersections
          debounceTimer = setTimeout(() => {
            // Double-check conditions before loading
            if (!loading && pagination.has_more_pages) {
              loadMoreYouthNews();
            }
          }, 100);
        }
      },
      {
        root: null,
        rootMargin: "50px", // Start loading 50px before the sentinel is visible
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
    };
  }, [loadMoreYouthNews, loading, pagination.has_more_pages]);

  // Handle voting
  const handleVote = (postId, value) => {
    if (!auth?.user) {
      router.visit(route("login") + "?continue=" + encodeURIComponent(window.location.href));
      message.error("Bạn cần đăng nhập để thực hiện hành động này");
      return;
    }
    // value: 1 (up), -1 (down), 0 (remove)
    setYouthNews((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const myVote = p.votes.find((v) => v.username === auth?.user?.username);
        let newVotes;

        if (value === 0) {
          // remove vote
          newVotes = p.votes.filter((v) => v.username !== auth?.user?.username);
        } else if (!myVote) {
          // new vote
          newVotes = [...p.votes, { username: auth?.user?.username, vote_value: value }];
        } else {
          // update existing vote
          newVotes = p.votes.map((v) =>
            v.username === auth?.user?.username ? { ...v, vote_value: value } : v
          );
        }

        return { ...p, votes: newVotes };
      })
    );

    // Gọi backend
    router.post(
      route("topics.vote", postId),
      { vote_value: value },
      {
        showProgress: false,
        preserveScroll: true,
        onError: () => {
          // rollback nếu fail (đơn giản nhất: refetch hoặc bỏ qua)
        },
      }
    );
  };

  return (
    <HomeLayout activeNav="home" activeBar="news">
      <Head title="Tin tức Đoàn" />

      <div className="px-1 xl:min-h-screen pt-4 md:max-w-[775px] mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 px-1">
          Tin tức Đoàn
        </h1>

        <div className="space-y-6">
          {youthNews.map((post) => (
            <PostItem key={post.id} post={post} single={false} onVote={handleVote} />
          ))}
        </div>

        {/* Invisible sentinel for intersection observer */}
        {pagination.has_more_pages && <div ref={sentinelRef} className="h-1 w-full" />}

        {/* Loading indicator - subtle like Facebook */}
        {loading && (
          <div className="flex justify-center items-center py-4">
            <Lottie animationData={refresh} loop={true} style={{ width: 40, height: 40 }} />
            <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">Đang tải...</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center items-center py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
              <button onClick={loadMoreYouthNews} className="ml-2 underline hover:no-underline">
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* End of posts message */}
        {!pagination.has_more_pages && youthNews.length > 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <img src="/images/pingpong.png" className="h-20 mx-auto" />
            <br />
            Bạn đã xem hết tất cả tin tức
          </div>
        )}

        {/* No posts message */}
        {youthNews.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <img src="/images/pingpong.png" className="h-20 mx-auto" />
            <br />
            Chưa có tin tức nào
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
