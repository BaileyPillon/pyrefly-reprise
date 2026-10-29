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
$PY -I tools/rig/lane/lane_marks.py --subject <name> --pose <pose> [--restarts 400]   # MARKS FIRST (2026-10-18, Rikku Dark Knight): a minute a pose, no silhouette; its init goes under fit.keys.<pose>.init before the fit
$PY -I tools/rig/lane/lane.py fit    --subject <name> [--poses all|a,b] [--seeds 3] [--procs 8] [--tag T] [--dry]
$PY -I tools/rig/lane/lane.py select --subject <name> --tag T [--write]          # a rig per candidate, gated; the best a pose; claims = the gate's readings; the table
$PY -I tools/rig/lane/lane.py eval   --subject <name> --keys K.json [--full]     # export one keys file and gate it

# 3. record the real game (headless, the real GPU, an exact 60 Hz on a virtual clock)
PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject <id> --out <dir> --modes poses,cast,hurtko,fight,ko [--poses a,b] [--off] [--alias <id>=<rig folder>] [--repo <tree>]

# 4. clips, sheets, tables
$PY -I tools/rig/lane/lane.py keytable --gate gate.json --rig <rig folder>/rig.json --out key-table.txt
$PY -I tools/rig/lane/lane.py clips    --subject <id> --gate gate.json --on <dir>/poses --off <dir>/poses-off --out <clips dir> [--last ko=70:36] [--crop attack=545,262,760,450] [--painting-file overdrive=<png>]
$PY -I tools/rig/lane/lane.py sheets   --subject <id> --clips <clips dir> --out <sheets dir> [--before <old clips dir>]
$PY -I tools/rig/lane/lane.py hurtko   --on <dir>/poses --off <dir>/poses-off --out <sheets dir>/<id>-rig-3-before-after.png --crop x0,y0,x1,y1 [--hurt 70] [--ko 70:60] [--texts a b c d] [--foot TEXT]
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
| `lane_marks.py` | nothing (a marks-only search that gives the fit a start inside the marks: see its docstring) |
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
**It registers the twin's canvas first** (rig-aeons lane, 2026-10-19): Pterya's paintings are Valefor's with 60 px more margin on every side, so the copied cut landed every polygon 60 px off (405,272 pixels of the
rest composite wrong, against 9,732). The command finds each pose's integer translation by cross-correlating the alpha-128 masks (refused under IoU 0.97), moves every coordinate of the config (cut polygons and
predicates, bones, skin joints, build landmarks, each pose's marks) and records it as `_twin_shift`; it names what it could not move (`NOT MOVED`). `--no-register` keeps the old copy-as-is. A twin's painted
keys are renamed to its own paintings (`characters/<twin>/<pose>`).

## Reaching an actor that is not on the field at the first menu, and the KO measure (rig-aeons lane)

A registry entry with no door word in `chapter` is a LISTED chapter: the recorder picks its card with the board's own `select:<id>` beat. `reach: { "auto": true }` then fights the earlier links with the game's
`intended` strategy at SKIP speed (the clock is still the real one: nothing is recorded yet), wrapped so that at the first decision of the engine whose state holds the actor alive it hands the fight back
(`setAutoPlay(null)`, speed normal) and waits for the first human menu. Pterya (Chapter XIV link 2: 1 s), Ifrit (Chapter III link 3, the possessed Ifrit: about 45 s) and Shiva (link 5) are reached that way.
The `ko` mode then plays the fight on the exact clock to the actor's KO swap (once it is under half its HP every frame is grabbed into a ring; the ring and `--tail` frames after the KO are kept) and records, a frame,
the pose, life, HP, projected box and a rig's part meshes with the area of each. `--off` records the painting set the same way: the head area of the rig (hurt against KO) against the painting set's box and the
continuity probe's head reading is the KO jump, rig on and off. The probe is vacuous for a rig; the part areas are the measure. `node tools/rig/lane/ko-summary.mjs --on <rec>/ko [--off <rec>/ko-off]` reads both runs into one table: the swap frame, the projected box before and after, the head and whole-figure mesh area hurt against KO (rig), the probe's own row for the KO swap (painting set) and the worst one-frame step of the head, centroid and feet through the camera. For a figure whose KO lies down (Shiva) the rig's own lie-down transition has a large one-frame step too: read it against the painting set's, not against zero.

