import { Suspense } from "react";
import ChatRedirect from "./ChatRedirect";

export default function ChatPage() {
  return (
    <Suspense>
      <ChatRedirect />
    </Suspense>
  );
}
