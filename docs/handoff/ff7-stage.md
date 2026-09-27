# FF7 art installed and the reactor core staged (Guard Scorpion, FF7 only)

Branch `ff7-engine` (worktree `D:/pyrefly-ff7-engine`), 2026-09-27. Not merged, not deployed.
**Game case: FF7 only**, plus two optional staging switches and three one-line branches in
shared presenter/screen files that leave every FFX and FFX-2 path exactly as it was (listed
below). On whose word: Bailey, 2026-09-27 ~00:45 EDT, verbatim "full speed ahead please.
godspeed. ill go with all your recommendations. what is your question about barret?" (D-240,
with D-237 to D-239 as its context): the art picks as cleaned up in
`docs/concepts/ff7-art-2026-09-27/round2/README.md` (on `main`), FF7's own staging from
`research/ff7-battle-staging.md`, and the research's party presets.

## Target and build, side by side

`docs/screenshots/ff7/stage-vs-composite-1600.jpg`: the composite Bailey accepted
(`round2/13-composite-1600-clean.jpg` and its `-tail-raised`) on the left, the running engine on
the right. Close: same painting framing, same sides and facing, same arrangement (boss left,
Barret upstage, Cloud downstage right). Differences, all ours to judge: the figures are about 7%
smaller (the camera stands back so either member's back-row spot stays whole in frame), the party
stands a little closer to the boss, and the house rim light draws a thin light edge round every
figure that the flat composite does not have.

Frames (headless GPU, the real engine, stage, presenter and staging hook, no HUD):
`docs/screenshots/ff7/stage-1600x900-{open,hit,back-row,tail-up}.jpg` and the same four at
`390x844`, with `stage-<size>.json` recording every figure's spot, body facing, `mirrored`
(false for all, every moment), art id, screen box, rows, form, camera and numerals. 0 console
errors, 0 failed requests at both sizes.

## 1. The art (installed, locked)

| Subject | Installed as | From (`D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7/`) |
|---|---|---|
| Cloud, idle | `public/art/characters/ff7-cloud/idle.png` (facing left) | `cloud/cleanup/idle-c.1.png` |
| Barret, idle | `public/art/characters/ff7-barret/idle.png` (facing left) | `barret/cleanup/idle-c.1.png` |
| Guard Scorpion, tail down | `public/art/characters/ff7-guard-scorpion/idle.png` (facing right) | `guard-scorpion/cleanup/idle-c.1.png` |
| Guard Scorpion, tail raised | `public/art/characters/ff7-guard-scorpion-tail-up/idle.png` (facing right, `scale` 748/681) | `guard-scorpion/cleanup/raised-c.1.png` |
| Reactor core backdrop | `public/art/backdrops/ff7-sector1-reactor.png` | `reactor-core/core.1.png` |

- Each PNG is the candidate byte for byte, never mirrored. Sidecars are the candidate's own plus
  `facing`, `status` (Bailey's words), `decision: D-240`, `installedFrom`, `sha256`.
- The `ff7-` prefix keeps every id apart from FFX and FFX-2 (the house precedent is `ffx2-`).
  Every slot was empty; nothing in `public/art` was replaced or removed.
- The raised form's `scale` 748/681: both cut-outs come from one 1216x832 frame with the ground
  on source row 827, so this keeps the body at the idle's pixel scale. Its crop is centred 71
  source px right of the idle's; the staging hook shifts the figure by that much while it shows,
  so the body does not jump on the swap (checked in `stage-*-tail-up.jpg`: x -1.8 to -1.575).
- `public/art/manifest.json` regenerated with `tools/gen/manifest.mjs`: four subjects and one
  backdrop added; every existing entry byte-identical (only `generatedAt` moved).
- Locked: `docs/target/approved-hashes.json` set `bailey:2026-09-27-ff7` (words, note, decisions
  D-240, D-237 to D-239). `ROOT="D:/pyrefly-ff7-engine" node D:/Tools/pyrefly-lora/tools/verify-approved.mjs`:
  267 ok, 0 mismatched, 0 missing (main's tree: 262 ok, 0, 0; the set reaches main on merge).
- Backup: `D:/Tools/pyrefly-art-backup/approved/2026-09-27-ff7/installed/`.
- Data: the party's and the forms' `spriteKey`s are now these art ids
  (`src/data/ff7/builds/sector1-reactor.ts`, `src/data/ff7/enemies/guard-scorpion.ts`). The FF7
  golden (`tests/fixtures/ff7-golden.json`) was re-pinned for it: all 40 hashes moved and nothing
  else (outcome, turns, ticks, event counts identical); a scratch check proved that taking the
  `ff7-` prefix back off the `form-change` events' `spriteKey` restores all 40 old hashes.

## 2. The staging

| File | What |
|---|---|
| `src/scenes/sector1-reactor-staging.ts` | Pure numbers and rules, every source and estimate named: sides and facing (staging §2, §3.3), rows (§5), the fixed camera (manual p. 30, §4), heights, spots, the back-row step, the boss's form shift, the rigs, the painting plane. |
| `src/scenes/sector1-reactor.ts` | The `SceneFactory`: one painting plane (no parallax layers, no 3D ground, no fog: the painting's own grated floor is the floor), light rig, grade. Registered as `sector1-reactor` in `src/scenes/index.ts`. |
| `src/engine/StageFacing.ts` | `bodyFacingOption` (the stage's facing option) and `FixedCamera` / `stageCamera`. |
| `src/app/screens/BattleScreenFf7Stage.ts` | `Ff7StageDirector`: steps a member to the other row's spot when `ff7.row` flips (Change), shifts the boss while the raised painting shows (read back from the stage, so it lands on the swap frame). |
| `src/app/screens/BattleScreenStageHook.ts` | Chooses the per-location hook by game: FFX/FFX-2 get `attachAirshipBattle` exactly as before, FF7 gets `attachFf7Staging`. |

- **Sides and facing.** Party on the right, bodies turned to -x; Guard Scorpion on the left,
  turned to +x. Nothing is mirrored: each painting declares the way it faces and `mirrorFor`
  agrees (Barret keeps his right gun-arm).
- **Rows.** Both start front (staging §5). The front row is an arc at about one distance from the
  boss (Cloud 4.37, Barret 4.27 world units); the back row is 0.6 further right (**our estimate**),
  reached in a 360 ms step (**our estimate**). The harness proves Barret's Change moves him
  2.15 to 2.75.
- **Size.** Heights from the composite's pixel heights against depth: Cloud 1.75, Barret 2.03,
  Guard Scorpion 2.16 standing height (its body is 3.8 wide): a boss larger than the party.
  **Our estimate** (presentation, not game data).
- **Camera: FF7's "Fixed" setting, first version.** Every rig is the one level shot (fov 30,
  from z 8.6), and the stage's camera port is a `FixedCamera`: held on `idle` for the whole
  battle, every move, cut, push, roll and punch swallowed, the presenter's releases ignored;
  shake still plays (**our estimate** that Fixed keeps it). **Follow-up: FF7's default camera
  (Auto) moves** (staging §4); not built.
- **Hits.** Through the existing presenter: the attacker lunges toward -x (its body facing), the
  target flashes, the fallback numerals print (`stage-*-hit.jpg`, "40"), the message bar names
  the command and prints the hint lines.
- **Grade.** `gamma` 2.0 in the FF7 palette only: the post chain writes linear light to the
  screen, so at the house gamma 1 this dark plate's darks fell from 24 to 3 of 255; at 2.0 it
  reads as the composite. No FFX or FFX-2 palette changed.
- **Upright phone (390x844).** The same shot with the fov opened to keep the width
  (`holdWidth`), the painting at its 16:9 size so the fighters stay on its floor, and the scene's
  background above and below (a letterbox). Growing the plate to fill the portrait frame floated
  the fighters over the middle of the painting (tried, rejected). The upright phone's real
  framing is the FF7 HUD's call.

## 3. Shared files touched (FFX and FFX-2 unchanged)

- `src/scenes/types.ts`: `SceneStaging.sideFacing?` and `fixedCamera?`, copied by `stagingOf`
  only when set. Additive; not a `CONTRACTS.md` file.
- `src/engine/BattlePresenterStage.ts` (746 lines, did not grow): the actor's facing option goes
  through `bodyFacingOption` (without `sideFacing` it is `{ side }`, the old option), the camera
  through `stageCamera` (without `fixedCamera` it is the plain `HoldableCamera`).
- `src/engine/BattleMoments.ts` (512, did not grow): the opening slide-in starts on the party's
  own side; the FFX/FFX-2 arithmetic is the same expression as before.
- `src/app/screens/BattleScreen.ts` (931, did not grow): the airship hook line calls
  `attachStageHook(chapter.game, ...)`.
- `src/scenes/index.ts` (399, did not grow; three stale comment lines tightened).
- Proven: `tests/unit/ff7-stage.test.ts` pins the FFX/FFX-2 option (`side`), the plain camera and
  `stagingOf`; `ffx2-atb-golden` and every FFX/FFX-2 suite pass; `git diff` under
  `src/battle/ffx*` is empty.

## Checks

`npx tsc --noEmit` clean. `tests/unit/ff7-stage.test.ts` 17 tests. Full `npm test`: 508 files
pass, 1 fails: `strategy-ffx2-bahamut.test.ts` "heal-only route" times out (23 to 26 s against a
15 s limit) **on main's tree too** (1a43fd7b), so it is not this change; the machine is loaded.
`node tools/orphans.mjs`: 24, the same as before (no new orphan). `npm test` also rewrote
`critic/bench/*/results.json` (bench outputs): left unstaged.

## How to see it

`npx vite --port 6300` (or any port) in the worktree, open
`/tools/ff7-stage/harness.html?seed=1`: the fight plays itself with a fixed test policy (Barret
Changes on his first turn, everyone Defends while the tail is up, otherwise Attack).
`PYREFLY_BROWSER=gpu node tools/ff7-stage-shots.mjs --url=http://127.0.0.1:6300` writes the
frames. The harness sets `setFf7ExperimentReadyForTests(true)`; the constant stays `false`.

## Open

1. **FF7's moving camera (Auto)** is the documented follow-up; only Fixed is built.
2. **The HUD track** must still make `BattleScreen` reach the field for FF7: `battleSpellFx` and
   `createHud` throw for `'ff7'` today, so only the harness shows this scene. When it does, the
   staging hook is already wired (`attachStageHook`).
3. **Upright phone framing** belongs with the FF7 HUD (letterbox here).
4. **Poses:** only idles exist for Cloud and Barret (and the two boss forms); attack, hurt, ko
   and victory fall back to the idle. Any new pose is a new art round (rule 9).
5. The **rim light** outlines each figure; lower it for FF7 if Bailey finds it off the composite.
6. Numbers to confirm or replace with a real-game check (Bailey's go-ahead only): the back-row
   step, the figure heights, the camera.

## CHECK (independent, 2026-09-27; the checker built none of this)

Scope: the engine follow-ups (`53a2657d`, `eebf1da9`), the art install (`a358b6e7`) and the staging
(`6570dfd9`) on `ff7-engine`. Game case: FF7 only, plus the shared plumbing named in section 3.
Verdict: **no blocker, no major.** Four minors, listed below.

**Engine, proven by running it** (a scratch probe that imports the engine directly, apart from the
branch's own tests):

- **Change.** Barret's damage taken over 60 seeds, front vs back row: Rifle 35-37 vs 18, Scorpion
  Tail 62-66 vs 30-32, split Tail Laser 72-77 vs 35-37. These agree with research
  `ff7-guard-scorpion.md` §4 (35-38 / 17-19, 62-68 / 30-34, 72-77 / 35-38). His Long Range Gatling
  deals 32-34 in front and 32-35 behind, so it is not halved (core §5.1). All 60 battles were won.
  Change never targets, spends the turn and is labelled as our estimate. Research §5.1 now cites
  the manual (p. 18).
- **Clock** (500 ms ticks with `throughInput`). Recommended runs its top and deep menus (15 and 15
  ticks). Wait runs its top menu (15) and holds its deep menu (0). Active runs both.
  `setAnimating(true)` holds Recommended and Wait (0 ticks). In Active, 20 s of ticks runs 600
  ticks and executes nothing. A summon animation holds Active (0). The queued action executes once
  the animation ends. All of this matches core §2.5 and the manual p. 29 note, whose conflict is
  labelled. **Defend** is set on submit and cleared when the gauge fills (manual p. 18).
- `npx tsc --noEmit` is clean. Full vitest: 507 files pass. Two fail only under load:
  `audio-manifest-io` (a Temp rmdir race) and `strategy-ffx2-bahamut` (a timeout). Neither is
  touched by the branch, and both pass alone (28/28). `ffx2-atb-golden`, `ff7-golden`, every
  `presenter-*` suite and `ff7-stage` pass. `node tools/orphans.mjs` lists the same four
  directories on the branch as on main.

**Art:**

- All five installed PNGs are byte-identical (sha256) to the round 2 README's "Final install list"
  files under `candidates/2026-09-27-ff7/` and to the backups in
  `approved/2026-09-27-ff7/installed/`. The PNGs and sidecars match the backups one for one.
- Sidecar `facing` is left for Cloud and Barret and right for both boss forms. The tail-up
  `scale` is 1.098385 (748/681).
- verify-approved gives 267 ok / 0 / 0 on the worktree and 262 ok / 0 / 0 on main's tree.
- I hashed 30 of the 214 other locked files (spread evenly) against `approved-hashes.json`. All 30
  hashes and all 30 mtimes match.
- In `public/art`, the only files modified on 2026-09-27 are the ten FF7 files and
  `manifest.json`. `node tools/gen/manifest.mjs --check` reports it unchanged, so the manifest is
  exactly what the unchanged files produce.

**Staging, headless** (own port 6311, gpu, seed 1, 1600x900 and 390x844; I looked at every
frame):

- The party is on the right, facing -1, and Guard Scorpion is on the left, facing +1. No figure
  is mirrored.
- Barret moves from x 2.15 to 2.75 after his Change.
- On Raise Tail the painting swaps to `ff7-guard-scorpion-tail-up` and the figure moves to
  x -1.575. The body's right edge stays at 829 px in both paintings, so the body does not jump.
- The fixed camera holds [0, 1.9, 8.6] fov 30. Only the shake moves it (-0.028, 1.876 during a
  hit).
- No console errors and no failed requests.

**FFX / FFX-2 untouched:**

- `git diff main...ff7-engine` is empty under `src/battle/ffx*`. No FFX or FFX-2 scene module
  changed.
- `BattleScreen`, `BattlePresenterStage`, `BattleMoments` and `scenes/index` did not grow.
  Without `sideFacing` or `fixedCamera` they take the old paths.
- I rendered Chapter I (`seymour-flux`), the airship chapter (`evrae-airship`, the hook this
  change reroutes) and FFX-2 `ffx2-bahamut` at seed 1 from the branch and from main (two ports).
  I also rendered Chapter I and `ffx2-bahamut` from the live build.
  - `seymour-flux` and `evrae-airship`: every figure's art, facing, mirror and x/y/z are
    identical.
  - `ffx2-bahamut`: party x differs by at most 0.05 between two main runs, and the branch and live
    fall in the same run-to-run spread (ATB relax timing).
  - The frames look the same. The only differences are the timing of Evrae's swim and the ATB
    moment, and main differs from itself in the same way.

**Findings (all minor):**

1. **The hit makes an FF7 figure see-through for a moment.** Every FF7 figure has only an idle
   painting. So `flinch()` asks for `hurt`, which resolves to `idle`, and `setPose` crossfades the
   same texture across its two planes. Halfway through, both planes are part transparent. My
   1600x900 hit frame shows the reactor pillar through the boss's head (the builder's frame caught
   the fade finished).
   - This is house behaviour, not new code. It shows on every FF7 hit because no FF7 figure has a
     hurt painting.
   - Fix: skip the crossfade when the resolved pose's texture is the one already shown. That would
     change every idle-only FFX/FFX-2 figure too, so the case must be decided first (rule 14).
     Alternatively, gate the fix to FF7.
2. **Barret's back-row spot hides him behind Cloud.** At 1600x900 their screen boxes overlap by
   about 110 of Barret's 205 px, and Cloud covers Barret's lower body and legs. The step (+0.6 in
   x) and the spots are our estimates. Offer Bailey a different step (for example some z as well)
   before any release.
3. **The upright phone is a letterbox with tiny figures.** At 390x844 the fight is a 16:9 strip
   about 230 px tall, and Cloud is about 50 px tall. This is disclosed as the FF7 HUD's call; it
   must be settled before anyone plays this on a phone.
4. **The Active animation rule and the field are not wired.** No presenter calls
   `setAnimating`, and `BattleScreen` cannot reach the FF7 field yet (`createHud` and
   `battleSpellFx` throw for `'ff7'`). Only the harness shows the scene. Both are disclosed.
   Separately, `src/battle/common/types.ts` grew 2660 to 2675 lines over the branch (`4347dbf7`
   +7, `862a0cd3` +8, both earlier commits); `53a2657d` itself is flat.

Not checked: FF7's look against the real game (Steam copy; Bailey's go-ahead), and anything
under `src/ui/**` on `ff7-plumbing`.
