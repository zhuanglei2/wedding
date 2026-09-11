(() => {
  'use strict';
  const sequence=document.querySelector('.opening-sequence');
  const underlay=document.querySelector('.opening-underlay');
  if(!sequence||!underlay||underlay.querySelector('.opening-continuation'))return;

  // The underlay is a viewport preview of the page at its landing position,
  // not just the camera poster. Reuse the REAL subsequent content so a tall
  // viewport shows the same pixels below the poster on both sides of the handoff.
  // Clone once at boot; no layout reads, animation callbacks or scroll listeners.
  const continuation=document.createElement('div');
  continuation.className='opening-continuation';
  continuation.setAttribute('aria-hidden','true');
  continuation.setAttribute('inert','');
  for(let source=sequence.nextElementSibling;source;source=source.nextElementSibling){
    const copy=source.cloneNode(true);
    // Keep the visual copy non-interactive even in browsers without inert.
    // The source chapters remain the only accessible/interactive document.
    for(const node of [copy,...copy.querySelectorAll('*')]){
      node.removeAttribute('id');
      node.removeAttribute('autofocus');
      if(node.matches('a,button,input,select,textarea,summary,[tabindex],[contenteditable]')){
        node.setAttribute('tabindex','-1');
        if(node.hasAttribute('contenteditable'))node.setAttribute('contenteditable','false');
      }
      if(node.matches('img')){
        node.setAttribute('loading','lazy');
        node.setAttribute('decoding','async');
        node.setAttribute('fetchpriority','low');
      }
    }
    continuation.appendChild(copy);
  }
  underlay.appendChild(continuation);
})();
