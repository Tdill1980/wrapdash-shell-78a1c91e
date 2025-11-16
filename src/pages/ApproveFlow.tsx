import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  MessageSquare, 
  CheckCircle2, 
  Clock,
  Send,
  AlertCircle
} from "lucide-react";

export default function ApproveFlow() {
  const [activeRole, setActiveRole] = useState<"designer" | "customer">("designer");
  const [chatMessage, setChatMessage] = useState("");

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <Card className="p-6 bg-card border-border">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Order: <span className="text-white font-semibold">#Order #32995</span></span>
                <span>•</span>
                <span className="text-white">Trish Dill</span>
                <span>•</span>
                <span>Nov 1, 2025</span>
                <span>•</span>
                <span className="text-white font-semibold">$1000.00</span>
              </div>
              <p className="text-foreground">Custom Vehicle Wrap Design</p>
            </div>
          </Card>

          {/* Customer Design Instructions */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Customer Design Instructions</h2>
                <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                  <Upload className="w-4 h-4 mr-2" />
                  Add File
                </Button>
              </div>

              <Card className="bg-black/40 border-border/50 p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Clock className="w-3 h-3" />
                  <span>Received Nov 2, 2025 at 2:28 PM</span>
                  <span>•</span>
                  <span>about 1 hour ago</span>
                </div>

                <div className="space-y-2">
                  <p className="text-white font-medium">No design instructions provided</p>
                  <p className="text-sm text-muted-foreground italic">
                    Please request a revision to update instructions
                  </p>
                </div>
              </Card>
            </div>
          </Card>

          {/* Design Proof */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Design Proof v3</h2>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                  <Clock className="w-3 h-3 mr-1" />
                  Awaiting Approval
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-black/40 border-border/50 p-4">
                  <div className="text-xs text-muted-foreground mb-2">SUBMITTED</div>
                  <div className="text-white font-semibold">Nov 2, 2025</div>
                  <div className="text-white font-semibold">3:36 PM</div>
                </Card>

                <div className="space-y-4">
                  <Button className="w-full bg-purple-500 hover:bg-purple-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Proof v4
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    3D proofs increase conversion by 100x. Upload flat proof first, then generate 3D version.
                  </p>
                </div>
              </div>

              <Card className="bg-black/40 border-border/50 p-4 mt-4">
                <div className="font-semibold text-white mb-3">Design Revision 3:</div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="text-xs text-purple-400 mb-2">Customer requested</div>
                  <p className="text-sm text-foreground">
                    brighter colors and logo repositioning on the driver side panel
                  </p>
                </div>
              </Card>
            </div>
          </Card>
        </div>

        {/* SmartChat Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-white">SmartChat</h3>
              </div>
            </div>

            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <MessageSquare className="w-12 h-12 text-purple-500/50" />
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Welcome! 👋</p>
                  <p className="text-sm text-muted-foreground">
                    Start a conversation with your customer about this project
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border space-y-3">
              <div className="relative">
                <Input
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="pr-10 bg-background border-border"
                />
                <Button
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7 bg-primary hover:bg-primary/90"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Type or say what you need — we'll route it
              </p>

              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Design
              </Button>

              <Button variant="outline" className="w-full border-purple-500/30 hover:bg-purple-500/10">
                <AlertCircle className="w-4 h-4 mr-2" />
                Request Revision
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
