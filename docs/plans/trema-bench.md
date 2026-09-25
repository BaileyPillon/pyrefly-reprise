# Chapter XIII (Trema, FFX-2) — measured benches for TR6 = c

**Game case: FFX-2 only.** Printed by `tests/unit/chapters/trema-bench.test.ts` (200 seeds a
fight at bench speed, 40 at human speed; Active ATB, Bailey 2026-09-21). Plan
`docs/plans/chapter-trema-review.md` §9 and TR6 = c: **measure first, then ask once with the
numbers. Nothing here tuned a boss** (rule 6, "never weaken a boss").

## The table

| Link | Line | ATB | Wins | Avg min | Avg min (wins) | Boss moves / fight | Darkness / fight |
|---|---|---|---:|---:|---:|---|---:|
| 1 Paragon | intended: Attack, Shell, heals, never Darkness | Active, D=0 | 0/200 | 0.29 | — | BB 0.00 · Gen 2.11 | 0.00 |
| 1 Paragon | wrong: Darkness on Paragon | Active, D=0 | 0/200 | 0.09 | — | BB 0.86 · Gen 1.01 | 1.29 |
| 1 Paragon | option T-6 b (wiki Mag 88 / Def 244 / MDef 89), intended | Active, D=0 | 0/200 | 0.33 | — | BB 0.00 · Gen 2.43 | 0.00 |
| 1 Paragon | option TR11 c (Stamina Tonic: max HP x2), intended | Active, D=0 | 2/200 | 0.48 | 1.2 | BB 0.00 · Gen 3.43 | 0.00 |
| 1 Paragon | option: + 20 Phoenix Downs (not built; outside TR11 a), intended | Active, D=0 | 0/200 | 0.28 | — | BB 0.00 · Gen 2.50 | 0.00 |
| 2 Trema (fresh) | intended: Protect, drain to < 10 MP, Shell before Meteor, Darkness x2 | Active, D=0 | 0/200 | 0.35 | — | Met 0.00 · Ult 0.00 · Flare 0.62 · blocked 0.00 | 3.33 |
| 2 Trema (fresh) | intended without the drain | Active, D=0 | 0/200 | 0.55 | — | Met 0.00 · Ult 0.00 · Flare 0.92 · blocked 0.00 | 5.88 |
| 2 Trema (fresh) | wrong: Darkness x2, no drain, no Curtains | Active, D=0 | 0/200 | 0.40 | — | Met 0.00 · Ult 0.00 · Flare 0.61 · blocked 0.00 | 4.28 |
| 2 Trema (fresh) | option TR11 c (max HP x2), intended without the drain | Active, D=0 | 0/200 | 1.25 | — | Met 0.00 · Ult 0.00 · Flare 2.06 · blocked 0.00 | 15.35 |
| 2 Trema (fresh) | option: + 20 Phoenix Downs (not built), intended without the drain | Active, D=0 | 0/200 | 1.12 | — | Met 0.00 · Ult 0.00 · Flare 2.10 · blocked 0.00 | 9.43 |
| Chapter (1-2) | intended on both links | Active, D=0 | 0/200 | 0.29 | — | reached Trema 0/200 | |
| 1 Paragon | intended | Active, D=1.5 s | 0/40 | 0.23 | — | BB 0.00 · Gen 2.10 | 0.00 |
| 2 Trema (fresh) | intended without the drain | Active, D=1.5 s | 0/40 | 0.49 | — | Met 0.00 · Ult 0.00 · Flare 0.82 · blocked 0.00 | 3.40 |
| 2 Trema (fresh) | intended | Active, D=1.5 s | 0/40 | 0.31 | — | Met 0.00 · Ult 0.00 · Flare 0.53 · blocked 0.00 | 1.95 |

- "Trema (fresh)" starts Trema's link from the preset at full HP and MP: an upper bound on the
  chapter's link 2, which in the chapter opens on Paragon's end state. The chapter row runs both
  links as the app carries them (`setupForNextLink`, statuses included).
- Minutes are game minutes at Normal ATB speed. BB = Big Bang, Gen = Genesis, Met = Meteor,
  Ult = Ultima; "blocked" = spells the MP gate stopped (TR4 = b).
- The **option** rows are *not built*: they swap in the other sourced reading of Paragon's
  block (T-6, the wiki's Mag 88 / Def 244 / MDef 89), the sourced Stamina Tonic's doubled max
  HP (TR11 c, not modelled by the engine), or 20 Phoenix Downs added to the approved TR11 a bag,
  to show what each would buy.
- **Repair pass, 2026-09-25:** the first cut's bag carried 20 Phoenix Downs beyond TR11 a (rule
  10). They are out of the build; every row above is the approved bag, and the Phoenix Down rows
  reproduce the first cut's figures exactly (Paragon 0.28 min / Genesis 2.50; Trema without the
  drain 1.12 min / Darkness 9.43), which cross-checks the change. The chain now also carries the
  worn dressphere into Trema (research §1.1); it moves no row, because no run reaches Trema.

