import { useSearchParams } from "next/navigation";
import NoteContentInner from "@/components/tabs/content/NoteContentInner";

export default function NoteView() {
  const searchParams = useSearchParams();
  const noteId = searchParams?.get("id");
  const folderId = searchParams?.get("folderId") || undefined;

  if (!noteId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No note selected</p>
      </div>
    );
  }

  return <NoteContentInner noteId={noteId} folderId={folderId} />;
}
