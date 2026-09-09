# V10.100 OSS 发布记录

日期：2026-09-09。用户明确要求部署；源代码提交 `2e9e74f`。

- 目标：香港 OSS `hq-wedding-hk` 的 `love.html`。
- 正式入口：https://www.zl-wedding.asia/love.html
- 手机检查链接：https://www.zl-wedding.asia/love.html?v=10.100
- 资源与独立页面：`previews/v10.100-20260909-2e9e74f/`，共19个资源。
- 旧入口备份：`previews/v10.100-20260909-2e9e74f/previous-love.html`。
- 资源先上传并逐字节读取校验，再发布版本页与备份；确认旧 love.html 未被其他发布改动后更新固定入口，并再次读取校验。
- 页面使用 no-cache；版本独立资源使用长期缓存。HTML 内本地引用转换为部署资源路径，登记链接保持 `/guest.html`。
- 上传前后 index.html 与 guest.html 的 ETag 相同。本次没有修改首页、登记页或部署杭州 bucket，没有推送 GitHub。
- OSS 上传与签名读取校验成功。公网域名检查被当前办公网络安全策略拦截，响应为内部域名允许范围提示，不是 OSS 文件缺失；未绕过拦截，微信真机待用户确认。
- 发布脚本在临时目录；凭据仅通过关闭回显的标准输入进入进程，未写入仓库或本记录。

回退时须用户授权：将上述备份恢复至 love.html；旧版资源保留。
