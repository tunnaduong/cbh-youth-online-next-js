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

// "Bài viết mới nhất" always comes from the live, uncached ?mode=latest
// feed (ordered strictly by created_at desc) rather than /home's own
// latestPosts, so a brand-new post shows up immediately even on the very
// first server-rendered load of the page. Guests get the same ordering
// (the feed endpoint falls back to the public topic list).
async function getLatestFeedPageServer(page) {
  try {
    const data = await getServer(`/v1.0/topics/feed?mode=latest&page=${page}`);
    return {
      posts: data?.data || [],
      hasMore: Number(data?.current_page) < Number(data?.last_page),
    };
  } catch (error) {
    console.error(`Error fetching latest feed page ${page}:`, error);
    return { posts: [], hasMore: false };
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
  // Page 2 doubles as a wider pool for "Bài viết nổi bật" and is handed to
  // the latest-posts list so its first "Tải thêm" needs no extra request.
  const [homeData, firstPage, secondPage] = await Promise.all([
    getHomeDataServer("latest"),
    getLatestFeedPageServer(1),
    getLatestFeedPageServer(2),
  ]);

  const initialFeed = {
    posts: firstPage.posts,
    hasMore: firstPage.hasMore,
    nextPosts: firstPage.hasMore && secondPage.posts.length > 0 ? secondPage : null,
  };

  return (
    <HomeLayout activeNav="home" showRightSidebar={false}>
      <HomeClient
        initialMainCategories={homeData.mainCategories || []}
        initialStats={homeData.stats || null}
        initialFeed={initialFeed}
        featuredPool={[...firstPage.posts, ...secondPage.posts]}
      />
    </HomeLayout>
  );
}
