import { ResizableSidebarLayout } from '@/components/sidebarcomponents/resizable-sidebar'
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

const RootLayout = () => (
  <ResizableSidebarLayout>
    <Outlet />
    <TanStackRouterDevtools />
  </ResizableSidebarLayout>
)

export const Route = createRootRoute({ component: RootLayout })