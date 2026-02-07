// =====================================================
// WREN MONITOR — AI Agent Health Check System
// Monitors WrapCommandAI infrastructure and alerts on issues
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
  timestamp: string;
}

interface MonitorReport {
  overall_status: 'healthy' | 'degraded' | 'critical';
  checks: HealthCheck[];
  metrics: {
    chats_today: number;
    emails_captured_today: number;
    email_capture_rate: number;
    avg_response_time_ms: number;
    errors_today: number;
  };
  alerts: string[];
  timestamp: string;
}

async function checkEndpoint(name: string, url: string, method = 'GET', body?: any): Promise<HealthCheck> {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(url, options);
    const latency = Date.now() - start;
    
    if (res.ok) {
      return {
        name,
        status: latency > 3000 ? 'warning' : 'ok',
        latency_ms: latency,
        message: latency > 3000 ? `Slow response (${latency}ms)` : 'OK',
        timestamp
      };
    } else {
      return {
        name,
        status: 'critical',
        latency_ms: latency,
        message: `HTTP ${res.status}: ${res.statusText}`,
        timestamp
      };
    }
  } catch (err) {
    return {
      name,
      status: 'critical',
      latency_ms: Date.now() - start,
      message: `Error: ${err.message}`,
      timestamp
    };
  }
}

async function getMetrics(supabaseUrl: string, supabaseKey: string): Promise<MonitorReport['metrics']> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Get today's conversations
    const convsRes = await fetch(
      `${supabaseUrl}/rest/v1/conversations?select=id,contact_id,created_at&channel=eq.website&created_at=gte.${today}T00:00:00Z`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const convs = await convsRes.json();
    
    // Get today's messages
    const msgsRes = await fetch(
      `${supabaseUrl}/rest/v1/messages?select=id,created_at&channel=eq.website&created_at=gte.${today}T00:00:00Z`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const msgs = await msgsRes.json();
    
    const chatsToday = Array.isArray(convs) ? convs.length : 0;
    const emailsCaptured = Array.isArray(convs) ? convs.filter((c: any) => c.contact_id).length : 0;
    const captureRate = chatsToday > 0 ? (emailsCaptured / chatsToday) * 100 : 0;
    
    return {
      chats_today: chatsToday,
      emails_captured_today: emailsCaptured,
      email_capture_rate: Math.round(captureRate),
      avg_response_time_ms: 0, // TODO: Calculate from message timestamps
      errors_today: 0 // TODO: Track errors
    };
  } catch (err) {
    console.error('[WrenMonitor] Metrics error:', err);
    return {
      chats_today: 0,
      emails_captured_today: 0,
      email_capture_rate: 0,
      avg_response_time_ms: 0,
      errors_today: 0
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const checks: HealthCheck[] = [];
    const alerts: string[] = [];
    
    // Check 1: Chat widget loads
    checks.push(await checkEndpoint(
      'Chat Widget',
      'https://www.wrapcommandai.com/embed/chat-widget.js'
    ));
    
    // Check 2: Command-chat function responds
    checks.push(await checkEndpoint(
      'Command Chat API',
      `${supabaseUrl}/functions/v1/command-chat`,
      'POST',
      { session_id: 'health_check', message_text: 'ping', customer_name: 'HealthCheck' }
    ));
    
    // Check 3: Database connectivity
    checks.push(await checkEndpoint(
      'Database',
      `${supabaseUrl}/rest/v1/conversations?select=id&limit=1`,
      'GET'
    ));
    
    // Check 4: WrapCommandAI dashboard
    checks.push(await checkEndpoint(
      'Dashboard',
      'https://www.wrapcommandai.com/'
    ));
    
    // Check 5: WePrintWraps main site
    checks.push(await checkEndpoint(
      'WePrintWraps.com',
      'https://weprintwraps.com/'
    ));
    
    // Get metrics
    const metrics = await getMetrics(supabaseUrl, supabaseKey);
    
    // Generate alerts
    for (const check of checks) {
      if (check.status === 'critical') {
        alerts.push(`🚨 CRITICAL: ${check.name} - ${check.message}`);
      } else if (check.status === 'warning') {
        alerts.push(`⚠️ WARNING: ${check.name} - ${check.message}`);
      }
    }
    
    // Alert on low email capture rate
    if (metrics.chats_today > 5 && metrics.email_capture_rate < 50) {
      alerts.push(`⚠️ Low email capture rate: ${metrics.email_capture_rate}% (${metrics.emails_captured_today}/${metrics.chats_today})`);
    }
    
    // Determine overall status
    const hasCritical = checks.some(c => c.status === 'critical');
    const hasWarning = checks.some(c => c.status === 'warning');
    const overall_status = hasCritical ? 'critical' : hasWarning ? 'degraded' : 'healthy';
    
    const report: MonitorReport = {
      overall_status,
      checks,
      metrics,
      alerts,
      timestamp: new Date().toISOString()
    };
    
    // Log report
    console.log('[WrenMonitor] Report:', JSON.stringify(report, null, 2));
    
    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('[WrenMonitor] Error:', err);
    return new Response(JSON.stringify({ 
      error: err.message,
      overall_status: 'critical',
      alerts: [`🚨 Monitor itself failed: ${err.message}`]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
