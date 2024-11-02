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
  votePost,
  savePost,
  unsavePost,
} from "@/app/Api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import TruncateText from "./truncate";
import { useAuthContext } from "@/contexts/Support";
import SkeletonPost from "./skeletonPost";
import { useRouter } from "next/navigation";
import { useHomePost } from "@/contexts/HomePostContext";
import Image from "next/image";

export default function HomePosts() {
  const { posts, setPosts } = useHomePost();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const observerRef = React.useRef(null);
  const { loggedIn, currentUser } = useAuthContext();
  const [viewedPosts, setViewedPosts] = React.useState(new Set());
  const router = useRouter();

  const getPosts = async () => {
    try {
      const res = await getHomePosts();
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Có lỗi khi tải bài viết. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostView = (id) => {
    if (!viewedPosts.has(id)) {
      if (loggedIn) {
        incrementPostViewAuthenticated(id);
      } else {
        incrementPostView(id);
      }
      setViewedPosts((prev) => new Set(prev).add(id));
    } else {
      `Post ID: ${id} has already been viewed`;
    }
  };

  const handleVote = async (postId, vote_value) => {
    if (loggedIn === false) {
      router.push("/login");
      return;
    }

    // Create a copy of the current posts to revert if necessary
    const previousPosts = [...posts];

    // Find the current post
    const postIndex = posts.findIndex((post) => post.id === postId);
    const post = posts[postIndex];

    // Find the user's existing vote on the post
    const existingVote = post.votes.find(
      (vote) => vote.username === currentUser?.username
    );

    // Optimistically update the vote count
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          let newVotes = [...post.votes];

          if (existingVote) {
            // User has already voted
            if (existingVote.vote_value === vote_value) {
              // If the user clicks the same vote again, remove it (set to 0)
              newVotes = newVotes.filter(
                (vote) => vote.username !== currentUser?.username
              );
            } else {
              // If the user changes their vote, update it
              const updatedVote = {
                ...existingVote,
                vote_value: vote_value,
              };
              newVotes = newVotes.map((vote) =>
                vote.username === currentUser?.username ? updatedVote : vote
              );
            }
          } else {
            // User is voting for the first time
            newVotes.push({ username: currentUser?.username, vote_value });
          }

          // Calculate the new vote count
          const newVoteCount = newVotes.reduce(
            (accumulator, vote) => accumulator + vote.vote_value,
            0
          );

          // Return the updated post object
          return {
            ...post,
            votes: newVotes,
            voteCount: newVoteCount,
          };
        }
        return post;
      })
    );

    try {
      // Determine the correct vote value to send to the server
      const voteToSend =
        existingVote && existingVote.vote_value === vote_value ? 0 : vote_value;
      // Send the vote request to the server
      await votePost(postId, { vote_value: voteToSend });
    } catch (error) {
      console.error("Error voting on post:", error);
      // If there's an error, revert to the previous state
      setPosts(previousPosts);
    }
  };

  const handleSavePost = async (id) => {
    if (loggedIn === false) {
      router.push("/login");
      return;
    }

    const isCurrentlySaved = posts.find((post) => post.id === id)?.saved;

    // Optimistically update the UI
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === id ? { ...post, saved: !isCurrentlySaved } : post
      )
    );

    try {
      if (isCurrentlySaved) {
        // Call the API to unsave the post
        await unsavePost(id); // Make sure you have this function to call the DELETE API
      } else {
        // Call the API to save the post
        await savePost(id);
      }
    } catch (error) {
      console.error("Error saving/unsaving post:", error);
      // Rollback the UI in case of an error
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === id ? { ...post, saved: isCurrentlySaved } : post
        )
      );
    }
  };

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute("data-post-id");
            console.log(`Post is intersecting: ${postId}`);
            handlePostView(postId);
          }
        });
      },
      { threshold: 0.5 }
    );

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (posts.length > 0) {
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
    if (posts.length === 0) {
      getPosts();
    } else {
      setLoading(false); // No need to fetch if posts already exist
    }
  }, []);

  if (loading) {
    return (
      <div
        className="flex flex-1 p-5 items-center flex-col"
        style={{ zoom: "1.4" }}
      >
        {/* Use a loop to display multiple skeletons */}
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonPost key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="flex flex-1 p-5 items-center flex-col">{error}</div>;
  }

  return (
    <div
      className="flex flex-1 p-5 items-center flex-col"
      style={{ zoom: "1.4" }}
    >
      {posts.map((post) => (
        <div
          key={post.id}
          data-post-id={post.id}
          className="max-w-[485px] mb-5 long-shadow w-[100%] h-min flex flex-row rounded-lg p-3.5 bg-white"
        >
          <div className="min-w-[60px] items-center mt-1 flex-col flex ml-[-15px] text-[13px] font-semibold text-gray-400">
            <IoArrowUpOutline
              className={`text-[19px] cursor-pointer ${
                post.votes.some(
                  (vote) =>
                    vote.username === currentUser?.username &&
                    vote.vote_value === 1
                )
                  ? "text-green-600"
                  : ""
              }`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent bubbling up to the observer
                handleVote(post.id, 1);
              }}
            />
            <span
              className={
                post.votes.some(
                  (vote) =>
                    vote.username === currentUser?.username &&
                    vote.vote_value === 1
                )
                  ? "text-green-600 select-none"
                  : post.votes.some(
                      (vote) =>
                        vote.username === currentUser?.username &&
                        vote.vote_value === -1
                    )
                  ? "text-red-500 select-none"
                  : "select-none"
              }
            >
              {post.votes.reduce(
                (accumulator, vote) => accumulator + vote.vote_value,
                0
              )}
            </span>
            <IoArrowDownOutline
              className={`text-[19px] cursor-pointer ${
                post.votes.some(
                  (vote) =>
                    vote.username === currentUser?.username &&
                    vote.vote_value === -1
                )
                  ? "text-red-500"
                  : ""
              }`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent bubbling up to the observer
                handleVote(post.id, -1);
              }}
            />
            <div
              className={`${
                post.saved == true
                  ? "bg-[#CDEBCA] border-[#BFE5BB] text-[#319527]"
                  : "bg-[#EAEAEA]"
              } cursor-pointer rounded-md w-[19px] h-[19px] mt-2 border-[1.5px] flex items-center justify-center`}
              style={{ zoom: "1.2" }}
              onClick={() => handleSavePost(post.id)}
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
            {post.image_url && (
              <div className="rounded-md bg-[#E4EEE3] border overflow-hidden mt-4 max-h-96 flex items-center justify-center">
                <Image
                  src={
                    process.env.NEXT_PUBLIC_API_URL +
                    (process.env.NEXT_PUBLIC_STORAGE_URL || "/") +
                    post.image_url
                  }
                  width={700}
                  height={700}
                  alt="Ảnh bài viết"
                  className="object-contain max-h-96 text-[11px]"
                  priority={true}
                />
              </div>
            )}

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
                <Link
                  className="flex flex-row-reverse items-center"
                  href={"/" + post.author.username + "/posts/" + post.id}
                >
                  <span>{post.comments}</span>
                  <IoChatboxOutline className="text-[15px] mr-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
