import StudyMaterialDetailClient from "./StudyMaterialDetailClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export async function generateMetadata({ params }) {
  // You can fetch material data here for SEO
  return enhanceMetadataWithURLs(
    {
      title: "Chi tiết tài liệu - Diễn đàn học sinh Chuyên Biên Hòa",
      description: "Xem chi tiết và tải xuống tài liệu ôn thi",
    },
    `/explore/study-materials/${params.id}`
  );
}

export default function StudyMaterialDetail({ params }) {
  return <StudyMaterialDetailClient materialId={params.id} />;
}



