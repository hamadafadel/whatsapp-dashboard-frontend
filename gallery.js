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
const moveSelectedBtnEl = document.getElementById("galleryMoveSelectedBtn");
const cancelSelectBtnEl = document.getElementById("galleryCancelSelectBtn");
const sortBtnEl = document.getElementById("gallerySortBtn");
const sortMenuEl = document.getElementById("gallerySortMenu");
const sortAlphabeticalEl = document.getElementById("gallerySortAlphabetical");
const sortCustomEl = document.getElementById("gallerySortCustom");

const pickerOverlayEl = document.getElementById("galleryFolderPickerOverlay");
const pickerBackBtnEl = document.getElementById("galleryPickerBackBtn");
const pickerTitleEl = document.getElementById("galleryPickerTitle");
const pickerCloseBtnEl = document.getElementById("galleryPickerCloseBtn");
const pickerGridEl = document.getElementById("galleryPickerGrid");
const pickerStatusEl = document.getElementById("galleryPickerStatus");
const pickerConfirmBtnEl = document.getElementById("galleryPickerConfirmBtn");

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
let galleryOwnFolderResolved = false;
let galleryBrowseRequest = 0;
let galleryOrderState = { mode: "custom", revision: 0, available: false };
let galleryOrderSaving = false;
let galleryPreviewClosing = false;

// One real history entry per folder; never insert synthetic parent entries.
function restoreGalleryNavigation() {
  const id = new URLSearchParams(window.location.hash.slice(1)).get("folder");
  const validId = typeof id === "string" && /^[A-Za-z0-9_-]+$/.test(id);
  const saved = window.history.state?.galleryNavigation;
  const stack = Array.isArray(saved) && saved.every((f) =>
    f && typeof f.id === "string" && /^[A-Za-z0-9_-]+$/.test(f.id) && typeof f.name === "string"
  ) ? saved.map((f) => ({ id: f.id, name: f.name })) : [];
  folderStack = validId
    ? (stack.length && stack[stack.length - 1].id === id ? stack : [{ id, name: "فولدر" }])
    : [];
}

function saveGalleryNavigation(replace = false, preview = null) {
  const url = new URL(window.location.href);
  url.hash = currentFolderId() ? new URLSearchParams({ folder: currentFolderId() }).toString() : "";
  const state = { ...window.history.state, galleryNavigation: folderStack.map((f) => ({ ...f })), galleryPreview: preview };
  window.history[replace ? "replaceState" : "pushState"](state, "", url);
}

function openGalleryFolder(folder) {
  if (folder.id === currentFolderId()) return;
  folderStack.push({ id: folder.id, name: folder.name || "فولدر" });
  saveGalleryNavigation();
  loadCurrent();
}

function goBackInGallery() {
  if (!folderStack.length) return;
  if (window.history.length > 1) {
    window.history.back();
  } else {
    // A standalone direct link has no previous entry to return to.
    folderStack = [];
    saveGalleryNavigation(true);
    if (authToken) loadCurrent();
  }
}

window.addEventListener("popstate", () => {
  galleryPreviewClosing = false;
  const previousFolder = currentFolderId();
  hideGalleryPreview();
  restoreGalleryNavigation();
  if (authToken) {
    if (previousFolder !== currentFolderId()) loadCurrent();
    else restoreGalleryPreview();
  }
});
restoreGalleryNavigation();
saveGalleryNavigation(true, window.history.state?.galleryPreview || null);

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

