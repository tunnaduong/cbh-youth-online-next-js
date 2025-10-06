import ForumSection from "@/components/ForumSection";
import ForumStats from "@/components/ForumStats";
import SEOContent from "@/components/SEOContent";
import StoriesSection from "@/components/StoriesSection";
import TopPosts from "@/components/TopPosts";
import HomeLayout from "@/layouts/HomeLayout";
import Head from "next/head";

export default function Home({ mainCategories, latestPosts, stats, currentSort }) {
  return (
    <HomeLayout activeNav="home">
      <Head title="Diễn đàn học sinh Chuyên Biên Hòa" />
      <div className="px-2.5">
        <div className="px-1 xl:min-h-screen pt-4 md:max-w-[775px] mx-auto space-y-6 mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Diễn đàn</h1>
          <StoriesSection />
          <TopPosts latestPosts={latestPosts} currentSort={currentSort} />
          <ForumSection mainCategories={mainCategories} />
          <ForumStats stats={stats} />
          <SEOContent />
        </div>
      </div>
    </HomeLayout>
  );
}
