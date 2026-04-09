const API_BASE = "https://wadashboardapi.almehrab.org/api";

const conversationsEl = document.getElementById("conversations");
const messagesEl = document.getElementById("messages");
const chatTitleEl = document.getElementById("chatTitle");
const chatSubtitleEl = document.getElementById("chatSubtitle");
const searchInputEl = document.getElementById("searchInput");
const messageInputEl = document.getElementById("messageInput");
const sendBtnEl = document.getElementById("sendBtn");
const chatHeaderEl = document.querySelector(".chat-header");

let conversationsData = [];
let activeSessionId = null;
let typingIndicatorTimeout = null;
let currentAiEnabled = true;

// زرار AI
const toggleAiBtn = document.createElement("button");
toggleAiBtn.id = "toggleAiBtn";
toggleAiBtn.type = "button";
toggleAiBtn.textContent = "إيقاف AI";
toggleAiBtn.style.marginInlineStart = "12px";
toggleAiBtn.style.padding = "8px 14px";
toggleAiBtn.style.border = "none";
toggleAiBtn.style.borderRadius = "10px";
toggleAiBtn.style.cursor = "pointer";
toggleAiBtn.style.fontSize = "14px";
toggleAiBtn.style.fontWeight = "700";
toggleAiBtn.style.color = "#fff";
toggleAiBtn.style.background = "#dc3545";
toggleAiBtn.style.display = "none";

if (chatHeaderEl) {
  chatHeaderEl.appendChild(toggleAiBtn);
}

// =======================
// تحميل المحادثات
// =======================
async function loadConversations() {
  conversationsEl.innerHTML = `<div class="loading-state">جاري تحميل المحادثات...</div>`;

  try {
    const res = await fetch(`${API_BASE}/conversations`);
    const conversations = await res.json();

    conversationsData = Array.isArray(conversations) ? conversations : [];
    renderConversations(conversationsData);
  } catch (error) {
    conversationsEl.innerHTML = `<div class="error-state">فشل تحميل المحادثات</div>`;
    console.error(error);
  }
}

function renderConversations(conversations) {
  if (!conversations.length) {
    conversationsEl.innerHTML = `<div class="empty-state">لا توجد محادثات</div>`;
    return;
  }

  conversationsEl.innerHTML = "";

  conversations.forEach((conv) => {
    const item = document.createElement("div");
    item.className = "conversation-item";
    item.dataset.sessionId = conv.session_id || "";

    if (conv.session_id === activeSessionId) item.classList.add("active");

    item.innerHTML = `
      <div class="session-id">${escapeHtml(conv.session_id || "")}</div>
      <div class="preview">${escapeHtml(conv.content || "")}</div>
    `;

    item.addEventListener("click", () => {
      activeSessionId = conv.session_id;
      renderConversations(conversationsData);
      loadMessages(conv.session_id);
      loadAiStatus(conv.session_id);
      messageInputEl.focus();
    });

    conversationsEl.appendChild(item);
  });
}

// =======================
// تحميل الرسائل
// =======================
async function loadMessages(sessionId) {
  chatTitleEl.textContent = `Session: ${sessionId}`;
  chatSubtitleEl.textContent = "جاري تحميل الرسائل...";
  messagesEl.innerHTML = `<div class="loading-state">جاري تحميل الرسائل...</div>`;

  try {
    const res = await fetch(`${API_BASE}/messages/${sessionId}`);
    const messages = await res.json();

    messagesEl.innerHTML = "";

    if (!Array.isArray(messages) || messages.length === 0) {
      messagesEl.innerHTML = `<div class="empty-state">لا توجد رسائل</div>`;
      chatSubtitleEl.textContent = "0 messages";
      return;
    }

    messages.forEach((msg) => {
      appendMessageToUI(msg);
    });

    chatSubtitleEl.textContent = `messages ${messages.length}`;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (error) {
    messagesEl.innerHTML = `<div class="error-state">فشل تحميل الرسائل</div>`;
    chatSubtitleEl.textContent = "Load failed";
    console.error(error);
  }
}

// =======================
// رسم الرسائل
// =======================
function appendMessageToUI(msg) {
  const rawType = String(msg.type || "").toLowerCase().trim();
  const content = String(msg.content || "").trim();

  if (!content) return;
  if (rawType === "ai_typing") return;

  let messageType = "ai";

  if (rawType === "user" || rawType === "human") {
    messageType = "user";
  } else if (rawType === "agent") {
    messageType = "agent";
  } else if (rawType === "assistant" || rawType === "ai") {
    messageType = "ai";
  } else {
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = `message-wrap ${messageType}`;

  const bubble = document.createElement("div");
  bubble.className = `message ${messageType}`;

  if (messageType === "agent" || messageType === "ai") {
    const label = document.createElement("div");
    label.className = `message-label ${messageType}`;
    label.textContent = messageType === "agent" ? "Agent" : "AI";
    bubble.appendChild(label);
  }

  const textEl = document.createElement("div");
  textEl.className = "message-text";
  textEl.textContent = content;

  bubble.appendChild(textEl);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// =======================
// إرسال رسالة
// =======================
async function sendMessageFromDashboard() {
  const message = messageInputEl.value.trim();

  if (!activeSessionId) return alert("اختر محادثة أولًا");
  if (!message) return;

  sendBtnEl.disabled = true;
  messageInputEl.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/send-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
        message
      })
    });

    if (!res.ok) throw new Error("فشل الإرسال");

    messageInputEl.value = "";
  } catch (error) {
    console.error(error);
    alert("خطأ في الإرسال");
  } finally {
    sendBtnEl.disabled = false;
    messageInputEl.disabled = false;
    messageInputEl.focus();
  }
}