// Covers use only direct children from the existing browse API. No original
// image downloads, recursive searches, new credentials or n8n actions.
const galleryFolderCoverCache = new Map();
const galleryFolderCoverPending = new Map();
const galleryFolderCoverQueue = [];
const galleryFolderCoverLoads = new WeakMap();
let galleryFolderCoverObserver = null;
let galleryFolderCoverActive = 0;
let galleryFolderCoverEpoch = 0;
let galleryFolderCoverAuthToken = authToken;
function invalidateGalleryFolderCovers() {
  galleryFolderCoverEpoch++;
  galleryFolderCoverCache.clear();galleryFolderCoverPending.clear();
  galleryFolderCoverAuthToken=authToken;
}
function syncGalleryFolderCoverAccount() {
  if(galleryFolderCoverAuthToken!==authToken)invalidateGalleryFolderCovers();
}
function safeGalleryFolderThumbnail(value) {
  try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;} catch {return null;}
}
function cacheGalleryFolderCover(folderId,items) {
  syncGalleryFolderCoverAccount();
  const firstImage=items.find(item=>String(item.mimeType||'').startsWith('image/'));
  const thumbnailUrl=safeGalleryFolderThumbnail(firstImage?.thumbnailUrl);
  galleryFolderCoverCache.delete(folderId);
  galleryFolderCoverCache.set(folderId,{thumbnailUrl,expiresAt:Date.now()+(thumbnailUrl?300000:30000)});
  while(galleryFolderCoverCache.size>200)galleryFolderCoverCache.delete(galleryFolderCoverCache.keys().next().value);
  return thumbnailUrl;
}
function pumpGalleryFolderCovers() {
  while(galleryFolderCoverActive<2&&galleryFolderCoverQueue.length) {
    const job=galleryFolderCoverQueue.shift();
    const valid=()=>job.epoch===galleryFolderCoverEpoch&&job.token===authToken;
    if(!valid()||!job.consumers.some(needed=>needed())) {
      if(galleryFolderCoverPending.get(job.folderId)===job)galleryFolderCoverPending.delete(job.folderId);
      job.resolve(null);continue;
    }
    galleryFolderCoverActive++;
    (async()=>{
      let thumbnailUrl=null;
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
      try {
        const cached=galleryFolderCoverCache.get(job.folderId);
        if(cached&&cached.expiresAt>Date.now())thumbnailUrl=cached.thumbnailUrl;
        else {
          const response=await fetch(`${API_BASE}/gallery/browse/${encodeURIComponent(job.folderId)}`,{
            headers:getAuthHeaders(),signal:controller.signal
          });
          const data=await response.json();
          if(!response.ok||!Array.isArray(data.items))throw Error('COVER_UNAVAILABLE');
          if(valid()) {
            const fresh=galleryFolderCoverCache.get(job.folderId);
            thumbnailUrl=fresh&&fresh.expiresAt>Date.now()?fresh.thumbnailUrl:cacheGalleryFolderCover(job.folderId,data.items);
          }
        }
      } catch {
        const fresh=galleryFolderCoverCache.get(job.folderId);
        if(valid()&&(!fresh||fresh.expiresAt<=Date.now()))cacheGalleryFolderCover(job.folderId,[]);
      } finally {
        clearTimeout(timer);galleryFolderCoverActive--;
        if(galleryFolderCoverPending.get(job.folderId)===job)galleryFolderCoverPending.delete(job.folderId);
        job.resolve(valid()?thumbnailUrl:null);pumpGalleryFolderCovers();
      }
    })();
  }
}
function getGalleryFolderCover(folderId,isNeeded=()=>true) {
  syncGalleryFolderCoverAccount();
  if(!authToken||!folderId)return Promise.resolve(null);
  const cached=galleryFolderCoverCache.get(folderId);
  if(cached&&cached.expiresAt>Date.now())return Promise.resolve(cached.thumbnailUrl);
  const pending=galleryFolderCoverPending.get(folderId);
  if(pending){pending.consumers.push(isNeeded);return pending.promise;}
  let job;
  const promise=new Promise(resolve=>{job={folderId,resolve,token:authToken,epoch:galleryFolderCoverEpoch,consumers:[isNeeded]};});
  job.promise=promise;galleryFolderCoverPending.set(folderId,job);galleryFolderCoverQueue.push(job);
  pumpGalleryFolderCovers();return promise;
}
function releaseGalleryFolderCovers(container) {
  for(const icon of container.querySelectorAll('.gallery-folder-icon')) {
    galleryFolderCoverObserver?.unobserve(icon);galleryFolderCoverLoads.delete(icon);
  }
}
function createGalleryFolderIcon(folder) {
  const icon=document.createElement('div'),fallback=document.createElement('span');
  icon.className='gallery-folder-icon';fallback.className='gallery-folder-fallback';
  fallback.textContent='📁';fallback.setAttribute('aria-hidden','true');icon.appendChild(fallback);
  const load=async()=>{
    if(!icon.isConnected)return;
    syncGalleryFolderCoverAccount();
    const epoch=galleryFolderCoverEpoch,token=authToken;
    const thumbnailUrl=safeGalleryFolderThumbnail(folder.coverThumbnailUrl)||await getGalleryFolderCover(folder.id,()=>icon.isConnected);
    if(!thumbnailUrl||!icon.isConnected||epoch!==galleryFolderCoverEpoch||token!==authToken)return;
    const image=document.createElement('img');image.className='gallery-folder-thumbnail';
    image.alt='';image.loading='lazy';image.decoding='async';image.draggable=false;
    image.onload=()=>{
      if(!icon.isConnected||epoch!==galleryFolderCoverEpoch||token!==authToken){image.remove();return;}
      icon.classList.add('has-cover');
    };
    image.onerror=()=>{
      image.remove();icon.classList.remove('has-cover');
      if(epoch===galleryFolderCoverEpoch&&token===authToken&&galleryFolderCoverCache.get(folder.id)?.thumbnailUrl===thumbnailUrl)cacheGalleryFolderCover(folder.id,[]);
    };
    icon.appendChild(image);image.src=thumbnailUrl;
  };
  if(typeof IntersectionObserver==='function') {
    if(!galleryFolderCoverObserver)galleryFolderCoverObserver=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting) {
        const start=galleryFolderCoverLoads.get(entry.target);
        galleryFolderCoverObserver.unobserve(entry.target);galleryFolderCoverLoads.delete(entry.target);
        start?.().catch(()=>{});
      }
    },{rootMargin:'120px'});
    galleryFolderCoverLoads.set(icon,load);galleryFolderCoverObserver.observe(icon);
  } else setTimeout(()=>load().catch(()=>{}),0);
  return icon;
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
  cancelMobileDrag();
  clearGalleryDropIndicator();
  activeGalleryDragId = null;
  galleryBrowseRequest++;
  myUploadFolderId = null;
  galleryOwnFolderResolved = false;
  hideGalleryPreview();
  localStorage.removeItem("dashboard_token");
  authToken = "";
  invalidateGalleryFolderCovers();
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
    restoreGalleryNavigation();
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
  cancelMobileDrag();
  clearGalleryDropIndicator();
  activeGalleryDragId = null;
  const request = ++galleryBrowseRequest;
  const token = authToken;
  hideGalleryPreview();
  sortMenuEl.classList.add("hidden");
  sortBtnEl.setAttribute("aria-expanded", "false");
  sortBtnEl.disabled = true;
  exitSelectMode();

  const folderId = currentFolderId();
  headerTitleEl.textContent = currentFolderName();
  backBtnEl.classList.toggle("hidden", folderStack.length === 0);
  uploadFabEl.classList.toggle("hidden", !canWriteHere());
  newFolderFabEl.classList.toggle("hidden", !canWriteHere());

  releaseGalleryFolderCovers(foldersGridEl);
  foldersGridEl.innerHTML = "";
  itemsGridEl.innerHTML = "";
  itemsToolbarEl.classList.add("hidden");
  browseStatusEl.textContent = "جاري التحميل...";
  currentItems = [];

  try {
    // Deep links/reloads still need the existing root ownership metadata.
    if (folderId && !galleryOwnFolderResolved && decodeAuthToken()?.role !== "admin") {
      const rootRes = await fetch(`${API_BASE}/gallery/browse`, { headers: getAuthHeaders() });
      if (request !== galleryBrowseRequest || token !== authToken) return;
      if (handleInvalidToken(rootRes)) return;
      const rootData = await rootRes.json();
      if (request !== galleryBrowseRequest || token !== authToken) return;
      if (!rootRes.ok) throw new Error(rootData.error || "فشل تحميل المحتوى");
      myUploadFolderId = (rootData.folders || []).find((f) => f.isOwnUploadFolder)?.id || null;
      galleryOwnFolderResolved = true;
      uploadFabEl.classList.toggle("hidden", !canWriteHere());
      newFolderFabEl.classList.toggle("hidden", !canWriteHere());
    }
    const url = folderId
      ? `${API_BASE}/gallery/browse/${encodeURIComponent(folderId)}`
      : `${API_BASE}/gallery/browse`;

    const res = await fetch(url, { headers: getAuthHeaders() });

    if (request !== galleryBrowseRequest || token !== authToken) return;

    if (handleInvalidToken(res)) return;

    const data = await res.json().catch(() => ({}));
    if (request !== galleryBrowseRequest || token !== authToken) return;
    if (!res.ok) throw new Error(data.error || "فشل تحميل المحتوى");

    const folders = Array.isArray(data.folders) ? data.folders : [];
    const items = Array.isArray(data.items) ? data.items : [];
    galleryOrderState = data.orderState || { mode: "custom", revision: 0, available: false };
    sortBtnEl.disabled = false;
    updateGallerySortControls();
    if(folderId)cacheGalleryFolderCover(folderId,items);

    if (!folderStack.length) {
      const ownFolder = folders.find((f) => f.isOwnUploadFolder);
      myUploadFolderId = ownFolder ? ownFolder.id : null;
      galleryOwnFolderResolved = true;
      uploadFabEl.classList.toggle("hidden", !canWriteHere());
      newFolderFabEl.classList.toggle("hidden", !canWriteHere());
    }

    renderFolders(folders);

    currentItems = items;
    renderItems();
    restoreGalleryPreview();
    itemsToolbarEl.classList.toggle("hidden", !items.length);

    browseStatusEl.textContent =
      folders.length || items.length ? "" : "الفولدر فارغ";
  } catch (error) {
    if (request !== galleryBrowseRequest || token !== authToken) return;
    console.error(error);
    browseStatusEl.textContent = error.message || "تعذر تحميل المحتوى";
  }
}

