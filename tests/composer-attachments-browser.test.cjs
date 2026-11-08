'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
// Run with Playwright installed, or point PLAYWRIGHT_MODULE at an existing test installation.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aUVEAAAAASUVORK5CYII=','base64');
async function fixture(run,{scripts=true,sid='fb:TEST',reject=false}={}){
 const browser=await chromium.launch(process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {});
 try{
  const page=await browser.newPage({viewport:{width:390,height:800},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const posts=[],errors=[],alerts=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{alerts.push(d.message());await d.dismiss();});
  await page.route('**/*',r=>{
   const u=new URL(r.request().url()),f=u.pathname==='/'?'index.html':u.pathname.slice(1);
   if(f==='api/queued/send-media'){
    posts.push({headers:r.request().headers(),body:r.request().postDataBuffer().toString('latin1')});
    return r.fulfill({status:reject?413:202,json:reject?{error:'حجم المرفق مرفوض'}:{durable:true,jobId:'SYNTHETIC'}});
   }
   if(['index.html','app.css','app.js','native-composer.js'].includes(f))return r.fulfill({
    body:(!scripts&&f.endsWith('.js'))?'':fs.readFileSync(f),
    contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html'
   });
   return r.fulfill({status:200,json:{}});
  });
  await page.goto('https://wadashboard.almehrab.org/');
  await page.evaluate(({scripts,sid})=>{
   document.getElementById('loginScreen').classList.add('hidden');
   document.getElementById('mobileApp').classList.add('chat-open');
   if(scripts){
    authToken='SYNTHETIC';activeSessionId=sid;
    ensureBackendSendQueueReady=async()=>{};readServerSendQueue=async()=>({generation:0,items:[]});
    monitorServerSendQueue=()=>{};loadConversations=()=>{};
   }
  },{scripts,sid});
  async function choose(file){
   const chooser=page.waitForEvent('filechooser');
   await page.locator('#attachBtn').tap();const picked=await chooser;
   if(file)await picked.setFiles(file);
  }
  await run({page,choose,posts,alerts});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
const image={name:'photo.png',mimeType:'image/png',buffer:png};
const pdf={name:'sample.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 synthetic')};
const video={name:'sample.mp4',mimeType:'video/mp4',buffer:Buffer.from('synthetic MP4 transport only')};
const wait=async(fn)=>{for(let i=0;i<100&&!fn();i++)await new Promise(r=>setTimeout(r,40));assert.ok(fn(),'expected outcome did not occur');};
test('mobile tap opens the browser chooser from the real button during the same user gesture',()=>fixture(async({page,choose,posts})=>{
 await page.evaluate(()=>{
  window.pickerClicks=[];
  mediaInputEl.addEventListener('click',e=>pickerClicks.push({active:navigator.userActivation.isActive,prevented:e.defaultPrevented}));
 });
 await choose();
 assert.deepEqual(await page.evaluate(()=>pickerClicks),[{active:true,prevented:false}]);
 assert.equal(posts.length,0);
}));
for(const state of ['connecting','disconnected'])test(`native ${state} state cannot suppress the chooser or turn the tap into focus only`,()=>fixture(async({page,choose,posts})=>{
 await page.evaluate(state=>{
  dashboardNativeComposer={state,capture:()=>{throw Error('Opening the picker must not read a caption');}};
  document.documentElement.dataset.nativeComposer='1';
  document.documentElement.dataset.nativeComposerState=state;
 },state);
 await choose();
 assert.equal(posts.length,0);
}));
for(const [file,kind] of [[image,'image'],[pdf,'file'],[video,'video']])test(`real picker selection posts one multipart ${kind} with correct identity`,()=>fixture(async({choose,posts,page})=>{
 await choose(file);await wait(()=>posts.length===1);
 await page.evaluate(()=>document.getElementById('mediaInput').dispatchEvent(new Event('change')));
 assert.equal(posts.length,1);assert.match(posts[0].headers['content-type'],/^multipart\/form-data; boundary=/);
 assert.ok(posts[0].headers['idempotency-key']);assert.match(posts[0].body,new RegExp('name="messageKind"\\r\\n\\r\\n'+kind));
 assert.match(posts[0].body,/name="sessionId"\r\n\r\nfb:TEST/);
 if(kind==='image')assert.match(posts[0].body,/filename="photo.jpg"/);
}));
test('Android-style layout rejection retries the snapshot, not the multipart send',()=>fixture(async({page,choose,posts})=>{
 await page.evaluate(()=>{window.captures=0;dashboardNativeComposer={state:'ready',capture:async()=>{if(++captures===1)throw Error('COMPOSER_CONTEXT_CHANGED');if(captures===2)throw Error('NATIVE_COMPOSER_REJECTED');return{text:'android caption'};},claim:()=>true,consume:async()=>{},focus:async()=>{},error(){}};});
 await choose(image);await wait(()=>posts.length===1);
 assert.equal(await page.evaluate(()=>captures),3);assert.match(posts[0].body,/android caption/);
}));
test('unreadable image reports the local failure without any POST',()=>fixture(async({choose,alerts,posts})=>{
 await choose({name:'broken.jpg',mimeType:'image/jpeg',buffer:Buffer.from('bad image')});
 await wait(()=>alerts.some(a=>a.includes('تعذر قراءة الصورة')));assert.equal(posts.length,0);
}));
test('backend rejection gives a visible reason rather than a stuck preview',()=>fixture(async({choose,alerts,posts})=>{
 await choose(image);await wait(()=>alerts.some(a=>a.includes('حجم المرفق مرفوض')));assert.equal(posts.length,1);
},{reject:true}));
test('Instagram document restriction is explicit and prevents POST',()=>fixture(async({choose,alerts,posts})=>{
 await choose(pdf);await wait(()=>alerts.some(a=>a.includes('غير مدعوم عبر Instagram')));assert.equal(posts.length,0);
},{sid:'ig:1:2'}));
test('selection returned after a conversation switch never uploads to either chat',()=>fixture(async({page,alerts,posts})=>{
 const event=page.waitForEvent('filechooser');await page.locator('#attachBtn').tap();const picker=await event;
 await page.evaluate(()=>{activeSessionId='fb:OTHER';});await picker.setFiles(image);
 await wait(()=>alerts.some(a=>a.includes('المحادثة أو حالة الإرسال تغيّرت')));assert.equal(posts.length,0);
}));
