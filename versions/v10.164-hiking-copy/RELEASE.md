# V10.164 已部署

- 正式地址：https://www.zl-wedding.asia/love.html?v=10.164
- 目标：阿里云杭州 hq-wedding，仅更新 love.html；72 个依赖和预览入口均上传并逐字节回读核对。
- 修正“爬上徒步”为“爬山徒步”；同时发布 V10.161～V10.163 的文案精简、打字/时间轴提速、第二页到第三页及第三页到第四页的自然完成后自动衔接。
- 应用提交：7ebe2f94fe6e12ecd8b26302bdbddbeb6de301a0。
- 旧版备份：previews/v10.164-20260914-d4a9104ff05d/previous-love.html。备份页面中仍指向旧资源，可用于恢复；本次未删除任何旧发布资源。
- love.html：no-cache, max-age=0, must-revalidate；版本目录资源长期缓存。延后加载字体在 JS 内的路径也已重写并检查语法。
- index.html、guest.html 在发布前后逐字节一致；没有修改香港 bucket、DNS 或证书。
- 完整依赖包约40.6MB包含历史字体与备用大图，不代表首屏实际下载量。
- 文案与动画自动回归通过；源站成功不等于微信真机视觉验收。此前正式域名遇到办公网络安全策略拦截，本次未绕过或重复测试。
- 遵循 Sites 发布检查与回退留存流程，使用用户指定的阿里云 OSS，未迁移托管平台。

完整回执见 DEPLOYMENT.json。
