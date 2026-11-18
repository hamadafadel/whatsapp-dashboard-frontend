'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {NativeComposer}=require('../native-composer.js');
const app=fs.readFileSync('app.js','utf8');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function simulatedNative(){
 const sent=[],drafts=new Map(),states=[];let drop=null,epoch='doc';let revision=0;
 const host={postMessage(raw){
   const r=JSON.parse(raw);sent.push(r);let reply={id:r.id,epoch,ok:true};
   if(r.action==='hello')reply.version=1;
   if(r.action==='bind'){
     const key=JSON.stringify([r.account,r.session,r.editor]);
     if(!drafts.has(key))drafts.set(key,{text:r.initial,revision:++revision});
     reply.key=key;
   }
   if(r.action==='snapshot'){
     const draft=drafts.get(r.key);reply={...reply,snapshotId:r.id,key:r.key,...draft};
   }
   if(r.action==='insert'){const draft=drafts.get(r.key);draft.text+=r.text;draft.revision=++revision;}
   if(r.action==='consume'){
     const snapshot=sent.find(x=>x.id===r.snapshotId);const draft=drafts.get(snapshot.key);
     // Deliberately keep it uncleared in this fixture: accepted send + lost consume is uncertain.
     reply.cleared=false;
   }
   if(r.action===drop)return;
   queueMicrotask(()=>host.onmessage({data:JSON.stringify(reply)}));
 }};
 const input={value:'عربي\n\nHello 🌹',readOnly:false,selectionStart:0,selectionEnd:0};
 const ctx={account:'TEST',session:'fb:TEST',visible:true,enabled:true};
 const editor=new NativeComposer({host,input,context:()=>({...ctx}),timeout:10,onState:s=>states.push(s)});
 const key=()=>JSON.stringify([ctx.account,ctx.session,editor.caption?.editor||'main']);
 return{host,editor,input,sent,drafts,states,ctx,key,set drop(action){drop=action;},set epoch(v){epoch=v;}};
}
test('missing or failing handshake falls back before any native text transfer',async()=>{
 for(const mode of ['throw','timeout','wrong-version']){
   const input={value:'قبل\nالنص 🌹\nبعد',readOnly:false,selectionStart:3,selectionEnd:7};const sent=[],states=[];
   const host={postMessage(raw){const r=JSON.parse(raw);sent.push(r);if(mode==='throw')throw Error('offline');if(mode==='wrong-version')queueMicrotask(()=>host.onmessage({data:JSON.stringify({id:r.id,ok:true,version:99,epoch:'doc'})}));}};
   const c=new NativeComposer({host,input,context:()=>({account:'TEST',session:'A'}),timeout:5,onState:s=>states.push(s)});
   await assert.rejects(c.start());assert.equal(c.state,'fallback');assert.equal(c.active,false);assert.equal(input.value,'قبل\nالنص 🌹\nبعد');assert.equal(input.readOnly,false);assert.equal(input.selectionStart,3);assert.equal(input.selectionEnd,7);
   assert.deepEqual(sent.map(x=>x.action),['hello']);assert.equal(c.ownershipMayHaveMoved,false);assert.ok(states.includes('fallback'));
 }
});
function bootstrap(host,{old=false,contract=true}={}){
 let observed=0;
 const nodes=new Map();function node(){return{hidden:true,disabled:false,textContent:'',events:{},addEventListener(k,fn){this.events[k]=fn;}};}
 const input={value:'web draft',readOnly:false,selectionStart:0,selectionEnd:0,focus(){},setRangeText(text,start,end){this.value=this.value.slice(0,start)+text+this.value.slice(end);},dispatchEvent(){}};
 const context={dashboardNativeComposer:null,messageInputEl:input,authToken:'TEST',activeSessionId:'fb:TEST',decodeAuthToken:()=>({username:'TEST'}),loginScreenEl:{classList:{contains:()=>true}},appEl:{classList:{contains:()=>true}},chatComposeEl:{closest:()=>null,classList:{contains:()=>false}},sendBtnEl:{disabled:false},isRecordingAudio:false,alert(){},Event:class{},closeSavedReplies(){},console,
   document:{documentElement:{dataset:{}},body:{},visibilityState:'visible',getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},addEventListener(){}},
   window:{innerWidth:390,AlMehrabNativeComposer:{release:contract?'native-composer-v2':'OLD',create:options=>new NativeComposer({...options,timeout:5})},addEventListener(){}},
   MutationObserver:class{observe(){observed++;}},nativeComposerTextAdmissions:new Set(),};
 if(old)context.window.AlMehrabHost={};else if(host)context.window.AlMehrabComposerHost=host;
 vm.createContext(context);vm.runInContext(app.slice(app.indexOf('// Opt-in only when BOTH')),context);
 return{context,input,nodes,get observed(){return observed;}};
}
test('real application bootstrap leaves PWA, old APK and mismatched frontend on textarea',async()=>{
 for(const options of [{},{old:true},{contract:false}]){
   const f=bootstrap(options.contract===false?{postMessage(){assert.fail('mismatch must not negotiate');}}:null,options);await settle();
   assert.equal(f.context.dashboardNativeComposer,null);assert.equal(f.input.value,'web draft');assert.equal(f.context.document.documentElement.dataset.nativeComposer,undefined);
 }
});
test('real bootstrap clears adapter on initial failure; browser send, Saved Replies, Emoji and focus all work',async()=>{
 const f=bootstrap({postMessage(){throw Error('unavailable');}});await settle();await settle();
 assert.equal(f.context.dashboardNativeComposer,null);assert.equal(f.nodes.get('nativeComposerConnection').hidden,true);
 const s=f.context;s.messageInputEl.selectionStart=s.messageInputEl.selectionEnd=s.messageInputEl.value.length;
 vm.runInContext(app.slice(app.indexOf('async function insertSavedReplyText('),app.indexOf('function openSavedReplyForm(')),s);
 await s.insertSavedReplyText('\nSaved 🌹');assert.equal(f.input.value,'web draft\nSaved 🌹');
 let handler;s.emojiPickerEl={addEventListener(_,fn){handler=fn;}};
 s.messageInputEl.selectionStart=s.messageInputEl.selectionEnd=f.input.value.length;
 vm.runInContext(app.slice(app.indexOf('emojiPickerEl?.addEventListener("emoji-click"'),app.indexOf('document.addEventListener("click", closeEmojiPicker)')),s);
 handler({detail:{unicode:'👍'}});assert.equal(f.input.value,'web draft\nSaved 🌹👍');
 let focused=0;s.messageInputEl.focus=()=>focused++;
 vm.runInContext(app.slice(app.indexOf('function focusDashboardComposer('),app.indexOf('function syncDashboardNativeComposer(')),s);s.focusDashboardComposer();assert.equal(focused,1);
 s.getActiveChannel=()=> 'messenger';s.getChannelFromSessionId=()=> 'messenger';s.selectedReplyMessage=null;s.resizeMessageInput=()=>{};s.clearSelectedReply=()=>{};s.appendOptimisticTextMessage=()=>({});
 const submissions=[];s.enqueueSessionSend=(sid,kind)=>{submissions.push({sid,kind});return Promise.resolve();};
 vm.runInContext(app.slice(app.indexOf('async function sendMessageFromDashboard('),app.indexOf('async function sendReactionFromDashboard(')),s);
 await s.sendMessageFromDashboard();assert.equal(submissions.length,1);assert.equal(f.input.value,'');
});
test('lost first bind ACK is NOT treated as safe fallback, and reconnect preserves native edits',async()=>{
 const f=simulatedNative();f.drop='bind';await assert.rejects(f.editor.start());assert.equal(f.editor.state,'disconnected');assert.equal(f.editor.ownershipMayHaveMoved,true);assert.equal(f.editor.active,false);
 f.drafts.get(f.key()).text+=' تعديل أصلي';const original=f.drafts.get(f.key()).text;f.drop=null;await f.editor.reconnect();
 assert.equal(f.editor.state,'ready');assert.equal(f.drafts.get(f.key()).text,original);assert.equal(f.input.value,'');assert.equal(f.sent.filter(x=>x.action==='consume').length,0);
});
test('real reconnect UI recovers an uncertain first bind and installs context observers once',async()=>{
 const n=simulatedNative();n.drop='bind';const b=bootstrap(n.host);await new Promise(resolve=>setTimeout(resolve,15));
 assert.equal(b.context.dashboardNativeComposer.state,'disconnected');assert.equal(b.nodes.get('nativeComposerConnection').hidden,false);assert.equal(b.observed,0);
 const key=JSON.stringify(['TEST','fb:TEST','main']);n.drafts.get(key).text+=' Native edit';n.drop=null;
 b.nodes.get('nativeComposerReconnect').events.click();await settle();await settle();
 assert.equal(b.context.dashboardNativeComposer.state,'ready');assert.equal(n.drafts.get(key).text,'web draft Native edit');assert.equal(b.observed,1);assert.equal(b.nodes.get('nativeComposerConnection').hidden,true);
});
test('lost insertion ACK pauses all bridge-dependent actions without replay or text loss',async()=>{
 const f=simulatedNative();await f.editor.start();f.drop='insert';await assert.rejects(f.editor.insert('🙏'));
 const native=f.drafts.get(f.key()).text;assert.equal(f.editor.state,'disconnected');const count=f.sent.length;
 await assert.rejects(f.editor.capture('fb:TEST'));await assert.rejects(f.editor.insert('extra'));await assert.rejects(f.editor.focus());await f.editor.sync();assert.equal(f.sent.length,count);
 f.drop=null;await f.editor.reconnect();assert.equal(f.drafts.get(f.key()).text,native);assert.equal(f.sent.filter(x=>x.action==='insert').length,1);assert.equal(f.editor.state,'ready');assert.equal(f.input.value,'');
});
test('same-document reconnect retains submitted revision fence after lost consume ACK',async()=>{
 const f=simulatedNative();await f.editor.start();const s=await f.editor.capture('fb:TEST');assert.equal(f.editor.claim(s),true);f.drop='consume';await assert.rejects(f.editor.consume(s));
 assert.equal(f.sent.filter(x=>x.action==='consume').length,1);f.drop=null;await f.editor.reconnect();const again=await f.editor.capture('fb:TEST');assert.equal(f.editor.claim(again),false);assert.equal(f.sent.filter(x=>x.action==='consume').length,1);
});
test('epoch change on reconnect cannot erase the submitted revision fence',async()=>{
 const f=simulatedNative();await f.editor.start();const s=await f.editor.capture('fb:TEST');assert.equal(f.editor.claim(s),true);f.editor.disconnect();f.epoch='new-doc';await f.editor.reconnect();assert.equal(f.editor.claim(await f.editor.capture('fb:TEST')),false);
});
test('repeated reconnect clicks negotiate only once and do not replay queued insertion',async()=>{
 const f=simulatedNative();await f.editor.start();let release;f.editor.serial=new Promise(r=>release=r);const old=f.editor.insert('stale');f.editor.disconnect();
 const a=f.editor.reconnect(),b=f.editor.reconnect();assert.strictEqual(a,b);release();await assert.rejects(old);await a;assert.equal(f.sent.filter(x=>x.action==='hello').length,2);assert.equal(f.sent.filter(x=>x.action==='insert').length,0);
});
test('caption remains recoverable on bridge loss; explicit cancellation restores main scope',async()=>{
 const f=simulatedNative();await f.editor.start();await f.editor.openCaption('fb:TEST','caption\n🌹');const captionKey=f.key();f.drafts.get(captionKey).text+=' native edit';f.drop='snapshot';await assert.rejects(f.editor.capture('fb:TEST'));
 f.drop=null;await f.editor.reconnect();assert.equal(f.drafts.get(captionKey).text,'caption\n🌹 native edit');assert.ok(f.editor.caption);
 f.editor.disconnect();await assert.rejects(f.editor.closeCaption());assert.equal(f.editor.caption,null);await f.editor.reconnect();assert.equal(f.sent.at(-1).editor,'main');assert.equal(f.sent.filter(x=>x.action==='release').length,0);
});
test('shared release guard and runtime cache versions are coordinated',()=>{
 const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('app.css','utf8'),sw=fs.readFileSync('service-worker.js','utf8');
 assert.match(html,/native-composer\.js\?v=2/);assert.match(html,/app\.js\?v=91/);assert.match(html,/app\.css\?v=72/);assert.ok(html.indexOf('native-composer.js?v=2')<html.indexOf('app.js?v=91'));
 assert.match(app,/release === 'native-composer-v2'/);assert.match(css,/data-native-composer-state="disconnected"/);assert.match(sw,/mehrab-dashboard-static-v7/);
});
test('service worker never returns a cached native composer, including on network loss',async()=>{
 const source=fs.readFileSync('service-worker.js','utf8');
 for(const fail of [false,true]){
   const handlers={};let options,cacheReads=0,promise;
   const s={URL,Response,self:{addEventListener(k,f){handlers[k]=f;}},caches:{match(){cacheReads++;return Promise.resolve(new Response('OLD'));}},fetch:async(_,opts)=>{options=opts;if(fail)throw Error('offline');return new Response('NEW MODULE');}};
   vm.runInNewContext(source,s);handlers.fetch({request:{method:'GET',url:'https://dashboard.test/native-composer.js?v=2',mode:'cors'},respondWith(p){promise=p;}});
   const response=await promise;assert.equal(options.cache,'no-store');assert.equal(cacheReads,0);assert.equal(response.status,fail?503:200);assert.equal(await response.text(),fail?'Network unavailable':'NEW MODULE');
 }
});