const DRAG_MIME = "application/x-gallery-node-id";

// بيحط الملف اللي بـ fileId قبل الملف targetItem مباشرة، بترتيب كسري
// (رقم بينه وبين اللي قبله) عشان ما نحتاجش نعيد ترقيم كل الملفات
async function saveGallerySort(mode, fileIds, restoreCustom = false) {
  const folderId = currentFolderId();
  if (!folderId || !canWriteHere() || galleryOrderSaving) return;
  if (!galleryOrderState.available) {
    alert("يلزم نشر Backend وتطبيق Migration ترتيب المعرض أولًا");
    return;
  }
  galleryOrderSaving = true;
  updateGallerySortControls();
  try {
    const res = await fetch(`${API_BASE}/gallery/folders/${encodeURIComponent(folderId)}/order`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ mode, fileIds, revision: galleryOrderState.revision,
        folderPath: folderStack.map((f) => f.id), restoreCustom })
    });

    if (handleInvalidToken(res)) return;

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success !== true) throw new Error(data.error || "فشل الترتيب");

    invalidateGalleryFolderCovers();
    if (folderId === currentFolderId()) await loadCurrent();
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل ترتيب الملف");
  } finally {
    galleryOrderSaving = false;
    updateGallerySortControls();
  }
}

function updateGallerySortControls() {
  sortBtnEl.classList.toggle("hidden", !currentFolderId());
  sortBtnEl.title = !galleryOrderState.available ? "يلزم تطبيق Migration ونشر Backend لدعم حفظ الترتيب" :
    !canWriteHere() ? "تعديل الترتيب متاح فقط لصاحب صلاحية الكتابة في الفولدر" : "اختيار ترتيب الصور";
  sortAlphabeticalEl.disabled = sortCustomEl.disabled = galleryOrderSaving || !canWriteHere() || !galleryOrderState.available;
  sortAlphabeticalEl.setAttribute("aria-pressed", String(galleryOrderState.mode === "alphabetical"));
  sortCustomEl.setAttribute("aria-pressed", String(galleryOrderState.mode === "custom"));
  sortBtnEl.textContent = galleryOrderState.mode === "alphabetical" ? "ترتيب: أبجدي" : "ترتيب: مخصص";
}

