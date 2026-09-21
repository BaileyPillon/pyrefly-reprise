# Paper preflight — new chapter: The Leblanc Syndicate, Chateau Leblanc (FFX-2)

> **What this is.** The paper preflight required by `critic/RUBRIC.md` §4 and AGENTS.md
> rule 15 before a change that `tools/critic-plan.mjs` classes as **deep** is built.
> Docs only: no code was written, no browser opened, no build run. Written 2026-09-21.
>
> **Verdict: PROCEED — conditionally.** The encounter is fully sourced, the engine gaps
> are small and additive, and the file plan parallelises cleanly. Two gates must close
> first and neither is a defect in this plan: (1) **hard rule 9** — every perceivable
> asset in §6 is a `gap` in `docs/target/targets.json` and needs an options round and
> Bailey's pick before anything visible is built; (2) **D-009** — the chapter's whole
> tempo argument is only true under **Active** ATB, which the engine does not implement
> yet. Detail in §10.

**Plan ran:**

```
node tools/critic-plan.mjs --paths "src/data/encounters.ts,src/data/ffx2/enemies/leblanc.ts,
  src/battle/ffx2/ai/leblanc.ts,src/battle/common/types.ts,src/scenes/chateau-leblanc.ts,
  src/audio/tracks/index.ts"
  review:      DEEP  (deep evidence is required BEFORE deploying)
  obligations: live + focused + deep
  because:     chapter registry or a new chapter is a shared system;
               FFX-2 ATB engine; shared combat core; audio routing
  checks:      CHK-001 008 011 013 016 017 019 020 021 022 023 B1
  targets:     audio, chapters, fight, scenes + audit every changed data value against research/
```

---

## 1. Game case and sources

**Game case: FFX-2 only** (AGENTS.md rule 14).

| Part of the change | Case | Why, from the sources |
|---|---|---|
| The encounter, its data, its AI, its guide, its tactic, its scene, its music | **FFX-2 only** | Every number comes from FFX-2 bestiary records #222 / #228 / #231. Nothing here exists in FFX. |
| Eject actually removing a character (§4 E1) | **FFX-2 only** | `eject` is an `FFX2StatusId`; `research/ffx2-leblanc-syndicate.md` §4.3 — Russian Roulette is the only shipped source of it. FFX has no Eject. |
| Pick-one-of-N status roll (§4 E2) | **FFX-2 only** as shipped, **both** as plumbing | The mechanic is generic; the only caller is Russian Roulette. `critic/CHECKS.md` CHK-020 would make it "both" if an FFX ability ever used it. It does not today, so the guard tests assert its **absence** from every FFX path (§9 A9). |
| Widening `ChapterId` / `Chapter.number`, the music-key list, the AI registry | **both** — shared plumbing (CHK-020) | These are registries every chapter of both games compiles against. |
| Active ATB (D-009), a prerequisite | **FFX-2 only** | `research/ffx-vs-ffx2-presentation.md` §4.2 row "Command input"; owner, 2026-09-21: "For ffx-2 I choose active." |

**Sources read for this preflight, in full or by section:**

- `research/ffx2-leblanc-syndicate.md` — read end to end (1,067 lines), including the
  2026-09-19 fact-check log §17 and the gap table §13.
- `research/ffx2-combat-core.md` — §1.2–1.4 (ATB/CTIM/RECTIM), §1.7 (Chain), §2.1 (the
  20-step chain), §2.6 / §2.6a (hit check and status infliction), §2.8 (status table),
  §3.6 (magic constants), §5.1 (dressphere × level), by way of the Leblanc document's
  §19 citation map and the engine constants that already transcribe them.
- `research/ffx2-bahamut.md` — §4.2's Lv 20–28 dressphere tables are the party stat
  source this chapter reuses (§3 below), plus §1.5 (Break stacks) and §1.6 (steal scale).
- `research/writing-bible.md` §0.1–0.3 (chapter table and scene tags), §1.14–1.16 (YRP
  voices), §2.2 (FFX-2 register), §5.1 (banner style), §5.4 (victory quips).
- `docs/ARCHITECTURE.md`, `docs/ENGINE-API.md`, `docs/CONTRACTS.md`.
- `docs/audio/THEMES.md` — the cue map, rows 13, 14, 17–21.
- Pattern chapter read end to end: **Chapter 4, FFX-2 Bahamut** —
  `src/data/ffx2/enemies/bahamut.ts`, `bahamut-abilities.ts`, `src/data/ffx2/builds/bevelle.ts`,
  `src/battle/ffx2/ai/bahamut.ts`, `src/data/guides/ffx2-bahamut.ts`,
  `src/story/scripts/ffx2-bahamut.ts`, `src/data/encounters.ts`, `src/data/chapter-meta.ts`,
  `tests/unit/strategy-ffx2-bahamut.test.ts`.
- Engine read for §4: `src/battle/ffx2/formulas.ts`, `resolve.ts`, `targeting.ts`,
  `chain.ts`, `statuses.ts`, `execute.ts`, `constants.ts`, `ai/index.ts`.

**Candidate selection is already settled** and is not reopened here: `ffx2-leblanc-syndicate.md`
§1.4 recommends the Chateau Last Room three-act mission over the Floating Ruins, Bailey
approved "the Leblanc Syndicate at Chateau Leblanc, FFX-2 Chapter 2, the three-act mission"
on 2026-09-19, and `docs/target/targets.json` records it in those words. The documented
alternative stays in §11 of the research if Bailey ever wants to switch.

---

## 2. The encounter as data

Every value below carries the research section it comes from and that section's own
confidence tag. **Nothing is filled in from memory** (hard rule 6); every value the
research does not give is in §2.6 as a gap, not as a number.

### 2.1 Structure — three chained formations

Three `EnemyGroupDef`s linked with `nextGroupId`, exactly the shape Chapter 5 already
ships (`vegnagun-tail` → `leg` → `body` → `head` → `shuyin`). `canEscape: false`
throughout, as all five existing encounters do.

| Act | Group id | Enemies | Total HP | Research |
|---|---|---|---|---|
| I | `ffx2-leblanc-entrance` | Ormi #220, Dr. Goon, Fem-Goon | 2,039 | §2, §4.6 |
| II | `ffx2-leblanc-logos-room` | Logos #227, Ormi #221 | 3,272 | §2 |
| III | `ffx2-leblanc-last-room` | Leblanc #231, Logos #228, Ormi #222 | 3,713 | §2, §3 |

**Do not mix records** (§12): Acts I and II use the #220/#221/#227 blocks, Act III the
#222/#228/#231 blocks, and the Creature Creator versions are a different entity entirely.
G8 is resolved in the research: Act III is Ormi **1,344** / Logos **989**, not
GamerGuides' 1,840 / 1,432.

### 2.2 Act III stat blocks

All three: **Gravity immune, every other element neutral ×1.0** [§3.1–3.3, verified: 2 sources
by the omission-comparison method]. `affinities: { gravity: 'immune' }`, matching
`bahamut.ts`'s convention of listing only the non-neutral row.

