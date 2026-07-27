"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useChatContext } from "@/contexts/Support";

export default function ChatRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openChat, selectConversation, setHighlightMessageId } = useChatContext();

  useEffect(() => {
    const conversationId = searchParams.get("conversation");
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
  }, []);

  return null;
}
