#!/usr/bin/env bash
# Living portrait v6 pilot (both): rebuild everything from the v5.1 scratch prototype's art, CPU only.
# Scratch and TEMP on D: (never C:). Nothing is written outside WORK and this folder.
set -euo pipefail
cd "$(dirname "$0")"
export LP6_WORK="${LP6_WORK:-D:/Tools/pyrefly-scratch/lp-v6b/work}"
export TEMP="${TEMP_D:-D:/Tools/pyrefly-scratch/lp-v6b/tmp}" TMP="${TEMP_D:-D:/Tools/pyrefly-scratch/lp-v6b/tmp}"
mkdir -p "$LP6_WORK" "$TEMP"
PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe          # OpenCV + numpy
PYS=D:/Tools/ComfyUI/python_embeded/python.exe           # scipy (rig-lids2.py's own functions)
$PYS -s lid_extract.py --out "$LP6_WORK/lids.npz"        # the lid rig's curves (read-only use of tools/gen)
$PY eye_parts.py                                         # disc, catchlight, socket re-fill, window
$PY expr_fit.py                                          # the mouth: open columns + 7x5 lattices
$PY pilot_lids_gaze.py                                   # pilot steps 1-2
$PY pilot_mouth.py                                       # pilot step 3
$PY make_clips.py A B C                                  # ../clip-A2-measured.mp4, -B2-livelier, -C2-quiet (part 1's: 9927c4b5)
$PY pilot_clips.py                                       # weights and gaze on the clips
$PY pilot_still.py --folds --reference                   # part 2: never still (the spec's method), brow folds, Until Dawn
$PY make_sheet.py                                        # ../sheet-2.jpg
