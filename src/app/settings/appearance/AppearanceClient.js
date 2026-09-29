"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DefaultLayout from "@/layouts/DefaultLayout";
import ProfileCustomizer from "@/components/profile/ProfileCustomizer";
import { useAuthContext } from "@/contexts/Support";

export default function AppearanceClient() {
  const { currentUser, loggedIn } = useAuthContext();

  return (
    <DefaultLayout activeNav="settings">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="mb-5 flex items-center gap-3">
          <Link
            href="/settings"
            aria-label="Quay lại Cài đặt"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700"
          >
            <ArrowLeft className="w-5 h-5 dark:text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Giao diện hồ sơ</h1>
        </div>

        {currentUser?.username ? (
          <ProfileCustomizer username={currentUser.username} />
        ) : loggedIn ? null : (
          <p className="text-gray-600 dark:text-gray-400">
            Vui lòng{" "}
            <Link href="/login?continue=/settings/appearance" className="text-primary-500 hover:underline">
              đăng nhập
            </Link>{" "}
            để tùy chỉnh giao diện.
          </p>
        )}
      </div>
    </DefaultLayout>
  );
}
