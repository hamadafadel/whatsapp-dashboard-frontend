'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const repo=path.resolve(__dirname,'..');
const assetRepo=process.env.CATALOG_ASSET_DIR?path.resolve(process.env.CATALOG_ASSET_DIR):repo;
const template={id:'1',name:'order_update',language:'ar',category:'UTILITY',status:'APPROVED',components:[{type:'BODY',text:'أهلا {{name}} 🌷\nطلب {{number}}'}],variables:[{key:'components[0].text:name',name:'name',path:'components[0]',field:'text',componentType:'BODY'},{key:'components[0].text:number',name:'number',path:'components[0]',field:'text',componentType:'BODY'}],requirements:[]};
async function fixture(run,width=390,{dynamic=false,sendMode='accepted',legacy=false,catalogRecords=[template]}={}){
 const browser=await chromium.launch({channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width,height:850},isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'});
  const posts=[],errors=[],sends=[],rows=[];let fail=false;
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.EventSource=class{constructor(){this.readyState=1;}close(){}};});
  await page.route('**/*',async r=>{
   const req=r.request(),file=new URL(req.url()).pathname.slice(1)||'index.html';
   if(req.method()!=='GET')posts.push(file);
   if(['index.html','app.js','app.css','native-composer.js','whatsapp-template-catalog.js'].includes(file))return r.fulfill({body:fs.readFileSync(path.join(assetRepo,file)),contentType:file.endsWith('js')?'text/javascript':file.endsWith('css')?'text/css':'text/html'});
   if(file==='api/templates')return r.fulfill({json:{templates:[{id:'followup',label:'متابعة'},{id:'order_confirm_ask',label:'تأكيد الطلب'}]}});
   if(file==='api/send-template')return r.fulfill({json:{success:true}});
   if(file==='api/whatsapp/template-catalog')return r.fulfill({status:fail?503:200,json:fail?{error:'NOT_CONFIGURED'}:{templates:catalogRecords.map(t=>({...t,revision:'synthetic-revision',sendSchema:{supported:true,fields:t.variables.map(v=>({...v,label:`${v.componentType} — {{${v.name}}}`,required:true}))}})),dynamicSendingEnabled:dynamic}});
   if(file==='api/send-queue/config')return r.fulfill({json:{ready:true,protocolVersion:1}});
   if(file==='api/send-queue/201234567890')return r.fulfill({json:{sessionId:'201234567890',generation:0,items:rows.map(x=>({...x,session_id:'201234567890'}))}});
   if(file==='api/whatsapp/template-send'){
    const data=req.postDataJSON();sends.push({data,headers:req.headers()});
    if(sendMode==='unknown')return r.abort();
    if(sendMode==='rejected')return r.fulfill({status:422,json:{error:'MISSING_TEMPLATE_PARAMETER'}});
    rows.push({request_id:req.headers()['idempotency-key'],batch_id:'synthetic-job',state:'sent'});
    return r.fulfill({status:202,json:{durable:true,jobId:'synthetic-job'}});
   }
   return r.fulfill({json:{}});
  });
  await page.goto('https://wadashboard.almehrab.org/');
  await page.evaluate(async()=>{
    requestConversationMessageSync=()=>{};loadMessages=async()=>{};loadConversations=async()=>{};
    loginScreenEl.classList.add('hidden');appEl.classList.remove('hidden');appEl.classList.add('chat-open');
    authToken='SYNTHETIC';activeSessionId='201234567890';conversationsData=[{session_id:activeSessionId,channel:'whatsapp'}];
    messageInputEl.value='مسودة Samsung 🌷';messageInputEl.disabled=sendBtnEl.disabled=false;
    if(chatTitleEl)chatTitleEl.textContent='محادثة تجريبية';if(chatNameEl)chatNameEl.textContent='محادثة تجريبية';
    templatesPanelEl.classList.remove('hidden');await renderTemplatesList();
  });
  await run({page,posts,errors,sends,rows,setFail:value=>{fail=value;}});
  assert.deepEqual(errors,[]);if(!dynamic&&!legacy)assert.deepEqual(posts,[]);
 }finally{await browser.close();}
}
test('mobile actual click opens catalog; name metadata and variables preview safely',()=>fixture(async({page})=>{
 await page.getByRole('button',{name:'تمبليت مخصصة — كتالوج Meta'}).click();
 await page.getByRole('button',{name:/order_update/}).click();
 await page.getByRole('textbox',{name:/\{\{name\}\}/}).fill('أحمد <img src=x onerror=alert(1)>');
 await page.getByRole('textbox',{name:/\{\{number\}\}/}).fill('١٢ English 😀');
 const preview=page.locator('[data-catalog-preview]');
 assert.ok((await preview.textContent()).includes('أحمد <img'));assert.equal(await preview.locator('img').count(),0);
 assert.ok((await preview.textContent()).includes('١٢ English 😀'));
 assert.equal(await page.locator('#messageInput').inputValue(),'مسودة Samsung 🌷');
 assert.equal(await page.locator('#templateCatalogOverlay button').filter({hasText:'إرسال'}).count(),0);
 if(process.env.CATALOG_SCREENSHOT_PATH){
  await page.getByRole('textbox',{name:/\{\{name\}\}/}).fill('محمد');
  await page.getByRole('textbox',{name:/\{\{number\}\}/}).fill('٢٠٢٦');
  fs.mkdirSync(path.dirname(process.env.CATALOG_SCREENSHOT_PATH),{recursive:true});
  await page.screenshot({path:process.env.CATALOG_SCREENSHOT_PATH});
 }
}));
test('both legacy quick templates retain exact existing endpoint and IDs (fully mocked)',()=>fixture(async({page,posts})=>{
 const bodies=[];await page.route('**/api/send-template',r=>{bodies.push(r.request().postDataJSON());return r.fulfill({json:{success:true}});});
 for(const name of ['متابعة','تأكيد الطلب']){
  await page.evaluate(async()=>{templatesPanelEl.classList.remove('hidden');await renderTemplatesList();});
  await page.getByRole('button',{name,exact:true}).click();
  await page.getByText('تم إرسال التيمبليت',{exact:true}).waitFor();
 }
 assert.deepEqual(bodies.map(b=>b.templateId),['followup','order_confirm_ask']);assert.ok(bodies.every(b=>b.sessionId==='201234567890'));
 assert.equal(posts.filter(p=>p==='api/whatsapp/template-send').length,0);
},1200,{legacy:true}));
test('desktop language filtering keeps same-name variants distinct; Header/Body/Buttons preview never sends',()=>fixture(async({page})=>{
 await page.getByRole('button',{name:'تمبليت مخصصة — كتالوج Meta'}).click();
 await page.getByRole('searchbox').fill('en_US');
 assert.equal(await page.getByRole('button',{name:/order_update — ar/}).count(),0);
 await page.getByRole('button',{name:'order_update — en_US — UTILITY',exact:true}).click();
 assert.ok((await page.locator('.template-catalog-detail').textContent()).includes('en_US · UTILITY · APPROVED'));
 await page.getByRole('textbox',{name:'HEADER — {{1}}',exact:true}).fill('Header');
 await page.getByRole('textbox',{name:'BODY — {{name}}',exact:true}).fill('مريم 😀');
 await page.getByRole('textbox',{name:'URL — {{1}}',exact:true}).fill('order-12');
 const text=await page.locator('[data-catalog-preview]').textContent();assert.ok(text.includes('Title Header'));assert.ok(text.includes('Hello مريم 😀'));assert.ok(text.includes('https://example.invalid/order-12'));
 assert.equal(await page.getByRole('button',{name:'تأكيد إرسال القالب لهذه المحادثة'}).count(),0);
 assert.equal(await page.locator('#messageInput').inputValue(),'مسودة Samsung 🌷');
},1440,{catalogRecords:[template,{...template,id:'2',language:'en_US',components:[{type:'HEADER',format:'TEXT',text:'Title {{1}}'},{type:'BODY',text:'Hello {{name}}'},{type:'BUTTONS',buttons:[{type:'URL',text:'Open',url:'https://example.invalid/{{1}}'}]}],variables:[{key:'components[0].text:1',name:'1',componentType:'HEADER'},{key:'components[1].text:name',name:'name',componentType:'BODY'},{key:'components[2].buttons[0].url:1',name:'1',componentType:'URL'}]}]}));

