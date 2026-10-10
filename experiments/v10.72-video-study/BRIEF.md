# V10.72 · 完整角色动画验证（准备稿，尚未生成视频）

状态：等待可用的视频生成服务；当前没有 MP4，也没有改动或部署网页。

## 目的

验证完整角色动画能否改善静态拆图的僵硬感。先只验证「男孩悬停等待 → 女孩靠近 → 牵手 → 一起飞走」，通过后再制作拉纸动作并接入网页。不得用旧拆图的平移旋转录屏充当本次完整角色动画。

## 参考

使用 ../../versions/v10.71-collar-and-motion/star-couple-reference.jpg 的完整双人产品参考，不使用有头颈接缝的拆分图或 V10.70 替换头像。参考原件不改写。

角色恰好两人：左侧黑礼帽、蓝帽带、黑马甲/领结的男孩；右侧奶油蝴蝶结、红心、完整头纱、珍珠项链、花朵装饰和连衣裙的女孩。保持既有大眼、毛绒质感、配色和服装连续。真人照片不发送至视频服务。

## 第一条样片

- 目标约 6 秒，若服务支持时长不同，再按实际能力调整；固定镜头、全身可见、简洁浅色背景，无对白、字幕、纸张、转场或星光遮挡。
- 0–1.6 秒：二人轻盈离地，男孩先稳住位置，眼睛先看向女孩，再小幅偏头；肩部放松，腿随惯性慢慢收拢。女孩稍低，轻轻靠近。
- 1.6–3.4 秒：男孩伸靠近女孩的手，女孩看向他再伸手回应；肩、肘、腕连续弯曲，两只内侧手接触，避免凭空多手或花束消失。
- 3.4–4.2 秒：握住后短暂停留，目光相遇，轻微眨眼。男孩确认女孩准备好再起飞，不提前将她拖走。
- 4.2–6 秒：共同转向右上方并沿弧线加速飞离，保持牵手。身体先加速，袖口、裙摆和头纱稍晚跟上，产生一次自然回落，不反复弹跳。

时间是导演目标，不声称生成模型能逐帧精准遵循。优先保证身份、衣服、握手和动作连贯。

## 可用图生视频提示词

One continuous locked-camera shot. The two plush wedding characters gently lift into the air. The groom on the left steadies himself and waits, looking toward the bride before softly turning his head and offering the hand nearest her. The bride floats closer, returns his glance and takes his offered hand with her nearest hand. They pause together, exchange a small affectionate blink, then lean and accelerate together along a smooth arc toward the upper right, still holding hands. Their shoulders, elbows and wrists move as connected joints. The bride's veil and skirt follow the acceleration with a soft delay and settle naturally. Preserve the two characters' original faces, proportions, hats, bow, necklace, floral ornament and complete clothing continuously throughout the shot. Full-body framing, simple light background, soft studio lighting, gentle cinematic character animation, camera stays still.

## 验收与淘汰条件

1. 头颈、领口、项链和头纱不能丢失、融化或变形；人物数量、服装和五官稳定。
2. 先有视线交流，再伸手，真正接触后再出发；手不能穿模、漂浮、增加或中途脱开。
3. 肩肘腕协调，不允许整张人物图片持续摆动代替关节动作；服装跟随受力而非同步晃动。
4. 男孩有清楚可读的等待；女孩不是被突然拉走；起飞速度连续。
5. 检查开头、中段、结尾和完整播放。模型细节不合格就明确标记未通过，不自动加入网页。

## 接入边界

图生视频不默认提供透明通道；浅色背景样片仅验证角色动作。通过后还需另行解决背景合成、纸面接触、移动端播放与加载体积。不得直接把浅底矩形视频铺在红色请柬上称为完成。

只发起单条验证，不自动批量重试、购买套餐或充值；如出现付费要求/额度提示先请用户确认。当前未发起任何生成请求。

## 依据

- 动画技能：视线先行、动作预备、接触约束和衣物延迟跟随。
- Runway 官方图生视频提示指南：https://help.runwayml.com/hc/en-us/articles/48324313115155-Image-to-Video-Prompting-Guide 。使用完整参考图约束外观，以文字描述主体动作和固定镜头；平台能力不代表已连接或已生成。
