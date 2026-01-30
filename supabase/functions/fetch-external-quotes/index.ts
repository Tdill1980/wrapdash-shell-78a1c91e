import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// External WPW Quote Database
const EXTERNAL_SUPABASE_URL = "https://lqxnwskrrshythrydzcs.supabase.co";
const TENANT_ID = "wpw";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get service key for external database
    const externalServiceKey = Deno.env.get("EXTERNAL_QUOTE_DB_SERVICE_KEY");
    
    if (!externalServiceKey) {
      console.error("[fetch-external-quotes] Missing EXTERNAL_QUOTE_DB_SERVICE_KEY");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "External database not configured",
          tenant_id: TENANT_ID
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, externalServiceKey);

    const body = await req.json().catch(() => ({}));
    const { 
      source = "all",
      status,
      limit = 500,
      offset = 0,
      orderBy = "created_at",
      ascending = false,
      dateFrom,
      dateTo
    } = body;

    console.log("[fetch-external-quotes] Fetching quotes:", { source, status, limit, offset, orderBy });

    // Build query
    let query = externalSupabase
      .from("quotes")
      .select("*", { count: "exact" });

    // Source filter mapping
    const sourceMapping: Record<string, string[]> = {
      "quote_tool": ["wpw_home_quote_tool", "wpw_quote_page", "jackson_quote_tool"],
      "website_chat": ["chat_widget", "website_chat", "website"],
      "phone": ["vapi_voice", "vapi_phone", "phone"],
      "email": ["email"],
      "manual": ["manual"],
    };

    if (source && source !== "all" && sourceMapping[source]) {
      query = query.in("source", sourceMapping[source]);
    }

    // Status filter
    if (status) {
      query = query.eq("status", status);
    }

    // Date range filter
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    // Ordering and pagination
    query = query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data: quotes, error, count } = await query;

    if (error) {
      console.error("[fetch-external-quotes] Query error:", error);
      throw error;
    }

    console.log("[fetch-external-quotes] Fetched", quotes?.length, "quotes, total:", count);

    // Calculate analytics
    const analytics = {
      total: count || 0,
      by_status: {} as Record<string, number>,
      by_source: {} as Record<string, number>,
      total_revenue: 0,
      converted_count: 0,
      converted_revenue: 0,
    };

    const UNPAID_STATUSES = ["pending", "on-hold", "failed", "cancelled", "none"];

    quotes?.forEach((q: any) => {
      // Status counts
      const qStatus = q.status || "pending";
      analytics.by_status[qStatus] = (analytics.by_status[qStatus] || 0) + 1;

      // Source counts
      const qSource = q.source || "unknown";
      analytics.by_source[qSource] = (analytics.by_source[qSource] || 0) + 1;

      // Revenue calculations
      if (q.final_price) {
        analytics.total_revenue += Number(q.final_price);
      }

      // Converted orders (WPW store = 33xxx)
      if (
        q.woo_order_id &&
        q.woo_order_number?.startsWith("33") &&
        !UNPAID_STATUSES.includes(q.woo_order_status || "none")
      ) {
        analytics.converted_count++;
        analytics.converted_revenue += Number(q.woo_order_total || 0);
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: TENANT_ID,
        quotes: quotes || [],
        count,
        analytics,
        filters: { source, status, limit, offset, orderBy, ascending },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[fetch-external-quotes] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        tenant_id: TENANT_ID 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