sortBtnEl.addEventListener("click", () => {
  sortMenuEl.classList.toggle("hidden");
  sortBtnEl.setAttribute("aria-expanded", String(!sortMenuEl.classList.contains("hidden")));
});
sortAlphabeticalEl.addEventListener("click", () => saveGallerySort("alphabetical", currentItems.map((i) => i.id)));
sortCustomEl.addEventListener("click", () => saveGallerySort("custom", currentItems.map((i) => i.id), true));

async function reorderItemBefore(fileId, targetItem, after = false) {
  if (!fileId || fileId === targetItem.id || galleryOrderState.mode !== "custom" ||
      !currentItems.some((i) => i.id === fileId)) return;
  const ids = currentItems.map((i) => i.id).filter((id) => id !== fileId);
  const index = ids.indexOf(targetItem.id);
  if (index < 0) return;
  ids.splice(index + (after ? 1 : 0), 0, fileId);
  if (ids.every((id, i) => id === currentItems[i].id)) return;
  await saveGallerySort("custom", ids);
}

let galleryDropIndicatorEl = null;
let galleryDropTarget = null;
let activeGalleryDragId = null;
let gallerySuppressClickUntil = 0;

function clearGalleryDropIndicator() {
  galleryDropIndicatorEl?.remove();
  galleryDropIndicatorEl = null;
  galleryDropTarget = null;
}

function resolveGalleryDrop(nodeId, x, y) {
  if (!canWriteHere() || selectMode || galleryOrderSaving || !galleryOrderState.available ||
      galleryOrderState.mode !== "custom" || !currentItems.some((i) => i.id === nodeId)) return null;
  const bounds = itemsGridEl.getBoundingClientRect();
  if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return null;
  const cards = Array.from(itemsGridEl.querySelectorAll(".gallery-item-card"));
  const itemsById = new Map(currentItems.map((item) => [item.id, item]));
  const rtl = window.getComputedStyle(itemsGridEl).direction === "rtl";
  const first = cards[0]?.getBoundingClientRect();
  const second = cards[1]?.getBoundingClientRect();
  const vertical = !second || Math.abs(first.top - second.top) > 2;
  let best = null;
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    if (card.dataset.itemId === nodeId) {
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return null;
      continue;
    }
    const item = itemsById.get(card.dataset.itemId);
    if (!item) continue;
    const dx = Math.max(rect.left - x, 0, x - rect.right);
    const dy = Math.max(rect.top - y, 0, y - rect.bottom);
    const distance = dx * dx + dy * dy;
    if (!best || distance < best.distance) best = { item, rect, distance };
  }
  if (!best) return null;
  const { item, rect } = best;
  const after = vertical ? y >= rect.top + rect.height / 2 :
    rtl ? x < rect.left + rect.width / 2 : x >= rect.left + rect.width / 2;
  return { nodeId, item, after, folderId: currentFolderId(), vertical, rect, rtl };
}

function updateGalleryDropIndicator(nodeId, x, y) {
  const target = resolveGalleryDrop(nodeId, x, y);
  if (!target) { clearGalleryDropIndicator(); return null; }
  if (!galleryDropIndicatorEl) {
    galleryDropIndicatorEl = document.createElement("div");
    galleryDropIndicatorEl.className = "gallery-drop-indicator";
    galleryDropIndicatorEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(galleryDropIndicatorEl);
  }
  const { rect, vertical, after, rtl } = target;
  const style = galleryDropIndicatorEl.style;
  // Fixed viewport coordinates also work across wrapped rows and page scroll.
  style.left = `${vertical ? rect.left : ((after !== rtl) ? rect.right : rect.left) - 2}px`;
  style.top = `${vertical ? (after ? rect.bottom : rect.top) - 2 : rect.top}px`;
  style.width = `${vertical ? rect.width : 4}px`;
  style.height = `${vertical ? 4 : rect.height}px`;
  galleryDropTarget = target;
  return target;
}

function commitGalleryDrop(nodeId) {
  const target = galleryDropTarget;
  clearGalleryDropIndicator();
  if (target && target.nodeId === nodeId && target.folderId === currentFolderId()) {
    reorderItemBefore(nodeId, target.item, target.after);
  }
}

itemsGridEl.addEventListener("dragover", (event) => {
  if (!event.dataTransfer.types.includes(DRAG_MIME) || !activeGalleryDragId) return;
  const target = updateGalleryDropIndicator(activeGalleryDragId, event.clientX, event.clientY);
  if (target) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
  }
});
itemsGridEl.addEventListener("dragleave", (event) => {
  if (!itemsGridEl.contains(event.relatedTarget)) clearGalleryDropIndicator();
});
itemsGridEl.addEventListener("drop", (event) => {
  if (!event.dataTransfer.types.includes(DRAG_MIME)) return;
  event.preventDefault();
  event.stopPropagation();
  const nodeId = event.dataTransfer.getData(DRAG_MIME);
  if (nodeId === activeGalleryDragId) {
    updateGalleryDropIndicator(nodeId, event.clientX, event.clientY);
    commitGalleryDrop(nodeId);
  } else clearGalleryDropIndicator();
  activeGalleryDragId = null;
  gallerySuppressClickUntil = Date.now() + 500;
});

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

    invalidateGalleryFolderCovers();
    loadCurrent();
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل نقل العنصر");
  }
}

