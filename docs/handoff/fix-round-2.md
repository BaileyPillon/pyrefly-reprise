# Round 2 — integration

**Scope.** Six round-2 agents landed independently against
`docs/handoff/playability-round-1.md` §4. This pass type-checks and tests the
combined tree, checks for orphans, plays all five chapters through the **real
app**, re-captures the gallery, reads every frame, and ranks what is still
visibly wrong.

**Nothing in this pass touched a boss's HP, stats, abilities, counters, AI
script or tactic.** The only source change is to a capture harness
(`tools/gallery.mjs`) and it made the harness stricter, not looser — see §3.1.

---

## 1. Type-check, tests, orphans

| | Result |
|---|---|
| `npx tsc --noEmit` | **clean** (exit 0, no output) |
| `npx vitest run` | **2,871 passed**, 85 files, 0 failed |
| `node tools/orphans.mjs` | 428 modules, 414 reachable, **14 orphaned** |

Both were run twice, at the start of this pass and again at the end: 2,858
tests at the start and 2,871 at the end, because other agents were still adding
tests to the tree while this pass ran. Both runs were green and the type-check
was clean both times.

**No round-2 breakage to fix.** Two agents flagged
`tests/unit/pause-objectives.test.ts` as failing `tsc` at lines 277 and 288
(`actorId` / `targetId` not on `Omit<BattleEvent,'seq'>`) while they ran; the
pause-screen owner landed it, and the repo-wide type-check is clean now.

### 1.1 Orphans

All 14 are the pre-existing set `docs/handoff/polish-round-1.md` §3 enumerates —
the retired pixel-art subsystem (`src/sprites/**`, `engine/SpriteActor.ts`,
`engine/BlobShadow.ts`, `engine/shaders/SpriteShader.ts`,
`scenes/placeholder-sprites.ts`), plus `audio/dsp/index.ts`,
`battle/ffx2/fixtures.ts`, `ui/common/MessageBar.ts` and `ui/ffx2/PartyPrep.ts`.
**Round 2 orphaned nothing**, and it *un*-orphaned one: `src/story/registry.ts`
was polish-round-1's fifteenth orphan and is now imported by the shipping path
(`src/app/screens/BattleScreenCutscenes.ts:75`, for `midBattleDeadlineMs` — the
skip-beats fix). 34 modules were added since that count and every one is
reachable.

---

## 2. Five-chapter sweep through the real app

`critic/scratch/sweep.mjs` against a dev server on **port 5250**, one fresh page
load per chapter, seed 1:

```js
window.__pyrefly.gotoChapter(id, {
  skipCutscenes: true, skipPrep: true, seed: 1, auto: 'intended', speed: 'skip',
})
```

| # | Chapter | Outcome | Turns | Links | `elapsedMs` | Wall | Console errors |
|---|---|---|---:|---:|---:|---:|---:|
| 1 | `seymour-flux` | **victory** | 82 | 1 | 244,603 | 245 s | **0** |
| 2 | `yunalesca` | **victory** | 237 | 1 | 402,958 | 410 s | **0** |
| 3 | `braskas-final-aeon` | **victory** | 97 | **7** | 408,097 | 411 s | **0** |
| 4 | `ffx2-bahamut` | **victory** | 75 | 1 | 79,232 | 84 s | **0** |
| 5 | `ffx2-vegnagun-shuyin` | **victory** | 58 | **5** | 505,535 | 512 s | **0** |

**5/5 victories, 0 console errors, 0 page errors.** `preview` was `false` on all
five, so every one ran a real engine. Report:
`critic/scratch/sweep-report-r2.json`.

**Round-1 issue 1 is closed.** Round 1 recorded a `console.error` on three of
the five chapters (`[cutscene] mid-battle beat … ran past its 8000ms budget`)
and the gallery pass logged a fourth variant. There is not one left, on any
chapter, in either harness — the sweep and both gallery passes report
`consoleErrors: []`. That is the gate `docs/handoff/r2-skip-beats.md` §2.2 set,
reproduced on a different port and a different day.

