const API_BASE = "https://wadashboardapi.almehrab.org/api";

document.addEventListener(
  "gesturestart",
  (event) => event.preventDefault(),
  { passive: false }
);
const chatNameEl = document.getElementById("chatName");
const appEl = document.getElementById("mobileApp");
const conversationsEl = document.getElementById("conversations");
const messagesEl = document.getElementById("messages");
const chatTitleEl = document.getElementById("chatTitle");
const chatSubtitleEl = document.getElementById("chatSubtitle");
const chatHeaderTextEl = document.querySelector(".chat-header-text");
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
const recordAudioBtnEl = document.getElementById("recordAudioBtn");
const voiceRecordingBarEl =
  document.getElementById("voiceRecordingBar");

const voiceRecordingTimeEl =
  document.getElementById("voiceRecordingTime");
const cancelAudioRecordingBtnEl =
  document.getElementById("cancelAudioRecordingBtn");

const sendAudioRecordingBtnEl =
  document.getElementById("sendAudioRecordingBtn");
const emojiBtnEl = document.getElementById("emojiBtn");
const emojiPickerPanelEl =
  document.getElementById("emojiPickerPanel");
const emojiPickerEl =
  emojiPickerPanelEl?.querySelector("emoji-picker");

function resizeMessageInput() {
  if (!messageInputEl) return;

  const minHeight = 48;
  const maxHeight = 120;

  messageInputEl.style.height = "auto";
  const nextHeight = Math.min(
    Math.max(messageInputEl.scrollHeight, minHeight),
    maxHeight
  );

  messageInputEl.style.height = `${nextHeight}px`;
  messageInputEl.style.overflowY =
    messageInputEl.scrollHeight > maxHeight ? "auto" : "hidden";
}

messageInputEl?.addEventListener("input", resizeMessageInput);

function closeEmojiPicker() {
  emojiPickerPanelEl?.classList.add("hidden");
}

emojiBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  emojiPickerPanelEl?.classList.toggle("hidden");
});

emojiPickerPanelEl?.addEventListener("click", (event) => {
  event.stopPropagation();
});

emojiPickerEl?.addEventListener("emoji-click", (event) => {
  const emoji = event.detail?.unicode || "";
  if (!emoji || !messageInputEl) return;

  const start = messageInputEl.selectionStart ?? messageInputEl.value.length;
  const end = messageInputEl.selectionEnd ?? start;

  messageInputEl.setRangeText(emoji, start, end, "end");
  messageInputEl.dispatchEvent(new Event("input", { bubbles: true }));
  messageInputEl.focus();
});

document.addEventListener("click", closeEmojiPicker);
let currentAiEnabled = true;

let conversationsData = [];
let activeSessionId = null;
let currentLoadedMessageCount = 0;
let oldestLoadedMessageId = null;
let hasMoreMessages = false;
let isLoadingOlderMessages = false;
let activeMediaUploadCount = 0;
let suppressLocalMediaEventsUntil = 0;
const localMediaPreviewUrls = new Set();
let mediaViewerEl = null;
let mediaGalleryEl = null;

function closeMediaViewer(useHistory = true) {
  if (!mediaViewerEl) return;

  if (useHistory && history.state?.mediaViewer === true) {
    history.back();
    return;
  }

  mediaViewerEl.remove();
  mediaViewerEl = null;
  document.body.classList.remove("media-viewer-open");
}

