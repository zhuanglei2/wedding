# V10.166 — mobile automatic-scroll ownership

Based on V10.165. Only the page 2→3 and page 3→4 handoff controllers change.

## Reproduced failure

V10.165 treated any scroll-position deviation above 8px as reader input. Its
scrollTo call immediately read scrollY, assuming synchronous scroll application.
In a delayed-scroll fixture (48ms), both routes started moving but cancelled at
1084px instead of their 2080px target without any user input. This reproduces the
reported symptom in the controller, not a captured trace from the user's phone.

## Repair

- Scroll events no longer cancel programmatic travel. Touch, wheel, pointer
  (including scrollbar dragging), navigation keys, pinch, orientation changes,
  hidden/pagehide and hash navigation still cancel.
- Preserve the 1000ms hold and 1400ms eased downward movement.
- Check the committed scroll position and final DOM anchor before releasing the
  next chapter's playback gate. Landing retries once and times out after 800ms,
  leaving manual navigation available rather than holding an endless RAF.
- Height-only viewport changes refresh the destination without cancelling.
- Preserve one-shot behavior, reduced-motion handling, camera/character math,
  all photos, typography, copy, third-page typing and inner timeline.
- Existing V10.165 opening-runtime.js is reused; no new assets or libraries.

## Validation

Run using Node:

- verify.cjs — exact HTML scope, 72 local dependencies and script parsing.
- test.cjs — actual third-page runtime, typing/media/pause/resume and handoff.
- test-handoff.cjs / test-memory-handoff.cjs — synchronous scroll, hold, arrival,
  quantization, user control, finite lifetime and one-shot semantics.
- test-async-scroll.cjs — V165 failure reproduction; 60 combinations of delayed
  commits (0/16/48/120/250ms), frame rates and event order; toolbar/layout shifts
  during hold/travel/landing, input cancellation and unscrollable fallback.
- test-mobile-handoff.cjs — real bundled camera timing and natural completion;
  9 asynchronous-scroll cases plus 27 viewport/frame/phase cases.

These are VM tests with simulated DOM/scroll and mocked canvas, not a browser
render or WeChat device test. Local browser and office-network access remain
blocked by existing policy; no alternate-host or localhost workaround was used.

## Release scope

Publish only to Hangzhou hq-wedding, backing up old love.html first. Keep the root
index.html and guest.html byte-for-byte unchanged. Deployment receipt is separate.
