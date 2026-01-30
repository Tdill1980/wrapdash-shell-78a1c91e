import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { EscalationsDashboard } from "@/components/admin/EscalationsDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function EscalationsPage() {
  const navigate = useNavigate();

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
                Priority queue sorted by most recent — click to open conversation
              </p>
            </div>
          </div>
        </div>

        {/* Full Escalations Dashboard */}
        <EscalationsDashboard 
          onSelectConversation={(conversationId) => {
            navigate(`/website-admin?tab=chats&conversation=${conversationId}`);
          }}
        />
      </div>
    </MainLayout>
  );
}
