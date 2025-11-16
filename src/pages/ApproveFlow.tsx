import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  MessageSquare, 
  CheckCircle2, 
  Clock,
  Send,
  AlertCircle,
  Eye,
  RotateCcw,
  Box,
  Image as ImageIcon,
  Paperclip
} from "lucide-react";

export default function ApproveFlow() {
  const [activeRole, setActiveRole] = useState<"designer" | "customer">("designer");
  const [chatMessage, setChatMessage] = useState("");
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

  const progressSteps = [
    { label: "Design Requested", status: "complete" },
    { label: "Proof Delivered", status: "complete" },
    { label: "Awaiting Feedback", status: "current" },
    { label: "Revision Sent", status: "pending" },
    { label: "Approved", status: "pending" },
  ];

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-white">Approve</span>
            <span className="text-gradient">Flow™</span>
          </h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant={activeRole === "designer" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveRole("designer")}
              className={activeRole === "designer" ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}
            >
              DESIGNER
            </Button>
            <Button
              variant={activeRole === "customer" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveRole("customer")}
              className={activeRole === "customer" ? "bg-gradient-to-r from-cyan-400 to-cyan-500" : ""}
            >
              CUSTOMER
            </Button>
          </div>

          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            🔄 LIVE SYNC
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="p-6 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 border-purple-500/30">
        <div className="relative">
          <div className="flex justify-between mb-3">
            {progressSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  step.status === "complete" 
                    ? "bg-gradient-primary" 
                    : step.status === "current"
                    ? "bg-pink-500"
                    : "bg-card"
                }`}>
                  {step.status === "complete" && <CheckCircle2 className="w-4 h-4 text-white" />}
                  {step.status === "current" && <Clock className="w-4 h-4 text-white" />}
                </div>
                <span className={`text-xs text-center ${
                  step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-card -z-10">
            <div className="h-full bg-gradient-primary w-2/5" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Design Proof with 2D/3D Toggle */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Info */}
          <Card className="p-4 bg-card border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Order: <span className="text-foreground font-semibold">#32995</span></span>
                <span>•</span>
                <span className="text-foreground">Trish Dill</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Nov 1, 2025</span>
                <span>•</span>
                <span className="text-foreground font-semibold">$1000.00</span>
              </div>
              <p className="text-sm text-foreground">Custom Vehicle Wrap Design</p>
            </div>
          </Card>

          {/* 2D Upload Section */}
          <Card className="bg-card border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Upload 2D Design</h3>
            </div>
            <div className="p-4">
              <Button className="w-full bg-purple-500 hover:bg-purple-600">
                <Upload className="w-4 h-4 mr-2" />
                Upload 2D Proof
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Upload flat design first
              </p>
            </div>
          </Card>

          {/* 3D Generator Section */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="font-semibold text-white">Generate 3D View</h3>
            </div>
            <div className="p-4 space-y-3">
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">
                <Box className="w-4 h-4 mr-2" />
                Generate 3D Render
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                3D proofs increase conversion by 100x
              </p>
            </div>
          </Card>
        </div>

        {/* Center: Large Design Proof Viewer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Design Proof Card */}
          <Card className="bg-card border-border">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Design Proof v3</h2>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                  <Clock className="w-3 h-3 mr-1" />
                  Awaiting Approval
                </Badge>
              </div>
            </div>

            {/* Design Viewer */}
            <div className="p-6">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "2d" | "3d")} className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="bg-background">
                    <TabsTrigger value="2d" className="data-[state=active]:bg-purple-500">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      2D View
                    </TabsTrigger>
                    <TabsTrigger value="3d" className="data-[state=active]:bg-purple-500">
                      <Box className="w-4 h-4 mr-2" />
                      3D View
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <TabsContent value="2d" className="mt-0">
                  <div className="aspect-video bg-background rounded-lg border border-border flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">2D Design Preview</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="3d" className="mt-0">
                  <div className="aspect-video bg-background rounded-lg border border-border flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Box className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">3D Render Preview</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Submission Info */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Card className="bg-background border-border p-3">
                  <div className="text-xs text-muted-foreground mb-1">SUBMITTED</div>
                  <div className="text-foreground font-semibold text-sm">Nov 2, 2025</div>
                  <div className="text-foreground font-semibold text-sm">3:36 PM</div>
                </Card>

                <Card className="bg-background border-border p-3">
                  <div className="text-xs text-muted-foreground mb-1">VERSION</div>
                  <div className="text-foreground font-semibold text-sm">Revision 3</div>
                  <div className="text-purple-400 text-xs mt-1">Latest</div>
                </Card>
              </div>
            </div>
          </Card>

          {/* Customer Design Instructions */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="p-4 border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Customer Design Instructions</h3>
                <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                  <Upload className="w-4 h-4 mr-2" />
                  Add File
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <Card className="bg-black/40 border-border/50 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Clock className="w-3 h-3" />
                  <span>Received Nov 2, 2025 at 2:28 PM</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-purple-400 mb-2">Instructions</h4>
                    <p className="text-sm text-foreground">
                      I want a full wrap for this van excluding the roof, it's a 1500 ford van, 
                      here's a picture of the design we chose
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground italic">
                    Please request a revision to update instructions
                  </div>
                </div>
              </Card>

              {/* Reference Files */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Reference Files</h4>
                <div className="space-y-2">
                  <Card className="bg-black/40 border-border/50 p-3 flex items-center gap-3">
                    <Paperclip className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-foreground">IMG_3329.jpg</span>
                  </Card>
                  <Card className="bg-black/40 border-border/50 p-3 flex items-center gap-3">
                    <Paperclip className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-foreground">BFD72520-2082-1EDE-...</span>
                  </Card>
                  <Button variant="outline" className="w-full border-purple-500/30 hover:bg-purple-500/10">
                    <Upload className="w-4 h-4 mr-2" />
                    Add File
                  </Button>
                </div>
              </div>

              {/* Design Revision Note */}
              <Card className="bg-black/40 border-border/50 p-4">
                <div className="font-semibold text-white mb-2">Design Revision 3:</div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="text-xs text-purple-400 mb-1">Customer requested</div>
                  <p className="text-sm text-foreground">
                    brighter colors and logo repositioning on the driver side panel
                  </p>
                </div>
              </Card>
            </div>
          </Card>
        </div>

        {/* Right: Smaller SmartChat */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border h-full flex flex-col">
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Chat with Design Team</h3>
              </div>
            </div>

            <div className="flex-1 p-4 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <MessageSquare className="w-8 h-8 text-purple-500/50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Start chatting 👋</p>
                  <p className="text-xs text-muted-foreground">
                    Type or say what you need — we'll route it
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-border space-y-2">
              <div className="relative">
                <Input
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="pr-9 bg-background border-border text-sm h-9"
                />
                <Button
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7 bg-primary hover:bg-primary/90"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>

              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 h-9 text-sm">
                <CheckCircle2 className="w-3 h-3 mr-2" />
                Approve Design
              </Button>

              <Button variant="outline" className="w-full border-purple-500/30 hover:bg-purple-500/10 h-9 text-sm">
                <AlertCircle className="w-3 h-3 mr-2" />
                Request Revision
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
