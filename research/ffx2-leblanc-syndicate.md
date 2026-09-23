# FINAL FANTASY X-2 — The Leblanc Syndicate (Leblanc, Logos, Ormi) — Implementation Reference

**Target:** Pyrefly Reprise encounter module (new FFX-2 chapter)
**Source game:** *Final Fantasy X-2* (PS2 NTSC / International + Last Mission / HD Remaster)
**Scope:** the Leblanc Syndicate as a *story* boss trio. The Creature Creator / Fiend Arena versions of all three are different entities and are disambiguated in §12 — **do not mix those stat blocks.**

**Hard rule this document obeys (AGENTS.md §6):** every number below carries a provenance tag. Nothing is invented. Where the record is silent, the gap is named in §13 rather than filled.

---

## 0. Executive answers to the brief (read first)

| # | Question the brief asked | Answer | Confidence |
|---|---|---|---|
| A1 | Which canonical encounter has **all three together**? | Exactly **two**: the **Floating Ruins** (Mt. Gagazet, Chapter 1) and the **Chateau Leblanc "Last Room"** (Guadosalam, Chapter 2). Every other Syndicate fight is a subset. | [verified: 2 sources] |
| A2 | Which one should Pyrefly Reprise build? | **Chateau Leblanc, Chapter 2** — and build it as the **canonical three-act mission**, not a single battle. See §1. | [recommendation, reasoned] |
| A3 | Is the brief's "low level with starter dresspheres" premise true of that fight? | **Half true, and the half that fails is recoverable.** The canonical party *is* the three starter dresspheres (Gunner / Thief / Warrior), but the level band is **~18–24**, not single digits. The only literally-low-level all-three fight is Floating Ruins (enemies Lv 3–5), and it has **no signature gag moves at all**. See §1.4 for the decision and why it went this way. | [verified: 2 sources] for the data; [recommendation] for the call |
| A4 | Does each of the trio carry a signature gag move? | **Only in the Chateau fight.** Ormi → **Huggles** + **Supercollider**; Logos → **Russian Roulette** + **Hail of Bullets**; Leblanc → **Mach Fan** + **Love Tap** + **Not-So-Mighty Guard**; and all three together → **No Love Lost**. At the Floating Ruins, Ormi and Logos have *no* special abilities whatsoever. | [verified: 2 sources] |
| A5 | Oversoul? | **Not applicable.** Oversoul triggers on kill-counts of a repeatable fiend *type*; unique story bosses have no Oversoul entry. None of the six Syndicate stat records carries an Oversoul flag. | [verified: 2 sources — by the same method established in `ffx2-bahamut.md` §0] |
| A6 | Is the fight long enough to be a chapter? | **Not as one battle.** Total Act III enemy HP is **3,713** — roughly 30–60 s of Lv-21 party output. The chapter's length comes from the canonical **three escalating fights** in the same mission (§2), which is also what makes it a good tutorial. | [derived] |
| A7 | Does the party pose on victory? | **Yes, normally.** Nothing suppresses the victory pose here. This is the tonal opposite of the Bahamut chapter, where it is suppressed. | [single source — by absence; contrast `ffx2-bahamut.md` §1.7] |

---

## 1. Candidate selection — which canonical encounter fits, and why

### 1.1 The complete roster of Syndicate boss fights

Every fight in the game that involves any of the three. Bestiary numbers are the in-game Shinra's Bestiary entries.

| # | Fight | Chapter | Location | Roster (bestiary #, Lv, HP) | All three? | Signature moves present |
|---|---|---|---|---|---|---|
| 1 | Luca Stadium (opening FMV) | 1 | Luca | "????" (disguised Leblanc) + 2 × Goon | ✗ | none |
| 2 | Luca, Dock 5 — tutorial battle | 1 | Luca | Logos **#223** Lv 2 / 86 HP · Ormi **#216** Lv 18 / 97 HP | ✗ (no Leblanc) | Pirouette Pitch; Logos heals with Potion |
| 3 | Luca — Leblanc solo | 1 | Luca | Leblanc **#229** Lv 5 / 130 HP | ✗ | Thunder only |
| 4 | **Floating Ruins** | **1** | Mt. Gagazet | Ormi **#217** Lv 3 / 130 · Logos **#224** Lv 3 / 100 · Leblanc **#230** Lv 5 / 120 | **✓** | Sonic Fan, Love Tap (Leblanc only) |
| 5 | Djose Highroad | 2 | Djose Highroad | Logos **#225** Lv 17 / 1,030 · Ormi **#219** Lv 16 / 1,150 · Fem-Goon | ✗ | Hail of Bullets, Flash/Hush Grenade, Concussive Shock, Pirouette Pitch |
| 6 | Mt. Gagazet (hot springs) | 2 | Mt. Gagazet | Ormi **#218** Lv 18 / 1,350 | ✗ | Concussive Shock |
| 7 | Bikanel Oasis | 2 | Bikanel | Logos **#226** Lv 18 / 1,220 | ✗ | Hail of Bullets, Flash/Hush Grenade |
| 8 | Chateau — Entrance | 2 | Chateau Leblanc | Ormi **#220** Lv 19 / 1,640 + Dr. Goon + Fem-Goon | ✗ | **Huggles**, **Supercollider** |
| 9 | Chateau — Logos' Room | 2 | Chateau Leblanc | Logos **#227** Lv 20 / 1,432 · Ormi **#221** Lv 19 / 1,840 | ✗ | **Russian Roulette**, Supercollider |
| 10 | **Chateau — Last Room ("Chateau End")** | **2** | Chateau Leblanc | Ormi **#222** Lv 19 / 1,344 · Logos **#228** Lv 21 / 989 · Leblanc **#231** Lv 23 / 1,380 | **✓** | **all of them, plus No Love Lost** |

