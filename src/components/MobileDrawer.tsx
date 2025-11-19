import { NavLink } from "@/components/NavLink";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  { name: "ShopFlow Internal", path: "/shopflow-internal/3a4c250d-a66b-4f13-a524-99b4bf2bb0b9", icon: ShoppingCart },
  { name: "MightyCustomer", path: "/mighty-customer", icon: Users },
  { name: "ApproveFlow", path: "/approveflow", icon: CheckCircle },
  { name: "Portfolio", path: "/portfolio", icon: Briefcase },
];

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileDrawer = ({ open, onOpenChange }: MobileDrawerProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex flex-col h-full w-64 bg-sidebar p-0">
        <SheetHeader className="p-6 border-b border-sidebar-border">
          <SheetTitle className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
            WrapCommand
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
                activeClassName="bg-gradient-purple text-white shadow-lg shadow-primary/20"
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
