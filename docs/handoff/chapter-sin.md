# Sin as two chapters, LISTED (2026-09-29, D-279): XVII "the Fins and the Core", XVIII "the Face"

**Game case: FFX only** (AGENTS.md rule 14): CTB, the airship range, aeons, and a boss whose turn
clock ends in a scripted Game Over. None of it exists in FFX-2 (`research/ffx-sin.md` §0.3).

**Since 2026-09-29 (D-270, package S):** Sin is two chapters, split where the game saves.

- **Chapter XVII, `sin-fins-core`**, "Sin: the Fins and the Core" (working title): links I to III
  (`sin-left-fin` → `sin-right-fin` → `sin-genais-core`) on one party state, `src/data/chapter-sin-fins-core.ts`.
- **Chapter XVIII, `sin-face`**, "Sin: the Face" (working title): link IV, Overdrive Sin, as built
  below. It is the branch-only `sin` renamed and renumbered (`git mv` to `src/data/chapter-sin-face.ts`).

Everything below the "Package S" section is the link-4 record of 2026-09-27; read `sin` there as
`sin-face`, and "Chapter XVI" as Chapter XVIII.

## Art installed and proved on a production build (2026-09-29 ~07:45 to 08:50 EDT; FFX only)

**What decided it:** D-279 (the driver picks Sin's paintings under Bailey's delegation). Every file is **the
driver's pick, not Bailey's approval**, locked as `driver:2026-09-29-sin (D-279, delegated by Bailey)`; Bailey can
swap any of them. **Game case: FFX only** (rule 14): nothing installed is read by an FFX-2 chapter.

**Installed** after the release-29 gate file (07:42 EDT), by `docs/concepts/chapters/sin-2026-09-29/install/INSTALL.md`
exactly: 62 files (32 images, 30 sidecars) into `D:/Final Fantasy/public/art/` (gitignored, never in git) and the
backup `D:/Tools/pyrefly-art-backup/approved/2026-09-29-sin/`; manifest regenerated; `check.mjs` 32/32; 32 hashes
locked in `docs/target/approved-hashes.json`; `verify-approved` 0 mismatched / 0 missing against this worktree and
against main. `chapter-meta.test.ts` now passes (the 2 by-design failures of package L were the missing pause plates).

**Proved on a production build** (`vite build` to `D:/Tools/pyrefly-scratch/overnight-0929/sin-list/dist`, `vite
preview` on 8620, headless Chromium, `PYREFLY_BROWSER=gpu`; server stopped by PID afterwards):

- `tests/e2e/ffx-sin.spec.ts` (scratch config `.sinI-pw-tmp.config.ts`): **4/4**, 5.5 min. Keys at 1600x900 and taps
  at 390x844: the board's XVII and XVIII cards with their plates, prep, the scene, the Trigger Command by real input,
  a loss and RETRY back to the Left Fin, CHAPTER SELECT; XVIII won on the clock (seed 3), results, Breaking Through,
  "1 of 17". Frames `01`..`13` in `docs/screenshots/sin/listed/` re-shot on the production build.
- The tour `tools/zz-sinI-tour.tmp.mjs` (agent scratch): **real keys from the title** at 1600x900 and 390x844
  (Enter to the board, ArrowRight to the card, Enter to prep and start, Enter held through the scene), then the debug
  API's line watched at fast speed and slowed for each painted state. XVII seed 8 `intended`: the Left Fin at FAR,
  NEAR and NEAR charged; the Right Fin at FAR, NEAR and NEAR charged; Genais out, in its shell with the Core
  charging, and the Core alone charging and at rest; the run ends in the engine's no-progress `escape` (known: the
  `intended` line wins no seed of XVII). XVIII seed 1 `defend`: the head at FAR and NEAR with the mouth at stages 0,
  1, 2, 3 and 4 as the clock runs 13 to 1, the countdown ring and "our estimate" line, Giga-Graviton's loss, and
  RETRY by Enter back to a whole Sin at 13 turns. Frames `<w>x<h>-20-*` (XVII) and `-30-*` (XVIII).
- **Every Sin file answered 200** (all five subjects' states and sidecars, `sin-fahrenheit-flight` and
  `sin-fahrenheit-bevelle`, both pause plates, the five chips); **no HTTP status >= 400, 0 console errors, 0 page
  errors** in all four tours.

