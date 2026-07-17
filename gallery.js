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

function renderFolders(folders) {
  foldersGridEl.innerHTML = "";

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
      folderStack.push({ id: folder.id, name: folder.name || "فولدر" });
      loadCurrent();
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
  previewDownloadBtnEl.textContent = "جاري التحميل...";

  try {
    const fileUrl = `${API_BASE}/gallery/items/${encodeURIComponent(previewItem.id)}/download?token=${encodeURIComponent(authToken)}`;
    const res = await fetch(fileUrl);

    if (!res.ok) throw new Error("فشل التحميل");

    // لازم نجيب الملف كـ blob ونحمّله بلينك محلي (blob:) بدل ما نحط لينك
    // API الأصلي مباشرة على <a download> — سمة download بيتجاهلها المتصفح
    // لو اللينك من دومين مختلف (وده حالتنا هنا)
    const blob = await res.blob();
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
    previewDownloadBtnEl.disabled = false;
    previewDownloadBtnEl.textContent = originalText;
  }
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

  uploadFabEl.disabled = false;
  uploadFabEl.textContent = originalText;

  if (failReasons.length) {
    alert(`اترفع ${uploaded} من ${files.length}، وفشل رفع ${failReasons.length}:\n${failReasons.join("\n")}`);
  } else {
    alert(`تم رفع ${uploaded} ملف بنجاح`);
  }

  loadCurrent();
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
