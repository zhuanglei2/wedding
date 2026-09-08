(() => {
  'use strict';
  const dialog = document.querySelector('.star-intro');
  const root = document.documentElement;
  const cover = document.querySelector('.image-cover');
  if (!dialog || typeof dialog.showModal !== 'function' || window.location.hash || window.scrollY > 80) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const openButton = dialog.querySelector('.star-open');
  const touchButton = dialog.querySelector('.star-touch');
  const panels = [dialog.querySelector('.star-left'), dialog.querySelector('.star-right')];
  const fades = [dialog.querySelector('.star-heading'), dialog.querySelector('.star-actions')];
  let state = 'ready';
  let timer;
  let animations = [];

  function cleanup() {
    clearTimeout(timer);
    animations.forEach(animation => animation.cancel());
    animations = [];
    root.classList.remove('intro-active');
    dialog.classList.remove('is-opening');
  }
  function dismiss() {
    if (state === 'done') return;
    state = 'done';
    cleanup();
    if (dialog.open) dialog.close();
    if (cover) {
      cover.setAttribute('tabindex', '-1');
      cover.focus({preventScroll: true});
    }
    window.dispatchEvent(new Event('resize'));
  }
  function animate(element, frames, options) {
    const animation = element.animate(frames, {...options, iterations: 1, fill: 'both'});
    animations.push(animation);
    return animation.finished;
  }
  function open() {
    if (state !== 'ready') return;
    if (reduce.matches || !panels.every(panel => typeof panel.animate === 'function')) return dismiss();
    state = 'opening';
    dialog.classList.add('is-opening');
    // Hard limit also releases the modal if a browser loses an animation event.
    timer = setTimeout(dismiss, 2500);
    try {
      const jobs = [];
      fades.forEach(element => jobs.push(animate(element, [{opacity: 1}, {opacity: 0}], {duration: 260})));
      jobs.push(animate(dialog.querySelector('.star-backdrop'), [{opacity: 1}, {opacity: 0}], {delay: 280, duration: 1250}));
      panels.forEach((panel, index) => {
        const sign = index === 0 ? -1 : 1;
        jobs.push(animate(panel, [
          {transform: 'translateX(0) rotate(0deg)', opacity: 1, offset: 0},
          {transform: `translateX(${sign * 2}%) rotate(${sign * .6}deg)`, opacity: 1, offset: .16},
          {transform: `translateX(${sign * 32}%) rotate(${sign * 3}deg)`, opacity: 1, offset: .65},
          {transform: `translateX(${sign * 76}%) rotate(${sign * 5}deg)`, opacity: 0, offset: 1}
        ], {duration: 2000, easing: 'cubic-bezier(.33,0,.2,1)'}));
      });
      Promise.all(jobs).then(dismiss, dismiss);
    } catch (_) { dismiss(); }
  }
  openButton.addEventListener('click', open);
  touchButton.addEventListener('click', open);
  dialog.querySelector('.star-skip').addEventListener('click', dismiss);
  dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  dialog.addEventListener('close', () => { state = 'done'; cleanup(); });
  const motionChange = () => { if (reduce.matches && state === 'opening') dismiss(); };
  if (reduce.addEventListener) reduce.addEventListener('change', motionChange);
  else if (reduce.addListener) reduce.addListener(motionChange);
  const images = [...dialog.querySelectorAll('img')];
  images.forEach(img => img.addEventListener('error', dismiss, {once: true}));
  if (images.some(img => img.complete && !img.naturalWidth)) return;
  try {
    dialog.showModal();
    root.classList.add('intro-active');
    openButton.focus({preventScroll: true});
  } catch (_) { dismiss(); }
})();
