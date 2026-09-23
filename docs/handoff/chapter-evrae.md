# Chapter 8 — Evrae, on the deck of the *Fahrenheit*: integrator's handoff

> **Integrator pass, 2026-09-23 (workflow `wf_552781c6-d19`, Opus).**
> **Game case: FFX only** [AGENTS.md rule 14]. The airship distance mechanic
> "has no X-2 counterpart" (`research/ffx-evrae-airship.md` §0.4); the party is
> FFX's six guardians without Yuna. The shared files this pass touched (the
> FFX HUD, the battle screen, the FFX trigger table) change behaviour only
> behind the `airship.range` flag, which only this encounter sets. No boss
> number changed.

This pass wires the four standalone Evrae tracks together, the way `c473de8`
wired Leblanc and `62b4927` wired Macalania: engine and data (`dc1979f`,
`959fade`, `chapter-evrae-engine.md`), the story script
(`chapter-evrae-script.md`), guide, meta and the order widget (`d030d82`,
`chapter-evrae-guide.md`), and the scene with the NEAR/FAR switch (`84dccf9`,
`chapter-evrae-scene.md`).

## Status: registered, playable, LOCKED as Coming

`evrae-airship` is **Chapter 8** in `src/data/encounters.ts` (display order
after the seven registered; the D-018 rule). `window.__pyrefly.gotoChapter`,
party prep, the cutscene, the battle (with the NEAR/FAR re-staging and the
order widget), the guide, the tactic, the pause meta and the results screen
all reach it. **Chapter select shows it as a locked COMING card**: every Evrae
painting is CANDIDATE, and the widget and the staging are built to the
driver's recommendation, not a pick.

### The one-line unlock

Delete this line from `LOCKED_CHAPTER_IDS` in
`src/app/screens/frontend/comingChapters.ts`:

```ts
  'evrae-airship',
```

