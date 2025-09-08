// Global variables
let currentSession = null;
let currentProblemData = null;

// DOM elements
const urlSection = document.getElementById('url-section');
const problemSection = document.getElementById('problem-section');
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
const newProblemBtn = document.getElementById('new-problem-btn');
const codeModal = document.getElementById('code-input-modal');
const studentCodeInput = document.getElementById('student-code');

// Loading and error elements
const urlLoading = document.getElementById('url-loading');
const urlError = document.getElementById('url-error');
const globalLoading = document.getElementById('global-loading');
const globalError = document.getElementById('global-error');

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    
    // Auto-focus URL input
    urlInput.focus();
});

function setupEventListeners() {
    extractBtn.addEventListener('click', extractProblem);
    startSessionBtn.addEventListener('click', startSession);
    sendBtn.addEventListener('click', sendMessage);
    getHintBtn.addEventListener('click', getHint);
    getSolutionBtn.addEventListener('click', getSolution);
    analyzeCodeBtn.addEventListener('click', showCodeModal);
    newProblemBtn.addEventListener('click', startNewProblem);
    
    // Enter key handlers
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            extractProblem();
        }
    });
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Modal handlers
    document.querySelector('.close').addEventListener('click', hideCodeModal);
    document.getElementById('submit-code-btn').addEventListener('click', submitCodeForAnalysis);
    document.getElementById('cancel-code-btn').addEventListener('click', hideCodeModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === codeModal) {
            hideCodeModal();
        }
    });
}

// API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    console.log(`🌐 API Call: ${method} /api/${endpoint}`, data);
    
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
            console.log("📤 Request body:", JSON.stringify(data, null, 2));
        }
        
        console.log("📡 Sending request to:", `/api/${endpoint}`);
        const response = await fetch(`/api/${endpoint}`, options);
        
        console.log("📥 Response received:", response.status, response.statusText);
        
        const result = await response.json();
        console.log("📋 Response data:", result);
        
        if (!response.ok) {
            console.error("❌ API call failed:", result.error);
            throw new Error(result.error || 'Request failed');
        }
        
        console.log("✅ API call successful");
        return result;
    } catch (error) {
        console.error('💥 API call failed with exception:', error);
        throw error;
    }
}

// Problem extraction
async function extractProblem() {
    const url = urlInput.value.trim();
    if (!url) {
        showError('Please enter a valid Codeforces problem URL', urlError);
        return;
    }
    
    if (!url.includes('codeforces.com')) {
        showError('Please enter a valid Codeforces URL', urlError);
        return;
    }
    
    showLoading(urlLoading);
    hideError(urlError);
    extractBtn.disabled = true;
    
    try {
        const result = await apiCall('extract-problem', 'POST', { url: url });
        currentProblemData = result;
        displayProblemInfo(result);
        showSection(problemSection);
        hideLoading(urlLoading);
    } catch (error) {
        hideLoading(urlLoading);
        showError(`Failed to extract problem: ${error.message}`, urlError);
    } finally {
        extractBtn.disabled = false;
    }
}

function displayProblemInfo(problemData) {
    document.getElementById('problem-title').textContent = `${problemData.problem_id} - ${problemData.title}`;
    document.getElementById('problem-contest').textContent = problemData.contest_title;
    
    if (problemData.time_limit) {
        document.getElementById('time-limit').textContent = `Time: ${problemData.time_limit}`;
    }
    
    if (problemData.memory_limit) {
        document.getElementById('memory-limit').textContent = `Memory: ${problemData.memory_limit}`;
    }
    
    // Display tags
    const tagsContainer = document.getElementById('tags');
    tagsContainer.innerHTML = '';
    if (problemData.tags && problemData.tags.length > 0) {
        problemData.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
    }
    
    // Display problem statement
    const statementContainer = document.getElementById('problem-statement');
    statementContainer.textContent = problemData.statement || 'Problem statement not available.';
    
    // Display sample tests
    const sampleTestsContainer = document.getElementById('sample-tests');
    sampleTestsContainer.innerHTML = '';
    
    if (problemData.sample_inputs && problemData.sample_outputs) {
        for (let i = 0; i < Math.min(problemData.sample_inputs.length, problemData.sample_outputs.length); i++) {
            const testDiv = document.createElement('div');
            testDiv.className = 'sample-test';
            testDiv.innerHTML = `
                <h4>Example ${i + 1}</h4>
                <div class="sample-content">
                    <div class="sample-io">
                        <h5>Input:</h5>
                        <pre>${escapeHtml(problemData.sample_inputs[i])}</pre>
                    </div>
                    <div class="sample-io">
                        <h5>Output:</h5>
                        <pre>${escapeHtml(problemData.sample_outputs[i])}</pre>
                    </div>
                </div>
            `;
            sampleTestsContainer.appendChild(testDiv);
        }
    }
}

