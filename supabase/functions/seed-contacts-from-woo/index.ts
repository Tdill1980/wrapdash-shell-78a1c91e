import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // WPW Organization ID
    const WPW_ORG_ID = '51aa96db-c06d-41ae-b3cb-25b045c75caf';

    console.log("📇 Starting contact import from WooCommerce orders...");

    // Get unique customers from shopflow_orders
    const { data: orders, error: ordersError } = await supabase
      .from("shopflow_orders")
      .select("customer_email, customer_name")
      .not("customer_email", "is", null);

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    // Deduplicate by email
    const uniqueCustomers = new Map<string, string>();
    for (const order of orders || []) {
      if (order.customer_email) {
        const email = order.customer_email.toLowerCase().trim();
        if (!uniqueCustomers.has(email)) {
          uniqueCustomers.set(email, order.customer_name || email.split('@')[0]);
        }
      }
    }

    console.log(`📊 Found ${uniqueCustomers.size} unique customers`);

    // Get existing contacts to avoid duplicates
    const { data: existingContacts, error: existingError } = await supabase
      .from("contacts")
      .select("email")
      .eq("organization_id", WPW_ORG_ID);

    if (existingError) {
      throw new Error(`Failed to fetch existing contacts: ${existingError.message}`);
    }

    const existingEmails = new Set(
      (existingContacts || []).map(c => c.email?.toLowerCase())
    );

    // Filter out existing contacts
    const newContacts: { name: string; email: string; source: string; organization_id: string; tags: string[] }[] = [];
    
    for (const [email, name] of uniqueCustomers) {
      if (!existingEmails.has(email)) {
        newContacts.push({
          name,
          email,
          source: "woocommerce_import",
          organization_id: WPW_ORG_ID,
          tags: ["woocommerce", "customer"],
        });
      }
    }

    console.log(`📥 Importing ${newContacts.length} new contacts (${existingEmails.size} already exist)`);

    if (newContacts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          imported: 0,
          skipped: uniqueCustomers.size,
          message: "All customers already exist as contacts",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert in batches of 50
    const batchSize = 50;
    let imported = 0;
    let errors: string[] = [];

    for (let i = 0; i < newContacts.length; i += batchSize) {
      const batch = newContacts.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("contacts")
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Batch ${i / batchSize + 1} failed:`, error);
        errors.push(error.message);
      } else {
        imported += data?.length || 0;
        console.log(`✅ Batch ${i / batchSize + 1}: Imported ${data?.length} contacts`);
      }
    }

    console.log(`✅ Import complete: ${imported} contacts imported`);

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        skipped: uniqueCustomers.size - newContacts.length,
        total: uniqueCustomers.size,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("❌ Error in seed-contacts-from-woo:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
