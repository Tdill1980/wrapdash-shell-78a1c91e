// Website Chat Edge Function - Jordan Lee Agent
// Handles website chat via WePrintWraps chat widget
// Routes all execution through Ops Desk
// Now with TradeDNA integration for dynamic brand voice

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadKnowledgeContext, isTopicCovered, getKBSilentResponse } from "../_shared/kb-loader.ts";
import { WPW_TEAM, SILENT_CC, detectEscalation, getEscalationResponse } from "../_shared/wpw-team-config.ts";
import { WPW_CONSTITUTION } from "../_shared/wpw-constitution.ts";
import { AGENTS, formatAgentResponse } from "../_shared/agent-config.ts";
import { routeToOpsDesk, calculateRevenuePriority } from "../_shared/ops-desk-router.ts";
import { loadVoiceProfile, VoiceProfile } from "../_shared/voice-engine-loader.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regex patterns to extract vehicle info - EXPANDED with common models
const VEHICLE_PATTERNS = {
  year: /\b(19|20)\d{2}\b/,
  make: /\b(ford|chevy|chevrolet|dodge|ram|toyota|honda|nissan|gmc|jeep|bmw|audi|mercedes|tesla|volkswagen|vw|subaru|mazda|hyundai|kia|lexus|acura|infiniti|cadillac|buick|lincoln|chrysler|pontiac|saturn|hummer|mini|porsche|jaguar|land\s*rover|volvo|saab|mitsubishi|suzuki|genesis|rivian|lucid|fiat|alfa\s*romeo|maserati|bentley|rolls\s*royce|ferrari|lamborghini|mclaren|aston\s*martin|lotus|scion|isuzu|freightliner|kenworth|peterbilt|international)\b/i,
  model: /\b(f-?150|f-?250|f-?350|silverado|sierra|ram|tacoma|tundra|camry|accord|civic|altima|mustang|camaro|challenger|charger|corvette|wrangler|bronco|explorer|expedition|tahoe|suburban|yukon|escalade|navigator|pilot|highlander|4runner|rav4|crv|cr-v|forester|outback|model\s?[3sxy]|cybertruck|sprinter|transit|promaster|prius|corolla|avalon|sienna|venza|sequoia|supra|gr\s*supra|gr86|86|yaris|matrix|celica|mr2|land\s*cruiser|fj\s*cruiser|fit|hr-v|passport|odyssey|ridgeline|insight|element|s2000|nsx|prelude|del\s*sol|mdx|rdx|tlx|ilx|integra|rsx|legend|rl|tl|tsx|zdx|q50|q60|qx50|qx60|qx80|g35|g37|fx35|fx45|m35|m45|ex35|jx35|sentra|maxima|leaf|versa|kicks|murano|pathfinder|armada|frontier|titan|juke|370z|350z|300zx|240sx|gt-r|gtr|z|elantra|sonata|santa\s*fe|tucson|kona|ioniq|veloster|genesis|azera|accent|venue|palisade|stinger|k5|optima|sorento|carnival|soul|seltos|ev6|forte|rio|niro|sportage|telluride|cx-?[3579]|cx-?30|cx-?50|mazda3|mazda6|miata|mx-?5|rx-?[78]|mazdaspeed|impreza|wrx|sti|legacy|ascent|crosstrek|brz|baja|tribeca|svx|jetta|golf|passat|tiguan|atlas|arteon|id\.?4|beetle|gti|r32|cc|touareg|phaeton|rabbit|3\s*series|5\s*series|7\s*series|x[1-7]|m[2-8]|z4|i[348]|ix|a[3-8]|q[3578]|r8|rs[3-7]|tt|e-?tron|c-?class|e-?class|s-?class|g-?class|gl[abc]|gl[es]|amg|sl|slk|clk|cls|ml|maybach|cayman|boxster|cayenne|macan|panamera|taycan|911|carrera|turbo|gt[234]|f-?type|f-?pace|e-?pace|i-?pace|xf|xe|xj|xk|range\s*rover|evoque|discovery|velar|defender|xc40|xc60|xc90|s60|s90|v60|v90|c40|countryman|clubman|cooper|hardtop|500|giulia|stelvio|gv70|gv80|g70|g80|g90|outlander|eclipse\s*cross|lancer|evo|galant|pajero|montero|3000gt|diamante|mirage|r1t|r1s|air|gravity|express|savana|e-?series|nv|metris|colorado|canyon|ranger|maverick|lightning|raptor|tremor|power\s*wagon|trx|rebel|laramie|limited|platinum|lariat|king\s*ranch|denali|slt|at4|trail\s*boss|z71|rst|lt|ss|zl1|z06|zr1|grand\s*sport|stingray|hellcat|scat\s*pack|rt|srt|demon|redeye|super\s*bee|daytona|super\s*stock|shaker|mopar|shelby|gt350|gt500|mach-?[1e]|boss|bullitt|dark\s*horse|ecoboost|coyote|voodoo|predator|godzilla|hemi|cummins|duramax|powerstroke|ecodiesel|pentastar|triton|modular|ls[1-9]|lt[1-5]|lsa|lsx|gen\s*[iv])\b/i,
};

