# V10.81 · 本地去棋盘背景

用户已明确同意本地抠图；未调用任何在线图片或视频生成服务。

- 输入：V10.80 `characters-generated.png`，原件保留。
- 输出：`characters-transparent.png`，1254×1254 RGBA PNG，真实透明背景。
- 只改 alpha，输出 RGB 与输入逐像素一致，人物不重画、不补画；验证见 `verification.json`。
- 使用源轮廓内部保护、外部连通背景判定、两个人物连通区域保留和轻微 alpha 羽化。白衣、领口、裙摆与头纱内部不直接按白色去除。
- 红底检查发现右侧白袖下缘缺口，依据源图补充保护区域后修正，未更改原图颜色。
- `preview-red.png` 与 `preview-dark.png` 仅为边缘检查底板；红色不在透明 PNG 中，不是正式请柬首帧。
- 本地检查：背景透明；两个人物主要区域完整；面部、衬衫、袖边、领口、头纱与裙摆取样 alpha 为 255。头纱保留现有图像的实色效果，不声称恢复其物理半透明材质。
- 未改网页、未部署、未消耗 PixVerse 积分。尚未合成正式首帧。

复现：用 Node 执行本目录 `matte.cjs`；依赖现有 bundled sharp 与 @napi-rs/canvas。
