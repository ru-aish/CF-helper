// Global state
let currentConversationId = null;
let conversations = {}; // {conversationId: {id, title, session, problem, history, createdAt, lastUpdated}}
let currentProblemData = null;
let abortController = null;
let cachedSolution = null; // Cache the solution to avoid duplicate API calls

// DOM
const sessionSection = document.getElementById('session-section');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const getHintBtn = document.getElementById('get-hint-btn');
const getSolutionBtn = document.getElementById('get-solution-btn');
const analyzeCodeBtn = document.getElementById('analyze-code-btn');
const codeModal = document.getElementById('code-input-modal');
const studentCodeInput = document.getElementById('student-code');
const problemDetailsModal = document.getElementById('problem-details-modal');
const solutionModal = document.getElementById('solution-modal');
const newProblemModal = document.getElementById('new-problem-modal');
const modalUrlInput = document.getElementById('modal-problem-url');
const submitProblemBtn = document.getElementById('submit-problem-btn');
const cancelProblemBtn = document.getElementById('cancel-problem-btn');
const conversationsList = document.getElementById('conversations-list');
const newChatBtn = document.getElementById('new-chat-btn');
const themeToggle = document.getElementById('theme-toggle');
const moreOptionsBtn = document.getElementById('more-options-btn');
const moreOptionsMenu = document.getElementById('more-options-menu');

// Loading and error
const modalLoading = document.getElementById('modal-loading');
const modalError = document.getElementById('modal-error');
const globalLoading = document.getElementById('global-loading');
const globalError = document.getElementById('global-error');

// Extra composer actions
const regenerateBtn = document.getElementById('regenerate-btn');
const stopBtn = document.getElementById('stop-btn');

// Init
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded - initializing app');
  hydrateFromStorage();
  
  setupEventListeners();
  renderConversations();
});

function setupEventListeners() {
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  regenerateBtn.addEventListener('click', regenerateLast);
  stopBtn.addEventListener('click', stopGenerating);

  moreOptionsBtn.addEventListener('click', toggleMoreOptions);
  getHintBtn.addEventListener('click', () => { hideMoreOptions(); getHint(); });
  getSolutionBtn.addEventListener('click', () => { hideMoreOptions(); getSolution(); });
  regenerateBtn.addEventListener('click', () => { hideMoreOptions(); regenerateLast(); });
  analyzeCodeBtn.addEventListener('click', showCodeModal);

  document.querySelectorAll('.modal .close').forEach(x => x.addEventListener('click', (e) => { 
    const modal = e.target.closest('.modal');
    if (modal === codeModal) hideCodeModal();
    else if (modal === problemDetailsModal) hideProblemDetails();
    else if (modal === solutionModal) hideSolutionModal();
    else if (modal === newProblemModal) hideNewProblemModal();
  }));
  
  document.getElementById('submit-code-btn').addEventListener('click', submitCodeForAnalysis);
  document.getElementById('cancel-code-btn').addEventListener('click', hideCodeModal);
  
  submitProblemBtn.addEventListener('click', submitProblemUrl);
  cancelProblemBtn.addEventListener('click', hideNewProblemModal);
  modalUrlInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') submitProblemUrl(); 
  });
  
  window.addEventListener('click', (e) => { 
    if (e.target === codeModal) hideCodeModal(); 
    if (e.target === problemDetailsModal) hideProblemDetails(); 
    if (e.target === solutionModal) hideSolutionModal();
    if (e.target === newProblemModal) hideNewProblemModal();
    if (!e.target.closest('.more-options-menu') && !e.target.closest('#more-options-btn')) {
      hideMoreOptions();
    }
  });

  document.getElementById('view-problem-btn').addEventListener('click', showProblemDetails);

  newChatBtn.addEventListener('click', newConversation);

  themeToggle.addEventListener('click', toggleTheme);
  
  const tagsToggle = document.getElementById('tags-toggle');
  if (tagsToggle) {
    tagsToggle.addEventListener('click', toggleTags);
  }
}

