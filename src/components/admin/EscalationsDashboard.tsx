import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Clock, 
  Mail, 
  User,
  CheckCircle,
  MessageCircle,
  Phone,
  Truck,
  Palette,
  AlertCircle,
  ExternalLink,
  Loader2,
  Receipt
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { evaluateEscalationStatus, type EscalationStatus } from "@/hooks/useEscalationStatus";
import type { ConversationEvent } from "@/hooks/useConversationEvents";
import { toast } from "sonner";
import { ResolutionModal } from "./ResolutionModal";

// Priority order for escalation types (lower = higher priority)
const TYPE_PRIORITY: Record<string, number> = {
  'quality_issue': 1,
  'unhappy_customer': 2,
  'bulk_inquiry': 3,
  'bulk_inquiry_with_email': 3,
  'bulk_order': 3,
  'design': 4,
  'jackson': 5,
  'lance': 5,
  'general': 10,
};

// Escalation type display config
const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'quality_issue': { label: 'Quality Issue', icon: AlertCircle, color: 'bg-red-500/20 text-red-400 border-red-500/40' },
  'unhappy_customer': { label: 'Unhappy', icon: AlertTriangle, color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  'bulk_inquiry': { label: 'Bulk Order', icon: Truck, color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  'bulk_inquiry_with_email': { label: 'Bulk Order', icon: Truck, color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  'bulk_order': { label: 'Bulk Order', icon: Truck, color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  'design': { label: 'Design', icon: Palette, color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
  'jackson': { label: 'Jackson', icon: User, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  'lance': { label: 'Lance', icon: User, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
};

interface VehicleInfo {
  year?: string;
  make?: string;
  model?: string;
}

interface EscalationItem {
  conversationId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  escalationType: string;
  escalatedAt: string;
  status: EscalationStatus;
  missing: string[];
  age: string;
  priority: number;
  vehicle?: VehicleInfo;
}

interface EscalationsDashboardProps {
  onSelectConversation?: (conversationId: string) => void;
}

export function EscalationsDashboard({ onSelectConversation }: EscalationsDashboardProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);

  // Fetch escalation queue with priority sorting
  const { data: items, isLoading: queueLoading } = useQuery({
    queryKey: ['escalations-dashboard-queue'],
    queryFn: async (): Promise<EscalationItem[]> => {
      const { data: escalationEvents, error: eventsError } = await supabase
        .from('conversation_events')
        .select('conversation_id, created_at, subtype')
        .eq('event_type', 'escalation_sent')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      const conversationIds = [...new Set(escalationEvents?.map(e => e.conversation_id) || [])];
      if (conversationIds.length === 0) return [];

      const { data: allEvents } = await supabase
        .from('conversation_events')
        .select('*')
        .in('conversation_id', conversationIds);

      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, chat_state, contact:contacts(name, email, phone)')
        .in('id', conversationIds);

      const queueItems: EscalationItem[] = [];

      for (const convId of conversationIds) {
        const convEvents = (allEvents || []).filter(e => e.conversation_id === convId) as ConversationEvent[];
        const statusResult = evaluateEscalationStatus(convEvents);
        
        const conv = conversations?.find(c => c.id === convId);
        const escalation = escalationEvents?.find(e => e.conversation_id === convId);
        const contact = conv?.contact as { name?: string; email?: string; phone?: string } | null;
        const escalationType = escalation?.subtype || 'general';
        const chatState = conv?.chat_state as { vehicle?: VehicleInfo } | null;

        queueItems.push({
          conversationId: convId,
          contactName: contact?.name || 'Website Visitor',
          contactEmail: contact?.email || '',
          contactPhone: contact?.phone || '',
          escalationType,
          escalatedAt: escalation?.created_at || '',
          status: statusResult.status,
          missing: statusResult.missing,
          age: escalation?.created_at 
            ? formatDistanceToNow(new Date(escalation.created_at), { addSuffix: true })
            : '',
          priority: TYPE_PRIORITY[escalationType] || 10,
          vehicle: chatState?.vehicle,
        });
      }

      // Sort by: 1) blocked first, 2) type priority, 3) newest first
      return queueItems.sort((a, b) => {
        // Blocked items first
        if (a.status === 'blocked' && b.status !== 'blocked') return -1;
        if (b.status === 'blocked' && a.status !== 'blocked') return 1;
        
        // Then by type priority
        if (a.priority !== b.priority) return a.priority - b.priority;
        
        // Then by age (NEWEST first - most recent at top)
        return new Date(b.escalatedAt).getTime() - new Date(a.escalatedAt).getTime();
      });
    },
    refetchInterval: 30000,
  });

  const getTypeConfig = (type: string) => {
    return TYPE_CONFIG[type] || { label: type, icon: MessageCircle, color: 'bg-muted text-muted-foreground border-muted' };
  };

  const blockedItems = items?.filter(i => i.status === 'blocked') || [];

  // Handle row click - opens canonical chat
  const handleRowClick = (conversationId: string) => {
    setSelectedId(conversationId);
    if (onSelectConversation) {
      onSelectConversation(conversationId);
    }
  };

  // Handle resolve action
  const handleResolve = () => {
    if (!selectedId) {
      toast.error('Select an escalation first');
      return;
    }
    setShowResolutionModal(true);
  };

  // Quick resolve without modal
  const handleQuickResolve = async (conversationId: string) => {
    setIsProcessing(true);
    try {
      await supabase.from('conversation_events').insert([{
        conversation_id: conversationId,
        event_type: 'marked_complete',
        actor: 'admin',
        payload: { resolution_notes: 'Quick resolved from escalations dashboard' },
      }]);
      toast.success('Resolved!');
      queryClient.invalidateQueries({ queryKey: ['escalations-dashboard-queue'] });
    } catch (err) {
      toast.error('Failed to resolve');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get selected item for resolution modal
  const selectedItem = items?.find(i => i.conversationId === selectedId);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2 text-white">
        <AlertTriangle className="h-5 w-5 text-orange-400" />
        Escalations Dashboard
        <span className="text-sm font-normal text-gray-400 ml-2">
          (Click to open in Chat)
        </span>
      </h2>

      <Card className="bg-[#1a1a2e] border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between text-gray-300">
            <span>Queue</span>
            <div className="flex items-center gap-2">
              {blockedItems.length > 0 && (
                <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/40">
                  {blockedItems.length} blocked
                </Badge>
              )}
              {selectedId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-green-500/30 text-green-400 hover:bg-green-500/10"
                  onClick={handleResolve}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  Resolve Selected
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {queueLoading ? (
            <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
          ) : !items || items.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-white">All clear!</p>
              <p className="text-xs text-gray-400">No escalations pending</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="divide-y divide-purple-500/10">
                {items.map((item) => {
                  const typeConfig = getTypeConfig(item.escalationType);
                  const TypeIcon = typeConfig.icon;
                  const isComplete = item.status === 'complete';
                  const isSelected = selectedId === item.conversationId;
                  
                  return (
                    <div
                      key={item.conversationId}
                      className={`flex items-center gap-3 p-3 hover:bg-purple-500/10 transition-colors cursor-pointer ${
                        isSelected ? 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border-l-2 border-purple-500' : ''
                      } ${isComplete ? 'opacity-50' : ''}`}
                    >
                      {/* Main clickable area - opens canonical chat */}
                      <button
                        onClick={() => handleRowClick(item.conversationId)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium truncate text-white">
                            {item.contactName !== 'Website Visitor' 
                              ? item.contactName 
                              : item.contactEmail?.split('@')[0] || 'Unknown'}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${typeConfig.color} flex items-center gap-1 flex-shrink-0`}
                          >
                            <TypeIcon className="h-3 w-3" />
                            {typeConfig.label}
                          </Badge>
                        </div>
                        
                        {/* Contact info preview */}
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-1.5 ml-5">
                          {item.contactEmail && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" />
                              {item.contactEmail.split('@')[0]}...
                            </span>
                          )}
                          {item.contactPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-green-500" />
                              ✓
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-400 ml-5">
                          <Clock className="h-3 w-3" />
                          {item.age}
                          {item.status === 'blocked' && (
                            <Badge variant="outline" className="text-[9px] bg-orange-500/20 text-orange-400 border-orange-500/40 ml-auto">
                              blocked
                            </Badge>
                          )}
                          {isComplete && (
                            <Badge variant="outline" className="text-[9px] bg-green-500/20 text-green-400 border-green-500/40 ml-auto">
                              complete
                            </Badge>
                          )}
                        </div>
                        
                        {item.missing.length > 0 && !isComplete && (
                          <div className="flex flex-wrap gap-1 mt-1.5 ml-5">
                            {item.missing.map((m, i) => (
                              <Badge key={i} variant="outline" className="text-[9px] bg-[#2a2a4a] text-gray-400 border-white/10">
                                {m}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </button>
                      
                      {/* Quick actions - always visible */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-green-400 hover:bg-green-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            const vehicle = item.vehicle || {};
                            const params = new URLSearchParams();
                            params.set('mode', 'wpw_internal');
                            params.set('conversation_id', item.conversationId);
                            if (item.contactName) params.set('customer', item.contactName);
                            if (item.contactEmail) params.set('email', item.contactEmail);
                            if (item.contactPhone) params.set('phone', item.contactPhone);
                            if (vehicle.year) params.set('year', vehicle.year);
                            if (vehicle.make) params.set('make', vehicle.make);
                            if (vehicle.model) params.set('model', vehicle.model);
                            navigate(`/mighty-customer?${params.toString()}`);
                          }}
                          title="Create Quote"
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                        {/* Call Back button - only if contact has phone */}
                        {item.contactPhone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${item.contactPhone}`, '_self');
                            }}
                            title="Call Back"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(item.conversationId);
                          }}
                          title="Open in Chat"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        {!isComplete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-green-400 hover:bg-green-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickResolve(item.conversationId);
                            }}
                            disabled={isProcessing}
                            title="Quick Resolve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {/* Resolution Modal */}
      <ResolutionModal
        open={showResolutionModal}
        onOpenChange={setShowResolutionModal}
        conversationId={selectedId || ''}
        customerName={selectedItem?.contactName}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['escalations-dashboard-queue'] });
          setSelectedId(null);
        }}
      />
    </div>
  );
}
