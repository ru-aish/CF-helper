// Global state
let currentSession = null;
let currentProblemData = null;
let conversations = []; // [{id, title, createdAt, lastUpdated}]
let abortController = null;

// DOM
const sessionSection = document.getElementById('session-section');
const urlInput = document.getElementById('problem-url');
const extractBtn = document.getElementById('extract-btn');
const startSessionBtn = document.getElementById('start-session-btn');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const getHintBtn = document.getElementById('get-hint-btn');
const getSolutionBtn = document.getElementById('get-solution-btn');
const analyzeCodeBtn = document.getElementById('analyze-code-btn');
const codeModal = document.getElementById('code-input-modal');
const studentCodeInput = document.getElementById('student-code');
const problemDetailsModal = document.getElementById('problem-details-modal');
const conversationsList = document.getElementById('conversations-list');
const newChatBtn = document.getElementById('new-chat-btn');
const themeToggle = document.getElementById('theme-toggle');

// Loading and error
const urlLoading = document.getElementById('url-loading');
const urlError = document.getElementById('url-error');
const globalLoading = document.getElementById('global-loading');
const globalError = document.getElementById('global-error');

// Extra composer actions
const regenerateBtn = document.getElementById('regenerate-btn');
const stopBtn = document.getElementById('stop-btn');

// Init
document.addEventListener('DOMContentLoaded', () => {
  hydrateFromStorage();
  setupEventListeners();
  autosize(chatInput);
  urlInput?.focus();
});

function setupEventListeners() {
  // URL controls
  extractBtn.addEventListener('click', extractProblem);
  startSessionBtn.addEventListener('click', startSession);
  urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') extractProblem(); });

  // Chat controls
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  regenerateBtn.addEventListener('click', regenerateLast);
  stopBtn.addEventListener('click', stopGenerating);

  // Hint/Solution/Analyze
  getHintBtn.addEventListener('click', getHint);
  getSolutionBtn.addEventListener('click', getSolution);
  analyzeCodeBtn.addEventListener('click', showCodeModal);

  // Modals
  document.querySelectorAll('.modal .close').forEach(x => x.addEventListener('click', () => { hideCodeModal(); hideProblemDetails(); }));
  document.getElementById('submit-code-btn').addEventListener('click', submitCodeForAnalysis);
  document.getElementById('cancel-code-btn').addEventListener('click', hideCodeModal);
  window.addEventListener('click', (e) => { if (e.target === codeModal) hideCodeModal(); if (e.target === problemDetailsModal) hideProblemDetails(); });

  // View problem
  document.getElementById('view-problem-btn').addEventListener('click', showProblemDetails);

  // Sidebar
  newChatBtn.addEventListener('click', newConversation);

  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);
}

// API helper
async function apiCall(endpoint, method = 'GET', data = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (data) opts.body = JSON.stringify(data);
    const res = await fetch(`/api/${endpoint}`, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  } catch (err) { throw err; }
}

// Problem extraction
async function extractProblem() {
  const url = urlInput.value.trim();
  if (!url || !url.includes('codeforces.com')) {
    showError('Please enter a valid Codeforces URL', urlError); return;
  }
  showLoading(urlLoading); hideError(urlError); extractBtn.disabled = true;
  try {
    const result = await apiCall('extract-problem', 'POST', { url });
    currentProblemData = result;
    updateProblemBar(result);
    startSessionBtn.disabled = false;
  } catch (e) {
    showError(`Failed to extract problem: ${e.message}`, urlError);
  } finally { hideLoading(urlLoading); extractBtn.disabled = false; }
}

function updateProblemBar(data) {
  // Populate the compact problem bar
  document.getElementById('problem-title').textContent = `${data.problem_id} - ${data.title}`;
  document.getElementById('problem-contest').textContent = data.contest_title || '';
  document.getElementById('time-limit').textContent = data.time_limit ? `Time: ${data.time_limit}` : '';
  document.getElementById('memory-limit').textContent = data.memory_limit ? `Memory: ${data.memory_limit}` : '';
  const tags = document.getElementById('tags');
  tags.innerHTML = '';
  (data.tags || []).forEach(t => { const el = document.createElement('span'); el.className = 'tag'; el.textContent = t; tags.appendChild(el); });
  const link = document.getElementById('problem-open-link');
  link.href = data.url || '#';
  document.getElementById('problem-bar').classList.remove('hidden');
}

