(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MehrabTemplateCatalog=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function mediaPreview(doc,format,url){
    let u;try{u=new URL(url);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)))return null;}catch{return null;}
    if(u.username||u.password)return null;
    const tag=format==='IMAGE'?'img':format==='VIDEO'?'video':'a',node=doc.createElement(tag);
    node.className='template-header-media';node.style.cssText='display:block;max-width:100%;max-height:240px;border-radius:12px;margin:8px auto;object-fit:contain';
    if(tag==='a'){node.href=u.href;node.target='_blank';node.rel='noopener noreferrer';node.textContent='📄 عرض مستند القالب';}
    else{node.src=u.href;if(tag==='img'){node.alt='صورة عنوان القالب';node.referrerPolicy='no-referrer';}else{node.controls=true;node.preload='metadata';node.playsInline=true;}}
    return node;
  }
  // One chooser for conversation sending and campaigns. It never sends messages.
  function mediaField({doc,template,field,request,onChange}){
    const root=doc.createElement('div'),note=doc.createElement('p'),preview=doc.createElement('div'),button=doc.createElement('button'),file=doc.createElement('input');
    const index=Number(/^components\[(\d+)\]/.exec(field.key)?.[1]),format=template.components[index]?.format;
    const base=`/whatsapp/template-media/${encodeURIComponent(template.id)}/${encodeURIComponent(template.language)}`;
    const accepts={IMAGE:'image/jpeg,image/png',VIDEO:'video/mp4',DOCUMENT:'application/pdf'};
    root.className='template-media-chooser';root.setAttribute('data-media-field',field.key);note.setAttribute('role','status');note.textContent='جاري تحميل الميديا الافتراضية…';
    button.type='button';button.textContent='رفع '+({IMAGE:'صورة',VIDEO:'فيديو',DOCUMENT:'مستند PDF'}[format]||'ملف')+' / تغيير الميديا';
    file.type='file';file.accept=accepts[format]||'';file.hidden=true;file.setAttribute('aria-label','ميديا عنوان القالب');
    root.append(preview,button,file,note);let version=0;
    const alive=n=>n===version&&root.isConnected;
    const busy=v=>{root.dataset.mediaBusy=String(v);button.disabled=v;};
    function apply(data){
      if(!data?.media)return false;
      const origin=new URL(request.origin),url=new URL(data.media.url,origin);
      if(url.origin!==origin.origin||!/^\/uploads\/template-headers\/[a-f0-9-]{36}$/.test(url.pathname)||url.search||url.hash||data.media.format!==format)throw Error('INVALID_MEDIA_RESPONSE');
      const node=mediaPreview(doc,format,url.href);preview.replaceChildren(...(node?[node]:[]));busy(false);onChange(url.href);
      note.textContent='ميديا محفوظة افتراضيًا لهذا القالب واللغة. تغييرها لا يغيّر الرسائل الموجودة في الطابور.';return true;
    }
    async function load(){const n=++version;busy(true);try{
      let data=await request(base);if(!alive(n))return;
      if(!data.media&&data.sampleAvailable){note.textContent='جاري حفظ نسخة من عينة Meta…';data=await request(base+'/meta-sample',{method:'POST',body:{revision:template.revision}});if(!alive(n))return;}
      if(!apply(data))note.textContent='لا توجد عينة Meta قابلة للاستخدام. ارفع الملف من الجهاز لحفظه افتراضيًا.';
    }catch{if(alive(n))note.textContent='تعذر استرجاع العينة أو الميديا المحفوظة. يمكنك رفع ملف؛ تغيير الافتراضي يحتاج صلاحية أدمن.';}finally{if(alive(n))busy(false);}}
    // Keep the native picker invocation synchronous within the actual gesture.
    button.addEventListener('click',()=>{if(!button.disabled){file.value='';file.click();}});
    file.addEventListener('change',async()=>{const chosen=file.files?.[0];if(!chosen)return;
      const limit={IMAGE:5,VIDEO:16,DOCUMENT:16}[format],max=limit*1024*1024;
      if(!chosen.size||chosen.size>max){note.textContent=`الحد الأقصى لهذا الملف ${limit} MB.`;return;}
      const n=++version;busy(true);note.textContent='جاري حفظ الميديا…';
      try{const form=new doc.defaultView.FormData();form.append('revision',template.revision);form.append('file',chosen);const data=await request(base,{method:'POST',body:form});if(alive(n))apply(data);}
      catch{if(alive(n))note.textContent='تعذر حفظ الملف. لم تُرسل رسالة ولم يتغير الملف المختار سابقًا. راجع الصلاحيات ونوع الملف.';}
      finally{if(alive(n))busy(false);}
    });
    queueMicrotask(load);return root;
  }
  function interpolate(text,path,field,values){
    return String(text||'').replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*|\d+)\s*\}\}/g,
      (original,name)=>values.get(`${path}.${field}:${name}`)||original);
  }
  function previewLines(template,values=new Map()){
    const lines=[];
    function visit(c,path){
      if(c.text)lines.push(interpolate(c.text,path,'text',values));
      if(c.url)lines.push(interpolate(c.url,path,'url',values));
      if(c.phone_number)lines.push(c.phone_number);
      if(c.format&&c.format!=='TEXT')lines.push(`[${c.format}]`);
      for(const key of ['buttons','cards','components'])(c[key]||[]).forEach((item,i)=>visit(item,`${path}.${key}[${i}]`));
    }
    (template.components||[]).forEach((c,i)=>visit(c,`components[${i}]`));
    return lines.join('\n\n');
  }
  function create({overlay,apiBase,getAuthHeaders,handleInvalidToken,getGeneration,readQueue,onQueued=()=>{},fetchImpl=window.fetch.bind(window)}){
    const doc=overlay.ownerDocument;
    const list=overlay.querySelector('[data-catalog-list]');
    const status=overlay.querySelector('[data-catalog-status]');
    const detail=overlay.querySelector('[data-catalog-detail]');
    const search=overlay.querySelector('[data-catalog-search]');
    let records=[],controller=null,epoch=0,opener=null,session=null,nativeFacade=null,dynamicEnabled=false;
    const uncertain=new Map(),busySessions=new Set();
    const el=(tag,className,text)=>{const node=doc.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
    function choose(template){
      detail.replaceChildren();
      detail.append(el('h3','',template.name),el('p','template-catalog-meta',`${template.language} · ${template.category} · ${template.status} · ${template.parameterFormat||'POSITIONAL'}`));
      const values=new Map(),preview=el('div','template-catalog-preview'),targetSession=session,targetEpoch=epoch;
      preview.dir='auto';preview.setAttribute('data-catalog-preview','');
      const update=()=>{preview.textContent=previewLines(template,values);template.components.forEach((c,i)=>{if(c.type==='HEADER'&&['IMAGE','VIDEO','DOCUMENT'].includes(c.format)){const node=mediaPreview(doc,c.format,values.get(`components[${i}].media`));if(node)preview.prepend(node);}});};
      update();detail.append(preview);
      const fields=template.sendSchema?.fields||(template.variables||[]).map(v=>({...v,label:`${v.componentType} — {{${v.name}}}`,required:true}));
      for(const variable of fields){
        if(variable.type==='media'){
          const request=async(path,options={})=>{const multipart=options.body instanceof doc.defaultView.FormData;
            const r=await fetchImpl(apiBase+path,{method:options.method||'GET',headers:getAuthHeaders(options.body&&!multipart?{'Content-Type':'application/json'}:{}),body:multipart?options.body:options.body?JSON.stringify(options.body):undefined,cache:'no-store',signal:AbortSignal.timeout(90000)});
            if(handleInvalidToken(r)||!r.ok)throw Error('TEMPLATE_MEDIA_UNAVAILABLE');return r.json();};
          request.origin=new URL(apiBase,doc.defaultView.location.href).origin;
          detail.append(mediaField({doc,template,field:variable,request,onChange:url=>{values.set(variable.key,url);update();}}));continue;
        }
        const sections={HEADER:'العنوان',BODY:'نص الرسالة',FOOTER:'التذييل',URL:'رابط الزر'};
        const label=el('label','template-catalog-variable',variable.label||`${sections[variable.componentType]||variable.path} — {{${variable.name}}}`);
        const input=el('input');input.type='text';input.dir='auto';input.maxLength=4096;input.required=variable.required!==false;
        input.autocomplete='off';input.setAttribute('aria-label',label.textContent);
        input.addEventListener('input',()=>{values.set(variable.key,input.value);update();});
        label.append(input);detail.append(label);
      }
      if(!(template.variables||[]).length)detail.append(el('p','template-catalog-meta','هذا القالب لا يحتاج متغيرات نصية.'));
      for(const requirement of template.requirements||[])if(!['IMAGE','VIDEO','DOCUMENT'].includes(requirement.type))detail.append(el('p','template-catalog-note',`مكوّن مطلوب: ${requirement.type}`));
      if(template.warnings?.length)detail.append(el('p','template-catalog-note','القالب يحتوي على مكونات متقدمة؛ المعاينة هنا نصية فقط.'));
      const enabled=dynamicEnabled&&template.sendSchema?.supported===true&&typeof getGeneration==='function';
      if(!enabled)detail.append(el('p','template-catalog-note',template.sendSchema?.unsupported?.length?'هذا النوع يحتاج تكاملًا إضافيًا ولا يمكن إرساله بأمان حاليًا.':'معاينة فقط — الإرسال الديناميكي غير مفعّل.'));
      else {
        const send=el('button','template-catalog-item','تأكيد إرسال القالب لهذه المحادثة');send.type='button';
        const feedback=el('p','template-catalog-note');feedback.setAttribute('role','status');
        const check=el('button','template-catalog-item','التحقق من حالة الطلب دون إعادة الإرسال');check.type='button';
        check.hidden=!uncertain.has(targetSession);send.disabled=uncertain.has(targetSession)||busySessions.has(targetSession);
        const alive=()=>targetEpoch===epoch&&session===targetSession&&!overlay.classList.contains('hidden');
        check.addEventListener('click',async()=>{
          const op=uncertain.get(targetSession);if(!op||!readQueue)return;check.disabled=true;
          try{const rows=(await readQueue(targetSession)).items.filter(x=>x.request_id===op.id);
            if(!alive())return;
            if(rows.length){
              feedback.textContent=rows.some(x=>x.state==='unknown')?'نتيجة الإرسال غير مؤكدة في الطابور؛ راجعها ولا تُعد الإرسال.':'الطلب مسجل في الطابور؛ لا تُعد الإرسال.';
              onQueued(targetSession);
              if(!rows.some(x=>x.state==='unknown')){uncertain.delete(targetSession);check.hidden=true;}
            }
            else feedback.textContent='لم يتأكد تسجيل الطلب بعد. لا تُعد الإرسال قبل مراجعة الطابور.';
          }catch{if(alive())feedback.textContent='تعذر التحقق. لم تتم إعادة الإرسال.';}finally{if(alive())check.disabled=false;}
        });
        send.addEventListener('click',async()=>{
          if(send.disabled||uncertain.has(targetSession)||busySessions.has(targetSession)||!alive())return;
          if(detail.querySelector('[data-media-busy="true"]')||fields.some(f=>f.type==='media'&&f.required&&!values.get(f.key))){feedback.textContent='انتظر حفظ ميديا العنوان أو اختر ملفًا صالحًا أولًا.';return;}
          if([...detail.querySelectorAll('input')].some(input=>!input.reportValidity()))return;
          send.disabled=true;busySessions.add(targetSession);
          const id=doc.defaultView.crypto.randomUUID();let attempted=false;
          try{
            const generation=await getGeneration(targetSession);
            if(!alive())return;
            if(!Number.isSafeInteger(generation)||generation<0)throw Error('QUEUE_NOT_READY');
            uncertain.set(targetSession,{id});attempted=true;
            const response=await fetchImpl(`${apiBase}/whatsapp/template-send`,{method:'POST',
              headers:getAuthHeaders({'Content-Type':'application/json','Idempotency-Key':id,'X-Send-Queue-Generation':String(generation)}),
              body:JSON.stringify({sessionId:targetSession,templateId:template.id,language:template.language,revision:template.revision,values:Object.fromEntries(values)}),signal:AbortSignal.timeout(60000)});
            if(response.status>=400&&response.status<500){uncertain.delete(targetSession);attempted=false;throw Error('REJECTED');}
            const result=await response.json();
            if(!response.ok||result.durable!==true||!result.jobId)throw Error('UNKNOWN');
            uncertain.delete(targetSession);onQueued(targetSession);
            if(alive())feedback.textContent='تم تسجيل الطلب في الطابور. القبول لا يعني التسليم للعميل.';
          }catch{
            if(alive()){
              feedback.textContent=attempted?'تعذر تأكيد قبول الطلب. لم تتم إعادة الإرسال؛ تحقق من حالة الطابور.':'تعذر تجهيز الطلب أو رُفض التحقق من القالب والمتغيرات. حدّث الكتالوج وراجع القيم.';
              check.hidden=!attempted;send.disabled=attempted;
            }
          }finally{busySessions.delete(targetSession);}
        });
        if(uncertain.has(targetSession))feedback.textContent='توجد عملية غير مؤكدة لهذه المحادثة؛ تحقق منها دون إعادة إرسال.';
        detail.append(send,check,feedback);
      }
      detail.hidden=false;
    }
    function render(){
      const q=search.value.trim().toLocaleLowerCase();
      const matches=records.filter(t=>`${t.name} ${t.language} ${t.category}`.toLocaleLowerCase().includes(q));
      list.replaceChildren();
      for(const template of matches){
        const button=el('button','template-catalog-item',`${template.name} — ${template.language} — ${template.category}`);
        button.type='button';button.dir='auto';button.addEventListener('click',()=>choose(template));list.append(button);
      }
      if(!matches.length)list.append(el('p','template-catalog-meta','لا توجد قوالب مطابقة.'));
    }
    async function load(){
      controller?.abort();controller=new AbortController();const current=++epoch;
      status.textContent='جاري جلب القوالب المعتمدة من Meta…';records=[];list.replaceChildren();detail.replaceChildren();detail.hidden=true;
      try{
        const response=await fetchImpl(`${apiBase}/whatsapp/template-catalog`,{method:'GET',headers:getAuthHeaders(),cache:'no-store',signal:controller.signal});
        if(current!==epoch||overlay.classList.contains('hidden'))return;
        if(handleInvalidToken(response)){close();return;}
        const data=await response.json();
        if(current!==epoch||overlay.classList.contains('hidden'))return;
        if(!response.ok)throw Error();
        if(!Array.isArray(data.templates)||data.templates.some(t=>t.status!=='APPROVED'))throw Error();
        dynamicEnabled=data.dynamicSendingEnabled===true;records=data.templates;render();status.textContent=`${records.length} قالب معتمد — البيانات من Meta عبر n8n`;
      }catch(error){
        if(current!==epoch||error.name==='AbortError')return;
        status.textContent='تعذر تحميل الكتالوج. يمكنك إعادة المحاولة؛ التيمبليتان السريعتان ما زالتا تعملان.';
      }
    }
    function close(){
      epoch++;controller?.abort();controller=null;records=[];list.replaceChildren();detail.replaceChildren();
      overlay.classList.add('hidden');search.value='';opener?.focus?.({preventScroll:true});opener=null;session=null;
    }
    async function open(channel,sessionId){
      if(channel!=='whatsapp')return false;
      installNativeBack();
      session=sessionId;
      opener=doc.activeElement;search.value='';overlay.classList.remove('hidden');
      overlay.querySelector('[data-catalog-close]').focus({preventScroll:true});await load();return true;
    }
    function installNativeBack(){
      const win=doc.defaultView,adapter=win?.AlMehrabAndroidAdapter,host=win?.AlMehrabHost;
      if(!adapter||adapter===nativeFacade||typeof adapter.back!=='function'||typeof host?.postMessage!=='function'||
        win.top!==win||win.location.origin!=='https://wadashboard.almehrab.org')return;
      // Existing APK adapters are frozen and predate this modal. Preserve every
      // method/flag; consume ONLY this new visible layer, never alter history.
      nativeFacade=Object.freeze({...adapter,back(id){
        if(!overlay.classList.contains('hidden')){
          close();host.postMessage(JSON.stringify({action:'back_result',id,status:'handled'}));return true;
        }
        return adapter.back.call(adapter,id);
      }});
      win.AlMehrabAndroidAdapter=nativeFacade;
    }
    overlay.querySelector('[data-catalog-close]').addEventListener('click',close);
    overlay.querySelector('[data-catalog-refresh]').addEventListener('click',load);
    overlay.addEventListener('click',event=>{event.stopPropagation();if(event.target===overlay)close();});
    overlay.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.stopPropagation();close();}
      if(event.key==='Tab'){
        const focusable=[...overlay.querySelectorAll('button,input')].filter(node=>!node.disabled&&node.getClientRects().length);
        const first=focusable[0],last=focusable[focusable.length-1];
        if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    search.addEventListener('input',render);
    function syncContext(sessionId,channel){if(!overlay.classList.contains('hidden')&&(session!==sessionId||channel!=='whatsapp'))close();}
    return {open,close,syncContext};
  }
  return {create,previewLines,interpolate,mediaField,mediaPreview};
});
