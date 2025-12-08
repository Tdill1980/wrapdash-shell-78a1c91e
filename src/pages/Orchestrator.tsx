import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckSquare, 
  Package, 
  Paintbrush,
  Sparkles,
  ArrowRight,
  Clock,
  AlertCircle,
  MessageCircle,
  Mail,
  Instagram,
  Globe,
  Phone,
  Plus,
  Eye,
  Play,
  Wand2,
  Loader2
} from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AIDesignOpportunitiesWidget } from "@/components/orchestrator/AIDesignOpportunitiesWidget";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  priority: string | null;
  created_at: string;
}

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  status: string | null;
  total_price: number;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  status: string | null;
  due_date: string | null;
}

interface ApproveFlowProject {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  product_type: string;
  created_at: string | null;
}

interface ShopFlowOrder {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  product_type: string;
  priority: string | null;
}

interface AIAction {
  id: string;
  action_type: string;
  action_payload: Record<string, unknown> | null;
  priority: string | null;
  created_at: string | null;
}

const Orchestrator = () => {
  const { organizationId } = useOrganization();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [designs, setDesigns] = useState<ApproveFlowProject[]>([]);
  const [orders, setOrders] = useState<ShopFlowOrder[]>([]);
  const [aiActions, setAIActions] = useState<AIAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, [organizationId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch leads (contacts from last 7 days)
      const { data: leadsData } = await supabase
        .from('contacts')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      setLeads(leadsData || []);

      // Fetch pending quotes
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('*')
        .in('status', ['pending', 'draft'])
        .order('created_at', { ascending: false })
        .limit(10);
      setQuotes(quotesData || []);

      // Fetch open tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
      setTasks(tasksData || []);

      // Fetch active designs
      const { data: designsData } = await supabase
        .from('approveflow_projects')
        .select('*')
        .not('status', 'eq', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);
      setDesigns(designsData || []);

      // Fetch active orders
      const { data: ordersData } = await supabase
        .from('shopflow_orders')
        .select('*')
        .in('status', ['design_requested', 'in_production', 'ready_to_ship'])
        .order('created_at', { ascending: false })
        .limit(10);
      setOrders(ordersData || []);

      // Fetch unresolved AI actions
      const { data: actionsData } = await supabase
        .from('ai_actions')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);
      setAIActions((actionsData || []).map(a => ({
        ...a,
        action_payload: a.action_payload as Record<string, unknown> | null
      })));

    } catch (error) {
      console.error('Error fetching orchestrator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAction = async (actionId: string) => {
    await supabase
      .from('ai_actions')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', actionId);
    
    setAIActions(prev => prev.filter(a => a.id !== actionId));
    toast({ title: "Action resolved" });
  };

  const getChannelIcon = (source: string | null) => {
    switch (source) {
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'email': return <Mail className="w-4 h-4 text-blue-500" />;
      case 'website': return <Globe className="w-4 h-4 text-green-500" />;
      case 'sms': return <Phone className="w-4 h-4 text-purple-500" />;
      default: return <MessageCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': case 'urgent': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'normal': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'low': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const totalActions = leads.length + quotes.length + tasks.length + designs.length + orders.length + aiActions.length;

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-primary/60">
              <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-foreground">Master</span>
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> Control Panel</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Your command center for wrap operations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              {totalActions} items need attention
            </Badge>
            <Button size="sm" onClick={fetchAllData}>
              Refresh
            </Button>
          </div>
        </div>

        {/* AI Suggestions Banner */}
        {aiActions.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {aiActions.slice(0, 3).map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{action.action_type.replace(/_/g, ' ')}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {action.created_at ? format(new Date(action.created_at), 'MMM d, h:mm a') : 'Just now'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleResolveAction(action.id)}>
                        Dismiss
                      </Button>
                      <Button size="sm">
                        <Play className="w-3 h-3 mr-1" />
                        Take Action
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Quote Suggestions - Leads with vehicle data */}
        {leads.filter(l => l.priority === 'high').length > 0 && (
          <Card className="border-violet-500/50 bg-violet-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-violet-400" />
                AI Quote Suggestions
              </CardTitle>
              <CardDescription>Leads ready for AI-powered quotes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leads.filter(l => l.priority === 'high').slice(0, 3).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-violet-500/20">
                    <div className="flex items-center gap-3">
                      {getChannelIcon(lead.source)}
                      <div>
                        <p className="text-sm font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email || lead.phone}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                      onClick={() => navigate('/mighty-customer', { state: { customerName: lead.name, customerEmail: lead.email } })}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Create AI Quote
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Design Opportunities - Design intent leads */}
        <AIDesignOpportunitiesWidget leads={leads} organizationId={organizationId} />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Leads Queue */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  New Leads
                </CardTitle>
                <Badge>{leads.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {leads.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No new leads</p>
                  ) : (
                    leads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(lead.source)}
                          <div>
                            <p className="text-sm font-medium">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.email || lead.phone}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => navigate('/mightychat')}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <Button variant="outline" className="w-full mt-3" size="sm" onClick={() => navigate('/mightychat')}>
                View All Leads
              </Button>
            </CardContent>
          </Card>

          {/* Quotes Queue */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5" />
                  Pending Quotes
                </CardTitle>
                <Badge>{quotes.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {quotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending quotes</p>
                  ) : (
                    quotes.map((quote) => (
                      <div key={quote.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{quote.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{quote.quote_number} • ${quote.total_price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getPriorityColor(quote.status)}>
                            {quote.status}
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => navigate('/mighty-customer')}>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <Button variant="outline" className="w-full mt-3" size="sm" onClick={() => navigate('/mighty-customer')}>
                <Plus className="w-4 h-4 mr-1" />
                Create Quote
              </Button>
            </CardContent>
          </Card>

          {/* Tasks Queue */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckSquare className="w-5 h-5" />
                  Open Tasks
                </CardTitle>
                <Badge>{tasks.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No open tasks</p>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No due date'}
                          </p>
                        </div>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority || 'normal'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Designs Queue */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Paintbrush className="w-5 h-5" />
                  Active Designs
                </CardTitle>
                <Badge>{designs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {designs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No active designs</p>
                  ) : (
                    designs.map((design) => (
                      <div key={design.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{design.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{design.order_number} • {design.product_type}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/approveflow/${design.id}`)}>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <Button variant="outline" className="w-full mt-3" size="sm" onClick={() => navigate('/approveflow')}>
                View ApproveFlow
              </Button>
            </CardContent>
          </Card>

          {/* Orders Queue */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5" />
                  Active Orders
                </CardTitle>
                <Badge>{orders.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No active orders</p>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.order_number}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{order.status.replace(/_/g, ' ')}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/track/${order.order_number}`)}>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <Button variant="outline" className="w-full mt-3" size="sm" onClick={() => navigate('/shopflow-internal')}>
                View ShopFlow
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/mighty-customer')}>
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">New Quote</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/mightychat')}>
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-xs">Open Chat</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/approveflow')}>
                  <Paintbrush className="w-5 h-5" />
                  <span className="text-xs">Designs</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/email-campaigns')}>
                  <Mail className="w-5 h-5" />
                  <span className="text-xs">Email</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/instagram-bot')}>
                  <Instagram className="w-5 h-5" />
                  <span className="text-xs">IG Bot</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/lead-generator')}>
                  <Users className="w-5 h-5" />
                  <span className="text-xs">Lead Gen</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Orchestrator;
