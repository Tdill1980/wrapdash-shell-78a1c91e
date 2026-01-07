// supabase/functions/generate-approveflow-proof-pdf/index.ts
// ============================================
// ApproveFlow PDF Generator - Server-Side Artifact
// ============================================
// This function generates the immutable approval PDF.
// Branding, disclaimer, and layout are HARDCODED - never AI-generated.
// N/A fields are NEVER rendered.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// HARDCODED CONSTANTS (OS-OWNED, NEVER EDITABLE)
// ============================================

const BRANDING = {
  systemName: "WrapCommand AI™",
  toolName: "ApproveFlow™",
  tagline: "Design Approval Proof"
};

// Mandatory disclaimer - NEVER AI-generated, NEVER editable
const DISCLAIMER_TEXT = [
  "IMPORTANT: Please review all design elements carefully before production.",
  "• Colors on screen may vary from printed output due to material, lighting, and calibration differences.",
  "• Verify spelling, phone numbers, and business details.",
  "• Template fit may vary by trim level or vehicle options; verify against the physical vehicle.",
  "• Approval authorizes production based on the specifications shown on this proof.",
].join("\n");

const FULL_TERMS = `TERMS & CONDITIONS

By approving this design proof, you acknowledge and agree to the following:

1. COLOR DISCLAIMER: Digital color representations are approximations only. Final printed colors may vary due to monitor calibration, material properties, lighting conditions, and printing processes.

2. DESIGN VERIFICATION: You have verified all text, logos, images, and design elements for accuracy including spelling, phone numbers, addresses, and business information.

3. VEHICLE FIT: Template dimensions are based on standard vehicle specifications. Variations may exist between trim levels, model years, and aftermarket modifications. Final installation may require minor adjustments.

4. PRODUCTION AUTHORIZATION: Your approval authorizes WePrintWraps.com to proceed with production. Changes requested after approval may result in additional charges and extended turnaround times.

5. LIABILITY: WePrintWraps.com is not responsible for errors in customer-provided content or errors approved by the customer on this proof.

6. PROOF VALIDITY: This proof is valid for 30 days from the date of generation.`;

// View grid order (fixed layout)
const VIEW_ORDER = [
  { key: "driver", label: "Driver Side" },
  { key: "front", label: "Front" },
  { key: "rear", label: "Rear" },
  { key: "passenger", label: "Passenger Side" },
  { key: "top", label: "Top" },
  { key: "detail", label: "Detail" }
];

interface ViewRow {
  view_key: string;
  label: string;
  image_url: string;
}

interface ProductionSpecs {
  wheelbase?: string;
  wheelbase_is_na?: boolean;
  roof_height?: string;
  roof_height_is_na?: boolean;
  body_length?: string;
  body_length_is_na?: boolean;
  scale_reference?: string;
  scale_reference_is_na?: boolean;
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[generate-approveflow-proof-pdf] Image fetch failed: ${url} - ${res.status}`);
      return null;
    }
    return new Uint8Array(await res.arrayBuffer());
  } catch (e) {
    console.error(`[generate-approveflow-proof-pdf] Image fetch error: ${url}`, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proof_version_id } = await req.json();

    if (!proof_version_id) {
      return new Response(
        JSON.stringify({ success: false, error: "proof_version_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-approveflow-proof-pdf] Generating PDF for proof: ${proof_version_id}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch proof version
    const { data: pv, error: pvErr } = await supabase
      .from("approveflow_proof_versions")
      .select("*")
      .eq("id", proof_version_id)
      .single();

    if (pvErr || !pv) {
      throw new Error(pvErr?.message || "Proof version not found");
    }

    // Fetch views
    const { data: views, error: viewsErr } = await supabase
      .from("approveflow_proof_views")
      .select("view_key, label, image_url")
      .eq("proof_version_id", proof_version_id);

    if (viewsErr) {
      throw new Error(viewsErr.message);
    }

    // Fetch production specs (optional fields)
    const { data: specs } = await supabase
      .from("approveflow_production_specs")
      .select("*")
      .eq("proof_version_id", proof_version_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const viewMap = new Map<string, ViewRow>();
    (views || []).forEach((v: ViewRow) => viewMap.set(v.view_key, v));

    // Create PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([792, 612]); // Landscape letter
    const { width, height } = page.getSize();

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const margin = 36;
    const black = rgb(0, 0, 0);
    const gray = rgb(0.35, 0.35, 0.35);
    const lightGray = rgb(0.85, 0.85, 0.85);
    const white = rgb(1, 1, 1);
    const darkBg = rgb(0.06, 0.06, 0.06);

    // ============================================
    // HEADER - HARDCODED BRANDING
    // ============================================

    // Left: Branding (LOCKED)
    page.drawText(BRANDING.systemName, {
      x: margin,
      y: height - 48,
      size: 18,
      font: fontBold,
      color: black
    });
    page.drawText(BRANDING.toolName, {
      x: margin,
      y: height - 68,
      size: 12,
      font,
      color: gray
    });

    // Right: Order info (from data)
    const orderStr = `Order #${pv.order_number}`;
    page.drawText(orderStr, {
      x: width - margin - fontBold.widthOfTextAtSize(orderStr, 14),
      y: height - 48,
      size: 14,
      font: fontBold,
      color: black
    });
    page.drawText(BRANDING.tagline, {
      x: width - margin - font.widthOfTextAtSize(BRANDING.tagline, 10),
      y: height - 66,
      size: 10,
      font,
      color: gray
    });

