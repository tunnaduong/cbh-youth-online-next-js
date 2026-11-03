"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import Link from "next/link";
import { Eye, FileText, MessageSquare, Sparkles } from "lucide-react";
import { getRelatedPosts } from "@/app/Api";
import { generatePostUrl } from "@/utils/slugify";
import UserName from "@/components/profile/UserName";
import { isInApp } from "@/utils/appMode";

const SMARTLINK_URL =
  "https://www.profitableratecpmnetwork.com/f7kk39xjy?key=f33af904ae5ae82d5956b5aeb20ed607";

const SPONSORED_ITEMS = [
  {
    id: "sp-1",
    title: "Tổng hợp bộ tài liệu ôn thi THPT & Đánh giá năng lực độc quyền mới nhất",
    author: "Tài liệu học tập",
    category: "Tài liệu ôn thi",
    thumbnail: "/images/mobile-app-download-banner.webp",
    time: "Được tài trợ",
    views: "1.2k",
    comments: "38",
  },
  {
    id: "sp-2",
    title: "Phương pháp tự học tiếng Anh và luyện thi IELTS 7.5+ hiệu quả tại nhà",
    author: "Cộng đồng CBH",
    category: "Góc học tập",
    thumbnail: "/images/logo.png",
    time: "Được tài trợ",
    views: "980",
    comments: "24",
  },
  {
    id: "sp-3",
    title: "Học bổng du học toàn phần và bí quyết chuẩn bị hồ sơ hoạt động ngoại khóa",
    author: "CBH Youth Online",
    category: "Du học & Học bổng",
    thumbnail: "/images/footer.jpg",
    time: "Được tài trợ",
    views: "1.5k",
    comments: "52",
  },
];