// API helper with abort controller support
async function apiCall(endpoint, method = 'GET', data = null) {
  console.log(`🌐 API Call: ${method} /api/${endpoint}`, data);
  
  try {
    // Create abort controller for this request with timeout
    abortController = new AbortController();
    
    // Set timeout for frontend requests (30 seconds)
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 30000);
    
    const options = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      signal: abortController.signal
    };
    
    if (data) {
      options.body = JSON.stringify(data);
      console.log("📤 Request body:", JSON.stringify(data, null, 2));
    }
    
    console.log("📡 Sending request to:", `/api/${endpoint}`);
    const response = await fetch(`/api/${endpoint}`, options);
    
    // Clear timeout if request completed
    clearTimeout(timeoutId);
    
    console.log("📥 Response received:", response.status, response.statusText);
    
    const result = await response.json();
    console.log("📋 Response data:", result);
    
    if (!response.ok) {
      console.error("❌ API call failed:", result.error);
      throw new Error(result.error || 'Request failed');
    }
    
    return result;
  } catch (e) {
    if (e.name === 'AbortError') {
      console.error("⏰ Request timed out after 30 seconds");
      throw new Error('Request timed out. Please try a shorter question.');
    }
    console.error("❌ API call error:", e);
    throw e;
  }
}

// Auto-extraction function (deprecated - now handled in modal)
function autoExtractOnPaste() {
  // No longer needed
}

// Problem extraction from modal
async function extractProblemFromModal() {
  const url = modalUrlInput.value.trim();
  if (!url || !url.includes('codeforces.com')) {
    showError('Please enter a valid Codeforces URL', modalError); return null;
  }
  showLoading(modalLoading); hideError(modalError);
  try {
    const result = await apiCall('extract-problem', 'POST', { url });
    return result;
  } catch (e) {
    showError(`Failed to extract problem: ${e.message}`, modalError);
    return null;
  } finally { hideLoading(modalLoading); }
}

function updateProblemBar(data) {
  document.getElementById('problem-title').textContent = `${data.problem_id} - ${data.title}`;
  document.getElementById('problem-contest').textContent = data.contest_title || '';
  document.getElementById('time-limit').textContent = data.time_limit ? `Time: ${data.time_limit}` : '';
  document.getElementById('memory-limit').textContent = data.memory_limit ? `Memory: ${data.memory_limit}` : '';
  
  const tags = document.getElementById('tags');
  const tagsToggle = document.getElementById('tags-toggle');
  const tagsCount = document.getElementById('tags-count');
  
  tags.innerHTML = '';
  tags.classList.remove('expanded');
  
  if (data.tags && data.tags.length > 0) {
    data.tags.forEach(t => { 
      const el = document.createElement('span'); 
      el.className = 'tag'; 
      el.textContent = t; 
      tags.appendChild(el); 
    });
    
    tagsCount.textContent = `${data.tags.length} tag${data.tags.length > 1 ? 's' : ''}`;
    tagsToggle.classList.remove('hidden');
  } else {
    tagsToggle.classList.add('hidden');
  }
  
  const link = document.getElementById('problem-open-link');
  link.href = data.url || '#';
  document.getElementById('problem-bar').classList.remove('hidden');
}

function toggleTags() {
  const tags = document.getElementById('tags');
  const tagsToggle = document.getElementById('tags-toggle');
  
  tags.classList.toggle('expanded');
  tagsToggle.classList.toggle('expanded');
}

function toggleMoreOptions() {
  moreOptionsMenu.classList.toggle('hidden');
}

function hideMoreOptions() {
  moreOptionsMenu.classList.add('hidden');
}

