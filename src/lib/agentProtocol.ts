/**
 * Agent Response Protocol
 * Defines the three modes agents can respond with:
 * - question: Agent needs clarification
 * - plan: Agent proposes a plan for approval
 * - execute: Agent is ready to execute a tool
 */

export type AgentResponse =
  | { type: "question"; message: string }
  | { type: "plan"; steps: string[] }
  | { type: "execute"; tool: string; payload: Record<string, unknown> };

/**
 * Parse raw agent output into structured AgentResponse
 * Fail-safe: returns question mode if parsing fails
 */
export function parseAgentResponse(raw: string): AgentResponse {
  // Try to extract JSON from the response
  try {
    // First try direct JSON parse
    const obj = JSON.parse(raw);
    return validateAgentResponse(obj);
  } catch {
    // Try to find JSON object in the response
    const jsonMatch = raw.match(/\{[\s\S]*?"type"\s*:\s*"(question|plan|execute)"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const obj = JSON.parse(jsonMatch[0]);
        return validateAgentResponse(obj);
      } catch {
        // Fall through to detection
      }
    }
  }

  // If no valid JSON, detect mode from content
  return detectResponseMode(raw);
}

/**
 * Validate and normalize an agent response object
 */
function validateAgentResponse(obj: unknown): AgentResponse {
  if (!obj || typeof obj !== "object") {
    return { type: "question", message: "I need a bit more info. What exactly should I create?" };
  }

  const response = obj as Record<string, unknown>;

  if (response.type === "question" && typeof response.message === "string") {
    return { type: "question", message: response.message };
  }

  if (response.type === "plan" && Array.isArray(response.steps)) {
    const steps = response.steps.filter((s): s is string => typeof s === "string");
    return { type: "plan", steps };
  }

  if (response.type === "execute" && typeof response.tool === "string") {
    return { 
      type: "execute", 
      tool: response.tool, 
      payload: (response.payload as Record<string, unknown>) ?? {} 
    };
  }

  return { type: "question", message: "I can help with that — what platform and content type?" };
}

/**
 * Detect response mode from natural language content
 * Used as fallback when agent doesn't return structured JSON
 */
export function detectResponseMode(message: string): AgentResponse {
  const lowerMessage = message.toLowerCase();
  
  // EXECUTE mode: Has CREATE_CONTENT block
  if (message.includes("===CREATE_CONTENT===")) {
    // Extract the content block and convert to payload
    const match = message.match(/===CREATE_CONTENT===([\s\S]*?)===END_CREATE_CONTENT===/);
    if (match) {
      return { 
        type: "execute", 
        tool: "create_content", 
        payload: { raw_block: match[1].trim() } 
      };
    }
  }
  
  // QUESTION mode: Ends with question or asks for clarification
  const questionPatterns = [
    "before i proceed",
    "can you confirm",
    "i need to know",
    "could you clarify",
    "what should i",
    "which would you prefer",
    "do you want me to",
    "should i use",
    "is this for"
  ];
  
  if (questionPatterns.some(p => lowerMessage.includes(p)) || message.trim().endsWith("?")) {
    return { type: "question", message };
  }
  
  // PLAN mode: Has confirmation/ready pattern
  const planPatterns = [
    "ready when you say go",
    "i understand. i will",
    "here's my plan",
    "i'll create",
    "i will create"
  ];
  
  if (planPatterns.some(p => lowerMessage.includes(p))) {
    // Extract steps if present
    const lines = message.split('\n').filter(l => l.trim().match(/^[\d\-\*]\.?\s/));
    if (lines.length > 0) {
      return { type: "plan", steps: lines.map(l => l.replace(/^[\d\-\*]\.?\s*/, '').trim()) };
    }
    return { type: "plan", steps: [message.trim()] };
  }
  
  // Default: treat as question if unclear
  return { type: "question", message };
}

/**
 * Check if response indicates agent is ready to execute
 */
export function isReadyToExecute(response: AgentResponse): boolean {
  return response.type === "execute";
}

/**
 * Check if response needs user input
 */
export function needsUserInput(response: AgentResponse): boolean {
  return response.type === "question" || response.type === "plan";
}
