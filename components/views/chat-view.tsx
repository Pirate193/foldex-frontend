import { useSearchParams } from "next/navigation";
import NewChatComponent from "@/components/aicomponents/newchat";
import ChatClient from "@/components/aicomponents/chat-client";

export default function ChatView() {
  const searchParams = useSearchParams();
  const chatId = searchParams?.get("id");

  // If ?id= is present, render the existing chat view
  if (chatId) {
    return <ChatClient chatId={chatId} />;
  }

  // Otherwise, render the new chat screen
  return <NewChatComponent />;
}
