# 婚礼星星人素材来源

## V10.62 当前动画素材

- 以此前选中的婚礼双人星星人作为参考，内置 imagegen 生成可分离双臂、双腿的素材；提示词见 rig-prompt.txt，原输出见 rig-atlas-original.png。
- 原输出带实画棋盘格，不是真透明。用户明确同意本地抠图后，以 matte-rig.py 添加透明遮罩；输出 rig-atlas.png 为 1774×887 RGBA，RGB 与生成原件逐像素一致。
- character-rig.js 只裁取上述贴图部件并做关节旋转；不重绘真人照片。它是 2D 分层木偶动画，不是完整 3D 模型或逐帧视频。
- star-couple.png 与以下历史素材保留用于回溯，当前角色动画不再使用整张双人抠图。

## 历史参考素材

- 用户选中：POP MART Twinkle Twinkle Crush On You 婚礼双人款。
- 产品来源：https://www.popmart.com/ms-MY/products/10343/twinkle-twinkle-crush-on-you-series-vinyl-plush-doll-gift-box
- 参考图：https://prod-eurasian-res.popmart.com/default/20260120_164325_711855____1_____1200x1200.jpg
- 本地原件：star-couple-reference.jpg。页面使用：star-couple.png（1007×673，RGBA）。
- 处理授权：用户于本轮确认本地抠图，仅去背景、不重画角色。
- 处理方式：matte-couple.py 以边界连通的中性浅灰背景为透明区，保护浅色衣服与蝴蝶结，羽化 alpha 边缘，裁掉外围空白；RGB 与原件对应区域完全相同。
- 不修改任何新人照片；不新增角色造型；不使用此前生成的棋盘格图片。
- 这是个人邀请网页的角色参考素材，不代表 POP MART 官方合作或品牌授权。
- 本次未调用在线图片生成/抠图服务。macOS 本地识别接口不可用后，采用可复现的本地像素遮罩处理。

## 查看方式

打开 index.html（不要带 #our-story），点击首屏请柬任意位置即可播放转场进入第二页，也可以继续向下滑动。无可见按钮或提示文字；键盘可聚焦入口并按 Enter。系统开启减少动态效果或动画资源未就绪时，点击通过原生页内链接进入第二页。
