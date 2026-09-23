# Chapter 7 — Seymour and Anima, Macalania Temple: integrator's handoff

> **Integrator pass, 2026-09-22 (workflow `wf_552781c6-d19`, Opus).**
> **Game case: FFX only** [AGENTS.md rule 14]: an FFX encounter with an FFX
> party (`research/ffx-seymour-anima-macalania.md`). The one shared-plumbing
> change (`romanNumeral`, below) is **both**. No boss number changed.
>
> This track wires the five standalone Macalania tracks together, the way
> `c473de8` wired Leblanc: engine and data (`074a198`,
> `chapter-macalania-engine.md`), story script (`chapter-macalania-script.md`),
> guide, tactic and meta (`27ed39e`, `chapter-macalania-guide.md`) and the
> scene with Anima's arrival (`823450d`, `chapter-macalania-scene.md`).

## Fix pass, 2026-09-22 (critic pass on 62b4927)

**Game case.** The chapter's own files are **FFX only**. Three fixes are shared
plumbing and so **both** [AGENTS.md rule 14, CHK-020]: the presenter's arrival
rule, the presenter's eject rule and the results layout. No boss number changed.
The paper preflight for the DEEP part is the addendum at the end of
`docs/plans/chapter-macalania-review.md` (written during this pass, dated so).

