/**
 * Loads relevant knowledge items based on keywords in the user's message
 * Used for RAG grounding to prevent AI hallucinations
 */
export async function loadKnowledgeContext(
  supabase: any,
  userMessage: string,
  organizationId?: string
): Promise<string> {
  try {
    const messageLower = userMessage.toLowerCase();
    const keywords = messageLower.split(/\s+/).filter(word => word.length > 3);
    
    const { data: items, error } = await supabase
      .from('knowledge_items')
      .select('category, question, answer')
      .eq('is_active', true)
      .limit(10);

    if (error || !items?.length) return '';

    const relevantItems = items.filter((item: any) => {
      const questionLower = item.question?.toLowerCase() || '';
      const answerLower = item.answer.toLowerCase();
      return keywords.some(keyword => questionLower.includes(keyword) || answerLower.includes(keyword));
    });

    if (!relevantItems.length) return '';

    const context = relevantItems.map((item: any) => 
      `[${item.category.toUpperCase()}] Q: ${item.question || 'General'}\nA: ${item.answer}`
    ).join('\n\n');

    return `\n\n--- KNOWLEDGE BASE ---\n${context}\n--- END ---\n`;
  } catch (err) {
    console.error('Knowledge loader error:', err);
    return '';
  }
}

/**
 * Checks if there's an approved correction for the given message
 */
export async function checkCorrections(
  supabase: any,
  userMessage: string,
  organizationId?: string
): Promise<string | null> {
  try {
    const messageLower = userMessage.toLowerCase();

    const { data: corrections, error } = await supabase
      .from('ai_corrections')
      .select('trigger_phrase, approved_response')
      .eq('is_active', true);

    if (error || !corrections?.length) return null;

    for (const correction of corrections) {
      const triggerLower = correction.trigger_phrase.toLowerCase();
      if (messageLower.includes(triggerLower) || 
          triggerLower.split(' ').every((word: string) => messageLower.includes(word))) {
        console.log('Correction match:', correction.trigger_phrase);
        return correction.approved_response;
      }
    }
    return null;
  } catch (err) {
    console.error('Corrections check error:', err);
    return null;
  }
}
