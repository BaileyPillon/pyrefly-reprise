#!/bin/bash
# Film set, repair round, Cloud: the wind-up and spin EDITS of the idle (run-rep-cloud-c.sh) drifted the proportions
# (head-fit: the head 0.81 and 0.87 of the idle's). So both start from a pose that already has the idle's proportions
# and the right arm up: the spin from the fist pump (fistpump/p2x2: the raised near fist takes the sword), the wind-up
# from the sword-on-back pose (back/p2x2: the far hand joins the grip, a fighting stance). Pilot 2 each.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
for k in 1 2; do
  $PY -s poses2.py cloud spinF   $C/spin/f$k   79360$k 1.0 $C/fistpump/p2x2.full.png 2>&1 | tail -c 120
  $PY -s poses2.py cloud windupF $C/windup/f$k 79370$k 1.0 $C/back/p2x2.full.png 2>&1 | tail -c 120
done
echo DONE
