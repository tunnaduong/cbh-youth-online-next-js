import HomeLayout from "@/layouts/HomeLayout";
import FeedbackClient from "./FeedbackClient";

export const metadata = {
  title: "Góp ý & Báo lỗi - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Gửi góp ý, đề xuất tính năng hoặc báo lỗi cho đội ngũ phát triển diễn đàn học sinh Chuyên Biên Hòa.",
  keywords: "góp ý, báo lỗi, phản hồi, CBH Youth Online, chuyên biên hòa",
};

export default function FeedbackPage() {
  return (
    <HomeLayout activeNav="home" showRightSidebar={false}>
      <FeedbackClient />
    </HomeLayout>
  );
}
