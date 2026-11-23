'use strict';
// Run from the frontend repo. PLAYWRIGHT_MODULE/CHROME_EXECUTABLE are optional test-only paths.
// Set ANDROID_ASSETS_DIR to the APK's existing assets directory to run native layout/Back cases.
// Native cases use actual adapter JavaScript with mocked Android transport, not a physical device.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const path = require('node:path');
const androidAssets = process.env.ANDROID_ASSETS_DIR;
const repo = path.resolve(__dirname, '..') + path.sep;
const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

async function fixture(width, native, run) {
  const browser = await chromium.launch(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : { channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width, height: 740 }, hasTouch: width < 600,
      isMobile: width < 600, serviceWorkers: 'block' });
    const errors = [], requests = [], database = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', async route => {
      const req = route.request(), file = new URL(req.url()).pathname.slice(1) || 'index.html';
      if (['index.html', 'app.js', 'app.css', 'native-composer.js','whatsapp-template-catalog.js'].includes(file))
        return route.fulfill({ body: fs.readFileSync(repo + file), contentType:
          file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html' });
      requests.push({ path: file, method: req.method(), body: req.postData() });
      if (/api\/saved-media-items\/\d+\/reorder$/.test(file)) {
        const id = Number(file.split('/')[2]), { order } = req.postDataJSON();
        database.find(i => i.id === id).sort_order = order;
        return route.fulfill({ json: { success: true } });
      }
      if (file === 'api/saved-media-folders/1/items')
        return route.fulfill({ json: { items: [...database].sort((a,b) => a.sort_order - b.sort_order), canManage: true } });
      return route.fulfill({ json: {} });
    });
    if (native) await page.addInitScript(() => {
      window.nativeCalls = [];
      window.nativeLayouts = [];
      window.androidBackResults = [];
      window.AlMehrabHost = { postMessage(raw) { androidBackResults.push(JSON.parse(raw)); } };
      window.AlMehrabComposerLayoutHost = {
        postMessage(raw) { nativeLayouts.push(JSON.parse(raw)); }
      };
      window.AlMehrabComposerHost = {
        postMessage(raw) {
          const r = JSON.parse(raw); nativeCalls.push(r);
          queueMicrotask(() => this.onmessage({ data: JSON.stringify({
            id: r.id, epoch: 'fixture_epoch', version: 1, ok: true
          }) }));
        }
      };
    });
    await page.goto('https://wadashboard.almehrab.org/');
    await page.evaluate(() => {
      authToken = 'fixture'; activeSessionId = 'fb:fixture';
      decodeAuthToken = () => ({ username: 'fixture', role: 'admin' });
      loginScreenEl.classList.add('hidden'); appEl.classList.remove('hidden'); appEl.classList.add('chat-open');
      messageInputEl.value = 'مسودة عربية English 🌷';
      messageInputEl.disabled = sendBtnEl.disabled = false;
      messageInputEl.style.display = '';
      syncDashboardNativeComposer();
    });
    if (native) {
      await page.waitForFunction(() => dashboardNativeComposer?.state === 'ready');
      await page.addScriptTag({ content: fs.readFileSync(
        path.join(androidAssets, 'native-composer-view.js'),'utf8') });
      await page.addScriptTag({ content: fs.readFileSync(
        path.join(androidAssets, 'native-dashboard-adapter.js'),'utf8') });
    }
    const fill = async n => {
      database.splice(0, database.length, ...Array.from({ length: n }, (_, i) => ({
        id: i + 1, media_kind: i % 4 ? 'image' : 'video', media_url: pixel, thumbnail_url: pixel, sort_order: (i+1)*1000
      })));
      await page.evaluate(items => {
        savedMediaCurrentFolder = { id: 1, name: 'اختبار' }; savedMediaItems = items;
        savedMediaCanManage = true; savedMediaSelectMode = false; renderSavedMediaItems();
        savedMediaOverlayEl.classList.remove('hidden'); sendFolderBarEl.classList.remove('hidden');
      }, database);
    };
    await run({ page, fill, requests, database });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
}

