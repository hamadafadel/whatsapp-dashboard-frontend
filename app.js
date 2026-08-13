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
const chatMessageCountEl = document.getElementById("chatMessageCount");
const chatPhoneNumberEl = document.getElementById("chatPhoneNumber");
const chatHeaderTextEl = document.querySelector(".chat-header-name-row");
const searchInputEl = document.getElementById("searchInput");
const channelFilterBarEl = document.getElementById("channelFilterBar");
const unreadFilterBarEl = document.getElementById("unreadFilterBar");
const unreadFilterCountEl = document.getElementById("unreadFilterCount");
const conversationsMenuBtnEl = document.getElementById("conversationsMenuBtn");
const conversationsMenuPanelEl = document.getElementById("conversationsMenuPanel");
const currentUserNameEl = document.getElementById("currentUserName");
const currentUserRoleEl = document.getElementById("currentUserRole");
const toggleSessionSelectBtnEl = document.getElementById("toggleSessionSelectBtn");
const viewHiddenBtnEl = document.getElementById("viewHiddenBtn");
const openGalleryBtnEl = document.getElementById("openGalleryBtn");
const logoutBtnEl = document.getElementById("logoutBtn");
const hiddenViewBarEl = document.getElementById("hiddenViewBar");
const backFromHiddenBtnEl = document.getElementById("backFromHiddenBtn");
const sessionsSelectionBarEl = document.getElementById("sessionsSelectionBar");
const sessionsSelectionCountEl = document.getElementById("sessionsSelectionCount");
const sessionsSelectionCancelBtnEl = document.getElementById("sessionsSelectionCancelBtn");
const sessionsSelectionHideBtnEl = document.getElementById("sessionsSelectionHideBtn");
const sessionsSelectionReadBtnEl = document.getElementById("sessionsSelectionReadBtn");
const sessionsSelectionLabelBtnEl = document.getElementById("sessionsSelectionLabelBtn");
const sessionsSelectionSelectAllBtnEl = document.getElementById("sessionsSelectionSelectAllBtn");
const bulkLabelPickerEl = document.getElementById("bulkLabelPicker");
const bulkLabelPickerListEl = document.getElementById("bulkLabelPickerList");
const bulkLabelPickerCancelBtnEl = document.getElementById("bulkLabelPickerCancelBtn");
const labelFilterRowEl = document.getElementById("labelFilterRow");
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
const quickActionsBtnEl = document.getElementById("quickActionsBtn");
const quickActionsPanelEl = document.getElementById("quickActionsPanel");
const quickActionsStatusEl = document.getElementById("quickActionsStatus");
const openTemplatesBtnEl = document.getElementById("openTemplatesBtn");
const openMetaOrderBtnEl =
  document.getElementById("openMetaOrderBtn");

const metaOrderOverlayEl =
  document.getElementById("metaOrderOverlay");

const closeMetaOrderBtnEl =
  document.getElementById("closeMetaOrderBtn");

const cancelMetaOrderBtnEl =
  document.getElementById("cancelMetaOrderBtn");

const submitMetaOrderBtnEl =
  document.getElementById("submitMetaOrderBtn");

const metaOrderAmountEl =
  document.getElementById("metaOrderAmount");

const metaOrderDescriptionEl =
  document.getElementById("metaOrderDescription");

const metaOrderStatusEl =
  document.getElementById("metaOrderStatus");
const templatesPanelEl = document.getElementById("templatesPanel");
const backToActionsBtnEl = document.getElementById("backToActionsBtn");
const templatesListEl = document.getElementById("templatesList");
const templatesStatusEl = document.getElementById("templatesStatus");
const windowExpiredBannerEl = document.getElementById("windowExpiredBanner");
const sendTemplateInsteadBtnEl = document.getElementById("sendTemplateInsteadBtn");
const chatComposeEl = document.querySelector(".chat-compose");
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

// مربع البحث جوه الإيموجي بيكر مش محتاجينه، بنستخدمه للاختيار السريع بس
function hideEmojiSearchBox() {
  const root = emojiPickerEl?.shadowRoot;
  if (!root) return false;

  const searchWrapper = root.querySelector(".search-wrapper");
  if (!searchWrapper) return false;

  searchWrapper.style.display = "none";
  return true;
}

if (emojiPickerEl) {
  customElements.whenDefined("emoji-picker").then(() => {
    if (hideEmojiSearchBox()) return;

    const root = emojiPickerEl.shadowRoot;
    if (!root) return;

    const observer = new MutationObserver(() => {
      if (hideEmojiSearchBox()) observer.disconnect();
    });

    observer.observe(root, { childList: true, subtree: true });
  });
}

const savedRepliesBtnEl = document.getElementById("savedRepliesBtn");
const savedRepliesOverlayEl = document.getElementById("savedRepliesOverlay");
const savedRepliesListEl = document.getElementById("savedRepliesList");
const addSavedReplyBtnEl = document.getElementById("addSavedReplyBtn");
const closeSavedRepliesBtnEl = document.getElementById("closeSavedRepliesBtn");
const savedReplyFormEl = document.getElementById("savedReplyForm");
const savedReplyTextEl = document.getElementById("savedReplyText");
const cancelSavedReplyBtnEl = document.getElementById("cancelSavedReplyBtn");
const saveSavedReplyBtnEl = document.getElementById("saveSavedReplyBtn");

const savedMediaBtnEl = document.getElementById("savedMediaBtn");
const savedMediaOverlayEl = document.getElementById("savedMediaOverlay");
const savedMediaBackBtnEl = document.getElementById("savedMediaBackBtn");
const savedMediaTitleEl = document.getElementById("savedMediaTitle");
const addSavedMediaBtnEl = document.getElementById("addSavedMediaBtn");
const closeSavedMediaBtnEl = document.getElementById("closeSavedMediaBtn");
const sendFolderBarEl = document.getElementById("sendFolderBar");
const sendFolderBtnEl = document.getElementById("sendFolderBtn");
const savedMediaGridEl = document.getElementById("savedMediaGrid");
const addFolderFormEl = document.getElementById("addFolderForm");
const folderNameInputEl = document.getElementById("folderNameInput");
const cancelFolderFormBtnEl = document.getElementById("cancelFolderFormBtn");
const saveFolderFormBtnEl = document.getElementById("saveFolderFormBtn");
const savedMediaFileInputEl = document.getElementById("savedMediaFileInput");
const savedMediaPreviewOverlayEl = document.getElementById("savedMediaPreviewOverlay");
const savedMediaPreviewBodyEl = document.getElementById("savedMediaPreviewBody");
const closeSavedMediaPreviewBtnEl = document.getElementById("closeSavedMediaPreviewBtn");
const cancelSavedMediaSendBtnEl = document.getElementById("cancelSavedMediaSendBtn");
const confirmSavedMediaSendBtnEl = document.getElementById("confirmSavedMediaSendBtn");
const toggleSelectModeBtnEl = document.getElementById("toggleSelectModeBtn");
const selectionBarEl = document.getElementById("selectionBar");
const selectionCountTextEl = document.getElementById("selectionCountText");
const cancelSelectionBtnEl = document.getElementById("cancelSelectionBtn");
const sendSelectedBtnEl = document.getElementById("sendSelectedBtn");

const conversationLabelsBtnEl = document.getElementById("conversationLabelsBtn");
const chatLabelsRowEl = document.getElementById("chatLabelsRow");
const labelsOverlayEl = document.getElementById("labelsOverlay");
const addLabelBtnEl = document.getElementById("addLabelBtn");
const closeLabelsBtnEl = document.getElementById("closeLabelsBtn");
const labelsListEl = document.getElementById("labelsList");
const labelFormEl = document.getElementById("labelForm");
const labelNameInputEl = document.getElementById("labelNameInput");
const labelColorPickerEl = document.getElementById("labelColorPicker");
const cancelLabelFormBtnEl = document.getElementById("cancelLabelFormBtn");
const saveLabelFormBtnEl = document.getElementById("saveLabelFormBtn");

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

function closeQuickActions() {
  quickActionsPanelEl?.classList.add("hidden");
  templatesPanelEl?.classList.add("hidden");
  quickActionsBtnEl?.setAttribute("aria-expanded", "false");
}

function openMetaOrderModal() {
  if (!activeSessionId) {
    alert("اختر محادثة أولًا");
    return;
  }

  closeQuickActions();
  closeEmojiPicker();

  if (metaOrderAmountEl) {
    metaOrderAmountEl.value = "";
  }

  if (metaOrderDescriptionEl) {
    metaOrderDescriptionEl.value = "";
  }

  if (metaOrderStatusEl) {
    metaOrderStatusEl.textContent = "";
  }

  metaOrderOverlayEl?.classList.remove("hidden");

  setTimeout(() => {
    metaOrderAmountEl?.focus();
  }, 100);
}

function closeMetaOrderModal() {
  metaOrderOverlayEl?.classList.add("hidden");

  if (metaOrderStatusEl) {
    metaOrderStatusEl.textContent = "";
  }
}

openMetaOrderBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  openMetaOrderModal();
});

closeMetaOrderBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeMetaOrderModal();
});

cancelMetaOrderBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeMetaOrderModal();
});

metaOrderOverlayEl?.addEventListener("click", (event) => {
  if (event.target === metaOrderOverlayEl) {
    closeMetaOrderModal();
  }
});

submitMetaOrderBtnEl?.addEventListener("click", async (event) => {
  event.stopPropagation();

  if (!activeSessionId) {
    if (metaOrderStatusEl) {
      metaOrderStatusEl.classList.remove("success");
      metaOrderStatusEl.textContent = "لا توجد محادثة محددة";
    }
    return;
  }

  const amount = Number(metaOrderAmountEl?.value || 0);
  const description = metaOrderDescriptionEl?.value.trim() || "";

  if (!Number.isFinite(amount) || amount <= 0) {
    if (metaOrderStatusEl) {
      metaOrderStatusEl.classList.remove("success");
      metaOrderStatusEl.textContent = "اكتب قيمة طلب صحيحة";
    }

    metaOrderAmountEl?.focus();
    return;
  }

  submitMetaOrderBtnEl.disabled = true;
  cancelMetaOrderBtnEl.disabled = true;
  closeMetaOrderBtnEl.disabled = true;

  if (metaOrderStatusEl) {
    metaOrderStatusEl.classList.remove("success");
    metaOrderStatusEl.textContent = "جاري إنشاء الطلب...";
  }

  try {
    const response = await fetch(`${API_BASE}/meta-purchase`, {
      method: "POST",
      headers: getAuthHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        sessionId: activeSessionId,
        amount,
        currency: "EGP",
        description
      })
    });

    if (handleInvalidToken(response)) return;

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.error ||
        result.message ||
        "فشل إنشاء الطلب"
      );
    }

    if (metaOrderStatusEl) {
      metaOrderStatusEl.classList.add("success");
      metaOrderStatusEl.textContent =
        result.orderCode
          ? `تم إنشاء الطلب بنجاح — ${result.orderCode}`
          : "تم إنشاء الطلب بنجاح";
    }

    setTimeout(() => {
      closeMetaOrderModal();
    }, 1200);

  } catch (error) {
    console.error("Meta purchase error:", error);

    if (metaOrderStatusEl) {
      metaOrderStatusEl.classList.remove("success");
      metaOrderStatusEl.textContent =
        error.message || "فشل إنشاء الطلب";
    }
  } finally {
    submitMetaOrderBtnEl.disabled = false;
    cancelMetaOrderBtnEl.disabled = false;
    closeMetaOrderBtnEl.disabled = false;
  }
});

quickActionsBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();

  if (!activeSessionId) {
    alert("اختر محادثة أولًا");
    return;
  }

  const willOpen = quickActionsPanelEl?.classList.contains("hidden");
  closeEmojiPicker();
  quickActionsPanelEl?.classList.toggle("hidden");
  quickActionsBtnEl.setAttribute("aria-expanded", String(willOpen));

  if (quickActionsStatusEl) quickActionsStatusEl.textContent = "";
});

quickActionsPanelEl?.addEventListener("click", (event) => {
  event.stopPropagation();
});

quickActionsPanelEl?.querySelectorAll("[data-action-id]").forEach((button) => {
  button.addEventListener("click", async () => {
    const actionId = button.dataset.actionId;
    if (!activeSessionId || !actionId) return;

    const actionButtons = quickActionsPanelEl.querySelectorAll(
      "[data-action-id]"
    );
    actionButtons.forEach((item) => { item.disabled = true; });
    quickActionsStatusEl.textContent = "جاري تشغيل المسار...";

    try {
      const response = await fetch(`${API_BASE}/dashboard-action`, {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          sessionId: activeSessionId,
          actionId
        })
      });

      if (handleInvalidToken(response)) return;

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Dashboard action failed");
      }

      quickActionsStatusEl.textContent = "تم تشغيل المسار";
      setTimeout(closeQuickActions, 500);
    } catch (error) {
      console.error(error);
      quickActionsStatusEl.textContent = error.message || "فشل تشغيل المسار";
    } finally {
      actionButtons.forEach((item) => { item.disabled = false; });
    }
  });
});

let templatesCache = null;

async function fetchTemplates() {
  if (templatesCache) return templatesCache;

  const response = await fetch(`${API_BASE}/templates`, {
    headers: getAuthHeaders()
  });

  if (handleInvalidToken(response)) return [];

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Failed to load templates");
  }

  templatesCache = Array.isArray(data.templates) ? data.templates : [];
  return templatesCache;
}

async function renderTemplatesList() {
  if (!templatesListEl) return;

  templatesListEl.innerHTML = '<div class="quick-actions-status">جاري التحميل...</div>';
  if (templatesStatusEl) templatesStatusEl.textContent = "";

  try {
    const templates = await fetchTemplates();
    templatesListEl.innerHTML = "";

    if (!templates.length) {
      templatesListEl.innerHTML =
        '<div class="quick-actions-status">لا يوجد تيمبليتات متاحة</div>';
      return;
    }

    templates.forEach((template) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "template-item-btn";
      button.textContent = template.label;

      button.addEventListener("click", async () => {
        if (!activeSessionId) return;

        const allButtons = templatesListEl.querySelectorAll(".template-item-btn");
        allButtons.forEach((b) => { b.disabled = true; });
        if (templatesStatusEl) templatesStatusEl.textContent = "جاري إرسال التيمبليت...";

        try {
          const response = await fetch(`${API_BASE}/send-template`, {
            method: "POST",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              sessionId: activeSessionId,
              templateId: template.id
            })
          });

          if (handleInvalidToken(response)) return;

          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(result.error || "Failed to send template");
          }

          if (templatesStatusEl) templatesStatusEl.textContent = "تم إرسال التيمبليت";
          setTimeout(closeQuickActions, 500);
        } catch (error) {
          console.error(error);
          if (templatesStatusEl) templatesStatusEl.textContent = "فشل إرسال التيمبليت";
        } finally {
          allButtons.forEach((b) => { b.disabled = false; });
        }
      });

      templatesListEl.appendChild(button);
    });
  } catch (error) {
    console.error(error);
    templatesListEl.innerHTML =
      '<div class="quick-actions-status">تعذر تحميل التيمبليتات</div>';
  }
}

openTemplatesBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (getActiveChannel() === "messenger") return;
  quickActionsPanelEl?.classList.add("hidden");
  templatesPanelEl?.classList.remove("hidden");
  renderTemplatesList();
});

backToActionsBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  templatesPanelEl?.classList.add("hidden");
  quickActionsPanelEl?.classList.remove("hidden");
});

templatesPanelEl?.addEventListener("click", (event) => {
  event.stopPropagation();
});

sendTemplateInsteadBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();

  if (!activeSessionId) {
    alert("اختر محادثة أولًا");
    return;
  }

  if (getActiveChannel() === "messenger") return;

  closeEmojiPicker();
  quickActionsPanelEl?.classList.add("hidden");
  templatesPanelEl?.classList.remove("hidden");
  quickActionsBtnEl?.setAttribute("aria-expanded", "true");
  renderTemplatesList();
});

document.addEventListener("click", closeQuickActions);

let savedReplyEditingId = null;
let savedRepliesCache = [];

