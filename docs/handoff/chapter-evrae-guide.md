# Handoff — Chapter guide, tactic-line objectives, pause-screen meta and the order widget: Evrae, on the deck of the Fahrenheit (FFX)

> Written 2026-09-22 (Sonnet, workflow sub-agent), following the pattern of
> `docs/handoff/chapter-macalania-guide.md` and `docs/handoff/chapter-leblanc-guide.md`
> (the guide/meta half of an already-engined chapter, before its own integrator
> commit).
>
> **Game case: FFX only** [AGENTS.md rule 14]. Every fact cites
> `research/ffx-evrae-airship.md`; nothing here is true of FFX-2 — the airship
> distance mechanic, Trigger Commands and the three-active/three-reserve bench
> have no X-2 counterpart (§0.4).
>
> **Status: written, green, and deliberately registered nowhere.** The engine
> and the tactic were already built and measured by an earlier track
> (`docs/handoff/chapter-evrae-engine.md`, commits `dc1979f`, `959fade`) and
> are unchanged by this pass except for one fresh, confirming measurement (hard
> rule 3). This pass added the guide, the pause-screen meta, both files' tests,
> and a new, unwired, this-chapter-only HUD element for the still-unpicked
> order widget. Nothing here is registered in `src/data/guides/index.ts`'s
> `GUIDES` or `src/data/chapter-meta.ts`'s `CHAPTER_META`: both carry hard
> length-parity assertions against `CHAPTERS`
> (`tests/unit/strategy-guide.test.ts`, `tests/unit/chapter-meta.test.ts`) that
> fail until `src/data/encounters.ts` (a contract file) widens `ChapterId` and
> adds the chapter record — integrator-only work. `node tools/orphans.mjs`
> reports all four new files as orphans, alongside the engine track's own
> tactic and story files — expected, the same status Leblanc's and
> Macalania's guide files carried before their own integrator commits.

## What already existed (built by the engine track, unchanged here)

| File | What |
|---|---|
| `src/data/ffx/enemies/evrae.ts`, `evrae-abilities.ts` | Evrae `m119` and Cid `m149`, every cell cited |
| `src/data/ffx/builds/fahrenheit.ts` | The six-member party, no Yuna |
| `src/battle/ffx/ai/evrae-rules.ts`, `evrae-counters.ts`, `evrae.ts` (AI) | The range state, order queue, missile economy, two phases, three counters |
| `src/engine/tactics/evrae.ts` | `evrae` — the shipped tactic: pull back on open, revive/un-petrify/heal with one Al Bhed Potion command, do nothing while a breath is charged and the ship is FAR, dodge by pulling back, rotate Lulu → Rikku → Auron through the bench, Slow before Reflect, Reflect near 1/3 HP, Dark Buster + Power Break at NEAR, Cheer/Haste banked at FAR |
| `tests/unit/chapters/evrae-engine.test.ts` | 27 mechanic units + the FFX-only absence tests |
| `tests/unit/strategy-evrae.test.ts` | Headless engine runs, acceptance cases A-1/A-2/A-3/A-4 |

**Re-measured fresh this pass** (hard rule 3 — prove by running, not by citing
an old number):

```
npx vitest run tests/unit/strategy-evrae.test.ts
```

3 tests, all green. A one-off script run through the same harness
(`FFXContentRegistry` + `createFFXEngine` + `fahrenheitBuild` +
`ENEMY_GROUPS_BY_ID['evrae-airship']`), driving every player-input decision
with the shipped `evrae` tactic (falling back to `intendedStrategy`), over the
same 40 contiguous seeds `strategy-evrae.test.ts` uses:

```
EVRAE MEASURE: 39/40 = 97.5%
non-victory seeds: 25
```

This matches `docs/handoff/chapter-evrae-engine.md`'s own reported number
exactly — this run confirms it rather than assumes it, and **no boss number
was touched** [hard rule 6; `memory/boss-side-fix-needs-measured-options`].
The one remaining loss (seed 25) and the three open, unmeasured candidates for
closing it are carried forward from the engine handoff's "Open questions for
Bailey" — not re-litigated here.

