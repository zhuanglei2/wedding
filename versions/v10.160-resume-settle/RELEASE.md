# V10.160 已部署

- 正式地址：https://www.zl-wedding.asia/love.html?v=10.160
- 目标：阿里云杭州 hq-wedding。70 个依赖、独立预览入口和 love.html 均已上传并回读逐字节核对。
- 保留首屏、图片和其他页面，发布第三页滑动后续播修复，以及 V10.159 的手绘标题、鎏金衔接和素材优化。
- 延后加载的 FontFace 字体 URL 已一起重写为本次发布包绝对路径；发布前验证重写后 JS 语法，避免线上字体丢失。
- love.html 缓存策略：no-cache, max-age=0, must-revalidate；所有发布包依赖采用版本目录和长期缓存。
- 旧 love.html 已备份：previews/v10.160-20260911-0f09ba56f07a/previous-love.html
- index.html、guest.html 发布前后摘要一致；未修改香港 bucket、DNS 或证书。
- 发布包完整依赖约 40.6MB，包含历史字体和备用大图，不代表首屏实际下载量。
- 此前正式域名遭办公网络策略拦截，本次不绕过、不重复尝试；确认的是 OSS 源站内容，而非微信真机视觉验收。
- 原始结果见 DEPLOYMENT.json。应用修改对应本地提交 4c700c998288bab3dad756b93aaf709862a20916。

本次参照 Sites 发布检查规范，使用项目原有阿里云发布器；没有迁移到 Sites/Cloudflare 托管。
