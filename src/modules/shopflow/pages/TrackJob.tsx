import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShopFlowOrder } from "@/hooks/useShopFlow";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ShopFlowBrandHeader } from "@/components/ShopFlowBrandHeader";
import { CustomerProgressBar } from "@/components/CustomerProgressBar";
import { UploadedFilesCard } from "@/modules/shopflow/components/UploadedFilesCard";
import { OrderInfoCard } from "@/components/tracker/OrderInfoCard";
import { CurrentStageCard } from "@/components/tracker/CurrentStageCard";
import { NextStepCard } from "@/components/tracker/NextStepCard";
import { ActionRequiredCard } from "@/components/tracker/ActionRequiredCard";
import { OrderSummaryCard } from "@/components/tracker/OrderSummaryCard";
import { ManualSyncButton } from "@/modules/shopflow/components/ManualSyncButton";
import { toast } from "@/hooks/use-toast";
import { MainLayout } from "@/layouts/MainLayout";
import { useAdmin } from "@/hooks/useAdmin";

export default function TrackJob() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<ShopFlowOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { isAdmin } = useAdmin();

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
    <MainLayout userName={isAdmin ? "Trish" : "Customer"}>
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </MainLayout>
  );
  
  if (error || !order) return (
    <MainLayout userName={isAdmin ? "Trish" : "Customer"}>
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

  return (
    <MainLayout userName={isAdmin ? "Trish" : "Customer"}>
      <div className="w-full space-y-6">
        {/* Brand Header */}
        <ShopFlowBrandHeader />
        
        {/* Admin-Only: Manual Sync Button */}
        {isAdmin && (
          <div className="flex justify-end">
            <ManualSyncButton 
              orderNumber={order.order_number} 
              onSyncComplete={fetchOrder}
            />
          </div>
        )}
        
        {/* Order Info - Full Width Horizontal */}
        <OrderInfoCard order={order} />
        
        {/* Progress Bar - Icon-Based Timeline */}
        <CustomerProgressBar 
          currentStatus={order.status}
          hasApproveFlowProject={!!order.approveflow_project_id}
        />
        
        {/* Primary Status Cards - Full Width Horizontal */}
        <div className="space-y-4">
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
        </div>
        
        
        {/* Additional Cards */}
        <div className="flex flex-wrap gap-4">
          {(fileErrors.length > 0 || missingFiles.length > 0) && (
            <div className="flex-1 min-w-[280px]">
              <ActionRequiredCard order={{ customer_stage: order.customer_stage || order.status, file_error_details: fileErrors, missing_file_list: missingFiles }} />
            </div>
          )}
          
          <div className="flex-1 min-w-[280px]">
            <OrderSummaryCard order={order} />
          </div>
          
          {order.approveflow_project_id && (
            <div className="flex-1 min-w-[280px]">
              <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 h-full">
                <h3 className="text-lg font-semibold text-white mb-2">Design Proof Available</h3>
                <p className="text-white/70 text-sm mb-4">Your design proof is ready for review in ApproveFlow.</p>
                <a 
                  href={`/approveflow/${order.approveflow_project_id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  View Design Proof
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Card>
            </div>
          )}
        </div>
        
        <div className="text-center py-8 text-muted-foreground text-sm">
          Powered by <span className="text-primary">WrapCommand™</span> — Real-time wrap order tracking for peace of mind.
        </div>
      </div>
    </MainLayout>
  );
}