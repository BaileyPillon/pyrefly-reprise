# FINAL FANTASY X — Sinspawn Gui, Operation Mi'ihen (Mushroom Rock Road, the Ridge): Implementation Reference

**Target project:** Pyrefly Reprise / Echoes of Spira (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-10-10 ~00:10 EDT, asked "If I were to add in 2 chapters what would they be?". The driver recommended this fight ("Seymour fights on your side, the only fight where you command him") and the FFX-2 Experiment. Bailey: "I'll add in those 2 chapter recommendations." This file is the research half for the Gui chapter only. **Nothing is built** (AGENTS.md hard rule 9, end state first): `concepts.md` (options) and `art-brief.md` sit beside this file. Intended repo path once installed by the driver: `research/ffx-sinspawn-gui.md`. I wrote to no repo.
**Research date:** 2026-10-10
**Encounter:** **Sinspawn Gui**, two linked battles on the Ridge of Mushroom Rock Road during Operation Mi'ihen. The same four-part enemy is fought twice: a body, a head and two arms. Bestiary entries #045 (first body), #046 (second body), #047 (head) `[single source: wiki]`.
**Internal ids:** body **`m117`**, head **`m160`**, arm **`m161`** (two instances). Tracker formations `bosses.sinspawn_gui_1` and `bosses.sinspawn_gui_2`. Formation scripts (Steam build 25501027): **`kino02_00`** (battle 1) and **`kino03_10`** (battle 2) `[game script, C]`.
**Recommendation (§14):** build it, **FFX only**, as **one chapter of two chained links** (a full-party link, then a forced Yuna, Auron and Seymour link). Every number is decompiled or read from the game's own tables; the multi-part behaviour is read from the game's scripts, **run in the lane's mock interpreter** (§4) and agrees with four written guides. The engine already has most of what the fight needs; the genuinely new pieces are a **guest party member** and **a chain link that changes the line-up**. The open items (§11, §12) are small and none blocks the options round.

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

| Tag | Meaning |
|---|---|
| `[decompiled]` | Read from the game's `ffx_mon_data(_hd)` record bytes and the tracker's action, formation and character tables in Grayfox96/FFX-RNG-tracker, **pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680`** (the same commit as the Natus, Omnis and Yojimbo files). Rows `m117`, `m160`, `m161` of `ffx_mon_data_hd.csv`, parsed with that repository's own byte layout (`monsters.py`). |
| `[game table]` | Read from the live Steam build's own kernel tables (build 25501027) with our own readers on this machine, read-only: command records through `D:/Tools/rea/tools/q-ffxcmd.mjs`, Seymour's record in the extracted `ply_save.bin`, the model-size table through `size-monsters.mjs`. |
| `[game script]` | Read from the game's own battle AI and formation scripts (same build), disassembled with our Atel disassembler (`D:/Tools/rea/tools/atel.mjs --ffx --vars`). It is the game itself, so where the written sources disagree it decides. **Confidence A where a row says "run": I also ran the real bytecode in the Yunalesca lane's mock interpreter** (`D:/Tools/ffx-parity/ai/ffx-yunalesca-bfa/vm.mjs`; the world is a mock, the script is the game's; my runs are `work/run-gui-vm.mjs` to `run-gui-vm4.mjs`). **Confidence C: read by eye only** (the formation scene effects, the RNG-stream accounting, and how the real engine orders a queued reaction). Only facts and offsets are kept here: no game text and no code. |
| `[verified: N sources]` | N independent sources agree. The FF Wiki counts once, however many of its pages say it. |
| `[single source]` | Only one source says it. |
| `[derived]` | Computed by me from decompiled constants with the damage chain in `research/ffx-combat-core.md` §2 (my implementation reproduces that file's reference tables, 8 of 8). |
| `[estimate]` | My own design judgement, not a measured fact. |
| `[conflict]` | The sources disagree. Listed again in §11. Bailey's tie-break (D-214): where nothing in the game settles it, GameFAQs' reading, labelled "our estimate". Here the game's own tables settle most of them. |

### 0.2 What I did

1. Read `AGENTS.md`, `docs/PRODUCT-BRIEF.md` (the main repo's copy, `D:/Final Fantasy/docs/`; the release tree `D:/pyrefly-r39-int` has none), `research/writing-bible.md`, `docs/ARCHITECTURE.md`, `src/data/encounters.ts`, `research/ffx-seymour-omnis.md` (this file's format model), `research/re-ffx-ai-seymour.md` (the script-note format), `docs/plans/next-content-2026-09-27.md` (the earlier plan row for this fight) and the standing rules in `DECISIONS.md`.
2. Read the Final Fantasy Wiki in the **built-in browser pane** (WebFetch returns 402 for Fandom; the pane worked): *Sinspawn Gui*, *Seymour Guado*, *Mushroom Rock Road*, *Operation Mi'ihen (Final Fantasy X)*, *Final Fantasy X enemy abilities*, *Final Fantasy X: Original Soundtrack*. Fetched 2026-10-10; no revision ids were exposed by the pane (the 2026-09-27 plan quotes *Sinspawn Gui* revid 4029189).
3. Read the guides in the same pane: GameFAQs (bover_87, *FFX Remaster Walkthrough (PC)*, "Mushroom Rock"), Jegged (FFX Walkthrough 12), GamerGuides (HD walkthrough page and bestiary entry), Samurai Gamers (boss guide), The Let's Play Archive (The Dark Id, Part 49), Auronlu's FFX game script, Chapter V.
4. Read the decompile-derived tables as text in the pane (nothing saved): `formations.json`, `ffx_mon_data_hd.csv` and `ffx_mon_data.csv` rows 117, 160, 161, `monster_actions.json` (`m117`, `m160`, `m161`), `characters.json`, and the code `monsters.py`, `characters.py`, `constants.py`. **Byte-diffed PS2 against HD** for the three rows (§2.5).
5. Read the game itself, read-only, with tools the re-parity track built: decoded the command records Gui and Seymour use; **disassembled the three monster scripts and both Ridge formation scripts** into `D:/Tools/pyrefly-scratch/2026-10-10/new-chapters/ffx-sinspawn-gui/work/` (`m117.dis.txt`, `m160.dis.txt`, `m161.dis.txt`, `kino02_00.dis.txt`, `kino03_10.dis.txt`); read Seymour's player record in `ply_save.bin`; ran the size table. The scripts were also cross-read against the Yunalesca lane's `allmon/m117.txt`.
6. Ran the damage chain on the decompiled numbers (`work/damage-calc.mjs`, `work/gui-tables2.mjs`; §3.3).
7. **Ran the real `m117`, `m160` and `m161` bytecode in the Yunalesca lane's mock interpreter** (`work/run-gui-vm.mjs` to `run-gui-vm4.mjs`; read-only, nothing written outside `work/`): the body's turn rhythm, the arm regeneration, the head's cycle and cancel, the relay, the shield and the second-battle overrides all behave as §4 says. One first-draft reading was wrong and is corrected (§3.2: the shield catches physical commands only).
7. **Not retrievable or not used:** wiki and guide images could not be hot-linked (403) and a screenshot of the Fandom page timed out, so **Gui's look is described from text only** (§7, §9); I looked at no retail image and saved none. WebFetch's summariser was not used for any number.

### 0.3 Game case (AGENTS.md rule 14)

**FFX only.** Sinspawn Gui, Seymour as a guest, Requiem, the CTB, Stoic and the FFX status set exist only in *Final Fantasy X*. *X-2* has no Gui. FFX-2 Chapter XV (the Den of Woe) lies **under this same road** and is a different, FFX-2-only fight (`research/ffx2-gippal-den-of-woe.md` §0); nothing here applies to it. The optional Dark Magus Sisters also fight on Mushroom Rock Road in the International, PAL and HD versions `[single source: wiki]`: a separate encounter, not part of this chapter.

### 0.4 What the sources settle (the questions in the brief)

| Question | Answer | Confidence |
|---|---|---|
| How many fights is this sequence? | **Two battles, one boss, one chapter.** Battle 1: the player's three (from six) against Gui. A cutscene (Sin's attack). Battle 2: Yuna, Auron and Seymour against a rematch with the reanimated body. Two formation entries (`sinspawn_gui_1`, `_2`), two formation scripts, two sets of numbers. The wiki counts them as one boss. | `[decompiled]` + `[game script, C]` + wiki + GameFAQs + Jegged + GamerGuides `[verified: 5 sources]` |
| Gui's "first and second form"? | **Not forms.** There is no transformation: the second body is the same model with less HP, STR and MDEF (§2.1, §4.7), returning after Sin's blast. | `[game script, A: run]` + wiki ("reanimated body") |
| The arms? The head? | **Parts of the same enemy, not separate fights.** Four parts: body, head, left arm, right arm. **Only the body must die** to end a battle. The arms never take turns and **regenerate**; the head acts on its own three-turn cycle and is **out of melee reach**. | `[game script, A: run]` + GameFAQs + GamerGuides + wiki `[verified: 4 sources]` |
| What can Seymour do? | A full guest kit: staff Attack (Piercing), **Black Magic tiers one and two in all four elements**, **Cure and Cura**, **Scan** and Nul spells (exact list open, §5.2), items, the **Requiem** Overdrive (**Stoic**: it fills only when he takes damage), and Sensor on his armour. 1,200 HP, **999 MP**. He cannot summon Anima, is never in battle 1, and is never controllable again. | `[game table]` + `[decompiled]` + wiki + GamerGuides + LP `[verified: 4 sources]`; the White Magic list `[conflict]`, G-8 |
| Does Anima appear in play or only in a cutscene? | **Neither, in this sequence.** She cannot be summoned while Seymour is playable, and Auronlu's script for the whole chapter never mentions her. Her only earlier appearance is a cutscene in Luca (the wiki); she first appears in play, as an enemy, in the Macalania fight (our Chapter VII). | wiki + LP + Auronlu (no mention) + GameFAQs (no mention) `[verified: 4 sources]` |
| "The only fight where you command him" | **True, but only battle 2.** Seymour is not in battle 1. | wiki + GameFAQs + `[decompiled]` forced party `"yas"` |
| "Seeing his Requiem Overdrive" | **True, and it is hard to see.** It is only ever available here, and on Stoic it fills only as he is hurt (§5.4). | wiki + LP `[verified: 2 sources]` |

---

## 1. The sequence at a glance

| # | Beat | What the sources say | Confidence |
|---|---|---|---|
| 1 | **The Ridge.** The party reaches the command center of Operation Mi'ihen: the Crusaders have caged the sinspawn to lure Sin; Maesters Kinoc and Seymour watch; the party may talk to the soldier to begin. | wiki Operation Mi'ihen + Auronlu + GameFAQs + Jegged `[verified: 4 sources]` | |
| 2 | **Battle 1.** The caged sinspawn fuse and break out. The party fights Gui: **no forced party** (the player picks three of six), **Switch allowed**, Escape and Flee off. Music: "Peril". | `[decompiled]` `forced_party ""` + `[game script, C]` `kino02_00` disables only Escape and Flee + wiki | |
| 3 | **After battle 1, no spoils screen.** AP and Gil from battle 1 are paid with battle 2's. | GameFAQs `[single source]`; Jegged: battle 2 "begins immediately" | |
| 4 | **Sin's attack.** Sin rises, the cannons fire, spawn shed from its sides, then its great beam wipes the beach and the command center; the party is scattered. | Auronlu + wiki (paraphrased) `[verified: 2 sources]` | |
| 5 | **Battle 2.** Yuna comes to in the ruined command center and finds Seymour already grappling the reanimated body; Auron joins him, Yuna follows. **Forced party Yuna, Auron, Seymour** (`"yas"`), **Switch disabled**, **HP and MP carry over unhealed**. Music: "Challenge". | `[decompiled]` + `[game script, C]` `kino03_10` disables Escape, Flee **and Switch** + Auronlu + wiki + GameFAQs ("you aren't healed in between") | |
| 6 | **Spoils.** Lv. 1 Key Sphere x3 (x6 on an Overkill), a Sleepstrike weapon or Sleepproof armour, plus all the AP and Gil. | §2.6 | |
| 7 | **Afterwards.** Sin turns for the sea; Tidus wakes on the beach among the fallen; Yuna tries to summon and Seymour stops her; later he offers to be her support through the pilgrimage. | Auronlu (paraphrased) | |

Both battles take place on the **Ridge** `[verified: 2 sources: wiki enemy list, GameFAQs]`.

---

## 2. Enemy stat blocks

### 2.1 Sinspawn Gui, the body (`m117`, bestiary #045 / #046)

| Field | Battle 1 | Battle 2 | Confidence |
|---|---:|---:|---|
| HP | **12,000** | **6,000** | 12,000 `[decompiled]` + wiki + GameFAQs + Samurai + GamerGuides + Jegged `[verified: 6 sources]`. 6,000: the script writes max HP and HP := 6,000 when the battle id is the second Gui battle (m117 init @0x0279 to 0x02bb) `[game script, A: run]` + wiki + GameFAQs + Jegged + GamerGuides `[verified: 5 sources]` |
| MP | 30 | 30 | `[decompiled]` + wiki + Samurai |
| Overkill threshold | **800** | 800 | `[decompiled]` + wiki + GameFAQs + Samurai + GamerGuides + LP `[verified: 5 sources]` |
| Strength | **29** | **15** | 29 `[decompiled]` + wiki + Samurai. **15: the second battle's script overwrites it** (@0x02c7) `[game script, A: run]`; the wiki still prints 29 for the "2nd body" because it lists the record. Consistent with its own line that the second body's attack "deals less than 200" (§3.3: 92 to 134). |
| Defense | 0 in the record (wiki and Samurai print 1, the usual floor); **the arms' shield raises it to 100 per command** (§4.5) | same | `[decompiled]` + wiki + Samurai |
| Magic | 20 | 20 | `[decompiled]` + wiki + Samurai. **This is the caster stat of Thunder and Venom too**: the body performs the head's attacks (§4.3). |
| Magic Defense | **30** | **0** | 30 `[decompiled]` + wiki + Samurai; 0 from the second battle's script (@0x02d3) `[game script, A: run]` |
| Agility | 10 (base CTB 14 ticks) | same | `[decompiled]`; ticks `[derived]` (combat-core §1.2) |
| Accuracy / Evasion / Luck | 100 / 0 / 15 | same | `[decompiled]` + wiki; Samurai prints Evasion 1 (the floor) |
| AP / Overkill AP | **400 / 600** | **0 / 0** | 400/600 `[decompiled]` + wiki + GameFAQs + Samurai + GamerGuides. **Battle 2: the script zeroes both** (@0x02f7, @0x0303) `[game script, A: run]`; GamerGuides and the wiki also print 0. GameFAQs prints 400 (600) for the second body `[conflict]` G-4 |
| Gil | **1,000** | 1,000 | `[decompiled]` + wiki + Samurai. GameFAQs prints 0 `[conflict]` G-3 |
| Armored | **No in the record**; the script makes it Armored, Defend and DEF 100 **for the length of one command** while an arm lives (§4.5) | same | `[decompiled]` + `[game script, C]` + GameFAQs ("only when at least one Arm is alive") |
| Zanmato level | byte 3 → **level 4** | same | `[decompiled]` + wiki ("Lv. 4") `[verified: 2 sources]` |
| Flags | Immune to Life, Delay, Slice, Bribe. **Tough and Heavy** (the script writes both). Immune to Eject. **The party cannot escape.** | same | `[decompiled]` + `[game script, C]` (init @0x0140 to 0x014c) + wiki; Escape and Flee are disabled by the formation scripts |
| Keeps control when Provoked | Yes: if Provoked, its **single-target physical attack goes to the Provoker** (Demi still hits everyone) | same | `[game script, C]` (init @0x011c; onTurn @0x03f6 to 0x0420) |
| Size | Datamined: model scale C 4.0, design height E **60** (3.3 x Tidus's 18.15), bind-pose mesh 181.8 high and 209.5 wide (10 x Tidus). **In-battle silhouette not read.** | same | `[game table]` (`size-monsters.mjs`), one reader. The head and arms have no mesh of their own: they are parts of this model. |

### 2.2 Elements

**Neutral to Fire, Ice, Thunder, Water and Holy on all three parts** (no absorb, immune, resist or weak bit) `[decompiled]` + GameFAQs ("Elemental Weaknesses: none") + Samurai ("Weakness: none") + GamerGuides ("Weak: nothing, Strong: nothing") `[verified: 4 sources]`. **Jegged says the opposite** ("weak against fire-elemental magics") `[conflict]` G-1: the game's table settles it, so **no element is better than another** and the chapter must not teach Jegged's line.

### 2.3 Status resistances (255 = immune, 0 = landable)

| Part | Immune (255) | Landable (0) | Confidence |
|---|---|---|---|
| **Body** | Armor Break, Magic Break, Mental Break, Berserk, Confuse, Dark, Death, Doom, Eject, Auto-Life, Petrify, Poison, Silence, Sleep, Slow, Zombie, the four Nul statuses | **Power Break**, **Provoke**, **Threaten** (record byte 0), Shell, Protect, Reflect, Regen, Haste, the distillers | `[decompiled]` |
| **Head** and **Arm** | the body's list **plus Power Break, Provoke and the four Distillers** | Threaten (record byte 0), Shell, Protect, Reflect, Regen, Haste | `[decompiled]`; the Distiller bits are **HD only** (the PS2 rows lack them, §2.5) |

Wiki and Samurai add **Threaten: immune** and **Capture: immune** `[conflict]` G-10 (the same byte-versus-wiki split as Natus N-3 and Omnis O-2): **do not let Threaten work until checked.** GameFAQs lists **Power Break and Provoke as the vulnerabilities of all three parts** `[conflict]` G-2: the record says the **body only**.

### 2.4 The head (`m160`, bestiary #047)

| Field | Battle 1 | Battle 2 | Confidence |
|---|---:|---:|---|
| HP | **4,000** | **1,000** | 4,000 `[decompiled]` + wiki + GameFAQs + GamerGuides `[verified: 4 sources]`; 1,000 `[game script, A: run]` (m117 init @0x02df to 0x02eb writes it onto actor 21) + wiki + GameFAQs + Jegged + GamerGuides |
| MP / Overkill | 200 / 800 | same | `[decompiled]` + wiki |
| Strength / Defense / Magic Defense | 1 / 0 / 0 | same | `[decompiled]`. The wiki prints Magic 20 for the head `[conflict]` G-6: the record says 0; it never casts for itself (§4.3). |
| Agility | 15 (base CTB 12 ticks) | same | `[decompiled]`; ticks `[derived]` |
| AP / Overkill AP / Gil | 48 / 72 / 200 | same | `[decompiled]` + wiki + GameFAQs + GamerGuides `[verified: 4 sources]` |
| **Reach** | **BattleDistance 1: melee cannot reach it** | same | `[game script, A: run]` (init @0x0105) + wiki ("cannot be hit by melee weapons") + GameFAQs + GamerGuides `[verified: 4 sources]`. Reachable by Wakka's normal strike, any spell and Kimahri's Lancet (wiki, GamerGuides; Jegged names Wakka or Lulu), and by anything of reach 1 or more (`src/battle/ffx/reach.ts`). |
| Must it die? | **No** (`MustBeKilledForBattleEnd := 0`) | same | `[game script, C]` + GamerGuides |
| Drops | none (script zeroes its chances) | same | `[game script, C]` + wiki |
| Death | fades out, **turns grey** first | same | `[game script, C]` (death animation "humanoid") + GamerGuides |

### 2.5 The arms (`m161`, two actors, the same record)

| Field | Value | Confidence |
|---|---|---|
| HP / MP / Overkill | **800** / 1 / 500 | `[decompiled]` + wiki + GameFAQs + GamerGuides `[verified: 4 sources]` |
| Stats | Strength 1; every other stat 0 | `[decompiled]` |
| **Armored** | **Yes** (record flag): only a Piercing weapon, a command with the piercing flag, or Armor Break (immune here) gets full damage through | `[decompiled]` + wiki + GameFAQs + GamerGuides `[verified: 4 sources]` |
| AP / Overkill AP / Gil | **37 / 55 / 300 each, and again for every regeneration kill** | `[decompiled]` + wiki + GameFAQs + LP `[verified: 4 sources]` |
| Turns | **None.** Hidden from the CTB list, never act | `[game script, C]` (init @0x0021, @0x002d) + wiki + GameFAQs |
| Must it die? | No | `[game script, C]` |
| What they do | **Shield the body** and come back (§4.5, §4.6). They **do not protect the head.** | wiki + GameFAQs + GamerGuides + `[game script, C]` |

**PS2 versus HD (byte diff of the three records).** `m117` differs in **one unparsed byte (offset 403)**, the same byte that differs for Natus `m126` and Omnis `m131`. `m160` and `m161` differ in byte 403 and in **byte 78 (the status-immunity byte: the HD copy adds the four Distillers)**. Every parsed field otherwise matches. Our chapter follows the HD build.

### 2.6 Rewards and drops

| | Battle 1 | Battle 2 | Confidence |
|---|---|---|---|
| Steal | **Potion** (common) and **Potion** (rare), base chance 255 | same | `[decompiled]` + wiki + GameFAQs + Samurai + Jegged `[verified: 5 sources]` |
| Item drop | **none** (the script zeroes the drop chances) | **Lv. 1 Key Sphere x3**, **x6 on an Overkill** (item id 81, chance 255, common and rare slots equal) | record `[decompiled]`; battle 1 zeroing `[game script, A: run]` (@0x0312 to 0x033a); wiki + GameFAQs + Jegged + GamerGuides + LP + Samurai `[verified: 6 sources]` |
| Equipment | none | **always**: a weapon with **Sleepstrike or Piercing** (listed for Kimahri and Auron) **or armour with Sleepproof**, 1 to 2 slots, 1 to 2 abilities | wiki + GameFAQs + Samurai `[verified: 3 sources]`; chance 255 `[decompiled]` |
| AP and Gil | the body's 400 (600 on an Overkill) and Gil 1,000, plus the head and every arm kill | head and arm kills only; the body's AP is 0 | §2.1; paid together after battle 2 (GameFAQs `[single source]`) |
| Bribe | cannot | cannot | `[decompiled]` + wiki |

**Farming.** The arms regenerate forever and each kill pays AP and Gil again, so an army of arm kills with Seymour's 999 MP is an AP and Gil farm (the wiki puts it at over 5,500 AP and 30,000 Gil with his MP spent; LP agrees it is easy). That is the original's rule. Whether our chapter keeps it is a question for Bailey (`concepts.md`, Q4).

### 2.7 Sensor and Scan text (paraphrase; never copy the game's wording)

- **Scan (the same paragraph on all four parts):** the arms block physical attacks; remove them with Piercing weapons, then strike the body; hit the head when it starts twitching or it will spit Venom `[verified: 2 sources: wiki infobox, Jegged "In Game Description"]`.
- **Sensor (one short line per part):** the body's says its arms are its guard; the arms' says they armour the body; the head's says that striking it stops its Venom `[single source: wiki]`.

---

## 3. Exact action data (decoded rows)

### 3.1 The four commands Gui uses (`monster_actions.json` and the game's own command tables)

| Command | Id | Target | Formula and power | Rank | Type and notes | Confidence |
|---|---|---|---|---:|---|---|
| **Attack** | 6:0 (0x6000) | one party member, random living (the Provoker if Provoked) | physical (formula 1), power 16, accuracy 90 | 3 | physical; can be Darkened | `[decompiled]` + `[game table]` |
| **Thunder** | 3:67 (0x3043), the **player's** Thunder | one random living member | magic (formula 3), power **12**, Thunder element | 3 | magical; reflectable; Shell halves it; **performed by the body** | `[decompiled]` + `[game table]`; wiki lists Thunder under the head |
| **Venom** | 6:49 (0x6031) | one random living member | magic formula, power **24**, always hits | 3 | **damage type Other** (Shell does not halve it); **Poison 100 and Slow 100** | `[game table]` + wiki (Poison and Slow at 100 percent) + Samurai (poison and slow) `[verified: 3 sources]` |
| **Demi** | 3:78 (0x304e) | **the whole party** | percentage-current (formula 5), power 4 = **25 percent of current HP** | 3 | magical, ignores MDEF; cannot kill | `[decompiled]` + `[game table]` + wiki + GameFAQs + GamerGuides `[verified: 4 sources]` |
| **Special 1** | 6:1 (0x6001) | the **body** (`M1`) | no damage, no hits | 3 | the **relay** (§4.3): the head's whole turn | `[decompiled]` + `[game table]` |

Also in the wiki's list for Gui: **Regeneration** (the arms returning) and the head's two caption-only abilities (the start and the cancel of its Venom charge). **Venom's damage type** differs between sources (GamerGuides says physical, the wiki "special", the record "Other") `[conflict]` G-9: the record settles it.

### 3.2 Which commands the arm shield catches (§4.5)

The shield needs a command that **affects HP** and whose damage type is **physical** (type 1): the script exempts type 2 (magical) and type 0 (neither bit, the game's "Other"), and **no player command has type 3** `[game script, A: run]` + wiki (the arms shield the body from physical attacks) + GamerGuides `[verified: 3 sources]`. From the game's own command table (`work/shield-types.mjs`), the **44 player commands of type 1** are: Attack; the Delay, Sleep, Silence, Dark and Zombie Attacks and Busters and Triple Foul; **Power, Magic, Armor and Mental Break**; Mug and Quick Hit; Full Break; the four **Extract** skills; Nab Gil; and the **aeons' physical attacks** (every aeon's Attack, Sonic Wings, Aerospark, Heavenly Strike, Impulse, Camisade, Razzia, Passado). **Never shielded: every spell (type 2, Demi and Requiem included), every character Overdrive (Swordplay, Bushido, Fury, the Ronso Rages, Slots, Mix), Lancet, items and the aeon Overdrives** (all type 0 or 2). So **an Overdrive or a spell goes straight through the guard**, which is why the guides call them the answer. The arms themselves are Armored by record, so an Overdrive or a spell without the piercing flag still takes a third on an arm; Ifrit's **Hellfire** carries the flag (GameFAQs: both aeon Overdrives "take out the arms in one shot").

### 3.3 Damage summary `[derived]` (integer chain, combat-core §2; mid roll 16, low to high roll in brackets)

**Incoming (what Gui does), by the target's Defense or Magic Defense** (party stats at this point are unsourced, §6.3, so the columns are a range):

| Target stat | Body Attack, battle 1 (STR 29) | Body Attack, battle 2 (STR 15) | Thunder (power 12, MAG 20) | Venom (power 24, MAG 20) |
|---:|---:|---:|---:|---:|
| 0 | 786 (736 to 832) | 134 (125 to 141) | n/a | n/a |
| 10 | 737 (690 to 780) | 125 (117 to 132) | 217 (203 to 229) | 503 (471 to 532) |
| 20 | 685 (642 to 725) | 116 (108 to 122) | 202 (189 to 213) | 467 (437 to 494) |
| 30 | 635 (595 to 672) | 108 (101 to 114) | 187 (175 to 197) | 433 (405 to 458) |
| 40 | 586 (549 to 620) | 100 (93 to 105) | 173 (162 to 183) | 400 (375 to 423) |
| 50 | 540 (506 to 571) | 92 (86 to 97) | 159 (149 to 168) | 368 (345 to 389) |

- **Battle 1's body hits for about 540 to 790**, which is **more than the whole starting HP of Yuna (475) or Tidus (520)** and close to GamerGuides' "600 or so". Venom is **340 to 500 plus Poison and Slow**. Demi takes a quarter of everyone's current HP and cannot kill. This is where the chapter's difficulty lives; the party's stats and gear (§6) are the real dial.
- **Battle 2's body is a different animal**: 90 to 134 per hit. Nothing in battle 2 can kill an attentive party; Venom is the only real damage (about 230 on Seymour).

**Outgoing from Seymour** (MAG 35; target Magic Defense floored at 1; the spells carry the **piercing flag**, so the Armored third does not apply):

| Spell | DmgCon | MP | Damage vs the battle-2 parts | Kills |
|---|---:|---:|---|---|
| Fire, Blizzard, Thunder, Water | 12 | 4 | 643 (602 to 680) | neither an arm (800) nor the head (1,000) in one cast |
| Fira, Blizzara, Thundara, Watera | 24 | 8 | **1,358 (1,273 to 1,437)** | **an arm or the head in one cast**; the 6,000-HP body in **5 casts** |
| **Requiem** (Overdrive) | 40 | 0 (gauge 100) | **2,423 (2,271 to 2,564) on each target** | the body in 3 hits; an Armored arm takes a third (757 to 854: borderline) |

- **Overkill in battle 2:** the finishing blow needs to be a spell or hit of at least the body's remaining HP plus 800. With Fira at about 1,358 the body must be at **about 558 HP or less** when it lands (Sensor and Scan exist to let the player see that). Six Key Spheres instead of three is the reward.
- **Turn rates `[derived]`** (ticks of recovery after a rank-3 action, combat-core §1.2): body 42, head 36, Seymour 30; for reference Yuna at her start-of-game Agility (10) 42 and Auron at his (5) 48.

**Retail-number cross-checks.** The wiki says the second body's physical hit is under 200; the record plus the script give 92 to 134. LP says Seymour's Fira does twice Lulu's; GamerGuides says one spell likely kills the 1,000-HP head: Fira does 1,358 (Fire would not).

---

## 4. The fight's rules (read from the game's scripts; run where marked A)

This section is read from the disassembly of `m117`, `m160`, `m161` and the two formation scripts, and **the monster scripts were then run in the Yunalesca lane's mock interpreter** (the world is a mock, the bytecode is the game's; `work/run-gui-vm.mjs` to `run-gui-vm4.mjs`, 4,000 seeds where a probability is quoted). **Rows marked A were run and match my reading; rows marked C are read by eye only** (the formation scenes, the RNG-stream accounting, the real engine's queue order; §12, Q-2). It agrees with the wiki, GameFAQs, Jegged, GamerGuides, Samurai and LP wherever they speak. Hook names follow `research/re-ffx-ai-seymour.md` §1.1.

### 4.1 The scripts and the hooks

| Script | init | onTurn | onTargeted | onHit | onDeath | other |
|---|---|---|---|---|---|---|
| `m117` body (worker w1) | f0 @0x00b0 | f2 @0x039f | f3 @0x0455 | f4 @0x066a | f5 @0x06fe | postTurn f6 @0x0721; no preTurn |
| `m160` head (w0) | f0 @0x0003 | f3 @0x012d | f4 @0x0240 | f5 @0x0289 | f6 @0x02ee | f2 empty |
| `m161` arm (w0) | f0 @0x0003 | f3 (empty) | f4 @0x0118 | none | f5 @0x018a | f2 empty |

Hook tags read from the scripts' own tables: `m117 tags=[2,-1,3,4,5,-1,6]`, `m160 [3,-1,4,5,6,2]`, `m161 [3,-1,4,-1,5,2]`.

**Variables.** The shared battle variables the three scripts use: `battle[0x04]` (the **relay selector**, 1 or 2), `battle[0x08]` (a scene flag the head sets and the formation script reads), `battle[0x0c]` (which party member's first-shield line plays), `battle[0x10]` (the head's warning speaker), `battle[0x1c]` (set when Ifrit's Hellfire hits the body; it makes `onHit` run scene B0), `battle[0x20]` (**which battle**, 1 or 2; it also picks the body's death animation). The body's **private** counters: the attack counter (`v12`), the arm-regeneration counter (`v13`), the low-HP threshold (`v11`), three one-time line flags (`v15` to `v17`). One **save-data** variable, `0xa7c` (`v0`), is written when the body dies (Q-12).

### 4.2 The two formation scripts

| | `kino02_00` (battle 1) | `kino03_10` (battle 2) | Source |
|---|---|---|---|
| Escape, Flee | disabled | disabled | `[game script, C]` |
| **Switch** | **not disabled** | **disabled** for everyone | `[game script, C]` (init @0x0009 to 0x0021) |
| Ambush state | 3 ("normal") | 3 | `[game script, C]` |
| Scene B2 (the party's one-time remark when the arms first turn a blow) | **voiced lines for Tidus, Wakka and Auron** | **empty** | `[game script, C]` |
| Scene B3 (the head's warning) | caption **plus four speaker lines** (Tidus, Auron, Lulu, Wakka) | caption only | `[game script, C]` |
| Battle camera and map layers | its own set (map centre 400) | its own set (map centre 189; layers 9 to 15 toggled) | `[game script, C]` (cosmetic) |

**Why I read `kino02_00` as battle 1 and `kino03_10` as battle 2:** the first has the party banter and leaves Switch on; the second has no banter, switches Switch off (a forced trio has no reserve), and its numeric id suffix (`_10` = 0x0A) matches the low word of the battle id (`CurrentBattle() == 0x00DF000A`) that `m117` and `m160` test for "this is the second battle". That pairing is **consistent, not proved** (Q-1).

The formation scripts set **no Seymour property** (no gauge, HP or MP): his start state is his default record (§5.1). Both scripts also drive the arms' destruction and regeneration effects and the head's captions (scenes B0 to B3).

### 4.3 The head's cycle and the relay `[game script, A: run]`

The head has a private state (`v3`) that starts at 1 and **never attacks by itself**. On its turn:

| State | Its turn does | Then |
|---|---|---|
| 1 | writes `battle[0x04] := 1` and performs **Special 1 on the body** | state := 2 |
| 2 | **the warning turn**: sets the body's animation to the twitching variant, picks the speaker (below) and plays the **warning caption** that the head is stirring (scene B3) | state := 3 |
| 3 | writes `battle[0x04] := 2` and performs Special 1 on the body | state := 1 |

**The body does the casting.** Special 1 targets the body, and the body's `onTargeted` answers it: it picks a **random living party member** (`findMatchingChr`, RNG stream 4) and, if `battle[0x04]` is **1, queues Thunder on them**, if **2, queues Venom** (it also sets its motion flag), then clears the selector. So **the head's Thunder and Venom use the body's Magic (20)**, and they are the body's reactions, with no CTB cost of their own.

**Cancel rule (`onHit`).** If the head took **HP damage greater than 0** (`LastDamageTakenHP`, after the cap) **while in state 3** (after the warning, before the Venom), it resets to **state 1**, plays the matching cancel caption and the Venom never happens. The next head turn is Thunder. Damage in any other state does not change the cycle. A miss, a heal or a zero-damage action does **not** cancel it. **Damage type does not matter** (GameFAQs).

**Warning speakers (battle 1, first warning only).** The script gives the first warning a speaker by priority **Wakka, then Lulu, then Auron, then Tidus** (whoever is present, alive and not Petrified, Asleep or Silenced; the last assignment wins). After that first warning (and for **every** warning in battle 2) the speaker is 0: the caption alone. The wiki's "Wakka and Lulu will be alerted" fits.

**What the run showed** (`work/run-gui-vm3.mjs`): six head turns give **relay (selector 1), warning caption (scene 3), relay (selector 2), relay (selector 1), warning, relay (selector 2)**; a hit with 150 damage after the warning plays the cancel scene (scene 0) and the next head turn is **the selector-1 relay again**; a hit with 0 damage leaves the Venom relay in place; a hit **before** the warning turn changes nothing. The body's `onTargeted` turns selector 1 into **Thunder** and selector 2 into **Venom**, aimed at a random living member.

**Head versus body speed.** Head Agility 15 acts about 1.17 times as often as the body (Agility 10); in six rank-3 turns of the body the head gets about seven.

### 4.4 The body's turn `[game script, A: run; the Provoke branch not run]`

A private counter `c` starts at 0 and the body's turn is:

| # | Condition | Action | Then |
|---|---|---|---|
| 1 | **both arms dead** and the regeneration counter `r` is greater than `(rand mod 2) + 1` | run the **regeneration scene** (§4.6); `r := 0` (and the turn continues) | |
| 1b | both arms dead, `r` not yet greater | `r := r + 1` | |
| 2 | `c >= 2` | **Demi** on the whole party; `c := 0` | |
| 3 | otherwise | **Attack** on a random living member, or **the Provoker** if Provoked | |
| 4 | always, after 2 or 3 | `c := c + 1` | |
| 5 | the body's HP is **below the low-HP line** | `c := c + (rand mod 2)` | **line = max HP / 3 = 4,000 in battle 1**; in battle 2 the line is the record's **12,000**, read before the override, so it is **always on** |

**What that plays (run, 4,000 seeds per case, `work/run-gui-vm2.mjs`):**
- **Battle 1 above 4,000 HP: Attack, Attack, Demi, Attack on every one of the 4,000 seeds**, then strict alternation (Demi, Attack, Demi, ...).
- **Battle 1 below 4,000 HP, and battle 2 from its first turn** (the same distribution, since both have the random skip on): the first turn is always an Attack; the second is a Demi **half the time**; afterwards a Demi may follow a Demi. Opening four-turn patterns (A attack, D Demi): **AADA 25.2 percent, ADAD 24.9, AADD 24.9, ADDA 12.6, ADDD 12.5**.
- The wiki says the body "opens with a physical attack, then alternates" and that in battle 2 it "begins alternating from its first turn"; the script gives **two attacks first in battle 1** and **a coin-flip on turn two in battle 2** `[conflict]` G-11, settled by the run in the script's favour.

### 4.5 The arms' shield and the body reacting `[game script, A: run]`

**On every command that targets the body** (`onTargeted`), the body **first clears** its Defense, Defend and Armored (back to 0, 0, off), then, **unless the command is the head's relay**:

| Step | Test | Result |
|---|---|---|
| 1 | the command does not affect HP | no shield |
| 2 | its damage type is **magical** (2) or **neither bit** (0, the game's "Other") | no shield |
| 3 | its damage type is **physical** (1) (or a hypothetical 3; no player command has it), and **at least one arm is alive** | **DEF := 100, Armored := on, Defend := on for this command only** |
| 4 | the same, with **both arms dead** | DEF := 0 |

**Run (`work/run-gui-vm3.mjs`):** with the arms alive, **Attack (0x3000) gives DEF 100, Defend on, Armored on**; with both arms dead it gives none; **Fire, Fira, Requiem, Cure, Hellfire and an item give none.** The full list of type-1 commands is in §3.2.

It also records the **first** Tidus, Wakka or Auron to strike the shielded body (battle 1), for the one-time banter line `[C]`, and, when **Ifrit's Hellfire** targets it, detaches the parts for the animation (cosmetic) `[C]`.

**After the hit (`onHit`)**, with the body alive, it clears the shield again, plays the camera scene if flagged and, if a banter line is owed, plays it (battle 1 only). If the body just died it records which arms were dead in the save-data variable `0xa7c`.

**Armored does** `damage // 3` unless the command has the **piercing flag**, the user has **Piercing** (Auron and Kimahri start with it), or the target has Armor Break (none of the parts can); **Defend** halves **physical-type** damage. So **spells and Overdrives are never shielded**, and a **Piercing weapon skips the Armored third but still meets DEF 100 and Defend**: Auron's start-of-game Attack (STR 20) does about 59 against the shield instead of about 280 unshielded (§3.3 chain, `[derived]`), which is why every guide says to remove the arms first. The shield **does not protect the head** (it only watches commands aimed at the body).

### 4.6 The arms: no turns, and regeneration `[game script, A: run for the regeneration; C for the rest]`

- They never act and are hidden from the CTB list. Destroying one plays its destruction effect; it stays down (a "boss-style" death: the body stays, untargetable).
- **Regeneration:** each **body turn** with **both arms dead** tests a counter `r` (it starts at 0): if `r` is **greater than `(rand mod 2) + 1`** the formation script's regeneration scene **revives both arms at full HP** (800) and `r` resets; otherwise `r` goes up by one. Turn one tests 0, turn two tests 1 (neither can pass), **turn three tests 2: it passes on a roll of 0 and fails on a roll of 1; turn four tests 3 and always passes.** So the arms are back at the start of the body's **third or fourth turn** after both have fallen, an even split. **Run (4,000 seeds): the regeneration scene is requested on body turn 3 in 50.0 percent and on turn 4 in 50.0 percent.** GameFAQs and the wiki say "three to four turns of the body" `[verified: 2 sources]`. One arm alive stops the clock (the test needs both dead).
- An arm kill pays its AP and Gil **each time** (§2.6).

### 4.7 End of battle, and the battle-2 overrides `[game script, A: run (the init reads back as below)]`

- **The battle ends when the body dies**; the head and arms need not (GamerGuides, GameFAQs).
- **Battle 1's init** zeroes the body's item and gear drop chances (no drops, no spoils screen). **Battle 2's init** (taken when the battle id is the second Gui battle): the body presets its three one-time banter flags (so no line plays) and the head's own init presets its warning flag (so no speaker); body max HP and HP := **6,000**; Strength := **15**; Magic Defense := **0**; head max HP and HP := **1,000**; the body's AP and Overkill AP := **0**. Nothing else changes; the arms stay at 800.

**Run (`work/run-gui-vm4.mjs`, the HD record values loaded first):** battle 1 reads back **body HP 12,000, STR 29, MDF 30, AP 400/600, item and gear drop chances 0, head 4,000, battle variable 0x20 = 1, low-HP threshold 4,000**; battle 2 reads back **body HP 6,000, STR 15, MDF 0, AP 0/0, drop chances kept (255), head 1,000, battle variable 0x20 = 2, threshold 12,000**. The head's BattleDistance reads back 1 in both.

### 4.8 Reference pseudocode (sourced rules only; open items marked)

```
parts: body(20), head(21), arm(22), arm(23); head.outOfMeleeReach; arms have no turns; head/arm not required to die
battle = 1 or 2   // 2: body HP 6000, STR 15, MDF 0; head HP 1000; body AP 0; drops stay. 1: drops 0.

body.onTargeted(cmd):
    clear(DEF, Defend, Armored)
    if cmd == head.relay: target = random living; (sel==1 ? queue Thunder(target) : queue Venom(target)); sel = 0; return
    if cmd.affectsHP and cmd.damageType == physical and (arm22.alive or arm23.alive):   // spells, Overdrives, Lancet, items: never
        DEF = 100; Armored = on; Defend = on
body.onHit(cmd):  clear(DEF, Defend, Armored); if body dead: record dead arms (save var 0xa7c)

body.onTurn:
    if arm22.dead and arm23.dead:
        if r > (rand mod 2) + 1: revive both arms (800 HP); r = 0   // formation scene B1
        else r += 1
    if c >= 2: Demi(party); c = 0 else: Attack(provoker if provoked else random living)
    c += 1
    if body.hp < line: c += rand mod 2          // line = 4000 (battle 1), 12000 (battle 2)

head.onTurn:   state 1 -> relay(sel=1); 2 -> warning caption; 3 -> relay(sel=2)   // 1 -> 2 -> 3 -> 1
head.onHit:    if state == 3 and lastDamage > 0: state = 1 (cancel caption)
```

---

## 5. Seymour, the guest (battle 2 only)

### 5.1 His record (HD build)

| Field | Value | Confidence |
|---|---:|---|
| HP / MP | **1,200 / 999** | `[game table]` (`ply_save.bin` slot 7, file offset 0x424) + `[decompiled]` (`characters.json` index 7) + wiki `[verified: 3 sources]` |
| Strength / Defense / Magic / Magic Defense | **20 / 25 / 35 / 100** | same `[verified: 3 sources]` |
| Agility (base CTB 10) / Evasion / Accuracy | **20** / 10 / 10 | same |
| **Luck** | **18** | `[game table]` + wiki. The tracker's table prints 17 `[conflict]` G-7: the Steam build's own table settles it. |
| Weapon | **Seymour Staff**: one slot, **Piercing** | `[decompiled]` + wiki |
| Armour | **Seymour Armor**: one slot, **Sensor** | `[decompiled]` + wiki |
| Overdrive | **Requiem**; mode **Stoic**, and he cannot learn another | wiki `[single source]`; the mode rule is the general one (combat-core §5) |
| Actor index | **7** (party 0 to 6, aeons from 8): after Rikku in any tie-break | `[decompiled]` + the RE notes' actor numbering; **to confirm** (Q-7) |

### 5.2 His commands

| Command | Id | MP | Record | Confidence |
|---|---|---:|---|---|
| Attack | 0x3000 | 0 | physical, power 16, Piercing weapon | `[game table]` |
| Fire, Blizzard, Thunder, Water | 0x3042, 0x3041, 0x3043, 0x3044 | 4 | magic, power 12, **piercing flag** | `[game table]`; wiki + LP + GamerGuides ("second tier") |
| Fira, Blizzara, Thundara, Watera | 0x3045 to 0x3048 | 8 | magic, power 24, **piercing flag** | `[game table]` + wiki + GamerGuides + LP |
| Cure / Cura | 0x302b / 0x302c | 4 / 10 | healing, power 24 / 40 | `[game table]` + wiki + GamerGuides ("as well as Cura") + LP |
| Scan | 0x3032 | 1 | reveals an enemy | wiki + LP |
| NulBlaze, NulShock, NulTide | 0x302f, 0x3030, 0x3031 | 2 | party-wide, rank 2 | wiki; **NulFrost and "every tier-one White Magic" are not settled** `[conflict]` G-8 |
| Item | 0x3001 | 0 | the shared bag; "he reaches into his sleeve" | wiki |
| **Requiem** | **0x30e3** | 0 | magic formula, **power 40**, rank 4, Overdrive cost **100**, **all enemies**, magical and can crit, **no piercing flag** | `[game table]` + wiki ("non-elemental damage to all enemies") |

He has **999 MP**, so spells are effectively free (124 Fira casts). The wiki and LP both say **Anima cannot be summoned** while he is playable.

### 5.3 What he cannot do

- **No Sphere Grid, no menu, no equipment change, no other Overdrive mode** (the wiki: he does not appear in the menu or on the grid).
- **No Switch** in battle 2 (the formation script disables it), and **he is never controllable again** after the battle.
- **No Anima.** No Talk (neither formation adds the Talk command).
- Low HP shows in his pose: he slouches when low, **kneels on one knee under a quarter HP** (the wiki). Our Macalania painting set already has a `kneel` pose.

### 5.4 Requiem and Stoic: why it takes so long `[derived]`

On Stoic the gauge gains `damageReceived x 30 / maxHP` per hit, in percent of a full gauge (combat-core §5). With his **1,200 max HP** that is **damage / 40**. In battle 2 the things that hurt him are: the body's Attack about 112 (2.8 percent when it lands on him, one time in three), Demi from full HP **300 (7.5 percent)**, Thunder about 99 (2.5), Venom about 230 (5.8). Kept at full HP by Yuna, an (Attack, Demi) pair is **about 8 percent**, so a full gauge needs **about a dozen pairs, around 24 body turns**, during which the body must stay alive, which is **about 1,000 ticks of play**. LP says it took "a good ten minutes" and that Requiem's animation is reused elsewhere. `[estimate]` for the exact count; the mechanism is sourced. The gauge's **starting value** is unknown (§12, Q-7).

---

## 6. The party and builds

### 6.1 Roster

- **Six characters** (Tidus, Yuna, Auron, Kimahri, Wakka, Lulu): **Rikku is not yet in the party** (Operation Mi'ihen's guardian list names five besides Yuna; Auronlu's cast agrees) `[verified: 2 sources]`.
- **Battle 1:** no forced party (`forced_party ""`); the player picks three; **Switch works**.
- **Battle 2:** forced `"yas"`: **Yuna, Auron, Seymour**, left to right; no bench.
- **Aeons:** **Valefor and Ifrit** (Ixion comes at Djose, after) `[verified: 2 sources: wiki "both aeon Overdrives", GameFAQs on Ifrit]`. Yuna's Summon is **not** disabled in either formation script (reading); Demi punishes aeons, which cannot heal as characters do (GameFAQs).

### 6.2 What carries between the two battles

HP, MP, statuses and the Overdrive gauges of Yuna and Auron carry, **unhealed** (GameFAQs `[single source]`). Aeon HP and MP persist as in any FFX chain. Seymour is fresh (full HP and MP, gauge at its default).

### 6.3 Stats at this point: unsourced

**No source gives the party's stats, Sphere Grid state or gear at the Ridge.** The repo's nearest presets are two story areas later (Chapter VII Macalania, `src/data/ffx/builds/macalania.ts`, which used the midpoint of a published range table). Known fixed points: **start-of-game records** (`characters.json`: Tidus 520 HP, Yuna 475, Auron 1,030, Kimahri 644, Wakka 618, Lulu 380, with **Auron's and Kimahri's weapons Piercing by default**, so both can hurt the Armored arms) `[decompiled]`, and the AP the original awards (400 plus the parts) `[§2]`. **A preset has to be built and marked `[estimate]`** (Q-14, G-18). It is the chapter's biggest open design input: battle 1's body hits for 540 to 790 and the whole fight's tension depends on the party's HP and defence.

### 6.4 What to equip (guides)

GameFAQs: no elemental or status weaknesses, very few elemental or status attacks, so **raw defence and offence** in the auto-abilities. GamerGuides: NulShock against the head's Thunder. Jegged: Tidus's Haste on everyone, Cheer and Focus early (they stack to five), use every character at least once for the AP.

---

## 7. Arena: the Ridge, in two states

| Fact | Source |
|---|---|
| **The Ridge** is the highest area of Mushroom Rock Road, a vantage point over the land below, and the Crusaders' command centre during Operation Mi'ihen (a command tent with chests, a spear rack, O'aka's stall by the Save Sphere, a chocobo) | wiki *Mushroom Rock Road* + GameFAQs `[verified: 2 sources]` |
| The Crusaders have **herded the sinspawn into a cage** to lure Sin (the wiki says the cage is suspended); **Crusader artillery teams stand on the cliffs above the beach**; the **Al Bhed's great machina gun** (a railing gun) is built on the cliff side | wiki *Operation Mi'ihen*, Auronlu (artillery teams "above"), LP `[verified: 3 sources]` |
| The beach below is where the infantry and Chocobo Knights gather; the Al Bhed machina is "five stories tall" (LP, a play record) | wiki + Auronlu + LP |
| **Battle 1 is in the intact camp. Battle 2 is "the ruined command center"** after the beam | Auronlu `[single source]`; the second formation script toggles its own map layers (§4.2) |
| Palette: the repo's own estimate for Mi'ihen is an **overcast** grade, ground base `#b9a179` (tan), cool blue shadows (`research/assets-and-tech.md`) | `[estimate]` (project) |
| **Size**: the body's design height is **3.3 x Tidus**, its bind-pose mesh about **10 x Tidus**; the head hangs out of reach | `[game table]`, §2.1 |

**Looks (text only).** Gui is "a scorpion-like giant" in one review (TheGamer's list of FFX's weird bosses, via search), a fusion of the sinspawn from the cage with an armoured pair of arms that look lethal and never attack; the head is separate, shakes before Venom and goes grey when it dies; the death is a burst of pyreflies (LP). **No source gives Gui's colour, face or limb count beyond that.** A reference look, then an options round, is owed before any painting (rule 9).

---

## 8. Story, beats and where it sits

### 8.1 Where it sits among the Seymour chapters

| Chapter | Seymour's form and place | What it adds |
|---|---|---|
| **This one** | **His one fight at the party's side**: a Maester who has watched an operation he knew would fail | The man before the monster: capable, courteous, the only time he stands next to Yuna in a fight |
| **VII** Macalania | the man; dies and returns unsent | what he becomes the moment he is crossed |
| **X** Natus, **I** Flux, **XII** Omnis | the three monstrous forms | the cost |

It is the **earliest** point in FFX's story of any chapter in the roster (before Djose, the Moonflow, Guadosalam and Macalania) and fills the empty first half (the 2026-09-27 plan's phrase). Chapters are numbered by registration (D-058), so it would be **XIX** (the `Chapter.number` union already allows 19, but `exp-leblanc` uses it; §10).

### 8.2 Beat sheet (paraphrased from Auronlu, wiki; no line transcribed)

1. **Command centre.** Kinoc, an old acquaintance of Auron's, embraces him and asks, lightly, where he has been for ten years and whether he has seen Zanarkand; Auron deflects. Kinoc says the operation will not work and the dream may last a little longer; Seymour stands behind him. The base captain says Sin always returns for its spawn; Auron answers that it will come.
2. **Battle 1.** In fight the first physical hit tells the party the arms are for defence; a few rounds later someone sees the head wind up.
3. **The beam.** Sin rises and the artillery fires; spawn shed from its sides and the Chocobo Knights charge them; Auron shouts a warning and the party dives for cover; then the beam burns the beach.
4. **Battle 2.** Yuna wakes to find Seymour facing the reanimated body. He tells her to stand back; she says yes and does not obey; Auron goes in.
5. **The cliff.** Yuna beside Seymour watches Sin break the Al Bhed machina. Tidus wakes on the beach below among the fallen. Back at the camp Yuna tries to summon; Seymour says her power is not yet enough and stops her.
6. **The shore, afterwards.** Auron tells Tidus that Sin is Jecht and why Jecht keeps killing; once Kinoc has gone, Seymour tells Yuna she must be the people's strength and offers to be hers (paraphrased).

Write original lines in the register of `research/writing-bible.md` §1.9 (Seymour: long balanced clauses, "Lady Yuna", courteous condescension, mercy language) and §2.1 (understate for three or four lines, then one unguarded line, then cut away). **Do not echo the game's lines** (rule 8). **Seymour must not say anything that is only true after Macalania**; this is the version of him who has not yet been crossed, so his menace is **courtesy**, not threat.

### 8.3 Music

| Track | Use | Confidence |
|---|---|---|
| **"Peril"** (危機), 4:22 | Operation Mi'ihen and **the first Gui battle** (also other tense scenes) | wiki OST page + wiki *Sinspawn Gui* `[verified: 2 sources]` |
| **"Challenge"** (挑戦), 4:14 | **the second Gui battle** (and Flux, Yunalesca and others as the important-boss theme) | wiki + `research/ffx-seymour-flux.md` §18 `[verified: 2 sources]` |
| "Decision on the Dock" / "A Fleeting Dream" | the road during the operation / after it fails | wiki *Mushroom Rock Road* (the OST page says "Peril" for the operation: the wiki disagrees with itself; **irrelevant**: ours are original) |

**Do not transcribe, sample or arrange any of these** (rule 8). Our cue map (`docs/audio/THEMES.md`, cue map) has the generic **`battle-ffx`** ("We can win this") and the shared **`victory-ffx`** ("Relief, not triumph"); a Gui chapter needs **one scene cue and one or two battle cues** as new sketches Bailey judges by ear (rules 9 and 13).

---

## 9. Art: what exists

| Asset | Where | State |
|---|---|---|
| Gui (body, head, arms), broken cage, the Ridge | none | **None.** No concept, no painting. |
| Painted **Sinspawn** precedent | `public/art/characters/sinspawn-genais/` (Chapter XVII) | present; the **family look** Gui should sit beside |
| Seymour, human form | `public/art/characters/seymour-macalania/` (`idle`, `cast`, `hurt`, `kneel`, `ko`); portrait `portraits/seymour-macalania.png` (approved) | **CANDIDATE** poses; the right man for this chapter (human form). The pipeline's canon pose set is seven (`tools/gen/pose-phrases.mjs`: idle, attack, cast, item, hurt, ko, victory); he has idle, cast, hurt and ko plus a `kneel`, so he is **missing `attack`, `item` and `victory`** (`kneel` may serve as `critical`; `ready`, `follow` and `sleep` fall back to idle) |
| Yuna, Auron, Tidus, Kimahri, Wakka, Lulu | `public/art/characters/*` | **Approved** full sets (Yuna's has `summon`) |
| Backdrops for Mi'ihen | none (`public/art/backdrops/` has no Ridge); the Den of Woe backdrop (FFX-2) is under the road, not this | none |
| Requiem cut-in, chapter card, results and pause art | none | none |

---

## 10. What the FFX engine has and what it lacks (read `src/battle/ffx`, 2026-10-10)

**A. Guest party member (Seymour)**

| Exists | Missing |
|---|---|
| `FFXPartyBuild.activeSlots` takes **one to three** ids and `reserve` may be empty (`types.ts` 2609 to 2621; `setup.ts` builds the line-up from the list's length); `FFXMemberBuild.id` is a **plain string**, so a `seymour` build entry needs no change to the union. Via Purifico (Yuna alone) and Highbridge (forced trio) are precedents. | `CharacterId` is a **closed union of seven** (`src/data/ffx/ids.ts`), as are `CHARACTERS` (`data/ffx/characters/index.ts`), `CHARACTER_IDS` and `CTB_TIEBREAK_ORDER`; 21 files mention `CharacterId`. **Contract file: any change is additive and needs a `docs/CONTRACT-CHANGES.md` entry.** Seymour's slot (actor 7, after Rikku) is not in the tie-break table. |
| UI keys are mostly open records (`PARTY_ROLES` is a `Record<string, string>`); Stoic and the other modes exist (`data/ffx/overdrives/modes.ts`); Sensor and Piercing exist as auto-abilities; Black and White Magic definitions exist for Lulu and Yuna. | **No Requiem** anywhere in `src` (no `0x30e3`); `MinigameKind` (nine values) has **no "no input" value** for an Overdrive that is a plain command (Kimahri's Rage and Yuna's Summon are pickers; `types.ts` is a contract file). No Seymour equipment definitions (Staff, Armor), no `attack`, `item` or `victory` pose, no guest tag in the HUD. |
| A chain carries HP, MP, the Overdrive gauge and the bag forward, and statuses too with `carriesPartyState` (`BattleScreenSetup.ts#setupForNextLink`, `carryFfx`); seam scenes between links exist (`story/registry.ts`, Isaaru and Trema); `checkpointOnEntry` and `hopelessRetry` give a retry rule; `BattleChainSpoils.ts` pools spoils. | **A link cannot change the line-up.** `setupForNextLink` carries `build.members` and keeps the previous `activeSlots`; `EnemyGroupDef` has **no forced line-up field, no guest injection and no "Switch off" flag** (compare `aeonsOnly`, `lockedAeons`, `checkpointOnEntry`). Every forced party in the repo is forced for the whole chapter. |

**B. Multi-part enemy (body, head, two arms)**

| Exists | Missing |
|---|---|
| **`EnemyGroupDef.parts`**, drawn and targeted separately (FFX: Anima in Macalania; FFX-2, same shared type: Vegnagun's Bulwarks, Redoubts and Nodes), `flags.isPart`, `partOf`, `hidden`, `hideHpBar`, and the music cue `part-destroyed:<id>`. | **No Gui AI** (`src` has Genais and the Core, no Gui). A new module in the shape of `ai/seymour-omnis.ts` and `-rules.ts`, registered with `registerScriptHooks`. |
| **The game's hook set is implemented** (`ai/hooks.ts`): `preTurn`, **`onTargeted`** (before damage), **`onHit`** (once per action per target, with `HitReport.lastDamage` after the cap), `postPoison`, and queued **reactions** with no CTB cost, plus `holdsDeath`. So the shield, the "damage cancels Venom" rule, the relay and the body's counter are all expressible. | A **scripted revive of a dead part**: `reviveRule` is a **CTB-tick timer** for the Yu Pagodas (revive with excess damage); Gui's arms return **at full HP after three or four body turns**. Small and new. |
| **Per-target reach**: `CombatantFlags.outOfMeleeReach` and `targeting.ts#reachesTarget` (the Mortiphasm discs and the Genais core; a physical action reaches only Wakka, Valefor, Anima, Mindy or a ranged weapon; magic reaches). `reach.ts` holds the game-accurate **reach-0 command set** that Overdrive Sin's distance 1 already uses. | The head's rule is "BattleDistance 1": **the game-accurate version** (reach 1 or more reaches) applied **per target**. Today the discs' coarser rule or the airship's whole-gap rule are the only two forms. Small. |
| **Armored** is the game's own handler (`kernel/modifiers.ts#armoredMod`, 0x78a830): `damage / 3` unless the command's piercing flag, the user's Piercing or the target's Armor Break. | A **per-command shield** (set DEF, Armored, Defend in `onTargeted`, clear in `onHit`) and the **second-battle overrides** (HP, Strength, Magic Defense, head HP, zero AP) as two enemy definitions. Small. |
| Chains of formations (`nextGroupId`), spoils across links, retry checkpoints, results ledgers with AP and drops. | The arms' **AP and Gil per regeneration kill** (faithful farm) needs a result rule; and "the body alone ends the battle". |

**C. The rest of a chapter** (the same list as every chapter): `Chapter` record and meta (`data/chapter-*.ts`; `Chapter.number` is 0 to 19 and 19 is taken by `exp-leblanc`, so a board chapter XIX needs the union extended or the experiment renumbered), a scene factory with a debug variant (`src/scenes`), story scripts (pre, seam, post), a strategy guide (`src/data/guides`, following Jegged, D-350), a tactic for the advisor, sensor texts, a human-pace bench, tests, a `CONTRACT-CHANGES.md` entry and a focused review before the deploy with the deep review after (AGENTS.md: a new chapter is the "focused first, deep after" class).

---

## 11. Conflicts, gaps and the verify-before-shipping list

| # | Item | Status / what to do |
|---|---|---|
| G-1 | **Elemental weakness**: Jegged "weak to Fire"; the table, GameFAQs, Samurai, GamerGuides and the wiki say none | **Neutral to all.** The game's table settles it. The chapter's guide must not teach Jegged's Fire line (§13). |
| G-2 | Head and arm **Power Break and Provoke**: GameFAQs "vulnerable"; the record says immune (the body is landable) | **Record wins.** |
| G-3 | Body **Gil**: GameFAQs 0; record, wiki, Samurai 1,000 | **1,000.** |
| G-4 | **Second body AP**: GameFAQs 400 (600); script, wiki, GamerGuides 0 | **0.** |
| G-5 | **Second body Strength and Magic Defense**: the wiki prints the record (29 and 30); the script sets 15 and 0 | **Script wins**; matches "under 200" damage. |
| G-6 | **Head Magic**: wiki 20; record 0 | The **body** casts for the head, so the body's MAG 20 is what matters; the head's own value is moot. |
| G-7 | **Seymour's Luck**: wiki 18, tracker 17, Steam `ply_save.bin` 18 | **18.** |
| G-8 | **Seymour's White Magic**: wiki (Cure, Cura, Scan, NulBlaze, NulShock, NulTide) vs LP ("every tier-one White Magic spell" plus Cura) | **Open** (Q-7). Build the wiki list and label it. |
| G-9 | **Venom's type and status**: GamerGuides physical plus Poison; wiki, Samurai and the record special/other, **Poison and Slow** | **Record.** |
| G-10 | **Threaten** on the body: record 0, wiki and Samurai immune | **Open.** Do not let Threaten work until checked. |
| G-11 | The body's **opening**: the wiki says it opens with a physical attack and then alternates; the script gives Attack, Attack, Demi in battle 1 and a coin-flip on turn two in battle 2 | **Run: the script wins** (4,000 seeds per case, §4.4). |
| G-12 | **Piercing for the Armored arms**: Auron's and Kimahri's start weapons carry it | Fine (`[decompiled]` `characters.json`; GamerGuides names Auron, Kimahri and Lulu for the arms). The preset must keep them equipped. |
| G-13 | **Gui's in-battle size** | **Unread.** Datamined E 60, bind pose 10 x Tidus (§2.1). Needs a live-game read (Q-13). |
| G-14 | **Party stats at this point** | **Unsourced**; a preset marked `[estimate]` (Q-14). |
| G-15 | **Rewards banking** across the two battles | GameFAQs only. Q-6. |
| G-16 | **The arm AP and Gil farm** | A faithful rule; Bailey's call (`concepts.md`, Q4). |
| G-17 | **Summon in battle 2** | The formation script does not disable it; unconfirmed in play. Q-2/Q-15. |
| G-18 | **Whether Seymour's KO ends the battle** | The formation scripts have no special case; he is a normal party member. Check in play. |
| G-19 | **Which music plays where** | The wiki disagrees with itself ("Peril" vs "Decision on the Dock" for the operation); irrelevant, our cues are original. |
| G-20 | **HD-only changes** | Distiller immunities on the head and arms (§2.5); **our chapter follows the HD build.** |

---

## 12. Open questions for the game data (for the reverse-engineering session)

Everything below can be settled from the Steam build's own files. File paths are the scratch copies I made (`work/`) or the lane's existing extractions; nothing needs a download.

| # | Question | Where to look and what I already have |
|---|---|---|
| **Q-1** | **Pair the two battles with their formation scripts.** Which group record names `kino02_00` and which `kino03_10`, and what does `CurrentBattle() == 0x00DF000A` decode to? | `kernel/prepare.bin` or `btl.bin` (the group tables). Evidence so far: only `kino02_00` has the party banter and leaves Switch on; only `kino03_10` disables Switch; its suffix `_10` = 0x0A is the id's low word. |
| **Q-2** | **Finish the interpreter work.** **Already run and matching (this session, `work/run-gui-vm.mjs` to `run-gui-vm4.mjs`):** the head's three-state cycle, the cancel rule, the relay into the body, the body's attack counter in both battles (opening patterns, the always-on random skip in battle 2), the arm regeneration (turn 3 or 4, 50/50), the shield's trigger set, and the second-battle overrides. **Still open:** the **RNG streams** each script draws (`findMatchingChr` stream 4, `GetRandomValue` stream 2) so a seeded replay matches the real draw order; the **Provoke branch** of the body's turn; the formation scene effects (B0 to B3) and how the real engine **orders a queued reaction** against the triggering action (the lane's `0x7929b0` reading). | `D:/Tools/ffx-parity/ai/ffx-yunalesca-bfa/vm.mjs` (`loadAi`, `World`, `Vm`) on `D:/Tools/rea/work/extract/ffx/.../mon/_m117/m117.bin`, `_m160`, `_m161`. Hook tags read: `m117 [2,-1,3,4,5,-1,6]`, `m160 [3,-1,4,5,6,2]`, `m161 [3,-1,4,-1,5,2]`. |
| **Q-3** | Confirm `readCommandProperty(cmd, damageType)`: 0 none or Other, 1 physical, 2 magical, 3 both, and `affectHP`, with the Ghidra handler (the mock reads `d20 & 3` from the command table). | `m117` onTargeted @0x0518 to 0x053a; the Omnis note's disc rule uses the same property. |
| **Q-4** | **Answered in §3.2** (44 player commands of type 1, none of type 3, from `command.bin`); **left to do:** the same list for the monster-side commands a reflected or provoked action could use, and a check that Wakka's reels (type 0) are really never shielded in play. | `work/shield-types.mjs`. |
| **Q-5** | **Answered in §4.7** (the init reads back as stated); **left to do:** confirm the same values in a live battle and that the **first** battle's equipment and Key Sphere drops really are zero (no spoils screen). | `work/run-gui-vm4.mjs`. |
| **Q-6** | **How battle 1's AP and Gil are banked and paid after battle 2**, why battle 1 shows no spoils screen, and whether the equipment and Key Spheres come only from battle 2. | the battle-end routine and the formation's end handler. |
| **Q-7** | **Seymour's record.** Decode his learned-ability bits (the White Magic list, **NulFrost, Esuna, Haste?**), his **starting Overdrive gauge** and mode, the equipment item ids (bytes 0x1a and 0x1b at record +40 and +41 look like the two item ids), `OD max`, and confirm actor slot 7 for any tie-break. Luck is already settled at 18. | `D:/Tools/ffx-parity/ai/ffx-yunalesca-bfa/extract/ffx_ps2/ffx/master/jppc/battle/kernel/ply_save.bin`, **record at file offset 0x424 (found by the HP 1200 and MP 999 signature; stride 0x94)**. My probe is `work/plysave-probe.mjs`. |
| **Q-8** | **Requiem (0x30e3):** damage type (the record's flags say magical and crit-capable: does Shell halve it? does a Magic +% ability apply?), the missing piercing flag (so an Armored arm takes a third), whether it uses the guest's gauge code, and the camera rule (the wiki says the Overdrive camera never leaves him). | `q-ffxcmd.mjs 0x30e3`: formula 3, power 40, rank 4, Overdrive cost 100, all enemies. |
| **Q-9** | **Stoic for a guest**: confirm `damage x 30 / maxHP` applies unchanged to Seymour's 1,200 and the gauge's start. | `kernel/overdrive.ts` equivalent in the exe; `FINDINGS.md` "OD max at +0x3a". |
| **Q-10** | **Venom (0x6031)**: confirm Poison 100 and Slow 100 and type Other; **Demi (0x304e)** percentage-current, "ignores Heavy and Tough". | the decoded rows in §3.1. |
| **Q-11** | **Status bytes on the body versus the wiki**: Threaten (record 0, wiki immune), Capture, and that Power Break and Provoke really land on the body. | the engine's status-resist handler; `ffx_mon_data_hd.csv` row 117 bytes 47 to 71. |
| **Q-12** | **Save-data variable 0xa7c** (`m117` `v0`): written when the body dies (bit 0 arm 22 dead, bit 1 arm 23 dead) and zeroed at battle 2's start. **What reads it?** (An event script's cutscene variant?) | grep the field and event scripts for 0xa7c. |
| **Q-13** | **Gui's in-battle size**: the model is `m117` (scale 4.0, mesh 45.45 high, design height E 60); the head and arms are parts of it (attach points 2, 4, 5). Read the in-battle silhouette height for the repo's stature table (`FFX_GIANT_STATURE`), as for Genais and Natus. | `work/ffx-monster-sizes.tsv` row 117; the Genais precedent in `src/data/ffx/fiend-stature.ts`. |
| **Q-14** | **A sourced party preset** for the Ridge: a stat range or a Sphere Grid state at Mushroom Rock Road, so the preset is not a pure guess. | a published stat-range table (the Macalania preset used one, §8.3 of that research); otherwise the start records plus an AP model. |
| **Q-15** | **Is Yuna's Summon usable in battle 2**, and what the body's Demi targets while an aeon is out (the RE note says `Frontline` is the aeon alone). | the formation scripts show no Summon disable; confirm in the interpreter and in play. |
| **Q-16** | **The formation scripts' cosmetic facts the staging needs**: the camera polar settings, which map layers are the ruined state, and where the parts attach. | `work/kino03_10.dis.txt` w1 (camera) and w0 (scenes). |

---

## 13. The guide source: Jegged's page, in our own words

**Source.** `https://jegged.com/Games/Final-Fantasy-X/Walkthrough/12-Mushroom-Rock.html`, page title "Final Fantasy X Walkthrough: Mushroom Rock", under the **Ridge** heading, sections **"Sinspawn Gui / Boss Battle"** and **"Sinspawn Gui (Round 2) / Boss Battle"**. Read 2026-10-10. Bailey's rule: the strategy guide follows Jegged's layout, information and order, in our own words, with no source shown to the player (D-350).

**What Jegged says (own words).**
- Gui has four parts; the body is the real boss. HP 12,000. Scan text paraphrased as in §2.7.
- **Head:** it mostly casts Thunder; the on-screen warning that the head is stirring means Venom is next, a very strong attack; **hitting the head during the warning stops it**; use Wakka or Lulu to reach it; hit it every time you see the warning.
- **Arms:** they deflect attacks away from the body; **destroy both before attacking the body**; they will regenerate and you cannot prevent it.
- **Body:** alternates **Punch and Demi**, both quite hard; swap in Yuna to heal.
- **Plan:** Tidus's Haste on everyone; Lulu's Fire as often as possible (Jegged says the parts are weak to fire); Focus and Cheer early, stacking to five; use every character at least once for the AP and sphere levels. Steal: Potion. Drops: none.
- **Round 2** begins immediately: 6,000 HP, a much simpler fight because Seymour has several powerful attacks and the parts have less HP; **one Fire from Seymour to the head** takes care of it, then hammer the body. Drops: Lv. 1 Key Sphere x3.

**Where our chapter differs, and what to do (rule 6: the game's data wins).**
1. **No element is better** (G-1): leave Jegged's Fire line out of the guide; Fire still works, it is only not extra.
2. **"One Fire kills the head" is a cancel, not a kill** in battle 2: Fire does about 643 against 1,000 HP; **Fira kills it** (about 1,358). Teach "strike the head when it shakes" (a spell, Wakka, Lancet), not "kill it with one Fire".
3. **Seymour's Sensor and Overkill** are not in Jegged: the six-Key-Sphere Overkill (finish with Fira when the body is at about 558 HP or less) is a **WATCH** line from GameFAQs and Samurai.
4. **Requiem and Stoic** are not in Jegged; the guide may mention that his gauge fills only as he is hurt (a rule the player can use or ignore).
5. **Cheer and Focus** need the preset to know them (the Sphere Grid state is open, Q-14).
6. The advisor and the guide stay separate; neither may change the fight.

---

## 14. Recommendation for the chapter (FFX only)

**Build it**, as **one chapter of two links**:

1. **Link 1: the full-party fight.** The player picks three of Tidus, Yuna, Auron, Kimahri, Wakka and Lulu; Switch is allowed; Valefor and Ifrit are available. The head's cycle, the arms' shield and regeneration and the body's Attack and Demi rhythm are the whole lesson. It is the hard, fair part: the body hits for 540 to 790.
2. **A seam scene** (the beam, the scattering, the ruined camp).
3. **Link 2: Yuna, Auron and Seymour.** Switch off; HP and MP carried; Seymour's kit, the six-Key-Sphere Overkill and the chance to see Requiem. It is the payoff and the unique hook.
4. **Results** pay both battles' AP and Gil together; the Key Spheres and a Sleepstrike weapon or Sleepproof armour come from link 2.

**Minimum mechanic list:**

1. A **guest member** (Seymour: record, kit, Requiem, Stoic, Sensor and Piercing equipment) and a **link whose line-up is forced and whose Switch is off** (§10 A).
2. A **four-part enemy**: head out of melee reach, arms that never act, shield the body against **physical commands only** (spells, Overdrives, Lancet and items pass), and regenerate after three or four body turns; the body's counter rhythm (§4.4); the head's three-turn cycle and cancel rule (§4.3); the **second-battle overrides** (§4.7).
3. The body alone ends the battle; the AP and Gil of arm and head kills pay (§2.6).
4. Statuses, immunities, elements and rewards exactly as §2; **no element weakness**; Threaten off until checked.
5. No Anima, no Talk, no Switch in battle 2.

**It is mostly plumbing.** The hook set, `parts`, per-target reach, Armored, chains, seam scenes and checkpoints already exist (§10). The honest new work is the guest member and the link that changes the line-up; the AI module is a standard "Omnis-shaped" file. The two hard problems are **presentation**, not engine: (a) **the four parts and Gui's colossal scale must read at a glance** (which arm is up, which head state, what just happened), and (b) **commanding Seymour must feel like an event** (an entrance, a Requiem worth waiting for).

**Before anything is built (rules 9 and 10):** Bailey sees `concepts.md` and picks or mixes; the options for Gui's look and the Ridge follow from `art-brief.md`; the battle cues are audio sketches judged by ear; the party preset and Seymour's White Magic list wait on §12 (Q-7, Q-14). **Nothing in this file is a decision.**

---

## Sources

**Decompile-derived data** (Grayfox96/FFX-RNG-tracker, **pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680`**, read as text in the browser pane, nothing saved)
- https://github.com/Grayfox96/FFX-RNG-tracker
- `ffx_rng_tracker/data/data_files/formations.json` (`bosses.sinspawn_gui_1`, `sinspawn_gui_2`: four-part formation, forced party `""` and `"yas"`)
- `data_files/ffx_mon_data_hd.csv` and `ffx_mon_data.csv` rows 117, 160, 161; `data_files/monster_actions.json` (`m117`, `m160`, `m161`); `data_files/characters.json` (Seymour, index 7)
- `ffx_rng_tracker/data/monsters.py`, `characters.py`, `constants.py` (byte layout and enum order)

**The game itself** (Steam build 25501027, read-only, our own readers; nothing in any repo; facts and offsets only)
- `D:/Tools/rea/tools/q-ffxcmd.mjs` (command records: 0x3042 to 0x3048, 0x302b, 0x302c, 0x302e to 0x3032, 0x3043, 0x304e, 0x3000, 0x30d1, 0x30e3, 0x6000, 0x6001, 0x6031)
- `D:/Tools/rea/tools/atel.mjs` and `D:/Tools/ffx-parity/ai/ffx-yunalesca-bfa/allmon/m117.txt`, `m160.txt`, `m161.txt` (script reading), `vbf-list-ffx.tsv` (formation folder names)
- `D:/Tools/ffx-parity/ai/ffx-yunalesca-bfa/extract/.../kernel/ply_save.bin` (Seymour's record) and `D:/Tools/rea/tools/size-monsters.mjs` (model sizes)
- My scratch: `D:/Tools/pyrefly-scratch/2026-10-10/new-chapters/ffx-sinspawn-gui/work/`

**Final Fantasy Wiki** (read in the built-in browser pane, 2026-10-10)
- Sinspawn Gui: https://finalfantasy.fandom.com/wiki/Sinspawn_Gui
- Seymour Guado: https://finalfantasy.fandom.com/wiki/Seymour_Guado
- Mushroom Rock Road: https://finalfantasy.fandom.com/wiki/Mushroom_Rock_Road
- Operation Mi'ihen (Final Fantasy X): https://finalfantasy.fandom.com/wiki/Operation_Mi'ihen_(Final_Fantasy_X)
- Final Fantasy X enemy abilities: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_enemy_abilities
- Final Fantasy X: Original Soundtrack ("Peril", "Challenge"): https://finalfantasy.fandom.com/wiki/Final_Fantasy_X:_Original_Soundtrack

**Guides, play record and script**
- GameFAQs, bover_87, *Final Fantasy X Remaster Walkthrough (PC)*, "Mushroom Rock": https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/79145/mushroom-rock ; "Overdrive Modes": .../79145/overdrive-modes
- Jegged, FFX Walkthrough 12, "Mushroom Rock": https://jegged.com/Games/Final-Fantasy-X/Walkthrough/12-Mushroom-Rock.html
- GamerGuides, HD walkthrough, Operation Mi'ihen: https://www.gamerguides.com/final-fantasy-x-hd/guide/walkthrough/mushroom-rock/operation-miihen ; bestiary: https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/sinspawn-gui (same author, counted once)
- Samurai Gamers, *Sinspawn Gui Boss Guide*: https://samurai-gamers.com/final-fantasy-x-x2-hd-remaster/sinspawn-gui-boss-guide/
- The Let's Play Archive, The Dark Id, *Final Fantasy X*, Part 49 "A Guest in My Party": https://lparchive.org/Final-Fantasy-X-(by-The-Dark-Id)/Update%2049/
- Auronlu, *FFX Game Script*, Chapter V (Operation Mi'ihen, Djose): http://auronlu.istad.org/ffx-script/chapter-v-operation-miihen-djose/
- TheGamer, "final fantasy 10 weirdest bosses" (the "scorpion-like" look, via search result only): https://www.thegamer.com/final-fantasy-10-weirdest-bosses/

**Local prior research and code consulted:** `research/ffx-seymour-omnis.md` (format, `outOfMeleeReach`), `research/re-ffx-ai-seymour.md` (script format and hook semantics), `research/ffx-combat-core.md` §1.2, §2, §5, `research/ffx-seymour-flux.md` §18 (Challenge), `research/writing-bible.md` §1.9 and §2.1, `docs/plans/next-content-2026-09-27.md`, `docs/PRODUCT-BRIEF.md`, `docs/ARCHITECTURE.md`, `docs/ART-PIPELINE.md`, `src/battle/common/types.ts`, `src/battle/ffx/{setup,reach,targeting}.ts`, `src/battle/ffx/ai/hooks.ts`, `src/battle/ffx/kernel/modifiers.ts`, `src/app/screens/BattleScreenSetup.ts`, `src/data/ffx/{ids.ts,characters/index.ts,fiend-stature.ts}`, `src/data/encounters.ts`, `src/data/chapters-unlisted.ts`.

---

## Verification log (2026-10-10)

| # | Claim | Check | Result |
|---:|---|---|---|
| 1 | Damage helper | `work/damage-calc.mjs` against combat-core §2.5 and §2.6 (8 values) | 8 of 8 identical |
| 2 | Body, head and arm records | tracker HD rows 117, 160, 161 against wiki, GameFAQs, Samurai, GamerGuides | agree, except G-3 to G-6 |
| 3 | The three ids | `monster_actions.json` keys give Thunder, Demi, Attack, Venom for `m117` and Special 1 for `m160`; the scripts' behaviour matches | agree |
| 4 | Elements neutral | record bits 43 to 46 for all three rows | all neutral; Jegged outvoted (G-1) |
| 5 | Venom Poison and Slow | decoded command record, wiki ability table, Samurai | agree |
| 6 | Second battle: HP 6,000, STR 15, MDF 0, head 1,000, AP 0 | `m117` init, wiki, GamerGuides bestiary, damage vs the wiki's "under 200" | agree |
| 7 | Head cycle and cancel rule | `m160` onTurn and onHit against wiki, GameFAQs, Jegged, GamerGuides, Samurai | agree |
| 8 | Arms regenerate in three to four body turns | `m117` onTurn counter against wiki and GameFAQs | agree |
| 9 | The shield: physical or other, only while an arm lives, per command | `m117` onTargeted against wiki, GameFAQs, GamerGuides | agree |
| 10 | Two formations; Switch off in the second | `kino02_00` and `kino03_10` init; the tracker's `"yas"` | agree (pairing consistent, Q-1) |
| 11 | Seymour's record | `ply_save.bin` slot, tracker `characters.json`, wiki | agree except Luck 17 (tracker) |
| 12 | Anima absent | wiki Seymour page, LP, Auronlu chapter, GameFAQs | absent from play and from the sequence |
| 13 | PS2 against HD | byte diff of the three rows | byte 403 (all three), byte 78 on head and arm (HD adds Distiller immunity) |
| 14 | Sizes | `size-monsters.mjs` row 117 against the Genais and Natus rows and `fiend-stature.ts` | same method; Gui E 60, bind pose 181.8 |
| 15 | Body rhythm | the real `m117` bytecode in the lane's mock interpreter, 4,000 seeds per case (`work/run-gui-vm.mjs`, `run-gui-vm2.mjs`) | battle 1 above 4,000 HP: Attack, Attack, Demi, Attack 100 percent; below 4,000 HP and in battle 2: turn one Attack, turn two Demi 50 percent; matches the reading, not the wiki's wording |
| 16 | Arm regeneration | both arms dead, count body turns to the regeneration scene, 4,000 seeds | turn 3: 50.0 percent, turn 4: 50.0 percent |
| 17 | Head cycle, cancel, relay, shield | `m160` onTurn and onHit, `m117` onTargeted (`work/run-gui-vm3.mjs`) | cycle relay, warning, relay; cancel on damage in the warning state only; selector 1 gives Thunder, 2 gives Venom; Attack is shielded with an arm alive; Fire, Fira, Requiem, Cure, Hellfire and an item are not |
| 18 | Which commands are physical | the game's own command table, `work/shield-types.mjs` | 44 player commands of type 1, none of type 3; **the first draft of this file said "physical or other"; the run and the table corrected it to physical only** |
| 19 | Battle-2 overrides | `m117` and `m160` init, both battle ids (`work/run-gui-vm4.mjs`) | battle 2 reads body HP 12,000 to 6,000, head 4,000 to 1,000, STR 29 to 15, MDF 30 to 0, AP 400/600 to 0/0; drops zeroed in battle 1 and kept in battle 2 |