| Field | Leblanc #231 | Logos #228 | Ormi #222 | Confidence |
|---|---|---|---|---|
| Level | 23 | 21 | 19 | verified: 2 sources |
| HP / MP | 1,380 / 460 | 989 / 70 | 1,344 / 45 | verified: 2 sources |
| STR | 33 | 17 | 53 | single source |
| MAG | 32 | 28 | 26 | single source |
| DEF | 10 | 4 | 84 | single source |
| MDEF | 62 | 18 | 16 | single source |
| AGI | 53 | 49 | 42 | single source |
| EVA | 22 | 40 | **absent → 0** | single source (for the absence) |
| LUCK | 16 | 10 | 4 | single source |
| ACC | **blank in the record → ship `acc: 0`** | same | same | **gap — G1, see §4 E-G1** |
| EXP / AP / gil | 380 / 2 / 300 | 260 / 2 / 240 | 260 / 2 / 240 | verified: 2 sources |
| Stealable gil | 1,500 | 640 | 600 | single source |

**The stat-shape reading goes in a code comment, verbatim from §3.4** — three enemies,
three different correct answers: Ormi is a wall to physicals and paper to magic; nothing
defends Logos but you have to hit him; Leblanc wants swords, not spells, and re-buffs
herself. It is the whole encounter and the reason it is a legitimate teaching fight.

### 2.3 Immunities

Common to all three [§3.1–3.3, verified: 2 sources]: Death, Petrify, Sleep, Silence,
Confuse, Berserk, Curse, Eject, Stop, Doom, gravity/fractional, Multi-Attack, Bribe.
Modelled the way `bahamut.ts` does it — `immunities: { ko: 255, petrify: 255, … }` plus
`immunityFlags: ['boss']` — because `applyRiders()` reads `target.immunities[status] ?? 0`
and skips at `>= 255`. Fractional immunity is `immunityFlags: ['immune-to-percentage-damage']`,
which `computeDamage()` step 20 already honours.

Per-enemy differences, which are the interesting part:

| | `zantetsu` | `poison` | Extra immunities | NOT immune |
|---|---|---|---|---|
| Leblanc | 60 | 100 (→ functionally Poison-immune) | **STR Down, DEF Down, LUCK Down** | Darkness, Slow, Delay, MAG Down, MDEF Down |
| Logos | 50 | 40 (→ 60 % land) | — | Darkness, Poison, Slow, Delay, **all four Breaks** |
| Ormi | 50 | 30 (→ 70 % land) | — | Darkness, Poison, Slow, Delay, **all four Breaks** |

`landChance = 100 − resistNumber` for the linear "Status 1" path, subject to §2.6a's level
terms [§3.2, verified: 2 sources — the template value plus the wiki prose that reads it].
That is exactly what `statuses.ts::statusChanceLinear` already implements.

> **Power Break and Armor Break do nothing to Leblanc and work on the boys.** §3.1 calls
> this out as the only place in the fight where the same Warrior skill is correct on two
> targets and dead on the third. It belongs in the Sensor line and in the guide (§6, §7).

### 2.4 Abilities

`AbilityDef`s, one file per enemy. Band-to-base inversion is §4.1's, which the research
validated on five published bands.

**Ormi** [§4.2]

| Ability | Data shape | Source |
|---|---|---|
| Shield Bash (Attack) | `formula: 'strength'`, `damageType: 'physical'`, base 123.80 from `(19+53)×19×53/1024 + 53`, `crit-eligible`, `affected-by-darkness` | derived from published Lv/Str; formula verified: 2 sources |
| Supercollider | `formula: 'percent-current'`, `power: 8` (= 50 % of current HP), `damageType: 'other'`, `weak-delay`, target = furthest away | verified: 2 sources (targeting rule → §4 E4) |
| Huggles | `formula: 'multiple'`, `extra.flat = 300`, `hits: 3`, `targeting: 'single-enemy'`, `damageType: 'other'`, `weak-delay` per hit | verified: 2 sources; **only on the last-enemy-standing branch** |
| Concussive **Blast** | `formula: 'multiple'`, `extra.flat = 300`, `targeting: 'all-enemies'`, `damageType: 'other'` → 281–317 | verified: 2 sources; **G7 resolved: Blast, not Shock** |

**Logos** [§4.3]

| Ability | Data shape | Source |
|---|---|---|
| Double Shot (Attack) | `formula: 'strength'`, `hits: 2`, base 30.25 per hit from `(21+17)×21×17/1024 + 17`, `long-range` | derived; the 2-hit / Chain ×1 classification verified: 2 sources |
| Russian Roulette | Constant, single target, **moderate** damage + **exactly one** of Death / Eject / Petrify / Silence / Curse / Poison | verified: 2 sources for the effect; **magnitude is G2** |
| Hail of Bullets | Constant, party-wide, **moderate** damage | verified: 2 sources for existence; **magnitude is G2** |

**Leblanc** [§4.4]

| Ability | Data shape | Source |
|---|---|---|
| Fan Slap (Attack) | `strength`, base 74.51 from `(23+33)×23×33/1024 + 33` | derived |
| Fira / Blizzara / Thundara / Watera | `formula: 'magic'`, `power: 13` (the published Lv.2 tier), base `23×2+32 = 78` → ~206 before MDef | formula verified: 2 sources; C = 13 single source |
| Mach Fan | Constant, party-wide + weak Delay | verified for effect; **magnitude is G2** |
| Flash Bomb | `formula: 'multiple'`, `extra.flat = 50`, all-enemies, 50 % Darkness | verified: 2 sources. **G11 withdrawn: Leblanc's is Flash *Bomb*; Flash *Grenade* is Logos-at-Djose and is a different record. Do not merge them.** |
| Hush Grenade | as above, 50 % Silence | verified: 2 sources |
| Love Tap | `formula: 'none'`, `targeting: 'single-ally'`, Haste on Ormi or Logos | verified: 2 sources |
| Not-So-Mighty Guard | `formula: 'none'`, `targeting: 'all-allies'`, Protect + Shell + Regen | verified: 2 sources |
| White Wind | `heals` + `removes-statuses`, `targeting: 'all-allies'`, `percent-total` `power: 2` (= 1/8 max HP) | verified: 2 sources |
| Osmose | `magic` + `drains-mp`, `extra.mpOnly = true`; gated on her MP ≤ 14 | verified: 2 sources (dead branch at 460 MP) |
| No Love Lost | three stages, §2.5 | verified: 2 sources |

Two engine facts, verified by reading `formulas.ts::stepOne` and `computeDamage`, that make
the data expressible with no schema change:

- **"Cannot be reduced by any means" (Huggles) is `damageType: 'other'`.** Step 3 is skipped
  by `formula: 'multiple'`, step 16 (Protect/Shell) tests `physical`/`magical`, and step 17
  (Defend/Sentinel) tests `physical`. So `other` gives exactly the published behaviour.
