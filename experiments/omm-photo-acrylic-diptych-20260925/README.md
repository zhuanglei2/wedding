# 婚纱摄影与纸本丙烯双联画

按用户指定的 [OMM Photo Acrylic Diptych](https://github.com/juanshejun-ui/omm-photo-acrylic-diptych) 执行。个人婚礼页面设计预览，不改动现有请柬，也未发布或提交照片。

- 原照：用户提供的 `8213f57f1s0341e9620ea034ee695ed6.jpg`，1179 × 786。
- 内置生图工具只生成下半幅。人物关系、三角裙摆、宫廷拱线及色彩来自原照；未使用仓库中的示例作品。
- 使用该 skill 的 `scripts/compose_diptych.py`，设置 `--width 1179 --photo-mode contain`，输出严格 1179 × 1572 PNG。
- 分界线在第 786 行，上下各 50%；原照比例正好 3:2，因此不缩放、不裁切、不补边。
- 上半幅与原照解码后 RGB 像素逐一比较。网页 WebP 采用无损编码，同样检查像素一致性。
- 页面完整显示，不设置照片滤镜或裁切；默认无画面文字。
- 按用户后续要求，网页在原照最底部的地板区域添加纸纹羽化：占整页 47.2%–50%（对应原图约第 742–786 行），不覆盖人像或裙摆。PNG 成品保留原始硬分区版本。
- 最终图：`wedding-omm-diptych.png`；网页：`index.html`。
- `drafts/lower-panel.png` 为独立的生成插画素材，和最终拼合图分开。
- 生图提示词存于 `PROMPT.md`。未做微信真机验收。
