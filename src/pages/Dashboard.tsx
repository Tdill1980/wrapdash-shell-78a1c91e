import { useNavigate } from "react-router-dom";
import {
  Database,
  Mail,
  Users,
  Package,
  Settings,
  FileText,
  Sparkles,
  Car,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const metrics = [
  {
    title: "Total Renders",
    value: "1,284",
    change: "+12%",
    icon: Activity,
  },
  {
    title: "Production Packs",
    value: "847",
    change: "+8%",
    icon: Package,
  },
  {
    title: "Active Jobs",
    value: "23",
    change: "+5%",
    icon: FileText,
  },
  {
    title: "Revenue",
    value: "$84.2K",
    change: "+18%",
    icon: DollarSign,
  },
  {
    title: "Approvals",
    value: "156",
    change: "+24%",
    icon: CheckCircle,
  },
  {
    title: "Customers",
    value: "412",
    change: "+15%",
    icon: Users,
  },
];

const adminModules = [
  {
    name: "Design Vault",
    subtitle: "Manage uploads",
    icon: Database,
    route: "/designvault",
  },
  {
    name: "MightyMail",
    subtitle: "Email campaigns",
    icon: Mail,
    route: "/email-campaigns",
  },
  {
    name: "Customers",
    subtitle: "Manage customers",
    icon: Users,
    route: "/mightycustomer",
  },
  {
    name: "Orders",
    subtitle: "View all orders",
    icon: Package,
    route: "/shopflow",
  },
  {
    name: "Admin Panel",
    subtitle: "Full admin access",
    icon: Settings,
    route: "/settings",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const productTypes = [
    { name: "Full Wraps", gradient: "bg-gradient-purple-magenta" },
    { name: "Partial Wraps", gradient: "bg-gradient-magenta-blue" },
    { name: "Chrome Delete", gradient: "bg-gradient-plum-pink" },
    { name: "PPF", gradient: "bg-gradient-teal-violet" },
    { name: "Window Tint", gradient: "bg-gradient-primary" },
  ];

  return (
    <div className="space-y-4 max-w-[1600px]">
      {/* VoiceCommand Bar - Sticky at top */}
      <div className="sticky top-0 z-10 bg-card border-b border-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">VoiceCommand</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              ACTIVE
            </Badge>
          </div>
          <Button size="sm" className="bg-gradient-primary hover:opacity-90 h-8 text-white">
            Start Recording
          </Button>
        </div>
      </div>

      {/* Product Type Chips */}
      <div className="flex flex-wrap gap-2">
        {productTypes.map((product) => (
          <button
            key={product.name}
            onClick={() => product.name === "Full Wraps" ? navigate("/visualize") : null}
            className={`px-4 py-2 text-xs font-semibold rounded-lg ${product.gradient} text-white hover:opacity-90 transition-opacity`}
          >
            {product.name}
          </button>
        ))}
      </div>

      {/* Two-Column Hero Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: MightyCustomer Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gradient">MightyCustomer</CardTitle>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Customer management & communication hub
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <div>
                  <div className="text-sm font-semibold text-foreground">Active Customers</div>
                  <div className="text-xs text-muted-foreground">This month</div>
                </div>
                <div className="text-2xl font-bold text-gradient">412</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <div>
                  <div className="text-sm font-semibold text-foreground">Pending Approvals</div>
                  <div className="text-xs text-muted-foreground">Awaiting response</div>
                </div>
                <div className="text-2xl font-bold text-gradient-pink">23</div>
              </div>
              <Button 
                onClick={() => navigate("/mightycustomer")}
                className="w-full bg-gradient-primary hover:opacity-90 text-white"
              >
                Open MightyCustomer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: DesignVault Premium Card */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gradient">DesignVault Premium</CardTitle>
              <Database className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              AI-powered design library & visualization
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border">
                <div>
                  <div className="text-sm font-semibold text-foreground">Total Renders</div>
                  <div className="text-xs text-muted-foreground">All visualizations</div>
                </div>
                <div className="text-2xl font-bold text-gradient">1,284</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border">
                <div>
                  <div className="text-sm font-semibold text-foreground">Production Packs</div>
                  <div className="text-xs text-muted-foreground">Ready to print</div>
                </div>
                <div className="text-2xl font-bold text-gradient-pink">847</div>
              </div>
              <Button 
                onClick={() => navigate("/designvault")}
                className="w-full bg-gradient-plum-pink hover:opacity-90 text-white"
              >
                Open DesignVault
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Cards Below */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.title}
              className="bg-card border-border p-3 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-green-400 font-medium">{metric.change}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-1">{metric.title}</div>
              <div className="text-xl font-bold text-foreground">{metric.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Admin Modules */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-primary rounded-full"></span>
          Admin Modules
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {adminModules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.name}
                onClick={() => navigate(module.route)}
                className="bg-card border-border p-4 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <Icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-semibold text-foreground mb-1">{module.name}</div>
                <div className="text-xs text-muted-foreground">{module.subtitle}</div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="w-1 h-4 bg-gradient-primary rounded-full"></span>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm p-2 bg-background rounded-md">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-muted-foreground">New render added:</span>
              <span className="text-foreground font-medium">2019 Tesla Model 3 - Satin Flip</span>
              <span className="text-muted-foreground ml-auto text-xs">2m ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm p-2 bg-background rounded-md">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span className="text-muted-foreground">Approval received:</span>
              <span className="text-foreground font-medium">Order #32995</span>
              <span className="text-muted-foreground ml-auto text-xs">1h ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm p-2 bg-background rounded-md">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-muted-foreground">Production pack ready:</span>
              <span className="text-foreground font-medium">Cybertruck Wrap Kit</span>
              <span className="text-muted-foreground ml-auto text-xs">3h ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