async function fetchSavedReplies() {
  const response = await fetch(`${API_BASE}/saved-replies`, {
    headers: getAuthHeaders()
  });

  if (handleInvalidToken(response)) return [];

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Failed to load saved replies");
  }

  return Array.isArray(data.replies) ? data.replies : [];
}

function renderSavedRepliesList(replies) {
  if (!savedRepliesListEl) return;

  savedRepliesListEl.innerHTML = "";

  if (!replies.length) {
    const empty = document.createElement("div");
    empty.className = "saved-replies-empty";
    empty.textContent = "لا يوجد ردود محفوظة بعد. اضغط + لإضافة أول رد.";
    savedRepliesListEl.appendChild(empty);
    return;
  }

  replies.forEach((reply) => {
    const item = document.createElement("div");
    item.className = "saved-reply-item";
    item.dataset.id = reply.id;

    const text = document.createElement("div");
    text.className = "saved-reply-item-text";
    text.textContent = reply.text;
    text.addEventListener("click", () => {
      insertSavedReplyText(reply.text);
    });

    const actions = document.createElement("div");
    actions.className = "saved-reply-item-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "saved-reply-edit";
    editBtn.setAttribute("aria-label", "تعديل");
    editBtn.textContent = "✎";
    editBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openSavedReplyForm(reply);
    });

    actions.appendChild(editBtn);

    if (reply.canRevert) {
      const revertBtn = document.createElement("button");
      revertBtn.type = "button";
      revertBtn.className = "saved-reply-revert";
      revertBtn.setAttribute("aria-label", "رجوع للرد الأصلي");
      revertBtn.textContent = "↺";
      revertBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        if (!confirm("رجوع هذا الرد لنص الأدمن الأصلي؟")) return;
        await runSavedReplyAction(() => revertSavedReply(reply.id));
      });

      actions.appendChild(revertBtn);
    }

    if (reply.canDelete) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "saved-reply-delete";
      deleteBtn.setAttribute("aria-label", "حذف");
      deleteBtn.textContent = "🗑";
      deleteBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        if (!confirm("حذف هذا الرد المحفوظ؟")) return;
        await runSavedReplyAction(() => deleteSavedReply(reply.id));
      });

      actions.appendChild(deleteBtn);
    }

    item.appendChild(text);
    item.appendChild(actions);
    savedRepliesListEl.appendChild(item);
  });
}

async function refreshSavedReplies() {
  if (!savedRepliesListEl) return;

  savedRepliesListEl.innerHTML =
    '<div class="saved-replies-empty">جاري التحميل...</div>';

  try {
    savedRepliesCache = await fetchSavedReplies();
    renderSavedRepliesList(savedRepliesCache);
  } catch (error) {
    console.error(error);
    savedRepliesListEl.innerHTML =
      '<div class="saved-replies-empty">تعذر تحميل الردود المحفوظة</div>';
  }
}

async function runSavedReplyAction(action) {
  try {
    await action();
    await refreshSavedReplies();
  } catch (error) {
    console.error(error);
    alert(error.message || "حدث خطأ، حاول مرة أخرى");
  }
}

async function createSavedReply(text) {
  const response = await fetch(`${API_BASE}/saved-replies`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ text })
  });

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل إضافة الرد");
  }
}

async function updateSavedReply(id, text) {
  const response = await fetch(`${API_BASE}/saved-replies/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ text })
  });

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل تعديل الرد");
  }
}

async function revertSavedReply(id) {
  const response = await fetch(`${API_BASE}/saved-replies/${id}/revert`, {
    method: "POST",
    headers: getAuthHeaders()
  });

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل الرجوع للرد الأصلي");
  }
}

async function deleteSavedReply(id) {
  const response = await fetch(`${API_BASE}/saved-replies/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "غير مسموح بحذف هذا الرد");
  }
}

function insertSavedReplyText(text) {
  if (!messageInputEl || !text) return;

  const start = messageInputEl.selectionStart ?? messageInputEl.value.length;
  const end = messageInputEl.selectionEnd ?? start;

  messageInputEl.setRangeText(text, start, end, "end");
  messageInputEl.dispatchEvent(new Event("input", { bubbles: true }));
  messageInputEl.focus();
  closeSavedReplies();
}

function openSavedReplyForm(reply) {
  savedReplyEditingId = reply ? reply.id : null;
  if (savedReplyTextEl) savedReplyTextEl.value = reply ? reply.text : "";
  savedReplyFormEl?.classList.remove("hidden");
  savedReplyTextEl?.focus();
}

function closeSavedReplyForm() {
  savedReplyEditingId = null;
  if (savedReplyTextEl) savedReplyTextEl.value = "";
  savedReplyFormEl?.classList.add("hidden");
}

function openSavedReplies() {
  closeEmojiPicker();
  closeQuickActions();
  closeSavedReplyForm();
  savedRepliesOverlayEl?.classList.remove("hidden");
  document.body.classList.add("saved-replies-open");
  refreshSavedReplies();
}

function closeSavedReplies() {
  savedRepliesOverlayEl?.classList.add("hidden");
  document.body.classList.remove("saved-replies-open");
  closeSavedReplyForm();
}

savedRepliesBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();

  if (!activeSessionId) {
    alert("اختر محادثة أولًا");
    return;
  }

  openSavedReplies();
});

savedRepliesOverlayEl?.addEventListener("click", (event) => {
  if (event.target === savedRepliesOverlayEl) closeSavedReplies();
});

closeSavedRepliesBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeSavedReplies();
});

addSavedReplyBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  openSavedReplyForm(null);
});

cancelSavedReplyBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeSavedReplyForm();
});

saveSavedReplyBtnEl?.addEventListener("click", async (event) => {
  event.stopPropagation();

  const text = savedReplyTextEl?.value.trim();
  if (!text) return;

  saveSavedReplyBtnEl.disabled = true;

  await runSavedReplyAction(() =>
    savedReplyEditingId
      ? updateSavedReply(savedReplyEditingId, text)
      : createSavedReply(text)
  );

  saveSavedReplyBtnEl.disabled = false;
  closeSavedReplyForm();
});

let savedMediaView = "folders";
let savedMediaFolders = [];
let savedMediaCurrentFolder = null;
let savedMediaItems = [];
let savedMediaCanManage = false;
let savedMediaFolderEditingId = null;
let savedMediaPreviewItem = null;
let savedMediaSelectMode = false;
let savedMediaSelectedIds = new Set();
const sessionSendQueues = new Map();

function getSessionSendQueue(sessionId) {
  const key = String(sessionId || "");
  if (!sessionSendQueues.has(key)) {
    sessionSendQueues.set(key, {
      jobs: [],
      running: false,
      pendingMediaCount: 0,
      pendingTextCount: 0,
      activeSends: 0,
      suppressMediaEventsUntil: 0,
      progressToast: null
    });
  }
  return sessionSendQueues.get(key);
}

function syncSessionProgressVisibility() {
  sessionSendQueues.forEach((state, sessionId) => {
    state.progressToast?.setVisible(sessionId === activeSessionId);
  });
}

async function processSessionSendQueue(sessionId) {
  const state = getSessionSendQueue(sessionId);
  if (state.running) return;

  state.running = true;
  try {
    while (state.jobs.length) {
      const job = state.jobs.shift();
      state.activeSends = 1;

      try {
        const result = await job.run();
        job.resolve(result);
      } catch (error) {
        console.error(`Session send queue job failed (${sessionId}):`, error);
        job.reject(error);
      } finally {
        if (job.type === "media") {
          state.pendingMediaCount = Math.max(0, state.pendingMediaCount - 1);
        } else if (job.type === "text") {
          state.pendingTextCount = Math.max(0, state.pendingTextCount - 1);
        }
        state.activeSends = 0;
      }
    }
  } finally {
    state.running = false;
  }
}

function enqueueSessionSend(sessionId, type, run) {
  const state = getSessionSendQueue(sessionId);
  if (type === "media") state.pendingMediaCount++;
  if (type === "text") state.pendingTextCount++;

  const promise = new Promise((resolve, reject) => {
    state.jobs.push({ type, run, resolve, reject });
  });

  processSessionSendQueue(sessionId);
  return promise;
}

function mediaFolderIconSvg() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z"/></svg>';
}

// توست تقدّم عام بيتستخدم لرفع الملفات على الوسائط المحفوظة ولإرسالها
// للعميل (مع أو من غير زرار إيقاف)
function createMediaProgressToast({
  label = "جاري الرفع...",
  showStop = false,
  onStop = null,
  sessionId = null
} = {}) {
  const toast = document.createElement("div");
  toast.className = "media-progress-toast";

  const labelRow = document.createElement("div");
  labelRow.className = "media-progress-toast-label";

  const labelText = document.createElement("span");
  labelText.textContent = label;

  const percentText = document.createElement("span");
  percentText.className = "media-progress-toast-percent";
  percentText.textContent = "0%";

  labelRow.appendChild(labelText);
  labelRow.appendChild(percentText);

  const track = document.createElement("div");
  track.className = "media-progress-toast-bar-track";

  const fill = document.createElement("div");
  fill.className = "media-progress-toast-bar-fill";
  track.appendChild(fill);

  toast.appendChild(labelRow);
  toast.appendChild(track);

  let stopBtn = null;

  if (showStop) {
    stopBtn = document.createElement("button");
    stopBtn.type = "button";
    stopBtn.className = "media-progress-toast-stop-btn";
    stopBtn.textContent = "إيقاف الإرسال";

    stopBtn.addEventListener("click", () => {
      stopBtn.disabled = true;
      stopBtn.textContent = "جاري الإيقاف...";
      onStop?.();
    });

    toast.appendChild(stopBtn);
  }

  document.body.appendChild(toast);

  const controller = {
    setVisible(visible) {
      toast.classList.toggle("hidden", !visible);
    },

    setLabel(text) {
      labelText.textContent = text;
    },
    update(percent) {
      const clamped = Math.max(0, Math.min(100, Math.round(percent || 0)));
      fill.style.width = `${clamped}%`;
      percentText.textContent = `${clamped}%`;
    },
    remove() {
      toast.remove();
      if (sessionId) {
        const state = getSessionSendQueue(sessionId);
        if (state.progressToast === controller) state.progressToast = null;
      }
    },
    stopBtn
  };

  if (sessionId) {
    const state = getSessionSendQueue(sessionId);
    state.progressToast?.remove();
    state.progressToast = controller;
    controller.setVisible(sessionId === activeSessionId);
  }

  return controller;
}

async function fetchSavedMediaFolders() {
  const response = await fetch(`${API_BASE}/saved-media-folders`, {
    headers: getAuthHeaders()
  });

  if (handleInvalidToken(response)) return { folders: [], canManage: false };

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Failed to load folders");
  }

  return {
    folders: Array.isArray(data.folders) ? data.folders : [],
    canManage: !!data.canManage
  };
}

async function fetchSavedMediaItems(folderId) {
  const response = await fetch(
    `${API_BASE}/saved-media-folders/${folderId}/items`,
    { headers: getAuthHeaders() }
  );

  if (handleInvalidToken(response)) return { items: [], canManage: false };

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Failed to load items");
  }

  return {
    items: Array.isArray(data.items) ? data.items : [],
    canManage: !!data.canManage
  };
}

async function createSavedMediaFolder(name) {
  const response = await fetch(`${API_BASE}/saved-media-folders`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name })
  });

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل إنشاء الفولدر");
  }
}

async function renameSavedMediaFolder(id, name) {
  const response = await fetch(`${API_BASE}/saved-media-folders/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name })
  });

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل تعديل اسم الفولدر");
  }
}

async function deleteSavedMediaFolder(id) {
  const response = await fetch(`${API_BASE}/saved-media-folders/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل حذف الفولدر");
  }
}

function uploadSavedMediaItem(folderId, file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", `${API_BASE}/saved-media-folders/${folderId}/items`);
    xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch (e) {
        data = {};
      }

      if (xhr.status === 401 || xhr.status === 403) {
        logout();
        reject(new Error(data.error || "انتهت الجلسة"));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(new Error(data.error || "فشل رفع الملف"));
      }
    };

    xhr.onerror = () => reject(new Error("خطأ في الاتصال"));

    xhr.send(formData);
  });
}