// Conversation management
function generateConversationId() {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getCurrentConversation() {
  if (!currentConversationId || !conversations[currentConversationId]) {
    return null;
  }
  return conversations[currentConversationId];
}

function createNewConversation(problemData = null) {
  const conversationId = generateConversationId();
  const conversation = {
    id: conversationId,
    title: problemData ? `${problemData.problem_id} - ${problemData.title}` : 'New Chat',
    session: null,
    problem: problemData,
    history: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    hints_given: 0
  };
  
  conversations[conversationId] = conversation;
  currentConversationId = conversationId;
  
  console.log('Created conversation:', conversationId, conversation);
  console.log('All conversations:', conversations);
  
  return conversation;
}

function switchToConversation(conversationId) {
  if (!conversations[conversationId]) {
    console.error('Conversation not found:', conversationId);
    return;
  }
  
  currentConversationId = conversationId;
  const conversation = conversations[conversationId];
  
  currentProblemData = conversation.problem;
  
  chatMessages.innerHTML = '';
  (conversation.history || []).forEach(msg => {
    addMessage(msg.type, msg.content, false);
  });
  
  if (conversation.problem) {
    updateProblemBar(conversation.problem);
  } else {
    document.getElementById('problem-bar').classList.add('hidden');
  }
  
  if (conversation.session) {
    document.getElementById('hints-counter').textContent = `Hints given: ${conversation.hints_given || 0}`;
  } else {
    document.getElementById('hints-counter').textContent = 'Hints given: 0';
    
    // If conversation has history but no session, it may have expired
    if (conversation.history && conversation.history.length > 0) {
      addMessage('assistant', '⚠️ Your previous session has expired. You can view the conversation history, but to continue chatting, please click "New Chat" to start a fresh session.', false);
    }
  }
  
  renderConversations();
  saveToLocalStorage();
}

// Session management
async function submitProblemUrl() {
  const problemData = await extractProblemFromModal();
  if (!problemData) return;
  
  hideNewProblemModal();
  
  currentProblemData = problemData;
  updateProblemBar(problemData);
  
  let conversation = getCurrentConversation();
  if (!conversation || conversation.session) {
    conversation = createNewConversation(problemData);
  } else {
    conversation.problem = problemData;
    conversation.title = `${problemData.problem_id} - ${problemData.title}`;
    conversation.lastUpdated = new Date().toISOString();
  }
  
  console.log('Starting session with conversation:', conversation.id);
  
  showLoading(globalLoading); hideError(globalError);
  
  cachedSolution = null;
  
  getSolutionBtn.innerHTML = '<i class="fa-solid fa-key"></i>';
  getSolutionBtn.disabled = false;
  getHintBtn.innerHTML = '<i class="fa-regular fa-lightbulb"></i>';
  getHintBtn.disabled = false;
  
  try {
    const result = await apiCall('start-session', 'POST', { 
      problem_id: problemData.problem_id,
      conversation_id: currentConversationId 
    });
    
    conversation.session = { session_id: result.session_id, problem_title: result.problem_title };
    conversation.lastUpdated = new Date().toISOString();
    
    document.getElementById('hints-counter').textContent = 'Hints given: 0';
    chatMessages.innerHTML = '';
    conversation.history = [];
    addMessage('assistant', result.welcome_message);
    chatInput.focus();
    
    console.log('Session started successfully. Conversations:', conversations);
    renderConversations();
    saveToLocalStorage();
  } catch (e) { 
    showError(`Failed to start session: ${e.message}`, globalError); 
  }
  finally { hideLoading(globalLoading); }
}

async function startSession() {
  if (!currentProblemData) { 
    showError('Please paste a Codeforces URL first', globalError); 
    return; 
  }
  
  let conversation = getCurrentConversation();
  if (!conversation) {
    console.log('No current conversation, creating new one');
    conversation = createNewConversation(currentProblemData);
  } else {
    conversation.problem = currentProblemData;
    conversation.title = `${currentProblemData.problem_id} - ${currentProblemData.title}`;
    conversation.lastUpdated = new Date().toISOString();
  }
  
  console.log('Starting session with conversation:', conversation.id);
  
  showLoading(globalLoading); hideError(globalError);
  
  cachedSolution = null;
  
  getSolutionBtn.innerHTML = '<i class="fa-solid fa-key"></i>';
  getSolutionBtn.disabled = false;
  getHintBtn.innerHTML = '<i class="fa-regular fa-lightbulb"></i>';
  getHintBtn.disabled = false;
  
  try {
    const result = await apiCall('start-session', 'POST', { 
      problem_id: currentProblemData.problem_id,
      conversation_id: currentConversationId 
    });
    
    conversation.session = { session_id: result.session_id, problem_title: result.problem_title };
    conversation.lastUpdated = new Date().toISOString();
    
    document.getElementById('hints-counter').textContent = 'Hints given: 0';
    chatMessages.innerHTML = '';
    conversation.history = [];
    addMessage('assistant', result.welcome_message);
    chatInput.focus();
    
    console.log('Session started successfully. Conversations:', conversations);
    renderConversations();
    saveToLocalStorage();
  } catch (e) { 
    showError(`Failed to start session: ${e.message}`, globalError); 
  }
  finally { hideLoading(globalLoading); }
}

// Chat
async function sendMessage() {
  const message = chatInput.value.trim();
  const conversation = getCurrentConversation();
  if (!message || !conversation || !conversation.session) return;
  
  addMessage('user', message);
  chatInput.value = ''; autosize(chatInput);
  setComposerBusy(true);
  
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', 'assistant');
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('message-content');
  messageElement.appendChild(contentDiv);
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  let fullResponse = '';
  let isHint = false;
  let hintsGiven = conversation.hints_given;
  
  try {
    abortController = new AbortController();
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        session_id: conversation.session.session_id, 
        message,
        conversation_id: currentConversationId
      }),
      signal: abortController.signal
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          if (data.chunk) {
            fullResponse += data.chunk;
            contentDiv.innerHTML = processMessageContent(fullResponse);
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
          
          if (data.done) {
            isHint = data.is_hint || false;
            hintsGiven = data.hints_given || hintsGiven;
            if (isHint) messageElement.classList.add('hint');
            
            if (typeof Prism !== 'undefined') {
              Prism.highlightAllUnder(messageElement);
            }
            
            attachCopyButtons(messageElement);
          }
          
          if (data.error) {
            throw new Error(data.error);
          }
        }
      }
    }
    
    conversation.history.push({ type: isHint ? 'hint' : 'assistant', content: fullResponse });
    if (hintsGiven !== conversation.hints_given) {
      conversation.hints_given = hintsGiven;
      document.getElementById('hints-counter').textContent = `Hints given: ${hintsGiven}`;
    }
    conversation.lastUpdated = new Date().toISOString();
    renderConversations();
    saveToLocalStorage();
    
  } catch (e) { 
    if (e.name === 'AbortError') {
      contentDiv.innerHTML = processMessageContent(fullResponse + '\n\n*[Response stopped]*');
    } else {
      contentDiv.innerHTML = `Sorry, I encountered an error: ${e.message}`;
      
      // Check if it's a session not found error (404)
      if (e.message.includes('404') || e.message.includes('not found')) {
        contentDiv.innerHTML += `<br><br><em>The session may have expired. Please start a new session with the problem URL.</em>`;
        // Clear the invalid session
        if (conversation) {
          conversation.session = null;
          saveToLocalStorage();
        }
      }
    }
  }
  finally { 
    setComposerBusy(false); 
    abortController = null;
  }
}

