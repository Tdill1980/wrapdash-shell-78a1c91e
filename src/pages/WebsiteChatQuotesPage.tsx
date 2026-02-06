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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
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
  Bell,
  Eye,
  CheckCircle,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Users,
  Download,
  Copy,
  Send,
  Calendar as CalendarIcon,
  ExternalLink,
} from "lucide-react";

// Types
interface Quote {
  id: string;
  quote_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  sqft: number | null;
  total_price: number | null;
  status: string | null;
  created_at: string;
  email_sent: boolean | null;
  email_sent_at: string | null;
  sms_sent_at: string | null;
  called_at: string | null;
  callback_date: string | null;
  contacted_at: string | null;
  source: string | null;
  city: string | null;
  state: string | null;
  timezone: string | null;
  product_name: string | null;
  notes: string | null;
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
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setQuotes(data || []);

      // Fetch converted orders
      await fetchConvertedOrders(data || []);
    } catch (err) {
      console.error('[LeadManagement] Error fetching quotes:', err);
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
    try {
      const emails = quotesData
        .map(q => q.customer_email?.toLowerCase())
        .filter(Boolean);

      if (emails.length === 0) return;

      const { data: orders, error } = await supabase
        .from('shopflow_orders')
        .select('id, order_number, customer_email, customer_first_name, customer_last_name, order_total, created_at, line_items')
        .in('customer_email', emails)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
            customer_name: `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim(),
            customer_email: order.customer_email || '',
            order_total: order.order_total || 0,
            items: formatLineItems(order.line_items),
            match_type: 'email'
          });
        }
      }
      setConvertedOrders(converted);
    } catch (err) {
      console.error('[LeadManagement] Error fetching converted orders:', err);
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
    fetchQuotes();
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);

    const newLeads = quotes.filter(q => !q.email_sent && !q.contacted_at && !q.callback_date);
    const emailSent = quotes.filter(q => q.email_sent && !q.contacted_at);
    const callbacks = quotes.filter(q => q.callback_date);
    const callbacksToday = callbacks.filter(q => {
      if (!q.callback_date) return false;
      const cbDate = parseISO(q.callback_date);
      return isToday(cbDate);
    });
    const overdueCallbacks = callbacks.filter(q => {
      if (!q.callback_date) return false;
      const cbDate = parseISO(q.callback_date);
      return cbDate < todayStart && !isToday(cbDate);
    });
    const completed = quotes.filter(q => q.contacted_at);
    const totalContacted = quotes.filter(q => q.called_at || q.sms_sent_at || q.email_sent_at);

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
    const todayStart = startOfDay(new Date());

    // Tab filtering
    switch (activeTab) {
      case 'new':
        filtered = filtered.filter(q => !q.email_sent && !q.contacted_at && !q.callback_date);
        break;
      case 'email_sent':
        filtered = filtered.filter(q => q.email_sent && !q.contacted_at);
        break;
      case 'callback':
        filtered = filtered.filter(q => q.callback_date);
        break;
      case 'completed':
        filtered = filtered.filter(q => q.contacted_at);
        break;
      case 'converted':
        // Will use convertedOrders instead
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
    if (!quote.callback_date) return null;
    const cbDate = parseISO(quote.callback_date);
    const today = startOfDay(new Date());

    if (isToday(cbDate)) {
      return { label: 'TODAY', variant: 'default' as const, color: 'bg-green-500' };
    }

    const daysOverdue = differenceInDays(today, cbDate);
    if (daysOverdue > 0) {
      return {
        label: `OVERDUE (${daysOverdue} days)`,
        variant: 'destructive' as const,
        color: 'bg-red-500'
      };
    }

    return { label: format(cbDate, 'MMM d'), variant: 'secondary' as const, color: 'bg-gray-500' };
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

  // Get local time display
  const getLocalTime = (quote: Quote) => {
    if (!quote.city && !quote.state) return null;
    const location = [quote.city, quote.state].filter(Boolean).join(', ');
    const tz = quote.timezone || 'EST';
    const now = new Date();
    const timeStr = format(now, 'h:mm a');
    return `${location} · ${timeStr} ${tz}`;
  };

  // Action handlers
  const handleCall = (quote: Quote) => {
    if (quote.customer_phone) {
      window.open(`tel:${quote.customer_phone}`, '_blank');
      markAsCalled(quote);
    }
  };

  const markAsCalled = async (quote: Quote) => {
    try {
      await supabase
        .from('quotes')
        .update({ called_at: new Date().toISOString() })
        .eq('id', quote.id);

      fetchQuotes(true);
    } catch (err) {
      console.error('Error marking as called:', err);
    }
  };

  const openSmsModal = (quote: Quote) => {
    setSelectedQuote(quote);
    const request = formatRequest(quote);
    const message = `Hi ${quote.customer_name?.split(' ')[0] || 'there'}, this is Jackson from WePrintWraps. I tried calling about your wrap quote for your ${request.vehicle}${request.sqft ? ` (${request.sqft})` : ''}. Please call me back at (480) 772-6003 when you get a chance!`;
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
    setCallbackDate(quote.callback_date ? parseISO(quote.callback_date) : undefined);
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

      // Update quote record
      await supabase
        .from('quotes')
        .update({
          sms_sent_at: new Date().toISOString(),
          notes: `${selectedQuote.notes || ''}\n[SMS ${format(new Date(), 'MMM d, h:mm a')}]: ${smsMessage}`.trim()
        })
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
        .update({ callback_date: callbackDate.toISOString() })
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
        .update({ contacted_at: new Date().toISOString() })
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

  // Render quote row
  const renderQuoteRow = (quote: Quote) => {
    const request = formatRequest(quote);
    const localTime = getLocalTime(quote);
    const callbackStatus = getCallbackStatus(quote);
    const needsQuote = !quote.total_price || quote.total_price === 0;

    return (
      <tr key={quote.id} className="border-b border-gray-100 hover:bg-gray-50/50">
        {/* Quote # */}
        <td className="px-4 py-3">
          <div className="font-mono text-sm text-cyan-600">
            {quote.quote_number?.split('-').slice(0, 2).join('-')}-
            <br />
            {quote.quote_number?.split('-')[2]}
          </div>
        </td>

        {/* Date / Contacted */}
        <td className="px-4 py-3 text-sm text-gray-600">
          {activeTab === 'email_sent' ? (
            quote.email_sent_at ? format(new Date(quote.email_sent_at), 'MMM d, h:mm a') : '-'
          ) : activeTab === 'callback' ? null : (
            format(new Date(quote.created_at), 'MMM d, h:mm a')
          )}
        </td>

        {/* Customer */}
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">{quote.customer_name || 'Unknown'}</div>
          <div className="text-sm text-cyan-600">{quote.customer_email}</div>
          {quote.customer_phone && (
            <div className="text-sm text-cyan-600 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {quote.customer_phone}
            </div>
          )}
          {localTime && (
            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {localTime}
            </div>
          )}
          {/* Activity badges for completed tab */}
          {activeTab === 'completed' && (
            <div className="flex flex-wrap gap-1 mt-2">
              {quote.sms_sent_at && (
                <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                  SMS: {format(new Date(quote.sms_sent_at), 'MMM d')}
                </Badge>
              )}
              {quote.called_at && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Called: {format(new Date(quote.called_at), 'MMM d, h:mm a')}
                </Badge>
              )}
            </div>
          )}
        </td>

        {/* Request */}
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">{request.vehicle}</div>
          <div className="text-sm text-gray-500">
            {request.product}{request.sqft ? ` · ${request.sqft}` : ''}
          </div>
        </td>

        {/* Price / Callback Date */}
        {activeTab === 'callback' && (
          <td className="px-4 py-3 text-right">
            {needsQuote ? (
              <span className="text-orange-500 font-medium">Needs Quote</span>
            ) : (
              <span className="font-mono font-medium">${quote.total_price?.toFixed(2)}</span>
            )}
          </td>
        )}
        {activeTab === 'callback' && (
          <td className="px-4 py-3 text-sm text-gray-600">
            {quote.callback_date ? format(new Date(quote.callback_date), 'MMM d, yyyy') : '-'}
          </td>
        )}
        {activeTab === 'callback' && (
          <td className="px-4 py-3">
            {callbackStatus && (
              <Badge className={`${callbackStatus.color} text-white text-xs`}>
                {callbackStatus.label}
              </Badge>
            )}
          </td>
        )}

        {/* Est. Price (for non-callback tabs) */}
        {activeTab !== 'callback' && (
          <td className="px-4 py-3 text-right">
            {needsQuote ? (
              <span className="text-orange-500 font-medium">Needs<br/>Quote</span>
            ) : (
              <span className="font-mono font-medium">${quote.total_price?.toFixed(2)}</span>
            )}
          </td>
        )}

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {activeTab !== 'email_sent' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCall(quote)}
                  disabled={!quote.customer_phone}
                  title="Call"
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openSmsModal(quote)}
                  disabled={!quote.customer_phone}
                  title="Send SMS"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEmailModal(quote)}
                  title="Email"
                >
                  <Mail className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openCallbackModal(quote)}
                  title="Set Callback"
                >
                  <CalendarIcon className="w-4 h-4" />
                </Button>
              </>
            )}
            {activeTab === 'email_sent' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openSmsModal(quote)}
                  disabled={!quote.customer_phone}
                  title="Send SMS"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </>
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

  // Render converted row
  const renderConvertedRow = (order: ConvertedOrder) => {
    return (
      <tr key={order.order_id} className="border-b border-gray-100 hover:bg-gray-50/50">
        <td className="px-4 py-3 font-mono text-sm">#{order.order_id}</td>
        <td className="px-4 py-3 font-mono text-sm text-cyan-600">{order.quote_number}</td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {format(new Date(order.order_date), 'MMM d, yyyy')}
        </td>
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">{order.customer_name}</div>
          <div className="text-sm text-gray-500">{order.customer_email}</div>
        </td>
        <td className="px-4 py-3">
          <Badge variant={order.match_type === 'email' ? 'default' : 'secondary'} className={order.match_type === 'email' ? 'bg-blue-500' : 'bg-green-500'}>
            {order.match_type === 'email' ? 'Email' : 'Name'}
          </Badge>
        </td>
        <td className="px-4 py-3 text-right font-mono text-green-600 font-medium">
          ${order.order_total.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate" title={order.items}>
          {order.items}
        </td>
      </tr>
    );
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              className="bg-cyan-500 hover:bg-cyan-600"
              onClick={() => navigate('/mighty-customer')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Quote
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchQuotes(true)}
              disabled={refreshing}
              className="bg-cyan-500 text-white hover:bg-cyan-600 border-0"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="text-3xl font-bold text-blue-500">{stats.newLeads}</div>
            <div className="text-sm text-gray-500">New Leads</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-bold text-gray-700">{stats.emailSent}</div>
            <div className="text-sm text-gray-500">Email Sent</div>
          </Card>
          <Card className="p-4 bg-green-50 border border-green-200">
            <div className="text-3xl font-bold text-green-600">{stats.callbacksToday}</div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Callbacks Today
            </div>
          </Card>
          <Card className="p-4 bg-red-50 border border-red-200">
            <div className="text-3xl font-bold text-red-500">{stats.overdue}</div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Overdue
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-teal-500">
            <div className="text-3xl font-bold text-teal-500">{stats.totalContacted}</div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Total Contacted
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="ai_website_agent">AI Website Agent</SelectItem>
              <SelectItem value="lance">Lance</SelectItem>
              <SelectItem value="trish">Trish</SelectItem>
              <SelectItem value="jackson">Jackson</SelectItem>
              <SelectItem value="troy">Troy</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Date (Newest)</SelectItem>
              <SelectItem value="oldest">Date (Oldest)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="bg-white border">
            <TabsTrigger value="new" className="data-[state=active]:bg-gray-100">
              New Leads ({stats.newLeads})
            </TabsTrigger>
            <TabsTrigger value="email_sent" className="data-[state=active]:bg-gray-100">
              Email Sent ({stats.emailSent})
            </TabsTrigger>
            <TabsTrigger value="callback" className="relative data-[state=active]:bg-gray-100">
              Call Back Later ({stats.callbacks})
              {stats.overdue > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.overdue}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-gray-100">
              Completed ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="converted" className="text-green-600 data-[state=active]:bg-green-50">
              <ShoppingCart className="w-4 h-4 mr-1" />
              Converted ({stats.convertedCount})
            </TabsTrigger>
          </TabsList>

          {/* Tab Content Headers */}
          {activeTab === 'callback' && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm">
                Total Callbacks: <strong>{stats.callbacks}</strong>
                <span className="mx-2">|</span>
                <span className="text-red-500 font-medium">{stats.overdue} Overdue</span>
                <span className="mx-2">|</span>
                <span className="text-green-500 font-medium">{stats.callbacksToday} Today</span>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}

          {activeTab === 'converted' && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm">
                Total Revenue: <strong className="text-green-600">${stats.convertedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                <span className="mx-2">|</span>
                Orders: <strong>{stats.convertedCount}</strong>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Orders
                </Button>
              </div>
            </div>
          )}

          {/* Tables */}
          <TabsContent value={activeTab} className="mt-4">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {activeTab === 'converted' ? (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Type</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Order Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                        </>
                      ) : activeTab === 'callback' ? (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Callback Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {activeTab === 'email_sent' ? 'Contacted' : 'Date'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Est. Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
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

        {/* SMS Modal */}
        <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Send SMS Follow-up
              </DialogTitle>
              <p className="text-sm text-gray-500">Send a text message to follow up on this quote</p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">To:</label>
                <a
                  href={`tel:${selectedQuote?.customer_phone}`}
                  className="text-lg font-medium text-cyan-600 block"
                >
                  {selectedQuote?.customer_phone}
                </a>
              </div>
              <div className="text-sm text-gray-600">
                {selectedQuote?.customer_name} · {formatRequest(selectedQuote || {} as Quote).vehicle}
              </div>
              <Textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {smsMessage.length} characters ({Math.ceil(smsMessage.length / 160)} SMS segments)
                </span>
                {smsMessage.length > 160 && (
                  <span className="text-orange-500">Message will be split into multiple texts</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => copyToClipboard(smsMessage)} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Message
                </Button>
                <Button
                  onClick={sendSms}
                  disabled={sendingSms}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendingSms ? 'Sending...' : 'Send SMS'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Email Modal */}
        <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Draft for {selectedQuote?.customer_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Template:</label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={emailTemplate === 'missed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmailTemplate('missed')}
                    className={emailTemplate === 'missed' ? 'bg-red-500 hover:bg-red-600' : ''}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Missed Call
                  </Button>
                  <Button
                    variant={emailTemplate === 'connected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmailTemplate('connected')}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Connected Call
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-500">To:</label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedQuote?.customer_email || '')}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-gray-100 p-3 rounded text-sm">{selectedQuote?.customer_email}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-500">Subject:</label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`Following up on your WePrintWraps Quote #${selectedQuote?.quote_number}`)}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                  Following up on your WePrintWraps Quote #{selectedQuote?.quote_number}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-500">Body:</label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(getEmailBody(selectedQuote || {} as Quote))}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {getEmailBody(selectedQuote || {} as Quote)}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Callback Modal */}
        <Dialog open={callbackModalOpen} onOpenChange={setCallbackModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Set Callback Date
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                {selectedQuote?.customer_name} - {selectedQuote?.quote_number}
              </div>
              <Calendar
                mode="single"
                selected={callbackDate}
                onSelect={setCallbackDate}
                className="rounded-md border mx-auto"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCallbackModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={setCallback} disabled={!callbackDate} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
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
