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
import {
  getHomePosts,
  incrementPostView,
  incrementPostViewAuthenticated,
} from "@/app/Api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2 } from "lucide-react";
import TruncateText from "./truncate";
import { useAuthContext } from "@/contexts/Support";

export default function HomePosts() {
  const [posts, setPosts] = React.useState(null);
  const [loading, setLoading] = React.useState(true); // Manage loading state
  const [error, setError] = React.useState(null); // Manage error state
  const observerRef = React.useRef(null);
  const { loggedIn } = useAuthContext();

  // Ref to store the latest value of `loggedIn`
  const loggedInRef = React.useRef(loggedIn);

  // Update the ref when `loggedIn` changes
  React.useEffect(() => {
    loggedInRef.current = loggedIn;
  }, [loggedIn]);

  const getPosts = async () => {
    try {
      const res = await getHomePosts();
      console.log(res.data);
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false); // Set loading to false after the API call completes
    }
  };

  // Function to handle view increment when post enters viewport
  const handlePostView = (id) => {
    const isLoggedIn = loggedInRef.current; // Always use the current value of `loggedIn`
    console.log("LoggedIn:", isLoggedIn);

    if (isLoggedIn) {
      incrementPostViewAuthenticated(id);
    } else {
      incrementPostView(id); // Call the API to increment the view count
    }
  };

  // Set up the IntersectionObserver
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute("data-post-id");
            handlePostView(postId); // Increment view count when post is visible
            observer.unobserve(entry.target); // Stop observing once viewed
          }
        });
      },
      { threshold: 0.5 } // Adjust the threshold as needed
    );
    observerRef.current = observer;
  }, []);

  // Attach observer to each post element
  React.useEffect(() => {
    if (posts && observerRef.current) {
      posts.forEach((post) => {
        const postElement = document.querySelector(
          `[data-post-id="${post.id}"]`
        );
        if (postElement) {
          observerRef.current.observe(postElement);
        }
      });
    }
  }, [posts]);

  React.useEffect(() => {
    getPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 p-5 items-center flex-col">
        <div className="flex flex-row items-center">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Đang tải...
        </div>
      </div>
    ); // You might want to replace this with a spinner
  }

  if (error) {
    return <div className="flex flex-1 p-5 items-center flex-col">{error}</div>; // Show error message
  }

  return (
    <div
      className="flex flex-1 p-5 items-center flex-col"
      style={{ zoom: "1.4" }}
    >
      {posts.map((post) => (
        <div
          key={post.id} // Ensure this is unique
          data-post-id={post.id}
          className="max-w-[485px] mb-5 long-shadow w-[100%] h-min flex flex-row rounded-lg p-3.5 bg-white"
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
          <div className="flex-1 overflow-hidden break-words">
            <Link href={"/" + post.author.username + "/posts/" + post.id}>
              <h1 className="text-[14px] font-semibold mb-1 max-w-sm overflow-hidden whitespace-nowrap overflow-ellipsis">
                {post.title}
              </h1>
            </Link>
            <div className="text-[11px] max-w-[600px] overflow-wrap">
              <TruncateText text={post.content} maxWordsLength={90} />
            </div>
            <hr className="my-3 border-t-2" />
            <div className="flex-row flex text-[9px] items-center">
              <Link href={"/" + post.author.username}>
                <Avatar className="rounded-full w-6 h-6">
                  <AvatarImage
                    src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${post.author.username}/avatar`}
                    alt={post.author.username + " avatar"}
                  />
                  <AvatarFallback>
                    <User width={12} />
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
      ))}
    </div>
  );
}
