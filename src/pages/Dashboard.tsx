import { useNavigate } from "react-router-dom";
import {
  Database,
  Mail,
  Users,
  CheckCircle,
  Package,
  Settings,
} from "lucide-react";

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
    name: "ApprovalFlow V2",
    subtitle: "Approval tasks",
    icon: CheckCircle,
    gradient: "bg-gradient-approval",
    route: "/approveflow",
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.name}
              onClick={() => navigate(module.route)}
              className={`${module.gradient} p-6 rounded-xl text-left hover:shadow-glow hover:scale-[1.02] transition-all duration-200 group`}
            >
              <div className="flex items-start justify-between mb-4">
                <Icon className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">
                {module.name}
              </h3>
              <p className="text-sm text-white/70">{module.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
