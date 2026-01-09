import { ChatTranscriptViewer } from "@/components/admin/ChatTranscriptViewer";

interface ChatSessionsTabProps {
  initialConversationId?: string | null;
  onConversationOpened?: () => void;
}

export function ChatSessionsTab({ 
  initialConversationId, 
  onConversationOpened 
}: ChatSessionsTabProps) {
  return (
    <ChatTranscriptViewer 
      initialConversationId={initialConversationId}
      onConversationOpened={onConversationOpened}
    />
  );
}
