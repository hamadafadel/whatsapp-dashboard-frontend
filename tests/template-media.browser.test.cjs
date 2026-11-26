'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),{start}=require('./campaign-preview-server.cjs');
const script=fs.readFileSync(path.join(__dirname,'../whatsapp-template-catalog.js'),'utf8');
const id='12345678-1234-4234-8234-123456789abc',url='/uploads/template-headers/'+id;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=','base64');
for(const width of [1440,390])test('same media chooser restores default, opens real browser filechooser and uploads once '+width,async()=>{
 const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width,height:850},isMobile:width<600,hasTouch:width<600});
 try{await page.route('**/*',r=>r.fulfill({body:'',status:200}));await page.goto('https://preview.example.test');await page.setContent('<div id="field"></div>');await page.addScriptTag({content:script});
 await page.evaluate(({url})=>{window.calls=[];const request=async(p,o={})=>{calls.push({p,method:o.method||'GET',multipart:o.body instanceof FormData});return {media:{url,format:'IMAGE'}};};request.origin=location.origin;const t={id:'123',language:'ar',revision:'a'.repeat(64),components:[{type:'HEADER',format:'IMAGE'}]};document.querySelector('#field').append(MehrabTemplateCatalog.mediaField({doc:document,template:t,field:{key:'components[0].media',type:'media'},request,onChange:v=>window.media=v}));},{url});
 await page.locator('img.template-header-media').waitFor();assert.equal(await page.locator('input[type=text]').count(),0);
 const [picker]=await Promise.all([page.waitForEvent('filechooser'),page.getByRole('button',{name:/رفع صورة/}).click()]);
 await picker.setFiles({name:'synthetic.png',mimeType:'image/png',buffer:png});await page.waitForFunction(()=>calls.filter(c=>c.method==='POST').length===1&&document.querySelector('[data-media-busy]').dataset.mediaBusy==='false');
 const calls=await page.evaluate(()=>window.calls);assert.equal(calls.filter(c=>c.method==='POST').length,1);assert.equal(calls.at(-1).multipart,true);assert(!calls.some(c=>/template-send|campaigns/.test(c.p)));
 assert.equal(await page.evaluate(()=>window.media),'https://preview.example.test'+url);
 }finally{await browser.close();}
});
test('sample import happens only when missing; expired sample allows upload; stale results do not mutate another template',async()=>{
 const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();
 try{await page.route('**/*',r=>r.fulfill({body:'',status:200}));await page.goto('https://preview.example.test');await page.setContent('<div id="field"></div>');await page.addScriptTag({content:script});
 await page.evaluate(()=>{window.posts=0;const request=async(p,o={})=>{if(o.method==='POST'){posts++;throw Error('expired');}return {media:null,sampleAvailable:true};};request.origin=location.origin;const t={id:'123',language:'ar',revision:'a'.repeat(64),components:[{type:'HEADER',format:'IMAGE'}]};document.querySelector('#field').append(MehrabTemplateCatalog.mediaField({doc:document,template:t,field:{key:'components[0].media',type:'media'},request,onChange:()=>window.changed=true}));});
 await page.getByText(/تعذر استرجاع العينة/).waitFor();assert.equal(await page.evaluate(()=>posts),1);assert.equal(await page.getByRole('button',{name:/رفع صورة/}).isEnabled(),true);assert.equal(await page.evaluate(()=>!!window.changed),false);
 await page.evaluate(({url})=>{window.resolveOld=null;const request=()=>new Promise(r=>window.resolveOld=r);request.origin=location.origin;const t={id:'999',language:'ar',components:[{type:'HEADER',format:'IMAGE'}]};const root=MehrabTemplateCatalog.mediaField({doc:document,template:t,field:{key:'components[0].media'},request,onChange:()=>window.changed=true});document.querySelector('#field').replaceChildren(root);queueMicrotask(()=>{root.remove();resolveOld({media:{url,format:'IMAGE'}});});},{url});
 await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>!!window.changed),false);
 }finally{await browser.close();}
});
test('video and document have actual native preview elements, not a manual URL field',async()=>{
 const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();try{await page.setContent('<main></main>');await page.addScriptTag({content:script});
 await page.evaluate(()=>{for(const format of ['IMAGE','VIDEO','DOCUMENT'])document.querySelector('main').append(MehrabTemplateCatalog.mediaPreview(document,format,'https://api.example.test/uploads/template-headers/123'));});
 assert.equal(await page.locator('img').count(),1);assert.equal(await page.locator('video[controls]').count(),1);assert.equal(await page.locator('a').count(),1);assert.equal(await page.locator('input').count(),0);
 }finally{await browser.close();}
});
for(const format of ['VIDEO','DOCUMENT'])test('real filechooser and single multipart upload for '+format,async()=>{
 const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();
 try{await page.route('**/*',r=>r.fulfill({body:'',status:200}));await page.goto('https://preview.example.test');await page.setContent('<main></main>');await page.addScriptTag({content:script});
 await page.evaluate(({format,url})=>{window.uploads=0;const request=async(p,o={})=>{if(o.method==='POST'){uploads++;return {media:{url,format}};}return {media:null};};request.origin=location.origin;document.querySelector('main').append(MehrabTemplateCatalog.mediaField({doc:document,template:{id:'123',language:'ar',revision:'a'.repeat(64),components:[{type:'HEADER',format}]},field:{key:'components[0].media'},request,onChange:v=>window.media=v}));},{format,url});
 await page.getByText(/لا توجد عينة Meta/).waitFor();const [picker]=await Promise.all([page.waitForEvent('filechooser'),page.getByRole('button',{name:/رفع/}).click()]);
 await picker.setFiles({name:format==='VIDEO'?'synthetic.mp4':'synthetic.pdf',mimeType:format==='VIDEO'?'video/mp4':'application/pdf',buffer:format==='VIDEO'?Buffer.from([0,0,0,24,...Buffer.from('ftypisom')]):Buffer.from('%PDF-1.7\nsynthetic')});
 await page.waitForFunction(()=>uploads===1&&!!window.media);assert.equal(await page.evaluate(()=>uploads),1);assert.equal(await page.locator(format==='VIDEO'?'video':'a.template-header-media').count(),1);
 }finally{await browser.close();}
});
test('conversation catalog uses same saved media URL and enqueues once, without touching its draft or calling legacy/AI transport',async()=>{
 const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();const sends=[];
 const t={id:'901',name:'conversation_media',language:'ar',status:'APPROVED',category:'UTILITY',revision:'a'.repeat(64),components:[{type:'HEADER',format:'IMAGE'},{type:'BODY',text:'مرحبا'}],sendSchema:{supported:true,fields:[{key:'components[0].media',type:'media',required:true}]}};
 try{await page.route('**/*',r=>{const p=new URL(r.request().url()).pathname;
 if(p==='/api/whatsapp/template-catalog')return r.fulfill({json:{templates:[t],dynamicSendingEnabled:true}});
 if(p==='/api/whatsapp/template-media/901/ar')return r.fulfill({json:{media:{url,format:'IMAGE'}}});
 if(p==='/api/whatsapp/template-send'){sends.push(r.request().postDataJSON());return r.fulfill({status:202,json:{durable:true,jobId:'synthetic'}});}
 if(p.startsWith('/uploads/template-headers/'))return r.fulfill({contentType:'image/png',body:png});return r.fulfill({body:'',status:200});});
 await page.goto('https://preview.example.test');await page.setContent('<textarea id="draft">مسودة لم تتغير</textarea><div id="overlay" class="hidden"><button data-catalog-close>إغلاق</button><button data-catalog-refresh>تحديث</button><input data-catalog-search type="search"><p data-catalog-status></p><div data-catalog-list></div><div data-catalog-detail></div></div>');await page.addScriptTag({content:script});
 await page.evaluate(async()=>{const c=MehrabTemplateCatalog.create({overlay:document.querySelector('#overlay'),apiBase:location.origin+'/api',getAuthHeaders:extra=>({Authorization:'Bearer SYNTHETIC',...extra}),handleInvalidToken:()=>false,getGeneration:async()=>0});await c.open('whatsapp','12025550101');});
 await page.getByRole('button',{name:/conversation_media/}).click();await page.locator('[data-catalog-preview] img').waitFor();const button=page.getByRole('button',{name:'تأكيد إرسال القالب لهذه المحادثة'});await button.click();await page.getByText(/تم تسجيل الطلب في الطابور/).waitFor();await button.click({force:true});assert.equal(sends.length,1);assert.equal(sends[0].values['components[0].media'],'https://preview.example.test'+url);assert.equal(await page.locator('#draft').inputValue(),'مسودة لم تتغير');
 }finally{await browser.close();}
});
test('campaign integration auto-loads default, renders media, and freezes one link in all selected recipient values without confirming',async()=>{
 const s=await start(0),browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();
 try{await page.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==s.url)return r.abort();
 if(u.pathname==='/api/whatsapp/template-catalog')return r.fulfill({json:{templates:[{id:'900',name:'image_template',language:'ar',status:'APPROVED',category:'UTILITY',revision:'a'.repeat(64),components:[{type:'HEADER',format:'IMAGE'},{type:'BODY',text:'أهلا'}],sendSchema:{supported:true,fields:[{key:'components[0].media',type:'media',required:true}]}}]}});
 if(u.pathname==='/api/whatsapp/template-media/900/ar')return r.fulfill({json:{media:{url,format:'IMAGE'}}});
 if(u.pathname.startsWith('/uploads/template-headers/'))return r.fulfill({contentType:'image/png',body:png});return r.continue();});
 await page.goto(s.url+'/preview');await page.locator('#manualNumbers').fill('+12025550101\n+12025550102');await page.locator('#addManual').click();await page.getByText('2 محدد',{exact:true}).waitFor();await page.locator('#nextStep').click();await page.getByRole('button',{name:/image_template/}).click();await page.locator('#templatePreview img').waitFor();
 await page.locator('#nextStep').click();await page.locator('#campaignTitle').fill('Synthetic media review');const [request]=await Promise.all([page.waitForRequest(r=>new URL(r.url()).pathname==='/api/whatsapp/campaigns'&&r.method()==='POST'),page.locator('#prepareReview').click()]);
 const body=request.postDataJSON();assert.equal(body.recipients.length,2);assert(body.recipients.every(r=>r.values['components[0].media']===s.url+url));assert.equal(s.counters().confirms,0);
 }finally{await browser.close();s.server.closeAllConnections();await new Promise(r=>s.server.close(r));}
});
