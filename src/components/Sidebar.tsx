import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  Package,
  Calendar,
  Store,
  ShoppingCart,
  Users,
  CheckCircle,
  Briefcase,
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "WrapCloser", path: "/wrapcloser", icon: Sparkles },
  { name: "DesignVault", path: "/designvault", icon: FolderOpen },
  { name: "WrapBox", path: "/wrapbox", icon: Package },
  { name: "Monthly Drops", path: "/monthly-drops", icon: Calendar },
  { name: "Design Market", path: "/design-market", icon: Store },
  { name: "ShopFlow", path: "/shopflow", icon: ShoppingCart },
  { name: "MightyCustomer", path: "/mighty-customer", icon: Users },
  { name: "ApproveFlow", path: "/approveflow", icon: CheckCircle },
  { name: "Portfolio", path: "/portfolio", icon: Briefcase },
];

export const Sidebar = () => {
  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
          WrapCommand
        </h1>
        <p className="text-xs text-muted-foreground mt-1">SaaS Platform</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
              activeClassName="bg-gradient-purple text-white shadow-lg shadow-primary/20"
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
