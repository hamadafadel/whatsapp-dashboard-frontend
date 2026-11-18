'use strict';
const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const repo = path.resolve(__dirname, '..');
async function fixture(run, native = false, width = 390) {
  const browser = await chromium.launch(process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {channel:'chrome'});
  try {
    const page = await browser.newPage({viewport:{width,height:800},isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'});
    const posts = [], errors = [];
    if(native)await page.addInitScript(()=>{
      window.bridgeCalls=[];window.nativeDraft='Samsung draft 🌷';
      window.AlMehrabComposerHost={postMessage(raw){
        const r=JSON.parse(raw);bridgeCalls.push(r);
        queueMicrotask(()=>this.onmessage({data:JSON.stringify({id:r.id,epoch:'fixture_epoch',ok:true,version:1})}));
      }};
    });
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>{
      const f=new URL(r.request().url()).pathname.slice(1)||'index.html';
      if(new URL(r.request().url()).hostname==='example.invalid')
        return r.fulfill({body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aUVEAAAAASUVORK5CYII=','base64'),contentType:'image/png'});
      if(r.request().method()==='POST')posts.push(f);
      if(['index.html','app.js','app.css','native-composer.js'].includes(f))
        return r.fulfill({body:fs.readFileSync(path.join(repo,f)),contentType:f.endsWith('js')?'text/javascript':f.endsWith('css')?'text/css':'text/html'});
      return r.fulfill({json:{}});
    });
    await page.goto('https://wadashboard.almehrab.org/');
    await page.evaluate(()=>{
      requestConversationMessageSync=()=>{};reconcileConversationMessages=async()=>{};
      loadMessages=async()=>{};loadConversations=async()=>{};
      loginScreenEl.classList.add('hidden');appEl.classList.remove('hidden');appEl.classList.add('chat-open');
      authToken='fixture';activeSessionId='fb:fixture';messageInputEl.value='مسودة English 🌷';
      if(window.AlMehrabComposerHost) {
        decodeAuthToken=()=>({username:'fixture'});messageInputEl.disabled=sendBtnEl.disabled=false;
        syncDashboardNativeComposer();
      }
    });
    if(native){
      await page.waitForFunction(()=>dashboardNativeComposer?.state==='ready');
      await page.evaluate(()=>syncDashboardNativeComposer());
      await page.waitForFunction(()=>dashboardNativeComposer.binding.session==='fb:fixture');
    }
    const render=async(channel,kind,type='user',reply=null)=>page.evaluate(({channel,kind,type,reply})=>{
      activeSessionId=channel==='messenger'?'fb:fixture':channel==='instagram'?'ig:fixture':'fixture';
      messagesEl.innerHTML='';clearSelectedReply();
      appendMessageToUI({id:1,message:{channel,type,external_message_id:'m_fixture',content:kind==='text'?'Message':'',
        message_kind:kind,media_url:'https://example.invalid/file',thumbnail_url:'https://example.invalid/thumb',reply_to:reply}});
    },{channel,kind,type,reply});
    const swipe=async(dx,dy=0)=>{
      const el=page.locator('[data-wa-message-id="m_fixture"]').first();
      await el.scrollIntoViewIfNeeded();
      const rect=await el.boundingBox(),x=dx>0?rect.x+25:rect.x+rect.width-25,y=rect.y+10;
      const cdp=await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await cdp.detach();
    };
    await run({page,render,swipe,posts});
    assert.deepEqual(errors,[]);
  } finally {await browser.close();}
}
test('all channels and media directions choose reply exactly once, preserve draft, never react or send',()=>fixture(async({page,render,swipe,posts})=>{
  for(const channel of ['whatsapp','messenger','instagram'])for(const kind of ['text','image','video','audio','document'])for(const dx of [-80,80]){
    await render(channel,kind,dx>0?'agent':'user');
    await page.evaluate(()=>{window.actions=0;showMessageActions=()=>{window.actions++;};});
    await swipe(dx);
    assert.equal(await page.evaluate(()=>selectedReplyMessage?.wa_message_id),'m_fixture',channel+' '+kind+' '+dx);
    assert.equal(await page.locator('#replyBar').count(),1);
    assert.equal(await page.evaluate(()=>window.actions),0);
    assert.equal(await page.evaluate(()=>{
      const wrap=messagesEl.querySelector('[data-wa-message-id="m_fixture"]');
      const target=wrap.querySelector('.message img,.message video,.message-text')||wrap;
      let fired=false;target.addEventListener('click',()=>{fired=true;},{once:true});
      target.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
      return fired;
    }),false);
    assert.equal(await page.locator('#messageInput').inputValue(),'مسودة English 🌷');
    await page.locator('.reply-bar-close').click();
    assert.equal(await page.evaluate(()=>selectedReplyMessage),null);
  }
  assert.deepEqual(posts,[]);
}));
test('vertical scrolling, short swipe and cancellation do not select reply',()=>fixture(async({page,render,swipe,posts})=>{
  for(const [dx,dy]of [[0,90],[30,0],[50,70]]){
    await render('whatsapp','image');await swipe(dx,dy);
    assert.equal(await page.evaluate(()=>selectedReplyMessage),null);
  }
  assert.deepEqual(posts,[]);
}));
test('full reply, id-only fallback and video thumbnail render safely',()=>fixture(async({page,render})=>{
  await render('messenger','text','user',{external_message_id:'original',type:'agent',content:'caption',message_kind:'image',media_url:'https://example.invalid/photo'});
  assert.equal(await page.locator('.quoted-reply-thumb').getAttribute('src'),'https://example.invalid/photo');
  await render('messenger','text','user',{external_message_id:'missing'});
  assert.match(await page.locator('.quoted-reply-text').textContent(),/غير متاحة/);
  await render('messenger','text','user',{external_message_id:'original',type:'user',content:'clip',message_kind:'video',thumbnail_url:'https://example.invalid/video.jpg'});
  assert.equal(await page.locator('.quoted-reply-thumb').count(),1);
  assert.match(await page.locator('.quoted-reply-text').textContent(),/🎥/);
  await render('messenger','text','user',{external_message_id:'original',content:'unsafe',message_kind:'image',media_url:'javascript:alert(1)'});
  assert.equal(await page.locator('.quoted-reply-thumb').count(),0);
}));
test('desktop Reply and Reaction menu buttons remain functional; horizontal scrollers are ignored',()=>fixture(async({page,render,posts})=>{
  await render('whatsapp','text');
  await page.locator('.message-wrap').hover();
  await page.locator('.message-options-trigger').click();
  await page.locator('.message-option-item').filter({hasText:'ريأكت'}).click();
  assert.equal(await page.locator('.message-actions-menu').count(),1);
  assert.ok(await page.locator('.reaction-basic-row').getByRole('button').count()>0);
  await page.evaluate(()=>document.querySelector('.message-actions-menu')?.remove());
  await page.locator('.message-wrap').hover();
  await page.locator('.message-options-trigger').click();
  await page.locator('.message-option-item').filter({hasText:'رد'}).click();
  assert.equal(await page.locator('#replyBar').count(),1);
  await page.locator('.reply-bar-close').click();
  await page.evaluate(()=>{
    const w=messagesEl.querySelector('[data-wa-message-id]');
    const scroller=document.createElement('div');scroller.style.cssText='width:70px;overflow-x:auto;';
    const text=document.createElement('span');text.textContent='scroll '.repeat(30);text.style.whiteSpace='nowrap';
    scroller.append(text);w.append(scroller);
    const touches=[{identifier:1,target:text,clientX:20,clientY:100}].map(t=>new Touch(t));
    text.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches,changedTouches:touches}));
    const moved=[new Touch({identifier:1,target:text,clientX:120,clientY:100})];
    text.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,cancelable:true,touches:moved,changedTouches:moved}));
    text.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],changedTouches:moved}));
  });
  assert.equal(await page.evaluate(()=>selectedReplyMessage),null);
  assert.deepEqual(posts,[]);
},false,1200));
test('native composer receives focus only; swipe/cancel preserves native draft and original send path',()=>fixture(async({page,render,swipe,posts})=>{
  await render('messenger','video');
  await page.evaluate(()=>{bridgeCalls.length=0;});
  await swipe(80);
  assert.equal(await page.locator('#replyBar').count(),1);
  assert.equal(await page.evaluate(()=>selectedReplyMessage.wa_message_id),'m_fixture');
  await page.waitForFunction(()=>bridgeCalls.some(r=>r.action==='focus'));
  await page.locator('.reply-bar-close').click();
  assert.equal(await page.evaluate(()=>nativeDraft),'Samsung draft 🌷');
  assert.deepEqual(await page.evaluate(()=>bridgeCalls.filter(r=>['insert','consume','snapshot','release'].includes(r.action))),[]);
  assert.deepEqual(posts,[]);
},true));
test('ordinary image tap still opens viewer, without reply or automatic reaction',()=>fixture(async({page,render,posts})=>{
  await render('whatsapp','image');
  await page.locator('.message img').tap();
  assert.equal(await page.locator('.media-viewer').isVisible(),true);
  assert.equal(await page.evaluate(()=>selectedReplyMessage),null);
  assert.deepEqual(posts,[]);
}));
test('long-press handler keeps reaction menu; subsequent movement becomes reply without late click (synthetic touches)',()=>fixture(async({page,render,posts})=>{
  await render('whatsapp','image');
  await page.locator('[data-wa-message-id="m_fixture"]').scrollIntoViewIfNeeded();
  const box=await page.locator('[data-wa-message-id="m_fixture"]').boundingBox();
  const x=box.x+25,y=box.y+10;
  const dispatch=async(type,px,py)=>page.evaluate(({type,x,y})=>{
    const w=messagesEl.querySelector('[data-wa-message-id]');
    const touch=new Touch({identifier:1,target:w,clientX:x,clientY:y});
    w.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,
      touches:type==='touchend'?[]:[touch],changedTouches:[touch]}));
  },{type,x:px,y:py});
  await dispatch('touchstart',x,y);
  await page.waitForTimeout(500);
  assert.equal(await page.locator('.message-actions-menu').count(),1);
  await dispatch('touchmove',x+90,y);
  await dispatch('touchend',x+90,y);
  assert.equal(await page.locator('.message-actions-menu').count(),0);
  assert.equal(await page.locator('#replyBar').count(),1);
  assert.equal(await page.locator('.media-viewer').count(),0);
  assert.deepEqual(posts,[]);
}));
