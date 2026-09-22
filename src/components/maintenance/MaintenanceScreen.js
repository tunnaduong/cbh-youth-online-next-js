"use client";

export default function MaintenanceScreen({ onRetry, checking = false }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#F8F8F8] dark:bg-neutral-800 px-4">
      <div className="text-center max-w-[460px]">
        <img
          src="/images/logo.png"
          alt="CBH Youth Online"
          className="w-20 h-20 mx-auto mb-4"
        />
        <h1 className="font-bold text-xl text-gray-700 dark:text-neutral-100 mb-2">
          Hệ thống đang bảo trì 🛠️
        </h1>
        <p className="text-base text-gray-500 dark:text-neutral-300">
          Diễn đàn đang được nâng cấp hoặc gặp sự cố tạm thời. Bạn vui lòng quay
          lại sau ít phút nhé. Trang sẽ tự động tải lại khi hệ thống hoạt động
          trở lại.
        </p>
        <button
          type="button"
          onClick={onRetry}
          disabled={checking}
          className="mt-5 inline-flex items-center justify-center gap-2 bg-[#319528] hover:bg-green-700 disabled:opacity-60 text-white text-base font-semibold rounded-lg py-2.5 px-8 transition-colors"
        >
          {checking ? "Đang kiểm tra..." : "Thử lại"}
        </button>
        <p className="text-xs text-gray-400 dark:text-neutral-400 mt-4">
          Cảm ơn bạn đã kiên nhẫn chờ đợi 💚
        </p>
      </div>
    </div>
  );
}
