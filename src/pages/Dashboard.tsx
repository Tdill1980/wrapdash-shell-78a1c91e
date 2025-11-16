import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Package, DollarSign } from "lucide-react";

const metrics = [
  { label: "Total Projects", value: "—", icon: Package, color: "text-primary" },
  { label: "Active Customers", value: "—", icon: Users, color: "text-secondary" },
  { label: "Revenue", value: "—", icon: DollarSign, color: "text-accent" },
  { label: "Growth", value: "—", icon: TrendingUp, color: "text-primary" },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-purple bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Overview of your WrapCommand operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="p-6 bg-card border-border hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${metric.color}`} />
              </div>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="text-3xl font-bold mt-2">{metric.value}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-8 bg-card border-border rounded-2xl text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-teal bg-clip-text text-transparent">
            Dashboard Coming Soon
          </h2>
          <p className="text-muted-foreground">
            Your comprehensive dashboard with real-time analytics, insights, and
            business metrics will be available here.
          </p>
        </div>
      </Card>
    </div>
  );
}
