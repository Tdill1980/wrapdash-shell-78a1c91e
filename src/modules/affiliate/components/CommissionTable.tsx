import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AffiliateCommission } from '../services/affiliateApi';
import { format } from 'date-fns';

interface CommissionTableProps {
  commissions: AffiliateCommission[];
}

export const CommissionTable = ({ commissions }: CommissionTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-[#ffffff0f] text-[#B8B8C7] border-[#ffffff0f]';
    }
  };

  return (
    <Card className="p-6 bg-[#16161E] border-[#ffffff0f]">
      <h3 className="text-lg font-semibold text-white mb-4">Commission History</h3>
      
      {commissions.length === 0 ? (
        <p className="text-[#B8B8C7] text-center py-8">No commissions yet</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#ffffff0f]">
                <TableHead className="text-[#B8B8C7]">Date</TableHead>
                <TableHead className="text-[#B8B8C7]">Order</TableHead>
                <TableHead className="text-[#B8B8C7]">Customer</TableHead>
                <TableHead className="text-[#B8B8C7]">Order Total</TableHead>
                <TableHead className="text-[#B8B8C7]">Commission</TableHead>
                <TableHead className="text-[#B8B8C7]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission) => {
                const getStatusBadge = (status: string) => {
                  const variants: Record<string, { label: string; className: string }> = {
                    pending: { label: '🟡 Pending', className: 'bg-yellow-500/10 text-yellow-500' },
                    approved: { label: '🟢 Approved', className: 'bg-green-500/10 text-green-500' },
                    paid: { label: '🔵 Paid', className: 'bg-blue-500/10 text-blue-500' },
                    cancelled: { label: '🔴 Cancelled', className: 'bg-red-500/10 text-red-500' },
                  };
                  const config = variants[status] || variants.pending;
                  return <Badge className={config.className}>{config.label}</Badge>;
                };

                return (
                  <TableRow key={commission.id} className="border-[#ffffff0f]">
                    <TableCell className="text-white">
                      {format(new Date(commission.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-white font-mono">
                      #{commission.orderNumber}
                    </TableCell>
                    <TableCell className="text-white">
                      {commission.customerEmail}
                    </TableCell>
                    <TableCell className="text-white">
                      ${commission.orderTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-[#00AFFF] font-semibold">
                      ${commission.commissionAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(commission.status)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};