# V10.126 OSS 发布记录 — 2026-09-11

- 用户明确要求“部署到oss”。仅发布杭州 `hq-wedding/love.html`；未改香港、DNS、域名绑定、证书、首页或登记页。
- 来源：`versions/v10.126-instant-paper/index.html`，提交 `f0233a6ffe74f30ea13cb1dc681c273714f00dc7`。发布前仅修正页脚遗留的 V10.125 标签为 V10.126；没有改变画面或动画。
- 手机链接：https://www.zl-wedding.asia/love.html?v=10.126 。固定入口仍是 love.html。
- 独立版本：https://www.zl-wedding.asia/previews/v10.126-20260911-f0233a6/index.html 。
- 18 个资源共 46,809,523 字节，完整上传并签名 GET 逐字节核对。这个数值包含未必请求的历史字体、后续照片、原照留档和各档响应式副本，不代表首屏传输量。保留 V125 封面优先、响应式选择、后续按需加载与单脚本请求。
- 发布 HTML 仅改资源路由到本次版本目录；`#our-story` 原位锚点保留；登记链接为既有 `/guest.html`；页脚指向独立版本。未上传用户正在修改的版本中心。
- 线上 HTML：57,482 字节，SHA256 `f7d1129e1db0dea618a1b9ed47b29204a330d5ca6df66c2a74f429f7893ddaf4`；回读缓存头 `no-cache, max-age=0, must-revalidate`。
- 旧入口实际为 V10.119，先逐字节备份到 `previews/v10.126-20260911-f0233a6/previous-love.html`，SHA256 `a8c6d5a2fba1d7237892172153a8d7a463526e345254fd74dd5690fd528b7e36`。资源和独立页通过后，重新读取旧入口确认未并发变动，最后覆盖并回读 love.html。
- 首页 index.html 发布前后 SHA256 均为 `9745f0d95a1b26dbf8ca7f86299152e3e4213f311708182b149c868deae1677c`；guest.html 均为 `38eb940d81f347906be6d00dfededc2ea3516a80eb499f4160ebdbfddef624e7`。与本次发布前快照一致；本次没有覆盖这两个文件。
- 复用 V126 已通过的 9 组离线检查，并重新解析发布用资源依赖。未进行浏览器像素或微信真机测速；签名 OSS 校验不等同于手机体验验收。
- 凭据仅通过关闭回显的标准输入进入临时进程，不写入仓库或文件。未推送 GitHub。临时发布脚本为 `/private/tmp/wedding-publish-v10126.py`（不含凭据，非长期配置）。

## 回退

取得用户回退授权后，将上述 previous-love.html 原样恢复至 love.html，保留 no-cache 并回读校验；不要删除历史资源或改动首页、登记页。
