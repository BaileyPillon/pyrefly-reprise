import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
im=np.array(Image.open(sys.argv[1]).convert('RGBA')).astype(int)
rgb=im[:,:,:3]; op=im[:,:,3]>0
mn=rgb.min(2); mx=rgb.max(2)
edge=op&~ndi.binary_erosion(op,np.ones((3,3)),border_value=0)
wh=edge&(mn>=205)&((mx-mn)<=34)
print('edge px',edge.sum(),'white edge px',wh.sum())
# opaque near-white regions adjacent to transparency (within 3px)
near=op&ndi.binary_dilation(~op,iterations=3)&(mn>=225)&((mx-mn)<=22); print('near-white within 3px of transparency',near.sum())
lab,n=ndi.label(op,np.ones((3,3))); s=ndi.sum(op,lab,range(1,n+1)); print('islands',n,'sizes',sorted([int(x) for x in s])[:10])
holes=ndi.binary_fill_holes(op)&~op; l2,n2=ndi.label(holes); print('enclosed holes',n2, sorted([int(x) for x in ndi.sum(holes,l2,range(1,n2+1))])[-10:])
# enclosed opaque white blobs (bg trapped)
wb=op&(mn>=235)&((mx-mn)<=15); l3,n3=ndi.label(wb); s3=ndi.sum(wb,l3,range(1,n3+1)); print('opaque white blobs >30px', [(int(x), tuple(int(v) for v in ndi.center_of_mass(wb,l3,i+1))) for i,x in enumerate(s3) if x>30][:20])
ys,xs=np.where(op); print('bbox',xs.min(),ys.min(),xs.max(),ys.max(),'size',im.shape[1],im.shape[0])
