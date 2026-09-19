# Critic round 02 — Pyrefly Reprise

**Build under review:** main `97b1e5637f0a068f0d12227104a957ad609fd473` (records the live deploy of
`5a82e71259f1967f59730e7a7805e52f4cabd165`; the two commits differ only by `critic/pending/5a82e71.json`).
**Bundle:** `assets/index-CF_L2xLd.js`, confirmed served from <https://baileypillon.github.io/pyrefly-reprise/>
by five independent auditors. `__pyrefly.version` 0.1.0, ready in 682–871 ms, 0 console errors,
0 responses ≥ 400 across chapters 1/4/5.
**Round date:** 2026-09-19. **Evidence:** `critic/rounds/round-02/`.
**Previous round:** none. `critic/rounds/` contained no report before this file, so there is no trend line
yet — round 03 will have one.

---

## Headline

| Part | Weighted total | Gate |
|---|---:|---|
| **A — fidelity and craft** | **5.6** | 9.6 |
| **B — game design coverage** | **3.5** | 9.6 |
| **C — fidelity to the approved end state** | **5.3** | 9.6 |
| **HEADLINE (lowest)** | **3.5** | **not met** |

Part C's coverage is also incomplete (30 of 44 tiles are still `verdict` or `gap`), which fails the gate
on its own regardless of the numbers.

**What stands between this build and 9.6, in one paragraph.** The game does not reliably finish. Chapter 4
reaches 0 HP on Bahamut and then sits on the battle screen for five minutes without ever reaching results;
Chapter 1 at `speed:'skip'` did not finish in 300 s either. Under that, three of the five systems the game
is *about* are inert in the shipped build: Wakka's Overdrive resolves to zero damage, Lulu's Fury gets a
0 ms window, and the Talk command that is the whole point of the Jecht fight submits an id the executor
does not handle. Every boss theme in the game is crossfaded out at the moment the boss fight begins, so the
21 cues that passed every technical check are never heard where they were written for. Nothing teaches a
new player anything. Seven combatants in Chapter 5 and eleven portrait subjects ship as procedural
silhouettes and letter tiles, and the two Yu Pagodas Bailey reported on 2026-09-18 are still 100 percent
invisible on this build. The battle HUD — the screen the player looks at for forty minutes — bears almost
no resemblance to the Ink & Gold mockup Bailey approved. Fixing the two Overdrives and the music routing
is a day's work and moves Part A and Part B by more than anything else on this list; the HUD and the
placeholders are the long pole.

---

## Part A — fidelity and craft: **5.62 → 5.6**

| Category | Weight | Score | Contribution |
|---|---:|---:|---:|
| Combat fidelity | 25 | 5.8 | 145.0 |
| Encounter fidelity | 15 | 7.4 | 111.0 |
| Fun and pacing | 15 | 6.4 | 96.0 |
| Character and visual fidelity | 15 | 4.3 | 64.5 |
| Scene fidelity and beauty | 10 | 6.2 | 62.0 |
| Writing and story | 10 | 5.2 | 52.0 |
| UI fidelity and polish | 5 | 3.4 | 17.0 |
| Stability and performance | 5 | 2.8 | 14.0 |
| **Total** | **100** | | **561.5 / 100 = 5.62** |

**Where the four unscored categories came from.** The category audits delivered to me covered combat,
encounter, fun and character/visual. Scene fidelity, writing, UI polish and stability are scored here by
the chief critic from the round's own artifacts, each justified below; they are not inherited numbers.

