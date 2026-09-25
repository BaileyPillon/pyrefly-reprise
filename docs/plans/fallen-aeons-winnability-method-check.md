# Method check: Chapter XI (Fallen Aeons) wins 18 % at human pace, and what could move it

**Game case: FFX-2 only** (ATB, the Wait split, dresspheres). Written 2026-09-25 under AGENTS.md
rule 15 and the ship gate's rule: the intended line's human rate is under 25 %. **Nothing here
touches a boss number** (rule 6; memory "boss-side fix needs measured options"). **Nothing below is
built**: every option waits for Bailey's word. Branch `chapter-fallen-aeons-ship-0925` off main
761d3eb0; numbers from `tests/unit/chapters/fallen-aeons-ship-bench.test.ts` unless marked PROBE.

## 1. The measurement

Human pace = the live default, Wait split, 1.5 s a menu (0.5 s on the top command list with the clock
running, 1.0 s held in a submenu): the model the Trema benches use. The chapter row is one unbroken
run of the Road (Shiva, then the Magus Sisters, then Anima) through the Save Sphere restore.

| | Bench (D = 0), 200 seeds | Human, 40 seeds | Human, 200 seeds |
|---|---:|---:|---:|
| **Chapter, intended line** | 58/200 (29 %) | **8/40 (20 %)** | **36/200 (18 %)** |
| 1 Shiva alone | 183/200 | 39/40 | |
| 2 Magus Sisters alone | 84/200 (42 %) | 8/40 (20 %) | 34/200 (17 %) |
| 3 Anima alone | 198/200 | 39/40 | |

**The Sisters are the whole problem:** 141 of the 164 human losses on the Road happen there. Shiva
and Anima each win about 39 in 40. With the shipped retry at the lost link (FA3), a player needs on
average about **5 to 6 tries at the Sisters** (1 / 0.17).

## 2. Why the Sisters lose (loss anatomy, PROBE `D:/Tools/pyrefly-scratch/chapters/fallen-aeons/anatomy.mts`)

Averages per lost Sisters fight, 200 seeds, bench speed (human speed is the same shape):

- **A loss is quick:** about 40 s of game time. In it the three Sisters take **about 36 turns**
  (Mindy 15, Sandy 11, Cindy 10) to the party's **12** (Yuna 4, Rikku 4, Paine 4). The engine follows
  the sourced turn formula (Agility 83 / 72 / 89 against the preset); the ratio itself is not a bug.
- **What kills:** Sandy's Attack and Razzia (1.5 KOs a loss) and Mindy's four -aga spells (1.5).
  **Delta Attack is not the main killer** (0.5 a loss). In 80 % of losses no Sister falls at all.
- **The guard rarely goes up.** Yuna spends her four turns on Dispel, X-Potions and Phoenix Downs;
  Shell and Protect come up less than once in three losses. Putting them **first** (the sourced
  opener, GamerGuides `[single source]`) makes it **worse**, not better: Sisters 19/200 at human pace
  (34 as the line stands), chapter 7/200. Two turns spent on the guard cost more than the guard saves
  at a 3-to-1 turn ratio. Curtains from the bag (party-wide, no charge) give the same numbers.
- **"Kill one sister first" cannot work with this preset:** Mindy-first by Drain (Drain now never
  misses, 881d4548) and Cindy-first by Drain (Split_Infinity) are **0/200**. Drain deals about 120
  a cast against 9,788 and 12,240 HP. The guides' single-target answers (Spare Change, Full Throttle's
  Sword Dance, Black Mage spells) need abilities the Chapter V preset has not learned.

So the party loses a race of turns it cannot win at human pace, and the one lever the sources give
the player against it (end the fight before the Sisters' turns pile up) is Darkness, which the party
can cast only about nine times a minute in a loss (thirteen in a win).

## 3. What would move it (measured; none built)

| # | Option | Kind | Sourced? | Chapter, human (200) | Sisters, human (200) | Chapter, bench (200) |
|---|---|---|---|---:|---:|---:|
| — | **As registered** | | | **36 (18 %)** | 34 (17 %) | 58 (29 %) |
| A | **Action time 3 s** on the three Road formations (the Chapter XIII switch) | engine rule | the rule `[verified: 2]`; the length is an `[estimate]` (nothing published) | **164 (82 %)** | 155 (78 %) | 174 (87 %) |
| B | Action time 1.5 s (the global estimate) | engine rule | as A | 117 (58.5 %) | 124 (62 %) | 147 (73.5 %) |
| C | **Preset at Lv 52 / 52 / 52**, the top of the band research §5 cites (43 to 52) | player side (our preset) | the band is an `[estimate]` from ffx2-vegnagun-shuyin §6; so are 46 / 48 / 50 | 61 (30.5 %) | 66 (33 %) | 99 (49.5 %) |
| — | FA8 b (the Sisters' counter counts only landed damage) | boss AI reading | picked a, sourced | 37 | 35 | 75 |
| — | The Config ATB speed at Slow (the live pause row) | player setting | sourced setting | 34 | 56 | |
| — | The guard first, spells or curtains | player line | GamerGuides `[single source]` | 7 / 6 | 19 / 19 | 44 / 42 |
| — | PROBE: Darkness cannot be evaded (research §4.2, §5) | data | **unsourced** (0 of 2 sources, FA-G6): not an option | 90 (45 %) | 98 (49 %) | 144 |

Rows marked with a dash, and the "as registered" Sisters figure, come from the scratch probes
`D:/Tools/pyrefly-scratch/chapters/fallen-aeons/variants.mts` and `speed.mts` (same helper, 200
seeds); the Darkness probe flips `canMiss` in memory only. A, B and C are in the committed bench.

Options A and B change a shared FFX-2 rule for this chapter's formations only, as Chapter XIII does
(`EnemyGroupDef.actionTimeSeconds`); Chapters 4 to 6 would not move. They touch no boss number: the
wait applies to every actor, the party's own turns included. Option C changes only our preset,
and only inside the band the research already uses. Neither the Spare Change kit (2 sources; needs
Samurai mastery and about 300,000 gil against the preset's 200,000) nor Full Throttle's Sword Dance
was measured: each needs a kit option like Chapter XIII's.

## 4. Recommendation for Bailey (one question)

**A: action time 3 s on the Road formations**, the same switch and the same length Bailey picked for
Chapter XIII this morning. It is the only measured option that crosses 1 in 4 (82 %), it rests on a
sourced rule the engine otherwise breaks, and it touches neither a boss nor the preset. C alone
reaches 30 %, and can stack with A if the Sisters still feel unfair in play. Reply words: "Fallen
Aeons: A", "Fallen Aeons: C", "Fallen Aeons: A and C", or "Fallen Aeons: as measured".