// ===== نقل بالسحب على الموبايل (اللمس مش بيدعم HTML5 drag/drop الأصلي) =====
let mobileDragState = null;

function startMobileDrag(nodeId, sourceCard, x, y) {
  clearGalleryDropIndicator();
  activeGalleryDragId = currentItems.some((i) => i.id === nodeId) ? nodeId : null;
  const ghost = document.createElement("div");
  ghost.className = "gallery-drag-ghost";
  ghost.textContent = "📄";
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
  document.body.appendChild(ghost);

  sourceCard.classList.add("dragging");
  mobileDragState = { nodeId, ghost };
}

function updateMobileDrag(x, y) {
  if (!mobileDragState) return;

  mobileDragState.ghost.style.left = `${x}px`;
  mobileDragState.ghost.style.top = `${y}px`;

  document
    .querySelectorAll(".drop-target")
    .forEach((el) => el.classList.remove("drop-target"));

  mobileDragState.ghost.style.display = "none";
  const el = document.elementFromPoint(x, y);
  mobileDragState.ghost.style.display = "";

  const target = el?.closest(".gallery-folder-card, .gallery-item-card");
  if (target?.dataset.folderId) {
    clearGalleryDropIndicator();
    target.classList.add("drop-target");
  } else updateGalleryDropIndicator(mobileDragState.nodeId, x, y);
}

function endMobileDrag(x, y) {
  if (!mobileDragState) return;

  const { nodeId, ghost } = mobileDragState;

  ghost.style.display = "none";
  const el = document.elementFromPoint(x, y);
  const target = el?.closest(".gallery-folder-card, .gallery-item-card");
  if (!target?.dataset.folderId) updateGalleryDropIndicator(nodeId, x, y);

  document
    .querySelectorAll(".dragging")
    .forEach((c) => c.classList.remove("dragging"));
  document
    .querySelectorAll(".drop-target")
    .forEach((c) => c.classList.remove("drop-target"));

  ghost.remove();
  mobileDragState = null;
  activeGalleryDragId = null;
  gallerySuppressClickUntil = Date.now() + 500;

  if (target?.dataset.folderId) {
    clearGalleryDropIndicator();
    moveNodeToFolder(nodeId, target.dataset.folderId);
  } else commitGalleryDrop(nodeId);
}

function cancelMobileDrag() {
  clearGalleryDropIndicator();
  if (!mobileDragState) return;

  mobileDragState.ghost.remove();
  document
    .querySelectorAll(".dragging")
    .forEach((c) => c.classList.remove("dragging"));
  document
    .querySelectorAll(".gallery-folder-card.drop-target")
    .forEach((c) => c.classList.remove("drop-target"));
  mobileDragState = null;
  activeGalleryDragId = null;
  gallerySuppressClickUntil = Date.now() + 500;
}