## Format v2 (parts a key shows, hides or swaps)

`docs/handoff/rig-v2-and-kit.md` and the contract entry of 2026-10-18. In a subject config: `build.hidden: [part]`, `build.variants: {part: {name: {png, rim, box?, verts?, ...}}}`,
`fit.keys.<pose>.show|hide|image`, `keys_extra.<pose>.parts`. The fitter draws a pose in the state it names; the gate scans every key and blend in it; a rig that uses none of it is a v1 file.

## Lessons from the Bahamut, Grothia and Spathi lane (rig-aeons-2, 2026-10-19)

1. **The gate's feet are the lowest THICK part of the silhouette, not the toes.** The pose model's stance is "the middle of the lowest thick part" (the alpha opened by a disc of 2 percent of the figure's height). A creature whose
   tail hangs below its feet (Bahamut's tail loop, 50 px under the foot) is standing on the loop as far as the gate is concerned: the first attack fits (0.66 to 0.71) all failed `key-feet-y` (-0.047) however hard the toe landmark was weighted.
   Fix: a landmark named `soleLoop` on the loop's bone, with a mark in every pose (the fitter's planted-feet term reads every landmark named `sole...`, `toe...` or `foot...`): attack 0.709 to 0.778, flag gone. **A figure whose tail, wing strut or
   cloak hangs lower than its feet needs one.**
2. **A skirt copies the front part's pixels, glow included.** Paintings with a glow (alpha 0.1 to 0.5 round the whole figure: Grothia, Spathi) had it copied under every seam, so it stacked two and three deep (13 percent of its pixels more than 20 alpha
   brighter than the painting's, bright blobs in the game). A skirt `op`'s `zone` takes a predicate: the twins' skirts take only the pixels that are not the glow (`"zone": {"not": {"colour": {"r_minus_g_lt": -0.2, "g_minus_b_gt": 0.0, "val_gt": 0.4}}}`, teal over red and blue; halo brighter share 13 percent to 4 and 1.5). Keep
   the glow in a skirt when leaving it out moves the stance reading (Grothia's leg skirts: the claws' glow counts as the lowest thick part).
3. **"The rest composite differs from the painting in N pixels" is a count over a premultiplied composite**: every semi-transparent glow pixel "differs", so a glow painting reads hundreds of thousands. Read the opaque core (9 to 10 thousand of 2 million
   is the honest figure for a cut like this); the glow itself is carried.
4. **`rig.py sheet` draws rotations only**: no offsets, no scales, no root, no v2 part state. A key whose overlap came from a leg stretch, a wing scale or a pelvis offset looks wrong in it and right in the game. `render_key.py` (this folder, no browser)
   draws every key faithfully beside its painting: `$PY -I tools/rig/lane/render_key.py <rig folder name> out.png [pose ...] --art D:/pyrefly-art-r55`.

## Expressive keys: pieces cut from the pose's own painting (`rig.py variants`, `rig_vcut.py`; the rig-expressive lane, Bahamut pilot, 2026-10-19)

A key that bends the idle's body only leans it; the pose's painting has its own head, neck and wing shapes. A format v2 **variant** with its own mesh brings them in: `build.variants.<part>.<name>.from_painting` (the fields are in the header of
`tools/rig/rig_vcut.py`) cuts a polygon out of that painting, registers it through the fitted key's bones so it lands where the painting has it, and `fit.keys.<pose>.image` makes the key show it. Run `rig.py variants` after the fit and before `export`
(`rig.py cut`, `build`, `variants`, `export --out <folder>`: the pilot is `tools/rig/subjects/bahamut-x.json`, its keys `bahamut-x.keys.json`, built into the NEW folder `bahamut-x` so the rig it improves stays the baseline).
What the pilot taught, in the order it bit:
- **Polygons are in the idle frame's master px** (the registered painting: a pose's painting is the idle's shifted by a plain integer in the Bahamut case): draw them on the painting with a labelled grid, put every stretch that runs through sky generously
  outside the figure (alpha 0 costs nothing), and put the inner edge of a wing deep inside the torso: the pixels there are covered by the front parts, and where they are not they are the painting's own armour instead of a hole.
- **The head's size rule is the head mesh's area** (`ko-summary.mjs`, now counting only meshes that are drawn): `scaleArea: 1.0` grows the piece about the head landmark until its mesh is the idle head's area (Bahamut's attack and hurt heads were
  x1.39 smaller in area, a real size jump the paintings had). The piece is not the painting's size afterwards: say so in the report.
