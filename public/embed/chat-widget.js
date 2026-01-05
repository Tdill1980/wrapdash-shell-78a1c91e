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
    apiUrl: 'https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1/website-chat',
    statusUrl: 'https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1/check-agent-status'
  };

  // ========================================
  // RUNTIME SCHEDULE CHECK - Ask WrapCommand if agent is active
  // This happens BEFORE rendering anything. Fail-safe = OFF.
  // ========================================
  try {
    const statusRes = await fetch(`${config.statusUrl}?agent=${config.agent}`);
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

  // Quick action buttons config
  const quickActions = [
    { id: 'quote', text: 'Get an exact quote', icon: '💬' },
    { id: 'cost', text: 'How much does a wrap cost?', icon: '$', primary: true },
    { id: 'order', text: 'How do I order?', icon: '📦' },
    { id: 'email', text: 'Email my quote', icon: '✉️' },
    { id: 'status', text: 'Order status', icon: '📋' },
    { id: 'bulk', text: 'Bulk / Fleet pricing', icon: '🚗' },
    { id: 'shipping', text: 'Production & Shipping', icon: '🕐' }
  ];

  // Geo data (fetched on load)
  let geoData = null;

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

  // Styles
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
      background: #0057b8;
      border-radius: 24px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 500;
      color: #ffffff;
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
      border-color: #0057b8;
    }
    .wcai-ask-trigger svg {
      width: 16px;
      height: 16px;
      color: #ffffff;
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
      background: #e6007e;
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
      background: #22c55e;
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
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e2e8f0;
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
      background: #e6007e;
      padding: 16px 20px;
      color: white;
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
      color: white;
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
      background: #22c55e;
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
      color: white;
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
    .wcai-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8fafc;
      min-height: 100px;
      max-height: 280px;
    }
    .wcai-message {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
    }
    .wcai-message.user {
      align-self: flex-end;
      background: #0057b8;
      color: white;
      border-bottom-right-radius: 4px;
    }
    .wcai-message.agent {
      align-self: flex-start;
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .wcai-message.typing {
      background: #ffffff;
    }
    .wcai-typing-dots {
      display: flex;
      gap: 4px;
      padding: 4px 0;
    }
    .wcai-typing-dots span {
      width: 8px;
      height: 8px;
      background: #e6007e;
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
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
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
      border: 1px solid #e2e8f0;
      background: #ffffff;
      cursor: pointer;
      font-size: 14px;
      color: #374151;
      transition: all 0.2s;
      text-align: left;
    }
    .wcai-quick-btn:hover {
      border-color: #e6007e;
      background: #fdf2f8;
    }
    .wcai-quick-btn.primary {
      background: linear-gradient(135deg, #f97316, #fb923c);
      border: none;
      color: white;
      font-weight: 600;
    }
    .wcai-quick-btn.primary:hover {
      background: linear-gradient(135deg, #ea580c, #f97316);
    }
    .wcai-quick-btn-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .wcai-quick-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .wcai-chat-input-area {
      padding: 12px 16px;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      gap: 10px;
    }
    .wcai-chat-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      background: #f8fafc;
      color: #1e293b;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .wcai-chat-input::placeholder {
      color: #94a3b8;
    }
    .wcai-chat-input:focus {
      border-color: #e6007e;
      background: #ffffff;
    }
    .wcai-chat-send {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: #e6007e;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .wcai-chat-send:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(230, 0, 126, 0.4);
    }
    .wcai-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .wcai-powered {
      padding: 8px 16px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
    }
    .wcai-powered a {
      color: #e6007e;
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
    .wcai-typewriter {
      overflow: hidden;
      border-right: 2px solid #e6007e;
      animation: wcai-cursor 0.7s step-end infinite;
    }
    .wcai-typewriter.done {
      border-right: none;
    }
    @keyframes wcai-cursor {
      0%, 100% { border-color: #e6007e; }
      50% { border-color: transparent; }
    }
    @media (max-width: 480px) {
      .wcai-chat-window {
        width: calc(100vw - 40px);
        max-height: calc(100vh - 120px);
        bottom: 70px;
        right: -10px;
      }
      .wcai-quick-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  // Create style element
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // Session ID for conversation continuity
  const sessionId = localStorage.getItem('wcai_session') || 
    'wcai_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  localStorage.setItem('wcai_session', sessionId);

  // Create quick actions HTML
  const quickActionsHTML = quickActions.map(action => {
    if (action.primary) {
      return `<button class="wcai-quick-btn primary" data-action="${action.id}">
        <span class="wcai-quick-btn-icon">${action.icon}</span>
        ${action.text}
      </button>`;
    }
    return null;
  }).filter(Boolean).join('') + 
  '<div class="wcai-quick-grid">' +
  quickActions.filter(a => !a.primary).map(action => 
    `<button class="wcai-quick-btn" data-action="${action.id}">
      <span class="wcai-quick-btn-icon">${action.icon}</span>
      ${action.text}
    </button>`
  ).join('') + '</div>';

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
        <button class="wcai-chat-close" id="wcai-close">&times;</button>
      </div>
      <div class="wcai-chat-messages" id="wcai-messages">
        <div class="wcai-message agent" id="wcai-welcome"></div>
      </div>
      <div class="wcai-quick-actions" id="wcai-quick-actions">
        ${quickActionsHTML}
      </div>
      <div class="wcai-chat-input-area">
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
  `;
  document.body.appendChild(container);

  // Elements
  const bubble = document.getElementById('wcai-bubble');
  const askTrigger = document.getElementById('wcai-ask-trigger');
  const chatWindow = document.getElementById('wcai-window');
  const closeBtn = document.getElementById('wcai-close');
  const messagesContainer = document.getElementById('wcai-messages');
  const welcomeMessage = document.getElementById('wcai-welcome');
  const quickActionsContainer = document.getElementById('wcai-quick-actions');
  const input = document.getElementById('wcai-input');
  const sendBtn = document.getElementById('wcai-send');

  let isOpen = false;
  let hasInteracted = false;

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
          setTimeout(type, speed);
        } else {
          element.classList.remove('wcai-typewriter');
          element.classList.add('done');
          resolve();
        }
      }
      
      // Small delay before starting to simulate "thinking"
      setTimeout(type, 500);
    });
  }

  // Type welcome message on first open
  function showWelcomeMessage() {
    const welcomeText = "Hey! I'm Jordan with WePrintWraps.com. What can I help you with today?";
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

  bubble.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

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

  // Send message
  async function sendMessage(text) {
    const messageText = text || input.value.trim();
    if (!messageText) return;

    hideQuickActions();
    hideAskTrigger(); // Hide the ask trigger after first message
    addMessage(messageText, true);
    input.value = '';
    sendBtn.disabled = true;
    showTyping();

    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const actionText = btn.textContent.trim();
      sendMessage(actionText);
    }
  });

  sendBtn.addEventListener('click', () => sendMessage());
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  console.log('[WrapCommand AI] Chat widget loaded', { org: config.org, mode: config.mode });
})();
