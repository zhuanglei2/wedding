# V10.132 OSS 发布记录 — 2026-09-11

- 用户明确要求“部署到oss”。发布杭州 `hq-wedding/love.html`；未改香港、DNS、域名绑定、证书、首页或登记页。未发布其他工作中的 V10.133。
- 来源：`versions/v10.132-left-cannon-right-fireworks/index.html`，提交 `333a07f5cd3f6ce5386b3b1f25a7966b33968b35`。版本目录发布前无未提交变更；复用此前通过的 11 项自动检查，无样式或动画改动。
- 手机链接：https://www.zl-wedding.asia/love.html?v=10.132 。固定入口仍是 `love.html`。
- 独立版本：https://www.zl-wedding.asia/previews/v10.132-20260911-333a07f/index.html 。
- 19 个依赖共 47,154,693 字节，全部上传并通过签名 GET 逐字节验证，包括原 V10.131 手绘素材供左右显示窗口共用。总量包含后续按需加载照片、历史字体、原照留档及响应式副本，不等于首屏传输量。
- HTML 仅将本地资源路由改为本次版本目录；保留 `#our-story`，登记链接指向既有 `/guest.html`，未发布用户正在修改的版本中心。
- 线上 HTML：61,572 字节；SHA256 `7f0bfeff12876b007dc55ec5574b67b9e5e1e1851f1ffcd2eaedf4b7eca96500`；回读缓存头 `no-cache, max-age=0, must-revalidate`。
- 旧 V10.126 入口已逐字节备份至 `previews/v10.132-20260911-333a07f/previous-love.html`；SHA256 `f7d1129e1db0dea618a1b9ed47b29204a330d5ca6df66c2a74f429f7893ddaf4`。先验证资源及独立版本，再检查旧入口无并发变更，最后更新并回读 `love.html`。
- `index.html` 发布前后 SHA256 均为 `9745f0d95a1b26dbf8ca7f86299152e3e4213f311708182b149c868deae1677c`；`guest.html` 均为 `38eb940d81f347906be6d00dfededc2ea3516a80eb499f4160ebdbfddef624e7`。本次没有修改这两个文件。
- OSS 签名回读验证全部通过。正式域名 GET/HEAD 在当前办公网络返回安全策略 403，正文明确为域名不在允许范围内，并非 OSS XML 错误；未绕过拦截。不能据此声称已验证手机公网访问、微信效果或浏览器像素。
- 凭据仅以关闭回显的标准输入传入临时进程，不写入文件或仓库。未推送 GitHub。临时部署脚本 `/private/tmp/wedding-publish-v10132.py` 复用此前已验证的 V10.126 发布器并锁定请求版本，不含凭据。

## 回退

取得用户明确回退授权后，将上述 `previous-love.html` 原样恢复为 `love.html`，保留 no-cache 并回读校验。保留历史资源，不修改首页或登记页。
