// ============================================
// ApproveFlow — Designer Internal Page
// ============================================
// OS ARCHITECTURE — 4 FIXED ZONES:
// 
// ZONE 1: Mode Bar (top, always visible)
//   - Shows "DESIGNER MODE" badge
//   - Order number, customer name, status
//   - Never scrolls away
//
// ZONE 2: Source of Truth (left column, pinned)
//   - Customer Instructions from WooCommerce
//   - Customer Uploaded Files with timestamps
//   - READ-ONLY — this data is immutable
//
// ZONE 3: Design Workspace (center, 2 cols wide)
//   - Tabs: Design Drafts | 3D Renders | Compare
//   - Version history
//   - This is the primary work area
//
// ZONE 4: Actions + Validation (right column, fixed)
//   - Production Specs form
//   - Validation status (with colored indicators)
//   - Generate Approval Proof button
//   - Upload 2D Proof
//
// OS RULES:
// 1. WooCommerce data is canonical — never edit, only display
// 2. File roles are typed, not generic "reference"
// 3. Validation gates the Generate button (server-validated)
// 4. UI renders truth, never decides truth
// 5. Source of Truth stays ABOVE THE FOLD always
// ============================================

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock,
  Send,
  Eye,
  Loader2,
  ExternalLink,
  ZoomIn,
  Sparkles,
  Package,
  User,
  ArrowLeft,
  Upload,
  Box,
  Image as ImageIcon,
  Mail
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useApproveFlow } from "@/hooks/useApproveFlow";
import { useToast } from "@/hooks/use-toast";
import { formatFullDateTime, formatShortDate, formatTimeOnly } from "@/lib/timezone-utils";
import { supabase } from "@/integrations/supabase/client";
import { save3DRendersToApproveFlow } from "@/lib/approveflow-helpers";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { ApproveFlowTimeline } from "@/components/tracker/ApproveFlowTimeline";
import { DesignerProductionSpecs, ProductionSpecsData } from "@/components/approveflow/DesignerProductionSpecs";
import { ApproveFlowModeBar } from "@/components/approveflow/ApproveFlowModeBar";
import { ApproveFlowSourceOfTruth } from "@/components/approveflow/ApproveFlowSourceOfTruth";

