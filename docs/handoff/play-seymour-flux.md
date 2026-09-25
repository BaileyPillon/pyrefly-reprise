# Chapter 1 — Seymour Flux, on Mt. Gagazet

> **2026-09-25 (PR-0008, decisions-2026-09-25 item 5 B; branch `decisions-0925`).** Read this
> first. The status paragraph below is history: its 146/200 predates four sourced fixes.
> - **Today, FFX only:** the shipped line wins **78 of 160** over the four standard windows
>   (17 / 17 / 19 / 25) and **96 of 200**. Floors are 73/160 and 15/40, with at most 2 losses
>   before battle turn 10 (`tests/unit/strategy-seymour-flux.test.ts`). The method check refresh
>   is in `docs/plans/pr-0008-method-check.md` (2026-09-25 section). Nothing on the boss changed.
> - **Guide, FFX only:** rule 3 (Holy Water: the turn is often not there, a fallen Zombie stays
>   one) and rule 4 (the Dispel strips Protect before Cross Cleave, §4.2) are corrected. The
>   honest-odds rule and one Protect hint wait on Bailey: `docs/plans/pr-0008-guide-wordings.md`.
> - **First-attempt seed, both games (shared plumbing):** a run started from real keys draws a
>   fresh seed (`src/app/runSeed.ts`, via `openRun`). It is no longer seed 1, which lost Chapter 1
>   under both the line and the advisor. `__pyrefly.setSeed(n)` pins it for captures (`docs/DEV.md`).
>   Preflight: `docs/plans/ch1-seed-review.md`.
> - The test driver now lives in `tests/unit/helpers/seymourFluxDrive.ts`.

**Status: winnable, not yet reliable. 146 wins in 200 contiguous seeds (73%),
against 0 before this round.** The four measured seeds (1, 7, 42, 20260916) all
win and the chain completes. The project's bar for a chapter is 90%; this is
short of it and the gap is characterised at the bottom of this document rather
than papered over.

Everything below cites `research/ffx-seymour-flux.md` by section.

---

## 1. What was wrong

### 1.1 There was no tactic at all

`src/engine/tactics/seymour-flux.ts` exported `null`, so the generic ladder in
`BattlePresenterStrategies.ts` played the chapter — and its `bestEnemyTarget`
prefers a `flags.isPart` target over the boss it props up. That is right in
three of the five chapters and exactly wrong here.

Measured on the four seeds before anything was touched: **defeat on all four in
4–32 turns, with Seymour Flux on a full 70,000 every time** and only the
Mortiorchis dented. §2.2's correction box is why the mount is not a target:
its max HP floors at 1,000 and Mortibsorption revives it from every kill, for
ever, so it is an unbounded *diminishing damage tap* (4,000 / 3,000 / 2,000 /
1,000 / 1,000 …) and never a way to remove the adds.

### 1.2 Three canon rules were broken underneath that

Each is fixed with the smallest change that restores the cited rule, and each is
recorded in `docs/CONTRACT-CHANGES.md` (decisions 13–15).

**(a) Cross Cleave and Total Annihilation used the mount's stats.**
`src/data/ffx/enemies/seymour-flux-abilities.ts`,
`src/battle/ffx/abilities.ts`, `src/battle/ffx/execute.ts`.

§5.4 is a named section of the research that exists to settle this: both moves
are rows in **Seymour's** own decompiled `m142` list (§3.1, §3.2) and are merely
*animated* on the mount, so they compute with his Strength 30 / Magic 15. The
wiki lists them under both enemies, and §4.4.2's "On attribution" paragraph gives
the shipping rule — "the Mortiorchis actor owns the turn slot and the animation;
the Seymour actor owns the stats".

Measured before the fix, with the mount as the user: **Cross Cleave hit a
2,420-HP Tidus for 5,776 on enemy turn one**, where §5.2's table says 2,453 at
Defense 20 and three independent guides say "around 2,000". §5.4's own
comparison table prints 5,294 as the wrong answer and 2,275 as the right one.

Fix: `AbilityDef.extra.statsFrom` (data) → `ResolveOptions.statsUser` (engine),
read at exactly one place, the `DamageInput.user` handed to `computeDamage`.
Events, targeting, MP, CTB and gauges all stay with the acting mount, so the
animation and the log are unchanged. Inert for every other ability.

