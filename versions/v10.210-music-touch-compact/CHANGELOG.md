# V10.210 · 音乐触摸重试与小尺寸按钮

基于 V10.209，仅修改 `music.js` 与 `music-gesture.css`。页面 HTML、图片、歌词、题字、时间轴、字库和首屏 3 秒自动翻页保持不变。

- 补充全页真实、单指 `touchstart` 的同步播放尝试；保留 `touchend` / `click`，不在 `scroll` / `touchmove` 或循环定时器中抢播，不拦截原生滑动。
- 区分“初次触摸”的挂起请求和“松手/点击”请求：后者可接替尚未结束的前者，不再被旧的统一去重标志挡住。
- 监听实际微信环境的 `WeixinJSBridgeReady`，桥存在时只补一次播放尝试；不伪造桥事件，不调用无关原生 API。已播放、手动暂停、后台、播放结束和网络错误均有保护。
- 播放重试仍挂起时保留原来显示的开启按钮；点击该按钮始终执行明确开启，不会把一次挂起的自动尝试误当作“暂停”。
- 右上角按钮视觉高度从 44px 减至 32px，文字从 14px 减至 12px，间距和阴影同步收小；透明点击范围高度仍为 44px。
- 音乐仍从 50 秒开始；页面操作不能覆盖用户的手动暂停。

## 兼容性边界

纯滑动不是所有 iOS/微信内核都认可的有声播放授权。WebKit 的相关记录：https://bugs.webkit.org/show_bug.cgi?id=212117 。以上是补充播放机会和修正请求状态，不保证绕过平台限制；仍被拒绝时，需要轻点开启按钮。本版本未做微信真机验收。

## 离线验证

在项目根目录执行：

```sh
node versions/v10.210-music-touch-compact/test-music.cjs
node versions/v10.210-music-touch-compact/test-cover-idle.cjs
node versions/v10.210-music-touch-compact/test-opening-runtime.cjs
node versions/v10.210-music-touch-compact/test-font-loader.cjs
node versions/v10.210-music-touch-compact/test-timeline.cjs
node versions/v10.210-music-touch-compact/test-assets.cjs
```

覆盖触摸开始、挂起接替、明确点击接替、实际桥就绪/重复/后台事件、拒绝状态、手动暂停、50 秒起播和 3 秒翻页；全部 96 个依赖存在，脚本语法通过。测试采用模拟 DOM/媒体与时钟，不冒充浏览器/手机实测。

2026-10-04：仅本地版本，未部署 OSS；线上仍为 V10.208。
