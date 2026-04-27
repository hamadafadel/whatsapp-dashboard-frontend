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
// helpers
// =======================
function normalizeMessage(msg) {
  const messageObj = msg?.message || msg || {};

  let whatsappPayload = messageObj.whatsapp_payload || msg?.whatsapp_payload || null;

  if (typeof whatsappPayload === "string") {
    try {
      whatsappPayload = JSON.parse(whatsappPayload);
    } catch (e) {
      whatsappPayload = null;
    }
  }

  const interactive =
    messageObj.interactive ||
    msg?.interactive ||
    null;

  const media =
    messageObj.media ||
    msg?.media ||
    null;

  return {
    ...messageObj,
    type: messageObj.type || msg?.type || "",
    content: messageObj.content || msg?.content || "",
    message_kind: messageObj.message_kind || msg?.message_kind || "text",
    media,
    interactive,
    whatsapp_payload: whatsappPayload
  };
}

function extractButtons(messageObj) {
  if (messageObj.interactive?.buttons?.length) {
    return messageObj.interactive.buttons.map((b) => ({
      id: b.id || b.reply?.id || "",
      title: b.title || b.text || b.reply?.title || "زر"
    }));
  }

  const wpButtons = messageObj.whatsapp_payload?.interactive?.action?.buttons;
  if (Array.isArray(wpButtons) && wpButtons.length) {
    return wpButtons.map((b) => ({
      id: b.reply?.id || b.id || "",
      title: b.reply?.title || b.title || "زر"
    }));
  }

  return [];
}

// =======================
// رسم الرسائل
// =======================
function appendMessageToUI(msg) {
  const messageObj = normalizeMessage(msg);

  const rawType = String(messageObj.type || "").toLowerCase().trim();
  const content = String(messageObj.content || "").trim();
  const messageKind = String(messageObj.message_kind || "text").toLowerCase().trim();
  const media = messageObj.media || null;

  const buttons = extractButtons(messageObj);

  if (!content && messageKind === "text" && !buttons.length && !media?.url) return;
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

  if (messageKind === "image" && media?.url) {
    const img = document.createElement("img");
    img.src = media.url;
    img.style.maxWidth = "100%";
    img.style.borderRadius = "8px";
    img.style.marginBottom = content ? "6px" : "0";
    bubble.appendChild(img);
  }

  if (messageKind === "video" && media?.url) {
    const video = document.createElement("video");
    video.src = media.url;
    video.controls = true;
    video.style.maxWidth = "100%";
    video.style.borderRadius = "8px";
    video.style.marginBottom = content ? "6px" : "0";
    bubble.appendChild(video);
  }

  if (content) {
    const textEl = document.createElement("div");
    textEl.className = "message-text";
    textEl.innerHTML = linkifyText(content);
    bubble.appendChild(textEl);
  }

  if (buttons.length) {
    const buttonsWrap = document.createElement("div");
    buttonsWrap.className = "wa-buttons";

    buttons.forEach((btn) => {
      const buttonEl = document.createElement("button");
      buttonEl.className = "wa-button";
      buttonEl.type = "button";
      buttonEl.textContent = btn.title || "زر";
      buttonsWrap.appendChild(buttonEl);
    });

    bubble.appendChild(buttonsWrap);
  }

  const listData =
    messageObj.interactive?.list ||
    messageObj.whatsapp_payload?.interactive?.action ||
    null;

  if (messageKind === "list" && listData) {
    const listWrap = document.createElement("div");
    listWrap.className = "wa-list";

    const listBtn = document.createElement("button");
    listBtn.className = "wa-list-button";
    listBtn.type = "button";
    listBtn.textContent = "☰ " + (listData.button || "اختار");

    listWrap.appendChild(listBtn);
    bubble.appendChild(listWrap);
  }

  const productListData =
    messageObj.interactive?.product_list ||
    messageObj.whatsapp_payload?.interactive ||
    null;

  if (messageKind === "product_list" && productListData) {
    const productWrap = document.createElement("div");
    productWrap.className = "wa-list";

    const productBtn = document.createElement("button");
    productBtn.className = "wa-list-button";
    productBtn.type = "button";
    productBtn.textContent = "☰ View items";

    productWrap.appendChild(productBtn);
    bubble.appendChild(productWrap);
  }

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
    if (currentSession === eventSession) {
      appendRealtimeMessage({
        type: "user",
        content: data.content || "",
        message_kind: data.message_kind || "text",
        media: data.media || null,
        interactive: data.interactive || null,
        whatsapp_payload: data.whatsapp_payload || null
      });
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

      appendRealtimeMessage({
        type: data.messageType || "ai",
        content: data.content || "",
        message_kind: data.message_kind || "text",
        media: data.media || null,
        interactive: data.interactive || null,
        whatsapp_payload: data.whatsapp_payload || null
      });
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
function appendRealtimeMessage(dataOrContent, messageType) {
  removeAiTypingIndicator();

  const messageObj =
    typeof dataOrContent === "object"
      ? dataOrContent
      : {
          type: messageType,
          content: dataOrContent,
          message_kind: "text"
        };

  appendMessageToUI({
    type: messageObj.type || messageType,
    content: messageObj.content || "",
    message_kind: messageObj.message_kind || "text",
    media: messageObj.media || null,
    interactive: messageObj.interactive || null,
    whatsapp_payload: messageObj.whatsapp_payload || null,
    message: messageObj
  });
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

function linkifyText(text) {
  const safe = escapeHtml(text);

  return safe.replace(
    /((https?:\/\/[^\s]+)|(www\.[^\s]+))/g,
    (url) => {
      const href = url.startsWith("http") ? url : `https://${url}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    }
  );
}
