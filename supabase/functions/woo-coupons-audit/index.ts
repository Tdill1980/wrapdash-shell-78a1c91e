// Simpler WooCommerce Coupons Audit
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

    // Just fetch coupons - single page first
    const couponsUrl = `${wooUrl}/wp-json/wc/v3/coupons?per_page=100&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    console.log('Fetching coupons from:', couponsUrl.replace(consumerSecret, '***'));
    
    const couponsRes = await fetch(couponsUrl);
    console.log('Response status:', couponsRes.status);
    
    if (!couponsRes.ok) {
      const text = await couponsRes.text();
      return new Response(JSON.stringify({ 
        error: 'WooCommerce API error', 
        status: couponsRes.status,
        body: text.substring(0, 500)
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const coupons = await couponsRes.json();
    console.log('Got coupons:', coupons.length);

    // Get total header
    const totalCoupons = couponsRes.headers.get('X-WP-Total');
    const totalPages = couponsRes.headers.get('X-WP-TotalPages');

    // Summary
    const totalUsage = coupons.reduce((sum: number, c: any) => sum + (c.usage_count || 0), 0);
    
    // Top 15 by usage
    const topByUsage = [...coupons]
      .sort((a: any, b: any) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 15)
      .map((c: any) => ({
        code: c.code,
        type: c.discount_type,
        amount: c.amount,
        usage: c.usage_count || 0,
        description: c.description?.substring(0, 50) || '',
        created: c.date_created?.split('T')[0]
      }));

    // Look for loyalty/points related coupons
    const loyaltyRelated = coupons.filter((c: any) => 
      c.code?.toLowerCase().includes('wlr') || 
      c.code?.toLowerCase().includes('point') ||
      c.code?.toLowerCase().includes('reward') ||
      c.code?.toLowerCase().includes('loyalty') ||
      c.description?.toLowerCase().includes('loyalty') ||
      c.description?.toLowerCase().includes('points')
    ).map((c: any) => ({
      code: c.code,
      type: c.discount_type,
      amount: c.amount,
      usage: c.usage_count || 0,
      description: c.description?.substring(0, 50) || ''
    }));

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      totalCoupons,
      totalPages,
      fetchedCount: coupons.length,
      totalUsageCount: totalUsage,
      topByUsage,
      loyaltyRelated,
      allCoupons: coupons.map((c: any) => ({
        id: c.id,
        code: c.code,
        type: c.discount_type,
        amount: c.amount,
        usage: c.usage_count || 0,
        limit: c.usage_limit,
        expires: c.date_expires,
        created: c.date_created?.split('T')[0],
        description: c.description?.substring(0, 100)
      }))
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed', 
      details: String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
