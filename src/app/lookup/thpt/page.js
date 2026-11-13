import ThptClient from "./ThptClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

const title = "Tra cứu điểm thi tốt nghiệp THPT Ninh Bình - Diễn đàn học sinh Chuyên Biên Hòa";
const description =
  "Tra cứu điểm thi tốt nghiệp THPT quốc gia của Sở GD&ĐT Ninh Bình theo số báo danh.";

export const metadata = enhanceMetadataWithURLs(
  {
    title,
    description,
    openGraph: { title, description, images: ["/images/cyo_thumbnail.png"], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: ["/images/cyo_thumbnail.png"] },
  },
  "/lookup/thpt"
);

export default function Page() {
  return <ThptClient />;
}
