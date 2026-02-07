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
    const { template, text, images, action, debug } = await req.json();
    
    const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');
    const canvaEmail = Deno.env.get('CANVA_EMAIL');
    const canvaPassword = Deno.env.get('CANVA_PASSWORD');
    
    if (!browserlessToken) throw new Error('BROWSERLESS_TOKEN not configured');
    if (!canvaEmail || !canvaPassword) throw new Error('CANVA credentials not configured');

    console.log('[Canva] Connecting to Browserless...');
    
    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`
    });
    
    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Go to Canva login
    console.log('[Canva] Navigating to login...');
    await page.goto('https://www.canva.com/login', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const screenshots: Record<string, string> = {};
    if (debug) screenshots.step1_initial = await page.screenshot({ encoding: 'base64' });
    
    // Step 1: Click "Continue with email" if it exists
    console.log('[Canva] Looking for Continue with email button...');
    try {
      // Wait for any button/link with email text
      const emailButtons = await page.$$('button, a, [role="button"]');
      for (const btn of emailButtons) {
        const text = await page.evaluate(el => el.textContent?.toLowerCase() || '', btn);
        if (text.includes('email') && (text.includes('continue') || text.includes('log in'))) {
          console.log('[Canva] Found email button, clicking...');
          await btn.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
    } catch (e) {
      console.log('[Canva] No separate email button found');
    }
    
    if (debug) screenshots.step2_after_email_btn = await page.screenshot({ encoding: 'base64' });
    
    // Step 2: Enter email
    console.log('[Canva] Looking for email input...');
    try {
      // Try multiple selectors for email input
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[autocomplete="email"]',
        'input[placeholder*="email" i]',
        'input[id*="email" i]'
      ];
      
      let emailInput = null;
      for (const selector of emailSelectors) {
        emailInput = await page.$(selector);
        if (emailInput) {
          console.log('[Canva] Found email input with selector:', selector);
          break;
        }
      }
      
      if (emailInput) {
        await emailInput.click();
        await page.waitForTimeout(500);
        await emailInput.type(canvaEmail, { delay: 100 });
        console.log('[Canva] Entered email');
        
        // Press Enter or click Continue
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
      } else {
        console.log('[Canva] No email input found');
      }
    } catch (e) {
      console.log('[Canva] Email input error:', e.message);
    }
    
    if (debug) screenshots.step3_after_email = await page.screenshot({ encoding: 'base64' });
    
    // Step 3: Enter password
    console.log('[Canva] Looking for password input...');
    try {
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[autocomplete="current-password"]'
      ];
      
      let passwordInput = null;
      for (const selector of passwordSelectors) {
        passwordInput = await page.$(selector);
        if (passwordInput) {
          console.log('[Canva] Found password input');
          break;
        }
      }
      
      if (passwordInput) {
        await passwordInput.click();
        await page.waitForTimeout(500);
        await passwordInput.type(canvaPassword, { delay: 100 });
        console.log('[Canva] Entered password');
        
        // Submit
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);
      } else {
        console.log('[Canva] No password input found - may need 2FA or different flow');
      }
    } catch (e) {
      console.log('[Canva] Password error:', e.message);
    }
    
    if (debug) screenshots.step4_after_password = await page.screenshot({ encoding: 'base64' });
    
    // Check final state
    const finalUrl = page.url();
    const isLoggedIn = !finalUrl.includes('/login') && !finalUrl.includes('/signup');
    
    console.log('[Canva] Final URL:', finalUrl);
    console.log('[Canva] Logged in:', isLoggedIn);
    
    // Take final screenshot
    screenshots.final = await page.screenshot({ encoding: 'base64' });
    
    // If logged in and template requested, search for it
    if (isLoggedIn && template) {
      console.log('[Canva] Searching templates:', template);
      await page.goto(`https://www.canva.com/search/templates?q=${encodeURIComponent(template)}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      await page.waitForTimeout(3000);
      screenshots.template_search = await page.screenshot({ encoding: 'base64' });
    }
    
    await browser.close();
    
    return new Response(JSON.stringify({
      success: true,
      logged_in: isLoggedIn,
      current_url: finalUrl,
      screenshots: debug ? screenshots : { final: screenshots.final }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[Canva] Error:', err);
    if (browser) try { await browser.close(); } catch (e) {}
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
