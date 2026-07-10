const API_BASE = "https://wadashboardapi.almehrab.org/api";
const chatNameEl = document.getElementById("chatName");
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
const loginScreenEl = document.getElementById("loginScreen");
const loginUsernameEl = document.getElementById("loginUsername");
const loginPasswordEl = document.getElementById("loginPassword");
const loginBtnEl = document.getElementById("loginBtn");
const loginErrorEl = document.getElementById("loginError");
const mediaInputEl = document.getElementById("mediaInput");
const attachBtnEl = document.getElementById("attachBtn");

let currentAiEnabled = true;

let conversationsData = [];
let activeSessionId = null;
let typingIndicatorTimeout = null;
let selectedReplyMessage = null;
let longPressTimer = null;
let authToken = localStorage.getItem("dashboard_token") || "";
function getAuthHeaders(extraHeaders = {}) {
  return {
    ...extraHeaders,
    Authorization: `Bearer ${authToken}`
  };
}

function showLogin() {
  loginScreenEl?.classList.remove("hidden");
}

function hideLogin() {
  loginScreenEl?.classList.add("hidden");
}

function logout() {
  localStorage.removeItem("dashboard_token");
  authToken = "";
  showLogin();
}

function handleInvalidToken(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("dashboard_token");
    authToken = "";

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    showLogin();
    return true;
  }

  return false;
}

