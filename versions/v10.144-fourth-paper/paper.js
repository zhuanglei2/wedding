/* Static paper only: no scroll handler, no changes to the invitation animation. */
(() => {
  'use strict';
  const page = document.getElementById('wedding-invitation');
  const layer = page?.querySelector('.invite-paper-layer');
  if (!layer) return;
  let count = layer.children.length;
  let queued = false;
  function fit() {
    queued = false;
    const width = page.clientWidth;
    if (!width) return;
    // At 100% image width, each strip exposes only source y=1152..1536.
    const needed = Math.ceil(page.clientHeight / (width * 3 / 8)) + 1;
    if (needed === count) return;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < needed; i++) {
      const tile = document.createElement('span');
      tile.className = 'invite-paper-tile';
      fragment.append(tile);
    }
    layer.replaceChildren(fragment);
    count = needed;
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(fit);
  }
  fit();
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(page);
  else {
    window.addEventListener('resize', schedule, { passive: true });
    if (document.fonts?.ready) document.fonts.ready.then(schedule);
  }
})();
