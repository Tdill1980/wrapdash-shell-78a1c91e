import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Mail, RefreshCw, Search, ShoppingCart, Plus } from "lucide-react";
import { EmailPreviewDialog } from "@/components/mightymail/EmailPreviewDialog";
import { MainLayout } from "@/layouts/MainLayout";
import { useOrganization } from "@/contexts/OrganizationContext";
import { generateOrderNumber } from "@/lib/orderNumberGenerator";
import { isWPW } from "@/lib/wpwProducts";
import { useNavigate } from "react-router-dom";

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_details?: string;
  product_name?: string;
  sqft?: number;
  material_cost?: number;
  labor_cost?: number;
  total_price: number;
  status: string;
  wc_sync_status: string;
  follow_up_count: number;
  auto_retarget: boolean;
  email_tone: string;
  email_design: string;
  created_at: string;
  utim_score?: number;
  engagement_level?: string;
  last_activity?: string;
  open_count?: number;
  click_count?: number;
}

export default function MightyMailQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    expired: 0,
    autoFollow: 0,
  });
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [convertingOrder, setConvertingOrder] = useState<string | null>(null);
  const { toast } = useToast();
  const { organizationId, organizationSettings } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuotes();
  }, []);

  async function fetchQuotes() {
    setLoading(true);
    try {
      let query = supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });
      
      // Filter by organization if not main WPW org
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setQuotes(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      console.error("Error fetching quotes:", error);
      toast({
        title: "Error",
        description: "Failed to load quotes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(quotesData: Quote[]) {
    setStats({
      total: quotesData.length,
      pending: quotesData.filter((q) => q.status === "pending").length,
      completed: quotesData.filter((q) => q.status === "completed").length,
      expired: quotesData.filter((q) => q.status === "expired").length,
      autoFollow: quotesData.filter((q) => q.auto_retarget).length,
    });
  }

  async function toggleAutoRetarget(quoteId: string, currentValue: boolean) {
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ auto_retarget: !currentValue })
        .eq("id", quoteId);

      if (error) throw error;

      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quoteId ? { ...q, auto_retarget: !currentValue } : q
        )
      );

      toast({
        title: "Updated",
        description: `Auto-retarget ${!currentValue ? "enabled" : "disabled"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update auto-retarget setting",
        variant: "destructive",
      });
    }
  }

  async function sendOrderConfirmation(quote: Quote) {
    setSendingEmail(quote.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-mightymail-quote", {
        body: {
          customerEmail: quote.customer_email,
          customerName: quote.customer_name,
          quoteData: {
            vehicle_year: quote.vehicle_year,
            vehicle_make: quote.vehicle_make,
            vehicle_model: quote.vehicle_model,
            product_name: quote.product_name,
            sqft: quote.sqft,
            material_cost: quote.material_cost,
            labor_cost: quote.labor_cost,
            quote_total: quote.total_price,
            portal_url: window.location.origin + "/mighty-customer",
          },
          tone: quote.email_tone,
          design: quote.email_design,
        },
      });

      if (error) throw error;

      // Update follow-up count
      await supabase
        .from("quotes")
        .update({
          follow_up_count: quote.follow_up_count + 1,
          last_follow_up_sent: new Date().toISOString(),
        })
        .eq("id", quote.id);

      toast({
        title: "Email Sent!",
        description: `Order confirmation sent to ${quote.customer_email}`,
      });

      fetchQuotes(); // Refresh to update follow-up count
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(null);
    }
  }

  function handlePreviewEmail(quote: Quote) {
    setSelectedQuote(quote);
    setEmailPreviewOpen(true);
  }

  async function handleConvertToOrder(quote: Quote) {
    setConvertingOrder(quote.id);
    try {
      // Check if product is WPW (has woo_product_id)
      const { data: product } = await supabase
        .from('products')
        .select('woo_product_id, product_type')
        .eq('product_name', quote.product_name)
        .maybeSingle();

      const isWPWProduct = product && product.woo_product_id && isWPW(product.woo_product_id);

      if (isWPWProduct) {
        // Save pending order then open WPW cart
        const pendingOrderNumber = generateOrderNumber(organizationSettings.subdomain);
        
        const { error: orderError } = await supabase.from("shopflow_orders").insert({
          order_number: pendingOrderNumber,
          organization_id: organizationId,
          customer_name: quote.customer_name,
          customer_email: quote.customer_email,
          product_type: quote.product_name || '',
          status: "pending_wpw_checkout",
          customer_stage: "awaiting_checkout",
          vehicle_info: {
            year: quote.vehicle_year,
            make: quote.vehicle_make,
            model: quote.vehicle_model,
          },
          order_source: "wpw_reseller",
        });

        if (orderError) throw orderError;

        // Open WPW cart
        const wooCartUrl = `https://weprintwraps.com/cart/?add-to-cart=${product.woo_product_id}&quantity=1`;
        window.open(wooCartUrl, '_blank');

        toast({
          title: "Opening WePrintWraps.com",
          description: `Order ${pendingOrderNumber} created. Complete checkout to finalize.`,
        });
      } else {
        // Create direct order for non-WPW products
        const orderNumber = generateOrderNumber(organizationSettings.subdomain);
        
        const { error } = await supabase.from("shopflow_orders").insert({
          order_number: orderNumber,
          organization_id: organizationId,
          customer_name: quote.customer_name,
          customer_email: quote.customer_email,
          product_type: quote.product_name || '',
          status: "design_requested",
          customer_stage: "order_received",
          vehicle_info: {
            year: quote.vehicle_year,
            make: quote.vehicle_make,
            model: quote.vehicle_model,
          },
          order_source: "direct",
        });

        if (error) throw error;

        toast({
          title: "Order Created",
          description: `Order ${orderNumber} created successfully!`,
        });
        
        navigate("/shopflow-internal");
      }
    } catch (error: any) {
      console.error("Convert to order error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert quote to order",
        variant: "destructive",
      });
    } finally {
      setConvertingOrder(null);
    }
  }

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.vehicle_make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.vehicle_model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout userName="Admin">
      <div className="w-full space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          <span className="text-white">Mighty</span>
          <span className="bg-gradient-to-r from-[#00AFFF] via-[#008CFF] to-[#4EEAFF] bg-clip-text text-transparent">Mail™</span>
          <span className="text-white"> Quotes</span>
        </h2>
        <p className="text-muted-foreground">
          View and manage all generated quotes with automated retargeting
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <span className="text-blue-400 text-lg">📊</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Quotes</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <span className="text-yellow-400 text-lg">⏳</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <span className="text-green-400 text-lg">✓</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <span className="text-red-400 text-lg">⊗</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-foreground">{stats.expired}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <span className="text-purple-400 text-lg">📧</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Auto-Follow</p>
              <p className="text-2xl font-bold text-foreground">{stats.autoFollow}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, email, or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <Button onClick={fetchQuotes} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quotes Table */}
      <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)]">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Quotes ({filteredQuotes.length})
          </h3>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading quotes...
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No quotes found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Quote #
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Customer
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Vehicle
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Total Price
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Engagement
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Follow-ups
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Auto-Retarget
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      className="border-b border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.02)]"
                    >
                      <td className="py-4 px-2 text-sm font-mono text-foreground">
                        {quote.quote_number}
                      </td>
                      <td className="py-4 px-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {quote.customer_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {quote.customer_email}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="text-sm">
                          <p className="text-foreground font-medium">
                            {quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model}
                          </p>
                          {quote.product_name && (
                            <p className="text-xs text-muted-foreground">
                              {quote.product_name}
                            </p>
                          )}
                          {quote.sqft && (
                            <p className="text-xs text-muted-foreground">
                              ({quote.sqft} sq ft)
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-sm font-semibold text-foreground">
                        ${quote.total_price.toFixed(2)}
                      </td>
                      <td className="py-4 px-2">
                        <Badge
                          variant={
                            quote.status === "completed"
                              ? "default"
                              : quote.status === "expired"
                              ? "destructive"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {quote.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant="outline" 
                            className={
                              quote.engagement_level === 'hot' 
                                ? 'border-green-500 text-green-500' 
                                : quote.engagement_level === 'warm' 
                                ? 'border-yellow-500 text-yellow-500' 
                                : 'border-muted text-muted-foreground'
                            }
                          >
                            {quote.engagement_level || 'cold'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Score: {quote.utim_score || 0}
                          </div>
                          {quote.last_activity && (
                            <div className="text-xs opacity-50">
                              {new Date(quote.last_activity).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-sm text-center text-foreground">
                        {quote.follow_up_count}/3
                      </td>
                      <td className="py-4 px-2">
                        <Switch
                          checked={quote.auto_retarget}
                          onCheckedChange={() =>
                            toggleAutoRetarget(quote.id, quote.auto_retarget)
                          }
                        />
                      </td>
                      <td className="py-4 px-2 text-sm text-muted-foreground">
                        {new Date(quote.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreviewEmail(quote)}
                            className="h-8 w-8 p-0"
                            title="Preview Email"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sendOrderConfirmation(quote)}
                            disabled={sendingEmail === quote.id}
                            className="h-8 w-8 p-0"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleConvertToOrder(quote)}
                            disabled={convertingOrder === quote.id}
                            className="h-8 w-8 p-0"
                            title="Convert to Order"
                          >
                            {convertingOrder === quote.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <ShoppingCart className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Email Preview Dialog */}
      {selectedQuote && (
        <EmailPreviewDialog
          open={emailPreviewOpen}
          onOpenChange={setEmailPreviewOpen}
          quoteData={{
            customerName: selectedQuote.customer_name,
            vehicleYear: selectedQuote.vehicle_year,
            vehicleMake: selectedQuote.vehicle_make,
            vehicleModel: selectedQuote.vehicle_model,
            productName: selectedQuote.product_name,
            sqft: selectedQuote.sqft,
            materialCost: selectedQuote.material_cost,
            laborCost: selectedQuote.labor_cost,
            total: selectedQuote.total_price,
            portalUrl: window.location.origin + "/mighty-customer",
          }}
          tone={selectedQuote.email_tone}
          design={selectedQuote.email_design}
        />
      )}
      </div>
    </MainLayout>
  );
}
