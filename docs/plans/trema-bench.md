# Chapter XIII (Trema, FFX-2) — measured benches for TR6 = c

**Game case: FFX-2 only.** Printed by `tests/unit/chapters/trema-bench.test.ts` (200 seeds a
fight at bench speed, 40 at human speed; Active ATB, Bailey 2026-09-21). Plan
`docs/plans/chapter-trema-review.md` §9 and TR6 = c: **measure first, then ask once with the
numbers. Nothing here tuned a boss** (rule 6, "never weaken a boss").

## 2026-09-25, second pass: after the method check's fixes, with the kit options built and OFF

Branch `chapter-trema-0925`, after `docs/plans/trema-winnability-method-check.md` and its fixes:
**E1** (the Cloister links time Stop, Slow, Sleep, Confuse and Berserk on §2.8's defaults), **E2**
(accessories survive a spherechange), **E3** (normal Paragon's physicals always land,
`[verified: 2 sources]`). The **kit options** (`src/data/ffx2/builds/via-infinito-kit.ts`) are
built, tested and OFF: the chapter ships `TREMA_KIT_OPTION = 'tr11-a'`. `sourced-kit` is
Split_Infinity's clear (Defense Bracers and Adamantite for Auto-Wall, Rabite's Feet, Valiant
Lustre on all three, 99 Megalixirs and 99 Mega-Potions, Stamina Tonic, Soul Spring, Three Stars);
`sourced-kit-one-lustre` if a grid is one girl's at a time; `sourced-kit-ribbon` adds the game's
one Ribbon on the healer. 200 seeds a line at bench speed, 40 at human speed (1.5 s a menu).

