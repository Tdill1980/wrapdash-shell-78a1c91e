import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AffiliateCommission } from '../services/affiliateApi';
import { DollarSign, TrendingUp, Package } from 'lucide-react';

interface ProductCommissionCardsProps {
  commissions: AffiliateCommission[];
}

interface ProductData {
  name: string;
  rate: number;
  color: string;
  icon: string;
}

const PRODUCTS: ProductData[] = [
  { name: 'WrapCommand AI', rate: 20.0, color: 'from-cyan-500 to-blue-600', icon: '🤖' },
  { name: 'RestylePro Visualizer Suite', rate: 15.0, color: 'from-orange-500 to-amber-500', icon: '🎨' },
  { name: 'Ink & Edge Magazine', rate: 20.0, color: 'from-purple-500 to-pink-500', icon: '📰' },
  { name: 'WePrintWraps.com', rate: 2.5, color: 'from-blue-500 to-cyan-500', icon: '🖨️' },
];

export const ProductCommissionCards = ({ commissions }: ProductCommissionCardsProps) => {
  const getProductStats = (productName: string) => {
    const productCommissions = commissions.filter(c => c.productName === productName);
    
    return {
      totalSales: productCommissions.reduce((sum, c) => sum + c.orderTotal, 0),
      totalCommission: productCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      orderCount: productCommissions.length,
      pending: productCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0),
      approved: productCommissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.commissionAmount, 0),
      paid: productCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0),
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Product Performance</h3>
        <Badge variant="outline" className="border-primary text-primary">
          <Package className="w-3 h-3 mr-1" />
          {PRODUCTS.length} Products
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRODUCTS.map((product) => {
          const stats = getProductStats(product.name);
          
          return (
            <Card 
              key={product.name}
              className="p-5 bg-card border-border hover:border-primary/50 transition-all group"
            >
              {/* Product Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{product.icon}</div>
                  <div>
                    <h4 className="font-semibold text-white text-sm leading-tight">
                      {product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {product.rate}% commission
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                {/* Total Commission */}
                <div className="p-3 bg-background rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total Earned</span>
                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className={`text-xl font-bold bg-gradient-to-r ${product.color} bg-clip-text text-transparent mt-1`}>
                    ${stats.totalCommission.toFixed(2)}
                  </p>
                </div>

                {/* Order Count & Sales */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-background rounded border border-border">
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="text-lg font-bold text-white">{stats.orderCount}</p>
                  </div>
                  <div className="p-2 bg-background rounded border border-border">
                    <p className="text-xs text-muted-foreground">Sales</p>
                    <p className="text-lg font-bold text-white">${stats.totalSales.toFixed(0)}</p>
                  </div>
                </div>

                {/* Status Breakdown */}
                {stats.totalCommission > 0 && (
                  <div className="pt-2 border-t border-border space-y-1.5">
                    {stats.pending > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">🟡 Pending</span>
                        <span className="text-yellow-500 font-medium">${stats.pending.toFixed(2)}</span>
                      </div>
                    )}
                    {stats.approved > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">🟢 Approved</span>
                        <span className="text-green-500 font-medium">${stats.approved.toFixed(2)}</span>
                      </div>
                    )}
                    {stats.paid > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">🔵 Paid</span>
                        <span className="text-blue-500 font-medium">${stats.paid.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* No Sales Message */}
                {stats.totalCommission === 0 && (
                  <div className="text-center py-2">
                    <p className="text-xs text-muted-foreground">No sales yet</p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
