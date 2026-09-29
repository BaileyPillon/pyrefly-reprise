# Sin, link 4 (Overdrive Sin): the bench at human pace (FFX only)

Bailey, 2026-09-27 ~13:40 EDT: "all your recommendations". For Sin that means concept A (Left
Fin, Right Fin, Genais with the Core as one continuous fight, the save, then Overdrive Sin),
reached through B: paint a pilot of Sin's head, **bench link 4 at human speed**, ship link 4
unlisted behind a switch, then add links 1 to 3 in front. Split into two chapters (concept C)
only if the bench says one sitting is too long
(`docs/concepts/chapters/sin-2026-09-27/README.md`, "Recommendation").

This is that bench. **Game case: FFX only** (`research/ffx-sin.md` §0.3).

## Verdict

- **Link 4 is winnable, and it is a race.** The sensible line wins **62/200 (31 %)** on the first
  try with Giga-Graviton on Sin's 13th turn. Its wins land on Sin's 11.9th turn on average, and its
  losses leave Sin a median **13,329** HP short. The naive line wins **0/200** and leaves Sin at
  about 115,000.
- **S-1 decides the chapter.** With Giga-Graviton on the 12th turn (Gestahl's reading) the same
  sensible line wins **7/200 (3.5 %)**. One Sin turn is worth about 6 party actions (research
  §6.2), and at this preset that is the whole margin. **The Steam check that settles S-1 has to
  come before the chapter is listed.** Only Bailey can schedule it.
- **One sitting of concept A looks too long.** The first pass alone is about 215 to 265 engine
  turns. That is 1.1 to 1.4 times the longest line in the project today (Chapter III's first link,
  about 195 turns). Links 1 to 3 in that figure are an estimate; link 4 is measured. At a 31 %
  first-try rate on link 4, a first clear typically needs about three attempts at link 4. If a
  loss at link 4 replays the Fins and the Core, the sitting is roughly twice anything shipped. The
  plan's own fallback therefore applies: **split at the save into concept C** (two chapters, one
  more card). **Nothing built is wasted**: the unlisted link 4 is exactly C's second chapter.
  - The one thing that would keep A in one sitting is a checkpoint at the save. Concept A already
    names this as our estimate: "a Game Over at link IV restarts at link IV".
  - Even with the checkpoint, the first pass is still the longest in the project.
  - This is **Bailey's pick**. The recommendation is C, and it is to be re-checked against a real
    bench of links 1 to 3 once they are built.

## Method

- **Engine and data:** the real FFX CTB engine and the chapter's own data (`src/data/ffx/enemies/overdrive-sin*.ts`,
  `src/battle/ffx/ai/overdrive-sin*.ts`). The content registry is wired as the running game wires
  it: every FFX ability and item, as in the other FFX benches.
- **Party:** `src/data/ffx/builds/sin-fahrenheit.ts`. That is `garden-of-pain.ts` with Yuna's
  Tetra Ring back (S-29, our estimate, Bailey's pick). Link 4 starts rested: full HP and MP, and
  the preset's gauges (research §1.2).
- **Seeds:** 1 to 200, one battle per seed, first try only.
- **Human pace equals bench speed.** FFX is CTB, and the engine's clock moves only on turns (the
  `wait` events are animation only), so a slow player faces the same fight. This is the house rule
  every FFX bench uses (`docs/plans/yojimbo-faithfulness-2026-09-26.md` §3).
- **Reproduce it:** `npx vitest run tests/unit/chapters/sin-bench.test.ts`. It prints both tables.
  The policies are in `tests/unit/helpers/sinPolicies.ts`.
- **Measure, never tune.** No boss number was touched. The test pins only two things: every battle
  ends in a victory or a defeat, and the sensible line does at least as well as the naive one.

### The two lines

**Sensible** is research §8 row 8, `[verified: 4 sources]`: "Hastega and Focus/Cheer during the
three pulls, Wakka and Lulu firing; Armor Break the moment it is in range; Overdrives … to finish".

- **The three pulls (FAR):**
  - Tidus casts Hastega, then Cheer.
  - Auron and Yuna switch out for Wakka and Lulu, the two who reach.
- **In reach:**
  - Tidus switches out for Auron.
  - Auron casts Armor Break, then Mental Break, then attacks.
  - Lulu casts Firaga and drinks an Ether when her MP runs low.
  - Wakka attacks.
- **At any time:**
  - Overdrives are used whenever they are full.
  - Upkeep: a Soft on a Petrify, a Remedy on a Confuse, a Phoenix Down on a KO, Holy Water on a
    Zombie under 35 % HP, and an X-Potion under 35 %.
- **Aeons are not used.** The preset's aeon gauges are 50 to 70, not full. An aeon Overdrive line
  would need a filling plan this bench does not model, so the sensible numbers **understate** the
  best line.

**Naive** is the credibly wrong line.

- The opening three stay in.
- Each member attacks when the attack reaches, and Defends when it does not.
- Overdrives are used whenever they are full.
- Yuna casts Curaga when anyone is under 40 %.
- A Phoenix Down goes on a KO.
- There is no Haste, no Break, no switch and no status care.

## The numbers (200 seeds each; measured 2026-09-27 on branch `chapter-sin`)

