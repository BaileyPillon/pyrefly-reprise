# Handoff — Chapter 6 guide, tactic-line objectives and pause-screen meta: the Leblanc Syndicate (FFX-2)

> **Track G of `docs/plans/chapter-leblanc-review.md` §8**, plus the objectives
> and meta text `docs/plans/chapter-leblanc-review.md` §8's Track I table lists
> under `src/data/chapter-meta.ts`. Written 2026-09-21 (attempt 3, Sonnet, high
> effort — Opus was down with an API-wide incident; nothing here needed the
> engine, only the already-shipped engine and AI scripts).
>
> **Game case: FFX-2 only** [AGENTS.md rule 14]. Every fact cites
> `research/ffx2-leblanc-syndicate.md`; nothing here exists in FFX.
>
> **Status: written, green, and deliberately registered nowhere.** Both new
> files are unregistered for the same reason
> `src/engine/tactics/ffx2-leblanc.ts` already is
> (`docs/handoff/chapter-leblanc-engine.md`): the shared registries they'd join
> are integrator-only (`docs/plans/chapter-leblanc-review.md` §8, Track I), and
> two of them (`src/data/guides/index.ts`'s `GUIDES`, `src/data/chapter-meta.ts`'s
> `CHAPTER_META`) carry hard length/parity assertions against `CHAPTERS` that
> would fail before `src/data/encounters.ts` (a contract file) registers this
> chapter. `node tools/orphans.mjs` reports both new files as orphans — expected,
> the same list the tactic and story files are already on.

## What was built

| File | What |
|---|---|
| `src/data/guides/ffx2-leblanc.ts` | `FFX2_LEBLANC_GUIDE` — 5 RULES, 9 HINTS, empty WATCH (no ability in this fight emits a `charge` event), 3 PHASES (one per act). Every sentence cites `research/ffx2-leblanc-syndicate.md`. `bossIds` lists all 8 ids across the three acts (`leblanc`, `logos`, `ormi`, `logos-room`, `ormi-logos-room`, `ormi-entrance`, `dr-goon`, `fem-goon`), the same pattern `ffx2-vegnagun-shuyin.ts` uses for its five-link chain. |
| `src/data/chapter-meta-ffx2-leblanc.ts` | `FFX2_LEBLANC_META` — title, subtitle, location, two-sentence blurb, an original in-voice quote, a 4-6 word handwritten aside, three objectives, a tip, three snapshots (all pointing at art already on disk), `focalCharacterId: 'leblanc'`, and three `musicKeys` Track H still owes. |
| `tests/unit/guide-ffx2-leblanc.test.ts` | 9 tests — the same shape rules `tests/unit/strategy-guide.test.ts` applies to every registered guide (citation regex, 3-5 RULES, short-form length, no duplicate boss ids), plus one that pins "no cure for Eject" so a future edit can't quietly contradict §4.3. |
| `tests/unit/chapter-meta-ffx2-leblanc.test.ts` | 13 tests — the same shape rules `tests/unit/chapter-meta.test.ts` applies to every registered chapter (word counts, sentence counts, art-exists checks against `public/art/`, objective rule sanity against the actual ability ids the AI scripts use). |

Both files are under the 400-line house-style cap (149 and 108 lines).

## The two objectives that needed a decision, and why they're sourced the way they are

`ChapterObjective.rule` only has eight shapes (`src/data/chapter-meta.ts`'s
`ObjectiveRule`). This chapter has no phase/form, no chain counter and no
multi-part formation, so two of the three objectives are the two shapes that
fit a straight boss fight:

- **`survived-ability: 'russian-roulette'`** — Logos' Russian Roulette is the
  chapter's signature threat (Death / Eject / Petrify / Silence / Curse /
  Poison, one roll per use) [§4.2, §4.3], the same slot Bahamut's Mega Flare
  and Seymour's Total Annihilation fill for their chapters. The ability's real
  id is `x2-logos-russian-roulette`; `abilityMatches()` in
  `src/ui/common/chapterObjectives.ts` matches an exact id **or** a `-${want}`
  suffix — Chapter 5's `'terror-of-zanarkand'` in `chapter-meta.ts` matches
  the real, `x2-`-prefixed id `x2-shuyin-terror-of-zanarkand` the same way, so
  `'russian-roulette'` is consistent with house style, not a guess. Verified
  against the real ability id in `tests/unit/chapter-meta-ffx2-leblanc.test.ts`.
- **`status-cured: 'protect'`** — Not-So-Mighty Guard applies Protect, Shell
  and Regen in one cast [§4.4], and Dispel removes all three at once
  (`DISPEL_REMOVES`, already true of the engine — no change needed). The rule
  only takes one status; `'protect'` is the guard's headline effect and the
  one the tactic and guide both lead with. Any of the three would satisfy the
  same player action, which the test asserts (`toContain(['protect', 'shell',
  'regen'])`) rather than pinning the exact choice, so the integrator can
  retarget it without a contradiction if Bailey prefers a different one.
- **`victory`** — every chapter has one; unremarkable here.

## What still needs Bailey or the integrator, not this track

1. **Chapter number.** `docs/handoff/chapter-leblanc-engine.md` §8 item 5 is
   still open. `FFX2_LEBLANC_META.numeral` is typed loosely (`string`, not the
   closed `'I'|...|'V'` union) and set to the placeholder `'VI'` on the
   assumption it lands after Vegnagun — `docs/handoff/chapter-leblanc-script.md`
   independently calls this "Chapter 6" in its own title, so the two guesses
   agree, but neither is a decision.
