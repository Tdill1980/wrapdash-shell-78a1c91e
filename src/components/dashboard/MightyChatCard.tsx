import { MessageSquare, Mail, ArrowRight, Inbox, Plus, AlertTriangle, RefreshCw, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function MightyChatCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Import contacts from WooCommerce mutation
  const importContactsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('seed-contacts-from-woo');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} contacts from WooCommerce orders`);
      queryClient.invalidateQueries({ queryKey: ['mightychat-stats'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  // Fetch conversation stats with error handling
  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['mightychat-stats'],
    queryFn: async () => {
      const [
        { count: totalConversations, error: totalError },
        { count: unreadCount, error: unreadError },
        { data: recentConversations, error: recentError }
      ] = await Promise.all([
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('conversations').select('*', { count: 'exact', head: true }).gt('unread_count', 0),
        supabase.from('conversations')
          .select(`
            id,
            subject,
            channel,
            priority,
            status,
            last_message_at,
            contacts (name, email)
          `)
          .order('last_message_at', { ascending: false })
          .limit(3)
      ]);

      // Log any errors for debugging
      if (totalError) console.error('Total conversations error:', totalError);
      if (unreadError) console.error('Unread count error:', unreadError);
      if (recentError) console.error('Recent conversations error:', recentError);

      return {
        total: totalConversations || 0,
        unread: unreadCount || 0,
        recent: recentConversations || [],
        hasError: !!(totalError || unreadError || recentError)
      };
    },
    retry: 2,
    staleTime: 30000, // 30 seconds
  });

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      default: return 'bg-muted';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <Card className="dashboard-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-poppins text-xl font-bold leading-tight">
            <span className="text-foreground">Mighty</span>
            <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Chat</span>
            <span className="text-muted-foreground text-sm align-super">™</span>
          </CardTitle>
          {(stats?.unread || 0) > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {stats?.unread} unread
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Unified messaging hub</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Error State */}
        {isError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <p className="text-xs text-destructive mb-2">
              {error instanceof Error ? error.message : 'Failed to load conversations'}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="text-xs h-7"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/50 rounded-lg p-2 animate-pulse h-14" />
              <div className="bg-background/50 rounded-lg p-2 animate-pulse h-14" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-background/30 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {!isLoading && !isError && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background/50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-foreground">{stats?.total || 0}</div>
              <div className="text-[10px] text-muted-foreground">Conversations</div>
            </div>
            <div className="bg-background/50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-primary">{stats?.unread || 0}</div>
              <div className="text-[10px] text-muted-foreground">Unread</div>
            </div>
          </div>
        )}

        {/* Recent Conversations or Empty State */}
        {!isLoading && !isError && (
          <>
            {stats?.recent && stats.recent.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-medium">Recent</div>
                {stats.recent.map((conv: any) => (
                  <div 
                    key={conv.id}
                    onClick={() => navigate(`/mightychat?conversation=${conv.id}`)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-background/30 hover:bg-background/50 cursor-pointer transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(conv.priority)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {conv.contacts?.name || conv.subject || 'New conversation'}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="truncate">
                          {conv.subject || conv.contacts?.email || 'No subject'}
                        </span>
                        {conv.last_message_at && (
                          <>
                            <span>•</span>
                            <span className="flex-shrink-0">{formatRelativeTime(conv.last_message_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                      {getChannelIcon(conv.channel)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <Inbox className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">No conversations yet</p>
                  <p className="text-[10px] text-muted-foreground/70">
                    Import contacts from WooCommerce or start a new conversation
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => importContactsMutation.mutate()}
                    disabled={importContactsMutation.isPending}
                    className="text-xs h-7"
                  >
                    {importContactsMutation.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3 mr-1" />
                    )}
                    Import from WooCommerce
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/mightychat')}
                    className="text-xs h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Button */}
        <Button 
          onClick={() => navigate('/mightychat')}
          className="w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] hover:from-[#5B7FFF] hover:via-[#9B59B6] hover:to-[#F56A9E] text-white"
          size="sm"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Open MightyChat
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}