import { useAffiliateInvoices } from '../hooks/useAffiliateInvoices';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Send, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function AffiliateInvoices() {
  const { invoices, isLoading, sendInvoice, isSending } = useAffiliateInvoices();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
      generated: { label: 'Generated', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      sent: { label: 'Sent', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    };
    const config = variants[status] || variants.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">
            <span className="text-white">Affiliate </span>
            <span className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">Invoices</span>
          </h1>
          <p className="text-muted-foreground mt-1">View and manage all generated commission invoices</p>
        </div>
      </div>

      {/* Invoices Table */}
      <Card className="bg-card border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Affiliate</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Date Issued</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Commissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!invoices || invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No invoices generated yet
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.affiliate_founders?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{invoice.affiliate_founders?.affiliate_code}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(invoice.period_start), 'MMM d')} - {format(new Date(invoice.period_end), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    ${invoice.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invoice.commission_ids.length} commission{invoice.commission_ids.length !== 1 ? 's' : ''}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {invoice.status === 'generated' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendInvoice(invoice.id)}
                          disabled={isSending}
                        >
                          {isSending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Send
                        </Button>
                      )}
                      {invoice.status === 'sent' && invoice.sent_at && (
                        <div className="text-xs text-muted-foreground">
                          Sent {format(new Date(invoice.sent_at), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}