**Scene fidelity and beauty — 6.2.** The paintings are the best thing in the build. Dream's End in real
play (`critic/rounds/round-02/cast/shots/fresh-braskas-final-aeon.jpg`) is a genuinely beautiful 2026
painted 2.5D frame: red sky, floating rock, correct ground contact, bloom that belongs. Against that:
(a) Zanarkand Dome ships as an open-air flooded twilight colonnade with a lavender sky and a reflecting
floor — I looked at the plate myself, and every term its own negative prompt excluded ("water, reflection,
sky, sunset, pink sky, outdoors, flooded") is in the picture. It is not Yunalesca's sealed dark hall.
(b) CHK-011 fails in three of five chapters: both Yu Pagodas 100 percent occluded, Mortiorchis ~80 percent
behind Seymour, 1 of 3 Vegnagun Nodes visible. Composition is a scene responsibility. (c) In the actual
battle frame the HUD buries the diorama — in the Part C side-by-side at 1600×900 the build's own frame
contains no visible boss at all. Camera rigs exist and work (intro/reveal/action/victory captures); that
is real credit and is why this is 6.2 and not lower.

**Writing and story — 5.2.** The scripts on the page are strong. Chapter 1's post scene has Auron's "We
keep climbing." / "Yes.", Seymour's "You can't send what refuses to go.", the failed sending, and "Sin is
Jecht" staged with a three-second silence on Kimahri. That is canonical beat work in the right voices, and
no verbatim transcript lifting was found (the 5.0 cap is not triggered). It scores 5.2 because the player
never reads most of it: `results()` sits at `src/story/scripts/seymour-flux.ts:150` and the runner returns
there, so **0 of 28** post lines are reachable in Chapter 1, **0 of 20** in Chapter 2, **0 of 18** in
Chapter 3 and 18 of 29 in Chapter 5. Three chapters' entire emotional payoff is authored and undelivered.
On top of that, CHK-007 fails on shipped copy: the enemy-intent panel prints `[ffx-seymour-flux §4.6]` to
the player and the FFX-2 command menu prints `gunner` and `black-mage` as menu rows.

**UI fidelity and polish — 3.4.** Ink & Gold is applied consistently as a *look* (slab skew, gold rules,
type) and CHK-009 passes outright — nothing truncates at any of six viewports. Everything else fails: the
FFX battle HUD is not the approved layout, the target reticle is a 1.33 px hairline drawn under an opaque
panel and at 960×540 lands outside the window entirely, the strategy guide clips mid-sentence with no
affordance, enemy health is presented three different ways across three chapters and the actual boss's HP
is invisible in two of them, duplicate "Yu Pagoda" rows carry monogram tiles over loaded paintings, and
there is no phone layout at all.

**Stability and performance — 2.8.** Credit where due: the live site loads in under a second, logs zero
console errors, returns zero responses ≥ 400 during play, and save data survives a reload. Against that, a
chapter that is won and never ends (#1 below), a Yu Yevon battle that runs 25,364 turns without an outcome
in the pure engine, presenter freezes of 15–25 s in real keyboard play, and a battle scene that falls to
0.3–0.65 fps with no hardware WebGL while `Settings.lowEffects` is declared and read by nothing.

### Part A caps

| Cap | State | Why |
|---|---|---|
| **6.0** — a chapter cannot be finished | **TRIGGERED** (non-binding at 5.62) | Chapter 4: Bahamut at 0/8400, `screen()` stuck on `battle`, turn and log frozen for 300 s, results never reached — reproduced independently by two auditors (`live-timing.out`, `stall-ffx2-bahamut.json`). Chapter 1 at `speed:'skip'` also did not finish in 300 s. Caveat recorded honestly: both reproductions drove the debug auto-battler; a human-input reproduction of the post-victory hang was not obtained this round. The freeze is in the presenter, which is the same presenter a human plays through. |
| **8.0** — placeholder sprite / missing form / missing scene | **TRIGGERED** (non-binding) | Seven Chapter 5 combatants render `paintBossSilhouette` with the engine's own `placeholder:true` flag; both Yu Pagodas render as letter monograms in the CTB; the post-battle scenes of Chapters 1, 2 and 3 are effectively missing (0 lines reachable). |
| **5.0** — ripped asset / verbatim transcript | not triggered | No ripped retail asset found; no verbatim script transcript found. |

---

## Part B — game design coverage: **3.48 → 3.5**

| Category | Weight | Score | Contribution |
|---|---:|---:|---:|
| Audio and music | 15 | 3.5 | 52.5 |
| Game feel and feedback | 12 | 6.0 | 72.0 |
| Clarity and information design | 12 | 4.8 | 57.6 |
| Onboarding and teachability | 10 | 2.0 | 20.0 |
| Replayability, retention and sharing | 10 | 2.4 | 24.0 |
| Accessibility and options | 8 | 2.5 | 20.0 |
| Controls and platforms | 8 | 2.6 | 20.8 |
| Difficulty and balance | 8 | 3.5 | 28.0 |
| Progression, preparation and rewards | 7 | 4.0 | 28.0 |
| Narrative presentation and direction | 5 | 2.0 | 10.0 |
| Cohesion and identity | 5 | 3.0 | 15.0 |
| **Total** | **100** | | **347.9 / 100 = 3.48** |

Audio, game feel and clarity are the delivered auditors' numbers. The other eight are the chief critic's,
from this round's artifacts:

- **Onboarding 2.0** — no tutorial, glossary, how-to-play, controls reference or first-run teaching
  anywhere; a cold profile gets a title card, PRESS ENTER and a chapter select whose Chapter I chip reads
  "CTB" with nothing explaining it. The first-time-player pass was **not run** this round, which is itself
  a coverage gap in the critic's own procedure (rubric rule 6).
- **Replayability 2.4** — `BattleScreenFlow.ts:153` is `for(;;)`: there is no ending and no credits.
  `bestTurns` is written and has zero readers; `unlock()`/`isUnlocked()` have zero callers; results show
  no turn count and no previous best; `DIFFICULTY` is the string literal `'Faithful'`. The link previews
  as nothing: no `og:*`, no `twitter:*`, a 404 on `/favicon.ico`, no `public/404.html` so any deep link
  serves GitHub's own error page, and the `description` still says "HD-2D", the direction Bailey rejected.
- **Accessibility 2.5** — no control remapping of any kind; no text-scale option; element and status coding
  is colour-only; `lowEffects` and `reduceMotion` are excluded from the only options surface; and the
  OPTIONS panel prints saved percentages the audio buses are not using.
- **Controls and platforms 2.6** — keyboard is solid. Mouse targeting is dead (reticles at y = −53 in a
  540-tall window; clicking the reported reticle changed nothing in 18 s). The phone is a letterboxed
  390×220 band with 2.33 px text and 19×4 px buttons. Chromium and WebKit both boot the live site
  (393 ms / 986 ms); **Firefox could not be launched on this machine, so Firefox is unverified, not failed**.
- **Difficulty 3.5** — real credit: 10/10 victories with the shipped intended line across two seeds and
  20/20 defeats with naive tactics, which is exactly the rubric's "winnable with the intended tactics,
  losable if you ignore them". Against it: Charon wins Chapter 4 15/15 in 13 turns against the intended
  line's 77 because `destroys-user` is never read in the FFX-2 path; Yu Yevon cannot be lost *or* won once
  the single Candle of Life is gone; Seymour's phase 2 is a stretch of free turns.
- **Progression 4.0** — FFX prep genuinely gives agency (six tabs, Sphere Grid, equipment, Overdrive
  modes) and the FFX-2 dressphere panel has real depth (LV 23, LEARNED 7/16, AP banked, Garment Grid).
  Against it: FFX-2 prep has four tabs to FFX's six (CHK-020), the FFX ITEMS tab prints raw ids, 6 of 28
  rows are visible, and rewards mean nothing because nothing unlocks and results record nothing.
- **Narrative presentation 2.0** — see #4 and #5 on the ranked list: the post scenes do not play, and the
  scenes that do play discard every camera move, actor, pose and VFX the script authored.
- **Cohesion 3.0** — the title screen and the pause dossier are authored and beautiful; against them,
  Paine and eleven enemy subjects ship as letters in boxes, four contradictory Seymour designs ship in one
  chapter, the boot screen is the word "Loading" and the fatal screen is unstyled inline HTML.

### Part B caps

| Cap | State | Why |
|---|---|---|
| **8.0** — a panel gives the player wrong information | **TRIGGERED** (non-binding at 3.48) | Three proofs on bundle CF_L2xLd: Chapter 3's CTB advertises two "Yu Pagoda" combatants that are not on the field; the FFX-2 command menu prints `gunner` / `black-mage` as rows; the enemy-intent panel prints research citations. Also the OPTIONS panel printing volumes the audio engine is not using. |
| **Audio ≤ 6.0** — no owner score on record | **TRIGGERED** | `docs/target/targets.json` leaves the audio tile at `verdict`; `docs/handoff/NOW.md:36` still reads "Bailey judges by ear". |
| **Audio ≤ 5.0** — audio the owner rejected | **TRIGGERED** | The only owner verdict on record is the 2026-09-18 rejection quoted at `docs/audio/PIPELINE.md:14-15`. The cues were re-rendered; no higher owner score has been collected, so the cap has not lifted. Both caps are non-binding at 3.5. |

---

## Part C — fidelity to the approved end state: **5.30**

Scored over the scored weights only (45 of 100).

| Category (board group) | Weight | Score | Scored? |
|---|---:|---:|---|
| Presentation | 30 | 3.2 | yes |
| Scenes | 15 | 9.5 | yes |
| Cast, bosses and aeons | 15 | — | no approved tile |
| How a fight plays | 15 | — | no approved tile |
| Music and sound | 10 | — | no approved tile |
| Pause screen | 5 | — | no approved tile |
| Phone layout | 5 | — | no approved tile |
| Whole game and polish | 5 | — | no approved tile |
| **Total** | **45 scored** | | **238.5 / 45 = 5.30** |

**Caps:** the 5.0 cap (shipping a rejected option, or an approved painting replaced) is **not** triggered —
`public/art/backdrops/zanarkand-dome.png` hashes `f48c5b05…` both on disk and as served live, byte-identical
to the tile's recorded hash. The 8.0 cap (a player-facing feature started after 2026-09-18 with no approved
target) could not be established this round and is non-binding at 5.30 in any case.

**An honest tension Bailey should see.** Scenes scores 9.5 because the Zanarkand painting ships exactly as
approved. Part A scores it down because it is not the FFX location. Both are correct: the build is faithful
to the approval and the approval is not faithful to the game. Under CHK-013 an agent never re-judges or
regenerates approved work, so **this one needs Bailey's word, not a fix ticket.**

### Coverage: 12 approved / 23 awaiting a verdict / 7 with no target / 2 rejected

The gate cannot be met while any tile is `verdict` or `gap`. All 30 are listed.

**Waiting on the owner — needs your verdict (23)**

- Scenes: Ch. 1 Mt. Gagazet; Ch. 3 Dream's End; Ch. 4 Bevelle Underground; Ch. 5 Farplane
- Cast: FFX party portraits; Tidus battle poses; Yuna battle poses; Auron battle poses; Seymour Flux;
  Yunalesca first form; Braska's Final Aeon; Shiva; Yuna Gunner (FFX-2); Shuyin
- Pause: rebuilt pause 2000×1012; panels hidden (H); party panel; hero plate ch. 1; hero plate ch. 4;
  all hero plates
- Audio: score and sound effects (21 cues + 134 SFX) — no agent can hear; this one is only yours
- Phone: pause on a phone
- Whole game: concept key art

**Waiting on the owner — no target exists yet (7)**

- How a fight plays: targeting; move advisor card; defeat screen; enemy next-move panel
- Phone: every screen except pause at 390×844
- Polish: the 22 ideas in five themes
- Whole game: one finished minute of play

---

## Ranked issue list

438 issues were raised across the category, Part B and Part C audits. This is the merged, de-duplicated
ranked list, most damaging to the headline first. "Costs" names the weighted damage.

### Corrections made to the delivered audits

- **`npm run build` and `npx vitest run` failing is NOT a defect of this build.** The `TS6133 'lean' is
  declared but its value is never read` in `src/audio/tracks/boss-yunalesca.ts` and the single failing test
  (`tests/unit/audio-ffx-bosses.test.ts:366`) both come from **uncommitted working-tree edits** by another
  session, verified with `git diff HEAD` (136 changed lines in that file; `lean` is used at line 263 of the
  committed version). The deployed commit builds — the deploy produced the live bundle and 521 art files.
  Reported below as a process note, not as a defect. Whoever owns that edit must not commit it as-is.
- **"Zanarkand Dome is the wrong place" is downgraded from blocker to major** — the plate is hash-identical
  to an approved tile, so it is Bailey's call, not a build defect.
- **Wakka's reels and Lulu's Fury were independently re-confirmed** by the confirmation pass, including the
  extra finding that Lulu's only Overdrive row is the `fury` menu marker, which the executor refuses
  outright — so the player either cannot fire Fury at all or fires it into a 0 ms dial. That is worse than
  first reported and the ranking reflects it.

### Blockers

**1. Chapter 4 is won and then never ends.** `difficulty` · costs the **Part A 6.0 cap**, Stability (5),
Difficulty (8).
*Repro:* live site 1600×900, `await window.__pyrefly.waitReady(); window.__pyrefly.gotoChapter('ffx2-bahamut', {skipCutscenes:true, auto:'intended', speed:'skip', skipResults:true})`, poll `screen()` and `battleState()` every 15 s. t+76 s: turn 75, logLen 1982, bahamut 0/8400. t+92 s through t+303 s: all three values frozen, `screen()` still `battle`. Never reaches `results`. Reproduced in `critic/rounds/round-02/live-timing.out` and `stall-ffx2-bahamut.json`. Chapter 1 at the same speed also did not finish in 300 s (frozen at turn 14 for 120 s).
*Where:* `src/app/screens/BattleScreenFlow.ts` (victory path) / `src/engine/BattlePresenter.ts` playback loop. The pure engine finishes this chapter 60/60, so the defect is in the presenter.
*Fix:* find why the playback loop stops draining events after the killing blow; add a presenter watchdog that force-resolves when the engine reports battle-over and no beat has played for N seconds; add `tests/e2e/chapter-clear.spec.ts` that plays all five chapters to results on the production bundle and **fails on timeout rather than falling through** (CHK-016's shape, in the game instead of the harness).

**2. Every boss fight is scored with the generic `battle-ffx`; the boss theme is crossfaded out at the
moment the fight starts.** `audio` · costs Audio (15 — the single heaviest Part B row), Cohesion (5).
*Repro:* live site, click once, Enter to chapter select, Enter on Chapter 1, advance the pre-scene to the end. `audioDebug().playing` walks chapter-select → boss-dread → scene-gagazet → **boss-seymour**, and the instant the battle screen appears it becomes `battle-ffx`. Same in all five chapters.
*Where:* `src/app/screens/BattleScreen.ts:211` (`void audio.playMusic(chapter.music.battle, { fade: 1.2 })`) — I verified this line; `src/data/encounters.ts:121,149,177,214,241` all set `battle: 'battle-ffx'`. The correct cue is already declared and ignored at `src/data/ffx/enemies/seymour-flux.ts:217`, `yunalesca.ts:157`, `braskas-final-aeon.ts:247`, `ffx2/enemies/bahamut.ts:114`, `vegnagun-tail.ts:63`. The only reader of `musicCues` is `BattleScreen.ts:303`, and it reads the **next** chained group, so `boss-seymour`, `boss-yunalesca` and `boss-ffx2-aeon` never score a single turn of combat anywhere in the game, and Chapter 4 (FFX-2) is scored with the FFX battle theme.
*Fix:* at battle start resolve the cue the way the chain link does — `const cue = this.group?.musicCues?.find(c => c.at === 'start'); void audio.playMusic(cue?.track ?? chapter.music.battle, { fade: cue?.fadeMs ?? 1200 })` — and set each chapter's `music.battle` to its own cue so the fallback is right too. Give the single-formation encounters their phase cues through `midScripts`. Add a test asserting the cue playing 2 s into each chapter's first turn is that chapter's boss cue. Separately: `pause` is never played at all (live: `screen=pause, playing=battle-ffx`), it is parked in `KNOWN_UNWIRED`.

**3. Nothing in the game teaches anything.** `onboarding` · costs Onboarding (10).
*Repro:* live URL, cold profile. Walk title → chapter select → prep → Chapter 1 pressing Escape, P, O, Tab, F1, H. Nothing explains CTB, the Overdrive gauge, summoning, dresspheres or the Garment Grid, and no command explains itself before you commit. A repo-wide search finds no tutorial, help, how-to-play or glossary surface.
*Where:* `src/app/screens/` (no help screen registered), `src/ui/common/registerFlowScreens.ts`.
*Fix:* two opt-out layers — a HOW TO PLAY entry on the title and in pause (one page per system, a still and three sentences), and first-encounter teaching cards fired once per system per save behind a `seenTutorials` set in `SaveData`.

**4. Every post-battle scene in Chapters 1, 2 and 3 plays zero lines; Chapter 5 loses its coda.**
`narrative` · costs Writing (10), Narrative presentation (5).
*Repro:* live site, Chapter 1, play the fight to victory. The screen cuts to the Gagazet backdrop, holds ~2 s with no dialogue box, and wipes to Results. Identical in 2 and 3. Chapter 5 plays 18 lines and stops before the Lenne/Shuyin coda. Chapter 4 is the only one whose post scene plays in full.
*Where:* verified by me — `src/story/runner/CutsceneRunner.ts:320` returns `{type:'results'}` and the run ends there; `src/ui/common/registerFlowScreens.ts:44-49` wires no resume; `src/app/screens/BattleScreenFlow.ts:260-272` awaits `screen.done` and never re-enters. Marker positions: `seymour-flux.ts:150` (28 lines after), `yunalesca.ts` post line 5 (20 after), `braskas-final-aeon.ts` post line 6 (18 after), `ffx2-vegnagun-shuyin.ts` post line 43 (11 after).
*Fix:* give `CutsceneScreenOptions` a `resumeFrom` index, expose the stopped index on `CutsceneRunResult`, and in `runChapter` do post → results → post-from-index. Add a unit test asserting the `say`/`narrate` steps *reached* by a full run equals the number in the script, per chapter.

**5. Wakka's Overdrive deals zero damage: the reel wrapper never resolves into a shot.** `combat` · costs
Combat fidelity (25).
*Repro:* any FFX chapter. Fill Wakka's gauge, fire Slots, stop three matching reels. Confirmed twice on the real Chapter-1 board, taking the row exactly as the engine's own command list offers it (`{kind:'overdrive', id:'element-reels', targets:[]}`): `types=[action-start, overdrive-gauge, action-end]`, `damage=[]`, bossHP 70000→70000, gauge 100→0. Identical on the `autoResolveMinigames` path.
*Where:* `src/battle/ffx/execute.ts:89-98` (`shapeOverdrive`'s wakka-reels branch returns `{...def, targeting, hits}` and never reads `def.extra.resolvesToShots` / `reelSymbols` / `noMatchFallback`) against `src/data/ffx/abilities/overdrive-wakka-1.ts:56-73` (`formula:'none'`, `power:0`, `hits:0`). Those three keys appear nowhere under `src/battle` or `src/engine`. Same class applies to `attack-reels`, `status-reels`, `aurochs-reels` and Rikku's Lady Luck reels.
*Fix:* resolve the wrapper to a shot before returning — map stopped symbols through `reelSymbols` → `resolvesToShots` (three of a kind → the matching shot at `all-enemies`, two → `random-enemy`, else `noMatchFallback`), returning that shot's def with the wrapper's timing bonus. Unit-test a non-zero `damage` event for each reel set and the no-match case.

**6. Lulu's Fury cannot be used: the engine refuses the menu marker, and the dial it would open gets
`timerMs` 0.** `combat` · costs Combat fidelity (25).
*Repro:* Lulu is in all three FFX builds with gauge 45 and `unlockedOverdriveIds ['fury']`. Her only Overdrive row is the **menu marker** `fury`; submitted as offered, `src/battle/ffx/execute.ts:232-240` refuses it with "Fury is a menu marker, not an action". If the HUD expands the marker instead, `minigameParams` returns `timerMs: 0` for every fury record, the shipped `openLuluFury` settles in 431 ms with `{sweptDegrees:0, casts:0}`, and feeding that back gives `damage=[]`, bossHP unchanged, gauge spent. Control with a genuine sweep (2880°) on the same board: `damage=[398,305,287,284]`.
*Where:* `src/battle/ffx/overdrive.ts:226-238` (`timerMsFor` has no `lulu-fury` case, falls through to `return 0`) and `:243`; `src/ui/ffx/minigames/LuluFury.ts:27` (`num(params['timerMs'], 4000)` accepts 0 as finite); `src/ui/ffx/minigames/OverdriveOverlay.ts:88-105` (`startTimer(0)` expires on its first step). `timerMsFor` also returns 0 for `kimahri-rage` and `rikku-mix` — same hazard, latent.
*Fix:* add `case 'lulu-fury': return 4000;`, make every overlay timer reader require `v > 0`, and fix the command list so the marker expands into per-spell rows. Unit-test that `timerMsFor` is > 0 for every AbilityDef whose `minigame` is a timed kind, and that every row the menu offers, submitted verbatim, produces a state change or an explicit refusal.

**7. Seven Chapter 5 combatants render the procedural placeholder silhouette.** `character-visual` · triggers
the **Part A 8.0 cap** · costs Character and visual fidelity (15).
*Repro:* live site, `gotoChapter('ffx2-vegnagun-shuyin', {skipCutscenes:true, skipPrep:true, skipResults:true, auto:'intended', speed:'skip'})`, poll `__pyrefly.battle().stage.snapshot()`. t+99 s: node-a/b/c report `art:'vegnagun-node', placeholder:true`; t+171 s bulwark-r/l; t+312 s redoubt-r/l. `cast/placeholder-nodes.png` shows a featureless black blob with one teal dot where a Node should be.
*Where:* `src/data/ffx2/enemies/vegnagun-leg.ts:32,127`, `vegnagun-body.ts:31,134`, `vegnagun-head.ts:48`; no folder under `public/art/characters` and no manifest entry for any of the three. Fallback at `src/engine/BattlePresenterStage.ts:133-137`.
*Fix:* paint idle + hurt + ko for the three add types and register them. Until then make the placeholder loud: `tools/gen/manifest.mjs --check` fails the build when any `spriteKey` referenced from `src/data` has no manifest subject, wired into `prebuild`.

**8. Both Yu Pagodas are 100 percent hidden behind Braska's Final Aeon — the defect Bailey reported on
2026-09-18, unchanged.** `character-visual` / `scene` / `clarity` · triggers the **8.0 cap** via the CTB
monogram tiles · costs Character (15), Scene (10), Clarity (12).
*Repro:* live site, fresh page, `gotoChapter('braskas-final-aeon', {skipCutscenes:true, skipPrep:true, skipResults:true})`, wait 9 s, screenshot at 1600×900. `stage.snapshot()` lists `yu-pagoda-left` and `yu-pagoda-right` as staged with `placeholder:false`; **I read the frame myself** (`cast/shots/fresh-braskas-final-aeon.jpg`) — there is no pagoda anywhere in it. Meanwhile the CTB lists "Yu Pagoda" twice with `Y/C` and `Y/B` letter monograms drawn over the loaded painting.
*Where:* `src/scenes/dreams-end.ts:203-207` — the slot table's own comments prove it: the boss spans x 0.491–0.779 and both pagoda slots (x 0.674–0.755, x 0.482–0.567) sit inside that span and further from camera.
*Fix:* move enemy slots 1 and 2 outside the boss's projected x band (e.g. x −1.6 and x 5.6 at z −5.5, slot 1 raised to y 2.2), and add `tests/e2e/enemy-visibility.spec.ts` with CHK-011's id-buffer coverage assertion and the 25 percent rule so no future formation can regress it.

**9. The FFX battle HUD does not resemble its approved mockup.** `Part C presentation` · costs Part C
Presentation (30), UI polish (5), Clarity (12).
*Repro:* reach the Chapter 1 battle and watch any turn resolve. I read the side-by-side myself
(`part-c/battle-hud-ffx-1600x900-pair.jpg`): the target is a clean command list, one large gold damage
number and a CTB portrait rail; the build is a full strategy-guide text panel on the left, an enemy HP box,
a stacked enemy-intent slab with red DAMAGE / STATUS chips and research citations on the right, a CTB rail
with duplicate entries — **and no boss visible anywhere in the frame**. No command menu was observed to
open across two real playthrough attempts.
*Fix:* make guide / advisor / intent secondary hideable panels (CHK-002, CHK-003 already ask for this) so
the primary HUD matches the approval; add an e2e case that opens a real command menu with real keypresses
and screenshots it against the mockup.

**10. The approved battle-start boss-name banner never appears.** `Part C presentation` · costs Part C
Presentation (30), Game feel (12).
*Repro:* `setSeed(1); gotoChapter('seymour-flux', {skipCutscenes:true, skipPrep:true})` and watch the transition. Polling the DOM every ~120 ms for 15 s across the whole transition: the string "BATTLE START" **never** appears at any sample, and no battle-start / boss-card / namecard element ever exists. The game cuts straight from cutscene into the plain establishing shot.
*Where:* `part-c/battle-start-1600x900-pair.jpg` against `docs/screenshots/mockups/A-battle-start.jpg`.
*Fix:* build the Ink & Gold battle-start banner from `docs/handoff/presentation-ink-and-gold.md` as a beat between cutscene-end and the first battle frame, reusing the cream-card system already built for dialogue.

**11. Charon is a free, repeatable, defence-ignoring nuke: the FFX-2 engine never implements
`destroys-user`.** `difficulty` · costs Difficulty (8), Combat fidelity (25).
*Repro:* Chapter 4, pure engine, pick `x2-dark-knight-charon` whenever offered and otherwise Attack: 15/15 wins over seeds 1–15, average 13.2 turns against the intended line's 77. Trace: Rikku casts it three times with her HP unchanged each time (1739→1739, 1087→1087, 705→705), `alive:true`, `removed:false`, Bahamut 8400 → 4593 → 1016. A blind one-note scan of all 28 rows the chapter offers found it the only winner (27 of 28 rows: zero wins).
*Where:* `src/battle/ffx/abilities.ts:348` is the only place in the repo that reads the flag; `src/battle/ffx2/resolve.ts` and `execute.ts` never do. Declared with `flags:['destroys-user'], mpCost:0, formula:'user-max-hp', power:20` at `src/data/ffx2/abilities/dark-knight.ts:72-88`.
*Fix:* honour `destroys-user` in the FFX-2 path (KO the caster, not eject — X-2 has no eject). Add `tests/unit/ffx2-ability-flags.test.ts` asserting every flag declared in `src/data/ffx2` is read somewhere in `src/battle/ffx2`, so no data flag can ship inert. Re-bench afterwards against the 77-turn target.

**12. The Talk command does nothing — Jecht's Overdrive gauge can never be zeroed by a player.**
`encounter` · costs Encounter fidelity (15), Clarity (12).
*Repro:* pure engine, Chapter 3, `dreamsEndBuild`, seed 1. Take the row labelled "Talk" exactly as offered (`{kind:'ability', id:'talk', targets:[]}`). Events: `['action-start:Talk','action-end']` and nothing else; `bfa.gauge`, `bfa.talkUsed`, `bfa.talkPending` all unchanged. Meanwhile the live guide says "Talk has two charges — spend both in form 2" and the intent panel says "Talk zeroes that gauge and costs him his next turn — 2 charges left".
*Where:* `src/battle/ffx/commands.ts` never emits a `trigger` kind; `src/battle/ffx/execute.ts:199-213` only zeroes the gauge under `case 'trigger'`; `src/engine/tactics/braskas-final-aeon.ts:676-688` documents the mismatch in a comment and re-shapes the command so the auto-battler works — a human cannot.
*Fix:* emit the row as `{kind:'trigger', id:'talk'}` and delete the tactics workaround. Add `tests/unit/trigger-commands.test.ts`: for every chapter, every row the menu offers, submitted verbatim, must produce at least one state change or an explicit refusal.

**13. Target selection is effectively invisible, and at common window shapes the reticle leaves the
window entirely.** `fun` / `controls` · costs Fun (15), Controls (8), Clarity (12). *(Two reports merged.)*
*Repro A:* live Chapter 1 at 1000×562, open the target picker and press ArrowRight. The harness reports the active reticle as `{x:563,y:40,w:64,h:64,name:'Mortiorchis'}` and there is no gold bracket visible in the frame — four 1.33 px hairlines and a 10.67 px name tag, behind an opaque panel. *Repro B:* at 960×540 the reticle centres measure `seymour-flux (952, −53)` and `mortiorchis (812, −7)`; clicking the reported reticle resolved nothing in 18 s. At 1600×900 both land inside the intent slab.
*Where:* `src/ui/ffx/TargetCursor.ts:15` (fixed `RETICLE_SIZE = 64` regardless of the subject's painted size) and `:131-150` / `:143` (inline left/top from the projector, no clamp); anchor defaults to `'head'` at `src/engine/BattlePresenterStage.ts:184-197`; `src/ui/inkgold/slabs.css:183-187,203`; `src/ui/ffx2/ffx2-hud.css:673-679`.
*Fix:* size the bracket to the target's projected quad, clamp the box into the visible stage rect (and flip the nameplate to whichever side has room), anchor on `'chest'` for enemies taller than the frame, raise the reticle above the intent slab, add a ground ring and rim pulse, and floor the name at 14 css px after the letterbox scale. Add `tests/e2e/targeting.spec.ts` (CHK-010 records that it does not exist) asserting at 960×540 / 1024×768 / 1600×900 / 2560×1080 that every `[data-target-id]` rect is fully inside the viewport and is the topmost element at its own centre.

**14. The enemy-intent slab is on by default and covers the boss, the second enemy and the target cursor.**
`fun` · costs Fun (15), Clarity (12), Scene (10).
*Repro:* live Chapter 1 at 1000×562, no auto, wait for the command menu, press Enter to open the target picker. The intent box occupies x 532–766, y 6–269; both reticles (617–681 × 32–96 and 563–627 × 40–104) are entirely inside it, and both Seymour Flux and Mortiorchis are invisible behind it. Press E once and the board is fully legible.
*Where:* `src/ui/ffx/FFXBattleHud.ts:841-870` (`intentAvoidRects` lists only HUD panels and has never been measured against the painted actors — exactly CHK-008) and `src/ui/ffx2/FFX2BattleHud.ts:299`.
*Fix:* add every targetable enemy's projected quad and every live reticle to the avoid set; while a picker is open, move the slab clear of the enemy column or drop it to 25 percent opacity. A panel that is on by default must never be the thing hiding the encounter.

**15. On a phone every screen is a letterboxed 390×220 band with 2–3 px text and 19×4 px buttons.**
`controls` · costs Controls (8), Accessibility (8), Clarity (12).
*Repro:* fresh context, 390×844, `hasTouch`+`isMobile`, dsf 3, Pixel 5 UA. Title minimum effective font 3.25 px with 6 nodes under 14 px and the PRESS ENTER chip at 61×12; FFX HUD 86 nodes under 14 px, smallest 2.33 px, smallest tap target 96×14; party prep 64 nodes under 14 px with `prep:back` at 19×4. ~75 percent of the display is black bars.
*Where:* `src/app/screens/TitleScreen.ts:87-97` (`scale = Math.min(w/640, h/360)`) and the same LetterboxStage contract in chapter select, prep and the battle HUD.
*Fix:* give the stage a minimum scale (clamped so 1 logical px never renders below ~2.2 css px) and, below ~700 css px wide, switch the DOM screens to a portrait layout in rem/clamp() outside the letterbox transform — the treatment CHK-002 already demanded for the pause. Every interactive element gets a 44×44 css px minimum hit area via padding.

**16. Chapters are 2–4× the length of the fights they recreate, with no checkpoint and no speed control a
player can find.** `fun` · costs Fun (15), Replayability (10).
*Repro:* `npx vitest run tests/unit/strategy-chapter2.test.ts` → 336 / 408 / 414 / 452 player decisions across four seeds; Chapter 1 105–181; Chapter 4 226–266. At the presenter's own per-action hold (1.9–2.3 s, `BattlePresenterEvents.ts:41-63`, `BattleMoments.ts:45-69`) Chapter 2 is 40–60 minutes of unbroken play with no results screen between Yunalesca's three forms. A live full-chapter sweep of Chapter 1 at default speed with a perfect autopilot ran 6 min 20 s without reaching an outcome.
*Where:* the missing control is `src/app/screens/PauseScreenPanels.ts:206-221` (OPTIONS has no battle-speed row) and `src/app/screens/BattleScreen.ts:537-538` (fast-forward is hold-R1 only, and unprinted).
*Fix:* a persisted BATTLE SPEED row (1× / 2× / 4×) driving the presenter's `timeScale`, the fast-forward key printed in a battle ControlsHint, and a per-link checkpoint between Yunalesca's forms and Vegnagun's parts. `message: 850` alone is ~6 minutes across Chapter 2's log.

**17. Yu Yevon is an infinite battle with no exit.** `difficulty` · costs Difficulty (8), Stability (5).
*Repro:* pure engine on `ENEMY_GROUPS_BY_ID['yu-yevon']` with `dreamsEndBuild` minus its single Candle of Life, Defend on every decision: 40,000 steps, 25,364 turns, 14,636 commands, no battle-over. Reached from real play too — Chapter 3 with the intended line plus a 10 percent slip rate stalls 2 runs in 40 (seed 5: 59,901 turns, party pinned at 1 HP under permanent Auto-Life).
*Where:* `src/battle/ffx/ai/yu-yevon.ts` (Curaga counter + permanent Auto-Life) and `src/battle/ffx/engine.ts` — a grep for stalemate/maxTurns/turnLimit across `src/battle` returns nothing; the group also sets `canEscape:false`.
*Fix:* a stalemate guard in both engines (no HP change beyond X across N rounds ends the battle with a presentable outcome), and a way out of a lost cause that is not the pause menu.

**18. No control remapping exists anywhere.** `accessibility` · costs Accessibility (8), Controls (8).
*Repro:* pause → OPTIONS shows six rows (MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED, X-2 BATTLE, STRATEGY GUIDE) and no controls section.
*Where:* `src/app/Input.ts:38` (KEY_MAP) and `:72` (PAD_MAP) are module constants with no setter and no persistence; `src/app/screens/PauseScreenPanels.ts:206`.
*Fix:* move the maps into `Settings` as `bindings: Record<Button, string[]>`, add a CONTROLS panel that captures one raw keydown/padbutton per binding, refuses to leave `cancel` unbound, offers RESET TO DEFAULTS, and persists through SaveData.

**19. The battle scene runs at 0.4 fps under a software renderer and the setting that would rescue it is
dead code.** `accessibility` / `stability` · costs Accessibility (8), Stability (5), Game feel (12).
*Repro:* live URL in headless Chromium with the repo's own SwiftShader args at 1600×900, reach the Chapter 1 battle with real keys. rAF sampling: title 60.2 fps, cutscene 60.3 fps, **battle 0.4 fps sustained over 120 s**. `battleState().turn/.ticks/.log.length` stay 0 for two minutes; the only DOM text under `#ui` is "PAUSE". Reproduced four times. Because `App.maxDelta` is 1/20 s (`src/app/App.ts:67`), in-game time advances 50 ms per rendered frame, so the ~3.7 s battle-start moment never finishes and the player gets a still diorama for ever, with no spinner, no HUD and no error.
*Where:* `src/app/SaveData.ts:60,147` (`lowEffects` declared), `src/app/screens/PauseScreenPanels.ts:202` (explicitly excluded, with `reduceMotion`), no consumer anywhere in `src/`.
*Fix:* wire `lowEffects` to bloom/DoF/particles and the painted-actor filter chain, expose it as a GRAPHICS row, auto-offer it when rolling frame time stays above ~33 ms for two seconds, make the battle-start sequence time-driven rather than frame-driven, and give the battle a visible "preparing the encounter" state.

**20. Pre- and post-battle scenes discard every stage direction: no camera, no actors, no poses, no VFX.**
`narrative` · costs Narrative presentation (5), Scene (10), Writing (10).
*Repro:* Chapter 1 pre-scene. Kimahri's "Kimahri knows this one. And this one." — a man naming his dead — is delivered over an empty snow vista with nobody in it. `setPose('kimahri','kneel')`, `showActor('seymour')`, `camera('action',240)`, `shake(8,320)`, `fx('mortiorchis-unfold')` are all authored and none appear. The whole scene is one still PNG plus a dialogue box.
*Where:* `src/app/screens/CutsceneScreen.ts:303-328` — `camera: () => {}`, `moveActor: () => {}`, `fx: () => this.flash(undefined, 90)`, and `showActor`/`hideActor`/`setPose` never supplied so `createNoopPorts` leaves them undefined. Authored steps at `src/story/scripts/seymour-flux.ts:76-140` (12 camera, 11 fx/shake).
*Fix:* `BattleScreenCutscenes.ts` already builds working camera/fx/setPose ports against a live `BattleStage` — hoist that port-builder into a shared module and have `registerFlowScreens` pass it a diorama staged from `chapter.sceneKey`. Cheap partial: painted plates composited over the backdrop plus a CSS ken-burns for `camera()`.

**21. The entire FFX-2 party has one pose: no attack, cast, hurt, KO or victory in Chapters 4 and 5.**
`character-visual` · costs Character (15), Game feel (12).
*Repro:* play Chapter 4 or 5 — Rikku and Paine never change pose when they swing, cast, are hit or fall; `stage.snapshot()` reports `pose:'idle'` through the whole fight. 17 dressphere subjects in `public/art/manifest.json` list `states:['idle']` only.
*Where:* `public/art/characters/<dressphere>/` contains only `idle.png`; the substitution is silent at `src/engine/BattlePresenterArt.ts:120-130` (POSE_FALLBACKS collapses attack/cast/item/hurt/ko/victory to idle).
*Fix:* `rikku-dark-knight` already has finished `attack.1-3`, `cast.1-3`, `hurt.1`, `item.1-3` candidates sitting unpromoted — promote those first, then render five poses for the dresspheres the chapters actually use (needed: rikku-dark-knight, paine-dark-knight, paine-warrior, yuna-gunner). Add a manifest test failing when a staged subject has fewer than idle+attack+hurt+ko.

**22. Seymour Flux is not recognisable as Seymour Flux, and four contradictory Seymours ship in one
chapter.** `character-visual` · costs Character (15), Cohesion (5).
*Repro:* Chapter 1 board at 2× — the boss is a man in a purple-blue kimono seated cross-legged in mid-air with his hands on his knee. Canon Flux is a towering fused monstrosity riding Mortiorchis. Meanwhile `public/art/characters/seymour-flux/idle.png` (pause snapshot) is a blue-haired figure in a flame-winged robe, `public/art/pause/seymour.png` is a third design, and `portraits/seymour.png` (his CTB tile) is base Guado-maester Seymour.
*Where:* `public/art/characters/seymour-flux-body/` vs `public/art/characters/seymour-flux/` (referenced at `src/data/chapter-meta.ts:145`) vs `public/art/portraits/seymour.png` vs `public/art/pause/seymour.png`.
*Fix:* pick one design (the flame-winged `seymour-flux` plate is closest to canon), repaint the five battle poses from it into `seymour-flux-body`, retire the duplicate folder, commission `portraits/seymour-flux.png`. **This one needs Bailey's pick first** — the cast tiles are all still at `verdict`.

**23. Paine — and every boss, aeon and dressphere — ships live as a letter in a box.** `cohesion` · costs
Cohesion (5), Character (15), Clarity (12).
*Repro:* Enter → ArrowRight ×3 (Chapter IV). The PARTY row shows Yuna and Rikku as painted faces and Paine as a grey tile with the letter "P". Same on results, same in the CTB, same in the party rows.
*Where:* `public/art/portraits/` has no `paine.png` (only `paine-a.1.png` / `.raw.png` candidates), and no portrait at all for shuyin, lenne, mortiorchis, seymour-flux, braskas-final-aeon, yu-pagoda, yunalesca-2, yunalesca-3, vegnagun-*. Fallback: `src/ui/common/portrait.ts:40` over the monogram span in `ChapterSelectScreen.ts:294` / `ResultsScreen.ts:371`.
*Fix:* promote `paine-a.1.png` and roll the remaining subjects, then make the gap loud: `tools/gen/manifest.mjs --check` fails `prebuild` when any id reachable from `CHAPTERS[].buildRef.members` or `enemyGroupRef.enemies` has no portrait.

**24. Seymour Flux's phase-2 script casts the player's Flare, not the encounter's own `flare-self`.**
`encounter` · costs Encounter (15), Combat (25).
*Repro:* Chapter 1, seeds 1 and 7. Below 50 percent the log shows `abilityId 'flare'` — the player's Blk Magic record (power 60, mpCost 54, `single-enemy`). The record the encounter ships, `flare-self` (power 80, `self`, `extra.selfTargetBounce`), is listed in `seymourFlux.abilityIds` and referenced by no code in `src/`. Measured bounce on Yuna: 927 against research §4.4.1's 1,900–2,100, and the Reflect-dispelled self-damage case cannot be reproduced at all.
*Where:* `src/battle/ffx/ai/seymour-flux.ts:184` — `return use(ai, 'flare', [ai.self.id]);`
*Fix:* `use(ai, 'flare-self', …)`, then add `tests/unit/enemy-ability-ids-are-reachable.test.ts`: every id in an EnemyDef's `abilityIds` must be submitted by that enemy's AI in a seeded sweep, and no script may submit an id outside its own list. That one test catches this and #25 together.

**25. Seymour Flux takes exactly one offensive action for the whole of phase 2.** `encounter` · costs
Encounter (15), Difficulty (8).
*Repro:* Chapter 1, seed 1, 49-turn victory. His actions after the sub-50 percent Reflect counter: `['reflect','flare','protect','reflect','protect','reflect','protect','reflect','protect','reflect']` — every entry after the single Flare is a threshold counter, not a scheduled turn, with four "Seymour waits" messages. Phase 2, which research describes as a Flare loop, is a stretch of free turns. Repeats on seed 7.
*Where:* `src/battle/ffx/ai/seymour-flux.ts:175-178` — `if (hasReflect && flared) { emit 'Seymour waits'; return null; }`; `flared` is only cleared on the `!hasReflect && flared` branch.
*Fix:* clear FLARED on the wait turn so the loop is Flare → wait → Flare → wait (§4.4.1 describes one free turn, singular). Pin with a test asserting at least one Flare per three Seymour turns below 50 percent with Reflect up.

**26. The enemy-intent panel prints research citations and the FFX-2 command menu prints raw internal ids.**
`clarity` / `writing` · triggers the **Part B 8.0 cap** · costs Clarity (12), Writing (10).
*Repro:* Chapter 1 intent slab: `[ffx-seymour-flux §4.6]`, `[ffx-seymour-flux §4.3]` twice, footer `ffx-seymour-flux §4`; Chapter 4: `[ffx2-bahamut §2.1]`; Chapter 3: `[ffx-bfa-yu-yevon §1.6]`. FFX-2 command menu rows with DOM `textContent` `gunner` and `black-mage`. Visible in the Part C HUD composite at normal size.
*Fix:* strip citations from every panel except the strategy guide (where CHK-007 says they belong), and route every id through a label function before it reaches a row. Add `tests/e2e/player-copy.spec.ts` running CHK-007's grep over every visible surface in all five chapters.

### Majors

**27. "What this command does" does not exist where it matters.** `clarity` (12). The info slab is absent on the default-selected row when the menu opens, absent for every leaf ability (CHEER / PROVOKE / DELAY ATTACK / DELAY BUSTER / FLEE / TALK render with nothing but an MP chip), present only for category rows, and during targeting the same slab is hijacked to show the target's name. *Fix:* give every leaf row a one-line effect string from its AbilityDef and give targeting its own surface.

**28. Enemy health is presented three different ways and the boss's HP is invisible in two of three
chapters.** `clarity` (12). Chapter 1 shows numbers for the mount only (HP 4000/4000) while the guide's own top rule is "Kill Seymour, not the mount"; Chapter 3 shows no enemy HP at all; Chapter 4 shows an unnumbered pink bar. *Fix:* one enemy-HP treatment, applied to whichever enemy is targeted or acting, with the boss always readable.

**29. The strategy guide hard-clips mid-sentence with no scrollbar, fade or affordance.** `clarity` (12).
"…beat the mount's Full-", "Lance of Atrophy into Full-Life, then Dispel into", "then five countdown turns and Mega Flare. The"; at submenu heights it renders bare headings ("PHASE 1", "RULES") with no body. *Fix:* scroll or paginate with a visible affordance; never silently cut a sentence.

**30. Confirm cannot fast-forward a cutscene, and there is no skip prompt.** `game feel` (12).
`DialogueBox.handleInput` returns early when `typingState === 'idle'` (`src/ui/.../DialogueBox.ts:223`), so every `beat()`/`wait()`/`camera()` step eats Enter silently — Chapter 1 carries 24 beat/wait steps totalling 38.6 s plus 12 camera moves; runs of 13, 17, 29 and 36 consecutive presses changed nothing. The hint bar advertises only "ENTER ADVANCE · ESC MENU"; SKIP SCENE is the 8th row of the pause list, and `skipSeenCutscenes` is dead, so every retry replays the scene. *Fix:* make Enter advance the script cursor past holds; print SKIP; wire `skipSeenCutscenes`.

**31. Volume settings are written to the save file and never applied to the audio engine at boot.**
`accessibility` / `clarity` (8, 12) · part of the **Part B 8.0 cap**. After setting and reloading, `save.settings` reads `{master:0.2, music:0.1}` while `audioDebug().volumes` reads `{master:0.9, music:0.7, sfx:0.9}` and the OPTIONS panel prints the saved percentages. *Fix:* apply saved volumes to the buses on audio init and assert it in a test.

**32. There is no ending and no credits.** `replayability` (10). `src/app/screens/BattleScreenFlow.ts:153` is `for(;;)`. *Fix:* an end-of-game state after Chapter 5 with a credits roll and a return to the title.

**33. The link previews as nothing and deep links 404.** `replayability` (10) / `cohesion` (5). `index.html` head has no `og:*`, no `twitter:*`, no favicon (live `/favicon.ico` → 404), and its `description` says "HD-2D" — the direction Bailey rejected. No `public/404.html`, so any non-root path serves GitHub's own error page. *Fix:* OG/Twitter card with a real still, a favicon, a `404.html` that redirects into the SPA, and a description that says what the game is.

**34. A clear records nothing worth improving.** `replayability` / `progression` (10, 7). `bestTurns` is written with zero readers (`SaveData.ts:363-364`), `unlock()` / `isUnlocked()` have zero callers (`:371-380`), results show no turn count and no previous best, and `DIFFICULTY` is the literal `'Faithful'` (`src/ui/common/chapterPanel.ts:337`). *Fix:* read what is already stored onto the results and chapter-select cards (see Proposal 2).

**35. Chapter select ships with the selected card and all four thumbnails as solid black placeholders.**
`Part C presentation` (30) / `cohesion` (5). The approved mockup has art; the build has black slabs, plus a Location/Boss/Party column the mockup does not show, with party members as letter tiles. *Fix:* use the chapter key stills that already exist under `public/art/backdrops`, and take the extra column back to the approved layout or get it approved.

**36. The cutscene hint bar renders two hint strings overlapping and illegible.** `Part C presentation` (30) / `clarity` (12). Every cutscene frame checked shows `LEFT/RIGHTENTERADVANCETER ESCMENU ESC BACK`. *Fix:* one hint row, one source of truth, measured at the six CHK-002 viewports.

**37. The Overdrive gauge has no label, no ready state and no cue when it fills.** `game feel` (12).
Kimahri's gauge was visibly full in Chapter 1 with no flash, no label, no chip and no sound hook. *Fix:* a READY state on the party row with a one-shot flash and a stinger.

**38. The advisor card prints its effect twice, one copy as a raw key.** `clarity` (12) / `writing` (10).
"Speeds the party's turns up · inflicts Haste" / "Haste on the party."; "Inflicts Shell" / "Shell on the party."; "+ MAX HP X2" / "Max Hp X2 on the party." *Fix:* one effect string per card.

**39. Zanarkand Dome reads as an open-air flooded twilight ruin, not Yunalesca's sealed dark hall.**
`scene` (10) · **downgraded from blocker**. The shipped plate is byte-identical to the approved tile
(`f48c5b05…` on disk and live), so this is not a build defect and must not be regenerated under CHK-013.
Every term the plate's own negative prompt excluded ("water, reflection, sky, sunset, pink sky, outdoors,
flooded") is in the picture, against `research/visual-bible.md` §2.2's near-black ambient. *Fix:* **ask
Bailey.** If they want the canonical hall, that is a new options round for that tile; if they want what
they approved, Part A carries the fidelity cost knowingly and this drops off the list permanently.

**40. FFX-2 prep has four tabs to FFX's six, and the FFX ITEMS tab prints raw ids.** `progression` (7).
CHK-020 parity. `src/ui/ffx/party-prep/panels.ts:171` prints `entry.itemId` while `itemLabel()` already exists at `src/ui/common/resultsMath.ts:85`; 6 of 28 rows are visible. *Fix:* use the label function, make the list scroll, and bring the FFX-2 tab set to parity minus a written exception list.

**41. Party prep ships an extra CHAPTER tab as the default.** `Part C presentation` (30) · minor. The approved mockup's first tab is STATS. *Fix:* default to STATS or get the change approved.

**42. The victory hero portrait is a square head-crop stretched into a tall wedge.** `Part C presentation` / `cohesion`. `src/app/screens/ResultsScreen.ts:268`. *Fix:* use a portrait with the right aspect, or letterbox rather than stretch.

**43. The boot and fatal screens are undesigned.** `cohesion` (5). `index.html` `#boot` is the word "Loading"; `src/main.ts:26-35` renders unstyled inline HTML on a fatal error. *Fix:* an Ink & Gold boot card and error card.

### Process notes (not defects of this build)

**44. The working tree currently does not compile, and one unit test fails — both from uncommitted edits.**
`npm run build` fails with `src/audio/tracks/boss-yunalesca.ts(82,3): error TS6133: 'lean' is declared but
its value is never read`, and `tests/unit/audio-ffx-bosses.test.ts:366` fails. `git diff HEAD` shows 136
changed lines in that file and 148 in that test; `lean` is used at line 263 of the committed version. The
deployed commit builds. Whoever owns that in-flight audio edit must finish or revert it before the next
deploy, and the pre-deploy gate must run `npm run build` on a clean tree.

**45. The first-time-player pass was not run this round** (rubric rule 6), and four approved Part C
presentation tiles (turn cut-in, Swordplay Overdrive, FFX-2 battle HUD, a genuine results screen) were
never captured — the results capture failed *because* Chapter 1 would not resolve, which is issue #1. Part C
Presentation is therefore scored over 7 of 11 approved tiles; an uncaptured tile earns no credit.

---

## Proposals (need Bailey's approval; nothing here is built without a yes)

Ranked by value for cost. None of these moved the score.

1. **HUD density presets: Coached / Instruments / Clean.** One key cycles all three optional panels
   (guide + advisor + intent → intent only → nothing but the CTB rail and party rows), shown once on the
   first battle. *Benefit:* a first-timer keeps the coaching; a returning player gets the painted game back
   instead of a wall of text. *Cost:* 1–2 days — the three booleans already exist in `Settings`.
   *Fidelity risk:* none; Coached stays the default.
2. **Medals and a run scorecard on every clear.** Grade each clear on turns, clear time, damage taken and
   objectives met (Chapter 1 already writes three), stamp Bronze/Silver/Gold/Pyrefly on the chapter card
   and print the one line that cost the top seal. *Benefit:* five one-shot fights become five things worth
   doing properly, and the objectives the game already writes finally mean something. *Cost:* 3–4 days;
   `ChapterRecord` already stores `bestTimeMs`, `bestTurns`, `attempts`, `playTimeMs`. *Risk:* low —
   thresholds must be set from real play so a faithful clear earns the top seal.
3. **Accessibility pack: remapping, text scale, shape-coded statuses, flash safety, hold-to-confirm.**
   *Benefit:* the difference between "most people can play this" and "my friend can play this"; the scale
   slider also fixes sofa-distance legibility without redesigning a panel. *Cost:* 5–7 days — `Input.ts`
   already reduces everything to one abstract action set. *Risk:* none; all off by default.
4. **"What is this?" cold open and a taught first chapter.** A 20-second panel saying what the game is,
   which two games it recreates and how long it takes, then a guided Chapter 1. *Benefit:* the link becomes
   sendable. *Cost:* 2–3 days. *Risk:* none if skippable and remembered.
5. **Challenge ribbons: No Aeons, No Items, Solo, Low Level, Time Attack.** Ticked on the prep CHAPTER tab,
   shown on the clear seal. *Benefit:* the cheapest way to make someone replay Seymour Flux six times.
   *Cost:* 4–6 days. *Risk:* low-to-medium, entirely UI discipline — modifiers must be visibly outside
   Faithful and a plain clear never confused with a modified one.
