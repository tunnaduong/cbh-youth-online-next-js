import HomeLayout from "@/layouts/HomeLayout";
import { getPostDetail } from "@/app/Api";
import { notFound } from "next/navigation";
import PostClient from "./PostClient";

// Server-side API call without authentication
const getPostDetailServer = async (id) => {
  const baseURL =
    process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com";
  const response = await fetch(`${baseURL}/v1.0/topics/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // Ensure fresh data
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Helper function to extract numeric ID from postId (e.g., "399873567-giveaway" -> "399873567")
const extractNumericId = (postId) => {
  const match = postId.match(/^(\d+)/);
  return match ? match[1] : postId;
};

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }) {
  try {
    const numericId = extractNumericId(params.postId);
    const data = await getPostDetailServer(numericId);

    if (!data || !data.post) {
      return {
        title: "Diễn đàn học sinh Chuyên Biên Hòa",
        description:
          "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
      };
    }

    const post = data.post;
    const description =
      post.content?.replace(/<[^>]*>/g, "").substring(0, 160) ||
      "Diễn đàn học sinh Chuyên Biên Hòa";

    return {
      title: `${post.title} - Diễn đàn học sinh Chuyên Biên Hòa`,
      description: description,
      openGraph: {
        title: post.title,
        description: description,
        images: [post.image_urls[0] || "/images/cyo_thumbnail.png"],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: description,
        images: [post.image_urls[0] || "/images/cyo_thumbnail.png"],
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

export default async function PostDetail({ params }) {
  let postData = null;

  try {
    const numericId = extractNumericId(params.postId);
    console.log("🔍 Debug Info:");
    console.log("Original postId:", params.postId);
    console.log("Extracted numericId:", numericId);
    console.log("Username:", params.username);
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

    postData = await getPostDetailServer(numericId);
    console.log("API Response:", postData);
    console.log("🔍 Inspecting postData structure:", postData);
  } catch (error) {
    console.error("❌ Error fetching post data:", error);
    console.error("Post ID:", params.postId);
    console.error("Numeric ID:", extractNumericId(params.postId));
    console.error("Full params:", params);
    console.error(
      "Error details:",
      error.message,
      error.status,
      error.response
    );
    console.error("Error config:", error.config);
    notFound();
  }

  if (!postData || !postData.post) {
    console.error("❌ Post data is null or missing post:");
    console.error("postData:", postData);
    console.error("postData.post:", postData?.post);
    notFound();
  }

  if (postData && postData.post) {
    const expectedUsername = postData.post.anonymous
      ? "anonymous"
      : postData.post.author.username;
    if (params.username !== expectedUsername) {
      console.error(
        `❌ Username mismatch: expected ${expectedUsername}, got ${params.username}`
      );
      notFound();
    }
  }

  return (
    <HomeLayout activeNav="home" activeBar={null}>
      <PostClient params={params} postData={postData} />
    </HomeLayout>
  );
}
