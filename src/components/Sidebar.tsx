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
  Award,
  DollarSign,
  Settings,
  Mail,
  TrendingUp,
  Car,
} from "lucide-react";
import logo from "@/assets/wrapcommand-logo-new.png";

const navigationItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { 
    name: "InkFusion™", 
    path: "/inkfusion", 
    icon: Sparkles,
    customRender: (
      <span className="font-medium">
        <span className="text-white">Ink</span>
        <span className="text-gradient">Fusion</span>
        <span className="text-[8px] align-super text-muted-foreground">™</span>
      </span>
    )
  },
  { 
    name: "DesignPanelPro™", 
    path: "/designpanel", 
    icon: Sparkles,
    customRender: (
      <span className="font-medium">
        <span className="text-white">Design</span>
        <span className="text-gradient">Panel</span>
        <span className="text-white">Pro</span>
        <span className="text-[8px] align-super text-muted-foreground">™</span>
      </span>
    )
  },
  { 
    name: "DesignPanelPro Enterprise™", 
    path: "/designpanelpro-enterprise", 
    icon: Sparkles,
    customRender: (
      <span className="font-medium">
        <span className="text-white">Design</span>
        <span className="text-gradient">Panel</span>
        <span className="text-white">Pro</span>
        <span className="text-white"> Enterprise</span>
        <span className="text-[8px] align-super text-muted-foreground">™</span>
      </span>
    )
  },
  { 
    name: "Design Generator™", 
    path: "/design-generator", 
    icon: Sparkles,
    customRender: (
      <span className="font-medium">
        <span className="text-white">Design</span>
        <span className="text-gradient">Generator</span>
        <span className="text-[8px] align-super text-muted-foreground">™</span>
      </span>
    )
  },
  { 
    name: "FadeWraps™", 
    path: "/fadewraps", 
    icon: Sparkles,
    customRender: (
      <span className="font-medium">
        <span className="text-white">Fade</span>
        <span className="text-gradient">Wraps</span>
        <span className="text-[8px] align-super text-muted-foreground">™</span>
      </span>
    )
  },
  { 
    name: "WBTY™", 
    path: "/wbty", 
    icon: Sparkles,
    customRender: (
      <span className="font-medium text-gradient">WBTY™</span>
    )
  },
  { name: "ApproveFlow", path: "/approveflow", icon: CheckCircle },
  { name: "DesignVault", path: "/designvault", icon: FolderOpen },
  { name: "WrapBox", path: "/wrapbox", icon: Package },
  { name: "Monthly Drops", path: "/monthly-drops", icon: Calendar },
  { name: "Design Market", path: "/design-market", icon: Store },
  { 
    name: "ShopFlow", 
    path: "/my-shopflow", 
    icon: ShoppingCart,
    customRender: (
      <span className="font-medium text-gradient">ShopFlow</span>
    )
  },
  { 
    name: "ShopFlow Internal", 
    path: "/shopflow-internal", 
    icon: Package,
    customRender: (
      <span className="font-medium">
        <span className="text-white">Shop</span>
        <span className="text-gradient">Flow</span>
        <span className="text-white"> Internal</span>
      </span>
    )
  },
  { 
    name: "ShopFlow Bulk Admin", 
    path: "/shopflow-bulk-admin", 
    icon: Package,
    customRender: (
      <span className="font-medium">
        <span className="text-white">Shop</span>
        <span className="text-gradient">Flow</span>
        <span className="text-white"> Bulk</span>
      </span>
    )
  },
  { name: "MightyCustomer", path: "/mighty-customer", icon: Users },
  { name: "Portfolio", path: "/portfolio", icon: Briefcase },
  { 
    name: "Affiliate Dashboard", 
    path: "/affiliate/dashboard", 
    icon: TrendingUp,
    customRender: (
      <span className="font-['Poppins',sans-serif] font-semibold">
        <span className="text-white">Affiliate </span>
        <span className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">Dashboard</span>
      </span>
    )
  },
  { 
    name: "MightyAffiliate", 
    path: "/affiliate/admin", 
    icon: Award,
    customRender: (
      <span className="font-['Poppins',sans-serif] font-semibold">
        <span className="text-white">Mighty</span>
        <span className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">Affiliate</span>
      </span>
    )
  },
  { name: "Affiliate Payments", path: "/affiliate/payments", icon: DollarSign },
  { 
    name: "MightyMail", 
    path: "/admin/mightymail", 
    icon: Mail,
    customRender: (
      <span className="font-['Poppins',sans-serif] font-semibold">
        <span className="text-white">Mighty</span>
        <span className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">Mail</span>
        <span className="text-[8px] align-super text-muted-foreground">™</span>
      </span>
    )
  },
  { 
    name: "MM Quotes", 
    path: "/admin/mightymail/quotes", 
    icon: Mail
  },
  { name: "Product Admin", path: "/admin/products", icon: Settings },
  { name: "Dashboard Hero", path: "/admin/dashboard-hero", icon: Settings },
  { name: "Vehicle Admin", path: "/admin/vehicles", icon: Car },
];

export const Sidebar = ({ onMobileClose }: { onMobileClose?: () => void }) => {
  return (
    <aside className="flex flex-col w-full h-full bg-sidebar border-r border-sidebar-border">
      <div className="px-3 py-8 border-b border-sidebar-border">
        <img 
          src={logo} 
          alt="WrapCommand AI" 
          className="w-full h-24 object-contain" 
        />
      </div>
      
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onMobileClose?.()}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground hover:text-foreground hover:bg-white/5 transition-all rounded-lg relative"
              activeClassName="text-foreground bg-white/5 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-gradient-primary before:rounded-r"
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {(item as any).customRender || <span className="font-medium">{item.name}</span>}
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
