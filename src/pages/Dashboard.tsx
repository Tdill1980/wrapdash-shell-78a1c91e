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
    gradient: "bg-gradient-purple",
  },
  {
    label: "Print Kits",
    value: "43",
    change: "+8%",
    icon: Package,
    gradient: "bg-gradient-teal",
  },
  {
    label: "Active Jobs",
    value: "24",
    change: "+5%",
    icon: TrendingUp,
    gradient: "bg-gradient-orange",
  },
  {
    label: "Revenue",
    value: "$12.5K",
    change: "+18%",
    icon: DollarSign,
    gradient: "bg-gradient-neon",
  },
  {
    label: "Customers",
    value: "89",
    change: "+6%",
    icon: Users,
    gradient: "bg-gradient-purple",
  },
  {
    label: "Approvals",
    value: "67",
    change: "+14%",
    icon: CheckCircle,
    gradient: "bg-gradient-teal",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 max-w-7xl animate-fade-in">
      <div>
        <h1 className="text-5xl font-display text-gradient-purple">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Overview of your wrap business operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="p-6 bg-card border-border hover:border-primary/30 transition-all duration-300 hover:shadow-card-hover group"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-display">{metric.value}</p>
                    <span className="text-sm font-semibold text-green-500">
                      {metric.change}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3 ${metric.gradient} rounded-xl group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 bg-card border-border hover:border-primary/30 transition-all duration-300 hover:shadow-card-hover">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-purple rounded-xl">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Recent Renders</h3>
          </div>
          <p className="text-muted-foreground">
            View your latest 3D wrap visualizations and designs
          </p>
        </Card>

        <Card className="p-8 bg-card border-border hover:border-primary/30 transition-all duration-300 hover:shadow-card-hover">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-teal rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Production Queue</h3>
          </div>
          <p className="text-muted-foreground">
            Manage print kits and production files
          </p>
        </Card>
      </div>
    </div>
  );
}
