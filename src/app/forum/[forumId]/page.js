import { getForumCategoriesServer } from "../serverData";
import { notFound } from "next/navigation";
import ForumCategoryClient from "./ForumCategoryClient";

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }) {
  try {
    const { forumId } = params;
    console.log("🔍 Generating metadata for forumId:", forumId);

    const response = await getForumCategoriesServer();
    const categories = response.data || response; // Handle both wrapped and unwrapped responses
    const category = categories.find((cat) => cat.slug === forumId);

    console.log("📊 Found category:", category?.name);

    if (!category) {
      console.log("❌ Category not found, using default metadata");
      return {
        title: "Diễn đàn học sinh Chuyên Biên Hòa",
        description:
          "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
      };
    }

    const dynamicTitle = `${category.name} - Diễn đàn học sinh Chuyên Biên Hòa`;
    const dynamicDescription =
      category.description ||
      "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam";

    console.log("✅ Using dynamic metadata:", {
      dynamicTitle,
      dynamicDescription,
    });

    return {
      title: dynamicTitle,
      description: dynamicDescription,
      openGraph: {
        title: category.name,
        description: dynamicDescription,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: category.name,
        description: dynamicDescription,
      },
    };
  } catch (error) {
    console.error("❌ Error generating metadata:", error);
    return {
      title: "Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
    };
  }
}

export default async function ForumCategory({ params }) {
  let category = null;

  try {
    const { forumId } = params;
    const response = await getForumCategoriesServer();
    const categories = response.data || response; // Handle both wrapped and unwrapped responses
    category = categories.find((cat) => cat.slug === forumId);
  } catch (error) {
    console.error("Error fetching forum category:", error);
    // Continue with category = null, let client component handle it
  }

  return <ForumCategoryClient params={params} initialCategory={category} />;
}
