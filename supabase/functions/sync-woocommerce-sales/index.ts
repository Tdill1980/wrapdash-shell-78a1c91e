import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Store timezone (used for "today" + month-to-date calculations)
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
        parts
          .filter((p) => p.type !== "literal")
          .map((p) => [p.type, p.value])
      ) as Record<string, string>;

      // Treat the formatted parts as if they were UTC, then compare to actual epoch.
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
      // Initial guess: midnight "as if" UTC
      const guess = new Date(Date.UTC(year, month0, day, 0, 0, 0));
      const offsetMs = getTimeZoneOffsetMs(guess, timeZone);
      return new Date(guess.getTime() - offsetMs);
    }

    // Get current month date range in STORE_TIMEZONE
    const now = new Date();
    const nowParts = new Intl.DateTimeFormat("en-US", {
      timeZone: STORE_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const nowMap = Object.fromEntries(
      nowParts
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value])
    ) as Record<string, string>;

    const tzYear = Number(nowMap.year);
    const tzMonth0 = Number(nowMap.month) - 1;
    const tzDay = Number(nowMap.day);

    const monthStart = zonedMidnightToUtc(tzYear, tzMonth0, 1, STORE_TIMEZONE);
    const todayStart = zonedMidnightToUtc(tzYear, tzMonth0, tzDay, STORE_TIMEZONE);

    // Month-to-date ends "now" (prevents end-of-month boundary issues)
    const monthEnd = now;

    // Last year same period (month-to-date) ends at the same local day start offset
    const lastYearStart = zonedMidnightToUtc(tzYear - 1, tzMonth0, 1, STORE_TIMEZONE);
    const lastYearEnd = new Date(now.getTime());
    lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);


    // Fetch current month orders from WooCommerce
    const currentMonthUrl = `${wooUrl}/wp-json/wc/v3/orders?after=${monthStart.toISOString()}&before=${monthEnd.toISOString()}&per_page=100&status=completed,processing&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    
    let allCurrentOrders: any[] = [];
    let page = 1;
    let hasMore = true;

    // Paginate through all current month orders
    while (hasMore) {
      const response = await fetch(`${currentMonthUrl}&page=${page}`);
      if (!response.ok) {
        console.error("WooCommerce API error:", response.status);
        throw new Error(`WooCommerce API error: ${response.status}`);
      }
      const orders = await response.json();
      if (orders.length === 0) {
        hasMore = false;
      } else {
        allCurrentOrders = [...allCurrentOrders, ...orders];
        page++;
        if (orders.length < 100) hasMore = false;
      }
    }

    // Fetch last year same period for comparison
    const lastYearUrl = `${wooUrl}/wp-json/wc/v3/orders?after=${lastYearStart.toISOString()}&before=${lastYearEnd.toISOString()}&per_page=100&status=completed,processing&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    
    let allLastYearOrders: any[] = [];
    page = 1;
    hasMore = true;

    while (hasMore) {
      const response = await fetch(`${lastYearUrl}&page=${page}`);
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error("WooCommerce API error (last year):", response.status, body);
        throw new Error(`WooCommerce API error (last year): ${response.status}`);
      }

      const orders = await response.json();
      if (orders.length === 0) {
        hasMore = false;
      } else {
        allLastYearOrders = [...allLastYearOrders, ...orders];
        page++;
        if (orders.length < 100) hasMore = false;
      }
    }

    // Calculate current month totals
    const currentRevenue = allCurrentOrders.reduce((sum, order) => {
      return sum + parseFloat(order.total || 0);
    }, 0);

    const orderCount = allCurrentOrders.length;

    // Today's revenue (compare against STORE_TIMEZONE midnight, using Woo's GMT timestamp when available)
    const todayOrders = allCurrentOrders.filter((order) => {
      const stamp = order.date_created_gmt || order.date_created;
      const orderDate = new Date(stamp);
      return orderDate >= todayStart;
    });
    const todayRevenue = todayOrders.reduce((sum, order) => {
      return sum + parseFloat(order.total || 0);
    }, 0);


    // Last year same period totals
    const lastYearRevenue = allLastYearOrders.reduce((sum, order) => {
      return sum + parseFloat(order.total || 0);
    }, 0);
    const lastYearOrderCount = allLastYearOrders.length;

    // Calculate year-over-year comparison
    const yoyDifference = currentRevenue - lastYearRevenue;
    const yoyPercentChange = lastYearRevenue > 0 
      ? ((currentRevenue - lastYearRevenue) / lastYearRevenue) * 100 
      : 0;

    // Calculate goal metrics
    const MONTHLY_TARGET = 400000;
    const DAILY_TARGET = 10000;
    const daysInMonth = monthEnd.getDate();
    const daysElapsed = now.getDate();
    const daysRemaining = daysInMonth - daysElapsed;
    const remainingTarget = MONTHLY_TARGET - currentRevenue;
    const dailyPaceRequired = daysRemaining > 0 ? remainingTarget / daysRemaining : 0;
    const percentComplete = (currentRevenue / MONTHLY_TARGET) * 100;

    // Calculate status
    const expectedPercent = (daysElapsed / daysInMonth) * 100;
    const progressDiff = percentComplete - expectedPercent;

    let status: string;
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

    // Generate AI suggestions based on status
    const suggestions: string[] = [];
    if (status === "CRITICAL" || status === "BEHIND") {
      suggestions.push(
        `Send promotional email - potential to recover $${Math.round(remainingTarget * 0.1).toLocaleString()}`,
        "Follow up on pending quotes from last 30 days",
        "Post Instagram stories about current promotions",
        "Reach out to past customers who haven't ordered in 90+ days"
      );
      if (yoyDifference < 0) {
        suggestions.push(
          `You're $${Math.abs(Math.round(yoyDifference)).toLocaleString()} behind last year - consider a flash sale`,
          "Contact fleet accounts for bulk order opportunities"
        );
      }
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
      // Year-over-year comparison
      lastYearRevenue,
      lastYearOrderCount,
      yoyDifference,
      yoyPercentChange,
      // AI suggestions
      suggestions,
      // Metadata
      dataSource: "woocommerce",
      lastUpdated: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error syncing WooCommerce sales:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
