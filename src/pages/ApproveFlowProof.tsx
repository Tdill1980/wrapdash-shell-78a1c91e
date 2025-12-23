import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProofHeader } from "@/components/approveflow/ProofHeader";
import { ProofSideBySide } from "@/components/approveflow/ProofSideBySide";
import { ProofActions } from "@/components/approveflow/ProofActions";

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
        payload: { approved_by: "customer" },
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

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-2xl font-bold">Proof Not Found</h1>
          <p className="text-muted-foreground">
            We couldn't find the design proof you're looking for. Please check your link or contact support.
          </p>
        </div>
      </div>
    );
  }

  const vehicleInfo = project.vehicle_info as any;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <ProofHeader
        orderNumber={project.order_number}
        vehicleYear={vehicleInfo?.year}
        vehicleMake={vehicleInfo?.make}
        vehicleModel={vehicleInfo?.model}
        versionNumber={latestVersion?.version_number || project.current_version || 1}
        status={project.status}
      />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Side-by-Side Proofs */}
          {latestVersion ? (
            <ProofSideBySide
              designProofUrl={latestVersion.file_url}
              renderUrls={renders3D?.render_urls}
            />
          ) : (
            <div className="text-center py-12 space-y-3">
              <p className="text-lg text-muted-foreground">
                Your design proof is being prepared
              </p>
              <p className="text-sm text-muted-foreground/70">
                You'll receive an email when it's ready for review
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Actions */}
          <ProofActions
            status={project.status}
            approvedAt={approvedAt}
            onApprove={handleApprove}
            onRequestRevision={handleRequestRevision}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by WrapCommand AI • Questions? Reply to your proof email.
        </p>
      </footer>
    </div>
  );
}
