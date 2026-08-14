import { Suspense } from "react";
import CustomQuizClient from "./CustomQuizClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export const metadata = enhanceMetadataWithURLs(
  {
    title: "Tạo bộ đề tùy chỉnh - Diễn đàn học sinh Chuyên Biên Hòa",
    description: "Tự soạn bộ câu hỏi trắc nghiệm của riêng bạn để chia sẻ và chơi cùng bạn bè.",
    keywords: "đố vui, quiz, trắc nghiệm, tự tạo đề, chuyên biên hòa, cbh, diễn đàn",
    openGraph: {
      title: "Tạo bộ đề tùy chỉnh - Diễn đàn học sinh Chuyên Biên Hòa",
      description: "Tự soạn bộ câu hỏi trắc nghiệm của riêng bạn để chia sẻ và chơi cùng bạn bè.",
      images: ["/images/cyo_thumbnail.png"],
      type: "website",
    },
  },
  "/explore/quiz/custom"
);

export default function CustomQuizPage() {
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
      <CustomQuizClient />
    </Suspense>
  );
}
