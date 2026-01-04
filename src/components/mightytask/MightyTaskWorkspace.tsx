import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Play,
  Lock,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AgentChatPanel } from '@/components/mightychat/AgentChatPanel';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CampaignContentCreator } from '@/components/studio/CampaignContentCreator';
import { isWithinCampaign } from '@/lib/campaign-prompts/january-2026';
import { useOrganization } from '@/contexts/OrganizationContext';

interface MightyCalendar {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  role: string;
  owner_role: string;
  allowed_agents: string[];
  is_source: boolean;
  gradient_from: string;
  gradient_to: string;
}

interface MightyCalendarItem {
  id: string;
  calendar_id: string;
  title: string;
  description: string | null;
  franchise_slug: string | null;
  scheduled_date: string;
  status: string;
  requires_source: boolean;
  source_item_id: string | null;
  checklist: ChecklistItem[];
  assigned_agent: string | null;
  is_legacy_import: boolean;
  legacy_content_id: string | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface MightyTaskWorkspaceProps {
  calendarSlug: string;
  defaultChecklist?: ChecklistItem[];
  actionButtons?: {
    label: string;
    agent: string;
    icon?: React.ReactNode;
  }[];
}

const STATUS_CONFIG = {
  planned: { label: 'Planned', icon: Clock, color: 'bg-muted text-muted-foreground' },
  blocked: { label: 'Blocked', icon: Lock, color: 'bg-yellow-500/20 text-yellow-500' },
  ready: { label: 'Ready', icon: CheckCircle2, color: 'bg-blue-500/20 text-blue-500' },
  executing: { label: 'Executing', icon: Play, color: 'bg-primary/20 text-primary' },
  complete: { label: 'Complete', icon: CheckCircle2, color: 'bg-green-500/20 text-green-500' },
};

export function MightyTaskWorkspace({ 
  calendarSlug, 
  defaultChecklist = [],
  actionButtons = []
}: MightyTaskWorkspaceProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<MightyCalendarItem | null>(null);
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showCampaignCreator, setShowCampaignCreator] = useState(false);
  const [campaignItem, setCampaignItem] = useState<MightyCalendarItem | null>(null);
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  // Fetch calendar config
  const { data: calendar } = useQuery({
    queryKey: ['mighty-calendar', calendarSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mighty_calendars')
        .select('*')
        .eq('slug', calendarSlug)
        .single();
      if (error) throw error;
      return data as MightyCalendar;
    }
  });

