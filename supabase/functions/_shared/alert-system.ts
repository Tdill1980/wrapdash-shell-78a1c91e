// Unified Alert System for Jordan Lee Agent
// Email first, then Ops Desk task, then log to agent_alerts table

import { Resend } from "https://cdn.jsdelivr.net/npm/resend@2/+esm";
import { routeToOpsDesk } from "./ops-desk-router.ts";

// Use any type for SupabaseClient to avoid esm.sh CDN issues
type SupabaseClientType = any;

export type AlertType = 
  | "missing_tracking" 
  | "unhappy_customer" 
  | "bulk_inquiry" 
  | "bulk_inquiry_with_email"
  | "quality_issue" 
  | "design_file";

// Bulk discount tiers (from uploaded pricing chart)
export const BULK_DISCOUNT_TIERS = {
  "500-999": { discount: "5%", code: "BULK5" },
  "1000-1499": { discount: "10%", code: "BULK10" },
  "1500-2499": { discount: "15%", code: "BULK15" },
  "2500+": { discount: "20%", code: "BULK20" },
};

// Format bulk discount tiers for chat response
export function formatBulkDiscountTiers(): string {
  return `📦 **Bulk Discount Tiers:**
• 500-999 sqft: 5% off
• 1,000-1,499 sqft: 10% off  
• 1,500-2,499 sqft: 15% off
• 2,500+ sqft: 20% off`;
}

export interface AlertRecipients {
  to: string[];
  cc?: string[];
}

export interface AlertContext {
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  conversationId?: string;
  messageExcerpt?: string;
  productType?: string;
  status?: string;
  additionalInfo?: Record<string, unknown>;
}

interface AlertResult {
  success: boolean;
  emailSent: boolean;
  taskCreated: boolean;
  alertId?: string;
  error?: string;
}

// Unhappy customer detection patterns
export const UNHAPPY_CUSTOMER_PATTERNS = /\b(unhappy|frustrated|angry|upset|complaint|refund|terrible|horrible|worst|disappointed|ridiculous|unacceptable|lawyer|attorney|bbb|better business bureau|bad review|1 star|sue|scam|ripped off|never again|waste of money|demand|furious|outraged|disgusted|fed up)\b/i;

// Bulk/commercial inquiry patterns
export const BULK_INQUIRY_PATTERNS = /\b(fleet|bulk|wholesale|commercial|multiple|business|company|franchise|dealer|dealership|car lot|10\+|20\+|50\+|100\+|quantity discount)\b/i;

// Quality issue patterns - EXPANDED to catch more issues
export const QUALITY_ISSUE_PATTERNS = /\b(quality|defect|wrong|mistake|error|reprint|redo|color.*(wrong|off|different)|damaged|torn|ripped|bubbl|peel|fade|roller|mark|line|stripe|band|banding|streak|artifact|scratch|smear|smudge|flaw|imperfection|misprinted|misaligned|crooked|problem.*(order|wrap|print)|issue.*(order|wrap|print)|not right|looks off|visible)\b/i;

// Alert configuration matrix
const ALERT_CONFIG: Record<AlertType, {
  opsTarget: string;
  priority: "high" | "medium" | "low";
  recipients: AlertRecipients;
  subjectPrefix: string;
}> = {
  missing_tracking: {
    opsTarget: "ops_desk",
    priority: "high",
    recipients: {
      to: ["Lance@WePrintWraps.com", "Jackson@WePrintWraps.com"],
      cc: ["Trish@WePrintWraps.com"],
    },
    subjectPrefix: "⚠️ Missing Tracking",
  },
  unhappy_customer: {
    opsTarget: "ops_desk",
    priority: "high",
    recipients: {
      to: ["Jackson@WePrintWraps.com", "Lance@WePrintWraps.com"],
      cc: ["Trish@WePrintWraps.com"],
    },
    subjectPrefix: "🚨 Unhappy Customer",
  },
  bulk_inquiry: {
    opsTarget: "jackson",
    priority: "high",
    recipients: {
      to: ["Jackson@WePrintWraps.com"],
      cc: ["Trish@WePrintWraps.com"],
    },
    subjectPrefix: "🚀 Bulk/Fleet Inquiry",
  },
  bulk_inquiry_with_email: {
    opsTarget: "jackson",
    priority: "high",
    recipients: {
      to: ["Jackson@WePrintWraps.com"],
    },
    subjectPrefix: "🚀 Bulk Order - Coupon Code Needed",
  },
  quality_issue: {
    opsTarget: "lance",
    priority: "high",
    recipients: {
      to: ["Lance@WePrintWraps.com"],
      cc: ["Trish@WePrintWraps.com"],
    },
    subjectPrefix: "⚙️ Quality Issue",
  },
  design_file: {
    opsTarget: "grant_miller",
    priority: "medium",
    recipients: {
      to: ["DesignTeam@WePrintWraps.com"],
      cc: ["Trish@WePrintWraps.com"],
    },
    subjectPrefix: "🎨 Design/File Issue",
  },
};

