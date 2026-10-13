import { redirect } from "next/navigation";
import { generatePostSlug } from "@/utils/slugify";

// The points guide is a forum post. Linked by id instead of looked up by title,
// so renaming the post can't break this page. If the author or title changes,
// the post page redirects to its canonical URL itself.
const POINTS_GUIDE_POST_ID = 262122456;
const POINTS_GUIDE_TITLE = "Cách Tính Điểm Xếp Hạng Thành Viên Trên CBH Youth Online";

export default function PointsGuidePage() {
  redirect(
    `/Admin/posts/${generatePostSlug(POINTS_GUIDE_POST_ID, POINTS_GUIDE_TITLE)}`
  );
}
