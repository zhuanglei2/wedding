# V10.89 — guided character matte, local preview

This version improves extraction of the two existing animated characters from the user's 4-second PixVerse video. It does **not** claim the complete invitation transition is fixed.

## Outputs

- `guided-matte-comparison.mp4`: original crop / guided matte on dark / guided matte on light, 97 frames at 24 fps. This is an enlarged inspection view, not a redesigned invitation.
- `character-mask.mkv`: lossless FFV1 grayscale alpha sequence, full source dimensions 576×1024. An intermediate compositing asset, **not** a mobile-browser playback format.
- `contact-sheet.jpg`: early/middle/late comparison.
- `verification.json`: exact decoded RGB preservation, four inspected dress-interior probes, area-change flags and remaining limitations.
- `process.py`: reviewed envelopes, GrabCut segmentation, bidirectional optical-flow mask propagation and edge coverage. Only alpha is changed; no invented character pixels or new animation.

## What changed from V10.88

V10.88 removed pale colours globally and accidentally removed white clothing. V10.89 explicitly constrains the foreground to the characters, protects opaque interior regions and excludes the paper. Early frames use generous tracked ROIs with character-seeded component filtering, avoiding flow clipping on hands and bows. Later overlap sections use more closely spaced manual envelope keyframes. Optical flow is bounded by endpoint silhouettes to prevent following the paper into the foreground mask.

The implementation follows the mask-assisted approach described in [OpenCV's GrabCut documentation](https://docs.opencv.org/4.x/d8/d83/tutorial_py_grabcut.html). It is **not** a trained semantic segmentation model. The media-use workflow is used for local preprocessing and asset provenance, not a new generation service.

## Source and preservation

Input: `/Users/eleme/Downloads/PixVerse_V6_Image_Text_540P_One_continuous_fou.mp4`

SHA-256: `1bb4f057b1e3e8f95d970ac3fa71d8288650639a085c46a0940c4bce6767cc64`

576×1024, 24 fps, 97 decoded frames, 4.041667 seconds. No source file modification. The RGBA working sequence preserves decoded source RGB exactly. Lossy H.264 previews are re-encoded, so that RGB claim does not apply to the preview encode.

Attribution to PixVerse is retained in comparison captions. No real wedding photograph was submitted to any generator. No network upload, generation credits, Git push or OSS deployment in this version.

## Still not solved

1. Source hand-to-paper contact is wrong during the first part. An improved alpha mask cannot repair that choreography.
2. The original paper remains too soft and does not perform a convincing full thick-card opening. The comparison removes it from the character layer; it does not replace it with an approved paper animation.
3. Near the end, the original paper occludes the bride's right skirt edge. Missing pixels are **not** reconstructed. This footage cannot be used as an unobstructed full-silhouette ending.
4. Fine red fringe, veil transparency and temporal edge quality still require production QA. This version uses silhouette coverage rather than physically recovered hair/veil alpha.
5. No mobile/WeChat integration is claimed or deployed. Mask area changes are diagnostics, not segmentation accuracy. Four dress-interior probes do not certify all clothing pixels across the clip.

## Reproduce

Scripts use the local temporary OpenCV installation at `/private/tmp/wedding-v1088.TQDAlk/libs`; dependencies are `opencv-python-headless==5.0.0.93` and `numpy==2.5.3`. A fresh machine must install these in an isolated environment and update that path.

1. Decode with V10.88 `extract.cjs` (input SHA above), keeping all 97 frames.
2. Run `process.py <decoded-frames-directory> <working-output-directory>`.
3. Run `verify.py <decoded-frames-directory> <working-output-directory>`.
4. Encode `<working-output-directory>/comparison/frame-%03d.png` at 24 fps using H.264, `pad=1050:466:0:0`, yuv420p, CRF 18.
5. Encode alpha from `<working-output-directory>/alpha/frame-%03d.png` with `alphaextract`, FFV1 level 3, preserving the lossless mask.

Working PNG sequences are temporary and reproducible; previous committed versions remain untouched.
