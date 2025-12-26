import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const wooUrl = Deno.env.get("VITE_WOO_URL") || "https://weprintwraps.com";
    const consumerKey = Deno.env.get("WOO_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("WOO_CONSUMER_SECRET");

    if (!consumerKey || !consumerSecret) {
      throw new Error("WooCommerce credentials not configured");
    }

    const STORE_TIMEZONE = Deno.env.get("STORE_TIMEZONE") || "America/Los_Angeles";

    function getTimeZoneOffsetMs(date: Date, timeZone: string) {
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const parts = dtf.formatToParts(date);
      const map = Object.fromEntries(
        parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
      ) as Record<string, string>;
      const asIfUtc = Date.UTC(
        Number(map.year),
        Number(map.month) - 1,
        Number(map.day),
        Number(map.hour),
        Number(map.minute),
        Number(map.second)
      );
      return asIfUtc - date.getTime();
    }

    function zonedMidnightToUtc(year: number, month0: number, day: number, timeZone: string) {
      const guess = new Date(Date.UTC(year, month0, day, 0, 0, 0));
      const offsetMs = getTimeZoneOffsetMs(guess, timeZone);
      return new Date(guess.getTime() - offsetMs);
    }

    const now = new Date();
    const nowParts = new Intl.DateTimeFormat("en-US", {
      timeZone: STORE_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const nowMap = Object.fromEntries(
      nowParts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
    ) as Record<string, string>;

    const tzYear = Number(nowMap.year);
    const tzMonth0 = Number(nowMap.month) - 1;
    const tzDay = Number(nowMap.day);

    const monthStart = zonedMidnightToUtc(tzYear, tzMonth0, 1, STORE_TIMEZONE);
    const todayStart = zonedMidnightToUtc(tzYear, tzMonth0, tzDay, STORE_TIMEZONE);
    const monthEnd = now;

    const lastYearStart = zonedMidnightToUtc(tzYear - 1, tzMonth0, 1, STORE_TIMEZONE);
    const lastYearEnd = new Date(now.getTime());
    lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

    // Helper to fetch with retry logic for transient errors
    async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
      for (let attempt = 1; attempt <= retries; attempt++) {
        const response = await fetch(url);
        if (response.ok) {
          return response;
        }
        // On 5xx errors, retry with exponential backoff
        if (response.status >= 500 && attempt < retries) {
          console.log(`[sync-woocommerce-sales] Retry ${attempt}/${retries} after ${response.status} error, waiting ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          delay *= 2; // Exponential backoff
          continue;
        }
        throw new Error(`WooCommerce API error: ${response.status}`);
      }
      throw new Error("WooCommerce API: max retries exceeded");
    }

    // Helper to fetch orders and calculate totals incrementally (no storage)
    async function fetchOrderTotals(
      afterDate: Date,
      beforeDate: Date,
      todayStartDate?: Date
    ): Promise<{ revenue: number; count: number; todayRevenue: number }> {
      let revenue = 0;
      let count = 0;
      let todayRevenue = 0;
      let page = 1;
      let hasMore = true;

      // Only fetch the fields we need to reduce payload size
      const baseUrl = `${wooUrl}/wp-json/wc/v3/orders?after=${afterDate.toISOString()}&before=${beforeDate.toISOString()}&per_page=100&status=completed,processing&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

      while (hasMore) {
        const response = await fetchWithRetry(`${baseUrl}&page=${page}`);
        
        const orders = await response.json();
        if (orders.length === 0) {
          hasMore = false;
        } else {
          // Process immediately, don't store
          for (const order of orders) {
            const total = parseFloat(order.total || 0);
            revenue += total;
            count++;
            
            if (todayStartDate) {
              const stamp = order.date_created_gmt || order.date_created;
              const orderDate = new Date(stamp);
              if (orderDate >= todayStartDate) {
                todayRevenue += total;
              }
            }
          }
          page++;
          if (orders.length < 100) hasMore = false;
        }
      }

      return { revenue, count, todayRevenue };
    }

    let currentRevenue = 0;
    let orderCount = 0;
    let todayRevenue = 0;
    let currentFetchError: string | null = null;

    try {
      console.log("[sync-woocommerce-sales] Fetching current month orders...");
      const current = await fetchOrderTotals(monthStart, monthEnd, todayStart);
      currentRevenue = current.revenue;
      orderCount = current.count;
      todayRevenue = current.todayRevenue;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      currentFetchError = msg;
      console.error("[sync-woocommerce-sales] Current month fetch failed:", e);
    }

    // Last year fetch - best effort, don't fail if it errors
    let lastYearRevenue: number | null = null;
    let lastYearOrderCount: number | null = null;

    try {
      console.log("[sync-woocommerce-sales] Fetching last year orders...");
      const lastYear = await fetchOrderTotals(lastYearStart, lastYearEnd);
      lastYearRevenue = lastYear.revenue;
      lastYearOrderCount = lastYear.count;
    } catch (e) {
      console.error("[sync-woocommerce-sales] Last year fetch failed:", e);
    }

    // Calculate metrics
    const yoyDifference = lastYearRevenue != null ? currentRevenue - lastYearRevenue : null;
    const yoyPercentChange =
      lastYearRevenue != null && lastYearRevenue > 0
        ? ((currentRevenue - lastYearRevenue) / lastYearRevenue) * 100
        : null;

    const MONTHLY_TARGET = 400000;
    const DAILY_TARGET = 10000;
    const daysInMonth = new Date(tzYear, tzMonth0 + 1, 0).getDate();
    const daysElapsed = tzDay;
    const daysRemaining = daysInMonth - daysElapsed;
    const remainingTarget = MONTHLY_TARGET - currentRevenue;
    const dailyPaceRequired = daysRemaining > 0 ? remainingTarget / daysRemaining : 0;
    const percentComplete = (currentRevenue / MONTHLY_TARGET) * 100;

    let status: string;
    if (currentFetchError) {
      status = "UNAVAILABLE";
    } else {
      const expectedPercent = (daysElapsed / daysInMonth) * 100;
      const progressDiff = percentComplete - expectedPercent;

      if (percentComplete >= 100) {
        status = "AHEAD";
      } else if (progressDiff >= 5) {
        status = "AHEAD";
      } else if (progressDiff >= -10) {
        status = "ON_TRACK";
      } else if (progressDiff >= -25) {
        status = "BEHIND";
      } else {
        status = "CRITICAL";
      }
    }

    const suggestions: string[] = [];
    if (status === "UNAVAILABLE") {
      suggestions.push("Sales data source is temporarily unavailable. Please retry in a few minutes.");
    } else if (status === "CRITICAL" || status === "BEHIND") {
      suggestions.push(
        `Send promotional email - potential to recover $${Math.round(remainingTarget * 0.1).toLocaleString()}`,
        "Follow up on pending quotes from last 30 days",
        "Post Instagram stories about current promotions"
      );
    }

    const result = {
      currentRevenue,
      orderCount,
      todayRevenue,
      daysElapsed,
      daysRemaining,
      dailyPaceRequired,
      percentComplete,
      status,
      monthlyTarget: MONTHLY_TARGET,
      dailyTarget: DAILY_TARGET,
      lastYearRevenue,
      lastYearOrderCount,
      yoyDifference,
      yoyPercentChange,
      suggestions,
      dataSource: "woocommerce",
      lastUpdated: new Date().toISOString(),
      ...(currentFetchError ? { error: "woocommerce_unavailable", message: currentFetchError } : {}),
    };

    console.log("[sync-woocommerce-sales] Done:", result.currentRevenue, "revenue,", result.orderCount, "orders");

    // IMPORTANT: return 200 even when WooCommerce is flaky, so the UI can render a fallback state.
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[sync-woocommerce-sales] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
