import HomeLayout from "@/layouts/HomeLayout";
import MyArchivesClient from "./MyArchivesClient";
import { getServer } from "@/utils/serverFetch";

export const metadata = {
  title: "Kho lưu trữ - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Xem và khôi phục các bài viết bạn đã chuyển vào kho lưu trữ, cùng những tin đã hết hạn, trên diễn đàn học sinh Chuyên Biên Hòa.",
  keywords: "kho lưu trữ, bài viết đã lưu trữ, tin đã hết hạn, diễn đàn, học sinh, chuyên biên hòa, cbh",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Kho lưu trữ - Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Xem và khôi phục các bài viết bạn đã chuyển vào kho lưu trữ, cùng những tin đã hết hạn, trên diễn đàn học sinh Chuyên Biên Hòa.",
    images: ["/images/cyo_thumbnail.png"],
    type: "website",
  },
};

async function getArchivedTopics() {
  try {
    const data = await getServer("/v1.0/user/archived-topics?per_page=30");
    return Array.isArray(data?.data) ? data.data : [];
  } catch (error) {
    console.error("Error fetching archived topics:", error);
    return [];
  }
}

// Story archive groups stories by date and already carries viewers_count /
// reactions_count per story (StoryController::getArchive).
async function getArchivedStories() {
  try {
    const data = await getServer("/v1.0/stories/archive");
    return Array.isArray(data?.data) ? data.data : [];
  } catch (error) {
    console.error("Error fetching archived stories:", error);
    return [];
  }
}

export default async function MyArchives() {
  const [archivedTopics, archivedStories] = await Promise.all([
    getArchivedTopics(),
    getArchivedStories(),
  ]);

  return (
    <HomeLayout activeNav="home" activeBar="my-archives">
      <MyArchivesClient
        archivedTopics={archivedTopics}
        archivedStories={archivedStories}
      />
    </HomeLayout>
  );
}
