import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id } = await req.json();
    console.log("Generating PDF for project:", project_id);

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load project
    const { data: project, error: projectError } = await supabase
      .from("approveflow_projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load assets
    const { data: assets } = await supabase
      .from("approveflow_assets")
      .select("*")
      .eq("project_id", project_id)
      .order("sort_order", { ascending: true });

    const proofAssets = assets?.filter(a => a.view_type) || [];

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const vehicleInfo = project.vehicle_info || {};
    const vehicleString = `${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim() || 'Vehicle';

    // Cover page
    const coverPage = pdfDoc.addPage([612, 792]);
    
    // Title
    coverPage.drawText("WrapProof™ AI Proof Sheet", {
      x: 50,
      y: 720,
      size: 24,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Header info
    const headerLines = [
      `Customer: ${project.customer_name}`,
      `Vehicle: ${vehicleString}`,
      `Order #: ${project.order_number}`,
      `Version: ${project.current_version || 1}`,
      `Generated: ${new Date().toLocaleString()}`,
    ];

    let yPos = 680;
    for (const line of headerLines) {
      coverPage.drawText(line, {
        x: 50,
        y: yPos,
        size: 12,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPos -= 18;
    }

    // Design instructions if available
    if (project.design_instructions) {
      yPos -= 20;
      coverPage.drawText("Design Instructions:", {
        x: 50,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      yPos -= 18;
      
      const instructionLines = project.design_instructions.split('\n').slice(0, 10);
      for (const line of instructionLines) {
        coverPage.drawText(line.substring(0, 80), {
          x: 50,
          y: yPos,
          size: 10,
          font: helvetica,
          color: rgb(0.4, 0.4, 0.4),
        });
        yPos -= 14;
      }
    }

    // View pages
    const viewLabels: Record<string, string> = {
      driver_side: "DRIVER SIDE",
      passenger_side: "PASSENGER SIDE",
      front: "FRONT VIEW",
      rear: "REAR VIEW",
      hero_3_4: "3/4 HERO ANGLE",
    };

    for (const asset of proofAssets) {
      try {
        const imgResponse = await fetch(asset.file_url);
        if (!imgResponse.ok) continue;
        
        const imgBytes = await imgResponse.arrayBuffer();
        
        let embeddedImage;
        try {
          embeddedImage = await pdfDoc.embedPng(new Uint8Array(imgBytes));
        } catch {
          try {
            embeddedImage = await pdfDoc.embedJpg(new Uint8Array(imgBytes));
          } catch {
            console.error("Could not embed image:", asset.file_url);
            continue;
          }
        }

        const page = pdfDoc.addPage([612, 792]);
        
        // View label
        const label = viewLabels[asset.view_type] || asset.view_type?.toUpperCase() || "VIEW";
        page.drawText(label, {
          x: 50,
          y: 750,
          size: 18,
          font: helveticaBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        // Scale image to fit page
        const maxWidth = 512;
        const maxHeight = 400;
        const imgDims = embeddedImage.scale(1);
        const scale = Math.min(maxWidth / imgDims.width, maxHeight / imgDims.height);
        
        page.drawImage(embeddedImage, {
          x: 50,
          y: 300,
          width: imgDims.width * scale,
          height: imgDims.height * scale,
        });
      } catch (imgError) {
        console.error("Error adding image to PDF:", imgError);
      }
    }

    // Signature page
    const sigPage = pdfDoc.addPage([612, 792]);
    
    sigPage.drawText("Customer Approval", {
      x: 50,
      y: 720,
      size: 20,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    sigPage.drawText("I approve the above layout for production.", {
      x: 50,
      y: 680,
      size: 12,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });

    sigPage.drawLine({
      start: { x: 50, y: 620 },
      end: { x: 400, y: 620 },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });

    sigPage.drawText("Signature", {
      x: 50,
      y: 600,
      size: 10,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });

    sigPage.drawLine({
      start: { x: 50, y: 550 },
      end: { x: 250, y: 550 },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });

    sigPage.drawText("Date", {
      x: 50,
      y: 530,
      size: 10,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    console.log("PDF generated, size:", pdfBytes.length);

    // Upload to storage
    const fileName = `proofs/${project_id}/proof_v${project.current_version || 1}_${Date.now()}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from("approveflow-files")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from("approveflow-files")
      .getPublicUrl(fileName);

    console.log("PDF uploaded:", urlData.publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: urlData.publicUrl,
        filename: `proof-${project.order_number}-v${project.current_version || 1}.pdf`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("PDF export error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "PDF generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
