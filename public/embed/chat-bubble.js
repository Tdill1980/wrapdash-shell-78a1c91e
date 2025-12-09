(() => {
  // Prevent double loading
  if (window.__WPW_CHAT_WIDGET_LOADED__) return;
  window.__WPW_CHAT_WIDGET_LOADED__ = true;

  // Read script attributes
  const currentScript = document.currentScript;
  const org = currentScript.getAttribute("data-org") || "wpw";
  const agent = currentScript.getAttribute("data-agent") || "wpw_ai_team";
  const mode = currentScript.getAttribute("data-mode") || "live";

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
