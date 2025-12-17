// Shared helper to load sales goal context for AI agents
// This gives agents real-time awareness of revenue performance

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface SalesGoalContext {
  monthlyTarget: number;
  dailyTarget: number;
  currentRevenue: number;
  todayRevenue: number;
  percentComplete: number;
  daysRemaining: number;
  daysElapsed: number;
  dailyPaceRequired: number;
  status: "AHEAD" | "ON_TRACK" | "BEHIND" | "CRITICAL";
  orderCount: number;
  gapAmount: number;
  suggestions: string[];
}

const MONTHLY_TARGET = 400000;
const DAILY_TARGET = 10000;

export async function loadSalesGoalContext(
  organizationId?: string
): Promise<SalesGoalContext> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Query orders for the month
  let query = supabase
    .from("shopflow_orders")
    .select("order_total, created_at")
    .gte("created_at", monthStart.toISOString())
    .lte("created_at", monthEnd.toISOString());

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data: orders, error } = await query;

  if (error) {
    console.error("Error loading sales data:", error);
    return getDefaultContext();
  }

  const currentRevenue = orders?.reduce((sum, o) => sum + (o.order_total || 0), 0) || 0;
  const orderCount = orders?.length || 0;

  // Today's revenue
  const todayOrders = orders?.filter(o => new Date(o.created_at) >= todayStart) || [];
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.order_total || 0), 0);

  const daysInMonth = monthEnd.getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = daysInMonth - daysElapsed;
  
  const remainingTarget = MONTHLY_TARGET - currentRevenue;
  const dailyPaceRequired = daysRemaining > 0 ? remainingTarget / daysRemaining : 0;
  const percentComplete = (currentRevenue / MONTHLY_TARGET) * 100;

  // Calculate status
  const expectedPercent = (daysElapsed / daysInMonth) * 100;
  const progressDiff = percentComplete - expectedPercent;

  let status: SalesGoalContext["status"];
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

  const gapAmount = MONTHLY_TARGET - currentRevenue;

  // Generate contextual suggestions based on status
  const suggestions = generateSuggestions(status, gapAmount, dailyPaceRequired, daysRemaining);

  return {
    monthlyTarget: MONTHLY_TARGET,
    dailyTarget: DAILY_TARGET,
    currentRevenue,
    todayRevenue,
    percentComplete,
    daysRemaining,
    daysElapsed,
    dailyPaceRequired,
    status,
    orderCount,
    gapAmount,
    suggestions,
  };
}

function generateSuggestions(
  status: string,
  gapAmount: number,
  dailyPaceRequired: number,
  daysRemaining: number
): string[] {
  const suggestions: string[] = [];

  if (status === "CRITICAL" || status === "BEHIND") {
    suggestions.push(
      `Send a promotional email highlighting current deals - potential to recover $${Math.round(gapAmount * 0.1).toLocaleString()}`,
      `Follow up on pending quotes from the last 30 days`,
      `Create urgency with limited-time pricing on 3M materials (now $5.27/sqft)`,
      `Post Instagram stories about current promotions`,
      `Reach out to past customers who haven't ordered in 90+ days`
    );

    if (dailyPaceRequired > DAILY_TARGET * 2) {
      suggestions.push(
        `Consider a flash sale to generate immediate revenue`,
        `Contact fleet accounts for bulk order opportunities`
      );
    }
  } else if (status === "ON_TRACK") {
    suggestions.push(
      `Maintain momentum with consistent social media posts`,
      `Focus on upselling design services to current quotes`,
      `Prepare end-of-month push content`
    );
  } else {
    suggestions.push(
      `Excellent pace! Consider premium upsells`,
      `Document success stories for testimonials`,
      `Plan for next month's growth targets`
    );
  }

  return suggestions;
}

function getDefaultContext(): SalesGoalContext {
  return {
    monthlyTarget: MONTHLY_TARGET,
    dailyTarget: DAILY_TARGET,
    currentRevenue: 0,
    todayRevenue: 0,
    percentComplete: 0,
    daysRemaining: 30,
    daysElapsed: 1,
    dailyPaceRequired: MONTHLY_TARGET / 30,
    status: "ON_TRACK",
    orderCount: 0,
    gapAmount: MONTHLY_TARGET,
    suggestions: [],
  };
}

// Format sales context for AI system prompt
export function formatSalesContextForPrompt(context: SalesGoalContext): string {
  return `
SALES GOAL CONTEXT:
- Monthly Target: $${context.monthlyTarget.toLocaleString()}
- Current Revenue: $${context.currentRevenue.toLocaleString()} (${context.percentComplete.toFixed(1)}%)
- Today's Revenue: $${context.todayRevenue.toLocaleString()}
- Days Remaining: ${context.daysRemaining}
- Daily Pace Required: $${Math.round(context.dailyPaceRequired).toLocaleString()}/day
- Status: ${context.status}
- Gap to Goal: $${context.gapAmount.toLocaleString()}
- Orders This Month: ${context.orderCount}

${context.status === "BEHIND" || context.status === "CRITICAL" ? `
⚠️ WE ARE BEHIND ON SALES GOALS. When appropriate:
${context.suggestions.map(s => `- ${s}`).join('\n')}
` : ''}
`.trim();
}