async function deleteSavedMediaItem(id) {
  const response = await fetch(`${API_BASE}/saved-media-items/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل حذف العنصر");
  }
}

async function sendSavedMediaItemToCustomer(id, sessionId) {
  const response = await fetch(`${API_BASE}/saved-media-items/${id}/send`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ sessionId })
  });

  if (handleInvalidToken(response)) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل إرسال الملف");
  }

  return data;
}

async function sendSavedMediaFolderToCustomer(id, sessionId) {
  const response = await fetch(`${API_BASE}/saved-media-folders/${id}/send`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ sessionId })
  });

  if (handleInvalidToken(response)) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل إرسال محتوى الفولدر");
  }

  return data;
}

async function sendSelectedSavedMediaItemsToCustomer(itemIds, sessionId) {
  const response = await fetch(`${API_BASE}/saved-media-items/send-batch`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ sessionId, itemIds })
  });

  if (handleInvalidToken(response)) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل إرسال العناصر المحددة");
  }

  return data;
}

// إرسال الوسائط المحفوظة بقى "جوب" شغال على السيرفر (بيكمل حتى لو
// الداشبورد اتقفل)؛ الدالة دي بتتابعه بـ polling وتظهر توست فيه نسبة
// التقدم وزرار إيقاف اختياري
async function fetchSendMediaJobStatus(jobId) {
  const response = await fetch(
    `${API_BASE}/saved-media-send-jobs/${jobId}`,
    { headers: getAuthHeaders() }
  );

  if (handleInvalidToken(response)) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "تعذر متابعة حالة الإرسال");
  }

  return data;
}

async function cancelSendMediaJob(jobId) {
  const response = await fetch(
    `${API_BASE}/saved-media-send-jobs/${jobId}/cancel`,
    { method: "POST", headers: getAuthHeaders() }
  );

  return response.json().catch(() => ({}));
}

async function trackSendMediaJob(jobId, total, sessionId) {
  const toast = createMediaProgressToast({
    label: `جاري الإرسال 0 من ${total}`,
    showStop: true,
    onStop: () => {
      cancelSendMediaJob(jobId).catch((err) => console.error(err));
    },
    sessionId
  });

  try {
    while (true) {
      const status = await fetchSendMediaJobStatus(jobId);
      if (!status) return null;

      const completed = status.sent + status.failed;

      toast.setLabel(
        status.cancelled
          ? `تم إيقاف الإرسال (${completed} من ${status.total})`
          : `جاري الإرسال ${completed} من ${status.total}`
      );

      toast.update(status.total ? (completed / status.total) * 100 : 100);

      if (status.done) return status;

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } finally {
    toast.remove();
  }
}

function renderSavedMediaFolders() {
  if (!savedMediaGridEl) return;

  savedMediaGridEl.innerHTML = "";

  if (!savedMediaFolders.length) {
    const empty = document.createElement("div");
    empty.className = "saved-media-empty";
    empty.textContent = savedMediaCanManage
      ? "لا يوجد فولدرات بعد. اضغط + لإضافة أول فولدر."
      : "لا يوجد وسائط محفوظة بعد.";
    savedMediaGridEl.appendChild(empty);
    return;
  }

  savedMediaFolders.forEach((folder) => {
    const card = document.createElement("div");
    card.className = "saved-media-folder-card";
    card.dataset.id = folder.id;

    const cover = document.createElement("div");
    cover.className = "saved-media-folder-cover";

    if (folder.cover_thumbnail) {
      const img = document.createElement("img");
      img.src = folder.cover_thumbnail;
      img.alt = folder.name;
      cover.appendChild(img);
    } else {
      cover.innerHTML = mediaFolderIconSvg();
    }

    const meta = document.createElement("div");
    meta.className = "saved-media-folder-meta";
    meta.textContent = folder.name;

    const count = document.createElement("span");
    count.className = "saved-media-folder-count";
    count.textContent = `${folder.item_count || 0} عنصر`;
    meta.appendChild(count);

    card.appendChild(cover);
    card.appendChild(meta);

    if (savedMediaCanManage) {
      const manage = document.createElement("div");
      manage.className = "saved-media-folder-manage";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "✎";
      editBtn.setAttribute("aria-label", "تعديل اسم الفولدر");
      editBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openFolderForm(folder);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "🗑";
      deleteBtn.setAttribute("aria-label", "حذف الفولدر");
      deleteBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        if (!confirm(`حذف فولدر "${folder.name}" وكل محتوياته؟`)) return;

        try {
          await deleteSavedMediaFolder(folder.id);
          await loadSavedMediaFolders();
        } catch (error) {
          console.error(error);
          alert(error.message || "حدث خطأ، حاول مرة أخرى");
        }
      });

      manage.appendChild(editBtn);
      manage.appendChild(deleteBtn);
      card.appendChild(manage);
    }

    card.addEventListener("click", () => {
      openSavedMediaFolder(folder.id, folder.name);
    });

    savedMediaGridEl.appendChild(card);
  });
}

const SAVED_MEDIA_DRAG_MIME = "application/x-saved-media-item-id";

// بيحدد هل نقطة اللمس/الماوس على النص الأول ولا التاني من كارت الهدف —
// "الأول" هنا يعني الجانب اللي بيتقرا أول (يمين في RTL)، عشان نعرف نحط
// العنصر المسحوب قبل الهدف ولا بعده بالظبط
function isPointerAtCardStart(clientX, rect) {
  const isRTL = document.documentElement.dir === "rtl";
  const midX = rect.left + rect.width / 2;
  return isRTL ? clientX > midX : clientX < midX;
}

// بيحط العنصر draggedId قبل أو بعد targetItem بالظبط، بترتيب كسري (رقم
// بينه وبين جاره) عشان ما نحتاجش نعيد ترقيم كل العناصر جوه الفولدر
async function reorderSavedMediaItem(draggedId, targetItem, insertAfter) {
  if (!draggedId || draggedId === targetItem.id) return;

  const targetIdx = savedMediaItems.findIndex((i) => i.id === targetItem.id);
  if (targetIdx === -1) return;

  const neighborIdx = insertAfter ? targetIdx + 1 : targetIdx - 1;
  const neighbor =
    neighborIdx >= 0 && neighborIdx < savedMediaItems.length
      ? savedMediaItems[neighborIdx]
      : null;

  const targetOrder = targetItem.sort_order ?? (targetIdx + 1) * 1000;
  const neighborOrder = neighbor
    ? (neighbor.sort_order ?? (neighborIdx + 1) * 1000)
    : insertAfter
      ? targetOrder + 1000
      : 0;

  const newOrder = (targetOrder + neighborOrder) / 2;
  const id = draggedId;

  try {
    const response = await fetch(
      `${API_BASE}/saved-media-items/${id}/reorder`,
      {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ order: newOrder })
      }
    );

    if (handleInvalidToken(response)) return;

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "فشل الترتيب");

    await loadSavedMediaItems();
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل ترتيب الملف");
  }
}

// ===== سحب على الموبايل (اللمس مش بيدعم HTML5 drag/drop الأصلي) =====
let savedMediaMobileDragState = null;

function startSavedMediaMobileDrag(id, sourceCard, x, y) {
  const ghost = document.createElement("div");
  ghost.className = "saved-media-drag-ghost";
  ghost.textContent = "📎";
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
  document.body.appendChild(ghost);

  sourceCard.classList.add("dragging");
  savedMediaMobileDragState = { id, ghost };
}

function updateSavedMediaMobileDrag(x, y) {
  if (!savedMediaMobileDragState) return;

  savedMediaMobileDragState.ghost.style.left = `${x}px`;
  savedMediaMobileDragState.ghost.style.top = `${y}px`;

  document
    .querySelectorAll(".saved-media-item-card.drop-before, .saved-media-item-card.drop-after")
    .forEach((el) => el.classList.remove("drop-before", "drop-after"));

  savedMediaMobileDragState.ghost.style.display = "none";
  const el = document.elementFromPoint(x, y);
  savedMediaMobileDragState.ghost.style.display = "";

  const target = el?.closest(".saved-media-item-card");
  if (target && Number(target.dataset.id) !== savedMediaMobileDragState.id) {
    const atStart = isPointerAtCardStart(x, target.getBoundingClientRect());
    target.classList.add(atStart ? "drop-before" : "drop-after");
  }
}

function endSavedMediaMobileDrag(x, y) {
  if (!savedMediaMobileDragState) return;

  const { id, ghost } = savedMediaMobileDragState;

  ghost.style.display = "none";
  const el = document.elementFromPoint(x, y);
  const target = el?.closest(".saved-media-item-card");
  const targetRect = target?.getBoundingClientRect();

  document
    .querySelectorAll(".saved-media-item-card.dragging")
    .forEach((c) => c.classList.remove("dragging"));
  document
    .querySelectorAll(".saved-media-item-card.drop-before, .saved-media-item-card.drop-after")
    .forEach((c) => c.classList.remove("drop-before", "drop-after"));

  ghost.remove();
  savedMediaMobileDragState = null;

  const targetId = target ? Number(target.dataset.id) : null;
  if (targetId && targetId !== id) {
    const targetItem = savedMediaItems.find((i) => i.id === targetId);
    if (targetItem) {
      const insertAfter = !isPointerAtCardStart(x, targetRect);
      reorderSavedMediaItem(id, targetItem, insertAfter);
    }
  }
}

function cancelSavedMediaMobileDrag() {
  if (!savedMediaMobileDragState) return;

  savedMediaMobileDragState.ghost.remove();
  document
    .querySelectorAll(".saved-media-item-card.dragging")
    .forEach((c) => c.classList.remove("dragging"));
  document
    .querySelectorAll(".saved-media-item-card.drop-target")
    .forEach((c) => c.classList.remove("drop-target"));
  savedMediaMobileDragState = null;
}

// بيربط كارت بضغطة عادية (فتح/تحديد) وضغطة طويلة (دخول وضع التحديد) وسحب
// (ترتيب) — بنفس منطق الجيستشرز المستخدم في المعرض (gallery.js)
function enableSavedMediaCardGestures(card, item, { onTap, onLongPress }) {
  let startX = 0;
  let startY = 0;
  let longPressTimer = null;
  let longPressFired = false;
  let dragging = false;
  let moved = false;
  let touchHandled = false;
  let skipGesture = false;

  const TAP_MOVE_THRESHOLD = 24;

  const clearLongPressTimer = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  card.addEventListener("touchstart", (event) => {
    // زرار الحذف بيعالج نفسه لوحده — من غير الشرط ده، اللمسة عليه هتفتح
    // المعاينة أو تعمل تحديد في نفس اللحظة قبل ما stopPropagation بتاعه يشتغل
    skipGesture = Boolean(event.target.closest(".saved-media-item-delete"));
    if (skipGesture) return;

    if (event.touches.length !== 1) return;

    const t = event.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    longPressFired = false;
    dragging = false;
    moved = false;
    touchHandled = true;

    longPressTimer = setTimeout(() => {
      longPressFired = true;
      if (navigator.vibrate) navigator.vibrate(15);
    }, 500);
  }, { passive: true });

  card.addEventListener("touchmove", (event) => {
    if (skipGesture) return;

    const t = event.touches[0];
    const dist = Math.hypot(t.clientX - startX, t.clientY - startY);

    if (!longPressFired) {
      if (dist > TAP_MOVE_THRESHOLD) {
        moved = true;
        clearLongPressTimer();
      }
      return;
    }

    if (!dragging && dist > 6 && savedMediaCanManage && !savedMediaSelectMode) {
      dragging = true;
      startSavedMediaMobileDrag(item.id, card, t.clientX, t.clientY);
    }

    if (dragging) {
      updateSavedMediaMobileDrag(t.clientX, t.clientY);
    }

    event.preventDefault();
  }, { passive: false });

  card.addEventListener("touchend", (event) => {
    if (skipGesture) {
      skipGesture = false;
      return;
    }

    // بنمنع المتصفح إنه يولّد حدث click اصطناعي بعد اللمسة — من غيره، لو
    // onTap فتح أوفرلاي فيه زرار "تأكيد الإرسال" في نفس مكان اللمسة بالظبط،
    // الـ click الاصطناعي بيوصل للزرار ده على طول ويبعت للعميل من غير قصد
    event.preventDefault();

    clearLongPressTimer();

    if (dragging) {
      const t = event.changedTouches[0];
      endSavedMediaMobileDrag(t.clientX, t.clientY);
      dragging = false;
      return;
    }

    if (moved) return;

    if (longPressFired) {
      onLongPress?.();
      return;
    }

    onTap?.();
  });

  card.addEventListener("touchcancel", () => {
    if (skipGesture) {
      skipGesture = false;
      return;
    }

    clearLongPressTimer();
    if (dragging) {
      cancelSavedMediaMobileDrag();
      dragging = false;
    }
  });

  card.addEventListener("click", (event) => {
    if (event.target.closest(".saved-media-item-delete")) return;

    if (touchHandled) {
      touchHandled = false;
      return;
    }

    if (mouseLongPressFired) {
      mouseLongPressFired = false;
      return;
    }

    onTap?.();
  });

  // نفس فكرة الضغطة الطويلة بس بالماوس (ديسكتوب) — بنلغيها فورًا لو سحب
  // حقيقي بدأ (dragstart) عشان ما تتعارضش مع سحب-وإفلات الترتيب
  let mouseLongPressTimer = null;
  let mouseLongPressFired = false;

  const clearMouseLongPressTimer = () => {
    if (mouseLongPressTimer) {
      clearTimeout(mouseLongPressTimer);
      mouseLongPressTimer = null;
    }
  };

  card.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest(".saved-media-item-delete")) return;

    mouseLongPressFired = false;

    mouseLongPressTimer = setTimeout(() => {
      mouseLongPressTimer = null;
      mouseLongPressFired = true;
      onLongPress?.();
    }, 500);
  });

  card.addEventListener("mouseup", clearMouseLongPressTimer);
  card.addEventListener("mouseleave", clearMouseLongPressTimer);

  // -webkit-touch-callout بيمنع قايمة "حفظ الصورة" على آيفون بس — أندرويد
  // بيحتاج منع حدث contextmenu نفسه عشان نفس القايمة ما تظهرش
  card.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  card.draggable = savedMediaCanManage && !savedMediaSelectMode;

  card.addEventListener("dragstart", (event) => {
    if (event.target.closest(".saved-media-item-delete")) {
      event.preventDefault();
      return;
    }

    clearMouseLongPressTimer();
    event.stopPropagation();
    event.dataTransfer.setData(SAVED_MEDIA_DRAG_MIME, String(item.id));
    event.dataTransfer.effectAllowed = "move";
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  card.addEventListener("dragover", (event) => {
    if (!savedMediaCanManage || !event.dataTransfer.types.includes(SAVED_MEDIA_DRAG_MIME)) return;
    event.preventDefault();

    const atStart = isPointerAtCardStart(event.clientX, card.getBoundingClientRect());
    card.classList.toggle("drop-before", atStart);
    card.classList.toggle("drop-after", !atStart);
  });

  card.addEventListener("dragleave", () => {
    card.classList.remove("drop-before", "drop-after");
  });

  card.addEventListener("drop", (event) => {
    if (!savedMediaCanManage || !event.dataTransfer.types.includes(SAVED_MEDIA_DRAG_MIME)) return;
    event.preventDefault();
    event.stopPropagation();

    const atStart = isPointerAtCardStart(event.clientX, card.getBoundingClientRect());
    card.classList.remove("drop-before", "drop-after");

    const draggedId = Number(event.dataTransfer.getData(SAVED_MEDIA_DRAG_MIME));
    if (draggedId) reorderSavedMediaItem(draggedId, item, !atStart);
  });
}

function renderSavedMediaItems() {
  if (!savedMediaGridEl) return;

  savedMediaGridEl.innerHTML = "";
  savedMediaGridEl.classList.toggle("select-mode", savedMediaSelectMode);

  if (!savedMediaItems.length) {
    const empty = document.createElement("div");
    empty.className = "saved-media-empty";
    empty.textContent = savedMediaCanManage
      ? "لا يوجد وسائط في الفولدر ده. اضغط + للإضافة."
      : "لا يوجد وسائط في الفولدر ده.";
    savedMediaGridEl.appendChild(empty);
    return;
  }

  savedMediaItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "saved-media-item-card";
    card.dataset.id = item.id;

    if (savedMediaSelectedIds.has(item.id)) {
      card.classList.add("selected");
    }

    const preview = document.createElement("div");
    preview.className = "saved-media-item-preview";

    const img = document.createElement("img");
    img.src = item.thumbnail_url || item.media_url;
    img.alt = "";
    preview.appendChild(img);

    card.appendChild(preview);

    enableSavedMediaCardGestures(card, item, {
      onTap: () => {
        if (savedMediaSelectMode) {
          toggleSavedMediaSelection(item.id);
        } else {
          openSavedMediaPreview(item);
        }
      },
      onLongPress: () => {
        if (savedMediaSelectMode) {
          toggleSavedMediaSelection(item.id);
        } else {
          enterSavedMediaSelectMode(item.id);
        }
      }
    });

    if (item.media_kind === "video") {
      const badge = document.createElement("div");
      badge.className = "saved-media-item-video-badge";
      badge.textContent = "▶";
      card.appendChild(badge);
    }

    const check = document.createElement("div");
    check.className = "saved-media-item-check";
    check.textContent = "✓";
    card.appendChild(check);

    if (savedMediaCanManage) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "saved-media-item-delete";
      deleteBtn.textContent = "🗑";
      deleteBtn.setAttribute("aria-label", "حذف");
      deleteBtn.draggable = false;
      deleteBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        if (!confirm("حذف هذا الملف من الفولدر؟")) return;

        try {
          await deleteSavedMediaItem(item.id);
          await loadSavedMediaItems();
        } catch (error) {
          console.error(error);
          alert(error.message || "حدث خطأ، حاول مرة أخرى");
        }
      });

      card.appendChild(deleteBtn);
    }

    savedMediaGridEl.appendChild(card);
  });
}

function toggleSavedMediaSelection(id) {
  if (savedMediaSelectedIds.has(id)) {
    savedMediaSelectedIds.delete(id);
  } else {
    savedMediaSelectedIds.add(id);
  }

  renderSavedMediaItems();
  updateSelectionBar();
}

function updateSelectionBar() {
  const count = savedMediaSelectedIds.size;

  if (selectionCountTextEl) {
    selectionCountTextEl.textContent = `تم تحديد ${count}`;
  }

  if (sendSelectedBtnEl) {
    sendSelectedBtnEl.disabled = count === 0;
  }
}

function enterSavedMediaSelectMode(initialId = null) {
  savedMediaSelectMode = true;
  savedMediaSelectedIds = new Set(initialId ? [initialId] : []);
  toggleSelectModeBtnEl?.classList.add("active");
  if (toggleSelectModeBtnEl) toggleSelectModeBtnEl.textContent = "إلغاء التحديد";
  sendFolderBarEl?.classList.add("hidden");
  selectionBarEl?.classList.remove("hidden");
  updateSelectionBar();
  renderSavedMediaItems();
}

function exitSavedMediaSelectMode() {
  savedMediaSelectMode = false;
  savedMediaSelectedIds = new Set();
  toggleSelectModeBtnEl?.classList.remove("active");
  if (toggleSelectModeBtnEl) toggleSelectModeBtnEl.textContent = "تحديد";
  selectionBarEl?.classList.add("hidden");
  sendFolderBarEl?.classList.toggle("hidden", savedMediaItems.length === 0);
  renderSavedMediaItems();
}

async function loadSavedMediaFolders() {
  if (!savedMediaGridEl) return;

  savedMediaGridEl.innerHTML =
    '<div class="saved-media-empty">جاري التحميل...</div>';

  try {
    const { folders, canManage } = await fetchSavedMediaFolders();
    savedMediaFolders = folders;
    savedMediaCanManage = canManage;
    renderSavedMediaFolders();
  } catch (error) {
    console.error(error);
    savedMediaGridEl.innerHTML =
      '<div class="saved-media-empty">تعذر تحميل الفولدرات</div>';
  }

  addSavedMediaBtnEl?.classList.toggle("hidden", !savedMediaCanManage);
}

async function loadSavedMediaItems() {
  if (!savedMediaGridEl || !savedMediaCurrentFolder) return;

  savedMediaGridEl.innerHTML =
    '<div class="saved-media-empty">جاري التحميل...</div>';

  try {
    const { items, canManage } = await fetchSavedMediaItems(
      savedMediaCurrentFolder.id
    );
    savedMediaItems = items;
    savedMediaCanManage = canManage;
    renderSavedMediaItems();
  } catch (error) {
    console.error(error);
    savedMediaGridEl.innerHTML =
      '<div class="saved-media-empty">تعذر تحميل الوسائط</div>';
  }

  addSavedMediaBtnEl?.classList.toggle("hidden", !savedMediaCanManage);
  toggleSelectModeBtnEl?.classList.toggle("hidden", savedMediaItems.length === 0);

  if (!savedMediaSelectMode) {
    sendFolderBarEl?.classList.toggle("hidden", savedMediaItems.length === 0);
  }
}

function showSavedMediaFoldersView() {
  savedMediaView = "folders";
  savedMediaCurrentFolder = null;
  savedMediaBackBtnEl?.classList.add("hidden");
  toggleSelectModeBtnEl?.classList.add("hidden");
  sendFolderBarEl?.classList.add("hidden");
  selectionBarEl?.classList.add("hidden");
  savedMediaSelectMode = false;
  savedMediaSelectedIds = new Set();
  if (toggleSelectModeBtnEl) {
    toggleSelectModeBtnEl.classList.remove("active");
    toggleSelectModeBtnEl.textContent = "تحديد";
  }
  if (savedMediaTitleEl) savedMediaTitleEl.textContent = "الوسائط المحفوظة";
  closeFolderForm();
  loadSavedMediaFolders();
}

function openSavedMediaFolder(id, name) {
  savedMediaView = "items";
  savedMediaCurrentFolder = { id, name };
  savedMediaBackBtnEl?.classList.remove("hidden");
  savedMediaSelectMode = false;
  savedMediaSelectedIds = new Set();
  if (toggleSelectModeBtnEl) {
    toggleSelectModeBtnEl.classList.remove("active");
    toggleSelectModeBtnEl.textContent = "تحديد";
  }
  selectionBarEl?.classList.add("hidden");
  if (savedMediaTitleEl) savedMediaTitleEl.textContent = name;
  loadSavedMediaItems();
}

function openFolderForm(folder) {
  savedMediaFolderEditingId = folder ? folder.id : null;
  if (folderNameInputEl) folderNameInputEl.value = folder ? folder.name : "";
  addFolderFormEl?.classList.remove("hidden");
  folderNameInputEl?.focus();
}

function closeFolderForm() {
  savedMediaFolderEditingId = null;
  if (folderNameInputEl) folderNameInputEl.value = "";
  addFolderFormEl?.classList.add("hidden");
}

function openSavedMedia() {
  closeEmojiPicker();
  closeQuickActions();
  savedMediaOverlayEl?.classList.remove("hidden");
  document.body.classList.add("saved-media-open");
  showSavedMediaFoldersView();
}

function closeSavedMedia() {
  savedMediaOverlayEl?.classList.add("hidden");
  document.body.classList.remove("saved-media-open");
  closeFolderForm();
}

// تكبير بإصباعين (Pinch) وتحريك الصورة وهي مكبّرة — الصفحة كلها مضبوطة
// user-scalable=no عشان الواجهة ما تتكبرش بالغلط، فالتكبير هنا بنعمله
// يدويًا بـ transform على الصورة نفسها بس
function enablePinchZoom(imgEl) {
  const pointers = new Map();
  let scale = 1;
  let baseScale = 1;
  let initialDistance = 0;
  let panX = 0;
  let panY = 0;
  let panStartX = 0;
  let panStartY = 0;
  let isPanning = false;

  const applyTransform = () => {
    imgEl.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  };

  const getPoints = () => [...pointers.values()];

  imgEl.addEventListener("pointerdown", (event) => {
    imgEl.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1) {
      isPanning = scale > 1;
      panStartX = event.clientX - panX;
      panStartY = event.clientY - panY;
    } else if (pointers.size === 2) {
      isPanning = false;
      const [p1, p2] = getPoints();
      initialDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
      baseScale = scale;
    }
  });

  imgEl.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 2) {
      const [p1, p2] = getPoints();
      const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      scale = Math.min(4, Math.max(1, baseScale * (distance / initialDistance)));
      applyTransform();
    } else if (pointers.size === 1 && isPanning) {
      panX = event.clientX - panStartX;
      panY = event.clientY - panStartY;
      applyTransform();
    }
  });

  const endPointer = (event) => {
    pointers.delete(event.pointerId);

    if (pointers.size === 0 && scale <= 1) {
      scale = 1;
      panX = 0;
      panY = 0;
      applyTransform();
    }
  };

  imgEl.addEventListener("pointerup", endPointer);
  imgEl.addEventListener("pointercancel", endPointer);

  imgEl.addEventListener("dblclick", () => {
    scale = scale > 1 ? 1 : 2;
    panX = 0;
    panY = 0;
    applyTransform();
  });
}

function openSavedMediaPreview(item) {
  savedMediaPreviewItem = item;

  if (savedMediaPreviewBodyEl) {
    savedMediaPreviewBodyEl.innerHTML = "";

    if (item.media_kind === "video") {
      const video = document.createElement("video");
      video.src = item.media_url;
      video.controls = true;
      video.playsInline = true;
      savedMediaPreviewBodyEl.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = item.media_url;
      img.alt = "";
      savedMediaPreviewBodyEl.appendChild(img);
      enablePinchZoom(img);
    }
  }

  savedMediaPreviewOverlayEl?.classList.remove("hidden");
}

function closeSavedMediaPreview() {
  savedMediaPreviewItem = null;
  savedMediaPreviewOverlayEl?.classList.add("hidden");
  if (savedMediaPreviewBodyEl) savedMediaPreviewBodyEl.innerHTML = "";
}

savedMediaBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();

  if (!activeSessionId) {
    alert("اختر محادثة أولًا");
    return;
  }

  openSavedMedia();
});

savedMediaOverlayEl?.addEventListener("click", (event) => {
  if (event.target === savedMediaOverlayEl) closeSavedMedia();
});

closeSavedMediaBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeSavedMedia();
});

savedMediaBackBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  showSavedMediaFoldersView();
});

addSavedMediaBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();

  if (savedMediaView === "folders") {
    openFolderForm(null);
  } else if (savedMediaCurrentFolder) {
    savedMediaFileInputEl?.click();
  }
});

cancelFolderFormBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeFolderForm();
});

saveFolderFormBtnEl?.addEventListener("click", async (event) => {
  event.stopPropagation();

  const name = folderNameInputEl?.value.trim();
  if (!name) return;

  saveFolderFormBtnEl.disabled = true;

  try {
    if (savedMediaFolderEditingId) {
      await renameSavedMediaFolder(savedMediaFolderEditingId, name);
    } else {
      await createSavedMediaFolder(name);
    }

    closeFolderForm();
    await loadSavedMediaFolders();
  } catch (error) {
    console.error(error);
    alert(error.message || "حدث خطأ، حاول مرة أخرى");
  } finally {
    saveFolderFormBtnEl.disabled = false;
  }
});

savedMediaFileInputEl?.addEventListener("change", async () => {
  const files = Array.from(savedMediaFileInputEl.files || []);
  savedMediaFileInputEl.value = "";

  if (!files.length || !savedMediaCurrentFolder) return;

  addSavedMediaBtnEl.disabled = true;

  const total = files.length;
  const toast = createMediaProgressToast({
    label: `جاري رفع الملف 1 من ${total}`
  });

  let uploaded = 0;
  const failReasons = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    toast.setLabel(`جاري رفع الملف ${i + 1} من ${total}`);
    toast.update(0);

    try {
      // نفس الضغط المستخدم مع الصور المبعوتة عن طريق دبوس الإرفاق
      // (تحويل لـ JPEG بجودة 92%) عشان الصور المحفوظة توصل للعميل بنفس الطريقة
      const uploadFile = file.type.startsWith("image/")
        ? await normalizeImageFile(file)
        : file;

      await uploadSavedMediaItem(
        savedMediaCurrentFolder.id,
        uploadFile,
        (percent) => toast.update(percent)
      );

      uploaded++;
    } catch (error) {
      console.error(error);
      failReasons.push(`${file.name}: ${error.message || "خطأ غير معروف"}`);
    }
  }

  toast.remove();
  addSavedMediaBtnEl.disabled = false;
  await loadSavedMediaItems();

  if (failReasons.length) {
    alert(
      `تم رفع ${uploaded} من ${files.length}، وفشل رفع ${failReasons.length}:\n` +
      failReasons.join("\n")
    );
  }
});

sendFolderBtnEl?.addEventListener("click", async (event) => {
  event.stopPropagation();

  if (!savedMediaCurrentFolder || !activeSessionId) return;
  const targetSessionId = activeSessionId;
  const folderId = savedMediaCurrentFolder.id;

  if (
    !confirm(
      `إرسال كل محتوى "${savedMediaCurrentFolder.name}" (${savedMediaItems.length} عنصر) للعميل؟`
    )
  ) {
    return;
  }

  sendFolderBtnEl.disabled = true;
  sendFolderBtnEl.textContent = "جاري الإرسال...";

  closeSavedMedia();
  sendFolderBtnEl.disabled = false;
  sendFolderBtnEl.textContent = "إرسال كل محتوى الفولدر للعميل";

  enqueueSessionSend(targetSessionId, "media", async () => {
    const start = await sendSavedMediaFolderToCustomer(folderId, targetSessionId);
    const result = await trackSendMediaJob(start.jobId, start.total, targetSessionId);
    if (result?.failed) {
      const reasons = Array.isArray(result.failReasons) && result.failReasons.length
        ? "\n" + result.failReasons.join("\n")
        : "";
      alert(`تم إرسال ${result.sent} من ${result.total}، وفشل إرسال ${result.failed}${reasons}`);
    }
    return result;
  }).catch((error) => {
    console.error(error);
    alert(error.message || "حدث خطأ أثناء الإرسال");
  });
});

toggleSelectModeBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();

  if (savedMediaSelectMode) {
    exitSavedMediaSelectMode();
  } else {
    enterSavedMediaSelectMode();
  }
});

cancelSelectionBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  exitSavedMediaSelectMode();
});

sendSelectedBtnEl?.addEventListener("click", async (event) => {
  event.stopPropagation();

  const ids = [...savedMediaSelectedIds];
  if (!ids.length || !activeSessionId) return;
  const targetSessionId = activeSessionId;

  if (!confirm(`إرسال ${ids.length} عنصر محدد للعميل؟`)) return;

  sendSelectedBtnEl.disabled = true;
  sendSelectedBtnEl.textContent = "جاري الإرسال...";

  closeSavedMedia();
  sendSelectedBtnEl.disabled = false;
  sendSelectedBtnEl.textContent = "إرسال المحدد";

  enqueueSessionSend(targetSessionId, "media", async () => {
    const start = await sendSelectedSavedMediaItemsToCustomer(ids, targetSessionId);
    const result = await trackSendMediaJob(start.jobId, start.total, targetSessionId);
    if (result?.failed) {
      const reasons = Array.isArray(result.failReasons) && result.failReasons.length
        ? "\n" + result.failReasons.join("\n")
        : "";
      alert(`تم إرسال ${result.sent} من ${result.total}، وفشل إرسال ${result.failed}${reasons}`);
    }
    return result;
  }).catch((error) => {
    console.error(error);
    alert(error.message || "حدث خطأ أثناء الإرسال");
  });
});

closeSavedMediaPreviewBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeSavedMediaPreview();
});

cancelSavedMediaSendBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeSavedMediaPreview();
});

savedMediaPreviewOverlayEl?.addEventListener("click", (event) => {
  if (event.target === savedMediaPreviewOverlayEl) closeSavedMediaPreview();
});

confirmSavedMediaSendBtnEl?.addEventListener("click", async (event) => {
  event.stopPropagation();

  if (!savedMediaPreviewItem || !activeSessionId) return;
  const targetSessionId = activeSessionId;
  const itemId = savedMediaPreviewItem.id;

  confirmSavedMediaSendBtnEl.disabled = true;

  closeSavedMediaPreview();
  closeSavedMedia();
  confirmSavedMediaSendBtnEl.disabled = false;

  enqueueSessionSend(targetSessionId, "media", async () => {
    const start = await sendSavedMediaItemToCustomer(itemId, targetSessionId);
    const result = await trackSendMediaJob(start.jobId, start.total, targetSessionId);
    if (result?.failed) {
      alert(
        (Array.isArray(result.failReasons) && result.failReasons[0]) ||
        "حدث خطأ أثناء الإرسال"
      );
    }
    return result;
  }).catch((error) => {
    console.error(error);
    alert(error.message || "حدث خطأ أثناء الإرسال");
  });
});

const LABEL_COLOR_PALETTE = [
  "#54105b", "#c5a66d", "#00a884", "#e53935",
  "#1e88e5", "#f39c12", "#8e44ad", "#16a085"
];

let allLabelsCache = [];
let labelsCanManage = false;
let conversationLabelsCache = [];
let labelEditingId = null;
let labelSelectedColor = LABEL_COLOR_PALETTE[0];
let activeLabelFilterId = null;
const CHANNEL_FILTER_STORAGE_KEY = "dashboard_channel_filter";
const validChannelFilters = new Set(["all", "whatsapp", "messenger"]);
const savedChannelFilter = localStorage.getItem(CHANNEL_FILTER_STORAGE_KEY);
let activeChannelFilter = validChannelFilters.has(savedChannelFilter)
  ? savedChannelFilter
  : "all";
const UNREAD_FILTER_STORAGE_KEY = "dashboard_unread_filter";
const validUnreadFilters = new Set(["all", "unread"]);
const savedUnreadFilter = localStorage.getItem(UNREAD_FILTER_STORAGE_KEY);
let activeUnreadFilter = validUnreadFilters.has(savedUnreadFilter)
  ? savedUnreadFilter
  : "all";

function renderChannelFilter() {
  channelFilterBarEl?.querySelectorAll(".channel-filter-btn").forEach((button) => {
    const isActive = button.dataset.channel === activeChannelFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

channelFilterBarEl?.addEventListener("click", (event) => {
  const button = event.target.closest(".channel-filter-btn");
  if (!button || !channelFilterBarEl.contains(button)) return;

  const nextFilter = String(button.dataset.channel || "all");
  if (!validChannelFilters.has(nextFilter)) return;

  activeChannelFilter = nextFilter;
  localStorage.setItem(CHANNEL_FILTER_STORAGE_KEY, activeChannelFilter);
  renderChannelFilter();
  applyConversationFilters();
});

renderChannelFilter();

function renderUnreadFilter() {
  unreadFilterBarEl?.querySelectorAll(".unread-filter-btn").forEach((button) => {
    const isActive = button.dataset.unread === activeUnreadFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateUnreadFilterCount() {
  if (!unreadFilterCountEl) return;

  const total = conversationsData.filter(
    (conversation) => Number(conversation.unread_count || 0) > 0
  ).length;

  unreadFilterCountEl.textContent = total > 99 ? "99+" : String(total);
}

unreadFilterBarEl?.addEventListener("click", (event) => {
  const button = event.target.closest(".unread-filter-btn");
  if (!button || !unreadFilterBarEl.contains(button)) return;

  const nextFilter = String(button.dataset.unread || "all");
  if (!validUnreadFilters.has(nextFilter)) return;

  activeUnreadFilter = nextFilter;
  localStorage.setItem(UNREAD_FILTER_STORAGE_KEY, activeUnreadFilter);
  renderUnreadFilter();
  applyConversationFilters();
});

renderUnreadFilter();

async function fetchAllLabels() {
  const response = await fetch(`${API_BASE}/labels`, {
    headers: getAuthHeaders()
  });

  if (handleInvalidToken(response)) return { labels: [], canManage: false };

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Failed to load labels");
  }

  return {
    labels: Array.isArray(data.labels) ? data.labels : [],
    canManage: !!data.canManage
  };
}

async function fetchConversationLabels(sessionId) {
  const response = await fetch(
    `${API_BASE}/conversations/${encodeURIComponent(sessionId)}/labels`,
    { headers: getAuthHeaders() }
  );

  if (handleInvalidToken(response)) return [];

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Failed to load conversation labels");
  }

  return Array.isArray(data.labels) ? data.labels : [];
}

async function createLabel(name, color) {
  const response = await fetch(`${API_BASE}/labels`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, color })
  });

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل إنشاء الليبل");
  }
}

async function updateLabel(id, name, color) {
  const response = await fetch(`${API_BASE}/labels/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, color })
  });

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل تعديل الليبل");
  }
}

