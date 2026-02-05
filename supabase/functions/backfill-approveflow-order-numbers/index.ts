import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// BACKFILL: Fix ApproveFlow Order Numbers
// Uses ShopFlow relationship to correct order numbers
// that incorrectly used WooCommerce internal ID instead of customer-facing number
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔧 Starting ApproveFlow order number backfill...');

    // Step 1: Find all approveflow_projects where order_number matches a woo_order_id in shopflow_orders
    // This means they're using the internal ID instead of customer-facing number
    const { data: mismatchedProjects, error: queryError } = await supabase
      .from('approveflow_projects')
      .select('id, order_number');

    if (queryError) {
      console.error('Error querying approveflow_projects:', queryError);
      throw queryError;
    }

    console.log(`📊 Found ${mismatchedProjects?.length || 0} total ApproveFlow projects`);

    // Step 2: For each project, check if its order_number matches a woo_order_id in shopflow_orders
    const fixes: { projectId: string; oldNumber: string; newNumber: string }[] = [];
    const notFound: string[] = [];

    for (const project of mismatchedProjects || []) {
      // Try to find a shopflow_order where woo_order_id matches this order_number
      const { data: shopflowOrder, error: sfError } = await supabase
        .from('shopflow_orders')
        .select('woo_order_id, woo_order_number')
        .eq('woo_order_id', parseInt(project.order_number))
        .single();

      if (sfError && sfError.code !== 'PGRST116') {
        console.error(`Error checking shopflow for ${project.order_number}:`, sfError);
        continue;
      }

      if (shopflowOrder && shopflowOrder.woo_order_number) {
        const correctNumber = shopflowOrder.woo_order_number.toString();
        
        // Only fix if the numbers are different
        if (correctNumber !== project.order_number) {
          console.log(`🔄 Project ${project.id}: ${project.order_number} → ${correctNumber}`);
          fixes.push({
            projectId: project.id,
            oldNumber: project.order_number,
            newNumber: correctNumber
          });
        }
      } else {
        // Check if order_number looks like an internal ID (5+ digits starting with 69 or 70)
        if (/^(69|70)\d{3,}$/.test(project.order_number)) {
          notFound.push(project.order_number);
          console.warn(`⚠️ No ShopFlow match for suspected internal ID: ${project.order_number}`);
        }
      }
    }

    console.log(`\n📋 Summary: ${fixes.length} projects need fixing, ${notFound.length} suspected but no ShopFlow match`);

    // Step 3: Apply the fixes
    let successCount = 0;
    let errorCount = 0;

    for (const fix of fixes) {
      // Update approveflow_projects
      const { error: updateError } = await supabase
        .from('approveflow_projects')
        .update({ order_number: fix.newNumber })
        .eq('id', fix.projectId);

      if (updateError) {
        console.error(`❌ Failed to update project ${fix.projectId}:`, updateError);
        errorCount++;
        continue;
      }

      // Also update approveflow_proof_versions if they exist
      const { error: proofError } = await supabase
        .from('approveflow_proof_versions')
        .update({ order_number: fix.newNumber })
        .eq('project_id', fix.projectId);

      if (proofError) {
        console.warn(`⚠️ Could not update proof versions for project ${fix.projectId}:`, proofError);
      }

      console.log(`✅ Fixed: ${fix.oldNumber} → ${fix.newNumber}`);
      successCount++;
    }

    const result = {
      message: 'ApproveFlow order number backfill complete',
      totalProjects: mismatchedProjects?.length || 0,
      fixesNeeded: fixes.length,
      successfulFixes: successCount,
      errors: errorCount,
      noShopFlowMatch: notFound,
      fixes: fixes.map(f => ({ old: f.oldNumber, new: f.newNumber }))
    };

    console.log('\n🎉 Backfill complete:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Backfill error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
