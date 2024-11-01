"use client";

import React, { use } from "react";
import Navbar from "@/components/include/navbar";
import LeftSidebar from "@/components/include/leftSidebar";
import RightSidebar from "@/components/include/rightSidebar";
import {
  getPostDetail,
  votePost,
  savePost,
  unsavePost,
  incrementPostViewAuthenticated,
  incrementPostView,
  commentPost,
} from "@/app/Api";
import {
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoBookmark,
  IoEyeOutline,
  IoChatboxOutline,
} from "react-icons/io5";
import Link from "next/link";
import TruncateText from "@/components/home/truncate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Loader2, Send, User } from "lucide-react";
import Image from "next/image";
import SkeletonPost from "@/components/home/skeletonPost";
import { useAuthContext } from "@/contexts/Support";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PostDetail({ params }) {
  const { postId } = use(params);
  const [post, setPost] = React.useState(null);
  const { currentUser, loggedIn } = useAuthContext();
  const [newComment, setNewComment] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const _getPostDetail = async () => {
    const res = await getPostDetail(postId);
    setPost(res.data);
  };

  React.useEffect(() => {
    _getPostDetail();
    handlePostView(postId);
  }, []);

  const handlePostView = (id) => {
    if (loggedIn) {
      incrementPostViewAuthenticated(id);
    } else {
      incrementPostView(id);
    }
  };

  const handleVote = async (postId, vote_value) => {
    if (loggedIn === false) {
      router.push("/login");
      return;
    }

    // Find the user's existing vote on the post
    const existingVote = post.votes.find(
      (vote) => vote.username === currentUser?.username
    );

    // Optimistically update the vote count
    setPost((post) => {
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
    });

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

    const isCurrentlySaved = post.saved;

    // Optimistically update the UI
    setPost((post) =>
      post.id === id ? { ...post, saved: !isCurrentlySaved } : post
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

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Send the new comment to the API and get the response
      const response = await commentPost(postId, { comment: newComment });

      // Add the new comment to the UI
      const newCommentObject = {
        id: response.data.id, // or response.data.commentId, depending on your API response
        content: newComment,
        author: {
          username: currentUser?.username,
          profile_name: currentUser?.profile_name,
        },
        created_at: response.data.created_at, // or response.data.createdAt
        votes: [],
      };

      setPost((prevPost) => ({
        ...prevPost,
        comments: [newCommentObject, ...prevPost.comments],
      }));

      // Clear the comment input field and stop loading
      setNewComment("");
      setIsLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || "Error adding comment.");
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-[66px]">
      <Navbar selected={0} />
      <div className="flex flex-row">
        <LeftSidebar selected="feed" />
        <div
          className="flex flex-1 p-5 items-center flex-col"
          style={{ zoom: "1.4" }}
        >
          {post ? (
            <>
              <div>
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
                    <h1 className="text-[14px] font-semibold mb-1 max-w-sm overflow-hidden whitespace-nowrap overflow-ellipsis">
                      {post.title}
                    </h1>
                    <div className="text-[11px] max-w-[600px] overflow-wrap">
                      <TruncateText text={post.content} maxWordsLength={90} />
                    </div>
                    {post.image_url && (
                      <div className="rounded-md bg-[#E4EEE3] border overflow-hidden mt-4 max-h-96 flex items-center justify-center">
                        <Image
                          src={process.env.NEXT_PUBLIC_API_URL + post.image_url}
                          width={700}
                          height={700}
                          alt="Ảnh bài viết"
                          className="object-contain max-h-96 text-[11px]"
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
                      <span className="mb-2 ml-0.5 text-sm text-gray-500">
                        .
                      </span>
                      <span className="ml-0.5 text-gray-500">{post.time}</span>
                      <div className="flex flex-1 flex-row-reverse items-center text-gray-500">
                        <span>{post.views_count}</span>
                        <IoEyeOutline className="text-[15px] mr-1 ml-2" />
                        <span>{post.comments_count}</span>
                        <IoChatboxOutline className="text-[15px] mr-1" />
                      </div>
                    </div>
                  </div>
                </div>
                <Card className="max-w-[485px] mb-5 long-shadow w-[100%] h-min rounded-lg bg-white">
                  <CardHeader className="text-[14px] -mb-4 font-semibold max-w-sm overflow-hidden whitespace-nowrap overflow-ellipsis">
                    Bình luận
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={handleSubmitComment}
                      className="space-y-4 mb-7"
                      style={{ zoom: "0.7" }}
                    >
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Lỗi</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <Textarea
                        placeholder="Viết bình luận của bạn..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />

                      <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Gửi bình luận
                          </>
                        )}
                      </Button>
                    </form>
                    {post.comments.length == 0 ? (
                      <div className="text-[11px]">
                        Không có bình luận nào cho bài viết này. Hãy là người
                        đầu tiên để lại ý kiến của bạn!
                      </div>
                    ) : (
                      <div className="gap-y-4 flex flex-col">
                        {post.comments.map((comment) => (
                          <div
                            style={{ zoom: "0.7" }}
                            key={comment.id}
                            className="flex space-x-4"
                          >
                            <Avatar>
                              <AvatarImage
                                src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${comment.author.username}/avatar`}
                                alt={comment.author.profile_name}
                              />
                              <AvatarFallback>
                                <User />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">
                                  {comment.author.profile_name}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {comment.created_at}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-700">
                                {comment.content}
                              </p>
                              <div className="mt-2 flex items-center space-x-2 text-gray-400">
                                <IoArrowUpOutline className="cursor-pointer" />
                                <span className="text-sm font-semibold select-none">
                                  {comment.votes.reduce(
                                    (accumulator, vote) =>
                                      accumulator + vote.vote_value,
                                    0
                                  )}
                                </span>
                                <IoArrowDownOutline className="cursor-pointer" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            Array.from({ length: 1 }).map((_, index) => (
              <SkeletonPost key={index} />
            ))
          )}
        </div>
        <RightSidebar />
      </div>
    </div>
  );
}
