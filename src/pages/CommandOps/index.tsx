import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Activity,
  Mail,
  FileText,
  Tag,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Calendar,
  Bot,
} from "lucide-react";

interface WrenActivity {
  id: string;
  action_type: 'email_sent' | 'quote_created' | 'coupon_created' | 'task_completed' | 'lead_contacted' | 'function_deployed' | 'error';
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  status: 'success' | 'failed' | 'pending';
}

export default function CommandOpsPage() {
  const [activities, setActivities] = useState<WrenActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wren_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      // Use mock data for now if table doesn't exist
      setActivities(getMockActivities());
    } finally {
      setLoading(false);
    }
  };

  const getMockActivities = (): WrenActivity[] => {
    return [
      {
        id: '1',
        action_type: 'email_sent',
        description: 'Re-engagement email sent to angela@143berkley.com',
        metadata: { email: 'angela@143berkley.com', coupon: 'WREN5', template: 'frustrated' },
        created_at: new Date().toISOString(),
        status: 'success'
      },
      {
        id: '2',
        action_type: 'coupon_created',
        description: 'Created WooCommerce coupon WREN5 (5% off)',
        metadata: { code: 'WREN5', discount: '5%', expires: '2026-03-09' },
        created_at: new Date().toISOString(),
        status: 'success'
      },
      {
        id: '3',
        action_type: 'function_deployed',
        description: 'Deployed command-chat edge function',
        metadata: { function: 'command-chat', project: 'qxllysilzonrlyoaomce' },
        created_at: new Date().toISOString(),
        status: 'success'
      },
      {
        id: '4',
        action_type: 'quote_created',
        description: 'Quote sent to Royalty Tint Ohio - BMW M3 - $1,581',
        metadata: { email: 'royaltytintohio@gmail.com', vehicle: 'BMW M3', price: 1581 },
        created_at: new Date().toISOString(),
        status: 'success'
      },
    ];
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email_sent': return <Mail className="w-4 h-4" />;
      case 'quote_created': return <FileText className="w-4 h-4" />;
      case 'coupon_created': return <Tag className="w-4 h-4" />;
      case 'task_completed': return <CheckCircle className="w-4 h-4" />;
      case 'lead_contacted': return <Activity className="w-4 h-4" />;
      case 'function_deployed': return <Bot className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'email_sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'quote_created': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'coupon_created': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'task_completed': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      case 'lead_contacted': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'function_deployed': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredActivities = activities.filter(a => {
    if (filter !== 'all' && a.action_type !== filter) return false;
    if (searchQuery && !a.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    emails: activities.filter(a => a.action_type === 'email_sent').length,
    quotes: activities.filter(a => a.action_type === 'quote_created').length,
    coupons: activities.filter(a => a.action_type === 'coupon_created').length,
    tasks: activities.filter(a => a.action_type === 'task_completed').length,
  };

  return (
    <MainLayout>
      <div className="p-6 bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">MightyTask Command Ops</h1>
              <p className="text-gray-400 text-sm">Wren Activity Log — Everything I Do</p>
            </div>
          </div>
          <Button onClick={() => fetchActivities()} variant="outline" className="border-gray-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gray-800 border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.emails}</div>
                <div className="text-sm text-gray-400">Emails Sent</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gray-800 border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.quotes}</div>
                <div className="text-sm text-gray-400">Quotes Created</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gray-800 border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Tag className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.coupons}</div>
                <div className="text-sm text-gray-400">Coupons Created</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gray-800 border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.tasks}</div>
                <div className="text-sm text-gray-400">Tasks Completed</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="email_sent">Emails</SelectItem>
              <SelectItem value="quote_created">Quotes</SelectItem>
              <SelectItem value="coupon_created">Coupons</SelectItem>
              <SelectItem value="task_completed">Tasks</SelectItem>
              <SelectItem value="lead_contacted">Leads</SelectItem>
              <SelectItem value="function_deployed">Deployments</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity Feed */}
        <Card className="bg-gray-800 border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
          </div>
          <div className="divide-y divide-gray-700">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading activities...</div>
            ) : filteredActivities.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No activities found</div>
            ) : (
              filteredActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getActionColor(activity.action_type)}`}>
                      {getActionIcon(activity.action_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={getActionColor(activity.action_type)}>
                          {activity.action_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={activity.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-white">{activity.description}</p>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <span key={key} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 whitespace-nowrap">
                      {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
