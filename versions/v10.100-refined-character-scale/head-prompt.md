# Head sprite generation record

Historical V10.70 record. V10.71 withdraws replacement heads because neck/body proportions did not match. Only tiny curved eyelid fragments are used; original head/neck/collar stay continuous. No images generated in V10.71. The integration notes below describe V10.70 only.

Mode: built-in imagegen, one pose atlas followed by one background-extraction attempt. No CLI fallback.

Reference: `../v10.69-gaze-and-gesture/rig-atlas.png` (toy identities/style only; no human photos sent).

Selected project asset: `head-expressions.png`, 2172 × 724, six columns/two rows. The first generation was selected; extraction attempt also returned opaque checkerboard and was not selected. Both originals remain in the image service's local generated output directory.

## Generation prompt

Create a production-ready animation HEAD SPRITE ATLAS using the supplied wedding plush toy character atlas as the identity/style reference. This is NOT a wedding invitation and NOT a photo of humans. Preserve the exact two cute yellow furry peach-faced big brown-eyed toy identities, male black top hat with blue ribbon and female cream satin bow with little red heart. Match original fur color, peach skin, fabric and soft light. Output genuine transparent background RGBA, no baked checkerboard, no grid, no labels, no floor or shadows outside objects. Wide 3:1 image preferably 3072x1024, EXACTLY 6 equal columns and 2 equal rows, one fully isolated HEAD per cell, 12 heads total. TOP ROW male only. BOTTOM ROW female only. Each head includes its original hat or bow, full yellow furry head perimeter and tiny neck fur; NO shoulders, torso, arms, bouquet, skirt, or long veil (female can have tiny veil behind head only). Keep each row's heads identical size, lighting, head center, neck baseline and proportions, generous clear margin between cells. Columns for BOTH rows left to right: (1) original FRONT facing eyes open; (2) visibly turned 30 degrees toward VIEWER'S RIGHT, looking right affectionately, gentle smile; (3) visibly turned 30 degrees toward VIEWER'S LEFT, looking left affectionately, gentle smile; (4) same FRONT head as col1 but eyes naturally closed in a happy blink, actual curved eyelids not erased eyes; (5) same RIGHT turned head as col2 but happy closed-eye blink; (6) same LEFT turned head as col3 but happy closed-eye blink. True three-quarter head volume and cheek/nose perspective, not just an in-plane tilt or displaced pupils. Do not redesign the characters. All head edges entirely visible and separate, alpha outside each silhouette. This atlas will supply head turn and blink states for a 2D articulated hand-holding flight animation.

## Background-extraction prompt (not selected)

Background extraction only, production animation asset. The provided image has an unwanted baked gray/white checkerboard. Remove that checkerboard entirely and output REAL transparent alpha outside the 12 heads. Do NOT paint a checkerboard to simulate transparency. Preserve exactly all 12 existing character head expressions, hats, bows, fur, eye states, positions and 6-column 2-row layout. Do not redesign or move anything. Keep warm cream satin and pale veil distinct from background. Background pixels must truly have alpha=0. Return a transparent PNG with same wide 3:1 composition, tight clean edges. No other changes.

## Integration

Head and blink assets are displayed through local geometry masks; runtime joint motion and cloth deformation reuse original sprite pixels. See `ANIMATION.md` for limitations and validation. Original invitation and real couple photography are byte-preserved.
