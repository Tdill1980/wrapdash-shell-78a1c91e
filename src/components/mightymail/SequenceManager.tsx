import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { Plus, Send } from "lucide-react";

export default function SequenceManager() {
  const [sequences, setSequences] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState("");
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
      const { error } = await lovableFunctions.functions.invoke('send-mightymail-test', {
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

  return (
    <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Email Sequences</CardTitle>
            <CardDescription>
              Manage automated email campaigns and customer follow-ups.
            </CardDescription>
          </div>
          <Button className="bg-gradient-to-r from-[#00AFFF] to-[#4EEAFF] text-white">
            <Plus size={16} className="mr-2" />
            New Sequence
          </Button>
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
  );
}
