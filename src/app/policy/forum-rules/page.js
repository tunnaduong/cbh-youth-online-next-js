import { redirect } from "next/navigation";
import { generatePostSlug } from "@/utils/slugify";

// The forum rules are a forum post. Linked by id instead of looked up by title,
// so renaming the post can't break this page. If the author or title changes,
// the post page redirects to its canonical URL itself.
const FORUM_RULES_POST_ID = 173336279;
const FORUM_RULES_TITLE = "Quy định và hướng dẫn sử dụng diễn đàn CBH Youth Online";

export default function ForumRulesPage() {
  redirect(
    `/Admin/posts/${generatePostSlug(FORUM_RULES_POST_ID, FORUM_RULES_TITLE)}`
  );
}