async function deleteLabel(id) {
  const response = await fetch(`${API_BASE}/labels/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل حذف الليبل");
  }
}

async function attachLabelToConversation(sessionId, labelId) {
  const response = await fetch(
    `${API_BASE}/conversations/${encodeURIComponent(sessionId)}/labels`,
    {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ labelId })
    }
  );

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل إضافة الليبل");
  }
}

async function detachLabelFromConversation(sessionId, labelId) {
  const response = await fetch(
    `${API_BASE}/conversations/${encodeURIComponent(sessionId)}/labels/${labelId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders()
    }
  );

  if (handleInvalidToken(response)) return;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "فشل إزالة الليبل");
  }
}

function renderChatLabelsRow() {
  if (!chatLabelsRowEl) return;

  chatLabelsRowEl.innerHTML = conversationLabelsCache
    .map(
      (label) =>
        `<span class="chat-label-chip" style="background:${escapeHtml(
          label.color || "#54105b"
        )}">${escapeHtml(label.name)}</span>`
    )
    .join("");
}

function renderLabelsList() {
  if (!labelsListEl) return;

  labelsListEl.innerHTML = "";
  addLabelBtnEl?.classList.toggle("hidden", !labelsCanManage);

  if (!allLabelsCache.length) {
    const empty = document.createElement("div");
    empty.className = "labels-empty";
    empty.textContent = labelsCanManage
      ? "لا يوجد ليبلز بعد. اضغط + لإضافة أول ليبل."
      : "لا يوجد ليبلز متاحة.";
    labelsListEl.appendChild(empty);
    return;
  }

  const attachedIds = new Set(conversationLabelsCache.map((l) => l.id));

  allLabelsCache.forEach((label) => {
    const row = document.createElement("div");
    row.className = "label-row";
    if (attachedIds.has(label.id)) row.classList.add("attached");

    const dot = document.createElement("div");
    dot.className = "label-color-dot";
    dot.style.background = label.color || "#54105b";

    const name = document.createElement("div");
    name.className = "label-row-name";
    name.textContent = label.name;

    const check = document.createElement("div");
    check.className = "label-row-check";
    check.textContent = "✓";

    row.appendChild(dot);
    row.appendChild(name);
    row.appendChild(check);

    row.addEventListener("click", async () => {
      if (!activeSessionId) return;

      const isAttached = attachedIds.has(label.id);

      try {
        if (isAttached) {
          await detachLabelFromConversation(activeSessionId, label.id);
        } else {
          await attachLabelToConversation(activeSessionId, label.id);
        }

        await refreshConversationLabels();
        loadConversations();
      } catch (error) {
        console.error(error);
        alert(error.message || "حدث خطأ، حاول مرة أخرى");
      }
    });

    if (labelsCanManage) {
      const actions = document.createElement("div");
      actions.className = "label-row-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "label-edit";
      editBtn.textContent = "✎";
      editBtn.setAttribute("aria-label", "تعديل");
      editBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openLabelForm(label);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "label-delete";
      deleteBtn.textContent = "🗑";
      deleteBtn.setAttribute("aria-label", "حذف");
      deleteBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        if (!confirm(`حذف ليبل "${label.name}" من كل المحادثات؟`)) return;

        try {
          await deleteLabel(label.id);
          await refreshAllLabels();
          await refreshConversationLabels();
          loadConversations();
        } catch (error) {
          console.error(error);
          alert(error.message || "حدث خطأ، حاول مرة أخرى");
        }
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      row.appendChild(actions);
    }

    labelsListEl.appendChild(row);
  });
}

