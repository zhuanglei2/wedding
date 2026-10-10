# V10.211 · 首屏素材就绪后自动尝试播放音乐

基于 V10.210，将第一次自动播放尝试从音乐脚本执行时，改为首屏封面和人像裁切层的图片完成加载、解码并经过显示帧之后。无需滑动或等到第二页，音乐仍从 50 秒开始。

- 新增 `cover-music-ready.js`，只检查 `.image-cover picture img`；不等待第二页照片和后面的懒加载图集，也不以整页 `window.load` 为条件。
- 首屏准备好且页面位于前台时，触发一次有声播放请求；缓存图片、重复就绪事件不会重复播放或重置进度。
- 初始素材未就绪时，微信桥和全页触摸不会抢先自动播放；明确点击播放器仍立即响应，不把有效点击异步推迟。
- 隐藏期间不播放；回到前台后等首屏显示完成。手动暂停优先于后来到达的素材通知。
- 封面加载/解码失败或就绪模块不可用时保留手动开启入口；浏览器拒绝自动播放时如实显示小按钮，不伪造播放成功。
- 保留 V10.210 的 32px 高音乐按钮、44px 点击范围、触摸重试和微信桥单次尝试，以及 V10.209 的首屏 3 秒自动翻页。其他页面、图片、歌词、字体和时间轴均不变。

## 验证

在项目根目录执行：

```sh
node versions/v10.211-cover-ready-music/test-cover-music-ready.cjs
node versions/v10.211-cover-ready-music/test-music.cjs
node versions/v10.211-cover-ready-music/test-cover-idle.cjs
node versions/v10.211-cover-ready-music/test-opening-runtime.cjs
node versions/v10.211-cover-ready-music/test-font-loader.cjs
node versions/v10.211-cover-ready-music/test-timeline.cjs
node versions/v10.211-cover-ready-music/test-assets.cjs
```

首屏就绪模块与真实音乐脚本联合运行的模拟测试覆盖加载、解码、显示帧、前后台、慢网、失败、手动优先和自动播放拒绝；原有回归保持通过。所有 97 个资源依赖存在、脚本语法通过。

验证使用模拟 DOM/媒体及离线检查，不是 iPhone/安卓微信真机验收。素材加载完成本身不会赋予浏览器的有声播放权限；平台拒绝时仍需点击开启。

2026-10-04：仅本地版本，未部署 OSS。线上仍为 V10.208。