## What this pass built

| File | What |
|---|---|
| `src/data/guides/evrae.ts` | `EVRAE_GUIDE` — 5 RULES, 11 HINTS, 1 WATCH (Inhale → Poison Breath), 2 PHASES (the range game above 1/3 HP, "do not poke it from FAR" below). Every sentence cites `research/ffx-evrae-airship.md`. `bossIds: ['evrae']` — a single-boss encounter, no chain. |
| `src/data/chapter-meta-evrae.ts` | `EVRAE_META` — title, subtitle, location, two-sentence blurb, an original Auron quote, a 5-word handwritten aside, three objectives, a tip, three snapshots pointing at art the engine/art track already installed, `focalCharacterId: 'tidus'`, and the two `musicKeys` §12.6 leaves unnamed (C-16) reused as a recorded stopgap plus the shared FFX fanfare. |
| `tests/unit/guide-evrae.test.ts` | 9 tests — the same shape rules `tests/unit/strategy-guide.test.ts` applies to every registered guide (citation regex, 3-5 RULES, short-form length, no duplicate boss ids, one that pins "no elemental weakness" and one that pins "every Slow hint warns about the Reflect bounce"). |
| `tests/unit/chapter-meta-evrae.test.ts` | 14 tests — the same shape rules `tests/unit/chapter-meta.test.ts` applies to every registered chapter (word counts, sentence counts, art-exists checks against `public/art/`, objective-rule sanity against the real ability id). |
| `src/ui/ffx/AirshipOrderWidget.ts` + its scoped rules in `src/ui/ffx/ffx-hud.css` | The order/range widget — see below. |
| `tests/unit/ui-ffx-airship-order-widget.test.ts` | 6 tests (jsdom) — the mount gate, the disabled "Already near/far" row, keyboard reachability, click resolution returning the real unmodified `TriggerCommand`, and that a row the engine did not enable never becomes choosable. |

`chapter-meta-evrae.ts` is 96 lines; `evrae.ts` (the guide) is 149 lines;
`AirshipOrderWidget.ts` is 187 lines. All under the 400-line house-style cap.

## The three objectives, and why they're the shapes they are

This is a single continuous battle with no phase/form field, no chain and no
multi-part formation, so two of the three objectives are the shapes built for
a straight boss fight with a signature threat and a status the fight's only
heal clears:

- **`survived-ability: 'evrae-poison-breath'`** — Poison Breath is the
  chapter's signature threat and the one WATCH entry in the guide
  (`research/ffx-evrae-airship.md` §3.3, §4.5, §8 row 8), the same slot
  Bahamut's Mega Flare and Leblanc's Russian Roulette fill for their
  chapters. Named by the real ability id
  (`src/data/ffx/enemies/evrae-abilities.ts:136`); `abilityMatches()` in
  `src/ui/common/chapterObjectives.ts` accepts an exact id or a `-${want}`
  suffix, so the shorter `'poison-breath'` would also have matched, but the
  full id is written out the same way Macalania's `anima-pain-boss` objective
  chose exactness over relying on the suffix rule. Verified in
  `tests/unit/chapter-meta-evrae.test.ts`.
- **`status-cured: 'petrify'`** — the Al Bhed Potion is this party's only heal
  (no Yuna, no White Magic) and cures Poison, Silence **and Petrify** in one
  cast [§6.4]; a petrified member is one Swooping Scythe from being
  permanently gone, bench slot and all [§3.3 note 3]. This is the guide's own
  second RULE and the chapter's clearest "the mechanic is doing its job"
  signal that isn't the boss fight itself.
- **`victory`** — every chapter has one; unremarkable here.

An earlier draft considered `boss-hp-below: 0.3334` for "reach phase 2" as a
fourth candidate — dropped, because the type only allows three objectives and
the phase transition is already the guide's own PHASES boundary, not a
separate player achievement worth a checklist row.

## The order/range widget — built to a recommendation, not a pick

