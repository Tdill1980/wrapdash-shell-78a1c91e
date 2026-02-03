(async function() {
  'use strict';

  // WrapCommandAI Chat Widget - Jordan Lee
  // SAFETY: External, deferred, non-blocking. Fails silently.
  // Does NOT execute WordPress logic or mutate WP state.
  
  // Kill switch - add <script>window.WRAPCOMMAND_DISABLED = true;</script> to disable
  if (window.WRAPCOMMAND_DISABLED) {
    console.log('[WCAI] Widget disabled via kill switch');
    return;
  }

  // Configuration from script attributes
  const scriptTag = document.currentScript;
  const config = {
    org: scriptTag?.getAttribute('data-org') || 'wpw',
    agent: scriptTag?.getAttribute('data-agent') || 'jordan',
    mode: scriptTag?.getAttribute('data-mode') || 'live',
    theme: scriptTag?.getAttribute('data-theme') || 'wpw',
    apiUrl: 'https://qxllysilzonrlyoaomce.supabase.co/functions/v1/website-chat',
    statusUrl: 'https://qxllysilzonrlyoaomce.supabase.co/functions/v1/check-agent-status',
    artworkCheckUrl: 'https://qxllysilzonrlyoaomce.supabase.co/functions/v1/check-artwork-file',
    supabaseUrl: 'https://qxllysilzonrlyoaomce.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4bGx5c2lsem9ucmx5b2FvbWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MTcxMjUsImV4cCI6MjA1MjI5MzEyNX0.gLBJSH-IP7WVNLH7WRBaQPZ8LuG0XErqf68F6U7ELKY'
  };

  // ========================================
  // THEME CONFIGURATION
  // Supports: data-theme="wpw" (default), or custom themes
  // ========================================
  const themes = {
    wpw: {
      primary: '#e6007e',      // WPW Magenta - bubble, header, send button
      secondary: '#0057b8',    // WPW Blue - helper pill background
      text: '#ffffff',         // White text on colored backgrounds
      accent: '#22c55e'        // Green - online indicator
    },
    default: {
      primary: '#e6007e',
      secondary: '#0057b8', 
      text: '#ffffff',
      accent: '#22c55e'
    }
  };
  
  const colors = themes[config.theme] || themes.default;
  console.log(`[WCAI] Theme: ${config.theme}`, colors);

  // ========================================
  // RUNTIME SCHEDULE CHECK - Ask WrapCommand if agent is active
  // This happens BEFORE rendering anything. Fail-safe = OFF.
  // ========================================
  try {
    const statusRes = await fetch(`${config.statusUrl}?agent=${config.agent}`, {
      headers: { 'apikey': config.supabaseAnonKey }
    });
    const { active, reason } = await statusRes.json();
    
    if (!active) {
      console.log(`[WCAI] Agent inactive: ${reason}`);
      return; // Exit silently, no bubble rendered
    }
    console.log(`[WCAI] Agent active: ${reason}`);
  } catch (err) {
    // FAIL SAFE - if status check fails, don't show widget
    console.log('[WCAI] Status check failed, exiting (fail-safe)');
    return;
  }
  // ========================================

  // WPW Logo (base64 encoded small version for embed)
  const WPW_LOGO = 'https://weprintwraps.com/cdn/shop/files/WePrintWraps-Logo-White.png?v=1690318107';

  // QUICK ACTIONS - 3 buttons only (icon separate from text to avoid duplication)
  const quickActions = [
    { id: 'quote', text: 'How much is my wrap project?', icon: '🚗', primary: true, message: 'How much is my wrap project?' },
    { id: 'order', text: 'How do I order?', icon: '📦', message: 'How do I place an order?' },
    { id: 'restyle', text: 'Ask me about RestyleProAI', icon: '🎨', message: 'Tell me about RestyleProAI and how it can help visualize my wrap' }
  ];

  // Geo data (fetched on load)
  let geoData = null;
  
  // Track file upload count per session for rate limiting
  let fileUploadCount = 0;
  const MAX_UPLOADS_PER_SESSION = 3;

  // Fetch geo location on widget load
  (async function fetchGeoData() {
    try {
      const response = await fetch('https://ipapi.co/json/', { cache: 'force-cache' });
      if (response.ok) {
        const data = await response.json();
        geoData = {
          ip: data.ip,
          city: data.city,
          region: data.region,
          country: data.country_code,
          country_name: data.country_name,
          timezone: data.timezone,
          latitude: data.latitude,
          longitude: data.longitude
        };
        console.log('[WCAI] Geo:', geoData?.city, geoData?.country);
      }
    } catch (err) {
      console.warn('[WCAI] Geo fetch failed');
    }
  })();

  // Styles - using theme colors
  const styles = `
    .wcai-chat-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .wcai-bubble-row {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }
    .wcai-ask-trigger {
      background: ${colors.secondary};
      border-radius: 24px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 500;
      color: ${colors.text};
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 12px rgba(0,87,184,0.3);
      border: 1px solid rgba(0,87,184,0.2);
      transition: all 0.2s;
      opacity: 0;
      animation: wcai-slide-in 0.4s ease-out 2s forwards;
    }
    .wcai-ask-trigger:hover {
      transform: scale(1.03);
      box-shadow: 0 4px 16px rgba(0,87,184,0.4);
      border-color: ${colors.secondary};
    }
    .wcai-ask-trigger svg {
      width: 16px;
      height: 16px;
      color: ${colors.text};
    }
    .wcai-ask-trigger.hidden {
      display: none;
    }
    @keyframes wcai-slide-in {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .wcai-chat-bubble {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${colors.primary};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(230,0,126,0.4);
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
    }
    .wcai-chat-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(230,0,126,0.5);
    }
    .wcai-chat-bubble img {
      width: 36px;
      height: auto;
      object-fit: contain;
    }
    .wcai-bubble-pulse {
      position: absolute;
      top: 0;
      right: 0;
      width: 14px;
      height: 14px;
      background: ${colors.accent};
      border-radius: 50%;
      border: 2px solid white;
      animation: wcai-pulse 2s infinite;
    }
    @keyframes wcai-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }
    .wcai-chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      max-height: 600px;
      background: #1a1a2e;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(230,0,126,0.3);
    }
    .wcai-chat-window.open {
      display: flex;
      animation: wcai-slide-up 0.3s ease-out;
    }
    @keyframes wcai-slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .wcai-chat-header {
      background: linear-gradient(135deg, ${colors.primary}, #8b5cf6);
      padding: 16px 20px;
      color: ${colors.text};
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .wcai-chat-header-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      color: ${colors.text};
      border: 2px solid rgba(255,255,255,0.3);
    }
    .wcai-chat-header-info h3 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }
    .wcai-chat-header-info p {
      margin: 4px 0 0;
      font-size: 12px;
      opacity: 0.9;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .wcai-live-dot {
      width: 8px;
      height: 8px;
      background: ${colors.accent};
      border-radius: 50%;
      animation: wcai-blink 1.5s infinite;
    }
    @keyframes wcai-blink {
      0%, 50%, 100% { opacity: 1; }
      25%, 75% { opacity: 0.4; }
    }
    .wcai-chat-close {
      margin-left: auto;
      background: rgba(255,255,255,0.1);
      border: none;
      color: ${colors.text};
      cursor: pointer;
      font-size: 20px;
      padding: 0;
      line-height: 1;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .wcai-chat-close:hover {
      background: rgba(255,255,255,0.2);
    }

    .wcai-chat-reset {
      background: rgba(255,255,255,0.1);
      border: none;
      color: ${colors.text};
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 10px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
      white-space: nowrap;
    }
    .wcai-chat-reset:hover {
      background: rgba(255,255,255,0.2);
    }
    .wcai-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: 28px; /* prevent last line from visually “kissing” the edge */
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #16213e;
      min-height: 100px;
      max-height: 340px;
      scroll-padding-bottom: 28px;
    }
    .wcai-message {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
      flex-shrink: 0;
    }
    .wcai-message.user {
      align-self: flex-end;
      background: linear-gradient(135deg, ${colors.primary}, #8b5cf6);
      color: ${colors.text};
      border-bottom-right-radius: 4px;
    }
    .wcai-message.agent {
      align-self: flex-start;
      background: #0f3460;
      color: #e2e8f0;
      border: 1px solid rgba(139,92,246,0.3);
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .wcai-message.typing {
      background: #0f3460;
    }
    .wcai-typing-dots {
      display: flex;
      gap: 4px;
      padding: 4px 0;
    }
    .wcai-typing-dots span {
      width: 8px;
      height: 8px;
      background: ${colors.primary};
      border-radius: 50%;
      animation: wcai-bounce 1.4s infinite ease-in-out;
    }
    .wcai-typing-dots span:nth-child(1) { animation-delay: 0s; }
    .wcai-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .wcai-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes wcai-bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
    .wcai-quick-actions {
      padding: 12px 16px;
      background: #1a1a2e;
      border-top: 1px solid rgba(139,92,246,0.2);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .wcai-quick-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid rgba(139,92,246,0.3);
      background: #0f3460;
      cursor: pointer;
      font-size: 14px;
      color: #e2e8f0;
      transition: all 0.2s;
      text-align: left;
      width: 100%;
    }
    .wcai-quick-btn:hover {
      border-color: ${colors.primary};
      background: rgba(230,0,126,0.1);
    }
    .wcai-quick-btn.primary {
      background: linear-gradient(135deg, ${colors.primary}, #8b5cf6);
      border: none;
      color: white;
      font-weight: 600;
    }
    .wcai-quick-btn.primary:hover {
      background: linear-gradient(135deg, #c5006b, ${colors.primary});
    }
    .wcai-quick-btn-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .wcai-chat-input-area {
      padding: 12px 16px;
      border-top: 1px solid rgba(139,92,246,0.2);
      background: #1a1a2e;
      display: flex;
      gap: 10px;
    }
    .wcai-chat-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid rgba(139,92,246,0.3);
      border-radius: 24px;
      background: #0f3460;
      color: #e2e8f0;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .wcai-chat-input::placeholder {
      color: #64748b;
    }
    .wcai-chat-input:focus {
      border-color: ${colors.primary};
      background: #16213e;
    }
    .wcai-chat-send {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, ${colors.primary}, #8b5cf6);
      color: ${colors.text};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .wcai-chat-send:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 16px rgba(230,0,126,0.5);
    }
    .wcai-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .wcai-chat-attach {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid rgba(139,92,246,0.3);
      background: #0f3460;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .wcai-chat-attach:hover {
      border-color: ${colors.primary};
      color: ${colors.primary};
      background: #16213e;
    }
    .wcai-powered {
      padding: 8px 16px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      background: #1a1a2e;
      border-top: 1px solid rgba(139,92,246,0.1);
    }
    .wcai-powered a {
      color: ${colors.primary};
      text-decoration: none;
    }
    .wcai-test-badge {
      position: absolute;
      top: -8px;
      left: -8px;
      background: #ef4444;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    /*
      IMPORTANT:
      overflow:hidden can visually clip multi-line messages during typing
      (especially with dynamic height + scroll).
    */
    .wcai-typewriter {
      overflow: visible;
      border-right: 2px solid ${colors.primary};
      animation: wcai-cursor 0.7s step-end infinite;
    }
    .wcai-typewriter.done {
      border-right: none;
    }
    @keyframes wcai-cursor {
      0%, 100% { border-color: ${colors.primary}; }
      50% { border-color: transparent; }
    }
    
    /* Modal styles - dark theme */
    .wcai-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: wcai-fade-in 0.2s ease-out;
    }
    @keyframes wcai-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .wcai-modal {
      background: #1a1a2e;
      border-radius: 16px;
      padding: 24px;
      max-width: 360px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      border: 1px solid rgba(139,92,246,0.3);
      animation: wcai-modal-in 0.3s ease-out;
    }
    @keyframes wcai-modal-in {
      from { opacity: 0; transform: scale(0.9) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .wcai-modal h3 {
      margin: 0 0 12px;
      font-size: 18px;
      color: #e2e8f0;
    }
    .wcai-modal p {
      margin: 0 0 20px;
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
    }
    .wcai-modal ul {
      margin: 0 0 16px;
      padding-left: 20px;
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
    }
    .wcai-modal-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .wcai-modal-btn {
      padding: 14px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .wcai-modal-btn.confirm {
      background: linear-gradient(135deg, ${colors.primary}, #8b5cf6);
      color: white;
    }
    .wcai-modal-btn.confirm:hover {
      box-shadow: 0 4px 16px rgba(230,0,126,0.4);
    }
    .wcai-modal-btn.cancel {
      background: #0f3460;
      color: #e2e8f0;
      border: 1px solid rgba(139,92,246,0.3);
    }
    .wcai-modal-btn.cancel:hover {
      background: #16213e;
    }
    
    /* Upload progress - dark theme */
    .wcai-upload-progress {
      background: #0f3460;
      border-radius: 8px;
      padding: 12px 16px;
      margin: 8px 0;
    }
    .wcai-upload-progress-bar {
      height: 6px;
      background: #16213e;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 8px;
    }
    .wcai-upload-progress-fill {
      height: 100%;
      background: linear-gradient(135deg, ${colors.primary}, #8b5cf6);
      border-radius: 3px;
      transition: width 0.3s ease-out;
    }
    .wcai-upload-text {
      font-size: 13px;
      color: #e2e8f0;
    }
    
    @media (max-width: 480px) {
      .wcai-chat-window {
        width: calc(100vw - 40px);
        max-height: calc(100vh - 120px);
        bottom: 70px;
        right: -10px;
      }
    }
  `;

  // Create style element
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // Session ID - ALWAYS FRESH on every page load
  // Each page load = new conversation = no old data bleeding through
  function generateSessionId() {
    return 'wcai_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Clear any old session data
  localStorage.removeItem('wcai_session');
  sessionStorage.removeItem('wcai_session');

  // Always generate fresh session
  let sessionId = generateSessionId();

  // Create quick actions HTML - only 3 wired buttons
  const quickActionsHTML = quickActions.map(action => {
    const btnClass = action.primary ? 'wcai-quick-btn primary' : 'wcai-quick-btn';
    return `<button class="${btnClass}" data-action="${action.id}">
      <span class="wcai-quick-btn-icon">${action.icon}</span>
      ${action.text}
    </button>`;
  }).join('');

  // Create chat container
  const container = document.createElement('div');
  container.className = 'wcai-chat-container';
  container.innerHTML = `
    <div class="wcai-chat-window" id="wcai-window">
      <div class="wcai-chat-header">
        <div class="wcai-chat-header-avatar">J</div>
        <div class="wcai-chat-header-info">
          <h3>Jordan</h3>
          <p><span class="wcai-live-dot"></span> WPW Live Chat Agent • Online</p>
        </div>
        <button class="wcai-chat-reset" id="wcai-reset" title="Start a new quote (clears this chat)">
          ↻ New quote
        </button>
        <button class="wcai-chat-close" id="wcai-close">&times;</button>
      </div>
      <div class="wcai-chat-messages" id="wcai-messages">
        <div class="wcai-message agent" id="wcai-welcome"></div>
      </div>
      <div class="wcai-quick-actions" id="wcai-quick-actions">
        ${quickActionsHTML}
      </div>
      <div class="wcai-chat-input-area">
        <button class="wcai-chat-attach" id="wcai-attach" title="Attach file – AI will analyze your artwork">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <input type="text" class="wcai-chat-input" id="wcai-input" placeholder="Type a message..." />
        <button class="wcai-chat-send" id="wcai-send">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
      <div class="wcai-powered">
        Powered by <a href="https://weprintwraps.com" target="_blank">weprintwraps.com</a>
      </div>
    </div>
    <div class="wcai-bubble-row">
      <div class="wcai-ask-trigger" id="wcai-ask-trigger">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        Need wrap pricing?
      </div>
      <div class="wcai-chat-bubble" id="wcai-bubble">
        ${config.mode === 'test' ? '<span class="wcai-test-badge">TEST</span>' : ''}
        <img src="${WPW_LOGO}" alt="WPW" onerror="this.outerHTML='<svg viewBox=\\'0 0 24 24\\' fill=\\'white\\' width=\\'28\\'><path d=\\'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z\\'/></svg>'"/>
        <span class="wcai-bubble-pulse"></span>
      </div>
    </div>
    <input type="file" id="wcai-file-input" style="display:none" accept=".pdf,.png,.jpg,.jpeg,.psd,.ai,.eps,.tif,.tiff" />
  `;
  document.body.appendChild(container);

  // Elements
  const bubble = document.getElementById('wcai-bubble');
  const askTrigger = document.getElementById('wcai-ask-trigger');
  const chatWindow = document.getElementById('wcai-window');
  const closeBtn = document.getElementById('wcai-close');
  const resetBtn = document.getElementById('wcai-reset');
  const messagesContainer = document.getElementById('wcai-messages');
  const welcomeMessage = document.getElementById('wcai-welcome');
  const quickActionsContainer = document.getElementById('wcai-quick-actions');
  const input = document.getElementById('wcai-input');
  const sendBtn = document.getElementById('wcai-send');
  const attachBtn = document.getElementById('wcai-attach');
  const fileInput = document.getElementById('wcai-file-input');

  let isOpen = false;
  let hasInteracted = false;
  let isCheckMyFileFlow = false; // Tracks if file upload is from "Check My File" button

  // Attach button opens file picker directly (no confirmation modal for general uploads)
  if (attachBtn) {
    attachBtn.addEventListener('click', () => {
      // Check rate limit
      if (fileUploadCount >= MAX_UPLOADS_PER_SESSION) {
        addMessage("You've reached the upload limit for this session. Please email your files to Design@WePrintWraps.com for review.", false);
        return;
      }
      isCheckMyFileFlow = false; // Direct attach, not Check My File
      fileInput.click();
    });
  }

  // Hide ask trigger after first interaction
  function hideAskTrigger() {
    if (askTrigger && !askTrigger.classList.contains('hidden')) {
      askTrigger.classList.add('hidden');
    }
  }

  // Ask trigger opens chat too
  if (askTrigger) {
    askTrigger.addEventListener('click', () => {
      toggleChat();
    });
  }

  // Typewriter effect
  function typeMessage(element, text, speed = 30) {
    return new Promise((resolve) => {
      element.classList.add('wcai-typewriter');
      element.textContent = '';
      let i = 0;
      
      function type() {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          // Keep viewport pinned to newest content while typing (prevents “cut off” look)
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
          setTimeout(type, speed);
        } else {
          element.classList.remove('wcai-typewriter');
          element.classList.add('done');
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
          resolve();
        }
      }
      
      // Small delay before starting to simulate "thinking"
      setTimeout(type, 500);
    });
  }

  // Type welcome message on first open
  function showWelcomeMessage() {
    const welcomeText = "How can I help you?";
    typeMessage(welcomeMessage, welcomeText, 25);
  }

  // Toggle chat
  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.classList.toggle('open', isOpen);
    if (isOpen) {
      input.focus();
      if (!hasInteracted) {
        hasInteracted = true;
        showWelcomeMessage();
      }
    }
  }

  function resetConversation() {
    // Fresh sessionId => fresh transcript + fresh backend context
    sessionId = generateSessionId();

    // Clear messages and re-run welcome
    if (messagesContainer && welcomeMessage) {
      welcomeMessage.textContent = '';
      messagesContainer.replaceChildren(welcomeMessage);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hasInteracted = true;
    showWelcomeMessage();

    // Re-show quick actions for the new conversation
    if (quickActionsContainer) {
      quickActionsContainer.style.display = '';
    }
  }

  bubble.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetConversation();
    });
  }

  // Add message to UI with optional typewriter
  function addMessage(text, isUser, useTypewriter = false) {
    const msg = document.createElement('div');
    msg.className = `wcai-message ${isUser ? 'user' : 'agent'}`;
    
    if (useTypewriter && !isUser) {
      messagesContainer.appendChild(msg);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      return typeMessage(msg, text, 20);
    } else {
      msg.textContent = text;
      messagesContainer.appendChild(msg);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      return Promise.resolve();
    }
  }

  // Show typing indicator
  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'wcai-message agent typing';
    typing.id = 'wcai-typing';
    typing.innerHTML = '<div class="wcai-typing-dots"><span></span><span></span><span></span></div>';
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTyping() {
    const typing = document.getElementById('wcai-typing');
    if (typing) typing.remove();
  }

  // Hide quick actions after first interaction
  function hideQuickActions() {
    if (quickActionsContainer) {
      quickActionsContainer.style.display = 'none';
    }
  }

  // Show confirmation modal for Check My File
  function showCheckFileModal() {
    // Check rate limit
    if (fileUploadCount >= MAX_UPLOADS_PER_SESSION) {
      addMessage("You've reached the upload limit for this session. Please email your files to Design@WePrintWraps.com for review.", false);
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'wcai-modal-overlay';
    overlay.id = 'wcai-modal-overlay';
    overlay.innerHTML = `
      <div class="wcai-modal">
        <h3>📎 Check My File</h3>
        <p>This file check is for <strong>full vehicle wraps over 200 sq ft</strong>. Our design team will review your file and email you with:</p>
        <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:14px;line-height:1.6;">
          <li>Whether it's print-ready</li>
          <li>A quote for your wrap project</li>
          <li>Design services if needed</li>
        </ul>
        <p style="font-size:13px;color:#6b7280;margin-bottom:16px;">
          💡 For sq ft pricing, use <a href="https://weprintwraps.com/quote" target="_blank" style="color:${colors.primary};">our quote tool</a> - select your make & model!
        </p>
        <div class="wcai-modal-buttons">
          <button class="wcai-modal-btn confirm" id="wcai-modal-yes">Yes, this is a full wrap over 200 sq ft</button>
          <button class="wcai-modal-btn cancel" id="wcai-modal-no">No / Not sure</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    document.getElementById('wcai-modal-yes').addEventListener('click', () => {
      overlay.remove();
      isCheckMyFileFlow = true; // Set flag for Check My File flow
      fileInput.click();
    });

    document.getElementById('wcai-modal-no').addEventListener('click', () => {
      overlay.remove();
      hideQuickActions();
      addMessage("No worries! The file check feature is for full vehicle wraps over 200 sq ft.\n\nFor smaller projects or partial wraps, you can still get a quote!\n\n1. Visit weprintwraps.com/quote\n2. Select your vehicle make & model\n3. Get instant sq ft pricing\n\nThen attach your artwork when you order - our team reviews all files before production.\n\nWant help with something else?", false);
    });
  }

  // Handle file selection
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (50MB max)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      addMessage("That file is too large (max 50MB). Please compress it or email it directly to Design@WePrintWraps.com", false);
      fileInput.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['pdf', 'png', 'jpg', 'jpeg', 'psd', 'ai', 'eps', 'tif', 'tiff'];
    const ext = file.name.toLowerCase().split('.').pop();
    if (!allowedTypes.includes(ext)) {
      addMessage(`That file type (.${ext}) isn't supported. Please upload a PDF, PNG, JPG, AI, EPS, PSD, or TIFF file.`, false);
      fileInput.value = '';
      return;
    }

    hideQuickActions();
    hideAskTrigger();

    // Show upload progress
    addMessage(`📎 Uploading: ${file.name}`, true);
    
    const progressDiv = document.createElement('div');
    progressDiv.className = 'wcai-upload-progress';
    progressDiv.innerHTML = `
      <div class="wcai-upload-text">Uploading your artwork... <span id="wcai-progress-pct">0%</span></div>
      <div class="wcai-upload-progress-bar">
        <div class="wcai-upload-progress-fill" id="wcai-progress-fill" style="width: 0%"></div>
      </div>
    `;
    messagesContainer.appendChild(progressDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      // Upload to Supabase Storage
      const timestamp = Date.now();
      const storagePath = `artwork-check/${sessionId}/${timestamp}-${file.name}`;
      
      // Simulate progress (actual XHR would provide real progress)
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + 10, 90);
        document.getElementById('wcai-progress-pct').textContent = progress + '%';
        document.getElementById('wcai-progress-fill').style.width = progress + '%';
      }, 200);

      // Upload using fetch to Supabase Storage REST API
      const uploadResponse = await fetch(`${config.supabaseUrl}/storage/v1/object/media-library/${storagePath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.supabaseAnonKey}`,
          'apikey': config.supabaseAnonKey,
          'Content-Type': file.type || 'application/octet-stream',
          'x-upsert': 'true'
        },
        body: file
      });

      clearInterval(progressInterval);

      if (!uploadResponse.ok) {
        throw new Error('Upload failed: ' + uploadResponse.statusText);
      }

      // Update progress to 100%
      document.getElementById('wcai-progress-pct').textContent = '100%';
      document.getElementById('wcai-progress-fill').style.width = '100%';

      // Get public URL
      const fileUrl = `${config.supabaseUrl}/storage/v1/object/public/media-library/${storagePath}`;

      // Remove progress bar after a moment
      setTimeout(() => progressDiv.remove(), 1000);

      // Increment upload count
      fileUploadCount++;

      // Different handling based on flow type
      if (isCheckMyFileFlow) {
        // CHECK MY FILE FLOW: Call check-artwork-file edge function
        showTyping();
        
        const checkResponse = await fetch(config.artworkCheckUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.supabaseAnonKey
          },
          body: JSON.stringify({
            session_id: sessionId,
            file_url: fileUrl,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            customer_confirmed_full_wrap: true,
            geo_data: geoData
          })
        });

        const checkData = await checkResponse.json();
        hideTyping();

        if (checkData.success && checkData.message) {
          await addMessage(checkData.message, false, true);
          
          // Follow up asking for email
          setTimeout(async () => {
            await addMessage("What email should our design team reach you at?", false, true);
          }, 1500);
        } else {
          addMessage("Got your file! ✓ Our design team will review it and email you with a detailed analysis and quote. What email should they reach you at?", false);
        }
      } else {
        // DIRECT ATTACH FLOW: Send to Jordan AI (website-chat) with attachment for vision analysis
        showTyping();
        
        const isImage = ['png', 'jpg', 'jpeg', 'tif', 'tiff'].includes(ext);
        
        const chatResponse = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.supabaseAnonKey
          },
          body: JSON.stringify({
            org: config.org,
            agent: config.agent,
            mode: config.mode,
            session_id: sessionId,
            message_text: `[Customer attached a file: ${file.name}]`,
            page_url: window.location.href,
            referrer: document.referrer,
            geo: geoData,
            attachments: [{
              url: fileUrl,
              type: file.type,
              name: file.name
            }]
          })
        });

        const data = await chatResponse.json();
        hideTyping();

        if (data.response) {
          await addMessage(data.response, false, true);
        } else {
          addMessage(`Got your file! 📎 I can see you've attached **${file.name}**. What would you like me to help you with regarding this file?`, false);
        }
      }
      
      // Reset the flow flag
      isCheckMyFileFlow = false;

    } catch (err) {
      console.error('[WCAI] Upload error:', err);
      document.getElementById('wcai-progress-pct').textContent = 'Failed';
      setTimeout(() => progressDiv.remove(), 2000);
      addMessage("Sorry, there was an issue uploading your file. Please try again or email it directly to Design@WePrintWraps.com", false);
    }

    fileInput.value = '';
  });

  // Send message
  async function sendMessage(text) {
    const messageText = text || input.value.trim();
    if (!messageText) return;

    hideQuickActions();
    hideAskTrigger();
    addMessage(messageText, true);
    input.value = '';
    sendBtn.disabled = true;
    showTyping();

    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.supabaseAnonKey
        },
        body: JSON.stringify({
          org: config.org,
          agent: config.agent,
          mode: config.mode,
          session_id: sessionId,
          message_text: messageText,
          page_url: window.location.href,
          referrer: document.referrer,
          geo: geoData
        })
      });

      const data = await response.json();
      hideTyping();

      if (data.reply || data.message) {
        await addMessage(data.reply || data.message, false, true);
      } else if (data.error) {
        addMessage('Sorry, something went wrong. Please try again!', false);
      }
    } catch (err) {
      hideTyping();
      addMessage('Connection error. Please check your internet and try again.', false);
      console.error('WCAI Error:', err);
    }

    sendBtn.disabled = false;
    input.focus();
  }

  // Quick action click handlers
  quickActionsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.wcai-quick-btn');
    if (btn) {
      const actionId = btn.getAttribute('data-action');
      
      // Special handler for Check My File
      if (actionId === 'check-file') {
        showCheckFileModal();
        return;
      }
      
      // Find the action and send its message
      const action = quickActions.find(a => a.id === actionId);
      if (action && action.message) {
        sendMessage(action.message);
      }
    }
  });

  sendBtn.addEventListener('click', () => sendMessage());
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  console.log('[WrapCommand AI] Chat widget loaded', { org: config.org, mode: config.mode });
})();
