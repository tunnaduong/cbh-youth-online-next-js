"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import DefaultLayout from "@/layouts/DefaultLayout";
import PostItem from "@/components/forum/PostItem";
import { Button, message } from "antd";
import { useState, useEffect } from "react";
import FollowButton from "@/components/profile/FollowButton";
import { BsFillGearFill } from "react-icons/bs";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoCalendarOutline, IoLocationOutline } from "react-icons/io5";
import { Edit2Icon } from "lucide-react";
import { useAuthContext, useChatContext } from "@/contexts/Support";
import {
  followUser,
  unfollowUser,
  registerVote,
  getProfile,
  updateAvatar,
  updateCover,
} from "@/app/Api";

export default function ProfileClient({ initialProfile, activeTab, username }) {
  const { currentUser } = useAuthContext();
  const { openChat, createConversation } = useChatContext();
  const router = useRouter();

  // Transform API response to component format
  const transformProfileData = (apiData, currentUsername = null) => {
    if (!apiData) return null;

    // API response structure: may have 'user' wrapper or direct response
    const user = apiData.user || apiData;
    if (!user || !user.username) return null;

    // Check if current user is following this profile
    // by checking if currentUser is in the followers list
    let isFollowing = false;
    if (currentUsername && user.followers && Array.isArray(user.followers)) {
      isFollowing = user.followers.some((f) => f.username === currentUsername);
    }

    // Also check if API explicitly provides isFollowing
    if (user.isFollowing !== undefined) {
      isFollowing = user.isFollowing;
    }
    if (apiData.isFollowing !== undefined) {
      isFollowing = apiData.isFollowing;
    }

    return {
      id: user.id,
      username: user.username,
      profile_name: user.profile?.profile_name || user.username,
      bio: user.profile?.bio || null,
      location: user.profile?.location || null,
      joined_at: user.profile?.joined_at || "Chưa có thông tin",
      verified: user.profile?.verified
        ? user.profile.verified === true
          ? "1"
          : String(user.profile.verified)
        : "0",
      avatar_url:
        user.profile?.profile_picture ||
        `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${user.username}/avatar`,
      cover_photo_url: user.profile?.cover_photo_url || null,
      stats: {
        posts: user.stats?.posts_count || user.stats?.posts || 0,
        followers: user.stats?.followers || 0,
        following: user.stats?.following || 0,
        likes: user.stats?.total_likes_count || 0,
        points: user.stats?.activity_points || 0,
      },
      posts: user.recent_posts || [],
      followers:
        user.followers?.map((f) => ({
          id: f.id,
          follower: {
            username: f.username,
            profile: {
              profile_name: f.profile_name,
              verified: false,
            },
            isFollowing: f.isFollowed || false,
          },
        })) || [],
      following:
        user.following?.map((f) => ({
          id: f.id,
          followed: {
            username: f.username,
            profile: {
              profile_name: f.profile_name,
              verified: false,
            },
            isFollowing: f.isFollowed || false,
          },
        })) || [],
      isFollowing: isFollowing,
    };
  };

  const [profile, setProfile] = useState(() =>
    initialProfile
      ? transformProfileData(initialProfile, currentUser?.username)
      : null
  );
  const [isFollowing, setIsFollowing] = useState(profile?.isFollowing || false);

  // Update isFollowing when profile or currentUser changes
  useEffect(() => {
    if (profile && currentUser) {
      const followingStatus =
        profile.followers?.some(
          (f) => f.follower.username === currentUser.username
        ) || false;
      setIsFollowing(followingStatus);
    } else if (!currentUser) {
      setIsFollowing(false);
    }
  }, [profile?.followers, currentUser?.username]);

  // Sync isFollowing with profile.isFollowing when profile changes
  useEffect(() => {
    if (profile?.isFollowing !== undefined) {
      setIsFollowing(profile.isFollowing);
    }
  }, [profile?.isFollowing]);
  const [loading, setLoading] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [followingList, setFollowingList] = useState(profile?.following || []);
  const [followersList, setFollowersList] = useState(profile?.followers || []);
  const [posts, setPosts] = useState(profile?.posts || []);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverIsLight, setCoverIsLight] = useState(false);

  // Sample the cover photo's average brightness so the overlaid mobile text
  // can switch between white (dark photo) and dark (light photo).
  useEffect(() => {
    const url =
      profile?.cover_photo_url ||
      (profile?.username &&
        `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${profile.username}/avatar`);
    if (!url) return;

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 20;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const avgBrightness = total / (data.length / 4);
        if (!cancelled) setCoverIsLight(avgBrightness > 150);
      } catch (e) {
        // Cross-origin image without permissive CORS headers — can't sample
        // pixel data, keep the default (assume dark photo, white text).
      }
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [profile?.cover_photo_url, profile?.username]);

  const handleMessage = async () => {
    if (!currentUser) {
      message.error("Vui lòng đăng nhập để nhắn tin");
      router.push(
        "/login?continue=" + encodeURIComponent(window.location.href)
      );
      return;
    }

    if (!profile?.id) {
      message.error("Không thể mở cuộc trò chuyện lúc này");
      return;
    }

    setMessaging(true);
    try {
      await openChat();
      await createConversation(profile.id);
    } catch (error) {
      console.error("Message button error:", error);
      message.error("Không thể mở cuộc trò chuyện. Vui lòng thử lại.");
    } finally {
      setMessaging(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error("Kích thước file không được vượt quá 10MB");
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await updateAvatar(currentUser.username, formData);
      const responseData = response?.data || response;

      message.success(responseData?.message || "Cập nhật avatar thành công!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật avatar"
      );
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error("Kích thước file không được vượt quá 10MB");
      return;
    }

    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append("cover_photo", file);

      const response = await updateCover(currentUser.username, formData);
      const responseData = response?.data || response;

      message.success(
        responseData?.message || "Cập nhật ảnh bìa thành công!"
      );
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error uploading cover photo:", error);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật ảnh bìa"
      );
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleFollow = async () => {
    // Check if user is authenticated
    if (!currentUser) {
      message.error("Vui lòng đăng nhập để theo dõi");
      router.push(
        "/login?continue=" + encodeURIComponent(window.location.href)
      );
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await unfollowUser(profile.username);
        setIsFollowing(false);
        // Update stats and remove from followers list
        setProfile((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            followers: Math.max(0, prev.stats.followers - 1),
          },
          followers:
            prev.followers?.filter(
              (f) => f.follower.username !== currentUser.username
            ) || [],
          isFollowing: false,
        }));
        // Also update followersList state if needed
        setFollowersList((prev) =>
          prev.filter((f) => f.follower.username !== currentUser.username)
        );
      } else {
        // Follow
        await followUser(profile.username);
        setIsFollowing(true);
        // Update stats and add to followers list
        setProfile((prev) => {
          // Check if already in list
          const alreadyInList = prev.followers?.some(
            (f) => f.follower.username === currentUser.username
          );

          const newFollower = {
            id: Date.now(), // Temporary ID
            follower: {
              username: currentUser.username,
              profile: {
                profile_name: currentUser.profile_name || currentUser.username,
                verified: false,
              },
              isFollowing: false,
            },
          };

          return {
            ...prev,
            stats: {
              ...prev.stats,
              followers: prev.stats.followers + 1,
            },
            followers: alreadyInList
              ? prev.followers
              : [...(prev.followers || []), newFollower],
            isFollowing: true,
          };
        });
      }
    } catch (error) {
      console.error("Follow/Unfollow error:", error);
      message.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (username, isUnfollow = false) => {
    // Check if user is authenticated
    if (!currentUser) {
      message.error("Vui lòng đăng nhập để theo dõi");
      router.push(
        "/login?continue=" + encodeURIComponent(window.location.href)
      );
      return;
    }

    setLoading(true);
    try {
      if (isUnfollow) {
        // Unfollow
        await unfollowUser(username);
      } else {
        // Follow
        await followUser(username);
      }

      // Update local state instead of refreshing when in following tab
      if (activeTab === "following") {
        setFollowingList((prev) =>
          prev.map((item) => {
            if (item.followed.username === username) {
              return {
                ...item,
                followed: {
                  ...item.followed,
                  isFollowing: !isUnfollow,
                },
              };
            }
            return item;
          })
        );
      } else if (activeTab === "followers") {
        setFollowersList((prev) =>
          prev.map((item) => {
            if (item.follower.username === username) {
              return {
                ...item,
                follower: {
                  ...item.follower,
                  isFollowing: !isUnfollow,
                },
              };
            }
            return item;
          })
        );
      } else {
        // Reload profile data for posts tab
        try {
          const response = await getProfile(profile.username);
          // API response is directly the user object, wrap it for transformProfileData
          const transformed = transformProfileData(
            { user: response.data },
            currentUser?.username
          );
          if (transformed) {
            setProfile(transformed);
            setPosts(transformed.posts);
            setIsFollowing(transformed.isFollowing);
          }
        } catch (error) {
          console.error("Error refreshing profile:", error);
        }
      }
    } catch (error) {
      console.error("Follow/Unfollow error:", error);
      message.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId, value) => {
    if (!currentUser) {
      router.push(
        "/login?continue=" + encodeURIComponent(window.location.href)
      );
      message.error("Bạn cần đăng nhập để thực hiện hành động này");
      return;
    }

    // Store original state for rollback
    const originalPosts = [...posts];

    // Optimistic update
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;

        // Find existing vote of current user
        const existingVote = post.votes?.find(
          (v) => v.username === currentUser?.username
        );
        let newVotes;

        if (existingVote) {
          if (existingVote.vote_value === value) {
            // User is clicking the same vote again -> remove vote (value = 0)
            newVotes = post.votes.filter(
              (v) => v.username !== currentUser?.username
            );
          } else {
            // User is changing their vote direction
            newVotes = post.votes.map((v) =>
              v.username === currentUser?.username
                ? { ...v, vote_value: value }
                : v
            );
          }
        } else {
          // User is voting for the first time
          newVotes = [
            ...(post.votes || []),
            { username: currentUser.username, vote_value: value },
          ];
        }

        // Calculate new vote sum
        const votesSum = newVotes.reduce(
          (sum, v) => sum + (v.vote_value || 0),
          0
        );

        return {
          ...post,
          votes: newVotes,
          votes_sum_vote_value: votesSum,
        };
      })
    );

    // Call backend
    try {
      await registerVote(postId, { vote_value: value });
    } catch (error) {
      // Rollback on error
      setPosts(originalPosts);
      console.error("Vote error:", error);
      message.error("Có lỗi xảy ra khi vote. Vui lòng thử lại.");
    }
  };

  const renderTabContent = () => {
    if (!profile) return null;

    switch (activeTab) {
      case "posts":
        return (
          <>
            {posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                single={false}
                onVote={handleVote}
              />
            ))}
          </>
        );
      case "followers":
        return (
          <div className="w-full flex-1 !px-3 md:!px-0 flex flex-col bg-white dark:!bg-[var(--main-white)] rounded-xl max-h-fit">
            {followersList?.map((follower) => (
              <div key={follower.id} className="px-3 py-2">
                <div className="flex items-center gap-x-3">
                  <Link
                    className="flex-1 flex items-center gap-x-3"
                    href={`/${follower.follower.username}`}
                  >
                    <img
                      className="w-16 h-16 rounded-full border"
                      src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${follower.follower.username}/avatar`}
                      alt="avatar"
                    />
                    <div>
                      <h2 className="font-bold dark:text-neutral-300">
                        {follower.follower.profile.profile_name}
                        {follower.follower.profile.verified == "1" && (
                          <span>
                            <svg
                              stroke="currentColor"
                              fill="currentColor"
                              strokeWidth="0"
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                              className="relative inline shrink-0 text-xl text-primary-500 -mt-1"
                              height="1em"
                              width="1em"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </span>
                        )}
                      </h2>
                      <p className="text-gray-500">
                        <span>@</span>
                        {follower.follower.username}
                      </p>
                    </div>
                  </Link>
                  {currentUser &&
                  follower.follower.username !== currentUser.username ? (
                    <div>
                      <FollowButton
                        isFollowing={follower.follower.isFollowing}
                        loading={loading}
                        handleFollow={() =>
                          handleFollowUser(
                            follower.follower.username,
                            follower.follower.isFollowing
                          )
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        );
      case "following":
        return (
          <div className="w-full flex-1 !px-3 md:!px-0 flex flex-col bg-white dark:!bg-[var(--main-white)] rounded-xl max-h-fit">
            {followingList?.map((following) => (
              <div key={following.id} className="px-3 py-2">
                <div className="flex items-center gap-x-3">
                  <Link
                    className="flex-1 flex items-center gap-x-3"
                    href={`/${following.followed.username}`}
                  >
                    <img
                      className="w-16 h-16 rounded-full border"
                      src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${following.followed.username}/avatar`}
                      alt="avatar"
                    />
                    <div>
                      <h2 className="font-bold dark:text-neutral-300">
                        {following.followed.profile.profile_name}
                        {following.followed.profile.verified == "1" && (
                          <span>
                            <svg
                              stroke="currentColor"
                              fill="currentColor"
                              strokeWidth="0"
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                              className="relative inline shrink-0 text-xl text-primary-500 -mt-1"
                              height="1em"
                              width="1em"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </span>
                        )}
                      </h2>
                      <p className="text-gray-500">
                        <span>@</span>
                        {following.followed.username}
                      </p>
                    </div>
                  </Link>
                  {currentUser &&
                  following.followed.username !== currentUser.username ? (
                    <div>
                      <FollowButton
                        isFollowing={following.followed.isFollowing}
                        loading={loading}
                        handleFollow={() =>
                          handleFollowUser(
                            following.followed.username,
                            following.followed.isFollowing
                          )
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  if (!profile) {
    return (
      <DefaultLayout activeNav="home">
        <div className="flex justify-center items-center h-64">
          <p>Đang tải...</p>
        </div>
      </DefaultLayout>
    );
  }

  const coverImageUrl =
    profile.cover_photo_url ||
    `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${profile.username}/avatar`;

  const isOwnProfile = currentUser && currentUser.username == profile.username;

  // Mobile profile text sits on top of the cover photo, so it switches
  // between white (dark photo) and dark (light photo) based on the sampled
  // brightness above, instead of a single hardcoded color.
  const mobileTextClass = coverIsLight ? "text-gray-900" : "text-white";
  const mobileMutedTextClass = coverIsLight ? "text-gray-600" : "text-white/75";

  return (
    <DefaultLayout activeNav="home">
      <div>
        <div className="flex-1">
          <div className="relative h-36 lg:h-96 overflow-hidden group/cover">
            <img
              src={coverImageUrl}
              alt=""
              aria-hidden="true"
              className="cover-photo-bg absolute inset-0 w-full h-full object-cover"
            />
            {/* Scrim so the profile name/stats stay legible over any cover photo */}
            <div className="lg:hidden absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
            {isOwnProfile && (
              <>
                <input
                  type="file"
                  id="cover-upload"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  aria-label="Sửa ảnh bìa"
                  title="Sửa ảnh bìa"
                  onClick={() =>
                    document.getElementById("cover-upload").click()
                  }
                  disabled={uploadingCover}
                  className="absolute right-3 bottom-3 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-black/60 text-white opacity-0 group-hover/cover:opacity-100 focus:opacity-100 transition-opacity duration-150 hover:bg-black/80"
                >
                  <Edit2Icon className="w-4 h-4" />
                </button>
              </>
            )}
            <div className="hidden">
              <div className="relative group/avatar w-32 h-32">
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${profile.username}/avatar`}
                >
                  <img
                    className="w-32 h-32 rounded-full bg-white"
                    style={{ border: "4px solid #eeeeee" }}
                    src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${profile.username}/avatar`}
                    alt="avatar"
                  />
                </a>
                {isOwnProfile && (
                  <>
                    <input
                      type="file"
                      id="avatar-upload-mobile"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      aria-label="Sửa ảnh đại diện"
                      title="Sửa ảnh đại diện"
                      onClick={() =>
                        document.getElementById("avatar-upload-mobile").click()
                      }
                      disabled={uploadingAvatar}
                      className="absolute right-0 bottom-0 flex items-center justify-center w-9 h-9 rounded-full bg-black/60 text-white opacity-0 group-hover/avatar:opacity-100 focus:opacity-100 transition-opacity duration-150 hover:bg-black/80"
                    >
                      <Edit2Icon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex flex-col items-center">
                <h1 className={`font-bold text-xl mt-2 text-center ${mobileTextClass}`}>
                  <span>
                    {profile.profile_name}
                    {profile.verified == "1" && (
                      <span>
                        <svg
                          stroke="currentColor"
                          fill="currentColor"
                          strokeWidth={0}
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                          className="relative inline shrink-0 text-xl leading-5 text-primary-500"
                          height="1em"
                          width="1em"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </span>
                </h1>
                <p className={`text-sm ${mobileMutedTextClass}`}>
                  <span>@</span>
                  {profile.username}
                </p>
              </div>
              <div className="flex flex-col items-center gap-y-1 !px-6">
                <div className="flex flex-wrap justify-center gap-y-1 px-3">
                  <Link href={`/${profile.username}`} className="px-3">
                    <span className={mobileMutedTextClass}>Bài đã đăng: </span>
                    <span className={`font-bold ${mobileTextClass}`}>
                      {profile.stats.posts}
                    </span>
                  </Link>
                  <div className="px-3">
                    <span className={mobileMutedTextClass}>Điểm: </span>
                    <span className={`font-bold ${mobileTextClass}`}>
                      {profile.stats.points}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-y-1">
                  <Link
                    href={`/${profile.username}/following`}
                    className="px-3"
                  >
                    <span className={mobileMutedTextClass}>Đang theo dõi: </span>
                    <span className={`font-bold ${mobileTextClass}`}>
                      {profile.stats.following}
                    </span>
                  </Link>
                  <Link
                    href={`/${profile.username}/followers`}
                    className="px-3"
                  >
                    <span className={mobileMutedTextClass}>Người theo dõi: </span>
                    <span className={`font-bold ${mobileTextClass}`}>
                      {profile.stats.followers}
                    </span>
                  </Link>
                  <div className="px-3">
                    <span className={mobileMutedTextClass}>Lượt like: </span>
                    <span className={`font-bold ${mobileTextClass}`}>
                      {profile.stats.likes}
                    </span>
                  </div>
                </div>
              </div>
              <p className={`text-center ${mobileTextClass}`}>{profile.bio}</p>
              <div className="flex flex-col gap-y-2">
                {profile.location && (
                  <div className={`flex items-center -ml-0.5 gap-x-1 ${mobileMutedTextClass}`}>
                    <IoLocationOutline className="text-lg" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
                {profile.joined_at && (
                  <div className={`flex items-center -ml-0.5 gap-x-1 ${mobileMutedTextClass}`}>
                    <IoCalendarOutline className="text-lg" />
                    <span className="text-sm">{profile.joined_at}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex justify-end items-center mt-3 gap-2">
                {currentUser && currentUser.username == profile.username ? (
                  <Link href="/settings" className="flex items-center gap-x-2">
                    <Button className="rounded-full text-[#6c757d] px-4">
                      <BsFillGearFill className="w-4 h-4" />
                      <span className="text-[1rem]">Sửa hồ sơ</span>
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button
                      shape="circle"
                      icon={<IoChatbubbleEllipsesOutline className="w-5 h-5 mt-1" />}
                      aria-label="Nhắn tin"
                      title="Nhắn tin"
                      loading={messaging}
                      onClick={handleMessage}
                      className="!flex !items-center !justify-center !border-[#319527]"
                    />
                    <FollowButton
                      isFollowing={isFollowing}
                      loading={loading}
                      handleFollow={handleFollow}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile profile info card — sits BELOW the cover photo */}
          <div className="lg:hidden bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 pb-4">
            {/* Avatar peeks above the card */}
            <div className="flex flex-col items-center -mt-12">
              <div className="relative group/avatar w-24 h-24">
                <a href={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${profile.username}/avatar`}>
                  <img
                    className="w-24 h-24 rounded-full bg-white ring-4 ring-white dark:ring-neutral-800"
                    src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${profile.username}/avatar`}
                    alt="avatar"
                  />
                </a>
                {isOwnProfile && (
                  <>
                    <input type="file" id="avatar-upload-mobile" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
                    <button
                      type="button"
                      aria-label="Sửa ảnh đại diện"
                      onClick={() => document.getElementById("avatar-upload-mobile").click()}
                      disabled={uploadingAvatar}
                      className="absolute right-0 bottom-0 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 text-white opacity-0 group-hover/avatar:opacity-100 focus:opacity-100 transition-opacity hover:bg-black/80"
                    >
                      <Edit2Icon className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex flex-col items-center mt-2">
                <h1 className="font-bold text-xl text-center text-gray-900 dark:text-white">
                  {profile.profile_name}
                  {profile.verified == "1" && (
                    <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 20 20" aria-hidden="true" className="relative inline shrink-0 text-xl leading-5 text-primary-500 ml-1" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-sm">
                <Link href={`/${profile.username}`}><span className="text-gray-500 dark:text-gray-400">Bài đăng: </span><span className="font-bold text-gray-900 dark:text-white">{profile.stats.posts}</span></Link>
                <div><span className="text-gray-500 dark:text-gray-400">Điểm: </span><span className="font-bold text-gray-900 dark:text-white">{profile.stats.points}</span></div>
                <Link href={`/${profile.username}/following`}><span className="text-gray-500 dark:text-gray-400">Đang theo dõi: </span><span className="font-bold text-gray-900 dark:text-white">{profile.stats.following}</span></Link>
                <Link href={`/${profile.username}/followers`}><span className="text-gray-500 dark:text-gray-400">Người theo dõi: </span><span className="font-bold text-gray-900 dark:text-white">{profile.stats.followers}</span></Link>
                <div><span className="text-gray-500 dark:text-gray-400">Lượt like: </span><span className="font-bold text-gray-900 dark:text-white">{profile.stats.likes}</span></div>
              </div>
              {profile.bio && <p className="text-center text-gray-700 dark:text-gray-300 text-sm mt-2">{profile.bio}</p>}
              <div className="flex flex-col gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                {profile.location && <div className="flex items-center gap-x-1"><IoLocationOutline className="text-base" /><span>{profile.location}</span></div>}
                {profile.joined_at && <div className="flex items-center gap-x-1"><IoCalendarOutline className="text-base" /><span>{profile.joined_at}</span></div>}
              </div>
              <div className="flex justify-center items-center mt-4 gap-2">
                {currentUser && currentUser.username == profile.username ? (
                  <Link href="/settings" className="flex items-center gap-x-2">
                    <Button className="rounded-full text-[#6c757d] px-4">
                      <BsFillGearFill className="w-4 h-4" />
                      <span className="text-[1rem]">Sửa hồ sơ</span>
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button shape="circle" icon={<IoChatbubbleEllipsesOutline className="w-5 h-5 mt-1" />} aria-label="Nhắn tin" title="Nhắn tin" loading={messaging} onClick={handleMessage} className="!flex !items-center !justify-center !border-[#319527]" />
                    <FollowButton isFollowing={isFollowing} loading={loading} handleFollow={handleFollow} />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="lg:bg-white dark:!bg-neutral-700 h-16 lg:shadow-md">
            <div className="mx-auto max-w-[959px] h-full lg:flex hidden">
              <div
                className="relative group/avatar-desktop w-[170px] h-[170px] flex-shrink-0"
                style={{ transform: "translateY(-45%)" }}
              >
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${profile.username}/avatar`}
                >
                  <img
                    className="w-[170px] h-[170px] rounded-full absolute bg-white"
                    style={{ border: "4px solid #eeeeee" }}
                    src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${profile.username}/avatar`}
                    alt="avatar"
                  />
                </a>
                {isOwnProfile && (
                  <>
                    <input
                      type="file"
                      id="avatar-upload-desktop"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      aria-label="Sửa ảnh đại diện"
                      title="Sửa ảnh đại diện"
                      onClick={() =>
                        document
                          .getElementById("avatar-upload-desktop")
                          .click()
                      }
                      disabled={uploadingAvatar}
                      className="absolute right-2 bottom-2 flex items-center justify-center w-9 h-9 rounded-full bg-black/60 text-white opacity-0 group-hover/avatar-desktop:opacity-100 focus:opacity-100 transition-opacity duration-150 hover:bg-black/80"
                    >
                      <Edit2Icon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex-1 min-w-[280px]" />
              <div className="flex flex-row">
                <Link
                  href={`/${profile.username}`}
                  className="select-none cursor-pointer h-full flex flex-col items-center justify-center px-3 box-border min-w-max"
                  style={{
                    borderBottom:
                      activeTab === "posts"
                        ? "3px solid #319527"
                        : "3px solid transparent",
                  }}
                >
                  <p className="font-semibold text-sm text-slate-600 dark:text-neutral-400">
                    Bài viết
                  </p>
                  <p className="font-bold text-xl text-primary-500">
                    {profile.stats.posts}
                  </p>
                </Link>
                <Link
                  href={`/${profile.username}/followers`}
                  className="select-none cursor-pointer h-full flex flex-col items-center justify-center px-3 box-border min-w-max"
                  style={{
                    borderBottom:
                      activeTab === "followers"
                        ? "3px solid #319527"
                        : "3px solid transparent",
                  }}
                >
                  <p className="font-semibold text-sm text-slate-600 dark:text-neutral-400">
                    Người t.dõi
                  </p>
                  <p className="font-bold text-xl text-primary-500 follower_count">
                    {profile.stats.followers}
                  </p>
                </Link>
                <Link
                  href={`/${profile.username}/following`}
                  className="select-none cursor-pointer h-full flex flex-col items-center justify-center px-3 box-border min-w-max"
                  style={{
                    borderBottom:
                      activeTab === "following"
                        ? "3px solid #319527"
                        : "3px solid transparent",
                  }}
                >
                  <p className="font-semibold text-sm text-slate-600 dark:text-neutral-400">
                    Đang t.dõi
                  </p>
                  <p className="font-bold text-xl text-primary-500">
                    {profile.stats.following}
                  </p>
                </Link>

                <div
                  className="select-none h-full flex flex-col items-center justify-center px-3 box-border min-w-max"
                  style={{ borderBottom: "3px solid transparent" }}
                >
                  <p className="font-semibold text-sm text-slate-600 dark:text-neutral-400">
                    Thích
                  </p>
                  <p className="font-bold text-xl text-primary-500">
                    {profile.stats.likes}
                  </p>
                </div>
                <div
                  className="select-none h-full flex flex-col items-center justify-center px-3 box-border min-w-max"
                  style={{ borderBottom: "3px solid transparent" }}
                >
                  <p className="font-semibold text-sm text-slate-600 dark:text-neutral-400">
                    Điểm
                  </p>
                  <p className="font-bold text-xl text-primary-500">
                    {profile.stats.points}
                  </p>
                </div>
              </div>
              <div className="flex-1 flex justify-end items-center gap-2">
                {currentUser && currentUser.username == profile.username ? (
                  <Link href="/settings" className="flex items-center gap-x-2">
                    <Button className="rounded-full text-[#6c757d] px-4">
                      <BsFillGearFill className="w-4 h-4" />
                      <span className="text-[1rem]">Sửa hồ sơ</span>
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button
                      shape="circle"
                      icon={<IoChatbubbleEllipsesOutline className="w-5 h-5 mt-1" />}
                      aria-label="Nhắn tin"
                      title="Nhắn tin"
                      loading={messaging}
                      onClick={handleMessage}
                      className="!flex !items-center !justify-center !border-[#319527]"
                    />
                    <FollowButton
                      isFollowing={isFollowing}
                      loading={loading}
                      handleFollow={handleFollow}
                    />
                  </>
                )}
              </div>
            </div>
            <div className="mx-auto max-w-[959px] flex">
              <div className="max-w-[280px] flex-1 !mt-10 pr-6 hidden lg:flex flex-col gap-y-3">
                <div>
                  <h1 className="font-bold text-xl">
                    <span>
                      <span className="mr-1 dark:text-neutral-300">
                        {profile.profile_name}
                      </span>
                      {profile.verified == "1" && (
                        <span>
                          <svg
                            stroke="currentColor"
                            fill="currentColor"
                            strokeWidth={0}
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                            className="relative inline shrink-0 text-xl leading-5 text-primary-500"
                            height="1em"
                            width="1em"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </span>
                  </h1>
                  <p className="text-sm text-gray-500">
                    <span>@</span>
                    {profile.username}
                  </p>
                </div>
                <p className="dark:text-neutral-300">{profile.bio}</p>
                <div className="flex flex-col gap-y-2">
                  {profile.location && (
                    <div className="flex items-center -ml-0.5 gap-x-1 text-gray-500">
                      <IoLocationOutline className="text-lg" />
                      <span className="text-sm">{profile.location}</span>
                    </div>
                  )}
                  {profile.joined_at && (
                    <div className="flex items-center -ml-0.5 gap-x-1 text-gray-500">
                      <IoCalendarOutline className="text-lg" />
                      <span className="text-sm">
                        Đã tham gia {profile.joined_at}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 !my-6 !px-3 md:!px-0 flex flex-col items-center">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
