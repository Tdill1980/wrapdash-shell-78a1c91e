import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateOrgRequest {
  subdomain: string;
  name: string;
  userId: string;
  affiliateFounderId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { subdomain, name, userId, affiliateFounderId }: CreateOrgRequest = await req.json();

    // Validate subdomain
    if (!subdomain || subdomain.length < 3) {
      throw new Error('Subdomain must be at least 3 characters');
    }

    const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Check if subdomain already exists
    const { data: existing } = await supabaseClient
      .from('organizations')
      .select('id')
      .eq('subdomain', cleanSubdomain)
      .single();

    if (existing) {
      throw new Error('Subdomain already taken');
    }

    // Create organization
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .insert({
        subdomain: cleanSubdomain,
        name,
        owner_id: userId,
        affiliate_founder_id: affiliateFounderId,
        subscription_tier: 'pro',
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Add user as organization owner
    const { error: memberError } = await supabaseClient
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) throw memberError;

    console.log(`Organization created: ${org.subdomain} (${org.id})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        organization: org,
        subdomain_url: `https://${cleanSubdomain}.wrapcommand.ai`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating organization:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to create organization' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
