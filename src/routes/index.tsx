import { HomeComponent } from '@/components/homecomponents/homecomponet'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return <HomeComponent/>
}