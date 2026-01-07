import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProofPageHeader } from "@/components/approveflow/ProofPageHeader";
import { ProofSixViewGrid } from "@/components/approveflow/ProofSixViewGrid";
import { ProductionSpecsBar } from "@/components/approveflow/ProductionSpecsBar";
import { CustomerApprovalSection } from "@/components/approveflow/CustomerApprovalSection";

interface ApproveFlowProject {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  product_type: string;
  status: string;
  current_version: number | null;
  vehicle_info: any;
  color_info: any;
  created_at: string;
  updated_at: string;
}

interface ApproveFlowVersion {
  id: string;
  version_number: number;
  file_url: string;
  notes: string | null;
  created_at: string;
}

interface ApproveFlow3D {
  id: string;
  render_urls: Record<string, string>;
  version_id: string | null;
  created_at: string;
}

export default function ApproveFlowProof() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ApproveFlowProject | null>(null);
  const [latestVersion, setLatestVersion] = useState<ApproveFlowVersion | null>(null);
  const [renders3D, setRenders3D] = useState<ApproveFlow3D | null>(null);
  const [approvedAt, setApprovedAt] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [includeFullTerms, setIncludeFullTerms] = useState(true);

  useEffect(() => {
    if (!projectId) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch project
        const { data: projectData, error: projectError } = await supabase
          .from("approveflow_projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (projectError || !projectData) {
          console.error("Error fetching project:", projectError);
          setLoading(false);
          return;
        }

        setProject(projectData);
        setCustomerName(projectData.customer_name || "");

        // Fetch latest version
        const { data: versionsData } = await supabase
          .from("approveflow_versions")
          .select("*")
          .eq("project_id", projectId)
          .order("version_number", { ascending: false })
          .limit(1);

        if (versionsData && versionsData.length > 0) {
          setLatestVersion(versionsData[0]);
        }

        // Fetch latest 3D renders
        const { data: rendersData } = await supabase
          .from("approveflow_3d")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (rendersData && rendersData.length > 0) {
          setRenders3D(rendersData[0] as ApproveFlow3D);
        }

        // Fetch approved action timestamp
        const { data: actionsData } = await supabase
          .from("approveflow_actions")
          .select("created_at")
          .eq("project_id", projectId)
          .eq("action_type", "approved")
          .order("created_at", { ascending: false })
          .limit(1);

        if (actionsData && actionsData.length > 0) {
          setApprovedAt(actionsData[0].created_at);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading proof:", error);
        setLoading(false);
      }
    };

    fetchData();

    // Set up realtime subscription for 3D renders
    const channel = supabase
      .channel(`approveflow-proof-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approveflow_3d',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        if (payload.new) {
          setRenders3D(payload.new as ApproveFlow3D);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approveflow_projects',
        filter: `id=eq.${projectId}`
      }, (payload) => {
        if (payload.new) {
          setProject(payload.new as ApproveFlowProject);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, navigate]);

  const handleApprove = async () => {
    if (!projectId) return;

    try {
      // Update project status
      await supabase
        .from("approveflow_projects")
        .update({ status: "approved" })
        .eq("id", projectId);

      // Log the action
      await supabase.from("approveflow_actions").insert({
        project_id: projectId,
        action_type: "approved",
        payload: { approved_by: "customer", customer_name: customerName },
      });

      // Update local state
      setProject((prev) => (prev ? { ...prev, status: "approved" } : null));
      setApprovedAt(new Date().toISOString());

      toast({
        title: "Design Approved!",
        description: "Thank you for your approval. Your design is now in production.",
      });
    } catch (error: any) {
      console.error("Error approving:", error);
      toast({
        title: "Error",
        description: "Failed to approve design. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRequestRevision = async (notes: string) => {
    if (!projectId) return;

    try {
      // Update project status
      await supabase
        .from("approveflow_projects")
        .update({ status: "revision_requested" })
        .eq("id", projectId);

      // Log the action
      await supabase.from("approveflow_actions").insert({
        project_id: projectId,
        action_type: "revision_requested",
        payload: { revision_notes: notes, requested_by: "customer" },
      });

      // Add chat message with revision notes
      await supabase.from("approveflow_chat").insert({
        project_id: projectId,
        sender: "customer",
        message: `📝 Revision Request:\n\n${notes}`,
      });

      // Update local state
      setProject((prev) => (prev ? { ...prev, status: "revision_requested" } : null));

      toast({
        title: "Revision Requested",
        description: "Our design team will review your feedback and update the proof.",
      });
    } catch (error: any) {
      console.error("Error requesting revision:", error);
      toast({
        title: "Error",
        description: "Failed to submit revision request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-approveflow-proof-pdf', {
        body: { proof_version_id: projectId }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "PDF Generation",
        description: "PDF generation is being prepared. Please try again shortly.",
        variant: "default",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-white/60">Loading your proof...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-2xl font-bold text-white">Proof Not Found</h1>
          <p className="text-white/60">
            We couldn't find the design proof you're looking for. Please check your link or contact support.
          </p>
        </div>
      </div>
    );
  }

  const vehicleInfo = project.vehicle_info as any;
  const colorInfo = project.color_info as any;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <ProofPageHeader
        toolName="ApproveFlow™"
        vehicleYear={vehicleInfo?.year}
        vehicleMake={vehicleInfo?.make}
        vehicleModel={vehicleInfo?.model}
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        includeFullTerms={includeFullTerms}
        onIncludeFullTermsChange={setIncludeFullTerms}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
      />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* 6-View Grid - Professional Layout */}
        <ProofSixViewGrid
          renderUrls={renders3D?.render_urls}
          vehicleYear={vehicleInfo?.year}
          vehicleMake={vehicleInfo?.make}
          vehicleModel={vehicleInfo?.model}
        />

        {/* Production Specs Bar */}
        <ProductionSpecsBar
          manufacturer={colorInfo?.manufacturer || "3M"}
          colorName={colorInfo?.color}
          colorCode={colorInfo?.code}
          finishType={colorInfo?.finish}
          colorHex={colorInfo?.color_hex}
        />

        {/* Customer Approval Section */}
        <CustomerApprovalSection
          status={project.status}
          approvedAt={approvedAt}
          customerName={customerName}
          onApprove={handleApprove}
          onRequestRevision={handleRequestRevision}
          onPrint={handlePrint}
          onDownloadPdf={handleDownloadPdf}
          showPrintActions={false}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 text-center">
        <p className="text-xs text-white/40">
          Powered by WrapCommand AI™ • Questions? Reply to your proof email.
        </p>
      </footer>
    </div>
  );
}
