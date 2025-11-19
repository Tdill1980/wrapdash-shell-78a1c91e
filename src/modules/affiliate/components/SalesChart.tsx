import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AffiliateCommission } from '../services/affiliateApi';
import { format, subDays, startOfDay, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

interface SalesChartProps {
  commissions: AffiliateCommission[];
  timePeriod: 'daily' | 'weekly' | 'monthly';
}

export const SalesChart = ({ commissions, timePeriod }: SalesChartProps) => {
  const generateChartData = () => {
    const now = new Date();
    let intervals: Date[] = [];
    let formatString = 'MMM dd';
    
    switch (timePeriod) {
      case 'daily':
        intervals = eachDayOfInterval({
          start: subDays(now, 29),
          end: now
        });
        formatString = 'MMM dd';
        break;
      case 'weekly':
        intervals = eachWeekOfInterval({
          start: subDays(now, 90),
          end: now
        }, { weekStartsOn: 0 });
        formatString = 'MMM dd';
        break;
      case 'monthly':
        intervals = eachMonthOfInterval({
          start: subDays(now, 365),
          end: now
        });
        formatString = 'MMM yyyy';
        break;
    }

    const data = intervals.map(date => {
      const matchingCommissions = commissions.filter(comm => {
        if (!comm.createdAt) return false;
        const commDate = new Date(comm.createdAt);
        
        switch (timePeriod) {
          case 'daily':
            return startOfDay(commDate).getTime() === startOfDay(date).getTime();
          case 'weekly':
            return startOfWeek(commDate).getTime() === startOfWeek(date).getTime();
          case 'monthly':
            return startOfMonth(commDate).getTime() === startOfMonth(date).getTime();
          default:
            return false;
        }
      });

      const sales = matchingCommissions.reduce((sum, c) => sum + c.orderTotal, 0);
      const commissionEarned = matchingCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      const count = matchingCommissions.length;

      return {
        date: format(date, formatString),
        sales,
        commissionEarned,
        count,
      };
    });

    return data;
  };

  const chartData = generateChartData();
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-[#16161E] border border-[#ffffff0f] p-3 rounded-lg shadow-lg">
        <p className="text-white font-semibold mb-2">{payload[0].payload.date}</p>
        <div className="space-y-1 text-sm">
          <p className="text-[#00AFFF]">
            Sales: ${payload[0].value.toFixed(2)}
          </p>
          <p className="text-[#4EEAFF]">
            Commission: ${payload[1].value.toFixed(2)}
          </p>
          <p className="text-[#B8B8C7]">
            Orders: {payload[0].payload.count}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Sales Performance</h3>
          <p className="text-sm text-muted-foreground">
            {timePeriod === 'daily' && 'Last 30 Days'}
            {timePeriod === 'weekly' && 'Last 12 Weeks'}
            {timePeriod === 'monthly' && 'Last 12 Months'}
          </p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
          <XAxis 
            dataKey="date" 
            stroke="#B8B8C7"
            tick={{ fill: '#B8B8C7', fontSize: 12 }}
          />
          <YAxis 
            stroke="#B8B8C7"
            tick={{ fill: '#B8B8C7', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ color: '#B8B8C7' }}
            iconType="circle"
          />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="#00AFFF" 
            strokeWidth={2}
            name="Total Sales"
            dot={{ fill: '#00AFFF', r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="commissionEarned" 
            stroke="#4EEAFF" 
            strokeWidth={2}
            name="Commission"
            dot={{ fill: '#4EEAFF', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
