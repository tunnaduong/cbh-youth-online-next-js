import FeedClient from "./FeedClient";

export const metadata = {
  title: "Bảng tin - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Xem các bài viết mới nhất từ cộng đồng học sinh Chuyên Biên Hòa. Cập nhật tin tức, thảo luận và chia sẻ kiến thức.",
  keywords:
    "bảng tin, diễn đàn, học sinh, chuyên biên hòa, cbh, tin tức, thảo luận",
  openGraph: {
    title: "Bảng tin - Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Xem các bài viết mới nhất từ cộng đồng học sinh Chuyên Biên Hòa. Cập nhật tin tức, thảo luận và chia sẻ kiến thức.",
    images: ["/images/cyo_thumbnail.png"],
    type: "website",
  },
};

export default function Feed() {
  return <FeedClient />;
}