    // Vehicle line
    const vehicle = [pv.vehicle_year, pv.vehicle_make, pv.vehicle_model].filter(Boolean).join(" ");
    page.drawText(vehicle || "Vehicle Information", {
      x: margin,
      y: height - 92,
      size: 12,
      font: fontBold
    });

    // Divider
    page.drawLine({
      start: { x: margin, y: height - 104 },
      end: { x: width - margin, y: height - 104 },
      thickness: 1,
      color: lightGray
    });

    // ============================================
    // 6-VIEW GRID (FIXED LAYOUT)
    // ============================================

    const cols = 3;
    const rows = 2;
    const gridTop = height - 120;
    const gridHeight = 280;
    const gridWidth = width - margin * 2;
    const gap = 10;

    const cellW = (gridWidth - gap * (cols - 1)) / cols;
    const cellH = (gridHeight - gap * (rows - 1)) / rows;

    for (let i = 0; i < VIEW_ORDER.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = margin + col * (cellW + gap);
      const y = gridTop - row * (cellH + gap) - cellH;

      // Cell border
      page.drawRectangle({
        x,
        y,
        width: cellW,
        height: cellH,
        borderColor: lightGray,
        borderWidth: 0.5
      });

      const entry = VIEW_ORDER[i];
      const v = viewMap.get(entry.key);

      if (v?.image_url) {
        const bytes = await fetchImageBytes(v.image_url);
        if (bytes) {
          try {
            let img;
            try {
              img = await pdf.embedJpg(bytes);
            } catch {
              img = await pdf.embedPng(bytes);
            }

            const imgAspect = img.width / img.height;
            const cellAspect = cellW / cellH;
            let dw = cellW - 4;
            let dh = cellH - 4;
            if (imgAspect > cellAspect) {
              dh = dw / imgAspect;
            } else {
              dw = dh * imgAspect;
            }

            const ox = x + (cellW - dw) / 2;
            const oy = y + (cellH - dh) / 2;

            page.drawImage(img, { x: ox, y: oy, width: dw, height: dh });
          } catch (e) {
            console.error(`[generate-approveflow-proof-pdf] Failed to embed image: ${entry.key}`, e);
          }
        }
      }

      // Label below cell
      const label = v?.label || entry.label;
      page.drawText(label, {
        x: x + cellW / 2 - font.widthOfTextAtSize(label, 9) / 2,
        y: y - 12,
        size: 9,
        font,
        color: gray
      });
    }

    // ============================================
    // PRODUCTION SPECIFICATIONS BLOCK
    // ============================================

    const specsTop = gridTop - gridHeight - 50;
    const blockH = 60;

    page.drawRectangle({
      x: margin,
      y: specsTop - blockH,
      width: gridWidth,
      height: blockH,
      color: darkBg
    });

    page.drawText("PRODUCTION SPECIFICATIONS", {
      x: margin + 12,
      y: specsTop - 18,
      size: 10,
      font: fontBold,
      color: white
    });

    // Build spec items (only show if NOT N/A and has value)
    const specItems: Array<{ label: string; value: string }> = [];

    // Required fields always show
    if (pv.total_sq_ft) {
      specItems.push({ label: "Total Coverage", value: `${pv.total_sq_ft} sq ft` });
    }
    if (pv.wrap_scope) {
      specItems.push({ label: "Scope", value: pv.wrap_scope });
    }

    // Optional fields - ONLY show if NOT marked N/A and has value
    if (specs) {
      const pushOptional = (label: string, value: string | null, isNa: boolean | undefined) => {
        if (isNa) return; // N/A = hidden from proof
        if (!value) return; // Empty = hidden from proof
        specItems.push({ label, value });
      };

      pushOptional("Wheelbase", specs.wheelbase, specs.wheelbase_is_na);
      pushOptional("Roof Height", specs.roof_height, specs.roof_height_is_na);
      pushOptional("Body Length", specs.body_length, specs.body_length_is_na);
      pushOptional("Scale", specs.scale_reference, specs.scale_reference_is_na);
    }

    // Render spec items in a row
    let sx = margin + 12;
    let sy = specsTop - 40;
    const colWidth = 160;

    for (const item of specItems) {
      page.drawText(`${item.label}:`, {
        x: sx,
        y: sy + 8,
        size: 7,
        font,
        color: rgb(0.7, 0.7, 0.7)
      });
      page.drawText(item.value, {
        x: sx,
        y: sy - 4,
        size: 10,
        font: fontBold,
        color: white
      });

      sx += colWidth;
      if (sx > width - margin - colWidth) {
        sx = margin + 12;
        sy -= 22;
      }
    }

    // ============================================
    // APPROVAL SECTION
    // ============================================

    const approveY = specsTop - blockH - 60;

