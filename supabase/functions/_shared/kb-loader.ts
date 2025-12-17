// Knowledge Base Loader - Utility for agents to load relevant KB context
// Combines static KB with database entries for dynamic updates

import {
  WPW_KNOWLEDGE_BASE,
  getKnowledgeForAgent,
  searchKnowledge,
  buildKnowledgeContext,
  type KnowledgeEntry,
} from "./wpw-knowledge-base.ts";

type SupabaseClient = any;

/**
 * Load knowledge context for an agent based on message content
 * Combines static KB entries with any database overrides
 */
export async function loadKnowledgeContext(
  supabase: SupabaseClient,
  agentId: string,
  messageText: string,
  organizationId?: string
): Promise<string> {
  // 1. Get static KB entries for this agent
  const agentKnowledge = getKnowledgeForAgent(agentId);
  
  // 2. Search for keyword-relevant entries
  const searchResults = searchKnowledge(messageText);
  
  // 3. Combine and deduplicate
  const combinedEntries = [...agentKnowledge];
  for (const result of searchResults) {
    if (!combinedEntries.find(e => e.title === result.title)) {
      combinedEntries.push(result);
    }
  }
  
  // 4. Try to load any database overrides/additions
  try {
    const query = supabase
      .from("wpw_knowledge_base")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });
    
    if (organizationId) {
      query.or(`organization_id.is.null,organization_id.eq.${organizationId}`);
    }
    
    // Filter by agent if column exists
    if (agentId) {
      query.contains("applies_to_agents", [agentId]);
    }
    
    const { data: dbEntries } = await query.limit(20);
    
    if (dbEntries && dbEntries.length > 0) {
      // Convert DB entries to KnowledgeEntry format and add
      for (const dbEntry of dbEntries) {
        const converted: KnowledgeEntry = {
          category: dbEntry.category,
          title: dbEntry.title,
          content: dbEntry.content,
          appliesTo: dbEntry.applies_to_agents || [],
          keywords: dbEntry.keywords || [],
          priority: dbEntry.priority || 0,
        };
        
        // DB entries override static entries with same title
        const existingIndex = combinedEntries.findIndex(e => e.title === converted.title);
        if (existingIndex >= 0) {
          combinedEntries[existingIndex] = converted;
        } else {
          combinedEntries.push(converted);
        }
      }
    }
  } catch (error) {
    // DB lookup failed, continue with static KB only
    console.log("KB DB lookup failed, using static KB:", error);
  }
  
  // 5. Sort by priority and limit
  const sortedEntries = combinedEntries
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10); // Limit context size
  
  // 6. Build context string
  return buildKnowledgeContext(sortedEntries);
}

/**
 * Load specific knowledge categories for an agent
 */
export async function loadKnowledgeByCategories(
  supabase: SupabaseClient,
  agentId: string,
  categories: string[],
  organizationId?: string
): Promise<string> {
  const entries: KnowledgeEntry[] = [];
  
  // Get static entries for these categories
  for (const entry of WPW_KNOWLEDGE_BASE) {
    if (
      categories.includes(entry.category) &&
      entry.appliesTo.includes(agentId)
    ) {
      entries.push(entry);
    }
  }
  
  // Try DB lookup
  try {
    const { data: dbEntries } = await supabase
      .from("wpw_knowledge_base")
      .select("*")
      .eq("is_active", true)
      .in("category", categories)
      .contains("applies_to_agents", [agentId])
      .order("priority", { ascending: false })
      .limit(10);
    
    if (dbEntries) {
      for (const dbEntry of dbEntries) {
        const converted: KnowledgeEntry = {
          category: dbEntry.category,
          title: dbEntry.title,
          content: dbEntry.content,
          appliesTo: dbEntry.applies_to_agents || [],
          keywords: dbEntry.keywords || [],
          priority: dbEntry.priority || 0,
        };
        
        const existingIndex = entries.findIndex(e => e.title === converted.title);
        if (existingIndex >= 0) {
          entries[existingIndex] = converted;
        } else {
          entries.push(converted);
        }
      }
    }
  } catch (error) {
    console.log("KB category lookup failed:", error);
  }
  
  return buildKnowledgeContext(
    entries.sort((a, b) => b.priority - a.priority)
  );
}

/**
 * Check if a topic is covered by the KB
 * Returns true if KB has relevant content, false if agent should route to human
 */
export function isTopicCovered(messageText: string): boolean {
  const results = searchKnowledge(messageText);
  return results.length > 0;
}

/**
 * Get the "KB is silent" fallback response
 */
export function getKBSilentResponse(): string {
  return "Let me loop in the right person on our team to help you with that. This was reviewed and handled by our team.";
}
