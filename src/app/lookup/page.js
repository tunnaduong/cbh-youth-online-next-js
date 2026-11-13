import LookupClient from "./LookupClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

const title = "Tra cứu điểm thi - Diễn đàn học sinh Chuyên Biên Hòa";
const description =
  "Tra cứu điểm thi tốt nghiệp THPT và thi vào lớp 10 Ninh Bình, điểm học kỳ THPT Chuyên Biên Hòa.";

export const metadata = enhanceMetadataWithURLs(
  {
    title,
    description,
    openGraph: { title, description, images: ["/images/cyo_thumbnail.png"], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: ["/images/cyo_thumbnail.png"] },
  },
  "/lookup"
);

export default function Page() {
  return <LookupClient />;
}
