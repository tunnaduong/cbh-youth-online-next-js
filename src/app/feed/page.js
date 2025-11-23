import FeedClient from "./FeedClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export const metadata = enhanceMetadataWithURLs(
  {
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
    twitter: {
      card: "summary_large_image",
      title: "Bảng tin - Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        "Xem các bài viết mới nhất từ cộng đồng học sinh Chuyên Biên Hòa. Cập nhật tin tức, thảo luận và chia sẻ kiến thức.",
      images: ["/images/cyo_thumbnail.png"],
    },
  },
  "/feed"
);

export default function Feed() {
  return <FeedClient />;
}
