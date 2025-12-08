import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, 
  Clock, 
  Zap, 
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Settings,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailStep {
  day: number;
  subject: string;
  preview: string;
  type: 'reminder' | 'value' | 'urgency' | 'final';
}

interface Flow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  isActive: boolean;
  enrolledCount: number;
  steps: EmailStep[];
}

const defaultFlows: Flow[] = [
  {
    id: 'quote_followup',
    name: 'Quote Follow-Up Sequence',
    description: 'Automatically follow up with customers after sending a quote',
    trigger: 'Quote sent',
    isActive: true,
    enrolledCount: 24,
    steps: [
      { day: 0, subject: 'Your wrap quote is ready!', preview: 'Here\'s the breakdown for your vehicle wrap...', type: 'value' },
      { day: 1, subject: 'Quick question about your wrap quote', preview: 'Want me to generate some design previews?', type: 'reminder' },
      { day: 3, subject: 'Still thinking about your wrap?', preview: 'I can help with any questions you have...', type: 'value' },
      { day: 7, subject: 'Your quote expires soon', preview: 'Just a heads up - pricing may change after...', type: 'urgency' }
    ]
  },
  {
    id: 'abandoned_quote',
    name: 'Abandoned Quote Recovery',
    description: 'Re-engage customers who started but didn\'t complete a quote',
    trigger: 'Quote started, no follow-up',
    isActive: true,
    enrolledCount: 12,
    steps: [
      { day: 1, subject: 'Did you forget something?', preview: 'You were checking out wrap options...', type: 'reminder' },
      { day: 3, subject: 'Your vehicle could look like this', preview: 'Here\'s a preview of what\'s possible...', type: 'value' },
      { day: 5, subject: 'Last chance for your quote', preview: 'I noticed you didn\'t finish...', type: 'final' }
    ]
  },
  {
    id: 'design_approval',
    name: 'Design Approval Sequence',
    description: 'Follow up on designs waiting for customer approval',
    trigger: 'Design proof sent',
    isActive: false,
    enrolledCount: 8,
    steps: [
      { day: 1, subject: 'Your design is ready for review', preview: 'Take a look and let us know...', type: 'value' },
      { day: 3, subject: 'Any changes needed?', preview: 'We can revise the design if you\'d like...', type: 'reminder' },
      { day: 5, subject: 'Ready to print your wrap?', preview: 'Approve your design to move forward...', type: 'urgency' }
    ]
  },
  {
    id: 'post_install',
    name: 'Post-Installation Follow-Up',
    description: 'Check in after wrap installation for feedback and referrals',
    trigger: 'Order completed',
    isActive: true,
    enrolledCount: 156,
    steps: [
      { day: 1, subject: 'How does your new wrap look?', preview: 'We\'d love to see photos of your ride...', type: 'value' },
      { day: 7, subject: 'Quick favor?', preview: 'If you\'re loving your wrap, a review would help...', type: 'reminder' },
      { day: 30, subject: 'Refer a friend, get rewarded', preview: 'Know someone who wants a wrap? Get $50...', type: 'value' }
    ]
  }
];

const QuoteFollowUpFlows = () => {
  const [flows, setFlows] = useState<Flow[]>(defaultFlows);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const { toast } = useToast();

  const handleToggleFlow = (flowId: string, active: boolean) => {
    setFlows(prev => prev.map(f => 
      f.id === flowId ? { ...f, isActive: active } : f
    ));
    toast({
      title: active ? "Flow activated" : "Flow paused",
      description: `${flows.find(f => f.id === flowId)?.name} is now ${active ? 'active' : 'paused'}`
    });
  };

  const getTypeColor = (type: EmailStep['type']) => {
    switch (type) {
      case 'value': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'reminder': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'urgency': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'final': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Quote Follow-Up Flows</h2>
          <p className="text-sm text-muted-foreground">
            Automated email sequences to increase conversion rates
          </p>
        </div>
        <Button>
          <Zap className="w-4 h-4 mr-2" />
          Create New Flow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{flows.filter(f => f.isActive).length}</div>
            <p className="text-xs text-muted-foreground">Active Flows</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">
              {flows.reduce((sum, f) => sum + f.enrolledCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Customers Enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-500">42%</div>
            <p className="text-xs text-muted-foreground">Open Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-500">18%</div>
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Flows Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {flows.map((flow) => (
          <Card key={flow.id} className={`${flow.isActive ? '' : 'opacity-60'}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    {flow.name}
                  </CardTitle>
                  <CardDescription>{flow.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={flow.isActive}
                    onCheckedChange={(checked) => handleToggleFlow(flow.id, checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="gap-1">
                  <Zap className="w-3 h-3" />
                  {flow.trigger}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {flow.enrolledCount} enrolled
                </Badge>
              </div>

              <div className="space-y-2">
                {flow.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium">
                      Day {step.day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{step.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{step.preview}</p>
                    </div>
                    <Badge variant="outline" className={getTypeColor(step.type)}>
                      {step.type}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuoteFollowUpFlows;
