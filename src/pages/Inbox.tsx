import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { ConversationList } from "@/components/inbox/ConversationList";
import { MessageThread } from "@/components/inbox/MessageThread";
import { ContactPanel } from "@/components/inbox/ContactPanel";
import { NewConversationDialog } from "@/components/inbox/NewConversationDialog";
import { useInbox } from "@/hooks/useInbox";
import { Skeleton } from "@/components/ui/skeleton";

const Inbox = () => {
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
    createContact,
    createConversation,
    updateConversationStatus,
    isSending,
  } = useInbox(selectedConversationId || undefined);

  const selectedConversation = conversations?.find(
    (c) => c.id === selectedConversationId
  );

  const handleSendMessage = (content: string) => {
    if (!selectedConversationId || !selectedConversation) return;
    sendMessage({
      conversationId: selectedConversationId,
      content,
      channel: selectedConversation.channel,
    });
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedConversationId) return;
    updateConversationStatus({ id: selectedConversationId, status });
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] flex">
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
            isSending={isSending}
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

export default Inbox;
