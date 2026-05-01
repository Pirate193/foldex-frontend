"use client"
import { SidebarTrigger } from "../ui/sidebar";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { GlobeIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Suggestion, Suggestions } from "../ai-elements/suggestion";
import { useApiKeys } from "@/hooks/use-settings";
import { getAvailableModels } from "@/lib/providers";
import { toast } from "sonner";
import { ChatHistoryPopover } from "./chathistorypopover";
import { useCreateChat } from "@/hooks/use-chat";
import { useRouter } from "next/navigation";
import { useAiStore } from "@/stores/aistore";
import { useOnlineStatus } from "@/hooks/use-online-status";

const AI_CHAT_URL = `${process.env.NODE_ENV === "production" ? "https://api.pslmp.foldex.space" : "http://localhost:3000"}/api/ai/chat`;

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
};

const suggestions = [
    "Help Me Study",
    "Help Me with my Homework",
    "Help Me Prepare for my Exam",
    "Create a Note ",
]

export default function NewChatComponent() {
  const [text, setText] = useState<string>("");
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const {mutateAsync:createChat,isPending:isCreatingChat}=useCreateChat();
  const router = useRouter();
  const {setPendingMessage,setBody}=useAiStore();
  const isOnline = useOnlineStatus();

  // Dynamic models from configured API keys
  const { data: apiKeys } = useApiKeys();
  const configuredProviders = useMemo(
    () => (apiKeys ?? []).map(k => k.provider),
    [apiKeys]
  );
  const availableModels = useMemo(
    () => getAvailableModels(configuredProviders),
    [configuredProviders]
  );
  const hasTavilyKey = configuredProviders.includes("tavily");
  const [model, setModel] = useState<string>("");

  // Set default model once available
  const selectedModel = model || (availableModels.length > 0 ? availableModels[0].model.id : "");

  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: AI_CHAT_URL,
      credentials: "include",
    }),
    onError: (error) => {
      toast.error(error.message || "Something went wrong with the AI request");
    },
  });

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) return;
    if (!selectedModel) {
      toast.error("No AI model available. Add an API key in Settings → API Keys.");
      return;
    }
    if (!isOnline) {
      toast.error("You're offline. AI features require an internet connection.");
      return;
    }

     try {
      const title =
        message.text.slice(0, 50) + (message.text.length > 50 ? "..." : "");
      const chat = await createChat({ title });


      // Don't generate title here - wait for AI response in page's chat component

      setPendingMessage(message);
      setBody({
        webSearch:useWebSearch,
        model:selectedModel,
      });

      router.push(`/chat?id=${chat.id}`);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setText(suggestion);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      {/* header */}
      <div className="flex items-center p-2 gap-2">
        <SidebarTrigger className="cursor-pointer" />
        <ChatHistoryPopover />
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center">
        <div className="p-4 flex justify-center items-center">
          <h1 className="text-3xl font-bold">How can I help you with your studies today?</h1>
        </div>

        {availableModels.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mb-4 p-3 rounded-lg bg-muted/50 border border-border/60">
            No AI models available. Go to{" "}
            <a href="/settings" className="text-primary underline">Settings → API Keys</a>{" "}
            to add a provider key.
          </div>
        )}

        {!isOnline && (
          <div className="text-center text-sm text-amber-600 dark:text-amber-400 mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            You&apos;re offline. AI chat requires an internet connection. Notes &amp; folders still work.
          </div>
        )}

        <PromptInput
          onSubmit={handleSubmit}
          className="mt-4"
          globalDrop
          multiple
        >
          <PromptInputHeader>
            <PromptInputAttachmentsDisplay />
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setText(e.target.value)}
              value={text}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger className="cursor-pointer" />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments className="cursor-pointer" />
                  <PromptInputActionAddScreenshot className="cursor-pointer" />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton
                onClick={() => {
                  if (!hasTavilyKey) {
                    toast.error("Add a Tavily API key in Settings to enable web search");
                    return;
                  }
                  setUseWebSearch(!useWebSearch);
                }}
                tooltip={{ content: hasTavilyKey ? "Search the web" : "Tavily key required", shortcut: "⌘K" }}
                variant={useWebSearch ? "default" : "ghost"}
                disabled={!hasTavilyKey}
                className="cursor-pointer"
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              {availableModels.length > 0 && (
                <PromptInputSelect
                  onValueChange={(value) => setModel(value)}
                  value={selectedModel}
                >
                  <PromptInputSelectTrigger>
                    <PromptInputSelectValue className="cursor-pointer" />
                  </PromptInputSelectTrigger>
                  <PromptInputSelectContent>
                    {availableModels.map(({ model: m, providerIcon }) => (
                      <PromptInputSelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2 cursor-pointer">
                          {providerIcon && (
                            <img src={providerIcon} alt="" className="h-4 w-4" />
                          )}
                          <span>{m.name}</span>
                        </div>
                      </PromptInputSelectItem>
                    ))}
                  </PromptInputSelectContent>
                </PromptInputSelect>
              )}
            </PromptInputTools>
            <PromptInputSubmit disabled={(!text && !status) || !selectedModel || !isOnline} status={status} />
          </PromptInputFooter>
        </PromptInput>

        <div className="flex flex-row justify-center mt-2 px-4">
          <Suggestions>
            {suggestions.map((suggestion) => (
              <Suggestion
                key={suggestion}
                onClick={handleSuggestionClick}
                suggestion={suggestion}
              />
            ))}
          </Suggestions>
        </div>
      </div>
    </div>
  );
}