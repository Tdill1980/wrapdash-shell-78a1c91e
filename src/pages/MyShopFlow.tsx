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
    // Try to get order number from URL query param
    const orderParam = searchParams.get('order');
    
    if (orderParam) {
      // Redirect to tracking page if order is in URL
      navigate(`/track/${orderParam}`, { replace: true });
      return;
    }

    // Show lookup form
    setLoading(false);
  }, [searchParams, navigate]);

  const handleLookup = () => {
    const trimmedOrder = orderNumber.trim();
    if (trimmedOrder) {
      navigate(`/track/${trimmedOrder}`);
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
        <Card className="p-12 text-center max-w-lg w-full mx-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 font-['Poppins']">
              <span className="text-white">My </span>
              <span className="bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] bg-clip-text text-transparent">ShopFlow</span>
              <span className="text-[10px] align-super opacity-70">™</span>
            </h1>
            <p className="text-muted-foreground">
              Track your wrap order in real-time
            </p>
          </div>
          
          <div className="flex gap-2 mb-6">
            <Input
              type="text"
              placeholder="Enter Order Number (e.g., 33223)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
              className="text-lg h-12"
            />
            <Button onClick={handleLookup} size="lg" className="px-6">
              <Search className="w-5 h-5" />
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
