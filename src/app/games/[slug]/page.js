import GamePlayClient from "./GamePlayClient";
import { getGame } from "@/app/Api";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let game = null;
  try {
    const res = await getGame(slug);
    game = res?.data || res;
  } catch {
    // fall through to generic metadata below
  }

  return enhanceMetadataWithURLs(
    {
      title: game
        ? `${game.name} - Chơi game trên Diễn đàn học sinh Chuyên Biên Hòa`
        : "Game - Diễn đàn học sinh Chuyên Biên Hòa",
      description: game?.description || "Chơi game trực tiếp trên web.",
      openGraph: {
        title: game?.name || "Game",
        description: game?.description || "Chơi game trực tiếp trên web.",
        images: [game?.image_url || "/images/cyo_thumbnail.png"],
        type: "website",
      },
    },
    `/games/${slug}`
  );
}

export default async function GamePlayPage({ params }) {
  const { slug } = await params;
  return <GamePlayClient slug={slug} />;
}
