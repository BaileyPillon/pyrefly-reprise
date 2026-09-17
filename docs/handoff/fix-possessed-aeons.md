# fix-possessed-aeons

Owner key: `possessed-aeons`. Date: 2026-09-17.

Scope: the possessed-aeon records in
`src/data/ffx/enemies/braskas-final-aeon-abilities.ts` (and the
possessed-aeon half of `src/data/ffx/enemies/braskas-final-aeon.ts`, which
turned out to need no change), plus their tests. Three recorded defects,
from `research/ffx-combat-core.md` §6.3 and `research/ffx-bfa-yu-yevon.md`
§2.2. Two are fixed; the third is researched and deliberately left as a
documented open item rather than closed with an invented number.

## Files changed

- `src/data/ffx/enemies/braskas-final-aeon-abilities.ts` — two record fixes
  plus header documentation for the open item.
- `docs/CONTRACT-CHANGES.md` — new top entry, "OPEN ITEM: possessed-aeon
  accuracy bytes (no contract change)".
- `tests/unit/chapters/possessed-aeons.test.ts` — **new file, new
  directory.** `vitest.config.ts` already globs `tests/unit/**/*.test.ts`,
  so no config change was needed.

`src/data/ffx/enemies/braskas-final-aeon.ts` was read and left untouched: the
possessed-aeon `EnemyDef` builder's `acc: 0` is a deliberate placeholder for
the live stat mirror, documented in that file already, and none of the three
defects live there.

## 1. `possessed-mindy-passado` — 2 x 15, not 26 x 2

`research/ffx-combat-core.md` §6.3, Magus Sisters row: "Camisade (229) 21,
Razzia (231) 21, Passado (233) **2 x 15 hits**", formula column "Strength,
Physical" `[verified: 2 sources]`.

| field | before | after |
|---|---:|---:|
| `power` | 26 `[estimate]` | **2** (DmgCon 2 per hit) |
| `hits` | 2 | **15** |

The two numbers were transposed *and* the per-hit power inflated, so the
record modelled a different move. This is not cosmetic even though the
damage products are within spotting distance of each other: hit count drives
per-hit Defense subtraction, per-hit crit rolls and the 9,999 cap, so 26x2
and 2x15 resolve differently against the same target. Now identical to the
player-aeon Passado record (`src/data/ffx/aeons/abilities-optional-2.ts`,
`power: 2`, `hits: 15`), per §2.2's "fights with exactly the stats it has as
the player's own aeon" `[verified: 2 sources]`.

`rank: 3` was left alone. §6.3 gives rank 5 for the Magus Sisters' Specials,
but **every** possessed-aeon record in the file is normalised to rank 3
(Sonic Wings is rank 2 in §6.3 and also ships as 3). Changing that is a
file-wide convention question, not part of this fix — flagged below.

## 2. `possessed-yojimbo-daigoro` — Strength + `piercing` flag, DmgCon 10

§6.3, Yojimbo row: "Daigoro (222) DmgCon 10", formula column "Strength,
Physical" `[verified: 2 sources]`.

| field | before | after |
|---|---|---|
| `power` | 20 | **10** |
| `formula` | `'piercing-strength'` | **`'strength'`** |
| `flags` | `['piercing']` | unchanged — `['piercing']` |

The flag and the formula are two different rules in the research and the old
record conflated them:

- `research/ffx-combat-core.md` line 2055 (flag table): `piercing` = "Uses
  Defense 0 **against Armored targets**", aeon weapons except Valefor.
- line 270 (formula table): `Piercing Strength` (formula 2) = "ignores
  Defense (treats DEF as 0)" — unconditionally, against anything.

So the old record zeroed Defense against every target rather than only
Armored ones, on top of doubling the power. Now mirrors the player-aeon
Daigoro (`src/data/ffx/aeons/abilities-optional.ts`).

`crit-eligible` was deliberately **not** copied from the player record: no
possessed-aeon record in this file carries it, and §6.3 has no crit column
for these rows. Making that consistent across all ten is a separate pass.

## 3. Accuracy byte — researched, NOT invented; open item

The ten `category: 'aeon'` possessed Attack/Special records are typed
`physical` (or `magical`, for Pain) but carry no `accuracy` byte.
`src/battle/ffx/accuracy.ts` checks `user.side === 'enemy'` **before** the
damage-type branch, so all ten take the ALWAYS-hit path: Darkness, Aim/Reflex
stacks, Evasion and the Luck differential never apply to them.