## What the numbers say

**As picked (TR8 a, TR10 a, TR11 a), neither fight is winnable by these lines: 0/200 each, and
0/200 for the chapter.** The fights end in under half a minute on Paragon and under a minute
on Trema, against the sources' "about 30 minutes" clear. Why, read off the runs:

1. **Enemy turns outnumber the party's three or four to one.** At the engine's sourced ATB model
   a Dark Knight (Agility 42) acts every 5.4 s before her charge time; Trema (129) every 1.8 s,
   Paragon (188) every 1.2 s.
2. **Paragon's Genesis** (DC 44, Magic 244) deals about 8,500 to a Lv 99 Dark Knight at
   10,710 HP and kills the Alchemist (5,106 HP, MDef 35) through Shell. It comes about every
   fourth Paragon turn, i.e. about once per party action; the party spends every action
   reviving and healing. Its physicals, by contrast, almost never land: Rabite's Foot lifts
   every girl's Luck past Paragon's Accuracy (3 % to hit).
3. **Trema** lands three physical hits of 1,300 to 1,800 per turn on one girl (DC 3 and 4 at
   Str 255 against Def 151), his Flare caps at 9,999 on one girl, and Demi takes a quarter. Hits
   inside a girl's chain window carry the chain multiplier (the engine chains enemy multi-hits
   on the party), so a Meteor's four hits on one girl take about 69 % of her max HP, not the
   research's `[derived]` 50 %.
4. **The drain costs more than it saves here.** Rikku must spherechange to Gunner for Target MP,
   and in this engine a spherechange drops her accessories (see "Engine bugs found" below), so
   she loses Crystal Bangle's HP and Rabite's Luck and dies before the drain lands. Target MP
   does about 72 MP a hit against Trema's MDef 255; he has 999.
5. The T-6 wiki reading softens Genesis (about 5,500) but raises Paragon's Defense to 244, so a
   Dark Knight's Attack falls from about 3,400 to under 1,000: no better. Doubled HP (Stamina
   Tonic) is the only option that wins at all (2/200 on Paragon). Phoenix Downs buy nothing (0/200
   on both links); they only stretch Trema's losses from about half a minute to about one.
6. **One more unexplained number, not tuned:** Paragon's Normal Attack 4 (DC 16, Str 244, Lv 99,
   ignores Defense) gives 7,814 to about 8,824 non-crit here, and the wiki's observed 8,273 to
   9,342 is that range times 1.0587, which is 271/256 to four places (its low end is our top roll
   x 240/256). A second randomiser step, a stat we lack, or the wiki's target state: the research
   does not say (`paragon-abilities.ts` carries the note).

## Measured options to bring to Bailey (asked once, TR6 = c)

- **a. Keep everything as picked** and ship the chapter LOCKED as a known unwinnable fight: not
  recommended.
- **b. TR11 c**: model Stamina Tonic and Valiant Lustre (sourced player tools, research §5,
  `[verified: 3 sources]`). Doubled HP alone: 2/200 on Paragon, 0/200 on Trema.
- **e. Add Phoenix Downs to the bag** (outside TR11 a; needs a yes): 0/200 on both links.
- **c. Fix the two engine bugs below first**, then re-measure (a fix changes Chapters 5, 6 and
  XI, so it needs its own review). With the all-target fix alone (measured, not committed): still
  0/200 on both links.
- **d. Revisit the line-up** (TR10): the Mascot line (International, `[single source]`) or a
  third Dark Knight; needs art and grid work.

## Engine bugs found while measuring (not fixed: each changes shipped chapters)

1. **An all-target action skips a target and hits another twice when one dies mid-cast**
   (`resolve.ts#targetForHit` indexes the *living* list). Seen on Genesis: Rikku died first, Yuna
   took a second hit, Paine none. The fix changed Chapter 5's event log on 30 of 30 seeds, and
   Chapters 6 and XI on some: it needs its own review (both games' shared plumbing, FFX-2 engine).
2. **A spherechange drops the girl's accessories** (`spherechange.ts#refreshDerivedStats`
   re-derives stats without `withAccessories`). Chapter 4's Bahamut tactic spherechanges, so a fix
   changes shipped logs.
3. **`damagesPool: 'mp'` is read by nothing** on Shuyin's Left Redoubt Lacrimosa and the Bulwark
   retaliation row (those rows also carry `accuracy: 0`). Target MP's own row was fixed here
   (`mpOnly`); no shipped build had learned it.
4. **No 9,999 max HP cap without Break HP Limit** in the engine: Yuna's Lv 99 Dark Knight reaches
   10,710 with a Crystal Bangle, where the game caps her at 9,999 (only The End's wearer breaks
   it). It flatters the party here.
