# FINAL FANTASY X / X-2 — Yojimbo: which encounter is the chapter, and the full data for each candidate

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-09-24: "I'll pick your recommendations plus Yojimbo. Let's add Yojimbo first please. He goes in next build!"
**Research date:** 2026-09-24
**Recommendation (§1):** **Candidate A — Lady Ginnem's Yojimbo, Cavern of the Stolen Fayth (FFX).** It is the only Yojimbo battle that is a story scene, and its data is decompiled and cross-checked.
**Internal ids (decompile, HD table):** Yojimbo `m288` (bestiary #141), Daigoro = record `m266` "Koma Inu", Lady Ginnem = record `m249` "Mira"; Dark Yojimbo `m340` (bestiary #240); Possessed Yojimbo `m169`

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

The tags are the same as in `research/ffx-evrae-airship.md` §0.1 and `research/ffx-seymour-anima-macalania.md`.

| Tag | Meaning |
|---|---|
| `[decompiled]` | Read byte by byte from the game's `ffx_mon_data(_hd)` / `ffx_monmagic1` / `ffx_monmagic2` / `ffx_command` tables in the Grayfox96 FFX-RNG-tracker data files, pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680` (same commit as the Evrae file), and parsed with that repository's own field offsets. |
| `[verified: N sources]` | N independent sources agree. |
| `[single source]` | Only one source says it. |
| `[derived]` | Computed by me from `[decompiled]` constants with the damage chain in `research/ffx-combat-core.md` §2. |
| `[estimate]` | My own design judgement, not a measured fact. |

### 0.2 What I did

1. Read `research/ffx-evrae-airship.md` (structure), `research/ffx-combat-core.md` §2 (damage chain) and §6.6 (Yojimbo pay logic), `research/ffx-seymour-flux.md` §7 (the party preset at Mt. Gagazet, which is the next stop after the Cavern), and the Yojimbo lines in `research/ffx-bfa-yu-yevon.md` and `research/visual-bible.md`.
2. Fetched the Grayfox96 data files **into memory only** (nothing was saved to disk, per AGENTS.md rule 11). Parsed every monster whose name decodes to "Yojimbo", the Daigoro and summoner records in the same formations, and every action row those monsters use. Sanity check: the parser reproduces Evrae `m119` exactly as `ffx-evrae-airship.md` §1 prints it (HP 32,000, Def 0, Zanmato byte 3, and so on).
3. **Byte-diffed the PS2 and HD monster tables.** `m288` (Cavern Yojimbo), `m266` (Daigoro), `m169` (Possessed Yojimbo) are **byte-identical** in both. `m340` holds a placeholder in the PS2 (NTSC) table and the real Dark Yojimbo only in the HD table, which is consistent with Dark Yojimbo being an International/PAL/HD addition.
4. Read the Final Fantasy Wiki through `api.php?action=parse&prop=wikitext` with a browser user agent (the plain page returns HTTP 402). Page titles and revision ids are listed in Sources.
5. Cross-checked the results against GameFAQs (bover_87's *FFX Remaster Walkthrough* v1.3), Jegged, EIP Gaming, FFExodus (FFX-2), and Auronlu's FFX game script. Then ran the damage chain on the decompiled numbers (§3.3).

### 0.3 Game case (AGENTS.md rule 14)

| Candidate | Game case | Why |
|---|---|---|
| A — Cavern of the Stolen Fayth, Lady Ginnem's Yojimbo | **FFX only** | CTB, aeons, a boss Overdrive gauge, Doom via Ronso Rage. FFX-2 has no equivalents. |
| B — Dark Yojimbo | **FFX only** (International / PAL / HD only) | Dark Aeon postgame content. Not in NTSC FFX. |
| C — Yojimbo in FFX-2 ("Tourist Trap" mission) | **FFX-2 only** | ATB, dresspheres, an action-counter AI. Its Zanmato is a different ability (HP and MP drop to 1). |
| D1 — Belgemine's Yojimbo, Remiem Temple | **FFX only** | An aeon-versus-aeon training duel. |
| D2 — Possessed Yojimbo, inside Sin | **FFX only** | Already covered by `research/ffx-bfa-yu-yevon.md` §5. |

None of these facts transfers across games. FFX-2's Zanmato (party drops to 1 HP / 1 MP) is **not** FFX's Zanmato (9,999 fixed damage). FFX-2's action counter is **not** FFX's Overdrive-gauge script. The Yojimbo art model is shared, but the painted billboard still needs its own read for each game.

---

## 1. The answer: which Yojimbo encounter is the chapter

### 1.1 The candidates at a glance

| | A. Lady Ginnem's Yojimbo (FFX) | B. Dark Yojimbo (FFX Int/HD) | C. Yojimbo (FFX-2) | D1. Remiem (FFX) | D2. Possessed (FFX) |
|---|---|---|---|---|---|
| Real standard boss fight? | **Yes**: party versus Yojimbo, cannot flee | **Yes**: five fights in a row | **Yes**: optional mission boss | Aeons only; losing is not a Game Over | One link of the final-boss gauntlet; exists only if Yuna owns Yojimbo |
| Story weight | **High**: Lulu's dead summoner, her last duty as that summoner's guardian | None (an anonymous summoner) | Medium: Shuyin's despair possesses the fayth; tourist rescue | Low (training) | Part of Yu Yevon |
| When | First visit to the Calm Lands, after Bevelle and **before Mt. Gagazet / Seymour Flux** | Postgame (airship), any time after the Cavern | FFX-2 Chapter 3 or Chapter 5 | After Remiem opens | Final dungeon |
| HP | **33,000** | **1,600,000** ×5 fights | **22,000** | 32,000 | = Yuna's Yojimbo |
| Data quality | **Best**: full decompiled stat block, action rows and formation. AI thresholds in 3 sources, gauge rates in 1 | Strong: decompiled + wiki + EIP | Good on stats (2 sources for the headline numbers). AI script from 1 source | Wiki only. Record **not located** in the decompile | Decompiled + wiki. Already documented |
| Fits our roster | FFX chapters 1 to 3 already use CTB, aeons, Doom and Lancet (`src/battle/ffx/`) | Needs a maxed endgame preset (255 stats, Break HP/Damage Limit, Ribbon) | Fits the X-2 ATB chapters. **Overlaps the planned FFX-2 fallen-aeons chapter** | Would need an aeon-only party mode | Belongs to Yu Yevon |

### 1.2 Recommendation: Candidate A

**Build Lady Ginnem's Yojimbo in the Cavern of the Stolen Fayth as the Yojimbo chapter (FFX).** `[estimate]` for the recommendation; the reasons below are all sourced.

1. **It is the Yojimbo fight the story contains.** Lulu recognises her first summoner, Lady Ginnem, as an unsent. Ginnem breaks Yuna's sending and summons Yojimbo, and Lulu takes it on as her last duty as Ginnem's guardian (§6). "Lulu's Theme" plays **only** here in the whole game `[verified: 2 sources — wiki Lulu page + wiki FFX OST page; the GameFAQs guide also singles out the music]`. Every other candidate is a grind, a duel or one link in a gauntlet.
2. **Its data is the strongest.** It has a full decompiled stat block, the formation (`mira` + `yojimbo` + `koma_inu`), every action row, and no PS2/HD difference. The AI thresholds agree across wiki, GameFAQs and EIP.
3. **Its mechanic is simple and memorable:** an Overdrive gauge that fills a little each time Yojimbo attacks or is targeted, with Zanmato for 9,999 to every party member when it is full (§4). The counterplay is sourced: kill him first, Doom him (Kimahri learns Doom by Lancet from the Ghosts **in the same cavern**), or put an aeon in front of Zanmato.
4. **It needs one new system.** The FFX engine already has CTB, aeons, Doom, Lancet and Ronso Rage. The only new piece is an **enemy-side Overdrive gauge with a visible fill** (§10).
5. **It sits between our planned chapters.** It comes right after the Highbridge of Bevelle (Seymour Natus) and right before Mt. Gagazet (Seymour Flux, already built). The party preset can reuse `ffx-seymour-flux.md` §7.

**Not the chapter:** B is a 1.6-million-HP farming boss for maxed parties, with no story. C is real and well sourced, but it is one of the Shuyin-possessed aeons, so it belongs in the planned **FFX-2 fallen-aeons chapter** (the orchestrator should decide whether that chapter absorbs it). D1 is a training duel. D2 already belongs to Yu Yevon.

**The payment mechanic is not part of fight A.** Paying Yojimbo, the hiring question and the haggle all come **after** the battle, in the Chamber of the Fayth, when Yuna hires him as her own aeon (§7). Two ways to handle it:
- A non-combat **epilogue beat** (the haggle).
- Out of scope.

Either is an idea that needs Bailey's yes (AGENTS.md rule 10). Nothing about it is built here.

---

## 2. Candidate A — stat block: Yojimbo (`m288`, bestiary #141), Cavern of the Stolen Fayth

### 2.1 Core stats

| Field | Value | Confidence |
|---|---:|---|
| HP | **33,000** | `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]` (Jegged says "approximately 30,000") |
| MP | 2,000 | `[decompiled]` + wiki |
| Overkill threshold | **4,060** | `[decompiled]` + wiki + GameFAQs |
| Strength | **34** | `[decompiled]` + wiki |
| **Defense** | **80** | `[decompiled]` + wiki `[verified: 2 sources]` |
| Magic | 35 | `[decompiled]` + wiki |
| **Magic Defense** | **0** (the formula clamps it to 1; the wiki prints 1) | `[decompiled]` + wiki |
| Agility | **32** | `[decompiled]` + wiki |
| Luck | 15 | `[decompiled]` + wiki |
| Evasion | 0 | `[decompiled]` + wiki |
| Accuracy | 0 (wiki prints 1) | `[decompiled]` |
| AP / Overkill AP / Gil | **0 / 0 / 0** | `[decompiled]` + wiki + GameFAQs |
| Armored | No | `[decompiled]` |
| Doom count | **5** | `[decompiled]` byte 119 + wiki + GameFAQs + EIP `[verified: 4 sources]` |
| Zanmato level | byte 402 = **0**, so **level 1** under the 0-based rule of `ffx-seymour-anima-macalania.md` C-6 | `[decompiled]`. Moot, because Yuna does not own Yojimbo during this fight. The wiki's "level 3" list entry matches the *possessed* record `m169` (byte 2 → level 3). |
| Poison tick | 25 % (but Poison is immune) | `[decompiled]` |

> **Defense 80, Magic Defense 0: this is the design fact of the fight.** Mitigation is 381 against Def 80 and 725 against MDef 1 (combat-core §2.3). **A physical hit lands at about 52 % of what the same hit does to Evrae; a spell lands at full value** (§3.3). The HUD should teach it, and the "Scan" route is closed (see immunities). `[derived]`

### 2.2 Elements

Neutral to Fire, Ice, Thunder, Water and Holy. `[decompiled]`. The wiki lists no affinities.

### 2.3 Status resistances (byte: 0 = landable, 255 = immune)

| Status | Value | Note |
|---|---:|---|
| **Doom** | **0** → **landable**, count **5** | **The sourced shortcut.** Kimahri's Ronso Rage "Doom" (learned by Lancet on a Ghost in this cavern) or a **Candle of Life** kills Yojimbo five of his turns later `[verified: 4 sources — decompiled, wiki, GameFAQs, EIP]`. The wiki adds that this works only for this encounter. |
| Threaten | 0 (byte says landable) | Wiki says **Immune**. Same conflict shape as Evrae C-4. **Do not implement until checked** (§9 Y-3). |
| Shell / Protect / Reflect / Nul× / Regen / Haste | 0 | Landable on him. Haste on Yojimbo is the player's mistake to make. |
| Death, Zombie, Petrify, Poison, all four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Dark, Slow, Scan, all Distillers, Eject, Auto-Life | **255** | Immune `[decompiled]` + wiki immunity list `[verified: 2 sources]` |
| Flags | `immune_to_percentage_damage` (Demi / Gravity do nothing, GameFAQs "Gravity (Immune)"), `immune_to_sensor`, `immune_to_scan`, `immune_to_delay`, `immune_to_slice`, `immune_to_bribe` | `[decompiled]` + wiki `[verified: 2 sources]`. **No Scan text exists.** |

### 2.4 Rewards

None. Drop chance 0, steal chance 0, equipment chance 0, 0 AP, 0 gil `[decompiled]` + GameFAQs table `[verified: 2 sources]`. The real rewards are the **Chamber of the Fayth** access (hiring Yojimbo) and the chests in the two side rooms reached by the teleporter afterwards: **Flexible Arm** (Rikku, 4 empty slots), **MP Sphere**, **X-Potion ×2** `[verified: 3 sources — wiki, Jegged, GameFAQs]`.

### 2.5 The other two combatants in the formation

The decompiled formation `yojimbo` is **`[mira, yojimbo, koma_inu]`**, forced condition *normal* (no ambush and no preemptive), with no forced party `[decompiled: formations.json]`.

| Slot | Record | What it is | Data |
|---|---|---|---|
| M1 | `m249` "Mira" | **Lady Ginnem**, the unsent summoner. The wiki says she is internally an enemy like other summoners. The internal record name is "Mira", a separate record from Belgemine (`m250`). | HP **10**, STR 7, ACC 10, EVA 2, Luck 15, Sleep/Silence/Dark 20, Doom count 3 `[decompiled]` + wiki "Ginnem (boss)" `[verified: 2 sources]`. Whether she can be targeted is **unknown** (§9 Y-5). |
| M2 | `m288` | Yojimbo | §2.1 |
| M3 | `m266` "Koma Inu" | **Daigoro.** Yojimbo's "Daigoro" row (§3.1) is an order to slot M3. The dog record then acts with its own attack. | HP 1, **STR 25**, Luck 15, Sleep/Silence/Dark 20, Doom 5; immune to percentage damage, delay, sensor and scan `[decompiled]`. Only action: **Daigoro** (`4:177`, §3.1). |

---

## 3. Candidate A — exact action data

### 3.1 Action rows (`monster_actions.json` m288 / m266, parsed from `ffx_monmagic1`, file id 4)

| Row | Name | User | Formula | DmgCon | Hits | Target | Type | Crit | Notes | Confidence |
|---|---|---|---|---:|---:|---|---|---|---|---|
| 4:177 | **Daigoro** | Koma Inu (STR 25) | Strength | **20** | 1 | one random character | Physical | **yes, bonus crit +20** | shatter 10 % | `[decompiled]` + wiki enemy-ability table ("20", crit, "10 % PDR") `[verified: 2 sources]` |
| 4:130 | **Kozuka** | Yojimbo (STR 34) | Strength | **16** | 1 | one random character | Physical | no | no status | `[decompiled]` + wiki ("16") `[verified: 2 sources]` |
| 4:131 | **Wakizashi** | Yojimbo | Strength | **28** | 1 | **one random character** | Physical | no | | `[decompiled]` + wiki ("28", "One ally") `[verified: 2 sources]`. GameFAQs calls it party-wide: **conflict Y-2**, the decompile wins |
| 4:133 | **Zanmato** | Yojimbo | **Fixed (no variance)** | **200** | 1 | **whole party** | Other (special) | no | 200 × 50 = 10,000, capped at **9,999** (no Break Damage Limit flag) | `[decompiled]` + wiki ("Inflicts 10,000 damage"; boss page "9,999 to all") + GameFAQs + EIP `[verified: 4 sources]` |
| 4:134 | Daigoro (order) | Yojimbo | No damage | — | — | slot M3 | — | — | makes the dog act | `[decompiled]` |
| 4:144 | Summon | Yojimbo | No damage | — | — | slot M1 | — | — | entrance / tied to Ginnem | `[decompiled]` |
| 4:120 | Die | Yojimbo | — | — | — | self | — | — | death script | `[decompiled]` |

**Unexplained row:** Yojimbo's menu-action list also contains **4:132 "Wakizashi"** (a **Magic**-formula version, DmgCon 24, single target). `monster_actions.json` does not assign it to `m288` and no source mentions it. **Treat it as unused** (§9 Y-4).

### 3.2 What never happens here

No counterattacks are listed. There is no Delay, no status infliction and no multi-target Wakizashi. **Zanmato is not instant death in this fight:** the enemy row is fixed damage. The Death-at-255 Zanmato is the **player's** Yojimbo (`3:226`, combat-core §6.6). `[decompiled]`

### 3.3 Damage tables `[derived]` (integer chain from combat-core §2, mid roll `damageRNG = 16`, low/high rolls in brackets, no Protect or Cheer)

**Incoming, per hit, by party Defense:**

| Party DEF | Daigoro (STR 25, DC 20) | Kozuka (STR 34, DC 16) | Wakizashi (STR 34, DC 28) |
|---:|---:|---:|---:|
| 10 | 602 (564–637) | 1,171 (1,097–1,239) | 2,049 (1,920–2,169) |
| 15 | 581 (544–615) | 1,130 (1,059–1,196) | 1,977 (1,853–2,092) |
| 20 | 560 (525–592) | 1,089 (1,020–1,152) | 1,905 (1,785–2,016) |
| 25 | 540 (506–571) | 1,049 (983–1,110) | 1,835 (1,720–1,942) |
| 30 | 518 (485–548) | 1,009 (945–1,068) | 1,765 (1,654–1,868) |

A Daigoro critical hit doubles its damage. **Zanmato is 9,999 to everyone**, which is fatal to every party member at the preset's HP (1,000 to 3,600, `ffx-seymour-flux.md` §7.3). It is survivable only **if an aeon is on the field** (the aeon takes it, and at 4,000 to 7,000 HP it dies) or if the fight ends first.

**Outgoing, a plain Attack (DC 16) into Def 80, mid roll** (the same attacker against Def 1 for comparison):

| Attacker STR | vs Yojimbo (Def 80) | vs Def 1 |
|---:|---:|---:|
| 20 | 146 | 278 |
| 25 | 270 | 514 |
| 30 | 455 | 867 |
| 35 | 714 | 1,359 |
| 40 | 1,059 | 2,016 |

**Outgoing magic into MDef 0 → 1:** a -ra tier spell (Fira, DC 24) does 1,036 / 1,358 / 1,728 / 2,151 at Magic 30 / 35 / 40 / 45. **Lulu is the best attacker in her own fight.** That is a coincidence of the numbers, but a nice one for this chapter. `[derived]`

Piercing (Auron's and Kimahri's default weapons) does **not** remove Defense 80; it only ignores *Armored*, and Yojimbo is not Armored. Armor Break is immune. Physical damage stays at about 52 %. `[decompiled]` + combat-core §2.3

---

## 4. Candidate A — AI script

### 4.1 The Overdrive-gauge script

| Rule | Value | Confidence |
|---|---|---|
| Gauge gain when Yojimbo **is targeted** | **+3 %** | wiki boss page `[single source]` |
| Gauge gain when Yojimbo **attacks** | **+2 %** | wiki boss page `[single source]` |
| Gauge below 25 % | **Daigoro only** | wiki + GameFAQs + EIP `[verified: 3 sources]` |
| 25 % and above | adds **Kozuka** | `[verified: 3 sources]` |
| 50 % and above | adds **Wakizashi** | `[verified: 3 sources]` |
| 80 % and above | Kozuka and Wakizashi become "slightly" more likely | wiki + GameFAQs `[verified: 2 sources]`. **The exact weights are unsourced** (§9 Y-1) |
| 100 % | **Zanmato** on his next turn, 9,999 to the whole party | wiki + GameFAQs + EIP `[verified: 3 sources]` |
| Starting gauge | **not stated by any source** | §9 Y-1 |

**Reading the rates.** Targeting is 3 % and his own action is 2 %. A party that hits him three times between his turns adds 9 % + 2 % = 11 % per round `[derived]`. So **the faster the party attacks him, the sooner Zanmato arrives.** Magic, Doom and a single big hit are rewarded over many small hits. That is the design of the fight and it needs no invention. How targeting is counted (per action or per hit, and whether multi-target actions count) is **not sourced** (§9 Y-1).

### 4.2 Reference pseudocode (sourced rules only; the bracketed weights are placeholders to be replaced when Y-1 is resolved)

```
onTargetedByParty(action):   gauge = min(100, gauge + 3)      // per targeting action [single source]
onYojimboTurn():
  if gauge >= 100: use Zanmato (party, fixed 9,999); gauge = 0 [reset value: unsourced]
  else:
    pool = [Daigoro]
    if gauge >= 25: pool += Kozuka
    if gauge >= 50: pool += Wakizashi
    weights = gauge >= 80 ? [UNSOURCED, raised K/W] : [UNSOURCED]
    act(pick(pool, weights)); gauge = min(100, gauge + 2)
  Daigoro = order slot M3 (Koma Inu) to use 4:177 on a random character
```

### 4.3 Counters and quirks

- **No counters** in the action list `[decompiled]`.
- **Cannot flee** (wiki infobox info line) `[single source]`.
- **This is not a summoner duel.** The whole party fights and Yuna may call her own aeons `[verified: 3 sources — GameFAQs, Jegged ("use Yuna's Aeons"), wiki (aeon Shield mitigates Zanmato)]`.

---

## 5. Candidate A — the party and builds

### 5.1 Story position

The Cavern is reachable on the **first** walk through the Calm Lands (Gorge Bottom, under the bridge where Defender X is fought). That is after the Bevelle escape and Macalania Woods, and before Mt. Gagazet `[verified: 3 sources — wiki, Jegged, GameFAQs ("assumes you're doing the dungeon as soon as it becomes available")]`. Jegged recommends doing it later. For a faithful chapter, **the first-visit timing is the story-correct one** (Lulu's scene plays either way).

### 5.2 Party

- **All seven** can fight: Tidus, Yuna, Auron, Kimahri, Wakka, Lulu, Rikku.
- **Aeons:** Valefor, Ifrit, Ixion, Shiva, Bahamut. Anima (Baaj, needs the airship) and the Magus Sisters are not yet owned, and Yojimbo obviously is not.
- Reuse the **Mt. Gagazet preset in `research/ffx-seymour-flux.md` §7.3 to §7.9** as the upper bound: it is the next boss. `[verified: 2 sources for the aeon list, as in that file]`; stat ranges `[estimate]` as there.
- **Lulu should be in the opening line-up.** In the script she is the one who takes this fight on. The game does **not** force it: the formation has no forced party `[decompiled]`. So "Lulu leads" is a presentation choice, not a rule `[estimate]`.

### 5.3 Sourced strategies the chapter must support

| # | Strategy | Needs | Source |
|---|---|---|---|
| 1 | **Doom him**: Kimahri's Ronso Rage "Doom" (learned via Lancet on a **Ghost** in this cavern) or a **Candle of Life**; he dies 5 turns later | Doom on enemies, Lancet learning from Ghost, Candle of Life item | wiki + GameFAQs + EIP + Jegged (Ghost → Doom) `[verified: 4 sources]` |
| 2 | **Race the gauge**: strongest attackers, keep HP up, win before Zanmato | the gauge rules in §4.1 | GameFAQs + EIP `[verified: 2 sources]` |
| 3 | **Let an aeon take Zanmato** (Shield reduces it further) | aeon swap-in; aeons absorb party-wide hits | wiki + GameFAQs `[verified: 2 sources]` |
| 4 | **Magic over physical** (MDef 0 against Def 80) | the existing formulas | `[derived]` §3.3 |

---

## 6. Candidate A — scene, beats, appearance and music

### 6.1 Arena

- The last chamber of the Cavern of the Stolen Fayth, a large open cave room with a **teleport pad in the middle** (dormant until after the battle), which leads to the Chamber of the Fayth and two side rooms `[verified: 2 sources — Jegged, GameFAQs]`.
- The cave's location theme is "Calm Before the Storm" `[single source: wiki]`.
- Painted-set details (light, colour) are not sourced. Author them `[estimate]` and show options first (AGENTS.md rule 9).

### 6.2 Beat sheet (paraphrased from Auronlu's FFX script, Chapter XI)

1. **Gorge Bottom.** Lulu says the fayth and fiends are inside. Wakka realises where they are. Lulu tells Tidus that the summoner she guarded on her first pilgrimage died here, then hangs back a moment before following.
2. **Partway in.** Lulu says the fayth was stolen from a temple long ago. Auron explains why: no fayth, no training, no Final Aeon. Rikku and Wakka side with the thief, since the summoner would live.
3. **The far chamber.** Pyreflies gather into a woman. Kimahri names her an unsent. **Lulu recognises Lady Ginnem** and apologises: she was too young.
4. Yuna steps forward to send her. **Ginnem breaks the sending with a shock wave.** Lulu decides nothing human is left and takes on **her last duty as Ginnem's guardian**. The battle starts: Yojimbo, with Daigoro.
5. **After the battle.** Yuna sends Ginnem (wiki). Lulu says the farewell is less sad than she expected. Wakka tells her she is stronger now. She sends Yuna on to the fayth.
6. **(Optional, not part of the fight) Chamber of the Fayth:** the hiring question and the haggle (§7).

`[verified: 2 sources — Auronlu script + wiki Ginnem / Cavern / Lulu pages]` for beats 1 to 5. Dialogue is paraphrased here on purpose. Our own lines should follow `research/writing-bible.md`, not reuse the script.

**Background (wiki, citing *Ultimania Omega*):** Lulu was 20 and Ginnem's sole guardian `[single source]`. Lulu fails to reach Ginnem on the Farplane earlier in the game because Ginnem was never sent `[single source: wiki]`.

### 6.3 Appearance, in words for painters

- **Yojimbo:** a colossal samurai with a katana and robes shading gold, orange and purple; top-heavy pauldrons with gold spirals; a *jinbaori* cape; a gold-embossed *jingasa* hat; *geta* sandals; a fanged *menpo*-style mask `[single source: wiki FFX aeon page]`.
  - **Conflict Y-7:** `research/visual-bible.md` sets a dark navy coat (`#1A1E2E`) as `[estimate]`. The wiki's gold/orange/purple is the sourced read, so the visual bible's palette should yield.
- **Daigoro:** Yojimbo's dog (a Koma Inu in the data) `[decompiled]` + wiki.
- **Lady Ginnem:** a palette swap of Belgemine with white face make-up `[single source: wiki]`.
- **The unsent effect:** she forms out of pyreflies (script).

All of it must be painted as original work (AGENTS.md rule 8).

### 6.4 Music

"**Lulu's Theme**" (OST disc 4, 3:58) plays for Ginnem's scene and the Yojimbo battle. It is the only place the track plays `[verified: 2 sources — wiki Lulu page, wiki OST page; the Cavern page agrees]`. The Chamber of the Fayth plays "Hymn of the Fayth – Yojimbo" (0:38) `[single source: wiki]`. We ship our own original cue in the spirit of the track (AGENTS.md rules 8 and 13; Bailey judges by ear).

---

## 7. Yojimbo's payment and Zanmato mechanics (the player-side aeon, for completeness)

This is **not** used in fight A. It is recorded here so that a later "Yojimbo joins" beat or a player-owned Yojimbo has its data.

### 7.1 Hiring

- Yojimbo first asks why Yuna wants his power. The three answers are *train as a summoner*, *gain the power to destroy fiends*, and *defeat the most powerful of enemies*. The answer is permanent `[verified: 3 sources — wiki, Jegged, GameFAQs]`.
- The third answer opens at **250,000 gil** `[verified: 4 sources]`.
- Haggling:
  - First bid: offer at least half his price plus 1 gil, and he comes down to **225,000** `[verified: 3 sources]`.
  - Majority route: half + 1 again → **202,500**, then 70 % + 1 → **190,350**, which is the final price `[verified: 3 sources — Jegged, GameFAQs, EIP]`.
  - **The wiki disagrees:** a 70 % route through 211,500 to **198,810**, with a 90 % acceptance floor (**conflict Y-6**; the three-source route wins).
- Bids entered too quickly (under about 5 to 8 seconds) are rejected `[verified: 2 sources — wiki, GameFAQs]`.
- Paying **triple** his price adds **Teleport Sphere ×2** `[verified: 3 sources]`.

### 7.2 In-battle payment

This matches the decompile of `events/yojimbo_turn.py` and the wiki's formulas `[verified: 2 sources]`. The full logic is in `research/ffx-combat-core.md` §6.6. Key facts:

- Compatibility runs 0 to 255 and starts at 128 (International/PAL/HD) or 50 (JP/NTSC).
- Free-attack chance is `compat // 4 > rng & 255`.
- **Paid motivation** = `(compat // 10 + floor(log2(gil/4)) × 4) × hiring modifier × Zanmato resistance + Overdrive bonus 20 + rand 0–63` (HD). Below 80, it is recalculated once as if against a Zanmato-level-1 enemy.
- Thresholds: Daigoro < 32, Kozuka < 48, single Wakizashi < 63, multi Wakizashi < 80, Zanmato ≥ 80.
- Compatibility changes: 0 gil −20, first-turn dismiss −3, Daigoro −1, Kozuka 0, single Wakizashi +1, multi Wakizashi +3, Zanmato +4. **Yojimbo dying costs −10** (wiki; combat-core §6.6 does not list it, so add it there).
- **Player Zanmato** is command `3:226`: Death at 255, whole enemy party, kills anything except that Yunalesca and Braska's Final Aeon lose one form `[verified: 2 sources]`.

---

## 8. The other candidates — full data

### 8.1 Candidate B — Dark Yojimbo (`m340`, bestiary #240). FFX International / PAL / HD only

| Field | Value | Confidence |
|---|---|---|
| HP / MP / Overkill | **1,600,000** / 999 / 99,999 | `[decompiled HD]` + wiki + EIP `[verified: 3 sources]` |
| STR / DEF / MAG / MDEF / AGI / LUCK / EVA / ACC | 244 / 210 / 131 / 144 / 243 / 114 / 0 / 255 | `[decompiled HD]` + wiki `[verified: 2 sources]` |
| AP / Overkill AP / Gil | 8,000 / 10,000 / 0 | `[decompiled]` + wiki |
| Zanmato level | byte 4 → **level 5** | `[decompiled]` + wiki (5) |
| Immunities | everything the wiki lists, including Doom (255), Scan, Sensor, Delay, Bribe, percentage damage, Life | `[decompiled]` + wiki |
| Drops | Dark Matter ×1 (common), **Master Sphere** ×1 (rare); ×2 on overkill; chance 255 | `[decompiled]` + wiki + EIP |
| Steal | Stamina Tonic ×2 / Elixir ×1 | `[decompiled]` + wiki |
| Equipment | always drops (255); 3 to 4 slots; up to 2 abilities. Weapons: Counterattack, Magic Counter, Overdrive→AP, Break Damage Limit. Armour: Curseproof, Break HP Limit, Ribbon | `[decompiled]` + wiki `[verified: 2 sources]` |
| Formation | `dark_yojimbo` + `sinscale_4` (the Dark Daigoro slot). **The first fight is a forced ambush**; the second is normal | `[decompiled]` + wiki + EIP (and `ffx-combat-core.md` §1 lists it among the three always-ambush enemies) |

**Actions** `[decompiled]` + wiki enemy-ability table `[verified: 2 sources]`:

| Row | Name | Formula / DC | Target | Effect |
|---|---|---|---|---|
| 4:267 | Daigoro | Strength 8, always Break Damage Limit | one random | **Petrify 254 + Poison 254**. A petrified KO shatters the character for the rest of the battle (wiki, EIP) |
| 4:263 | Kozuka | Strength 16, BDL | one random | **Full Break (Power/Magic/Armor/Mental) + Slow**, 254 |
| 4:265 | Wakizashi | Strength 28, BDL, shatter 100 | **whole party** | |
| 4:264 | Wakizashi "B" | Strength 32, single | — | **unused** (not in the action list; wiki agrees) |
| 4:266 | **Zanmato** | **Strength 250**, BDL, shatter 100 | whole party | **removes Auto-Life** (the no-RNG status byte; wiki + EIP) |

- **Overdrive gauge:** +2 % when targeted; per action **+6 / +10 / +16 / +20 / +26 %** in fights 1 to 5 `[verified: 2 sources — wiki, EIP]`.
- **Must be beaten five times in a row.** The third fight can be skipped, but skipping it does not count as defeating him or unlock Penance `[verified: 2 sources]`.
- **Computed Zanmato** into Def 255 with no Shield: **191,308 to 216,018** `[derived]`. The wiki gives 46,999 to 53,069 for an aeon using Shield, which implies Shield multiplies by about 0.246; the Shield factor itself was not verified here.
- **Music:** "Run!!" `[single source: wiki OST page]`.
- **Why not the chapter:** no story. It is a farming superboss. It needs a maxed postgame party (the wiki recommends maxed Strength/Defense, 170+ Agility, Stoneproof/Ribbon, Auto-Haste/Protect/Phoenix, and an aeon for every Zanmato), none of which our presets model.

### 8.2 Candidate C — Yojimbo (*Final Fantasy X-2*), bestiary #185, Cavern of the Stolen Fayth

**Where and when.** The optional mission **"Tourist Trap"** unlocks at the start of **Chapter 3** and can be finished in Chapter 3 or Chapter 5:
1. Fiends pour out of the former Chamber of the Fayth.
2. Yuna rescues the trapped tourists (they give Energy Cores for the teleporters and the Besaid Key).
3. She enters the chamber and fights Yojimbo, **possessed by Shuyin's despair**.

`[verified: 2 sources — wiki Cavern page, FFExodus Ch. 3 walkthrough]`. Mission reward: Tetra Master Garment Grid and Star Bracer `[single source: wiki]`.

| Field | Value | Confidence |
|---|---|---|
| Level | 36 | wiki `[single source]` |
| HP / MP | **22,000 / 9,999** | wiki + FFExodus `[verified: 2 sources]` |
| STR / MAG / DEF / MDEF / AGI / LUCK | 44 / 61 / 50 / 106 / 120 / 7 | wiki `[single source]` |
| EXP / AP / Gil / Pilfer gil | **2,000 / 15 / 1,500 / 2,000** | wiki + FFExodus `[verified: 2 sources]` |
| Drop | **Recovery Bracer** (common and rare) | wiki + FFExodus `[verified: 2 sources]` |
| Steal | **Power Wrist** (common and rare), steal rate 128 | wiki + FFExodus `[verified: 2 sources]` (rate: wiki only) |
| Immune | Gravity, Silence, Sleep, Darkness, Poison, Confuse, Berserk, Curse, Petrify, Slow, Delay, Stop, Eject, Interrupt, Multi-attack, every stat modifier, Death, Doom, Bribe, fractional damage, Reflect; "zantetsu = 120" | wiki `[single source]` |

**Abilities:**
- **Wakizashi**, single target, non-elemental: version A DC 16, version B DC 13 (rare).
- **Daigoro**, a non-elemental follow-up by the dog. **Daigoro cannot be targeted.**
- **Kozuka**: takes **25 % of current MP** and inflicts **Poison (100 %)**.
- **Zanmato**: **whole party to 1 HP and 1 MP**, then he tends to follow up with Daigoro or Wakizashi.

Sourcing: wiki boss page + wiki X-2 enemy-ability table + FFExodus (poison, MP drain, the Zanmato effect) `[verified: 2 sources]` for the effects; DC values `[single source]`. **Telegraph:** before Zanmato he raises his right hand, palm facing left (wiki) `[single source]`.

**AI (action counter)** `[single source: wiki]`. The counter rises by 8 on each of his turns:

| Counter | Actions |
|---|---|
| 0–29 | Daigoro 2/3, Kozuka 1/3 |
| 30–69 | Daigoro 1/2, Kozuka 1/4, Wakizashi A 1/4 |
| 70–99 | Daigoro 1/4, Kozuka 1/4, Wakizashi A 1/4, Wakizashi B 1/4 |
| 100+ | **Zanmato**, then the counter resets to 0 |

So Zanmato arrives on his **14th turn** `[derived: ceil(100/8) = 13 turns to reach 104, used on the 14th]`. This needs verifying (§9 Y-8).

- **Strategy (sourced):**
  - Poison protection (Star Pendant / Glass Buckle).
  - Two hard hitters (Dark Knight, Samurai, Warrior, Gunner) plus an **Alchemist** who heals *after* Zanmato (Mega-Potion, or Mix).
  - Berserker counters. Break HP Limit works against you.
  - Sources: wiki + FFExodus `[verified: 2 sources]`.
- **Music:** "**Aeons**" `[single source: wiki Cavern page]`. The location theme is "Labyrinth".
- **Fiend Arena:** capture a Critical Bug in Bevelle, raise it 5 levels and release it, and the same Yojimbo becomes an arena fight (Creature Creator, International/HD) `[single source]`.
- **Why not the Yojimbo chapter:** it is optional, it is one of **Shuyin's possessed aeons**, and its data outside the headline numbers comes from one source. **It belongs in the planned FFX-2 fallen-aeons chapter.** If that chapter is a multi-aeon sequence, this fight drops in with the numbers above.

### 8.3 Candidate D1 — Belgemine's Yojimbo, Remiem Temple (FFX)

- An aeon-only training duel. **Defeat does not cause a Game Over.**
- First win: **Shadow Gem ×8**; later wins: Power Sphere ×10 `[verified: 2 sources for the Shadow Gems — wiki, GameFAQs]`.
- Stats (wiki only): HP 32,000, Overkill 32,000, MP 1,200, STR 30, MAG 45, DEF 1, MDEF 1, AGI 25, ACC 15, EVA 50, Doom count 5; the enemy is Tough.
- **No HP 32,000 Yojimbo record exists in the decompiled table.** Only `m288` (33,000) and `m340` carry that name, so the Remiem fight may reuse `m288` with scripted changes. **Unverified** (§9 Y-9).
- Not a candidate for the chapter: aeons only, no story.

### 8.4 Candidate D2 — Possessed Yojimbo, inside Sin (FFX)

- Exists only if Yuna owns Yojimbo. HP equals **Yuna's Yojimbo's HP**, Overkill 169 (a placeholder equal to its record index).
- Formation `possessed_yojimbo` + two Yu Pagodas + `nishida` `[decompiled]`.
- Actions: Kozuka `6:224` (Strength 14, crits), Wakizashi `6:225` (Strength 14, single), Zanmato `6:226` (**fixed 200 → 10,000 capped at 9,999**, whole party), "Possessed by Yu Yevon!" `6:236`, and a Daigoro order that is not used there.
- The party has permanent Auto-Life. Zanmato byte 2 → **level 3**.
- `[decompiled]` + wiki `[verified: 2 sources]`. **Already covered by `research/ffx-bfa-yu-yevon.md`**; not a separate chapter.

---

## 9. Conflicts, gaps and the verify-before-shipping list

| # | Item | Status / what to do |
|---|---|---|
| **Y-1** | Cavern Yojimbo AI weights. The thresholds are verified (3 sources), but the **per-action probabilities** in each band, the "slightly higher" weights at 80 %, the **starting gauge**, the gauge value after Zanmato, and whether "targeted" counts per action or per hit are **unsourced**. The +3 % / +2 % rates come from one source. | **Open.** Do not invent weights. Ask Bailey whether an even split within each band is acceptable as a labelled `[estimate]`, or find an AI dump (a GameFAQs enemy-AI FAQ, or a fresh decompile of the battle script, which the Grayfox96 files do not contain). |
| Y-2 | Wakizashi target. The decompile gives **one random character** (4:131). GameFAQs says party-wide. The wiki says "One ally". | Resolved: **single target** (decompile + wiki). |
| Y-3 | Threaten. The byte reads 0 (landable); the wiki says Immune. | Unresolved. Do not let Threaten work until checked (same rule as Evrae C-4). |
| Y-4 | Row 4:132 (Wakizashi, Magic formula, DC 24) is in Yojimbo's menu list but not assigned to him. | Treat as unused. |
| Y-5 | Lady Ginnem (`m249`, HP 10): can she be targeted, and does killing her end the battle? | **Open.** The sources say only that the party fights *Yojimbo*. Recommend presenting her as untargetable scenery `[estimate]` until checked. |
| Y-6 | Haggle route: three sources say 190,350; the wiki says 198,810 with a 90 % floor. | Three sources win. Only matters if the haggle becomes a beat. |
| Y-7 | Yojimbo's palette: the wiki's gold/orange/purple against the visual bible's navy `[estimate]`. | Follow the wiki; update `visual-bible.md` in a later art pass. |
| Y-8 | FFX-2 action counter (+8 per turn; Zanmato at 100): single source. | Verify before building Candidate C. |
| Y-9 | Remiem Yojimbo record not found in the decompile. | Only matters if D1 is ever built. |
| Y-10 | Can Daigoro (`m266`, HP 1) be targeted in FFX? The FFX-2 wiki says the X-2 dog cannot; no FFX source says either way. | **Open.** Recommend treating the dog as untargetable in FFX too `[estimate]`, and asking Bailey. |
| Y-11 | Can the party escape the Cavern fight? Wiki info line only. | Single source; the default "cannot flee" is consistent with every other boss. |

---

## 10. Minimum mechanic list for Candidate A (FFX only)

1. **An enemy Overdrive gauge on Yojimbo:** +3 % when targeted, +2 % when he acts. It gates his action pool at 25 / 50 / 80 / 100 % (§4.1). **Show it on screen.** The fight is about reading this gauge. How it is presented is a mockup question for Bailey.
2. **Zanmato:** fixed 10,000, capped at 9,999, hits the whole party, special type (Protect does not apply). Aeons on the field take it instead.
3. **Daigoro as a separate actor** (the Koma Inu slot), ordered by Yojimbo, with its own Strength 25 and a crit bonus of 20.
4. **Doom lands with count 5.** Kimahri's Lancet on a Cavern **Ghost** teaches Ronso Rage "Doom". A Candle of Life is in the inventory `[estimate: whether the preset carries one; the item itself is sourced]`.
5. **Immunities and stats exactly as §2.** Scan and Sensor show nothing. Defense 80 and Magic Defense 0 drive everything.
6. **Beats 1 to 5 of §6.2**, with Lulu first in line and "Lulu's Theme" as the cue brief.
7. **Before any of this is built:** end-state options for the arena, Yojimbo and Daigoro billboards, Lady Ginnem, the gauge widget and the music cue go to Bailey first (AGENTS.md rule 9).

---

## Sources

**Decompile-derived data (Grayfox96/FFX-RNG-tracker, pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680`, read into memory)**

- https://github.com/Grayfox96/FFX-RNG-tracker
- `ffx_rng_tracker/data/data_files/ffx_mon_data.csv` and `ffx_mon_data_hd.csv`: `m288`, `m266`, `m249`, `m250`, `m169`, `m340`, `m116`
- `ffx_rng_tracker/data/data_files/ffx_monmagic1.csv` (file 4): rows 120, 130–134, 144, 177, 263–267
- `ffx_rng_tracker/data/data_files/ffx_monmagic2.csv` (file 6): rows 224–226, 236
- `ffx_rng_tracker/data/data_files/ffx_command.csv` (file 3): rows 222–226 (the player's Yojimbo)
- `ffx_rng_tracker/data/data_files/monster_actions.json` and `formations.json` (`bosses.yojimbo`, `possessed_yojimbo`, `dark_yojimbo_1`, `dark_yojimbo_2`)
- `ffx_rng_tracker/data/data_files/items.csv`, `autoabilities.csv`, `text_characters.csv`
- `ffx_rng_tracker/data/monsters.py`, `actions.py`, `constants.py`, `text_characters.py`, `utils.py` (field offsets and enums)

**Final Fantasy Wiki** (via `api.php?action=parse&prop=wikitext`, browser user agent; fetched 2026-09-24)

- Yojimbo (Final Fantasy X boss), revid 3980332: https://finalfantasy.fandom.com/wiki/Yojimbo_(Final_Fantasy_X_boss)
- Yojimbo (Final Fantasy X), revid 4045209: https://finalfantasy.fandom.com/wiki/Yojimbo_(Final_Fantasy_X)
- Dark Yojimbo, revid 4004456: https://finalfantasy.fandom.com/wiki/Dark_Yojimbo
- Yojimbo (Final Fantasy X-2), revid 3980334: https://finalfantasy.fandom.com/wiki/Yojimbo_(Final_Fantasy_X-2)
- Cavern of the Stolen Fayth, revid 4034145: https://finalfantasy.fandom.com/wiki/Cavern_of_the_Stolen_Fayth
- Ginnem, revid 3963153: https://finalfantasy.fandom.com/wiki/Ginnem
- Ginnem (boss), revid 3963152: https://finalfantasy.fandom.com/wiki/Ginnem_(boss)
- Final Fantasy X enemy abilities, revid 4008011: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_enemy_abilities
- Final Fantasy X-2 enemy abilities, revid 3998493: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_enemy_abilities
- Lulu (section "Musical themes", story): https://finalfantasy.fandom.com/wiki/Lulu
- Final Fantasy X Original Soundtrack: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_Original_Soundtrack
- Final Fantasy X-2 Original Soundtrack: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_Original_Soundtrack

**Guides and script**

- GameFAQs, bover_87, *Final Fantasy X Remaster Walkthrough (PC)* v1.3 (2023-12-17), "Cavern of the Stolen Fayth": https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/79145/cavern-of-the-stolen-fayth
- Jegged, FFX Side Quests, Cavern of the Stolen Fayth: https://jegged.com/Games/Final-Fantasy-X/Side-Quests/Cavern-of-the-Stolen-Fayth.html
- Jegged, FFX Walkthrough, The Calm Lands: https://jegged.com/Games/Final-Fantasy-X/Walkthrough/25-The-Calm-Lands.html
- EIP Gaming, FFX Yojimbo: https://eip.gg/ffx-x2/guides/yojimbo/
- EIP Gaming, FFX Cavern of the Stolen Fayth: https://eip.gg/ffx-x2/guides/cavern-of-the-stolen-fayth/
- EIP Gaming, FFX Dark Yojimbo: https://eip.gg/ffx-x2/guides/dark-yojimbo/
- FFExodus, FFX-2 walkthrough, Chapter 3 Calm Lands / Cavern of the Stolen Fayth (Yojimbo box): http://www.ffexodus.com/ffx2/walkthrough28.php
- Auronlu, *FFX Game Script*, Chapter XI: The Calm Lands: http://auronlu.istad.org/ffx-script/chapter-xi-the-calm-lands/
- Auronlu, *FFX Battle Quotes*: http://auronlu.istad.org/ffx-script/ffx-battle-quotes/
- Not retrievable this session: StrategyWiki (HTTP 403), antmag.net (no usable text)

**Local prior research consulted:** `research/ffx-evrae-airship.md` (format), `research/ffx-combat-core.md` §2 and §6.6, `research/ffx-seymour-flux.md` §7, `research/ffx-seymour-anima-macalania.md` C-6, `research/ffx-bfa-yu-yevon.md` §5, `research/visual-bible.md` (Yojimbo rows), `research/ffx2-bahamut.md` (X-2 source conventions).

---

## 11. Verification log (2026-09-24)

| # | Claim | Check | Result |
|---:|---|---|---|
| 1 | Parser correctness | parsed Evrae `m119` and compared with `ffx-evrae-airship.md` §1 | identical |
| 2 | Cavern Yojimbo HP 33,000 / Overkill 4,060 | decompile + wiki + GameFAQs | agree (Jegged "about 30,000") |
| 3 | Def 80 / MDef 0 | decompile bytes 33/35 + wiki (prints 1) | agree |
| 4 | Doom lands, count 5 | decompile (resist 0, byte 119 = 5) + wiki + GameFAQs + EIP | agree |
| 5 | PS2 vs HD | byte diff of `m288`, `m266`, `m169` | identical |
| 6 | Formation Ginnem + Yojimbo + Daigoro | `formations.json` `bosses.yojimbo` | `[mira, yojimbo, koma_inu]` |
| 7 | Daigoro 20 (crit, 10 % shatter), Kozuka 16, Wakizashi 28, Zanmato 200 → 10,000 | decompiled rows + wiki enemy-ability table | agree |
| 8 | Zanmato 9,999 to the party | decompile (fixed 200 × 50, no BDL flag) + wiki + GameFAQs + EIP | agree |
| 9 | Gauge thresholds 25 / 50 / 80 / 100 | wiki + GameFAQs + EIP | agree; weights unsourced (Y-1) |
| 10 | Lulu's Theme only here | wiki Lulu page + wiki OST page | agree |
| 11 | Dark Yojimbo stats, drops, ambush | decompile HD + wiki + EIP | agree |
| 12 | FFX-2 Yojimbo HP / EXP / AP / Gil / steal / drop | wiki + FFExodus | agree |
| 13 | FFX-2 Zanmato → 1 HP / 1 MP | wiki (two pages) + FFExodus | agree |
