import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Mail, Palette, PenTool, Settings2, Upload, LayoutTemplate } from "lucide-react";
import SequenceManager from "@/components/mightymail/SequenceManager";
import BrandingManager from "@/components/mightymail/BrandingManager";
import CSVUploader from "@/components/mightymail/CSVUploader";
import EmailStyles from "@/components/mightymail/EmailStyles";
import ToneStyles from "@/components/mightymail/ToneStyles";
import { UTIMAnalyticsDashboard } from "@/components/UTIMAnalyticsDashboard";
import { ToneDesignPerformance } from "@/components/ToneDesignPerformance";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";

export default function MightyMailAdmin() {
  const navigate = useNavigate();

  return (
    <MainLayout userName="Admin">
      <div className="w-full space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          <span className="text-white">Mighty</span>
          <span className="bg-gradient-to-r from-[#00AFFF] via-[#008CFF] to-[#4EEAFF] bg-clip-text text-transparent">Mail™</span>
          <span className="text-white"> Admin</span>
        </h2>
        <p className="text-muted-foreground">
          Manage email sequences, branding, retargeting lists, and customer campaigns.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2 py-1 rounded bg-gradient-to-r from-[#00AFFF]/20 to-[#4EEAFF]/20 text-[#00AFFF] border border-[#00AFFF]/30">
            ✓ Connected to Resend
          </span>
        </div>
      </div>

      <Tabs defaultValue="quotes" className="w-full">
        <TabsList className="grid grid-cols-8 w-full bg-[#16161E]">
          <TabsTrigger value="quotes" onClick={() => navigate("/admin/mightymail/quotes")}>
            <Mail size={16} className="mr-2" /> Quotes
          </TabsTrigger>

          <TabsTrigger value="templates" onClick={() => navigate("/admin/mightymail/templates")}>
            <LayoutTemplate size={16} className="mr-2" /> Templates
          </TabsTrigger>

          <TabsTrigger value="performance">
            <Mail size={16} className="mr-2" /> Performance
          </TabsTrigger>
          
          <TabsTrigger value="sequences">
            <Mail size={16} className="mr-2" /> Sequences
          </TabsTrigger>

          <TabsTrigger value="design">
            <Palette size={16} className="mr-2" /> Design Styles
          </TabsTrigger>

          <TabsTrigger value="tones">
            <PenTool size={16} className="mr-2" /> Writing Styles
          </TabsTrigger>

          <TabsTrigger value="branding">
            <Settings2 size={16} className="mr-2" /> Branding
          </TabsTrigger>

          <TabsTrigger value="csv">
            <Upload size={16} className="mr-2" /> CSV Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotes">
          <div className="text-muted-foreground space-y-4">
            <p>View the Quotes tab to access the full Quote Management interface.</p>
            <button
              onClick={() => navigate("/admin/mightymail/quotes")}
              className="px-4 py-2 bg-gradient-to-r from-[#00AFFF] via-[#008CFF] to-[#4EEAFF] text-white rounded-lg hover:opacity-90"
            >
              Go to Quotes →
            </button>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UTIMAnalyticsDashboard />
            <ToneDesignPerformance />
          </div>
        </TabsContent>

        <TabsContent value="sequences">
          <SequenceManager />
        </TabsContent>

        <TabsContent value="design">
          <EmailStyles />
        </TabsContent>

        <TabsContent value="tones">
          <ToneStyles />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingManager />
        </TabsContent>

        <TabsContent value="csv">
          <CSVUploader />
        </TabsContent>
      </Tabs>
      </div>
    </MainLayout>
  );
}
