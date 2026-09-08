# V10.85 · Pika 角色隔离动作测试

用户授权继续一条免费额度测试；不充值、不自动重试、不部署。

## 输入与参数

- 平台：Pika 网页已登录 Basic 账户。
- 提交前余额：80 积分；界面费用：12 积分。
- 模型 Pika 2.5，480P，5 秒，上传图比例自动，单次提交。
- 输入：`../v10.81-clean-alpha/preview-red.png`，900×900，仅两位星星人和纯红背景。
- 没有上传真实婚纱照、姓名、地址或完整请柬；原始素材未改动。
- 本轮只验证角色动作，不包含纸张、手纸接触、飞走或网页衔接。

## 提交正文

A single continuous five-second shot of the two plush wedding characters in the reference, on the same flat solid red background. Locked camera, fixed framing, both complete bodies remain visible and separated. The groom at upper right gently lowers his raised arm, looks down-left toward the bride, then makes one small warm nod; his shoulders and torso follow his head with a soft delay. The bride at lower left looks up toward him, blinks once, then gently tilts her head in response. She keeps her bouquet steady, her collar intact, and her full skirt and veil make only a slight delayed sway before settling. Small natural articulated movement, not rigid sliding or bouncing. Preserve their faces, proportions, hats and wedding clothing. Only these two plush characters. No human people, extra characters, paper, props, touching, walking, camera motion or changing background.

## 验收记录

- 使用 HyperFrames 动画技能检查先视线/头部、后肩身跟随的分阶段动作，不代表生成模型能严格执行。
- 已点击一次 Generate。素材库确认任务 `b516ef81-0c77-41a6-83f9-728425b78671`，提示词一致，进度 19%，余额 80 → 68（扣费 12）。未重复提交。
- 任务随后生成完成，结果页： https://pika.art/library?v=b516ef81-0c77-41a6-83f9-728425b78671 。
- 页面视频元素返回媒体地址： https://cdn.pika.art/results/pika2p5_final/9e5505b19e41406c98417daef938775c.mp4 。
- 播放验收受阻：页面播放器没有加载到视频元数据（宽高 0、时长不可用）；直接打开同一媒体地址，被重定向到办公网络安全拦截详情登录页面。未登录其他系统、未点击确认、未绕过拦截或改用下载方式。
- 状态：已生成但视觉未验收。不能声称眼神/衣领/裙摆已经修复，也未确认实际输出尺寸或透明背景。等待用户通过获准方式恢复播放，或提供下载的视频文件供检查。
- 必须检查：恰好两位角色、衣领与衣服完整、没有多肢/合并、实际关节运动而非整图滑动、纯色背景是否稳定。
- 即使动作通过，背景分离与真实纸张翻页接触仍需另行验证，不能直接称为正式网页动画完成。