async function fillDynamic(page){
 await page.evaluate(async()=>{templatesPanelEl.classList.remove('hidden');await renderTemplatesList();});
 await page.getByRole('button',{name:'تمبليت مخصصة — كتالوج Meta'}).click();
 await page.getByRole('button',{name:/order_update/}).click();
 await page.getByRole('textbox',{name:/\{\{name\}\}/}).fill('أحمد 😀');
 await page.getByRole('textbox',{name:/\{\{number\}\}/}).fill('123');
}
test('dynamic UI sends one queued request, exact language/revision/values, preserving draft',()=>fixture(async({page,sends})=>{
 await fillDynamic(page);
 const send=page.getByRole('button',{name:'تأكيد إرسال القالب لهذه المحادثة'});
 await send.click();await page.getByText('تم تسجيل الطلب في الطابور. القبول لا يعني التسليم للعميل.').waitFor();
 assert.equal(sends.length,1);assert.equal(sends[0].data.language,'ar');assert.equal(sends[0].data.revision,'synthetic-revision');
 assert.equal(sends[0].data.values['components[0].text:name'],'أحمد 😀');assert.ok(sends[0].headers['idempotency-key']);
 assert.equal(await send.isDisabled(),true);assert.equal(await page.locator('#messageInput').inputValue(),'مسودة Samsung 🌷');
},390,{dynamic:true}));
test('unknown admission stays blocked across close/reopen; status query never resends',()=>fixture(async({page,sends,rows})=>{
 await fillDynamic(page);await page.getByRole('button',{name:'تأكيد إرسال القالب لهذه المحادثة'}).click();
 await page.getByText(/تعذر تأكيد قبول الطلب/).waitFor();assert.equal(sends.length,1);
 await page.getByRole('button',{name:'إغلاق كتالوج القوالب'}).click();await fillDynamic(page);
 assert.equal(await page.getByRole('button',{name:'تأكيد إرسال القالب لهذه المحادثة'}).isDisabled(),true);
 rows.push({request_id:sends[0].headers['idempotency-key'],batch_id:'job',state:'unknown'});
 await page.getByRole('button',{name:'التحقق من حالة الطلب دون إعادة الإرسال'}).click();
 await page.getByText('نتيجة الإرسال غير مؤكدة في الطابور؛ راجعها ولا تُعد الإرسال.').waitFor();assert.equal(sends.length,1);
},390,{dynamic:true,sendMode:'unknown'}));
test('validation rejection preserves values and permits correction without automatic retry',()=>fixture(async({page,sends})=>{
 await fillDynamic(page);const send=page.getByRole('button',{name:'تأكيد إرسال القالب لهذه المحادثة'});await send.click();
 await page.getByText(/تعذر تجهيز الطلب أو رُفض/).waitFor();assert.equal(sends.length,1);assert.equal(await send.isDisabled(),false);
 assert.equal(await page.getByRole('textbox',{name:/\{\{name\}\}/}).inputValue(),'أحمد 😀');
},390,{dynamic:true,sendMode:'rejected'}));
test('conversation change during queue-generation read cancels admission before POST',()=>fixture(async({page,sends})=>{
 await fillDynamic(page);let release,started;
 const gate=new Promise(r=>release=r),requested=new Promise(r=>started=r);
 await page.route('**/api/send-queue/201234567890',async r=>{started();await gate;await r.fulfill({json:{sessionId:'201234567890',generation:0,items:[]}});});
 await page.getByRole('button',{name:'تأكيد إرسال القالب لهذه المحادثة'}).click();await requested;
 await page.evaluate(()=>{activeSessionId='ig:1:2';syncDashboardNativeComposer();});
 release();await page.waitForFunction(()=>document.querySelector('#templateCatalogOverlay').classList.contains('hidden'));
 assert.equal(sends.length,0);assert.equal(await page.locator('#messageInput').inputValue(),'مسودة Samsung 🌷');
},390,{dynamic:true}));
test('catalog covers native composer; Back closes only catalog and preserves draft',()=>fixture(async({page})=>{
 await page.evaluate(()=>{window.coverage=[];dashboardNativeComposer={sync:async()=>coverage.push(document.querySelector('.chat-compose').dataset.dashboardCovered)};});
 await page.getByRole('button',{name:'تمبليت مخصصة — كتالوج Meta'}).click();
 await page.waitForFunction(()=>document.querySelector('.chat-compose').dataset.dashboardCovered==='true');
 assert.equal(await page.locator('#templateCatalogOverlay').evaluate(el=>el.closest('[inert]')),null);
 await page.evaluate(()=>{window.catalogBackHandled=closeDashboardTopTransient();});
 assert.equal(await page.evaluate(()=>window.catalogBackHandled),true);
 await page.waitForFunction(()=>document.querySelector('.chat-compose').dataset.dashboardCovered==='false');
 assert.equal(await page.locator('#messageInput').inputValue(),'مسودة Samsung 🌷');
 assert.equal(await page.evaluate(()=>activeSessionId),'201234567890');
}));
test('bridge unavailable displays clear error and retains quick templates',()=>fixture(async({page,setFail})=>{
 setFail(true);await page.getByRole('button',{name:'تمبليت مخصصة — كتالوج Meta'}).click();
 await page.getByText(/تعذر تحميل الكتالوج/).waitFor();
 await page.getByRole('button',{name:'إغلاق كتالوج القوالب'}).click();
 await page.evaluate(async()=>{templatesPanelEl.classList.remove('hidden');await renderTemplatesList();});
 assert.equal(await page.getByRole('button',{name:'متابعة',exact:true}).count(),1);
 assert.equal(await page.getByRole('button',{name:'تأكيد الطلب',exact:true}).count(),1);
}));
test('search and Escape work on desktop without mutating composer',()=>fixture(async({page})=>{
 await page.getByRole('button',{name:'تمبليت مخصصة — كتالوج Meta'}).click();
 await page.getByRole('button',{name:/order_update/}).waitFor();
 await page.getByRole('searchbox').fill('no-match');await page.getByText('لا توجد قوالب مطابقة.').waitFor();
 await page.keyboard.press('Escape');assert.equal(await page.locator('#templateCatalogOverlay').isVisible(),false);
 assert.equal(await page.locator('#messageInput').inputValue(),'مسودة Samsung 🌷');
},1200));
test('changing conversation closes catalog; other channels cannot open it',()=>fixture(async({page})=>{
 await page.getByRole('button',{name:'تمبليت مخصصة — كتالوج Meta'}).click();
 await page.evaluate(()=>{activeSessionId='fb:synthetic';syncDashboardNativeComposer();});
 assert.equal(await page.locator('#templateCatalogOverlay').isVisible(),false);
 assert.equal(await page.evaluate(()=>whatsappTemplateCatalog.open('instagram','ig:synthetic')),false);
}));
test('actual existing APK Back adapter closes catalog, then delegates normal chat Back',
 {skip:!process.env.ANDROID_ASSETS_DIR},()=>fixture(async({page})=>{
  await page.evaluate(()=>{window.nativeBackResults=[];window.AlMehrabHost={postMessage(raw){nativeBackResults.push(JSON.parse(raw));}};});
  await page.addScriptTag({content:fs.readFileSync(path.join(process.env.ANDROID_ASSETS_DIR,'native-dashboard-adapter.js'),'utf8')});
  const historyBefore=await page.evaluate(()=>JSON.stringify(history.state));
  await page.getByRole('button',{name:'تمبليت مخصصة — كتالوج Meta'}).click();
  await page.evaluate(()=>window.AlMehrabAndroidAdapter.back('catalog-test'));
  await page.waitForFunction(()=>nativeBackResults.some(r=>r.action==='back_result'&&r.id==='catalog-test'&&r.status==='handled'));
  assert.equal(await page.locator('#templateCatalogOverlay').isVisible(),false);
  assert.equal(await page.evaluate(()=>activeSessionId),'201234567890');
  assert.equal(await page.evaluate(()=>JSON.stringify(history.state)),historyBefore);
  assert.equal(await page.locator('#messageInput').inputValue(),'مسودة Samsung 🌷');
  await page.evaluate(()=>window.AlMehrabAndroidAdapter.back('normal-test'));
  await page.waitForFunction(()=>nativeBackResults.some(r=>r.id==='normal-test'&&r.status==='handled'));
  assert.equal(await page.evaluate(()=>appEl.classList.contains('chat-open')),false);
 }));
