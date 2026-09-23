import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
im=Image.open('m1.png').convert('RGBA'); W,H=im.size
ext=Image.new('RGBA',(W+48,H),(0,0,0,0)); ext.paste(im,(0,0)); ext.save('m1-ext.png')
a=np.array(ext)[:,:,3]>0
rows=np.where(a[:,W-1])[0]; print('cut rows',rows.min(),rows.max())
BOX=(W+48-226,H-226,W+48,H)
cr=ext.crop(BOX); bg=Image.new('RGBA',cr.size,(255,255,255,255)); bg.alpha_composite(cr); bg.convert('RGB').save('h-crop.png')
M=np.zeros((226,226),bool)
x0=W-1-6-BOX[0]  # 6 px inside the cut
M[max(rows.min()-40-BOX[1],0):min(rows.max()+30-BOX[1],226), x0:]=True
Image.fromarray((M*255).astype(np.uint8)).save('h-M.png')
Image.fromarray((M*255).astype(np.uint8)).resize((1024,1024),Image.BILINEAR).filter(ImageFilter.GaussianBlur(5)).save('h-mask1024.png')
print(BOX, M.sum())
