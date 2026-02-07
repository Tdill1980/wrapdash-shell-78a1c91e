import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, text, images } = await req.json();
    
    const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');
    if (!browserlessToken) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'BROWSERLESS_TOKEN not configured' 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log('[create-canva-ad] Connecting to Browserless...');
    
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to Canva
    console.log('[create-canva-ad] Navigating to Canva...');
    await page.goto('https://www.canva.com', { waitUntil: 'networkidle2' });
    
    // TODO: Add Canva login and template automation
    // This requires:
    // 1. Canva credentials stored as secrets
    // 2. Template selection logic
    // 3. Text/image replacement logic
    
    // For now, take a screenshot as proof of concept
    const screenshot = await page.screenshot({ encoding: 'base64' });
    
    await browser.close();
    
    console.log('[create-canva-ad] Success');
    
    return new Response(JSON.stringify({ 
      success: true, 
      image: screenshot,
      message: 'Connected to Canva successfully. Full automation requires login credentials.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[create-canva-ad] Error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