| Verifier finding | Root cause, proven by running | Fix | Test that failed first |
|---|---|---|---|
| **CRITICAL** Anima never appears in a real battle | `forms.ts#revealEnemy` emits `part-restored` for a combatant the stage never built (`flags.hidden` at start); the handler faded `stage.actor(id)`, which was `undefined`. Engine probe (seed 1): `message`, `part-restored`, then `script-trigger mac-anima-summon` | New optional `BattleStage.arrive` (`BattlePresenterPorts.ts`); `BattlePresenterArrivals.ts` holds an unstaged reveal until the next non-script event or the end of the burst, then `PaintedStage.arrive` stages her from the live state and plays the scene's `ArrivalDirector` (`StageArrivals.ts`; published by `buildMacalaniaTempleScene` as `arrivals`, carried on the three.js scene's `userData` so `BattleScreen.ts`, another agent's file, is untouched). The Macalania director (`src/scenes/macalania-temple-arrival-battle.ts`) drives the preview's own pure timeline: camera drop and rise, chains, floor occluder, crack light, Seymour stepping back and greying (tint, not `setDim`, which the targeting highlight owns), B's tags for 3.2 s. When she leaves (act three) the chains go and Seymour walks back into the light | `tests/unit/presenter-arrival-eject.test.ts` (4 arrival cases, 5 of 6 failed before) |
| **MAJOR** shattered Guardians stay standing | `hp.ts#ejectActor` emits `status-add eject`, never a `ko`; the presenter only flashed | `status-add eject` on an **enemy** dissolves it (stone grey after a petrify) and removes it; `petrify` flashes grey. A party Eject is unchanged (the engine does not refill the slot and what FFX draws is not sourced) | same file, the eject case |
| **MAJOR** Guardian attack/hurt face away; Seymour hurt turned away | `install.mjs` wrote `facing: 'left'` for every pose; three paintings face frame-right (looked at 1:1) | `picks.json` declares `facing: 'right'` for Guardian attack, Guardian hurt, Seymour hurt; `install.mjs` reads it; the three installed sidecars patched (public/art is local only; copies in `D:/Tools/pyrefly-art-backup/candidates/2026-09-22-macalania/facing-fix/`) | none possible in a unit test (which way a painting faces is read by eye); the browser crops are the proof |
| MINOR pause hero art wired to nothing | `heroArt` named an unrendered `pause/ch7-seymour-anima-macalania` | `heroArt: 'pause/macalania'` (the installed CANDIDATE plate) | `chapter-meta-seymour-anima-macalania.test.ts` "heroArt names the installed pause plate" |
| MINOR four drops overlap Tidus's row | two causes: one drop per enemy printed the same name three times, **and** a fourth member (a switch-in earns AP) lifts the bottom-anchored party list into the ledger | `dropsLabel` merges repeated items (`Ability Sphere ×3, Blk Magic Sphere`); a long ITEMS row steps down a size; `resultsDensity` (`src/ui/common/resultsLayout.ts`) compacts the ledger, then the member rows, until the two blocks clear (1 to 7 members). Both games | `ui-common-results.test.ts`: the merge case and three `resultsDensity` cases |
| MINOR four files over 400 lines, `api.ts` at 500 | | `macalania-rules.ts` 364 (+ `macalania-talk.ts`), the tactic 268 (+ `-helpers.ts`), the abilities 370 (+ `-anima-abilities.ts`), the build 310 (+ `macalania-bench.ts`), all re-exported so no import changed; `src/debug/api.ts` 467 (the seven scene debug screens moved to `src/debug/sceneScreens.ts`: **Evrae's scene screen registers there now**) | tsc + the chapter suites |

### How the fix pass was verified

- `npx tsc --noEmit` clean; the new and touched suites green; full `npm test`
  (numbers in the commit).
- `node tools/orphans.mjs`: none of the new modules is an orphan.
- **Real battle, GPU browser** (`PYREFLY_BROWSER=gpu`, own Vite on :5743, stopped
  by PID; scratch `tools/zz-macfix.tmp/`, not committed), seed 1, the intended
  line, normal speed around the summon: the two Guardians are petrified and
  leave the field on turn 18 (`staged()` loses both); Anima is staged the moment
  Yuna's line ends, rises through the floor with the chains, Seymour steps back,
  the tags land, the rail lists her first once the burst ends; in act three she
  and the chains are gone and Seymour is back in the light; results: ITEMS reads
  `Ability Sphere ×3, Blk Magic Sphere` and clears the four-member party list.
  0 console errors, 0 HTTP errors. Stills:
  `docs/screenshots/chapters/macalania-arrival-real.png` (four beats of the
  real-battle arrival), `macalania-facing-fixed.png` (Guardian B and Seymour,
  idle / attack / hurt at 1:1 in game), `macalania-results-fixed.png`.
- The results demo screens (`results-victory`, `results-ffx2`) keep their
  layout (`normal` / `compact` ledger over a `normal` list, 0 errors).

### Still open after the fix pass

1. **Seymour's attack pose** still blooms white in the hair and washes the face
   (the renderer's bloom on near-white paint; CANDIDATE art, needs a repaint or a
   darker hair pass, not a code fix). His hurt pose now faces the party but still
   reads as the head thrown back, which is what the pick was.
2. **"Cannot be targeted" is timed**, not persistent: the tags show for 3.2 s after
   they land; the persistent version belongs to the targeting HUD.
3. **Sizes.** In battle Anima is 1.2x the boss height with no hover (a labelled
   presentation estimate: at the preview's 3.6 she would be shorter than the
   stage's 4.1 Seymour). `fromSceneBuild` still hard-codes 1.82 / 4.1 (scene
   handoff §7.2).
4. **Leblanc has the same pause-art bug** (`heroArt: 'pause/ffx2-leblanc'`, the
   installed plate is `pause/leblanc.png`); not fixed here, the Leblanc data is
   another workflow's.
5. **Observations, pre-existing and shared, not fixed:** the title screen's DOM
   covers a battle reached by `gotoChapter` from a real-keys chapter select; the
   advisor card does not refresh under `autoBattle` (it still recommended
   Petrify Grenade after both Guardians had gone).
6. `docs/handoff/NOW.md` was not edited (not this brief's file).

## Status: registered, playable, LOCKED as Coming

`seymour-anima-macalania` is **Chapter 7** in `src/data/encounters.ts`
(display order after the six registered; the D-018 rule Leblanc's 6 used;
narratively it precedes Chapter 1). `window.__pyrefly.gotoChapter`, the flow,
party prep, the cutscene, the battle, the guide and tactic, the pause meta and
the results screen all reach it. **Chapter select shows it as a locked COMING
card**, because every Macalania painting is CANDIDATE and Anima's arrival is
built to a recommendation, not a pick.

### The one-line unlock

Delete this line from `LOCKED_CHAPTER_IDS` in
`src/app/screens/frontend/comingChapters.ts`:

```ts
  'seymour-anima-macalania',
```

The COMING row then drops off by itself (its id matches the real chapter) and
the playable card takes its place, with numeral VII and Seymour's painting as
its silhouette (`chapterGrid.ts` `SILHOUETTE_OVERRIDES`). A test pins both
states (`frontend-chapter-grid.test.ts`, "keeps a registered but LOCKED
chapter as its COMING card, and unlocks it with its one line"). Evrae can use
the same set.

## What this track changed

All additive; the contract entry is in `docs/CONTRACT-CHANGES.md`
("Chapter 7 registered, LOCKED", 2026-09-22).

1. **`src/data/encounters.ts`** (contract): `ChapterId` + `Chapter.number`
   widened, `SEYMOUR_ANIMA_MACALANIA` in `CHAPTERS`/`CHAPTER_IDS`. The record
   is in **`src/data/chapter-seymour-anima-macalania.ts`** (new) so the
   contract file stays under 400 lines. `sensorTexts` are copied from the
   enemy records' own `sensorText`; the card blurb summarises research §9.6.
2. **`src/data/chapter-meta.ts`**: numeral `'VII'`, meta appended. The meta
   file became a real `ChapterMeta` (numeral VII, `heroArt` renamed `ch7-`,
   `musicKeys` = the routed cues).
3. **`src/story/registry.ts`**: key, `STORY_CHAPTERS`, empty
   `AI_EMITTED_TRIGGERS` and empty `CHAIN_SEAMS` (one battle, three acts;
   every beat is an in-fight interrupt on the 8 s budget, and all three fit).
4. **`src/engine/tactics/index.ts`**: the tactic under its four combatant ids;
   **`src/data/guides/index.ts`**: the guide appended.
5. **`src/scenes/index.ts`**: `'macalania-temple'` factory + `SCENES` entry;
   **`src/debug/api.ts`**: the `scene-macalania-temple` debug screen.
6. **The lock**: `LOCKED_CHAPTER_IDS` (comingChapters.ts), honoured by
   `buildChapterTiles` (chapterGrid.ts, plus an optional `locked` registry
   for tests).
7. **`src/ui/common/roman.ts`** (both games): numerals now run to VIII. It
   stopped at V, so the **live** Leblanc cutscene eyebrow and prep header read
   "CHAPTER 6" against its meta's VI. Seen fixed in the pass ("VI Leblanc").
8. **`learn/atlas/cites.ts`**: the chapter's three `Record<ChapterId, …>`
   rows, each cite copied from the data files' own section notes.
9. **`docs/target/targets.json`**: the chapter tile's `delivery` is
   `implemented` (the board's word for built; `built` is not in its enum) with
   a `build` line and three `reaction.inferred` entries; the arrival tile
   (already `implemented`, inferred exactly "built to the driver's
   recommendation A + B's tag, awaiting Bailey") gained the real-battle gap.

### Music: Chapter 1's cues, as a recorded stopgap

The preflight (§6.3) and research §9.8 want two NEW compositions,
`scene-macalania-temple` and `boss-seymour-macalania`, and say outright that
this fight is not the Flux chapter's `boss-seymour`. Neither
`docs/audio/THEMES.md` nor `docs/plans/music-modern-sound.md` names a
Macalania cue (the c21d062 sketches are auditions, not routed), and an
unregistered cue throws in the cutscene runner. So, per the brief, **Chapter
1's `scene-gagazet` and `boss-seymour`** plus `victory-ffx` are routed in four
places: `Chapter.music`, the script's two `music()` calls, the formation's
`musicCues`, the meta's `musicKeys`. When the real cues land, swap all four.

### Three sound effects swapped

The script named `chamber-door`, `guado-robes` and `sphere-crack`, none of
which is in the SFX bank (`audio-story-cues.test.ts` failed on them). They now
play `dome-echo` (a bell in a stone hall), `footstep` and `petrify-shatter`
(glass giving way). New sounds are an audio-track question.

### Tests adjusted for the seventh chapter

`chapter-meta.test.ts` (numeral list), `strategy-guide.test.ts` (guide count
7), `frontend-chapter-grid.test.ts` (locked card, unlock case),
`flow-post-scene.test.ts` (Macalania is display-last but story-earlier, so
`ARC_FINALE.ffx` stays Braska's Final Aeon, the same exception Leblanc
documents), `learn-atlas-data.test.ts` (gold accent), `story-scripts.test.ts`
(its row), `chapters/macalania-story.test.ts` and
`chapter-meta-seymour-anima-macalania.test.ts` (the routed cues),
`tests/e2e/chapters.spec.ts` (the id; updated, not run).

## How it was verified

- `npx tsc --noEmit`: clean.
- Full `npm test`: **239 files, 5,536 passed, 2 skipped, 0 failed.**
- `node tools/orphans.mjs`: no Macalania module listed (the four scene files,
  the chapter record, meta, guide, tactic and script are all reachable from
  `src/main.ts`).
- `node tools/critic-plan.mjs --paths …`: **DEEP** (chapter registry, scene
  runner, shared layout). The paper preflight is
  `docs/plans/chapter-macalania-review.md`.
- **One real-flow browser pass** (`PYREFLY_BROWSER=gpu`, own Vite on :5776,
  stopped by PID; scratch harness `tools/zz-macalania-flow.tmp.mjs`, not
  committed). Title, then chapter select with the card **locked**
  (`fe-card fe-card--coming`, "Seymour and Anima · Coming"), then
  `gotoChapter` to party prep (header "VII · Seymour and Anima"), the
  cutscene (Chapter VII eyebrow over the painted antechamber) skipped, the
  battle to its first command menu, `autoBattle('intended')` to a **victory**
  (100 turns, Anima overkilled), the results screen, then
  `autoBattle('defend')` to a **defeat** and its results. 0 console errors,
  0 HTTP errors. Stills, looked at 1:1:
  `docs/screenshots/chapters/macalania-flow-1-select-locked.png`,
  `-2-prep.png`, `-3-battle-menu.png`, `-4-results-win.png`.

## Not done, and found

1. **FIXED in the fix pass above.** ~~Anima is invisible in a real battle.~~ Was: Proven by running: at Seymour 2,829 HP the engine reveals
   her (`removed: false`, 18,000 HP) but the stage's `staged()` list never
   gains `anima-macalania`. `BattlePresenterEvents.ts`'s `part-restored`
   handler only fades an actor that already exists, and `stage()` skips
   `removed` enemies at battle start. This is the one item
   `chapter-macalania-engine.md` §3 says is owed; the scene's pure timeline
   (`animaArrivalAt`, `ANIMA_ARRIVAL_CAMERA`, `makeFloorOccluder`,
   `makeArrivalChains`, `SEYMOUR_STEP_BACK`) is ready for that handler to
   drive. The presenter files are outside this brief. Suggested: when
   `part-restored` names an unstaged enemy, `stage.addCombatant(id, { artId:
   'anima', side: 'enemy', slot: 3 })` (slot from the combatant) at alpha 0,
   then run the arrival. Doesn't block: the chapter is locked.
2. **Real-battle sizes** ignore the scene's heights (`fromSceneBuild`
   hard-codes them; scene handoff §7.2). Seymour's `spriteKey: 'seymour'`
   costs one wasted art probe (§7.1). Presenter and data owners.
3. **The chapter's own music** (above) and three new SFX.
4. **FIXED in the fix pass above.** Was: **the results drop list overflows with four drops**: in
   `-4-results-win.png` the second line ("Ability Sphere, Ability Sphere")
   overlaps Tidus's row. Shared results layout, both games; not fixed here.
5. **Debug-path artifact, not this chapter:** calling `gotoChapter` while the
   chapter-select flow loop is running leaves the title screen's DOM visible
   under the battle. Chapter 1 does the same; the real card-and-Enter path is
   clean. The committed battle still was retaken from boot.
6. **Seymour's dialogue portrait** is `portraits/seymour.png`, which reads
   as the Flux-era face; the chapter tile already lists this as undecided.
7. **Art approval.** Everything is CANDIDATE; the dome is cropped at idle
   (scene handoff §3).
8. `docs/handoff/NOW.md` was not edited (not in this brief's file list);
   the orchestrator folds this in.
