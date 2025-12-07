"use client";

import { useState } from "react";
import { StarOutline, Star } from "react-ionicons";
import { rateMaterial } from "@/app/Api";
import { message } from "antd";

export default function RatingSection({ materialId, userRating, onRatingUpdate }) {
  const [rating, setRating] = useState(userRating?.rating || 0);
  const [comment, setComment] = useState(userRating?.comment || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      message.warning("Vui lòng chọn số sao");
      return;
    }

    try {
      setLoading(true);
      await rateMaterial(materialId, { rating, comment });
      message.success("Đánh giá thành công!");
      onRatingUpdate?.();
    } catch (err) {
      message.error("Đánh giá thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Đánh giá tài liệu</h3>
      <div className="space-y-4">
        <div>
          <label className="block mb-2">Số sao:</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="text-2xl"
                type="button"
              >
                {star <= rating ? (
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
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
            rows="4"
            placeholder="Chia sẻ nhận xét của bạn..."
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {userRating ? "Cập nhật đánh giá" : "Gửi đánh giá"}
        </button>
      </div>
    </div>
  );
}

