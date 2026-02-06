import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare,
  AlertTriangle,
  Mail,
  Phone,
  Car,
  Search,
  RefreshCw,
  Link2Off,
  FileText
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface WebsiteChatQuote {
  id: string;
  quote_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  sqft: number | null;
  total_price: number | null;
  status: string | null;
  created_at: string;
  email_sent: boolean | null;
  source_conversation_id: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  created: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  converted: "bg-green-500/20 text-green-400 border-green-500/30",
  expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  lead: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function WebsiteChatQuotes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [linkFilter, setLinkFilter] = useState<string>("all");
  const [selectedQuote, setSelectedQuote] = useState<WebsiteChatQuote | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["website-chat-quotes", statusFilter],
    queryFn: async () => {
      console.log('[WebsiteChatQuotes] Fetching quotes...');
      try {
        // Use edge function to bypass RLS
        const params = new URLSearchParams();
        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        const response = await fetch(
          `https://qxllysilzonrlyoaomce.supabase.co/functions/v1/get-website-chat-quotes?${params}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error('[WebsiteChatQuotes] API error:', response.status, errText);
          throw new Error(`Failed to fetch quotes: ${response.status}`);
        }

        const result = await response.json();
        console.log('[WebsiteChatQuotes] Received:', result?.quotes?.length || 0, 'quotes');
        return result;
      } catch (err) {
        console.error('[WebsiteChatQuotes] Fetch error:', err);
        throw err;
      }
    },
  });

  // Debug logging
  console.log('[WebsiteChatQuotes] Render state:', { isLoading, hasError: !!error, hasData: !!data });

  // Show error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error loading quotes: {(error as Error).message}</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    );
  }

  const quotes = (data?.quotes || []) as WebsiteChatQuote[];
  const stats = data?.stats || { total: 0, today: 0, needsReview: 0, totalValue: 0 };

  const filteredQuotes = quotes.filter((quote) => {
    // Link filter
    if (linkFilter === "linked" && !quote.source_conversation_id) return false;
    if (linkFilter === "unlinked" && quote.source_conversation_id) return false;

    // Search filter
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      quote.quote_number?.toLowerCase().includes(search) ||
      quote.customer_name?.toLowerCase().includes(search) ||
      quote.customer_email?.toLowerCase().includes(search) ||
      quote.vehicle_make?.toLowerCase().includes(search) ||
      quote.vehicle_model?.toLowerCase().includes(search)
    );
  });

  // Count linked vs unlinked for display
  const linkedCount = quotes.filter(q => q.source_conversation_id).length;
  const unlinkedCount = quotes.filter(q => !q.source_conversation_id).length;

  const handleViewConversation = (conversationId: string) => {
    window.open(`/website-admin?conversation=${conversationId}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.today}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Not Emailed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.needsReview}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${stats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        {/* Chat Link Filter Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Show:</span>
          <ToggleGroup type="single" value={linkFilter} onValueChange={(v) => v && setLinkFilter(v)} className="bg-muted/50 p-1 rounded-lg">
            <ToggleGroupItem value="all" className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">
              All Quotes ({quotes.length})
            </ToggleGroupItem>
            <ToggleGroupItem value="linked" className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">
              <MessageSquare className="w-3 h-3 mr-1" />
              Chat-Linked ({linkedCount})
            </ToggleGroupItem>
            <ToggleGroupItem value="unlinked" className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">
              <Link2Off className="w-3 h-3 mr-1" />
              No Chat ({unlinkedCount})
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Search and Status Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search quotes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead className="text-right">SQFT</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No website chat quotes found</TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => {
                const needsAttention = !quote.email_sent;
                const hasLinkedChat = !!quote.source_conversation_id;
                return (
                  <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedQuote(quote)}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        {needsAttention && <AlertTriangle className="w-4 h-4 text-yellow-500" title="Not emailed yet" />}
                        {quote.quote_number}
                        {/* No linked chat badge */}
                        {!hasLinkedChat && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted-foreground/30 text-[10px] px-1.5 py-0">
                                  <Link2Off className="w-3 h-3 mr-1" />
                                  No chat
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[250px] text-xs">
                                This quote was created outside of Website Chat or before chat linking was available.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{quote.customer_name || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{quote.customer_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model}</TableCell>
                    <TableCell className="text-right font-mono">{quote.sqft || "-"}</TableCell>
                    <TableCell className="text-right font-mono font-medium">${quote.total_price?.toFixed(2) || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[quote.status || "created"]}>{quote.status || "created"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{format(new Date(quote.created_at), "MMM d, h:mm a")}</TableCell>
                    <TableCell>
                      {hasLinkedChat ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewConversation(quote.source_conversation_id!); }}>
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Chat</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={(e) => { e.stopPropagation(); setSelectedQuote(quote); }}>
                                <FileText className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Quote Details</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Quote Details
              {selectedQuote && !selectedQuote.email_sent && (
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Not Emailed</Badge>
              )}
            </SheetTitle>
            <SheetDescription>Quote #{selectedQuote?.quote_number}</SheetDescription>
          </SheetHeader>

          {selectedQuote && (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer</h4>
                <div className="space-y-2">
                  <span className="font-medium">{selectedQuote.customer_name || "Unknown"}</span>
                  {selectedQuote.customer_email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4" />{selectedQuote.customer_email}</div>
                  )}
                  {selectedQuote.customer_phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4" />{selectedQuote.customer_phone}</div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</h4>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedQuote.vehicle_year} {selectedQuote.vehicle_make} {selectedQuote.vehicle_model}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pricing</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Square Feet</div>
                    <div className="text-lg font-bold">{selectedQuote.sqft || "-"}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Material Cost</div>
                    <div className="text-lg font-bold text-green-500">${selectedQuote.total_price?.toFixed(2) || "-"}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                {/* Show linked chat status */}
                {!selectedQuote.source_conversation_id && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    <Link2Off className="w-4 h-4" />
                    <span>No linked chat – this quote was created outside of Website Chat or before linking was available.</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {selectedQuote.source_conversation_id ? (
                    <Button variant="outline" className="flex-1" onClick={() => handleViewConversation(selectedQuote.source_conversation_id!)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      View Conversation
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1" disabled>
                      <MessageSquare className="w-4 h-4 mr-2 opacity-50" />
                      No Chat Available
                    </Button>
                  )}
                  {selectedQuote.customer_email && (
                    <Button variant="secondary" className="flex-1" onClick={() => window.open(`mailto:${selectedQuote.customer_email}`)}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email Quote
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
