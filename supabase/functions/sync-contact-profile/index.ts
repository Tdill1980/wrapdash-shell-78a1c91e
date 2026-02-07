import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * VoiceCommandAI CMS - Contact Profile Sync
 * 
 * Extracts customer data from chat conversations and builds/updates
 * unified contact profiles in mighty_contacts table.
 * 
 * Progressive enrichment: If customer provides phone in one chat and
 * address in another, both get merged into their profile.
 * 
 * Call this:
 * - After each chat ends
 * - Or run as batch to sync all conversations
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { conversation_id, batch_mode, create_table } = body;

    // Create table if requested or if it doesn't exist
    if (create_table) {
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS mighty_contacts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            name TEXT,
            phone TEXT,
            shop_name TEXT,
            city TEXT,
            region TEXT,
            country TEXT,
            timezone TEXT,
            address TEXT,
            last_vehicle_interest TEXT,
            vehicle_interests JSONB DEFAULT '[]',
            has_received_quote BOOLEAN DEFAULT FALSE,
            last_quote_id UUID,
            has_ordered BOOLEAN DEFAULT FALSE,
            total_order_value DECIMAL(10, 2) DEFAULT 0,
            conversation_count INTEGER DEFAULT 0,
            last_conversation_id UUID,
            last_conversation_at TIMESTAMPTZ,
            email_subscribed BOOLEAN DEFAULT TRUE,
            email_unsubscribed_at TIMESTAMPTZ,
            source TEXT DEFAULT 'website_chat',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `
      });
      
      if (createError && !createError.message.includes('already exists')) {
        console.log("[SyncContact] Table creation note:", createError.message);
      }
    }

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Get conversations to process
    let conversations: any[] = [];

    if (conversation_id) {
      // Single conversation mode
      const { data, error } = await supabase
        .from("conversations")
        .select("id, chat_state, metadata, created_at, updated_at")
        .eq("id", conversation_id)
        .single();

      if (error) throw error;
      conversations = data ? [data] : [];
    } else if (batch_mode) {
      // Batch mode - process all conversations with email
      const { data, error } = await supabase
        .from("conversations")
        .select("id, chat_state, metadata, created_at, updated_at")
        .not("chat_state->>customer_email", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      conversations = data || [];
    } else {
      return new Response(
        JSON.stringify({ error: "Provide conversation_id or batch_mode: true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SyncContact] Processing ${conversations.length} conversations`);

    for (const conv of conversations) {
      results.processed++;

      const chatState = conv.chat_state || {};
      const metadata = conv.metadata || {};

      // Extract email - required for profile
      const email = (chatState.customer_email || chatState.email || "").toLowerCase().trim();

      if (!email || email.includes("test") || email.includes("invalid") || email.includes("@weprintwraps.com")) {
        results.skipped++;
        continue;
      }

      // Extract all available data
      const extractedData = {
        email,
        name: chatState.customer_name || chatState.name || null,
        phone: chatState.customer_phone || chatState.phone || null,
        shop_name: chatState.shop_name || chatState.business_name || null,
        city: metadata.geo?.city || null,
        region: metadata.geo?.region || null,
        country: metadata.geo?.country || null,
        timezone: metadata.geo?.timezone || null,
        // Vehicle interest tracking
        last_vehicle_interest: chatState.vehicle || null,
        // Quote tracking
        has_received_quote: !!chatState.quote_id,
        last_quote_id: chatState.quote_id || null,
      };

      // Check if contact exists
      const { data: existing, error: lookupError } = await supabase
        .from("mighty_contacts")
        .select("*")
        .eq("email", email)
        .single();

      if (lookupError && lookupError.code !== "PGRST116") {
        // PGRST116 = not found, which is fine
        results.errors.push(`Lookup error for ${email}: ${lookupError.message}`);
        continue;
      }

      if (existing) {
        // Update existing - merge data (don't overwrite with null)
        const updates: Record<string, any> = {
          updated_at: new Date().toISOString(),
          conversation_count: (existing.conversation_count || 0) + 1,
          last_conversation_id: conv.id,
          last_conversation_at: conv.updated_at || conv.created_at,
        };

        // Only update fields if new value is better than existing
        if (extractedData.name && !existing.name) updates.name = extractedData.name;
        if (extractedData.phone && !existing.phone) updates.phone = extractedData.phone;
        if (extractedData.shop_name && !existing.shop_name) updates.shop_name = extractedData.shop_name;
        if (extractedData.city && !existing.city) updates.city = extractedData.city;
        if (extractedData.region && !existing.region) updates.region = extractedData.region;
        if (extractedData.country && !existing.country) updates.country = extractedData.country;
        if (extractedData.timezone && !existing.timezone) updates.timezone = extractedData.timezone;
        if (extractedData.last_vehicle_interest) updates.last_vehicle_interest = extractedData.last_vehicle_interest;
        if (extractedData.has_received_quote) updates.has_received_quote = true;
        if (extractedData.last_quote_id) updates.last_quote_id = extractedData.last_quote_id;

        const { error: updateError } = await supabase
          .from("mighty_contacts")
          .update(updates)
          .eq("id", existing.id);

        if (updateError) {
          results.errors.push(`Update error for ${email}: ${updateError.message}`);
        } else {
          results.updated++;
          console.log(`[SyncContact] Updated ${email}`);
        }
      } else {
        // Create new contact
        const { error: insertError } = await supabase
          .from("mighty_contacts")
          .insert({
            email,
            name: extractedData.name,
            phone: extractedData.phone,
            shop_name: extractedData.shop_name,
            city: extractedData.city,
            region: extractedData.region,
            country: extractedData.country,
            timezone: extractedData.timezone,
            last_vehicle_interest: extractedData.last_vehicle_interest,
            has_received_quote: extractedData.has_received_quote,
            last_quote_id: extractedData.last_quote_id,
            conversation_count: 1,
            last_conversation_id: conv.id,
            last_conversation_at: conv.updated_at || conv.created_at,
            source: "website_chat",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          results.errors.push(`Insert error for ${email}: ${insertError.message}`);
        } else {
          results.created++;
          console.log(`[SyncContact] Created ${email}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[SyncContact] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
