# Whole-figure look (FFX-2 only): named candidates side by side on grey at native pixels (no scaling).
import sys, pathlib
from PIL import Image
HERE = pathlib.Path(__file__).resolve().parent
ims = [Image.open(HERE / "renders" / f"{n}.png").convert("RGBA") for n in sys.argv[2:]]
W = sum(i.width for i in ims) + 10 * len(ims); H = max(i.height for i in ims)
out = Image.new("RGBA", (W, H), (150, 150, 160, 255)); x = 0
for i in ims: out.alpha_composite(i, (x, H - i.height)); x += i.width + 10
out.convert("RGB").save(HERE / sys.argv[1], quality=88); print(out.size)
