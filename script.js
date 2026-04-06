const API_BASE = "https://wadashboardapi.almehrab.org/api";

const conversationsEl = document.getElementById("conversations");
const messagesEl = document.getElementById("messages");
const chatTitleEl = document.getElementById("chatTitle");

let activeSessionId = null;

async function loadConversations() {
  try {
    const res = await fetch(`${API_BASE}/conversations`);
    const conversations = await res.json();

    conversationsEl.innerHTML = "";

    conversations.forEach((conv) => {
      const item = document.createElement("div");
      item.className = "conversation-item";
      item.dataset.sessionId = conv.session_id;

      item.innerHTML = `
        <div class="session-id">${conv.session_id}</div>
        <div class="preview">
  ${escapeHtml((conv.content || "").slice(0, 80))}...
</div>
      `;

      item.addEventListener("click", () => {
        document.querySelectorAll(".conversation-item").forEach((el) => {
          el.classList.remove("active");
        });
        item.classList.add("active");
        loadMessages(conv.session_id);
      });

      conversationsEl.appendChild(item);
    });
  } catch (error) {
    conversationsEl.innerHTML = `<div style="padding:16px;color:red;">Failed to load conversations</div>`;
    console.error(error);
  }
}

async function loadMessages(sessionId) {
  activeSessionId = sessionId;
  chatTitleEl.textContent = `Session: ${sessionId}`;
  messagesEl.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/messages/${sessionId}`);
    const messages = await res.json();

    messagesEl.innerHTML = "";

    messages.forEach((msg) => {
      const div = document.createElement("div");
      div.className = `message ${msg.type === "human" ? "user" : "ai"}`;
      div.textContent = msg.content || "";
      messagesEl.appendChild(div);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (error) {
    messagesEl.innerHTML = `<div style="color:red;">Failed to load messages</div>`;
    console.error(error);
  }
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadConversations();
