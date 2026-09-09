# V10.94 — revised PixVerse rigid-card action test

User explicitly chose a new PixVerse generation instead of salvaging the old
performance. No further V10.93 local card animation work is being done here.

## Reference

Use `../v10.91-scaled-characters/first-frame.png`, not the older large-character
V10.90 reference and not the real invitation. The complete rectangular card and
its corners are visible; character sizes are relative to card width, not canvas.
No wedding photograph or real invitation lettering is provided to PixVerse.

## Revised test

Four seconds, one small pull, a single rigid book-cover plane, fixed left hinge,
straight edges and all corners in frame. Modest 25-degree target and weak
perspective reduce the risk of corners leaving the small vertical safety margin.
This is a direction to the model, not a geometric guarantee. The existing red
surface texture is kept so a usable output may offer more tracking cues than
an entirely flat solid colour. It is not a calibrated tracking pattern.

Boy starts holding the right edge; the same hand/point remains attached. Girl
follows slightly later, visibly in front and separated. No release, handholding,
flight, stars or real photos in this 4-second test. Final half-second holds.

## Why this is different from V10.92

We are no longer asking postproduction to infer a thick card from an S-shaped
cloth-like surface. A planar result could be texture-replaced using its visible
corners and foreground masks. Whether the AI follows these instructions, whether
hands actually grip, and whether matte quality suffices must be checked after
generation. The reference and prompt do not certify these.

This test is NOT the full invitation opening. The rest of the opening, release,
handholding, flight and exact mobile/WeChat handoff remain unverified. No claim
of guaranteed seamless compatibility is made.

## Submission guard

Before submitting, visually verify the small-character thumbnail, exact prompt,
V6 / 540P / 4 seconds / one output, audio off, multishot off, displayed balance
and displayed price. Only one generation is authorized in this run; no automatic
retry or purchase. Record the actual result separately, not as a prompt success.

Submitted once: site display 09-09 12:22, V6 / 540P / 4s / one output, 24 points,
balance 30 → 6. Generation completed; see `submission.json` and `RESULT.md`.
Production HTML and OSS remain untouched. Animation skill principles used: prior contact and a shared
hand/card motion beat, without applying bouncy UI spring motion to the card.
