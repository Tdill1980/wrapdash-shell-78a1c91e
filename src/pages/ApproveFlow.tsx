import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  MessageSquare, 
  CheckCircle2, 
  Clock,
  Send,
  Eye,
  Box,
  Image as ImageIcon,
  Loader2,
  Truck,
  ExternalLink
} from "lucide-react";
import { useApproveFlow } from "@/hooks/useApproveFlow";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { save3DRendersToApproveFlow } from "@/lib/approveflow-helpers";
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { ApproveFlowTimeline } from "@/components/tracker/ApproveFlowTimeline";

export default function ApproveFlow() {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<"designer" | "customer">("designer");
  const [chatMessage, setChatMessage] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<string>("latest");
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [generating3D, setGenerating3D] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<{
    tracking_number?: string;
    tracking_url?: string;
    shipped_at?: string;
    order_number?: string;
    woo_order_number?: number | string;
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
  } = useApproveFlow(urlProjectId);

  // Fetch tracking info from shopflow_orders
  useEffect(() => {
    const fetchTrackingInfo = async () => {
      if (!project?.order_number) return;
      
      const { data, error } = await supabase
        .from('shopflow_orders')
        .select('tracking_number, tracking_url, shipped_at, order_number, woo_order_number')
        .eq('order_number', project.order_number)
        .maybeSingle();

      if (!error && data) {
        setTrackingInfo(data);
      }
    };

    fetchTrackingInfo();

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
  }, [project?.order_number]);

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

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) {
      toast({
        title: "Revision notes required",
        description: "Please provide details about what needs to be changed",
        variant: "destructive",
      });
      return;
    }
    await requestRevision(revisionNotes);
    setRevisionNotes("");
    setShowRevisionForm(false);
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

    setGenerating3D(true);
    try {
      // Extract vehicle and color info from project
      const vehicleInfo = project?.vehicle_info as any;
      const colorInfo = project?.color_info as any;

      const { data, error } = await supabase.functions.invoke('generate-color-render', {
        body: {
          designUrl: latestVersion.file_url,
          vehicleMake: vehicleInfo?.make,
          vehicleModel: vehicleInfo?.model,
          vehicleYear: vehicleInfo?.year,
          vehicleType: vehicleInfo?.type || project?.product_type || 'sedan',
          colorHex: colorInfo?.color_hex,
          colorName: colorInfo?.color || 'Custom Design',
          finishType: colorInfo?.finish || 'gloss',
          angle: 'hero'
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data?.imageUrl) {
        throw new Error('No image URL returned from render');
      }

      if (urlProjectId) {
        const renderUrls: Record<string, string> = {
          hero: data.imageUrl,
          angle: data.angle || 'hero'
        };

        await save3DRendersToApproveFlow(
          urlProjectId,
          latestVersion.id,
          renderUrls
        );
      }

      toast({
        title: "3D render generated",
        description: "View it in the 3D View tab",
      });
    } catch (error: any) {
      console.error('Error generating 3D:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Unable to generate 3D render",
        variant: "destructive",
      });
    } finally {
      setGenerating3D(false);
    }
  };

  const getProgressSteps = () => {
    const status = project?.status || 'design_requested';
    const statusMap: Record<string, number> = {
      'design_requested': 0,
      'proof_delivered': 1,
      'awaiting_feedback': 2,
      'revision_sent': 3,
      'approved': 4,
    };
    const currentStep = statusMap[status] ?? 0;

    return [
      { label: "Design Requested", status: currentStep === 0 ? "current" : currentStep > 0 ? "complete" : "pending" },
      { label: "Proof Delivered", status: currentStep === 1 ? "current" : currentStep > 1 ? "complete" : "pending" },
      { label: "Awaiting Feedback", status: currentStep === 2 ? "current" : currentStep > 2 ? "complete" : "pending" },
      { label: "Revision Sent", status: currentStep === 3 ? "current" : currentStep > 3 ? "complete" : "pending" },
      { label: "Approved", status: currentStep === 4 ? "current" : currentStep > 4 ? "complete" : "pending" },
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
      <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-white">Approve</span>
            <span className="text-gradient">Flow™</span>
          </h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant={activeRole === "designer" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveRole("designer")}
            >
              DESIGNER
            </Button>
            <Button
              variant={activeRole === "customer" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveRole("customer")}
            >
              CUSTOMER
            </Button>
          </div>

          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            🔄 LIVE SYNC
          </Badge>
        </div>
      </div>

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

      {/* Comprehensive Timeline */}
      <ApproveFlowTimeline
        projectCreatedAt={project.created_at}
        versions={versions}
        actions={actions}
        chatMessages={chatMessages}
        emailLogs={emailLogs}
        hasMissingFiles={!versions.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT: Order Info + Upload */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Info */}
          <Card className="p-4 bg-card border-border">
            <h3 className="text-sm font-semibold mb-3 text-gradient">Order Information</h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Job:</span>
                <span className="ml-2 font-mono">
                  {trackingInfo?.order_number || trackingInfo?.woo_order_number || project.order_number}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Customer:</span>
                <span className="ml-2">{project.customer_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Product:</span>
                <span className="ml-2">{project.product_type}</span>
              </div>
              {project.order_total && (
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-2">${project.order_total.toFixed(2)}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge className="ml-2 text-[10px]" variant="outline">{project.status}</Badge>
              </div>
              {project.vehicle_info && (
                <div className="pt-2 mt-2 border-t border-border">
                  <span className="text-muted-foreground block mb-1">Vehicle:</span>
                  <div className="pl-2 text-xs">
                    {project.vehicle_info.year && <span>{project.vehicle_info.year} </span>}
                    {project.vehicle_info.make && <span>{project.vehicle_info.make} </span>}
                    {project.vehicle_info.model && <span>{project.vehicle_info.model}</span>}
                    {project.vehicle_info.type && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Type: {project.vehicle_info.type}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {project.color_info && (
                <div className="pt-2 mt-2 border-t border-border">
                  <span className="text-muted-foreground block mb-1">Color:</span>
                  <div className="pl-2 text-xs space-y-0.5">
                    {project.color_info.color && <div>{project.color_info.color}</div>}
                    {project.color_info.color_hex && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border border-white/20" 
                          style={{ backgroundColor: project.color_info.color_hex }}
                        />
                        <span className="font-mono text-[10px]">{project.color_info.color_hex}</span>
                      </div>
                    )}
                    {project.color_info.finish && (
                      <div className="text-[10px] text-muted-foreground">
                        Finish: {project.color_info.finish}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {trackingInfo?.tracking_number && (
                <div className="pt-2 mt-2 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">Tracking:</span>
                  </div>
                  <div className="pl-5 space-y-1">
                    <p className="font-mono text-[10px]">{trackingInfo.tracking_number}</p>
                    {trackingInfo.shipped_at && (
                      <p className="text-[10px] text-muted-foreground">
                        Shipped {format(new Date(trackingInfo.shipped_at), 'MMM d, yyyy')}
                      </p>
                    )}
                    {trackingInfo.tracking_url && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-[10px]"
                        onClick={() => window.open(trackingInfo.tracking_url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Track Package
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Upload Section - Designer Only */}
          {activeRole === "designer" && (
            <Card className="p-4 bg-card border-border">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload 2D Proof
              </h3>
              <div className="space-y-3">
                <Textarea
                  placeholder="Version notes (optional)"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="text-xs h-16"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full"
                  size="sm"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3 h-3 mr-2" />
                      Select File
                    </>
                  )}
                </Button>
                {latestVersion && (
                  <Button
                    onClick={handleGenerate3D}
                    disabled={generating3D}
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                  >
                    {generating3D ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating 3D...
                      </>
                    ) : (
                      <>
                        <Box className="w-3 h-3" />
                        Generate 3D Render
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Design Instructions */}
          <Card className="p-4 bg-card border-border">
            <h3 className="text-sm font-semibold mb-2 text-gradient">Design Requirements</h3>
            {project.design_instructions ? (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{project.design_instructions}</p>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic">No specific design requirements provided</p>
            )}
          </Card>

          {/* Uploaded Assets */}
          {assets.length > 0 && (
            <Card className="p-4 bg-card border-border">
              <h3 className="text-sm font-semibold mb-3 text-gradient">Customer Files</h3>
              <div className="space-y-2">
                {assets.map((asset) => (
                  <a
                    key={asset.id}
                    href={asset.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded hover:bg-white/5 transition-colors text-xs group"
                  >
                    <ImageIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    <span className="flex-1 truncate group-hover:text-primary">
                      {asset.file_type || 'File'}
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* CENTER: Design Proof Viewer */}
        <div className="lg:col-span-2">
          <Card className="p-4 bg-card border-border h-full">
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

            <Tabs defaultValue={latestRenderUrls ? "compare" : "2d"} className="w-full">
              <TabsList className={`grid w-full ${latestRenderUrls ? 'grid-cols-3' : 'grid-cols-2'} mb-4`}>
                <TabsTrigger value="2d">2D Draft</TabsTrigger>
                {latestRenderUrls && <TabsTrigger value="compare">Compare</TabsTrigger>}
                <TabsTrigger value="3d">3D Render</TabsTrigger>
              </TabsList>
              
              <TabsContent value="2d" className="space-y-4">
                {displayVersion ? (
                  <div className="space-y-3">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      <img 
                        src={displayVersion.file_url} 
                        alt={`Version ${displayVersion.version_number}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="text-muted-foreground">
                        Version {displayVersion.version_number} • 
                        Submitted by {displayVersion.submitted_by} • 
                        {format(new Date(displayVersion.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                      {displayVersion.notes && (
                        <p className="text-foreground">{displayVersion.notes}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No design uploaded yet</p>
                  </div>
                )}
              </TabsContent>

              {latestRenderUrls && (
                <TabsContent value="compare" className="space-y-4">
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
                          src={latestRenderUrls.hero || latestRenderUrls.side || Object.values(latestRenderUrls)[0]} 
                          alt="3D Render"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
              
              <TabsContent value="3d">
                {latestRenderUrls ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      <img 
                        src={latestRenderUrls.hero || latestRenderUrls.side || Object.values(latestRenderUrls)[0]} 
                        alt="3D Render"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(latestRenderUrls).map(([angle, url]: [string, any]) => (
                        <div key={angle} className="aspect-square bg-muted rounded overflow-hidden border border-border hover:border-primary cursor-pointer transition-colors">
                          <img 
                            src={url as string} 
                            alt={`${angle} view`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Box className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No 3D renders yet</p>
                      <p className="text-xs text-muted-foreground">Click "Generate 3D Render" to create one</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Version History */}
            {versions.length > 1 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-xs font-semibold mb-2">Version History</h4>
                <div className="space-y-1">
                  {versions.map((v) => (
                    <div key={v.id} className="text-xs flex items-center justify-between py-1">
                      <span className="text-muted-foreground">
                        v{v.version_number} • {format(new Date(v.created_at), 'MMM d')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setSelectedVersion(v.id)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT: Chat + Actions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Chat Panel */}
          <Card className="p-4 bg-card border-border">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat with {activeRole === "designer" ? "Customer" : "Design Team"}
            </h3>
            
            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
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
                        {format(new Date(msg.created_at), 'h:mm a')}
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

          {/* Action Buttons */}
          {activeRole === "customer" && (
            <Card className="p-4 bg-card border-border space-y-3">
              {!showRevisionForm ? (
                <>
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                    onClick={handleApprove}
                    disabled={project.status === 'approved'}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {project.status === 'approved' ? 'Design Approved' : 'Approve Design'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowRevisionForm(true)}
                    disabled={project.status === 'approved'}
                  >
                    Request Revision
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder="What needs to be changed?"
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleRequestRevision}
                    >
                      Submit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowRevisionForm(false);
                        setRevisionNotes("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
      </div>
    </MainLayout>
  );
}
