# V10.209 · 首屏静候 3 秒自动翻页

基于 V10.208，封面图片解码并完成首帧显示后，在前台停留 3 秒且没有用户操作，自动启动原有翻页动画并衔接第二页拍照动画。

- 从页面头部开始记录真实触摸、点击、按键、滚轮和离开首屏的滚动；任一操作取消本次自动翻页，手动进入仍可使用。
- 第二页动画素材未就绪时等待，避免翻到空白页；等待中有操作同样取消。
- 切到后台清除计时，返回前台重新等待完整 3 秒。已跳转章节、恢复滚动位置、缩放、减少动态效果、素材失败或已播放时不自动触发。
- 只复用 `startTravel(false)`，不模拟点击、不抢焦点、不提前滚动、不另建第二套转场。自动翻页不视为音乐播放授权。
- 首页及后续页面图片、版式、题字、歌词、手写字形不变；保留音乐 50 秒起播、微信手势重试和时间轴 1.25 倍节奏。
- 头部操作记录以内联脚本执行，无新增网络请求；素材集合仍为 96 个文件。

## 验证

在项目根目录执行以下离线回归测试：

```sh
node versions/v10.209-idle-cover-turn/test-cover-idle.cjs
node versions/v10.209-idle-cover-turn/test-opening-runtime.cjs
node versions/v10.209-idle-cover-turn/test-music.cjs
node versions/v10.209-idle-cover-turn/test-font-loader.cjs
node versions/v10.209-idle-cover-turn/test-timeline.cjs
node versions/v10.209-idle-cover-turn/test-assets.cjs
```

测试覆盖 2999/3000ms 边界、脚本到达前的操作、前后台、慢网、异常降级、恰好一次的翻页到拍照衔接，以及现有音乐、字库和时间轴回归。测试使用模拟 DOM/时钟；未进行浏览器画面或微信真机验收。

2026-10-04：仅本地修改，未部署 OSS。线上仍为 V10.208；历史版本保留。
