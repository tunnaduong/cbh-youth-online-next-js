import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const metadata = {
  title: "Tìm kiếm - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Tìm kiếm bài viết và trang cá nhân của người dùng trên diễn đàn học sinh Chuyên Biên Hòa.",
  keywords: "tìm kiếm, diễn đàn, học sinh, chuyên biên hòa, cbh",
  openGraph: {
    title: "Tìm kiếm - Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Tìm kiếm bài viết và trang cá nhân của người dùng trên diễn đàn học sinh Chuyên Biên Hòa.",
    images: "/images/cyo_thumbnail.png",
  },
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F8F8] dark:bg-neutral-800 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            Đang tải...
          </div>
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
