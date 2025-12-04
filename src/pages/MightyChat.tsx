import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { ConversationList } from "@/components/inbox/ConversationList";
import { MessageThread } from "@/components/inbox/MessageThread";
import { ContactPanel } from "@/components/inbox/ContactPanel";
import { NewConversationDialog } from "@/components/inbox/NewConversationDialog";
import { useInbox } from "@/hooks/useInbox";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

const MightyChat = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);

  const {
    conversations,
    messages,
    contacts,
    conversationsLoading,
    messagesLoading,
    sendMessage,
    sendEmail,
    createContact,
    createConversation,
    updateConversationStatus,
    isSending,
    isEmailSending,
  } = useInbox(selectedConversationId || undefined);

  const selectedConversation = conversations?.find(
    (c) => c.id === selectedConversationId
  );

  const handleSendMessage = (content: string, subject?: string) => {
    if (!selectedConversationId || !selectedConversation) return;
    
    // Use email sending for email channel
    if (selectedConversation.channel === "email" && selectedConversation.contact?.email) {
      sendEmail({
        conversationId: selectedConversationId,
        recipientEmail: selectedConversation.contact.email,
        recipientName: selectedConversation.contact.name,
        subject: subject || selectedConversation.subject || "Message from WrapCommand",
        content,
      });
    } else {
      // Use regular message for other channels
      sendMessage({
        conversationId: selectedConversationId,
        content,
        channel: selectedConversation.channel,
      });
    }
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedConversationId) return;
    updateConversationStatus({ id: selectedConversationId, status });
  };

  return (
    <MainLayout>
      {/* MightyChat Header */}
      <div className="px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C]">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              <span className="text-foreground">Mighty</span>
              <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Chat</span>
              <span className="text-[10px] align-super text-muted-foreground ml-0.5">™</span>
            </h1>
            <p className="text-xs text-muted-foreground">Unified messaging hub with email integration</p>
          </div>
        </div>
      </div>

      <div className="h-[calc(100vh-8rem)] flex">
        {/* Conversation List */}
        <div className="w-80 shrink-0">
          {conversationsLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="space-y-2 mt-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
              onNewConversation={() => setShowNewDialog(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}
        </div>

        {/* Message Thread */}
        {messagesLoading && selectedConversationId ? (
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="h-8 w-32" />
          </div>
        ) : (
          <MessageThread
            conversation={selectedConversation}
            messages={messages}
            onSendMessage={handleSendMessage}
            onUpdateStatus={handleUpdateStatus}
            isSending={isSending || isEmailSending}
          />
        )}

        {/* Contact Panel */}
        <ContactPanel
          contact={selectedConversation?.contact}
          conversation={selectedConversation}
        />

        {/* New Conversation Dialog */}
        <NewConversationDialog
          open={showNewDialog}
          onOpenChange={setShowNewDialog}
          contacts={contacts}
          onCreateContact={createContact}
          onCreateConversation={createConversation}
        />
      </div>
    </MainLayout>
  );
};

export default MightyChat;
