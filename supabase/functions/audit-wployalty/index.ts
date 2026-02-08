// WPLoyalty / WP Rewards Program Full Audit
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

    const results: any = {
      timestamp: new Date().toISOString(),
      coupons: { total: 0, list: [], totalUsage: 0, totalDiscounted: 0 },
      ordersWithDiscounts: { count: 0, totalRevenue: 0, totalDiscount: 0, avgOrderValue: 0 },
      ordersWithoutDiscounts: { count: 0, totalRevenue: 0, avgOrderValue: 0 },
      topCoupons: [],
      last90DaysDiscounts: 0,
      loyaltyBreakdown: { pointsRedemptions: [], otherCoupons: [] }
    };

    // 1. Fetch ALL coupons
    let page = 1;
    let allCoupons: any[] = [];
    while (true) {
      const couponsUrl = `${wooUrl}/wp-json/wc/v3/coupons?per_page=100&page=${page}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
      const couponsRes = await fetch(couponsUrl);
      if (!couponsRes.ok) break;
      const coupons = await couponsRes.json();
      if (!Array.isArray(coupons) || coupons.length === 0) break;
      allCoupons = allCoupons.concat(coupons);
      page++;
      if (coupons.length < 100) break;
    }

    results.coupons.total = allCoupons.length;
    results.coupons.list = allCoupons.map((c: any) => ({
      id: c.id,
      code: c.code,
      discount_type: c.discount_type,
      amount: c.amount,
      usage_count: c.usage_count || 0,
      usage_limit: c.usage_limit,
      date_created: c.date_created,
      date_expires: c.date_expires,
      description: c.description,
      free_shipping: c.free_shipping,
      individual_use: c.individual_use
    }));

    // Calculate total usage
    results.coupons.totalUsage = allCoupons.reduce((sum: number, c: any) => sum + (c.usage_count || 0), 0);

    // Identify WPLoyalty coupons (usually have specific patterns like 'wlr_' or contain 'point')
    const loyaltyCoupons = allCoupons.filter((c: any) => 
      c.code?.toLowerCase().includes('wlr') || 
      c.code?.toLowerCase().includes('point') ||
      c.code?.toLowerCase().includes('reward') ||
      c.code?.toLowerCase().includes('loyalty') ||
      c.description?.toLowerCase().includes('loyalty') ||
      c.description?.toLowerCase().includes('points')
    );

    results.loyaltyBreakdown.pointsRedemptions = loyaltyCoupons.map((c: any) => ({
      code: c.code,
      usage_count: c.usage_count || 0,
      amount: c.amount,
      discount_type: c.discount_type
    }));

    // Top 10 most used coupons
    results.topCoupons = [...allCoupons]
      .sort((a: any, b: any) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 10)
      .map((c: any) => ({
        code: c.code,
        usage_count: c.usage_count || 0,
        amount: c.amount,
        discount_type: c.discount_type,
        date_created: c.date_created
      }));

    // 2. Fetch orders with coupons vs without (sample last 500 orders)
    let allOrders: any[] = [];
    for (let p = 1; p <= 5; p++) {
      const ordersUrl = `${wooUrl}/wp-json/wc/v3/orders?per_page=100&page=${p}&status=completed,processing&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
      const ordersRes = await fetch(ordersUrl);
      if (!ordersRes.ok) break;
      const orders = await ordersRes.json();
      if (!Array.isArray(orders) || orders.length === 0) break;
      allOrders = allOrders.concat(orders);
      if (orders.length < 100) break;
    }

    // Analyze orders
    const ordersWithDiscount = allOrders.filter((o: any) => 
      parseFloat(o.discount_total || '0') > 0 || 
      (o.coupon_lines && o.coupon_lines.length > 0)
    );
    const ordersWithoutDiscount = allOrders.filter((o: any) => 
      parseFloat(o.discount_total || '0') === 0 && 
      (!o.coupon_lines || o.coupon_lines.length === 0)
    );

    // Calculate totals
    results.ordersWithDiscounts.count = ordersWithDiscount.length;
    results.ordersWithDiscounts.totalRevenue = ordersWithDiscount.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);
    results.ordersWithDiscounts.totalDiscount = ordersWithDiscount.reduce((sum: number, o: any) => sum + parseFloat(o.discount_total || '0'), 0);
    results.ordersWithDiscounts.avgOrderValue = ordersWithDiscount.length > 0 
      ? results.ordersWithDiscounts.totalRevenue / ordersWithDiscount.length 
      : 0;

    results.ordersWithoutDiscounts.count = ordersWithoutDiscount.length;
    results.ordersWithoutDiscounts.totalRevenue = ordersWithoutDiscount.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);
    results.ordersWithoutDiscounts.avgOrderValue = ordersWithoutDiscount.length > 0 
      ? results.ordersWithoutDiscounts.totalRevenue / ordersWithoutDiscount.length 
      : 0;

    // Coupon usage breakdown from orders
    const couponUsage: Record<string, { count: number, totalDiscount: number }> = {};
    ordersWithDiscount.forEach((o: any) => {
      if (o.coupon_lines) {
        o.coupon_lines.forEach((cl: any) => {
          const code = cl.code?.toLowerCase() || 'unknown';
          if (!couponUsage[code]) {
            couponUsage[code] = { count: 0, totalDiscount: 0 };
          }
          couponUsage[code].count++;
          couponUsage[code].totalDiscount += parseFloat(cl.discount || '0');
        });
      }
    });

    results.couponUsageFromOrders = Object.entries(couponUsage)
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.totalDiscount - a.totalDiscount)
      .slice(0, 20);

    // 3. Try to access WPLoyalty REST API endpoints (if available)
    const wplEndpoints = [
      '/wp-json/wlr/v1/settings',
      '/wp-json/wlr/v1/earn-campaigns',
      '/wp-json/wlr/v1/points/users'
    ];

    results.wployaltyApi = {};
    for (const endpoint of wplEndpoints) {
      try {
        const res = await fetch(`${wooUrl}${endpoint}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`);
        const data = await res.json();
        results.wployaltyApi[endpoint] = { status: res.status, data: res.ok ? data : null };
      } catch (e) {
        results.wployaltyApi[endpoint] = { status: 'error', error: String(e) };
      }
    }

    // 4. Calculate last 90 days discounts
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentOrders = allOrders.filter((o: any) => new Date(o.date_created) >= ninetyDaysAgo);
    results.last90DaysDiscounts = recentOrders.reduce((sum: number, o: any) => sum + parseFloat(o.discount_total || '0'), 0);
    results.last90DaysOrderCount = recentOrders.length;

    // Summary stats
    results.summary = {
      totalCoupons: allCoupons.length,
      totalCouponUsages: results.coupons.totalUsage,
      sampleSize: allOrders.length,
      ordersWithDiscountPct: allOrders.length > 0 
        ? ((ordersWithDiscount.length / allOrders.length) * 100).toFixed(1) + '%'
        : '0%',
      avgOrderWithDiscount: results.ordersWithDiscounts.avgOrderValue.toFixed(2),
      avgOrderWithoutDiscount: results.ordersWithoutDiscounts.avgOrderValue.toFixed(2),
      totalDiscountsGiven: results.ordersWithDiscounts.totalDiscount.toFixed(2),
      last90DaysDiscounts: results.last90DaysDiscounts.toFixed(2)
    };

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Audit error:', error);
    return new Response(JSON.stringify({ 
      error: 'Audit failed', 
      details: String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