async function loadConversations() {
  conversationsEl.innerHTML = `<div class="loading-state">جاري تحميل المحادثات...</div>`;

 try {
  const res = await fetch(`${API_BASE}/conversations`, {
    cache: "no-store",
    headers: getAuthHeaders()
  });

  if (handleInvalidToken(res)) return;
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
        <div class="session-id">
  ${escapeHtml(conv.customer_name || "عميل")}
  <div style="font-size:12px;color:#8696a0">
    ${escapeHtml(conv.session_id || "")}
  </div>
</div>
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
      // chatNameEl.textContent = conv.customer_name || "عميل";
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
  const conv = conversationsData.find(c => c.session_id === sessionId);

chatTitleEl.textContent = conv?.customer_name || "عميل";
chatSubtitleEl.textContent = sessionId;
messagesEl.innerHTML = `<div class="loading-state">جاري تحميل الرسائل...</div>`;
 try {
  const res = await fetch(
    `${API_BASE}/messages/${encodeURIComponent(sessionId)}?limit=50`,
    {
      cache: "no-store",
      headers: getAuthHeaders()
    }
  );

  if (!res.ok) throw new Error("Failed messages");

    const messages = await res.json();
    messagesEl.innerHTML = "";

    if (!Array.isArray(messages) || messages.length === 0) {
      messagesEl.innerHTML = `<div class="empty-state">لا توجد رسائل</div>`;
      chatSubtitleEl.textContent = "0 messages";
      return;
    }

    messages.forEach((msg) => appendMessageToUI(msg));
    chatSubtitleEl.textContent = `${sessionId} • messages ${messages.length}`;
    scrollMessagesToBottom();
  } catch (error) {
    messagesEl.innerHTML = `<div class="error-state">فشل تحميل الرسائل</div>`;
    chatSubtitleEl.textContent = "Load failed";
    console.error(error);
  }
}

function normalizeMessage(msg) {
  const messageObj = msg?.message || msg || {};

  let whatsappPayload =
    messageObj.whatsapp_payload ||
    msg?.whatsapp_payload ||
    null;

  if (typeof whatsappPayload === "string") {
    try {
      whatsappPayload = JSON.parse(whatsappPayload);
    } catch (e) {
      whatsappPayload = null;
    }
  }

  const messageKind =
    messageObj.message_kind ||
    msg?.message_kind ||
    messageObj.messageKind ||
    msg?.messageKind ||
    messageObj.whatsapp_message?.type ||
    msg?.whatsapp_message?.type ||
    "text";

  const whatsappMessage =
    messageObj.whatsapp_message ||
    msg?.whatsapp_message ||
    null;

  let mediaValue =
    messageObj.media ||
    msg?.media ||
    messageObj.mediaUrl ||
    msg?.mediaUrl ||
    messageObj.media_url ||
    msg?.media_url ||
    null;

  if (!mediaValue && whatsappMessage) {
    if (messageKind === "image") {
      mediaValue =
        whatsappMessage.image?.url ||
        whatsappMessage.image?.link ||
        null;
    } else if (messageKind === "video") {
      mediaValue =
        whatsappMessage.video?.url ||
        whatsappMessage.video?.link ||
        null;
    } else if (messageKind === "audio") {
      mediaValue =
        whatsappMessage.audio?.url ||
        whatsappMessage.audio?.link ||
        null;
    } else if (messageKind === "document") {
      mediaValue =
        whatsappMessage.document?.url ||
        whatsappMessage.document?.link ||
        null;
    }
  }

  return {
    ...messageObj,

    type:
      messageObj.type ||
      msg?.type ||
      "",

    content:
      messageObj.content ||
      msg?.content ||
      "",

    message_kind: String(messageKind).toLowerCase(),

    media: mediaValue,

    media_url:
      messageObj.media_url ||
      msg?.media_url ||
      messageObj.mediaUrl ||
      msg?.mediaUrl ||
      (typeof mediaValue === "string" ? mediaValue : mediaValue?.url) ||
      "",

    wa_message_id:
      messageObj.wa_message_id ||
      msg?.wa_message_id ||
      whatsappMessage?.id ||
      messageObj.whatsapp_message_id ||
      msg?.whatsapp_message_id ||
      messageObj.message_id ||
      msg?.message_id ||
      "",

    whatsapp_message: whatsappMessage,

    interactive:
      messageObj.interactive ||
      msg?.interactive ||
      null,

    whatsapp_payload: whatsappPayload,

    reply_to:
      messageObj.reply_to ||
      msg?.reply_to ||
      null,

    reaction:
      messageObj.reaction ||
      msg?.reaction ||
      null
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
  const messageKind = String(
    messageObj.message_kind || "text"
  ).toLowerCase().trim();

  const reactionEmoji =
    messageObj.reaction?.emoji ||
    "";

  // منع تكرار رسالة الـ agent بعد optimistic render
  if (rawType === "agent" && content) {
    const lastBubble = messagesEl.lastElementChild;
    const lastPending = lastBubble?.dataset?.pendingAgent === "true";
    const lastContent = lastBubble?.dataset?.pendingContent || "";

    if (lastPending && lastContent === content) {
      delete lastBubble.dataset.pendingAgent;
      delete lastBubble.dataset.pendingContent;
      return;
    }
  }

  let mediaUrl = "";

  if (typeof messageObj.media === "string") {
    mediaUrl = messageObj.media;
  } else if (messageObj.media?.url) {
    mediaUrl = messageObj.media.url;
  } else if (messageObj.media_url) {
    mediaUrl = messageObj.media_url;
  } else if (messageObj.mediaUrl) {
    mediaUrl = messageObj.mediaUrl;
  }

  if (
    mediaUrl &&
    mediaUrl.startsWith("http://wadashboardapi.almehrab.org")
  ) {
    mediaUrl = mediaUrl.replace("http://", "https://");
  }

  const media = mediaUrl ? { url: mediaUrl } : null;
  const buttons = extractButtons(messageObj);

  if (
    !content &&
    messageKind === "text" &&
    !buttons.length &&
    !media?.url
  ) {
    return;
  }

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

  wrap.dataset.messageType = messageType;
  wrap.dataset.messageContent = content;
  wrap.dataset.messageKind = messageKind;

  const realWaMessageId =
    messageObj.wa_message_id ||
    messageObj.whatsapp_message?.id ||
    messageObj.message_id ||
    messageObj.whatsapp_message_id ||
    messageObj.id ||
    "";

  messageObj.wa_message_id = realWaMessageId;
  wrap.dataset.waMessageId = realWaMessageId;

  if (realWaMessageId) {
    wrap.setAttribute("data-wa-message-id", realWaMessageId);
  }

  enableReplyGesture(wrap, messageObj, messageType);

if (messageType === "user" && realWaMessageId) {
  const actionsButton = document.createElement("button");

  actionsButton.type = "button";
  actionsButton.className = "message-options-trigger";
  actionsButton.textContent = "⋮";
  actionsButton.setAttribute("aria-label", "خيارات الرسالة");

  actionsButton.addEventListener("click", (e) => {
    e.stopPropagation();

    showMessageOptionsMenu(
      messageObj,
      messageType,
      actionsButton
    );
  });

  wrap.appendChild(actionsButton);
}
  
  if (messageType === "agent" || messageType === "ai") {
    const label = document.createElement("div");
    label.className = `message-label ${messageType}`;
    label.textContent =
      messageType === "agent" ? "Agent" : "AI";

    bubble.appendChild(label);
  }

  if (messageKind === "image" && media?.url) {
    const img = document.createElement("img");

    img.src = media.url;
    img.alt = "image";
    img.loading = "lazy";

    img.style.display = "block";
    img.style.maxWidth = "240px";
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "8px";
    img.style.marginBottom = content ? "6px" : "0";

    img.onerror = () => {
      console.error("Image failed:", media.url);
      img.remove();

      const fallback = document.createElement("a");
      fallback.href = media.url;
      fallback.target = "_blank";
      fallback.textContent = "فتح الصورة";
      fallback.style.color = "#53bdeb";

      bubble.appendChild(fallback);
    };

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

  if (messageKind === "audio" && media?.url) {
  const audio = document.createElement("audio");

  audio.src = media.url;
  audio.controls = true;
  audio.preload = "metadata";

  audio.style.display = "block";
  audio.style.width = "260px";
  audio.style.maxWidth = "100%";
  audio.style.marginBottom = content ? "6px" : "0";

  audio.onerror = () => {
    console.error("Audio failed:", media.url);

    audio.remove();

    const fallback = document.createElement("a");
    fallback.href = media.url;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.textContent = "فتح الرسالة الصوتية";
    fallback.style.color = "#53bdeb";

    bubble.appendChild(fallback);
  };

  bubble.appendChild(audio);
}

  if (messageObj.reply_to?.content) {
    const replyBox = document.createElement("div");
    replyBox.className = "quoted-reply-box";

    replyBox.dataset.replyTargetId =
      messageObj.reply_to.wa_message_id || "";

    replyBox.style.cursor = "pointer";

    const replyName = document.createElement("div");
    replyName.className = "quoted-reply-name";
    replyName.textContent =
      messageObj.reply_to.type === "user"
        ? "العميل"
        : "أنت";

    const replyText = document.createElement("div");
    replyText.className = "quoted-reply-text";
    replyText.textContent =
      messageObj.reply_to.content || "";

    replyBox.appendChild(replyName);
    replyBox.appendChild(replyText);
    bubble.appendChild(replyBox);

    replyBox.addEventListener("click", (e) => {
      e.stopPropagation();

      const targetId = replyBox.dataset.replyTargetId;
      if (!targetId) return;

      const target = messagesEl.querySelector(
        `[data-wa-message-id="${CSS.escape(targetId)}"]`
      );

      if (!target) return;

      target.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      target.classList.add("message-highlight");

      setTimeout(() => {
        target.classList.remove("message-highlight");
      }, 1200);
    });
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
    listBtn.textContent =
      "☰ " + (listData.button || "اختار");

    listWrap.appendChild(listBtn);
    bubble.appendChild(listWrap);
  }

  const productListData =
    messageObj.interactive?.product_list ||
    messageObj.whatsapp_payload?.interactive ||
    null;

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
    title.textContent =
      productListData.header || "منتجات";

    const count = document.createElement("div");
    count.className = "wa-product-count";
    count.textContent = `items ${
      productListData.sections?.reduce(
        (acc, section) =>
          acc + (section.product_items?.length || 0),
        0
      ) || 0
    }`;

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

  if (reactionEmoji) {
  wrap.dataset.currentReaction = reactionEmoji;

  const badge = document.createElement("div");
  badge.className = "message-reaction";
  badge.textContent = reactionEmoji;

  bubble.appendChild(badge);
} else {
  wrap.dataset.currentReaction = "";
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
     headers: getAuthHeaders({
  "Content-Type": "application/json"
}),
      body: JSON.stringify({
  sessionId: activeSessionId,
  message,
  replyTo: selectedReplyMessage
})
    });

    if (!res.ok) throw new Error("فشل الإرسال");

    messageInputEl.value = "";
    clearSelectedReply();
    loadConversations();

  } catch (error) {
    console.error(error);
    alert("خطأ في الإرسال");
  } finally {
    sendBtnEl.disabled = false;
    messageInputEl.disabled = false;
    messageInputEl.focus();
  }
}

async function sendReactionFromDashboard(messageId, emoji) {
  if (!activeSessionId || !messageId) return;

  if (typeof emoji !== "string") return;

  try {
    const res = await fetch(`${API_BASE}/send-message`, {
      method: "POST",
      headers: getAuthHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        sessionId: activeSessionId,
        messageKind: "reaction",
        messageId,
        emoji
      })
    });

    if (!res.ok) {
      throw new Error("فشل إرسال الريأكشن");
    }
  } catch (error) {
    console.error(error);
    alert("خطأ في إرسال الريأكشن");
  }
}

