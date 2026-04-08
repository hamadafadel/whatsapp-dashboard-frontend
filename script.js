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
  const messageType =
    rawType === "human" || rawType === "user" ? "user" : "ai";

  const wrap = document.createElement("div");
  wrap.className = `message-wrap ${messageType}`;

  const bubble = document.createElement("div");
  bubble.className = `message ${messageType}`;

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
    messageInputEl.focus();
  } catch (error) {
    console.error("sendMessageFromDashboard error:", error);
    alert(error.message || "حدث خطأ أثناء الإرسال");
  } finally {
    sendBtnEl.disabled = false;
    messageInputEl.disabled = false;
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

  // رسالة جاية من العميل
  if (data.type === "user_message") {
  if (currentSession === eventSession && data.content) {
    appendRealtimeUserMessage(data.content);
  }
  return;
}

  // رسالة جديدة طالعة من الداشبورد
  if (data.type === "new_message") {
  if (currentSession === eventSession && data.content) {
    appendRealtimeAiMessage(data.content);
  }

  loadConversations();
  return;
}

  // fallback لأي event تاني
  loadConversations();
};

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

function appendRealtimeAiMessage(content) {
  const lastMessageText = messagesEl.querySelector(
    ".message-wrap.ai:last-child .message-text"
  );

  if (
    lastMessageText &&
    lastMessageText.textContent.trim() === String(content || "").trim()
  ) {
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "message-wrap ai";

  const bubble = document.createElement("div");
  bubble.className = "message ai";

  const textEl = document.createElement("div");
  textEl.className = "message-text";
  textEl.textContent = content || "";

  bubble.appendChild(textEl);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);

  messagesEl.scrollTop = messagesEl.scrollHeight;
}
