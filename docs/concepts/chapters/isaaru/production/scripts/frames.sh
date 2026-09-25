#!/usr/bin/env bash
# Engine frames (1600x900) of the INSTALLED Isaaru candidates, one at a time on a private Vite server
# (node serve.mjs: port 5781, HMR off, no watch). Output to scratch; the sheet script copies what it needs.
set -u
S="D:/Final Fantasy/docs/concepts/chapters/isaaru/production/scripts"
W=D:/Tools/pyrefly-scratch/ch1215/isaaru-art
cd "$W"
export PYREFLY_BROWSER=gpu TEMP=$W/tmp TMP=$W/tmp
A="D:/Final Fantasy/public/art/characters"
PLATE="D:/Final Fantasy/public/art/backdrops/via-purifico.png"
ISA="$A/isaaru"
fr() { local out=$1; local aeon=$2; shift 2; [ -f "frames/$out.png" ] && { echo "skip $out"; return; }; echo "== $out"; env "$@" node "$S/frame.mjs" "$PLATE" "$aeon" "$ISA" "frames/$out.png" 2>&1 | grep -E "wrote|PAGEERR|rror" | head -3; }
fr grothia-hud "$A/grothia" IY=-1.01 IS=0.85
fr grothia-clean "$A/grothia" IY=-1.01 IS=0.85 SUMMON=-1 HUD=0
fr grothia-attack "$A/grothia" IY=-1.01 IS=0.85 HUD=0 POSE=attack
fr grothia-overdrive "$A/grothia" IY=-1.01 IS=0.85 HUD=0 POSE=attack REMAP=attack:overdrive
fr grothia-ko "$A/grothia" IY=-1.01 IS=0.85 HUD=0 KO=1 KOV=0.55
fr pterya-hud "$A/pterya" IY=-1.01 IS=0.85 IX=2.2 NAME=Pterya AEON_ART=valefor SUMMON=4
fr pterya-attack "$A/pterya" IY=-1.01 IS=0.85 IX=2.2 NAME=Pterya AEON_ART=valefor SUMMON=4 HUD=0 POSE=attack
fr pterya-overdrive "$A/pterya" IY=-1.01 IS=0.85 IX=2.2 NAME=Pterya AEON_ART=valefor SUMMON=4 HUD=0 POSE=attack REMAP=attack:overdrive
fr spathi-hud "$A/spathi" IY=-1.01 IS=0.85 IX=2.5 AX=1.7 AS=0.85 NAME=Spathi AEON_ART=bahamut SUMMON=2
fr spathi-attack "$A/spathi" IY=-1.01 IS=0.85 IX=2.5 AX=1.7 AS=0.85 NAME=Spathi AEON_ART=bahamut SUMMON=2 HUD=0 POSE=attack
fr spathi-overdrive "$A/spathi" IY=-1.01 IS=0.85 IX=2.5 AX=1.7 AS=0.85 NAME=Spathi AEON_ART=bahamut SUMMON=2 HUD=0 POSE=attack REMAP=attack:overdrive
[ -f frames/dialogue.png ] || PLATE="$PLATE" node "$S/talk.mjs" "D:/Final Fantasy/public/art/portraits/isaaru.png" frames/dialogue.png 2>&1 | tail -1
