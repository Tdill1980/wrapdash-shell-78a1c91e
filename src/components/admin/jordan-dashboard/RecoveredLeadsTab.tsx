import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Instagram, Mail, Phone, Search, Download, CheckCircle, Clock, XCircle, AlertTriangle, UserPlus } from "lucide-react";
import { format } from "date-fns";

interface IGLead {
  conversation_id: string;
  ig_sender_name: string;
  message_content: string;
  message_date: string;
  extracted_email: string | null;
}

interface RecoveredLead {
  id: string;
  conversation_id: string;
  ig_sender_name: string;
  message_content: string;
  extracted_email: string | null;
  extracted_phone: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export function RecoveredLeadsTab() {
  const [rawLeads, setRawLeads] = useState<IGLead[]>([]);
  const [recoveredLeads, setRecoveredLeads] = useState<RecoveredLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<IGLead | null>(null);
  const [addingLead, setAddingLead] = useState(false);
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadNotes, setNewLeadNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch raw IG messages with potential emails
      const { data: rawData, error: rawError } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          content,
          sender_name,
          created_at,
          conversations!inner(channel)
        `)
        .eq('conversations.channel', 'instagram')
        .eq('direction', 'inbound')
        .order('created_at', { ascending: false })
        .limit(500);

      if (rawError) throw rawError;

      // Parse emails from content
      const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi;
      const processedLeads: IGLead[] = (rawData || []).map((msg: any) => {
        const emailMatch = msg.content?.match(emailRegex);
        return {
          conversation_id: msg.conversation_id,
          ig_sender_name: msg.sender_name || 'Unknown',
          message_content: msg.content || '',
          message_date: msg.created_at,
          extracted_email: emailMatch ? emailMatch[0] : null,
        };
      });

      setRawLeads(processedLeads);

      // Fetch already recovered leads
      const { data: recoveredData, error: recoveredError } = await supabase
        .from('recovered_instagram_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (recoveredError) throw recoveredError;
      setRecoveredLeads((recoveredData as RecoveredLead[]) || []);

    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToRecoveredLeads = async (lead: IGLead) => {
    setAddingLead(true);
    try {
      const { error } = await supabase
        .from('recovered_instagram_leads')
        .insert({
          conversation_id: lead.conversation_id,
          ig_sender_name: lead.ig_sender_name,
          message_content: lead.message_content.substring(0, 1000),
          extracted_email: newLeadEmail || lead.extracted_email,
          extracted_phone: newLeadPhone || null,
          notes: newLeadNotes || null,
          status: 'uncontacted',
        });

      if (error) throw error;

      toast({
        title: "Lead Added",
        description: "Lead has been added to recovery list",
      });

      setSelectedLead(null);
      setNewLeadEmail("");
      setNewLeadPhone("");
      setNewLeadNotes("");
      fetchData();
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: "Error",
        description: "Failed to add lead",
        variant: "destructive",
      });
    } finally {
      setAddingLead(false);
    }
  };

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('recovered_instagram_leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Lead marked as ${status}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['IG Username', 'Email', 'Phone', 'Message', 'Status', 'Notes', 'Date'];
    const rows = recoveredLeads.map(lead => [
      lead.ig_sender_name,
      lead.extracted_email || '',
      lead.extracted_phone || '',
      lead.message_content.replace(/"/g, '""').substring(0, 200),
      lead.status,
      lead.notes || '',
      format(new Date(lead.created_at), 'yyyy-MM-dd'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovered-ig-leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${recoveredLeads.length} leads to CSV`,
    });
  };

  // Filter leads with emails for high-intent extraction
  const leadsWithEmails = rawLeads.filter(lead => lead.extracted_email);
  const highIntentLeads = rawLeads.filter(lead => 
    lead.message_content.toLowerCase().match(/price|quote|wrap|fleet|cost|how much/i)
  );

  // Filter recovered leads
  const filteredRecovered = recoveredLeads.filter(lead => {
    const matchesSearch = 
      lead.ig_sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.extracted_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.message_content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'contacted':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Contacted</Badge>;
      case 'no_response':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />No Response</Badge>;
      case 'converted':
        return <Badge className="bg-primary"><CheckCircle className="h-3 w-3 mr-1" />Converted</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Invalid</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Uncontacted</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total IG Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rawLeads.length}</div>
            <p className="text-xs text-muted-foreground">From frozen IG DMs</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              With Emails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{leadsWithEmails.length}</div>
            <p className="text-xs text-muted-foreground">Direct contact available</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              High Intent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{highIntentLeads.length}</div>
            <p className="text-xs text-muted-foreground">Price/quote mentions</p>
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Recovered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{recoveredLeads.length}</div>
            <p className="text-xs text-muted-foreground">Added to follow-up</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads with Emails Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-pink-500" />
                IG DMs with Extractable Emails
              </CardTitle>
              <CardDescription>
                These messages contain email addresses - add them to your recovery list
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IG User</TableHead>
                <TableHead>Email Found</TableHead>
                <TableHead>Message Preview</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsWithEmails.slice(0, 20).map((lead, idx) => {
                const alreadyAdded = recoveredLeads.some(r => r.conversation_id === lead.conversation_id);
                return (
                  <TableRow key={`${lead.conversation_id}-${idx}`}>
                    <TableCell className="font-medium">{lead.ig_sender_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        <Mail className="h-3 w-3 mr-1" />
                        {lead.extracted_email}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {lead.message_content.substring(0, 100)}...
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.message_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {alreadyAdded ? (
                        <Badge variant="secondary">Already Added</Badge>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => {
                              setSelectedLead(lead);
                              setNewLeadEmail(lead.extracted_email || "");
                            }}>
                              <UserPlus className="h-3 w-3 mr-1" />
                              Add Lead
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add to Recovery List</DialogTitle>
                              <DialogDescription>
                                Confirm details before adding this lead for follow-up
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">IG Username</label>
                                <Input value={lead.ig_sender_name} disabled />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input 
                                  value={newLeadEmail} 
                                  onChange={(e) => setNewLeadEmail(e.target.value)}
                                  placeholder="Enter or confirm email"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Phone (optional)</label>
                                <Input 
                                  value={newLeadPhone}
                                  onChange={(e) => setNewLeadPhone(e.target.value)}
                                  placeholder="If mentioned in message"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Notes</label>
                                <Textarea 
                                  value={newLeadNotes}
                                  onChange={(e) => setNewLeadNotes(e.target.value)}
                                  placeholder="Any context for follow-up..."
                                />
                              </div>
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Original Message:</p>
                                <p className="text-sm">{lead.message_content.substring(0, 300)}...</p>
                              </div>
                              <Button 
                                className="w-full" 
                                onClick={() => addToRecoveredLeads(lead)}
                                disabled={addingLead}
                              >
                                {addingLead ? 'Adding...' : 'Add to Recovery List'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {leadsWithEmails.length > 20 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing 20 of {leadsWithEmails.length} leads with emails
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recovered Leads Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Recovered Leads Pipeline</CardTitle>
              <CardDescription>
                Track follow-up status for recovered Instagram leads
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="uncontacted">Uncontacted</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="no_response">No Response</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportToCSV} disabled={recoveredLeads.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecovered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Instagram className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No recovered leads yet</p>
              <p className="text-sm">Add leads from the table above to start tracking follow-ups</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IG User</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecovered.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.ig_sender_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.extracted_email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {lead.extracted_email}
                          </div>
                        )}
                        {lead.extracted_phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {lead.extracted_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                      {lead.notes || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Select value={lead.status} onValueChange={(status) => updateLeadStatus(lead.id, status)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uncontacted">Uncontacted</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="no_response">No Response</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="invalid">Invalid</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Follow-up Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Suggested Follow-up Email
          </CardTitle>
          <CardDescription>
            Use this template when reaching out to recovered leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <p><strong>Subject:</strong> Following up on your wrap inquiry</p>
            <br />
            <p>Hey [Name],</p>
            <br />
            <p>You reached out to WePrintWraps on Instagram about wrap pricing a while back and we wanted to follow up directly.</p>
            <br />
            <p>We're currently running our best pricing of the year on printed wraps - just $5.27/sqft for Avery and 3M materials!</p>
            <br />
            <p>Happy to help if you're still looking. Just reply to this email or call us at [phone].</p>
            <br />
            <p>Best,<br />The WePrintWraps Team</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
