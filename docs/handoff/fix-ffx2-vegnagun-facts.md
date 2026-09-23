# fix-ffx2-vegnagun-facts — two fact-checker findings in chapter 5 (2026-09-21)

**Case: FFX-2 only** (hard rule 14). Chapter 5 enemy data, the chapter 5 strategy guide and
`research/ffx2-vegnagun-shuyin.md`. No FFX record, engine or guide was touched; the one new
test helper that reads both games' enemy tables says so in its header.

Branch `claude/serene-haslett-e9c384` (worktree), one commit on top of `dc1979f`. **Not pushed,
not deployed.** Found by the atlas fact-checkers (`docs/concepts/atlas/README.md`).

## 1. "Cast Reflect on the Leg" — settled by the research itself; the guide was wrong

- **Sources.** §3.2 line 236 lists the Leg as immune "as Tail **plus Reflect**" under
  `[verified: 2 sources]` (line 238); the Nodes are "as Leg plus…" (line 264); §3.5 line 441
  restates it ("all but the Tail Reflect-immune"), also verified. The §7.2 table carries **no
  confidence tag on any row**, and the appendix never checked the Reflect line. By the doc's own
  source-ranking policy (§0, §3 header) this is one tagged statement against one untagged one,
  not two sources in conflict, so no question for Bailey was needed.
- **Engine, by running it** (real `FFX2Engine`, `farplaneBuild`, the real Leg + Nodes group,
  40 seeds): Yuna's shipped Reflect is `all-allies`, the Leg was in `validTargets` 0/40, and a
  cast "aimed" at the Leg lands on the party. With targeting removed as a cause (a test-local
  `single-any` copy) it landed on the Leg 0/40, on Node A 0/40 and on the **Tail 40/40**
  (§3.1 says the Tail is not immune; the data agrees). `reflect: 255` becomes "immune" in
  `src/battle/ffx2/resolve.ts` `applyRiders` (`resist >= 255` → skip, no `miss` event).
- **The second half of §7.2's line is dead too.** `ffx2-combat-core.md` line 473
  (`[verified: 2 sources]`): Reflect bounces single-target magic **back at the caster** and
  multi-target spells are not reflected. Four of the five Yellow Node spells are all-party, and
  a bounce would go to the Node, not "at the Leg". And the FFX-2 engine has **no bounce logic at
  all** (measured: 20 battles with a permanently Reflected party, zero bounces), which
  `play-ffx2-vegnagun-shuyin.md` already lists as a known gap. Adding bounce is combat-core work
  and new gameplay: it needs Bailey's yes (hard rule 10) and was not proposed here.
- **Changed.** `src/data/guides/ffx2-vegnagun-shuyin.ts`, Leg phase: the note now reads "All
  18,220 HP of damage goes into the Leg; the Nodes hold 300,000 and are not the fight. Green
  Nodes heal and buff the Leg, which is immune to Reflect." (cite `§3.2, §7.2`; every clause
  sourced and measured; no developer vocabulary in the player text, CHK-007). The research doc
  got a **CORRECTION** note under the §7.2 table (cell left as written, per the Hero Drink
  precedent) and appendix §13 row 26, "Contradicted (internal)".
- **Tests that would have caught it.**
  `tests/unit/ffx2-vegnagun-reflect-immunity.test.ts` (6 tests, 20 seeds, ~0.2 s): the shipped
  Reflect never offers an enemy; the single-any copy never lands on the Leg or a Node and always
  lands on the Tail. `tests/unit/guide-status-immunity.test.ts` (7 tests): "a guide sentence that
  names a boss and a status that boss is immune to must say so"; the **old note verbatim is a
  fixture the checker flags** against the real Leg record.
  The sweep is scoped to the chapter 5 guide: run over all five guides it trips once, on Braska's
  Final Aeon's "Jecht Beam … (Petrify at 100%)", a **false positive** (Jecht *inflicts* Petrify;
  telling inflict from receive needs the ability tables). No guide was edited and no exemption
  list was added.

## 2. Rewards and steals — every difference, and what was done

Research §3.1 to §3.5 against the **imported** records (not the source text):

