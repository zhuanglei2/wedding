# V10.84 · 完整厚卡翻开测试

用户已授权检查后开始一次测试。输入为已确认的 V10.83 完整首帧，原文件不修改。PixVerse V6 / 540P / 6 秒 / 1 条 / 音频关 / 多镜头关。提交前页面余额 36、创作价格 36；不充值、不自动重试、不部署。

状态：2026-09-08 22:18（页面时间）提交一次，现已生成完成，余额由 36 变为 0。无重复提交。上传后裁剪面板显示完整原图选区与自由比例，退出未保存裁剪。成片验收不通过，未部署。

## 生成结果与实际验收

- 结果页：https://app.pixverse.ai/video/423433782810093
- 视频：https://media.pixverse.ai/pixverse%2Fmp4%2Fmedia%2Fweb%2Fori%2F74291fab-aca8-498b-b442-0a9a98deb27e_seed1812171244.mp4
- 播放器 DOM 实测：448 × 1024，6.041667 秒。与输入 1400 × 3282 的比例略有差异；未确认平台具体采用裁切还是变形，不能称为原比例保留。
- 原生播放器手动拖动检查中段、后段和终点：约 4 秒时，模型在翻开的纸面后生成了一对立体新人，照片内容不再只是静态印刷纹理，违反人数与照片保真要求。
- 纸张出现明显的大幅波浪弯曲，未呈现要求的宽缓、较硬厚卡翻转；小角色与纸边接触也不够清晰。
- 约 5 秒画面左侧仍有红卡和额外新娘；终点左下仍残留白色裙摆，没有实现最后一秒完整无遮挡底页。
- 结论：此次试片不合格，不能替换真实请柬或用作已解决的 HTML 衔接。没有重试、充值或修改线上页面。下一步若继续，应先解决照片/文字与角色动画的隔离，不以相同整图反复抽卡。

## 实际提交正文

One continuous six-second shot, locked frontal camera. Begin with the exact full-bleed invitation in the reference: flat, fully closed, no border or exposed underpage. Only the TWO small plush wedding characters at the right edge are living actors. Everything printed on the invitation, including the human wedding photograph and lettering, stays a still printed texture attached to the card, never separate moving people.

The groom starts at the mid-upper RIGHT edge with his palm lightly touching the cover, not at a corner. He looks at his hand. His wrist lifts first and his shoulder leans back with a brief sense of effort; the RIGHT edge rises toward the camera, and his hand establishes a firm hold as the edge becomes visible. He then carries that same edge along one continuous arc toward the LEFT. His hand stays on the same contact point throughout the turn; his body follows the curved path rather than sliding independently. The vertical fold remains fixed at the extreme LEFT frame boundary. This is a complete right-to-left opening of the whole invitation cover, not a diagonal corner peel.

The cover is substantial matte wedding cardstock with a thin dark-red cut edge and matching muted-red reverse. Most of its surface remains firm and broad, with only a gentle wide bend, soft moving highlight and cast shadow. It has a little starting resistance and settles with weight, never stretching, scalloping, wrinkling like cloth, tearing or bouncing.

The bride stays a little lower and left of the groom, separated from his silhouette. She watches his hand, turns her head toward him, then follows slightly later along a separate lower arc. Her head and shoulders lead, her body follows, and her full skirt and veil respond with a small delayed sway. She neither grips the card nor touches him. Preserve both characters' original faces, hats, complete collars, wedding clothes, flowers and full bodies. No new limbs or merging bodies.

By about five seconds the cover has fully turned out beyond the LEFT boundary and the characters follow out to the left, revealing the plain warm-ivory underlying page across the entire frame. Hold this unobstructed view for the final second. Do not stop halfway. No extra characters, handholding, stars, new text, white card reverse, camera moves, cuts, zooming out or shrinking the invitation to expose margins.

## 审稿与验收边界

- 按 HyperFrames 动画技能的接触同步与受力前准备原则检查顺序；本轮不是 HyperFrames 渲染，不能用脚本规则保证生成模型执行。
- 删除旧“short tug / remains mostly closed”、双人抓纸与开头飞入要求；保留最后完整打开的停留。
- 真实照片与文字在生成视频中仍可能漂移。已在提交前向用户说明：这里只做动作验收，不能直接替换正式页面。
- 视频是否保留源长画幅、纸面纹理和自然接触，以实际结果为准。原请柬不覆盖，不把生成片误称为无缝接入完成。
