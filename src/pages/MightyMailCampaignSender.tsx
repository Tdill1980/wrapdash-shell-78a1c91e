import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Send, Eye, Loader2, CheckCircle } from "lucide-react";

// Import the declaration email HTML
import declarationEmailHtml from "@/lib/email-templates/ink-edge-declaration.html?raw";

const SUBJECT_OPTIONS = [
  "We Went Quiet on Purpose. Here's Why.",
  "Why We Stopped Posting (and What We Built Instead)",
  "We Took a Step Back — This Is What's Coming",
  "Ink & Edge Is New. WPW Is Backing It."
];

const MightyMailCampaignSender = () => {
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[1]);
  const [previewText, setPreviewText] = useState("We weren't gone — we were building something worth your time.");
  const [campaignName, setCampaignName] = useState("Ink & Edge Declaration - ClubWPW");
  const [segmentId, setSegmentId] = useState("");
  const [listId, setListId] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendCampaign = async () => {
    if (!subject || !campaignName) {
      toast.error("Please fill in campaign name and subject line");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-klaviyo-campaign', {
        body: {
          campaignType: 'newsletter',
          name: campaignName,
          subject: subject,
          previewText: previewText,
          html: declarationEmailHtml,
          segmentId: segmentId || undefined,
          listId: listId || undefined,
        }
      });

      if (error) throw error;

      if (data.success) {
        setSent(true);
        toast.success(data.message || "Campaign sent successfully!");
      } else {
        throw new Error(data.error || "Failed to send campaign");
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error(error instanceof Error ? error.message : "Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                <span className="text-[#FF1493]">Ink & Edge</span> Declaration Campaign
              </h1>
              <p className="text-muted-foreground mt-1">Preview and send via Klaviyo API</p>
            </div>
            {sent && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Campaign Sent!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings Panel */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-[#FF1493]" />
                  Campaign Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Internal campaign name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject line" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_OPTIONS.map((option, idx) => (
                        <SelectItem key={idx} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previewText">Preview Text</Label>
                  <Textarea
                    id="previewText"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Text shown in inbox preview"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="segmentId">Klaviyo Segment ID (optional)</Label>
                  <Input
                    id="segmentId"
                    value={segmentId}
                    onChange={(e) => setSegmentId(e.target.value)}
                    placeholder="e.g., YpP4RM"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to require manual audience assignment in Klaviyo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listId">Klaviyo List ID (fallback)</Label>
                  <Input
                    id="listId"
                    value={listId}
                    onChange={(e) => setListId(e.target.value)}
                    placeholder="e.g., XyZ123"
                    className="font-mono"
                  />
                </div>

                <div className="pt-4 border-t border-border/50">
                  <Button
                    onClick={handleSendCampaign}
                    disabled={sending || sent}
                    className="w-full bg-gradient-to-r from-[#FF1493] to-[#FF69B4] hover:from-[#FF1493]/90 hover:to-[#FF69B4]/90"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending to Klaviyo...
                      </>
                    ) : sent ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Campaign Sent
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Campaign via Klaviyo
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email Preview */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-[#FFD700]" />
                  Email Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-[#0A0A0A] rounded-lg overflow-hidden border border-[#333]">
                  {/* Email Header Preview */}
                  <div className="bg-[#1a1a1a] p-3 border-b border-[#333]">
                    <p className="text-xs text-[#888] mb-1">From: WePrintWraps &lt;hello@weprintwraps.com&gt;</p>
                    <p className="text-sm font-medium text-white truncate">{subject}</p>
                    <p className="text-xs text-[#666] mt-1 truncate">{previewText}</p>
                  </div>
                  {/* Email Body Preview */}
                  <iframe
                    srcDoc={declarationEmailHtml}
                    className="w-full h-[600px] bg-[#0A0A0A]"
                    title="Email Preview"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MightyMailCampaignSender;
