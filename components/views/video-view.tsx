import { useSearchParams } from "next/navigation";
import VideoContentInner from "@/components/tabs/content/videocontentinner";

export default function VideoView() {
  const searchParams = useSearchParams();
  const videoId = searchParams?.get("id");
  const folderId = searchParams?.get("folderId") || undefined;

  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No video selected</p>
      </div>
    );
  }

  return <VideoContentInner videoId={videoId} folderId={folderId} />;
}
