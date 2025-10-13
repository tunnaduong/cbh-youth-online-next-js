"use client";

import HomeLayout from "@/layouts/HomeLayout";
import RecordingItem from "./partials/RecordingItem";

export default function RecordingsClient({ recordings }) {
  return (
    <HomeLayout activeBar={"recordings"}>
      <div className="px-1 xl:min-h-screen pt-4 md:max-w-[775px] mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 px-1">
          Loa lớn
        </h1>

        {recordings.recordings.map((recording) => (
          <RecordingItem key={recording.id} recording={recording} />
        ))}
      </div>
    </HomeLayout>
  );
}
