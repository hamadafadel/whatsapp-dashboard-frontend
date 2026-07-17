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

const foldersViewEl = document.getElementById("galleryFoldersView");
const foldersGridEl = document.getElementById("galleryFoldersGrid");
const foldersStatusEl = document.getElementById("galleryFoldersStatus");

const itemsViewEl = document.getElementById("galleryItemsView");
const itemsGridEl = document.getElementById("galleryItemsGrid");
const itemsStatusEl = document.getElementById("galleryItemsStatus");

const selectModeBtnEl = document.getElementById("gallerySelectModeBtn");
const downloadFolderBtnEl = document.getElementById("galleryDownloadFolderBtn");
const downloadSelectedBtnEl = document.getElementById("galleryDownloadSelectedBtn");
const cancelSelectBtnEl = document.getElementById("galleryCancelSelectBtn");

const uploadFabEl = document.getElementById("galleryUploadFab");
const uploadInputEl = document.getElementById("galleryUploadInput");

const previewOverlayEl = document.getElementById("galleryPreviewOverlay");
const previewCloseBtnEl = document.getElementById("galleryPreviewCloseBtn");
const previewBodyEl = document.getElementById("galleryPreviewBody");
const previewDownloadBtnEl = document.getElementById("galleryPreviewDownloadBtn");

let authToken = localStorage.getItem("dashboard_token") || "";
let currentFolderId = null;
let currentFolderName = "";
let currentItems = [];
let selectMode = false;
let selectedItemIds = new Set();
let previewItem = null;

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

    if (data.user?.role !== "gallery") {
      loginErrorEl.textContent = "الحساب ده مش حساب معرض صور";
      return;
    }

    authToken = data.token;
    localStorage.setItem("dashboard_token", authToken);

    showApp();
    loadFolders();
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

// ===== الفولدرات =====
function showFoldersView() {
  currentFolderId = null;
  currentFolderName = "";
  exitSelectMode();

  foldersViewEl.classList.remove("hidden");
  itemsViewEl.classList.add("hidden");
  backBtnEl.classList.add("hidden");
  uploadFabEl.classList.remove("hidden");
  headerTitleEl.textContent = "المعرض";
}

async function loadFolders() {
  showFoldersView();
  foldersGridEl.innerHTML = "";
  foldersStatusEl.textContent = "جاري التحميل...";

  try {
    const res = await fetch(`${API_BASE}/gallery/folders`, {
      headers: getAuthHeaders()
    });

    if (handleInvalidToken(res)) return;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "فشل تحميل الفولدرات");

    const folders = Array.isArray(data.folders) ? data.folders : [];
    foldersStatusEl.textContent = folders.length ? "" : "لا يوجد فولدرات حتى الآن";

    folders.forEach((folder) => {
      const card = document.createElement("div");
      card.className = "gallery-folder-card";

      const icon = document.createElement("div");
      icon.className = "gallery-folder-icon";
      icon.textContent = "📁";

      const name = document.createElement("div");
      name.className = "gallery-folder-name";
      name.textContent = folder.name || "فولدر";

      card.appendChild(icon);
      card.appendChild(name);

      card.addEventListener("click", () => {
        openFolder(folder.id, folder.name || "فولدر");
      });

      foldersGridEl.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    foldersStatusEl.textContent = error.message || "تعذر تحميل الفولدرات";
  }
}

// ===== محتويات الفولدر =====
function openFolder(folderId, folderName) {
  currentFolderId = folderId;
  currentFolderName = folderName;
  exitSelectMode();

  foldersViewEl.classList.add("hidden");
  itemsViewEl.classList.remove("hidden");
  backBtnEl.classList.remove("hidden");
  uploadFabEl.classList.add("hidden");
  headerTitleEl.textContent = folderName;

  loadItems(folderId);
}

async function loadItems(folderId) {
  itemsGridEl.innerHTML = "";
  itemsStatusEl.textContent = "جاري التحميل...";

  try {
    const res = await fetch(
      `${API_BASE}/gallery/folders/${encodeURIComponent(folderId)}/items`,
      { headers: getAuthHeaders() }
    );

    if (handleInvalidToken(res)) return;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "فشل تحميل الملفات");

    currentItems = Array.isArray(data.items) ? data.items : [];
    itemsStatusEl.textContent = currentItems.length ? "" : "الفولدر فارغ";

    renderItems();
  } catch (error) {
    console.error(error);
    itemsStatusEl.textContent = error.message || "تعذر تحميل الملفات";
  }
}

