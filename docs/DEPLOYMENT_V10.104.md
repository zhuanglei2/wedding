# V10.104 发布记录 — 2026-09-09

- 用户明确要求部署当前V10.104。
- 正式入口：https://www.zl-wedding.asia/love.html ，目标为杭州hq-wedding；本次未改DNS、域名绑定或HTTPS配置。
- 源版本：versions/v10.104-cover-first-paint，源提交c06e47a。
- 发布目录：previews/v10.104-20260909-c06e47a/。
- 上一版V10.103已备份至该目录previous-love.html；替换前核对原love.html的SHA256为8dae161deae1714b09ad73eefe18f72eafdda5f356f6079857f96bd1b911d5e4，且上传期间未发生并发变更。
- 16个依赖：已存在的共享资源按ETag与本地MD5核对，新增文件上传后签名GET逐字节校验。独立版本index.html、备份及正式love.html均GET逐字节校验通过。
- love.html保持no-cache；版本化资源保持长期缓存。首页index.html及guest.html发布前后ETag相同，未覆盖。香港文件保留，未发布V10.104到香港。
- 变化仅为首图加载优化：三份样式内联，外部字体延至首图解码及两个帧回调后加载；未改变请柬图像字节、压缩质量或动画设计。
- 部署前重跑validate.py及test-cover-first.cjs均通过（后者使用桌面依赖内的Node）。源版本已有完整回归记录，本次未修改源文件。
- 微信首图速度及显示需用户实测；签名OSS GET不替代公网浏览器验收。未绕过办公网络安全策略。
- 凭据仅通过关闭回显的标准输入传递，未写入仓库。发布技能用于先验证后更新入口，仍按用户要求使用阿里云OSS。未推送GitHub。
