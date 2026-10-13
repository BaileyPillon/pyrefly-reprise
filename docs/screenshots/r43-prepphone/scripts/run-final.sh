#!/usr/bin/env bash
# The final proof sequence on the final code. Every command has its own hard timeout (8 minutes at most).
cd "$(dirname "$0")" || exit 1 # run from this folder; PREP_WT must name the repo root
export PYREFLY_BROWSER=gpu # and TEMP/TMP somewhere that is not C:
LOG="./final-log"
mkdir -p "$LOG"
run() { # name, timeout seconds, command...
  local name="$1" t="$2"; shift 2
  echo "=== $(date +%H:%M:%S) $name" | tee -a "$LOG/_all.txt"
  timeout "$t" "$@" > "$LOG/$name.txt" 2>&1
  echo "    exit=$? $(tail -1 "$LOG/$name.txt")" | tee -a "$LOG/_all.txt"
}
export PREP_BASE=${PREP_BUILD:-http://127.0.0.1:5843/} # the dev server on this branch
run shots-390   470 node proof-shots.mjs --w=390 --h=844 --tag=build
run shots-430   470 node proof-shots.mjs --w=430 --h=932 --tag=build
run scrolled-390 200 node proof-scrolled.mjs --w=390 --h=844 --tag=build
run scrolled-430 200 node proof-scrolled.mjs --w=430 --h=932 --tag=build
run input-390   470 node proof-input.mjs --w=390 --h=844 --tag=input
run input-430   470 node proof-input.mjs --w=430 --h=932 --tag=input
run webkit-390  300 node proof-webkit.mjs --w=390 --h=844 --tag=webkit
run shots-360   300 node proof-shots.mjs --w=360 --h=740 --tag=build
run shots-320   300 node proof-shots.mjs --w=320 --h=640 --tag=build
run shots-599   300 node proof-shots.mjs --w=599 --h=900 --tag=build
run desktop-after-final 420 node shots-desktop.mjs --tag=after-final
run desktop-input-1600 300 node proof-desktop-input.mjs --w=1600 --h=900
run desktop-600-after 420 node shots-desktop.mjs --tag=after-600 --width=600 --height=900
export PREP_BASE=${PREP_ORIGIN:-http://127.0.0.1:5844/} # a dev server on a pristine export of origin/main
run desktop-600-base 420 node shots-desktop.mjs --tag=base-600 --width=600 --height=900
run desktop-1280-base 420 node shots-desktop.mjs --tag=base-1280 --width=1280 --height=720
export PREP_BASE=${PREP_BUILD:-http://127.0.0.1:5843/} # the dev server on this branch
run desktop-1280-after 420 node shots-desktop.mjs --tag=after-1280 --width=1280 --height=720
echo "=== $(date +%H:%M:%S) ALL DONE" | tee -a "$LOG/_all.txt"