  // Fetch calendar items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['mighty-calendar-items', calendar?.id],
    queryFn: async () => {
      if (!calendar?.id) return [];
      const { data, error } = await supabase
        .from('mighty_calendar_items')
        .select('*')
        .eq('calendar_id', calendar.id)
        .order('scheduled_date', { ascending: true });
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        checklist: Array.isArray(item.checklist) 
          ? (item.checklist as unknown as ChecklistItem[])
          : []
      })) as MightyCalendarItem[];
    },
    enabled: !!calendar?.id
  });

  // Update item mutation
  const updateItem = useMutation({
    mutationFn: async (updates: { id: string; status?: string; checklist?: ChecklistItem[] }) => {
      const updateData: Record<string, unknown> = { id: updates.id };
      if (updates.status) updateData.status = updates.status;
      if (updates.checklist) updateData.checklist = updates.checklist as unknown;
      
      const { error } = await supabase
        .from('mighty_calendar_items')
        .update(updateData)
        .eq('id', updates.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mighty-calendar-items'] });
    }
  });

  // Create item mutation
  const createItem = useMutation({
    mutationFn: async (newItem: {
      calendar_id: string;
      title: string;
      scheduled_date: string;
      status: string;
      requires_source: boolean;
      checklist: ChecklistItem[];
      assigned_agent: string | null;
      organization_id: string | null;
    }) => {
      const insertPayload = {
        calendar_id: newItem.calendar_id,
        title: newItem.title,
        scheduled_date: newItem.scheduled_date,
        status: newItem.status,
        requires_source: newItem.requires_source,
        checklist: JSON.parse(JSON.stringify(newItem.checklist)),
        assigned_agent: newItem.assigned_agent,
        organization_id: newItem.organization_id
      };
      const { error } = await supabase
        .from('mighty_calendar_items')
        .insert([insertPayload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mighty-calendar-items'] });
      toast.success('Item created');
    }
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Group items by date
  const itemsByDate = useMemo(() => {
    return items.reduce((acc, item) => {
      const date = item.scheduled_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {} as Record<string, MightyCalendarItem[]>);
  }, [items]);

  // Check if item can execute
  const canExecute = (item: MightyCalendarItem): boolean => {
    if (item.requires_source && !item.source_item_id) {
      return false;
    }
    return item.status !== 'complete' && item.status !== 'blocked';
  };

  // Handle execute with agent - OR campaign content creator for campaign dates
  const handleExecute = (item: MightyCalendarItem, agentId: string) => {
    if (!canExecute(item)) {
      toast.error('Cannot execute - waiting on source content');
      return;
    }
    
    // Campaign gate: Route January 2026 items to CampaignContentCreator
    if (isWithinCampaign(item.scheduled_date)) {
      setCampaignItem(item);
      setShowCampaignCreator(true);
      setSelectedItem(null); // Close the detail modal
      toast.info('Opening Campaign Content Creator');
      return;
    }
    
    // Legacy path: Use agent execution
    setSelectedItem(item);
    setSelectedAgent(agentId);
    setShowAgentChat(true);
    updateItem.mutate({ id: item.id, status: 'executing' });
  };

  // Open campaign creator directly (for campaign items)
  const openCampaignCreator = (item: MightyCalendarItem) => {
    setCampaignItem(item);
    setShowCampaignCreator(true);
    setSelectedItem(null);
  };

  // Handle checklist toggle
  const handleChecklistToggle = (item: MightyCalendarItem, checkId: string) => {
    const updatedChecklist = item.checklist.map(c => 
      c.id === checkId ? { ...c, completed: !c.completed } : c
    );
    updateItem.mutate({ id: item.id, checklist: updatedChecklist });
  };

  // Add new item
  const handleAddItem = (date: Date) => {
    if (!calendar) return;
    const newItem = {
      calendar_id: calendar.id,
      title: 'New Item',
      description: null,
      franchise_slug: null,
      scheduled_date: format(date, 'yyyy-MM-dd'),
      status: 'planned',
      requires_source: !calendar.is_source,
      source_item_id: null,
      checklist: defaultChecklist,
      assigned_agent: calendar.allowed_agents[0] || null,
      is_legacy_import: false,
      legacy_content_id: null,
      organization_id: null
    };
    createItem.mutate(newItem as any);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  if (!calendar) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  const gradientStyle = {
    background: `linear-gradient(135deg, ${calendar.gradient_from}, ${calendar.gradient_to})`
  };

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <div 
        className="rounded-2xl p-6 text-white"
        style={gradientStyle}
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{calendar.name}</h1>
            <p className="text-white/80 mt-1">{calendar.description}</p>
            <div className="flex gap-2 mt-3">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {calendar.role.toUpperCase()}
              </Badge>
              {calendar.is_source && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  🔥 SOURCE
                </Badge>
              )}
            </div>
          </div>
          <Button 
            variant="secondary" 
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={() => handleAddItem(new Date())}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = items.filter(i => i.status === key).length;
          const Icon = config.icon;
          return (
            <Card key={key} className={cn('border-l-4', config.color.replace('text-', 'border-l-').replace('/20', ''))}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-xs text-muted-foreground">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <CardTitle className="text-xl">
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayItems = itemsByDate[dateStr] || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  className={cn(
                    'min-h-[120px] border rounded-lg p-1 transition-colors group',
                    isCurrentMonth ? 'bg-card hover:bg-accent/50' : 'bg-muted/30',
                    isToday && 'ring-2 ring-primary'
                  )}
                >
                  {/* Day Number with Add Button */}
                  <div className="flex justify-between items-center mb-1 px-1">
                    <span className={cn(
                      'text-sm font-medium',
                      !isCurrentMonth && 'text-muted-foreground/50',
                      isToday && 'text-primary font-bold'
                    )}>
                      {format(day, 'd')}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleAddItem(day)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Items */}
                  <div className="space-y-1 overflow-y-auto max-h-[90px]">
                    {dayItems.slice(0, 3).map((item) => {
                      const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planned;
                      const isBlocked = item.requires_source && !item.source_item_id;
                      const isCampaignItem = isWithinCampaign(item.scheduled_date);
                      
                      return (
                        <div
                          key={item.id}
                          onClick={() => isCampaignItem ? openCampaignCreator(item) : setSelectedItem(item)}
                          className={cn(
                            'text-[10px] p-1.5 rounded cursor-pointer transition-all hover:scale-[1.02]',
                            statusConfig.color,
                            isBlocked && 'opacity-60',
                            isCampaignItem && 'ring-1 ring-primary/50'
                          )}
                        >
                          <div className="flex items-center gap-1">
                            {isCampaignItem ? (
                              <Sparkles className="h-3 w-3 text-primary" />
                            ) : isBlocked ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              <statusConfig.icon className="h-3 w-3" />
                            )}
                            <span className="font-medium truncate">{item.title}</span>
                          </div>
                          {item.franchise_slug && (
                            <div className="truncate text-[9px] opacity-70">
                              {item.franchise_slug}
                            </div>
                          )}
                          {isCampaignItem && (
                            <div className="text-[8px] text-primary font-medium mt-0.5">
                              Jan 2026
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <div className="text-[10px] text-center text-muted-foreground">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Full-Screen Execution Card Modal */}
      <Dialog open={!!selectedItem && !showAgentChat} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {selectedItem && (
            <div 
              className="rounded-t-lg p-6 text-white"
              style={gradientStyle}
            >
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 mb-2">
                    {calendar.name}
                  </Badge>
                  <h2 className="text-2xl font-bold">{selectedItem.title}</h2>
                  {selectedItem.franchise_slug && (
                    <p className="text-white/80 mt-1">Franchise: {selectedItem.franchise_slug}</p>
                  )}
                  <p className="text-white/60 text-sm mt-2">
                    Scheduled: {format(new Date(selectedItem.scheduled_date), 'MMMM d, yyyy')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setSelectedItem(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {selectedItem && (
            <div className="p-6 space-y-6">
              {/* Status & Blocking Warning */}
              {selectedItem.requires_source && !selectedItem.source_item_id && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-500">Waiting on Source Content</p>
                    <p className="text-sm text-muted-foreground">
                      This item requires content from Ink & Edge Magazine before it can be executed.
                    </p>
                  </div>
                </div>
              )}

              {/* Checklist */}
              {selectedItem.checklist.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Checklist</h3>
                  <div className="space-y-2">
                    {selectedItem.checklist.map((check) => (
                      <div 
                        key={check.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
                        onClick={() => handleChecklistToggle(selectedItem, check.id)}
                      >
                        <Checkbox checked={check.completed} />
                        <span className={cn(check.completed && 'line-through text-muted-foreground')}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div>
                <h3 className="font-semibold mb-3">Execute with Agent</h3>
                <div className="grid grid-cols-2 gap-3">
                  {actionButtons.map((action) => (
                    <Button
                      key={action.agent}
                      variant="outline"
                      className="h-auto py-4 justify-start"
                      disabled={!canExecute(selectedItem)}
                      onClick={() => handleExecute(selectedItem, action.agent)}
                    >
                      <MessageSquare className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">{action.label}</div>
                        <div className="text-xs text-muted-foreground">
                          Agent: {action.agent.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </Button>
                  ))}
                  {calendar.allowed_agents.map((agent) => {
                    if (actionButtons.some(a => a.agent === agent)) return null;
                    return (
                      <Button
                        key={agent}
                        variant="outline"
                        className="h-auto py-4 justify-start"
                        disabled={!canExecute(selectedItem)}
                        onClick={() => handleExecute(selectedItem, agent)}
                      >
                        <Play className="h-5 w-5 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Execute</div>
                          <div className="text-xs text-muted-foreground">
                            with {agent.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Mark Complete */}
              {selectedItem.status !== 'complete' && (
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => {
                    updateItem.mutate({ id: selectedItem.id, status: 'complete' });
                    setSelectedItem(null);
                    toast.success('Item marked as complete');
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Agent Chat Panel */}
      {showAgentChat && selectedAgent && selectedItem && (
        <AgentChatPanel
          agentId={selectedAgent}
          open={showAgentChat}
          onOpenChange={(open) => {
            if (!open) {
              setShowAgentChat(false);
              setSelectedAgent(null);
            }
          }}
          context={{
            taskTitle: selectedItem.title,
            taskId: selectedItem.id,
            calendarName: calendar.name,
            franchiseSlug: selectedItem.franchise_slug
          }}
        />
      )}

      {/* Campaign Content Creator Modal */}
      <CampaignContentCreator
        open={showCampaignCreator}
        onOpenChange={(open) => {
          setShowCampaignCreator(open);
          if (!open) setCampaignItem(null);
        }}
        calendarItem={campaignItem ? {
          id: campaignItem.id,
          title: campaignItem.title,
          brand: 'wrapmate', // Default brand for mighty calendar items
          content_type: 'reel', // Default content type
          platform: 'meta', // Default platform
          scheduled_date: campaignItem.scheduled_date,
          directive: campaignItem.description,
          locked_metadata: null,
        } : null}
        organizationId={organizationId}
        onDraftSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['mighty-calendar-items'] });
          setShowCampaignCreator(false);
          setCampaignItem(null);
          toast.success('Campaign draft saved successfully');
        }}
      />

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          Loading items...
        </div>
      )}
    </div>
  );
}