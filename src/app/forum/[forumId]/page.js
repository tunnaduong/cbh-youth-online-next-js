import { getForumCategoriesServer } from "../serverData";
import { notFound } from "next/navigation";
import ForumCategoryClient from "./ForumCategoryClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

// Generate metadata for SEO and social sharing
import { metadata as layoutMetadata } from "@/app/layout";

export async function generateMetadata({ params }) {
  try {
    const { forumId } = params;
    const response = await getForumCategoriesServer();
    const categories = response.data || response; // Handle both wrapped and unwrapped responses
    const category = categories.find((cat) => cat.slug === forumId);

    if (!category) {
      // Fallback to layout metadata if category not found
      return enhanceMetadataWithURLs(
        {
          title:
            layoutMetadata.title?.default ||
            layoutMetadata.title ||
            "Diễn đàn học sinh Chuyên Biên Hòa",
          description:
            layoutMetadata.description ||
            "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
          openGraph: layoutMetadata.openGraph,
          twitter: layoutMetadata.twitter,
        },
        `/forum/${forumId}`
      );
    }

    // NOTE: Next.js 13/14 expects the metadata object to be flat for title/description.
    // If you return { title: { default: ... } }, it will not override the <title>.
    // You must return { title: "..." } directly.
    // Also, make sure you do NOT spread ...layoutMetadata at the top level,
    // as it will override your dynamic title/description with the defaults.

    const dynamicTitle = `${category.name} - Diễn đàn học sinh Chuyên Biên Hòa`;
    const dynamicDescription =
      category.description ||
      "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam";

    return enhanceMetadataWithURLs(
      {
        title: dynamicTitle,
        description: dynamicDescription,
        openGraph: {
          ...layoutMetadata.openGraph,
          title: dynamicTitle,
          description: dynamicDescription,
        },
        twitter: {
          ...layoutMetadata.twitter,
          title: dynamicTitle,
          description: dynamicDescription,
        },
      },
      `/forum/${forumId}`
    );
  } catch (error) {
    console.error("Error generating metadata:", error);
    // Fallback to layout metadata, but flatten title/description for Next.js
    return enhanceMetadataWithURLs(
      {
        title:
          layoutMetadata.title?.default ||
          layoutMetadata.title ||
          "Diễn đàn học sinh Chuyên Biên Hòa",
        description:
          layoutMetadata.description ||
          "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
        openGraph: layoutMetadata.openGraph,
        twitter: layoutMetadata.twitter,
      },
      `/forum/${params.forumId}`
    );
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
