# FINAL FANTASY X — Evrae (deck of the *Fahrenheit*, approach to Bevelle): Implementation Reference

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Encounter:** proposed new FFX chapter — **Evrae, guardian wyrm of Bevelle**, fought from the open deck of the airship *Fahrenheit*
**Research date:** 2026-09-19
**Bestiary entry:** #097 Evrae. Internal ids: **Evrae `m119`**, **Cid `m149`** (an invisible third combatant with his own CTB icon)

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

Identical vocabulary to `research/ffx-seymour-flux.md` §0.1 and `research/ffx2-bahamut.md`, so the ten documents can share one schema.

| Tag | Meaning |
|---|---|
| `[decompiled]` | Byte-level value read directly out of the game's `ffx_mon_data` / `ffx_monmagic1` / `ffx_monmagic2` / `ffx_command` tables via the Grayfox96 FFX-RNG-Tracker data files, parsed with that repository's own field offsets. Highest confidence available short of running the game. |
| `[verified: 2 sources]` | Two independent sources agree. |
| `[single source]` | One source only. |
| `[derived]` | Computed by me from `[decompiled]` constants using the decompiled damage formula, or deduced from decompiled flags, and cross-checked against at least one guide where one exists. |
| `[estimate]` | Authored design judgement. Not a measured fact. Must be labelled as such in-product. |

### 0.2 What I actually did

1. Read `research/ffx-seymour-flux.md` (format and quality bar), `research/ffx-combat-core.md` §1 (CTB), §2 (damage formulas), §4 (statuses), and `research/visual-bible.md` §2.x (location sheets) and §3.12 (Trigger Command prompt widget) before writing a line. **The Trigger Command widget in the visual bible is specified for exactly two flavours — a pre-battle Talk and an in-battle Talk with a charge counter. This encounter needs a THIRD flavour (a persistent two-state toggle issued to a non-controllable ally). That is a real gap; see §11 item 17 and §10 C-11.**
2. Pulled `ffx_mon_data.csv`, `ffx_mon_data_hd.csv`, `ffx_monmagic1.csv`, `ffx_monmagic2.csv`, `ffx_command.csv`, `monster_actions.json`, `items.csv`, `characters.json` and the matching `monsters.py` / `actions.py` / `constants.py` field offsets from `Grayfox96/FFX-RNG-tracker`, reconstructed the package locally and parsed Evrae (`m119`), Evrae Altana (`m120`) and Cid (`m149`). This is the authoritative layer.
3. **Diffed the PS2 and HD monster tables byte for byte for Evrae.** They differ in exactly **one** byte, index 403, which is not read by any parsed field (`0` on PS2, `20` on HD; `402` is the Zanmato byte and is `3` in both). **Every mechanically meaningful value in this document is identical in both releases.** `[decompiled]`
4. Cross-checked against the Final Fantasy Wiki (fetched through the MediaWiki `action=parse&prop=wikitext` API with a browser user agent — the plain HTML endpoint and the API through the default fetch path both return HTTP 402), GamerGuides and Jegged.
5. Re-implemented the decompiled damage formula and computed the tables in §7. They reproduce the qualitative claims of all three guides (Guided Missiles as the single biggest hit in the fight; Photon Spray as chip damage; Swooping Scythe as "relatively weak"; the melee attack as the thing that kills you).

### 0.3 The three corrections the brief needs

| # | Brief said | Actually |
|---|---|---|
| **A** | "Tidus and Rikku talk to Cid: **Pull Back** / **Move In**" | Correct, and confirmed by three sources. Recorded verbatim in §4.2 with the caveat that the exact on-screen casing is not established (§10 C-9). |
| **B** | "the airship's **missile volleys** (damage, number of uses)" | Correct and real: **Guided Missiles**, Cid's only action, **three uses**, then he announces he is out of ammunition. But they are **not** a player command — Cid fires them *automatically* on his own turn **only when the ship is FAR and no manoeuvre order is queued**. The player buys them by choosing not to give an order. §4.6. |
| **C** | "statuses that work on it (Slow, Dark, **poison?**)" | **Poison does not work.** Evrae's Poison resistance byte is **255 = flat immune**, and its poison-tick percentage byte is **0**, so even a hypothetical landed Poison would tick for zero. Slow (50) and Dark (50) *do* land, and both are load-bearing. §1.3. |

### 0.4 FFX-only fence (owner's rule of 2026-09-19)

Everything in this file is **FFX-specific and must not leak into the FFX-2 chapters**: the CTB clock, ranks and the turn-order forecast; Trigger Commands; Sphere Grid progression; Overdrive gauges and modes; aeons; the Al Bhed Potion / Use economy; Cheer and Focus; Break statuses; and above all **the airship distance mechanic, which has no X-2 counterpart.** X-2 is ATB + dresspheres + chain, and its equivalent of "the arena has a second axis" is the Garment Grid, not a range toggle. If a presentation change in this chapter (a turning arena, a pane break, a queue preview) is judged good, it gets an X-2-native re-derivation before it appears in an X-2 chapter — it does not get copied across.

---

## 1. Enemy stat block — Evrae (`m119`, bestiary #097)

### 1.1 Core stats

| Field | Value | Confidence |
|---|---:|---|
| HP | **32,000** | `[decompiled]` + wiki + Jegged `[verified: 2 sources]` |
| MP | **500** | `[decompiled]` + wiki |
| Overkill threshold | **2,000** | `[decompiled]` + wiki `[verified: 2 sources]` |
| Strength | **36** | `[decompiled]` + wiki |
| **Defense** | **0** (the formula clamps the divisor to 1; the wiki prints "1") | `[decompiled]`, wiki prints 1 |
| Magic | **30** | `[decompiled]` + wiki |
| **Magic Defense** | **0** (same clamp; wiki prints "1") | `[decompiled]`, wiki prints 1 |
| Agility | **20** | `[decompiled]` + wiki `[verified: 2 sources]` |
| Luck | **15** | `[decompiled]` + wiki |
| Evasion | **0** | `[decompiled]` + wiki |
| Accuracy | **100** | `[decompiled]` + wiki |
| AP (normal kill) | **5,400** | `[decompiled]` + wiki `[verified: 2 sources]` |
| AP (overkill) | **8,100** | `[decompiled]` + wiki |
| Gil | **2,600** | `[decompiled]` + wiki |
| Armored | **No** | `[decompiled]` |
| Zanmato level | **3** (byte 402) — wiki says 4 | `[decompiled]` vs wiki, **conflict C-3** |
| Doom turns | **30** (byte 119) — wiki says 20 | `[decompiled]` vs wiki, **conflict C-3** |
| Poison tick % | **0** | `[decompiled]` |
| Ronso Rage (Lancet) | **None** — `ronso_rage_id = 0`. Kimahri learns nothing from Evrae. | `[decompiled]` |

> **The most important line in this table is Defense 0 / Magic Defense 0 — but it is not a superlative.** Defense byte 0 is the *default* in this game's monster table, not a distinguishing property of Evrae: **217 of the 343 PS2 monster records carry Defense byte 0, and 82 of the first 120 indices do.** Among bosses the player meets *before* Evrae, **Seymour (`m124`) is Defense 0** (Magic Defense 25) and **Anima (`m125`) is Defense 0 / Magic Defense 0** — identical to Evrae, and both are the bosses of the sibling Macalania chapter being written in this same batch. `[decompiled]`
>
> What survives, and what the HUD recommendation actually rests on: `_get_mitigation(1) = 725` against a theoretical maximum of `730`, so **every point of player offence lands at essentially full value** (§7.4). **Evrae's difficulty is a 32,000 HP bar and its action economy, not armour.** Design consequence is unchanged: **do not let the HUD imply mitigation.** The honest read is "this thing has no armour and a lot of blood" — it is just not the *only* thing in Spira of which that is true.

### 1.2 Elemental affinities

| Element | Affinity | Multiplier |
|---|---|---:|
| Fire | **Resists** | ×0.5 |
| Ice | **Resists** | ×0.5 |
| Thunder | **Resists** | ×0.5 |
| Water | **Resists** | ×0.5 |
| **Holy** | **Neutral** | ×1.0 |

`[decompiled]` + wiki infobox (which prints all four as "Halves") `[verified: 2 sources]`.

**Two things follow, and they are in tension:**

- Evrae's own **Scan text says "No elemental weaknesses"** — true. But the wiki's battle section also states plainly that it "resists all elements." Both are consistent with the bytes. There is **no elemental puzzle** here and elemental weapon strikes are actively bad.
- **Lulu is halved on every offensive spell she owns at this point.** Holy is neutral but nobody has Holy yet. This is the one real design problem the chapter has to answer, because Lulu is also one of only three things that reach at long range (§4.3). See §8 row 6.

### 1.3 Status resistance table

Byte semantics: `0` = no resistance (the roll proceeds normally), `1–254` = percentage resistance, `255` = flat immune.

| Status | Value | Effect | Confidence |
|---|---:|---|---|
| **Slow** | **50** | **Landable.** Recovery ×2 (30 → 60 ticks) **and** +100% of the current counter on application. The strongest legal lever in the fight. | `[decompiled]` + wiki (`slow = 50`) `[verified: 2 sources]` |
| **Darkness** | **50** | **Landable.** Physical hit chance collapses to ≈10%. Blanks Evrae's melee **Attack** (`affected_by_dark = true`) but **NOT** Swooping Scythe (`affected_by_dark = false`). | `[decompiled]` + wiki (`blind = 50` / `darkness = 50`) `[verified: 2 sources]` |
| **Power Break** | **0** | **Landable.** Halves Evrae's physical damage output. Stacks multiplicatively with Darkness's miss chance and with Protect. | `[decompiled]`; wiki's immunity list omits it while listing Magic/Armor Break as immune `[verified: 2 sources]` |
| **Mental Break** | **0** | **Landable**, and **worthless** — it zeroes the defensive stat, which is already 0/1. Ship it as legal, expect ~0 benefit. | `[decompiled]` |
| **Threaten** | **0** | Byte reads landable, but party members can rarely land it and the wiki lists Threaten as **Immune**. Same shape of conflict as Seymour Flux C-2. **Do not let Threaten do anything until tested.** | **conflict C-4 — unresolved** |
| **Doom** | **0** (turns = 30) | Byte reads landable; wiki lists Doom as **Immune**. Even on the decompiled reading, a 30-turn Doom will never resolve inside this fight. Treat as functionally absent. | **conflict C-3** |
| **Reflect / Protect / Shell / Regen / Haste / NulAll / Scan** | **0** | **All landable on Evrae.** Reflect is the one that matters — see §6.5. | `[decompiled]` |
| Poison | **255** | **Immune.** Tick % is also 0. Bio and Poison Fang are dead commands here. | `[decompiled]` + wiki `[verified: 2 sources]` |
| Death | 255 | Immune | `[decompiled]` + wiki |
| Zombie | 255 | Immune | `[decompiled]` + wiki |
| Petrify | 255 | Immune | `[decompiled]` + wiki |
| Sleep | 255 | Immune | `[decompiled]` + wiki |
| Silence | 255 | Immune — **you cannot silence away its self-Haste** | `[decompiled]` + wiki |
| Confuse | 255 | Immune | `[decompiled]` + wiki |
| Berserk | 255 | Immune | `[decompiled]` + wiki |
| Provoke | 255 | Immune | `[decompiled]` + wiki |
| Magic Break | 255 | Immune | `[decompiled]` + wiki |
| Armor Break | 255 | Immune | `[decompiled]` + wiki |
| Eject | 255 | Immune | `[decompiled]` + wiki |
| Auto-Life | 255 | Cannot be given Auto-Life | `[decompiled]` |

**Other immunity flags (bytes 40–41):** `immune_to_percentage_damage = TRUE` (**Demi does nothing** — wiki agrees, `demi = Immune`), `immune_to_slice = TRUE`, `immune_to_bribe = TRUE`. Critically, **`immune_to_delay = FALSE`**: Evrae *can* be delayed, which no other boss in the current five-chapter set allows. `immune_to_sensor` and `immune_to_scan` are both **false** — Sensor and Scan both work and both have real text. `[decompiled]`

### 1.4 Rewards

