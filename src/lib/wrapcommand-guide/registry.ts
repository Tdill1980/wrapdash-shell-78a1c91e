/**
 * WrapCommand Guide Component Registry
 * 
 * THE SINGLE SOURCE OF TRUTH for OS behavior.
 * 
 * Rules:
 * - If it's not in this registry, it doesn't exist in the OS
 * - If an action is forbidden, the system MUST block it
 * - If a component is "partial" or "broken", the Guide Chat must say so honestly
 */

import { ComponentRegistry, ComponentRegistryEntry } from "./types";

export const COMPONENT_REGISTRY: ComponentRegistry = {
  version: "1.0.0",
  last_updated: "2025-01-10",
  components: [
    // ========================================
    // 1️⃣ WRAPCOMMAND AI CHAT (CANONICAL)
    // ========================================
    {
      component_id: "wrapcommand_ai_chat",
      display_name: "WrapCommandAI Chat",
      surface: "chat",
      purpose: "Primary workspace for all customer interactions",
      owns_data: true,
      owning_object: "conversation",
      allowed_actions: [
        "send_message",
        "create_quote",
        "send_quote_email",
        "upload_file",
        "request_call",
        "resolve_escalation",
      ],
      forbidden_actions: [],
      visible_when: {
        requires_auth: true,
        requires_object: true, // needs conversation_id
      },
      disabled_reason_map: {
        no_conversation: "Select a conversation to start chatting",
        blocked_by_guard: "This conversation is blocked. Check the escalation reason.",
        quote_required: "A quote must be created before sending emails",
        missing_customer_email: "Customer email is required for this action",
      },
      wired_status: "wired",
      explanation:
        "This is where ALL customer interactions happen. You can reply to customers, create quotes, send emails, upload files, and request calls. If you're not in this screen, you should not be taking action.",
      redirect_message: undefined, // This IS the canonical workspace
    },

    // ========================================
    // 2️⃣ ESCALATIONS (FILTER ONLY)
    // ========================================
    {
      component_id: "escalations",
      display_name: "Escalations",
      surface: "filter",
      purpose: "Surfaces chats that need attention - NOT a workspace",
      owns_data: false,
      owning_object: "conversation",
      allowed_actions: [
        "open_chat",
        "resolve_escalation",
        "report_issue",
      ],
      forbidden_actions: [
        "send_message",
        "create_quote",
        "send_email",
        "upload_file",
        "request_call",
        "reply_to_customer",
      ],
      visible_when: {
        requires_auth: true,
      },
      disabled_reason_map: {
        action_not_allowed: "This action must be performed in the Chat view. Click 'Open in Chat' first.",
        no_selection: "Select an escalation from the list",
      },
      wired_status: "wired",
      explanation:
        "Escalations are FLAGS, not a second inbox. This screen shows conversations that need attention. Click any row to open it in the canonical Chat view. The only actions allowed here are: Open in Chat, Resolve, and Report Issue.",
      redirect_message:
        "To reply, quote, or take action on this conversation, click 'Open in Chat'. All actions happen in the Chat view.",
    },

    // ========================================
    // 3️⃣ QUOTES
    // ========================================
    {
      component_id: "quotes",
      display_name: "Quotes",
      surface: "object",
      purpose: "Formal pricing records created from conversations",
      owns_data: true,
      owning_object: "quote",
      allowed_actions: [
        "view",
        "send_email",
      ],
      forbidden_actions: [
        "reply_to_customer",
        "chat",
      ],
      visible_when: {
        requires_auth: true,
        mode: ["quote_execution"],
      },
      disabled_reason_map: {
        no_quote_id: "No quote selected. Create a quote from a conversation first.",
        missing_fields: "Quote is incomplete. Fill in all required fields before sending.",
        no_customer_email: "Customer email is required to send this quote.",
        already_sent: "This quote has already been sent.",
        conversation_blocked: "Cannot create quotes while conversation is blocked.",
      },
      wired_status: "partial",
      explanation:
        "Quotes are formal pricing documents. They are CREATED from inside a conversation, not from this screen. Use this tab to VIEW and MANAGE existing quotes. To create a new quote, go to the Chat view and use the quote action.",
      redirect_message:
        "Quotes are created from conversations. Open a chat and use the 'Create Quote' action.",
    },

    // ========================================
    // 4️⃣ REPORT ISSUE WIDGET
    // ========================================
    {
      component_id: "report_issue",
      display_name: "Report Issue",
      surface: "system",
      purpose: "Report problems or request follow-up",
      owns_data: true,
      owning_object: "issue",
      allowed_actions: [
        "create_issue",
        "report_issue",
      ],
      forbidden_actions: [
        "chat",
        "quote",
        "send_message",
        "send_email",
      ],
      visible_when: {
        requires_auth: true,
      },
      disabled_reason_map: {},
      wired_status: "wired",
      explanation:
        "Report Issue is a SYSTEM INTERRUPT, not a conversation. Use it to flag problems, request help, or report something that needs human attention. Issues are tracked separately from customer conversations.",
      redirect_message:
        "This is for reporting issues, not for customer communication. To message a customer, use the Chat view.",
    },

    // ========================================
    // 5️⃣ ANALYTICS
    // ========================================
    {
      component_id: "analytics",
      display_name: "Analytics",
      surface: "system",
      purpose: "Observe system behavior - read only",
      owns_data: false,
      owning_object: null,
      allowed_actions: [
        "view",
      ],
      forbidden_actions: [
        "send_message",
        "create_quote",
        "send_email",
        "upload_file",
        "request_call",
        "reply_to_customer",
        "chat",
        "quote",
        "create_issue",
      ],
      visible_when: {
        requires_auth: true,
      },
      disabled_reason_map: {
        data_stale: "Analytics data may be delayed. Check back in a few minutes.",
        historical_pollution: "Some historical data includes Website Chat from before Guard A was implemented.",
      },
      wired_status: "partial",
      explanation:
        "Analytics are OBSERVERS, never actors. This screen shows system metrics and performance data. You cannot take any actions here - it is purely informational. Historical data may include Website Chat pollution from before the OS cleanup.",
      redirect_message:
        "Analytics is read-only. To take action on a conversation, use the Chat view.",
    },

    // ========================================
    // 6️⃣ ASK ALEX
    // ========================================
    {
      component_id: "ask_alex",
      display_name: "Ask Alex",
      surface: "system",
      purpose: "Explains system state and suggests next actions",
      owns_data: false,
      owning_object: null,
      allowed_actions: [
        "view",
      ],
      forbidden_actions: [
        "send_message",
        "create_quote",
        "send_email",
        "upload_file",
        "request_call",
        "reply_to_customer",
      ],
      visible_when: {
        requires_auth: true,
      },
      disabled_reason_map: {},
      wired_status: "wired",
      explanation:
        "Ask Alex EXPLAINS - humans ACT. Use Ask Alex to understand what's happening in a conversation, get context, or learn what to do next. Ask Alex cannot take actions on your behalf.",
      redirect_message:
        "Ask Alex can explain, but cannot act. To take action, use the Chat view controls.",
    },

    // ========================================
    // 7️⃣ FILE UPLOAD / ANALYSIS
    // ========================================
    {
      component_id: "file_upload",
      display_name: "File Upload",
      surface: "object",
      purpose: "Receive and analyze customer files",
      owns_data: true,
      owning_object: "conversation",
      allowed_actions: [
        "upload_file",
        "view",
      ],
      forbidden_actions: [
        "send_message",
        "create_quote",
        "send_email",
      ],
      visible_when: {
        requires_auth: true,
        requires_object: true, // needs conversation_id
      },
      disabled_reason_map: {
        no_conversation: "Files must be attached to a conversation",
        analysis_pending: "File is being analyzed. Please wait.",
        unsupported_format: "This file format is not supported for analysis",
      },
      wired_status: "broken",
      explanation:
        "File uploads should be conversation-scoped and trigger automatic analysis. Currently this feature is incomplete - uploads may not link correctly to conversations and analysis may not auto-trigger.",
      redirect_message:
        "File uploads are done from within a conversation. Open the Chat view first.",
    },

    // ========================================
    // 8️⃣ WEBSITE CHAT (CUSTOMER-FACING)
    // ========================================
    {
      component_id: "website_chat",
      display_name: "Website Chat",
      surface: "chat",
      purpose: "Customer-facing chat widget on the public website",
      owns_data: true,
      owning_object: "conversation",
      allowed_actions: [
        "send_message",
      ],
      forbidden_actions: [
        "create_quote",
        "send_email",
        "request_call",
        "resolve_escalation",
      ],
      visible_when: {
        mode: ["website"],
      },
      disabled_reason_map: {
        rate_limited: "Please wait before sending another message",
        session_expired: "Your session has expired. Please refresh the page.",
      },
      wired_status: "wired",
      explanation:
        "This is the PUBLIC chat widget customers use on the website. It is separate from the internal WrapCommandAI Chat. Messages from here appear in the staff Chat view for response.",
      redirect_message: undefined,
    },
  ],
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get a component by its ID
 */
export function getComponent(componentId: string): ComponentRegistryEntry | undefined {
  return COMPONENT_REGISTRY.components.find((c) => c.component_id === componentId);
}

/**
 * Check if an action is allowed for a component
 */
export function isActionAllowed(componentId: string, action: string): boolean {
  const component = getComponent(componentId);
  if (!component) return false;
  return component.allowed_actions.includes(action as any);
}

/**
 * Check if an action is forbidden for a component
 */
export function isActionForbidden(componentId: string, action: string): boolean {
  const component = getComponent(componentId);
  if (!component) return false;
  return component.forbidden_actions.includes(action as any);
}

/**
 * Get the redirect message for a component (where to go instead)
 */
export function getRedirectMessage(componentId: string): string | undefined {
  const component = getComponent(componentId);
  return component?.redirect_message;
}

/**
 * Get the explanation for why a button is disabled
 */
export function getDisabledReason(componentId: string, reasonKey: string): string {
  const component = getComponent(componentId);
  if (!component?.disabled_reason_map) {
    return "This action is not available";
  }
  return component.disabled_reason_map[reasonKey] || "This action is not available";
}

/**
 * Get all components of a specific surface type
 */
export function getComponentsBySurface(surface: string): ComponentRegistryEntry[] {
  return COMPONENT_REGISTRY.components.filter((c) => c.surface === surface);
}

/**
 * Get the canonical workspace component
 */
export function getCanonicalWorkspace(): ComponentRegistryEntry | undefined {
  return getComponent("wrapcommand_ai_chat");
}

/**
 * Check if a component is the canonical workspace
 */
export function isCanonicalWorkspace(componentId: string): boolean {
  return componentId === "wrapcommand_ai_chat";
}

/**
 * Get explanation for a component (for Guide Chat)
 */
export function getComponentExplanation(componentId: string): string {
  const component = getComponent(componentId);
  if (!component) {
    return "This component is not recognized in the system registry.";
  }
  return component.explanation;
}
