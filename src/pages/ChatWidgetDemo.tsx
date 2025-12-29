import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { WebsiteChatWidget } from "@/components/chat/WebsiteChatWidget";

export default function ChatWidgetDemo() {
  const [copied, setCopied] = useState(false);

  const embedCode = `<script defer src="https://wrapcommandai.com/embed/chat-widget.js"
  data-org="wpw"
  data-agent="wpw_ai_team"
  data-mode="live"></script>`;

  const copyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success("Embed code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/website-agent">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Chat Widget Preview</h1>
              <p className="text-sm text-muted-foreground">This is exactly what customers see on your site</p>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">LIVE PREVIEW</Badge>
        </div>
      </div>

      {/* Fake website background */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="p-6 bg-card/30 border-dashed mb-6">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">👆 Your website content appears here</p>
            <p className="text-sm">The chat widget floats in the bottom-right corner on every page</p>
          </div>
        </Card>

        {/* Embed code card */}
        <Card className="p-6 mb-8">
          <h2 className="font-semibold mb-3">Copy this code into your WordPress footer.php (before &lt;/body&gt;)</h2>
          <div className="relative">
            <pre className="bg-muted/50 p-4 rounded-lg text-sm border border-border overflow-x-auto">
              <code>{embedCode}</code>
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={copyCode}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
      </div>

      {/* Use the WebsiteChatWidget component with quick actions */}
      <WebsiteChatWidget />
    </div>
  );
}
