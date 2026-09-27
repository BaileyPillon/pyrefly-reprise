# Valefor from Yuna's Overdrive: reproduction, causes and fix plan (2026-09-27)

Investigation only. No product code was changed. **Game case: FFX only**: Grand Summon, aeons
and the summon staging exist only in the FFX chapters. FFX-2 has no summons, so nothing here
applies to chapters IV, V, VI, XI, XIII or XV.

## What Bailey saw

Bailey, 2026-09-27 ~11:00 EDT, verbatim: "also i tried my overdrive and i think valefor came out i
had yuna selected. the aeon looks nothing like valefor though and my whole party was still there."
Then: "i was playing the yojimbo encounter for reference". That is **Chapter IX** (Lady Ginnem and
Yojimbo, the Cavern of the Stolen Fayth), on the live site: release 23, main `ff3884fb`, bundle
`BfW8CHQs`.

He reported three things. Each has its own cause, and all three reproduce:

| # | Symptom | Cause, in one line | Regression? |
|---|---|---|---|
| S1 | "valefor came out" (he never got to pick an aeon) | The engine sends the aeon picker a list of id strings, and the picker reads `.name` from objects. It throws on its first render, the presenter falls back to a bare re-submit, and the engine's default roll takes the first aeon in the roster, which is Valefor. | Not new code. The picker has never worked in a real battle, because the mismatch goes back to the 2026-09-16 WIP checkpoint. What changed is the outcome: before `12277daa` (2026-09-25) the same crash spent the gauge and summoned nothing. Since release `b975397b` (2026-09-26), it summons Valefor. |
| S2 | "looks nothing like valefor" | The installed Valefor painting is **teal and green**, and the research says she has **red feathers**. The stage also draws her at party height (`enemyHeight x 0.7`, which is 1.785 world units in IX against the party's 1.75) and behind three party figures. | No. The painting was installed on 2026-09-18 and has not changed since. The scale rule dates from the WIP checkpoint. |
| S3 | "my whole party was still there" | The engine takes the party off the field, but the presenter's `summon` beat adds the aeon and never touches the three party actors. The HUD also keeps the party rows. | No. The summon beat is unchanged since `6e78c10b` (the WIP checkpoint), and release 21 (`d8837334`) has identical code. |

## (1) Where Yuna is fielded with an Overdrive

The source is `src/data/ffx/abilities/overdrive-yuna.ts`: Yuna's only Overdrive is **Grand Summon**
(`research/ffx-combat-core.md` §5.4, row 280, rank 5, `[verified: 2 sources]`). It "summons any owned
aeon **with a full Overdrive gauge**", and the aeon's stored gauge is restored afterwards. In FFX the
player **chooses** the aeon (`src/battle/ffx/aeon-duel.ts:186-190` says so: "FFX lets the player
pick").

I read the data below and confirmed it by running the engine (the scratch vitest probe
`tools/zz-valefor-probe.tmp.test.ts`, with each chapter's real build, seed 1, and Yuna's gauge set
to 100). "Default roll" is the aeon the engine picks when the picker gives no answer. That is S1's
path.

| Ch | Chapter id | Yuna | Gauge at start | Aeon roster (art key = roster key) | Default roll |
|---|---|---|---|---|---|
| I | seymour-flux | active | 40 | valefor, ifrit, ixion, shiva, bahamut | valefor |
| II | yunalesca | active | 45 | valefor, ifrit, ixion, shiva, bahamut | valefor |
| III | braskas-final-aeon | active | 50 | valefor, ifrit, ixion, shiva, bahamut | valefor |
| VII | seymour-anima-macalania | active | 37 | valefor, ifrit, ixion, shiva | valefor |
| VIII | evrae-airship | **absent** (by design, `research/ffx-evrae-airship.md`) | none | none | none |
| **IX** | **yojimbo-cavern** | active (slot 3, after Lulu and Kimahri) | 40 | valefor, ifrit, ixion, shiva, bahamut | **valefor** |
| X | seymour-natus | active | 37 | valefor, ifrit, ixion, shiva, bahamut | valefor |
| XII | seymour-omnis | active | 50 | valefor, ifrit, ixion, shiva, bahamut | valefor |
| XIV | isaaru-via-purifico (unlisted) | alone | 100 | valefor, ifrit, ixion, shiva, bahamut (minus a locked mirror) | first unlocked, living aeon |

Art keys: the summon beat stages the aeon with `artId = aeonId` (`BattlePresenterBeats.ts:185`).
`artIdFor` returns `spriteKey || id` (`BattlePresenterArt.ts:62-80`), and every roster entry has
`spriteKey === id`. So Valefor is drawn from `public/art/characters/valefor/{idle,attack,overdrive}.png`.
No other file is involved, and there is no stand-in and no mix-up with another aeon.

In every chapter the engine puts the chosen aeon alone on the field. `state.aeonId` is set, an
enemy's Attack can target only `['valefor']` (`validTargets`), and the next player turn is the
aeon's. The engine is correct. The faults are in the UI and the presentation.

## (2) Reproduction with real keys (production build of main, the live bundle)

- Build: `npx vite build --outDir .valefor-dist-tmp` from main (source identical to `ff3884fb`; the
  bundle is **`index-BfW8CHQs.js`**, the same hash as the live site). Served with
  `vite preview --port 6800`, headless Chromium (GPU), 1600x900.
- Setup, debug API only: `setSeed(1)`, `gotoChapter('yojimbo-cavern', {skipCutscenes:true})`. At
  the first command menu I set Yuna's gauge to 100 on the engine's live state (setup only, so that
  her next menu is built with a full gauge).
- Real keys from there: the other members take Attack (Enter, Enter). On Yuna's menu, ArrowDown to
  **Overdrive ▸ READY**, then Enter. Script: `tools/zz-valefor-repro.tmp.mjs` (agent scratch, not
  committed; `SEED=` and `NOFILL=1` env switches). The engine probe is
  `tools/zz-valefor-probe.tmp.test.ts`, run with `npx vitest run --config
  .valefor-probe-vitest-tmp.config.mjs --reporter=verbose --silent=false`. It must register the
  FFX content first, as `BattleScreenContent.ts` does, or no Overdrive rows exist.
- Result in Chapter IX, seed 1: the page console logs
  `[presenter] minigame overlay failed; re-submitting bare TypeError: Cannot read properties of undefined (reading 'replace')`.
  The event log reads `minigame-request {aeons:["valefor","ifrit","ixion","shiva","bahamut"]}`,
  then `action-start grand-summon`, then `summon valefor`. No aeon list is ever shown. After the
  summon, Lulu, Kimahri and Yuna are still staged at alpha 1, and Valefor's box is 304x226 px
  (Yuna's is 178x231). The status panel still lists Lulu, Kimahri and Yuna, and the next command
  menu is Valefor's (Attack / Overdrive ▸ READY / Aeon ▸ x3 / Dismiss).

The same key sequence in the other chapters, on the same build. Each row is measured on the
aeon's first command menu. "Crash" means the page logged the overlay failure. Heights are
on-screen box heights in px at 1600x900.

| Ch | Seed | Crash, then default roll | Aeon out | Party alpha while Valefor is out | Status rows | Valefor height / Yuna height |
|---|---|---|---|---|---|---|
| I | 2 (on seed 1 Yuna is KO'd before her first turn, and seed 3 is a party wipe) | yes | valefor | Tidus 1, Yuna 1, Kimahri 1 | Tidus, Yuna, Kimahri | 505 / 310 = 1.63 |
| II | 1 | yes | valefor | Tidus 1, Yuna 1, Auron 1 | Tidus, Yuna, Auron | 492 / 314 = 1.57 |
| III | 1 | yes | valefor | Tidus 1, Yuna 1, Auron 1 | Tidus, Yuna, Auron | 528 / 328 = 1.61 |
| VII | 1 | yes | valefor | Tidus 1, Yuna 1, Rikku 1 | Tidus, Yuna, Rikku | 435 / 274 = 1.59 |
| **IX** | 1 | yes | valefor | Lulu 1, Kimahri 1, Yuna 1 | Lulu, Kimahri, Yuna | **226 / 231 = 0.98** |
| X | 1 | yes | valefor | Tidus 1, Yuna 1, Kimahri 1 | Tidus, Yuna, Kimahri | **216 / 221 = 0.98** |
| XII | 1 | yes | valefor | Tidus 1, Yuna 1, Auron 1 | Tidus, Yuna, Auron | 451 / 325 = 1.39 |
| XIV (unlisted) | 1 (her gauge starts full, so no fill) | yes | valefor | Yuna 1 | Yuna | 448 / 285 = 1.57 |

All eight chapters behave the same way. The aeon picker never opens, Valefor always comes out,
and the party stays on screen. **IX and X are the worst for S2**: their scenes set a small
`enemyHeight` (IX uses Yojimbo's 2.55), so the `x 0.7` aeon rule gives Valefor party height.
Chapter IX is where Bailey played.

Frames (JPEG, `docs/screenshots/valefor-bug/`):

- `ch09-1-yuna-menu.jpg`: Yuna's menu with **Overdrive ▸ READY**.
- `ch09-2-overdrive-row.jpg`: the cursor on the Overdrive row.
- `ch09-3-no-picker.jpg`: after Enter, only the "Grand Summon" action banner. The aeon picker
  threw and never appeared.
- `ch09-4a-summon-moment.jpg` and `ch09-4b-aeon-on-field.jpg`: Valefor fades in behind Lulu,
  Kimahri and Yuna.
- `ch09-5-next-player-turn.jpg`: Valefor's menu. The party is still standing in front of her and
  the party rows are still in the panel.
- `valefor-on-screen-vs-painting-vs-research.jpg`: the on-screen crop, the installed `idle.png`,
  and the research palette side by side.
- `ch01-seed2-next-player-turn.jpg`, `ch02-…`, `ch03-…`, `ch07-…`, `ch10-…`, `ch12-…`,
  `ch14-next-player-turn.jpg`: the aeon's first menu in every other chapter.

## (3) Which painting is drawn, and is it Valefor?

- **The file drawn** is `public/art/characters/valefor/idle.png` (1057x830, seed 1903670487,
  animagine-xl-4.0, generated 2026-09-18, sha256 `7fec77b2…2bfa`), with `attack.png` and
  `overdrive.png` from the same set. The live site serves the same bytes (995,335 bytes on both).
- **Is it approved?** No. It is not in `docs/target/approved-hashes.json`, and `targets.json` has no
  Valefor tile. It ships under **D-089** ("Kimahri, Wakka, Lulu, Rikku, Valefor, Ifrit, Ixion and
  Bahamut ship as Chapters I, VII and VIII already use them; not held for a separate verdict"). So
  it is a candidate painting that Bailey has never judged, and this is his first reaction to it.
  `docs/screenshots/art/valefor.png` is the art-round-3 contact sheet of this same set, not a
  separate approved picture.
- **Against the research:** `research/visual-bible.md` §1.13 quotes the wiki: "a large, avian
  creature notable for her dragon-like wings… attacks with her strong talons. Some of her body is
  covered in **red feathers** and she has a long lizard-like tail" `[single source]`. Its palette
  is feathers `#8E2A22 / #C94A38 / #E8836A`, underwing `#E0B06A`, beak and talons `#E8DCC0`, eyes
  `#F2D24A` `[estimate]`. The installed set is teal and blue-green, with a cream underbelly and a
  gold-tan underwing. Its generation prompt asks for `(teal blue green plumage:1.3)` and its
  negative bans `red feathers, orange feathers, crimson, phoenix` (`idle.json`).
- **Why it is teal:** `docs/handoff/art3-aeons.md` §7.2 overrode the research after the **AI art
  judge** rejected a red render ("reads as a red/orange phoenix... canon Valefor is teal/blue-green").
  No source was cited for teal. That is a memory claim by a model, and hard rule 6 does not allow it
  to override a quoted source. The handoff also asked for the bible to be changed to teal, which
  never happened. **The sources in the repo therefore disagree with the painting, and the
  painting's side has no source.** I could not read the FF Wiki page from here: WebFetch gets HTTP
  402 on fandom.com, and the browser pane is off-limits for this task. So the question of
  **which colour is canon stays open**. The deciding check is the Steam copy (Bailey's rule: real
  facts come from the Steam HD Remaster, with his permission to take over the screen) or the wiki
  read through the browser pane by an agent allowed to use it. Bailey's own reaction is evidence
  too: he knows the game, and to him it "looks nothing like valefor".
- **Scale and placement (the second half of "looks nothing like"):** an aeon is sized
  `defaults.enemy * 0.7` (`BattlePresenterArt.ts:269`). In IX, `enemyHeight` is Yojimbo's 2.55, so
  Valefor gets 1.785 world units, the height of the party (1.75). The visual bible's size table
  gives Valefor **110 px** against about 57-60 px for the party, roughly **1.8x party height**,
  "wingspan wider than height". She is also staged as `kind: 'party'` on party slot 1
  (`BattlePresenterStage.ts:229`, `:263-265`), between Kimahri and Yuna and behind both. On screen
  she reads as a small green bird half hidden by the party. The billboard is not cropped wrongly:
  the whole `idle.png` is drawn, mirrored to face the enemy. But the idle's right wingtip touches
  the canvas edge (cropBox `[159,0,1216,830]` against a 1216-wide source), so that wing ends flat.

## (4) Canon staging, and what the game does today

- **Canon:** `research/ffx-combat-core.md` §6.1 `[verified: 2 sources]`: "The summoned aeon
  **replaces the entire active party**; the party members are removed from the field and their CTB
  counters and all status durations freeze until the aeon leaves." Dismiss, or the aeon's KO,
  returns the party (§6.1, lines 1099 and 1103).
- **Engine (correct):** `src/battle/ffx/aeons.ts:58-91` `summonAeon` freezes the party's counters,
  sets `state.aeonId`, and `friendlies()` (`state.ts:328-334`) returns only the aeon. The probe
  shows an enemy's Attack can target only `['valefor']` in every chapter, and the next player turn
  is the aeon's. The party is **not targetable**. It is off the field in the engine and only still
  visible on screen.
- **Presenter (wrong):** `src/engine/BattlePresenterBeats.ts:181-192` `summon()` adds and fades in
  the aeon and never touches the party. `BattlePresenterStage.ts:185-189` `stage()` stages
  `activeIds` **plus** the aeon, so a re-stage keeps the party on screen. The `dismiss` case
  (`BattlePresenterEvents.ts:284-289`) fades out only the aeon.
- **HUD (wrong):** `src/ui/ffx/FFXBattleHud.ts:923-928` says in so many words "the party stays
  staged beside it". The status rows keep the three party members, and the aeon gets no row.

## (5) What the iter2-b5 branch already fixes (read only, not edited)

Branch `iter2-b5`, worktree `D:/pyrefly-iter2-b5`, **not merged and not deployed** (paused with
wave 2 of iteration 2 under the current usage mode). Commit **`ddc1649d`** "Take the party off the
field while an FFX aeon is out and swap the HUD rows to the aeon's (PR-0181; FFX only)":

- New `src/engine/SummonStaging.ts`. `partyOffStage` fades the party to 0 in step with the aeon's
  620 ms arrival and holds them there against the target x-ray. `partyBack` brings them back on
  dismiss (command, KO or Banish). `stage()` keeps them hidden on a re-stage while an aeon is out.
  `fieldRows.ts` shows the aeon's row alone. Test: `tests/unit/summon-staging.test.ts`. Method
  check: `docs/plans/pr-0181-method-check.md` (restored canon, class A).
- **So S3 is fixed on that branch**, for Summon and Grand Summon alike, because both emit the same
  `summon` event. Its check used the **Summon** command in Chapter X (party alpha 0, Valefor 1.0
  unoccluded, row 'Valefor'). It never went through the Overdrive, so it did not meet S1.
- **Not in B5:** S1 (the picker crash). The aeon's **scale**: the method check says "the aeon's
  scale should come from its sidecar or height rule", but `ddc1649d` does not touch
  `worldHeightFor`, so Valefor stays at party height in IX and at `0.7 x enemyHeight` elsewhere.
  The painting's colour (S2).

## Fix plan, by owner

### A. The aeon picker (S1). Owner: iter2-b5 or a small FFX fix batch. FFX only. Class: bug fix.

1. `src/battle/ffx/overdrive.ts:345-346` `minigameParams('yuna-grand-summon')`: send the objects
   the overlay reads. For each id in `grandSummonChoices(ctx)`, send
   `{ id, name: aeon.name, storedGauge: aeon.overdrive?.gauge ?? 0 }`. The overlay is already
   written for this shape (`YunaGrandSummon.ts:7-12`), and it is the shape the HUD demo uses
   (`FFXHudDemoScreen.ts:129`), which is why the demo never showed the fault. The `x2` chip for an
   aeon already at 100 then works as well. The alternative is to have the overlay accept bare ids
   and look the names up, but the engine is the only place that knows the names and gauges, so fix
   the engine. Check `docs/CONTRACTS.md` before editing: if minigame params are listed there, the
   change is additive and gets a `CONTRACT-CHANGES.md` entry.
2. Make the overlay refuse a bad entry instead of throwing (`escapeHtml(String(a.name ?? a.id ?? a))`).
   A picker should never fail silently into an automatic choice.
3. `src/engine/BattlePresenterUtil.ts:167-177` `askMinigame`: a **thrown** overlay (as opposed to a
   cancel) currently re-submits bare, so the engine picks for the player without saying so. Keep
   the loop-breaking behaviour, but log it as an error the e2e and critic can catch
   (`console.error`, or a `presenter` counter), so that a broken overlay cannot hide behind a
   silent default again.
4. Tests: a unit test for the `minigameParams` shape, and a DOM test that opens
   `openYunaGrandSummon` with the engine's real params, picks the 3rd row, and resolves `ixion`.
   Plus an e2e real-keys check in IX: Overdrive, ArrowDown x2, Enter, and `summon` names **ixion**.
   This is CHK-020 shared plumbing for the FFX Overdrives. **A likely sibling that needs its
   own real-keys check:** Rikku's Mix overlay reads `params.ingredients` and `params.recipes`
   (`src/ui/ffx/minigames/RikkuMix.ts:23-24`), but the engine sends `inventory` and no recipes
   (`overdrive.ts`, the `rikku-mix` case). As far as I could find, no adapter sits between them.
   If so, the Mix list opens empty. **Not reproduced here, so unverified.** Kimahri's Rage overlay
   normalises its entries (`KimahriRage.ts:48-50`) and should be fine.

### B. Summon staging (S3). Owner: iter2-b5 PR-0181 (already built). FFX only.

1. Merge `ddc1649d` as is. Add to B5's acceptance a real-keys **Grand Summon** in Chapter IX, after
   fix A, on top of the Summon check in X.
2. Aeon scale: the method check's own unfinished item. Replace `defaults.enemy * 0.7`
   (`BattlePresenterArt.ts:269`) with a height taken from the painting's own rule. The visual
   bible's sizes (Valefor 110, Ifrit 120, Ixion 100, and so on, against the party's 57-70) are
   `[estimate]`, so present the sizes to Bailey as a **before/after frame** (IX Valefor at 1.0x
   and at about 1.8x party height). Because this changes how the aeon looks, it needs his yes
   (hard rule 9). Do not choose a number by eye.
3. Slot: with the party hidden, slot 1 is fine. Keep it.

### C. The painting (S2). Owner: art session. Needs Bailey's pick. FFX only.

1. **Settle the colour from a source first** (hard rule 6). Read the FF Wiki *Valefor (Final
   Fantasy X)* text and revision id through the browser pane (see memory:
   fandom-wiki-needs-browser), or check the Steam copy with Bailey's leave. Record the answer in
   `research/visual-bible.md` §1.13, and if teal turns out to be wrong, correct
   `docs/handoff/art3-aeons.md` §7.2 and `tools/gen/cast.json` (`blue feathers`).
2. **Bailey's pick:** show 2 to 3 Valefor idles at 1:1 on the IX field at the corrected scale.
   Candidates: (a) today's teal set, (b) a set in the sourced palette, (c) a blend if the source
   calls for one. Build nothing further until he picks. Then save the pick as a board tile and add
   its hashes to `approved-hashes.json`. Re-render `attack` and `overdrive` from the picked idle as
   `--ref`, and fix the idle's right wingtip, which touches the edge.
3. The other aeons (Ifrit, Ixion, Bahamut) ship under the same D-089 with no verdict of their own.
   Bailey may react to them the same way once he sees them full size. Offer them in the same round
   only if he asks. Shiva is the only approved aeon.

### Order

A first: a small fix that gives Bailey the choice he thought he was making. Then B (merge B5, then
the scale frames for his yes). Then C (source, options, pick). A and B.1 are fixes to canon or
bugs and need no pick. B.2 and C need Bailey.

## Regression check

- Release 21 (`d8837334`, worktree `D:/pyrefly-rel21b`; no `dist/` on disk, so compared by
  source): `overdrive.ts:346` sends the same id strings, the same `summon()` beat, and it contains
  `12277daa`. **Identical behaviour.** Not a regression in release 22 or 23.
- Releases up to `1a680e41` (2026-09-25): the same picker crash, but the default roll was `''`, so
  the Overdrive spent Yuna's gauge and summoned **nothing**. `12277daa` ("Grand Summon's default
  roll calls a real aeon", from the Chapter XIV review, which rolled headlessly) made the silent
  fallback produce Valefor. It fixed the headless path and, by accident, hid the UI crash behind a
  plausible-looking result.
