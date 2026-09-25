# Method check: why Chapter XIII (Paragon, then Trema) wins 0/200, and the smallest sourced fixes

**Game case: FFX-2 only** (ATB, dresspheres, Garment Grids, Spherechange). Two proposed engine
fixes sit in shared FFX-2 plumbing (`statuses.ts`, `spherechange.ts`); they change Chapters 4, 5, 6
and XI, and they are marked. No FFX file is touched. Written 2026-09-25 under AGENTS.md rule 15
(two benches left the same issue open). **Nothing here touches a boss number** (rule 6; memory
"boss-side fix needs measured options"). Branch `chapter-trema-0925` at 936f31ad.

**Method.** The bench driver (`tests/unit/helpers/tremaDrive.ts`, lines `intended` / `noDrain`) run
by Node from scratch (`D:/Tools/pyrefly-scratch/trema-ship/method-check/`, `exp.mts`), with each
option applied to the live units after `init`. **These are probes, not builds.** They only show
what each sourced tool or rule would change. A "start-of-fight proxy" means the tool is already in
effect at 0 s (gates crossed, MP drained, Three Stars used), so the real line spends 4 to 6
party turns first. The estimates below take a few points off for that.

## 1. How players actually beat them (sources)

| # | What players do | Source |
|---|---|---|
| S1 | Lv 99; **two Dark Knights on Darkness plus a healer** (Alchemist). | Split_Infinity FAQ 26832 G0648/G0649; research §5 `[verified: 3]` |
| S2 | **Valiant Lustre** grid. Equip: Def +20, MDef +20. Yellow and Blue gates: Def +20 each. Red and Green: MDef +20 each. All four: Def +30, MDef +30 and Moogle Cureja. That is **+90 / +90** in total. | wiki *Garment Grid* revid 3998878 (fetched 2026-09-25). Wiki *Trema (boss)* 4008691: DKs taken round its edge get "maxed out" Def and MDef. Split: "adding +40 to DEF" (two gates). **Corrects research §5** ("+40 a gate") and vegnagun §6 (+60, leaves out the four-gate bonus). Wiki *Paragon* says "an extra 80" (minor `[conflict]`). |
| S3 | **Defense Bracer** (Auto-Protect and Auto-Shell) on both DKs, with Rabite's Foot. **Adamantite** (Def and MDef +120, HP +100 %, Agi −30, Auto-Wall; one copy in the game) and Rabite's Foot on the Alchemist. | Split G0648; combat-core §5.4. Wiki *Paragon*: Big Bang "cannot nullify Auto-Protect or Auto-Shell". |
| S4 | **Drain his MP first.** The Alchemist uses **Soul Spring** and "all his MP are gone": no Demi, Flare or Ultima. Meteor still comes. | Split G0649; research §4.2 `[verified: 4]`; TR4 = b |
| S5 | Chaining Darkness needs **Twin Stars or Three Stars** (Spellspring: Darkness costs no HP) or Drain. | wiki *Trema (boss)*; combat-core items table |
| S6 | Stock: Split carried **99 Mega-Potions and 99 Megalixirs** plus a Stamina Tonic. The wiki adds Mix: Dark Matter + any item makes the party Invincible, and Chocobo Wing + a non-status item gives Final Wall. | Split G0648; wiki *Trema (boss)* |
| S7 | Rabite's Foot Luck makes Mist, Mire and Moon miss. The Dying Star chain "hit[s] targets regardless of EVA and LUCK". | Split G0649 (the engine already does this) |
| S8 | **Normal Paragon** in HD is "difficult". The party needs MDef over 175 and Def of 165 or more, Crystal Bangles, a **Stamina Tonic + Megalixir** at the start, Higher Power or Valiant Lustre, **Ribbon** against Itchy, and it has to "heal constantly". Never use Darkness on it. | wiki *Paragon* 3998078 "Normal"; Split G0648 |
| S9 | **Normal Paragon's physicals always land.** Split: normal Paragon "is able to connect with all of his physical attacks", so he Oversouls it. Wiki: its attacks can be dodged only in Oversoul. | 2 sources |
| S10 | Oversoul Paragon is "slightly easier": it waits until it is hit and its physicals miss. Bribing it (800,000 gil) is also sourced. | wiki *Paragon*; Split (Lady Luck) |
| S11 | Original only: Cat Nip with Trigger Happy. International/HD Cat Nip is Auto-Berserk. | research §0.3 (out under TR2 = a) |

