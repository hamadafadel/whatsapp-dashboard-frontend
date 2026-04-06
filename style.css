const API_BASE = "https://wadashboardapi.almehrab.org/api";

const conversationsEl = document.getElementById("conversations");
const messagesEl = document.getElementById("messages");
const chatTitleEl = document.getElementById("chatTitle");
const chatSubtitleEl = document.getElementById("chatSubtitle");
const searchInputEl = document.getElementById("searchInput");

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
      const div = document.createElement("div");
      const messageType =
        msg.type === "human" || msg.type === "user" ? "user" : "ai";

      div.className = `message ${messageType}`;
      div.textContent = msg.content || "";
      messagesEl.appendChild(div);
    });

    chatSubtitleEl.textContent = `${messages.length} messages`;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (error) {
    messagesEl.innerHTML = `<div class="error-state">فشل تحميل الرسائل</div>`;
    chatSubtitleEl.textContent = "Load failed";
    console.error(error);
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

loadConversations();
