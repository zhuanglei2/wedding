# V10.169 — second-page music

Based on V10.168. Local preview only; not deployed or pushed.

- Add a compact red/blue music player below the second-page artwork and names.
- Reserve identical player space on the inert page-turn underlay to keep camera coordinates aligned; retain paper texture above/below.
- Start the actual supplied duet once the original photo has settled at its final size, is loaded, and its page is visible. Start at 0 seconds for now.
- Real play/pause, seek/time display and ±10-second controls. Reader interaction cancels the automatic page 2→3 handoff; ordinary playback does not change the existing handoff timing. Music continues on later pages.
- Best-effort muted preparation on the real cover-opening click. If browser autoplay is blocked, show an explicit play button; never claim playing until the media element actually plays.
- Retain manual pause/seek when revisiting page two, prevent repeat auto-start, pause in background and handle errors/retry.
- Derive a 192 kbps MP3 from the user-provided 320 kbps file without modifying the original. No audio request at initial page load (`preload="none"`); loading starts on cover interaction/camera start.
- `data-start-seconds` on `#wedding-music` is the single future starting-offset setting; no per-device persistence or hidden choice.
- No photo, typography artwork, camera/character timeline, page-three text or scrolling changes. Root index.html and guest.html untouched.

Validation: see test.cjs and verify.cjs. Browser/real WeChat playback remains unverified; local browser inspection was not attempted because earlier URL-policy checks were blocked. No OSS/GitHub mutation in this version.
