# Paper preflight: three sourced combat fixes to live chapters (combat-fixes-0924)

Paper preflight under AGENTS.md rule 15 / `critic/RUBRIC.md` §4, written **before** any product
code. `node tools/critic-plan.mjs --paths src/battle/ffx2/hit.ts,src/battle/ffx/ai/reactions.ts,src/data/ffx/enemies/braskas-final-aeon.ts`
answers **DEEP** ("FFX-2 ATB engine is a shared system"; "FFX CTB engine is a shared system";
chapters ffx2-bahamut, ffx2-vegnagun-shuyin, seymour-flux, yunalesca, braskas-final-aeon).
Branch `combat-fixes-0924` in the worktree `D:/pyrefly-combat`, off main `300f87d2`.
**Held for Bailey: these change difficulty; nothing merges to main from this track.**
**Update 2026-09-24 ~19:20 EDT: Bailey took every recommendation ("I'll go with all your
recommendations"): (a) and (b) are merged to main (cherry-picked with `-x`, section 8), (c) stays
as it is (unsourced), and the Poison crossing of section 6 Q2 is built as (d) (section 8).**

Written 2026-09-24. Numbers in section 5 were produced by running the engine (rule 3):
`tests/unit/combat-fixes-bench.test.ts` (`PYREFLY_MEASURE=1`) on this branch, before and after.

## 0. Verdicts

| Fix | Game case (rule 14) | Verdict |
|---|---|---|
| (a) FFX-2 magic never rolls the hit check | FFX-2 only | PROCEED (research does not say X-2 magic can miss; one sourced exception kept) |
| (b) Chapter I: Mortibsorption runs Seymour's threshold counters | FFX only | PROCEED |
| (c) Chapter III: Braska's Final Aeon Provoke-immune | FFX only | **STOP, not built**: the cited source is Yu Yevon's table, not BFA's |

## 1. (a) FFX-2 magic can miss

### What the sources say

- AGENTS.md hard rule 5: "Magic and every Overdrive always hit (`canMiss: false`); only physical
  attacks roll."
- `research/ffx2-combat-core.md` §2.6 decodes the hit check as a points race and every rule in its
  table is about **physical** attacks: "Guaranteed hit | target is **Asleep** or **Stopped** ⇒
  physical attacks always connect"; the calibration note: "which is exactly why party physicals
  never miss in FFX-2 without Darkness". Darkness: "physical attacks frequently miss" (§2.8).
  Evade & Counter: "attempt to evade the incoming physical attack".
- §2.9's legend: "`Stat` in the *Accuracy* column | use the §2.6 hit equation". The Black Mage,
  White Mage, Gun Mage, Dark Knight, Trainer, Mascot and special-dressphere tables carry **no
  Accuracy column**; Samurai and Berserker carry one, and none of their rows is a `Mag` / `Sp Mag`
  row.
- **Nothing in `research/` says FFX-2 magic can miss.** So the fix proceeds.
- **The one sourced exception:** the Gunner table lists
  `| Enchanted Ammo | 20 | — | — | — | Stat | Sp Mag |`, i.e. a magic-formula shot that **does**
  use the §2.6 hit equation. It stays rolling, by an explicit `canMiss: true` on its data row.

### What is true today (run, not grepped)

`hitPercent` (`src/battle/ffx2/hit.ts`) returns 100 only for a numeric `accuracy`, `canMiss: false`,
`formula: 'none'`, or a restorative action on the user's own side. Every other `damageType:
'magical'` action rolls §2.6. Enumerated from the merged registry (data table + engine fallback):
106 magical rows, 66 roll. Party-side hostile ones: Black Magic Lv.1-3, MP Absorb, Holy, Flare,
Ultima, Osmose, Drain, Demi, Black Sky, the Gun Mage Blue Bullets (Absorb, Fire Breath,
Annihilator, Supernova, Cry in the Night), Floral Fallal's Whirls and Pollen, Full Throttle's
Wings, Moogle Beam, Enchanted Ammo. Enemy-side ones (engine fallback registry, Chapter V):
the Nodes' -aga spells and Flare, Vegnagun's Vita Brevis / Memento Mori / Pallida Mors / Odi Et
Amo / Mors Certa / Nemo Ante Mortem Beatus, Redoubt Demi, Shuyin's Force Rain (Chapters IV and VI
enemy magic is already `canMiss: false`). Heals that roll only on a cross-side target.

### The change (at the rule, not per row)

In `hitPercent`, after the numeric-`accuracy` and `canMiss === false` guards: **return 100 when
`damageType === 'magical'` and `canMiss !== true`.** One data change: `canMiss: true` on
`x2-gunner-enchanted-ammo` (the §2.9 `Stat` row). A numeric `accuracy` still wins, because §2.9
says "a number there is a flat override hit %" (Mad Rush's 70).

- Both sides: rule 5 is not side-specific, and no source gives enemy magic a hit roll. Enemy magic
  in Chapter V stops missing the party. This makes Chapter V harder; measured in §5.
- Status riders on a magic action (Pain, Bio-like riders) still roll §2.6a infliction: that is a
  separate check and untouched.
- `previewHitChance` / `simulate.ts` read the same function, so the card shows 100 %.
- Reflect, Nul-statuses, `misses-if-target-alive` and immunity are resolved elsewhere, untouched.

## 2. (b) Chapter I: Mortibsorption's threshold counters are dropped

### Source

`research/ffx-seymour-flux.md` §2.2: "Mortibsorption damage **counts as \"being attacked\" for
Seymour's HP-threshold AI checks** (see §4.3). Poison damage does **not**. `[verified: 2 sources:
wiki + independent web aggregation]`", and §4.3's table: "HP loss came from **Mortibsorption** |
**Does** trigger threshold/pattern change". §4.3: Protect below 75 %, Reflect below 50 %.

### What is true today

`src/battle/ffx/ai/reactions.ts#runMortibsorptionIfDown` computes
`seymourThresholdCounters(ai, false)` after the drain and then `void command;`s every one. The
Reflect branch also sets the phase flag to 2, so his next turn is phase 2's `flare-self` **without
Reflect**: the Flare detonates on Seymour himself (measured 1,639 on seed 3 by the Fallen Aeons
verifier; re-measured in §5). The Protect counter is lost the same way.

### The change

Execute the counters the way Chapter X's `runNatusMortibsorption` does (commit `cca51807`): for each
command, skip if `!canCounter(ctx, host)`, emit a `counter` event (actor Seymour, target the
Mortiorchis, `cause: 'script'`), then `executeCommand(ctx, host, command, true)` at no CTB cost.
A later player-side collector in the same action sees Protect/Reflect already up and adds nothing,
so nothing doubles. Chapter X's branch returns first and is untouched.

## 3. (c) Chapter III: Braska's Final Aeon and Provoke — STOPPED

The brief cites `research/ffx-bfa-yu-yevon.md` ~line 406. That line is in **§3.2, Yu Yevon's**
immunity table ("Death, Petrify, Sleep, Silence, Dark, Confuse, Berserk, Provoke, Threaten, ..."),
and Yu Yevon's data row already carries `provoke: 255`. Braska's Final Aeon's own table is **§1.2**
(`[verified: 2 sources for the whole table — decompiled struct bytes 40–79 and the wiki bestiary
infobox]`): it lists Death, Petrify, Sleep, Dark, Slow, Regen, Doom, Threaten, Eject, Distillers,
Bribe and Delay as immune, and **does not mention Provoke** (nor Confuse or Berserk). No other file
in `research/` gives BFA a Provoke resistance. Adding `provoke: 255` to BFA would be invented data
(hard rule 6). **Not built.** The question for Bailey is in §6; §5 records what Provoke does in
Chapter III today, measured, so the answer can be weighed.

## 4. Tests (each fails on today's code first)

- `tests/unit/ffx2-magic-never-misses.test.ts` (a): every party-side hostile magical row and every
  enemy magical row hits at 100 % against EVA Up x10 with a blinded caster; Enchanted Ammo still
  rolls; a physical Attack still rolls; a numeric `accuracy` is still the flat override; an engine
  run of Chapters IV-VI (20 seeds each) shows zero `evaded` misses from a magical action; and the
  set of magical rows that opt back in with `canMiss: true` is pinned to Enchanted Ammo alone.
  Against main: with only `hit.ts` reverted, three cases fail (both 100 % sweeps and the Chapter V
  run); with main's `hit.ts` **and** `gunner.ts`, five fail (those three, the Enchanted Ammo check
  and the opt-in pin, since main's Enchanted Ammo row has no `canMiss`). Corrected in the repair
  pass: the first version of this section said three without naming which files were reverted.
- `tests/unit/chapters/seymour-flux-mortibsorption.test.ts` (b): drain Seymour across 75 % and
  50 % by killing the Mortiorchis; Protect and Reflect land from `counter` events; his next Flare
  bounces off him instead of hitting him (seeds 1-5); a Threatened Seymour does not counter; a
  drain that stays above both thresholds fires nothing. The first two fail on main's
  `reactions.ts`.
- `tests/unit/combat-fixes-bench.test.ts`: the 200-seed bench behind §5, printed only under
  `PYREFLY_MEASURE=1`; by default a 10-seed smoke that every battle ends.

## 5. Measured: win rates across 200 seeds, before and after

`PYREFLY_MEASURE=1 npx vitest run tests/unit/combat-fixes-bench.test.ts`, run on this branch with
the fixes out ("before" = main `300f87d2`'s `hit.ts` and `reactions.ts`) and in ("after").
FFX-2: Wait mode, 0 ms a menu, the whole chain, no retry. FFX: CTB, one battle. "Evaded magic" =
`miss` events with reason `evaded` from a magical action, summed over the 200 seeds.

| Chapter | Fix | Line | Wins before | Wins after | Evaded magic before (party / enemy) | After |
|---|---|---|---:|---:|---:|---:|
| IV Bahamut | (a) | intended (`intendedStrategy`) | 200/200 | 200/200 | 0 / 0 | 0 / 0 |
| IV Bahamut | (a) | wrong: mash Attack, no upkeep | 0/200 | 0/200 | 0 / 0 | 0 / 0 |
| IV Bahamut | (a) | magic-first: upkeep, else strongest magic | 200/200 | 200/200 | 0 / 0 | 0 / 0 |
| V Vegnagun + Shuyin | (a) | intended | **191/200** | **187/200** | 55 / 490 | 0 / 0 |
| V Vegnagun + Shuyin | (a) | wrong: mash Attack | 0/200 | 0/200 | 0 / 0 | 0 / 0 |
| V Vegnagun + Shuyin | (a) | magic-first | 0/200 | 0/200 | 0 / 211 | 0 / 0 |
| VI Leblanc | (a) | intended | 194/200 | 194/200 | 0 / 0 | 0 / 0 |
| VI Leblanc | (a) | wrong: mash Attack | 17/200 | 17/200 | 0 / 0 | 0 / 0 |
| VI Leblanc | (a) | magic-first | 194/200 | 194/200 | 0 / 0 | 0 / 0 |

| Chapter | Fix | Line | Wins before | Wins after | Self-Flares on Seymour before | After | Counters off the drain before | After |
|---|---|---|---:|---:|---:|---:|---:|---:|
| I Seymour Flux | (b) | intended (shipped tactic: kill Seymour, leave the mount) | 116/200 | 116/200 | 110 | 107 | 0 | 530 |
| I Seymour Flux | (b) | drain-farm (§6 row 17: hits go to the Mortiorchis) | 14/200 | 14/200 | 0 | 0 | 0 | 81 |
| I Seymour Flux | (b) | wrong: mash Attack, no upkeep | 0/200 | 0/200 | 0 | 0 | 0 | 0 |

| Chapter | Fix | Line | Wins (today; (c) not built) | Provoke landed on BFA |
|---|---|---|---:|---:|
| III link 1, Braska's Final Aeon | (c) | intended | 193/200 | 0 |
| III link 1, Braska's Final Aeon | (c) | provoke: Tidus keeps Provoke on BFA, else intended | 30/200 | 200 |

What the numbers say:

- **(a) moves only Chapter V** (191 -> 187 on the intended line). Its losses sit on the Leg: 9 ->
  13 of 200 lost, 8 -> 11 of them on link 2, where the Nodes' -aga spells used to be dodged 490
  times. Chapters IV and VI cast no rolling magic (Bahamut's and the Syndicate's rows were already
  `canMiss: false`; the Bevelle and Chateau builds carry no rolling party magic), so their event
  logs are **byte-identical** (20 seeds, intended line, hashed before and after), and so are
  Chapters II and III. On the Active path at 1.5 s a menu (the old golden's arm, not the default
  mode) Chapter V goes from 2/10 to 0/10; over 40 seeds (repair pass) it goes 5/40 -> 4/40 at
  1.5 s a menu and 27/40 -> 25/40 at 750 ms.
- **The 191 -> 187 is within seed noise.** On a second, independent block (seeds 201-400, same
  line, repair pass) Chapter V goes **189 -> 191**; over the 400 seeds, 380 -> 378.
- **Inside the chain, the Head link's long-stall tail shrinks** (measured in the repair pass; the
  first version of this plan did not mention it). Head link, intended line, per run that reached it:

  | Seeds | Party actions, median before -> after | p90 before -> after | Party KOs on the Head | Mors Certa casts |
  |---|---:|---:|---:|---:|
  | 1-200 | 60 -> 59 | **133 -> 72** | 37 -> 5 | 561 -> 147 |
  | 201-400 | 59 -> 59 | **137 -> 84** | 30 -> 11 | 570 -> 219 |

  Fought **on its own** from a fresh Farplane build (200 seeds), the Head gets slightly *harder*:
  200 -> 199 wins, median party actions 100 -> 117, p90 158 -> 163, Mors Certa 1,096 -> 1,332. So
  the in-chain effect comes from the state the chain carries into the Head (the earlier links now
  resolve differently), not from the Head's own rows; the mechanism is not pinned further here.
  The typical Head fight is unchanged; the rare very long one got rarer.
- **Chapter XI (Fallen Aeons, registered, unlisted)** re-benched with its own
  `fallen-aeons-bench.test.ts`: every row identical to `docs/plans/fallen-aeons-bench.md` except
  "kill Mindy first with Drain", still 0/200 (Drain now always lands on Mindy's Eva 76; ticks
  172,169 -> 180,059, Delta Attacks 0.67 -> 0.77).
- **(b) does not move a win rate.** Win counts are identical on all three lines. The fix is
  correctness: the drain's Protect/Reflect now land (530 counters over 200 intended runs). With the
  drain carrying Seymour across 50 % on seeds 1-5 (a direct engine setup, the unit test), the old
  engine detonated his next Flare on himself for 1,754 / 1,727 / 1,666 / 1,700 / 1,720; now it
  bounces off his Reflect onto the party every time.
- **The remaining self-Flares are two other paths, not this bug.** Of the 107 after the fix, 93
  follow a Reflect the party Dispelled (the sourced §5.3 damage play) and **14 follow Poison
  carrying him below 50 %** (seeds 11, 12, 41, 46, 52, 53, 73, 77, 89, 114, 125, 130, 155, 185:
  the 1,400 tick is the crossing). See §6 Q2.
- **(c) today:** Provoke lands on every try and the provoke line wins 30/200 against 193/200.
  Provoke makes BFA's single-target attacks all go to Tidus, so a Provoke immunity would make the
  chapter *easier* for a player who tries it, not harder.

## 6. Questions for Bailey

1. **(c) Braska's Final Aeon and Provoke.** The source the brief named is Yu Yevon's table, and
   BFA's own verified table (§1.2) is silent on Provoke. Options: (i) leave BFA Provoke-able, as
   today (the §1.2 table is decompiled struct bytes, and it does not list Provoke); (ii) research
   BFA's Provoke resistance first (the decompiled struct's byte, or a second guide), then decide.
   Nothing is built until you pick. Measured cost today: the provoke line 30/200 against 193/200.
