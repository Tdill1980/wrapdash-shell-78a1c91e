import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShopFlowOrder, useShopFlow } from "@/hooks/useShopFlow";
import { MainLayout } from "@/layouts/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  Package, 
  User, 
  Car, 
  Calendar,
  ExternalLink,
  FileText
} from "lucide-react";
import { BeforePhotosPrompt } from "@/components/portfolio/BeforePhotosPrompt";
import { formatWooStatus, getWooStatusColor } from "@/lib/woo-status-display";
import { format } from "date-fns";

export default function ShopFlowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { order, loading } = useShopFlow(id);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
            <p className="text-muted-foreground mb-4">
              We couldn't find an order with that ID.
            </p>
            <Button onClick={() => navigate("/shopflow")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to ShopFlow
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const vehicleInfo = order.vehicle_info as { year?: number; make?: string; model?: string } | null;

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/shopflow")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-poppins">
              Order #{order.woo_order_number ?? order.order_number}
            </h1>
            <p className="text-sm text-muted-foreground">{order.product_type}</p>
          </div>
          <Badge 
            className={`bg-gradient-to-r ${getWooStatusColor(order.status)} text-white px-3 py-1`}
          >
            {formatWooStatus(order.status)}
          </Badge>
        </div>

        {/* Before Photos Prompt - Only show for certain statuses */}
        {["processing", "in-design", "design-complete", "ready-for-print", "pre-press", "print-production"].includes(order.status) && (
          <BeforePhotosPrompt
            shopflowOrderId={order.id}
            orderNumber={order.order_number}
            customerName={order.customer_name}
            vehicleInfo={vehicleInfo || undefined}
          />
        )}

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Info */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Customer</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">{order.customer_name}</p>
              {order.customer_email && (
                <p className="text-muted-foreground">{order.customer_email}</p>
              )}
            </div>
          </Card>

          {/* Vehicle Info */}
          {vehicleInfo && (vehicleInfo.year || vehicleInfo.make || vehicleInfo.model) && (
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Vehicle</h3>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">
                  {[vehicleInfo.year, vehicleInfo.make, vehicleInfo.model]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              </div>
            </Card>
          )}

          {/* Order Info */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Product</h3>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">{order.product_type}</p>
              {order.priority && (
                <Badge variant="outline" className="text-xs">
                  {order.priority} Priority
                </Badge>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Timeline</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">
                  {format(new Date(order.created_at), "MMM d, yyyy")}
                </span>
              </div>
              {order.estimated_completion_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Completion</span>
                  <span className="text-foreground">
                    {format(new Date(order.estimated_completion_date), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {order.approveflow_project_id && (
            <Button 
              variant="outline"
              onClick={() => navigate(`/approveflow/${order.approveflow_project_id}`)}
            >
              <FileText className="w-4 h-4 mr-2" />
              View in ApproveFlow
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => navigate(`/track/${order.order_number}`)}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Customer Tracking Page
          </Button>
        </div>

        {/* Notes */}
        {order.notes && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {order.notes}
            </p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
