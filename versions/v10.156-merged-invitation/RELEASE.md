# V10.156 发布准备

状态：2026-09-11 21:15（北京时间）已部署至杭州 hq-wedding，68 个依赖及 love.html 均已回读逐字节校验；实际结果见 DEPLOYMENT.json。

- 正式入口：https://www.zl-wedding.asia/love.html?v=10.156。
- 已备份旧入口，index.html、guest.html 的内容摘要部署前后相同；未修改香港 bucket、DNS 或证书。
- 正式域名在本机网络返回办公安全域名策略拦截（HTTP 403），未绕过拦截；因此未做正式域名及微信真机验收。OSS 源站回读验证成功。

- 合并来源：V10.155-more-memories + V10.154-two-line-invitation。
- 目标：杭州 hq-wedding 的 love.html。不修改 index.html、guest.html、香港 bucket、DNS 或证书。
- 校验入口：`node versions/v10.156-merged-invitation/test.cjs`，并执行 V10.155 的时间轴回归测试。
- 发布包：`release-manifest.json`；递归校验 HTML/CSS 的 68 个本地依赖。完整归档约 47 MB，不代表首屏下载量。
- 只做预检：`python3 versions/v10.156-merged-invitation/publish.py`。
- 用户明确部署授权有效，且本机已有 ossutil 配置后，执行 `python3 versions/v10.156-merged-invitation/publish.py --deploy --credentials-file /绝对路径/OSS配置文件`。不要将密钥写入仓库、聊天或命令参数。
- 发布流程：冻结包校验 → 读取现有入口 → 备份旧 love.html → 上传并回读依赖及独立版本 → 检查并发变更 → 最后替换 love.html → 回读核对全部内容及另外两个入口未改变。
- 未验证微信真机视觉效果。部署完成后须记录实际返回的 DEPLOYMENT_RESULT，不能仅凭上传尝试宣称已上线。
