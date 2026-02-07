import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let browser;
  
  try {
    const { template, text, images, action } = await req.json();
    
    const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');
    const canvaEmail = Deno.env.get('CANVA_EMAIL');
    const canvaPassword = Deno.env.get('CANVA_PASSWORD');
    
    if (!browserlessToken) {
      throw new Error('BROWSERLESS_TOKEN not configured');
    }
    if (!canvaEmail || !canvaPassword) {
      throw new Error('CANVA_EMAIL or CANVA_PASSWORD not configured');
    }

    console.log('[create-canva-ad] Connecting to Browserless...');
    
    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to Canva login
    console.log('[create-canva-ad] Navigating to Canva login...');
    await page.goto('https://www.canva.com/login', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Take screenshot before login
    const beforeLogin = await page.screenshot({ encoding: 'base64' });
    
    // Try to find and click "Continue with email" or email input
    try {
      // Look for email input directly
      const emailSelector = 'input[type="email"], input[name="email"], input[placeholder*="email" i]';
      await page.waitForSelector(emailSelector, { timeout: 10000 });
      
      console.log('[create-canva-ad] Found email input, entering credentials...');
      await page.type(emailSelector, canvaEmail, { delay: 50 });
      
      // Look for password field
      const passwordSelector = 'input[type="password"], input[name="password"]';
      await page.waitForSelector(passwordSelector, { timeout: 5000 });
      await page.type(passwordSelector, canvaPassword, { delay: 50 });
      
      // Find and click login/submit button
      const submitSelector = 'button[type="submit"], button:has-text("Log in"), button:has-text("Continue")';
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
      } else {
        // Try pressing Enter
        await page.keyboard.press('Enter');
      }
      
      console.log('[create-canva-ad] Submitted login form...');
      
      // Wait for navigation after login
      await page.waitForTimeout(5000);
      
    } catch (loginErr) {
      console.log('[create-canva-ad] Standard login failed, trying alternative...', loginErr.message);
      
      // Try clicking "Continue with email" button first
      try {
        const continueWithEmail = await page.$('button:has-text("Continue with email"), [data-testid="email-login-button"]');
        if (continueWithEmail) {
          await continueWithEmail.click();
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        console.log('[create-canva-ad] No "Continue with email" button found');
      }
    }
    
    // Take screenshot after login attempt
    const afterLogin = await page.screenshot({ encoding: 'base64' });
    
    // Check if we're logged in by looking for dashboard elements
    const currentUrl = page.url();
    const isLoggedIn = currentUrl.includes('/design') || currentUrl.includes('/folder') || !currentUrl.includes('/login');
    
    console.log('[create-canva-ad] Current URL:', currentUrl);
    console.log('[create-canva-ad] Logged in:', isLoggedIn);
    
    // If action is specified, perform it
    let result: any = {
      success: true,
      logged_in: isLoggedIn,
      current_url: currentUrl,
      screenshot: afterLogin
    };
    
    if (isLoggedIn && template) {
      console.log('[create-canva-ad] Searching for template:', template);
      
      // Navigate to search
      await page.goto(`https://www.canva.com/search/templates?q=${encodeURIComponent(template)}`, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await page.waitForTimeout(3000);
      
      result.template_search = await page.screenshot({ encoding: 'base64' });
      result.search_url = page.url();
    }
    
    await browser.close();
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[create-canva-ad] Error:', err);
    
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
