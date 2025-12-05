import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Send, Sparkles, Loader2, Calendar, Clock } from "lucide-react";

interface FollowupEmail {
  day: number;
  subject: string;
  previewText: string;
  bodyHtml: string;
  urgencyLevel: 'friendly' | 'helpful' | 'urgent' | 'final';
}

export default function SequenceManager() {
  const [sequences, setSequences] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState("");
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmails, setGeneratedEmails] = useState<FollowupEmail[]>([]);
  const [aiForm, setAiForm] = useState({
    customerName: '',
    quoteNumber: '',
    vehicleInfo: '',
    productName: '',
    totalPrice: '',
    tone: 'installer' as 'installer' | 'luxury' | 'hype'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSequences();
  }, []);

  async function loadSequences() {
    const { data } = await supabase
      .from("email_sequences")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setSequences(data);
    }
  }

  async function toggleSequence(id: string, isActive: boolean) {
    await supabase
      .from("email_sequences")
      .update({ is_active: isActive })
      .eq("id", id);

    toast({
      title: isActive ? "Sequence Activated" : "Sequence Paused",
      description: `Email sequence has been ${isActive ? "activated" : "paused"}.`,
    });

    loadSequences();
  }

  async function sendTestEmail(sequence: any) {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-mightymail-test', {
        body: {
          testEmail: testEmail,
          campaignName: sequence.name,
          campaignEvent: sequence.name.toLowerCase().replace(/ /g, '_'),
        },
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `Test sent to ${testEmail} via Resend`,
      });
    } catch (error) {
      console.error('Error sending test:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    }
  }

  async function generateAIFollowups() {
    if (!aiForm.customerName || !aiForm.quoteNumber) {
      toast({
        title: "Missing Info",
        description: "Please enter customer name and quote number",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedEmails([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-followup-sequence', {
        body: {
          customerName: aiForm.customerName,
          customerEmail: testEmail || 'customer@example.com',
          quoteNumber: aiForm.quoteNumber,
          vehicleInfo: aiForm.vehicleInfo || undefined,
          productName: aiForm.productName || undefined,
          totalPrice: aiForm.totalPrice ? parseFloat(aiForm.totalPrice) : undefined,
          tone: aiForm.tone,
        },
      });

      if (error) throw error;

      if (data?.emails) {
        setGeneratedEmails(data.emails);
        toast({
          title: "Sequence Generated",
          description: `Created ${data.emails.length} follow-up emails`,
        });
      }
    } catch (error) {
      console.error('Error generating followups:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate follow-up sequence",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveSequence() {
    if (generatedEmails.length === 0) return;

    try {
      const { error } = await supabase
        .from('email_sequences')
        .insert([{
          name: `Follow-up: ${aiForm.customerName} - ${aiForm.quoteNumber}`,
          description: `AI-generated follow-up sequence for ${aiForm.vehicleInfo || 'vehicle wrap'} quote`,
          emails: JSON.parse(JSON.stringify(generatedEmails)),
          writing_tone: aiForm.tone,
          is_active: false,
        }]);

      if (error) throw error;

      toast({
        title: "Sequence Saved",
        description: "Follow-up sequence saved successfully",
      });

      setShowAIModal(false);
      setGeneratedEmails([]);
      setAiForm({
        customerName: '',
        quoteNumber: '',
        vehicleInfo: '',
        productName: '',
        totalPrice: '',
        tone: 'installer'
      });
      loadSequences();
    } catch (error) {
      console.error('Error saving sequence:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save sequence",
        variant: "destructive",
      });
    }
  }

  const urgencyColors = {
    friendly: 'bg-green-500/20 text-green-400 border-green-500/30',
    helpful: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    urgent: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    final: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <>
      {/* AI Generation Modal */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#16161E] border-[rgba(255,255,255,0.06)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Follow-up Sequence Generator
            </DialogTitle>
            <DialogDescription>
              Generate 4 unique follow-up emails with escalating urgency (Day 1, 3, 7, 14)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer Name *</Label>
                <Input
                  value={aiForm.customerName}
                  onChange={(e) => setAiForm({ ...aiForm, customerName: e.target.value })}
                  placeholder="John Smith"
                  className="bg-background"
                />
              </div>
              <div>
                <Label>Quote Number *</Label>
                <Input
                  value={aiForm.quoteNumber}
                  onChange={(e) => setAiForm({ ...aiForm, quoteNumber: e.target.value })}
                  placeholder="WPW-Q001234"
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vehicle Info</Label>
                <Input
                  value={aiForm.vehicleInfo}
                  onChange={(e) => setAiForm({ ...aiForm, vehicleInfo: e.target.value })}
                  placeholder="2024 Ford F-150"
                  className="bg-background"
                />
              </div>
              <div>
                <Label>Product</Label>
                <Input
                  value={aiForm.productName}
                  onChange={(e) => setAiForm({ ...aiForm, productName: e.target.value })}
                  placeholder="Full Color Change Wrap"
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quote Total ($)</Label>
                <Input
                  type="number"
                  value={aiForm.totalPrice}
                  onChange={(e) => setAiForm({ ...aiForm, totalPrice: e.target.value })}
                  placeholder="3500"
                  className="bg-background"
                />
              </div>
              <div>
                <Label>Tone</Label>
                <Select value={aiForm.tone} onValueChange={(v: any) => setAiForm({ ...aiForm, tone: v })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installer">Installer (Professional)</SelectItem>
                    <SelectItem value="luxury">Luxury (Premium)</SelectItem>
                    <SelectItem value="hype">Hype (Energetic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={generateAIFollowups}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Sequence...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Follow-up Sequence
                </>
              )}
            </Button>

            {/* Generated Emails Preview */}
            {generatedEmails.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Generated Follow-up Emails
                </h3>
                
                {generatedEmails.map((email, index) => (
                  <div
                    key={index}
                    className="p-4 bg-[#101016] rounded-lg border border-[rgba(255,255,255,0.06)]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Day {email.day}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${urgencyColors[email.urgencyLevel]}`}>
                        {email.urgencyLevel}
                      </span>
                    </div>
                    <h4 className="font-medium text-foreground mb-1">{email.subject}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{email.previewText}</p>
                    <div 
                      className="text-sm text-muted-foreground bg-background/50 p-3 rounded max-h-32 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                    />
                  </div>
                ))}

                <Button
                  onClick={saveSequence}
                  className="w-full bg-gradient-to-r from-[#00AFFF] to-[#4EEAFF] text-white"
                >
                  Save Sequence
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Email Sequences</CardTitle>
            <CardDescription>
              Manage automated email campaigns and customer follow-ups.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAIModal(true)}
              className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] text-white"
            >
              <Sparkles size={16} className="mr-2" />
              AI Generate
            </Button>
            <Button className="bg-gradient-to-r from-[#00AFFF] to-[#4EEAFF] text-white">
              <Plus size={16} className="mr-2" />
              New Sequence
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-[#101016] rounded-lg border border-[rgba(255,255,255,0.06)]">
          <Label htmlFor="test-email" className="text-sm font-medium mb-2 block">Test Email Address</Label>
          <div className="flex gap-2">
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="bg-background flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Enter an email to receive test campaigns via Resend
          </p>
        </div>

        <div className="space-y-4">
          {sequences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sequences created yet. Click "New Sequence" to get started.
            </div>
          ) : (
            sequences.map((seq) => (
              <div
                key={seq.id}
                className="p-4 bg-[#101016] rounded-lg border border-[rgba(255,255,255,0.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{seq.name}</h3>
                    <p className="text-sm text-muted-foreground">{seq.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Delay: {seq.send_delay_days} days
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendTestEmail(seq)}
                      className="bg-gradient-to-r from-[#00AFFF] to-[#4EEAFF] text-white border-none"
                    >
                      <Send size={14} className="mr-1" />
                      Test
                    </Button>
                    <Switch
                      checked={seq.is_active}
                      onCheckedChange={(checked) => toggleSequence(seq.id, checked)}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
}
