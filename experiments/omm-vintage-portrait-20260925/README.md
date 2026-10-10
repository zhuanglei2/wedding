# OMM · 新婚纱原片 / 第二页纸纹

按用户指定的 [omm-photo-acrylic-diptych](https://github.com/juanshejun-ui/omm-photo-acrylic-diptych) 工作流制作，不是普通网页排版。

## 已读取的规范

- [SKILL.md](https://github.com/juanshejun-ui/omm-photo-acrylic-diptych/blob/main/SKILL.md)
- [references/style-spec.md](https://github.com/juanshejun-ui/omm-photo-acrylic-diptych/blob/main/references/style-spec.md)
- 采用其 `scripts/compose_diptych.py` 原始拼接工具；作者 @juanshejun-ui。
- 个人婚礼预览用途。原 skill 的 [使用许可](https://github.com/juanshejun-ui/omm-photo-acrylic-diptych/blob/main/LICENSE.md) 保持有效；没有使用作者示例中的人物或作品素材。

## 实现对应

1. 唯一内容照片：`/Users/eleme/Desktop/wedding/087f4a3a79f7b920abff19f11eb716ef.jpg`。
2. 内置 image generation 工具只生成 3:2 下半插画；真实人像不交给模型重画。
3. 上半从原始文件按比例缩放，保留两人、裙摆、背景完整构图；不拉伸、不裁切。竖照按规范两侧留纸白。
4. 3:4 成品 1536 × 2048，上下分界精确在 1024px。
5. 下半小主体、大留白；人物姿态、宽裙摆、花束、帆船均来自同一照片。无标题、相框、额外装饰。
6. 第二页原始纸纹取自 `versions/v10.125-keepsake-fast/media/camera-clean.webp` 底部空白纸带。上下镜像拼接为 `drafts/page-two-paper.png`，作为生成参考，也精确用于原照两侧的空白。
7. `finish_and_verify.py` 调用原 skill 的拼接脚本，再只替换空白侧边的纸纹。PNG 的照片区域逐像素验证等于原照片的等比缩小结果。原始 JPG 不变。
8. 网页 WebP 为最终 PNG 的常规压缩版本；最终 PNG 是无损合成的交付文件。

`drafts/` 保留中间素材；生成提示词另存 `PROMPT.md`。

独立实验，不替换现有请柬，不部署 OSS。
