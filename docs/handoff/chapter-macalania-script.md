# Chapter 6 — Macalania: the story script (T5)

**Track:** T5 Story, `docs/plans/chapter-macalania-review.md` §8.2.
**Game case: FFX only.** Every beat is FFX's Macalania Temple story
(`research/ffx-seymour-anima-macalania.md` §9.6/§9.7, `[verified: 2 sources]`);
none of it is true of FFX-2, and nothing here is shared plumbing. Hard rule 14.
The absence test is `names no FFX-2 speaker or character` in the test file.

**Status:** written, type-clean, 25 cases green. **Not registered anywhere** —
`src/story/registry.ts`, `src/story/index.ts` and `src/data/encounters.ts` are
integrator-only (plan §8.1).

## Files

| File | What |
|---|---|
| `src/story/scripts/seymour-anima-macalania.ts` | The chapter's `ChapterScripts`: `pre`, `post`, `victoryQuips`, three `mid` triggers and their `midScripts`. 300 lines, about half provenance. |
| `tests/unit/chapters/macalania-story.test.ts` | 25 cases: speaker union, casting, line cap, ellipsis discipline, structure, trigger wiring, and the canon-order cases. |

### Filename — read this before wiring anything

The brief for this track named the file `src/story/scripts/seymour-macalania.ts`.
**It was written as `seymour-anima-macalania.ts` instead**, because that is the
name `docs/plans/chapter-macalania-review.md` §8.2 gives it and because every
other track in this chapter already landed on that stem (`src/battle/ffx/ai/`,
`src/data/ffx/enemies/`, `src/data/guides/`, `src/engine/tactics/`). Export:
`seymourAnimaMacalaniaScripts`, plus a default export.

## What the integrator adds

1. `src/story/registry.ts` — the chapter key, and an **empty**
   `AI_EMITTED_TRIGGERS` entry: this chapter emits no AI-side `script-trigger`s,
   only the three `MidBattleTrigger`s below.
2. `tests/unit/story-scripts.test.ts` — one row in `CHAPTERS`. The duplicated
   house-style cases in `macalania-story.test.ts` can then be deleted; the
   canon-order cases cannot, they are this chapter's own.
3. Nothing else. No contract change, no `CONTRACT-CHANGES.md` entry.

## The beats

### Pre-battle (§9.6 beats 3–8, in this order)

| # | Beat | Where |
|---|---|---|
| — | Held establishing frame of the **empty** antechamber (§9.1 asks for it by name) | `fade('clear')` + `wait(2000)` under `scene-macalania-temple` |
| 4 | Tromell's gifts, off-screen, carried in on them | Wakka, two lines; Lulu closes it |
| 3 | The sphere the guardians watched in the Nuns' Chamber | Tidus, Lulu, Rikku |
| 5 | The confrontation, **before Yuna is out of the Chamber** | Seymour is already in the room; he does not enter |
| 6 | He does not deny the patricide — he explains it | three Seymour lines, then Auron's "Let him finish." |
| 6b | He works out what Yuna was really planning and says so | "She came to be alone in a room with me." |
| 7 | Yuna emerges with Shiva; he stops pretending | `sfx('chamber-door')`, `fx('shiva-seal', 'yuna')` |
| 7b | **The "Yes." beat** — "You came here to kill me." / "Yes." | once per chapter, unqualified, cut away two lines later |
| 8 | Guardians step in, `boss-seymour-macalania`, `battleStart()` | Trigger Commands are the engine's, not the script's |

The one tension-release line (§2.1, one per scene) is Rikku's on the
architecture, placed at the top so it defuses the walk-in rather than the
sphere. Kimahri gets **one** line, after a silence (§1.7).

### Mid-battle — where each line fires

| Script id | Trigger | Fires when | Lines |
|---|---|---|---|
| `mac-anima-summon` | `hp-below seymour-macalania 0.5` | Seymour crosses **3,000 of 6,000** — the engine's own `SUMMON_HP_THRESHOLD` (§5.2) | Yuna names an aeon before the player sees it; Seymour one line |
| `mac-first-boost` | `ability-used anima-macalania anima-boost` | the **first** Boost, `once: true` | Rikku reads the window (she is right on the technical point, §1.15); Lulu supplies the consequence, not an instruction |
| `mac-seymour-restored` | `hp-below anima-macalania 0` | Anima reaches 0 and `macalania-rules.ts#dismissAnima` gives Seymour his bar back | Wakka reacts; Auron says the thesis in six words |

**Why `hp-below 0` and not `ko` for the third one.** `dismissAnima` sets
`anima.removed = true` / `flags.hidden = true`; it never calls `koActor`, so
`collectSignals` produces no `ko` and no `part-destroyed` for her. A `ko`
trigger would never fire. `matches()`'s `hp-below` branch is a state read —
`c.hp <= Math.floor(c.stats.maxHp * 0)` — so it fires on the first evaluation
after she hits 0 and is correct whether the transition has run yet or not.
Before the summon she is `removed` at 18,000 HP, so it cannot fire early.

### Post-battle (§9.7 beats 9–12)

`results()` first, with its flourish (this is not Chapter 4). Then: he is
**properly dead**, flat and silent, no pyreflies — Flux dissolves, this one just
stops. Yuna kneels to send and gets three steps in. The Guado take the body,
refuse her, **destroy Jyscal's sphere**, and brand the party traitors. Yuna:
"...I didn't send him." Kimahri: "Then he does not rest." They run. Then the
Tidus narration interlude, four lines, past tense, placed last.

`victoryQuips` are written but short — the party has just won and lost at the
same time and none of them knows it yet.

## Three lines the owner should read

These are the three I am least sure of. Each is one line from being changed.

1. **`mac-anima-summon`, Seymour: "She has waited a long time for this."**
   It gestures at Anima being his mother without stating it. In FFX the party
   does not learn that here, and I could not source a point at which Seymour
   says it aloud at Macalania, so the line is deliberately deniable. If that
   reads as a wink the audience cannot cash, cut it to `'Come.'` — the §1.9
   rhetorical invitation — and the beat still works on Yuna's line alone.

2. **Post-battle: Tromell's four lines are `say('none', ...)`.**
   There is no `'tromell'` `SpeakerId` and no painting; plan §6.1 lists him as
   "NEW, and optional… ask before commissioning". `'none'` renders with no name
   plate, which `yunalesca.ts` already does for the herald. It works, but the
   most important injustice in the chapter is currently delivered by an unnamed
   voice. If Bailey wants Tromell named, it is a `SpeakerId` addition (a
   contract change) plus a portrait, and the four lines move across unchanged.

3. **Pre-battle, Yuna: "Maester Seymour."** — the honorific held one last time,
   two lines before she says "Yes." to killing him. It is the sharpest thing in
   the scene to me and also the easiest to read as cold. The alternative is
   silence: cut the line, let Seymour speak into it, and the "Yes." lands
   heavier but the arc of her dropping the honorific is lost.

## Verified

- `npx vitest run tests/unit/chapters/macalania-story.test.ts` — 25 passed.
- `npx tsc --noEmit` — clean.
- Line cap, ellipsis discipline, speaker union, cast list, trigger wiring and
  the canon-order assertions are all in that file, not in this note.

## Open for Bailey

Listed in the track's return JSON; the three above are the ones that change
lines. Nothing here builds a new look, sound or interaction — the two cue ids
(`scene-macalania-temple`, `boss-seymour-macalania`) are left as ids for T8 and
Bailey's ear (hard rule 13), and the two new VFX keys (`shiva-seal`,
`sending-dance` reuse) point at §6.2's already-planned art items.
