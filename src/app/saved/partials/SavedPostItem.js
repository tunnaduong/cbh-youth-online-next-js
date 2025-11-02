import Link from "next/link";
import { Button, Dropdown } from "antd";
import { generatePostSlug } from "@/utils/slugify";
import VerifiedBadge from "@/components/ui/Badges";
import { BsThreeDots } from "react-icons/bs";

export default function SavedPostItem({ post, onUnsave }) {
  // Extract topic data from nested structure
  const topic = post.topic || post;
  const author = topic.author;

  const items = [
    {
      key: "1",
      label: "Bỏ lưu",
      onClick: () => onUnsave(post.topic.id), // Use the saved post ID, not topic ID
    },
  ];

  // Helper function to generate post URL
  const getPostUrl = () => {
    const slug = generatePostSlug(topic.id, topic.title);
    const username = topic.anonymous ? "anonymous" : author.username;
    return `/${username}/posts/${slug}`;
  };

  // Helper function to generate profile URL
  const getProfileUrl = (username) => {
    return `/${username}`;
  };

  return (
    <div
      key={post.id}
      className="flex gap-4 p-3 bg-white dark:!bg-[#3c3c3c] rounded-lg shadow-sm"
    >
      <Link href={getPostUrl()} className="shrink-0">
        {topic.anonymous ? (
          <div className="w-36 h-36 bg-[#e9f1e9] dark:bg-[#1d281b] dark:!border-gray-500 flex items-center justify-center rounded-lg border">
            <span className="text-7xl font-bold text-white dark:text-gray-300">
              ?
            </span>
          </div>
        ) : (
          <img
            src={
              topic.image_urls?.[0]
                ? topic.image_urls[0]
                : `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/` +
                  author.username +
                  "/avatar"
            }
            alt={topic.title}
            className="w-36 h-36 object-cover rounded-lg"
          />
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={getPostUrl()}
            className="text-lg font-medium hover:underline line-clamp-2"
          >
            {topic.title}
          </Link>

          <Dropdown
            menu={{ items }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Button
              type="text"
              icon={<BsThreeDots size={20} />}
              className="flex items-center justify-center w-8 h-8 !p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            />
          </Dropdown>
        </div>

        <div className="text-sm">
          {topic.anonymous ? (
            <span className="text-gray-600 dark:text-gray-400">
              Người dùng ẩn danh
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${author.username}/avatar`}
                alt={author.username}
                className="w-7 h-7 rounded-full"
              />
              <Link
                href={getProfileUrl(author.username)}
                className="text-[#319527] hover:underline inline-verified truncate"
              >
                <span className="inline-verified__text truncate">
                  {author.profile_name || author.profile?.profile_name}
                </span>
                {(author.verified == "1" ||
                  author?.profile?.verified == "1") && (
                  <VerifiedBadge className="inline-verified__badge" />
                )}
              </Link>
            </div>
          )}
        </div>

        <div className="mt-3 text-sm text-gray-500">
          Đã lưu {post.created_at}
        </div>
      </div>
    </div>
  );
}
