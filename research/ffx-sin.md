# FINAL FANTASY X — Sin, the assault from the *Fahrenheit*: Left Fin, Right Fin, Sinspawn Genais with Sin's Core, Overdrive Sin

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-09-27 (~11:00 EDT), accepting item 24 of `docs/plans/next-content-2026-09-27.md`: "Start the research and concept frames for the two new chapters, Sin (FFX) and Ixion at Djose (FFX-2)". This file is the Sin research. **Nothing is built from it without Bailey's pick** (AGENTS.md rules 9 and 10).
**Research date:** 2026-09-27
**Game case:** **FFX only** (AGENTS.md rule 14; §0.3).
**Internal ids (decompile, PS2 and HD tables):** Left Fin `m136` (bestiary #168), Right Fin `m137` (#169), Sin's Core `m138` "Sin" (#171), Sinspawn Genais `m139` (#170), Overdrive Sin `m140` "Sin" (#172), Cid `m149` (the invisible third combatant, as at Evrae). Formations: `left_fin` = [left_fin, cid], `right_fin` = [right_fin, cid], `sin_core` = [sinspawn_genais, sin_2], `overdrive_sin` = [sin_3]; every one is forced condition *normal* with **no forced party**.
**File name note:** the recommendation sheet (§3 step 1) proposed `research/ffx-sin-fahrenheit.md`; the brief names this file `research/ffx-sin.md`. Same scope.

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

The same vocabulary as `research/ffx-evrae-airship.md` §0.1 and `research/ffx-yojimbo.md` §0.1, plus the two tags the brief asks for.

| Tag | Meaning |
|---|---|
| `[decompiled]` | Read from the game's `ffx_mon_data(_hd)` / `ffx_monmagic1` / `ffx_monmagic2` / `ffx_command` tables in the Grayfox96 FFX-RNG-tracker data files, pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680` (the commit the Evrae and Yojimbo files used), parsed with that repository's own field offsets. **The tables hold stats, flags and action rows. They do not hold the AI scripts:** every turn pattern, counter and threshold in §5 comes from guides. |
| `[verified: N sources]` | N independent sources agree. |
| `[single source]` | Only one source says it. |
| `[derived]` | Computed by me from `[decompiled]` constants with the damage chain of `research/ffx-combat-core.md` §2 (the tracker's own `get_damage`, re-transcribed). |
| `[estimate]` / **our estimate** | My own design judgement, not a measured fact. Anything marked so needs Bailey's yes before it is built. |
| `[unsourced]` | No source found. Do not build it as fact. |

**Source order (Bailey, 2026-09-25: "I especially like gamefaqs"):** GameFAQs first, the FF Wiki second. Where the decompile speaks it outranks both for numbers, as in every earlier FFX file. Where GameFAQs guides disagree with each other, both are recorded (§10).

### 0.2 What I did

1. Read `docs/plans/next-content-2026-09-27.md` in full, `research/ffx-evrae-airship.md` (§0–§4, §9–§13: the range mechanic this chapter reuses), `research/ffx-yojimbo.md` (house format), `research/ffx-yunalesca.md` §11–§12 and `research/ffx-bfa-yu-yevon.md` outline (the neighbouring presets), `research/ffx-combat-core.md` §1.2–§1.4, §2, §4.1, and the builds `src/data/ffx/builds/zanarkand.ts`, `dreams-end.ts`, `garden-of-pain.ts`, `fahrenheit.ts`.
2. Read four GameFAQs guides with `curl` (HTTP 200) and one listing through headless Playwright: **bover_87**, *FFX Remaster Walkthrough (PC)* v1.3, page "Sin" (faqs/79145/sin); **Gestahl & FFXMania**, *Boss Guide* v2.0 (faqs/16895), bosses 28 and 29; **SinirothX**, *Enemy Database* v2.0 (faqs/24166), entries #32–#35; **Haunter12O**, *Boss Guide* v1.9 (faqs/15427), the Sin section.
3. Read the FF Wiki through `api.php?action=parse&prop=wikitext` (browser user agent). Page titles and revision ids are in Sources.
4. Parsed `m136`–`m140` and `m149` from the decompile **in memory** (nothing saved but my own scripts in the session scratchpad), with every action row `monster_actions.json` assigns them, the formations, and the equipment-ability lists. **Byte-diffed PS2 against HD:** all five Sin records differ only in byte 403, which no parsed field reads (the same single byte as Evrae). **Every value below holds in both releases.**
5. Read Auronlu's *FFX Game Script*, chapters XIV and XV, for the scene order.
6. Ran the damage chain on the decompiled numbers (§6).

### 0.3 Game case (AGENTS.md rule 14)

**FFX only.** CTB, the airship range state and Cid's Trigger Command, aeons, Armor/Mental Break, Wards, a boss with a turn clock ending in a scripted Game Over. None of it exists in FFX-2 (ATB, dresspheres, no *Fahrenheit*; FFX-2's airship is the *Celsius* and has no battle range mechanic). The fence of `ffx-evrae-airship.md` §0.4 applies unchanged: if a presentation idea from this chapter is liked, it gets an FFX-2-native re-derivation before it appears in an FFX-2 chapter.

### 0.4 What the recommendation sheet said, checked

| Sheet (§1, §2) | Result |
|---|---|
| HP 65,000 / 65,000 / 20,000 + 36,000 / 140,000 | Correct. `[decompiled]` + wiki + bover_87 + SinirothX + Gestahl `[verified: 5 sources]` (Haunter12O's 25,000 for Genais is the only outlier, §10 S-23) |
| "Up close the Fin delays your turns. Far away it hits harder but acts less often" | Correct. Ram (near) is Strength 28 with strong Delay; Smack (far) is Strength 34 with none `[decompiled]` + bover_87 + wiki `[verified: 3 sources]` |
| "Negation strips everyone's buffs" | **Only up close.** At FAR the Fin's Negation is a self-cleanse and never touches the party (§5.1.3) |
| "Gravija takes 75 % of current HP" | Correct, and it cannot kill (§3.1) |
| "3 turns of approach, then 9 turns with its mouth open, then Giga-Graviton" | The sources do not agree whether Giga-Graviton is Sin's 12th or 13th turn. **Open conflict S-1** |
| "Gaze comes every 6th attack and inflicts Petrify, Confuse or Zombie" | Correct: after six targetings (three against an aeon); 30 %; the whole party gets the same status (§5.3) |
| "Sinspawn Genais shields the Core and soaks your magic, so it has to go first" | Correct, with one nuance: killing the Core ends the battle even with Genais alive (§5.2) |
| Chapter needs "a Negation counter, a turn clock and Gaze" | Correct, plus a Genais shell state, "Core is inactive" gating and a fourth thing the sheet missed: **links 1 to 3 carry HP, MP and statuses between them** (§1.2) |

---

## 1. The encounter at a glance

### 1.1 Four links

| # | Link | Where | Range state | Ends when | Music (reference only) |
|---:|---|---|---|---|---|
| 1 | **Left Fin** | *Fahrenheit* deck | **NEAR / FAR, Cid's Trigger Command** (as Evrae) | Left Fin dies | "Assault" |
| 2 | **Right Fin** | *Fahrenheit* deck, the other side | NEAR / FAR, Trigger Command | Right Fin dies | "Assault" |
| 3 | **Sinspawn Genais + Sin's Core** | on Sin's back (the party jumps from the ship) | the Core is out of melee range while Genais lives; no Trigger Command | **the Core dies** (Genais may still live) | "Assault" |
| 4 | **Overdrive Sin** (the head) | *Fahrenheit* deck, above Bevelle | **no Trigger Command**; Sin pulls the ship in over its first three turns | Sin dies, or **Giga-Graviton → scripted Game Over** | not stated by any source (S-21) |

Order and locations: `[verified: 3 sources — decompile formations, wiki (Left Fin "first of a series", Right Fin "second", Genais, Sin (head) "the last of the four-part battle"), bover_87]`. Music: "Assault" "plays during the battle with Sin, excluding the head" `[single source: wiki OST page]`.

### 1.2 What carries between links

- **Links 1 → 2 → 3 are one gauntlet.** No rest between them: "you don't regain HP after defeating Left Fin" (Gestahl), "Immediately after the next phase begins" and "More scenes, then, with no break in between" (bover_87), "the next fight will start off with your characters in the same stats" (Haunter12O). `[verified: 3 sources]` So HP, MP, statuses and Overdrive gauges carry. Buffs carry too `[derived: nothing in the sources clears them; Negation does, §5.1.3]`.
- **Link 3 → 4: a full break.** After the Core falls "you're in control again. Spend any Sphere Levels, save your progress, buy anything you need" and even tour Spira (bover_87; Auronlu's "Backtrack: final tour of Spira"). `[verified: 2 sources]` Link 4 therefore starts from a rested party `[derived: FFX Save Spheres restore HP/MP; the sources place a save before link 4]`.
- **Link 4 has its own preparation beat:** bover_87 tells the player to equip "as much protection against Petrification, Confusion, and Zombie as you can (even Wards are sufficient to completely prevent the statuses)" before talking to Yuna on the deck. `[single source]` for the advice; the Ward arithmetic is `[derived]` (§5.3).

### 1.3 Cannot flee

Every link: "The party cannot escape." `[single source: wiki infobox info lines on all five pages]`. Consistent with every other boss.

---

## 2. Stat blocks

### 2.1 Core stats

| Field | Left Fin `m136` | Right Fin `m137` | Genais `m139` | Core `m138` | Overdrive Sin `m140` | Confidence |
|---|---:|---:|---:|---:|---:|---|
| HP | **65,000** | **65,000** | **20,000** | **36,000** | **140,000** | `[decompiled]` + wiki + bover_87 + SinirothX + Gestahl `[verified: 5 sources]` |
| MP | 999 | 999 | 200 | 999 | 999 | `[decompiled]` + wiki + SinirothX |
| Overkill | 10,000 | 10,000 | 2,000 | 3,000 | 16,000 | `[decompiled]` + wiki + bover_87 + SinirothX |
| Strength | 30 | 30 | 30 | 1 | 30 | `[decompiled]` + wiki + SinirothX + Gestahl |
| **Defense** | **100** | **100** | **80** | **100** | **40** | `[decompiled]` + wiki + SinirothX |
| Magic | 30 | 30 | 35 | 30 | 30 | `[decompiled]` + wiki + SinirothX |
| **Magic Defense** | 50 | 50 | 50 | **100** | 40 | `[decompiled]` + wiki + SinirothX |
| Agility | 20 | 20 | 25 | 20 | **30** | `[decompiled]` + wiki + SinirothX (wiki adds "26 Agility outside shell" for Genais, S-18) |
| Luck / Evasion / Accuracy | 15 / 0 / 0 | 15 / 0 / 0 | 15 / 0 / 0 | 15 / 0 / 0 | 15 / 0 / 0 | `[decompiled]` (the wiki prints Accuracy 1) |
| **Armored** | **yes** | **yes** | no (yes inside its shell, §5.2) | **yes** | **yes** | `[decompiled]` + wiki + bover_87 |
| Immune to percentage damage (Demi, Gravity) | yes | yes | no (yes inside its shell) | yes | yes | `[decompiled]` + wiki + bover_87 ("Gravity (Immune)") |
| Immune to Delay | yes | yes | yes | yes | yes | `[decompiled]` + wiki |
| Immune to Sensor / Scan | no / no | no / no | no / no | no / no | no / no | `[decompiled]`; the wiki prints Sensor and Scan text for all five (paraphrased in §3.6). The Left Fin infobox also lists "sensor = Immune, scan = Immune": a wiki slip, since it prints no text and the byte says landable |
| Doom count | 30 (immune) | 30 (immune) | **30, landable** | 30 (immune) | 30 (immune) | `[decompiled]` + wiki (Genais "doom count = 30") + bover_87 (Genais "Doom Count 30") |
| Zanmato level | byte 3 → **4** | 4 | 4 | 4 | 4 | `[decompiled]` (0-based rule of `ffx-seymour-anima-macalania.md` C-6) + wiki + SinirothX `[verified: 3 sources]` |

> **The design facts.** Every Sin part except Genais is **Armored** with **Defense 100** (the head 40): a plain physical hit lands at a third, and **Armor Break** is the key that opens all four links. Auron owns it in every preset (§7). Genais is the opposite: not armored outside its shell, Armor/Mental Break immune, **weak to Fire, absorbs Water**. `[decompiled]` + 4 guides.

### 2.2 Elements

| | Fire | Ice | Thunder | Water | Holy |
|---|---|---|---|---|---|
| Left Fin, Right Fin, Core, Overdrive Sin | — | — | — | — | — |
| **Genais** | **Weak** | — | — | **Absorbs** | — |

`[decompiled]` + wiki + SinirothX ("[Absorption] Water [1.5 damage] Fire") + bover_87 (Water absorb) `[verified: 4 sources]`. bover_87 lists no Fire weakness; the other three do.

### 2.3 Status resistances (0 = landable, 50 = Ward level, 100 = resists, 255 = immune)

| Status | Fins | Genais | Core | Overdrive Sin | Note |
|---|---:|---:|---:|---:|---|
| Death, Petrify, Poison, Confuse, Berserk, Provoke, Sleep, Dark, Eject, Auto-Life | 255 | 255 | 255 | 255 | `[decompiled]` |
| Zombie | 255 | **80** | 255 | 255 | Genais: Zombie lands at chance − 80, so Zombie Attack (100) lands 20 % of the time `[derived]` |
| Silence | 255 | **100** | 255 | 255 | Genais: Silence Attack (chance 100) can never land (100 − 100 = 0); **Silence Buster and the Silence Grenade carry chance 254, which ignores resistance**, so only they work, as bover_87 says. `[decompiled: ffx_command row 13 = 254 for 1 turn, ffx_item row 39 = 254 for 8 turns]` + bover_87 `[verified: 2 sources]`. The Buster's Silence lasts one turn, the Grenade's eight |
| Power Break / Magic Break | 255 | **0** | 255 | 255 | Genais can be Power- and Magic-Broken (bover_87 agrees) |
| **Armor Break / Mental Break** | **0** | **255** | **0** | **0** | the key status of the chapter, `[verified: 4 sources]` |
| Slow / Haste | 255 / 255 | **0 / 0** | 255 / 255 | 255 / 255 | Genais can be Slowed (bover_87 agrees) |
| Doom | 255 | **0** | 255 | 255 | useless in practice: count 30 |
| Reflect | 0 | 255 | **255** | 0 | Core's own counter spells bounce off a Reflected party back to it (§5.3.2 item 4, §8 row 7) |
| **Threaten** | byte **0** | byte 0 | byte 0 | byte 0 | **wiki, Gestahl and SinirothX all say Immune.** Same shape as Evrae C-4. **Conflict S-6: default immune** |
| Shell, Protect, Nul×4, Regen, Distillers, Scan | 0 | 0 | 0 | 0 | landable; pointless |

`[decompiled]`, cross-checked against the wiki infoboxes and SinirothX's immunity lists `[verified: 3 sources]` except Threaten.

### 2.4 Rewards

| | Gil | AP (Overkill) | Steal common / rare | Drop (×2 on Overkill) | Equipment (always drops; 3–4 slots) |
|---|---:|---|---|---|---|
| Left Fin | 10,000 | 16,000 (24,000) | Mega-Potion / Supreme Gem | HP Sphere | weapon Poisonstrike (+ Piercing for Auron, Kimahri); armour **Poisonproof** |
| Right Fin | 10,000 | **17,000 (25,500)** | X-Potion / Shining Gem | Lv. 3 Key Sphere | weapon Stonestrike (+ Piercing); armour **Stoneproof** |
| Genais | 10,000 | 1,800 (2,700) | Star Curtain / Shining Gem | Return Sphere | weapon Zombiestrike (+ Piercing); armour Zombieproof |
| Core | 10,000 | 18,000 (27,000) | Stamina Spring ×3 / ×4 | MP Sphere | weapon Slowstrike (+ Piercing); armour Slowproof |
| Overdrive Sin | 12,000 | 20,000 (30,000) | Ether / Supreme Gem | Lv. 3 Key Sphere | weapon Silencestrike, Darkstrike, Slowstrike, Sleepstrike (+ Piercing); armour **Silenceproof** |

`[decompiled]` (steal chance 255, drop chance 255, equipment chance 255, slots modifier 16 → 3–4, bonus crit 3, base weapon damage 16) + wiki + bover_87 `[verified: 3 sources]`, with three corrections recorded in §10: Right Fin AP (S-4), Right Fin's armour ability (S-5), and Overdrive Sin's ability-roll count (S-7). Bribe: immune on all five `[decompiled]` + wiki.

> **A sourced detail worth keeping.** The **Right Fin can drop Stoneproof armour**, and Overdrive Sin's Gaze can Petrify. A player who wins that drop walks into link 4 with one character proof against the worst Gaze. `[derived from decompiled drop tables + §5.3]`. Whether the drop is armour or a weapon is a coin the game rolls; the split is not in these sources `[unsourced]`.

### 2.5 Cid (`m149`) in the Fin fights

Cid is in both Fin formations `[decompiled]`, with the stat block of `ffx-evrae-airship.md` §2.1 (and its Agility conflict C-6). His only action row is Guided Missiles `[decompiled]`, but **in the Sin fights he fires none**: "it's the exact same thing with maneuvering the airship, except this time Cid has no Guided Missiles" (Gestahl). `[single source]`; the wiki's *Fahrenheit* and *Cid (boss)* pages describe missiles only for Evrae, which agrees by omission. **S-19.** Default: Cid's unordered turns do nothing; an ordered turn moves the ship.

---

## 3. Exact action data (decompiled rows)

All rows: rank 3, **hit chance formula "Always hits"** (index 0 of the tracker's table), so **nothing in this chapter can be dodged by Evasion** and every row gets `canMiss: false` in engine terms (AGENTS.md hard rule 5; the rule's guard reads only `=== false`). `[decompiled]`

### 3.1 The Fins (`m136` / `m137`)

| Row | Name | Used | Formula | Base | Target | Type | Flags | Confidence |
|---|---|---|---|---:|---|---|---|---|
| 6:146 | **Ram** (italic, code name) | NEAR | Strength | **28** | whole party | Physical | **strong Delay**, `long_range = false` | `[decompiled]` + wiki ("Delay (Strong): Infinite") `[verified: 2 sources]` |
| 6:147 | **Smack** (italic, code name) | FAR | Strength | **34** | whole party | Physical | `long_range = true` | `[decompiled]` + wiki `[verified: 2 sources]` |
| 6:144 (Left) / 6:182 (Right) | **Gravija** | NEAR, the turn after the charge | **Percentage Current, 12/16 = 75 %** | 12 | whole party | Magical | always Break Damage Limit | `[decompiled]` + wiki + bover_87 + SinirothX `[verified: 4 sources]` |
| 6:166 (Left) / 6:184 (Right) | Gravija (long range) | a charged Gravija that resolves at FAR | **No damage** | 0 | whole party | — | `long_range = true` | `[decompiled]`; Gestahl ("he WILL use Gravija if you are far away. It just won't hit you") and Haunter12O ("it has no effect if the airship is away") `[verified: 3 sources]` |
| 6:145 | **Negation** (near) | NEAR | No damage, removes statuses | — | **"All" (both sides)** | Magical | removal list below | `[decompiled]` + wiki "Everyone" version |
| 6:167 | **Negation** (far) | FAR | No damage, removes statuses | — | **Self** | Magical | `long_range = true` | `[decompiled]` + wiki ("it will not target the party") `[verified: 2 sources]` |
| 6:168 (Left) / 6:186 (Right) | **Core gathers energy.** | NEAR | no damage | — | self | — | the Gravija telegraph | `[decompiled]` + wiki + SinirothX |
| 6:188 | **Sin remains motionless.** | both | no damage | — | self | — | a skipped turn | `[decompiled]` + wiki + Gestahl + SinirothX |
| 6:142 / 6:143 | "Sin draws back." / "Sin draws closer." | **never** | — | — | — | — | in the menu list, **not assigned** in `monster_actions.json` | `[decompiled]` + wiki ("two unused abilities… to draw near or pull away… of its own volition") `[verified: 2 sources]`. S-10 |

**Gravija cannot kill.** 75 % of current HP, integer-floored, always leaves at least a quarter: at 1 HP it deals 0. `[derived]` Gestahl says the same in plain words ("this CAN'T kill you"). The danger is what follows it: a Smack or Ram on a party at a quarter HP (Gestahl: "If you don't heal after a Gravija, this will be Game Over for you").

**Negation's removal list** (both rows, chance 255): Zombie, Petrify, Poison, all four Breaks, Confuse, Berserk, Provoke, Threaten, Sleep, Silence, Dark, Shell, Protect, Reflect, the four Nul, Regen, Haste, Slow. **Not** Death, Doom, Curse, Auto-Life, Eject, nor Cheer/Focus stacks (those are buffs, not statuses). `[decompiled]` + wiki ("Removes all statuses except Auto-Life, Curse, Death, and Doom") `[verified: 2 sources]`. **So Negation also cures the party's Poison, Petrify, Slow and Darkness** `[derived]`: an unexpected mercy the HUD should show.

The Right Fin's near Gravija row 6:182 carries `long_range = true` where the Left Fin's 6:144 does not `[decompiled]`. Nothing reads the flag here, since the long-range whiff is a separate row. Recorded, not acted on.

### 3.2 Sinspawn Genais (`m139`)

| Row | Name | When | Formula | Base | Target | Type | Status | Confidence |
|---|---|---|---|---:|---|---|---|---|
| 6:151 | **Venom** | out of shell, turns 1 and 2 of 3 | Magic (MAG 35) | **32** | one random character | **Physical** (Protect halves it; can crit) | **Poison 100 %** | `[decompiled]` + wiki + SinirothX + Gestahl. bover_87 adds Slow: **S-3, not so** |
| 6:152 | **Thrashing** | out of shell, turn 3 of 3 | Strength | **32** | whole party | Physical, can crit | — | `[decompiled]` + wiki + SinirothX + Gestahl `[verified: 4 sources]` |
| 6:150 | **Sigh** | in shell, every turn | Magic | **24** | whole party | Magical | **Darkness 100 %, 3 turns** | `[decompiled]` + wiki + SinirothX + Gestahl `[verified: 4 sources]` |
| 3:76 | **Waterga** | **counter** to magic, out of shell | Magic | **42** | the caster ("Counter") | Magical, Water, reflectable, silenceable | shatter 10 | `[decompiled]` + wiki + bover_87 + SinirothX `[verified: 4 sources]` |
| 3:44 | **Cura** | **counter** (to any hit) while in shell | Healing | **40** | **self** ("Counter Self") | Magical, reflectable | — | `[decompiled]` + 4 guides |
| 6:154 / 6:153 | Enters shell. / Exits shell. | shell changes | — | — | self | — | the shell toggles Armored, percentage immunity | `[decompiled]` + wiki |
| 6:155 | **Magic absorbed.** | a spell aimed at the Core | — | — | — | — | the Core takes nothing | `[decompiled]` (menu row) + wiki + bover_87 + SinirothX `[verified: 4 sources]` |
| 6:42 | Death | its death script | — | — | self | — | — | `[decompiled]` |

Its menu list also carries **Curaga (3:45) and Watera (3:72)**, which `monster_actions.json` does not assign `[decompiled]`: treat as unused (the Yojimbo Y-4 rule).

### 3.3 Sin's Core (`m138`)

| Row | Name | When | Formula | Base | Target | Confidence |
|---|---|---|---|---:|---|---|
| 6:189 | **Core is inactive.** | while Genais is out of its shell | — | — | self | `[decompiled]` + wiki + SinirothX ("If Genais is in, it does not act") |
| 6:196 | **Core gathers energy.** | the charge turn | — | — | self | `[decompiled]` + wiki |
| 6:148 | **Gravija** | the turn after the charge | Percentage Current 12 (75 %) | 12 | whole party (and **Genais, when it is out of its shell**) | `[decompiled]` + wiki enemy-ability table ("Sin (core) also hits Sinspawn Genais") + Gestahl |
| 6:197 | **Negation** | **counter** when targeted | removes statuses | — | **"Counter All"** (both sides) | `[decompiled]` + wiki + bover_87 |
| 6:57 / 6:58 / 6:59 / 6:60 | **Fire / Blizzard / Thunder / Water** | **counter** when targeted, in that order | Magic (MAG 30) | **16** | **whole party**; reflectable, silenceable | `[decompiled]` + wiki + bover_87 (order) `[verified: 3 sources]`. SinirothX's "single target, power 12": S-13 |

### 3.4 Overdrive Sin (`m140`)

| Row | Name | When | Formula | Base | Target | Type | Status | Confidence |
|---|---|---|---|---:|---|---|---|---|
| 6:41 | **Drawn to Sin.** | turns 1–3 | — | — | self | — | pulls the ship in | `[decompiled]` + wiki + Gestahl + SinirothX + bover_87 `[verified: 5 sources]` |
| 6:158 | **Gaze** (Petrify) | counter | Magic (MAG 30) | **20** | whole party | **Special** (Shell does not halve it) | **Petrify 30 %** | `[decompiled]` + wiki + bover_87 |
| 6:159 | **Gaze** (Confuse) | counter | Magic | 20 | whole party | Special | **Confuse 30 %** | same |
| 6:157 | **Gaze** (Zombie) | counter | Magic | 20 | whole party | Special | **Zombie 30 %** | same |
| 6:160 | **Gaze** (aeon) | counter vs an aeon | Magic | **50** | the aeon | Special | — | `[decompiled]` + wiki (the "A version", power 50) |
| 6:156 | **Giga-Graviton** | the last turn (S-1) | **Percentage Total 16/16 = 100 % of max HP** | 16 | whole party | Magical, always Break Damage Limit | **Death 255** | `[decompiled]` + wiki + bover_87 + Gestahl + SinirothX `[verified: 5 sources]` |
| — | *Open Mouth* (italic in the wiki) | turns 4 onward | — | — | — | — | the mouth opens in stages | wiki ability list and gallery ("Open mouth (first time)… (third time)… fully open") `[single source]`; **no row in the decompiled action assignments**: a scripted pose, not an action |

**Giga-Graviton is a scripted Game Over.** It ignores Auto-Life and an aeon on the field; "even using an Aeon to shield it won't save you". `[verified: 4 sources — wiki (two pages), bover_87, Gestahl, SinirothX]`. The table row alone would only KO the party; the Game Over is the script, and the engine must treat it as one.

### 3.5 What never happens here

- No Delay can be inflicted on any Sin part (all five immune) `[decompiled]`.
- No Evasion dodge on either side for the Sin rows (Always hits) `[decompiled]`.
- No Trigger Command in links 3 and 4 `[verified: 3 sources — wiki *Fahrenheit* ("It cannot be moved when battling Sin directly"), bover_87 ("there are no commands to have Cid move the airship"), Gestahl (implied)]`.
- No Guided Missiles (§2.5).

### 3.6 Scan and Sensor text (paraphrased; use as UI-copy inspiration only, never verbatim)

- **Fins, Scan:** once the core is charged it casts Gravija, cutting everyone's HP by three quarters; have Cid back off to avoid it; it dispels with Negation and sometimes hits everyone physically. **Sensor:** it charges Gravija; the Pull Back command avoids it. `[verified: 3 sources — wiki, SinirothX, Gestahl]` (Gestahl transcribes "to 3/4": S-17.)
- **Genais, Scan:** after losing half its HP it goes into its shell on its next turn; hit there, it heals with Cura and leaves the shell on its next turn; the shell protects it from Gravija. **Sensor:** it absorbs magic aimed at Sin. `[verified: 3 sources]`
- **Core, Scan:** when Genais goes into its shell the core charges and casts Gravija; it also dispels good statuses with Negation. **Sensor:** it charges when Genais shells. `[verified: 3 sources]`
- **Overdrive Sin, Scan:** it pulls the airship in while gathering its strength for Giga-Graviton; stop it first. **Sensor:** finish it before its mouth is fully open. `[verified: 3 sources]`

Our own copy follows `research/writing-bible.md` §5.3.

---

## 4. The range mechanic in the Fin fights (links 1 and 2)

This is the Evrae mechanic of `research/ffx-evrae-airship.md` §4, reused. What carries over and what changes:

| Rule | Evrae (`ffx-evrae-airship.md`) | Fins | Confidence |
|---|---|---|---|
| Two states NEAR / FAR, one boolean | §4.1 | same; the Fins "Become Long Range when the Airship is pulled back" | wiki infobox on both Fins `[single source]` + every guide describes it |
| Who orders | Tidus and Rikku, Trigger Command | **same** | wiki Left Fin + *Fahrenheit* + bover_87 + Gestahl `[verified: 4 sources]` |
| When the ship moves | on Cid's next turn; last order wins | **same** | wiki *Fahrenheit* + Gestahl ("on Cid's turn") + Haunter12O ("you have to wait till Cid's turn") `[verified: 3 sources]` |
| **A third option: cancel the queued order** | not recorded in the Evrae file | the wiki *Fahrenheit* page lists "or to cancel the previous order" | `[single source]`, **S-20** |
| Cid's unordered turn | Guided Missiles at FAR (3) | **nothing** | §2.5, **S-19** |
| What reaches at FAR | Blk Magic, Wakka's attacks, Lancet (§4.3) | **same list** by the same flags: Wakka, magic and long-range rows | bover_87 ("have Wakka and Lulu go at it"), Gestahl, wiki strategy `[verified: 3 sources]`; the rule itself is `ffx-evrae-airship.md` §4.3 |
| Buffs at FAR | Cheer, Focus, every buff work | same | `[derived]` as §4.3 there |
| **Opening range** | NEAR (Jegged) | **FAR** | Gestahl ("you start off far away from Left Fin") `[single source]`; bover_87 is consistent ("close in once… otherwise just stay away"). **S-8** |
| The dodge | Poison Breath whiffs at FAR ("Out of breath range.") | **Gravija whiffs at FAR** (the long-range no-damage row, §3.1) | `[verified: 3 sources]` + `[decompiled]` row |
| The enemy moves the ship itself | no | **no** (two dummied rows) | **S-10** |
| Trigger lines | — | Tidus asks Cid to go closer or farther; Rikku the same in her voice; Cid answers "wait a moment" and whoops when he moves | Auronlu, chapter XV (paraphrased) `[single source]` |

**Trigger Command rank and whether a redundant order burns Cid's turn** are as unsourced here as at Evrae (C-7 there): assume rank 3 and yes, labelled our estimate.

**The whole decision, in one line** `[derived]`: near, the Fin acts on almost every turn, Delays the party with Ram and threatens Gravija every fifth turn, but Armor Break and the party's physical hitters reach; far, it mostly sits still and hits harder when it does, Gravija and the party's Negation losses cannot happen, and only Wakka and magic reach. Without Guided Missiles the FAR state buys **safety**, not damage.

---

## 5. AI scripts

### 5.1 Left Fin (link 1)

#### 5.1.1 Attack or skip: the hit counter

| Range | Chance the Fin attacks on its turn (else "Sin remains motionless.") | Confidence |
|---|---|---|
| NEAR, hit 0 times since it last attacked | **33 %** | bover_87 + wiki `[verified: 2 sources]` |
| NEAR, hit once | **67 %** (wiki: 66 %) | same |
| NEAR, hit 2+ times | **100 %** | same |
| FAR | attacks only once hit **7 or more** times | bover_87 + wiki `[verified: 2 sources]`. Gestahl's "on average every five turns" and SinirothX's "every five turns that do damage" are looser observations (SinirothX's five matches the **Right** Fin, and he printed one text for both Fins) |

- The counter **resets when the Fin attacks**, and near and far **share one counter** (near simply needs fewer hits). `[single source: wiki]`
- **An aeon's attack counts as two.** `[single source: wiki]` S-27.
- NEAR attack = Ram (Delay); FAR attack = Smack. `[verified: 3 sources]`

#### 5.1.2 The Gravija cycle (NEAR only)

- After **three regular actions** (attack or motionless) the Fin uses **Core gathers energy.**, and **Gravija on its next turn.** `[verified: 3 sources — wiki ("The core gathers energy after three regular actions, but not while far away"), Gestahl crediting Split Infinity ("each fourth turn, the core gathers energy, and during the other three it is either an attack or Sin remaining motionless"), SinirothX ("The next turn will always be Core gathers energy! after which turn it'll unleash… Gravija")]`
- It **does not charge while FAR** `[verified: 2 sources — wiki, SinirothX]`.
- If the ship is FAR when a charged Gravija resolves, the no-damage long-range row fires instead `[verified: 3 sources]`, like Evrae's "Out of breath range.". As at Evrae, the dodge is **a race between two CTB counters**: the Fin at Agility 20 (recovery 30, rank 3) against Cid (recovery 36 at the decompiled Agility 16).
- Whether the Gravija turn itself counts toward the next three is **not stated** `[unsourced]`, S-25. Default (our estimate): it does not; the cycle is R R R → charge → Gravija.

#### 5.1.3 Negation

- **NEAR:** a chance to use Negation **each time the Fin is targeted** `[verified: 3 sources — bover_87 ("Every time Sin is targeted"), wiki ("after being targeted"), Gestahl ("a counterattack used randomly")]`; SinirothX instead says "on the 6th attack it gets" (S-11). Negation here strips the party's statuses and the Fin's Breaks.
- **The near chance, per the wiki `[single source]`:** a counter starting at **2**; **+2** for the first Break on the Fin, **+1** for the second; **+1** for each Shell, Reflect and Haste on the party; **+1** if Protect is on the rightmost party member, **+2** if on the leftmost; subtract 3; **divide by 16** → the chance. (The left/right Protect weighting is odd enough that it may be a bitfield reading; S-12.)
- **FAR:** an **80 %** chance, **only when the Fin has Mental Break**, and it targets only itself `[single source: wiki]` + `[decompiled]` row 6:167 = Self. Gestahl's practical advice agrees: pull back after Breaking and "you will keep your Haste".
- bover_87: "The chance of seeing Negation increases with each buff on you and each debuff on the Fin" `[verified: 2 sources]` for the direction.

#### 5.1.4 Reference pseudocode (sourced rules; tunables where unsourced)

```
state: range ('FAR' at start, S-8), hitsSinceAttack = 0, regularActs = 0, charged = false

onTargeted(by):                                      // per action; an aeon counts 2 (S-27)
  hitsSinceAttack += (by.isAeon ? 2 : 1)
  if range == 'NEAR':
    c = 2 + breakPts(+2 first, +1 second) + count(Shell,Reflect,Haste on party)
          + (Protect on rightmost ? 1 : 0) + (Protect on leftmost ? 2 : 0)
    if rng() < max(0, c - 3) / 16: counter Negation(both sides)      // Right Fin: /12
  else if fin.hasMentalBreak and rng() < 0.80: counter Negation(self)

finTurn():
  if charged: charged = false; regularActs = 0
              return range == 'NEAR' ? Gravija(75 % current) : GravijaWhiff()
  if range == 'NEAR' and regularActs >= 3: charged = true; return CoreGathersEnergy()
  p = range == 'NEAR' ? [0.33, 0.67, 1.0][min(hitsSinceAttack, 2)]
                      : (hitsSinceAttack >= 7 ? 1.0 : 0.0)
  regularActs += (range == 'NEAR') ? 1 : 0           // "not while far away"
  if rng() < p: hitsSinceAttack = 0; return range == 'NEAR' ? Ram(party, strong delay) : Smack(party)
  return SinRemainsMotionless()
```

### 5.2 Right Fin (link 2): the differences

| Rule | Left Fin | Right Fin | Confidence |
|---|---|---|---|
| NEAR attack | 33 / 67 / 100 % | **only after 4 hits**, no chance below that | wiki + bover_87 ("only using it if it's been hit at least four times") `[verified: 2 sources]` |
| FAR attack | after 7 hits | **after 5 hits** | wiki + bover_87 `[verified: 2 sources]` |
| Below **16,250 HP** (25 %) | — | **always attacks NEAR** on turns it does not use a special; FAR needs only **3** hits; **stays so even if healed back above** | wiki + bover_87 (16,250) `[verified: 2 sources]`; the FAR 3 and the "stays" rule `[single source: wiki]`. Haunter12O saw up to three slams in a row near death, which fits |
| Negation divisor | 16 | **12** (more often) | `[single source: wiki]` |

Right Fin starts with the party's HP as link 1 left it (§1.2).

### 5.3 Sinspawn Genais and the Core (link 3)

#### 5.3.1 Genais

1. **Out of its shell:** **Venom, Venom, Thrashing**, repeat. `[verified: 4 sources — bover_87, wiki, SinirothX, Gestahl crediting Split Infinity]`
2. **Counters any magic** aimed at it with **Waterga** on the caster. `[verified: 4 sources]` (SinirothX: "excluding Demi".)
3. **Enters its shell** on its next turn after losing half its HP (≤ 10,000). `[verified: 3 sources — the in-game Scan text (transcribed by the wiki and SinirothX), bover_87, Gestahl ("if it's his turn and he has less than 10,000 HP")]`
4. **In the shell:** Armored, immune to Demi and Gravija `[verified: 3 sources — wiki info line, bover_87, the enemy-ability table]`; on its turns it uses **Sigh** `[verified: 4 sources]`; **it counters every hit with Cura on itself** `[verified: 4 sources]` (~1,480 per Cura, §6); and **the Core wakes** (§5.3.2).
5. **Leaves the shell:** here the sources split (S-2). Wiki: "Genais will leave its shell when its HP reaches 12,000"; the Scan text: hit in the shell, it recovers with Cura and leaves on its next turn; bover_87: "if pushed below 12,000 HP, it will emerge"; Gestahl: it "won't necessarily" leave on its next turn. **Default (our estimate): the wiki and Scan reading** — Cura heals it up to 12,000 or more, and it leaves on its next turn.
6. **Leaving the shell under a charged Core** means eating the Core's Gravija, since it loses its immunity outside. `[verified: 3 sources — bover_87, Gestahl ("very rewarding to see"), wiki]`
7. While Genais lives, **magic aimed at the Core is absorbed ("Magic absorbed.")** and the Core is **out of melee range**. `[verified: 4 sources — bover_87, wiki, SinirothX, Gestahl]`. Gestahl alone says the absorption stops while Genais is shelled (S-15; default: it never stops).

#### 5.3.2 The Core

1. While Genais is out of its shell: **"Core is inactive."** on its turns. `[verified: 3 sources — decompiled row, wiki, SinirothX]`
2. When Genais is in its shell: **Core gathers energy.** → **Gravija** next turn (hits the party, and Genais only if it is out). `[verified: 3 sources]`
3. After Genais dies: the party moves into melee range of the Core `[verified: 2 sources — bover_87, Gestahl]`, and the Core **"will freely use Gravija"** (charge, Gravija, repeat) `[verified: 3 sources]`.
4. **Counters when targeted:** Negation (takes priority), otherwise **Fire, Blizzard, Thunder, Water, in that order**, party-wide, reflectable. The wiki: more likely the lower its HP; Gestahl: "counters 100% of the time" once Genais is gone (S-13). Negation's chance per the wiki `[single source]`: +3 for each of Armor and Mental Break on the Core, +1 for each Shell and Reflect on the party, **+2 for each Haste**, +1 / +2 for Protect on the rightmost / leftmost member; subtract 3; "divided by 8 to give the percentage chance"; recalculated on each Core turn; it "can use Negation anywhere from one to six times in a row, with three point intervals for each". **The units of this formula are not clear** (S-12): a build must not guess them silently.
5. **The battle ends when the Core dies, even with Genais standing.** `[verified: 2 sources — bover_87, wiki]` Kill order therefore is a real choice.
6. The Core is immune to percentage damage, so its own Gravija never hurts it `[decompiled]` (SinirothX's "it also takes out 75% of its own HP" is S-14).

### 5.4 Overdrive Sin (link 4): the clock

| Sin's turn | What it does | Range for the party | Confidence |
|---:|---|---|---|
| 1, 2, 3 | **Drawn to Sin.** | **FAR**: Wakka, magic and long-range rows only | `[verified: 5 sources]` |
| after the 2nd pull | still out of melee range, but **Rikku's Use and Wakka's Overdrive reach** | — | Gestahl `[single source]`, S-28 |
| 4 → the mouth is fully open | the mouth opens in stages (the wiki gallery shows three stages and "fully open") | NEAR from turn 4 | wiki + bover_87 + Gestahl |
| the last turn | **Giga-Graviton → Game Over** | — | **S-1**: 12th (Gestahl: 3 pulls + 7 gauge turns + 1 full + Giga-Graviton = "Sin's twelfth turn is Game Over"), or 13th (bover_87: 3 approach + 9 opening, then Giga-Graviton; the wiki's "9 turns… then on its second turn" is ambiguous; SinirothX: "13th or 12th (I don't know which yet)") |

**Gaze, the only attack:** a counter after being **targeted six times** by the party, **three times** by an aeon `[verified: 2 sources — bover_87, wiki]`. The whole party takes the damage and **the same one status at 30 %**: Petrify, Confuse or Zombie `[verified: 3 sources — decompile rows, bover_87 ("all members will be attacked with the same status"), wiki]`. **Which of the three it picks is not stated** `[unsourced]`, S-16: Gestahl saw Confuse then Zombie alternating and never Petrify. Default (our estimate): a uniform pick among the three, labelled.

**Any Ward is a full block.** Resistance is subtracted from the chance (`ffx-combat-core.md` §4.1): 30 − 50 < 0, so a Ward never lets Gaze land `[derived]`, matching bover_87 ("even Wards are sufficient to completely prevent the statuses") and the wiki ("Confuse and Stone Ward is sufficient") `[verified: 2 sources + derived]`.

```
odSinTurn(n):
  if n <= 3: DrawnToSin(); if n == 3: range = 'NEAR'; return
  if n < LAST (12 or 13, S-1): OpenMouth(stage); return       // no action row: a pose
  GigaGraviton(); scriptedGameOver()                           // ignores Auto-Life and aeons

onTargeted(by):
  targeted += 1
  if targeted >= (by.isAeon ? 3 : 6): targeted = 0
     by.isAeon ? GazeAeon(DC 50) : Gaze(party, DC 20, pick(Petrify|Confuse|Zombie) @ 30 %)
```

Whether the six-count resets after each Gaze is implied by "every sixth attack" (bover_87) `[derived]`.

---

## 6. Damage tables `[derived]`

Integer chain of `ffx-combat-core.md` §2 (the tracker's `get_damage`), mid roll `damage_rng = 16`, low and high rolls in brackets, no Protect, Shell or Cheer, no crit.

### 6.1 Incoming, per target

**Physical, by the target's Defense** (party DEF runs 20–32 in `zanarkand.ts` and `dreams-end.ts`):

| Row | DEF 20 | DEF 26 | DEF 32 |
|---|---:|---:|---:|
| Smack (Fin, FAR; STR 30, 34) | 1,604 (1,503–1,697) | 1,534 (1,438–1,623) | 1,466 (1,374–1,551) |
| Ram (Fin, NEAR; STR 30, 28) + strong Delay | 1,321 (1,238–1,398) | 1,263 (1,184–1,337) | 1,207 (1,131–1,277) |
| Thrashing (Genais; STR 30, 32) | 1,510 (1,415–1,598) | 1,444 (1,353–1,528) | 1,380 (1,293–1,460) |

**Magic-formula, by the target's Magic Defense** (party MDEF 22–40):

| Row | MDEF 22 | MDEF 26 | MDEF 40 |
|---|---:|---:|---:|
| Venom (Genais; MAG 35, 32; Physical type, Protect halves) | 1,611 | 1,562 | 1,399 |
| Sigh (Genais; MAG 35, 24) | 1,167 | 1,131 | 1,013 |
| Waterga counter (Genais; MAG 35, 42) | 2,204 | 2,137 | 1,914 |
| Core Fire / Blizzard / Thunder / Water (MAG 30, 16) | 566 | 549 | 492 |
| Gaze (Overdrive Sin; MAG 30, 20; Special, Shell does nothing) | 725 | 703 | 629 |
| Gaze vs an aeon (DC 50) | 1,897 at MDEF 37 | 1,821 at MDEF 42 | 1,619 at MDEF 56 |

**Genais's Cura on itself** (MAG 35, 40): **1,480** (1,387–1,566). Gestahl's "about 1,200" agrees in size.

Sanity check against the guides: Gestahl's "about 1,200" for the near attack and ~1,500 for Thrashing, Haunter12O's "around 1,800 to all" at FAR, SinirothX's "about 1,400" far and "about 800" Gaze all sit in or near these bands for parties of their era. **Gravija + Smack is the Fin's lethal pair**: from full HP, a 3,100-HP member drops to 775 and a Smack (~1,550) then kills. `[derived]`

### 6.2 Outgoing, what the presets deal

A plain **Attack** (weapon base 16) into each part; "AB" = Armor Break on the target (Defense 0 and the Armored third removed); Piercing removes only the Armored third.

| Attacker (preset) | Fin / Core (DEF 100, Armored) plain → AB | Overdrive Sin (DEF 40, Armored) plain → AB | Genais out of shell (DEF 80, not Armored; AB immune) |
|---|---|---|---|
| Auron STR 44, Piercing (`zanarkand.ts`) | 1,146 → **2,692** | 1,995 → **2,692** | 1,405 |
| Auron STR 42, Piercing (`dreams-end.ts`) | 999 → 2,345 | 1,737 → 2,345 | 1,223 |
| Wakka STR 38, no Piercing (`zanarkand.ts`) | 247 → 1,744 | 430 → 1,744 | 910 |
| Tidus STR 34 (`zanarkand.ts`) | 178 → 1,258 | 310 → 1,258 | 656 |
| Kimahri STR 32, Piercing (`zanarkand.ts`) | 449 → 1,054 | 781 → 1,054 | 550 |

**Magic:** Lulu at MAG 44, a -ra spell (base 24) does 1,416 into a Fin, 884 into the Core, 1,538 into Overdrive Sin; Firaga (42) 2,607 / 1,628 / 2,832; with **Mental Break** on the target 2,076 (-ra) and 3,822 (Firaga) against all three. Spells ignore the Armored third `[decompiled: ignores_armored on player spells]`.

**What that means** `[derived]`:
- **At FAR against a Fin, Wakka without Armor Break does ~250 a hit.** A FAR-only line is a long fight on magic. Armor Break first is the whole plan, which is exactly the "close in once to inflict Armor Break… then stay away" line of bover_87 and Gestahl's "SMART STRATEGY".
- **Overdrive Sin, a rough race** (not a bench): Sin at Agility 30 recovers 24 ticks per turn. Hasted attackers at Agility 29–34 recover 12, so each gets about two actions per Sin turn. With 8 or 9 melee Sin turns (S-1) that is roughly 16–18 actions each, ~50 for three members. At the preset's Armor-Broken damage (about 1,000 to 2,700) that is **about 85,000–100,000 before Overdrives, aeon Overdrives and the three FAR turns**. **140,000 is out of reach without them**: the "entrance test" bover_87 describes. Every Gaze (about one per Sin turn at that pace) costs a member to Petrify unless the preset carries a Stone Ward. The recommendation sheet's "bench at human speed before committing" stands, and it must use the chosen preset (§7).

---

## 7. The party at this point

### 7.1 Story position

After Yunalesca (our Chapter II, `zanarkand.ts`), the party regroups on the *Fahrenheit*; Lulu proposes the Hymn plan; they visit Bevelle and the Chambers of the Fayth (Auronlu, chapter XIV; bover_87 "The Hunt for Clues", "Exploring Spira"); then they pick "Sin" at Cid's map. **This is the first moment of free airship travel**, so optional content (Celestial Weapons, Anima at Baaj, the Monster Arena, the Magus Sisters) can already be done. bover_87: sidequest parties have "quite an easy time", but a party that "came here straight after Zanarkand" is "in for a fight". `[verified: 2 sources]`

After Overdrive Sin come Inside Sin: the Sea of Sorrow, then **Seymour Omnis at the Garden of Pain (our `garden-of-pain.ts`)**, then Braska's Final Aeon (Chapter III, `dreams-end.ts`). `[verified: 2 sources — bover_87, Auronlu]`

### 7.2 Members, aeons, forced slots

- **All seven fight:** Tidus, Yuna, Auron, Kimahri, Wakka, Lulu, Rikku. No formation forces a party `[decompiled: forced_party ""]`. **Yuna is present**: unlike Evrae, this chapter has Wht Magic, Summon and Pray.
- **Aeons:** the five story aeons (Valefor, Ifrit, Ixion, Shiva, Bahamut); Yojimbo, Anima and the Magus Sisters are optional. Guides summon Bahamut on the Fins and on Genais (Gestahl, Haunter12O), and aeons are counted by the Fins' and the head's counters (wiki) `[verified: 3 sources]` that summoning works in every link.
- The two presets we already ship around this point:

| | `zanarkand.ts` (Chapter II) | `garden-of-pain.ts` (Chapter XII) = `dreams-end.ts` with Inside-Sin finds removed |
|---|---|---|
| HP | 2,450–4,400 | 4,750–6,492 (the Tetra armours' HP +20 %) |
| Offence | Tidus STR 34, Auron 44, Wakka 38, Lulu MAG 44 | Tidus 32, Auron 42, Wakka 33, Lulu 42 (the reverted §4.1 stats) |
| Piercing weapon | Auron, Kimahri | all seven |
| Gaze wards | **Zombie Ward and Confuse Ward on all seven**; **no Stone Ward** | Confuse Ward on Tidus and Yuna; Stoneproof on Lulu (Yuna's Tetra Ring swapped for the Phantom Ring in Chapter XII); **no Zombie protection** |
| Aeons | Ultimania N = 270–299 | N = 300–329 |
| Opening line-up | Tidus, Yuna, Auron | Tidus, Yuna, Auron |

All stat cells in both are `[estimate]` by construction (their own research says so).

### 7.3 What differs for Sin, and the choice for Bailey

1. **Pick the base preset** (Bailey's call, rule 10). Two defensible readings, both `[estimate]`:
   - **A. `zanarkand.ts` as it stands**: bover_87's "straight after Zanarkand". Honest to the hard case; Gaze's Confuse and Zombie are already blocked by its Wards; Petrify is not.
   - **B. `garden-of-pain.ts` with Yuna's Tetra Ring back** (i.e. `dreams-end.ts` less the Inside-Sin finds): continuity with the very next chapter, so the party never loses HP between Overdrive Sin and Omnis. Its armour already carries Stoneproof on Yuna and Lulu.
   - **My recommendation (our estimate): B for link 4, and B for links 1–3 as well**, because the only story event between links 3 and 4 is a save and a shop, and the next chapter is one dungeon later. Whether the Tetra armours could have come from these very fights is not established `[unsourced]`.
2. **Links 1–3 carry HP, MP, statuses and gauges** (§1.2). The engine must chain three battles on one party state.
3. **Link 4 starts rested** and is the one place the player is told to re-equip (§1.2). The Right Fin's possible Stoneproof drop (§2.4) is a sourced reason to let one armour change hands there.
4. **Talk stays on Tidus** for links 1 and 2 only as the Trigger Command owner (the Evrae build keeps the order on Tidus and Rikku). There is no Talk to Sin.
5. **Items that matter:** Al Bhed Potions or Pray after Gravija; Eye Drops or Esuna for Sigh's Darkness; Antidote or Esuna for Venom; Softs for Gaze's Petrify; Holy Water for Gaze's Zombie. Rin sells last-minute supplies on the ship before link 1 `[verified: 2 sources — bover_87, Auronlu]`.
6. **Overdrive gauges** enter link 1 as each preset has them; they build through links 1–3, which the chain must preserve.

---

## 8. Player strategies the chapter must support

| # | Strategy | Needs | Source |
|---|---|---|---|
| 1 | **Close in, Armor Break (and Mental Break), pull back**, then Wakka and Lulu from range | the range state; Breaks landing; FAR Negation only self-cleansing with Mental Break | Gestahl ("SMART STRATEGY"), bover_87, wiki `[verified: 3 sources]` |
| 2 | **Fight up close for speed, and pull back when the core charges** | the charge telegraph; the Gravija whiff; Cid's turn in the forecast | bover_87 ("Just be sure to fly away… if you see the core charging"), Haunter12O `[verified: 2 sources]` |
| 3 | **Protect the centre member and Haste one** to keep the Negation chance low | the wiki's Negation counter | wiki `[single source]` |
| 4 | **Genais first, with physicals** until it shells, then magic and Piercing into the shell; Silence Buster or Silence Grenade to stop Waterga | shell state, Waterga counter, Silence 100 | bover_87, Gestahl, wiki `[verified: 3 sources]` |
| 5 | **Shield an aeon through the Core's Gravija** (Bahamut) | aeons take party-wide hits; Shield | Haunter12O, wiki Genais strategy `[verified: 2 sources]` |
| 6 | **Kill the Core while Genais still stands** | "battle ends when the Core dies" | `[verified: 2 sources]` |
| 7 | **Reflect or NulSpells against the Core's counter spells** (Reflect raises the Negation chance; Nul does not) | reflectable counters; the Core is Reflect-immune so they bounce onto it | wiki `[single source]` |
| 8 | **Overdrive Sin: Hastega and Focus/Cheer during the three pulls, Wakka and Lulu firing; Armor Break the moment it is in range; Overdrives and aeon Overdrives to finish** | the clock; FAR reach; Armor Break | bover_87, Gestahl, wiki, SinirothX `[verified: 4 sources]` |
| 9 | **Wards against Gaze** (Stone, Confuse, Zombie) | Ward subtraction | §5.4 `[verified: 2 sources + derived]` |

---

## 9. Scene, beats, appearance and music

### 9.1 Where and when

- **Links 1–2:** the *Fahrenheit*'s outer deck, in flight, Sin alongside. The ship's **laser cannons on either side** blast off each fin between the links and **break before the head** `[single source: wiki *Fahrenheit*]`; Auronlu's stage notes describe the ship firing on each arm after each fight.
- **Link 3:** on Sin's back, where its Core sits `[single source: wiki Gravija page ("Main Core located on its back")]`; the party jumps from the ship onto Sin (Auronlu).
- **Between 3 and 4:** Sin crashes into the outskirts of **Bevelle at sunset** (Auronlu, "Sinfall"). `[single source]`
- **Link 4:** after Sin rises again, **sprouts wings and props itself on a tower in Bevelle** (Auronlu, "Evenfall"), the ship closes nose to nose with it over Bevelle `[verified: 2 sources — Auronlu; wiki location "*Fahrenheit*, above Bevelle"]`.
- Painted-set detail (light, colour, cloud, how much of Sin fits in frame) is not sourced: author it and show options first (rule 9). The Evrae deck sheet (`ffx-evrae-airship.md` §12.3) is the starting point for the deck.

### 9.2 Beat sheet (paraphrased from Auronlu, chapters XIV and XV; the FMV names are Auronlu's labels, not official)

1. **The plan** (chapter XIV). On the bridge, Lulu reasons that Sin grows calm when it hears the Hymn of the Fayth; attack it head-on while it listens. Wakka and Rikku each claim the idea. The party takes it to Bevelle and to the fayth; Rikku asks Shelinda to tell Spira to sing when a flying ship passes.
2. **Setting out.** Cid broadcasts the Hymn from the ship's speakers; Brother spots Sin. Tidus's plan: get inside, and if the mouth will not do, make a new opening. Brother, halting, asks Tidus to look after Rikku.
3. **The deck.** Rikku and Lulu hear Spira singing. Tidus throws overboard the sphere Yuna recorded on Gagazet (her farewell), and she smiles.
4. **Sin answers:** a shockwave, then a gravity sphere that drags in everything around it, then an explosion outward (Auronlu's FMVs "Terra Graviton", "Gravity Sucks", "Heaven's Fall").
5. **Cid** spots a shine at the base of Sin's arm, a weak spot. Brother: the ship is being pulled in. **BATTLE: link 1.** Trigger Command lines: Tidus asks for closer or farther; Rikku asks her father the same; Cid says to wait a moment, and whoops when he moves.
6. The ship's cannon takes off the first fin; Cid: now the other side. **BATTLE: link 2.** The cannon takes off the second fin.
7. **The main gun is broken.** Cid calls everyone back inside. Tidus refuses: when you have the ball, you score. One party member (the one the player talked to most) speaks to him and jumps; all follow. **BATTLE: link 3.**
8. **Sinfall:** Sin plows into Bevelle's outskirts at sunset. On the bridge: Yuna knows it will come back; Tidus agrees, they must beat the one inside; Cid goes to repair the main gun. **Free control** (save, shop, tour Spira).
9. **Yuna on the deck:** she wonders whether Jecht is in pain; she works out that Yu Yevon will join a summoned aeon, small at first, so they might win without the Final Summoning; she asks Tidus not to go away. Rikku calls them: something is happening to Sin.
10. **Evenfall:** Sin rises with wings over Bevelle. Auron: Jecht is waiting. Cid: the main gun is still broken, no cover fire; take us in, says Tidus. Cid orders the ship flush to the mouth; Brother, halting, promises to get them there. A party member speaks a last line (varies). **Faceoff**, Tidus calls to his father: **BATTLE: link 4.**
11. **Breaking Through:** the ship dives into Sin's open mouth; the guardians on deck watch a Farplane-like passage with a glimpse of Seymour. Inside Sin begins.

`[verified: 2 sources]` for the structure (Auronlu + bover_87's walkthrough order, with the wiki *Sin* and *Fahrenheit* story sections for 1, 6, 7 and 11). **All dialogue is paraphrased on purpose**; the verbatim lines are at the Auronlu URLs, and our own lines follow `research/writing-bible.md`. The only verbatim strings in this file are the in-battle system messages, which are action names in the decompiled tables ("Sin remains motionless.", "Core gathers energy.", "Core is inactive.", "Drawn to Sin.", "Magic absorbed.", "Enters shell." / "Exits shell.").

### 9.3 Appearance, in words for painters (all to be painted as original work, rule 8)

- **Sin is too big for any frame.** The fights address parts of it: the Japanese names of the Fins are "Sin's Left Arm" / "Sin's Right Arm" `[single source: wiki]`; the weak spot Cid sees is at the **base of the arm** (Auronlu).
- **The Fin phase:** the core on the fin **charges visibly** before Gravija (the wiki has a gallery shot titled "Core gathers energy" for each Fin). This is the chapter's telegraph, as Evrae's throat was.
- **Genais:** the same shape as Sinspawn Geneaux, a shelled Sinspawn, "the absolute strongest Sinspawn" `[single source: wiki]`; its shell state must read at a glance.
- **The Core:** on Sin's back, inactive until Genais shells, then charging (wiki gallery: "Core gathers energy").
- **The head:** a face that approaches over three turns and then **opens its mouth in stages** until fully open (wiki gallery: three "open mouth" stages and "mouth fully open"); **Gaze** is a look from that face (wiki gallery "Gaze"). The HUD clock and the painting should agree: the mouth *is* the clock.
- **The *Fahrenheit*:** as `ffx-evrae-airship.md` §12.1 (deck lettering, gold dial), plus the side laser cannons that exist only in this sequence `[single source: wiki]`.

### 9.4 Music (reference only; we ship original cues, rule 8; Bailey judges by ear, rule 13)

| Track | When | Confidence |
|---|---|---|
| "Peril" (危機) | "before the party confronts Sin on the *Fahrenheit*" | `[single source: wiki OST]` |
| "Hymn of the Fayth – Spira" | "Sung by the people of Spira to subdue Sin" | `[single source: wiki OST]`; the broadcast itself is in Auronlu |
| **"Assault" (襲撃)** | "during the battle with Sin, excluding the head"; it contains elements of "Launch" and the Hymn | `[single source: wiki OST]`; the *Fahrenheit* page adds it plays "when the party plans to fight Sin" |
| the head (link 4) | **not stated** | `[unsourced]`, S-21 |

Mood brief is for the options round, not here. Two sourced facts it should use: the Hymn is part of the plan (so a hymn-derived motif is canon-grounded), and link 4 is a countdown.

---

## 10. Conflicts, gaps and the verify-before-shipping list

| # | Item | Status / what to do |
|---|---|---|
| **S-1** | **Giga-Graviton on Sin's 12th or 13th turn.** Gestahl counts 12 (3 pulls + 7 + 1 + Giga-Graviton); bover_87 reads 3 + 9, then Giga-Graviton (13th); SinirothX: "13th or 12th (I don't know which yet)"; the wiki's "the next nine turns… then on its second turn" is ambiguous. | **Open, and it matters** (one Sin turn ≈ 6 party actions). Default **our estimate: the 13th turn** (bover_87, GameFAQs, the Remaster-era guide), shown on the HUD clock. **Check in the Steam HD Remaster** (ask Bailey before taking over the screen; `feedback-real-game-steam-version`). |
| **S-2** | Genais leaving its shell: wiki "when its HP reaches 12,000" + Scan "recovers with Cura and exits next turn" vs bover_87 "if pushed below 12,000 HP, it will emerge" vs Gestahl "won't necessarily exit". | Default: wiki + Scan (heals up to 12,000, leaves next turn). Verify. |
| S-3 | Venom's Slow: bover_87 says Poison and Slow. Decompile (Poison only), wiki (Slow only for Gui's Venom), SinirothX and Gestahl say Poison. | Resolved: **Poison only.** |
| S-4 | Right Fin AP: decompile, wiki, SinirothX 17,000 (25,500); bover_87 16,000 (24,000). | Resolved: 17,000. |
| S-5 | Right Fin equipment: bover_87 prints armour "Stonestrike", SinirothX weapon "Stoneproof". Decompile and wiki: weapon Stonestrike, armour Stoneproof. SinirothX's rare drop "Lv. 2 Key Sphere" vs Lv. 3 in the decompile. | Resolved: decompile. |
| S-6 | Threaten: bytes 0 (landable) on all five; wiki, Gestahl and SinirothX list it immune. | Default **immune** (Evrae C-4). Verify only if anyone cares. |
| S-7 | Overdrive Sin's equipment ability rolls: decompile modifier 16 → 1–2; wiki, bover_87, SinirothX 1–3. | Default decompile (Evrae C-18 shape). Moot unless drops are built. |
| S-8 | Opening range of the Fin fights. Gestahl: FAR, explicitly; bover_87 consistent; Brother's "we are pulled by Sin" line hints NEAR. | Default FAR. Verify. |
| S-9 | Gestahl's impression that the near attack (~1,200) is stronger than the far one (~800). | Resolved: decompile (Smack 34 far > Ram 28 near) + bover_87 + wiki. |
| S-10 | The wiki *Fahrenheit* page says the Fins "can get closer during their turn"; the wiki Left Fin page and the decompile say those two rows are unused. | Default: **the Fins never move the ship.** |
| S-11 | Near Negation as a counter on being targeted (bover_87, Gestahl, wiki) vs "on the 6th attack it gets" (SinirothX). The Fins' row target is "All", not a counter type (the Core's is "Counter All"); the trigger lives in the unread script. | Default: counter on targeted, 3 sources. |
| **S-12** | The Negation chance formulas (Fins /16 and /12, Core /8 "percentage", "one to six times in a row, with three point intervals") are single-source and their units are unclear; the left/right Protect weights look like a bitfield artefact. | **Open.** Ship behind named tunables, never silently. A GameFAQs AI source or an in-game count would settle it. |
| S-13 | Core counters: wiki "more likely at lower HP"; Gestahl "100 % of the time" after Genais dies; SinirothX single target, power 12. | Data resolved by the decompile (party, 16). The counter chance curve is `[unsourced]`. |
| S-14 | SinirothX: the Core's Gravija takes 75 % of its own HP. Decompile: the Core is immune to percentage damage; wiki: it hits Genais, not itself. | Resolved: the Core is unaffected. |
| S-15 | Gestahl: Genais absorbs Black Magic aimed at the Core "UNLESS HE'S IN HIS SHELL". Others: always. | Default: always while Genais lives. Verify. |
| S-16 | Which Gaze variant fires. | `[unsourced]`. Default our estimate: uniform among three; label it. |
| S-17 | Gravija's wording: the wiki Scan text "by 3/4"; Gestahl's transcription "to 3/4". | Resolved: 75 % of current HP as damage `[decompiled]`. |
| S-18 | Genais Agility 25 (decompile, SinirothX) vs "26 outside shell" (wiki). | Default 25; verify with the turn forecast if it ever matters. |
| S-19 | Cid fires no missiles in the Fin fights (Gestahl only; others silent). | Default: no missiles. |
| S-20 | A "cancel the previous order" Trigger option (wiki *Fahrenheit* only). The Evrae file does not have it. | **Open.** Check the Evrae engine and the Steam copy together; if real, it applies to Evrae too (an FFX-only fix to both chapters). |
| S-21 | The music for link 4. | `[unsourced]`. |
| S-22 | Auronlu's stage notes call the first fight the "right armpit" and then say the ship shot off the left arm. | Resolved by the formation names and bestiary order: **Left Fin first.** |
| S-23 | Haunter12O gives Genais 25,000 HP. | Resolved: 20,000 (5 sources). |
| S-25 | Whether the Gravija turn counts toward the next three regular actions. | `[unsourced]`; default no. |
| S-27 | An aeon's hit counts as two on the Fin counter. | `[single source: wiki]`. |
| S-28 | Use and Wakka's Overdrive reach Overdrive Sin after the second pull. | `[single source: Gestahl]`. Verify. |
| S-29 | The party preset (§7.3). | `[estimate]` by construction; **Bailey picks A or B.** |

(S-24 and S-26 were checked and are not conflicts: the Right Fin's four-hit rule and Genais's half-HP shell threshold agree across their sources.)

---

## 11. Minimum mechanic list (FFX only; nothing here is built)

What the FFX engine already has, from the Evrae and Yojimbo chapters (names from `src/battle/ffx/`, read, not changed): a NEAR/FAR range state and `targeting.ts#reachesAtRange` with Wakka's ranged weapon; the Trigger Command order to Cid resolved on Cid's turn with Cid last in the tie-break (`ffx-combat-core.md` §1.6 already reserves him "for this fight and the Sin-fins fight"); counters; Armor/Mental Break; aeons and Shield; Doom.

**NEW for this chapter:**
1. **A four-link chapter** where links 1–3 share one party state (HP, MP, statuses, gauges) and link 4 starts rested (§1.2).
2. **Cid without missiles** (S-19), and possibly a cancel order (S-20).
3. **The Fin AI** (§5.1–5.2): the shared hit counter by range, the three-then-charge Gravija cycle near only, the long-range Gravija whiff, the Right Fin's 16,250-HP latch.
4. **Negation** as a both-sides status wipe near and a self-cleanse far, with its chance behind named tunables (S-12). The HUD must show what Negation took away.
5. **Percentage-current damage** (Gravija, 75 %, cannot kill) and **percentage-total with Death** (Giga-Graviton).
6. **Genais's shell state**: Armored and percentage-immune inside, Waterga counter outside, Cura counter inside, the Core's "Magic absorbed." redirect, and the Core out of melee range while Genais lives.
7. **"Core is inactive." gating** and the Core's counter chain (Negation first, then Fire → Blizzard → Thunder → Water).
8. **Victory on the Core's death** regardless of Genais.
9. **Overdrive Sin's clock**: three pulls at FAR, then the melee window, then a **scripted Game Over** that ignores Auto-Life and aeons (S-1 decides the length). The clock must be visible: a mouth that opens, and a number.
10. **Gaze** as a six-targetings counter (three for an aeon), party-wide, one status at 30 %, Ward-blockable.
11. **Before any of this: end-state options** (rule 9) for the Fin deck at NEAR and FAR, the Genais shell moment, the Core on Sin's back, Overdrive Sin's mouth with the clock, the Trigger Command widget (already a flavour at Evrae), and the music cues; then a painting pilot at colossal scale; then a bench at human speed with the preset Bailey picks.

---

## Sources

**GameFAQs (read 2026-09-27 with `curl`, HTTP 200; the FAQ list through headless Playwright)**

- bover_87, *Final Fantasy X Remaster Walkthrough (PC)* v1.3, page "Sin": https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/79145/sin
- Gestahl & FFXMania, *Boss Guide* v2.0 (updated 2002-09-03), bosses 28 and 29 (credits Split Infinity for the Genais pattern and the Fin cycle): https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/16895
- SinirothX, *Enemy Database* v2.0 (updated 2007-01-31), entries #32 Left Fin, #33 Right Fin, #34a Sin's Core, #34b Sinspawn Genais, #35 Overdrive Sin: https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/24166
- Haunter12O, *Boss Guide* v1.9 (updated 2002-01-16), the Sin section: https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/15427
- FAQ listing: https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs

**Final Fantasy Wiki** (`api.php?action=parse&prop=wikitext`, browser user agent, 2026-09-27)

- Sin (head) [Overdrive Sin], revid 4004207: https://finalfantasy.fandom.com/wiki/Sin_(head)
- Left Fin, revid 3981190: https://finalfantasy.fandom.com/wiki/Left_Fin
- Right Fin, revid 4031682: https://finalfantasy.fandom.com/wiki/Right_Fin
- Sinspawn Genais, revid 4016986: https://finalfantasy.fandom.com/wiki/Sinspawn_Genais
- Sin (core), revid 4015250: https://finalfantasy.fandom.com/wiki/Sin_(core)
- Sin (fin) [the S.S. Liki fin, for disambiguation], revid 3981219: https://finalfantasy.fandom.com/wiki/Sin_(fin)
- Cid (Final Fantasy X boss), revid 3963151: https://finalfantasy.fandom.com/wiki/Cid_(Final_Fantasy_X_boss)
- Final Fantasy X enemy abilities, revid 4008011: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_enemy_abilities
- Fahrenheit, revid 4050135: https://finalfantasy.fandom.com/wiki/Fahrenheit
- Sin (Final Fantasy X), revid 4045228: https://finalfantasy.fandom.com/wiki/Sin_(Final_Fantasy_X)
- Giga-Graviton, revid 4004205: https://finalfantasy.fandom.com/wiki/Giga-Graviton
- Gravija, revid 3739306: https://finalfantasy.fandom.com/wiki/Gravija
- Final Fantasy X Original Soundtrack, revid 4011106: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_Original_Soundtrack

**Decompile-derived data** (Grayfox96/FFX-RNG-tracker, pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680`, read into memory)

- `ffx_rng_tracker/data/data_files/ffx_mon_data.csv`, `ffx_mon_data_hd.csv`: `m136`–`m140`, `m149`
- `ffx_monmagic2.csv` (file 6): rows 41, 42, 57–60, 142–160, 166–168, 182–189, 196, 197; `ffx_command.csv` (file 3): rows 44, 45, 72, 76
- `monster_actions.json`, `formations.json` (`bosses.left_fin`, `right_fin`, `sin_core`, `overdrive_sin`), `items.csv`, `autoabilities.csv`, `text_characters.csv`
- `ffx_rng_tracker/data/monsters.py`, `actions.py`, `constants.py`, `text_characters.py`; `events/character_action.py` (`get_damage`, `_get_power`, `_get_mitigation`)

**Script**

- Auronlu, *FFX Game Script*, Chapter XIV "Mika, Baaj, Fayth": http://auronlu.istad.org/ffx-script/chapter-xiv-mika-baaj-fayth/
- Auronlu, *FFX Game Script*, Chapter XV "Showdown With Sin": http://auronlu.istad.org/ffx-script/chapter-xv-showdown-with-sin/

**Local research and data consulted:** `docs/plans/next-content-2026-09-27.md`; `research/ffx-evrae-airship.md` (§2, §4, §9, §10 C-4/C-6/C-7/C-18, §12); `research/ffx-yojimbo.md` (format, Y-4 rule); `research/ffx-combat-core.md` §1.2–§1.6, §2, §4.1; `research/ffx-yunalesca.md` §11–§12; `research/ffx-bfa-yu-yevon.md` §1.5, §4; `research/ffx-seymour-anima-macalania.md` C-6 (Zanmato 0-based); `src/data/ffx/builds/zanarkand.ts`, `dreams-end.ts`, `garden-of-pain.ts`, `fahrenheit.ts`.

---

## 12. Verification log (2026-09-27)

| # | Claim | Check | Result |
|---:|---|---|---|
| 1 | Parser reads the same table the earlier files read | formations `evrae` = [evrae, cid, dummy]; Cid `m149` HP 410 | agree with `ffx-evrae-airship.md` |
| 2 | HP 65,000 / 65,000 / 20,000 / 36,000 / 140,000 | decompile + wiki + bover_87 + SinirothX + Gestahl | agree (Haunter12O 25,000 for Genais: S-23) |
| 3 | PS2 vs HD | byte diff of `m136`–`m140` | identical except byte 403 (unread) |
| 4 | Gravija = 75 % of current HP | row Percentage Current, base 12 → 12/16 | agree with wiki, bover_87, SinirothX |
| 5 | Giga-Graviton = 100 % max HP + Death, scripted Game Over | row Percentage Total 16 + Death 255; 4 guides for the Game Over | agree |
| 6 | Ram near (28, strong Delay), Smack far (34) | decompile rows + wiki table | agree; Gestahl's impression differs (S-9) |
| 7 | Negation near hits both sides, far only self | rows 6:145 "All", 6:167 "Self" + wiki | agree |
| 8 | Gaze: three statuses at 30 %, aeon version 50 | rows 6:157–6:160 + wiki table + bover_87 | agree |
| 9 | Genais: Venom (Poison), Thrashing, Sigh (Dark 3), Waterga counter, Cura counter | rows + 4 guides | agree; bover_87's Slow rejected (S-3) |
| 10 | Armor/Mental Break land on the Fins, Core, head; not on Genais | resistance bytes + wiki + bover_87 | agree |
| 11 | Equipment abilities per part | decompiled ability lists | agree with wiki; bover_87 and SinirothX typos (S-5) |
| 12 | Everything "Always hits" | hit-chance formula index 0 on every row | as stated |
| 13 | Fin attack counters (33/67/100 near, 7 far; Right Fin 4 / 5 / 16,250) | bover_87 + wiki | agree |
| 14 | Genais Venom, Venom, Thrashing | bover_87 + wiki + SinirothX + Gestahl | agree |
| 15 | The head's first three turns are "Drawn to Sin." | 5 sources | agree |
| 16 | Giga-Graviton's turn | 4 sources | **disagree (S-1)** |

---

## 13. Research addendum (2026-10-08): how tall Sinspawn Genais and Sin's Core stand in the PS2 game, and how tall the build draws them

**FFX only** (rule 14: Chapter XVII, link 3, Sin's back; FFX-2 has no Sin). Asked because the build drew both at the stage's boss height, 4.1 world units against a party of 1.82 (Genais 20 percent too small and the Core 37 percent too big by the game's numbers), and the rest of the build is moving to real sizes (Bailey, 2026-10-07: "I'll go with your recommendations full speed"; and on 2026-10-08, after the giants options study, **"I'll go with all of your recommendations"**, which took the study's recommendation for this link: **both at their real size, at today's spots**, and **no change to the Fins**). This section is the measurement behind `src/data/ffx/fiend-stature.ts` `FFX_GIANT_STATURE['sinspawn-genais']` and `['sin-core']`.

**13.1 Method.** The original NTSC-U disc (SLUS-20312, CRC BB3D833A) in PCSX2 v2.8.2, read by the project's own sizes lane (second pass, 2026-10-08; `D:/Tools/pcsx2-ffx/re/dumps/boss-sizes.json`, outside the repository: facts only, no frame, memory dump or code is in it). A save state of the fight at its first command menu is reloaded before every shot and N frames are stepped; Tidus is a sliding marker where one can be put at the part's depth (Genais: 55 units either side, the harmonic mean of the two scales, which differ by 9 to 21 percent); the part's silhouette gives rows over that scale. `[single source: own measurement]`

**13.2 The reads** (game units, the scale on which Tidus is 18.15). **Sinspawn Genais**, model `m139` (mesh `m102`, script scale 0.8): four reloaded shots (N = 90 to 160, the camera pulling out as it goes, 9.6 to 7.9 px per unit) read 50.1, 52.0, 47.5 and 44.2, median 48.8 at 9.3 px per unit, **best 49**; he is 71.9 wide (the claws spread to 100 late in the cycle, and the head floats above the stalk at some moments). The lane's first number, 77.6, was the maximum of one joint over the loop and is withdrawn; the static law (raw mesh 25.1 x engine scale `C` 4 x script scale 0.8, `D:/Tools/rea/FINDINGS-sizes.md` section 4) gives 80.3, which is the default pose `[datamined: FFX HD Remaster build 25501027, bind pose, one reader]`; the joint's mean over the loop (52.7) and `E` (40) bracket the silhouette. He stands 100 units from the party. **Sin's Core**, model `m138` (named "Sin" in the monster table, bestiary #171): three shots read 30.2, 30.9 and 31.7 at 8.7 px per unit, **best 30**, the shell with its spikes; at its own place it is a 12 by 20 pixel speck at the frame's edge, so the part was moved (+21 to -70 in z) to stand in view, Tidus stood 75 units to its right only (8.27 and 7.2 px per unit; the left side was hidden or out of frame), and the scale was raised 5 percent for the left and right gradient seen at Genais's depth. It floats: its joints run 30 to 57 above the floor, a bone span of 27, which is not a height above the floor. Static law 27.2 (width 54, the live width 58 to 68), `E` 16; it stands 188 units off. Over Chapter XVII's party (Tidus 18.15, Yuna 16.53, Auron 19.28, mean 17.99): Genais **2.72 times**, the Core **1.67 times**. `[single source: own measurement]`

**13.3 How sure: medium for both.** The lane's labels: the silhouette median over Genais's animation, with the old maximum replaced by a measurement; the Core's silhouette with the one-sided scale and its 5 percent correction. No independent check of the lane's numbers flagged these two rows (it flagged Flux's scale and the Braska group's clipping, `research/ffx-seymour-flux.md` section 13, `research/ffx-bfa-yu-yevon.md` section 9); the Core's one-sided scale is the weakest part (a few percent either way) and Genais's own range, 44 to 52, is what his animation does.

**13.4 The Fins and the head are not here.** The Left and Right Fin (`m136`, `m137`, engine scale `C` 4 times script scale 10) are 1,233 by the static law (the scale vector 10 was confirmed live, but the live joints cover bones only and read 20 percent under it) and stand about 1,212 units away, so their size is an angle, not a ratio: **low** confidence, and the options study's pick was **no change** (they already read 2.9 times the party and the game's own angle would fill the sky). Overdrive Sin's head (`m140`, 1,701 by the static law at 1,997 away, the joints 41 percent under it) is not in this table either: no pick. Nothing here changes either scene.

**13.5 What the build does with it.** Bailey's pick is the real size at today's spots: `FFX_GIANT_STATURE` rows with share 1, so on the deck's party height (Tidus's 1.82) Genais stands `1.82 x 49 / 18.15` = **4.913 world units** (+20 percent from 4.1) and the Core **3.008** (-27 percent), both named in the Sin plate's staging (`evrae-airship-sin.ts` `SIN_GENAIS_CORE_STAGING`, carried by `makeAirshipDeckScene`'s new optional `staging`; Chapter VIII's Evrae and Chapter XVIII's head have no such ids and are untouched) and **pinned at the spots they stood on**, (-0.93, -4.1) and (5.89, -5.3): the formation solver spreads figures by their heights and would otherwise put the taller Genais between and the Core on its left. At the first command menu of link 3 (seed 1, headless, 1600x900, the deck at NEAR as on the live build and in the study): Genais reads **2.12 times the party** (live 1.76; the study 2.12), 540 px against 451, the Core **1.14** (live 1.53; the study 1.11, which stood it 1.35 units to the right), 288 px against 393, the party at 99 percent, nothing cut, the HUD 19 and 9 percent over them (live 18 and 17). On a 390x844 phone Genais reads 2.20 (live 1.83; the study 2.25) and the Core 1.35 (live 1.82); the Core stands at the right edge of the phone's slice, 79 percent outside it on the live build and 95 percent now that it is smaller, a placement this change did not make and does not move (its spot is today's). Presentation only: the battle engine's output is unchanged.

**Repair of 2026-10-08 (the independent check of `b8f01e2e`; `docs/handoff/r3942-giants-ffx.md`, "Repair of 2026-10-08").** The pins in 13.5 are corrected: **Genais at (-0.93, -4.3)**, 0.2 further back than the (-0.93, -4.1) above, and **the Core at (5.90, -5.3)**, from 5.89. Live's formation solver places Genais per window shape (x -0.915 at 1600x900, -1.109 at 1440x900, -1.300 at 1024x768, -0.820 on a phone, all at z -4.1) and the Core at 5.87, 5.90, 5.90 and 5.75, and a pin is one spot: at -4.1 Genais stood 0.02 to 0.04 nearer the party than live at 16:10 and 4:3, and the Core 0.008 nearer Auron at those two shapes, which Bailey's standing preference of 2026-10-08 (no figure nearer the party than on live) rules out. Measured at the first command menu of link 3 (seed 1, headless Chromium on the real GPU, the Sensor card up) at 1600x900, 1440x900, 1024x768 and 390x844: Genais's ground distance to the nearest party member is **1.80 against live's 1.60, 1.61, 1.64 and 1.61**, to the party's centre **3.30 against 3.12, 3.20, 3.30 and 3.07**; the Core's is 4.76 against 4.74, 4.76, 4.76 and 4.65 (the centre 6.76 against 6.74, 6.76, 6.76 and 6.64): **nothing is nearer at any of the four shapes** (36 rows over the repair's four chapters, 0 nearer). Genais reads **2.09 times the party** at the three desktop shapes (532 px at 1600x900; the study 2.12) and 2.18 on the phone (the study 2.25); the Core 1.14 and 1.35 (the study 1.11 and 1.38), the party at 99 percent of live's. The Core stands 94 percent outside the phone's slice (80 percent on live): its spot is a world position, and any move that brings it into the slice brings it nearer the party, which is ruled out; the slice is `phoneFraming.ts`'s.
