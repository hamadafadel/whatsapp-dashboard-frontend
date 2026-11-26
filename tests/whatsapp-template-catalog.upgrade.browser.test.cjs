'use strict';
// Persistent browser profile + real Service Worker. No production transport.
// Mobile viewport is NOT a physical installed Samsung PWA test.
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const repo=path.resolve(__dirname,'..'),current=process.env.CATALOG_ASSET_DIR||repo;
const prior=process.env.CATALOG_PREVIOUS_ASSET_DIR;
const files=new Set(['index.html','app.js','app.css','campaign-conversations.js','native-composer.js','whatsapp-template-catalog.js','service-worker.js','manifest.json','mehrab-splash-192-v5.png','mehrab-splash-512-v5.png']);
const template={id:'123',name:'synthetic_upgrade',language:'ar',category:'UTILITY',status:'APPROVED',revision:'synthetic-revision',components:[{type:'BODY',text:'أهلا {{1}}'}],variables:[{key:'components[0].text:1',name:'1',componentType:'BODY'}],requirements:[],sendSchema:{supported:true,fields:[{key:'components[0].text:1',label:'BODY — {{1}}',required:true}]}};

for(const width of [390,1440])test(`retained profile upgrades to v12 without reinstall; shared API, validation and single mock admission (${width}px)`,{skip:!prior},async()=>{
 let release='before',context,origin,dynamic=false;const traffic=[],posts=[],gets=[],rows=[],errors=[];
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mehrab-catalog-pwa-upgrade-'));const blocked=[];
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=url.pathname.slice(1)||'index.html';traffic.push({release,file,query:url.search,method:req.method});
  if(req.method!=='GET'||!files.has(file)){res.writeHead(404);return res.end();}
  const dir=release==='before'?prior:current;
  const target=fs.existsSync(path.join(dir,file))?path.join(dir,file):path.join(repo,file);
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(target));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${server.address().port}`;
 const launch=()=>chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,viewport:{width,height:850},isMobile:width<600,hasTouch:width<600,serviceWorkers:'allow'});
 const instrument=async()=>{
  await context.addInitScript(()=>{window.EventSource=class{close(){}};});
  context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
  await context.route('**/*',route=>{
   const req=route.request(),url=new URL(req.url());if(url.origin===origin)return route.continue();
   // Fail closed: never allow any real external API/resource request.
   if(url.pathname==='/api/whatsapp/template-catalog'){
    gets.push({url:req.url(),method:req.method(),authorization:req.headers().authorization});
    return route.fulfill({json:{dynamicSendingEnabled:dynamic,templates:[template]}});
   }
   if(url.pathname==='/api/whatsapp/template-send'){
    posts.push({url:req.url(),method:req.method(),headers:req.headers(),body:req.postDataJSON()});
    rows.push({request_id:req.headers()['idempotency-key'],state:'sent'});
    return route.fulfill({status:202,json:{durable:true,jobId:'SYNTHETIC_JOB'}});
   }
   if(req.method()==='HEAD')return route.fulfill({status:200,headers:{ETag:'synthetic-asset'},body:''});
   if(req.method()!=='GET'){blocked.push(req.method()+':'+url.pathname);return route.abort();}
   if(url.pathname==='/api/templates')return route.fulfill({json:{templates:[{id:'followup',label:'متابعة'},{id:'order_confirm_ask',label:'تأكيد الطلب'}]}});
   if(url.pathname==='/api/send-queue/201234567890')return route.fulfill({json:{sessionId:'201234567890',generation:0,items:rows}});
   return route.fulfill({json:{}});
  });
 };
 const openCatalog=async page=>{
  await page.evaluate(async()=>{
   requestConversationMessageSync=()=>{};loadMessages=async()=>{};loadConversations=async()=>{};
   loginScreenEl.classList.add('hidden');appEl.classList.remove('hidden');appEl.classList.add('chat-open');
   authToken='SYNTHETIC';activeSessionId='201234567890';conversationsData=[{session_id:activeSessionId,channel:'whatsapp'}];
   messageInputEl.value='مسودة عربية محفوظة 😀';templatesPanelEl.classList.remove('hidden');await renderTemplatesList();
  });
  await page.getByRole('button',{name:'تمبليت مخصصة — كتالوج Meta'}).click();
  await page.getByRole('button',{name:/synthetic_upgrade/}).click();
 };
 try{
  context=await launch();await instrument();let page=await context.newPage();
  await page.goto(origin);await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.evaluate(async()=>{
   localStorage.setItem('catalog-upgrade-sentinel','PROFILE_PRESERVED');
   const cache=await caches.open('mehrab-dashboard-static-v7');
   for(const file of ['/whatsapp-template-catalog.js?v=2','/app.js?v=93','/app.css?v=73'])
    await cache.put(file,new Response('window.__staleCatalogUsed=true;',{headers:{'Content-Type':'text/javascript'}}));
  });
  // Reopen the app window in the SAME browser/profile; do not reset storage,
  // unregister the worker or reinstall. Keep transport isolation installed.
  await page.close();release='after';page=await context.newPage();
  await page.goto(origin);
  await page.waitForFunction(()=>typeof window.MehrabTemplateCatalog?.create==='function',null,{timeout:10000});
  await page.waitForFunction(async()=>(await caches.keys()).includes('mehrab-dashboard-static-v12')&&!(await caches.keys()).includes('mehrab-dashboard-static-v7'));
  // The real application intentionally reloads once on controllerchange. Wait for
  // that navigation to settle before interacting with the new document.
  await page.waitForLoadState('networkidle');
  assert.equal(await page.evaluate(()=>localStorage.getItem('catalog-upgrade-sentinel')),'PROFILE_PRESERVED');
  assert.ok(traffic.some(t=>t.release==='after'&&t.file==='whatsapp-template-catalog.js'&&t.query==='?v=2'),JSON.stringify({traffic,errors}));
  assert.ok(traffic.some(t=>t.release==='after'&&t.file==='app.js'&&t.query==='?v=96'));
  assert.ok(traffic.some(t=>t.release==='after'&&t.file==='app.css'&&t.query==='?v=75'));
  await openCatalog(page);await page.getByRole('textbox',{name:'BODY — {{1}}',exact:true}).fill('العربية English 😀');
  assert.ok((await page.locator('[data-catalog-preview]').textContent()).includes('العربية English 😀'));
  assert.equal(await page.getByRole('button',{name:'تأكيد إرسال القالب لهذه المحادثة'}).count(),0);assert.equal(posts.length,0);
  await page.getByRole('button',{name:'إغلاق كتالوج القوالب'}).click();
  assert.equal(await page.locator('#messageInput').inputValue(),'مسودة عربية محفوظة 😀');
  // Synthetic capability only; no production flag or service is changed.
  dynamic=true;await openCatalog(page);
  const send=page.getByRole('button',{name:'تأكيد إرسال القالب لهذه المحادثة'});
  await send.click();assert.equal(posts.length,0); // HTML required field validation.
  await page.getByRole('textbox',{name:'BODY — {{1}}',exact:true}).fill('العربية English 😀');
  await send.click();await page.getByText('تم تسجيل الطلب في الطابور. القبول لا يعني التسليم للعميل.').waitFor();
  assert.equal(await send.isDisabled(),true);assert.equal(posts.length,1);
  assert.equal(posts[0].url,'https://wadashboardapi.almehrab.org/api/whatsapp/template-send');assert.equal(posts[0].method,'POST');
  assert.equal(posts[0].headers.authorization,'Bearer SYNTHETIC');assert.ok(posts[0].headers['idempotency-key']);
  assert.equal(posts[0].headers['x-send-queue-generation'],'0');assert.equal(posts[0].body.language,'ar');
  assert.equal(posts[0].body.templateId,'123');assert.equal(posts[0].body.revision,'synthetic-revision');
  assert.equal(posts[0].body.values['components[0].text:1'],'العربية English 😀');
  assert.ok(gets.every(r=>r.url==='https://wadashboardapi.almehrab.org/api/whatsapp/template-catalog'&&r.method==='GET'&&r.authorization==='Bearer SYNTHETIC'));
  assert.equal(await page.locator('#messageInput').inputValue(),'مسودة عربية محفوظة 😀');assert.deepEqual(errors,[],JSON.stringify(blocked));
 }finally{await context?.close();await new Promise(r=>server.close(r));}
});
