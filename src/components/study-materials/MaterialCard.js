"use client";

import Link from "next/link";

export default function MaterialCard({ material }) {
  return (
    <Link
      href={`/explore/study-materials/${material.id}`}
      className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm hover:shadow-md p-6 transition-all block"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
          {material.title}
        </h3>
        {material.is_free ? (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded ml-2 flex-shrink-0">
            Miễn phí
          </span>
        ) : (
          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded ml-2 flex-shrink-0">
            {material.price} điểm
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
        {material.description}
      </p>
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>{material.author?.profile_name || material.author?.username}</span>
        <div className="flex items-center gap-4">
          <span>📥 {material.download_count || 0}</span>
          <span>👁️ {material.view_count || 0}</span>
          {material.average_rating > 0 && (
            <span>⭐ {material.average_rating}</span>
          )}
        </div>
      </div>
    </Link>
  );
}



