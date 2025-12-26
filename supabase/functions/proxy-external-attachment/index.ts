import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowlist of domains we'll proxy (to prevent open-proxy abuse)
const ALLOWED_DOMAINS = [
  "lookaside.fbsbx.com",
  "scontent.xx.fbcdn.net",
  "scontent-",
  "fbcdn.net",
  "cdninstagram.com",
  "instagram.f",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain ||
        parsed.hostname.endsWith("." + domain) ||
        parsed.hostname.includes(domain)
    );
  } catch {
    return false;
  }
}

// Generate a deterministic storage path from URL
function getStoragePath(url: string): string {
  // Use a simple hash of the URL for the filename
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]) | 0;
  }
  const hashStr = Math.abs(hash).toString(16);

  // Try to extract extension from URL
  const urlPath = new URL(url).pathname;
  const extMatch = urlPath.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : "bin";

  return `external-attachments/${hashStr}.${ext}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'url' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL is in allowlist
    if (!isAllowedUrl(url)) {
      console.log(`[proxy-external-attachment] Blocked non-allowed URL: ${url}`);
      return new Response(
        JSON.stringify({ error: "URL domain not allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const storagePath = getStoragePath(url);
    const bucketName = "media-library";

    // Check if file already exists in storage
    const { data: existingFile } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 3600); // 1 hour signed URL

    if (existingFile?.signedUrl) {
      console.log(`[proxy-external-attachment] Cache hit for: ${storagePath}`);
      return new Response(
        JSON.stringify({
          signedUrl: existingFile.signedUrl,
          cached: true,
          storagePath,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the external file server-side
    console.log(`[proxy-external-attachment] Fetching external URL: ${url}`);
    const externalResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WrapCommandBot/1.0)",
      },
    });

    if (!externalResponse.ok) {
      console.error(`[proxy-external-attachment] External fetch failed: ${externalResponse.status}`);
      
      // 403 specifically means the URL signature expired (common for FB/IG CDN)
      if (externalResponse.status === 403) {
        return new Response(
          JSON.stringify({
            error: "attachment_expired",
            message: "This attachment link has expired and cannot be retrieved. Instagram/Facebook media links expire after a short time.",
            status: 403,
          }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } } // 410 Gone
        );
      }
      
      return new Response(
        JSON.stringify({
          error: "fetch_failed",
          message: "Failed to fetch external file",
          status: externalResponse.status,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = externalResponse.headers.get("content-type") || "application/octet-stream";
    const fileBuffer = await externalResponse.arrayBuffer();

    console.log(`[proxy-external-attachment] Uploading to storage: ${storagePath} (${contentType}, ${fileBuffer.byteLength} bytes)`);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`[proxy-external-attachment] Upload error:`, uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to cache file", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URL for the cached file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error(`[proxy-external-attachment] Signed URL error:`, signedUrlError);
      return new Response(
        JSON.stringify({ error: "Failed to generate signed URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[proxy-external-attachment] Successfully cached and signed: ${storagePath}`);

    return new Response(
      JSON.stringify({
        signedUrl: signedUrlData.signedUrl,
        cached: false,
        storagePath,
        contentType,
        size: fileBuffer.byteLength,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[proxy-external-attachment] Error:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