| Kit | Link | Line | ATB | Wins | Avg min | Avg min (wins) | Boss moves / fight | Darkness / fight |
|---|---|---|---|---:|---:|---:|---|---:|
| tr11-a | 1 Paragon | intended: Attack, Shell, heals, never Darkness | Active, D=0 | 0/200 | 0.10 | — | BB 0.00 · Gen 1.04 | 0.00 |
| tr11-a | 1 Paragon | wrong: Darkness on Paragon | Active, D=0 | 0/200 | 0.08 | — | BB 0.23 · Gen 0.91 | 0.47 |
| tr11-a | 2 Trema (fresh) | intended: Protect, drain to < 10 MP, Shell before Meteor, Darkness x2 | Active, D=0 | 0/200 | 0.38 | — | Met 0.00 · Flare 0.63 · blocked 0.00 | 3.60 |
| tr11-a | 2 Trema (fresh) | intended without the drain | Active, D=0 | 0/200 | 0.55 | — | Met 0.00 · Flare 0.92 · blocked 0.00 | 5.88 |
| tr11-a | 2 Trema (fresh) | wrong: Darkness x2, no drain, no Curtains | Active, D=0 | 0/200 | 0.40 | — | Met 0.00 · Flare 0.61 · blocked 0.00 | 4.28 |
| tr11-a | Chapter (1-2) | intended on both links | Active, D=0 | 0/200 | 0.10 | — | reached Trema 0/200 | 0.00 |
| tr11-a | Chapter (1-2) | wrong: Darkness on Paragon | Active, D=0 | 0/200 | 0.08 | — | reached Trema 0/200 | 0.47 |
| sourced-kit | 1 Paragon | kit intended: Tonic, Megalixir, Shell, Attack, Itchy spherechanged | Active, D=0 | 0/200 | 0.14 | — | BB 0.00 · Gen 1.33 | 0.00 |
| sourced-kit | 1 Paragon | kit wrong: Darkness on Paragon | Active, D=0 | 0/200 | 0.09 | — | BB 0.36 · Gen 1.04 | 0.80 |
| sourced-kit | 2 Trema (fresh) | kit intended: Soul Spring, Tonic, Three Stars, Darkness x2 | Active, D=0 | 30/200 | 4.61 | 12.2 | Met 0.60 · Flare 0.30 · blocked 14.36 | 58.89 |
| sourced-kit | 2 Trema (fresh) | kit wrong: no drain, no Curtains, no Stars | Active, D=0 | 0/200 | 0.80 | — | Met 0.00 · Flare 1.42 · blocked 0.00 | 7.73 |
| sourced-kit | Chapter (1-2) | kit intended on both links | Active, D=0 | 0/200 | 0.14 | — | reached Trema 0/200 | 0.00 |
| sourced-kit | Chapter (1-2) | kit wrong: Darkness on Paragon | Active, D=0 | 0/200 | 0.09 | — | reached Trema 0/200 | 0.80 |
| sourced-kit-one-lustre | 1 Paragon | kit intended | Active, D=0 | 0/200 | 0.13 | — | BB 0.00 · Gen 1.25 | 0.00 |
| sourced-kit-one-lustre | 2 Trema (fresh) | kit intended | Active, D=0 | 5/200 | 2.87 | 12.0 | Met 0.30 · Flare 0.31 · blocked 8.70 | 35.56 |
| sourced-kit-one-lustre | Chapter (1-2) | kit intended | Active, D=0 | 0/200 | 0.13 | — | reached Trema 0/200 | 0.00 |
| sourced-kit-ribbon | 1 Paragon | kit intended | Active, D=0 | 0/200 | 0.14 | — | BB 0.00 · Gen 1.33 | 0.00 |
| sourced-kit-ribbon | 2 Trema (fresh) | kit intended | Active, D=0 | 49/200 | 3.99 | 12.0 | Met 0.58 · Flare 0.90 · blocked 11.35 | 52.77 |
| sourced-kit-ribbon | Chapter (1-2) | kit intended | Active, D=0 | 0/200 | 0.14 | — | reached Trema 0/200 | 0.00 |
| tr11-a | 1 Paragon | option T-6 b (wiki Mag 88 / Def 244 / MDef 89), intended | Active, D=0 | 0/200 | 0.12 | — | BB 0.00 · Gen 1.10 | 0.00 |
| sourced-kit | 1 Paragon | option T-6 b, kit intended | Active, D=0 | 0/200 | 0.17 | — | BB 0.00 · Gen 1.63 | 0.00 |
| tr11-a | 2 Trema (fresh) | option: + 20 Phoenix Downs (not built), intended | Active, D=0 | 0/200 | 0.61 | — | Met 0.00 · Flare 1.05 · blocked 0.06 | 3.58 |
| tr11-a | 1 Paragon | intended | Active, D=1.5 s | 0/40 | 0.09 | — | BB 0.00 · Gen 1.07 | 0.00 |
| tr11-a | 2 Trema (fresh) | intended | Active, D=1.5 s | 0/40 | 0.31 | — | Met 0.00 · Flare 0.45 · blocked 0.00 | 2.00 |
| tr11-a | Chapter (1-2) | intended | Active, D=1.5 s | 0/40 | 0.09 | — | reached Trema 0/40 | 0.00 |
| sourced-kit | 1 Paragon | intended | Active, D=1.5 s | 0/40 | 0.11 | — | BB 0.00 · Gen 1.57 | 0.00 |
| sourced-kit | 2 Trema (fresh) | intended | Active, D=1.5 s | 0/40 | 1.58 | — | Met 0.05 · Flare 0.40 · blocked 4.63 | 12.03 |
| sourced-kit | Chapter (1-2) | intended | Active, D=1.5 s | 0/40 | 0.11 | — | reached Trema 0/40 | 0.00 |

"blocked" counts Trema's spells the MP gate stopped after a drain (TR4 = b). Every run ends in a
win or a loss (no unfinished run).

**What the numbers say.**

1. **With Bailey's build (TR10 a, TR11 a) the chapter is not winnable: 0/200 on every line and
   link, 0/40 at human speed.** The intended line's chapter win rate is **0**.
2. **Paragon is the wall, whatever the kit.** No kit and no line wins link 1 (0/200 each). Its
   Genesis (DC 44, Magic 244, TR8 a) deals about 3,600 to 5,800 to every girl through Shell and
   is half of every second Paragon action (one in four on average); Paragon acts every 1.23 s, a Dark Knight
   every 5.4 s, so the party is dead before its second round. With E3 its physicals now land
   too, as the sources say. The wiki's T-6 b block (Magic 88, Defense 244) softens Genesis but
   stops the Dark Knights' Attack (0/200 either way).