// Session management
async function startSession() {
  if (!currentProblemData) { showError('No problem data available', globalError); return; }
  showLoading(globalLoading); hideError(globalError); startSessionBtn.disabled = true;
  try {
    const result = await apiCall('start-session', 'POST', { problem_id: currentProblemData.problem_id });
    currentSession = { session_id: result.session_id, problem_title: result.problem_title };
    document.getElementById('session-id-display').textContent = `Session: ${result.session_id}`;
    document.getElementById('hints-counter').textContent = 'Hints given: 0';
    chatMessages.innerHTML = '';
    addMessage('assistant', result.welcome_message);
    chatInput.focus();
    touchConversation();
  } catch (e) { showError(`Failed to start session: ${e.message}`, globalError); }
  finally { hideLoading(globalLoading); startSessionBtn.disabled = false; }
}

// Chat
async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message || !currentSession) return;
  addMessage('user', message);
  chatInput.value = ''; autosize(chatInput);
  setComposerBusy(true);
  try {
    const result = await apiCall('chat', 'POST', { session_id: currentSession.session_id, message });
    addMessage(result.is_hint ? 'hint' : 'assistant', result.message);
    if (result.hints_given !== undefined) document.getElementById('hints-counter').textContent = `Hints given: ${result.hints_given}`;
    touchConversation();
  } catch (e) { addMessage('assistant', `Sorry, I encountered an error: ${e.message}`); }
  finally { setComposerBusy(false); }
}

async function regenerateLast() {
  if (!currentSession) return;
  // Simple approach: resend the last user message if available
  const lastUser = [...chatMessages.querySelectorAll('.message.user')].pop();
  if (!lastUser) return;
  const text = lastUser.querySelector('.message-content')?.innerText || lastUser.textContent;
  chatInput.value = text.trim(); autosize(chatInput); await sendMessage();
}

function stopGenerating() { if (abortController) { abortController.abort(); stopBtn.disabled = true; } }

// Hints and solution
async function getHint() {
  if (!currentSession) { showError('No active session', globalError); return; }
  getHintBtn.disabled = true;
  try {
    const result = await apiCall('get-hint', 'POST', { session_id: currentSession.session_id });
    addMessage('hint', result.hint);
    document.getElementById('hints-counter').textContent = `Hints given: ${result.hint_number}`;
    if (!result.more_hints_available) { getHintBtn.textContent = 'No more hints'; getHintBtn.disabled = true; }
  } catch (e) { addMessage('assistant', `Sorry, I couldn't provide a hint: ${e.message}`); }
  finally { if (!getHintBtn.textContent.includes('No more hints')) getHintBtn.disabled = false; }
}

async function getSolution() {
  if (!currentSession) { showError('No active session', globalError); return; }
  if (!confirm('Are you sure you want to see the complete solution?')) return;
  getSolutionBtn.disabled = true;
  try {
    const result = await apiCall('get-solution', 'POST', { session_id: currentSession.session_id });
    addMessage('solution', result.solution);
    getHintBtn.disabled = true; getHintBtn.textContent = 'Solution revealed';
  } catch (e) { addMessage('assistant', `Sorry, I couldn't provide the solution: ${e.message}`); getSolutionBtn.disabled = false; }
}

// Code analysis
function showCodeModal() { codeModal.classList.remove('hidden'); studentCodeInput.focus(); }
function hideCodeModal() { codeModal.classList.add('hidden'); studentCodeInput.value = ''; }

function showProblemDetails() {
  if (!currentProblemData) return;
  const titleEl = document.getElementById('pd-title');
  const stmtEl = document.getElementById('pd-statement');
  const samplesEl = document.getElementById('pd-samples');
  titleEl.textContent = `${currentProblemData.problem_id} - ${currentProblemData.title}`;
  stmtEl.textContent = currentProblemData.statement || 'Problem statement not available.';
  samplesEl.innerHTML = '';
  const inputs = currentProblemData.sample_inputs || []; const outputs = currentProblemData.sample_outputs || [];
  for (let i = 0; i < Math.min(inputs.length, outputs.length); i++) {
    const testDiv = document.createElement('div');
    testDiv.className = 'sample-test';
    testDiv.innerHTML = `<h4>Example ${i + 1}</h4><div class="sample-content"><div class="sample-io"><h5>Input:</h5><pre>${escapeHtml(inputs[i])}</pre></div><div class="sample-io"><h5>Output:</h5><pre>${escapeHtml(outputs[i])}</pre></div></div>`;
    samplesEl.appendChild(testDiv);
  }
  problemDetailsModal.classList.remove('hidden');
}
function hideProblemDetails() { problemDetailsModal.classList.add('hidden'); }

