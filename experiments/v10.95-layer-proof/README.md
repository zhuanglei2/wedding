# V10.95 — independent card / character layer proof

Scope: local, zero new generation credits, not a production deployment. This
continues the V10.93 local renderer, without overwriting it, following the user's
choice to validate a layered approach before generating more video.

The invitation is a single rigid plane, sampled from the original cover.
The preferred mechanism preview is `new-source/controlled-card.mp4`, using
the already-generated V10.94 foreground (`source-v1094.mp4`). No new bodies,
faces, limbs or outfits are generated. The paired sprite is only translated
and uniformly scaled to align a colour-tracked mitten centroid.

Root-level media is the first, rejected old-source trial: the boy changes
facing/grip direction and briefly goes out of frame. It is preserved as evidence,
not the preferred preview. Neither branch passes final artistic acceptance.

This is a mechanism test, not the desired final performance: the characters
travel off the LEFT with the card; it does not implement an arrival, actual
finger wrapping, release, waiting, handholding, or a shared upward flight.
Those must not be inferred from a successful composite.

## Outputs and acceptance

See `new-source/verification.json` for numerical results and `ACCEPTANCE.md`
for visual findings. `new-source/layer-proof.mp4` shows paper / foreground /
composite separately. `new-source/controlled-card.mp4` is the composite.
All media is a local preview. Website integration is still unverified.

## Reproduction

Preferred branch: run `new-source.py <temporary-directory>` with the bundled
Python runtime. It extracts 97 source-specific mattes, preserves the decoded
RGB, then renders the independent card with `render.py`. Dependencies currently
live at `/private/tmp/wedding-v1088.TQDAlk/libs`; install OpenCV, NumPy and
imageio-ffmpeg and update those explicit runtime paths if that directory expires.

Rejected old-source branch:
Run `render.py <temporary-directory>` with the bundled Python runtime and the
existing V10.88 temporary dependencies. Inputs are the original source video,
V10.71 cover and second photo, and V10.89 guided alpha working frames. `render.py`
records source hashes before/after, decodes the output and checks the exact
uncompressed first paper/last landing frames. H.264 is lossy; exact pixel equality
claims apply to uncompressed frames, not the exported MP4.

V10.93 stopped at 165 degrees, leaving its back-face extrusion visible at the
left hinge. This version rotates the same solid card fully to 180 degrees, where
its geometry is actually outside the viewport; no opacity cleanup hides it.

The layer sequence follows the media-use local preprocessing workflow. Animation
skill contact-before-force principles inform the coordinate lock, not a claim
that the source hand genuinely grasps the card.
