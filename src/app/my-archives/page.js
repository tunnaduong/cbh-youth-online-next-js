import HomeLayout from "@/layouts/HomeLayout";
import MyArchivesClient from "./MyArchivesClient";
import { getServer } from "@/utils/serverFetch";

export const metadata = {
  title: "Kho lưu trữ - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Xem và khôi phục các bài viết bạn đã chuyển vào kho lưu trữ trên diễn đàn học sinh Chuyên Biên Hòa.",
  keywords: "kho lưu trữ, bài viết đã lưu trữ, diễn đàn, học sinh, chuyên biên hòa, cbh",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Kho lưu trữ - Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Xem và khôi phục các bài viết bạn đã chuyển vào kho lưu trữ trên diễn đàn học sinh Chuyên Biên Hòa.",
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

export default async function MyArchives() {
  const archivedTopics = await getArchivedTopics();

  return (
    <HomeLayout activeNav="home" activeBar="my-archives">
      <MyArchivesClient archivedTopics={archivedTopics} />
    </HomeLayout>
  );
}
