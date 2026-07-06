import './styles/main.css';
import { Message, ChatState } from './types';
import {
  initializeGemini,
  createChatSession,
  sendMessage,
  getInitialGreeting,
  resetChat,
  formatMarkdown,
  setTopicAndLevel,
} from './utils/gemini';
import { generateId, formatTime } from './utils/helpers';

// ─── HARDCODED KEY ────────────────────────────────────────────────────────────
const DEFAULT_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// ─── STATE ────────────────────────────────────────────────────────────────────
let messages: Message[] = [];
let chatState: ChatState = 'idle';
let messageCount = 0;
let sessionStart = Date.now();
let progressPercent = 0;
let selectedTopic = '';
let selectedLevel = '';

const getEl = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// ─── RENDER APP ───────────────────────────────────────────────────────────────
function renderApp() {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `

    <!-- TOPIC PICKER SCREEN -->
    <div class="setup-screen" id="topic-screen">
      <div class="setup-card" style="max-width:520px">
        <div class="setup-logo">🎓</div>
        <h1>EduGuide Bot</h1>
        <p>Your personal AI tutor. Pick a topic and level — we handle the rest.</p>

        <div class="setup-input-group" style="gap:12px">
          <input
            type="text"
            class="api-input"
            id="topic-input"
            placeholder="What do you want to learn? (e.g. German, Python, Algebra...)"
            autocomplete="off"
          />

          <div style="display:flex; gap:10px; width:100%">
            <button class="level-btn" data-level="Beginner" id="btn-beginner">🌱 Beginner</button>
            <button class="level-btn" data-level="Intermediate" id="btn-intermediate">🔥 Intermediate</button>
            <button class="level-btn" data-level="Advanced" id="btn-advanced">🚀 Advanced</button>
          </div>

          <button class="btn-primary" id="start-learning-btn" disabled>
            Start Learning →
          </button>
        </div>

        <div class="setup-link" style="margin-top:16px; opacity:0.5; font-size:12px">
          Powered by Groq · Llama 3.3 · Auto language detection
        </div>
      </div>
    </div>

    <!-- Header -->
    <header class="header" id="main-app" style="display:none">
      <div class="header-brand">
        <div class="header-icon">🎓</div>
        <div>
          <div class="header-title">Edu<span>Guide</span> Bot</div>
          <div class="header-subtitle" id="header-subtitle">Personalized AI Learning</div>
        </div>
      </div>
      <div class="header-actions">
        <div class="status-badge">
          <div class="status-dot"></div>
          Groq AI
        </div>
        <button class="btn-icon" id="reset-btn" title="Restart course">🔄</button>
      </div>
    </header>

    <!-- Main Chat Container -->
    <div class="chat-container" id="chat-container" style="display:none">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-section">
          <h3>Current Course</h3>
          <div class="progress-card">
            <div id="course-info" style="font-size:13px; color:var(--text-secondary); margin-bottom:8px">
              No topic selected
            </div>
            <div class="progress-label">
              <span>Progress</span>
              <span id="progress-pct">0%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill" style="width:0%"></div>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>Session Stats</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value" id="stat-messages">0</div>
              <div class="stat-label">Messages</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" id="stat-time">0m</div>
              <div class="stat-label">Time</div>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>Quick Replies</h3>
          <div id="suggestions-sidebar"></div>
        </div>

        <div class="sidebar-section">
          <button class="btn-primary" id="change-topic-btn" style="width:100%; font-size:13px; padding:10px">
            📚 Change Topic
          </button>
        </div>
      </aside>

      <!-- Chat Area -->
      <main class="chat-area">
        <div class="messages-container" id="messages-container">
          <div class="welcome-state" id="welcome-state">
            <div class="welcome-icon">🎓</div>
            <h2>Preparing your course...</h2>
            <p>EduGuide is building your personalized roadmap</p>
          </div>
        </div>

        <div class="suggestions-bar" id="suggestions-bar" style="display:none"></div>

        <div class="input-area">
          <div class="input-wrapper">
            <textarea
              class="chat-input"
              id="chat-input"
              placeholder="Answer the question or ask for clarification..."
              rows="1"
              disabled
            ></textarea>
            <button class="send-btn" id="send-btn" disabled>➤</button>
          </div>
          <div class="input-footer">
            <span class="input-hint">Enter to send · Shift+Enter for new line</span>
          </div>
        </div>
      </main>
    </div>
  `;

  initTopicScreen();
  renderSidebarSuggestions();
  updateStats();
  startStatsTimer();
}

// ─── TOPIC SCREEN ─────────────────────────────────────────────────────────────
function initTopicScreen() {
  const topicInput = getEl<HTMLInputElement>('topic-input');
  const startBtn = getEl<HTMLButtonElement>('start-learning-btn');
  const levelBtns = document.querySelectorAll<HTMLButtonElement>('.level-btn');

  levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      levelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedLevel = btn.dataset.level || '';
      updateStartBtn();
    });
  });

  topicInput.addEventListener('input', () => {
    selectedTopic = topicInput.value.trim();
    updateStartBtn();
  });

  topicInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !startBtn.disabled) startLearning();
  });

  startBtn.addEventListener('click', startLearning);
}

