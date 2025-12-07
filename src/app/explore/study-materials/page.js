import StudyMaterialsClient from "./StudyMaterialsClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export const metadata = enhanceMetadataWithURLs(
  {
    title: "Tài liệu ôn thi - Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Chia sẻ và tải xuống tài liệu ôn thi từ cộng đồng học sinh Chuyên Biên Hòa. Tài liệu miễn phí và trả phí.",
    keywords:
      "tài liệu ôn thi, học tập, chia sẻ tài liệu, cbh, chuyên biên hòa",
    openGraph: {
      title: "Tài liệu ôn thi - Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        "Chia sẻ và tải xuống tài liệu ôn thi từ cộng đồng học sinh Chuyên Biên Hòa.",
      images: ["/images/cyo_thumbnail.png"],
      type: "website",
    },
  },
  "/explore/study-materials"
);

export default function StudyMaterials() {
  return <StudyMaterialsClient />;
}