for (const width of [320,360,390,1200]) test('fixed thumbnails, isolated scrolling, footer at ' + width, () =>
  fixture(width, false, async ({page,fill}) => {
    let first;
    for (const n of [3,20,100]) {
      await fill(n);
      const m = await page.locator('.saved-media-item-card').first().evaluate(el => {
        const r = el.getBoundingClientRect(), g = el.parentElement;
        return { width:r.width, height:r.height, client:g.clientHeight, scroll:g.scrollHeight };
      });
      first ||= m;
      assert.ok(Math.abs(m.width-first.width)<1 && Math.abs(m.height-first.height)<1, JSON.stringify(m));
      assert.ok(Math.abs(m.width-m.height)<1);
      if (n === 100) assert.ok(m.scroll > m.client * 3);
    }
    const header = await page.locator('.saved-media-header').boundingBox();
    const button = await page.locator('#sendFolderBtn').boundingBox();
    await page.locator('#savedMediaGrid').evaluate(el => { el.scrollTop = el.scrollHeight; });
    const last = await page.locator('.saved-media-item-card').last().boundingBox();
    const grid = await page.locator('#savedMediaGrid').boundingBox();
    assert.ok(last.y + last.height <= grid.y + grid.height + 1);
    assert.deepEqual(await page.locator('.saved-media-header').boundingBox(), header);
    assert.deepEqual(await page.locator('#sendFolderBtn').boundingBox(), button);
    assert.equal(await page.locator('.chat-compose').isVisible(), false);
  }));

for (const width of [320,360,390,1200]) for (const native of [false,true])
test('labels/order coverage and draft restoration '+width+'px native=' + native,
  { skip: native && !androidAssets ? 'Set ANDROID_ASSETS_DIR to test the existing APK adapters' : false }, () =>
  fixture(width, native, async ({page}) => {
    const initial = await page.locator('#messageInput').inputValue();
    const key = native ? await page.evaluate(() => dashboardNativeComposer.key(dashboardNativeComposer.binding)) : null;
    for (let round=0; round<3; round++) for (const id of ['labelsOverlay','metaOrderOverlay','orderConfirmationOverlay']) {
      await page.evaluate(id => document.getElementById(id).classList.remove('hidden'), id);
      await page.waitForFunction(() => document.querySelector('.chat-compose').inert);
      assert.equal(await page.locator('.chat-compose').isVisible(), false);
      if (native) {
        await page.waitForFunction(() => dashboardNativeComposer.binding.visible === false);
        await page.waitForFunction(() => nativeLayouts.at(-1)?.visible === false);
      }
      if (native && round === 2) {
        const backId = 'close-' + id;
        await page.evaluate(backId => AlMehrabAndroidAdapter.back(backId), backId);
        await page.waitForFunction(backId => androidBackResults.some(r =>
          r.action === 'back_result' && r.id === backId && r.status === 'handled'), backId);
        assert.equal(await page.locator('#'+id).isVisible(), false);
        assert.equal(await page.evaluate(()=>activeSessionId),'fb:fixture');
      } else {
        await page.evaluate(id => document.getElementById(id).classList.add('hidden'), id);
      }
      await page.waitForFunction(() => !document.querySelector('.chat-compose').inert);
      assert.equal(await page.locator('.chat-compose').isVisible(), true);
      assert.equal(await page.locator('#messageInput').inputValue(), initial);
      if (native) {
        await page.waitForFunction(() => dashboardNativeComposer.binding.visible === true);
        await page.waitForFunction(() => nativeLayouts.at(-1)?.visible === true);
        assert.equal(await page.evaluate(() => dashboardNativeComposer.key(dashboardNativeComposer.binding)), key);
      }
    }
    await page.setViewportSize({width:320,height:360});
    await page.evaluate(() => metaOrderOverlayEl.classList.remove('hidden'));
    await page.locator('#cancelMetaOrderBtn').click();
    assert.equal(await page.locator('#metaOrderOverlay').isVisible(), false);
    await page.evaluate(() => metaOrderOverlayEl.classList.remove('hidden'));
    await page.locator('#submitMetaOrderBtn').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('#submitMetaOrderBtn').isVisible(), true);
    await page.locator('#submitMetaOrderBtn').click({trial:true});
  }));

