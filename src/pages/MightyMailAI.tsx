import { useState } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, Mail, Plus, Trash2, Clock, 
  ArrowRight, Eye, Send, Loader2, Zap, TrendingUp,
  BarChart3, MousePointerClick, Users, CheckCircle2,
  Search
} from 'lucide-react';
import { useEmailFlows, EmailFlow, EmailFlowStep } from '@/hooks/useEmailFlows';
import { cn } from '@/lib/utils';

const FLOW_TYPES = [
  { value: 'winback', label: '7-Day Winback', description: 'Re-engage inactive customers' },
  { value: 'nurture', label: 'Lead Nurture', description: 'Welcome new leads' },
  { value: 'abandoned_cart', label: 'Abandoned Cart', description: 'Recover lost sales' },
  { value: 'quote_followup', label: 'Quote Follow-Up', description: 'Convert open quotes' },
  { value: 'commercial', label: 'Commercial Funnel', description: 'Target businesses' },
  { value: 'upsell', label: 'Post-Purchase Upsell', description: 'Cross-sell products' },
];

const BRANDS = [
  { value: 'wpw', label: 'WePrintWraps', color: 'from-blue-500 to-purple-500' },
  { value: 'wraptv', label: 'WrapTV', color: 'from-red-500 to-orange-500' },
  { value: 'inkandedge', label: 'Ink & Edge', color: 'from-emerald-500 to-cyan-500' },
];

