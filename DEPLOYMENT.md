# 发布约定

仅在用户明确要求部署时上传 OSS；普通修改只保存在本地并建立 Git commit，不自动部署。

明确部署时，最新版发布至 https://www.zl-wedding.asia/love.html，对应杭州 bucket hq-wedding（2026-09-09已迁移，见 docs/HANGZHOU_MIGRATION_20260909.md）。香港 bucket hq-wedding-hk 保留旧文件，不自动同步。保留历史版本并备份旧 love.html，不修改线上 index.html 或 guest.html。凭据不得写入仓库。

最新已部署版本为 **V10.226**（男生湖边照加回、故事标题调正，2026-10-04），发布记录见 `versions/v10.226-lakeside-pair-straight-title/DEPLOYMENT.json`。女生湖边照片第 2 张，男生湖边原照第 3 张，堆叠共 13 组/16 张；只取消「故事的开始，是你」标题旋转。V10.225 的其余照片及顺序、四宫格、草坪婚纱照尺寸、文案、音乐循环和其他页面不变。

86 个发布依赖全部上传并逐字节下载校验，最终 love.html 下载校验通过。第二张女生 PNG、第三张男生 WebP、标题调正 CSS、145,616 字节字体子集与 WOFF2 MIME/长期缓存、MP3 Range 请求均通过。线上 index.html、guest.html 保持原字节不变。旧 V10.225 入口备份至 `previews/v10.226-20261004-6e6a0ed309bb/previous-love.html`。本轮完成离线回归与 OSS 源站校验，未做浏览器视觉或微信真机验收。自动翻页不构成用户激活；若微信拦截有声自动播放，仍需点击音乐按钮。

正式域名访问限制：上次 V10.225 发布时，当前办公网络返回云壳域名安全策略拦截的 HTTP 403。本轮未重复访问或绕过该限制。V10.226 的 OSS 源站签名 GET 返回页面 90,524 字节，与部署字节完全一致；正式域名实际打开效果未验收。
