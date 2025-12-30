import { EmailMessageRenderer } from "./EmailMessageRenderer";
import { DMMessageRenderer } from "./DMMessageRenderer";
import { ChatMessageRenderer } from "./ChatMessageRenderer";

interface MessageViewerProps {
  message: {
    id: string;
    content: string;
    direction: string;
    channel: string;
    created_at: string | null;
    sender_name: string | null;
    sender_email?: string | null;
    metadata?: Record<string, unknown> | null;
  };
}

/**
 * Unified message viewer that routes to the appropriate renderer
 * based on channel type. Use this component everywhere you need
 * to display messages (MightyChat, AI Approvals, Ops Desk).
 */
export function MessageViewer({ message }: MessageViewerProps) {
  const channel = message.channel?.toLowerCase() || "";

  // Email messages get full HTML rendering
  if (channel === "email") {
    return <EmailMessageRenderer message={message as any} />;
  }

  // Social DMs (Instagram, Facebook, Messenger)
  if (channel === "instagram" || channel === "facebook" || channel === "messenger") {
    return <DMMessageRenderer message={message as any} />;
  }

  // Website chat
  if (channel === "website" || channel === "website_chat") {
    return <DMMessageRenderer message={message as any} />;
  }

  // Default: chat/system messages
  return <ChatMessageRenderer message={message as any} />;
}

// Re-export individual renderers for direct use if needed
export { EmailMessageRenderer } from "./EmailMessageRenderer";
export { DMMessageRenderer } from "./DMMessageRenderer";
export { ChatMessageRenderer } from "./ChatMessageRenderer";
