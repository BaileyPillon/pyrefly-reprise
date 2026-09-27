#!/bin/bash
# Film set: retries after LOOKING. Cloud spin (both pilots drew two swords); Barret aim (both pilots drew a hand-held gun
# or a detached fist) is now an edit of our own fire pick (fire/p2): same body, aiming face, so aim and fire match.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film
g() { $PY -s poses.py "$@" 2>&1 | tail -c 300; }
g cloud spin     $C/cloud/spin/p3   751003
g cloud spin     $C/cloud/spin/p4   751004
g barret aimfire $C/barret/aim/p5   745005 1.0 $C/barret/fire/p2.full.png
g barret aimfire $C/barret/aim/p6   745006 1.0 $C/barret/fire/p2.full.png
echo DONE
