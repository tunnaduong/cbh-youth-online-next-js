import Grade10Client from "./Grade10Client";
import { enhanceMetadataWithURLs } from "@/utils/seo";

const title = "Tra cứu điểm thi vào lớp 10 Ninh Bình - Diễn đàn học sinh Chuyên Biên Hòa";
const description =
  "Tra cứu điểm thi tuyển sinh vào lớp 10 Ninh Bình: điểm từng môn, tổng điểm, thứ hạng trong trường và khả năng đỗ.";

export const metadata = enhanceMetadataWithURLs(
  {
    title,
    description,
    openGraph: { title, description, images: ["/images/cyo_thumbnail.png"], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: ["/images/cyo_thumbnail.png"] },
  },
  "/lookup/grade-10"
);

export default function Page() {
  return <Grade10Client />;
}
