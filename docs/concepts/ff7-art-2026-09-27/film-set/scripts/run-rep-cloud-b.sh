#!/bin/bash
# Film set, repair round, Cloud new renders on our FIXED idle (poses2.py): the wind-up (the band ended on the arm from
# under the pauldron, a red forearm, a green front, a dome pauldron) and the sword spin (a wrench-like weapon, a shoulder
# carry), in two blockings for the spin (A: blade up in the raised hand, B: arm out, blade hanging mid-twirl).
# Pilot 2 each; every result is LOOKED at before a pick.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
for k in 1 2; do
  $PY -s poses2.py cloud windup $C/windup/r$k 79310$k 2>&1 | tail -c 120
  $PY -s poses2.py cloud spinA  $C/spin/ra$k  79320$k 2>&1 | tail -c 120
  $PY -s poses2.py cloud spinB  $C/spin/rb$k  79330$k 2>&1 | tail -c 120
done
echo DONE