// Component nhúng script Native Banner chuẩn trong iframe biệt lập
function InlineNativeAdFrame() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (isInApp() || !containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "190px";
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.scrolling = "no";
    iframe.loading = "lazy";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <div id="container-d75e1be3578406d08612b5cc3623fa29"></div>
  <script async="async" data-cfasync="false" src="https://pl32171519.profitableratecpmnetwork.com/d75e1be3578406d08612b5cc3623fa29/invoke.js"></script>
  <script>
    function checkHeight() {
      var h = document.body.scrollHeight;
      if (h > 50 && window.frameElement) {
        window.frameElement.style.height = h + 'px';
      }
    }
    window.addEventListener('load', checkHeight);
    setInterval(checkHeight, 1000);
  </script>
</body>
</html>`;

    container.appendChild(iframe);
    try {
      const doc = iframe.contentWindow || iframe.contentDocument;
      if (doc.document) {
        doc.document.open();
        doc.document.write(html);
        doc.document.close();
      } else {
        doc.open();
        doc.write(html);
        doc.close();
      }
    } catch {
      iframe.srcdoc = html;
    }
  }, []);

  if (isInApp()) return null;

  return (
    <div className="pt-3 border-t border-gray-100 dark:border-neutral-600 mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
          <Sparkles className="h-3.5 w-3.5 text-primary-500" />
          Gợi ý dành cho bạn
        </span>
        <span className="text-[11px] font-medium text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
          Quảng cáo
        </span>
      </div>
      <div ref={containerRef} className="w-full min-h-[160px] flex justify-center" />
    </div>
  );
}

// Bài viết liên quan nằm dưới phần bình luận: cùng chuyên mục trước, rồi
// các bài có tiêu đề hoặc hashtag giống. Không có bài nào thì không hiện gì.
export default function RelatedPosts({ postId }) {
  const [posts, setPosts] = useState(null);
  const [sponsoredItem, setSponsoredItem] = useState(SPONSORED_ITEMS[0]);

  useEffect(() => {
    let active = true;
    setPosts(null);

    // Chọn ngẫu nhiên mẫu tài trợ phù hợp
    const randomAd = SPONSORED_ITEMS[Math.floor(Math.random() * SPONSORED_ITEMS.length)];
    setSponsoredItem(randomAd);

    getRelatedPosts(postId)
      .then((response) => {
        if (active) setPosts(response.data?.posts ?? []);
      })
      .catch(() => {
        if (active) setPosts([]);
      });

    return () => {
      active = false;
    };
  }, [postId]);

  if (posts && posts.length === 0) return null;

  // Vị trí chèn quảng cáo xen kẽ: sau bài thứ 2 hoặc thứ 3
  const adInsertIndex = posts && posts.length > 2 ? 2 : 1;

  const renderSponsoredItem = () => {
    if (isInApp()) return null;
    return (
      <li key="sponsored-native-ad" className="min-w-0">
        <a
          href={SMARTLINK_URL}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="flex items-center gap-3 rounded-xl py-3 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700 group"
        >
          <div className="flex h-14 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-600 relative">
            <img
              src={sponsoredItem.thumbnail}
              alt={sponsoredItem.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <span className="absolute bottom-1 right-1 bg-black/60 text-[9px] text-white px-1 rounded font-medium">
              Ads
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
              {sponsoredItem.title}
            </p>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex min-w-0 max-w-full items-center font-medium text-primary-600 dark:text-primary-400">
                {sponsoredItem.author}
              </span>
              <span className="max-w-[10rem] truncate rounded-full bg-primary-50 px-2 py-0.5 font-medium text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                {sponsoredItem.category}
              </span>
              <span className="flex-shrink-0">{sponsoredItem.time}</span>
              <span className="flex flex-shrink-0 items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                {sponsoredItem.comments}
                <span className="sr-only">bình luận</span>
              </span>
              <span className="flex flex-shrink-0 items-center gap-1">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                {sponsoredItem.views}
                <span className="sr-only">lượt xem</span>
              </span>
            </div>
          </div>
        </a>
      </li>
    );
  };

  return (
    <section
      aria-labelledby="related-posts-title"
      className="rounded-2xl border border-[#EBEFEA] bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)] sm:p-5 dark:border-neutral-600 dark:!bg-[var(--main-white)]"
    >
      <h2
        id="related-posts-title"
        className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-neutral-100"
      >
        <FileText className="h-[18px] w-[18px] text-primary-500 dark:text-[#6bcf60]" aria-hidden="true" />
        Bài viết liên quan
      </h2>

      {posts === null ? (
        <ul className="mt-3 divide-y divide-gray-100 dark:divide-neutral-600" aria-label="Đang tải">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex animate-pulse items-center gap-3 py-3">
              <div className="h-14 w-20 flex-shrink-0 rounded-xl bg-gray-200 dark:bg-neutral-600" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-4/5 rounded bg-gray-200 dark:bg-neutral-600" />
                <div className="h-3 w-2/5 rounded bg-gray-200 dark:bg-neutral-600" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100 dark:divide-neutral-600">
          {posts.map((post, index) => {
            const href = generatePostUrl(post);
            const thumbnail = post.image_urls?.[0] || post.cover_url;
            const author = post.author || {};
            const authorName = post.anonymous
              ? "Ẩn danh"
              : author.profile_name || author.username;

            const postItem = (
              <li key={post.id} className="min-w-0">
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-xl py-3 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700"
                >
                  <div className="flex h-14 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-600">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt=""
                        loading="lazy"
                        className="media-loading h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400 dark:text-neutral-400" aria-hidden="true" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 dark:text-white">
                      {post.title}
                    </p>
                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex min-w-0 max-w-full items-center">
                        {post.anonymous ? (
                          <span className="truncate">{authorName}</span>
                        ) : (
                          <UserName
                            name={authorName}
                            theme={author.profile_theme}
                            verified={author.verified}
                            className="text-xs"
                          />
                        )}
                      </span>
                      {post.subforum?.name && (
                        <span className="max-w-[10rem] truncate rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-neutral-600 dark:text-neutral-200">
                          {post.subforum.name}
                        </span>
                      )}
                      <span className="flex-shrink-0">{post.time}</span>
                      <span className="flex flex-shrink-0 items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                        {post.comments}
                        <span className="sr-only">bình luận</span>
                      </span>
                      <span className="flex flex-shrink-0 items-center gap-1">
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        {post.views}
                        <span className="sr-only">lượt xem</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );

            // Chèn native sponsored item vào giữa danh sách
            if (index === adInsertIndex) {
              return (
                <Fragment key={`group-${post.id}`}>
                  {renderSponsoredItem()}
                  {postItem}
                </Fragment>
              );
            }

            return postItem;
          })}

          {/* Nếu danh sách bài viết ít hơn vị trí chèn, thêm vào cuối */}
          {posts.length <= adInsertIndex && renderSponsoredItem()}
        </ul>
      )}

      {/* Script Native Banner của ad network đặt ở cuối component với giao diện đồng bộ */}
      <InlineNativeAdFrame />
    </section>
  );
}
