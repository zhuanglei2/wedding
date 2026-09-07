"""Display-only horizontal crop; retain the original photograph and approved art."""
from pathlib import Path
import hashlib
from PIL import Image, ImageOps, ImageChops

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SOURCE = ROOT / 'assets/portrait-studio.jpg'
original_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
base = Image.open(HERE.parent / 'v10.50-seal-mobile/invitation-v10.50.png').convert('RGB')
photo = ImageOps.exif_transpose(Image.open(SOURCE)).convert('RGB')
crop_box = (round(photo.width * .20), 0, round(photo.width * .90), photo.height)
cropped = photo.crop(crop_box)
photo_width, photo_top = 872, 1344
old_height = ImageOps.contain(photo, (872, 584)).height
new_height = round(photo_width * cropped.height / cropped.width)
delta = new_height - old_height
photo_left = (base.width - photo_width) // 2
canvas = Image.new('RGB', (base.width, base.height + delta))

# Keep all upper artwork and all lower text pixel-identical. Only stretch the
# paper strips beside the photo to accommodate its new height, then cover the
# old photo region completely with an undistorted, source-derived crop.
canvas.paste(base.crop((0, 0, base.width, photo_top)), (0, 0))
band = base.crop((0, photo_top, base.width, photo_top + old_height))
canvas.paste(band.resize((base.width, new_height), Image.Resampling.LANCZOS), (0, photo_top))
canvas.paste(cropped.resize((photo_width, new_height), Image.Resampling.LANCZOS), (photo_left, photo_top))
lower = base.crop((0, photo_top + old_height, base.width, base.height))
canvas.paste(lower, (0, photo_top + new_height))

assert ImageChops.difference(canvas.crop((0, 0, base.width, photo_top)), base.crop((0, 0, base.width, photo_top))).getbbox() is None
assert ImageChops.difference(canvas.crop((0, photo_top + new_height, canvas.width, canvas.height)), lower).getbbox() is None
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == original_hash
canvas.save(HERE / 'invitation-v10.51.png', optimize=True)
canvas.resize((700, round(canvas.height / 2)), Image.Resampling.LANCZOS).save(HERE / 'preview-v10.51.png')
print(f'PASS: source unchanged; crop={crop_box}; photo={photo_width}x{new_height}; poster={canvas.size}; lower shift={delta}px')
