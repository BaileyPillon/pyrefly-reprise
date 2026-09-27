#!/bin/bash
# Hi-fi round: key-art third tries (after LOOKING at p1/p2: Cloud p1 had two pauldrons, p2 came back hazy with
# ghosted feet; Barret p1/p2 have a mohawk and p2 holds the gun in a hand). Z-Image img2img from OUR OWN renders
# that carry the canon layout: Cloud from house/cloud/p1.fix.png, Barret from film/barret/p1.full.png.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-hifi
g() { $PY -s gen.py "$@" 2>&1 | tail -c 400; }
g zimg $C/house/cloud/p1.fix.png   $C/keyart/cloud/p3  720011 0.62 1.5 0.30 keyart-cloud
g zimg $C/film/barret/p1.full.png  $C/keyart/barret/p3 721011 0.62 1.5 0.30 keyart-barret
g zimg $C/house/cloud/p1.fix.png   $C/keyart/cloud/p4  720012 0.70 1.5 0.30 keyart-cloud
echo DONE
