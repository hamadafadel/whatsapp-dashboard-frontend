const API_BASE = "https://wadashboardapi.almehrab.org/api";

const conversationsEl = document.getElementById("conversations");
const messagesEl = document.getElementById("messages");
const chatTitleEl = document.getElementById("chatTitle");
const chatSubtitleEl = document.getElementById("chatSubtitle");
const searchInputEl = document.getElementById("searchInput");
const messageInputEl = document.getElementById("messageInput");
const sendBtnEl = document.getElementById("sendBtn");

let conversationsData = [];
let activeSessionId = null;

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

    const previewText = (conv.content || "").trim();

    item.innerHTML = `
      <div class="session-id">${escapeHtml(conv.session_id || "")}</div>
      <div class="preview">${escapeHtml(previewText)}</div>
    `;

    item.addEventListener("click", () => {
      activeSessionId = conv.session_id;
      renderConversations(conversationsData);
      loadMessages(conv.session_id);
      messageInputEl.focus();
    });

    conversationsEl.appendChild(item);
  });
}

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

function appendMessageToUI(msg) {
  const rawType = String(msg.type || "").toLowerCase();

let messageType = "ai";

if (rawType === "user" || rawType === "human") {
  messageType = "user";
} else if (rawType === "agent") {
  messageType = "agent";
} else {
  messageType = "ai";
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
  textEl.textContent = msg.content || "";

  bubble.appendChild(textEl);
  wrap.appendChild(bubble);

  const text = String(msg.content || "");
  const isLongMessage = text.length > 350 || text.split("\n").length > 6;

  if (isLongMessage) {
    textEl.classList.add("collapsed");

    const btn = document.createElement("button");
    btn.className = "expand-btn";
    btn.textContent = "عرض المزيد";

    btn.addEventListener("click", () => {
      const collapsed = textEl.classList.contains("collapsed");

      if (collapsed) {
        textEl.classList.remove("collapsed");
        btn.textContent = "عرض أقل";
      } else {
        textEl.classList.add("collapsed");
        btn.textContent = "عرض المزيد";
      }
    });

    wrap.appendChild(btn);
  }

  messagesEl.appendChild(wrap);
}

function updateConversationPreview(sessionId, content) {
  const normalizedSessionId = String(sessionId || "").trim();
  const normalizedContent = String(content || "").trim();

  if (!normalizedSessionId) return;

  const item = conversationsEl.querySelector(
    `.conversation-item[data-session-id="${CSS.escape(normalizedSessionId)}"]`
  );

  if (!item) {
    loadConversations();
    return;
  }

  const previewEl = item.querySelector(".preview");
  const sessionEl = item.querySelector(".session-id");

  if (previewEl) {
    previewEl.textContent = normalizedContent;
  }

  if (sessionEl) {
    sessionEl.textContent = normalizedSessionId;
  }

  conversationsData = conversationsData.filter(
    (conv) => String(conv.session_id || "").trim() !== normalizedSessionId
  );

  conversationsData.unshift({
    session_id: normalizedSessionId,
    content: normalizedContent
  });

  conversationsEl.prepend(item);

  conversationsEl.querySelectorAll(".conversation-item").forEach((el) => {
    const itemSessionId = String(el.dataset.sessionId || "").trim();
    if (itemSessionId === String(activeSessionId || "").trim()) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });
}

async function sendMessageFromDashboard() {
  const message = messageInputEl.value.trim();

  if (!activeSessionId) {
    alert("اختر محادثة أولًا");
    return;
  }

  if (!message) {
    return;
  }

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

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "فشل إرسال الرسالة");
    }

    messageInputEl.value = "";
  } catch (error) {
    console.error("sendMessageFromDashboard error:", error);
    alert(error.message || "حدث خطأ أثناء الإرسال");
  } finally {
    sendBtnEl.disabled = false;
    messageInputEl.disabled = false;

    setTimeout(() => {
      messageInputEl.focus();
      messageInputEl.setSelectionRange(
        messageInputEl.value.length,
        messageInputEl.value.length
      );
    }, 0);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

searchInputEl.addEventListener("input", () => {
  const value = searchInputEl.value.trim().toLowerCase();

  const filtered = conversationsData.filter((conv) => {
    const sessionId = String(conv.session_id || "").toLowerCase();
    const content = String(conv.content || "").toLowerCase();
    return sessionId.includes(value) || content.includes(value);
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

loadConversations();

// 🔥 Real-time connection
const eventSource = new EventSource(`${API_BASE}/events`);

eventSource.onmessage = function (event) {
  const data = JSON.parse(event.data);

  console.log("Realtime event:", data);

  const currentSession = String(activeSessionId || "").trim();
  const eventSession = String(data.sessionId || "").trim();

  if (data.type === "user_message") {
    if (currentSession === eventSession && data.content) {
      appendRealtimeUserMessage(data.content);
    }

    updateConversationPreview(eventSession, data.content);
    return;
  }

  if (data.type === "new_message") {
  if (currentSession === eventSession && data.content) {
    appendRealtimeMessage(data.content, data.messageType);
  }

  updateConversationPreview(eventSession, data.content);
  return;
}};

eventSource.onerror = function (error) {
  console.error("SSE error:", error);
};

function appendRealtimeUserMessage(content) {
  const lastMessageText = messagesEl.querySelector(
    ".message-wrap.user:last-child .message-text"
  );

  if (
    lastMessageText &&
    lastMessageText.textContent.trim() === String(content || "").trim()
  ) {
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "message-wrap user";

  const bubble = document.createElement("div");
  bubble.className = "message user";

  const textEl = document.createElement("div");
  textEl.className = "message-text";
  textEl.textContent = content || "";

  bubble.appendChild(textEl);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendRealtimeMessage(content, messageType) {
  let type = "ai";

  if (messageType === "user") {
    type = "user";
  } else if (messageType === "agent") {
    type = "agent";
  } else {
    type = "ai";
  }

  const lastMessageText = messagesEl.querySelector(
    `.message-wrap.${type}:last-child .message-text`
  );

  if (
    lastMessageText &&
    lastMessageText.textContent.trim() === String(content || "").trim()
  ) {
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = `message-wrap ${type}`;

  const bubble = document.createElement("div");
  bubble.className = `message ${type}`;

  if (type === "agent" || type === "ai") {
    const label = document.createElement("div");
    label.className = `message-label ${type}`;
    label.textContent = type === "agent" ? "Agent" : "AI";
    bubble.appendChild(label);
  }

  const textEl = document.createElement("div");
  textEl.className = "message-text";
  textEl.textContent = content || "";

  bubble.appendChild(textEl);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);

  messagesEl.scrollTop = messagesEl.scrollHeight;
}
