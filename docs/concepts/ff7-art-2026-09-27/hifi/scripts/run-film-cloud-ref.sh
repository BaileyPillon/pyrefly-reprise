#!/bin/bash
# Hi-fi round: film Cloud, third try, Klein edit mode on our own house render (see prompts.py 'film-cloud-ref').
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-hifi
g() { $PY -s gen.py "$@" 2>&1 | tail -c 400; }
g klein $C/house/cloud/p1.full.png $C/film/cloud/p3 730011 1 1.5 0.35 film-cloud-ref
g klein $C/house/cloud/p1.full.png $C/film/cloud/p4 730012 1 1.5 0.35 film-cloud-ref
echo DONE