Turn counts match round 1 within noise (82 / 237 / 97 vs 104 / 75 / 58 — the
`braskas-final-aeon` number is the **last link's** turns, not the chain's, so
104 → 97 is link-7 variance, not a balance change). Link counts are identical:
1 / 1 / 7 / 1 / 5.

`elapsedMs` is not a fair before/after comparison and this report will not
pretend otherwise — `r2-skip-beats.md` §2.2 already measured beats at 4–6 % of a
chapter's wall clock, and this box was running a second Chromium for part of the
sweep. Chapter 4 is the one clean read: 64 s → 79 s here against 104 s on the
r2 author's box.

---

## 3. Gallery

`node tools/gallery.mjs --url=http://127.0.0.1:5250/ --out-dir=docs/screenshots/80 --mode=gallery`
— 15 frames, `errors: []`, `notes: []`, `consoleErrors: []`, renderer
`ANGLE (… SwiftShader …)`, wiring 343 FFX abilities / 69 items and 324 FFX-2
abilities / 33 items / 14 dresspheres / 43 Garment Grids.

Plus the two end-state frames from `critic/scratch/victory-shots.mjs`:

* **`54-yunalesca-form3.png`** — the form watcher saw `[0, 1, 2]` in 587 frames,
  so all three forms were genuinely walked; the frame catches the
  `USES METAMORPHOSIS` banner on the Form III entry.
* **`55-results-victory.png`** — Chapter 1's results panel after a real victory
  (`skipResults: false`). Screen state: `outcome: 'victory'`, `clearMs: 295989`,
  `newBest: true`.

17 frames in `docs/screenshots/80/`, all read.

### 3.1 The harness had to be fixed first, and why

The first pass produced **four dead frames**: `50-yunalesca.png`,
`51-bfa.png`, `52-ffx2-bahamut.png` and `53-ffx2-vegnagun.png` came out with no
CTB list, no party window, no numerals and the camera on an intro rig —
`53` was a picture of Vegnagun's tail against empty sky with the boss out of
frame. Round 1's `70/50-yunalesca.png` has the full HUD in the same slot, so
this looked like a round-2 regression. It is not one. It is the harness.

Measured, not guessed, with `critic/scratch/zz-r2-hudprobe.tmp.mjs`: on a
**fresh page load**, 60 frames after `waitForScreen('battle')`, chapter 2 reports

```
screen=battle  .ffxhud 0x0 display=none hidden=true
```

`BattleMoments.battleStart` (`src/engine/BattleMoments.ts:266`) hides the HUD
for the opening — party slide-in, then the boss reveal plate — and hands it back
in its `finally`. Its own doc comment says why: *"FFX does not have that problem
because its battle HUD is not up yet."* Under SwiftShader that opening outlasts
`settle(60, 600)`, so the capture landed inside it. The opening is new since
round 1 (`docs/handoff/bp1-moments.md`), which is why round 1's frames were fine
and these were not.

Waiting for the HUD fixed `50` and nothing else. The second measurement, with
`critic/scratch/zz-r2-ch5probe.tmp.mjs`, says why — over 960 frames of chapter 5
the HUD went **down twice more**, at +360 and +720 frames, both times with the
actor list changing under it:

```
step 2: hud 0x0 hidden=true  actors: vegnagun-leg@idle PLACEHOLDER, node-a…, node-b…, node-c…
step 5: hud 0x0 hidden=true  actors: vegnagun-body@idle PLACEHOLDER, bulwark-r…, bulwark-l…
```

**A chained encounter replays the whole opening for every link.** Chapter 3 is
7 links and chapter 5 is 5, so a capture that waits once and then settles has a
good chance of settling straight into the next link's reveal. That is exactly
what `51` and `53` did.

The fix in `tools/gallery.mjs` is `settleOnHud()`: wait for the HUD, settle,
and if the settle crossed a link boundary, wait again — up to six attempts,
frame-driven rather than wall-clock for the reason `r2-skip-beats.md` gives. It
`note()`s the frame as an opening frame if it never wins, so a future dead frame
says so in `report.json` instead of being silently shipped. With it, all four
chapters capture the fight. No game code was touched.

The *game* half of that finding is issue 3 in §5 — a player also gets a full
boss-reveal cinematic between every link, and nobody has ruled on whether that
is wanted.