let eventSource = null;

function connectEvents() {
  if (!authToken) return;

  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource(
    `${API_BASE}/events?token=${encodeURIComponent(authToken)}`
  );

  eventSource.onmessage = function (event) {
    let data = {};

    try {
      data = JSON.parse(event.data);
    } catch (e) {
      return;
    }

    const currentSession = String(activeSessionId || "").trim();
    const eventSession = String(data.sessionId || "").trim();

    if (currentSession === eventSession) {
      const conv = conversationsData.find(c => c.session_id === currentSession);

      if (conv) {
        chatTitleEl.textContent = conv.customer_name || "عميل";
        chatSubtitleEl.textContent = currentSession;
      }
    }

    if (data.type === "user_message") {
      if (currentSession === eventSession) {
        removeAiTypingIndicator();
        loadMessages(currentSession);
      }

      updateConversationPreview();
      return;
    }

    if (data.type === "ai_typing") {
      if (currentSession === eventSession) {
        showAiTypingIndicator();
      }

      return;
    }

if (data.type === "reaction") {
  const messageWrap = messagesEl.querySelector(
    `[data-wa-message-id="${CSS.escape(data.messageId)}"]`
  );

  if (messageWrap) {
    const target = messageWrap.querySelector(".message");
    let badge = target?.querySelector(".message-reaction");

    const emoji = String(data.emoji || "");

    // حفظ الريأكت الحالي عشان نعرف إن الضغط الثاني إزالة
    messageWrap.dataset.currentReaction = emoji;

    if (!emoji) {
      // إزالة الريأكت
      if (badge) {
        badge.remove();
      }
    } else {
      // إضافة أو تغيير الريأكت
      if (!badge && target) {
        badge = document.createElement("div");
        badge.className = "message-reaction";
        target.appendChild(badge);
      }

      if (badge) {
        badge.textContent = emoji;
      }
    }
  }

  return;
}
    
    if (data.type === "new_message") {
      if (data.content === "__image__") {
        if (currentSession === eventSession) {
          removeAiTypingIndicator();
          loadMessages(activeSessionId);
        }

        updateConversationPreview();
        return;
      }

      if (currentSession === eventSession) {
        removeAiTypingIndicator();

        appendRealtimeMessage({
          type: data.messageType || "ai",
          content: data.content || "",
          message_kind: data.messageKind || data.message_kind || "text",
          media: data.mediaUrl || data.media_url || data.media || null,
          interactive: data.interactive || null,
          whatsapp_payload: data.whatsapp_payload || null,

          wa_message_id:
            data.wa_message_id ||
            data.message_id ||
            data.whatsapp_message_id ||
            data.whatsapp_message?.id ||
            "",

          whatsapp_message: data.whatsapp_message || null,
          reply_to: data.reply_to || null
        });
      }

      updateConversationPreview();
      return;
    }
  };
}


