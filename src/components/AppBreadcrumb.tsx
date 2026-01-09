import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

// Route labels mapping for human-readable breadcrumb names
const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/jordan-lee-admin": "Website Chat",
  "/approveflow": "ApproveFlow",
  "/approveflow-console": "ApproveFlow Console",
  "/shopflow": "ShopFlow",
  "/shopflow-analytics": "ShopFlow Analytics",
  "/content-studio": "Content Studio",
  "/content-calendar": "Content Calendar",
  "/content-tools": "Content Tools",
  "/mighty-mail": "MightyMail",
  "/admin/mightymail": "MightyMail Admin",
  "/settings": "Settings",
  "/auth": "Sign In",
  "/quote-review": "Quote Review",
  "/affiliate": "Affiliate Portal",
  "/visualizer": "Visualizer",
  "/installer-locator": "Installer Locator",
  "/ai-creative-studio": "AI Creative Studio",
  "/ad-performance": "Ad Performance",
  "/chat-analytics": "Chat Analytics",
};

export const AppBreadcrumb = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Get the current route label
  const currentLabel = routeLabels[pathname] || pathname.split("/").pop()?.replace(/-/g, " ") || "Page";

  // Don't show breadcrumb on dashboard itself
  const isDashboard = pathname === "/dashboard" || pathname === "/";

  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
      {/* Root - WrapCommandAI branding always links to dashboard */}
      <Link 
        to="/dashboard" 
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity group"
      >
        <Home className="h-3.5 w-3.5 text-muted-foreground group-hover:text-white transition-colors" />
        <span className="font-['Poppins',sans-serif] font-bold text-xs sm:text-sm">
          <span className="text-white">Wrap</span>
          <span className="bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] bg-clip-text text-transparent">
            Command
          </span>
          <span className="text-cyan-300">AI</span>
          <span className="text-[6px] sm:text-[8px] align-super text-muted-foreground">™</span>
        </span>
      </Link>

      {/* Only show separator and current page if not on dashboard */}
      {!isDashboard && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
          <span className="text-muted-foreground font-medium capitalize truncate max-w-[200px]">
            {currentLabel}
          </span>
        </>
      )}
    </nav>
  );
};
