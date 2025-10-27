"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPostUrl } from "@/app/Api";

export default function ForumRulesClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchForumRulesUrl() {
      try {
        setLoading(true);
        const response = await getPostUrl({
          title: "Quy định và hướng dẫn sử dụng diễn đàn CBH Youth Online",
          user_id: 45,
          subforum_id: 10,
        });

        if (response?.data?.success && response.data.url) {
          // Convert full URL to relative path
          const url = response.data.url;
          const relativeUrl = url.replace(/^https?:\/\/[^\/]+/, "");

          // Redirect to the forum rules post
          router.push(relativeUrl);
        } else {
          throw new Error("Failed to get forum rules URL");
        }
      } catch (error) {
        console.error("Error fetching forum rules URL:", error);
        setError("Không thể tải nội quy diễn đàn. Vui lòng thử lại sau.");
        setLoading(false);
      }
    }

    fetchForumRulesUrl();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-[#319527] text-white rounded hover:bg-[#2a7a1f]"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#319527] mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Đang tải nội quy diễn đàn...
        </p>
      </div>
    </div>
  );
}
