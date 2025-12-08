import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteUrl, instagramHandle, facebookPage, tiktokHandle, youtubeChannel } = await req.json();

    const results: Record<string, string> = {};
    const errors: string[] = [];

    // Scrape website
    if (websiteUrl) {
      try {
        console.log("Scraping website:", websiteUrl);
        const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TradeDNA/1.0)',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });
        
        if (response.ok) {
          const html = await response.text();
          // Extract text content from HTML (basic extraction)
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 15000); // Limit to 15k chars
          
          results.website = textContent;
          console.log("Website scraped, length:", textContent.length);
        } else {
          errors.push(`Website returned ${response.status}`);
        }
      } catch (e) {
        const error = e instanceof Error ? e.message : "Unknown error";
        console.error("Website scrape error:", error);
        errors.push(`Failed to scrape website: ${error}`);
      }
    }

    // Scrape Instagram using Graph API
    if (instagramHandle) {
      const accessToken = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
      if (accessToken) {
        try {
          const handle = instagramHandle.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '');
          console.log("Fetching Instagram data for:", handle);
          
          // Get user media captions from Instagram Graph API
          const mediaResponse = await fetch(
            `https://graph.instagram.com/me/media?fields=caption,timestamp,media_type&access_token=${accessToken}&limit=20`
          );
          
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            const captions = mediaData.data
              ?.filter((post: any) => post.caption)
              ?.map((post: any) => post.caption)
              ?.join('\n\n---\n\n') || '';
            
            if (captions) {
              results.instagram = captions;
              console.log("Instagram captions fetched, count:", mediaData.data?.length);
            } else {
              results.instagram = `Instagram @${handle} connected but no captions found`;
            }
          } else {
            const errorText = await mediaResponse.text();
            console.error("Instagram API error:", errorText);
            errors.push(`Instagram API error: ${mediaResponse.status}`);
          }
        } catch (e) {
          const error = e instanceof Error ? e.message : "Unknown error";
          console.error("Instagram fetch error:", error);
          errors.push(`Instagram: ${error}`);
        }
      } else {
        const handle = instagramHandle.replace('@', '');
        results.instagram = `Instagram handle: @${handle} (Add INSTAGRAM_ACCESS_TOKEN for full content)`;
      }
    }

    // Note about other platforms
    if (facebookPage) {
      results.facebook = `Facebook page: ${facebookPage} (Full scraping requires Facebook API access)`;
    }
    if (tiktokHandle) {
      results.tiktok = `TikTok: ${tiktokHandle} (Full scraping requires TikTok API access)`;
    }
    if (youtubeChannel) {
      results.youtube = `YouTube: ${youtubeChannel} (Full scraping requires YouTube API access)`;
    }

    return new Response(JSON.stringify({
      success: true,
      scrapedContent: results,
      errors: errors.length > 0 ? errors : undefined,
      note: "Website content scraped. Social media platforms require API access for full content."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("Scrape error:", err);
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
