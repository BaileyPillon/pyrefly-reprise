"""ha.py <rigdir> [part=head] : per key, the part's mesh area (master px^2, from the verts and triangles of the image the key shows) and its opaque pixels (alpha > 127 of the part alone, rendered in the key's pose), each as a ratio of the idle's. Env XID, XWORK."""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from xl import *

rigdir = sys.argv[1]
part = sys.argv[2] if len(sys.argv) > 2 else 'head'
rig, T, model = load_model(rigdir)
W, H = rig_size()
PAD = 500
P = {p['name']: p for p in rig['parts']}[part]


def area(rec):
    return rig_vcut.mesh_area(np.array(rec['verts']).reshape(-1, 2), np.array(rec['triangles']).reshape(-1, 3))


rows = []
for k, key in rig['keys'].items():
    st = state_of(rig['parts'], key.get('parts'))
    img = st[part]['image'] if part in st else None
    rec = P['variants'][img] if img else P
    a_mesh = area(rec)
    only = {n: {'shown': n == part and st[n]['shown'], 'image': st[n]['image']} for n in st}
    pose_key(model, rig, key)
    model.set_state(only)
    r = render_pose(model, W, H, pad=PAD)
    op = int((np.asarray(r.split()[3]) > 127).sum())
    rows.append((k, img or '-', a_mesh, op))
a0, o0 = rows[0][2], rows[0][3]
idle = [r for r in rows if r[0] == 'idle'][0]
a0, o0 = idle[2], idle[3]
print(f'{part}: idle mesh {a0:.0f} opaque {o0}')
for k, img, am, op in rows:
    print(f'  {k:10s} image {img:8s} mesh {am / a0:.3f}  opaque {op / o0:.3f}')
