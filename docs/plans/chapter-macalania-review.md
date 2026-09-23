# Paper preflight — Chapter: Seymour and Anima, Macalania Temple

> **Verdict: PROCEED**, with two hard preconditions stated in §5 and §6.
> Paper only (`critic/RUBRIC.md` §4, adopted 2026-09-21): no code was written, no
> browser was opened, no build was run. Written 2026-09-21 by a workflow sub-agent.
>
> **Nothing perceivable may be built from this document.** The chapter's board tile
> (`docs/target/targets.json`, group `chapters`) is a **gap** — "Concept sheets on the
> way" — so hard rule 9 applies to every asset in §6. What this plan authorises is the
> *paper* work and, once Bailey picks the looks, the engine and data work in §8.

---

## 1. Game case and sources

**FFX only.** Every rule below is read off an FFX-only research document about an FFX
encounter, with an FFX-only party, the FFX CTB engine, FFX aeons and the FFX Nul-spell
family. None of it touches `src/battle/ffx2/**` or `src/data/ffx2/**`.

Two carve-outs, stated so a builder does not over-apply them (AGENTS.md rule 14,
`critic/CHECKS.md` CHK-020 / CHK-021):

| Change | Case | Why |
|---|---|---|
| New enemy data, AI script, party build, story script, guide, tactic, scene, chapter record | **FFX only** | All FFX sources |
| Enemy **Cover** (§4.1), mid-battle **enemy arrival** (§4.2), the pre-summon **damage clamp** (§4.3), the **enemy-gauge-on-being-targeted** hook (§4.5) | **both** — shared plumbing added to `src/battle/ffx/**` only, but written as general engine capability, not as a Macalania special case | CHK-020: shared plumbing and bug fixes are "both". They land in the FFX engine; the FFX-2 engine is untouched and gets no equivalent. |
| The front-end `COMING_CHAPTERS` row disappearing | **both** (shared front-end plumbing) | `src/app/screens/frontend/chapterGrid.ts` already drops a row whose id appears in `CHAPTERS`; no edit needed |

**Sources read for this preflight, in full or in the named sections:**

- `research/ffx-seymour-anima-macalania.md` — read end to end (1,076 lines). Every
  number in §2 and §3 below cites a section of it.
- `research/ffx-combat-core.md` §1 (CTB), §2 (damage), §4.1 (status roll), §4.4
  (Threaten), §6.4 (aeon stat derivation), §6.5 (aeon Overdrive gauge).
- `docs/ARCHITECTURE.md`, `docs/ENGINE-API.md` (playback protocol), `docs/CONTRACTS.md`.
- `src/data/encounters.ts`, `src/data/chapter-meta.ts`.
- **Pattern chapter, read end to end: Chapter 1, Seymour Flux (FFX).**
  `src/data/ffx/enemies/seymour-flux.ts` + `-abilities.ts`,
  `src/data/ffx/builds/gagazet.ts`, `src/battle/ffx/ai/seymour-flux.ts`,
  `src/story/scripts/seymour-flux.ts`, `src/data/guides/seymour-flux.ts`,
  `src/engine/tactics/seymour-flux.ts`, `src/scenes/gagazet.ts`,
  `tests/unit/strategy-seymour-flux.test.ts`, `tests/e2e/chapters.spec.ts`.
- `research/writing-bible.md` (§0.1 scope, §1.9 Seymour, §2.1 FFX cutscene grammar,
  §3 outline format, §5.3 Sensor, §5.4 victory), `docs/audio/THEMES.md` (the cue map).
- `src/app/screens/frontend/comingChapters.ts` — **this pins the chapter id**.

**The chapter id is `seymour-anima-macalania`.** It is already written down in
`comingChapters.ts` as the id "the real chapter is expected to take", and
`chapterGrid.ts` drops the COMING card by exact id match. Using any other id ships a
duplicate card.

---

## 2. The encounter as data

Format and citation style follow `src/data/ffx/enemies/seymour-flux.ts`: every number
carries its research section **and the research's own confidence tag**
(`docs/CONTRACTS.md`, "Data agents"). Anything the research does not give is a **gap**
below and must be left out, not guessed (hard rule 6).

### 2.1 Seymour — `seymour-macalania` (`m124`, bestiary #077)

| Field | Value | Cite |
|---|---:|---|
| hp / maxHp | 6,000 | §1.1 `[verified: 2 sources]` |
| mp | 100 | §1.1 `[decompiled]` + wiki |
| str | 20 | §1.1 |
| def | 0 | §1.1 `[decompiled]` (formula clamps; wiki prints 1) |
| mag | **25**, → **32** in act three | §1.1 byte `[decompiled]`; the 32 is `[single source]` corroborated by §0.3's ×1.45 / ×2.41 reproductions |
| mdef | 25 | §1.1 |
| agi | 20 | §1.1 |
| luck / eva / acc | 15 / 0 / 100 | §1.1 |
| `rewards.ap` / `apOverkill` | 2,000 / 3,000 | §1.1 `[verified: 2 sources]` |
| `rewards.gil` | 5,000 | §1.1 |
| `rewards.overkillThreshold` | 1,400 | §1.1 `[verified: 2 sources]` |
| `poisonTickPercent` | **10** | §1.1 `[verified: 2 sources]` — 600/turn on a 6,000 bar |
| `doomTurns` | 3 | §1.1 `[decompiled]` |
| `zanmatoLevel` | 4 | §1.1 / §12 C-6 `[verified: 2 sources]`, byte 402 + 1 |
| `threatenChance` | **0 ⇒ immune** | §0.4 `[verified: 2 sources]` |
| affinities | `{}` — all five elements neutral | §1.2 `[decompiled]` |
| `immunityFlags` | `['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe']` | §1.3 `[decompiled]` + wiki |

