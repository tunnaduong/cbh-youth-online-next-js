"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useChatContext } from "@/contexts/Support";
import ChatLiteFullscreen from "@/components/chat/ChatLiteFullscreen";

export default function ChatRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openChat, selectConversation, setHighlightMessageId } = useChatContext();

  const isChatLite = searchParams.get("chat_lite") === "true";

  useEffect(() => {
    if (isChatLite) return; // Do not redirect if in Chat Lite mode

    const conversationId = searchParams.get("conversationId") || searchParams.get("conversation");
    const messageId = searchParams.get("message");

    const open = async () => {
      await openChat();
      if (conversationId) {
        const id = parseInt(conversationId, 10);
        if (!isNaN(id)) {
          await selectConversation(id);
        }
      }
      if (messageId) {
        const mid = parseInt(messageId, 10);
        if (!isNaN(mid)) {
          setHighlightMessageId(mid);
        }
      }
      router.replace("/");
    };

    open();
  }, [isChatLite]);

  if (isChatLite) {
    return <ChatLiteFullscreen />;
  }

  return null;
}