`docs/concepts/chapters/evrae/widget/options.json` is Bailey's options round
for **O-3** (the order widget) and **O-4** (reading NEAR vs FAR without the
HUD), answered together because the same frame has to answer both. **Bailey
has not picked.** The options file's own `recommendation` field: *"A for the
order, C for the read — they are not exclusive."*

This pass built **option A's half** — the Trigger pair with a cost preview —
as a new, self-contained file:

- `src/ui/ffx/AirshipOrderWidget.ts` renders the two Trigger rows ("Pull
  back" / "Close in", the recommended copy from `special-orders-evrae.ts`'s
  own header, still pending the same approval as the widget itself), disables
  whichever one matches the current range and reads it as "Already near" /
  "Already far" (answering O-4's "readable without the HUD" bar for a player
  who has the panel open), and shows a cost preview on the highlighted row —
  "Turn now · Cid's next turn · 1 volley" with three volley pips — because
  §4.2's whole point is that an order costs three resources for one boolean
  flip and the interface should say so.
- **Mounts only for this chapter.** `AirshipOrderWidget.applies(range)` is
  `true` only when `range` is `'near'` or `'far'` — the exact two values
  `BattleState.flags['airship.range']` ever holds, and no other chapter's
  flags carry that key at all (`docs/handoff/chapter-evrae-engine.md`,
  capability 2). No other chapter's screen can change because of this file.
- **No shared HUD file changed in a way that touches another chapter.**
  `ffx-hud.css` gained one new, additively-appended block of rules, every
  selector scoped under `.ffx-airship-order`/`.ffx-airship-order__*` — new
  class names nothing else in the codebase emits. No existing rule was
  edited. `FFXBattleHud.ts` and `CommandMenu.ts` are untouched; wiring the
  widget into the live command flow is integration work, named below.
- **14 px type floor.** `src/ui/inkgold/screens.css` documents its own sizes
  against a 2.25x reference scale in a trailing comment
  (`font-size: 6.22px; /* 14 */`); every label and value in the widget's CSS
  sizes at or above 6.22 grid px (7.2px and 6.4px), both annotated with the
  same convention.
- **Keyboard reachable.** Wired through `RawInputWatcher`, the same watcher
  every other `src/ui/ffx/` menu overlay (`TriggerPrompt.ts`) uses — arrow
  keys/WASD move the selection, Enter/Space/Z confirms.