test('drag edge scroll persists without motion, stops, reorder save and ordered-send snapshot unchanged', () =>
  fixture(390,false,async ({page,fill,requests}) => {
    await fill(100);
    await page.evaluate(() => {
      savedMediaGridEl.scrollTop = 0;
      const r=savedMediaGridEl.getBoundingClientRect();
      startSavedMediaMobileDrag(1,savedMediaGridEl.firstElementChild,r.left+20,r.bottom-8);
      trackSavedMediaDragScroll(r.left+20,r.bottom-8,true);
    });
    await page.waitForTimeout(600);
    assert.ok(await page.locator('#savedMediaGrid').evaluate(el => el.scrollTop) > 100);
    await page.evaluate(() => { stopSavedMediaDragScroll(); cancelSavedMediaMobileDrag(); });
    const stopped=await page.locator('#savedMediaGrid').evaluate(el=>el.scrollTop);
    await page.waitForTimeout(150);
    assert.equal(await page.locator('#savedMediaGrid').evaluate(el=>el.scrollTop),stopped);
    await page.evaluate(() => {
      savedMediaGridEl.scrollTop=savedMediaGridEl.scrollHeight;
      const r=savedMediaGridEl.getBoundingClientRect();
      trackSavedMediaDragScroll(r.left+20,r.top+8);
    });
    const bottom=await page.locator('#savedMediaGrid').evaluate(el=>el.scrollTop);
    await page.waitForTimeout(500);
    assert.ok(await page.locator('#savedMediaGrid').evaluate(el=>el.scrollTop)<bottom-100);
    await page.evaluate(async () => {
      stopSavedMediaDragScroll();
      await reorderSavedMediaItem(100,savedMediaItems[0],false);
    });
    assert.equal(await page.evaluate(()=>savedMediaItems[0].id),100);
    assert.equal(requests.filter(r=>/reorder$/.test(r.path)).length,1);
    const snapshot=await page.evaluate(() => {
      window.confirm=()=>true; window.folderSnapshot=null;
      enqueueSessionSend=(_s,_k,fn)=>Promise.resolve().then(fn);
      sendSavedMediaFolderToCustomer=async(_id,_sid,ids)=>{window.folderSnapshot=ids;return {durable:true};};
      observeServerSendQueue=()=>true;
      document.getElementById('sendFolderBtn').click();
      return Promise.resolve().then(()=>folderSnapshot);
    });
    assert.equal(snapshot[0],100); assert.equal(snapshot.length,100);
  }));

test('real desktop mouse drag scrolls to last row then drops, and reverses to first row', () =>
  fixture(1200,false,async ({page,fill,requests}) => {
    await fill(20);
    const drag = async (id, down) => {
      await page.locator('.saved-media-item-card[data-id="'+id+'"]').scrollIntoViewIfNeeded();
      const grid=await page.locator('#savedMediaGrid').boundingBox();
      const card=await page.locator('.saved-media-item-card[data-id="'+id+'"]').boundingBox();
      await page.mouse.move(card.x+card.width/2,card.y+card.height/2);
      await page.mouse.down();
      await page.mouse.move(card.x+card.width/2+12,card.y+card.height/2+12,{steps:5});
      await page.mouse.move(grid.x+grid.width/2,down?grid.y+grid.height-5:grid.y+5,{steps:10});
      await page.waitForFunction(down=>{
        const g=document.getElementById('savedMediaGrid');
        return down ? g.scrollTop>=g.scrollHeight-g.clientHeight-2 : g.scrollTop<=1;
      },down,{timeout:7000});
      const target=await page.locator('.saved-media-item-card').nth(down?19:0).boundingBox();
      await page.mouse.move(down?target.x+8:target.x+target.width-8,target.y+target.height/2,{steps:4});
      await page.mouse.up();
    };
    await drag(1,true);
    await page.waitForFunction(()=>savedMediaItems.at(-1)?.id===1);
    await drag(1,false);
    await page.waitForFunction(()=>savedMediaItems[0]?.id===1,null,{timeout:3000});
    assert.equal(requests.filter(r=>/reorder$/.test(r.path)).length,2);
  }));

test('Chromium touch long-press drag auto-scrolls and saves a single reorder without preview/send', () =>
  fixture(390,false,async ({page,fill,requests}) => {
    await fill(20);
    const cdp=await page.context().newCDPSession(page);
    const source=await page.locator('.saved-media-item-card').first().boundingBox();
    const grid=await page.locator('#savedMediaGrid').boundingBox();
    const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{
      type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]
    });
    const x=source.x+source.width/2,y=source.y+source.height/2;
    await touch('touchStart',x,y);
    await page.waitForTimeout(550);
    await touch('touchMove',x+12,y);
    await touch('touchMove',grid.x+grid.width/2,grid.y+grid.height-5);
    await page.waitForFunction(()=>{
      const g=document.getElementById('savedMediaGrid');return g.scrollTop>=g.scrollHeight-g.clientHeight-2;
    },null,{timeout:7000});
    const target=await page.locator('.saved-media-item-card').last().boundingBox();
    await touch('touchMove',target.x+8,target.y+target.height/2);
    await touch('touchEnd',0,0);
    await page.waitForFunction(()=>savedMediaItems.at(-1)?.id===1);
    assert.equal(requests.filter(r=>/reorder$/.test(r.path)).length,1);
    assert.equal(requests.filter(r=>r.method==='POST'&&!/reorder$/.test(r.path)).length,0);
    assert.equal(await page.locator('#savedMediaPreviewOverlay').isVisible(),false);
    assert.equal(await page.evaluate(()=>savedMediaDragScroll),null);
  }));
