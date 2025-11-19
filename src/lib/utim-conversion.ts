import { supabase } from "@/integrations/supabase/client";

/**
 * Mark a quote as converted to order and track in UTIM
 */
export async function trackQuoteConversion(
  quoteId: string,
  wooOrderId: string,
  orderTotal: number
) {
  try {
    // Update quote as converted
    const { error: quoteError } = await supabase
      .from("quotes")
      .update({
        converted_to_order: true,
        conversion_date: new Date().toISOString(),
        woo_order_id: wooOrderId,
        conversion_revenue: orderTotal,
        status: "completed",
      })
      .eq("id", quoteId);

    if (quoteError) {
      console.error("Error marking quote as converted:", quoteError);
      return false;
    }

    // Get quote details for customer tracking
    const { data: quote } = await supabase
      .from("quotes")
      .select("customer_email, quote_number")
      .eq("id", quoteId)
      .single();

    if (quote) {
      // Get customer ID if exists
      const { data: customer } = await supabase
        .from("email_retarget_customers")
        .select("id")
        .eq("email", quote.customer_email)
        .maybeSingle();

      // Track conversion event
      await supabase.from("email_events").insert({
        event_type: "converted",
        customer_id: customer?.id || null,
        quote_id: quoteId,
        utim_data: {
          woo_order_id: wooOrderId,
          revenue: orderTotal,
        },
        metadata: {
          quote_number: quote.quote_number,
          order_total: orderTotal,
        },
      });
    }

    console.log(`Quote ${quoteId} marked as converted to order ${wooOrderId}`);
    return true;
  } catch (error) {
    console.error("Error tracking quote conversion:", error);
    return false;
  }
}

/**
 * Get conversion analytics for dashboard
 */
export async function getConversionAnalytics() {
  try {
    // Get total conversions
    const { data: conversions } = await supabase
      .from("quotes")
      .select("conversion_revenue, conversion_date")
      .eq("converted_to_order", true);

    // Get total quotes sent
    const { data: allQuotes } = await supabase
      .from("quotes")
      .select("id");

    const totalRevenue = conversions?.reduce((sum, c) => sum + (c.conversion_revenue || 0), 0) || 0;
    const conversionRate = allQuotes?.length 
      ? Math.round((conversions?.length || 0) / allQuotes.length * 100) 
      : 0;

    return {
      totalConversions: conversions?.length || 0,
      totalRevenue,
      conversionRate,
      recentConversions: conversions?.slice(0, 5) || [],
    };
  } catch (error) {
    console.error("Error getting conversion analytics:", error);
    return {
      totalConversions: 0,
      totalRevenue: 0,
      conversionRate: 0,
      recentConversions: [],
    };
  }
}
