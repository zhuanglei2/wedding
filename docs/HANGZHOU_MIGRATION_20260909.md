# 杭州默认入口迁移准备 — 2026-09-09

用户表示域名已完成ICP备案，并要求默认切到杭州。未独立查询备案记录；不在此次迁移中发布V10.104。

## 已确认

- DNS由阿里云托管：dns23.hichina.com / dns24.hichina.com。
- www的CNAME仍为hq-wedding-hk.oss-cn-hongkong.aliyuncs.com，RecordId为2084239993022865408，Line为default，TTL为600，状态ENABLE，未锁定。
- 根域名@的CNAME已为hq-wedding.oss-cn-hangzhou.aliyuncs.com；此次未改，不能因此断言根域名HTTPS可用。
- 香港桶绑定www.zl-wedding.asia（Enabled）；杭州ListCname返回无绑定。
- 香港与杭州index.html、guest.html逐字节SHA256相同；此次未覆盖这两页。
- 阿里云证书中心存在已签发、未过期证书CertificateId 26916202，覆盖www.zl-wedding.asia及zl-wedding.asia，有效期2026-08-30至2026-11-27；未购买/申请证书，未读取私钥。

## 已完成同步

- 从已部署版本重建的HTML先核对SHA256，与香港当前love.html完全一致：8dae161deae1714b09ad73eefe18f72eafdda5f356f6079857f96bd1b911d5e4。
- 杭州原本没有love.html，现已上传V10.103、独立版本index及全部19个依赖（约36.21MiB），全部GET逐字节校验成功。
- 维持资源的V10.100/V10.101/V10.103路径，HTML不改源内容。
- 杭州love.html配置no-cache；静态版本资源长期缓存。
- 香港文件和域名绑定未动。DNS未动。V10.104仍只在本地。

## 尚未切流

官方OSS文档说明同一自定义域名只能绑定一个Bucket。杭州目前无www绑定及TLS部署，直接改DNS不安全。先请用户确认是否接受迁移绑定及DNS缓存切换期间的短暂访问中断，再安排解绑/绑定/证书部署、DNS修改和验证。

后续操作须先重新核对DNS、香港绑定与两端文件，保留可恢复的域名与证书配置；不得先删香港文件。若新绑定失败，恢复旧绑定/解析；不要将准备完成说成已切换。

本次采用发布技能的验证后切流原则；所有凭据通过关闭回显的标准输入进入进程，未写入仓库。未推送GitHub。
