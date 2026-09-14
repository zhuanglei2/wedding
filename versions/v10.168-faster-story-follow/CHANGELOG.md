# V10.168 — quicker inner timeline follow

Based on V10.167. Deployed to Hangzhou OSS; see RELEASE.md and DEPLOYMENT.json.

- Increase third-page inner-scroll tracking from dt/95 to dt/70.
- Retain the interpolation clamp and line-visibility protection.
- No change to glyph timing, paragraph holds, photo flight/hold/fade timing,
  manual interruption, 900ms gesture quiet time, 300ms finite resume, or outer
  page handoffs from V10.166.
- Reuse the enlarged memory photos and safe landing geometry from V10.167.
- No new media assets, no source-image edits, no layout or copy changes.

Checks: exact one-coefficient source diff, HTML/dependency parsing, previous
runtime regression suite, lower mean tracking lag versus V10.167 at 8/16/32ms
frames with identical typing progress, and retained photo landing bounds.
These are simulated runtime/geometry checks, not WeChat device validation.
