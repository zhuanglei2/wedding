# V10.75 · 完整拉纸动作提示词（待首帧与合成方案通过后使用）

未提交。不沿用 V10.74 首帧。此稿需要中心长纸页、两侧安全区的新动作参考帧，且不包含真人照片、真实姓名或请柬文字。

## 首帧和坐标约定

9:16 载体；长纸页居中占宽约 75.835%，左右各约 12.083% 操作区。纸页铺满高度，初始平直、未翻开。两侧操作区只供生成过程保留手与页边，不进入最终网页。人物全身落在中心纸页投影内，男上女下、靠右侧，在纸前伸手到自由边。角色尺寸与原始服装需先验收，不能再使用已改坏衣服的重构图。

弱透视固定镜头；翻页左轴不动，右自由边向镜头轻弯再向左走。两个抓点位于纸高 35% / 57% 附近。角色身体始终位于纸面前方，只有抓纸的手指允许包住边缘；不从纸背穿出，不让卷纸遮住脸、脖子或主体。

## English prompt

A continuous ten-second shot with a locked front-facing, weak-perspective camera. Animate the exact two plush wedding characters and the centered tall paper sheet shown in the input. The paper fills the image height but only the central three-quarters of the image width, with narrow working margins outside both vertical edges. These margins remain outside the final invitation crop. No camera movement or cuts.

The paper is closed and flat at first. The groom floats above the bride, both fully inside the paper's central crop and in front of the paper, near its free RIGHT edge. They approach that edge on a short gentle curve. A few tiny golden stars follow behind. Each looks at a separate grip point, his higher and hers lower. They grasp the edge, then bend their elbows and lean back slightly. The page does not move before their hands make contact.

Together they pull to the LEFT. The LEFT edge remains anchored. The free RIGHT edge curls gently toward the camera and turns left as one continuous flexible sheet, with a muted red reverse and a soft fold shadow. Each hand follows its own grip point without slipping. Keep both faces, necklines and bodies on the camera side of the sheet; do not let the fold cover them or let them pass through the paper. Keep the working margins clear.

Around four seconds, release while the free edge is still inside the central crop, before either full character reaches the left crop boundary. The sheet continues turning under its momentum. Their bodies continue briefly in their current direction and smoothly bank back through two separate rounded arcs into the revealed middle space, his route higher and hers lower, without an abrupt reversal or crossing.

He arrives first at the screen-left side of the meeting position and softly hovers for about half a second, looking toward her. She approaches on his screen-right. They extend their nearest hands toward each other and establish ONE visible shared clasp between them. Then hold this hand-in-hand pose for a full second, exchange a small warm glance and a gentle blink. Do not leave before this held moment.

Only then do they lean and accelerate TOGETHER along an arc toward the upper right, still clasping hands with the groom on screen-left and bride on screen-right. Their head, shoulders and bodies anticipate the flight subtly; sleeves, veil and skirt follow the acceleration with a soft delay. A restrained golden star trail follows behind them, away from the faces and joined hands. They leave by about 9.2 seconds; the final 0.8 seconds allow the remaining stars to fade with no new emission.

Keep the original two identities and all original costume details stable: the groom's hat, blue band, shirt collar, bow tie, waistcoat, trousers and shoes; the bride's heart bow, whole veil, pearl necklace, original neckline, flower and complete gold-trim cream skirt. No new clothing, missing neck coverings, duplicated limbs, floating hands, extra people, wings, tears, curtains, rigid doors, text, human photographs, jumps or flashes. Keep stars subdued during the grip, paper pull and hand clasp. The blank revealed layer is a motion-study plate for later compositing, not the finished website's second page.

## 合成约束（制作说明，不假定模型可执行）

本条仍包含完整拉纸动作，不把困难部分删掉。但生成的纸、底色不是最终素材；必须从实际输出恢复角色遮罩和纸面跟踪后才能接回原请柬。这里没有自动透明导出承诺，也不要求平台凭提示词凭空输出多个分层文件。

新稿变为 10 秒；提交前核对该模式支持的时长、参考图规则、价格与余额并经用户同意。不得自动延长、拆多条、换付费档或重试。
