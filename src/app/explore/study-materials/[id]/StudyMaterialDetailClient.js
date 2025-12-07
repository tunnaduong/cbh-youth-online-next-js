"use client";

import HomeLayout from "@/layouts/HomeLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import {
  getStudyMaterial,
  purchaseMaterial,
  downloadMaterial,
  viewMaterial,
  getMaterialRatings,
  rateMaterial,
} from "@/app/Api";
import { message } from "antd";
import Link from "next/link";
import { BookOutline, Book, DownloadOutline, StarOutline, Star } from "react-ionicons";

export default function StudyMaterialDetailClient({ materialId }) {
  const { loggedIn, currentUser } = useAuthContext();
  const router = useRouter();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const sidebarItems = [
    {
      key: "study",
      href: "/explore/study-materials",
      label: "Tài liệu ôn thi",
      Icon: Book,
      isExternal: false,
    },
  ];

  useEffect(() => {
    loadMaterial();
    loadRatings();
  }, [materialId]);

  const loadMaterial = async () => {
    try {
      setLoading(true);
      const response = await getStudyMaterial(materialId);
      setMaterial(response.data);
      if (response.data.user_rating) {
        setUserRating(response.data.user_rating);
        setRatingValue(response.data.user_rating.rating);
        setRatingComment(response.data.user_rating.comment || "");
      }
      // Increment view count
      await viewMaterial(materialId);
    } catch (err) {
      message.error("Không thể tải tài liệu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      const response = await getMaterialRatings(materialId);
      setRatings(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePurchase = async () => {
    if (!loggedIn) {
      message.warning("Vui lòng đăng nhập để mua tài liệu");
      router.push("/login");
      return;
    }

    try {
      await purchaseMaterial(materialId);
      message.success("Mua tài liệu thành công!");
      loadMaterial();
    } catch (err) {
      message.error(err.response?.data?.message || "Mua tài liệu thất bại");
    }
  };

  const handleDownload = async () => {
    if (!loggedIn) {
      message.warning("Vui lòng đăng nhập để tải tài liệu");
      return;
    }

    try {
      const token = localStorage.getItem("TOKEN");
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1.0/study-materials/${materialId}/download`;
      
      // Use fetch with blob response
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", material?.file?.file_name || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      message.success("Đang tải tài liệu...");
      loadMaterial();
    } catch (err) {
      message.error("Không thể tải tài liệu");
    }
  };

  const handleRate = async () => {
    if (!loggedIn) {
      message.warning("Vui lòng đăng nhập để đánh giá");
      return;
    }

    if (ratingValue === 0) {
      message.warning("Vui lòng chọn số sao");
      return;
    }

    try {
      await rateMaterial(materialId, {
        rating: ratingValue,
        comment: ratingComment,
      });
      message.success("Đánh giá thành công!");
      setUserRating({ rating: ratingValue, comment: ratingComment });
      loadRatings();
      loadMaterial();
    } catch (err) {
      message.error("Đánh giá thất bại");
    }
  };

  if (loading) {
    return (
      <HomeLayout activeNav="explore" activeBar="study" sidebarItems={sidebarItems}>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </HomeLayout>
    );
  }

  if (!material) {
    return (
      <HomeLayout activeNav="explore" activeBar="study" sidebarItems={sidebarItems}>
        <div className="text-center py-12 text-gray-500">Tài liệu không tồn tại</div>
      </HomeLayout>
    );
  }

  const canDownload = material.is_free || material.is_purchased;

  return (
    <HomeLayout activeNav="explore" activeBar="study" sidebarItems={sidebarItems}>
      <div className="px-2.5">
        <main className="px-1 xl:min-h-screen py-4 md:max-w-[936px] mx-auto">
          <Link
            href="/explore/study-materials"
            className="text-green-600 hover:text-green-700 mb-4 inline-block"
          >
            ← Quay lại danh sách
          </Link>

          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {material.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {material.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Tác giả: {material.author.profile_name || material.author.username}</span>
                  <span>📥 {material.download_count} lượt tải</span>
                  <span>👁️ {material.view_count} lượt xem</span>
                  {material.average_rating > 0 && (
                    <span>⭐ {material.average_rating} ({material.ratings_count} đánh giá)</span>
                  )}
                </div>
              </div>
              <div className="ml-4">
                {material.is_free ? (
                  <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg font-semibold">
                    Miễn phí
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-lg font-semibold">
                    {material.price} điểm
                  </span>
                )}
              </div>
            </div>

            {/* Preview */}
            {material.preview_content && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg">
                <h3 className="font-semibold mb-2">Xem trước:</h3>
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: material.preview_content }}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              {!material.is_free && !material.is_purchased && (
                <button
                  onClick={handlePurchase}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mua ngay ({material.price} điểm)
                </button>
              )}
              {canDownload && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <DownloadOutline color="#fff" height="20px" width="20px" />
                  Tải xuống
                </button>
              )}
            </div>
          </div>

          {/* Rating Section */}
          {loggedIn && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Đánh giá tài liệu</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Số sao:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingValue(star)}
                        className="text-2xl"
                      >
                        {star <= ratingValue ? (
                          <Star color="#fbbf24" height="32px" width="32px" />
                        ) : (
                          <StarOutline color="#9ca3af" height="32px" width="32px" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block mb-2">Nhận xét (tùy chọn):</label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    rows="4"
                    placeholder="Chia sẻ nhận xét của bạn..."
                  />
                </div>
                <button
                  onClick={handleRate}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {userRating ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                </button>
              </div>
            </div>
          )}

          {/* Ratings List */}
          {ratings.length > 0 && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Đánh giá ({ratings.length})</h3>
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.id} className="border-b border-gray-200 dark:border-neutral-700 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">
                        {rating.user.profile_name || rating.user.username}
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            color={star <= rating.rating ? "#fbbf24" : "#d1d5db"}
                            height="16px"
                            width="16px"
                          />
                        ))}
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="text-gray-600 dark:text-gray-400">{rating.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </HomeLayout>
  );
}

