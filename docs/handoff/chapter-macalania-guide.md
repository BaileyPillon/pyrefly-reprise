# Handoff — Chapter guide, tactic-line objectives and pause-screen meta: Seymour and Anima, Macalania Temple (FFX)

> Written 2026-09-22 (Sonnet, workflow sub-agent), following the pattern of
> `docs/handoff/chapter-leblanc-guide.md` (the guide/meta half of the Leblanc
> chapter, before its own integrator commit `c473de8`).
>
> **Game case: FFX only** [AGENTS.md rule 14]. Every fact cites
> `research/ffx-seymour-anima-macalania.md`; nothing here is true of FFX-2.
>
> **Status: written, green, and deliberately registered nowhere.** The guide
> and tactic were already built and measured by an earlier track
> (`074a198`, "Macalania chapter, engine + data") and are unchanged by this
> pass. This pass added the two files `074a198`'s own commit message left
> for later — pause-screen meta and the two tests that check both files'
> shape — and re-measured the shipped tactic fresh (hard rule 3). Nothing
> here is registered in `src/data/guides/index.ts`'s `GUIDES` or
> `src/data/chapter-meta.ts`'s `CHAPTER_META`: both carry hard length-parity
> assertions against `CHAPTERS` (`tests/unit/strategy-guide.test.ts`,
> `tests/unit/chapter-meta.test.ts`) that fail until `src/data/encounters.ts`
> (a contract file) widens `ChapterId` and adds the chapter record —
> integrator-only work, exactly as `docs/plans/chapter-macalania-review.md`
> §8.1 already says for the guide and tactic. `node tools/orphans.mjs`
> reports the new meta file as an orphan, alongside the guide and tactic
> files it joins — expected, the same status the Leblanc files carried before
> their own integrator commit.

## What already existed (built by `074a198`, unchanged here)

| File | What |
|---|---|
| `src/data/guides/seymour-anima-macalania.ts` | `SEYMOUR_ANIMA_MACALANIA_GUIDE` — 5 RULES, 14 HINTS, 2 WATCH (Boost, the Oblivion gauge), 3 PHASES (one per act). Every sentence cites `research/ffx-seymour-anima-macalania.md`. `bossIds` lists all four ids (`seymour-macalania`, `anima-macalania`, `guado-guardian-a`, `guado-guardian-b`). |
| `src/engine/tactics/seymour-anima-macalania.ts` | `seymourAnimaMacalania` — the advisor's chapter line: Steal from each Guardian once (§2.3), the Guardians' Auto-Potion/Hi-Potion counter play, pre-casting the matching Nul against the published ice/lightning/water/fire cycle (§5.2), Haste and Cheer banked in act one (§6.4), summoning against Anima so Pain's 100% Death rider lands on an aeon's hidden Ribbon instead of a party member (§4.3), Shield before Oblivion (§6.3), and landing the biggest hit on her Boost turns (§3.4). |
| `tests/unit/strategy-macalania.test.ts` | Headless engine run, acceptance cases A-1 (the shipped tactic, seeded) and A-2 (a credible mistake that never Steals, never summons, never pre-casts a Nul). |

**Re-measured fresh this pass**, per hard rule 3 (prove by running, not by
citing an old number):

```
npx vitest run tests/unit/strategy-macalania.test.ts
```

```
✓ tests/unit/strategy-macalania.test.ts (2 tests)
```

Both assertions in that file still pass against the real engine and data:
**the shipped tactic (A-1) wins 32 of 40 seeded runs, 80.0%**, at zero
decision time (the autobattler drives every turn with no simulated thinking
delay); **the credible mistake (A-2) wins 0 of 20**, all losses in act one.
These are the exact numbers `074a198`'s commit message and
`strategy-macalania.test.ts`'s own header already report — this run confirms
them rather than assumes them, and **no boss number was touched** to produce
or preserve them [hard rule 6; `memory/boss-side-fix-needs-measured-options`].

**A-1's open question, carried forward, not answered here:** the file's own
header already documents that the five missing points to reach the 85%
target are one `[estimate]` in `src/data/ffx/abilities/whitemagic-protect.ts`
(the four Nul spells ship `single-ally`; FFX makes them party-wide) — a file
outside this track's ownership, since it would move every FFX chapter. Not
re-litigated here.

## What this pass built