// Session management
async function startSession() {
    if (!currentProblemData) {
        showError('No problem data available', globalError);
        return;
    }
    
    showLoading(globalLoading);
    hideError(globalError);
    startSessionBtn.disabled = true;
    
    try {
        const result = await apiCall('start-session', 'POST', { 
            problem_id: currentProblemData.problem_id 
        });
        
        currentSession = {
            session_id: result.session_id,
            problem_title: result.problem_title
        };
        
        // Update session display
        document.getElementById('session-id-display').textContent = `Session: ${result.session_id}`;
        document.getElementById('hints-counter').textContent = 'Hints given: 0';
        
        // Clear previous messages and add welcome message
        chatMessages.innerHTML = '';
        addMessage('assistant', result.welcome_message);
        
        showSection(sessionSection);
        hideLoading(globalLoading);
        
        // Focus chat input
        chatInput.focus();
        
    } catch (error) {
        hideLoading(globalLoading);
        showError(`Failed to start session: ${error.message}`, globalError);
    } finally {
        startSessionBtn.disabled = false;
    }
}

// Chat functionality
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || !currentSession) {
        return;
    }
    
    // Add user message to chat
    addMessage('user', message);
    chatInput.value = '';
    
    // Disable input while processing
    chatInput.disabled = true;
    sendBtn.disabled = true;
    
    try {
        const result = await apiCall('chat', 'POST', {
            session_id: currentSession.session_id,
            message: message
        });
        
        // Add AI response
        const messageClass = result.is_hint ? 'hint' : 'assistant';
        addMessage(messageClass, result.message);
        
        // Update hints counter
        if (result.hints_given !== undefined) {
            document.getElementById('hints-counter').textContent = `Hints given: ${result.hints_given}`;
        }
        
    } catch (error) {
        addMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
    } finally {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

async function getHint() {
    console.log("🔍 getHint() called");
    
    if (!currentSession) {
        console.error("❌ No active session");
        showError('No active session', globalError);
        return;
    }
    
    console.log("✅ Active session found:", currentSession.session_id);
    
    getHintBtn.disabled = true;
    console.log("🔒 Hint button disabled");
    
    try {
        console.log("📡 Making API call to get-hint...");
        const result = await apiCall('get-hint', 'POST', {
            session_id: currentSession.session_id
        });
        
        console.log("✅ API call successful:", result);
        
        addMessage('hint', result.hint);
        
        // Update hints counter
        document.getElementById('hints-counter').textContent = `Hints given: ${result.hint_number}`;
        
        // Disable hint button if no more hints available
        if (!result.more_hints_available) {
            getHintBtn.textContent = 'No more hints available';
            getHintBtn.disabled = true;
            console.log("🚫 No more hints available, button permanently disabled");
        }
        
    } catch (error) {
        console.error("❌ API call failed:", error);
        addMessage('assistant', `Sorry, I couldn't provide a hint: ${error.message}`);
    } finally {
        if (getHintBtn.textContent.includes('No more hints')) {
            console.log("🔒 Keeping hint button disabled (no more hints)");
            // Keep disabled
        } else {
            getHintBtn.disabled = false;
            console.log("🔓 Hint button re-enabled");
        }
    }
}

async function getSolution() {
    if (!currentSession) {
        showError('No active session', globalError);
        return;
    }
    
    if (!confirm('Are you sure you want to see the complete solution? This will end the learning challenge.')) {
        return;
    }
    
    getSolutionBtn.disabled = true;
    
    try {
        const result = await apiCall('get-solution', 'POST', {
            session_id: currentSession.session_id
        });
        
        addMessage('solution', result.solution);
        
        // Disable other learning actions
        getHintBtn.disabled = true;
        getHintBtn.textContent = 'Solution revealed';
        
    } catch (error) {
        addMessage('assistant', `Sorry, I couldn't provide the solution: ${error.message}`);
        getSolutionBtn.disabled = false;
    }
}

// Code analysis
function showCodeModal() {
    codeModal.classList.remove('hidden');
    studentCodeInput.focus();
}

function hideCodeModal() {
    codeModal.classList.add('hidden');
    studentCodeInput.value = '';
}

async function submitCodeForAnalysis() {
    const code = studentCodeInput.value.trim();
    if (!code) {
        alert('Please enter your code first.');
        return;
    }
    
    if (!currentSession) {
        showError('No active session', globalError);
        return;
    }
    
    hideCodeModal();
    
    // Add user message showing they submitted code
    addMessage('user', `[Submitted code for analysis]\n\`\`\`\n${code}\n\`\`\``);
    
    try {
        // Send code as a chat message for analysis
        const result = await apiCall('chat', 'POST', {
            session_id: currentSession.session_id,
            message: `Please analyze my code:\n\`\`\`\n${code}\n\`\`\``
        });
        
        addMessage('assistant', result.message);
        
    } catch (error) {
        addMessage('assistant', `Sorry, I couldn't analyze your code: ${error.message}`);
    }
}

// UI helper functions
function addMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Process markdown and code blocks
    const processedContent = processMessageContent(content);
    messageContent.innerHTML = processedContent;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Apply syntax highlighting to code blocks
    if (window.Prism) {
        Prism.highlightAllUnder(messageDiv);
    }
}

