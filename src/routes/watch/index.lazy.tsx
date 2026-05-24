import WatchList from '@/components/videos/watchlist'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/watch/')({
  component: WatchList,
})
