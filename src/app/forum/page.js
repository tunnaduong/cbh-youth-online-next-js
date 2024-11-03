"use client";

import Navbar from "@/components/include/navbar";
import LeftSidebar from "@/components/include/leftSidebar";
import RightSidebar from "@/components/include/rightSidebar";
import { IoChatbubblesSharp } from "react-icons/io5";
import { HiBadgeCheck } from "react-icons/hi";
import Link from "next/link";
import React from "react";
import { getForumCategories } from "../Api";
import SkeletonLoader from "@/components/forum/skeletonLoader";

export default function Forum() {
  const [forum, setForum] = React.useState(null);

  const getForum = async () => {
    try {
      const res = await getForumCategories();
      setForum(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  React.useEffect(() => {
    getForum();
  }, []);

  return (
    <div className="mt-[66px]">
      <Navbar selected={0} />
      <div className="flex flex-row">
        <LeftSidebar selected="forum" />
        <div
          className="flex flex-1 p-5 items-center flex-col"
          style={{ zoom: "1.4" }}
        >
          {forum ? (
            forum.map((item) => (
              <div className="max-w-lg w-[100%] mb-6" key={item.id}>
                <Link
                  href={`/forum/${item.id}`}
                  className="text-[13px] font-semibold px-4"
                >
                  {item.name.toUpperCase()}
                </Link>
                <div className="bg-white long-shadow rounded-lg mt-2">
                  {item.subforums.map((subforum, index) => (
                    <div key={subforum.id}>
                      <div className="flex flex-row items-center">
                        <IoChatbubblesSharp className="text-[#319528] text-[23px] m-4" />
                        <div className="flex flex-col flex-1">
                          <Link
                            href={`/forum/${item.id}/subforum/${subforum.id}`}
                            className="text-[#319528] text-[12px] font-bold w-fit"
                          >
                            {subforum.name}
                          </Link>
                          <span className="text-[10px] text-gray-500">
                            Bài viết:{" "}
                            <span className="mr-1 font-semibold text-black">
                              {subforum.post_count}
                            </span>{" "}
                            Bình luận:{" "}
                            <span className="text-black font-semibold">
                              {subforum.comment_count}
                            </span>
                          </span>
                        </div>
                        {subforum.latest_post && (
                          <div
                            style={{ maxWidth: "calc(42%)" }}
                            className="flex-1 bg-[#E7FFE4] p-1 px-2 mr-2 rounded-md"
                          >
                            <div className="leading-3 flex">
                              <span className="text-[10px] whitespace-nowrap mr-1">
                                Mới nhất:
                              </span>
                              <Link
                                href="#"
                                className="text-[10px] text-[#319528] inline-block leading-3 text-ellipsis whitespace-nowrap overflow-hidden"
                              >
                                {subforum.latest_post.title}
                              </Link>
                            </div>
                            <div className="leading-3 flex items-center mt-1 text-[#319528]">
                              <Link href="#" className="text-[10px]">
                                {subforum.latest_post.user.name}
                              </Link>
                              {subforum.latest_post.user.verified == 1 && (
                                <HiBadgeCheck className="text-[11px] leading-5 ml-0.5" />
                              )}
                              <span className="text-[10px] text-black">
                                , {subforum.latest_post.created_at}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      {index !== item.subforums.length - 1 && <hr />}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <SkeletonLoader />
          )}
        </div>
        <RightSidebar />
      </div>
    </div>
  );
}
