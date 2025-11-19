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
import ShopFlowInternal from "./pages/ShopFlowInternal";
import ShopFlowInternalList from "./pages/ShopFlowInternalList";
import { TrackJob } from "./modules/shopflow";
import TrackOrder from "./pages/TrackOrder";
import MightyCustomer from "./pages/MightyCustomer";
import ApproveFlow from "./pages/ApproveFlow";
import ApproveFlowList from "./pages/ApproveFlowList";
import CustomerPortal from "./pages/CustomerPortal";
import MightyMail from "./pages/MightyMail";
import MightyMailAdmin from "./pages/MightyMailAdmin";
import MightyMailQuotes from "./pages/MightyMailQuotes";
import MightyMailPerformance from "./pages/MightyMailPerformance";
import Portfolio from "./pages/Portfolio";
import ProductPricingAdmin from "./pages/ProductPricingAdmin";
import ProductAdmin from "./pages/ProductAdmin";
import DesignVaultAdmin from "./pages/DesignVaultAdmin";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import { AffiliateCard, AffiliateDashboard, AffiliateAdmin, AffiliateSignup } from "./modules/affiliate";
import AffiliatePayments from "./modules/affiliate/pages/AffiliatePayments";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <OrganizationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth" element={<Auth />} />
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
            <Route path="/shopflow-internal" element={<AppLayout><ShopFlowInternalList /></AppLayout>} />
            <Route path="/shopflow-internal/:id" element={<AppLayout><ShopFlowInternal /></AppLayout>} />
            <Route path="/track/:orderNumber" element={<TrackJob />} />
            <Route path="/track-order/:orderNumber" element={<TrackOrder />} />
            <Route path="/mighty-customer" element={<AppLayout><MightyCustomer /></AppLayout>} />
            <Route path="/approveflow" element={<AppLayout><ApproveFlowList /></AppLayout>} />
            <Route path="/approveflow/:projectId" element={<AppLayout><ApproveFlow /></AppLayout>} />
            <Route path="/customer/:projectId" element={<CustomerPortal />} />
            <Route path="/email-campaigns" element={<AppLayout><MightyMail /></AppLayout>} />
            <Route path="/admin/mightymail" element={<AppLayout><MightyMailAdmin /></AppLayout>} />
            <Route path="/admin/mightymail/quotes" element={<AppLayout><MightyMailQuotes /></AppLayout>} />
            <Route path="/admin/mightymail/performance" element={<AppLayout><MightyMailPerformance /></AppLayout>} />
            <Route path="/portfolio" element={<AppLayout><Portfolio /></AppLayout>} />
            <Route path="/admin/pricing" element={<AppLayout><ProductPricingAdmin /></AppLayout>} />
            <Route path="/admin/products" element={<AppLayout><ProductAdmin /></AppLayout>} />
            <Route path="/admin/designvault" element={<AppLayout><DesignVaultAdmin /></AppLayout>} />
            <Route path="/admin/users" element={<AppLayout><UserManagement /></AppLayout>} />
          <Route path="/affiliate/card/:affiliateCode" element={<AffiliateCard />} />
          <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
          <Route path="/affiliate/signup" element={<AffiliateSignup />} />
          <Route path="/affiliate/admin" element={<AppLayout><AffiliateAdmin /></AppLayout>} />
          <Route path="/affiliate/payments" element={<AppLayout><AffiliatePayments /></AppLayout>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </OrganizationProvider>
  </QueryClientProvider>
);

export default App;
