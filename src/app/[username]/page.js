import React from "react";
import { getServer } from "@/utils/serverFetch";
import { notFound } from "next/navigation";
import HomeLayout from "@/layouts/HomeLayout";

// Server-side data fetching for user profile
async function getUserProfileServer(username) {
  try {
    const data = await getServer(`/v1.0/users/${username}/profile`);
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    if (error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  try {
    const { username } = params;
    const userData = await getUserProfileServer(username);

    if (!userData || !userData.user) {
      return {
        title: "Người dùng không tồn tại - Diễn đàn học sinh Chuyên Biên Hòa",
        description: "Người dùng không tồn tại hoặc đã bị xóa",
      };
    }

    const user = userData.user;
    const title = `${
      user.profile_name || user.username
    } - Diễn đàn học sinh Chuyên Biên Hòa`;
    const description =
      user.bio ||
      `Hồ sơ của ${
        user.profile_name || user.username
      } trên diễn đàn học sinh Chuyên Biên Hòa`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: user.avatar_url
          ? [user.avatar_url]
          : ["/images/cyo_thumbnail.png"],
        type: "profile",
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: user.avatar_url
          ? [user.avatar_url]
          : ["/images/cyo_thumbnail.png"],
      },
    };
  } catch (error) {
    console.error("Error generating user metadata:", error);
    return {
      title: "Người dùng - Diễn đàn học sinh Chuyên Biên Hòa",
      description:
        "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
    };
  }
}

export default async function UserProfile({ params }) {
  const { username } = params;
  let userData = null;

  try {
    userData = await getUserProfileServer(username);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    notFound();
  }

  if (!userData || !userData.user) {
    notFound();
  }

  const user = userData.user;

  return (
    <HomeLayout activeNav="home">
      <div className="px-2.5">
        <div className="px-1 xl:min-h-screen pt-4 md:max-w-[775px] mx-auto space-y-6 mb-4">
          <div className="bg-white dark:bg-[var(--main-white)] long-shadow rounded-lg p-6">
            <div className="flex items-center space-x-4">
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.profile_name || user.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {user.profile_name || user.username}
                </h1>
                {user.username !== user.profile_name && (
                  <p className="text-gray-600 dark:text-gray-400">
                    @{user.username}
                  </p>
                )}
                {user.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {user.stats && (
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary-500">
                    {user.stats.posts_count || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Bài viết
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-500">
                    {user.stats.comments_count || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Bình luận
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-500">
                    {user.stats.points || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Điểm
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
