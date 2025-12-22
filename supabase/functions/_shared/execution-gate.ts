// =============================================================================
// EXECUTION GATE - Intent Validation & Scope Enforcement
// =============================================================================
// CORE PRINCIPLE: Conversation ≠ Execution
// Agents prepare, Executors execute. This gate enforces that rule.

import { getAgent, canExecute, isExecutor, ExecutionScope } from "./agent-config.ts";

// =============================================================================
// INTENT TYPES
// =============================================================================

export type IntentType = 
  | "QUOTE_READY"      // Channel agent signals quote is ready
  | "EXECUTE_QUOTE"    // Executor processes quote
  | "CONTENT_READY"    // Content agent signals draft is ready
  | "EXECUTE_CONTENT"  // Executor publishes content
  | "TASK_READY"       // Task routing
  | "ESCALATION";      // Escalation signal

export interface ExecutionIntent {
  intent: IntentType;
  confidence: number; // 0.0 - 1.0
  source_agent: string;
  data: Record<string, unknown>;
  verified?: boolean;
  timestamp?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized_data?: Record<string, unknown>;
}

// =============================================================================
// SALES-FIRST EMAIL CAPTURE RULES
// =============================================================================

export const EMAIL_CAPTURE_RULES = {
  // When to ask for email (AFTER these conditions)
  triggers: [
    "customer_asks_for_quote",
    "customer_asks_for_pricing", 
    "customer_asks_for_design_help",
    "customer_says_send_it",
    "customer_shows_buying_intent", // "that works", "I want that", "let's do it"
  ],
  
  // NEVER ask for email if:
  never_ask: [
    "first_message",
    "before_value_established",
    "before_engagement",
  ],
  
  // Approved phrasing
  approved_phrases: {
    chat: "I can put this together for you — what's the best email to send it to?",
    dm: "I'll get this ready for you. Also, quick heads up — we sometimes drop coupon codes and free design packs. What's the best email to send those to?",
    after_quote: "Want me to send you a detailed quote? What's your email?",
  },
  
  // NEVER SAY these
  forbidden_phrases: [
    "join our newsletter",
    "sign up for updates",
    "marketing emails",
    "weekly promos",
    "subscribe",
  ],
} as const;

// =============================================================================
// INTENT VALIDATION
// =============================================================================

/**
 * Validate an intent payload before execution
 * Returns detailed errors if invalid
 */
export function validateIntent(intent: ExecutionIntent): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check source agent exists
  const agent = getAgent(intent.source_agent);
  if (!agent) {
    errors.push(`Unknown source agent: ${intent.source_agent}`);
    return { valid: false, errors, warnings };
  }
  
  // Check confidence threshold
  if (intent.confidence < 0.7) {
    warnings.push(`Low confidence: ${intent.confidence}. Consider requesting clarification.`);
  }
  
  // QUOTE intents require specific fields
  if (intent.intent === "QUOTE_READY" || intent.intent === "EXECUTE_QUOTE") {
    const data = intent.data;
    
    if (!data.contact || !(data.contact as Record<string, unknown>).email) {
      errors.push("Missing customer email - required for quote");
    }
    
    if (!data.vehicle || !(data.vehicle as Record<string, unknown>).make) {
      errors.push("Missing vehicle make - required for quote");
    }
    
    if (!data.vehicle || !(data.vehicle as Record<string, unknown>).model) {
      errors.push("Missing vehicle model - required for quote");
    }
    
    if (!data.sqft || (data.sqft as number) <= 0) {
      errors.push("Invalid SQFT - must be positive number");
    }
    
    // Validate email format
    const email = (data.contact as Record<string, unknown>)?.email as string;
    if (email && !isValidEmail(email)) {
      errors.push(`Invalid email format: ${email}`);
    }
  }
  
  // CONTENT intents require artifact info
  if (intent.intent === "CONTENT_READY" || intent.intent === "EXECUTE_CONTENT") {
    if (!intent.data.artifact_type) {
      errors.push("Missing artifact_type for content intent");
    }
    if (!intent.data.channel) {
      errors.push("Missing channel for content intent");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized_data: intent.data, // Could add sanitization here
  };
}

/**
 * Check if an agent can create an execution intent
 * Channel agents can create QUOTE_READY but NOT EXECUTE_QUOTE
 */
export function canCreateIntent(agentId: string, intentType: IntentType): boolean {
  const agent = getAgent(agentId);
  if (!agent) return false;
  
  // READY intents can be created by any agent
  if (intentType.endsWith("_READY")) {
    return true;
  }
  
  // EXECUTE intents require executor scope
  if (intentType.startsWith("EXECUTE_")) {
    const scope = intentType.replace("EXECUTE_", "").toLowerCase() as ExecutionScope;
    return canExecute(agentId, scope);
  }
  
  // Task and escalation intents are always allowed
  if (intentType === "TASK_READY" || intentType === "ESCALATION") {
    return true;
  }
  
  return false;
}

/**
 * Enforce execution gate - returns true if action should proceed
 * If agent lacks authority, action is converted to intent_pending
 */
export function enforceExecutionGate(
  agentId: string, 
  actionType: string
): { proceed: boolean; convert_to_pending: boolean; reason?: string } {
  
  // Map action types to execution scopes
  const actionToScope: Record<string, ExecutionScope> = {
    "create_quote": "quote",
    "send_quote": "quote",
    "execute_quote": "quote",
    "approve_quote": "quote",
    "create_order": "order",
    "publish_content": "content",
    "post_content": "content",
  };
  
  const requiredScope = actionToScope[actionType];
  
  // If action doesn't require execution scope, allow it
  if (!requiredScope) {
    return { proceed: true, convert_to_pending: false };
  }
  
  // Check if agent can execute this scope
  if (canExecute(agentId, requiredScope)) {
    return { proceed: true, convert_to_pending: false };
  }
  
  // Agent lacks authority - convert to pending
  return {
    proceed: false,
    convert_to_pending: true,
    reason: `Agent ${agentId} lacks ${requiredScope} execution authority. Routing to executor.`,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Create a properly structured intent from agent output
 */
export function createIntent(
  agentId: string,
  intentType: IntentType,
  data: Record<string, unknown>,
  confidence: number = 0.85
): ExecutionIntent {
  return {
    intent: intentType,
    confidence,
    source_agent: agentId,
    data,
    verified: false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Route intent to appropriate executor
 */
export function getExecutorForIntent(intent: ExecutionIntent): string | null {
  if (intent.intent === "QUOTE_READY" || intent.intent === "EXECUTE_QUOTE") {
    return "ops_desk";
  }
  if (intent.intent === "CONTENT_READY" || intent.intent === "EXECUTE_CONTENT") {
    return null; // Future: content executor
  }
  return null;
}
