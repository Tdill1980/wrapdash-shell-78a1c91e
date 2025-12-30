import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { LuigiWebsiteWidget } from "@/components/chat/LuigiWebsiteWidget";
import { IssueReporter } from "@/components/IssueReporter";
import Dashboard from "./pages/Dashboard";
import IssuesDashboard from "./pages/IssuesDashboard";
import { Visualize as WrapCloser, InkFusion, DesignPanelPro, FadeWraps, WBTY } from "./modules/designproai";
import DesignPanelProEnterprise from "./modules/designpanelpro-enterprise";
import { DesignVault } from "./modules/designvault";
import DesignVaultUpload from "./pages/DesignVaultUpload";
import { WrapBox } from "./modules/wrapbox";
import MonthlyDrops from "./pages/MonthlyDrops";
import DesignMarket from "./pages/DesignMarket";
import ShopFlow from "./pages/ShopFlow";
import ShopFlowDetail from "./pages/ShopFlowDetail";
import ShopFlowInternalList from "./pages/ShopFlowInternalList";
import ShopFlowBulkAdmin from "./pages/ShopFlowBulkAdmin";
import { TrackJob } from "./modules/shopflow";
import MyShopFlow from "./pages/MyShopFlow";
import MightyCustomer from "./pages/MightyCustomer";
import ApproveFlow from "./pages/ApproveFlow";
import ApproveFlowList from "./pages/ApproveFlowList";
import ApproveFlowProof from "./pages/ApproveFlowProof";
import CustomerPortal from "./pages/CustomerPortal";
import MightyMail from "./pages/MightyMail";
import MightyMailAdmin from "./pages/MightyMailAdmin";
import MightyMailQuotes from "./pages/MightyMailQuotes";
import MightyMailPerformance from "./pages/MightyMailPerformance";
import MightyMailAI from "./pages/MightyMailAI";
import MightyMailWinback from "./pages/MightyMailWinback";
import MightyMailCampaignSender from "./pages/MightyMailCampaignSender";
import AIPipeline from "./pages/AIPipeline";
import ContentBox from "./pages/ContentBox";
import ContentSchedule from "./pages/ContentSchedule";
import ContentCalendar30Day from "./pages/ContentCalendar30Day";
import ContentCreator from "./pages/ContentCreator";
import MightyChat from "./pages/MightyChat";
import MightyChatV2 from "./pages/MightyChatV2";
import Portfolio from "./pages/Portfolio";
import MightyTasks from "./pages/MightyTasks";
import MightyTaskUnified from "./pages/MightyTaskUnified";
import TradeDNA from "./pages/TradeDNA";
import ProductPricingAdmin from "./pages/ProductPricingAdmin";
import ProductAdmin from "./pages/ProductAdmin";
import DesignVaultAdmin from "./pages/DesignVaultAdmin";
import DashboardHeroAdmin from "./pages/DashboardHeroAdmin";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import BetaSignup from "./pages/BetaSignup";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import { AffiliateCard, AffiliateDashboard, AffiliateAdmin, AffiliateSignup } from "./modules/affiliate";
import AffiliatePayments from "./modules/affiliate/pages/AffiliatePayments";
import AffiliateContentUpload from "./modules/affiliate/pages/ContentUpload";
import { AffiliateOnboarding } from "./modules/affiliate/pages/AffiliateOnboarding";
import VehicleAdmin from "./modules/vehicle-admin";
import DesignGenerator from "./modules/designpanelpro-enterprise/pages/DesignGenerator";
import WebsiteAgentAdmin from "./pages/WebsiteAgentAdmin";
import JordanLeeAdminDashboard from "./pages/JordanLeeAdminDashboard";
import ChatWidgetDemo from "./pages/ChatWidgetDemo";
import InstagramTokenExchange from "./pages/InstagramTokenExchange";
import InstagramSettings from "./pages/settings/InstagramSettings";
import MetaCallback from "./pages/auth/MetaCallback";
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
import ReelVault from "./pages/organic/ReelVault";
import MightyEdit from "./pages/MightyEdit";
import MyProducts from "./pages/settings/MyProducts";
import AdminOrganizations from "./pages/AdminOrganizations";
import QuoteDrafts from "./pages/QuoteDrafts";
import AddOrganizationWizard from "./pages/admin/AddOrganizationWizard";
import AssetTaggingAdmin from "./pages/admin/AssetTaggingAdmin";
import SavedViewsAdmin from "./pages/admin/SavedViewsAdmin";
import OperationsSOP from "./pages/OperationsSOP";
import RevenueHealth from "./pages/RevenueHealth";
import AIApprovals from "./pages/AIApprovals";
import BulkVariationReview from "./pages/BulkVariationReview";
import QuoteStatsDashboard from "./pages/QuoteStatsDashboard";
import TagManager from "./pages/TagManager";
import Backlog from "./pages/Backlog";
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
            <Route path="/beta/signup" element={<BetaSignup />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/issues" element={<IssuesDashboard />} />
            <Route path="/ai-approvals" element={<AIApprovals />} />
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
            <Route path="/shopflow/:id" element={<ShopFlowDetail />} />
            <Route path="/shopflow-internal" element={<ShopFlowInternalList />} />
            <Route path="/shopflow-bulk-admin" element={<ShopFlowBulkAdmin />} />
            <Route path="/track/:orderNumber" element={<TrackJob />} />
            <Route path="/my-shopflow" element={<MyShopFlow />} />
            <Route path="/mighty-customer" element={<MightyCustomer />} />
            <Route path="/approveflow" element={<ApproveFlowList />} />
            <Route path="/approveflow/:projectId" element={<ApproveFlow />} />
            <Route path="/approveflow/:projectId/proof" element={<ApproveFlowProof />} />
            <Route path="/customer/:projectId" element={<CustomerPortal />} />
            <Route path="/email-campaigns" element={<MightyMail />} />
            <Route path="/admin/mightymail" element={<MightyMailAdmin />} />
            <Route path="/admin/mightymail/quotes" element={<MightyMailQuotes />} />
            <Route path="/admin/mightymail/stats" element={<QuoteStatsDashboard />} />
            <Route path="/admin/mightymail/performance" element={<MightyMailPerformance />} />
            <Route path="/mightymail-ai" element={<MightyMailAI />} />
            <Route path="/mightymail/winback" element={<MightyMailWinback />} />
            <Route path="/mightymail/campaign-sender" element={<MightyMailCampaignSender />} />
            <Route path="/quote-drafts" element={<QuoteDrafts />} />
            <Route path="/ai-pipeline" element={<AIPipeline />} />
            <Route path="/mightychat" element={<MightyChat />} />
            <Route path="/backlog" element={<Backlog />} />
            <Route path="/mightychat-v2" element={<MightyChatV2 />} />
            <Route path="/contentbox" element={<ContentBox />} />
            <Route path="/content-creator" element={<ContentCreator />} />
            <Route path="/content-schedule" element={<ContentSchedule />} />
            <Route path="/content-calendar" element={<ContentCalendar30Day />} />
            <Route path="/organic" element={<OrganicHub />} />
            <Route path="/mighty-edit" element={<MightyEdit />} />
            <Route path="/organic/reel-builder" element={<ReelBuilder />} />
            <Route path="/organic/inspo" element={<InspirationHub />} />
            <Route path="/organic/auto-split" element={<AutoSplit />} />
            <Route path="/organic/static" element={<StaticCreator />} />
            <Route path="/organic/atomizer" element={<Atomizer />} />
            <Route path="/organic/reel-vault" element={<ReelVault />} />
            <Route path="/organic/tag-manager" element={<TagManager />} />
            <Route path="/organic/youtube-editor" element={<YouTubeEditor />} />
            <Route path="/bulk-variations" element={<BulkVariationReview />} />
            <Route path="/ad-vault" element={<AdVault />} />
            <Route path="/paid-ads-performance" element={<PaidAdsPerformance />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/tasks" element={<MightyTasks />} />
            <Route path="/mightytask" element={<MightyTaskUnified />} />
            <Route path="/mightytask/*" element={<Navigate to="/mightytask" replace />} />
            <Route path="/operations-sop" element={<OperationsSOP />} />
            <Route path="/revenue-health" element={<RevenueHealth />} />
            <Route path="/tradedna" element={<TradeDNA />} />
            <Route path="/admin/pricing" element={<ProductPricingAdmin />} />
            <Route path="/admin/products" element={<ProductAdmin />} />
            <Route path="/admin/designvault" element={<DesignVaultAdmin />} />
            <Route path="/admin/dashboard-hero" element={<DashboardHeroAdmin />} />
            <Route path="/admin/website-agent" element={<JordanLeeAdminDashboard />} />
            <Route path="/admin/chat-widget-demo" element={<ChatWidgetDemo />} />
            <Route path="/admin/vehicles" element={<VehicleAdmin />} />
            <Route path="/admin/ai-corrections" element={<AICorrectionsAdmin />} />
            <Route path="/admin/organizations" element={<AdminOrganizations />} />
            <Route path="/admin/add-organization" element={<AddOrganizationWizard />} />
            <Route path="/admin/asset-tagging" element={<AssetTaggingAdmin />} />
            <Route path="/admin/saved-views" element={<SavedViewsAdmin />} />
          <Route path="/design-generator" element={
            <AppLayout>
              <DesignGenerator />
            </AppLayout>
          } />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/settings/products" element={<MyProducts />} />
            <Route path="/settings/instagram" element={<InstagramSettings />} />
            <Route path="/auth/meta/callback" element={<MetaCallback />} />
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
          <LuigiWebsiteWidget />
          <IssueReporter />
        </BrowserRouter>
      </TooltipProvider>
    </OrganizationProvider>
  </QueryClientProvider>
);

export default App;