function appendRealtimeMessage(messageObj) {
  removeAiTypingIndicator();

  appendMessageToUI({
    type: messageObj.type,
    content: messageObj.content || "",
    message_kind: messageObj.message_kind || messageObj.messageKind || "text",
    media: messageObj.media || messageObj.mediaUrl || messageObj.media_url || null,
    interactive: messageObj.interactive || null,
    whatsapp_payload: messageObj.whatsapp_payload || null,

    wa_message_id:
      messageObj.wa_message_id ||
      messageObj.message_id ||
      messageObj.whatsapp_message_id ||
      messageObj.whatsapp_message?.id ||
      "",

    whatsapp_message: messageObj.whatsapp_message || null,
    reply_to: messageObj.reply_to || null,
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
  const isMobile = window.innerWidth < 900;

  if (isMobile && e.key === "Enter") {
    return;
  }

  if (!isMobile && e.key === "Enter" && (e.shiftKey || e.altKey)) {
    e.preventDefault();

    const start = messageInputEl.selectionStart;
    const end = messageInputEl.selectionEnd;
    const value = messageInputEl.value;

    messageInputEl.value =
      value.substring(0, start) + "\n" + value.substring(end);

    messageInputEl.selectionStart = messageInputEl.selectionEnd = start + 1;
    return;
  }

  if (!isMobile && e.key === "Enter") {
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
  cache: "no-store",
  headers: getAuthHeaders()
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
      headers: getAuthHeaders({
  "Content-Type": "application/json"
}),
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

function showMessageOptionsMenu(
  messageObj,
  messageType,
  triggerButton
) {
  document.querySelector(".message-options-menu")?.remove();
  document.querySelector(".message-actions-menu")?.remove();

  const menu = document.createElement("div");
  menu.className = "message-options-menu";

  const addOption = (icon, label, handler) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "message-option-item";

    button.innerHTML = `
      <span class="message-option-icon">${icon}</span>
      <span class="message-option-label">${label}</span>
    `;

    button.addEventListener("click", async (e) => {
      e.stopPropagation();
      menu.remove();
      await handler();
    });

    menu.appendChild(button);
  };

  addOption("😊", "ريأكت", () => {
    showMessageActions(messageObj, messageType);
  });

  addOption("↩", "رد", () => {
    selectReplyMessage(messageObj, messageType);
  });

  addOption("⧉", "نسخ النص", async () => {
    const text = String(messageObj.content || "").trim();

    if (!text) {
      alert("الرسالة لا تحتوي على نص");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
  });

  addOption("➤", "إعادة توجيه", () => {
    alert("هنضيف إعادة التوجيه في الخطوة التالية");
  });

  document.body.appendChild(menu);

  const rect = triggerButton.getBoundingClientRect();

  menu.style.position = "fixed";
  menu.style.zIndex = "10000";

  const menuWidth = 190;
  const menuHeight = 190;

  let left = rect.left - menuWidth + rect.width;
  let top = rect.bottom + 6;

  if (left < 8) left = 8;

  if (left + menuWidth > window.innerWidth - 8) {
    left = window.innerWidth - menuWidth - 8;
  }

  if (top + menuHeight > window.innerHeight - 8) {
    top = rect.top - menuHeight - 6;
  }

  menu.style.left = `${left}px`;
  menu.style.top = `${Math.max(8, top)}px`;

  setTimeout(() => {
    document.addEventListener(
      "click",
      () => menu.remove(),
      { once: true }
    );
  }, 0);
}

function showMessageActions(messageObj, messageType) {
  if (messageType !== "user") return;

  document.querySelector(".message-actions-menu")?.remove();

  const waMessageId =
    messageObj.wa_message_id ||
    messageObj.whatsapp_message?.id ||
    messageObj.message_id ||
    messageObj.whatsapp_message_id ||
    "";

  if (!waMessageId) return;

  const basicEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const moreEmojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😊",
    "😇", "🙂", "🙃", "😉", "😍", "🥰", "😘", "😎",
    "🤩", "🥳", "😋", "😜", "🤪", "🤔", "🫡", "🤗",
    "🤭", "🫢", "😐", "😑", "😶", "🙄", "😏", "😒",
    "😔", "😕", "☹️", "😣", "😖", "😫", "😩", "🥺",
    "😭", "😤", "😡", "🤬", "😱", "😨", "😰", "😓",
    "🤝", "👏", "🙌", "👌", "✌️", "🤞", "🤟", "🤘",
    "💪", "👊", "✋", "👋", "🫶", "💐", "🌹", "🔥",
    "⭐", "✨", "💯", "✅", "❌", "🎉", "🎊", "🎁"
  ];

  const menu = document.createElement("div");
  menu.className = "message-actions-menu";

  const basicRow = document.createElement("div");
  basicRow.className = "reaction-basic-row";

  const messageWrap = messagesEl.querySelector(
    `[data-wa-message-id="${CSS.escape(waMessageId)}"]`
  );

  const getCurrentReaction = () => {
    const badgeEmoji =
      messageWrap
        ?.querySelector(".message-reaction")
        ?.textContent
        ?.trim() || "";

    const datasetEmoji =
      messageWrap?.dataset.currentReaction || "";

    const objectEmoji =
      messageObj.reaction?.emoji || "";

    return badgeEmoji || datasetEmoji || objectEmoji || "";
  };

  const updateReactionLocally = (emoji) => {
    if (!messageWrap) return;

    const bubble = messageWrap.querySelector(".message");
    let badge = bubble?.querySelector(".message-reaction");

    messageWrap.dataset.currentReaction = emoji;

    if (!emoji) {
      badge?.remove();
      return;
    }

    if (!badge && bubble) {
      badge = document.createElement("div");
      badge.className = "message-reaction";
      bubble.appendChild(badge);
    }

    if (badge) {
      badge.textContent = emoji;
    }
  };

  const sendEmoji = async (emoji) => {
    const currentReaction = getCurrentReaction();

    const emojiToSend =
      currentReaction === emoji
        ? ""
        : emoji;

    menu.remove();

    updateReactionLocally(emojiToSend);

    await sendReactionFromDashboard(
      waMessageId,
      emojiToSend
    );
  };

  basicEmojis.forEach((emoji) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = emoji;

    button.addEventListener("click", async (e) => {
      e.stopPropagation();
      await sendEmoji(emoji);
    });

    basicRow.appendChild(button);
  });

  const moreButton = document.createElement("button");
  moreButton.type = "button";
  moreButton.className = "reaction-more-button";
  moreButton.textContent = "+";

  basicRow.appendChild(moreButton);
  menu.appendChild(basicRow);

  const morePanel = document.createElement("div");
  morePanel.className = "reaction-more-panel";
  morePanel.hidden = true;

  moreEmojis.forEach((emoji) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = emoji;

    button.addEventListener("click", async (e) => {
      e.stopPropagation();
      await sendEmoji(emoji);
    });

    morePanel.appendChild(button);
  });

  moreButton.addEventListener("click", (e) => {
    e.stopPropagation();

    morePanel.hidden = !morePanel.hidden;
    moreButton.textContent = morePanel.hidden ? "+" : "×";
  });

  menu.appendChild(morePanel);

  const replyButton = document.createElement("button");
  replyButton.type = "button";
  replyButton.className = "message-action-reply";
  replyButton.textContent = "↩ رد";

  replyButton.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.remove();
    selectReplyMessage(messageObj, messageType);
  });

  menu.appendChild(replyButton);
  document.body.appendChild(menu);

  setTimeout(() => {
    document.addEventListener(
      "click",
      () => menu.remove(),
      { once: true }
    );
  }, 0);
}

