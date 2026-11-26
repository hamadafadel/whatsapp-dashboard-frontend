(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.MehrabCampaigns=api;api.mount(root.document);}})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  function addRecipient(map,row){
    const old=map.get(row.phone);
    if(!old){map.set(row.phone,{...row,selected:row.selected===true,sources:[...new Set(row.sources||[])],labelTags:row.labelTags||[],columns:{...row.columns},conflicts:[]});return;}
    old.sources=[...new Set([...old.sources,...(row.sources||[])])];
    old.labelTags=[...new Map([...(old.labelTags||[]),...(row.labelTags||[])].map(l=>[l.id,l])).values()];
    if(!old.name)old.name=row.name;
    for(const [k,v] of Object.entries(row.columns||{})){
      if(old.columns[k]!==undefined&&old.columns[k]!==v&&!old.conflicts.includes(k))old.conflicts.push(k);
      else old.columns[k]=v;
    }
    old.permission=row.permission; // Authoritative response, never imported consent.
    if(row.local){old.local=true;old.selected=row.selected===true||old.selected;}
    if(row.label_ids)old.label_ids=row.label_ids;
    if(row.directory)old.directory=true;
  }
  function filtered(map,{query='',view='all',labelPhones=new Set()}){
    query=query.trim().toLocaleLowerCase();
    return [...map.values()].filter(r=>(view!=='selected'||r.selected)&&(view!=='labels'||labelPhones.has(r.phone))&&(`${r.name} ${r.phone}`.toLocaleLowerCase().includes(query)));
  }
  function mount(doc){
    const $=id=>doc.getElementById(id),win=doc.defaultView;
    const apiBase='https://wadashboardapi.almehrab.org/api',rows=new Map(),mapping=new Map();
    let token=win.localStorage.getItem('dashboard_token')||'',step=1,source='manual',templates=[],template=null,imported=null,labels=[],labelPhones=new Set(),draft=null,lockedBody=null,requestId=null,confirmAttempted=false,consentTarget=null,loading=false,currentPage=0,historyPage=0,historyTimer=null,historyId=null,polling=false,reviewUncertain=false,historyData=null,historyEpoch=0;
    const finalExcluded=new Set();
    let historyRecipientOffset=0,historySearchTimer=null;
    let directoryActive=false,directoryPage=[],directoryTotal=0,directoryEpoch=0,directoryTimer=null,directoryBusy=false;
    let consentBusy=false;
    const scope=()=>({all:$('allWhatsApp')?.checked===true,labels:[...doc.querySelectorAll('input[name=campaignLabel]:checked')].map(x=>Number(x.value))});
    const inScope=r=>{const s=scope();return s.all||s.labels.some(id=>(r.label_ids||[]).includes(id));};
    const directoryView=()=>directoryActive&&$('recipientView').value!=='selected';
    const el=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
    const setNotice=text=>{$('notice').hidden=!text;$('notice').textContent=text||'';};
    function labelChip(l){const chip=el('span','source-tag label-chip',l.name),raw=/^#[0-9a-f]{6}$/i.test(l.color||'')?l.color:'#54105b';chip.style.backgroundColor=raw;const rgb=[1,3,5].map(i=>parseInt(raw.slice(i,i+2),16));chip.style.color=(rgb[0]*.299+rgb[1]*.587+rgb[2]*.114)>155?'#202124':'#fff';return chip;}
    function sourceChips(r){const box=el('span','source-chips');for(const l of r.labelTags||[])box.append(labelChip(l));for(const s of r.sources||[])if(!(r.labelTags?.length&&s.startsWith('Label: ')))box.append(el('span','source-tag',s));return box;}
    const errors={CAMPAIGNS_DISABLED:'الميزة غير مفعّلة بعد على الخادم.',CAMPAIGNS_NOT_INSTALLED:'جداول الحملات غير مثبتة بعد. لا توجد محاولة إرسال.',CONSENT_REQUIRED:'يلزم تسجيل موافقة موثقة',OPTED_OUT:'منسحب — مستبعد',TEMPLATE_CHANGED_REFRESH_REQUIRED:'تغيّر القالب؛ أعد تحميل الكتالوج والمراجعة.',INVALID_WHATSAPP_NUMBER:'رقم واتساب غير صالح',DUPLICATE_RECIPIENT_VALUE_CONFLICT:'قيم متعارضة لنفس الرقم. راجع البيانات.',UNKNOWN_SEND_REQUIRES_REVIEW:'توجد عملية غير مؤكدة. لا يمكن استئنافها تلقائيًا.',ADMINS_ONLY:'هذه الصفحة متاحة للأدمن فقط.',REVIEW_REQUIRED_OR_NO_ELIGIBLE_RECIPIENTS:'لا يوجد مستلم مؤهل أو المراجعة غير مكتملة.'};
    Object.assign(errors,{USER_EXCLUDED:'مستبعد من القائمة',CAMPAIGN_CANCELLED:'أُلغي المتبقي',REVIEW_STALE_REFRESH_REQUIRED:'تغيّرت المراجعة. أعد التحقق قبل التأكيد.',CONVERSATION_QUEUE_BLOCKED:'إرسال سابق غير محسوم في المحادثة',SEND_RESULT_UNKNOWN:'لم يتأكد الإرسال؛ لا يُعاد تلقائيًا',SEND_PERMISSION_REVOKED:'لم تعد صلاحية الإرسال متاحة'});
    async function api(path,{method='GET',body,headers={},signal,binary=false}={}){
      token=win.localStorage.getItem('dashboard_token')||'';const owner=token;
      const response=await win.fetch(apiBase+path,{method,headers:{Authorization:'Bearer '+token,...(body&&! (body instanceof win.FormData)?{'Content-Type':'application/json'}:{}),...headers},body:body instanceof win.FormData?body:body?JSON.stringify(body):undefined,cache:'no-store',signal:signal||AbortSignal.timeout(45000)});
      if(owner!==(win.localStorage.getItem('dashboard_token')||''))throw Error('تغيّرت جلسة الحساب. أعد فتح الصفحة.');
      if(binary&&response.ok)return response.blob();
      let data;try{data=await response.json();}catch{throw Object.assign(Error('تعذر تأكيد استجابة الخادم. لم تتم إعادة الإرسال.'),{status:response.ok?undefined:response.status});}if(!response.ok)throw Object.assign(Error(errors[data.error]||data.error||'تعذر إكمال الطلب.'),{status:response.status});return data;
    }
    function safe(fn){return async()=>{try{setNotice('');await fn();}catch(e){setNotice(e.message||'تعذر الاتصال. لم تتم إعادة أي عملية إرسال.');}};}
    function visible(){if(directoryView())return directoryPage.map(r=>rows.get(r.phone)||r);return filtered(rows,{query:$('recipientSearch').value,view:$('recipientView').value,labelPhones});}
    function selected(){return [...rows.values()].filter(r=>r.selected);}
    const reasonText=r=>r.permission?.status==='withdrawn'?'منسحب':r.permission?.status==='granted'?'موافقة مسجلة':'موافقة غير مسجلة';
    function renderRows(){
      const list=visible(),total=directoryView()?directoryTotal:list.length;currentPage=Math.min(currentPage,Math.max(0,Math.ceil(total/50)-1));$('recipientRows').replaceChildren();$('emptyRecipients').hidden=list.length>0;
      $('recipientPrev').disabled=currentPage===0;$('recipientNext').disabled=(currentPage+1)*50>=total;$('recipientPrev').hidden=$('recipientNext').hidden=total<=50;$('recipientPage').textContent=total?`صفحة ${currentPage+1} من ${Math.ceil(total/50)}`:'';
      for(const r of (directoryView()?list:list.slice(currentPage*50,(currentPage+1)*50))){
        const tr=el('tr'),td=el('td'),check=el('input');check.type='checkbox';check.checked=r.selected;check.setAttribute('aria-label',`تحديد ${r.name||r.phone}`);check.addEventListener('change',()=>{r.selected=check.checked;if($('recipientView').value==='selected')renderRows();else counts();});td.append(check);tr.append(td);
        const who=el('td');who.append(el('strong','',r.name||'بدون اسم'),el('span','phone','+'+r.phone));const mobileSource=el('small','mobile-sources');mobileSource.append(sourceChips(r));who.append(mobileSource);tr.append(who);
        const src=el('td');src.append(sourceChips(r));tr.append(src);
        const status=el('td');status.append(el('span','status '+(r.permission?.status==='withdrawn'?'bad':r.permission?.status==='granted'?'good':'warn'),reasonText(r)));if(r.conflicts.length)status.append(el('small','bad','تعارض بيانات ملف'));tr.append(status);
        const actions=el('td'),edit=el('button','row-action','الموافقة');edit.type='button';edit.addEventListener('click',()=>openConsent(r));actions.append(edit);
        const remove=el('button','row-action','استبعاد');remove.type='button';remove.setAttribute('aria-label',`استبعاد ${r.name||r.phone}`);remove.addEventListener('click',()=>{r.selected=false;renderRows();});actions.append(remove);tr.append(actions);$('recipientRows').append(tr);
      }counts();
    }
    function counts(){const n=selected().length;$('selectedCount').textContent=`${n} محدد`;$('totalCount').textContent=`إجمالي العملاء المعروضين ${directoryView()?directoryTotal:visible().length} · المحددون ${n}`;$('footerSummary').textContent=n?`${n} مستلم محدد · مراجعة الأهلية قبل الإرسال`:'اختر المستلمين للمتابعة';$('nextStep').disabled=n===0||loading||directoryBusy||consentBusy;for(const id of ['bulkGrantConsent','bulkWithdrawConsent'])$(id).disabled=n===0||loading||directoryBusy||consentBusy;}
    function sourceMode(next){source=next;for(const s of ['manual','import','labels'])$('source-'+s).hidden=s!==next;doc.querySelectorAll('[data-source]').forEach(b=>b.classList.toggle('active',b.dataset.source===next));}
    function go(next){step=next;for(let i=1;i<=3;i++){$('step'+i).hidden=i!==step;const li=doc.querySelector(`[data-step="${i}"]`);if(i===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');}
      $('previousStep').hidden=step===1;$('nextStep').hidden=step===3;$('prepareReview').hidden=step!==3||Boolean(draft);$('confirmSend').hidden=step!==3||!draft;
      $('nextStep').textContent=step===1?'التالي: اختيار القالب ←':'التالي: المراجعة النهائية ←';
      $('nextStep').disabled=step===1?selected().length===0:!template;
      if(step===2)populatePreviewRecipients();if(step===3)reviewLocal();win.scrollTo({top:0,behavior:'instant'});
    }
    async function addRaw(raw,sourceNames){
      if(rows.size+raw.length>10000)throw Error('الحد الأقصى 10,000 صف قبل إزالة التكرار. قسّم الملف.');
      const result=await api('/whatsapp/campaigns/resolve',{method:'POST',body:{rows:raw.map(r=>({phone:r.phone,name:r.name||''})),country:$('country').value}});let invalid=0;
      result.rows.forEach(r=>{const original=raw[r.inputIndex];if(!r.phone){invalid++;return;}addRecipient(rows,{phone:r.phone,name:r.name,permission:r.permission,sources:sourceNames,columns:original.columns||{},local:true,selected:true});});
      $('recipientView').value='selected';currentPage=0;
      renderRows();if(invalid)setNotice(`لم تُضف ${invalid} أرقام غير صالحة. صحّحها في المصدر قبل المحاولة مجددًا.`);
    }
    async function loadLabels(){const d=await api('/labels');labels=d.labels;$('labelsList').replaceChildren();const allLabel=el('label'),all=el('input');all.type='checkbox';all.id='allWhatsApp';allLabel.append(all,el('span','','الكل — جميع عملاء WhatsApp، بما فيهم دون Label'));$('labelsList').append(allLabel);all.addEventListener('change',()=>{if(all.checked)doc.querySelectorAll('[name=campaignLabel]').forEach(x=>x.checked=false);safe(loadLabelMembers)();});for(const l of labels){const label=el('label'),check=el('input');check.type='checkbox';check.value=String(l.id);check.name='campaignLabel';check.addEventListener('change',()=>{if(check.checked)all.checked=false;safe(loadLabelMembers)();});label.append(check,labelChip(l));$('labelsList').append(label);}}
    async function loadLabelMembers(){
      directoryEpoch++;directoryBusy=false;directoryPage=[];directoryTotal=0;currentPage=0;const s=scope();directoryActive=s.all||s.labels.length>0;
      for(const [phone,r] of rows){if(r.directory&&!inScope(r)){if(!r.local)rows.delete(phone);else{r.directory=false;r.label_ids=[];r.labelTags=[];}}}
      labelPhones=new Set([...rows.values()].filter(r=>r.directory&&inScope(r)).map(r=>r.phone));$('recipientView').value=directoryActive?'labels':'all';renderRows();await loadDirectory();
    }
    async function loadDirectory(){
      const epoch=++directoryEpoch;if(!directoryView()){renderRows();return;}directoryBusy=true;counts();
      const local=$('recipientView').value==='all'?filtered(new Map([...rows].filter(([,r])=>r.local)),{query:$('recipientSearch').value}):[],part=local.slice(currentPage*50,(currentPage+1)*50);
      try{const d=await api('/whatsapp/campaigns/recipient-directory',{method:'POST',body:{...scope(),q:$('recipientSearch').value,exclude:$('recipientView').value==='all'?[...rows.values()].filter(r=>r.local).map(r=>r.phone):[],offset:Math.max(0,currentPage*50-local.length),limit:Math.max(1,50-part.length)}});if(epoch!==directoryEpoch)return;
        directoryTotal=d.total+local.length;directoryPage=[...part,...d.rows.slice(0,50-part.length)];for(const [phone,r] of rows)if(r.directory&&!r.local&&!r.selected&&!directoryPage.some(x=>x.phone===phone))rows.delete(phone);for(const r of d.rows){const tags=labels.filter(l=>(r.label_ids||[]).includes(l.id));addRecipient(rows,{...r,directory:true,selected:false,labelTags:tags,sources:['دليل WhatsApp'],columns:{}});labelPhones.add(r.phone);}renderRows();
      }catch(e){if(epoch===directoryEpoch){directoryPage=[];directoryTotal=0;renderRows();throw e;}}finally{if(epoch===directoryEpoch){directoryBusy=false;counts();}}
    }
    async function selectDirectory(checked,searchOnly){
      if(directoryBusy)return;if(!directoryView()){(searchOnly?visible():[...rows.values()]).forEach(r=>r.selected=checked);renderRows();return;}
      const epoch=directoryEpoch;directoryBusy=true;counts();try{const d=await api('/whatsapp/campaigns/recipient-directory',{method:'POST',body:{...scope(),q:searchOnly?$('recipientSearch').value:'',identitiesOnly:true}});if(epoch!==directoryEpoch)return;
        if(checked&&new Set([...selected().map(r=>r.phone),...d.rows.map(r=>r.phone)]).size>10000)throw Error('الحد الأقصى 10,000 مستلم محدد.');
        for(const r of d.rows){if(!rows.has(r.phone))addRecipient(rows,{...r,name:'',directory:true,sources:['دليل WhatsApp'],columns:{},selected:false});rows.get(r.phone).selected=checked;}for(const r of rows.values())if(r.local&&(!searchOnly||(`${r.name} ${r.phone}`.toLocaleLowerCase().includes($('recipientSearch').value.trim().toLocaleLowerCase()))))r.selected=checked;renderRows();
      }finally{if(epoch===directoryEpoch){directoryBusy=false;counts();}}
    }
    async function hydrateSelected(){const picked=selected(),epoch=directoryEpoch;for(let i=0;i<picked.length;i+=200){const batch=picked.slice(i,i+200),d=await api('/whatsapp/campaigns/resolve',{method:'POST',body:{rows:batch.map(r=>({phone:r.phone,name:r.name}))}});if(epoch!==directoryEpoch)throw Error('تغيّر اختيار المستلمين. راجع القائمة مجددًا.');for(const r of d.rows){const target=rows.get(r.phone);if(target?.selected){target.name=r.name||target.name;target.permission=r.permission;}}}}
    function openConsent(r){consentTarget=r.phone;$('consentPhone').textContent='+'+r.phone;$('consentEvidence').value='';$('consentStatus').disabled=false;$('consentStatus').value=r.permission?.status||'granted';$('consentBatchNotice').hidden=$('consentBatchConfirmation').hidden=true;doc.querySelectorAll('[name=consentCategory]').forEach(c=>c.checked=r.permission?.categories?.includes(c.value)||false);$('consentDialog').showModal();}
    function openBulkConsent(status){
      if(consentBusy||directoryBusy)return;const phones=selected().map(r=>r.phone);if(!phones.length)return;
      consentTarget={phones,status};$('consentPhone').textContent=`سيتم تحديث ${phones.length} عميل محدد عبر جميع الصفحات.`;$('consentStatus').value=status;$('consentStatus').disabled=true;$('consentEvidence').value='';$('consentBatchReviewed').checked=false;
      $('consentBatchNotice').hidden=$('consentBatchConfirmation').hidden=false;$('consentBatchNotice').textContent=status==='granted'?'تُسجّل الموافقة فقط عند وجود مرجع فعلي للمجموعة. العملاء المنسحبون سابقًا سيظلون مستبعدين ولن تعيد العملية اشتراكهم.':'تُسجّل الحالة كإلغاء اشتراك؛ سيُستبعد المحددون من الحملات دون حذفهم أو حذف محادثاتهم.';
      doc.querySelectorAll('[name=consentCategory]').forEach(c=>c.checked=false);$('consentDialog').showModal();
    }
    function renderTemplates(){
      const query=$('templateSearch').value.toLocaleLowerCase();$('templateList').replaceChildren();
      for(const t of templates.filter(t=>`${t.name} ${t.language} ${t.category}`.toLocaleLowerCase().includes(query))){
        const b=el('button','template-item'+(template?.id===t.id&&template?.language===t.language?' selected':''));b.type='button';b.append(el('strong','',t.name),el('small','',`${t.language} · ${t.category} · ${t.sendSchema?.supported?'معتمد ومدعوم':'غير مدعوم للإرسال'}`));b.disabled=!t.sendSchema?.supported;b.addEventListener('click',()=>{template=t;mapping.clear();renderFields();renderTemplates();go(2);});$('templateList').append(b);
      }
    }
    function renderFields(){
      $('templateFields').replaceChildren();$('templateMeta').textContent=template?`${template.name} · ${template.language} · ${template.category} · APPROVED`:'';
      for(const f of template?.sendSchema?.fields||[]){
        if(f.type==='media'){
          mapping.set(f.key,{mode:'literal',value:'',field:f});const current=template,currentMapping=mapping.get(f.key);
          const request=(path,options)=>api(path,options);request.origin=new URL(apiBase).origin;
          $('templateFields').append(win.MehrabTemplateCatalog.mediaField({doc,template,field:f,request,onChange:url=>{if(template===current&&mapping.get(f.key)===currentMapping){currentMapping.value=url;updatePreview();}}}));continue;
        }
        const wrap=el('div','field-mapping'),label=el('label','',f.label+(f.required?' *':'')),controls=el('div','mapping-controls'),mode=el('select'),value=el('input');value.dir='auto';value.maxLength=4096;value.placeholder=f.type==='media'?'Meta Media ID أو رابط HTTPS':'قيمة مشتركة لكل المستلمين';value.setAttribute('aria-label',f.label);
        const options=[['literal','قيمة ثابتة'],['name','اسم العميل'],['phone','رقم واتساب'],...([...new Set(selected().flatMap(r=>Object.keys(r.columns)))]).map(c=>['column:'+c,'عمود: '+c])];
        options.forEach(([v,n])=>{const o=el('option','',n);o.value=v;mode.append(o);});mode.setAttribute('aria-label','مصدر '+f.label);mapping.set(f.key,{mode:'literal',value:'',field:f});
        mode.addEventListener('change',()=>{mapping.get(f.key).mode=mode.value;value.hidden=mode.value!=='literal';updatePreview();});value.addEventListener('input',()=>{mapping.get(f.key).value=value.value;updatePreview();});controls.append(mode,value);wrap.append(label,controls);$('templateFields').append(wrap);
      }populatePreviewRecipients();updatePreview();
    }
    function valuesFor(r,validate=true){if(validate&&$('templateFields').querySelector('[data-media-busy="true"]'))throw Error('انتظر اكتمال حفظ ميديا القالب.');const result={};for(const [key,m] of mapping){let v=m.mode==='name'?r.name:m.mode==='phone'?r.phone:m.mode.startsWith('column:')?r.columns[m.mode.slice(7)]:m.value;
      if(m.mode.startsWith('column:')&&r.conflicts.includes(m.mode.slice(7)))throw Error(`قيم متعارضة للعمود ${m.mode.slice(7)} في الرقم ${r.phone}. احذف الصف وأعد إضافته بالقيمة الصحيحة.`);
      if(v===undefined)v='';if(validate&&m.field.required&&!String(v).trim())throw Error(`قيمة مطلوبة مفقودة للمستلم ${r.name||r.phone}: ${m.field.label}`);if(v!=='')result[key]=String(v);
    }return result;}
    function populatePreviewRecipients(){const previous=$('previewRecipient').value;$('previewRecipient').replaceChildren();selected().forEach(r=>{const o=el('option','',`${r.name||'بدون اسم'} — +${r.phone}`);o.value=r.phone;$('previewRecipient').append(o);});if(rows.has(previous))$('previewRecipient').value=previous;updatePreview();}
    function renderMessage(target,t,values){
      target.replaceChildren();const v=new Map(Object.entries(values)),interpolate=(c,path,key)=>win.MehrabTemplateCatalog.interpolate(c[key],path,key,v);
      const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
      (t.components||[]).forEach((c,i)=>{const path=`components[${i}]`;
        if(c.type==='BUTTONS'){const box=el('div','wa-buttons');for(const [j,b] of (c.buttons||[]).entries()){const button=el('div','wa-button',b.text||'زر');if(b.type==='URL'){const href=safeUrl(interpolate(b,`${path}.buttons[${j}]`,'url'));if(href){const link=el('a','',b.text||'فتح الرابط');link.href=href;link.target='_blank';link.rel='noopener noreferrer';button.replaceChildren(link);}}box.append(button);}target.append(box);return;}
        if(c.type==='HEADER'&&c.format&&c.format!=='TEXT'){const node=win.MehrabTemplateCatalog.mediaPreview(doc,c.format,values[path+'.media']);if(node)target.append(node);else target.append(el('div','wa-media-placeholder',({IMAGE:'صورة',VIDEO:'فيديو',DOCUMENT:'ملف',LOCATION:'موقع'})[c.format]||c.format));}
        if(c.text){const block=el('div','wa-'+c.type.toLowerCase());const text=interpolate(c,path,'text');let at=0;for(const m of text.matchAll(/https:\/\/[^\s<>]+/g)){block.append(doc.createTextNode(text.slice(at,m.index)));const href=safeUrl(m[0]);if(href){const a=el('a','',m[0]);a.href=href;a.target='_blank';a.rel='noopener noreferrer';block.append(a);}else block.append(doc.createTextNode(m[0]));at=m.index+m[0].length;}block.append(doc.createTextNode(text.slice(at)));target.append(block);}
      });
    }
    function updatePreview(){if(!template)return;try{const r=rows.get($('previewRecipient').value)||selected()[0];renderMessage($('templatePreview'),template,r?valuesFor(r,false):{});}catch(e){$('templatePreview').textContent=e.message;}}
    function reviewLocal(){
      $('reviewAcknowledgement').checked=false;$('confirmSend').disabled=true;
      $('reviewRows').replaceChildren();const recipients=draft?.recipients||selected();
      for(const r of recipients){const row=el('div','review-row'),left=el('div');left.append(el('strong','',r.name||'بدون اسم'),el('span','phone','+'+r.phone));const reason=finalExcluded.has(r.phone)?'USER_EXCLUDED':r.reason||(r.permission?.status==='withdrawn'?'OPTED_OUT':null);row.append(left,el('span',reason?'bad':'hint',reason?(errors[reason]||reason):draft?'مؤهل للإرسال':'بانتظار تحقق الخادم'));const b=el('button','row-action','استبعاد');b.type='button';b.setAttribute('aria-label',`استبعاد من المراجعة ${r.name||r.phone}`);b.disabled=Boolean(reason)||loading||confirmAttempted||Boolean(lockedBody&&!draft);b.addEventListener('click',safe(async()=>{if(draft)await reviseReview([r.phone]);else{finalExcluded.add(r.phone);reviewLocal();}}));row.append(b);$('reviewRows').append(row);}
      const blocked=recipients.filter(r=>finalExcluded.has(r.phone)||r.reason||r.permission?.status==='withdrawn').length,eligible=draft?draft.eligible:null;
      $('reviewSummary').replaceChildren();const stats=el('div','stats-grid');for(const [key,label,value] of [['selected','المحددون للمراجعة',recipients.length],['eligible','المؤهلون',eligible??'بعد التحقق'],['excluded','المستبعدون',draft?recipients.length-eligible:blocked]]){const n=el('div','stat-tile');n.dataset.count=key;n.append(el('span','',label),el('strong','',String(value)));stats.append(n);}$('reviewSummary').append(stats,el('p','hint',template?`${template.name} · ${template.language} · ${template.category}`:''));
      // Keep a compact accessible ratio for existing assistive clients; separate visible counts above.
      if(draft)$('reviewSummary').append(el('span','sr-only',`${eligible} / ${recipients.length}`));
      const seconds=Math.ceil(Math.max(0,(eligible??Math.max(0,recipients.length-blocked))-1)*Number(draft?.campaign.interval_ms||$('sendInterval').value)/1000);
      $('reviewDuration').textContent=`الفواصل وحدها تستغرق تقريبًا ${seconds<60?seconds+' ثانية':Math.ceil(seconds/60)+' دقيقة'}. تضاف أوقات الطلبات وحدود Meta والتوقفات؛ ليس موعد تسليم.`;
      const before=$('reviewPreviewRecipient').value;$('reviewPreviewRecipient').replaceChildren();for(const r of recipients){const o=el('option','',`${r.name||'بدون اسم'} — +${r.phone}${r.reason?' (مستبعد)':''}`);o.value=r.phone;$('reviewPreviewRecipient').append(o);}if(recipients.some(r=>r.phone===before))$('reviewPreviewRecipient').value=before;updateReviewPreview();
      $('revalidateReview').hidden=!draft;$('revalidateReview').disabled=loading||confirmAttempted;
    }
    function updateReviewPreview(){const r=(draft?.recipients||selected()).find(r=>r.phone===$('reviewPreviewRecipient').value);if(!r)return;try{renderMessage($('reviewPreview'),template||draft.campaign.template,draft?r.values:valuesFor(r));}catch(e){$('reviewPreview').textContent=e.message;}}
    async function reviseReview(excludePhones=[]){if(loading||confirmAttempted)return;loading=true;reviewLocal();try{if(reviewUncertain)draft=await api('/whatsapp/campaigns/'+draft.campaign.id);draft=await api(`/whatsapp/campaigns/${draft.campaign.id}/review`,{method:'POST',body:{reviewToken:draft.reviewToken,excludePhones}});reviewUncertain=false;setNotice('أعيد التحقق من القائمة. راجع الأعداد وأكّد المراجعة من جديد؛ لم يُرسل شيء.');}catch(e){reviewUncertain=true;setNotice('تعذر تأكيد تحديث المراجعة. أعد التحقق قبل التأكيد؛ لم يُرسل شيء.');}finally{loading=false;reviewLocal();}}
    function makeBody(){if(!template)throw Error('اختر قالبًا.');return {title:$('campaignTitle').value.trim(),templateId:template.id,language:template.language,revision:template.revision,intervalMs:Number($('sendInterval').value),excludePhones:[...finalExcluded],recipients:selected().map(r=>({phone:r.phone,name:r.name,sources:r.sources,values:valuesFor(r)}))};}
    async function prepare(){
      if(loading)return;loading=true;$('prepareReview').disabled=true;try{
        if(!lockedBody){const body=makeBody();if(!body.title)throw Error('أدخل اسم عملية الإرسال.');lockedBody=body;requestId=win.crypto.randomUUID();}
        draft=await api('/whatsapp/campaigns',{method:'POST',headers:{'Idempotency-Key':requestId},body:lockedBody});
        $('campaignTitle').disabled=true;$('sendInterval').disabled=true;$('previousStep').disabled=true;go(3);$('confirmSend').disabled=true;setNotice('حُفظت المراجعة فقط، دون إرسال. المستبعدون لن يدخلوا الطابور.');
      }catch(e){if(e.status&&e.status<500){lockedBody=null;requestId=null;}else if(lockedBody){$('previousStep').disabled=true;$('campaignTitle').disabled=true;$('sendInterval').disabled=true;setNotice('نتيجة حفظ المراجعة غير مؤكدة. اضغط حفظ مجددًا للتحقق بنفس مفتاح العملية، دون إرسال.');return;}throw e;}
      finally{loading=false;$('prepareReview').disabled=false;if(step===3)reviewLocal();}
    }
    const stateLabels={draft:'مسودة',running:'جارٍ الإرسال',paused:'متوقف مؤقتًا',completed:'مكتمل',cancelled:'ملغي',pending:'بانتظار الطابور',queued:'في الطابور',sending:'جارٍ الإرسال',sent:'قبلته Meta',delivered:'تم التسليم',read:'تمت القراءة',failed:'فشل',unknown:'نتيجة غير مؤكدة',excluded:'مستبعد'};
    function date(value){if(!value)return 'التوقيت غير متاح';const d=new Date(value);return Number.isNaN(d.getTime())?'التوقيت غير متاح':new Intl.DateTimeFormat('ar-EG',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Cairo'}).format(d);}
    const statNames={total:'الإجمالي',sent:'المرسل',remaining:'المتبقي',excluded:'المستبعد',failed:'الفاشل',unknown:'غير المؤكد',delivered:'تم التسليم',read:'تمت القراءة'};
    function statsBox(s){const box=el('div','stats-grid history-stats');for(const [key,title] of Object.entries(statNames)){const tile=el('div','stat-tile');tile.dataset.metric=key;tile.append(el('span','',title),el('strong','',String(s[key]||0)));box.append(tile);}return box;}
    function progressBox(s){const box=el('div','progress-box'),processed=Math.max(0,(s.total||0)-(s.remaining||0)),p=el('progress');p.max=100;p.value=s.total?Math.round(processed*100/s.total):0;p.setAttribute('aria-label','تقدم معالجة المستلمين');box.append(p,el('small','hint',`معالجة ${processed} من ${s.total||0} — ليست نسبة التسليم أو القراءة`));return box;}
    function badge(status){const b=el('span','message-status status-'+status),tick=el('span','status-tick',['read','delivered'].includes(status)?'✓✓':status==='sent'?'✓':status==='unknown'?'؟':status==='failed'?'!':'◷');tick.setAttribute('aria-hidden','true');b.append(tick,el('span','',stateLabels[status]||status));return b;}
    async function showHistory(){
      $('wizard').hidden=true;$('history').hidden=false;$('historyTab').classList.add('nav-active');$('newTab').classList.remove('nav-active');win.history.replaceState(null,'','#history');
      const data=await api('/whatsapp/campaigns?offset='+historyPage*50);$('historyList').replaceChildren();if(!data.campaigns.length)$('historyList').append(el('p','hint','لا توجد عمليات مسجلة من واجهة الإرسال في هذه الصفحة.'));
      $('historyPrev').disabled=historyPage===0;$('historyNext').disabled=!data.hasMore;$('historyPrev').hidden=$('historyNext').hidden=historyPage===0&&!data.hasMore;$('historyPage').textContent=`صفحة ${historyPage+1}`;
      $('historyList').hidden=Boolean(historyId);$('historyPagination').hidden=Boolean(historyId);$('historyBack').hidden=!historyId;
      data.campaigns.forEach(c=>{const row=el('article','history-item campaign-card'),info=el('div','campaign-card-heading');info.append(el('strong','',c.title),el('small','',`${date(c.created_at)} — توقيت القاهرة`),el('small','',`${c.template_name} · ${stateLabels[c.state]||c.state}${c.simulated?' · محاكاة فقط':''}`));const b=el('button','','تفاصيل المستلمين');b.type='button';b.addEventListener('click',safe(()=>historyDetail(c.id)));info.append(b);row.append(info,statsBox(c),progressBox(c));$('historyList').append(row);});
      if(data.direct?.length){$('historyList').append(el('h2','','إرسال فردي من داخل المحادثات'));data.direct.forEach(r=>{const item=el('div','history-item'),info=el('div');info.append(el('strong','',r.name||'بدون اسم'),el('span','phone','+'+r.session_id),el('small','',`قالب ${r.template_id} · ${r.owner_name} · ${date(r.created_at)}`));const state=el('div');state.append(badge(r.status||r.delivery_status||r.state),el('small','status-date',date(r.status_at)));if(r.failure_reason)state.append(el('small','bad',errors[r.failure_reason]||r.failure_reason));item.append(info,state);$('historyList').append(item);});}
      $('startAnother').hidden=!lockedBody;
      if(!historyTimer)historyTimer=win.setInterval(async()=>{if(polling||doc.hidden||$('history').hidden)return;polling=true;try{await showHistory();if(historyId)await historyDetail(historyId);}catch(e){setNotice(e.message);}finally{polling=false;}},5000);
    }
    async function historyDetail(id){
      const changed=historyId!==id;if(changed)historyRecipientOffset=0;historyId=id;const epoch=++historyEpoch;
      const query=new URLSearchParams({q:changed?'':$('historyRecipientSearch')?.value||'',status:changed?'all':$('historyStatusFilter')?.value||'all',offset:historyRecipientOffset});
      const d=await api('/whatsapp/campaigns/'+id+'/recipients?'+query);if(epoch!==historyEpoch||historyId!==id)return;historyData=d;
      $('historyList').hidden=true;$('historyPagination').hidden=true;$('historyBack').hidden=false;if(changed)win.scrollTo({top:0,behavior:'instant'});
      let card=$('historyDetail').querySelector('[data-campaign-detail]');if(!card||card.dataset.campaignDetail!==id){card=el('section','card');card.dataset.campaignDetail=id;
        const head=el('div');head.id='historyDetailHeading';const controls=el('div','footer-actions');controls.id='historyControls';const metrics=el('div');metrics.id='historyMetrics';
        const tools=el('div','list-tools'),search=el('input');search.id='historyRecipientSearch';search.type='search';search.placeholder='ابحث بالاسم أو رقم واتساب';search.setAttribute('aria-label','البحث في نتائج الحملة');const filter=el('select');filter.id='historyStatusFilter';filter.setAttribute('aria-label','تصفية حالة الرسالة');
        const reload=()=>{historyRecipientOffset=0;win.clearTimeout(historySearchTimer);historySearchTimer=win.setTimeout(()=>safe(()=>historyDetail(id))(),200);};
        for(const [value,label] of [['all','كل الحالات'],...Object.keys(stateLabels).filter(k=>!['draft','running','paused','completed','cancelled'].includes(k)).map(k=>[k,stateLabels[k]])]){const o=el('option','',label);o.value=value;filter.append(o);}search.addEventListener('input',reload);filter.addEventListener('change',reload);tools.append(search,filter);
        const exportButton=el('button','','تصدير كل النتائج (Excel)');exportButton.id='exportCampaign';exportButton.type='button';exportButton.addEventListener('click',safe(async()=>{exportButton.disabled=true;try{const blob=await api(`/whatsapp/campaigns/${id}/export`,{binary:true}),url=win.URL.createObjectURL(blob),a=el('a');a.href=url;a.download=`campaign-${id}.xlsx`;doc.body.append(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);}finally{exportButton.disabled=false;}}));
        const list=el('div');list.id='historyRecipientResults';card.append(head,controls,metrics,el('p','hint','المرسل يشمل التسليم والقراءة؛ لا تجمع هذه الأعداد. علامة واحدة لقبول Meta، وعلامتان للتسليم، والأزرق للقراءة. الإيقاف لا يستدعي إرسالًا داخل الطابور. النتائج غير المؤكدة لا تُعاد تلقائيًا.'),tools,exportButton,list);$('historyDetail').replaceChildren(card);
      }
      $('historyDetailHeading').replaceChildren(el('h2','',d.campaign.title),el('p','hint',`${date(d.campaign.created_at)} · ${d.campaign.template.name} · ${d.campaign.template.language} · ${stateLabels[d.campaign.state]}${d.campaign.simulated?' · بيانات محاكاة لا تمثل رسائل حقيقية':''}`));
      const controls=$('historyControls');controls.replaceChildren();for(const [action,label,allowed] of [['pause','إيقاف مؤقت',d.campaign.state==='running'],['resume','استكمال آمن',d.campaign.state==='paused'],['cancel','إلغاء المتبقي',['running','paused','draft'].includes(d.campaign.state)]]){
        if(!allowed)continue;const b=el('button','',label);b.type='button';b.addEventListener('click',safe(async()=>{b.disabled=true;await api(`/whatsapp/campaigns/${id}/${action}`,{method:'POST',body:{}});await showHistory();await historyDetail(id);}));controls.append(b);
      }const campaignLink=el('a','row-action','عرض محادثات الحملة');campaignLink.href='/index.html?'+new URLSearchParams({campaign:id});controls.append(campaignLink);$('historyMetrics').replaceChildren(statsBox(d.summary||{}),progressBox(d.summary||{}));renderHistoryRows();
    }
    function renderHistoryRows(){if(!historyData)return;const q=$('historyRecipientSearch').value.trim().toLocaleLowerCase(),filter=$('historyStatusFilter').value,list=$('historyRecipientResults');list.replaceChildren();
      const matches=historyData.recipients.filter(r=>`${r.name} ${r.phone}`.toLocaleLowerCase().includes(q)&&(filter==='all'||r.status===filter||(filter==='sent'&&['delivered','read'].includes(r.status))||(filter==='delivered'&&r.status==='read')));
      const page=historyData.pagination;list.append(el('p','hint',`${page?.total??matches.length} نتائج من ${historyData.summary?.total??historyData.recipients.length}`));for(const r of matches){const row=el('article','history-recipient'),who=el('div');who.append(el('strong','',r.name||'بدون اسم'),el('span','phone','+'+r.phone));if(r.conversation_available){const link=el('a','row-action','فتح المحادثة');link.href='/index.html?'+new URLSearchParams({session:r.phone,campaign:historyData.campaign.id});who.append(link);}const state=el('div');state.append(badge(r.status||r.delivery_status||r.queue_state||r.state),el('small','status-date',date(r.status_at)));if(r.failure_reason||r.reason)state.append(el('small','bad',errors[r.failure_reason||r.reason]||r.failure_reason||r.reason));row.append(who,state);list.append(row);}
      if(page){const nav=el('div','footer-actions');for(const [label,delta,disabled] of [['السابق',-50,page.offset===0],['التالي',50,!page.hasMore]]){const b=el('button','',label);b.disabled=disabled;b.addEventListener('click',safe(async()=>{historyRecipientOffset=Math.max(0,historyRecipientOffset+delta);await historyDetail(historyId);}));nav.append(b);}list.append(nav);}
    }
    doc.querySelectorAll('[data-source]').forEach(b=>b.addEventListener('click',()=>sourceMode(b.dataset.source)));
    $('addManual').addEventListener('click',safe(async()=>{const numbers=$('manualNumbers').value.split(/[\n;,،]+/).map(x=>x.trim()).filter(Boolean);if(!numbers.length)throw Error('اكتب رقمًا واحدًا على الأقل.');await addRaw(numbers.map(phone=>({phone})),['يدوي']);}));
    $('recipientFile').addEventListener('change',safe(async()=>{const file=$('recipientFile').files[0];if(!file)return;if(file.size>2*1024*1024)throw Error('الحد الأقصى للملف 2 MB.');const form=new win.FormData();form.append('file',file);imported=await api('/whatsapp/campaigns/import',{method:'POST',body:form});
      for(const id of ['phoneColumn','nameColumn']){$(id).replaceChildren();if(id==='nameColumn'){const o=el('option','','بدون اسم');o.value='';$(id).append(o);}imported.headers.forEach(h=>{const o=el('option','',h);o.value=h;$(id).append(o);});}
      $('importCount').textContent=`${imported.total} صفوف — اختر الأعمدة قبل الإضافة.`;$('importMapping').hidden=false;
    }));
    $('addImport').addEventListener('click',safe(()=>addRaw(imported.rows.map(r=>({phone:r[$('phoneColumn').value],name:r[$('nameColumn').value]||'',columns:r})),['Excel / CSV'])));
    $('addLabels').addEventListener('click',safe(loadLabelMembers));$('recipientSearch').addEventListener('input',()=>{currentPage=0;win.clearTimeout(directoryTimer);if(directoryView()){directoryEpoch++;directoryBusy=false;directoryTimer=win.setTimeout(()=>safe(loadDirectory)(),250);}else renderRows();});$('recipientView').addEventListener('change',safe(async()=>{currentPage=0;await loadDirectory();renderRows();}));
    $('recipientPrev').addEventListener('click',safe(async()=>{currentPage=Math.max(0,currentPage-1);await loadDirectory();renderRows();}));$('recipientNext').addEventListener('click',safe(async()=>{currentPage++;await loadDirectory();renderRows();}));
    $('selectAll').addEventListener('click',safe(()=>selectDirectory(true,true)));$('selectNone').addEventListener('click',safe(()=>selectDirectory(false,true)));
    $('selectEveryPage').addEventListener('click',safe(()=>selectDirectory(true,false)));$('clearEveryPage').addEventListener('click',()=>{directoryEpoch++;directoryBusy=false;for(const r of rows.values())r.selected=false;renderRows();});
    $('bulkGrantConsent').addEventListener('click',()=>openBulkConsent('granted'));$('bulkWithdrawConsent').addEventListener('click',()=>openBulkConsent('withdrawn'));
    $('saveConsent').addEventListener('click',safe(async()=>{
      if(consentBusy)return;const target=consentTarget,bulk=typeof target==='object';if(bulk&&!$('consentBatchReviewed').checked)throw Error('راجع عدد المحددين ومرجع الموافقة ثم فعّل خانة التأكيد.');
      const body={status:bulk?target.status:$('consentStatus').value,categories:[...doc.querySelectorAll('[name=consentCategory]:checked')].map(x=>x.value),evidence:$('consentEvidence').value};
      if(!body.categories.length||body.evidence.trim().length<5)throw Error('اختر النطاق وسجّل مرجعًا فعليًا لا يقل عن 5 أحرف.');
      const b=$('saveConsent');consentBusy=true;b.disabled=true;counts();try{
        if(bulk){const result=await api('/whatsapp/campaigns/permissions/bulk',{method:'POST',body:{...body,phones:target.phones}});for(const p of result.permissions||[]){const r=rows.get(p.phone);if(r)r.permission=p;}setNotice(`تم تحديث ${result.updated} من ${result.total} عميل. ${target.status==='granted'?`بقي ${result.skippedWithdrawn} منسحبًا سابقًا دون إعادة اشتراك.`:'تم استبعادهم من الحملات دون حذف بياناتهم.'} لم تُرسل أي رسالة.`);}
        else{await api('/whatsapp/campaigns/permissions',{method:'POST',body:{...body,phone:target}});const r=await api('/whatsapp/campaigns/resolve',{method:'POST',body:{rows:[{phone:target}]}});if(rows.has(target))rows.get(target).permission=r.rows[0].permission;}
        $('consentDialog').close();renderRows();if(step===3)reviewLocal();
      }finally{consentBusy=false;b.disabled=false;counts();}
    }));
    $('templateSearch').addEventListener('input',renderTemplates);$('previewRecipient').addEventListener('change',updatePreview);
    $('nextStep').addEventListener('click',safe(async()=>{if(loading||directoryBusy)return;if(step===1){if(!selected().length)return;const signature=selected().map(r=>r.phone).sort().join(',');loading=true;counts();try{await hydrateSelected();if(!templates.length){const d=await api('/whatsapp/template-catalog');templates=d.templates.filter(t=>t.status==='APPROVED');renderTemplates();}if(signature!==selected().map(r=>r.phone).sort().join(','))throw Error('تغيّر اختيار المستلمين. راجع القائمة مجددًا.');go(2);}finally{loading=false;if(step===1)counts();}}else{selected().forEach(r=>valuesFor(r));go(3);}}));
    $('previousStep').addEventListener('click',()=>{if(!lockedBody)go(Math.max(1,step-1));});$('prepareReview').addEventListener('click',safe(prepare));
    $('reviewPreviewRecipient').addEventListener('change',updateReviewPreview);$('revalidateReview').addEventListener('click',safe(()=>reviseReview()));
    $('reviewAcknowledgement').addEventListener('change',()=>{$('confirmSend').disabled=!$('reviewAcknowledgement').checked||!draft?.eligible||confirmAttempted||loading||reviewUncertain;});
    $('confirmSend').addEventListener('click',safe(async()=>{
      if(!draft||confirmAttempted||$('confirmSend').disabled)return;confirmAttempted=true;$('confirmSend').disabled=true;
      try{await api(`/whatsapp/campaigns/${draft.campaign.id}/confirm`,{method:'POST',body:{reviewToken:draft.reviewToken}});setNotice('تم تأكيد العملية. تابع حالة كل مستلم من السجل؛ لا تعِد إنشاء العملية نفسها.');await showHistory();await historyDetail(draft.campaign.id);}
      catch(e){setNotice('تعذر تأكيد نتيجة الطلب. لم تتم إعادة المحاولة. افتح سجل الإرسال للتحقق من العملية قبل أي إجراء.');}
    }));
    function allCampaigns(){historyId=null;historyData=null;historyEpoch++;$('historyDetail').replaceChildren();return showHistory();}
    $('historyTab').addEventListener('click',safe(allCampaigns));$('historyBack').addEventListener('click',safe(allCampaigns));$('refreshHistory').addEventListener('click',safe(async()=>{await showHistory();if(historyId)await historyDetail(historyId);}));
    $('historyPrev').addEventListener('click',safe(async()=>{historyPage=Math.max(0,historyPage-1);await showHistory();}));$('historyNext').addEventListener('click',safe(async()=>{historyPage++;await showHistory();}));
    $('newTab').addEventListener('click',()=>{win.clearInterval(historyTimer);historyTimer=null;$('wizard').hidden=false;$('history').hidden=true;$('newTab').classList.add('nav-active');$('historyTab').classList.remove('nav-active');win.history.replaceState(null,'','#');});
    $('startAnother').addEventListener('click',()=>{if(win.confirm('بدء عملية جديدة؟ تظل المراجعة السابقة وسجلها محفوظين على الخادم.'))win.location.href='templates.html';});
    win.addEventListener('storage',event=>{if(event.key==='dashboard_token'){win.clearInterval(historyTimer);historyTimer=null;rows.clear();imported=null;draft=null;lockedBody=null;mapping.clear();$('wizard').hidden=true;$('history').hidden=true;$('consentDialog').close();for(const id of ['recipientRows','reviewRows','historyList','historyDetail','templatePreview','reviewPreview'])$(id).replaceChildren();$('manualNumbers').value='';doc.querySelectorAll('button').forEach(b=>b.disabled=true);setNotice('تغيّرت جلسة الحساب. أعد فتح الصفحة بعد تسجيل الدخول؛ لم تتم إعادة أي عملية إرسال.');}});
    let role='';try{role=JSON.parse(win.atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role;}catch{}
    if(role!=='admin'){$('wizard').hidden=true;$('history').hidden=true;setNotice('هذه الميزة متاحة للأدمن فقط. سجّل الدخول من المحادثات بحساب مخوّل.');return;}
    renderRows();safe(loadLabels)();if(win.location.hash==='#history')safe(showHistory)();
  }
  return {addRecipient,filtered,mount};
});
