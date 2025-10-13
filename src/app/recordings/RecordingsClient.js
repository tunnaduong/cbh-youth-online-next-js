"use client";

import HomeLayout from "@/layouts/HomeLayout";
import RecordingItem from "./partials/RecordingItem";

export default function RecordingsClient({ recordings, error }) {
  return (
    <HomeLayout activeBar={"recordings"}>
      <div className="px-1 xl:min-h-screen pt-4 md:max-w-[775px] mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 px-1">
          Loa lớn
        </h1>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Lỗi tải dữ liệu
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error.message}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : recordings &&
          recordings.recordings &&
          recordings.recordings.length > 0 ? (
          recordings.recordings.map((recording) => (
            <RecordingItem key={recording.id} recording={recording} />
          ))
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center">
              <svg
                className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Chưa có bản ghi âm nào
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Hiện tại chưa có bản ghi âm nào được chia sẻ. Hãy quay lại sau!
              </p>
            </div>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
