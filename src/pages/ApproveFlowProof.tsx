import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProofHeader } from "@/components/approveflow/ProofHeader";
import { ProofSixViewGrid } from "@/components/approveflow/ProofSixViewGrid";
import { ProductionSpecsBar } from "@/components/approveflow/ProductionSpecsBar";
import { CustomerApprovalSection } from "@/components/approveflow/CustomerApprovalSection";

/**
 * ApproveFlow OS Rule:
 * "Designers create proofs. Customers approve artifacts."
 * 
 * This customer-facing page is READ-ONLY except for approve/revision actions.
 * - Customers NEVER generate proofs
 * - Customers NEVER edit specs
 * - Approval calls approve-approveflow-proof edge function ONLY
 */

interface ProofVersion {
  id: string;
  project_id: string;
  order_number: string;
  status: string;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  total_sq_ft: number | null;
  wrap_scope: string | null;
  proof_pdf_url: string | null;
  approved_at: string | null;
  created_at: string;
}

interface ProofView {
  id: string;
  view_key: string;
  label: string;
  image_url: string;
}

interface ProductionSpecs {
  wheelbase: string | null;
  wheelbase_is_na: boolean;
  roof_height: string | null;
  roof_height_is_na: boolean;
  body_length: string | null;
  body_length_is_na: boolean;
  panel_count: number | null;
  panel_count_is_na: boolean;
  scale_reference: string | null;
  scale_reference_is_na: boolean;
}

interface ApproveFlowProject {
  id: string;
  customer_name: string;
  color_info: any;
}

