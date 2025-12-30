// Ops Desk Router - Central Execution Gateway
// This is a UTILITY module (not a serve() edge function)
// Ops Desk is the ONLY agent allowed to execute actions

import { WPW_CONSTITUTION } from "./wpw-constitution.ts";

// Use 'any' for Supabase client to avoid type conflicts across edge functions
// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

export type OpsDeskAction = "create_task" | "correct_action" | "escalate";

export type RevenueImpact = "high" | "medium" | "low";

export interface OpsDeskRequest {
  action: OpsDeskAction;
  requested_by: string; // "Trish Dill" | "Jackson Obregon" | agent_id
  target: string; // agent or human to assign to
  context: {
    description: string;
    due_date?: string;
    revenue_impact?: RevenueImpact;
    customer?: string;
    notes?: string;
    conversation_id?: string;
    quote_id?: string;
  };
}

export interface OpsDeskResult {
  success: boolean;
  action: OpsDeskAction;
  assigned_to?: string;
  revenue_impact?: RevenueImpact;
  task_id?: string;
  error?: string;
}

// Authorized requesters - these are the only entities that can route through Ops Desk
const ALLOWED_REQUESTERS = [
  // Human orchestrators
  "Trish Dill",
  "Jackson Obregon",
  // Channel-bound agents
  "jordan_lee",
  "alex_morgan", 
  "grant_miller",
  "casey_ramirez",
  // Role-bound agents
  "taylor_brooks",
  "evan_porter",
];

/**
 * Route execution through Ops Desk
 * This is the ONLY way actions get executed in the system
 * Ops Desk NEVER makes decisions - it only executes what it's told
 */
export async function routeToOpsDesk(
  supabase: SupabaseClient,
  request: OpsDeskRequest
): Promise<OpsDeskResult> {
  
  // 🔒 AUTHORITY CHECK
  if (!ALLOWED_REQUESTERS.includes(request.requested_by)) {
    console.error(`[OpsDeskRouter] Unauthorized requester: ${request.requested_by}`);
    return {
      success: false,
      action: request.action,
      error: `Unauthorized requester: ${request.requested_by}`,
    };
  }
  
  console.log(`[OpsDeskRouter] Processing ${request.action} from ${request.requested_by} → ${request.target}`);
  
  // Default revenue impact to medium if not specified
  const revenueImpact = request.context.revenue_impact ?? "medium";
  
  try {
    // ============================================
    // CREATE TASK - Main execution path
    // ============================================
    if (request.action === "create_task") {
      const taskData = {
        title: request.context.description,
        description: request.context.notes || request.context.description,
        assigned_agent: request.target,
        due_date: request.context.due_date || null,
        revenue_impact: revenueImpact,
        customer: request.context.customer || null,
        notes: request.context.notes || null,
        status: "pending",
        created_by: request.requested_by,
        conversation_id: request.context.conversation_id || null,
        quote_id: request.context.quote_id || null,
        created_at: new Date().toISOString(),
      };
      
      const { data: taskResult, error } = await supabase
        .from("tasks")
        .insert(taskData)
        .select("id")
        .single();
      
      if (error) {
        console.error(`[OpsDeskRouter] Task creation failed:`, error);
        return {
          success: false,
          action: "create_task",
          error: String(error),
        };
      }
      
      console.log(`[OpsDeskRouter] Task created for ${request.target}, revenue_impact: ${revenueImpact}, task_id: ${taskResult?.id}`);
      return {
        success: true,
        action: "create_task",
        assigned_to: request.target,
        revenue_impact: revenueImpact,
        task_id: taskResult?.id,
      };
    }
    
    // ============================================
    // CORRECT ACTION - Log corrections
    // ============================================
    if (request.action === "correct_action") {
      const correctionData = {
        description: request.context.description,
        corrected_by: request.requested_by,
        target: request.target,
        customer: request.context.customer || null,
        notes: request.context.notes || null,
        created_at: new Date().toISOString(),
      };
      
      const { error } = await supabase.from("ops_corrections").insert(correctionData);
      
      if (error) {
        console.error(`[OpsDeskRouter] Correction logging failed:`, error);
        return {
          success: false,
          action: "correct_action",
          error: String(error),
        };
      }
      
      console.log(`[OpsDeskRouter] Correction logged: ${request.context.description}`);
      return {
        success: true,
        action: "correct_action",
      };
    }
    
    // ============================================
    // ESCALATE - Route to leadership
    // ============================================
    if (request.action === "escalate") {
      const escalationTargets = [
        WPW_CONSTITUTION.authority.operations.name,
        WPW_CONSTITUTION.authority.founder.name,
      ];
      
      const escalationData = {
        description: request.context.description,
        escalated_by: request.requested_by,
        escalation_targets: escalationTargets,
        customer: request.context.customer || null,
        notes: request.context.notes || null,
        created_at: new Date().toISOString(),
      };
      
      const { error } = await supabase.from("ops_escalations").insert(escalationData);
      
      if (error) {
        console.error(`[OpsDeskRouter] Escalation failed:`, error);
        return {
          success: false,
          action: "escalate",
          error: String(error),
        };
      }
      
      console.log(`[OpsDeskRouter] Escalated to: ${escalationTargets.join(", ")}`);
      return {
        success: true,
        action: "escalate",
      };
    }
    
    return {
      success: false,
      action: request.action,
      error: "Unknown action type",
    };
    
  } catch (err) {
    console.error(`[OpsDeskRouter] Unexpected error:`, err);
    return {
      success: false,
      action: request.action,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Calculate revenue priority based on context
 * Used to assign HIGH/MEDIUM/LOW to tasks
 */
export function calculateRevenuePriority(context: {
  orderValue?: number;
  isCommercial?: boolean;
  isRepeatShop?: boolean;
  sqft?: number;
  isPartnership?: boolean;
}): RevenueImpact {
  // Commercial accounts are always high priority
  if (context.isCommercial) return "high";
  
  // Repeat shops are high value
  if (context.isRepeatShop) return "high";
  
  // Partnerships are high priority
  if (context.isPartnership) return "high";
  
  // Large square footage jobs are high value
  if (context.sqft && context.sqft > 100) return "high";
  
  // High order value
  if (context.orderValue && context.orderValue > 2000) return "high";
  
  // Medium order value
  if (context.orderValue && context.orderValue > 500) return "medium";
  
  return "medium";
}
