/**
 * setup-clubwpw-tables - Creates ClubWPW Vault + Wrap of the Week tables
 * 
 * Run once to set up the database schema for:
 * 1. Monthly design drops (Vault)
 * 2. Wrap of the Week voting system
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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

    const results: string[] = [];

    // =====================================================
    // 1. CLUBWPW VAULT DROPS TABLE
    // =====================================================
    const { error: vaultError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS clubwpw_vault_drops (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          
          -- Design Info
          design_name TEXT NOT NULL,
          design_description TEXT,
          designer_name TEXT,
          designer_instagram TEXT,
          
          -- Preview Images
          preview_image_url TEXT NOT NULL,
          hero_render_url TEXT,
          thumbnail_url TEXT,
          
          -- Downloadable Files (by size)
          files JSONB DEFAULT '{}',
          -- Format: { "small": "url", "medium": "url", "large": "url", "xl": "url" }
          
          -- Panel Type
          panel_type TEXT DEFAULT 'full_panel',
          -- Options: full_panel, 2_sides, hood, roof, rear
          
          -- Scheduling
          featured_month TEXT NOT NULL,
          -- Format: "2026-02" for February 2026
          starts_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ,
          
          -- Status
          status TEXT DEFAULT 'draft',
          -- Options: draft, scheduled, active, expired
          is_exclusive BOOLEAN DEFAULT true,
          
          -- Stats
          download_count INTEGER DEFAULT 0,
          view_count INTEGER DEFAULT 0,
          restyle_clicks INTEGER DEFAULT 0,
          
          -- Tags
          tags TEXT[] DEFAULT '{}',
          -- e.g., ['exclusive', 'japanese', 'dragon', 'colorful']
          
          -- Timestamps
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_vault_drops_month ON clubwpw_vault_drops(featured_month);
        CREATE INDEX IF NOT EXISTS idx_vault_drops_status ON clubwpw_vault_drops(status);
      `
    });

    if (vaultError) {
      // Table might already exist, try direct creation
      const { error: directError } = await supabase.from('clubwpw_vault_drops').select('id').limit(1);
      if (directError && directError.code === '42P01') {
        results.push('❌ clubwpw_vault_drops: Failed to create');
      } else {
        results.push('✅ clubwpw_vault_drops: Already exists or created');
      }
    } else {
      results.push('✅ clubwpw_vault_drops: Created');
    }

    // =====================================================
    // 2. WRAP OF THE WEEK - NOMINEES TABLE
    // =====================================================
    const { error: nomineesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS wotw_nominees (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          
          -- Wrap Info
          wrap_title TEXT,
          wrap_description TEXT,
          
          -- Artist Info
          artist_name TEXT NOT NULL,
          artist_instagram TEXT NOT NULL,
          artist_email TEXT,
          
          -- Images
          image_urls TEXT[] NOT NULL DEFAULT '{}',
          hero_image_url TEXT,
          
          -- Vehicle Info
          vehicle_make TEXT,
          vehicle_model TEXT,
          vehicle_year TEXT,
          
          -- Voting Period
          week_of TEXT NOT NULL,
          -- Format: "2026-W06" for week 6 of 2026
          voting_starts TIMESTAMPTZ,
          voting_ends TIMESTAMPTZ,
          
          -- Status
          status TEXT DEFAULT 'pending',
          -- Options: pending, nominated, voting, winner, runner_up, archived
          is_finalist BOOLEAN DEFAULT false,
          is_winner BOOLEAN DEFAULT false,
          
          -- Votes
          vote_count INTEGER DEFAULT 0,
          
          -- Printed by WPW?
          printed_by_wpw BOOLEAN DEFAULT false,
          wpw_order_number TEXT,
          
          -- Social
          instagram_post_url TEXT,
          notified_at TIMESTAMPTZ,
          
          -- Timestamps
          submitted_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_wotw_week ON wotw_nominees(week_of);
        CREATE INDEX IF NOT EXISTS idx_wotw_status ON wotw_nominees(status);
        CREATE INDEX IF NOT EXISTS idx_wotw_finalist ON wotw_nominees(is_finalist);
      `
    });

    if (nomineesError) {
      results.push('⚠️ wotw_nominees: May already exist');
    } else {
      results.push('✅ wotw_nominees: Created');
    }

    // =====================================================
    // 3. WRAP OF THE WEEK - VOTES TABLE
    // =====================================================
    const { error: votesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS wotw_votes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          
          nominee_id UUID NOT NULL REFERENCES wotw_nominees(id) ON DELETE CASCADE,
          
          -- Voter Info (anonymous but trackable)
          voter_fingerprint TEXT NOT NULL,
          -- Hash of IP + User Agent for duplicate prevention
          voter_email TEXT,
          voter_ip TEXT,
          
          -- Week
          week_of TEXT NOT NULL,
          
          -- Timestamps
          voted_at TIMESTAMPTZ DEFAULT NOW(),
          
          -- Prevent duplicate votes per week
          UNIQUE(voter_fingerprint, week_of)
        );
        
        CREATE INDEX IF NOT EXISTS idx_votes_nominee ON wotw_votes(nominee_id);
        CREATE INDEX IF NOT EXISTS idx_votes_week ON wotw_votes(week_of);
      `
    });

    if (votesError) {
      results.push('⚠️ wotw_votes: May already exist');
    } else {
      results.push('✅ wotw_votes: Created');
    }

    // =====================================================
    // 4. VAULT DOWNLOADS TABLE (tracking)
    // =====================================================
    const { error: downloadsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS clubwpw_downloads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          
          drop_id UUID REFERENCES clubwpw_vault_drops(id) ON DELETE SET NULL,
          
          -- Downloader Info
          email TEXT NOT NULL,
          name TEXT,
          company_name TEXT,
          instagram TEXT,
          
          -- Download Details
          size_downloaded TEXT,
          -- Options: small, medium, large, xl
          
          -- Source
          source TEXT DEFAULT 'shopflow',
          -- Options: shopflow, direct, email, social
          
          -- Timestamps
          downloaded_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_downloads_drop ON clubwpw_downloads(drop_id);
        CREATE INDEX IF NOT EXISTS idx_downloads_email ON clubwpw_downloads(email);
      `
    });

    if (downloadsError) {
      results.push('⚠️ clubwpw_downloads: May already exist');
    } else {
      results.push('✅ clubwpw_downloads: Created');
    }

    // =====================================================
    // 5. Enable RLS and create policies
    // =====================================================
    await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS
        ALTER TABLE clubwpw_vault_drops ENABLE ROW LEVEL SECURITY;
        ALTER TABLE wotw_nominees ENABLE ROW LEVEL SECURITY;
        ALTER TABLE wotw_votes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE clubwpw_downloads ENABLE ROW LEVEL SECURITY;
        
        -- Public read for active drops
        DROP POLICY IF EXISTS "Public can view active drops" ON clubwpw_vault_drops;
        CREATE POLICY "Public can view active drops" ON clubwpw_vault_drops
          FOR SELECT USING (status = 'active');
        
        -- Public read for finalists
        DROP POLICY IF EXISTS "Public can view finalists" ON wotw_nominees;
        CREATE POLICY "Public can view finalists" ON wotw_nominees
          FOR SELECT USING (is_finalist = true OR is_winner = true);
        
        -- Public can vote
        DROP POLICY IF EXISTS "Public can vote" ON wotw_votes;
        CREATE POLICY "Public can vote" ON wotw_votes
          FOR INSERT WITH CHECK (true);
        
        -- Public can download (insert tracking)
        DROP POLICY IF EXISTS "Public can download" ON clubwpw_downloads;
        CREATE POLICY "Public can download" ON clubwpw_downloads
          FOR INSERT WITH CHECK (true);
      `
    });

    results.push('✅ RLS policies: Created');

    console.log('ClubWPW tables setup complete:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        tables: ['clubwpw_vault_drops', 'wotw_nominees', 'wotw_votes', 'clubwpw_downloads']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
