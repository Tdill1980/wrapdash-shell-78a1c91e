import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Users, FileText, Search, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function QuoteToolAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["quote-tool-admin", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["quote-tool-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("id, total_price, status, converted_to_order, conversion_revenue");
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const converted = data?.filter(q => q.converted_to_order)?.length || 0;
      const revenue = data?.reduce((sum, q) => sum + (q.conversion_revenue || 0), 0) || 0;
      const pending = data?.filter(q => q.status === "pending_approval")?.length || 0;
      
      return { total, converted, revenue, pending };
    },
  });

  const filteredQuotes = quotes?.filter(q => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      q.customer_name?.toLowerCase().includes(term) ||
      q.customer_email?.toLowerCase().includes(term) ||
      q.quote_number?.toLowerCase().includes(term) ||
      q.vehicle_make?.toLowerCase().includes(term) ||
      q.vehicle_model?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400">Converted</Badge>;
      case "sent": return <Badge className="bg-blue-500/20 text-blue-400">Email Sent</Badge>;
      case "pending_approval": return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case "lead": return <Badge className="bg-purple-500/20 text-purple-400">Lead</Badge>;
      default: return <Badge variant="outline">{status || "Draft"}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>Quote</span>
              <span className="bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent">Tool</span>
              <span className="text-sm text-green-400 font-normal">$21K+ Revenue</span>
            </h1>
            <p className="text-muted-foreground">All quotes from website chat and external tools</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> Total Quotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Converted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats?.converted || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                ${(stats?.revenue || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending_approval">Pending</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="completed">Converted</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Quotes Table */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-4">Quote #</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Loading...</td></tr>
                  ) : filteredQuotes?.length === 0 ? (
                    <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No quotes found</td></tr>
                  ) : (
                    filteredQuotes?.map((quote) => (
                      <tr key={quote.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="p-4 font-mono text-sm">{quote.quote_number}</td>
                        <td className="p-4">
                          <div className="font-medium">{quote.customer_name || "—"}</div>
                          <div className="text-sm text-muted-foreground">{quote.customer_email}</div>
                        </td>
                        <td className="p-4 text-sm">
                          {quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model}
                        </td>
                        <td className="p-4 font-medium">
                          ${(quote.total_price || 0).toLocaleString()}
                        </td>
                        <td className="p-4">{getStatusBadge(quote.status)}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {quote.created_at ? format(new Date(quote.created_at), "MMM d, yyyy") : "—"}
                        </td>
                        <td className="p-4">
                          {quote.woo_order_id && (
                            <Button variant="ghost" size="sm" asChild>
                              <a 
                                href={`https://weprintwraps.com/wp-admin/post.php?post=${quote.woo_order_id}&action=edit`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}