// Email extraction pattern
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// Partnership/sponsorship signal detection
const PARTNERSHIP_PATTERNS = /\b(collab|sponsor|film|commercial|partner|brand|ambassador|influencer|content creator|media|press|feature)\b/i;

// Build Jordan Lee's persona dynamically using TradeDNA
function buildJordanPersona(voiceProfile: VoiceProfile): string {
  const { merged, organization_dna } = voiceProfile;
  
  // Extract TradeDNA values with fallbacks
  const tone = merged.tone || 'professional, confident';
  const persona = merged.persona || 'wrap industry expert';
  const signaturePhrases = organization_dna?.vocabulary?.signature_phrases || [];
  const wordsToAvoid = organization_dna?.vocabulary?.words_to_avoid || [];
  const salesApproach = organization_dna?.sales_style?.approach || 'consultative';
  const ctaStyle = merged.cta_style || 'action-driven';
  const pressureLevel = organization_dna?.sales_style?.pressure_level || 'low';
  const customerPainPoints = organization_dna?.customer_profile?.pain_points || [];
  const emotionalTriggers = organization_dna?.customer_profile?.emotional_triggers || [];

  return `You are "Jordan Lee" — a friendly website chat specialist at WePrintWraps.

YOUR BRAND VOICE (from TradeDNA):
- Tone: ${tone}
- Persona: ${persona}
- Sales Approach: ${salesApproach} (pressure level: ${pressureLevel})
- CTA Style: ${ctaStyle}
${signaturePhrases.length > 0 ? `- USE these signature phrases when natural: ${signaturePhrases.join(', ')}` : ''}
${wordsToAvoid.length > 0 ? `- AVOID these words: ${wordsToAvoid.join(', ')}` : ''}
${customerPainPoints.length > 0 ? `- Customer pain points to address: ${customerPainPoints.join(', ')}` : ''}
${emotionalTriggers.length > 0 ? `- Emotional triggers that resonate: ${emotionalTriggers.join(', ')}` : ''}

YOUR ROLE:
- Educate visitors about wrap options and materials
- Calculate and provide SPECIFIC pricing based on vehicle SQFT
- Collect email addresses for formal written quotes
- Identify partnership/sponsorship opportunities
- Route formal quote requests to the quoting team

YOUR TEAM (mention naturally when routing):
- Alex (Quoting Team) - handles formal quotes and pricing
- Grant (Design Team) - handles design questions and file reviews
- Taylor (Partnerships) - handles collabs and sponsorships

🔥 PRICING (CRITICAL - Updated December 2024):
Both Avery AND 3M printed wraps are now $5.27/sqft! 3M just had a PRICE DROP!

VEHICLE SQFT ESTIMATES (use these to calculate pricing):
- Compact car (Civic, Corolla, Prius, Sentra): ~175 sqft = ~$922
- Midsize sedan (Camry, Accord, Altima, Sonata): ~200 sqft = ~$1,054
- Full-size sedan (Avalon, Maxima, 300): ~210 sqft = ~$1,107
- Compact SUV (RAV4, CR-V, Tucson, Rogue): ~200 sqft = ~$1,054
- Midsize SUV (Highlander, Pilot, Explorer): ~225 sqft = ~$1,186
- Full-size truck (F-150, Silverado, Ram 1500): ~250 sqft = ~$1,318
- Large SUV (Tahoe, Expedition, Suburban): ~275 sqft = ~$1,449
- Cargo van (Transit, Sprinter, ProMaster): ~350 sqft = ~$1,845
- Box truck: ~400+ sqft = ~$2,108+

WHEN CUSTOMER ASKS FOR PRICE:
1. Identify their vehicle
2. Look up approximate SQFT from the list above
3. Calculate: SQFT × $5.27 = Material Cost
4. Give specific estimate: "A [year] [make] [model] is about [X] square feet. At $5.27/sqft, that's around $[total] for the printed wrap material."
5. ALWAYS mention: "Both Avery and 3M printed wrap are now $5.27/sqft - 3M just dropped their price to match!"
6. For formal written quote: "Want me to send you a detailed quote? What's your email?"

ROUTING RULES:
- Quote requests with email → route to quoting team
- Partnership/sponsorship signals → route to partnerships team
- Design/file questions → route to design team

COMMUNICATION STYLE:
- Match the brand tone: ${tone}
- Concise (2-3 sentences max)
- Light emoji use (1-2 max)
- Give REAL numbers, not vague ranges

WPW GROUND TRUTH:
- Turnaround: 1-2 business days for print
- FREE shipping over $750
- All wraps include lamination
- Quality guarantee: 100% - we reprint at no cost

${WPW_CONSTITUTION.humanConfirmation}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { org, agent, mode, session_id, message_text, page_url, referrer, geo, organization_id } = await req.json();

    console.log('[JordanLee] Received message:', { org, session_id, organization_id, message_text: message_text?.substring(0, 50) });

    if (!message_text || !session_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load TradeDNA voice profile for this organization
    // Default to WPW org if not specified: 51aa96db-c06d-41ae-b3cb-25b045c75caf
    const orgId = organization_id || '51aa96db-c06d-41ae-b3cb-25b045c75caf';
    const voiceProfile = await loadVoiceProfile(orgId);
    console.log('[JordanLee] Loaded TradeDNA voice:', { tone: voiceProfile.merged.tone, persona: voiceProfile.merged.persona });

    // Load knowledge context for grounding (Jordan Lee agent)
    const knowledgeContext = await loadKnowledgeContext(supabase, "jordan_lee", message_text);

    // Extract info from message
    const lowerMessage = message_text.toLowerCase();
    const extractedVehicle = {
      year: message_text.match(VEHICLE_PATTERNS.year)?.[0] || null,
      make: message_text.match(VEHICLE_PATTERNS.make)?.[0] || null,
      model: message_text.match(VEHICLE_PATTERNS.model)?.[0] || null,
    };
    const extractedEmail = message_text.match(EMAIL_PATTERN)?.[0] || null;
    const hasCompleteVehicle = extractedVehicle.year && extractedVehicle.make && extractedVehicle.model;
    // Partial vehicle info (like just "sprinter" or "ford f150") - need to ask for more details
    const hasPartialVehicle = (extractedVehicle.make || extractedVehicle.model) && !hasCompleteVehicle;
    
    console.log('[JordanLee] Extracted:', { vehicle: extractedVehicle, email: extractedEmail, complete: hasCompleteVehicle, partial: hasPartialVehicle });

    // Detect intent signals
    const pricingIntent = lowerMessage.includes('price') || 
                          lowerMessage.includes('cost') || 
                          lowerMessage.includes('how much') ||
                          lowerMessage.includes('quote');
    const partnershipSignal = PARTNERSHIP_PATTERNS.test(message_text);
    const escalationType = detectEscalation(message_text);
    
    console.log('[JordanLee] Intent:', { pricing: pricingIntent, partnership: partnershipSignal, escalation: escalationType });

    // Find or create conversation
    let contactId: string | null = null;
    let conversationId: string;
    let chatState: Record<string, unknown> = {};

    const { data: existingConvo } = await supabase
      .from('conversations')
      .select('id, contact_id, chat_state')
      .eq('metadata->>session_id', session_id)
      .eq('channel', 'website')
      .single();

    if (existingConvo) {
      conversationId = existingConvo.id;
      contactId = existingConvo.contact_id;
      chatState = (existingConvo.chat_state as Record<string, unknown>) || {};
      console.log('[JordanLee] Existing conversation:', conversationId);
    } else {
      // Create anonymous contact
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          name: `Website Visitor (${session_id.substring(0, 8)})`,
          source: 'website_chat',
          tags: ['website', 'chat', mode === 'test' ? 'test_mode' : 'live'],
          metadata: {
            session_id,
            first_page: page_url,
            referrer,
            created_via: 'jordan_lee_chat'
          }
        })
        .select()
        .single();

      contactId = newContact?.id || null;

      // Create conversation with initial state
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          channel: 'website',
          contact_id: contactId,
          subject: 'Website Chat',
          status: 'open',
          priority: 'normal',
          chat_state: { stage: 'initial', escalations_sent: [] },
          metadata: { session_id, agent: 'jordan_lee', org, mode, page_url, geo: geo || null }
        })
        .select()
        .single();

      if (convoError) throw convoError;
      conversationId = newConvo.id;
      chatState = { stage: 'initial', escalations_sent: [] };
      console.log('[JordanLee] Created conversation:', conversationId);
    }

    // CRITICAL: Load full conversation history for context
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('direction, content, sender_name, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50); // Last 50 messages for context
    
    console.log('[JordanLee] Loaded message history:', messageHistory?.length || 0, 'messages');

    // Update chat state with extracted info
    if (extractedEmail && !chatState.customer_email) {
      chatState.customer_email = extractedEmail;
      chatState.stage = 'email_captured';
      
      // Update contact with real email
      if (contactId) {
        await supabase
          .from('contacts')
          .update({ 
            email: extractedEmail,
            tags: ['website', 'chat', 'email_captured', 'jordan_lead'],
            metadata: { 
              email_source: 'jordan_lee_chat_capture',
              email_captured_at: new Date().toISOString()
            }
          })
          .eq('id', contactId);
        console.log('[JordanLee] Captured email:', extractedEmail);
      }
    }

    // Persist vehicle info - merge with existing state so we don't lose previous info
    if (hasCompleteVehicle) {
      chatState.vehicle = extractedVehicle;
      chatState.vehicle_complete = true;
    } else if (hasPartialVehicle) {
      // Merge partial info with existing vehicle state
      const existingVehicle = (chatState.vehicle as Record<string, string | null>) || {};
      chatState.vehicle = {
        year: extractedVehicle.year || existingVehicle.year || null,
        make: extractedVehicle.make || existingVehicle.make || null,
        model: extractedVehicle.model || existingVehicle.model || null,
      };
      // Check if now complete after merge
      const merged = chatState.vehicle as Record<string, string | null>;
      chatState.vehicle_complete = !!(merged.year && merged.make && merged.model);
    }

    // Insert inbound message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      channel: 'website',
      direction: 'inbound',
      content: message_text,
      sender_name: 'Website Visitor',
      metadata: { page_url, session_id }
    });

    // Update conversation
    await supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        unread_count: 1,
        chat_state: chatState
      })
      .eq('id', conversationId);

    // ============================================
    // OPS DESK ROUTING (New architecture)
    // Jordan NEVER executes directly - routes through Ops Desk
    // ============================================

    // Route quote requests with email to Alex Morgan via Ops Desk
    if (pricingIntent && chatState.customer_email) {
      const revenuePriority = calculateRevenuePriority({
        isCommercial: lowerMessage.includes('fleet') || lowerMessage.includes('business'),
        sqft: hasCompleteVehicle ? 100 : undefined, // Estimate for priority
      });

      await routeToOpsDesk(supabase, {
        action: 'create_task',
        requested_by: 'jordan_lee',
        target: 'alex_morgan',
        context: {
          description: `Website chat quote request: ${extractedVehicle.year || ''} ${extractedVehicle.make || ''} ${extractedVehicle.model || ''}`.trim() || 'Vehicle TBD',
          customer: String(chatState.customer_email),
          revenue_impact: revenuePriority,
          notes: `Message: ${message_text}\nEmail: ${chatState.customer_email}`,
          conversation_id: conversationId,
        },
      });
      console.log('[JordanLee] Routed to Ops Desk → alex_morgan');
    }

    // Route partnership opportunities to Taylor Brooks via Ops Desk
    if (partnershipSignal) {
      await routeToOpsDesk(supabase, {
        action: 'create_task',
        requested_by: 'jordan_lee',
        target: 'taylor_brooks',
        context: {
          description: 'Website chat partnership/sponsorship opportunity',
          customer: String(chatState.customer_email) || `Visitor-${session_id.substring(0, 8)}`,
          revenue_impact: 'high',
          notes: `Original message: ${message_text}`,
          conversation_id: conversationId,
        },
      });
      console.log('[JordanLee] Routed to Ops Desk → taylor_brooks (partnership)');
    }

    // Handle escalation if detected (existing team escalation)
    let escalationSent = false;
    if (escalationType && resendKey) {
      const teamMember = WPW_TEAM[escalationType];
      const escalationsSent = (chatState.escalations_sent as string[]) || [];
      const alreadyEscalated = escalationsSent.includes(escalationType);
      
      if (teamMember && !alreadyEscalated) {
        console.log('[JordanLee] Sending escalation to:', teamMember.email);
        
        const escalationHtml = `
          <h2>🔔 Customer Request via Website Chat</h2>
          <p><strong>Agent:</strong> Jordan Lee (Website Chat)</p>
          <p><strong>Type:</strong> ${teamMember.role}</p>
          <hr>
          <p><strong>Customer Message:</strong></p>
          <blockquote style="background:#f5f5f5;padding:15px;border-left:4px solid #0066cc;">
            ${message_text}
          </blockquote>
          ${chatState.customer_email ? `<p><strong>Customer Email:</strong> ${chatState.customer_email}</p>` : '<p><em>Email not yet captured</em></p>'}
          ${hasCompleteVehicle ? `<p><strong>Vehicle:</strong> ${extractedVehicle.year} ${extractedVehicle.make} ${extractedVehicle.model}</p>` : ''}
          <p><strong>Page:</strong> ${page_url}</p>
          <hr>
          <p><a href="https://wrapcommandai.com/mightychat" style="background:#0066cc;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">View in MightyChat</a></p>
          ${mode === 'test' ? '<p style="color:red;"><strong>[TEST MODE]</strong></p>' : ''}
        `;

        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Jordan @ WPW <hello@weprintwraps.com>',
              to: [teamMember.email],
              cc: SILENT_CC,
              subject: `${mode === 'test' ? '[TEST] ' : ''}Customer Request: ${teamMember.role}`,
              html: escalationHtml
            })
          });
          
          escalationSent = true;
          chatState.escalations_sent = [...escalationsSent, escalationType];
          console.log('[JordanLee] Escalation email sent');
        } catch (emailErr) {
          console.error('[JordanLee] Escalation email error:', emailErr);
        }
      }
    }


    // ============================================
    // AI RESPONSE GENERATION
    // Jordan educates and routes - never sends formal quotes
    // ============================================

    // Build context for AI response
    let contextNotes = '';
    let vehicleSqft = 0;
    let vehicleSqftWithRoof = 0;
    let vehicleSqftWithoutRoof = 0;
    let estimatedCost = 0;
    let estimatedCostWithRoof = 0;
    let estimatedCostWithoutRoof = 0;
    let vehicleFromDb = false;
    let closestMatch: { make: string; model: string; year: string; sqft: number; sqftWithRoof?: number; sqftWithoutRoof?: number } | null = null;
    
    // Get the current vehicle state (merged from conversation history)
    const currentVehicle = chatState.vehicle as Record<string, string | null> | undefined;
    const vehicleIsComplete = chatState.vehicle_complete === true || 
      (currentVehicle?.year && currentVehicle?.make && currentVehicle?.model);
    
    // CRITICAL: Only calculate pricing if we have COMPLETE vehicle info (year + make + model)
    if (vehicleIsComplete && currentVehicle) {
      const searchMake = (currentVehicle.make || '').toLowerCase().trim();
      const searchModel = (currentVehicle.model || '').toLowerCase().trim();
      const searchYear = parseInt(currentVehicle.year || '0', 10);
      
      console.log('[JordanLee] Looking up vehicle in DB:', { make: searchMake, model: searchModel, year: searchYear });
      
      // Normalize make for database search (handle Mercedes/Mercedes-Benz, Chevy/Chevrolet, etc.)
      const normalizedMake = searchMake
        .replace(/mercedes[-\s]?benz/i, 'mercedes')
        .replace(/chevy/i, 'chevrolet')
        .replace(/vw/i, 'volkswagen');
      
      // Normalize model for database search (handle variations like "170WB Extended" vs "170 Extended")
      const normalizedModel = searchModel
        .replace(/[-\s]+/g, '%')  // Replace spaces/dashes with wildcards for flexible matching
        .replace(/wb/i, 'wb')     // Ensure "WB" stays together
        .replace(/ext\b/i, 'extended'); // Expand "ext" to "extended"
      
      // Build search patterns for the model - try different variations
      const modelSearchPatterns = [
        `%${normalizedModel}%`,
        `%${searchModel.replace(/\s+/g, '%')}%`,
        // For Sprinters: if user says "Sprinter 2500" try matching "Sprinter 2500 - *"
        searchModel.includes('sprinter') ? `%sprinter%${searchModel.replace(/sprinter/i, '').trim()}%` : null,
      ].filter(Boolean);
      
      // First try exact match in vehicle_dimensions table with the normalized model
      let allMatches: Array<{
        make: string;
        model: string;
        year_start: number;
        year_end: number;
        corrected_sqft: number | null;
        total_sqft: number | null;
        side_sqft: number | null;
        back_sqft: number | null;
        hood_sqft: number | null;
        roof_sqft: number | null;
      }> = [];
      
      for (const pattern of modelSearchPatterns) {
        if (!pattern) continue;
        const { data: matches } = await supabase
          .from('vehicle_dimensions')
          .select('make, model, year_start, year_end, corrected_sqft, total_sqft, side_sqft, back_sqft, hood_sqft, roof_sqft')
          .or(`make.ilike.%${normalizedMake}%,make.ilike.%${searchMake}%`)
          .ilike('model', pattern)
          .limit(20);
        
        if (matches && matches.length > 0) {
          allMatches = [...allMatches, ...matches];
        }
      }
      
      // Deduplicate matches
      const uniqueMatches = Array.from(new Map(allMatches.map(m => [`${m.make}-${m.model}-${m.year_start}`, m])).values());
      
      console.log('[JordanLee] DB query results:', uniqueMatches.length, 'matches for', searchMake, searchModel);
      
      if (uniqueMatches.length > 0) {
        // Find best match considering year range and model specificity
        let bestMatch: typeof uniqueMatches[0] | null = null;
        let bestMatchScore = 0;
        
        for (const vehicle of uniqueMatches) {
          const yearStart = vehicle.year_start || 0;
          const yearEnd = vehicle.year_end || yearStart;
          const vehicleModel = vehicle.model.toLowerCase();
          
          // Calculate match score based on how specific the model match is
          let score = 0;
          
          // Year within range is essential
          if (searchYear >= yearStart && searchYear <= yearEnd) {
            score += 100; // Big bonus for year match
          }
          
          // Model specificity scoring
          if (vehicleModel === searchModel) {
            score += 50; // Exact model match
          } else if (vehicleModel.includes(searchModel) || searchModel.includes(vehicleModel)) {
            score += 25; // Partial model match
          }
          
          // Bonus for more specific variants (longer model names usually mean more specific)
          score += Math.min(vehicleModel.length / 10, 5);
          
          console.log('[JordanLee] Scoring vehicle:', { 
            model: vehicle.model, 
            yearRange: `${yearStart}-${yearEnd}`,
            score,
            inYearRange: searchYear >= yearStart && searchYear <= yearEnd
          });
          
          if (score > bestMatchScore) {
            bestMatchScore = score;
            bestMatch = vehicle;
          }
        }
        
        if (bestMatch && bestMatchScore >= 100) {
          // We have a good match with year in range
          vehicleSqft = bestMatch.corrected_sqft || bestMatch.total_sqft || 0;
          vehicleFromDb = true;
          
          // Calculate with/without roof SQFT using panel breakdowns
          const sideSqft = bestMatch.side_sqft || 0;
          const backSqft = bestMatch.back_sqft || 0;
          const hoodSqft = bestMatch.hood_sqft || 0;
          const roofSqft = bestMatch.roof_sqft || 0;
          
          vehicleSqftWithoutRoof = Math.round((sideSqft + backSqft + hoodSqft) * 10) / 10;
          vehicleSqftWithRoof = Math.round((sideSqft + backSqft + hoodSqft + roofSqft) * 10) / 10;
          
          console.log('[JordanLee] EXACT DB match:', { 
            vehicle: `${bestMatch.make} ${bestMatch.model}`, 
            sqft: vehicleSqft,
            withRoof: vehicleSqftWithRoof,
            withoutRoof: vehicleSqftWithoutRoof
          });
        } else if (bestMatch) {
          // Save as potential close match (year not in range but model matches)
          closestMatch = {
            make: bestMatch.make,
            model: bestMatch.model,
            year: `${bestMatch.year_start}-${bestMatch.year_end}`,
            sqft: bestMatch.corrected_sqft || bestMatch.total_sqft || 0,
            sqftWithRoof: (bestMatch.side_sqft || 0) + (bestMatch.back_sqft || 0) + (bestMatch.hood_sqft || 0) + (bestMatch.roof_sqft || 0),
            sqftWithoutRoof: (bestMatch.side_sqft || 0) + (bestMatch.back_sqft || 0) + (bestMatch.hood_sqft || 0)
          };
          vehicleSqft = closestMatch.sqft;
          vehicleSqftWithRoof = closestMatch.sqftWithRoof || 0;
          vehicleSqftWithoutRoof = closestMatch.sqftWithoutRoof || 0;
          console.log('[JordanLee] Using CLOSEST DB match:', closestMatch);
        }
      }
      
      // Fallback to hardcoded estimates if not in DB
      if (vehicleSqft === 0) {
        const vehicleKey = `${searchMake} ${searchModel}`.toLowerCase().trim();
        if (/prius|civic|corolla|sentra|versa|yaris|fit|accent|rio|mirage/i.test(vehicleKey)) {
          vehicleSqft = 175;
        } else if (/camry|accord|altima|sonata|mazda6|legacy|jetta|passat/i.test(vehicleKey)) {
          vehicleSqft = 200;
        } else if (/avalon|maxima|300|charger|impala|taurus/i.test(vehicleKey)) {
          vehicleSqft = 210;
        } else if (/rav4|cr-?v|tucson|rogue|forester|crosstrek|cx-?5|tiguan/i.test(vehicleKey)) {
          vehicleSqft = 200;
        } else if (/highlander|pilot|explorer|pathfinder|4runner|cx-?9|atlas/i.test(vehicleKey)) {
          vehicleSqft = 225;
        } else if (/f-?150|silverado|sierra|ram|tundra|titan/i.test(vehicleKey)) {
          vehicleSqft = 250;
        } else if (/tahoe|expedition|suburban|yukon|sequoia|armada/i.test(vehicleKey)) {
          vehicleSqft = 275;
        } else if (/transit|sprinter|promaster/i.test(vehicleKey)) {
          vehicleSqft = 450; // Updated to a more realistic cargo van estimate
        } else if (/mustang|camaro|challenger|corvette|supra|370z|86|brz|miata/i.test(vehicleKey)) {
          vehicleSqft = 180;
        } else if (/wrangler|bronco/i.test(vehicleKey)) {
          vehicleSqft = 200;
        } else {
          vehicleSqft = 200; // Default mid-size estimate
        }
      }
      
      // Calculate costs
      estimatedCost = Math.round(vehicleSqft * 5.27);
      estimatedCostWithRoof = vehicleSqftWithRoof > 0 ? Math.round(vehicleSqftWithRoof * 5.27) : 0;
      estimatedCostWithoutRoof = vehicleSqftWithoutRoof > 0 ? Math.round(vehicleSqftWithoutRoof * 5.27) : 0;
    }
    
    // Build context notes based on state
    if (escalationType && escalationSent) {
      contextNotes = `ESCALATION SENT: You just escalated to ${WPW_TEAM[escalationType].name}. Tell the customer you've looped them in.`;
    } else if (pricingIntent && !vehicleIsComplete) {
      // CRITICAL: Don't give any price without complete vehicle info
      const existingVehicle = chatState.vehicle as Record<string, string | null> | undefined;
      const missingParts: string[] = [];
      if (!existingVehicle?.year) missingParts.push('year');
      if (!existingVehicle?.make) missingParts.push('make');
      if (!existingVehicle?.model) missingParts.push('model');
      
      if (existingVehicle && (existingVehicle.make || existingVehicle.model)) {
        contextNotes = `NEED MORE VEHICLE INFO: Customer mentioned ${existingVehicle.make || ''} ${existingVehicle.model || ''} but we need the FULL year, make, and model to calculate an accurate price. Ask for the missing: ${missingParts.join(', ')}. DO NOT give any price estimate yet!`;
      } else {
        contextNotes = `NEED VEHICLE INFO: Customer wants pricing but hasn't provided a vehicle yet. Ask them for their vehicle's YEAR, MAKE, and MODEL so you can calculate a specific price. DO NOT give generic ranges - we calculate exact prices based on vehicle SQFT.`;
      }
    } else if (pricingIntent && vehicleIsComplete && vehicleSqft > 0) {
      const vehicleStr = `${currentVehicle?.year} ${currentVehicle?.make} ${currentVehicle?.model}`;
      
      // Build pricing info with with/without roof if available
      let pricingInfo = '';
      if (vehicleSqftWithRoof > 0 && vehicleSqftWithoutRoof > 0) {
        pricingInfo = `
WITHOUT ROOF: ${vehicleSqftWithoutRoof} sqft = ~$${estimatedCostWithoutRoof}
WITH ROOF: ${vehicleSqftWithRoof} sqft = ~$${estimatedCostWithRoof}
(Roof adds ~${Math.round(vehicleSqftWithRoof - vehicleSqftWithoutRoof)} sqft)`;
      } else {
        pricingInfo = `${vehicleSqft} sqft = ~$${estimatedCost}`;
      }
      
      if (closestMatch && !vehicleFromDb) {
        // We used a close match, not exact
        contextNotes = `CLOSE MATCH FOUND: We don't have exact data for a ${vehicleStr}, but the ${closestMatch.year} ${closestMatch.make} ${closestMatch.model} is a close match.
PRICING (ballpark based on similar vehicle):${pricingInfo}
At $5.27/sqft, explain this is a ballpark based on a similar vehicle. Ask for email to send formal quote.`;
      } else {
        contextNotes = `VEHICLE FOUND IN DATABASE: ${vehicleStr}
PRICING FROM DATABASE:${pricingInfo}
GIVE THESE SPECIFIC PRICES! Explain the difference between with/without roof. Also mention both Avery and 3M are now $5.27/sqft.${!chatState.customer_email ? ' Ask for email to send formal quote.' : ''}`;
      }
    } else if (pricingIntent && chatState.customer_email && vehicleIsComplete) {
      contextNotes = `QUOTE ROUTED: You've sent this to our quoting team. Confirm the customer will receive an email with full pricing at ${chatState.customer_email}.`;
    } else if (partnershipSignal) {
      contextNotes = `PARTNERSHIP ROUTED: You've looped in the partnerships team. Tell the customer someone will follow up shortly.`;
    } else if (vehicleIsComplete && vehicleSqft > 0 && !chatState.customer_email) {
      const vehicleStr = `${currentVehicle?.year} ${currentVehicle?.make} ${currentVehicle?.model}`;
      
      let pricingInfo = '';
      if (vehicleSqftWithRoof > 0 && vehicleSqftWithoutRoof > 0) {
        pricingInfo = `WITHOUT ROOF: ${vehicleSqftWithoutRoof} sqft = ~$${estimatedCostWithoutRoof}, WITH ROOF: ${vehicleSqftWithRoof} sqft = ~$${estimatedCostWithRoof}`;
      } else {
        pricingInfo = `${vehicleSqft} sqft = ~$${estimatedCost}`;
      }
      
      if (closestMatch && !vehicleFromDb) {
        contextNotes = `CLOSE MATCH - READY FOR QUOTE: Based on the ${closestMatch.year} ${closestMatch.make} ${closestMatch.model} (close match for ${vehicleStr}). ${pricingInfo}. Give the ballpark estimate and ask for email to send formal quote!`;
      } else {
        contextNotes = `READY FOR QUOTE: Customer gave complete vehicle info - ${vehicleStr}. ${pricingInfo}. Give them the price estimate and ask for email to send formal quote!`;
      }
    } else if (hasPartialVehicle && !vehicleIsComplete) {
      // Customer gave partial vehicle info but not complete
      const partialInfo = extractedVehicle.make || extractedVehicle.model || '';
      contextNotes = `PARTIAL VEHICLE: Customer mentioned "${partialInfo}" but we need the COMPLETE vehicle info (year, make, and model) to calculate an accurate price. Ask specifically what year and full model they have.`;
    }

    // Generate AI response using Jordan's persona
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    let aiReply = "Hey! Thanks for reaching out. I'm Jordan from the WPW team - how can I help you today? 🔥";

    if (lovableApiKey) {
      try {
        // Build conversation history for AI context
        const conversationMessages: Array<{ role: string; content: string }> = [];
        
        // Add system prompt first
        conversationMessages.push({
          role: 'system',
          content: `${buildJordanPersona(voiceProfile)}

CURRENT CONTEXT:
${contextNotes}

CONVERSATION STATE:
- Stage: ${chatState.stage || 'initial'}
- Customer Email: ${chatState.customer_email || 'NOT CAPTURED YET'}
- Vehicle: ${chatState.vehicle ? `${(chatState.vehicle as Record<string, string>).year || 'unknown'} ${(chatState.vehicle as Record<string, string>).make || 'unknown'} ${(chatState.vehicle as Record<string, string>).model || 'unknown'}` : 'Not provided'}
- Vehicle Complete: ${chatState.vehicle_complete ? 'YES' : 'NO - need more info'}
- Escalations Sent: ${(chatState.escalations_sent as string[])?.join(', ') || 'None'}

KNOWLEDGE BASE:
${knowledgeContext}

CRITICAL INSTRUCTIONS:
1. You have FULL access to the conversation history below. Do NOT ask for info the customer already provided!
2. If vehicle info is incomplete, ask for the SPECIFIC missing parts only.
3. If you already know the year, make, and model from previous messages, use that info directly.
4. Pay close attention to what was said earlier - the customer may have provided details you need.

${mode === 'test' ? '[TEST MODE - Internal testing only]' : ''}`
        });
        
        // Add conversation history (excluding the current message which we'll add at the end)
        if (messageHistory && messageHistory.length > 0) {
          for (const msg of messageHistory) {
            conversationMessages.push({
              role: msg.direction === 'inbound' ? 'user' : 'assistant',
              content: msg.content
            });
          }
          console.log('[JordanLee] Added', messageHistory.length, 'messages to AI context');
        }
        
        // Add current message
        conversationMessages.push({
          role: 'user',
          content: message_text
        });

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: conversationMessages,
            max_tokens: 500
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          if (aiData.choices?.[0]?.message?.content) {
            aiReply = aiData.choices[0].message.content;
          }
        }
      } catch (aiError) {
        console.error('[JordanLee] AI generation error:', aiError);
      }
    }

    // Format response according to Jordan's style
    const jordanAgent = AGENTS.jordan_lee;
    aiReply = formatAgentResponse(jordanAgent, aiReply);

    // Save final state and insert response
    await supabase
      .from('conversations')
      .update({ chat_state: chatState })
      .eq('id', conversationId);

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      channel: 'website',
      direction: 'outbound',
      content: aiReply,
      sender_name: 'Jordan Lee',
      metadata: { ai_generated: true, agent: 'jordan_lee', escalation: escalationType }
    });

    // Log to message_ingest_log
    await supabase.from('message_ingest_log').insert({
      platform: 'website',
      sender_id: session_id,
      message_text,
      intent: escalationType || (pricingIntent ? 'pricing' : 'general'),
      processed: true,
      raw_payload: { org, agent: 'jordan_lee', mode, page_url, chatState }
    });

    console.log('[JordanLee] Response sent:', aiReply.substring(0, 50));

    return new Response(JSON.stringify({ 
      reply: aiReply,
      conversation_id: conversationId,
      agent: AGENTS.jordan_lee.displayName,
      escalation: escalationType,
      partnership_detected: partnershipSignal,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[JordanLee] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
