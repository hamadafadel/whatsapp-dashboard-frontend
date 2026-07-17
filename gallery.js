const API_BASE = "https://wadashboardapi.almehrab.org/api";

const loginScreenEl = document.getElementById("galleryLoginScreen");
const loginUsernameEl = document.getElementById("galleryLoginUsername");
const loginPasswordEl = document.getElementById("galleryLoginPassword");
const loginBtnEl = document.getElementById("galleryLoginBtn");
const loginErrorEl = document.getElementById("galleryLoginError");

const appEl = document.getElementById("galleryApp");
const backBtnEl = document.getElementById("galleryBackBtn");
const headerTitleEl = document.getElementById("galleryHeaderTitle");
const logoutBtnEl = document.getElementById("galleryLogoutBtn");

const browseViewEl = document.getElementById("galleryBrowseView");
const foldersGridEl = document.getElementById("galleryFoldersGrid");
const itemsToolbarEl = document.getElementById("galleryItemsToolbar");
const itemsGridEl = document.getElementById("galleryItemsGrid");
const browseStatusEl = document.getElementById("galleryBrowseStatus");

const selectModeBtnEl = document.getElementById("gallerySelectModeBtn");
const downloadFolderBtnEl = document.getElementById("galleryDownloadFolderBtn");
const downloadSelectedBtnEl = document.getElementById("galleryDownloadSelectedBtn");
const cancelSelectBtnEl = document.getElementById("galleryCancelSelectBtn");

const uploadFabEl = document.getElementById("galleryUploadFab");
const uploadInputEl = document.getElementById("galleryUploadInput");
const newFolderFabEl = document.getElementById("galleryNewFolderFab");

const previewOverlayEl = document.getElementById("galleryPreviewOverlay");
const previewCloseBtnEl = document.getElementById("galleryPreviewCloseBtn");
const previewBodyEl = document.getElementById("galleryPreviewBody");
const previewDownloadBtnEl = document.getElementById("galleryPreviewDownloadBtn");

let authToken = localStorage.getItem("dashboard_token") || "";

// كل عنصر في الستاك ده {id, name} — أول ما نفتح فولدر بنضيفه هنا، وبالرجوع
// بنشيله، فبندعم تداخل فولدرات جوه بعض من غير حد لعدد المستويات
let folderStack = [];
let currentItems = [];
let selectMode = false;
let selectedItemIds = new Set();
let previewItem = null;
let myUploadFolderId = null;

function currentFolderId() {
  return folderStack.length ? folderStack[folderStack.length - 1].id : null;
}

function currentFolderName() {
  return folderStack.length ? folderStack[folderStack.length - 1].name : "المعرض";
}

function isMyOwnFolder(folderId) {
  return Boolean(folderId) && folderId === myUploadFolderId;
}

// الأدمن يقدر يضيف فولدرات/ملفات في أي مكان. content_team1 يقدر بس جوه
// فولدره الخاص أو أي فولدر فرعي منه (على أي عمق)
function canWriteHere() {
  if (decodeAuthToken()?.role === "admin") return true;

  return (
    isMyOwnFolder(currentFolderId()) ||
    folderStack.some((f) => f.id === myUploadFolderId)
  );
}

function getAuthHeaders(extraHeaders = {}) {
  return { ...extraHeaders, Authorization: `Bearer ${authToken}` };
}

function decodeAuthToken() {
  try {
    const payloadPart = String(authToken || "").split(".")[1];
    if (!payloadPart) return null;

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

    return JSON.parse(atob(padded));
  } catch (error) {
    return null;
  }
}

function showLogin() {
  loginScreenEl.classList.remove("hidden");
  appEl.classList.add("hidden");
}

function showApp() {
  loginScreenEl.classList.add("hidden");
  appEl.classList.remove("hidden");
}

function logout() {
  localStorage.removeItem("dashboard_token");
  authToken = "";
  showLogin();
}

function handleInvalidToken(res) {
  if (res.status === 401 || res.status === 403) {
    logout();
    return true;
  }
  return false;
}

// ===== توست تقدّم التحميل/الرفع =====
let progressToastEl = null;

