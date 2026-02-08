// =============================================================================
// WePrintWraps.com ShopFlow Account - Customer Dashboard Preview
// Powered by WrapCommandAI.com
// =============================================================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  History,
  LayoutDashboard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// =============================================================================
// TYPES
// =============================================================================
interface ShopFlowOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  customer_stage: string;
  order_total: number;
  created_at: string;
  product_name: string;
  product_image_url: string;
  eta_date: string;
}

interface DesignDropItem {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  isNew: boolean;
  isFeatured: boolean;
}

// =============================================================================
// STATUS HELPERS
// =============================================================================
const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; color: string; progress: number; icon: any }> = {
    order_received: { label: "Order Received", color: "bg-blue-500", progress: 15, icon: Package },
    in_design: { label: "In Design", color: "bg-purple-500", progress: 30, icon: Sparkles },
    awaiting_approval: { label: "Awaiting Approval", color: "bg-yellow-500", progress: 45, icon: Clock },
    preparing_for_print: { label: "Preparing for Print", color: "bg-orange-500", progress: 55, icon: FileText },
    in_production: { label: "In Production", color: "bg-indigo-500", progress: 70, icon: Package },
    ready_or_shipped: { label: "Ready / Shipped", color: "bg-green-500", progress: 90, icon: Truck },
    completed: { label: "Completed", color: "bg-green-600", progress: 100, icon: CheckCircle },
  };
  return configs[status] || configs.order_received;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
};