function renderItems() {
  itemsGridEl.innerHTML = "";

  currentItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "gallery-item-card";
    card.classList.toggle("selectable", selectMode);
    card.classList.toggle("selected", selectedItemIds.has(item.id));

    const isVideo =
      item.isVideo || String(item.mimeType || "").startsWith("video/");

    if (isVideo) {
      const placeholder = document.createElement("div");
      placeholder.className = "gallery-item-video-placeholder";
      placeholder.textContent = "🎬";
      card.appendChild(placeholder);
    } else {
      const img = document.createElement("img");
      img.src = `${API_BASE}/gallery/items/${encodeURIComponent(item.id)}/download?token=${encodeURIComponent(authToken)}`;
      img.loading = "lazy";
      img.alt = item.name || "";
      card.appendChild(img);
    }

    const check = document.createElement("div");
    check.className = "gallery-item-check";
    check.textContent = "✓";
    card.appendChild(check);

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

backBtnEl.addEventListener("click", loadFolders);

// ===== التحميل =====
async function downloadBlobFromZipEndpoint(payload, downloadName) {
  const res = await fetch(`${API_BASE}/gallery/download-zip`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload)
  });

  if (handleInvalidToken(res)) return;

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "فشل التحميل");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

downloadFolderBtnEl.addEventListener("click", async () => {
  if (!currentFolderId) return;

  downloadFolderBtnEl.disabled = true;
  downloadFolderBtnEl.textContent = "جاري التحضير...";

  try {
    await downloadBlobFromZipEndpoint(
      { folderId: currentFolderId },
      `${currentFolderName || "folder"}.zip`
    );
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل تحميل الفولدر");
  } finally {
    downloadFolderBtnEl.disabled = false;
    downloadFolderBtnEl.textContent = "⬇ تحميل الفولدر كامل";
  }
});

downloadSelectedBtnEl.addEventListener("click", async () => {
  const ids = [...selectedItemIds];
  if (!ids.length) return;

  downloadSelectedBtnEl.disabled = true;

  try {
    await downloadBlobFromZipEndpoint(
      { fileIds: ids },
      `${currentFolderName || "selected"}.zip`
    );
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل تحميل الملفات المحددة");
  } finally {
    downloadSelectedBtnEl.disabled = false;
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

previewDownloadBtnEl.addEventListener("click", () => {
  if (!previewItem) return;

  const fileUrl = `${API_BASE}/gallery/items/${encodeURIComponent(previewItem.id)}/download?token=${encodeURIComponent(authToken)}`;
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = previewItem.name || "file";
  document.body.appendChild(link);
  link.click();
  link.remove();
});

// ===== رفع ملفات جديدة =====
uploadFabEl.addEventListener("click", () => {
  uploadInputEl.click();
});

uploadInputEl.addEventListener("change", async () => {
  const files = Array.from(uploadInputEl.files || []);
  uploadInputEl.value = "";

  if (!files.length) return;

  uploadFabEl.disabled = true;
  const originalText = uploadFabEl.textContent;
  uploadFabEl.textContent = "…";

  let uploaded = 0;
  const failReasons = [];

  for (const file of files) {
    try {
      const formData = new FormData();
      formData.append("file", file);

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

  uploadFabEl.disabled = false;
  uploadFabEl.textContent = originalText;

  if (failReasons.length) {
    alert(`اترفع ${uploaded} من ${files.length}، وفشل رفع ${failReasons.length}:\n${failReasons.join("\n")}`);
  } else {
    alert(`تم رفع ${uploaded} ملف بنجاح`);
  }

  if (!currentFolderId) loadFolders();
});

// ===== البداية =====
if (authToken && decodeAuthToken()?.role === "gallery") {
  showApp();
  loadFolders();
} else {
  if (authToken) logout();
  showLogin();
}
