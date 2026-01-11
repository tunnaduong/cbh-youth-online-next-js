import StudyMaterialsClient from "./StudyMaterialsClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export const metadata = enhanceMetadataWithURLs(
  {
    title: "Chợ tài liệu - Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Chợ tài liệu - Nơi mua bán, chia sẻ tài liệu ôn thi từ cộng đồng học sinh Chuyên Biên Hòa.",
    keywords:
      "chợ tài liệu, tài liệu ôn thi, học tập, chia sẻ tài liệu, cbh, chuyên biên hòa",
    openGraph: {
      title: "Chợ tài liệu - Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        "Chợ tài liệu - Nơi mua bán, chia sẻ tài liệu ôn thi từ cộng đồng học sinh Chuyên Biên Hòa.",
      images: ["/images/cyo_thumbnail.png"],
      type: "website",
    },
  },
  "/explore/study-materials"
);

export default function StudyMaterials() {
  return <StudyMaterialsClient />;
}



