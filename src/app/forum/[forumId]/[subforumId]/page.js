import {
  getForumCategoriesServer,
  getSubforumPostsServer,
} from "../../serverData";
import { notFound } from "next/navigation";
import SubforumClient from "./SubforumClient";

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }) {
  try {
    const { forumId, subforumId } = params;
    const response = await getForumCategoriesServer();
    const categories = response.data || response; // Handle both wrapped and unwrapped responses
    const category = categories.find((cat) => cat.slug === forumId);

    if (!category) {
      return {
        title: "Diễn đàn học sinh Chuyên Biên Hòa",
        description:
          "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
      };
    }

    const subforum = category.subforums.find((sub) => sub.slug === subforumId);

    if (!subforum) {
      return {
        title: `${category.name} - Diễn đàn học sinh Chuyên Biên Hòa`,
        description:
          category.description ||
          "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
      };
    }

    return {
      title: `${subforum.name} - ${category.name} - Diễn đàn học sinh Chuyên Biên Hòa`,
      description:
        subforum.description ||
        category.description ||
        "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
      openGraph: {
        title: subforum.name,
        description:
          subforum.description ||
          category.description ||
          "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
        images: [`/images/${subforum.background_image}`],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: subforum.name,
        description:
          subforum.description ||
          category.description ||
          "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
        images: [`/images/${subforum.background_image}`],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
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
