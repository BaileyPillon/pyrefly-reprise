#!/usr/bin/env bash
# Repair-round cut-out pipeline: clean.py -> defringe.py (6 passes) -> finalize.py (NO --flip) ->
# strict.py. usage: cutout.sh <candidate.png> <out.png> [--noclean]
set -eu
PY="${PY:-D:/Tools/ComfyUI/python_embeded/python.exe}"  # has scipy
D="D:/Final Fantasy/docs/concepts/valefor-2026-09-27/scripts"
DF="D:/Final Fantasy/docs/concepts/ff7-art-2026-09-27/round2/scripts/cleanup/defringe.py"
in="$1"; out="$2"; tmp="${out%.png}"
if [ "${3:-}" = "--noclean" ]; then cp "$in" "$tmp.s1.png"; echo '{"clean":"skipped"}'; else "$PY" "$D/clean.py" "$in" "$tmp.s1.png"; fi
"$PY" "$DF" "$tmp.s1.png" "$tmp.s2.png" 6
"$PY" "$D/finalize.py" "$tmp.s2.png" "${in%.png}.json" "$out"
"$PY" "$D/strict.py" "$out"
