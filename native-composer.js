/* Shared composer adapter v1. Browser/PWA keeps its existing textarea; no APIs or sending here. */
(function (root) {
  'use strict';
  class NativeComposer {
    constructor({host, input, context, notify = () => {}, onState = () => {}, timeout = 4000}) {
      this.host=host;this.input=input;this.context=context;this.notify=notify;this.timeout=timeout;
      this.active=false;this.epoch=null;this.sequence=0;this.pending=new Map();this.serial=Promise.resolve();
      this.binding=null;this.signature='';this.caption=null;this.failed=false;
      this.claimed=new Map();
      this.bindVersion=0;this.pendingBind=null;this.initialOwner=null;
      this.originalReadOnly=input.readOnly;
      this.documentVersion=0;
      this.state='negotiating';this.onState=onState;this.ownershipMayHaveMoved=false;this.reconnecting=null;
      host.onmessage=event=>{
        let response;try{response=JSON.parse(event.data);}catch(_){return;}
        const task=this.pending.get(response.id);if(!task)return;
        if(task.action!=='hello'&&response.epoch!==this.epoch){this.disconnect();return;}
        clearTimeout(task.timer);this.pending.delete(response.id);
        response.ok ? task.resolve(response) : task.reject(Error('NATIVE_COMPOSER_REJECTED'));
      };
    }
    queue(work) {
      if(this.state!=='ready')return Promise.reject(Error('COMPOSER_NOT_CONNECTED'));
      const version=this.documentVersion;
      const next=this.serial.then(()=>{if(version!==this.documentVersion||this.state!=='ready')throw Error('COMPOSER_DOCUMENT_CHANGED');return work();});
      this.serial=next.catch(()=>{});return next;
    }
    rpc(action,extra={}) {
      const request={v:1,action,id:root.crypto.randomUUID(),seq:++this.sequence,epoch:this.epoch||'',...extra};
      const raw=JSON.stringify(request);
      return new Promise((resolve,reject)=>{
        const task={action,resolve,reject,timer:null};
        const fail=()=>{
          clearTimeout(task.timer);this.pending.delete(request.id);reject(Error('NATIVE_COMPOSER_UNCONFIRMED'));
          if(this.ownershipMayHaveMoved)this.disconnect();
        };
        // Never replay an unacknowledged insertion, consume, snapshot or bind automatically.
        task.timer=setTimeout(fail,this.timeout);this.pending.set(request.id,task);
        try {this.host.postMessage(raw);}catch(_){fail();}
      });
    }
    async start() {
      this.setState('connecting');
      try {
      const response=await this.rpc('hello');if(response.version!==1||typeof response.epoch!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(response.epoch))throw Error('NATIVE_COMPOSER_VERSION');
      this.epoch=response.epoch;
      await this.bind(this.desired(),true);
      this.setState('ready');
      return this;
      } catch(error) {
        if(!this.ownershipMayHaveMoved)this.fallback();else this.disconnect();
        throw error;
      }
    }
    reconnect() {
      if(this.reconnecting)return this.reconnecting;
      // A BFCache restore may reuse JS while Android has advanced its document epoch.
      // Cancel old acknowledgements; never replay a send or rehydrate the native draft.
      this.documentVersion++;
      for(const task of this.pending.values()){clearTimeout(task.timer);task.reject(Error('COMPOSER_DOCUMENT_CHANGED'));}
      this.pending.clear();this.bindVersion++;this.pendingBind=null;this.signature='';this.serial=Promise.resolve();
      // Keep claimed revisions: a lost consume ACK must never permit another submission.
      const work=this.start();this.reconnecting=work;
      work.then(()=>{this.reconnecting=null;},()=>{this.reconnecting=null;});return work;
    }
    setState(state) {if(this.state===state)return;this.state=state;this.onState(state);}
    cancelPending() {
      this.documentVersion++;
      for(const task of this.pending.values()){clearTimeout(task.timer);task.reject(Error('COMPOSER_NOT_CONNECTED'));}
      this.pending.clear();this.bindVersion++;this.pendingBind=null;
    }
    fallback() {
      if(this.ownershipMayHaveMoved)throw Error('UNSAFE_COMPOSER_FALLBACK');
      this.cancelPending();this.active=false;this.input.readOnly=this.originalReadOnly;
      if(root.document)delete root.document.documentElement.dataset.nativeComposer;
      this.setState('fallback');
    }
    disconnect() {
      if(this.state==='disconnected'||this.state==='fallback')return;
      this.cancelPending();this.signature='';
      // Native may own newer text even when its first bind acknowledgement was lost.
      if(root.document&&this.ownershipMayHaveMoved)root.document.documentElement.dataset.nativeComposer='1';
      this.setState('disconnected');
    }
    desired() {
      const base=this.context();
      if(this.caption&&this.caption.account===base.account&&this.caption.session===base.session)
        return {...base,editor:this.caption.editor,initial:this.caption.initial,visible:base.visible,enabled:base.enabled};
      return {...base,editor:'main',initial:''};
    }
    key(ctx) {return JSON.stringify([ctx.account,ctx.session,ctx.editor]);}
    // Context/visibility changes must not wait behind an outstanding snapshot ACK.
    sync() {if(this.state!=='ready')return Promise.resolve();return this.bind(this.desired());}
    async bind(ctx,activating=false) {
      if(this.state!=='ready'&&!(activating&&this.state==='connecting'))throw Error('COMPOSER_NOT_CONNECTED');
      const signature=JSON.stringify(ctx);if(signature===this.signature&&!this.pendingBind)return;
      if(this.pendingBind?.signature===signature)return this.pendingBind.promise;
      const version=++this.bindVersion;
      const first=!this.active;
      if(first&&!this.initialOwner&&ctx.account&&ctx.session)this.initialOwner=this.key(ctx);
      const initial=first&&ctx.editor==='main'&&this.initialOwner===this.key(ctx)?this.input.value:ctx.initial;
      const selection=first?{start:this.input.selectionStart||0,end:this.input.selectionEnd||0}:{start:(ctx.initial||'').length,end:(ctx.initial||'').length};
      if(first)this.input.readOnly=true;
      const work=(async()=>{try {
        this.ownershipMayHaveMoved=true;
        await this.rpc('bind',{...ctx,initial:initial||'',...selection});
        if(version!==this.bindVersion)return;
        if(this.binding&&this.binding.account!==ctx.account)this.claimed.clear();
        this.signature=signature;this.binding=ctx;this.active=true;
        if(first)this.input.value='';
        if(root.document)root.document.documentElement.dataset.nativeComposer='1';
      } finally {if(first&&version===this.bindVersion)this.input.readOnly=this.originalReadOnly;}
      })();
      this.pendingBind={signature,promise:work};
      try{return await work;}finally{if(this.pendingBind?.promise===work)this.pendingBind=null;}
    }
    capture(session) {
      return this.queue(async()=>{
        const ctx=this.desired();if(ctx.session!==session||!ctx.enabled||!ctx.visible)throw Error('COMPOSER_CONTEXT_CHANGED');
        await this.bind(ctx);
        if(this.key(this.desired())!==this.key(ctx))throw Error('COMPOSER_CONTEXT_CHANGED');
        const snapshot=await this.rpc('snapshot',{key:this.key(ctx)});
        if(snapshot.key!==this.key(ctx)||snapshot.snapshotId!==snapshot.id||typeof snapshot.text!=='string'||!Number.isSafeInteger(snapshot.revision)){this.disconnect();throw Error('COMPOSER_SNAPSHOT_INVALID');}
        return {...snapshot,account:ctx.account,session:ctx.session,editor:ctx.editor};
      });
    }
    consume(snapshot) {return this.queue(()=>this.rpc('consume',{snapshotId:snapshot.snapshotId}));}
    claim(snapshot) {
      if(this.state!=='ready')throw Error('COMPOSER_NOT_CONNECTED');
      const key=snapshot.key;
      if(this.claimed.has(key)&&snapshot.revision<=this.claimed.get(key))return false;
      this.claimed.set(key,snapshot.revision);
      return true;
    }
    insert(text) {
      const target=this.key(this.desired());
      return this.queue(async()=>{const ctx=this.desired();if(this.key(ctx)!==target)throw Error('COMPOSER_CONTEXT_CHANGED');await this.bind(ctx);if(this.key(this.desired())!==target||!ctx.enabled||!ctx.visible)throw Error('COMPOSER_NOT_EDITABLE');await this.rpc('insert',{key:this.key(ctx),text:String(text)});});
    }
    focus() {return this.queue(async()=>{const ctx=this.desired();await this.bind(ctx);if(ctx.enabled&&ctx.visible)await this.rpc('focus',{key:this.key(ctx)});});}
    openCaption(session,initial) {
      return this.queue(async()=>{
        const ctx=this.context();if(ctx.session!==session)throw Error('COMPOSER_CONTEXT_CHANGED');
        this.caption={account:ctx.account,session,editor:'caption_'+root.crypto.randomUUID(),initial};
        try{await this.bind(this.desired());}catch(error){if(this.state!=='disconnected')this.caption=null;throw error;}
      });
    }
    closeCaption() {
      const caption=this.caption;this.caption=null;
      return this.queue(async()=>{if(caption)await this.rpc('release',{key:this.key(caption)});await this.bind(this.desired());});
    }
    error() {
      if(this.state==='fallback'||this.state==='disconnected'||this.state==='connecting')return;
      this.notify('تعذّر تأكيد عملية محرر Android. لم تتم إعادة الإرسال تلقائيًا؛ راجع النص وحالة الطابور قبل إعادة المحاولة.');
    }
  }
  if(typeof module!=='undefined')module.exports={NativeComposer};
  root.AlMehrabNativeComposer={release:'native-composer-v2',create:options=>new NativeComposer(options)};
})(typeof window!=='undefined'?window:globalThis);