function showProgressToast(label) {
  hideProgressToast();

  progressToastEl = document.createElement("div");
  progressToastEl.className = "gallery-progress-toast";

  const labelEl = document.createElement("div");
  labelEl.className = "gallery-progress-label";
  labelEl.textContent = label;

  const track = document.createElement("div");
  track.className = "gallery-progress-bar-track";

  const fill = document.createElement("div");
  fill.className = "gallery-progress-bar-fill";
  track.appendChild(fill);

  progressToastEl.appendChild(labelEl);
  progressToastEl.appendChild(track);
  document.body.appendChild(progressToastEl);
}

function updateProgressToast(label, percent) {
  if (!progressToastEl) return;

  const labelEl = progressToastEl.querySelector(".gallery-progress-label");
  const fillEl = progressToastEl.querySelector(".gallery-progress-bar-fill");

  if (labelEl) labelEl.textContent = label;
  if (fillEl) fillEl.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function hideProgressToast() {
  if (progressToastEl) {
    progressToastEl.remove();
    progressToastEl = null;
  }
}

// بيجيب الملف ويتابع نسبة التقدم لو المتصفح والسيرفر بيدعموا Content-Length،
// وإلا بيرجع الملف كامل من غير نسبة تقدم دقيقة
async function fetchBlobWithProgress(url, options, onProgress) {
  const res = await fetch(url, options);

  if (handleInvalidToken(res)) return null;

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "فشل التحميل");
  }

  const total = Number(res.headers.get("content-length")) || 0;

  if (!res.body || !total) {
    onProgress(100);
    return await res.blob();
  }

  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    received += value.length;
    onProgress(Math.min(99, Math.round((received / total) * 100)));
  }

  onProgress(100);
  return new Blob(chunks);
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.token) {
      loginErrorEl.textContent = "بيانات الدخول غير صحيحة";
      return;
    }

    if (data.user?.role !== "gallery" && data.user?.role !== "admin") {
      loginErrorEl.textContent = "الحساب ده مش حساب معرض صور";
      return;
    }

    authToken = data.token;
    localStorage.setItem("dashboard_token", authToken);

    showApp();
    folderStack = [];
    loadCurrent();
  } catch (err) {
    console.error(err);
    loginErrorEl.textContent = "فشل تسجيل الدخول";
  }
}

loginBtnEl.addEventListener("click", login);
loginPasswordEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});
logoutBtnEl.addEventListener("click", logout);

// ===== التصفح (فولدرات + ملفات في نفس الشاشة) =====
async function loadCurrent() {
  exitSelectMode();

  const folderId = currentFolderId();
  headerTitleEl.textContent = currentFolderName();
  backBtnEl.classList.toggle("hidden", folderStack.length === 0);
  uploadFabEl.classList.toggle("hidden", !canWriteHere());
  newFolderFabEl.classList.toggle("hidden", !canWriteHere());

  foldersGridEl.innerHTML = "";
  itemsGridEl.innerHTML = "";
  itemsToolbarEl.classList.add("hidden");
  browseStatusEl.textContent = "جاري التحميل...";
  currentItems = [];

  try {
    const url = folderId
      ? `${API_BASE}/gallery/browse/${encodeURIComponent(folderId)}`
      : `${API_BASE}/gallery/browse`;

    const res = await fetch(url, { headers: getAuthHeaders() });

    if (handleInvalidToken(res)) return;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "فشل تحميل المحتوى");

    const folders = Array.isArray(data.folders) ? data.folders : [];
    const items = Array.isArray(data.items) ? data.items : [];

    if (!folderStack.length) {
      const ownFolder = folders.find((f) => f.isOwnUploadFolder);
      myUploadFolderId = ownFolder ? ownFolder.id : null;
      uploadFabEl.classList.toggle("hidden", !canWriteHere());
      newFolderFabEl.classList.toggle("hidden", !canWriteHere());
    }

    renderFolders(folders);

    currentItems = items;
    renderItems();
    itemsToolbarEl.classList.toggle("hidden", !items.length);

    browseStatusEl.textContent =
      folders.length || items.length ? "" : "الفولدر فارغ";
  } catch (error) {
    console.error(error);
    browseStatusEl.textContent = error.message || "تعذر تحميل المحتوى";
  }
}

const DRAG_MIME = "application/x-gallery-node-id";

async function moveNodeToFolder(nodeId, targetFolderId) {
  if (!nodeId || nodeId === targetFolderId) return;

  try {
    const res = await fetch(`${API_BASE}/gallery/items/${encodeURIComponent(nodeId)}/move`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ targetFolderId })
    });

    if (handleInvalidToken(res)) return;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "فشل النقل");

    loadCurrent();
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل نقل العنصر");
  }
}