async function regenerateLast() {
  if (!currentSession) return;
  // Simple approach: resend the last user message if available
  const lastUser = [...chatMessages.querySelectorAll('.message.user')].pop();
  if (!lastUser) return;
  const text = lastUser.querySelector('.message-content')?.innerText || lastUser.textContent;
  chatInput.value = text.trim(); autosize(chatInput); await sendMessage();
}

function stopGenerating() { 
  console.log("🛑 Stop button clicked");
  if (abortController) { 
    console.log("🔄 Aborting request...");
    abortController.abort(); 
    setComposerBusy(false);
    addMessage('assistant', '🛑 Response generation was stopped.');
  } else {
    console.log("⚠️ No active request to stop");
  }
}

// Hints and solution
async function getHint() {
  const conversation = getCurrentConversation();
  if (!conversation || !conversation.session) { 
    showError('No active session', globalError, 3000); 
    return; 
  }
  
  console.log("💡 getHint called");
  
  // Show loading state
  const originalText = getHintBtn.innerHTML;
  getHintBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting hint...';
  getHintBtn.disabled = true;
  
  try {
    const result = await apiCall('get-hint', 'POST', { 
      session_id: conversation.session.session_id,
      conversation_id: currentConversationId
    });
    addMessage('hint', result.hint);
    conversation.hints_given = result.hint_number;
    document.getElementById('hints-counter').textContent = `Hints given: ${result.hint_number}`;
    if (!result.more_hints_available) { 
      getHintBtn.innerHTML = '<i class="fa-regular fa-lightbulb"></i> No more hints'; 
      getHintBtn.disabled = true; 
    } else {
      getHintBtn.innerHTML = originalText;
    }
    conversation.lastUpdated = new Date().toISOString();
    renderConversations();
    saveToLocalStorage();
  } catch (e) { 
    addMessage('assistant', `Sorry, I couldn't provide a hint: ${e.message}`);
    
    // Check if it's a session not found error
    if (e.message.includes('404') || e.message.includes('not found')) {
      addMessage('assistant', 'The session may have expired. Please start a new session with the problem URL.');
      if (conversation) {
        conversation.session = null;
        saveToLocalStorage();
      }
    }
    
    getHintBtn.innerHTML = originalText;
    getHintBtn.disabled = false;
  }
  finally { 
    if (!getHintBtn.innerHTML.includes('No more hints') && !getHintBtn.innerHTML.includes('Solution revealed')) {
      getHintBtn.disabled = false; 
    }
  }
}

