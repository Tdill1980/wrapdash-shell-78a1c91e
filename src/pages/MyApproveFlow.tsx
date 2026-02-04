// ============================================
// MyApproveFlow — Customer Standalone Approval Page
// ============================================
// "MyApproveFlow is a read-only client window into an immutable proof artifact.
// Designers create proofs. Customers approve them."
// 
// NON-NEGOTIABLE RULES:
// - No designer tools exist in this page's code
// - Customers never generate proofs or renders
// - Customers never edit production specs
// - Customers never write directly to tables
// - Approval always goes through edge functions
// ============================================

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MyApproveFlowHeader } from "@/components/myapproveflow/MyApproveFlowHeader";
import { MyApproveFlowViewGrid } from "@/components/myapproveflow/MyApproveFlowViewGrid";
import { MyApproveFlowSpecs } from "@/components/myapproveflow/MyApproveFlowSpecs";
import { MyApproveFlowActions } from "@/components/myapproveflow/MyApproveFlowActions";
import { MyApproveFlowMessages } from "@/components/myapproveflow/MyApproveFlowMessages";
import { MyApproveFlowHistory } from "@/components/myapproveflow/MyApproveFlowHistory";
import { Loader2 } from "lucide-react";

interface ProofVersion {
  id: string;
  order_number: string;
  project_id: string;
  status: string;
  proof_pdf_url: string | null;
  approved_at: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  wrap_scope: string | null;
  total_sq_ft: number | null;
  system_name: string;
  tool_name: string;
  created_at: string;
}

interface ProofView {
  id: string;
  view_key: string;
  label: string;
  image_url: string;
}

interface ProductionSpec {
  id: string;
  body_length: string | null;
  body_length_is_na: boolean;
  wheelbase: string | null;
  wheelbase_is_na: boolean;
  roof_height: string | null;
  roof_height_is_na: boolean;
  panel_count: number | null;
  panel_count_is_na: boolean;
  scale_reference: string | null;
  scale_reference_is_na: boolean;
}

interface ChatMessage {
  id: string;
  message: string;
  sender: string;
  created_at: string;
}

interface CustomerAsset {
  id: string;
  file_url: string;
  original_filename: string | null;
  uploaded_at: string | null;
  file_type: string | null;
}

interface ProjectData {
  design_instructions: string | null;
  product_type: string;
  created_at: string | null;
}