function getAlertEmailHtml(alertType: AlertType, context: AlertContext): string {
  const baseInfo = `
    <hr>
    ${context.orderNumber ? `<p><strong>Order #:</strong> ${context.orderNumber}</p>` : ""}
    ${context.customerName ? `<p><strong>Customer:</strong> ${context.customerName}</p>` : ""}
    ${context.customerEmail ? `<p><strong>Email:</strong> ${context.customerEmail}</p>` : ""}
    ${context.productType ? `<p><strong>Product:</strong> ${context.productType}</p>` : ""}
    ${context.status ? `<p><strong>Status:</strong> ${context.status}</p>` : ""}
    <hr>
  `;

  switch (alertType) {
    case "missing_tracking":
      return `
        <h2>🚨 Missing Tracking Number Alert</h2>
        <p><strong>A customer is asking about tracking for an order that shows shipped but has no tracking number in the system.</strong></p>
        ${baseInfo}
        <p><strong>Action Needed:</strong> Please add the tracking number to ShopFlow so Jordan can provide accurate info to the customer.</p>
        <p><em>This alert was triggered by Jordan Lee (AI Chat Agent) when the customer asked for tracking info.</em></p>
      `;
    case "unhappy_customer":
      return `
        <h2>🚨 Unhappy Customer Alert</h2>
        <p><strong>A customer is expressing frustration or dissatisfaction in the chat.</strong></p>
        ${baseInfo}
        ${context.messageExcerpt ? `<p><strong>Customer Message:</strong> "${context.messageExcerpt}"</p>` : ""}
        <p><strong>Action Needed:</strong> Please reach out to the customer directly to address their concerns.</p>
        <p><em>This alert was triggered by Jordan Lee detecting frustration signals in the conversation.</em></p>
      `;
    case "bulk_inquiry":
      return `
        <h2>🚀 Bulk/Fleet Inquiry</h2>
        <p><strong>A potential commercial or bulk customer is inquiring about large orders.</strong></p>
        ${baseInfo}
        ${context.messageExcerpt ? `<p><strong>Customer Message:</strong> "${context.messageExcerpt}"</p>` : ""}
        <p><strong>Action Needed:</strong> Follow up with this lead for potential bulk/fleet pricing.</p>
        <p><em>This alert was triggered by Jordan Lee detecting commercial intent signals.</em></p>
      `;
    case "bulk_inquiry_with_email":
      return `
        <h2>🚀 Bulk Order - Coupon Code Needed</h2>
        <p><strong>Customer is ready for bulk pricing and has provided their email.</strong></p>
        ${baseInfo}
        ${context.additionalInfo?.estimatedQuantity ? `<p><strong>Estimated Quantity:</strong> ${context.additionalInfo.estimatedQuantity}</p>` : ""}
        ${context.additionalInfo?.suggestedTier ? `<p><strong>Suggested Tier:</strong> ${context.additionalInfo.suggestedTier}</p>` : ""}
        ${context.messageExcerpt ? `<p><strong>Conversation Summary:</strong> "${context.messageExcerpt}"</p>` : ""}
        <hr>
        <p><strong>⚡ ACTION NEEDED:</strong> Send this customer the appropriate bulk discount coupon code.</p>
        <p><strong>Discount Tiers Reference:</strong></p>
        <ul>
          <li>500-999 sqft: 5% (code: BULK5)</li>
          <li>1,000-1,499 sqft: 10% (code: BULK10)</li>
          <li>1,500-2,499 sqft: 15% (code: BULK15)</li>
          <li>2,500+ sqft: 20% (code: BULK20)</li>
        </ul>
        <p><em>This alert was triggered by Jordan Lee detecting commercial intent signals.</em></p>
      `;
    case "quality_issue":
      return `
        <h2>⚙️ Quality Issue Reported</h2>
        <p><strong>A customer is reporting a quality issue with their order.</strong></p>
        ${baseInfo}
        ${context.messageExcerpt ? `<p><strong>Customer Message:</strong> "${context.messageExcerpt}"</p>` : ""}
        <p><strong>Action Needed:</strong> Review the issue and coordinate reprint/resolution if needed.</p>
        <p><em>This alert was triggered by Jordan Lee detecting quality-related keywords.</em></p>
      `;
    case "design_file":
      return `
        <h2>🎨 Design/File Issue</h2>
        <p><strong>A customer has questions about design files or needs design assistance.</strong></p>
        ${baseInfo}
        ${context.messageExcerpt ? `<p><strong>Customer Message:</strong> "${context.messageExcerpt}"</p>` : ""}
        <p><strong>Action Needed:</strong> Review and assist with design/file requirements.</p>
        <p><em>This alert was triggered by Jordan Lee detecting design-related questions.</em></p>
      `;
    default:
      return `
        <h2>Alert from Jordan Lee</h2>
        ${baseInfo}
        ${context.messageExcerpt ? `<p><strong>Message:</strong> "${context.messageExcerpt}"</p>` : ""}
      `;
  }
}

export async function sendAlertWithTracking(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  resendKey: string | undefined,
  alertType: AlertType,
  context: AlertContext,
  organizationId?: string
): Promise<AlertResult> {
  const config = ALERT_CONFIG[alertType];
  
  console.log(`[JordanAlert] Sending ${alertType} alert`, {
    orderNumber: context.orderNumber,
    customer: context.customerName,
  });

  let emailSent = false;
  let taskCreated = false;
  let taskId: string | undefined;
  let alertId: string | undefined;

  // STEP 1: Send email FIRST (most urgent)
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      
      const subject = context.orderNumber
        ? `${config.subjectPrefix}: Order #${context.orderNumber}`
        : `${config.subjectPrefix} - Website Chat`;

      await resend.emails.send({
        from: "ShopFlow Alert <alerts@weprintwraps.com>",
        to: config.recipients.to,
        cc: config.recipients.cc,
        subject,
        html: getAlertEmailHtml(alertType, context),
      });

      emailSent = true;
      console.log(`[JordanAlert] Email sent to ${config.recipients.to.join(", ")}`);
    } catch (emailError) {
      console.error("[JordanAlert] Failed to send email:", emailError);
    }
  } else {
    console.warn("[JordanAlert] No RESEND_API_KEY, skipping email");
  }

  // STEP 2: Create Ops Desk task
  try {
    const taskDescription = context.orderNumber
      ? `${alertType.toUpperCase()}: Order #${context.orderNumber} - ${context.customerName || "Customer"}`
      : `${alertType.toUpperCase()}: ${context.messageExcerpt?.substring(0, 50) || "Website inquiry"}`;

    const taskResult = await routeToOpsDesk(supabase, {
      action: "create_task",
      requested_by: "jordan_lee",
      target: config.opsTarget,
      context: {
        description: taskDescription,
        revenue_impact: config.priority === "high" ? "high" : "medium",
        customer: context.customerName || "Website Visitor",
        notes: context.messageExcerpt || "",
        conversation_id: context.conversationId,
      },
    });

    if (taskResult.success && taskResult.task_id) {
      taskCreated = true;
      taskId = taskResult.task_id;
      console.log(`[JordanAlert] Ops Desk task created: ${taskId}`);
    }
  } catch (taskError) {
    console.error("[JordanAlert] Failed to create Ops Desk task:", taskError);
  }

  // STEP 3: Log to agent_alerts table
  try {
    const { data: alertData, error: alertError } = await supabase
      .from("agent_alerts")
      .insert({
        organization_id: organizationId || null,
        agent_id: "jordan_lee",
        alert_type: alertType,
        order_id: context.orderId || null,
        order_number: context.orderNumber || null,
        customer_name: context.customerName || null,
        customer_email: context.customerEmail || null,
        conversation_id: context.conversationId || null,
        message_excerpt: context.messageExcerpt?.substring(0, 500) || null,
        email_sent_to: emailSent ? config.recipients.to : null,
        email_sent_at: emailSent ? new Date().toISOString() : null,
        task_id: taskId || null,
        task_status: "pending",
        priority: config.priority,
        metadata: context.additionalInfo || {},
      })
      .select("id")
      .single();

    if (!alertError && alertData) {
      alertId = alertData.id;
      console.log(`[JordanAlert] Alert logged: ${alertId}`);
    } else if (alertError) {
      console.error("[JordanAlert] Failed to log alert:", alertError);
    }
  } catch (logError) {
    console.error("[JordanAlert] Failed to log alert:", logError);
  }

  // STEP 4: Also log to shopflow_logs for audit trail
  try {
    await supabase.from("shopflow_logs").insert({
      order_id: null,
      action: `jordan_alert_${alertType}`,
      details: `Alert: ${alertType} | Customer: ${context.customerName || "Unknown"} | Order: ${context.orderNumber || "N/A"} | Email sent: ${emailSent} | Task created: ${taskCreated}`,
      performed_by: "jordan_lee",
    });
  } catch {
    // Ignore shopflow_logs errors
  }

  return {
    success: emailSent || taskCreated,
    emailSent,
    taskCreated,
    alertId,
  };
}

// Helper to detect alert type from message
export function detectAlertType(message: string): AlertType | null {
  if (UNHAPPY_CUSTOMER_PATTERNS.test(message)) {
    return "unhappy_customer";
  }
  if (BULK_INQUIRY_PATTERNS.test(message)) {
    return "bulk_inquiry";
  }
  if (QUALITY_ISSUE_PATTERNS.test(message)) {
    return "quality_issue";
  }
  return null;
}
