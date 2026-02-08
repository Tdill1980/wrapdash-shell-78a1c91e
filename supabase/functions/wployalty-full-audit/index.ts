// WPLoyalty / WP Rewards Program COMPLETE Audit
// Created: Feb 8, 2026

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
      return new Response(JSON.stringify({ error: 'WooCommerce credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch ALL coupons (all pages)
    let page = 1;
    let allCoupons: any[] = [];
    while (page <= 10) { // Safety limit
      const couponsUrl = `${wooUrl}/wp-json/wc/v3/coupons?per_page=100&page=${page}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
      const couponsRes = await fetch(couponsUrl);
      if (!couponsRes.ok) break;
      const coupons = await couponsRes.json();
      if (!Array.isArray(coupons) || coupons.length === 0) break;
      allCoupons = allCoupons.concat(coupons);
      page++;
      if (coupons.length < 100) break;
    }

    // Separate WPLoyalty coupons (wlr-* prefix)
    const wlrCoupons = allCoupons.filter((c: any) => c.code?.toLowerCase().startsWith('wlr-'));
    const otherCoupons = allCoupons.filter((c: any) => !c.code?.toLowerCase().startsWith('wlr-'));

    // WPLoyalty breakdown by amount
    const wlrByAmount: Record<string, { count: number, used: number, totalValue: number }> = {};
    wlrCoupons.forEach((c: any) => {
      const amt = parseFloat(c.amount) || 0;
      const key = `$${amt.toFixed(0)}`;
      if (!wlrByAmount[key]) wlrByAmount[key] = { count: 0, used: 0, totalValue: 0 };
      wlrByAmount[key].count++;
      wlrByAmount[key].used += c.usage_count || 0;
      wlrByAmount[key].totalValue += (c.usage_count || 0) * amt;
    });

    // Calculate WPLoyalty totals
    const wlrTotalIssued = wlrCoupons.length;
    const wlrTotalRedeemed = wlrCoupons.filter((c: any) => (c.usage_count || 0) > 0).length;
    const wlrTotalValue = wlrCoupons.reduce((sum: number, c: any) => {
      return sum + ((c.usage_count || 0) * (parseFloat(c.amount) || 0));
    }, 0);
    const wlrUnredeemedValue = wlrCoupons.reduce((sum: number, c: any) => {
      const unused = (c.usage_limit || 1) - (c.usage_count || 0);
      return sum + (unused > 0 ? unused * (parseFloat(c.amount) || 0) : 0);
    }, 0);

    // Other coupon stats
    const otherTotalUsage = otherCoupons.reduce((sum: number, c: any) => sum + (c.usage_count || 0), 0);
    const topOtherCoupons = [...otherCoupons]
      .sort((a: any, b: any) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 15)
      .map((c: any) => ({
        code: c.code,
        type: c.discount_type,
        amount: c.amount,
        usage: c.usage_count || 0,
        created: c.date_created?.split('T')[0]
      }));

    // Fetch orders to calculate actual discounts (last 1000 orders)
    let allOrders: any[] = [];
    for (let p = 1; p <= 10; p++) {
      const ordersUrl = `${wooUrl}/wp-json/wc/v3/orders?per_page=100&page=${p}&status=completed,processing&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
      const ordersRes = await fetch(ordersUrl);
      if (!ordersRes.ok) break;
      const orders = await ordersRes.json();
      if (!Array.isArray(orders) || orders.length === 0) break;
      allOrders = allOrders.concat(orders);
      if (orders.length < 100) break;
    }

    // Calculate order stats
    const ordersWithDiscount = allOrders.filter((o: any) => parseFloat(o.discount_total || '0') > 0);
    const ordersWithoutDiscount = allOrders.filter((o: any) => parseFloat(o.discount_total || '0') === 0);

    const totalRevenue = allOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);
    const totalDiscount = allOrders.reduce((sum: number, o: any) => sum + parseFloat(o.discount_total || '0'), 0);

    const revenueWithDiscount = ordersWithDiscount.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);
    const revenueWithoutDiscount = ordersWithoutDiscount.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);

    // Find orders that used WPLoyalty coupons
    const ordersWithWLR = allOrders.filter((o: any) => 
      o.coupon_lines?.some((cl: any) => cl.code?.toLowerCase().startsWith('wlr-'))
    );
    const wlrOrderValue = ordersWithWLR.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);
    const wlrOrderDiscount = ordersWithWLR.reduce((sum: number, o: any) => sum + parseFloat(o.discount_total || '0'), 0);

    // Find date range of WPLoyalty coupons
    const wlrDates = wlrCoupons.map((c: any) => c.date_created).filter(Boolean).sort();
    const firstWLR = wlrDates[0];
    const lastWLR = wlrDates[wlrDates.length - 1];

    // Time-based analysis
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const wlr90Days = wlrCoupons.filter((c: any) => new Date(c.date_created) >= ninetyDaysAgo);
    const wlrRedeemed90Days = wlr90Days.filter((c: any) => (c.usage_count || 0) > 0);

    const orders90Days = allOrders.filter((o: any) => new Date(o.date_created) >= ninetyDaysAgo);
    const discount90Days = orders90Days.reduce((sum: number, o: any) => sum + parseFloat(o.discount_total || '0'), 0);

    // Build the report
    const report = {
      generatedAt: new Date().toISOString(),
      
      programInfo: {
        firstWPLoyaltyCoupon: firstWLR?.split('T')[0] || 'Unknown',
        lastWPLoyaltyCoupon: lastWLR?.split('T')[0] || 'Unknown',
        note: 'WPLoyalty coupons use "wlr-" prefix'
      },

      wployaltyStats: {
        totalCouponsIssued: wlrTotalIssued,
        totalCouponsRedeemed: wlrTotalRedeemed,
        redemptionRate: wlrTotalIssued > 0 ? ((wlrTotalRedeemed / wlrTotalIssued) * 100).toFixed(1) + '%' : '0%',
        totalDiscountsGiven: '$' + wlrTotalValue.toFixed(2),
        unredeemedLiability: '$' + wlrUnredeemedValue.toFixed(2),
        byAmount: Object.entries(wlrByAmount)
          .sort((a, b) => parseFloat(a[0].slice(1)) - parseFloat(b[0].slice(1)))
          .map(([amount, data]) => ({
            reward: amount,
            issued: data.count,
            used: data.used,
            totalDiscounted: '$' + data.totalValue.toFixed(2)
          }))
      },

      ordersWithWPLoyalty: {
        count: ordersWithWLR.length,
        totalRevenue: '$' + wlrOrderValue.toFixed(2),
        totalDiscount: '$' + wlrOrderDiscount.toFixed(2),
        avgOrderValue: ordersWithWLR.length > 0 ? '$' + (wlrOrderValue / ordersWithWLR.length).toFixed(2) : '$0'
      },

      last90Days: {
        wlrCouponsCreated: wlr90Days.length,
        wlrCouponsRedeemed: wlrRedeemed90Days.length,
        totalOrdersAnalyzed: orders90Days.length,
        totalDiscountsAllCoupons: '$' + discount90Days.toFixed(2)
      },

      allCouponStats: {
        totalCoupons: allCoupons.length,
        wplCoupons: wlrCoupons.length,
        otherCoupons: otherCoupons.length,
        otherCouponUsage: otherTotalUsage,
        topOtherCoupons
      },

      orderAnalysis: {
        totalOrdersAnalyzed: allOrders.length,
        ordersWithAnyDiscount: ordersWithDiscount.length,
        ordersWithoutDiscount: ordersWithoutDiscount.length,
        discountRate: allOrders.length > 0 ? ((ordersWithDiscount.length / allOrders.length) * 100).toFixed(1) + '%' : '0%',
        totalRevenue: '$' + totalRevenue.toFixed(2),
        totalDiscounts: '$' + totalDiscount.toFixed(2),
        avgOrderWithDiscount: ordersWithDiscount.length > 0 
          ? '$' + (revenueWithDiscount / ordersWithDiscount.length).toFixed(2) : '$0',
        avgOrderWithoutDiscount: ordersWithoutDiscount.length > 0 
          ? '$' + (revenueWithoutDiscount / ordersWithoutDiscount.length).toFixed(2) : '$0'
      },

      roiAnalysis: {
        wplDiscountsGiven: '$' + wlrTotalValue.toFixed(2),
        wplOrderRevenue: '$' + wlrOrderValue.toFixed(2),
        netRevenue: '$' + (wlrOrderValue - wlrTotalValue).toFixed(2),
        note: 'Net = Revenue from WPL orders minus discounts given'
      }
    };

    return new Response(JSON.stringify(report, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Audit failed', 
      details: String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