---

## 4. What round 2 fixed, read off the frames

| Round-1 issue | Status | Evidence in `docs/screenshots/80/` |
|---|---|---|
| **1** `speed:'skip'` pays full price for a story beat | **fixed** | 0 console errors across the whole sweep and both gallery passes (§2) |
| **2** damage numbers stack on one spot | **mostly** | `50` prints a single clean `2217`; `52` fans `215 / 504 / 347 / 153 / 194`. Not closed — see §5.2 |
| **3** numerals and sprites under the right-hand HUD | **fixed for the HUD** | `47`, `50`, `51`: not one numeral over the CTB column. Mortiorchis is clear of the CTB column and the right screen edge in `44`/`45`, where round 1 had it ~70 % hidden behind them. Viewport edges are still open for numerals — §5.1 |
| **4** CTB list shows single letters | **fixed on the FFX side** | `44`, `45`, `47`, `50`, `51`, `54` — real portraits, including enemies (`Seymour F…`, `Mortiorchis`, `Yunalesca`, `Yu Pagoda`). FFX-2 still has none — §5.4 |
| **6** `48-overdrive.png` contains no Overdrive | **half fixed** | `48` now carries the `OVERDRIVE — Mighty Guard` banner with Tidus mid-swing. `46-attack.png` is still not an attack — §5.12 |
| **7** Rikku blown out to pure white by a cast bloom | **fixed** | `52`, `53`: Rikku's silhouette, colours and goggles all read; no blown highlight anywhere on her |
| **8** two boss sprites read as flat untextured shapes | **fixed** | `51`: Braska's Final Aeon has fur, scarring, red war-paint and separate limb materials where round 1 had a flat green silhouette. `52`: Bahamut has wing membrane, chest glow and scale detail. Vegnagun is a different problem now — §5.6 |
| **10** element panel shows bare labels | **fixed** | `44`, `45`, `47`: `FIRE ICE THUNDER / WATER HOLY GRAV` now carry state-coloured diamond chips |
| **5** Rikku's Dark Knight sprite | **not fixed** | §5.5 — nobody owned it; it is an art-asset gap, diagnosed below |
| **9** portrait style and crop inconsistent | **partly** | the prep roster reads as one set now; Auron and Kimahri still do not — §5.13 |

Chapter 3's tactical work (`r2-bfa-verifiers`) is visible too: `51` shows the
party at 6,492 / 5,358 / 12,984 HP mid-chain with the Yu Pagoda alive and both
`Talk` charges unspent, which is the line that doc describes.

---

## 5. Remaining visible issues, ranked

None of these stop a chapter being winnable — that is settled in §2 — and none
were introduced by the harness fix in §3.1.

### 1. Numerals escape the viewport edges — HIGH (UI)

The round-2 safe area keeps numerals off the HUD **panels**, but nothing clamps
them to the **canvas**:

* `51-bfa.png` — `12`, `12558`, `12344` are sliced in half by the **left** edge
  at y ≈ 810-880, and a fourth is off-screen entirely.
* `52-ffx2-bahamut.png` — `64` and `177` are sliced by the left edge.
* `46-attack.png` — `1400` loses its last digit to the **right** edge.
* `54-yunalesca-form3.png` — a numeral at x ≈ 0, y ≈ 595 is cut by the left edge.

Owner: `src/ui/common/DamageNumbers.ts` / `damageLadder.ts`. The safe-area math
already reads HUD panel rects; it needs the viewport rect on the same footing.

### 2. Multi-heal and multi-hit numerals still overlap — HIGH (UI)

`51-bfa.png` is the worst case and it is the 7-link chain, which no round-2
capture covered: `1159` sits under `+1500`, `1122` under a second `+1500`,
`1658` over `1500`, six figures inside 200 px of each other. Green heal numerals
and white damage numerals appear to share one lane rather than being separated
the way two targets are. `53` has `1783` buried under `1968`; `52` piles
`197 / MISS / 229`.

The round-2 ladder is a real improvement — `50` and the top half of `52` are
clean — but a party-wide heal landing on the same frame as a multi-hit is not
solved.

