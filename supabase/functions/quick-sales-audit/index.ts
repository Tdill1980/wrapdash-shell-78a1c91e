// Quick Sales Audit - minimal API calls
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

    // Single page of 100 recent orders only
    const url = `${wooUrl}/wp-json/wc/v3/orders?per_page=100&status=completed,processing&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    const res = await fetch(url);
    const orders = await res.json();
    
    // Get totals from headers
    const totalOrders = res.headers.get('X-WP-Total');
    
    // Quick analysis
    const withLoyalty = orders.filter((o: any) => 
      o.coupon_lines?.some((c: any) => c.code?.toLowerCase().startsWith('wlr-'))
    );
    const withOtherCoupon = orders.filter((o: any) => 
      o.coupon_lines?.length > 0 && 
      !o.coupon_lines?.some((c: any) => c.code?.toLowerCase().startsWith('wlr-'))
    );
    const noDiscount = orders.filter((o: any) => 
      !o.coupon_lines?.length || parseFloat(o.discount_total || '0') === 0
    );

    const sum = (arr: any[], key: string) => arr.reduce((s, o) => s + parseFloat(o[key] || '0'), 0);

    // Customer grouping
    const emails = new Set(orders.map((o: any) => o.billing?.email?.toLowerCase()).filter(Boolean));
    const loyaltyEmails = new Set(withLoyalty.map((o: any) => o.billing?.email?.toLowerCase()).filter(Boolean));

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      totalOrdersInSystem: totalOrders,
      sampleSize: orders.length,
      
      sampleBreakdown: {
        loyaltyOrders: {
          count: withLoyalty.length,
          pct: ((withLoyalty.length / orders.length) * 100).toFixed(1) + '%',
          revenue: '$' + sum(withLoyalty, 'total').toFixed(2),
          discounts: '$' + sum(withLoyalty, 'discount_total').toFixed(2),
          avgOrder: '$' + (withLoyalty.length ? sum(withLoyalty, 'total') / withLoyalty.length : 0).toFixed(2)
        },
        otherCouponOrders: {
          count: withOtherCoupon.length,
          pct: ((withOtherCoupon.length / orders.length) * 100).toFixed(1) + '%',
          revenue: '$' + sum(withOtherCoupon, 'total').toFixed(2),
          discounts: '$' + sum(withOtherCoupon, 'discount_total').toFixed(2),
          avgOrder: '$' + (withOtherCoupon.length ? sum(withOtherCoupon, 'total') / withOtherCoupon.length : 0).toFixed(2)
        },
        noDiscountOrders: {
          count: noDiscount.length,
          pct: ((noDiscount.length / orders.length) * 100).toFixed(1) + '%',
          revenue: '$' + sum(noDiscount, 'total').toFixed(2),
          avgOrder: '$' + (noDiscount.length ? sum(noDiscount, 'total') / noDiscount.length : 0).toFixed(2)
        }
      },
      
      customers: {
        uniqueInSample: emails.size,
        loyaltyCustomers: loyaltyEmails.size
      },
      
      totals: {
        sampleRevenue: '$' + sum(orders, 'total').toFixed(2),
        sampleDiscounts: '$' + sum(orders, 'discount_total').toFixed(2),
        avgOrderValue: '$' + (sum(orders, 'total') / orders.length).toFixed(2)
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
