import RankingClient from "./RankingClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export const metadata = enhanceMetadataWithURLs(
  {
    title: "Xếp hạng thành viên - Diễn đàn học sinh Chuyên Biên Hòa",
    description: "Bảng xếp hạng thành viên theo điểm hoạt động.",
    keywords: "xếp hạng, ranking, điểm, chuyên biên hòa, cbh, diễn đàn",
    openGraph: {
      title: "Xếp hạng thành viên - Diễn đàn học sinh Chuyên Biên Hòa",
      description: "Bảng xếp hạng thành viên theo điểm hoạt động.",
      images: ["/images/cyo_thumbnail.png"],
      type: "website",
    },
  },
  "/users/ranking"
);

export default function RankingPage() {
  return <RankingClient />;
}
