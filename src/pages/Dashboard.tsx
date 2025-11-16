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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const adminModules = [
  {
    name: "Design Vault",
    subtitle: "Manage uploads",
    icon: Database,
    gradient: "bg-gradient-vault",
    route: "/designvault",
  },
  {
    name: "MightyMail",
    subtitle: "Email campaigns",
    icon: Mail,
    gradient: "bg-gradient-mail",
    route: "/email-campaigns",
  },
  {
    name: "Customers",
    subtitle: "Manage customers",
    icon: Users,
    gradient: "bg-gradient-customers",
    route: "/mightycustomer",
  },
  {
    name: "Orders",
    subtitle: "View all orders",
    icon: Package,
    gradient: "bg-gradient-orders",
    route: "/shopflow",
  },
  {
    name: "Admin Panel",
    subtitle: "Full admin access",
    icon: Settings,
    gradient: "bg-gradient-admin",
    route: "/settings",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Admin Controls
        </h1>
        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.name}
              onClick={() => navigate(module.route)}
              className={`${module.gradient} p-3 rounded-xl text-left hover:shadow-glow hover:scale-[1.02] transition-all duration-200 group`}
            >
              <div className="flex items-start justify-between mb-1">
                <Icon className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-bold text-white mb-0.5">
                {module.name}
              </h3>
              <p className="text-xs text-white/70">{module.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Two Column Layout: MightyCustomer + DesignVault Premium */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        {/* MightyCustomer Card */}
        <Card className="bg-card border-border">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">MightyCustomer</CardTitle>
                  <p className="text-sm text-muted-foreground">Quote & Order Builder</p>
                </div>
              </div>
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Choose a Product</label>
              <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground">
                <option>Choose a Product</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button className="bg-primary/20 hover:bg-primary/30 text-foreground border-0">
                <Car className="w-4 h-4 mr-2" />
                Make/Model
              </Button>
              <Button variant="outline" className="bg-background/50 border-border/50">
                Total Sq. Ft.
              </Button>
              <Button variant="outline" className="bg-background/50 border-border/50">
                Dimensions
              </Button>
            </div>

            <div className="space-y-3">
              <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground">
                <option>Select Make</option>
              </select>
              <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground">
                <option>Select Model</option>
              </select>
              <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground">
                <option>Select Year</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Quantity</label>
                <input
                  type="number"
                  defaultValue="1"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Finish</label>
                <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground">
                  <option>Gloss</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-muted-foreground">Margin</label>
                <span className="text-sm font-semibold text-primary">40%</span>
              </div>
              <input
                type="range"
                defaultValue="40"
                className="w-full"
                style={{
                  accentColor: "hsl(var(--primary))",
                }}
              />
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90 text-white">
              + Add to Quote
            </Button>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Customer Information</span>
                </div>
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DesignVault Premium Card */}
        <Card className="bg-card border-border">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    DesignVault™ <span className="bg-gradient-primary bg-clip-text text-transparent">Premium</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">This Month's Drops</p>
                </div>
              </div>
              <button className="text-sm text-primary hover:underline">View All</button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="relative bg-black/50 rounded-xl p-6 overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-white shadow-glow">
                  <Sparkles className="w-3 h-3 mr-1" />
                  New
                </Badge>
              </div>
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-white">
                  Panel is 174"x49"
                </div>
                <div className="w-full h-48 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Car className="w-24 h-24 text-white/50" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Rainbow Splatter</h3>
                  <p className="text-sm text-muted-foreground">Panel 174"x49"</p>
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1 bg-primary hover:bg-primary/90 text-white">
                    View Design
                  </Button>
                  <Button variant="outline" className="flex-1 bg-background/50">
                    Preview
                  </Button>
                  <Button variant="outline" className="flex-1 bg-background/50">
                    Save
                  </Button>
                </div>
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <div className="w-2 h-2 rounded-full bg-muted"></div>
                  <div className="w-2 h-2 rounded-full bg-muted"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
