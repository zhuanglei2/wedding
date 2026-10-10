# 园林屋檐线稿素材

- Mode: built-in image_gen through the imagegen skill; no CLI/API fallback.
- Generated source: `/Users/eleme/.codex/generated_images/01a0d892-7a40-7372-b5e5-a9ccafd86fe4/exec-b51e1ecc-3664-44fc-80fc-afabab99c655.png`.
- Workspace master: `../media/garden-eaves-sketch.png` (2048 × 683).
- Runtime asset: `../media/garden-eaves-sketch.webp`, format-only lossless conversion; raw RGBA equality checked by build.cjs.
- Inputs: V10.198 `corridor-hq-900-v8.webp` for architecture, V10.193 `gathered-scenes-600.webp` for the paper/pencil style.
- Output reviewed: architecture only, pale sepia on warm paper, no people or text. This is an interpretive sketch, not an exact architectural trace.
- Original photograph and all four lettering windows continue to use the V10.198 assets. Generated art is a separate decorative layer capped at 21% of the frame and masked to at most 20.28%; first original-person pixels start conservatively at 24.38%.

## Final prompt

```text
Use case: style-transfer.
Asset type: a standalone wide architectural sketch band for the TOP of a wedding website photograph, NOT a full poster and NOT a photo of people.
Input image 1: architecture source reference. Input image 2: supporting style reference for the restrained warm-paper architectural pencil drawing at its top. Do not copy the couple, European room, or torn-edge outline from image 2.
Primary request: Create a 3:1 landscape image showing ONLY a small upper portion of the Chinese garden corridor's overhead wooden beams and the top of its right-hand carved wooden wall, distilled into fine, pale warm-grey/sepia pencil linework on light warm ivory paper (#f8f5ef). Source the shapes and perspective from image 1, especially the narrow original-source band x=15% to 95.65%, y=17.34% to 34%. This corresponds to the ceiling seen above the couple in the existing crop. The work should look like an elegant architectural observation, very quiet and airy, rather than an ornate antique illustration.
Composition: full-bleed wide horizontal band, ceiling beams receding inward towards the slightly right-of-center vanishing point; a cropped vertical pillar toward the left side, and only a small sliver of carved timber wall on the right edge. Match the photographed perspective without introducing new architecture. Most of the image is warm ivory negative space, not shaded timber. Fewer than a dozen main beam lines, fine broken pencil contours with restrained line hierarchy. Lines understated but visible on a phone. Keep the leftmost quarter especially sparse, because existing red calligraphy will be overlaid there separately. Edge-to-edge artwork, no frame or margins.
Materials: delicate warm ivory fiber texture similar to the top paper of image 2, low contrast, no yellow aging, no coffee stains. Gentle sepia linework, NO black fills, NO heavy hatching, NO shadows, NO fog or blurred photographic band.
Constraints: architecture only. NO people, faces, human outlines, silhouettes, hands, dress, flowers, text, lettering, seals, logos, watermarks, UI, border, page curl, scissors, tape, or premade torn edge. The source couple is NOT to be rendered at all: the website retains their original photo in a separate layer. Deliver only this finished 3:1 roof sketch raster asset.
```

