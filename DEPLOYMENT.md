# 发布约定

仅在用户明确要求部署时上传 OSS；普通修改只保存在本地并建立 Git commit，不自动部署。

明确部署时，最新版发布至 https://www.zl-wedding.asia/love.html，对应杭州 bucket hq-wedding（2026-09-09已迁移，见 docs/HANGZHOU_MIGRATION_20260909.md）。香港 bucket hq-wedding-hk 保留旧文件，不自动同步。保留历史版本并备份旧 love.html，不修改线上 index.html 或 guest.html。凭据不得写入仓库。

最新已部署版本为V10.119，发布记录见 docs/DEPLOYMENT_V10.119.md。发布前先校验并上传完整依赖、保存旧入口，最后更新love.html；发布后下载核对文件内容。
