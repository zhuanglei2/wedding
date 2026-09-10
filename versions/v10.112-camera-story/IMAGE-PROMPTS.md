# V10.112 素材记录

使用内置image_gen。正式接入素材：camera-clean.png。原始婚纱照没有输入模型，网页直接复用V10.106原始JPEG。

## 去除照片与底部文字的底稿

输入：V10.111/camera-invitation.png。输出原文件：/Users/eleme/.codex/generated_images/01a0767a-1153-7370-a81d-a457a19816e8/exec-a7ea371d-e906-47b6-9b6a-fa84b9d36fff.png。

Use case: precise-object-edit. Edit the attached 1024x1536 wedding page into a CLEAN PLATE for animation. Preserve pixel-aligned composition, paper texture, colors, all upper text and the camera body exactly. REMOVE only (1) the entire blue-outlined photo card emerging below the camera, including its blue outline, so the region below the camera output slot is continuous blank ivory paper, (2) both "Record of happiness" and "记录幸福", (3) the bottom names and date line. Inpaint the removed regions with the same ivory paper texture. Keep the complete red camera body and horizontal output slot, the lens and blue top-right shutter tab at the exact original positions; keep three decorative sparkles. Do not move, resize, restyle or retype anything else. No people, no new symbols. Same exact canvas dimensions 1024x1536. This is background only; original photo and original typography will be composited separately.

## 未采用的角色姿态

以下姿态生成及透明背景修正均输出RGB、背景含方格纹，未接入项目，未冒充透明素材。回退为现有可透明绘制的角色骨骼素材。

Use case: identity-preserve / animation sprite poses. Image 1 is character-design reference of the SAME wedding toy couple. Generate a clean 2x2 animation sprite atlas on a genuinely transparent alpha background, square 1024x1024. Four equally sized 512x512 cells, clear separation, no borders or text. Preserve yellow fuzzy star-person toy faces, black top hat with blue band, black tuxedo/waistcoat/white shirt/bow tie; bride cream bow, veil, intact high cream collar, cream dress and bouquet. Soft realistic plush/vinyl toy texture, same proportions/identity, not drawn human people. Do not add new accessories.
TOP LEFT cell: groom only, FULL BODY, facing 3/4 LEFT, hovering with softly bent legs, head looks down-left, leftward arm extends diagonally DOWN-LEFT with one rounded paw at approximately x20% y64% of its cell, as if gently pressing a camera shutter below him. Other arm balances slightly back. Entire body fits x15%-90% y8%-95%.
TOP RIGHT cell: bride only, FULL BODY, hovering, looking LEFT toward groom with a warm lively gaze, one free paw extended LEFT and bouquet supported by the other arm; full dress/veil/collar intact. Fits x12%-92% y8%-95%.
BOTTOM LEFT cell: groom only, FULL BODY, three-quarter facing viewer/right, head looks RIGHT toward bride, rightward paw extended horizontally RIGHT at x88% y54% of cell to meet her hand; legs gently bent for floating. Fits x10%-95% y8%-95%.
BOTTOM RIGHT cell: bride only, FULL BODY, three-quarter facing viewer/left, head looks LEFT toward groom, free leftward paw extended horizontally LEFT at x12% y54% of cell to meet his hand; keep bouquet in other arm, intact collar, veil and skirt. Fits x5%-90% y8%-95%.
These are four animation frames of two characters, not a scene of four people. Consistent scale/head size across all cells. Transparent background, no floor, no cast shadow, no camera prop, no letters.

背景修正：

Remove ONLY the baked-in gray checkerboard background from this 2x2 toy character sprite atlas and produce genuine transparent alpha (RGBA PNG). The gray squares must be replaced with 0-alpha pixels, not white or another background. Keep all four toy poses, their exact positions, size, edges, colors, clothing, collars, faces, paws, and fur fully unchanged. Same 1254x1254 canvas and 2x2 layout. Do not crop. No shadows, no text, no added objects. Background extraction only.
