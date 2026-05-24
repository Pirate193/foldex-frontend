import NewChatComponent from '@/components/aicomponents/newchat'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/chat/')({
  component: NewChat,
})

function NewChat() {
  return <NewChatComponent />
}
