import { getServer } from "@/utils/serverFetch";
import HomeLayout from "@/layouts/HomeLayout";
import HomeClient from "@/components/home/HomeClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

// Force dynamic rendering to avoid SSG issues with window/browser APIs
export const dynamic = "force-dynamic";

// Server-side data fetching
async function getHomeDataServer(sort = "latest") {
  try {
    const data = await getServer(`/v1.0/home?sort=${sort}`);
    return data;
  } catch (error) {
    console.error("Error fetching home data:", error);
    return {
      latestPosts: [],
      mainCategories: [],
      stats: null,
    };
  }
}

// "Bài mới" ("latest") always comes from the live, uncached ?mode=latest
// feed (ordered strictly by created_at desc) rather than /home's own
// latestPosts, so a brand-new post shows up immediately even on the very
// first server-rendered load of the page — same fix as the client-side
// refetch in ForumDataProvider, just applied to the SSR path too.
async function getLatestFeedPostsServer() {
  try {
    const data = await getServer("/v1.0/topics/feed?mode=latest&page=1");
    const topics = data?.data || [];
    return topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      anonymous: topic.anonymous,
      username: topic.author?.username,
      author_name: topic.author?.profile_name || topic.author?.username,
      time: topic.time,
    }));
  } catch (error) {
    console.error("Error fetching latest feed posts:", error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata() {
  const baseMetadata = {
    title: "Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
    keywords: "diễn đàn, học sinh, chuyên biên hòa, cbh, thpt chuyên hà nam",
    openGraph: {
      title: "Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
      images: ["/images/cyo_thumbnail.png"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
      images: ["/images/cyo_thumbnail.png"],
    },
  };

  return enhanceMetadataWithURLs(baseMetadata, "/");
}

export default async function Home() {
  // Fetch data on the server
  const [homeData, latestFeedPosts] = await Promise.all([
    getHomeDataServer("latest"),
    getLatestFeedPostsServer(),
  ]);

  // Extract data for components
  const initialLatestPosts = {
    latest: latestFeedPosts,
  };
  const initialMainCategories = homeData.mainCategories || [];
  const initialStats = homeData.stats || null;

  return (
    <HomeLayout activeNav="home">
      <HomeClient
        initialHomeData={homeData}
        initialMainCategories={initialMainCategories}
        initialLatestPosts={initialLatestPosts}
        initialStats={initialStats}
      />
    </HomeLayout>
  );
}