function FlowCard({ flow, onSelect, isSelected }: { flow: EmailFlow; onSelect: () => void; isSelected: boolean }) {
  const { updateFlow } = useEmailFlows();
  const brand = BRANDS.find(b => b.value === flow.brand);
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 group",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        "hover:-translate-y-0.5",
        isSelected && "border-primary ring-1 ring-primary/30 bg-primary/5",
        flow.is_active && "border-green-500/30"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base group-hover:text-primary transition-colors">{flow.name}</CardTitle>
          <Switch
            checked={flow.is_active}
            onClick={(e) => e.stopPropagation()}
            onCheckedChange={(checked) => updateFlow.mutate({ id: flow.id, is_active: checked })}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
        <CardDescription className="text-xs line-clamp-1">{flow.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className="text-[10px]">{flow.flow_type}</Badge>
          {brand && (
            <Badge className={cn("text-[10px] bg-gradient-to-r text-white border-0", brand.color)}>
              {brand.label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {flow.stats?.sent || 0}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {flow.stats?.opened || 0}
          </span>
          <span className="flex items-center gap-1">
            <MousePointerClick className="w-3 h-3" />
            {flow.stats?.clicked || 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function StepTimeline({ steps, onSendTest }: { steps: EmailFlowStep[]; onSendTest: (id: string) => void }) {
  return (
    <div className="space-y-0 relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />
      
      {steps.map((step, index) => (
        <div 
          key={step.id} 
          className="flex gap-4 relative animate-in fade-in slide-in-from-left-2 duration-500"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex flex-col items-center z-10">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
              "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
              "shadow-lg shadow-primary/30 ring-4 ring-background"
            )}>
              {step.step_number}
            </div>
          </div>
          <Card className="flex-1 mb-4 hover:border-primary/30 transition-all duration-300 hover:shadow-md group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {step.delay_hours > 0 && (
                    <Badge variant="outline" className="text-xs bg-background">
                      <Clock className="w-3 h-3 mr-1" />
                      +{step.delay_hours}h
                    </Badge>
                  )}
                  {step.ai_generated && (
                    <Badge className="text-xs bg-gradient-to-r from-[#405DE6] to-[#833AB4] text-white border-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Generated
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); onSendTest(step.id); }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-sm mt-2">{step.subject}</CardTitle>
              {step.preview_text && (
                <CardDescription className="text-xs line-clamp-1">{step.preview_text}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div 
                className="text-xs text-muted-foreground line-clamp-2 bg-muted/50 rounded-lg p-2"
                dangerouslySetInnerHTML={{ __html: step.body_html.substring(0, 150) + '...' }}
              />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

function AIGeneratorModal({ onGenerate, generating }: { 
  onGenerate: (params: any) => void; 
  generating: boolean;
}) {
  const [flowType, setFlowType] = useState('nurture');
  const [brand, setBrand] = useState('wpw');
  const [persona, setPersona] = useState('');
  const [productFocus, setProductFocus] = useState('');

  return (
    <DialogContent className="max-w-lg bg-card/95 backdrop-blur-xl border-white/10">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#405DE6] to-[#E1306C] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          Generate AI Email Flow
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-5 py-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Flow Type</Label>
          <Select value={flowType} onValueChange={setFlowType}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FLOW_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Brand</Label>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRANDS.map(b => (
                <SelectItem key={b.value} value={b.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full bg-gradient-to-r", b.color)} />
                    {b.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Target Persona <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input 
            placeholder="e.g., DIY installers, Shop owners, Fleet managers"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="bg-white/5 border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Product Focus <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input 
            placeholder="e.g., Chrome delete, Color change, PPF"
            value={productFocus}
            onChange={(e) => setProductFocus(e.target.value)}
            className="bg-white/5 border-white/10"
          />
        </div>
      </div>
      <Button 
        className={cn(
          "w-full h-12 text-base font-semibold",
          "bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C]",
          "hover:opacity-90 transition-all duration-300",
          "shadow-lg shadow-primary/25"
        )}
        onClick={() => onGenerate({ flowType, brand, persona, productFocus })}
        disabled={generating}
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Generating your flow...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 mr-2" />
            Generate {FLOW_TYPES.find(t => t.value === flowType)?.label}
          </>
        )}
      </Button>
    </DialogContent>
  );
}

export default function MightyMailAI() {
  const { flows, isLoading, generating, useFlowSteps, generateAIFlow, sendTestEmail, deleteFlow } = useEmailFlows();
  const [selectedFlow, setSelectedFlow] = useState<EmailFlow | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);

  const { data: steps } = selectedFlow ? useFlowSteps(selectedFlow.id) : { data: [] };

  const handleGenerate = async (params: any) => {
    const flow = await generateAIFlow(params);
    setGeneratorOpen(false);
    if (flow) {
      setSelectedFlow(flow as EmailFlow);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Mighty<span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Mail</span> AI
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered email automation built for the wrap industry
            </p>
          </div>
          <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className={cn(
                  "bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C]",
                  "hover:opacity-90 transition-all duration-300",
                  "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                  "hover:-translate-y-0.5"
                )}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Flow
              </Button>
            </DialogTrigger>
            <AIGeneratorModal onGenerate={handleGenerate} generating={generating} />
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flow List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Email Flows
              </h2>
              <Badge variant="outline" className="text-xs">
                {flows?.length || 0} flows
              </Badge>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search flows..." 
                className="pl-9 bg-white/5 border-white/10"
              />
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Loading flows...</p>
              </div>
            ) : flows?.length === 0 ? (
              <Card className="p-8 text-center bg-gradient-to-br from-white/5 to-transparent border-dashed">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">No email flows yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Generate your first AI-powered email sequence</p>
                <Button 
                  onClick={() => setGeneratorOpen(true)}
                  className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Flow
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {flows?.map(flow => (
                  <FlowCard 
                    key={flow.id} 
                    flow={flow} 
                    onSelect={() => setSelectedFlow(flow)}
                    isSelected={selectedFlow?.id === flow.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Flow Editor */}
          <div className="lg:col-span-2">
            {selectedFlow ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedFlow.name}</CardTitle>
                      <CardDescription>{selectedFlow.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => deleteFlow.mutate(selectedFlow.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="timeline">
                    <TabsList className="bg-white/5 border border-white/10">
                      <TabsTrigger value="timeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Timeline
                      </TabsTrigger>
                      <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Stats
                      </TabsTrigger>
                      <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Settings
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="timeline" className="mt-6">
                      {steps && steps.length > 0 ? (
                        <StepTimeline steps={steps} onSendTest={sendTestEmail} />
                      ) : (
                        <div className="text-center py-12">
                          <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="text-muted-foreground">No email steps in this flow</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="stats" className="mt-6">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 hover:border-blue-500/40 transition-colors">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold">{selectedFlow.stats?.sent || 0}</div>
                                <p className="text-xs text-muted-foreground">Emails Sent</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 hover:border-purple-500/40 transition-colors">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-purple-400" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold">{selectedFlow.stats?.opened || 0}</div>
                                <p className="text-xs text-muted-foreground">Opened</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/20 hover:border-pink-500/40 transition-colors">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                                <MousePointerClick className="w-5 h-5 text-pink-400" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold">{selectedFlow.stats?.clicked || 0}</div>
                                <p className="text-xs text-muted-foreground">Clicked</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 hover:border-green-500/40 transition-colors">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-green-400">{selectedFlow.stats?.converted || 0}</div>
                                <p className="text-xs text-muted-foreground">Converted</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    <TabsContent value="settings" className="mt-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <Label className="text-base font-medium">Flow Active</Label>
                            <p className="text-sm text-muted-foreground mt-0.5">Enable this flow to start sending emails</p>
                          </div>
                          <Switch 
                            checked={selectedFlow.is_active} 
                            className="data-[state=checked]:bg-green-500"
                          />
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <Label className="text-sm font-medium">Trigger Event</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedFlow.trigger || 'Manual enrollment'}
                          </p>
                        </div>
                        <Button variant="destructive" size="sm" className="w-full" onClick={() => deleteFlow.mutate(selectedFlow.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete This Flow
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <ArrowRight className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Select a flow to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
