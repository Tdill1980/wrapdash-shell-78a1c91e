import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

export default function SequenceManager() {
  const [sequences, setSequences] = useState<any[]>([]);
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
        <div className="space-y-4">
          {sequences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sequences created yet. Click "New Sequence" to get started.
            </div>
          ) : (
            sequences.map((seq) => (
              <div
                key={seq.id}
                className="p-4 bg-[#101016] rounded-lg border border-[rgba(255,255,255,0.06)] flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-foreground">{seq.name}</h3>
                  <p className="text-sm text-muted-foreground">{seq.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Delay: {seq.send_delay_days} days
                  </p>
                </div>
                <Switch
                  checked={seq.is_active}
                  onCheckedChange={(checked) => toggleSequence(seq.id, checked)}
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