export default function ApproveFlow() {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  // Designer-only view - activeRole is always "designer"
  const activeRole = "designer";
  const [chatMessage, setChatMessage] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<string>("latest");
  const [isGenerating3D, setIsGenerating3D] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [existingProofVersionId, setExistingProofVersionId] = useState<string | undefined>();
  const [trackingInfo, setTrackingInfo] = useState<{
    tracking_number?: string;
    tracking_url?: string;
    shipped_at?: string;
    order_number?: string;
    woo_order_number?: number | string;
    id?: string;
  } | null>(null);
  const [assets, setAssets] = useState<any[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    if (!urlProjectId) {
      navigate('/approveflow');
    }
  }, [urlProjectId, navigate]);
  
  const {
    project,
    versions,
    chatMessages,
    actions,
    emailLogs,
    renders3D,
    loading,
    uploadVersion,
    sendMessage,
    approveDesign,
    requestRevision,
    refetch,
  } = useApproveFlow(urlProjectId);

  // Fetch tracking info, assets, and existing proof version
  useEffect(() => {
    const fetchData = async () => {
      if (!project?.order_number) return;
      
      // Fetch tracking info
      const { data: trackingData, error: trackingError } = await supabase
        .from('shopflow_orders')
        .select('id, tracking_number, tracking_url, shipped_at, order_number, woo_order_number')
        .eq('order_number', project.order_number)
        .maybeSingle();

      if (!trackingError && trackingData) {
        setTrackingInfo(trackingData);
      }

      // Fetch uploaded assets
      if (urlProjectId) {
        const { data: assetsData, error: assetsError } = await supabase
          .from('approveflow_assets')
          .select('*')
          .eq('project_id', urlProjectId)
          .order('created_at', { ascending: false });

        if (!assetsError && assetsData) {
          setAssets(assetsData);
        }

        // Fetch existing proof version
        const { data: proofVersionData } = await supabase
          .from('approveflow_proof_versions')
          .select('id')
          .eq('project_id', urlProjectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (proofVersionData) {
          setExistingProofVersionId(proofVersionData.id);
        }
      }
    };

    fetchData();

    // Subscribe to changes
    if (project?.order_number) {
      const channel = supabase
        .channel(`tracking-${project.order_number}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'shopflow_orders',
          filter: `order_number=eq.${project.order_number}`
        }, (payload) => {
          if (payload.new && 'tracking_number' in payload.new) {
            setTrackingInfo({
              tracking_number: payload.new.tracking_number,
              tracking_url: payload.new.tracking_url,
              shipped_at: payload.new.shipped_at
            });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [project?.order_number, urlProjectId]);

  // Real-time subscriptions for notifications
  useEffect(() => {
    if (!urlProjectId) return;

    const versionsChannel = supabase
      .channel('approveflow_versions_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'approveflow_versions',
        filter: `project_id=eq.${urlProjectId}`
      }, (payload) => {
        const newVersion = payload.new as any;
        toast({
          title: "🎨 New Design Proof Uploaded",
          description: `Version ${newVersion.version_number} • ${formatTimeOnly(newVersion.created_at)}`,
        });
      })
      .subscribe();

    const actionsChannel = supabase
      .channel('approveflow_actions_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'approveflow_actions',
        filter: `project_id=eq.${urlProjectId}`
      }, (payload) => {
        const newAction = payload.new as any;
        let title = "📋 New Action";
        if (newAction.action_type === 'approved') title = "✅ Design Approved!";
        if (newAction.action_type === 'revision_requested') title = "📝 Revision Requested";
        if (newAction.action_type === 'proof_delivered') title = "📧 Proof Delivered";
        if (newAction.action_type === '3d_render_generated') title = "🎥 3D Render Ready!";
        
        toast({
          title,
          description: formatTimeOnly(newAction.created_at),
        });
      })
      .subscribe();

    const chatChannel = supabase
      .channel('approveflow_chat_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'approveflow_chat',
        filter: `project_id=eq.${urlProjectId}`
      }, (payload) => {
        const newMessage = payload.new as any;
        toast({
          title: `💬 New message from ${newMessage.sender}`,
          description: newMessage.message.substring(0, 50) + (newMessage.message.length > 50 ? '...' : ''),
        });
      })
      .subscribe();

    const emailChannel = supabase
      .channel('approveflow_email_logs_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'approveflow_email_logs',
        filter: `project_id=eq.${urlProjectId}`
      }, (payload) => {
        const newEmail = payload.new as any;
        toast({
          title: "📧 Email Notification Sent",
          description: newEmail.subject,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(versionsChannel);
      supabase.removeChannel(actionsChannel);
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(emailChannel);
    };
  }, [urlProjectId, toast]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadVersion(file, uploadNotes, activeRole);
      setUploadNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    await sendMessage(chatMessage, activeRole);
    setChatMessage("");
  };

  const handleApprove = async () => {
    await approveDesign();
  };

  const handleGenerate3D = async () => {
    if (!latestVersion) {
      toast({
        title: "No design available",
        description: "Please upload a 2D design first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating3D(true);
    try {
      // Always use the latest version (first in array)
      const latestProof = versions[0];
      const vehicleInfo = project?.vehicle_info as any;

      toast({
        title: "Generating Studio Renders",
        description: "Creating 6 photorealistic views... This may take 30-60 seconds.",
      });

      // Use StudioRenderOS for locked 6-view generation
      const { data, error } = await supabase.functions.invoke('generate-studio-renders', {
        body: {
          projectId: urlProjectId,
          versionId: latestProof.id,
          panelUrl: latestProof.file_url,
          vehicle: `${vehicleInfo?.year || ''} ${vehicleInfo?.make || ''} ${vehicleInfo?.model || ''}`.trim() || project?.product_type || 'vehicle',
          vehicleYear: vehicleInfo?.year,
          vehicleMake: vehicleInfo?.make,
          vehicleModel: vehicleInfo?.model
        }
      });

      if (error) {
        console.error('StudioRenderOS error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Studio render generation failed');
      }

      // Refetch to update UI with new 3D renders
      await refetch();

      // Verify the data is actually there after refetch
      const viewCount = data?.generatedViews || 0;
      if (viewCount === 0) {
        throw new Error("Render generated but no views were saved - please retry");
      }

      toast({
        title: "Studio Renders Complete",
        description: `${viewCount}/6 views generated and verified`,
      });
    } catch (error: any) {
      console.error('Error generating studio renders:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Unable to generate studio renders",
        variant: "destructive",
      });
    } finally {
      setIsGenerating3D(false);
    }
  };

  // OS RULE: Generate Approval Proof creates proof_version + views + specs records
  const handleGenerateApprovalProof = async (specs: ProductionSpecsData) => {
    if (!urlProjectId || !project) {
      toast({
        title: "Error",
        description: "Project not found",
        variant: "destructive",
      });
      return;
    }

    const latestRenderEntry = renders3D[0];
    const latestRenderUrls = latestRenderEntry?.render_urls as Record<string, string> | undefined;

    if (!latestRenderUrls) {
      toast({
        title: "Error",
        description: "3D renders are required before generating approval proof",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingProof(true);
    try {
      // Step 1: Create approveflow_proof_versions record
      const { data: proofVersion, error: proofVersionError } = await supabase
        .from('approveflow_proof_versions')
        .insert({
          project_id: urlProjectId,
          order_number: project.order_number,
          vehicle_year: specs.vehicleYear || null,
          vehicle_make: specs.vehicleMake || null,
          vehicle_model: specs.vehicleModel || null,
          total_sq_ft: specs.totalSqFt,
          wrap_scope: specs.wrapScope,
          internal_notes: specs.internalNotes || null,
          status: 'draft',
          system_name: 'WrapCommandAI',
          tool_name: 'ApproveFlow',
          include_full_terms: false,
        })
        .select()
        .single();

      if (proofVersionError) throw proofVersionError;

      // Step 2: Create approveflow_proof_views records (map 3D renders to 6 views)
      // Keys match StudioRenderOS output: driver_side, passenger_side, front, rear, top, detail
      const viewMappings: { view_key: string; label: string; url_key: string }[] = [
        { view_key: 'driver', label: 'Driver Side', url_key: 'driver_side' },
        { view_key: 'passenger', label: 'Passenger Side', url_key: 'passenger_side' },
        { view_key: 'front', label: 'Front', url_key: 'front' },
        { view_key: 'rear', label: 'Rear', url_key: 'rear' },
        { view_key: 'top', label: 'Top', url_key: 'top' },
        { view_key: 'detail', label: 'Detail', url_key: 'detail' },
      ];

      // Get the driver_side/default image URL for views that don't have specific renders
      const defaultImageUrl = latestRenderUrls.driver_side || latestRenderUrls.front || Object.values(latestRenderUrls)[0];

      const viewInserts = viewMappings.map((mapping) => ({
        proof_version_id: proofVersion.id,
        view_key: mapping.view_key,
        label: mapping.label,
        image_url: latestRenderUrls[mapping.url_key] || defaultImageUrl,
      }));

      const { error: viewsError } = await supabase
        .from('approveflow_proof_views')
        .insert(viewInserts);

      if (viewsError) throw viewsError;

      // Step 3: Create approveflow_production_specs record
      const { error: specsError } = await supabase
        .from('approveflow_production_specs')
        .insert({
          proof_version_id: proofVersion.id,
          wheelbase: specs.wheelbase || null,
          wheelbase_is_na: specs.wheelbaseIsNa,
          roof_height: specs.roofHeight || null,
          roof_height_is_na: specs.roofHeightIsNa,
          body_length: specs.bodyLength || null,
          body_length_is_na: specs.bodyLengthIsNa,
          scale_reference: specs.scaleReference || null,
          scale_reference_is_na: specs.scaleReferenceIsNa,
          panel_count: specs.panelCount,
          panel_count_is_na: specs.panelCountIsNa,
        });

      if (specsError) throw specsError;

      // Step 4: Call validate-approveflow-proof
      const { data: validationResult, error: validationError } = await supabase.functions.invoke(
        'validate-approveflow-proof',
        { body: { proof_version_id: proofVersion.id } }
      );

      if (validationError) throw validationError;

      if (!validationResult.ok) {
        toast({
          title: "Validation failed",
          description: `Missing: ${validationResult.missing?.map((m: any) => m.label).join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Step 5: Call generate-approveflow-proof-pdf
      const { data: pdfResult, error: pdfError } = await supabase.functions.invoke(
        'generate-approveflow-proof-pdf',
        { body: { proof_version_id: proofVersion.id } }
      );

      if (pdfError) throw pdfError;

      setExistingProofVersionId(proofVersion.id);

      toast({
        title: "Approval proof generated!",
        description: "PDF is ready. Customer can now view and approve.",
      });

      // Log action
      await supabase.from('approveflow_actions').insert({
        project_id: urlProjectId,
        action_type: 'approval_proof_generated',
        payload: { proof_version_id: proofVersion.id, pdf_url: pdfResult?.pdf_url },
      });

    } catch (error: any) {
      console.error('Error generating approval proof:', error);
      toast({
        title: "Failed to generate proof",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProof(false);
    }
  };

  // ============================================
  // OS RULE (LOCKED):
  // Designer UI shows PRODUCTION FLOW
  // Customer UI shows APPROVAL FLOW
  // These steppers must NEVER overlap
  // ============================================
  const getProgressSteps = () => {
    const has2DDraft = versions.length > 0;
    const has3DRenders = renders3D.length > 0;
    const hasProofBuilt = !!existingProofVersionId;
    const proofSent = project?.status === 'proof_delivered' || 
                      project?.status === 'awaiting_feedback' ||
                      project?.status === 'approved';

    return [
      { 
        label: "Order Received", 
        status: "complete" as const
      },
      { 
        label: "2D Uploaded", 
        status: has2DDraft ? "complete" as const : "current" as const
      },
      { 
        label: "3D Generated", 
        status: has3DRenders ? "complete" as const : (has2DDraft ? "current" as const : "pending" as const)
      },
      { 
        label: "Proof Built", 
        status: hasProofBuilt ? "complete" as const : (has3DRenders ? "current" as const : "pending" as const)
      },
      { 
        label: "Sent to Customer", 
        status: proofSent ? "complete" as const : (hasProofBuilt ? "current" as const : "pending" as const)
      },
    ];
  };
  const latestVersion = versions[0];
  const displayVersion = selectedVersion === "latest" ? latestVersion : versions.find(v => v.id === selectedVersion);
  const latestRenderEntry = renders3D[0];
  const latestRenderUrls = latestRenderEntry?.render_urls as Record<string, string> | undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-muted-foreground">No project found</p>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  const progressSteps = getProgressSteps();

  return (
    <MainLayout>
      <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="text-white">Approve</span>
            <span className="text-gradient">Flow™</span>
          </h1>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="bg-primary/20 text-primary border-primary/50 hover:bg-primary/30 text-xs sm:text-sm"
          >
            🔄 <span className="hidden sm:inline">LIVE </span>SYNC
          </Button>

          {trackingInfo?.id && (
            <Link 
              to={`/shopflow-internal/${trackingInfo.id}`}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">View in </span>ShopFlow
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* ZONE 1: MODE BAR — Always visible at top */}
      {/* ============================================ */}
      <ApproveFlowModeBar
        orderNumber={project.order_number}
        productType={project.product_type}
        customerName={project.customer_name}
        customerEmail={project.customer_email || undefined}
        status={project.status}
      />

      {/* Progress Bar */}
      <div className="py-3 px-4 bg-card border border-border rounded-lg">
        <div className="relative">
          <div className="flex justify-between mb-2">
            {progressSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center mb-1 ${
                  step.status === "complete" 
                    ? "bg-gradient-primary" 
                    : step.status === "current"
                    ? "bg-primary/80"
                    : "bg-card border border-border"
                }`}>
                  {step.status === "complete" && <CheckCircle2 className="w-3 h-3 text-white" />}
                  {step.status === "current" && <Clock className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-[10px] text-center ${
                  step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute top-2.5 left-0 right-0 h-[2px] bg-border -z-10">
            <div 
              className="h-full bg-gradient-primary transition-all duration-500"
              style={{ 
                width: `${((progressSteps.filter(s => s.status === "complete").length) / (progressSteps.length - 1)) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>


      {/* Order Info - Full Width at Top */}
      <Card className="bg-[#1a1a24] border-white/10 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
            <div className="w-full sm:w-auto">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Order #{project.order_number}
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                Placed {formatFullDateTime(project.created_at)}
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] text-white border-0 text-xs sm:text-sm">
              {project.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Package className="w-5 h-5 text-[#5AC8FF]" />
              </div>
              <div>
                <p className="text-white/60 text-xs font-medium mb-1">PRODUCT</p>
                <p className="text-white text-sm font-medium">{project.product_type}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <User className="w-5 h-5 text-[#5AC8FF]" />
              </div>
              <div>
                <p className="text-white/60 text-xs font-medium mb-1">CUSTOMER</p>
                <p className="text-white text-sm font-medium">{project.customer_name}</p>
                {project.customer_email && (
                  <p className="text-white/40 text-xs mt-1">{project.customer_email}</p>
                )}
              </div>
            </div>

            {project.order_total && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                  <Package className="w-5 h-5 text-[#5AC8FF]" />
                </div>
                <div>
                  <p className="text-white/60 text-xs font-medium mb-1">TOTAL</p>
                  <p className="text-white text-sm font-medium">${project.order_total.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* ============================================ */}
        {/* ZONE 2: SOURCE OF TRUTH (Left Column) */}
        {/* ============================================ */}
        <div className="space-y-4">
          {/* Source of Truth - Immutable WooCommerce Data */}
          <ApproveFlowSourceOfTruth
            orderNumber={project.order_number}
            orderCreatedAt={project.created_at}
            designInstructions={project.design_instructions || undefined}
            assets={assets}
          />

          {/* Chat Panel */}
          <Card className="p-4 bg-card border-border">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat with Customer
            </h3>
            
            <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === activeRole ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-2 rounded-lg text-xs ${
                        msg.sender === activeRole
                          ? 'bg-primary/20 text-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-[10px] text-muted-foreground mb-1 uppercase">{msg.sender}</p>
                      <p>{msg.message}</p>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        {formatTimeOnly(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="text-xs"
              />
              <Button size="sm" onClick={handleSendMessage}>
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        </div>

        {/* CENTER: Design Proof Viewer */}
        <div className="lg:col-span-2 min-h-[600px] flex flex-col">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Design Proof
              </h3>
              {versions.length > 0 && (
                <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                  <SelectTrigger className="w-32 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest</SelectItem>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        v{v.version_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Tabs defaultValue={latestRenderUrls && activeRole === "designer" ? "compare" : "2d"} className="w-full">
              <TabsList className={`grid w-full ${latestRenderUrls && activeRole === "designer" ? 'grid-cols-3' : 'grid-cols-2'} mb-4`}>
                <TabsTrigger value="2d">
                  2D Draft
                  {displayVersion?.version_number === latestVersion?.version_number && (
                    <Badge className="ml-2 bg-blue-500 text-white text-[10px] px-1.5 py-0">Latest</Badge>
                  )}
                </TabsTrigger>
                {latestRenderUrls && activeRole === "designer" && <TabsTrigger value="compare">Compare</TabsTrigger>}
                <TabsTrigger value="3d">
                  3D Render
                  {latestRenderUrls && (
                    <Badge className="ml-2 bg-blue-500 text-white text-[10px] px-1.5 py-0">Latest</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="2d" className="space-y-3">
                {displayVersion ? (
                  <div className="space-y-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group relative">
                          <img 
                            src={displayVersion.file_url} 
                            alt={`Version ${displayVersion.version_number}`}
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-[90vw] max-h-[90vh] p-2">
                        <img 
                          src={displayVersion.file_url} 
                          alt={`Version ${displayVersion.version_number}`}
                          className="w-full h-full object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                    <div className="text-xs space-y-1">
                      <p className="text-muted-foreground">
                        Version {displayVersion.version_number} • 
                        Submitted by {displayVersion.submitted_by} • 
                        {formatFullDateTime(displayVersion.created_at)}
                      </p>
                      {displayVersion.notes && (
                        <p className="text-foreground">{displayVersion.notes}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-lg flex items-center justify-center border border-indigo-500/20">
                    <div className="text-center max-w-xs px-4">
                      <Sparkles className="w-8 h-8 mx-auto mb-3 text-indigo-400" />
                      <h4 className="text-sm font-semibold text-foreground mb-1">Design in Progress</h4>
                      <p className="text-xs text-muted-foreground">
                        The design team will upload drafts here once work begins. This space will populate automatically.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {latestRenderUrls && activeRole === "designer" && (
                <TabsContent value="compare" className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold mb-2 text-blue-400">2D Draft</p>
                      {displayVersion ? (
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          <img 
                            src={displayVersion.file_url} 
                            alt="2D Draft"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <p className="text-xs text-muted-foreground">No 2D draft</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-2 text-cyan-400">3D Render</p>
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        <img 
                          src={latestRenderUrls.driver_side || latestRenderUrls.front || Object.values(latestRenderUrls)[0]} 
                          alt="3D Render"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
              
              <TabsContent value="3d" className="space-y-3">
                {latestRenderUrls ? (
                  <div className="space-y-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group relative">
                          <img 
                            src={latestRenderUrls.driver_side || latestRenderUrls.front || Object.values(latestRenderUrls)[0]} 
                            alt="3D Render"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-[90vw] max-h-[90vh] p-2">
                        <img 
                          src={latestRenderUrls.driver_side || latestRenderUrls.front || Object.values(latestRenderUrls)[0]} 
                          alt="3D Render"
                          className="w-full h-full object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(latestRenderUrls).map(([angle, url]: [string, any]) => (
                        <Dialog key={angle}>
                          <DialogTrigger asChild>
                            <div className="aspect-square bg-muted rounded overflow-hidden border border-border hover:border-primary cursor-pointer transition-colors">
                              <img 
                                src={url as string} 
                                alt={`${angle} view`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-[90vw] max-h-[90vh] p-2">
                            <img 
                              src={url as string} 
                              alt={`${angle} view`}
                              className="w-full h-full object-contain"
                            />
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-4">No 3D renders yet</p>
                    {activeRole === 'designer' && versions.length > 0 && (
                      <Button
                        onClick={handleGenerate3D}
                        disabled={isGenerating3D}
                        className="bg-gradient-to-r from-purple-500 to-blue-500"
                      >
                        {isGenerating3D ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating 3D...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate 3D Render
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Always show Regenerate button if we have versions and renders */}
                {activeRole === 'designer' && versions.length > 0 && latestRenderUrls && (
                  <div className="mt-4 text-center">
                    <Button
                      onClick={handleGenerate3D}
                      disabled={isGenerating3D}
                      variant="outline"
                      className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    >
                      {isGenerating3D ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Regenerate 3D Render
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Version History with timestamps and enlarge */}
            {versions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-xs font-semibold mb-3">Version History</h4>
                <div className="space-y-2">
                  {versions.map((v, index) => (
                    <Dialog key={v.id}>
                      <div className={`p-2 rounded text-xs transition-colors ${
                        selectedVersion === v.id || (selectedVersion === 'latest' && index === 0)
                          ? 'bg-primary/20 border border-primary/50'
                          : 'hover:bg-white/5'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">v{v.version_number}</span>
                            {index === 0 && (
                              <Badge className="bg-blue-500 text-white text-[9px] px-1.5 py-0">Latest</Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatFullDateTime(v.created_at)}
                          </span>
                        </div>
                        {v.notes && (
                          <p className="text-[10px] text-muted-foreground mb-2">{v.notes}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => setSelectedVersion(v.id)}
                          >
                            View
                          </Button>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                            >
                              <ZoomIn className="w-3 h-3 mr-1" />
                              Enlarge
                            </Button>
                          </DialogTrigger>
                        </div>
                      </div>
                      <DialogContent className="max-w-[90vw] max-h-[90vh] p-2">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Version {v.version_number} • {formatFullDateTime(v.created_at)}
                          </p>
                          <img 
                            src={v.file_url} 
                            alt={`Version ${v.version_number}`}
                            className="w-full h-auto"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ============================================ */}
        {/* ZONE 4: ACTIONS + VALIDATION (Right Column) */}
        {/* ============================================ */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
          {activeRole === "designer" && (
            <DesignerProductionSpecs
              projectId={urlProjectId || ""}
              orderNumber={project.order_number}
              vehicleInfo={project.vehicle_info as { year?: string; make?: string; model?: string } | undefined}
              has3DRenders={renders3D.length > 0}
              existingProofVersionId={existingProofVersionId}
              onGenerateProof={handleGenerateApprovalProof}
              isGenerating={isGeneratingProof}
              onUpload={async (file, notes) => {
                setUploading(true);
                try {
                  await uploadVersion(file, notes, activeRole);
                } finally {
                  setUploading(false);
                }
              }}
              onGenerate3D={handleGenerate3D}
              onEmailProof={async () => {
                if (!latestVersion) return;
                try {
                  const portalUrl = `${window.location.origin}/approveflow/${urlProjectId}`;
                  const { error } = await supabase.functions.invoke('send-approveflow-proof', {
                    body: {
                      projectId: urlProjectId,
                      customerEmail: project.customer_email,
                      customerName: project.customer_name,
                      orderNumber: project.order_number,
                      proofUrl: latestVersion.file_url,
                      renderUrls: latestRenderUrls,
                      portalUrl: portalUrl,
                    }
                  });
                  if (error) throw error;
                  toast({ title: "Proof sent!", description: `Email sent to ${project.customer_email}` });
                } catch (error: any) {
                  toast({ title: "Failed to send proof", description: error.message, variant: "destructive" });
                }
              }}
              isUploading={uploading}
              isGenerating3D={isGenerating3D}
              hasVersions={versions.length > 0}
            />
          )}
        </div>
      </div>

      {/* Project Timeline - Moved to Bottom */}
      <ApproveFlowTimeline 
        projectCreatedAt={project.created_at}
        versions={versions}
        actions={actions}
        chatMessages={chatMessages}
        emailLogs={emailLogs}
        hasMissingFiles={assets.length === 0}
      />

    </div>
    </MainLayout>
  );
}
