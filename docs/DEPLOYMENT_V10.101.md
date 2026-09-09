# V10.101 OSS 发布记录

日期：2026-09-09。用户明确要求部署；源代码提交 `7c1789d`。

- 目标：香港 OSS `hq-wedding-hk/love.html`。
- 手机预览：https://www.zl-wedding.asia/love.html?v=10.101
- 新资源与独立页面：`previews/v10.101-20260909-7c1789d/`。
- 旧入口备份：`previews/v10.101-20260909-7c1789d/previous-love.html`（V10.100）。
- 19个依赖中14个未变化，保持V10.100资源地址并用ETag/MD5核验，避免重新下载已有照片和背景；5个新增/变更资源上传并GET逐字节校验。
- data-src延迟贴图地址与首屏preload地址均已转换为线上绝对路径，保持加载顺序。
- 先校验依赖、上传版本页和旧页备份，再检查love.html未被其他发布改动后替换；love.html经GET逐字节核验。
- HTML保持no-cache，独立版本资源长期缓存。index.html和guest.html发布前后ETag一致。
- 未部署杭州bucket，未推送GitHub，未调用生成工具。凭据未写入仓库。
- 当前环境此前的公网域名检查受办公安全策略拦截，本次未绕过策略；OSS侧发布成功，微信实际体验待用户试用。

回退需用户授权：将上述旧入口备份恢复为love.html，保留所有历史资源。
