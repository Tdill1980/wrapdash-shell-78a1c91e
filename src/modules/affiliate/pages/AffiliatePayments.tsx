import { useState } from 'react';
import { useAffiliatePayments } from '../hooks/useAffiliatePayments';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Users, TrendingUp, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function AffiliatePayments() {
  const { commissions, stats, isLoading, approveCommissions, markAsPaid, cancelCommissions, updateNotes } = useAffiliatePayments();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Filter commissions
  const filteredCommissions = commissions.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      c.founder.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer_email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCommissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCommissions.map((c) => c.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    approveCommissions(selectedIds);
    setSelectedIds([]);
  };

  const handleBatchMarkPaid = () => {
    if (selectedIds.length === 0) return;
    markAsPaid(selectedIds);
    setSelectedIds([]);
  };

  const handleBatchCancel = () => {
    if (selectedIds.length === 0) return;
    cancelCommissions({ ids: selectedIds, reason: cancelReason });
    setSelectedIds([]);
    setShowCancelDialog(false);
    setCancelReason('');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      approved: { label: 'Approved', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
      paid: { label: 'Paid', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
    };
    const config = variants[status] || variants.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00AFFF] via-[#008CFF] to-[#4EEAFF] bg-clip-text text-transparent">
          Affiliate Payments
        </h1>
        <p className="text-muted-foreground mt-1">Manage and process monthly affiliate commissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <DollarSign className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">${stats.totalPending.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">${stats.totalApproved.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid This Month</p>
              <p className="text-2xl font-bold">${stats.totalPaidThisMonth.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Affiliates</p>
              <p className="text-2xl font-bold">{stats.activeAffiliates}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="p-6 bg-card border-border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <Input
              placeholder="Search by name, email, or order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchApprove}
                className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve ({selectedIds.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchMarkPaid}
                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/20"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Mark Paid ({selectedIds.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel ({selectedIds.length})
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Commission Table */}
      <Card className="bg-card border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.length === filteredCommissions.length && filteredCommissions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Founder</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Order Total</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCommissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No commissions found
                </TableCell>
              </TableRow>
            ) : (
              filteredCommissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(commission.id)}
                      onCheckedChange={() => handleSelectOne(commission.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{commission.founder.full_name}</p>
                      <p className="text-sm text-muted-foreground">{commission.founder.affiliate_code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/shopflow/${commission.order_number}`}
                      className="text-primary hover:underline"
                    >
                      #{commission.order_number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{commission.customer_email}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(commission.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">${commission.order_total.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    ${commission.commission_amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(commission.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {commission.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => approveCommissions([commission.id])}
                        >
                          Approve
                        </Button>
                      )}
                      {commission.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsPaid([commission.id])}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Commissions</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling {selectedIds.length} commission(s).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g., Order refunded, customer dispute..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatchCancel}
              disabled={!cancelReason.trim()}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
