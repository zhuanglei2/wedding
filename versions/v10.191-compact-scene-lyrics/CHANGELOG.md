# V10.191 — 保留选定拼接画面，底部独立歌词图

- 用户最后明确改选发来的拼接画面，本次遵循该选择，不采用刚生成的完整壁画版本，不再修改上方建筑、画框或人物。
- 用户提供的 PNG 原样保留并校验 SHA256；没有在选定图片上重新生成、重绘、调色或移动人物。WebP 仅为网页优化副本。
- 使用 CSS 视口隐藏旧图底部的 “In the same light” 区域，选定图片文件仍完整保留。
- 两句用户提供的歌词单独生成透明底手写图片，置于主图最下方的独立纸面，取消顶部文字和额外字体依赖。
- 图文均保留响应式尺寸、显式宽高和后页延迟加载，不抢首屏加载。
- 本次只改新增图文页，既有页面及自动滚动逻辑保持不变。仅本地预览，未部署 OSS，未提交 Git。

## 验证

`NODE_PATH=/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node versions/v10.191-compact-scene-lyrics/verify.cjs`

`design/layout-preview.png` 是本地图像合成排版检查图，不是浏览器或手机端截图。
