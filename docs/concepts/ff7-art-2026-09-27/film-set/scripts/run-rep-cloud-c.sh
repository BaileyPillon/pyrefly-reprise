#!/bin/bash
# Film set, repair round, Cloud: the fresh renders of run-rep-cloud-b.sh broke identity (bands on both wrists, a second
# pauldron, a blade pointing forward), so the wind-up and the spin are EDITS of our fixed idle instead (poses2.py
# windupE / spinE: "change only the pose of his arms and the sword"). Pilot 2 each; LOOKED at before a pick.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
for k in 1 2; do
  $PY -s poses2.py cloud windupE $C/windup/e$k 79340$k 2>&1 | tail -c 120
  $PY -s poses2.py cloud spinE   $C/spin/e$k   79350$k 2>&1 | tail -c 120
done
echo DONE