[verified: 2 sources — Final Fantasy Wiki enemy templates + zero_six's *FFX-2 Enemy Database* (GameFAQs), which independently reproduces every HP, EXP, gil and drop value above]

There is **no Chapter 3, 4 or 5 Leblanc fight.** From Chapter 3 onward she is an ally; in Chapter 5 she, Logos and Ormi fight *alongside* the Gullwings at the Farplane. [verified: 2 sources]

### 1.2 The two genuine candidates, side by side

| | **Candidate A — Floating Ruins (Ch. 1)** | **Candidate B — Chateau Last Room (Ch. 2)** |
|---|---|---|
| Enemy levels | 3 / 3 / 5 | 19 / 21 / 23 |
| Total enemy HP | **350** | **3,713** |
| Typical party level | **Lv 3–8** | **Lv 18–24** |
| Dresspheres owned | Gunner, Thief, Warrior, Songstress *(Black Mage is the reward for this very mission)* | all nine standard except Dark Knight, Samurai, Lady Luck, Berserker, Trainer; plus up to three specials |
| Ormi's kit | **Normal Attack only** | Shield Bash, **Supercollider**, **Huggles**, **Concussive Blast** |
| Logos' kit | **Double Shot only** (no listed special) | Double Shot, **Russian Roulette**, **Hail of Bullets** |
| Leblanc's kit | Fan Slap, **Sonic Fan**, **Love Tap** | Fan Slap, **Mach Fan**, **Love Tap**, **Not-So-Mighty Guard**, Fira/Blizzara/Thundara/Watera, **Flash Bomb**, **Hush Grenade**, **White Wind**, Osmose |
| Three-person combo | **none exists** | **No Love Lost** |
| Art cost | Mt. Gagazet summit exterior — partly reusable from the existing Seymour Flux chapter's Gagazet palette | Chateau interior — entirely new |
| Battle theme | "Let Me Blow You a Kiss!" | "Let Me Blow You a Kiss!" |
| Fights in the mission | 1 (plus Boris, a spider fiend, at the summit) | **3 escalating Syndicate fights** |

### 1.3 What each candidate does to the owner's five stated goals

The owner's brief asked for: (1) a three-on-three mirror match, (2) banter, (3) **each of the trio carrying a signature gag move**, (4) **low level with starter dresspheres, doubling as the tutorial chapter**, (5) lowest art cost of the three new chapters.

| Goal | Floating Ruins | Chateau Last Room |
|---|---|---|
| 1. 3-on-3 mirror match | ✓ | ✓ |
| 2. Banter | ✓ | ✓ (the comic peak of the game — the uniform disguise, the massage, Brother blowing the cover) |
| 3. Signature gag move each | **✗ — two of the three have nothing** | ✓ |
| 4. Low level / starter dresspheres / tutorial | ✓ | **partial** — starter dresspheres yes, low level no |
| 5. Lowest art cost | ✓ (slight edge) | ✓ |

### 1.4 Recommendation, and the reasoning that decides the tie

**Build Candidate B: Chateau Leblanc, Chapter 2 — the full three-act mission.**

Both candidates fail exactly one stated goal, so the tie-break is **which failure can be repaired without inventing game data**, which AGENTS.md rule 6 forbids.

- If we pick the **Chateau**, the "onboarding / tutorial" goal is repaired by **presentation**: tutorial framing, trigger tips, a gentler difficulty preset, and the fact that the canonical party for this fight genuinely is the three starter dresspheres. Onboarding is a UI-and-pacing property, not an enemy-data property. **Fully recoverable.**
- If we pick the **Floating Ruins**, the "signature gag move each" goal can only be repaired by moving Huggles, Supercollider and Russian Roulette backwards into a Chapter 1 fight where the game does not have them. That is inventing game data. **Not recoverable.**

Four further facts reinforce the call:

1. **The Chateau mission is already a three-act structure in canon** — Ormi with goons at the entrance, then Logos + Ormi in Logos' room, then all three in the last room. That is the same shape the owner asked for in the Seymour/Anima chapter, and it solves the "a 3,713-HP fight is not a chapter" problem without adding a single invented beat.
2. **It is a near-perfect teaching sequence by accident of its own stat design** (§8): Act I teaches Defense vs Magic Defense (Ormi is a wall to physicals and paper to magic), Act II teaches Evasion and status defence (Logos dodges and inflicts), Act III teaches target priority, enemy buffs and the Chain system (the enemy chains *you*).
3. **The level band is already paid for.** Lv 18–24 is the same band as the existing Bahamut chapter, so `ffx2-combat-core.md` §5.1b and `ffx2-bahamut.md` §4.2 already carry every dressphere stat table this chapter needs. The Floating Ruins band (Lv 3–8) is documented nowhere in the project.
4. **The three Strip Search missions that immediately precede it** — beating Logos + Ormi at Djose, Logos at Bikanel, Ormi at Gagazet — award the **Bum Rush**, **Hour of Need** and **Stonehewn** Garment Grids. The player walks into this fight holding three grids they won from these same three people. [verified: 2 sources]

**Recorded dissent, so the orchestrator can overrule cleanly.** If Bailey's onboarding criterion is *literal* (single-digit levels, three dresspheres, no prior systems knowledge), Candidate A is the only canon-legal answer and §11 gives its complete data. The cost of that choice is precise and should be stated to him: **Ormi and Logos become plain attackers with no named abilities, the fight's total HP is 350, and every gag move in the brief disappears.**

---

## 2. The chapter as canon lays it out — three acts

All three fights happen inside the Chapter 2 mission **"Faking and Entering"**, which unlocks after the party has stolen three women's Syndicate uniforms in **"Strip Search"**. [verified: 2 sources]

| Act | Fight | Enemies | Total HP | What it teaches |
|---|---|---|---|---|
| **I** | Chateau Entrance | **Ormi #220** (Lv 19, 1,640 HP, Def 120, **MDef 4**) + **Dr. Goon** (232 HP) + **Fem-Goon** (167 HP) | 2,039 | Physicals bounce off Def 120; magic erases him. Fem-Goon casts the four Lv.1 and Lv.2 elements. |
| **II** | Logos' Room | **Logos #227** (Lv 20, 1,432 HP, **Def 4**, **Eva 38**) + **Ormi #221** (Lv 19, 1,840 HP, Def 121, **MDef 8**) | 3,272 | Two opposite defensive shapes on screen at once; Russian Roulette introduces Death / Petrify / Eject. |
| **III** | Last Room | **Leblanc #231** + **Logos #228** + **Ormi #222** | **3,713** | Target priority, enemy buff-stripping, the trio combo, the Chain system. |

Between Acts I and II the party crosses a security-override puzzle with a spike wall; between the massage scene and Act I they trip the hidden switch behind the dining-room doorway. [verified: 2 sources]

**Mission reward:** the **Reassembled Sphere** (key item — Leblanc's guaranteed drop) and the **Healing Light** Garment Grid. [verified: 2 sources]

---

## 3. Stat blocks — Act III, the three-on-three

### 3.1 Leblanc — bestiary #231 (Chateau Leblanc, Chapter 2)

| Field | Value | Confidence |
|---|---|---|
| Level | **23** | [verified: 2 sources] |
| HP | **1,380** | [verified: 2 sources] |
| MP | **460** | [verified: 2 sources] |
| Strength | **33** | [single source] |
| Magic | **32** | [single source] |
| Defense | **10** | [single source] |
| Magic Defense | **62** | [single source] |
| Agility | **53** | [single source] |
| Evasion | **22** | [single source] |
| Luck | **16** | [single source] |
| Accuracy | **`accuracy` field left blank in the template instance** (it is populated for comparable enemies — Dr. Goon 3, Battlesnake 98). Not inferable; see §5.1 and G1. | [gap] |
| EXP | **380** | [verified: 2 sources] |
| AP | **2** | [single source] |
| Gil (battle reward) | **300** | [verified: 2 sources] |
| Gil (stealable) | **1,500** | [single source] |
| Scan description (paraphrased) | Furious that a sphere she recovered for Nooj has been tampered with; she hits multiple targets and can perform combination attacks with Logos and Ormi. | [single source — paraphrase, not a transcript] |

**Elemental affinities:** Gravity **Immune**; every other element **neutral ×1.0** (the wiki template emits a row only when the affinity is non-neutral, and the only row emitted is gravity; zero_six's independent entry likewise lists only "Immune to Gravity"). [verified: 2 sources by the omission-comparison method established in `ffx2-bahamut.md` §1.3]

**Status immunities:** Death, Petrification, Sleep, Silence, Confusion, Berserk, Curse, Eject, Stop, Doom, **STR Down**, **DEF Down**, **LUCK Down**, Gravity/fractional, Multi-Attack, Bribe. `zantetsu = 60`. `poison = 100` (see the resistance-scale note below → functionally Poison-immune). [verified: 2 sources]

**NOT immune — these land on her:**

| Vector | Why it matters |
|---|---|
| **Darkness** | Quarters her Accuracy in the §5.1 hit check. Her physical is minor anyway, but Darkness Dance is the canonical opener and it covers all three at once. |
| **Slow** | Halves her ATB rate and doubles her CTIM. Directly delays the No Love Lost counter, which is turn-counted, not time-counted. |
| **Magic Break (MAG Down)** | ×(12−n)/12 on her four elemental spells and on Mach Fan. |
| **Mental Break (MDEF Down)** | ×(12+n)/12 on all party magic into her. Her MDef 62 is the highest of the three. |
| **Delay** | Pushes her turn counter back without changing the script. |

> **Power Break and Armor Break do nothing to Leblanc** (STR Down and DEF Down are both flagged immune), but **both work on Logos and Ormi**. This asymmetry is worth surfacing in the Sensor/Libra panel — it is the only place in the fight where the same Warrior skill is correct on two targets and dead on the third.

**Drops / steal / bribe:**

| Slot | Item | Notes | Confidence |
|---|---|---|---|
| Common drop | **Reassembled Sphere** (key item) | Both slots — the story drop is deterministic | [verified: 2 sources] |
| Rare drop | **Reassembled Sphere** (key item) | — | [verified: 2 sources] |
| Common steal | **Elixir** ×1 | — | [verified: 2 sources] |
| Rare steal | **Elixir** ×1 | Both slots hold the same item; the split is cosmetic | [verified: 2 sources] |
| Steal rate | **192 / 255 ≈ 75.3 %** | Common slot 65.9 %, rare slot 9.4 % (87.5 / 12.5 split of a successful roll — the scale is derived in `ffx2-bahamut.md` §1.6) | [verified: 2 sources for the byte; the split is [derived]] |
| Bribe | **Immune** | Explicitly flagged | [verified: 2 sources] |

### 3.2 Logos — bestiary #228 (Chateau Leblanc, Last Room, Chapter 2)

| Field | Value | Confidence |
|---|---|---|
| Level | **21** | [verified: 2 sources] |
| HP | **989** — the lowest of the three | [verified: 2 sources] |
| MP | **70** | [verified: 2 sources] |
| Strength | **17** | [single source] |
| Magic | **28** | [single source] |
| Defense | **4** — the lowest in the fight | [single source] |
| Magic Defense | **18** | [single source] |
| Agility | **49** | [single source] |
| Evasion | **40** — the highest in the fight | [single source] |
| Luck | **10** | [single source] |
| EXP | **260** | [verified: 2 sources] |
| AP | **2** | [single source] |
| Gil (battle reward) | **240** | [verified: 2 sources] |
| Gil (stealable) | **640** | [single source] |
| Scan description (paraphrased) | Nervous about fouling up in front of Leblanc; his defence and HP are low, but he is good at evading. | [verified: 2 sources — paraphrase] |

**Elemental affinities:** Gravity **Immune**; all others neutral. [verified: 2 sources]

**Status immunities:** Death, Petrification, Sleep, Confusion, Silence, Berserk, Curse, Eject, Stop, Doom, Gravity/fractional, Multi-Attack, Bribe. `zantetsu = 50`. `poison = 40`. [verified: 2 sources]

**NOT immune:** **Darkness**, **Poison** (60 % landing chance), **Slow**, **Delay**, and **all four Breaks** — his Lv 17 Djose entry carried STR Down immunity, this one does not. [verified: 2 sources by entry comparison]

> **Resistance-number scale — resolved.** The per-status numbers in the wiki template are **percent resistance**, not percent chance to land. The proof is internal: Logos' Djose entry carries `sleep = 30`, and the wiki's own strategy text for that fight says Sleepy Shuffle is worth using because *he only has a 30 % chance to resist it*. Implement `landChance = 100 − resistNumber` for the linear "Status 1" formula path, subject to the §2.6a level terms. [verified: 2 sources — template value plus the prose that reads it]

**Drops / steal:**

| Slot | Item | Effect | Confidence |
|---|---|---|---|
| Common + rare drop | **Charm Bangle** ×1 | Eliminates random encounters in most areas; **Luck +10** | [verified: 2 sources] |
| Common steal | **Mega-Potion** ×1 | — | [verified: 2 sources] |
| Rare steal | **Elixir** ×1 | — | [verified: 2 sources] |
| Steal rate | **192 / 255 ≈ 75.3 %** | — | [single source] |
| Drop rate | **192 / 255 ≈ 75.3 %** | — | [single source] |
| Bribe | **Immune** | — | [verified: 2 sources] |

### 3.3 Ormi — bestiary #222 (Chateau Leblanc, Last Room, Chapter 2)

| Field | Value | Confidence |
|---|---|---|
| Level | **19** | [verified: 2 sources] |
| HP | **1,344** — the largest pool in the fight | [verified: 2 sources] |
| MP | **45** | [verified: 2 sources] |
| Strength | **53** | [single source] |
| Magic | **26** | [single source] |
| Defense | **84** | [single source] |
| Magic Defense | **16** | [single source] |
| Agility | **42** — the slowest unit on the field | [single source] |
| Evasion | **absent from the record → implement as 0** | [single source for the absence] |
| Luck | **4** | [single source] |
| EXP | **260** | [verified: 2 sources] |
| AP | **2** | [single source] |
| Gil (battle reward) | **240** | [verified: 2 sources] |
| Gil (stealable) | **600** | [single source] |
| Scan description (paraphrased) | Beaten twice already and now hiding behind Leblanc; high defence and HP, so grinding him down takes time. | [verified: 2 sources — paraphrase] |

**Elemental affinities:** Gravity **Immune**; all others neutral. [verified: 2 sources]

**Status immunities:** Death, Petrification, Sleep, Confusion, Silence, Berserk, Curse, Eject, Stop, Doom, Gravity/fractional, Multi-Attack, Bribe. `zantetsu = 50`. `poison = 30`. [verified: 2 sources]

**NOT immune:** **Darkness**, **Poison** (70 % landing chance), **Slow**, **Delay**, and **all four Breaks**.

**Drops / steal:**

| Slot | Item | Effect | Confidence |
|---|---|---|---|
| Common + rare drop | **Twist Headband** ×1 | Guards against Sleep; Def +4, MDef +4 | [verified: 2 sources] |
| Common steal | **X-Potion** ×1 | — | [verified: 2 sources] |
| Rare steal | **Elixir** ×1 | — | [verified: 2 sources] |
| Bribe | **Immune** | — | [verified: 2 sources] |

### 3.4 The stat-shape reading — state this in code comments

> **Three enemies, three different correct answers. This is the whole encounter.**

| | Defense | Magic Defense | Evasion | The lesson |
|---|---|---|---|---|
| **Ormi** | **84** (and 120–121 in Acts I–II) | **16** | 0 | A wall to physicals, paper to magic. |
| **Logos** | **4** | 18 | **40** | Nothing defends him — but you have to *hit* him. Long-range, high-Accuracy dresspheres only. |
| **Leblanc** | 10 | **62** | 22 | Hit her with a sword, not a spell. And she re-buffs herself. |

This is not a reading imposed on the data; it is what the data says, and it is why the fight is a legitimate tutorial for FFX-2's damage routing. No other early boss group in the game puts all three defensive shapes on screen simultaneously.

---

## 4. Ability data — every move, with numbers

### 4.1 How the published damage bands decode

Several sources publish damage as a band like "187~211". Those bands are the **step-7 randomiser** (`× rand(240..271)/256`, i.e. ×0.9375 … ×1.0586) applied to a flat base. Solving backwards recovers the base exactly:

| Published band | Recovered base | Check |
|---|---|---|
| 22~25 | **24** | 24 × 240/256 = 22.5 → 22; 24 × 271/256 = 25.4 → 25 ✅ |
| 46~52 | **50** | 50 × 240/256 = 46.9 → 46; 50 × 271/256 = 52.9 → 52 ✅ |
| 99~112 | **106** | 106 × 240/256 = 99.4 → 99; 106 × 271/256 = 112.2 → 112 ✅ |
| 187~211 | **200** | 200 × 240/256 = 187.5 → 187; 200 × 271/256 = 211.7 → 211 ✅ |
| 281~317 | **300** | 300 × 240/256 = 281.25 → 281; 300 × 271/256 = 317.6 → 317 ✅ |

Because these bands survive the randomiser without a Defense term, **these abilities are "Constant"-type base numbers (flowchart step 1, constant branch) and ignore Defense and Magic Defense entirely.** That is the single most important implementation fact in this section: Ormi's and Leblanc's big moves are flat, so a Warrior's Def 97 does not help against them. [derived from `ffx2-combat-core.md` §2.1 step 7 + the published bands — [verified: 2 sources] for the formula, [derived] for the inversion]

> **★ Cross-check on the Chain formula — one exact case, one near miss. Corrected 2026-09-19.**
>
> **The exact one: Huggles.** The enemy-ability list gives **Huggles** as "3 hits, each 281~317 base". Ormi's own page gives the *total* as "1,110~1,254". Those look contradictory until you apply Chain (§1.7 of the combat core): three hits on one target inside the 2 s window take multipliers **×1, ×1.45, ×1.50**, summing to ×3.95.
> `300 × 3.95 = 1,185` → `floor(1185 × 240/256) = 1110`, `floor(1185 × 271/256) = 1254` → band **1,110 … 1,254**. **Exact.** This is the one reconstruction in this document that lands on the published figure digit-for-digit.
>
> **The near miss: No Love Lost part 1.** Eight hits of base 24 with multipliers ×1, ×1.45 … ×1.75 sum to ×12.20 → `24 × 12.20 = 292.8`. Randomising the *total* gives **274 … 309**, not the published 267~304. Randomising **per hit first** (the reading the wiki's own wording supports — it prints "each hit dealing 22~25 HP of base damage for a maximum total of 267~304") gives `Σ floor(22 × mult) = 266` and `Σ floor(25 × mult) = 302`, against a published **267** and **304**. Off by one and by two. Close enough to be consistent with a +0.05 increment; **not** a reconstruction "to the digit," and this document previously claimed it was.
>
> **And the published band is not internally self-consistent as a single-base randomiser band.** No value `T` can produce it: `floor(T × 240/256) = 267` requires `T ∈ [284.80, 285.87)`, while `floor(T × 271/256) = 304` requires `T ∈ [287.17, 288.12)`. Those intervals are disjoint. So 267~304 is an editorially assembled figure, not a band emitted by one base through step 7, and no arithmetic can be expected to hit both ends.
>
> **What this actually supports.** One exact reconstruction (Huggles) is consistent with `chainMult = 1.40 + 0.05 × chainNumber` and inconsistent with `× 0.5` (which would give ×1.9 on the first link and a Huggles total near 1,700). That is real evidence, but it is *one* case, and `ffx2-combat-core.md` §1.7 already carries the formula at `[verified: 2 sources]` on its own sources — nothing here is load-bearing. [derived, one exact case — was previously mis-tagged [verified: 2 sources]]

### 4.2 Ormi's abilities

| Ability | Type | Target | Base / effect | Notes | Confidence |
|---|---|---|---|---|---|
| **Shield Bash** (normal attack) | Physical | 1 random | base **123.80** (step 1: `(19+53)×19×53/1024 + 53`) | Goes through the Defense term; Protect halves it; Sentinel reduces it to 1 | [derived from published Lv/Str; formula verified: 2 sources] |
| **Supercollider** | Fractional + Delay | character **furthest away** | **50 % of current HP**, plus a **Delay** effect | Cannot kill from full. The targeting rule is positional — it is why the free-movement battlefield matters. | [verified: 2 sources] |
| **Huggles** | Multi-hit, 3 hits | 1 random | base **300 per hit**, self-chains to **1,110~1,254 total**; **each hit carries Delay** | **Only fires when Ormi is the last enemy standing** (1/4 chance on that branch). See §5.3 — this inverts the usual kill order. | [verified: 2 sources] |
| **Concussive Blast** | Constant, party-wide | all 3 | base **300** → **281~317** to everyone | Fires on the `HP < 25 %` branch. Expect a party-wide burst as Ormi dies. | [verified: 2 sources] |
| *(Concussive Shock)* | Constant, party-wide | all 3 | base **200** → **187~211** | His Djose / Gagazet version. Listed here only because the wiki's #222 infobox names it; the AI script and the ability list both say the Last Room uses **Blast**, not Shock. **Implement Blast.** | [conflict — see §13] |

> **Huggles' damage reducibility — what is sourced, and what is ours. Corrected 2026-09-19.**
>
> **Sourced.** Ormi's page: Huggles is a three-hit attack dealing a total of 1,110~1,254 HP of **special damage "that cannot be reduced by any means."** zero_six: "3 hits (Chain x2) of physical damage… each hit has Delay effect." So `HUGGLES_IS_REDUCIBLE = false` is [verified: 2 sources] in substance — one source says unreducible outright, the other adds nothing that contradicts it.
>
> **Not sourced: whether Huggles is accuracy-checked.** The wiki says nothing about hit checks. zero_six says nothing about hit checks. The earlier draft's argument — "the chain arithmetic used the *physical* randomiser and landed on the published total, which supports the physical typing" — is void twice over: `ffx2-combat-core.md` §2.1 step 7 applies `rand(240..271)/256` to **everything except menu White Magic**, so reproducing a band says nothing whatever about damage typing; and §4.1's exact case was Huggles itself, which tells us about the chain increment, not about hit checks.
>
> **Ruling.** `HUGGLES_IS_REDUCIBLE = false` is canon. Whether Darkness blunts Huggles is **authored behaviour** and must be labelled as such in the engine, not presented as a source-reconciled reading:
>
> ```ts
> const HUGGLES_IS_REDUCIBLE = false;        // [verified: 2 sources]
> const HUGGLES_IS_ACCURACY_CHECKED = true;  // AUTHORED. No source states this either way.
> ```
>
> The design case for leaving it `true` is reasonable (it keeps Darkness Dance meaningful against the fight's deadliest move) but it is a design case, not a finding. Flagged as G10.

### 4.3 Logos' abilities

| Ability | Type | Target | Base / effect | Notes | Confidence |
|---|---|---|---|---|---|
| **Double Shot** (normal attack) | Physical, **2 hits (Chain ×1)** | 1 random | base **30.25 per hit** (`(21+17)×21×17/1024 + 17`); 2 hits chain to **×2.45 total** | Trivial damage. Logos is a *status* threat, not a damage threat. | [derived; the 2-hit/Chain-×1 classification is [verified: 2 sources]] |
| **Russian Roulette** | Constant, single | 1 | **Moderate non-elemental damage**, plus **one** of: **Death, Eject, Petrification, Silence, Curse, Poison** | The reason every guide says kill Logos first. Death and Petrification are instant losses of a character; **Eject removes her from the battle outright**; **Curse disables spherechange**. | [verified: 2 sources] |
| **Hail of Bullets** | Constant, party-wide | all 3 | **Moderate non-elemental damage to the party** | No published number — see §13. | [verified: 2 sources for existence; [gap] for magnitude] |

> **Russian Roulette's status roll is the single most engine-relevant thing Logos does.** Six outcomes on one ability, three of which (Death / Eject / Petrify) remove a character. Petrification is worse than Death in X-2: a petrified character **shatters permanently** if any physical attack connects, and all three petrified is a Game Over. [verified: 2 sources]
>
> Counters the party can realistically hold at this point: **Soft** (Petrify), **Echo Screen** (Silence), **Antidote** (Poison), **Holy Water** (Curse), **Phoenix Down** (Death), **Remedy** / **Esuna** (everything except Death and Eject). **Eject has no cure** — the character is simply gone for the battle. Characters in a **special dressphere cannot be ejected**, which is a real, canon reason to transform. [verified: 2 sources]

### 4.4 Leblanc's abilities

| Ability | Type | Target | Base / effect | Notes | Confidence |
|---|---|---|---|---|---|
| **Fan Slap** (normal attack) | Physical | 1 random | base **74.51** (`(23+33)×23×33/1024 + 33`) | Goes through Defense; Protect halves it | [derived; formula verified: 2 sources] |
| **Fira / Blizzara / Thundara / Watera** | Magic, single | 1 random | base **78** (`23×2 + 32`) × `C²/64` with **C = 13** → **206** before the MDef term | Fire / Ice / Lightning / Water respectively. Chosen 1/4 each on her turn 3. Halved by Shell. Scaled by Magic Break. | [formula verified: 2 sources; **C = 13** is the published Lv.2 tier constant, `ffx2-combat-core.md` §3.6, [single source: pbirdman calculator]] |
| **Mach Fan** | Constant, party-wide + Delay | all 3 | **Moderate non-elemental damage to the party** and a **weak Delay** | Upgraded Sonic Fan. No published number — see §13. | [verified: 2 sources for effect; [gap] for magnitude] |
| **Flash Bomb** | Constant, party-wide | all 3 | base **50** → **46~52** damage, **50 % chance of Darkness** | **Leblanc's ability is Flash Bomb, unanimously** — see the naming note below. | [verified: 2 sources] |
| **Hush Grenade** | Constant, party-wide | all 3 | base **50** → **46~52** damage, **50 % chance of Silence** | Silence blocks White Magic, Black Magic, Arcana **and both Songstress commands**. Against a Darkness-Dance strategy this is her only real answer. | [verified: 2 sources] |
| **Love Tap** | Support | Ormi or Logos | Casts **Haste** on whichever of the two is alive | ATB tick rate ×1.05, animations sped up. Modest — but it is her *characterising* move: she buffs the boys, never herself. | [verified: 2 sources] |
| **Not-So-Mighty Guard** | Support, enemy party | all 3 enemies | **Protect + Shell + Regen** on the whole Syndicate | Fires on her turns 1 **and** 5 of the basic loop, so it comes back roughly every 21 s. Protect halves your physicals, Shell halves your magic, Regen restores ≈3 % max HP per tick. **Dispel removes all three.** | [verified: 2 sources] |
| **White Wind** | Recovery, enemy party | all 3 enemies | Restores **1/8 of max HP** to the enemy party and **cures all their negative statuses** | Only used when the relevant henchman is dead. **This is what un-blinds the trio** — it wipes your Darkness. | [verified: 2 sources] |
| **Osmose** | MP drain | 1 | Drains MP from a character to restore her own | Gated on her having **≤ 14 MP**. She starts with **460 MP**, so in a normal-length fight this branch is effectively dead code. | [verified: 2 sources] |
| **No Love Lost** | Three-person combo | see below | see §4.5 | Requires **both** Ormi and Logos alive | [verified: 2 sources] |

> **Flash Bomb and Flash Grenade are two abilities, not one ability with two labels. Corrected 2026-09-19.** The FFX-2 enemy-abilities master list carries **both names as separate adjacent rows**, and assigns them to different enemies: `Flash Bomb` → Elma (Ch. 5), Gippal, League Slasher, **Leblanc (Final)**; `Flash Grenade` → **Logos (Djose Highroad)**. zero_six agrees exactly — his Leblanc third-battle entry lists Flash Bomb, his Logos (Djose Highroad) entry lists Flash Grenade. All three sources therefore give **Leblanc → Flash Bomb**, and there is no conflict to reconcile. The two rows publish identical effect and damage (46~52 + Darkness to the party) but are distinct records and **must not be merged in the ability table**. §1.1 row 5's "Flash/Hush Grenade" for Logos at Djose is correct as written. [verified: 2 sources]

### 4.5 No Love Lost — the three-person combo, exactly

The signature set piece, and the mechanical reason the fight is a three-on-three rather than three separate enemies.

| Part | Who performs it | Target | Damage | Confidence |
|---|---|---|---|---|
| **1** | **Logos** empties both revolvers | **8 hits on random characters** | published as **22~25 per hit** (damage constant 5), "for a maximum total of **267~304**" if all eight land on one. Hits on the same character **self-chain**; our reconstruction of that chained total gives 266~302, not 267~304 — see §4.1. | [verified: 2 sources for the published figures; the base-24 / chain decomposition is [derived, inexact]] |
| **2** | **The party is knocked off its feet** | **all 3 characters** | base **106** → **99~112** each | [verified: 2 sources] |
| **3** | **Ormi** finishes one character | **1 character** | **3/8 of that character's *remaining* HP** | [verified: 2 sources] |

**Trigger condition:** on Leblanc's **[8x − 5]-th turn** — her 3rd, 11th, 19th, 27th… — **and only while both Ormi and Logos still have HP**. [verified: 2 sources]

```
// Leblanc's action-number device
if (leblancTurnCount % 8 === 3 && ormi.hp > 0 && logos.hp > 0) {
  useNoLoveLost();
}
// Failsafe: after turn (25 + noLoveLostUseCount), force Not-So-Mighty Guard
```

**Worst-case total on a single character** (all eight bullets on her): `304 + 112 + 3/8 of what is left`. Against a Lv 22 Songstress (648 HP) that is 304 + 112 = 416, leaving 232, then −87 → **145 HP remaining**. It does **not** one-shot anyone in the standard dressphere set from full HP. Against a full party the damage is normally spread and the practical cost is ~110–200 per character plus one heavy hit.

**Design read:** No Love Lost is a *spectacle*, not an execution. It is timed, it is loud, it has three distinct animation beats, and it is switched off the instant either henchman falls. That makes it the perfect thing for a presentation layer to build around — and it means the encounter's difficulty curve is entirely under the player's control, which is exactly what an onboarding chapter wants.

### 4.6 The goons (Act I only)

| Enemy | HP | MP | EXP | Gil | Steal | Drop | Abilities | Confidence |
|---|---|---|---|---|---|---|---|---|
| **Dr. Goon** | 232 | 41 | 10 | 50 | Budget Grenade / **Grenade** | Potion / Hi-Potion | Strike (physical, single) | [single source] |
| **Fem-Goon** | 167 | 172 | 10 | 70 | Potion / Potion ×2 | Potion / Hi-Potion | Fire·Blizzard·Thunder·Water (party-wide), Fira·Blizzara·Thundara·Watera (single), Fan Slap | [single source] |

Both are immune only to **Curse**, and both can be **bribed** (S-Bomb ×3 / M-Bomb ×3). The Dr. Goon's rare steal is a **Grenade**, which does base **300 to every enemy** — steal two in Act I and you have opened Act III with roughly a quarter of Leblanc's HP per throw. That is a genuinely canonical, genuinely teachable item loop. [verified: 2 sources for the Grenade figure]

---

## 5. Engine data the combat core needs

### 5.1 Accuracy — an unclosed gap, and the tuning constant standing in for it

**CORRECTED 2026-09-19.** The earlier version of this section claimed Accuracy was "absent from every source" and filled the hole with 110 "the midpoint of the party's own band," then validated that choice with a table the choice was made to produce. Both halves were wrong. What follows is the corrected account.

**What the source actually says.** The Fandom `infobox enemy stats X2` template — the same template this document used as its primary source — **carries an `accuracy` field**, and it is populated for comparable FFX-2 enemy records. Retrieved as raw wikitext via the MediaWiki API on 2026-09-19:

| Record | Published `accuracy` |
|---|---|
| **Dr. Goon** — fights alongside Ormi in **Act I of this very mission** | **3** |
| **Boris** (Floating Ruins, Ch. 1 — the Candidate A mission's spider) | **3** and **4** |
| **Battlesnake** (a Chateau Leblanc Ch. 2 encounter) | **98** |

For all six Syndicate records the `accuracy` parameter is **simply omitted from the template instance** — the field is not missing from the data model, it is blank for these six. Published enemy Accuracy therefore spans at least **3 to 98**, has no relationship to the party's 98–123 band, and **the closest comparable record in this same battle is 3**. Any inference from party Accuracy is unsupported.

**The hit model does not survive contact with those numbers.** `ffx2-combat-core.md` §2.6 gives the decoded hit check as a flat additive points race:

```
attackerScore = (hasDarkness ? floor(Accuracy / 4) : Accuracy) + attackerLuck
              + 10 * accuLevel + 5 * luckLevel
defenderScore = targetEvasion + targetLuck + 10 * evaLevel + 5 * luckLevel
hitPercent    = clamp(0, 100, attackerScore - defenderScore)
```

Feeding **Accuracy = 0** into this gives Ormi (Luck 4) a score of 4 against a Lv 22 Gunner's defenderScore of 19, i.e. a **0 % hit rate**. But so does Dr. Goon's *published* Accuracy of 3 (score 3 + Luck), and so does Boris's 3, and Battlesnake's 98 would give near-guaranteed hits — none of which can all be true of a game where ordinary fiends connect routinely.

**The honest conclusion is therefore not a number. It is a gap.** Either §2.6's decoded formula does not apply to enemy attackers in the form transcribed, or the enemy `accuracy` field is on a different scale from the party's (note §2.6's own Mad Rush row, where `Accuracy = 70` *overrides* the computed hit chance with a flat 70 %, which is evidence that the field is read differently in at least one place), or the blank-field convention means something we have not decoded. **This document does not know which, and will not pretend to.** Recorded as G1.

**What the engine gets in the meantime.** An explicitly unsourced tuning constant, not a derivation:

```ts
// UNSOURCED ENGINE-TUNING CONSTANT. No canonical support whatsoever.
// The six Syndicate records leave `accuracy` blank; comparable published
// values run 3 (Dr. Goon, same battle) to 98 (Battlesnake). Neither the
// value nor the hit model it feeds is verified. Revisit when G1 closes.
const SYNDICATE_ACCURACY_TUNING = 110;
```

For reference only, here is what that tuning value does under §2.6's formula. **This table is an engine-behaviour preview, not evidence, and nothing in this document should cite it as confirmation of anything:**

| Target (Lv 22) | Eva | Luck | defScore | **Ormi** (Luck 4) | **Logos** (Luck 10) | **Leblanc** (Luck 16) |
|---|---|---|---|---|---|---|
| Gunner | 4 | 15 | 19 | **95 %** | 100 % | 100 % |
| Warrior | 5 | 12 | 17 | **97 %** | 100 % | 100 % |
| Songstress | 10 | 9 | 19 | **95 %** | 100 % | 100 % |
| Black Mage | 4 | 10 | 14 | **100 %** | 100 % | 100 % |
| **Thief** | **19** | **26** | **45** | **69 %** | 75 % | 81 % |

**And under Darkness** (Accuracy ÷ 4 = 27):

| Target (Lv 22) | **Ormi** | **Logos** | **Leblanc** |
|---|---|---|---|
| Gunner | **12 %** | 18 % | 24 % |
| Warrior | **14 %** | 20 % | 26 % |
| **Thief** | **0 %** | **0 %** | **0 %** |

**This is not a validation and the earlier draft was wrong to present it as one.** 110 was chosen so that Darkness would suppress the trio's hit rate; the table then reports that Darkness suppresses the trio's hit rate. That is circular. The canonical Darkness-Dance strategy is independently sourced (every guide for every Syndicate fight opens with it) and needs no arithmetic from us; it does **not** corroborate the number.

**The one thing the sources do fix**, independently of any Accuracy value, is the **Darkness ÷ 4 term** in the hit check [verified: 2 sources], which guarantees that blinding the trio is a large effect whatever their base Accuracy turns out to be. Build the chapter's Darkness-Dance teaching moment on that, not on 110.

[gap — see G1. The hit formula is [single source, calculator-derived]; the Darkness ÷4 term is [verified: 2 sources]; `SYNDICATE_ACCURACY_TUNING` is unsourced and canonically unsupported.]

### 5.2 ATB, charge and recovery — the tempo of a mirror match

Using `secondsToAct = 3.3333 × value / (Agility + 1)` at the sheet's baseline recovery value of 70 (`ffx2-combat-core.md` §1.2–1.4):

| Unit | Agility | Seconds per turn | Relative |
|---|---|---|---|
| **Thief** (Rikku) | 60 | **3.82 s** | fastest on the field |
| **Songstress** | 55 | 4.17 s (**8.33 s** after any Dance — every Dance is `2xRT`) | — |
| **Leblanc** | **53** | **4.32 s** | — |
| **Gunner** (Yuna) | 53 | 4.32 s | **exactly matched to Leblanc** |
| **Warrior** (Paine) | 50 | 4.58 s | — |
| **Logos** | **49** | **4.67 s** | — |
| **Ormi** | **42** | **5.43 s** | slowest on the field |

> **This is a true mirror match in tempo, and the numbers say so.** Leblanc and Yuna's Gunner act at an identical 4.32 s; Ormi is the slow bruiser, Paine the slow-ish bruiser; Logos and Rikku are the quick ones. Unlike every other boss in the project, this encounter is **not** built on the enemy being faster or slower than you — it is built on the two teams being the same shape. State this in the chapter's design notes; it is the mechanical expression of the whole rivalry.

**Charge and recovery values are not published per enemy ability.** Use the tiering in `ffx2-combat-core.md` §1.3: instant (`chargeValue 0`) for Shield Bash, Double Shot, Fan Slap, Supercollider, Love Tap; short `CT` (`16`) for the four elemental spells, Flash Bomb, Hush Grenade; medium (`26`) for Mach Fan, Hail of Bullets, Russian Roulette, Not-So-Mighty Guard, White Wind; long (`39`) for Huggles, Concussive Blast and **No Love Lost** — the last of which should carry the longest charge in the fight so the telegraph has room to land. [estimate — the tier system is sourced, the per-ability assignment is not]

**Delay.** Supercollider and every hit of Huggles carry a Delay effect, which empties a **predetermined percentage** of the target's ATB or CTIM bar. The percentage is not published for enemy abilities. Implement as a named constant and note that Delay **cannot cancel a CTIM already in progress** — it only pushes it back. [verified: 2 sources for the mechanic; [gap] for the magnitude]

### 5.3 The AI scripts, verbatim

**Leblanc — "Chateau End"** [verified: 2 sources — decompile-derived AI transcription]

```
Basic Pattern:
Turn 1  Not-So-Mighty Guard
Turn 2  Normal Attack (Fan Slap) on random character
Turn 3  If (MP <= 14)  -> Osmose
        Else          -> Fira / Blizzara / Thundara / Watera, 1/4 chance each,
                         on a random character
Turn 4A (1/2 chance)  If (Ormi alive)  -> Love Tap on Ormi   Else -> White Wind
Turn 4B (1/2 chance)  If (Logos alive) -> Love Tap on Logos  Else -> White Wind
Turn 5  Repeat Turn 1  (Not-So-Mighty Guard)
Turn 6  Mach Fan (3/5) | Flash Bomb (1/5) | Hush Grenade (1/5)
Repeat from Turn 2

Action Number Pattern (overrides the above):
  After her [8x - 5] turn (3rd, 11th, 19th, ...), if BOTH Ormi and Logos
  have HP remaining -> No Love Lost.
  After her [25 + times No Love Lost was used] turn -> Not-So-Mighty Guard.
```

**Ormi — "Chateau End"** [verified: 2 sources]

```
Basic Pattern:
Turn 1  Normal Attack (Shield Bash) on random character
Turn 2  Normal Attack on random character
Turn 3  Normal Attack on random character
Turn 4  Supercollider on the character FURTHEST AWAY

If (HP < 1/4 max)      -> Concussive Blast
Else                   -> continue Basic Pattern

If (Ormi is the ONLY enemy remaining)
   Normal Attack on random character      (1/2)
   Supercollider on furthest character    (1/4)
   Huggles on random character            (1/4)
Else
   continue Basic Pattern
```

**Logos — "Chateau End"** — **no AI script is published.** His infobox carries no `aiscript` flag (Leblanc's and Ormi's do). What is known: his Last Room ability set is exactly **Hail of Bullets + Russian Roulette** on top of Double Shot. See §13 for the recommended reconstruction and why it is flagged as authored, not canon. [gap]

### 5.4 The three AI facts that decide the fight

1. **Killing *either* henchman switches off No Love Lost.** The condition requires both. Logos has the least HP (989) and the worst threat, so he is the correct target — and this is exactly what every published strategy says, arrived at independently from the script.
2. **Ormi only uses Huggles when he is the last enemy alive.** ~1,185 damage on a party whose largest standard-dressphere pool at Lv 22 is a Warrior's 1,089 HP. **Killing Leblanc and Logos first arms the fight's deadliest move.** This inverts the reflexive "weakest first" habit and is the single best "the queue answers before you commit" teaching moment in the chapter.
3. **Leblanc alone is a stalemate engine, not a threat.** With both henchmen dead, her turn 4 branch resolves to **White Wind** — she heals the (empty) enemy party by 1/8 max HP and **cures her own statuses, wiping your Darkness** — while turns 1 and 5 keep re-applying Protect + Shell + Regen. She cannot use No Love Lost and has no Love Tap target.

**The derived correct order is therefore: Logos → Ormi → Leblanc.** Logos first to stop Russian Roulette and disarm the combo; Ormi second *while Leblanc is still alive* so he never reaches the Huggles branch; Leblanc last, when she is reduced to self-buffing and a single-target spell. Expect **Concussive Blast** (281~317 to all) as Ormi crosses 25 % HP — budget a heal for it.

---

## 6. Derived damage tables

Party stats are the Lv 22 column of `ffx2-bahamut.md` §4.2 [verified: 2 sources]. Mean randomiser roll, no buffs, no Chain, Not-So-Mighty Guard not active.

### 6.1 What the Syndicate does to you

| Dressphere (Lv 22) | HP | Def | MDef | Ormi **Shield Bash** | Logos **Double Shot** (2 hits) | Leblanc **Fan Slap** | Leblanc **-ra spell** | **Concussive Blast** | **Flash/Hush** |
|---|---|---|---|---|---|---|---|---|---|
| Warrior | 1,089 | 97 | 8 | **84** | 51 | 51 | **212** | 281–317 | 46–52 |
| Thief | 972 | 25 | 55 | 119 | 71 | 72 | 174 | 281–317 | 46–52 |
| Gunner | 934 | 30 | 30 | 117 | 70 | 70 | 194 | 281–317 | 46–52 |
| Alchemist | 853 | 26 | 10 | 118 | 71 | 71 | **210** | 281–317 | 46–52 |
| Gun Mage | 809 | 25 | 65 | 119 | 71 | 72 | 166 | 281–317 | 46–52 |
| White Mage | 664 | 12 | 130 | 125 | 75 | 75 | **113** | 281–317 | 46–52 |
| Songstress | 648 | 7 | 41 | 128 | 76 | 77 | 185 | 281–317 | 46–52 |
| Black Mage | 642 | 7 | 125 | 128 | 76 | 77 | **117** | 281–317 | 46–52 |

**Reading it.** Ordinary attacks land 50–130 on a 640–1,090 HP party — roughly 6–20 % per hit. The party-wide constants (Concussive Blast, No Love Lost part 2, Grenade-class hits) are what actually move the health bars, and **no Defense stat reduces them**, which is the fight's one real teaching sting for a player who thinks the Warrior is safe. Leblanc's spells are the only damage the MDef gradient touches — and they are hardest on the **Warrior (212)** and softest on the **mages (113–117)**, the exact inverse of the physical column.

**Fatal or near-fatal cases to budget for:**

| Situation | Damage | Against |
|---|---|---|
| **Huggles** | **1,110~1,254** | kills every standard dressphere at Lv 22 except a topped-up Warrior. **Only reachable if Ormi is left alone.** |
| **Supercollider** | 50 % of current HP + Delay | never lethal on its own; the Delay is the real cost |
| **No Love Lost**, all eight bullets on one character | 416 + 3/8 of the remainder | ~78 % of a Songstress's pool. Survivable from full. |
| **Russian Roulette** rolling Death or Petrify | instant | the only true removal in the fight |

### 6.2 What you do to them

| Attacker (Lv 22) | Base number | vs **Ormi** (Def 84 / MDef 16) | vs **Logos** (Def 4 / MDef 18, **Eva 40**) | vs **Leblanc** (Def 10 / MDef 62, Eva 22) |
|---|---|---|---|---|
| **Warrior** Attack (Str 60) | 165.7 | 121 | 173 @ **64 % hit** → EV 111 | 169 @ 76 % hit → EV 128 |
| **Gunner** Attack (Str 48) | 120.2 | 88 | 125 @ **88 % hit** → EV 110 | 123 @ 100 % |
| **Thief** Attack (2 hits, Str 42) | 99.8 ×2 (chain ×2.45) | 178 | **255** @ 86 % hit | 249 @ 98 % |
| **Black Mage** Fire (C 8, Mag 71) | 115 | 115 | 114 | 94 |
| **Black Mage** Fira (C 13, Mag 71) | 115 | **302** | 300 | 248 |
| **Gunner** On the Level (flat, Lv × 16) | — | **352** | 352 | 352 |
| **Grenade** item (base 300, all enemies) | 300 | 281–317 | 281–317 | 281–317 |

Hit-rate column uses `ffx2-combat-core.md` §2.6 with **party** Accuracy from `ffx2-bahamut.md` §4.2 — those are published values, so this column does not depend on the unresolved enemy-side problem in G1: Warrior Acc 102 + Luck 12 = 114, Gunner 123 + 15 = 138, Thief 110 + 26 = 136, against Logos' defScore of 50, Leblanc's of 38 and Ormi's of 4. **It does still depend on §2.6 itself being right, which G1 now casts doubt on.** Treat the percentages as indicative.

**Reading it.**
- **Ormi:** a Black Mage's Fira does **302** through MDef 16 — **2.5× what a Warrior's sword does** through Def 84, from a dressphere with worse raw stats. Five casts kill him; it takes eleven Warrior swings. *This is the Act I lesson made explicit.* The Gunner's **On the Level** (flat `level × 16`, defence-independent) is the non-mage answer at **352**, the single biggest number anyone can put into him.
- **Logos:** Def 4 means everything hurts him; Eva 40 means the **Warrior misses him more than a third of the time** while the long-range Gunner connects 88 % and the Thief 86 %. His scan text — good at evading — is literally true and mechanically visible. *This is the Act II lesson.*
- **Leblanc:** MDef 62 is the highest in the fight, Def 10 the second-lowest. Swords, not spells. And **Not-So-Mighty Guard halves both columns until you Dispel it.**
- **Chain multiplies all of it.** Thief's Attack self-chains (2 hits); Gunner's Trigger Happy self-chains once per R1 press; three characters converging on one target chain each other. A well-chained Act III finishes in under a minute.

### 6.3 Battle rewards

| | EXP | AP | Gil | Stealable gil | Drop |
|---|---|---|---|---|---|
| Leblanc | 380 | 2 | 300 | 1,500 | Reassembled Sphere (key item) |
| Logos | 260 | 2 | 240 | 640 | Charm Bangle |
| Ormi | 260 | 2 | 240 | 600 | Twist Headband |
| **Total** | **900** | **6** | **780** | **2,740** | — |

Three **Elixir-tier steals** in one battle (Elixir / Mega-Potion + Elixir / X-Potion + Elixir) at a 75.3 % steal rate, plus 2,740 gil to Pilfer Gil. For an onboarding chapter this is an unusually generous, unusually legible reward for engaging with the Thief's kit — use it.

---

## 7. The typical party at this point

### 7.1 Level and progression baseline

| Field | Value | Confidence |
|---|---|---|
| Chapter | **2**, mid-chapter — **before** the Bevelle Underground / Bahamut finale | [verified: 2 sources] |
| Typical party level | **Lv 18–24**, centre of mass ~**Lv 21** | [estimate — anchored on enemy Lv 19/21/23 and on the Bahamut baseline of Lv 20–28 later in the same chapter] |
| Level spread | **Paine ≥ Rikku ≥ Yuna** (separate EXP pools; Yuna needs the most EXP to Lv 99, Paine the least) | [verified: 2 sources] |
| Story progress on completion | +3.8 % | [single source: Jegged] |

**Critical system note:** in FFX-2 **all combat stats come from the equipped dressphere, not the character.** Yuna, Rikku and Paine are mechanically identical in a shared dressphere at the same level; only level differs. Accessories are not character-specific. [verified: 2 sources]

### 7.2 Dresspheres owned at the Chateau fight

This is **not** the same list as the Bahamut chapter — two of that chapter's assumptions are false here.

| Dressphere | Owned? | Acquisition | Confidence |
|---|---|---|---|
| **Gunner** (Yuna) | **Yes** | default | [verified: 2 sources] |
| **Thief** (Rikku) | **Yes** | default | [verified: 2 sources] |
| **Warrior** (Paine) | **Yes** | default | [verified: 2 sources] |
| **Songstress** | **Yes** | Ch. 1, after first defeating Leblanc in Luca | [verified: 2 sources] |
| **Black Mage** | **Yes** | Ch. 1, reward for the **Floating Ruins** mission — i.e. won from these same three people | [verified: 2 sources] |
| **White Mage** | **Yes** | Ch. 1, Besaid story mission | [verified: 2 sources] |
| **Gun Mage** | Likely | Ch. 1 or Ch. 2, Moonflow — optional | [verified: 2 sources] |
| **Alchemist** | Possible | Ch. 2, Calm Lands Ruins — optional | [verified: 2 sources] |
| **Dark Knight** | **NO** | Bevelle Underground, **later in Chapter 2** | [verified: 2 sources] |
| Samurai / Lady Luck / Berserker / Trainer | **NO** | all Chapter 3 | [verified: 2 sources] |
| Mascot | **NO** | endgame | [verified: 2 sources] |
| **Floral Fallal** (Yuna) | **Likely** | Ch. 2, Djose Highroad — a *Strip Search* location | [verified: 2 sources] |
| **Machina Maw** (Rikku) | **Likely** | Ch. 2, Bikanel Oasis — a *Strip Search* location | [verified: 2 sources] |
| **Full Throttle** (Paine) | Possible | Macalania Woods, Tromell ×4, Ch. 1 or 2 — **permanently missable** | [verified: 2 sources] |

> **Two corrections against the Bahamut chapter's party model: Dark Knight is NOT owned here, and Healing Light is NOT owned here** (it is this mission's reward). Do not copy that chapter's recommended loadout wholesale.

> **The special dresspheres are a real option here and they interact with the fight.** A character in a special dressphere **cannot be Ejected**, which is one of Russian Roulette's six outcomes. Transformation requires passing through **every job on the equipped Garment Grid in one battle**, and accessories are disabled while transformed. At 3,713 total HP the fight may well end before a transformation completes — flag that for the designer rather than tuning around it.

### 7.3 Abilities realistically learned by now

Total AP earned across Chapter 1 and the first half of Chapter 2 is modest, so assume **one or two skillsets partially invested, not mastered**. [estimate]

**Songstress — Dance / Sing** (all Dances cost 0 MP and are `2xRT`)

| Ability | AP | Effect | Relevance here |
|---|---|---|---|
| **Darkness Dance** | **initial** | continuous **Darkness** on all enemies while she dances | **The canonical answer to every Syndicate fight.** §5.1 quantifies it: the trio's hit rate drops to 12–26 %, and to 0 % against the Thief. |
| Samba of Silence | 20 | continuous Silence on all enemies | Leblanc is Silence-**immune**; the boys have nothing to silence. Dead pick. |
| Slow Dance | 60 | continuous Slow on all enemies | **Works on all three.** Halves their ATB rate and pushes back the No Love Lost counter. |
| Battle Cry / Cantus Firmus / Esoteric Melody / Disenchant | 10 each | party STR / DEF / MAG / MDEF Up +1 level | Cheap, and DEF Up does nothing against the constant-type party-wide hits. |
| **Perfect Pitch** | 10 | party **ACCU Up +10 levels** = **+100 accuracy points** | Turns the Warrior's 64 % hit rate on Logos into a guarantee. The cheapest fix in the fight. |

**Warrior — Swordplay**

| Ability | AP | MP | Effect | Verdict |
|---|---|---|---|---|
| Power Break | 30 | 4 | STR Down ×2 | Works on Logos and Ormi, **dead on Leblanc** |
| Armor Break | 30 | 4 | DEF Down ×2 | **Best single use in the fight: Ormi.** Def 84 → your physicals ×1.83 at cap |
| Magic Break | 30 | 4 | MAG Down ×2 | Only Leblanc casts magic; works on her |
| Mental Break | 30 | 4 | MDEF Down ×2 (needs Magic Break) | Leblanc MDef 62 → your magic ×1.83 at cap |
| Sentinel | 20 | — | all physical damage taken → 1 HP until next turn; `2xRT` | **Does not stop** Concussive Blast, No Love Lost or Huggles |
| Flametongue / Ice Brand / Thunder Blade / Liquid Steel | 20 | 4 | elemental single-target | No weaknesses exist here |

Breaks are **stack levels, not stat changes** — 2 stacks per cast, cap 10, `×(12 ± n)/12` applied as a damage-pipeline multiplier. Full ramp table in `ffx2-bahamut.md` §1.5. [verified: 2 sources]

**Gunner — Gunplay.** Trigger Happy (initial) is the chain engine — one hit per R1 press, each hit a chain link. **Cheap Shot** (8 AP / 30 MP, ignores Defense) is the clean answer to Ormi's Def 84 if the party has no Black Mage. **On the Level** (12 AP / 40 MP) deals `user level × 16` flat and defence-independent — **336 at Lv 21, 352 at Lv 22** — which is the largest single number anyone in this party can put into Ormi.

**Thief.** Steal, Pilfer Gil, First Strike, Master Thief. Fastest dressphere, **two hits per Attack command** (self-chaining). Three Elixir-tier steals and 2,740 stealable gil make this the chapter that justifies the Thief.

**White Mage.** Cure / Cura, **Esuna** (20 AP / 10 MP — cures Curse, Silence, Darkness, Petrify, Poison, Sleep, Slow), **Dispel** (30 AP / 12 MP, needs Esuna — **strips Not-So-Mighty Guard**), Life, Shell, Protect. Protect is worth more here than in the Bahamut chapter because the trio's ordinary attacks are physical — but it does nothing against the constants.

**Black Mage.** Fire tier initial (C 8), **Fira tier at 40 AP (C 13)**, Focus (10 AP, MAG Up +3 = ×1.25). Fira into Ormi's MDef 16 is **302** — 2.5× a Warrior's sword into his Def 84, and the clearest single demonstration of FFX-2 damage routing available at this point in the game.

### 7.4 Garment Grids owned at this point

Available **before** this mission [verified: 2 sources]:

| Grid | Chapter | Where | Relevance |
|---|---|---|---|
| **First Steps** | 1 | start of game (6 nodes) | baseline |
| **Vanguard** | any | *Celsius*, Shinra's tutorial | baseline |
| **Bum Rush** | **2** | *Celsius*, **immediately after "Strip Search"** | Str & Mag up — earned from beating the Syndicate |
| **Hour of Need** | **2** | Bikanel Oasis — **beat Logos** | Def & MDef up — earned from beating Logos |
| **Stonehewn** | **2** | Mt. Gagazet — **beat Ormi** | Defense up — earned from beating Ormi |
| **Selene Guard** | 2 | Mi'ihen Highroad, "Cuckoo for Chocobos!" | contains **Shell** |
| **Helios Guard** | 1 | Moonflow, "Shave the Hypello" | contains **Protect** |
| **Healing Wind** | 1 | Luca, "Behind the Scenes" | Cure / Cura / Curaga via gates |
| **Heart Reborn** | 1 | Zanarkand Ruins | Life magic |
| **Protection Halo** | 1 | Besaid Cave, Flame Dragon | Def & MDef |
| **Shining Mirror** | 2 | Mushroom Rock Rd, beat Elma (needs the Awesome Sphere given to New Yevon) | Reflect |
| **Covetous** | 2 | Luca, Shelinda interview | absorbs HP/MP; grants Osmose |
| **Seething Cauldron** | 2 | Moonflow | Magic up |
| **Unerring Path** | 1/2 | comes with the first special dressphere | — |
| Heart of Flame / Ice Queen / Thunder Spawn / Menace of the Deep | 1–2 | various | element access without a Black Mage |
| Bitter Farewell / Restless Sleep / Still of Night / Raging Giant / Mortal Coil / Enigma Plate / Highroad Winds / Samurai's Honor | 1–2 | various | situational |

**NOT yet available:** **Healing Light** (this mission's reward), **Downtrodder** (Bevelle Underground), and every Chapter 3+ grid — Pride of the Sword, Chaos Maelstrom, White Signet, Wishbringer, Blood of the Beast, Howling Wind, Immortal Soul, Sacred Beast, Higher Power, The End. [verified: 2 sources]

> **The narrative-mechanical gift here writes itself:** Bum Rush, Hour of Need and Stonehewn are all won *from Logos and Ormi personally*, in the three missions immediately preceding this one. The party walks into the Chateau wearing the Syndicate's own uniforms and equipped with grids they took off the Syndicate. Do not let that go unremarked in the chapter's presentation.

### 7.5 Accessories realistically owned

| Accessory | Effect | Where | Relevance |
|---|---|---|---|
| **Heady Perfume** | HP/MP Stroll; **MP +20 %, Mag +5, Def +10, MDef +10, Agi +2, Luck +10** | **Chateau Leblanc, this mission** — fail the massage minigame once, then succeed | The best accessory in the chapter, and it is obtained minutes before the fight |
| **Gold Hairpin** | Halves MP cost; **Mag +20** | Chateau Leblanc — succeed at the massage on the **first** try | The alternative reward. You cannot have both. |
| **Silver Glasses** | Guards against **Darkness**; Def +4, MDef +4 | buy on the *Celsius*, 3,000 gil | Direct counter to **Flash Bomb** |
| **White Cape** | Guards against **Silence**; Def +4, MDef +4 | buy on the *Celsius*, 3,000 gil | Direct counter to **Hush Grenade** |
| **Beaded Brooch** | Guards against **Silence and Darkness**; Def +8, MDef +8 | **Ormi's drop at Mt. Gagazet (Ch. 2)** | Both counters in one slot — and you took it off Ormi |
| **Favorite Outfit** | Guards against Itchy; **Eva +10, Luck +10** | Mushroom Rock Rd (Ch. 1); also **Logos' Room drop** | +20 to defenderScore in §5.1's hit check |
| **Silver Bracer** | Max MP +40 % | Logos' Djose drop; buy 500 gil | — |
| **Iron Bangle** | Max HP +20 % | Ormi's Djose drop; buy 500 gil | Cheap insurance against Huggles |
| **Lure Bracer** | more encounters; **Str +15** | Logos' Bikanel drop | Raw Str for the Warrior |
| **Muscle Belt** | **Str +10, Def +10** | Mt. Gagazet Ch. 1 — **reward for beating the Syndicate in the prologue mission** | — |
| **Mythril Gloves** | **Def +20** | buy 1,000 gil at Zanarkand Dome | — |
| **Star Pendant** | Guards against Poison; Def +4, MDef +4 | buy 4,000 gil | Counters Russian Roulette's Poison roll |
| **Tiara** | Mag +5, MDef +5 | **steal from Leblanc at the Floating Ruins** | — |

**NOT available:** **Ribbon**, **Gris-Gris Bag**, Pearl Necklace, Glass Buckle (all Bevelle Underground or later), Speed Bracer, Cat Nip, Invincible, Diamond Gloves, Hyper Wrist, the Lore accessories at this stage. [verified: 2 sources]

> **There is no all-status guard in this chapter.** The Ribbon is one dungeon away and the player does not have it. Russian Roulette's six-way status roll is therefore a genuine, unblockable threat — which is exactly right for the chapter that *teaches* the player to care about status defence. Resist the temptation to hand them a Ribbon early.

### 7.6 Items and gil

No source records a canonical inventory. The following is a defensible mid-Chapter-2 baseline. **All [estimate] except the item effects.**

| Item | Typical count | Why it matters here |
|---|---|---|
| Potion / Hi-Potion | 40–99 / 10–25 | baseline |
| Phoenix Down | 10–20 | the only answer to a Russian Roulette Death roll |
| **Soft** | 3–8 | the only answer to Petrification before a physical shatters her |
| **Echo Screen** | 5–15 | Hush Grenade |
| **Eye Drops** | 5–15 | Flash Bomb |
| **Holy Water** | 3–8 | **Curse** — restores spherechange |
| Antidote | 5–15 | Russian Roulette's Poison roll |
| Remedy | 3–8 | blanket cure; **does not cure Death or Eject** |
| Ether | 5–12 | — |
| **Grenade / Budget Grenade** | 2–10 | **base 300 to all enemies** — ≈ a quarter of Leblanc's HP per throw; **stealable from the Dr. Goon in Act I** |
| Light Curtain / Lunar Curtain | 2–6 each | Protect / Shell without a White Mage |
| Gil | **4,000–15,000** | this battle adds 780, plus 2,740 stealable |

---

## 8. Teaching moments — what this chapter can legitimately onboard

The owner's ask was a chapter that doubles as the FFX-2 tutorial. Everything below is a property the canonical encounter *already has*; none of it requires changing a number.

| System | Where it is taught, in canon | How to surface it |
|---|---|---|
| **ATB and turn order** | The trio's Agilities (42 / 49 / 53) bracket the party's (50 / 53 / 60). Nobody is faster than everybody. | The "queue answers before you commit" front-end item: show the enemy's predicted next action against your own bar. |
| **Defense vs Magic Defense** | Act I. Ormi: Def 120, MDef 4. A Fira does 4× what a sword does. | Scan/Libra panel opened as a prompt, not a menu dive. |
| **Evasion and Accuracy** | Act II. Logos: Eva 40. The Warrior misses him 36 % of the time; the Gunner does not. | Show MISS prominently; offer Perfect Pitch as the fix. |
| **Status offence** | Darkness Dance — the canonical opener for every Syndicate fight, and §5.1 proves it works. | A one-time prompt the first time the Songstress is equipped. |
| **Status defence** | Russian Roulette's six-way roll, with **no Ribbon available**. | Show the rolled status by name with its cure item. |
| **Curse and spherechange** | Russian Roulette can inflict **Curse**, which disables the L1 Garment Grid menu outright. | The clearest possible demonstration of what spherechange *is*: take it away for ten seconds. |
| **Eject** | Russian Roulette can remove a character from the battle with no cure — **except that a special dressphere cannot be Ejected.** | The canonical reason to transform. |
| **Spherechange as a turn cost** | The grid's gates are the party's access to Shell, Protect and the elements at this level. | The owner's "the spherechange gets its moment" item lands here naturally. |
| **The Chain system** | **The enemy chains you first.** Huggles is 3 self-chaining hits; No Love Lost part 1 is 8; Logos' Double Shot is 2 and the game labels it "Chain ×1" on screen. | Let the enemy's chain counter appear before the player's. Then hand them Trigger Happy and the Thief's two-hit Attack. |
| **Enemy buffs and Dispel** | Not-So-Mighty Guard puts Protect + Shell + Regen on all three, twice per cycle. | The first fight in the game where doing nothing about a buff visibly doubles the fight's length. |
| **Target priority** | Kill Logos to disarm the combo; do **not** leave Ormi alone. | The best "read the fight" lesson in Chapter 2. |
| **Steal** | Three Elixir-tier steals at 75.3 %, plus 2,740 stealable gil. | Reward the behaviour on the first battle where it is obviously worth it. |
| **Oversoul** | **Not applicable to story bosses.** | Do not teach it here. It belongs to a random-encounter chapter. |

---

## 9. Scene, story and voice

### 9.1 Setting — Chateau Leblanc

**What it is.** The Chateau is the **former Guado Mansion in Guadosalam** — the house that belonged to the Guado leadership in FFX, and in which **Seymour Guado** lived. After Seymour's attack on the Ronso the Guado exiled themselves to the Macalania Woods, and Leblanc moved her syndicate into the empty manor and renamed it after herself. **Leblanc's own room is Seymour's old room.** [verified: 2 sources]

Guadosalam itself sits inside an underground cavern; its walls and walkways are the twisted roots of the trees on the Moonflow's north bank, and the town reads as an underground swamp. The gateway to the Farplane is on its upper level. [verified: 2 sources]

**The layout the mission uses,** in traversal order [verified: 2 sources]:
1. **Entrance** — two masked Al Bhed guards; the party dons the stolen uniforms here.
2. **Great hall / living room** — where Logos and Ormi hand out orders.
3. **Leblanc's private quarters** — the massage minigame; she falls asleep.
4. **Dining room, far-left doorway** — the hidden switch to the underground.
5. **The underground maze** — the Syndicate's real workplace: a **"mission" room with a Sphere Oscillo-finder**, a **"treasure" room** of stolen spheres, **Logos' room** and **Ormi's room**, security-override terminals, and a **spike wall** trap. **Acts I, II and III all happen down here.**

**Tonal note for the art team.** The upstairs is a stolen aristocratic house wearing a gaudy costume — Guado organic architecture, grown timber and root-arches, now hung with pink and hearts. The downstairs is a working sphere-hunters' den: crates, cable, machina terminals, loot. The joke of the location is the mismatch, and the fight happens in the part that is honest about what they are.

### 9.2 Story beats

Tone legend: **[levity]** **[caper]** **[reveal]** **[truce]**

| # | Beat | Speakers | Tone |
|---|---|---|---|
| 1 | The Syndicate has robbed the Gullwings' own airship, taking the half-sphere they dug out of the Zanarkand Ruins. Rikku is incandescent. The plan is to steal it back. | YRP, Brother, Shinra | [levity] |
| 2 | Three Syndicate uniforms are taken off goons across Spira — Djose, Bikanel, the Gagazet hot springs. Each theft is a fight with Logos or Ormi, and each one is lost by them. | YRP, Logos, Ormi | [caper] |
| 3 | The girls walk in the front door in the stolen uniforms. Nobody looks twice. | YRP | [caper] |
| 4 | Logos and Ormi, not recognising them, assign the new "goons" their duties — and Yuna is sent to massage the boss. | Logos, Ormi, Yuna | [levity] |
| 5 | **The massage.** Yuna works on a stressed, imperious Leblanc until she falls asleep. Played entirely for comedy, and it is Yuna's single most undignified scene in either game. | Yuna, Leblanc | [levity] |
| 6 | Logos and Ormi send the "goons" to check the switch — which opens the way to the Syndicate's underground. | Logos, Ormi | [caper] |
| 7 | **Brother calls Rikku on the comm and talks at full volume** mid-infiltration. She tells him to be quiet. He gets louder. The cover is blown. | Brother, Rikku | [levity] |
| 8 | **ACT I — Ormi, with a Dr. Goon and a Fem-Goon.** He recognises them, panics, and fights. He loses and runs to find Logos. | Ormi | [caper] |
| 9 | In Logos' room they find a **dud sphere** and, alongside it, **Crimson Sphere 10** — a recording of Ormi and Logos documenting the Crimson Squad selection. The comedy briefly stops being funny. | YRP | [reveal] |
| 10 | **ACT II — Logos and Ormi.** They lose and flee to warn Leblanc. | Logos, Ormi | [caper] |
| 11 | In the treasure room the girls find their stolen half-sphere — and Leblanc's matching half beside it. She had the other piece all along. | YRP | [reveal] |
| 12 | **ACT III — Leblanc, Logos and Ormi.** The three-on-three. | all six | [caper] |
| 13 | Beaten, Leblanc gives up the reassembled sphere rather than lose her dignity a fourth time. | Leblanc | [reveal] |
| 14 | They watch it together: it shows **Vegnagun**, an ancient machina weapon big enough to end Spira, buried under Bevelle. | all six | [reveal] |
| 15 | **The truce.** Two rival crews of sphere hunters agree to go into the Bevelle Underground together. Leblanc's reason surfaces obliquely — she does all of this for Nooj. | Leblanc, Yuna | [truce] |

> **This is the hinge of FFX-2's plot and nobody in the scene knows it.** Everything before beat 14 is a farce about a stolen sphere; everything after it is the Vegnagun story. A chapter that plays the comedy straight and then lets beat 14 land without a joke is doing exactly what the game does.

### 9.3 Voice notes — the Syndicate (all in my own words; no transcripts)

**Leblanc**

| Facet | Specification |
|---|---|
| Register | Theatrical aristocrat by choice, not by birth. She *performs* refinement and the performance has seams — the vowels slip when she is annoyed. |
| Address | She calls everyone by a diminutive endearment, warmly and condescendingly at once; it is affection deployed as a put-down. She has a private pet name for Nooj that she uses in public without embarrassment. |
| Rhythm | Long, confident, self-admiring sentences that she interrupts herself in. Rhetorical questions she answers. |
| Function | The antagonist as a **mirror of Yuna's celebrity** — she literally wore Yuna's face to sell tickets. Every scene she is in is about who gets to be looked at. |
| The seam | She is genuinely kind to people nobody else wanted. Logos and Ormi are not employees, they are strays she took in after the Den of Woe, and they know it. Let that show once, late, and never explain it. |
| Never | Admits a mistake in front of the boys. Apologises. Uses Yuna's title sincerely. |
| Sample lines (ORIGINAL, safe to use) | `[ORIGINAL]` "Oh, don't look so *tragic*, pet. You'll crease." · `[ORIGINAL]` "I took them in. That buys me a great deal of loyalty and exactly no gratitude." · `[ORIGINAL]` "Fine. Take it. I'd already memorised the good part." |

**Logos**

| Facet | Specification |
|---|---|
| Register | Dry, precise, faintly academic. He narrates the plan as if reading minutes. He is the only one of the three who is actually clever, and he would like that noticed. |
| Rhythm | Complete sentences. Subordinate clauses. He corrects Ormi mid-sentence and never raises his voice. |
| Function | The straight man — and the group's recording device. He films everything, which is how the Crimson Squad footage exists and how the plot moves. |
| The joke | His dignity is total and completely unearned. He is a man with two revolvers, a theory, and a 989-HP body. |
| Never | Panics audibly. Contradicts Leblanc to her face. |
| Sample lines (ORIGINAL) | `[ORIGINAL]` "I had allowed for this. Not this *soon*, but this." · `[ORIGINAL]` "Ormi. Breathe. Then panic. In that order." · `[ORIGINAL]` "I record. What's done with it afterward isn't my department." |

**Ormi**

| Facet | Specification |
|---|---|
| Register | Loud, aggrieved, emotionally transparent. Short declaratives. He asks questions he does not want answered. |
| Rhythm | Interrupts himself with feeling. Repeats a word when upset. |
| Function | The engine of the comedy and the group's actual muscle. Also the one who is most openly devoted to Leblanc, and the least able to hide it. |
| The joke | He loses seven times across the game — more boss appearances than any character in the series had held before — and turns up for the eighth. |
| Never | Gives up. Notices an insult on the first pass. |
| Sample lines (ORIGINAL) | `[ORIGINAL]` "That's — no. No! That's *cheating*, that is." · `[ORIGINAL]` "I wasn't peekin'. I was *patrolling*." · `[ORIGINAL]` "Boss said hold the door. I'm holdin' the door." |

**YRP in this chapter.** Use the voice guides in `writing-bible.md` §1.14–1.16 unchanged. The structural note: this is the chapter where **Rikku's comedy engine runs the scene** (§1.15) and Paine's one-word vetoes (§1.16) land hardest, because for once there is nothing at stake but pride. Yuna's seam (§1.14 — "she is performing being carefree, and the performance keeps slipping") gets its best joke here: she is in a stolen uniform giving her rival a massage.

### 9.4 What this chapter must *not* do

- **No transcripts.** All dialogue is original. The sample lines above are marked `[ORIGINAL]` and are safe.
- **Do not moralise the trio.** They are not redeemed at the end of this chapter; they are *beaten* and then pragmatically allied with. The redemption, such as it is, happens in Chapter 5.
- **Do not make Leblanc pathetic.** She loses four times and is never humiliated by the narrative — only by circumstance. That distinction is the character.

---

## 10. Visual and audio direction

### 10.1 Character appearance — in words only, for painters

All three designed by **Tetsuya Nomura**. Syndicate visual identity: **pink, and hearts.** [verified: 2 sources]

**Leblanc** — round face, **purple eyes**, short **blonde** hair. A pinkish-purple robe that leaves the chest open — showing the **Syndicate heart mark** — and bares the **right thigh**. High, curved, **tasselled collar**. Long **furisode-style sleeves**, with the cuffs separated from the sleeve-ends by white crisscrossed material. **Thigh-high stockings** in the same colour, **purple ankle boots**. The whole garment is patterned in **blue and white triangles and swirls**. She carries a **red-and-silver fan** in her right hand.
*Note for the designer:* her silhouette deliberately echoes the **Lady Luck** dressphere — her chest mark is a **heart**, one of the four card suits, matching the **spade, club and diamond** that Yuna, Rikku and Paine wear as Lady Lucks. She never uses a Lady Luck skill. Treat that as a visual rhyme to preserve, not a mechanic to implement. [verified: 2 sources]
*Poses:* fan raised and half-open as a screen for her face; weight on one hip; a stage performer's address to an audience that is not there. In battle the fan opens for **Sonic Fan / Mach Fan** as a shockwave emitter, and she snaps it shut on **Love Tap**.

**Logos** — **tall and slim**. A **black-and-silver helmet with a chin protector**, tied around the back of his head with a **purple strip**. A **blue robe and matching coat** carrying the **Syndicate logo on both shoulders**, with sweeping **kimono-like sleeves**. A **purple sash** at the waist. **Wraps around the ankles**. He wields **two revolvers**. Age **26** (*Ultimania*). [verified: 2 sources]
*Poses:* side-on duellist stance, both revolvers low. **Double Shot** is two quick aimed shots; **Hail of Bullets** is both guns emptied in an arc; **Russian Roulette** is a single deliberate shot preceded by a spin of the cylinder — the animation shows **rings inscribed with the ability's name in Spiran script**, which is a usable motif for the pane-break / spell-circle treatment. [single source for the rings]

**Ormi** — **short and stout**. A **large shield worn on his back**, bearing the **Syndicate heart logo**. Predominantly **purple samurai-style attire**. Age **22** (*Ultimania*). [verified: 2 sources]
*Poses:* low centre of gravity, shield swung around on its strap. **Shield Bash** is a straight shove; **Pirouette Pitch** (his Act I–II era move) is a full spin that hurls the shield at the furthest target; **Supercollider** is a charged body-check; **Huggles** is exactly what it sounds like — he picks a character up and squeezes, three times. Play Huggles as a joke that hurts, which is the whole character.

**Goons** — masks and skin-tight suits; **pink for the women, army green for the men**. The Gullwings wear the women's version for this entire mission, which means **YRP appear in Syndicate pink for the whole chapter until the reveal.** That is a free and canonical costume beat for the presentation layer. [verified: 2 sources]

### 10.2 Location — the Chateau, for the art team

**The upstairs (cutscene only).** Guado architecture — organic grown timber, root-arches, warm amber practicals — wearing a borrowed aristocratic costume: heavy drapes, a chandelier, an excess of pink, heart motifs stamped on everything a heart can be stamped on. The hall is the room where, two years earlier, Seymour Guado projected a sphere of ancient Zanarkand for Yuna. **Leblanc's bedroom is Seymour's old room.** Nothing in the scene acknowledges this. Let the set acknowledge it — keep one piece of Guado furniture that does not match.

**The downstairs (the arena).** A working sphere-hunter's basement, and the honest version of the house: **machina terminals** (the Sphere Oscillo-finder is the centrepiece of the mission room), crated loot, cable runs, security-override consoles, a spike-wall trap corridor, and a **treasure room** whose shelves are stolen spheres. The final fight is in this last room. Composition suggestion: **the party's backs to the loot they came for, the trio blocking the only door** — which is also the framing that makes a 3-vs-3 read as a 3-vs-3.

**Palette direction** (interpretive, consistent with the above):
- **Guado base:** deep sap-browns, root-black, mossy green-greys.
- **Leblanc overlay:** hot magenta, rose, gold trim — saturated, and applied like paint over something older.
- **Machina accents:** cold cyan terminal glow and sodium-amber warning lamps in the basement.
- **Key contrast:** the upstairs is warm and soft; the basement is cold and hard. The fight is cold.
- **The Syndicate heart:** the one shape that appears at every scale, from the tattoo to the shield to the door.

Per-scene lighting rigs, particle budgets and money-shot framing should be authored into `visual-bible.md` §2 as a new location sheet following the §2.4 template; this document deliberately stops at direction rather than specifying hex values it has no source for.

### 10.3 Music — in words, no quotation

Composers: **Noriko Matsueda and Takahito Eguchi**. [verified: 2 sources]

| Cue | Track | Where it plays | Direction for Pyrefly Reprise |
|---|---|---|---|
| **Location / syndicate theme** | *"Anything Goes for Leblanc!"* (Japanese title translates roughly as *Lady Leblanc Has Everything*), 1:45 | Chateau Leblanc, and the Syndicate's theme generally | Brassy, struttingly confident, big-band swagger with a comic wink. It is a *fanfare for someone who has awarded herself a fanfare*. Write it as a theme that is slightly too pleased with itself — a horn section that keeps taking an extra bar. |
| **Infiltration** | *"Three Mice in Chateau Leblanc"* (Japanese title translates roughly as *Infiltration! Leblanc's Hideout*), 1:43 | the OST note says only: plays when the Gullwings infiltrate Chateau Leblanc (an earlier draft added "also the basement maze"; that is not in the source and has been struck) | Light-footed caper music: muted rhythm, tiptoe pizzicato, stop-start phrasing, a joke in the percussion. Tension played entirely for fun. The North American sphere theater lists it under a French title meaning *Three Mice in Chateau Leblanc*. |
| **Battle** | *"Let Me Blow You a Kiss!"* (Japanese title translates roughly as *I'll Give You Something Hot!*), 2:08 | **plays in every Leblanc Syndicate boss battle** except the very first one in Luca. Also plays during the **Goon** and **Stalwart** fiend-tale endings. | **This is Act III's battle theme.** Upbeat, brassy, fast — a boss theme that refuses to be threatening. Nothing minor-key, nothing ominous. The instruction to the composer is: *the music is on the trio's side and the trio is ridiculous.* |
| **The Vegnagun reveal (beat 14)** | *"Disquiet"* (Japanese title *Fuan*, translating roughly as *Anxiety*), 2:11 | The OST page states it plays **when Leblanc explains Vegnagun to the Gullwings in her chateau** — i.e. exactly beat 14. It also plays at the Via Infinito, at the Bevelle Underground labyrinth leading to the Limbo, and during Yuna's nightmare. | **This is the cue for the moment the farce stops.** Low, unresolved, no melody to hold on to — the sound of a room that has just become a different kind of room. Added 2026-09-19: an earlier draft had mistakenly slid this track's Via Infinito / Bevelle note onto the battle theme's row, and in doing so lost the one cue in the OST that is canonically tied to this chapter's most important beat. |

**The contract with the Bahamut chapter.** That encounter's direction (`ffx2-bahamut.md` §5.4) is *"do not let the player celebrate."* This one is the exact inverse: **let them celebrate, loudly, and give them the victory pose back.** Two Chapter 2 encounters, opposite emotional instructions — that contrast is worth protecting in the mix.

---

## 11. The documented alternative — Floating Ruins, Chapter 1 (complete data)

Recorded in full so the orchestrator can switch candidates without a second research pass. **This is not the recommendation** (see §1.4).

**Mission:** *"Outrun the Leblanc Syndicate"* — be first to the top of the ruins. **Reward:** the **Black Mage** dressphere and a **Muscle Belt** (Str +10 / Def +10). The player still gets the sphere if they lose the race. Afterwards the Gullwings fight **Boris**, a guardian spider, for the sphere itself. [verified: 2 sources]

**Location:** the **Floating Ruins** at the peak of **Mt. Gagazet**. The peak was permanently fogged until the Fayth Scar went dormant; the fog lifted and revealed the ruins. Music: *"Gagazet Mountain."* Treasures on the route: Yellow Ring, Red Ring, White Ring, Star Pendant, Elixir, Mega Phoenix, Muscle Belt. [verified: 2 sources]

### 11.1 Stat blocks

| | **Leblanc #230** | **Logos #224** | **Ormi #217** |
|---|---|---|---|
| Level | 5 | 3 | 3 |
| HP | **120** | **100** | **130** |
| MP | 320 | 25 | 10 |
| Strength | 15 | 10 | 16 |
| Magic | 26 | 16 | 8 |
| Defense | **8** | *absent → 0* | **72** |
| Magic Defense | **55** | *absent → 0* | *absent → 0* |
| Agility | 52 | 72 | 42 |
| Evasion | 16 | **36** | *absent → 0* |
| Luck | 20 | 8 | 3 |
| EXP / AP / Gil | 20 / 2 / 250 | 10 / 1 / 80 | 10 / 1 / 80 |
| Gil (steal) | 700 | 280 | 280 |
| Common + rare drop | Hi-Potion ×1 / Hi-Potion ×2 | Potion / Phoenix Down | Potion / Phoenix Down |
| Steal | **Tiara** ×1 (both slots) | **White Cape** ×1 (both slots) | **Gauntlets** ×1 (both slots) |
| Abilities | **Sonic Fan** (minor non-elemental, party-wide), **Love Tap** (Haste on Ormi or Logos), Fan Slap | **Double Shot** only (2 hits, Chain ×1) | **Shield Bash** only |
| Status immunities | Death, Petrify, Silence, Confusion, Berserk, Curse, Eject, Stop, STR Down, DEF Down, Doom, Bribe, Gravity; `poison = 70` | Death, Petrify, Silence, Confusion, Berserk, Curse, Eject, Stop, Doom, Bribe, Gravity; `poison = 40` | Death, Petrify, Silence, Confusion, Berserk, Curse, Eject, Stop, Doom, Bribe, Gravity |

[verified: 2 sources throughout — wiki enemy template + zero_six]

### 11.2 AI scripts

```
Leblanc (Floating Ruins)
Turn 1  Normal Attack on random character
Turn 2  Sonic Fan
Turn 3  If (Logos and/or Ormi have HP) -> Love Tap on Logos or Ormi
        Else                           -> Normal Attack
Repeat from Turn 1

Ormi (Floating Ruins)
Use Normal Attack only.

Logos (Floating Ruins)
No script published.
```
[verified: 2 sources for Leblanc and Ormi; Logos is a [gap]]

### 11.3 What you get and what you lose

**Get:** genuine single-digit levels; a party owning only **Gunner, Thief, Warrior and Songstress**; a **First Steps** 6-node Garment Grid; a 350-HP fight that cannot overwhelm a new player; a Mt. Gagazet exterior that partly reuses the existing Seymour Flux chapter's palette; and — notably — **the same three-shape defensive lesson as the Chateau fight** (Ormi Def 72 / MDef 0 is a physical wall and a magic pushover; Logos Eva 36 dodges; Leblanc MDef 55 / Def 8 is the reverse of Ormi). The published strategy is also the same: Darkness Dance, then focus Leblanc to stop the Hasting.

**Lose:** every signature gag move except Leblanc's two; **No Love Lost**; the three-act escalation; Russian Roulette and therefore the entire status-defence lesson; the Chain demonstration; enemy buffs and Dispel; the uniform-disguise comedy; and the Vegnagun reveal that makes the chapter matter to the plot. Also: the Lv 1–10 dressphere stat band is documented nowhere in this project and would need a fresh research pass.

---

## 12. Disambiguation — do NOT use these records

| Record | Where | Why it is not this fight |
|---|---|---|
| **"????"** (disguised Leblanc) + 2 Goons | Luca, Ch. 1, opening | A separate bestiary entity for Leblanc in Yuna's face. Not the Leblanc boss record. |
| Leblanc **#229** (Luca, Lv 5, 130 HP) | Luca Dock 5, Ch. 1 | Solo, and marked "cannot escape". Her only ability is **Thunder**. |
| Logos **#223** / Ormi **#216** (Luca) | Luca, Ch. 1 | **This is the game's actual tutorial battle** — and it has no Leblanc. Ormi's Luca entry carries an anomalous `level = 18` alongside 97 HP and Def 60; treat the level field as unreliable for that record only. |
| Logos **#225** / Ormi **#219** (Djose Highroad) | Ch. 2 | Strip Search mission, with a Fem-Goon. Ormi's Pirouette Pitch era. |
| Ormi **#218** (Mt. Gagazet, Lv 18, 1,350 HP) | Ch. 2 | Strip Search, solo. Drops the **Beaded Brooch**. |
| Logos **#226** (Bikanel, Lv 18, 1,220 HP) | Ch. 2 | Strip Search, solo. Drops the **Lure Bracer**. |
| Ormi **#220** / **#221**, Logos **#227** | Chateau, Ch. 2 | **Acts I and II of this same mission** — use them, but do not confuse them with the Act III records. |
| **Creature Creator** Leblanc / Logos / Ormi | New Game Plus, Guadosalam, SP-size trap pod, any chapter | All three are recruitable AI party members in International / HD. Ormi's Supercollider is **rewritten** there to deal massive Defense-ignoring physical damage to one target. **Completely different behaviour — do not import.** [verified: 2 sources] |

---

## 13. Open questions / gaps — never guessed

| # | Gap | Impact | What would close it |
|---|---|---|---|
| G1 | **The enemy hit model is not understood — this is bigger than a missing field.** *(Rewritten 2026-09-19; the earlier version of this row was false.)* The wiki's `infobox enemy stats X2` template **does** expose an `accuracy` field; it is simply **blank for all six Syndicate records** while being populated for comparable enemies — **Dr. Goon 3** (who fights beside Ormi in Act I of this very mission), **Boris 3 / 4**, **Battlesnake 98**. Published enemy Accuracy thus spans at least 3–98 and bears no relation to the party's 98–123 band, so no inference from party Accuracy is available. Worse, feeding those *published* values into `ffx2-combat-core.md` §2.6's decoded points race gives Dr. Goon and Boris a ~0 % hit rate, which cannot be right. **Either §2.6 does not apply to enemy attackers as transcribed, or the enemy field is on a different scale, or the blank convention means something undecoded.** §5.1 now records this rather than filling it, and exposes `SYNDICATE_ACCURACY_TUNING = 110` as an explicitly unsourced tuning constant. | **High** — it is not one enemy's stat, it is whether the project's enemy hit model is correct at all. Also affects `ffx2-bahamut.md` (see X1). | A SinirothX-grade dump of the Accuracy field **plus** a statement of how enemy Accuracy enters the hit check. The Mad Rush row in §2.6 (`Accuracy = 70` *overrides* the computed chance with a flat 70 %) is the best existing hint that the field is read differently in some contexts. |
| G2 | **No damage numbers for Mach Fan, Sonic Fan, Hail of Bullets or Russian Roulette.** All four are described only as "minor" / "moderate". | Medium — three of them are party-wide. | Observed-damage reports, or the enemy ability constant table. The §4.1 band-inversion method will decode them the moment any band is published. |
| G3 | **Logos has no published AI script** for any of his fights. | Medium — his turn structure must be authored. Recommended reconstruction, explicitly flagged as **authored, not canon**: 3-turn loop of Double Shot, Double Shot, then Russian Roulette or Hail of Bullets; the Ormi/Leblanc scripts are both 3–6 turn loops with an action-count override, so a 3-turn loop is the house shape. | A decompile-derived AI transcription. |
| G4 | **Delay's magnitude is not published for enemy abilities.** Supercollider and each Huggles hit carry it. | Low — expose as a constant. | The pbirdman calculator's per-ability delay column, if it has one. |
| G5 | **Enemy MP costs are unpublished**, so Leblanc's `MP ≤ 14 → Osmose` branch cannot be reached deterministically. | Low — the branch is near-dead code at 460 MP. | Enemy ability MP table. |
| G6 | **CTIM / RECTIM values are unpublished per enemy ability.** §5.2 assigns tiers. | Low–medium — it sets the telegraph windows. | Frame data or the calculator's ability table. |
| G7 | **Conflict: Ormi #222's ability list.** The wiki infobox names *Concussive Shock*; the AI script and the ability master list both name *Concussive Blast*; zero_six lists neither. **Recommendation: implement Blast (base 300).** | Low | A third source. |
| G8 | **Conflict: GamerGuides prints the Act III enemies as Ormi 1,840 / Logos 1,432** — which are the **Act II** values. The wiki template and zero_six independently agree on **1,344 / 989**. **Ruling: use 1,344 / 989**; GamerGuides repeated the previous fight's block. | Low (resolved, recorded) | — |
| G9 | **Conflict: EXP and gil for Act II.** The wiki gives Logos #227 and Ormi #221 EXP 240 / gil 230 each; zero_six gives 480 / 460 each — exactly double, which looks like zero_six summing the pair. **Recommendation: use the wiki's per-enemy values.** | Low | — |
| G10 | **Huggles: reducibility is sourced, accuracy-checking is not.** *(Re-scoped 2026-09-19.)* "Cannot be reduced by any means" is published [verified: 2 sources]. **Whether Huggles is accuracy-checked is stated by no source** — the earlier draft's supporting argument (that the chain reconstruction "used the physical randomiser") was void, because step 7's randomiser applies to all damage types. `HUGGLES_IS_ACCURACY_CHECKED = true` is **authored behaviour** and is now labelled as such in §4.2. | Low mechanically; **medium as a provenance defect** — it was authored behaviour wearing a source's clothes, in a document whose hard rule forbids exactly that. | A source classifying the ability's hit-check behaviour. |
| G11 | *(Withdrawn 2026-09-19 — the conflict was invented.)* **There is no Flash Bomb / Flash Grenade conflict.** The enemy-abilities master list carries both as **separate adjacent rows** assigned to different enemies: Flash Bomb → Elma (Ch. 5), Gippal, League Slasher, **Leblanc (Final)**; Flash Grenade → **Logos (Djose Highroad)**. zero_six agrees on both. All sources give Leblanc **Flash Bomb**. The previous row appears to have matched on identical effect text rather than on the enemy column, and its "treat as one ability with two labels" instruction would have wrongly collapsed two distinct records. See the note under §4.4. | — (resolved; no gap) | — |
| G12 | **`multi attack = Immune`** appears on all six records and is not explained by any source. `ffx2-bahamut.md` guesses "(Break Damage?)". **Do not implement a behaviour for it until it is understood.** | Low | — |
| G13 | **No published "recommended level"** for the Faking and Entering mission in any guide consulted. The Lv 18–24 band in §7.1 is inferred from enemy levels and the chapter's later Bahamut baseline. | Low | An Ultimania progression chart. |
| G14 | **The Act III arena's exact room** is described by guides as the treasure / "last room" of the underground maze but never laid out. The composition in §10.2 is a proposal. | Low | Ultimania Omega map plates. |

---

## 14. Cross-document issues found during this pass (for the orchestrator — I did not edit those files)

| # | File | Issue |
|---|---|---|
| X1 | `ffx2-bahamut.md` §1.1 | **Re-scoped 2026-09-19 — the earlier recommendation was wrong and is withdrawn.** The observation that still stands: that document computes its hit-rate table from `0.90 + (acc − eva)/200`, a model `ffx2-combat-core.md` §2.6 has since superseded, so **the table is stale and should be recomputed or marked stale**. What is withdrawn: the recommendation to "re-derive along the lines of §5.1 here." §5.1's derivation was itself unsound (see G1) and has been replaced by a recorded gap. **Bahamut's Accuracy-0 reading is in fact better supported than §5.1's 110 was** — `ffx2-bahamut.md` §1.1 cites `ffx2-combat-core.md` for enemy Accuracy being routinely 0 on early fiends, and the published values found in this pass (Dr. Goon **3**, Boris **3/4**) corroborate that enemy Accuracy really does sit near zero. **Do not import a 110-style estimate into that file.** The real issue is shared and belongs in G1: §2.6's formula turns any near-zero enemy Accuracy into a 0 % hit rate, which is wrong for both documents. |
| X2 | `ffx2-bahamut.md` §2.3 | Its Mega Flare constant `C = 24` is justified partly by "24 is an attested FFX-2 damage constant — the published Lv.2 magic tier". **`ffx2-combat-core.md` §3.6 now records that ladder as wrong**; the real Lv.2 tier is **13**. The solved 22–24 band from observed damage still stands on its own, so the *value* is probably fine — but justification #2 is void and should be struck. |
| X3 | `ffx2-bahamut.md` §4.6 | Lists **Pearl Necklace** as "guards against Curse". The FFX-2 accessories table says Pearl Necklace guards against **Pointless**; the Curse guard is the **Gris-Gris Bag**. |
| X4 | `ffx2-combat-core.md` §1.7 | **Withdrawn and restated 2026-09-19.** The earlier version told the orchestrator to promote §1.7's recorded conflict to "resolved" on the strength of "two" exact reconstructions. **There is one.** Huggles (300 × 3.95 → 1,110~1,254) is exact; No Love Lost is not, and its published band is not even a self-consistent randomiser band (§4.1). **Recommended action: none.** §1.7 already tags `chainMult = 1.40 + 0.05 × chainNumber` as `[verified: 2 sources]` on its own sources; the only thing in dispute there is SinirothX's flowchart `× 0.5` transcription, which nothing in this document was ever load-bearing for. If §1.7 wants a supporting note, the honest wording is: *"one exact enemy-ability reconstruction (Huggles, `ffx2-leblanc-syndicate.md` §4.1) is consistent with ×0.05 and inconsistent with ×0.5."* |

---

## 15. Sources

**Primary data (enemy records, AI scripts, ability tables)**
1. Final Fantasy Wiki — *Leblanc (boss)*: https://finalfantasy.fandom.com/wiki/Leblanc_(boss) — all three Leblanc stat records, three AI scripts, battle prose, No Love Lost breakdown, Creature Creator note.
2. Final Fantasy Wiki — *Logos (boss)*: https://finalfantasy.fandom.com/wiki/Logos_(boss) — six Logos records.
3. Final Fantasy Wiki — *Ormi (boss)*: https://finalfantasy.fandom.com/wiki/Ormi_(boss) — seven Ormi records, six AI scripts, Huggles/Supercollider/Concussive prose.
4. Final Fantasy Wiki — *Final Fantasy X-2 enemy abilities*: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_enemy_abilities — effect lines and damage bands for Sonic Fan, Mach Fan, Love Tap, No Love Lost, Not-So-Mighty Guard, Huggles, Supercollider, Concussive Shock/Blast, Pirouette Pitch, Hail of Bullets, Russian Roulette, Flash Grenade, Hush Grenade, Osmose, White Wind.
5. **zero_six, *Final Fantasy X-2 — Enemy Database* (GameFAQs, PS2)**: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/28832 — **the independent second data source**. Reproduces every HP, MP, EXP, gil, drop and steal value above, plus attack-type classifications ("Double Shot — 2 hits (Chain x1)", "Huggles — 3 hits (Chain x2)", "Supercollider — reduces HP by 50 %, has Delay effect") and the goon records.
6. Final Fantasy Wiki — *Final Fantasy X-2 accessories*: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_accessories — Twist Headband, Charm Bangle, Heady Perfume, Gold Hairpin, Favorite Outfit, Tiara, Silver Glasses, White Cape, Beaded Brooch, Muscle Belt and their sources.
7. Final Fantasy Wiki — *Curse (Final Fantasy X-2 status)*: https://finalfantasy.fandom.com/wiki/Curse_(Final_Fantasy_X-2_status) — Curse blocks spherechange; cures and guards.

**Walkthroughs (mission structure, strategy, arena)**
8. Jegged — *FFX-2 Chapter 2: Chateau Leblanc*: https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-2/27-Guadosalam-Chateau-Leblanc.html — room order, the three fights, the massage-minigame reward logic, Charm Bangle drop, +3.8 % story progress.
9. GamerGuides — *Guadosalam (Mission Part 2), Chapter 2*: https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-2/guadosalam-mission-part — the three fights and their strategies; **its Act III HP figures are wrong (G8)**.
10. GamerGuides — *Mt Gagazet Floating Ruins, Chapter 1 — Boss: Leblanc, Logos and Ormi*: https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-1/mt-gagazet-floating-ruins/boss-leblanc-logos-and-ormi — the Candidate A fight, rewards, Darkness Dance strategy.

**Story, character, location, music**
11. Final Fantasy Wiki — *Leblanc*: https://finalfantasy.fandom.com/wiki/Leblanc — appearance, personality, story, the Lady Luck card-suit rhyme, both musical themes, voice cast.
12. Final Fantasy Wiki — *Logos (Final Fantasy X-2)*: https://finalfantasy.fandom.com/wiki/Logos_(Final_Fantasy_X-2) — appearance, age 26 (*Ultimania*), story, the Russian Roulette Spiran-script rings.
13. Final Fantasy Wiki — *Ormi*: https://finalfantasy.fandom.com/wiki/Ormi — appearance, age 22 (*Ultimania*), story, the seven-boss-appearances record.
14. Final Fantasy Wiki — *Leblanc Syndicate*: https://finalfantasy.fandom.com/wiki/Leblanc_Syndicate — goon tiers, uniform colours, the Al Bhed door guards, pink-and-hearts identity.
15. Final Fantasy Wiki — *Chateau Leblanc*: https://finalfantasy.fandom.com/wiki/Chateau_Leblanc — the Guado Mansion history, Leblanc in Seymour's room, the underground maze, the Strip Search / Faking and Entering mission text and rewards, Crimson Sphere 10, the massage minigame's scoring.
16. Final Fantasy Wiki — *Floating Ruins*: https://finalfantasy.fandom.com/wiki/Floating_Ruins — Candidate A's location, mission, reward, treasures, "Gagazet Mountain".
17. Final Fantasy Wiki — *Guadosalam*: https://finalfantasy.fandom.com/wiki/Guadosalam — the root-cavern architecture the Chateau sits inside.
18. Final Fantasy Wiki — *Final Fantasy X-2: Original Soundtrack*: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2:_Original_Soundtrack — the three cues, their Japanese titles and translations, runtimes, and the note that the battle theme plays in **every** Syndicate boss battle except the first.

**Project documents used as format and formula references**
19. `D:/Final Fantasy/research/ffx2-combat-core.md` — §1.2–1.4 (ATB / CTIM / RECTIM tick model), §1.7 (Chain), §2.1 (20-step damage flowchart), §2.6 (decoded hit check), §2.6a (status-infliction formulas), §2.8 (status table and durations), §3.4 (Songstress), §3.6 (Black Mage and the corrected constant ladder).
20. `D:/Final Fantasy/research/ffx2-bahamut.md` — §1.5 (Break stack mechanics), §1.6 (steal-rate scale derivation), §4.2 (Lv 20–28 dressphere stat tables), §4.3–4.7 (Chapter 2 party model, adapted).
21. `D:/Final Fantasy/research/writing-bible.md` §1.14–1.16 — YRP voice guides, used unchanged.
22. `D:/Final Fantasy/research/visual-bible.md` §2.4 — location-sheet template referenced for §10.2.

**Access note.** `finalfantasy.fandom.com` returned HTTP 402 to the WebFetch tool throughout this pass. All wiki content above was retrieved as **raw wikitext via the MediaWiki API** (`action=parse&prop=wikitext`) using a standard browser user-agent, which is the same underlying data the rendered pages display and is in fact *more* reliable — the infobox templates expose per-variant fields that the rendered tables collapse. `strategywiki.org` returned HTTP 403 and was not used.

---

## 16. Verification log

| Claim | Method | Result |
|---|---|---|
| Which fights contain all three | Cross-read of three enemy pages' location/chapter fields plus both location pages' enemy lists | **Two** — Floating Ruins (Ch. 1) and Chateau Last Room (Ch. 2). Confirmed by four independent listings. |
| Act III HP: 1,380 / 989 / 1,344 | Wiki template vs zero_six database | Exact agreement on all three, plus EXP, gil and drops. GamerGuides disagrees and is wrong (G8). |
| Damage-band inversion (base 24 / 50 / 106 / 200 / 300) | Solved `band = base × rand(240..271)/256` for five published bands | All five invert to round integers. Method validated. |
| Chain formula `1.40 + 0.05n` | Reconstructed Huggles (3 hits, base 300) and No Love Lost part 1 (8 hits, base 24) | **Corrected 2026-09-19. One exact case, not two.** Huggles → 1,110~1,254, exact. No Love Lost → 266~302 against a published 267~304, and no single base can emit 267~304 at all under step 7. Consistent with ×0.05, **does not close** `ffx2-combat-core.md` §1.7 (which is already `[verified: 2 sources]` independently). |
| Status resistance numbers are *percent resistance* | Logos' Djose entry `sleep = 30` against the wiki's own prose about Sleepy Shuffle | Confirmed. `landChance = 100 − resist` (subject to the level terms). |
| Accuracy cannot be 0 | Fed 0 into `ffx2-combat-core.md` §2.6's decoded hit check | 0 % hit rate for all three — **but the published values for comparable enemies (Dr. Goon 3, Boris 3/4) give the same result, so the finding indicts the model, not the value.** Recorded as G1 rather than patched. |
| ~~Accuracy = 110 reproduces the canonical strategy~~ | ~~Computed Darkness-state hit rates~~ | **Struck 2026-09-19 — circular.** 110 was chosen to make Darkness suppressive, then reported as confirmed by being suppressive. The Darkness-Dance strategy is independently sourced and needs no arithmetic from us. |
| The `accuracy` field is absent from the sources | Re-queried the same wiki template via the MediaWiki API for neighbouring enemies | **False as previously stated.** The field exists in the template and is populated elsewhere (Dr. Goon **3**, Boris **3/4**, Battlesnake **98**); it is merely blank on the six Syndicate records. |
| Leblanc's Flash Bomb vs Flash Grenade | Read the enemy-abilities master list by enemy column, not by effect text | **No conflict.** Two separate rows, two different enemies; Leblanc is Flash Bomb in all three sources. G11 withdrawn. |
| Battle-theme usage note | Re-read the OST track list line by line | **Misattributed.** The Via Infinito / Bevelle-labyrinth note belongs to *"Disquiet"*, two rows away — which also plays when Leblanc explains Vegnagun, i.e. beat 14. Corrected and the new cue added to §10.3. |
| Huggles is accuracy-checked | Re-read both sources for any statement about hit checks | **Neither source says so.** Reclassified as authored behaviour; the supporting randomiser argument was void (step 7 applies to all damage types). |
| Leblanc's Fira constant | Used the published Lv.2 tier `C = 13` rather than estimating | 113–212 damage on a Lv 22 party — consistent with every guide calling this fight easy. No estimate required. |
| "Kill Logos first" is derivable, not just received wisdom | Read the No Love Lost trigger condition and Ormi's last-enemy branch | Both confirmed from the AI scripts, independently of any guide's advice — and the scripts additionally show that killing Ormi *last* arms Huggles, which no guide states. |
| Oversoul | Checked all six records for an Oversoul flag | None present. Consistent with the story-boss rule established for Bahamut. |
| Music assignment | OST track page's "plays during a Leblanc Syndicate boss battle except in Luca at new game" | The Act III battle theme is settled: *"Let Me Blow You a Kiss!"* |
| Party model differences vs the Bahamut chapter | Compared acquisition chapters for Dark Knight and Healing Light | Both are **later in Chapter 2** than this fight. The Bahamut chapter's loadout must not be copied. |

---

## 17. Fact-check log — external pass, 2026-09-19

An external fact-checker challenged five claims in this document. **All five were verified independently by re-querying the primary sources, and all five were upheld against this document.** Every correction below has been applied inline above; this section is the permanent record of what was wrong and why.

The re-verification method was the same one §15's access note describes: raw wikitext via the MediaWiki API (`action=parse&prop=wikitext&format=json`) with a browser user-agent, because `finalfantasy.fandom.com` still returns HTTP 402 to the fetch tool. The arithmetic was recomputed from scratch rather than re-read.

### 17.1 The five corrections

| # | What this document claimed | What is actually true | Where it is fixed | Tag change |
|---|---|---|---|---|
| **FC1** | §4.1 and §16: the Chain formula is confirmed because **two** abilities were "reconstructed to the digit" — Huggles 1,110~1,254 **and** No Love Lost 267~304. | **One** is exact. Huggles is exact. No Love Lost is not, and *cannot* be: the published band is not emittable by any single base under step 7. | §4.1 ★ box, §4.5 table row, §14 X4, §16 | `[verified: 2 sources]` → **`[derived, one exact case]`** |
| **FC2** | §3.1, §5.1, §13 G1: Accuracy is **"absent from every source — must be assigned"**; resolved by setting `SYNDICATE_ACCURACY = 110`, "the midpoint of the party's own band", validated by a Darkness hit-rate table. | The `accuracy` field **exists in the very template this document used** and is populated for comparable enemies. It is blank only for these six records. Published values run **3 to 98**. The party-band inference is unsupported and the "validation" was circular. | §5.1 (rewritten), §3.1 row, §13 G1 (rewritten), §14 X1 | `[estimate — reasoned]` → **`[gap]`**, with the constant relabelled as unsourced engine tuning |
| **FC3** | §13 G11: Flash Bomb vs Flash Grenade is a naming conflict; "treat as one ability with two labels." | **No conflict exists.** They are two separate master-list rows for two different enemies. Leblanc is Flash Bomb in all three sources. Merging them would have collapsed two distinct records. | §4.4 (new note), §13 G11 (withdrawn) | conflict → **withdrawn, no gap** |
| **FC4** | §10.3: the battle theme "is also used in the Via Infinito and the Bevelle Underground labyrinth." | That note belongs to a **different track**, *"Disquiet"*, two rows away on the same page — which also plays **when Leblanc explains Vegnagun in her chateau**, i.e. this chapter's beat 14. A transcription slip that also cost the document its best cue. | §10.3 (row corrected; **new Disquiet row added**) | corrected; new `[verified: 2 sources]` row gained |
| **FC5** | §4.2: Huggles is "Protect-immune and Sentinel-immune but still accuracy-checked like a physical," supported by the chain arithmetic having "used the physical randomiser." | Unreducibility is sourced. **Accuracy-checking is stated by no source.** The supporting argument is void: step 7's randomiser applies to *all* damage except menu White Magic, so reproducing a band proves nothing about typing. | §4.2 (box rewritten), §13 G10 (re-scoped) | source-reconciled reading → **authored behaviour, labelled in code** |

### 17.2 Sources used for the re-verification

| Claim re-checked | Source |
|---|---|
| Step-7 randomiser applies to all damage except menu White Magic | `ffx2-combat-core.md` §2.1 step 7 |
| Chain increment already `[verified: 2 sources]` independently of this doc | `ffx2-combat-core.md` §1.7 |
| No Love Lost published as 22~25 per hit, "maximum total of 267~304", damage constant 5 | https://finalfantasy.fandom.com/wiki/Leblanc_(boss) — Battle §, Third encounter |
| Huggles published as 3 hits totalling 1,110~1,254 "special damage that cannot be reduced by any means" | https://finalfantasy.fandom.com/wiki/Ormi_(boss) — Battle § |
| `accuracy = 3` | https://finalfantasy.fandom.com/wiki/Dr._Goon |
| `accuracy = 3` and `4` | https://finalfantasy.fandom.com/wiki/Boris_(Final_Fantasy_X-2) |
| `accuracy = 98` | https://finalfantasy.fandom.com/wiki/Battlesnake |
| `accuracy` parameter absent from all six Syndicate template instances (confirmed by direct wikitext grep; `evasion` *is* present, so the omission is specific) | Leblanc (boss), Logos (boss), Ormi (boss) |
| Flash Bomb → Leblanc (Final); Flash Grenade → Logos (Djose Highroad); separate adjacent rows | https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_enemy_abilities |
| *"Let Me Blow You a Kiss."* note = Syndicate boss battles + Goon/Stalwart fiend tales; *"Disquiet"* note = Via Infinito, Bevelle Underground labyrinth, Yuna's nightmare, **Leblanc explaining Vegnagun in her chateau** | https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2:_Original_Soundtrack |
| Enemy-ability naming corroboration | zero_six, *FFX-2 Enemy Database*: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/28832 |

### 17.3 The pattern, stated plainly so the next pass avoids it

Four of the five errors share one shape: **a reconstruction that mostly worked was reported as a proof.** The chain arithmetic got one case right and was written up as two. The Accuracy estimate produced a plausible fight and was written up as derived. The Huggles typing produced sensible behaviour and was written up as source-reconciled. The one error that does *not* fit that shape — the OST misattribution — is a plain transcription slip, and it is the one that cost real content rather than false confidence.

AGENTS.md rule 6 forbids inventing game data. It is worth naming the failure mode that slipped past it here: **not invented numbers, but invented certainty** — authored choices wearing a provenance tag. Two of the four also propagated outward as instructions to edit *other* documents (§14 X1 and X4), which is how a local overclaim becomes a project-wide one. Both have been withdrawn.

Where this pass could not reach a fact, it now says so. **G1 in particular got larger, not smaller:** the honest reading of the published enemy Accuracy values is that the project's decoded enemy hit model does not yet work, and that is a better thing to know than a tidy 110.

## 18. Research sweep corrections (2026-09-23)

Rows are left as written above; these notes override them (same precedent as §13 row 26 of `ffx2-vegnagun-shuyin.md`).

- **C18.1, the Grenade is not "base 300".** §4.6 (line 362), §6.2 (the `Grenade item (base 300, all enemies) | 281–317` row) and §7.6 (`base 300 to all enemies`) are **wrong**. No source prints 300 for the Grenade *item*. What the sources print: pbirdman's calculator power **4** → 200 (`ffx2-combat-core.md` §2.9.3); Split Infinity's item entry `Grenade - G12025 | GRP | ... one hit for 187-212 (CRIT!) phd VS all members in target party` (GameFAQs faqs/25872, §12); SinirothX's enemy-use line `Grenade- damage all characters by 187 to 211 HP (type: randomized constant)` (faqs/31807, the Rikku boss entry); FF Wiki *Final Fantasy X-2 enemy abilities* (rev 3998493): "Inflicts 187~211 damage to the party". 187–211 is exactly 200 × rand(240..271)/256. The 281–317 band is the Lady Luck reel **Primo Grenade** (Split Infinity G14531: "one hit for 281-317 physical damage VS all enemies") and the Lv 2 elemental items (Bomb Core etc.), and 300 is also Huggles' per-hit base (§4.1). **Grenade = base 200, 187–211 per enemy before chain.** `[verified: 3 sources for the band]`. See `ffx2-combat-core.md` §8 (sweep note) for the crit question.
- **C18.2, the fan colour is single-source.** §10.1's "She carries a **red-and-silver fan** in her right hand" paraphrases one uncited sentence of FF Wiki *Leblanc* (rev 4043712, Appearance): "She wields a red-and-silver fan in her right hand." The `[verified: 2 sources]` after the next paragraph belongs to the Lady Luck note, not to this line. The Villains Wiki (*Leblanc (Final Fantasy)*, rev 7018861) and Heroes Wiki (*Leblanc*, rev 3997823) carry the identical sentence verbatim, so they are copies, not a second source. No source read says which part of the fan is red and which is silver, or what the open leaf shows. Tag: `[single source]`.
