import ExploreClient from "./ExploreClient";

export const metadata = {
  title: "Khám phá - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Khám phá các tính năng và dịch vụ của diễn đàn học sinh Chuyên Biên Hòa.",
  keywords: "khám phá, tính năng, dịch vụ, chuyên biên hòa, cbh, diễn đàn",
  openGraph: {
    title: "Khám phá - Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Khám phá các tính năng và dịch vụ của diễn đàn học sinh Chuyên Biên Hòa.",
    images: ["/images/cyo_thumbnail.png"],
    type: "website",
  },
};

export default function Explore() {
  return <ExploreClient />;
}