3. **Trema alone becomes winnable with the sourced kit: 30/200 at bench speed (49/200 with the
   Ribbon), 0/40 at human speed.** The drain works (about 14 of his spells blocked a fight), the
   Auto-Wall and Adamantite keep the Alchemist alive through the three-hit chains, and Three Stars
   makes Darkness free. Wins take about 12 game minutes. With one Valiant Lustre: 5/200.
4. **The method check's +90 / +90 for Valiant Lustre was a misreading** (the wiki table's fifth
   column is *Creature Abilities*); the grid is +60 / +60 with all four gates, and crossing gates
   in battle measured worse (a Dark Knight changed into a White Mage is killed mid-route), so the
   lines keep only the equip bonus. That, the 9,999 cap on the Stamina Tonic, and real turn costs
   for the drain and the Stars (the probes gave them at 0 s) are why the method check's 157/200
   is 30/200 here.

**Probes, not built (no source for the timing; E4).** A scratch probe adds N seconds of recovery
after every action (`D:/Tools/pyrefly-scratch/trema-ship/fix/e4probe.mts`), 100 seeds, bench speed:

| Probe | Kit | Paragon | Trema (fresh) | Chapter |
|---|---|---:|---:|---:|
| 1.5 s after every action | tr11-a | 0 | 0 | 0 |
| 1.5 s | sourced-kit | 0 | 71 | 0 |
| 1.5 s | sourced-kit-ribbon | 0 | 63–64 | 0 |
| 3 s | sourced-kit | 0 | 87 | 0 |
| 3 s | sourced-kit-ribbon | 0–7 | 73–74 | 4–5 |

A probe that also fixes the known all-target double hit (`resolve.ts#targetForHit`, not built)
moved none of these rows by more than one seed. **Normal Paragon at TR8 a is not winnable in
this engine with any sourced kit, even with 3 s of animation time.** The questions this leaves for
Bailey are in the method check §4 and in this pass's report: TR7 (Oversoul Paragon: its script is
only summarised in the research, so it cannot be built yet), TR1 b (Trema alone), and a source
or an explicit estimate for action time (E4).

## 2026-09-25, third pass: the live default is Wait split, not Active

Branch `chapter-trema-0925`. Release 12.3 made the engine's default ATB mode Wait, and Wait's
**split** is on by default (`DEFAULT_WAIT_SPLIT = true`, `src/battle/ffx2/active.ts`), not the
whole-menu hold. The human-speed rows above spend all 1.5 s of a menu with the clock running
under Active. That is no longer the live behaviour. This pass models a human under **Wait
split**: 0.5 s reading the top-level command list, where the clock runs exactly as it does under
Active (`throughInput`), then 1.0 s inside a submenu or aiming a target, where the split holds
the clock and the rest of the 1.5 s moves nothing. Modelled in `tremaDrive.ts#runLink` the same
way `fallenAeonsDrive.ts` and `ffx2ChapterDrive.ts` already model it for Chapters XI, 4, 5 and 6:
`engine.setMenuLevel('top')`, tick `topMs`, `engine.setMenuLevel('deep')`. No engine or data file
changed; only the test helper and this bench gained the option. 40 seeds a line at human speed
(intended line, every kit x every link), plus 200 seeds at bench speed for the two kits that win
at all, to confirm the mode switch alone does not move a D=0 result.

