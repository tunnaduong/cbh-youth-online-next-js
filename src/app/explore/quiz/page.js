import QuizClient from "./QuizClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export const metadata = enhanceMetadataWithURLs(
  {
    title: "Đố vui - Diễn đàn học sinh Chuyên Biên Hòa",
    description: "Trả lời câu hỏi trắc nghiệm do AI tạo ra, thử thách kiến thức của bạn.",
    keywords: "đố vui, quiz, trắc nghiệm, chuyên biên hòa, cbh, diễn đàn",
    openGraph: {
      title: "Đố vui - Diễn đàn học sinh Chuyên Biên Hòa",
      description: "Trả lời câu hỏi trắc nghiệm do AI tạo ra, thử thách kiến thức của bạn.",
      images: ["/images/cyo_thumbnail.png"],
      type: "website",
    },
  },
  "/explore/quiz"
);

export default function QuizPage() {
  return <QuizClient />;
}
