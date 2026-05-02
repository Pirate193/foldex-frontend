"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { HomeComponent } from "@/components/homecomponents/homecomponet";
import ChatView from "@/components/views/chat-view";
import NoteView from "@/components/views/note-view";

function MasterAppView() {
  const searchParams = useSearchParams();
  const view = searchParams?.get("view") || "home";

  if (view === "chat") {
    return <ChatView />;
  }
  
  if (view === "note") {
    return <NoteView />;
  }

  // Default to home view
  return <HomeComponent />;
}

export default function AppMasterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <MasterAppView />
    </Suspense>
  );
}