function selectReplyMessage(messageObj, messageType) {
  if (messageType !== "user") return;

  const waMessageId =
    messageObj.wa_message_id ||
    messageObj.whatsapp_message?.id ||
    messageObj.message_id ||
    messageObj.whatsapp_message_id ||
    "";

  const messageKind = messageObj.message_kind || "text";

  let content = messageObj.content || "";

  if (!content) {
    if (messageKind === "image") content = "📷 صورة";
    else if (messageKind === "video") content = "🎥 فيديو";
    else if (messageKind === "audio") content = "🎙️ رسالة صوتية";
    else if (messageKind === "document") content = "📄 ملف";
    else content = "رسالة";
  }

  selectedReplyMessage = {
    type: "user",
    content,
    message_kind: messageKind,
    wa_message_id: waMessageId
  };

  renderReplyBar();
  messageInputEl.focus();
}

function clearSelectedReply() {
  selectedReplyMessage = null;
  renderReplyBar();
}

function renderReplyBar() {
  let existing = document.getElementById("replyBar");
  if (existing) existing.remove();

  if (!selectedReplyMessage) return;

  const replyBar = document.createElement("div");
  replyBar.id = "replyBar";
  replyBar.className = "reply-bar";

  replyBar.innerHTML = `
    <div class="reply-bar-content">
      <div class="reply-bar-title">رد على العميل</div>
      <div class="reply-bar-text">${escapeHtml(selectedReplyMessage.content || "")}</div>
    </div>
    <button type="button" class="reply-bar-close">×</button>
  `;

  replyBar.querySelector(".reply-bar-close").addEventListener("click", clearSelectedReply);

  const compose = document.querySelector(".chat-compose");
  compose.parentNode.insertBefore(replyBar, compose);
}