// =============================================================================
// MOCK DATA FOR PREVIEW (will be replaced with real data)
// =============================================================================
const mockDesignDropItems: DesignDropItem[] = [
  { id: "1", name: "Carbon Fiber Pro", thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop", category: "texture", isNew: true, isFeatured: false },
  { id: "2", name: "Desert Camo", thumbnail: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&h=300&fit=crop", category: "camo", isNew: true, isFeatured: true },
  { id: "3", name: "Galaxy Purple", thumbnail: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=300&h=300&fit=crop", category: "color-shift", isNew: false, isFeatured: false },
  { id: "4", name: "Racing Stripes", thumbnail: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=300&h=300&fit=crop", category: "graphics", isNew: false, isFeatured: true },
  { id: "5", name: "Brushed Metal", thumbnail: "https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=300&h=300&fit=crop", category: "texture", isNew: true, isFeatured: false },
  { id: "6", name: "Midnight Blue", thumbnail: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=300&h=300&fit=crop", category: "solid", isNew: false, isFeatured: false },
];

// =============================================================================
// COMPONENTS
// =============================================================================

// Active Order Card
const ActiveOrderCard = ({ order }: { order: ShopFlowOrder }) => {
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  const handleReorder = () => {
    // Safe redirect to WePrintWraps cart
    window.open(`https://weprintwraps.com/cart/?add-to-cart=234&quantity=1`, '_blank');
  };

  return (
    <Card className="bg-[#1A1A2E] border-[#2A2A4A] hover:border-[#3A3A5A] transition-all">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="w-24 h-24 rounded-lg bg-[#2A2A4A] overflow-hidden flex-shrink-0">
            {order.product_image_url ? (
              <img 
                src={order.product_image_url} 
                alt={order.product_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>

          {/* Order Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-white">Order #{order.order_number}</h3>
                <p className="text-sm text-gray-400 truncate">{order.product_name || "Vehicle Wrap"}</p>
              </div>
              <Badge className={`${statusConfig.color} text-white`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <Progress value={statusConfig.progress} className="h-2 bg-[#2A2A4A]" />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">{statusConfig.progress}% Complete</span>
                {order.eta_date && (
                  <span className="text-xs text-gray-400">ETA: {formatDate(order.eta_date)}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs border-[#3A3A5A] hover:bg-[#2A2A4A]">
                Track Details
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Order History Item
const OrderHistoryItem = ({ order }: { order: ShopFlowOrder }) => {
  const handleReorder = () => {
    window.open(`https://weprintwraps.com/cart/?add-to-cart=234&quantity=1`, '_blank');
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-[#1A1A2E] rounded-lg border border-[#2A2A4A] hover:border-[#3A3A5A] transition-all">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-[#2A2A4A] overflow-hidden flex-shrink-0">
        {order.product_image_url ? (
          <img 
            src={order.product_image_url} 
            alt={order.product_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-gray-500" />
          </div>
        )}
      </div>

      {/* Order Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white">#{order.order_number}</span>
          <span className="text-gray-500">•</span>
          <span className="text-sm text-gray-400">{formatDate(order.created_at)}</span>
          <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        </div>
        <p className="text-sm text-gray-400 truncate">{order.product_name || "Vehicle Wrap"}</p>
      </div>

      {/* Price & Actions */}
      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-white mb-2">{formatCurrency(order.order_total || 0)}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="text-xs text-gray-400 hover:text-white">
            View
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs border-[#00D4FF] text-[#00D4FF] hover:bg-[#00D4FF]/10"
            onClick={handleReorder}
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            Reorder
          </Button>
        </div>
      </div>
    </div>
  );
};

// DesignDrop Carousel
const DesignDropCarousel = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  return (
    <Card className="bg-gradient-to-br from-[#1A1A2E] to-[#2A1A4E] border-[#3A2A5A]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00D4FF]" />
            <CardTitle className="text-lg">ClubWPW DesignDrop</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-[#00D4FF] hover:text-[#00D4FF]/80">
            Browse All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <p className="text-sm text-gray-400">Print-ready designs. Just add vehicle.</p>
      </CardHeader>
      <CardContent>
        {/* Carousel */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {mockDesignDropItems.map((item) => (
              <div 
                key={item.id}
                className="flex-shrink-0 w-36 group cursor-pointer"
              >
                <div className="relative rounded-lg overflow-hidden mb-2">
                  <img 
                    src={item.thumbnail} 
                    alt={item.name}
                    className="w-36 h-36 object-cover group-hover:scale-105 transition-transform"
                  />
                  {item.isNew && (
                    <Badge className="absolute top-2 left-2 bg-[#00D4FF] text-black text-xs">
                      NEW
                    </Badge>
                  )}
                  {item.isFeatured && !item.isNew && (
                    <Badge className="absolute top-2 left-2 bg-orange-500 text-white text-xs">
                      🔥 HOT
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-500 capitalize">{item.category}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RestyleProAI CTA */}
        <div className="mt-4 p-4 bg-[#0A0A1E] rounded-lg border border-[#00D4FF]/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                Try RestyleProAI FREE for 7 days
              </h4>
              <p className="text-sm text-gray-400">Visualize any design on YOUR vehicle</p>
            </div>
            <Button className="bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90">
              Start Free Trial
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Stats
const QuickStats = ({ orders }: { orders: ShopFlowOrder[] }) => {
  const activeOrders = orders.filter(o => o.status !== 'completed').length;
  const totalOrders = orders.length;
  const lifetimeSpend = orders.reduce((sum, o) => sum + (o.order_total || 0), 0);

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="bg-[#1A1A2E] border-[#2A2A4A]">
        <CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-white">{totalOrders}</p>
          <p className="text-sm text-gray-400">Total Orders</p>
        </CardContent>
      </Card>
      <Card className="bg-[#1A1A2E] border-[#2A2A4A]">
        <CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-[#00D4FF]">{formatCurrency(lifetimeSpend)}</p>
          <p className="text-sm text-gray-400">Lifetime Value</p>
        </CardContent>
      </Card>
      <Card className="bg-[#1A1A2E] border-[#2A2A4A]">
        <CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-orange-400">{activeOrders}</p>
          <p className="text-sm text-gray-400">Active Orders</p>
        </CardContent>
      </Card>
    </div>
  );
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================
export default function MyShopFlowPreview() {
  const [orders, setOrders] = useState<ShopFlowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch real orders from ShopFlow
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('shopflow_orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const activeOrders = orders.filter(o => o.status !== 'completed');
  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <div className="min-h-screen bg-[#0A0A1E]">
      {/* Header */}
      <header className="border-b border-[#2A2A4A] bg-[#0A0A1E]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-white">WePrintWraps.com</span>
                <span className="text-[#00D4FF]"> ShopFlow</span>
                <span className="text-gray-400 font-normal text-sm ml-2">Account</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Welcome back!</span>
              <Button variant="outline" size="sm" className="border-[#3A3A5A]">
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#1A1A2E] border border-[#2A2A4A]">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#2A2A4A]">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#2A2A4A]">
              <Package className="w-4 h-4 mr-2" />
              Active Orders
              {activeOrders.length > 0 && (
                <Badge className="ml-2 bg-[#00D4FF] text-black">{activeOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-[#2A2A4A]">
              <History className="w-4 h-4 mr-2" />
              Order History
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <QuickStats orders={orders} />

            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#00D4FF]" />
                  Active Orders
                </h2>
                <div className="space-y-4">
                  {activeOrders.slice(0, 3).map((order) => (
                    <ActiveOrderCard key={order.id} order={order} />
                  ))}
                </div>
                {activeOrders.length > 3 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 text-[#00D4FF]"
                    onClick={() => setActiveTab("orders")}
                  >
                    View All Active Orders ({activeOrders.length})
                  </Button>
                )}
              </div>
            )}

            {/* DesignDrop Carousel */}
            <DesignDropCarousel />
          </TabsContent>

          {/* Active Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">
              Active Orders ({activeOrders.length})
            </h2>
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading orders...</div>
            ) : activeOrders.length === 0 ? (
              <Card className="bg-[#1A1A2E] border-[#2A2A4A]">
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Active Orders</h3>
                  <p className="text-gray-400 mb-4">All your orders have been completed!</p>
                  <Button className="bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90">
                    Shop WePrintWraps.com
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <ActiveOrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Order History Tab */}
          <TabsContent value="history" className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">
              Order History ({completedOrders.length})
            </h2>
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading history...</div>
            ) : completedOrders.length === 0 ? (
              <Card className="bg-[#1A1A2E] border-[#2A2A4A]">
                <CardContent className="py-12 text-center">
                  <History className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Order History</h3>
                  <p className="text-gray-400">Completed orders will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {completedOrders.map((order) => (
                  <OrderHistoryItem key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A2A4A] mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>© 2026 WePrintWraps.com. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Powered by 
              <a 
                href="https://wrapcommandai.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#00D4FF] hover:underline"
              >
                WrapCommandAI.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