The COMING row then drops off by itself (its id is the chapter's) and the
playable card takes its place, numeral VIII, Evrae's painting as its
silhouette. `frontend-chapter-grid.test.ts` pins both states ("keeps Chapter 8
(Evrae) as its COMING card while LOCKED, and unlocks it with its one line").

## What this pass changed

Contract entry: `docs/CONTRACT-CHANGES.md`, "Chapter 8 registered, LOCKED"
(2026-09-23).

1. **`src/data/encounters.ts`** (contract): `ChapterId` + `Chapter.number`
   widened; `EVRAE_AIRSHIP` in `CHAPTERS`/`CHAPTER_IDS`. The record is in
   **`src/data/chapter-evrae-airship.ts`** (new). Id `evrae-airship` = the
   formation's id and the COMING row's. Title stays **Evrae** (the COMING
   card's): Q11 "does the airship name the chapter" is still `undecided` on
   the chapter's target tile, so nothing was renamed.
2. **`src/data/chapter-meta.ts`**: numeral `'VIII'`, `EVRAE_META` appended.
   The meta became a real `ChapterMeta` with id `evrae-airship`.
3. **`src/story/registry.ts`**: key, `STORY_CHAPTERS`, empty
   `AI_EMITTED_TRIGGERS` (no Evrae AI script emits `script-trigger`), empty
   `CHAIN_SEAMS` (one formation; all five mid beats fit the 8 s budget).
4. **`src/engine/tactics/index.ts`**: `evrae` under `'evrae'`;
   **`src/data/guides/index.ts`**: `EVRAE_GUIDE` appended, its `id` corrected
   from `'evrae'` to the chapter id (`guideForChapter` looks it up by that).
5. **`src/scenes/index.ts`**: `'evrae-airship-deck'` in `SCENE_FACTORIES` and
   `SCENES`; **`src/debug/sceneScreens.ts`**: `scene-evrae-airship-deck`.
6. **The lock**: `LOCKED_CHAPTER_IDS` gains `'evrae-airship'`.
7. **`learn/atlas/cites.ts`**: the chapter's three `Record<ChapterId, …>` rows,
   cites copied from the data files' own section notes (§1.1, §2.1, §2.2/§3.1/§3.2).
8. **The NEAR/FAR switch in a real battle** — `src/app/screens/BattleScreenAirship.ts`
   (new, 71 lines) and three lines in `BattleScreen.ts`: after the field is
   staged, find the scene's published `AirshipRangeDirector`, bind the battle
   camera and Evrae's actor, and `sync` it every frame with the engine state.
   `null` on every other scene. It also takes **Cid's actor off the field**
   (scene handoff F-1): he is an untargetable, HP-hidden enemy-side turn-taker
   with no painting, so the stage drew a grey boss silhouette for him and the
   formation solver stood Evrae on the deck. He keeps his CTB tile (with a
   portrait) and his volleys play from off-frame. This is a chapter-local
   answer; the presenter-wide rule ("never stage a non-combatant") is still
   the presenter owner's decision.
9. **The order widget in the real command flow** — `src/ui/ffx/AirshipOrders.ts`
   (new, 158 lines) and a few lines in `FFXBattleHud.ts`:
   - on Tidus's or Rikku's turn the two order rows fold into **one "Orders"
     row** in the cascade; choosing it opens `AirshipOrderWidget` in the
     command area; **Esc** returns to the cascade for the same decision (the
     widget claims Esc while open, and the menu comes back two frames later,
     so the same press never opens the pause menu — `cancelClaim.ts`'s race);
   - on anyone else's turn the rows are not there (option A, step 1; the engine
     still offers them greyed, "Not your call");
   - the gold **ORDER chip** sits on Cid's CTB tile while an order stands,
     re-docked after every CTB render;
   - the widget is taken down on `action-start` and on a decided battle.
   Everything is a pass-through (`openMenu(commands)`, the same array) unless
   `state.flags['airship.range']` is `near`/`far`.
10. **The widget itself** (`AirshipOrderWidget.ts`, guide track's file; widget
    tile in `docs/target/targets.json`): rows now carry A's **Trigger** tag or
    why they are greyed (**"Already near/far"**, and **"Ordered"** for the
    order already standing, which fixes the scene handoff's F-2); the cost
    moved into A's separate ivory **"This order costs"** slab with the volley
    pips and "Volleys left N" (F-3: the label no longer wraps; the pips were
    gold on a gold row and are now visible). An order forgoes Cid's next
    volley and does not spend one from the rack, so the pips count the rack.
    Optional `open(…, { pending, onCancel })`; a public `hide()`.
11. **Order copy**: `special-orders-evrae.ts` `name` is now "Pull back" /
    "Close in" (approved with the preflight, `decisions.json` D-020 Q9); the
    guide, the advisor and the widget printed the raw ids before.
12. **A silent row, found by the generic suite**: `trigger-commands.test.ts`
    ("every row the menu offers changes the battle or is refused out loud")
    failed on registration: an order changed only a flag, so the row produced
    `action-start`/`action-end` and nothing else. `src/battle/ffx/ai/index.ts`
    now emits `message` "Tidus orders Cid to pull back" when an order is
    queued, as Talk does. Placeholder copy, like the engine's other three
    airship messages. No RNG draw, so no measured number moves.

### Music: Chapter 1's cues, as a recorded stopgap

`docs/audio/THEMES.md` names no Evrae or airship cue, and the preflight's two
(`scene-fahrenheit`, `boss-evrae`; research §12.6, C-16 "no source states
which track plays") are unbuilt. An unregistered cue throws in the cutscene
runner, so **Chapter 1's `scene-gagazet` and `boss-seymour`** plus
`victory-ffx` are routed in four places: `Chapter.music`, the script's two
`music()` calls, the formation's `musicCues`, the meta's `musicKeys`. Swap all
four when the real cues are composed and picked by ear.

### Four sound effects swapped

Not in the SFX bank (`audio-story-cues.test.ts`): `airship-engine-loop` ->
`machina-whir`, `comm-click` -> `cursor-move`, `wyrm-fall` -> `ko-fall`,
`cannon-report` -> `explosion`. `wind-gust` exists. New sounds are an audio
question.

### Tests adjusted for the eighth chapter

`chapter-meta.test.ts` (numerals), `chapter-meta-evrae.test.ts` (id, numeral),
`strategy-guide.test.ts` (8 guides), `flow-post-scene.test.ts` (Evrae is
display-last but story-earlier than the FFX finale: research §12.5 beat 11,
the wedding), `learn-atlas-data.test.ts` (gold), `frontend-chapter-grid.test.ts`
(the lock and unlock case), `chapters/evrae-script.test.ts` (the routed cues),
`tests/e2e/chapters.spec.ts` (the id; updated, not run). New:
`tests/unit/ui-ffx-airship-orders.test.ts` (6 cases: pass-through, fold +
widget, cancel back to the menu, no row for non-owners, "Ordered", the chip).

**Two test files had another agent's uncommitted edits** that re-locked
Leblanc (`frontend-chapter-grid.test.ts`, `frontend-chapter-select-screen.test.ts`,
written 23:31 EDT, four minutes before Bailey's 23:35 word that Chapter 6
ships **unlocked**). They failed against HEAD, where Leblanc is not locked.
This pass rewrote both from HEAD (the select-screen file is back to HEAD
exactly) and added the Evrae case; the stale version is kept at
`D:/Tools/pyrefly-stale-edits/2026-09-22-leblanc-lock-tests/` (files + diffs).

## How it was verified

- `npx tsc --noEmit`: clean.
- Full `npm test`: **248 files, 5,655 passed, 2 skipped, 0 failed.**
- `node tools/orphans.mjs`: no Evrae module listed (the seven scene files, the
  record, meta, guide, tactic, script, widget and both new hooks are reachable
  from `src/main.ts`).
- `node tools/critic-plan.mjs --paths …`: **DEEP** (chapter registry; FFX CTB
  engine). Paper check: the addendum at the end of
  `docs/plans/chapter-evrae-review.md`.
- **One real-flow browser pass** (`PYREFLY_BROWSER=gpu`, own Vite on :5837,
  stopped by Windows PID 28500; scratch harness `tools/zz-evrae-flow.tmp.mjs`,
  not committed). Title, chapter select by real keys (the card is
  `fe-card fe-card--coming`, "Evrae · Coming"; a forged `select:evrae-airship`
  is refused), a fresh page, `gotoChapter` to party prep, the cutscene
  ("CHAPTER VIII · Deck of the Fahrenheit — the approach to Bevelle") skipped,
  the battle to Tidus's first command menu (`Orders, Attack, Special, White
  Magic, Items, Flee`), then **real keys**: Enter on Orders opened the widget
  ("Pull back · Trigger", "Close in · Already near", the cost slab, "Volleys
  left 3"); Esc returned to the cascade with the screen still `battle`; Enter,
  Enter sent Pull back: `airship.order = far`, the ORDER chip on Cid's tile.
  Then `autoBattle('intended')`: Cid flew the order, the field re-staged to
  FAR (Evrae at (6.4, 3.3, -30), scale 0.764, the idle-far streak), a
  **victory** in 91 turns (5,400 AP, 2,600 gil, Blk Magic Sphere), the post
  scene, the results; then `autoBattle('defend')` seed 2: a **defeat** in 21
  turns and its results. **0 console errors, 0 HTTP errors.** Stills, looked
  at 1:1: `docs/screenshots/chapters/evrae-flow-1-select-locked.png`,
  `-2-order-widget.png`, `-3-battle-far.png`, `-4-results-win.png`.

## Found, not fixed (outside this brief, or needing a decision)

1. **F-1's presenter-wide rule.** Cid is removed on this scene only. A general
   "do not stage a non-combatant" needs a public flag (a contract change) or a
   stage rule for `untargetable && hideHpBar` — the presenter owner's call.
2. **The advisor card sits over the FAR streak** (`evrae-flow-3-battle-far.png`:
   the NEXT BEST MOVE slab covers part of the far wyrm). The advisor's safe
   zones do not know about a combatant that small and that high.
3. **The range move starts with the burst**, not after "The Fahrenheit pulls
   back" is read (the hook syncs every frame from the engine state, which is
   ahead of playback). It reads as the ship answering the order; a
   burst-end sync would need a presenter hook.
4. **The title screen's DOM stays over a battle reached by `gotoChapter`**
   after a real-keys chapter select (pre-existing, Macalania's "Still open" 5).
   The harness reloads the page before `gotoChapter` to get a clean field.
5. **The advisor card does not refresh under `autoBattle`** (pre-existing): in
   the FAR still it names Rikku after Lulu switched in.
6. **The cutscene's opening frame** shows the painted sky plate with its own
   rail at an angle (the cutscene draws the backdrop, not the rolled deck
   rig); an art/scene question, not a registration one.
7. `docs/handoff/NOW.md` was not edited (the driver's).

## Owed to Bailey (nothing here is approved)

- The order widget options round (A/B/C or a mix). Built: A's widget with C's
  staging, recorded INFERRED on the widget tile, plus one more inferred entry
  for this pass's "Orders" fold.
- Q11: the chapter's name (Evrae or the airship).
- The Evrae art (CANDIDATE throughout; the backdrop is darker than concept B).
- The music (two new cues, by ear).
