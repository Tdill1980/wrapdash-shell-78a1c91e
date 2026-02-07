import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Creates the mighty_contacts table if it doesn't exist
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if table exists
    const { data: tables, error: checkError } = await supabase
      .from('mighty_contacts')
      .select('id')
      .limit(1);

    if (!checkError) {
      return new Response(
        JSON.stringify({ success: true, message: "Table already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Table doesn't exist, create it via SQL
    const createTableSQL = `
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
      );
      
      CREATE INDEX IF NOT EXISTS idx_mighty_contacts_email ON mighty_contacts(email);
      CREATE INDEX IF NOT EXISTS idx_mighty_contacts_shop_name ON mighty_contacts(shop_name);
      CREATE INDEX IF NOT EXISTS idx_mighty_contacts_email_subscribed ON mighty_contacts(email_subscribed);
    `;

    // Use rpc to run raw SQL
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (sqlError) {
      // If rpc doesn't exist, table might need to be created via dashboard
      console.error("SQL execution error:", sqlError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: sqlError.message,
          note: "Table needs to be created via Supabase Dashboard SQL editor"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Table created successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[SetupMightyContacts] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