// =======================
// AI Status
// =======================
async function loadAiStatus(sessionId) {
  if (!sessionId) return;

  try {
    const res = await fetch(`${API_BASE}/ai-status/${sessionId}`);
    const data = await res.json();

    currentAiEnabled = data.ai_enabled !== false;
    updateAiButton();
  } catch (error) {
    console.error("Failed to load AI status", error);
  }
}

function updateAiButton() {
  if (!toggleAiBtn) return;

  toggleAiBtn.style.display = activeSessionId ? "inline-block" : "none";
  toggleAiBtn.textContent = currentAiEnabled ? "إيقاف AI" : "تشغيل AI";
  toggleAiBtn.style.background = currentAiEnabled ? "#dc3545" : "#25d366";
}

async function toggleAiStatus() {
  if (!activeSessionId) {
    alert("اختر محادثة أولًا");
    return;
  }

  const newStatus = !currentAiEnabled;

  try {
    const res = await fetch(`${API_BASE}/ai-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
        ai_enabled: newStatus
      })
    });

    if (!res.ok) throw new Error("Failed to update AI status");

    currentAiEnabled = newStatus;
    updateAiButton();
  } catch (error) {
    console.error(error);
    alert("فشل تغيير حالة AI");
  }
}

// =======================
// Realtime
// =======================
const eventSource = new EventSource(`${API_BASE}/events`);

eventSource.onmessage = function (event) {
  const data = JSON.parse(event.data);

  const currentSession = String(activeSessionId || "").trim();
  const eventSession = String(data.sessionId || "").trim();

  if (data.type === "user_message") {
    if (currentSession === eventSession && data.content) {
      appendRealtimeMessage(data.content, "user");
    }
    updateConversationPreview(eventSession, data.content);
    return;
  }

  if (data.type === "ai_typing") {
    if (currentSession === eventSession) {
      showAiTypingIndicator();
    }
    return;
  }

  if (data.type === "new_message") {
    if (currentSession === eventSession) {
      removeAiTypingIndicator();
    }

    if (currentSession === eventSession && data.content) {
      appendRealtimeMessage(data.content, data.messageType);
    }

    updateConversationPreview(eventSession, data.content);
    return;
  }

  if (data.type === "ai_status_changed") {
    if (currentSession === eventSession) {
      currentAiEnabled = data.ai_enabled !== false;
      updateAiButton();
    }
    return;
  }
};

// =======================
// append realtime
// =======================
function appendRealtimeMessage(content, messageType) {
  removeAiTypingIndicator();

  let type =
    messageType === "user"
      ? "user"
      : messageType === "agent"
      ? "agent"
      : "ai";

  const wrap = document.createElement("div");
  wrap.className = `message-wrap ${type}`;

  const bubble = document.createElement("div");
  bubble.className = `message ${type}`;

  if (type !== "user") {
    const label = document.createElement("div");
    label.className = `message-label ${type}`;
    label.textContent = type === "agent" ? "Agent" : "AI";
    bubble.appendChild(label);
  }

  const textEl = document.createElement("div");
  textEl.className = "message-text";
  textEl.textContent = content;

  bubble.appendChild(textEl);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// =======================
// typing indicator
// =======================
function showAiTypingIndicator() {
  removeAiTypingIndicator();

  const wrap = document.createElement("div");
  wrap.className = "message-wrap ai typing-wrap";
  wrap.setAttribute("data-typing-indicator", "true");

  const bubble = document.createElement("div");
  bubble.className = "message ai typing-bubble";

  const label = document.createElement("div");
  label.className = "message-label ai";
  label.textContent = "AI";

  const dots = document.createElement("div");
  dots.className = "typing-dots";
  dots.innerHTML = `<span></span><span></span><span></span>`;

  bubble.appendChild(label);
  bubble.appendChild(dots);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);

  messagesEl.scrollTop = messagesEl.scrollHeight;

  typingIndicatorTimeout = setTimeout(removeAiTypingIndicator, 15000);
}

function removeAiTypingIndicator() {
  const existing = messagesEl.querySelector('[data-typing-indicator="true"]');
  if (existing) existing.remove();

  if (typingIndicatorTimeout) {
    clearTimeout(typingIndicatorTimeout);
    typingIndicatorTimeout = null;
  }
}

// =======================
function updateConversationPreview() {
  loadConversations();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// =======================
searchInputEl.addEventListener("input", () => {
  const value = searchInputEl.value.trim().toLowerCase();

  const filtered = conversationsData.filter((conv) => {
    return (
      String(conv.session_id || "").toLowerCase().includes(value) ||
      String(conv.content || "").toLowerCase().includes(value)
    );
  });

  renderConversations(filtered);
});

sendBtnEl.addEventListener("click", sendMessageFromDashboard);

messageInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessageFromDashboard();
  }
});

toggleAiBtn.addEventListener("click", toggleAiStatus);

loadConversations();
