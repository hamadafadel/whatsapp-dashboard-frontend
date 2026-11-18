'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const repo=path.resolve(__dirname,'..'),sid='fb:fixture';
const row=(id,kind='text',type='user',extra={})=>({id,session_id:sid,message:{
  channel:'messenger',type,external_message_id:'m_'+id,channel_message_id:'m_'+id,
  content:kind==='text'?'Original text':'',message_kind:kind,
  media_url:'https://example.invalid/'+id,thumbnail_url:kind==='video'?'https://example.invalid/thumb':'',
  ...extra
}});
const response=reply=>row(2,'text','user',{content:'Customer reply',reply_to:reply});
async function fixture(run){
  const browser=await chromium.launch(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{channel:'chrome'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:800},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const errors=[],posts=[];let apiRows=[],gate=null;
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{window.EventSource=class{constructor(){this.readyState=1;}close(){this.readyState=2;}};});
    await page.route('**/*',async r=>{
      const req=r.request(),url=new URL(req.url()),file=url.pathname.slice(1)||'index.html';
      if(req.method()==='POST')posts.push(file);
      if(url.hostname==='example.invalid')return r.fulfill({contentType:'image/png',
        body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aUVEAAAAASUVORK5CYII=','base64')});
      if(['index.html','app.js','app.css','native-composer.js'].includes(file))
        return r.fulfill({body:fs.readFileSync(path.join(repo,file)),contentType:file.endsWith('js')?'text/javascript':file.endsWith('css')?'text/css':'text/html'});
      if(file.startsWith('api/messages/')){
        if(gate)await gate;
        return r.fulfill({json:{messages:apiRows,total:apiRows.length,hasMore:false}});
      }
      return r.fulfill({json:{}});
    });
    await page.goto('https://wadashboard.almehrab.org/');
    await page.evaluate(()=>{
      loginScreenEl.classList.add('hidden');appEl.classList.remove('hidden');appEl.classList.add('chat-open');
      authToken='fixture';activeSessionId='fb:fixture';messagesEl.dataset.loadedSessionId=activeSessionId;
      loadConversations=async()=>{};applyMessagingWindowState=()=>{};
    });
    await run({page,posts,setRows:rows=>{apiRows=rows;},hold:()=>{
      let release;gate=new Promise(r=>release=r);return ()=>{gate=null;release();};
    }});
    assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
  }finally{await browser.close();}
}
for(const [kind,type]of [['image','agent'],['video','agent'],['image','user'],['text','user']])
test('id-only SSE reply resolves a loaded '+type+' '+kind+' by exact MID and still navigates',()=>fixture(async({page})=>{
  const original=row(1,kind,type),reply=response({external_message_id:'m_1'});
  await page.evaluate(rows=>rows.forEach(r=>appendMessageToUI(r,{autoScroll:false})),[original,reply]);
  const box=page.locator('[data-message-storage-id="2"] .quoted-reply-box');
  await page.waitForFunction(()=>!document.querySelector('[data-message-storage-id="2"] .quoted-reply-text').textContent.includes('غير متاحة'));
  if(kind==='image')assert.equal(await box.locator('img').getAttribute('src'),'https://example.invalid/1');
  if(kind==='video'){assert.equal(await box.locator('img').count(),1);assert.match(await box.textContent(),/🎥/);}
  if(kind==='text')assert.match(await box.textContent(),/Original text/);
  await box.click();assert.equal(await page.locator('[data-message-storage-id="1"]').evaluate(el=>el.classList.contains('message-highlight')),true);
}));
test('reproduces raw SSE fallback and upgrades the SAME row from later enriched API response',()=>fixture(async({page,setRows,hold})=>{
  const seed=row(1,'video','agent'),reply=response({external_message_id:'outside_page'});
  const canonical=response({external_message_id:'outside_page',wa_message_id:'outside_page',type:'agent',
    message_kind:'image',media_url:'https://example.invalid/original',content:'📷 صورة',unresolved:false});
  const release=hold();setRows([seed,canonical]);
  await page.evaluate(seed=>{
    appendMessageToUI(seed,{autoScroll:false});messageSyncAnchors.set(activeSessionId,{id:'1'});
    window.fixtureOriginalVideo=messagesEl.querySelector('[data-message-storage-id="1"] video');
    window.fixtureVideoLoads=0;
    fixtureOriginalVideo.load=()=>{fixtureVideoLoads++;};
    connectEvents();eventSource.onmessage({data:JSON.stringify({type:'new_message',channel:'messenger',
      messageType:'user',sessionId:activeSessionId,external_message_id:'m_2',storage_id:2,
      content:'Customer reply',reply_to:{external_message_id:'outside_page'}})});
  },seed);
  await page.waitForSelector('[data-message-storage-id="2"] .quoted-reply-box');
  assert.match(await page.locator('[data-message-storage-id="2"] .quoted-reply-text').textContent(),/غير متاحة/);
  await page.evaluate(()=>{document.querySelector('[data-message-storage-id="2"]')._fixtureMarker=true;});
  release();
  await page.waitForSelector('[data-message-storage-id="2"] .quoted-reply-thumb');
  assert.equal(await page.locator('[data-message-storage-id="2"]').count(),1);
  assert.equal(await page.locator('[data-message-storage-id="2"]').evaluate(el=>el._fixtureMarker),true);
  await page.evaluate(()=>{
    window.fixtureQuoteThumb=document.querySelector('[data-message-storage-id="2"] .quoted-reply-thumb');
    window.fixtureThumbMutations=0;
    window.fixtureThumbObserver=new MutationObserver(records=>{fixtureThumbMutations+=records.length;});
    fixtureThumbObserver.observe(fixtureQuoteThumb,{attributes:true,attributeFilter:['src']});
  });
  await page.evaluate(()=>reconcileConversationMessages(activeSessionId));
  assert.equal(await page.evaluate(()=>fixtureOriginalVideo===messagesEl.querySelector('[data-message-storage-id="1"] video')),true);
  assert.equal(await page.evaluate(()=>fixtureVideoLoads),0);
  assert.equal(await page.evaluate(()=>fixtureQuoteThumb===document.querySelector('[data-message-storage-id="2"] .quoted-reply-thumb')),true);
  assert.equal(await page.evaluate(()=>fixtureThumbMutations),0);
  // A later bare reference must not erase an already-confirmed preview.
  setRows([seed,reply]);await page.evaluate(()=>reconcileConversationMessages(activeSessionId));
  assert.equal(await page.locator('[data-message-storage-id="2"] .quoted-reply-thumb').count(),1);
}));
test('late original fills missing quote, including attachment-only media',()=>fixture(async({page})=>{
  await page.evaluate(r=>appendMessageToUI(r,{autoScroll:false}),response({external_message_id:'m_1'}));
  assert.match(await page.locator('.quoted-reply-text').textContent(),/غير متاحة/);
  await page.evaluate(r=>appendMessageToUI(r,{autoScroll:false}),row(1,'image','agent',{
    media_url:'',attachments:[{type:'image',payload:{url:'https://example.invalid/attachment'}}]
  }));
  await page.waitForSelector('.quoted-reply-thumb');
  assert.equal(await page.locator('.quoted-reply-thumb').getAttribute('src'),'https://example.invalid/attachment');
}));
test('missing, conflicting, duplicate, other-session and other-channel parents remain unavailable',()=>fixture(async({page})=>{
  const cases=[[],[{...row(1,'image'),session_id:'fb:other'}],
    [row(1,'image','agent',{channel:'instagram'})],
    [row(1,'image','agent',{channel_message_id:'m_conflict'})],
    [row(1,'image'),{...row(1,'image'),id:3}]];
  for(const parents of cases){
    await page.evaluate(rows=>{messagesEl.innerHTML='';rows.forEach(r=>appendMessageToUI(r,{autoScroll:false}));},
      [...parents,response({external_message_id:'m_1'})]);
    assert.match(await page.locator('[data-message-storage-id="2"] .quoted-reply-text').textContent(),/غير متاحة/);
    assert.equal(await page.locator('[data-message-storage-id="2"] .quoted-reply-thumb').count(),0);
  }
}));
test('explicit unresolved canonical result is respected and cannot navigate to an ambiguous parent',()=>fixture(async({page})=>{
  await page.evaluate(rows=>rows.forEach(r=>appendMessageToUI(r,{autoScroll:false})),[
    row(1,'image'),response({external_message_id:'m_1',unresolved:true,message_kind:'unknown',type:'unknown',content:'الرسالة الأصلية غير متاحة'})]);
  assert.equal(await page.locator('.quoted-reply-thumb').count(),0);
  assert.equal(await page.locator('.quoted-reply-box').getAttribute('data-reply-target-id'),'');
}));
for(const channel of ['whatsapp','instagram'])test(channel+' keeps its existing supplied quote',()=>fixture(async({page})=>{
  const original=response({wa_message_id:'m_1',type:'user',content:'Existing quote',message_kind:'text'});
  original.message.channel=channel;original.session_id=channel==='instagram'?'ig:fixture':'fixture';
  await page.evaluate(r=>{activeSessionId=r.session_id;appendMessageToUI(r,{autoScroll:false});},original);
  assert.equal(await page.locator('.quoted-reply-text').textContent(),'Existing quote');
}));
