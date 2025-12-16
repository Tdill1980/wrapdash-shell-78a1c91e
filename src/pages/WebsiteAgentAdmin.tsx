import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Globe, MessageSquare, Zap, Shield, ExternalLink, FileText, TestTubeDiagonal } from "lucide-react";
import { toast } from "sonner";
import { ChatTranscriptViewer } from "@/components/admin/ChatTranscriptViewer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function WebsiteAgentAdmin() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const embedCode = useMemo(
    () =>
      `<script defer src="https://wrapcommandai.com/embed/chat-widget.js"
        data-org="wpw"
        data-agent="wpw_ai_team"
        data-mode="test"></script>`,
    []
  );

  const liveEmbedCode = useMemo(
    () =>
      `<script defer src="https://wrapcommandai.com/embed/chat-widget.js"
        data-org="wpw"
        data-agent="wpw_ai_team"
        data-mode="live"></script>`,
    []
  );

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Embed code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const runSmokeTest = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("website-chat", {
        body: {
          org: "wpw",
          agent: "wpw_ai_team",
          mode: "test",
          session_id: `admin_smoke_${Date.now()}`,
          message_text: "Quick test: need a quote for a 2020 Ford Transit full wrap. Email: test@example.com",
          page_url: "https://admin.test/website-agent",
          referrer: "",
        },
      });

      if (error) throw error;

      const price = data?.auto_quote?.formattedPrice;
      toast.success(price ? `Website chat OK — auto quote: ${price}` : "Website chat OK — reply generated");

      // Jump straight to inbox so you can see the new conversation instantly
      navigate("/mightychat");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Smoke test failed");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">
            Website <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Chat Agent</span>
          </h1>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
            TEST MODE
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Embed an AI-powered chat widget on your website to capture leads and answer customer questions 24/7.
        </p>
      </div>

      <Tabs defaultValue="transcripts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="transcripts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Transcripts
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="embed" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Embed Code
          </TabsTrigger>
        </TabsList>

        {/* Transcripts Tab */}
        <TabsContent value="transcripts">
          <ChatTranscriptViewer />
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config">
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <MessageSquare className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">AI-Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Uses TradeDNA brand voice to answer questions in your shop's tone
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <Zap className="h-8 w-8 text-yellow-500 mb-2" />
                <CardTitle className="text-lg">Lead Capture</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Auto-detects wrap intent and creates hot lead alerts in MightyChat
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <Shield className="h-8 w-8 text-green-500 mb-2" />
                <CardTitle className="text-lg">Test Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Safe testing - no emails sent to customers, only internal notifications
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Installation Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">WordPress / WooCommerce</h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Go to Appearance → Theme Editor</li>
                    <li>Open footer.php</li>
                    <li>Paste code before &lt;/body&gt;</li>
                    <li>Save changes</li>
                  </ol>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Custom HTML Site</h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Open your HTML file</li>
                    <li>Find the &lt;/body&gt; tag</li>
                    <li>Paste code before it</li>
                    <li>Upload and refresh</li>
                  </ol>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
                <Button
                  variant="default"
                  className="sm:w-auto"
                  onClick={runSmokeTest}
                  disabled={isTesting}
                >
                  <TestTubeDiagonal className="h-4 w-4" />
                  {isTesting ? "Running test…" : "Run Smoke Test"}
                </Button>

                <Button variant="outline" asChild>
                  <a href="/mightychat" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    View MightyChat
                  </a>
                </Button>

                <Button variant="outline" asChild>
                  <a
                    href="https://weprintwraps.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Test on WPW
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Embed Code Tab */}
        <TabsContent value="embed">
          <Tabs defaultValue="test">
            <TabsList className="grid w-full grid-cols-2 max-w-md mb-4">
              <TabsTrigger value="test">Test Mode</TabsTrigger>
              <TabsTrigger value="live">Live Mode</TabsTrigger>
            </TabsList>

            <TabsContent value="test">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Test Mode Embed Code
                  </CardTitle>
                  <CardDescription>
                    Use this code for testing. Messages will appear in MightyChat but no customer emails will be sent.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
                      <code>{embedCode}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(embedCode)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <h4 className="font-semibold text-yellow-500 mb-2">⚠️ Test Mode Active</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Messages appear in MightyChat with "website" channel badge</li>
                      <li>• Internal notifications sent to hello@weprintwraps.com</li>
                      <li>• Hot leads create tasks for review</li>
                      <li>• Widget shows "TEST" badge</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="live">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Live Mode Embed Code
                  </CardTitle>
                  <CardDescription>
                    Production code for your live website. Full functionality enabled.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm border border-border">
                      <code>{liveEmbedCode}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(liveEmbedCode)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <h4 className="font-semibold text-green-500 mb-2">✓ Live Mode Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Full AI responses in TradeDNA brand voice</li>
                      <li>• Automatic lead capture and CRM integration</li>
                      <li>• MightyMail follow-up sequences</li>
                      <li>• No test badge shown to visitors</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}