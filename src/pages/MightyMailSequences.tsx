import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Users, 
  Clock, 
  TrendingUp, 
  Play, 
  Pause,
  Eye,
  Plus,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

interface EmailSequence {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  send_delay_days: number | null;
  emails: unknown;
  created_at: string;
  enrollment_count?: number;
}

interface EnrollmentStats {
  sequence_id: string;
  total: number;
  active: number;
  completed: number;
}

export default function MightyMailSequences() {
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [stats, setStats] = useState<Record<string, EnrollmentStats>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    // Load sequences
    const { data: seqData, error: seqError } = await supabase
      .from('email_sequences')
      .select('*')
      .order('created_at', { ascending: false });

    if (seqError) {
      console.error('Error loading sequences:', seqError);
      toast({
        title: "Error",
        description: "Failed to load sequences",
        variant: "destructive"
      });
    } else {
      setSequences((seqData || []) as EmailSequence[]);
    }

    // Load enrollment stats
    const { data: enrollData } = await supabase
      .from('email_sequence_enrollments')
      .select('sequence_id, is_active, completed_at');

    if (enrollData) {
      const statsBySequence: Record<string, EnrollmentStats> = {};
      
      enrollData.forEach(e => {
        if (!statsBySequence[e.sequence_id]) {
          statsBySequence[e.sequence_id] = {
            sequence_id: e.sequence_id,
            total: 0,
            active: 0,
            completed: 0
          };
        }
        statsBySequence[e.sequence_id].total++;
        if (e.is_active) statsBySequence[e.sequence_id].active++;
        if (e.completed_at) statsBySequence[e.sequence_id].completed++;
      });
      
      setStats(statsBySequence);
    }

    setLoading(false);
  }

  async function toggleSequence(id: string, isActive: boolean) {
    const { error } = await supabase
      .from('email_sequences')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update sequence",
        variant: "destructive"
      });
    } else {
      toast({
        title: isActive ? "Sequence Activated" : "Sequence Paused",
        description: `Email sequence has been ${isActive ? 'activated' : 'paused'}.`
      });
      loadData();
    }
  }

  // Calculate totals
  const totalEnrollments = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
  const activeEnrollments = Object.values(stats).reduce((sum, s) => sum + s.active, 0);
  const completedEnrollments = Object.values(stats).reduce((sum, s) => sum + s.completed, 0);

  return (
    <MainLayout userName="Admin">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link to="/admin/mightymail" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft size={20} />
              </Link>
              <h2 className="text-3xl font-bold tracking-tight">
                <span className="text-white">Mighty</span>
                <span className="bg-gradient-to-r from-[#00AFFF] via-[#008CFF] to-[#4EEAFF] bg-clip-text text-transparent">Mail™</span>
                <span className="text-white"> Sequences</span>
              </h2>
            </div>
            <p className="text-muted-foreground">
              Automated email sequences for leads from chat, phone, and quotes.
            </p>
          </div>
          <Button className="bg-gradient-to-r from-[#00AFFF] to-[#4EEAFF] text-white">
            <Plus size={16} className="mr-2" />
            New Sequence
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Sequences</p>
                  <p className="text-2xl font-bold text-foreground">
                    {sequences.filter(s => s.is_active).length}
                  </p>
                </div>
                <div className="p-3 bg-[#00AFFF]/20 rounded-lg">
                  <Play className="h-6 w-6 text-[#00AFFF]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Enrolled</p>
                  <p className="text-2xl font-bold text-foreground">{totalEnrollments}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Leads</p>
                  <p className="text-2xl font-bold text-foreground">{activeEnrollments}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-foreground">{completedEnrollments}</p>
                </div>
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <Mail className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wiring Diagram */}
        <Card className="bg-gradient-to-r from-[#16161E] to-[#1a1a24] border-[rgba(255,255,255,0.06)]">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Lead Source Wiring</CardTitle>
            <CardDescription>How contacts auto-enroll in sequences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <div className="text-cyan-400 font-semibold mb-1">Website Chat</div>
                <div className="text-xs text-muted-foreground">→ Website Lead Nurture</div>
              </div>
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="text-amber-400 font-semibold mb-1">Phone Calls</div>
                <div className="text-xs text-muted-foreground">→ Phone Lead Nurture</div>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="text-green-400 font-semibold mb-1">Quotes</div>
                <div className="text-xs text-muted-foreground">→ Quote Follow-up</div>
              </div>
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="text-purple-400 font-semibold mb-1">All Sources</div>
                <div className="text-xs text-muted-foreground">→ MightyCustomer CRM</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sequences List */}
        <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)]">
          <CardHeader>
            <CardTitle className="text-foreground">Email Sequences</CardTitle>
            <CardDescription>
              {sequences.length} sequences configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : sequences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sequences configured. Create your first sequence to start automating.
              </div>
            ) : (
              <div className="space-y-4">
                {sequences.map((seq) => {
                  const seqStats = stats[seq.id] || { total: 0, active: 0, completed: 0 };
                  const emailCount = Array.isArray(seq.emails) ? seq.emails.length : 0;
                  
                  return (
                    <div
                      key={seq.id}
                      className="p-4 bg-[#101016] rounded-lg border border-[rgba(255,255,255,0.06)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{seq.name}</h3>
                            <Badge 
                              variant={seq.is_active ? "default" : "secondary"}
                              className={seq.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                            >
                              {seq.is_active ? 'Active' : 'Paused'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {seq.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail size={12} />
                              {emailCount} email{emailCount !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {seq.send_delay_days || 1} day delay
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {seqStats.active} active / {seqStats.total} total
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button size="sm" variant="outline">
                            <Eye size={14} className="mr-1" />
                            Preview
                          </Button>
                          <Switch
                            checked={seq.is_active}
                            onCheckedChange={(checked) => toggleSequence(seq.id, checked)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
