import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Cog, 
  MessageCircle, 
  Sparkles, 
  ListTodo,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Users,
  Mail,
  Palette,
  Globe
} from "lucide-react";

export default function OperationsSOP() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Operations <span className="text-amber-600">SOP</span>
          </h1>
          <p className="text-muted-foreground">
            How humans talk to agents. The definitive operating model.
          </p>
        </div>

        {/* Core Principle */}
        <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <p className="text-lg font-semibold text-center text-amber-800 dark:text-amber-400">
              "Humans give intent. Agents execute. Tasks prove it happened."
            </p>
          </CardContent>
        </Card>

        {/* 4 Interaction Surfaces */}
        <div className="space-y-6">
          
          {/* 1. Ops Desk Command */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                  <Cog className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">1. Ops Desk Command</CardTitle>
                  <CardDescription>Primary leadership control center</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Who uses it:</p>
                  <p className="text-muted-foreground">Trish, Jackson, Brice</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Where:</p>
                  <p className="text-muted-foreground">Ops Desk → Command Panel</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="font-medium mb-2">Example Commands:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• "Alex — follow up on quotes older than 24 hours"</li>
                  <li>• "Grant — review design@ for scope creep"</li>
                  <li>• "Casey — monitor IG comments for pricing questions"</li>
                  <li>• "Evan — identify affiliates worth sponsoring"</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">Execution</Badge>
                <Badge variant="outline" className="text-xs">Oversight</Badge>
                <Badge variant="outline" className="text-xs text-red-600 border-red-300">No customer messages</Badge>
              </div>
            </CardContent>
          </Card>

          {/* 2. Talk to Agent Quick Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">2. Talk to Agent Quick Actions</CardTitle>
                  <CardDescription>Context-aware conversation routing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Who uses it:</p>
                  <p className="text-muted-foreground">Anyone reading conversations</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Where:</p>
                  <p className="text-muted-foreground">MightyChat → Right Panel</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="font-medium mb-2">Available Actions:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span>Route to Alex (Quotes)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <Palette className="w-4 h-4 text-purple-600" />
                    <span>Route to Grant (Design)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <MessageCircle className="w-4 h-4 text-pink-600" />
                    <span>Ask Casey (Social)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <Cog className="w-4 h-4 text-amber-600" />
                    <span>Flag Ops Desk</span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground italic">
                Click = route with full context attached. No copying/pasting.
              </p>
            </CardContent>
          </Card>

          {/* 3. ContentBox */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">3. ContentBox AI</CardTitle>
                  <CardDescription>Content creation mode</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Agents here:</p>
                  <p className="text-muted-foreground">Emily, Noah, Ryan, Evan</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Where:</p>
                  <p className="text-muted-foreground">ContentBox AI page</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="font-medium mb-2">How you talk here:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• "Emily — write a 3-email sequence promoting faster turnaround"</li>
                  <li>• "Noah — give me 5 reel hooks using Bape installs"</li>
                  <li>• "Ryan — outline an Ink & Edge feature on premium wraps"</li>
                </ul>
              </div>
              
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium">Flow:</p>
                <p className="text-muted-foreground">
                  Create content → Approve → Send to Ops Desk → Schedule/Deploy
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 4. MightyTask */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                  <ListTodo className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">4. MightyTask</CardTitle>
                  <CardDescription>Confirmation & follow-up tracking</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This is how agents talk <strong>back</strong> to you. Not by messaging — by closing loops.
              </p>
              
              <Separator />
              
              <div>
                <p className="font-medium mb-2">What you see:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Tasks created from Ops Desk directives</li>
                  <li>• Owner (which agent)</li>
                  <li>• Due date & priority</li>
                  <li>• Revenue / CX impact flags</li>
                  <li>• Status (pending, in-progress, done)</li>
                </ul>
              </div>
              
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-sm">
                <p className="text-green-700 dark:text-green-400">
                  You don't ask "Did Grant do it?" — You <strong>see</strong> it.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What You Never Do */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-lg text-red-600">What You Never Do Again</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span>DM agents directly</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span>Ask "who owns this?"</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span>Send Slack messages</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span>Copy/paste context</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span>Wonder if work was done</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flow Diagram */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">You / Jackson / Brice</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                  <Cog className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Ops Desk Command</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Agent Executes</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-medium">MightyTask</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </MainLayout>
  );
}
