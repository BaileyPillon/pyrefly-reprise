# Chapter XVI — Ixion at Djose (FFX-2): LISTED and playable (2026-09-27), provisional plates C2 + repaired A1 await Bailey's pick

**Branch `chapter-ixion`** (worktree `D:/pyrefly-ch-ixion`, sparse). Merged `origin/main` 0cd8399c (release 25, iter2-b6)
at 4417b4f6. **Not merged to main, not deployed.**

**Bailey, 2026-09-27 ~18:30 EDT:** "full speed ahead, godspeed. advisor v3 needs to be in the very next build. ixion
needs to be in the next build as well. sin can wait for now." So the chapter is listed here, ready to ride the next
build with advisor v3 (a separate branch).

## LISTED (2026-09-27 ~18:40-20:00 EDT) — what changed

**Game case:** the chapter, story, guide, tactic, scene, plates and the Recharge banner are **FFX-2 only**. The listing
(`encounters.ts`, the story registry, `CHAPTER_META`, the board and its counts, `CHAPTER_GAME`), the DSL's new
`backdrop()` step and its cutscene-screen port are **shared plumbing, both**.

| Part | Where | What |
|---|---|---|
| Number, title | `src/data/chapter-ffx2-ixion-djose.ts` | **Chapter XVI**, "Ixion" (was 17 while unlisted). Sin (FFX, D-270, two chapters, unlisted on `chapter-sin` as 16) waits and takes the numbers after this: **merging `chapter-sin` must renumber Sin, not Ixion.** |
| Listing | `encounters.ts` (`CHAPTERS` / `CHAPTER_IDS` last), `chapters-unlisted.ts` (FF7 only now) | The board: 16 cards, "0 of 15 beaten", XVI last in the X-2 group; wrap-left from the first card lands on it. `CONTRACT-CHANGES.md` entry. |
| Card | `frontend/chapterPlates.ts` | Look B idle over the Chamber stand-in; the card crops to head and horn (face 0.27, 0.39 of the idle). |
| Meta / prep / pause | `src/data/chapter-meta-ixion-djose.ts` | Numeral XVI; tagline "Where the Fayth Stood" (ours, inferred); objectives Survive Thor's Hammer / below half / Defeat Ixion; tip (sourced facts); quote = Rikku's verbatim opening line; hero plate = **stand-in** `pause/ch16-ffx2-ixion-djose-standin` (PROVISIONAL, not approved). |
| Briefing | automatic | "Fifteen fights" from the count (coachCopy number words), as Chapter XV listed. |
| Guide | `src/data/guides/ffx2-ixion-djose.ts` | 4 rules (the loop, Recharge then the Hammer, Shell and heal on Recharge, Lightning heals / Water hurts), hints for every row the tactic picks, the Wait-split habit line; the Hammer's element is never named (IX-2). |
| Tactic | `src/engine/tactics/ffx2-ixion-djose.ts` (+ index, lookup) | The bench's **sensible** line as a tactic; 20 seeds at bench speed: at least 18 wins (test). Advisor v3 (other branch) touches `src/engine/tactics/**`: this branch only **adds** one file and three index lines. |
| Recharge banner (the check's major) | `src/ui/ffx2/toldMoves.ts`, `battleMessage.ts` | The FFX-2 battle-message banner shows **"Ixion · Recharge"** as Recharge starts. Only moves a source says are read off the screen are listed (just `x2-ixion-recharge`); no other FFX-2 enemy move changes. FFX untouched (its own HELP bar). |
| Scene | `src/scenes/djose-chamber.ts`, `scenes/index.ts`, `pyreflyCanon.ts` | The Chamber on the stand-in plate, framed as Chapter V frames its plate (the FFX-2 HUD's solved slots); no live motes (the research names none, 'unattested'); on an upright phone the idle camera dollies back to z 13.2 (PR-0201 option A, reused from Chapter XI) so Ixion stays in the slice. |
| Plates (rule 9: options until Bailey picks) | `src/data/ixion-plates.ts`; `docs/concepts/chapters/ixion-djose-2026-09-27/stand-ins/` | **Now options C1 / A1, provisional (see below).** At the listing commit no scene options existed (`.../scenes/` absent at 2026-09-27 20:00). So the stand-ins the concept README names are installed under **their own** keys, add-only: `backdrops/ffx2-djose-chamber-standin` (Macalania hall over the Den floor, storm grey, greybox hole) and `backdrops/ffx2-abyss-standin` (the Chapter 5 Farplane washed white); sidecars say PROVISIONAL; in no hash list. When the judge-passed options land, install them as `backdrops/ffx2-djose-chamber-provisional` / `ffx2-abyss-provisional` (add-only) and change **one constant each** in `ixion-plates.ts`. The wake is the approved `bevelle-underground`. Manifest regenerated: additions only (2 backdrops, 1 pause plate + its 2x). |
| Story | `src/story/scripts/ffx2-ixion-djose.ts` | pre: Gippal missing, fiends from the Chamber, the stairs, Rikku's **verbatim** "This can't be happening." post: results (mission complete) → the fall → the Abyss plate (Shuyin calls her Lenne, Vegnagun, the embrace, Nooj and Gippal, Baralai revealed, two spheres for Paine, Gippal's **verbatim** "Take care of things topside.", Yuna's **verbatim** "I'm all alone.") → **four whistles** (each a one-press `(Whistle)` prompt, the existing `whistle-answer` cue, a gold flash, a light line; skippable: hold Enter or pause > Skip Scene still ends on flag 4) → the Bevelle Underground plate. Every other line is ours, commented with its beat. Nooj is **text-only** (his portrait is not approved); Shuyin, Baralai, Gippal use approved portraits. |
| DSL | `src/story/dsl.ts` (`backdrop()`), `CutsceneRunner.ts` (optional port), `app/screens/cutscenePlate.ts`, `CutsceneScreen.ts` (one line) | Additive step: swap the cutscene plate with a crossfade (cuts under a skip); the chapter eyebrow steps out once the scene has moved. |
| Music (rule 13, nothing new) | record + script | Fight `boss-ffx2-aeon` (the sourced mood of "Aeons"); field bed `scene-bevelle-underground` (FFX-2 fallback, Chapter VI precedent); Abyss `scene-farplane` ("The Farplane Abyss"); wake `scene-bevelle-underground`. THEMES.md cue-map row XVI. Bailey's call by ear. |
| Save | `tests/unit/save-ixion-listed-fixture.test.ts`, `tests/fixtures/saves/release-25-main.json` | A save exported from the **live release-25 main build** loads unchanged and gains XVI as unplayed; the board counts it; a clear moves "N of 15". `SaveData.ts` is untouched. |
| e2e | `tests/e2e/ffx2-ixion.spec.ts` | From the title by real keys (desktop) / taps (phone): board, the XVI card, prep, the opening, the fight to a win following the guide's NEXT (the tactic), the Recharge banner and Thor's Hammer, results, the fall, the Abyss, four whistles, the wake, back on the board with the clear ("1 of 15"). Frames `docs/screenshots/chapter-ixion/listed/`. |

### C2 and a repaired A1 installed provisionally; Ixion's spot moved onto C2's floor (2026-09-27 ~22:00-23:15 EDT)

**Game case (rule 14): FFX-2 only** (the Djose Chamber and the Farplane Abyss of Chapter XVI; no FFX chapter moves).
**Still options (rule 9): Bailey has not picked.** The adversarial judge passed **Chamber C2** and **Abyss A1**, with
faults; this pass fixes them and makes that pair the one the build shows. C1 and the unrepaired A1 stay installed.

- **A1 repaired** (`D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ixion-scenes/abyss-a1-fixed.png` + `.json`,
  sha `1518ea4e877c…`; working files in `fix-a1/`): the ghostly spike on the horizon centre (where the whistle beat is
  staged), the hard black floating rock at the left, and the dark wedges in both bottom corners. Method: `prep.py`
  pre-fills the spike and the rock row by row from the fog beside them (a 21 px median reference, so no mote
  streaks) and pulls the wedges 55 % toward the neighbouring fog, blurred; three 1024x768 crops go through
  `tools/gen/inpaint.mjs --latent` (VAEEncode + SetLatentNoiseMask, animagine, denoise 0.5 / 0.45, 3 seeds each;
  picks spike 9501, left 9513, right 9522); `composite.py` pastes each pick back through its own feathered mask, so
  no pixel outside the masks changed (151,138 changed). Looked at 1:1: no spike, no rock, the corners are soft mist
  shadows. ComfyUI was idle for every submit; no black render; not restarted.
- **Installed add-only, not locked** (copied byte for byte; sidecars say `OPTION (provisional, awaiting Bailey's
  pick)`, `notApproved: true`, in no hash list): `backdrops/djose-chamber-provisional` = `chamber-c2.png` (sha
  `b5ea052fc689…`), `backdrops/farplane-abyss-provisional` = `abyss-a1-fixed.png`. Manifest regenerated with
  `tools/gen/manifest.mjs`: the diff is `generatedAt` plus these two keys; every other entry byte-identical.
- **One line each** in `src/data/ixion-plates.ts` (`DJOSE_CHAMBER_PLATE`, `DJOSE_ABYSS_PLATE`, each with a
  "Bailey's pick is pending" comment). Back to C1 / A1 is `'ffx2-djose-chamber-provisional'` /
  `'ffx2-abyss-provisional'`.
- **The stage, not the art** (`src/scenes/djose-chamber.ts`): each plate's row in `DJOSE_PLATE_FRAMES` now carries
  its own Ixion spot (`ixion`, default `DJOSE_IXION_SPOT` = the old [1.0, 0, -6.0], unchanged for C1 and the
  stand-in) and an optional sideways slide (`shiftX`, applied to the backdrop group). C2 is seen from above with
  its pit in the middle (38 % of the width), so at the standard spot Ixion stood on the rim or in the pit. C2's
  row: width 150, centre 2.3, slid 27 left, **Ixion at (4.2, 0, -6.0)**. Measured headless against a gridded
  copy of C2 with the pit marked (served in place of the plate by a Playwright route; scratch
  `.ixion-c2-probe-tmp.mjs`): his hooves land on the lit floor right of the pit at about u 0.73-0.80, v 0.60 at
  1600x900, 2000x1012 and 390x844, clear of the rim by about 150 px at 1600; the painting still covers every rig
  (idle, intro, reveal, enemy, action, party, victory) at 2000x1012 and 1600x900 (width 100 and 130 left a dark
  strip on the right in the enemy and intro rigs). New test in `ixion-listed.test.ts`.
- **Disclosed:** (1) no framing puts both the fixed party slots and Ixion on open floor: the pit's width and the
  party's spread overlap, so the party stands on the pit's near rim (it reads as the rim ledge, `scenes/1600x900-02`).
  (2) Ixion now stands right of centre: at 1600x900 the advisor's intent card overlaps his head while it is up
  (E hides it) and the command list overlaps his hindquarters and tail; at 2000x1012 only the tail. (3) The
  magnification is higher than C1's (150 against 130): the room's walls show only at the top right. (4) The
  cutscene screen still draws every plate at `center 35%`.
- **Verified:** tsc and `typecheck:e2e` clean; Ixion suites (`ixion-listed`, `ixion-engine`, `ixion-bench`,
  `trema-options`, `cutscene-backdrop-step`) pass; full suite once: 602 files passed, 1 failed (the known Bahamut
  heal-only timeout, 17.9 s; alone 19/19 pass); orphans 24 (unchanged); `verify-approved` (ROOT = this worktree)
  271 ok, 0 mismatched, 0 missing. **e2e on a fresh production build** (`vite preview` on 7731, stopped by PID):
  **1600x900 keys PASS** (victory, 38 decisions, 2 Recharges / 2 Hammers, banner seen) and **390x844 taps PASS**
  (victory, 47 decisions, 2 / 2, banner seen); `listed/` frames refreshed. Frames of the fight and the Abyss beat:
  `docs/screenshots/chapter-ixion/scenes/{1600x900,390x844}-0{1..4}-*.jpg` (`01` battle with HUD, `02` the stage
  alone, `03` Shuyin's "Lenne." on the repaired A1, `04` the first whistle). Scratch `.ixion-scenes-frames-tmp.mjs`.

### The scene options landed (main e2052a2a, ~21:00 EDT): C1 and A1 installed provisionally

The scene round (`docs/concepts/chapters/ixion-djose-2026-09-27/scenes/README.md`, merged from main) recommends
**Chamber C1 "Storm-lit stone"** with **Abyss A1 "White void"** (`[estimate]`, the round's own judgement; its README
records the author's review of every render, not a separate judge pass). Installed **add-only, not locked, not
approved**, copied byte for byte from `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ixion-scenes/`:

- `backdrops/ffx2-djose-chamber-provisional.png` = `chamber-c1.png` (sha `007992924372…`)
- `backdrops/ffx2-abyss-provisional.png` = `abyss-a1.png` (sha `77cf1cde508f…`)

Each sidecar is the candidate's own plus `status: "OPTION (provisional, awaiting Bailey's pick)"`. The manifest
regenerated with only these two backdrops added (subjects byte-identical). `src/data/ixion-plates.ts` now points at
them (one line each); the stand-ins stay on disk and are one line back. C1's floor is a quarter of the picture, so
the Chamber scene frames it on its own row (`DJOSE_PLATE_FRAMES`: width 130, centre 22.4, measured headless at
1600x900 and 390x844). **Disclosed:** at the standard spot Ixion stands mostly over C1's hole, so the hole reads
only around his hooves during the fight (the README's own "weak spot"); the hero-plate stand-in still uses the
Chamber stand-in behind Ixion. C2 / A2 would be one more add-only file and one line each.

**Verified on the options commit (~21:20-22:10 EDT):** tsc and typecheck:e2e clean; full suite (second run) 602
passed, 1 failed (the same Bahamut heal-only timeout); orphans 24; verify-approved 271 / 0 / 0; e2e on a fresh
production build: **1600x900 keys PASS** (victory, 38 decisions, 2 Recharges / 2 Hammers, banner seen) and **390x844
taps PASS** (victory, 47 decisions, 2 / 2, banner seen), the Abyss on A1 and the fight on C1; frames refreshed in
`docs/screenshots/chapter-ixion/listed/`. Disclosed: the cutscene screen draws every plate at `center 35%`, so during
the fall lines C1 shows its hall and lightning, not the hole.

### Verified (2026-09-27 ~20:00-21:15 EDT, on the listing commit)

- `npx tsc --noEmit` clean; `npm run typecheck:e2e` clean. Full unit suite once: **602 files passed, 1 failed**:
  `strategy-ffx2-bahamut`'s heal-only route timed out (15 s) under full-suite load, the known pre-existing timeout
  (same on main, noted by both earlier passes). `ffx2-atb-golden` and every chapter suite passed inside it.
- New tests: `chapters/ixion-listed.test.ts` (11), `chapters/ixion-recharge-banner.test.ts` (3, real engine to
  Recharge), `cutscene-backdrop-step.test.ts` (5), `save-ixion-listed-fixture.test.ts` (4, the live release-25 save).
- `node tools/orphans.mjs`: 24 orphaned (main: 24). `verify-approved` (ROOT = this worktree): 271 ok (223 approved +
  48 judge-locked), 0 mismatched, 0 missing.
- **e2e `tests/e2e/ffx2-ixion.spec.ts`**, production build (`npm run build` in this worktree, `vite preview` on 7701,
  stopped by PID), headless GPU Chromium: **1600x900 by real keys: PASS** (victory; 49 decisions; 3 Recharges, 3
  Hammers, the "Ixion · Recharge" banner seen; results, fall, Abyss, 4 whistles, wake; board "1 of 15", the XVI card
  wears VICTORY); **390x844 by real taps: PASS** (victory; 47 decisions; 2 Recharges, 2 Hammers, banner seen; the
  same post flow). 0 uncaught page errors. Frames `docs/screenshots/chapter-ixion/listed/{1600x900,390x844}-*.jpg`.
- The fight is played by following the in-battle guide's NEXT (the chapter tactic); on the phone, where the guide
  sits folded behind its chip and may be stale, the spec falls back to the same line read off the party's HP.

## What was built before the listing (unlisted pass, kept for history)

| Part | Where | Notes |
|---|---|---|
| Ixion's record | `src/data/ffx2/enemies/ixion-djose.ts` | §3.1 verbatim with tags: Lv 28, HP 12,380, MP 9,999, 62 / 21 / 106 / 82, Agi 138, Eva 35, Luck 4; absorbs Lightning, weak Water, immune Gravity; Slow and Breaks land; fractional-immune; EXP 2,600, AP 15, Gil 1,800, Pilfer 3,000; drop Soul of Thamasa, steal Sprint Shoes (rate 128). Id `x2-ixion`. |
| His five actions | `src/data/ffx2/enemies/ixion-djose-abilities.ts` | Attack DC 16; Thundara DC 12 on all, Lightning, 12 MP; Aerospark 5/8 of current HP (10/16), not reducible; Recharge flat +200 HP +200 MP (`fixed` + `noVariance` + `restoresMp`); Thor's Hammer DC 30 on all. **IX-2 [conflict]** (element): non-elemental, our estimate (Q1 a), one constant away (`IXION_THORS_HAMMER_ELEMENT`). |
| AI | `src/battle/ffx2/ai/ixion.ts` | §4.2: steps 1-2 Attack or Thundara, step 3 Aerospark; AC +5 / +10 Aerospark / +5 when aimed at (Chapter XI's `attackedHooks`, FA8 a; FA8 b one flag away); at 100 Recharge, then AC 0 and Thor's Hammer as his next action. **F-8 [conflict]** 3/4 : 1/4, our estimate; the wiki's 2/3 : 1/3 behind `state.flags.ixionThundaraSplit = 'wiki'`. **IX-12 (unsourced)**: the cycle restarts at step 1 after the Hammer, our estimate; Recharge and the Hammer add nothing to AC. Emits `script-trigger` `ixion-recharge`. |
| The formation | `djoseIxionGroup` (`ffx2-djose-ixion`) | one link, no escape, `boss-ffx2-aeon` cue; **`DJOSE_ACTION_TIME_ON = true`, 3 s** (Bailey, D-269; the bench). |
| The party | `src/data/ffx2/builds/djose.ts` | Yuna White Mage 32, Rikku Dark Knight 33, Paine Dark Knight 34 (levels **our estimate**, IX-14, band 30-36). Owned: the Chapter 2 list plus **Samurai** (certain); Berserker, Lady Luck, Trainer left out and labelled (each "if done"); no Mascot. Chapter 2's grids and accessories carried, a chapter of AP, a bag with Mega-Potions (estimates). Unwavering Guard is the reward, so not worn. |
| Rewards | `src/data/ffx2/items/held.ts` | `soul-of-thamasa`, `sprint-shoes` as held rows (effects: wiki, single source; prices unsourced, listed). Unwavering Guard is a grid, not an `EnemyRewards` field (Chapter XI precedent). |
| Chapter record | `src/data/chapter-ffx2-ixion-djose.ts` | id `ffx2-ixion-djose`, number 17, **in `UNLISTED_CHAPTERS`**: reachable only by `getChapter` and `window.__pyrefly.gotoChapter('ffx2-ixion-djose')`. Listing it is the switch. |
| Placeholder scene | `src/scenes/index.ts` | key `djose-temple`, the demo diorama, titled "Djose Temple (PLACEHOLDER: the demo diorama)"; pyrefly canon row "unattested" (§6.1 names no particles). |
| Art: look B | `spriteKey: 'x2-ixion'` (`IXION_SPRITE`) | `public/art/characters/x2-ixion/`: **idle** = `opt-b.png` byte for byte (the picture Bailey picked); **attack**, **cast** and **overdrive** derived by the same no-GPU method (`possess_b.py`) from the shipped FFX attack and overdrive paintings; **cast** adds the Recharge glow (`look/scripts/recharge_glow.py`: the horn lit, a paler inner rim, a violet halo and a tip glow capped at alpha 0.33, 0 opaque-mask pixels changed). All face screen-left; idle `scale` 1.0892 restores the FFX pixels-per-unit after the 70 px pad. Installer `look/scripts/install.py` (asserts every destination absent). Locked as `bailey:2026-09-27-ixion`; backups `D:/Tools/pyrefly-art-backup/approved/2026-09-27-ixion/`. Manifest: only `subjects/x2-ixion` added. The FFX `ixion/` paintings are untouched. |
| Story stub | `src/story/scripts/ffx2-ixion-djose.ts` | `results()`, then concept A's order in "(Placeholder)" stage directions in our own words: the fall, the Abyss (Songstress, Shuyin calls her Lenne, Vegnagun, the embrace, Baralai, Nooj and Gippal, two spheres, alone), **four one-option "(Whistle)" choices** (flag `ixionWhistles` 1-4), wakes in the Bevelle Underground. No quoted game text (IX-13), no staged figures, no music. |

## IX-11: the multi-target rule (checked, not changed)

The research derives from two observations that Ixion's all-party Thundara and Thor's Hammer are **not** halved.
The FFX-2 engine already halves only the **party's** Black / White Magic cast on all (`execute.ts`, step 15), so
enemy all-party moves are unhalved. `ixion-engine.test.ts` pins the research's derived bands: Thundara 150-169 and
Thor's Hammer 935-1,057 against MDef 35. Nothing to fix.

## The bench (200 seeds; `docs/plans/ixion-bench.md`)

- **Switch off (as first built): sensible 2/200 (1.0 %) at human pace, 5/200 at bench speed; naive 0/200.** Ixion
  acts about twice per Dark Knight action (28 vs 14 a fight); fights end in under a minute.
- **Switch ON, 3 s, as built since Bailey's pick (D-269): sensible 191/200 (95.5 %) human, 197/200 bench; naive
  48/200 (24.0 %) human, 90/200 bench.** Re-run 2026-09-27 ~15:25 EDT with the formation's own field: identical to
  the first run's engine-option numbers, so the switch is wired as measured. Thor's Hammer comes in every fight, 2.0
  a fight (sensible, human); 30 of ~404 Hammers left a girl down on the sensible line, 180 of ~322 on the naive one.
- Open readings barely move it (F-8 wiki 95.0 %, FA8 b 97.0 %); the level band does (Lv 30: 84.5 %, Lv 36: 99.5 %).

## Verified

**2026-09-27 ~15:20-15:55 EDT (look B + action time ON; main merged in at ce49c7d7):**

- `npx tsc --noEmit` clean. `ixion-engine.test.ts` + `learn-atlas-data.test.ts` 24/24; `ixion-bench.test.ts` 8/8
  (the table above); `trema-options.test.ts` + `ffx2-atb-golden.test.ts` 23/23. Full suite once: 551 files passed,
  2 failed: `trema-options`' "only the Cloister and Road links carry action time" (the Djose link now carries it
  too: the test now lists it, then passed) and `strategy-ffx2-bahamut`'s heal-only route (26 s against the 15 s
  limit under load; the same timeout on main, noted in the first pass). `ffx2-atb-golden` passed. Orphans 29 (as
  before).
- Art: `verify-approved` (ROOT = this worktree) 271 ok, 0 mismatched, 0 missing (223 approved + 48 judge-locked).
  The regenerated manifest differs from the one before only by `generatedAt` and the new `subjects/x2-ixion`
  (`attack, cast, idle, overdrive`, facing left). Re-running `possess_b.py` on the FFX idle reproduces `opt-b.png`
  byte for byte.
- Browser (headless Playwright from node, `PYREFLY_BROWSER=gpu`, Vite on 7400, stopped by PID; scratch
  `.ixion-look-tmp.mjs`, `.ixion-phone-probe-tmp.mjs`, uncommitted), at 1600x900 and 390x844: `chapters()` does not
  list it; `gotoChapter('ffx2-ixion-djose')` reaches the battle with `spriteKey` `x2-ixion`, the battle flag
  `actionTimeSeconds` 3, and the page fetched `x2-ixion/idle`, `attack` and `cast` (png + json, all 200). Real keys
  acted (Pray, Attack). With his counter at 100, Recharge then Thor's Hammer came, and Ixion wore the **cast** pose
  (the Recharge glow). Real keys won (Ixion's HP set to 1 by the debug API, Rikku's Attack by Enter), `victory`,
  results 2,600 EXP / 15 AP / 1,800 gil / Soul of Thamasa. 0 page errors. Frames `docs/screenshots/chapter-ixion/`:
  `*-field-opening`, `*-field-look-b`, `*-recharge-banner`, `*-thors-hammer`, `*-win-blow`, `*-win-results` for
  `desktop-1600` and `phone-390`.

**First pass (2026-09-27, before the picks):** tsc clean; 19/19 and 8/8; full suite 551 passed, 2 timeouts under
load; browser on 7310 walked the fight and the whole post-battle stub with real keys (frames
`docs/screenshots/ixion/`, script `.ixion-browser-tmp.mjs`).

## Open after the listing (Bailey's picks and the next track)

1. **Bailey's picks owed (rule 9):** Chamber C1 or C2, Abyss A1 or A2 (installed provisionally: all of C1, C2, A1 and
   the repaired A1; **the build shows C2 + repaired A1**, one line each in `ixion-plates.ts`); the pause
   hero plate (a stand-in composite now); the pause tagline "Where the Fayth Stood" (ours, inferred); music by ear
   (the Djose field bed and an Abyss cue: existing cues stand in, THEMES row XVI).
2. **The hole and Ixion:** on C2 (shown) his spot is x 4.2 so his hooves are on floor; the intent card and command
   list overlap him at 1600x900 and the party stands on the pit's rim (see the C2 section). On C1 he still stands at
   the standard spot over most of its hole. A frame choice for the pick.
3. **Merge order with `chapter-sin`:** Ixion is XVI; Sin's records (16, and D-270's second chapter) must move to 17+.
   Both branches touch `encounters.ts` `ChapterId`, `chapters-unlisted.ts`, `learn/atlas/cites.ts`.
4. **Advisor v3** (its own branch) edits `src/engine/tactics/**`; this branch adds `ffx2-ixion-djose.ts` and three lines
   in `index.ts` / `lookup.ts`: a trivial merge. The e2e follows the guide's NEXT, so re-run it after v3 lands.
5. **The whistle is a simple beat**: four one-press `(Whistle)` prompts, the existing `whistle-answer` cue, a gold
   flash and a line; no bridge art, no new sound (rule 13). A richer moment is a future options round.
6. The earlier open items 3 (derived poses unseen), 4 (Q1 / Q2 / Q4) and 5 (Eater grids read by nothing) still stand;
   items 1 (the Recharge banner) and 2 (the phone field) are **done** (the banner; the phone dolly, PR-0201 A).

## Open (the unlisted pass, kept for history)

1. **No "Recharge" banner exists in the FFX-2 HUD (finding, 2026-09-27).** A DOM watch through the whole Recharge
   and Hammer beat, at both viewports, found the word "Recharge" only in the house intent slab ("IXION ACTS NEXT
   Recharge", `eint__*`): the FFX-2 battle banner (`[data-role="battle-message"]`) shows only `message` events and
   stays hidden, and the FFX message bar (`.mbar`) is not mounted in FFX-2. The first pass's "the HUD showed both"
   was that slab. So concept A's tell (the game's own "Recharge" line) is not built; with the slab hidden (E) the
   player gets no warning at all. Building it is HUD / presenter work (both games' plumbing), not done here.
2. **The phone field during command turns** (390x844): the camera centres the party and Ixion leaves the frame on
   the placeholder scene (he is in frame at the opening, `phone-390-field-opening.png`; the Road's Shiva stays at the
   edge). The Djose Chamber plate and its slots should settle it; check again when the plate lands.
3. **The derived poses are not seen by Bailey.** Only the idle is the picture Bailey picked; `attack` (Attack),
   `cast` (Recharge, Thundara, Aerospark and Thor's Hammer all wear it: every non-physical row) and `overdrive`
   (Thor's Hammer; not read by the enemy presenter today, which loads idle / attack / cast / hurt / ko) are the same
   method on the FFX attack and overdrive paintings, locked with the idle as the brief asked. A separate Hammer
   pose on screen needs a per-move pose in the presenter. No hurt or KO pose: both fall back to the idle.
4. **Q1 / IX-2** (Hammer's element), **Q2 / F-8** (split), **Q4 / FA8** (what counts as a hit): built on the
   research's leans, each one constant or flag away.
5. **Finding, not fixed:** a Garment Grid's `elementEater` (Lightning / Fire / Water / Ice Eater) is read by nothing
   in the FFX-2 engine, so Thunder Spawn does not absorb Thundara. No shipped build wears an Eater grid; party prep
   may let a player pick one. Combat-core work with its own review.
6. **The intent slab** previews Recharge and Thor's Hammer one action early (and is, per item 1, the only tell on
   screen); whether it stays on for this chapter is Bailey's. **Still to build before listing:** the Djose Chamber
   plate, the Abyss plate and the fall poses (placeholders, labelled), the written Abyss dialogue (writing bible),
   the whistle as a real moment (sound, the light), music by ear, a card, a guide and a tactic.
7. **Merge note:** `src/data/encounters.ts` (`ChapterId`, `number`), `src/data/chapters-unlisted.ts`,
   `learn/atlas/cites.ts` and `tests/unit/learn-atlas-data.test.ts` are touched at the same lines by
   `chapter-sin`; keep both (`| 16 | 17`, both ids, both rows). `docs/target/approved-hashes.json` gains the set
   `bailey:2026-09-27-ixion` at its end; if main has appended sets since, keep every set.

## CHECK (independent, 2026-09-27 ~16:00-16:25 EDT; checked c562a5b2, not built by the checker)

**Verdict: PASS, 0 blockers.** FFX-2 only (the check touches nothing; this section is the only change).

- **Data vs `research/ffx2-ixion-djose.md` (rule 6), asserted by an engine-side probe:** Lv 28; HP 12,380, MP
  9,999; 62 / 21 / 106 / 82; 138 / 35 / 4 / 0; absorb Lightning, weak Water, immune Gravity; immunities exactly
  §3.1's list (ko, petrify, sleep, silence, darkness, poison, confuse, berserk, curse, eject, stop, doom, delay,
  interrupt) with no Slow or Break immunity; fractional-immune; EXP / AP / Gil / Pilfer 2,600 / 15 / 1,800 / 3,000;
  drop Soul of Thamasa; steal Sprint Shoes both slots, rate 128; no Bribe. Actions: Attack DC 16 physical (rolls);
  Thundara DC 12, 12 MP, Lightning, all, `canMiss: false`; Aerospark 10/16 of current HP, single; Recharge flat 200
  HP / 200 MP to self; Thor's Hammer DC 30 magic, all, `canMiss: false`, non-elemental (IX-2, labelled estimate).
  Every value matches its tag; `baseChance: 50` and the held-item prices are labelled estimates / unsourced.
- **Counter and tell, run through the engine (rule 3):** 30 seeds at human pace (Wait split), the counter
  **re-derived from the event log independently of the AI's memory** (+5 Attack / Thundara, +10 Aerospark, +5 per
  party action with a damage / miss / status / MP-damage / dispel event on him, credited at that action's end):
  **0 mismatches** over ~960 Ixion actions: steps 1-2 are always Attack or Thundara, step 3 always Aerospark,
  Recharge exactly when the counter reaches 100 and never before, Thor's Hammer always the very next Ixion action
  (60 Recharges, 58 Hammers). Recharge emits `damage -200` on himself plus an MP restore (capped at 9,999).
  Split over 200 seeds: Thundara 24.3 % of free turns (3/4 : 1/4 build) and 32.6 % with the `wiki` flag (2/3 :
  1/3). First Recharge by his 12th turn at the latest (mean 10.2), consistent with §4.4 once hits count.
- **Switch and bench:** `DJOSE_ACTION_TIME_ON = true`, group field 3, battle flag `actionTimeSeconds` 3 in the
  browser. `ixion-bench.test.ts` re-run: every row of `docs/plans/ixion-bench.md` reproduces exactly (sensible
  191/200 human, 197/200 bench; naive 48/200, 90/200; OFF 2 / 5 / 0 / 0; F-8 wiki 190, FA8 b 194, Lv 30 169, Lv 36
  199; 30 KO'ing Hammers of ~404 sensible, 180 naive).
- **Art (look B):** the four `x2-ixion` PNGs equal their backups byte for byte (`installed/`, `record.json`); idle
  = `candidates/2026-09-27-ixion/opt-b.png` (sha `d24f15df…`). `verify-approved` (ROOT = this worktree): 271 ok,
  0 mismatched, 0 missing. The FFX `ixion/` PNGs keep their 2026-09-18 mtimes; `approved-hashes.json` diff is
  additions only. Note: this worktree's `public/art` is a junction to the main tree's, so the four files already
  sit in `D:/Final Fantasy/public/art/characters/x2-ixion/` (additive, gitignored).
- **Unlisted:** `chapters()` omits `ffx2-ixion-djose` (engine and browser); `getChapter` finds it (number 17).
- **Unchanged elsewhere:** `ffx2-atb-golden` untouched and passing; the only other test edits are the
  trema-options Djose row and the two unsourced-price ids (both additive). Orphans 29 (main 29).
- **tsc** clean. **Full suite once:** 552 files passed, 1 failed: `strategy-ffx2-bahamut` heal-only route timed out
  (17 s vs 15 s) under the full run; alone it passes in 9.3 s here and 9.9 s on main: load, not this branch.
- **Browser** (headless Playwright from node, `PYREFLY_BROWSER=gpu`, Vite 7420 stopped by PID, 1600x900,
  seed 11): reached via `gotoChapter`, `spriteKey` `x2-ixion`; served idle / cast / attack PNGs hash-equal to the
  locked files; a real Enter chain acted (Yuna Pray); counter set to 100 → Thundara (already chosen), Recharge,
  Thor's Hammer, with Ixion in the cast (Recharge-glow) pose; 0 page errors. Frames in the checker's scratch only.

**Findings (none blocks; for Bailey / the next track):**
1. *Major, disclosed by the builder (Open 1):* concept A's tell, the game's "Recharge" line, has no banner in the
   FFX-2 HUD; only the house intent slab names it. Needed before listing.
2. *Minor:* `ixion-bench.test.ts` prints the table but pins none of its numbers (only "no unfinished" and
   sensible > naive), so a drift in the measured win rates would pass silently.
3. *Minor:* the Soul of Thamasa description "Spells 150 % stronger" can read as x2.5; the source says "strengthens
   spells by 150 %" (x1.5 reading). Text only; no effect is wired.
4. *Minor, pre-existing:* the Bahamut heal-only strategy test sits near its 15 s limit and times out under full-suite
   load on this branch and on main.

## CHECK: release readiness (independent, 2026-09-27 ~20:50-21:55 EDT; checked cafdf758, not built by the checker)

**Verdict: READY, 0 blockers.** Game case as the builder wrote it: the chapter is FFX-2 only; the listing, the board
counts and `backdrop()` are shared plumbing (both). This section is the only change the check makes.

**Static and suite (worktree `D:/pyrefly-ch-ixion`, up to date with `origin/chapter-ixion`):**
- `npx tsc --noEmit` clean; `npm run typecheck:e2e` clean.
- Full unit suite, run once: 602 files passed, 1 failed. The failure is `strategy-ffx2-bahamut`'s heal-only route (19.7 s
  against its 15 s limit under load). Run alone together with `ffx2-atb-golden`, `save-ixion-listed-fixture`,
  `ixion-listed` and `ixion-recharge-banner`: 5 files, 43 of 43 pass. This is the known load timeout that main has too.
- `node tools/orphans.mjs`: 24 orphans, the same as main (24).
- `verify-approved` with `ROOT` set to this worktree: approved 223 ok and judge-locked 48 ok (271 in all), 0 mismatched,
  0 missing.
- `git merge-tree` against today's `origin/main` (47ab4ae8) is clean, and `origin/main` is an ancestor of the branch,
  so the merge is a fast-forward.
- `node tools/critic-plan.mjs --json`:
  - Measured against the previous build 79adc4ff, which includes main's own changes: **deep**.
  - The branch diff alone (`--paths`, 121 files): also **deep**. `deepBeforeDeploy: false`, so this is **not the
    save-data class** (`SaveData.ts` is untouched). `focusedBeforeDeploy: true`, `deepAfterDeploy: true`,
    `games: both`, obligations live / focused / deep.
  - `carriedDeep: ["79adc4ff"]`: release 25's deep review is still owed, and the release rule counts it.

**Production builds (mine):**
- Branch: `vite build` in this worktree gives `dist/`, bundle `index-Dh5sXkv3.js`. That `dist/` belongs to this
  worktree only.
- Main 47ab4ae8: `vite build --outDir` into the checker's scratch, from the main tree with no tracked changes. Bundle
  `index-C_9V59w1.js`. The shared `dist/` was not touched.
- Served with `vite preview` on 7710 and 7711. Headless GPU Chromium from node. Every server was stopped by its PID.

**Save compatibility (this is the save-data class, so each step was checked):**
- I used one persistent browser profile on one origin (127.0.0.1:7710). Main's build served first, then the branch's,
  then main's again.
- **Main writes the save.** The save came from main's own flow: `gotoChapter` without `auto`, the fight handed to
  `autoBattle`, and the results and defeat panels answered by Enter. That flow recorded real clears of Seymour Flux,
  Bahamut, Leblanc and the Fallen Aeons, with their best times, turns, play time and attempts. Main's own SaveStore
  added Natus and Isaaru clears. Several losses added attempts. Settings were changed on purpose: master 0.37,
  music 0.21, sfx 0.66, text speed 1.5, guide off, intent off, reduce motion on, battle help off. Coach marks were
  set. Main's board read **6 of 14 beaten** (15 tiles).
- **The branch loads it.** The raw localStorage the branch saw at document start matched main's byte for byte. Three
  things were each compared field for field against main's save:
  1. the branch's stored save after booting and opening the board;
  2. the branch's save as held in memory;
  3. the branch's stored save after an Ixion clear.

  Every chapter record, every setting, `seenCoach`, `flags`, `unlocked` and `version` is **identical** in all three.
  Ixion has no record until it is played, and after the clear it is the only record added. The board read
  **6 of 15** (16 tiles) with the same six cleared. After the Ixion clear it read **7 of 15** with XVI cleared.
  Nothing was reset and no other key was written.
- **Rollback.** Main's build then booted on the branch's save. Every record, Ixion's included, and every setting
  survived. Main's board read 6 of 14, with XVI invisible. A rollback of the deploy loses nothing.
- `save-upgrade.spec.ts` (CHK-024, the release-20 fixture) was run on the branch build as a scratch copy: 2 of 2 pass.
  That covers the board ribbons and best times, the FFX-2 pause OPTIONS values, and a truncated save booting fresh.

**Ixion by real input (branch build, 7711; the builder's spec, run from a scratch copy that writes frames to scratch):**
- **1600x900, real keys: PASS.** Victory in 38 decisions, 2 Recharges, 2 Thor's Hammers. The "Ixion · RECHARGE"
  banner showed as the Recharge started, before the Hammer.
- **390x844, taps: PASS.** Victory in 47 decisions, 2 Recharges, 2 Hammers, banner seen.
- Both runs then went on through results, the fall (C1), the Abyss (A1, Shuyin's "Lenne."), the four "(Whistle)"
  prompts, the wake over `bevelle-underground`, and the board at "1 of 15" with XVI cleared. No page errors.

**Loss, RETRY and skips (my own spec, 1600x900, real keys):**
- Holding Enter skipped the opening.
- A losing line by keys lost after 20 decisions: Dark Knights Attack, Yuna takes the first White Magic row.
- On the defeat panel, Enter on RETRY went to party prep, and Enter there started the fight again.
- The new fight opened on seed 1003, Ixion at 12,380 of 12,380, every girl at full HP. Attempts went from 1 to 2.
- For the skip test only, Ixion's HP was set to 1 through the debug API, and a real Attack won. Enter cleared the
  results. During the fall's line, Esc then E to OPTIONS, then down to **Skip Scene**, then Enter: the fall, the
  Abyss, the whistles and the wake were all skipped. The board showed XVI cleared.

**Other chapters are unchanged (main build compared with branch build):**
- **FFX Chapter I (Seymour Flux) and FFX-2 Chapter IV (Bahamut)**, from the title by real keys: the card, prep, the
  opening skipped by holding Enter, and the first menu. The first menu's rows, the party HP and the first actions were
  **identical** on both builds.
- One scripted battle each at seed 42 (`auto: 'intended'`). Outcome, turns, event count and the SHA-256 of the full
  event log were **identical**: Flux victory, 104 turns, 678 events, `ce97adb7…`; Bahamut victory, 80 turns, 2,218
  events, `d2d06f70…`.
- **The hidden FF7 fight** ran from a scratch copy of `ff7-guard-scorpion.spec.ts` on the branch build: 5 of 5 pass.
  That covers LIMIT by keys, the seven taps, the pad code, RETRY, the phone layout, and the board plus save key left
  as they were (16 tiles).

**Findings (none blocks):**
1. *Minor (process):* the change is **deep**. Its focused review goes before the deploy and its deep review after it.
   Release 25's deep review (79adc4ff) is still owed, and the release rule allows at most two deploys while a deep
   review is owed. `approvedArtCheck` is false even though `approved-hashes.json` changed (by additions only).
2. *Minor (release):* all of this art is local only and gitignored:
   - `x2-ixion` (4 poses);
   - the provisional C1 and A1 plates;
   - the two stand-in plates;
   - the pause stand-in.

   The files are in `D:/Final Fantasy/public/art`, and this worktree's `public/art` is a junction to it. Every file is
   in this build's `dist/` (checked). The release must be built from a tree whose `public/art` is that folder.
   `D:/pyrefly-release` is not a git worktree at the moment.
3. *Minor (stale comments):*
   - `src/battle/ffx2/action-time.ts` still calls it "Chapter XVII".
   - `src/data/ffx2/items/held.ts` still says "(Djose, unlisted)".
   - `src/scenes/index.ts` and `src/data/chapter-ffx2-ixion-djose.ts` still describe the "stand-in plate", although
     the key now points at the provisional C1.
   - In `src/story/dsl.ts`, `backdrop()` was inserted between `setPose`'s doc comment and `setPose` itself. `setPose`
     lost its doc comment and `backdrop()` carries two. `dsl.ts` is now 587 lines (570 on main, so it was already
     over the 400-line house rule).
4. *Info:* in every chapter, RETRY goes back through party prep (shared flow, `BattleScreenFlow`), so it takes two
   presses to get back to the fight. This existed before the branch and is not Ixion's.
5. *Info:* the whistle flag `ixionWhistles` is a flag in the cutscene runner. It is not stored in `SaveData.flags`,
   which stayed `{}` after the skip, so the check could not read "4" in the browser. The unit test covers it, and
   nothing is persisted.
6. *Still Bailey's (rule 9, as disclosed):* the C1 or C2 and A1 or A2 picks, the pause hero plate, the tagline, and
   the music by ear. None of these block a listing labelled provisional.
