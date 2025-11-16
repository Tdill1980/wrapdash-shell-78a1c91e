import { useNavigate } from "react-router-dom";
import {
  Database,
  Mail,
  Users,
  Package,
  Settings,
  FileText,
  Sparkles,
  ChevronUp,
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

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Hero Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground relative inline-block">
            Dashboard
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-pink-500"></span>
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Your Shop's Daily Mission Control — Jobs, Quotes, Production, and Sales
          </p>
        </div>
        <button className="p-2 hover:bg-[#121218] rounded-md transition-colors">
          <Settings className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.title}
              className="bg-[#121218] border border-white/5 rounded-md p-3 hover:border-purple-500/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-[10px] text-green-400 font-medium">{metric.change}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-1">{metric.title}</div>
              <div className="text-lg font-bold text-foreground">{metric.value}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Access Modules */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {adminModules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.name}
                onClick={() => navigate(module.route)}
                className="bg-[#121218] border border-white/5 p-3 rounded-md text-left hover:border-purple-500/60 hover:shadow-[0_0_12px_rgba(168,85,247,0.15)] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-purple-400 transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="text-xs font-semibold text-foreground mb-0.5">
                  {module.name}
                </h3>
                <p className="text-[10px] text-muted-foreground">{module.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Quick Build */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
          Recent Activity & Quick Build
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* MightyCustomer Card */}
          <Card className="bg-[#121218] border-white/5">
            <CardHeader className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-500/10 rounded-md border border-purple-500/20">
                    <FileText className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">MightyCustomer</CardTitle>
                    <p className="text-[10px] text-muted-foreground">Quote & Order Builder</p>
                  </div>
                </div>
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0 p-3">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Choose a Product</label>
                <select className="w-full bg-[#0F0F14] border border-white/5 rounded-md px-3 py-2 text-xs text-foreground focus:border-purple-500/50 focus:outline-none transition-colors">
                  <option>Choose a Product</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" className="bg-purple-500/10 hover:bg-purple-500/20 text-foreground border-0 text-[10px] h-7">
                <Car className="w-4 h-4 mr-2" />
                Make/Model
                </Button>
                <Button size="sm" variant="outline" className="bg-[#0F0F14] border-white/5 text-[10px] h-7">
                  Total Sq. Ft.
                </Button>
                <Button size="sm" variant="outline" className="bg-[#0F0F14] border-white/5 text-[10px] h-7">
                  Dimensions
                </Button>
              </div>

              <div className="space-y-2">
                <select className="w-full bg-[#0F0F14] border border-white/5 rounded-md px-3 py-2 text-xs text-foreground focus:border-purple-500/50 focus:outline-none transition-colors">
                  <option>Select Make</option>
                </select>
                <select className="w-full bg-[#0F0F14] border border-white/5 rounded-md px-3 py-2 text-xs text-foreground focus:border-purple-500/50 focus:outline-none transition-colors">
                  <option>Select Model</option>
                </select>
                <select className="w-full bg-[#0F0F14] border border-white/5 rounded-md px-3 py-2 text-xs text-foreground focus:border-purple-500/50 focus:outline-none transition-colors">
                  <option>Select Year</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Quantity</label>
                  <input
                    type="number"
                    defaultValue="1"
                    className="w-full bg-[#0F0F14] border border-white/5 rounded-md px-3 py-2 text-xs text-foreground focus:border-purple-500/50 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Finish</label>
                  <select className="w-full bg-[#0F0F14] border border-white/5 rounded-md px-3 py-2 text-xs text-foreground focus:border-purple-500/50 focus:outline-none transition-colors">
                    <option>Gloss</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-muted-foreground">Margin</label>
                  <span className="text-xs font-semibold text-purple-400">40%</span>
                </div>
                <input
                  type="range"
                  defaultValue="40"
                  className="w-full h-1.5 accent-purple-500"
                />
              </div>

              <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)] text-white text-xs h-8">
                + Add to Quote
              </Button>

              <div className="pt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">Customer Information</span>
                  </div>
                  <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
        </Card>

          {/* DesignVault Premium Card */}
          <Card className="bg-[#121218] border-white/5">
            <CardHeader className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-500/10 rounded-md border border-purple-500/20">
                    <Sparkles className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">
                      DesignVault™ <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Premium</span>
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground">This Month's Drops</p>
                  </div>
                </div>
                <button className="text-[10px] text-purple-400 hover:underline">View All</button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0 p-3">
              <div className="relative bg-[#0A0A0F] rounded-md p-4 overflow-hidden border border-white/5">
                <div className="absolute top-2 right-2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)] text-[9px] px-1.5 py-0.5">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                    New
                  </Badge>
                </div>
                <div className="text-center space-y-3">
                  <div className="text-lg font-bold text-white">
                    Panel is 174"x49"
                  </div>
                  <div className="w-full h-32 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                    <Car className="w-16 h-16 text-white/50" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-0.5">Rainbow Splatter</h3>
                    <p className="text-[10px] text-muted-foreground">Panel 174"x49"</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)] text-white text-xs h-7">
                      View Design
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 bg-[#0F0F14] border-white/5 text-xs h-7">
                      Preview
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 bg-[#0F0F14] border-white/5 text-xs h-7">
                      Save
                    </Button>
                  </div>
                  <div className="flex justify-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-muted"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-muted"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
