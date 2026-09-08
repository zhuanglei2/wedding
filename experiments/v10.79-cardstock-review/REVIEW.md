# V10.79 · 厚卡请帖完整翻开：提交前检查

状态：仅审稿，不是生成结果；未上传、未扣积分、未部署。保留 V10.78 不变。

## 结论

值得再做一次受限验证，但不建议拿旧首帧直接提交。先补卡纸首帧，再按页面实际费用决定是否生成一条。提示词检查通过不等于模型一定能执行。

## 本轮修正

1. 从“小幅试拉、保持大部分关闭”改为完整打开；最后约 1 秒必须看见无遮挡底板。
2. 材质是有挺度的婚礼厚卡封面，非薄纸、布、窗帘或硬木门。正反面均为哑光婚礼红，细暗红切边；主要平面保持挺直，仅有宽缓弯曲。
3. 运动是绕屏幕最左侧竖直折痕，从右向左朝镜头方向翻开，不是平移拖走。封面转过约半圈后位于画面左侧之外；不能把折痕放在画内又要求所有纸完全消失。
4. 男孩是唯一抓纸者。接触后短暂停顿蓄力，再带动封面；手沿同一抓点的弧线运动，不允许身体水平平移而纸边走另一条路径。
5. 女孩看向男孩及纸边，在较低位置保持清晰距离，略晚跟随。不抓纸、不扶上臂、不牵手，避免三组接触混在一起。头纱与裙摆轻微滞后，不能整个人像贴纸同步旋转。
6. 本轮只验收完整翻开。等待、牵手、上右飞走、星星拖尾仍属于后续完整开场，不声称本片已包含。

## 6 秒动作安排（目标，不是已验证的输出）

- 0–1 秒：男孩看边缘、伸手建立接触，女孩抬眼关注；不要卡纸提前自己运动。
- 1–2 秒：男孩轻微后倾蓄力，右边缘先朝镜头抬起，显露厚度和投影。
- 2–5 秒：一次连续的右往左翻开，男孩跟随抓点弧线，女孩保持较低的错位位置跟随。逐渐收稳，不重复拉扯。
- 5–6 秒：封面与角色已离开左侧画面，底板完整露出，留约一秒安静结尾。这里的底板不是实际婚礼第二页。

## 必须先补的参考帧

- 旧 `v10.76-free-preflight/output/first-frame-layout.png` 不直接复用提交：平涂红纸和米色边条不能充分约束厚卡材质；两个人物太小。
- 用原完整角色素材排版，测试中每人约占画高 20–23%，男上女下、轮廓不相交；不重绘脸、衣服或头颈。
- 封面关闭并覆盖竖版有效画面；折痕位于最左边界，右边缘带细切边、轻微离底投影及哑光纸纹，不能预先打开一大块底板。
- 底板固定为无字暖米色，避免让模型捏造真实请帖文字和真人照片。
- 首帧需要实际输出并目视检查。当前仅写明规范，没有生成该首帧，不能称已完成准备。

## 英文候选提示词（待新首帧完成后提交）

One continuous six-second shot with a locked frontal camera. Preserve exactly the two plush wedding characters and their complete original outfits in the reference image. The groom is above the bride with a clear gap between their silhouettes.

The wedding invitation cover is substantial matte red cardstock: a fine dark-red cut edge, a matching muted-red reverse, and a softly lit paper surface. It holds a broad, mostly flat shape with only a gentle wide bend. Its vertical fold is fixed at the extreme LEFT boundary of the frame.

The groom alone looks toward the free RIGHT edge and establishes a secure one-hand grip. After a brief anticipatory lean, he lifts the edge toward the camera and carries it in one continuous arc to the LEFT, fully opening the cover around its fixed left fold. His gripping hand follows the very same point on the moving edge. His head and shoulders initiate the effort, followed by his body and feet. The cover starts with a little resistance, turns smoothly, then settles without bouncing. Its reverse and soft moving cast shadow make the thickness readable.

The bride watches him, gently turns her head, then follows slightly later on a separate lower path. Keep a clear space between them. Her veil and skirt respond with a small delayed sway, not a rigid whole-body rotation. She does not touch him or grip the cover.

Complete the turn by about the fifth second: the red cover rotates entirely beyond the left boundary, and both characters follow out on the left. The plain warm-ivory underlying page is fully revealed across the frame. Hold that unobstructed final view for the last second. No halfway stop or second tug. No cloth folds, scalloped stretching, tearing, white reverse, extra limbs, costume changes, handholding, stars, text, camera movement or cuts.

## 提交与验收门槛

- 设置目标：6 秒、540P、1 条、音频关、多镜头关；费用必须在提交前重新核实，不能由上次 4 秒 24 积分推算为已确认价格。
- 最近一次观测余额为 36，不代表本次已实时核实。不充值、不自动重试。
- 先看：是否完整打开、有无布状拉伸、人物是否变形/缺衣、手是否脱离纸边、两人是否再次聚拢。最后一秒必须无遮盖。
- 6 秒是否足够完成自然的弧线运动仍是试验风险；不能靠加速掩盖未完成动作。
- 厚卡反面、弧线遮挡及抓点稳定仍由模型生成，不是物理绑定保证。
- 即使本片动作合格，真实请帖纹理、手机长画幅适配、角色透明层/纸面变形数据与第二页接入仍未验证。不得把普通 MP4 的米色底板替换误称为已经实现无缝接入。

## 技能应用

使用 HyperFrames 动画技能中的接触同步及受力前准备原则审稿；仅借用动作原则，没有运行 HyperFrames 渲染，也没有将卡纸做弹簧挤压。
