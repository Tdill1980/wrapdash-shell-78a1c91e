import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";

export default function MyShopFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get order number from URL query param first
    const orderParam = searchParams.get('order');
    
    if (orderParam) {
      // Store in sessionStorage for future visits
      sessionStorage.setItem('customer_order_number', orderParam);
      // Redirect to tracking page
      navigate(`/track/${orderParam}`, { replace: true });
      return;
    }

    // If not in URL, check sessionStorage
    const storedOrder = sessionStorage.getItem('customer_order_number');
    
    if (storedOrder) {
      // Redirect to tracking page
      navigate(`/track/${storedOrder}`, { replace: true });
      return;
    }

    // No order number found - show error
    setLoading(false);
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <MainLayout userName="Customer">
        <div className="w-full min-h-[60vh] flex items-center justify-center">
          <Card className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground mt-4">Loading your order...</p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userName="Customer">
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find your order information. Please use the link from your email or contact support.
          </p>
          <a 
            href="mailto:support@weprintwraps.com" 
            className="text-primary hover:underline"
          >
            Contact Support
          </a>
        </Card>
      </div>
    </MainLayout>
  );
}
