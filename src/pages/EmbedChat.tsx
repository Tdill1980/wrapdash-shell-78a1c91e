import { WebsiteChatWidget } from "@/components/chat/WebsiteChatWidget";

/**
 * Standalone embed page for the chat widget.
 * This page is designed to be loaded in an iframe on external websites.
 * It renders ONLY the chat widget with no extra UI.
 */
export default function EmbedChat() {
  return (
    <div className="w-full h-screen bg-transparent">
      <WebsiteChatWidget />
    </div>
  );
}