2. **Poison crossing 50 % in Chapter I (found here, not built).** `research/ffx-seymour-flux.md`
   §4.3: "HP loss came from **Poison** | **No threshold reaction, no pattern change**". The AI's
   `currentPhase` (`src/battle/ffx/ai/seymour-flux.ts`) switches to phase 2 on HP alone, so
   Poison below 50 % starts the Flare loop without the Reflect, and the first Flare hits Seymour
   (14 of 200 intended runs). A sourced fix would hold phase 1 until a direct hit or a drain fires
   the Reflect counter. It changes Chapter I's difficulty, so it needs your yes.
3. **Chapter V gets 2 % harder under (a)** (191 -> 187), because enemy magic stops missing the
   party too. Hard rule 5 is not side-specific and no source gives enemy magic a hit roll; the
   alternative (party magic only) would be a reading the sources do not make.

## 7. Disclosures

- The FFX-2 data catalog's Vegnagun / Node / Redoubt / Shuyin rows (`src/data/ffx2/enemies/shuyin-abilities.ts`,
  ids `x2-vegnagun-*`, `x2-node-*`, `x2-redoubt-*`, `x2-shuyin-*`) carry `accuracy: 0`, which
  `hitPercent` reads as a flat 0 % (never hits). The engine does not resolve those rows today (it
  uses its own fallback ids, `pallida-mors`, `force-rain` ...), so nothing plays differently; if they
  were ever wired, every one of them would miss. Recorded, not changed (outside this brief).