| Reward | Value | Confidence |
|---|---|---|
| Common drop | **Blk Magic Sphere ×1** (×2 on overkill) | `[decompiled]` + wiki + Jegged `[verified: 2 sources]` |
| Rare drop | Blk Magic Sphere ×1 (×2 on overkill) | `[decompiled]` + wiki |
| Drop chance | 255 (guaranteed) | `[decompiled]` |
| Common steal | **Water Gem ×1** | `[decompiled]` + wiki + Jegged `[verified: 2 sources]` |
| Rare steal | **Water Gem ×2** | `[decompiled]` + wiki |
| Steal base chance | 255 (guaranteed) | `[decompiled]` |
| Bribe | **Impossible** (`immune_to_bribe`) | `[decompiled]` |
| Equipment drop — **slots** | **1–3** (decompiled `slots_modifier = 10` → the eight RNG rolls expand to `[1,1,2,2,2,2,3,3]`) | `[decompiled]` + wiki (`equip slot min 1 / max 3`) `[verified: 2 sources]` |
| Equipment drop — **ability rolls** | **1, always** (decompiled `max_ability_rolls_modifier = 12` → all eight rolls expand to `[1,1,1,1,1,1,1,1]`). **The wiki says `equip ability max 2`.** | `[decompiled]` vs wiki — **conflict C-18** |
| Equipment drop — **chance** | decompiled byte **255**; wiki prints **256** | `[decompiled]`, wiki off by one |
| Equipment drop — **abilities rolled** | weapon rolls **Stonetouch** (Auron/Kimahri roll **Piercing** in the first slot); armour rolls **Stone Ward** | `[decompiled]` |

> **The equipment drop is a joke the encounter is telling.** Evrae drops **Stonetouch** weapons and **Stone Ward** armour — the exact counter to its own Stone Gaze — *after* the fight is over. Worth a line of victory copy; worth nothing mechanically.

### 1.5 Scan / Sensor text (paraphrased — use as UI-copy inspiration, do NOT copy verbatim)

- **Sensor** (short form): it inhales before it breathes poison. `[single source: wiki]`
- **Scan** (long form): claims high magic defence; says there is no elemental weakness; warns that repeated melee attacks provoke the poison breath; and tells the player outright to ask Cid to pull the ship back so he will fire a missile volley. `[single source: wiki]`

**Two notes for the writer, both load-bearing:**

1. **The Scan text lies about Magic Defence.** It is 0/1. The wiki says so explicitly ("Although Evrae's Scan description mentions it having high Magic Defense, it is actually very low"). Our Sensor/Scan panel (visual-bible §4.11 / writing-bible §5.3) should reproduce the lie *and* let the player find out it is a lie — that is a better beat than quietly correcting it. Record it in the help window, not in the Scan panel.
2. **The Scan text says melee aggro leads to *Poison Breath*. The documented AI says the aggro counter leads to *Stone Gaze*.** These are not the same claim. Recorded as conflict **C-5**; do not resolve it by silently picking one.

---

## 2. Cid — the third combatant (`m149`)

Cid is **internally an invisible enemy** with his own CTB icon, not a party member and not directly controllable. The player influences him only through the Trigger Command. `[verified: 2 sources — wiki *Cid (Final Fantasy X boss)* page; `monster_actions.json` lists him as monster `m149` with exactly one action]`

### 2.1 Stats

| Field | Decompiled | Wiki | Note |
|---|---:|---:|---|
| HP | **410** | 410 | agree |
| MP | 1 | 1 | agree |
| Strength / Magic | 1 / 0 | 1 / 1 | the 0s clamp to 1 in the formula |
| Defense / Magic Defense | 0 / 0 | 1 / 1 | same clamp |
| **Agility** | **16** | **11** | **conflict C-6** |
| Luck / Evasion / Accuracy | 0 / 0 / 0 | 1 / 0 / 1 | cosmetic |
| Overkill threshold | 1 | 1 | agree |
| AP / Gil | 0 / 0 | 0 / 0 | agree |
| Doom turns | 3 | 3 | agree |
| Poison tick % | 25 | 25 | agree |
| `immune_to_sensor` / `immune_to_scan` | **TRUE / TRUE** | Immune / Immune | **he cannot be scanned — he is not meant to be seen as an enemy** |
| Provoke / Eject / Auto-Life / Bribe | Immune | Immune | agree |

**Implementation consequences.**
- Cid occupies a CTB slot and **must appear in the turn forecast**. `research/ffx-combat-core.md` §1.6 already ranks him last in the tie-break order ("… enemies → **Cid (lowest)**") — that rule exists for this fight and the Sin-fins fight, and it is already in our core. Good.
- At **Agility 16** his base tick is **12** (§5.1 table); at the wiki's 11 it is **14**. At rank 3 that is a recovery of **36** vs **42** — a visible difference in how often the ship can change state, so C-6 is worth one in-game check.
- He is targetable in the data but **not targetable in practice** (invisible). Do not build a targeting path to him. Do not let an AoE hit him. His 410 HP is an artefact.

### 2.2 Guided Missiles — exact

Decompiled action `ffx_monmagic2 #115`, assigned to `m149` with target **`M1`** (monster slot 1 = Evrae).

| Field | Value |
|---|---|
| Damage formula | **Fixed** |
| Base damage | **4** |
| Hits | **12** |
| `long_range` | **true** |
| Hit chance | **Always Hits** |
| Elements / statuses | none |
| Rank | 3 |

`Fixed` resolves as `damage = base × 50 × (damage_rng + 0xf0) / 256` per hit (`research/ffx-combat-core.md` §2.7).

| | per hit | ×12 hits |
|---|---:|---:|
| min (`rng = 0`) | 187 | **2,244** |
| mid (`rng = 16`) | 200 | **2,400** |
| max (`rng = 31`) | 211 | **2,532** |

`[derived]` from `[decompiled]` constants.

**Three volleys ≈ 7,200 damage ≈ 22.5 % of Evrae's HP bar.** That is the largest single damage source available to the player in the whole encounter, and it costs **zero party turns**. This is the fight's central bargain and the chapter's whole thesis: *the turn you do not spend is the turn that does the most damage.* `[derived]`

- **Fixed damage ignores Defense entirely**, so it is unaffected by anything.
- **It is non-elemental**, so Evrae's ×0.5 does not apply.
- It can trigger the 1/3-HP Haste threshold. The wiki warns about exactly this: missiles "can trigger Haste as well if Evrae's HP is reduced to 1/3 by them." `[single source: wiki]`

### 2.3 What Cid does on his turn (decision order)

```
cidTurn():
  if (queuedOrder !== null):           // set by a Trigger Command since his last turn
      applyOrder(queuedOrder)          // ship moves; state flips to NEAR or FAR
      queuedOrder = null
      return
  if (shipState === FAR && missilesLeft > 0):
      missilesLeft -= 1
      return castGuidedMissiles(EVRAE)
  if (shipState === FAR && missilesLeft === 0):
      return announceOutOfAmmo()       // once, then silent skips
  return doNothing()                   // NEAR with no order: he just flies
```

`[verified: 2 sources — wiki ("When the ship is away from Evrae and Cid does not have a command queued, he uses the ship's Guided Missiles attack… although this can only be performed three times"); an independently surfaced restatement adding "Once all three Guided Missiles attacks have been used, Cid will tell the party that they are out of ammo, and his subsequent turns will be skipped should Tidus or Rikku not give him any commands")]`

**The order-vs-missile exclusivity is the rule the whole fight turns on.** A manoeuvre order **consumes Cid's turn**, so **every course change costs you a missile volley you could have had.** Do not implement the order as free.

---

## 3. Exact action data (decompiled action-table rows)

### 3.1 Evrae's action list (`m119`)

All eight rows, exactly as `monster_actions.json` assigns them.

| Action | File/ID | Target | Formula | Base | Hits | Acc | Statuses | Notable flags |
|---|---|---|---|---:|---:|---:|---|---|
| **Attack** (melee) | 4 / 127 | Random Character | Strength | **16** | 1 | **120** | — | `can_crit`, **`affected_by_dark`**, shatter 10, `long_range = false` |
| **Swooping Scythe** | 6 / 91 | Characters' Party | Strength | **8** | 1 | **100** | — | **`long_range = true`**, **shatter 50**, `affected_by_dark = false`, no crit |
| **Poison Breath** | 6 / 97 | Characters' Party | Magic | **36** | 1 | — | **Poison @ 100 %** | Always Hits, `long_range = false` |
| **Stone Gaze** | 6 / 98 | Random Character | Magic | **10** | 1 | — | **Petrify @ 100 %**, **Slow @ 255 (stacks 100)** | **`damages_hp = false`, `damages_ctb = true`** — it does **no HP damage** |
| **Photon Spray** | 6 / 99 | Random Character | Magic | **3** | **8** | — | — | Always Hits; **8 hits, each re-rolling its target** (see §3.3 note 5) |
| **Inhale** | 6 / 100 | Self | No Damage | 0 | 0 | — | — | the **Poison Breath charge turn** |
| **Out of breath range.** | 6 / 101 | Self | No Damage | 0 | 0 | — | — | the **whiff message** when Poison Breath is dodged |
| **Haste** | **3** / 54 | **Counter Self** | CTB | **8** | 1 | — | **Haste @ 254** | `heals`, `affected_by_reflect`, `affected_by_silence`, `long_range`, rank **4**, MP 8 |

`[decompiled]`. Every ability name is independently confirmed by the wiki's Evrae infobox ability list, which enumerates the same eight. `[verified: 2 sources]`

### 3.2 Cid's action list (`m149`)

| Action | File/ID | Target | Formula | Base | Hits | Notes |
|---|---|---|---|---:|---:|---|
| **Guided Missiles** | 6 / 115 | **M1** (Evrae) | Fixed | 4 | 12 | `long_range`, Always Hits |

`[decompiled]`. **The manoeuvre itself has no action row.** "Move In" / "Pull Back" are script effects, not table entries — which is why their rank is not in the data and has to be assumed (§10 C-7).

### 3.3 Notes on the five weird rows

**1. Evrae's Haste is a `Counter Self`, not a scheduled turn.** `[decompiled]` It therefore does **not** consume one of Evrae's action slots, and it can fire out of turn order. It is the **player's** Haste spell row (`ffx_command.csv` #54), which means it carries the full player-Haste semantics from `ffx-combat-core.md` §1.4: **recovery `floor(/2)` AND the pending counter is instantly halved.** Evrae's recovery goes **30 → 15** and its next turn jumps forward the moment it casts. Implement both halves or the phase change will feel flat.

**2. Stone Gaze does no damage at all.** `damages_hp = false`, `damages_ctb = true`. Its entire payload is **Petrify at chance 100** plus **Slow at chance 255**. The wiki adds a rule the bytes cannot express: **this Slow bypasses Slowproof and Ribbon**, and the only things that stop it are **SOS Haste / Auto-Haste** (because Haste and Slow are mutually exclusive and a stack-255 Haste cannot be displaced — `ffx-combat-core.md` §1.4). `[single source: wiki]` — flagged as **C-8**, because it is a deliberate exception to our own status model and a test fixture either way.

**3. Petrify here is a kill, not an inconvenience.** Petrify wipes all other statuses, the victim cannot act, and **a physical hit afterwards shatters them into Eject** (`ffx-combat-core.md` §4.2). Evrae's own **Swooping Scythe carries `shatter_chance = 50`** and hits the **whole party** — so the sequence *Stone Gaze → Swooping Scythe* is a coin-flip permanent removal of a party member **and their bench slot**. The melee **Attack** carries `shatter_chance = 10`. This is the encounter's real lethality, and it is invisible unless the HUD says so.

**4. `Inhale` and `Out of breath range.` are a matched pair — the telegraph and the whiff.** `Inhale` is a no-damage self-targeted turn that exists purely to give the player one turn of warning; `Out of breath range.` is a second no-damage self-targeted row that fires **in place of** Poison Breath when the ship has moved away in the interval. The enemy-abilities master table describes them exactly that way: *Inhale* "Charges for **Poison Breath**", *Out of breath range.* "Signifies evading Poison Breath." `[verified: 2 sources — decompiled rows + wiki *Final Fantasy X enemy abilities* master table]`

> This is a gift to the presentation layer. The game already ships **a named, visible, one-turn telegraph and a named, visible whiff**. Our enemy-telegraph banner (visual-bible §3.13) has a real second customer, and the whiff line is a free celebration beat — the player *earned* that message by spending a turn on a Trigger Command instead of on damage.

**5. Photon Spray is 8 separate hits, each re-rolling its target.** Do not implement it as one 8× multiplier on one victim.

**Correction to an earlier draft of this section:** the decompiled target field is `Random Character` (singular) — `monster_actions.json` assigns `m119` action 6/99 the target string `Random Character`, and `TargetType` has **no plural "Random Characters" member** for monster actions. The per-hit retargeting is therefore **not** readable off the target byte; it comes from the guides. `[decompiled]` for the 8-hit count; `[verified: 2 sources — wiki "a weaker Photon Spray attack on the party"; GamerGuides "hits 8 times to random targets"]` for the per-hit retargeting. Each hit also rolls its own damage RNG `[derived]`.

### 3.4 Dummied content — do not implement

**"Critical Strike"** (`ffx_monmagic2` row 102) — Strength, base **16**, accuracy **90**, one character, physical, `affected_by_dark = true`, `shatter_chance = 0`. A near-copy of the ordinary Attack with worse accuracy (90 vs 120). `[decompiled]`

