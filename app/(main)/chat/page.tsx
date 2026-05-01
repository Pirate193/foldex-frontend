"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import NewChatComponent from "@/components/aicomponents/newchat";
import ChatClient from "@/components/aicomponents/chat-client";

function ChatPageInner() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("id");

  // If ?id= is present, render the existing chat view
  if (chatId) {
    return <ChatClient chatId={chatId} />;
  }

  // Otherwise, render the new chat screen
  return <NewChatComponent />;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <ChatPageInner />
    </Suspense>
  );
}