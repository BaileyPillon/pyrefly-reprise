# Paper preflight: Chapter — Evrae, on the deck of the *Fahrenheit* (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (adopted 2026-09-21, AGENTS.md rule 15).
**Docs only. No code was written, no browser opened, no build run.**
Written 2026-09-21 by a sub-agent of the release orchestrator.

**Verdict: PROCEED** — with three things settled before the first line of code, listed in §11.

---

## 1. Game case and sources

**Game case: FFX only.**

Every mechanic in this chapter is decided by CTB, Trigger Commands, the three-active /
three-reserve bench, Break statuses, the Al Bhed Potion `Use` economy and a range boolean
that has no FFX-2 counterpart. `research/ffx-evrae-airship.md` §0.4 fences it explicitly:

> "Everything in this file is **FFX-specific and must not leak into the FFX-2 chapters**…
> and above all **the airship distance mechanic, which has no X-2 counterpart.**"

The fence is not a formality. The range state, the queued order, the reach gate and the
ammunition counter are all new engine surface, and a builder who writes them as general
plumbing will have given FFX-2 a second axis that `research/ffx-vs-ffx2-presentation.md`
says belongs to the Garment Grid instead. **Three carve-outs, stated once here and repeated
in §4:**

| Piece | Case | Why |
|---|---|---|
| Airship range, queued order, missile economy, reach gate, Wakka's ranged weapon | **FFX only** | §0.4; the mechanic does not exist in X-2 |
| `CombatantFlags.nonCombatant`, the status-applied counter hook | **both** | Shared plumbing and, in the counter hook's case, a missing-capability fix — `critic/CHECKS.md` CHK-020 |
| The `'long-range'` ActionFlag gaining a second, FFX-side meaning | **both**, read differently per game | The flag is one token; §4 item 3 makes the two readings explicit so neither game inherits the other's rule |

If a presentation idea born here (a turning arena, a pane break, a queue preview) is judged
good, §0.4 requires an **X-2-native re-derivation** before it appears in Chapter 4 or 5. It
is not copied across.

### Sources read in full for this preflight

- `research/ffx-evrae-airship.md` — the whole document, all 14 sections including the
  verification log (§13) and the fact-check log (§14). Every number below cites it by section.
- `research/ffx-combat-core.md` §1.2 (ICV), §1.4 (Haste/Slow), §1.5 (Delay), §1.6 (turn
  forecast tie-break, which **already ranks Cid last** — that line exists for this fight),
  §2 (damage), §4.2 (statuses).
- `docs/ARCHITECTURE.md`, `docs/ENGINE-API.md`, `docs/CONTRACTS.md`.
- `src/data/encounters.ts` (the contract file), and Chapter 1 end to end as the pattern:
  `src/data/ffx/enemies/seymour-flux.ts`, `src/data/ffx/builds/gagazet.ts`,
  `src/story/scripts/seymour-flux.ts`, `src/engine/tactics/seymour-flux.ts`,
  `src/data/chapter-meta.ts`, `tests/unit/chapter-meta.test.ts`,
  `tests/unit/strategy-seymour-flux.test.ts`.
- The FFX engine: `src/battle/ffx/{engine,commands,execute,targeting,abilities,statuses,ticks,predicates,state,scripted,hp,equipment}.ts`,
  `src/battle/ffx/ai/{types,reactions}.ts`, `src/battle/common/types.ts`.
- `research/writing-bible.md` §1.17/§1.18 (Brother, Buddy voice cards), §2.1, §5.x.
- `docs/audio/THEMES.md` (the 21-row cue map), `docs/target/targets.json`.

### The research's own confidence, carried forward

