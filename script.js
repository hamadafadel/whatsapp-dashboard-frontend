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

```
conversationsData = Array.isArray(conversations) ? conversations : [];
renderConversations(conversationsData);
```

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

```
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
```

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

```
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
```

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
const messageObj = msg.message || msg;

const rawType = String(messageObj.type || msg.type || "").toLowerCase().trim();
const content = String(messageObj.content || msg.content || "").trim();
const messageKind = String(messageObj.message_kind || msg.message_kind || "text").toLowerCase().trim();
const media = messageObj.media || null;
const interactive = messageObj.interactive || null;

if (!content && messageKind === "text") return;
if (rawType === "ai_typing") return;

let messageType = "ai";

if (rawType === "user" || rawType === "human") messageType = "user";
else if (rawType === "agent") messageType = "agent";
else if (rawType === "assistant" || rawType === "ai") messageType = "ai";
else return;

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

// ===== Media =====
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

// ===== Text =====
if (content) {
const textEl = document.createElement("div");
textEl.className = "message-text";
textEl.textContent = content;
bubble.appendChild(textEl);
}

// ===== Buttons (FIXED) =====
let buttons = [];

if (interactive?.buttons?.length) {
buttons = interactive.buttons;
} else if (messageObj.whatsapp_payload?.interactive?.action?.buttons?.length) {
buttons = messageObj.whatsapp_payload.interactive.action.buttons.map(b => ({
id: b.reply?.id || "",
title: b.reply?.title || ""
}));
}

if (buttons.length) {
const buttonsWrap = document.createElement("div");
buttonsWrap.className = "wa-buttons";

```
buttons.forEach((btn) => {
  const buttonEl = document.createElement("button");
  buttonEl.className = "wa-button";
  buttonEl.type = "button";
  buttonEl.textContent = btn.title || btn.text || "زر";
  buttonsWrap.appendChild(buttonEl);
});

bubble.appendChild(buttonsWrap);
```

}

wrap.appendChild(bubble);
messagesEl.appendChild(wrap);
messagesEl.scrollTop = messagesEl.scrollHeight;
}

// =======================
// باقي الكود زي ما هو
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
message: messageObj
});
}

// باقي الكود بدون أي تغيير...
