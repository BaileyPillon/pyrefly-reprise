#!/bin/bash
# Film set: Cloud idle + attack keys, 2 pilots each (FLUX.2 Klein edit mode on the Film idle pick).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
g() { $PY -s poses.py "$@" 2>&1 | tail -c 300; }
g cloud idle   $C/idle/p9     740009
g cloud idle   $C/idle/p10    740010
g cloud windup $C/windup/p1   742001
g cloud windup $C/windup/p2   742002
g cloud strike $C/strike/p1   743001
g cloud strike $C/strike/p2   743002
g cloud follow $C/follow/p1   744001
g cloud follow $C/follow/p2   744002
echo DONE
