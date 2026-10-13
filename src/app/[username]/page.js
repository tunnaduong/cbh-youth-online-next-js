import React from "react";
import { getServer } from "@/utils/serverFetch";
import { notFound } from "next/navigation";
import { getOgImageURL, OG_IMAGE_SIZE } from "@/utils/seo";
import ProfileClient from "./ProfileClient";

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

    if (!userData) {
      return {
        title: "Người dùng không tồn tại - Diễn đàn học sinh Chuyên Biên Hòa",
        description: "Người dùng không tồn tại hoặc đã bị xóa",
      };
    }

    // API response may be direct user object or wrapped in 'user' key
    const user = userData.user || userData;
    const profileName = user.profile?.profile_name || user.username;
    const title = `${profileName} - Diễn đàn học sinh Chuyên Biên Hòa`;
    const description = `Hồ sơ của ${profileName} trên diễn đàn học sinh Chuyên Biên Hòa`;

    const ogImage = {
      url: getOgImageURL(`/profile/${encodeURIComponent(user.username)}`),
      ...OG_IMAGE_SIZE,
      alt: profileName,
    };

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [ogImage],
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage.url],
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

  // API response may be direct user object or wrapped in 'user' key
  // Ensure we have the correct structure for ProfileClient
  if (!userData) {
    notFound();
  }

  // Wrap in 'user' key if needed for transformProfileData
  const profileData = userData.user ? userData : { user: userData };

  // Determine active tab from pathname - for posts tab (default)
  const activeTab = "posts";

  return (
    <ProfileClient
      initialProfile={profileData}
      activeTab={activeTab}
      username={username}
    />
  );
}
