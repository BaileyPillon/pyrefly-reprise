#!/bin/bash
# Hi-fi round: the raised-camera reactor-core backdrop, 2 pilots per direction, from core-sketch.png.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-hifi
SK=$C/_work/sk
g() { $PY -s gen.py "$@" 2>&1 | tail -c 400; }
g sdxl  $SK/core-sketch.png $C/house/core/p1  713001 0.80 1.5 0.35 house-core
g zimg  $SK/core-sketch.png $C/keyart/core/p1 723001 0.80 1.5 0.30 keyart-core
g klein $SK/core-sketch.png $C/film/core/p1   733001 0.85 1.5 0.35 film-core
g sdxl  $SK/core-sketch.png $C/house/core/p2  713002 0.86 1.5 0.35 house-core
g zimg  $SK/core-sketch.png $C/keyart/core/p2 723002 0.88 1.5 0.30 keyart-core
g klein $SK/core-sketch.png $C/film/core/p2   733002 1 1.5 0.35 film-core
echo DONE
