import { ChatTranscriptViewer } from "@/components/admin/ChatTranscriptViewer";

interface ChatSessionsTabProps {
  initialConversationId?: string | null;
  onConversationOpened?: () => void;
  initialFilter?: string | null;
}

export function ChatSessionsTab({ 
  initialConversationId, 
  onConversationOpened,
  initialFilter
}: ChatSessionsTabProps) {
  return (
    <ChatTranscriptViewer 
      initialConversationId={initialConversationId}
      onConversationOpened={onConversationOpened}
      initialFilter={initialFilter}
    />
  );
}
