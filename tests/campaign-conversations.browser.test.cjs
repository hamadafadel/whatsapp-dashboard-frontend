'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),{start}=require('./campaign-preview-server.cjs');
test('disabled production flag is not mistaken for lost admin access and returning to All restores normal conversations',async()=>{
 const s=await start(),browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:390,height:900}});
 try{
  await page.route('**/*',route=>new URL(route.request().url()).origin===s.url?route.continue():route.abort());
  await page.route('**/api/whatsapp/campaigns/**',route=>route.fulfill({status:503,json:{error:'CAMPAIGNS_DISABLED'}}));
  await page.goto(s.url+'/preview/conversations');await page.locator('.session-item').first().waitFor();
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.locator('.session-item').first().waitFor();
  await page.locator('#campaignFilterButton').click();await page.getByText('ميزة الحملات غير مفعّلة بعد على الخادم. لم يتم إنشاء حملة أو إرسال رسائل.',{exact:true}).waitFor();
  assert.equal(await page.locator('#campaignFilterButton').isVisible(),true);assert.equal(await page.locator('.session-item').count(),0);
  await page.locator('[data-channel="all"]').click();await page.locator('.session-item').first().waitFor();
  assert.equal(await page.locator('#campaignConversationPanel').isVisible(),false);assert.equal(await page.locator('.session-item').count(),2);
  assert.equal(s.calls.filter(c=>c.method==='POST').length,0);
 }finally{await browser.close();s.server.closeAllConnections?.();await new Promise(r=>s.server.close(r));}
});
for(const width of [1440,390,320])test('all six filters are onscreen without auto-scroll; Campaigns is independent and exits cleanly '+width,async()=>{
 const s=await start(),browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width,height:900},isMobile:width<600,hasTouch:width<600});
 try{
  await page.route('**/*',r=>new URL(r.request().url()).origin===s.url?r.continue():r.abort());
  await page.goto(s.url+'/preview/conversations');await page.locator('.session-item').first().waitFor();
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.locator('.session-item').first().waitFor();
  const geometry=await page.evaluate(()=>{const bar=document.getElementById('channelFilterBar'),box=bar.getBoundingClientRect(),buttons=[...bar.querySelectorAll('button')];return {controlled:!!navigator.serviceWorker.controller,overflow:bar.scrollWidth>bar.clientWidth,order:buttons.map(b=>b.textContent),buttons:buttons.map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height,inside:r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===b};})};});
  assert.equal(geometry.controlled,true);assert.equal(geometry.overflow,false);assert.deepEqual(geometry.order,['الكل','WhatsApp','Messenger','Instagram','Confirmation','Campaigns']);
  for(const b of geometry.buttons){assert(b.inside&&b.hit);assert.equal(b.height,32);assert(b.left>=0&&b.right<=width);}
  const campaign=page.locator('#campaignFilterButton'),box=await campaign.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
  await page.getByText('10000 محادثة · صفحة 1',{exact:true}).waitFor();assert.equal(await campaign.getAttribute('aria-expanded'),'true');assert.equal(await campaign.getAttribute('class'),'channel-filter-btn active');
  assert.equal(await page.locator('#channelFilterBar [data-channel].active').count(),0);
  assert.deepEqual(await page.locator('#campaignReplyFilter option').allTextContents(),['الكل','رد العميل','لم يرد','غير مقروء','رد غير محسوم بين حملات']);
  if(process.env.CAMPAIGN_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.CAMPAIGN_SCREENSHOT_DIR,`campaign-button-visible-${width}.png`)});
  for(const channel of ['all','whatsapp','messenger','instagram','confirmation']){
   await page.locator(`[data-channel="${channel}"]`).click();await page.waitForFunction(()=>document.getElementById('campaignConversationPanel').hidden);
   assert.equal(await page.evaluate(()=>window.dashboardCampaignFilter.active()),false);assert.equal(await campaign.getAttribute('aria-expanded'),'false');
   assert.equal(await page.locator(`[data-channel="${channel}"]`).getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#unreadFilterBar').evaluate(el=>el.classList.contains('hidden')),false);
   await campaign.click();await page.getByText('10000 محادثة · صفحة 1',{exact:true}).waitFor();
  }
  await page.evaluate(()=>{localStorage.setItem('role','agent');window.dashboardCampaignFilter.reset();});assert.equal(await campaign.isVisible(),false);
  assert.equal(s.calls.filter(c=>/send-message|template-send|send-media/.test(c.path)).length,0);
 }finally{await browser.close();s.server.closeAllConnections?.();await new Promise(r=>s.server.close(r));}
});
test('late campaign response cannot restore names after logout or an account change',async()=>{
 const s=await start(),browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();let release,started;
 const ready=new Promise(r=>started=r);
 try{
  await page.route('**/api/whatsapp/campaigns/conversation-groups?**',async route=>{release=route;started();});
  await page.goto(s.url+'/preview/conversations');await page.locator('.session-item').first().waitFor();await page.getByRole('button',{name:'Campaigns',exact:true}).click();await ready;
  await page.evaluate(()=>{authToken='SYNTHETIC_CHANGED_ACCOUNT';window.dashboardCampaignFilter.reset();});
  const finished=page.waitForResponse(r=>r.url().includes('/conversation-groups?'));
  await release.fulfill({json:{rows:[{id:'00000000-0000-4000-8000-000000000003',title:'STALE_ACCOUNT_NAME_MUST_NOT_RENDER',created_at:'2026-11-24',recipients:1}],total:1}});await finished;
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await page.locator('#campaignChoice option').count(),1);assert.equal(await page.evaluate(()=>window.dashboardCampaignFilter.active()),false);
  assert(!(await page.locator('#campaignChoice').textContent()).includes('STALE_ACCOUNT_NAME'));
 }finally{await browser.close();s.server.closeAllConnections?.();await new Promise(r=>s.server.close(r));}
});
for(const width of [1440,390])test('actual dashboard campaign filters, whole-list search, paging and reply promotion '+width,async()=>{
 const s=await start(0,{seedHistory:true}),browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width,height:900},isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'}),errors=[],outside=[];
 try{
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{if(new URL(r.request().url()).origin!==s.url){outside.push(r.request().url());return r.abort();}return r.continue();});
  await page.goto(s.url+'/preview/conversations');await page.locator('.session-item').first().waitFor();assert.equal(await page.locator('.session-item').count(),2);
  const before=await page.locator('.session-customer-name').allTextContents();
  await page.getByRole('button',{name:'Campaigns',exact:true}).click();await page.getByText('10000 محادثة · صفحة 1',{exact:true}).waitFor();assert.equal(await page.locator('.session-item').count(),50);assert.equal(await page.locator('#conversations .loading-state').count(),0);
  await page.getByRole('button',{name:'التالي',exact:true}).click();await page.getByText('10000 محادثة · صفحة 2',{exact:true}).waitFor();
  await page.locator('#searchInput').fill('عميل حملة تجريبي 10000');await page.getByText('1 محادثة · صفحة 1',{exact:true}).waitFor();
  assert.equal(await page.locator('.session-item').count(),1);
  await page.locator('#searchInput').fill('');await page.locator('#campaignReplyFilter').selectOption('ambiguous');await page.getByText('1 محادثة · صفحة 1',{exact:true}).waitFor();
  await page.locator('#campaignChoice').selectOption('00000000-0000-4000-8000-000000000002');await page.getByText('1 محادثة · صفحة 1',{exact:true}).waitFor();
  assert.match(await page.locator('.campaign-response-tag').textContent(),/غير محسوم/);
  if(process.env.CAMPAIGN_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.CAMPAIGN_SCREENSHOT_DIR,`campaign-filter-${width}.png`)});
  await page.getByRole('button',{name:'الكل',exact:true}).first().click();await page.getByRole('button',{name:'محاكاة رد عميل جديد'}).waitFor();await page.waitForFunction(()=>document.querySelectorAll('.session-item').length===2);
  assert.deepEqual(await page.locator('.session-customer-name').allTextContents(),before);
  await page.getByRole('button',{name:'محاكاة رد عميل جديد'}).click();await page.waitForFunction(()=>document.querySelectorAll('.session-item').length===3);
  assert.equal(new Set(await page.locator('.session-id-text').allTextContents()).size,3);
  await page.locator('.session-item').first().click();await page.locator('.message-campaign-tag').first().waitFor();
  await page.locator('#messageInput').fill('مسودة عربية English 😀');
  const tagProof=await page.evaluate(()=>{const wrap=document.querySelector('.message-wrap'),bubble=wrap.querySelector('.message');syncMessageCampaignTag(wrap,{type:'agent',campaign_id:'synthetic',campaign_title:'حملة محدثة'});syncMessageCampaignTag(wrap,{type:'agent'});return {sameBubble:bubble===wrap.querySelector('.message'),tags:wrap.querySelectorAll('.message-campaign-tag').length,title:wrap.querySelector('.message-campaign-tag').textContent};});
  assert.equal(tagProof.sameBubble,true);assert.equal(tagProof.tags,1);assert.match(tagProof.title,/محدثة/);
  if(width>=600){await page.getByRole('button',{name:'Campaigns',exact:true}).click();await page.getByText('10000 محادثة · صفحة 1',{exact:true}).waitFor();assert.equal(await page.locator('#messageInput').inputValue(),'مسودة عربية English 😀');}
  assert.equal(s.calls.filter(c=>/send-message|template-send|send-media/.test(c.path)).length,0);assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
 }finally{await browser.close();s.server.closeAllConnections?.();await new Promise(r=>s.server.close(r));}
});
for(const width of [1440,390])test('history links open the existing conversation and exact campaign filter without creating or sending '+width,async()=>{
 const s=await start(0,{seedHistory:true}),browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width,height:900},isMobile:width<600,hasTouch:width<600});
 try{
  await page.route('**/*',r=>new URL(r.request().url()).origin===s.url?r.continue():r.abort());
  await page.goto(s.url+'/preview');await page.locator('#historyTab').click();await page.locator('.campaign-card').filter({hasText:'جميع حالات الرسائل'}).getByRole('button',{name:'تفاصيل المستلمين'}).click();
  const link=page.getByRole('link',{name:'فتح المحادثة',exact:true}).first(),href=await link.getAttribute('href'),session=new URL(href,s.url).searchParams.get('session');
  await link.click();await page.waitForURL('**/index.html?**');await page.locator('.message-campaign-tag').first().waitFor();assert.equal(await page.evaluate(()=>activeSessionId),session);
  await page.goto(s.url+'/templates.html#history');await page.locator('.campaign-card').filter({hasText:'جميع حالات الرسائل'}).getByRole('button',{name:'تفاصيل المستلمين'}).click();
  const campaign=await page.getByRole('link',{name:'عرض محادثات الحملة'}).getAttribute('href');await page.goto(new URL(campaign,s.url).href);
  await page.locator('#campaignConversationPanel').waitFor();assert.equal(await page.locator('#campaignChoice').inputValue(),new URL(campaign,s.url).searchParams.get('campaign'));
  assert.equal(s.calls.filter(c=>/send-message|template-send|send-media/.test(c.path)).length,0);
 }finally{await browser.close();s.server.closeAllConnections?.();await new Promise(r=>s.server.close(r));}
});
