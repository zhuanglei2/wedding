# V10.103 OSS 发布记录

日期：2026-09-09。用户明确要求部署；源代码提交 `233f069`。

- 目标：香港 OSS `hq-wedding-hk/love.html`。
- 手机预览：https://www.zl-wedding.asia/love.html?v=10.103
- 独立版本与变更资源：`previews/v10.103-20260909-233f069/`。
- 原入口备份：`previews/v10.103-20260909-233f069/previous-love.html`，保留部署前线上页面。
- 发布包含V10.102原位翻页修复与V10.103有先后的牵手离场；不含暂缓的微信安全区域适配。
- 共19个依赖：16个沿用V10.100/V10.101地址并核对ETag/MD5，3个变更文件（page-turn.css、page-turn.js、page-turn-math.js）上传后GET逐字节校验。
- 先验证依赖、上传版本页和旧入口备份，再确认love.html没有并发变更，最后替换并GET逐字节验证成功。
- HTML使用no-cache；版本资源长期缓存。index.html、guest.html发布前后ETag一致。
- 仅香港bucket；未推送GitHub，凭据未写入仓库，未调用生成工具。
- 未进行微信真机验收；公网域名此前被办公网络安全策略拦截，本次未绕过。上述验证通过官方OSS接口完成。

回退需用户授权：将此版本的previous-love.html恢复到love.html；历史资源保留。