- **Hard rule 5's guard direction.** `hit.ts` tests `canMiss !== true` for magical rows: an unset
  field hits (the safe direction rule 5 asks for), and only an explicit `canMiss: true` rolls. The
  rule's wording ("Guards test `!== false`, never `=== true`") is written for the opposite case,
  where an unset field would silently roll. So that the opt-in can never be silent, the set of
  magical rows carrying `canMiss: true` is pinned in `ffx2-magic-never-misses.test.ts` (today: only
  the sourced Enchanted Ammo); a new one fails the test until its source is named.
- **Dark Knight Darkness still rolls against evasion (pre-existing, not changed).** `x2-dark-knight-darkness`
  (`damageType: 'other'`) carries `canMiss: true`, and `research/ffx2-fallen-aeons.md` §4.2 and §5
  say Darkness "cannot be evaded" / "does not miss". Fix (a) does not touch it (it is not magical);
  in the Chapter V intended line it is evaded 261 times before and 237 after over 200 seeds (re-measured in the repair pass).
  This is the Fallen Aeons track's open item **FA-G6**: its review found that claim unsourced ("None
  of the five wiki pages says so", `docs/plans/chapter-fallen-aeons-review.md`), and FA7 asks for two
  sources before an FFX-2 data change that touches Chapters 4 to 6; there are none today. Left as it
  is (rule 6); it belongs to that question, not to this branch.
