# V10.92 — real invitation / existing PixVerse footage composite test

## Verdict: NOT production-ready

The existing four-second video can be composited with the real invitation as a
static image, but these two tested methods do **not** produce a convincing thick
invitation turning. No new video has been generated or uploaded. No formal page,
Git remote, or OSS object is changed.

## Watch

- `comparison.mp4`: 4.041667 s, 24 fps, 97 frames, 1080×700.
  - Left: existing PixVerse source.
  - Centre A: proportion-preserving invitation, clipped by estimated red-card
    silhouette. It exposes the **wipe/cut-off** appearance when the card bends.
  - Right B: invitation remapped to each row's red-card width. It follows the
    silhouette but **squeezes the real photograph and bends the lettering**.
- `edge-follow-test.mp4`: isolated B candidate at 576×1024. Diagnostic only,
  explicitly not approved artwork and not for deployment.
- `contact-sheet.jpg`: 0, 2, 3 and 4 s side-by-side frames.

## What this verifies / does not verify

The original photograph is not given to AI. Source image bytes and video bytes
remain unchanged (hashes in `verification.json`). The real couple has no generated
independent movement: apparent distortion in B comes from our diagnostic texture
mapping, not AI animation. It is still unacceptable for the final invitation.

Initial overlay and rough foreground ordering work. V10.89's character matte
preserves most visible clothing, but fine fringes and the source-occluded skirt
remain unresolved. The old boy's initial hand/paper gap also remains.

Later, the red edge is highly concave; this is not the straight projected edge
of a rigid card. The estimates are colour-boundary detection plus interpolation
where characters occlude the boundary. They are **not recovered 3-D geometry,
tracked UV coordinates, or a professional surface solve**. A featureless red
surface does not supply enough texture correspondence for those claims. These
two failed candidates do not prove that all advanced compositing is impossible.

The terminal frame still has a large red area and the original pale back/working
background. There is no completely opened page or clean exit frame. Consequently,
**a continuous cut into the actual second web page is still not validated**.
Adding a dissolve here would hide the problem, not verify a true page turn.

No lighting or colour grade is invented. Original white back and cast shadows
outside the red surface remain visible; we have not claimed a physical relighting
of the new printed surface. The grey/beige video surround is diagnostic source
content, not a proposed permanent margin on the formal invitation.

## Decision before spending more credits

Do not describe the current blank-card generation workflow as plug-and-play.
Any replacement footage intended for this approach needs a largely planar card,
stable fold, visible connected hand grip, manageable character occlusion and a
clean full-opening/exit segment. Prompt wording alone cannot guarantee this.
The safer controllable alternative is AI character motion plus a separately
controlled real-card surface, but that is a different implementation and has
not been built or validated here.

## Provenance and reproduction

Uses local preprocessing under the media-use workflow; no generative image edits.
Inputs:

- `/Users/eleme/Downloads/PixVerse_V6_Image_Text_540P_One_continuous_fou.mp4`
- `../../versions/v10.71-collar-and-motion/cover.webp`
- V10.89 guided alpha working frames, reproducible from its committed scripts
  and lossless `character-mask.mkv`.

Run `process.py <temporary-output-directory>` with the bundled Python runtime.
Dependencies and decoded inputs are the existing V10.88 temporary environment
at `/private/tmp/wedding-v1088.TQDAlk`. The script records boundary estimates,
input hashes, dimensions, and verifies decoding all 97 output frames at 24 fps.
These numerical checks are not a perceptual quality or mobile compatibility test.

Previous versions are untouched. No new credits spent.
