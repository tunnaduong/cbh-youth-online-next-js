import UniversitiesClient from "./UniversitiesClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export const metadata = enhanceMetadataWithURLs(
  {
    title: "Tìm trường ĐH-CĐ - Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Tra cứu thông tin trường đại học, cao đẳng và điểm chuẩn tuyển sinh theo tỉnh thành và ngành học.",
    keywords:
      "tìm trường đại học, cao đẳng, điểm chuẩn, tuyển sinh, cbh, chuyên biên hòa",
    openGraph: {
      title: "Tìm trường ĐH-CĐ - Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        "Tra cứu thông tin trường đại học, cao đẳng và điểm chuẩn tuyển sinh theo tỉnh thành và ngành học.",
      images: ["/images/cyo_thumbnail.png"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Tìm trường ĐH-CĐ - Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        "Tra cứu thông tin trường đại học, cao đẳng và điểm chuẩn tuyển sinh theo tỉnh thành và ngành học.",
      images: ["/images/cyo_thumbnail.png"],
    },
  },
  "/explore/universities"
);

export default function UniversitiesPage() {
  return <UniversitiesClient />;
}
