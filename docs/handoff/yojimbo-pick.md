# Chapter IX (Yojimbo): Bailey's 2026-09-26 pick, built

**Game case: FFX only** (Lady Ginnem's Yojimbo, Ronso Rage, the Cavern's Ghost). The hidden-row
mechanism in `src/ui/common/objectiveReveal.ts` is shared presentation plumbing (both games), and
only Chapter IX uses it.

Branch `yojimbo-pick-0926` (worktree `D:/pyrefly-yojimbo-pick`). Not merged, not deployed.

## What Bailey picked

Bailey, 2026-09-26 ~18:45 EDT: "I'll go with all of your recommendations", covering P-1 and P-2
of `docs/plans/yojimbo-faithfulness-2026-09-26.md`:

- **P-1 `not-learned`**: Kimahri arrives without Doom. This re-opens D-056. The opening three
  stay Lulu, Kimahri, Yuna (D-066).
- **P-2 (b)**: the card's Doom row reads "???" until Doom lands or the player loses once.

`docs/target/decisions.json` is not edited here. The driver records the new decision and the
D-056 re-open.

## What changed

| Step | Commit | Files |
|---|---|---|
| 1. The switch | `ed3599d6` | `src/data/ffx/builds/yojimbo-cavern.ts`: `CavernDoomPrep`, `CAVERN_DOOM_PREP = 'not-learned'`, `buildCavernParty(prep)`. Tests pin the value, and a Doom-mechanic test runs on `buildCavernParty('preloaded')` |
| 2. The ??? row | `89ad246d` | `ChapterObjective.hideUntilLoss`, `objectiveReveal.ts` (a session-only set of lost chapters), `GameFlow` notes a defeat, the evaluator and prep card show "???", and the pause headline skips a secret row |
| 3. Guide and tactic | `a1093aa2` | The guide opens on the race and names Doom nowhere. The tactic code is unchanged, because it only picks Doom when Doom is a menu row |

Kimahri's gauge for each value: `not-learned` 45 (the labelled estimate in
`research/ffx-seymour-flux.md` C-16; no source gives a Cavern-time value), `preloaded` 100 (the
Lancet rule, §7.9.2), `learned-spent` 0 (our estimate, from the audit's P-1 table). The gauge does
not move either line: `not-learned` with gauge 100 measures the same.

The card copy in `src/data/chapter-meta-yojimbo.ts`, which belongs to batch t1-b4a, has four
edited spots: the objectives note in the header, one import, the first two `objectives` entries,
and `tip`.

- Row 1 (secret): "???", then after a loss "In the game, a Ghost teaches Doom" (research §5.3
  row 1). This is a fact about the real game, not a step our fight offers.
- Row 2: "Let an aeon take Zanmato". Row 3: "Defeat Yojimbo".
- Tip: "Spells land in full and swords at about half. Each action aimed at him fills his gauge,
  and at 100 comes Zanmato, 9,999 to all three: have an aeon out by then."

**Session only:** the reveal is kept in memory, so a page reload hides the row again. A save
field would be a save-schema change, which is the release class that needs a deep review before
deploy.

## Measured (the audit's bench, the real engine, live-like wiring)

200 seeds (1-200). Within five follows RETRY's seed + 1000 per attempt.

| Party | Line | First try | Within 5 | Y acts | Zanmato fired | Aeon took it | Doom kills |
|---|---|---:|---:|---:|---:|---:|---:|
| **shipped (`not-learned`)** | **intended (the tactic)** | **161/200** | 200/200 | 34.6 | 180 | 141 | 0 |
| shipped | advisor top row | 200/200 | 200/200 | 6.8 | 0 | 0 | 0 |
| shipped | no-Doom hack-and-sponge | 161/200 | 200/200 | 35.0 | 194 | 169 | 0 |
| shipped | everyone swings Attack | 0/200 | 0/200 | 19.2 | 197 | 0 | 0 |
| Auron/Tidus/Yuna (100 seeds) | hack-and-sponge | 77/100 | 100/100 | 38.0 | 100 | 95 | 0 |
| live-range seeds (100) | intended / advisor / hack-sponge | 82 / 99 / 84 | 100 each | | | | |
| `preloaded` | intended / advisor | 200 / 200 | 200 | 5.0 | 0 | 0 | 200 |
| `learned-spent` | intended / advisor | 159 / 200 | 200 | 34.3 | 176 | 135 | 7 |

The advisor still wins every fight without Doom: its top row is Fire Gems (audit §3.3, P-3). Each
Gem throw counts as one targeting (Y-1, unsourced), so this route stays free until a source
settles Y-1. It is left as the audit's open question, not changed here.

## Real keys, production build (headless GPU, port 6030)

Frames are in `docs/screenshots/yojimbo-pick/`, at 1600x900 and 390x844, seed 14:

1. Prep card: the objectives read "???", "Let an aeon take Zanmato", "Defeat Yojimbo".
2. Prep OVERDRIVE tab for Kimahri. It lists Ronso Rage *modes*, not Rages, so it cannot show
   whether Doom is there. The battle menu is the proof: Kimahri's rows are Attack, Special,
   Items, Switch, with no Overdrive and no Doom, and the advisor's top row is Fire Gem.
3. Lulu's Fira is cast by real keys (Black Magic, then Fira, then Yojimbo). Kimahri and Yuna
   took the tactic's own pick for one menu each.
4. The pause headline is "Let an aeon take Zanmato", never "???".
5. The intended autopilot plays the fight to **defeat** on turn 105 (the bench says defeat on
   turn 105 too). RETRY (Enter) goes to the prep card, which now reads "In the game, a Ghost
   teaches Doom".

## Found, not fixed

- **I found no Defend affordance in the FFX HUD.** `CommandMenuLogic.buildTopRows` drops the
  row "for an affordance", and a search of `src/ui` and `src/app` finds none. If that holds,
  a human cannot play the tactic's "everyone else defends".
  This matters more now that the chapter is a 110-turn race.
- The phone defeat card at 390x844 is the desktop panel scaled down to tiny type
  (`390x844-6-results.jpg`).
