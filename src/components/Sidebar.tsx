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
    <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0B0B12] border-r border-border/50 h-screen sticky top-0">
      <div className="p-6 border-b border-border/50">
        <h1 className="text-2xl font-display text-gradient-purple">
          WrapCommand
        </h1>
        <p className="text-xs text-muted-foreground mt-1">AI Platform</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 group"
              activeClassName="bg-gradient-purple text-white shadow-glow-sm"
            >
              <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="px-4 py-3 rounded-xl bg-muted/30">
          <p className="text-xs font-semibold text-foreground">Pro Plan</p>
          <p className="text-xs text-muted-foreground mt-1">
            Unlimited renders
          </p>
        </div>
      </div>
    </aside>
  );
};
