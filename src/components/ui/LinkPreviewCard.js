"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import {
  fetchLinkPreview,
  getCachedLinkPreview,
  getInternalPath,
} from "@/utils/linkPreview";
import { safeLinkHref } from "@/utils/externalLink";

/**
 * Facebook-style card for a link pasted into a post or chat message: the
 * page's Open Graph image, site, title and description. Links to
 * chuyenbienhoa.com open in-app; anything else goes through the /link
 * interstitial like every other outbound link. Renders nothing until the
 * preview has loaded, and nothing at all when the page has no usable metadata.
 *
 * @param {object} props
 * @param {string} props.url
 * @param {boolean} [props.compact] - fixed width + shorter image, for chat bubbles
 * @param {string} [props.className]
 */
export default function LinkPreviewCard({ url, compact = false, className = "" }) {
  const [preview, setPreview] = useState(() => getCachedLinkPreview(url));
  const [imageFailed, setImageFailed] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setImageFailed(false);
    setIconFailed(false);
    const cached = getCachedLinkPreview(url);
    setPreview(cached);
    if (cached === undefined && url) {
      fetchLinkPreview(url).then((result) => {
        if (!cancelled) setPreview(result);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!preview) return null;

  const showImage = Boolean(preview.image) && !imageFailed;
  const internalPath = getInternalPath(url);

  const card = (
    <div
      className={`rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-500 bg-white dark:bg-neutral-700 hover:border-gray-300 dark:hover:border-neutral-400 transition-colors text-left whitespace-normal ${
        compact ? "w-[236px] max-w-full" : "max-w-[600px]"
      }`}
    >
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className={`media-loading w-full object-cover ${
            compact ? "h-28" : "aspect-[1.91/1]"
          }`}
        />
      )}
      <div className={`px-3 py-2 ${showImage ? "" : "flex items-center gap-3"}`}>
        {!showImage && (
          <div className="w-10 h-10 flex-shrink-0 rounded-md bg-gray-100 dark:bg-neutral-600 flex items-center justify-center">
            {preview.icon && !iconFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.icon}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setIconFailed(true)}
                className="w-6 h-6 object-contain"
              />
            ) : (
              <Link2 className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase text-gray-500 dark:text-gray-300 truncate">
            {preview.siteName}
          </p>
          {preview.title && (
            <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 break-words">
              {preview.title}
            </p>
          )}
          {preview.description && (
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5 line-clamp-2 break-words">
              {preview.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const wrapperClass = `block no-underline ${className}`;
  const stop = (e) => e.stopPropagation();

  if (internalPath) {
    return (
      <Link href={internalPath} className={wrapperClass} onClick={stop}>
        {card}
      </Link>
    );
  }

  return (
    <a
      href={safeLinkHref(url)}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={wrapperClass}
      onClick={stop}
    >
      {card}
    </a>
  );
}
