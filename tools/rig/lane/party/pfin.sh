#!/bin/bash
# pfin.sh <config name> <art dir> : the finishing run of a party rig: clean folder, pfin.py (variants, export, claims, gate), gate json, tiers, verify copy named for the subject, head-area table.
NAME=$1; ART=${2:-D:/pyrefly-art-r61}
PY=D:/Tools/ComfyUI/python_embeded/python.exe
HERE=$(cd "$(dirname "$0")" && pwd)
cd "$HERE/../../../.." || exit 1
ID=$($PY -I -c "import json,sys;print(json.load(open('tools/rig/subjects/$NAME.json',encoding='utf8'))['subject'])")
export PYREFLY_ART_DIR=$ART
node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/$NAME --art $ART --json D:/pyrefly-art-rigs-work/$NAME/gate.json 2>&1 | tail -16
node tools/rig-tiers.mjs write --rig D:/pyrefly-art-rigs/$NAME 2>&1 | tail -1
rm -rf D:/pyrefly-art-rigs-work/$NAME/verify-copy; mkdir -p D:/pyrefly-art-rigs-work/$NAME/verify-copy
cp -r D:/pyrefly-art-rigs/$NAME D:/pyrefly-art-rigs-work/$NAME/verify-copy/$ID
node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs-work/$NAME/verify-copy/$ID --verify --art $ART 2>&1 | tail -2
