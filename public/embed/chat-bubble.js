(async () => {
  // Prevent double loading
  if (window.__WPW_CHAT_WIDGET_LOADED__) return;
  window.__WPW_CHAT_WIDGET_LOADED__ = true;

  // Kill switch - add <script>window.WRAPCOMMAND_DISABLED = true;</script> to disable
  if (window.WRAPCOMMAND_DISABLED) {
    console.log('[WPW Chat] Widget disabled via kill switch');
    return;
  }

  // Read script attributes
  const currentScript = document.currentScript;
  const org = currentScript.getAttribute("data-org") || "wpw";
  const agent = currentScript.getAttribute("data-agent") || "wpw_ai_team";
  const mode = currentScript.getAttribute("data-mode") || "live";
  // Use WPW Supabase for all edge functions (NOT Lovable - that's for 3D renders only)
  const statusUrl = 'https://qxllysilzonrlyoaomce.supabase.co/functions/v1/check-agent-status';

  // ========================================
  // RUNTIME SCHEDULE CHECK - Ask WrapCommand if agent is active
  // This happens BEFORE rendering anything. Fail-safe = OFF.
  // ========================================
  try {
    const statusRes = await fetch(`${statusUrl}?agent=${agent}`);
    const { active, reason } = await statusRes.json();
    
    if (!active) {
      console.log(`[WPW Chat] Agent inactive: ${reason}`);
      return; // Exit silently, no bubble rendered
    }
    console.log(`[WPW Chat] Agent active: ${reason}`);
  } catch (err) {
    // FAIL SAFE - if status check fails, don't show widget
    console.log('[WPW Chat] Status check failed, exiting (fail-safe)');
    return;
  }
  // ========================================

  // Create container
  const container = document.createElement("div");
  container.id = "wpw-chat-widget-container";
  container.style.position = "fixed";
  container.style.bottom = "0";
  container.style.right = "0";
  container.style.zIndex = "999999";
  document.body.appendChild(container);

  // Load React + your app bundle dynamically
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Load React, ReactDOM and your widget bundle
  Promise.all([
    loadScript("https://unpkg.com/react@18/umd/react.production.min.js"),
    loadScript("https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"),
    loadScript("/wpw-chat-bundle.js"), // YOU WILL GENERATE THIS BUNDLE IN LOVABLE
  ])
    .then(() => {
      // Safety check
      if (!window.WPWChatAgent) {
        console.error("WPWChatAgent missing — ensure wpw-chat-bundle.js exports WPWChatAgent globally.");
        return;
      }

      const root = ReactDOM.createRoot(container);

      root.render(
        React.createElement(window.WPWChatAgent, {
          org,
          agent,
          mode,
        })
      );
    })
    .catch((err) => {
      console.error("WPW Chat Widget failed to load:", err);
    });
})();