async function getSolution() {
  console.log("🔑 getSolution called");
  
  const conversation = getCurrentConversation();
  if (!conversation || !conversation.session) { 
    showError('No active session', globalError, 3000); 
    return; 
  }
  
  // If solution is already cached, show it immediately
  if (cachedSolution) {
    console.log("📋 Using cached solution");
    showSolutionModal(cachedSolution);
    return;
  }
  
  if (!confirm('Are you sure you want to see the complete solution? This will end the learning challenge.')) {
    return;
  }
  
  console.log("🚀 Starting solution request...");
  
  // Show loading state
  const originalText = getSolutionBtn.innerHTML;
  getSolutionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading solution...';
  getSolutionBtn.disabled = true;
  
  try {
    console.log("📡 Making API call to get-solution...");
    const result = await apiCall('get-solution', 'POST', { 
      session_id: conversation.session.session_id,
      conversation_id: currentConversationId
    });
    
    console.log("✅ Solution received:", result);
    
    // Cache the solution
    cachedSolution = result;
    
    // Show solution in popup modal
    showSolutionModal(result);
    
    // Also add to chat for history
    addMessage('solution', result.solution);
    
    // Update button states
    getSolutionBtn.innerHTML = '<i class="fa-solid fa-key"></i> View Solution';
    getSolutionBtn.disabled = false;
    
    // Disable hint button since solution is revealed
    getHintBtn.innerHTML = '<i class="fa-regular fa-lightbulb"></i> Solution revealed';
    getHintBtn.disabled = true; 
    
    conversation.lastUpdated = new Date().toISOString();
    renderConversations();
    saveToLocalStorage();
    
    console.log("🎯 Solution displayed successfully");
    
  } catch (e) { 
    console.error("❌ Solution error:", e);
    addMessage('assistant', `Sorry, I couldn't provide the solution: ${e.message}`);
    
    // Check if it's a session not found error
    if (e.message.includes('404') || e.message.includes('not found')) {
      addMessage('assistant', 'The session may have expired. Please start a new session with the problem URL.');
      if (conversation) {
        conversation.session = null;
        saveToLocalStorage();
      }
    }
  } finally {
    // Always restore button state if it's still in loading state
    if (getSolutionBtn.innerHTML.includes('Loading solution')) {
      getSolutionBtn.innerHTML = originalText;
      getSolutionBtn.disabled = false;
    }
  }
}

// Code analysis
function showCodeModal() { codeModal.classList.remove('hidden'); studentCodeInput.focus(); }
function hideCodeModal() { codeModal.classList.add('hidden'); studentCodeInput.value = ''; }