async function submitCodeForAnalysis() {
  const code = studentCodeInput.value.trim(); if (!code) { alert('Please enter your code first.'); return; }
  if (!currentSession) { showError('No active session', globalError); return; }
  hideCodeModal(); addMessage('user', `[Submitted code for analysis]\n\`\`\`\n${code}\n\`\`\``);
  try {
    const result = await apiCall('chat', 'POST', { session_id: currentSession.session_id, message: `Please analyze my code:\n\`\`\`\n${code}\n\`\`\`` });
    addMessage('assistant', result.message); touchConversation();
  } catch (e) { addMessage('assistant', `Sorry, I couldn't analyze your code: ${e.message}`); }
}

// Messages
function addMessage(type, content) {
  const msg = document.createElement('div');
  msg.className = `message ${type}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerHTML = processMessageContent(content);
  msg.appendChild(contentDiv);

  const meta = document.createElement('div');
  meta.className = 'message-time';
  meta.textContent = new Date().toLocaleTimeString();
  msg.appendChild(meta);

  // Attach copy buttons to code blocks
  setTimeout(() => attachCopyButtons(msg), 0);

  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  if (window.Prism) Prism.highlightAllUnder(msg);
}

function attachCopyButtons(scope) {
  const blocks = scope.querySelectorAll('pre > code');
  blocks.forEach((codeEl) => {
    if (codeEl.parentElement.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.textContent = 'Copy';
    btn.className = 'chip';
    btn.style.position = 'absolute';
    btn.style.right = '10px';
    btn.style.top = '10px';
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(codeEl.innerText);
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy'), 1200);
    });
    const pre = codeEl.parentElement;
    pre.style.position = 'relative';
    pre.appendChild(btn);
  });
}

function processMessageContent(content) {
  // Code blocks
  content = content.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (m, lang, code) => {
    const language = lang || 'text';
    return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
  });
  // Inline code
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links
  content = content.replace(/(https?:\/\/[^\s]+)(?![^<]*>|[^<>]*<\/?code>)/g, '<a href="$1" target="_blank">$1<\/a>');
  // Newlines
  return content.replace(/\n/g, '<br>');
}

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// UI helpers
function showLoading(el) { el.classList.remove('hidden'); }
function hideLoading(el) { el.classList.add('hidden'); }
function showError(msg, el) { el.textContent = msg; el.classList.remove('hidden'); }
function hideError(el) { el.classList.add('hidden'); }
function setComposerBusy(busy) { chatInput.disabled = busy; sendBtn.disabled = busy; stopBtn.disabled = !busy; }

// Conversations (local only)
function newConversation() {
  chatMessages.innerHTML = '';
  currentSession = null; currentProblemData = null; urlInput.value = ''; startSessionBtn.disabled = true;
}
function touchConversation() { saveSessionToLocalStorage(); renderConversations(); }
function renderConversations() {
  // Minimal placeholder: current single chat
  conversationsList.innerHTML = '';
  const item = document.createElement('div');
  item.className = 'conversation-item active';
  item.innerHTML = `<div class="title">${currentProblemData?.title || 'Untitled chat'}</div><div class="meta">${new Date().toLocaleTimeString()}</div>`;
  conversationsList.appendChild(item);
}

// Theme
function toggleTheme() { document.body.classList.toggle('theme-dark'); }

// Autosize textarea
function autosize(el) {
  const handler = () => { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 220) + 'px'; };
  ['input', 'keyup', 'change'].forEach(evt => el.addEventListener(evt, handler));
  handler();
}

// Persistence
function saveSessionToLocalStorage() {
  localStorage.setItem('codeforces_tutor_session', JSON.stringify({ session: currentSession, problem: currentProblemData, timestamp: Date.now() }));
}
function hydrateFromStorage() {
  try {
    const saved = localStorage.getItem('codeforces_tutor_session');
    if (!saved) return;
    const data = JSON.parse(saved);
    if (Date.now() - data.timestamp < 3600000) {
      currentSession = data.session; currentProblemData = data.problem;
      if (currentProblemData) { updateProblemBar(currentProblemData); startSessionBtn.disabled = false; }
      renderConversations();
    }
  } catch (_) { /* ignore */ }
}

// Periodic save
setInterval(saveSessionToLocalStorage, 30000);