// بيربط كارت بلمسة طويلة (قايمة إجراءات) وسحب (نقل) وضغطة عادية (تاب)،
// مع تفادي تكرار حدث الـ click الاصطناعي اللي المتصفح بيولده بعد اللمس
function enableCardGestures(card, { onTap, onLongPress, draggableId }) {
  let startX = 0;
  let startY = 0;
  let longPressTimer = null;
  let longPressFired = false;
  let dragging = false;
  let moved = false;
  let touchActive = false;
  let customTouch = false;
  let touchId = null;
  let lastX = 0;
  let lastY = 0;
  let startScrollX = 0;
  let startScrollY = 0;
  let suppressClickUntil = 0;
  let nativeDragNodes = [];

  // Preserve the browsing tap tolerance; Custom mode cancels its drag timer
  // sooner (10px) so an ordinary scroll never becomes a delayed drag.
  const TAP_MOVE_THRESHOLD = 24;
  const canReorderTouch = () => draggableId && canWriteHere() && !selectMode &&
    !galleryOrderSaving && galleryOrderState.available && galleryOrderState.mode === "custom" &&
    currentItems.some((item) => item.id === draggableId);

  const clearLongPressTimer = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  const restoreNativeDrag = () => {
    for (const { node, draggable } of nativeDragNodes) node.draggable = draggable;
    nativeDragNodes = [];
  };

  const cancelTouch = () => {
    clearLongPressTimer();
    restoreNativeDrag();
    if (dragging) cancelMobileDrag();
    dragging = false;
    touchActive = false;
    moved = true;
    suppressClickUntil = Date.now() + 800;
  };

  card.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) { cancelTouch(); return; }
    // Leave the existing delete/action buttons to their own click handlers.
    if (event.target?.closest("button, a, input, select, textarea")) return;

    const t = event.touches[0];
    clearLongPressTimer();
    startX = lastX = t.clientX;
    startY = lastY = t.clientY;
    startScrollX = window.scrollX;
    startScrollY = window.scrollY;
    touchId = t.identifier;
    touchActive = true;
    customTouch = Boolean(canReorderTouch());
    restoreNativeDrag();
    if (customTouch) {
      nativeDragNodes = [card, ...card.querySelectorAll("img")].map((node) => ({ node, draggable: node.draggable }));
      for (const { node } of nativeDragNodes) node.draggable = false;
    }
    longPressFired = false;
    dragging = false;
    moved = false;
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      if (!touchActive || moved) return;
      if (card.isConnected === false) { cancelTouch(); return; }
      if (customTouch && (!canReorderTouch() || window.scrollX !== startScrollX || window.scrollY !== startScrollY)) {
        cancelTouch();
        return;
      }
      longPressFired = true;
      if (customTouch) {
        dragging = true;
        suppressClickUntil = Date.now() + 800;
        startMobileDrag(draggableId, card, lastX, lastY);
        updateMobileDrag(lastX, lastY);
      }
      if (navigator.vibrate) navigator.vibrate(15);
    }, customTouch ? 400 : 500);
  }, { passive: true });

  card.addEventListener("touchmove", (event) => {
    if (!touchActive) return;
    if (event.touches.length !== 1 || event.touches[0].identifier !== touchId) { cancelTouch(); return; }
    const t = event.touches[0];
    lastX = t.clientX;
    lastY = t.clientY;
    const dist = Math.hypot(t.clientX - startX, t.clientY - startY);

    if (!longPressFired) {
      // قبل ما الضغطة الطويلة تحصل، أي تحريك واضح يبقى سكرول عادي للصفحة —
      // نلغي مؤقت الضغطة الطويلة ونمنع onTap يشتغل بعدين في touchend،
      // ونسيب المتصفح يسكرول عادي (من غير preventDefault)
      if (dist > (customTouch ? 10 : TAP_MOVE_THRESHOLD)) {
        moved = true;
        clearLongPressTimer();
      }
      return;
    }

    if (!dragging && !customTouch && dist > 6 && draggableId && canWriteHere()) {
      dragging = true;
      startMobileDrag(draggableId, card, t.clientX, t.clientY);
    }

    if (dragging) {
      if (customTouch && !canReorderTouch()) { cancelTouch(); return; }
      updateMobileDrag(t.clientX, t.clientY);
    }

    event.preventDefault();
  }, { passive: false });

  card.addEventListener("touchend", (event) => {
    if (!touchActive) return;
    if (card.isConnected === false) { cancelTouch(); return; }
    const t = Array.from(event.changedTouches).find((touch) => touch.identifier === touchId);
    if (!t || event.touches.length) { cancelTouch(); return; }
    clearLongPressTimer();
    touchActive = false;
    restoreNativeDrag();
    suppressClickUntil = Date.now() + 800;

    if (dragging) {
      if (event.cancelable) event.preventDefault();
      endMobileDrag(t.clientX, t.clientY);
      dragging = false;
      return;
    }

    // اتحرك أكتر من عتبة الرعشة الطبيعية من غير ما نوصل لمرحلة السحب = سكرول حقيقي، مش تاب
    if (moved) return;
    if (event.cancelable) event.preventDefault();

    if (longPressFired) {
      // إمساك ساكن وسايبه من غير ما يسحب = افتح القايمة لو فيه واحدة،
      // وإلا (زي وضع التحديد) يبقى نفس تأثير الضغطة العادية
      if (onLongPress) {
        onLongPress(startX, startY);
      } else {
        onTap?.();
      }
      return;
    }

    onTap?.();
  }, { passive: false });

  card.addEventListener("touchcancel", cancelTouch);

  // Prevent the browser's native image drag from stealing a held touch. Mouse
  // drag handlers are unchanged; touch uses only the handlers above.
  card.addEventListener("dragstart", (event) => {
    if (customTouch && (touchActive || Date.now() < suppressClickUntil)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  // الديسكتوب: نفس منطق الرفع القديم، مع تجاهل الـ click الاصطناعي بعد اللمس
  card.addEventListener("click", (event) => {
    if (touchActive || dragging || Date.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (activeGalleryDragId || Date.now() < gallerySuppressClickUntil) return;
    onTap?.();
  });
}

// ===== نافذة اختيار فولدر — نقل لأي مكان حتى لو مش ظاهر في الشاشة الحالية =====
let pickerStack = [];
let pickerMoveIds = [];

function pickerCurrentFolderId() {
  return pickerStack.length ? pickerStack[pickerStack.length - 1].id : "";
}

function openFolderPicker(nodeIds) {
  pickerMoveIds = nodeIds;
  pickerStack = [];
  pickerOverlayEl.classList.remove("hidden");
  loadPickerCurrent();
}

function closeFolderPicker() {
  pickerOverlayEl.classList.add("hidden");
  pickerMoveIds = [];
  pickerStack = [];
}

async function loadPickerCurrent() {
  const folderId = pickerCurrentFolderId();
  pickerTitleEl.textContent = pickerStack.length
    ? pickerStack[pickerStack.length - 1].name
    : "المعرض";
  pickerBackBtnEl.classList.toggle("hidden", pickerStack.length === 0);

  releaseGalleryFolderCovers(pickerGridEl);
  pickerGridEl.innerHTML = "";
  pickerStatusEl.textContent = "جاري التحميل...";

  try {
    const url = folderId
      ? `${API_BASE}/gallery/browse/${encodeURIComponent(folderId)}`
      : `${API_BASE}/gallery/browse`;

    const res = await fetch(url, { headers: getAuthHeaders() });
    if (handleInvalidToken(res)) return;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "فشل تحميل الفولدرات");
    if(folderId&&Array.isArray(data.items))cacheGalleryFolderCover(folderId,data.items);

    const folders = Array.isArray(data.folders) ? data.folders : [];
    pickerStatusEl.textContent = folders.length ? "" : "مفيش فولدرات هنا";

    folders.forEach((folder) => {
      // ما تسبش المستخدم ينقل فولدر جوه نفسه
      if (pickerMoveIds.includes(folder.id)) return;

      const card = document.createElement("div");
      card.className = "gallery-folder-card";

      const icon = createGalleryFolderIcon(folder);

      const name = document.createElement("div");
      name.className = "gallery-folder-name";
      name.textContent = folder.name || "فولدر";

      card.appendChild(icon);
      card.appendChild(name);

      card.addEventListener("click", () => {
        pickerStack.push({ id: folder.id, name: folder.name || "فولدر" });
        loadPickerCurrent();
      });

      pickerGridEl.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    pickerStatusEl.textContent = error.message || "تعذر تحميل الفولدرات";
  }
}

pickerBackBtnEl.addEventListener("click", () => {
  pickerStack.pop();
  loadPickerCurrent();
});

pickerCloseBtnEl.addEventListener("click", closeFolderPicker);

pickerOverlayEl.addEventListener("click", (event) => {
  if (event.target === pickerOverlayEl) closeFolderPicker();
});

pickerConfirmBtnEl.addEventListener("click", async () => {
  const targetFolderId = pickerCurrentFolderId();
  const ids = [...pickerMoveIds];

  pickerConfirmBtnEl.disabled = true;
  pickerConfirmBtnEl.textContent = "جاري النقل...";

  try {
    for (const id of ids) {
      const res = await fetch(`${API_BASE}/gallery/items/${encodeURIComponent(id)}/move`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ targetFolderId })
      });

      if (handleInvalidToken(res)) return;

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل النقل");
      invalidateGalleryFolderCovers();
    }

    closeFolderPicker();
    if (selectMode) exitSelectMode();
    loadCurrent();
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل نقل العناصر");
  } finally {
    pickerConfirmBtnEl.disabled = false;
    pickerConfirmBtnEl.textContent = "📁 انقل هنا";
  }
});

moveSelectedBtnEl.addEventListener("click", () => {
  const ids = [...selectedItemIds];
  if (!ids.length) return;
  openFolderPicker(ids);
});

function renderFolders(folders) {
  releaseGalleryFolderCovers(foldersGridEl);
  foldersGridEl.innerHTML = "";

  folders.forEach((folder) => {
    const card = document.createElement("div");
    card.className = "gallery-folder-card";
    card.draggable = canWriteHere();
    card.dataset.folderId = folder.id;

    const icon = createGalleryFolderIcon(folder);

    const name = document.createElement("div");
    name.className = "gallery-folder-name";
    name.textContent = folder.name || "فولدر";

    card.appendChild(icon);
    card.appendChild(name);

    const openFolder = () => {
      openGalleryFolder(folder);
    };

    enableCardGestures(card, {
      onTap: openFolder,
      draggableId: folder.id
    });

    // نقل فولدر/ملف تاني جوه الفولدر ده بالسحب والإفلات (ديسكتوب)
    card.addEventListener("dragstart", (event) => {
      event.stopPropagation();
      clearGalleryDropIndicator();
      activeGalleryDragId = null;
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
    card.dataset.itemId = item.id;

    card.addEventListener("dragstart", (event) => {
      event.stopPropagation();
      clearGalleryDropIndicator();
      activeGalleryDragId = item.id;
      event.dataTransfer.setData(DRAG_MIME, item.id);
      event.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      clearGalleryDropIndicator();
      activeGalleryDragId = null;
      gallerySuppressClickUntil = Date.now() + 500;
      card.classList.remove("dragging");
    });

    card.addEventListener("contextmenu", (event) => {
      event.preventDefault();
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

          invalidateGalleryFolderCovers();
          loadCurrent();
        } catch (error) {
          console.error(error);
          alert(error.message || "فشل حذف الملف");
        }
      });
      card.appendChild(deleteBtn);
    }

    enableCardGestures(card, {
      onTap: () => {
        if (selectMode) {
          toggleItemSelection(item.id);
        } else {
          openPreview(item);
        }
      },
      onLongPress: selectMode ? null : (x, y) => showItemActionMenu(item, x, y),
      draggableId: selectMode ? null : item.id
    });

    itemsGridEl.appendChild(card);
  });
}

// قايمة إجراءات بتظهر بضغطة طويلة على صورة/فيديو: تحديد / فتح / تحميل
function showItemActionMenu(item, x, y) {
  document.querySelector(".gallery-item-action-menu")?.remove();

  const menu = document.createElement("div");
  menu.className = "gallery-item-action-menu";

  // من غير ده، أول لمسة على أي زرار جوه القايمة كانت بتوصل document وتقفل
  // القايمة قبل ما زرار الفعل نفسه ياخد فرصة يشتغل
  menu.addEventListener("touchstart", (event) => event.stopPropagation());
  menu.addEventListener("click", (event) => event.stopPropagation());

  const selectBtn = document.createElement("button");
  selectBtn.type = "button";
  selectBtn.textContent = "✓ تحديد";
  selectBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    menu.remove();
    if (!selectMode) enterSelectMode();
    toggleItemSelection(item.id);
  });

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.textContent = "👁 فتح";
  openBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    menu.remove();
    openPreview(item);
  });

  const downloadBtn = document.createElement("button");
  downloadBtn.type = "button";
  downloadBtn.textContent = "⬇ تحميل";
  downloadBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    menu.remove();
    downloadSingleItem(item);
  });

  menu.appendChild(selectBtn);
  menu.appendChild(openBtn);
  menu.appendChild(downloadBtn);

  if (canWriteHere()) {
    const moveBtn = document.createElement("button");
    moveBtn.type = "button";
    moveBtn.textContent = "📁 نقل إلى...";
    moveBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      menu.remove();
      openFolderPicker([item.id]);
    });
    menu.appendChild(moveBtn);
  }

  document.body.appendChild(menu);

  const menuWidth = 180;
  const menuHeight = 150;
  menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8))}px`;
  menu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - menuHeight - 8))}px`;

  setTimeout(() => {
    document.addEventListener("click", () => menu.remove(), { once: true });
    document.addEventListener("touchstart", () => menu.remove(), { once: true });
  }, 0);
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
  moveSelectedBtnEl.classList.toggle("hidden", !canWriteHere());
  cancelSelectBtnEl.classList.remove("hidden");

  renderItems();
}

