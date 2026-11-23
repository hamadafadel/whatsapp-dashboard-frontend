'use strict';
// Real Chromium Service Worker, isolated loopback origin and synthetic API data.
// Not an installed Samsung PWA test. NEVER contacts a real send/API service.
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.env.CATALOG_ASSET_DIR?path.resolve(process.env.CATALOG_ASSET_DIR):path.resolve(__dirname,'..');
const files=new Set(['index.html','app.js','app.css','native-composer.js','whatsapp-template-catalog.js','service-worker.js','manifest.json','mehrab-splash-192-v5.png','mehrab-splash-512-v5.png']);
test('real Service Worker never serves stale catalog module; preview-only survives reload at mobile width',async()=>{
 const network=[];let origin,browser;
 const server=http.createServer((req,res)=>{
  const file=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';network.push({file,method:req.method});
  if(req.method!=='GET'||!files.has(file)){res.writeHead(404);return res.end();}
  // Icons are not part of a downloaded-release subset; baseline copies are unchanged.
  const target=fs.existsSync(path.join(root,file))?path.join(root,file):path.join(__dirname,'..',file);
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.json')?'application/json':'text/html');res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(target));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${server.address().port}`;
 try{
  browser=await chromium.launch({channel:'chrome'});const page=await browser.newPage({viewport:{width:390,height:850},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
  const errors=[],posts=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.EventSource=class{close(){}};});
  await page.route('**/*',route=>{
   const req=route.request(),u=new URL(req.url());
   if(u.origin===origin)return route.continue();
   if(req.method()!=='GET')posts.push(u.pathname);
   if(u.pathname==='/api/templates')return route.fulfill({json:{templates:[{id:'followup',label:'متابعة'},{id:'order_confirm_ask',label:'تأكيد الطلب'}]}});
   if(u.pathname==='/api/whatsapp/template-catalog')return route.fulfill({json:{dynamicSendingEnabled:false,templates:[{id:'1',name:'synthetic_catalog',language:'ar',status:'APPROVED',category:'UTILITY',components:[{type:'BODY',text:'مرحبًا {{1}}'}],variables:[{key:'components[0].text:1',name:'1',path:'components[0]',field:'text',componentType:'BODY'}],requirements:[]}]}});
   return route.fulfill({json:{}});
  });
  await page.goto(origin);await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.evaluate(async()=>{
   const cache=await caches.open('mehrab-dashboard-static-v8');
   await cache.put(new Request(location.origin+'/whatsapp-template-catalog.js?v=2'),new Response('throw Error("STALE_CATALOG_MUST_NOT_RUN")',{headers:{'Content-Type':'text/javascript'}}));
  });
  const prior=network.filter(n=>n.file==='whatsapp-template-catalog.js').length;
  await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller&&!!window.MehrabTemplateCatalog);
  assert.ok(network.filter(n=>n.file==='whatsapp-template-catalog.js').length>prior);
  await page.evaluate(async()=>{
   requestConversationMessageSync=()=>{};loadMessages=async()=>{};loadConversations=async()=>{};
   loginScreenEl.classList.add('hidden');appEl.classList.remove('hidden');appEl.classList.add('chat-open');authToken='SYNTHETIC';activeSessionId='201234567890';conversationsData=[{session_id:activeSessionId,channel:'whatsapp'}];messageInputEl.value='مسودة محفوظة';templatesPanelEl.classList.remove('hidden');await renderTemplatesList();
  });
  await page.getByRole('button',{name:'تمبليت مخصصة — كتالوج Meta'}).click();await page.getByRole('button',{name:/synthetic_catalog/}).click();
  await page.getByRole('textbox',{name:/\{\{1\}\}/}).fill('أحمد 😀');assert.ok((await page.locator('[data-catalog-preview]').textContent()).includes('أحمد 😀'));
  assert.equal(await page.getByRole('button',{name:'تأكيد إرسال القالب لهذه المحادثة'}).count(),0);
  await page.getByRole('button',{name:'إغلاق كتالوج القوالب'}).click();assert.equal(await page.locator('#messageInput').inputValue(),'مسودة محفوظة');
  assert.deepEqual(posts,[]);assert.deepEqual(errors,[]);assert.ok(network.every(n=>n.method==='GET'));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