**Attribution** `[decompiled]`: `m120` (Evrae Altana) forced-action bytes 112–113 read `0x6066` → `>> 12` = action file **6**, `& 0x0FFF` = action **102**, i.e. **Critical Strike is Evrae Altana's Provoke-forced action**. Evrae's own forced-action bytes are `0x0000` → **"Does Nothing"**. The wiki attributes the dummied ability to **Evrae**. Either way it never fires (both monsters are Provoke-immune). **Do not ship it.**

> **Correction to an earlier draft.** This section previously asserted, under a `[decompiled]` tag, that Critical Strike **cannot crit**. **The byte says the opposite.** Row 102 byte 32 = `0x0D` = `0b00001101`, which per `data/actions.py` is `physical` **AND** `can_crit` (`& 0x04`) **AND** `adds_equipment_crit` (`& 0x08`). "Cannot crit" is purely the Fandom *Behind the scenes* note ("ironically, an inability to land critical hits"); the draft had laundered a wiki claim into the decompiled layer and then hung a tonal observation on it — the exact failure mode this document's house rules exist to prevent. **Recorded as conflict C-10b**, alongside the attribution conflict C-10. The recommendation not to ship it stands either way, so nothing downstream moves.

### 3.5 Appendix — Evrae Altana (`m120`) — reference only, NOT this encounter

The undead Evrae fought later in the flooded Via Purifico by Tidus, Wakka and Rikku. Included because a future chapter may want it and because it is the most likely thing to get confused with `m119`.

| Field | Value |
|---|---:|
| HP / MP | **16,384** / 200 |
| STR / DEF / MAG / MDEF / AGI / LUCK | 32 / 0 / 27 / 0 / **25** / 15 |
| Overkill / AP / Overkill AP / Gil | 2,000 / 5,800 / 8,700 / 3,000 |
| Elements | all neutral except **Holy: WEAK** |
| **Auto-status** | **Zombie** (it is undead — Phoenix Down and healing kill it) |
| Poison | Immune (255), but poison tick % = **25** |
| Doom | **Immune**, doom turns 3 |
| Steals | Water Gem ×2 / **Healing Spring** (rare) |
| Actions | Counter (STR 16, acc 90), Photon Spray (MAG base **4** ×8), Stone Gaze (MAG base 16, Petrify **50 %**, Sleep 50 %), Photon Spray (3rd encounter) (MAG 4 ×8) |
| Forced action (Provoke) | "Critical Strike" — unreachable, it is Provoke-immune |

`[decompiled]`. **Nothing from this table belongs in the airship fight.** Note in particular that Altana's Stone Gaze is 50 % Petrify + Sleep and *does* damage HP, where Evrae's is 100 % Petrify + Slow and does not.

---

## 4. THE DISTANCE MECHANIC — exactly

This is the reason to build the chapter, so it gets its own section rather than a paragraph inside the AI script.

### 4.1 The two states

The battlefield has **one boolean**: the *Fahrenheit* is **NEAR** Evrae or **FAR** from it. Everything else in the fight reads that boolean.

| | **NEAR** | **FAR** |
|---|---|---|
| Battle opens in | **NEAR** `[single source: Jegged, whose first instruction is "Start by moving the ship away"]` | — |
| Evrae's status | ordinary | gains **Long Range** (the wiki states it as an info line on the enemy: "Becomes Long Range when the Airship is pulled back") |
| Evrae's damaging actions | **Attack** (melee), **Poison Breath**, **Stone Gaze** | **Photon Spray** only (+ Swooping Scythe as a reaction, §5.5) |
| Player actions that reach | everything | **Blk Magic, Wakka's physical attacks, Lancet** — and nothing else |
| Cid's spare turn | does nothing | **fires Guided Missiles** (while ammo remains) |
| Poison Breath already charged | resolves | **whiffs — "Out of breath range."** |

`[verified: 2 sources — wiki Evrae page info line + battle section; GamerGuides *Aerial Battle*, which gives the identical reach list "Black Magic, Wakka's attacks and Lancet" and the identical far-state ability list]`

### 4.2 The Trigger Command — who, what, when

| Question | Answer | Confidence |
|---|---|---|
| Who can issue it | **Tidus and Rikku**, and only them | `[verified: 3 sources — wiki, GamerGuides, an independent restatement]` |
| What the options are | **Move in** and **Pull back** | **Split.** *Pull back*: `[verified: 2 sources — wiki gallery caption "Evrae in the distance after using the **Pull Back** trigger command (HD Remaster)"; GamerGuides "You can issue Cid to either **Move in** or **Pull back**"]`. *Move in*: `[single source: GamerGuides]` |
| How it is issued | as a **Trigger Command on that character's own turn** — it costs **that character's turn** | `[single source: GamerGuides/wiki phrasing "who have access to a Trigger Command"]`, **C-7** |
| When it takes effect | **on Cid's next turn**, not immediately — "he executes the last command received" | `[verified: 2 sources — wiki; GamerGuides "which will be done on Cid's turn"]` |
| How many turns the manoeuvre takes | **one of Cid's turns**, and it **replaces** his Guided Missiles for that turn | `[verified: 2 sources]` |
| Order queuing | **last order wins.** Two orders issued before Cid acts collapse to one. | `[single source: wiki, "executes the **last** command received"]` |
| Redundant orders | ordering "Move In" while already NEAR still consumes Cid's turn | `[derived]` — **C-7**, verify |

> **Correction to an earlier draft.** The options row previously carried `[verified: 2 sources]` with the wiki's **Scan text** as the second source. **The Scan text does not support the claim it was attached to** — it reads only "Ask Cid to move the airship away and he'll launch a volley of Guided Missiles for you", and never names the Trigger Command options. Re-reading the whole Evrae article, the *only* place the wiki names an option is a **gallery file caption** ("…after using the Pull Back trigger command"), which attests **Pull back** and not **Move in**. Tag split accordingly above. The names themselves are cosmetic anyway (**C-9** — we write our own copy), but a two-source tag on a value one source does not state is the defect class this document is auditing for.

**So the true cost of one course change is: one party turn + one Cid turn + one forgone missile volley.** Three resources for one boolean flip. That is an unusually expensive and unusually legible decision, and it is exactly the kind of thing the "queue answers before you commit" presentation goal exists to surface.

### 4.3 What reaches at FAR — the player side

**Reaches:**

| Source | Why | Note |
|---|---|---|
| **Blk Magic** (Lulu) | every Blk Magic row carries `long_range = true` | but **halved** on all four of her elements (§1.2) |
| **Wakka's physical Attack** | Wakka's blitzball is a ranged weapon — a **character** property, not an action flag | the ordinary `attack` row is `long_range = false`; Wakka is the exception the engine must special-case |
| **Kimahri's Lancet** | `long_range = true` on the row (`ffx_command` Lancet, Magic base 6, rank **2**) | drains HP **and** MP; **no Ronso Rage to learn here** (§1.1) |

`[verified: 2 sources — wiki battle section "only magic, Lancet, and Wakka's physical attacks can reach Evrae"; GamerGuides "Black Magic, Wakka's attacks and Lancet"]`

**Does not reach:** Tidus, Auron, Rikku and Kimahri's ordinary attacks; Steal; Use (offensive items); any Overdrive that is a physical strike. `[derived]` from the same two statements.

> **Note the asymmetry, and do not smooth it.** Items and Wht Magic are irrelevant to reach because they target your own party. **Cheer, Focus and every buff still work at FAR.** So the FAR state is not a dead zone — it is the *setup* zone. Tidus stacking Cheer, Rikku queueing an Al Bhed Potion, Auron laying a Power Break on the way out — those all happen at range. This is the mechanical seed of "the queue answers before you commit."

**Open question worth a decision, not a guess:** whether Rikku's **Mix** and Tidus's **Slow** land at FAR. `Slow` and every Blk/Wht row carry `long_range = true`, so Slow should reach; **Mix** carries `long_range = false`, so by the flag it should not — yet Jegged's recommended line is "Rikku's Overdrive Mix casting Mighty G" alongside "start by moving the ship away." Unresolved — **C-2**.

### 4.4 What Evrae can do at each range

**NEAR — the four-turn cycle:**

| Step | Action | Result |
|---:|---|---|
| 1 | **Attack** → random character | ~1,250–1,450 physical, 10 % shatter, **blanked by Darkness** |
| 2 | **Attack** → random character | as step 1 |
| 3 | **Inhale** | no damage; the telegraph |
| 4 | **Poison Breath** → whole party | ~1,400–1,600 magical **+ Poison at 100 %** |
| → | loop to 1 | |

`[verified: 2 sources — wiki ("a dangerous melee attack, which it will use on two consecutive turns, followed by the powerful Poison Breath that needs one turn to charge"); GamerGuides (Poison Breath "requires a charging turn before execution"); the decompiled `Inhale` row corroborates the charge turn]`

**Poison is not a tax here, it is a second attack.** Character Poison ticks **`maxHP // 4` = 25 % of max HP at the end of the victim's own turn** (`ffx-combat-core.md` §4.2). Poison Breath therefore costs a ~1,200 HP character roughly **1,500 now and ~300 every turn after**, on all three actives at once, with **no white mage in the party**. This is why the fight is remembered as a wall.

**FAR:**

| Action | When |
|---|---|
| **Photon Spray** → 8 random hits | its ordinary turn |
| **Out of breath range.** | in place of a Poison Breath whose charge started at NEAR |
| **Swooping Scythe** | as a reaction in the Haste phase — see §5.5 |

`[verified: 2 sources — wiki "it will only use a weaker Photon Spray attack on the party"; GamerGuides "Photo Spray: hits 8 times to random targets, although the damage isn't too big"]`

### 4.5 Dodging Poison Breath — the fight's best single play

> If Evrae has used **Inhale** and the ship is **FAR** when the breath resolves, the attack is replaced by **"Out of breath range."** and nothing happens.
> `[verified: 2 sources — wiki ("Poison Breath can also be dodged from this range if the ship moves away before its release"); GamerGuides ("if you order Cid to pull back while it's charging (and he does), the Poison Breath will actually miss your party")]`

Note the parenthesis in the GamerGuides phrasing — **"and he does"**. The order is queued; Cid has to get a turn between the Inhale and the breath. The dodge is a **race between two CTB counters**, not a button. Evrae at Agility 20 recovers in 30 ticks (15 when Hasted); Cid recovers in 36 (decompiled Agility 16). **In the Haste phase the dodge is often simply not available**, and the player has to read that off the turn list.

**The trap, and it is a good one:** in the Haste phase, **targeting Evrae at all while FAR makes it use Swooping Scythe, which drags it back to NEAR** — so the dodge fails because you attacked. The wiki states it plainly: when dodging Poison Breath at low HP "it is important that Evrae isn't targeted until the attack is executed." `[single source: wiki]` **This is the single most interesting rule in the encounter** and the strongest argument for the chapter: *the correct play is to do nothing, visibly, on purpose, and the UI has to make doing nothing legible.*

### 4.6 The missile economy

```
missilesLeft = 3
```
Each FAR turn on which Cid has **no** queued order spends one. When it hits 0 he says so once, and thereafter his unordered turns are silent skips. `[verified: 2 sources]`

**Total free damage available: ~7,200 (22.5 % of the bar), but only to a player who spends three of Cid's turns doing nothing else.** The optimal line is therefore not "stay far" and not "stay near" — it is a specific interleaving, and the fight is entirely about finding it. `[derived]`

### 4.7 State machine (reference)

```ts
type Range = 'NEAR' | 'FAR';

interface AirshipState {
  range: Range;              // starts 'NEAR'
  queuedOrder: Range | null; // last Trigger Command since Cid's last turn
  missilesLeft: number;      // 3
  outOfAmmoAnnounced: boolean;
  breathCharged: boolean;    // set by Inhale, cleared on resolve or whiff
}

// Player: Tidus or Rikku, on their own turn, rank assumed 3 (C-7)
function triggerCommand(order: Range, s: AirshipState) {
  s.queuedOrder = order;     // last order wins; does NOT move the ship yet
}

function reachesAtRange(action, user, s: AirshipState): boolean {
  if (s.range === 'NEAR') return true;
  return action.longRange || user.hasRangedWeapon; // hasRangedWeapon: Wakka only
}
```

---

## 5. AI script / turn rotation

### 5.1 CTB fundamentals

`research/ffx-combat-core.md` §1.2 `ICV_BASE`: Agility ≥ 19 → **10 base ticks**.

| Actor | Agility | Base ticks | Rank-3 recovery | Hasted |
|---|---:|---:|---:|---:|
| **Evrae** | 20 | **10** | **30** | **15** |
| **Cid** (decompiled) | 16 | 12 | 36 | — |
| *Cid (wiki value, for C-6)* | *11* | *14* | *42* | — |
| Typical party member here | 10–22 | 14–10 | 42–30 | 21–15 |