Read from local copies: SinirothX FAQ 31807 (entries: Trema has Thinking Period 0, Paragon 0), Split
FAQ 26832, wiki *Trema (boss)* 4008691 and *Paragon* 3998078. No speedrun or challenge notes were read.

## 2. What the engine does, measured

**Turn ratio.** The engine follows combat-core §1.2 exactly: `ticks = floor(10000·70/(Agi+1))` at
3,000 ticks a second. Trema (Agi 129) acts every **1.79 s** and Paragon (Agi 188) every **1.23 s**.
A Dark Knight (Agi 42) waits 5.43 s, plus about 2.0 s of charge for Darkness (CT 26), so **7.4 s**
a Darkness. The Alchemist waits 3.95 s (8.05 s with Adamantite). Haste is ×1.05 `[verified: 2]`, and both
bosses are immune to Slow and Stop. **The 3-to-4-to-1 ratio follows the sources. It is not the bug.**
The party cannot keep Trema chain-locked: that needs a hit every 2 s, and the girls act every 4 to 8 s.

**Damage out is not the problem.** Darkness does 5,640 to 6,370 per cast unchained at Str 175.
Split reports "about 5000" with a Str-255 Dark Knight (`[single source]`, so the engine may be
generous). The sourced build deals **90,000 to 100,000 a minute** to Trema, which is a 10-to-11-minute
clear. Split's clear took about 30 minutes, with Config ATB at medium or slow.

**Damage in, and lost turns, are the problem** (as built, Trema fresh, seed 1): Rikku dies to one
Dying Star (Def 52, 2,125 a hit). Trema's single-target attacks come every 1.8 s, and the chain
window is 2 s, so **one girl stays chained from one of his turns to the next**. The multiplier climbs
past ×1.8 and the lock stops her acting at all. Party Def 151 / MDef 105 against Str/Mag 255 is
the rest. `(270 − Def)/255` is linear, so Def 241 takes **4.1 times less** physical damage than Def 151,
and MDef 255 takes **5 times less** magic damage than MDef 195.

**Engine rules that disagree with the sources** (read in code, then run):

- **E1, bug (FFX-2 shared plumbing): a timed status with duration 0 never expires.**
  `statuses.ts#durationToTicks(0)` returns null, which means permanent. Beguiling Mire's Stop
  (`trema-abilities.ts:99`) therefore lasts until the battle ends. §2.8 says Stop, Slow and Confuse
  are timed `[verified: 2]`. The same `duration: 0` sits on Fallen Aeons' Stop, Paragon's Confuse,
  Vegnagun's Slow and Berserk, and Shuyin's Slow. Songstress dances are sustained auras and are not
  touched. In the losing runs the last Dark Knight is Stopped with nobody left to Remedy her.
- **E2, bug (FFX-2): a spherechange drops the girl's accessories** (known, trema-bench #2). The
  sources clear Itchy by spherechanging (§2.8) and cross Valiant Lustre's gates in battle (S2). Today
  both cost the girl her Bangle, Adamantite or Bracer.
- **E3, data disagrees with the sources: Paragon's physicals hit 3 %** with Rabite's Foot
  (`ENEMY_BASE_ACCURACY` 104 is an `[estimate]`). S9 says they always land. The fix makes link 1
  harder, and it is the faithful change.
