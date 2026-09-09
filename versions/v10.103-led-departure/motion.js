/* Native document scrolling owns the reveal: no wheel/touch interception,
   scroll locking, autoplay, or animation dependencies. Reverse scrolling works. */
(() => {
  'use strict';
  const root = document.documentElement;
  const cover = document.querySelector('.image-cover');
  const underlay = document.querySelector('.opening-underlay');
  const image = underlay && underlay.querySelector('img');
  if (!cover || !underlay || !image || !window.matchMedia || !window.requestAnimationFrame) return;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const copies = Array.from(document.querySelectorAll('.chapter .copy, .closing > h2, .closing > p'));
  let enabled = false;
  let frame = 0;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);
  const clear = () => {
    root.classList.remove('paper-motion');
    underlay.style.removeProperty('--photo-opacity');
    copies.forEach(element => {
      element.removeAttribute('data-scroll-reveal');
      element.style.removeProperty('--copy-opacity');
      element.style.removeProperty('--copy-offset');
    });
  };
  const paint = () => {
    frame = 0;
    if (!enabled) return;
    try {
      const height = underlay.clientHeight || window.innerHeight;
      const exposed = ease(clamp(1 - cover.getBoundingClientRect().bottom / height));
      const measures = copies.map(element => ({element, top:element.getBoundingClientRect().top}));
      underlay.style.setProperty('--photo-opacity', (.78 + .22 * exposed).toFixed(3));
      measures.forEach(({element, top}) => {
        // Account for our own transform so progress doesn't feed back into itself.
        const oldOffset = parseFloat(element.style.getPropertyValue('--copy-offset')) || 0;
        const progress = ease(clamp((height * .90 - (top - oldOffset)) / (height * .28)));
        element.style.setProperty('--copy-opacity', progress.toFixed(3));
        element.style.setProperty('--copy-offset', `${((1 - progress) * 14).toFixed(2)}px`);
      });
    } catch (_) {
      enabled = false;
      clear();
    }
  };
  const schedule = () => { if (enabled && !frame) frame = window.requestAnimationFrame(paint); };
  const configure = () => {
    enabled = !preference.matches && !(image.complete && image.naturalWidth === 0);
    clear();
    if (!enabled) return;
    root.classList.add('paper-motion');
    copies.forEach(element => element.setAttribute('data-scroll-reveal',''));
    schedule();
  };
  image.addEventListener('error', () => { enabled = false; clear(); });
  image.addEventListener('load', schedule);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('pageshow', schedule);
  if (preference.addEventListener) preference.addEventListener('change', configure);
  else if (preference.addListener) preference.addListener(configure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  configure();
})();