- **A wing's piece must be skinned along the wing's own chain** (`skin: "chain"`), or a joint of the chain leaves it in a blend and the hole test (every joint, every key, 25/50/75 percent between every two) refuses the rig. The weights are stored numbers, so
  they are the chain's weights read at the POSED places of the painted cut, and each rest position is the exact linear solution of its own blend (a fixed point over rest-position weights oscillates across a ramp: residual 91 px then 349 px; this is 0.00).
- **The key's wing bones are free, the pieces are registered to whatever they are**: choose them so the joints' discs sit inside the painted wing (the gate's disc is 0.75 of the joint's rest depth, up to 120 master px for a root joint; `wingRB` sat on the wing's
  top edge until the key's `wingRA` scale went from 1.0755 to 1.0). A landmark bound to a wing bone (`wingRTip`) limits how far a wing bone may move (0.06 of the idle's height). Where the painting has a gap exactly at a joint (the sky inside a neck loop,
  a membrane notch) `fill: [[x, y, r]]` fills the disc's transparent pixels with the painting's own colours.
- **Budgets count the box**: a big sheet at full size is 3 Mpx. `tex: 0.5` stores the PNG at half size (the mesh and uvs are unchanged; the box says the PNG's size); the 1x tier is then a quarter of the master, which reads soft on a wing at 1440p and
  is fine under it. Eight Mpx of the nine are used by Bahamut's four wing pieces and two heads.
- `key-fit-stale` after any change: the key's recorded `fit` is a claim; `lane_fit.rewrite_claims` sets it to the gate's reading (the scratch driver ran export, gate with `--json`, rewrite, export, gate).
- `ko-summary.mjs`'s head area is the part named `head`: with variants the one mesh swaps its geometry, so the area is the variant's (the idle head's area by the rule above).

### What the second expressive lane taught (rig-expressive-2: Ifrit, Grothia, Spathi, Shiva, Pterya)

Tools are in `tools/rig/lane/expressive/` (README there). New `rig_vcut.py` fields: `mask` (a partition image instead of a polygon), `fill_joints` (fill discs at the joints the hole test watches, placed AFTER the piece's scale: a `scaleArea` piece is
scaled about its anchor, so the disc is moved back through the scale and the scale re-measured until it settles), `filter` (the `tex` resize is Hamming: Lanczos rings at a mask's hard edge and the un-premultiply turns it into a pale line).
- **Head first, then what the head needs.** A head that takes the painting's pose drags a neck: Ifrit's head variant needed the far arm (it carries the neck under the chin); Pterya's head needed the neck piece; Spathi's head needed its wings to
  keep the silhouette; Shiva's attack is another drawing, so every part is a piece.
- **The head's size rule is the OPAQUE area, not only the mesh.** A painting with a broad glow ring (Grothia, Spathi, Pterya: alpha 25 to 64 round the figure) has a mesh that is mostly glow: `scaleArea 1.0` gave opaque heads 0.74 to 0.92 of the
  idle's. Tune `scaleArea` until `ha.py` reads the opaque ratio inside 0.97 to 1.03 (Pterya attack 1.29, hurt 1.24).
- **The hole test is local to the key's bones, and a piece lands where the painting has it whatever the bones are.** So the bones are free: `jfit.py` moves rotations and offsets until every watched pivot sits deep inside its own pieces, keeping marks
  and planted feet (Shiva's hurt and attack keys; the gate's overlap went 0.75 to 0.98). What the nudge cannot reach is filled with `fill_joints`; keep the discs small, a fill is made-up pixels that can show against the sky.
- **Budgets: lossless recompression gives back 5 to 10 percent** (`recomp.mjs`, sharp level 9, pixels proved identical). Spathi's four wing pieces needed `tex: 0.3` on top of it. `tex 0.75` for heads reads clean at the game's size.
- **Twins: move the variants with the registration** (`lane_twin.shift_config` now moves a variant's polygon, cut lines, anchor and fills by the shift times the scale); check the twin's rest composite count before trusting the cut (Grothia's glow skirts).
- **A variant swap is a hard pop at the half-way of the blend** (the state of the key moved FROM below 50 percent, the one moved TO from 50), exactly as the painting set pops a whole figure. Watch the clips for it.

## Tests

`$PY -I tools/rig/lane/test_lane.py` (the pure parts of the Python commands, 19 cases) and `npx vitest run tests/unit/tools/rig-lane.test.ts` (the recorder's pure parts and the registry, 12 cases). The browser
parts are proved by recording for real (the handoff has the runs).

## What judgment stays with the lane

Which parts to cut and where the seams are; the bone layout of a new body plan; the marks of each pose by eye (+-15 px); which poses are authored; reading the clips and the sheets for what the gate cannot
see (a skirt that trails, a sleeve that reads as a ribbon, a dark fill at a hem); the KO and mixed-costume calls (`plan.md` section 6). The kit does not decide those and does not hide them.

## Party rigs, version 2 (rigs-v2, 2026-10-29: Tidus FFX only, Rikku Dark Knight FFX-2 only; the tools are shared plumbing, both games)

`docs/handoff/rigs-v2.md` has the whole story. The kit parts it added, in `tools/rig/lane/party/` (the party method itself, `tools/rig/lane/party/*.py`, is the 2026-10-22 pilots' pipeline, merged from `motion-rigs`):
- `gen_v2_cfg.py <tidus|rikku-dark-knight>` writes `tools/rig/subjects/<id>-v2.json` from the pilot's `party` block (`prep.py` derives the rest); `recut.py <id>-v2 --art <art dir>` cuts it (about 30 minutes of one core a figure, no GPU) into `D:/pyrefly-art-rigs/<id>-v2`. The engine reads that folder under `?partyrigs=v2` (`PartyRigsSwitch.partyRigFolder`).
- `move_audit.py <rig folder> <config> --art <art dir> [--pairs a>b[:ms],...] [--strips dir]`: every key change of the chapter replayed with the engine's easing and flip, read from fine silhouettes: stray pieces and which part makes them, cracks, the pop at the cut, the centroid step, and what the painting set's dissolve of the same two poses would cost in frames of a second figure. **The gate cannot see these: the party method puts every joint on the outline so the hole test watches none (`231 poses scanned for holes at 0 joints`).**
- `head_reading.py <rig folder>`: CHK-026 from the rig files (head mesh and opaque area at every key over the idle's).
- `change_clips.py`: one phone clip and one still per key change, painting set beside rig, from two recordings of the same script; the recorder's `tidus-v2` and `rikku-dark-knight-v2` entries carry `query: partyrigs=v2`, and `PYREFLY_LANE_QUERY=partyrigs=off` (the environment wins: the page reads the first occurrence of a word) records the painting set of the same subject for the other half of a clip. Do not use `--off` for this: it is `?rig=off`, which paints the boss too.
