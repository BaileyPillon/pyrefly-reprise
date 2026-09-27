#!/bin/bash
# Hi-fi round pilots, in the order they were run (p1 of Cloud per direction ran first, by hand, with the same gen.py).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-hifi
SK=$C/_work/sk
g() { $PY -s gen.py "$@" 2>&1 | tail -c 400; }
g zimg  $SK/cloud-r.png  $C/keyart/cloud/p2  720002 0.70 1.5 0.30 keyart-cloud
g klein $SK/cloud-r.png  $C/film/cloud/p2    730002 0.80 1.5 0.35 film-cloud
g sdxl  $SK/cloud-r.png  $C/house/cloud/p2   710002 0.78 1.75 0.38 house-cloud
g sdxl  $SK/barret-r.png $C/house/barret/p1  711001 0.80 1.75 0.38 house-barret
g sdxl  $SK/barret-r.png $C/house/barret/p2  711002 0.83 1.75 0.38 house-barret
g zimg  $SK/barret-r.png $C/keyart/barret/p1 721001 0.72 1.5 0.30 keyart-barret
g zimg  $SK/barret-r.png $C/keyart/barret/p2 721002 0.78 1.5 0.30 keyart-barret
g klein $SK/barret-r.png $C/film/barret/p1   731001 1 1.5 0.35 film-barret
g klein $SK/barret-r.png $C/film/barret/p2   731002 0.80 1.5 0.35 film-barret
g sdxl  $SK/gs-l.png     $C/house/gs/p1      712001 0.80 1.75 0.38 house-gs
g sdxl  $SK/gs-l.png     $C/house/gs/p2      712002 0.84 1.75 0.38 house-gs
g zimg  $SK/gs-l.png     $C/keyart/gs/p1     722001 0.75 1.5 0.30 keyart-gs
g zimg  $SK/gs-l.png     $C/keyart/gs/p2     722002 0.82 1.5 0.30 keyart-gs
g klein $SK/gs-l.png     $C/film/gs/p1       732001 1 1.5 0.35 film-gs
g klein $SK/gs-l.png     $C/film/gs/p2       732002 0.80 1.5 0.35 film-gs
echo DONE
