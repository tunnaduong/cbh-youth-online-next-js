import GradesClient from "./GradesClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

const title = "Tra cứu điểm thi - Diễn đàn học sinh Chuyên Biên Hòa";
const description =
  "Công cụ tra cứu điểm thi nhanh chóng, chính xác dành cho học sinh trường THPT Chuyên Biên Hòa.";

export const metadata = enhanceMetadataWithURLs(
  {
    title,
    description,
    openGraph: { title, description, images: ["/images/cyo_thumbnail.png"], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: ["/images/cyo_thumbnail.png"] },
  },
  "/explore/lookup/grades"
);

export default function GradesPage() {
  return <GradesClient />;
}
