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

1. **Anima is invisible in a real battle (critical for this chapter, not
   mine to fix).** Proven by running: at Seymour 2,829 HP the engine reveals
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
4. **The results drop list overflows with four drops**: in
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
