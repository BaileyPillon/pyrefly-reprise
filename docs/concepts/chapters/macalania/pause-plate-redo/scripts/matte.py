import os, sys
os.environ["U2NET_HOME"] = r"D:\Tools\ComfyUI\rembg-models"
from PIL import Image
from rembg import new_session, remove
src, out = sys.argv[1], sys.argv[2]
s = new_session("isnet-anime")
im = Image.open(src).convert("RGB")
m = remove(im, session=s, only_mask=True)
m.save(out)
print(out, m.size)
