import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { loadTradeDNA, generateBrandVoicePrompt } from "../_shared/tradedna-loader.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, tone = 'installer', templateType = 'general', includeHeader = true, includeHeroImage = true, includeCta = true, organizationId } = await req.json();

    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Load TradeDNA for brand voice
    const tradeDNA = await loadTradeDNA(organizationId);
    const brandVoicePrompt = generateBrandVoicePrompt(tradeDNA);

    const toneDescriptions: Record<string, string> = {
      installer: 'Professional, technical, straightforward tone. Like talking shop with another installer.',
      luxury: 'Elegant, sophisticated, premium feel. Emphasizes quality and exclusivity.',
      hype: 'Bold, exciting, energetic! Uses action words and creates urgency.'
    };

    const systemPrompt = `You are an expert email template designer for ${tradeDNA.business_name || 'a vehicle wrap business'}. Generate a complete Unlayer-compatible email template JSON structure.

${brandVoicePrompt}

TONE: ${toneDescriptions[tone] || toneDescriptions.installer}
TEMPLATE TYPE: ${templateType}

The template should be professional, mobile-responsive, and include:
${includeHeader ? '- A header section with logo placeholder' : ''}
${includeHeroImage ? '- A hero image section (use placeholder image URL: https://via.placeholder.com/600x300)' : ''}
- Body content relevant to the template type
${includeCta ? '- A prominent call-to-action button' : ''}
- Footer with contact info placeholders

Use these merge tags where appropriate:
- {{customer_name}} - Customer's name
- {{vehicle_year}}, {{vehicle_make}}, {{vehicle_model}} - Vehicle info
- {{quote_number}}, {{order_number}} - Reference numbers
- {{total_price}} - Price
- {{portal_url}} - Customer portal link
- {{company_name}} - Business name

Return ONLY valid JSON for an Unlayer design object with this structure:
{
  "counters": { "u_column": 1, "u_row": 1, "u_content_text": 1 },
  "body": {
    "id": "unique-id",
    "rows": [/* row objects */],
    "values": {
      "backgroundColor": "#f5f5f5",
      "backgroundImage": { "url": "", "fullWidth": true },
      "contentWidth": "600px",
      "fontFamily": { "label": "Arial", "value": "arial,helvetica,sans-serif" }
    }
  }
}

Each row should have this structure:
{
  "id": "unique-id",
  "cells": [1],
  "columns": [{
    "id": "unique-id",
    "contents": [/* content blocks */],
    "values": { "_meta": { "htmlID": "u_column_1", "htmlClassNames": "u_column" } }
  }],
  "values": {
    "backgroundColor": "",
    "backgroundImage": { "url": "", "fullWidth": true },
    "padding": "10px",
    "_meta": { "htmlID": "u_row_1", "htmlClassNames": "u_row" }
  }
}

Content blocks for text:
{
  "id": "unique-id",
  "type": "text",
  "values": {
    "containerPadding": "10px",
    "text": "<p style='font-size: 16px; color: #333333;'>Your text here</p>",
    "_meta": { "htmlID": "u_content_text_1", "htmlClassNames": "u_content_text" }
  }
}

Content blocks for buttons:
{
  "id": "unique-id",
  "type": "button",
  "values": {
    "containerPadding": "10px",
    "href": { "name": "web", "values": { "href": "{{portal_url}}", "target": "_blank" } },
    "buttonColors": { "color": "#FFFFFF", "backgroundColor": "#3B82F6", "hoverColor": "#FFFFFF", "hoverBackgroundColor": "#2563EB" },
    "size": { "autoWidth": true, "width": "100%" },
    "padding": "15px 30px",
    "borderRadius": "6px",
    "text": "View Your Quote",
    "_meta": { "htmlID": "u_content_button_1", "htmlClassNames": "u_content_button" }
  }
}

Content blocks for images:
{
  "id": "unique-id",
  "type": "image",
  "values": {
    "containerPadding": "10px",
    "src": { "url": "https://via.placeholder.com/600x300", "width": 600, "height": 300 },
    "textAlign": "center",
    "altText": "Image description",
    "_meta": { "htmlID": "u_content_image_1", "htmlClassNames": "u_content_image" }
  }
}`;

    const userPrompt = `Create an email template for: ${description}

Requirements:
- Template type: ${templateType}
- Include header: ${includeHeader}
- Include hero image: ${includeHeroImage}
- Include CTA button: ${includeCta}
- Tone: ${tone}

Generate a complete, valid Unlayer design JSON. Return ONLY the JSON, no markdown or explanation.`;

    console.log('Generating template with description:', description);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from AI');
    }

    console.log('Raw AI response:', content.substring(0, 500));

    // Parse the JSON from AI response
    let designJson;
    try {
      // Remove markdown code blocks if present
      let cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      designJson = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return a basic template as fallback
      designJson = createFallbackTemplate(description, tone, includeHeader, includeHeroImage, includeCta);
    }

    console.log('Template generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        design: designJson,
        message: 'Template generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating template:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate template';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function createFallbackTemplate(description: string, tone: string, includeHeader: boolean, includeHeroImage: boolean, includeCta: boolean) {
  const rows = [];
  let counter = 1;

  // Header row
  if (includeHeader) {
    rows.push({
      id: `row-${counter++}`,
      cells: [1],
      columns: [{
        id: `col-${counter++}`,
        contents: [{
          id: `text-${counter++}`,
          type: 'text',
          values: {
            containerPadding: '20px',
            text: '<h1 style="font-size: 24px; color: #1a1a1a; text-align: center; margin: 0;">{{company_name}}</h1>',
            _meta: { htmlID: `u_content_text_${counter}`, htmlClassNames: 'u_content_text' }
          }
        }],
        values: { _meta: { htmlID: `u_column_${counter}`, htmlClassNames: 'u_column' } }
      }],
      values: {
        backgroundColor: '#ffffff',
        padding: '10px',
        _meta: { htmlID: `u_row_${counter}`, htmlClassNames: 'u_row' }
      }
    });
  }

  // Hero image row
  if (includeHeroImage) {
    rows.push({
      id: `row-${counter++}`,
      cells: [1],
      columns: [{
        id: `col-${counter++}`,
        contents: [{
          id: `image-${counter++}`,
          type: 'image',
          values: {
            containerPadding: '0px',
            src: { url: 'https://via.placeholder.com/600x300', width: 600, height: 300 },
            textAlign: 'center',
            altText: 'Email header image',
            _meta: { htmlID: `u_content_image_${counter}`, htmlClassNames: 'u_content_image' }
          }
        }],
        values: { _meta: { htmlID: `u_column_${counter}`, htmlClassNames: 'u_column' } }
      }],
      values: {
        backgroundColor: '#ffffff',
        padding: '0px',
        _meta: { htmlID: `u_row_${counter}`, htmlClassNames: 'u_row' }
      }
    });
  }

  // Body content row
  rows.push({
    id: `row-${counter++}`,
    cells: [1],
    columns: [{
      id: `col-${counter++}`,
      contents: [{
        id: `text-${counter++}`,
        type: 'text',
        values: {
          containerPadding: '20px',
          text: `<p style="font-size: 16px; color: #333333; line-height: 1.6;">Hi {{customer_name}},</p>
<p style="font-size: 16px; color: #333333; line-height: 1.6;">${description}</p>
<p style="font-size: 16px; color: #333333; line-height: 1.6;"><strong>Vehicle:</strong> {{vehicle_year}} {{vehicle_make}} {{vehicle_model}}</p>`,
          _meta: { htmlID: `u_content_text_${counter}`, htmlClassNames: 'u_content_text' }
        }
      }],
      values: { _meta: { htmlID: `u_column_${counter}`, htmlClassNames: 'u_column' } }
    }],
    values: {
      backgroundColor: '#ffffff',
      padding: '10px',
      _meta: { htmlID: `u_row_${counter}`, htmlClassNames: 'u_row' }
    }
  });

  // CTA button row
  if (includeCta) {
    rows.push({
      id: `row-${counter++}`,
      cells: [1],
      columns: [{
        id: `col-${counter++}`,
        contents: [{
          id: `button-${counter++}`,
          type: 'button',
          values: {
            containerPadding: '20px',
            href: { name: 'web', values: { href: '{{portal_url}}', target: '_blank' } },
            buttonColors: { color: '#FFFFFF', backgroundColor: '#3B82F6', hoverColor: '#FFFFFF', hoverBackgroundColor: '#2563EB' },
            size: { autoWidth: true, width: '100%' },
            padding: '15px 30px',
            borderRadius: '6px',
            text: 'View Details',
            textAlign: 'center',
            _meta: { htmlID: `u_content_button_${counter}`, htmlClassNames: 'u_content_button' }
          }
        }],
        values: { _meta: { htmlID: `u_column_${counter}`, htmlClassNames: 'u_column' } }
      }],
      values: {
        backgroundColor: '#ffffff',
        padding: '10px',
        _meta: { htmlID: `u_row_${counter}`, htmlClassNames: 'u_row' }
      }
    });
  }

  // Footer row
  rows.push({
    id: `row-${counter++}`,
    cells: [1],
    columns: [{
      id: `col-${counter++}`,
      contents: [{
        id: `text-${counter++}`,
        type: 'text',
        values: {
          containerPadding: '20px',
          text: '<p style="font-size: 12px; color: #666666; text-align: center;">{{company_name}}<br>Questions? Reply to this email.</p>',
          _meta: { htmlID: `u_content_text_${counter}`, htmlClassNames: 'u_content_text' }
        }
      }],
      values: { _meta: { htmlID: `u_column_${counter}`, htmlClassNames: 'u_column' } }
    }],
    values: {
      backgroundColor: '#f5f5f5',
      padding: '10px',
      _meta: { htmlID: `u_row_${counter}`, htmlClassNames: 'u_row' }
    }
  });

  return {
    counters: { u_column: counter, u_row: counter, u_content_text: counter, u_content_button: counter, u_content_image: counter },
    body: {
      id: 'template-body',
      rows,
      values: {
        backgroundColor: '#f5f5f5',
        backgroundImage: { url: '', fullWidth: true },
        contentWidth: '600px',
        fontFamily: { label: 'Arial', value: 'arial,helvetica,sans-serif' }
      }
    }
  };
}
