#!/usr/bin/env bash
# Living portrait v6 full (both): rebuild everything, CPU only (0 GPU), scratch and TEMP on D:.
# Needs: the v5.1 scratch prototype's art (D:/Tools/pyrefly-lora/yuna-x2/rig-v51/proto/art, read-only) and its keys
# (D:/Tools/pyrefly-lora/yuna-x2/rig-v51/keys/*/cmap.npy); a scratch runtime at $LP6_PROTO = a copy of that prototype's
# src + index.html with proto-v6.diff applied, art/{keys,rest-composite.png,rig.json} copied and art/v3, art/v4, art/v5
# as junctions (v3/v4 -> this repo's prototype-v2/art, v5 -> the v5.1 scratch art); vite.config.mjs on port 5720,
# hmr off, the watcher ignoring everything. Stop the server by its port when done.
set -euo pipefail
cd "$(dirname "$0")"
S=${S:-D:/Tools/pyrefly-scratch/picks0925/portrait-a2}
export LP6_WORK=$S/work LP6_CAP=$S/cap LP6_PROTO=$S/proto TEMP=$S/tmp TMP=$S/tmp PYREFLY_BROWSER=gpu
mkdir -p "$LP6_WORK" "$LP6_CAP" "$TEMP"
PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe          # OpenCV + numpy
PYS=D:/Tools/ComfyUI/python_embeded/python.exe           # scipy (the pilot's lid_extract.py)
P=../../v6-pilot/tools
(cd $P && $PYS -s lid_extract.py --out "$LP6_WORK/lids.npz" && $PY eye_parts.py && $PY expr_fit.py)   # the pilot's rig parts
python - <<'EOF'
import json, os
a = os.environ["LP6_PROTO"] + "/art/"
d = json.load(open(a + "rig.json", encoding="utf-8"))
d["artMeta"]["v3"]["keys"]["frontal"] = {"back": {"file": "v6/frontal/back.png", "box": [0, 0, 832, 1216]}, "front": {"file": "v6/frontal/front.png", "box": [0, 0, 832, 1216]}}
d["artMeta"]["v6full"] = {"_readme": "v6 full scratch: the frontal as one back + front (face6.py prep); every key face uploaded per frame by the capture (setFace)"}
json.dump(d, open(a + "rig-v6.json", "w", encoding="utf-8"), indent=1)
EOF
$PY face6.py prep                                        # support mask, the frontal as one back + front, rest check
$PY face6.py collar                                      # Fix 1: every key's neck overlaps the body (rig-v6.json)
U=http://127.0.0.1:5720/
node shots6.mjs --url $U --out $LP6_CAP --phase rest
for s in clip half; do node shots6.mjs --url $U --out $LP6_CAP --phase log --script $s; $PY turn6.py $s; node shots6.mjs --url $U --out $LP6_CAP --phase frames --script $s; done
for t in sweep sweep-rest; do $PY turn6.py $t; node shots6.mjs --url $U --out $LP6_CAP --phase sweep --tag $t; done
node shots6.mjs --url $U --out $LP6_CAP --phase sweep --tag sweep-v51
for t in sweep sweep-rest sweep-v51; do $PY ../../v5-pilot/tools/sweep-metric.py $LP6_CAP/$t 40; $PY ../../v51/tools/cut_checks.py $LP6_CAP/$t 40; done
$PY throat.py $LP6_CAP/frames-clip $LP6_CAP/log-clip.json $LP6_CAP/throat-after.npy
$PY measure6.py
$PY make6.py clip; $PY make6.py compare; $PY make6.py sheet
