// Full Sales Audit - Loyalty vs Non-Loyalty
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const wooUrl = Deno.env.get('WOO_URL') || 'https://weprintwraps.com';
    const consumerKey = Deno.env.get('WOO_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOO_CONSUMER_SECRET');

    if (!consumerKey || !consumerSecret) {
      return new Response(JSON.stringify({ error: 'Missing credentials' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get order totals report
    const totalsUrl = `${wooUrl}/wp-json/wc/v3/reports/orders/totals?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    const totalsRes = await fetch(totalsUrl);
    const totals = totalsRes.ok ? await totalsRes.json() : null;

    // Get recent orders (500 max for analysis)
    let orders: any[] = [];
    for (let p = 1; p <= 5; p++) {
      const url = `${wooUrl}/wp-json/wc/v3/orders?per_page=100&page=${p}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      if (!data.length) break;
      orders = orders.concat(data);
      if (data.length < 100) break;
    }

    // Analyze orders
    const completed = orders.filter((o: any) => ['completed', 'processing'].includes(o.status));
    const withDiscount = completed.filter((o: any) => parseFloat(o.discount_total || '0') > 0);
    const withLoyalty = completed.filter((o: any) => 
      o.coupon_lines?.some((c: any) => c.code?.toLowerCase().startsWith('wlr-'))
    );
    const withOtherCoupon = completed.filter((o: any) => 
      parseFloat(o.discount_total || '0') > 0 && 
      !o.coupon_lines?.some((c: any) => c.code?.toLowerCase().startsWith('wlr-'))
    );
    const noDiscount = completed.filter((o: any) => parseFloat(o.discount_total || '0') === 0);

    // Calculate metrics
    const calcStats = (arr: any[]) => ({
      count: arr.length,
      revenue: arr.reduce((s, o) => s + parseFloat(o.total || '0'), 0),
      discount: arr.reduce((s, o) => s + parseFloat(o.discount_total || '0'), 0),
      avgOrder: arr.length ? arr.reduce((s, o) => s + parseFloat(o.total || '0'), 0) / arr.length : 0
    });

    const allStats = calcStats(completed);
    const loyaltyStats = calcStats(withLoyalty);
    const otherCouponStats = calcStats(withOtherCoupon);
    const noDiscountStats = calcStats(noDiscount);

    // Customer analysis - group by email
    const customers: Record<string, any[]> = {};
    completed.forEach((o: any) => {
      const email = o.billing?.email?.toLowerCase();
      if (email) {
        if (!customers[email]) customers[email] = [];
        customers[email].push(o);
      }
    });

    const totalCustomers = Object.keys(customers).length;
    const repeatCustomers = Object.values(customers).filter(orders => orders.length > 1).length;
    const oneTimeCustomers = totalCustomers - repeatCustomers;

    // Loyalty customers
    const loyaltyEmails = new Set<string>();
    withLoyalty.forEach((o: any) => {
      const email = o.billing?.email?.toLowerCase();
      if (email) loyaltyEmails.add(email);
    });

    // Loyalty customer order counts
    let loyaltyCustomerTotalOrders = 0;
    let loyaltyCustomerTotalSpent = 0;
    loyaltyEmails.forEach(email => {
      if (customers[email]) {
        loyaltyCustomerTotalOrders += customers[email].length;
        loyaltyCustomerTotalSpent += customers[email].reduce((s, o) => s + parseFloat(o.total || '0'), 0);
      }
    });

    // Non-loyalty repeat customers
    const nonLoyaltyRepeat = Object.entries(customers)
      .filter(([email, orders]) => !loyaltyEmails.has(email) && orders.length > 1);

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      samplePeriod: 'Recent 500 orders',
      
      orderTotals: totals,
      
      overview: {
        totalOrders: allStats.count,
        totalRevenue: '$' + allStats.revenue.toFixed(2),
        totalDiscounts: '$' + allStats.discount.toFixed(2),
        avgOrderValue: '$' + allStats.avgOrder.toFixed(2),
        discountRate: ((allStats.discount / allStats.revenue) * 100).toFixed(2) + '%'
      },

      breakdown: {
        ordersWithLoyaltyDiscount: {
          orders: loyaltyStats.count,
          pctOfTotal: ((loyaltyStats.count / allStats.count) * 100).toFixed(1) + '%',
          revenue: '$' + loyaltyStats.revenue.toFixed(2),
          discounts: '$' + loyaltyStats.discount.toFixed(2),
          avgOrder: '$' + loyaltyStats.avgOrder.toFixed(2)
        },
        ordersWithOtherCoupon: {
          orders: otherCouponStats.count,
          pctOfTotal: ((otherCouponStats.count / allStats.count) * 100).toFixed(1) + '%',
          revenue: '$' + otherCouponStats.revenue.toFixed(2),
          discounts: '$' + otherCouponStats.discount.toFixed(2),
          avgOrder: '$' + otherCouponStats.avgOrder.toFixed(2)
        },
        ordersNoDiscount: {
          orders: noDiscountStats.count,
          pctOfTotal: ((noDiscountStats.count / allStats.count) * 100).toFixed(1) + '%',
          revenue: '$' + noDiscountStats.revenue.toFixed(2),
          avgOrder: '$' + noDiscountStats.avgOrder.toFixed(2)
        }
      },

      customerAnalysis: {
        totalCustomers,
        repeatCustomers,
        repeatRate: ((repeatCustomers / totalCustomers) * 100).toFixed(1) + '%',
        oneTimeCustomers,
        
        loyaltyCustomers: {
          count: loyaltyEmails.size,
          totalOrders: loyaltyCustomerTotalOrders,
          avgOrdersPerCustomer: (loyaltyCustomerTotalOrders / loyaltyEmails.size).toFixed(2),
          totalSpent: '$' + loyaltyCustomerTotalSpent.toFixed(2),
          avgSpentPerCustomer: '$' + (loyaltyCustomerTotalSpent / loyaltyEmails.size).toFixed(2)
        },
        
        nonLoyaltyRepeatCustomers: nonLoyaltyRepeat.length
      },

      verdict: {
        loyaltyOrdersPct: ((loyaltyStats.count / allStats.count) * 100).toFixed(1) + '%',
        loyaltyRevenuePct: ((loyaltyStats.revenue / allStats.revenue) * 100).toFixed(1) + '%',
        avgLoyaltyDiscount: loyaltyStats.count ? '$' + (loyaltyStats.discount / loyaltyStats.count).toFixed(2) : '$0',
        profitImpact_19pctMargin: {
          loyaltyGrossProfit: '$' + (loyaltyStats.revenue * 0.19).toFixed(2),
          loyaltyDiscountsGiven: '$' + loyaltyStats.discount.toFixed(2),
          loyaltyNetProfit: '$' + ((loyaltyStats.revenue * 0.19) - loyaltyStats.discount).toFixed(2)
        }
      }
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