`immunities` (raw 0–255 bytes, §1.3 `[decompiled]`, "missing key = 0"):
`poison: 40`, `magic-break: 50`, **`armor-break` and `mental-break` omitted (byte 0,
fully landable)**, **`slow` omitted (byte 0 — the wiki says so in prose,
`[verified: 2 sources]`)**, and `255` on: `ko`, `zombie`, `petrify`, `power-break`,
`confuse`, `berserk`, `provoke`, `sleep`, `silence`, `darkness`, `eject`, `auto-life`,
`doom`. `immune_to_life` is set (flavour only — he is `ko`-immune anyway, same note as
Seymour Flux's file).

Steal: `baseChance: 100` (byte 255 = guaranteed, clamped to the 0–100 contract range,
exactly as `seymour-flux.ts` does it), `common: turbo-ether ×1`, `rare: elixir ×1`
(§1.4 `[verified: 2 sources]`). Drops: `blk-magic-sphere ×1` common, `special-sphere ×1`
rare (§1.4). Bribe: `immune: true` (§1.4).

**Abilities** (§4.1 `[decompiled]`), all `category: 'enemy'`, `damageType: 'magical'`,
`flags: ['reflectable']` unless noted:

| id | power | formula | element | hits | targeting | notes |
|---|---:|---|---|---:|---|---|
| `shell` (shared player row) | — | — | — | 1 | `self` | chance 254, opening move |
| `mac-blizzara` | 24 | `magic` | ice | 1 | `random-enemy` | mp 8, `ignores-armored` |
| `mac-thundara` | 24 | `magic` | lightning | 1 | `random-enemy` | id note: research says "Thunder", the contract spells it `lightning` (`docs/CONTRACTS.md` vocabulary) |
| `mac-watera` | 24 | `magic` | water | 1 | `random-enemy` | |
| `mac-fira` | 24 | `magic` | fire | 1 | `random-enemy` | |
| `mac-blizzaga` / `-thundaga` / `-waterga` / `-firaga` | 42 | `magic` | ice / lightning / water / fire | 1 | `random-enemy` | mp 16, **aeon target only** |
| `mac-multi-blizzara` / `-thundara` / `-watera` / `-fira` | 36 | `magic` | ice / lightning / water / fire | **2** | `random-enemy` | act three only; **not** `ignores-armored`; see §4.4 |
| `mac-seymour-idle` | 0 | `none` | — | 0 | `self` | "Special 1", his turn while Anima is out |

### 2.2 Guado Guardian ×2 — `guado-guardian-a` / `-b` (`m141`, #078)

> ⚠ `m141` only. Do **not** ship `m213`'s (Lake Macalania) Berserk/Summon script or
> `m222`'s (Home) Silence/Confuse script — §2's warning box, `[verified: 2 sources]`.

| Field | Value | Cite |
|---|---:|---|
| hp / maxHp | 2,000 | §2.1 `[verified: 2 sources]` |
| mp | 10 | §2.1 |
| str / def / mag / mdef | 10 / 0 / 15 / 0 | §2.1 `[decompiled]` |
| agi | 12 | §2.1 |
| luck / eva / acc | 15 / 0 / 100 | §2.1 |
| `rewards.ap` / `apOverkill` | 290 / 435 | §2.1 `[verified: 2 sources]` |
| `rewards.gil` | 300 | §2.1 |
| `rewards.overkillThreshold` | **2,000 — equal to full HP** | §2.1 `[verified: 2 sources]` |
| `poisonTickPercent` | 25 | §2.1 |
| `doomTurns` | 1 | §2.1 |
| `threatenChance` | **100** (default tier) | §0.4 `[verified: 2 sources]` |
| `zanmatoLevel` | 4 | §2.1 |

`immunities`: `petrify` **omitted (byte 0 — fully landable, the fight's shortcut)`,
`death`→`ko: 10`, `silence: 20`, zombie / poison / all four Breaks / darkness / slow /
eject omitted (byte 0); `255` on `confuse`, `berserk`, `provoke`, `sleep`, `auto-life`,
`doom` (§2.2). `immunityFlags: []` — **not** immune to percentage damage, Delay, Slice
or Bribe (§2.2).

Steal: `baseChance: 100`, `common: hi-potion ×1`, **`rare: ether ×1`** — ship the
decompile, note the wiki conflict in the file header (§12 **C-1**). Drops: `ability-sphere ×1`
common and rare (§2.5). Bribe: `ether ×10` at 50,000 gil (§2.4).

**Abilities** (§4.2 `[decompiled]`):

| id | power | formula | targeting | notes |
|---|---:|---|---|---|
| `protect` (shared player row) | — | — | `self` | chance 254, mp 12, opening move |
| `guardian-blizzard` | 12 | `magic` / ice | `random-enemy` | mp 4 |
| `guardian-thunder` | 12 | `magic` / lightning | `random-enemy` | mp 4 |
| `guardian-auto-potion` | **20** | **`fixed-no-variance`** | `self` | `heals`, `is-counter` → `20 × 50 = 1,000` |
| `guardian-hi-potion` | **20** | **`fixed-no-variance`** | `single-ally` | `heals` → Seymour +1,000, spends the turn |
| `guardian-remedy` | 0 | `none` | `single-ally` | `removes-statuses`: petrify, poison, confuse, berserk, sleep, silence, darkness, slow |
| `guardian-remedy-self` | 0 | `none` | `self` | same list |
| `guardian-shremedy` | 0 | `none` | `random-enemy` | `statusEffects: [{ status: 'confuse', chance: 50, … }]`, no damage |

**Per-Guardian behaviour** (§2.3, §5.2). Branch **set** is `[verified: 2 sources]`;
branch **order** is **not sourced** (§12 **C-12**) and the file must say so:

```
if (seymour.hp < 4800 && this.hasPotions)                 -> guardian-hi-potion(seymour)
else if (seymour.hasStatus(poison))                       -> guardian-remedy(seymour)    // NOT gated on hasPotions
else if (this.has(silence) || this.has(poison))           -> guardian-remedy-self()      // NOT gated on hasPotions
else 50% -> pass;  else uniformly one of { thunder, blizzard, shremedy }
onDamaged: if (this.hasPotions) counter guardian-auto-potion(self)   // trigger scope = C-11
```

**`hasPotions`** starts true and is set false by one *successful* Steal, which also
consumes that Guardian's single allowed steal (§2.4 `[single source: wiki infobox]`).
The engine's `ActorRuntime.stealCount` (`src/battle/ffx/steal.ts`) already gives both
halves for free: `baseChance 100` halves to 50 after one success, and the AI reads
`stealCount > 0` as `!hasPotions`. **Steal disables Auto-Potion and Hi-Potion-on-Seymour
and nothing else — both Remedy branches survive** (§14 row 1; gating them would silently
double the poison route's value).

**Cover**: while at least one Guardian lives, **physical** attacks aimed at Seymour are
intercepted. Magic is never covered (§2.3 `[verified: 2 sources]`). Engine gap — §4.1.

### 2.3 Anima — `anima-macalania` (`m125`, #079)

| Field | Value | Cite |
|---|---:|---|
| hp / maxHp | 18,000 | §3.1 `[verified: 2 sources]` |
| mp | 50 | §3.1 |
| str / def / mag / mdef | 25 / 0 / 20 / 0 | §3.1 |
| agi | 25 | §3.1 |
| luck / eva / **acc** | 20 / 0 / **30** | §3.1 |
| `rewards.ap` / `apOverkill` | 2,500 / 3,750 | §3.1 `[verified: 2 sources]` |
| `rewards.gil` | 3,000 | §3.1 |
| `rewards.overkillThreshold` | 1,400 | §3.1 `[verified: 2 sources]` |
| `doomTurns` | 3 | §3.1 |
| `threatenChance` | **0 ⇒ immune** | §3.2 / §0.4 |
| `zanmatoLevel` | 4 | §3.1 |

`immunities`: `255` on `ko`, `zombie`, `petrify`, **`poison`**, all four Breaks,
`confuse`, `berserk`, `provoke`, `sleep`, `silence`, `darkness`, `slow`, `scan`,
`eject`, `auto-life`, `doom` (§3.2 `[verified: 2 sources]`).
`immunityFlags: ['boss', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe']` —
and **not** `immune-to-percentage-damage`, because she is explicitly vulnerable to it
(§3.2: Demi can kill her, and Boost's ×1.5 lands before the cap). Do not block it by
accident. Tough/Heavy: see **G-8**. `poisonTickPercent` is moot (Poison-immune) and
should be omitted rather than written as 25.

Steal: `baseChance: 100`, `common: silence-grenade ×3`, `rare: farplane-shadow ×1`
(§3.3 `[verified: 2 sources]`). Drops: `ability-sphere ×1`. Bribe immune.

**Abilities** (§4.3 `[decompiled]`):

| id | power | formula | element | hits | targeting | notes |
|---|---:|---|---|---:|---|---|
| `anima-boost` | 0 | `none` | — | 1 | `self` | applies the existing `boost` status |
| **`anima-pain-boss`** | **28** | **`special-magic`** | none | 1 | `random-enemy` | `ignores-armored`; `statusEffects: [{ status: 'ko', chance: 100 }]`; `canMiss: false` |
| `anima-oblivion` | **4** | `strength` | none | **16** | `all-enemies` | `ignores-armored`, `always-break-damage-limit` |
| `anima-dismiss` | 0 | `none` | — | 0 | `self` | "Seymour dismisses Anima!" |

> ⚠ **`anima-pain-boss` is NOT `pain`.** monmagic2 **#222** (DmgCon **28**, 459–518) is
> the boss's; monmagic2 **#220** (DmgCon **20**, 328–370) is Yuna's Anima's and is
> already defined in the aeon tables. Sharing one record ships the boss at ~70 % of canon
> damage or the player's aeon at ~140 % (§4.3, §13 row 8 — **blocker**). The new record
> gets its own id and a header comment naming both action ids. A unit test pins
> `power === 28` and asserts it is not equal to the player-aeon `pain` record.

**Pain's asymmetry is the whole of act two** and needs no engine special case: aeons
carry the hidden Aeon Ribbon, which `src/battle/ffx/setup.ts#AEON_INNATE_IMMUNITIES`
already implements as `ko: 255` on every aeon. A 100 % Death rider therefore fails on
Shiva and kills a party member, out of the existing generic status model.

**Dummied content**: three Sleep/Silence/Darkness physical variants exist and are never
scripted (§4.4). **Do not implement them.**

### 2.4 Phase structure (§5)

| Act | Entry | Behaviour | Exit |
|---|---|---|---|
| **1** | Scripted opening before the first player turn: both Guardians `protect` self, Seymour `shell` self (§5.2 `[verified: 2 sources]`) | Seymour cycles **ice → lightning → water → fire**, `-ra` tier, one random party member per turn, **never varies**; `-ga` tier instead whenever a player aeon is on the field, **even when absorbed**; Guardians run the §2.2 branch table | **Seymour's HP reaches 3,000 (50 %)** → he summons Anima and **every living Guardian dies** (§5.2 `[verified: 2 sources]`) |
| **2** | Anima arrives in enemy slot 4; Seymour stays on the field and idles (`mac-seymour-idle` at Anima's slot) | Anima alternates **Boost** and **Pain**; a third clock — her own gauge — advances a fixed amount per turn taken and per targeting, **Boost-independent**; at full she fires **Oblivion** | **Anima at 0 HP** → "Seymour dismisses Anima!", she is removed (§5.3) |
| **3** | On her removal Seymour **returns to 6,000 HP** and his Magic goes **25 → 32** (§5.4 `[verified: 2 sources]`) | He casts the **Multi-** version of his `-ra` spell **twice in one turn** (base 36 each) | Seymour dead |

**He cannot be killed before he summons.** Ship the HD behaviour (our declared
baseline): clamp every hit on him to **5,999** while `!animaSummoned`, and floor his HP
at **1** until the summon script has run (§5.2 `[verified: 2 sources]`). The PS2
softlock is a bug; reproducing it would be an own goal.

**No alternation guard.** The "two turns in a row → no-op" rule is specific to the Flux
fight. §5.1 says explicitly: do not copy it here.

### 2.5 Trigger Commands — pre-battle Talk (§5.5)

**Tidus +10 Strength, Yuna +10 Magic Defense, Wakka +10 Magic Defense**
`[verified: 2 sources]`. **This is not the Flux fight's set** (Kimahri/Yuna) and the
table must not be shared — §13 row 4 calls a shared table a **major** defect.

### 2.6 Gaps — values the research does NOT give (hard rule 6: do not guess)

| # | Gap | What to do |
|---|---|---|
| G-1 | **Anima's Overdrive gauge increment.** "A fixed amount" is all any source says (§12 **C-4**). | Ship the research's own labelled `[estimate]`: **+10 % per turn taken, +5 % per targeting**, in a named constant with `[estimate]` in the comment and surfaced as an estimate in-product (same treatment as `AEON_FILL_MULT`). Do **not** present it as canon. |
| G-2 | **Branch priority** of the Guardians' behaviour (§12 **C-12**). | Ship the wiki's sentence order with an explicit "order is not sourced" comment, as §5.2's pseudocode already does. The two orders differ only when Seymour is simultaneously poisoned and under 4,800. |
| G-3 | **Auto-Potion trigger scope** — any damage or physical only (§12 **C-11**). | See §5 C-11: ship "any damage" behind a one-line constant. |
| G-4 | **Guardian rare steal** — decompile says Ether, wiki says Hi-Potion (§12 **C-1**). | Ship the decompile, record the conflict in the file header. Cosmetic. |
| G-5 | **Equipment ability-roll counts** (§12 **C-13**). | Not modelled: the project has no equipment-drop roller. Nothing to ship; note and move on. |
| G-6 | **Whether the Guardians award AP when the summon kills them** (§12 **C-8**). | Unsourced. The engine's `results.ts#collectRewards` pays every non-alive enemy's AP, so "yes" is what we get for free and is the research's own recommendation. Record it as an assumption; it is worth 580 AP. |
| G-7 | **Exact ability strings on the O'aka / Rin armour** (§12 **C-7**). | The build (§3) names only ability *families*. Either fetch the item pages first or ship the empty-slot loadout. Five minutes; do not guess a string. |
| G-8 | **Anima's Tough / Heavy flags** are `[single source]` (§3.2). I read the union: `ImmunityFlag` (`types.ts` 452–478) has no `tough` and no `heavy`. | **Leave them out.** Do not widen a contract union for an unverified property that changes no number in §6 of the research. Do use the flags that *do* exist and that Anima needs: `immune-to-scan`, `immune-to-delay`, `immune-to-bribe`, `boss`. Note that `immune-to-threaten` also exists as a flag — but the three enemies here express Threaten through `threatenChance`, which is what §0.4 proves the byte actually is, so use the number, not the flag. |
| G-9 | Sphere-grid traversal for the party preset. | Same as `gagazet.ts`: leave `sphereGrid` minimal and flagged `[estimate]`. No source reconstructs a path. |
| G-10 | **Two reward items have no `ItemDef` row.** `ItemId` is a bare `string`, so a missing row compiles and then prints the raw id in the Steal/Results banner (`steal.ts#itemName` falls back to the id). Checked: `special-sphere`, `ability-sphere`, `silence-grenade`, `farplane-shadow`, `hi-potion`, `turbo-ether`, `ether`, `petrify-grenade`, `poison-fang` **all exist**; **`blk-magic-sphere` does not**. | Add the one missing `ItemDef` in `src/data/ffx/items/`, or leave the drop out. Do not ship an id with no row. |

---

## 3. The party build this chapter ships with

Model and justification exactly as `src/data/ffx/builds/gagazet.ts` does it: an authored
story-progress preset, `[estimate]` in the research's own sense, with `[verified]` /
`[decompiled]` components underneath. Source: §8 of the research, whose §8.4
cross-validation is what makes it more than a guess.

- **All seven characters available** (§8.1). Rikku joined two areas back, which is
  exactly why Steal is the lesson.
- **Stats**: §8.3's table, midpoint of each published range — the same rule `gagazet.ts`
  uses. **Promote the Yuna row from `[estimate]` to `[derived]`** and say why: §8.4's
  aeon-derivation reproduction validates it.
- **Active three**: **Tidus, Yuna, Rikku.** Tidus and Yuna carry two of the three Talk
  bonuses and Yuna owns both the Nul spells and the summon; Rikku owns Steal, and act
  one cannot be taught without her. **Wakka, Auron, Lulu, Kimahri on the bench** — all
  four are named routes in §7 (Wakka's third Talk bonus, Auron's Magic Break / Threaten,
  Lulu's Fury past Shell, Kimahri's Stone Breath), so every one of them is a real switch,
  not scenery.
- **Aeons**: Valefor, Ifrit, Ixion, **Shiva** at §8.4's derived tier-5 rows
  (Shiva HP 1,342 / MP 40 / STR 25 / DEF 23 / MAG 34 / MDEF 38 / AGI 22 / EVA 39 /
  ACC 13). §12 **C-10** says: if the chapter is played standalone, **pick the 180–209 row
  and freeze it**. We do; say so in the file.
  **`overdriveGauge` for Shiva is `0`, and that is a rule, not a choice** (§8.6) — she was
  obtained minutes ago and has never fought. Valefor 90, Ifrit 60, Ixion 60 (§8.6's
  midpoints). Do not "helpfully" start Shiva at 100.
- **Abilities known**: §8.5's table, and the design consequence it protects — **Yuna does
  not have Dispel here.** The answer to Seymour's Shell is Ixion's Aerospark, which is a
  free aeon sub-command. Handing the preset Dispel deletes the lesson.
- **Overdrives**: §8.6. Auron has Dragon Fang and **Shooting Star** (Spherimorph is
  mandatory, one region back, `[verified: 2 sources]`); **Banishing Blade** is reachable
  and the wiki names it for this fight, so give it to him — §7 row 7 depends on it.
  Wakka: Element Reels only. Lulu: Fury.
- **Equipment**: §8.8's loadout verbatim — Rin's Strength+5 % / Magic+5 % weapons and
  Seeker's armour, Auron's default Piercing katana, Kimahri's default Piercing spear,
  the three O'aka pieces, and **Rikku's Shell Targe with SOS Shell, which Tromell gives
  the party before the fight**. Three properties of this loadout are load-bearing and go
  in the file header: **nobody has an elemental ward** (he cycles all four; Nul spells
  are the answer), **nobody has Confuse protection** (§8.7: no Confuse Ward exists at
  this point in the game), and the one piece of the answer the player did not buy was
  handed to them by the enemy's retainer. See **G-7** on the exact ability strings.
- **Inventory**: §8.9, midpoints — and specifically **Petrify Grenade ×4** and
  **Poison Fang ×2**, because §7 rows 2 and 8 are unreachable without them and both come
  from a fiend the player has been fighting for two regions. **X-Potion ×2**,
  **Remedy ×3** (the Confusion answer), Elixir ×1.

---

## 4. Engine capabilities the fight needs that do not exist

Each row was found by **reading the engine**, not by grepping for a name. "Smallest
additive change" means the smallest change that leaves the capability general.

### 4.1 Enemy Cover — **MISSING**

- **Where it would live**: `src/battle/ffx/targeting.ts#redirectTarget` (lines 105–125),
  called per hit from `src/battle/ffx/abilities.ts#resolveAbility` (line 139).
- **What is there today**: the exact mirror image. `redirectTarget` opens with
  `if (attacker.side !== 'enemy') return target;` and then redirects an enemy's
  `physical` + `single-enemy` action to any living friendly carrying `guard` or
  `sentinel`. Party-side Cover of an enemy is simply not modelled anywhere.
- **Smallest additive change**: replace the early return with a side switch and add the
  symmetric branch — a party-side `physical` + `single-enemy` action aimed at an enemy is
  redirected to the first living enemy whose `flags.coversAlly === target.id`.
- **Contract impact**: one new **optional** field, `CombatantFlags.coversAlly?: CombatantId`
  in `src/battle/common/types.ts` (a contract file), plus the matching optional on
  `EnemyDef.flags`. Additive → allowed, needs a newest-first entry in
  `docs/CONTRACT-CHANGES.md` (`docs/CONTRACTS.md`, "Shared contracts are additive").
  No behaviour changes for any shipped chapter: no existing enemy sets the flag.
- **Test that proves it**: a party physical at Seymour with a living Guardian lands on
  the Guardian; the same command with both Guardians dead lands on Seymour; a Lulu
  Blizzara lands on Seymour either way.

### 4.2 An enemy that arrives mid-battle — **MISSING**

- **Where**: `src/battle/ffx/setup.ts#enemyToCombatant` hard-codes `removed: false`
  (line 159); nothing anywhere adds an enemy to `state.enemyIds` after setup
  (`setup.ts:320/329` are the only pushes).
- **What is already there** — more than expected:
  - `src/battle/ffx/predicates.ts#onField` / `#targetable` already honour `removed`,
    `flags.hidden` and `flags.untargetable`.
  - `src/battle/ffx/turnQueue.ts#letterTags` is explicitly written for "an enemy that
    joins mid-battle" (it re-keys on roster growth, `state.ts` comment lines 143–148).
  - `src/battle/ffx/engine.ts#checkEnd` (lines 390–403) tests `isAlive`, which requires
    `onField` — so an off-field Anima never blocks victory and never grants a false one.
- **Smallest additive change**: one new **optional** `EnemyDef.startsOffField?: boolean`
  (contract, additive), honoured in `enemyToCombatant` as
  `removed: e.startsOffField === true`; plus one engine-internal helper
  `revealEnemy(ctx, id, slot)` (new, ~15 lines, in `src/battle/ffx/forms.ts` beside
  `advanceForm`, which already does the CTB surgery this needs) that clears `removed`,
  sets the slot, puts `ctb = 0`, calls `normalise(ctx)` and emits the existing `summon`
  event with the enemy's id.
- **Why not a chained battle**: the chapter is one continuous fight and Seymour stays on
  the field throughout. A `nextGroupId` chain would take Seymour off the board between
  acts, contradicting §5.3 and every guide's description.
- **Presenter impact**: the `summon` event already exists in the union; the presenter's
  handler assumes an aeon. A builder must check `BattlePresenterEvents.ts` and either
  widen that handler or add an `enemy-arrival` case. **Flagged as a real risk (§10 R-3)** —
  it was not read for this preflight.

### 4.3 The pre-summon damage clamp and HP floor — **MISSING**

- **Where**: `src/battle/ffx/hp.ts#dealDamage` (line 42) is the single funnel for every
  HP change from the damage chain.
- **Smallest additive change**: two optional numbers on the **engine-internal**
  `ActorRuntime` (`src/battle/ffx/state.ts`) — `damageCapPerHit` and `hpFloor` — read at
  the top of `dealDamage` and cleared by the Macalania AI script when the summon fires.
  **No contract change**: `ActorRuntime` is not a contract file and nothing outside
  `src/battle/ffx/**` sees it.
- **Test**: a 12,000-damage hit on a full-HP Seymour leaves him at 1, not dead, and the
  summon fires; after the summon, the same hit kills normally.

### 4.4 Two actions in one turn (Multi-X) — **NO CHANGE NEEDED**

This was the change I expected to be largest and it is free. `resolveAbility`
(`abilities.ts`, lines 133–159) re-resolves targets **per hit** for a `random-enemy`
action (`isPerHitRandom`) and calls `consumeNulCharges` **per hit, inside the hit loop**.
So a single `AbilityDef` with `hits: 2` and `targeting: 'random-enemy'` gives exactly
what §12 **C-3** recommends — **two independent random picks, and one Nul charge absorbs
one hit** — with no engine edit at all. The pair in the decompiled data (`Multi-X` +
`Multi-X 2nd Hit`) ships as one record, and the file header says why.

### 4.5 An enemy Overdrive gauge that fills on being targeted — **PARTLY MISSING**

- **What is there**: `FFXCombatant.overdrive` works for enemies (the field's own doc
  comment names Braska's Final Aeon's scripted gauge), `addGauge`/`setGauge`
  (`overdrive.ts` 105–133) are side-agnostic, and the `charge` event plus
  `ActorRuntime.charge` already drive the telegraph banner and the CTB pip.
  `overdrive.ts:110/115` suppress Shield/Boost gauge effects for `side === 'aeon'` only,
  which is exactly Anima's canon Boost-independence (§3.4) — **do not "fix" that**.
- **What is missing**: a *targeted* hook. `onDamageTaken` only fires on damage, and a
  Boost turn can be targeted by a heal or a debuff.
- **Smallest additive change**: one engine-internal call site in
  `src/battle/ffx/abilities.ts#resolveAbility` (after `resolveTargets`, before the hit
  loop) into a new `overdrive.ts#onTargeted(ctx, target, by)` that adds a gauge amount
  read from an `ActorRuntime` field the Macalania script sets. No contract change.
- **G-1 applies**: the increment is an `[estimate]`.

### 4.6 A scripted opening that resolves before the first player turn — **MISSING**

- **What is there**: `src/battle/ffx/ai/yunalesca.ts#yunalescaEntryAction` is an entry
  action, but it is driven from a **form change**, not from battle start.
- **Smallest additive change**: one new **optional** `EnemyDef.statuses?:
  Partial<Record<StatusId, StatusInstance>>` (contract, additive — the field already
  exists in this exact shape on `AeonBuild` and `FFX2MemberBuild`, so it is a
  symmetry fix as much as a feature), applied in `enemyToCombatant`. The Guardians ship
  `protect`, Seymour ships `shell`, and the *performance* of the opening is staged by
  the `pre` story script (`fx` + `beat`), which is where §5.2 wants it: "a scripted
  pre-turn sequence, not three ordinary turns".
- **Smaller alternative that needs no contract change**: give the AI script a
  first-turn branch that casts the buffs. **Rejected** — it costs three enemy turns the
  research says are not turns, and the player would watch three menus resolve before
  acting.

### 4.7 Enemy item use and the Auto-Potion counter — **NEEDS A BRANCH, NO NEW CAPABILITY**

- **What is there**: `src/battle/ffx/ai/reactions.ts#collectBossCounters` is the hit hook
  for zero-CTB boss counters, already per-encounter (`script === 'seymour-flux'`,
  `'yunalesca'`, `'yu-yevon'`), and it already refuses to fire on enemy-side attackers
  and on a Threatened enemy. `ticks.ts:188`'s Auto-Potion is the **character equipment**
  path (HP < 50 %, `hasAuto`) and must not be reused.
- **Change**: one new branch keyed on the Macalania script id, calling into the new
  `src/battle/ffx/ai/seymour-anima-macalania.ts`. Engine-internal. Enemy Hi-Potion and
  Remedy are ordinary scheduled actions and need nothing new.

### 4.8 Aeon elemental absorb (Shiva's Ice Eater) — **MISSING, and it matters**

- **Where**: `src/battle/ffx/setup.ts#aeonToCombatant` sets `affinities: {}` **hard-coded**
  (line 123), and `applyEquipmentToCombatant` is called only for `activeIds` and
  `reserveIds` (line 337) — aeons are in neither list. `AeonBuild`
  (`types.ts` 2337–2356) has no `affinities` field.
- **Consequence today**: §7 row 13 (heal Shiva with her own Blizzara) and §6.4's
  "his Blizzaga step *heals your aeon*" both silently do nothing. Two of the eleven
  lessons in §10 are lost.
- **Smallest additive change**: one new **optional** `AeonBuild.affinities?:
  ElementalAffinities` (contract, additive), spread in `aeonToCombatant` instead of the
  hard-coded `{}`. Shiva's build row then declares `{ ice: 'absorb' }` citing §8.4
  ("Shiva's armor carries Ice Eater", `[verified: 2 sources]`).
- **Test**: a Blizzara from Shiva on Shiva produces a negative-`amount` `damage` event;
  Seymour's `mac-blizzaga` at Shiva does the same.

### 4.9 Talk with this chapter's own table — **NEEDS A BRANCH**

`src/battle/ffx/ai/index.ts#applyTalkTrigger` / `#talkAvailable` dispatch on the boss
standing opposite. Add a `seymour-anima-macalania` branch with its **own**
Tidus/Yuna/Wakka table (§13 row 4 — do not share Flux's). The bonus lands on `stats`,
not as a status, for the same reason `consumeSeymourTalk` does it that way.

### 4.10 Capabilities already present — verified by reading, **no work**

CTB ranks and prediction (`turnQueue.ts`) · `special-magic` and `fixed-no-variance`
formulas (`FormulaKey`, `formulas.ts`) · status bytes with the 254/255 semantics
(`statuses.ts#rollStatus`) · Nul charges consumed by the matching element, SOS-Nul never
consumed (`statuses.ts` 312–326) · Threaten's per-enemy decaying chance sourced from the
data byte (`setup.ts:317` → `ActorRuntime.threatenChance`) · Petrify + shatter + the
`shatterOnKill` extra (`scripted.ts`) · Steal's halving counter and one-success rule
(`steal.ts#resolveSteal`) · Boost ×1.5 taken / Shield ÷4 (`formulas.ts` 300–301) ·
**Aeon Ribbon as the mechanism** behind Pain failing on an aeon
(`setup.ts#AEON_INNATE_IMMUNITIES`) · 16-hit actions (`AbilityDef.hits` 0–16, and the
`always-break-damage-limit` doc comment already names Oblivion) · `untargetable` /
`hidden` flags for C-2 · form change with `statOverrides` and a fresh HP pool, which is
**exactly act three** (`forms.ts#advanceForm` restores `maxHp`/`hp` and applies
`statOverrides`, then gives the boss the next turn) · the enemy `charge` telegraph ·
Grand Summon's temporary gauge · the save shape (`SaveData.chapters` is
`Record<string, ChapterRecord>`, so a sixth chapter needs **no migration** — CHK-024).

---

## 5. Open canon questions

| ID | Question | Evidence | Recommendation | Blocks the build? |
|---|---|---|---|---|
| **C-11** | Does Auto-Potion fire on **any** damage or on **physical** damage only? | The FF Wiki contradicts itself on one page: *Seymour (FFX boss)* §Battle "whenever they **take damage**", §Strategy "whenever they are **hit with a physical attack**". *Guado Guardian*: "when damaged". `[single source, self-contradictory]` | **Ship "any damage"** — the majority reading and the harsher one — behind a single named constant (`AUTO_POTION_ON_ANY_DAMAGE = true`) so the other branch is one line away. | **No.** Ships behind a documented assumption. It changes the magic route's feel, not its viability, and the guide text must not claim either reading as canon. |
| **C-14** | Does the ice → thunder → water → fire order persist into **act three**? | The FF Wiki never restates the order for phase 3 — only "casts his -ra spells twice in one turn". The order claim is **GamerGuides alone** `[single source]`. All four Multi- rows exist in the data and nothing suggests a reset. | **Ship the order persisting.** It is the only sourced claim, the data supports it, and the chapter's entire tutorial payoff (the Nul finale) rests on it. | **No** — but it is the one to verify first if anyone ever gets footage. If it turned out false, act three would be unpredictable and the chapter would need a different finale. Record it as an assumption in the data file and in the guide's cite. |
| **C-2** | Is **Seymour targetable while Anima is out**? | He is clearly *present* — his only scheduled action for that stretch is a zero-hit no-op aimed at her slot (§4.1 `[decompiled]`). No source says whether the player can select him. The research calls this "the single most behaviourally load-bearing open question in the file". | **Present but untargetable.** Two independent reasons: the HD build explicitly prevents killing him before the summon, and a targetable Seymour in act two lets the player finish him and skip the aeon duel — contradicting every guide's three-act description. The engine supports it exactly: set `flags.untargetable` on the summon and clear it on the dismiss (`predicates.ts#targetable`). | **No**, but it is the **highest-consequence** assumption in the chapter. Write it in the data file header, in `docs/target/decisions.json`, and in the chapter's guide cite. |
| **C-3** | Do the two Multi- halves pick the same target, and does one Nul absorb both? | `monster_actions.json` assigns no target to the eight Multi- rows; the raw bytes say *Single Character* and the plain `-ra` rows are overridden to *Random Character*. Unknown either way. | **Two independent picks, one Nul per hit.** §4.4 above shows the engine already does exactly this for a `hits: 2` / `random-enemy` record — so the recommended reading is also the free one. | **No.** |
| **C-5** | Can a Shiva Overdrive be **banked out of act two into act three**? | A community strategy claims a stored Diamond Dust deletes act-three Seymour. Plausible under `ffx-combat-core` §6.5 (the gauge persists through dismiss, and only a **KO** zeroes it) but no primary source. | **Let it happen.** It follows from the documented persistence rule, so the engine does it for free, and it is a reward for understanding the gauge — the thing the chapter teaches. Do not add code either to enable or to block it. | **No.** |
| **C-8** | Do the Guardians award AP when the summon kills them? | Unsourced (worth 580 AP). | **Yes**, which `results.ts#collectRewards` already gives us: it pays every enemy that is not alive at the end. | **No.** |
| **C-1 / C-12 / C-13** | Rare steal item; branch priority; equipment roll counts. | §12. | Ship the decompile / the wiki's sentence order with an "unsourced order" comment / not modelled. | **No.** |
| **NEW-1** | **Is `public/art/portraits/seymour.png` human-form Seymour or Seymour Flux?** | `chapter-meta.ts` uses it as Chapter 1's `heroArtFallback`, and Chapter 1 is Flux. This chapter needs the **human** form (§9.2: different robes, no staff, courteous). | Look at the file before reusing it. If it is Flux, human Seymour is a **new** portrait and goes in §6's options round. | **Yes, for the art track only** — one image to open, and it decides whether the portrait is "reuse" or "new". Nothing in the engine or data track waits on it. |

**Questions for Bailey are collected at the end of this document.**

---

## 6. Assets — and the options round that has to come first

> **Hard rule 9.** The chapter's tile is a **gap**. Everything marked **NEW** below is
> something Bailey will see or hear, so it needs 2–4 options and a pick **before it is
> built**, and the pick is recorded in `docs/target/targets.json` with Bailey's own
> words. Nothing in this section may be started as a build.

### 6.1 Cast

| Asset | Status | Notes |
|---|---|---|
| **Seymour, human form** — `idle` / `cast` cutouts | **NEW** | §9.2 gives a fully sourced description in words. Direction (§9.2): courteous in the establishing frame and obscene in the same face two beats later, with no costume change. |
| **Seymour, human form — portrait** | **NEW or reuse**, see NEW-1 | |
| **Guado Guardian ×2** — `idle` / `cast` / `hurt` | **NEW** | §9.3. One visual job that is mechanical: **the belt pouch, visibly full and then visibly empty**, so a successful Steal reads at a glance. |
| **Anima** — `idle`, `attack`, `overdrive` | **EXISTS** — `public/art/characters/anima/` has all three | §9.4 note 2: Seymour's Anima is a **shorter model** than Yuna's. If the shipped painting reads as Yuna's Anima, that is a **knowing departure** and must be recorded on the tile, not silently accepted. |
| **Anima portrait** | **EXISTS** — `public/art/portraits/anima.png` | |
| **Shiva** — `idle`, `attack`, `overdrive`, portrait | **EXISTS** | §9.5. Her "**????**" state before naming (§9.5, `[single source]`, "ship it") is a **UI** behaviour, not an asset. |
| **Tidus / Yuna / Auron / Wakka / Lulu / Kimahri / Rikku** | **EXISTS** (cutouts + portraits) | |
| **Tromell** | **NEW, and optional** | Only if the pre/post scenes show him. A speaking part with no painting falls back to a name plate. Ask before commissioning. |

### 6.2 Scene and chrome

| Asset | Status | Notes |
|---|---|---|
| **Macalania Temple antechamber backdrop** | **NEW — the chapter's biggest art item** | §9.1's painter's brief is unusually specific and should be quoted into the prompt: everything is **ice pretending to be masonry**; gold Yevon metalwork set *into* the ice; **the single most valuable thing the painting can do is make the light travel through the walls**; **translucent**, where Gagazet is opaque. Must not share a palette with Gagazet. |
| **`SceneFactory` diorama** (`src/scenes/macalania-temple.ts` + `-debug.ts`) | **NEW build**, after the backdrop is picked | `src/scenes/gagazet.ts` is 877 lines; this is the largest single build item. |
| **Chapter-select card art** (`thumbnailKey`) | **NEW** | The approved parallax front end (`showpiece-frontend`) draws a silhouette from a character painting; `comingChapters.ts` already points its COMING card at one. |
| **Pause plate / hero art** (`ChapterMeta.heroArt`) | **NEW** | Same pattern as the five existing `pause/chN-*` plates, with an existing portrait as `heroArtFallback`. |
| **Pause snapshots ×3** | **EXISTS by rule** | `ChapterSnapshot.image` is documented as "always an **existing, already-shipped** asset — never a new commission". Backdrop + Anima idle + one party portrait. |
| **VFX** | **Mostly reuse** | Ice/fire/water/lightning spell VFX exist for the five chapters. **NEW**: Anima's arrival (§9.4 "the entrance is the chapter's money shot… a single continuous camera move, do not cut away") and **our own dark seal mark** — the canon glyph cannot be reused (hard rule 8), so this is an original mark that does the same job as Shiva's ice mark. |

### 6.3 Audio

| Cue | Status | Notes |
|---|---|---|
| **`boss-seymour-macalania`** (working key) | **NEW composition** | §9.8 is explicit: this fight has its **own** cue, and it is **not** "Challenge" (which belongs to the Flux chapter) and **not** "Fight With Seymour" (which is Omnis). A short loop, ~2:00–2:20, moderate and unhurried (120–132 bpm), orchestral and ceremonial, minor with insincere liturgical cadences, a **stated theme** (Seymour has an argument; the music should have a sentence), rising once at the summon and returning to composure. **Anti-brief**: no synth-industrial textures, no gated percussion, no relentless pedal ostinato — those are the Flux chapter's. **The two Seymour themes must be distinguishable within two seconds.** `docs/audio/THEMES.md` already has a SEYMOUR motif ("Noble Rot", C# minor) that `boss-seymour` uses; this cue is the *same motif, earlier and politer* — that is the composer's brief, and it is faithful, because the original score distinguishes them too. |
| **`scene-macalania-temple`** | **NEW composition** | The establishing cue for the antechamber. |
| **`victory-ffx`** | **EXISTS** | FFX chapters use it; the cue map never crosses the two scores. |
| **SFX** | **Reuse** | Ice/fire/water/lightning impacts, potion, steal, summon. **Possibly new**: the summon's low arrival, the "????" reveal. |
| **Judgement** | **Bailey's, by ear** | Hard rule 13: agents cannot hear. Both new cues go to `docs/audio/audition.html` as sketches and nothing is integrated before Bailey's verdict. |

### 6.4 The options round Bailey has to see first

Four picks, cheap and broad before anything expensive (the Progressive Target Resolution
ladder in `~/.claude/CLAUDE.md`):

1. **The antechamber**, 3 backdrop concepts at real resolution — the light-through-ice
   idea taken three different distances (cold-and-vast / warm-brazier-close / the
   Chamber door glowing through the wall behind the enemy line).
2. **Seymour, human form**, 3 concept frames — the face that has to be courteous and
   obscene at once.
3. **The two Guardians**, 2 concepts — how subordinate in silhouette, and how the pouch
   reads.
4. **Anima's arrival**, 3 faked screenshots of the finished moment plus a few lines on
   how it plays — this is the money shot and the one thing a still cannot fully answer.

Plus **two audio sketches** of the battle cue, ~45 s each, in the same slot, so Bailey
can hear "polite and wrong" against the Flux chapter's "oppressive and inhuman" in one
sitting.

---

## 7. Story beats (beats only — no dialogue)

Written to `research/writing-bible.md` §2.1 (FFX cutscene grammar) and §1.9 (Seymour's
voice: serene about atrocity). §13 row 5 of the research notes the writing bible's
five-chapter scope list predates this chapter and needs an **E8** outline plus a
**pre-Flux register** for Seymour — courteous, not messianic. That is a writing-track
task, not a blocker for the data track.

**Pre-battle** (§9.6, `[verified: 2 sources]`):

1. Jyscal's sphere names his murderer. Yuna hides it and tells no one, and decides to
   accept the proposal so she can deal with Seymour herself, alone.
2. The guardians find the sphere in her things and watch it in the Nuns' Chamber. The
   floor tilts.
3. Tromell escorts them, courteous and proud, and **gives them gifts** — including the
   armour they will use against his master within the hour.
4. The guardians confront Seymour in the antechamber **before Yuna comes out of the
   Chamber of the Fayth**.
5. He does not deny the patricide. He explains it. Then he works out what Yuna was
   really planning, and says so, because taking that from her costs him nothing.
6. Yuna emerges, having just received Shiva. Seymour stops pretending.
7. **Trigger Commands offered**: Tidus, Yuna, Wakka. Then `battleStart()`.

**Mid-battle** (`mid` triggers + `midScripts`, one short line each — three, matching the
three acts):

- **On Seymour at 50 %**: the summon. Yuna names what is arriving before the player sees
  it. (Dramatic irony worth surfacing: the Destruction Sphere in *this temple's* Cloister
  is one of the prerequisites for Yuna ever owning Anima — §8.4.)
- **On the first Boost**: somebody reads the window out loud. One line, not a tutorial.
- **On Anima's dismissal / Seymour restored**: his bar comes back. One line that says an
  HP bar is not a progress bar.

**Post-battle** (§9.7, `[verified: 2 sources]`):

8. Seymour falls. He is **properly dead**, not dissolved the way Flux will be. Flat,
   anticlimactic.
9. Yuna kneels to send him. **Tromell and the Guado take the body before she can**, brand
   the party traitors for killing a Maester, and **destroy Jyscal's sphere — the only
   evidence**.
10. Because he is not sent, he becomes an **unsent**: the villain who comes back three
    more times.
11. The party flees; the Guado pursue.

**The chapter framing, from §9.7 — if the chapter says one thing, say this:** this is the
one Seymour fight the party **wins cleanly and loses completely**. They kill him and it
costs them their standing, their evidence and their pilgrimage's legitimacy. The
mechanics rhyme with it: **the boss you beat gets his whole bar back once, and the thing
you actually killed was his mother.**

`victoryQuips`: written, unlike Chapter 4's deliberate silence — but short. The party has
just won and lost at the same time.

---

## 8. File plan, owners and order

Shared-file rule: **one integrator** touches the files below, and only after the track
files exist. Everyone else stays inside their own new files. Commit with an explicit path
list; never `git add -A`.

### 8.1 Files only the integrator may touch

| File | Why it is shared | What changes |
|---|---|---|
| `src/data/encounters.ts` | **contract file** | `ChapterId` union += `'seymour-anima-macalania'`; `Chapter.number` widens `1..5` → `1..6`; new `Chapter` record; `CHAPTERS` and `CHAPTER_IDS` += the chapter. **Needs a `docs/CONTRACT-CHANGES.md` entry.** |
| `src/battle/common/types.ts` | **contract file** | Three additive optionals: `CombatantFlags.coversAlly?`, `EnemyDef.startsOffField?`, `EnemyDef.statuses?`, `AeonBuild.affinities?`. **One CONTRACT-CHANGES entry covering all four.** |
| `docs/CONTRACT-CHANGES.md` | shared log | One entry, newest first. |
| `src/data/chapter-meta.ts` | shared registry | `ChapterMeta.numeral` widens to include `'VI'`; new meta record; `CHAPTER_META` += it. |
| `src/data/guides/index.ts` · `src/engine/tactics/index.ts` · `src/scenes/index.ts` (`SCENE_FACTORIES`) · `src/battle/ffx/ai/index.ts` · `src/audio/tracks/index.ts` | shared registries | One import + one map entry each. `ai/index.ts` also gets the Talk branch (§4.9). |
| `docs/target/targets.json` · `docs/target/decisions.json` | Bailey's board | Only after Bailey picks: move the tile from `gap`, record their words, the date and the `build` hint; record C-2, C-11 and C-14 as decisions with their state. |
| `docs/handoff/NOW.md` · `docs/handoff/chapter-macalania.md` | shared handoff | End of the track. |

### 8.2 Track files — parallel, no two agents in one file

| Track | Owns (all new files) | Model |
|---|---|---|
| **T1 Engine** | `src/battle/ffx/targeting.ts` (Cover branch), `hp.ts` (clamp/floor), `forms.ts` (`revealEnemy`), `overdrive.ts` (`onTargeted`), `abilities.ts` (one call site), `setup.ts` (three field reads), `ai/reactions.ts` (one branch) | **opus** — judgement: four contract fields and five seams in shared engine files |
| **T2 AI script** | `src/battle/ffx/ai/seymour-anima-macalania.ts` (new) | **opus** — three acts, a phase transition that kills its own allies, a target-class branch |
| **T3 Enemy data** | `src/data/ffx/enemies/seymour-anima-macalania.ts`, `-abilities.ts` (new) | **sonnet** — fully specified by §2 above |
| **T4 Party build** | `src/data/ffx/builds/macalania.ts` (new) | **sonnet** — fully specified by §3 |
| **T5 Story** | `src/story/scripts/seymour-anima-macalania.ts` (new) | **opus** — writing |
| **T6 Guide + tactic** | `src/data/guides/seymour-anima-macalania.ts`, `src/engine/tactics/seymour-anima-macalania.ts` (new) | **opus** — the tactic decides what the player is shown as correct, and the win-rate case in §9 hangs on it |
| **T7 Scene** | `src/scenes/macalania-temple.ts`, `-debug.ts` (new) | **sonnet** after the backdrop is approved |
| **T8 Audio** | `src/audio/tracks/boss-seymour-macalania.ts`, `scene-macalania-temple.ts` (new) | **sonnet**, sketches only, Bailey judges by ear |
| **T9 Tests** | `tests/unit/chapters/macalania*.test.ts`, `tests/unit/strategy-macalania.test.ts` (new); one widened union in `tests/e2e/chapters.spec.ts` (integrator) | **sonnet** |
| **T0 Art** | `docs/concepts/macalania/**` — options only | **sonnet**, GPU per NOW.md; **nothing integrated without Bailey's pick** |

### 8.3 Order

1. **Now (paper, no Bailey gate)**: T1 engine capabilities and T3/T4 data. They are
   independent of every art and audio decision and are the long pole.
2. **Now, in parallel**: T0's options round and T8's two audio sketches → **Bailey**.
3. **On Bailey's picks**: T7 scene, the art build, the audio integration.
4. **After T1 + T3**: T2 AI, then T6 guide/tactic, then T5 story.
5. **Integrator last**: the shared registries and `encounters.ts`, in one commit, so the
   chapter appears on the board only when it is playable. T9 lands with it.
6. Then: `npx tsc --noEmit`, the full `npm test`, `node tools/orphans.mjs` (hard rule 4 —
   this chapter adds nine modules that nothing imports until step 5), a real-input browser
   pass, screenshots, `node tools/critic-plan.mjs` (it **will** say DEEP: this touches the
   combat core, the asset loader and a new chapter), and only then a release.

---

## 9. Acceptance cases

| # | Case | Passes when |
|---|---|---|
| A-1 | **Seeded win**, `intendedStrategy` against the real engine, headless — the `tests/unit/strategy-seymour-flux.test.ts` harness | 40 seeds, target **≥ 85 % wins**. The shipped tactic must play §7's line: Steal from each Guardian, Petrify or kill them, summon Shiva for act two, Shield before Oblivion, save Diamond Dust for a Boost turn, and pre-cast the matching Nul each turn in act three. Below 85 % the tactic is wrong before the encounter is. |
| A-2 | **Credible-mistake loss** | A run that never Steals, never summons for act two, and never pre-casts a Nul **loses**, on a majority of 20 seeds. A tutorial chapter that cannot be lost by ignoring its own lessons is not teaching them. |
| A-3 | **Act-one floor** | On 20 seeds, Seymour's HP never reaches 0 before `animaSummoned`; a single 12,000 hit leaves him at exactly 1; every living Guardian is dead on the turn Anima arrives. |
| A-4 | **Pain's asymmetry** | Pain on a party member KOs them (chance 100 vs resistance 0). Pain on Shiva deals 459–518 and applies **no** `ko` — and the test asserts the mechanism, reading Shiva's `immunities['ko'] === 255` from `AEON_INNATE_IMMUNITIES`, not a hard-coded exception. |
| A-5 | **Pain is not Pain** | `anima-pain-boss.power === 28` and `!== ` the player-aeon `pain` record's power. Pinned as its own test (§13 row 8 is a blocker). |
| A-6 | **Cover** | A party physical at Seymour with a Guardian standing resolves against the Guardian; with both dead, against Seymour; a Blizzara at Seymour is never redirected. |
| A-7 | **Steal economics** | One successful Steal per Guardian stops Auto-Potion and Hi-Potion-on-Seymour and **leaves both Remedy branches firing**. A poisoned Seymour with two stolen-from but living Guardians is still Remedied. |
| A-8 | **Act three** | Anima at 0 → Seymour back to 6,000 with `mag === 32`; a Multi- turn produces **two** `damage` events with two independently drawn targets; one Nul charge absorbs exactly one of them. |
| A-9 | **Element cycle** | Over 12 consecutive Seymour turns in act one the order is ice, lightning, water, fire, repeating, with no variation; with a player aeon on the field the same cycle fires the `-ga` tier, **including Blizzaga into a Shiva who absorbs it** (assert a negative `amount`). |
| A-10 | **Real-input route** | Chapter select → party prep → pre cutscene → battle → post cutscene → results, driven with real key presses in a browser at `PYREFLY_BROWSER=gpu`, 0 console errors, 0 404s, screenshot under `docs/screenshots/`. This is what `critic/CHECKS.md` CHK-023 asks for and what a green unit suite cannot see. |
| A-11 | **Both-games absence** | The new `EnemyDef.statuses`, `startsOffField` and `coversAlly` fields, and the Cover branch, are asserted **not** to change any FFX-2 outcome: run the two X-2 chapters' existing strategy tests unchanged and assert identical results at the same seeds. Steal, Nul, Threaten and the CTB clamp are FFX-only by construction (`steal.ts`'s own header states the rule). |
| A-12 | **Orphans** | `node tools/orphans.mjs` clean after the integrator's commit — nine new modules, and hard rule 4 has been violated four times in this subsystem already. |
| A-13 | **Approved-target parity** | Every asset in §6 that Bailey picked is compared target-beside-build (`tools/end-state-board.mjs --pair`), and any knowing departure (e.g. Anima's model size, §6.1) is written on the tile rather than passed over. |

---

## 10. Size and risks

**Size: 6 agent-tracks**, ≈ 9 new source modules + 4 new test files + 7 shared-file edits.

| Track | Estimate |
|---|---|
| T1 engine (4 contract fields, 5 seams, tests) | **1 track, opus** |
| T2 AI + T3 enemy data + T4 build | **2 tracks** (opus, then sonnet ×2 in parallel) |
| T6 guide + tactic (and the 40-seed tuning loop behind A-1) | **1 track, opus** |
| T5 story + T9 tests | **1 track** |
| T7 scene + T8 audio + integration | **1 track**, gated on Bailey's picks |
| T0 art options | outside the code budget; GPU, and NOW.md must say art generation is on |

Comparable: Chapter 1's scene alone is 877 lines and its tactic 751. This chapter is
**larger than any existing chapter** because it is three acts with three different correct
answers, and it is the only one that needs an enemy to arrive mid-battle.

| # | Risk | Mitigation |
|---|---|---|
| **R-1** | **Act three lands on an unsourced order (C-14).** The whole tutorial payoff rests on one guide. | Ship it, label it, and put the assumption in `decisions.json` so it is visible rather than buried. It is not a code risk; it is a fidelity risk. |
| **R-2** | **C-2 guessed wrong.** If Seymour turns out targetable in act two, the fight we ship is *harder* than canon, not easier. | The flag is one line (`flags.untargetable`); flipping it later is trivial. Recorded as a decision. |
| **R-3** | **The presenter's `summon` handler assumes an aeon.** `src/engine/BattlePresenterEvents.ts` was **not read** in this preflight. Anima's arrival may need a presenter change that this plan has not sized. | First task of T1: read that handler before writing `revealEnemy`. If it needs a new event case, that is an additive union member and another CONTRACT-CHANGES line — but it is also the kind of thing that turns a one-line reveal into half a track. |
| **R-4** | **Aeon affinities (§4.8) is a contract change discovered late** and touches every chapter that summons. | The change is a spread replacing a hard-coded `{}`; every existing `AeonBuild` omits the field and gets `{}` as before. Pin that with a test on the three existing FFX chapters. |
| **R-5** | **Difficulty.** §6.4 says one act-three Multi hit is a **kill** on Lulu at this build point, and an unshielded Oblivion **wipes the party**. The chapter is meant to be the FFX tutorial. | §10's own caveat is the answer and it is canon: the lever is the **MP economy** (Yuna's Nul spells cost 2 MP each against 150–210 MP), not softened damage. Measure it in A-1/A-2 and bring Bailey *measured* options if it misses. Never tune the boss's numbers (`memory/boss-side-fix-needs-measured-options`). |
| **R-6** | **Art is the long pole and it is entirely gated on Bailey.** Two new paintings (backdrop, human Seymour), two new Guardians, two new cues. | Start T0 and T8 in parallel with T1 today, so the gate is reached while the engine work is still running. |
| **R-7** | **Shared tree.** Several agents are working right now and `encounters.ts` / `types.ts` are the two files every track wants. | One integrator, last, one commit, explicit paths. The nine track files collide with nobody. |
| **R-8** | **Review depth.** `critic-plan` will class this DEEP (combat core + new chapter), and the repair-cycle cap in usage mode NORMAL is 2. | Budget the deep review into the plan, not after it. Do not deploy if the deep review cannot be run (AGENTS.md, Release). |

---

## Verdict

**PROCEED.**

The research is unusually complete: the encounter is fully specified as data, every
number carries a confidence tag, and the four open canon questions all have a
recommendation that ships safely behind a documented assumption. The engine is closer
than expected — Nul consumption, the Aeon Ribbon, Threaten's data byte, `untargetable`,
form changes with stat overrides, and the free two-hit/two-target behaviour are all
already there — and the five genuine gaps are small, additive and general. Four
contract fields, all optional, all with an existing symmetric precedent.

Two things gate the work rather than stopping it, and they must be honoured:

1. **Nothing Bailey will see or hear gets built before the §6.4 options round.** The
   tile is a gap; hard rule 9 is not waived by the chapter being approved.
2. **`anima-pain-boss` must never share a record with the player's `pain`**, and the
   two Seymour Trigger Command tables must never be shared. Both are recorded as
   blockers in the research's own §13.

The engine and data tracks (T1, T3, T4) can start today, on paper's authority alone,
because they are things Bailey never perceives.

---

## Addendum, 2026-09-22: fix-pass preflight (presenter arrival, eject, results)

Written during the fix pass on 62b4927, not before its first line of code: the
presenter work started as the critical defect's repair and `critic-plan --paths`
classed it **DEEP** (battle presenter, chapter registry, global layout) once the
file list was known. Recorded here so the paper trail rule 15 asks for exists,
and honestly dated.

**What changes, and the game case.**

| Change | Files | Case |
|---|---|---|
| A `part-restored` for an enemy the stage never built is staged through a new optional `BattleStage.arrive`, held until the mid-battle beat right behind it has played, then the scene's arrival director runs (Anima: A's staging + B's tag, INFERRED) | `BattlePresenterArrivals.ts` (new), `BattlePresenterEvents.ts`, `BattlePresenter.ts` (flush at burst end), `BattlePresenterPorts.ts`, `BattlePresenterStage.ts`, `StageArrivals.ts` (new), `scenes/types.ts`, `scenes/index.ts`, `scenes/macalania-temple-arrival-battle.ts` (new) | plumbing **both**; the director FFX only |
| `status-add eject` on an enemy dissolves it and takes it off the field (stone grey after a petrify) | `BattlePresenterArrivals.ts` | **both** |
| Drops merge repeated items; a long ITEMS row steps down a size | `resultsMath.ts`, `ResultsScreen.ts`, `results.css` | **both** |

**Risks, and what bounds each.**

1. *Another chapter's `part-restored` changes.* Only an **unstaged** part takes the
   new path; a staged one (the Yu Pagodas, Vegnagun's parts) keeps the old fade. A
   presenter test pins both. No other shipped chapter reveals a `flags.hidden` enemy.
2. *The hold never releases.* It flushes at the next non-script event and at the
   end of every burst, and `settled` caps the whole arrival at 9 s.
3. *Eject on the party.* Not touched: the engine does not refill the slot and what
   FFX draws is not sourced here, so a party Eject keeps its old behaviour.
4. *Skip speed / e2e.* The arrival lands its end state at once when the presenter
   runs at `'skip'` (a test pins the clock's `instant`).
5. *Results layout in FFX-2.* Merging drops only shortens the string; the smaller
   size applies only past 26 characters.

**Verification planned:** failing-first unit tests for each rule, then one real
battle in a GPU browser (seed 1, the intended line): the Guardians leave on the
shatter, Anima is staged and visible through act two with the rail showing her,
act three removes her chains and restores Seymour, the results ITEMS row clears the
party list.
