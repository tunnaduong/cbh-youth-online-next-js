"use client";

import { useRouter } from "next/navigation";

// The interstitial is usually opened in a new tab (rewriteExternalLinksInHtml
// adds target="_blank"), and a fresh tab has nothing to go back to - so fall
// back to the feed instead of leaving the button dead.
export default function BackButton({ className = "", children }) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