function exitSelectMode() {
  selectMode = false;
  selectedItemIds.clear();

  selectModeBtnEl.classList.remove("active");
  downloadFolderBtnEl.classList.remove("hidden");
  downloadSelectedBtnEl.classList.add("hidden");
  moveSelectedBtnEl.classList.add("hidden");
  cancelSelectBtnEl.classList.add("hidden");

  renderItems();
}

selectModeBtnEl.addEventListener("click", () => {
  if (selectMode) exitSelectMode();
  else enterSelectMode();
});

cancelSelectBtnEl.addEventListener("click", exitSelectMode);

backBtnEl.addEventListener("click", goBackInGallery);

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
function restoreGalleryPreview() {
  const saved = window.history.state?.galleryPreview;
  if (!saved || saved.folderId !== currentFolderId()) return;
  const item = currentItems.find((i) => i.id === saved.id);
  if (item) openPreview(item, true);
}

function openPreview(item, fromHistory = false) {
  if (galleryPreviewClosing && !fromHistory) return;
  if (!fromHistory && previewItem?.id !== item.id) {
    const state = { ...window.history.state, galleryPreview: { id: item.id, folderId: currentFolderId() } };
    window.history[previewItem ? "replaceState" : "pushState"](state, "", window.location.href);
  }
  previewItem = item;
  previewBodyEl.innerHTML = "";

  const isVideo =
    item.isVideo || String(item.mimeType || "").startsWith("video/");

  if (isVideo) {
    const fileUrl = `${API_BASE}/gallery/items/${encodeURIComponent(item.id)}/video-stream?token=${encodeURIComponent(authToken)}`;
    const video = document.createElement("video");
    video.src = fileUrl;
    video.controls = true;
    video.preload = "auto";
    previewBodyEl.appendChild(video);
  } else {
    const fileUrl = `${API_BASE}/gallery/items/${encodeURIComponent(item.id)}/download?token=${encodeURIComponent(authToken)}`;
    const img = document.createElement("img");
    img.src = fileUrl;
    img.alt = item.name || "";
    previewBodyEl.appendChild(img);
  }

  previewOverlayEl.classList.remove("hidden");
}