function processMessageContent(content) {
    // Convert markdown-style code blocks to HTML
    content = content.replace(/```(\w+)?\n([\s\S]*?)\n```/g, function(match, lang, code) {
        const language = lang || 'text';
        return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
    });
    
    // Convert inline code
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert line breaks
    content = content.replace(/\n/g, '<br>');
    
    return content;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSection(section) {
    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth' });
}

function hideSection(section) {
    section.classList.add('hidden');
}

function showLoading(element) {
    element.classList.remove('hidden');
}

function hideLoading(element) {
    element.classList.add('hidden');
}

function showError(message, element) {
    element.textContent = message;
    element.classList.remove('hidden');
}

function hideError(element) {
    element.classList.add('hidden');
}

function startNewProblem() {
    if (confirm('Are you sure you want to start a new problem? Current session will be lost.')) {
        // Reset state
        currentSession = null;
        currentProblemData = null;
        
        // Reset UI
        urlInput.value = '';
        chatMessages.innerHTML = '';
        hideSection(problemSection);
        hideSection(sessionSection);
        hideError(urlError);
        hideError(globalError);
        
        // Re-enable buttons
        getHintBtn.disabled = false;
        getHintBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Get Progressive Hint';
        getSolutionBtn.disabled = false;
        
        // Focus URL input
        urlInput.focus();
    }
}

// Auto-save session data (optional feature)
function saveSessionToLocalStorage() {
    if (currentSession) {
        localStorage.setItem('codeforces_tutor_session', JSON.stringify({
            session: currentSession,
            problem: currentProblemData,
            timestamp: Date.now()
        }));
    }
}

function loadSessionFromLocalStorage() {
    try {
        const saved = localStorage.getItem('codeforces_tutor_session');
        if (saved) {
            const data = JSON.parse(saved);
            // Only restore if less than 1 hour old
            if (Date.now() - data.timestamp < 3600000) {
                currentSession = data.session;
                currentProblemData = data.problem;
                return true;
            }
        }
    } catch (error) {
        console.error('Failed to load session from localStorage:', error);
    }
    return false;
}

// Periodic session save
setInterval(saveSessionToLocalStorage, 30000); // Save every 30 seconds