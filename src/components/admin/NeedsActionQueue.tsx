import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Clock, 
  Mail, 
  Receipt, 
  FileCheck,
  User,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { evaluateEscalationStatus, getStatusColor, type EscalationStatus } from "@/hooks/useEscalationStatus";
import type { ConversationEvent } from "@/hooks/useConversationEvents";

interface NeedsActionItem {
  conversationId: string;
  contactName: string;
  contactEmail: string;
  escalationType: string;
  escalatedAt: string;
  status: EscalationStatus;
  missing: string[];
  age: string;
}

export function NeedsActionQueue({ 
  onSelectConversation 
}: { 
  onSelectConversation: (id: string) => void 
}) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['needs-action-queue'],
    queryFn: async (): Promise<NeedsActionItem[]> => {
      // Get all conversations with escalations
      const { data: escalationEvents, error: eventsError } = await supabase
        .from('conversation_events')
        .select('conversation_id, created_at, subtype')
        .eq('event_type', 'escalation_sent')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Get unique conversation IDs
      const conversationIds = [...new Set(escalationEvents?.map(e => e.conversation_id) || [])];
      
      if (conversationIds.length === 0) return [];

      // Get all events for these conversations
      const { data: allEvents, error: allEventsError } = await supabase
        .from('conversation_events')
        .select('*')
        .in('conversation_id', conversationIds);

      if (allEventsError) throw allEventsError;

      // Get conversation details
      const { data: conversations, error: convsError } = await supabase
        .from('conversations')
        .select('id, contact:contacts(name, email)')
        .in('id', conversationIds);

      if (convsError) throw convsError;

      // Build queue items
      const queueItems: NeedsActionItem[] = [];

      for (const convId of conversationIds) {
        const convEvents = (allEvents || []).filter(e => e.conversation_id === convId) as ConversationEvent[];
        const statusResult = evaluateEscalationStatus(convEvents);
        
        // Only include blocked items
        if (statusResult.status !== 'blocked') continue;

        const conv = conversations?.find(c => c.id === convId);
        const escalation = escalationEvents?.find(e => e.conversation_id === convId);
        const contact = conv?.contact as { name?: string; email?: string } | null;

        queueItems.push({
          conversationId: convId,
          contactName: contact?.name || 'Unknown',
          contactEmail: contact?.email || '',
          escalationType: escalation?.subtype || 'general',
          escalatedAt: escalation?.created_at || '',
          status: statusResult.status,
          missing: statusResult.missing,
          age: escalation?.created_at 
            ? formatDistanceToNow(new Date(escalation.created_at), { addSuffix: true })
            : '',
        });
      }

      // Sort by age (oldest first)
      return queueItems.sort((a, b) => 
        new Date(a.escalatedAt).getTime() - new Date(b.escalatedAt).getTime()
      );
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Needs Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-green-500">
            <Clock className="h-4 w-4" />
            All Clear
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No blocked escalations. All items are complete or in progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-500/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-500">
            <AlertTriangle className="h-4 w-4" />
            Needs Action
          </div>
          <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
            {items.length} blocked
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px]">
          <div className="divide-y divide-border">
            {items.map((item) => (
              <button
                key={item.conversationId}
                onClick={() => onSelectConversation(item.conversationId)}
                className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">
                      {item.contactName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {item.escalationType}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.age}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    {item.missing.map((m, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="text-[10px] bg-red-500/10 text-red-500 border-red-500/30"
                      >
                        {m.includes('Email') && <Mail className="h-2.5 w-2.5 mr-1" />}
                        {m.includes('Quote') && <Receipt className="h-2.5 w-2.5 mr-1" />}
                        {m.includes('File') && <FileCheck className="h-2.5 w-2.5 mr-1" />}
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
