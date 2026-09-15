# FINAL FANTASY X-2 — Vegnagun & Shuyin (Farplane, Chapter 5)
### Implementation-ready research dossier for *Pyrefly Reprise*

**Scope:** the five-battle finale chain at the Heart of the Farplane — Vegnagun (Tail) → Vegnagun (Leg) + Nodes → Vegnagun (Body/Core) + Bulwarks → Vegnagun (Head) + Redoubts → Shuyin — plus party loadouts, the ending conditions, scene beats, and art direction.

**Primary data source ranking used here:**
1. `SinirothX — "Enemy Encyclopedia" (GameFAQs, 2007)` — decompile-derived stat/AI/damage-constant dump. **Treated as authoritative** where it conflicts with anything else.
2. Final Fantasy Wiki (fandom) enemy pages — matches SinirothX on almost every field; used for corroboration → `[verified: 2 sources]`.
3. GamerGuides / Hamfruitcake_09 walkthroughs — strategy, battle flow, qualitative claims.

**Confidence tags:** `[verified: 2 sources]` · `[single source]` · `[estimate]` (derived by me, or community consensus with no hard source).

> ⚠️ **Not verbatim.** All scene text below is paraphrased. A handful of iconic lines are quoted at <15 words each, only where they carry the beat. *Pyrefly Reprise* writes its own dialogue — treat these as **timing/tone anchors, not script**.

---

## 0. Corrections to the brief

> **Read first — two corrections added on the 2026-09-15 gap-fill pass that change code, not prose:**
> 1. **Chain multiplier.** The damage flowchart's step 13 is `× (1.40 + 0.05 × chainNumber)`, **not** the `× 0.5` that SinirothX's guide prints. Earlier revisions of this document copied the typo. See the boxed note under §1.1.
> 2. **Magic/Defense.** The FF Wiki's infoboxes transpose Magic and Defense for the Leg, Body, Bulwarks and Head. **The stat blocks in §3 are the SinirothX values and are correct as printed — do not "fix" them against the wiki.** See the §3 header.
>
> Two further additions: §4.2 now specifies the Head battle's fail clock as Shuyin's seven-line speech counter, and a new §4.3 defines the battlefield coordinate system that the Bulwarks' 5 m radius and the Chain system's approach time are measured in.


The task brief guessed at part names and order. The real chain is:

| # | Brief guessed | **Actual** | Bestiary # |
|---|---|---|---|
| 1 | Leg | **Vegnagun (Tail)** | #244 |
| 2 | "Nose?" | **Vegnagun (Leg)** + Node A/B/C | #245, #246–248 |
| 3 | — | **Vegnagun (Body/Core)** + Right/Left Bulwark | #249, #250–251 |
| 4 | Head/Core | **Vegnagun (Head)** + Right/Left Redoubt | #252, #253–254 |
| 5 | Shuyin | **Shuyin** | #255 |

`[verified: 2 sources]` — bestiary numbering is contiguous and self-consistent across all seven wiki pages and SinirothX's ordering.

Other corrections:
- There is **no "Nose"** part and **no "Turbo Hydra"/"Rasher"/"Purified Light"** ability. Vegnagun's attacks are **Latin-named**; Shuyin's are **renamed Tidus Overdrives**.
- **The "charging/countdown" is two separate mechanics**, not one: `Charge Core → Memento Mori` on the **Body**, and a **real-time cannon timer** on the **Head**.
- **Shuyin's HP is 23,850**, not ~30,000. `[verified: 2 sources]`
- FFX-2 is **ATB (Active Time Battle) with per-ability charge/recovery times**, *not* the CTB of FFX. If *Pyrefly Reprise* shares a turn engine with its FFX encounters, this chapter needs a separate ATB mode.

---

## 1. Battle-system primer (needed before any stat block is usable)

### 1.1 The damage flowchart

Verbatim-structure port of SinirothX's decompiled flowchart. Apply **in order**; truncate to integer at each step. `[single source]` (but every worked example below reproduces published in-game numbers, so treat as high confidence).

| Step | Rule |
|---|---|
| **1. Base** | Physical: `(Lv + Str) × Lv × Str / 1024 + Str`<br>Magic / Magic-recovery: `Lv × 2 + Mag`<br>Special Magic: `(Lv + Mag) × Lv × Mag / 1024 + Mag`<br>Fractional: `target max(or current) HP/MP × fraction`<br>Constant: a flat number (randomised in step 7) |
| **2. Const (magic)** | Magic: `× const² / 64` · Magic-recovery: `× const² / 128` |
| **3. Defense** | Physical: `× (270 − target DEF) / 255`<br>Magic / Special Magic: `× (270 − target MDEF) / 255`<br>(Tableturner inverts: `× (15 + DEF) / 255`) |
| **4. Str/Mag buff** | `× (12 + user StrUp/Down level) / 12` (magic uses MagUp/Down) |
| **5. Def/MDef buff** | `× (12 − target DefUp/Down level) / 12` |
| **6. Const (physical)** | Physical / Special Magic: `× const / 16` |
| **7. Randomise** | `× (240…271) / 256` — roll per hit |
| **8. Additive** | Finale `+99999`; Momentum `+ kills so far` |
| **9. Critical** | `× 2` |
| **10. Berserk** | `× 1.25` |
| **11. Back attack** | Protect-reducible attack from behind: `× 2` |
| **12. Multipliers** | Fiend Hunter vs correct species `×4`; Alchemist/Double All on items `×2`; Magic Booster `×1.5` |
| **13. Chain** | `× (1.40 + 0.05 × chainNumber)` — **corrected; do not copy SinirothX verbatim here.** See the correction note directly below this table |
| **14. Element** | weak `×2` (stacks) · half `×0.5` (once) · null `×0` · absorb → heals |
| **15. Multi-target** | Black/White magic hitting all: `× 0.5` |
| **16. Shell / Protect** | matching attack type: `× 0.5` |
| **17. Defend** | Protect-reducible attack on Defending char: any damage ≥2 → **1** |
| **18. 9999 status** | Cat Nip critical: damage 1–9998 → **9999** |
| **19. Limit** | 9999 cap unless Break Damage Limit; **items & item-named abilities never break it** |
| **20. Immunity** | Null Physical / Null Magic / Invincible / fractional-immune → "immune" |

> ### ⚠ Correction to step 13 (Chain) — **blocker-grade; read before implementing anything**
>
> SinirothX's flowchart writes step 13 as `× (1.4 + chain number × 0.5)`. **That is a transcription typo for `× 0.05`, and earlier revisions of this document reproduced it verbatim.** It is corrected in the table above. `ffx2-combat-core.md` §1.7 records the same correction and is the normative source for the Chain system; this document defers to it.
>
> | Quantity | Correct value | Value if the typo is implemented | Confidence |
> |---|---|---|---|
> | Multiplier at "Chain x1!" | **×1.45** | ×1.9 | `[verified: 2 sources]` (FF Wiki *Chain*; Split Infinity G0912, credited to Zeruel) |
> | Increment per additional link | **+0.05** | +0.5 | `[verified: 2 sources]` |
> | General form | `chainMult = 1.40 + 0.05 * chainNumber` | `1.4 + 0.5 * chainNumber` | `[verified: 2 sources]` |
> | Chain 10 | **×1.90** | ×6.4 | derived |
> | Chain 99 (max, "Full Chain") | **×6.35** | ×50.9 | `[single source]` |
> | Published ceiling | "more than 600%" — consistent with ×6.35 at Chain 99 | exceeded by Chain 10 | `[verified: 2 sources]` |
>
> The typo is self-refuting: `0.5` contradicts the independently-sourced ×1.45 first link, and blows past the game's own stated "600% maximum" by Chain 10. Chain is the signature FFX-2 mechanic and sits at step 13 of 20, so the error compounds into every damage number in §1.2 below and every balance assumption in this chapter. **Implement `1.40 + 0.05 * chainNumber`.**
>
> Reference implementation (matches `ffx2-combat-core.md` §1.7 exactly):
>
> ```ts
> // chainNumber is the 1-based link index shown in the UI as "Chain x1!", "Chain x2!", ...
> // chainNumber === 0 means "not chained"; the multiplier must be 1.0, NOT 1.40.
> const chainMult = (chainNumber: number): number =>
>   chainNumber <= 0 ? 1.0 : 1.40 + 0.05 * Math.min(chainNumber, 99);
> ```
>
> Chain-window rules that go with it (from `ffx2-combat-core.md` §1.7): the window is **2 s** after a normal hit, **3 s** after a critical; the counter is **per-target**; a chained target **cannot evade** and **cannot start a new action**; enemies chain the party by the identical rules. In this chapter that last clause matters — Odi Et Amo's 16 hits and Terror of Zanarkand's 9 hits self-chain against your party.

### 1.2 Worked examples (use these as engine regression tests)

All computed from the flowchart + the stat blocks in §3. `[estimate]` (derivation) except where an official number is reproduced.

| Attack | Attacker | Math | Result | Cross-check |
|---|---|---|---|---|
| **Terror of Zanarkand** (per hit) | Shuyin L58 Str47, ignores DEF | base `(58+47)×58×47/1024+47 = 326` → `×10/16 = 203` → `×240–271/256` | **190–215 per hit ×9 = 1,710–1,935** | Wiki states "190~214 base damage each hit" ✅ `[verified: 2 sources]` |
| **Noli Me Tangere** | Tail, constant 1250, all | `1250 × 240–271/256` | **1,171–1,323 to whole party** | Guides quote "1,250 HP" ✅ |
| **Tail Beam** | Tail, fractional 5/16 max HP | `maxHP × 0.3125` | **31.25% of one char's max HP** | ✅ |
| **Vita Brevis** | Leg L38 Mag18, const 40, all | base `76+18=94` → `×1600/64 = 2350` → `×(270−96)/255 = 1603` | **~1,500–1,700** vs MDEF 96, halved by Shell | matches "powerful damage to entire party" |
| **Memento Mori** | Body L43 Mag42, const 28, all | base `86+42=128` → `×784/64 = 1568` → `×(270−96)/255 = 1069` | **~1,000–1,130** vs MDEF 96 | — |
| **Pallida Mors** | Head L57 Mag52, const 26, single | base `114+52=166` → `×676/64 = 1753` → `×(270−96)/255 = 1196` | **~1,120–1,265** | — |
| **Nemo Ante Mortem Beatus** | Head, const 30, all | base 166 → `×900/64 = 2334` → `×0.682 = 1592` | **~1,490–1,685 party-wide** | "most powerful ability" ✅ |
| **Mors Certa** | Head, const 12, all | base 166 → `×144/64 = 373` → `×0.682 = 254` | **~240–270 + 80% Silence/Darkness/Poison** | — |
| **Odi Et Amo** | Head, const 6 ×16 | base 166 → `×36/64 = 93` → `×0.682 = 63` | **~59–67 × 16 ≈ 950–1,070**, strips buffs | — |
| **Force Rain** | Shuyin L58 Mag42, const 20, all | base `116+42=158` → `×400/64 = 987` → `×0.682 = 673` | **~630–715 party-wide** | — |
| **Spin Cut** | Shuyin, const 24, phys | `326 × (270−DEF)/255 × 24/16` | vs DEF 139: **~235–265** · vs DEF 12: **~465–525** | — |
| **Shuyin normal Attack** | Shuyin, const 16, phys | `326 × (270−DEF)/255` | vs DEF 139: **~157–177** · vs DEF 12: **~310–350** | — |

**Design read-out:** Vegnagun's whole moveset is **magic-type or fractional**, so *Shell*, *Magic Defense*, and *Magic Defense Up* are the party's real mitigation; *Protect* only matters against Shuyin. Conversely **Shuyin is almost entirely physical** (only Force Rain is magic), so *Protect* is his counter — and Terror of Zanarkand pierces DEF entirely, so no amount of armour stops it. That asymmetry is the single most important implementation note in this document.

### 1.3 Status set

FFX-2 statuses referenced in these fights: Death/KO, Petrification (Break/Stone), Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, Doom (counted), Delay, Interrupt Action, Slow, Stop, Haste, Reflect, Regen, Protect, Shell, Auto-Life, Spellspring, and the ±"Up/Down" stat levels (Str/Mag/Def/MDef/Acc/Eva/Luck, integer levels feeding formula steps 4–5). "Fractional Damage immunity" is a distinct flag. `[single source: SinirothX]`

---

## 2. The chain: order, arena, music, transitions

| # | Enemy group | Arena beat | BGM | JP title |
|---|---|---|---|---|
| 1 | **Vegnagun (Tail)** | Party splits into three teams; YRP take the tail | **"Crash"** | 激突 *Gekitotsu* |
| 2 | **Vegnagun (Leg)** + Node A/B/C | Leblanc Syndicate is beaten off the leg first; Nodes hang far overhead | **"Crash"** (shared) | 激突 |
| 3 | **Vegnagun (Body/Core)** + Bulwarks | **Point of no return** — Nooj & Gippal fail here | **"Clash"** | 死闘 *Shitō* |
| 4 | **Vegnagun (Head)** + Redoubts | Cannon deploys; **real-time fail timer** | **"Ruin"** | 破滅 *Hametsu* |
| 5 | **Shuyin** | Shuyin leaves Baralai, takes corporeal form | **"Their Resting Place"** (NA sphere-theater: "Resting Place") | 終焉 *Shūen* |

`[verified: 2 sources]` for BGM mapping (FF Wiki OST article + Vegnagun/Shuyin pages).

