"""Option C (FFX only): keep A's shoulder and spiral tattoo exactly: zero the paste mask inside a feathered ellipse over
the upper arm, then paste.py a.q4 + c2.p2 with this mask -> c2.p2.final.png."""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
m = Image.open('work/c2.maskL.png').convert('L')
k = Image.new('L', m.size, 255); ImageDraw.Draw(k).ellipse((522, 662, 800, 935), fill=0); k = k.filter(ImageFilter.GaussianBlur(6))
ImageChops.multiply(m, k).save('work/c2.maskL-tattoo.png')
