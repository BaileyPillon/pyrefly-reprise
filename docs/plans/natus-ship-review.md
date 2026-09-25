# Paper preflight: Chapter X ship layer, the one deep-class change (Mortibody comes back)

Rule 15 preflight for the only part of the Chapter X ship layer that `critic-plan --paths`
classes as **DEEP** (the battle presenter). Written 2026-09-25 by the Natus ship sub-agent,
before the change was built. Everything else in the ship layer (scene, story, meta, guide,
tactic) is chapter-own and unlisted.

## The defect, proved by running it (rule 3)

The real engine and the real `BattlePresenter` on a `FakeStage`, the chapter record's build and
formation, the shipped line with its swings aimed at the mount, played up to the first
Mortibsorption (`tests/unit/chapters/natus-ship-content.test.ts` pins it):

| Chapter | Seed | Mount on stage after the drain | Calls on the mount |
|---|---:|---|---|
| X Natus (unlisted) | 1 | **no** | `dissolve=1`, `remove`, `remove` |
| I Seymour Flux (live) | 2 | **no** | `dissolve=1`, `remove`, `remove` |

The engine emits `ko` then `part-destroyed` for the mount, then `message` "uses
Mortibsorption", the drain `damage` on the host and a `heal` on the mount (`cause:
'mortibsorption'`, `src/battle/ffx/scripted.ts#mortibsorption`), and **no** `revive` or
`part-restored`. The presenter sends a fiend at `ko` (`BattlePresenterBeats.ts#ko`: dissolve,
then `removeCombatant`) and removes it again at `part-destroyed`, so the `heal` finds no actor.
From the first KO onward the mount is alive, acts and can be targeted, and nobody can see it.

## The change (FFX only for the kind; the plumbing is shared, "both")

- A new departure kind **`'returns'`** in `BattlePresenterDepartures.ts`, given only to
  `mortibody`: the fiend's pyrefly dissolve, but the figure is **kept** on the stage, marked.
  Source: research §4.4 [verified: 4 sources] and §4.5 ("Mortibody has no death state of its
  own: it always revives", [derived]), and Bailey's O-2 A pick with its KO-and-revive strip
  (`docs/concepts/chapters/natus/INSTALLED.md`: "the engine's pyrefly dissolve ... and the same
  idle coming back weaker").
- `part-destroyed` does not remove a kept figure; the `heal` that revives it fades it back in
  (`BattlePresenterArrivals.ts#comeBack`). `BattlePresenterEvents.ts` (over 400 lines) changes
  two lines in place and does not grow.
- **Chapter I's Mortiorchis is not changed** (the Natus plan's R1: a Chapter I finding is
  reported, not fixed in passing). The same one-line table entry would fix it; that is the
  driver's call, reported.

## What could go wrong, and the guard

| Risk | Guard |
|---|---|
| Another chapter changes | The kind is keyed by the id `mortibody`; every other id keeps its kind (`departure-poses`, `presenter-departures` suites). |
| The victory beat hangs on the kept figure | `depart` runs the dissolve under the same one-deadline budget as every departure (`departureMs('returns')`, the 620 ms send). |
| A kept figure never comes back (Natus dies on the same blow) | It stays dissolved at alpha 0: what the old path showed, minus the removal. |
| Any heal on a figure that is not kept | `comeBack` only acts on a marked figure; every other heal is byte-identical. |

Checks: the unit pin above (before: removed; after: back at alpha 1), the presenter suites,
tsc, the full vitest once, and a browser frame after a real Mortibsorption.
