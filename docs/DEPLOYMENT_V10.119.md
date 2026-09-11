# V10.119 OSS 发布记录 — 2026-09-11

- 用户明确要求“部署到oss给我看看”。目标仍为杭州 `hq-wedding/love.html`；没有修改DNS、域名绑定、HTTPS或香港对象。
- 来源：`versions/v10.119-underlay-continuation/index.html`，提交 `7ddc4bc`。
- 手机预览：https://www.zl-wedding.asia/love.html?v=10.119 。固定入口仍是love.html，参数用于微信重新打开新版。
- 独立版本：https://www.zl-wedding.asia/previews/v10.119-20260911-7ddc4bc/index.html 。
- 发布目录：`previews/v10.119-20260911-7ddc4bc/`。相机画面、真实照片和全部23个依赖完整发布，不修改照片字节或动画时序。资源总计46,232,170字节；保留原有按需加载方式。
- 部署用HTML/CSS只改资源路由到本次版本目录；登记链接指向已有 `/guest.html`，页脚版本链接指向独立版本页，未上传用户正在修改的版本中心。
- 发布后的HTML为44,180字节，SHA256：`a8c6d5a2fba1d7237892172153a8d7a463526e345254fd74dd5690fd528b7e36`。
- 前一线上页面实际标题为V10.104，SHA256：`43df25f2818fb01f6a0fe8afdb7d73d5c6b190452af57820a4e8f095ef752f4f`；已备份为本次目录中的 `previous-love.html`，备份与原页面逐字节相同。
- 先上传/校验依赖及独立版本，重新读取love.html确认上传期间没有并发修改，再替换love.html，签名GET逐字节校验成功。仅这一个既有入口被覆盖；历史资源均保留。
- HTML缓存头回读：`no-cache, max-age=0, must-revalidate`。版本化依赖上传时使用长期不可变缓存。
- 首页index.html发布前后SHA256：`9745f0d95a1b26dbf8ca7f86299152e3e4213f311708182b149c868deae1677c`；guest.html：`7eae96ebfc6d75960ebfe95ef6b259f73bd659fc1854d7da8c5f23f3702ad7cc`。两者均未变化。本次HEAD未返回ETag，因此改用完整GET及SHA256核对，不将缺失ETag视为有效校验。
- 发布前重跑本版全部六组离线测试通过。源文件无修改；没有浏览器像素、微信显示/速度验收，OSS接口成功不等同于这些实测。
- 发布技能用于先验证依赖、备份后更新入口；遵照用户指定沿用阿里云OSS，没有新建其他托管服务。凭据仅由关闭回显的标准输入传给临时进程，未写入文件或仓库。未推送GitHub。

## 回退

取得用户回退授权后，将本次目录的 `previous-love.html` 原样恢复到love.html，保留no-cache，并回读校验。不要删除任一版本资源，也不要改动首页或登记页。