2. **`heroArt: 'pause/ffx2-leblanc'`** has no rendered file yet (by convention,
   same as every other chapter's `heroArt` before its own pause portrait is
   painted) — `heroArtFallback: 'portraits/leblanc.png'` exists on disk today
   and is used until then. Both paths, and the three snapshot images, point at
   art from the chapter's **first, CANDIDATE-flagged** art pass
   (`docs/concepts/chapters/leblanc/production.md`) — real, on disk, but not
   Bailey-approved. The integrator (or a future art track) should re-check
   these paths once the art track that follows resolves the CANDIDATE flag,
   in case a file gets renamed or replaced.
3. **`musicKeys: ['scene-chateau-leblanc', 'boss-leblanc', 'victory-ffx2']`**
   name the two cues `docs/plans/chapter-leblanc-review.md` §8 Track H still
   owes (`src/audio/tracks/boss-leblanc.ts`, `scene-chateau-leblanc.ts`) plus
   the cue Chapter 5 already registers. They are not yet real `MusicKey`
   entries in `src/audio/tracks/index.ts`'s contract list
   (`docs/CONTRACT-CHANGES.md` §8), so `tests/unit/chapter-meta.test.ts`'s
   cross-check against `Chapter.music` cannot run against them until Track H
   and Track I both land — this is recorded, not invented, the same status
   `chapter-leblanc-engine.md` §7 gives Delay's unpublished magnitude.
4. **Integration, exactly as `chapter-leblanc-engine.md` and
   `chapter-leblanc-script.md` already describe for their own files.** The
   integrator's single commit (with `src/data/encounters.ts`,
   `src/engine/tactics/index.ts`, `src/battle/ffx2/ai/index.ts`,
   `src/scenes/index.ts`, `src/audio/tracks/index.ts` and the chapter-select
   card) also needs, for these two files:

   ```ts
   // src/data/guides/index.ts
   import { FFX2_LEBLANC_GUIDE } from './ffx2-leblanc.ts';
   // ...appended to GUIDES, in play order:
   FFX2_LEBLANC_GUIDE,
   ```

   ```ts
   // src/data/chapter-meta.ts
   import { FFX2_LEBLANC_META } from './chapter-meta-ffx2-leblanc.ts';
   // ...appended to CHAPTER_META, in play order:
   FFX2_LEBLANC_META,
   ```

   Once `ChapterId` widens to include `'ffx2-leblanc'` (Track A, already
   described in `chapter-leblanc-engine.md`), `FFX2_LEBLANC_META`'s `id` and
   (once its real numeral is chosen) `numeral` fields typecheck against the
   real `ChapterMeta` shape with no further edit — `DraftChapterMeta` in
   `chapter-meta-ffx2-leblanc.ts` only ever relaxed those two fields, and the
   object literal itself needs no change to satisfy the tighter type.

## Measured: the shipped line, 40 seeds, zero decision time

Run fresh this track, not copied from the earlier engine handoff, per hard
rule 3 (prove by running):

```
npx vitest run tests/unit/strategy-ffx2-leblanc.test.ts
```

```
D = 0 ms    | 40/40 | median 45 player turns | median 59.5 s
D = 1500 ms |  4/40 | median 57 player turns | median 145.7 s
D = 4000 ms |  0/40 | median 30 player turns | median 139.8 s
```

**40/40 (100 %) at D = 0**, matching `docs/handoff/chapter-leblanc-engine.md`
§1's A1 row exactly — the tactic and its test have not moved since that track
landed, and this run confirms it rather than assumes it. No number was tuned
to get this result [hard rule 6, `memory: boss-side-fix-needs-measured-options`];
the guide and objectives built here describe the tactic that already won.

## How it was verified

- `npx tsc --noEmit` — clean.
- `npx vitest run tests/unit/guide-ffx2-leblanc.test.ts` — 9 passed.
- `npx vitest run tests/unit/chapter-meta-ffx2-leblanc.test.ts` — 13 passed.
- `npx vitest run tests/unit/strategy-guide.test.ts tests/unit/chapter-meta.test.ts tests/unit/chapters/leblanc-engine.test.ts tests/unit/strategy-ffx2-leblanc.test.ts`
  — 111 passed, confirming the two new files disturb none of the five shipped
  chapters' guide or meta content, and the engine track's own suite is
  unmoved.
- `PYREFLY_MEASURE` not needed — `strategy-ffx2-leblanc.test.ts` already
  prints the win-rate table above on a plain run; see it in this file's
  "Measured" section.
- `node tools/orphans.mjs` — both new files listed, expected, same status as
  the tactic and story files.
- One full `npm test` was **not** re-run this track (usage mode NORMAL, but
  two other workflows are active on the same tree per the shared-working-tree
  note in this brief; the targeted run above covers every file this track
  touched or could plausibly affect). The integrator's own commit should run
  the full suite once, per `AGENTS.md`'s "Done means".

## Not done in this track

- Everything Track H and Track I own (art approval, audio files, chapter
  registration, chapter-select card, scene wiring) — unchanged from
  `chapter-leblanc-engine.md` §7 and `chapter-leblanc-script.md`.
- **A10** (real-input browser route) and **A12** (target-versus-build pairs) —
  both are integration-step items per `chapter-leblanc-engine.md` §7.
- No shared/contract file was edited. `docs/CONTRACT-CHANGES.md` gets no entry
  from this track.
