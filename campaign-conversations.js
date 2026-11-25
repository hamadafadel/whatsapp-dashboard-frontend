(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MehrabCampaignFilter=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 function mount({doc,base,headers,role,render,onExit,openSession,invalid=()=>false}){
  const win=doc.defaultView,button=doc.getElementById('campaignFilterButton'),panel=doc.getElementById('campaignConversationPanel');
  if(!button||!panel)return null;
  let active=false,campaign='',filter='all',offset=0,groupOffset=0,epoch=0,timer=null,searchTimer=null,pending=null,pendingKey='',groupEpoch=0;
  const $=id=>doc.getElementById(id),text=(id,s)=>{$(id).textContent=s;};
  const describe=()=>text('campaignSelectedMeta',campaign?$('campaignChoice').selectedOptions[0]?.textContent||'':'جميع الحملات — المحادثات المرتبطة برسائل محفوظة فعليًا');
  const get=async path=>{const h=headers(),owner=h.Authorization||h.authorization,r=await win.fetch(base+'/whatsapp/campaigns/'+path,{headers:h,cache:'no-store'});if((headers().Authorization||headers().authorization)!==owner)throw Error('تغيّرت جلسة الحساب.');if(invalid(r))throw Error('انتهت جلسة الحساب.');if(!r.ok){let code;try{code=(await r.json()).error;}catch{}if([403,503].includes(r.status)&&code==='CAMPAIGNS_DISABLED'){render([]);throw Error('ميزة الحملات غير مفعّلة بعد على الخادم. لم يتم إنشاء حملة أو إرسال رسائل.');}if(r.status===403){render([]);reset();}throw Error(r.status===403?'فلتر الحملات متاح للأدمن فقط.':'تعذر تحميل محادثات الحملات.');}return r.json();};
  async function groups(append=false){
   const version=++groupEpoch;
   const data=await get('conversation-groups?'+new URLSearchParams({q:$('campaignNameSearch').value,offset:groupOffset}));
   if(version!==groupEpoch||!active)return;
   if(!append)$('campaignChoice').replaceChildren(new win.Option('جميع محادثات الحملات',''));
   for(const c of data.rows)$('campaignChoice').append(new win.Option(`${c.title} · ${new Date(c.created_at).toLocaleDateString('ar-EG')} · ${c.recipients} مستلم`,c.id));
   if(campaign&&![...$('campaignChoice').options].some(o=>o.value===campaign)){const c=await get('conversation-group/'+campaign);if(version!==groupEpoch||!active)return;$('campaignChoice').append(new win.Option(`${c.title} · ${new Date(c.created_at).toLocaleDateString('ar-EG')} · ${c.recipients} مستلم`,c.id));}
   $('campaignChoice').value=campaign;$('campaignMoreNames').hidden=groupOffset+data.rows.length>=data.total;
   describe();
  }
  async function refresh(reset=false){
   if(!active)return;if(reset)offset=0;const q=new URLSearchParams({campaign,filter,q:$('searchInput').value.trim(),offset,limit:50}),key=q.toString();
   if(pending&&pendingKey===key)return pending;
   const version=++epoch,work=(async()=>{try{
    const d=await get('conversation-list?'+q);if(!active||version!==epoch)return;
    render(d.rows);text('campaignPageInfo',`${d.total} محادثة · صفحة ${Math.floor(offset/50)+1}`);
    $('campaignPrevious').disabled=offset===0;$('campaignNext').disabled=offset+50>=d.total;
    $('campaignPrevious').hidden=$('campaignNext').hidden=d.total<=50;
   }catch(e){if(version===epoch)text('campaignPageInfo',e.message);}})();
   pending=work;pendingKey=key;try{await work;}finally{if(pending===work)pending=null;}
  }
  async function enter(id=''){
   if(role()!=='admin')return;active=true;campaign=id;filter='all';$('campaignReplyFilter').value='all';offset=0;groupOffset=0;button.classList.add('active');button.setAttribute('aria-expanded','true');button.setAttribute('aria-pressed','true');panel.hidden=false;
   doc.querySelectorAll('#channelFilterBar [data-channel]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
   for(const id of ['unreadFilterBar','labelFilterRow'])if($(id))$(id).classList.add('hidden');
   $('searchInput').placeholder='ابحث باسم العميل أو رقم واتساب';
   try{await groups();await refresh();}catch(e){text('campaignPageInfo',e.message);}
   if(active&&!timer)timer=win.setInterval(()=>{if(active&&!doc.hidden)refresh();},5000);return active;
  }
  function exit(){if(!active)return;active=false;epoch++;groupEpoch++;pending=null;pendingKey='';button.classList.remove('active');button.setAttribute('aria-expanded','false');button.setAttribute('aria-pressed','false');panel.hidden=true;win.clearInterval(timer);timer=null;
   for(const id of ['unreadFilterBar','labelFilterRow'])if($(id))$(id).classList.remove('hidden');$('searchInput').placeholder='ابحث عن Session...';onExit();}
  function reset(){win.clearTimeout(searchTimer);active=false;epoch++;groupEpoch++;pending=null;pendingKey='';linkOpened=false;win.clearInterval(timer);timer=null;panel.hidden=true;button.hidden=true;button.classList.remove('active');button.setAttribute('aria-expanded','false');button.setAttribute('aria-pressed','false');$('campaignChoice').replaceChildren(new win.Option('جميع محادثات الحملات',''));text('campaignSelectedMeta','');text('campaignPageInfo','');for(const id of ['unreadFilterBar','labelFilterRow'])if($(id))$(id).classList.remove('hidden');}
  button.hidden=role()!=='admin';button.addEventListener('click',()=>active?exit():enter());
  $('campaignChoice').addEventListener('change',()=>{campaign=$('campaignChoice').value;describe();refresh(true);});
  $('campaignReplyFilter').addEventListener('change',()=>{filter=$('campaignReplyFilter').value;refresh(true);});
  $('campaignPrevious').addEventListener('click',()=>{offset=Math.max(0,offset-50);refresh();});
  $('campaignNext').addEventListener('click',()=>{offset+=50;refresh();});
  $('campaignMoreNames').addEventListener('click',()=>{groupOffset+=50;groups(true).catch(e=>text('campaignPageInfo',e.message));});
  $('campaignNameSearch').addEventListener('input',()=>{win.clearTimeout(searchTimer);searchTimer=win.setTimeout(()=>{groupOffset=0;groups().catch(e=>text('campaignPageInfo',e.message));},250);});
  $('searchInput').addEventListener('input',()=>{if(active){win.clearTimeout(searchTimer);searchTimer=win.setTimeout(()=>refresh(true),250);}});
  doc.getElementById('channelFilterBar')?.addEventListener('click',e=>{if(e.target.closest('[data-channel]'))exit();});
  const params=new URLSearchParams(win.location.search),initial=params.get('campaign'),session=params.get('session');let linkOpened=false,restoring=false;
  async function restoreLink(){if(role()!=='admin'||linkOpened||restoring||(!initial&&!session))return;restoring=true;try{if(initial&&!await enter(initial))return;if(session)await openSession(session);linkOpened=true;}catch(e){text('campaignPageInfo',e.message);}finally{restoring=false;}}
  restoreLink();
  return {active:()=>active,refresh,enter,exit,reset,restoreLink};
 }
 return {mount};
});