async function refreshAllLabels() {
  try {
    const { labels, canManage } = await fetchAllLabels();
    allLabelsCache = labels;
    labelsCanManage = canManage;
    renderLabelsList();
    renderLabelFilterRow();
  } catch (error) {
    console.error(error);
  }
}

function renderLabelFilterRow() {
  if (!labelFilterRowEl) return;

  if (!allLabelsCache.length) {
    labelFilterRowEl.innerHTML = "";
    return;
  }

  const allChip = `<button type="button" class="label-filter-chip${
    activeLabelFilterId === null ? " active" : ""
  }" data-label-id="">الكل</button>`;

  const labelChips = allLabelsCache
    .map(
      (label) =>
        `<button type="button" class="label-filter-chip${
          activeLabelFilterId === label.id ? " active" : ""
        }" data-label-id="${label.id}">
          <span class="label-filter-dot" style="background:${escapeHtml(
            label.color || "#54105b"
          )}"></span>${escapeHtml(label.name)}
        </button>`
    )
    .join("");

  labelFilterRowEl.innerHTML = allChip + labelChips;

  labelFilterRowEl.querySelectorAll(".label-filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const id = chip.dataset.labelId;
      activeLabelFilterId = id ? Number(id) : null;
      renderLabelFilterRow();
      applyConversationFilters();
    });
  });
}

// نص الاختصار في قايمة المحادثات فقط — مش بيتبعت لواتساب أبدًا، مجرد
// عرض داخلي لما آخر رسالة (صورة/فيديو...) تكون من غير كابشن مكتوب
function getConversationPreviewText(conv) {
  if (conv.content) return conv.content;

  switch (conv.message_kind) {
    case "image": return "📷 صورة";
    case "video": return "🎥 فيديو";
    case "audio": return "🎙️ رسالة صوتية";
    case "sticker": return "🖼️ ملصق";
    case "document": return "📄 ملف";
    default: return "";
  }
}

function applyConversationFilters() {
  updateUnreadFilterCount();

  const value = searchInputEl.value.trim().toLowerCase();
  let filtered = conversationsData;

  if (activeChannelFilter !== "all") {
    filtered = filtered.filter((conv) => {
      const sessionId = String(conv.session_id || "");
      const inferredChannel = sessionId.startsWith("fb:")
        ? "messenger"
        : "whatsapp";
      const channel = String(conv.channel || inferredChannel).toLowerCase();

      return activeChannelFilter === "messenger"
        ? channel === "messenger" || sessionId.startsWith("fb:")
        : channel === "whatsapp" || !sessionId.startsWith("fb:");
    });
  }

  if (activeUnreadFilter === "unread") {
    filtered = filtered.filter((conv) => Number(conv.unread_count || 0) > 0);
  }

  if (activeLabelFilterId !== null) {
    filtered = filtered.filter(
      (conv) =>
        Array.isArray(conv.labels) &&
        conv.labels.some((l) => l.id === activeLabelFilterId)
    );
  }

  if (value) {
    filtered = filtered.filter(
      (conv) =>
        String(conv.session_id || "").toLowerCase().includes(value) ||
        String(conv.content || "").toLowerCase().includes(value)
    );
  }

  renderConversations(filtered);
}

let sessionsSelectMode = false;
let selectedSessionIds = new Set();
let viewingHiddenConversations = false;

function decodeAuthToken() {
  try {
    const payloadPart = String(authToken || "").split(".")[1];
    if (!payloadPart) return null;

    const normalized = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      "="
    );

    return JSON.parse(atob(padded));
  } catch (error) {
    return null;
  }
}

function getCurrentUserRole() {
  return decodeAuthToken()?.role || "";
}

function applyRolePermissionsToUI() {
  const role = getCurrentUserRole();

  // إخفاء المحادثات وشاشة المحادثات المخفية للأدمن بس
  viewHiddenBtnEl?.classList.toggle("hidden", role !== "admin");
  sessionsSelectionHideBtnEl?.classList.toggle("hidden", role !== "admin");
  openGalleryBtnEl?.classList.toggle("hidden", role !== "admin");
}

openGalleryBtnEl?.addEventListener("click", () => {
  window.location.href = "/gallery.html";
});

function renderCurrentUserInfo() {
  if (currentUserNameEl) currentUserNameEl.textContent = getCurrentSenderName();

  const role = getCurrentUserRole();

  if (currentUserRoleEl) {
    currentUserRoleEl.textContent =
      role === "admin" ? "أدمن" : role ? "إيجنت" : "";
  }

  applyRolePermissionsToUI();
}

function openConversationsMenu() {
  renderCurrentUserInfo();
  conversationsMenuPanelEl?.classList.remove("hidden");
}

function closeConversationsMenu() {
  conversationsMenuPanelEl?.classList.add("hidden");
}

conversationsMenuBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  const willOpen = conversationsMenuPanelEl?.classList.contains("hidden");
  closeConversationsMenu();
  if (willOpen) openConversationsMenu();
});

conversationsMenuPanelEl?.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", closeConversationsMenu);

logoutBtnEl?.addEventListener("click", () => {
  closeConversationsMenu();
  logout();
});

function updateSessionsSelectionBar() {
  if (sessionsSelectionCountEl) {
    sessionsSelectionCountEl.textContent = `تم تحديد ${selectedSessionIds.size}`;
  }
}

function enterSessionsSelectMode() {
  sessionsSelectMode = true;
  selectedSessionIds = new Set();
  sessionsSelectionBarEl?.classList.remove("hidden");
  updateSessionsSelectionBar();
  applyConversationFilters();
}

function exitSessionsSelectMode() {
  sessionsSelectMode = false;
  selectedSessionIds = new Set();
  sessionsSelectionBarEl?.classList.add("hidden");
  bulkLabelPickerEl?.classList.add("hidden");
  applyConversationFilters();
}

toggleSessionSelectBtnEl?.addEventListener("click", () => {
  closeConversationsMenu();

  if (sessionsSelectMode) {
    exitSessionsSelectMode();
  } else {
    enterSessionsSelectMode();
  }
});

sessionsSelectionCancelBtnEl?.addEventListener("click", () => {
  exitSessionsSelectMode();
});

sessionsSelectionSelectAllBtnEl?.addEventListener("click", () => {
  const items = [...conversationsEl.querySelectorAll(".session-item")];

  items.forEach((item) => {
    selectedSessionIds.add(item.dataset.sessionId);
    item.classList.add("selected");
  });

  updateSessionsSelectionBar();
});

async function hideConversationsRequest(sessionIds) {
  await fetch(`${API_BASE}/conversations/hide`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ sessionIds })
  });
}

async function unhideConversationsRequest(sessionIds) {
  await fetch(`${API_BASE}/conversations/unhide`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ sessionIds })
  });
}

async function markConversationsReadBatchRequest(sessionIds) {
  await fetch(`${API_BASE}/conversations/mark-read-batch`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ sessionIds })
  });
}

async function assignLabelBatchRequest(labelId, sessionIds) {
  await fetch(`${API_BASE}/labels/${labelId}/assign-batch`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ sessionIds })
  });
}

async function unassignLabelBatchRequest(labelId, sessionIds) {
  await fetch(`${API_BASE}/labels/${labelId}/unassign-batch`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ sessionIds })
  });
}

sessionsSelectionHideBtnEl?.addEventListener("click", async () => {
  if (!selectedSessionIds.size) return;
  if (!confirm(`إخفاء ${selectedSessionIds.size} محادثة من القايمة؟`)) return;

  try {
    await hideConversationsRequest([...selectedSessionIds]);
    exitSessionsSelectMode();
    loadConversations();
  } catch (error) {
    console.error(error);
    alert("حدث خطأ، حاول مرة أخرى");
  }
});

sessionsSelectionReadBtnEl?.addEventListener("click", async () => {
  if (!selectedSessionIds.size) return;

  try {
    await markConversationsReadBatchRequest([...selectedSessionIds]);

    selectedSessionIds.forEach((sessionId) => {
      const conv = conversationsData.find((c) => c.session_id === sessionId);
      if (conv) conv.unread_count = 0;
      dismissNotificationsForSession(sessionId);
    });

    exitSessionsSelectMode();
  } catch (error) {
    console.error(error);
    alert("حدث خطأ، حاول مرة أخرى");
  }
});

sessionsSelectionLabelBtnEl?.addEventListener("click", () => {
  if (!selectedSessionIds.size) return;
  renderBulkLabelPicker();
  bulkLabelPickerEl?.classList.remove("hidden");
});

bulkLabelPickerCancelBtnEl?.addEventListener("click", () => {
  bulkLabelPickerEl?.classList.add("hidden");
});

function renderBulkLabelPicker() {
  if (!bulkLabelPickerListEl) return;

  bulkLabelPickerListEl.innerHTML = "";

  if (!allLabelsCache.length) {
    bulkLabelPickerListEl.innerHTML =
      '<div class="labels-empty">لا يوجد ليبلز متاحة</div>';
    return;
  }

  const selectedIds = [...selectedSessionIds];

  allLabelsCache.forEach((label) => {
    const allHaveLabel =
      selectedIds.length > 0 &&
      selectedIds.every((sid) => {
        const conv = conversationsData.find((c) => c.session_id === sid);
        return (
          Array.isArray(conv?.labels) &&
          conv.labels.some((l) => l.id === label.id)
        );
      });

    const btn = document.createElement("button");
    btn.type = "button";
    if (allHaveLabel) btn.classList.add("attached");
    btn.innerHTML = `<span class="label-filter-dot" style="background:${escapeHtml(
      label.color || "#54105b"
    )}"></span>${escapeHtml(label.name)}${allHaveLabel ? " ✓" : ""}`;

    btn.addEventListener("click", async () => {
      try {
        if (allHaveLabel) {
          await unassignLabelBatchRequest(label.id, selectedIds);
        } else {
          await assignLabelBatchRequest(label.id, selectedIds);
        }

        bulkLabelPickerEl?.classList.add("hidden");
        exitSessionsSelectMode();
        loadConversations();
      } catch (error) {
        console.error(error);
        alert("حدث خطأ، حاول مرة أخرى");
      }
    });

    bulkLabelPickerListEl.appendChild(btn);
  });
}

function renderHiddenConversations(conversations) {
  if (!conversations.length) {
    conversationsEl.innerHTML =
      '<div class="empty-state">لا توجد محادثات مخفية</div>';
    return;
  }

  conversationsEl.classList.remove("select-mode");
  conversationsEl.innerHTML = "";

  conversations.forEach((conv) => {
    const item = document.createElement("div");
    item.className = "session-item";
    item.dataset.sessionId = conv.session_id || "";

    const row = document.createElement("div");
    row.className = "session-row";
    row.innerHTML = `
      <div class="session-id">
        ${escapeHtml(conv.customer_name || "عميل")}
        <div style="font-size:12px;color:#8696a0">
          ${escapeHtml(conv.session_id || "")}
        </div>
      </div>
    `;

    const unhideBtn = document.createElement("button");
    unhideBtn.type = "button";
    unhideBtn.className = "session-unhide-btn";
    unhideBtn.textContent = "إظهار";
    unhideBtn.addEventListener("click", async (event) => {
      event.stopPropagation();

      try {
        await unhideConversationsRequest([conv.session_id]);
        loadHiddenConversations();
      } catch (error) {
        console.error(error);
        alert("حدث خطأ، حاول مرة أخرى");
      }
    });

    row.appendChild(unhideBtn);
    item.appendChild(row);
    conversationsEl.appendChild(item);
  });
}

async function loadHiddenConversations() {
  conversationsEl.innerHTML =
    '<div class="loading-state">جاري تحميل المحادثات المخفية...</div>';

  try {
    const res = await fetch(`${API_BASE}/conversations?hidden=1`, {
      cache: "no-store",
      headers: getAuthHeaders()
    });

    if (handleInvalidToken(res)) return;
    if (!res.ok) throw new Error("Failed hidden conversations");

    const list = await res.json();
    renderHiddenConversations(Array.isArray(list) ? list : []);
  } catch (error) {
    conversationsEl.innerHTML =
      '<div class="error-state">فشل تحميل المحادثات المخفية</div>';
    console.error(error);
  }
}

function enterHiddenView() {
  viewingHiddenConversations = true;
  closeConversationsMenu();
  exitSessionsSelectMode();
  hiddenViewBarEl?.classList.remove("hidden");
  document.querySelector(".mobile-search")?.classList.add("hidden");
  labelFilterRowEl?.classList.add("hidden");
  loadHiddenConversations();
}

