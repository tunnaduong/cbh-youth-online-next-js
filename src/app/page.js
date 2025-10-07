import { Suspense } from "react";
import ForumSection from "@/components/forum/ForumSection";
import ForumStats from "@/components/forum/ForumStats";
import TopPosts from "@/components/forum/TopPosts";
import SEOContent from "@/components/marketing/SEOContent";
import StoriesSection from "@/components/stories/StoriesSection";
import HomeLayout from "@/layouts/HomeLayout";

// Force dynamic rendering to avoid SSG issues with window/browser APIs
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <HomeLayout activeNav="home">
      <div className="px-2.5">
        <div className="px-1 xl:min-h-screen pt-4 md:max-w-[775px] mx-auto space-y-6 mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Diễn đàn
          </h1>
          <StoriesSection />
          <Suspense fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>}>
            <TopPosts />
          </Suspense>
          <ForumSection />
          <ForumStats />
          <SEOContent />
        </div>
      </div>
    </HomeLayout>
  );
}
