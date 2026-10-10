# V10.183 — Photo-led collage

- Replaces the upper landscape photograph with the user's new clean source, a4ac32bfdq9fbe2e01e87def7bd2b44b.jpg. No watermark removal or face synthesis is performed.
- Redesigns only the inserted photo chapter: much larger full photographs, no large blue arch, no thick white mats, quiet ivory cotton paper and a small curtain-derived vermilion accent.
- Exact native 3:2 and 2:3 placements preserve the full sources, including the people, clothing and gown. Generated content is limited to the paper surround.
- Both source hashes and every composited photo pixel are checked against a directly resized original in the lossless master. See design/asset-manifest.json.
- Three responsive WebP widths (600/900/1200) remain cover-first and viewport-deferred. No new JS dependency or animation loop.
- The new chapter stays after the second camera page. Existing cover, camera, music, timeline and final invitation remain unchanged. Handoff still stops at the new chapter and supports user cancellation.
- V10.182 retained. No deployment or Git commit requested or performed.

## Checks

- node test-handoff.cjs: passed.
- node test-async-scroll.cjs: 30 delayed/quantized scroll simulations passed.
- node verify.cjs with sharp on NODE_PATH: verifies original-file hashes, lossless photo pixel provenance, deferred assets and unchanged surrounding HTML.
- Composed image visually inspected at normal size and 360px thumbnail. These are not on-device WeChat tests.

## Rebuild

Use node build.cjs with sharp available on NODE_PATH. The two local photo inputs are listed in build.cjs. Only this version's output files are written; original source files are read-only inputs.