function enableReplyGesture(wrap, messageObj, messageType) {
  if (messageType !== "user") return;

  wrap.style.cursor = "pointer";

  let pressTimer = null;
  let startX = 0;
  let startY = 0;
  let didSelect = false;

  const select = () => {
  if (didSelect) return;
  didSelect = true;

  showMessageActions(messageObj, messageType);

  wrap.classList.add("reply-swipe-active");

  setTimeout(() => {
    wrap.classList.remove("reply-swipe-active");
  }, 200);
};

  // Desktop click
  wrap.addEventListener("click", () => {
    select();
  });

  // Desktop right click
  wrap.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    select();
  });

  // Mobile long press
  wrap.addEventListener("touchstart", (e) => {
    didSelect = false;

    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;

    pressTimer = setTimeout(() => {
      select();
    }, 450);
  }, { passive: true });

  wrap.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (Math.abs(dx) > 45 && Math.abs(dy) < 25) {
      clearTimeout(pressTimer);
      select();
    }

    if (Math.abs(dy) > 30) {
      clearTimeout(pressTimer);
    }
  }, { passive: true });

  wrap.addEventListener("touchend", () => {
    clearTimeout(pressTimer);
  });

  wrap.addEventListener("touchcancel", () => {
    clearTimeout(pressTimer);
  });
}

