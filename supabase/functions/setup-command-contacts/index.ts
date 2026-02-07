import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Creates the command_contacts table
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create table using raw SQL via postgres function
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS command_contacts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID REFERENCES organizations(id),
          email TEXT NOT NULL,
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
          lead_score INTEGER DEFAULT 0,
          tags TEXT[] DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(organization_id, email)
        );
        
        CREATE INDEX IF NOT EXISTS idx_command_contacts_org ON command_contacts(organization_id);
        CREATE INDEX IF NOT EXISTS idx_command_contacts_email ON command_contacts(email);
        CREATE INDEX IF NOT EXISTS idx_command_contacts_shop ON command_contacts(shop_name);
      `
    });

    if (error) {
      // If rpc doesn't exist, return the SQL for manual execution
      console.log("RPC not available, returning SQL");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Run this SQL in Supabase Dashboard",
          sql: `
CREATE TABLE IF NOT EXISTS command_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  email TEXT NOT NULL,
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
  lead_score INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_command_contacts_org ON command_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_command_contacts_email ON command_contacts(email);
CREATE INDEX IF NOT EXISTS idx_command_contacts_shop ON command_contacts(shop_name);
          `
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "command_contacts table created" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[SetupCommandContacts] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
