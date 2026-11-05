"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChatContext } from "@/contexts/Support";
import ChatConversation from "./ChatConversation";
import ChatThreadsList from "./ChatThreadsList";
import GroupInfoModal from "./GroupInfoModal";
import ChatBackgroundModal from "./ChatBackgroundModal";
import ChatGalleryModal from "./ChatGalleryModal";

export default function ChatLiteFullscreen() {
  const searchParams = useSearchParams();
  const {
    conversations,
    selectedConversationId,
    selectConversation,
    loadConversations,
  } = useChatContext();

  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  // Auto-select conversation if provided in URL parameters
  useEffect(() => {
    const rawId = searchParams.get("conversationId") || searchParams.get("conversation");
    if (rawId) {
      const id = parseInt(rawId, 10);
      if (!isNaN(id) && (!selectedConversationId || selectedConversationId !== id)) {
        selectConversation(id);
      }
    }
  }, [searchParams, selectedConversationId, selectConversation]);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  // Post conversation updates to React Native WebView to sync the native header
  useEffect(() => {
    if (!selectedConversation || typeof window === "undefined" || !window.ReactNativeWebView) {
      return;
    }

    try {
      const otherParticipant =
        selectedConversation.type !== "group"
          ? selectedConversation.participants?.[0]
          : null;

      const payload = {
        type: "CONVERSATION_UPDATE",
        conversation: {
          id: selectedConversation.id,
          type: selectedConversation.type,
          name: selectedConversation.name,
          display_name:
            selectedConversation.display_name ||
            (selectedConversation.type === "group"
              ? selectedConversation.name
              : otherParticipant?.profile_name || otherParticipant?.username),
          display_avatar_url:
            selectedConversation.display_avatar_url ||
            (selectedConversation.type === "group"
              ? selectedConversation.avatar_url
              : otherParticipant?.avatar_url),
          avatar_url: selectedConversation.avatar_url,
          username: otherParticipant?.username,
          participants: selectedConversation.participants,
          profile_theme: otherParticipant?.profile_theme,
        },
      };

      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    } catch (err) {
      console.warn("[ChatLite] Error posting conversation update:", err);
    }
  }, [selectedConversation]);

  // Intercept profile and external link clicks and delegate to Native mobile
  useEffect(() => {
    if (typeof window === "undefined" || !window.ReactNativeWebView) return;

    const handleClick = (e) => {
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      // Internal profile links (e.g. /@username or /username)
      if (href.startsWith("/") && !href.startsWith("/chat") && !href.startsWith("/api")) {
        const parts = href.replace(/^\//, "").split(/[?#]/)[0].split("/");
        const candidateUsername = parts[0]?.replace(/^@/, "");

        if (
          candidateUsername &&
          !["forum", "explore", "wallet", "settings", "composer", "admin"].includes(
            candidateUsername
          )
        ) {
          e.preventDefault();
          e.stopPropagation();
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: "OPEN_PROFILE",
              username: candidateUsername,
            })
          );
          return;
        }
      }

      // External or general web URLs -> open via native in-app browser
      if (href.startsWith("http://") || href.startsWith("https://")) {
        try {
          const targetUrl = new URL(anchor.href);
          if (
            targetUrl.hostname !== window.location.hostname ||
            !targetUrl.pathname.startsWith("/chat")
          ) {
            e.preventDefault();
            e.stopPropagation();
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: "OPEN_URL",
                url: anchor.href,
              })
            );
          }
        } catch {}
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  const handleGroupUpdated = () => {
    loadConversations();
  };

  const handleBackgroundChanged = () => {
    loadConversations();
  };

  const handleLeftGroup = () => {
    loadConversations();
    selectConversation(null);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col bg-white dark:bg-neutral-800 overflow-hidden z-50">
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 w-full h-full">
        {selectedConversationId ? (
          <ChatConversation
            conversationId={selectedConversationId}
            conversation={selectedConversation}
            hideHeader={true}
          />
        ) : (
          <ChatThreadsList onSelectConversation={(id) => selectConversation(id)} />
        )}
      </div>

      <GroupInfoModal
        conversationId={selectedConversationId}
        show={showGroupInfo && selectedConversation?.type === "group"}
        onClose={() => setShowGroupInfo(false)}
        onGroupUpdated={handleGroupUpdated}
        onLeftGroup={handleLeftGroup}
        onBackgroundChanged={handleBackgroundChanged}
      />

      <ChatBackgroundModal
        conversationId={selectedConversationId}
        show={showBackgroundModal && !!selectedConversationId}
        onClose={() => setShowBackgroundModal(false)}
        onBackgroundChanged={handleBackgroundChanged}
      />

      <ChatGalleryModal
        conversationId={selectedConversationId}
        show={showGallery && !!selectedConversationId}
        onClose={() => setShowGallery(false)}
      />
    </div>
  );
}
