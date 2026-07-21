"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Modal, Empty, Spin, Tag, Alert } from "antd";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getVotes } from "@/app/Api";

const getVoteLabel = (voteValue) => {
  if (voteValue === 1) return "Upvote";
  if (voteValue === -1) return "Downvote";
  return "Vote";
};

const getVoteTagClassName = (voteValue) => {
  if (voteValue === 1) return "border-green-200 bg-green-50 text-green-700";
  if (voteValue === -1) return "border-red-200 bg-red-50 text-red-700";
  return "border-gray-200 bg-gray-50 text-gray-600";
};

export default function PostVotesModal({ open, postId, postTitle, onClose }) {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !postId) {
      return;
    }

    let isActive = true;

    const fetchVotes = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getVotes(postId);
        if (isActive) {
          setVotes(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (isActive) {
          setError(
            err?.response?.data?.message || "Không thể tải danh sách người vote"
          );
          setVotes([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchVotes();

    return () => {
      isActive = false;
    };
  }, [open, postId]);

  const voteSummary = useMemo(() => {
    const totalVotes = votes.reduce(
      (sum, vote) => sum + Number(vote.vote_value || 0),
      0
    );
    const voteCount = votes.length;

    return { totalVotes, voteCount };
  }, [votes]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      title={
        <div className="pr-8">
          <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Người đã vote bài viết
          </div>
          <div className="mt-1 line-clamp-1 text-xs font-normal text-neutral-500 dark:text-neutral-400">
            {postTitle || "Bài viết"}
          </div>
        </div>
      }
      width={560}
      className="post-votes-modal"
    >
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
          {voteSummary.voteCount} người đã vote
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
          Tổng điểm: {voteSummary.totalVotes}
        </span>
      </div>

      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center">
          <Spin />
        </div>
      ) : error ? (
        <Alert type="error" showIcon message={error} />
      ) : votes.length === 0 ? (
        <Empty description="Chưa có lượt vote nào" />
      ) : (
        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {votes.map((vote) => {
            const profileName = vote.profile_name || vote.username;
            const avatarUrl =
              vote.avatar_url ||
              `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${vote.username}/avatar`;
            const voteLabel = getVoteLabel(vote.vote_value);

            return (
              <Link
                key={vote.user_id}
                href={`/${vote.username}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
              >
                <Avatar className="h-11 w-11 shrink-0 border border-gray-200 dark:border-neutral-700">
                  <AvatarImage src={avatarUrl} alt={`${profileName} avatar`} />
                  <AvatarFallback>
                    {profileName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                      {profileName}
                    </span>
                    <Tag
                      className={`m-0 rounded-full px-2 py-0.5 text-xs font-medium ${getVoteTagClassName(
                        vote.vote_value
                      )}`}
                    >
                      {voteLabel}
                    </Tag>
                  </div>

                  <div className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                    @{vote.username}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
