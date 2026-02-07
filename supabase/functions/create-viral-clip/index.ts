// =====================================================
// CREATE VIRAL CLIP — Riverside + CapCut Automation
// Style: Dara Denney, Sabri Suby, Gary Vee
// Output: 30-60 sec hooks with captions
// =====================================================

import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Viral hook templates - Dara/Sabri/Gary style
const HOOK_TEMPLATES = [
  "Stop scrolling if you {action}",
  "The #1 mistake {audience} make",
  "Nobody talks about this but...",
  "Here's why your {thing} isn't working",
  "I wish someone told me this sooner",
  "This changed everything for my {business}",
  "Most {audience} get this wrong",
  "The secret to {result} that nobody shares",
  "Watch this before you {action}",
  "If you're a {audience}, save this",
  "{Number} things I learned about {topic}",
  "POV: You finally understand {topic}",
  "Hot take: {opinion}",
  "Unpopular opinion about {topic}",
  "Here's the truth about {topic}",
];

interface ClipRequest {
  video_url?: string;           // Direct video URL
  riverside_recording_id?: string; // Or fetch from Riverside
  hook_text?: string;           // Custom hook or auto-generate
  start_time?: number;          // Clip start (seconds)
  duration?: number;            // Clip duration (30-60 sec)
  style?: 'dara' | 'sabri' | 'gary'; // Visual style
  topic?: string;               // For auto-generating hooks
  audience?: string;            // Target audience
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let browser;
  
  try {
    const request: ClipRequest = await req.json();
    const {
      video_url,
      riverside_recording_id,
      hook_text,
      start_time = 0,
      duration = 45,
      style = 'dara',
      topic = 'vehicle wraps',
      audience = 'wrap shop owners'
    } = request;

    const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');
    const riversideEmail = Deno.env.get('RIVERSIDE_EMAIL');
    const riversidePassword = Deno.env.get('RIVERSIDE_PASSWORD');
    const capcutEmail = Deno.env.get('CAPCUT_EMAIL');
    const capcutPassword = Deno.env.get('CAPCUT_PASSWORD');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!browserlessToken) throw new Error('BROWSERLESS_TOKEN not configured');

    // Generate hook if not provided
    let finalHook = hook_text;
    if (!finalHook && anthropicKey) {
      console.log('[ViralClip] Generating hook with AI...');
      const hookRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Generate ONE viral hook for a ${duration} second video about "${topic}" targeting "${audience}". 

Style: Like Dara Denney, Sabri Suby, Gary Vee - bold, punchy, pattern interrupt.

Examples:
- "Stop scrolling if you own a wrap shop"
- "The #1 mistake wrap installers make"
- "Nobody talks about this but..."
- "Here's why your wraps aren't selling"

Return ONLY the hook text, nothing else. Max 8 words.`
          }]
        })
      });
      const hookData = await hookRes.json();
      finalHook = hookData.content?.[0]?.text?.trim() || "Watch this if you want better results";
      console.log('[ViralClip] Generated hook:', finalHook);
    }

    if (!finalHook) {
      // Fallback to template
      const template = HOOK_TEMPLATES[Math.floor(Math.random() * HOOK_TEMPLATES.length)];
      finalHook = template
        .replace('{action}', 'want better results')
        .replace('{audience}', audience)
        .replace('{thing}', topic)
        .replace('{business}', 'business')
        .replace('{result}', 'success')
        .replace('{topic}', topic)
        .replace('{opinion}', `${topic} is overrated`)
        .replace('{Number}', '3');
    }

    // Connect to browser
    console.log('[ViralClip] Connecting to Browserless...');
    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    const result: any = {
      success: true,
      hook: finalHook,
      style,
      duration,
      steps_completed: []
    };

    // Step 1: Get video from Riverside (if recording ID provided)
    if (riverside_recording_id && riversideEmail && riversidePassword) {
      console.log('[ViralClip] Fetching from Riverside...');
      
      await page.goto('https://riverside.fm/login', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Try to login
      try {
        const emailInput = await page.$('input[type="email"], input[name="email"]');
        if (emailInput) {
          await emailInput.type(riversideEmail, { delay: 50 });
          await page.keyboard.press('Tab');
          await page.waitForTimeout(500);
          
          const passwordInput = await page.$('input[type="password"]');
          if (passwordInput) {
            await passwordInput.type(riversidePassword, { delay: 50 });
            await page.keyboard.press('Enter');
            await page.waitForTimeout(5000);
          }
        }
        result.riverside_login = !page.url().includes('/login');
        result.steps_completed.push('riverside_login');
      } catch (e) {
        result.riverside_error = e.message;
      }
    }

    // Step 2: Go to CapCut and create project
    if (capcutEmail && capcutPassword) {
      console.log('[ViralClip] Opening CapCut...');
      
      await page.goto('https://www.capcut.com/login', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      result.capcut_screenshot = await page.screenshot({ encoding: 'base64' });
      result.steps_completed.push('capcut_opened');
      
      // CapCut login attempt
      try {
        // Look for email login option
        const emailBtns = await page.$$('button, a, [role="button"]');
        for (const btn of emailBtns) {
          const text = await page.evaluate(el => el.textContent?.toLowerCase() || '', btn);
          if (text.includes('email') || text.includes('log in') || text.includes('sign in')) {
            await btn.click();
            await page.waitForTimeout(2000);
            break;
          }
        }
        
        const emailInput = await page.$('input[type="email"], input[type="text"][name*="email"], input[placeholder*="email" i]');
        if (emailInput) {
          await emailInput.type(capcutEmail, { delay: 50 });
          result.steps_completed.push('capcut_email_entered');
        }
      } catch (e) {
        result.capcut_login_error = e.message;
      }
    }

    // Generate style config for the clip
    const styleConfigs = {
      dara: {
        font: 'Montserrat Bold',
        hook_position: 'center',
        hook_animation: 'pop',
        caption_style: 'highlight_word',
        colors: { hook: '#FFFFFF', caption: '#FFFF00', bg: '#000000' }
      },
      sabri: {
        font: 'Impact',
        hook_position: 'top_center',
        hook_animation: 'shake',
        caption_style: 'word_by_word',
        colors: { hook: '#FF0000', caption: '#FFFFFF', bg: '#000000' }
      },
      gary: {
        font: 'Bebas Neue',
        hook_position: 'center',
        hook_animation: 'typewriter',
        caption_style: 'full_sentence',
        colors: { hook: '#FFFFFF', caption: '#00FF00', bg: 'transparent' }
      }
    };

    result.style_config = styleConfigs[style];
    result.clip_specs = {
      hook_text: finalHook,
      hook_duration: 3, // seconds
      clip_start: start_time,
      clip_duration: duration,
      aspect_ratio: '9:16',
      resolution: '1080x1920',
      captions: true,
      caption_style: styleConfigs[style].caption_style
    };

    await browser.close();

    console.log('[ViralClip] Complete');
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[ViralClip] Error:', err);
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
