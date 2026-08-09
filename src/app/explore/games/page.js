import GamesClient from "./GamesClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export const metadata = enhanceMetadataWithURLs(
  {
    title: "Game - Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Chơi game trực tiếp trên web - miễn phí, không cần tải về.",
    keywords: "game, chơi game, chuyên biên hòa, cbh, diễn đàn",
    openGraph: {
      title: "Game - Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        "Chơi game trực tiếp trên web - miễn phí, không cần tải về.",
      images: ["/images/cyo_thumbnail.png"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Game - Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        "Chơi game trực tiếp trên web - miễn phí, không cần tải về.",
      images: ["/images/cyo_thumbnail.png"],
    },
  },
  "/explore/games"
);

export default function GamesPage() {
  return <GamesClient />;
}
