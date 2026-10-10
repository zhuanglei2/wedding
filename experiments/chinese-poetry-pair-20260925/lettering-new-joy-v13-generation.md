# 十六字朱红题字 v13

- 模式：内置 imagegen（未使用 CLI 或第三方生成脚本）。
- 用途：网页独立题字覆盖层；生成过程不传入照片，不处理人像。
- 用户文案：时日有序 光景常新 岁月并进 新喜已临
- 排列：四列竖排，从右到左依次为上述四句，各四字。
- 原始结果：/Users/eleme/.codex/generated_images/01a0d892-7a40-7372-b5e5-a9ccafd86fe4/exec-35f2f5ee-282d-476b-96d4-c5bfef825403.png
- 项目原稿：[透明 PNG](media/lettering-new-joy-v13.png)，1254×1254。
- 页面资源：[无损 WebP](media/lettering-new-joy-v13.webp)，507992 字节；逐像素检查可见 RGB 和所有 alpha 值与原稿一致。
- alpha>30 字形范围：x=102–1157、y=134–1211（右/下边界不含）。
- 使用深色背景临时合成预览检查字形；保持原稿透明通道，未在源文件抠图或涂改字形。

## 最终提示词

```text
Use case: logo-brand.
Asset type: a transparent Chinese handwritten lettering overlay for an existing wedding webpage. ONLY lettering, never a poster, photo or webpage.
Text (verbatim, in this exact reading order): "时日有序 光景常新 岁月并进 新喜已临".
Layout: four vertical columns, each containing exactly four characters. Read columns from RIGHT to LEFT. The RIGHTMOST column, top to bottom, is 时 日 有 序. The second column from the right is 光 景 常 新. The third column from the right is 岁 月 并 进. The LEFTMOST column is 新 喜 已 临. Exactly sixteen characters total. Do not add punctuation, spaces as marks, or any other text. All characters must use simplified Chinese. Especially 时, 岁, 并, 进, 临 must be simplified; 已 must not become 己.
Style: refined contemporary Chinese handwritten brush regular script with a little restrained 行楷 rhythm. Clearly readable standard character construction, nearly upright, graceful natural pressure variation, short tapered strokes. Fine-to-medium substantial opaque strokes, not faint hairlines, not thick block type, not wild cursive, no connected characters, no exaggerated sweeping tails. A warm, youthful, elegant poetic inscription.
Color: one solid bright vermilion red #E75B48, matte ink, opaque inside strokes. No gold, white, gradients, metallic effects, glow, shadow or outline.
Composition: square canvas. Four evenly spaced vertical columns forming a balanced compact square inscription. Similar character size throughout. The complete lettering occupies about 80 percent of canvas width and 80 percent of canvas height, centered, with around 10 percent transparent padding on all sides. Keep all strokes inside the canvas.
Background: genuinely transparent alpha, fully transparent between and around characters. No paper, texture, fake checkerboard, background color, haze, border, seals, signatures, decorations, flowers, photography or people.
Require verbatim text with every character correct.
```

