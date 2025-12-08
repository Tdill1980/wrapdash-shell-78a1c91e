import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import { Visualize as WrapCloser, InkFusion, DesignPanelPro, FadeWraps, WBTY } from "./modules/designproai";
import DesignPanelProEnterprise from "./modules/designpanelpro-enterprise";
import { DesignVault } from "./modules/designvault";
import DesignVaultUpload from "./pages/DesignVaultUpload";
import { WrapBox } from "./modules/wrapbox";
import MonthlyDrops from "./pages/MonthlyDrops";
import DesignMarket from "./pages/DesignMarket";
import ShopFlow from "./pages/ShopFlow";
import ShopFlowInternalList from "./pages/ShopFlowInternalList";
import ShopFlowBulkAdmin from "./pages/ShopFlowBulkAdmin";
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
import DashboardHeroAdmin from "./pages/DashboardHeroAdmin";
import Auth from "./pages/Auth";
import ComingSoon from "./pages/ComingSoon";
import Signup from "./pages/Signup";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import { AffiliateCard, AffiliateDashboard, AffiliateAdmin, AffiliateSignup } from "./modules/affiliate";
import AffiliatePayments from "./modules/affiliate/pages/AffiliatePayments";
import VehicleAdmin from "./modules/vehicle-admin";
import DesignGenerator from "./modules/designpanelpro-enterprise/pages/DesignGenerator";
import { AppLayout } from "./layouts/AppLayout";
import MightyChat from "./pages/MightyChat";
import PortfolioUpload from "./pages/PortfolioUpload";
import MightyMailTemplates from "./pages/MightyMailTemplates";
import MightyMailTemplateEditor from "./pages/MightyMailTemplateEditor";
import TradeDNA from "./pages/TradeDNA";
import TradeDNAEdit from "./pages/TradeDNAEdit";
import ChatbotScripts from "./pages/ChatbotScripts";
import LeadGeneratorPage from "./pages/LeadGenerator";
import InstagramBot from "./pages/InstagramBot";
import Orchestrator from "./pages/Orchestrator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <OrganizationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/affiliate/card/:affiliateCode" element={<AffiliateCard />} />
            <Route path="/affiliate/signup" element={<AffiliateSignup />} />
            <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
            <Route path="/affiliate/admin" element={<AffiliateAdmin />} />
            <Route path="/affiliate/payments" element={<AffiliatePayments />} />
            <Route path="/customer/:projectId" element={<CustomerPortal />} />
            <Route path="/track/:orderNumber" element={<TrackJob />} />
            <Route path="/my-shopflow" element={<MyShopFlow />} />
            <Route path="/portfolio/upload/:uploadToken" element={<PortfolioUpload />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/mightychat" element={<ProtectedRoute><MightyChat /></ProtectedRoute>} />
            <Route path="/wrapcloser" element={<ProtectedRoute><WrapCloser /></ProtectedRoute>} />
            <Route path="/inkfusion" element={<ProtectedRoute><InkFusion /></ProtectedRoute>} />
            <Route path="/designpanel" element={<ProtectedRoute><DesignPanelPro /></ProtectedRoute>} />
            <Route path="/designpanelpro-enterprise" element={<ProtectedRoute><DesignPanelProEnterprise /></ProtectedRoute>} />
            <Route path="/fadewraps" element={<ProtectedRoute><FadeWraps /></ProtectedRoute>} />
            <Route path="/wbty" element={<ProtectedRoute><WBTY /></ProtectedRoute>} />
            <Route path="/designvault" element={<ProtectedRoute><DesignVault /></ProtectedRoute>} />
            <Route path="/designvault/upload" element={<ProtectedRoute><DesignVaultUpload /></ProtectedRoute>} />
            <Route path="/wrapbox" element={<ProtectedRoute><WrapBox /></ProtectedRoute>} />
            <Route path="/monthly-drops" element={<ProtectedRoute><MonthlyDrops /></ProtectedRoute>} />
            <Route path="/design-market" element={<ProtectedRoute><DesignMarket /></ProtectedRoute>} />
            <Route path="/shopflow" element={<ProtectedRoute><ShopFlow /></ProtectedRoute>} />
            <Route path="/shopflow-internal" element={<ProtectedRoute><ShopFlowInternalList /></ProtectedRoute>} />
            <Route path="/shopflow-bulk-admin" element={<ProtectedRoute><ShopFlowBulkAdmin /></ProtectedRoute>} />
            <Route path="/mighty-customer" element={<ProtectedRoute><MightyCustomer /></ProtectedRoute>} />
            <Route path="/approveflow" element={<ProtectedRoute><ApproveFlowList /></ProtectedRoute>} />
            <Route path="/approveflow/:projectId" element={<ProtectedRoute><ApproveFlow /></ProtectedRoute>} />
            <Route path="/email-campaigns" element={<ProtectedRoute><MightyMail /></ProtectedRoute>} />
            <Route path="/admin/mightymail" element={<ProtectedRoute><MightyMailAdmin /></ProtectedRoute>} />
            <Route path="/admin/mightymail/quotes" element={<ProtectedRoute><MightyMailQuotes /></ProtectedRoute>} />
            <Route path="/admin/mightymail/performance" element={<ProtectedRoute><MightyMailPerformance /></ProtectedRoute>} />
            <Route path="/admin/mightymail/templates" element={<ProtectedRoute><MightyMailTemplates /></ProtectedRoute>} />
            <Route path="/admin/mightymail/templates/new" element={<ProtectedRoute><MightyMailTemplateEditor /></ProtectedRoute>} />
            <Route path="/admin/mightymail/templates/:templateId" element={<ProtectedRoute><MightyMailTemplateEditor /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/admin/pricing" element={<ProtectedRoute><ProductPricingAdmin /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute><ProductAdmin /></ProtectedRoute>} />
            <Route path="/admin/designvault" element={<ProtectedRoute><DesignVaultAdmin /></ProtectedRoute>} />
            <Route path="/admin/dashboard-hero" element={<ProtectedRoute><DashboardHeroAdmin /></ProtectedRoute>} />
            <Route path="/admin/vehicles" element={<ProtectedRoute><VehicleAdmin /></ProtectedRoute>} />
            <Route path="/design-generator" element={
              <ProtectedRoute>
                <AppLayout>
                  <DesignGenerator />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/tradedna" element={<ProtectedRoute><TradeDNA /></ProtectedRoute>} />
            <Route path="/tradedna/edit" element={<ProtectedRoute><TradeDNAEdit /></ProtectedRoute>} />
            <Route path="/tradedna/chatbot" element={<ProtectedRoute><ChatbotScripts /></ProtectedRoute>} />
            <Route path="/lead-generator" element={<ProtectedRoute><LeadGeneratorPage /></ProtectedRoute>} />
            <Route path="/instagram-bot" element={<ProtectedRoute><InstagramBot /></ProtectedRoute>} />
            <Route path="/orchestrator" element={<ProtectedRoute><Orchestrator /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </OrganizationProvider>
  </QueryClientProvider>
);

export default App;