function exitHiddenView() {
  viewingHiddenConversations = false;
  hiddenViewBarEl?.classList.add("hidden");
  document.querySelector(".mobile-search")?.classList.remove("hidden");
  labelFilterRowEl?.classList.remove("hidden");
  loadConversations();
}

viewHiddenBtnEl?.addEventListener("click", enterHiddenView);
backFromHiddenBtnEl?.addEventListener("click", exitHiddenView);

async function refreshConversationLabels() {
  if (!activeSessionId) return;

  try {
    conversationLabelsCache = await fetchConversationLabels(activeSessionId);
    renderLabelsList();
    renderChatLabelsRow();
  } catch (error) {
    console.error(error);
  }
}

function renderLabelColorPicker() {
  if (!labelColorPickerEl) return;

  labelColorPickerEl.innerHTML = "";

  LABEL_COLOR_PALETTE.forEach((color) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "label-color-swatch";
    swatch.style.background = color;
    if (color === labelSelectedColor) swatch.classList.add("selected");

    swatch.addEventListener("click", () => {
      labelSelectedColor = color;
      renderLabelColorPicker();
    });

    labelColorPickerEl.appendChild(swatch);
  });
}

function openLabelForm(label) {
  labelEditingId = label ? label.id : null;
  if (labelNameInputEl) labelNameInputEl.value = label ? label.name : "";
  labelSelectedColor = label
    ? label.color || LABEL_COLOR_PALETTE[0]
    : LABEL_COLOR_PALETTE[0];
  renderLabelColorPicker();
  labelFormEl?.classList.remove("hidden");
  labelNameInputEl?.focus();
}

function closeLabelForm() {
  labelEditingId = null;
  if (labelNameInputEl) labelNameInputEl.value = "";
  labelFormEl?.classList.add("hidden");
}

function openLabelsOverlay() {
  closeEmojiPicker();
  closeQuickActions();
  closeLabelForm();
  labelsOverlayEl?.classList.remove("hidden");
  document.body.classList.add("labels-open");
  refreshAllLabels();
  refreshConversationLabels();
}

function closeLabelsOverlay() {
  labelsOverlayEl?.classList.add("hidden");
  document.body.classList.remove("labels-open");
  closeLabelForm();
}

conversationLabelsBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();

  if (!activeSessionId) {
    alert("اختر محادثة أولًا");
    return;
  }

  openLabelsOverlay();
});

labelsOverlayEl?.addEventListener("click", (event) => {
  if (event.target === labelsOverlayEl) closeLabelsOverlay();
});

closeLabelsBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeLabelsOverlay();
});

addLabelBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  openLabelForm(null);
});

cancelLabelFormBtnEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeLabelForm();
});

saveLabelFormBtnEl?.addEventListener("click", async (event) => {
  event.stopPropagation();

  const name = labelNameInputEl?.value.trim();
  if (!name) return;

  saveLabelFormBtnEl.disabled = true;

  try {
    if (labelEditingId) {
      await updateLabel(labelEditingId, name, labelSelectedColor);
    } else {
      await createLabel(name, labelSelectedColor);
    }

    closeLabelForm();
    await refreshAllLabels();
    await refreshConversationLabels();
    loadConversations();
  } catch (error) {
    console.error(error);
    alert(error.message || "حدث خطأ، حاول مرة أخرى");
  } finally {
    saveLabelFormBtnEl.disabled = false;
  }
});

let currentAiEnabled = true;

let conversationsData = [];
let activeSessionId = null;

function getChannelFromSessionId(sessionId) {
  return String(sessionId || "").startsWith("fb:")
    ? "messenger"
    : "whatsapp";
}

function getActiveChannel() {
  const conversation = conversationsData.find(
    (item) => item.session_id === activeSessionId
  );
  return conversation?.channel || getChannelFromSessionId(activeSessionId);
}
let messagesRequestToken = 0;
let currentLoadedMessageCount = 0;
let oldestLoadedMessageId = null;
let hasMoreMessages = false;
let isLoadingOlderMessages = false;
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

  mediaGalleryEl._mediaObserver?.disconnect();
  mediaGalleryEl.remove();
  mediaGalleryEl = null;
  document.body.classList.remove("media-gallery-open");
}

// بيانات العميل المعروضة فوق الوسائط — الأرّاي دي مصممة عشان نضيف حقول
// تانية عن العميل بسهولة في المستقبل (إيميل، ملاحظات، عنوان...) بس بزيادة
// عنصر جديد هنا، من غير ما نغيّر شكل الكود أو الـ HTML
function getContactInfoFields() {
  const conv = conversationsData.find((c) => c.session_id === activeSessionId);
  const customerName = conv?.customer_name || chatTitleEl?.textContent || "عميل";

  return [
    { label: "الاسم", value: customerName },
    { label: "رقم الهاتف", value: activeSessionId || "" }
  ];
}

function renderContactInfoSection(fields) {
  const rowsHtml = fields
    .map(
      (field) => `
        <div class="contact-info-row">
          <div class="contact-info-label">${escapeHtml(field.label)}</div>
          <div class="contact-info-value">${escapeHtml(field.value || "—")}</div>
        </div>
      `
    )
    .join("");

  return `
    <div class="contact-info-section">
      <div class="contact-info-avatar">👤</div>
      <div class="contact-info-fields">${rowsHtml}</div>
    </div>
  `;
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
          <div class="media-gallery-title">بيانات العميل والوسائط</div>
          <div class="media-gallery-subtitle">جاري التحميل...</div>
        </div>
      </header>
      ${renderContactInfoSection(getContactInfoFields())}
      <div class="media-gallery-section-title">الوسائط المشتركة</div>
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
      `${API_BASE}/media/${encodeURIComponent(activeSessionId)}?limit=48`,
      {
        cache: "no-store",
        headers: getAuthHeaders()
      }
    );

    if (handleInvalidToken(response)) return;
    if (!response.ok) throw new Error("Failed media gallery");

    const firstPage = await response.json();
    const mediaItems = firstPage.items || [];
    if (gallery !== mediaGalleryEl) return;

    const subtitle = gallery.querySelector(".media-gallery-subtitle");
    const grid = gallery.querySelector(".media-gallery-grid");

    subtitle.textContent = `${Number(firstPage.total || 0)} ملف`;
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

    const appendMediaItems = (items, beforeNode = null) => {
      const fragment = document.createDocumentFragment();

      items.forEach((item) => {
        fragment.appendChild(createMediaCard(item));
      });

      grid.insertBefore(fragment, beforeNode);
    };

    appendMediaItems(mediaItems);

    let nextBeforeId = firstPage.nextBeforeId || null;
    let hasMore = Boolean(firstPage.hasMore);
    let loadingNextPage = false;

    const sentinel = document.createElement("div");
    sentinel.className = "media-gallery-sentinel";
    sentinel.textContent = hasMore ? "جاري تحميل المزيد..." : "";
    grid.appendChild(sentinel);

    const loadNextPage = async () => {
      if (
        loadingNextPage ||
        !hasMore ||
        !nextBeforeId ||
        gallery !== mediaGalleryEl
      ) return;

      loadingNextPage = true;
      sentinel.textContent = "جاري تحميل المزيد...";

      try {
        const nextResponse = await fetch(
          `${API_BASE}/media/${encodeURIComponent(activeSessionId)}` +
          `?limit=48&beforeId=${encodeURIComponent(nextBeforeId)}`,
          {
            cache: "no-store",
            headers: getAuthHeaders()
          }
        );

        if (!nextResponse.ok) throw new Error("Failed next media page");

        const nextPage = await nextResponse.json();
        if (gallery !== mediaGalleryEl) return;

        appendMediaItems(nextPage.items || [], sentinel);
        nextBeforeId = nextPage.nextBeforeId || null;
        hasMore = Boolean(nextPage.hasMore);
        sentinel.textContent = hasMore ? "جاري تحميل المزيد..." : "";

        if (!hasMore) observer.disconnect();
      } catch (error) {
        console.error(error);
        sentinel.textContent = "تعذر التحميل — اضغط للمحاولة";
      } finally {
        loadingNextPage = false;
      }
    };

    sentinel.addEventListener("click", loadNextPage);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadNextPage();
        }
      },
      {
        root: grid,
        rootMargin: "600px 0px",
        threshold: 0
      }
    );

    gallery._mediaObserver = observer;
    observer.observe(sentinel);
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

  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

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
  // لو دي أول تحميل (القايمة لسه فاضية) بس اللي بيظهر فيها "جاري التحميل"،
  // مش أي تحديث لاحق — عشان التحديثات (بعد إرسال رسالة، أو أي حدث SSE) ما
  // تمسحش القايمة كلها وتبنيها من الأول، وده كان بيلغي فايدة إعادة استخدام
  // العناصر الموجودة في renderConversations خالص
  const isFirstLoad = !conversationsEl.querySelector(".session-item");

  if (isFirstLoad) {
    conversationsEl.innerHTML = `<div class="loading-state">جاري تحميل المحادثات...</div>`;
  }

 try {
  const res = await fetch(`${API_BASE}/conversations`, {
    cache: "no-store",
    headers: getAuthHeaders()
  });

  if (handleInvalidToken(res)) return;
if (!res.ok) throw new Error("Failed conversations");

    const conversations = await res.json();
    conversationsData = Array.isArray(conversations) ? conversations : [];
    applyConversationFilters();
  } catch (error) {
    if (isFirstLoad) {
      conversationsEl.innerHTML = `<div class="error-state">فشل تحميل المحادثات</div>`;
    }
    console.error(error);
  }
}

// بيبني الكارت مرة واحدة بس ويربط كل الأحداث عليه — التحديثات بعد كده
// بتتم عن طريق updateConversationItem، فمفيش إعادة ربط أحداث كل مرة
function createConversationItem(conv) {
  const item = document.createElement("div");
  item.className = "session-item";
  item._conv = conv;

  item.innerHTML = `
    <div class="session-item-check">✓</div>
    <div class="session-row">
      <div class="session-id">
        <span class="session-customer-name"></span>
        <span class="session-channel-badge"></span>
        <div style="font-size:12px;color:#8696a0" class="session-id-text"></div>
      </div>
      <div class="unread-badge hidden"></div>
    </div>
    <div class="session-preview"></div>
    <div class="session-labels"></div>
  `;

  let longPressTimer = null;
  let longPressFired = false;

  const clearLongPressTimer = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  item.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;

    longPressFired = false;
    clearLongPressTimer();

    longPressTimer = setTimeout(() => {
      longPressFired = true;

      if (!sessionsSelectMode) {
        sessionsSelectMode = true;
        sessionsSelectionBarEl?.classList.remove("hidden");
      }

      selectedSessionIds.add(item._conv.session_id);
      updateSessionsSelectionBar();
      applyConversationFilters();
    }, 500);
  });

  item.addEventListener("pointerup", clearLongPressTimer);
  item.addEventListener("pointerleave", clearLongPressTimer);
  item.addEventListener("pointercancel", clearLongPressTimer);

  item.addEventListener("click", () => {
    if (longPressFired) {
      longPressFired = false;
      return;
    }

    const currentConv = item._conv;

    if (sessionsSelectMode) {
      if (selectedSessionIds.has(currentConv.session_id)) {
        selectedSessionIds.delete(currentConv.session_id);
      } else {
        selectedSessionIds.add(currentConv.session_id);
      }

      item.classList.toggle("selected");
      updateSessionsSelectionBar();
      return;
    }

    const hasCachedConversation =
      messagesEl.dataset.loadedSessionId === currentConv.session_id &&
      messagesEl.childElementCount > 0;

    activeSessionId = currentConv.session_id;
    syncSessionProgressVisibility();

    if (currentConv.unread_count) {
      currentConv.unread_count = 0;
      markConversationRead(currentConv.session_id);
    }

    conversationLabelsCache = Array.isArray(currentConv.labels) ? currentConv.labels : [];
    renderChatLabelsRow();

    applyConversationFilters();
    openChat();

    if (hasCachedConversation) {
      chatTitleEl.textContent = currentConv.customer_name || "عميل";
      renderChatMeta(currentConv.session_id, currentLoadedMessageCount);
      reapplyMessagingWindowCheckFromCache();
    } else {
      loadMessages(currentConv.session_id);
    }

    loadAiStatus(currentConv.session_id);
    setTimeout(() => messageInputEl.focus(), 250);
  });

  updateConversationItem(item, conv);
  return item;
}

// بيحدّث بس الأجزاء اللي ممكن تتغير في كارت موجود بالفعل، من غير ما
// يعيد بناء الـ DOM أو يشيل الأحداث المربوطة عليه
function updateConversationItem(item, conv) {
  item._conv = conv;
  item.dataset.sessionId = conv.session_id || "";
  item.classList.toggle("active", conv.session_id === activeSessionId);
  item.classList.toggle("selected", selectedSessionIds.has(conv.session_id));

  const nameEl = item.querySelector(".session-customer-name");
  if (nameEl) nameEl.textContent = conv.customer_name || "عميل";

  const idTextEl = item.querySelector(".session-id-text");
  if (idTextEl) idTextEl.textContent = conv.session_id || "";

  const channel = conv.channel || getChannelFromSessionId(conv.session_id);
  const channelBadgeEl = item.querySelector(".session-channel-badge");
  if (channelBadgeEl) {
    channelBadgeEl.textContent = channel === "messenger" ? "Messenger" : "WhatsApp";
    channelBadgeEl.className = `session-channel-badge ${channel}`;
  }

  const unreadCount = Number(conv.unread_count || 0);
  const badgeEl = item.querySelector(".unread-badge");
  if (badgeEl) {
    badgeEl.classList.toggle("hidden", unreadCount <= 0);
    badgeEl.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
  }

  const previewEl = item.querySelector(".session-preview");
  if (previewEl) previewEl.textContent = getConversationPreviewText(conv);

  const labels = Array.isArray(conv.labels) ? conv.labels : [];
  const labelsEl = item.querySelector(".session-labels");
  if (labelsEl) {
    labelsEl.classList.toggle("hidden", labels.length === 0);
    labelsEl.innerHTML = labels
      .map(
        (label) =>
          `<span class="session-label-dot" style="background:${escapeHtml(
            label.color || "#54105b"
          )}" title="${escapeHtml(label.name || "")}"></span>`
      )
      .join("");
  }
}

function renderConversations(conversations) {
  if (!conversations.length) {
    conversationsEl.innerHTML = `<div class="empty-state">لا توجد محادثات</div>`;
    return;
  }

  conversationsEl.classList.toggle("select-mode", sessionsSelectMode);

  // بنعيد استخدام العناصر الموجودة بدل ما نمسح ونعيد بناء القايمة كاملة
  // كل مرة — ده كان بيسبب تهنيج واضح في اللحظة اللي رسالة جديدة توصل فيها
  const existingBySessionId = new Map();
  conversationsEl.querySelectorAll(".session-item[data-session-id]").forEach((el) => {
    existingBySessionId.set(el.dataset.sessionId, el);
  });

  conversationsEl.querySelector(".empty-state")?.remove();

  let previousNode = null;

  conversations.forEach((conv) => {
    const sessionId = conv.session_id || "";
    let item = existingBySessionId.get(sessionId);

    if (item) {
      existingBySessionId.delete(sessionId);
      updateConversationItem(item, conv);
    } else {
      item = createConversationItem(conv);
    }

    const expectedNext = previousNode ? previousNode.nextSibling : conversationsEl.firstChild;
    if (expectedNext !== item) {
      conversationsEl.insertBefore(item, expectedNext);
    }

    previousNode = item;
  });

  existingBySessionId.forEach((el) => el.remove());

  updateGlobalUnreadIndicator();
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
  document.querySelector(".message-actions-menu")?.remove();
}

function renderChatMeta(sessionId, total) {
  const channel = getActiveChannel();
  if (chatPhoneNumberEl) {
    chatPhoneNumberEl.textContent = `${
      channel === "messenger" ? "Messenger" : "WhatsApp"
    } · ${sessionId || ""}`;
  }

  if (chatMessageCountEl) {
    chatMessageCountEl.textContent = `عدد الرسائل: ${Number(total || 0)}`;
  }
}

