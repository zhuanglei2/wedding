# 手绘素材复用

源文件：[V10.131 手绘礼炮及烟花](../v10.131-fireworks/party-fireworks.webp)。生成说明及原提示词见 [V10.131](../v10.131-fireworks/ASSET_PROMPT.md)。本版不重新生成图片。

celebration-layout.json 记录源像素坐标、独立显示区域和原文件 SHA-256。CSS polygon 沿透明间隙拆分两个显示区域；以 alpha > 24 为可见笔画标准检查分界及其左右 1 px，穿过笔画数为 0，最大 alpha 2。两层不重叠、不重复显示任何烟花或礼炮；源文件不变。
