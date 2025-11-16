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
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gradient">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your wrap business operations
        </p>
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
                  <p className="text-xs font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <span className="text-xs font-medium text-green-500">
                      {metric.change}
                    </span>
                  </div>
                </div>

                <div className="p-2 bg-primary/10 rounded-md">
                  <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 bg-card border-border hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Palette className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold">Recent Renders</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            View your latest 3D wrap visualizations and designs
          </p>
        </Card>

        <Card className="p-5 bg-card border-border hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-md">
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
