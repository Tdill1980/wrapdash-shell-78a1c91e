import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Route to label mapping for human-readable breadcrumb names
const routeLabels: Record<string, string> = {
  "dashboard": "Dashboard",
  "website-admin": "Website Admin",
  "approveflow": "ApproveFlow",
  "my-shopflow": "MyShopFlow",
  "shopflow-bulk-admin": "ShopFlow Bulk",
  "mighty-customer": "MightyCustomer",
  "portfolio": "MightyPortfolio",
  "organic": "Organic",
  "reel-builder": "Reel Builder",
  "studio": "Content Studio",
  "content-calendar": "Content Calendar",
  "content-drafts": "Content Drafts",
  "contentbox": "Media Library",
  "admin": "Admin",
  "mightymail": "MightyMail",
  "website-quotes": "Website Quotes",
  "website-agent": "Jordan Control",
  "vehicles": "Vehicle Admin",
  "organizations": "Organizations",
  "shopflow-internal": "ShopFlow Internal",
  "designvault": "DesignVault",
  "designpanel": "DesignPanelPro",
  "monthly-drops": "Monthly Drops",
  "trade-dna": "TradeDNA Wizard",
  "affiliate": "Affiliate",
  "settings": "Settings",
  "my-products": "My Products",
};

export const AppBreadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Don't show breadcrumb on dashboard (root)
  if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === "dashboard")) {
    return null;
  }

  // Build breadcrumb items
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    const isLast = index === pathSegments.length - 1;

    return {
      path,
      label,
      isLast,
    };
  });

  return (
    <div className="bg-[#0D0F12] px-4 sm:px-6 py-2 border-b border-white/5">
      <Breadcrumb>
        <BreadcrumbList className="text-sm">
          {/* Root - WrapCommandAI branding */}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span className="font-['Poppins',sans-serif] font-bold text-xs">
                  <span className="text-white">Wrap</span>
                  <span className="bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] bg-clip-text text-transparent">
                    Command
                  </span>
                  <span className="text-cyan-300">AI</span>
                  <span className="text-[6px] align-super text-muted-foreground">™</span>
                </span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {breadcrumbItems.map((item) => (
            <React.Fragment key={item.path}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5 text-white/30" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {item.isLast ? (
                  <BreadcrumbPage className="text-foreground font-medium">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      to={item.path}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
