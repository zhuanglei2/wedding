# 独立题字生成记录

使用内置 imagegen 工具。没有向生成模型提交婚纱照，只生成并修订文字。

最终项目资源：`media/poem-lettering-v1.png`

透明 PNG 1024 × 1536；右列“今夕何夕”，左列“见此良人”。生成结果保留不修改。白底合成仅用于检查透明通道，不改动原稿。图片尚未叠回照片。

## 初稿提示词

```text
Use case: logo-brand.
Asset type: standalone Chinese hand-lettered title artwork, for later overlay on a wedding photograph. ONLY draw the typography. This is a new lettering design, not a web page mockup.
Background: genuinely transparent alpha background. No paper, no texture, no colored background, no checkerboard baked into the artwork.
Exact text: "今夕何夕" and "见此良人". Eight Chinese characters total, exactly once each. No punctuation, no additional text. Simplified Chinese 见.
Composition: a single vertical lettering composition on a portrait canvas. Two vertical columns, right-to-left reading order. RIGHT column from top to bottom: 今 / 夕 / 何 / 夕. LEFT column from top to bottom: 见 / 此 / 良 / 人. The left column begins about half a character lower than the right. Leave comfortable transparent padding around all strokes.
Style: original contemporary Chinese editorial title lettering, graceful and clear 行楷 (regular-running script), delicate but confident brush-pressure variation, clean legible character skeletons, slightly elongated strokes with a few purposeful tapered ends. Romantic, relaxed and modern, like a thoughtfully commissioned title for a fashion photography story. Each character should remain easily readable at small size. Moderate natural spacing; every character separate; restrained asymmetry between the columns. Not mechanical font typesetting, not tangled grass script, not decorative antique calligraphy. Deliberate moderate contrast between thick and fine strokes, substantial enough for legibility without heavy blocky shapes.
Color: one rich cinnabar red around #C73C35, opaque letter interiors, subtle natural brush-edge variation only. No metallic effect, no gradients.
Constraints: ONLY the eight specified characters. No seal, no signature, no English, no date, no border, no frame, no flourishes outside the letterforms, no flowers, no illustrations, no photographs, no people. All strokes complete and fully inside the canvas. Produce a high-resolution standalone asset with truly transparent background.
```

## 最终修订提示词

参考图为初稿题字，不含任何人物。

```text
Edit ONLY this lettering asset. Critical correction: remove EVERY soft red halo, glow, shadow, dark gradient, blur and backdrop. The current red glow is a mistake. Output just sharp, fully opaque cinnabar-red brush strokes on a genuinely transparent alpha background. Pixels between characters and outside actual brush strokes must be completely transparent, not red tinted and not black.
Keep the two staggered vertical columns, right column 今 夕 何 夕, left column 见 此 良 人. Exactly eight characters with no punctuation or extra text. Use the simplified form 见, not 見.
Refine the letterforms toward graceful and LEGIBLE contemporary 行楷: distinct strokes, clearly recognizable characters, confident pointed stroke endings, slight natural brush thickness variation. NOT illegible grass script and NOT a typeset font sample. Avoid giant sweeping tails: keep the shape of each character easy to read and naturally spaced. Pure flat red approximately #BE3931, alpha 255 inside strokes, antialiased edges only. No red mist, no bloom, no diffuse brush cloud, no lighting effects, no dark underpainting, no texture, no paper, no frame, no seal, no signature. This is a clean transparent typographic overlay asset for a webpage, not a glowing poster.
```

