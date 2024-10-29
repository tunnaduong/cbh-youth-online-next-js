"use client";

import Link from "next/link";
import React from "react";
import {
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoBookmark,
  IoEyeOutline,
  IoChatboxOutline,
} from "react-icons/io5";
import { getHomePosts } from "@/app/Api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

export default function HomePosts() {
  const [posts, setPosts] = React.useState(null);

  const getPosts = () => {
    getHomePosts().then((res) => {
      console.log(res.data);

      setPosts(res.data);
    });
  };

  React.useEffect(() => {
    getPosts();
  }, []);

  return (
    <div
      className="flex flex-1 p-5 items-center flex-col"
      style={{ zoom: "1.4" }}
    >
      {!posts ? (
        <>Loading</>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            className="max-w-lg mb-5 long-shadow w-[100%] h-min flex flex-row rounded-lg p-3.5 bg-white"
          >
            <div className="min-w-[60px] items-center mt-1 flex-col flex ml-[-15px] text-[13px] font-semibold text-gray-400">
              <IoArrowUpOutline className="text-[19px] cursor-pointer" />
              <span>
                {post.votes.reduce(
                  (accumulator, vote) => accumulator + vote.vote_value,
                  0
                )}
              </span>
              <IoArrowDownOutline className="text-[19px] cursor-pointer" />
              <div
                className="bg-[#EAEAEA] cursor-pointer rounded-md w-[19px] h-[19px] mt-2 border-[1.5px] flex items-center justify-center"
                style={{ zoom: "1.2" }}
              >
                <IoBookmark style={{ zoom: "0.9" }} />
              </div>
            </div>
            <div>
              <h1 className="text-[14px] font-semibold mb-1">{post.title}</h1>
              <p className="text-[11px]">{post.content}</p>
              <hr className="my-3 border-t-2" />
              <div className="flex-row flex text-[9px] items-center">
                <Link href={"/" + post.author.username}>
                  <Avatar className="rounded-full w-6 h-6">
                    <AvatarImage
                      src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${post.author.username}/avatar`}
                      alt={post.author.username + " avatar"}
                    />
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <span className="text-gray-500 ml-1.5">Đăng bởi</span>
                <Link
                  href={"/" + post.author.username}
                  className="text-[#319527] font-bold ml-0.5"
                >
                  {post.author.profile_name}
                </Link>
                <span className="mb-2 ml-0.5 text-sm text-gray-500">.</span>
                <span className="ml-0.5 text-gray-500">{post.time}</span>
                <div className="flex flex-1 flex-row-reverse items-center text-gray-500">
                  <span>{post.views}</span>
                  <IoEyeOutline className="text-[15px] mr-1 ml-2" />
                  <span>{post.comments}</span>
                  <IoChatboxOutline className="text-[15px] mr-1" />
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
