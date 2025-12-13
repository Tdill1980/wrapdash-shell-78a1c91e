import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { WebsiteChatWidget } from "@/components/chat/WebsiteChatWidget";
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
import MightyMailAI from "./pages/MightyMailAI";
import AIPipeline from "./pages/AIPipeline";
import ContentBox from "./pages/ContentBox";
import ContentSchedule from "./pages/ContentSchedule";
import ContentCreator from "./pages/ContentCreator";
import MightyChat from "./pages/MightyChat";
import Portfolio from "./pages/Portfolio";
import MightyTasks from "./pages/MightyTasks";
import TradeDNA from "./pages/TradeDNA";
import ProductPricingAdmin from "./pages/ProductPricingAdmin";
import ProductAdmin from "./pages/ProductAdmin";
import DesignVaultAdmin from "./pages/DesignVaultAdmin";
import DashboardHeroAdmin from "./pages/DashboardHeroAdmin";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import { AffiliateCard, AffiliateDashboard, AffiliateAdmin, AffiliateSignup } from "./modules/affiliate";
import AffiliatePayments from "./modules/affiliate/pages/AffiliatePayments";
import AffiliateContentUpload from "./modules/affiliate/pages/ContentUpload";
import { AffiliateOnboarding } from "./modules/affiliate/pages/AffiliateOnboarding";
import VehicleAdmin from "./modules/vehicle-admin";
import DesignGenerator from "./modules/designpanelpro-enterprise/pages/DesignGenerator";
import WebsiteAgentAdmin from "./pages/WebsiteAgentAdmin";
import InstagramTokenExchange from "./pages/InstagramTokenExchange";
import AICorrectionsAdmin from "./pages/AICorrectionsAdmin";
import AdVault from "./pages/AdVault";
import PaidAdsPerformance from "./pages/PaidAdsPerformance";
import OrganicHub from "./pages/OrganicHub";
import ReelBuilder from "./pages/organic/ReelBuilder";
import InspirationHub from "./pages/organic/InspirationHub";
import AutoSplit from "./pages/organic/AutoSplit";
import StaticCreator from "./pages/organic/StaticCreator";
import Atomizer from "./pages/organic/Atomizer";
import YouTubeEditor from "./pages/organic/YouTubeEditor";
import MyProducts from "./pages/settings/MyProducts";
import { AppLayout } from "./layouts/AppLayout";

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
            <Route path="/designpanelpro-enterprise" element={<DesignPanelProEnterprise />} />
            <Route path="/fadewraps" element={<FadeWraps />} />
            <Route path="/wbty" element={<WBTY />} />
            <Route path="/designvault" element={<DesignVault />} />
            <Route path="/designvault/upload" element={<DesignVaultUpload />} />
            <Route path="/wrapbox" element={<WrapBox />} />
            <Route path="/monthly-drops" element={<MonthlyDrops />} />
            <Route path="/design-market" element={<DesignMarket />} />
            <Route path="/shopflow" element={<ShopFlow />} />
            <Route path="/shopflow-internal" element={<ShopFlowInternalList />} />
            <Route path="/shopflow-bulk-admin" element={<ShopFlowBulkAdmin />} />
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
            <Route path="/mightymail-ai" element={<MightyMailAI />} />
            <Route path="/ai-pipeline" element={<AIPipeline />} />
            <Route path="/mightychat" element={<MightyChat />} />
            <Route path="/contentbox" element={<ContentBox />} />
            <Route path="/content-creator" element={<ContentCreator />} />
            <Route path="/content-schedule" element={<ContentSchedule />} />
            <Route path="/organic" element={<OrganicHub />} />
            <Route path="/organic/reel-builder" element={<ReelBuilder />} />
            <Route path="/organic/inspo" element={<InspirationHub />} />
            <Route path="/organic/auto-split" element={<AutoSplit />} />
            <Route path="/organic/static" element={<StaticCreator />} />
            <Route path="/organic/atomizer" element={<Atomizer />} />
            <Route path="/organic/youtube-editor" element={<YouTubeEditor />} />
            <Route path="/ad-vault" element={<AdVault />} />
            <Route path="/paid-ads-performance" element={<PaidAdsPerformance />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/tasks" element={<MightyTasks />} />
            <Route path="/tradedna" element={<TradeDNA />} />
            <Route path="/admin/pricing" element={<ProductPricingAdmin />} />
            <Route path="/admin/products" element={<ProductAdmin />} />
            <Route path="/admin/designvault" element={<DesignVaultAdmin />} />
            <Route path="/admin/dashboard-hero" element={<DashboardHeroAdmin />} />
            <Route path="/admin/website-agent" element={<WebsiteAgentAdmin />} />
            <Route path="/admin/vehicles" element={<VehicleAdmin />} />
            <Route path="/admin/ai-corrections" element={<AICorrectionsAdmin />} />
          <Route path="/design-generator" element={
            <AppLayout>
              <DesignGenerator />
            </AppLayout>
          } />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/settings/products" element={<MyProducts />} />
            <Route path="/affiliate/card/:affiliateCode" element={<AffiliateCard />} />
            <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
            <Route path="/affiliate/signup" element={<AffiliateSignup />} />
            <Route path="/affiliate/onboarding" element={<AffiliateOnboarding />} />
            <Route path="/affiliate/upload" element={<AffiliateContentUpload />} />
            <Route path="/affiliate/admin" element={<AffiliateAdmin />} />
            <Route path="/affiliate/payments" element={<AffiliatePayments />} />
            <Route path="/instagram-token" element={<InstagramTokenExchange />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <WebsiteChatWidget />
        </BrowserRouter>
      </TooltipProvider>
    </OrganizationProvider>
  </QueryClientProvider>
);

export default App;