- `tests/unit/ffx2-atb-golden.test.ts` re-pins `CH5_D0` and `CH5_D1500` with the reason and the
  proof in its doc comment: with the roll still drawn and only the miss ignored, exactly the seeds
  with no evaded magic reproduce the old hashes. `CH4_*` unchanged.

## 8. After Bailey's answers (2026-09-24 ~19:20 EDT): the merge, and (d) the Poison crossing

Bailey, verbatim: "I'll go with all your recommendations". So: **Q1** (c) Braska's Final Aeon keeps
Provoke as it is (unsourced, not built); **Q2** build the Poison-crossing fix; **Q3** (a) stays on
both sides.

### The merge

Branch `combat-fixes-0924` cherry-picked onto main with `-x`, in order, with no conflict (main had
since gained the Fallen Aeons engine in `src/battle/ffx2` and the Natus engine in `src/battle/ffx`;
neither touches `hit.ts`, `gunner.ts` or the Chapter I branch of `reactions.ts`):
`3cb97d9f` -> `92f60f02`, `3b7f0a2d` -> `881d4548`, `8bcb1e89` -> `617a45b8`, `e694fc3f` -> `a999d133`.
Re-benched on main below: every section 5 number reproduces on the merged tree.

### (d) Chapter I: Poison carrying Seymour below 50 % (FFX only)

