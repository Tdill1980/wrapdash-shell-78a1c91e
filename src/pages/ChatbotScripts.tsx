import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, MessageSquare, Sparkles, Settings, Play, Copy, Download, RefreshCw } from "lucide-react";
import { useTradeDNA } from "@/hooks/useTradeDNA";
import { useToast } from "@/hooks/use-toast";

const ChatbotScripts = () => {
  const { tradeDNA, isLoading: tradeDNALoading } = useTradeDNA();
  const { toast } = useToast();
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Default chatbot scripts based on TradeDNA
  const defaultScripts = {
    welcome: tradeDNA?.tradedna_profile?.brand_voice_summary 
      ? `Hey! ${tradeDNA.business_name || 'We'} here. Want a quote or wrap idea? I've got you 👇`
      : "Hey! Want a quote or wrap idea? I've got you 👇",
    vehicle_collection: "What year/make/model are we wrapping?",
    wrap_intent: "What kind of wrap are you looking for?\n• Color Change\n• Printed Wrap\n• Commercial Fleet\n• Custom Design",
    budget_capture: "So I can recommend the best options, what's your budget range?",
    photo_request: "Upload a few pictures of your vehicle so I can give you an accurate quote.",
    quote_trigger: "Perfect! I'm preparing your custom quote now. You'll have it in your inbox shortly.",
    follow_up: "Still want that wrap quote? It only takes 30 seconds to get started.",
    escalation: "Let me connect you with a specialist who can help with that right away.",
    schedule_cta: "Want to move forward? I can prep your design today."
  };

  const [scripts, setScripts] = useState(defaultScripts);

  const handleTestChat = async () => {
    if (!testMessage.trim()) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI response based on intent detection
      const lowerMessage = testMessage.toLowerCase();
      let response = scripts.welcome;
      
      if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('quote') || lowerMessage.includes('how much')) {
        response = scripts.vehicle_collection;
      } else if (lowerMessage.includes('design') || lowerMessage.includes('color') || lowerMessage.includes('wrap')) {
        response = scripts.wrap_intent;
      } else if (lowerMessage.includes('order') || lowerMessage.includes('status') || lowerMessage.includes('tracking')) {
        response = "What's your order number? I'll look that up for you.";
      }
      
      setTestResponse(response);
      toast({
        title: "Response Generated",
        description: "AI processed the message using TradeDNA voice"
      });
    } catch (error) {
      console.error('Test chat error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    toast({
      title: "Copied",
      description: "Script copied to clipboard"
    });
  };

  const handleExportScripts = () => {
    const exportData = {
      workspace: tradeDNA?.business_name || 'Default',
      scripts,
      tradeDNA: tradeDNA?.tradedna_profile,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot-scripts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Chatbot scripts exported as JSON"
    });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C]">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-foreground">TradeDNA</span>
                <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent"> Chatbot</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-powered chatbot scripts using your brand voice
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportScripts}>
              <Download className="w-4 h-4 mr-2" />
              Export Scripts
            </Button>
          </div>
        </div>

        {/* TradeDNA Status */}
        {tradeDNA?.tradedna_profile ? (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-600">TradeDNA Active: {tradeDNA.business_name}</p>
              <p className="text-sm text-muted-foreground">
                    Tone: {typeof tradeDNA.tradedna_profile.tone === 'string' ? tradeDNA.tradedna_profile.tone : 'Custom'} | Persona: {tradeDNA.tradedna_profile.persona || 'Default'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-yellow-600">TradeDNA Not Configured</p>
                  <p className="text-sm text-muted-foreground">
                    Complete the TradeDNA wizard to personalize chatbot responses
                  </p>
                </div>
                <Button size="sm" variant="outline" className="ml-auto" asChild>
                  <a href="/tradedna">Configure TradeDNA</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scripts Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chatbot Flow Scripts
              </CardTitle>
              <CardDescription>
                Customize the AI responses for each conversation stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="welcome" className="space-y-4">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="welcome">Welcome</TabsTrigger>
                  <TabsTrigger value="collection">Collection</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="welcome" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Welcome Message</Label>
                    <Textarea
                      value={scripts.welcome}
                      onChange={(e) => setScripts({ ...scripts, welcome: e.target.value })}
                      placeholder="Initial greeting message..."
                      rows={3}
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleCopyScript(scripts.welcome)}>
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up Nudge</Label>
                    <Textarea
                      value={scripts.follow_up}
                      onChange={(e) => setScripts({ ...scripts, follow_up: e.target.value })}
                      placeholder="Message when customer goes quiet..."
                      rows={2}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="collection" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Vehicle Collection</Label>
                    <Textarea
                      value={scripts.vehicle_collection}
                      onChange={(e) => setScripts({ ...scripts, vehicle_collection: e.target.value })}
                      placeholder="Ask for vehicle info..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Wrap Type Menu</Label>
                    <Textarea
                      value={scripts.wrap_intent}
                      onChange={(e) => setScripts({ ...scripts, wrap_intent: e.target.value })}
                      placeholder="Wrap type options..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Budget Capture</Label>
                    <Textarea
                      value={scripts.budget_capture}
                      onChange={(e) => setScripts({ ...scripts, budget_capture: e.target.value })}
                      placeholder="Ask for budget range..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Photo Request</Label>
                    <Textarea
                      value={scripts.photo_request}
                      onChange={(e) => setScripts({ ...scripts, photo_request: e.target.value })}
                      placeholder="Request vehicle photos..."
                      rows={2}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quote Ready</Label>
                    <Textarea
                      value={scripts.quote_trigger}
                      onChange={(e) => setScripts({ ...scripts, quote_trigger: e.target.value })}
                      placeholder="Quote creation confirmation..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Human Escalation</Label>
                    <Textarea
                      value={scripts.escalation}
                      onChange={(e) => setScripts({ ...scripts, escalation: e.target.value })}
                      placeholder="Handoff to human..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Schedule CTA</Label>
                    <Textarea
                      value={scripts.schedule_cta}
                      onChange={(e) => setScripts({ ...scripts, schedule_cta: e.target.value })}
                      placeholder="Call to action..."
                      rows={2}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Test Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Test Conversation
              </CardTitle>
              <CardDescription>
                Preview how the chatbot responds to messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 min-h-[300px] bg-muted/30 space-y-3">
                {/* AI Welcome */}
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#405DE6] to-[#E1306C] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-background border rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm">{scripts.welcome}</p>
                  </div>
                </div>

                {/* User Message */}
                {testMessage && (
                  <div className="flex gap-2 justify-end">
                    <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">{testMessage}</p>
                    </div>
                  </div>
                )}

                {/* AI Response */}
                {testResponse && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#405DE6] to-[#E1306C] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-background border rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm whitespace-pre-line">{testResponse}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a test message..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestChat()}
                />
                <Button onClick={handleTestChat} disabled={isGenerating}>
                  {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send'}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch id="auto-respond" defaultChecked />
                  <Label htmlFor="auto-respond" className="text-sm">Auto-respond enabled</Label>
                </div>
                <Badge variant="outline">Using TradeDNA Voice</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Intent Triggers */}
        <Card>
          <CardHeader>
            <CardTitle>Intent Detection Triggers</CardTitle>
            <CardDescription>
              Keywords and phrases that trigger specific chatbot flows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quote Intent</Label>
                <div className="flex flex-wrap gap-1">
                  {['how much', 'price', 'quote', 'cost', 'estimate'].map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">{keyword}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Design Intent</Label>
                <div className="flex flex-wrap gap-1">
                  {['design', 'render', 'preview', 'mockup', 'color'].map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">{keyword}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Support Intent</Label>
                <div className="flex flex-wrap gap-1">
                  {['status', 'order', 'tracking', 'where is', 'help'].map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">{keyword}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Escalation Triggers</Label>
                <div className="flex flex-wrap gap-1">
                  {['human', 'person', 'manager', 'speak to', 'call me'].map((keyword) => (
                    <Badge key={keyword} variant="destructive" className="text-xs">{keyword}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ChatbotScripts;