if (toggleAiBtnEl) {
  toggleAiBtnEl.addEventListener("click", toggleAiStatus);
}

async function login() {
  loginErrorEl.textContent = "";

  const username = loginUsernameEl.value.trim();
  const password = loginPasswordEl.value;

  if (!username || !password) {
    loginErrorEl.textContent = "ادخل البيانات";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
      loginErrorEl.textContent = "بيانات الدخول غير صحيحة";
      return;
    }

    authToken = data.token;

    localStorage.setItem("dashboard_token", authToken);

    hideLogin();

    connectEvents();
    loadConversations();

  } catch (err) {
    console.error(err);
    loginErrorEl.textContent = "فشل تسجيل الدخول";
  }
}

loginBtnEl?.addEventListener("click", login);

if (authToken) {
  hideLogin();
  connectEvents();
} else {
  showLogin();
}

if (authToken) {
  loadConversations();
}
if (appEl && window.innerWidth > 900) {
  appEl.classList.remove("chat-open");
}

if (attachBtnEl && mediaInputEl) {
  attachBtnEl.addEventListener("click", () => {
    mediaInputEl.click();
  });
}
async function normalizeImageFile(file) {
  if (!file.type.startsWith("image/")) return file;

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return resolve(file);

        resolve(
          new File(
            [blob],
            file.name.replace(/\.(jpg|jpeg|png|webp)$/i, ".jpg"),
            { type: "image/jpeg" }
          )
        );
      },
      "image/jpeg",
      0.92
    );
  });
}