export default function ApproveFlowProof() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [proofVersion, setProofVersion] = useState<ProofVersion | null>(null);
  const [proofViews, setProofViews] = useState<ProofView[]>([]);
  const [productionSpecs, setProductionSpecs] = useState<ProductionSpecs | null>(null);
  const [project, setProject] = useState<ApproveFlowProject | null>(null);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    if (!projectId) {
      navigate("/");
      return;
    }

    const fetchProofData = async () => {
      try {
        // First, fetch the project for customer name and color info
        const { data: projectData } = await supabase
          .from("approveflow_projects")
          .select("id, customer_name, color_info")
          .eq("id", projectId)
          .single();

        if (projectData) {
          setProject(projectData);
          setCustomerName(projectData.customer_name || "");
        }

        // Fetch the latest ready/approved proof version for this project
        const { data: proofData, error: proofError } = await supabase
          .from("approveflow_proof_versions")
          .select("*")
          .eq("project_id", projectId)
          .in("status", ["ready", "sent", "approved"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (proofError || !proofData) {
          // No proof version exists yet - check if project exists at all
          if (!projectData) {
            console.error("Project not found");
            setLoading(false);
            return;
          }
          // Project exists but no proof generated yet
          setLoading(false);
          return;
        }

        setProofVersion(proofData);

        // Fetch proof views (6 required angles)
        const { data: viewsData } = await supabase
          .from("approveflow_proof_views")
          .select("*")
          .eq("proof_version_id", proofData.id);

        if (viewsData) {
          setProofViews(viewsData);
        }

        // Fetch production specs
        const { data: specsData } = await supabase
          .from("approveflow_production_specs")
          .select("*")
          .eq("proof_version_id", proofData.id)
          .single();

        if (specsData) {
          setProductionSpecs(specsData);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading proof:", error);
        setLoading(false);
      }
    };

    fetchProofData();

    // Realtime subscription for proof updates
    const channel = supabase
      .channel(`proof-customer-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approveflow_proof_versions',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        if (payload.new) {
          setProofVersion(payload.new as ProofVersion);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, navigate]);

  /**
   * OS RULE: Customer approval MUST go through edge function only
   * Never update approveflow_projects directly for approval
   */
  const handleApprove = async () => {
    if (!proofVersion?.id || !customerName.trim()) return;

    try {
      const { data, error } = await supabase.functions.invoke('approve-approveflow-proof', {
        body: {
          proof_version_id: proofVersion.id,
          customer_name: customerName.trim(),
        }
      });

      if (error) throw error;

      // Update local state to reflect approval
      setProofVersion(prev => prev ? { ...prev, status: 'approved', approved_at: new Date().toISOString() } : null);

      toast({
        title: "Design Approved!",
        description: "Thank you for your approval. Your design is now in production.",
      });
    } catch (error: any) {
      console.error("Error approving:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve design. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRequestRevision = async (notes: string) => {
    if (!proofVersion?.id || !notes.trim()) return;

    try {
      // Log revision request action
      await supabase.from("approveflow_actions").insert({
        project_id: projectId,
        action_type: "revision_requested",
        payload: { revision_notes: notes, requested_by: "customer", proof_version_id: proofVersion.id },
      });

      // Add chat message with revision notes
      await supabase.from("approveflow_chat").insert({
        project_id: projectId,
        sender: "customer",
        message: `📝 Revision Request:\n\n${notes}`,
      });

      // Update proof version status
      await supabase
        .from("approveflow_proof_versions")
        .update({ status: "revision_requested" })
        .eq("id", proofVersion.id);

      setProofVersion(prev => prev ? { ...prev, status: 'revision_requested' } : null);

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

  /**
   * OS RULE: Customer downloads existing PDF only - never generates
   */
  const handleDownloadPdf = () => {
    if (proofVersion?.proof_pdf_url) {
      window.open(proofVersion.proof_pdf_url, '_blank');
    } else {
      toast({
        title: "PDF Not Available",
        description: "The proof PDF is being prepared. Please check back shortly.",
        variant: "default",
      });
    }
  };

  // Convert proof views to render_urls format for ProofSixViewGrid
  const renderUrls = proofViews.reduce((acc, view) => {
    acc[view.view_key] = view.image_url;
    return acc;
  }, {} as Record<string, string>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your proof...</p>
        </div>
      </div>
    );
  }

  // No proof version exists yet
  if (!proofVersion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-2xl font-bold text-foreground">Proof Not Ready</h1>
          <p className="text-muted-foreground">
            {project 
              ? "Your design proof is being prepared. You'll receive an email when it's ready for review."
              : "We couldn't find the design proof you're looking for. Please check your link or contact support."}
          </p>
        </div>
      </div>
    );
  }

  const colorInfo = project?.color_info as any;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Read-only display */}
      <ProofHeader
        orderNumber={proofVersion.order_number}
        vehicleYear={proofVersion.vehicle_year || undefined}
        vehicleMake={proofVersion.vehicle_make || undefined}
        vehicleModel={proofVersion.vehicle_model || undefined}
        versionNumber={1}
        status={proofVersion.status}
      />

      {/* Main Content - All read-only */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* 6-View Grid - Professional Layout */}
        <ProofSixViewGrid
          renderUrls={renderUrls}
          vehicleYear={proofVersion.vehicle_year || undefined}
          vehicleMake={proofVersion.vehicle_make || undefined}
          vehicleModel={proofVersion.vehicle_model || undefined}
        />

        {/* Production Specs Bar - Read-only display */}
        <ProductionSpecsBar
          manufacturer={colorInfo?.manufacturer}
          colorName={colorInfo?.color}
          colorCode={colorInfo?.code}
          finishType={colorInfo?.finish}
          colorHex={colorInfo?.color_hex}
          totalSqFt={proofVersion.total_sq_ft}
          wrapScope={proofVersion.wrap_scope}
        />

        {/* Customer Approval Section - Only action area */}
        <CustomerApprovalSection
          status={proofVersion.status}
          approvedAt={proofVersion.approved_at}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          onApprove={handleApprove}
          onRequestRevision={handleRequestRevision}
          onPrint={handlePrint}
          onDownloadPdf={handleDownloadPdf}
          hasPdf={!!proofVersion.proof_pdf_url}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by WrapCommand AI™ • Questions? Reply to your proof email.
        </p>
      </footer>
    </div>
  );
}
