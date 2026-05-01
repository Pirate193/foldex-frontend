"use client";

import { useSearchParams } from "next/navigation";
import NoteContentInner from "@/components/tabs/content/NoteContentInner";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function NotePageInner() {
  const searchParams = useSearchParams();
  const noteId = searchParams.get("id");
  const folderId = searchParams.get("folderId") || undefined;

  if (!noteId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No note selected</p>
      </div>
    );
  }

  return <NoteContentInner noteId={noteId} folderId={folderId} />;
}

export default function NotePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <NotePageInner />
    </Suspense>
  );
}