| Kit | Link | Line | ATB | Wins | Avg min | Avg min (wins) | Boss moves / fight | Darkness / fight |
|---|---|---|---|---:|---:|---:|---|---:|
| tr11-a | 1 Paragon | intended | Wait split, D=1.5 s (0.5 s top) | 0/40 | 0.09 | — | BB 0.00 · Gen 1.10 | 0.00 |
| tr11-a | 2 Trema (fresh) | intended | Wait split, D=1.5 s (0.5 s top) | 0/40 | 0.34 | — | Met 0.00 · Flare 0.55 · blocked 0.00 | 2.70 |
| tr11-a | Chapter (1-2) | intended | Wait split, D=1.5 s (0.5 s top) | 0/40 | 0.09 | — | reached Trema 0/40 | 0.00 |
| sourced-kit | 1 Paragon | intended | Wait split, D=1.5 s (0.5 s top) | 0/40 | 0.12 | — | BB 0.00 · Gen 1.60 | 0.00 |
| sourced-kit | 2 Trema (fresh) | intended | Wait split, D=1.5 s (0.5 s top) | 1/40 | 3.95 | 14.3 | Met 0.38 · Flare 0.40 · blocked 12.93 | 42.42 |
| sourced-kit | Chapter (1-2) | intended | Wait split, D=1.5 s (0.5 s top) | 0/40 | 0.12 | — | reached Trema 0/40 | 0.00 |
| sourced-kit-one-lustre | 1 Paragon | intended | Wait split, D=1.5 s (0.5 s top) | 0/40 | 0.11 | — | BB 0.00 · Gen 1.45 | 0.00 |
| sourced-kit-one-lustre | 2 Trema (fresh) | intended | Wait split, D=1.5 s (0.5 s top) | 3/40 | 2.33 | 13.1 | Met 0.15 · Flare 0.38 · blocked 7.47 | 24.77 |
| sourced-kit-one-lustre | Chapter (1-2) | intended | Wait split, D=1.5 s (0.5 s top) | 0/40 | 0.11 | — | reached Trema 0/40 | 0.00 |
| sourced-kit-ribbon | 1 Paragon | intended | Wait split, D=1.5 s (0.5 s top) | 0/40 | 0.12 | — | BB 0.00 · Gen 1.60 | 0.00 |
| sourced-kit-ribbon | 2 Trema (fresh) | intended | Wait split, D=1.5 s (0.5 s top) | 4/40 | 2.36 | 13.5 | Met 0.28 · Flare 0.88 · blocked 7.03 | 25.60 |
| sourced-kit-ribbon | Chapter (1-2) | intended | Wait split, D=1.5 s (0.5 s top) | 0/40 | 0.12 | — | reached Trema 0/40 | 0.00 |
| sourced-kit | 2 Trema (fresh) | kit intended | Wait split, D=0 | 30/200 | 4.61 | 12.2 | Met 0.60 · Flare 0.30 · blocked 14.36 | 58.89 |
| sourced-kit-ribbon | 2 Trema (fresh) | kit intended | Wait split, D=0 | 49/200 | 3.99 | 12.0 | Met 0.58 · Flare 0.90 · blocked 11.35 | 52.77 |

**What changed against the Active D=1.5 s rows, in three sentences.** Wait split's 40-seed rows
land close to Active's own D=1.5 s rows and inside the same noise band (tr11-a and sourced-kit
Paragon and Chapter unchanged at 0/40; Trema fresh ticks up a little — sourced-kit 0/40 to 1/40,
and the two kits Active never ran at human speed, sourced-kit-one-lustre and sourced-kit-ribbon,
land at 3/40 and 4/40 — because 1.0 s of every 1.5 s now runs against a held clock instead of a
running one, so the party loses less ATB ground to menu time than Active's D=1.5 s charged it.
The bench-speed (D=0) row for sourced-kit and sourced-kit-ribbon is identical to their Active D=0
row (30/200 and 49/200) at every field, confirming the mode switch alone (`atbMode: 'wait'`,
`waitSplit: true`) moves nothing when no decision time is ticked. **None of this changes the
second pass's headline: the chapter is still 0/40 and 0/200 on every kit and link that reaches
it, Paragon is still the wall, and Trema alone is still winnable only with the sourced kit** —
Wait split's forgiveness narrows the human-speed gap under Active but does not close it.

## First cut (126b719f, before the method check)

Kept as history. Of its engine bugs, #2 (a spherechange drops accessories) is fixed in the second
pass (E2); #1 and #4 stand (the Stamina Tonic alone honours the 9,999 cap, `battle/ffx2/kit.ts`).

### The table

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

### What the numbers say

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

### Measured options to bring to Bailey (asked once, TR6 = c)

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

### Engine bugs found while measuring (not fixed: each changes shipped chapters)

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
