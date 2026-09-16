/* V10.171: compact paper-side control; same photo-ready audio lifecycle. */
(()=>{'use strict';
 const root=document.documentElement,section=document.querySelector('#our-story');
 const player=document.querySelector('#wedding-music'),audio=document.querySelector('#wedding-audio');
 if(!section||!player||!audio)return;
 const art=section.querySelector('.reference-art'),photo=section.querySelector('.camera-photo img');
 const toggle=player.querySelector('.music-toggle'),icon=toggle.querySelector('span');
 const seek=player.querySelector('.music-seek'),elapsed=player.querySelector('.music-elapsed');
 const durationLabel=player.querySelector('.music-duration'),status=player.querySelector('.music-status');
 const options=player.querySelector('.music-options');
 const start=Math.max(0,Number(player.dataset.startSeconds)||0);
 let ready=false,autoConsumed=false,wanted=false,prepared=false,priming=false,primed=false;
 let seeking=false,pendingSeek=start,request=0,resumeAfterHidden=false,observer=null;
 const length=()=>Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0;
 const format=value=>{const n=Math.max(0,Math.floor(Number(value)||0));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
 function state(value,message){
  player.dataset.state=value;status.textContent=message;
  const playing=value==='playing';icon.textContent='';
  toggle.setAttribute('aria-pressed',String(playing));
  const action=playing?'暂停音乐':value==='loading'?'取消音乐加载':value==='error'?'重新加载音乐':'播放音乐';
  toggle.setAttribute('aria-label',action+'：我爱你不问归期（合唱版）');
  toggle.setAttribute('title',action);
  toggle.setAttribute('aria-busy',String(value==='loading'));
 }
 function progress(){
  const total=length(),time=pendingSeek!==null?pendingSeek:Number(audio.currentTime)||0;
  if(!seeking)seek.value=String(time);
  elapsed.textContent=format(seeking?seek.value:time);
  if(total){seek.max=String(total);durationLabel.textContent=format(Math.round(total))}
  seek.setAttribute('aria-valuetext',format(seek.value)+' / '+(total?format(Math.round(total)):'04:25'));
  seek.style.setProperty('--progress',Math.max(0,Math.min(100,Number(seek.value)/(total||264.725)*100))+'%');
  seek.disabled=!ready||!total;
 }
 function seekTo(value){
  const total=length(),n=Math.max(0,Math.min(Number(value)||0,total?Math.max(0,total-.05):264.675));
  pendingSeek=n;
  if(total){try{audio.currentTime=n;pendingSeek=null}catch(_){}}
  progress();
 }
 function prepare(){if(prepared)return;prepared=true;audio.preload='auto';audio.load()}
 function interact(){document.dispatchEvent(new Event('wedding-music-interaction'))}
 function stop(){wanted=false;resumeAfterHidden=false;request++;audio.pause();if(ready)state('paused','已暂停')}
 function attempt(){
  if(!ready||!wanted||priming||document.hidden)return;
  prepare();audio.muted=false;
  if(pendingSeek!==null&&length())seekTo(pendingSeek);
  const id=++request;state('loading','音乐加载中…');
  let result;try{result=audio.play()}catch(error){rejected(error,id);return}
  Promise.resolve(result).then(()=>{
   if(id!==request)return;
   if(!wanted||document.hidden){audio.pause();return}
   if(!audio.paused)state('playing','正在播放');
  },error=>rejected(error,id));
 }
 function rejected(error,id){
  if(id!==request)return;wanted=false;
  if(error?.name==='NotAllowedError')state('blocked','轻点播放，开启音乐');
  else if(error?.name==='AbortError')state('paused','已暂停');
  else state('error','加载失败，点击重试');
 }
 // Best-effort preparation during the actual invitation-opening gesture.
 // No audible music before the photograph; a blocked play always keeps a button.
 function primeInGesture(){
  if(ready||primed||priming)return;prepare();priming=true;audio.muted=true;
  let result;try{result=audio.play()}catch(_){finishPrime();return}
  Promise.resolve(result).then(()=>{primed=true;finishPrime()},finishPrime);
 }
 function finishPrime(){
  audio.pause();if(!ready)seekTo(start);audio.muted=false;priming=false;
  if(ready&&wanted&&!document.hidden)attempt();
 }
 function photoIsVisible(){
  const r=art.getBoundingClientRect();
  return r.bottom>0&&r.top<window.innerHeight;
 }
 function checkPhoto(){
  if(ready||document.hidden||!photo?.complete||!photo.naturalWidth||!photoIsVisible())return;
  if(!art.classList.contains('camera-photo-settled')&&root.classList.contains('camera-pending'))return;
  ready=true;toggle.disabled=false;state('ready','照片已显现');progress();
  observer?.disconnect();
  window.removeEventListener('scroll',checkPhoto);
  if(!autoConsumed){autoConsumed=true;wanted=true;prepare();attempt()}
 }
 toggle.addEventListener('click',()=>{
  interact();if(!ready)return;
  if(wanted||!audio.paused){stop();return}
  if(player.dataset.state==='error'){prepared=false;prepare()}
  if(audio.ended)seekTo(start);
  wanted=true;attempt();
 });
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
 audio.addEventListener('loadedmetadata',()=>{if(pendingSeek!==null)seekTo(pendingSeek);progress()});
 audio.addEventListener('durationchange',progress);audio.addEventListener('timeupdate',progress);
 audio.addEventListener('playing',()=>{if(priming)return;if(!ready||!wanted||document.hidden){audio.pause();return}state('playing','正在播放')});
 audio.addEventListener('pause',()=>{if(ready&&!priming&&audio.paused&&player.dataset.state!=='blocked'&&player.dataset.state!=='error')state('paused',document.hidden?'音乐已暂停':'已暂停')});
 audio.addEventListener('waiting',()=>{if(ready&&wanted&&!priming)state('loading','音乐缓冲中…')});
 audio.addEventListener('ended',()=>{wanted=false;resumeAfterHidden=false;state('ended','播放结束，点击重听');progress()});
 audio.addEventListener('error',()=>{if(ready){request++;wanted=false;audio.pause();state('error','加载失败，点击重试')}});
 document.querySelector('.cover-enter')?.addEventListener('click',primeInGesture,{capture:true});
 document.addEventListener('camera-story-started',prepare);
 document.addEventListener('camera-story-complete',checkPhoto);
 document.addEventListener('camera-assets-ready',checkPhoto);
 photo?.addEventListener('load',checkPhoto);
 if(window.MutationObserver){observer=new window.MutationObserver(checkPhoto);observer.observe(art,{attributes:true,attributeFilter:['class']});observer.observe(root,{attributes:true,attributeFilter:['class']})}
 window.addEventListener('scroll',checkPhoto,{passive:true});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){resumeAfterHidden=ready&&wanted;request++;audio.pause()}
  else{checkPhoto();if(resumeAfterHidden&&wanted){resumeAfterHidden=false;attempt()}}
 });
 window.addEventListener('pagehide',()=>{resumeAfterHidden=ready&&wanted;request++;audio.pause()});
 window.addEventListener('pageshow',()=>{checkPhoto();if(resumeAfterHidden&&wanted&&!document.hidden){resumeAfterHidden=false;attempt()}});
 checkPhoto();
})();
