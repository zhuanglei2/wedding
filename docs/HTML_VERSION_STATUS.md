# HTML 版本核对 — 2026-09-09

最新完整本地婚礼请柬 HTML：`../versions/v10.100-refined-character-scale/index.html`。
页面实际 title 是“庄磊 & 吴郁 · 婚礼请柬 · V10.100”。基于 V10.71 缩小角色20%、减轻拖尾与投影，并减弱拉纸透视。已于2026-09-09按用户要求部署香港OSS；未推送GitHub。
上一个完整网页 V10.71 保留于 `../versions/v10.71-collar-and-motion/index.html`，对应提交 `142a322`。
这仍是早先的网页动画实现，未接入后面的AI视频；其中的动作问题不能当作已经修好。

V10.72–V10.99属于 experiments：部分包含技术检查HTML（如V10.75、V10.87），
其余是素材、视频、提示词或检查文档。它们不是新的完整网站版本，更不表示已经上线。

仓库旧入口情况（本次只核查，没有修改）：

- 根目录 `index.html` 仍跳转V10.12，是旧入口，不代表最新完整页面。
- `versions/index.html` 的“当前版本V10.7”标签过时。
- `versions/README.md` 的“当前版本V10.0”标签也过时。
- 版本中心与 guest.html 有用户已有未提交修改，本次未覆盖。
- 根目录没有本地 `love.html`，不能据此推断OSS上的文件内容。

线上正式链接：https://www.zl-wedding.asia/love.html 。
V10.100已上传到香港OSS的love.html，并经签名GET逐字节校验。旧入口备份已保存，首页与登记页未变。
公网访问检查被当前办公网络安全策略拦截（内部安全提示），不代表OSS部署失败；微信实际访问仍待用户确认。

本地V10.100与V10.71均保留。发布明细见 `DEPLOYMENT_V10.100.md`。
