import sys, glob, os
from PIL import Image, ImageDraw
# python sheet.py <out.jpg> <cols> <w> <glob...>   (tiles in sorted order, labelled with the file stem)
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = []
for g in sys.argv[4:]: files += sorted(glob.glob(g))
h = w * 9 // 16
rows = (len(files) + cols - 1) // cols
S = Image.new('RGB', (cols * w, rows * h), (0, 0, 0))
d = ImageDraw.Draw(S)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    S.paste(im, ((i % cols) * w, (i // cols) * h))
    d.text(((i % cols) * w + 4, (i // cols) * h + 3), os.path.basename(f)[:-4], fill=(255, 255, 0))
S.save(out, quality=85)
print(out, len(files))
