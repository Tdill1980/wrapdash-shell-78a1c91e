// =====================================================
// WREN MONITOR — Comprehensive AI Agent Health Check
// Monitors ALL WrapCommandAI business-critical functions
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'critical';
  latency_ms: number;
  message: string;
  details?: any;
}

interface MonitorReport {
  overall_status: 'healthy' | 'degraded' | 'critical';
  checks: HealthCheck[];
  metrics: {
    chats_today: number;
    emails_captured_today: number;
    email_capture_rate: number;
    quotes_created_today: number;
    quotes_emailed_today: number;
    escalations_today: number;
  };
  alerts: string[];
  timestamp: string;
}

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4bGx5c2lsem9ucmx5b2FvbWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MTcxMjUsImV4cCI6MjA1MjI5MzEyNX0.s1IyOY7QAVyrTtG_XLhugJUvxi2X_nHCvqvchYCvwtM';

async function callFunction(baseUrl: string, functionName: string, body: any, serviceKey: string): Promise<{ success: boolean; data?: any; error?: string; latency: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    const latency = Date.now() - start;
    
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${JSON.stringify(data)}`, latency };
    }
    return { success: true, data, latency };
  } catch (err) {
    return { success: false, error: err.message, latency: Date.now() - start };
  }
}

async function checkVehicleDatabase(baseUrl: string, key: string): Promise<HealthCheck> {
  const start = Date.now();
  // Test with a known vehicle: 2024 Ford F-150
  const result = await callFunction(baseUrl, 'cmd-vehicle', {
    year: 2024,
    make: 'Ford',
    model: 'F-150'
  }, key);
  
  if (!result.success) {
    return {
      name: 'Vehicle Database',
      status: 'critical',
      latency_ms: result.latency,
      message: `Failed: ${result.error}`
    };
  }
  
  // Check if we got valid sqft data
  if (!result.data?.sqft || result.data.sqft < 100) {
    return {
      name: 'Vehicle Database',
      status: 'critical',
      latency_ms: result.latency,
      message: `Invalid sqft returned: ${result.data?.sqft}`,
      details: result.data
    };
  }
  
  return {
    name: 'Vehicle Database',
    status: result.latency > 3000 ? 'warning' : 'ok',
    latency_ms: result.latency,
    message: `OK - 2024 F-150 = ${result.data.sqft} sqft`,
    details: result.data
  };
}

async function checkPricing(baseUrl: string, key: string): Promise<HealthCheck> {
  const start = Date.now();
  // Test pricing calculation: 300 sqft at $5.27/sqft = $1,581
  const result = await callFunction(baseUrl, 'cmd-pricing', {
    sqft: 300,
    product: 'avery_wrap'
  }, key);
  
  if (!result.success) {
    return {
      name: 'Pricing Engine',
      status: 'critical',
      latency_ms: result.latency,
      message: `Failed: ${result.error}`
    };
  }
  
  // Check if price is reasonable (300 * $5.27 = $1,581)
  const expectedPrice = 300 * 5.27;
  const actualPrice = result.data?.prices?.default || result.data?.price || 0;
  
  if (Math.abs(actualPrice - expectedPrice) > 50) {
    return {
      name: 'Pricing Engine',
      status: 'critical',
      latency_ms: result.latency,
      message: `Wrong price: expected ~$${expectedPrice}, got $${actualPrice}`,
      details: result.data
    };
  }
  
  return {
    name: 'Pricing Engine',
    status: result.latency > 2000 ? 'warning' : 'ok',
    latency_ms: result.latency,
    message: `OK - 300sqft = $${actualPrice}`,
    details: result.data
  };
}

async function checkKnowledge(baseUrl: string, key: string): Promise<HealthCheck> {
  const result = await callFunction(baseUrl, 'cmd-knowledge', {
    topic: 'pricing'
  }, key);
  
  if (!result.success) {
    return {
      name: 'Knowledge Base',
      status: 'critical',
      latency_ms: result.latency,
      message: `Failed: ${result.error}`
    };
  }
  
  // Check if we got content with URLs
  const content = result.data?.content || result.data?.knowledge || '';
  const hasUrl = content.includes('weprintwraps.com') || content.includes('http');
  
  if (!hasUrl) {
    return {
      name: 'Knowledge Base',
      status: 'warning',
      latency_ms: result.latency,
      message: 'No product URLs in response',
      details: { content_length: content.length }
    };
  }
  
  return {
    name: 'Knowledge Base',
    status: 'ok',
    latency_ms: result.latency,
    message: 'OK - Contains product URLs'
  };
}

async function checkQuoteCreation(baseUrl: string, key: string): Promise<HealthCheck> {
  // Test quote creation with test data (won't actually email)
  const result = await callFunction(baseUrl, 'create-quote-from-chat', {
    customer_name: 'HEALTH_CHECK_TEST',
    customer_email: 'healthcheck@test.invalid',
    customer_phone: '0000000000',
    vehicle: 'Test Vehicle',
    sqft: 100,
    price: 527,
    product_name: 'Avery Wrap',
    test_mode: true, // Flag to skip actual email
    conversation_id: null
  }, key);
  
  if (!result.success) {
    return {
      name: 'Quote Creation',
      status: 'critical',
      latency_ms: result.latency,
      message: `Failed: ${result.error}`
    };
  }
  
  // Check if quote was saved
  if (!result.data?.success && !result.data?.quote_id && !result.data?.quote_number) {
    return {
      name: 'Quote Creation',
      status: 'critical',
      latency_ms: result.latency,
      message: 'Quote not saved properly',
      details: result.data
    };
  }
  
  return {
    name: 'Quote Creation',
    status: result.latency > 3000 ? 'warning' : 'ok',
    latency_ms: result.latency,
    message: 'OK - Quote saves correctly',
    details: result.data
  };
}

async function checkEscalation(baseUrl: string, key: string): Promise<HealthCheck> {
  const result = await callFunction(baseUrl, 'cmd-escalate', {
    escalation_type: 'support',
    reason: 'Health check test',
    customer_name: 'HEALTH_CHECK_TEST',
    test_mode: true
  }, key);
  
  if (!result.success) {
    return {
      name: 'Escalation Routing',
      status: 'critical',
      latency_ms: result.latency,
      message: `Failed: ${result.error}`
    };
  }
  
  if (!result.data?.success && !result.data?.routed_to) {
    return {
      name: 'Escalation Routing',
      status: 'warning',
      latency_ms: result.latency,
      message: 'Escalation may not be routing correctly',
      details: result.data
    };
  }
  
  return {
    name: 'Escalation Routing',
    status: 'ok',
    latency_ms: result.latency,
    message: `OK - Routes to ${result.data?.routed_to || 'team'}`,
    details: result.data
  };
}

async function checkCommandChat(baseUrl: string, key: string): Promise<HealthCheck> {
  // Test the full chat flow with a pricing question
  const result = await callFunction(baseUrl, 'command-chat', {
    session_id: 'health_check_' + Date.now(),
    message_text: 'How much for a 2024 Ford F-150 full wrap?',
    customer_name: 'HealthCheck',
    customer_email: 'healthcheck@test.invalid'
  }, key);
  
  if (!result.success) {
    return {
      name: 'Command Chat (Full Flow)',
      status: 'critical',
      latency_ms: result.latency,
      message: `Failed: ${result.error}`
    };
  }
  
  const reply = result.data?.reply || result.data?.response || '';
  
  // Check if reply contains price (should have $ and numbers)
  const hasPrice = /\$[\d,]+/.test(reply);
  const hasUrl = reply.includes('weprintwraps.com') || reply.includes('http');
  
  const issues = [];
  if (!hasPrice) issues.push('No price in response');
  if (!hasUrl) issues.push('No product URL');
  
  if (issues.length > 0) {
    return {
      name: 'Command Chat (Full Flow)',
      status: 'warning',
      latency_ms: result.latency,
      message: issues.join(', '),
      details: { reply_preview: reply.substring(0, 200) }
    };
  }
  
  return {
    name: 'Command Chat (Full Flow)',
    status: result.latency > 5000 ? 'warning' : 'ok',
    latency_ms: result.latency,
    message: 'OK - Returns price and URL',
    details: { reply_preview: reply.substring(0, 100) }
  };
}

async function checkMightyCustomerProducts(baseUrl: string, key: string): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Check if products table has data
    const res = await fetch(`${baseUrl}/rest/v1/wpw_products?select=id,name&limit=5`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const data = await res.json();
    const latency = Date.now() - start;
    
    if (!Array.isArray(data) || data.length === 0) {
      return {
        name: 'MightyCustomer Products',
        status: 'critical',
        latency_ms: latency,
        message: 'No products found in database'
      };
    }
    
    return {
      name: 'MightyCustomer Products',
      status: 'ok',
      latency_ms: latency,
      message: `OK - ${data.length}+ products loaded`
    };
  } catch (err) {
    return {
      name: 'MightyCustomer Products',
      status: 'critical',
      latency_ms: Date.now() - start,
      message: `Error: ${err.message}`
    };
  }
}

async function checkWidgetLoads(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const res = await fetch('https://www.wrapcommandai.com/embed/chat-widget.js');
    const latency = Date.now() - start;
    
    if (!res.ok) {
      return {
        name: 'Chat Widget',
        status: 'critical',
        latency_ms: latency,
        message: `HTTP ${res.status}`
      };
    }
    
    const text = await res.text();
    if (!text.includes('wcai-onboarding') || !text.includes('command-chat')) {
      return {
        name: 'Chat Widget',
        status: 'warning',
        latency_ms: latency,
        message: 'Widget loaded but may be outdated'
      };
    }
    
    return {
      name: 'Chat Widget',
      status: 'ok',
      latency_ms: latency,
      message: 'OK - Widget loads correctly'
    };
  } catch (err) {
    return {
      name: 'Chat Widget',
      status: 'critical',
      latency_ms: Date.now() - start,
      message: `Error: ${err.message}`
    };
  }
}

async function getMetrics(baseUrl: string, key: string): Promise<MonitorReport['metrics']> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Conversations today
    const convsRes = await fetch(
      `${baseUrl}/rest/v1/conversations?select=id,contact_id&channel=eq.website&created_at=gte.${today}T00:00:00Z`,
      { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
    );
    const convs = await convsRes.json();
    
    // Quotes today
    const quotesRes = await fetch(
      `${baseUrl}/rest/v1/website_quotes?select=id,email_sent&created_at=gte.${today}T00:00:00Z`,
      { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
    );
    const quotes = await quotesRes.json();
    
    // Escalations today
    const escRes = await fetch(
      `${baseUrl}/rest/v1/escalations?select=id&created_at=gte.${today}T00:00:00Z`,
      { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
    );
    const escalations = await escRes.json();
    
    const chatsToday = Array.isArray(convs) ? convs.length : 0;
    const emailsCaptured = Array.isArray(convs) ? convs.filter((c: any) => c.contact_id).length : 0;
    const captureRate = chatsToday > 0 ? Math.round((emailsCaptured / chatsToday) * 100) : 0;
    const quotesCreated = Array.isArray(quotes) ? quotes.length : 0;
    const quotesEmailed = Array.isArray(quotes) ? quotes.filter((q: any) => q.email_sent).length : 0;
    const escalationsToday = Array.isArray(escalations) ? escalations.length : 0;
    
    return {
      chats_today: chatsToday,
      emails_captured_today: emailsCaptured,
      email_capture_rate: captureRate,
      quotes_created_today: quotesCreated,
      quotes_emailed_today: quotesEmailed,
      escalations_today: escalationsToday
    };
  } catch (err) {
    console.error('[WrenMonitor] Metrics error:', err);
    return {
      chats_today: 0,
      emails_captured_today: 0,
      email_capture_rate: 0,
      quotes_created_today: 0,
      quotes_emailed_today: 0,
      escalations_today: 0
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
    const key = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('[WrenMonitor] Starting comprehensive health check...');
    
    // Run all checks in parallel for speed
    const [
      widgetCheck,
      vehicleCheck,
      pricingCheck,
      knowledgeCheck,
      quoteCheck,
      escalationCheck,
      chatCheck,
      productsCheck
    ] = await Promise.all([
      checkWidgetLoads(),
      checkVehicleDatabase(url, key),
      checkPricing(url, key),
      checkKnowledge(url, key),
      checkQuoteCreation(url, key),
      checkEscalation(url, key),
      checkCommandChat(url, key),
      checkMightyCustomerProducts(url, key)
    ]);
    
    const checks = [
      widgetCheck,
      vehicleCheck,
      pricingCheck,
      knowledgeCheck,
      quoteCheck,
      escalationCheck,
      chatCheck,
      productsCheck
    ];
    
    // Get metrics
    const metrics = await getMetrics(url, key);
    
    // Generate alerts
    const alerts: string[] = [];
    
    for (const check of checks) {
      if (check.status === 'critical') {
        alerts.push(`🚨 CRITICAL: ${check.name} - ${check.message}`);
      } else if (check.status === 'warning') {
        alerts.push(`⚠️ WARNING: ${check.name} - ${check.message}`);
      }
    }
    
    // Business metric alerts
    if (metrics.chats_today > 5 && metrics.email_capture_rate < 50) {
      alerts.push(`⚠️ Low email capture: ${metrics.email_capture_rate}% (${metrics.emails_captured_today}/${metrics.chats_today} chats)`);
    }
    
    if (metrics.quotes_created_today > 0 && metrics.quotes_emailed_today === 0) {
      alerts.push(`🚨 Quotes created but none emailed! (${metrics.quotes_created_today} quotes, 0 emails)`);
    }
    
    // Determine overall status
    const criticalCount = checks.filter(c => c.status === 'critical').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    
    let overall_status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (criticalCount > 0) overall_status = 'critical';
    else if (warningCount > 0) overall_status = 'degraded';
    
    const report: MonitorReport = {
      overall_status,
      checks,
      metrics,
      alerts,
      timestamp: new Date().toISOString()
    };
    
    console.log('[WrenMonitor] Complete. Status:', overall_status, 'Alerts:', alerts.length);
    
    return new Response(JSON.stringify(report, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('[WrenMonitor] Fatal error:', err);
    return new Response(JSON.stringify({ 
      overall_status: 'critical',
      alerts: [`🚨 MONITOR FAILED: ${err.message}`],
      checks: [],
      metrics: {},
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
