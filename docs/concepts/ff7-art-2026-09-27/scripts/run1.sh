#!/bin/bash
# Guard Scorpion candidates + Cloud / Barret / reactor pilots. Sequential: one prompt pending at a time.
cd "D:/Final Fantasy"
S="C:/Users/ADMINI~1/AppData/Local/Temp/claude/D--Final-Fantasy/174911c6-80de-460f-ac03-e4631f17478b/scratchpad/ff7"
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7
waitq() { while [ "$(curl -s http://127.0.0.1:8188/queue | python -c 'import json,sys;d=json.load(sys.stdin);print(len(d["queue_pending"]))')" -ge 2 ]; do sleep 15; done; }
GT="no humans, robot, mecha, (mechanical scorpion:1.3), giant security robot, final fantasy vii, heavy and imposing, six thick mechanical legs planted wide, massive low armored body, segmented scorpion tail, laser emitter at the tail tip, twin gun barrels on the front of the body, head with one round sensor eye, red armor panels with dark grey steel joints and hydraulic pistons, detailed mechanical parts, (red armor:1.2)"
GN="1girl, 1boy, human, person, pilot, cockpit, humanoid, bipedal, arms, hands, holding weapon, gundam, real scorpion, insect, animal, building, floor, ground, rivets, grainy, flat colors, toy"
gs() { waitq; node tools/gen/comfy.mjs boss --name ff7-guard-scorpion --nonBiped --facing left --size 1216x832 --tags "$GT$4" --negAdd "$GN" --img2img "$S/$1" --denoise $2 --pose $3 --out $C/guard-scorpion/$3.png --batch $5 2>&1 | grep -E "\->|FAIL|black|rror"; }
gs gs34-low.png 0.82 idle-a "" 3
gs gs-sketch-low.png 0.84 idle-b "" 3
gs gs34-raised.png 0.82 raised-a ", (scorpion tail raised high over its body:1.2), tail tip aimed forward" 3
gs gs-sketch-raised.png 0.84 raised-b ", (scorpion tail raised high over its body:1.2), tail tip aimed forward" 2
CT="1boy, cloud strife, final fantasy vii, safe, solo, male focus, spiky blonde hair, blue eyes, sleeveless dark indigo turtleneck shirt, (single metal pauldron on his left shoulder only:1.2), bare right shoulder, two brown leather belts at the waist, dark indigo baggy pants, brown boots, brown gloves, gear-shaped metal armlet on the left forearm, wristband on the right wrist, buster sword, (huge broadsword:1.2), wide heavy blade"
waitq; node tools/gen/comfy.mjs character --name ff7-cloud --facing right --tags "$CT" --pose pilot --poseTags "fighting stance, holding the huge broadsword in both hands, blade angled down in front, stoic expression, looking at viewer" --out $C/cloud/pilot.png --batch 3 2>&1 | grep -E "\->|FAIL|black|rror"
BT="1boy, barret wallace, final fantasy vii, safe, solo, male focus, dark-skinned male, very muscular, large heavy build, short flat top haircut, thick black beard, (gun arm:1.3), right forearm replaced by a mechanical gun, open dirty brown leather vest, bare muscular arms, metal bands on the left forearm, two dog tags, skull tattoo on left shoulder, silver hoop earring, dark green cargo pants, large brown boots"
waitq; node tools/gen/comfy.mjs character --name ff7-barret --facing right --tags "$BT" --pose pilot --poseTags "fighting stance, gun arm raised and aimed forward, left fist clenched, determined, shouting" --out $C/barret/pilot.png --batch 3 2>&1 | grep -E "\->|FAIL|black|rror"
RT="no humans, scenery, interior of a huge industrial mako reactor core chamber, a giant tubular reactor structure built into the back wall, thick pipes running down to a large valve, metal grated catwalk in the foreground, rusted steel, brownish tint, faint green mako glow, steam, dim industrial lighting, final fantasy vii, dystopian industrial, detailed background, cinematic lighting, wide shot"
waitq; node tools/gen/comfy.mjs backdrop --name ff7-reactor-core --tags "$RT" --negAdd "text, numbers, letters, logo, sign" --out $C/reactor-core/pilot.png --batch 3 2>&1 | grep -E "\->|FAIL|black|rror|variant"
echo DONE
