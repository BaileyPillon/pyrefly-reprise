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

---

## Fix pass, 2026-09-23 (after the adversarial verifier)

**Game case, per item below.** The chapter's own fixes are FFX only; four shared fixes are
"both" (shared plumbing, CHK-020), each measured on the other chapters. Paper check:
`docs/plans/chapter-evrae-review.md`, "Addendum 2". No boss number changed; the chapter
stays LOCKED as Coming (the one-line unlock above is unchanged).

| # | Finding | Root cause (proved by running it) | Fix | Test that failed first |
|---|---|---|---|---|
| 1 | ADVISOR: following the card stalls (4 of 5 seeds at the 400-turn guard) | three: the preview lost Wakka's reach (`simulate.ts#runtimeFor` rebuilt the runtime without `rangedWeapon`, so his FAR Attack previewed as nothing and the no-op guard buried the line); capped Aim/Cheer priced at 254; orders the widget refuses were offered | `evrae-rules.ts#markEvraeRuntime` shared by setup and preview (FFX only); `advisor-roll.ts` blocks a capped stacking buff with each game's ceiling (both: FFX 5, FFX-2 10); `engine/tactics/airship-orders.ts` is the one refusal rule for the widget and the card's hard gate (`advisor-menu.ts#pressable`), and the card's chip for an order says "in Orders" (FFX only) | `tests/unit/chapters/evrae-advisor.test.ts` (7), `tests/unit/advisor-stack-cap.test.ts` (3); `advisor-menu.test.ts` now checks chips against the folded Evrae stack |
| 1b | the measure handoff's wrong reason | it said the card "never once suggests a range order" | `chapter-evrae-measure.md` §2-§3 rewritten with the real causes and the new numbers | |
| 2 | PAUSE LEAK: clicks reach the battle HUD under the pause | the pause claimed the keyboard and muted the pad, never the mouse (pre-existing; Chapter 1 opened Items the same way) | `rawInput.ts#setRawInputSuspended(paused, battleRoot)` also swallows `click`/`dblclick`/`auxclick`/`contextmenu` on the battle's own DOM while paused; `pointerdown` is left alone for photo mode (both) | `tests/unit/pause-pointer-leak.test.ts` (3) |
| 3 | INHALE TELEGRAPH never shown | the live actor only ever loaded idle/attack/cast/hurt/ko | the range director swaps Evrae's resting (idle) painting to `breath-charge` while `airship.breathCharged` stands at NEAR, and back (FFX only); at FAR the streak stays (the breath whiffs) | `tests/unit/chapters/evrae-telegraph.test.ts` |
| 4 | ART: no attack painting | there is no `characters/evrae/attack.png`; the pose falls back to idle | **not fixed**: art, and the art method is under the rule-15 stop until Bailey picks the next method (NOW.md item 3) | |
| 5 | ART: blue-white rims on KO | **proved: the scene's rim light**, not the painting. Same frame, rim 0.7 vs 0: the bright outlines along every interior coil edge go away (`docs/screenshots/chapters/evrae-fix-5-ko-rim-on-off.png`); a faint 1 px fringe stays in the PNG | the director puts the rim out while the KO painting shows, restores it after (FFX only) | same telegraph test file |
| 6 | BACKDROP darker than picked concept B | the installed plate (`backdrops/evrae-airship-deck.png`) is **not** concept B: it is a later render whose upper half is the dark underside of the hull, and the rolled-plane framing shows that half. Concept B (`renders/backdrop-b.png`) is bright sky and cream cloud with the hull on the right | **not fixed**: swapping the plate means new art (the rail geometry is fitted to the installed plate) and the art track is stopped; disclosed as a miss against the picked target | |
| 7 | PAUSE CHAPTER TAB cuts objectives and captions | fixed key column and `nowrap` + ellipsis; every chapter's captions were cut the same way | objective rows (`pause__row--obj`) and snapshot captions wrap (both) | `tests/unit/pause-chapter-tab-wrap.test.ts` (3) |
| 8 | HOUSE STYLE: four over-400 files grew | the Evrae commits | back to or below their pre-Evrae length: `engine.ts` 473 (was 476 before Evrae; the counter-input block moved to `counter-inputs.ts` unchanged), `overdrive.ts` 479 (479), `BattleScreen.ts` 902 (911; `measureChain` moved to `BattleEncounterChain.ts#chainLengthOf`, the airship hook is one line), `FFXBattleHud.ts` 1575 (1606; three placement-key helpers moved to `hudPlacementKeys.ts`); `simulate.ts` and `advisor.ts` did not grow | full suite; the Evrae bench rows byte-identical before and after the move |
| 9 | FAR readability; CTB over NEAR's head | measured on the three range rigs: Evrae's right edge is at 1201-1228 px against the CTB column at 1380 px (1600x900), so idle/action/enemy are clear. The overlap in the verifier's still is the **party / victory rigs** (shared, they look at the party; Evrae's box starts at 0.71-0.73 of the width and runs off the right edge) | **not fixed**: a NEAR-specific party rig is a staging change for Bailey's options round; FAR size is the documented head-ratio scale | |

### Measured

- Evrae bench (`critic/bench/evrae/results.json`, 40 seeds): intended 39/40 (unchanged);
  **advisor top row 0/40 → 26/40, stalemates 37 → 0**; Chapter 1 control unchanged.
- Advisor arm on chapters 1-5 (`critic/bench/advisor-v2`, 40 seeds, before/after the stack
  cap): 27, 37, 39, 40, 38 wins, identical.

### Verified

- `npx tsc --noEmit` clean; full `npm test` **255 files, 5,691 passed, 2 skipped, 0 failed**;
  `node tools/orphans.mjs` lists no new module.
- Browser re-run (own Vite on :5571, stopped by Windows PID 17308, nothing left listening;
  `PYREFLY_BROWSER=gpu`, real clock, 1600x900; scratch harness
  `critic/scratch/evrae/fix/fixflow.mjs`, not committed): under the pause, mouse clicks on
  Orders and Pull back leave `airship.order` and the log unchanged, and the pause's own
  CHAPTER tab still takes a mouse click; the CHAPTER tab shows both objectives and all three
  captions whole (no element overflows); after resume, Enter on Orders then Enter still
  sends Pull back; at Wakka's first FAR turn the card reads "Attack → Evrae, Guide's pick,
  450-508"; a NEAR Inhale shows the breath-charge painting on the live actor; the KO pose
  drops the rim to 0 and idle restores 0.7. 0 console errors, 0 failed HTTP requests.
  Stills: `docs/screenshots/chapters/evrae-fix-1..5-*.png`.

### Still open (and owed to Bailey)

- The line's `harmlessTurn` asks for Defend, which FFX's window does not show, so on those
  turns the card falls back to its best simulated row (this is most of the remaining gap
  between the line's 97.5 % and the card's 65 %).
- An attack painting, and a backdrop that matches concept B: both art, both waiting on the
  art method decision.
- The party/victory rigs framing NEAR Evrae under the CTB column; FAR Evrae's size.
- The advisor card still sits over part of the FAR streak (item 2 of "Found, not fixed").
