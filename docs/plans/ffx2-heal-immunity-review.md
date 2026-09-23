# Paper preflight: FFX-2 percentage-damage immunity swallows a percentage heal (PR-0086)

Paper preflight under `critic/RUBRIC.md` §4 / AGENTS.md rule 15, written **before** any product
code. Track: `ffx2-heal-immunity`. `node tools/critic-plan.mjs --paths src/battle/ffx2/formulas.ts`
answers **DEEP** ("FFX-2 ATB engine is a shared system"; chapters ffx2-bahamut,
ffx2-vegnagun-shuyin). Answers critic round 09 **PR-0086** (major, chapter 6). Written 2026-09-23
by the round-09 repair agent.

**Verdict: PROCEED**, one clause in step 20 of `computeDamage`, no data change.

## 1. Game case (rule 14): FFX-2 only

The defect and the fix live in `src/battle/ffx2/formulas.ts`. FFX's `blockedByImmunity`
(`src/battle/ffx/formulas.ts`) has a similar percent clause but is not touched: no FFX chapter
ships a percentage heal onto a percentage-immune unit, and the FFX sources were not read for this
change.

## 2. What the sources say

- `research/ffx2-leblanc-syndicate.md` §4.4, White Wind: type **"Recovery, enemy party"**, restores
  **1/8 of max HP** to the enemy party and **cures all their negative statuses** [verified: 2
  sources]. §5.4 fact 3: with both henchmen dead she heals and wipes the party's Darkness.
- §3.1, §3.2, §3.3: the trio's immunity list includes **"Gravity/fractional"**, a status immunity
  to fractional (gravity-type) damage, shipped as the flag `immune-to-percentage-damage`.
- `research/ffx2-combat-core.md` §2.1 step 20 is titled **"Damage immunity"**: "fractional vs
  fractional-immune → IMMUNE". Nothing in either file makes a heal subject to it. A heal is not
  damage.

## 3. What is true today (measured, rule 3)

`tests/unit/chapters/leblanc-white-wind.test.ts`, before the fix: Act III, the round-09 probe's
driver, seeds 1-20: **20 White Wind casts, 0 heals, 40 IMMUNE misses**; the resolve-level case
(Leblanc 690/1380 and Ormi 672/1344, both Darkened) gives 2 IMMUNE misses on every seed, no HP and
no cure. Cause: step 20 sets `immune` for any `percent-total` ability on a flagged target whatever
its sign; `resolve.ts` then emits the miss and `continue`s before `applyRiders`, so
`removesStatuses` never runs either. `computeDamage` already zeroes only a *positive* immune
amount (`if (immune && amount > 0)`), so its own intent was damage-only.

## 4. The change

In step 20, the fractional clause gains `!heals` (the same `heals` spelled a few lines earlier:
`flags 'heals'` or the `healing` formula). Nothing else in step 20 changes: Null Physical, Null
Magic, Invincible and element immunity keep today's behaviour (not in scope, not sourced here).

Blast radius, from the data: the only FFX-2 units flagged `immune-to-percentage-damage` are the
three Act III Syndicate records (`src/data/ffx2/enemies/leblanc-syndicate.ts`), and the only heal
that reaches them is White Wind. Chapters 4 and 5 carry no such flag, so their fights are
byte-identical. Percentage *damage* on the trio (Quarter Pounder, Cripple, Demi) still reads
IMMUNE; the test pins it.

## 5. Acceptance

- Resolve level, 8 seeds: each living member heals inside 1/8 max HP through the step-7 randomiser
  (Leblanc 161-182, Ormi 157-177), Darkness is removed, no miss is emitted, dead Logos stays dead.
- Real engine, seeds 1-20: every White Wind hit heals; 0 IMMUNE misses.
- A non-gravity fractional attack on each of the three still returns `immune: true`, amount 0.
- `npx tsc --noEmit`, the Leblanc, strategy and FFX-2 formula/engine test files, then `npm test`.

## 6. Not decided here

The critic's acceptance quotes exact heals (172 / 168). The engine passes White Wind through the
step-7 randomiser, which combat-core §2.1 applies to everything except menu-cast White Magic, so
the heal is a band, not an exact eighth. Whether retail fractional heals skip step 7 is not in
`research/`; left as is.
