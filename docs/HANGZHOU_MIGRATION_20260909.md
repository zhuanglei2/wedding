# 杭州默认入口迁移记录 — 2026-09-09

用户表示域名已完成ICP备案，并要求默认切到杭州。未独立查询备案记录；不在此次迁移中发布V10.104。

## 迁移前核查（历史状态）

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

## 迁移前审批（已获批准）

官方OSS文档说明同一自定义域名只能绑定一个Bucket。杭州目前无www绑定及TLS部署，直接改DNS不安全。先请用户确认是否接受迁移绑定及DNS缓存切换期间的短暂访问中断，再安排解绑/绑定/证书部署、DNS修改和验证。

后续操作须先重新核对DNS、香港绑定与两端文件，保留可恢复的域名与证书配置；不得先删香港文件。若新绑定失败，恢复旧绑定/解析；不要将准备完成说成已切换。

本次采用发布技能的验证后切流原则；所有凭据通过关闭回显的标准输入进入进程，未写入仓库。未推送GitHub。

## 已完成切换

用户明确回复“可以”，同意域名迁移及可能的短暂中断。2026-09-09 08:56 UTC（北京时间16:56）完成以下控制面核验：

- 杭州 `hq-wedding` 的 `www.zl-wedding.asia` 绑定为 Enabled，HTTPS 证书状态为 Enabled。
- 复用现有证书，部署后的 OSS CertId 为 `27158977-cn-hangzhou`，到期日仍为2026-11-27。未购买或申请新证书。迁移时读取现有证书与私钥，仅保留在进程内存中，未写入文件或输出。
- 将原 www 记录 `2084239993022865408` 更新为 `hq-wedding.oss-cn-hangzhou.aliyuncs.com`，回读确认一致；TTL600、default线路不变。
- 另行查询 dns23.hichina.com 和 dns24.hichina.com，两台权威DNS均返回上述杭州CNAME、TTL600。
- 为完成 OSS 所有权验证新增 `_dnsauth.www` TXT，RecordId `2097609946996459520`；未覆盖已有验证记录。验证值未写入本文件。
- 切换后重新签名GET杭州love.html，SHA256仍为上文V10.103值。V10.104未部署，图片、布局、动画未改。
- 香港只移除了www域名绑定，文件均保留；根域名@解析、首页index.html、guest.html未修改。
- API核验不等于微信实测。当前办公网络此前拦截正式域名，未绕过安全策略；微信可用性及首图速度需要用户刷新确认。旧DNS缓存可能暂时仍命中香港。

## 切换过程中的故障与恢复

首次杭州PutCname返回成功后，立即ListCname尚未返回绑定。执行脚本把传播延迟误判为失败，触发了不必要的回退；香港重新绑定先返回CnameAlreadyExists，随后在删除杭州绑定后返回NeedVerifyDomainOwnership。这造成域名绑定暂时缺失，期间DNS仍指向香港，正式入口存在不可用窗口；没有删除网站文件。

恢复时重新核查两桶绑定均为空，按照官方CreateCnameToken流程新增上述TXT验证。杭州再次绑定成功后，采用轮询等待域名及HTTPS均Enabled，再修改DNS并回读确认，未再次立即删除待传播的绑定。

教训：变更API返回成功后必须考虑控制面最终一致性；回退也可能需要域名所有权验证，不能把“重新绑定原桶”视为必然即时成功。后续迁移应预先准备两端验证与证书，并使用有界轮询。

## 回退注意

香港文件可用于回退，但不能只改DNS。需先验证香港的域名所有权/证书可用，获准后迁移www绑定、等待Enabled，再将上述www记录恢复香港目标；当前TXT为杭州验证值，不假定香港可直接复用。不得删除任一桶文件。此次仅记录迁移，不推送GitHub。
