import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Package, MessageSquare, CheckCircle, Clock, Truck } from "lucide-react";
import { format } from "date-fns";

export default function CustomerPortal() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<any>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('approveflow_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        setLoading(false);
        return;
      }

      setProject(data);

      // Fetch tracking if exists
      if (data?.order_number) {
        const { data: orderData } = await supabase
          .from('shopflow_orders')
          .select('tracking_number, tracking_url, shipped_at')
          .eq('order_number', data.order_number)
          .maybeSingle();

        if (orderData) {
          setTracking(orderData);
        }
      }

      setLoading(false);
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We couldn't find the project you're looking for. Please check your link or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      design_requested: { label: "Design In Progress", variant: "secondary" },
      awaiting_feedback: { label: "Awaiting Your Approval", variant: "default" },
      revision_requested: { label: "Revisions In Progress", variant: "secondary" },
      approved: { label: "Approved", variant: "outline" },
      ready_for_print: { label: "Ready for Production", variant: "outline" },
      in_production: { label: "In Production", variant: "outline" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/src/assets/wrapcommand-logo.png" 
            alt="WrapCommand AI" 
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            Welcome to WrapCommand AI
          </h1>
          <p className="text-muted-foreground">
            Track your project progress and explore our design tools
          </p>
        </div>

        {/* Project Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order #{project.order_number}</CardTitle>
              {getStatusBadge(project.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{project.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Product</p>
                <p className="font-medium">{project.product_type}</p>
              </div>
              {project.order_total && (
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">${project.order_total.toFixed(2)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(project.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>

            {project.design_instructions && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Design Instructions</p>
                <p className="text-sm bg-muted p-3 rounded-md">{project.design_instructions}</p>
              </div>
            )}

            <Button 
              onClick={() => navigate(`/approveflow/${projectId}/proof`)}
              className="w-full"
              size="lg"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              View Design Proof
            </Button>
          </CardContent>
        </Card>

        {/* Tracking Info */}
        {tracking?.tracking_number && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Tracking Number</p>
                <p className="font-mono font-medium">{tracking.tracking_number}</p>
              </div>
              {tracking.shipped_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Shipped Date</p>
                  <p className="font-medium">{format(new Date(tracking.shipped_at), 'MMM d, yyyy')}</p>
                </div>
              )}
              {tracking.tracking_url && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(tracking.tracking_url, '_blank')}
                >
                  Track Package
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* DesignPro AI CTA */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Try DesignPro AI Visualizer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Visualize your custom designs on 3D vehicle models before production. 
              See exactly how your wrap will look with our AI-powered rendering engine.
            </p>
            <Button 
              onClick={() => navigate('/wrapcloser')}
              className="w-full"
              size="lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Launch DesignPro AI
            </Button>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Order Received</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(project.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {project.status === 'design_requested' ? (
                    <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Design In Progress</p>
                  <p className="text-sm text-muted-foreground">
                    Our design team is working on your project
                  </p>
                </div>
              </div>

              {['awaiting_feedback', 'approved', 'ready_for_print', 'in_production'].includes(project.status) && (
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Design Ready for Review</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(project.updated_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {['approved', 'ready_for_print', 'in_production'].includes(project.status) && (
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Design Approved</p>
                    <p className="text-sm text-muted-foreground">Ready for production</p>
                  </div>
                </div>
              )}

              {tracking?.shipped_at && (
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Shipped</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(tracking.shipped_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