export default function MyApproveFlow() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofVersion, setProofVersion] = useState<ProofVersion | null>(null);
  const [proofViews, setProofViews] = useState<ProofView[]>([]);
  const [productionSpecs, setProductionSpecs] = useState<ProductionSpec | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [approving, setApproving] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [customerAssets, setCustomerAssets] = useState<CustomerAsset[]>([]);

  // Fetch proof data on mount
  useEffect(() => {
    if (!orderNumber) {
      setError("Order number is required");
      setLoading(false);
      return;
    }
    fetchProofData();
  }, [orderNumber]);

  const fetchProofData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Find the latest proof version for this order (ready or approved)
      const { data: pvData, error: pvError } = await supabase
        .from("approveflow_proof_versions")
        .select("*")
        .eq("order_number", orderNumber)
        .in("status", ["ready", "sent", "approved"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (pvError || !pvData) {
        setError("No proof found for this order. Please check your order number or contact support.");
        setLoading(false);
        return;
      }

      setProofVersion(pvData);

      // Fetch proof views
      const { data: viewsData } = await supabase
        .from("approveflow_proof_views")
        .select("*")
        .eq("proof_version_id", pvData.id)
        .order("view_key");

      if (viewsData) {
        setProofViews(viewsData);
      }

      // Fetch production specs
      const { data: specsData } = await supabase
        .from("approveflow_production_specs")
        .select("*")
        .eq("proof_version_id", pvData.id)
        .single();

      if (specsData) {
        setProductionSpecs(specsData);
      }

      // Fetch chat messages (customer-visible only)
      const { data: chatData } = await supabase
        .from("approveflow_chat")
        .select("*")
        .eq("project_id", pvData.project_id)
        .order("created_at", { ascending: true });

      if (chatData) {
        setMessages(chatData);
      }

      // Fetch project data for original request
      const { data: projectDataResult } = await supabase
        .from("approveflow_projects")
        .select("design_instructions, product_type, created_at")
        .eq("id", pvData.project_id)
        .single();

      if (projectDataResult) {
        setProjectData(projectDataResult);
      }

      // Fetch customer uploads (assets with source = 'customer')
      const { data: assetsData } = await supabase
        .from("approveflow_assets")
        .select("id, file_url, original_filename, uploaded_at, file_type")
        .eq("project_id", pvData.project_id)
        .eq("source", "customer")
        .order("uploaded_at", { ascending: true });

      if (assetsData) {
        setCustomerAssets(assetsData);
      }

    } catch (err) {
      console.error("[MyApproveFlow] Error:", err);
      setError("Failed to load proof. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // APPROVE ACTION - Goes through edge function ONLY
  // ============================================
  const handleApprove = async () => {
    if (!proofVersion) return;
    
    if (!customerName.trim()) {
      toast.error("Please enter your name before approving");
      return;
    }

    setApproving(true);
    try {
      const { data, error } = await lovableFunctions.functions.invoke("approve-approveflow-proof", {
        body: {
          proof_version_id: proofVersion.id,
          customer_name: customerName.trim()
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Approval failed");

      toast.success("Design approved successfully!");
      
      // Refresh data to show approved state
      await fetchProofData();
      
    } catch (err) {
      console.error("[MyApproveFlow] Approve error:", err);
      toast.error("Failed to approve. Please try again.");
    } finally {
      setApproving(false);
    }
  };

  // ============================================
  // REVISION REQUEST - Logs action, sends message
  // ============================================
  const handleRequestRevisions = async (notes: string) => {
    if (!proofVersion) return;

    try {
      // Log action
      await supabase.from("approveflow_actions").insert({
        project_id: proofVersion.project_id,
        action_type: "revision_requested",
        payload: { notes, requested_at: new Date().toISOString() }
      });

      // Add chat message
      await supabase.from("approveflow_chat").insert({
        project_id: proofVersion.project_id,
        sender: "customer",
        message: `Revision requested: ${notes}`
      });

      // Update proof status
      await supabase
        .from("approveflow_proof_versions")
        .update({ status: "revision_requested" })
        .eq("id", proofVersion.id);

      toast.success("Revision request sent to design team");
      await fetchProofData();
      
    } catch (err) {
      console.error("[MyApproveFlow] Revision request error:", err);
      toast.error("Failed to send revision request");
    }
  };

  // Send customer message
  const handleSendMessage = async (message: string) => {
    if (!proofVersion || !message.trim()) return;

    try {
      await supabase.from("approveflow_chat").insert({
        project_id: proofVersion.project_id,
        sender: "customer",
        message: message.trim()
      });

      toast.success("Message sent");
      await fetchProofData();
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your design proof...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !proofVersion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Proof Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "We couldn't find a design proof for this order."}
          </p>
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact our support team.
          </p>
        </div>
      </div>
    );
  }

  const isApproved = proofVersion.status === "approved";
  const vehicleTitle = [
    proofVersion.vehicle_year,
    proofVersion.vehicle_make,
    proofVersion.vehicle_model
  ].filter(Boolean).join(" ") || "Vehicle";

  return (
    <div className="min-h-screen bg-background">
      <MyApproveFlowHeader
        orderNumber={proofVersion.order_number}
        status={proofVersion.status}
        vehicleTitle={vehicleTitle}
        toolName={proofVersion.tool_name}
        systemName={proofVersion.system_name}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 6-View Grid - Read Only with Branding */}
        <MyApproveFlowViewGrid
          views={proofViews}
          isApproved={isApproved}
          orderNumber={proofVersion.order_number}
          brandLine1="WrapCommandAI™ for WPW"
          brandLine2="ApproveFlow™"
        />

        {/* Production Specs - Read Only */}
        <MyApproveFlowSpecs
          wrapScope={proofVersion.wrap_scope}
          totalSqFt={proofVersion.total_sq_ft}
          specs={productionSpecs}
        />

        {/* Original Request History - Single Source of Truth */}
        <MyApproveFlowHistory
          designInstructions={projectData?.design_instructions || null}
          productType={projectData?.product_type || null}
          projectCreatedAt={projectData?.created_at || null}
          customerAssets={customerAssets}
        />

        {/* Approval Actions */}
        <MyApproveFlowActions
          isApproved={isApproved}
          approvedAt={proofVersion.approved_at}
          pdfUrl={proofVersion.proof_pdf_url}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          onApprove={handleApprove}
          onRequestRevisions={handleRequestRevisions}
          approving={approving}
          status={proofVersion.status}
        />

        {/* Messages */}
        <MyApproveFlowMessages
          messages={messages}
          onSendMessage={handleSendMessage}
          isApproved={isApproved}
        />
      </main>

      {/* Footer Disclaimer */}
      <footer className="bg-muted/50 border-t border-border py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-muted-foreground">
          <p className="font-semibold mb-2">IMPORTANT NOTICE</p>
          <p>
            By approving this design, you confirm that you have reviewed all elements including 
            placement, colors, and text. Production will begin immediately upon approval. 
            Changes after approval may incur additional charges and delays.
          </p>
        </div>
      </footer>
    </div>
  );
}