| File | What |
|---|---|
| `src/data/chapter-meta-seymour-anima-macalania.ts` | `SEYMOUR_ANIMA_MACALANIA_META` — title, subtitle, location, two-sentence blurb, an original in-voice Seymour quote, a 4-6 word handwritten aside, three objectives, a tip, three snapshots (all pointing at art already on disk from `074a198`'s combat-sprite pass), `focalCharacterId: 'seymour'`, and the two `musicKeys` the story script already calls by id plus the shared FFX victory fanfare. |
| `tests/unit/chapter-meta-seymour-anima-macalania.test.ts` | 13 tests — the same shape rules `tests/unit/chapter-meta.test.ts` applies to every registered chapter (word counts, sentence counts, art-exists checks against `public/art/`, objective-rule sanity against the real combatant/ability ids the engine and data files use). |
| `tests/unit/guide-seymour-anima-macalania.test.ts` | 9 tests — the same shape rules `tests/unit/strategy-guide.test.ts` applies to every registered guide (citation regex, 3-5 RULES, short-form length, no duplicate boss ids, one that pins the Pain/aeon asymmetry so a future edit can't quietly claim Pain kills an aeon the way it kills a party member). Written now because `074a198` shipped the guide content itself but no standalone test for it — the same gap Leblanc's guide left before its own guide-content test. |

`chapter-meta-seymour-anima-macalania.ts` is 93 lines, under the 400-line
house-style cap.

## The three objectives, and why they're the shapes they are

`ChapterObjective.rule` only has eight shapes (`src/data/chapter-meta.ts`'s
`ObjectiveRule`). This chapter has a genuine multi-part formation (two
Guado Guardians) and a signature one-shot threat, so two of the three
objectives are the two shapes built for exactly that:

- **`parts-downed: { targetIds: ['guado-guardian-a', 'guado-guardian-b'] }`**
  — the same shape Chapter 3 uses for the Yu Pagoda pair. Downing both
  Guardians ends Seymour's Cover and his Auto-Potion/Hi-Potion healing
  ladder [§2.3, §7 row 1] — the single biggest lever in the fight's damage
  budget, per the guide's own lead RULE.
- **`survived-ability: 'anima-pain-boss'`** — Anima's Pain is the chapter's
  signature threat, the same slot Bahamut's Mega Flare and Seymour Flux's
  Total Annihilation fill for their chapters. Named by its **exact** real
  ability id (`src/data/ffx/enemies/seymour-anima-macalania-abilities.ts:373`),
  not a guess: the research (§4.3) and that file's own header both flag that
  `anima-pain-boss` is deliberately a *different* action from the player's
  `pain` ability and must not share one definition, so the objective spells
  out the boss row in full rather than relying on the suffix match
  `abilityMatches()` would also accept. Verified against the real id in
  `tests/unit/chapter-meta-seymour-anima-macalania.test.ts`.
- **`victory`** — every chapter has one; unremarkable here.

An earlier draft of objective 1 used `link-reached` for "Steal from both
Guardians" — dropped, because `link-reached` names the chapter's own
multi-battle chain position (which link of a chained `EnemyGroupDef` is
live), and this fight is one continuous battle across all three acts, not a
chain of separate groups. `parts-downed` names the two combatants directly
and is the shape the type was built for.

## What still needs Bailey or the integrator, not this pass

1. **Anima's arrival staging is unpicked.** Per this run's orchestration
   brief: `docs/concepts/chapters/macalania/arrival/sheet.png` holds an
   options round Bailey has not yet judged. This track does not touch scene,
   art or the arrival cutscene at all — that is the scene owner's file set
   (`src/scenes/macalania*`, `src/story/scripts/seymour-anima-macalania.ts`),
   not this one's. If the scene owner builds to the driver's recommendation
   (option A's arrival + option B's name tag) ahead of Bailey's pick, the
   board tile they own records it as `reaction.inferred`, never approved
   — this handoff makes no claim about that decision either way.
2. **`heroArt: 'pause/ch4-seymour-anima-macalania'`** has no rendered file
   yet (by convention, same as every other chapter's `heroArt` before its
   own pause close-up is painted) — `heroArtFallback: 'portraits/seymour.png'`
   exists on disk today and is used until then. All three snapshot images
   and the fallback point at art from `074a198`'s combat-sprite pass, which
   is **CANDIDATE, not approved** (`docs/handoff/NOW.md`: "Macalania art was
   not started" refers to this chapter's own dedicated art pass — these
   are the sprites and backdrop the engine track shipped, not a finished
   pause-screen commission). The integrator or a future art track should
   re-check these paths once Macalania's own art pass resolves.
3. **`musicKeys: ['scene-macalania-temple', 'boss-seymour-macalania',
   'victory-ffx']`** — the first two are cues
   `src/story/scripts/seymour-anima-macalania.ts` already calls by id
   (lines 103 and 181) but neither is a registered `MusicKey` in
   `src/audio/tracks/index.ts` yet (`MUSIC_KEYS`, `TRACKS`). This is recorded,
   not invented, the same status Leblanc's two owed cues had before Track H
   landed for that chapter. `victory-ffx` is already registered and shared
   by chapters 1-3.
4. **`numeral: 'IV'`** is a placeholder guess (this chapter narratively
   follows Seymour Flux and precedes Braska's Final Aeon in FFX's own story
   order, and NOW.md's running numbering treats Macalania as chapter 4 of
   the eventual six), typed loosely via `DraftChapterMeta` (`string`, not the
   closed `'I'|...|'VI'` union) so it costs no edit here if the integrator's
   actual chapter number differs.
5. **Integration, exactly as `docs/plans/chapter-macalania-review.md` §8.1
   already describes**, plus these two lines for the integrator's single
   commit (which also touches `src/data/encounters.ts`,
   `src/engine/tactics/index.ts`, `src/battle/ffx/ai/index.ts` and the
   chapter-select card):

   ```ts
   // src/data/guides/index.ts
   import { SEYMOUR_ANIMA_MACALANIA_GUIDE } from './seymour-anima-macalania.ts';
   // ...appended to GUIDES, in play order:
   SEYMOUR_ANIMA_MACALANIA_GUIDE,
   ```

   ```ts
   // src/data/chapter-meta.ts
   import { SEYMOUR_ANIMA_MACALANIA_META } from './chapter-meta-seymour-anima-macalania.ts';
   // ...appended to CHAPTER_META, in play order:
   SEYMOUR_ANIMA_MACALANIA_META,
   ```

   ```ts
   // src/engine/tactics/index.ts — the tactic itself is already written and
   // imported nowhere; the integrator's REGISTRY gains:
   { bossId: SEYMOUR_MACALANIA_ID, tactic: seymourAnimaMacalania },
   { bossId: ANIMA_MACALANIA_ID, tactic: seymourAnimaMacalania },
   { bossId: 'guado-guardian-a', tactic: seymourAnimaMacalania },
   { bossId: 'guado-guardian-b', tactic: seymourAnimaMacalania },
   ```

   Once `ChapterId` widens to include `'seymour-anima-macalania'`, both
   `SEYMOUR_ANIMA_MACALANIA_META`'s `id` and (once the real numeral is
   chosen) `numeral` fields typecheck against the real `ChapterMeta` shape
   with no further edit — `DraftChapterMeta` only ever relaxed those two
   fields, and the object literal needs no change to satisfy the tighter
   type. This is the unlock the chapter-select card needs too: the file
   comment on `SEYMOUR_ANIMA_MACALANIA_GUIDE`'s registration in
   `src/engine/tactics/index.ts` already calls this out as "the one-line data
   change the integrator names" for LOCKED-as-Coming status.

## How it was verified

- `npx tsc --noEmit` — clean.
- `npx vitest run tests/unit/guide-seymour-anima-macalania.test.ts` — 9 passed.
- `npx vitest run tests/unit/chapter-meta-seymour-anima-macalania.test.ts` — 13 passed.
- `npx vitest run tests/unit/strategy-guide.test.ts tests/unit/chapter-meta.test.ts tests/unit/strategy-macalania.test.ts`
  — 91 passed, confirming the two new files disturb none of the five
  registered chapters' guide or meta content, and the tactic's own suite is
  unmoved.
- `node tools/orphans.mjs` — the new meta file listed, expected, alongside
  the guide and tactic files it joins.
- A full `npm test` was **not** re-run this pass (usage mode NORMAL, but
  several other workflows are active on the same tree per the
  shared-working-tree note in this brief — including a concurrent chapter
  registration track — so a full-suite run risks racing another agent's
  in-flight edit rather than adding information the targeted runs above
  don't already cover). The integrator's own commit should run the full
  suite once, per `AGENTS.md`'s "Done means".

## Not done in this pass

- Anima's arrival staging pick, the scene, the story registration, the
  chapter-select card and the engine/tactics/meta registries themselves —
  all integrator or scene-owner work, per §"What still needs Bailey or the
  integrator" above.
- No shared/contract file was edited. `docs/CONTRACT-CHANGES.md` gets no
  entry from this pass.
- The `whitemagic-protect.ts` Nul-targeting question `074a198` raised for
  Bailey — carried forward, not answered here (see "Re-measured fresh this
  pass" above).