The research corpus was searched (`accuracy` case-insensitively across
`research/ffx-bfa-yu-yevon.md` and `research/ffx-combat-core.md`; `possessed`
across all of `research/`). **No source publishes a byte for these rows:**

- `ffx-bfa-yu-yevon.md` gives exactly one accuracy byte in the whole
  chapter — Blade Blitz's 150, §1.3 line 105 — and none for §2.2's
  possessed-aeon movesets.
- `ffx-combat-core.md` §6.3 has no accuracy column at all. §2.11 line 476
  says enemy ability rows carry their own byte `[verified: 2 sources]`;
  §2.11 line 478 says aeon **Attack** variants use the `Accuracy x2.5` /
  `x1.5` hit formulas `[single source]`. A possessed aeon is an enemy made
  of an aeon, so the two rules point in opposite directions — which is
  itself part of why this cannot be closed from the existing corpus.
- `ffx-bfa-yu-yevon.md` §2.2 line 350 lists a possessed aeon's own Accuracy
  stat as "Varies", mirrored live off the player's aeon — meaningful only if
  something reads it, and today nothing does.

Shipped behaviour is therefore **unchanged** (always-hit), and the gap is
documented in the file header's "ACCURACY BYTE" section, in
`docs/CONTRACT-CHANGES.md`, and asserted by tests so it stays visible instead
of looking intentional.

To close it, someone needs **either** a decompiled per-row byte for ids
203–233, **or** an engine-side rule (engine agent's call) that lets the
mirrored Accuracy stat feed the hit-chance table — e.g. honouring
`extra.mirrorsCasterStats` ahead of the `user.side === 'enemy'` shortcut,
which would also make §6.3's x2.5 / x1.5 Attack multipliers mean something.
Copying `left-arm-strike`'s `accuracy: 100` across the ten is not a close:
that byte is itself an `[estimate]`, and duplicating it would launder one
guess into ten apparent data points.

## Tests

`tests/unit/chapters/possessed-aeons.test.ts`, 12 tests in 4 blocks:

1. Passado — power/hits literals, Strength/Physical, field-by-field
   agreement with the player-aeon record, and a `hits > power` guard against
   the transposition recurring.
2. Daigoro — power/formula literals, `piercing` present as a flag while the
   formula is not `piercing-strength`, field-by-field agreement with the
   player-aeon record.
3. All ten Attack/Specials against §6.3's formula/damage-type column
   (including the two documented oddities: Meteor Strike is Strength/Other,
   Pain is Special Magic/Magical), plus a file-wide guard that no
   `possessed-*` record uses `piercing-strength`.
4. The open item, asserted as behaviour and not just fields: no byte on any
   of the ten, `hitChance()` returns `null` for all ten, and — as a control
   that the first two are measuring the missing byte rather than some blanket
   enemy rule — Blade Blitz, which has `accuracy: 150`, still rolls.

Block 4 asserts a known gap. Its doc comment says so in as many words: if
those tests fail, close the open item and rewrite the block, do not revert
the data.

Verified the new tests actually bite — the pre-fix values were temporarily
restored and **8 of the 12 failed**, then the fix was put back and all 12
pass.

- `npx tsc --noEmit` — clean.
- `npx vitest run` (full suite) — see the orchestrator report.

## Flagged, not fixed (out of scope for this key)

1. **Rank normalisation.** Every possessed-aeon record is rank 3; §6.3 gives
   Sonic Wings 2, Meteor Strike / Aerospark / Heavenly Strike 4, Impulse 6,
   Pain 6, the Magus Sisters' Specials 5, and all the Overdrives 8. Ranks
   drive CTB, so this is a real pacing difference, but it is a whole-file
   convention decision.
2. **`possessed-sandy-razzia` targeting.** `'all-enemies'` here vs
   `'single-enemy'` on the player-aeon Razzia. Already flagged by the
   previous pass; §6.3's Target column is blank for the trio, so there is
   nothing to cite either way yet.
3. **`crit-eligible` on possessed records.** Player-aeon Attack/Specials
   carry it; no possessed copy does. Consistent within the file, and
   inconsistent with §2.2's mirroring rule. Needs one decision for all ten.
