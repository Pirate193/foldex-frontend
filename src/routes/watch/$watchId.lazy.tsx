import WatchVideoPage from '@/components/videos/watchpage'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/watch/$watchId')({
  component: WatchPage,
})

function WatchPage() {
  const {watchId}=Route.useParams();
  return <WatchVideoPage  videoId={watchId} />
}
