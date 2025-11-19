import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AffiliateCommission } from '../services/affiliateApi';
import { subDays, isWithinInterval } from 'date-fns';

interface SalesBreakdownProps {
  commissions: AffiliateCommission[];
  timePeriod: 'daily' | 'weekly' | 'monthly';
}

export const SalesBreakdown = ({ commissions, timePeriod }: SalesBreakdownProps) => {
  const getDateRange = () => {
    const now = new Date();
    switch (timePeriod) {
      case 'daily':
        return { start: subDays(now, 1), end: now, label: 'Today' };
      case 'weekly':
        return { start: subDays(now, 7), end: now, label: 'This Week' };
      case 'monthly':
        return { start: subDays(now, 30), end: now, label: 'This Month' };
    }
  };

  const { start, end, label } = getDateRange();

  const filteredCommissions = commissions.filter(c => {
    if (!c.createdAt) return false;
    return isWithinInterval(new Date(c.createdAt), { start, end });
  });

  const stats = {
    totalSales: filteredCommissions.reduce((sum, c) => sum + c.orderTotal, 0),
    totalCommission: filteredCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
    orderCount: filteredCommissions.length,
    avgOrderValue: filteredCommissions.length > 0 
      ? filteredCommissions.reduce((sum, c) => sum + c.orderTotal, 0) / filteredCommissions.length 
      : 0,
  };

  const statusData = [
    {
      name: 'Pending',
      value: filteredCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0),
      color: '#FFB800',
    },
    {
      name: 'Approved',
      value: filteredCommissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.commissionAmount, 0),
      color: '#00D26A',
    },
    {
      name: 'Paid',
      value: filteredCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0),
      color: '#00AFFF',
    },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-[#16161E] border border-[#ffffff0f] p-3 rounded-lg shadow-lg">
        <p className="text-white font-semibold mb-1">{payload[0].payload.name}</p>
        <p className="text-[#00AFFF]">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quick Stats */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-white mb-4">{label} Summary</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Sales</span>
            <span className="text-2xl font-bold text-white">${stats.totalSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Your Commission</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#00AFFF] to-[#4EEAFF] bg-clip-text text-transparent">
              ${stats.totalCommission.toFixed(2)}
            </span>
          </div>
          <div className="pt-4 border-t border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Orders</span>
              <span className="text-white font-semibold">{stats.orderCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Order Value</span>
              <span className="text-white font-semibold">${stats.avgOrderValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Commission Rate</span>
              <span className="text-white font-semibold">2.5%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Status Breakdown Chart */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-white mb-4">Commission Status</h3>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
              <XAxis 
                dataKey="name" 
                stroke="#B8B8C7"
                tick={{ fill: '#B8B8C7', fontSize: 12 }}
              />
              <YAxis 
                stroke="#B8B8C7"
                tick={{ fill: '#B8B8C7', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No commission data for this period
          </div>
        )}
      </Card>
    </div>
  );
};
