# sam_mask.py in.png out_mask.png '{"pos":[[x,y]],"neg":[[x,y]],"box":[x0,y0,x1,y1],"pick":"best|small|large"}'
import sys, os, json, numpy as np
from PIL import Image
import torch
torch.jit.script = lambda f, *a, **k: f
spec=json.loads(sys.argv[3])
im=Image.open(sys.argv[1]).convert('RGBA')
bg=Image.new('RGBA',im.size,(128,128,128,255)); bg.alpha_composite(im); rgb=np.asarray(bg.convert('RGB'))
cwd=os.getcwd(); os.chdir('D:/Tools/sam2/repo')
from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor
dev='cuda' if torch.cuda.is_available() and torch.cuda.mem_get_info()[0]>2*1024**3 else 'cpu'
model=build_sam2('configs/sam2.1/sam2.1_hiera_s.yaml','D:/Tools/sam2/checkpoints/sam2.1_hiera_small.pt',device=dev); os.chdir(cwd)
p=SAM2ImagePredictor(model)
pos=spec.get('pos',[]); neg=spec.get('neg',[])
pts=pos+neg; lab=[1]*len(pos)+[0]*len(neg)
with torch.inference_mode():
    p.set_image(rgb)
    logits,scores,_=p.predict(point_coords=np.array(pts,np.float32) if pts else None, point_labels=np.array(lab) if pts else None,
        box=np.array(spec['box'],np.float32) if 'box' in spec else None, multimask_output=True, return_logits=True)
areas=(logits>0).reshape(3,-1).sum(1)
pick=spec.get('pick','best')
i=int(np.argmax(scores)) if pick=='best' else (int(np.argmin(areas)) if pick=='small' else int(np.argmax(areas)))
print(dev,'scores',scores.round(3).tolist(),'areas',areas.tolist(),'pick',i)
m=(logits[i]>0)
Image.fromarray((m*255).astype(np.uint8)).save(sys.argv[2])
ov=rgb.copy().astype(float); ov[m]=ov[m]*0.5+np.array([255,0,255])*0.5
for q in pos: ov[max(0,q[1]-2):q[1]+3,max(0,q[0]-2):q[0]+3]=[0,255,0]
for q in neg: ov[max(0,q[1]-2):q[1]+3,max(0,q[0]-2):q[0]+3]=[255,0,0]
Image.fromarray(ov.astype(np.uint8)).save(sys.argv[2][:-4]+'-ov.png')
