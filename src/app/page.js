import { getServer } from "@/utils/serverFetch";
import HomeLayout from "@/layouts/HomeLayout";
import HomeClient from "@/components/home/HomeClient";

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

// Generate metadata for SEO
export async function generateMetadata() {
  return {
    title: "Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
    keywords: "diễn đàn, học sinh, chuyên biên hòa, cbh, thpt chuyên hà nam",
  };
}

export default async function Home() {
  // Fetch data on the server
  const homeData = await getHomeDataServer("latest");

  // Extract data for components
  const initialLatestPosts = {
    latest: homeData.latestPosts || [],
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