function showNewProblemModal() { 
  newProblemModal.classList.remove('hidden'); 
  modalUrlInput.value = '';
  hideError(modalError);
  modalUrlInput.focus(); 
}
function hideNewProblemModal() { 
  newProblemModal.classList.add('hidden'); 
  modalUrlInput.value = '';
  hideError(modalError);
}

function showProblemDetails() {
  console.log("🔍 showProblemDetails called");
  console.log("📋 currentProblemData:", currentProblemData);
  
  if (!currentProblemData) {
    showError('No problem data available', globalError, 3000);
    return;
  }
  
  const titleEl = document.getElementById('pd-title');
  const stmtEl = document.getElementById('pd-statement');
  const samplesEl = document.getElementById('pd-samples');
  
  titleEl.innerHTML = `<i class="fa-solid fa-file-lines"></i> ${currentProblemData.problem_id} - ${currentProblemData.title}`;
  stmtEl.textContent = currentProblemData.statement || 'Problem statement not available.';
  
  samplesEl.innerHTML = '';
  const inputs = currentProblemData.sample_inputs || [];
  const outputs = currentProblemData.sample_outputs || [];
  
  if (inputs.length === 0 && outputs.length === 0) {
    samplesEl.innerHTML = '<p class="subtle">No sample test cases available.</p>';
  } else {
    for (let i = 0; i < Math.min(inputs.length, outputs.length); i++) {
      const testDiv = document.createElement('div');
      testDiv.className = 'sample-test';
      testDiv.innerHTML = `
        <h4>Example ${i + 1}</h4>
        <div class="sample-content">
          <div class="sample-io">
            <h5>Input:</h5>
            <pre>${escapeHtml(inputs[i])}</pre>
          </div>
          <div class="sample-io">
            <h5>Output:</h5>
            <pre>${escapeHtml(outputs[i])}</pre>
          </div>
        </div>
      `;
      samplesEl.appendChild(testDiv);
    }
  }
  
  problemDetailsModal.classList.remove('hidden');
  console.log("✅ Problem details modal shown");
}
function showSolutionModal(solutionData) {
  console.log("🎯 showSolutionModal called with:", solutionData);
  
  const explanationEl = document.getElementById('solution-explanation');
  const codeBlocksEl = document.getElementById('solution-code-blocks');
  
  // Process the solution text with proper markdown rendering
  let solutionText = solutionData.solution || solutionData.explanation || 'No solution explanation available.';
  
  // First, extract code blocks to avoid double processing
  const codeBlocks = extractCodeBlocks(solutionText);
  
  // Remove code blocks from the explanation text
  let explanationText = solutionText.replace(/```[\w]*\n[\s\S]*?\n```/g, '');
  
  // Process explanation with markdown (but not code blocks)
  explanationEl.innerHTML = processMessageContent(explanationText);
  
  // Clear previous code blocks
  codeBlocksEl.innerHTML = '';
  
  // Display extracted code blocks with syntax highlighting
  if (codeBlocks.length > 0) {
    codeBlocks.forEach((codeBlock, index) => {
      const container = createCodeBlockContainer(codeBlock, index);
      codeBlocksEl.appendChild(container);
    });
  } else if (solutionData.code) {
    // Fallback: use the code field if available
    const container = createCodeBlockContainer({
      language: 'cpp',
      code: solutionData.code
    }, 0);
    codeBlocksEl.appendChild(container);
  }
  
  // Show the modal
  solutionModal.classList.remove('hidden');
  
  // Apply syntax highlighting after modal is shown
  setTimeout(() => {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAllUnder(solutionModal);
    }
  }, 100);
  
  console.log("✅ Solution modal displayed");
}

