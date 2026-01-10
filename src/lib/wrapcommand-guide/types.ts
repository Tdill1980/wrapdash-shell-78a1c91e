/**
 * WrapCommand Guide Component Registry Types
 * 
 * This is OS kernel metadata - the single source of truth for what each component
 * is, what it can do, and what it is NOT allowed to do.
 */

export type ComponentSurface = "chat" | "filter" | "object" | "system";

export type OwningObject = "conversation" | "quote" | "issue" | null;

export type WiredStatus = "wired" | "partial" | "broken";

export type ActionType =
  | "send_message"
  | "create_quote"
  | "send_quote_email"
  | "upload_file"
  | "request_call"
  | "resolve_escalation"
  | "open_chat"
  | "report_issue"
  | "view"
  | "send_email"
  | "reply_to_customer"
  | "chat"
  | "quote"
  | "create_issue";

export interface VisibilityCondition {
  mode?: string[];
  stage?: string[];
  requires_auth?: boolean;
  requires_object?: boolean;
}

export interface ComponentRegistryEntry {
  /** Unique identifier for this component */
  component_id: string;
  
  /** Human-readable name shown to users */
  display_name: string;
  
  /** What type of surface this component represents */
  surface: ComponentSurface;
  
  /** One-sentence explanation of what this component is for */
  purpose: string;
  
  /** Whether this component owns/creates data */
  owns_data: boolean;
  
  /** What object type this component operates on */
  owning_object: OwningObject;
  
  /** Actions this component IS allowed to perform */
  allowed_actions: ActionType[];
  
  /** Actions this component is NEVER allowed to perform */
  forbidden_actions: ActionType[];
  
  /** When this component should be visible/active */
  visible_when: VisibilityCondition;
  
  /** Map of disabled states to human-readable reasons */
  disabled_reason_map?: Record<string, string>;
  
  /** Current implementation status */
  wired_status: WiredStatus;
  
  /** What to tell users when they ask "what is this?" */
  explanation: string;
  
  /** What to tell users when they try forbidden actions */
  redirect_message?: string;
}

export interface ComponentRegistry {
  version: string;
  last_updated: string;
  components: ComponentRegistryEntry[];
}
