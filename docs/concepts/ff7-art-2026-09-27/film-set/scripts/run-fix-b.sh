#!/bin/bash
# Film set: Cloud hurt retry (both first pilots stood almost still), stronger knock-back wording.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film
g() { $PY -s poses.py "$@" 2>&1 | tail -c 300; }
g cloud hurt $C/cloud/hurt/p3 753003
g cloud hurt $C/cloud/hurt/p4 753004
echo DONE