| Enemy | Difference | Done |
|---|---|---|
| Tail | `steal` missing. §3.1 line 205: X-Potion ×4 / rare ×6, 50%, verified | **Added** |
| Head | `steal` missing. §3.4 line 387: Megalixir ×1, 50%, verified | **Added** (both slots Megalixir ×1: the type requires both, same as the Body's Turbo Ether) |
| Leg | drop id `x2-mythril-bangle` resolves in no registry; `itemLabel` prints "X2 Mythril Bangle" | **Fixed** to the accessory key `mythril-bangle` (as Bahamut's `gris-gris-bag`) |
| Redoubt R/L | `steal` missing. §3.4 line 415: Phoenix Down / rare Mega Phoenix, 50%, **no quantity printed** | **Not added**: `ItemDrop.count` is required and the count is unsourced (hard rule 6). Question 1 below |
| Node A/B/C | rare **drop** Hero Drink ×1 missing (§3.2 line 262). The fact-checker called this a "rare steal"; the Node's steal (Megalixir ×1 / rare ×2) is present and correct | **Not added**: no rate for the rare slot is published, `drops` has no common/rare pair, and `src/battle/ffx2/results.ts:86` lists every entry without rolling. Research §11 item 18 |
| Every enemy | Pilfer Gil (3,000 / 3,000 / 10,000 / 4,000 / 300 / 8,000 / 350 / 10,000; lines 203, 232, 261, 308, 338, 385, 413, 435) has nowhere to go: `EnemyRewards` has no such field | **Not added**: a new field on `src/battle/common/types.ts` is a shared-contract change that nothing would read. Question 2 below |
| Bulwark R/L | rare steal `x2-l-bomb` resolves in no registry (no L-Bomb in `FFX2_ITEMS` under any spelling); drop modelled as two independent 50% entries where §3.3 line 339 has one 50% roll with a common/rare split | **Listed only**: the Bulwark record belongs to the session fixing its Str/Mag break immunity. The new test carries `x2-l-bomb` as the one named exception and fails the day it starts resolving |
| Leg, Body/Core, Shuyin | none (Shuyin's 12.5% CONFLICT note is already in the file) | — |

**Is any of it player-facing? No, proved by importing and running.** Chapter 5's only build
(`farplaneBuild`) has no learned Thief ability on anyone; the FFX-2 engine never reads
`rewards.steal`. The data agent also read `BattleEncounterChain.ts` / `BattleScreen.ts` as calling
`finish()` once with the **last** link's outcome, which would mean only Shuyin's rewards reach the
results ledger and the Mythril Bangle label was latent too; that part is **read from the code, not
yet proved by a run**. Today these rows feed the atlas learning site and any future
steal work, nothing in play.

Regression: `tests/unit/data-ffx2-vegnagun-chain.test.ts` now carries the §3 rewards table row by
row with line cites (exp, ap, gil, drops, steal for all eleven records), an "every item id
resolves in `FFX2_ITEMS` or the accessory registry" check, and a "no X2 word in a label" check.
Run against the unfixed data it failed five ways (Tail steal, Head steal, and the Leg id three
times over).

## Questions for Bailey (also in NOW.md)

1. **Redoubt steal quantity.** The research names the items and the 50% but prints no count
   (every other row prints one; the Bulwark's Phoenix Down is ×1). FF Wiki's Redoubt page
   returned HTTP 402 on 2026-09-21 and jegged catalogues no Vegnagun part (§13.1). Say "×1 is
   fine" or ask for a re-source; until then the Redoubts ship no steal table.
2. **Pilfer Gil and FFX-2 stealing.** The eight Pilfer Gil numbers are verified but need a new
   `pilferGil` field on the shared rewards type, and FFX-2 stealing itself is wired to nothing
   (see below). Worth doing only as part of building FFX-2 Steal, which is new gameplay and needs
   your yes (hard rule 10).

## Side findings, not fixed (out of scope)

- **FFX-2 Steal is built but wired to nothing** (hard rule 4 pattern): `x2-thief-steal` has
  `formula: 'none'` and its `stealAttempt` marker has no reader; `x2-thief-pilfer-gil` runs
  Spare Change's gil formula. Unreachable today (no build has a Thief ability).
- **The chain appears to discard every link's rewards but the last** (a chapter 5 clear would
  show Shuyin's 0 EXP, 20 AP, 0 gil, no items). Read from the code only: prove it with a run
  before acting on it (hard rule 3).
- `docs/concepts/atlas/a-boss-atlas/build-a.mjs` throws on an unknown reward id, so its `ITEM`
  map gained `mythril-bangle`; `learn/atlas/systems-catalog.ts` had a comment naming the old id.
  The main session ran `build-a.mjs` once by mistake (it has no `--help`), which rewrote the
  three A mockups; they were written back from `HEAD` and `git diff` on them is empty.

## Verified by (the main session, itself)

`tsc --noEmit` exit 0. Full `vitest run`: 190 of 193 files, 4,588 tests green; the three failing
files (`ui-portrait-face-crop`, `chapter-meta`, `party-face-manifest`) only check that
`public/art/` exists, and that gitignored folder is not in this worktree. Every changed data value
was read against its research line. No `src` module was added, so `tools/orphans.mjs` does not
apply. No UI layout changed (one sentence of guide copy), so no screenshot.

## Review owed

`node tools/critic-plan.mjs --paths …` classes this change **focused** (FFX-2 game data +
strategy guide; data audit; CHK-007, 016, 017, 020, 021), so rule 15's paper preflight does not
apply. A deploy that includes it still inherits the **deep review carried from `8f48237`**:
focused review of the candidate before the deploy, live verification and the deep review after.
