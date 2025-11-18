import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { AppLayout } from "@/layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import { Visualize as WrapCloser } from "./modules/designproai";
import { DesignVault } from "./modules/designvault";
import DesignVaultUpload from "./pages/DesignVaultUpload";
import { WrapBox } from "./modules/wrapbox";
import MonthlyDrops from "./pages/MonthlyDrops";
import DesignMarket from "./pages/DesignMarket";
import ShopFlow from "./pages/ShopFlow";
import ShopFlowJob from "./pages/ShopFlowJob";
import MightyCustomer from "./pages/MightyCustomer";
import ApproveFlow from "./pages/ApproveFlow";
import ApproveFlowList from "./pages/ApproveFlowList";
import CustomerPortal from "./pages/CustomerPortal";
import MightyMail from "./pages/MightyMail";
import Portfolio from "./pages/Portfolio";
import ProductPricingAdmin from "./pages/ProductPricingAdmin";
import DesignVaultAdmin from "./pages/DesignVaultAdmin";
import Auth from "./pages/Auth";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <OrganizationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/wrapcloser" element={<AppLayout><WrapCloser /></AppLayout>} />
            <Route path="/designvault" element={<AppLayout><DesignVault /></AppLayout>} />
            <Route path="/designvault/upload" element={<AppLayout><DesignVaultUpload /></AppLayout>} />
            <Route path="/wrapbox" element={<AppLayout><WrapBox /></AppLayout>} />
            <Route path="/monthly-drops" element={<AppLayout><MonthlyDrops /></AppLayout>} />
            <Route path="/design-market" element={<AppLayout><DesignMarket /></AppLayout>} />
            <Route path="/shopflow" element={<AppLayout><ShopFlow /></AppLayout>} />
            <Route path="/shopflow/:id" element={<AppLayout><ShopFlowJob /></AppLayout>} />
            <Route path="/mighty-customer" element={<AppLayout><MightyCustomer /></AppLayout>} />
            <Route path="/approveflow" element={<AppLayout><ApproveFlowList /></AppLayout>} />
            <Route path="/approveflow/:projectId" element={<AppLayout><ApproveFlow /></AppLayout>} />
            <Route path="/customer/:projectId" element={<CustomerPortal />} />
            <Route path="/email-campaigns" element={<AppLayout><MightyMail /></AppLayout>} />
            <Route path="/portfolio" element={<AppLayout><Portfolio /></AppLayout>} />
            <Route path="/admin/pricing" element={<AppLayout><ProductPricingAdmin /></AppLayout>} />
            <Route path="/admin/designvault" element={<AppLayout><DesignVaultAdmin /></AppLayout>} />
            <Route path="/admin/users" element={<AppLayout><UserManagement /></AppLayout>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </OrganizationProvider>
  </QueryClientProvider>
);

export default App;