function extractCodeBlocks(text) {
  const codeBlocks = [];
  const regex = /```(\w+)?\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    });
  }
  
  return codeBlocks;
}

function createCodeBlockContainer(codeBlock, index) {
  const container = document.createElement('div');
  container.className = 'code-block-container';
  
  const language = codeBlock.language || 'text';
  const languageDisplay = {
    'cpp': 'C++',
    'python': 'Python',
    'java': 'Java',
    'javascript': 'JavaScript',
    'text': 'Code'
  }[language] || language.toUpperCase();
  
  container.innerHTML = `
    <div class="code-block-header">
      <div class="code-block-title">
        <i class="fa-solid fa-code"></i>
        ${languageDisplay} Solution
      </div>
      <button class="copy-code-btn" onclick="copyCodeToClipboard(this, ${index})">
        <i class="fa-solid fa-copy"></i>
        Copy
      </button>
    </div>
    <div class="code-block-content">
      <pre><code class="language-${language}">${escapeHtml(codeBlock.code)}</code></pre>
    </div>
  `;
  
  return container;
}

function copyCodeToClipboard(button, index) {
  const codeElement = button.closest('.code-block-container').querySelector('code');
  const code = codeElement.textContent;
  
  navigator.clipboard.writeText(code).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    button.classList.add('copied');
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy code:', err);
    alert('Failed to copy code to clipboard');
  });
}

function hideProblemDetails() { problemDetailsModal.classList.add('hidden'); }

function hideSolutionModal() { 
  solutionModal.classList.add('hidden'); 
}

async function submitCodeForAnalysis() {
  const code = studentCodeInput.value.trim(); 
  if (!code) { alert('Please enter your code first.'); return; }
  
  const conversation = getCurrentConversation();
  if (!conversation || !conversation.session) { 
    showError('No active session', globalError); 
    return; 
  }
  
  hideCodeModal(); 
  addMessage('user', `[Submitted code for analysis]\n\`\`\`\n${code}\n\`\`\``);
  try {
    const result = await apiCall('chat', 'POST', { 
      session_id: conversation.session.session_id, 
      message: `Please analyze my code:\n\`\`\`\n${code}\n\`\`\``,
      conversation_id: currentConversationId
    });
    addMessage('assistant', result.message); 
    conversation.lastUpdated = new Date().toISOString();
    renderConversations();
    saveToLocalStorage();
  } catch (e) { addMessage('assistant', `Sorry, I couldn't analyze your code: ${e.message}`); }
}

// Messages
function addMessage(type, content, saveToHistory = true) {
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
  
  // Save to conversation history
  if (saveToHistory) {
    const conversation = getCurrentConversation();
    if (conversation) {
      conversation.history.push({
        type: type,
        content: content,
        timestamp: new Date().toISOString()
      });
      conversation.lastUpdated = new Date().toISOString();
    }
  }
  
  // Smooth scroll to bottom with proper timing
  setTimeout(() => {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: 'smooth'
    });
  }, 100);
  
  // Apply syntax highlighting
  if (window.Prism) Prism.highlightAllUnder(msg);
}

