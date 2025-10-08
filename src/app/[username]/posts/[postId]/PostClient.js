"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/Support";
import { useForumData } from "@/contexts/ForumDataContext";
import { getPostDetail } from "@/app/Api";
import { CommentInput } from "@/components/forum/CommentInput";
import Comment from "@/components/forum/Comment";
import EmptyCommentsState from "@/components/forum/EmptyCommentsState";
import PostItem from "@/components/forum/PostItem";
import { message } from "antd";
import Link from "next/link";
import Lottie from "lottie-react";
import refreshAnimation from "@/assets/refresh.json";
import { useRouter, notFound } from "next/navigation";
import { generatePostSlug } from "@/utils/slugify";

// Helper function to extract numeric ID from postId (e.g., "399873567-giveaway" -> "399873567")
const extractNumericId = (postId) => {
  const match = postId.match(/^(\d+)/);
  return match ? match[1] : postId;
};

export default function PostClient({ params, postData }) {
  const { currentUser, loggedIn } = useAuthContext();
  const [post, setPost] = useState(postData);
  const [comments, setComments] = useState(postData?.comments || []);
  const [loading, setLoading] = useState(!postData);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Use context data for caching
  const {
    postDetails,
    postComments,
    postDataLoading,
    postDataError,
    fetchPostDetail,
  } = useForumData();

  // Fetch post detail and comments
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setLoading(true);
        setError(null);

        const numericId = extractNumericId(params.postId);

        // First try to get from context cache
        if (postDetails[numericId]) {
          const cachedData = postDetails[numericId];
          setPost(cachedData);
          setComments(postComments[numericId] || []);

          // Check if the current URL slug matches the correct slug
          if (cachedData && cachedData.post) {
            const correctSlug = generatePostSlug(
              cachedData.post.id,
              cachedData.post.title
            );
            const currentSlug = params.postId;

            // If the current slug doesn't match the correct slug, redirect
            if (currentSlug !== correctSlug) {
              const correctUrl = `/${params.username}/posts/${correctSlug}`;
              router.replace(correctUrl);
              return;
            }
          }

          setLoading(false);
          return;
        }

        // If not in cache, fetch from API
        const data = await fetchPostDetail(numericId);
        setPost(data);
        setComments(data.comments || []);

        // Check if the current URL slug matches the correct slug
        if (data && data.post) {
          const correctSlug = generatePostSlug(data.post.id, data.post.title);
          const currentSlug = params.postId;

          // If the current slug doesn't match the correct slug, redirect
          if (currentSlug !== correctSlug) {
            const correctUrl = `/${params.username}/posts/${correctSlug}`;
            router.replace(correctUrl);
            return;
          }
        }
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra khi tải bài viết");
        message.error("Có lỗi xảy ra khi tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    if (params.postId && !postData) {
      fetchPostData();
    }
  }, [params.postId, postDetails, postComments, fetchPostDetail, postData]);

  // Helper function to get time display
  const getTimeDisplay = (comment) => {
    if (comment.created_at) {
      const now = new Date();
      const commentTime = new Date(comment.created_at);
      const diffInMinutes = Math.floor((now - commentTime) / (1000 * 60));

      if (diffInMinutes < 1) return "Vừa xong";
      if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
      if (diffInMinutes < 1440)
        return `${Math.floor(diffInMinutes / 60)} giờ trước`;
      return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    }
    return "Không rõ thời gian";
  };

  // Handle comment editing
  const handleEditComment = (commentId, newContent) => {
    // Store original content for rollback
    const originalComments = [...comments];

    // Optimistically update comment in UI
    const updateCommentInTree = (comments) => {
      return comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            content: newContent,
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: updateCommentInTree(comment.replies),
          };
        }
        return comment;
      });
    };

    setComments(updateCommentInTree(comments));
    message.success("Bình luận đã được cập nhật thành công");

    // TODO: Implement comment update API call
    // For now, just show success message
    setTimeout(() => {
      // Simulate API call
      message.success("Bình luận đã được cập nhật thành công");
    }, 500);
  };

  // Handle adding replies
  const handleReplyToComment = (parentId, content, isAnonymous = false) => {
    // Optimistically add reply to UI
    const newReply = {
      id: Date.now().toString(),
      content: content,
      is_anonymous: isAnonymous,
      author: isAnonymous
        ? {
            username: "Người dùng ẩn danh",
            profile_name: "Người dùng ẩn danh",
          }
        : {
            username: currentUser?.username,
            profile_name: currentUser?.profile_name || currentUser?.username,
          },
      created_at: "vài giây trước",
      votes: [],
      replies: [],
      isPending: true,
    };

    let level2ParentId = null;

    const addReplyToComment = (comments, level = 1, parentLevel2Id = null) => {
      return comments.map((comment) => {
        // Found the target comment
        if (comment.id === parentId) {
          if (level >= 3) {
            // Store level 2 parent ID when target is at level 3 or deeper
            level2ParentId = parentLevel2Id;
            return comment;
          }

          // Normal case: add as child
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
          };
        }

        // Search in replies
        if (comment.replies && comment.replies.length > 0) {
          // Check if target is in direct children (level 2)
          const directChild = comment.replies.find(
            (reply) => reply.id === parentId
          );
          if (directChild && level === 1) {
            // Target is at level 2, add normally
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === parentId
                  ? { ...reply, replies: [...(reply.replies || []), newReply] }
                  : reply
              ),
            };
          }

          // Check if target is in grandchildren (level 3)
          const hasLevel3Target = comment.replies.some(
            (reply) =>
              reply.replies && reply.replies.some((r) => r.id === parentId)
          );

          if (hasLevel3Target && level === 1) {
            // Target is at level 3, add as sibling at level 3
            return {
              ...comment,
              replies: comment.replies.map((reply) => {
                if (
                  reply.replies &&
                  reply.replies.some((r) => r.id === parentId)
                ) {
                  level2ParentId = reply.id; // Store level 2 parent ID
                  return {
                    ...reply,
                    replies: [...reply.replies, newReply], // Add as sibling
                  };
                }
                return reply;
              }),
            };
          }

          // Continue searching deeper
          return {
            ...comment,
            replies: addReplyToComment(
              comment.replies,
              level + 1,
              level === 1 ? comment.id : parentLevel2Id
            ),
          };
        }

        return comment;
      });
    };

    const updatedComments = addReplyToComment(comments);
    setComments(updatedComments);
    message.success("Đã trả lời bình luận thành công");

    // TODO: Implement comment reply API call
    // For now, just show success message
    setTimeout(() => {
      // Simulate API call
      message.success("Đã trả lời bình luận thành công");
    }, 500);
  };

  const handleSubmitComment = (content, isAnonymous = false) => {
    // Optimistically add comment to UI
    const tempComment = {
      id: Date.now().toString(),
      content: content,
      is_anonymous: isAnonymous,
      author: isAnonymous
        ? {
            username: "Người dùng ẩn danh",
            profile_name: "Người dùng ẩn danh",
          }
        : {
            username: currentUser?.username,
            profile_name: currentUser?.profile_name || currentUser?.username,
          },
      created_at: "vài giây trước",
      votes: [],
      replies: [],
      isPending: true,
    };

    setComments([tempComment, ...comments]);
    message.success("Bình luận đã được đăng thành công");

    // TODO: Implement comment submit API call
    // For now, just show success message
    setTimeout(() => {
      // Simulate API call
      message.success("Bình luận đã được đăng thành công");
    }, 500);
  };

  const handleDeleteComment = (commentId) => {
    // Store original comments for rollback
    const originalComments = [...comments];

    // Optimistically remove comment from UI
    const removeCommentFromTree = (comments) => {
      return comments
        .filter((comment) => comment.id !== commentId)
        .map((comment) => {
          if (comment.replies) {
            return {
              ...comment,
              replies: removeCommentFromTree(comment.replies),
            };
          }
          return comment;
        });
    };

    setComments(removeCommentFromTree(comments));
    message.success("Bình luận đã được xóa thành công");

    // TODO: Implement comment delete API call
    // For now, just show success message
    setTimeout(() => {
      // Simulate API call
      message.success("Bình luận đã được xóa thành công");
    }, 500);
  };

  const handleVote = (postId, value) => {
    if (!currentUser) {
      router.push(
        "/login?continue=" + encodeURIComponent(window.location.href)
      );
      message.error("Bạn cần đăng nhập để thực hiện hành động này");
      return;
    }

    setPost((prev) => {
      // Kiểm tra user đã vote chưa
      let existingVote = prev.votes.find(
        (v) => v.username === currentUser?.username
      );
      let newVotes;

      if (existingVote) {
        if (existingVote.vote_value === value) {
          // Ấn lại -> bỏ vote
          newVotes = prev.votes.filter(
            (v) => v.username !== currentUser?.username
          );
        } else {
          // Đổi hướng vote
          newVotes = prev.votes.map((v) =>
            v.username === currentUser?.username
              ? { ...v, vote_value: value }
              : v
          );
        }
      } else {
        // Thêm vote mới
        newVotes = [
          ...prev.votes,
          { username: currentUser?.username, vote_value: value },
        ];
      }

      return { ...prev, votes: newVotes };
    });

    // TODO: Implement vote API call
    // For now, just show success message
    setTimeout(() => {
      // Simulate API call
      message.success("Đã vote thành công");
    }, 500);
  };

  if (loading || postDataLoading) {
    return (
      <div className="px-1 xl:min-h-screen pt-4 flex items-center justify-center">
        <div className="text-center">
          <Lottie
            animationData={refreshAnimation}
            loop={true}
            style={{ width: 80, height: 80 }}
            className="mx-auto mb-4"
          />
          <p className="dark:text-neutral-300">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (error || postDataError || !post) {
    notFound();
  }

  return (
    <div className="px-1 xl:min-h-screen pt-4">
      <PostItem post={post.post} single={true} onVote={handleVote} />
      <div className="px-1.5 md:px-0 md:max-w-[775px] mx-auto w-full mb-4">
        <div className="shadow !mb-4 long-shadow h-min rounded-lg bg-white post-comment-container overflow-clip">
          <div className="flex flex-col space-y-1.5 p-6 text-xl -mb-4 dark:text-neutral-300 font-semibold max-w-sm overflow-hidden whitespace-nowrap overflow-ellipsis">
            Bình luận
          </div>
          <div className="p-6 pt-2 pb-0 relative">
            {!loggedIn ? (
              <div className="text-base dark:text-neutral-300">
                <Link
                  className="text-green-600 hover:text-green-600"
                  href={
                    "/login?continue=" +
                    (typeof window !== "undefined"
                      ? encodeURIComponent(window.location.href)
                      : "/")
                  }
                >
                  Đăng nhập
                </Link>{" "}
                để bình luận và tham gia thảo luận cùng cộng đồng.
              </div>
            ) : (
              <CommentInput onSubmit={handleSubmitComment} />
            )}
            <div className="pb-6 pt-2">
              {!Array.isArray(comments) || comments.length === 0 ? (
                <EmptyCommentsState />
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="mt-6">
                    <Comment
                      comment={comment}
                      level={0}
                      onEdit={handleEditComment}
                      onReply={handleReplyToComment}
                      onDelete={handleDeleteComment}
                      userAvatar={`https://api.chuyenbienhoa.com/v1.0/users/${currentUser?.username}/avatar`}
                      getTimeDisplay={getTimeDisplay}
                      parentConnectorHovered={false}
                    />
                  </div>
                ))
              )}
            </div>
            <div className="absolute bottom-0 left-0 w-full h-6 bg-white dark:bg-[#3c3c3c]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