`[derived]` from `[decompiled]` Agility + the `[verified: 2 sources]` ICV table.

**Slow on Evrae takes recovery 30 → 60 and adds 100 % of its pending counter.** Against an un-Hasted party that is close to a doubled action economy for as long as it sticks — which is why Slow is the fight's headline lever and why the Haste phase reads as a genuine escalation.

### 5.2 Phase 1 — HP ≥ 10,667 (the top two thirds of the bar)

Evrae runs the NEAR cycle of §4.4 while NEAR and Photon Spray while FAR. No self-buffs. Cid alternates order-execution and missiles.

### 5.3 The Stone Gaze aggro counter

> **Stone Gaze replaces a melee Attack once an internal counter reaches 6.**
> The counter **+1** when Evrae is targeted by a **regular magic attack** and **+2** when targeted by a **regular physical attack**.
> `[single source: wiki Evrae page]` — no second source found; recorded as **C-1**.

What the wiki does not say, and what has to be decided rather than guessed:
- whether the counter **resets to 0** after Stone Gaze fires (assume yes — otherwise every subsequent melee slot becomes Stone Gaze);
- whether **Guided Missiles**, **Lancet**, **Steal** or **status-only** commands count as "regular" attacks (assume **no** — "regular" most naturally excludes Cid's script action and the utility commands);
- whether an 8-hit or multi-hit player action increments once or per hit (assume **once per action**).

All three are marked `[estimate]` in §10 C-1 and **must be surfaced as tunables**, not buried.

> **Design note.** Read plainly, this rule says: *the more you attack it, the more likely it is to petrify someone.* Physical aggression costs double. That is a coherent, teachable pressure and it pairs exactly with the range mechanic — the FAR state is magic-and-Wakka only, i.e. **+1 per turn instead of +2**, so **fighting at range also slows the petrify clock.** Nothing in any guide says that out loud, but it falls straight out of the two rules together. `[derived]`

### 5.4 Phase 2 — HP < 10,667 (below 1/3)

| Trigger | Response | Confidence |
|---|---|---|
| Evrae's HP drops below **10,667** (1/3 of 32,000) | **casts Haste on itself** — recovery 30 → 15 and its pending counter is halved on the spot | `[verified: 2 sources — wiki ("Once Evrae's HP drops below 10,667 (1/3 max HP), it casts Haste on itself"); GamerGuides ("Once Evrae's HP drops below approximately 10,000, it casts Haste")]` |
| In phase 2 | **stops using Stone Gaze** — unless one is already readied | `[single source: wiki]` |
| In phase 2, **FAR** and **targeted** | **Swooping Scythe** immediately (or on its next turn), which **brings it back to NEAR** | `[verified: 2 sources — wiki; GamerGuides "a counter that brings Evrae close after unleashing it"]` |
| Reduced to 1/3 **by Guided Missiles** | Haste fires all the same | `[single source: wiki]` |

**Whether Swooping Scythe exists at all in phase 1 is genuinely ambiguous.** The wiki frames it as phase-2 behaviour; GamerGuides lists it under "At Long Range" with no phase qualifier. Recorded as **C-12**; the recommended default is **phase 2 only**, because that reading gives the phase change a distinct silhouette.

### 5.5 Counters

| Player action | Evrae's counter | Confidence |
|---|---|---|
| **Slow lands while Evrae already has Haste** | **immediately re-casts Haste** (Counter Self) | `[verified: 2 sources — wiki ("If Evrae is inflicted with Slow after it uses Haste, it will immediately counter it by casting Haste again"); GamerGuides ("it will immediately use Haste again (as a counter), so there's nothing you can really do about that")]` |
| **Targeted while FAR, in phase 2** | **Swooping Scythe** → closes to NEAR | `[verified: 2 sources]` |
| **Dropping below 1/3 HP** | Haste (self) | `[verified: 2 sources]` |

### 5.6 Delay — the one boss in our set that allows it

`immune_to_delay = false`. `[decompiled]` Applying `ffx-combat-core.md` §1.5 with Evrae's base ticks of 10:

| Delay | Push to Evrae's counter |
|---|---:|
| Delay Attack (weak) | `floor(10 × 3 / 2)` = **+15** |
| Delay Buster (strong) | `10 × 3` = **+30** — a whole free turn |

**But there is a catch, and it is strange enough to be worth reproducing:** the wiki states that delaying Evrae **before** it drops below 1/3 — three times with Delay Attack, or once with Delay Buster — **causes it to enter the Haste phase sooner**. `[single source: wiki]` The mechanism is unstated (most likely an internal counter shared with the phase trigger). Recorded as **C-13**. If we ship it, it must be visible, because an invisible "your tempo tool advances the boss's power spike" rule is a trap, not a decision.

### 5.7 Reference AI pseudocode

```ts
const HASTE_THRESHOLD = 10_667;           // floor(32000 / 3) + 1; wiki states 10,667

// --- counters (not scheduled turns) ---
onTargeted(source: PlayerAction) {
  if (phase === 1 && source.isRegularAttack) {
    gazeCounter += source.isPhysical ? 2 : 1;        // §5.3, [single source]
  }
  if (phase === 2 && ship.range === 'FAR' && !swoopQueued) {
    swoopQueued = true;                              // §5.5
  }
}

onDamaged() {
  if (hp < HASTE_THRESHOLD && !hasted) {
    hasted = true; phase = 2;
    counter(Haste, SELF);                            // halves recovery AND pending CTB
  }
}

onStatusApplied(s: Status) {
  if (s === Status.SLOW && hasted) counter(Haste, SELF);   // §5.5
}

// --- scheduled turn ---
evraeTurn(ship: AirshipState) {
  if (swoopQueued) { swoopQueued = false; ship.range = 'NEAR';
                     return cast(SwoopingScythe, CHARACTERS_PARTY); }

  if (ship.range === 'FAR') {
    if (breathCharged) { breathCharged = false; return announce('Out of breath range.'); }
    return cast(PhotonSpray, RANDOM_CHARACTERS_8);
  }

  // NEAR
  if (breathCharged) { breathCharged = false; return cast(PoisonBreath, CHARACTERS_PARTY); }
  switch (nearStep) {
    case 0:
    case 1:
      if (phase === 1 && gazeCounter >= 6) { gazeCounter = 0; nearStep++;   // reset: [estimate], C-1
                                             return cast(StoneGaze, randomCharacter()); }
      nearStep++;
      return cast(Attack, randomCharacter());
    case 2:
      nearStep++; breathCharged = true;
      return cast(Inhale, SELF);                     // the telegraph
    default:
      nearStep = 0;
      return evraeTurn(ship);                        // breath resolves via breathCharged
  }
}
```

---

## 6. Status and buff interactions that decide the fight

### 6.1 Darkness — the melee off-switch

Dark resistance **50**, and Evrae's melee **Attack** is `affected_by_dark`. Darkness drops physical hit chance to **base/10 ≈ 10 %** (`ffx-combat-core.md` §4.2). Wakka's **Dark Attack** (3 turns) / **Dark Buster** (1 turn, 254 chance) are the delivery. The wiki recommends exactly this. `[verified: 2 sources — decompiled `affected_by_dark` flag + wiki "Dark Buster and Power Break mitigate Evrae's physical attacks"]`

**But Swooping Scythe is NOT affected by Darkness**, and Poison Breath, Stone Gaze and Photon Spray are all magical. Darkness turns off two of the four NEAR-cycle turns and nothing else. Say so in the help window.

### 6.2 Power Break — the other half

Power Break resistance **0**. A Power-Broken attacker deals `damage // 2` on physical actions (`get_damage`, physical branch). Halves both Attack and Swooping Scythe. `[decompiled]` + wiki `[verified: 2 sources]`

If the player watched two Jecht spheres after Spherimorph, **Auron's Banishing Blade Overdrive applies Power Break and Mental Break together** — a nice optional-content payoff the wiki calls out by name. `[single source: wiki]`

### 6.3 Slow — the tempo lever, and its expiry date

Slow resistance 50, works, doubles recovery, and **the wiki documents a lock**: repeatedly cast Slow, then strip it with Esuna or a Remedy (which does *not* re-advance the pending turn), and Evrae can be denied turns almost indefinitely — **until it gains Haste, at which point the whole tactic dies.** `[single source: wiki]` A clean, self-limiting exploit that the phase change deliberately closes. Worth keeping: it makes the 1/3 threshold land as a *loss of control*, not just a numbers bump.

### 6.4 Al Bhed Potion — the party's only real heal

Reflect and the missiles get the attention; **this item is what the chapter is actually balanced around.** Decompiled: `Fixed (no variance)`, base **20** → **exactly 1,000 HP**, target **whole party**, `removes_statuses`, curing **Poison, Silence and Petrification**. Rank **2**. `[decompiled]` + wiki `[verified: 2 sources]`

Against a Poison-Breathed party that is one shatter away from losing a member, a single rank-2 command that heals 1,000 to everyone **and** clears the Poison **and** un-petrifies the victim before Swooping Scythe shatters them is not a consumable, it is the answer. **Rikku is not optional in this chapter.** (Kimahri can also carry `Use` if the player took him down Rikku's grid path — `[single source: wiki]`.)

### 6.5 Reflect on Evrae — the clever line, and the thing nobody wrote down

Reflect resistance **0**, and Evrae's Haste is `affected_by_reflect`. The wiki's stated tactic: put Reflect on Evrae and **it can no longer Haste itself**, at the cost of Lulu's spells bouncing back onto your own party. `[single source: wiki]`

**What no source states, and what falls out of our own core:** `ffx-combat-core.md` §4.2 says Reflect "bounces one targeted spell to the **opposite party**", and `ffx-seymour-flux.md` §3.3 already established this exact pattern for a **self-targeted** enemy spell (Flare → Self bounced onto the party). By the same rule, **Evrae's self-targeted Haste under Reflect should bounce onto a random party member and Haste them.** That would make Reflect not merely a denial but a *conversion* — the boss repeatedly hands the player free Hastes. `[derived]` — **flagged as C-14, verify before shipping**, because if true it is one of the best moments available in the chapter and if false it is a bug the player will notice immediately.

### 6.6 What does nothing (say so in the UI)

Poison · Bio · Demi (percentage-immune) · Silence · Sleep · Petrify · Zombie · Death · Berserk · Provoke · Magic Break · Armor Break · Eject · Bribe · any elemental strike (halved) · Mental Break (legal, but the stat is already 1).

---

## 7. Damage model and computed tables

### 7.1 Formula

Identical port to `ffx-seymour-flux.md` §5.1 / `ffx-combat-core.md` §2 — not restated. The four formulas this encounter uses are `Strength`, `Magic`, `Fixed` and `CTB`.

### 7.2 Incoming — Evrae (STR 36 / MAG 30), mid-roll `damage_rng = 16`, no Protect/Shell/Cheer/Focus

**Attack** (Strength, base 16, single random target):

| Party Defense | min | **avg** | max | on a crit |
|---:|---:|---:|---:|---:|
| 5 | 1,347 | **1,437** | 1,521 | 2,874 |
| 10 | 1,299 | **1,386** | 1,467 | 2,772 |
| 15 | 1,253 | **1,337** | 1,415 | 2,674 |
| 20 | 1,207 | **1,288** | 1,363 | 2,576 |
| 25 | 1,163 | **1,241** | 1,313 | 2,482 |

**Swooping Scythe** (Strength, base 8, **whole party**, 50 % shatter on petrified targets):

| Party Defense | min | **avg** | max |
|---:|---:|---:|---:|
| 10 | 649 | **693** | 733 |
| 15 | 626 | **668** | 707 |
| 20 | 603 | **644** | 681 |

**Poison Breath** (Magic, base 36, **whole party**, Poison @ 100 %):

| Party MDef | min | **avg** | max | **+ poison tick (25 % max HP)** |
|---:|---:|---:|---:|---|
| 10 | 1,461 | **1,559** | 1,650 | 250 / turn on a 1,000 HP character |
| 15 | 1,410 | **1,504** | 1,592 | 300 / turn on a 1,200 HP character |
| 20 | 1,358 | **1,449** | 1,533 | 350 / turn on a 1,400 HP character |
| 30 | 1,259 | **1,343** | 1,421 | — |

**Photon Spray** (Magic, base 3, **8 independent random-target hits**):

| Party MDef | per hit | 8-hit total if all land on one character |
|---:|---:|---:|
| 10 | 99–112 (**106**) | **~848** |
| 15 | 95–107 (**102**) | ~816 |
| 20 | 91–103 (**98**) | ~784 |

**Stone Gaze**: **zero HP damage**. Petrify @ 100 %, Slow @ 255. `[decompiled]`

`[derived]` from `[decompiled]` constants, all of it.

### 7.3 Incoming — Cid's Guided Missiles

Not incoming. See §2.2: **2,244 / 2,400 / 2,532**, three times, ~7,200 total.

### 7.4 Outgoing — player damage into Def 1 / MDef 1

**Physical attack** (base weapon damage 16, no crit):

| Attacker STR | min | **avg** | max | crit |
|---:|---:|---:|---:|---:|
| 18 | 196 | **210** | 222 | 420 |
| 22 | 336 | **359** | 380 | 718 |
| 26 | 539 | **575** | 608 | 1,150 |
| 30 | 812 | **867** | 917 | 1,734 |
| 34 | 1,170 | **1,249** | 1,322 | 2,498 |

**Black magic** — `Fire/Blizzard/Thunder/Water` base **12**, the `-ra` tier base **24** `[decompiled]`. All four elements are **halved**:

| Lulu's Magic | `-ra` raw | **after ×0.5** | tier-1 raw | after ×0.5 |
|---:|---:|---:|---:|---:|
| 26 | 810 | **405** | 369 | 184 |
| 32 | 1,156 | **578** | 542 | 271 |
| 38 | 1,573 | **786** | 750 | 375 |

> **Correction to an earlier draft.** All six raw cells in this table were previously miscomputed (~1.7–3 % low), and the halved columns inherited the error: 796/1,141/1,558 and 358/523/727. The base damages were right (tier-1 = 12, `-ra` = 24) and the Strength and Fixed tables reproduce cell-for-cell, so the fault was isolated to the **MAGIC branch** of the re-implementation of `_get_power`. Re-running the decompiled chain — `_get_power(MAGIC) = ((mag² × 0x2AAAAAAB) // 0xffffffff + base) × base // 4`, then the shared mitigation tail with `_get_mitigation(1) = 725` and `damage_rng = 16` — gives the figures above. **The qualitative conclusion is unaffected** (Lulu is halved and contributes *reach*, not damage), but the corrected numbers are the ones that go into the engine's balance fixtures. `[derived]` from `[decompiled]` constants; the same re-implementation reproduces §7.2 and the §7.4 physical table exactly, which is the control.

**Bio does zero damage** — base_damage **0**, its entire payload is Poison, and Evrae is Poison-immune. **Demi does zero** — `immune_to_percentage_damage`. `[decompiled]`

`[derived]`.

> **Read the two tables against each other and the chapter designs itself.** A good phase-1 party turn is worth 350–900. Cid's volley is worth 2,400 and costs no party turn. Evrae's melee is worth 1,300 against a party whose members hold 1,000–1,400 HP. **The arithmetic says: stay out, let Cid work, and come in only to do something a ranged character cannot.** The encounter then spends its whole second half taking that answer away — first by Hasting, then by dragging you back into melee with Swooping Scythe the moment you shoot at it from range.

---

## 8. Player strategies → the mechanics that MUST work

Ordered roughly by how much the fight leans on them.

| # | Strategy | Mechanic it requires |
|---:|---|---|
| 1 | **Open by pulling back**; farm the three missile volleys | Trigger Command → queued order → Cid's turn → missile counter |
| 2 | **Al Bhed Potion as the party heal** (1,000 to all + cures Poison/Petrify/Silence) | `Fixed (no variance)` base 20, party target, `removes_statuses`, rank 2, Rikku's `Use` |
| 3 | **Tidus stacks Cheer** (up to 5) while at range to make Wakka's ranged attacks worth the turns | Cheer/Focus with both halves (`15 − stacks` in mitigation), stacking to 5, `long_range` |
| 4 | **Wakka attacks every turn from any range** | a per-character ranged-weapon property, not an action flag |
| 5 | **Slow → Esuna/Remedy → Slow** turn-lock, until Haste ends it | Slow's `CTB` base-16 application, Esuna/Remedy not re-advancing the counter, the Haste counter |
| 6 | **Lulu contributes despite the ×0.5** | elemental affinity multipliers applied per §1.2; accept that her role here is *reach*, not damage |
| 7 | **Dark Buster + Power Break to blunt the melee** | `affected_by_dark` per action; Power Break's `damage // 2` on the attacker |
| 8 | **Dodge Poison Breath by pulling back during Inhale** | `breathCharged` flag, range check at resolve, the `Out of breath range.` whiff row |
| 9 | **In phase 2, do not target it while far** or Swooping Scythe drags it back | the targeted-while-far reaction |
| 10 | **Rikku's Mighty G / Super Mighty G** for Protect+Shell+Haste(+Regen) | Mix, rank 6, and a resolution of C-2 (does Mix reach at FAR?) |
| 11 | **Reflect to deny the self-Haste** | Reflect on an enemy; enemy self-targeted spell bouncing to the player party (§6.5) |
| 12 | **Stone Ward (Soft ×30) and Poison Ward (Antidote ×40) customisation** at Rin's before the fight. **Stoneproof and Poisonproof are *not* available here** — they need Petrify Grenades and Poison Fangs, which Rin does not stock (§9.5) | equipment as `{slots, abilities[]}`; Softs and Antidotes as customisation currency; **status resistance as a subtraction from the infliction chance**, so a Ward turns Stone Gaze's 100 % into ~50 % rather than halving anything |
| 13 | **Overdrives carry the damage** — Attack Reels, Energy Rain, Dragon Fang, Blitz Ace | persistent Overdrive gauges and modes |
| 14 | **Kimahri's Self-Destruct as a last resort** | `HP` formula base 30, `destroys_user` |
| 15 | **Steal a Water Gem** (guaranteed) before the kill | Steal at base chance 255; **Steal does not reach at FAR** |
| 16 | **Overkill for 8,100 AP and a second Blk Magic Sphere** | overkill threshold 2,000 on the killing blow |

`[verified: 2 sources]` for rows 1–9 and 11–13 (wiki + GamerGuides + Jegged overlapping); `[single source]` for 10 and 14.

---

## 9. Typical party at this story point

### 9.1 Story position — and the two absences that define the chapter

The party has just escaped the **destruction of Home** aboard the *Fahrenheit*, learned from Brother that **Yuna is in Bevelle about to be married to Seymour**, and ordered Cid to fly there. Evrae attacks on the approach. `[verified: 2 sources — wiki *Fahrenheit* + *Bevelle* story sections; Jegged Airship walkthrough]`

| Present | Absent |
|---|---|
| **Tidus, Wakka, Lulu, Kimahri, Auron, Rikku** — six characters, three active and three on the bench | **Yuna** |

> **Yuna's absence is the encounter's design.** No Wht Magic. **No Cure, no Esuna from a dedicated caster, no Life, no Phoenix-Down-plus-heal economy beyond items.** No **aeons** — no summon as a damage burst, no summon as a shield, no Grand Summon. No **Yojimbo**. Healing is **items only**, which is why §8 row 2 is row 2. Every other FFX chapter in the anthology assumes a summoner in the party; this one is the chapter that asks what the guardians are worth on their own. **That is the strongest argument for building it**, and it is also the largest engine requirement: the chapter must run with the Summon command absent rather than greyed out.

### 9.2 Base stats at Sphere Level 0 (exact, for the preset builder)

| | HP | MP | STR | DEF | MAG | MDEF | AGI | LUCK | EVA | ACC | Weapon slots / abilities | Armor slots |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| Tidus | 520 | 12 | 15 | 10 | 5 | 5 | 10 | 18 | 10 | 10 | 0 / — | 1 |
| Auron | 1,030 | 33 | 20 | 15 | 5 | 5 | 5 | 17 | 5 | 3 | 1 / **Piercing** | 1 |
| Kimahri | 644 | 78 | 16 | 15 | 17 | 5 | 6 | 18 | 5 | 5 | 2 / **Piercing, Sensor** | 0 |
| Wakka | 618 | 10 | 14 | 10 | 10 | 5 | 7 | 19 | 5 | 25 | 1 / — | 0 |
| Lulu | 380 | 92 | 5 | 8 | 20 | 30 | 5 | 17 | 40 | 3 | 1 / — | 1 |
| Rikku | 360 | 85 | 10 | 8 | 10 | 8 | 16 | 18 | 5 | 5 | 1 / — | 1 |

`[decompiled]` (`characters.json`). Base weapon damage is **16** for all seven.

### 9.3 Authored preset at Evrae — `[estimate]`

A first playthrough with no grinding, no Sphere Grid optimisation, and no missed-chest recovery. **Every number below is `[estimate]` by construction** and must be playtested against recorded ordinary-progression footage before we claim fidelity — the same caveat as `ffx-seymour-flux.md` C-11.

| | Sphere Lv | HP | MP | STR | DEF | MAG | MDEF | AGI |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Tidus | ~24 | 1,150 | 60 | 22 | 14 | 11 | 12 | 22 |
| Wakka | ~24 | 1,300 | 40 | 24 | 14 | 13 | 12 | 12 |
| Lulu | ~24 | 700 | 200 | 8 | 10 | 32 | 36 | 10 |
| Rikku | ~28 | 880 | 130 | 16 | 12 | 12 | 14 | 22 |
| Auron | ~26 | 2,000 | 60 | 30 | 22 | 8 | 10 | 9 |
| Kimahri | ~22 | 1,250 | 100 | 20 | 18 | 18 | 12 | 10 |

Sanity check against §7.2: Evrae's melee takes **half of Tidus's bar in one hit**; Poison Breath is **lethal to Lulu in two**; the poison tick alone is **250–350 per character per turn**. That matches every account of the fight and it means **the estimate is at least the right shape**, even if individual cells move.

### 9.4 Abilities plausibly available — `[estimate]`

| Character | Reasonably has |
|---|---|
| Tidus | **Cheer**, Provoke, **Haste**, **Slow**, Delay Attack, Flee, Talk; Overdrive **Spiral Cut / Slice & Dice / Energy Rain** |
| Wakka | **Dark Attack, Dark Buster**, Silence Attack, Sleep Attack, Triple Foul; Overdrive **Element/Attack/Status Reels** |
| Lulu | Fire/Blizzard/Thunder/Water and the full `-ra` tier, **Bio** (useless here), **Focus**, Doublecast if lucky; Overdrive **Fury** |
| Rikku | **Steal**, **Use**, **Mix**; **Reflect** is available to her shortly after joining via a Lv. 2 Key Sphere `[single source: wiki]` |
| Auron | **Power Break**, Armor Break, Magic Break, Mental Break, Threaten; Overdrive **Dragon Fang / Shooting Star**, and **Banishing Blade** if two Jecht spheres were watched |
| Kimahri | **Lancet**, plus whatever grid branch the player took; possibly **Use** or **Self-Destruct** |

### 9.5 Equipment and inventory

**Rin's Travel Agency is aboard the *Fahrenheit***, and Jegged's walkthrough has the player shop there **before** the Evrae fight ("Purchase 30 Softs and 30 Antidotes from Rin to customize armor"). Post-airship stock includes **Soft (50 gil)**, **Antidote (50)**, **Hi-Potion (500)**, Phoenix Down, Eye Drops, Echo Screen, the four Distillers, Grenade — plus **Glorious**-line armour at **4,725 gil** (the slot-rich armour the customisation plan needs) and the **Dark**-line weapons at 18,225 gil. `[verified: 2 sources — wiki *Rin's Travel Agency* shop table; Jegged]`

| Customisation | Cost — **one armour slot** | Effect | Reachable aboard the *Fahrenheit*? |
|---|---|---|---|
| **Stone Ward** | **Soft ×30** | **50 % base resistance to petrification**, *subtracted* from the infliction chance | **Yes** — Softs are 50 gil from Rin |
| **Stoneproof** | **Petrify Grenade ×20** | 100 % immunity | **No.** Petrify Grenades are not sold here at any price |
| **Poison Ward** | **Antidote ×40** | 50 % base resistance to poison | **Yes** — Antidotes are 50 gil from Rin |
| **Poisonproof** | **Poison Fang ×12** | 100 % immunity | **No.** Poison Fangs are not sold here; they are stolen from wasp-type fiends |

`[verified: 2 sources — wiki auto-ability pages (`required = Soft x30` / `Petrify Grenade x20` / `Antidote x40` / `Poison Fang x12`); GamerGuides *Aerial Battle*, "It takes 30 Softs for Stone Ward and 40 Antidotes for Poison Ward"]`. The "reachable?" column is `[derived]` from the wiki's *Rin's Travel Agency* post-airship stock table, which lists Potion, Hi-Potion, Phoenix Down, Antidote, Eye Drops, Echo Screen, **Soft**, the four Distillers, Grenade and Map — **and no Petrify Grenade and no Poison Fang.**

> **Correction to an earlier draft, and it was the load-bearing one.** This table previously read *Stone Ward = Soft ×2*, *Stoneproof = Soft ×60*, *Poison Ward / Poisonproof = Antidote ×2 / ×12*. **All four costs were wrong and two of them named the wrong item entirely.** The draft then built an editorial "correction of Jegged" on top of the fabrication — a claimed "asymmetry the jegged advice glosses over", where 30 Softs supposedly bought Ward on several characters. **That paragraph has been deleted. Jegged and GamerGuides were right; this document was not.** 30 Softs buys **exactly one Stone Ward slot**, which is precisely what Jegged says.
>
> **What to write into the chapter's shop copy instead:** **Ward is the only option that exists at this point in the story**, and it is a partial one. Status resistances in FFX are *subtracted* from the infliction chance rather than multiplied by it `[single source: wiki Stone Ward]`, so against Stone Gaze's **100 %** Petrify a Stone Ward leaves **~50 %** still landing — on one character, for 1,500 gil and a free armour slot. The honest shop beat is **"you can buy one person half a chance"**, not "Ward is the affordable tier of a two-tier system". **Stoneproof is not a budget decision here; it is simply out of reach.**
>
> **Nit on Jegged, recorded rather than editorialised:** Jegged's Soft figure is correct and independently corroborated ("Purchase 30 Softs… to add the Stone Ward ability"), but its companion line says "Purchase 30 **Antidotes**… to add Poison Ward" where the requirement is **40**. That is a ten-Antidote shortfall in one guide, not a design asymmetry. `[verified: 2 sources]` against Jegged.

**Al Bhed Potions.** The wiki's Al Bhed Potion page says they are purchasable from Rin's agency **aboard the airship for 1,000 gil**; the Rin's Travel Agency shop table does **not** list them. Conflict **C-15**. Either way the player arrives holding a stack: they drop from Bikanel fiends, are stolen from the Mech line, and are **found lying around Home and Bevelle**. `[verified: 2 sources — wiki Al Bhed Potion "Obtained" section + Jegged's strategy, which assumes a supply]`

**Inventory estimate at the fight** `[estimate]`: 15–30 Al Bhed Potions, 20+ Potions, 5–10 Hi-Potions, 10+ Phoenix Downs, a dozen Antidotes and Softs, a handful of Grenades, ~20,000–40,000 gil.

---

## 10. Conflicts, gaps, and the verify-before-shipping list

| ID | Conflict / gap | Resolution |
|---|---|---|
| **C-1** | The **Stone Gaze aggro counter** (threshold 6, +1 magic / +2 physical) is **wiki-only**. Reset behaviour, what counts as a "regular attack", and multi-hit handling are all unstated. | Ship the counter behind three named tunables (`threshold`, `resetOnFire`, `countsMultiHitOnce`) with the documented defaults. **Verify in-game.** Do not hide it — §5.3's derived "range also slows the petrify clock" consequence is only legible if the counter is surfaced. |
| **C-2** | Does **Mix** (and Steal, and Use-as-offense) reach at FAR? `Mix` is `long_range = false`, yet Jegged's recommended line uses Mighty G from the pulled-back state. | Unresolved. Recommended default: **Mix reaches** (it targets your own party, so "reach" is meaningless for it) and **offensive items / Steal do not**. Verify. |
| **C-3** | **Zanmato level** decompiled **3** vs wiki **4**; **Doom turns** decompiled **30** vs wiki **20**; wiki lists Doom as **Immune** while the byte reads landable. | Trust the decompile per the house rule. **All three are moot in practice** — Yojimbo is unavailable (no Yuna) and a 20-or-30-turn Doom never resolves. Record, do not spend time on it. |
| **C-4** | **Threaten**: byte reads 0 (landable), wiki says Immune. Identical shape to Seymour Flux C-2. | **Default to immune** and let Threaten do nothing until tested. |
| **C-5** | **The Scan text** says repeated melee attacks provoke **Poison Breath**; the documented AI says the counter provokes **Stone Gaze**. | Genuine disagreement between two in-game-derived sources. Ship the Stone Gaze behaviour (it is the specific, numeric claim) and ship the Scan text as written; treat the mismatch as characterisation, and note it in the help window rather than silently fixing it. **Verify in-game.** |
| **C-6** | **Cid's Agility**: decompiled **16**, wiki **11**. Changes his recovery from 36 to 42 and therefore how often the ship can turn. | Trust the decompile; **this one is worth an in-game check** because it materially changes the fight's tempo. |
| **C-7** | The **rank** of the Trigger Command on Tidus/Rikku, the rank of Cid's manoeuvre, and whether a redundant order still burns Cid's turn. **None of these are in the data** — the manoeuvre has no action row. | Assume **rank 3** for both and **yes, a redundant order burns the turn** (that is the reading that makes the resource cost honest). All three `[estimate]`. **Verify.** |
| **C-8** | **Stone Gaze's Slow bypasses Slowproof and Ribbon** but is blocked by SOS Haste / Auto-Haste. | `[single source: wiki]`. It is a deliberate exception to our status model, so it needs an explicit engine escape hatch and a unit test either way. |
| **C-9** | Exact on-screen wording/casing of the Trigger Command options. Sources render them "Move in"/"Pull back" and "Pull Back"/"Move In". | Cosmetic. **We are writing original copy anyway** (AGENTS.md hard rule 8 / the writing bible), so pick our own and stop worrying. |
| **C-10** | **"Critical Strike" — attribution.** Wiki attributes the dummied ability to **Evrae**; the decompile puts it as **Evrae Altana's** forced action (`m120` bytes 112–113 = `0x6066` → file 6, action 102), with Evrae's own forced action being "Does Nothing". | Do not ship it under either attribution. |
| **C-10b** | **"Critical Strike" — can it crit?** Wiki *Behind the scenes*: "ironically, an inability to land critical hits." Decompile: `ffx_monmagic2` row 102 byte 32 = `0x0D` → `can_crit` **and** `adds_equipment_crit` both **true**. **The fourth wiki-vs-decompile disagreement on this monster** (with C-3's Zanmato 3/4 and Doom 30/20, and C-6's Cid AGI 16/11) and the only one that was not recorded as a conflict until this revision. | Trust the decompile per the house rule. **Moot in practice** — the action is unreachable, and we are not shipping it. Recorded so the tonal observation built on "cannot crit" does not come back. |
| **C-18** | **Equipment-drop ability rolls.** Decompiled `max_ability_rolls_modifier = 12` expands to `[1,1,1,1,1,1,1,1]` — **always exactly 1**. Wiki infobox says `equip ability max = 2`. The draft tagged this row `[verified: 2 sources]` **while the second source contradicted it.** Secondary nit in the same row: wiki prints `equip drop rate = 256`, the decompiled byte is **255**. | Same shape as C-3: **default to the decompile.** Slots (1–3) genuinely *is* two-source and stays that way. **Verify in-game** only if the drop ever matters — it does not, the drop is a joke (§1.4). |
| **C-11** | **The visual bible's Trigger Command widget (§3.12) has no flavour for a persistent two-state toggle issued to an uncontrollable ally.** Both existing flavours are one-shot Talks. | **This is a real gap, not a conflict.** A third flavour has to be designed, mocked up and approved before integration (AGENTS.md hard rule 9). §11 item 17. |
| **C-12** | Is **Swooping Scythe** available in phase 1, or only in the Haste phase? Wiki implies phase 2; GamerGuides lists it un-qualified. | Default to **phase 2 only** — it gives the phase change a distinct silhouette. Verify. |
| **C-13** | The wiki's claim that **delaying Evrae before 1/3 HP makes it enter the Haste phase sooner** (3× Delay Attack or 1× Delay Buster). Mechanism unstated. | `[single source]`. If shipped, it **must be visible**; an invisible penalty on the player's tempo tool is a trap. Verify. |
| **C-14** | **Does Evrae's self-targeted Haste, under Reflect, bounce onto a random party member and Haste them?** Our own core says a Reflected self-targeted enemy spell goes to the opposite party (and `ffx-seymour-flux.md` §3.3 relies on exactly that for Flare). No source states it for Evrae. | `[derived]`. **Verify before shipping** — if true it is the best moment in the encounter; if false the player will read it as a bug. |
| **C-15** | Are **Al Bhed Potions** actually purchasable from Rin aboard the ship? The item page says yes at 1,000 gil; the shop table omits them. | Minor. The player arrives with a stack regardless. Default: **not purchasable at this point**, because scarcity is better for the chapter. |
| **C-16** | **The battle music.** No source states which track plays for Evrae. §12 defaults to the main boss theme with the airship-attack cue as the lead-in. | `[estimate]`. Open. |
| **C-17** | The whole of §9.3/§9.4/§9.5 — the party preset. | `[estimate]` by construction, same as every other chapter's preset. Playtest before claiming fidelity. |

---

## 11. Minimum viable mechanic list for this chapter

Ordered by implementation dependency. Items marked **NEW** do not exist in the current five chapters.

1. CTB scheduler with rank-based recovery, the turn forecast, and **three-active / three-reserve** swapping (six characters, not seven — no Yuna).
2. **NEW — a third combatant that is neither party nor enemy:** Cid, with his own CTB icon, his own recovery, no targeting path, no Sensor/Scan, and the tie-break rank already reserved for him in `ffx-combat-core.md` §1.6.
3. **NEW — a battlefield range state (`NEAR` / `FAR`)** that every action's legality reads.
4. **NEW — a queued order that resolves on another actor's turn** ("last order wins"), and that consumes that actor's alternative action.
5. **NEW — a per-character ranged-weapon property** (Wakka only) distinct from an action's `long_range` flag.
6. **NEW — a limited-use scripted ally attack** with an ammunition counter, an out-of-ammo announcement, and silent skips thereafter.
7. **NEW — a charge that can be made to whiff by a state change** (`Inhale` → `Out of breath range.`), with its own named whiff message.
8. **NEW — a reaction that changes the battlefield state** (Swooping Scythe dragging the fight back to NEAR).
9. **Petrify with the full shatter → Eject chain**, per-action `shatter_chance` (Attack 10, Swooping Scythe 50), and **the permanent loss of a bench slot**.
10. **Poison as 25 % of max HP** ticking at the end of the victim's turn, with **no white mage in the party** to answer it.
11. **Darkness with per-action `affected_by_dark`** — it must blank Attack and not blank Swooping Scythe.
12. **Power Break** on an enemy halving its physical output; **Mental/Magic/Armor Break** correctly doing nothing.
13. **Slow / Haste with both halves** (future recovery *and* the instant counter adjustment), mutual exclusion, and an enemy **counter-Haste on being Slowed**.
14. **Delay on a boss** (weak +15, strong +30) — the only boss in the set that permits it.
15. **Elemental affinity multipliers** with a resisting boss, and a UI that tells the player before they burn the MP.
16. **An aggro counter with a visible readout** (§5.3) — magic +1, physical +2, threshold 6.
17. **NEW — a third Trigger Command widget flavour** (visual-bible §3.12): a persistent two-state toggle with a **preview of the consequence** (what the order costs Cid this turn) and a **queued-order indicator** on Cid's CTB row, reusing the delayed-effect marker already specified in §3.12.2. **Needs a mockup and Bailey's approval before integration.**
18. **Reflect on an enemy**, including a self-targeted enemy spell bouncing onto the player party (shared with the Seymour Flux chapter — §6.5, C-14).
19. **Al Bhed Potion** as a rank-2, party-wide, 1,000 HP + three-status-cure item, and **Rikku's `Use`** as a first-class command.
20. **Absent-character handling** — the Summon command must be *gone*, not greyed, and the chapter must not assume a healer.
21. Overkill (threshold 2,000), guaranteed Steal, and the joke equipment drop (§1.4).

---

## 12. Scene, beat sheet, appearance and music

### 12.1 Where and when

**The open foredeck of the *Fahrenheit***, in flight, on the final approach to Bevelle. Full daylight, high altitude, open sky.

The *Fahrenheit* is an **ancient airship recovered from the sea floor near Baaj Temple** and flown by the Al Bhed; Cid owns it, Brother flies it. Two details worth painting: the **deck plating is lettered "Salvage Dream CID"**, and a **gold dial carries "Wind bless you" in Al Bhed script**. Its armament in this fight is **guided missiles**; the laser cannons on either flank do not appear until the assault on Sin. `[single source: wiki *Fahrenheit*]`

**Evrae is Bevelle's watchdog.** The wiki puts it plainly: in FFX "the Warrior Monks and the fiend Evrae protect the city". It is not a wandering monster — it is a **posted guard**, which is why this fight is the moment Yevon stops pretending. `[single source: wiki *Bevelle*]`

### 12.2 Evrae's appearance — in words, for painters

A **wyrm**: long, serpentine, wingless in profile but airborne, holding station alongside a moving airship. Read it as a **sea-serpent built for the sky** — the silhouette should say *eel* and *dragon* at once, never *bat*. Key painter notes:

- **It is longer than the frame.** The composition should never fit the whole creature. Head and forequarters carry the fight; the body trails off into haze at frame edge. This is also what sells the range mechanic: at FAR you see *less* of it, not a smaller copy of the same shape.
- **Two silhouettes, one creature.** At NEAR it is a head-and-claws threat filling the upper third, jaw level with the deck. At FAR it is a long diagonal streak across open sky with the head small and the body legible. **The chapter card is the FAR silhouette.**
- **The scythe limbs.** Swooping Scythe names them: long bladed forelimbs it sweeps across the deck. They are the reason the party can be hit at all when the ship stands off — give them visible reach.
- **The throat.** Poison Breath and its Inhale telegraph both happen here. The throat needs a paintable "charging" state — a swelling, a colour shift, something that reads at chapter-card size — because **Inhale is one of only two enemy telegraphs in the whole anthology** and the player has exactly one turn to act on it.
- **The eyes.** Stone Gaze is a look, not a projectile. Whatever the eyes do has to be the single most readable thing on the creature.
- **Auron's line about the fight** — a five-word remark comparing the wyrm to a toothed red carpet — is the tonal key: *this is Bevelle's doormat, and it bites.* Do not reuse the line; reuse the register.

Colour direction `[estimate]`: keep it **cold and reptilian against a warm sky** so it never disappears into the backdrop, and reserve the only saturated accent on the creature for the **throat charge** and the **eyes**. Everything else is value, not hue.

### 12.3 The deck and the sky — location sheet `[estimate]` except where noted

**Composition.** The playfield is the **foredeck**, a hard-edged metal platform running left-to-right across the lower third, with a **railing** and then **nothing** — the drop is the frame's real edge. The party stands with their backs to the superstructure. Behind and above: **open sky and cloud**, and, growing across the chapter, **Bevelle on the horizon** — a white, tiered, spire-and-bridge city, deliberately the most *built* thing the player has seen.

**This is the anthology's only scene with a floor and a sky and nothing in between**, which makes it the natural home for two of the approved presentation goals: **"backdrops with a floor and a sky"** and **"air in the arena."** It is also the only scene where **the arena legitimately turns** — the ship is moving, so parallax on the cloud layers is not an effect, it is the truth.

| Layer | Direction |
|---|---|
| Sky | high-altitude gradient, warm low band into cold zenith; the sun off-frame so the deck can take a hard key |
| Cloud (far) | slow, near-static; establishes scale |
| Cloud (mid) | **the parallax layer** — its speed is the ship's speed, and it must visibly change when the ship manoeuvres |
| Cloud (near, below the rail) | fast, streaking, occasionally crossing in front of the deck edge |
| Bevelle | a pale silhouette that **grows over the fight** — a free, diegetic progress bar |
| Deck | metal plate, rivet lines running to the vanishing point, the lettered "Salvage Dream" panel as a foreground read |
| Wind | constant; everything with cloth on it moves |

**The range state must be readable without the HUD.** At NEAR: Evrae's head over the rail, the deck shadowed by its bulk, clouds occluded. At FAR: Evrae small against clean sky, the whole deck lit, cloud layers visible past it. **A player who has muted the UI should still know which state they are in** — that is the bar for this chapter.

**Money shots.**
1. **Over-the-shoulder from the deck**, party at the rail in the lower third, Evrae's head filling the upper right, Bevelle's spires just visible past its neck.
2. **FAR silhouette wide** — the ship's prow at frame-left, Evrae a thin dark diagonal across an empty bright sky, party reduced to three small figures. **Chapter card.**
3. **The Inhale frame** — tight on the throat, the deck out of focus below, one turn of warning rendered as a held image.
4. **The missile volley** — twelve trails from off-frame left converging on the creature, the deck lit from beneath by the launch.

### 12.4 Beat sheet — before

Summarised in my own words. No transcript, no guide prose.

| # | Beat | Who | Tone |
|---:|---|---|---|
| 1 | Home is gone. The survivors are aboard a thousand-year-old airship that has no business flying, and the Al Bhed are flying it anyway. | — | Exhausted, defiant |
| 2 | Brother finds Yuna: she is in Bevelle, and she is being married to Seymour within the hour. Cid puts the ship on course without being asked twice. | Brother, Cid | Urgency, family |
| 3 | The guardians arm up on the deck. **Yuna is not here.** Somebody says out loud what everyone has worked out: without her, nobody in this party can heal anything. | Rikku or Lulu | The chapter's thesis, stated once |
| 4 | Bevelle comes up over the cloud line — white, tiered, enormous, and the first city in the game that looks like it was *designed*. | — | Awe with a threat in it |
| 5 | Something detaches from the city and climbs to meet them. It is not scrambling; it was already waiting. The city posted a guard. | — | Cold recognition |
| 6 | Auron, dry, names the thing for what it is: Bevelle's welcome mat, with teeth. | Auron | Gallows humour |
| 7 | **BATTLE.** Cid's voice comes over the deck: he can move the ship, and he has missiles, and he cannot do both at once. | Cid | The mechanic, delivered as characterisation |

`[verified: 2 sources — wiki *Fahrenheit* + *Bevelle* story sections; Jegged Airship walkthrough]` for beats 1, 2, 4 and 5.

### 12.5 Beat sheet — after

| # | Beat | Who | Tone |
|---:|---|---|---|
| 8 | Evrae breaks and **falls out of the sky**, down through the cloud layer, gone. Not sent, not killed on screen — it simply stops being a problem and starts being a shape getting smaller. | — | Anticlimax, deliberately |
| 9 | There is no rest. **Bevelle's own guns open up on the ship**; the *Fahrenheit* takes damage and Cid has to peel away. Beating the guard did not get them in. | Cid | The victory is revoked within a minute |
| 10 | Tidus goes down the mooring chains to the palace roof alone, because that is what is left. | Tidus | Reckless, inevitable |
| 11 | The wedding. Yuna on the tower, Seymour beside her, and the guardians arriving late and outnumbered. | — | The hinge of the act |

`[verified: 2 sources — wiki *Fahrenheit* ("The ship is damaged in the following attack by the Bevelle guards and Cid steers it away"); Jegged ("Cinematic sequences show the wedding ceremony and Tidus descending via chains")]`

> **Chapter framing recommendation.** Every other FFX chapter in the anthology is a confrontation with a person who has an argument. This one is a **fight with a doorman**. Evrae wants nothing, says nothing, and is not evil — it is a posted animal doing its job in front of a city that is about to commit a much worse crime indoors. The mechanics say the same thing: the enemy has **no armour and no cleverness**, just a very large amount of blood and a mouth, and the interesting decisions all belong to **the ship** — to distance, timing, and the turns you choose not to take. Build the chapter around **restraint**: the player's best plays here are pulling back, waiting, and not attacking. That is a register no other chapter in the set occupies.

### 12.6 Music

**No source states which track plays for the Evrae battle.** Recorded as **C-16**. What is established:

| Track | Japanese | Length | What the OST listing says | Confidence |
|---|---|---|---|---|
| **"Enemy Attack"** | 敵襲 *Tekishū* | 2:37 | **"The game's main boss theme."** | `[single source: wiki OST listing]` |
| "Leap in the Dark" | 暗躍 *An'yaku* | 1:22 | "Plays… **when the *Fahrenheit* is attacked by fiends**" and before some boss battles | `[single source: wiki OST listing]` |
| "Assault" | 襲撃 *Shūgeki* | 4:02 | "First plays as Yuna's guardians try to **rescue her from marrying Seymour in Bevelle**" | `[single source: wiki OST listing]` |
| "The Wedding" / "Tragedy" | — | 1:15 / 4:07 | the wedding itself, and Seymour's kiss | `[single source]` |

**Recommended reading `[estimate]`:** "Leap in the Dark" is the **approach cue** (the ship under attack), the battle itself runs on the **main boss theme**, and **"Assault" is the track for everything that comes after** — which is why beat 9 lands so hard: the music *escalates* after you win.

> **Do not transcribe, sample or arrange any of these.** The brief below is for commissioning an original piece in the same emotional slot.

**Mood brief for the battle theme** `[estimate]`:

| Parameter | Target |
|---|---|
| Tempo | 140–150 BPM, propulsive, with **forward motion rather than aggression** — the ship is travelling and the music should be travelling with it |
| Meter | 4/4, driving eighths in the bass; this is the one battle in the anthology that can carry a *groove* |
| Texture | **Machina, not menace.** Engine-room percussion, metallic pulses, a low sustained drone underneath that reads as altitude. The wyrm is not the subject — the airship is |
| Harmony | Minor, modal, but **more open than the Flux theme**: use fourths and fifths, leave air in the middle of the mix. The chapter's visual goal is "air in the arena" and the music should agree |
| Melody | A **short two-bar figure** that can survive being interrupted, because it will be — the range flips and the Inhale telegraph both want a musical hook |
| Arc | Two states, not one. A **pulled-back variant** (thinner, wider reverb, the melody at distance) and a **closed-in variant** (dry, loud, percussion forward). Cross-fade them on the range flip. **This is the chapter's one genuinely new audio idea and it is free** — the range state is already a boolean |
| Phase 2 | When Evrae Hastes, the tempo does not change — **the subdivision does.** Eighths become sixteenths underneath the same pulse. The player should feel the boss speed up without the music sounding faster |
| Anti-brief | Avoid: choir, orchestral brass fanfare, anything sacred. Bevelle's holiness is the *irony* of this scene, not its sound. Save the choral material for the wedding cue |

**Audition requirement.** Per AGENTS.md hard rule 13, agents cannot hear. Every sketch above goes into `docs/audio/audition.html` for Bailey to judge, and the **two range variants must be auditionable back to back with the cross-fade**, or the idea cannot be evaluated at all.

---

## Sources

**Decompile-derived data (primary layer)**

- https://github.com/Grayfox96/FFX-RNG-tracker — repository root
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_mon_data.csv — monster stat table (Evrae `m119`, Evrae Altana `m120`, Cid `m149`)
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_mon_data_hd.csv — HD monster stat table (byte-diffed against the PS2 table; one irrelevant byte differs)
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_monmagic1.csv — monster action table (file id 4; Evrae's melee Attack, id 127)
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_monmagic2.csv — monster action table (file id 6; Swooping Scythe 91, Poison Breath 97, Stone Gaze 98, Photon Spray 99, Inhale 100, Out of breath range. 101, Guided Missiles 115)
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_command.csv — player/aeon command table (file id 3; Evrae's Haste is row 54)
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_item.csv — item action table (Al Bhed Potion, Soft, Antidote, Remedy)
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/monster_actions.json — per-monster action-id + target assignments (`m119`, `m120`, `m149`)
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/characters.json — character base stats and default equipment abilities
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/monsters.py — monster field offsets
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/actions.py — action field offsets
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/constants.py — Status / Element / DamageFormula / TargetType enum orderings
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/events/character_action.py — damage formula (`get_damage`, `_get_power`, `_get_mitigation`)

**Wiki (fetched via `finalfantasy.fandom.com/api.php?action=parse&prop=wikitext` with a browser user agent; the default fetch path returns HTTP 402)**

- https://finalfantasy.fandom.com/wiki/Evrae
- https://finalfantasy.fandom.com/wiki/Evrae_Altana_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Cid_(Final_Fantasy_X_boss)
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_enemy_abilities
- https://finalfantasy.fandom.com/wiki/Fahrenheit
- https://finalfantasy.fandom.com/wiki/Bevelle
- https://finalfantasy.fandom.com/wiki/Al_Bhed_Potion_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Rin%27s_Travel_Agency
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X:_Original_Soundtrack
- https://finalfantasy.fandom.com/wiki/Stone_Ward_(Final_Fantasy_X) — **added in the revision pass (F-1)**: `required = Soft x30`, and the rule that status resistance is *subtracted* from the infliction chance
- https://finalfantasy.fandom.com/wiki/Stoneproof_(Final_Fantasy_X) — **added (F-1)**: `required = Petrify Grenade x20`
- https://finalfantasy.fandom.com/wiki/Poison_Ward_(Final_Fantasy_X) — **added (F-1)**: `required = Antidote x40`
- https://finalfantasy.fandom.com/wiki/Poisonproof_(Final_Fantasy_X) — **added (F-1)**: `required = Poison Fang x12`

**Guides and secondary sources**

- https://gamerguides.com/final-fantasy-x-hd/guide/walkthrough/bevelle/aerial-battle — GamerGuides "Arrival in Bevelle / Aerial Battle"
- https://jegged.com/Games/Final-Fantasy-X/Walkthrough/21-Airship.html — Jegged Airship walkthrough
- https://strategywiki.org/wiki/Final_Fantasy_X/Airship_Part_2 — **not retrievable this session** (Cloudflare challenge on both the article and `action=raw`); listed because it is the obvious fourth source for a future verification pass
- https://samurai-gamers.com/final-fantasy-x-x2-hd-remaster/evrae-boss-guide/ — **not retrievable this session** (connection refused); same note

**Local prior research consulted**

- `research/ffx-seymour-flux.md` — format, confidence vocabulary, Trigger Command precedent, Reflect-on-a-self-targeted-enemy-spell precedent (§3.3), the equipment Ward-vs-proof correction shape (C-14)
- `research/ffx-combat-core.md` — §1.2 `ICV_BASE`, §1.3 ranks, §1.4 Haste/Slow, §1.5 Delay, §1.6 turn forecast and the tie-break line that already ranks Cid last, §2 damage formulas, §4.2 full status table
- `research/visual-bible.md` — §2.x location-sheet shape, §3.12 Trigger Command prompt (and the gap this encounter opens in it), §3.13 enemy telegraph banner, §4.11 Scan/Sensor panel
- `research/writing-bible.md` — §5.1 battle-string house style, §5.2 telegraph convention, §5.3 Sensor text spec, §5.4 victory quips

---

## 13. Verification log (2026-09-19)

| # | Claim | How it was checked | Result |
|---:|---|---|---|
| 1 | Evrae HP 32,000 | decompile + wiki infobox + Jegged | agree |
| 2 | Defense and Magic Defense are 0, not "high" | decompile bytes 33/35 read 0; wiki prints 1 (formula clamp) and its battle text says the Scan description is wrong | resolved in favour of 0/1; the Scan lie is deliberate |
| 3 | All four base elements resisted, Holy neutral | decompile affinity bitfields + wiki infobox "Halves" ×4 | agree |
| 4 | **Poison does NOT work** (brief asked "poison?") | resistance byte 255 **and** poison-tick byte 0 | brief corrected |
| 5 | Slow (50) and Dark (50) land | decompile + wiki `slow = 50`, `blind = 50` | agree |
| 6 | Power Break lands, Magic/Armor Break do not | decompile bytes + wiki immunity list | agree |
| 7 | Guided Missiles = Fixed base 4 × 12 hits, 3 uses | decompile action 6/115 + wiki + an independent restatement of the out-of-ammo behaviour | agree; damage computed at 2,244/2,400/2,532 |
| 8 | Trigger Command belongs to Tidus and Rikku, resolves on Cid's turn | wiki + GamerGuides + a third restatement | agree |
| 9 | At FAR only Blk Magic, Wakka's attacks and Lancet reach | wiki + GamerGuides, near-identical wording, independently fetched | agree |
| 10 | Poison Breath needs an Inhale charge turn and can be dodged by pulling back | wiki + GamerGuides + the decompiled `Inhale` / `Out of breath range.` row pair + the enemy-abilities master table | agree, four ways |
| 11 | Haste at HP < 10,667 (1/3) | wiki (exact figure) + GamerGuides ("approximately 10,000") | agree |
| 12 | Slowing a Hasted Evrae is counter-Hasted immediately | wiki + GamerGuides | agree |
| 13 | Stone Gaze does no HP damage; Petrify 100 %, Slow 255 | decompile (`damages_hp = false`, `damages_ctb = true`) + wiki enemy-ability table ("Damages CTB", "Petrification: 100 %", "Slow: Always (100 turns)") | agree |
| 14 | Swooping Scythe is party-wide with 50 % shatter | decompile `shatter_chance = 50` + wiki enemy-ability table "50 % PDR" | agree |
| 15 | Stone Gaze aggro counter (6 / +1 magic / +2 physical) | wiki only; a targeted search surfaced no independent statement | **`[single source]` — C-1** |
| 16 | PS2 vs HD Evrae data | byte-for-byte diff of both monster tables | identical except byte 403, which no parsed field reads |
| 17 | Cid's Agility | decompile 16 vs wiki 11 | **conflict C-6, unresolved** |
| 18 | Which music track plays | OST listing consulted; no source names the Evrae battle | **open — C-16** |

---

## 14. Fact-check log (revision pass, 2026-09-19)

An external fact-check was run against the first draft of this document. **Seven defects were raised; I re-verified every one from primary sources before editing, and all seven stand.** Each is corrected in place above, with an inline "Correction to an earlier draft" note at the point of use so the error cannot be re-inherited by anyone reading only one section. Nothing was corrected on the fact-checker's say-so alone.

| # | Where | What the draft said | What is actually true | How I verified it | Tag change |
|---:|---|---|---|---|---|
| **F-1** | **§9.5** customisation table, and the "asymmetry the jegged advice glosses over" paragraph built on it. **The most load-bearing failure in the file** — §8 row 12 and the chapter's pre-fight shop copy both depended on it. | Stone Ward = **Soft ×2**; Stoneproof = **Soft ×60**; Poison Ward / Poisonproof = **Antidote ×2 / ×12**. Plus an editorial "correction" claiming 30 Softs buys Ward on several characters and that Jegged glossed over the asymmetry. | **Stone Ward = Soft ×30** for one armour slot. **Stoneproof = Petrify Grenade ×20** — not buyable with Softs at any quantity. **Poison Ward = Antidote ×40**. **Poisonproof = Poison Fang ×12.** All four costs were wrong; two named the wrong item entirely. **Jegged and GamerGuides were right and this document was not** — 30 Softs buys exactly one Stone Ward slot, which is what Jegged says. Neither "proof" tier is reachable aboard the *Fahrenheit* at all. | Fandom wikitext via `action=parse` with a browser UA: `required=[[Soft]] x30`, `[[Petrify Grenade]] x20`, `[[Antidote]] x40`, `[[Poison Fang]] x12`, plus the prose lines on each page. Corroborated by GamerGuides *Aerial Battle* ("It takes 30 Softs for Stone Ward and 40 Antidotes for Poison Ward") and Jegged. Reachability checked against the wiki's *Rin's Travel Agency* post-airship stock table, which lists Soft and Antidote and **no** Petrify Grenade or Poison Fang. | Table rewritten and re-tagged **`[verified: 2 sources]`**; the fabricated design note **deleted**; replaced with the real consequence (Ward is the only option and leaves ~50 % of a 100 % Stone Gaze landing). |
| **F-2** | **§7.4** black-magic damage table. | Magic 26 → `-ra` raw **796** / halved 398, tier-1 **358** / 179; Magic 32 → **1,141** / 570, **523** / 261; Magic 38 → **1,558** / 779, **727** / 363. | Magic 26 → **810 / 405**, **369 / 184**; Magic 32 → **1,156 / 578**, **542 / 271**; Magic 38 → **1,573 / 786**, **750 / 375**. All six raw cells were ~1.7–3 % low and the halved columns inherited it. | Re-implemented `_get_power(MAGIC)` and the shared mitigation tail from `events/character_action.py`, with base damages from `ffx_command.csv` and `ELEMENTAL_AFFINITY_MODIFIERS[RESISTS] = 0.5`. **Control:** the same code reproduces this document's own §7.2 (Attack, Swooping Scythe, Poison Breath, Photon Spray) and the §7.4 *physical* table **cell for cell**, which localises the fault to the MAGIC branch. | Stays `[derived]`; numbers replaced. **Qualitative conclusion unaffected** — Lulu contributes reach, not damage. Must be replaced before it is copied into balance fixtures. |
| **F-3** | **§3.4** "Critical Strike", presented under `[decompiled]`. | "…physical, affected by Darkness, **cannot crit**", plus a tonal observation about the irony of a Critical Strike that cannot crit. | **The byte says the opposite.** `ffx_monmagic2` row 102 byte 32 = `0x0D` = `0b00001101` → physical **and** `can_crit` **and** `adds_equipment_crit`. "Cannot crit" is purely the Fandom *Behind the scenes* note. A wiki claim had been laundered into the decompiled layer. | Parsed row 102 directly with the offsets in `data/actions.py` (`can_crit = bool(action[32] & 0x04)`). Everything else in the line checks out: base **16**, accuracy **90**, `affected_by_dark` true, `shatter_chance` 0. Attribution re-derived: `m120` bytes 112–113 = `0x6066` → file 6, action 102; `m119` = `0x0000` → Does Nothing. | New conflict **C-10b** recorded alongside C-10. Recommendation not to ship the action is unchanged. |
| **F-4** | **§1.1** blockquote, and the §1.1 design thesis resting on it. | "Evrae is **the least-armoured boss the player has met**." | **False superlative.** Defense byte 0 is the table's default, not a property of Evrae. **217 of 343 PS2 monster records** have Defense byte 0; **82 of the first 120 indices** do. Among bosses met *before* Evrae, **Seymour (`m124`) is Defense 0** and **Anima (`m125`) is Defense 0 / Magic Defense 0** — the bosses of the sibling Macalania chapter in this same batch. | Byte-33 / byte-35 distribution computed over `ffx_mon_data.csv` with the offsets in `data/monsters.py`; `m124` / `m125` identified by their action lists in `monster_actions.json` (m124: Shell / Fira / … / Multi-Watera; m125: Boost / Summon Anima / Pain / Oblivion). | Superlative deleted; restated as "like most of the cast — the difficulty is a 32,000 HP bar and action economy, not armour". **The HUD recommendation survives** on `_get_mitigation(1) = 725` alone. |
| **F-5** | **§1.4** equipment-drop row. | "slots 1–3, **1 ability roll**" tagged `[decompiled]` **+ wiki `equip ability min 1 / max 2`** → **`[verified: 2 sources]`**. | **The two cited sources disagree, and the disagreement was tagged as a verification.** Decompiled `max_ability_rolls_modifier = 12` expands to `[1,1,1,1,1,1,1,1]` — always exactly 1; the wiki says max 2. Slots *are* genuinely two-source (`slots_modifier = 10` → `[1,1,2,2,2,2,3,3]`; wiki min 1 / max 3). Secondary: wiki prints drop rate **256**, the byte is **255**. | `ffx_mon_data.csv` index 119 bytes 173 / 177 / 139, expanded with the slots and `ab_rolls` loops in `data/monsters.py`; wiki infobox fetched as wikitext. | Row **split**. Slots keeps `[verified: 2 sources]`; ability rolls becomes conflict **C-18** defaulting to the decompile; drop-rate discrepancy noted. |
| **F-6** | **§4.2** "What the options are" row. | **Move In** / **Pull Back**, `[verified: 2 sources]` citing the wiki **Scan text** and GamerGuides. | **The wiki citation does not support the claim it was attached to.** The Scan text reads only "Ask Cid to move the airship away…" and never names the options. Re-reading the whole article, the *only* wiki attestation is a **gallery file caption**: "Evrae in the distance after using the **Pull Back** trigger command (HD Remaster)." So **Pull back** is genuinely two-source; **Move in** is GamerGuides only. | Full Evrae wikitext fetched and searched end to end for "move in" / "pull back" / "command". GamerGuides: "You can issue Cid to either **Move in** or **Pull back**, which will be done on Cid's turn." | Tag **split**: *Pull back* `[verified: 2 sources]`, *Move in* `[single source]`. Cosmetic either way (**C-9** — we write our own copy), but the mis-citation is exactly the defect class this pass exists to catch. |
| **F-7** | **§3.1** / **§3.3 note 5**, found during this pass rather than raised by the fact-checker. | Photon Spray's target is "**`Random Characters`** (plural)", tagged `[decompiled]`, with the per-hit retargeting read off that plural. | `monster_actions.json` gives `m119` action 6/99 the target **`Random Character`** (singular), and `TargetType` in `constants.py` has **no plural member** for monster actions. The 8-hit count is decompiled; the **per-hit retargeting is a guide claim**, not a byte. | `monster_actions.json` and `data/constants.py` read directly; behaviour corroborated by wiki and GamerGuides ("hits 8 times to random targets"). | Target string corrected; retargeting re-tagged from `[decompiled]` to **`[verified: 2 sources]`**, damage-RNG-per-hit to `[derived]`. Implementation guidance unchanged. |

### 14.1 What did **not** change, and why that matters

The corrections are numerically and editorially significant but **structurally contained**. Nothing in §2 (Cid and the missile economy), §4 (the distance mechanic), §5 (the AI script), §6 (status interactions), §11 (the mechanic list) or §12 (scene and music) depends on any of the seven. The chapter's thesis — *the turn you do not spend is the turn that does the most damage* — is untouched, and so is the argument for building it.

**Two habits to carry into the sibling chapters in this batch** (`ffx-seymour-anima-macalania.md`, `ffx2-leblanc-syndicate.md`):

1. **A `[verified: 2 sources]` tag is a claim about the sources, not about the value.** F-5 and F-6 are both cases where two sources were cited and one of them either contradicted the value or never stated it. **Before tagging, re-read the second source's actual sentence against the actual cell.**
2. **Never let a wiki claim enter the `[decompiled]` layer.** F-3 is that failure exactly, and it went undetected because the *surrounding* five fields in the same line were genuinely decompiled. **Parse the byte or drop the tag.**