### 3. Every link of a chained encounter replays the boss-reveal opening — MEDIUM (design ruling wanted)

Measured in §3.1: chapter 5 takes the HUD down and runs the opening cinematic
**five** times, chapter 3 **seven** times. `BattleMoments.battleStart` is called
per link, not per encounter. For the player that is a party slide-in and a name
plate between every phase of one continuous fight. It may be wanted for Yu
Yevon arriving; it is unlikely to be wanted for `bulwark-l` / `bulwark-r`.
Suggestion: reveal on the first link, and afterwards only when the enemy roster
actually changes identity — but this is a direction call, not a defect, so it is
flagged rather than changed.

### 4. FFX-2 has no portraits anywhere — MEDIUM (UI fidelity)

The round-2 portrait pass owned `src/ui/ffx/CtbList.ts` only. `52` and `53`
show the FFX-2 party rows as `WM` / `DK` / `DK` / `WR` monogram tiles, and
FFX-2 has no turn-order list at all, so half of round-1 issue 4 is untouched.
The portraits exist (`yuna.png`, `rikku.png`, `paine.1.raw.png`) and
`portraitChipHtml` is game-agnostic.

### 5. Rikku's Dark Knight art does not exist — MEDIUM (art)

Diagnosed, not guessed. `src/data/ffx2/builds/bevelle.ts:63-66` and
`farplane.ts:66-69` both set `currentDressphere: 'dark-knight'` for Rikku, and
`artIdFor` (`src/engine/BattlePresenterArt.ts:65`) turns that into the art id
`rikku-dark-knight`. `public/art/characters/` has **no such folder** —
`paine-dark-knight` and `yuna-dark-knight` both exist — so she falls back to her
default look while her HUD chip correctly reads `DK`. Visible in `52` and `53`.
`public/art/**` is the art fleet's; reported, not touched.

### 6. Nine character folders have no `idle.png`, so their figures are procedural placeholders — MEDIUM/HIGH (art)

`characterUrl(artId, pose)` asks for exactly `<artId>/<pose>.png`. These folders
hold only numbered candidates (`idle.1.png`, `idle.2.png`, `idleB.1.png`) and no
plain `idle.png`:

```
anima  bahamut  ifrit  ixion  shiva  yojimbo
vegnagun-body  vegnagun-head  vegnagun-leg
```

`node-a` / `node-b` / `node-c` and `bulwark-l` / `bulwark-r` have no folder at
all. The chapter-5 probe confirms the consequence at runtime —
`vegnagun-body@idle PLACEHOLDER`, `vegnagun-leg@idle PLACEHOLDER`,
`node-a/b/c PLACEHOLDER`, `bulwark-r/l PLACEHOLDER` — so **links 2-5 of chapter
5 are fought against grey procedural shapes**, and every aeon but Valefor is a
placeholder when summoned. For the nine folders that do have candidates this is
a choose-one-and-name-it job, not a render job.

This supersedes round-1 issue 8's Vegnagun half: the tail (`vegnagun-tail`, the
one part with a plain `idle.png`) is painted and reads fine in the first pass's
`53`; the body, head and legs were never painted at all.

### 7. All ten aeon portraits are missing — MEDIUM (art)

`src/data/ffx/aeons/index.ts` sets `portraitKey` for all ten aeons
(`valefor`, `ifrit`, `ixion`, `shiva`, `bahamut`, `anima`, `yojimbo`, `cindy`,
`sandy`, `mindy`). `public/art/portraits/` has **none** of them — only
`bahamut-fayth.png` and the numbered `valefor.1..3.png`, neither of which is the
name the code asks for. A summoned aeon therefore drops back to a monogram in
the freshly-portraited CTB list; the first gallery pass caught `Bahamut` as a
bare `B` tile twice in `46-attack.png`.

### 8. The strategy guide collides with the FFX-2 boss bar and the Overdrive banner — MEDIUM (UI)

* `52` / `53`: the `G HIDE GUIDE` chip is drawn straight through the boss name
  in the FFX-2 SCAN bar — `Bahamut` and `Vegnagun` are both half-covered.
