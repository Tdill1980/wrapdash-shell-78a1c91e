// Create WooCommerce Coupon - For Wren re-engagement campaigns
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CouponRequest {
  code: string;           // e.g., "WREN5"
  discount_type: 'percent' | 'fixed_cart';
  amount: string;         // e.g., "5" for 5%
  description?: string;
  individual_use?: boolean;
  usage_limit?: number;
  usage_limit_per_user?: number;
  expires_days?: number;  // Days from now
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CouponRequest = await req.json();
    
    const key = Deno.env.get("WOO_CONSUMER_KEY");
    const secret = Deno.env.get("WOO_CONSUMER_SECRET");
    const wooUrl = "https://weprintwraps.com";

    if (!key || !secret) {
      return new Response(JSON.stringify({ error: "WooCommerce credentials not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Calculate expiry date
    let date_expires = null;
    if (body.expires_days) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + body.expires_days);
      date_expires = expiry.toISOString().split('T')[0];
    }

    const couponData = {
      code: body.code,
      discount_type: body.discount_type || 'percent',
      amount: body.amount,
      description: body.description || `Wren re-engagement coupon: ${body.code}`,
      individual_use: body.individual_use ?? true,
      usage_limit: body.usage_limit,
      usage_limit_per_user: body.usage_limit_per_user ?? 1,
      date_expires,
    };

    console.log('[create-woo-coupon] Creating coupon:', couponData);

    const authString = btoa(`${key}:${secret}`);
    const response = await fetch(`${wooUrl}/wp-json/wc/v3/coupons`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(couponData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[create-woo-coupon] WooCommerce error:', result);
      return new Response(JSON.stringify({ error: result.message || 'Failed to create coupon', details: result }), {
        status: response.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('[create-woo-coupon] Coupon created:', result.code);

    return new Response(JSON.stringify({ 
      success: true, 
      coupon: {
        id: result.id,
        code: result.code,
        amount: result.amount,
        discount_type: result.discount_type,
        date_expires: result.date_expires,
      }
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error('[create-woo-coupon] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
