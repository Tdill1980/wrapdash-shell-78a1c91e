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
    <aside className="hidden lg:flex lg:flex-col w-60 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-gradient">
          WrapCommand
        </h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Command Your Wrap Brand</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground hover:text-foreground hover:bg-white/5 transition-all rounded-lg border-l-3 border-transparent"
              activeClassName="text-foreground bg-white/5 border-l-primary"
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Pro Plan</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Active</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-primary shadow-glow"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};
