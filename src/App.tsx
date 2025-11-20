import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import Dashboard from "./pages/Dashboard";
import { Visualize as WrapCloser, InkFusion, DesignPanelPro, FadeWraps, WBTY } from "./modules/designproai";
import { DesignVault } from "./modules/designvault";
import DesignVaultUpload from "./pages/DesignVaultUpload";
import { WrapBox } from "./modules/wrapbox";
import MonthlyDrops from "./pages/MonthlyDrops";
import DesignMarket from "./pages/DesignMarket";
import ShopFlow from "./pages/ShopFlow";
import ShopFlowInternal from "./pages/ShopFlowInternal";
import ShopFlowInternalList from "./pages/ShopFlowInternalList";
import { TrackJob } from "./modules/shopflow";
import MyShopFlow from "./pages/MyShopFlow";
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/wrapcloser" element={<WrapCloser />} />
            <Route path="/inkfusion" element={<InkFusion />} />
            <Route path="/designpanel" element={<DesignPanelPro />} />
            <Route path="/fadewraps" element={<FadeWraps />} />
            <Route path="/wbty" element={<WBTY />} />
            <Route path="/designvault" element={<DesignVault />} />
            <Route path="/designvault/upload" element={<DesignVaultUpload />} />
            <Route path="/wrapbox" element={<WrapBox />} />
            <Route path="/monthly-drops" element={<MonthlyDrops />} />
            <Route path="/design-market" element={<DesignMarket />} />
            <Route path="/shopflow" element={<ShopFlow />} />
            <Route path="/shopflow-internal" element={<ShopFlowInternalList />} />
            <Route path="/shopflow-internal/:id" element={<ShopFlowInternal />} />
            <Route path="/track/:orderNumber" element={<TrackJob />} />
            <Route path="/my-shopflow" element={<MyShopFlow />} />
            <Route path="/mighty-customer" element={<MightyCustomer />} />
            <Route path="/approveflow" element={<ApproveFlowList />} />
            <Route path="/approveflow/:projectId" element={<ApproveFlow />} />
            <Route path="/customer/:projectId" element={<CustomerPortal />} />
            <Route path="/email-campaigns" element={<MightyMail />} />
            <Route path="/admin/mightymail" element={<MightyMailAdmin />} />
            <Route path="/admin/mightymail/quotes" element={<MightyMailQuotes />} />
            <Route path="/admin/mightymail/performance" element={<MightyMailPerformance />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/admin/pricing" element={<ProductPricingAdmin />} />
            <Route path="/admin/products" element={<ProductAdmin />} />
            <Route path="/admin/designvault" element={<DesignVaultAdmin />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/affiliate/card/:affiliateCode" element={<AffiliateCard />} />
            <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
            <Route path="/affiliate/signup" element={<AffiliateSignup />} />
            <Route path="/affiliate/admin" element={<AffiliateAdmin />} />
            <Route path="/affiliate/payments" element={<AffiliatePayments />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </OrganizationProvider>
  </QueryClientProvider>
);

export default App;
