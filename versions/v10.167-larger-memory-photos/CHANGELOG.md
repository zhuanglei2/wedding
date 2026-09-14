# V10.167 — larger 2024–2026 memory photos

Based on V10.166. Local preview only; not deployed.

- Portrait cards: width cap 63% → 70%, viewport-height factor .46 → .53.
- Landscape cards: 76% → 84%, height factor .65 → .76.
- Four-photo keepsake: 88% → 94%, height factor .72 → .80.
- Constrain only the resting offsets where enlarged, rotated cards approach
  the reading viewport edges, allowing for the existing landing bounce.
- Size caps account for the paper border, rotated card bounds and faded top/
  bottom edges. Short windows prioritize keeping the whole photo visible.
- Keep flight angles, keyframe phases, durations, photo order, 3-second hold,
  fade, typing and auto-scroll/handoff logic unchanged.
- Keep original image files and object-fit/crop unchanged; no new media download.
- Final wedding portrait and all other pages remain unchanged.

Validation uses script parsing, dependency checks, source-scope comparison,
299 representative photo-geometry cases and the existing runtime regression suite. This
does not constitute a rendered browser or WeChat visual inspection.
