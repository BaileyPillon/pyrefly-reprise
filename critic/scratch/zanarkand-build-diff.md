# `src/data/ffx/builds/zanarkand.ts` against `research/ffx-yunalesca.md` §10.10

Written **before** any change to the build, per step 2 of the Chapter 2 repair task.
Re-derived from scratch this round (2026-09-17, repair round 3); it supersedes the
round-2 version of this file, which reached the same list of deviations but
concluded they could not be corrected.

## §10.10 — "Ward / Proof loadout (the intended preparation)"

`research/ffx-yunalesca.md:729-737`:

| Character role | Armor ability |
|---|---|
| Melee (Tidus, Auron, Wakka, Kimahri) | **Dark Ward / Darkproof** |
| Casters (Yuna, Lulu) | **Silence Ward / Silenceproof** |
| Everyone, before Form III | **Confuse Ward** (Ward is enough — it fully blocks Mind Blast, §7.2) |
| One designated survivor, **if not using Zombie** | **Deathproof** |
| **Nobody** | ~~Zombieproof~~ |

## What the build actually carries (armour only; weapons are not in scope)

| Member | Armour | Slots | Abilities |
|---|---|---:|---|
| Tidus | Glorious Shield | 3 | `hp-10`, `zombie-ward`, `death-ward` |
| Yuna | Blessed Ring | 4 | `magic-def-10`, `magic-def-5`, `zombie-ward`, `death-ward` |
| Auron | Blessed Bracer | 4 | `hp-10`, `zombie-ward`, `death-ward`, `stone-ward` |
| Wakka | Glorious Armguard | 3 | `hp-10`, `death-ward` |
| Lulu | Glorious Bangle | 3 | `hp-10`, `magic-def-10`, `death-ward` |
| Rikku | Glorious Targe | 3 | `hp-10`, `death-ward` |
| Kimahri | Glorious Armlet | 3 | `hp-10`, `death-ward` |

## Deviations

1. **Confuse Ward on nobody.** §10.10 lists it for "Everyone, before Form III",
   and §7.2's Ward/Proof arithmetic makes it a **total** block of Mind Blast's
   Confuse, because `(50 − 50) > rng` is never true. This is the deviation that
   decides the fight — see "Why it decides the fight" below.
2. **Dark Ward on no melee member** (Tidus, Auron, Wakka, Kimahri).
3. **Silence Ward on neither caster** (Yuna, Lulu).
4. `death-ward` everywhere and `stone-ward` on Auron are **not** part of
   §10.10. They come from `research/ffx-seymour-flux.md` §7.7.2 loadout B, which
   the build header cites. §10.10 asks for Death protection only for "one
   designated survivor, **if not using Zombie**" — and this build is the Zombie
   build, so Death Ward is redundant here: a Zombie's Death resistance already
   blocks Mega Death (§7.1).
5. Zombie Ward is **not** a deviation. §10.10's "Nobody" row names
   **Zombieproof** (resistance 255), a different auto-ability from Zombie Ward
   (resistance 50 — `src/battle/ffx/equipment.ts:160-188`), and the build does
   not carry Zombieproof anywhere. §7.7.2 B (`ffx-seymour-flux.md:951`) says
   Zombie Ward is *retained, not replaced*, because it came from the Gagazet
   loadout and abilities can never be removed once added (§7.7.1).
   Measured, keeping it is also the better build: removing Zombie Ward costs
   11 wins in 400 seeds.

## Why it decides the fight

Measured with the shipped `intendedStrategy` over 400 contiguous seeds
(`critic/scratch/bench-ch2.test.ts`), tactics held fixed at this round's tuned
version:

| Armour | Wins / 400 |
|---|---:|
| shipped build (no Confuse Ward) | 212 |
| + Confuse Ward on the three actives | 394 |
| + Confuse Ward and Dark/Silence Ward | 397 |
| + Confuse Ward, Dark Ward, **minus** Zombie Ward | 386 |

Confuse is the whole gap. `src/data/ffx/statuses/core.ts` declares that Confuse
is cured by "any physical hit" (ffx-combat-core §4.2), but nothing in
`src/battle/ffx/` implements that, and Confuse's duration model is `battle-254`.
So in this engine Mind Blast's Confuse is **permanent** until an Esuna or a
Remedy, where in the shipped game the next Hellbiter clears it. Each member's
roll is ~49.5%, there are five to eight Mind Blasts in a Form III, and a Mind
Blast that catches Yuna *and* an attacker is unrecoverable by construction: a
confused character is resolved by the engine and never reaches the tactic
(`execute.ts actsAutomatically`), so nobody can cure anybody and the party beats
itself to death. That is the "zero summons, 45,000-53,000 HP of Form III left"
loss class — 11 of the 60 losses in the first 200 seeds.

§10.10's Confuse Ward is the research's own named answer, and §7.2 makes it a
total block rather than a mitigation. With it the measured Confuse count per
battle is exactly **0.0**.

## The correction applied (step 4)

**Only §10.10's "Everyone, before Form III" row is applied**, i.e. Confuse Ward,
and only one slot per member moves. Dark Ward and Silence Ward (deviations 2 and
3) are left un-corrected: measured, they are worth +3 wins in 400 seeds on top of
Confuse Ward, and putting Dark Ward on Auron turns
`tests/unit/ffx-chapter2.test.ts`'s "blinds a naive auto-attacker into missing
most of its swings" red — that test is a real fidelity guard on the Form I
counter and is worth more than three seeds.

Every ability carried in from Mt. Gagazet — `hp-10`, `magic-def-10`,
`magic-def-5` and `zombie-ward` — is retained, so ability permanence (§7.7.1:
"they can never be removed") is not violated. For Wakka, Rikku and Kimahri the
change is **purely additive** into a slot §7.7.2 B left empty. For Tidus, Yuna,
Lulu and Auron the slot re-assigned is one that loadout B itself filled *at this
same build point*, so the diff is a different choice of what to customise into a
free slot at Zanarkand — which is precisely the preparation §10.10 prescribes for
this encounter. Slot counts, armour names and everything else in the file are
unchanged.

| Member | Gagazet (permanent) | Was, B filler | Now |
|---|---|---|---|
| Tidus | `hp-10`, `zombie-ward` | `death-ward` | **`confuse-ward`** |
| Yuna | `magic-def-10`, `magic-def-5`, `zombie-ward` | `death-ward` | **`confuse-ward`** |
| Auron | `hp-10`, `zombie-ward` | `death-ward`, `stone-ward` | `death-ward`, **`confuse-ward`** |
| Wakka | `hp-10` | `death-ward` | `death-ward`, **`confuse-ward`** (additive) |
| Lulu | `hp-10`, `magic-def-10` | `death-ward` | **`confuse-ward`** |
| Rikku | `hp-10` | `death-ward` | `death-ward`, **`confuse-ward`** (additive) |
| Kimahri | `hp-10` | `death-ward` | `death-ward`, **`confuse-ward`** (additive) |

## Result

Shipped `intendedStrategy`, shipped `zanarkandBuild`, contiguous seeds:

| | wins |
|---|---:|
| before this round (tactics and build both untouched) | 67 / 200 (33.5%) |
| tactics fixed, build untouched | 433 / 800 (54.1%) |
| tactics fixed **and** Confuse Ward | **1,574 / 1,600 (98.4%)** |

Measured Confuse applications per battle after the change: **0.0**.