**Source.** `research/ffx-seymour-flux.md` §4.3's table: "HP loss came from **Poison** | **No
threshold reaction, no pattern change** | The check only fires on direct attacks and on
Mortibsorption", and "HP loss came from **Mortibsorption** | **Does** trigger threshold/pattern
change" `[verified: 2 sources: wiki + independent web aggregation restating the same 75%/50%
Protect/Reflect thresholds and the poison-exclusion rule verbatim]`. §4.8's pseudocode puts the
Reflect counter and `enterPhase2()` in the same `onDamaged(source)` block, guarded by
`source !== DamageSource.POISON`.

**What was true (run, not grepped).** `seymour-flux.ts#currentPhase` returned phase 2 whenever
Seymour's HP was below 50 %, whatever took it there. A Poison tick across 35,000 therefore opened
the Flare loop with no Reflect up, and his first Flare hit himself (14 of 200 intended runs, §5).

**The change.** The phase is state, not HP, the way Chapter X stores Natus's
(`seymour-natus-rules.ts#stepNatusPhase`):

- `seymour-flux.ts#fluxPhase` reads the stored `seymour.phase`; both scripts use it and never HP.
- `seymour-flux.ts#stepFluxPhase` moves it to 2 when HP is below 50 %. Only two callers:
  `reactions.ts#collectBossCounters` when a party-side action damaged Seymour, and
  `reactions.ts#runMortibsorptionIfDown` after the drain. A Poison tick reaches neither (it is dealt
  in `ticks.ts#onTurnEnd`, with no source), so Poison below 50 % leaves him in phase 1 until the
  next real hit, which fires the Reflect counter and opens phase 2 together.
