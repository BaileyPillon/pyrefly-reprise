# r38-pushin: the DRESSPHERE SHOT's push-in fallback (morning ask 11, D-346)

Branch `r38-pushin`, from `origin/main` 26b46cd3. Not merged, not deployed, not reviewed. Written 2026-10-03 by one Sonnet agent under the driver's brief.
**Game case: FFX-2 only** (only FFX-2 has a spherechange and the DRESSPHERE SHOT; Bailey's "all your recommendations, godspeed" adopted ask 11 as D-346).
critic-plan class (`node tools/critic-plan.mjs --paths` on the five touched shipped files): **FOCUSED review before deploy; the build owes a DEEP review after the deploy** ("36 substantial
checkpoints since the last deep review"); **not** the save-data class (no `SaveData.ts`, schema, migration or settings persistence: the EYE CANDY page changed two lines of help text only), so there is no `-savedata` branch.

## What it does

When the full close shot finds no clean frame, or on the upright phone (where the full shot is closed), the battle camera makes a small push-in on the girl who changes
instead of no shot.

- **The move** (`src/engine/fx/mix/pushIn.ts`, new): a dolly along the line from the camera to her chest, orientation unchanged, so the point it zooms on keeps its place on screen
  (a face that was clear of the panels in the master stays clear); 0.9 s eased (`PUSH_SECONDS`), then it holds. Candidates, in order of preference: 30 % of the way (about 1.4x) first,
  then gentler (24, 18, 12 %), then stronger (36, 42 %); no aim shift before an aim shift (up to 0.1 of the frame); two heights on her (0.55, 0.75).
- **Every frame of the path is checked** (at 0.5, 0.75 and 1 of the move), not only the end: she whole and clear of the HUD, every head in the shot clear of the panels and the frame's top,
  every other party member whole or wholly out (the full shot's `shotScore` strict), no neighbour dwarfing her beyond the full shot's 1.25 or what the master already shows plus 20 % (a
  nearer girl is already 1.4x taller at Trema; the push makes the ratio grow a little, see "For Bailey" 2), **no more of the painted plate's edge than the master shows** (`plateExcess`, the
  gate CHAPTER FRAMING's masters use) and the camera never within 1.5 figure heights of a figure.
- **Holds like the full shot**: `since` is set at the cut, so `holdMs()` (the presenter's wait after the burst) and the 1.6 s minimum / 3 s maximum / quiet rule are the same code. Handed back the same ways:
  a menu opening (`o.menu`), anyone but her acting. A push is also handed back if the canvas moves under it (`slideBacks`; the phone's HUD slides the slice between beats).
  No push starts while a menu is open (the same `!o.menu` gate as the full shot).
- **REDUCE MOTION** (`o.rm`): no move, one static cut to the END framing (same pose the push arrives at), held the same length; the twirl keys still do not play (unchanged).
- **The phone** (390x844): the full shot stays closed there (`full = false` in `cut`), the push-in is the only dressphere shot. `deviceNote('dressphereShot')` on the phone is now `less:phone`
  (the EYE CANDY row reads `ON · LESS HERE`), not `off`; `deviceCloses` is false so the mix runs it. OVERDRIVE SHOT (FFX only) is untouched and still `off` on the phone.
- **The plate** (a finding that mattered): the change's name plate (`.ffx2sf__plate`) sits 14 px over the girl's head and follows her through the camera (`followFlourish`), but `hudPanels` counts it
  as a panel, so Paine's head (the farthest girl, the plate's bottom edge 15 px into her box) was "under a panel" at every push candidate (measured: panel rect 570,332,739,412 against her box top 397 at 1600x900). The push-in's check drops the plate's
  own rect from the panels (it is above her face wherever the camera puts her). The full shot's check is unchanged (see "For Bailey" 1).
- **Settings page**: the DRESSPHERE SHOT help line now says "...holds a close shot of the girl, or pushes in a little where no close shot is clear, then goes back. REDUCE MOTION keeps one cut." and the phone reason line
  "On a phone held upright there is no close shot (it shows a slice of the picture), only the small push-in." (`eyeCandyPage.ts`; FFX's OVERDRIVE SHOT lines untouched.)
- Checks-only additions: `fx.mix.snapshot()` has `push` (a push-in is up) and `camera` (position, fov); `shots` has `push` and `slideBacks`; `shotScore` returns an optional `why`.

Files: `pushIn.ts` (135 lines, new), `heldShots.ts` (340), `MaxMix.ts` (325), `gates.ts`, `eyeCandyPage.ts` (all under 400). Layering: no DOM in `pushIn.ts`; `heldShots.ts` already read the DOM and still does.
No shared contract file changed (`docs/CONTRACTS.md` lists none of them).

## Proof (real keys from the title, headless GPU Chromium, seed 1, one browser at a time; frames in `docs/screenshots/r38-pushin/`, raw numbers in `matrix.txt` there)

Real dressphere changes through the Garment Grid (`Change`, `ArrowRight`, `Enter`), three per run, per-frame `fx.mix.snapshot()` (shot kind, camera position, presenter phase, menu flag) and a 40-frame clip:

| Chapter | Size | Changes (girl: what played, ms held) | Notes |
|---|---|---|---|
| Trema `ffx2-trema` | 1280x720 | Yuna: full 1600; **Paine: push 1650**; Rikku: full 1600 | the full shot still wins for Yuna and Rikku |
| Trema | 1600x900 | Yuna full 1617; **Paine push 1667**; Rikku full 1617 | `trema-1600x900-paine-push-in.jpg` |
| Trema | 2000x1012 | Yuna full 1633; **Paine push 1633**; Rikku full 1616 | |
| Trema | 390x844 touch | **Yuna push 1667; Paine none; Rikku push 1633** | Paine: no clean push (Yuna sits at the slice's edge, 73 to 88 % in view at every candidate): the master holds |
| Ch IV `ffx2-bahamut` | 1280x720, 1600x900, 2000x1012 | all three changes (Yuna, Rikku, Yuna): full shot, 1600 to 1683 | no fallback needed; the full shot wins everywhere it passes |
| Ch IV | 390x844 touch | Yuna #1: none (head under a panel); Rikku: none (another actor acting, as ever); **Yuna #2: push** (up when the 40-frame clip ended at 1266 ms, still held: 0 hand-backs) | |
| Trema, REDUCE MOTION | 1600x900 | Paine: push, camera distance moved during the shot **0.000** (static end framing), held 1600 | `trema-1600x900-paine-reduce-motion-static-end-framing.jpg` |

In every run: `menuWhileSc` false (no shot or push with a girl's menu open), no enemy action presented inside a shot. Desktop pushes move the camera 2.04 units (about a 1.22x zoom: the strongest the neighbours allow, `s0.18`), the phone's 3.4 to 3.8 (`s0.3`, 1.4x).
Frames: `trema-*-paine-push-in.jpg` (master, in the push at +0.3, +0.5, +0.9 s, last held frame, the frame after the hand-back), `trema-390x844-*-push-in-phone.jpg`, `ch4-390x844-yuna-push-in-phone.jpg`, and the control `ch4-1600x900-rikku-full-shot-still-wins.jpg`, `trema-1600x900-yuna-full-shot-still-wins.jpg`.
Unit tests: `tests/unit/fx-mix-push-in.test.ts` (11: the dolly keeps its anchor on its pixel, the easing and REDUCE MOTION end framing, candidate order, a clear scene takes the first, a cropped neighbour is not accepted, a face under a panel gives null, the plate edge never exceeds the master's, the phone path, no push over a menu, hand-back when the slice moves); `fx-mix-gates`, `pause-eye-candy-page` updated for `less:phone`.
Scripts and raw frames: `D:/Tools/pyrefly-scratch/2026-10-03/r38-pushin/` (`cap/push.mjs`, `matrix.sh`, `sheet.py`; `evidence/gaps/push-*`). Dev server on 6320, stopped by PID.

## Gates

`npx tsc --noEmit` clean; `node tools/orphans.mjs`: 24 (unchanged); full `vitest run --testTimeout=60000 --maxWorkers=3`: 769 files passed, 5 skipped, 0 failed (11,284 tests passed, 41 skipped, 1 todo). New and touched files under 400 lines.

## For Bailey

1. **The name plate counts as a panel in the full shot's check.** The same plate that blocked Paine's push (it sits over her head by design) is counted by `hudPanels` when the FULL shot is searched, so it may be part of why Paine's full shot never found a frame in Trema. I left the full shot's check alone (the brief says the fallback runs only where the full shot finds nothing, and the full shot's behaviour was proven live in r37). Dropping `ffx2sf` from `hudPanels` (the `SKIP` regex, one word) would let the full shot pass for Paine more often and make the push-in rarer; yours to say.
2. **How small is small.** On a desktop window the strongest push every frame allows is about 1.22x (a girl standing in front of Paine would be cropped by more). That is a visible but gentle move; a bigger one costs a neighbour cut by the frame. I counted a neighbour that grows by up to 20 % over what the master already shows as not "dwarfing" (Yuna is already 1.4x Paine's height at Trema); a stricter reading (no growth) leaves Paine with no shot again.
3. **Two phone changes still get no shot** (Trema Paine: Yuna sits at the slice's edge; Ch IV Yuna's first change: her head is under the HUD in the slice). That is the rules working, not a gap in the build; relaxing "wholly in or out" for a neighbour at the slice's edge would crop her.
4. **Pacing on the phone.** The phone now also waits the shot's remaining time after the burst (the r37 hold, about 1.1 s) when a push is up; before, it had none.
5. **The settings help line** for DRESSPHERE SHOT and its phone reason were reworded to match (page text only; no setting changed).

## Check (independent critic, 2026-10-03; branch r38-pushin at 9073651c, FFX-2 only)

Verdict: **no blocker.** Everything below was run by the checker, not read from the report above. Own driver `D:/Tools/pyrefly-scratch/2026-10-03/r38-pushin-check/chk.mjs`
(headless GPU Chromium, real keys from the title, `Change`, `ArrowRight`, `Enter` for each dressphere change, per-frame `fx.mix.snapshot()` log plus 9 screenshots per change; dev server on 6320, stopped by PID).
Raw rows: `docs/screenshots/r38-pushin/check/matrix-check.txt`; frames beside it in `docs/screenshots/r38-pushin/check/` (master, mid-push, last held frame).

- **Gates, re-run**: `npx tsc --noEmit` clean; `node tools/orphans.mjs` 24 (unchanged); `fx-mix*`, `pause-eye-candy-page` 140 tests pass; full `vitest run --testTimeout=60000 --maxWorkers=3`: 769 files passed, 5 skipped, 0 failed (11,284 tests, 41 skipped, 1 todo).
  `pushIn.ts` has no DOM and no `three` beyond the maths (layering holds); `heldShots.ts` 351, `MaxMix.ts` 326, `pushIn.ts` 137 lines, all under 400. No `docs/CONTRACTS.md` file touched, so no CONTRACT-CHANGES entry owed.
  Both commits name the game case (FFX-2 only); `critic-plan` agrees (deep class, focused before deploy, deep owed after deploy, not save-data). No game data is added (every number is a camera tuning value, not a sourced figure), so rule 6 has nothing to source.
- **Trema, Paine (desktop)**: push at 1280x720 (held 1600 ms), 1600x900 (1683 ms) and 2000x1012 (1616 ms); the camera moves 2.04 units to the end framing (a gentle zoom, same fov), eased (first frame 0.18 to 0.22 units off the master: no cut). Yuna and Rikku kept the **full shot** at all three sizes (1616 to 1666 ms).
  Baseline, live release 36 at 1600x900 with the same script: Paine **none** (full shot found no frame), so the push is what changes. Frames show Paine whole, face clear of every panel, no plate edge, name plate over her head.
- **Ch IV (Bahamut), desktop**: all nine changes (three sizes by three) the **full shot**, 1600 to 1650 ms, push count 0: the full shot still wins where it passes.
- **Phone 390x844 (touch)**: Ch IV 3 of 3 changes got a push (1600, 1667, 1684 ms); Trema 1 of 3 (Paine; the other two correctly none: Yuna's head under a panel at every candidate, and a neighbour only 0.89 in view). No full shot on the phone, no slide hand-back, frames whole and clear of the party rows and the top banner.
  The builder's phone run split differently (turn order differs between runs): the count varies run to run, the rule outcome does not.
- **REDUCE MOTION (Trema, 1600x900)**: Paine pushes twice (1717 and 1600 ms) and the camera is at the end framing on the first frame and never moves during the shot (distance start to end 0.000).
- **Menus**: `menuInShot` false in all 27 changes (no shot or push while an FFX-2 command menu is awaited); unit tests cover the hand-back on a menu opening and no start while a menu is open.
- Search cost: the fallback search takes 21 to 38 ms once, on the cut frame, on Trema desktop (0.4 to 11 ms on the phone); the full shot's search is 0 to 2.5 ms.

### Disclose (not blockers)

1. The push is subtle: about 1.22x on a desktop window (strongest the neighbours allow); some will read it as "barely a shot". Bigger costs a neighbour cropped. The builder's For Bailey 2 already says so.
2. On the phone some changes still get no shot (rules working); the count varies by run.
3. One-off 21 to 38 ms search hitch on the frame that starts a desktop push (a single frame at 60 fps).
4. I did not provoke an enemy action starting inside a push (the hand-back is the full shot's shared path, proven in r37 and unit-tested here); not a new live proof.
5. The name-plate exemption applies to the push only; the builder's For Bailey 1 (the full shot still counts the plate as a panel) stands as a question for Bailey.