- **Constant-type bases use `formula: 'multiple'` with `extra.flat`.** `fixed` computes
  `power × 50`, which can express 50, 200 and 300 but not 24 or 106. `multiple` + `flat`
  expresses every band, skips Defense and both damage-constant steps, and still takes
  step 7's `rand(240..271)/256` — which is precisely the randomiser §4.1 inverted the bands
  with. Use `multiple` uniformly for all five Constant-type Syndicate moves so one reading
  covers all of them.

### 2.5 No Love Lost, and the AI scripts

**Trigger** [§4.5, verified: 2 sources]: on Leblanc's `[8x − 5]`-th turn (3rd, 11th, 19th…)
**and only while both Ormi and Logos have HP**. Failsafe: after turn
`25 + noLoveLostUseCount`, force Not-So-Mighty Guard.

| Stage | Actor | Target | Damage |
|---|---|---|---|
| 1 | Logos | 8 hits on random characters (`targeting: 'random-enemy'`, `hits: 8`) | base 24 per hit, self-chaining |
| 2 | knock-down | all 3 | base 106 → 99–112 each |
| 3 | Ormi | 1 character | 3/8 of **remaining** HP (`percent-current`, `power: 6`) |

It does **not** one-shot any standard dressphere from full at Lv 22 (§4.5 worked example:
a 648-HP Songstress ends on 145). §4.5's design read is the one to build the presentation
around: *a spectacle, not an execution*, switched off the instant either henchman falls.

**Leblanc's AI script, verbatim** [§5.3, verified: 2 sources — decompile-derived]:

```
Turn 1  Not-So-Mighty Guard
Turn 2  Fan Slap on a random character
Turn 3  If (MP <= 14) -> Osmose; else Fira/Blizzara/Thundara/Watera, 1/4 each, random character
Turn 4A (1/2)  If (Ormi alive)  -> Love Tap on Ormi   else White Wind
Turn 4B (1/2)  If (Logos alive) -> Love Tap on Logos  else White Wind
Turn 5  Not-So-Mighty Guard
Turn 6  Mach Fan (3/5) | Flash Bomb (1/5) | Hush Grenade (1/5)
Repeat from Turn 2
Action-number override: after her [8x-5] turn, if BOTH Ormi and Logos have HP -> No Love Lost.
                       after her [25 + timesNoLoveLostUsed] turn -> Not-So-Mighty Guard.
```

**Ormi's AI script, verbatim** [§5.3, verified: 2 sources]:

```
Turn 1-3  Normal Attack on a random character
Turn 4    Supercollider on the character FURTHEST AWAY
If (HP < 1/4 max) -> Concussive Blast
If (Ormi is the ONLY enemy remaining): Normal Attack 1/2 | Supercollider 1/4 | Huggles 1/4
```

**Logos has no published AI script** [§5.3, §13 G3 — gap]. §13's recommended reconstruction,
which must be labelled **AUTHORED, not canon** in the file: a 3-turn loop of Double Shot,
Double Shot, then Russian Roulette or Hail of Bullets, because the two published Syndicate
scripts are both 3–6 turn loops with an action-count override and that is the house shape.