- **E4, open (FFX-2): an action takes no time.** §1.1 (Split G0905, `[single source]`) puts the
  animation before the refill, and §1.5 adds an "Automatic Wait" in long animations. The engine
  starts refilling the moment an action resolves. That is why Trema's and Paragon's back-to-back
  single hits chain and lock a girl indefinitely, which Split's "tape down X … go watch a movie"
  contradicts. **No source gives animation lengths**, so this is not a proven bug. It is measured
  below only as a bound: *noCross* resets a girl's chain window between enemy actions, and *anim N*
  adds N s of recovery after every action.
- **E5, gaps: sourced tools the engine lacks.** Valiant Lustre; the status halves of accessories
  (Auto-Wall on Defense Bracer and Adamantite, Ribbon immunity, which `accessories.ts` says is not
  modelled); Soul Spring; Twin/Three Stars; Stamina Tonic (FFX only today); FFX-2 Mix (the recipe
  lookup is unwired, so no Miracle Drink or Final Wall). Also known: no 9,999 max-HP cap (trema-bench
  #4), which flatters the party by about 7 %.
- **TR11 a cannot win.** The best swap using only modelled items (Crystal Gloves and Oath Veil on the
  DKs, Adamantite stats on Rikku, Stop fix, drain) wins **0/200**. Without Rabite's Foot, Darkness
  never lands on Eva 99 unless Trema is already chained.

## 3. Measurements (bench speed D = 0 unless marked; wins per seeds)

**Trema fresh.** "Build S" is Split's kit: Valiant Lustre +90/+90 on all three girls, Auto-Wall on
all three (Defense Bracer ×2, Adamantite on Rikku), Adamantite stats, and a Soul Spring drain at 0 s.

| Row | Wins | Min | Boss:party actions |
|---|---:|---:|---:|
| as built | 0/200 | 0.55 | 1.71 |
| Build S | 22/200 | 8.5 | 1.63 |
| S + E1 (Stop timed: 100 = 53 s) | 64/200 | 9.9 | 1.23 |
| **S + E1 + Three Stars on the DKs** | **157/200** | 10.3 | 1.09 |
| the same + 89 Megalixirs and 99 Mega-Potions | 158/200 | 10.3 | 1.09 |
| S + E1 + Three Stars, *noCross* (E4 bound) | 179/200 | 9.6 | 1.00 |
| S + E1, *anim 1.5 s* (E4 bound) | 148/200 | 12.6 | 0.81 |
| S + E1 + Three Stars, human speed D = 1.5 s | 20/40 | 12.6 | 1.69 |
| the same, *noCross* | 34/40 | 10.7 | 1.26 |

Ablation from the bold row, 200 seeds each: without Valiant Lustre **0**; without Rikku's Adamantite **0**;
without the drain 44; without E1 65; without Auto-Wall 73.

**Paragon (100 seeds), Build S + E1.** As the engine stands (physicals 3 %): 8. With *noCross*: 99. With
*anim 1.5 s*: 100. **With E3 (faithful physicals): 0, whatever E4 does** (0 to 2). Adding the wiki's
normal-Paragon kit on top of E3 and *anim 1.5 s*: Stamina Tonic and 99s 18; plus
**Ribbon-class immunity on all three 100**; Ribbon on Yuna only 58. E3 with Ribbon ×3, Tonic and
99s but no E4 bound: 75.

**Whole chapter (200 seeds).** S + E1 + E3 + Three Stars (Trema link) + Stamina Tonic (Paragon link)
+ Ribbon ×3 + 99s: **190/200 with *anim 1.5 s***, 174/200 with *noCross*, 1/100 with the engine's
timing. With **one** Ribbon (research: "most players have 0–1"): 30/200.

## 4. Proposals, smallest first (none built; each needs the word shown)

1. **Fix E1 as a bug (FFX-2, shared plumbing; its own review, Chapters 4 to 6 and XI change).** An
   unsourced duration on a timed status must not become permanent. Use §2.8's modal sourced
   value (Stop, Slow: 100 = 53 s), labelled `[estimate]`, or hold each row for a source.
   *Alone, on today's build: 0/40* (Rikku and Genesis kill the party first). *With P3:
   Trema 22 → 64/200.*
2. **Fix E2 as a bug (FFX-2; Chapter 4's Bahamut logs change).** Needed for the sourced Itchy cure
   and for crossing gates in battle. No direct win rate; it lets a line do what S2 and S8 describe.
3. **Kit, within TR10's line-up. It changes TR11 a, so it needs Bailey's word.** Replace TR11 a with
   Split_Infinity's own kit, the clear TR10 was chosen from. That means modelling Valiant Lustre
   (grid data), Auto-Wall on Defense Bracer and Adamantite, and the Soul Spring and Three Stars
   items, and wearing S2 and S3. One thing to check first: **can two or three girls wear one Valiant
   Lustre at once?** The wiki's plural "Dark Knights" says yes (`[single source]`); if not, it scores 0.
   *Estimate: Trema fresh about 70 % at bench speed and about 45 % at human speed with P1*
   (measured 157/200 and 20/40, less the proxy's free turns).
4. **Paragon.** With the faithful E3, no TR10 build tested wins without Ribbon-class immunity on all
   three and animation time. Options for Bailey, asked once:
   (a) **TR7 → Oversoul** (S10, 2 sources: easier; waits until hit; physicals miss). Its AI script
   is in SinirothX; not measured yet.
   (b) Keep Normal and add S8's kit: Stamina Tonic, Ribbon for all three via the International/HD
   **Abominable** grid (vegnagun §6, `[single source]`, but it would replace Valiant Lustre) or
   Itchproof, plus E4. *About 90 % for the chapter if E4 lands, about 15 % if only one Ribbon.*
   (c) TR1 b: Trema alone, Fiend Arena block (full HP; Agi 95; Luck 128 makes Darkness need the chain).
5. **E4: find a source before building.** A frame count of the in-game animations, the ATB
   behaviour during them, or an explicit "estimate" from Bailey. It is the largest lever measured
   (Paragon 8 → 99 to 100 as the engine stands, chapter 1 → 174 to 190), it touches every FFX-2
   chapter (deep review), and without a source it would be a guess. **Do not ship it as a bug fix.**
6. Keep E3 honest. Do not ship Paragon's 3 % physicals as the game; if E3 waits, label it
   `[conflict]` in the guide.

**Recommended order:** P1 + P2 (bugs, own review) → P3 (Bailey's word on the kit) → ask P4
(a) against (b) with these numbers, and the E4 source question, in one sheet. The boss data is
untouched throughout.

## Follow-up, 2026-09-25 (fix pass on this branch)

Built: **E1** (scoped to the two Cloister links by `EnemyGroupDef.timedAilmentDefaults`; Chapters
5 and XI keep their written "until cured" precedent until Bailey says otherwise), **E2**, **E3**,
and the E5 tools behind OFF-by-default kit options (`src/data/ffx2/builds/via-infinito-kit.ts`).
Measured in `docs/plans/trema-bench.md` (second pass). Two corrections to this note:

- **Valiant Lustre is +60 / +60, not +90 / +90.** The "Moogle Cureja, Defense +30, Magic Defense
  +30" cell of the wiki's *Garment Grid* table (revid 3998878) sits in its *Creature Abilities*
  column, what a captured fiend gets; ffx2-vegnagun-shuyin §6.6 agrees ("Stacks to +60/+60").
- The probes' Stamina Tonic doubled HP without the 9,999 cap (§2.4, `[verified: 2 sources]`); the
  built Tonic honours it. With both corrections and real turn costs, Trema alone with Split's kit
  is 30/200 (not 157/200), Paragon stays 0/200 with every kit, and the chapter is 0/200.