function hideGalleryPreview() {
  previewOverlayEl.classList.add("hidden");

  const video = previewBodyEl.querySelector("video");
  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }

  previewBodyEl.innerHTML = "";
  previewItem = null;
}

function closePreview() {
  if (galleryPreviewClosing) return;
  if (window.history.state?.galleryPreview) {
    galleryPreviewClosing = true;
    hideGalleryPreview();
    window.history.back();
  } else {
    hideGalleryPreview();
  }
}

previewCloseBtnEl.addEventListener("click", closePreview);

previewOverlayEl.addEventListener("click", (event) => {
  if (event.target === previewOverlayEl) closePreview();
});

let galleryDownloadRequestSequence = 0;
async function downloadSingleItem(item, onDone) {
  const isVideo =
    item.isVideo || String(item.mimeType || "").startsWith("video/");

  if (isVideo) {
    const fileUrl =
      `${API_BASE}/gallery/items/${encodeURIComponent(item.id)}/video-stream` +
      `?token=${encodeURIComponent(authToken)}` +
      `&download=1&filename=${encodeURIComponent(item.name || "video")}`;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = item.name || "video";
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (onDone) onDone();
    return;
  }

  showProgressToast("جاري التحضير...");

  try {
    // لازم نجيب الملف كـ blob ونحمّله بلينك محلي (blob:) بدل ما نحط لينك
    // API الأصلي مباشرة على <a download> — سمة download بيتجاهلها المتصفح
    // لو اللينك من دومين مختلف (وده حالتنا هنا)
    // Explicit downloads bypass even responses cached before this release.
    const fresh = `${Date.now()}-${++galleryDownloadRequestSequence}`;
    const fileUrl = `${API_BASE}/gallery/items/${encodeURIComponent(item.id)}/download?token=${encodeURIComponent(authToken)}&fresh=${fresh}`;
    const blob = await fetchBlobWithProgress(
      fileUrl,
      { cache: "no-store" },
      (percent) => updateProgressToast("جاري التحضير...", percent)
    );

    if (!blob) return;

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = item.name || "file";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل تحميل الملف");
  } finally {
    hideProgressToast();
    if (onDone) onDone();
  }
}

previewDownloadBtnEl.addEventListener("click", async () => {
  if (!previewItem) return;

  const originalText = previewDownloadBtnEl.textContent;
  previewDownloadBtnEl.disabled = true;
  previewDownloadBtnEl.textContent = "جاري التحضير...";

  await downloadSingleItem(previewItem, () => {
    previewDownloadBtnEl.disabled = false;
    previewDownloadBtnEl.textContent = originalText;
  });
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

  if(uploaded)invalidateGalleryFolderCovers();
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