- **Threaten:** a Threatened Seymour still cannot counter, but the hit still moves the stored phase
  (the phase change is not an action). That is what the engine did before this change for a
  Threatened hit, and what Chapter X does; the sources do not address the case. Disclosed, our reading.
- The intent panel (`intent.ts#countersFor`) keeps showing "Below 50% HP Seymour answers with
  Reflect and phase 2 opens" while the stored phase is still 1, so it stays true after a Poison
  crossing.
- Not covered: a party Counterattack / Magic Counter reaction does not call the collector, so it
  would not move the phase. The Gagazet build carries neither ability (checked), so nothing plays
  differently today.

**Tests.** `tests/unit/chapters/seymour-flux-poison-crossing.test.ts`: on seeds 1-5 a Poison tick
from 35,500 to 34,100 fires no counter and leaves the phase at 1; his next three casts are phase 1
rows (Lance of Atrophy / Dispel), never a self-hitting Flare; the next direct hit fires exactly the
Reflect counter, stores phase 2, and his Flare then bounces off him; a Threatened hit moves the
phase without a counter; a hit on the Mortiorchis alone does not move it. Run against the merged
tree without (d): the phase-1 and Mortiorchis cases fail.

### Measured: 200 seeds, before and after, on main

`PYREFLY_MEASURE=1`, `combat-fixes-bench.test.ts` plus the chapters' own benches
(`yojimbo-bench`, `natus-bench`, `fallen-aeons-bench`). **Before** = main `a213e4cb` (no combat
fix); **merged** = `a999d133` ((a) + (b)); **after** = `a999d133` + (d). Each column is its own clean
worktree, so other tracks' commits do not enter it.

| Chapter | Line | Before | Merged | After | Notes |
|---|---|---:|---:|---:|---|
| I Seymour Flux | intended | 116/200 | 116/200 | **112/200** | self-Flares on Seymour 110 / 107 / 83; counters off the drain 0 / 530 / 506 |
| I Seymour Flux | drain-farm | 14/200 | 14/200 | 14/200 | counters off the drain 0 / 81 / 81 |
| I Seymour Flux | wrong (mash Attack) | 0/200 | 0/200 | 0/200 | |
| IV Bahamut | intended | 200/200 | 200/200 | 200/200 | |
| IV Bahamut | wrong | 0/200 | 0/200 | 0/200 | |
| V Vegnagun + Shuyin | intended | 191/200 | 187/200 | 187/200 | evaded magic 55+490 / 0 / 0 |
| V Vegnagun + Shuyin | wrong | 0/200 | 0/200 | 0/200 | |
| VI Leblanc | intended | 194/200 | 194/200 | 194/200 | |
| VI Leblanc | wrong | 17/200 | 17/200 | 17/200 | |
| IX Yojimbo (unlisted) | intended / magic-race / wrong | 200 / 143 / 0 | same | same | |
| X Seymour Natus (unlisted) | upper: intended / poison-wait / provoke-reflect / drain-farm / wrong | 116 / 0 / 200 / 35 / 0 | same | same | midpoint rows also unchanged |
| XI Fallen Aeons (unlisted) | Road intended (whole chain) | 51/200 | 51/200 | 51/200 | every link row identical; "Mindy first with Drain" ticks 172,169 -> 180,059 under (a), 0/200 throughout |

**What (d) does to Chapter I.** Over 400 seeds of the intended line (1-400): **227 -> 214 wins**
(116 -> 112 on 1-200, 111 -> 102 on 201-400). 104 of the 400 runs have a Poison tick carry Seymour
across 50 %; **all 33 runs whose outcome changed are among them** (23 wins became losses, 10 losses
became wins), and no other run moves. Mechanism: the bug handed the party free self-Flares
(~1,700 each; 203 -> 134 over the 400 seeds), and the sourced rule takes them away. The chapter is
about 3 % harder on its intended line; nothing on the boss was tuned.

The shipped advisor (`src/engine/tactics/seymour-flux.ts`, owned by another track) still reads
phase 2 from HP. Measured in a scratch copy only, making it read the stored phase instead is
*worse* (214 -> 198 over 400 seeds: it holds the aeons longer), so no advisor change is proposed.
