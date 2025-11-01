import React from "react";
import { getServer } from "@/utils/serverFetch";
import { notFound, redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

// Generate metadata for SEO
export async function generateMetadata() {
  return {
    title: "Cài đặt - Diễn đàn học sinh Chuyên Biên Hòa",
    description: "Quản lý cài đặt tài khoản và thiết lập thông báo email",
  };
}

export default async function SettingsPage() {
  // Fetch current user data
  let userData = null;
  let hasAuthError = false;

  try {
    // Use serverFetch to get authenticated user data
    userData = await getServer("/v1.0/user");
  } catch (error) {
    console.error("Settings page - Error fetching user data:", error);

    // Check if it's an authentication error
    const statusCode = error.message.match(/HTTP (\d+)/)?.[1];
    hasAuthError =
      statusCode === "401" ||
      statusCode === "403" ||
      error.message.includes("401") ||
      error.message.includes("Unauthenticated") ||
      error.message.includes("403");

    if (hasAuthError) {
      // Don't redirect here - let client-side handle it
      // This prevents redirect loops when cookies are being set
      console.log(
        "Settings page - Auth error detected, will redirect client-side"
      );
    } else {
      // For other errors, show not found
      console.error("Settings page - Unexpected error:", error);
      notFound();
    }
  }

  // If we got user data but it's invalid, also mark as auth error
  if (userData && !userData.id && !userData.username) {
    hasAuthError = true;
    userData = null;
  }

  // If authentication failed, pass null to client and let it handle redirect
  if (hasAuthError || !userData) {
    return <SettingsClient initialUser={null} hasAuthError={true} />;
  }

  // Transform API response to component format
  // API response: { id, username, email, profile_name, ... }
  const user = userData;

  // Fetch full profile data to get profile details (gender, bio, location, etc.)
  let fullProfileData = null;
  try {
    if (user.username) {
      const profileResponse = await getServer(
        `/v1.0/users/${user.username}/profile`
      );
      // profileResponse is { id, username, profile: {...}, stats: {...}, ... }
      const profileUser = profileResponse.user || profileResponse;
      if (profileUser && profileUser.profile) {
        fullProfileData = profileUser;
      }
    }
  } catch (error) {
    console.error("Error fetching profile data:", error);
    // Don't fail the page if profile fetch fails, just use basic user data
  }

  // Merge user data with profile data
  const mergedUser = fullProfileData
    ? {
        ...user,
        profile: fullProfileData.profile,
      }
    : {
        ...user,
        profile: {
          profile_name: user.profile_name || null,
          gender: null,
          location: null,
          bio: null,
          birthday: null,
        },
      };

  return <SettingsClient initialUser={mergedUser} hasAuthError={false} />;
}
