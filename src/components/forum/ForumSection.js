"use client";

import { Chatbubbles } from "react-ionicons";
import { moment } from "@/utils/momentConfig";
import Link from "next/link";
import { generatePostSlug } from "@/utils/slugify";
import VerifiedBadge from "@/components/ui/Badges";
import { useState, useEffect } from "react";
import { useForumData } from "@/contexts/ForumDataContext";
import SkeletonLoader from "./skeletonLoader";
import Badges from "@/components/ui/Badges";

export default function ForumSection() {
  // Use context data
  const { mainCategories, homeDataLoading, homeDataError } = useForumData();

  if (homeDataLoading) {
    return (
      <>
        <SkeletonLoader />
        <SkeletonLoader />
        <SkeletonLoader />
      </>
    );
  }

  if (homeDataError) {
    return (
      <div className="max-w-[775px] w-[100%]">
        <div className="flex items-center justify-center py-8 text-red-500">
          <span>Lỗi: {homeDataError}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[775px] w-[100%]">
      {mainCategories.map((category) => (
        <>
          <Link
            href={`/forum/${category.slug}`}
            className="text-lg font-semibold px-4 uppercase dark:text-neutral-300"
          >
            {category.name}
          </Link>
          <div className="bg-white dark:!bg-[var(--main-white)] long-shadow rounded-lg mt-2 mb-6">
            {category.subforums.map((subforum, index) => (
              <>
                <div className="flex flex-row items-center min-h-[78px] pr-2">
                  <Chatbubbles
                    color="#319528"
                    height="32px"
                    width="32px"
                    className="p-4"
                  />
                  <div className="flex flex-col flex-1">
                    <Link
                      href={`/forum/${category.slug}/${subforum.slug}`}
                      className="text-primary-500 hover:text-primary-500 text-base font-bold w-fit"
                    >
                      {subforum.name}
                    </Link>
                    <span className="text-sm text-gray-500">
                      Bài viết:{" "}
                      <span className="mr-1 font-semibold text-black dark:!text-[#f3f4f6]">
                        {subforum.topics_count}
                      </span>
                      Bình luận:{" "}
                      <span className="text-black dark:!text-[#f3f4f6] font-semibold">
                        {subforum.comments_count}
                      </span>
                    </span>
                  </div>
                  {/* Mới nhất */}
                  {subforum.latest_topic && subforum.latest_topic.title ? (
                    <div
                      style={{ maxWidth: "calc(42%)" }}
                      className="flex-1 bg-[#E7FFE4] dark:!bg-[#2b2d2c] dark:!border-[#545454] text-[13px] p-2 px-2 rounded-md flex-col hidden sm:flex border-all"
                    >
                      <div className="flex">
                        <span className="whitespace-nowrap mr-1 dark:text-neutral-300">
                          Mới nhất:
                        </span>
                        <Link
                          href={`/${
                            subforum.latest_topic?.anonymous
                              ? "anonymous"
                              : subforum.latest_topic?.username || "anonymous"
                          }/posts/${generatePostSlug(
                            subforum.latest_topic?.id,
                            subforum.latest_topic?.title
                          )}`}
                          className="text-primary-500 hover:text-primary-500 hover:underline inline-block text-ellipsis whitespace-nowrap overflow-hidden"
                        >
                          {subforum.latest_topic?.title || (
                            <span>(Chưa có tiêu đề)</span>
                          )}
                        </Link>
                      </div>
                      <div className="flex items-center mt-1 text-primary-500">
                        {subforum.latest_topic?.anonymous ? (
                          <span className="hover:text-primary-500 truncate">
                            Người dùng ẩn danh
                          </span>
                        ) : (
                          <>
                            <div className="flex items-center truncate">
                              <Link
                                href={`/${
                                  subforum.latest_topic?.username || "anonymous"
                                }`}
                                className="hover:text-primary-500 hover:underline truncate"
                              >
                                {subforum.latest_topic?.author_name}
                              </Link>
                              {subforum.latest_topic?.verified && (
                                <Badges className="ml-0.5 mb-0.5 inline-verified__badge flex-shrink-0" />
                              )}
                            </div>
                          </>
                        )}
                        <span className="text-black shrink-0 dark:!text-neutral-300">
                          ,{" "}
                          {subforum.latest_topic?.created_at
                            ? moment(subforum.latest_topic.created_at).fromNow()
                            : ""}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{ maxWidth: "calc(42%)", minHeight: 61 }}
                      className="flex-1 bg-[#E7FFE4] dark:!bg-[#2b2d2c] dark:!border-[#545454] text-[13px] p-2 px-2 rounded-md flex-col hidden sm:flex border-all"
                    >
                      <span className="text-sm text-gray-500">
                        Không có bài viết mới nhất
                      </span>
                    </div>
                  )}
                </div>
                {index !== category.subforums.length - 1 && <hr />}
              </>
            ))}
          </div>
        </>
      ))}
    </div>
  );
}