**Option C's half of the recommendation — re-staging the camera/backdrop so
the range reads with no persistent gauge — is scene-presentation work, not a
HUD element**, and is out of this track's file ownership
(`src/scenes/**`). This handoff makes no claim about it either way; whoever
owns the scene should read `research/ffx-evrae-airship.md` §12.3 ("the range
state must be readable without the HUD") and the widget options file's C
column before staging it.

**Recorded, never approved.** `docs/target/targets.json` group 7
("chapters") gained a new tile, "Evrae's order/range widget (FFX)", `state:
"gap"`, `pill: "Built to a recommendation — awaiting your pick"`, and its
`reaction.inferred` reads *"built to the driver's recommendation A + C's
staging, awaiting Bailey"* — the same pattern the file already uses for
Macalania's Anima-arrival tile. It is never marked `approved`.

## What still needs Bailey or the integrator, not this pass

1. **The order widget itself is unpicked** — see above. If Bailey picks B or
   a mix instead, `AirshipOrderWidget.ts` and its CSS block are the only
   files that change; nothing else in the codebase references them yet.
2. **`heroArt: 'pause/evrae-chapter-card'`** is an installed CANDIDATE plate
   (`docs/concepts/chapters/evrae/options.json`, boss and backdrop options
   Bailey has separately marked "approved" per `docs/target/targets.json`'s
   Evrae chapter tile — but the *chapter-card* composite itself has not gone
   through its own options round the way the widget has). `heroArtFallback:
   'portraits/tidus.png'` exists today and is used until a dedicated pause
   close-up is commissioned.
3. **`musicKeys: ['scene-gagazet', 'boss-seymour', 'victory-ffx']`** — §12.6
   explicitly records "no source states which track plays for the Evrae
   battle" (C-16). Chapter 1's pair is reused as the recorded stopgap, the
   same pattern Macalania's meta file used; a future music track can compose
   this chapter's own cues and swap both.
4. **`numeral: 'VIII'`** is a placeholder guess (Evrae follows Macalania in
   NOW.md's running numbering of the eventual set), typed loosely via a local
   `DraftChapterMeta` (`string`, not the closed union `ChapterMeta` uses) so
   it costs no edit here if the integrator's actual chapter number differs —
   the same relaxation `chapter-meta-seymour-anima-macalania.ts` used before
   its own promotion.
5. **Integration**, exactly as `docs/handoff/chapter-evrae-engine.md`'s "Owed
   to other tracks" already describes (`encounters.ts`, `chapter-meta.ts`,
   `scenes/index.ts`, `tactics/index.ts`, `guides/index.ts`,
   `tracks/index.ts` + `THEMES.md`), plus these two lines for the
   integrator's single commit:

   ```ts
   // src/data/guides/index.ts
   import { EVRAE_GUIDE } from './evrae.ts';
   // ...appended to GUIDES, in play order:
   EVRAE_GUIDE,
   ```

   ```ts
   // src/data/chapter-meta.ts
   import { EVRAE_META } from './chapter-meta-evrae.ts';
   // ...appended to CHAPTER_META, in play order (once numeral is decided):
   EVRAE_META,
   ```

   And, once the order widget is picked (this file or a replacement), the
   command flow needs one call site that checks
   `AirshipOrderWidget.applies(state.flags['airship.range'])` before falling
   through to the ordinary Trigger rows in `CommandMenu.ts`/`FFXBattleHud.ts`
   — deliberately not written here, since the pick is not yet Bailey's.

## How it was verified

- `npx tsc --noEmit` — clean.
- `npx vitest run tests/unit/guide-evrae.test.ts` — 9 passed.
- `npx vitest run tests/unit/chapter-meta-evrae.test.ts` — 14 passed.
- `npx vitest run tests/unit/ui-ffx-airship-order-widget.test.ts` — 6 passed.
- `npx vitest run tests/unit/strategy-guide.test.ts tests/unit/chapter-meta.test.ts tests/unit/strategy-evrae.test.ts tests/unit/chapters/evrae-engine.test.ts`
  — 129 passed, confirming the new files disturb none of the seven
  already-registered chapters' guide or meta content, and the engine track's
  own suite is unmoved.
- `npx vitest run tests/unit/critic-policy-adoptions.test.ts tests/unit/pause-remake.test.ts`
  — 63 passed, confirming the new `docs/target/targets.json` tile satisfies
  the board's own reaction-shape rules (all six lists, a dated reaction, no
  orphaned `reactionOf`).
- `node tools/orphans.mjs` — all four new files listed, expected, alongside
  the engine track's own tactic and story files.
- A full `npm test` was **not** re-run this pass (usage mode NORMAL per
  NOW.md, but several other workflows are active on the same shared tree —
  a living-portrait rig, a video track, a Leblanc party-art fix — so a
  full-suite run risks racing another agent's in-flight edit rather than
  adding information the targeted runs above don't already cover). The
  integrator's own commit should run the full suite once, per AGENTS.md's
  "Done means".

## Not done in this pass

- The widget options round itself — Bailey has not picked A, B, C or a mix.
- Option C's camera/backdrop staging — scene-presentation work, not owned by
  this file set.
- Chapter registration, the chapter-select card, and the guide/meta/tactic
  registries themselves — all integrator work, per "What still needs Bailey
  or the integrator" above.
- No shared/contract file was edited. `docs/CONTRACT-CHANGES.md` gets no
  entry from this pass.
- The three open, unmeasured candidates for closing the one remaining loss
  (seed 25) that `chapter-evrae-engine.md`'s own "Open questions for Bailey"
  already lists — carried forward, not answered here.