function renderFolders(folders) {
  foldersGridEl.innerHTML = "";

  folders.forEach((folder) => {
    const card = document.createElement("div");
    card.className = "gallery-folder-card";
    card.draggable = canWriteHere();

    const icon = document.createElement("div");
    icon.className = "gallery-folder-icon";
    icon.textContent = "📁";

    const name = document.createElement("div");
    name.className = "gallery-folder-name";
    name.textContent = folder.name || "فولدر";

    card.appendChild(icon);
    card.appendChild(name);

    card.addEventListener("click", () => {
      folderStack.push({ id: folder.id, name: folder.name || "فولدر" });
      loadCurrent();
    });

    // نقل فولدر/ملف تاني جوه الفولدر ده بالسحب والإفلات
    card.addEventListener("dragstart", (event) => {
      event.stopPropagation();
      event.dataTransfer.setData(DRAG_MIME, folder.id);
      event.dataTransfer.effectAllowed = "move";
    });

    card.addEventListener("dragover", (event) => {
      if (!canWriteHere() || !event.dataTransfer.types.includes(DRAG_MIME)) return;
      event.preventDefault();
      card.classList.add("drop-target");
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drop-target");
    });

    card.addEventListener("drop", (event) => {
      if (!canWriteHere() || !event.dataTransfer.types.includes(DRAG_MIME)) return;
      event.preventDefault();
      event.stopPropagation();
      card.classList.remove("drop-target");

      const draggedId = event.dataTransfer.getData(DRAG_MIME);
      moveNodeToFolder(draggedId, folder.id);
    });

    foldersGridEl.appendChild(card);
  });
}

function renderItems() {
  itemsGridEl.innerHTML = "";

  currentItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "gallery-item-card";
    card.classList.toggle("selectable", selectMode);
    card.classList.toggle("selected", selectedItemIds.has(item.id));
    card.draggable = canWriteHere() && !selectMode;

    card.addEventListener("dragstart", (event) => {
      event.stopPropagation();
      event.dataTransfer.setData(DRAG_MIME, item.id);
      event.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });

    const isVideo =
      item.isVideo || String(item.mimeType || "").startsWith("video/");

    if (isVideo) {
      if (item.thumbnailUrl) {
        const img = document.createElement("img");
        img.src = item.thumbnailUrl;
        img.loading = "lazy";
        img.alt = item.name || "";
        card.appendChild(img);

        const badge = document.createElement("div");
        badge.className = "gallery-item-video-badge";
        badge.textContent = "▶";
        card.appendChild(badge);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "gallery-item-video-placeholder";
        placeholder.textContent = "🎬";
        card.appendChild(placeholder);
      }
    } else {
      const fullUrl = `${API_BASE}/gallery/items/${encodeURIComponent(item.id)}/download?token=${encodeURIComponent(authToken)}`;

      const img = document.createElement("img");
      img.src = item.thumbnailUrl || fullUrl;
      img.loading = "lazy";
      img.alt = item.name || "";

      // لو لينك الصورة المصغّرة من درايف فشل (منتهي أو مش موجود)، نرجع
      // للتحميل الكامل بدل ما الصورة تفضل مكسورة
      img.addEventListener("error", () => {
        if (img.src !== fullUrl) img.src = fullUrl;
      }, { once: true });

      card.appendChild(img);
    }

    const check = document.createElement("div");
    check.className = "gallery-item-check";
    check.textContent = "✓";
    card.appendChild(check);

    if (isMyOwnFolder(currentFolderId()) && !selectMode) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "gallery-item-delete";
      deleteBtn.textContent = "🗑";
      deleteBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        if (!confirm("حذف الملف ده؟")) return;

        try {
          const res = await fetch(`${API_BASE}/gallery/items/${encodeURIComponent(item.id)}`, {
            method: "DELETE",
            headers: getAuthHeaders()
          });

          if (handleInvalidToken(res)) return;

          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "فشل الحذف");

          loadCurrent();
        } catch (error) {
          console.error(error);
          alert(error.message || "فشل حذف الملف");
        }
      });
      card.appendChild(deleteBtn);
    }

    card.addEventListener("click", () => {
      if (selectMode) {
        toggleItemSelection(item.id);
      } else {
        openPreview(item);
      }
    });

    itemsGridEl.appendChild(card);
  });
}

