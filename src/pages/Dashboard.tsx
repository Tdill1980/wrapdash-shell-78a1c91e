import { Card } from "@/components/ui/card";
import {
  Palette,
  Package,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
} from "lucide-react";

const metrics = [
  {
    label: "Total Renders",
    value: "156",
    change: "+12%",
    icon: Palette,
  },
  {
    label: "Print Kits",
    value: "43",
    change: "+8%",
    icon: Package,
  },
  {
    label: "Active Jobs",
    value: "24",
    change: "+5%",
    icon: TrendingUp,
  },
  {
    label: "Revenue",
    value: "$12.5K",
    change: "+18%",
    icon: DollarSign,
  },
  {
    label: "Customers",
    value: "89",
    change: "+6%",
    icon: Users,
  },
  {
    label: "Approvals",
    value: "67",
    change: "+14%",
    icon: CheckCircle,
  },
];

export default function Dashboard() {
  const quickActions = [
    { name: "New Wrap Job", icon: Package, color: "bg-gradient-primary" },
    { name: "Create Quote", icon: CheckCircle, color: "bg-green-500" },
    { name: "Open DesignVault™", icon: Palette, color: "bg-cyan-500" },
    { name: "Customer Update", icon: Users, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gradient">
          Shop Analytics
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="p-4 bg-card border-border hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    <p className="text-xs font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                    <span className="text-xs font-medium text-green-500">
                      {metric.change}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="p-5">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.name}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors group"
                >
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-center text-foreground">{action.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 bg-card border-border hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Palette className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
              <div className="w-2 h-2 rounded-full bg-primary shadow-glow"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">New design created</p>
                <p className="text-xs text-muted-foreground">2024 Tesla Model 3</p>
              </div>
              <span className="text-xs text-muted-foreground">5m ago</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-card border-border hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold">Production Queue</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage print kits and production files
          </p>
        </Card>
      </div>
    </div>
  );
}