    page.drawText("CUSTOMER APPROVAL", {
      x: margin,
      y: approveY + 36,
      size: 10,
      font: fontBold,
      color: black
    });

    // Customer name line
    page.drawText("Customer Name:", {
      x: margin,
      y: approveY + 16,
      size: 9,
      font,
      color: gray
    });
    page.drawLine({
      start: { x: margin + 95, y: approveY + 14 },
      end: { x: margin + 280, y: approveY + 14 },
      thickness: 0.8,
      color: rgb(0.6, 0.6, 0.6)
    });

    // Checkboxes
    page.drawRectangle({
      x: margin,
      y: approveY - 6,
      width: 10,
      height: 10,
      borderColor: gray,
      borderWidth: 1
    });
    page.drawText("I approve this design for production", {
      x: margin + 16,
      y: approveY - 4,
      size: 9,
      font
    });

    page.drawRectangle({
      x: margin + 260,
      y: approveY - 6,
      width: 10,
      height: 10,
      borderColor: gray,
      borderWidth: 1
    });
    page.drawText("Revisions requested (see notes)", {
      x: margin + 276,
      y: approveY - 4,
      size: 9,
      font
    });

    // Signature line
    const sigY = approveY - 30;
    page.drawText("Customer Signature:", {
      x: margin,
      y: sigY,
      size: 9,
      font,
      color: gray
    });
    page.drawLine({
      start: { x: margin + 110, y: sigY - 2 },
      end: { x: margin + 320, y: sigY - 2 },
      thickness: 0.8,
      color: rgb(0.6, 0.6, 0.6)
    });

    page.drawText("Date:", {
      x: margin + 340,
      y: sigY,
      size: 9,
      font,
      color: gray
    });
    page.drawLine({
      start: { x: margin + 370, y: sigY - 2 },
      end: { x: margin + 470, y: sigY - 2 },
      thickness: 0.8,
      color: rgb(0.6, 0.6, 0.6)
    });

    // ============================================
    // MANDATORY DISCLAIMER (HARDCODED - NEVER REMOVED)
    // ============================================

    const discY = sigY - 50;
    page.drawText("DISCLAIMER", {
      x: margin,
      y: discY + 32,
      size: 9,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2)
    });

    const discLines = DISCLAIMER_TEXT.split("\n");
    let ly = discY + 20;
    for (const line of discLines) {
      page.drawText(line, {
        x: margin,
        y: ly,
        size: 7,
        font,
        color: rgb(0.3, 0.3, 0.3)
      });
      ly -= 9;
      if (ly < 20) break;
    }

    // ============================================
    // PAGE 2: FULL TERMS (Optional)
    // ============================================

    if (pv.include_full_terms) {
      const p2 = pdf.addPage([612, 792]); // Portrait letter
      const { width: w2, height: h2 } = p2.getSize();

      p2.drawText("TERMS & CONDITIONS", {
        x: 50,
        y: h2 - 60,
        size: 18,
        font: fontBold,
        color: black
      });

      p2.drawLine({
        start: { x: 50, y: h2 - 70 },
        end: { x: w2 - 50, y: h2 - 70 },
        thickness: 1,
        color: rgb(0.2, 0.2, 0.2)
      });

      const termLines = FULL_TERMS.split("\n");
      let ty = h2 - 100;
      for (const line of termLines) {
        p2.drawText(line, {
          x: 50,
          y: ty,
          size: 10,
          font,
          color: black
        });
        ty -= 16;
        if (ty < 50) break;
      }

      // Footer branding
      p2.drawText(`${BRANDING.systemName} | ${BRANDING.toolName}`, {
        x: 50,
        y: 30,
        size: 8,
        font,
        color: gray
      });

      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      p2.drawText(`Generated: ${dateStr}`, {
        x: w2 - 50 - font.widthOfTextAtSize(`Generated: ${dateStr}`, 8),
        y: 30,
        size: 8,
        font,
        color: gray
      });
    }

    // ============================================
    // UPLOAD PDF TO STORAGE
    // ============================================

    const pdfBytes = await pdf.save();
    const fileId = crypto.randomUUID();
    const filePath = `approveflow/proofs/${pv.order_number}/${proof_version_id}_${fileId}.pdf`;

    console.log(`[generate-approveflow-proof-pdf] Uploading PDF to: ${filePath}`);

    const { error: upErr } = await supabase.storage
      .from("approveflow-files")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true
      });

    if (upErr) {
      throw new Error(`Upload failed: ${upErr.message}`);
    }

    const publicUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/approveflow-files/${filePath}`;

    // Update proof version with PDF URL and set status to 'ready'
    const { error: updateErr } = await supabase
      .from("approveflow_proof_versions")
      .update({
        proof_pdf_url: publicUrl,
        status: "ready",
        locked_at: new Date().toISOString()
      })
      .eq("id", proof_version_id);

    if (updateErr) {
      console.error(`[generate-approveflow-proof-pdf] Failed to update proof version:`, updateErr);
    }

    console.log(`[generate-approveflow-proof-pdf] PDF generated successfully: ${publicUrl}`);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error(`[generate-approveflow-proof-pdf] Error:`, e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