function updateStartBtn() {
  const startBtn = getEl<HTMLButtonElement>('start-learning-btn');
  startBtn.disabled = !selectedTopic || !selectedLevel;
}

async function startLearning() {
  const key = sessionStorage.getItem('groq_key') || DEFAULT_API_KEY;

  try {
    // ORDER MATTERS: initialize → set topic → create session
    initializeGemini(key);
    setTopicAndLevel(selectedTopic, selectedLevel);
    createChatSession();
    sessionStorage.setItem('groq_key', key);

    getEl('topic-screen').style.display = 'none';
    getEl('main-app').style.display = '';
    getEl('chat-container').style.display = '';

    const subtitle = getEl('header-subtitle');
    if (subtitle) subtitle.textContent = `${selectedTopic} · ${selectedLevel}`;

    const courseInfo = getEl('course-info');
    if (courseInfo) courseInfo.innerHTML = `<strong>${selectedTopic}</strong><br><span style="opacity:0.7">${selectedLevel}</span>`;

    messages = [];
    messageCount = 0;
    progressPercent = 0;
    sessionStart = Date.now();

    setupEventListeners();
    await loadInitialGreeting();
  } catch (err) {
    alert('Connection error. Check your API key.');
  }
}

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────────
function setupEventListeners() {
  const chatInput = getEl<HTMLTextAreaElement>('chat-input');
  const sendBtn = getEl<HTMLButtonElement>('send-btn');
  const resetBtn = getEl<HTMLButtonElement>('reset-btn');
  const changeTopicBtn = getEl<HTMLButtonElement>('change-topic-btn');

  chatInput.addEventListener('input', () => {
    autoResizeTextarea(chatInput);
    sendBtn.disabled = chatInput.value.trim() === '' || chatState !== 'idle';
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) handleSend();
    }
  });

  sendBtn.addEventListener('click', handleSend);

  resetBtn.addEventListener('click', async () => {
    if (confirm('Restart this course from the beginning?')) {
      messages = [];
      messageCount = 0;
      progressPercent = 0;
      sessionStart = Date.now();
      resetChat();
      initializeGemini(sessionStorage.getItem('groq_key') || DEFAULT_API_KEY);
      setTopicAndLevel(selectedTopic, selectedLevel);
      createChatSession();
      renderMessages();
      updateStats();
      updateProgress(0);
      await loadInitialGreeting();
    }
  });

  changeTopicBtn?.addEventListener('click', () => {
    if (confirm('Change topic? Current progress will be lost.')) {
      resetChat();
      messages = [];
      selectedTopic = '';
      selectedLevel = '';
      renderApp();
    }
  });
}

// ─── INITIAL GREETING ─────────────────────────────────────────────────────────
async function loadInitialGreeting() {
  chatState = 'streaming';

  const msgId = generateId();
  const assistantMsg: Message = {
    id: msgId,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    isStreaming: true,
  };
  messages.push(assistantMsg);

  setTimeout(() => {
    const wState = getEl('welcome-state');
    if (wState) wState.style.display = 'none';
    getEl('suggestions-bar').style.display = '';
    renderSuggestions();
  }, 500);

  renderMessages();

  try {
    await getInitialGreeting((chunk) => {
      assistantMsg.content += chunk;
      updateStreamingMessage(msgId, assistantMsg.content);
    });

    assistantMsg.isStreaming = false;
    renderMessages();
    enableInput();
    chatState = 'idle';
    messageCount++;
    updateStats();
    updateProgress(5);
  } catch (err) {
    showError('Connection error. Please check your API key.');
    chatState = 'error';
  }
}

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
async function handleSend() {
  const chatInput = getEl<HTMLTextAreaElement>('chat-input');
  const text = chatInput.value.trim();
  if (!text || chatState !== 'idle') return;

  const userMsg: Message = {
    id: generateId(),
    role: 'user',
    content: text,
    timestamp: new Date(),
  };
  messages.push(userMsg);
  messageCount++;

  chatInput.value = '';
  autoResizeTextarea(chatInput);
  disableInput();
  chatState = 'loading';
  renderMessages();
  scrollToBottom();
  showTypingIndicator();

  const assistantId = generateId();
  const assistantMsg: Message = {
    id: assistantId,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    isStreaming: true,
  };

  try {
    await new Promise(resolve => setTimeout(resolve, 400));
    hideTypingIndicator();
    messages.push(assistantMsg);
    chatState = 'streaming';
    renderMessages();

    await sendMessage(text, (chunk) => {
      assistantMsg.content += chunk;
      updateStreamingMessage(assistantId, assistantMsg.content);
    });

    assistantMsg.isStreaming = false;
    messageCount++;
    renderMessages();
    enableInput();
    chatState = 'idle';
    updateStats();
    updateProgress(Math.min(progressPercent + 5, 100));
    scrollToBottom();
  } catch (err) {
    hideTypingIndicator();
    showError('Error communicating with AI. Please try again.');
    messages = messages.filter(m => m.id !== assistantId);
    renderMessages();
    enableInput();
    chatState = 'idle';
  }
}

