import UploadMaterialClient from "./UploadMaterialClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export const metadata = enhanceMetadataWithURLs(
  {
    title: "Đăng tài liệu - Diễn đàn học sinh Chuyên Biên Hòa",
    description: "Chia sẻ tài liệu ôn thi của bạn với cộng đồng",
  },
  "/explore/study-materials/upload"
);

export default function UploadMaterial() {
  return <UploadMaterialClient />;
}



