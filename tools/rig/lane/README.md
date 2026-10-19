# The rig lane kit (`tools/rig/lane/`)

The rig program (Bailey, 2026-10-18: "We need this done for all characters and bosses. It's a priority.") rigs 100 subjects. Kimahri and Lulu each wrote their own recorder, fit sweep, selection, sheets and
tracker as scratch scripts (3,912 lines under `D:/Tools/pyrefly-scratch/2026-10-18/rig-*`, six of them adapted copies of Kimahri's). This kit is those scripts made reusable, so a lane spends its tokens on
the part only a lane can do (which parts, which seams, the marks by eye, which poses are authored) and runs the rest with one command. Game case: both games, shared plumbing; nothing here knows which
game a figure is from. FFX is chapters 1 to 3, FFX-2 chapters 4 and 5; a subject's own registry entry says which hidden chapter fields it.

Headless only. Servers are stopped BY PID. Nothing here writes into `public/art`, the art mirror or an installed rig.

## The commands

```
PY=D:/Tools/ComfyUI/python_embeded/python.exe

# 1. start a subject from its paintings
$PY -I tools/rig/lane/lane.py new <name> --preset humanoid-side|creature-quadruped|creature-winged [--subject <art id>] [--art D:/pyrefly-art-r50]
#    writes tools/rig/subjects/<name>.json (+ <id>_hooks.py): the skeleton from the figure's alpha box, head and torso polygons from the pose model's head box,
#    a marks slot for EVERY registered pose, authored and fit.mirror empty, the limits that kept Lulu natural. You edit the polygons, then:
$PY -I tools/rig/rig.py cut --subject <name>   ;   $PY -I tools/rig/rig.py build --subject <name>

# 2. fit: the sweep, the selection, the merge
$PY -I tools/rig/lane/lane.py fit    --subject <name> [--poses all|a,b] [--seeds 3] [--procs 8] [--tag T] [--dry]
$PY -I tools/rig/lane/lane.py select --subject <name> --tag T [--write]          # a rig per candidate, gated; the best a pose; claims = the gate's readings; the table
$PY -I tools/rig/lane/lane.py eval   --subject <name> --keys K.json [--full]     # export one keys file and gate it

# 3. record the real game (headless, the real GPU, an exact 60 Hz on a virtual clock)
PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject <id> --out <dir> --modes poses,cast,hurtko [--poses a,b] [--off] [--alias <id>=<rig folder>] [--repo <tree>]

# 3b. the animation prototype's recordings (branch anim-proto / anim-proto-2; docs/handoff/anim-proto.md): `anim` is pass 1 (the game's own camera), `anim2` is pass 2 (a fixed close camera of its own,
#     one video an action, 1280 x 720 at a pixel ratio of 1.5 so the frames are 1920 x 1080 and are scaled down)
PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject lulu --out <dir> --modes anim2 --variants today,B,P2 --alias lulu=lulu-v2 --width 1280 --height 720 --dpr 1.5 [--segments attack,cast,item-ally,item-self,hurt-ko] [--shots shots.json] --wait
node tools/rig/lane/anim2-assemble.mjs --in <dir> --out <final dir>     # pass2-<action>.mp4, compare3-<action>.mp4 (today | pass 1 B | pass 2), contact-<action>.png
node tools/rig/lane/anim-sim2.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --out <dir>    # pass 2's actions with no browser (the real animator over a flat stage): the fallback while REVIEW-BROWSER holds the browser
node tools/rig/lane/anim-measure.mjs --rig <rig folder> --keys idle,ko              # where a posed rig is in painting px: its lowest point, edges and feet (does she float, sink or slide)

# 4. clips, sheets, tables
$PY -I tools/rig/lane/lane.py keytable --gate gate.json --rig <rig folder>/rig.json --out key-table.txt
$PY -I tools/rig/lane/lane.py clips    --subject <id> --gate gate.json --on <dir>/poses --off <dir>/poses-off --out <clips dir>
$PY -I tools/rig/lane/lane.py sheets   --subject <id> --clips <clips dir> --out <sheets dir> [--before <old clips dir>]
$PY -I tools/rig/lane/lane.py report   --subject <name> --gate gate.json --rig <rig>/rig.json       # the handoff skeleton

# 5. twins and proofs
$PY -I tools/rig/lane/lane.py twin <twin name> --of <rigged config name> [--subject <twin art id>] [--run]
$PY -I tools/rig/lane/lane.py framediff --a <recording A>/poses --b <recording B>/poses [--floor <A again>/poses]
```

`--subject` is the CONFIG's name for `lane.py` (`tools/rig/subjects/<name>.json`) and the registry key (`lane-subjects.json`) for the recorder; for most subjects they are the same word.

## What each piece replaces

| Kit | Was (per subject, copied) |
|---|---|
| `record.mjs`, `play.mjs`, `play-modes.mjs`, `play-common.mjs`, `track.mjs`, `lane-subjects.json` | `record.sh`, `lulu-moment.mjs`, `fight-virtual-lulu.mjs`, `trk-lulu.mjs`, `hurtko-real.mjs`, `strike-frames.mjs`, `poses-clip.mjs`, `warm.mjs` |
| `lane.py fit / select / eval`, `lane_fit.py`, `lane_common.py` (fit slots) | `fitbatch.sh`, `select_best.py`, `claims.py`, `mergekeys.py`, `evalrig.sh`, `gaterun.sh` |
| `lane.py keytable / clips / sheets`, `lane_sheets.py` | `keytable.py`, `authored_clips.py`, `build_sheets.py` (the same labels and layout as Lulu's pass-2 sheets) |
| `lane.py new`, `lane_new.py`, `lane-pose-table.mjs` | the hand-made `lulu.json` skeleton |
| `lane.py twin`, `lane_twin.py` | nothing (the T class of the plan: 23 silhouette twins) |
| `lane.py framediff`, `lane_diff.py` | nothing (the proof that an engine change leaves a rig drawing the same) |

## The recorder, step by step (`record.mjs`)

1. Refuses while `D:/Tools/pyrefly-scratch/REVIEW-BROWSER` exists (`--wait` polls), waits on `GPU-QUIET`, and takes the `RIG-RECORD` lock (one recording at a time; a lock whose pid is gone is taken over).
2. Picks a free port, writes a scratch Vite config beside `vite.config.ts` (the repo's config plus `tools/vite-rig-art.mjs`; `--alias lulu=lulu-v2` serves a candidate folder AS the subject's) and starts
   Vite. Its PID is the child's own: it is stopped by that PID on a normal end, on an error and on a signal, and the config and the lock are removed.
3. Warms the server with one long-timeout page load, then runs `play.mjs` per mode, retrying a mode once when it left no result file. `--off` also records the painting set into `<mode>-off/` (the other
   half of a clip beside its painting).
4. Modes: `poses` (each pose held 130 frames), `cast` (the actor's own menu to its first spell; needs `castKeys` in the registry), `hurtko` (an enemy hurts it, its HP is set to 1, the next downs it; the
   only debug write), `fight` (the whole fight on `autoBattle('intended')`, the tracker table and, if the tree has it, the critic's continuity probe). Every mode writes `tracks.json` and `jerks.json`
   (the CHK-027 detector over the skeleton's own landmarks: **the CHK-026/027 probe reads painted-plane pixels and passes vacuously for a rig**, so this tracker is the harness for rigs).

## One example, end to end (a new humanoid; the numbers in the plan are estimates, the commands are real)

```
PY=D:/Tools/ComfyUI/python_embeded/python.exe
$PY -I tools/rig/lane/lane.py new rikku-dark-knight --preset humanoid-side --subject rikku-dark-knight
# edit tools/rig/subjects/rikku-dark-knight.json: the cut polygons, the skin, the marks; add the subject to lane-subjects.json (door word and chapter id from the chapter registry)
$PY -I tools/rig/rig.py cut --subject rikku-dark-knight ; $PY -I tools/rig/rig.py build --subject rikku-dark-knight
$PY -I tools/rig/rig.py fit-keys --subject rikku-dark-knight --poses idle      # once: it makes the targets
$PY -I tools/rig/lane/lane.py fit --subject rikku-dark-knight --seeds 3 --tag r1
$PY -I tools/rig/lane/lane.py select --subject rikku-dark-knight --tag r1 --write
$PY -I tools/rig/rig.py export --subject rikku-dark-knight                      # gates it
node tools/rig-tiers.mjs write --rig D:/pyrefly-art-rigs/rikku-dark-knight
node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/rikku-dark-knight --verify --art D:/pyrefly-art-r50
PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject rikku-dark-knight --out D:/Tools/pyrefly-scratch/<day>/rikku-dk --modes poses,cast,hurtko --off
$PY -I tools/rig/lane/lane.py clips  --subject rikku-dark-knight --gate gate.json --on .../poses --off .../poses-off --out .../clips
$PY -I tools/rig/lane/lane.py sheets --subject rikku-dark-knight --clips .../clips --out .../for-bailey
```

A silhouette twin is one command after its base is gated: `lane.py twin grothia --of ifrit --subject grothia --run` (`cut`, `build`, the base keys with their claims dropped, `export`; the gate re-measures).

## Format v2 (parts a key shows, hides or swaps)

`docs/handoff/rig-v2-and-kit.md` and the contract entry of 2026-10-18. In a subject config: `build.hidden: [part]`, `build.variants: {part: {name: {png, rim, box?, verts?, ...}}}`,
`fit.keys.<pose>.show|hide|image`, `keys_extra.<pose>.parts`. The fitter draws a pose in the state it names; the gate scans every key and blend in it; a rig that uses none of it is a v1 file.

## Tests

`$PY -I tools/rig/lane/test_lane.py` (the pure parts of the Python commands, 19 cases) and `npx vitest run tests/unit/tools/rig-lane.test.ts` (the recorder's pure parts and the registry, 12 cases). The browser
parts are proved by recording for real (the handoff has the runs).

## What judgment stays with the lane

Which parts to cut and where the seams are; the bone layout of a new body plan; the marks of each pose by eye (+-15 px); which poses are authored; reading the clips and the sheets for what the gate cannot
see (a skirt that trails, a sleeve that reads as a ribbon, a dark fill at a hem); the KO and mixed-costume calls (`plan.md` section 6). The kit does not decide those and does not hide them.
