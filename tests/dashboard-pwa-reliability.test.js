'use strict';
// Synthetic local tests only. Not a replacement for Android installed-PWA QA.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
const part = (a, b) => source.slice(source.indexOf(a), source.indexOf(b, source.indexOf(a)));
const row = (id, sid = 'fb:TEST', time = id) => ({ id, session_id: sid, message: { type: 'user', content: `SYNTHETIC_${id}`, channel: sid.startsWith('fb:') ? 'messenger' : 'whatsapp', external_message_id: `MID_${sid}_${id}`, timestamp: new Date(1700000000000 + time * 1000).toISOString() } });
const response = (rows, extra = {}) => ({ ok: true, status: 200, json: async () => ({ messages: rows, total: rows.length, hasMore: false, ...extra }) });
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
const settle = () => new Promise(resolve => setImmediate(resolve));
function fixture({ standalone = false, previous = true } = {}) {
  const timers = new Map(), requests = [], nodes = [], queue = [], toasts = [];
  let now = Date.now(), timerId = 0, listReads = 0, index = previous ? 1 : 0;
  const entries = [...(previous ? [{ url: 'https://outside.test/', state: {} }] : []), { url: 'https://dashboard.test/', state: {} }];
  const element = () => ({ dataset: {}, style: { values: {}, setProperty(k,v){ this.values[k]=v; }, removeProperty(k){ delete this.values[k]; } }, classList: { values: new Set(['hidden']), add(k){this.values.add(k);}, remove(k){this.values.delete(k);}, contains(k){return this.values.has(k);}, toggle(k,b){b ? this.values.add(k) : this.values.delete(k);} }, remove(){this.removed=true;}, querySelector(){return null;}, appendChild(){} });
  const app = element(); app.classList.remove('hidden');
  const messages = { dataset: {}, childElementCount: 0, scrollHeight: 1000, scrollTop: 900, clientHeight: 100, addEventListener(){}, querySelectorAll(){return nodes;}, querySelector(query){const m=query.match(/\[data-message-storage-id="([^"]+)"\]/);return m ? nodes.find(n=>n.dataset.messageStorageId===m[1]) || null : null;}, set innerHTML(v){nodes.length=0;this.childElementCount=0;this.html=v;}, get innerHTML(){return this.html||'';} };
  const win = { innerWidth: 390, location: new URL('https://dashboard.test/'), visualViewport: { height: 760, offsetTop: 0, scale: 1 }, matchMedia: () => ({ matches: standalone }) };
  const history = { get length(){return entries.length;}, get state(){return entries[index].state;}, pushState(v,t,url){entries.splice(index+1);entries.push({state:v,url:url||entries[index].url});index++;}, replaceState(v,t,url){entries[index]={state:v,url:url||entries[index].url};}, back(){queue.push(()=>{if(index>0){index--;navigate();}});}, forward(){queue.push(()=>{if(index<entries.length-1){index++;navigate();}});} };
  const dialogNodes = Object.fromEntries(['dashboardExitDialog','dashboardExitCancelBtn','dashboardExitConfirmBtn'].map(id => [id, element()]));
  for (const node of Object.values(dialogNodes)) node.focus = () => {};
  const doc = { visibilityState: 'visible', referrer: previous ? 'https://outside.test/' : '', body: element(), querySelector(){return null;}, getElementById:id=>dialogNodes[id] || null };
  const append = raw => {const m=ctx.normalizeMessage(raw), n=element(); n.dataset={messageStorageId:String(m.id||m.storage_id||''),externalMessageId:m.external_message_id,messageSortTimestamp:String(new Date(m.timestamp).getTime())}; nodes.push(n);nodes.sort((a,b)=>Number(a.dataset.messageSortTimestamp)-Number(b.dataset.messageSortTimestamp));messages.childElementCount=nodes.length;return n;};
  const ctx = vm.createContext({ AbortController, URLSearchParams, BigInt, console: {error(){}}, Date: { now:()=>now }, window:win, history, document:doc, navigator:{}, CSS:{escape:String}, authToken:'SYNTHETIC', activeSessionId:'fb:TEST', conversationsData:[{session_id:'fb:TEST'},{session_id:'WA_TEST'}], API_BASE:'https://synthetic.test/api', appEl:app, messagesEl:messages, chatTitleEl:element(), windowExpiredBannerEl:element(), chatComposeEl:element(), sendTemplateInsteadBtnEl:element(), conversationLabelsCache:[], viewingHiddenConversations:false, sessionsSelectMode:false, savedMediaSelectMode:false, eventSource:null,
    setTimeout(f,ms){const id=++timerId;timers.set(id,{f,ms});return id;},clearTimeout:id=>timers.delete(id),
    orderConfirmationConversationBarEl:element(),getCurrentUserRole:()=> 'admin',getAuthHeaders:()=>({}),getOrderConfirmationMessageHeaders:()=>({}),monitorServerSendQueue(){},serverSendQueueViews:new Map(),syncServerSendQueueVisibility(){},renderChatMeta(){},scrollMessagesToBottom(){},getActiveChannel:()=>ctx.activeSessionId.startsWith('fb:')?'messenger':'whatsapp',closeQuickActions(){},removeAiTypingIndicator(){},loadAiStatus(){},syncOrderConfirmationConversationBar(){},renderChatLabelsRow(){},syncSessionProgressVisibility(){},showConversationVisibilityToast:m=>toasts.push(m),loadConversations(){listReads++;},loadHiddenConversations(){listReads++;},updateConversationPreview(){listReads++;},appendMessageToUI:append,findRenderedMessageById:id=>nodes.find(n=>n.dataset.externalMessageId===id)||null,insertMessengerRealtimeMessage:m=>append(m),appendRealtimeMessage:m=>append(m),scheduleMessengerRealtimeMessage:(sid,m)=>append(m),URL:{revokeObjectURL(){}},fetch:async(url,opts)=>{requests.push({url,opts});return handler(url,opts);},EventSource:class {constructor(){this.readyState=1;}close(){this.readyState=2;}},
  });
  let handler = async () => response([row(1)]);
  const run = s => vm.runInContext(s,ctx);
  function navigate(){win.location=new URL(entries[index].url);if(win.location.origin==='https://dashboard.test')ctx.restoreDashboardHistory(history.state);}
  for(const n of ['savedMediaPreviewOverlayEl','orderConfirmationOverlayEl','metaOrderOverlayEl','savedReplyFormEl','labelFormEl','addFolderFormEl','labelsOverlayEl','savedRepliesOverlayEl','savedMediaOverlayEl','emojiPickerPanelEl','templatesPanelEl','quickActionsPanelEl','chatConversationMenuEl','conversationsMenuPanelEl'])ctx[n]=null;
  for(const n of ['closeSavedMediaPreview','closeOrderConfirmationModal','closeMetaOrderModal','closeSavedReplyForm','closeLabelForm','closeFolderForm','closeLabelsOverlay','closeSavedReplies','closeSavedMedia','closeEmojiPicker','exitSavedMediaSelectMode','closeConversationsMenu','exitSessionsSelectMode','exitHiddenView'])ctx[n]=()=>{};
  const RealDate = Date; ctx.Date = class extends RealDate {static now(){return now;}};
  vm.runInContext(part('let messagesRequestToken = 0;', 'function closeMediaViewer(') + part('function normalizeMessage(', 'function getMessageDisplayCount(') + part('function findLastUserMessageTime(', 'async function loadOlderMessages(') + part('function openChat()', 'function renderChatMeta(') + part('function connectEvents()', 'function appendRealtimeMessage('), ctx);
  ctx.closeMediaViewer=()=>run('mediaViewerEl = null');ctx.closeMediaGallery=()=>run('mediaGalleryEl = null');
  return {ctx,run,win,history,doc,nodes,app,messages,requests,toasts,entries,element,queue,get listReads(){return listReads;},get index(){return index;},setFetch(f){handler=f;},advance(ms){now+=ms;},timer(ms){const found=[...timers].find(([,t])=>t.ms===ms);if(found){timers.delete(found[0]);found[1].f();return true;}return false;},flushHistory(){let n=0;while(queue.length){assert(n++<30);queue.shift()();}},seed(rows){rows.forEach(append);messages.dataset.loadedSessionId=ctx.activeSessionId;const last=rows.at(-1);run(`messageSyncAnchors.set(activeSessionId, {id:${JSON.stringify(String(last.id))}})`);},ids(){return nodes.map(n=>n.dataset.messageStorageId);} };
}

test('SSE arriving during initial load is recovered after older snapshot, including fresh reply window',async()=>{
  const f=fixture(),old=deferred();f.setFetch(()=>old.promise);const loading=f.ctx.loadMessages('fb:TEST');f.ctx.connectEvents();
  await f.ctx.eventSource.onmessage({data:JSON.stringify({type:'new_message',sessionId:'fb:TEST',messageType:'user',timestamp:new Date().toISOString(),content:'SYNTHETIC'})});
  old.resolve(response([row(1)]));await loading;f.setFetch(()=>response([row(1),row(2)]));assert(f.timer(120));await settle();assert.deepEqual(f.ids(),['1','2']);assert(!f.ctx.chatComposeEl.classList.contains('window-expired'));
});
test('fast conversation switches discard responses from the previous session',async()=>{
  const f=fixture(),a=deferred(),b=deferred();f.setFetch(url=>url.includes('WA_TEST')?b.promise:a.promise);const pa=f.ctx.loadMessages('fb:TEST');f.ctx.activeSessionId='WA_TEST';const pb=f.ctx.loadMessages('WA_TEST');a.resolve(response([row(1)]));await pa;assert.equal(f.run('loadingMessageSession'),'WA_TEST');b.resolve(response([row(9,'WA_TEST')]));await pb;assert.deepEqual(f.ids(),['9']);assert.equal(f.messages.dataset.loadedSessionId,'WA_TEST');
});
test('canonical anchor fills a multi-page offline gap even if a newest SSE message is already rendered',async()=>{
  const f=fixture();f.seed([row(1)]);f.ctx.appendRealtimeMessage(row(4));f.setFetch(url=>url.includes('beforeId=3')?response([row(1),row(2)]):response([row(3),row(4)],{hasMore:true,nextBeforeId:3}));await f.ctx.reconcileConversationMessages('fb:TEST');assert.deepEqual(f.ids(),['1','2','3','4']);assert.equal(f.requests.length,2);await f.ctx.reconcileConversationMessages('fb:TEST');assert.deepEqual(f.ids(),['1','2','3','4']);
});
test('stale sync job cannot swallow the dirty follow-up of a newer full load in same chat',async()=>{
  const f=fixture(),old=deferred(),snapshot=deferred();f.seed([row(1)]);let calls=0;
  f.setFetch(()=>++calls===1?old.promise:snapshot.promise);f.ctx.requestConversationMessageSync('fb:TEST');f.timer(120);
  const loading=f.ctx.loadMessages('fb:TEST');f.ctx.connectEvents();await f.ctx.eventSource.onmessage({data:JSON.stringify({type:'user_message',sessionId:'fb:TEST'})});
  snapshot.resolve(response([row(1)]));await loading;f.timer(120);old.resolve(response([row(1)]));await settle();
  f.setFetch(()=>response([row(1),row(2)]));assert(f.timer(120));await settle();assert.deepEqual(f.ids(),['1','2']);
});
test('Messenger user_message hint requests canonical synchronization rather than updating only list',async()=>{
  const f=fixture();f.seed([row(1)]);f.setFetch(()=>response([row(1),row(2)]));f.ctx.connectEvents();await f.ctx.eventSource.onmessage({data:JSON.stringify({type:'user_message',sessionId:'fb:TEST'})});assert(f.timer(120));await settle();assert.deepEqual(f.ids(),['1','2']);assert(f.listReads>0);
});
test('list-only conversations_changed notification also reconciles the active chat',async()=>{
  const f=fixture();f.seed([row(1)]);f.setFetch(()=>response([row(1),row(2)]));f.ctx.connectEvents();await f.ctx.eventSource.onmessage({data:JSON.stringify({type:'conversations_changed'})});assert(f.timer(120));await settle();assert.deepEqual(f.ids(),['1','2']);
});
test('resume and EventSource reopen perform read-only catch-up without page reload',async()=>{
  const f=fixture();f.seed([row(1)]);f.ctx.connectEvents();f.setFetch(()=>response([row(1),row(2)]));f.ctx.eventSource.onopen();assert(f.timer(180));assert(f.timer(120));await settle();assert.deepEqual(f.ids(),['1','2']);assert(f.listReads>0);assert(f.requests.every(r=>!r.opts.method||r.opts.method==='GET'));
});
test('resume can replace a stale OPEN transport; callbacks from closed transport are ignored',async()=>{
  const f=fixture();f.seed([row(1)]);f.ctx.connectEvents();const old=f.ctx.eventSource;f.run('dashboardReconnectNeeded = true');f.setFetch(()=>response([row(1),row(2)]));f.ctx.scheduleDashboardRecovery();f.timer(180);assert.notEqual(f.ctx.eventSource,old);assert.equal(old.readyState,2);f.timer(120);await settle();assert.deepEqual(f.ids(),['1','2']);
  await old.onmessage({data:JSON.stringify({type:'new_message',sessionId:'fb:TEST',messageType:'user',content:'OLD_SYNTHETIC'})});assert.deepEqual(f.ids(),['1','2']);
});
test('background events defer fetching until visible and stale catch-up cannot write another chat',async()=>{
  const f=fixture();f.seed([row(1)]);f.doc.visibilityState='hidden';f.ctx.requestConversationMessageSync('fb:TEST');assert(!f.timer(120));f.doc.visibilityState='visible';const pending=deferred();f.setFetch(()=>pending.promise);const job=f.ctx.reconcileConversationMessages('fb:TEST');f.ctx.activeSessionId='WA_TEST';pending.resolve(response([row(2)]));await job;assert.deepEqual(f.ids(),['1']);
});
test('temporary network errors keep visible messages and existing composer state',async()=>{
  const f=fixture();f.seed([row(1)]);f.setFetch(()=>Promise.reject(Error('SYNTHETIC_NETWORK')));await assert.rejects(f.ctx.reconcileConversationMessages('fb:TEST'));assert.deepEqual(f.ids(),['1']);assert(!f.ctx.chatComposeEl.classList.contains('window-expired'));
});
test('WhatsApp sessions preserve exact IDs and use canonical deduplication',async()=>{
  const f=fixture();f.ctx.activeSessionId='WA_TEST';f.seed([row(1,'WA_TEST')]);f.setFetch(()=>response([row(1,'WA_TEST'),row(2,'WA_TEST')]));await f.ctx.reconcileConversationMessages('WA_TEST');await f.ctx.reconcileConversationMessages('WA_TEST');assert.deepEqual(f.ids(),['1','2']);assert(f.requests.every(r=>r.url.includes('/WA_TEST?')));
});
test('previously empty chat keeps older-page cursor when more than a window arrived offline',async()=>{
  const f=fixture();f.messages.dataset.loadedSessionId='fb:TEST';f.setFetch(()=>response(Array.from({length:100},(_,i)=>row(i+201)),{hasMore:true,nextBeforeId:201,total:300}));await f.ctx.reconcileConversationMessages('fb:TEST');assert.equal(f.nodes.length,100);assert.equal(f.run('hasMoreMessages'),true);assert.equal(f.run('oldestLoadedMessageId'),201);
});
test('keyboard VisualViewport shrink and recovery resize the chat without changing recording or permissions',()=>{
  const f=fixture();f.win.visualViewport.height=320;f.win.visualViewport.offsetTop=80;f.ctx.updateDashboardViewport();assert.equal(f.app.style.values['--dashboard-visible-height'],'320px');assert.equal(f.app.style.values['--dashboard-visible-top'],'80px');f.win.visualViewport.height=760;f.win.visualViewport.offsetTop=0;f.ctx.updateDashboardViewport();assert.equal(f.app.style.values['--dashboard-visible-height'],'760px');f.win.visualViewport.scale=2;f.win.visualViewport.height=150;f.ctx.updateDashboardViewport();assert.equal(f.app.style.values['--dashboard-visible-height'],'760px');f.win.innerWidth=1400;f.ctx.updateDashboardViewport();assert.equal(f.app.style.values['--dashboard-visible-height'],undefined);
});
test('expired-window policy remains effective; fresh current-session message alone clears expiry',()=>{
  const f=fixture();f.ctx.activeSessionId='WA_TEST';f.ctx.applyMessagingWindowState(Date.now()-25*3600000);assert(f.ctx.chatComposeEl.classList.contains('window-expired'));f.ctx.applyMessagingWindowState(Date.now());assert(!f.ctx.chatComposeEl.classList.contains('window-expired'));
});
test('Back returns chat to list; Forward restores the correct session without sending',async()=>{
  const f=fixture();f.ctx.openChat();f.ctx.activeSessionId='WA_TEST';f.ctx.openChat();f.history.back();f.flushHistory();assert(!f.app.classList.contains('chat-open'));f.ctx.activeSessionId='fb:TEST';f.history.forward();f.flushHistory();await settle();assert(f.app.classList.contains('chat-open'));assert.equal(f.ctx.activeSessionId,'WA_TEST');assert(f.requests.every(r=>!r.opts.method));
});
test('transient menu consumes Back without closing chat or growing history',()=>{
  const f=fixture();f.ctx.openChat();const menu=f.element();menu.classList.remove('hidden');f.ctx.emojiPickerPanelEl=menu;f.ctx.closeEmojiPicker=()=>menu.classList.add('hidden');const n=f.entries.length;f.history.back();f.flushHistory();assert(menu.classList.contains('hidden'));assert(f.app.classList.contains('chat-open'));assert.equal(f.entries.length,n);f.history.back();f.flushHistory();assert(!f.app.classList.contains('chat-open'));
});
test('PWA root Back opens confirmation; Back and cancel dismiss only, with bounded history',()=>{
  const f=fixture({standalone:true});assert(f.ctx.ensureDashboardExitGuard());const n=f.entries.length;
  for(let i=0;i<5;i++){
    f.history.back();f.flushHistory();assert(f.ctx.dashboardExitDialogOpen());assert.equal(f.index,2);
    f.history.back();f.flushHistory();assert(!f.ctx.dashboardExitDialogOpen());assert.equal(f.index,2);
  }
  f.history.back();f.flushHistory();f.ctx.hideDashboardExitDialog();assert(!f.ctx.dashboardExitDialogOpen());assert.equal(f.entries.length,n);assert.equal(f.toasts.length,0);
});
test('fresh single-entry PWA handles Admin Back before confirmation; exit releases native navigation without logout',()=>{
  const f=fixture({standalone:true,previous:false});assert(f.ctx.ensureDashboardExitGuard());assert.equal(f.entries.length,2);
  const menu=f.element();menu.classList.remove('hidden');f.ctx.conversationsMenuPanelEl=menu;f.ctx.closeConversationsMenu=()=>menu.classList.add('hidden');
  f.history.back();f.flushHistory();assert(menu.classList.contains('hidden'));assert(!f.ctx.dashboardExitDialogOpen());assert.equal(f.index,1);
  f.history.back();f.flushHistory();assert(f.ctx.dashboardExitDialogOpen());f.ctx.releaseDashboardExitGuard();f.flushHistory();assert(!f.ctx.dashboardExitDialogOpen());assert.equal(f.index,0);assert.equal(f.ctx.authToken,'SYNTHETIC');assert.equal(f.ctx.ensureDashboardExitGuard(),false);assert.equal(f.queue.length,0);
  f.history.forward();f.flushHistory();assert.equal(f.index,1);f.history.back();f.flushHistory();assert(f.ctx.dashboardExitDialogOpen());
  assert(!/window\.close\s*\(/.test(source.replace(/\/\/.*$/gm,'')));assert(!/history\.go\(/.test(part('function ensureDashboardExitGuard', 'function requestConversationMessageSync')));
});

test('exit releases exactly our own guard before real prior navigation and never requests logout',()=>{
  const f=fixture({standalone:true});f.ctx.ensureDashboardExitGuard();const n=f.entries.length;
  f.history.back();f.flushHistory();f.ctx.releaseDashboardExitGuard();f.flushHistory();assert.equal(f.index,1);assert.equal(f.ctx.authToken,'SYNTHETIC');
  f.history.back();f.flushHistory();assert.equal(f.win.location.origin,'https://outside.test');assert.equal(f.entries.length,n);assert.equal(f.requests.length,0);
});

test('exit confirmation does not discard Forward chat entries',()=>{
  const f=fixture({standalone:true,previous:false});f.ctx.ensureDashboardExitGuard();f.ctx.openChat();f.history.back();f.flushHistory();const n=f.entries.length;
  f.history.back();f.flushHistory();assert(f.ctx.dashboardExitDialogOpen());f.ctx.hideDashboardExitDialog();f.history.forward();f.flushHistory();assert(f.app.classList.contains('chat-open'));assert.equal(f.history.state.chatSessionId,'fb:TEST');assert.equal(f.entries.length,n);
});

test('Forward while exit confirmation is open closes dialog and restores chat without skipping an entry',()=>{
  const f=fixture({standalone:true,previous:false});f.ctx.ensureDashboardExitGuard();f.ctx.openChat();f.history.back();f.flushHistory();f.history.back();f.flushHistory();assert(f.ctx.dashboardExitDialogOpen());
  f.history.forward();f.flushHistory();assert(!f.ctx.dashboardExitDialogOpen());assert(f.app.classList.contains('chat-open'));assert.equal(f.index,2);assert.equal(f.queue.length,0);
});

test('visible main menu takes Back instead of an offscreen chat menu',()=>{
  const f=fixture({standalone:true,previous:false});f.ctx.ensureDashboardExitGuard();const menu=f.element(),offscreen=f.element();menu.classList.remove('hidden');offscreen.classList.remove('hidden');offscreen.getBoundingClientRect=()=>({width:100,height:30,left:500,right:600,top:0,bottom:30});
  f.ctx.chatConversationMenuEl=offscreen;f.ctx.conversationsMenuPanelEl=menu;f.ctx.closeConversationsMenu=()=>menu.classList.add('hidden');
  f.history.back();f.flushHistory();assert(menu.classList.contains('hidden'));assert(!offscreen.classList.contains('hidden'));assert(!f.ctx.dashboardExitDialogOpen());assert(!f.app.classList.contains('chat-open'));
});

test('viewer closes before menus; menu then closes before underlying chat',()=>{
  const f=fixture({standalone:true});f.ctx.ensureDashboardExitGuard();f.ctx.openChat();const menu=f.element(),node=f.element();menu.classList.remove('hidden');f.ctx.conversationsMenuPanelEl=menu;f.ctx.closeConversationsMenu=()=>menu.classList.add('hidden');f.ctx.savedNode=node;
  const key=f.ctx.rememberDashboardView(node);f.run('mediaViewerEl = savedNode');f.history.pushState({...f.history.state,mediaViewer:true,dashboardViewerKey:key},'');
  f.history.back();f.flushHistory();assert.equal(f.run('mediaViewerEl'),null);assert(!menu.classList.contains('hidden'));assert(f.app.classList.contains('chat-open'));
  f.history.back();f.flushHistory();assert(menu.classList.contains('hidden'));assert(f.app.classList.contains('chat-open'));assert(!f.ctx.dashboardExitDialogOpen());
});

test('resuming navigation after exit consent re-arms one guard without accumulating entries',()=>{
  const f=fixture({standalone:true,previous:false});f.ctx.ensureDashboardExitGuard();f.history.back();f.flushHistory();f.ctx.releaseDashboardExitGuard();f.flushHistory();
  assert.equal(f.index,0);f.ctx.openChat();assert.equal(f.entries.length,3);f.history.back();f.flushHistory();f.history.back();f.flushHistory();assert(f.ctx.dashboardExitDialogOpen());assert.equal(f.entries.length,3);
});

test('dialog markup uses explicit PWA limitation and cancel/exit handlers without logout',()=>{
  const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
  for(const text of ['الخروج من التطبيق','هل تريد الخروج من تطبيق المحراب؟','dashboardExitCancelBtn','dashboardExitConfirmBtn','لا يمكن إغلاق تطبيق PWA برمجيًا بشكل مضمون']) assert(html.includes(text));
  assert(source.includes("addEventListener('click', hideDashboardExitDialog)"));assert(source.includes("addEventListener('click', releaseDashboardExitGuard)"));
  assert(!part('function releaseDashboardExitGuard()', 'function dashboardPanelVisible(').includes('logout'));
});
test('viewer Back/Forward restores the same in-memory view instead of a wrong image',()=>{
  const f=fixture();f.ctx.openChat();const node=f.element();f.ctx.savedNode=node;const key=f.ctx.rememberDashboardView(node);f.run('mediaViewerEl = savedNode');f.history.pushState({...f.history.state,mediaViewer:true,dashboardViewerKey:key},'');f.history.back();f.flushHistory();assert.equal(f.run('mediaViewerEl'),null);assert(f.app.classList.contains('chat-open'));f.history.forward();f.flushHistory();assert.equal(f.run('mediaViewerEl'),node);
});
test('source invariants: API cache bypass, recording errors cancel output, no forced composer display patch',()=>{
  const sw=fs.readFileSync(require('node:path').join(__dirname,'../service-worker.js'),'utf8');assert(sw.includes('url.pathname.startsWith("/api/")'));assert(source.includes('event.currentTarget.recordingCancelled = true'));const css=fs.readFileSync(require('node:path').join(__dirname,'../app.css'),'utf8');assert(css.includes('height: var(--dashboard-visible-height, 100dvh)'));assert(!part('function updateDashboardViewport()', 'const localMediaPreviewUrls').includes('.disabled'));
});
test('old-account fetch and closed EventSource callbacks cannot mutate a newly logged-in view',async()=>{
  const f=fixture(),pending=deferred();f.seed([row(1)]);f.setFetch(()=>pending.promise);f.ctx.connectEvents();const oldSource=f.ctx.eventSource;
  const job=f.ctx.reconcileConversationMessages('fb:TEST');f.ctx.authToken='OTHER_SYNTHETIC';pending.resolve(response([row(2)]));await job;
  await oldSource.onmessage({data:JSON.stringify({type:'new_message',sessionId:'fb:TEST',messageType:'user',content:'SYNTHETIC'})});assert.deepEqual(f.ids(),['1']);
});
test('network retries are bounded and do not recreate any sending request',async()=>{
  const f=fixture();f.seed([row(1)]);f.setFetch(()=>Promise.reject(Error('SYNTHETIC_NETWORK')));f.ctx.requestConversationMessageSync('fb:TEST');
  for(let attempt=0;attempt<4;attempt++){assert(f.timer(120));await settle();if(attempt<3)assert(f.timer(1000*2**(attempt+1)));}
  assert.equal(f.requests.length,4);assert(!f.timer(120));assert(f.requests.every(r=>!r.opts.method));assert.deepEqual(f.ids(),['1']);
});
test('failed first load uses bounded backoff, not a 120ms full-load retry loop',async()=>{
  const f=fixture();f.setFetch(()=>Promise.reject(Error('SYNTHETIC_OFFLINE')));f.ctx.requestConversationMessageSync('fb:TEST');assert(f.timer(120));await settle();assert.equal(f.requests.length,1);assert(!f.timer(120));assert(f.timer(2000));assert(f.timer(120));await settle();assert.equal(f.requests.length,2);assert(!f.timer(120));
});
test('recording error restores hidden controls and marks only the failed recording cancelled',()=>{
  let errorHandler,reset=0;const recorder={addEventListener(type,fn){assert.equal(type,'error');errorHandler=fn;}};
  const control=()=>({style:{display:'none'},disabled:true});const c=vm.createContext({mediaRecorder:recorder,isRecordingAudio:true,stopRecordingStream(){},resetRecordingUi(){reset++;c.hideRecordingBar();},voiceRecordingBarEl:{classList:{add(){}}},voiceRecordingTimeEl:{},messageInputEl:control(),sendBtnEl:control(),attachBtnEl:control(),emojiBtnEl:control(),quickActionsBtnEl:control(),savedRepliesBtnEl:control(),savedMediaBtnEl:control()});
  vm.runInContext(part('function hideRecordingBar()', 'function resetRecordingUi()')+part("mediaRecorder.addEventListener('error'",'    audioChunks = [];'),c);
  errorHandler({currentTarget:recorder});assert(recorder.recordingCancelled);assert.equal(c.messageInputEl.style.display,'');assert.equal(c.sendBtnEl.disabled,false);assert.equal(reset,1);
  c.mediaRecorder={};errorHandler({currentTarget:recorder});assert.equal(reset,1);
});
test('older conversation-list response cannot replace the latest snapshot',async()=>{
  const f=fixture(),first=deferred(),second=deferred();let calls=0;f.ctx.conversationsEl={querySelector:()=>({})};f.ctx.handleInvalidToken=()=>false;f.ctx.applyConversationFilters=()=>{};f.ctx.conversationsRequestToken=0;
  vm.runInContext(part('async function loadConversations()', 'function showConversationVisibilityToast('),f.ctx);
  f.setFetch(()=>++calls===1?first.promise:second.promise);const a=f.ctx.loadConversations(),b=f.ctx.loadConversations();second.resolve({ok:true,json:async()=>[{session_id:'LATEST'}]});await b;first.resolve({ok:true,json:async()=>[{session_id:'OLD'}]});await a;assert.equal(f.ctx.conversationsData[0].session_id,'LATEST');
});
test('WhatsApp realtime rendering delegates to ordered MID-aware insertion without a send call',()=>{
  let received;const c=vm.createContext({insertMessengerRealtimeMessage:msg=>{received=msg;return 'WRAP';}});vm.runInContext(part('function appendRealtimeMessage(', 'function showAiTypingIndicator('),c);
  assert.equal(c.appendRealtimeMessage({message_id:'SYNTHETIC_MID',timestamp:'2026-10-28T00:00:00Z',reply_to:{message_id:'SYNTHETIC_PARENT'}}),'WRAP');assert.equal(received.channel,'whatsapp');assert.equal(received.reply_to.message_id,'SYNTHETIC_PARENT');
});
test('burst notifications coalesce and only one sync fetch runs at a time',async()=>{
  const f=fixture(),pending=deferred();f.seed([row(1)]);f.setFetch(()=>pending.promise);
  for(let i=0;i<5;i++)f.ctx.requestConversationMessageSync('fb:TEST');assert(f.timer(120));assert.equal(f.requests.length,1);
  f.ctx.requestConversationMessageSync('fb:TEST');assert(f.timer(120));assert.equal(f.requests.length,1);
  pending.resolve(response([row(1),row(2)]));await settle();f.setFetch(()=>response([row(1),row(2)]));assert(f.timer(120));await settle();assert.equal(f.requests.length,2);assert(!f.timer(120));assert.deepEqual(f.ids(),['1','2']);
});
test('hung GET headers and body both time out without losing current messages',async()=>{
  for(const body of [false,true]){
    const f=fixture();f.seed([row(1)]);f.setFetch((url,opts)=>{const wait=()=>new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('SYNTHETIC_TIMEOUT'))));return body?Promise.resolve({ok:true,status:200,json:wait}):wait();});
    const job=f.ctx.reconcileConversationMessages('fb:TEST');await settle();assert(f.timer(15000));await assert.rejects(job);assert.deepEqual(f.ids(),['1']);assert.equal(f.run('messageSyncAnchors.get(activeSessionId).id'),'1');
  }
});
test('opening chat during root-history restoration cannot truncate Forward or skip next Back',()=>{
  const f=fixture({standalone:true});f.ctx.ensureDashboardExitGuard();f.history.back();f.queue.shift()();
  assert(f.run('dashboardIgnoreRestoredPop'));f.ctx.openChat();assert.equal(f.history.state.dashboardRoot,'base');f.flushHistory();assert(f.app.classList.contains('chat-open'));assert.equal(f.history.state.chatOpen,true);assert.equal(f.history.state.chatSessionId,'fb:TEST');
  f.history.back();f.flushHistory();assert(!f.app.classList.contains('chat-open'));assert.equal(f.win.location.origin,'https://dashboard.test');f.history.forward();f.flushHistory();assert(f.app.classList.contains('chat-open'));
});
test('forbidden or expired-auth catch-up never adds rows or removes reply-window restrictions',async()=>{
  for(const status of [401,403]){
    const f=fixture();f.ctx.activeSessionId='WA_TEST';f.seed([row(1,'WA_TEST')]);f.ctx.applyMessagingWindowState(Date.now()-25*3600000);
    f.setFetch(()=>({ok:false,status,json:async()=>({error:'SYNTHETIC_DENIED'})}));await f.ctx.reconcileConversationMessages('WA_TEST');assert.deepEqual(f.ids(),['1']);assert(f.ctx.chatComposeEl.classList.contains('window-expired'));
  }
});
test('fresh customer time from a different conversation cannot unlock an expired WhatsApp chat',async()=>{
  const f=fixture();f.messages.dataset.lastUserMessageTime=String(Date.now());f.ctx.activeSessionId='WA_TEST';
  const oldTime=new Date(Date.now()-25*3600000).toISOString();f.setFetch(()=>response([{...row(1,'WA_TEST'),type:'user',created_at:oldTime}]));await f.ctx.loadMessages('WA_TEST');assert(f.ctx.chatComposeEl.classList.contains('window-expired'));assert.equal(f.messages.dataset.lastUserMessageTime,String(new Date(oldTime).getTime()));
});
