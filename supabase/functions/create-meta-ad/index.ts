import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Meta Ad Factory - Bulk create high-converting Meta ads
 * Uses Bannerbear for rendering with good fonts and templates
 * 
 * Supports: Static ads, Carousels, Reels/Video ads
 */

interface AdVariation {
  hook: string;
  body?: string;
  cta: string;
  offer?: string;
}

interface CreateAdRequest {
  action: 'create' | 'bulk_create' | 'list_templates' | 'get_status';
  
  // For create/bulk_create
  template_id?: string;
  format?: 'static' | 'carousel' | 'reel';
  
  // Assets
  hero_image_url?: string;
  logo_url?: string;
  product_images?: string[];
  video_url?: string;
  
  // Copy variations
  variations?: AdVariation[];
  
  // Or let AI generate
  product_name?: string;
  product_benefit?: string;
  target_audience?: string;
  ad_angle?: 'problem_solution' | 'social_proof' | 'urgency' | 'transformation' | 'authority';
  num_variations?: number;
  
  // For get_status
  render_ids?: string[];
}

// Ad copy frameworks for AI generation
const AD_FRAMEWORKS = {
  problem_solution: {
    hooks: [
      "Tired of {problem}?",
      "Still struggling with {problem}?",
      "{Problem} ruining your {thing}?",
      "What if you never had to deal with {problem} again?",
      "The {problem} problem - solved.",
    ],
    ctas: ["Shop Now", "Get Yours", "Fix It Today", "Learn More", "See How"]
  },
  social_proof: {
    hooks: [
      "Join {number}+ happy customers",
      "See why {audience} love this",
      "Rated 5 stars by {audience}",
      "The #1 choice for {audience}",
      "{Number} wraps installed. Zero complaints.",
    ],
    ctas: ["Join Them", "See Reviews", "Shop Best Sellers", "Get Started"]
  },
  urgency: {
    hooks: [
      "Limited time: {offer}",
      "Ends tonight - {offer}",
      "Only {number} left at this price",
      "Flash sale: {discount}% off",
      "Don't miss out - {offer}",
    ],
    ctas: ["Claim Now", "Shop Sale", "Get Deal", "Buy Now", "Don't Wait"]
  },
  transformation: {
    hooks: [
      "From boring to {result}",
      "Transform your {thing} in {time}",
      "Before & after - the difference is real",
      "Go from {before} to {after}",
      "Your {thing} deserves better",
    ],
    ctas: ["Transform Yours", "See Results", "Start Now", "Get The Look"]
  },
  authority: {
    hooks: [
      "The pros use {product}",
      "Industry-leading {feature}",
      "Trusted by {audience} nationwide",
      "Premium quality. Unbeatable price.",
      "Made in USA. Built to last.",
    ],
    ctas: ["Shop Pro Grade", "See Why", "Go Premium", "Get Quality"]
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: CreateAdRequest = await req.json();
    const { action } = payload;

    const bannerbearKey = Deno.env.get('BANNERBEAR_API_KEY');
    if (!bannerbearKey && action !== 'list_templates') {
      throw new Error('BANNERBEAR_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ============ LIST TEMPLATES ============
    if (action === 'list_templates') {
      const res = await fetch('https://api.bannerbear.com/v2/templates', {
        headers: { Authorization: `Bearer ${bannerbearKey}` }
      });
      const templates = await res.json();
      
      return new Response(JSON.stringify({ 
        success: true, 
        templates: templates.map((t: any) => ({
          id: t.uid,
          name: t.name,
          width: t.width,
          height: t.height,
          preview_url: t.preview_url,
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============ GET RENDER STATUS ============
    if (action === 'get_status') {
      const { render_ids } = payload;
      if (!render_ids?.length) throw new Error('Missing render_ids');

      const statuses = await Promise.all(render_ids.map(async (id: string) => {
        const res = await fetch(`https://api.bannerbear.com/v2/images/${id}`, {
          headers: { Authorization: `Bearer ${bannerbearKey}` }
        });
        return res.json();
      }));

      return new Response(JSON.stringify({ 
        success: true, 
        renders: statuses.map((s: any) => ({
          id: s.uid,
          status: s.status,
          image_url: s.image_url,
          created_at: s.created_at,
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============ CREATE AD(S) ============
    if (action === 'create' || action === 'bulk_create') {
      const {
        template_id,
        format = 'static',
        hero_image_url,
        logo_url,
        product_images,
        variations,
        product_name,
        product_benefit,
        target_audience,
        ad_angle = 'problem_solution',
        num_variations = 5,
      } = payload;

      if (!template_id) throw new Error('Missing template_id');

      // Generate variations if not provided
      let adVariations = variations;
      if (!adVariations || adVariations.length === 0) {
        // Use AI to generate variations based on angle
        const framework = AD_FRAMEWORKS[ad_angle];
        adVariations = [];
        
        for (let i = 0; i < num_variations; i++) {
          const hookTemplate = framework.hooks[i % framework.hooks.length];
          const cta = framework.ctas[i % framework.ctas.length];
          
          // Simple template replacement (in production, use AI for this)
          let hook = hookTemplate
            .replace('{problem}', product_benefit || 'this problem')
            .replace('{thing}', 'vehicle')
            .replace('{audience}', target_audience || 'customers')
            .replace('{product}', product_name || 'this')
            .replace('{number}', String(Math.floor(Math.random() * 9000) + 1000))
            .replace('{result}', 'stunning')
            .replace('{offer}', '20% off')
            .replace('{discount}', '20')
            .replace('{time}', '24 hours')
            .replace('{before}', 'dull')
            .replace('{after}', 'showroom')
            .replace('{feature}', 'quality');
          
          adVariations.push({ hook, cta });
        }
      }

      console.log(`[create-meta-ad] Creating ${adVariations.length} ${format} ads`);

      // Create renders for each variation
      const renderPromises = adVariations.map(async (variation, index) => {
        const modifications = [
          { name: 'hook_text', text: variation.hook },
          { name: 'cta_text', text: variation.cta },
        ];

        if (variation.body) {
          modifications.push({ name: 'body_text', text: variation.body });
        }
        if (variation.offer) {
          modifications.push({ name: 'offer_text', text: variation.offer });
        }
        if (hero_image_url) {
          modifications.push({ name: 'hero_image', image_url: hero_image_url });
        }
        if (logo_url) {
          modifications.push({ name: 'logo', image_url: logo_url });
        }

        const res = await fetch('https://api.bannerbear.com/v2/images', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${bannerbearKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template: template_id,
            modifications,
            metadata: { variation_index: index, format },
          }),
        });

        const result = await res.json();
        return {
          variation_index: index,
          render_id: result.uid,
          status: result.status,
          hook: variation.hook,
          cta: variation.cta,
        };
      });

      const renders = await Promise.all(renderPromises);

      // Log to activity
      await supabase.from('wren_activity_log').insert({
        activity_type: 'meta_ad_created',
        description: `Created ${renders.length} ${format} ad variations`,
        metadata: { 
          template_id, 
          format, 
          render_count: renders.length,
          render_ids: renders.map(r => r.render_id),
        },
      });

      return new Response(JSON.stringify({
        success: true,
        message: `Created ${renders.length} ad variations`,
        renders,
        // Poll these IDs to get final image URLs
        render_ids: renders.map(r => r.render_id),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (err) {
    console.error('[create-meta-ad] Error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
    }), {
      status: 200, // Return 200 so client can see error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
