# V10.91 — scale reference matched to invitation width

User requested smaller characters after comparing the proposed PixVerse first frame with the actual wedding invitation. No local video postproduction or production HTML changes.

## Comparison and decision

Inspected `versions/v10.71-collar-and-motion/cover.webp` and the existing `page-turn-math.js` sizing expression `Math.min(150, Math.max(95, width * .28)) * .85`. At 390px page width this yields a nominal 92.82px actor width, about 23.8% of page width. This is the old rig's sizing parameter, not a measured rendered silhouette.

The V10.90 blank card occupies only about 70% of the technical canvas. Its boy/girl silhouettes visually occupy roughly 45%/53% of card width, much larger than the webpage reference. Measuring against the full gray-bordered canvas underestimates how large they will look on the red invitation.

Target: boy about 24%, girl about 28% of RED CARD width. Final visual estimate: roughly 23% / 29%. The boy's raised mitten stays on the right edge; girl's full dress remains lower and to the left. This is a visual size adaptation, not pixel-exact registration to the website.

## Asset and image-edit brief

`first-frame.png`: built-in imagegen edit of V10.90, saved without overwriting previous assets. Three edits: reduce figures, reduce again after insufficient first pass, then correct a repeated mitten artifact and move the boy's body closer to his fixed grip. Discarded candidates remain outside the project in the image generation output directory; they must not be used for video generation.

Final edit instruction: change only the boy's arm/placement; one white sleeve with one rounded mitten gripping the same edge, two arms/hands total; move body slightly right without growing it; preserve girl's reduced size/location and the blank red card. The new still is AI-edited, not a lossless scale of original pixels; small rendering/embroidery differences remain possible.

The real wedding photograph was inspected locally for proportion only and was NOT included in any image-generation reference. No real invitation text/photo is in the video first frame. Gray surrounds are technical workspace only, not permanent website margins.

## Status

- Revised still created and visually inspected.
- No PixVerse video submitted and no PixVerse generation credits consumed this turn.
- No OSS deployment and no production page edits.
- This asset supersedes V10.90 for size review. Use V10.90 `PROMPT.txt` for the single-grip four-second action only after reference approval.
- A correct still does not prove generated grip continuity, rigid-card motion, or real-invitation integration. Those remain unverified.