function attachCopyButtons(scope) {
  const blocks = scope.querySelectorAll('pre > code');
  blocks.forEach((codeEl) => {
    if (codeEl.parentElement.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy';
    btn.className = 'copy-btn';
    btn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(139,92,246,0.9);
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
      backdrop-filter: blur(10px);
    `;
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(codeEl.textContent);
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      btn.style.background = 'rgba(16,185,129,0.9)';
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = 'rgba(139,92,246,0.9)';
      }, 1200);
    });
    const pre = codeEl.parentElement;
    pre.style.position = 'relative';
    pre.appendChild(btn);
    
    // Add hover effect
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(139,92,246,1)';
      btn.style.transform = 'translateY(-1px)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(139,92,246,0.9)';
      btn.style.transform = 'translateY(0)';
    });
  });
}

function processMessageContent(content) {
  // Use marked library for better markdown processing
  if (typeof marked !== 'undefined') {
    // Configure marked for better rendering
    marked.setOptions({
      breaks: true,
      gfm: true,
      highlight: function(code, lang) {
        // Return code without syntax highlighting here, Prism will handle it
        return code;
      }
    });
    
    // Process with marked
    let processed = marked.parse(content);
    
    // Fix code blocks to use proper language classes
    processed = processed.replace(/<pre><code class="([^"]*)">/g, '<pre><code class="language-$1">');
    processed = processed.replace(/<pre><code>/g, '<pre><code class="language-text">');
    
    return processed;
  } else {
    // Fallback to simple processing
    // Code blocks
    content = content.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (m, lang, code) => {
      const language = lang || 'text';
      return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
    });
    // Inline code
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Headers
    content = content.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    content = content.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    content = content.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    // Links
    content = content.replace(/(https?:\/\/[^\s]+)(?![^<]*>|[^<>]*<\/?code>)/g, '<a href="$1" target="_blank">$1<\/a>');
    // Newlines
    return content.replace(/\n/g, '<br>');
  }
}

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// UI helpers
function showLoading(el) { el.classList.remove('hidden'); }
function hideLoading(el) { el.classList.add('hidden'); }
function showError(message, element, timeout = null) {
    element.textContent = message;
    element.classList.remove('hidden');

    if (timeout) {
        setTimeout(() => {
            hideError(element);
        }, timeout);
    }
}
function hideError(el) { el.classList.add('hidden'); }
function setComposerBusy(busy) {
    chatInput.disabled = busy;
    sendBtn.disabled = busy;
    stopBtn.classList.toggle('hidden', !busy);
    regenerateBtn.classList.toggle('hidden', busy);
}

// Conversations management
function newConversation() {
  showNewProblemModal();
}

function renderConversations() {
  console.log('renderConversations called. Current conversations:', conversations);
  console.log('Current conversation ID:', currentConversationId);
  
  conversationsList.innerHTML = '';
  
  const sortedConversations = Object.values(conversations).sort((a, b) => 
    new Date(b.lastUpdated) - new Date(a.lastUpdated)
  );
  
  console.log('Sorted conversations:', sortedConversations);
  
  sortedConversations.forEach(conversation => {
    const item = document.createElement('div');
    item.className = `conversation-item ${conversation.id === currentConversationId ? 'active' : ''}`;
    item.onclick = () => switchToConversation(conversation.id);
    
    const time = new Date(conversation.lastUpdated).toLocaleTimeString();
    const title = conversation.title.length > 30 ? 
      conversation.title.substring(0, 30) + '...' : conversation.title;
    
    item.innerHTML = `
      <div class="conversation-title">${title}</div>
      <div class="conversation-meta">${time}</div>
    `;
    
    conversationsList.appendChild(item);
  });
  
  if (sortedConversations.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'conversation-placeholder';
    placeholder.textContent = 'No conversations yet';
    conversationsList.appendChild(placeholder);
  }
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
function saveToLocalStorage() {
  try {
    const data = {
      conversations: conversations,
      currentConversationId: currentConversationId,
      timestamp: Date.now()
    };
    console.log('Saving to localStorage:', data);
    localStorage.setItem('codeforces_tutor_conversations', JSON.stringify(data));
    console.log('Successfully saved to localStorage');
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function hydrateFromStorage() {
  try {
    const saved = localStorage.getItem('codeforces_tutor_conversations');
    console.log('Loading from localStorage:', saved);
    
    if (!saved) {
      console.log('No saved data found');
      conversations = {};
      currentConversationId = null;
      return;
    }
    
    const data = JSON.parse(saved);
    console.log('Parsed data:', data);
    
    if (Date.now() - data.timestamp < 24 * 3600000) {
      conversations = data.conversations || {};
      console.log('Loaded conversations:', conversations);
      
      if (data.currentConversationId && conversations[data.currentConversationId]) {
        console.log('Switching to saved conversation:', data.currentConversationId);
        switchToConversation(data.currentConversationId);
      } else if (Object.keys(conversations).length > 0) {
        const sortedConversations = Object.values(conversations).sort((a, b) => 
          new Date(b.lastUpdated) - new Date(a.lastUpdated)
        );
        console.log('Switching to most recent conversation:', sortedConversations[0].id);
        switchToConversation(sortedConversations[0].id);
      }
    } else {
      console.log('Saved data is too old, ignoring');
      conversations = {};
      currentConversationId = null;
    }
  } catch (e) { 
    console.error('Failed to hydrate from localStorage:', e);
    conversations = {};
    currentConversationId = null;
  }
}

// Periodic save
setInterval(saveToLocalStorage, 30000);