**The three AI facts that decide the fight** [§5.4] go in the tactic and the guide:
killing either henchman switches off No Love Lost; Ormi only reaches Huggles (≈1,185, more
than any Lv-22 standard dressphere's pool) when he is the **last** enemy alive; Leblanc
alone is a stalemate engine that White Winds your Darkness off. Correct order:
**Logos → Ormi → Leblanc**, with a heal banked for Concussive Blast at Ormi's 25 %.

### 2.6 Values the research does not give — gaps, never guessed

| # | Gap | Where it bites | What ships instead |
|---|---|---|---|
| **G1** | The enemy hit model. `accuracy` is blank on all six Syndicate records while published elsewhere at 3–98; §2.6's decoded points race turns any near-zero enemy Accuracy into 0 %. | Every Syndicate physical | **Nothing new.** See §4 E-G1: our engine already never reads enemy Accuracy stats. `acc: 0` + the existing `ENEMY_BASE_ACCURACY`. |
| **G2** | No damage numbers for **Mach Fan, Hail of Bullets, Russian Roulette** (all "moderate"; two are party-wide). | Three of the fight's abilities | **Blocks nothing, but the number must be authored and labelled.** See §5 Q2 — this is the one place the build needs a decision rather than a source. |
| **G3** | Logos has no published AI script. | His turn structure | §13's 3-turn reconstruction, labelled AUTHORED in the file and in the commit. |
| **G4** | Delay's magnitude for enemy abilities. | Supercollider, each Huggles hit | The existing `weak-delay` / `strong-delay` `ActionFlag`s, whose magnitudes are already project constants. Named, not invented here. |
| **G5** | Enemy MP costs, so Leblanc's `MP ≤ 14 → Osmose` branch is unreachable deterministically. | Near-dead code at 460 MP | Implement the branch; it will not fire. No number needed. |
| **G6** | CTIM / RECTIM per enemy ability. | Telegraph windows | §5.2's tier assignment (`0` / `16` / `26` / `39`), tagged `[estimate]` — the tier system is sourced, the per-ability assignment is not. |
| **G10** | Whether Huggles is accuracy-checked. | Whether Darkness blunts the deadliest move | `HUGGLES_IS_ACCURACY_CHECKED = true`, **AUTHORED**, with the comment §4.2 prescribes word for word. |
| **G12** | `multi attack = Immune` is unexplained by any source. | — | **Implement no behaviour for it.** §13's instruction. |
| **G13** | No published "recommended level" for the mission. | Party build | The Lv 18–24 band inferred in §7.1, tagged `[estimate]`. |
| **G14** | The Act III room's exact layout. | The backdrop | §10.2's composition is a *proposal*; it becomes an options round (§6), not a fact. |

---

## 3. The party build the chapter ships with

Sourced the way `src/data/ffx2/builds/bevelle.ts` justifies its own: every line cites the
research section that fixes it.

| Field | Value | Source |
|---|---|---|
| Levels | **Yuna 20, Rikku 21, Paine 22** | §7.1 band Lv 18–24, centre ~21; spread **Paine ≥ Rikku ≥ Yuna** [verified: 2 sources] |
| Yuna | Gunner (canonical) | §7.2 default; §5.2 — her Gunner is **exactly matched to Leblanc at 4.32 s**, which is the mirror-match fact |
| Rikku | Thief | §7.2 default; §5.2 fastest on the field at 3.82 s; §6.3 — three Elixir-tier steals and 2,740 stealable gil make this the chapter that justifies the Thief |
| Paine | Warrior | §7.2 default; §7.3 — Armor Break on Ormi is the single best Break use in the fight |
| `owned` | gunner, thief, warrior, songstress, black-mage, white-mage, gun-mage, alchemist, floral-fallal, machina-maw | §7.2 — **Yes** for the first six, **Likely** for the last four |
| **NOT owned** | **dark-knight**, samurai, lady-luck, berserker, trainer, mascot | §7.2 [verified: 2 sources] — Dark Knight is the Bevelle Underground, *later* in Chapter 2 |
| Garment grids | Rikku **Bum Rush**, Paine **Stonehewn**, Yuna **Hour of Need** | §7.4 — all three won from the Syndicate in the three missions immediately before this one |
| Accessories | Silver Glasses / White Cape / Beaded Brooch / Favorite Outfit / Iron Bangle / Muscle Belt pool | §7.5 |
| Inventory | Potions, Phoenix Down, **Soft, Echo Screen, Eye Drops, Holy Water, Antidote**, Remedy, Grenades, curtains | §7.6, all `[estimate]` — no source records a canonical inventory |
| Gil | 4,000–15,000 → ship 8,000 | §7.6 `[estimate]` |
| Abilities learned | Songstress **Darkness Dance** (initial) + **Perfect Pitch** (10 AP); Warrior all four Breaks; Gunner Trigger Happy + Cheap Shot; Thief Steal / Pilfer Gil; White Mage Cure / Esuna / Dispel | §7.3 — "one or two skillsets partially invested, not mastered" `[estimate]` |

**Two corrections against the Bahamut chapter that the builder must not copy** [§7.2]:
**Dark Knight is not owned here** and **Healing Light is not owned here** (it is this
mission's reward). `bevelleBuild` gives Rikku Dark Knight and that is correct *there*.

**Deliberately not solved for the player.** The build gives the party every tool §8's
teaching table needs — Darkness Dance, Perfect Pitch, the Breaks, Dispel, Steal, Grenades
— and pre-selects none of them, exactly as `bevelleBuild`'s doc comment describes its own
restraint. There is **no all-status guard available at this point** (§7.5: the Ribbon is one
dungeon away) and the plan does not hand the player one early; Russian Roulette's six-way
roll being genuinely unblockable is the point of the chapter.

**Side finding, not fixed here (another agent's file).** `src/data/ffx2/builds/bevelle.ts`
lines 69 and 96 have the two Strip Search grids' provenance swapped in their comments:
`hour-of-need` is commented "beat Ormi at Bikanel Oasis" and `stonehewn` "beat Logos on
Gagazet", while `ffx2-leblanc-syndicate.md` §7.4 has **Hour of Need = Bikanel = beat Logos**
and **Stonehewn = Gagazet = beat Ormi**. Comments only, no behaviour; recorded for whoever
owns that file.

---

## 4. Engine capabilities the fight needs, found by reading the engine

Every row names the file and function, the smallest additive change, and its contract
impact. Ten of the twelve things this fight does need **no engine change at all**.

### E-G1 — the open item: what the engine needs for enemy Accuracy

**G1 does not block this chapter, and the answer is already in the codebase.**

`src/battle/common/types.ts`, `AbilityDef.accuracy`: *"Action-owned accuracy byte, used by
the `USE_ACTION_ACCURACY` branch. **Every enemy action uses this**; enemy Accuracy stats are
never read."* `src/battle/ffx2/formulas.ts::hitPercent()` implements exactly that, and when
an enemy action carries no byte it falls back to
`src/battle/ffx2/constants.ts::ENEMY_BASE_ACCURACY = 104`, a documented `[estimate]` that
exists precisely because "§2.6's decoded equation makes an Accuracy-0 enemy never connect,
which contradicts every description of the fight."

So, exactly what the engine needs:

1. **Ship `acc: 0` on all three stat blocks**, tagged `[gap — G1]`. The blank `accuracy`
   field in the six Syndicate records maps onto the project's existing "absent means 0"
   convention, which is the same case `bahamut.ts` already ships.
2. **Do not give the Syndicate's physicals a per-ability `accuracy` byte.** Leaving it
   undefined is what routes them to `ENEMY_BASE_ACCURACY`. (Bahamut's Attack carries an
   explicit `accuracy: 0` and therefore *never hits*; that is a separate pre-existing
   question for Chapter 4 and is out of scope here — recorded in §5 Q6.)
3. **Do not introduce `SYNDICATE_ACCURACY_TUNING = 110`** from §5.1. It would be a second,
   conflicting, equally unsourced tuning constant for the same quantity. One project-wide
   constant, one place to fix when G1 closes.
4. **Every Syndicate action Darkness Dance is supposed to blunt must carry the
   `affected-by-darkness` flag** (or `damageType: 'physical'`). `hitPercent()` applies
   `DARKNESS_ACCURACY_DIVISOR` only on that branch. The ÷4 term is the **one thing the
   sources fix independently of any Accuracy value** [§5.1, verified: 2 sources], so it is
   the flag that carries the chapter's sourced teaching moment.

**And the substitution is measurably harmless.** Running 104 instead of §5.1's 110 through
§2.6, against the Lv 22 party's own defence scores:

| Target (Lv 22) | defScore | Ormi (Luck 4) | Logos (Luck 10) | Leblanc (Luck 16) | …under Darkness (acc 26) |
|---|---|---|---|---|---|
| Gunner | 19 | 89 % | 95 % | 100 % | 11 % / 17 % / 23 % |
| Warrior | 17 | 91 % | 97 % | 100 % | 13 % / 19 % / 25 % |
| Thief | 45 | 63 % | 69 % | 75 % | **0 % / 0 % / 0 %** |

Same shape as §5.1's preview table, one to six points lower. Nothing in the encounter's
design depends on the difference. **This is an engine-behaviour preview, not evidence** —
§5.1's warning about circularity applies to this table too.

### E1 — Eject removes a character *(required; the fight has no other removal)*

`src/battle/ffx2/resolve.ts::applyRiders()` (lines 127–146) applies each status and has one
special case: `if (application.status === 'ko') applyHpDelta(...)`. **There is no `eject`
case.** `eject` is a live `FFX2StatusId`, is in `statuses.ts::INFINITE_STATUSES`, and has a
HUD chip (`src/ui/ffx2/statusChips.ts: eject: 'EJT'`) — so today Russian Roulette would
paint an EJT chip on a girl who keeps playing. `resolve.ts:369`'s own comment ("X-2 has no
eject") is true of *Charon*, not of the status.

**Smallest additive change:** one line beside the `ko` line setting `target.removed = true`,
and a matching reset in `statuses.ts::clearAfterBattle()`. `targeting.ts::isTargetable()`,
`engine.ts:330`'s `party()`, `gauges.ts:61` and `results.ts:59` **all already test
`!u.removed`**, so removal, untargetability, a frozen gauge and "all three gone = defeat"
fall out with no further work. `resolve.ts:95` (revive) already clears the flag.
**Contract impact: none** — no type, no flag, no `extra` key.

### E2 — "exactly one of six" status roll *(required; Russian Roulette)*

`applyRiders()` loops `ability.statusEffects` and rolls each **independently**, so six
applications would mean up to six statuses at once. Canon is one.

**Smallest additive change:** read a documented `extra` key —
`extra: { statusRollOneOf: true }` — and, when set, `ctx.rng.pick()` exactly one application
before the loop. ~4 lines. **Contract impact: none on types.** `docs/CONTRACTS.md` explicitly
sanctions this: *"Genuinely one-off scripted rules … go in `AbilityDef.extra`, with the keys
documented in the data file that sets them."* Draw it at the **end** of the step so existing
replays at the same seed are unchanged (CONTRACTS.md, engine agents, rule 1).

### E3 — Petrify → shatter *(NOT required; recommend out of scope)*

`'shattering'` is in the `FFX2StatusId` union with a doc comment, and `grep` finds **no
reader anywhere under `src/battle/ffx2/`**. Canon [§4.3]: a petrified girl shatters
permanently if a physical connects, and three petrified is a Game Over.

**Recommendation: do not build it for this chapter.** No sourced Syndicate ability needs it
(Petrify arrives via the E2 roll and the researched cure — Soft — is in the build), it is a
permanent party-side loss, and it is the harshest possible thing to put in the chapter that
is also the onboarding chapter. Recorded as an open question (§5 Q4), not silently skipped.
**Contract impact: none.**

### E4 — "the character furthest away" *(required; Supercollider)*

`src/battle/ffx2/targeting.ts::resolveTargets()` has no positional mode, and `Ffx2Unit`
carries only `slot` (a formation index, not a distance). The free-movement battlefield that
makes §4.2's rule meaningful does not exist in our presentation either.

**Smallest additive change: none in the engine.** Adding a `Targeting` union member for one
ability is a `types.ts` contract change for a rule we cannot honour faithfully anyway.
Instead, **Ormi's AI script picks the target** — `ai/leblanc-syndicate.ts` selects the
highest `slot` (our stand-in for the back of the formation) — labelled **AUTHORED** in the
file with §4.2's positional rule quoted beside it. **Contract impact: none.** Open question
§5 Q3; ships behind a documented assumption.

### E5 — No Love Lost as one action with three stages *(required)*

`resolveAbility()` resolves exactly one ability with one formula; `AiScript.decide()` returns
one `Command`; `execute.ts::performCommand()` runs one action. Three stages with three
different formulas (8-hit constant → party-wide constant → fractional) cannot be one
`AbilityDef`, and spreading them over three enemy turns would destroy the set piece —
§4.5's whole design read is *one loud, timed, three-beat spectacle*.

**Smallest additive change:** three `AbilityDef`s (`x2-nll-1`, `x2-nll-2`, `x2-nll-3`) and a
documented `extra: { sequence: ['x2-nll-2', 'x2-nll-3'] }` read once at the end of
`resolveAbility()`, resolving each named ability in order from the same user. ~12 lines, one
recursion guard (a `sequence` on a sequenced ability is ignored), no type change.
`chain.ts::registerHit()` is target-keyed, so each stage's chaining is already correct.
**Contract impact: none on types**; document the key in the data file per CONTRACTS.md. It is
reusable — the Macalania and Evrae chapters both have multi-beat boss moves.

### E6 — Active ATB *(prerequisite, not part of this chapter)*

`engine.nextDecision()` returns `'waiting'` and the presenter awaits `HudPort.chooseCommand`
inside that branch, so **the clock stops while a command menu is open**. The onboarding
session measured it: 8,189 → 8,189 ticks across 1.5 s in both X-2 chapters, identical with
`?coach=off`. `SaveData.ffx2Atb: 'active' | 'wait'` and `FFX2BattleHud.atbMode` already
exist and currently describe behaviour the engine does not have.

§5.2's mirror-match argument — Leblanc and Yuna's Gunner both acting at 4.32 s, Ormi slowest,
Rikku fastest, *"the two teams are the same shape"* — **is only true under Active.** Under
Wait the enemy tempo is whatever the player's menu speed makes it.

**This chapter should not ship before D-009's build (A.3) lands**, and that build has its
own paper preflight, `docs/plans/ffx2-active-atb-review.md`, which **does not exist yet**.
**Contract impact:** none from this chapter; substantial from A.3, which is why it is a
separate deep-reviewed track.

### E7 — Registry widening *(required; the only real contract change)*

`src/data/encounters.ts` is a **contract file**. Two edits:

- `ChapterId` gains `'ffx2-leblanc'` (additive union member).
- `Chapter.number: 1 | 2 | 3 | 4 | 5` must widen to include `6`.

Both are additive and need one entry in `docs/CONTRACT-CHANGES.md`, newest first.
`SaveData.chapters` is `Record<string, ChapterRecord>`, so saves need nothing.
`src/data/ffx2/ids.ts` (also a contract file) gains the new enemy and ability ids.

### E8 — Music keys *(required)*

`src/audio/tracks/index.ts::MUSIC_KEYS` is the final key list (CONTRACT-CHANGES §8). Adds
`scene-chateau-leblanc`, `boss-leblanc`, and `scene-disquiet` if the Vegnagun-reveal cue is
taken (§6). Each needs a composed `Track`, a prerender and a `public/audio/manifest.json`
entry. This is the path `critic-plan` calls "audio routing" and is one reason the change is
deep.

### E9–E12 — verified as already supported, no change

| | What | Evidence |
|---|---|---|
| E9 | Enemy-side buffs and heals (Not-So-Mighty Guard, White Wind, Love Tap) | `targeting.ts::alliesOf()` is side-relative, so `'all-allies'` from an enemy actor is the enemy team. `DISPEL_REMOVES` already lists protect/shell/regen/haste, so the player's Dispel answer works. |
| E10 | The enemy chaining the party (Huggles ×3, Double Shot ×2, No Love Lost ×8) | `chain.ts::registerHit()` is keyed on the **target**, not the side. §4.1's exact reconstruction (300 × 3.95 → 1,110–1,254) is directly assertable — §9 A4. |
| E11 | Unreducible damage | `damageType: 'other'` + `formula: 'multiple'`, verified against `stepOne()` and steps 3/16/17 of `computeDamage()`. |
| E12 | Three-enemy formations, act chaining, per-hit random retarget | `EnemyGroupDef.enemies[]` + `nextGroupId` (Chapter 5 ships a four-link chain); `'random-enemy'` re-rolls per hit by documented design. |

---

## 5. Open canon questions

Each one: the evidence, a recommended answer, and whether it truly blocks the build.

**Q1 — Chapter number and select order. BLOCKS the integrator only.**
`Chapter.number` is a display-order field and FFX occupies 1–3, FFX-2 4–5. Three new
chapters are approved, one FFX-2 and two FFX. *Recommendation:* append this one as
**`number: 6`, id `ffx2-leblanc`**, and record the canonical position (FFX-2 Chapter 2,
mission "Faking and Entering") in the record's doc comment the way `FFX2_BAHAMUT` records
its own Ch. 2 knowledge state. Ask Bailey once whether chapter select should group by game
rather than by number when all three land. One line, answerable now, and the build can
start on 6 either way.

**Q2 — The three unpublished damage numbers (G2). Does NOT block; needs a labelled author.**
Mach Fan, Hail of Bullets and Russian Roulette are published only as "moderate", and two are
party-wide. *Recommendation:* author them **by interpolation inside the published Syndicate
band, not by feel** — the fight's own published constants are 24 / 50 / 106 / 200 / 300, so
take **Mach Fan = 106**, **Hail of Bullets = 106**, **Russian Roulette = 200**, each written
as a named constant with the comment `AUTHORED — no source publishes a number; G2`. They are
not presented as canon, they sit inside the fight's own sourced range, and §4.1's inversion
method closes them the moment any band is published. Ship behind that documented assumption.

**Q3 — Supercollider's positional target (E4). Does NOT block.** The rule is canon and
positional; we have no positions. *Recommendation:* highest `slot`, labelled AUTHORED. If
Bailey wants the free-movement battlefield the rule implies, that is its own track with its
own options round.

**Q4 — Petrify shattering (E3). Does NOT block; recommend NO.** *Recommendation:* do not
implement shattering in this chapter. It is canon, it is currently unimplemented project-wide,
and adding a permanent party-member loss to the chapter that doubles as onboarding is a
gameplay decision, which AGENTS.md rule 10 says needs Bailey's yes.

**Q5 — Onboarding framing. Does NOT block the data; BLOCKS the presentation.**
§1.3 records that this candidate fails the "low level" half of the owner's tutorial goal and
that the repair is **presentation** — tutorial framing, trigger tips, a gentler preset —
because onboarding is a UI-and-pacing property, not an enemy-data property. Bailey has
already picked onboarding option C, "Auron's briefing", which is FFX-framed and currently
switched off (`ONBOARDING_LIVE = false`). *Recommendation:* ship this chapter's data at full
canonical strength and treat its onboarding surface as an explicit question for Bailey after
A.3 switches onboarding on — do **not** tune a boss's numbers to make it gentler
(`memory: boss-side-fix-needs-measured-options`).

**Q6 — Chapter 4's `accuracy: 0` byte. Does NOT block; recorded, not fixed.**
While reading `hitPercent()` for E-G1: `x2-bahamut-attack` carries an explicit
`accuracy: 0`, which short-circuits the `ENEMY_BASE_ACCURACY` fallback and makes his three
physical turns never connect. That may be intentional or may be a defect in an existing
chapter; it is outside this brief's files and is not touched here.

**Q7 — Does the party pose on victory? ANSWERED, no question.** §0 A7: yes, normally —
this is the tonal inverse of Chapter 4, which suppresses the whole flourish. So
`music.victory: 'victory-ffx2'`, a full `victoryQuips` bank, and `results(false)`.
§10.3: *"let them celebrate, loudly."*

---

## 6. Assets — exists / reuse / new, and the options Bailey must pick from

**Everything marked NEW is perceivable, and `docs/target/targets.json` has this chapter as a
`gap` with the note "Concept sheets on the way". Hard rule 9: none of it is built until
Bailey picks.** Verified against `public/art/{characters,portraits,backdrops,pause}` and
`src/audio/tracks/index.ts`.

| Asset | Status | Note |
|---|---|---|
| Yuna Gunner, Rikku Thief, Paine Warrior paintings | **exists** | `yuna-gunner`, `rikku-thief`, `paine-warrior` |
| Yuna Songstress, Black Mage, White Mage; Rikku Alchemist, Black Mage, White Mage; Paine Black/White Mage | **exists** | for spherechange during the fight |
| Paine Thief, Paine Songstress, Rikku Songstress, Gun Mage sets | **gap** | only if the build lets those be worn; not required by §3's loadout |
| `yuna-x2`, `rikku-x2`, `paine` portraits | **exists** | reuse unchanged |
| `victory-ffx2` cue, FFX-2 HUD, Ink & Gold chrome | **reuse** | no change |
| **Leblanc, Logos, Ormi battle paintings + poses** | **NEW** | §10.1 describes all three in words only, for painters. Poses named there: Leblanc's fan as a screen / shockwave emitter / snapped shut on Love Tap; Logos' side-on duellist stance and the cylinder spin; Ormi's shield swing, body-check and the Huggles squeeze. |
| **Leblanc, Logos, Ormi speaker portraits** | **NEW** | The `SpeakerId` union **already contains `'leblanc' | 'logos' | 'ormi'`** — no contract change, just three portrait sets. |
| **Chateau basement backdrop** (`sceneKey: 'chateau-leblanc'`) | **NEW** | §10.2: a working sphere-hunters' den — machina terminals, crated loot, cable runs, the treasure room's shelves of stolen spheres. Palette: Guado sap-brown base, hot magenta overlay, cold cyan and sodium amber. **The upstairs is warm; the fight is cold.** |
| **Chapter card / thumbnail** (`chapter-ffx2-leblanc`) | **NEW** | silhouette card, per the approved "front end that moves" tile |
| **Pause plate + hero art** (`ch6-ffx2-leblanc`) | **NEW** | `ChapterMeta.heroArt` + `heroArtFallback` to an existing portrait until it renders |
| **VFX** | **NEW** | Not-So-Mighty Guard (three overlapping shields), Russian Roulette (§10.1's rings inscribed in Spiran script — a ready-made pane-break motif), No Love Lost's three beats, Huggles, Mach Fan's shockwave |
| **`boss-leblanc` music cue** | **NEW** | §10.3: *"the music is on the trio's side and the trio is ridiculous."* Brassy, fast, upbeat; nothing minor-key. A boss theme that refuses to be threatening. |
| **`scene-chateau-leblanc` cue** | **NEW** | light-footed caper music: muted rhythm, tiptoe pizzicato, stop-start phrasing, a joke in the percussion |
| **`scene-disquiet` cue** (the Vegnagun reveal, beat 14) | **NEW, optional** | §10.3: low, unresolved, no melody to hold on to — the sound of a room that has just become a different kind of room. **This is the cue the 2026-09-19 fact-check recovered**; skipping it costs the chapter its most important beat. |
| **SFX** | **NEW** | fan snap, revolver cylinder spin, shield impact, the Huggles squeeze |
| **YRP in Syndicate pink** (the whole-chapter costume beat, §10.1) | **NEW, recommend deferring** | canonical and free narratively, but three more party paintings. Offer it as an option; recommend v2. |

### Options rounds required before any of it is built (hard rule 9, ladder per Bailey's PTR rule)

| # | What | Fidelity | Options |
|---|---|---|---|
| **O1** | The arena — the treasure room | purpose-built 1600×900 mockups | 3: (a) §10.2's composition, the party's backs to the loot and the trio blocking the only door; (b) wide machina hall, the Sphere Oscillo-finder as the centrepiece; (c) tight, crates and cable, the Guado roots still visible through the pink |
| **O2** | The trio | concept frames | 3 group compositions: the theatrical fan-forward stage address; the working-crew line-up; the comic triangle (Leblanc front, boys flanking and slightly behind) |
| **O3** | **No Love Lost** | faked screenshot + a few lines of play | 2–3: how the three beats read on screen, where the camera sits, whether the enemy chain counter appears before the player's ever has (§8's teaching hook) |
| **O4** | Battle music | audio sketches — **Bailey judges by ear** via `docs/audio/audition.html` (rule 13) | 2–3 takes on "a fanfare for someone who has awarded herself a fanfare" |
| **O5** | Chapter card | silhouette card mockups | 2 |

Start cheap and broad; after Bailey picks, drop the rejected branches and record
**liked / disliked / must remain / must change / undecided** in each tile's `reaction`,
with anything an agent inferred kept separately under `inferred` (rule 15).

---

## 7. Story beats — pre, mid, post (beats only, no dialogue)

Scene tag: **E8**, appended, never inserted — `writing-bible` §0.1's rule, because §4's
Banter Bank and §5.4's quip suitability key off E1–E7. §0.2's FFX-2 banter bank (tags E5,
E6, E7) extends to E8. Beats are §9.2's, compressed to what the chapter stages.

**Pre-battle (before Act I).** The Syndicate has robbed the Gullwings' airship. → The girls
walk in the front door in stolen uniforms and nobody looks twice. → Logos and Ormi assign
the new "goons" their duties, and Yuna is sent to massage the boss. → **The massage** —
Yuna's single most undignified scene in either game, played entirely for comedy. → They are
sent to check the switch that opens the underground. → **Brother calls Rikku on the comm at
full volume.** She tells him to be quiet. He gets louder. The cover is blown.

**Between Acts I and II.** Ormi recognises them, panics, loses, runs to find Logos. → In
Logos' room: a dud sphere, and beside it **Crimson Sphere 10**. *The comedy briefly stops
being funny.* **[reveal]**

**Between Acts II and III.** Logos and Ormi lose and flee to warn Leblanc. → In the treasure
room the girls find their stolen half-sphere — and Leblanc's matching half beside it. She
had the other piece all along. **[reveal]**

**Mid-battle triggers (Act III).** Three, all `once: true`, each `say` carrying an `auto`
(the registry rule): (1) the first **Not-So-Mighty Guard** — the first fight in the game
where ignoring a buff visibly doubles its length; (2) the first **No Love Lost** — the trio
combo announces itself; (3) **either henchman falling** — Leblanc notices the combo is gone,
which is the fight teaching its own target priority out loud.

**Post-battle.** Beaten, Leblanc gives up the reassembled sphere rather than lose her dignity
a fourth time. → **They watch it together: Vegnagun.** → The truce: two rival crews agree to
go into the Bevelle Underground together; Leblanc's reason surfaces obliquely, and it is
Nooj. → Victory pose and fanfare restored (§0 A7, §10.3).

**Register** [§9.3, `writing-bible` §2.2]: three-beat banter (Rikku sets up → Yuna reacts →
Paine kills it), overlap with em dashes, **exactly one** sincere exchange. This is the
chapter where Rikku's comedy engine runs the scene and Paine's one-word vetoes land hardest,
because for once nothing is at stake but pride.

**Three things this chapter must not do** [§9.4]: no transcripts, all dialogue original
(§9.3's sample lines are marked `[ORIGINAL]` and are safe); **do not moralise the trio** —
they are beaten and then pragmatically allied with, not redeemed; **do not make Leblanc
pathetic** — she loses four times and is never humiliated by the narrative, only by
circumstance, and that distinction is the character. Add a fourth from §9.2: *beat 14 lands
without a joke.*

**Voice notes** for all three are §9.3's tables — register, rhythm, function, the seam, what
each one never does. Use them unchanged; YRP use `writing-bible` §1.14–1.16 unchanged.

---

## 8. File plan, owners and order of work

Nine tracks. **Tracks B–F touch no file any other track touches** and can run in parallel
once track A's stubs land. Every shared registry is listed under track I and edited by
**one integrator only**.

**Track A — contracts and stubs (integrator, first, blocking).** `src/data/ffx2/ids.ts`
(new enemy / ability / group ids), the `ChapterId` and `Chapter.number` widening in
`src/data/encounters.ts`, `docs/CONTRACT-CHANGES.md`. Everything else compiles against these.

**Track B — engine (opus; E1, E2, E5).** `src/battle/ffx2/resolve.ts` only. Three small
additive changes plus their tests. **Touches no data file.** Must land before track C's
tests can pass.

**Track C — enemy data (sonnet).** `src/data/ffx2/enemies/leblanc-syndicate.ts`,
`leblanc-syndicate-abilities.ts`, `leblanc-syndicate-goons.ts` — three new files, three
groups, every value citing its research section and carrying its confidence tag.

**Track D — AI scripts (sonnet).** `src/battle/ffx2/ai/leblanc-syndicate.ts` — three scripts
(Leblanc verbatim, Ormi verbatim, Logos AUTHORED), one new file.

**Track E — party build (sonnet).** `src/data/ffx2/builds/chateau.ts` — one new file.

**Track F — story (opus).** `src/story/scripts/ffx2-leblanc.ts` — one new file; `pre` ends
with `battleStart()`, `post` contains `results()`, `lintScript()` run in its own test.

**Track G — guide and tactic (sonnet).** `src/data/guides/ffx2-leblanc.ts` and
`src/engine/tactics/ffx2-leblanc.ts` — two new files, the Logos → Ormi → Leblanc line with
its §5.4 citations.

**Track H — scene and art (art owner; after O1–O5 are picked).**
`src/scenes/chateau-leblanc.ts`, `chateau-leblanc-debug.ts`, the paintings, portraits,
backdrop, plates; `src/audio/tracks/boss-leblanc.ts`, `scene-chateau-leblanc.ts`,
`scene-disquiet.ts`. **Does not start before Bailey picks (rule 9).**

**Track I — integration (ONE integrator, last).** These files are edited by nobody else:

| File | Why it needs a single owner |
|---|---|
| `src/data/encounters.ts` | contract file; the `Chapter` record, the `CHAPTERS` and `CHAPTER_IDS` arrays, `music`, `sensorTexts` |
| `src/data/ffx2/ids.ts` | contract file |
| `src/data/ffx2/enemies/index.ts` | `ENEMY_GROUPS`, `ALL_BOSS_ABILITIES` |
| `src/data/chapter-meta.ts` | the pause/prebattle record and its objectives |
| `src/data/guides/index.ts` | `GUIDES` |
| `src/engine/tactics/index.ts` | `TACTICS` |
| `src/battle/ffx2/ai/index.ts` | `SCRIPTS` |
| `src/audio/tracks/index.ts` + `public/audio/manifest.json` | `MUSIC_KEYS` is a contract list (CONTRACT-CHANGES §8) |
| `src/scenes/index.ts` | the `sceneKey` registry |
| `docs/CONTRACT-CHANGES.md`, `docs/target/targets.json`, `docs/handoff/NOW.md` | one writer each, newest first |

**Order:** O1–O5 options round → Bailey picks → **A** → **B** (and C, D, E, F, G in
parallel) → **H** → **I** → `node tools/orphans.mjs` (hard rule 4: a green suite does not
catch a module nothing imports) → full `npm test` → deep review → deploy.

**Hard dependency:** **A.3 (Active ATB, D-009) lands first.** This chapter's tempo, its
guide text and its mirror-match framing are all written for Active.

---

## 9. Acceptance cases

Mirrors `tests/unit/strategy-ffx2-bahamut.test.ts`, which drives the engine exactly the way
`BattleScreenWiring.ts` does — including the `'waiting'` branch, without which an ATB battle
never reaches a decision at all.

| # | Case | Passes when |
|---|---|---|
| **A1** | **Seeded win**, intended line (Logos → Ormi → Leblanc, Darkness Dance opener, Dispel on Not-So-Mighty Guard), **40 seeds** | **≥ 90 % wins** (36/40). Onboarding chapter; §4.5 says its difficulty is entirely under the player's control. Below 90 % is a REPAIR, not a retune of the boss. |
| **A2** | **Credible-mistake loss**: kill Leblanc and Logos first, leaving Ormi alone | Ormi reaches the last-enemy branch, Huggles fires, and it kills any standard Lv-22 dressphere except a topped-up Warrior [§5.4, §6.1]. **This loss must be reachable** — it is the chapter's best teaching moment and an auto-battler that "fixes" it would erase the lesson. |
| **A3** | **Seeded lose verifier**: no healing, no buffs, attack the nearest target | Defeat, deterministically, on every seed. |
| **A4** | **Huggles reproduces the published band.** 3 hits, base 300, chain ×1/×1.45/×1.50 = ×3.95 | Total lands in **1,110–1,254** [§4.1 — the one exact reconstruction in the research]. Unreducible: identical totals with Protect up and with Sentinel up. |
| **A5** | **No Love Lost trigger.** Leblanc's 3rd, 11th, 19th turn | Fires **only** while both henchmen have HP; kill either one and it never fires again; the `25 + uses` failsafe forces Not-So-Mighty Guard. |
| **A6** | **Russian Roulette rolls exactly one status** | Over 200 seeded rolls: exactly one of the six lands each time, never zero and never two. |
| **A7** | **Eject removes a character.** (New engine behaviour — E1.) | The ejected girl leaves `party()`, is untargetable, her gauge stops, **no cure works**, a special dressphere cannot be ejected [§7.2], and all three ejected ends the battle as a defeat. |
| **A8** | **The three defensive shapes are measurable.** | Fira into Ormi's MDef 16 ≈ **302**; a Warrior's sword into his Def 84 ≈ **121** [§6.2]. A Warrior misses Logos meaningfully more often than the Gunner does; **Perfect Pitch removes the gap**. Assert the ordering, not the digits. |
| **A9** | **Both-games absence tests** (rule 14, CHK-021). | `statusRollOneOf` appears on no FFX ability and no FFX code path; `eject` is settable by no FFX ability; the three new music keys appear in no FFX chapter's `music` block; the Leblanc guide and tactic claim no FFX boss id. |
| **A10** | **Real-input route** (CHK-022). One continuous legal-input route: title → chapter select → the new card → party prep → Act I → Act II → Act III → results → retry/return, on keyboard and on pad, `PYREFLY_BROWSER=gpu`, with the chapter's acts confirmed by screen and phase before every capture (CHK-016). |
| **A11** | **Act chain integrity.** | Each act's `nextGroupId` links with no menu between; party HP/MP/statuses/inventory carry across as Chapter 5's chain already does; a mid-chain defeat returns to the results screen, not a dead state. |
| **A12** | **Target-versus-build pairs.** | One `end-state-board --pair` composite per approved O1–O5 tile, looked at, before the deep review. |
| **A13** | **Orphan check.** | `node tools/orphans.mjs` clean for every new module (hard rule 4 — this has cost the project a day twice). |

**Measurements to take before and after**, because behaviour changes: Acts I/II/III
win rate and turn count across the 40 seeds; the Huggles band; per-target hit rates with and
without Darkness (the E-G1 table above, re-measured from the real engine rather than by hand);
and — carried from A.3 — chapters 4 and 5 measured under Active before and after.

**Existing evidence that stays reusable:** none of the FFX chapters' evidence is touched by an
FFX-2-only data addition. What *is* invalidated: anything depending on `resolve.ts`
(tracks B's three changes are shared combat core, so every FFX-2 chapter's evidence is
re-owed), and everything depending on the ATB model once A.3 lands.

---

## 10. Size, risks, verdict

**Size: 7 agent-tracks** (the nine above, with A and I being one integrator's two passes).
B is the only one needing judgement-grade work in the engine; C, D, E, G are well-specified
transcription-and-test tracks; F is voice work; H is gated on Bailey. Roughly: B one track,
C two (three formations, three ability files), D one, E half, F one, G one, I one — plus the
art and audio, which are not sized here because their scope is whatever Bailey picks in
O1–O5.

**Risks, worst first**

1. **The Active ATB prerequisite is unbuilt and unplanned.** `docs/plans/ffx2-active-atb-review.md`
   does not exist. Building this chapter under Wait and re-tuning later is exactly the blind
   iteration rule 9 forbids. *Mitigation:* A.3 first; its preflight is a separate, cheap job.
2. **Nothing perceivable is approved.** All of §6 is a `gap` tile. Starting track H before
   O1–O5 breaks hard rule 9. *Mitigation:* run the options round now, in parallel with A–G,
   which need no art.
3. **Three abilities have no published damage (G2).** *Mitigation:* Q2's labelled,
   in-band authored constants; §4.1's inversion closes them the moment a band is published.
4. **Three engine changes in `resolve.ts` re-own every FFX-2 chapter's evidence.**
   *Mitigation:* they are small, additive and separately tested; keep them in one commit so
   the deep review can bound the blast radius, and draw any new RNG at the end of its step so
   existing seeded replays are unchanged.
5. **Scope creep toward canon we cannot honour** — the free-movement battlefield behind
   Supercollider, shattering, the whole-chapter Syndicate-pink costume. *Mitigation:* Q3,
   Q4 and §6 record each as a deferred option with a recommendation, not as work.
6. **The chapter is a deep review before going public, plus live and focused.** Budget the
   review, not just the build; `critic/RUBRIC.md` §4 puts "new chapter" squarely in the deep
   row, and the repair-cycle cap for the current usage mode applies.
7. **Reviewer trap:** §5.1's Accuracy preview table and §4.1's No Love Lost band both *look*
   like validations and are not. The research's own §17.3 names the failure mode —
   "not invented numbers, but invented certainty". Any report that cites either as
   corroboration has repeated it.

### Verdict

**PROCEED**, on these conditions, in this order:

1. **A.3 (Active ATB, D-009) lands first**, with its own paper preflight.
2. **Options rounds O1–O5 go to Bailey and are picked** before track H starts.
3. **Q1 is answered in one line** (chapter number / select order) before track A.
4. **Q2's three authored constants are labelled AUTHORED** in the data file and in the commit.
5. Tracks A–G may start now: they need no art, no audio and no Bailey decision beyond Q1.
