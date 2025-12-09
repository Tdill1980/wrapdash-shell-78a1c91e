import { useState } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, Mail, Play, Pause, Plus, Trash2, Clock, 
  ArrowRight, Eye, Send, Loader2, Zap, TrendingUp 
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
  { value: 'wpw', label: 'WePrintWraps' },
  { value: 'wraptv', label: 'WrapTV' },
  { value: 'inkandedge', label: 'Ink & Edge' },
];

function FlowCard({ flow, onSelect }: { flow: EmailFlow; onSelect: () => void }) {
  const { updateFlow } = useEmailFlows();
  
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:border-primary/50 transition-all",
        flow.is_active && "border-green-500/50"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{flow.name}</CardTitle>
          <Switch
            checked={flow.is_active}
            onClick={(e) => e.stopPropagation()}
            onCheckedChange={(checked) => updateFlow.mutate({ id: flow.id, is_active: checked })}
          />
        </div>
        <CardDescription>{flow.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant="outline">{flow.flow_type}</Badge>
          <Badge variant="secondary">{flow.brand}</Badge>
          <span className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {flow.stats?.sent || 0} sent
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {flow.stats?.opened || 0} opened
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function StepTimeline({ steps, onSendTest }: { steps: EmailFlowStep[]; onSendTest: (id: string) => void }) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {step.step_number}
            </div>
            {index < steps.length - 1 && (
              <div className="w-0.5 h-full bg-border mt-2" />
            )}
          </div>
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {step.delay_hours > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      +{step.delay_hours}h
                    </Badge>
                  )}
                  {step.ai_generated && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onSendTest(step.id)}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-base">{step.subject}</CardTitle>
              {step.preview_text && (
                <CardDescription>{step.preview_text}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div 
                className="text-sm text-muted-foreground max-h-24 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: step.body_html.substring(0, 200) + '...' }}
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
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Generate AI Email Flow
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Flow Type</Label>
          <Select value={flowType} onValueChange={setFlowType}>
            <SelectTrigger>
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
          <Label>Brand</Label>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRANDS.map(b => (
                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Target Persona (optional)</Label>
          <Input 
            placeholder="e.g., DIY installers, Shop owners, Fleet managers"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Product Focus (optional)</Label>
          <Input 
            placeholder="e.g., Chrome delete, Color change, PPF"
            value={productFocus}
            onChange={(e) => setProductFocus(e.target.value)}
          />
        </div>
      </div>
      <Button 
        className="w-full" 
        onClick={() => onGenerate({ flowType, brand, persona, productFocus })}
        disabled={generating}
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Generate {FLOW_TYPES.find(t => t.value === flowType)?.label} Sequence
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Mighty<span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Mail</span> AI
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered email automation that beats Klaviyo
            </p>
          </div>
          <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
            <DialogTrigger asChild>
              <Button>
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
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Flows
            </h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              </div>
            ) : flows?.length === 0 ? (
              <Card className="p-8 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No flows yet</p>
                <Button className="mt-4" onClick={() => setGeneratorOpen(true)}>
                  Generate Your First Flow
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {flows?.map(flow => (
                  <FlowCard 
                    key={flow.id} 
                    flow={flow} 
                    onSelect={() => setSelectedFlow(flow)}
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
                    <TabsList>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      <TabsTrigger value="stats">Stats</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="timeline" className="mt-4">
                      {steps && steps.length > 0 ? (
                        <StepTimeline steps={steps} onSendTest={sendTestEmail} />
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No steps in this flow
                        </p>
                      )}
                    </TabsContent>
                    <TabsContent value="stats" className="mt-4">
                      <div className="grid grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{selectedFlow.stats?.sent || 0}</div>
                            <p className="text-sm text-muted-foreground">Sent</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{selectedFlow.stats?.opened || 0}</div>
                            <p className="text-sm text-muted-foreground">Opened</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{selectedFlow.stats?.clicked || 0}</div>
                            <p className="text-sm text-muted-foreground">Clicked</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-500">{selectedFlow.stats?.converted || 0}</div>
                            <p className="text-sm text-muted-foreground">Converted</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    <TabsContent value="settings" className="mt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Flow Active</Label>
                            <p className="text-sm text-muted-foreground">Enable this flow to start sending</p>
                          </div>
                          <Switch checked={selectedFlow.is_active} />
                        </div>
                        <div>
                          <Label>Trigger</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedFlow.trigger}
                          </p>
                        </div>
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
