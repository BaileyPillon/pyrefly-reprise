"""ro_pilot_sigma.py: the init-lock sigma pilot (driver, 2026-10-05): Tidus idle and attack, seed 9101: today | D (sigma 0.99, the library's) | sigma 0.995, both with the face pass and the full palette lock.
It runs as a second GPU client beside the roll-out (one prompt in flight, shared lock file), so it slots between the roll-out's figures; the face pass and the ESRGAN step reuse the roll-out's files."""
import sys, json
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from ro_common import *
import ro_cpu, ro_gpu, ro_view
from lock_lib import gpu_run, upload, png_bytes, say, g_klein_lock
from PIL import Image
OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-05-painterly-cast/pilot-sigma-0995'
heads = load_json(f'{RW}/heads.json')
res = {}
for i in ('characters/tidus/idle', 'characters/tidus/attack'):
    a = [x for x in plan() if x['id'] == i][0]
    head = (heads.get(i) or {}).get('box')
    wd = f'{RW}/{i}'
    S, w, h = a['S'], a['w'], a['h']
    pw = f'{OUT}/work/{i}'
    os.makedirs(pw, exist_ok=True)
    ref_path = f'{pw}/klein-s9101.png'
    if not os.path.exists(ref_path):
        T = ro_cpu.today(a)
        ws = work_scale(w, h); cw, ch = int(round(w * ws)), int(round(h * ws)); W, H = r16(cw), r16(ch)
        ref = Image.new('RGB', (W, H), (255, 255, 255)); ref.paste(ro_gpu.flat_white(T.resize((cw, ch), Image.LANCZOS)), (0, 0))
        pid = os.getpid(); n0 = upload(png_bytes(ref), f'ro-ref-{pid}.png')
        extra, desc = [], []
        if head:
            extra.append(upload(png_bytes(ro_gpu.crop_ref(T, head, S)), f'ro-head-{pid}.png')); desc.append(f'Image {len(extra) + 1} is a close-up of the face and hair: keep exactly this face.')
        P = ro_cpu.approved1x(a)
        for k, b in enumerate(crop_boxes(a, ro_gpu.alpha_bbox(P))):
            extra.append(upload(png_bytes(ro_gpu.crop_ref(T, b, S)), f'ro-cos{k}-{pid}.png')); desc.append(f'Image {len(extra) + 1} is a close-up of details of the figure: keep exactly these parts, add no chain, pocket or accessory.')
        prompt = ro_gpu.PROMPT.format(refdesc=' '.join(desc), face=', the same face, eyes, brows, nose and mouth, the same expression' if head else '')
        sig = sig_str(lock_sigmas(W, H, 0.995))
        ims, gs = gpu_run(g_klein_lock(n0, extra, prompt, W, H, 9101, sig), ['99'], tag=f'{i}/sigma995', timeout=3000)
        ims[0].crop((0, 0, cw, ch)).save(ref_path, compress_level=1)
        say(f'{i}: Klein sigma 0.995 {gs:.0f} s GPU, sigmas {sig}')
    rgb_path = f'{pw}/rgb-s9101.png'
    if not os.path.exists(rgb_path):
        ro_gpu.up_to(ref_path, rgb_path, w * S, h * S, f'{i}/up995')
    P = ro_cpu.approved1x(a); Tm = ro_cpu.today(a)
    kw = Image.open(ref_path).convert('RGB')
    raw, core = ro_cpu.matte_iou(kw, P); iou = max(raw, core)
    face = Image.open(f'{wd}/face-s9101.png').convert('RGB')
    os.makedirs(f'{OUT}/masters/{i}', exist_ok=True)
    cols = []
    res[i] = {}
    for name, rp in (('D (sigma 0.99)', f'{wd}/rgb-s9101.png'), ('sigma 0.995', rgb_path)):
        rgb = Image.open(rp).convert('RGB')
        M = ro_cpu.build_master(ro_cpu.composite_face(rgb, face, head, S), Tm, P, S)
        g = ro_cpu.gates(Tm, M, S, iou if 'D' not in name else max(*ro_cpu.matte_iou(Image.open(f'{wd}/klein-s9101.png').convert('RGB'), P)), head)
        res[i][name] = g
        p = f'{OUT}/masters/{i}/{name.split()[0]}-{name.split()[-1].strip(")")}@4x.png'
        M.save(p, compress_level=3)
        cols.append((f'{name}  cells {g["cells_over20"] * 100:.1f}%  face {g.get("head_struct")}  iou {g["iou"]}', p))
    ro_view.view(i, f'{OUT}/sheets/{i.split("/")[-1]}.jpg', cols, h_fig=620, h_crop=300)
    json.dump(res, open(f'{OUT}/gates.json', 'w'), indent=1)
print(json.dumps(res, indent=1))