**(b) The phase-1 cycle inverted its parity.**
`src/battle/ffx/ai/seymour-flux.ts`.

§4.2 is a six-step cycle with **Seymour on the even steps** (Lance, Lance,
Dispel) and **the mount on the odd ones** (Full-Life, Full-Life, Cross Cleave).
The script kept one shared counter and advanced it once per enemy action, which
only reproduces that table while the two actors strictly alternate. They do not:
both are Agility 38, CTB hands the mount the first turn on a large share of
seeds, and a Banish turn or an alternation pass shifts the parity for the rest
of the phase.

Inverted, **every** mount turn fell through to its `else` branch — which was
Cross Cleave, the cycle's single biggest hit. Measured on seed 42: Cross Cleave
on enemy turns 1 *and* 4, party dead on turn 4, Seymour untouched at 70,000.

Fix: `stepFor(ai, parity)` snaps the shared counter to the acting actor's own
parity before reading it, so each actor always takes its own half of §4.2's
table and Cross Cleave happens once per six enemy actions, still immediately
after the Dispel.

**(c) Kimahri's Ronso Rage always resolved as Jump.**
`src/battle/ffx/overdrive.ts`.

`rollDefaultMinigame`'s `kimahri-rage` branch used
`user.overdrive.unlockedOverdriveIds[0]` and discarded `def.id` — the record the
command actually carried. Measured as `action-start{ command.id: 'mighty-guard',
abilityId: 'jump' }`: the command named Mighty Guard, the gauge was spent, and
Jump came out. That made §6 row 13's answer to Total Annihilation uncastable,
and with it §7.9.2's *rule* (not estimate) that Kimahri arrives with a full
gauge because he Lancet-learned Mighty Guard off Biran Ronso minutes earlier.

Fix: `rage.rageId = def.id`, matching the `lulu-fury` branch directly above it.

### 1.3 Build corrections (`src/data/ffx/builds/gagazet.ts`)

Both are §7.9.2 applied where the file had contradicted it, not balance changes.

| Field | Was | Now | Citation |
|---|---:|---:|---|
| `aeons[*].overdriveGauge` | 0 for all five | Valefor 100, Ifrit 75, Ixion 60, Shiva 50, Bahamut 100 | §7.9.2, "Aeon gauges — the part §7.9 omitted entirely" |
| Auron / Wakka / Lulu / Rikku `overdrive.gauge` | 0 | 70 / 30 / 45 / 35 | §7.9.2's per-character table |

The old aeon note read "reserve for this chapter — Seymour Banishes a summon
after one turn, so the aeon list mostly matters for that beat". That is the
exact reading §7.9.2 exists to overturn: *because* Banish leaves the aeon one
turn, a full gauge is the difference between a summon that Overdrives and one
that does nothing but stall, and §7.9.2 fixes the budget the encounter is to be
balanced against — "2 full aeon Overdrives + 1 full character Overdrive
(Kimahri's Mighty Guard) + ~3 more aeon Overdrives reachable inside the fight".
The reserve-character note read "untouched by the approach fights"; §7.9.2's
table is per character and does not distinguish bench from field, and character
gauges persist between battles.

**Nothing else in the build changed.** No stat, no ability, no equipment slot,
no item count. Raising Holy Water from 7 to the top of §7.8's 4–10 band was
tried and measured **exactly zero** difference (56/100 either way), so it was
reverted: the cures are not the binding constraint.

---

## 2. The winning line, in plain language

Party: the preset fields Tidus, Yuna and Kimahri, with Auron on the bench.

1. **Holy Water the Zombie, before anything else** (§6 row 4). Lance of Atrophy
   is Zombie at chance 100 — halved to ~50% by the three Zombie Wards §7.7.2
   buys — and the mount's very next turn is Full-Life, which on a living Zombie
   is 100% of max HP plus a guaranteed Death (§3.3). Cured first, that Full-Life
   whiffs outright on a living non-Zombie: one party turn for one enemy turn.
2. **Hastega, a Mighty Guard and a Poison Fang, in the first three turns.**
   Haste is the party's share of the clock (both enemies are Agility 38 against
   30/18/15). Mighty Guard is Protect *and* Shell on all three for one turn and
   no resource. The Poison Fang is §6 row 5's "Bio on Seymour, **turn one**" —
   1,400 a turn, flat, for ever, which is the largest single line in the party's
   damage budget; Lulu is benched in this preset so the actives use the Fang §6
   row 6 names, which applies Poison at chance 254 and skips his resistance byte
   of 90 entirely.
