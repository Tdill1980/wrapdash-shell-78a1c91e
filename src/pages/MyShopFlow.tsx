import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";

export default function MyShopFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState("");

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

    // No order number found - show lookup form
    setLoading(false);
  }, [searchParams, navigate]);

  const handleLookup = () => {
    if (orderNumber.trim()) {
      sessionStorage.setItem('customer_order_number', orderNumber.trim());
      navigate(`/track/${orderNumber.trim()}`);
    }
  };

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
          <h2 className="text-2xl font-bold mb-4">Track Your Order</h2>
          <p className="text-muted-foreground mb-6">
            Enter your order number to view your order status
          </p>
          <div className="flex gap-2 mb-6">
            <Input
              type="text"
              placeholder="Order Number (e.g., 33223)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
            />
            <Button onClick={handleLookup}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Need help? <a href="mailto:support@weprintwraps.com" className="text-primary hover:underline">Contact Support</a>
          </p>
        </Card>
      </div>
    </MainLayout>
  );
}
