(() => {
  'use strict';
  const button=document.querySelector('[data-music-toggle]');
  if(!button)return;
  const status=document.querySelector('.music-status');
  const icons=[button,...document.querySelectorAll('[data-music-mirror]')];
  const captions=[...document.querySelectorAll('[data-music-caption]')];
  const config=window.WEDDING_MUSIC||{};
  const src=typeof config.src==='string'?config.src.trim():'';
  const demo=!src&&config.preview===true;
  const title=typeof config.title==='string'&&config.title.trim()?config.title.trim():'背景音乐';
  for(const label of document.querySelectorAll('[data-music-title]'))label.textContent=title;
  let audio=null,pending=false,failed=false,active=false;
  function message(text){if(status)status.textContent=text;}
  function caption(text){for(const label of captions)label.textContent=text;}
  function show(playing){
    active=playing;
    for(const icon of icons){
      icon.setAttribute('data-active',String(playing));
      icon.setAttribute('data-playing',String(playing&&!demo));
    }
    button.setAttribute('aria-pressed',String(playing));
    const action=playing?'暂停':'播放';
    button.setAttribute('aria-label',demo?(playing?'暂停':'预览')+title+'的无声动效':action+title);
    button.title=demo?title+'（无声动效预览）':action+title;
    caption(demo?(playing?'无声动效 · 演示中':'无声动效 · 点击预览'):(playing?'正在播放':'点击播放'));
  }
  function enable(){button.disabled=false;button.setAttribute('aria-disabled','false');show(false);}
  if(demo){
    enable();
    button.addEventListener('click',()=>show(!active));
    return; // Explicit silent preview: no audio node, network request, or fake progress.
  }
  if(!src){caption('待添加音乐');return;}
  let url;
  try{
    url=new URL(src,document.baseURI);
    if(!['https:','http:','file:'].includes(url.protocol))throw Error('unsupported source');
  }catch(_){caption('请检查音乐地址');return;}
  enable();
  function player(){
    if(audio)return audio;
    audio=document.createElement('audio');
    audio.preload='none';audio.loop=config.loop===true;audio.hidden=true;
    audio.addEventListener('playing',()=>{failed=false;show(true);message('');});
    audio.addEventListener('pause',()=>show(false));
    audio.addEventListener('ended',()=>show(false));
    audio.addEventListener('waiting',()=>{show(false);caption('正在缓冲');});
    audio.addEventListener('error',()=>{failed=true;show(false);message('音乐暂时无法播放，请稍后再试');});
    audio.src=url.href;document.body.appendChild(audio);
    return audio;
  }
  button.addEventListener('click',async()=>{
    if(pending)return;
    const media=player();
    if(!media.paused){media.pause();show(false);return;}
    pending=true;button.setAttribute('aria-busy','true');caption('正在加载');
    try{
      if(failed){failed=false;media.load();}
      const started=media.play();
      if(started&&typeof started.then==='function')await started;
    }catch(_){show(false);message('音乐未能播放，请再点一次');}
    finally{pending=false;button.removeAttribute('aria-busy');}
  });
})();