* `48`: the `OVERDRIVE / Mighty Guard` banner is composited over the guide
  panel's rules text, and both are unreadable in the overlap.

This is the same family as the soft rail `r2-framing-safe-area.md` flagged (the
guide sits over the party's heads); the guide's geometry has no owner yet.

### 9. The Overdrive letterbox slices the HUD instead of moving it — MEDIUM (UI)

`48-overdrive.png`: the bottom cinematic bar cuts the party window **mid-row** —
Yuna's row is half a row tall and Kimahri's is gone — and the top bar cuts the
first CTB row. Visual-bible §3.11.0 authors those windows *sliding off* for an
Overdrive; right now they are simply occluded at an arbitrary height.
`BattleMoments.ts:236` already names this and says `HudPort.setVisible` is too
blunt for it.

### 10. Seymour Flux is clipped by the top edge on the action rig — MEDIUM (framing)

`47-boss-attack.png`: his head, upper arms and crown are cut off at y = 0, and
Mortiorchis is out of frame entirely. The safe-area pass solved the **idle**
composition (`44`, `45` are both clean and Mortiorchis is visible in them); the
action rig pushes in on top of it. The measured rails in
`docs/ENGINE-API.md#hud-safe-area` are an idle-frame result and the action rigs
were not re-probed against them.

Related and smaller: in `44` and `45` Mortiorchis stands directly behind Seymour
and is ~55 % occluded by him. It is his mount, so that may be intended — but it
is a separately targetable combatant with its own HP bar.

### 11. Yunalesca's Form III painting is cut by a hard rectangle — MEDIUM (art / render)

`54-yunalesca-form3.png`: the skull throne stops dead on a straight horizontal
line at y ≈ 718 and the right-hand tentacles on a vertical line at x ≈ 1100,
with the backdrop showing through below and beside them. That is a canvas edge,
not a silhouette — either `yunalesca-3/idle.png` is cropped tighter than the
figure or its sidecar `{width,height,baselineY}` disagrees with the PNG.

### 12. `46-attack.png` is still not an attack — LOW (capture coverage)

Both passes ended on `yuna` / `summon` (`report.json`: `seq 111`, then
`timing "f26"`). The gallery keeps the heaviest candidate frame and a summon
outweighs a sword swing, so the slot named `attack` has never once shown one.
Worth pinning the candidate to `kind: 'attack'` rather than any party action.

### 13. Two portraits still do not match the set — LOW (art)

Round-1 issue 9 is mostly closed — the prep roster in `42` reads as one style
now — but: **Auron** is still photo-real and much darker than the rest, and at
CTB tile size (`50`, `51`, `54`) he is a dark smudge with sunglasses rather than
a recognisable face; **Kimahri**'s results-row thumbnail still washes out to
pale blue in `49` and `55` although his full portrait in `43` is excellent.
Rikku's and Lulu's roster crops are still noticeably tighter than Tidus's and
Yuna's.

### 14. FFX-2 status chips run off the right edge — LOW (UI)

`52`: Paine's row reads `CRS SHL PR` — the third chip is truncated by the screen
edge. Three chips is evidently one more than the row was measured for.

---

## 6. Files

* Changed: `tools/gallery.mjs` — `waitForHud()`, `hudUp()`, `settleOnHud()`, and
  `captureOtherChapters` now waits on them instead of a bare `settle(60, 600)`.
  No game code, no test, no data file was touched in this pass.
* Sweep: `critic/scratch/sweep.mjs` → `critic/scratch/sweep-report-r2.json`
* Victory captures: `critic/scratch/victory-shots.mjs`
* Probes, kept for the next reader: `critic/scratch/zz-r2-hudprobe.tmp.mjs`
  (fresh-page vs after-chapter-1 HUD state),
  `critic/scratch/zz-r2-ch5probe.tmp.mjs` (960 frames of chapter 5, HUD +
  camera rig + actor placeholder state), `critic/scratch/zz-r2-crop.tmp.mjs`
  (crop/zoom a frame for reading small type).
* Screenshots: `docs/screenshots/80/` — 15 gallery frames +
  `54-yunalesca-form3.png` + `55-results-victory.png` + `report.json`.
