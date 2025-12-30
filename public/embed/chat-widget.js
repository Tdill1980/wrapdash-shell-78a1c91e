(function() {
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
    apiUrl: 'https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1/luigi-ordering-concierge'
  };

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
    .wcai-chat-bubble {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #405DE6 0%, #833AB4 50%, #E1306C 100%);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .wcai-chat-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(0,0,0,0.4);
    }
    .wcai-chat-bubble svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
    .wcai-chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      height: 500px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .wcai-chat-window.open {
      display: flex;
    }
    .wcai-chat-header {
      background: linear-gradient(135deg, #405DE6 0%, #833AB4 50%, #E1306C 100%);
      padding: 16px 20px;
      color: white;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .wcai-chat-header-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .wcai-chat-header-info h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    .wcai-chat-header-info p {
      margin: 2px 0 0;
      font-size: 12px;
      opacity: 0.9;
    }
    .wcai-chat-close {
      margin-left: auto;
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 24px;
      padding: 0;
      line-height: 1;
    }
    .wcai-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8fafc;
    }
    .wcai-message {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.4;
    }
    .wcai-message.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #405DE6, #833AB4);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .wcai-message.agent {
      align-self: flex-start;
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
    }
    .wcai-message.typing {
      background: #f1f5f9;
    }
    .wcai-typing-dots {
      display: flex;
      gap: 4px;
    }
    .wcai-typing-dots span {
      width: 8px;
      height: 8px;
      background: #833AB4;
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
    .wcai-chat-input-area {
      padding: 16px;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      gap: 10px;
    }
    .wcai-chat-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #cbd5e1;
      border-radius: 24px;
      background: #ffffff;
      color: #0f172a;
      font-size: 14px;
      outline: none;
    }
    .wcai-chat-input::placeholder {
      color: #94a3b8;
    }
    .wcai-chat-input:focus {
      border-color: #833AB4;
    }
    .wcai-chat-send {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #405DE6, #E1306C);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    .wcai-chat-send:hover {
      transform: scale(1.05);
    }
    .wcai-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .wcai-test-badge {
      position: absolute;
      top: -8px;
      left: -8px;
      background: #ff6b6b;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    @media (max-width: 480px) {
      .wcai-chat-window {
        width: calc(100vw - 40px);
        height: calc(100vh - 120px);
        bottom: 70px;
        right: -10px;
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

  // Create chat container
  const container = document.createElement('div');
  container.className = 'wcai-chat-container';
  container.innerHTML = `
    <div class="wcai-chat-window" id="wcai-window">
      <div class="wcai-chat-header">
        <div class="wcai-chat-header-avatar">J</div>
        <div class="wcai-chat-header-info">
          <h3>Jordan</h3>
          <p>WPW Live Chat Agent • Online</p>
        </div>
        <button class="wcai-chat-close" id="wcai-close">&times;</button>
      </div>
      <div class="wcai-chat-messages" id="wcai-messages">
        <div class="wcai-message agent">
          Hey! I'm Jordan with WePrintWraps.com. What can I help you with today?
        </div>
      </div>
      <div class="wcai-chat-input-area">
        <input type="text" class="wcai-chat-input" id="wcai-input" placeholder="Type your message..." />
        <button class="wcai-chat-send" id="wcai-send">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="wcai-chat-bubble" id="wcai-bubble">
      ${config.mode === 'test' ? '<span class="wcai-test-badge">TEST</span>' : ''}
      <svg viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
    </div>
  `;
  document.body.appendChild(container);

  // Elements
  const bubble = document.getElementById('wcai-bubble');
  const chatWindow = document.getElementById('wcai-window');
  const closeBtn = document.getElementById('wcai-close');
  const messagesContainer = document.getElementById('wcai-messages');
  const input = document.getElementById('wcai-input');
  const sendBtn = document.getElementById('wcai-send');

  let isOpen = false;

  // Toggle chat
  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.classList.toggle('open', isOpen);
    if (isOpen) input.focus();
  }

  bubble.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  // Add message to UI
  function addMessage(text, isUser) {
    const msg = document.createElement('div');
    msg.className = `wcai-message ${isUser ? 'user' : 'agent'}`;
    msg.textContent = text;
    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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

  // Send message
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, true);
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
          message_text: text,
          page_url: window.location.href,
          referrer: document.referrer,
          geo: geoData
        })
      });

      const data = await response.json();
      hideTyping();

      if (data.reply || data.message) {
        addMessage(data.reply || data.message, false);
      } else if (data.error) {
        addMessage('Sorry, something went wrong. Please try again!', false);
      }
    } catch (err) {
      hideTyping();
      addMessage('Connection error. Please check your internet and try again.', false);
      console.error('WCAI Error:', err);
    }

    sendBtn.disabled = false;
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  console.log('[WrapCommand AI] Chat widget loaded', { org: config.org, mode: config.mode });
})();