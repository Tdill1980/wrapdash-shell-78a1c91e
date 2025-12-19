import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting email quote backfill...');

    // Get email conversations from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        contact_id,
        subject,
        metadata,
        contacts (
          email,
          name
        )
      `)
      .eq('channel', 'email')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
      throw convError;
    }

    console.log(`Found ${conversations?.length || 0} email conversations from last 7 days`);

    // Pricing intent keywords
    const pricingKeywords = ['price', 'pricing', 'quote', 'cost', 'how much', 'estimate', 'wrap', 'ppf', 'tint', 'ceramic'];

    const results = {
      processed: 0,
      quotesCreated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const conv of conversations || []) {
      try {
        const contact = (conv as any).contacts;
        if (!contact?.email) {
          console.log(`Skipping conversation ${conv.id} - no contact email`);
          results.skipped++;
          continue;
        }

        // Get messages for this conversation
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('content, sender')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });

        if (msgError) {
          console.error(`Error fetching messages for ${conv.id}:`, msgError);
          results.errors.push(`Failed to fetch messages for ${conv.id}`);
          continue;
        }

        // Combine all message content
        const allContent = [
          conv.subject || '',
          ...(messages || []).map(m => m.content)
        ].join(' ').toLowerCase();

        // Check for pricing intent
        const hasPricingIntent = pricingKeywords.some(keyword => allContent.includes(keyword));

        if (!hasPricingIntent) {
          console.log(`Skipping conversation ${conv.id} - no pricing intent detected`);
          results.skipped++;
          continue;
        }

        // Check if quote already exists for this customer email
        const { data: existingQuotes } = await supabase
          .from('quotes')
          .select('id')
          .eq('customer_email', contact.email)
          .gte('created_at', sevenDaysAgo.toISOString())
          .limit(1);

        if (existingQuotes && existingQuotes.length > 0) {
          console.log(`Skipping ${contact.email} - quote already exists`);
          results.skipped++;
          continue;
        }

        // Extract vehicle info from content using simple parsing
        const vehicleInfo = extractVehicleInfo(allContent);
        
        console.log(`Creating quote for ${contact.email}:`, vehicleInfo);

        // Call ai-auto-quote to generate the quote
        const { data: quoteResult, error: quoteError } = await supabase.functions.invoke('ai-auto-quote', {
          body: {
            vehicleMake: vehicleInfo.make || 'Unknown',
            vehicleModel: vehicleInfo.model || 'Vehicle',
            vehicleYear: vehicleInfo.year || new Date().getFullYear(),
            vehicleType: vehicleInfo.type || 'sedan',
            wrapType: vehicleInfo.wrapType || 'full',
            customerEmail: contact.email,
            customerName: contact.name || 'Customer',
            source: 'email_backfill',
            notes: `Backfilled from email conversation. Original subject: ${conv.subject || 'No subject'}`,
          },
        });

        if (quoteError) {
          console.error(`Error creating quote for ${contact.email}:`, quoteError);
          results.errors.push(`Failed to create quote for ${contact.email}: ${quoteError.message}`);
          continue;
        }

        console.log(`Quote created for ${contact.email}:`, quoteResult);
        results.quotesCreated++;
        results.processed++;

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error processing conversation ${conv.id}:`, err);
        results.errors.push(`Error processing ${conv.id}: ${errorMessage}`);
      }
    }

    console.log('Backfill complete:', results);

    return new Response(JSON.stringify({
      success: true,
      message: `Backfill complete. Created ${results.quotesCreated} quotes.`,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractVehicleInfo(content: string): {
  make?: string;
  model?: string;
  year?: number;
  type?: string;
  wrapType?: string;
} {
  const result: {
    make?: string;
    model?: string;
    year?: number;
    type?: string;
    wrapType?: string;
  } = {};

  // Common vehicle makes
  const makes = ['toyota', 'honda', 'ford', 'chevrolet', 'chevy', 'bmw', 'mercedes', 'audi', 'lexus', 'porsche', 'tesla', 'nissan', 'dodge', 'jeep', 'mustang', 'corvette', 'camaro', 'yamaha', 'kawasaki', 'harley', 'ducati', 'suzuki'];
  
  for (const make of makes) {
    if (content.includes(make)) {
      result.make = make.charAt(0).toUpperCase() + make.slice(1);
      if (make === 'chevy') result.make = 'Chevrolet';
      break;
    }
  }

  // Extract year (4 digit number between 1990-2025)
  const yearMatch = content.match(/\b(199\d|20[0-2]\d)\b/);
  if (yearMatch) {
    result.year = parseInt(yearMatch[1]);
  }

  // Common models
  const models = ['r1', 'r6', 'mustang', 'camaro', 'corvette', 'civic', 'accord', 'camry', 'model 3', 'model s', 'model x', 'model y', 'f150', 'f-150', 'silverado', 'ram', 'tacoma', 'tundra', 'wrangler', 'lx570', 'rx350', 'gx460'];
  
  for (const model of models) {
    if (content.includes(model)) {
      result.model = model.toUpperCase();
      break;
    }
  }

  // Determine vehicle type
  const motorcycleKeywords = ['motorcycle', 'bike', 'r1', 'r6', 'yamaha', 'kawasaki', 'harley', 'ducati', 'suzuki'];
  const truckKeywords = ['truck', 'f150', 'f-150', 'silverado', 'ram', 'tacoma', 'tundra'];
  const suvKeywords = ['suv', 'wrangler', 'lx570', 'rx350', 'gx460', 'explorer', 'tahoe'];

  if (motorcycleKeywords.some(k => content.includes(k))) {
    result.type = 'motorcycle';
  } else if (truckKeywords.some(k => content.includes(k))) {
    result.type = 'truck';
  } else if (suvKeywords.some(k => content.includes(k))) {
    result.type = 'suv';
  } else {
    result.type = 'sedan';
  }

  // Determine wrap type
  if (content.includes('full wrap') || content.includes('full body')) {
    result.wrapType = 'full';
  } else if (content.includes('partial') || content.includes('door') || content.includes('panel') || content.includes('stripe')) {
    result.wrapType = 'partial';
  } else if (content.includes('ppf') || content.includes('protection')) {
    result.wrapType = 'ppf';
  } else if (content.includes('tint')) {
    result.wrapType = 'tint';
  } else {
    result.wrapType = 'full';
  }

  return result;
}
