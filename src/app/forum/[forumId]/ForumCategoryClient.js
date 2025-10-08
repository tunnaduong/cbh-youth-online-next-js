"use client";

import { useState, useEffect } from "react";
import HomeLayout from "@/layouts/HomeLayout";
import Link from "next/link";
import { getForumCategories } from "@/app/Api";
import { useForumData } from "@/contexts/ForumDataContext";
import { Chatbubbles } from "react-ionicons";
import Badges from "@/components/ui/Badges";
import { notFound } from "next/navigation";
import SkeletonLoader from "./skeletonLoader";
import SEOContent from "@/components/marketing/SEOContent";

export default function ForumCategoryClient({ params, initialCategory }) {
  const { forumId } = params;
  const [category, setCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(!initialCategory);
  const [error, setError] = useState(null);

  // Use context data for caching
  const { forumCategories } = useForumData();

  useEffect(() => {
    const fetchForumData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to get from context cache
        if (forumCategories.length > 0) {
          const foundCategory = forumCategories.find(
            (cat) => cat.slug === forumId
          );
          if (foundCategory) {
            setCategory(foundCategory);
            setLoading(false);
            return;
          }
        }

        // If not in cache, fetch from API
        const response = await getForumCategories();
        const categories = response.data;
        const foundCategory = categories.find((cat) => cat.slug === forumId);

        if (foundCategory) {
          setCategory(foundCategory);
        } else {
          setError("Category not found");
        }
      } catch (err) {
        console.error("Error fetching forum data:", err);
        setError("Failed to load forum data");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we don't have initial data or if initial data is invalid
    if (forumId && (!initialCategory || !initialCategory.subforums)) {
      fetchForumData();
    }
  }, [forumId, forumCategories, initialCategory]);

  // Helper function to generate post slug
  const generatePostSlug = (id, title) => {
    if (!id || !title) return "";
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${id}-${slug}`;
  };

  // Helper function for routing
  const route = (name, params) => {
    if (name === "posts.show") {
      return `/${params.username}/${params.id}`;
    }
    if (name === "profile.show") {
      return `/${params.username}`;
    }
    return "#";
  };

  if (loading) {
    return (
      <HomeLayout>
        <SkeletonLoader />
      </HomeLayout>
    );
  }

  if (error || !category) {
    notFound();
  }

  return (
    <HomeLayout>
      <div className="px-2.5 py-6 flex justify-center">
        <div className="max-w-[775px] w-[100%]">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb">
            <ol className="flex items-center space-x-2 text-sm px-1.5">
              <li className="flex items-center">
                <Link
                  href="/"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-base"
                >
                  Diễn đàn
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-gray-400">/</span>
                <span
                  className="text-gray-900 dark:text-gray-100 text-base"
                  aria-current="page"
                >
                  {category.name}
                </span>
              </li>
            </ol>
          </nav>
          <div className="bg-white dark:!bg-[var(--main-white)] long-shadow rounded-lg mt-2 p-4 relative z-10 overflow-hidden">
            <div>
              <div
                className="w-[50%] absolute h-full mb-4 top-0 right-0 -z-10"
                style={{
                  backgroundImage: `url("/images/${category.background_image}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <div className="fade-to-left" />
            </div>
            <Link
              href={`/forum/${category.slug}`}
              className="text-lg font-semibold uppercase dark:text-white"
            >
              {category.name}
            </Link>
            <p className="!mt-3 text-base dark:text-neutral-300">
              {category.description}
            </p>
          </div>
          <div className="bg-white dark:!bg-[var(--main-white)] long-shadow rounded-lg !mt-5">
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
                      className="text-[#319528] hover:text-[#319528] text-base font-bold w-fit"
                    >
                      {subforum.name}
                    </Link>
                    <span className="text-sm text-gray-500">
                      Bài viết:{" "}
                      <span className="mr-1 font-semibold text-black dark:!text-[#f3f4f6]">
                        {subforum.post_count}
                      </span>
                      Bình luận:{" "}
                      <span className="text-black dark:!text-[#f3f4f6] font-semibold">
                        {subforum.comment_count}
                      </span>
                    </span>
                  </div>
                  {subforum.latest_post ? (
                    <div
                      style={{ maxWidth: "calc(42%)" }}
                      className="flex-1 bg-[#E7FFE4] dark:!bg-[#2b2d2c] dark:!border-[#545454] text-[13px] p-2 px-2 rounded-md flex-col hidden sm:flex border-all"
                    >
                      <div className="flex">
                        <span className="whitespace-nowrap mr-1 dark:text-neutral-300">
                          Mới nhất:
                        </span>
                        <Link
                          href={route("posts.show", {
                            username: subforum.latest_post?.user?.username,
                            id: generatePostSlug(
                              subforum.latest_post?.id,
                              subforum.latest_post?.title
                            ),
                          })}
                          className="text-[#319528] hover:text-[#319528] hover:underline inline-block text-ellipsis whitespace-nowrap overflow-hidden"
                        >
                          {subforum.latest_post?.title}
                        </Link>
                      </div>
                      <div className="flex items-center mt-1 text-[#319528]">
                        {subforum.latest_post?.anonymous ? (
                          <span className="hover:text-[#319528] truncate">
                            Người dùng ẩn danh
                          </span>
                        ) : (
                          <>
                            <Link
                              href={route("profile.show", {
                                username: subforum.latest_post?.user?.username,
                              })}
                              className="hover:text-[#319528] hover:underline truncate"
                            >
                              {subforum.latest_post?.user?.name ||
                                subforum.latest_post?.user?.username}
                            </Link>
                            {subforum.latest_post?.user?.verified == "1" && (
                              <Badges />
                            )}
                          </>
                        )}
                        <span className="text-black shrink-0 dark:text-neutral-300">
                          , {subforum.latest_post?.created_at}
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
        </div>
      </div>
      <SEOContent seoDescription={category.seo_description} />
    </HomeLayout>
  );
}