3. **Summon an aeon whenever one is available, in both phases** (§6 row 15,
   §4.4.2). This is the single biggest rule in the file and it is *defensive*
   first. While an aeon holds the field the party is off-stage with frozen CTB
   counters (ffx-combat-core §6.1) and Seymour's answer is Banish, which deals
   no damage at all — so one party turn buys the aeon's action plus roughly two
   enemy turns of nothing, while the poison keeps ticking.
4. **Keep everyone Protected and near full.** §4.2 pairs a party-wide Dispel
   (step 4) with Cross Cleave (step 5) and the two actors routinely take them
   back-to-back, so there is no turn in between to react in — the answer has to
   be standing before the strip. Protect halves the ~2,400; the Cheer ladder
   (§6 row 12, §5.5's defensive half) takes a third off on top; §7.8's seventeen
   Al Bhed Potions, four Mega-Potions and four Healing Waters pay for the rest.
5. **Auron takes the swinging turns** (§6 row 12's named route, "Cheer ×5 +
   Auron attacking, under Hastega"). §7.7.2 arms him for this fight by name and
   then benches him. His Piercing katana at Strength 40 is 2,030 a swing against
   Defense 40 (§5.6) where Kimahri's pierced spear is ~870; his 3,410 HP makes
   him the only member of the seven who survives an unprotected Cross Cleave;
   and he carries a Zombie Ward where Kimahri does not. Characters whose swing is
   worth less than a thrown item throw a Gem instead — §7.8 stocks forty of them
   and §1.2 makes all four interchangeable, because every element on both actors
   is Neutral.
6. **Dispel his Reflect** (§6 row 8) so his self-targeted Flare detonates on
   him for ~1,734 and costs him two more turns recasting.

Party switches are used to put the right character in the slot: they cost
nothing, because "the incoming member takes the turn that is happening right
now" (ffx-combat-core §1.7, `execute.ts` returns `rank: 0, handOffTo`).

### Two rules that read backwards and are measured

* **A zombified body is left on the floor** — unless it is Yuna or Tidus.
  Zombie survives KO in this engine on purpose (`statuses.ts SURVIVES_KO`,
  following ffx-yunalesca §15.2 #29 over ffx-combat-core §4.2's summary column),
  so a Phoenix Down on a zombified member hands the next Full-Life the same
  guaranteed kill again, for ever. Left down they are not a legal Full-Life
  target at all (§4.8 picks from *living* zombified members) and the mount wastes
  the turn. Worth 3.0 deaths a run → 1.5, and 48% → 56%.
  The exception is the two members whose absence removes a whole system rather
  than a body: Yuna is the only summoner (a Yuna on the floor means no aeons —
  on seed 1 she died on the second enemy action and the party fought thirty-five
  turns two-handed and lost with Seymour on 54,702), and Tidus is the only
  Hastega. +6 wins in 100 seeds, and the difference between seed 1 losing and
  seed 1 winning in 82 turns.
* **Dispelling his Protect is not worth the turn**, though §6 row 9 names it.
  `formulas.ts` applies Protect at step 5 to `damageType: 'physical'` only, and
  most of this party's damage is thrown items at `damageType: 'other'`, which his
  Protect never touches. Stripping both cost 6,000 of the party's own damage a
  run and dropped 66 wins to 54 in 100 seeds.

### Canon strategies deliberately not played

Provoke (§6 row 19 — both immune at 255), the four Breaks and Threaten (§6 row
20 — Flux immune to all four), and Delay Attack / Delay Buster (§6 row 21 — the
delay fails *and* counters with party-wide Slowga). All three rows are offered to
Tidus every turn and the tactic never picks them.

---

## 3. Measurements

Harness: `critic/scratch/ch1-bench.test.ts` (win rate, damage attribution, KO
causes, turn accounting), `ch1-autopsy.test.ts` (the four seeds),
`ch1-log.test.ts` (a single run's action stream), `ch1-ceiling.test.ts` (a
hand-written survival-only line, used to prove the encounter was not simply
unsurvivable). Run them with
`npx vitest run --config critic/scratch/vitest.scratch.config.ts`.

| Line | Seeds 1–200 |
|---|---:|
| Before (no tactic, generic ladder) | **0** |
| After the three canon fixes, before the tactic | 0 |
| Shipped tactic | **146 / 200 (73%)** |

Forty-seed windows: 30 (from 1), 26 (from 41), 34 (from 101), 30 (from 1001).
Hundred-seed windows: 72 (1), 67 (201), 66 (401).

Where the damage comes from, per run, averaged over 200 seeds: poison 17,353,
player attacks and thrown items 33,279, aeon actions 9,023.

The four required seeds: 1 → victory in 82 turns; 7 → 111; 42 → 75;
20260916 → 64. All one link; all end with Mortiorchis alive at its 1,000 floor,
which is §2.2's invariant.

---

## 4. What still caps it at 73%, in order of size

1. **The opening combo cannot be answered.** Roughly six runs in a hundred die
   between turn 8 and turn 17 with Seymour still above 60,000. The cause is
   always the same: Lance of Atrophy zombifies on enemy action 1 and the mount's
   Full-Life kills on action 2, with **no party turn in between** — the two
   actors are Agility 38 apiece against an unhasted party, so the party's first
   turn can land after four enemy actions. There is no play here; the research's
   own answer is equipment (§6 rows 1–3: Zombieproof, or Auto-Med), and §7.7.1
   shows the Gagazet preset genuinely cannot afford either. This is arguably the
   encounter working as designed, and it is the honest floor on the win rate
   with the §7.7.2 loadout.
2. **Yuna's 1,500 HP cannot survive a Total Annihilation even through Shell**
   (§5.2: ~1,900–2,000 shelled). In phase 2 she dies to it every time unless an
   aeon is holding the charge, and by phase 2 the aeons are usually spent.
   Banking aeons for phase 2 was tried at reserves of one, two and three and lost
   every time (48%, 60%, 40%) — the shield is worth more early than the stall is
   worth late. A preset Yuna at the top of §7.3's 1,200–1,800 band would change
   this; that is a build question for the coordinator, not a tactic question.
3. **Dispel only strips one member.** `src/data/ffx/abilities/whitemagic-cure.ts`
   gives Dispel `targeting: 'single-any'` with an `[estimate]` note, but §3.1
   decodes Seymour's Dispel as **Characters' Party**. The engine currently plays
   it in the party's favour, so fixing it would *lower* this win rate — flagged
   here rather than changed, because it is the shared player-facing record and
   correcting it is the abilities agent's call.
4. **`extra.restoresPool` is still never read**, so Ether, Turbo Ether and Elixir
   restore HP rather than MP (the same finding `strategy-chapter2.test.ts`
   records). Yuna's 270 MP is a fixed budget for a 70,000-HP fight and the tactic
   never tries to refill it.
5. **Mortibsorption does not fire Seymour's threshold counters.**
   `ai/reactions.ts runMortibsorptionIfDown` collects
   `seymourThresholdCounters(...)` and then discards them (`void command`). §4.3
   is explicit that Mortibsorption damage **does** trigger the 75% Protect and
   50% Reflect reactions where poison does not. Left alone deliberately: fixing
   it makes the boss *harder*, and it is not load-bearing on the win — but it is
   a canon deviation and should be closed by whoever next owns the script.

## 5. Files

- `src/engine/tactics/seymour-flux.ts` — the line (was a `null` placeholder).
- `tests/unit/strategy-seymour-flux.test.ts` — the acceptance test: four seeds,
  a forty-seed regression net, a mechanics assertion, and the "kill the mount
  instead" wrong-tactic test.
- `src/battle/ffx/ai/seymour-flux.ts` — §4.2 parity fix, §6.1 targeting fix.
- `src/battle/ffx/abilities.ts`, `src/battle/ffx/execute.ts`,
  `src/data/ffx/enemies/seymour-flux-abilities.ts` — §5.4 `statsFrom`.
- `src/battle/ffx/overdrive.ts` — named Ronso Rage.
- `src/data/ffx/builds/gagazet.ts` — §7.9.2 Overdrive gauges.
- `docs/CONTRACT-CHANGES.md` — decisions 13, 14, 15.
