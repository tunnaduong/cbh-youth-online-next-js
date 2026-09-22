"use client";

import { useEffect, useState } from "react";
import MaintenanceGuard from "@/components/maintenance/MaintenanceGuard";
import { checkApiAlive } from "@/components/maintenance/apiStatus";

// Lỗi khi render (thường do fetch API phía server thất bại).
// Nếu API không phản hồi => hiện màn hình bảo trì, ngược lại hiện lỗi chung.
export default function Error({ error, reset }) {
  const [apiDown, setApiDown] = useState(null);

  useEffect(() => {
    console.error(error);
    checkApiAlive().then((alive) => setApiDown(!alive));
  }, [error]);

  if (apiDown === null) return null;
  if (apiDown) return <MaintenanceGuard initialDown />;
  return <GenericError onRetry={reset} />;
}

function GenericError({ onRetry }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center max-w-[450px]">
        <img src="/images/error.svg" alt="Lỗi" className="w-[120px] h-[120px] mx-auto mb-2" />
        <h4 className="font-bold text-gray-500 dark:text-neutral-300 text-lg">
          Đã có lỗi xảy ra
        </h4>
        <p className="text-base text-gray-500 dark:text-neutral-300">
          Rất tiếc, trang này tạm thời không tải được. Bạn thử lại nhé.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 bg-[#319528] hover:bg-green-700 text-white text-base font-semibold rounded-lg py-2.5 px-8"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}

