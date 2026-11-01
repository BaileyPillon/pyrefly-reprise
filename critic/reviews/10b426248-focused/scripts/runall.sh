#!/bin/bash
# usage: runall.sh base tagprefix w h chapters...
cd /d/Tools/pyrefly-scratch/2026-11-01/r71-focused/scripts
base=$1; pre=$2; w=$3; h=$4; shift 4
for c in "$@"; do
  PYREFLY_BROWSER=gpu node play.mjs --chapter=$c --base=$base --w=$w --h=$h --tag=$pre-$c-$w 2>&1 | tail -4
done
