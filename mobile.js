const API_BASE = "https://wadashboardapi.almehrab.org/api";

const appEl = document.getElementById("mobileApp");
const conversationsEl = document.getElementById("conversations");
const messagesEl = document.getElementById("messages");
const chatTitleEl = document.getElementById("chatTitle");
const chatSubtitleEl = document.getElementById("chatSubtitle");
const searchInputEl = document.getElementById("searchInput");
const messageInputEl = document.getElementById("messageInput");
const sendBtnEl = document.getElementById("sendBtn");
const backBtnEl = document.getElementById("backBtn");
const refreshBtnEl = document.getElementById("refreshBtn");
const toggleAiBtnEl = document.getElementById("toggleAiBtn");
let currentAiEnabled = true;

let conversationsData = [];
let activeSessionId = null;
let typingIndicatorTimeout = null;

async function loadConversations() {
  conversationsEl.innerHTML = `<div class="loading-state">جاري تحميل المحادثات...</div>`;

  try {
    const res = await fetch(`${API_BASE}/conversations`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed conversations");

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
    item.className = "session-item";
    item.dataset.sessionId = conv.session_id || "";

    if (conv.session_id === activeSessionId) {
      item.classList.add("active");
    }

    item.innerHTML = `
      <div class="session-row">
        <div class="session-id">${escapeHtml(conv.session_id || "")}</div>
      </div>
      <div class="session-preview">${escapeHtml(conv.content || "")}</div>
    `;

    item.addEventListener("click", () => {
      activeSessionId = conv.session_id;
      renderConversations(conversationsData);
      openChat();
      loadMessages(conv.session_id);
      loadAiStatus(conv.session_id);
      setTimeout(() => messageInputEl.focus(), 250);
    });

    conversationsEl.appendChild(item);
  });
}

function openChat() {
  appEl.classList.add("chat-open");
}

function closeChat() {
  appEl.classList.remove("chat-open");
  removeAiTypingIndicator();
}