function toggleItemSelection(itemId) {
  if (selectedItemIds.has(itemId)) {
    selectedItemIds.delete(itemId);
  } else {
    selectedItemIds.add(itemId);
  }

  downloadSelectedBtnEl.textContent = `⬇ تحميل المحدد (${selectedItemIds.size})`;
  renderItems();
}

function enterSelectMode() {
  if (!currentItems.length) return;

  selectMode = true;
  selectedItemIds.clear();

  selectModeBtnEl.classList.add("active");
  downloadFolderBtnEl.classList.add("hidden");
  downloadSelectedBtnEl.classList.remove("hidden");
  downloadSelectedBtnEl.textContent = "⬇ تحميل المحدد (0)";
  cancelSelectBtnEl.classList.remove("hidden");

  renderItems();
}

function exitSelectMode() {
  selectMode = false;
  selectedItemIds.clear();

  selectModeBtnEl.classList.remove("active");
  downloadFolderBtnEl.classList.remove("hidden");
  downloadSelectedBtnEl.classList.add("hidden");
  cancelSelectBtnEl.classList.add("hidden");

  renderItems();
}

selectModeBtnEl.addEventListener("click", () => {
  if (selectMode) exitSelectMode();
  else enterSelectMode();
});

cancelSelectBtnEl.addEventListener("click", exitSelectMode);

backBtnEl.addEventListener("click", () => {
  folderStack.pop();
  loadCurrent();
});

// ===== التحميل =====
async function downloadBlobFromZipEndpoint(payload, downloadName) {
  showProgressToast("جاري التحضير...");

  try {
    const blob = await fetchBlobWithProgress(
      `${API_BASE}/gallery/download-zip`,
      {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload)
      },
      (percent) => updateProgressToast("جاري التحضير...", percent)
    );

    if (!blob) return;

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } finally {
    hideProgressToast();
  }
}

downloadFolderBtnEl.addEventListener("click", async () => {
  const folderId = currentFolderId();
  if (!folderId) return;

  downloadFolderBtnEl.disabled = true;
  downloadFolderBtnEl.textContent = "جاري التحضير...";

  try {
    await downloadBlobFromZipEndpoint(
      { folderId },
      `${currentFolderName() || "folder"}.zip`
    );
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل تحميل الملفات");
  } finally {
    downloadFolderBtnEl.disabled = false;
    downloadFolderBtnEl.textContent = "⬇ تحميل كل الملفات هنا";
  }
});

downloadSelectedBtnEl.addEventListener("click", async () => {
  const ids = [...selectedItemIds];
  if (!ids.length) return;

  downloadSelectedBtnEl.disabled = true;
  const originalText = downloadSelectedBtnEl.textContent;
  downloadSelectedBtnEl.textContent = "جاري التحضير...";

  try {
    await downloadBlobFromZipEndpoint(
      { fileIds: ids },
      `${currentFolderName() || "selected"}.zip`
    );
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل تحميل الملفات المحددة");
  } finally {
    downloadSelectedBtnEl.disabled = false;
    downloadSelectedBtnEl.textContent = originalText;
  }
});

// ===== معاينة ملف واحد =====
function openPreview(item) {
  previewItem = item;
  previewBodyEl.innerHTML = "";

  const fileUrl = `${API_BASE}/gallery/items/${encodeURIComponent(item.id)}/download?token=${encodeURIComponent(authToken)}`;
  const isVideo =
    item.isVideo || String(item.mimeType || "").startsWith("video/");

  if (isVideo) {
    const video = document.createElement("video");
    video.src = fileUrl;
    video.controls = true;
    video.autoplay = true;
    previewBodyEl.appendChild(video);
  } else {
    const img = document.createElement("img");
    img.src = fileUrl;
    img.alt = item.name || "";
    previewBodyEl.appendChild(img);
  }

  previewOverlayEl.classList.remove("hidden");
}

function closePreview() {
  previewOverlayEl.classList.add("hidden");
  previewBodyEl.innerHTML = "";
  previewItem = null;
}

previewCloseBtnEl.addEventListener("click", closePreview);

previewOverlayEl.addEventListener("click", (event) => {
  if (event.target === previewOverlayEl) closePreview();
});

