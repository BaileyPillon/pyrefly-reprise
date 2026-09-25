# Chapter VII (Macalania) bench, 2026-09-25

**Game case: FFX only.** CTB, the Macalania build (`src/data/ffx/builds/macalania.ts`), Seymour,
two Guado Guardians and Anima (`research/ffx-seymour-anima-macalania.md`). No FFX-2 file is read.

**Measure, never tune.** No boss number was changed for any row below (AGENTS.md rule 6, the
boss-side rule). The one change is on the player side: the intended line now cures Confusion.

## How to run it

`tests/unit/chapters/macalania-bench.test.ts`, headless, on the real engine and data (hard rule 1).
By default it plays 10 seeds per line as a smoke test. With `PYREFLY_MEASURE=1` it plays 200 seeds
per line and prints one `MACALANIA_BENCH` JSON row per line:

```
PYREFLY_MEASURE=1 npx vitest run tests/unit/chapters/macalania-bench.test.ts --testTimeout=600000
```

The file pins only that every run ends and that the same seed plays the same battle, plus the one
player-side rule below. It pins no win rate.

## The lines

- **intended**: the shipped tactic (`src/engine/tactics/seymour-anima-macalania.ts`), which is what
  `__pyrefly.autoBattle('intended')` and the strategy guide's suggestion play. Steal from both
  Guardians, Petrify them, Haste and Cheer, the Trigger Commands, then a summon for act two, then
  Magic Break, Shell and the Nul spell for his next element in act three (research §7).
- **advisor**: the top row of the move-advisor card, pressed every turn (planner on). This is the
  nearest headless stand-in for a first-time player who follows the card.
- **mistake**: plain Attack on the first legal target. No Steal, no summon, no Nul.

## Results, 200 seeds per line

| Line | Before (branch base 761d3eb0) | After the Confusion rule | Losses after, by act |
|---|---|---|---|
| intended | 168/200 (84.0%) | **189/200 (94.5%)** | act 2: 3, act 3: 8 |
| advisor | 161/200 (80.5%) | **192/200 (96.0%)** | act 2: 1, act 3: 7 |
| mistake | 0/200 | 0/200 | act 1: 200 |

No run went unresolved. The median length is 49 to 51 player decisions. The mistake line loses in
act one every time, because a Guardian's 1,000 HP Auto-Potion out-heals plain attacks until it is
robbed (§2.3, §6.2). That is the lesson the chapter is built on, so the result is intended.

## What was losing, and the fix

A diagnostic pass over the 32 intended-line losses before the change (scratch, not committed) found
this:

- **Confusion was never cured.** The Guardians' harass throws Shremedy, Confusion at 50% with no
  damage (§2.3, §4.2 `[verified: 2 sources]`). Nothing wards it at this point in the game: there is
  no Confuse Ward, and its catalyst is out of reach (§8.7). The research names the answer: a Remedy
  (three in the preset; "the Confusion answer", §8.9) or Esuna. Curing Confusion is lesson 8 of §10.
  The tactic had no rule for it. Across 200 seeds, confused party members took **630 actions**, and
  16 party KOs in the lost runs came from a confused Tidus's Attack.
- The rest were act two, where Pain (a 100% KO on a party member) and Oblivion wore down the aeons,
  and act three, where Multi- spells hit twice a turn at ~1,700 each (§6.4).

**Change (player side only):** rule 1b in the tactic. When an ally other than the actor is
confused, and the actor has a Remedy or Esuna row for that ally, the actor cures them. The rule
sits after the act-two summon and the revive. The bench test pins that the rule fires.
Measured: confused party actions went from 630 to 33, and the intended line went from 168 to 189
wins. The advisor line rose with it because its planner consults the same tactic.

## Still losing, and what a player could do (for Bailey, nothing built)

The 11 intended-line losses left are 3 in act two and 8 in act three. Research §7 lists
player-side answers the line does not use yet. Each one is sourced, and none touches a boss:

- **§7 row 6, Reflect** on the party instead of Nul spells: `[single source: wiki]`. No one in
  §8.5's table knows Reflect at this point, so this is not available without a preset change. The
  preset is not changed here.
- **§7 row 9, Slow Seymour** (fully landable, `[verified: 2 sources]`). §8.5 lists Slow as
  "probably not yet" for Tidus, and the build says the same (`macalania.ts`, "No Hastega, no Slow"),
  so the same caveat applies.
- **§7 row 16, bank a Shiva Overdrive into act three** (`[single source]`, C-5). The engine already
  keeps the gauge through a dismissal. The line summons "fullest gauge first", but it does not hold
  Diamond Dust back for act three on purpose.

None of these is needed for a tutorial chapter at 94.5%. They are listed so a pick is possible,
not recommended.

## Not measured here

- A human first attempt. FFX is turn-based (CTB), so there is no clock and no human-speed discount
  like the FFX-2 benches have. The advisor line (96%) is the nearest stand-in.
- The real-key rehearsal won once each at 1600x900 and 390x844
  (`docs/concepts/chapters/macalania/unlock/rehearsal/`). Those runs picked moves with the tactic
  as it was before this change, because the page loaded before the edit.
