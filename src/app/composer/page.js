import { Suspense } from "react";
import HomeLayout from "@/layouts/HomeLayout";
import ComposerClient from "./ComposerClient";

export const metadata = {
  title: "Tạo bài viết - Diễn đàn học sinh Chuyên Biên Hòa",
  description: "Soạn và đăng bài viết mới lên diễn đàn",
};

export default function ComposerPage() {
  return (
    <HomeLayout showRightSidebar={false}>
      <Suspense fallback={null}>
        <ComposerClient />
      </Suspense>
    </HomeLayout>
  );
}