| Line | Giga-Graviton turn | Wins | Ended by Giga-Graviton | Mean turns (all actors) | Mean Sin turns | Sin HP left on a loss (mean / median) | Gazes per fight | Damage while FAR (3 pulls) | Overdrives per fight | Damage per Overdrive |
|---|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|
| sensible | **13** (default) | **62/200 (31 %)** | 138/200 (69 %) | 74.9 | 12.7 | 14,782 / 13,329 | 7.8 | 15,511 | 1.44 | 3,087 |
| sensible | 12 (Gestahl) | **7/200 (3.5 %)** | 193/200 (96.5 %) | 70.2 | 12.0 | 18,702 / 16,881 | 7.3 | 15,511 | 1.18 | 3,091 |
| naive | 13 | 0/200 (0 %) | 200/200 (100 %) | 50.5 | 13.0 | 115,423 / 114,588 | 3.9 | 0 | 0.57 | 2,229 |
| naive | 12 | 0/200 (0 %) | 200/200 (100 %) | 47.1 | 12.0 | 117,273 / 116,037 | 3.5 | 0 | 0.57 | 2,229 |

- **Where the wins end:** the sensible line's wins end on Sin's turn 11.9 on average (13-turn
  clock) and 11.0 (12-turn clock).
- **Every loss is Giga-Graviton.** No battle was lost any other way: 138 + 62 = 200 and
  193 + 7 = 200. Gaze wears the party down (7 to 8 Gazes a fight on the sensible line), but it
  never ends the fight on its own.
- **Damage per Overdrive, by Overdrive:**

  | Line | Turn | Who | Overdrive | Uses | Mean damage |
  |---|---:|---|---|---:|---:|
  | sensible | 13 | Auron | Dragon Fang | 287 | 3,087 |
  | sensible | 12 | Auron | Dragon Fang | 236 | 3,091 |
  | naive | 13 | Auron | Dragon Fang | 114 | 2,229 |
  | naive | 12 | Auron | Dragon Fang | 114 | 2,229 |

- **Only Auron's gauge fills in this fight.** Auron is in Warrior mode, so his gauge fills from
  damage dealt. Tidus (40), Lulu (45) and Kimahri (40) are Stoic: they fill from damage taken, and
  Gaze's roughly 700 a hit is not enough. Wakka (35) is Victor: his gauge fills only on a win. So
  "Overdrives to finish" means one or two Dragon Fangs at about 3,100 each, 1 to 3 % of Sin's HP.
  The race is won by Armor Break, Mental Break, Haste and Firaga. It is not won by Overdrives, at
  this preset's gauges.
- **Research §6.2's rough race, checked.** §6.2 estimated "about 85,000–100,000 before Overdrives
  … 140,000 is out of reach without them". Measured, the sensible line deals about 125,000 on
  average and wins 31 % of the time with almost no Overdrive damage. The difference is Mental
  Break under Lulu's Firaga (about 3,700 a cast) and the roughly 15,500 that Wakka and Lulu land
  during the three pulls. §6.2 counted neither.

## How long one sitting of concept A would be

**Link 4 is measured.** The sensible line takes 74.9 engine turns, which is 62.2 party actions
and 12.7 Sin turns.

**Links 1 to 3 are an estimate** from research §6.2's damage table at this preset: Auron STR 42,
Wakka STR 33, Lulu MAG 42, and all seven with Piercing. None of this is measured; it is to be
benched when the links exist.

| Link | HP | Damage per action once broken | Actions | Overhead | Party actions |
|---|---:|---|---:|---|---:|
| Left Fin | 65,000 | about 2,000 on average. Auron 2,345 after Armor Break, Lulu Firaga about 2,400 (about 3,500 after Mental Break), Wakka about 1,150 after Armor Break. At FAR only Wakka and Lulu reach | about 33 | about 12: the Breaks again after each near Negation, recovery after Gravija, orders to Cid | about 45 |
| Right Fin | 65,000 | the same | about 33 | the same | about 45 |
| Genais and the Core | 20,000 + 36,000 | Genais about 15 out of its shell. The Core about 17 with Armor Break or Mental Break | about 32 | about 11: the shell phase and Negation | about 43 |

That gives **about 133 party actions for links 1 to 3 (range 110 to 150)**. Enemy turns add about
25 to 30 %, since the Fins act at Agility 20 and Cid has his own turns, so links 1 to 3 come to
**about 140 to 190 engine turns**. With link 4's 75 on top, the first pass is **about 215 to 265
engine turns**.

The longest intended line in the project today is Chapter III's first link, at about 195 turns
(`src/battle/ffx/engine.ts`, the stalemate note). The concept sheet's own figure agrees in size:
about 30 to 45 party actions for each Fin, at the Zanarkand party's damage.

## Open, and not built

| # | Item | What it means for these numbers |
|---|---|---|
| **S-1** | Giga-Graviton on the 12th or the 13th turn. The build ships the 13th, Bailey's default. | 31 % against 3.5 %. It needs the Steam HD Remaster check, and only Bailey can schedule that. |
| S-16 | Which Gaze fires is `[unsourced]`. The build picks uniformly, our estimate. | It changes which status lands, not whether one does. |
| S-28 | Use and Wakka's Overdrive reaching after the 2nd pull is `[single source]`, not built. | Wakka's Overdrive reaches at FAR anyway (his blitzball); Rikku is not in either line. |
| — | An aeon's targeting counts 2 toward the six, our reading of "three times by an aeon". | Neither line uses aeons. |
| — | Aeon Overdrives are not in either line. | The sensible rate is a floor for a player who plans an aeon finish. |
| — | The mouth stages over the melee turns (presentation, our estimate). | None. |