async function loadMessages(sessionId) {
  chatTitleEl.textContent = `${sessionId}`;
  chatSubtitleEl.textContent = "جاري تحميل الرسائل...";
  messagesEl.innerHTML = `<div class="loading-state">جاري تحميل الرسائل...</div>`;

  try {
    const res = await fetch(`${API_BASE}/messages/${encodeURIComponent(sessionId)}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed messages");

    const messages = await res.json();
    messagesEl.innerHTML = "";

    if (!Array.isArray(messages) || messages.length === 0) {
      messagesEl.innerHTML = `<div class="empty-state">لا توجد رسائل</div>`;
      chatSubtitleEl.textContent = "0 messages";
      return;
    }

    messages.forEach((msg) => appendMessageToUI(msg));
    chatSubtitleEl.textContent = `messages ${messages.length}`;
    scrollMessagesToBottom();
  } catch (error) {
    messagesEl.innerHTML = `<div class="error-state">فشل تحميل الرسائل</div>`;
    chatSubtitleEl.textContent = "Load failed";
    console.error(error);
  }
}

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

  return {
    ...messageObj,
    type: messageObj.type || msg?.type || "",
    content: messageObj.content || msg?.content || "",
    message_kind: messageObj.message_kind || msg?.message_kind || "text",
    media:
  messageObj.media ||
  msg?.media ||
  messageObj.mediaUrl ||
  msg?.mediaUrl ||
  messageObj.media_url ||
  msg?.media_url ||
  null,
media_url:
  messageObj.media_url ||
  msg?.media_url ||
  messageObj.mediaUrl ||
  msg?.mediaUrl ||
  "",
    interactive: messageObj.interactive || msg?.interactive || null,
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

function appendMessageToUI(msg) {
  const messageObj = normalizeMessage(msg);
  const rawType = String(messageObj.type || "").toLowerCase().trim();
  const content = String(messageObj.content || "").trim();
  const messageKind = String(messageObj.message_kind || "text").toLowerCase().trim();
  let mediaUrl = "";

if (typeof messageObj.media === "string") {
  mediaUrl = messageObj.media;
} else if (messageObj.media?.url) {
  mediaUrl = messageObj.media.url;
} else if (messageObj.media_url) {
  mediaUrl = messageObj.media_url;
}

const media = mediaUrl ? { url: mediaUrl } : null;
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
    img.alt = "image";
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

  const listData = messageObj.interactive?.list || messageObj.whatsapp_payload?.interactive?.action || null;
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

  const productListData = messageObj.interactive?.product_list || messageObj.whatsapp_payload?.interactive || null;
  if (messageKind === "product_list" && productListData) {
    const productWrap = document.createElement("div");
    productWrap.className = "wa-product";

    const header = document.createElement("div");
    header.className = "wa-product-header";

    if (productListData.header_image) {
      const img = document.createElement("img");
      img.src = productListData.header_image;
      img.className = "wa-product-image";
      header.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "wa-product-info";

    const title = document.createElement("div");
    title.className = "wa-product-title";
    title.textContent = productListData.header || "منتجات";

    const count = document.createElement("div");
    count.className = "wa-product-count";
    count.textContent = `items ${productListData.sections?.reduce((acc, s) => acc + (s.product_items?.length || 0), 0) || 0}`;

    info.appendChild(title);
    info.appendChild(count);
    header.appendChild(info);
    productWrap.appendChild(header);

    const btn = document.createElement("button");
    btn.className = "wa-list-button";
    btn.textContent = "View items";
    productWrap.appendChild(btn);

    bubble.appendChild(productWrap);
  }

  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  scrollMessagesToBottom();
}

async function sendMessageFromDashboard() {
  const message = messageInputEl.value.trim();

  if (!activeSessionId) return alert("اختر محادثة أولًا");
  if (!message) return;

  sendBtnEl.disabled = true;
  messageInputEl.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/send-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: activeSessionId, message })
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

const eventSource = new EventSource(`${API_BASE}/events`);

eventSource.onmessage = function (event) {
  let data = {};

  try {
    data = JSON.parse(event.data);
  } catch (e) {
    return;
  }

  const currentSession = String(activeSessionId || "").trim();
  const eventSession = String(data.sessionId || "").trim();

  if (data.type === "user_message") {
    if (currentSession === eventSession) {
      appendRealtimeMessage({
        type: "user",
        content: data.content || "",
        message_kind: data.messageKind || data.message_kind || "text",
media: data.mediaUrl || data.media_url || data.media || null,
        interactive: data.interactive || null,
        whatsapp_payload: data.whatsapp_payload || null
      });
    }
    updateConversationPreview();
    return;
  }

  if (data.type === "ai_typing") {
    if (currentSession === eventSession) showAiTypingIndicator();
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
    updateConversationPreview();
  }
};

function appendRealtimeMessage(messageObj) {
  removeAiTypingIndicator();
  appendMessageToUI({
    type: messageObj.type,
    content: messageObj.content || "",
    message_kind: messageObj.message_kind || "text",
    media: messageObj.media || null,
    interactive: messageObj.interactive || null,
    whatsapp_payload: messageObj.whatsapp_payload || null,
    message: messageObj
  });
}

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
  scrollMessagesToBottom();

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

function updateConversationPreview() {
  loadConversations();
}

function scrollMessagesToBottom() {
  requestAnimationFrame(() => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function linkifyText(text) {
  const safe = escapeHtml(text);
  return safe.replace(/((https?:\/\/[^\s]+)|(www\.[^\s]+))/g, (url) => {
    const href = url.startsWith("http") ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

searchInputEl.addEventListener("input", () => {
  const value = searchInputEl.value.trim().toLowerCase();
  const filtered = conversationsData.filter((conv) => {
    return String(conv.session_id || "").toLowerCase().includes(value) ||
      String(conv.content || "").toLowerCase().includes(value);
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

backBtnEl.addEventListener("click", closeChat);
refreshBtnEl.addEventListener("click", loadConversations);

window.addEventListener("popstate", () => {
  if (appEl.classList.contains("chat-open")) closeChat();
});
async function loadAiStatus(sessionId) {
  if (!sessionId || !toggleAiBtnEl) return;

  try {
    const res = await fetch(`${API_BASE}/ai-status/${encodeURIComponent(sessionId)}`, {
      cache: "no-store"
    });

    const data = await res.json();
    currentAiEnabled = data.ai_enabled !== false;
    updateAiButton();
  } catch (error) {
    console.error("Failed to load AI status", error);
  }
}

function updateAiButton() {
  if (!toggleAiBtnEl) return;

  toggleAiBtnEl.style.display = activeSessionId ? "inline-flex" : "none";
  toggleAiBtnEl.textContent = currentAiEnabled ? "إيقاف AI" : "تشغيل AI";
  toggleAiBtnEl.classList.toggle("off", currentAiEnabled);
  toggleAiBtnEl.classList.toggle("on", !currentAiEnabled);
}

async function toggleAiStatus() {
  if (!activeSessionId) return;

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

if (toggleAiBtnEl) {
  toggleAiBtnEl.addEventListener("click", toggleAiStatus);
}
loadConversations();
