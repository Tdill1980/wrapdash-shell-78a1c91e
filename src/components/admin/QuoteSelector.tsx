import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Receipt, Car, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Quote {
  id: string;
  quote_number: string;
  total_price: number;
  status: string;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  created_at: string;
}

interface QuoteSelectorProps {
  customerEmail: string | null;
  onSelect: (quote: { id: string; quote_number: string; total_price: number }) => void;
  onClose: () => void;
}

export function QuoteSelector({ customerEmail, onSelect, onClose }: QuoteSelectorProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, [customerEmail]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('quotes')
        .select('id, quote_number, total_price, status, vehicle_year, vehicle_make, vehicle_model, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      // If we have customer email, filter by it
      if (customerEmail) {
        query = query.eq('customer_email', customerEmail);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQuotes(data || []);
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'sent': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="absolute inset-0 z-50 bg-background border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Select Quote to Attach
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {customerEmail && (
          <p className="text-xs text-muted-foreground">
            Showing quotes for {customerEmail}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No quotes found</p>
            {customerEmail && (
              <p className="text-xs mt-1">Try searching without customer filter</p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[250px]">
            <div className="space-y-2">
              {quotes.map((quote) => (
                <button
                  key={quote.id}
                  onClick={() => onSelect({
                    id: quote.id,
                    quote_number: quote.quote_number,
                    total_price: quote.total_price
                  })}
                  className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">#{quote.quote_number}</span>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(quote.status)}`}>
                          {quote.status}
                        </Badge>
                      </div>
                      {(quote.vehicle_year || quote.vehicle_make || quote.vehicle_model) && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Car className="h-3 w-3" />
                          <span>
                            {[quote.vehicle_year, quote.vehicle_make, quote.vehicle_model]
                              .filter(Boolean)
                              .join(' ')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(quote.created_at)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary">
                        ${quote.total_price?.toLocaleString() ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
