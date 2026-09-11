# 素材记录

内置 imagegen 生成及修改。最终 girl-straight.png、boy-love.png、boy-rethink.png 为独立白底表情。照片仅作人物参考；图像文字由 HTML 实现。

## Prompts

```json
{
  "generation": [
    {
      "key": "girl",
      "prompt": "Create ONE isolated single-person comic reaction sticker, genuinely transparent background with alpha, not a contact sheet. Reference 1 is an approved illustration STYLE and FACE reference; reference 2 is real identity and woman's HAIR reference only, not clothing. Warm fine-ink watercolor comic like reference 1, recognizable same adult face, slightly enlarged expressive head suitable for a small web sticker. Bust portrait with complete head, shoulders and gesture, compact framing filling 85% canvas. No text, lettering, speech bubbles, frames, flowers, backgrounds, white matte or checkerboard. No wedding clothes or accessories. Only the WOMAN. Correct her hair: loose black voluminous softly wavy SHORT BOB ending between chin and shoulders, like woman in photograph reference 2. NO bun, ponytail, long hair, veil, tiara, sunglasses. Muted sky-blue casual round-neck short-sleeve blouse, small stud earrings. Affectionately pretending to be stern, one eyebrow lifted, knowing playful half-smile, eyes looking toward viewer-right. One open hand lifted beside head as if interrupting 'say that again', fingers anatomically clear. Not waving hello, not violent. Keep hand inside frame. Transparent background."
    },
    {
      "key": "boy-love",
      "prompt": "Create ONE isolated single-person comic reaction sticker, genuinely transparent background with alpha, not a contact sheet. Reference 1 is an approved illustration STYLE and FACE reference; reference 2 is real identity and woman's HAIR reference only, not clothing. Warm fine-ink watercolor comic like reference 1, recognizable same adult face, slightly enlarged expressive head suitable for a small web sticker. Bust portrait with complete head, shoulders and gesture, compact framing filling 85% canvas. No text, lettering, speech bubbles, frames, flowers, backgrounds, white matte or checkerboard. No wedding clothes or accessories. Only the MAN from reference 1. Same black side-parted wavy hair, ivory casual crew-neck T-shirt. Loving slightly bashful smile, rosy cheeks, bright natural eyes looking viewer-left, one hand resting over heart; two tiny brick-red hand-drawn hearts beside head. No glasses. Transparent background."
    },
    {
      "key": "boy-rethink",
      "prompt": "Create ONE isolated single-person comic reaction sticker, genuinely transparent background with alpha, not a contact sheet. Reference 1 is an approved illustration STYLE and FACE reference; reference 2 is real identity and woman's HAIR reference only, not clothing. Warm fine-ink watercolor comic like reference 1, recognizable same adult face, slightly enlarged expressive head suitable for a small web sticker. Bust portrait with complete head, shoulders and gesture, compact framing filling 85% canvas. No text, lettering, speech bubbles, frames, flowers, backgrounds, white matte or checkerboard. No wedding clothes or accessories. Only the MAN from reference 1. Same black side-parted wavy hair, ivory casual crew-neck T-shirt. Sheepish amused smile, one eyebrow slightly lifted, eyes glance viewer-left, one hand scratching back of head with elbow naturally visible, one tiny teal comic sweat mark. Playful 'okay let me start again' expression, not distressed. Transparent background."
    }
  ],
  "girlCorrection": "Edit ONLY the hairstyle and earrings of this single woman comic sticker. Same exact face, expression, raised open hand, pose, blue casual shirt, scale and illustration style. Hair must be BLACK STRAIGHT SHORT HAIR: smooth naturally hanging straight bob, ending just above shoulders, side part, no waves, no curls, no fluffy perm, no bun or ponytail. Remove ALL earrings and ear studs: completely bare ears, no pearls or jewelry. Keep her face recognizable and playful lifted eyebrow. Output isolated person with genuinely transparent alpha background, NOT a rendered checkerboard pattern, no text or speech bubble. Preserve all other details.",
  "backgroundCleanup": "Background cleanup ONLY. Replace EVERY gray checkerboard square behind the illustrated person with a perfectly uniform pure WHITE #FFFFFF background. This is a white-background web sticker, not transparency visualization. Absolutely NO checkerboard, gray squares, pattern, shadow, vignette or texture in the background. Keep the person, face, hairstyle, clothing, hand gesture, colors, drawing and tiny reaction symbols exactly unchanged. Do not add any text, borders or jewelry. Preserve complete silhouette and hands. Single image only."
}
```

