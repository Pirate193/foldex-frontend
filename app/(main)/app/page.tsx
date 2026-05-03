"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { HomeComponent } from "@/components/homecomponents/homecomponet";
import ChatView from "@/components/views/chat-view";
import NoteView from "@/components/views/note-view";
import { useSession } from "@/hooks/use-auth";
import { isDesktopApp } from "@/lib/isdesktop";
import { syncLocalToCloud } from "@/lib/services/sync";

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
  const { data: session } = useSession();
  const hasSynced = useRef(false);

  // The Background Sync Hook
  useEffect(() => {
    // 1. Check if we are on desktop
    // 2. Check if the user is actually logged in
    // 3. Check if we haven't already synced during this app session
    if (isDesktopApp() && session?.user && !hasSynced.current) {
      hasSynced.current = true; // Lock it instantly!
      
      console.log("App booted: Triggering background cloud sync...");
      
      // Fire and forget! The UI continues to load normally.
      syncLocalToCloud({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }).catch((err) => console.error("Background sync failed:", err));
    }
  }, [session?.user]);
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <MasterAppView />
    </Suspense>
  );
}
