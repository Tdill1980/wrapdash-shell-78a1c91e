import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { EscalationsDashboard } from "@/components/admin/EscalationsDashboard";
import { ChatTranscriptViewer } from "@/components/admin/ChatTranscriptViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, MessageSquare, X } from "lucide-react";

export default function EscalationsPage() {
  const navigate = useNavigate();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-orange-400" />
                Escalations Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Priority queue sorted by most recent — click to view full conversation
              </p>
            </div>
          </div>
          
          {selectedConversationId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedConversationId(null)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Close Transcript
            </Button>
          )}
        </div>

        {/* Two-panel layout when conversation selected */}
        {selectedConversationId ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Escalations List */}
            <div className="order-2 lg:order-1">
              <EscalationsDashboard 
                onSelectConversation={(conversationId) => {
                  setSelectedConversationId(conversationId);
                }}
              />
            </div>
            
            {/* Right: Full Chat Transcript with Reply/Upload */}
            <div className="order-1 lg:order-2 bg-card border rounded-lg overflow-hidden">
              <div className="p-3 border-b bg-muted/50 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Full Conversation</span>
              </div>
              <ChatTranscriptViewer 
                initialConversationId={selectedConversationId}
                onConversationOpened={() => {}}
              />
            </div>
          </div>
        ) : (
          /* Full-width Escalations Dashboard when no conversation selected */
          <EscalationsDashboard 
            onSelectConversation={(conversationId) => {
              setSelectedConversationId(conversationId);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}