function appendPendingMedia(file, caption = "") {
  const url = URL.createObjectURL(file);
  const messageKind = file.type.startsWith("video/") ? "video" : "image";

  const wrap = document.createElement("div");
  wrap.className = "message-wrap agent";
  wrap.dataset.pendingUpload = "true";

  const bubble = document.createElement("div");
  bubble.className = "message agent";
  bubble.style.position = "relative";

  const label = document.createElement("div");
  label.className = "message-label agent";
  label.textContent = "Agent";
  bubble.appendChild(label);

  if (messageKind === "image") {
    const img = document.createElement("img");
    img.src = url;
    img.style.display = "block";
    img.style.maxWidth = "240px";
    img.style.width = "100%";
    img.style.borderRadius = "8px";
    bubble.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.style.display = "block";
    video.style.maxWidth = "240px";
    video.style.width = "100%";
    video.style.borderRadius = "8px";
    bubble.appendChild(video);
  }

  if (caption) {
    const textEl = document.createElement("div");
    textEl.className = "message-text";
    textEl.textContent = caption;
    bubble.appendChild(textEl);
  }

  const overlay = document.createElement("div");
  overlay.className = "upload-overlay";
  overlay.textContent = "جاري الإرسال...";
  bubble.appendChild(overlay);

  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  scrollMessagesToBottom();

  return {
    done() {
      overlay.textContent = "تم الإرسال";
      setTimeout(() => {
        wrap.remove();
        URL.revokeObjectURL(url);
      }, 500);
    },
    fail() {
      overlay.textContent = "فشل الإرسال";
      overlay.classList.add("failed");
    }
  };
}
if (mediaInputEl) {
  mediaInputEl.addEventListener("change", async () => {
    const files = Array.from(mediaInputEl.files || []);
    alert("عدد الملفات المختارة: " + files.length);

if (!files.length) return;

if (files.length > 15) {
  alert("الحد الأقصى 15 ملف مرة واحدة");
  mediaInputEl.value = "";
  return;
}

    if (!activeSessionId) {
      alert("اختر محادثة أولًا");
      mediaInputEl.value = "";
      return;
    }
const maxVideoSize = 15 * 1024 * 1024;
const caption = messageInputEl.value.trim();

sendBtnEl.disabled = true;
attachBtnEl.disabled = true;

try {
  for (const originalFile of files) {

  const file = await normalizeImageFile(originalFile);
    const pending = appendPendingMedia(file, caption);

    if (file.type.startsWith("video/") && file.size > maxVideoSize) {
      alert(`الفيديو ${file.name} كبير جدًا. اختار فيديو أقل من 15 ميجا.`);
      continue;
    }

    const messageKind = file.type.startsWith("video/") ? "video" : "image";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", activeSessionId);
    formData.append("caption", caption);
    formData.append("messageKind", messageKind);

    await new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();

  xhr.open("POST", `${API_BASE}/send-media`);

  xhr.upload.onprogress = (event) => {
    if (!event.lengthComputable) return;

    const percent = Math.round((event.loaded / event.total) * 100);
    setUploadProgress(percent);
  };

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      
      pending.done();
      resolve();
    } else {
      reject(new Error("Failed to send media"));
    }
  };

  xhr.onerror = () => reject(new Error("Upload error"));

  xhr.send(formData);
});
  }

  messageInputEl.value = "";
  mediaInputEl.value = "";
} catch (err) {
  console.error(err);
  pending?.fail?.();
  alert("فشل إرسال الميديا");
} finally {
  sendBtnEl.disabled = false;
  attachBtnEl.disabled = false;
  messageInputEl.focus();
}  });
}
