import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  Package,
  Calendar,
  CalendarDays,
  Send,
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
  Film,
  Image,
  BarChart3,
  Sparkles as SparklesIcon,
  MessageSquare,
} from "lucide-react";
import logo from "@/assets/wrapcommand-logo-new.png";
import { useUserRole, OrganizationRole } from "@/hooks/useUserRole";

interface NavigationItem {
  name: string;
  path: string;
  icon: any;
  customRender?: React.ReactNode;
  roles?: OrganizationRole[]; // If undefined, only admin sees it
}

const navigationItems: NavigationItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["beta_shop", "affiliate", "admin"] },
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
  { name: "ApproveFlow", path: "/approveflow", icon: CheckCircle, roles: ["beta_shop", "admin"] },
  { name: "DesignVault", path: "/designvault", icon: FolderOpen },
  { name: "WrapBox", path: "/wrapbox", icon: Package },
  { name: "Monthly Drops", path: "/monthly-drops", icon: Calendar },
  { name: "Design Market", path: "/design-market", icon: Store },
  { 
    name: "ShopFlow", 
    path: "/my-shopflow", 
    icon: ShoppingCart,
    roles: ["beta_shop", "admin"],
    customRender: (
      <span className="font-medium text-gradient">ShopFlow</span>
    )
  },
  { 
    name: "ShopFlow Internal", 
    path: "/shopflow-internal", 
    icon: Package,
    roles: ["beta_shop", "admin"],
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
    roles: ["beta_shop", "admin"],
    customRender: (
      <span className="font-medium">
        <span className="text-white">Shop</span>
        <span className="text-gradient">Flow</span>
        <span className="text-white"> Bulk</span>
      </span>
    )
  },
  { name: "MightyCustomer", path: "/mighty-customer", icon: Users, roles: ["beta_shop", "admin"] },
  { 
    name: "MightyChat", 
    path: "/mightychat", 
    icon: MessageSquare,
    roles: ["beta_shop", "admin"],
    customRender: (
      <span className="font-['Poppins',sans-serif] font-semibold">
        <span className="text-white">Mighty</span>
        <span className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">Chat</span>
        <span className="text-[8px] align-super text-muted-foreground">™</span>
      </span>
    )
  },
  { 
    name: "MightyTask", 
    path: "/tasks", 
    icon: CheckCircle,
    roles: ["beta_shop", "admin"],
    customRender: (
      <span className="font-['Poppins',sans-serif] font-semibold">
        <span className="text-white">Mighty</span>
        <span className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">Task</span>
        <span className="text-[8px] align-super text-muted-foreground">™</span>
      </span>
    )
  },
  { name: "📕 Ink & Edge Magazine", path: "/mightytask/ink-edge-magazine", icon: CheckCircle, roles: ["admin"] },
  { name: "💰 WPW Campaigns", path: "/mightytask/wpw-campaigns", icon: CheckCircle, roles: ["admin"] },
  { name: "📰 Ink & Edge Dist", path: "/mightytask/ink-edge-distribution", icon: CheckCircle, roles: ["admin"] },
  { name: "🎥 WrapTVWorld", path: "/mightytask/wraptvworld", icon: CheckCircle, roles: ["admin"] },
  { name: "🟢 Luigi Chat", path: "/mightytask/luigi", icon: MessageSquare, roles: ["admin"] },
  { 
    name: "MightyPortfolio", 
    path: "/portfolio", 
    icon: Briefcase, 
    roles: ["beta_shop", "admin"],
    customRender: (
      <span className="font-['Poppins',sans-serif] font-semibold">
        <span className="text-white">Mighty</span>
        <span className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">Portfolio</span>
        <span className="text-[8px] align-super text-muted-foreground">™</span>
      </span>
    )
  },
  { name: "My Products", path: "/settings/my-products", icon: DollarSign, roles: ["beta_shop", "admin"] },
  { name: "Settings", path: "/settings", icon: Settings, roles: ["beta_shop", "affiliate", "admin"] },
  { 
    name: "ContentBox AI", 
    path: "/contentbox", 
    icon: Film,
    roles: ["beta_shop", "affiliate", "admin"],
    customRender: (
      <span className="font-medium">
        <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">ContentBox</span>
        <span className="text-white"> AI</span>
        <span className="text-[8px] align-super text-muted-foreground">™</span>
      </span>
    )
  },
  { 
    name: "Content Calendar", 
    path: "/content-calendar", 
    icon: CalendarDays,
    roles: ["beta_shop", "admin"],
    customRender: (
      <span className="font-medium">
        <span className="text-white">Content </span>
        <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Calendar</span>
      </span>
    )
  },
  { 
    name: "Organic Hub", 
    path: "/organic", 
    icon: SparklesIcon,
    customRender: (
      <span className="font-medium">
        <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Organic</span>
        <span className="text-white"> Hub</span>
      </span>
    )
  },
  { 
    name: "MightyEdit", 
    path: "/mighty-edit", 
    icon: Film,
    roles: ["admin"],
    customRender: (
      <span className="font-medium">
        <span className="text-primary">Mighty</span>
        <span className="text-white">Edit</span>
      </span>
    )
  },
  {
    name: "Ad Vault", 
    path: "/ad-vault", 
    icon: Image,
    customRender: (
      <span className="font-medium">
        <span className="text-white">Ad </span>
        <span className="bg-gradient-to-r from-[#405DE6] to-[#E1306C] bg-clip-text text-transparent">Vault</span>
      </span>
    )
  },
  { 
    name: "Paid Ads Performance", 
    path: "/paid-ads-performance", 
    icon: BarChart3,
    customRender: (
      <span className="font-medium">
        <span className="text-white">Paid Ads </span>
        <span className="bg-gradient-to-r from-[#405DE6] to-[#E1306C] bg-clip-text text-transparent">Performance</span>
      </span>
    )
  },
  { 
    name: "Affiliate Dashboard", 
    path: "/affiliate/dashboard", 
    icon: TrendingUp,
    roles: ["affiliate", "admin"],
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
    roles: ["beta_shop", "admin"],
    customRender: (
      <span className="font-['Poppins',sans-serif] font-semibold">
        <span className="text-white">Mighty</span>
        <span className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">Mail</span>
        <span className="text-[8px] align-super text-muted-foreground">™</span>
      </span>
    )
  },
  { 
    name: "Campaign Sender", 
    path: "/mightymail/campaign-sender", 
    icon: Send,
    roles: ["beta_shop", "admin"],
    customRender: (
      <span className="font-['Poppins',sans-serif] font-semibold">
        <span className="text-white">Campaign </span>
        <span className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">Sender</span>
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
  { name: "Organizations", path: "/admin/organizations", icon: Users },
];

export const Sidebar = ({ onMobileClose }: { onMobileClose?: () => void }) => {
  const { role, isLoading } = useUserRole();

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter((item) => {
    // If no roles specified, only admin can see it
    if (!item.roles) {
      return role === "admin";
    }
    // Check if user's role is in the allowed roles
    return item.roles.includes(role);
  });

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
        {filteredNavItems.map((item) => {
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
              {item.customRender || <span className="font-medium">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">
                {role === "admin" ? "Admin" : role === "affiliate" ? "Affiliate" : "Pro Plan"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Active</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-primary shadow-glow"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};
