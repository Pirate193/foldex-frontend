import { useSearchParams } from "next/navigation";
import WatchList from "../videos/watchlist";
import WatchVideoPage from "../videos/watchpage";


export default function WatchView() {
  const searchParams = useSearchParams();
  const videoId = searchParams?.get("videoId");

  // If ?id= is present, render the existing chat view
  if (videoId) {
    return <WatchVideoPage videoId={videoId} />;
  }

  // Otherwise, render the new chat screen
  return <WatchList />;
}
