#!/bin/bash
# fin.sh <config name> <art id> [--recomp] : rebuild (clean folder) -> rb.py (variants, export, claims, gate) -> [lossless recompress + regate] -> gate json -> tiers -> verify copy named for the subject.
NAME=$1; ID=$2; RC=$3
PY=D:/Tools/ComfyUI/python_embeded/python.exe
cd /d/pyrefly-rig-valefor || exit 1
$PY -I tools/rig/rig.py build --subject $NAME 2>&1 | tail -1
rm -rf D:/pyrefly-art-rigs/$NAME
$PY -I $(dirname "$0")/rb.py $NAME 2>&1 | tail -12
if [ "$RC" = "--recomp" ]; then node $(dirname "$0")/recomp.mjs D:/pyrefly-art-rigs/$NAME --write; fi
node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/$NAME --art D:/pyrefly-art-r55 --json D:/pyrefly-art-rigs-work/$NAME/gate.json 2>&1 | tail -11
node tools/rig-tiers.mjs write --rig D:/pyrefly-art-rigs/$NAME 2>&1 | tail -1
rm -rf D:/pyrefly-art-rigs-work/$NAME/verify-copy; mkdir -p D:/pyrefly-art-rigs-work/$NAME/verify-copy
cp -r D:/pyrefly-art-rigs/$NAME D:/pyrefly-art-rigs-work/$NAME/verify-copy/$ID
node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs-work/$NAME/verify-copy/$ID --verify --art D:/pyrefly-art-r55 2>&1 | tail -2
(cd $(dirname "$0") && XID=$ID XWORK=$NAME $PY -I ha.py D:/pyrefly-art-rigs/$NAME head)