// بيتحقق من وقت آخر رسالة من العميل نفسه — حتى لو احنا (أو الـ AI) رددنا
// بعدها برسايل تانية. نافذة الـ 24 ساعة بتتحسب من آخر رسالة العميل بالظبط
// وما بتتجددش لمجرد إننا رددنا، فلو مر عليها 24 ساعة واتساب مش بيسمح
// برسايل نصية عادية، لازم تيمبليت.
function findLastUserMessageTime(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const type = messages[i]?.type;

    if (type === "user" || type === "human") {
      return new Date(
        messages[i].created_at || messages[i].timestamp || 0
      ).getTime() || 0;
    }
  }

  return 0;
}

function applyMessagingWindowState(lastUserTime) {
  if (!windowExpiredBannerEl) return;

  const expired =
    lastUserTime > 0 &&
    (Date.now() - lastUserTime) / (1000 * 60 * 60) >= 24;

  windowExpiredBannerEl.classList.toggle("hidden", !expired);
  chatComposeEl?.classList.toggle("window-expired", expired);

  const isMessenger = getActiveChannel() === "messenger";
  if (expired) {
    windowExpiredBannerEl.textContent = isMessenger
      ? "⚠️ انتهت نافذة Messenger القياسية (24 ساعة). لا يمكن إرسال رد عادي حتى يرسل العميل رسالة جديدة."
      : "⚠️ مر أكثر من 24 ساعة على آخر رسالة من العميل — استخدم تيمبليت WhatsApp المعتمد.";
  }

  sendTemplateInsteadBtnEl?.classList.toggle("hidden", !expired || isMessenger);

  // لو المسارات أو الرد كانوا مفتوحين قبل ما الوقت ينتهي، اقفلهم فورًا
  if (expired) closeQuickActions();
}

function checkMessagingWindow(messages) {
  if (!windowExpiredBannerEl) return;

  const lastUserTime = findLastUserMessageTime(messages);
  messagesEl.dataset.lastUserMessageTime = String(lastUserTime || "");
  applyMessagingWindowState(lastUserTime);
}

function reapplyMessagingWindowCheckFromCache() {
  if (!windowExpiredBannerEl) return;

  const timeStr = messagesEl.dataset.lastUserMessageTime;

  if (!timeStr) {
    windowExpiredBannerEl.classList.add("hidden");
    chatComposeEl?.classList.remove("window-expired");
    sendTemplateInsteadBtnEl?.classList.add("hidden");
    return;
  }

  applyMessagingWindowState(Number(timeStr));
}

async function loadMessages(sessionId) {
  const conv = conversationsData.find(c => c.session_id === sessionId);

  windowExpiredBannerEl?.classList.add("hidden");
  chatComposeEl?.classList.remove("window-expired");

  // لو المستخدم فتح محادثة تانية قبل ما الطلب ده يخلص، النتيجة القديمة
  // ما ينفعش تتكتب فوق المحادثة الجديدة. الـ token ده بيتأكد إن آخر
  // استدعاء بس هو اللي يرسم النتيجة، حتى لو الردود رجعت بترتيب مقلوب.
  const requestToken = ++messagesRequestToken;

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

    if (requestToken !== messagesRequestToken || sessionId !== activeSessionId) {
      return;
    }

    const messages = Array.isArray(data) ? data : (data.messages || []);

    messagesEl.innerHTML = "";
    currentLoadedMessageCount = Number(data.total ?? messages.length);
    oldestLoadedMessageId = data.nextBeforeId || messages[0]?.id || null;
    hasMoreMessages = Boolean(data.hasMore);
    renderChatMeta(sessionId, currentLoadedMessageCount);
    messagesEl.dataset.loadedSessionId = sessionId;
    checkMessagingWindow(messages);

    if (!messages.length) {
      messagesEl.innerHTML = `<div class="empty-state">لا توجد رسائل</div>`;
      return;
    }

    messages.forEach((msg) => appendMessageToUI(msg));
    scrollMessagesToBottom();
  } catch (error) {
    if (requestToken !== messagesRequestToken || sessionId !== activeSessionId) {
      return;
    }

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

  const requestToken = messagesRequestToken;
  const targetSessionId = activeSessionId;
  isLoadingOlderMessages = true;
  const previousScrollHeight = messagesEl.scrollHeight;

  const loader = document.createElement("div");
  loader.className = "older-messages-loader";
  loader.textContent = "جاري تحميل الرسائل الأقدم...";
  messagesEl.prepend(loader);

  try {
    const res = await fetch(
      `${API_BASE}/messages/${encodeURIComponent(targetSessionId)}` +
      `?limit=100&beforeId=${encodeURIComponent(oldestLoadedMessageId)}`,
      {
        cache: "no-store",
        headers: getAuthHeaders()
      }
    );

    if (!res.ok) throw new Error("Failed older messages");

    const data = await res.json();

    if (
      requestToken !== messagesRequestToken ||
      targetSessionId !== activeSessionId
    ) {
      loader.remove();
      return;
    }

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

  const whatsappLocation = whatsappMessage?.location || {};

  const latitude =
    messageObj.latitude ??
    msg?.latitude ??
    whatsappLocation.latitude ??
    null;

  const longitude =
    messageObj.longitude ??
    msg?.longitude ??
    whatsappLocation.longitude ??
    null;

  const locationName =
    messageObj.location_name ||
    msg?.location_name ||
    whatsappLocation.name ||
    "";

  const address =
    messageObj.address ||
    msg?.address ||
    whatsappLocation.address ||
    "";

  const locationUrl =
    messageObj.location_url ||
    msg?.location_url ||
    whatsappLocation.url ||
    "";

  const mapsUrl =
    messageObj.maps_url ||
    msg?.maps_url ||
    (latitude != null && longitude != null
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : locationUrl);

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

    channel:
      messageObj.channel ||
      msg?.channel ||
      "whatsapp",

    // ده الـ id بتاع الصف في القاعدة، مش رقم واتساب الحقيقي — بيتفقد وقت
    // الـ normalize لو ما ضفناهوش هنا صراحة، وبنستخدمه كـ fallback للريبلاي
    // لما الرسالة (زي صور اختيار المسار) معندهاش wa_message_id حقيقي محفوظ
    id:
      msg?.id ||
      messageObj.id ||
      "",

    type:
      messageObj.type ||
      msg?.type ||
      "",

    content:
      messageObj.content ||
      msg?.content ||
      "",

    message_kind: String(messageKind).toLowerCase(),

    latitude,

    longitude,

    location_name: locationName,

    address,

    maps_url: mapsUrl,

    location_url: locationUrl,

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
      messageObj.external_message_id ||
      msg?.external_message_id ||
      messageObj.channel_message_id ||
      msg?.channel_message_id ||
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
    messageObj.external_message_id ||
    messageObj.channel_message_id ||
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

if (
  (messageType === "user" ||
    messageType === "agent" ||
    messageType === "ai") &&
  realWaMessageId
) {
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

    const replyThumbUrl =
      messageObj.reply_to.message_kind === "image"
        ? messageObj.reply_to.media_url || ""
        : "";

    if (replyThumbUrl) {
      replyBox.classList.add("has-thumb");

      const textWrap = document.createElement("div");
      textWrap.className = "quoted-reply-textwrap";
      textWrap.appendChild(replyName);
      textWrap.appendChild(replyText);

      const thumb = document.createElement("img");
      thumb.className = "quoted-reply-thumb";
      thumb.src = replyThumbUrl;
      thumb.alt = "";

      replyBox.appendChild(thumb);
      replyBox.appendChild(textWrap);
    } else {
      replyBox.appendChild(replyName);
      replyBox.appendChild(replyText);
    }

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

  if (messageKind === "location") {
    const locationCard = document.createElement("div");
    locationCard.className = "wa-location-card";
    locationCard.style.display = "flex";
    locationCard.style.gap = "10px";
    locationCard.style.padding = "10px";
    locationCard.style.borderRadius = "8px";
    locationCard.style.background = "rgba(0, 0, 0, 0.08)";

    const locationIcon = document.createElement("div");
    locationIcon.className = "wa-location-icon";
    locationIcon.textContent = "📍";
    locationIcon.style.fontSize = "24px";

    const locationDetails = document.createElement("div");
    locationDetails.className = "wa-location-details";

    const locationName = document.createElement("div");
    locationName.className = "wa-location-name";
    locationName.textContent =
      messageObj.location_name || "الموقع المرسل";
    locationName.style.fontWeight = "600";

    locationDetails.appendChild(locationName);

    if (messageObj.address) {
      const locationAddress = document.createElement("div");
      locationAddress.className = "wa-location-address";
      locationAddress.textContent = messageObj.address;
      locationAddress.style.marginTop = "4px";
      locationDetails.appendChild(locationAddress);
    }

    const mapsUrl = messageObj.maps_url || messageObj.location_url;

    if (mapsUrl) {
      const locationLink = document.createElement("a");
      locationLink.className = "wa-location-link";
      locationLink.href = mapsUrl;
      locationLink.target = "_blank";
      locationLink.rel = "noopener noreferrer";
      locationLink.textContent = "فتح الموقع على الخريطة";
      locationLink.style.display = "inline-block";
      locationLink.style.marginTop = "8px";
      locationLink.style.color = "#53bdeb";
      locationDetails.appendChild(locationLink);
    }

    locationCard.appendChild(locationIcon);
    locationCard.appendChild(locationDetails);
    bubble.appendChild(locationCard);
  }

  if (content && messageKind !== "location") {
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

function appendOptimisticTextMessage(content, replyTo) {
  const wrap = document.createElement("div");
  wrap.className = "message-wrap agent";
  wrap.dataset.pendingAgent = "true";
  wrap.dataset.pendingContent = content;

  const bubble = document.createElement("div");
  bubble.className = "message agent";

  const label = document.createElement("div");
  label.className = "message-label agent";
  label.textContent = getCurrentSenderName();

  if (label.textContent.toLowerCase() === "admin") {
    label.classList.add("sender-admin");
  } else if (label.textContent.toLowerCase() === "agent1") {
    label.classList.add("sender-agent1");
  }

  bubble.appendChild(label);

  if (replyTo && replyTo.content) {
    const replyBox = document.createElement("div");
    replyBox.className = "quoted-reply-box";
    replyBox.dataset.replyTargetId = replyTo.wa_message_id || "";
    replyBox.style.cursor = "pointer";

    const replyName = document.createElement("div");
    replyName.className = "quoted-reply-name";
    replyName.textContent = replyTo.type === "user" ? "العميل" : "أنت";

    const replyText = document.createElement("div");
    replyText.className = "quoted-reply-text";
    replyText.textContent = replyTo.content || "";

    const replyThumbUrl =
      replyTo.message_kind === "image" ? replyTo.media_url || "" : "";

    if (replyThumbUrl) {
      replyBox.classList.add("has-thumb");

      const textWrap = document.createElement("div");
      textWrap.className = "quoted-reply-textwrap";
      textWrap.appendChild(replyName);
      textWrap.appendChild(replyText);

      const thumb = document.createElement("img");
      thumb.className = "quoted-reply-thumb";
      thumb.src = replyThumbUrl;
      thumb.alt = "";

      replyBox.appendChild(thumb);
      replyBox.appendChild(textWrap);
    } else {
      replyBox.appendChild(replyName);
      replyBox.appendChild(replyText);
    }

    bubble.appendChild(replyBox);

    replyBox.addEventListener("click", (e) => {
      e.stopPropagation();

      const targetId = replyBox.dataset.replyTargetId;
      if (!targetId) return;

      const target = messagesEl.querySelector(
        `[data-wa-message-id="${CSS.escape(targetId)}"]`
      );

      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("message-highlight");

      setTimeout(() => {
        target.classList.remove("message-highlight");
      }, 1200);
    });
  }

  const textEl = document.createElement("div");
  textEl.className = "message-text";
  textEl.innerHTML = linkifyText(content);
  bubble.appendChild(textEl);

  const timestampEl = document.createElement("div");
  timestampEl.className = "message-timestamp";
  timestampEl.textContent = formatMessageTimestamp(
    new Date().toISOString()
  );
  bubble.appendChild(timestampEl);

  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  scrollMessagesToBottom();
  return wrap;
}

function markOptimisticMessageFailed(content, optimisticWrap = null) {
  const lastBubble = optimisticWrap || messagesEl.lastElementChild;

  if (
    lastBubble?.dataset?.pendingAgent === "true" &&
    lastBubble.dataset.pendingContent === content
  ) {
    delete lastBubble.dataset.pendingAgent;
    delete lastBubble.dataset.pendingContent;
    lastBubble.classList.add("message-send-failed");

    const bubble = lastBubble.querySelector(".message");
    if (bubble && !bubble.querySelector(".message-send-failed-note")) {
      const note = document.createElement("div");
      note.className = "message-send-failed-note";
      note.textContent = "⚠ فشل الإرسال";
      bubble.appendChild(note);
    }
  }
}

async function sendMessageFromDashboard() {
  const message = messageInputEl.value.trim();

  if (!activeSessionId) return alert("اختر محادثة أولًا");
  if (!message) return;

  if (windowExpiredBannerEl && !windowExpiredBannerEl.classList.contains("hidden")) {
    alert("مرّ أكثر من 24 ساعة على آخر رسالة من العميل، لا يمكن إرسال رسالة نصية عادية. استخدم زرار إرسال تيمبليت.");
    return;
  }

  const replyTo = selectedReplyMessage;
  const targetSessionId = activeSessionId;

  messageInputEl.value = "";
  resizeMessageInput();
  clearSelectedReply();

  const optimisticWrap = appendOptimisticTextMessage(message, replyTo);

  enqueueSessionSend(targetSessionId, "text", async () => {
    const res = await fetch(`${API_BASE}/send-message`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        sessionId: targetSessionId,
        message,
        replyTo
      })
    });

    if (!res.ok) throw new Error("فشل الإرسال");
    loadConversations();
  }).catch((error) => {
    console.error(error);
    alert("خطأ في الإرسال");
    markOptimisticMessageFailed(message, optimisticWrap);
  });
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

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function ensurePushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "denied") return;

  try {
    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const keyRes = await fetch(`${API_BASE}/push/public-key`, {
        headers: getAuthHeaders()
      });
      const { publicKey } = await keyRes.json();
      if (!publicKey) return;

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    await fetch(`${API_BASE}/push-subscribe`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(subscription)
    });
  } catch (error) {
    console.error("Push subscription failed:", error);
  }
}

navigator.serviceWorker?.addEventListener?.("message", (event) => {
  if (event.data?.type === "OPEN_SESSION" && event.data.sessionId) {
    const target = conversationsEl.querySelector(
      `[data-session-id="${CSS.escape(event.data.sessionId)}"]`
    );

    if (target) {
      target.click();
    } else {
      activeSessionId = event.data.sessionId;
      syncSessionProgressVisibility();
      openChat();
      loadMessages(event.data.sessionId);
    }
  }
});

// بيقفل أي إشعار نظام حقيقي فاضل معلّق لمحادثة معينة، عشان عداد أيقونة
// التطبيق يتحدث لوحده لما تقرا الرسايل من جوه التطبيق (مش بس لو مسحتها يدوي)
async function dismissNotificationsForSession(sessionId) {
  if (!sessionId || !("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications({
      tag: `session-${sessionId}`
    });

    notifications.forEach((notification) => notification.close());
  } catch (error) {
    console.error(error);
  }
}

async function markConversationRead(sessionId) {
  dismissNotificationsForSession(sessionId);

  try {
    await fetch(
      `${API_BASE}/conversations/${encodeURIComponent(sessionId)}/mark-read`,
      {
        method: "POST",
        headers: getAuthHeaders()
      }
    );
  } catch (error) {
    console.error(error);
  }
}