// ─── RENDER MESSAGES ──────────────────────────────────────────────────────────
function renderMessages() {
  const container = getEl('messages-container');
  const welcomeState = container.querySelector('.welcome-state');

  if (messages.length === 0) {
    container.innerHTML = `
      <div class="welcome-state" id="welcome-state">
        <div class="welcome-icon">🎓</div>
        <h2>Ready to learn?</h2>
        <p>Your course is loading...</p>
      </div>`;
    return;
  }

  if (welcomeState) welcomeState.remove();

  messages.forEach(msg => {
    const existing = container.querySelector(`[data-id="${msg.id}"]`);
    if (existing) {
      existing.innerHTML = renderMessageInner(msg);
    } else {
      const el = document.createElement('div');
      el.className = `message ${msg.role}`;
      el.dataset.id = msg.id;
      el.innerHTML = renderMessageInner(msg);
      container.appendChild(el);
      scrollToBottom();
    }
  });
}

function updateStreamingMessage(id: string, content: string) {
  const container = getEl('messages-container');
  const msgEl = container.querySelector(`[data-id="${id}"]`);
  if (msgEl) {
    msgEl.innerHTML = renderMessageInner({
      id, role: 'assistant', content, timestamp: new Date(), isStreaming: true,
    });
    scrollToBottom();
  }
}

function renderMessageInner(msg: Message): string {
  const avatar = msg.role === 'assistant' ? '🎓' : '👤';
  const formattedContent = msg.role === 'assistant'
    ? `<p>${formatMarkdown(msg.content)}</p>`
    : escapeHtml(msg.content).replace(/\n/g, '<br>');
  const cursor = msg.isStreaming ? '<span class="streaming-cursor"></span>' : '';

  return `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <div class="message-bubble">${formattedContent}${cursor}</div>
      <div class="message-time">${formatTime(msg.timestamp)}</div>
    </div>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── TYPING INDICATOR ─────────────────────────────────────────────────────────
function showTypingIndicator() {
  const container = getEl('messages-container');
  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.id = 'typing-indicator';
  indicator.innerHTML = `
    <div class="message-avatar" style="background:linear-gradient(135deg,#6c63ff,#ff6584);border-radius:12px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:16px">🎓</div>
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  container.appendChild(indicator);
  scrollToBottom();
}

function hideTypingIndicator() {
  getEl('typing-indicator')?.remove();
}

// ─── SUGGESTIONS ──────────────────────────────────────────────────────────────
function renderSuggestions() {
  const bar = getEl('suggestions-bar');
  const chips = [
    "I don't understand, explain differently",
    "Give me an example",
    "Next lesson please",
    "Summarize what I learned",
  ];
  bar.innerHTML = chips.map(s => `
    <button class="suggestion-chip" onclick="window.sendSuggestion('${s.replace(/'/g, "\\'")}')">${s}</button>
  `).join('');
}

function renderSidebarSuggestions() {
  const container = document.getElementById('suggestions-sidebar');
  if (!container) return;
  const chips = [
    "I don't understand",
    "Give me an example",
    "Next lesson",
  ];
  container.innerHTML = chips.map(s => `
    <button class="quick-action" style="margin-bottom:6px" onclick="window.sendSuggestion('${s.replace(/'/g, "\\'")}')">
      <span class="quick-action-icon">💡</span>${s}
    </button>
  `).join('');
}

(window as unknown as Record<string, unknown>).sendSuggestion = (text: string) => {
  const chatInput = getEl<HTMLTextAreaElement>('chat-input');
  if (chatState !== 'idle' || chatInput.disabled) return;
  chatInput.value = text;
  autoResizeTextarea(chatInput);
  handleSend();
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function scrollToBottom() {
  const container = getEl('messages-container');
  requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
}

function autoResizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function enableInput() {
  const chatInput = getEl<HTMLTextAreaElement>('chat-input');
  const sendBtn = getEl<HTMLButtonElement>('send-btn');
  chatInput.disabled = false;
  chatInput.focus();
  sendBtn.disabled = chatInput.value.trim() === '';
}

function disableInput() {
  const chatInput = getEl<HTMLTextAreaElement>('chat-input');
  const sendBtn = getEl<HTMLButtonElement>('send-btn');
  chatInput.disabled = true;
  sendBtn.disabled = true;
}

function updateProgress(value: number) {
  progressPercent = value;
  const fill = getEl<HTMLDivElement>('progress-fill');
  const pct = getEl('progress-pct');
  if (fill) fill.style.width = `${value}%`;
  if (pct) pct.textContent = `${Math.round(value)}%`;
}

function updateStats() {
  const statMessages = getEl('stat-messages');
  if (statMessages) statMessages.textContent = String(messageCount);
  const elapsed = Math.floor((Date.now() - sessionStart) / 60000);
  const statTime = getEl('stat-time');
  if (statTime) statTime.textContent = `${elapsed}m`;
}

function startStatsTimer() {
  setInterval(updateStats, 30000);
}

function showError(msg: string) {
  const existing = document.querySelector('.error-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
renderApp();