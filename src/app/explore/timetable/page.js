import TimetableClient from "./TimetableClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

const title = "Thời khóa biểu - Diễn đàn học sinh Chuyên Biên Hòa";
const description =
  "Thời khóa biểu của lớp: giờ vào lớp, tiết đang học, thời gian đã trôi qua và thời gian còn lại đến tiết kế tiếp.";

export const metadata = enhanceMetadataWithURLs(
  {
    title,
    description,
    openGraph: { title, description, images: ["/images/cyo_thumbnail.png"], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: ["/images/cyo_thumbnail.png"] },
  },
  "/explore/timetable"
);

export default function Page() {
  return <TimetableClient />;
}