**Seen in the frames (an agent's look; not fixed here, for the next pass):**

- **Link III has no plate of its own**: Genais and the Core float over the flight plate's cloud sea behind the deck
  rail (plan Q6's per-link seam is not built; `sin-back.png` is installed but nothing reads it yet). Both sprites
  read very dark against the sunset (Genais out of its shell is almost a silhouette; the Core at rest likewise).
- **Phone (390x844), XVIII**: the countdown panel sits across the middle of the stage and covers the party.
- XVIII's first frame after Sin's first turn still shows "13 turns left" while the flag already says 12 (the ring
  catches up on the next update).
- At the Left Fin's NEAR charge the plate shows only "NEAR" while the Right Fin's shows "Core charged · Gravija on
  its next turn"; it may be a frame of timing, not checked.
- The spec's `01-title` frames are taken during the title's fade-in (dark); timing of the spec, not the build.
- `docs/concepts/.../INSTALL.md` "Faults left" still hold (the Fins at FAR larger than Evrae's streak, the head's claw
  gripping air over `bk-a-8`, Genais's rock crumbs).

## Package L, the listing (2026-09-29 ~06:30 to 08:30 EDT; FFX only, the listing itself shared plumbing)

**What decided it:** D-279 (Bailey, 2026-09-28 ~22:45 EDT, "Your picks (Recommended)"): the driver picks Sin's
paintings, the countdown display and the music, and both chapters are listed by morning; D-280 (Giga-Graviton on
the 13th turn, our estimate). Every pick below is **the driver's, not Bailey's**, recorded as such (rule 9; D-279's
delivery, `docs/target/targets.json` tiles "Sin: ..., Chapter XVII/XVIII" with `reaction.inferred`). Plan §6, the
Ixion listing `925ec32a` as the template. Branch `chapter-sin` only: not merged into main, not pushed, not deployed.

**Listed.** `SIN_FINS_CORE` and `SIN_FACE` moved from `UNLISTED_CHAPTERS` into `CHAPTERS` (after XVI) and both
ids into `CHAPTER_IDS`; `SIN_CHAPTER_META` into `CHAPTER_META` (`UNLISTED_CHAPTER_META` is empty); both scripts in
the story registry (`ChapterKey`, `STORY_CHAPTERS`, the two fin seams in `CHAIN_SEAMS`, no AI-emitted names; 398
lines, nothing had to move out); the guides and tactic lookup were already wired (comments updated); two
`PLATE_COMPOSITIONS` entries (INSTALL.md item 7's numbers); the pause CHAPTER dossier and the jukebox read the meta
(the pause taglines had to be 2 to 4 words: "No Rest Between Links", "Before the Mouth Opens"; one snapshot caption
shortened). The board: 18 cards, "0 of 17" (Chapter VII is still locked COMING on this branch).
`docs/CONTRACT-CHANGES.md` has the entry.

**The picked art, wired by its keys** (`docs/concepts/chapters/sin-2026-09-29/install/INSTALL.md`):

| Pick | Where it is wired | Falls back to, until installed |
|---|---|---|
| Plate flight-1 (links I and II) | `sceneKey: 'sin-fahrenheit-flight'`: `src/scenes/evrae-airship-sin.ts`, Chapter VIII's deck over the plate, drawn level (roll 0: its horizon is painted level) | Evrae's deck painting at its own roll (`makeAirshipDeckScene`) |
| Plate bk-a-8 (link IV) | `sceneKey: 'sin-fahrenheit-bevelle'`, the deck rolls it as it rolls Evrae's | the same |
| Link III, Sin's back | **not wired**: link III stays on the flight plate, labelled (plan Q6: a per-link scene swap is a new seam, `EnemyGroupDef` has no scene key; not small, so not built). The `sin-back` painting is staged for it | - |
| Fin A, both arms | the range director binds each Fin to its own subject (`src/scenes/evrae-airship-subjects.ts`): NEAR and FAR at the spot and size its picked painting has (the sidecar's `frameFraction` and `baselineY` cast from the range's `idle` rig; derived, then looked at), upright (its wide FAR painting is never laid to rest as a prone body: `keepUpright`), `charge-near` / `charge-far` in the idle slot while `sin.fin.charged` holds | Evrae's spots and sizes and the stage's silhouette; no charge painting is asked for |
| Genais A, Core A | `src/app/screens/BattleScreenSinPoses.ts` on the airship hook's per-frame sync: Genais `shell` while `sin.genais.shelled`, the Core `charge` while `sin.core.state` is `charging` or `ready`, both upright | the silhouette (a state the manifest does not list is never loaded) |
| Head C repaired | the same follower: `stage-<n>` for `sin.mouthStage`, placed per range at its painted framing (`OVERDRIVE_SIN_PLACEMENT`) | the silhouette at the stage's spot |
| Turn-order icons | by enemy id (`portraits/<id>.png`), no code | the generic chip |
| Pause plates | `heroArt: 'pause/ch17-sin-fins-core'`, `'pause/ch18-sin-face'` | `heroArtFallback` (Tidus, Yuna portraits) |
| Cards | `PLATE_COMPOSITIONS['sin-fins-core' / 'sin-face']` (the Left Fin, the head over each plate) | the image removes itself |
| Countdown display | HUD package H's mouth ring (built on this branch before L), "13th turn: our estimate (12 or 13)" | - |
| Music | the stand-ins `scene-fahrenheit`, `boss-evrae`, `victory-ffx`, labelled (THEMES.md rows XVII and XVIII: owed) | - |

The "PLACEHOLDER — no painting" notes in `sin-fins.ts`, `sin-genais-core.ts` and `overdrive-sin.ts` now name the
picks. Evrae (Chapter VIII) is staged exactly as before (`evraeSubject`; `evrae-telegraph.test.ts` passes).

**The art is NOT installed.** `public/art/` was not touched (the release-29 gate file does not exist; brief). The 62
staged files are in `D:/Tools/pyrefly-scratch/overnight-0929/sin-install/stage/`; INSTALL.md "The exact install
steps" installs them. **Until then two tests stay red**: `chapter-meta.test.ts` "sin-fins-core / sin-face:
heroArt resolves to an installed public/art/pause plate in manifest.json" (the guard is right; the plates are not
there yet). Everything else falls back as the table says.

**Looked at in the browser, with the staged art served over `public/art`** (a scratch dev server on 8611,
`.sinL-vite-tmp.config.mjs`, uncommitted: it answers `/art/<path>` from the stage and merges the stage into the
manifest; nothing written anywhere): the Fins read at NEAR (the arm over the rail, its cut edge off frame right,
the lit core) and at FAR (Sin's whole body level in the sky, colossal as painted); the head reads at both ranges
with the mouth opening stage by stage; the flight plate and bk-a-8 stand behind the deck. Frames of the whole
listing in `docs/screenshots/sin/listed/` (`<w>x<h>-01` to `-13`, 1600x900 keys and 390x844 taps), all with the
staged art.

**Tests.**

- New: `tests/unit/chapters/sin-listed.test.ts` (14: the listing, the registry, the guide, the plates, the
  scenes and canon rows, the Fins' staging with and without the art, `keepUpright`, Genais/Core/head following the
  flags, placing the head per range, nothing loaded before the install, nothing touched in other battles);
  `tests/unit/save-sin-listed-fixture.test.ts` with `tests/fixtures/saves/release-28-main.json` (written by the
  **live release-28 build's own SaveStore**, main `6ea8528f`, bundle `index-DecUADzw.js`, in a fresh headless
  profile: loads unchanged, progress stays, both chapters unplayed, "N of 17"); `tests/e2e/ffx-sin.spec.ts` (4
  tests: XVII and XVIII at 1600x900 by keys and 390x844 by taps).
- Updated for eighteen cards / "N of 17" and the new order: `chapter-select-c`, `frontend-chapter-grid`,
  `frontend-chapter-select-screen`, `ff7-hidden-board`, `save-ixion-listed-fixture`, `chapter-meta` (numerals),
  `flow-post-scene` (both post scenes end on `results()`; both are story-earlier than the FFX finale),
  `cutscene-veil` (Breaking Through narrates 4 lines under the fade, pinned), `isaaru-duel`, `isaaru-ship`,
  `ixion-engine`, `trema-engine`, `trema-ship-content`, `trema-ship-story`, `yojimbo-engine`, `sin-data`,
  `sin-engine`; e2e `ffx2-ixion.spec.ts` and `ff7-guard-scorpion.spec.ts` (counts only).
- e2e, all against the 8611 dev server with the staged art (a scratch Playwright config
  `.sinL-pw-tmp.config.ts`, uncommitted, `PYREFLY_BROWSER=gpu`): `ffx-sin.spec.ts` **4/4 pass** (XVII: board,
  card, prep, the scene skipped by holding Enter or by the phone's menu > OPTIONS > SKIP SCENE, the fight opening at
  FAR with the Left Fin at 65,000, ORDERS > Close in by real input, a loss by the debug `defend` line, RETRY by real
  input back to the Left Fin at 65,000 and FAR with no Right Fin, then CHAPTER SELECT from the defeat panel, "0 of
  17"; XVIII: board, card, prep, the scene by confirm presses or taps, the fight to a **win on the clock** by the
  debug `intended` line on seed 3, results and Breaking Through by real input, the clear on the board, "1 of 17");
  `ff7-guard-scorpion.spec.ts` 5/5 pass with the new counts. `ffx2-ixion.spec.ts` was not re-run (its change is
  the two counts only).
- Seeds for XVIII's `intended` line (skip speed, 1 to 12): wins on 3, 7, 10 and 12. On XVII it wins no seed of 1
  to 8: 4 defeats and 4 engine stalemates (`escape`, 400 turns without progress), each with Genais down and the
  Core standing (seed 2: the Core at 26,384 HP on turn 466). That is the debug strategy, not the bench's sensible
  line (25.5 % chain); the merge probe above found the same. Recorded on D-282.

**Gates (2026-09-29, this package):** `npx tsc --noEmit` clean (only the untracked `tests/unit/zz-*` probes);
`npm run typecheck:e2e` clean; FFX golden hashes 408/408 identical to S's base (`56026029`, 6 seeds,
`FFX_HASH_SKIP=sin,sin-face,sin-fins-core`); `node tools/orphans.mjs` 24, the same as main, **no Sin module
orphaned**; the full suite once (`npx vitest run --testTimeout=60000`, the `zz-*` probes excluded): 632
files, 9,882 tests pass, 40 skipped, 11 failed. Nine were the listing turning generic suites onto Sin and are
fixed (re-run by file): the card's BOSS row names "Sin" for XVII (its meta `bossLine`), both post scenes end on
`results()`, the physical-row table gains Sin's six rows, the THEMES cue map gains rows XVII and XVIII (moved out
of "Owed cues for chapters not yet listed"), a bench-only speaker (two Wakka lines in the fin seams got fielded
fallbacks, Tidus and Auron), and **three reward items had no ItemDef row** (the Left Fin's HP Sphere, Genais's
Return Sphere, the Core's MP Sphere: added to `src/data/ffx/items/spheres.ts` with their sourced names,
research §2.4; their in-game help text is not in our sources and is not transcribed, see that file's header).
The other two are the pause-plate install guards above.

**Recorded:** `docs/target/decisions.json` D-275 to D-281 copied from main verbatim so the ids resolve here (they
merge as identical lines), D-279 `delivery: implemented` with the picks named, **D-282** (proposed) the difficulty
disclosure: XVII chain 25.5 % sensible / 3 % card first try, XVIII 31 % on turn 13 (3.5 % on the 12th), the link-3
checkpoint built OFF and Bailey's call. `docs/target/targets.json`: two tiles in "chapters" (state approved under
D-279's delegation, `delivery: implemented`, `reaction.named` empty, the picks under `inferred`).

**Open, for the driver and Bailey:**

1. **Install the art** (INSTALL.md steps 1 to 7) once the gate file exists; then the two `chapter-meta` pause-plate
   tests turn green and the picks show without the scratch server. Re-run `ffx-sin.spec.ts` against a real build.
2. **Merge main into `chapter-sin` before merging back**: this branch is 50 commits behind `origin/main`
   (Chapter VII unlocked there, D-278). After that merge the board counts in the tests above change again (Chapter
   VII becomes playable: 18 cards, "N of 18"), and `decisions.json` D-279 conflicts once (main's D-279 is
   `in-progress`; keep this branch's).
3. **Link III on Sin's back** (plan Q6): a per-link scene key is a new presentation seam; not built.
4. **Staging a human should look at** (the driver's picks, measured from the paintings, not tuned by eye): the
   Fins at FAR are Sin's whole body, colossal (as painted; INSTALL.md said the director may scale them down); at
   390x844 the FAR body is mostly off the top right; link III stands Genais and the Core side by side behind the
   rail, dark against the sun, the Core beside Genais rather than behind it; the head's claw grips the hull's top
   (INSTALL.md "Faults left"); on the XVIII pause CHAPTER tab at 1600x900 the dossier sits over the head's eye
   (`CHAPTER_SLIDE_FACES` has no row for `ch18-sin-face`: INSTALL.md's proposed crop boxes were not added, since
   the rule only applies a box a slide can clear and the boxes were read by eye). On the phone the "4TH IN QUEUE"
   banner and the Fin's range tag share the top band (the HUD package's, seen in `390x844-04`).
5. The pause **taglines** ("No Rest Between Links", "Before the Mouth Opens") and the **titles** are ours (Q13).
6. The **music** is stand-ins; the assault and countdown cues are owed and judged by ear (rule 13).

## Package S, the spine (2026-09-29; `docs/plans/sin-two-chapters-plan.md` §2.1, §2.2, REVIEW)

**What F, G, P and H can rely on.** Every name the packages share is in
`src/battle/ffx/ai/sin-ids.ts` (constants and the `SinCounter` type only):

- **Enemy ids:** `left-fin`, `right-fin`, `sinspawn-genais`, `sin-core`, and `cid` in both Fin formations.
- **Formation ids:** `sin-left-fin`, `sin-right-fin`, `sin-genais-core` (chained by `nextGroupId`).
- **Script ids:** `sin-left-fin`, `sin-right-fin`, `cid-fahrenheit-sin` (Cid, no missiles, S-19),
  `sinspawn-genais`, `sin-core`.
- **Row ids** (`src/data/ffx/enemies/sin-fins-abilities.ts`, `sin-genais-core-abilities.ts`): `sin-fin-ram`,
  `-smack`, `-gravija`, `-gravija-far`, `-negation`, `-negation-far`, `-gathers`, `sin-motionless`;
  `sin-genais-venom`, `-thrashing`, `-sigh`, `-waterga`, `-cura`, `-shell-in`, `-shell-out`,
  `sin-magic-absorbed`; `sin-core-inactive`, `-gathers`, `-gravija`, `-negation`, `-fire`, `-blizzard`,
  `-thunder`, `-water` (`SIN_CORE_ELEMENT_CYCLE` is the F, B, T, W order). Every row is `canMiss: false`
  and rank 3 (§3 `[decompiled]`). Counter rows carry `is-counter`; silenceable rows (Waterga, Cura, the
  Core's four) carry the Blk/Wht Magic category (the `flare-self` precedent), so an AI can ask
  `blockedBySilence`.
- **Flag keys** (`state.flags`): `sin.fin.hits`, `sin.fin.regularActs`, `sin.fin.charged`,
  `sin.fin.latched` (F); `sin.genais.shelled`, `sin.core.state` (`inactive | charging | ready | free`),
  `sin.core.counterStep`, `sin.core.down` (G); `sin.negation.lastTaken` (both:
  `Record<CombatantId, StatusId[]>`). None collides with link 4's `sin.turn` family.

**The stubs, with their final signatures** (each a no-op or `null` today, each file F's or G's to fill):

| File | Owner | Exports (signature) |
|---|---|---|
| `src/battle/ffx/ai/sin-fins-rules.ts` | F | `applySinFinsSetup(ctx: Ctx): void`; `markSinFinsRuntime(flags, actors): void`; `collectSinFinsCounters(ctx, attacker, def, damagedEnemyIds): SinCounter[]`; `SIN_FINS_ASSUMPTIONS` (holds S's `seam-lineup`); re-exports `sin-negation.ts` |
| `src/battle/ffx/ai/sin-fins.ts` | F | `leftFinAi`, `rightFinAi`, `cidSinAi` (`(ai: AiContext) => Command \| null`), registered under the three script ids |
| `src/battle/ffx/ai/sin-negation.ts` | F (G reads) | `NEGATION_REMOVES` (the 24 of §3.1, sourced, S's), `NEGATION_SPARES`, `NEGATION_MERCY`; `finNegationChance(ctx, finId): number` (stub, 0) |
| `src/battle/ffx/ai/sin-genais-core-rules.ts` | G | `applySinGenaisCoreSetup(ctx)`; `markSinGenaisCoreRuntime(flags, actors)`; `syncGenaisCoreLiveness(ctx)` (the must-change 2 hook); `collectSinGenaisCoreCounters(ctx, attacker, def, damagedEnemyIds): SinCounter[]`; `SIN_CORE_ASSUMPTIONS` |
| `src/battle/ffx/ai/sin-genais-core.ts` | G | `genaisAi`, `sinCoreAi`, registered |

**The aggregators and the swapped lines** (none of the four shared files grew, but `reactions.ts` by the
one line the review asked for):

- `setup.ts`: `applySinSetups(ctx)` (`sin-setup.ts`: link 4's setup first, unchanged, then the Fins,
  then Genais and the Core).
- `simulate.ts`: `markAirshipRuntime(flags, actors)` (`sin-setup.ts`: `markEvraeRuntime`, then
  `markSinRuntime` = the Fins' and Genais/Core marks). A preview gets every mark.
- `reactions.ts`: `collectSinCounters(ctx, attacker, def, damagedEnemyIds)` (`sin-counters.ts`: link 4's
  Gaze first, then the Fins', then link 3's), pushed with `targets: c.targets ?? []` (must-change 1:
  **G returns the caster in `targets` for Waterga**). And one added line at the top of
  `runMortibsorptionIfDown`: `runSinLivenessHooks(ctx)` → `syncGenaisCoreLiveness(ctx)`, which runs at the
  start of every `afterAction`, for every command kind and a Doom KO alike (must-change 2).
- `ai/index.ts`: `import './sin-scripts.ts'` (it imports `overdrive-sin.ts`, `sin-fins.ts`,
  `sin-genais-core.ts`).

**The status carry** (`src/app/screens/BattleScreenSetup.ts#carryFfx`): when the next link sets
`carriesPartyState` (only `sin-right-fin` and `sin-genais-core` do), each member's and aeon's live statuses
are copied into the build, less `ko` (re-derived from HP), `eject` and the Defend/Guard/Sentinel stances
(our estimate: §1.2 says only that statuses carry). Chapters III and XIV carry no statuses, as before
(`tests/unit/chapters/sin-carry.test.ts`).

**Chapter XVII's party** is `sinFinsCoreBuild` (`src/data/ffx/builds/sin-fahrenheit.ts`): D-264's preset
with **Tidus's and Rikku's orders to Cid** (`pull-back`, `close-in`) back, because the Fins' range fight is
Evrae's (§4 `[verified: 4 sources]`) and `highbridge.ts` strips them for every later chapter. The markers
ride the chain into link 3, where no Cid stands, so the rows grey out there ("Not your call", Evrae's
reason): **F or P decides how that row reads in link 3** (§3.5: no Trigger Command in links 3 and 4).

**What is still F's (the stubs do nothing yet):** Cid is not a non-combatant in the Fin fights until F's
setup publishes `airship.range` (then `markEvraeRuntime` marks him), so **a Fin link cannot be won
before F lands**; the carry test drives the seam directly. The same for G: the Core's reach, magic
absorption and "victory when the Core dies" are G's.

**The golden-hash base (must-change 10), for F, G and P:**

- Base tree: `D:/Tools/pyrefly-scratch/overnight-0929/sin-S/base` (`git archive 56026029` of `src`,
  `tests/unit/tools`, `tests/unit/helpers` and the configs). Its `node_modules` is a **junction** to
  `D:/Final Fantasy/node_modules`: unlink it with `cmd /c rmdir` before anyone deletes the folder.
- Base hashes: `D:/Tools/pyrefly-scratch/overnight-0929/sin-S/base.json` (6 seeds, 408 runs, written with
  `FFX_HASH_SKIP=sin,sin-face,sin-fins-core`). Also `base-link4.json` (skip `sin-face,sin-fins-core`, so it
  holds link 4 under its old id `sin`).
- To diff: from `D:/pyrefly-ch-sin`, `FFX_HASH_OUT=<your file> FFX_HASH_SEEDS=6
  FFX_HASH_SKIP=sin,sin-face,sin-fins-core npx vitest run tests/unit/tools/ffx-chapter-hashes.test.ts`,
  then compare with `base.json` key for key.
- **Package S's result:** 408/408 identical; link 4 (`sin` → `sin-face`) 24/24 identical; the link-4
  bench prints the same tables (62/200 on the 13th turn, 7/200 on the 12th).

**D-270's re-equip is a deviation, not a default** (must-change 9): Chapter XVIII does not open with a
re-equip. The Right Fin's Stoneproof drop is not built (which part drops is `[unsourced]`, §2.4;
equipment drops are not modelled, S-7) and the FFX prep screen cannot change equipment (Q10). Recorded in
`docs/target/decisions.json` on D-270 (`deviation`, this branch's copy) for Bailey.

**New open questions** (they belong on the plan's Q list; recorded here):

- **Q16, the seam line-up** (must-change 6): links 2 and 3 reopen with the build's front row (Tidus,
  Yuna, Auron), whoever ended the previous link in front. Our estimate, in `SIN_FINS_ASSUMPTIONS`
  (`seam-lineup`); bench B measures both readings.
- **Q17, link 3's reveal plate:** `sin-genais-core` has no `headline`, so the plate names its first
  enemy, Sinspawn Genais. The Core's in-game name is "Sin" (`m138`), kept as the record's name. P or L
  decides the plate.

**Tests:** `tests/unit/chapters/sin-data.test.ts` (28: the records, the chain, the table, every row, the
24-status list and the permanent-status rule on the real engine, the ids, the stubs registered) and
`sin-carry.test.ts` (4). `sin-engine.test.ts` and `sin-bench.test.ts` renamed to `sin-face`.

- **The shared engine seams** are FFX plumbing, and each one is inert outside this battle:
  - the scripted Game Over flag;
  - the Cid guard on airship orders;
  - the counted-foe mark.
- **Checked unchanged:** the FFX chapters' event logs and menus are byte-identical before and
  after (see "Verified" below).

**Where it lives:** branch `chapter-sin`, worktree `D:/pyrefly-ch-sin` (sparse, no
`docs/screenshots` except `sin/`).

## Packages F, G, P and H, merged into `chapter-sin` (2026-09-29 ~01:20 EDT; FFX only)

Merged in the plan's order with `git merge --no-ff`, no conflicts (the four own disjoint files):
F `b5f393c2` → `8d6edae3`, G `6ba35582` → `b29419f8`, P `cd0a6c0b` → `401d6126`, H `d8958e15` →
`b9abbd96`. Nothing is listed yet (plan §6, package L).

**F, the Fins and Cid** (`src/battle/ffx/ai/sin-fins.ts`, `sin-fins-rules.ts`, `sin-negation.ts`;
`tests/unit/chapters/sin-fins-engine.test.ts`, 19 tests):

- **Left Fin** (research §5.1.4, step for step). At NEAR it attacks 33, 67 or 100 % of the time after 0,
  1 or 2+ hits (Ram, strong Delay); at FAR only from 7 hits (Smack); otherwise "Sin remains motionless.".
  At NEAR it takes three regular turns, then "Core gathers energy." (`sin.fin.charged`), then Gravija (75 %
  of current HP, floored, so it cannot kill). A charge that resolves at FAR is the no-damage row: the dodge.
- **Right Fin** (§5.2): attacks from 4 hits at NEAR, 5 at FAR. Below 16,250 HP it latches for good: always
  at NEAR, from 3 at FAR.
- **The hit counter:** each party action naming the Fin counts 1, an aeon's 2 (S-27, labelled); NEAR and
  FAR share it; it resets when the Fin attacks.
- **Negation** (S-12): the wiki's single-source formula behind named `NEGATION_*` tunables, a bench
  switch (`sin.negation.off`), and `sin.negation.lastTaken` as a JSON string (flags hold scalars).
- **Cid** (S-19) flies a queued order with Evrae's telegraph line and fires no missiles; the Fins open FAR
  (S-8). `SIN_FINS_ASSUMPTIONS` names S-8, S-12, the Negation slots, S-19, S-20, S-25, S-27, the latch,
  aeon reach at FAR (REVIEW 13), C-7 and S's `seam-lineup`.

**G, Genais and the Core** (`sin-genais-core.ts`, `sin-genais-core-rules.ts`;
`tests/unit/chapters/sin-core-engine.test.ts`, 21 tests):

- **Genais:** Venom, Venom, Thrashing; on its turn at 10,000 HP or less it shells (Armored,
  percentage-immune) and uses Sigh; it leaves on its turn at 12,000 or more (S-2: the wiki and the in-game
  Scan text).
- **Waterga** answers magic aimed at Genais and lands on the caster, aeons included (REVIEW 1). **Cura**
  answers each action that damages shelled Genais, once per action (labelled).
- **The Core:** inactive while Genais is out, gathers and casts Gravija while it is shelled, a free cycle
  once Genais dies. While Genais lives it is out of melee reach and magic-immune ("Magic absorbed.").
  Counters when targeted: Negation on the S-12 chance, else Fire, Blizzard, Thunder, Water in turn. The
  pre-death counter chance and "an absorbed spell draws a counter" are their own labelled tunables
  (REVIEW 8), in `SIN_CORE_ASSUMPTIONS`.
- **The liveness hook** (REVIEW 2) recomputes the Core's marks, `sin.core.down` and Genais's
  non-combatant mark from `isAlive` on every action: the Core falling wins with Genais standing, and Doom or
  Zombie plus Cura free the Core.

**P, the story and ship layer:**

- **Story:** `src/story/scripts/sin-fins-core.ts` (§9.2 beats 1 to 8, with mid beats for the Fin's charge,
  Tidus's and Rikku's order asks with Cid's "wait", both chain seams, and Genais) and `sin-face.ts` (beats 9
  to 11). Every line original; the "ball" line is our paraphrase; "Brother" has a name plate only. XVIII has
  one callout, on the first "Drawn to Sin."; a stage-3 callout would need a trigger from
  `overdrive-sin.ts` (named in the file header, not built).
- **Meta, guides, tactics:** `src/data/chapter-meta-sin.ts` in `UNLISTED_CHAPTER_META` (REVIEW 12, so no new
  orphan; `chapter-meta.ts` stays at 399 lines, its numeral union gains XVII and XVIII);
  `src/data/guides/sin-fins-core.ts` and `sin-face.ts` in `GUIDES`; `src/engine/tactics/sin-common.ts`,
  `sin-fins-core.ts`, `sin-face.ts`, `sin-tactics.ts`, registered by one line in `tactics/index.ts`, with
  `CHAPTER_GAME` rows in `lookup.ts`. R9 lives in the tactic: pull back when charged unless Cid's forecast
  turn comes after the Fin's.
- **Ship layer:** the range director in `BattleScreenAirship.ts` binds Evrae or a Fin only, never Overdrive
  Sin (REVIEW 3; Chapter VIII and link-4 staging pinned in `sin-ship-layer.test.ts`). The order widget
  (`AirshipOrders.ts`, `AirshipOrderWidget.ts`) shows no pip strip without a missile flag (REVIEW 4; Evrae
  unchanged). `phaseCanon.ts`'s `evrae-far` grade is labelled a placeholder for Sin's FAR.
- **THEMES.md:** the two owed cues (assault, countdown), outside the audited map until listing.

**H, the HUD** (package M's recommended frames, the driver's picks under D-279, not Bailey's words):

- **The link 4 clock (M1-A, the mouth ring):** `sin.turn`, `sin.turnsLeft`, `sin.gigaGravitonTurn`,
  `sin.mouthStage`; 3 pull segments, the melee window, 1 last; the numeral red at 1 or 0; the stage chip,
  the S-1 estimate line and the Gaze pill.
- **The Fins' plate (M4-B):** `airship.range` and `sin.fin.charged`; NEAR and charged gives the red bar,
  FAR the quiet line, NEAR uncharged neither.
- `src/ui/ffx/sinHudModel.ts` (pure), `SinHud.ts`, `sin-hud.css`, wired in `BattleScreenWiring.createHud`
  on the FFX HUD only; the node is not appended outside Sin's flags. `SIN_HUD_SELECTORS` join the advisor's
  and the chapter panel's avoid lists. Measured deviations from the frames (desk clock at x 500; phone
  Gaze pill at 352, Fin plate at 100) are in the H commit.

**The one integration fix** (`tests/unit/chapters/sin-tactic.test.ts`): P's "once Genais is gone the Core
is Broken first" killed Genais by hand against G's stub and reused the rows offered before. With G merged
the Core is out of reach until the liveness hook runs after an action, so the test now kills Genais with a
real Attack (HP set to 1) and reads Auron's next rows. No source changed.

**Gates after the merges (2026-09-29):**

- `npx tsc --noEmit`: clean (only the untracked `tests/unit/zz-scratch/` probes error).
- Every `tests/unit/chapters/sin-*.test.ts`, `evrae-engine.test.ts`, `guide-link-title`, `strategy-guide`,
  `tactics-lookup`: 14 files, 260 pass, 1 skipped (the `PYREFLY_SIN_MEASURE` measurement).
- **FFX golden hashes** against S's base (`56026029`, 6 seeds, `FFX_HASH_SKIP=sin,sin-face,sin-fins-core`):
  408/408 identical. Every other FFX chapter is unchanged.
- `node tools/orphans.mjs`: 24, none of them a Sin module (no growth).
- Full suite once (`npx vitest run --testTimeout=60000`): 628 files pass, 5 skipped; 9,791 tests pass,
  38 skipped, 1 todo. No failure.
- **An engine probe of the whole XVII chain** (the intended line, `setupForChapter` then
  `setupForNextLink`, seeds 1 to 8; untracked `tests/unit/zz-scratch/zz-merge-sin-probe.test.ts`): links 1
  and 2 won on 8/8 and 7/8 seeds (about 120 to 160 and 60 to 125 inputs); the Fins' plate showed the
  charged state 32 to 96 times per link and nothing in link 3; the clock never showed in XVII. **Link 3 was
  won on no seed:** 3 defeats and 4 stalemates (`escape`, the engine's no-progress watch) with Genais dead
  and the Core at 16,000 to 26,000 HP. Seed 2, read turn by turn: once Genais falls every swing at the
  Core draws its elemental counter on the whole front row (about 400 to 600 each), the revives stop
  (Phoenix Downs spent, by the look of the rows), Tidus and Auron stay down, and Yuna casts Pray alone
  until the watch ends it. No summon shows in the part of the log read. That is bench B's to measure and explain (REVIEW 13), with the Core's after-death counter
  chance (S-13, Gestahl: every time) as the first suspect; nothing was tuned.

**Bailey, 2026-09-27 ~13:40 EDT: "all your recommendations"**, answering the driver's list "Sin A
through B, the Garden of Pain party, and Ixion A". For Sin:

- **End state:** concept A.
- **Route:** through B. That means:
  - a painting pilot of the head;
  - link 4 benched at human speed;
  - link 4 shipped unlisted behind a switch;
  - then links 1 to 3 in front, reusing Evrae's range command.
- **Party:** `garden-of-pain.ts` with Yuna's Tetra Ring back (S-29, our estimate).
- **S-1:** Giga-Graviton on Sin's 13th turn by default. S-1 stays open until the Steam check,
  which only Bailey can schedule.

## What is built

| Piece | File | Source |
|---|---|---|
| Overdrive Sin's rows: Drawn to Sin, Gaze (three statuses, plus the aeon version), Giga-Graviton | `src/data/ffx/enemies/overdrive-sin-abilities.ts` | research §3.4, every row tagged; all `canMiss: false` (§3 "Always hits") |
| Overdrive Sin: stats, elements, statuses, rewards; formation `overdrive-sin` | `src/data/ffx/enemies/overdrive-sin.ts` | §2.1 to §2.4. S-6 Threaten is immune (the Evrae C-4 shape) |
| The clock and the scripted Game Over | `src/battle/ffx/ai/overdrive-sin.ts` | §5.4 pseudocode, step for step |
| Rules: constants, flags, setup, Gaze counter, the estimates as data | `src/battle/ffx/ai/overdrive-sin-rules.ts` | §5.4, §10 (S-1, S-16, S-28) |
| The party | `src/data/ffx/builds/sin-fahrenheit.ts` | §7.3 option B (S-29, our estimate) |
| The chapter, unlisted, number 16 | `src/data/chapter-sin.ts` → `UNLISTED_CHAPTERS` | the concept sheet's slot XVI |
| Scripted Game Over (engine) | `src/battle/ffx/results.ts` (`SCRIPTED_GAME_OVER_FLAG`); `engine.ts#checkEnd` | §3.4, `[verified: 4 sources]` |
| No orders without Cid; the counted foe | `src/battle/ffx/ai/evrae-rules.ts` | §3.5, `[verified: 3 sources]` |
| Tests | `tests/unit/chapters/sin-engine.test.ts` (18), `tests/unit/chapters/sin-bench.test.ts`, helpers `sinUnits.ts` and `sinPolicies.ts` | |
| Bench write-up | `docs/plans/sin-link4-bench.md` | |

**How the fight runs:**

1. **The pulls.** Sin's turns 1 to 3 are "Drawn to Sin." with the ship FAR. This reuses Evrae's
   `airship.range` gap: only Wakka, Blk and Wht Magic, Lancet and long-range rows reach. The ship
   is NEAR after the third pull.
2. **The mouth.** Turns 4 to 12 are the mouth. These turns pass and carry a telegraph line, with
   no action row (§3.4: a pose).
3. **The end.** Turn 13 is Giga-Graviton: 16/16 of max HP, Death 255, and a scripted Game Over
   that Auto-Life and an aeon cannot stop.
4. **Gaze.** Gaze is a counter after six party targetings, with an aeon's targeting counting two.
   It hits the whole party with one status at 30 %, or the aeon at power 50.

**The flags on `state.flags`** (for the HUD clock later):

- `sin.turn`, `sin.turnsLeft`, `sin.gigaGravitonTurn` (the S-1 switch, per battle);
- `sin.gazeCounter`;
- `sin.mouthStage`: 0 during the pulls, then 1 to 3, then 4 for fully open. This is presentation,
  our estimate.

**Placeholders, each labelled in the code:**

- **Scene:** Chapter VIII's deck, `evrae-airship-deck`. Its range director follows the same flag.
  The painted backdrop, the deck over Bevelle at dusk, is not painted.
- **Enemy art:** the stage's grey boss silhouette. There is no painting yet.
- **Music:** `scene-fahrenheit` and `boss-evrae` (S-21: no source names the head's track).
- **Story:** silent. A pre scene opens the battle, and a post scene shows results.
- **Card copy:** our own summaries, `title: 'Sin'`. It is not shown, since there is no card.

## Package B, the Chapter XVII bench (2026-09-29; FFX only; full tables in `docs/plans/sin-fins-core-bench.md`)

**Superseded numbers:** the tables below are the first run. After the link-3 cause was found (a bench-line defect and a
carry defect, both fixed) the sensible chain is 25.5 % and the card's 3 %; see "The link-3 cause" at the end of this file.

Measured on `chapter-sin` after F, G, P and H merged. Nothing was tuned (no boss number, data row or engine file
changed; only tests, helpers and the note). 200 seeds per line, first try, the sensible line (research §8 rows 1 to
4, 6, 9), the naive line, and the advisor card's top row (`critic/bench/advisor-v3/drive.ts` primitives).

**Does XVII clear the 90 % intended-line bar? No.**

| | Chain (links 1 to 3, carried) | Link 1 | Link 2 | Link 3 |
|---|---:|---:|---:|---:|
| Sensible, chain | 13/200 (6.5 %) | 100 % | 100 % | 13/200 |
| Sensible, each link rested | - | 100 % | 100 % | 78.5 % |
| Advisor card, chain | 1/200 (0.5 %) | 95 % | 43.7 % | 1/83 |
| Advisor card, each link rested | - | 95 % | 98 % | 82.5 % |
| Naive | 0/200 | 0 % | 0 % | 0 % |

- **The cap is carry into link 3** (rested 78.5 %, carried 6.5 %), and the Core's four elemental counters end the
  sensible line's losses. A chain attempt is **413 engine turns** (a full clear 380 to 490), about twice Chapter III's
  first link (about 195) and 2.2 to 2.9 times the plan's estimate (140 to 190).
- **S-12 (Negation) is the biggest lever and the least sourced:** off, the sensible chain is 91/200 (45.5 %) and the
  card's 29/200 (14.5 %). **S-8** NEAR barely moves the sensible line (9 % against 6.5 %; the card's rested link 2 is 88 %
  against 98 %). **The seam line-up (Q16)**, both readings: within noise for the sensible line (8 % against 6.5 %).
- **Aeons reach nothing at FAR** (REVIEW 13): every attack, ability and Overdrive row is off for all five aeons on both
  Fins, even with a full gauge; at NEAR every row reaches. §7.2's guides summoning Bahamut on the Fins would have to be
  NEAR; unreconciled, a question for the plan's Q list.
- **`escape` (the 400-turn stalemate) is its own cause:** naive loses every Fin fight that way; 10 of the 200 sensible
  chains end in it at link 3. **No line wins with Genais standing;** the Core-first variant (row 6) is 0/200.
- **Options for Bailey (none built):** a checkpoint at link 3 (Q3: 78.5 % rested), confirming S-12 against the game,
  an aeon line for link 3, or listing XVII with its difficulty disclosed.
- **Tests:** `tests/unit/chapters/sin-fins-core-bench.test.ts` (a smoke set in the suite; the tables behind
  `PYREFLY_SIN_BENCH=1`, about 17 minutes), `tests/unit/helpers/sinFinsBench.ts` and `sinFinsPolicies.ts`.
  `sin-bench.test.ts` gained the advisor line and the same gate (6 seeds in the suite; `PYREFLY_SIN_BENCH=1` for the
  200). Link 4 with the card: **44/200 (22 %)** on the 13th turn, **4/200 (2 %)** on the 12th; the other two lines are
  unchanged (62/200 and 7/200; 0 and 0).

## The bench (summary; full tables in `docs/plans/sin-link4-bench.md`)

Settings: 200 seeds, first try, human pace equal to bench speed (CTB). Nothing was tuned.

| Line | Giga-Graviton on | Wins | Ended by Giga-Graviton | Sin HP left on a loss (median) | Damage per Overdrive |
|---|---:|---:|---:|---:|---:|
| sensible | 13th (default) | **62/200 (31 %)** | 138/200 | 13,329 | 3,087 (Auron's Dragon Fang, the only gauge that fills) |
| sensible | 12th (Gestahl) | 7/200 (3.5 %) | 193/200 | 16,881 | 3,091 |
| naive | 13th | 0/200 | 200/200 | 114,588 | 2,229 |
| naive | 12th | 0/200 | 200/200 | 116,037 | 2,229 |

**Verdict:** one sitting of concept A looks too long.

- **The estimate:** the first pass is about 215 to 265 engine turns. Links 1 to 3 in that are an
  estimate from §6.2; link 4 is measured at 75.
- **Against the project:** the longest line today is Chapter III's first link, at about 195 turns.
- **The retries:** a first clear needs about three link-4 attempts at 31 %.
- **The recommendation:** split at the save into concept C. The built link 4 is C's second
  chapter as it stands. The alternative is to keep A only with a checkpoint at the save.
- **Bailey's pick.**

## Verified (2026-09-27)

- `npx tsc --noEmit`: clean.
- **Tests:**
  - `tests/unit/chapters/sin-engine.test.ts`: 18/18.
  - `sin-bench.test.ts`: green, and it prints the tables.
  - Full suite: see the commit body.
- **Unchanged elsewhere:**
  - FFX chapters I, II, III, VII to X, XII and XIV, 6 seeds each, sha256 of the event log and of
    every menu offered: identical on this branch and on `main` (a scratch hash harness, not
    committed).
  - `ffx2-atb-golden` and the FFX engine suites pass unchanged.
- `node tools/orphans.mjs`: 29 before and 29 after. No new module is orphaned.
- **Browser**, headless Chromium on the GPU, a dev server on port 7300 (stopped afterwards):
  - `window.__pyrefly.gotoChapter('sin')` reaches the battle.
  - `chapters()` does not list it.
  - It opens FAR with the clock at 13.
  - Real keys submitted Tidus's Cheer. Attack reads "Out of reach" at FAR, and the advisor card
    offers Cheer.
  - At Sin's 5th turn the ship is NEAR and the mouth is at stage 1.
  - The fight ends on the Defeat results screen.
  - Screenshots: `docs/screenshots/sin/link4-placeholder-far.png`, `-near.png`, `-end.png`.

## Open (Bailey's, or the next track's)

1. **S-1.** Giga-Graviton on the 12th or the 13th turn is worth 31 % against 3.5 %. It needs the
   Steam HD Remaster check, which only Bailey can schedule. Do it before listing. (D-280: the 13th
   for now, labelled our estimate.)
2. **A or C for one sitting: settled.** Bailey picked C (D-270): XVII "the Fins and the Core" and
   XVIII "the Face", split at the save. Still open inside XVII: the retry starts at the Left Fin (the
   default) or at a link-3 checkpoint (plan Q3), once bench B has the length.
3. **The painting pilot of Sin's head** at colossal scale: 9 states in the concept sheet. Options
   first, and nothing is installed until Bailey picks (rules 8 and 9). This agent did not queue
   renders.
4. **The HUD clock (mouth as clock, concept B's frame)** needs a mockup and Bailey's approval before
   it is built. The flags it would read are already published.
5. **Links 1 to 3 (Chapter XVII):** the spine is in (package S, above). Packages F (the Fins and Cid),
   G (Genais and the Core) and P (story, meta, guides, tactics, the director bind, the widget) fill the
   stubs; then bench B measures the chain to replace the estimate above.
6. **Music:** the countdown cue and the assault cue, sketched and judged by ear (rules 8 and 13).
7. **Listing is the switch.** Move `SIN_FINS_CORE` and `SIN_FACE` from `UNLISTED_CHAPTERS` into
   `CHAPTERS` (and both ids into `CHAPTER_IDS`), with cards, meta, story, guides and tactics, once the
   picks are made (plan §6; D-279 has the driver make the picks tonight).
8. **Not built on purpose:**
   - S-28 (Use reaching after the 2nd pull, single source).
   - Aeon Overdrive lines in the bench (the preset's aeon gauges are not full).
   - The equipment drops (S-7), and so D-270's re-equip at the top of XVIII (a recorded deviation, above).

## CHECK (independent, 2026-09-27 ~16:15 EDT; did not build it)

Branch `chapter-sin` at 410c4cf8, worktree `D:/pyrefly-ch-sin`. **FFX only**, as the build says.
Every claim below comes from running the engine (rule 3), not from reading the code. The probes are
untracked scratch in `tests/unit/zz-scratch/zz-check-sin*.test.ts` and `tools/zz-sin-*.tmp.mjs`.
**Verdict: PASS. No blockers.**

**Data against `research/ffx-sin.md`:** every field was read against its tag, and all of them match.

- **§2.1 stats:** HP 140,000, MP 999, STR 30, DEF 40, MAG 30, MDEF 40, AGI 30, Luck 15, Eva 0, Acc 0.
  Overkill 16,000; Zanmato 4; Doom 30. The head is Armored, immune to percentage damage and to Delay.
- **§2.2 and §2.3 resistances:** no elemental affinities. Every 255 row in §2.3 is 255. Armor and
  Mental Break and Reflect are landable. Threaten is immune (S-6).
- **§2.4 rewards:** 12,000 gil and 20,000 AP (30,000 on Overkill); steal Ether / Supreme Gem; drop
  Lv. 3 Key Sphere; Bribe immune.
- **§3.4 rows:**
  - Gaze: Magic, power 20, Special, whole party, one status at 30 %. There are three versions, and
    the aeon version is power 50.
  - Giga-Graviton: percent-total 16, Break Damage Limit, Death 255.
  - Every row has `canMiss: false` (rule 5).
  - The estimates are labelled: rank 3, and Confuse's duration of 254.

**The clock, over seeds 1 to 25 with the party defending (engine log):**

- **Giga-Graviton on turn 13:** all 25 seeds give the same shape.
  - Drawn to Sin on turns 1, 2 and 3. The range is FAR, FAR, then NEAR from the third pull.
  - `turnsLeft` counts down 12, 11, 10 ... 0.
  - There are 9 mouth telegraphs and no action row on turns 4 to 12.
  - Giga-Graviton comes on turn 13. The outcome is defeat, and `battle.scriptedGameOver` is set.
- **Giga-Graviton on turn 12:** the same shape, with 8 telegraphs.
- **What Giga-Graviton does:** it deals 100 % of max HP to anyone at full HP (Tidus 6492/6492), or
  their current HP. The log shows `damage`, then `ko`, then `defeat`, in that order.

**The scripted Game Over:**

- **Auto-Life:** Auto-Life was put on all seven members over seeds 1 to 8. Three revives fire after
  Giga-Graviton, and every seed still ends in defeat.
- **Aeons:** an aeon was called on Yuna's first turn and held the field to turn 13. This was tried
  with each of Valefor, Ifrit, Ixion, Shiva and Bahamut. Giga-Graviton hit only the aeon, and every
  run still ended in defeat.

**Gaze:**

- **The count:** over 60 seeds, 1,466 party targetings drew 216 Gazes. That fits the six-count
  resetting after each Gaze, with 0 to 5 left over at the end of each fight.
- **What does not count:** five hits plus cures and defends draw no Gaze, and the count stays at 5.
- **The variants:** Petrify 72, Confuse 77, Zombie 67, uniform as S-16 intends.
- **How often the status lands:** on a member without a ward it lands 18 % to 33 % of the time
  (Auron: Petrify 17/72, Confuse 18/77, Zombie 19/67). That fits a 30 % chance.
  - The wards hold completely: Tidus and Yuna are never Confused (both wear Confuse Ward), and Yuna
    is never Petrified (Stoneproof).
- **The aeon version:** `sin-engine.test.ts` covers it (three aeon attacks draw it), and that test
  passes here.

**Reach at FAR, Sin's first turn:**

- Tidus reaches with Slow only. It is White Magic, and Sin is immune to it.
- Yuna reaches with Reflect and Dispel.
- Auron reaches with nothing.
- No Trigger Command is offered, and Cid is absent.
- Asking for Sin's intent leaves `state.flags` byte-identical: the preview does not move the clock.

**The bench reproduces exactly.** `npx vitest run tests/unit/chapters/sin-bench.test.ts` printed the
same tables to the digit:

- sensible line: 62/200 with Giga-Graviton on turn 13, and 7/200 on turn 12;
- naive line: 0/200 both ways;
- every other column matches too.

The same seed gives the same log.

**Unlisted:**

- **The debug API:** `__pyrefly.chapters()` returns the 15 listed ids, and `sin` is not among them.
- **Chapter select** (headless GPU Chromium, dev server on port 7410, since stopped) shows the same
  cards as main.
  - The FFX row is I, II, III, VII (coming), VIII, IX, X, XII and XIV.
  - The FFX-2 row is IV, V, VI, XI, XIII and XV.
  - There is no "Sin" and no "XVI" on the board.
- **Nothing changed underneath:** `src/app/**`, `src/ui/**`, `CHAPTERS` and the chapter-select code
  are unchanged, both from the branch base to HEAD and from the base to `origin/main`.
- **Reaching it:**
  - `gotoChapter('sin')` reaches the battle. It opens FAR, with 13 turns left.
  - Real Enter keys submitted Tidus's Cheer.
  - The fight ran to Giga-Graviton on turn 13 and ended in defeat.
  - There were no page errors.

**Goldens and the rest of the build:**

- **FFX:** `tests/unit/tools/ffx-chapter-hashes.test.ts` was run with 6 seeds and 4 policies, skipping
  `sin`. It was run on a `git archive` of the base 60cf703c and on HEAD, and the results are
  identical: 408/408 entries across the nine FFX chapters.
- **FFX-2:** `ffx2-atb-golden` passes, 6/6. `ff7-golden` passes.
- **Type check:** `tsc --noEmit` is clean on tracked code. The only errors are in untracked
  `tests/unit/zz-scratch/` probes: the builder's `sin-probe*.test.ts`, and two of mine that I have
  since fixed.
- **Orphans:** 29, and none of them is a Sin module.
- **Full suite (run once):** 555 files pass and 2 fail, 9235 tests pass and 2 fail. The two failures
  are timeouts under machine load:
  - `strategy-ffx2-bahamut` heal-only route, 30.5 s;
  - `ui-ffx2-atbmode` FFX HUD chip, 22.9 s.
  Both pass when run alone (25/25), and neither touches Sin code.

**Findings (all minor):**

1. **The record still reads as concept A.** Bailey picked C on 2026-09-27 ("all your
   recommendations"), which settles "Open" item 2. This link becomes "Sin: the Face", and links 1 to
   3 become "Sin: the Fins and the Core". `src/data/chapter-sin.ts` still says `title: 'Sin'` and
   number 16, and the handoff's Open list still asks the question. Rename it, renumber it and reword
   the Open list before listing.
2. **An aeon's targeting counts 2 toward the six.** That is a labelled reading of "three times by an
   aeon". The research pseudocode keeps separate thresholds instead (3 for an aeon, 6 for the
   party). The two agree when only one side attacks. They differ when a party count carries over
   into a summon: at 5, one aeon hit fires Gaze. Neither is sourced, and it is already in
   `OVERDRIVE_SIN_ASSUMPTIONS`.
3. **Cosmetic, in `learn/atlas/cites.ts`:** the Chapter XVI comment was joined onto the
   `'ffx2-den-of-woe': {},` line.
4. **The worktree's scratch probes break `tsc` in this worktree.** They sit untracked under
   `tests/unit/`, so the type check here is not clean. No tracked file is affected.

## CHECK 2 (independent, 2026-09-29 ~02:45 to 04:30 EDT; did not build any of it)

This check covers branch `chapter-sin` at `e76c7d0e` (S, F, G, P, H merged, then the staged art and bench B), in worktree
`D:/pyrefly-ch-sin`. **FFX only** throughout. Every claim below comes from running the engine or the app (rule 3).

The probes are untracked scratch:
- `tests/unit/zz-scratch/zz-check2-sin-xvii.test.ts`, `zz-check2-sin-bench-slice.test.ts` and `zz-check2-dump-link4.test.ts`;
- the browser and hash files in `D:/Tools/pyrefly-scratch/overnight-0929/sin-check/`.

**Verdict: PASS. No blockers.** There are seven minor findings, listed at the end.

**The four new enemies against `research/ffx-sin.md`.** Every number was typed from the research by the checker
and compared with the live combatants the engine builds. Nothing was mismatched.
- **§2.1 stats:** HP, MP, Overkill, STR, DEF, MAG, MDEF, AGI, Luck, Eva and Acc.
- **§2.1 flags:** Armored and percentage-immune on the Fins and the Core, but not on Genais. Delay-immune on all four.
  Doom 30 and Zanmato 4.
- **§2.2 elements:** Genais is weak to Fire and absorbs Water. The other three have none.
- **§2.3 statuses:** every 255 row is 255. Genais has Zombie 80 and Silence 100, and takes Power Break, Magic Break,
  Slow, Haste and Doom. Armor Break and Mental Break land on the Fins and the Core, and Genais is immune to both.
  Reflect is 255 on Genais and the Core. Threaten is immune (S-6).
- **§2.4 rewards:** gil, AP and Overkill AP (the Right Fin's is 17,000 / 25,500), steals, drops, and Bribe immune.
- **All 17 action rows (§3.1 to §3.3):** power, formula, target and type match on every row, with `canMiss: false` and
  rank 3 throughout.
  - Venom carries Poison 100 only (S-3) and is `crit-eligible`.
  - Sigh inflicts Darkness at 100 for 3 turns.
  - Waterga is Water with shatter 10.
  - The Core's counters run Fire, Ice, Lightning, Water.
- **Negation** removes 24 statuses, and never Death, Doom, Curse, Auto-Life or Eject.

**The 13 must-changes.** Each one was checked by a probe or a test run here.

| # | Done | Evidence |
|---|---|---|
| 1 | yes | Waterga landed on the caster (Lulu) on 30 of 30 seeds (101 to 130, Fire and Blizzard). G's aeon-caster test passes |
| 2 | yes, with a lag (finding 2) | G's tests pass for the Core killed by Attack, ability, item and Overdrive, for Doom, and for Zombie plus Cura |
| 3 | yes | `sin-ship-layer.test.ts` pins Chapter VIII (one Evrae bind, unchanged), link 4 (never bound) and the Fin re-binds |
| 4 | code yes; the M sheet is not merged (finding 3) | Fins: no pip strip. Evrae keeps 3 pips. `phaseCanon` is a comment-only change |
| 5 | yes | `sin-carry.test.ts` pins Chapters III and XIV as carrying no statuses |
| 6 | yes | `seam-lineup` is in `SIN_FINS_ASSUMPTIONS`. The bench measures both readings |
| 7 | yes | A probe on the Core's Negation stripped Haste and NulBlaze. It spared a permanent Protect, Auto-Life and Doom |
| 8 | yes | Its own flag (`sin.core.counterChanceBefore` = 0 gives no counter) and the absorbed-spell flag (off gives no counter, the "Magic absorbed." line stays). The bench's §4b measures both |
| 9 | yes | `decisions.json` D-270 carries `deviation` |
| 10 | yes | See the golden hashes below |
| 11 | yes | Venom is `crit-eligible`. The stat test covers Reflect 255 and Delay |
| 12 | yes | `orphans.mjs` finds 24 orphans, none of them a Sin module |
| 13 | yes, except the Q-list line (finding 5) | `PYREFLY_SIN_BENCH` gate. `escape` is its own cause. Aeon reach at FAR is measured |

**Other chapters are unchanged.**
- **FFX golden hashes** (6 seeds x 4 policies, `FFX_HASH_SKIP=sin,sin-face,sin-fins-core`): HEAD against a base
  regenerated here from S's `git archive` of `56026029` is **408/408 identical**. S's recorded `base.json` is also
  byte-identical to the regenerated base.
  - The run covers nine chapters: Seymour Flux, Yunalesca, Braska's Final Aeon, Seymour at Macalania, Evrae,
    Yojimbo, Natus, Omnis and Isaaru.
- **Chapter XVIII (link 4) against S's link-4 base:** 24 of 24 hashes differ. I checked this event by event on seed 1
  against a `git archive` of `a725473d`.
  - The only change is one `script-trigger` event (`sin-first-pull`, P's story callout), which shifts the `seq`
    numbers.
  - Every combat event and every menu is identical. That is a deliberate Sin change, not a regression.
- **Chapter VIII:** the director diff binds Evrae exactly as before, and the widget passes a number, so Evrae keeps its
  3 pips. The Evrae suites pass, including `evrae-engine`.
- **FFX-2:** `ffx2-atb-golden` passes 6/6. `ff7-golden` passes 3/3.

**The bench reproduces.** I re-ran seeds 1 to 40 of each line. Every figure sits within noise of B's 200-seed table
(in brackets).

| Line | Chain | Link 1 | Link 2 | Link 3 | Rested links 1 / 2 / 3 |
|---|---:|---:|---:|---:|---|
| Sensible | 3/40, 7.5 % (6.5 %) | 40/40 | 40/40 | 3/40 | 100 / 100 / 87.5 % (100 / 100 / 78.5 %) |
| Naive | 0/40 | 0/40, all `escape` | - | - | - |
| Advisor card | 0/40 (0.5 %) | 38/40 | 17/38, 44.7 % (43.7 %) | 0/17 | 95 / 97.5 / 87.5 % (95 / 98 / 82.5 %) |

- **The sensible line's link-3 losses:** the Core's counters, plus 4 `escape`.
- **The card's link-3 losses:** Genais's Sigh.
- **Determinism:** the same 8 seeds run twice give identical readings.

**The rules.**
- **Layering (rule 1):** no `three`, DOM, `app`, `ui` or `engine` import under `src/battle` or `src/data`. The only
  matches are in comments.
- **File size:**
  - `setup.ts`, `simulate.ts`, `types.ts` and `FFXBattleHud.ts` are the same length as before.
  - `reactions.ts` grew by the one line the review allowed, and stays under 400.
  - Two test files are over 400 lines (finding 6).
- **Contracts:** `docs/CONTRACT-CHANGES.md` has the entry for the `encounters.ts` ids and `| 18` and the
  `carriesPartyState` doc.
- **Checks:** `npx tsc --noEmit` is clean; only the untracked `tests/unit/zz-scratch/**` has errors. `critic-plan`
  classes the change DEEP.
- **Full suite, run once** (`npx vitest run --testTimeout=60000`): 633 files pass and 15 are skipped. 9,804 tests
  pass, 49 are skipped and 1 is a todo. No failure.

**In the app.** Headless GPU Chromium ran against a dev server on port 8261 with file watching off. The server was
stopped by its PID afterwards. There were 0 page errors in every run.

- **Chapter XVIII:**
  - `gotoChapter('sin-face')` opens FAR with 13 turns left.
  - 93 real key presses played it to the **Defeat** results screen after 53 turns.
  - The clock showed, and the Fin plate did not.
  - Screenshots: `D:/Tools/pyrefly-scratch/overnight-0929/sin-check/sin-face-end.jpg` and `sin-face-results.jpg`.
- **Chapter XVII:**
  - `gotoChapter('sin-fins-core')` opens the Left Fin at FAR, with Cid present and hidden.
  - 910 real key presses played it to a **Defeat** results screen ("Withdrew ... The battle cannot be won from here",
    516 turns): the 400-turn stalemate in link 1, which is the bench's naive result.
  - The Fin plate showed, and the clock never did.
  - `auto: 'intended'` on seeds 8 and 12 walked the whole chain in the app: Left Fin, then Right Fin, then Genais
    and the Core. The plate showed in links 1 and 2 and not in link 3. Link 3 ended in `escape` and in defeat, as the
    bench predicts.
- **Chapter VIII:** the Sin HUD node is not in the DOM.
- **Unlisted:** neither Sin id is in `chapters()`.

**Merge with `origin/main` (`49005f73`):** `git merge-tree` finds **one textual conflict**, in
`docs/CONTRACT-CHANGES.md` (finding 1). Everything else merges on its own, including `AirshipOrders.ts`, which main's
PR-0236 also touched.
- I extracted the merged tree to scratch and ran `tsc` on it: clean, apart from tests that import `docs/`, which I did
  not extract.
- On the merged tree, 20 files of tests for Sin, the airship, Evrae's orders, guides, tactics and the atlas pass (290
  tests).

**Findings (all minor):**

1. **`merge-tree` is not clean.** Both sides added their newest entry at the top of `docs/CONTRACT-CHANGES.md`. Keep
   both entries. Docs only.
2. **Must-change 2 leaves a one-action lag in one case.**
   - When Genais dies to its own Cura while Zombied, the death happens inside the counter phase, after that action's
     liveness hook has already run.
   - The **next menu** therefore still sees the Core out of reach and magic-immune. Seed 16: Auron's Attack row had no
     reachable target.
   - The action after that clears it.
   - It is labelled `liveness-lag` in `SIN_CORE_ASSUMPTIONS` and is rare (Zombie lands 20 %). A spell cast in that
     window would deal 0 with no "Magic absorbed." line.
   - A fix: run `syncGenaisCoreLiveness` again after the counters, or when the menu is built.
3. **Must-change 4's mockup sheet** (M: "the widget without pips") is commit `367741dc` on branch `chapter-sin-m`. It is
   not merged into `chapter-sin`. On this branch there is only P's screenshot
   `docs/screenshots/sin/p-fin-orders-no-pips.jpg`.
4. **The should-change "fix the dangling cite" is not done.**
   - Research §2.3 and `sin-two-chapters-review.md` row 5 still cite a "§5.2.3" that does not exist.
   - Row 5 also says the Core's counters bounce off a Reflected party, "tested". The engine never bounces party-wide
     counters (`reflect-bounce` in `SIN_CORE_ASSUMPTIONS`, labelled open).
   - Only Waterga's single-target bounce is pinned by a test, and it lands on Genais or the Core.
5. **The plan's Q list was not updated.** Must-change 13's "aeon reach at FAR" and S's Q16 and Q17 live only in
   `SIN_FINS_ASSUMPTIONS` and this handoff. The plan file has not changed since the review.
6. **House size rule, if it covers tests:**
   - `tests/unit/chapters/sin-fins-engine.test.ts` is new at 483 lines.
   - `tests/unit/strategy-guide.test.ts` grew from 401 to 403 lines.
   - 40 test files in the repo are already over 400.
7. **For the driver: the both-greyed Orders submenu, on this branch's base.**
   - With an order queued at FAR, Tidus's Orders row opens a widget in which both rows are greyed. Enter does nothing
     there, and Escape backs out.
   - Evrae has the same behaviour here. It is main's PR-0236 fix and arrives with the merge; the airship tests pass on
     the merged tree.
   - It is not a Sin defect, but XVII meets it at once, so check the Fins in the app after the merge.

Disclosed rather than a defect: XVII does not clear the 90 % bar on either reading of the intended line (bench B). That
is Bailey's call before listing (plan Q3, S-12).

## The link-3 cause, two fixes, the checkpoint option and CHECK 2's minors (2026-09-29 ~04:30 to 07:30 EDT; FFX only)

**The puzzle:** the sensible line won link 3 78.5 % rested and about 7 % carried, with 7/7 alive at a mean 75 % HP.
Full write-up: `docs/plans/sin-fins-core-bench.md` "Link 3, rested against carried" and §6, §7. Every figure is the
engine's (rule 3); scratch probes `tests/unit/zz-scratch/zz-l3-*.test.ts` (untracked), data in
`D:/Tools/pyrefly-scratch/overnight-0929/sin-l3/` (`dump.json`, `rows-final.txt`).

- **Nothing leaks across the seam.** On 20 seeds the link-3 entry's flags (every `sin.*`, no `airship.*` or `sin.fin.*`
  left over), Genais and the Core, the aeons and the front row are identical carried and rested; a fresh engine and the
  chain's reused engine give the same results. The carry differs only in HP, statuses (SOS, Haste, Protect), gauges,
  MP (Auron 8/100, Lulu 117/300, Yuna 227/320 on average) and items (X-Potions 0.1 of 10, Ethers 1 of 3).
- **Cause 1, a bench-line defect (fixed, tests first):** the line Defended a dry Auron (12 MP per Break, 4 to 16 left
  after links 1 and 2) for the rest of link 3 with Turbo Ethers in the bag. `sinFinsPolicies.ts#breakRow` drinks, or
  swings when there is nothing to drink. **Sensible chain 13/200 → 51/200 (25.5 %); rested link 3 78.5 → 81 %.**
- **Cause 2, what remains, is FAITHFUL attrition** (§1.2: HP, MP, statuses, gauges carry; spent items stay spent). One
  factor at a time, 200 seeds: carried 25.5 %; HP, statuses, gauges, aeons or Ethers back: 20.5 to 31 %; MP back 39 %;
  items back 55.5 %; **X-Potions alone back 62.5 %**; items and MP 76 %; rested 81 %. Nothing tuned.
- **A carry defect found on the way (fixed, tests first):** the FFX status carry copied Max HP x2 (Stamina Tonic)
  without its doubled ceiling, clamped the HP above the base, and a later KO halved the *base* max HP (card, seed 23:
  Tidus 1,623 of 3,246). `BattleScreenSetup.carriedFfxState` now carries the live ceiling with a pool doubler and derives
  SOS from the carried HP like KO (a stale SOS made a fresh engine's init throw, which a checkpoint retry would hit).
  Only Sin links 2 and 3 carry statuses. **Card chain 1/200 → 6/200; card with S-12 off 29 → 93/200.** Sensible unchanged.
- **Not changed, open for the driver:** `FFXEngine.init` builds before it keeps the new context, so setup-time events go
  to the previous link's log on a reused engine and throw on a fresh one (shared FFX plumbing, pre-existing). With the
  carry consistent, no measured carried state emits (200 sensible and 18 card link-3 entries on a fresh engine).

**The option for Bailey: a link-3 checkpoint, built OFF** (`SIN_LINK3_CHECKPOINT = false` and `sinLink3Checkpoint(on)`
in `src/data/ffx/enemies/sin-genais-core.ts`; the D-217 seam, `checkpointOnEntry`, labelled an adaptation; `types.ts`
doc comment + `CONTRACT-CHANGES.md`). On, RETRY after a link-3 loss reopens link 3 on the state captured on entering
it. Measured, 200 seeds, up to 5 attempts:

| Line | Checkpoint | Within 1 | Within 3 | Within 5 | Engine turns to a win |
|---|---|---:|---:|---:|---:|
| sensible | off | 25.5 % | 55.5 % | 76 % | 948 |
| sensible | ON | 25.5 % | 57 % | 74.5 % | 531 |
| advisor card | off | 3 % | 7.5 % | 11.5 % | 1,291 |
| advisor card | ON | 3 % | 8 % | 13.5 % | 1,010 |

It saves time, not odds, for the sensible line (a retry replays the same spent party: link-3 retries win 24 %). Q3's
default (back to the Left Fin) stands until Bailey chooses. Tests: `tests/unit/chapters/sin-checkpoint.test.ts` (3).

**The new bench tables** (all three lines, `PYREFLY_SIN_BENCH=1`, ~27 minutes with §6 and §7; `PYREFLY_SIN_BENCH_OUT=<file>`
tees rows as they are measured): sensible chain 25.5 %, card 3 %, naive 0; S-12 off 44 % and 46.5 %; S-8 NEAR 27.5 % and
6.5 %; front-row seam 26 % and 0 %; rested per link sensible 100 / 100 / 81 %, card 95 / 98 / 83 %. XVII still does not
clear 90 %. Link 4 was not re-run (untouched; its smoke passes).

**CHECK 2's minors:**
- Finding 3: `chapter-sin-m` (`367741dc`, package M's sheet, the order widget without pips) merged `--no-ff` (`2627deed`).
- Finding 2 (liveness lag): fixed (`0ec2c725`); `ticks.ts#onTurnEnd` runs `runSinLivenessHooks` after the counters,
  as it runs Omnis's turn-end hook; the Zombie + Cura test asserts the Core is freed by the same action.
- Findings 4 and 5: `aa349c51`; research §2.3's cite is §5.3.2 item 4 and §8 row 7; review row 5 now says the engine
  never bounces a party-wide spell (`reflect-bounce`, open); Q16, Q17 and Q18 (aeon reach at FAR) are on the plan's Q list.
- Findings 1, 6 and 7 are the merge's and the driver's (not touched here).

**Gates:** `npx tsc --noEmit` clean (only the untracked `zz-scratch` probes error); 21 Sin, Evrae, checkpoint, guide and
tactics files pass (349 tests), and the 41 files that touch the carry or `onTurnEnd` pass (557); **FFX golden hashes
408/408 identical** to `sin-S/base.json` (6 seeds, `FFX_HASH_SKIP=sin,sin-face,sin-fins-core`); `orphans.mjs` 24, none Sin.

## CHECK 3 (independent, 2026-09-29 ~06:05 to 06:30 EDT; did not build any of it)

Checked at `41c003fd` on `chapter-sin` in `D:/pyrefly-ch-sin`, by running the engine. The scratch probes are in
`tests/unit/zz-check3/` (untracked, not committed); their output is in `D:/Tools/pyrefly-scratch/check3-sin/`
(`ab.txt`, `slice.txt`, `tonic.txt`, `hash.txt`). The pre-fix baseline is `git archive 8e946e78` (CHECK 2's commit),
unpacked at `D:/Tools/pyrefly-scratch/check3-sin/base`. **Verdict: the cause is confirmed, nothing sourced was tuned,
every number reproduces, and no other chapter changed. No blockers. One major finding: the carry fix leaks a doubled
max-HP ceiling into link 3.** Game case: FFX only.

**The cause, reproduced on seeds 1 to 10 (HEAD engine; the old line is `8e946e78`'s `sinFinsPolicies.ts` unchanged).**
- **The seam dump.** Carried and rested give the same `state.flags` on 10 of 10 seeds (0 diffs). Genais and the Core
  are identical, and so are the five aeons (HP, MP, statuses). The chain's reused engine and a fresh engine on the same
  carried entry win the same count (1/10 each). What differs is Auron's MP (4 to 88; the new line now drinks at the
  Fins too), X-Potions (0 on every seed) and the carried statuses (`critical`, Haste, one Protect).
- **The A/B that flips.** In link 3, with Genais down and Auron under 12 MP, the old line pressed Defend **623 times**
  over 10 seeds; seed 4 pressed it 275 times and seed 5 270 times. The new line presses it **0** times, and its chain
  wins go from 0/10 to 1/10. The mechanism is exactly the one the report describes. It is a bench-line defect, not an
  engine one: the only helper change is `breakRow`, a diff of 30 lines.
- **The attrition.** Factors put back one at a time on the new line's 10 entries: carried 1, MP 2, X-Potions alone 5,
  every item 3, items and MP 6, rested 7 (of 10). This is the same ordering as the 200-seed §6 table. On the old line
  the counts are 0 / 2 / 3 / 0 / 6 / 7. Refilling all items scoring below refilling the X-Potions alone shows up at
  200 seeds (55.5 % against 62.5 %) and here as well, so it is real rather than noise. It is a line question and was
  not investigated further.

**Nothing sourced was tuned.** `git diff 8e946e78 HEAD -- src research` touches six places:
- `BattleScreenSetup.ts`, the carry;
- `ticks.ts`, the liveness hook;
- `sin-genais-core.ts`, the OFF switch only (no stat, AI or chance);
- the doc comments in `sin-genais-core-rules.ts` and `types.ts`;
- the research cite in `research/ffx-sin.md`.

**The 40-seed slice** (seeds 1 to 40, the bench's own `sweep` and `runWithRetries`) is inside sampling of every
200-seed figure:

| Reading | 40-seed slice | Reported (200) |
|---|---:|---:|
| sensible chain / S-12 off / S-8 NEAR | 10 / 18 / 9 of 40 (25 / 45 / 22.5 %) | 25.5 / 44 / 27.5 % |
| sensible rested links 1 / 2 / 3 | 40 / 40 / 37 | 100 / 100 / 81 % |
| card chain / S-12 off / S-8 NEAR | 1 / 19 / 1 of 40 (2.5 / 47.5 / 2.5 %) | 3 / 46.5 / 6.5 % |
| card rested links 1 / 2 / 3 | 38 / 39 / 35 | 95 / 98 / 83 % |
| naive chain | 0/40 | 0 % |
| sensible retries off, within 1 / 3 / 5 (turns to a win) | 10 / 21 / 30 (991) | 25.5 / 55.5 / 76 % (948) |
| sensible retries ON (link-3 retries won) | 10 / 23 / 30 (521; 20/81 = 24.7 %) | 25.5 / 57 / 74.5 % (531; 24 %) |
| card retries off | 1 / 4 / 6 (1,255) | 3 / 7.5 / 11.5 % (1,291) |
| card retries ON | 1 / 4 / 5 (819; 2/96) | 3 / 8 / 13.5 % (1,010) |

Sensible rested link 3 at 37/40 is +1.9 sd from 81 %. That is high but plausible, and the other rows sit close.

**The checkpoint option.**
- It is OFF by default: `SIN_LINK3_CHECKPOINT = false`, `sinGenaisCoreGroup.checkpointOnEntry` is unset, and
  `sin-checkpoint.test.ts` pins both.
- It is labelled an adaptation in the switch's doc comment, `types.ts` and `CONTRACT-CHANGES.md`.
- Its numbers reproduce (above). The report's reading holds: it saves time, not odds. For the card line, ON is not
  even better on odds in the slice (5 against 6 within 5 attempts).

**Other chapters: no change.**
- Every FFX chapter's full chain was hashed, with every link carried through the screen's own `setupForNextLink`
  (6 seeds, 902 decisions). All 9 hashes are identical between HEAD and `8e946e78`. The drive is attack-first, so the
  coverage is shallow, but it does cross the new `onTurnEnd` hook on every turn.
- `tests/unit/chapters` and `tests/unit/battle`: 113 files, 1,314 tests pass.

**The minors are confirmed.**
- `2627deed` is a true two-parent merge of `367741dc` (`--no-ff`).
- The liveness hook runs in `ticks.ts#onTurnEnd` after the counters and the Poison tick.
- `sin-core-engine.test.ts` asserts the same-action free and passes.

**Gates.**
- `npx tsc --noEmit`: clean for every tracked file. The only 4 errors are in the untracked `tests/unit/zz-scratch/`.
- The 13 Sin files and `seymour-flux-poison-crossing`: 14 files, 163 tests pass, 3 skipped (the bench tables behind
  the env).

### Findings

1. **Major (a defect in the new carry fix, in the player's favour; FFX Sin only).** `carriedFfxState` takes the
   no-status ceiling from the previous link's build (`m.stats`). After seam 1→2 that build already holds the doubled
   Max HP. So a Stamina Tonic drunk in link 1 whose status comes off in link 2 (a KO; the engine halves the live
   ceiling back to the base) opens link 3 at the doubled ceiling with **no** `max-hp-x2`: a free, permanent Max HP x2.
   - Reproduced (`tonic.txt`): Auron's base is 6,492 and link 1's Tonic doubles it to 12,984. The status comes off in
     link 2, putting the live ceiling back at 6,492, yet link 3 opens at 12,984 with no status.
   - In the bench (`slice.txt`): the card line's 40 chains show **9 member-entries into link 3** with a doubled ceiling
     and no status. These are seeds 2, 9 (three members), 11, 13, 15 and 29 (two members), on Tidus, Yuna and Auron.
     The sensible line never drinks a Tonic and has 0.
   - Consequence: the card-line figures measured after `374df179` (chain 6/200, S-12 off 93/200) are flattered by some
     unknown amount.
   - Root fix: when the member has no `max-hp-x2` (or `max-mp-x2`), the ceiling is `live.stats.maxHp` (the engine has
     already halved it), or the template's base, never `m.stats`. Add a test that loses the Tonic in link 2 and checks
     link 3's ceiling. Then re-measure the card rows.
2. **Minor (stale doc).** The header of `src/app/screens/BattleChainCheckpoint.ts` still says "FFX-2 only in effect ...
   no FFX chapter ... ever produces a checkpoint". With `SIN_LINK3_CHECKPOINT` that is true only while the switch is
   off, so the header should name the switch.
3. **Minor (coverage).** The checkpoint tests call `checkpointAt` and `resumeSetup` and the bench's own retry loop. No
   test drives the real flow (`BattleEncounterChain` into `BattleScreen`) with the switch on for an FFX chapter. That
   is fine while it stays off, but the gap is owed before Bailey turns it on.
4. **Note (not a defect).** Refilling every item scores below refilling the X-Potions alone (55.5 % against 62.5 % at
   200 seeds; 3 against 5 of 10 here). It is a line effect that is worth one look if the attrition table goes to Bailey.

## CHECK 3 fixes (2026-09-29, after `dafe7fa2`): C3-1, C3-2, C3-3

Game case: **FFX only**. The carry is shared FFX plumbing, and only Sin's `carriesPartyState` links reach it.

**C3-1 (major), fixed in `BattleScreenSetup.carriedFfxState`.** A member or aeon with no `max-hp-x2` now takes the
**live** ceiling (`live.stats.maxHp`), and one with no `max-mp-x2` takes `live.stats.maxMp`. When the status comes off,
the engine has already halved that ceiling back to the base. The previous link's build (`m.stats`) is no longer used:
after a seam that build already holds the doubled pool. A Tonic that is still on keeps the doubled ceiling, as before.
- Tests were written first, in `tests/unit/chapters/sin-carry-ceiling.test.ts`. The Tonic is drunk by a real command
  in link 1 and crosses both seams on the real engine.
- Four cases: a Stamina Tonic kept across both seams, and one lost in link 2; a Mana Tonic kept, and one lost.
- The KO in link 2 goes through the engine's own `clearStatusesOnKo`. A real hit was not practical: under Defend the
  Right Fin never reaches Auron in 400 turns, and nothing his allies have targets him for damage.
- Before the fix, the lost cases failed with 12,984 against 6,492 (HP) and 200 against 100 (MP).

**The 40-seed slice, re-run** (seeds 1 to 40; CHECK 3's own probe, copied to the untracked `tests/unit/zz-c31/`;
output in `D:/Tools/pyrefly-scratch/overnight-0929/c31/slice.txt`):
- On the card line, link-3 entries with a doubled ceiling and no status went from **9 to 0**. Entries that still
  carry the status stayed at 46.
- Every chain, S-12 off, S-8 NEAR and rested row is **unchanged**, for the sensible line (10 / 18 / 9; 40 / 40 / 37)
  and for the card line (1 / 19 / 1; 38 / 39 / 35). Naive stays at 0/40.
- The sensible line's retry rows are unchanged, with the checkpoint off and on.
- The card line's retries with the checkpoint off moved: within 5 attempts went from 6 to **5**/40, and turns to a
  win from 1,255 to **1,181**. Within 1 and within 3 are unchanged (1 and 4).
- The card line's retries with the checkpoint on are unchanged (1 / 4 / 5, 819 turns, link 3 won on 2 of 96 retries).
- So the leak flattered the card line by about one chain in 40, and only across repeated attempts. The 200-seed card
  figures in the bench plan were not re-run here.

**C3-2 (minor).** The header of `src/app/screens/BattleChainCheckpoint.ts` now names the case: FFX-2 in effect, and
FFX only through Sin's link 3 while `SIN_LINK3_CHECKPOINT` is on (it ships `false`).

**C3-3 (minor).** `tests/unit/chapters/sin-checkpoint-flow.test.ts` covers the real flow with the switch ON.
- The real `GameFlow` runs Chapter XVII. Its battle stand-in makes the calls `BattleScreen` makes: `createEngine`,
  `runEncounterChain` over the real seams, and on RETRY `resumeSetup`, `resumeAt.group`, `startLink` and `priorWon`.
- A loss at link 3 retries at link 3: link 3 only, reseeded to 1001, no prep, on the carried HP it was entered on.
  It also carries the two Fins' results.
- A loss at a Fin starts over through prep.
- With the switch OFF, the same link-3 loss starts over at the Left Fin.

**Gates.**
- `npx tsc --noEmit` is clean, apart from the untracked `zz-*` scratch.
- The Sin tests, the carry tests (Den of Woe, Seymour Flux) and the chain, checkpoint, flow and restart tests all
  pass: 21 files, 329 tests, 3 skipped.
- `orphans.mjs` reports 24, unchanged.
- The FFX golden hashes (6 seeds, Sin chapters skipped) are **408 of 408 identical** to `sin-S/base.json`.

## CHECK 4 (independent, 2026-09-29 ~09:15 to 10:45 EDT; did not build any of it)

Checked `chapter-sin` at `cc069e50` (D:/pyrefly-ch-sin) and `songstress-0929` at `87d83c45` (D:/pyrefly-aeon-hp; its
own CHECK section is in `docs/concepts/songstress-2026-09-29/README.md`), against `origin/main` `8dce5e75`. Game case:
**FFX only** for Sin. Scratch, outputs and frames are in `D:/Tools/pyrefly-scratch/overnight-0929/check4/`
(not committed). Its `base`, `main`, `merged`, `prefix`, `basebuild`, `mainbuild`, `mergedbuild` and `e2e-sin` folders
each hold a `node_modules` junction, and the three `*build` folders also hold a `public/art` junction. **Unlink every
junction before deleting anything there.** Servers ran on 8640 to 8644 and were stopped by PID.

**Verdict: no blockers.** Both chapters are listed and playable by real keys at both sizes. The picked art loads and
shows as INSTALL.md says. The countdown HUD appears only in Sin. Loss and RETRY work in both chapters. Old saves keep
their progress. The C3-1 fix holds. No other chapter changed. One major finding: on the phone at NEAR, the Fin is out
of frame. Five minor findings.

**Gates (chapter-sin).**
- `tsc --noEmit`: clean apart from the untracked `tests/unit/zz-*`.
- `tsc -p tsconfig.e2e.json`: clean.
- 32 vitest files pass, 555 tests, 3 skipped. They cover every `tests/unit/chapters/sin-*`, den-of-woe-carry, the
  release-28 / Ixion / upgrade save fixtures, chapter-meta*, the FFX-2 ATB golden, the FF7 golden, the checkpoint /
  flow / restart suites, approved-hashes, the three board suites and evrae-telegraph.
- `orphans.mjs`: 24, none of them Sin.

**Other chapters, by the engine** (`tests/unit/tools/ffx-chapter-hashes.test.ts`, 6 seeds, Sin skipped, 408 keys):
- The branch against its merge base `c9c1c295` (my own run of both): **408/408 identical**.
- `origin/main` against main + chapter-sin (the `git merge-tree` result `02a4dc61`, conflicts only in docs and tests):
  **408/408 identical**.
- The tool is sensitive: base against main differs on 191 keys (main's own D-274 aeon HP).
- The FFX-2 ATB golden passes on the branch and on the merged tree.

**Other chapters, by the browser.** Chapter VIII (Evrae) staging was measured by `targeting().rects` at 8 menus by
Enter only, seed 5, at 1600x900 and 390x844. It is identical within 2 px on the merge-base build, the branch build and
the merged build.
- `sin-fins-core` stages identically on the branch and merged builds.
- Note, not a branch issue: the live page (the same bundle `C73AJ1Ds` as a local build of main) frames Evrae about
  217 px further right at 1600, with a different turn order and a styled PAUSE chip. The local 127.0.0.1 preview and
  the live site differ in some way that was not traced.

**The C3-1 carry fix, independently** (`tests/unit/zz-check4/c4-carry-invariant.test.ts`, untracked):
- Chapter XVII was played under a random policy biased to Tonics, Phoenix Downs and Potions (3 of each Tonic added to
  the bag), with both seams through `setupForNextLink`, 120 seeds.
- At every seam, every member's build and live ceiling must equal the base, or 2x the base while it carries
  `max-hp-x2` / `max-mp-x2`.
- **HEAD: 2,880 checks, 661 with a Tonic status, 0 violations.**
- 39 natural cases of a Tonic on at the end of link 1 and off at the end of link 2: 33 by a real KO, 6 while alive.
- **The same probe on `41c003fd` (before the fix): 20 violations.** For example, seed 116 Auron opens link 3 at
  12,984 / 200 with no status, against 6,492 / 100.

**Production build by real keys** (`vite build` of the branch, `vite preview` on 8640, headless GPU Chromium):
- **The builder's `ffx-sin.spec.ts`**, re-run from a scratch copy so no tracked frame was overwritten: **4/4** in
  5.4 min.
- **My own tour** (`e2e-sin/c4-tour.mjs`), at 1600x900 and at 390x844, keys only from the title. The board has 18
  cards and reads "0 of 17", and XVII and XVIII come after XVI. From each card: prep, the scene skipped (XVII) or
  pressed through (XVIII), then the first command by Enter.
- **XVII:** 38 menus by keys (30 at 1600, 8 at 390). At every open menu the Fin plate's range matched
  `airship.range`.
- The debug `intended` line then watched links I to III. Each Fin appeared at FAR, NEAR, NEAR-charged and
  FAR-charged. In link III, Genais showed in and out of its shell and the Core at inactive, charging and ready.
- Every Sin painting, sidecar, plate, pause plate and chip answered **200**. There were no responses of 400 or above,
  no console errors and no page errors in any run.
- The run fell in link III ("FELL"). RETRY by Enter went back to the Left Fin at 65,000 HP, at FAR, with no Right Fin,
  and the HUD was back.
- **XVIII, lost by keys alone** (28 player turns at each size, seed 1). The clock read 13 at the first menu. Every one
  of the 28 open menus showed `.ffx-sinclock__num` equal to `sin.turnsLeft` (13 down to 1), and the mouth went
  through stages 0 to 4 (all five `stage-<n>` paintings answered 200).
- Giga-Graviton's loss came at turn 42, and RETRY by Enter went back to 13 turns with the mouth shut.
- **The countdown and fin HUD elsewhere:** no `.ffx-sinhud`, `.ffx-sinclock` or `.ffx-sinfin` element, visible or not,
  in Evrae (VIII), Seymour Flux, Yojimbo or LeBlanc (FFX-2 VI).
- **Old saves:**
  - The release-28 fixture (`tests/fixtures/saves/release-28-main.json`) and a save I made myself on a local build of
    main at release 29 (bundle `C73AJ1Ds`), with Seymour Flux and Evrae cleared by keys.
  - Each was loaded into a fresh profile on the branch build and on the merged build.
  - Progress kept. The r28 save shows 3 cleared, "3 of 17" on the branch and "3 of 18" merged. The r29 save shows 2
    cleared. The Sin chapters are unplayed.
  - The stored save is byte-for-byte unchanged after loading (0 differences).
- **verify-approved:**
  - Main: 0 mismatched, 0 missing.
  - Each merged tree's `approved-hashes.json` against the installed art: 0 / 0. That is 276 files with the Sin set
    and 258 with the Songstress set.

### Findings

1. **Major (a new feature, desktop fine; FFX Sin only): on the phone (390x844) the Fin is out of frame at NEAR.**
   - At NEAR the Left Fin's projected rect is x 254 to 670 in a 390 px frame. The painted arm is on its right side, so
     the screen shows sky and at most a claw tip at the top right. The Right Fin at NEAR shows as a sliver at the right
     edge.
   - The tip meanwhile reads "Attack → Left Fin". Frames: `check4/stage-merged/stage-390x844-stage-sin-fins-core-3.jpg`
     and `check4/tour/xvii-390x844-04-L1-near.jpg`.
   - NEAR is most of links I and II. The handoff disclosed only the FAR body at 390 (FAR does read, about 94 % in
     frame).
   - Not graded a blocker: the painting is the right one and it loads, and the plate, the chip and the tip name the
     foe. But on a phone the foe is not on screen. A per-range phone framing of the Fin is owed before Bailey judges it.
2. **Minor (UX): the Orders row can open onto two disabled rows.** At FAR with "Close in" already ordered, Tidus's
   ORDERS opens "Pull back: Already far" (lit) and "Close in: Ordered". Enter does nothing there; Escape backs out
   (tested, no soft-lock). It is shared airship plumbing, so it may affect Evrae as well; Evrae was not checked.
3. **Minor (a reporting error, harmless after the merge): verify-approved in the worktrees.**
   - `ROOT=D:/pyrefly-ch-sin` (and `D:/pyrefly-aeon-hp`) now reports **2 mismatched**: `pause/ch4-ffx2-bahamut.png`
     and `.2x.webp`.
   - Main restored that plate at 23:48 on 09-28 (`f3e9fa61`), which neither branch has. Both install notes said
     0 / 0 for the worktree. Main's hash wins in both merges (0 / 0 above).
4. **Minor (the merge; known as handoff item 2).**
   - `git merge-tree origin/main chapter-sin` conflicts in 7 files: `docs/CONTRACT-CHANGES.md`,
     `docs/target/decisions.json` (the D-274 line, and D-279 to D-281 plus this branch's D-282),
     `tests/e2e/ffx2-ixion.spec.ts`, `tests/unit/chapter-select-c.test.ts`, `frontend-chapter-grid.test.ts`,
     `frontend-chapter-select-screen.test.ts` and `save-ixion-listed-fixture.test.ts`.
   - `songstress-0929` merges into main cleanly. Once it is in, chapter-sin also conflicts in
     `docs/target/approved-hashes.json` (both append a set) and `decisions.json` (D-281).
   - On the merged tree, `save-sin-listed-fixture.test.ts` fails with `[3, 18]` against `[3, 17]`: Chapter VII is
     playable on main, so the board reads "N of 18". `ffx-sin.spec.ts`'s `[0, 17]` and "1 of 17" need the same
     change. The other 24 Sin and board files pass on the merged tree.
5. **Minor (confirmed, already disclosed): on the phone in XVIII the countdown panel sits across the stage and hides
   the party** (`check4/tour/xviii-390x844-k13-left9-mouth1.jpg`).
6. **Minor (rule 7): the new `tests/unit/chapters/sin-fins-engine.test.ts` has 483 lines.** The source files over 400
   lines that the branch touches (types.ts, engine.ts, setup.ts, simulate.ts, FFXBattleHud.ts) are no longer than at
   the merge base.

Note, not a defect: under autoplay at fast speed the Fin plate can trail the engine's flags by one presentation step,
for example charged in the engine but the plate still reading "NEAR" while the dialogue plays. At every open menu, 94
checks across both chapters and both sizes, the plate and the clock matched the engine. The "13 while the flag says
12" frame in the art-install notes is the same effect.

## r30 fix (2026-09-29, CHECK 4 findings C4-1, C4-5, C4-2 and the HUD lag; FFX only)

Branch `chapter-sin`, after merging `origin/main` (8dce5e75: Chapter VII unlocked, PR-0236, D-274) as `d4d8f830`.
The 7 known conflicts were resolved keeping both sides: the board counts are 18 tiles and 18 playable chapters,
`decisions.json` keeps every entry (D-274 delivery from main, D-279's longer note from this branch, D-282), and
CONTRACT-CHANGES keeps both entries. `ffx-sin.spec.ts` and `save-sin-listed-fixture.test.ts` now expect `[0, 18]`
and "1 of 18". Proof ran on a production build (`vite build`, `vite preview` on 8700, headless GPU Chromium), by
real keys, plus a tap on the phone. Frames are in `docs/screenshots/sin/r30-fix/`.

- **C4-1, the Fins on the phone.** While a Fin is bound on an upright phone, the range director dollies and pans
  that range's rigs and stands the Fin at its phone spot (`PhoneStaging` in `scenes/evrae-airship-subjects.ts`).
  The approach is Chapter XI's option A ("the phone camera pulls back per link"), plus a pan, so the slice the
  framing picks is the render's right edge. That keeps each painting's cut edge past the render, and the Right
  Fin's NEAR top edge under the Fin plate.
  - NEAR: dolly 1.3 and pan -4.6. The Left Fin stands at [3.2, -1.4, -4.7], 5.4 tall; the Right Fin at
    [2.3, -1.8, -4.7], 5.8 tall.
  - FAR: the Left Fin stands at [1.4, -3.3, -30]; the Right Fin at [7.34, -0.7, -30] with pan -3.58.
  - The values were solved by measuring projected boxes and the phone slide in the running build. At 390x844 the
    arm, the claw and the core are on screen at FAR, NEAR and NEAR-charged for both Fins, and the party is whole.
  - The desktop and Evrae are untouched. Chapter VIII, measured by Enter only (seed 5, 8 menus, the CHECK 4
    method), is within 1 px of the CHECK 4 merged build at both sizes.
- **C4-5, the XVIII clock on the phone.** In the running build the jaw and the party's heads are 10 to 60 px
  apart, so package M's slab at top 250 could only sit on the party.
  - The slab now sits 6 px above the party chips (`bottom: calc(var(--phud-chips) + 68px)`).
  - The Gaze pill sits at top 100, right-aligned, under the enemy-move line.
  - The link-4 phone rigs keep the party's feet above the slab (`SIN_FACE_PHONE`: FAR aimed 0.5 lower, NEAR
    dolly 1.3).
  - Measured by keys over 26 menus at each size: 0 px² of slab or pill over the party. The desktop is unchanged.
  - This departs from the frame's top 250. The reason is recorded in the CSS and in `SIN_FACE_PHONE`.
- **The HUD lag ("13" while `sin.turnsLeft` said 12; the Left Fin plate said only "NEAR").**
  - `withSinHud` now re-reads the live state's flags on every `onEvent`, so the ring and the plate change as the
    turn that changes them starts to play.
  - A piece is never removed mid-burst.
  - A 40 ms in-page sampler over all six tours found 0 ms of mismatch, for the clock and for the plate.
  - Both Fins' NEAR-charged plates read "Core charged · Gravija …" (the same `sinFinPlateView` rule).
- **C4-2, the Orders submenu after PR-0236.** Checked two ways:
  - By keys at 1600x900 (the orders tour), Tidus's folded Orders row is greyed and skipped whenever an order
    stands: at FAR with Close in (turns 14 and 25), and at NEAR with Pull back (turn 42). The frame is
    `1600x900-xvii-orders-greyed-far.jpg`.
  - By the engine, `sin-orders-folded.test.ts` found 638 standing-order menus across both Fins and 12 seeds, and
    every one was greyed with "Ordered".
- **Gates.**
  - `tsc` (both configs) is clean.
  - 122 targeted test files pass (the chapters, the board, the fixtures, PR-0236).
  - The FFX golden hashes for the other chapters are 408/408 identical to CHECK 4's main and merged runs.
  - The full suite has 2 failures, neither in the Sin chapters:
    - `ui-portrait-face-crop`: songstress heads. It fails the same way on main 8dce5e75, because the art is
      installed locally.
    - `strategy-ffx2-bahamut`: it passed 19/19 when run alone.
- **Open.**
  - The Right Fin's NEAR top edge relies on the Fin plate to cover it. A moment that hides the HUD at NEAR on
    the phone would show that edge.
  - The Gaze pill sits right, not left as in the frame.
  - Both placements are the driver's to confirm with Bailey.

## CHECK 5 (independent, 2026-09-29 ~11:15 to 12:05 EDT; did not build any of it)

Checked `chapter-sin` at `ab52f268` (D:/pyrefly-ch-sin; merge `d4d8f830` of origin/main `8dce5e75`). Game case: **FFX only**
for the Sin fixes. Build: `vite build` to `D:/Tools/pyrefly-scratch/overnight-0929/check5/dist`, `vite preview` on 8710
(stopped by PID), headless GPU Chromium, real keys (a tap on the phone in the r30 tour). Frames and JSON are in
`D:/Tools/pyrefly-scratch/overnight-0929/check5/` (not committed).

**Verdict: no blockers; C4-1, C4-5, C4-2 and the HUD lag are fixed as stated.** One new minor finding.

- **Gates.** `tsc --noEmit` and `tsc -p tsconfig.e2e.json` clean apart from untracked `tests/unit/zz-*`. 118 test files
  pass (1,357 tests): every `tests/unit/chapters/*`, the three board suites, the Sin listed-save fixture, and the
  FFX chapter hashes. The merge contains origin/main 8dce5e75; the board reads 18 tiles, "0 of 18".
- **C4-1, both Fins on the phone (390x844).** By keys, Left Fin and Right Fin at FAR, NEAR and NEAR-charged (six
  frames, `tour/sheet390.jpg`): the arm, the claw and the core are on screen, the charged core shows, the party is
  whole, no painting edge is visible. The plate reads "CORE CHARGED · GRAVIJA NEXT" for both Fins.
- **C4-5, the XVIII clock.** 42 menus at each size: 0 px² overlap of the clock slab or the Gaze pill with any party
  sprite, the command grid, or each other. The ring number equals `sin.turnsLeft` at the three shot menus (13, 10, 7)
  and counts 13 down to 1 across the 39 menus at both sizes. On the phone the slab sits between the party's feet and
  the party chips; Sin's face is clear.
- **The HUD lag.** The 40 ms in-page sampler (about 4,000 to 8,800 samples per run, four XVII and two XVIII runs at both
  sizes) found 0 ms of clock mismatch and 0 ms of plate mismatch; charged states were seen.
- **C4-2.** Orders tours at both sizes (12 menus each with an Orders row): the folded row is greyed while an order
  stands, and pressing Enter on it opens nothing disabled (the cursor skips it). Of 10 opened submenus at each size,
  0 had two disabled rows.
- **Chapter VIII unchanged.** Enter-only stage measurement (seed 5, 8 menus, CHECK 4's method), against CHECK 4's merged
  build: same turns and ranges, largest difference 1 px at 1600x900 and 2 px at 390x844.
- **Console.** 0 responses of 400 or above, 0 console errors, 0 page errors in every run.

**New minor finding (phone, XVII, at NEAR and Right Fin FAR):** the Fin plate sits over the second line of the
enemy-move banner, so its wording ("motionless...", "MOST LIKELY 67%", the SCRIPTED chip) is cut off behind the plate
(`tour/sheet390.jpg`, frames 1, 2, 4, 5). The first line still reads. Not a blocker; the driver may raise it with Bailey
along with the two open placements above (the Right Fin's top edge under the plate, the Gaze pill on the right).
