# V10.80 · 平整满版、手掌贴面首帧

状态：角色姿态草稿已生成，透明图层检查未通过，尚未合成为首帧。不调用 PixVerse，不生成视频，不部署。

使用内置 image_gen 编辑角色姿态层。唯一输入是 `versions/v10.71-collar-and-motion/star-couple.png`，不将真人照片或请柬文字交给模型。
正式底图直接引用原 `cover.webp`，不缩放改比例、不裁切、不预先翘角、不露底板；预览尺寸随屏幕等比显示属于正常网页响应式呈现。

## 角色图层生成提示词

Use case: precise-object-edit. Create a genuinely transparent RGBA overlay of exactly the two plush wedding characters from the input reference. The reference is the identity and wardrobe source. Change only their poses, gaze and arrangement; preserve the original recognizable vinyl faces, yellow plush heads, proportions, and complete detailed wedding outfits. No redesign, no added characters.

Layout: a compact square transparent canvas, not a scene. Groom occupies the upper RIGHT, bride the lower LEFT, with a clear diagonal gap between their silhouettes. Both full bodies, hat, shoes, bow, veil and dress fully inside the canvas. The groom is slightly higher, bride lower; they do not touch each other. Each figure occupies approximately 55 percent of the canvas height, with the groom spanning y=3% to 58%, and bride y=41% to 97%. The bride spans x=3% to 51%, groom x=52% to 97%. Preserve natural proportions rather than stretching them to fit.

Groom pose: body in gentle three-quarter view facing screen-right, recognizable face still visible, eyes focused on his raised hand. His screen-right arm reaches toward the right boundary, elbow softly bent, the flat plush palm lightly resting against an imagined frontal flat invitation surface. The palm must remain inside the frame and be visible, fingers/mitten not curled around anything. This is a relaxed pre-action contact, NOT a grip or pull, not a wave. Other arm rests naturally. A small relaxed bend in his knees, no dramatic lean. Keep the black top hat, blue embroidered hatband, white shirt and complete collar, black bow tie, black waistcoat, blue pocket square, trousers and black-and-white shoes.

Bride pose: complete original gown, bow, veil, pearl necklace, intact original neckline and flower arrangement. She is lower and to his left, looking gently up and right toward him, with a small head-and-shoulder turn. Hands remain naturally near her flowers; do not add an extra assisting hand. Keep the red heart bow detail, white fabric, gold embroidery and full skirt. Her neckline must remain connected and fully clothed with no exposed or cut-out neck artifacts.

Soft neutral studio lighting, photographic vinyl and plush texture matching the source, clean fine transparent edges. Background must be genuinely transparent, not a drawn checkerboard. No red background, no paper, no visible wall, no tabletop, no border, no shadows outside the silhouettes, no motion trails, no symbols or extra text. This is only a foreground character overlay; the real invitation will be supplied separately without regeneration.

## 当前方案替代 V10.79 的部分

- 首帧不露暗红切边、不预先翘边；男孩没有预先抓稳。
- 动画顺序应为贴面 → 手腕与肩膀带起右侧封面 → 建立边缘抓握 → 完整翻开。
- 女孩保留较低错位站位，观察后稍晚跟随，不新增身体接触。
- 真实视频换贴图、抠像及手机衔接仍需验证；静态叠层预览不等于这些问题已解决。

## 实际输出与检查

- 初稿：`characters-generated.png`，内置 image_gen 生成，1254×1254，RGB 三通道，无 alpha；背景为实画棋盘格。
- 一次定向修正请求为“只去掉棋盘背景，保留前景与布局不变，输出真实 RGBA”，结果仍为 RGB 三通道无 alpha。未无限重试。
- 第二次原输出保留在 `/Users/eleme/.codex/generated_images/01a0767a-1153-7370-a81d-a457a19816e8/exec-ac597d1a-fef9-4c02-80b2-70b6091a7c26.png`，不作为正式可用资源引用。
- 目视：男右上、女左下且未互相接触；男孩手掌展开，仍有近似抬手示意的歧义，必须叠到纸面检查；不能称抓握已完成。服装大形完整，但这是重生成的姿态，细节不是源像素级保留。
- 未修改 `cover.webp` 或任何真人照片、姓名、文案。未生成完整叠层网页，避免把不透明棋盘图误当可用素材。
- imagegen 技能默认走内置编辑；本次工具未产出真正透明图层。下一步需要用户允许改用本地抠图，仅处理背景，保留原件并检查白色头纱和领口。
