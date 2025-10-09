import {
  getForumCategoriesServer,
  getSubforumPostsServer,
} from "../../serverData";
import { metadata as layoutMetadata } from "@/app/layout";
import SubforumClient from "./SubforumClient";

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }) {
  try {
    const { forumId, subforumId } = params;
    const response = await getForumCategoriesServer();
    const categories = response.data || response; // Handle both wrapped and unwrapped responses
    const category = categories.find((cat) => cat.slug === forumId);

    if (!category) {
      // Fallback to layout metadata if category not found
      return {
        ...layoutMetadata,
      };
    }

    const subforum = category.subforums.find((sub) => sub.slug === subforumId);

    if (!subforum) {
      // Fallback to layout metadata if subforum not found
      return {
        ...layoutMetadata,
      };
    }

    // NOTE: Next.js 13/14 expects the metadata object to be flat for title/description.
    // If you return { title: { default: ... } }, it will not override the <title>.
    // You must return { title: "..." } directly.
    // Also, make sure you do NOT spread ...layoutMetadata at the top level,
    // as it will override your dynamic title/description with the defaults.

    const dynamicTitle = `${subforum.name} - Diễn đàn học sinh Chuyên Biên Hòa`;
    const dynamicDescription =
      subforum.description ||
      category.description ||
      "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam";

    return {
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
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    // Fallback to layout metadata, but flatten title/description for Next.js
    return {
      title:
        layoutMetadata.title?.default ||
        layoutMetadata.title ||
        "Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        layoutMetadata.description ||
        "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
      openGraph: layoutMetadata.openGraph,
      twitter: layoutMetadata.twitter,
    };
  }
}

export default async function Subforum({ params }) {
  let category = null;
  let subforum = null;
  let topics = [];

  try {
    const { forumId, subforumId } = params;

    // Fetch category data
    const categoryResponse = await getForumCategoriesServer();
    const categories = categoryResponse.data || categoryResponse; // Handle both wrapped and unwrapped responses
    category = categories.find((cat) => cat.slug === forumId);

    if (category) {
      subforum = category.subforums.find((sub) => sub.slug === subforumId);
    }

    // Fetch topics data if we have a valid subforum
    if (subforum) {
      try {
        const topicsResponse = await getSubforumPostsServer(subforumId);
        topics = topicsResponse.data || topicsResponse || []; // Handle both wrapped and unwrapped responses
      } catch (error) {
        console.error("Error fetching topics:", error);
        // Continue with empty topics array
      }
    }
  } catch (error) {
    console.error("Error fetching subforum data:", error);
    // Continue with null values, let client component handle it
  }

  return (
    <SubforumClient
      params={params}
      initialCategory={category}
      initialSubforum={subforum}
      initialTopics={topics}
    />
  );
}
