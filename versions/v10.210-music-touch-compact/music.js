/* V10.210: touch-start/end retries, real WeChat bridge readiness and a compact fallback. */
(()=>{'use strict';
 const section=document.querySelector('#our-story');
 const player=document.querySelector('#wedding-music'),audio=document.querySelector('#wedding-audio');
 if(!section||!player||!audio)return;
 const coverControl=document.querySelector('#cover-music'),coverLabel=coverControl?.querySelector('.cover-music-label');
 const startPrompt=document.querySelector('#music-start-prompt'),promptLabel=startPrompt?.querySelector('.music-start-label');
 const toggle=player.querySelector('.music-toggle'),icon=toggle.querySelector('span');
 const seek=player.querySelector('.music-seek'),elapsed=player.querySelector('.music-elapsed');
 const durationLabel=player.querySelector('.music-duration'),status=player.querySelector('.music-status');
 const options=player.querySelector('.music-options');
 const start=Math.max(0,Number(player.dataset.startSeconds)||0);
 const musicSource=audio.dataset.src;
 let wanted=false,prepared=false,manualPaused=false,initialStarted=false;
 let seeking=false,pendingSeek=start,request=0,resumeAfterHidden=false,gesturePending=false;
 let bridgeAttempted=false;
 const weChatReady=()=>typeof window.WeixinJSBridge?.invoke==='function';
 const length=()=>prepared&&audio.readyState>=1&&Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0;
 const format=value=>{const n=Math.max(0,Math.floor(Number(value)||0));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
 function state(value,message){
  player.dataset.state=value;status.textContent=message;
  const playing=value==='playing';icon.textContent='';
  toggle.setAttribute('aria-pressed',String(playing));
  const action=playing?'暂停音乐':value==='loading'?'取消音乐加载':value==='error'?'重新加载音乐':'播放音乐';
  toggle.setAttribute('aria-label',action+'：我爱你不问归期（合唱版）');
  toggle.setAttribute('title',action);
  toggle.setAttribute('aria-busy',String(value==='loading'));
  if(startPrompt){
   // Keep an already-visible fallback in place during a retry. A touch-start
   // play promise can stay pending; don't hide the user's explicit tap target.
   startPrompt.hidden=!(value==='blocked'||value==='error'||(value==='loading'&&!startPrompt.hidden));
   const label=value==='error'?'重试音乐':'开启音乐';
   if(promptLabel)promptLabel.textContent=label;
   startPrompt.setAttribute('aria-label',label+'：我爱你不问归期（合唱版）');
  }
  if(coverControl){
   coverControl.dataset.state=value;coverControl.setAttribute('aria-pressed',String(playing));
   coverControl.setAttribute('aria-label',action+'：我爱你不问归期（合唱版）');
   coverControl.setAttribute('title',action);coverControl.setAttribute('aria-busy',String(value==='loading'));
   if(coverLabel)coverLabel.textContent=playing?'音乐':value==='loading'?'缓冲中':value==='error'?'重试音乐':value==='blocked'?'开启音乐':'播放音乐';
  }
 }
 function progress(){
  const total=length(),time=pendingSeek!==null?pendingSeek:Number(audio.currentTime)||0;
  if(!seeking)seek.value=String(time);
  elapsed.textContent=format(seeking?seek.value:time);
  if(total){seek.max=String(total);durationLabel.textContent=format(Math.round(total))}
  seek.setAttribute('aria-valuetext',format(seek.value)+' / '+(total?format(Math.round(total)):'04:25'));
  seek.style.setProperty('--progress',Math.max(0,Math.min(100,Number(seek.value)/(total||264.725)*100))+'%');
  seek.disabled=!total;
 }
 function seekTo(value){
  const total=length(),n=Math.max(0,Math.min(Number(value)||0,total?Math.max(0,total-.05):264.675));
  pendingSeek=n;
  if(total){try{audio.currentTime=n;pendingSeek=null}catch(_){}}
  progress();
 }
 function prepare(){
  if(prepared)return true;
  if(document.hidden||!musicSource)return false;
  // load() resets currentTime. Keep the chosen offset (or user seek) across retries.
  if(pendingSeek===null)pendingSeek=Number.isFinite(audio.currentTime)?audio.currentTime:start;
  prepared=true;audio.muted=false;audio.preload='auto';audio.src=musicSource;audio.load();
  return true;
 }
 function interact(){document.dispatchEvent(new Event('wedding-music-interaction'))}
 function stop(){manualPaused=true;wanted=false;resumeAfterHidden=false;gesturePending=false;request++;audio.pause();state('paused','已暂停')}
 function attempt(fromGesture=false){
  if(!wanted||document.hidden)return;
  if(!prepare())return;audio.muted=false;
  if(pendingSeek!==null&&length())seekTo(pendingSeek);
  const id=++request;gesturePending=fromGesture;state('loading','音乐加载中…');
  let result;try{result=audio.play()}catch(error){rejected(error,id);return}
  Promise.resolve(result).then(()=>{
   if(id!==request)return;
   gesturePending=false;
   if(!wanted||document.hidden){audio.pause();return}
   if(!audio.paused)state('playing','正在播放');
  },error=>rejected(error,id));
 }
 function rejected(error,id){
  if(id!==request)return;wanted=false;gesturePending=false;
  if(error?.name==='NotAllowedError')state('blocked','轻点播放，开启音乐');
  else if(error?.name==='AbortError')state('paused','已暂停');
  else state('error','加载失败，点击重试');
 }
 // Try once as soon as the document is ready, independent of picture/animation loading.
 function startOnPage(){
  if(initialStarted||document.hidden||manualPaused)return;
  // A bridge already present is covered by this first attempt, including when
  // the document initially loaded in the background and has only just resumed.
  if(weChatReady())bridgeAttempted=true;
  initialStarted=true;wanted=true;attempt();
 }
 // Readiness is only another opportunity, not a claim of autoplay permission.
 // Listen for the real host bridge; never manufacture events or call unrelated
 // native APIs to evade the browser's gesture policy. At most one host retry.
 function recoverOnWeChatReady(){
  if(bridgeAttempted||!weChatReady()||document.hidden||manualPaused||audio.ended||gesturePending)return;
  if(player.dataset.state==='error'||(!audio.paused&&player.dataset.state==='playing'))return;
  bridgeAttempted=true;initialStarted=true;wanted=true;attempt();
 }
 function startPlayback(event){
  event?.preventDefault?.();event?.stopPropagation?.();interact();
  manualPaused=false;initialStarted=true;
  if(player.dataset.state==='error'){prepared=false;prepare()}
  if(audio.ended)seekTo(start);
  wanted=true;attempt(true);
 }
 function togglePlayback(event){
  if(wanted||!audio.paused){
   event?.preventDefault?.();event?.stopPropagation?.();interact();stop();return;
  }
  startPlayback(event);
 }
 // Call play in the actual trusted handler: some embedded browsers accept the
 // initial contact, others only a completed tap. Neither is universally allowed.
 // Never use a timer/touchmove/scroll loop to retry or prevent native scrolling.
 function recoverInGesture(event={}){
  if(event.isTrusted!==true||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||(event.button!==undefined&&event.button!==0))return;
  const contact=event.type==='touchstart';
  if(contact?event.touches?.length!==1||event.changedTouches?.length>1:event.touches?.length||event.changedTouches?.length>1)return;
  // Capture runs before the control's click handler: exclude the entire control
  // subtree, otherwise one tap can first play and then immediately toggle pause.
  const target=event.target;
  if(target&&(player.contains(target)||coverControl?.contains(target)||startPrompt?.contains(target)||target.closest?.('input,textarea,select,[contenteditable]')))return;
  if(document.hidden||manualPaused||audio.ended||(!audio.paused&&player.dataset.state==='playing'))return;
  // A pending contact attempt must NOT swallow touchend/click: it may be the
  // first event this device grants permission to. End+compatibility click still
  // deduplicate, and a playing song is never restarted by another finger.
  if(gesturePending&&(gesturePending!=='contact'||contact))return;
  if(player.dataset.state==='blocked'||player.dataset.state==='paused'||!initialStarted||(wanted&&player.dataset.state==='loading')){
   initialStarted=true;wanted=true;attempt(contact?'contact':true);
  }
 }
 toggle.addEventListener('click',togglePlayback);
 coverControl?.addEventListener('click',togglePlayback);
 startPrompt?.addEventListener('click',startPlayback);
 seek.addEventListener('input',()=>{interact();seeking=true;seekTo(seek.value)});
 seek.addEventListener('change',()=>{seeking=false;progress()});
 seek.addEventListener('blur',()=>{seeking=false;progress()});
 // The optional progress panel floats above the button; it never stretches the paper.
 options.addEventListener('toggle',()=>{if(options.open)interact()});
 player.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&options.open){options.open=false;options.querySelector('summary').focus();event.preventDefault()}
 });
 document.addEventListener('pointerdown',event=>{
  if(options.open&&!player.contains(event.target))options.open=false;
 },{passive:true});
 for(const type of ['pointerdown','touchstart','keydown'])player.addEventListener(type,interact,{passive:true});
 audio.addEventListener('loadedmetadata',()=>{if(!prepared)return;if(pendingSeek!==null)seekTo(pendingSeek);progress()});
 audio.addEventListener('durationchange',progress);audio.addEventListener('timeupdate',progress);
 audio.addEventListener('playing',()=>{if(!wanted||document.hidden){audio.pause();return}state('playing','正在播放')});
 audio.addEventListener('pause',()=>{if(audio.paused&&player.dataset.state!=='blocked'&&player.dataset.state!=='error')state('paused',document.hidden?'音乐已暂停':'已暂停')});
 audio.addEventListener('waiting',()=>{if(wanted)state('loading','音乐缓冲中…')});
 audio.addEventListener('ended',()=>{wanted=false;resumeAfterHidden=false;state('ended','播放结束，点击重听');progress()});
 audio.addEventListener('error',()=>{if(!prepared)return;request++;wanted=false;gesturePending=false;audio.pause();state('error','加载失败，点击重试')});
 document.addEventListener('touchstart',recoverInGesture,{capture:true,passive:true});
 document.addEventListener('touchend',recoverInGesture,{capture:true,passive:true});
 document.addEventListener('click',recoverInGesture,{capture:true});
 document.addEventListener('WeixinJSBridgeReady',recoverOnWeChatReady);
 function suspend(){
  resumeAfterHidden=wanted&&!manualPaused;gesturePending=false;request++;audio.pause();
 }
 function resume(){
  if(document.hidden)return;
  if(!initialStarted){startOnPage();return}
  if(resumeAfterHidden&&wanted&&!manualPaused){resumeAfterHidden=false;attempt();return}
  recoverOnWeChatReady();
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else resume()});
 window.addEventListener('pagehide',suspend);window.addEventListener('pageshow',resume);
 toggle.disabled=false;if(coverControl)coverControl.disabled=false;
 state('ready','正在准备背景音乐');progress();startOnPage();
})();
