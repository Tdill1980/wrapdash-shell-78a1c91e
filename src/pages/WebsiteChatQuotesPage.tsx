import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
// IMPORTANT: Use production-client for direct WePrintWraps Supabase access
import { supabase, WPW_FUNCTIONS_URL } from "@/integrations/supabase/production-client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, isToday, parseISO, startOfDay } from "date-fns";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Search,
  ArrowUpDown,
  Phone,
  MessageSquare,
  Mail,
  CheckCircle,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Users,
  Download,
  Copy,
  Send,
  Calendar as CalendarIcon,
} from "lucide-react";

// Types
interface Quote {
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
  sent_at: string | null;
  source: string | null;
  product_name: string | null;
  last_activity: string | null;
  follow_up_count: number | null;
}

interface ConvertedOrder {
  order_id: string;
  quote_id: string;
  quote_number: string;
  order_date: string;
  customer_name: string;
  customer_email: string;
  order_total: number;
  items: string;
  match_type: 'email' | 'name';
}

type TabValue = 'new' | 'email_sent' | 'callback' | 'completed' | 'converted';

export default function WebsiteChatQuotesPage() {
  console.log('[WebsiteQuoteManagement] Component mounting...');

  // Debug: Simple state to track if component renders at all
  const [hasError, setHasError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [convertedOrders, setConvertedOrders] = useState<ConvertedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Modal states
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [callbackModalOpen, setCallbackModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [emailTemplate, setEmailTemplate] = useState<'missed' | 'connected'>('missed');
  const [smsMessage, setSmsMessage] = useState('');
  const [callbackDate, setCallbackDate] = useState<Date | undefined>();
  const [sendingSms, setSendingSms] = useState(false);

  // Fetch quotes from database
  const fetchQuotes = async (showRefreshing = false) => {
    console.log('[WebsiteQuoteManagement] fetchQuotes called');
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      console.log('[WebsiteQuoteManagement] Querying quotes table...');
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('[WebsiteQuoteManagement] Supabase quotes error:', error);
        setHasError(`Quotes query failed: ${error.message}`);
        throw error;
      }

      console.log('[WebsiteQuoteManagement] Got', data?.length || 0, 'quotes');
      setQuotes((data as Quote[]) || []);

      // Fetch converted orders
      await fetchConvertedOrders((data as Quote[]) || []);
    } catch (err) {
      console.error('[WebsiteQuoteManagement] Error fetching quotes:', err);
      toast({
        title: "Error loading quotes",
        description: err instanceof Error ? err.message : "Failed to load quotes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch converted orders by matching email/name
  const fetchConvertedOrders = async (quotesData: Quote[]) => {
    console.log('[WebsiteQuoteManagement] fetchConvertedOrders called with', quotesData.length, 'quotes');
    try {
      const emails = quotesData
        .map(q => q.customer_email?.toLowerCase())
        .filter((e): e is string => Boolean(e));

      if (emails.length === 0) {
        console.log('[WebsiteQuoteManagement] No emails to match');
        return;
      }

      const { data: orders, error } = await supabase
        .from('shopflow_orders')
        .select('id, order_number, customer_email, customer_name, order_total, created_at, line_items')
        .in('customer_email', emails)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[WebsiteQuoteManagement] Supabase error:', error);
        throw error;
      }

      console.log('[WebsiteQuoteManagement] Found', orders?.length || 0, 'matching orders');

      // Match orders to quotes
      const converted: ConvertedOrder[] = [];
      for (const order of orders || []) {
        const matchedQuote = quotesData.find(q =>
          q.customer_email?.toLowerCase() === order.customer_email?.toLowerCase()
        );
        if (matchedQuote) {
          converted.push({
            order_id: order.order_number || order.id,
            quote_id: matchedQuote.id,
            quote_number: matchedQuote.quote_number,
            order_date: order.created_at,
            customer_name: order.customer_name || '',
            customer_email: order.customer_email || '',
            order_total: order.order_total || 0,
            items: formatLineItems(order.line_items),
            match_type: 'email'
          });
        }
      }
      setConvertedOrders(converted);
    } catch (err) {
      console.error('[WebsiteQuoteManagement] Error fetching converted orders:', err);
    }
  };

  const formatLineItems = (lineItems: any): string => {
    if (!lineItems) return '';
    try {
      const items = typeof lineItems === 'string' ? JSON.parse(lineItems) : lineItems;
      if (Array.isArray(items)) {
        return items.map((item: any) => `${item.quantity || 1}x ${item.name || item.product_name || 'Item'}`).join(', ');
      }
    } catch {}
    return '';
  };

  useEffect(() => {
    console.log('[WebsiteQuoteManagement] useEffect running, fetching quotes...');
    fetchQuotes();
  }, []);

  // Computed stats - using existing columns
  const stats = useMemo(() => {
    const newLeads = quotes.filter(q => !q.email_sent && q.status !== 'contacted' && !q.status?.startsWith('callback:'));
    const emailSent = quotes.filter(q => q.email_sent && q.status !== 'contacted');
    const callbacks = quotes.filter(q => q.status?.startsWith('callback:'));
    const callbacksToday = callbacks.filter(q => {
      if (!q.status?.startsWith('callback:')) return false;
      try {
        const cbDateStr = q.status.replace('callback:', '');
        const cbDate = parseISO(cbDateStr);
        return isToday(cbDate);
      } catch { return false; }
    });
    const todayStart = startOfDay(new Date());
    const overdueCallbacks = callbacks.filter(q => {
      if (!q.status?.startsWith('callback:')) return false;
      try {
        const cbDateStr = q.status.replace('callback:', '');
        const cbDate = parseISO(cbDateStr);
        return cbDate < todayStart && !isToday(cbDate);
      } catch { return false; }
    });
    const completed = quotes.filter(q => q.status === 'contacted');
    const totalContacted = quotes.filter(q => q.sent_at || q.status === 'contacted' || (q.follow_up_count && q.follow_up_count > 0));

    return {
      newLeads: newLeads.length,
      emailSent: emailSent.length,
      callbacksToday: callbacksToday.length,
      overdue: overdueCallbacks.length,
      totalContacted: totalContacted.length,
      callbacks: callbacks.length,
      completed: completed.length,
      convertedCount: convertedOrders.length,
      convertedRevenue: convertedOrders.reduce((sum, o) => sum + (o.order_total || 0), 0)
    };
  }, [quotes, convertedOrders]);

  // Filter quotes based on active tab
  const filteredQuotes = useMemo(() => {
    let filtered = quotes;

    // Tab filtering
    switch (activeTab) {
      case 'new':
        filtered = filtered.filter(q => !q.email_sent && q.status !== 'contacted' && !q.status?.startsWith('callback:'));
        break;
      case 'email_sent':
        filtered = filtered.filter(q => q.email_sent && q.status !== 'contacted');
        break;
      case 'callback':
        filtered = filtered.filter(q => q.status?.startsWith('callback:'));
        break;
      case 'completed':
        filtered = filtered.filter(q => q.status === 'contacted');
        break;
      case 'converted':
        return [];
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q =>
        q.customer_name?.toLowerCase().includes(query) ||
        q.customer_email?.toLowerCase().includes(query) ||
        q.vehicle_make?.toLowerCase().includes(query) ||
        q.vehicle_model?.toLowerCase().includes(query) ||
        q.quote_number?.toLowerCase().includes(query)
      );
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(q => q.source === sourceFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [quotes, activeTab, searchQuery, sourceFilter, sortOrder]);

  // Get callback status
  const getCallbackStatus = (quote: Quote) => {
    if (!quote.status?.startsWith('callback:')) return null;
    try {
      const cbDateStr = quote.status.replace('callback:', '');
      const cbDate = parseISO(cbDateStr);
      const today = startOfDay(new Date());

      if (isToday(cbDate)) {
        return { label: 'TODAY', color: 'bg-green-500 text-white' };
      }

      const daysOverdue = differenceInDays(today, cbDate);
      if (daysOverdue > 0) {
        return { label: `OVERDUE (${daysOverdue} days)`, color: 'bg-red-500 text-white' };
      }

      return { label: format(cbDate, 'MMM d'), color: 'bg-gray-600 text-white' };
    } catch {
      return null;
    }
  };

  // Get callback date from status
  const getCallbackDate = (quote: Quote): string | null => {
    if (!quote.status?.startsWith('callback:')) return null;
    try {
      const cbDateStr = quote.status.replace('callback:', '');
      return format(parseISO(cbDateStr), 'MMM d, yyyy');
    } catch {
      return null;
    }
  };

  // Format vehicle display
  const formatVehicle = (quote: Quote) => {
    const parts = [quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean);
    if (parts.length === 0) return 'Car / Truck';
    return parts.join(' ');
  };

  // Format request display
  const formatRequest = (quote: Quote) => {
    const vehicle = formatVehicle(quote);
    const product = quote.product_name || 'Avery';
    const sqft = quote.sqft ? `${quote.sqft} sqft` : '';
    return { vehicle, product, sqft };
  };

  // Action handlers
  const handleCall = (quote: Quote) => {
    if (quote.customer_phone) {
      window.open(`tel:${quote.customer_phone}`, '_blank');
      markActivity(quote);
    }
  };

  const markActivity = async (quote: Quote) => {
    try {
      await supabase
        .from('quotes')
        .update({
          last_activity: new Date().toISOString(),
          follow_up_count: (quote.follow_up_count || 0) + 1
        } as any)
        .eq('id', quote.id);
      fetchQuotes(true);
    } catch (err) {
      console.error('Error marking activity:', err);
    }
  };

  const openSmsModal = (quote: Quote) => {
    setSelectedQuote(quote);
    const request = formatRequest(quote);
    const name = quote.customer_name?.split(' ')[0] || 'there';
    const message = `Hi ${name}, this is Jackson from WePrintWraps. I tried calling about your wrap quote for your ${request.vehicle}${request.sqft ? ` (${request.sqft})` : ''}. Please call me back at (480) 772-6003 when you get a chance!`;
    setSmsMessage(message);
    setSmsModalOpen(true);
  };

  const openEmailModal = (quote: Quote) => {
    setSelectedQuote(quote);
    setEmailTemplate('missed');
    setEmailModalOpen(true);
  };

  const openCallbackModal = (quote: Quote) => {
    setSelectedQuote(quote);
    if (quote.status?.startsWith('callback:')) {
      try {
        const cbDateStr = quote.status.replace('callback:', '');
        setCallbackDate(parseISO(cbDateStr));
      } catch {
        setCallbackDate(undefined);
      }
    } else {
      setCallbackDate(undefined);
    }
    setCallbackModalOpen(true);
  };

  const sendSms = async () => {
    if (!selectedQuote?.customer_phone || !smsMessage) return;
    setSendingSms(true);

    try {
      const response = await fetch(`${WPW_FUNCTIONS_URL}/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedQuote.customer_phone,
          message: smsMessage,
          quote_id: selectedQuote.id
        })
      });

      if (!response.ok) throw new Error('Failed to send SMS');

      await supabase
        .from('quotes')
        .update({
          last_activity: new Date().toISOString(),
          follow_up_count: (selectedQuote.follow_up_count || 0) + 1
        } as any)
        .eq('id', selectedQuote.id);

      toast({ title: "SMS sent successfully" });
      setSmsModalOpen(false);
      fetchQuotes(true);
    } catch (err) {
      console.error('Error sending SMS:', err);
      toast({ title: "Failed to send SMS", variant: "destructive" });
    } finally {
      setSendingSms(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const setCallback = async () => {
    if (!selectedQuote || !callbackDate) return;

    try {
      await supabase
        .from('quotes')
        .update({
          status: `callback:${callbackDate.toISOString()}`,
          last_activity: new Date().toISOString()
        } as any)
        .eq('id', selectedQuote.id);

      toast({ title: "Callback scheduled" });
      setCallbackModalOpen(false);
      fetchQuotes(true);
    } catch (err) {
      console.error('Error setting callback:', err);
      toast({ title: "Failed to set callback", variant: "destructive" });
    }
  };

  const markAsContacted = async (quote: Quote) => {
    try {
      await supabase
        .from('quotes')
        .update({
          status: 'contacted',
          last_activity: new Date().toISOString()
        } as any)
        .eq('id', quote.id);

      toast({ title: "Marked as contacted" });
      fetchQuotes(true);
    } catch (err) {
      console.error('Error marking as contacted:', err);
    }
  };

  const getEmailBody = (quote: Quote) => {
    const name = quote.customer_name?.split(' ')[0] || 'there';
    const request = formatRequest(quote);
    const phone = quote.customer_phone || '(your phone)';

    if (emailTemplate === 'missed') {
      return `Hi ${name},

I hope you're doing well. I tried giving you a call at ${phone} but wasn't able to reach you, so I wanted to follow up regarding your vehicle wrap quote and make sure you had everything you needed.

Here's a quick recap of your project details so far:

Vehicle/Trailer: ${request.vehicle}${request.sqft ? ` (${request.sqft})` : ''}
${quote.total_price ? `Estimated Price: $${quote.total_price.toFixed(2)}` : ''}

If you have any questions or want to move forward, just reply to this email or give us a call at (480) 772-6003.

Thanks,
The WePrintWraps Team`;
    } else {
      return `Hi ${name},

Great talking with you! As discussed, here are your quote details:

Vehicle/Trailer: ${request.vehicle}${request.sqft ? ` (${request.sqft})` : ''}
${quote.total_price ? `Estimated Price: $${quote.total_price.toFixed(2)}` : ''}

Ready to proceed? Reply to this email or visit our website to place your order.

Thanks,
The WePrintWraps Team`;
    }
  };

  // Render quote row - DARK MODE
  const renderQuoteRow = (quote: Quote) => {
    const request = formatRequest(quote);
    const callbackStatus = getCallbackStatus(quote);
    const callbackDateStr = getCallbackDate(quote);
    const needsQuote = !quote.total_price || quote.total_price === 0;

    return (
      <tr key={quote.id} className="border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors">
        {/* Quote # */}
        <td className="px-4 py-3">
          <div className="font-mono text-sm text-cyan-400">
            {quote.quote_number?.split('-').slice(0, 2).join('-')}-
            <br />
            {quote.quote_number?.split('-')[2]}
          </div>
        </td>

        {/* Date / Contacted */}
        {activeTab !== 'callback' && (
          <td className="px-4 py-3 text-sm text-gray-400">
            {activeTab === 'email_sent' ? (
              quote.sent_at ? format(new Date(quote.sent_at), 'MMM d, h:mm a') : '-'
            ) : (
              format(new Date(quote.created_at), 'MMM d, h:mm a')
            )}
          </td>
        )}

        {/* Customer */}
        <td className="px-4 py-3">
          <div className="font-medium text-white">{quote.customer_name || 'Unknown'}</div>
          <div className="text-sm text-cyan-400">{quote.customer_email}</div>
          {quote.customer_phone && (
            <a href={`tel:${quote.customer_phone}`} className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {quote.customer_phone}
            </a>
          )}
          {/* Activity badges for completed tab */}
          {activeTab === 'completed' && quote.last_activity && (
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="outline" className="text-xs bg-teal-500/20 text-teal-400 border-teal-500/30">
                Activity: {format(new Date(quote.last_activity), 'MMM d, h:mm a')}
              </Badge>
              {quote.follow_up_count && quote.follow_up_count > 0 && (
                <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {quote.follow_up_count} follow-ups
                </Badge>
              )}
            </div>
          )}
        </td>

        {/* Request */}
        <td className="px-4 py-3">
          <div className="font-medium text-white">{request.vehicle}</div>
          <div className="text-sm text-gray-400">
            {request.product}{request.sqft ? ` · ${request.sqft}` : ''}
          </div>
        </td>

        {/* Price */}
        <td className="px-4 py-3 text-right">
          {needsQuote ? (
            <span className="text-orange-400 font-medium">Needs Quote</span>
          ) : (
            <span className="font-mono font-medium text-white">${quote.total_price?.toFixed(2)}</span>
          )}
        </td>

        {/* Callback Date & Status (only for callback tab) */}
        {activeTab === 'callback' && (
          <>
            <td className="px-4 py-3 text-sm text-gray-400">
              {callbackDateStr || '-'}
            </td>
            <td className="px-4 py-3">
              {callbackStatus && (
                <Badge className={`${callbackStatus.color} text-xs`}>
                  {callbackStatus.label}
                </Badge>
              )}
            </td>
          </>
        )}

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {activeTab !== 'email_sent' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={() => handleCall(quote)}
                  disabled={!quote.customer_phone}
                  title="Call"
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={() => openSmsModal(quote)}
                  disabled={!quote.customer_phone}
                  title="Send SMS"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={() => openEmailModal(quote)}
                  title="Email"
                >
                  <Mail className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={() => openCallbackModal(quote)}
                  title="Set Callback"
                >
                  <CalendarIcon className="w-4 h-4" />
                </Button>
              </>
            )}
            {activeTab === 'email_sent' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={() => openSmsModal(quote)}
                disabled={!quote.customer_phone}
                title="Send SMS"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 bg-cyan-500 hover:bg-cyan-600"
              onClick={() => markAsContacted(quote)}
              title="Mark Contacted"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  // Render converted row - DARK MODE
  const renderConvertedRow = (order: ConvertedOrder) => {
    return (
      <tr key={order.order_id} className="border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors">
        <td className="px-4 py-3 font-mono text-sm text-white">#{order.order_id}</td>
        <td className="px-4 py-3 font-mono text-sm text-cyan-400">{order.quote_number}</td>
        <td className="px-4 py-3 text-sm text-gray-400">
          {format(new Date(order.order_date), 'MMM d, yyyy')}
        </td>
        <td className="px-4 py-3">
          <div className="font-medium text-white">{order.customer_name}</div>
          <div className="text-sm text-gray-400">{order.customer_email}</div>
        </td>
        <td className="px-4 py-3">
          <Badge className={order.match_type === 'email' ? 'bg-blue-500' : 'bg-green-500'}>
            {order.match_type === 'email' ? 'Email' : 'Name'}
          </Badge>
        </td>
        <td className="px-4 py-3 text-right font-mono text-green-400 font-medium">
          ${order.order_total.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-sm text-gray-400 max-w-[200px] truncate" title={order.items}>
          {order.items}
        </td>
      </tr>
    );
  };

  // DEBUG: Early error display
  if (hasError) {
    return (
      <div className="p-6 bg-red-900 min-h-screen text-white">
        <h1 className="text-2xl font-bold">Website Quote Management - Error</h1>
        <pre className="mt-4 p-4 bg-red-800 rounded">{hasError}</pre>
      </div>
    );
  }

  console.log('[WebsiteQuoteManagement] Rendering main UI, loading:', loading, 'quotes:', quotes.length);

  return (
    <AppLayout>
      {/* DEBUG BANNER - Remove after testing */}
      <div className="bg-red-600 text-white p-4 text-xl font-bold sticky top-0 z-50">
        🔴 DEBUG: Page rendering! Quotes loaded: {quotes.length} | Loading: {loading ? 'YES' : 'NO'} | Has Error: {hasError || 'none'}
      </div>
      <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-white">Website Quote Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={() => navigate('/mighty-customer')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Quote
            </Button>
            <Button
              onClick={() => fetchQuotes(true)}
              disabled={refreshing}
              className="bg-cyan-500 text-white hover:bg-cyan-600"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards - DARK MODE */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4 bg-gray-800 border-gray-700 border-l-4 border-l-blue-500">
            <div className="text-3xl font-bold text-blue-400">{stats.newLeads}</div>
            <div className="text-sm text-gray-400">New Leads</div>
          </Card>
          <Card className="p-4 bg-gray-800 border-gray-700">
            <div className="text-3xl font-bold text-white">{stats.emailSent}</div>
            <div className="text-sm text-gray-400">Email Sent</div>
          </Card>
          <Card className="p-4 bg-green-900/30 border border-green-700/50">
            <div className="text-3xl font-bold text-green-400">{stats.callbacksToday}</div>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Callbacks Today
            </div>
          </Card>
          <Card className="p-4 bg-red-900/30 border border-red-700/50">
            <div className="text-3xl font-bold text-red-400">{stats.overdue}</div>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Overdue
            </div>
          </Card>
          <Card className="p-4 bg-gray-800 border-gray-700 border-l-4 border-l-teal-500">
            <div className="text-3xl font-bold text-teal-400">{stats.totalContacted}</div>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Total Contacted
            </div>
          </Card>
        </div>

        {/* Filters - DARK MODE */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by name, email, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="commandchat">CommandChat</SelectItem>
              <SelectItem value="chat_widget">Chat Widget</SelectItem>
              <SelectItem value="website_chat">Website Chat</SelectItem>
              <SelectItem value="ai_website_agent">AI Website Agent</SelectItem>
              <SelectItem value="lance">Lance</SelectItem>
              <SelectItem value="trish">Trish</SelectItem>
              <SelectItem value="jackson">Jackson</SelectItem>
              <SelectItem value="troy">Troy</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="newest">Date (Newest)</SelectItem>
              <SelectItem value="oldest">Date (Oldest)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs - DARK MODE */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="new" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400">
              New Leads ({stats.newLeads})
            </TabsTrigger>
            <TabsTrigger value="email_sent" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400">
              Email Sent ({stats.emailSent})
            </TabsTrigger>
            <TabsTrigger value="callback" className="relative data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400">
              Call Back Later ({stats.callbacks})
              {stats.overdue > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.overdue}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400">
              Completed ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="converted" className="text-green-400 data-[state=active]:bg-green-900/50 data-[state=active]:text-green-400">
              <ShoppingCart className="w-4 h-4 mr-1" />
              Converted ({stats.convertedCount})
            </TabsTrigger>
          </TabsList>

          {/* Tab Content Headers - DARK MODE */}
          {activeTab === 'callback' && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-300">
                Total Callbacks: <strong className="text-white">{stats.callbacks}</strong>
                <span className="mx-2 text-gray-600">|</span>
                <span className="text-red-400 font-medium">{stats.overdue} Overdue</span>
                <span className="mx-2 text-gray-600">|</span>
                <span className="text-green-400 font-medium">{stats.callbacksToday} Today</span>
              </div>
              <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}

          {activeTab === 'converted' && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-300">
                Total Revenue: <strong className="text-green-400">${stats.convertedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                <span className="mx-2 text-gray-600">|</span>
                Orders: <strong className="text-white">{stats.convertedCount}</strong>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Orders
                </Button>
              </div>
            </div>
          )}

          {/* Tables - DARK MODE */}
          <TabsContent value={activeTab} className="mt-4">
            <Card className="overflow-hidden bg-gray-800 border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900 border-b border-gray-700">
                    <tr>
                      {activeTab === 'converted' ? (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Quote #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Match Type</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Order Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Items</th>
                        </>
                      ) : activeTab === 'callback' ? (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Quote #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Request</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Callback Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Quote #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                            {activeTab === 'email_sent' ? 'Contacted' : 'Date'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Request</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Est. Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Loading quotes...
                        </td>
                      </tr>
                    ) : activeTab === 'converted' ? (
                      convertedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            No converted orders found
                          </td>
                        </tr>
                      ) : (
                        convertedOrders.map(renderConvertedRow)
                      )
                    ) : filteredQuotes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No quotes found
                        </td>
                      </tr>
                    ) : (
                      filteredQuotes.map(renderQuoteRow)
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* SMS Modal - DARK MODE */}
        <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
          <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                Send SMS Follow-up
              </DialogTitle>
              <p className="text-sm text-gray-400">Send a text message to follow up on this quote</p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">To:</label>
                <a
                  href={`tel:${selectedQuote?.customer_phone}`}
                  className="text-lg font-medium text-cyan-400 block hover:text-cyan-300"
                >
                  {selectedQuote?.customer_phone}
                </a>
              </div>
              <div className="text-sm text-gray-300">
                {selectedQuote?.customer_name} · {formatRequest(selectedQuote || {} as Quote).vehicle}
              </div>
              <Textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                rows={5}
                className="resize-none bg-gray-900 border-gray-700 text-white"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {smsMessage.length} characters ({Math.ceil(smsMessage.length / 160)} SMS segments)
                </span>
                {smsMessage.length > 160 && (
                  <span className="text-orange-400">Message will be split into multiple texts</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => copyToClipboard(smsMessage)} className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Message
                </Button>
                <Button
                  onClick={sendSms}
                  disabled={sendingSms}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendingSms ? 'Sending...' : 'Send SMS'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Email Modal - DARK MODE */}
        <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
          <DialogContent className="sm:max-w-lg bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Mail className="w-5 h-5 text-cyan-400" />
                Email Draft for {selectedQuote?.customer_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Template:</label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={emailTemplate === 'missed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmailTemplate('missed')}
                    className={emailTemplate === 'missed' ? 'bg-red-500 hover:bg-red-600 text-white' : 'border-gray-700 text-gray-300 hover:bg-gray-700'}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Missed Call
                  </Button>
                  <Button
                    variant={emailTemplate === 'connected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmailTemplate('connected')}
                    className={emailTemplate === 'connected' ? 'bg-green-500 hover:bg-green-600 text-white' : 'border-gray-700 text-gray-300 hover:bg-gray-700'}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Connected Call
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">To:</label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedQuote?.customer_email || '')} className="text-gray-400 hover:text-white">
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-gray-900 p-3 rounded text-sm text-white border border-gray-700">{selectedQuote?.customer_email}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">Subject:</label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`Following up on your WePrintWraps Quote #${selectedQuote?.quote_number}`)} className="text-gray-400 hover:text-white">
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-blue-900/30 p-3 rounded text-sm text-blue-300 border border-blue-700/50">
                  Following up on your WePrintWraps Quote #{selectedQuote?.quote_number}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">Body:</label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(getEmailBody(selectedQuote || {} as Quote))} className="text-gray-400 hover:text-white">
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-gray-900 p-3 rounded text-sm whitespace-pre-wrap max-h-64 overflow-y-auto text-gray-300 border border-gray-700">
                  {getEmailBody(selectedQuote || {} as Quote)}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Callback Modal - DARK MODE */}
        <Dialog open={callbackModalOpen} onOpenChange={setCallbackModalOpen}>
          <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <CalendarIcon className="w-5 h-5 text-cyan-400" />
                Set Callback Date
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-300">
                {selectedQuote?.customer_name} - {selectedQuote?.quote_number}
              </div>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={callbackDate}
                  onSelect={setCallbackDate}
                  className="rounded-md border border-gray-700 bg-gray-900"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCallbackModalOpen(false)} className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white">
                  Cancel
                </Button>
                <Button onClick={setCallback} disabled={!callbackDate} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white">
                  Save Callback
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
