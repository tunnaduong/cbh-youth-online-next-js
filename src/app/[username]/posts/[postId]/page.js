import HomeLayout from "@/layouts/HomeLayout";
import { notFound, redirect } from "next/navigation";
import PostClient from "./PostClient";
import { generatePostSlug } from "@/utils/slugify";
import { getServer } from "@/utils/serverFetch";
import { enhanceMetadataWithURLs } from "@/utils/seo";

// Server-side API call with authentication support
const getPostDetailServer = async (id) => {
  try {
    const data = await getServer(`/v1.0/topics/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching post detail:", error);
    throw error;
  }
};

// Helper function to extract numeric ID from postId (e.g., "399873567-giveaway" -> "399873567")
const extractNumericId = (postId) => {
  const match = postId.match(/^(\d+)/);
  return match ? match[1] : postId;
};

// Helper function to generate canonical URL with proper slug
const generateCanonicalUrl = (postId, postTitle) => {
  const numericId = extractNumericId(postId);
  return generatePostSlug(numericId, postTitle);
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

    // Generate canonical URL
    const username = post.anonymous
      ? "anonymous"
      : post.author?.username || "anonymous";
    const canonicalSlug = generateCanonicalUrl(params.postId, post.title);
    const canonicalPath = `/${username}/posts/${canonicalSlug}`;

    return enhanceMetadataWithURLs(
      {
        title: `${post.title} - Diễn đàn học sinh Chuyên Biên Hòa`,
        description: description,
        openGraph: {
          title: `${post.title} - Diễn đàn học sinh Chuyên Biên Hòa`,
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
      },
      canonicalPath
    );
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

  // Determine the correct username based on post data
  const correctUsername = postData.post.anonymous
    ? "anonymous"
    : postData.post.author.username;

  // Generate canonical URL and redirect if needed
  const canonicalSlug = generateCanonicalUrl(
    params.postId,
    postData.post.title
  );

  // Check if we need to redirect to the correct URL
  if (params.username !== correctUsername || params.postId !== canonicalSlug) {
    console.log("🔄 Redirecting to canonical URL:");
    console.log("Current username:", params.username);
    console.log("Correct username:", correctUsername);
    console.log("Current slug:", params.postId);
    console.log("Canonical slug:", canonicalSlug);

    const correctUrl = `/${correctUsername}/posts/${canonicalSlug}`;
    redirect(correctUrl);
  }

  return (
    <HomeLayout activeNav="home" activeBar={null}>
      <PostClient params={params} initialPost={postData} />
    </HomeLayout>
  );
}
