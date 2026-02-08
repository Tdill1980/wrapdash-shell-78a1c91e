// Analyze loyalty customer behavior - are they repeat buyers?
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

    // Fetch customers with order data
    const customersUrl = `${wooUrl}/wp-json/wc/v3/customers?per_page=100&orderby=id&order=desc&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    const customersRes = await fetch(customersUrl);
    const customers = await customersRes.json();

    // Fetch recent orders to identify loyalty users
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

    // Identify orders with WPLoyalty coupons (wlr-*)
    const loyaltyOrders = allOrders.filter((o: any) => 
      o.coupon_lines?.some((cl: any) => cl.code?.toLowerCase().startsWith('wlr-'))
    );

    const nonLoyaltyOrders = allOrders.filter((o: any) => 
      !o.coupon_lines?.some((cl: any) => cl.code?.toLowerCase().startsWith('wlr-'))
    );

    // Group orders by customer email
    const customerOrders: Record<string, any[]> = {};
    allOrders.forEach((o: any) => {
      const email = o.billing?.email?.toLowerCase();
      if (email) {
        if (!customerOrders[email]) customerOrders[email] = [];
        customerOrders[email].push(o);
      }
    });

    // Identify loyalty customers (used wlr-* coupon at least once)
    const loyaltyCustomerEmails = new Set<string>();
    loyaltyOrders.forEach((o: any) => {
      const email = o.billing?.email?.toLowerCase();
      if (email) loyaltyCustomerEmails.add(email);
    });

    // Calculate stats for loyalty vs non-loyalty customers
    const loyaltyCustomerStats: any[] = [];
    const nonLoyaltyCustomerStats: any[] = [];

    Object.entries(customerOrders).forEach(([email, orders]) => {
      const isLoyaltyCustomer = loyaltyCustomerEmails.has(email);
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
      const totalDiscount = orders.reduce((sum, o) => sum + parseFloat(o.discount_total || '0'), 0);
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      
      const firstOrder = orders.reduce((min, o) => 
        new Date(o.date_created) < new Date(min.date_created) ? o : min
      );
      const lastOrder = orders.reduce((max, o) => 
        new Date(o.date_created) > new Date(max.date_created) ? o : max
      );
      
      const daysBetween = (new Date(lastOrder.date_created).getTime() - new Date(firstOrder.date_created).getTime()) / (1000 * 60 * 60 * 24);
      
      const stat = {
        email,
        totalOrders,
        totalSpent: totalSpent.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        avgOrderValue: avgOrderValue.toFixed(2),
        firstOrder: firstOrder.date_created?.split('T')[0],
        lastOrder: lastOrder.date_created?.split('T')[0],
        daysBetweenFirstLast: Math.round(daysBetween),
        company: orders[0]?.billing?.company || ''
      };

      if (isLoyaltyCustomer) {
        loyaltyCustomerStats.push(stat);
      } else {
        nonLoyaltyCustomerStats.push(stat);
      }
    });

    // Sort by total spent
    loyaltyCustomerStats.sort((a, b) => parseFloat(b.totalSpent) - parseFloat(a.totalSpent));
    nonLoyaltyCustomerStats.sort((a, b) => parseFloat(b.totalSpent) - parseFloat(a.totalSpent));

    // Calculate averages
    const loyaltyAvgOrders = loyaltyCustomerStats.length > 0 
      ? loyaltyCustomerStats.reduce((sum, c) => sum + c.totalOrders, 0) / loyaltyCustomerStats.length 
      : 0;
    const loyaltyAvgSpent = loyaltyCustomerStats.length > 0 
      ? loyaltyCustomerStats.reduce((sum, c) => sum + parseFloat(c.totalSpent), 0) / loyaltyCustomerStats.length 
      : 0;
    const loyaltyAvgOrderValue = loyaltyCustomerStats.length > 0
      ? loyaltyCustomerStats.reduce((sum, c) => sum + parseFloat(c.avgOrderValue), 0) / loyaltyCustomerStats.length
      : 0;

    const nonLoyaltyAvgOrders = nonLoyaltyCustomerStats.length > 0 
      ? nonLoyaltyCustomerStats.reduce((sum, c) => sum + c.totalOrders, 0) / nonLoyaltyCustomerStats.length 
      : 0;
    const nonLoyaltyAvgSpent = nonLoyaltyCustomerStats.length > 0 
      ? nonLoyaltyCustomerStats.reduce((sum, c) => sum + parseFloat(c.totalSpent), 0) / nonLoyaltyCustomerStats.length 
      : 0;
    const nonLoyaltyAvgOrderValue = nonLoyaltyCustomerStats.length > 0
      ? nonLoyaltyCustomerStats.reduce((sum, c) => sum + parseFloat(c.avgOrderValue), 0) / nonLoyaltyCustomerStats.length
      : 0;

    // Repeat buyer analysis
    const loyaltyRepeatBuyers = loyaltyCustomerStats.filter(c => c.totalOrders > 1).length;
    const nonLoyaltyRepeatBuyers = nonLoyaltyCustomerStats.filter(c => c.totalOrders > 1).length;

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      sampleSize: allOrders.length,
      
      summary: {
        loyaltyCustomers: loyaltyCustomerStats.length,
        nonLoyaltyCustomers: nonLoyaltyCustomerStats.length,
        loyaltyAvgOrders: loyaltyAvgOrders.toFixed(2),
        nonLoyaltyAvgOrders: nonLoyaltyAvgOrders.toFixed(2),
        loyaltyAvgSpent: '$' + loyaltyAvgSpent.toFixed(2),
        nonLoyaltyAvgSpent: '$' + nonLoyaltyAvgSpent.toFixed(2),
        loyaltyAvgOrderValue: '$' + loyaltyAvgOrderValue.toFixed(2),
        nonLoyaltyAvgOrderValue: '$' + nonLoyaltyAvgOrderValue.toFixed(2),
        loyaltyRepeatBuyerRate: loyaltyCustomerStats.length > 0 
          ? ((loyaltyRepeatBuyers / loyaltyCustomerStats.length) * 100).toFixed(1) + '%' 
          : '0%',
        nonLoyaltyRepeatBuyerRate: nonLoyaltyCustomerStats.length > 0 
          ? ((nonLoyaltyRepeatBuyers / nonLoyaltyCustomerStats.length) * 100).toFixed(1) + '%' 
          : '0%'
      },

      topLoyaltyCustomers: loyaltyCustomerStats.slice(0, 15),
      topNonLoyaltyCustomers: nonLoyaltyCustomerStats.slice(0, 15)
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Analysis failed', details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
