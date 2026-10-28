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

function saveGalleryNavigation(replace = false) {
  const url = new URL(window.location.href);
  url.hash = currentFolderId() ? new URLSearchParams({ folder: currentFolderId() }).toString() : "";
  const state = { ...window.history.state, galleryNavigation: folderStack.map((f) => ({ ...f })) };
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
  restoreGalleryNavigation();
  if (authToken) loadCurrent();
});
restoreGalleryNavigation();
saveGalleryNavigation(true);

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
  galleryBrowseRequest++;
  myUploadFolderId = null;
  galleryOwnFolderResolved = false;
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
  const request = ++galleryBrowseRequest;
  const token = authToken;
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
async function reorderItemBefore(fileId, targetItem) {
  if (!fileId || fileId === targetItem.id) return;

  const idx = currentItems.findIndex((i) => i.id === targetItem.id);
  const prevItem = idx > 0 ? currentItems[idx - 1] : null;

  const targetOrder = targetItem.order ?? (idx + 1) * 1000;
  const prevOrder = prevItem ? (prevItem.order ?? idx * 1000) : 0;
  const newOrder = (prevOrder + targetOrder) / 2;

  try {
    const res = await fetch(`${API_BASE}/gallery/items/${encodeURIComponent(fileId)}/reorder`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ order: newOrder })
    });

    if (handleInvalidToken(res)) return;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "فشل الترتيب");

    invalidateGalleryFolderCovers();
    loadCurrent();
  } catch (error) {
    console.error(error);
    alert(error.message || "فشل ترتيب الملف");
  }
}

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
  if (target && target.dataset.itemId !== mobileDragState.nodeId) {
    target.classList.add("drop-target");
  }
}

function endMobileDrag(x, y) {
  if (!mobileDragState) return;

  const { nodeId, ghost } = mobileDragState;

  ghost.style.display = "none";
  const el = document.elementFromPoint(x, y);
  const target = el?.closest(".gallery-folder-card, .gallery-item-card");

  document
    .querySelectorAll(".dragging")
    .forEach((c) => c.classList.remove("dragging"));
  document
    .querySelectorAll(".drop-target")
    .forEach((c) => c.classList.remove("drop-target"));

  ghost.remove();
  mobileDragState = null;

  if (target?.dataset.folderId) {
    moveNodeToFolder(nodeId, target.dataset.folderId);
  } else if (target?.dataset.itemId && target.dataset.itemId !== nodeId) {
    const targetItem = currentItems.find((i) => i.id === target.dataset.itemId);
    if (targetItem) reorderItemBefore(nodeId, targetItem);
  }
}

function cancelMobileDrag() {
  if (!mobileDragState) return;

  mobileDragState.ghost.remove();
  document
    .querySelectorAll(".dragging")
    .forEach((c) => c.classList.remove("dragging"));
  document
    .querySelectorAll(".gallery-folder-card.drop-target")
    .forEach((c) => c.classList.remove("drop-target"));
  mobileDragState = null;
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
  let touchHandled = false;

  // شاشات اللمس الحقيقية بتسجل رعشة إصباع طبيعية حتى لو الضغطة "ساكنة"
  // فعليًا — 10px كانت حساسة جدًا وكانت بتلغي تاب حقيقي وتعتبره سكرول.
  // 24px بتفرّق صح بين رعشة عادية وسكرول حقيقي
  const TAP_MOVE_THRESHOLD = 24;

  const clearLongPressTimer = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  card.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;

    const t = event.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    longPressFired = false;
    dragging = false;
    moved = false;
    touchHandled = true;

    // بعد نص ثانية إمساك من غير ما الإصباع يتحرك: نهز الموبايل كإشارة، وبعدين
    // بنقرر في touchend لو هيفتح قايمة (سايبه ساكن) أو هيبدأ سحب (لو اتحرك)
    longPressTimer = setTimeout(() => {
      longPressFired = true;
      if (navigator.vibrate) navigator.vibrate(15);
    }, 500);
  }, { passive: true });

  card.addEventListener("touchmove", (event) => {
    const t = event.touches[0];
    const dist = Math.hypot(t.clientX - startX, t.clientY - startY);

    if (!longPressFired) {
      // قبل ما الضغطة الطويلة تحصل، أي تحريك واضح يبقى سكرول عادي للصفحة —
      // نلغي مؤقت الضغطة الطويلة ونمنع onTap يشتغل بعدين في touchend،
      // ونسيب المتصفح يسكرول عادي (من غير preventDefault)
      if (dist > TAP_MOVE_THRESHOLD) {
        moved = true;
        clearLongPressTimer();
      }
      return;
    }

    if (!dragging && dist > 6 && draggableId && canWriteHere()) {
      dragging = true;
      startMobileDrag(draggableId, card, t.clientX, t.clientY);
    }

    if (dragging) {
      updateMobileDrag(t.clientX, t.clientY);
    }

    event.preventDefault();
  }, { passive: false });

  card.addEventListener("touchend", (event) => {
    clearLongPressTimer();

    if (dragging) {
      const t = event.changedTouches[0];
      endMobileDrag(t.clientX, t.clientY);
      dragging = false;
      return;
    }

    // اتحرك أكتر من عتبة الرعشة الطبيعية من غير ما نوصل لمرحلة السحب = سكرول حقيقي، مش تاب
    if (moved) return;

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
  });

  card.addEventListener("touchcancel", () => {
    clearLongPressTimer();
    if (dragging) {
      cancelMobileDrag();
      dragging = false;
    }
  });

  // الديسكتوب: نفس منطق الرفع القديم، مع تجاهل الـ click الاصطناعي بعد اللمس
  card.addEventListener("click", () => {
    if (touchHandled) {
      touchHandled = false;
      return;
    }
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
      event.dataTransfer.setData(DRAG_MIME, item.id);
      event.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });

    // إفلات ملف تاني فوق الملف ده = رتّبه قبله (سحب وإفلات، ديسكتوب)
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
      reorderItemBefore(draggedId, item);
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
function openPreview(item) {
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

function closePreview() {
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
