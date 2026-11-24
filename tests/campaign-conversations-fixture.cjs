'use strict';
// Synthetic data only. No imports of credentials or network/database clients.
const ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];
function create({extraCampaigns=()=>[]}={}){
 const replies=new Set(),normal=[{session_id:'12025550101',customer_name:'محادثة نشطة أصلية',content:'رسالة واردة قديمة',id:102,unread_count:1,channel:'whatsapp'},{session_id:'12025550102',customer_name:'محادثة قديمة أصلية',content:'متابعة فردية',id:101,unread_count:0,channel:'whatsapp'}];
 const rows=Array.from({length:10000},(_,i)=>({session_id:i<2?'1202555010'+(i+1):String(12025560000+i),customer_name:i<2?normal[i].customer_name:'عميل حملة تجريبي '+(i+1),phone:i<2?'1202555010'+(i+1):String(12025560000+i),id:1000+i,content:'رسالة حملة محاكية فقط',message_kind:'template',type:'agent',channel:'whatsapp',campaign_id:ids[0],title:'حملة نوفمبر — 10,000 مستلم',response:i===2?'ambiguous':i===3?'explicit':i===4?'after_send':'not_replied',unread_count:i===3?1:0}));
 function conversations(){return [...normal,...rows.filter(r=>replies.has(r.session_id)&&!normal.some(n=>n.session_id===r.session_id)).map(r=>({...r,id:50000,content:'رد عميل محاكى جديد',type:'user',unread_count:1}))].sort((a,b)=>b.id-a.id);}
 const groups=[{id:ids[0],title:rows[0].title,created_at:'2026-11-24T08:00:00Z',recipients:10000},{id:ids[1],title:'حملة ثانية متداخلة',created_at:'2026-11-24T09:00:00Z',recipients:1}];
 async function handle(req,res,u,json){const p=u.pathname;
  if(p.startsWith('/api/whatsapp/campaigns/conversation-group/')){const id=p.split('/').at(-1),d=groups.find(c=>c.id===id)||extraCampaigns().map(d=>({id:d.campaign.id,title:d.campaign.title,created_at:d.campaign.created_at,recipients:d.recipients.length})).find(c=>c.id===id);json(d||{error:'NOT_FOUND'},d?200:404);return true;}
  if(p==='/api/whatsapp/campaigns/conversation-groups'){const q=(u.searchParams.get('q')||'').toLowerCase(),offset=Number(u.searchParams.get('offset')||0),all=[...groups,...extraCampaigns().map(d=>({id:d.campaign.id,title:d.campaign.title,created_at:d.campaign.created_at,recipients:d.recipients.length}))],data=all.filter(x=>x.title.toLowerCase().includes(q));json({rows:data.slice(offset,offset+50),total:data.length});return true;}
  if(p==='/api/whatsapp/campaigns/conversation-list'){
   const campaign=u.searchParams.get('campaign'),filter=u.searchParams.get('filter')||'all',q=u.searchParams.get('q')||'',offset=Number(u.searchParams.get('offset')||0);
   let data=rows.map(r=>replies.has(r.session_id)?{...r,response:'after_send',unread_count:1}:r);
   if(campaign===ids[1])data=data.filter((r,i)=>i===2).map(r=>({...r,campaign_id:ids[1],title:groups[1].title}));
   const extra=extraCampaigns().find(d=>d.campaign.id===campaign);if(extra)data=extra.recipients.filter(r=>r.message_id).map(r=>({...rows.find(x=>x.phone===r.phone),...r,session_id:r.phone,customer_name:r.name,campaign_id:campaign,title:extra.campaign.title,channel:'whatsapp',response:'not_replied',unread_count:0}));
   data=data.filter(r=>(filter==='all'||(filter==='replied'&&['explicit','after_send'].includes(r.response))||(filter==='not_replied'&&r.response==='not_replied')||(filter==='unread'&&r.unread_count>0)||(filter==='ambiguous'&&r.response==='ambiguous'))&&(`${r.customer_name} ${r.phone}`.includes(q)));
   json({rows:data.slice(offset,offset+50),total:data.length,offset,limit:50});return true;
  }
  if(p==='/__fixture__/reply'&&req.method==='POST'){replies.add(rows[6].session_id);json({syntheticOnly:true,session:rows[6].session_id});return true;}
  if(p==='/api/conversations'){json(conversations());return true;}
  if(p==='/api/conversations-search'){json({sessionIds:conversations().filter(r=>(r.customer_name+' '+r.session_id).includes(u.searchParams.get('q')||'')).map(r=>r.session_id)});return true;}
  if(p.startsWith('/api/messages/')){const sid=decodeURIComponent(p.split('/').at(-1)),r=rows.find(r=>r.session_id===sid),messages=r?[{id:r.id,session_id:sid,message:{type:'agent',channel:'whatsapp',content:r.content,message_kind:'template',campaign_id:ids[0],campaign_title:groups[0].title,timestamp:'2026-11-24T08:01:00Z'}}]:[];let sequence=30000;for(const d of extraCampaigns())for(const recipient of d.recipients){sequence++;if(recipient.phone===sid&&recipient.message_id)messages.push({id:sequence,session_id:sid,message:{type:'agent',channel:'whatsapp',content:'رسالة محاكاة محفوظة فقط',message_kind:'template',wa_message_id:recipient.message_id,campaign_id:d.campaign.id,campaign_title:d.campaign.title,timestamp:recipient.updated_at}});}if(replies.has(sid))messages.push({id:50000,session_id:sid,message:{type:'user',channel:'whatsapp',content:'رد عميل محاكى جديد',timestamp:new Date().toISOString()}});json({messages,hasMore:false});return true;}
  if(p.startsWith('/api/send-queue/')){json(p.endsWith('/config')?{ready:true,protocolVersion:1}:{sessionId:decodeURIComponent(p.split('/').at(-1)),items:[],generation:0});return true;}
  if(p==='/api/ai-status'){json({ai_enabled:true});return true;}
  if(p==='/api/saved-replies'||p==='/api/saved-media-folders'){json([]);return true;}
  if(p.startsWith('/api/conversations/')&&p.endsWith('/labels')){json({labels:[]});return true;}
  if(p.startsWith('/api/conversations/')&&p.endsWith('/mark-read')){json({success:true});return true;}
  if(p==='/api/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store'});res.write(': synthetic local stream only\n\n');return true;}
  return false;
 }
 return {handle,rows,ids,normal};
}
module.exports={create};