function openMediaViewer(imageUrl, altText = "صورة") {
  if (!imageUrl) return;

  closeMediaViewer(false);

  const viewer = document.createElement("div");
  viewer.className = "media-viewer";
  viewer.innerHTML = `
    <button class="media-viewer-close" type="button" aria-label="إغلاق">×</button>
    <img class="media-viewer-image" alt="${escapeHtml(altText)}" />
  `;

  const viewerImage = viewer.querySelector(".media-viewer-image");
  viewerImage.src = imageUrl;
  viewerImage.draggable = false;

  const pointers = new Map();
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  let panStartX = 0;
  let panStartY = 0;
  let panOriginX = 0;
  let panOriginY = 0;

  const renderTransform = () => {
    viewerImage.style.transform =
      `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
  };

  const getPointerDistance = () => {
    const points = Array.from(pointers.values());
    if (points.length < 2) return 0;

    return Math.hypot(
      points[0].x - points[1].x,
      points[0].y - points[1].y
    );
  };

  viewerImage.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    viewerImage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1) {
      panStartX = event.clientX;
      panStartY = event.clientY;
      panOriginX = translateX;
      panOriginY = translateY;
    } else if (pointers.size === 2) {
      pinchStartDistance = getPointerDistance();
      pinchStartScale = scale;
    }
  });

  viewerImage.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;

    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      const distance = getPointerDistance();

      if (pinchStartDistance > 0) {
        scale = Math.min(
          5,
          Math.max(1, pinchStartScale * (distance / pinchStartDistance))
        );

        if (scale === 1) {
          translateX = 0;
          translateY = 0;
        }

        renderTransform();
      }
    } else if (pointers.size === 1 && scale > 1) {
      translateX = panOriginX + (event.clientX - panStartX);
      translateY = panOriginY + (event.clientY - panStartY);
      renderTransform();
    }
  });

  const releasePointer = (event) => {
    pointers.delete(event.pointerId);

    if (pointers.size === 1) {
      const point = Array.from(pointers.values())[0];
      panStartX = point.x;
      panStartY = point.y;
      panOriginX = translateX;
      panOriginY = translateY;
    }
  };

  viewerImage.addEventListener("pointerup", releasePointer);
  viewerImage.addEventListener("pointercancel", releasePointer);

  viewerImage.addEventListener("dblclick", () => {
    scale = scale > 1 ? 1 : 2;

    if (scale === 1) {
      translateX = 0;
      translateY = 0;
    }

    renderTransform();
  });
  viewer.querySelector(".media-viewer-close").addEventListener(
    "click",
    () => closeMediaViewer()
  );

  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) closeMediaViewer();
  });

  document.body.appendChild(viewer);
  document.body.classList.add("media-viewer-open");
  mediaViewerEl = viewer;

  history.pushState(
    { ...(history.state || {}), mediaViewer: true },
    ""
  );
}

function closeMediaGallery(useHistory = true) {
  if (!mediaGalleryEl) return;

  if (useHistory && history.state?.mediaGallery === true) {
    history.back();
    return;
  }

  mediaGalleryEl.remove();
  mediaGalleryEl = null;
  document.body.classList.remove("media-gallery-open");
}

async function openChatMediaGallery() {
  if (!activeSessionId || mediaGalleryEl) return;

  const gallery = document.createElement("div");
  gallery.className = "media-gallery";
  gallery.innerHTML = `
    <div class="media-gallery-sheet">
      <header class="media-gallery-header">
        <button class="media-gallery-close" type="button" aria-label="إغلاق">×</button>
        <div>
          <div class="media-gallery-title">وسائط المحادثة</div>
          <div class="media-gallery-subtitle">جاري التحميل...</div>
        </div>
      </header>
      <div class="media-gallery-grid">
        <div class="media-gallery-loading">جاري تحميل الميديا...</div>
      </div>
    </div>
  `;

  gallery.querySelector(".media-gallery-close").addEventListener(
    "click",
    () => closeMediaGallery()
  );
  gallery.addEventListener("click", (event) => {
    if (event.target === gallery) closeMediaGallery();
  });

  document.body.appendChild(gallery);
  document.body.classList.add("media-gallery-open");
  mediaGalleryEl = gallery;

  history.pushState(
    { ...(history.state || {}), mediaGallery: true },
    ""
  );

  try {
    const response = await fetch(
      `${API_BASE}/media/${encodeURIComponent(activeSessionId)}`,
      {
        cache: "no-store",
        headers: getAuthHeaders()
      }
    );

    if (handleInvalidToken(response)) return;
    if (!response.ok) throw new Error("Failed media gallery");

    const mediaItems = await response.json();
    if (gallery !== mediaGalleryEl) return;

    const subtitle = gallery.querySelector(".media-gallery-subtitle");
    const grid = gallery.querySelector(".media-gallery-grid");

    subtitle.textContent = `${mediaItems.length} ملف`;
    grid.innerHTML = "";

    if (!mediaItems.length) {
      grid.innerHTML = `<div class="media-gallery-empty">لا توجد صور أو فيديوهات</div>`;
      return;
    }

    const createMediaCard = (item) => {
      const card = document.createElement("article");
      card.className = `media-gallery-card ${item.message_kind}`;

      const preview = document.createElement("div");
      preview.className = "media-gallery-preview";

      if (item.message_kind === "image") {
        const image = document.createElement("img");
        const thumbnailUrl = buildThumbnailUrl(item.media_url);

        image.src = thumbnailUrl || item.media_url;
        image.alt = item.content || "صورة";
        image.loading = "lazy";
        image.dataset.fullSrc = item.media_url;
        image.onerror = () => {
          if (!image.dataset.triedFullSource) {
            image.dataset.triedFullSource = "true";
            image.src = item.media_url;
          }
        };

        image.addEventListener("click", () => {
          openMediaViewer(item.media_url, image.alt);
        });

        preview.appendChild(image);
      } else {
        const playButton = document.createElement("button");
        playButton.type = "button";
        playButton.className = "media-gallery-video-play";
        playButton.innerHTML = `<span>▶</span><small>تشغيل الفيديو</small>`;

        playButton.addEventListener("click", () => {
          const video = document.createElement("video");
          video.src = item.media_url;
          video.controls = true;
          video.autoplay = true;
          video.preload = "metadata";
          video.playsInline = true;
          preview.replaceChildren(video);
        });

        preview.appendChild(playButton);
      }

      const meta = document.createElement("div");
      meta.className = "media-gallery-meta";
      meta.textContent = formatMessageTimestamp(item.created_at);

      card.appendChild(preview);
      card.appendChild(meta);
      return card;
    };

    const batchSize = 36;
    let renderedCount = 0;
    let renderingBatch = false;

    const renderNextBatch = () => {
      if (renderingBatch || renderedCount >= mediaItems.length) return;
      renderingBatch = true;

      requestAnimationFrame(() => {
        const fragment = document.createDocumentFragment();
        const end = Math.min(
          renderedCount + batchSize,
          mediaItems.length
        );

        for (let index = renderedCount; index < end; index += 1) {
          fragment.appendChild(createMediaCard(mediaItems[index]));
        }

        grid.appendChild(fragment);
        renderedCount = end;
        renderingBatch = false;
      });
    };

    grid.addEventListener("scroll", () => {
      const remaining =
        grid.scrollHeight - grid.scrollTop - grid.clientHeight;

      if (remaining < 500) renderNextBatch();
    });

    renderNextBatch();
  } catch (error) {
    console.error(error);

    if (gallery === mediaGalleryEl) {
      gallery.querySelector(".media-gallery-grid").innerHTML =
        `<div class="media-gallery-empty">فشل تحميل الميديا</div>`;
    }
  }
}

chatHeaderTextEl?.setAttribute("role", "button");
chatHeaderTextEl?.setAttribute("tabindex", "0");
chatHeaderTextEl?.addEventListener("click", openChatMediaGallery);
chatHeaderTextEl?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openChatMediaGallery();
  }
});

messagesEl.addEventListener("click", (event) => {
  const image = event.target.closest(".message img");
  if (!image) return;

  event.stopPropagation();
  openMediaViewer(
    image.dataset.fullSrc || image.currentSrc || image.src,
    image.alt || "صورة"
  );
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mediaViewerEl) {
    closeMediaViewer();
  }
});
let typingIndicatorTimeout = null;
let selectedReplyMessage = null;
let longPressTimer = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecordingAudio = false;
let recordingStream = null;

let recordingStartedAt = 0;
let recordingTimerInterval = null;

let recordingPointerId = null;
let recordingStartX = 0;
let recordingStartY = 0;

let recordingCancelled = false;
let recordingLocked = false;
let recordingPressTimer = null;
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
      const hasCachedConversation =
        messagesEl.dataset.loadedSessionId === conv.session_id &&
        messagesEl.childElementCount > 0;

      activeSessionId = conv.session_id;
      renderConversations(conversationsData);
      openChat();

      if (hasCachedConversation) {
        chatTitleEl.textContent = conv.customer_name || "عميل";
        renderChatMeta(conv.session_id, currentLoadedMessageCount);
      } else {
        loadMessages(conv.session_id);
      }

      loadAiStatus(conv.session_id);
      setTimeout(() => messageInputEl.focus(), 250);
      // chatNameEl.textContent = conv.customer_name || "عميل";
    });

    conversationsEl.appendChild(item);
  });
}

function openChat() {
  appEl.classList.add("chat-open");

  if (history.state?.chatOpen !== true) {
    history.pushState({ chatOpen: true }, "");
  }
}

function closeChat() {
  appEl.classList.remove("chat-open");
  removeAiTypingIndicator();
}

function renderChatMeta(sessionId, total) {
  const phone = document.createElement("span");
  phone.className = "chat-phone-number";
  phone.textContent = sessionId || "";

  const count = document.createElement("span");
  count.className = "chat-message-count";
  count.textContent = `عدد الرسائل: ${Number(total || 0)}`;

  chatSubtitleEl.replaceChildren(phone, count);
}

async function loadMessages(sessionId) {
  const conv = conversationsData.find(c => c.session_id === sessionId);

  delete messagesEl.dataset.loadedSessionId;
  chatTitleEl.textContent = conv?.customer_name || "عميل";
  renderChatMeta(sessionId, 0);
  oldestLoadedMessageId = null;
  hasMoreMessages = false;
  isLoadingOlderMessages = false;
  for (const url of localMediaPreviewUrls) {
    URL.revokeObjectURL(url);
  }
  localMediaPreviewUrls.clear();

  messagesEl.innerHTML = `<div class="loading-state">جاري تحميل الرسائل...</div>`;

  try {
    const res = await fetch(
      `${API_BASE}/messages/${encodeURIComponent(sessionId)}?limit=100`,
      {
        cache: "no-store",
        headers: getAuthHeaders()
      }
    );

    if (!res.ok) throw new Error("Failed messages");

    const data = await res.json();
    const messages = Array.isArray(data) ? data : (data.messages || []);

    messagesEl.innerHTML = "";
    currentLoadedMessageCount = Number(data.total ?? messages.length);
    oldestLoadedMessageId = data.nextBeforeId || messages[0]?.id || null;
    hasMoreMessages = Boolean(data.hasMore);
    renderChatMeta(sessionId, currentLoadedMessageCount);
    messagesEl.dataset.loadedSessionId = sessionId;

    if (!messages.length) {
      messagesEl.innerHTML = `<div class="empty-state">لا توجد رسائل</div>`;
      return;
    }

    messages.forEach((msg) => appendMessageToUI(msg));
    scrollMessagesToBottom();
  } catch (error) {
    messagesEl.innerHTML = `<div class="error-state">فشل تحميل الرسائل</div>`;
    console.error(error);
  }
}

async function loadOlderMessages() {
  if (
    !activeSessionId ||
    !hasMoreMessages ||
    isLoadingOlderMessages ||
    !oldestLoadedMessageId
  ) return;

  isLoadingOlderMessages = true;
  const previousScrollHeight = messagesEl.scrollHeight;

  const loader = document.createElement("div");
  loader.className = "older-messages-loader";
  loader.textContent = "جاري تحميل الرسائل الأقدم...";
  messagesEl.prepend(loader);

  try {
    const res = await fetch(
      `${API_BASE}/messages/${encodeURIComponent(activeSessionId)}` +
      `?limit=100&beforeId=${encodeURIComponent(oldestLoadedMessageId)}`,
      {
        cache: "no-store",
        headers: getAuthHeaders()
      }
    );

    if (!res.ok) throw new Error("Failed older messages");

    const data = await res.json();
    const olderMessages = data.messages || [];

    loader.remove();

    if (olderMessages.length) {
      const existingNodes = Array.from(messagesEl.childNodes);
      existingNodes.forEach((node) => node.remove());

      olderMessages.forEach((msg) => appendMessageToUI(msg));
      existingNodes.forEach((node) => messagesEl.appendChild(node));

      oldestLoadedMessageId =
        data.nextBeforeId || olderMessages[0]?.id || oldestLoadedMessageId;
      messagesEl.scrollTop = messagesEl.scrollHeight - previousScrollHeight;
    }

    hasMoreMessages = Boolean(data.hasMore);
    currentLoadedMessageCount = Number(data.total ?? currentLoadedMessageCount);
    renderChatMeta(activeSessionId, currentLoadedMessageCount);
  } catch (error) {
    loader.textContent = "تعذر تحميل الرسائل الأقدم";
    setTimeout(() => loader.remove(), 1800);
    console.error(error);
  } finally {
    isLoadingOlderMessages = false;
  }
}

messagesEl.addEventListener("scroll", () => {
  if (messagesEl.scrollTop <= 80) {
    loadOlderMessages();
  }
});

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

    thumbnail_url:
      messageObj.thumbnail_url ||
      msg?.thumbnail_url ||
      messageObj.thumbnailUrl ||
      msg?.thumbnailUrl ||
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
      null,

    agent_name:
      messageObj.agent_name ||
      msg?.agent_name ||
      messageObj.agentName ||
      msg?.agentName ||
      "",

    timestamp:
      messageObj.timestamp ||
      msg?.timestamp ||
      messageObj.created_at ||
      msg?.created_at ||
      null
  };
}

function buildThumbnailUrl(mediaUrl) {
  if (!mediaUrl) return "";

  try {
    const url = new URL(mediaUrl, window.location.origin);

    if (
      !url.pathname.startsWith("/uploads/") ||
      url.pathname.startsWith("/uploads/thumbs/")
    ) {
      return "";
    }

    const fileName = url.pathname.split("/").pop() || "";
    const baseName = fileName.replace(/\.[^.]+$/, "");
    if (!baseName) return "";

    url.pathname = `/uploads/thumbs/${baseName}.jpg`;
    url.search = "";
    url.hash = "";

    return url.toString();
  } catch (error) {
    return "";
  }
}

function parseMessageDate(value) {
  if (!value) return null;

  let normalized = value;

  if (/^\d+$/.test(String(value))) {
    const numeric = Number(value);
    normalized = numeric < 1e12 ? numeric * 1000 : numeric;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMessageTimestamp(value) {
  const date = parseMessageDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat("ar-EG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
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

    if (messageType === "agent") {
      const senderKey = String(messageObj.agent_name || "")
        .trim()
        .toLowerCase();

      if (senderKey === "admin") {
        label.classList.add("sender-admin");
      } else if (senderKey === "agent1") {
        label.classList.add("sender-agent1");
      }
    }

    label.textContent =
      messageType === "agent"
        ? (messageObj.agent_name || "Agent")
        : "AI";

    bubble.appendChild(label);
  }

  if (messageKind === "sticker" && media?.url) {
  const sticker = document.createElement("img");

  sticker.src = media.url;
  sticker.alt = "sticker";
  sticker.loading = "lazy";

  sticker.style.display = "block";
  sticker.style.width = "160px";
  sticker.style.maxWidth = "100%";
  sticker.style.height = "auto";
  sticker.style.objectFit = "contain";
  sticker.style.background = "transparent";
  sticker.style.borderRadius = "0";
  sticker.style.margin = "0";

  sticker.onerror = () => {
    console.error("Sticker failed:", media.url);
    sticker.remove();

    const fallback = document.createElement("a");
    fallback.href = media.url;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.textContent = "فتح الملصق";
    fallback.style.color = "#53bdeb";

    bubble.appendChild(fallback);
  };

  bubble.appendChild(sticker);
}
  
  if (messageKind === "image" && media?.url) {
    const img = document.createElement("img");

    const thumbnailUrl =
      messageObj.thumbnail_url ||
      buildThumbnailUrl(media.url);

    img.src = thumbnailUrl || media.url;
    img.dataset.fullSrc = media.url;
    img.alt = "image";
    img.loading = "lazy";

    img.style.display = "block";
    img.style.maxWidth = "240px";
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "8px";
    img.style.marginBottom = content ? "6px" : "0";

    img.onerror = () => {
      if (!img.dataset.triedFullSource) {
        img.dataset.triedFullSource = "true";
        img.src = media.url;
        return;
      }

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

  const formattedTimestamp = formatMessageTimestamp(messageObj.timestamp);

  if (formattedTimestamp) {
    const timestampEl = document.createElement("div");
    timestampEl.className = "message-timestamp";
    timestampEl.textContent = formattedTimestamp;

    const parsedDate = parseMessageDate(messageObj.timestamp);
    if (parsedDate) timestampEl.title = parsedDate.toLocaleString("ar-EG");

    bubble.appendChild(timestampEl);
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
    resizeMessageInput();
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
        renderChatMeta(currentSession, currentLoadedMessageCount);
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

    if (data.type === "refresh_messages") {
      if (currentSession === eventSession) {
        const labels = messagesEl.querySelectorAll(
          ".message-label.agent"
        );
        const latestLabel = labels[labels.length - 1];
        const senderName = String(data.agentName || "Agent");

        if (latestLabel) {
          latestLabel.textContent = senderName;
          latestLabel.classList.remove(
            "sender-admin",
            "sender-agent1"
          );

          if (senderName.toLowerCase() === "admin") {
            latestLabel.classList.add("sender-admin");
          } else if (senderName.toLowerCase() === "agent1") {
            latestLabel.classList.add("sender-agent1");
          }
        }
      }

      updateConversationPreview();
      return;
    }

    const realtimeMessageKind = String(
      data.messageKind || data.message_kind || ""
    ).toLowerCase();

    if (
      data.type === "new_message" &&
      currentSession === eventSession &&
      (
        activeMediaUploadCount > 0 ||
        Date.now() <= suppressLocalMediaEventsUntil
      ) &&
      data.messageType === "agent" &&
      ["image", "video"].includes(realtimeMessageKind)
    ) {
      updateConversationPreview();
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
          reply_to: data.reply_to || null,
          timestamp:
            data.timestamp ||
            data.created_at ||
            new Date().toISOString()
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
    timestamp:
      messageObj.timestamp ||
      messageObj.created_at ||
      new Date().toISOString(),
    message: messageObj
  });

  currentLoadedMessageCount += 1;
  if (activeSessionId) {
    renderChatMeta(activeSessionId, currentLoadedMessageCount);
  }
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
    resizeMessageInput();
    return;
  }

  if (!isMobile && e.key === "Enter") {
    e.preventDefault();
    sendMessageFromDashboard();
  }
});

backBtnEl.addEventListener("click", () => {
  if (history.state?.chatOpen === true) {
    history.back();
  } else {
    closeChat();
  }
});
refreshBtnEl.addEventListener("click", loadConversations);

window.addEventListener("popstate", () => {
  if (mediaViewerEl) {
    closeMediaViewer(false);
    return;
  }

  if (mediaGalleryEl) {
    closeMediaGallery(false);
    return;
  }

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

function getFrequentReactionEmojis() {
  const defaults = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  try {
    const usage = JSON.parse(
      localStorage.getItem("reaction_emoji_usage") || "{}"
    );

    const used = Object.entries(usage)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([emoji]) => emoji);

    return [...new Set([...used, ...defaults])].slice(0, 6);
  } catch (error) {
    return defaults;
  }
}

function rememberReactionEmoji(emoji) {
  if (!emoji) return;

  try {
    const usage = JSON.parse(
      localStorage.getItem("reaction_emoji_usage") || "{}"
    );

    usage[emoji] = Number(usage[emoji] || 0) + 1;
    localStorage.setItem("reaction_emoji_usage", JSON.stringify(usage));
  } catch (error) {
    console.warn("Could not save reaction emoji usage", error);
  }
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

  const basicEmojis = getFrequentReactionEmojis();

  const menu = document.createElement("div");
  menu.className = "message-actions-menu";
  menu.addEventListener("click", (event) => event.stopPropagation());

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

    rememberReactionEmoji(emoji);
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

  const fullPicker = document.createElement("emoji-picker");
  fullPicker.className = "reaction-full-picker";

  fullPicker.addEventListener("emoji-click", async (event) => {
    const emoji = event.detail?.unicode || "";
    if (emoji) await sendEmoji(emoji);
  });

  morePanel.appendChild(fullPicker);

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
  else if (messageKind === "sticker") content = "🖼️ ملصق";
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

function getCurrentSenderName() {
  try {
    const payloadPart = String(authToken || "").split(".")[1];
    if (!payloadPart) return "Agent";

    const normalized = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      "="
    );
    const payload = JSON.parse(atob(padded));

    return payload.displayName || payload.username || "Agent";
  } catch (error) {
    return "Agent";
  }
}

function appendPendingMedia(file, caption = "") {
  const url = URL.createObjectURL(file);
  localMediaPreviewUrls.add(url);
  const messageKind = file.type.startsWith("video/") ? "video" : "image";

  const wrap = document.createElement("div");
  wrap.className = "message-wrap agent";
  wrap.dataset.pendingUpload = "true";

  const bubble = document.createElement("div");
  bubble.className = "message agent";
  bubble.style.position = "relative";

  const label = document.createElement("div");
  label.className = "message-label agent";
  label.textContent = getCurrentSenderName();

  if (label.textContent.toLowerCase() === "admin") {
    label.classList.add("sender-admin");
  } else if (label.textContent.toLowerCase() === "agent1") {
    label.classList.add("sender-agent1");
  }

  bubble.appendChild(label);

  if (messageKind === "image") {
    const img = document.createElement("img");
    img.src = url;
    img.dataset.fullSrc = url;
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
    progress(percent) {
      overlay.textContent = `جاري الإرسال... ${percent}%`;
    },
    done() {
      overlay.textContent = "تم الإرسال";
      setTimeout(() => {
        overlay.remove();
        wrap.dataset.pendingUpload = "false";

        if (!bubble.querySelector(".message-timestamp")) {
          const timestamp = document.createElement("div");
          timestamp.className = "message-timestamp";
          timestamp.textContent = formatMessageTimestamp(
            new Date().toISOString()
          );
          bubble.appendChild(timestamp);
        }
      }, 700);
    },
    fail(message = "فشل الإرسال") {
      overlay.textContent = message;
      overlay.classList.add("failed");
    }
  };
}

async function uploadMediaFile(
  originalFile,
  caption,
  pending,
  targetSessionId
) {
  const maxVideoSize = 15 * 1024 * 1024;

  if (
    originalFile.type.startsWith("video/") &&
    originalFile.size > maxVideoSize
  ) {
    pending.fail("الفيديو أكبر من 15 ميجا");
    throw new Error(`Video too large: ${originalFile.name}`);
  }

  const file = await normalizeImageFile(originalFile);
  const messageKind = file.type.startsWith("video/") ? "video" : "image";
  const formData = new FormData();

  formData.append("file", file);
  formData.append("sessionId", targetSessionId);
  formData.append("caption", caption);
  formData.append("messageKind", messageKind);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", `${API_BASE}/send-media`);
    xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      const percent = Math.round((event.loaded / event.total) * 100);
      pending.progress(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        pending.done();
        resolve();
        return;
      }

      if (xhr.status === 401 || xhr.status === 403) {
        logout();
      }

      pending.fail();
      reject(new Error(`Failed to send media: ${xhr.status}`));
    };

    xhr.onerror = () => {
      pending.fail("خطأ في الاتصال");
      reject(new Error("Upload error"));
    };

    xhr.send(formData);
  });
}

if (mediaInputEl) {
  mediaInputEl.addEventListener("change", async () => {
    const files = Array.from(mediaInputEl.files || []);

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

    const caption = messageInputEl.value.trim();
    const targetSessionId = activeSessionId;
    const uploads = files.map((file) => ({
      file,
      pending: appendPendingMedia(file, caption)
    }));

    sendBtnEl.disabled = true;
    attachBtnEl.disabled = true;
    mediaInputEl.value = "";
    messageInputEl.value = "";
    resizeMessageInput();

    try {
      activeMediaUploadCount = uploads.length;
      suppressLocalMediaEventsUntil = Date.now() + 60000;

      const results = await Promise.allSettled(
        uploads.map(({ file, pending }) =>
          uploadMediaFile(file, caption, pending, targetSessionId)
        )
      );

      const failedCount = results.filter(
        (result) => result.status === "rejected"
      ).length;
      const successCount = results.length - failedCount;

      if (successCount) {
        currentLoadedMessageCount += successCount;
        renderChatMeta(targetSessionId, currentLoadedMessageCount);
        loadConversations();
      }

      if (failedCount) {
        alert(`فشل إرسال ${failedCount} ملف`);
      }
    } finally {
      activeMediaUploadCount = 0;
      suppressLocalMediaEventsUntil = Date.now() + 5000;
      sendBtnEl.disabled = false;
      attachBtnEl.disabled = false;
      messageInputEl.focus();
    }
  });
}

function getSupportedAudioMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4"
  ];

  return (
    types.find((type) => MediaRecorder.isTypeSupported(type)) ||
    ""
  );
}

function getAudioExtension(mimeType) {
  const type = String(mimeType || "").toLowerCase();

  if (type.includes("ogg")) return "ogg";
  if (type.includes("mp4")) return "m4a";
  if (type.includes("mpeg")) return "mp3";
  if (type.includes("webm")) return "webm";

  return "audio";
}

function formatRecordingTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );
}

function startRecordingTimer() {
  recordingStartedAt = Date.now();

  if (voiceRecordingTimeEl) {
    voiceRecordingTimeEl.textContent = "00:00";
  }

  clearInterval(recordingTimerInterval);

  recordingTimerInterval = setInterval(() => {
    const elapsedSeconds = Math.floor(
      (Date.now() - recordingStartedAt) / 1000
    );

    if (voiceRecordingTimeEl) {
      voiceRecordingTimeEl.textContent =
        formatRecordingTime(elapsedSeconds);
    }
  }, 500);
}

function stopRecordingTimer() {
  if (recordingTimerInterval) {
    clearInterval(recordingTimerInterval);
    recordingTimerInterval = null;
  }

  recordingStartedAt = 0;
}

function showRecordingBar() {
  closeEmojiPicker();
  voiceRecordingBarEl?.classList.remove("hidden");

  messageInputEl.style.display = "none";
  sendBtnEl.style.display = "none";
  attachBtnEl.style.display = "none";
  if (emojiBtnEl) emojiBtnEl.style.display = "none";
}

function hideRecordingBar() {
  voiceRecordingBarEl?.classList.add("hidden");

  messageInputEl.style.display = "";
  sendBtnEl.style.display = "";
  attachBtnEl.style.display = "";
  if (emojiBtnEl) emojiBtnEl.style.display = "";

  if (voiceRecordingTimeEl) {
    voiceRecordingTimeEl.textContent = "00:00";
  }
}

function resetRecordingUi() {
  stopRecordingTimer();
  hideRecordingBar();
  

  recordAudioBtnEl?.classList.remove(
    "recording",
    "locked"
  );

  if (recordAudioBtnEl) {
    recordAudioBtnEl.textContent = "🎤";
    recordAudioBtnEl.disabled = false;
  }

  recordingPointerId = null;
  recordingStartX = 0;
  recordingStartY = 0;
  recordingCancelled = false;
  recordingLocked = false;
  desktopRecordingMode = false;
  const hint =
  voiceRecordingBarEl?.querySelector(
    ".voice-recording-hint"
  );

if (hint) {
  hint.textContent = "اسحب للإلغاء";
}
  }
async function startAudioRecording() {
  if (!activeSessionId) {
    alert("اختر محادثة أولًا");
    return;
  }

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia ||
    typeof MediaRecorder === "undefined"
  ) {
    alert("المتصفح لا يدعم تسجيل الصوت");
    return;
  }

  try {
    recordingStream =
      await navigator.mediaDevices.getUserMedia({
        audio: true
      });

    const mimeType = getSupportedAudioMimeType();
  

    mediaRecorder = mimeType
      ? new MediaRecorder(recordingStream, {
          mimeType
        })
      : new MediaRecorder(recordingStream);

    audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    });

    mediaRecorder.addEventListener("stop", async () => {
  try {
    // لو المستخدم سحب للإلغاء، ما نبعتش أي حاجة
    if (recordingCancelled) {
      audioChunks = [];
      return;
    }

    const finalMimeType =
      mediaRecorder?.mimeType ||
      mimeType ||
      "audio/ogg";

    const audioBlob = new Blob(audioChunks, {
      type: finalMimeType
    });

    if (!audioBlob.size) {
      throw new Error("Audio recording is empty");
    }

    const extension =
      getAudioExtension(finalMimeType);

    const audioFile = new File(
      [audioBlob],
      `voice-${Date.now()}.${extension}`,
      {
        type: finalMimeType
      }
    );

    await sendRecordedAudio(audioFile);
  } catch (error) {
    console.error("Recorded audio error:", error);

    if (!recordingCancelled) {
      alert("فشل تجهيز الرسالة الصوتية");
    }
  } finally {
    audioChunks = [];
    mediaRecorder = null;
    isRecordingAudio = false;

    stopRecordingStream();
    resetRecordingUi();

    messageInputEl.disabled = false;
    sendBtnEl.disabled = false;
    attachBtnEl.disabled = false;
  }
});

    mediaRecorder.start(250);

isRecordingAudio = true;
recordingCancelled = false;

showRecordingBar();
startRecordingTimer();

recordAudioBtnEl.classList.add("recording");
recordAudioBtnEl.classList.remove("locked");

recordAudioBtnEl.textContent = "🎤";

recordAudioBtnEl.setAttribute(
  "aria-label",
  "استمر بالضغط للتسجيل"
);

messageInputEl.disabled = true;
sendBtnEl.disabled = true;
attachBtnEl.disabled = true;

  } catch (error) {
    console.error("Microphone error:", error);
    alert("تعذر الوصول إلى الميكروفون");

    stopRecordingStream();
  }
}

function stopAudioRecording() {
  if (!isRecordingAudio) return;

  isRecordingAudio = false;

  if (
    mediaRecorder &&
    mediaRecorder.state !== "inactive"
  ) {
    mediaRecorder.stop();
  } else {
    stopRecordingStream();
    resetRecordingUi();

    messageInputEl.disabled = false;
    sendBtnEl.disabled = false;
    attachBtnEl.disabled = false;
  }
}

function stopRecordingStream() {
  if (recordingStream) {
    recordingStream
      .getTracks()
      .forEach((track) => track.stop());
  }

  recordingStream = null;
}

async function sendRecordedAudio(audioFile) {
  if (!activeSessionId) {
    throw new Error("No active session");
  }

  recordAudioBtnEl.disabled = true;
  recordAudioBtnEl.textContent = "⏳";

  try {
    const formData = new FormData();

    formData.append("file", audioFile);
    formData.append("sessionId", activeSessionId);
    formData.append("caption", "");
    formData.append("messageKind", "audio");

    const response = await fetch(
      `${API_BASE}/send-media`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
      }
    );

    if (handleInvalidToken(response)) return;

    const result =
      await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result?.details?.message ||
        result?.error ||
        "Failed to send audio"
      );
    }

    loadConversations();
  } catch (error) {
    console.error("Send recorded audio error:", error);
    alert("فشل إرسال الرسالة الصوتية");
  } finally {
    recordAudioBtnEl.disabled = false;
    recordAudioBtnEl.textContent = "🎤";
    messageInputEl.disabled = false;
    sendBtnEl.disabled = false;
    attachBtnEl.disabled = false;
    messageInputEl.focus();
  }
}


const CANCEL_SWIPE_DISTANCE = 80;
const LOCK_SWIPE_DISTANCE = 80;
const RECORD_HOLD_DELAY = 250;

let desktopRecordingMode = false;

recordAudioBtnEl?.addEventListener("click", async () => {
  if (isRecordingAudio) return;

  recordingCancelled = false;

  await startAudioRecording();
});

cancelAudioRecordingBtnEl?.addEventListener("click", () => {
  if (!isRecordingAudio) return;

  recordingCancelled = true;

  stopAudioRecording();
});

sendAudioRecordingBtnEl?.addEventListener("click", () => {
  if (!isRecordingAudio) return;

  recordingCancelled = false;

  stopAudioRecording();
});

function restoreVoiceComposerUi() {
  const recorderIsActuallyRunning =
    mediaRecorder &&
    mediaRecorder.state !== "inactive";

  // لو مفيش تسجيل فعلي شغال، رجّع الواجهة للوضع الطبيعي
  if (!recorderIsActuallyRunning) {
    isRecordingAudio = false;
    recordingCancelled = false;

    stopRecordingStream();
    stopRecordingTimer();

    voiceRecordingBarEl?.classList.add("hidden");

    if (voiceRecordingTimeEl) {
      voiceRecordingTimeEl.textContent = "00:00";
    }

    if (recordAudioBtnEl) {
      recordAudioBtnEl.disabled = false;
      recordAudioBtnEl.style.display = "inline-flex";
      recordAudioBtnEl.textContent = "🎤";
      recordAudioBtnEl.classList.remove(
        "recording",
        "locked"
      );

      recordAudioBtnEl.setAttribute(
        "aria-label",
        "تسجيل رسالة صوتية"
      );
    }

    if (messageInputEl) {
      messageInputEl.disabled = false;
      messageInputEl.style.removeProperty("display");
    }

    if (attachBtnEl) {
      attachBtnEl.disabled = false;
      attachBtnEl.style.display = "inline-flex";
    }

    if (emojiBtnEl) {
      emojiBtnEl.disabled = false;
      emojiBtnEl.style.display = "inline-flex";
    }

    if (sendBtnEl) {
      sendBtnEl.disabled = false;
      sendBtnEl.style.display = "inline-flex";
    }

    resizeMessageInput();
  }
}

// عند فتح التطبيق أو الرجوع له من الخلفية
function scheduleVoiceComposerRestore() {
  restoreVoiceComposerUi();
  setTimeout(restoreVoiceComposerUi, 150);
  setTimeout(restoreVoiceComposerUi, 500);
}

window.addEventListener("pageshow", scheduleVoiceComposerRestore);
window.addEventListener("focus", scheduleVoiceComposerRestore);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    scheduleVoiceComposerRestore();
  }
});

scheduleVoiceComposerRestore();
