"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import PostItem from "@/components/forum/PostItem";

export default function MyArchivesClient({ archivedTopics }) {
  const [topics, setTopics] = useState(archivedTopics);

  useEffect(() => {
    setTopics(archivedTopics);
  }, [archivedTopics]);

  // PostItem does the restore call itself; this only drops the post from the
  // list once it's no longer archived.
  const handleArchiveChange = (postId, archived) => {
    if (!archived) {
      setTopics((prev) => prev.filter((topic) => topic.id !== postId));
    }
  };

  return (
    <div className="px-3 xl:min-h-screen py-4 md:max-w-[775px] mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Kho lưu trữ
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Những bài viết chỉ mình bạn thấy. Chọn &quot;Khôi phục bài viết&quot;
        trong menu của bài để đăng lại cho mọi người.
      </p>

      {topics.length === 0 ? (
        <div className="text-center py-12">
          <Image
            src="/images/sad_frog.png"
            alt="Empty state"
            width={136}
            height={136}
            className="mx-auto"
          />
          <p className="text-gray-500 dark:text-gray-400">
            Chưa có bài viết nào trong kho lưu trữ
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {topics.map((topic) => (
            <PostItem
              key={topic.id}
              post={topic}
              onArchiveChange={handleArchiveChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
