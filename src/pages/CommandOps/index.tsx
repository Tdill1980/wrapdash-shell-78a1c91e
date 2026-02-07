import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Code,
  DollarSign,
  Headphones,
  Megaphone,
  Bot,
  Clock,
  Calendar,
  BookOpen,
} from "lucide-react";

interface WrenActivity {
  id: string;
  action_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  status: string;
}

interface WrenTask {
  id: string;
  category: 'dev' | 'sales' | 'csr' | 'marketing';
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  follow_up_date: string | null;
  created_at: string;
  completed_at: string | null;
}

interface DiaryEntry {
  id: string;
  entry_date: string;
  synopsis: string;
  dev_summary: string | null;
  sales_summary: string | null;
  csr_summary: string | null;
  marketing_summary: string | null;
  tasks_completed: number;
  emails_sent: number;
  quotes_created: number;
  highlights: string[];
  issues: string[];
  tomorrow_priorities: string[];
}

export default function CommandOpsPage() {
  const [activities, setActivities] = useState<WrenActivity[]>([]);
  const [tasks, setTasks] = useState<WrenTask[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchActivities(), fetchTasks(), fetchDiary()]);
    setLoading(false);
  };

  const fetchActivities = async () => {
    try {
      const { data } = await supabase
        .from('wren_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await supabase
        .from('wren_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      setTasks((data as WrenTask[]) || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchDiary = async () => {
    try {
      const { data } = await supabase
        .from('wren_diary')
        .select('*')
        .order('entry_date', { ascending: false })
        .limit(30);
      setDiaryEntries((data as DiaryEntry[]) || []);
    } catch (err) {
      console.error('Error fetching diary:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dev': return <Code className="w-4 h-4" />;
      case 'sales': return <DollarSign className="w-4 h-4" />;
      case 'csr': return <Headphones className="w-4 h-4" />;
      case 'marketing': return <Megaphone className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'dev': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'sales': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'csr': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'marketing': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'blocked': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email_sent': return <Mail className="w-4 h-4" />;
      case 'quote_created': return <FileText className="w-4 h-4" />;
      case 'coupon_created': return <Tag className="w-4 h-4" />;
      case 'task_completed': return <CheckCircle className="w-4 h-4" />;
      case 'function_deployed': return <Bot className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // Stats by category
  const taskStats = {
    dev: tasks.filter(t => t.category === 'dev'),
    sales: tasks.filter(t => t.category === 'sales'),
    csr: tasks.filter(t => t.category === 'csr'),
    marketing: tasks.filter(t => t.category === 'marketing'),
  };

  const activityStats = {
    emails: activities.filter(a => a.action_type === 'email_sent').length,
    quotes: activities.filter(a => a.action_type === 'quote_created').length,
    deploys: activities.filter(a => a.action_type === 'function_deployed').length,
    tasks: activities.filter(a => a.action_type === 'task_completed').length,
  };

  const filteredTasks = tasks.filter(t => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
              <p className="text-gray-400 text-sm">Wren Activity • Tasks • Diary</p>
            </div>
          </div>
          <Button onClick={fetchAll} variant="outline" className="border-gray-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gray-800 border-gray-700 border-l-4 border-l-purple-500">
            <div className="flex items-center gap-3">
              <Code className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">{taskStats.dev.filter(t => t.status !== 'completed').length}</div>
                <div className="text-sm text-gray-400">DEV Tasks</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gray-800 border-gray-700 border-l-4 border-l-green-500">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{taskStats.sales.filter(t => t.status !== 'completed').length}</div>
                <div className="text-sm text-gray-400">SALES Tasks</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gray-800 border-gray-700 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{taskStats.csr.filter(t => t.status !== 'completed').length}</div>
                <div className="text-sm text-gray-400">CSR Tasks</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gray-800 border-gray-700 border-l-4 border-l-orange-500">
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-white">{taskStats.marketing.filter(t => t.status !== 'completed').length}</div>
                <div className="text-sm text-gray-400">MARKETING Tasks</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="activity" className="data-[state=active]:bg-gray-700">
              <Activity className="w-4 h-4 mr-2" />
              Activity Log
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-gray-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="diary" className="data-[state=active]:bg-gray-700">
              <BookOpen className="w-4 h-4 mr-2" />
              Diary
            </TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="bg-gray-800 border-gray-700">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
                <div className="flex gap-2 text-sm">
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400">{activityStats.emails} emails</Badge>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400">{activityStats.quotes} quotes</Badge>
                  <Badge variant="outline" className="bg-orange-500/20 text-orange-400">{activityStats.deploys} deploys</Badge>
                </div>
              </div>
              <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-700/50">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-700 rounded-lg">
                        {getActionIcon(activity.action_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{activity.action_type.replace('_', ' ')}</Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <p className="text-white text-sm">{activity.description}</p>
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(activity.metadata).map(([key, value]) => (
                              <span key={key} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-gray-800 border-gray-700 text-white"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="dev">DEV</SelectItem>
                  <SelectItem value="sales">SALES</SelectItem>
                  <SelectItem value="csr">CSR</SelectItem>
                  <SelectItem value="marketing">MARKETING</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <div className="divide-y divide-gray-700">
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No tasks found</div>
                ) : (
                  filteredTasks.map((task) => (
                    <div key={task.id} className="p-4 hover:bg-gray-700/50">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getCategoryColor(task.category)}`}>
                          {getCategoryIcon(task.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getCategoryColor(task.category)}>{task.category.toUpperCase()}</Badge>
                            <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          </div>
                          <h3 className="text-white font-medium">{task.title}</h3>
                          {task.description && <p className="text-gray-400 text-sm mt-1">{task.description}</p>}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Created: {format(new Date(task.created_at), 'MMM d, yyyy')}
                            </span>
                            {task.due_date && (
                              <span className="flex items-center gap-1 text-orange-400">
                                <Clock className="w-3 h-3" />
                                Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                              </span>
                            )}
                            {task.follow_up_date && (
                              <span className="flex items-center gap-1 text-blue-400">
                                <RefreshCw className="w-3 h-3" />
                                Follow-up: {format(new Date(task.follow_up_date), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Diary Tab */}
          <TabsContent value="diary">
            <Card className="bg-gray-800 border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Wren's Diary</h2>
                <p className="text-sm text-gray-400">Nightly synopsis of what happened</p>
              </div>
              <div className="divide-y divide-gray-700">
                {diaryEntries.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No diary entries yet. First entry coming tonight at 11pm.</div>
                ) : (
                  diaryEntries.map((entry) => (
                    <div key={entry.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">
                          {format(new Date(entry.entry_date), 'EEEE, MMMM d, yyyy')}
                        </h3>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-400">{entry.emails_sent} emails</Badge>
                          <Badge variant="outline" className="bg-green-500/20 text-green-400">{entry.quotes_created} quotes</Badge>
                          <Badge variant="outline" className="bg-teal-500/20 text-teal-400">{entry.tasks_completed} tasks</Badge>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-4">{entry.synopsis}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {entry.dev_summary && (
                          <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/30">
                            <div className="flex items-center gap-2 text-purple-400 font-medium mb-1">
                              <Code className="w-4 h-4" /> DEV
                            </div>
                            <p className="text-gray-300">{entry.dev_summary}</p>
                          </div>
                        )}
                        {entry.sales_summary && (
                          <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/30">
                            <div className="flex items-center gap-2 text-green-400 font-medium mb-1">
                              <DollarSign className="w-4 h-4" /> SALES
                            </div>
                            <p className="text-gray-300">{entry.sales_summary}</p>
                          </div>
                        )}
                        {entry.csr_summary && (
                          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
                            <div className="flex items-center gap-2 text-blue-400 font-medium mb-1">
                              <Headphones className="w-4 h-4" /> CSR
                            </div>
                            <p className="text-gray-300">{entry.csr_summary}</p>
                          </div>
                        )}
                        {entry.marketing_summary && (
                          <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/30">
                            <div className="flex items-center gap-2 text-orange-400 font-medium mb-1">
                              <Megaphone className="w-4 h-4" /> MARKETING
                            </div>
                            <p className="text-gray-300">{entry.marketing_summary}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
