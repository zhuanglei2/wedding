(() => {
  'use strict';
  const button=document.querySelector('[data-music-toggle]');
  if(!button)return;
  const status=document.querySelector('.music-status');
  const icons=[button,...document.querySelectorAll('[data-music-mirror]')];
  const config=window.WEDDING_MUSIC||{};
  const src=typeof config.src==='string'?config.src.trim():'';
  let audio=null,pending=false,failed=false;
  const title=typeof config.title==='string'&&config.title.trim()?config.title.trim():'背景音乐';
  function message(text){if(status)status.textContent=text;}
  function show(playing){
    for(const icon of icons)icon.setAttribute('data-playing',String(playing));
    button.setAttribute('aria-pressed',String(playing));
    button.setAttribute('aria-label',(playing?'暂停':'播放')+title);
    button.title=(playing?'暂停':'播放')+title;
  }
  if(!src)return; // Keep the explicit disabled placeholder; never assign an empty src.
  let url;
  try{
    url=new URL(src,document.baseURI);
    if(!['https:','http:','file:'].includes(url.protocol))throw new Error('unsupported source');
  }catch(_){button.title='音乐地址需要检查';return;}
  button.disabled=false;button.setAttribute('aria-disabled','false');show(false);
  function player(){
    if(audio)return audio;
    audio=document.createElement('audio');
    audio.preload='none';audio.loop=config.loop===true;audio.hidden=true;
    audio.addEventListener('playing',()=>{failed=false;show(true);message('');});
    audio.addEventListener('pause',()=>show(false));
    audio.addEventListener('ended',()=>show(false));
    audio.addEventListener('error',()=>{failed=true;show(false);message('音乐暂时无法播放，请稍后再试');});
    audio.src=url.href;document.body.appendChild(audio);
    return audio;
  }
  button.addEventListener('click',async()=>{
    if(pending)return;
    const media=player();
    if(!media.paused){media.pause();show(false);return;}
    pending=true;button.setAttribute('aria-busy','true');
    try{
      if(failed){failed=false;media.load();}
      const started=media.play();
      if(started&&typeof started.then==='function')await started;
      if(!media.paused)show(true);
    }catch(_){show(false);message('音乐未能播放，请再点一次');}
    finally{pending=false;button.removeAttribute('aria-busy');}
  });
})();
