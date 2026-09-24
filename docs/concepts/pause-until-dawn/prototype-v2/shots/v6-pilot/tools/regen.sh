#!/usr/bin/env bash
# Living portrait v6 pilot (both): rebuild everything from the v5.1 scratch prototype's art, CPU only.
# Scratch and TEMP on D: (never C:). Nothing is written outside WORK and this folder.
set -euo pipefail
cd "$(dirname "$0")"
export LP6_WORK="${LP6_WORK:-D:/Tools/pyrefly-scratch/lp-v6/work}"
export TEMP="${TEMP_D:-D:/Tools/pyrefly-scratch/lp-v6/tmp}" TMP="${TEMP_D:-D:/Tools/pyrefly-scratch/lp-v6/tmp}"
mkdir -p "$LP6_WORK" "$TEMP"
PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe          # OpenCV + numpy
PYS=D:/Tools/ComfyUI/python_embeded/python.exe           # scipy (rig-lids2.py's own functions)
$PYS -s lid_extract.py --out "$LP6_WORK/lids.npz"        # the lid rig's curves (read-only use of tools/gen)
$PY eye_parts.py                                         # disc, catchlight, socket re-fill, window
$PY expr_fit.py                                          # the mouth: open columns + 7x5 lattices
$PY pilot_lids_gaze.py                                   # pilot steps 1-2
$PY pilot_mouth.py                                       # pilot step 3
$PY make_clips.py A B C                                  # ../clip-A-measured.mp4, -B-livelier, -C-quiet
$PY pilot_clips.py                                       # the acceptance numbers on the clips
$PY make_sheet.py                                        # ../sheet.jpg
