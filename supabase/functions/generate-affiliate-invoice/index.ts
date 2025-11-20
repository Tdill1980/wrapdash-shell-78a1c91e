import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { founderId, commissionIds, periodStart, periodEnd } = await req.json();

    if (!founderId || !commissionIds || commissionIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch founder details
    const { data: founder, error: founderError } = await supabase
      .from('affiliate_founders')
      .select('*')
      .eq('id', founderId)
      .single();

    if (founderError || !founder) {
      return new Response(
        JSON.stringify({ error: 'Founder not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch commissions
    const { data: commissions, error: commissionsError } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .in('id', commissionIds)
      .eq('founder_id', founderId);

    if (commissionsError || !commissions) {
      return new Response(
        JSON.stringify({ error: 'Commissions not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalAmount = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${founderId.slice(0, 8)}`;

    // Generate HTML invoice
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company-info h1 { margin: 0; color: #2563eb; }
    .invoice-info { text-align: right; }
    .affiliate-info { margin-bottom: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    th { background: #2563eb; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .total-row { font-weight: bold; font-size: 18px; background: #f3f4f6; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>WrapCommand AI</h1>
      <p>Affiliate Commission Invoice</p>
    </div>
    <div class="invoice-info">
      <h2>Invoice #${invoiceNumber}</h2>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Period:</strong> ${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}</p>
    </div>
  </div>

  <div class="affiliate-info">
    <h3>Bill To:</h3>
    <p><strong>${founder.full_name}</strong></p>
    <p>${founder.email}</p>
    ${founder.company_name ? `<p>${founder.company_name}</p>` : ''}
    <p><strong>Affiliate Code:</strong> ${founder.affiliate_code}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Order Number</th>
        <th>Customer</th>
        <th>Product</th>
        <th>Order Total</th>
        <th>Commission Rate</th>
        <th>Commission Amount</th>
      </tr>
    </thead>
    <tbody>
      ${commissions.map(c => `
        <tr>
          <td>${c.order_number}</td>
          <td>${c.customer_email}</td>
          <td>${c.product_name || 'N/A'}</td>
          <td>$${Number(c.order_total).toFixed(2)}</td>
          <td>${founder.commission_rate}%</td>
          <td>$${Number(c.commission_amount).toFixed(2)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="5" style="text-align: right;">Total Commission:</td>
        <td>$${totalAmount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>Thank you for being a valued WrapCommand AI affiliate partner!</p>
    <p>Questions? Contact us at support@wrapcommand.ai</p>
  </div>
</body>
</html>
    `;

    // Create invoice record
    const { data: invoice, error: insertError } = await supabase
      .from('affiliate_payout_invoices')
      .insert({
        founder_id: founderId,
        invoice_number: invoiceNumber,
        period_start: periodStart,
        period_end: periodEnd,
        total_amount: totalAmount,
        commission_ids: commissionIds,
        status: 'generated',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invoice:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invoice record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invoice generated successfully:', invoiceNumber);

    return new Response(
      JSON.stringify({
        success: true,
        invoice,
        html: invoiceHtml,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});