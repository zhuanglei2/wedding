# 毛边素材与生成说明

- 工具：内置 imagegen，单次生成。未使用 CLI 或外部动画生成。
- 原始输出：/Users/eleme/.codex/generated_images/01a09077-92c5-79f0-9a6c-36c726c4c4e8/exec-96ffe04b-79fd-42ab-b569-6250e6f51771.png
- 页面使用：paper-edge.webp。按 1024px 展示宽度缩放并压缩为 WebP；RGB 品质 35、alpha 品质 100，编码后的透明通道与缩放后的来源逐像素一致。只用于轮廓，不显示 RGB 色彩。
- 原始上半部有不需要的透明渐变，未修图或作为整页蒙版使用；CSS 只取边缘附近，以上部不透明遮罩填补过渡。正文和照片不进入蒙版。
- 既有 camera-clean.webp 提供实际纸色与纹理，新图仅提供毛边轮廓。

## 完整提示词

Use case: product-mockup
Asset type: ONE standalone horizontal natural deckle-paper edge ALPHA MASK for masking an existing cream-paper section over red on a wedding webpage. Generate only this mask asset.
Canvas/output: Landscape 1536 x 1024 pixels, PNG with a real alpha channel and genuinely transparent background. White RGB is sufficient because only alpha will be used.
Composition: The upper 55% of the ENTIRE canvas is a single completely opaque solid pure-white region, alpha 255, flush against the top, left, and right canvas edges with absolutely no transparent margins or padding. The paper extends across the full width. The lower 35% of the entire canvas is genuinely empty transparency, alpha 0.
Boundary: Around y=60% of the canvas height, form one nearly horizontal, gently irregular, finely torn/deckled cotton-paper lower edge. Keep all irregularity inside y=55–65% (within the allowed 55–66% band, with the bottom 35% fully transparent). Use only delicate tiny natural fibers along this thin edge; understated wedding stationery. Very low-amplitude irregularity, no dramatic torn waves or mountain silhouettes. Paper above; transparency below.
Opaque body: Uniform pure white, fully opaque with no gray translucency, no grain and no texture inside the paper. Partial alpha is permitted only in the tiny fibers and antialiasing at the immediate torn boundary.
Avoid: Shadows, shading, gradients, page designs or website mockups, lettering, people, photos, icons, objects, background colors, drawn checkerboards, borders, floating sheets, or detached specks. Do not depict red or cream. Deliver one image only, no variants.
