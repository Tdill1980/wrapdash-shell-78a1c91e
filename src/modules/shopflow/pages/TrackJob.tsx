import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShopFlowOrder } from "@/hooks/useShopFlow";
import { Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { wooToInternalStatus } from "@/lib/status-mapping";
import { ShopFlowBrandHeader } from "@/components/ShopFlowBrandHeader";
import { CustomerProgressBar } from "@/components/CustomerProgressBar";
import { UploadedFilesCard } from "@/modules/shopflow/components/UploadedFilesCard";
import { OrderInfoCard } from "@/components/tracker/OrderInfoCard";
import { CurrentStageCard } from "@/components/tracker/CurrentStageCard";
import { NextStepCard } from "@/components/tracker/NextStepCard";
import { ActionRequiredCard } from "@/components/tracker/ActionRequiredCard";
import { OrderSummaryCard } from "@/components/tracker/OrderSummaryCard";
import { TimelineCard } from "@/components/tracker/TimelineCard";
import { toast } from "@/hooks/use-toast";
import { MainLayout } from "@/layouts/MainLayout";

export default function TrackJob() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<ShopFlowOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchOrder();
    const channel = supabase.channel(`order-${orderNumber}`).on('postgres_changes', { event: '*', schema: 'public', table: 'shopflow_orders', filter: `order_number=eq.${orderNumber}` }, (payload) => { if (payload.new) setOrder(payload.new as ShopFlowOrder); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderNumber]);

  const fetchOrder = async () => {
    if (!orderNumber) { setError("No order number provided"); setLoading(false); return; }
    try {
      const { data, error } = await supabase.from("shopflow_orders").select("*").eq("order_number", orderNumber).maybeSingle();
      if (error) throw error;
      if (!data) { setError("Order not found"); } else { setOrder(data); }
    } catch (err: any) { console.error("Error fetching order:", err); setError(err.message || "Failed to load order"); } finally { setLoading(false); }
  };

  const handleFileUpload = async (fileList: FileList) => {
    if (!order || !orderNumber) return;
    
    setUploading(true);
    try {
      const uploadedFiles: any[] = [];
      
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const filePath = `${orderNumber}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('shopflow-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('shopflow-files')
          .getPublicUrl(filePath);
        
        uploadedFiles.push({
          name: file.name,
          url: publicUrl,
          status: 'uploaded',
          uploaded_at: new Date().toISOString()
        });
      }
      
      const existingFiles = (order.files as any[]) || [];
      const updatedFiles = [...existingFiles, ...uploadedFiles];
      
      const updateData: any = { files: updatedFiles };
      if (order.status === 'dropbox-link-sent' || order.status === 'pending') {
        updateData.status = 'order_received';
      }
      
      const { error: updateError } = await supabase
        .from('shopflow_orders')
        .update(updateData)
        .eq('id', order.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Files uploaded successfully",
        description: `${uploadedFiles.length} file(s) uploaded`,
      });
      
      await fetchOrder();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <MainLayout userName="Customer">
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </MainLayout>
  );
  
  if (error || !order) return (
    <MainLayout userName="Customer">
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-muted-foreground">{error || "We couldn't find an order with that number."}</p>
        </Card>
      </div>
    </MainLayout>
  );

  const files = (order.files as any[]) || [];
  const missingFiles = ((order as any).missing_file_list as any) || [];
  const fileErrors = ((order as any).file_error_details as any) || [];
  
  // Build timeline from actual order timeline data
  const orderTimeline = (order.timeline as Record<string, string>) || {};
  const timeline = [
    { 
      label: "Order Received", 
      timestamp: order.created_at, 
      completed: true,
      status: "Order created in system"
    },
    { 
      label: "Dropbox Link Sent", 
      timestamp: orderTimeline["dropbox-link-sent"] || orderTimeline["dropbox_link_sent"] || "", 
      completed: !!orderTimeline["dropbox-link-sent"] || !!orderTimeline["dropbox_link_sent"],
      status: "Dropbox link sent to customer"
    },
    { 
      label: "Files Received", 
      timestamp: files.length > 0 ? files[0].uploaded_at : (orderTimeline["order_received"] || orderTimeline["in-design"] || ""), 
      completed: files.length > 0 || !!orderTimeline["in-design"],
      status: "Customer files received"
    },
    { 
      label: "In Design/Prep", 
      timestamp: orderTimeline["in-design"] || orderTimeline["ready-for-print"] || orderTimeline["pre-press"] || "", 
      completed: !!orderTimeline["in-design"] || !!orderTimeline["ready-for-print"] || !!orderTimeline["pre-press"],
      status: "Files being prepared"
    },
    { 
      label: "Print Production", 
      timestamp: orderTimeline["print-production"] || orderTimeline["printing"] || orderTimeline["lamination"] || orderTimeline["finishing"] || "", 
      completed: !!orderTimeline["print-production"] || !!orderTimeline["printing"] || !!orderTimeline["lamination"] || !!orderTimeline["finishing"],
      status: "In production"
    },
    { 
      label: "Ready/Shipped", 
      timestamp: orderTimeline["ready-for-pickup"] || orderTimeline["shipped"] || orderTimeline["completed"] || order.shipped_at || "", 
      completed: !!orderTimeline["ready-for-pickup"] || !!orderTimeline["shipped"] || !!orderTimeline["completed"] || !!order.shipped_at,
      status: order.shipped_at ? "Shipped" : "Ready for pickup"
    },
  ];

  return (
    <MainLayout userName="Customer">
      <div className="w-full space-y-6">
        <ShopFlowBrandHeader />
        <CustomerProgressBar 
          currentStatus={order.status}
          hasApproveFlowProject={!!order.approveflow_project_id}
        />
        <OrderInfoCard order={order} />
        
        {/* Timeline moved above NextStep */}
        <TimelineCard timeline={timeline} />
        
        <UploadedFilesCard 
          files={files} 
          missingFiles={missingFiles} 
          fileErrors={fileErrors} 
          orderId={order.id}
          onFileUpload={handleFileUpload}
          uploading={uploading}
          orderStatus={order.status}
        />
        <CurrentStageCard order={{ customer_stage: order.customer_stage || order.status }} />
        <NextStepCard order={{ customer_stage: order.customer_stage || order.status }} />
        <ActionRequiredCard order={{ customer_stage: order.customer_stage || order.status, file_error_details: fileErrors, missing_file_list: missingFiles }} />
        <OrderSummaryCard order={order} />
        <div className="text-center py-8 text-muted-foreground text-sm">
          Powered by <span className="text-primary">WrapCommand™</span> — Real-time wrap order tracking for peace of mind.
        </div>
      </div>
    </MainLayout>
  );
}