previewDownloadBtnEl.addEventListener("click", async () => {
  if (!previewItem) return;

  const originalText = previewDownloadBtnEl.textContent;
  previewDownloadBtnEl.disabled = true;
  previewDownloadBtnEl.textContent = "جاري التحضير...";
  showProgressToast("جاري التحضير...");

  try {
    // لازم نجيب الملف كـ blob ونحمّله بلينك محلي (blob:) بدل ما نحط لينك
    // API الأصلي مباشرة على <a download> — سمة download بيتجاهلها المتصفح
    // لو اللينك من دومين مختلف (وده حالتنا هنا)
    const fileUrl = `${API_BASE}/gallery/items/${encodeURIComponent(previewItem.id)}/download?token=${encodeURIComponent(authToken)}`;
    const blob = await fetchBlobWithProgress(
      fileUrl,
      {},
      (percent) => updateProgressToast("جاري التحضير...", percent)
    );

    if (!blob) return;

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = previewItem.name || "file";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل تحميل الملف");
  } finally {
    hideProgressToast();
    previewDownloadBtnEl.disabled = false;
    previewDownloadBtnEl.textContent = originalText;
  }
});

// ===== رفع ملفات جديدة =====
async function uploadFiles(files) {
  if (!files.length) return;

  uploadFabEl.disabled = true;
  const originalText = uploadFabEl.textContent;

  let uploaded = 0;
  const failReasons = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    uploadFabEl.textContent = "…";
    showProgressToast(`جاري رفع ${i + 1} من ${files.length}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (currentFolderId()) formData.append("targetFolderId", currentFolderId());

      const res = await fetch(`${API_BASE}/gallery/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
      });

      if (handleInvalidToken(res)) return;

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل الرفع");

      uploaded++;
    } catch (error) {
      console.error(error);
      failReasons.push(`${file.name}: ${error.message || "خطأ غير معروف"}`);
    }
  }

  hideProgressToast();
  uploadFabEl.disabled = false;
  uploadFabEl.textContent = originalText;

  if (failReasons.length) {
    alert(`اترفع ${uploaded} من ${files.length}، وفشل رفع ${failReasons.length}:\n${failReasons.join("\n")}`);
  } else {
    alert(`تم رفع ${uploaded} ملف بنجاح`);
  }

  loadCurrent();
}

uploadFabEl.addEventListener("click", () => {
  uploadInputEl.click();
});

uploadInputEl.addEventListener("change", () => {
  const files = Array.from(uploadInputEl.files || []);
  uploadInputEl.value = "";
  uploadFiles(files);
});

// ===== سحب وإفلات ملفات للرفع =====
let dragDepth = 0;

function isFileDrag(event) {
  return Array.from(event.dataTransfer?.types || []).includes("Files");
}

browseViewEl.addEventListener("dragenter", (event) => {
  if (!isFileDrag(event) || !canWriteHere()) return;
  event.preventDefault();
  dragDepth++;
  browseViewEl.classList.add("drag-active");
});

browseViewEl.addEventListener("dragover", (event) => {
  if (!isFileDrag(event) || !canWriteHere()) return;
  event.preventDefault();
});

browseViewEl.addEventListener("dragleave", () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) browseViewEl.classList.remove("drag-active");
});

browseViewEl.addEventListener("drop", (event) => {
  if (!isFileDrag(event) || !canWriteHere()) return;
  event.preventDefault();

  dragDepth = 0;
  browseViewEl.classList.remove("drag-active");

  const files = Array.from(event.dataTransfer?.files || []);
  uploadFiles(files);
});

// ===== إنشاء فولدر جديد =====
newFolderFabEl.addEventListener("click", async () => {
  const name = prompt("اسم الفولدر الجديد:");
  if (!name || !name.trim()) return;

  newFolderFabEl.disabled = true;

  try {
    const folderId = currentFolderId();
    const url = folderId
      ? `${API_BASE}/gallery/browse/${encodeURIComponent(folderId)}/folders`
      : `${API_BASE}/gallery/browse/folders`;

    const res = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ name: name.trim() })
    });

    if (handleInvalidToken(res)) return;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "فشل إنشاء الفولدر");

    loadCurrent();
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل إنشاء الفولدر");
  } finally {
    newFolderFabEl.disabled = false;
  }
});

// ===== البداية =====
const galleryTokenRole = decodeAuthToken()?.role;

if (authToken && (galleryTokenRole === "gallery" || galleryTokenRole === "admin")) {
  showApp();
  loadCurrent();
} else {
  if (authToken) logout();
  showLogin();
}