Adjacent tracks for the surrounding scenes:
- **"The Colossus"** (大いなる存在 *Ōi naru Sonzai*, "Great Being") — Vegnagun's leitmotif; plays whenever Vegnagun is discussed and in the **second part of the Farplane Abyss**.
- **"Vegnagun Awakens"** (ヴェグナガン起動) — plays when Shuyin activates Vegnagun.
- **"The Farplane Abyss"** (異界の深淵 *Ikai no Shin'en*) — the Farplane field theme.
- **"1000 Words"** (Piano Version, subtitled *A Wish That Spans the Ages*) — the Lenne reunion.
- **"Ending — Until We Meet Again!"**, then **"1000 Words (Orchestra Version)"** over the credits.

**Mood notes for original composition (describe-only, no transcription):**
- *"Their Resting Place"* is short (~2:33), slow, and built on a **minor-mode reharmonisation of the "1000 Words" melody** — a love song played as a dirge. It is deliberately *not* a heroic final-boss theme: it's grief with a pulse under it. Design cue: the player should feel they are fighting a suicide, not a villain.
- *"The Colossus"* is low, slow, and ceremonial — awe rather than menace.
- *"Ruin"* (head phase) is the only track in the chain with real urgency; pair it with the visible cannon charge.

**Unique battle-entry transition:** Vegnagun's battles do **not** use FFX-2's normal shattering-glass battle wipe. Instead the screen is **sucked into a black hole**. `[single source: FF Wiki]` — cheap and very striking to reproduce in HD-2D: radial UV pinch + inward particle draw.

**Running Farplane-voice system (all five battles):** Braska, Auron and Jecht speak from the Farplane during the fights, and Shuyin taunts from Vegnagun's cockpit. These fire from the AI scripts (see §5) as **no-action turns** — the boss burns a turn to let a voice line play. Implement as a "flavour turn" action type that consumes an ATB slot and displays a subtitle. (Write your own lines; the originals are catalogued in the wiki AI dumps.)

---

## 3. Stat blocks

Column order everywhere: **HP / MP / Str / Mag / Def / MDef / Agi / Acc / Eva / Luck**.

> ### ✓ Wiki-vs-decompile conflict — **RESOLVED 2026-09-15, in favour of SinirothX**
>
> Earlier revisions resolved the Magic/Defense transposition by behavioural inference only. It has now been checked against the **primary text of SinirothX's *Enemy Encyclopedia*** (GameFAQs guide 31807, read directly), and the resolution is data, not inference.
>
> **The decisive fact:** SinirothX does **not** publish a column dump. Every stat sits on its own explicitly-labelled line — `- Strength: 56` / `- Magic: 52` / `- Defense: 71` / `- Magic Defense: 59`. A systematic column-order confusion is structurally impossible on his side. The Final Fantasy Wiki, by contrast, fills a hand-edited infobox whose slot order is `Strength | Magic | Defense` then `Magic Defense | Agility | Accuracy`, while the game's own native stat order is `Str, Def, Mag, MDef`. An editor copying a dump straight down therefore lands **Defense in the `magic` slot and Magic in the `defense` slot** — exactly the error observed, and a *per-page* error, which is what hand-editing produces and a machine dump cannot.
>
> **Corroboration that the wiki is the transposed party:** on the pages where the wiki happens to be filled correctly it agrees with SinirothX field-for-field — Tail, Node A/B/C, both Redoubts, Shuyin. The Shuyin row is confirmed a third time by jegged.com, which prints it in native order (Str 47, Def 132, Mag 42, MDef 92) and matches both. Four right, four transposed, on one hand-edited wiki: normal. Four right, four transposed, in one machine-generated dump: impossible.
>
> | Enemy | SinirothX — **authoritative, use these** | FF Wiki infobox | Verdict | Impact of picking wrong |
> |---|---|---|---|---|
> | Tail | Mag 72 / Def 82 | Mag 72 / Def 82 | agree ✓ | — |
> | **Leg** | **Mag 18 / Def 13** | Mag 13 / Def 18 | wiki transposed | negligible (≤6% on Vita Brevis, ≤2% on physical routes) |
> | Node A/B/C | Mag 16 / Def 244 | Mag 16 / Def 244 | agree ✓ | — |
> | **Body / Core** | **Mag 42 / Def 98** | Mag 98 / Def 42 | wiki transposed | **large** — wiki values make Memento Mori ~44% stronger and the Core ~32% softer to physicals |
> | **Bulwark R/L** | **Mag 48 / Def 58** | Mag 58 / Def 48 | wiki transposed | negligible — the Bulwarks have **no** Mag-scaled or Str-scaled ability at all (every offensive move they own is `fractional`), so only the 58-vs-48 Def swing is live, worth ~5% on 3,000 HP |
> | **Head** | **Mag 52 / Def 71** | Mag 71 / Def 52 | wiki transposed | moderate — ~11% on every Head payload, ~10% on physical routes |
> | Redoubt R/L | Mag 41 / Def 133 & 0 | Mag 41 / Def 133 & 0 | agree ✓ | — |
> | Shuyin | Mag 42 / Def 132 | Mag 42 / Def 132 | agree ✓ (+ jegged) | — |
>
> `[verified: 2 sources — SinirothX guide primary text (per-stat labelled lines) + every FF Wiki infobox re-read directly 2026-09-15; the Shuyin row triangulated a third time against jegged.com]`
>
> **Implementation rule: the stat blocks printed below are the SinirothX values and are correct as written. Do not "fix" them against the wiki.** If you want a sanity switch, expose `USE_WIKI_STAT_ORDER = false` and leave it false; flipping it should reproduce the wiki numbers exactly and is useful only for diffing against wiki-derived community tools.
>
> **Sizing the risk honestly:** for the Leg and the Bulwarks the disagreement is mechanically inert or near-inert. For the Head it is a ~10% band. Only the **Body/Core** pairing genuinely changes how the fight plays, and that is the one to protect with a regression test (see §1.2's Memento Mori row: **~1,000–1,130** party-wide is correct; if you see **~1,440–1,630** you have the wiki's Mag 98 wired in).
>
> ### ✓ Bulwark level — **RESOLVED; there was never a real conflict**
>
> SinirothX's Bulwark entry reads `- Monster's Level: 39` immediately followed by `- Oversoul Level: 47`. **The wiki's "47" is the Oversoul level**, copied into the ordinary level field. The Bulwarks cannot Oversoul in this battle, so **Level 39 is correct.** The same Oversoul pairs run through the whole chain and explain the pattern: Tail 41/49, Leg 38/46, Body 43/52, **Bulwark 39/47**, Head 57/68, Redoubt 40/48, Node 52/—. `[verified: 2 sources — SinirothX primary text + the wiki's own figure re-identified as the Oversoul value]`
>
> Level feeds step 1 of the damage flowchart directly, so this matters in principle — but note that **every offensive ability the Bulwarks own is `fractional`** (3/16 or 5/16 of max HP/MP), and fractional base damage does not read Level, Str or Mag at all. The Bulwarks' Level, Strength and Magic are therefore **dead stats** for damage purposes in this encounter; they survive only in accuracy/steal/status-resistance rolls. Implement 39 and move on.

### 3.1 Vegnagun (Tail) — battle 1

| Field | Value |
|---|---|
| Level | 41 (Oversoul 49 — unreachable, cannot Oversoul) |
| **HP / MP** | **34,200** / 9,999 |
| Str / Mag | 77 / 72 |
| Def / MDef | 82 / 76 |
| Agi / Acc / Eva / Luck | 115 / 0 / 0 / 3 |
| Thinking period | 0 (acts immediately when ATB fills) |
| EXP / AP / Gil | 5,000 / 5 / 3,000 (Pilfer Gil 3,000) |
| Drop (100%) | Megalixir ×1 (common **and** rare) |
| Steal (50%) | X-Potion ×4 / rare X-Potion ×6 |
| Bribe | none |
| Elements | Fire/Ice/Water/Lightning/Holy **100%**; **Gravity immune (0%)** |
| Immune | Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, **Haste**, Slow, Stop, all Str/Mag/Acc/Eva/Luck Up-Down, Doom, Delay, Interrupt, **Fractional damage**. Zantetsu resistance 255. |
| **Not** immune | Reflect, **Def Up/Down**, **MDef Up/Down** → *Armor Break / Mental Break work* |
| Scan text (paraphrase) | Millennium-old ultimate weapon; reawoken but acting on bare defensive instinct, so its moves are very simple. |

`[verified: 2 sources]` for every numeric field. HP (34,200) is additionally cross-confirmed by GamerGuides' Final Bosses walkthrough.

**Abilities**

| Name | Type | Const / fraction | Target | Effect |
|---|---|---|---|---|
| **Tail Beam** | Fractional | **5/16 of max HP** | 1 char | Can break damage limit. Ignores DEF/MDEF entirely — a pure %-HP hit. `[verified: 2 sources]` — GamerGuides independently describes it as a "laser attack: removes 5/16 (31.25%) of maximum HP." |
| **Noli Me Tangere** | Constant | **1250** | **all** | Sweeping tail strike. Randomised to 1,171–1,323. Can break damage limit. `[verified: 2 sources]` — GamerGuides independently describes it as a "sweeping attack: inflicts 1,250 HP damage." |

*Etymology (flavour for tooltips): "Noli me tangere" = "touch me not."*

### 3.2 Vegnagun (Leg) — battle 2

| Field | Value |
|---|---|
| Level | 38 |
| **HP / MP** | **18,220** / 9,999 |
| Str / Mag | 13 / **18** |
| Def / MDef | **13** / 17 |
| Agi / Acc / Eva / Luck | 34 / 0 / 0 / 3 |
| EXP / AP / Gil | 6,000 / 5 / 3,000 (Pilfer 3,000) |
| Drop (100%) | Mythril Bangle ×1 (common + rare) |
| Steal (50%) | Elixir ×1 / rare Elixir ×2 |
| Elements | as Tail (Gravity immune) |
| Immune | as Tail **plus Reflect**; **not** immune to Def/MDef Up-Down |

`[verified: 2 sources]`. Mag 18 / Def 13 now confirmed against SinirothX's primary text (per-stat labelled lines, read directly 2026-09-15); the FF Wiki's Mag 13 / Def 18 is a wiki-side infobox transposition — see the §3 header. HP (18,220) additionally cross-confirmed by GamerGuides' Final Bosses walkthrough.

**Abilities**

| Name | Type | Const | Target | Effect |
|---|---|---|---|---|
| **Vita Brevis** | Magic | **40** | all | Heavy party damage **+ strong Delay** (status chance = infinite, i.e. guaranteed). Breaks damage limit. |
| **Absorb** | Fractional | 3/16 of **remaining** HP *and* MP | 1 char | Drains to the Leg. |
| **Slow** | Status | — | 1 char | chance 130 |
| **Berserk** | Status | — | 1 char | chance 75 |
| **Break** | Status | — | 1 char | Petrify, chance 80 |

*"Vita brevis" = "life is short."* Note the wiki ability list writes **"Vita Braevis"**; SinirothX and the Latin both give **Vita Brevis**. Use *Vita Brevis*.

#### Node A / Node B / Node C (statistically identical)

| Field | Value |
|---|---|
| Level | 52 |
| **HP / MP** | **300,000** / 9,999 each |
| Str / Mag | 48 / 16 |
| Def / MDef | **244 / 244** |
| Agi / Acc / Eva / Luck | 41 / 0 / 0 / 2 |
| EXP / AP / Gil | 8,000 / 10 / 3,000 (Pilfer **10,000**) |
| Drop (100%) | Megalixir ×1 / **rare: Hero Drink ×1** |
| Steal (50%) | Megalixir ×1 / rare Megalixir ×2 |
| Immune | as Leg **plus Def Up/Down and MDef Up/Down** |
| Auto-status | **Null Physical while RED**, **Null Magic while YELLOW** |

`[verified: 2 sources]`, additionally cross-confirmed by GamerGuides' Final Bosses walkthrough, which lists "300,000 HP each." 300,000 HP is correct and intentional — the Nodes are **not meant to be killed**; the Leg is the win condition.

**Node colour state machine** `[verified: 2 sources]`

```
state: colour ∈ {RED, GREEN, YELLOW}, actionCount ∈ ℕ
on (own turn resolves) OR (hit by any attack): actionCount += 1
if actionCount ≥ 4: actionCount = 0; colour = next(colour)
next: RED → GREEN → YELLOW → RED
```

| Colour | Behaviour | Immunity |
|---|---|---|
| **RED** | 1/2 Missile, 1/2 Dies Irae | **Null Physical** |
| **GREEN** | 1/4 each: Cura / Regen / Shell / Protect — **all cast on Vegnagun (Leg)** | (special-damage immune per wiki) |
| **YELLOW** | 1/5 each: Firaga / Blizzaga / Thundaga / Waterga (**all party**) / Flare | **Null Magic** |

**Node abilities**

| Name | Type | Const | MP | Target |
|---|---|---|---|---|
| Missile | Physical | 9 ×2 hits | — | 1 char |
| Dies Irae | Physical | 4 ×9 hits | — | random chars |
| Firaga / Blizzaga / Thundaga / Waterga | Magic (elemental) | 19 | 24 | all chars |
| Flare | Magic | 30 | 54 | 1 char |
| Cura | Magic-recovery | 31 | 10 | the Leg |
| Regen / Shell / Protect | Status (guaranteed) | — | 40 / 10 / 12 | the Leg |

**Reach rule (important, and easy to miss):** the Nodes are **physically distant**. Only **long-range** attacks can touch them. Confirmed-reaching sources: Gunner (all), Gun Mage (Attack, Cry in the Night, Supernova), Alchemist Attack, Lady Luck (Attack, Two Dice, Four Dice), Psychic Attack, Festivalist (Paine's Attack, Rikku's Fish), all Black Magic, White Magic **Holy**, Arcana **Drain**, Samurai **Spare Change**, Instinct (Sparkler, Fireworks), Mascot (**Moogle Beam**, **Cactling Gun**), Floral Fallal (Fallalery elemental Whirls, Great Whirl, Left Pistilplay magic), Machina Maw (Machinations missiles, Vajra, Homing Ray), Full Throttle (Dextral Arts). **Items cannot target Nodes at all.** `[single source: FF Wiki]`

**Farming note (optional to implement):** with all three party members wearing **Key to Success**, each Node drops **8 Hero Drinks** → 24 total. Hero Drink is otherwise only obtainable from Shuyin (12.5% steal). `[single source]`

### 3.3 Vegnagun (Body / Core) — battle 3

| Field | Value |
|---|---|
| Level | 43 |
| **HP / MP** | **33,040** / 9,999 |
| Str / Mag | 54 / **42** |
| Def / MDef | **98** / 108 |
| Agi / Acc / Eva / Luck | 35 / 0 / 0 / 4 |
| EXP / AP / Gil | 7,000 / 10 / 3,000 (Pilfer 4,000) |
| Drop (100%) | Megalixir ×1 |
| Steal (50%) | Turbo Ether ×1 |
| Elements | as above (Gravity immune) |
| Immune | as Leg, **plus MDef Up/Down**; **Def Up/Down still lands** (Armor Break works) |
| Scan (paraphrase) | Vegnagun's core. Charges energy, then unleashes a devastating attack; can also revive both Bulwarks — make it the primary target. |

`[verified: 2 sources]`. Mag 42 / Def 98 now confirmed against SinirothX's primary text (per-stat labelled lines, read directly 2026-09-15); the FF Wiki's Mag 98 / Def 42 is a wiki-side infobox transposition — see the §3 header. **This is the one part of the chain where the transposition materially changes the fight**, so treat the Memento Mori damage band as a regression test. HP (33,040) additionally cross-confirmed by GamerGuides' Final Bosses walkthrough.

**Abilities**

| Name | Type | Const | Target | Effect |
|---|---|---|---|---|
| **Charge Core** | — | — | self | **The countdown.** Each use increments `actionCount`. |
| **Memento Mori** | Magic | **28** | all | Fires at `actionCount == 3`, then resets to 0. ~1,000–1,130 party-wide. Breaks damage limit. `[verified: 2 sources]` — GamerGuides independently confirms it "charges over three turns, hits all." |
| **Full-Life** | Fractional | — | own KO'd Bulwark | Full revive + full HP. |

*"Memento mori" = "remember that you must die."*

#### Right Bulwark / Left Bulwark

`[verified: 2 sources]` — HP 3,000 each independently confirmed by GamerGuides' Final Bosses walkthrough (Chapter 5), which was cited elsewhere in this doc only for strategy.

| Field | Value |
|---|---|
| Level | **39** (Oversoul level 47, unreachable here; the wiki prints the Oversoul figure in its level field — see the §3 header) `[verified: 2 sources]` |
| **HP / MP** | **3,000** / 9,999 each |
| Str / Mag | 72 / 48 |
| Def / MDef | 58 / 58 |
| Agi / Acc / Eva / Luck | 46 / 0 / 0 / 2 |
| EXP / AP / Gil | 200 / 10 / 150 (Pilfer 300) |
| Drop (50%) | Mega-Potion ×1 / rare X-Potion ×1 |
| Steal (50%) | Phoenix Down ×1 / rare **L-Bomb** ×1 |
| Immune | Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, Reflect, Haste, Slow, Stop, Acc/Eva/Luck Up-Down, Doom, Delay, Interrupt, Fractional. **Str/Mag/Def/MDef Up-Down all land.** |
| Scan (paraphrase) | Vegnagun's foreleg. Attacks and casts support magic; built to retaliate against anyone who strikes the core. |

**Shared counter-suite (both Bulwarks)**

| Name | Type | Fraction | Effect |
|---|---|---|---|
| **Hostile activity detected** | Fractional | 3/16 of **max HP and MP** | 1 char — the one who attacked. Also **strips Shell, Protect, Reflect, Regen, Haste**. |
| **Physical attack detected** | Fractional | 5/16 of max HP | All chars **within a 5 m radius of the Bulwark** — falls back to 1 char if none are inside. Strips Str/Def Up-Down. **See §4.3 for the coordinate system this radius is measured in.** |
| **Magical attack detected** | Fractional | 3/16 of max **MP** | All chars within the same 5 m radius (fallback 1). Strips Mag/MDef Up-Down. |

> **Exact source wording** (SinirothX, Right Bulwark entry, read directly 2026-09-15): *"damage all characters in a 5 meter radius around it by 5/16 of max HP… (if no characters are in that radius, damage one character)"*. Note the three things this pins down: the circle is centred on **the Bulwark**, not on the attacker or on the Core; the units are the game's own **metres**; and the fallback is **one** character, not zero. `[single source: SinirothX — but verbatim from the primary text, so the wording itself is not in doubt]`

**Right Bulwark-only:** Regen (40 MP) / Shell (10) / Protect (12), each cast **on the whole party of enemies**, 1/3 chance each when idle.
**Left Bulwark-only:** Break (20 MP, Petrify all, chance 80) / Bio (16 MP, Poison all, chance 100) / Doom (18 MP, 9-count Doom, 1 char, chance 100) / Dispel (12 MP, strips Auto-Life, Shell, Protect, Reflect, Regen, Haste, Spellspring), 1/4 each when idle.

**The retaliation mechanic (this is the fight's whole identity):**

```
Core keeps a one-slot "attack log": {who attacked, mitigationClass}
mitigationClass ∈ {SHELL_REDUCIBLE, PROTECT_REDUCIBLE, NONE}

Bulwark turn:
  if Core.log is populated:
      copy log to both Bulwarks; clear Core.log
      if the logged attacker is targetable:
          SHELL_REDUCIBLE  -> "Magical attack detected"
          PROTECT_REDUCIBLE-> "Physical attack detected"
          NONE             -> "Hostile activity detected" on that attacker
      else -> idle action (Right: buff / Left: debuff)
  else -> idle action
```

The design consequence: **whatever damage type you use, the Bulwarks answer in kind** — so the *third* class (NONE, i.e. Darkness/Charon/fixed/fractional player abilities) gets answered with the single-target buff-strip instead of the AoE. And "Physical attack detected" has a **positional** component (5 m radius), which is rare in FFX-2 and worth preserving in an HD-2D staging.

### 3.4 Vegnagun (Head) — battle 4

| Field | Value |
|---|---|
| Level | 57 |
| **HP / MP** | **38,420** / 9,999 |
| Str / Mag | 56 / **52** |
| Def / MDef | **71** / 59 |
| Agi / Acc / Eva / Luck | 36 / 0 / 0 / 4 |
| EXP / AP / Gil | **0** / 10 / **0** (Pilfer 8,000) |
| Drop | **none** |
| Steal (50%) | Megalixir ×1 |
| Elements | as above (Gravity immune) |
| Immune | Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, Reflect, Haste, Slow, Stop, **all** Str/Mag/Def/MDef/Acc/Eva/Luck Up-Down, Doom, Delay, Interrupt, Fractional. Zantetsu 255. |
| Scan (paraphrase) | Can revive both Redoubts. Whenever its HP drops it uses Nemo Ante Mortem Beatus, its strongest ability. |

`[verified: 2 sources]`. Mag 52 / Def 71 now confirmed against SinirothX's primary text (per-stat labelled lines, read directly 2026-09-15); the FF Wiki's Mag 71 / Def 52 is a wiki-side infobox transposition — see the §3 header. HP (38,420) and the full five-ability set (Pallida Mors, Mors Certa, Odi Et Amo, Nemo Ante Mortem Beatus, Acta Est Fabula) are independently corroborated by GamerGuides' Final Bosses walkthrough, including Odi Et Amo's "sixteen random-target magic attacks" description.

**Abilities**

| Name | Type | Const | Target | Effect |
|---|---|---|---|---|
| **Pallida Mors** ("pale death") | Magic | **26** | 1 char | ~1,120–1,265. Only move available *before* the Redoubts are first downed. |
| **Odi Et Amo** ("I hate and I love") | Magic | **6 × 16 hits** | random chars | ~950–1,070 total **and strips Shell, Protect, Reflect, Regen, Haste, Str/Mag/Def/MDef Up, HP×2, MP×2, Spellspring** — the hardest buff-wipe in the game. |
| **Mors Certa** ("death is certain") | Magic | **12** | all | ~240–270 **+ 80% Silence + 80% Darkness + 80% Poison**. Despite the name, no instant death. |
| **Nemo Ante Mortem Beatus** ("no one is happy before death") | Magic | **30** | all | ~1,490–1,685. Fires on crossing **4/5, 3/5, 2/5, 1/5** max HP. |
| **Acta Est Fabula** ("the play is over") | Fractional | — | both Redoubts | Full revive + full HP; also the "phase start" action. |

#### Right Redoubt / Left Redoubt

| Field | Right | Left |
|---|---|---|
| Level | 40 | 40 |
| **HP / MP** | **2,500** / **99,999** | **2,500** / **99,999** |
| Str / Mag | 65 / 41 | 65 / 41 |
| **Def / MDef** | **133 / 0** | **0 / 133** |
| Agi / Acc / Eva / Luck | 47 / 0 / 0 / 3 | 47 / 0 / 0 / 3 |
| EXP / AP / Gil | 0 / 10 / 0 (Pilfer 350) | same |
| Drop | none | none |
| Steal (50%) | Phoenix Down / rare **Mega Phoenix** | same |
| Abilities | **Lacrimosa** (Physical, const **16**, 1 char), **Blind** (8 MP, 100%), **Break** (20 MP, Petrify, 80%), **Flare** (54 MP, Magic const **30**), **Full-Life** (revives Left) | **Lacrimosa** (Physical, const **2**, damages **MP**), **Slow** (chance 130), **Demi** (10 MP, 1/4 of current HP, all, Gravity), **Dispel** (12 MP), **Full-Life** (revives Right) |
| Immune | as Head minus Def/MDef Up-Down (those **land**) | same |
| Scan (paraphrase) | One of Vegnagun's last defences; can revive the other Redoubt. | same |

`[verified: 2 sources — SinirothX primary text + the FF Wiki *Redoubt* page, read directly 2026-09-15, which matches every field including Lv 40, HP 2,500, MP 99,999, Str 65 / Mag 41 and the 133/0 ↔ 0/133 mirror]`. **The Def/MDef mirror is deliberate and correct:** Right is physically armoured but has **zero** magic defense; Left is the exact inverse. Kill Right with magic and Left with physicals.

*"Lacrimosa" = "weeping," from the Dies Irae sequence — which is also the Nodes' multi-hit name. Same liturgical set.*

### 3.5 Shuyin — final boss

| Field | Value |
|---|---|
| Level | 58 |
| **HP / MP** | **23,850** / **210** |
| Str / Mag | 47 / 42 |
| Def / MDef | **132** / 92 |
| Agi | **133** (highest in the chain — he acts roughly 4× as often as the Head) |
| Acc / **Eva** / Luck | 0 / **22** / **14** |
| Thinking period | 0 |
| EXP / AP / Gil | 0 / **20** / 0 (Pilfer **10,000**) |
| Drop | **none** |
| Steal (**12.5%** — CONFLICT, see note) | **Hero Drink ×1** (common *and* rare) |
| Bribe | none |
| Elements | Fire/Ice/Water/Lightning/Holy **100%**; **Gravity immune** |
| **Immune** | Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, **Slow, Stop**, all Str/Mag/Def/MDef/Acc/Eva/Luck Up-Down, Doom, Delay, Interrupt Action, Fractional damage. Zantetsu resistance 255. |
| **Not immune** | **Haste** and **Reflect** are absent from his immunity list — unlike every Vegnagun part, which are Haste-immune (and all but the Tail Reflect-immune). |
| Scan (paraphrase) | Lenne's lover from the Zanarkand of a thousand years past. He could not save her; his sorrow and despair linger in this shadowy form. |

`[verified: 2 sources]` on every field except the Hero Drink steal chance (see CONFLICT note below).

**CONFLICT — Hero Drink steal chance:** SinirothX/FF Wiki give a flat **12.5%** for both the common and rare steal. jegged.com's Shuyin bestiary page (http://jegged.com/Games/Final-Fantasy-X-2/Bestiary/Shuyin.html) instead gives **11%** for the common steal and **1.6%** for the rare steal. Neither source is decompile-derived with certainty, so this is recorded as an open numeric conflict rather than resolved. Per this document's own source-ranking policy (§0, SinirothX treated as authoritative where sources conflict), **recommend implementing 12.5%**, but flag the 11%/1.6% split as the alternative if jegged's split is later corroborated.

**Answering the brief's checklist:** Petrify — **immune**. Confuse — **immune**. Ultima — **he does not have it** (that's a *player* option via the Megiddo grid). "Slice & Dice style attacks" — yes, **Run & Slash** is the Slice & Dice analogue.

**Abilities — all four are renamed Tidus Swordplay Overdrives from FFX**

| Name (SinirothX) | Name (FF Wiki) | FFX original | Type | Const | Target | Notes |
|---|---|---|---|---|---|---|
| Normal Attack | Attack | — | Physical | 16 | 1 random | ~157–350 depending on target DEF |
| **Spinning Cut** | **Spin Cut** | Spiral Cut | Physical | **24** | 1 char | |
| **Run & Slash** | **Hit and Run** *(wiki AI script)* | Slice & Dice | Physical | **8 × 6 hits** | random chars | |
| **Force Rain** | Force Rain | Energy Rain | **Magic** | **20** | **all** | his only magic attack |
| **Terror of Zanarkand** | Terror of Zanarkand | Blitz Ace | Physical, **ignores Defense** | **10 × 9 hits** | **1 char** | **190–215 per hit → 1,710–1,935 total.** Will KO almost any party member at this level. |

**Naming conflict recorded:** the same move appears as *Run & Slash* (wiki ability list, SinirothX) and *Hit and Run* (wiki AI script, Hamfruitcake walkthrough); and *Spin Cut* (wiki) vs *Spinning Cut* (SinirothX). **Recommend: "Run & Slash" and "Spin Cut"** (the wiki ability-list spellings are the in-game menu strings). `[conflict]`

Terror of Zanarkand's 9-hit, Defense-ignoring structure and Run & Slash's 6-random-target-hit structure are `[verified: 2 sources]` — independently corroborated by GamerGuides' Final Bosses walkthrough ("nine unblockable hits" / "six random-target physical hits"), though GamerGuides does not state SinirothX's per-hit damage constants.

**Terror of Zanarkand animation notes** (for the sprite/VFX brief):
- He charges, then **leaps off his target**, delivers **eight slashes**, plants the sword into the ground, and vaults off the hilt into the air for the ninth, blitzball-assisted finish.
- He uses a **blitzball** in the finisher — the strongest in-fiction hint that Shuyin was a blitzer in old Zanarkand.
- The sword model used is **World Champion** (Wakka's FFX Celestial Weapon). A continuity slip in the original: the sword is back in his right hand on landing without being retrieved. **Fix or keep — your call; keeping it is a deep-cut homage.**
- The party does **not** perform a victory pose after this battle. `[single source]`

---

## 4. The two "charging" mechanics, spelled out

### 4.1 Body/Core — `Charge Core → Memento Mori` (turn-counted)

```
core.actionCount = 0
on core turn:
    if core.actionCount >= 3:
        core.actionCount = 0
        cast Memento Mori (magic, const 28, all party)
    else if rightBulwark.isKO:  cast Full-Life on rightBulwark
    else if leftBulwark.isKO:   cast Full-Life on leftBulwark
    else:
        cast Charge Core (self VFX)
        core.actionCount += 1
```

**Read:** killing a Bulwark **buys a turn** — the Core spends that turn reviving instead of charging. This is the intended counterplay and it is *not* obvious from the scan text. Three unimpeded Core turns = Memento Mori.

### 4.2 Head — the cannon fail clock (Shuyin's seven lines)

- The Head battle runs under a **hidden fail clock**. When it expires Shuyin fires Vegnagun's cannon — which draws extra Farplane energy by planting the tail into the terrain behind it — and **Spira is destroyed: instant Game Over / "bad ending."** `[verified: 2 sources — FF Wiki *Vegnagun (head)* + GamerGuides' Final Bosses walkthrough, which confirms "waiting too long simply gives you a Game Over and a clip of the bad ending"]`
- Losing the party to KO in this battle produces the same outcome. `[verified: 2 sources — GamerGuides + the Japanese *FF用語辞典 Wiki\** endings page, which states the bad ending triggers "if you get a Game Over here **or** Shuyin speaks 7 times"]`
- **The remaining time is never displayed on screen.** `[single source: FF用語辞典 Wiki\*, "残り時間は非表示"]`

#### 4.2.1 What the clock actually is: **Shuyin's seven lines** `[verified: 2 sources]`

This was an open `[estimate]` in earlier revisions. It is now pinned down as a *mechanic*, even though its wall-clock length is still not published.

**The fail condition is a counter of Shuyin's speech events, and the counter has exactly seven slots.** SinirothX's Head entry lists every Shuyin line in the battle, and the seventh is annotated in the guide itself as ending the game:

| # | When | Line (short quote) | Effect |
|---|---|---|---|
| 1 | Battle start (Phase A, step 1) | *"Come, Vegnagun. Let us purge this repulsive world."* | Head does nothing that turn |
| 2 | Phase B, step 2 — immediately after the first `Acta Est Fabula` | *"The end now begins."* | **Head + both Redoubts begin counting their turns** — the clock starts here |
| 3 | Turn-count threshold | *"All shall find rest."* | Head does nothing that turn |
| 4 | Turn-count threshold | *"There's no place to run."* | Head does nothing that turn |
| 5 | Turn-count threshold | *"Mine is the power to crush Spira's despair."* | Head does nothing that turn |
| 6 | Turn-count threshold | *"At last Spira will be cleansed."* | Head does nothing that turn |
| 7 | Clock expiry | *"Now, Vegnagun. Fire!"* | **Game Over → bad ending FMV** |

`[verified: 2 sources]` — SinirothX's Head quote list (which marks line 7 `-> [Game Over; receive 'bad ending']`) and the Japanese *FF用語辞典 Wiki\** endings page (“シューインが7回しゃべったらバッドエンディングに突入する” = "if Shuyin speaks 7 times you enter the bad ending"), which were written independently of each other and agree exactly on the count of seven. A third-party English walkthrough video description states the same ("when time runs out **or** Shuyin speaks seven times").

**Two further structural facts, both load-bearing:**

1. **The clock does not start until Phase B.** SinirothX's script says the Head and both Redoubts "count their turns" only from Phase B step 2 — i.e. after the Redoubts have been downed once and `Acta Est Fabula` has fired. A Japanese completion-run site independently reports that "there is a time limit in the **second half** of the Vegnagun 2nd-form (head) battle" (“ヴェグナガン第2形態（頭）戦の後半には制限時間が存在します”). `[verified: 2 sources]` **Design consequence: a player who stalls in Phase A is not on the clock, and Phase A is a dead end anyway — the Head is untargetable and does nothing while either Redoubt lives.** Starting the clock at the Phase B transition is both faithful and the only non-frustrating option.
2. **It is a turn count, not a wall-clock timer, in the original data.** SinirothX's transcription of the Head's AI contains a section header `Turn Count Pattern:` followed by `[more quote info, translate later]` — he never translated it. That is exactly where FFX-2 AI scripts put "on turn N, do X", and it is the only place lines 3–6 can live. `[single source: SinirothX — inferred from the untranslated section header and the fact that lines 3–6 appear nowhere else in the script]`

#### 4.2.2 Duration — still not published; here is the number to ship

| Datum | Value | Source quality |
|---|---|---|
| Time for all seven lines, player idling | **"around 25 minutes"** | `[single source]` — GameFAQs board post (izzy_pr), 2008, stated as part of an endings checklist |
| Time to a bad ending with the controller untouched | **"about 10 minutes"** | `[single source]` — Reddit anecdote. **Treat as a party wipe, not the clock**: an idle party takes Pallida Mors / Mors Certa / Nemo Ante Mortem Beatus unanswered and dies long before seven lines elapse, and a wipe produces the same bad ending |
| Any officially published figure | **none exists** | exhaustively searched: FF Wiki, GamerGuides, StrategyWiki, Jegged, Dr Slice, FF Exodus, Japanese strategy wikis, the Ultimania translation FAQ |

**Ship this model.** It is faithful to the mechanic (a seven-slot speech counter driven by enemy turns) and lands on a defensible length:

```
// Fires only in Phase B. enemyTurns counts EVERY resolved turn of
// { Head, RightRedoubt, LeftRedoubt } combined, per SinirothX's
// "Vegnagun (Head), Right Redoubt, and Left Redoubt count their turns".
const FIRE_AT_TURN   = 240;   // combined enemy turns from Phase B start to line 7
const LINE_INTERVAL  = 48;    // lines 3,4,5,6 at 48/96/144/192; line 7 at 240
// line 1 = battle start, line 2 = Phase B transition (turn 0)

onEnemyTurnResolved(unit) {
  if (phase !== 'B') return;
  enemyTurns += 1;
  if (enemyTurns >= FIRE_AT_TURN)           { shuyinSpeak(7); gameOver('bad-ending'); }
  else if (enemyTurns % LINE_INTERVAL === 0) shuyinSpeak(3 + enemyTurns / LINE_INTERVAL - 1);
  if (enemyTurns === Math.floor(FIRE_AT_TURN / 2)) auronSpeak('halfway');  // 50% callout
}
```

**Why 240 combined turns.** Using `ffx2-combat-core.md` §1.2's ATB model (`t = K_ATB / Agility`, `K_ATB = 200`): the Head at **Agi 36** takes a turn every 5.56 s and each Redoubt at **Agi 47** every 4.26 s, so the three of them together resolve roughly **0.65 turns per second**, or one combined turn every ~1.54 s. 240 combined turns ≈ **6 min 10 s of Phase B**, and a real Phase A plus menu time pushes the whole battle toward **7–8 minutes** of wall clock before the cannon fires. That is short of the 25-minute report but deliberately so — see the tuning table. `[estimate — derived from the doc's own ATB constant and SinirothX's Agility values; the mapping from turns to seconds is engine-specific and must be re-measured once the ATB is running]`

| Preset | `FIRE_AT_TURN` | Approx. Phase-B wall clock | Use for |
|---|---|---|---|
| **Authentic** | 950 | ~24 min | reproducing the "around 25 minutes" report |
| **Shipped default (recommended)** | **240** | **~6 min** | Pyrefly Reprise: long enough that a competent party never sees it, short enough that stalling is punished inside one sitting |
| Tight / hard mode | 150 | ~4 min | a genuine race |

`[estimate]` for all three rows. **Rationale for not shipping "Authentic":** 25 minutes on a single boss makes the fail state decorative — no player who is fighting at all will ever reach it, which is exactly the failure mode this document is trying to avoid. 240 turns is the smallest budget that still clears a *deliberate*, unoptimised clear of a 38,420 HP boss with a realistic Lv 45–50 party (see §6.3 and §7.2) by roughly 2×. Expose it as a config constant and re-tune against playtest, not against this document.

#### 4.2.3 Presentation

- **Do not draw a numeric countdown.** The original hides the remaining time; the seven lines *are* the UI. `[verified: 2 sources]`
- Auron's *"Vegnagun's half-way to firing power. You still have time."* is the 50% callout — fire it when the hidden counter crosses `FIRE_AT_TURN / 2`. SinirothX files it under the Head's "Random Pattern", so the pairing to the midpoint is this document's choice, not data. `[estimate]`
- Jecht's *"there is no overtime"* line is the diegetic statement that the clock is real; the Japanese endings wiki explicitly notes it is literal rather than a figure of speech. Fire it early in Phase B (SinirothX puts it at Phase B step 4).
- If you want a visual tell without a number, use the cannon muzzle called for in `visual-bible.md` §2.5 set-piece (5): let its charge glow step up one notch on each of Shuyin's seven lines. That is a seven-state readout, which is exactly what the mechanic is.
- Vegnagun's KO must **cancel** the clock even if a queued line would have fired in the same frame; resolve `head.hp <= 0` before the turn-count hook.
- **Redoubt suppression:** while **both** Redoubts are alive the Head's action pool is limited to Pallida Mors (it literally does nothing if either is dead pre-phase-change). Once they've been downed at least once, the Head unlocks Mors Certa / Odi Et Amo / Nemo Ante Mortem Beatus. Killing them again forces `Acta Est Fabula` (a wasted Head turn). So **the Redoubts are simultaneously the gate that opens the dangerous moveset and the lever that stalls it.**

---

### 4.3 Battlefield space: the coordinate system the 5 m radius is measured in

This section exists because three separate mechanics in this chapter are **positional** and no other document in the set defines a space for them to live in:

1. the Bulwarks' `Physical attack detected` / `Magical attack detected`, which hit *"all characters in a 5 meter radius around it"* (§3.3);
2. the Chain system, which `ffx2-combat-core.md` §1.7 says is driven by positioning — *"a character standing far away spends ~2 s running in, which usually breaks the chain"*, with the instruction to *"model an approach time proportional to distance for short-range abilities"*;
3. the Nodes' reach rule (§3.2), which only long-range abilities can satisfy.

`visual-bible.md` §2.0 fixes party sprites at static world x/z with no movement model, so it cannot serve. Everything below is a **`[design decision]` for Pyrefly Reprise** — no source publishes FFX-2's battlefield geometry — but the two hard constraints it is built to satisfy are sourced: the **5 m** radius (SinirothX, verbatim) and the **2 s** chain window (`ffx2-combat-core.md` §1.7, `[verified: 2 sources]`).

#### 4.3.1 The frame

| Property | Value | Basis |
|---|---|---|
| Handedness / up axis | Right-handed, **+Y up** | Three.js default |
| **Scale** | **1 world unit = 1 metre** | `visual-bible.md` §2.0 ("world units where 1 unit = 1 m") and §6.1 ("1 logical sprite px = 1/32 world unit, so a 64 px party sprite is exactly 2.0 m tall") — **already consistent, so the SinirothX "5 meter" figure drops straight in as `5.0` world units with no conversion** `[verified: 2 sources — both visual-bible clauses]` |
| Ground plane | `y = 0`; combat resolves on the **XZ plane** | — |
| Axes | **+X toward the enemy line**, −X the party side; **+Z is camera-right** along each line | — |
| Origin | Arena centre — midpoint between the party home line and the enemy anchor | — |
| Distance function | `dist(a,b) = hypot(a.x-b.x, a.z-b.z)` — **2-D, ignoring Y** | airborne enemies (Nodes, the Head) must not fall out of ground-level AoEs for free |

Every combatant carries:

```ts
interface Placed {
  pos:    { x: number; z: number };   // live position, metres
  home:   { x: number; z: number };   // spawn slot
  y:      number;                     // 0 for grounded; >0 for airborne (display + reach gating only)
  radius: number;                     // hurtbox radius, metres
}
```

#### 4.3.2 The FFX-2 "wide field" preset

`visual-bible.md` §2.0's layout (party at x −1.6 / −2.3 / −3.0, enemies mirrored at +1.8…+3.4) is the **FFX camera-framing layout**. Reused as-is for FFX-2 it breaks the Bulwark mechanic outright: every party member would sit ~5–6 m from every enemy, so a 5 m radius would catch either everyone or no one depending on rounding, and the "falls back to 1 char" branch would be unreachable. **The FFX-2 chapters use a wider field.**

**Party home slots** (all four Vegnagun battles and Shuyin):

| Slot | x | z |
|---|---|---|
| Front | −5.2 | +1.8 |
| Mid | −6.0 | 0.0 |
| Rear | −5.2 | −1.8 |

**Enemy anchors:**

| Battle | Enemy | x | z | y | radius |
|---|---|---|---|---|---|
| 1 | Vegnagun (Tail) | +3.0 | 0.0 | 0 | 2.2 |
| 2 | Vegnagun (Leg) | +3.0 | 0.0 | 0 | 2.6 |
| 2 | Node A | +5.0 | +6.0 | +9.0 | 1.2 |
| 2 | Node B | +6.0 | 0.0 | +10.5 | 1.2 |
| 2 | Node C | +5.0 | −6.0 | +9.0 | 1.2 |
| 3 | Core / Body | +3.4 | 0.0 | 0 | 3.0 |
| 3 | **Right Bulwark** | **+2.4** | **+3.2** | 0 | 1.6 |
| 3 | **Left Bulwark** | **+2.4** | **−3.2** | 0 | 1.6 |
| 4 | Vegnagun (Head) | +3.6 | 0.0 | +4.0 | 3.2 |
| 4 | Right Redoubt | +2.6 | +2.6 | 0 | 1.4 |
| 4 | Left Redoubt | +2.6 | −2.6 | 0 | 1.4 |
| 5 | Shuyin | +3.0 | 0.0 | 0 | 0.5 |

**Why these numbers — the geometry is tuned to make the 5 m radius discriminating:**

| Measurement | Distance | Inside the 5 m radius? |
|---|---|---|
| Party home (mid) → Right Bulwark | 8.99 m | **no** |
| Party home (front) → Right Bulwark | 7.73 m | **no** |
| Party home (rear) → Right Bulwark | 9.10 m | **no** |
| A character standing in melee on the Right Bulwark | 3.00 m | **yes** |
| That same melee character → the **Left** Bulwark | 6.56 m | **no** |
| Right Bulwark ↔ Left Bulwark | 6.40 m | — (deliberately > 5, so the two circles never overlap) |

So: **attack a Bulwark in melee and you are standing in its blast circle; attack it from range and the counter degrades to the single-target fallback.** That is the fight's identity expressed as geometry, and it is a real choice rather than a coin flip.

#### 4.3.3 Movement, approach time, and why characters do **not** walk home

| Constant | Value | Note |
|---|---|---|
| `RUN_SPEED` | **3.2 m/s** | `[design decision]`, tuned so the longest approach in the wide field is just under the 2 s chain window |
| Haste modifier | `×1.25` | consistent with `ffx2-combat-core.md` §1.2's "Haste… speeds up animations" |
| `MELEE_GAP` | **1.4 m** clear of the target's hurtbox | so `standoff(t) = t.radius + 1.4` |
| Fan-out for co-targeting | ±**0.9 m** perpendicular per extra attacker on the same target | keeps all co-attackers inside a 5 m circle |

```ts
function approachTime(actor: Placed, target: Placed, ability: Ability): number {
  if (ability.range === 'long') return 0;                 // fires from where it stands
  const d = dist(actor.pos, target.pos) - standoff(target);
  return Math.max(0, d) / (RUN_SPEED * (actor.hasHaste ? 1.25 : 1));
}
// On execution, commit the move: actor.pos = pointAt(target, standoff(target), fanSlot)
```

**The rule that makes both mechanics work: a character stays where it last acted.** There is no automatic walk-back to `home`. Consequences, and they are the intended ones:

- A character that just meleed the Right Bulwark re-attacks it with **`approachTime = 0`** and therefore chains trivially; a character still sitting at home pays ~1.8–1.9 s and lands right on the edge of the 2 s window. This is precisely the behaviour `ffx2-combat-core.md` §1.7 describes and attributes to Split Infinity.
- A character that committed to melee is **still standing in the blast circle** when the Bulwark's counter resolves on its next turn. Pile all three onto one Bulwark and all three eat 5/16 of max HP; spread them, or use long-range dresspheres (Gunner, Lady Luck, Alchemist, Trainer, Gun Mage — `ffx2-combat-core.md` §1.7), and the counter falls back to one character.
- Positions reset to `home` only on **battle-phase transitions** (e.g. the Head's Phase A → Phase B) and on revival from KO.

**Sample the radius at counter-resolution time, not at hit time.** The Bulwark counter is deferred to the Bulwark's own turn (§3.3 pseudocode), so the victim set must be recomputed then:

```ts
function detectedVictims(bulwark: Placed, party: Char[], loggedAttacker: Char | null): Char[] {
  const inside = party.filter(c => c.targetable && dist(c.pos, bulwark.pos) <= 5.0);
  if (inside.length > 0) return inside;
  return [loggedAttacker ?? randomLiving(party)];   // SinirothX: "damage one character"
}
```

#### 4.3.4 Reach gating for the Nodes

Do **not** derive the Nodes' unreachability from distance — derive it from a flag, and use the geometry only to make the flag look honest. The Nodes sit 9–10.5 m in the air with no ground path, which is why `shortRange` abilities cannot select them; but the *authoritative* list of what reaches them is the explicit ability list in §3.2, and it does not decompose cleanly into "long range". Implement `Node.reachableBy = 'longRangeOnly'` plus the §3.2 whitelist, and treat items as never able to target a Node.

#### 4.3.5 Presentation notes for the HD-2D staging

- Movement is a world-space lerp of the billboard's **anchor**; the sprite keeps yaw-locking to the camera and never pitches (`visual-bible.md` §6.2). Re-apply §6.1's screen-space pixel snapping *after* the move, or running sprites will shimmer.
- Draw the 5 m radius as a **ground decal** — a flattened ring on `y = 0.02`, 5.0 m radius, pulsing for ~0.4 s as the Bulwark charges its counter. It is the only positional tell in the whole project and the player cannot infer it from a billboard scene otherwise.
- **Amendment owed to `visual-bible.md`:** §2.0 needs a note that the FFX-2 chapters use this wider field and that its base camera must pull back to roughly `(+2.6, +3.6, +9.6)` with FOV ~44° to frame a 15 m-wide arena. Flagged in §11.

---

## 5. AI scripts (implementation pseudocode)

Transcribed from the decompile-derived scripts and restructured. Voice-line steps are preserved because they consume turns.

### 5.1 Tail

```
basic:
  1. [flavour turn: Braska encouragement] — Tail does nothing
  2. Noli Me Tangere
  3. Tail Beam
  4. goto 3            // loops Tail Beam forever
hpTrigger (once):
  if hp < maxHp/4: Noli Me Tangere + [Jecht flavour]
```
The Tail is a **fixed script with one HP trigger** — the simplest boss in the chain and a good tutorial for the ATB pacing.

### 5.2 Leg

```
Action1:
  1/3: Berserk on a non-Berserked char   (if all Berserked -> Absorb)
  1/3: Break  on a non-Petrified char
  1/3: Slow   on a non-Slowed char       (if all Slowed   -> Absorb)

basic (26-step fixed table, abbreviated):
  1 Action1 · 2 flavour · 3 Action1 · 4 flavour · 5 flavour · 6 Action1 ·
  7 flavour · 8 VITA BREVIS · 9 Action1 · 10-12 flavour · 13 Action1 ·
  14 Action1 · 15 VITA BREVIS · 16 Action1 · 17 flavour · 18 Action1 ·
  19 Action1 · 20 flavour · 21 VITA BREVIS · 22 Action1 · 23 Action1 ·
  24 Action1 · 25 goto 21        // steady-state: VitaBrevis every 4th turn
```
Nodes run their own independent colour machine (§3.2) on their own ATB.

### 5.3 Body/Core + Bulwarks

Core: see §4.1. Bulwarks: see §3.3 retaliation pseudocode.
Extra Core flavour triggers: a one-time three-line exchange if the Bulwarks have used "…detected" ≥4 times; a one-time two-line exchange after the third Memento Mori.

### 5.4 Head + Redoubts

```
// PHASE A — before the Redoubts have ever been KO'd
  1. [Shuyin taunt] — Head does nothing
  2. if (rightRedoubt.hp > 0 && leftRedoubt.hp > 0): Pallida Mors
     else: do nothing
  3. goto 2

// PHASE B — after the Redoubts have been KO'd once
  1. Acta Est Fabula; Head becomes targetable
  2. [Shuyin taunt]; Head + both Redoubts begin counting turns
  3. Action1
  4. [Jecht urgency line] — Head does nothing
  5. Action1
  6. goto 5

Action1:
  if (rightRedoubt.isKO && leftRedoubt.isKO): Acta Est Fabula
  else if (hp crosses 4/5, 3/5, 2/5, or 1/5 of maxHp): Nemo Ante Mortem Beatus
  else if (actionCount >= 15): actionCount = 0; Odi Et Amo
  else: Mors Certa

counter: on being hit by any attack -> actionCount += 1
hpTrigger: on entering critical -> [Jecht line]
random: [Auron line] at low probability

// THE FAIL CLOCK (see §4.2.1). SinirothX's transcription has a
// "Turn Count Pattern:" header here that he left untranslated; this is
// what lives in it. Only runs in PHASE B.
onEnemyTurnResolved(u in {Head, RightRedoubt, LeftRedoubt}):
    if (phase != B) return
    enemyTurns += 1
    if (enemyTurns == FIRE_AT_TURN/2): [Auron "half-way to firing power"]
    if (enemyTurns % LINE_INTERVAL == 0 && enemyTurns < FIRE_AT_TURN):
        [Shuyin line 3..6]                       // Head does nothing that turn
    if (enemyTurns >= FIRE_AT_TURN):
        [Shuyin "Now, Vegnagun. Fire!"] -> GAME OVER, bad ending
// head.hp <= 0 must be resolved BEFORE this hook, so a killing blow in the
// same frame as the 7th line wins.
```

**Shuyin's speech counter is the timer.** Lines 1 and 2 are scripted (battle start; Phase B entry). Lines 3–6 come off the turn count. Line 7 ends the run. Never display a number — the lines *are* the countdown. Full table and the `FIRE_AT_TURN` / `LINE_INTERVAL` presets are in §4.2.

Redoubt scripts:
```
// before Acta Est Fabula has been used on it
  if other Redoubt is KO'd: Full-Life on it
  else: do nothing

// after Acta Est Fabula
RIGHT: 1 Lacrimosa · 2 Blind (prefer non-Blinded) · 3 Flare ·
       4 Break (prefer non-Petrified) · 5 goto 1
LEFT:  1 Lacrimosa (MP damage) · 2 Slow (prefer non-Slowed) ·
       3 Dispel · 4 Demi · 5 goto 1
statusOverride: if the other Redoubt is KO'd, run 2 steps then Full-Life it;
                and skip the step if it is not Flare (Right) / not Demi (Left)
```

### 5.5 Shuyin — the eight-turn cycle

```
1. Normal Attack (random target)
2. TERROR OF ZANARKAND
3. Normal Attack
4. Run & Slash
5. Normal Attack
6. Spin Cut
7. Normal Attack
8. Force Rain
-> goto 1
```

**Interrupts (turn is consumed, no attack):**
- `hp >= maxHp/2`: **1/10** chance per turn of a yell or a one-shot Braska/Auron/Jecht line (5 available; each used at most once).
- `hp <  maxHp/2`: **1/14** chance per turn (7 available).

**Targeting quirk — version-dependent, and a real gameplay difference:**
| Version | Behaviour |
|---|---|
| **Original PS2 (NTSC/PAL FFX-2)** | Shuyin **preferentially targets Yuna** whenever she is alive. Consequence: **do not make Yuna the healer** in this version. |
| **International + Last Mission / HD Remaster** | Targets **any** party member. |
`[single source: FF Wiki]`

*Pyrefly Reprise recommendation:* implement the **original** behaviour (it is more characterful — he is hunting the woman wearing Lenne's dressphere) and expose it as a difficulty/authenticity toggle.

---

## 6. The party at the final battle

### 6.1 Level and progression context

- Boss levels across the chain run **38 → 58**; Shuyin is **Lv 58**.
- Typical completion level for a normal (non-grinding, sidequest-completing) playthrough at this point is **Lv 45–52**. `[estimate — community consensus; no authoritative source]`
- EXP curves differ per girl: **Yuna is slowest** (1,350,322 EXP to Lv 99), **Rikku** 1,249,480, **Paine** 1,169,767. So at a shared point in the story Paine is typically **1–2 levels ahead of Yuna**. `[single source: FF Wiki]`
- **Crucial mechanic for the stat tables below:** in FFX-2 a character's stats come almost entirely from **the equipped dressphere + level**, not from the character. Yuna, Rikku and Paine have **identical stats in the same dressphere** — the only exceptions are **Trainer**, **Mascot**, and the three **Special Dresspheres**. `[verified: 2 sources]`

### 6.2 Dressphere stat tables at Lv 45 and Lv 50

All values from the FF Wiki per-dressphere level tables. `[single source]` (but these are transcribed game tables, not opinion — high confidence).

**Level 45**

| Dressphere | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| **Berserker** | **2,881** | 76 | **104** | 4 | 28 | 5 | **64** | 105 | **17** | 14 |
| **Dark Knight** | 2,668 | 216 | 107 | 72 | **136** | **93** | 40 | 104 | 3 | 11 |
| **Warrior** | 2,063 | 102 | 101 | 36 | 115 | 11 | 52 | 103 | 6 | 13 |
| **Thief** | 1,773 | 116 | 72 | 56 | 42 | 72 | 63 | 113 | **23** | **31** |
| **Gunner** | 1,680 | 84 | 81 | 40 | 45 | 45 | 55 | **126** | 5 | 19 |
| **Samurai** | 1,636 | 124 | 99 | 60 | 45 | 56 | 58 | 107 | 13 | 15 |
| **Alchemist** | 1,524 | 70 | 76 | 21 | 39 | 19 | 55 | 121 | 4 | 12 |
| **Gun Mage** | 1,462 | 166 | 92 | 96 | 38 | 81 | 56 | 123 | 4 | 11 |
| **Lady Luck** | 1,390 | 174 | 66 | 60 | 27 | 49 | 57 | 124 | 6 | **30** |
| **White Mage** | 1,221 | 203 | 14 | 101 | 16 | **150** | 54 | 102 | 6 | 11 |
| **Songstress** | 1,209 | 164 | 11 | 77 | 11 | 50 | 58 | 99 | 11 | 10 |
| **Black Mage** | 1,184 | **224** | 13 | **106** | 12 | 142 | 53 | 101 | 5 | 11 |
| **Trainer** | 1,866 | 134 | 92 | 52 | 55 | 34 | 53 | 105 | 7 | 10 |
| **Mascot** | **3,433** | **340** | 95 | 105 | 139 | **123** | **62** | **126** | 16 | 18 |

**Level 50**

| Dressphere | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| **Berserker** | **3,163** | 82 | **112** | 5 | 29 | 5 | 64 | 106 | 18 | 15 |
| **Dark Knight** | 2,931 | 229 | 116 | 77 | **139** | 96 | 41 | 104 | 4 | 12 |
| **Warrior** | 2,267 | 110 | 109 | 38 | 117 | 12 | 53 | 104 | 7 | 14 |
| **Thief** | 1,928 | 123 | 78 | 62 | 45 | 76 | 64 | 114 | 24 | 31 |
| **Gunner** | 1,822 | 90 | 87 | 44 | 47 | 47 | 56 | 127 | 5 | 20 |
| **Samurai** | 1,791 | 135 | 107 | 64 | 47 | 58 | 58 | 108 | 14 | 16 |
| **Alchemist** | 1,652 | 75 | 81 | 23 | 42 | 21 | 55 | 123 | 4 | 13 |
| **Gun Mage** | 1,588 | 179 | 99 | 102 | 41 | 83 | 56 | 124 | 5 | 12 |
| **Lady Luck** | 1,503 | 188 | 72 | 65 | 28 | 51 | 58 | 125 | 7 | 32 |
| **White Mage** | 1,334 | 219 | 14 | 108 | 17 | **155** | 54 | 102 | 7 | 12 |
| **Songstress** | 1,323 | 176 | 12 | 84 | 12 | 52 | 59 | 100 | 12 | 11 |
| **Black Mage** | 1,294 | **242** | 13 | **112** | 12 | 146 | 53 | 101 | 6 | 12 |
| **Trainer** | 2,028 | 143 | 99 | 55 | 57 | 35 | 53 | 106 | 8 | 11 |
| **Mascot** | **3,767** | **364** | 102 | 112 | 140 | 124 | 62 | 127 | 17 | 19 |

`[verified: 2 sources]` — the Lv 50 Dark Knight row (HP 2,931 / MP 229 / Str 116 / Mag 77 / Def 139 / MDef 96 / Agi 41 / Acc 104 / Eva 4 / Luck 12), including the low Agi 41 called out below as "the worst in the game," is an exact match against jegged.com's Dark Knight dressphere page.

**Reading the spread:** FFX-2 dresspheres are **extreme**, not gently differentiated. A Lv 50 Black Mage has **DEF 12**; a Lv 50 Dark Knight has **DEF 139**. A Lv 50 Warrior has **MDEF 12** while a White Mage has **155**. Against Vegnagun (all-magic) the Warrior is paper and the White Mage is a wall; against Shuyin (all-physical except Force Rain) it inverts. **This is the intended texture of the whole chain and must be preserved in the port.** Dark Knight and Mascot are the only two dresspheres that are good on *both* axes — which is exactly why every guide recommends them.

### 6.3 Reference stat blocks for a "typical" Lv 48 finale party

`[estimate — synthesised for the fan game, derived by interpolating §6.2 and adding the accessory/grid bonuses in §6.5–6.6]`

| Slot | Girl | Dressphere | Base HP | Base Str/Mag | Base Def/MDef | Accessories | Effective role |
|---|---|---|---|---|---|---|---|
| A | **Paine** | Dark Knight | ~2,800 | 112 / 75 | 138 / 95 | Hyper Wrist (+30 Str), Speed Bracer (Auto-Haste) | Darkness spam; bulwark/redoubt sweeper |
| B | **Rikku** | Dark Knight *or* Alchemist | ~2,800 / ~1,590 | 112 / 75 | 138 / 95 | Crystal Bangle (+100% HP), Diamond Gloves (+40 Def) | second Darkness, or Mix/Stash item engine |
| C | **Yuna** | White Mage → Gun Mage swap | ~1,280 | 14 / 105 | 16 / 152 | Crystal Bangle, Moon Bracer (Auto-Shell) | Curaga/Life/Protect/Shell; Mighty Guard opener |

Garment grid on each: see §6.6.

### 6.4 Abilities the party realistically has learned by Chapter 5

Selected from the full ability lists; **AP** = cost to learn, **MP** = cost to use. `[verified: 2 sources: StarNeptune Dressphere FAQ + FF Wiki, cross-confirmed against jegged.com's Dark Knight dressphere page]`

**Dark Knight** (mastery **490 AP total** `[verified: 2 sources]` — jegged.com's own per-ability AP list for Dark Knight sums to exactly 490)
| Ability | AP | Cost | Effect |
|---|---|---|---|
| **Darkness** | initial | **12.5% (1/8) of user's max HP** `[verified: 2 sources]` | **Special damage to ALL enemies. Ignores Defense. Long range. Cannot crit.** Free if user has Spellspring. **Note:** jegged.com describes Darkness as ignoring both Defense *and* Magic Defense; this doc states only "Ignores Defense." Flagged as a minor, unresolved wording discrepancy rather than a hard contradiction — Darkness is a non-magic special attack, so MDef would not normally apply regardless. |
| Charon | 20 | user's life | Sacrifice the user to deal heavy damage to one enemy. |
| Arcana | varies | varies | Drain, Death, Doom, Bio, Black Sky, Flare-class utility. |
| Poisonproof / Stoneproof / Confuseproof / Curseproof / Deathproof | 30/30/30/30/40 | — | Auto status immunities. |

**Darkness is the single most important player ability in this chapter.** It is *long range* (so it reaches the Nodes), it *ignores Defense* (so Shuyin's DEF 132 and the Right Redoubt's DEF 133 are irrelevant), and it is *multi-target* (so it hits Head + both Redoubts, or Core + both Bulwarks, in one action). Two Dark Knights alternating Darkness is the community-standard clear.

**White Mage:** Cure 20AP/4MP · Cura 40/10 · **Curaga 80/20** · Regen 80/40 · **Full-Cure 80/99** · Esuna 20/10 · Dispel 30/12 · Life 30/18 · **Full-Life 160/60** · Shell 30/10 · Protect 30/12 · Reflect 30/14 · White Magic Lv2 40 / Lv3 60 (cast-time −30% / −50%). **No Haste** — that must come from items or Songstress/Warrior.

**Gun Mage — Blue Bullets that matter here:**
| Bullet | MP | Learned from | Why |
|---|---|---|---|
| **Mighty Guard** | 32 | Garik Ronso, Haizhe | **Shell + Protect on the whole party in one action.** Every guide opens the Body and Head fights with this. |
| **White Wind** | 16 | Bully Cap, Coeurl, Mycotoxin, Ms. Goon | Party heal + status clear — the Mors Certa answer. |
| Supernova | 70 | Ultima Weapon, Paragon | all-enemy damage |
| Cry in the Night | 80 | Mega Tonberry | all-enemy damage; **reaches Nodes** |
| **Absorb** | 3 | …**Vegnagun** | Vegnagun's Leg is a Blue Bullet source — learn Absorb off the Leg mid-chain. |

**Alchemist:** **Mix** (combine two items into a stronger tiered effect) and **Stash** (use items from an *infinite* supply once learned, at a longer charge time). Tiered Mix families relevant here: Restorative (Hi-Potion → Mega-Potion → Ultra Potion → **Final Elixir**), Reviving (Mega Phoenix → Final Phoenix → Fantasy Phoenix), Stamina/Mana (→ Mega Cocktail), Haste (→ **Chocobo Wing**, party Hastega), Wall/Hi-Wall, Drink (→ Hero Drink/Miracle Drink), Curative (Remedy → Panacea). `[single source: FF Wiki Mix table]`
- **Chocobo Wing = Chocobo Feather + Chocobo Feather**, and it Hastes the party — the standard workaround for the White Mage's missing Haste. `[verified: 2 sources]`
- **Mega-Potion = Potion + Hi-Potion.** `[single source]`
- Mix output **cannot break the 9,999 limit** (item-class), except Soul Spring, Soul Sea, Ultra Potion, Mega Vitality and Mega Cocktail.

**Gunner:** **Trigger Happy** (initial, 0 MP) — mash R1 within a time window; **each shot has the power of a normal attack**; Trigger Happy Lv2 (80 AP) and Lv3 (150 AP) extend the window. Cheap Shot (30 AP/8 MP, ignores DEF), Scattershot (80/8, all), Scatterburst (120/36, critical to all), Burst Shot (60/12, guaranteed critical), Tableturner (60/8, *more* damage the higher the target's DEF — note: vs Shuyin DEF 132 and Right Redoubt DEF 133 this is unusually strong).

**Samurai:** Bushido skillset, **Spare Change** (gil toss — **long range, reaches Nodes**), **Zantetsu** (instant KO; every boss in this chain has **Zantetsu resistance 255**, i.e. it never works — do not waste a slot).

**Berserker:** Instinct skillset, **Howl** (doubles user's max HP), **Berserk** (Str up, loses control). Highest HP and Str of any standard dressphere, near-zero defenses.

**Lady Luck:** Attack Reels (60 AP) / Magic Reels (70) / Item Reels (80) / Random Reels (120) — slot minigames; **Attack/Magic Reels and Two/Four Dice are long-range and reach the Nodes**. Critical (160 AP, always crit — a flat ×2 at formula step 9). Luck 30 / Felicity 40.

**Warrior:** **Assault** (100 AP, 0 MP) — casts **Berserk + Haste + Shell + Protect on the party** and grants Str +1. The single best pre-buff action in the game, at the cost of Berserk's loss of control.
**Songstress:** **Jitterbug** (120 AP) hastes the party for as long as she keeps dancing; **Carnival Cancan** (80 AP) doubles party max HP while dancing; **Magical Masque** (20 AP) makes magic attacks harmless while dancing — *devastating against Vegnagun, whose entire moveset is magic-type.* **Flag this as a legitimate cheese route.**

### 6.5 Special Dresspheres ("Special mode")

Mechanics `[verified: 2 sources]`:
- Activated by **visiting every node on the equipped Garment Grid within one battle**.
- On activation the **other two party members vanish** for the duration; the special dressphere is itself a **three-entity party** (main body + two sub-units) that take ATB turns independently.
- **Accessories are disabled** while in a special dressphere, and the **Item command is unavailable**.
- **Base stats scale with the number of nodes on the Garment Grid** — so there is a real tradeoff between a small grid (fast to activate, weak) and a large one (slow, strong). The **Unerring Path** grid exists specifically to activate specials quickly.

| Special | Character | Units | Skillsets | Auto-abilities |
|---|---|---|---|---|
| **Floral Fallal** | **Yuna** | Floral Fallal + Right Pistil + Left Pistil | Fallalery (elemental "Whirl" magic), **Great Whirl** (30 AP, heavy all-enemy — based on Valefor's Energy Blast), Libra; Right/Left Pistilplay + Right/Left Stigma | **Ribbon**, Double HP, Triple HP, Break HP Limit (needs *Aurora Rain*), Break Dmg. Limit (needs *Twilight Rain*) |
| **Machina Maw** | **Rikku** | Machina Maw + Smasher-R + Crusher-L | Machinations, **Vajra** (30 AP, all enemies), Revival (10 AP); Smash / Crush, **Homing Ray**, HP Repair, MP Repair | same five |
| **Full Throttle** | **Paine** | Full Throttle + Dextral Wing + Sinistral Wing | Throttle, Fright (20 AP, damage + Confuse + delay), **Sword Dance** (30 AP); **Dextral Arts** / Sinistral Arts, Stamina, Mettle, Reboot | same five |

**Ribbon on all three units** is the headline: a special dressphere is immune to Mors Certa's Silence/Darkness/Poison, the Left Bulwark's Break/Bio/Doom, and the Leg's Berserk/Break/Slow — the entire status game of this chapter evaporates. **Great Whirl / Vajra / Dextral Arts also reach the Nodes.**

The brief asked whether Floral Fallal is required for the Yuna fight — **it is not**. No part of the finale requires or gates on a special dressphere.

### 6.6 Garment Grids commonly worn at the finale

`[verified: 2 sources]` for grid effects; "commonly worn" is `[estimate]`.

| Grid | Equip bonus | Gates (activate by passing through) | Why it's worn here |
|---|---|---|---|
| **Valiant Lustre** | Def +20, MDef +20 | four gates: Def +20 ×2, MDef +20 ×2 | **Best pure-defence grid.** Stacks to +60/+60. Against an all-magic boss chain this is the default. Ch.5, Thunder Plains — defeat Humbaba. |
| **Unwavering Guard** | Def +15, MDef +15 | Def +15 ×2, MDef +15 ×2 | The step below Valiant Lustre. Ch.3, Djose — defeat Ixion. |
| **Flash of Steel** | Str +20, Mag +20 | Str +20 ×2, Mag +20 ×2 | **Best pure-offence grid** (up to +60/+60). Ch.5 Calm Lands, Argent Inc. 200,000 credits. |
| **Higher Power** | **Break HP Limit** | **Break Damage Limit** | The damage-cap breaker. Ch.5, Ruin Depths (Amazing Chocobo). |
| **The End** | Break HP Limit | Break Damage Limit, **Finale** | Obtained via full Oversoul bestiary. Finale adds **+99,999** at formula step 8. |
| **Megiddo** | Use Black Magic abilities | Use Flare, **Use Ultima** | **Awarded for taking all five temple routes into the Farplane.** The "spam Ultima/Flare" strategy runs on this. |
| **Chaos Maelstrom** | Use Arcana abilities | Mag +15, Arcana wait-down | Lets a non-Dark-Knight cast Arcana. Kilika, squatter-monkey sidequest. |
| **Tempered Will** | — | **Double HP**, **Double MP** | Doubles the whole party's survivability against Nemo Ante Mortem Beatus. Ch.5 Guadosalam. |
| **Heart of Flame** | Fire Eater, Use Fire | Firestrike, Use Fira, Use Firaga | Elemental grid; **note nothing in this chain is fire-weak** — decorative here. |
| **Menace of the Deep** | Water Eater, Use Water | Waterstrike, Use Watera/Waterga | Same caveat. |
| **Restless Sleep** | Use Sleep, Use Bio | Sleepproof, Sleeptouch, Poisonproof, Poisontouch | **Poisonproof matters** vs Mors Certa and the Left Bulwark's Bio. |
| **Bum Rush** | Str +10, Mag +10 | Str +10 ×2, Mag +10 ×2 | Early-game; usually superseded by Ch.5. |
| **Ray of Hope** | **Luck +30** | Luck +30, Dismissal, Butterfingers, **Evasion +50** | Luck/Evasion build; used in the Hero Drink farm. |
| **Mounted Assault** | First Strike | Slowproof, Stopproof, **Use Hastega**, **Auto-Haste** | The non-item route to party Haste. |
| **Salvation Promised** | Use White Magic | **Use Auto-Life** | Insurance against Terror of Zanarkand. |
| **Scourgebane** | — | SLP/PSN, SIL/DRK, CON/BER, CUR/ITC proof gates | Full status lockout — the "poor man's Ribbon." |
| **Unerring Path** | — | none | **All Stats +20, HP +30%, MP +30%**, zero nodes to walk — fastest special-dressphere access. |
| **Font of Power** | Half MP Cost | Mag +15, **One MP Cost** | Makes Ultima/Flare spam sustainable. |
| **Abominable** *(Intl/HD only)* | Itchyproof | SLP/PSN, PTR/DTH, CON/BER, SIL/DRK, **Ribbon** | Full Ribbon on any dressphere. Beat Grand Cup: Hard. |
| **Peerless** *(Intl/HD only)* | — | **Always Crit, Magic Booster, Auto-Haste, Break Damage Limit** | Strongest offensive grid in the game. Its background art is **Vegnagun**. Beat Aeon Cup ×3. |

### 6.7 Accessories commonly worn at the finale

Two slots per character. `[verified: 2 sources]` on effects, cross-confirmed against jegged.com's Accessories page for Crystal Bangle, Mythril Bangle, Speed Bracer, and Cat Nip.

| Accessory | Effect | Availability at this point |
|---|---|---|
| **Crystal Bangle** | **Max HP +100%** `[verified: 2 sources]` | Ch.5 Youth League HQ chest; drops from Machina Panzer. **Very common.** |
| **Mythril Bangle** | Max HP +60% `[verified: 2 sources]` (jegged.com confirms the +60% effect; the "dropped by the Leg" sourcing itself is not covered by that page) | **Dropped by Vegnagun's Leg itself (100%)** |
| **Hyper Wrist** | **Str +30** | Ch.5 Djose Temple, New Cave; Open Air Inc. 5,000 credits. Common. |
| Power Wrist / Wristband | Str +20 / +10 | common |
| **Diamond Gloves** | **Def +40** | Ch.5 New Cave; Zanarkand Dome 6,000 gil. Common. |
| Crystal Gloves | Def +60 | Ch.3 Bevelle Temple chest |
| **Mystery Veil / Oath Veil** | MDef +40 / +60 | New Cave / Bevelle Temple + **Bevelle Underground Ch.5**. **MDef is the stat that matters vs Vegnagun.** |
| **Speed Bracer** | **Constant Haste**, user can cast Hastega `[verified: 2 sources]` | Via Infinito Cloister 40 (Black Elemental); Youth League Tournament. **Rare-ish but the guides' #1 pick.** |
| Moon Bracer / Shining Bracer / **Defense Bracer** | Auto-Shell / Auto-Protect / **both** | Besaid Ch.3 & Via Infinito 40 / Mushroom Rock Ch.2 / **Calm Lands Ch.5** |
| **Adamantite** | Constant **Protect + Shell**, HP +100%, Def +120, MDef +120, **Agi −30** | Machina Panzer fiend tale; Gunner's Gauntlet 2800+. Powerful but the Agi hit is real. |
| **Ribbon** | **Guards against all status ailments** | **Bevelle Underground plate puzzle** — obtainable, but one copy; also drops from Angra Mainyu. **"Rare" in the brief is right: most players have 0–1.** |
| **Iron Duke** | HP +100%, MP +100%, **Str/Mag/Def/MDef +100 each**, Agi +10, Acc +100, Eva +100, Luck +50 | **Via Infinito Cloister 100 — defeat Trema.** Post-game-tier; a normal finale party will **not** have this. |
| **Ragnarok** | **MP cost 0 in battle** | Mi'ihen Highroad Mystery (blame Rikku); Farplane Cup. Obtainable but easy to miss. |
| **Cat Nip** | At Critical HP, all attacks do **9,999**; **Int/HD versions add constant Berserk + Slow** `[verified: 2 sources]` — jegged.com states plainly that "all attacks do 9,999 damage" at critical, and that International/HD versions add constant Berserk and Slow on the wearer, matching this version-split claim exactly | Via Infinito 40. **Version-critical:** in the original PS2 game, Cat Nip + Trigger Happy = repeated 9,999s and trivialises the whole chain. Int/HD nerfed it. |
| **Rabite's Foot** | **Luck +100** | Jumbo Cactuar rare drop; Chocobo Cup |
| **Key to Success** | Double AP/EXP/gil/items, doubles item potency, HP +100%, MP +100%, Luck +100 | Guadosalam, Tobli Productions (conditional) |
| **Gold Hairpin** | Halves MP cost, Mag +20 | Chateau Leblanc minigame |
| **Soul of Thamasa** | Spells ×1.5, **MP cost doubled**, Mag +15 | Zanarkand Dome (Operation: Monkey!) |
| **Arcane Lore / Sword Lore / White Lore** etc. | Use that dressphere's skillset from any dressphere, +12 Str or Mag | Buyable Ch.5 at Lake Macalania for 50,000 gil each |
| **Invincible / Enterprise** | Break Damage Limit / Break HP Limit | Kilika Island Base (cameraman) / Moonflow-skip chain |

**Recommended "typical" loadout to model:** each girl wears **Crystal Bangle + Hyper Wrist** (attackers) or **Crystal Bangle + Oath Veil** (healer), with one **Speed Bracer** if the player found Via Infinito 40. Ribbon on the healer if owned.

### 6.8 Inventory at the finale — realistic counts

`[estimate]` — synthesised from the chain's own drops/steals plus normal Ch.5 shopping. No source publishes "typical inventory," so these are design targets, not data.

| Item | Typical count | Notes |
|---|---|---|
| Potion / Hi-Potion | 30–60 / 20–40 | Mix feedstock |
| **X-Potion** | 10–30 | Tail drops 4–6 per steal |
| **Mega-Potion** | 10–20 | Bulwark drops |
| **Elixir** | 3–8 | Leg steal |
| **Megalixir** | 3–6 | **Tail, Body and Nodes each drop one at 100%** |
| **Turbo Ether** | 4–10 | Body steal; 3 in Heart of the Farplane chests |
| Phoenix Down | 20–40 | Bulwark/Redoubt steals |
| **Mega Phoenix** | 3–8 | Redoubt rare steal; 2 in Heart of the Farplane |
| Remedy | 10–20 | Mors Certa insurance |
| **Light Curtain** (Protect) | 10–20 | **The Shuyin answer** |
| **Lunar Curtain** (Shell) | 10–20 | **The Vegnagun answer** |
| **Chocobo Feather** | 10–20 | Mix into Chocobo Wing for party Haste |
| Hero Drink | 0–3 (or 24 with the Node farm) | Node rare drop + Shuyin steal only |
| Gil | 100,000–400,000 | each Vegnagun part gives 3,000 gil + 3,000–10,000 Pilfer |

---

## 7. Strategy — what players actually do

### 7.1 The canonical clear

Two **Dark Knights** spamming **Darkness**, one **White Mage** or **Alchemist** healing. `[verified: 2 sources — FF Wiki + GamerGuides]`

Why it works, mechanically:
- Darkness is **special damage that ignores Defense** → the Right Redoubt's DEF 133 and Shuyin's DEF 132 stop mattering.
- It is **long range** → reaches Nodes.
- It is **all-enemy** → one action hits Head + both Redoubts, or Core + both Bulwarks.
- Dark Knight has the **best combined Def (139) and MDef (96)** of any offensive dressphere at Lv 50, so the Darkness user is also the party's second-best tank.
- Its cost is **HP, not MP** — irrelevant with Curaga up, and **free if the user has Spellspring** (Ragnarok accessory, Font of Power grid, or SOS Spellspring).

### 7.2 Per-battle strategy

| Battle | Opener | Core loop | Traps |
|---|---|---|---|
| **Tail** | Auto-Protect accessories rather than cast Protect (the Tail's hits are fractional/constant and **partly unmitigable**) | Two attackers + one dedicated healer; keep everyone **above 1,323 HP** so Noli Me Tangere can't wipe | **Buffs are near-useless**: Tail Beam is %-max-HP and Noli Me Tangere is a flat constant — neither scales off your Def/MDef. This is the one fight where **raw max HP is the only defence**. |
| **Leg + Nodes** | **Buff to Protect + Haste on everyone.** Chocobo Wing (Mix of 2 Chocobo Feathers) is the usual Haste source. | Ignore the Nodes' 300,000 HP; **all damage goes to the Leg (18,220)** | **Cast Reflect on the Leg** — the Green Node's Cura/Regen/Shell/Protect then bounce onto *your* party. Cast Reflect on **your** party too, and the Yellow Node's spells bounce back at the Leg, keeping the Nodes cycling colours forever. Prep for **Vita Brevis** (party-wide + guaranteed Delay). |
| **Body + Bulwarks** | **Mighty Guard** (Gun Mage Blue Bullet, 32 MP) = party Shell **and** Protect in one action | Two uses of Darkness kill **both** Bulwarks and chunk the Core. Then hammer the Core. | **Do not attack the Bulwarks with the same damage class repeatedly** — they mirror your type back. Killing a Bulwark makes the Core waste its turn on Full-Life, which **stops the Charge Core counter**. Three unimpeded Core turns = Memento Mori. |
| **Head + Redoubts** | **Mighty Guard** again | Kill **Right Redoubt with magic** (MDef 0) and **Left Redoubt with physicals** (Def 0); then burn the Head | **Time limit.** Don't over-invest in the Redoubts — they revive. **Odi Et Amo strips every buff you have**, so re-Mighty-Guard after it. Nemo Ante Mortem Beatus fires at each 20% HP milestone — bank healing before you cross one. |
| **Shuyin** | **Light Curtain** (Protect) on all three + **Lunar Curtain** (Shell) on all three; Haste the attackers | Dedicate one healer to whoever ate Terror of Zanarkand; other two go full offence | **Terror of Zanarkand ignores Defense** — Protect helps (it's Protect-reducible) but armour does not. In the **original PS2 version he hunts Yuna**, so **Yuna must not be your healer there.** Steal the **Hero Drink** early (12.5%). |

### 7.3 Other well-known routes

| Route | How | Notes |
|---|---|---|
| **Gunner + Cat Nip (original PS2 only)** | Drop the Gunner to Critical HP, then Trigger Happy: **every shot is 9,999**. Speed Bracer for permanent Haste. Cat Nip + Speed Bracer both come from **Via Infinito Cloister 40 (Black Elemental)**. | **Broken in the original; patched in International/HD** where Cat Nip adds Auto-Berserk (and Slow), so you can't control the Trigger Happy input. `[verified: 2 sources]` |
| **Megiddo Ultima/Flare spam** | Walk every gate on the **Megiddo** grid (earned by taking **all five temple routes** to the Farplane), then spam Ultima and Flare with an Alchemist on Ether/Mega-Potion duty. | A captured **Dark Elemental** with **One MP Cost** removes the Ether dependency entirely. `[single source]` |
| **Mascot** | Yuna's **Moogle Beam** ignores **Magic Defense**; Paine's **Cactling Gun** ignores **Defense**. Both are long range. With Break Damage Limit + Iron Duke this shreds even the Nodes. | Mascot also has the best raw stat line of any dressphere (3,767 HP at Lv 50). Requires **Episode Complete everywhere**. |
| **Captured-fiend nuke (Int/HD only)** | A high-level captured creature with Break/Total Limit Break, Ultima or Meteor, and high Magic. **Dark Elemental** is the recommended pick. One Meteor can end Shuyin. | `[single source]` |
| **Songstress cheese** | **Magical Masque** makes magic attacks harmless while dancing. **Vegnagun's entire moveset is magic-type.** | Not in any guide I found, but it falls directly out of the decompiled ability types. `[estimate — derived]` |
| **Samurai** | Bushido + **Spare Change** (long range). | **Do not bring Zantetsu** — every enemy in the chain has Zantetsu resistance 255. |
| **Berserker** | Highest Str and HP; but DEF 29 / MDEF 5 at Lv 50. | Needs Def/MDef-boosting grids (Valiant Lustre) and accessories, or it dies to Nemo Ante Mortem Beatus. |
| **Lady Luck** | Attack/Magic/Item/Random Reels; **Critical** (always-crit = flat ×2). Reels are long range. | Swingy; Luck 32 at Lv 50 is the best in the game. |

### 7.4 Who to Haste

Priority order `[estimate — derived from Agi values in §6.2]`: **Black Mage (Agi 53) → Dark Knight (Agi 41, the worst in the game) → Samurai (58) → White Mage (54)**. Sources for Haste: **Speed Bracer** (constant), **Mounted Assault** grid (Auto-Haste gate), **Warrior's Assault**, **Songstress Jitterbug**, **Chocobo Wing** (Mix), **Haste Bangle** (SOS). The wiki specifically calls out Speed Bracers for **Black Mage, Dark Knight and Samurai**. `[single source]`

---

## 8. Endings — conditions, in brief

FFX-2 has **four** ending tiers. The percentage and the "whistle" are **two separate systems**; the brief conflated them. `[verified: 2 sources]`

| Tier | Requirement | What plays |
|---|---|---|
| **Bad / Game Over** | Fail to kill Vegnagun (Head) before the fail clock runs out — i.e. before **Shuyin's seventh line** — **or** get wiped in that fight | Shuyin fires the cannon; Spira is destroyed. Mechanic and timings: §4.2 |
| **Normal** | Beat Shuyin | Nooj, Gippal and Baralai address Spira from the Luca stadium and dissolve their factions; YRP fly to Besaid |
| **Sad** *(pre-credits scene)* | Beat Shuyin **without** the Good-ending flags (the wiki's threshold is **<75% story completion, or missing the flags**) | Crossing the Farplane glen, Tidus's spirit embraces Yuna; she says she loves him and that he'll always be part of her; he disperses into pyreflies. Normal ending follows. |
| **Good** *(post-credits FMV)* | **All three flags**: ① talk to **Maechen** in **Chateau Leblanc, Chapter 3** ② at the end of Chapter 3, after Yuna falls into the Farplane and says she's alone, press **X repeatedly to make Tidus whistle — four times total** ③ after the **"Chapter 5 Complete"** card, press **X** in the Farplane glen to trigger the whistle again. Then **Bahamut's fayth** appears and asks if Yuna wants to see Tidus again — **answer yes**. | Post-credits FMV: the fayth gather Tidus's scattered pyreflies and send him to **Besaid**; he surfaces from the water; Yuna runs to him while Rikku, Paine, Wakka, Lulu and the village celebrate. |
| **Perfect** *(extra scene after the Good ending)* | **100% story completion** **and** answer yes to the fayth | Tidus and Yuna travel to the **Zanarkand Ruins**. He wonders aloud whether he's still a dream of the fayth and might vanish; she tells him he won't, and stands in the spot he stood in two years earlier — closing the loop. |
| **Monkey** | Good-ending flags set but you answer **no** to the fayth | Yuna says Tidus is already with her and walks away; after the credits, two monkeys sit together in the Zanarkand sunset. |
| **Creature Creator** *(Int/HD only)* | 100% **Creature Creator** completion — **this permanently locks out the Zanarkand/Perfect scene** | A spoof of FFX's opening: fiends around a campfire in Zanarkand with the Brotherhood, Wakka's blitzball and Yuna's staff nearby; Shinra waves and says thanks. |

Additional note: because the **Youth League / New Yevon** branch awards points independently, the *available* total is around **105%** — you do not need literally every event to reach 100%. `[single source]`

**What to include after the fight, for *Pyrefly Reprise*:**
1. The Lenne/Shuyin release (see §9 beats 18–22) — **non-optional, it is the emotional payoff**.
2. The **"Chapter 5 Complete"** card, then the **Farplane glen walk** with the input window. The input window is the whole good-ending mechanic and is famously easy to miss — **telegraph it** (a soft whistle cue on the audio bus, a controller prompt).
3. The fayth's yes/no question.
4. Normal ending montage → credits over "1000 Words (Orchestra)" → the ending FMV tier the player earned.

---

## 9. Scene & beat sheet

Numbered beats with speaker, tone, and camera. **Paraphrased.** A handful of <15-word quotes are marked `"…"` where the line itself is the beat.

### 9.1 Act 0 — the descent (context, ~30–60 min of play before the finale)

| # | Beat | Speaker | Tone | Camera |
|---|---|---|---|---|
| 0.1 | The Gullwings jump into the Farplane tunnels beneath a temple, following Nooj, Gippal and the possessed Baralai. The Leblanc Syndicate comes too. | — | committed, no-turning-back | long fall, vertical pan |
| 0.2 | **Road to the Farplane**: five separate routes descend from **Besaid, Kilika, Djose, Bevelle Underground, Calm Lands**. Each has a different traversal gimmick (island rides, fire geysers, platform-ordering, straight hops, teleporters) but identical fiends. Taking **all five** awards the **Megiddo** Garment Grid. | — | exploratory | wide diorama, floating stone |
| 0.3 | Three platform bosses in sequence: **Shiva**, then **Cindy/Sandy/Mindy (Magus Sisters)**, then **Anima** — corrupted aeons. Anima drops the **Immortal Soul** grid. | — | mournful; these were Yuna's own aeons | — |
| 0.4 | **Farplane Glen.** Leblanc, Ormi and Logos are waiting, eyeing the path down. Leblanc sells items. Everyone goes back up to the *Celsius* to prepare. | Leblanc | comic relief before the drop | flower field, wide |
| 0.5 | Aboard the *Celsius*, Shinra reports a hypothesis: the Farplane holds a boundless energy that could power cities of light. Yuna notes it won't happen in her lifetime. Optional character scenes gate on story % (70/80/95). | Shinra, Yuna | quiet, wistful, foreshadowing the sequel material | interior, tight |
| 0.6 | **Heart of the Farplane.** The architecture stops being organic and becomes **built** — Vegnagun's own structure. A **musical-keyboard puzzle**: the party collects note fragments across platforms and plays them at organ pads to drop barriers. | — | eerie; the organ motif is Vegnagun's control interface | — |
| 0.7 | **Gippal** runs ahead alone, leaving Paine a sphere from her old sphere-recorder. | Gippal, Paine | Paine's past closing | over-shoulder |

### 9.2 Act 1 — Vegnagun's chamber

| # | Beat | Speaker | Tone | Camera |
|---|---|---|---|---|
| 1 | The party reaches Vegnagun. **Nooj proposes to sacrifice himself** — graze Baralai enough that Shuyin jumps back into him, then kill himself, taking Shuyin along. | Nooj | flat, resolved, suicidal | low angle on Nooj, Vegnagun's bulk filling frame behind |
| 2 | **Yuna refuses.** She is done with plans that require someone to die — she has already lived that story once. | **Yuna** | the thesis of the whole game | close, then push in |
| 3 | Voices from the Farplane — **Braska** and **Auron** — murmur support. | Braska, Auron | ghostly, warm | no visual source; audio-only |
| 4 | Yuna proposes the alternative: **take Vegnagun apart**, reach Shuyin, and talk to him. Rikku nicknames it, roughly, "Plan B." | Yuna, Rikku | defiant, a little absurd, and that's the point | group two-shot |
| 5 | **Gippal, Leblanc and Rikku** agree — people built Vegnagun, so people can unbuild it. | Gippal, Leblanc, Rikku | rallying | wide, everyone in frame |
| 6 | The group **splits into three teams**, each taking a different part of the machine. | — | mobilisation | overhead map-style shot of Vegnagun's silhouette with three markers |

### 9.3 Act 2 — the four dismantlings

| # | Beat | Speaker | Tone | Camera |
|---|---|---|---|---|
| 7 | **BATTLE: Vegnagun (Tail).** Pre-fight banter: Yuna asks if they're ready; Rikku makes a tail pun; Paine deadpans agreement. Braska speaks during the fight. | YRP, Braska | light before the storm | black-hole battle-in transition |
| 8 | Tail down. Rikku: *"Take that."* Paine warns it isn't over. | Rikku, Paine | brisk | victory beat |
| 9 | **BATTLE: Vegnagun (Leg) + Nodes.** Leblanc's team has already been beaten off the leg. Paine notes Leblanc never stood a chance; Rikku makes a "leg up" pun; Yuna tells them to save it. **Jecht coaches from the Farplane**, explaining the Node colour system — red physical, yellow offensive magic, green recovery — and reminding them the *leg* is the target. | Paine, Rikku, Yuna, Jecht | Jecht as an in-battle tutorial voice; affectionate gruffness | Nodes far overhead, forced-perspective |
| 10 | Leg down. Rikku asks if they got it; Paine says it looks that way; Yuna: *"Shake a leg."* | YRP | relief + running pun gag | — |
| 11 | **Paine breaks off** to help the torso team. **This is the point of no return** — the game lets you walk all the way back to a save sphere and the *Celsius* first. | Paine | — | Paine exits frame; hold on the empty path |
| 12 | Ormi and Logos beg the party to help Leblanc. Party climbs to the torso. | Ormi, Logos | comic desperation | — |
| 13 | **BATTLE: Vegnagun (Body/Core) + Bulwarks.** Yuna: *"It's so big!"* Rikku is glad the climbing is over; Paine tells them to focus. **Auron and Jecht** direct attention to the core; Jecht warns the legs throw damage right back. | YRP, Auron, Jecht | awe → grim focus | extreme low angle; the party is ant-sized |
| 14 | Core down. Rikku exhales; Paine grunts; **Yuna asks where Shuyin is.** | YRP | premature relief | — |
| 15 | **Vegnagun's head lowers in front of them.** **Baralai/Shuyin** declares Spira finished. Vegnagun **transforms**: the jaw splits apart and the main cannon unveils. **The tail plants itself into the terrain behind to siphon Farplane energy.** | Shuyin (in Baralai's body) | dread; the reveal | the head descends into frame from above — the single biggest scale shot in the game |
| 16 | **BATTLE: Vegnagun (Head) + Redoubts.** Shuyin's opening line, roughly: *"Come, Vegnagun. Let us purge this repulsive world."* Then, as the fight starts in earnest: *"The end now begins."* **Jecht:** *"If Vegnagun fires, it's all over."* **Auron** calls out the halfway point. **The cannon charge is visible and rising the whole fight.** | Shuyin, Jecht, Auron, Braska | maximum urgency; the only timed fight in the chain | cut regularly to the charging muzzle |
| 17 | Head down. Rikku asks if it's finally out of juice; Paine says maybe he'll listen now; **Yuna: let's talk to Shuyin.** | YRP | exhausted hope | — |

### 9.4 Act 3 — Shuyin

| # | Beat | Speaker | Tone | Camera |
|---|---|---|---|---|
| 18 | **Shuyin's spirit leaves Baralai's body** and takes corporeal form. Baralai collapses; Nooj and Gippal reach him. | — | the possession ends; three friends reunited off to the side | Baralai falls out of frame-left; hold on Shuyin |
| 19 | **Yuna spherechanges to Songstress** and speaks Lenne's unspoken words — the ones Shuyin never heard as he died. In the JP original Yuna visually **becomes** Lenne for this moment; in the English release she stays Yuna singing/speaking as her. | **Yuna (as Lenne)** | the gamble; tender and false at once | slow orbit, pyreflies rising |
| 20 | **Shuyin sees through it.** She is not Lenne. He goes berserk. Rikku: *"You just don't get it, do you?"* Paine: he's not listening. Yuna begs him to stop. | Shuyin, YRP | the plan fails; violence is the only door left | hard cut to combat framing |
| 21 | **BATTLE: Shuyin.** His fighting stance and animations are **Tidus's, exactly** — which is the horror of the fight for Yuna. Braska, Auron and Jecht keep talking her through it; **Jecht calls Shuyin a crybaby**, because he looks like his own son. | Shuyin, Braska, Auron, Jecht | grief-fight, not a hero-fight | keep Yuna in frame reacting to a face she loves |
| 22 | Shuyin falls. **Lenne's spirit separates from the Songstress dressphere** and steps out of Yuna. | Lenne | the release | Lenne's silhouette peels away from Yuna's in pyreflies |
| 23 | **Lenne holds Shuyin.** She tells him to rest — *"Rest with me."* He lowers his head against her. She says she has **a new song for him**, and thanks Yuna. | **Lenne**, Shuyin | the emotional climax of the game; quiet, no score swell until the piano enters | tight two-shot, warm key light, everything else falls to black |
| 24 | The two **dissolve into pyreflies together** and drift up. | — | resolution | vertical rise; camera follows the motes |
| 25 | YRP exit Vegnagun's carcass and rejoin the group. **Nooj, Baralai and Gippal** are whole again — Paine's long silence with them ends. | YRP, Nooj, Baralai, Gippal | earned quiet | wide reunion |
| 26 | **"Chapter 5 Complete"** card. | — | — | full-screen card |
| 27 | **The Farplane glen walk.** Yuna crosses the flower field. **Player input window: press X.** If the flags are set, a whistle answers. | Yuna | the held breath | long dolly across flowers; no dialogue |
| 28 | **Bahamut's fayth** appears — the child — and asks whether she wants to see him again. | Fayth (Bahamut) | offered grace | low angle on the child; Yuna kneeling |
| 29 | **Normal ending:** Nooj, Gippal and Baralai speak at the Luca stadium and dissolve their factions. Nooj frames it as a ship they have all been sailing since birth — Spira. Gippal mentions Yuna is going home. | Nooj, Gippal, Baralai | public, hopeful, a little corny on purpose | stadium wide → crowd |
| 30 | YRP fly to Besaid on the *Celsius*. Credits over **"1000 Words (Orchestra Version)."** | — | — | airship, high altitude |
| 31 | **Good ending FMV (post-credits):** Tidus surfaces off **Besaid beach**. Yuna runs to him. Rikku, Paine, Wakka, Lulu and the village celebrate; Wakka interrupts the moment; the newborn is shown. | — | joy | beach, golden hour, water |
| 32 | **Perfect ending (after that):** Tidus and Yuna at the **Zanarkand Ruins**. He asks if he might still vanish; she says no. She stands where he stood. | Tidus, Yuna | circular, calm | the exact framing of FFX's own Zanarkand shot |

---

## 10. Art direction for sprite artists

### 10.1 Vegnagun — the machine

Source basis: FF Wiki description + direct inspection of in-game screenshots (`Vegnagun_front.jpg`, `VegnaHEAD.jpg`).

| Property | Detail |
|---|---|
| **Silhouette** | A **locust/beetle body with moth-like wings** — deliberately evoking **Beelzebub, "Lord of the Flies."** Despite being pure machina, it reads **organic**: chitin plates, tendon-like cabling, ribbed segments. |
| **Head** | **Skull-esque.** A pair of **autonomous horns** and **two pairs of tusks** — the tusks are the **Redoubts** you fight. |
| **Palette (observed)** | Body/leg/tail: **cold steel grey to off-white**, with deep charcoal in the recesses and a faint blue-green patina. Head: **darker — gunmetal to blue-black**, with lighter grey-blue highlights on the plate ridges. |
| **Emissives** | **Red** — glowing eyes and sensor pods clustered along the head and the Redoubt housings. **Cyan/teal** — a narrow slit of eye-light in the head's central mask and small running lights along the plating. **White-blue** — the cannon charge, which reads as a starburst of hard white shards blooming out of the muzzle. |
| **Scale** | **Colossal.** In the establishing shot a human figure is roughly **1/40th of the frame height** while Vegnagun fills the rest. Each individually-fought "part" is itself the size of a building. The Leg alone is a climbable structure. |
| **Cannon** | Housed in the mouth. The **jaw splits apart** and the mouth gapes to unveil it. Fires a concentrated energy beam. |
| **Cockpit** | An **organ-like keyboard** sits atop the head; each key glows a different colour when pressed. *(In-fiction quirk worth keeping: the organ faces the opposite way from the cannon, so the pilot literally cannot see what he's firing at.)* |

**HD-2D translation notes:**
- Build Vegnagun as **3D diorama geometry, not a billboard**. It is the one thing in the chapter that must dwarf the pixel-art sprites, and parallax sells that. The girls stay as billboard sprites; Vegnagun is the set.
- Each battle is a **different camera framing of the same object** — tail (looking back along a ridge), leg (looking up a pillar), body (looking up into the thorax), head (the head descending into frame). Reuse geometry, change the shot.
- Red emissives should **pulse slowly at rest and fast during Charge Core / cannon charge** — it's your free tension meter.
- The **black-hole battle-in transition** (§2) should be reserved exclusively for Vegnagun's four battles. Shuyin uses the normal one. That contrast is free storytelling: Shuyin is a person, Vegnagun is not.

### 10.2 Shuyin

`[verified: 2 sources]` — FF Wiki description, corroborated by the reunion screenshot.

| Feature | Detail |
|---|---|
| Build / height | **176 cm (5'9")**. Same build as Tidus — same motion-capture actor, same voice actor, same stance. |
| Hair | **Shoulder-length, dishevelled blond.** |
| Eyes | **Blue.** |
| Jacket | **Yellow back panel, pale dark-green front.** |
| Sleeves | **Red-and-black, elbow-length, square-cut.** |
| Left hand | **Black glove with a green cuff** and a **red** elbow-length sleeve. |
| Right hand | **Plain black glove**, no decoration. |
| Arm | **Blue armlet.** |
| Lower | **Black shorts**; **yellow boots with high footings**. |
| Sword | **Black hilt; blade graded light blue → black.** |
| Costume logic | The outfit deliberately **resembles Tidus's blitzball uniform**. He is never confirmed to have been a blitzer, but he uses a **blitzball** in Terror of Zanarkand. |

**The palette brief the task asked about:** "darker blue/black with blond hair" is *directionally* right but under-specified — Shuyin's actual palette is **desaturated olive-green and yellow with red accents**, not blue-black. What reads as "dark Tidus" is **lighting and translucency**, not hue. Recommendation for *Pyrefly Reprise*:
- Use the **same base sprite silhouette** as your Tidus, with the costume recoloured per the table above.
- Apply a **cool desaturating grade** (−30% saturation, +cool shadow tint) and a **10–20% alpha with an additive rim** so he reads as a projection made of pyreflies rather than a body. The wiki is explicit: he is a **"shadow"** of accumulated despair, **not an unsent** — *his pyreflies cannot physically interact with the world at all* unless he is possessing someone. He only becomes corporeal for the final battle.
- Give him a **constant slow upward drift of pyrefly motes** off his silhouette.

### 10.3 Lenne

`[verified: 2 sources]`

| Feature | Detail |
|---|---|
| Height | **169 cm (5'7")**, slender |
| Hair | **Long, straight, brown** |
| Eyes | **Brown**; **violet lipstick** |
| Top | **Blue, with white ruffles** extending to the knee **on the left side only** |
| Skirt | **Short black lace**, **blue belt** |
| Boots | **Knee-high brown** |
| Arms | **Black ribbons on the upper arms**; **blue glovelets** held by **black straps** |
| Ears | **Long dangling beaded earrings** |

**This is exactly the Songstress dressphere outfit** — Yuna wears Lenne's clothes for the whole game without knowing it. That is the visual thesis of the ending: when Lenne separates from Yuna in beat 22, **two identical costumes stand apart from each other.** Stage that shot deliberately.

### 10.4 The Farplane

Observed directly from `Farplane_flowerfield.jpg` plus the wiki's descriptions.

| Layer | Detail |
|---|---|
| **Sky / void** | A **soft pink-lavender nebula** with drifting cloud banding — no horizon, no sun. Reads as a painted backdrop. |
| **Aurora** | **Pale teal and sage-green ribbons** hanging vertically in the upper half, like curtains. These are the strongest colour accent. |
| **Terrain** | **Pale grey-white stone terraces** in stepped, layered plateaus, with **waterfalls pouring off every edge** into mist. Wet, luminous, slightly iridescent — the stone picks up faint blue and violet in the shadows. |
| **Atmosphere** | Heavy **volumetric mist** at every terrace base. Very low contrast; almost no true black anywhere in the upper Farplane. |
| **Flowers** | The **Farplane Glen** is a **field of flowers** — the ending walk happens here. Warmer than the terraces. |
| **Pyreflies** | Small **white-gold motes** with soft bloom, drifting **upward**, in constant slow motion. They are the Farplane's ambient particle system and they are *everywhere*. |
| **Progression** | **The deeper you go, the less organic it gets.** Road to the Farplane = stone, water, flowers. Farplane Abyss = darker, barriers, laser hazards. Heart of the Farplane = **built** — architecture, organ keyboards, Vegnagun's own structure. **Let the palette desaturate and cool as the player descends**, from lavender-pink → slate blue → near-monochrome gunmetal at Vegnagun. |

**HD-2D note:** the Farplane is the easiest sell in the whole game for this art style — it is *already* a matte-painting sky with sparse stone geometry. Put the pink-lavender nebula and the aurora ribbons on far parallax planes, the terraces as low-poly 3D with a painted texture, mist as billboard cards, and pyreflies as a single GPU particle system running at low density throughout the chapter.

---

## 11. Conflicts, gaps, and open questions

| # | Issue | Status |
|---|---|---|
| 1 | **Magic/Defense transposition.** FF Wiki infoboxes for **Leg, Body, Head** (and the **Bulwarks**) print Mag/Def swapped relative to SinirothX. | ✅ **RESOLVED 2026-09-15 in favour of SinirothX** — no longer an inference. SinirothX's primary text puts every stat on its own labelled line (`- Magic: 52` / `- Defense: 71`), so a column-order error is structurally impossible on his side; the wiki fills a hand-edited infobox whose slot order (`Str\|Mag\|Def`) differs from the game's native order (`Str, Def, Mag, MDef`), which reproduces the observed swap exactly. Wiki pages that happen to be filled correctly (Tail, Nodes, both Redoubts, Shuyin) agree with SinirothX field-for-field, and the Shuyin row is triangulated a third time by jegged.com. Full table in the §3 header. |
| 2 | **Bulwark level.** SinirothX says Lv 39; FF Wiki says Lv 47. | ✅ **RESOLVED — never a real conflict.** SinirothX's entry reads `- Monster's Level: 39` then `- Oversoul Level: 47`; the wiki copied the **Oversoul** figure into its level field. Bulwarks cannot Oversoul here, so **39** is correct. Same Oversoul pairs throughout: Tail 41/49, Leg 38/46, Body 43/52, Head 57/68, Redoubt 40/48. Separately: every Bulwark offensive ability is `fractional`, so its Level, Str and Mag never reach a damage formula anyway. |
| 3 | **Body/Core level.** SinirothX 43, wiki 43 — agree. Node level 52 — agree. Head 57 — agree. Shuyin 58 — agree. | ✅ |
| 4 | **Head battle fail clock.** | ✅ **Mechanic RESOLVED; duration still `[estimate]`.** The fail condition is **Shuyin's seventh line** ("Now, Vegnagun. Fire!"), confirmed independently by SinirothX's quote list and the Japanese *FF用語辞典 Wiki\** endings page. The counter starts at the **Phase B** transition (after the Redoubts are first downed), is driven by the Head + both Redoubts' combined turn count, and the remaining time is **never shown**. Wall-clock length remains unpublished: one board post says "around 25 minutes", which the shipped preset deliberately does not follow. **Ship `FIRE_AT_TURN = 240` combined enemy turns (~6 min of Phase B); presets and reasoning in §4.2.2.** |
| 5 | **Shuyin move naming.** "Run & Slash" vs "Hit and Run"; "Spin Cut" vs "Spinning Cut". | **Recorded.** Recommend the wiki ability-list spellings (**Run & Slash**, **Spin Cut**). |
| 6 | **"Vita Braevis" vs "Vita Brevis."** | Wiki ability list has the typo; use **Vita Brevis**. |
| 7 | **Node HP = 300,000.** Looks like an error but is confirmed by both sources and is intentional (Nodes are not a win condition). | ✅ `[verified: 2 sources]` |
| 8 | **Formula step 15** (`×0.5` for all-target magic) — does it apply to *enemy* all-target magic like Force Rain / Memento Mori / Nemo Ante Mortem Beatus? SinirothX scopes it to "black or white magic," which suggests player spells only. | **Open.** My worked examples in §1.2 **do not** apply it to enemy attacks. If your damage feels ~2× too high in playtest, that's the knob. |
| 9 | **Player-ability damage constants.** SinirothX's guide is enemy-only. Player-side constants (Darkness, Trigger Happy per shot, Attack Reels, Great Whirl, etc.) are not published in any source I could reach; Split Infinity's FFX-2 FAQ section G14006 reportedly has the ability metadata but not constants per se. | **Open — the biggest remaining data gap.** Trigger Happy is documented as "each shot = a normal attack" (const 16 physical), which gives you one anchor. |
| 10 | **Party level at the finale (45–52).** No authoritative source. | `[estimate]` — treat as a design target, tuned against the boss levels 38–58. |
| 11 | **Inventory counts (§6.8).** | `[estimate]` — fully synthesised. |
| 12 | **Shuyin's Yuna-targeting bias** exists only in the original PS2 release. | `[single source]` — verify against the Int/HD AI dump if one surfaces. |
| 13 | **The Head's `Turn Count Pattern` block is untranslated in SinirothX.** He writes the section header, then `[more quote info, translate later]`. The exact turn thresholds for Shuyin's lines 3–6 are therefore not recovered. | **Open.** §4.2's model (evenly-spaced thresholds on a combined enemy-turn counter) is the only structure consistent with the surviving text, but the spacing is `[estimate]`. A Japanese AI dump or a re-read of the original FAQ revision would close it. |
| 14 | **Battlefield geometry (§4.3) is entirely unsourced.** Only two numbers in it are: the **5 m** radius (SinirothX, verbatim) and the **2 s** chain window (`ffx2-combat-core.md` §1.7). Slot positions, run speed, melee gap and fan-out are Pyrefly Reprise design decisions. | **By design, but flag it.** No source publishes FFX-2's battlefield coordinates. The geometry is tuned so the 5 m circle discriminates melee from ranged and so the longest approach lands just inside the 2 s chain window; re-tune against playtest, not against this document. |
| 15 | **`visual-bible.md` §2.0 amendment owed.** Its layout (party x −1.6/−2.3/−3.0, enemies +1.8…+3.4) is the FFX framing and is too tight for the FFX-2 chapters — with it, the Bulwark's 5 m radius stops discriminating. | **Open cross-doc action.** §2.0 needs a note that FFX-2 uses §4.3's wide field, with the base camera pulled back to ~`(+2.6, +3.6, +9.6)` at FOV ~44°. Scale is already compatible (1 unit = 1 m in both). |
| 16 | **Head MP.** SinirothX and the FF Wiki both say **9,999**; GamerGuides prints **99,999**. | **Recorded, low impact.** Use 9,999. The Head never spends MP in its script, so the value is inert. |

---

## 12. Sources

**Decompile-derived / data dumps**
- SinirothX (Nicholas Henson), *Final Fantasy X-2 — Enemy Encyclopedia*, GameFAQs (2007): https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/31807 — stat blocks, damage constants, AI scripts, status immunity lists, and the damage flowchart for every enemy cited above. **Read directly (full primary text) during the 2026-09-15 gap-fill pass**, which is what resolved §11 items 1 and 2 and recovered the exact "5 meter radius" wording and Shuyin's seven-line quote list. Print view: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/31807?print=1
- GameFAQs board thread, *Ability Damage Formulas* (pointers to SinirothX + Split Infinity): https://gamefaqs.gamespot.com/boards/562386-final-fantasy-x-2/76032425

**Final Fantasy Wiki (Fandom)** — all accessed 2026-09-15
- https://finalfantasy.fandom.com/wiki/Vegnagun
- https://finalfantasy.fandom.com/wiki/Vegnagun_(tail)
- https://finalfantasy.fandom.com/wiki/Vegnagun_(leg)
- https://finalfantasy.fandom.com/wiki/Vegnagun_(body)
- https://finalfantasy.fandom.com/wiki/Vegnagun_(head)
- https://finalfantasy.fandom.com/wiki/Node_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/Bulwark_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/Redoubt
- https://finalfantasy.fandom.com/wiki/Shuyin_(boss)
- https://finalfantasy.fandom.com/wiki/Shuyin
- https://finalfantasy.fandom.com/wiki/Lenne
- https://finalfantasy.fandom.com/wiki/Farplane_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_story
- https://finalfantasy.fandom.com/wiki/Multiple_endings
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2:_Original_Soundtrack
- https://finalfantasy.fandom.com/wiki/Garment_Grid
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_accessories
- https://finalfantasy.fandom.com/wiki/Dressphere
- https://finalfantasy.fandom.com/wiki/Dark_Knight_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/Darkness_(Dark_Knight_ability)
- https://finalfantasy.fandom.com/wiki/Trigger_Happy_(Yuna_ability)
- https://finalfantasy.fandom.com/wiki/Mix_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/Alchemist_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_commands
- https://finalfantasy.fandom.com/wiki/Floral_Fallal
- https://finalfantasy.fandom.com/wiki/Machina_Maw
- https://finalfantasy.fandom.com/wiki/Full_Throttle_(Final_Fantasy_X-2)
- Per-level dressphere stat tables (used for §6.2): `Gunner_(Final_Fantasy_X-2)`, `Thief_(Final_Fantasy_X-2)`, `Warrior_(Final_Fantasy_X-2)`, `White_Mage_(Final_Fantasy_X-2)`, `Black_Mage_(Final_Fantasy_X-2)`, `Alchemist_(Final_Fantasy_X-2)`, `Berserker_(Final_Fantasy_X-2)`, `Samurai_(Final_Fantasy_X-2)`, `Songstress`, `Gun_Mage`, `Lady_Luck_(Final_Fantasy_X-2)`, `Mascot`, `Trainer_(Final_Fantasy_X-2)` — all at `https://finalfantasy.fandom.com/wiki/<page>`
- https://finalfantasy.fandom.com/wiki/Walkthrough:Final_Fantasy_X-2/Hamfruitcake_09/Part_27
- Image references inspected for §10: `Special:FilePath/Vegnagun_front.jpg`, `Special:FilePath/VegnaHEAD.jpg`, `Special:FilePath/Farplane_flowerfield.jpg`, `Special:FilePath/Lenne_and_Shuyin_reunite.png`

**Additional stat/ability data (used for cross-verification, added during fact-check pass 2026-09-15)**
- jegged.com, *Final Fantasy X-2 Bestiary — Shuyin*: http://jegged.com/Games/Final-Fantasy-X-2/Bestiary/Shuyin.html — corroborates Shuyin's full stat block; also the source of the Hero Drink steal-chance CONFLICT recorded in §3.5.
- jegged.com, *Final Fantasy X-2 Dresspheres — Dark Knight*: http://jegged.com/Games/Final-Fantasy-X-2/Dresspheres/Dark-Knight.html — corroborates Dark Knight's Lv 50 stat row, Darkness's cost/effect, and the 490 AP mastery total.
- jegged.com, *Final Fantasy X-2 Accessories*: http://jegged.com/Games/Final-Fantasy-X-2/Accessories/ — corroborates Crystal Bangle, Mythril Bangle, Speed Bracer, and Cat Nip effects.

**Japanese-language sources (added during the 2026-09-15 gap-fill pass)**
- *ファイナルファンタジー用語辞典 Wiki\**, ストーリー/【FF10-2のエンディング】: https://wikiwiki.jp/ffdic/%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC/%E3%80%90FF10-2%E3%81%AE%E3%82%A8%E3%83%B3%E3%83%87%E3%82%A3%E3%83%B3%E3%82%B0%E3%80%91 — the source that pins the Head battle's fail clock: the Vegnagun (head) / Redoubt R / Redoubt L battle has a time limit whose remaining time is **not displayed**, and the bad ending triggers on a Game Over there **or** on Shuyin's **seventh** line. Also notes that Jecht's "no overtime" line is literal rather than figurative.
- *ファイナルファンタジー用語辞典 Wiki\**, モンスター/【ヴェグナガン】: https://wikiwiki.jp/ffdic/%E3%83%A2%E3%83%B3%E3%82%B9%E3%82%BF%E3%83%BC/%E3%80%90%E3%83%B4%E3%82%A7%E3%82%B0%E3%83%8A%E3%82%AC%E3%83%B3%E3%80%91 — confirms the belly cannon fires only on a party wipe or on time-out.
- yarikomi.honanie.com, *FFX-2 完全攻略* Chapter 5 page: http://yarikomi.honanie.com/ff10/10-2comp/5_38.html — independent statement that the time limit exists in the **second half** of the Vegnagun 2nd-form (head) battle, corroborating that the clock starts at the Phase B transition. (Reached via search index; the host serves HTTP only.)
- crystal.s18.xrea.com, *Final Fantasy X-2 データベース — ラストボス一覧*: http://crystal.s18.xrea.com/ffx2/lastboss.html — checked as a possible third stat source; carries HP/MP only (Head 38,420 / Shuyin 23,850 / Redoubt 2,500, all matching) and no Magic/Defense data.

**Community reports on the Head battle's duration (both `[single source]`, both recorded rather than relied on)**
- GameFAQs board, *Question about endings (I'm confused)*: https://gamefaqs.gamespot.com/boards/562386-final-fantasy-x-2/43743237 — post #4 (izzy_pr): bad ending = "Have Shuyin speak 7 times (around 25 minutes)". The **seven-line count** is corroborated; the **25 minutes** is not.
- Reddit r/FinalFantasy, *(FFX-2 End Spoilers) Has this happened to anybody else?*: https://www.reddit.com/r/FinalFantasy/comments/25wn5e/ffx2_end_spoilers_has_this_happened_to_anybody/ — bad ending after "about 10 minutes of not touching the controls". Recorded in §4.2.2 as almost certainly a party wipe rather than the clock.
- Giant Bomb wiki, *Vegnagun*: https://www.giantbomb.com/vegnagun/3005-11781/ — confirms the head phase "must be done within a time limit"; no figure.

**Guides and walkthroughs**
- GamerGuides, *Final Fantasy X-2 HD Remaster — The Final Bosses (Chapter 5)*: https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-5/the-final-bosses — also used during the 2026-09-15 fact-check pass to independently cross-confirm several boss HP totals and ability descriptions (Tail, Leg, Node, Body, Bulwark, and Head HP; Tail Beam, Noli Me Tangere, Memento Mori, the Head's five-ability set, Terror of Zanarkand and Run & Slash hit counts, and the Head battle's fail-timer/bad-ending behavior) that this document had previously cited only for strategy.
- GamerGuides, *Road to the Farplane (Chapter 5)*: https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-5/road-to-the-farplane
- GamerGuides, *Farplane Abyss, Part Two (Hard Version)*: https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-5/farplane-abyss-part-two-hard-version
- StarNeptune, *Final Fantasy X-2 Dressphere Ability FAQ v1.4*, GameFAQs: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/28063
- Aerius, *Final Fantasy X-2 Ending Guide*, GameFAQs: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/27218
- Dr Slice, *FFX-2 Walkthrough — Chapter 5: Farplane*: https://www.drslice.com/games/ffx2/walkthrough/74
- FF Exodus, *FFX-2 Walkthrough — Chapter 5, Farplane*: http://www.ffexodus.com/ffx2/walkthrough49.php
- StrategyWiki, *Final Fantasy X-2/Farplane*: https://strategywiki.org/wiki/Final_Fantasy_X-2/Farplane
- StrategyWiki, *Final Fantasy X-2/Completion Guide*: https://strategywiki.org/wiki/Final_Fantasy_X-2/Completion_Guide
- Prima Games, *How to Achieve 100% Completion in FFX-2 HD Remaster*: https://primagames.com/walkthrough/how-achieve-100-completion-final-fantasy-x-2-hd-remaster

**Scene beats (used only to order and paraphrase beats; no text reproduced)**
- `ffx2_script` LiveJournal archive, *Chapter 5 — Vegnagun*: https://ffx2-script.livejournal.com/22299.html
- Wikiquote, *Final Fantasy X-2*: https://en.wikiquote.org/wiki/Final_Fantasy_X-2

**Ultimania material (accessed via wiki citations, not directly)**
- Ryu_Kaze/Ryu Sinclair, *Final Fantasy X-2 Ultimania Translations FAQ*, GameFAQs: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/42601 — cited by the wiki for Shuyin's "shadow" nature, Lenne's pursuit of Shuyin, Dream Zanarkand's relationship to Shuyin's appearance, and Shinra's post-game modification of Vegnagun.

**Music**
- RPGFan, *Final Fantasy X-2 Original Soundtrack* review: https://www.rpgfan.com/music-review/final-fantasy-x-2-original-soundtrack-2003/
- VGMO, *Final Fantasy X-2 HD Remaster Original Soundtrack* review: https://vgmonline.net/finalfantasy10-2remaster/

---

## 13. Verification log (fact-check pass, 2026-09-15)

Each claim below was independently checked against jegged.com and/or GamerGuides. "Confirmed" claims already carrying a `[verified: 2 sources]`-equivalent tag in the body text above had that tag reaffirmed or added; the one "contradicted" claim was corrected in place with a CONFLICT note; "unverifiable" claims are unchanged in the body (no independent second source could be reached this session) but are logged here so the gap is visible.

| # | Claim (doc location) | Verdict | Disposition |
|---|---|---|---|
| 1 | Shuyin's full stat block (§3.5) | Confirmed | Tag reaffirmed; jegged.com Bestiary + GamerGuides both corroborate. |
| 2 | Vegnagun (Tail) HP = 34,200 (§3.1) | Confirmed | GamerGuides cross-confirmation note added. |
| 3 | Vegnagun (Leg) HP = 18,220 (§3.2) | Confirmed | GamerGuides cross-confirmation note added. |
| 4 | Node A/B/C HP = 300,000 each (§3.2) | Confirmed | GamerGuides cross-confirmation note added; intentional/unkillable design confirmed. |
| 5 | Vegnagun (Body/Core) HP = 33,040 (§3.3) | Confirmed | GamerGuides cross-confirmation note added. |
| 6 | Right/Left Bulwark HP = 3,000 each (§3.3) | Confirmed | GamerGuides cross-confirmation note added (previously untagged). |
| 7 | Vegnagun (Head) HP = 38,420 (§3.4) | Confirmed | GamerGuides cross-confirmation note added. |
| 8 | Tail Beam = 5/16 (31.25%) max HP, ignores Def/MDef (§3.1, §1.2) | Confirmed | GamerGuides cross-confirmation note added to the ability table. |
| 9 | Noli Me Tangere = flat 1,250 to whole party (§3.1, §1.2) | Confirmed | GamerGuides cross-confirmation note added to the ability table. |
| 10 | Memento Mori fires after three unimpeded Charge Core turns, hits whole party (§3.3, §4.1) | Confirmed | GamerGuides cross-confirmation note added. |
| 11 | Head's five-ability set (Pallida Mors, Mors Certa, Odi Et Amo, Nemo Ante Mortem Beatus, Acta Est Fabula) (§3.4) | Confirmed | GamerGuides independently lists all five with matching descriptions; note added. |
| 12 | Terror of Zanarkand = 9 hits ignoring Defense; Run & Slash = 6 random-target hits (§3.5) | Confirmed | GamerGuides cross-confirmation note added (per-hit damage constants remain SinirothX-only). |
| 13 | Dark Knight's Darkness: 12.5% of user's max HP cost, special damage to all enemies, ignores Defense (§6.4) | Confirmed | jegged.com cross-confirmation added; discrepancy flagged — jegged also says Darkness ignores MDef, which this doc does not claim. Recorded as a minor unresolved wording note, not a contradiction. |
| 14 | Dark Knight mastery costs 490 AP total (§6.4) | Confirmed | jegged.com's own per-ability AP list sums to exactly 490; note added. |
| 15 | Dark Knight Lv 50 stat row, including Agi 41 as "the worst in the game" (§6.2, §7.4) | Confirmed | Exact match against jegged.com; note added. |
| 16 | Crystal Bangle: Max HP +100% (§6.7) | Confirmed | jegged.com cross-confirmation added. |
| 17 | Mythril Bangle: Max HP +60%, Leg's 100% drop (§6.7) | Confirmed | jegged.com confirms the +60% effect; the "dropped by the Leg" sourcing is not covered by that page. |
| 18 | Speed Bracer: constant Haste + Hastega (§6.7) | Confirmed | jegged.com cross-confirmation added. |
| 19 | Cat Nip: 9,999 at critical; Int/HD adds constant Berserk + Slow (§6.7, §7.3) | Confirmed | jegged.com cross-confirmation added, matching the version-split claim exactly. |
| 20 | Shuyin's Hero Drink steal chance = 12.5% (§3.5, §7.2) | **Contradicted** | jegged.com gives 11% (common) / 1.6% (rare) instead. Corrected in place: CONFLICT note added recording both values; SinirothX's 12.5% recommended as the higher-confidence figure per this doc's own source-ranking policy, pending a decompile-grade tiebreaker. |
| 21 | The Head battle has a real hidden fail timer; expiry/wipe produces the "bad ending" Game Over (§3.4, §4.2, §8) | Confirmed | GamerGuides cross-confirmation note added ("waiting too long simply gives you a Game Over and a clip of the bad ending"). |
| 22 | Redoubt stat block (HP 2,500 / MP 99,999, Def/MDef 133/0 and 0/133) (§3.4) | **Confirmed (upgraded 2026-09-15)** | The FF Wiki *Redoubt* page was reached on the gap-fill pass and matches SinirothX field-for-field: Lv 40, HP 2,500, MP 99,999, Str 65, Mag 41, and the 133/0 ↔ 0/133 mirror. Tag upgraded to `[verified: 2 sources]` in the body. |
| 23 | Shuyin targets Yuna preferentially in original PS2, any party member in Int/LM/HD (§5.5) | **Unverifiable** | No independent corroboration or contradiction reachable this session. Already flagged single-source/unresolved in §11 item 12; unchanged. |
| 24 | Zantetsu has 255 resistance against every boss in the chain (§5.4, §6.4, §7.3) | **Unverifiable** | Not stated on any page reachable this session. Plausible per known FFX-2 conventions but unconfirmed; body text unchanged. |
| 25 | Yuna/Rikku/Paine total EXP to Lv 99 (1,350,322 / 1,249,480 / 1,169,767) (§6.1) | **Unverifiable** | jegged.com's Characters page has no EXP-curve data; no other reachable source carried it this session. Body text unchanged; still single-sourced. |

### 13.1 Gap-fill pass addendum (2026-09-15, second pass)

Four gaps were raised against this document. All four were worked; three are now closed on data and one is closed on a reasoned, bounded estimate.

| # | Gap | Severity | Outcome |
|---|---|---|---|
| A | §1.1 step 13 reproduced SinirothX's `× (1.4 + chainNumber × 0.5)` verbatim with no correction note, contradicting `ffx2-combat-core.md` §1.7 | blocker | **Fixed.** Step 13 now reads `× (1.40 + 0.05 × chainNumber)`; a boxed correction note with a side-by-side error table and a reference implementation sits directly under the flowchart. `[verified: 2 sources]` |
| B | Head battle fail timer duration entirely unconstrained | blocker | **Mechanic recovered, duration bounded.** The clock is Shuyin's **seven-line** speech counter, starting at the Phase B transition, hidden from the player — `[verified: 2 sources]` (SinirothX quote list + Japanese *FF用語辞典 Wiki\**). Wall-clock length is still unpublished anywhere; §4.2.2 ships `FIRE_AT_TURN = 240` combined enemy turns with the arithmetic shown and two alternative presets. `[estimate]` on the duration only. |
| C | Magic/Defense transposition and Bulwark level resolved only by inference | major | **Both resolved on data.** SinirothX's primary text was read directly; it labels every stat per line, which makes the transposition structurally impossible on his side and locates the error in the wiki's hand-filled infobox. The Bulwark "level conflict" turned out to be the wiki printing the **Oversoul** level. §11 items 1 and 2 closed. `[verified: 2 sources]` |
| D | No battlefield coordinate system for the 5 m radius or for chain approach time | major | **New §4.3 written.** Establishes 1 world unit = 1 m (already implied by `visual-bible.md` §2.0 and §6.1, so the SinirothX "5 meter" figure needs no conversion), a wide-field slot layout with every relevant distance tabulated, an `approachTime` model tuned against the 2 s chain window, and the "characters stay where they last acted" rule that makes both mechanics live. Geometry is `[design decision]`; the two constraints it satisfies are sourced. A cross-doc amendment to `visual-bible.md` §2.0 is logged as §11 item 15. |

**Newly reached sources on this pass:** SinirothX's guide primary text (previously cited but not read end-to-end), the FF Wiki infoboxes for Tail / Leg / Body / Head / Node / Bulwark / Redoubt / Shuyin (read directly rather than via transcription), the Japanese *FF用語辞典 Wiki\** endings page, yarikomi.honanie.com, crystal.s18.xrea.com, the GameFAQs endings board thread, and a Reddit anecdote. jegged.com was re-checked and confirmed **not** to catalogue any Vegnagun sub-part, so it cannot serve as a third stat source for the Vegnagun chain — only for Shuyin, where it does, and where it confirms the SinirothX/wiki agreement.

**Still open after this pass:** the exact turn thresholds inside SinirothX's untranslated `Turn Count Pattern` block (§11 item 13); the wall-clock length of the fail clock (§11 item 4, `[estimate]`); player-side ability damage constants (§11 item 9, unchanged and still the largest data gap in the chapter).
