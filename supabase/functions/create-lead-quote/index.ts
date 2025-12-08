import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateLeadQuotePayload {
  organization_id: string;
  source: string;
  customer: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    instagram_username?: string;
  };
  vehicle?: {
    year?: string | number;
    make?: string;
    model?: string;
  };
  wrap_type?: string;
  budget?: string;
  photos?: string[];
  notes?: string;
  trigger_followup?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CreateLeadQuotePayload = await req.json();
    console.log('[create-lead-quote] Received:', JSON.stringify(body));

    // 1. Create or update CRM contact
    let contact = null;
    
    if (body.customer.email || body.customer.phone) {
      // Try to find existing contact
      let query = supabase.from('contacts').select('*');
      
      if (body.customer.email) {
        query = query.eq('email', body.customer.email);
      } else if (body.customer.phone) {
        query = query.eq('phone', body.customer.phone);
      }

      const { data: existingContact } = await query
        .eq('organization_id', body.organization_id)
        .maybeSingle();

      if (existingContact) {
        // Update existing contact
        const { data: updatedContact } = await supabase
          .from('contacts')
          .update({
            name: body.customer.name || existingContact.name,
            company: body.customer.company || existingContact.company,
            phone: body.customer.phone || existingContact.phone,
            email: body.customer.email || existingContact.email,
            last_contacted_at: new Date().toISOString(),
            metadata: {
              ...existingContact.metadata,
              instagram_username: body.customer.instagram_username,
              last_source: body.source
            }
          })
          .eq('id', existingContact.id)
          .select()
          .single();
        
        contact = updatedContact || existingContact;
        console.log('[create-lead-quote] Updated existing contact:', contact.id);
      } else {
        // Create new contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            organization_id: body.organization_id,
            name: body.customer.name || 'Unknown',
            email: body.customer.email,
            phone: body.customer.phone,
            company: body.customer.company,
            source: body.source,
            metadata: {
              instagram_username: body.customer.instagram_username
            }
          })
          .select()
          .single();

        if (contactError) {
          console.error('[create-lead-quote] Contact creation error:', contactError);
          throw contactError;
        }

        contact = newContact;
        console.log('[create-lead-quote] Created new contact:', contact.id);

        // Log lead source
        await supabase.from('lead_sources').insert({
          organization_id: body.organization_id,
          contact_id: contact.id,
          source: body.source,
          metadata: { vehicle: body.vehicle, wrap_type: body.wrap_type }
        });
      }
    }

    // 2. Generate quote number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const quoteNumber = `Q${timestamp}${random}`;

    // 3. Create quote draft
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        organization_id: body.organization_id,
        quote_number: quoteNumber,
        customer_name: body.customer.name || 'Unknown',
        customer_email: body.customer.email || '',
        customer_phone: body.customer.phone,
        customer_company: body.customer.company,
        vehicle_year: body.vehicle?.year?.toString(),
        vehicle_make: body.vehicle?.make,
        vehicle_model: body.vehicle?.model,
        product_name: body.wrap_type,
        status: 'draft',
        total_price: 0
      })
      .select()
      .single();

    if (quoteError) {
      console.error('[create-lead-quote] Quote creation error:', quoteError);
      throw quoteError;
    }
    console.log('[create-lead-quote] Created quote:', quote.id);

    // 4. Create MightyTask for follow-up
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        organization_id: body.organization_id,
        contact_id: contact?.id,
        quote_id: quote.id,
        title: `Prepare quote for ${body.customer.name || 'lead'}`,
        description: `Source: ${body.source}\nVehicle: ${body.vehicle?.year} ${body.vehicle?.make} ${body.vehicle?.model}\nWrap Type: ${body.wrap_type}\nBudget: ${body.budget}\nNotes: ${body.notes}`,
        priority: 'high',
        status: 'pending'
      })
      .select()
      .single();

    if (!taskError) {
      console.log('[create-lead-quote] Created task:', task.id);
    }

    // 5. Create AI action suggestion for MCP
    await supabase.from('ai_actions').insert({
      organization_id: body.organization_id,
      action_type: 'quote_draft_ready',
      action_payload: {
        quote_id: quote.id,
        contact_id: contact?.id,
        task_id: task?.id,
        customer_name: body.customer.name,
        vehicle: body.vehicle,
        source: body.source
      },
      priority: 'high'
    });
    console.log('[create-lead-quote] Created AI action');

    // 6. Optionally trigger MightyMail follow-up sequence
    if (body.trigger_followup && body.customer.email) {
      try {
        const enrollResponse = await fetch(`${supabaseUrl}/functions/v1/enroll-quote-sequence`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            quote_id: quote.id,
            customer_email: body.customer.email,
            customer_name: body.customer.name
          })
        });
        
        if (enrollResponse.ok) {
          console.log('[create-lead-quote] Enrolled in follow-up sequence');
        }
      } catch (enrollError) {
        console.error('[create-lead-quote] Follow-up enrollment error:', enrollError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      quote_id: quote.id,
      quote_number: quote.quote_number,
      contact_id: contact?.id,
      task_id: task?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[create-lead-quote] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});