The research is unusually strong — a decompiled primary layer, a PS2/HD byte diff, a
verification log and a seven-defect fact-check pass that the author re-verified and
accepted. **Carry its tags into the data files verbatim** (`docs/CONTRACTS.md`, "Data
agents"). Two habits the fact-check log (§14.1) asks the sibling chapters to adopt, and
which this chapter's builders must obey:

1. A `[verified: 2 sources]` tag is a claim about the *sources*, not the value. Re-read the
   second source's sentence against the actual cell before tagging.
2. Never let a wiki claim into the `[decompiled]` layer.

---

## 2. The encounter as data

Everything in this section comes from `research/ffx-evrae-airship.md`. **Nothing is
guessed** (hard rule 6); values the research does not give are in §2.6 as gaps.

### 2.1 Evrae (`m119`, bestiary #097) — core stats

| Field | Value | Tag | §  |
|---|---:|---|---|
| HP / maxHp | 32,000 | `[verified: 2 sources]` | §1.1 |
| MP | 500 | `[decompiled]` + wiki | §1.1 |
| str | 36 | `[decompiled]` + wiki | §1.1 |
| def | 0 | `[decompiled]` (formula clamps the divisor to 1) | §1.1 |
| mag | 30 | `[decompiled]` + wiki | §1.1 |
| mdef | 0 | `[decompiled]` (same clamp) | §1.1 |
| agi | 20 | `[verified: 2 sources]` | §1.1 |
| luck | 15 | `[decompiled]` + wiki | §1.1 |
| eva | 0 | `[decompiled]` + wiki | §1.1 |
| acc | 100 | `[decompiled]` + wiki | §1.1 |
| `poisonTickPercent` | 0 | `[decompiled]` | §1.1 |
| `doomTurns` | 30 | `[decompiled]` (wiki says 20 — **C-3**, take the decompile) | §1.1 |
| `zanmatoLevel` | 3 | `[decompiled]` byte 402 (wiki says 4 — **C-3**) | §1.1 |
| Ronso Rage | **none** (`ronso_rage_id = 0`) — Kimahri learns nothing | `[decompiled]` | §1.1 |

**Write the Defense-0 comment carefully.** §1.1's fact-check F-4 deleted a false superlative:
Defense 0 is the monster table's *default* (217 of 343 PS2 records), not a property of Evrae,
and Seymour and Anima — the sibling Macalania chapter — are Defense 0 too. The honest line
for the data file is "no armour and a lot of blood", resting on
`_get_mitigation(1) = 725` against a theoretical maximum of 730 (§7.4). **Do not let any
HUD copy imply mitigation, and do not re-introduce the superlative.**

### 2.2 Affinities (§1.2, `[verified: 2 sources]`)

`fire: 0.5`, `ice: 0.5`, `lightning: 0.5`, `water: 0.5`, `holy: 1.0` (neutral).
Note the vocabulary: `docs/CONTRACTS.md` — the element is **`'lightning'`**, never `'thunder'`.

Consequence to write into the file: there is **no elemental puzzle**; elemental weapon
strikes are actively bad; and Lulu is halved on every offensive spell she owns at this
point in the story. Her role is **reach, not damage** (§7.4's corrected table).

### 2.3 Status resistances (§1.3, byte semantics: 0 = rolls normally, 1–254 = percentage, 255 = immune)

Landable (omit from `immunities`, or set the byte):

| Status | Byte | Note | Tag |
|---|---:|---|---|
| `slow` | 50 | The strongest legal lever: recovery 30 → 60 **and** +100% of the pending counter | `[verified: 2 sources]` |
| `darkness` | 50 | Physical hit chance → ~10%. Blanks **Attack**, **not** Swooping Scythe | `[verified: 2 sources]` |
| `power-break` | 0 | Halves Evrae's physical output | `[verified: 2 sources]` |
| `mental-break` | 0 | Legal and **worthless** — the stat is already 0/1. Ship it legal, expect ~0 benefit | `[decompiled]` |
| `reflect` / `protect` / `shell` / `regen` / `haste` / `scan` | 0 | Reflect is the one that matters (§2.7 below) | `[decompiled]` |

Immune (255): `poison`, `ko`, `zombie`, `petrify`, `sleep`, `silence`, `confuse`, `berserk`,
`provoke`, `magic-break`, `armor-break`, `eject`, `auto-life`. All `[decompiled]` + wiki.

`immunityFlags`: `['boss', 'immune-to-percentage-damage', 'immune-to-bribe']` plus
`immune_to_slice`. **`immune-to-delay` is deliberately absent** — §1.3's
`immune_to_delay = FALSE` makes Evrae the only boss in the anthology that can be delayed.
`immune-to-sensor` and `immune-to-scan` are both **false**; both commands work and both have
real text.

Two that need the resolution, not the losing side:

- **`threaten`** — byte reads 0, wiki says Immune. **C-4, unresolved.** Ship
  `threatenChance: 0` and default to immune, exactly as `seymour-flux.ts` does for its own
  C-2. Note the conflict in the file header.
- **`doom`** — byte reads landable with 30 turns, wiki says Immune. **C-3.** Functionally
  absent either way (a 30-turn Doom never resolves in this fight). Record; do not spend time.

### 2.4 Abilities — the eight decompiled rows (§3.1)

All ability names are independently confirmed by the wiki's Evrae infobox
`[verified: 2 sources]`.

| Ability | Target | Formula | Power | Hits | Acc | Statuses | Flags |
|---|---|---|---:|---:|---:|---|---|
| **Attack** (melee) | random character | `strength` | 16 | 1 | 120 | — | `crit-eligible`, **`affected-by-darkness`**, `shatter` (`shatterChance: 10`) |
| **Swooping Scythe** | all characters | `strength` | 8 | 1 | 100 | — | **`long-range`**, `shatter` (`shatterChance: 50`), **not** darkness-affected, no crit |
| **Poison Breath** | all characters | `magic` | 36 | 1 | always hits | **poison @ 100** | not long range |
| **Stone Gaze** | random character | `magic` | 10 | 1 | — | **petrify @ 100**, **slow @ 255 (stacks 100)** | `damages_hp = false`, `damages_ctb = true` — **no HP damage at all** |
| **Photon Spray** | random character | `magic` | 3 | **8** | always hits | — | 8 hits, **each re-rolling its target** |
| **Inhale** | self | none | 0 | 0 | — | — | the Poison Breath charge turn |
| **Out of breath range.** | self | none | 0 | 0 | — | — | the named whiff row |
| **Haste** | **counter, self** | `ctb` | 8 | 1 | — | **haste @ 254** | `heals`, `reflectable`, silence-affected, `long-range`, rank 4, MP 8 |

Five rows need a comment in the data file or they will be built wrong (§3.3):

1. **Haste is a `Counter Self`, not a scheduled turn.** It consumes no action slot and fires
   out of turn order. It is the *player's* Haste row (`ffx_command.csv` #54), so it carries
   full player-Haste semantics from `ffx-combat-core.md` §1.4: recovery `floor(/2)` **and**
   the pending counter instantly halved. 30 → 15, and its next turn jumps forward at the
   moment of the cast. **Both halves or the phase change reads flat.**
2. **Stone Gaze does zero HP damage.** Its entire payload is the two statuses.
3. **Petrify here is a kill.** A petrified target hit by a `shatter` action is Ejected
   permanently, bench slot and all. Swooping Scythe is party-wide with `shatterChance: 50`,
   so **Stone Gaze → Swooping Scythe is a coin-flip permanent removal.** This is the
   encounter's real lethality and it is invisible unless the HUD says so.
4. **Inhale / Out of breath range. are a matched pair** — a named visible telegraph and a
   named visible whiff. The whiff is a free celebration beat: the player *earned* it by
   spending a turn on an order instead of on damage.
5. **Photon Spray is 8 separate hits, each re-rolling its target.** `Targeting: 'random-enemy'`
   from the enemy's side, which `docs/CONTRACTS.md` defines as "picks a fresh random target
   per hit". **Do not implement it as one 8× multiplier on one victim.** (§3.3's correction:
   the per-hit retargeting is a guide claim `[verified: 2 sources]`, not a byte; the 8-hit
   count is `[decompiled]`.)

**Do not ship "Critical Strike"** (`ffx_monmagic2` row 102). §3.4: it is Evrae Altana's
Provoke-forced action, both monsters are Provoke-immune, and it never fires. C-10/C-10b are
recorded so the deleted "cannot crit" observation does not come back.

### 2.5 Cid (`m149`) — the third combatant (§2)

| Field | Value | Note |
|---|---:|---|
| HP / MP | 410 / 1 | an artefact; he is never a target |
| str / mag | 1 / 0 | clamp to 1 |
| def / mdef | 0 / 0 | clamp to 1 |
| **agi** | **16** | `[decompiled]`; wiki says 11 — **C-6**, worth one in-game check because it moves the fight's tempo (recovery 36 vs 42) |
| `immune_to_sensor` / `immune_to_scan` | TRUE / TRUE | **he is not meant to be read as an enemy** |

One action only: **Guided Missiles** — `fixed` formula, power 4, **12 hits**, always hits,
long range, rank 3, targeting Evrae. Resolved damage per §2.2: **2,244 / 2,400 / 2,532**
(min / mid / max), three uses, **≈7,200 total ≈ 22.5% of the bar, for zero party turns.**
Non-elemental, so the ×0.5 does not apply; fixed, so Defense is irrelevant. It **can** trip
the 1/3-HP Haste threshold `[single source: wiki]`.

Cid's turn, exactly (§2.3, `[verified: 2 sources]`):

```
if (queuedOrder !== null) { applyOrder(queuedOrder); queuedOrder = null; return; }
if (range === FAR && missilesLeft > 0) { missilesLeft -= 1; return GuidedMissiles(EVRAE); }
if (range === FAR && missilesLeft === 0) return announceOutOfAmmo();   // once, then silent
return doNothing();
```

**The order-vs-missile exclusivity is the rule the whole fight turns on.** A manoeuvre
consumes Cid's turn, so every course change costs a volley. Do not implement the order as free.

### 2.6 The distance mechanic (§4) — and the AI script (§5)

One boolean, `NEAR` or `FAR`, **opening at NEAR** `[single source: Jegged]`.

| | NEAR | FAR |
|---|---|---|
| Evrae's damaging actions | Attack, Poison Breath, Stone Gaze | Photon Spray only (+ Swooping Scythe as a phase-2 reaction) |
| Player actions that reach | everything | **Blk Magic, Wakka's physical attacks, Lancet** — nothing else |
| Cid's spare turn | nothing | fires Guided Missiles while ammo remains |
| A charged Poison Breath | resolves | **whiffs — "Out of breath range."** |

`[verified: 2 sources — wiki + GamerGuides, near-identical wording, independently fetched]`

**Does not reach at FAR:** Tidus, Auron, Rikku and Kimahri's ordinary attacks; Steal; Use as
offence; any Overdrive that is a physical strike. **Still works at FAR:** every buff, every
heal, Cheer, Focus, Al Bhed Potions — items and Wht Magic target your own party, so "reach"
is meaningless for them. **Do not smooth this asymmetry:** FAR is the *setup* zone, not a
dead zone, and that is the mechanical seed of the approved "queue answers before you commit"
presentation goal.

**The Trigger Command (§4.2):** Tidus and Rikku only `[verified: 3 sources]`; costs *that
character's turn*; takes effect on **Cid's next turn**, not immediately; **last order wins**
when two are issued before Cid acts. The true cost of one course change is **one party turn
+ one Cid turn + one forgone volley** — three resources for one boolean flip.

**Phase 1 — HP ≥ 10,667.** The NEAR four-turn cycle: Attack, Attack, Inhale, Poison Breath,
loop `[verified: 2 sources]`. Photon Spray while FAR. No self-buffs.

**Phase 2 — HP < 10,667 (1/3 of 32,000).** Evrae casts **Haste on itself**
`[verified: 2 sources]`; **stops using Stone Gaze** unless one is readied `[single source]`;
and, **while FAR and targeted**, answers with **Swooping Scythe, which drags it back to NEAR**
`[verified: 2 sources]`.

**Counters (§5.5).** Slow landing on an already-Hasted Evrae → **immediate counter-Haste**
`[verified: 2 sources]`. Targeted while FAR in phase 2 → Swooping Scythe. Dropping below 1/3 → Haste.

**Delay (§5.6).** `immune_to_delay = false`, base ticks 10: Delay Attack `+15`, Delay Buster
`+30` — a whole free turn. See §5 gap G-7 for the wiki-only rule that delaying *advances* the
Haste phase.

**§4.5 is the best rule in the encounter and the reason to build the chapter:** in phase 2,
**targeting Evrae at all while FAR makes it Swoop and close**, so the Poison Breath dodge
fails *because you attacked*. The correct play is to do nothing, visibly, on purpose — and
the UI has to make doing nothing legible.

### 2.7 Rewards (§1.4)

AP 5,400 / overkill 8,100; gil 2,600; overkill threshold 2,000. Drop: **Blk Magic Sphere ×1**
(×2 on overkill), guaranteed. Steal: **Water Gem ×1** common / **×2** rare, base chance 255
(clamp to the contract's 0–100 as `seymour-flux.ts` does). Bribe **impossible**.
Equipment drop: slots 1–3 `[verified: 2 sources]`, ability rolls **1 always**
(`[decompiled]`; wiki says 2 — **C-18**, take the decompile).

> The equipment drop is a joke the encounter is telling: **Stonetouch** weapons and
> **Stone Ward** armour — the exact counter to its own Stone Gaze — handed over *after* the
> fight. Worth a line of victory copy; worth nothing mechanically.

### 2.8 Every value the research does NOT give — gaps, never guessed

Hard rule 6. Each of these is `[estimate]` or absent in the source and **must ship labelled
as such, or not ship**.

| ID | Gap | Research's own position |
|---|---|---|
| **G-1** | The **rank** of the Trigger Command on Tidus/Rikku, and of Cid's manoeuvre | **Not in the data at all** — the manoeuvre has no action row (§3.2). §10 C-7 recommends rank 3 for both, `[estimate]`, verify |
| **G-2** | Whether a **redundant order** ("Move In" while already NEAR) still burns Cid's turn | `[derived]`, C-7. Recommended yes — it is the reading that makes the cost honest |
| **G-3** | Stone Gaze **aggro counter**: threshold 6, +1 magic / +2 physical | **wiki-only, C-1.** Reset behaviour, what counts as "regular", and multi-hit handling are all *unstated* — three `[estimate]` tunables |
| **G-4** | Whether **Mix** reaches at FAR | `Mix` is `long_range = false` yet Jegged's line uses Mighty G from the pulled-back state. **C-2, unresolved** |
| **G-5** | Is **Swooping Scythe** available in phase 1, or only phase 2? | Wiki implies phase 2, GamerGuides is unqualified. **C-12**, default phase-2-only |
| **G-6** | Stone Gaze's Slow **bypassing Slowproof and Ribbon** | `[single source: wiki]`, **C-8**. A deliberate exception to our status model |
| **G-7** | Delaying Evrae before 1/3 **advances the Haste phase** | `[single source]`, **C-13**, mechanism unstated |
| **G-8** | Whether Evrae's self-Haste under **Reflect** bounces onto the party | `[derived]`, **C-14**, no source states it |
| **G-9** | **Which music track plays.** No source names it | **C-16**, open. §12.6's reading is `[estimate]` |
| **G-10** | The whole party preset — §9.3 stats, §9.4 abilities, §9.5 inventory | **`[estimate]` by construction**, C-17, same caveat as every other chapter |
| **G-11** | Cid's Agility (16 decompiled vs 11 wiki) | **C-6**, materially changes tempo |
| **G-12** | Exact on-screen wording of the two orders | **C-9**, cosmetic — we write original copy (hard rule 8) |

§5 recommends an answer for each and says which truly block.

---

## 3. The party build the chapter should ship with

Sourced the way `src/data/ffx/builds/gagazet.ts` justifies its own: every number carries its
research section and its confidence tag, and **the whole preset is `[estimate]`** (§9.3,
C-17) — the same caveat Chapter 1 ships under.

### 3.1 Who is in it, and why the absences are the design (§9.1)

Six members, **not seven**: Tidus, Wakka, Lulu, Kimahri, Auron, Rikku. **Yuna is absent**
`[verified: 2 sources]`.

> "Yuna's absence is the encounter's design. No Wht Magic. No Cure, no Esuna from a
> dedicated caster, no Life… No aeons… Healing is **items only**… **That is the strongest
> argument for building it.**" (§9.1)

The engine handles this for free — see §4 item 17 — but the *chapter* has to mean it:
`aeons: []`, no `yuna` member, and the Summon category simply does not appear.

**Recommended `activeSlots`: `['tidus', 'wakka', 'rikku']`; `reserve: ['lulu', 'auron', 'kimahri']`.**
Rationale from the research, not from taste:

- **Tidus** — one of the two Trigger Command owners (§4.2), plus Cheer (§8 row 3) and Slow
  (§8 row 5, the fight's headline lever). Both of those work at FAR.
- **Rikku** — the other order owner, and **`Use` is the party's only real heal**: the Al Bhed
  Potion is rank 2, party-wide, exactly 1,000 HP, and cures **Poison, Silence and
  Petrification** (§6.4 `[decompiled]` + wiki). Against a Poison-Breathed party one shatter
  from losing a member, that single command is the answer. **"Rikku is not optional in this
  chapter"** (§6.4).
- **Wakka** — the *only* character whose ordinary attack reaches at FAR (§4.3), plus Dark
  Attack / Dark Buster, which blank two of the four NEAR-cycle turns (§6.1).

The bench is not filler. **Lulu** is the second reach (Blk Magic, `long_range`) and the fight
expects her to be swapped in at FAR; **Auron** carries **Power Break** (§6.2, halves both
Attack and Swooping Scythe); **Kimahri** carries **Lancet**, the third reach. The switch
economy is part of the chapter, and the preset must make all three switches legal from turn one.

### 3.2 Stats — §9.3, every cell `[estimate]`

| | Sphere Lv | HP | MP | STR | DEF | MAG | MDEF | AGI |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Tidus | ~24 | 1,150 | 60 | 22 | 14 | 11 | 12 | 22 |
| Wakka | ~24 | 1,300 | 40 | 24 | 14 | 13 | 12 | 12 |
| Lulu | ~24 | 700 | 200 | 8 | 10 | 32 | 36 | 10 |
| Rikku | ~28 | 880 | 130 | 16 | 12 | 12 | 14 | 22 |
| Auron | ~26 | 2,000 | 60 | 30 | 22 | 8 | 10 | 9 |
| Kimahri | ~22 | 1,250 | 100 | 20 | 18 | 18 | 12 | 10 |

§9.3's own sanity check against §7.2 is the reason to accept the shape: Evrae's melee takes
**half of Tidus's bar in one hit**; Poison Breath is **lethal to Lulu in two**; the poison
tick alone is 250–350 per character per turn. That matches every account of the fight.
Base stats at Sphere Level 0 for the preset builder are §9.2, `[decompiled]` from
`characters.json`; base weapon damage is **16** for all of them.

### 3.3 Abilities — §9.4, `[estimate]`

Tidus: Cheer, Provoke, Haste, **Slow**, Delay Attack, Flee, **Talk** (the order).
Wakka: **Dark Attack, Dark Buster**, Silence/Sleep Attack, Triple Foul; Reels.
Lulu: the four elements and the full `-ra` tier, Bio (**useless here**), Focus; Fury.
Rikku: **Steal, Use, Mix**; **Reflect** (via a Lv. 2 Key Sphere shortly after she joins,
`[single source]`); **Talk**.
Auron: **Power Break**, Armor/Magic/Mental Break, Threaten; Dragon Fang, and **Banishing
Blade** if two Jecht spheres were watched (Power Break + Mental Break together,
`[single source]`).
Kimahri: **Lancet**, possibly Use or Self-Destruct.

### 3.4 Inventory and equipment — §9.5

**Al Bhed Potions are the balance point**: `[estimate]` 15–30 at the fight, plus 20+ Potions,
5–10 Hi-Potions, 10+ Phoenix Downs, a dozen Antidotes and Softs, ~20,000–40,000 gil.
Whether Rin sells Al Bhed Potions aboard the ship is **C-15**; default **not purchasable**,
because scarcity is better for the chapter, and the player arrives with a stack regardless.

The armour story, and the fact-check F-1 correction that rewrote it — **get this right, the
first draft of the research had all four costs wrong**:

| Customisation | Cost (one armour slot) | Effect | Reachable aboard the *Fahrenheit*? |
|---|---|---|---|
| **Stone Ward** | **Soft ×30** | 50% base resistance, **subtracted** from the infliction chance | **Yes** — Softs are 50 gil from Rin |
| Stoneproof | Petrify Grenade ×20 | 100% immunity | **No.** Not sold here at any price |
| **Poison Ward** | **Antidote ×40** | 50% base resistance | **Yes** |
| Poisonproof | Poison Fang ×12 | 100% immunity | **No** |

`[verified: 2 sources]`. The honest beat is **"you can buy one person half a chance"** — 30
Softs is *exactly one* Stone Ward slot, and against a 100% Stone Gaze a Ward leaves ~50%
still landing. **Stoneproof is not a budget decision here; it is out of reach.** The engine
already knows both abilities: `src/battle/ffx/equipment.ts` maps `stone-ward → petrify` and
`stoneproof → petrify`.

---

## 4. Engine capabilities the fight needs — found by reading the engine

Every row names the file and function I read. **Eleven of the twenty-one mechanics in
research §11 already work.** The genuinely new surface is five items, and only two of them
touch a contract file.

### 4.1 Already there — no change needed

| # | Need | Where it already is |
|---:|---|---|
| 1 | Three-active / three-reserve swapping, CTB with rank recovery, the forecast | `src/battle/ffx/turnQueue.ts#predictTurnOrder`, `execute.ts` case `'switch'`. §1.6 of the combat core **already ranks Cid last in the tie-break** — that line was written for this fight |
| 2 | **Poison as 25% of max HP** on characters | `src/battle/ffx/ticks.ts:134-138` — `percent !== undefined ? idiv(maxHp*percent,100) : idiv(maxHp,4)`. Characters already take `maxHp // 4`; Evrae's own `poisonTickPercent: 0` makes Bio and Poison Fang inert, correctly |
| 3 | **Petrify → shatter → permanent Eject**, per-action `shatterChance` | `src/battle/ffx/abilities.ts:347-352` (`hasFlag(def,'shatter') && has(target,'petrify')` → `ejectActor`) and `src/battle/ffx/hp.ts:239#ejectActor`, which emits "<name> shatters" and removes the bench slot |
| 4 | **Darkness per action** | The `'affected-by-darkness'` ActionFlag plus `src/battle/ffx/accuracy.ts:47`. Attack carries it, Swooping Scythe does not — the asymmetry is expressible today |
| 5 | **Delay on a boss** (weak +15 / strong +30) | `src/battle/ffx/abilities.ts:344-345#applyDelay`, gated on `immunityFlags` containing `'immune-to-delay'`. Evrae simply omits the flag |
| 6 | **Haste/Slow with both halves**, mutual exclusion | `src/battle/ffx/statuses.ts:197-204` (each removes the other, permanent stacks cannot be displaced) and `:235 onHasteApplied` (the instant CTB halving) |
| 7 | **Elemental affinity multipliers** | `src/battle/ffx/elements.ts` / `formulas.ts:303` step 4 |
| 8 | **A one-turn telegraph** | The `charge` BattleEvent (`types.ts:1915`, `{ enemyId, name, turnsLeft, stage }`), already driving the Mortiorchis ladder. Inhale is a one-turn instance of the same thing |
| 9 | **A free, 0-CTB boss reaction** | `src/battle/ffx/ai/reactions.ts#collectBossCounters` → `BossCounter { actorId, command, cause }`, called from `engine.ts:335` |
| 10 | **Absent Yuna — Summon *gone*, not greyed** | `src/battle/ffx/commands.ts:147` gates the whole Summon block on `ctx.state.aeonId === null && ctx.rt.aeonRoster.size > 0 && user.id === 'yuna'`. A build with no `yuna` and `aeons: []` produces **no Summon row at all.** Research §11 item 20 is already satisfied |
| 11 | **A per-encounter scratchpad** | `BattleState.flags: Record<string, number\|string\|boolean>` (`types.ts:2217`), documented as "Encounter-scoped flags an AI script or a story trigger can set and read", and already mirrored across chain links by `state.ts#spendItem`'s pattern. **This is the home for the airship state, with no contract change** |

**A genuinely good surprise on C-14 (G-8).** `src/battle/ffx/targeting.ts:131#reflectBounceTarget`
reads:

```ts
const other = reflector.side === 'enemy' ? livingFriendlies(ctx) : livingEnemies(ctx);
return other.length > 0 ? ctx.rng.pick(other) : undefined;
```

It picks a random living member of the *opposite* side with no self-target special case, and
`abilities.ts:141-143` calls it for any single-target `reflectable` spell. Evrae's Haste is
`reflectable` and self-targeted, so **the engine already produces the derived behaviour** —
Reflect on Evrae converts its self-Haste into a free Haste on a random party member. C-14
needs a unit test, not an engine change. If Bailey wants it suppressed, that is a *data*
decision (drop `reflectable`), not a code one.

### 4.2 The five real gaps

Ordered by how much they cost.

---

**Gap E-1 — A combatant that is on the field, takes turns, and is neither a target nor a
victory condition (Cid).**

*What I read.* `Side = 'party' | 'enemy' | 'aeon'` (`src/battle/common/types.ts:69`). There is
no neutral side. Targeting is already solved: `src/battle/ffx/predicates.ts:75#targetable`
returns `onField(c) && !c.flags.untargetable && !c.flags.hidden`, and
`src/battle/ffx/state.ts:278#livingEnemies` filters on it, so a Cid with
`side: 'enemy', flags: { untargetable: true }` can never be selected. **The victory condition
is the problem.** `src/battle/ffx/engine.ts:391#checkEnd`:

```ts
const primary = bosses.filter((c) => !c.flags.isPart);
const relevant = primary.length > 0 ? primary : bosses;
if (relevant.every((c) => !isAlive(c))) { this.finish('victory'); return true; }
```

A living, unkillable Cid on `side: 'enemy'` **blocks victory for ever.** Tagging him
`isPart: true` would dodge it but is semantically false (`partOf` means a limb of a boss) and
would put him in the HUD's part rows and in `part-destroyed` events.

*Smallest additive change.* Add one optional field to `CombatantFlags` in
`src/battle/common/types.ts`:

```ts
/** On the field and takes turns, but is not a combatant: never a target, never a
 *  victory or defeat condition. Cid on the Fahrenheit is the only user. */
nonCombatant?: boolean;
```

and read it in exactly two places: `engine.ts#checkEnd`'s filter, and
`state.ts#livingEnemies` (belt and braces — `untargetable` already covers it).

*Contract impact.* `src/battle/common/types.ts` is a contract file (`docs/CONTRACTS.md`), so
this needs **one entry in `docs/CONTRACT-CHANGES.md`, newest first** (hard rule 2). It is
purely additive — an optional boolean on an existing optional-flags bag — so nothing
recompiles differently. **Game case: both** (shared plumbing, CHK-020), though only FFX data
sets it today.

*Do NOT widen `Side`.* `side === 'enemy'` is branched on in `targeting.ts#validTargets`,
`state.ts#alliesOf/opponentsOf/reflectBounceTarget` and
`ai/reactions.ts#collectBossCounters` at minimum, ~30 agents compile against it, and a fourth
member would need a decision at every one of those sites. The flag is a tenth of the blast radius.

*A free correctness win.* `ai/reactions.ts` line ~57 reads `if (attacker.side === 'enemy') return out;`
— so with Cid on the enemy side **Guided Missiles provokes no counter**, which is exactly
G-3's recommended default ("regular" excludes Cid's script action). The cheap arrangement is
also the canonical one.

*One thing to check while building, not a claim.* Guided Missiles targets Evrae, who is
Cid's *ally* under this arrangement, so the def's `targeting` is `'single-ally'`. Confirm in
`abilities.ts` that an ally-targeted damaging action without the `heals` flag still deals
positive damage rather than being sign-flipped. If it is flipped, the fix is a data-level
`targeting: 'single-any'`, not an engine change.

---

**Gap E-2 — Reach: an action that is legal at NEAR and illegal at FAR.**

*What I read.* `src/battle/ffx/targeting.ts:25#validTargets` is the single place legality is
computed, and `src/battle/ffx/commands.ts#availableCommands` is the single place
`enabled` / `disabledReason` is written — `docs/CONTRACTS.md` is explicit that "the UI never
re-derives legality". So there is exactly one seam, which is the good case.

The `'long-range'` ActionFlag already exists (`types.ts:1247`) but its doc comment is
**FFX-2-specific**: *"FFX-2: fires from the starting position with no run-in, so it never
breaks a chain by approach time."* All 16 current uses are under `src/data/ffx2/**`. The two
meanings are genuinely different rules and must not be conflated.

*Smallest additive change.*
1. Amend the flag's doc comment to state **both** readings — "FFX: reaches a distant enemy
   (the Evrae airship range state); FFX-2: no approach time, never breaks a chain." One line,
   no code. **Contract-file edit → one `CONTRACT-CHANGES.md` note.**
2. Add `reachesAtRange(ctx, user, def): boolean` to `src/battle/ffx/targeting.ts`, reading
   `ctx.state.flags['airship:range']`. When the flag is absent — every other chapter — it
   returns `true` unconditionally, so **nothing outside this chapter changes behaviour**.
3. Call it from `validTargets` and surface `disabledReason: 'Out of reach'` in `commands.ts`.

*Game case:* the *flag*'s second reading is **both** (one token, two documented rules); the
*range gate* is **FFX only** and is inert wherever the flag is unset. `src/battle/ffx2/**`
is not touched.

---

**Gap E-3 — Wakka's ranged weapon: reach as a property of the character, not of the action.**

*What I read.* Nothing in `src/battle/ffx/**` carries per-character reach. FFX-2 has the
concept (`src/battle/ffx2/dresspheres.ts:62#isLongRangeDressphere`) but it is dressphere-keyed
and `src/battle/**` must not cross the two engines.

*Smallest additive change.* An optional `CombatantFlags.rangedWeapon?: boolean`, set from the
build for Wakka only, read **only** inside `reachesAtRange`. Same `CONTRACT-CHANGES.md` entry
as E-1 — one optional boolean on the same bag.

*Alternative considered and rejected:* an `AutoAbilityId` in `equipment.ts`. It reads better
in the fiction ("the blitzball is the weapon") but auto-abilities are customisation slots the
player can move, and Wakka's reach is not customisable. The flag is honest.

---

**Gap E-4 — A second Trigger Command flavour, and an order that resolves on someone else's turn.**

*What I read.* `TriggerCommand` (`types.ts:1640`) is `{ kind: 'trigger', id: string, targets }` —
`id` is already an arbitrary string, so **no interface change is needed.** But both ends
hardcode `'talk'`:

- `src/battle/ffx/commands.ts:108` — `if (marker?.kind === 'trigger' && marker.id === 'talk' && !talkAvailable(ctx, user))`
- `src/battle/ffx/execute.ts:234` — `if (command.id === 'talk') { accepted = applyTalkTrigger(ctx, actor); }`

*Smallest additive change.* Replace the two `=== 'talk'` literals with a small dispatch keyed
by trigger id, and register two new ids — **`'order-pull-back'` and `'order-move-in'`** — whose
handler writes `ctx.state.flags['airship:order']`. **Two ids rather than one id with a payload**
deliberately: `TriggerCommand` has no `extra` field, and adding one would be a contract change
for no gain.

Neither `commands.ts` nor `execute.ts` is a contract file, so **no `CONTRACT-CHANGES.md` entry
is required** — but the two new ids need catalog rows in
`src/data/ffx/abilities/special-menu-markers.ts` alongside the existing `'talk'` marker,
following its `extra.triggerId` / `extra.note` pattern exactly.

**Rank: `[estimate]` 3 (G-1/C-7).** Label it in the data file and put it on the tunables list.

*Where the queued order lives:* `ctx.state.flags['airship:order']`, with "last order wins"
falling straight out of a plain assignment. `AiContext.memory` is **per-actor** scratch
(`rtOf(ctx, self.id).ai`), which is right for Cid's `missilesLeft` and `outOfAmmoAnnounced`
but wrong for a battlefield-wide boolean — hence `state.flags` for the range and the order.
No engine change for either.

---

**Gap E-5 — A counter provoked by a status landing, not by damage.**

*What I read.* `src/battle/ffx/engine.ts:318-336` builds the counter input from the emitted
events:

```ts
if (e.type === 'damage'  && e.sourceId === actor.id) damaged.add(e.targetId);
if (e.type === 'mp-damage' && e.sourceId === actor.id) damaged.add(e.targetId);
...
const counterable = [...damaged].filter((id) => !transformed.has(id));
```

Only `damage` and `mp-damage` feed it. §5.5's counter-Haste fires on **Slow landing**, which
is a `status-add` event. Tidus's Slow uses the `ctb` formula and may or may not emit a
`damage` event on the same action, so the trigger would be **incidental and seed-dependent** —
precisely the class of bug hard rule 3 exists to catch.

*Smallest additive change.* Collect `status-add` event targets the same way `damaged` is
collected, pass them as a second argument to `collectBossCounters`, and let each boss's
counter function decide whether it cares. Roughly four lines in `engine.ts` and one parameter
in `ai/reactions.ts`. **Neither file is a contract file — no `CONTRACT-CHANGES.md` entry.**
Existing bosses ignore the new argument, so Chapters 1–3 are byte-identical.

*Game case: **both** — this is a missing-capability fix in shared FFX plumbing (CHK-020),
even though only Evrae uses it today.*

### 4.3 Data-level, no engine change

- **G-6 / C-8 — Stone Gaze's Slow bypassing Slowproof and Ribbon.** The documented escape
  hatch is `AbilityDef.extra.script`, dispatched by `src/battle/ffx/scripted.ts`, whose header
  reserves `extra` for "behaviour too bespoke to deserve a schema field". Add a
  `stoneGazeSlow` script key, document it in the data file that sets it, per the file's own
  house rule. **A unit test either way**, because it is a deliberate exception to our status model.
- **G-3 / C-1 — the aggro counter.** Pure AI memory (`AiContext.memory`), three named
  tunables (`threshold: 6`, `resetOnFire: true`, `countsMultiHitOnce: true`), all
  `[estimate]`, all surfaced not buried.
- **Swooping Scythe closing the range.** A counter whose `extra.script` also sets
  `state.flags['airship:range'] = 'NEAR'`. No new flag, no new event.

### 4.4 Perceivable and therefore NOT engine work — hard rule 9

Three surfaces the fight needs that a builder must not invent:

- **The third Trigger Command widget flavour (C-11).** `research/visual-bible.md` §3.12
  specifies exactly two flavours, both one-shot Talks. A **persistent two-state toggle**
  issued to an uncontrollable ally, with a preview of what the order costs Cid this turn and a
  queued-order indicator on his CTB row, is a new widget. Research §11 item 17 says so in
  terms: *"Needs a mockup and Bailey's approval before integration."*
- **Cid's CTB row.** A forecast row that is neither party nor enemy, carrying a queued-order
  marker. `TurnPreview` has `portraitKey`, `isParty`, `letterTag`, `statusIcons`,
  `overdriveReady`, `chargeStage` — no "third party" state and no order marker.
- **The range-state read.** §12.3's bar is that *a player who has muted the UI should still
  know which state they are in.* That is a scene and HUD decision together.

All three go through the options round in §6, not through a builder's judgement.

---

## 5. Open canon questions — evidence, recommendation, and whether it blocks

Ordered: blockers first.

| ID | Question | Evidence | My recommendation | Blocks? |
|---|---|---|---|---|
| **Q1 (G-9/C-16)** | Which music? No source names the Evrae battle track | §12.6: "Enemy Attack" is the OST's stated **main boss theme**; "Leap in the Dark" plays "when the *Fahrenheit* is attacked by fiends"; "Assault" is the Bevelle rescue | Ship §12.6's `[estimate]` reading: **"Leap in the Dark" as the approach cue, the main boss theme for the battle, "Assault" for the coda**. We compose originals in those emotional slots anyway (hard rule 8), so the canon question is about *register*, not about a track. **The two range variants and the phase-2 subdivision change are new composition and need Bailey's ear** (hard rule 13) | **Blocks the audio track only.** The fight can be built and reviewed on an existing cue |
| **Q2 (G-4/C-2)** | Does **Mix** reach at FAR? | `Mix` is `long_range = false`; Jegged's recommended line uses Mighty G from the pulled-back state | **Mix reaches.** It targets your own party, so "reach" is meaningless for it — the same reasoning that already exempts items and Wht Magic (§4.3). **Offensive items and Steal do not reach.** Ship it, label `[estimate]`, tunable | No — ship behind the documented assumption |
| **Q3 (G-5/C-12)** | Swooping Scythe in phase 1, or phase 2 only? | Wiki frames it as phase-2; GamerGuides lists it unqualified | **Phase 2 only.** §5.4's own reasoning: it gives the phase change a distinct silhouette, which is also the better fight | No — documented assumption, one tunable |
| **Q4 (G-1,G-2/C-7)** | Trigger Command rank; does a redundant order burn Cid's turn? | **Not in the data at all** — the manoeuvre has no action row | **Rank 3 for both; yes, a redundant order burns the turn.** That is the reading that makes the three-resource cost honest, and the cost is the chapter's thesis | No — but it must be a labelled tunable, because it is the single number the fight's difficulty is most sensitive to |
| **Q5 (G-3/C-1)** | The aggro counter's three unstated rules | wiki-only threshold and increments; reset, "regular", and multi-hit all unstated | Ship the wiki's 6 / +1 / +2 with `resetOnFire: true`, `countsMultiHitOnce: true`, all `[estimate]` and **surfaced, not buried** — §5.3's derived consequence ("fighting at range also slows the petrify clock") is only legible if the counter is visible | No — but the **readout** is perceivable and needs an options round (§6) |
| **Q6 (G-8/C-14)** | Does Evrae's self-Haste bounce off Reflect onto the party? | `[derived]` from our own core; no source states it | **Yes, and it already works** — §4.1 above: `reflectBounceTarget` has no self-target case. Pin it with a unit test. §6.5: "if true it is one of the best moments available in the chapter and if false it is a bug the player will notice immediately" | No |
| **Q7 (G-7/C-13)** | Does delaying Evrae before 1/3 advance the Haste phase? | `[single source: wiki]`, mechanism unstated | **Do not ship it.** §5.6 is unambiguous that an invisible penalty on the player's tempo tool "is a trap, not a decision", and we cannot make it visible honestly without knowing the mechanism. Record the omission in the data file | No |
| **Q8 (G-11/C-6)** | Cid's Agility: 16 or 11? | decompile 16, wiki 11; recovery 36 vs 42 | **16**, per the house rule. It materially changes how often the ship can turn, so it is on the playtest list | No |
| **Q9 (G-12/C-9)** | The exact wording of the two orders | Sources split on casing; only "Pull back" is two-source | **Write our own copy** (hard rule 8). Recommend **"Pull back"** and **"Close in"** — "Move in" is single-source *and* reads as the player moving | No |
| **Q10 (C-5)** | Scan says melee aggro provokes **Poison Breath**; the AI says it provokes **Stone Gaze** | Two in-game-derived sources genuinely disagree | **Ship both.** Behaviour = Stone Gaze (the specific numeric claim); Scan text = as written. §1.5: "reproduce the lie *and* let the player find out it is a lie — that is a better beat than quietly correcting it." Note it in the help window, not in the Scan panel. The Scan text also lies about Magic Defence; same treatment | No — and it is the best writing beat in the chapter |
| **Q11** | **Does the fight name the chapter, or does the airship?** | §12.6's whole music brief is *"Machina, not menace… The wyrm is not the subject — the airship is"*; §12.5's framing recommendation is that this is "a fight with a doorman" | Bailey's call. **I recommend the airship**: it aligns the music, the parallax scene and the thesis ("the turn you do not spend is the turn that does the most damage") | No, but it shapes the chapter card and the options round, so **ask before §6 goes out** |
| **Q12** | **There is no beat map for this chapter in the writing bible.** §3 covers E1–E5 only | Confirmed by reading: `research/writing-bible.md` has voice cards for Brother (§1.17) and Buddy (§1.18) but **no E-tag for Evrae** | Write the beats from the research's §12.4/§12.5 (both `[verified: 2 sources]` for the story beats) against the bible's §2.1 house style, and **add an E-tag section to the writing bible as part of this chapter's work**, so the next chapter does not re-derive it | No — §7 below is that beat sheet |

---

## 6. Assets — and the options rounds that must come first

Hard rule 9: nothing Bailey will see, hear or feel is built before an approved target.
`docs/target/targets.json` currently holds one tile for this chapter, **state `gap`**:

> `"label": "Evrae on the airship (FFX)"`, `"empty": "Concept sheets on the way"`,
> `"note": "Distance through Cid's Trigger commands, missiles, Poison Breath telegraphed by the inhale."`

and the parent tile's note: *"Each chapter's cast and backdrop concept sheets come to you for
a pick once its research is fact-checked."* **The research is fact-checked (§14). The concept
sheets are now due.**

### 6.1 The inventory

| Asset | State | Notes |
|---|---|---|
| **Evrae painting, NEAR pose** (head-and-claws over the rail, jaw level with the deck) | **NEW** | §12.2: "two silhouettes, one creature" |
| **Evrae painting, FAR pose** (a long diagonal streak across open sky) | **NEW** | At FAR you see *less* of it, not a smaller copy |
| **Evrae throat-charge state** (the Inhale frame) | **NEW** | Must read at chapter-card size; one of only two enemy telegraphs in the anthology |
| **Evrae eyes / Stone Gaze state** | **NEW** | §12.2: "the single most readable thing on the creature" |
| Evrae hurt / ko states | **NEW** | The standard `<state>.png` set; ko is the fall through the cloud layer |
| **Backdrop: the *Fahrenheit* foredeck** | **NEW** | §12.3. Seven named layers (sky, three cloud bands, Bevelle, deck, wind) |
| **Bevelle on the horizon, growing** | **NEW** | "a free, diegetic progress bar" |
| Tidus, Wakka, Lulu, Rikku, Auron, Kimahri paintings | **exists** | The FFX cast is painted; per `docs/target/targets.json` the party tiles are approved. Check each pose exists at `public/art/characters/<id>/<state>.png` before assuming |
| Party portraits (six) | **exists** | Approved 2026-09-19; the art-round-4 candidates were approved 2026-09-21 |
| **Cid portrait** | **NEW** | He has a CTB row and speaks over the deck; there is no Cid portrait in the cast |
| Brother / Buddy portraits | **NEW, only if they speak** | §7's beats give Brother one line. Voice cards exist (§1.17, §1.18); portraits do not |
| **Chapter card** | **NEW** | §12.3 money shot 2, the FAR silhouette, explicitly named as the card |
| **Pause plate** | **NEW** | Full-bleed 2× per the pause track |
| Chapter-select thumbnail | **NEW** | Derived from the card |
| **VFX: missile volley** | **NEW** | §12.3 money shot 4 — twelve trails converging, deck lit from beneath |
| **VFX: Poison Breath cone, Stone Gaze, Photon Spray (8 hits), Swooping Scythe sweep** | **NEW** | Photon Spray's 8 retargeting hits are a real presentation problem, not a reskin |
| VFX: petrify, shatter, poison tick | **exists** | Shared status VFX |
| **Parallax cloud drift that changes speed on a manoeuvre** | **NEW** | §12.3: "its speed is the ship's speed, and it must visibly change when the ship manoeuvres". `src/engine/Backdrop.ts` has a parallax stack; whether a layer's speed can be driven at runtime is a build-time check |
| **Music: `scene-fahrenheit`** | **NEW** | No airship cue exists — `src/audio/tracks/` has five `scene-*` cues, none of them this |
| **Music: `boss-evrae`, with NEAR and FAR variants and a phase-2 subdivision change** | **NEW** | §12.6. `docs/audio/THEMES.md` has 21 rows; this is rows 22 and 23 |
| `victory-ffx` | **reuse** | Every FFX chapter uses it (`encounters.ts`) |
| SFX: engine room, wind, launch, the whiff sting | **NEW** | The whiff ("Out of breath range.") deserves its own sound — it is a celebration beat |

### 6.2 The options rounds Bailey must see first — five, cheap and broad

Per the "raise the fidelity of the choices" rule: start cheap, spend only on survivors, and
treat a pick as approving **only what Bailey names**.

**O-1 — Evrae, the creature.** 3 options at real resolution. The axis worth contrasting is
the one §12.2 names: *eel* vs *dragon* vs the hybrid, with the constraint that the silhouette
must **never say bat** and the composition must **never fit the whole creature**. Each option
shows the NEAR and FAR silhouettes side by side, because the pair is the mechanic.

**O-2 — The deck and the sky.** 3 backdrop options. The chapter is "the anthology's only
scene with a floor and a sky and nothing in between" and is the natural home for two approved
presentation goals ("backdrops with a floor and a sky", "air in the arena"). Contrast the
**height of the horizon** and how much deck the player stands on — that decides whether the
fight feels like a duel or a siege.

**O-3 — The order widget (C-11), the highest-risk one.** 3–4 mockups of a persistent
two-state toggle: the two orders, a preview of what the order costs Cid *this turn*, and the
queued-order indicator on his CTB row. **This is the chapter's interface invention and the
one thing most likely to be wrong at high fidelity.** The rule that makes it hard is §4.5: the
correct play is often *to do nothing*, and the widget has to make doing nothing legible. A
minimal interactive prototype is justified here if the mockups do not settle it — it is the
one place on the ladder where a still image may not answer the question.

**O-4 — The range read without the HUD.** 2 options, each a pair of frames (NEAR and FAR).
§12.3's bar: *"A player who has muted the UI should still know which state they are in."*
Cheap — it is a lighting and occlusion decision, not new painting.

**O-5 — Audio.** 2 sketches of the battle theme, each auditioned in
`docs/audio/audition.html` (hard rule 13, agents cannot hear). **The two range variants must
be auditionable back to back with the cross-fade, or the idea cannot be evaluated at all**
(§12.6). The brief: 140–150 BPM, machina not menace, engine-room percussion, a short two-bar
figure that survives interruption, a minor-modal harmony with air in the middle, and phase 2
changing the *subdivision*, not the tempo. Anti-brief: no choir, no orchestral brass fanfare,
nothing sacred — Bevelle's holiness is the irony of this scene, not its sound.

**The chapter card and pause plate are derived from O-1 and O-2 and do not need their own
round.** The Cid portrait is a single new cast tile and rides the existing art-round process.

---

## 7. Story beats — pre, mid and post

Beats only, no dialogue. From research §12.4 and §12.5 (story beats
`[verified: 2 sources]` against the wiki's *Fahrenheit* and *Bevelle* sections and Jegged),
written against the writing bible's house style. **The bible has no E-tag for this chapter**
(Q12) — adding one is part of the work.

### Pre-battle

1. Home is gone. The survivors are aboard a thousand-year-old airship that has no business
   flying, and the Al Bhed are flying it anyway. *Exhausted, defiant.*
2. Brother finds Yuna: she is in Bevelle, being married to Seymour within the hour. Cid puts
   the ship on course without being asked twice. *Urgency, family.* — Brother and Cid.
   (Brother's guardrail, §1.17: **under one line of genuine terror per encounter**, short and
   unfunny, then straight back to ridiculous.)
3. The guardians arm up on the deck. **Yuna is not here.** Somebody says out loud what
   everyone has worked out: without her, nobody in this party can heal anything.
   *The chapter's thesis, stated once.* — Rikku or Lulu.
4. Bevelle comes up over the cloud line — white, tiered, enormous, the first city in the game
   that looks like it was *designed*. *Awe with a threat in it.*
5. Something detaches from the city and climbs to meet them. It is not scrambling; **it was
   already waiting.** The city posted a guard. *Cold recognition.*
6. Auron, dry, names the thing for what it is. *Gallows humour.* (§12.2: his canonical remark
   is a five-word comparison to a toothed red carpet. **Do not reuse the line; reuse the
   register** — hard rule 8.)
7. **BATTLE.** Cid's voice over the deck: he can move the ship, and he has missiles, **and he
   cannot do both at once.** *The mechanic, delivered as characterisation.* — Cid.

Beat 7 is the chapter's tutorial and it is one line. That is the right amount.
`pre` must end with `battleStart()` (`docs/CONTRACTS.md`).

### Mid-battle (`mid` + `midScripts`, one callout each, every `say` with an explicit `auto`)

| Trigger | Beat |
|---|---|
| First **Inhale** | One party callout beside the telegraph banner, per writing-bible §5.2's one-line-per-state rule. It teaches the dodge without naming a button |
| First **"Out of breath range."** | The celebration beat. The player spent a turn on an order instead of on damage and it *worked* — say so once, warmly |
| **Out of ammunition** | Cid, once. Then his skipped turns are silent, and the silence does the work |
| **HP below 10,667** (Haste) | The phase change. Something the party can see: the wyrm speeds up and the ship's tricks start failing |
| First **shatter** | If a member is lost, one line. Permanent removal of a bench slot deserves acknowledgement and nothing more |

### Post-battle

8. Evrae breaks and **falls out of the sky**, down through the cloud layer, gone. Not sent,
   not killed on screen — it stops being a problem and becomes a shape getting smaller.
   *Anticlimax, deliberately.*
9. There is no rest. **Bevelle's own guns open up.** The *Fahrenheit* takes damage and Cid has
   to peel away. Beating the guard did not get them in. *The victory is revoked within a
   minute.* — Cid.
10. Tidus goes down the mooring chains to the palace roof alone, because that is what is left.
    *Reckless, inevitable.*
11. The wedding — Yuna on the tower, Seymour beside her, the guardians arriving late and
    outnumbered. *The hinge of the act.*

**Beat 9 is why this chapter's music escalates after you win.** It is also the chapter's
tonal signature and the argument for building it: every other FFX chapter is a confrontation
with a person who has an argument; this is a **fight with a doorman**, and the interesting
decisions all belong to the ship. Build the chapter around **restraint** — the player's best
plays are pulling back, waiting, and not attacking. No other chapter in the set occupies that
register.

Victory quips: §5.4's register, with room for the joke §1.4 sets up — the thing drops
**Stonetouch** weapons and **Stone Ward** armour, the exact counter to its own Stone Gaze,
*after* the fight.

`post` must contain `results()`. Run `lintScript()` in the chapter's own unit test
(60-character line cap, one ellipsis per line, no space before an ellipsis).

---

## 8. File plan, owners, and the order of work

Nine tracks. **Six can run in parallel; three shared files need a single integrator.**

### 8.1 Shared files — ONE integrator, last

| File | Why it is shared |
|---|---|
| `src/data/encounters.ts` | Contract file. The new `ChapterId`, the `Chapter` record, `CHAPTERS`, `CHAPTER_IDS`. `tools/critic-plan.mjs` classes it as "chapter registry or a new chapter is a shared system" → **DEEP review before going public** |
| `src/data/chapter-meta.ts` | One `ChapterMeta` entry; `tests/unit/chapter-meta.test.ts` asserts one entry per chapter, in order, with a 2–4-word subtitle, a two-sentence blurb, a 4–6-word handwritten aside and an under-18-word original quote |
| `src/battle/common/types.ts` | Contract file. `CombatantFlags.nonCombatant`, `CombatantFlags.rangedWeapon`, the `'long-range'` doc comment. **One `docs/CONTRACT-CHANGES.md` entry covering all three** (hard rule 2) |
| `src/scenes/index.ts` | The `SCENE_FACTORIES` registration and the `SCENES` table entry |
| `src/engine/tactics/index.ts` | The tactic registration |
| `src/audio/tracks/index.ts` + `docs/audio/THEMES.md` | Two new `MusicKey`s and two new cue-map rows |
| `docs/handoff/NOW.md`, `docs/target/targets.json` | Every session touches these; the integrator writes them once |

**Everything else is single-owner.** Note that `CHAPTER_IDS` is a 1–5 literal union on
`Chapter.number` — widening it to 6 is part of the integrator's contract edit, not a builder's.

### 8.2 Parallel tracks

| Track | Owner's files (nobody else touches them) | Depends on |
|---|---|---|
| **T1 — Engine capabilities** | `src/battle/ffx/targeting.ts` (+`reachesAtRange`), `engine.ts` (checkEnd filter, status-add collection), `ai/reactions.ts` (signature), `commands.ts` + `execute.ts` (trigger dispatch) | The integrator's `types.ts` edit **first** |
| **T2 — Enemy data** | `src/data/ffx/enemies/evrae.ts`, `evrae-abilities.ts` | T1's flags existing as types |
| **T3 — AI script** | `src/battle/ffx/ai/evrae.ts`, `ai/index.ts` registration, the `scripted.ts` keys | T1, T2 |
| **T4 — Party build** | `src/data/ffx/builds/fahrenheit.ts` | nothing |
| **T5 — Scene** | `src/scenes/fahrenheit.ts`, `fahrenheit-debug.ts` | **O-1 + O-2 approved** |
| **T6 — Story** | `src/story/scripts/evrae.ts`, the writing-bible E-tag | nothing (beats are §7) |
| **T7 — Tactic / guide** | `src/engine/tactics/evrae.ts` | T1, T2, T3 |
| **T8 — Audio** | `src/audio/tracks/scene-fahrenheit.ts`, `boss-evrae.ts` | **O-5 auditioned and picked** |
| **T9 — Tests** | `tests/unit/evrae-*.test.ts`, `tests/unit/strategy-evrae.test.ts` | T1–T4, T7 |

### 8.3 Order of work

```
NOW  ── Bailey answers Q11 (does the airship name the chapter?)
     ── O-1 … O-5 go out as options rounds        [hard rule 9: nothing perceivable is built]

THEN ── integrator: types.ts + CONTRACT-CHANGES.md      (one commit, alone in the tree)
     ── T1 engine capabilities                          (blocks T2, T3, T7)
     ── T4 party build │ T6 story                       (parallel, start immediately)

THEN ── T2 enemy data → T3 AI script → T7 tactic        (a chain)
     ── T5 scene │ T8 audio                             (start on Bailey's picks)

THEN ── T9 tests, then the integrator wires encounters.ts / chapter-meta.ts /
        scenes/index.ts / tactics/index.ts / tracks/index.ts / THEMES.md in ONE commit
     ── node tools/orphans.mjs                          (hard rule 4 — a green suite does not catch this)
     ── DEEP review before deploy (critic-plan says so; confirmed by running it)
```

**Shared-tree discipline** (AGENTS.md): stage only your own paths, never `git add -A`, never
`checkout` / `restore` / `reset` / `stash` / `clean`, and read the handoff note before
touching a file someone else has modified.

---

## 9. Acceptance cases

Modelled on `tests/unit/strategy-seymour-flux.test.ts` and `tests/unit/chapter-meta.test.ts`,
which are the shipped pattern.

### 9.1 Seeded verifiers

| # | Case | Assertion |
|---:|---|---|
| A1 | **Seeded win.** The shipped `intendedStrategy` against the real engine and real data, headless | `result === 'victory'`, Evrae at 0 of 32,000, no thrown error, event log monotonic (`log[i].seq === i`) |
| A2 | **Seeded loss.** A *credible mistake*, not a null strategy: **the party stays NEAR the whole fight and never issues an order** — the natural first-timer line | Reliable defeat. If this wins, the fight has no teeth and the range mechanic is decorative. This is the single most diagnostic test in the chapter |
| A3 | **Second credible mistake:** phase 2, FAR, the party keeps attacking during an Inhale | Evrae Swoops, range flips to NEAR, the breath resolves, and the log shows it — §4.5's trap firing as designed |
| A4 | **Target win rate: 40 contiguous seeds, ≥ 90%** with the intended line | The project's bar. Chapter 1 shipped at 73% and reported it as short; **this chapter's line is simpler and should clear 90%**. If it does not, report the number and what caps it, per the Chapter 1 precedent — do not tune the boss (`memory: boss-side-fix-needs-measured-options`) |

### 9.2 Mechanic units (each one pins a research claim)

| Claim | Test |
|---|---|
| Missile economy | Exactly 3 volleys; the 4th FAR unordered turn announces out-of-ammo **once**; every later one is a silent skip |
| Order cost | An order consumes Cid's turn and **no volley fires that turn**; two orders before Cid acts collapse to the last one |
| The dodge | Inhale at NEAR + an order that lands before the breath ⇒ `"Out of breath range."`, zero damage, `breathCharged` cleared |
| Reach | At FAR, exactly **Blk Magic, Wakka's Attack and Lancet** are `enabled`; Tidus/Auron/Kimahri Attack, Steal and offensive Use are disabled with `'Out of reach'`. At NEAR everything is legal |
| Buffs at range | Cheer, Focus, Haste, Protect and **Al Bhed Potion** are legal at FAR — the asymmetry §4.3 says not to smooth |
| Haste threshold | Crossing 10,667 (**including by Guided Missiles**) fires the self-Haste; recovery 30 → 15 **and** the pending counter halves |
| Counter-Haste | Slow landing on a Hasted Evrae ⇒ immediate counter-Haste (**the E-5 status hook**) |
| Shatter chain | Stone Gaze petrifies at 100; Swooping Scythe shatters at 50; the shattered member is Ejected and the **bench slot is gone** |
| Stone Gaze | Deals **zero** HP damage; applies petrify and slow |
| Photon Spray | 8 hits, each re-rolling its target, each rolling its own damage RNG |
| Darkness | Blanks **Attack**; does **not** blank Swooping Scythe |
| Poison | Immune on Evrae (Bio and Poison Fang do nothing); `maxHp // 4` per turn on characters |
| Delay | Delay Attack `+15`, Delay Buster `+30` — the only boss in the set |
| **Reflect (C-14)** | Reflect on Evrae ⇒ its self-Haste bounces onto a random **living party member**. Pins the behaviour `reflectBounceTarget` already produces |
| **Stone Gaze Slow (C-8)** | Lands through Slowproof and Ribbon; **blocked** by Auto-Haste |
| Summon absent | `availableCommands` for every member contains **no `category: 'summon'` row at all** — not a disabled one |
| Cid | Never in `validTargets` for any command; never blocks victory; appears in `predictTurnOrder` and **ranks last on a tie** |
| Sensor / Scan | Both work on Evrae (neither immunity flag set) and **both** are immune on Cid |

### 9.3 Game-specific absence tests (hard rule 14, CHK-021)

Every FFX-only rule gets a test that it is **absent** from FFX-2:

- No FFX-2 chapter's `BattleState.flags` ever carries `airship:*`.
- `reachesAtRange` is not reachable from `src/battle/ffx2/**` (an import-graph assertion;
  `node tools/orphans.mjs` will not catch this).
- The two new trigger ids appear in no FFX-2 data file.
- `'long-range'` keeps its FFX-2 meaning: **re-run the existing FFX-2 tests unchanged** and
  assert the Chapter 4 and 5 fixtures are byte-identical before and after the flag's doc change.
- `CombatantFlags.nonCombatant` and `rangedWeapon` are set by no FFX-2 record.
- **Regression guard on the counter hook (E-5):** the Chapter 1, 2 and 3 event logs at a fixed
  seed are identical before and after the `status-add` collection lands. This is shared FFX
  plumbing and the cheapest possible proof that nothing else moved.

### 9.4 Real-input route, chapter select to results

One browser pass, `PYREFLY_BROWSER=gpu`, the fight on a real clock
(`page.waitForTimeout`, never a fake one):

Title → chapter select (the new card is present and reachable **by keyboard**) → party prep
(**no Summon tab, no aeons**; the six-member roster switches) → pre-cutscene → battle:
**issue a Pull back with a real key press, watch Cid's CTB row carry the queued-order marker,
watch the volley land, watch a Poison Breath whiff** → phase 2 → victory → post-cutscene →
results → back to chapter select. Zero console errors, zero 404s, screenshots under
`docs/screenshots/`.

**Plus the target-versus-build pairs** for every tile Bailey approves out of §6, via
`node tools/end-state-board.mjs --pair <target> <build>`. The approved-target comparison is a
**gate**, not a score (`critic/RUBRIC.md`).

### 9.5 Evidence that stays reusable

The engine changes are additive and inert outside this chapter, so **Chapters 1–5's existing
deep-review evidence stays valid** provided §9.3's regression guards pass. That is the
argument for the shape of every change in §4: each one is a new optional field or a new
argument that existing callers ignore.

---

## 10. Size estimate and risks

### 10.1 Size — 9 agent-tracks, plus art and audio

| Track | Size | Model |
|---|---|---|
| Integrator (contract edits, the wiring commit) | 0.5 | opus — judgement, touches five shared files |
| T1 engine capabilities | 1.5 | opus — five seams in shared FFX plumbing |
| T2 enemy data | 1.0 | sonnet — well-specified transcription with citations |
| T3 AI script | 1.5 | opus — the phase machine, the counters, the missile economy |
| T4 party build | 0.75 | sonnet |
| T5 scene | 1.0 | sonnet, **after** the art picks |
| T6 story | 0.75 | sonnet |
| T7 tactic / guide | 1.0 | opus — §4.5's "the correct play is to do nothing" is genuinely hard to encode |
| T8 audio | 1.0 | sonnet, **after** the audition pick |
| T9 tests | 1.5 | sonnet for the mechanic units, opus for the 40-seed harness |
| **Total** | **~10.5 agent-tracks** | |

Plus, outside the track count: **five options rounds** (§6), the art generation once Bailey
picks, and a **deep review before going public** — `node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/ffx/engine.ts` returns:

```
review:       DEEP  (deep evidence is required BEFORE deploying)
because:      src/data/encounters.ts: chapter registry or a new chapter is a shared system
because:      src/battle/ffx/engine.ts: FFX CTB engine is a shared system
checks:       CHK-011 CHK-016 CHK-017 CHK-020 CHK-021 CHK-022 CHK-023
```

**This chapter cannot be deployed without a passing deep report** — `npm run deploy` refuses a
shared-system change that has none.

**Comparable:** this is the largest single chapter in the anthology by new-engine surface, and
the second largest by art. Chapter 5 has more formations; this one has more *rules*.

### 10.2 Risks, worst first

| # | Risk | Mitigation |
|---:|---|---|
| **R1** | **The order widget is wrong at high fidelity.** A still mockup can look right and feel wrong to click — precisely the failure the "raise the fidelity" rule names. The chapter's whole interface invention rides on it | O-3 gets a **minimal interactive prototype** if the mockups do not settle it. It is the one place on the ladder where that spend is justified |
| **R2** | **The fight is unwinnable or trivially winnable, and we find out at the 40-seed test.** Q4's assumed ranks are the number the difficulty is most sensitive to, and they are **`[estimate]` with no source at all** | Make rank, redundant-order cost and the aggro threshold **named tunables from day one**. Measure before tuning. **Never weaken the boss to fix it** — build and measure each answer and bring Bailey measured options |
| **R3** | **The engine changes leak into FFX-2.** Five seams in shared FFX plumbing, two of them in contract files | §9.3's absence tests, and the byte-identical regression guard on Chapters 1–5's event logs at fixed seeds |
| **R4** | **Presenting "do nothing" well.** §4.5's best rule requires the UI to make restraint legible, and no chapter has needed that before | O-3 and O-4 together. If neither answers it, that is a PIVOT signal for the chapter's *presentation*, not for its mechanics |
| **R5** | **Photon Spray's 8 retargeting hits** are a presentation problem — eight damage numbers across three actors in one action | `damage` events already carry `hitIndex` / `hitCount` for the ladder; verify the HUD handles three concurrent ladders before the scene track finishes |
| **R6** | **The parallax layer must change speed on a manoeuvre** (§12.3) and I did not verify `src/engine/Backdrop.ts` can drive a layer's speed at runtime | A one-hour read at the top of T5, before any painting is commissioned against the assumption |
| **R7** | **No writing-bible E-tag** (Q12). Every other chapter had a canonical beat map to build against | §7 is the beat sheet; T6 adds the E-tag as part of its work |
| **R8** | **Usage.** ~10.5 tracks plus five options rounds plus a deep review is a large program, and NOW.md reports **NORMAL mode, ~66% of the weekly allowance left**, resetting 2026-09-26 | Sequence it: options rounds first (cheap, and they block everything perceivable), engine and data next, art and audio only after the picks. Check the allowance before the fan-out |
| **R9** | **Machine.** NOW.md: D: is flagged dirty, RAM is running XMP past AMD's limit, boot-time chkdsk scheduled. In-place file corruption is a live risk | Commit early and often; do not start a long art run until the BIOS work is done |

---

## 11. Verdict

# PROCEED

The research is the strongest in the corpus — decompiled primary data, a PS2/HD byte diff, an
18-row verification log, and a seven-defect fact-check the author re-verified from primary
sources rather than accepting on the checker's say-so. The encounter has a real thesis (*the
turn you do not spend is the turn that does the most damage*), a register no other chapter
occupies, and a mechanic that earns two of the approved presentation goals honestly rather
than decoratively.

The engine is in better shape than research §11's twenty-one-item list suggests: **eleven of
those mechanics already work**, one of them (C-14's Reflect bounce) already produces the
derived behaviour the research flagged as unverified, and the five real gaps resolve to **two
optional fields on one contract file, one doc-comment amendment, one dispatch de-hardcoding,
and four lines in `engine.ts`**. Nothing needs `Side` widened, nothing needs a new
`BattleEvent`, and nothing needs a new `Command` kind.

**Three things are settled before the first line of code:**

1. **Bailey answers Q11** — does the airship name the chapter, or the wyrm? It shapes the
   card, the music brief and the options rounds, and it is one line to answer.
2. **O-1 through O-5 go out and come back picked.** Hard rule 9. The scene, the audio and the
   order widget are all blocked on them, and the order widget (R1) is the chapter's highest
   risk. Nothing perceivable is built first.
3. **The integrator lands the `types.ts` edits and the `CONTRACT-CHANGES.md` entry alone in
   the tree**, before T1 starts. Two optional flags and one doc comment, one commit, so the
   six parallel tracks compile against a settled contract.

The data tracks (T2, T4, T6) and the engine track (T1) can start the moment item 3 lands;
they need nothing from Bailey.

---

*Preflight only. No code, no browser, no build. The only file this work commits is this one.*

---

## Addendum, 2026-09-23 — the integrator's paper check (rule 15, DEEP)

Written during the registration pass (`docs/handoff/chapter-evrae.md`), after
`node tools/critic-plan.mjs --paths` classed the change DEEP (chapter registry;
FFX CTB engine). **Game case: FFX only** for everything the player can see
change; the three shared files below are touched behind a gate only the Evrae
encounter opens.

| Shared file | What changes | Why it cannot move another chapter | Proof |
|---|---|---|---|
| `src/data/encounters.ts` + registries | `evrae-airship`, number 8, additive | the lock set keeps it off chapter select; every generic suite now walks it | full `npm test`; `trigger-commands`, `audio-story-cues`, `story-triggers` |
| `src/ui/ffx/FFXBattleHud.ts` | the menu call goes through `AirshipOrders.choose`; chip docking after CTB renders; the widget abandoned on `action-start` / result | `choose` returns `openMenu(commands)` untouched unless `flags['airship.range']` is `near`/`far`, a flag only `evrae-rules.ts` sets | `ui-ffx-airship-orders.test.ts` "passes every other battle straight through"; `ui-ffx-hud.test.ts` green |
| `src/app/screens/BattleScreen.ts` | one optional hook, `attachAirshipBattle` | returns `null` unless the scene published a range director (only `evrae-airship-deck.ts` does) | the other seven chapters' real flows are unchanged in the full suite; one GPU browser pass on Evrae |
| `src/battle/ffx/ai/index.ts` | the two order triggers emit a `message` when queued | handlers keyed by `pull-back` / `close-in`; no RNG draw, so no measured number moves | `strategy-evrae.test.ts` (A-1..A-3) green; `trigger-commands.test.ts` found the silent row |

Risks carried to the deep review: the `Orders` fold is a reading of option A
(A draws the two rows straight in the cascade); Cid is removed from the stage
on this scene only (F-1's presenter-wide rule is still open); the range move
starts with the burst, not after the "pulls back" line is read.