function updateGlobalUnreadIndicator() {
  const total = conversationsData.reduce(
    (sum, c) => sum + Number(c.unread_count || 0),
    0
  );

  document.title =
    total > 0
      ? `(${total > 99 ? "99+" : total}) Al Mehrab Dashboard`
      : "Al Mehrab Dashboard";

  if (navigator.setAppBadge) {
    if (total > 0) {
      navigator.setAppBadge(total).catch(() => {});
    } else if (navigator.clearAppBadge) {
      navigator.clearAppBadge().catch(() => {});
    }
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

    if (data.type === "saved_replies_changed") {
      if (
        savedRepliesOverlayEl &&
        !savedRepliesOverlayEl.classList.contains("hidden")
      ) {
        refreshSavedReplies();
      }

      return;
    }

    if (data.type === "unread_changed") {
      if (data.all) {
        conversationsData.forEach((c) => { c.unread_count = 0; });
        applyConversationFilters();
        return;
      }

      const conv = conversationsData.find(
        (c) => c.session_id === data.sessionId
      );

      if (conv) {
        conv.unread_count = Number(data.unreadCount || 0);
        applyConversationFilters();
      }

      return;
    }

    if (data.type === "label_changed") {
      if (viewingHiddenConversations) {
        loadHiddenConversations();
      } else {
        loadConversations();
      }

      refreshAllLabels();

      if (
        String(activeSessionId || "") === String(data.sessionId || "") &&
        typeof refreshConversationLabels === "function"
      ) {
        refreshConversationLabels();
      }

      return;
    }

    if (data.type === "conversations_changed") {
      if (viewingHiddenConversations) {
        loadHiddenConversations();
      } else {
        loadConversations();
      }

      return;
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
      // متعطل بناءً على الطلب — مش محتاجين مؤشر "AI بيكتب"
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

        const realtimeMessageId = String(
          data.external_message_id ||
          data.channel_message_id ||
          data.messageId ||
          data.message_id ||
          ""
        );

        if (
          realtimeMessageId &&
          messagesEl.querySelector(
            `[data-wa-message-id="${CSS.escape(realtimeMessageId)}"]`
          )
        ) {
          updateConversationPreview();
          return;
        }

        if (
          data.messageType === "agent" &&
          ["image", "video"].includes(realtimeMessageKind)
        ) {
          const optimisticMedia = [...messagesEl.querySelectorAll(
            `[data-local-media-session="${CSS.escape(eventSession)}"][data-local-media-kind="${CSS.escape(realtimeMessageKind)}"]`
          )].find((element) => element.dataset.reconciled !== "true");

          if (optimisticMedia) {
            optimisticMedia.dataset.reconciled = "true";
            optimisticMedia.remove();
          }
        }

        const realtimeTimestamp =
          data.timestamp ||
          data.created_at ||
          new Date().toISOString();

        appendRealtimeMessage({
          type: data.messageType || "ai",
          channel: data.channel || getChannelFromSessionId(data.sessionId),
          content: data.content || "",
          message_kind: data.messageKind || data.message_kind || "text",
          media: data.mediaUrl || data.media_url || data.media || null,
          interactive: data.interactive || null,
          whatsapp_payload: data.whatsapp_payload || null,

          wa_message_id:
            data.external_message_id ||
            data.channel_message_id ||
            data.wa_message_id ||
            data.message_id ||
            data.whatsapp_message_id ||
            data.whatsapp_message?.id ||
            "",

          whatsapp_message: data.whatsapp_message || null,
          reply_to: data.reply_to || null,
          timestamp: realtimeTimestamp
        });

        // العميل بعت رسالة جديدة دلوقتي — نافذة الـ 24 ساعة بتتجدد على
        // طول من غير ما نحتاج نعمل reload كامل للمحادثة
        if (data.messageType === "user" || data.messageType === "human") {
          const time = new Date(realtimeTimestamp).getTime() || Date.now();
          messagesEl.dataset.lastUserMessageTime = String(time);
          applyMessagingWindowState(time);
        }
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
    channel: messageObj.channel || "whatsapp",
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
  if (viewingHiddenConversations) return;
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
  applyConversationFilters();
});

sendBtnEl.addEventListener("pointerdown", (e) => {
  e.preventDefault();
});

sendBtnEl.addEventListener("click", sendMessageFromDashboard);

messageInputEl.addEventListener("keydown", (e) => {
  const isMobile = window.innerWidth < 1024;

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
refreshBtnEl.addEventListener("click", async () => {
  // loadConversations بقى بيحدّث بس اللي اتغيّر (مش بيمسح القايمة كلها)
  // عشان نمنع التهنيج، فلو محصلش أي تغيير فعلي المستخدم مش هيحس إن حاجة
  // حصلت أصلًا — الدوران ده بيدّي تأكيد بصري إن الضغطة اشتغلت
  refreshBtnEl.classList.add("spinning");

  try {
    if (viewingHiddenConversations) {
      await loadHiddenConversations();
    } else {
      await loadConversations();
    }
  } finally {
    refreshBtnEl.classList.remove("spinning");
  }
});

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
  if (getActiveChannel() === "messenger") {
    alert("Messenger يدعم استقبال التفاعلات، لكن Send API لا يدعم إرسالها من الداشبورد.");
    return;
  }
  if (
    messageType !== "user" &&
    messageType !== "agent" &&
    messageType !== "ai"
  ) return;

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
  if (
    messageType !== "user" &&
    messageType !== "agent" &&
    messageType !== "ai"
  ) return;

  const waMessageId =
    messageObj.wa_message_id ||
    messageObj.whatsapp_message?.id ||
    messageObj.message_id ||
    messageObj.whatsapp_message_id ||
    "";

  const messageKind = messageObj.message_kind || "text";
  const mediaUrl = messageObj.media_url || "";

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
    type: messageType,
    content,
    message_kind: messageKind,
    wa_message_id: waMessageId,
    media_url: mediaUrl
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

  const replyTitle =
    selectedReplyMessage.type === "user" ? "رد على العميل" : "رد على رسالتك";

  const hasImageThumb =
    selectedReplyMessage.message_kind === "image" &&
    selectedReplyMessage.media_url;

  replyBar.innerHTML = `
    <div class="reply-bar-content">
      <div class="reply-bar-title">${escapeHtml(replyTitle)}</div>
      <div class="reply-bar-text">${escapeHtml(selectedReplyMessage.content || "")}</div>
    </div>
    ${
      hasImageThumb
        ? `<img class="reply-bar-thumb" src="${escapeHtml(selectedReplyMessage.media_url)}" alt="" />`
        : ""
    }
    <button type="button" class="reply-bar-close">×</button>
  `;

  replyBar.querySelector(".reply-bar-close").addEventListener("click", clearSelectedReply);

  const compose = document.querySelector(".chat-compose");
  compose.parentNode.insertBefore(replyBar, compose);
}

function enableReplyGesture(wrap, messageObj, messageType) {
  if (
    messageType !== "user" &&
    messageType !== "agent" &&
    messageType !== "ai"
  ) return;

  wrap.style.cursor = "pointer";

  let pressTimer = null;
  let startX = 0;
  let startY = 0;
  let didSelect = false;
  let touchHandled = false;

  const select = () => {
  if (didSelect) return;
  didSelect = true;

  showMessageActions(messageObj, messageType);

  wrap.classList.add("reply-swipe-active");

  setTimeout(() => {
    wrap.classList.remove("reply-swipe-active");
  }, 200);
};

  // Desktop click. على الموبايل بيتنفذ برضه لأن اللمسة بتولّد click بعدها،
  // فبنستخدم touchHandled عشان نمنع فتح القايمة مرتين لنفس اللمسة.
  wrap.addEventListener("click", () => {
    if (touchHandled) {
      touchHandled = false;
      return;
    }

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
    touchHandled = true;

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
    touchHandled = false;
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

    if (data.user?.role === "gallery") {
      window.location.href = "/gallery.html";
      return;
    }

    hideLogin();

    connectEvents();
    loadConversations();
    refreshAllLabels();
    applyRolePermissionsToUI();
    ensurePushSubscription();

  } catch (err) {
    console.error(err);
    loginErrorEl.textContent = "فشل تسجيل الدخول";
  }
}

loginBtnEl?.addEventListener("click", login);

const isGalleryRoleToken = Boolean(authToken) && getCurrentUserRole() === "gallery";

if (isGalleryRoleToken) {
  window.location.href = "/gallery.html";
}

if (authToken && !isGalleryRoleToken) {
  hideLogin();
  connectEvents();
  ensurePushSubscription();
} else if (!authToken) {
  showLogin();
}

if (authToken && !isGalleryRoleToken) {
  loadConversations();
  refreshAllLabels();
  applyRolePermissionsToUI();
}
if (appEl && window.innerWidth > 1024) {
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

function appendPendingMedia(file, caption = "", sessionId = "") {
  const url = URL.createObjectURL(file);
  localMediaPreviewUrls.add(url);
  const messageKind = file.type.startsWith("video/") ? "video" : "image";

  const wrap = document.createElement("div");
  wrap.className = "message-wrap agent";
  wrap.dataset.pendingUpload = "true";
  wrap.dataset.localMediaSession = String(sessionId || "");
  wrap.dataset.localMediaKind = messageKind;

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

  const mediaWrap = document.createElement("div");
  mediaWrap.style.position = "relative";
  mediaWrap.style.display = "inline-block";
  mediaWrap.style.maxWidth = "240px";
  mediaWrap.style.width = "100%";

  if (messageKind === "image") {
    const img = document.createElement("img");
    img.src = url;
    img.dataset.fullSrc = url;
    img.style.display = "block";
    img.style.width = "100%";
    img.style.borderRadius = "8px";
    mediaWrap.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.style.display = "block";
    video.style.width = "100%";
    video.style.borderRadius = "8px";
    mediaWrap.appendChild(video);
  }

  const overlay = document.createElement("div");
  overlay.className = "upload-overlay";
  overlay.textContent = "جاري الإرسال...";
  mediaWrap.appendChild(overlay);

  bubble.appendChild(mediaWrap);

  if (caption) {
    const textEl = document.createElement("div");
    textEl.className = "message-text";
    textEl.textContent = caption;
    bubble.appendChild(textEl);
  }

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
      pending: appendPendingMedia(file, caption, targetSessionId)
    }));

    mediaInputEl.value = "";
    messageInputEl.value = "";
    resizeMessageInput();

    enqueueSessionSend(targetSessionId, "media", async () => {
      const queueState = getSessionSendQueue(targetSessionId);
      queueState.suppressMediaEventsUntil = Date.now() + 60000;

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
        if (activeSessionId === targetSessionId) {
          currentLoadedMessageCount += successCount;
          renderChatMeta(targetSessionId, currentLoadedMessageCount);
        }
        loadConversations();
      }

      if (failedCount) {
        alert(`فشل إرسال ${failedCount} ملف`);
      }

      queueState.suppressMediaEventsUntil = Date.now() + 5000;
      if (activeSessionId === targetSessionId) messageInputEl.focus();
      return results;
    }).catch((error) => {
      getSessionSendQueue(targetSessionId).suppressMediaEventsUntil = Date.now() + 5000;
      console.error(error);
    });
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
  closeQuickActions();
  voiceRecordingBarEl?.classList.remove("hidden");

  messageInputEl.style.display = "none";
  sendBtnEl.style.display = "none";
  attachBtnEl.style.display = "none";
  if (emojiBtnEl) emojiBtnEl.style.display = "none";
  if (quickActionsBtnEl) quickActionsBtnEl.style.display = "none";
  if (savedRepliesBtnEl) savedRepliesBtnEl.style.display = "none";
  if (savedMediaBtnEl) savedMediaBtnEl.style.display = "none";
}

function hideRecordingBar() {
  voiceRecordingBarEl?.classList.add("hidden");

  messageInputEl.style.display = "";
  sendBtnEl.style.display = "";
  attachBtnEl.style.display = "";
  if (emojiBtnEl) emojiBtnEl.style.display = "";
  if (quickActionsBtnEl) quickActionsBtnEl.style.display = "";
  if (savedRepliesBtnEl) savedRepliesBtnEl.style.display = "";
  if (savedMediaBtnEl) savedMediaBtnEl.style.display = "";

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

    mediaRecorder.addEventListener("stop", async (event) => {
  const wasRecordingCancelled =
    event.currentTarget?.recordingCancelled === true;
  // بنوقف واجهة التسجيل (التايمر وشريط التسجيل) فورًا أول ما نضغط إرسال،
  // قبل ما نبدأ نرفع الصوت — عشان ما يفضلش شكله وكأنه لسه بيسجل وهو
  // فعليًا بقى بيترفع في الخلفية
  isRecordingAudio = false;
  stopRecordingStream();
  resetRecordingUi();

  messageInputEl.disabled = false;
  sendBtnEl.disabled = false;
  attachBtnEl.disabled = false;

  try {
    // لو المستخدم سحب للإلغاء، ما نبعتش أي حاجة
    if (wasRecordingCancelled) {
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

    const pending = appendPendingAudioBubble();
    await sendRecordedAudio(audioFile, pending);
  } catch (error) {
    console.error("Recorded audio error:", error);

    if (!wasRecordingCancelled) {
      alert("فشل تجهيز الرسالة الصوتية");
    }
  } finally {
    audioChunks = [];
    mediaRecorder = null;
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
    mediaRecorder.recordingCancelled = recordingCancelled;
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

// فقاعة مؤقتة بتظهر فورًا لما نضغط إرسال على رسالة صوتية، وبتفضل لحد ما
// الرفع يخلص — بديل عن شريط التسجيل اللي كان بيفضل شغال غلط أثناء الرفع
function appendPendingAudioBubble() {
  const wrap = document.createElement("div");
  wrap.className = "message-wrap agent";
  wrap.dataset.pendingUpload = "true";

  const bubble = document.createElement("div");
  bubble.className = "message agent";

  const label = document.createElement("div");
  label.className = "message-label agent";
  label.textContent = getCurrentSenderName();
  bubble.appendChild(label);

  const audioWrap = document.createElement("div");
  audioWrap.style.position = "relative";
  audioWrap.style.width = "220px";
  audioWrap.style.height = "42px";
  audioWrap.style.borderRadius = "21px";
  audioWrap.style.background = "rgba(255,255,255,0.08)";
  audioWrap.style.display = "flex";
  audioWrap.style.alignItems = "center";
  audioWrap.style.justifyContent = "center";
  audioWrap.style.fontSize = "18px";
  audioWrap.textContent = "🎙️";

  const overlay = document.createElement("div");
  overlay.className = "upload-overlay";
  overlay.style.borderRadius = "21px";
  overlay.textContent = "جاري الإرسال...";
  audioWrap.appendChild(overlay);

  bubble.appendChild(audioWrap);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  scrollMessagesToBottom();

  return {
    progress(percent) {
      overlay.textContent = `جاري الإرسال... ${percent}%`;
    },
    done() {
      wrap.remove();
    },
    fail(message = "فشل الإرسال") {
      overlay.textContent = message;
      overlay.classList.add("failed");
    }
  };
}

function sendRecordedAudio(audioFile, pending) {
  if (!activeSessionId) {
    pending?.fail();
    return Promise.resolve();
  }

  recordAudioBtnEl.disabled = true;
  recordAudioBtnEl.textContent = "⏳";

  const formData = new FormData();

  formData.append("file", audioFile);
  formData.append("sessionId", activeSessionId);
  formData.append("caption", "");
  formData.append("messageKind", "audio");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", `${API_BASE}/send-media`);
    xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      pending?.progress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      recordAudioBtnEl.disabled = false;
      recordAudioBtnEl.textContent = "🎤";
      messageInputEl.focus();

      let result = {};
      try {
        result = JSON.parse(xhr.responseText || "{}");
      } catch (e) {
        result = {};
      }

      if (xhr.status === 401 || xhr.status === 403) {
        logout();
        pending?.fail();
        resolve();
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        pending?.done();
        loadConversations();
      } else {
        console.error("Send recorded audio error:", result);
        alert("فشل إرسال الرسالة الصوتية");
        pending?.fail();
      }

      resolve();
    };

    xhr.onerror = () => {
      recordAudioBtnEl.disabled = false;
      recordAudioBtnEl.textContent = "🎤";
      alert("فشل إرسال الرسالة الصوتية");
      pending?.fail("خطأ في الاتصال");
      resolve();
    };

    xhr.send(formData);
  });
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

    if (quickActionsBtnEl) {
      quickActionsBtnEl.disabled = false;
      quickActionsBtnEl.style.display = "inline-flex";
    }

    if (savedRepliesBtnEl) {
      savedRepliesBtnEl.disabled = false;
      savedRepliesBtnEl.style.display = "inline-flex";
    }

    if (savedMediaBtnEl) {
      savedMediaBtnEl.disabled = false;
      savedMediaBtnEl.style.display = "inline-flex";
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
