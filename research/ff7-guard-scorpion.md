# FINAL FANTASY VII (1997) — Guard Scorpion, No. 1 Reactor core: the boss, its AI, and the canon party

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-09-27 ~00:35 EDT: "go with guard scorpion first, full speed ahead, but make it a hidden selectable encounter since it's experimental then tell me how to select it. dont make it so obvious on the encounter/chapter menu"
**Research date:** 2026-09-27
**Game case (AGENTS.md rule 14):** **FF7 only.** Original *Final Fantasy VII* data. The Remake's "Scorpion Sentinel" is a different enemy with different numbers and phases; it is not used here (the earlier D:\FF7 work has it in `enemies.md` §1.4 if it is ever wanted, labelled as Remake).
**Rules in force:** rule 6 (every number sourced or marked), rule 8 (original art and audio only: the music and the look below are **references**, never assets), rule 9 (the look of the fight still needs an options round and Bailey's pick).
**Companion file:** `research/ff7-battle-core.md` (the ATB, the formulas, rows, Limit, Materia, rewards). Section references like "core §4.5" point there.

---

## 0. Provenance and tags

Tags are the same as `research/ff7-battle-core.md` §0.1: `[verified: N sources]`, `[single source]`, `[derived]`, `[estimate]` ("our estimate" to Bailey), `[unsourced]`, `[conflict]`.

**Sources used here, ranked** (full list at the end):

1. **Terence Fergusson, *The FF7 Enemy Mechanics* v1.11** (GameFAQs FAQ 31903, 2009-07-31), §5.1.1 "No. 1 Reactor": the Guard Scorpion stat block, attacks and AI script, and the reactor's other enemies. Preferred on conflict.
2. **Terence Fergusson, *FF7 Party Mechanics*** (GameFAQs FAQ 36775): starting stats, XP curve, weapons, Limits.
3. **Final Fantasy Wiki**, "Guard Scorpion (Final Fantasy VII)", revid 4014097: stats (in its halved display convention), a second transcription of the AI script, the battle music, the formation, the misleading-hint note.
4. **Gamer Corner Guides**, Guard Scorpion: internal Defense / Magic Defense values and printed damage figures.
5. **Jegged** reactor walkthrough; the wiki's quest and field pages.
6. **D:\FF7 (Lifestream Encore)** `enemies.md` §1, `party.md` §4, `scenes.md` §3: earlier research on this PC. Reused where it matches; errors listed in §13.

Fergusson's scripts are written in his own simplified pseudocode; the one below is restated in ours from his and the wiki's transcriptions, which agree on every branch (§5.3).

---

## 1. At a glance

| | |
|---|---|
| What | The first boss of FF7. Cloud and Barret fight it at the core of the No. 1 Reactor, during the opening bombing mission. |
| Size | Lv 12, **800 HP**, 0 MP. |
| The mechanic | A fixed 8-turn cycle. On its 5th turn it raises its tail; for its next two turns it does nothing; on the 8th it lowers the tail. **While the tail is up, every attack on it is answered with Tail Laser on the whole party**, and its Defense and Magic Defense jump. |
| The lesson | Hit it with Bolt (it is weak to Lightning) while the tail is down; heal and wait while the tail is up. |
| The hint | Cloud's in-battle line reads, in the English release, as advice to attack while the tail is up. It is badly worded: attacking then is exactly what triggers the laser (§7). |
| Escape | Not possible. |
| Rewards | 100 EXP, 10 AP, 100 gil, and a certain Assault Gun. |

---

## 2. Stat block

### 2.1 Numbers

| Field | Tail down (1st form) | Tail up (2nd form) | Tag |
|---|---|---|---|
| Level | 12 | 12 | `[verified: 3 sources — Fergusson EM, wiki, Gamer Corner]` |
| HP | 800 | 800 | `[verified: 3 sources]` |
| MP | 0 | 0 | `[verified: 2 sources — Fergusson, wiki]` |
| Attack (Att) | 30 | 30 | `[verified: 3 sources]` |
| Physical base damage `P` | 41 | 41 | `[verified: 2 sources — Fergusson "(41)" beside Rifle; Gamer Corner "30 (41)"]`; `30 + [42/32] * [360/32] = 41` `[derived]` |
| Magic attack (MAt) | 15 | 15 | `[verified: 3 sources]` |
| **Defense** | **40** | **255** | `[verified: 3 sources — Fergusson; Gamer Corner 40; wiki 20 displayed (halved convention) and 255 for the raised form]` |
| **Magic defense** | **256** | **384** | `[verified: 3 sources — Fergusson's transformation line and Setup; wiki "magic def ai" 256 / 384; Gamer Corner 256]`. See 2.2. |
| Defense% (evade) | 0 | 0 | `[verified: 3 sources]` |
| Dexterity | 60 | 60 | `[verified: 3 sources]` |
| Luck | 1 | 1 | `[verified: 3 sources]` |
| EXP / AP / gil | 100 / 10 / 100 | | `[verified: 3 sources]` |
| Drop | **Assault Gun, certain** | | `[verified: 2 sources — Fergusson "Win: 100% Assault Gun"; wiki class 63 with the rule (class+1)/64]`. See 2.2. |
| Steal / Morph | none / none | | `[single source: Fergusson]` |

### 2.2 Two traps in the numbers

1. **Magic defense 300 is not the value used.** Fergusson's header lists MDf 300 and immediately notes it is not the MDf in use: the Setup routine sets it to 256, and the tail-up form uses 384 `[single source: Fergusson EM]`. The wiki shows `magic def = 150` (halved display of 300) beside `magic def ai = 256` and `2 magic def ai = 384`. **Use 256 / 384.**
2. **The drop is certain, not 24.7%.** The drop byte 63 is a chance class out of 63 (`Rnd(0..63) <= 63`) `[verified: 2 sources — Fergusson EM §4.1; wiki battle rewards]`. The earlier D:\FF7 research read it as 63/255; that is wrong.

Defense 40 → the party's physical damage is multiplied by `(512-40)/512` = 92%; 255 → 50%. Magic defense 256 → 50%; 384 → 25% `[derived; Gamer Corner prints 92% and 50% for form 1]`.

---

## 3. Elements and statuses

| | Tag |
|---|---|
| **Weak: Lightning** (x2) | `[verified: 3 sources — Fergusson, wiki, Gamer Corner]` |
| **Void (immune): Gravity** | `[verified: 2 sources — Fergusson "Void", wiki "Immune"]`; Gamer Corner's page was summarised to us as "Resists: Gravity" `[conflict, minor]`. Nobody has Gravity at this point, so it cannot matter. |
| Everything else neutral, including Ice, Cut, Shoot | `[verified: 2 sources — Fergusson lists nothing else; wiki the same]` |
| Immune to: Death, Sleep, Poison, Sadness, Fury, Confusion, Silence, Frog, Small, Slow-numb, Petrify, Death-sentence, Manipulate, Berserk, Paralysed, Darkness | `[verified: 3 sources]` |

Not in the immunity list: Slow, Stop, Haste, Barrier and the like `[derived]`. No party ability at this point inflicts any status, so the list only matters later.

---

## 4. Abilities

| Ability | Used | Formula | Power | PAt% | Target | Element | Tag |
|---|---|---|---|---|---|---|---|
| **Search Scope** | tail down, turns 1 and 3 of the cycle | none: no damage, no effect | | always hits | one opponent | | `[verified: 3 sources — Fergusson lists it as an "Animation" that selects the next target; wiki "Chooses a target for its next attack"; Gamer Corner "always hits, no damage"]`. Prints **"Locked On Target"** `[verified: 2 sources — Fergusson, wiki]` |
| **Rifle** | tail down only | Physical | 1x Base (16) → 41 | 100 | one | Shoot | `[verified: 2 sources — Fergusson; Gamer Corner]` |
| **Scorpion Tail** | tail down only | Physical | 1 3/4x Base (28) → 71.75 | 95 | one | Shoot | `[verified: 2 sources]` |
| **Tail Laser** | **only as a counter while the tail is up** | Physical | 3x Base (48) → 123 | 120 | **all opponents** | Shoot | `[verified: 3 sources — Fergusson "100% C/A during 2nd Form"; wiki; Gamer Corner]` |
| Raise Tail / Drop Tail | turns 5 and 8 | no effect (form change and animation) | | | self | | `[verified: 2 sources — Fergusson "<>" self; wiki "Raise Tail" / "Drop Tail"]` |

None of the attacks is Long Range, so a back-row target takes half `[single source: Fergusson EM lists them as "Physical Attack", not "Physical LR Attack"]` `[derived via core §4.5]`. Tail Laser hits two targets, so it is split (`x 2/3`) `[derived: core §4.5 step 8]`.

**Damage to the canon party** (Cloud Def 25, Barret Def 27; core §4.1 and §4.5) `[derived]`:

| Ability | Front row | Back row | Target Defended | Hit chance |
|---|---|---|---|---|
| Rifle | 35 to 38 | 17 to 19 | 17 to 19 | Hit% 113: hits unless Lucky Evade (Cloud 3%, Barret 4%) |
| Scorpion Tail | 62 to 68 | 30 to 34 | 30 to 34 | Hit% 108: same |
| Tail Laser, each | **72 to 77** | 35 to 38 | 35 to 38 | Hit% 133: same |

Critical chance for the boss is 1% against Cloud (`[(1 + 12 - 7) / 4]`) `[derived]`. Gamer Corner's own printed figures (30, 53, 59) are the same abilities against its reference Defense of 140, with the split on Tail Laser; they agree with this formula (D:\FF7 `enemies.md` §0.3.1 checked the convention on nine abilities).

---

## 5. The AI script

### 5.1 Restated (behaviour-exact; our wording)

```
SETUP (once, battle start)
  MDf       = 256                       // overrides the listed 300
  keep DefaultDef = 40, DefaultMDf = 256, default idle / hurt animations
  Stage = 0; Count = 0; Warning = 0     // all temp vars start at 0

MAIN (each time its ATB gauge fills)
  if Count == 0 or Count == 2:
      Target = random opponent
      use Search Scope on Target; show "Locked On Target"
      Count += 1
  elif Count == 1 or Count == 3:
      with chance 1/3:          use Scorpion Tail on Target
      otherwise:
          if HP < MaxHP / 2:    use Scorpion Tail on Target
          else:                 use Rifle on Target
      Count += 1
  elif Count == 4:
      use Raise Tail (self); switch to the raised idle and hurt animations
      Def = 255; MDf = 384; Stage = 1
      if Warning == 0:
          show the warning lines (§7) chosen by who is alive
          Warning = 1
      Count += 1                         // 5
  elif Count == 5 or Count == 6:
      Count += 1                         // the turn passes, no action
  elif Count == 7:
      use Drop Tail (self); default animations
      Def = 40; MDf = 256; Stage = 0
      Count = 0

COUNTER, general (whenever an opponent's action hits it)
  if Stage == 1: use Tail Laser on all opponents

COUNTER, on death
  if Stage == 1: use Drop Tail (animation only; restores the lowered idle and hurt poses)
```

`[verified: 2 sources — Fergusson EM §5.1.1 "AI: Setup / Main / Counter - General / Counter - Death"; wiki "AI script" (Start of battle / Turn / Counter - if attacked / Counter - if killed)]`. The two transcriptions differ only in layout: Fergusson rolls the 1/3 first; the wiki rolls 2/3 first. The outcome probabilities are identical.

### 5.2 The cycle, turn by turn

| Its turn | Count before | Action | Tail | Counter active? |
|---|---|---|---|---|
| 1 | 0 | Search Scope on a random opponent | down | no |
| 2 | 1 | Rifle or Scorpion Tail on that opponent | down | no |
| 3 | 2 | Search Scope on a (new) random opponent | down | no |
| 4 | 3 | Rifle or Scorpion Tail on that opponent | down | no |
| 5 | 4 | **Raise Tail** (+ the warning, first time only) | **up** | **yes, from this action on** |
| 6 | 5 | nothing | up | yes |
| 7 | 6 | nothing | up | yes |
| 8 | 7 | **Drop Tail** | down | no, from this action on |
| 9 | 0 | Search Scope (cycle repeats) | down | no |

`[verified: 2 sources — the script; Fergusson's summary line "Search Scope, Attack, Search Scope, Attack, Transform to 2nd Form, Wait, Wait, Transform to 1st Form, Repeat"; the wiki repeats the same pattern]`.

**Attack choice on turns 2 and 4** `[derived from 5.1]`: at `HP >= 400`, Rifle 2/3 and Scorpion Tail 1/3; at `HP < 400`, Scorpion Tail always.

### 5.3 What the tail is keyed to

**The tail is on the turn counter, not on HP.** The script never reads HP for the tail; it rises on the 5th of every 8 of the boss's turns whatever damage it has taken `[verified: 2 sources — Fergusson, wiki]`. Fergusson's header phrase "Transforms to 2nd Form after using two Attacks" says the same thing. Gamer Corner's prose ("after 400 damage dealt, it favors Scorpion Tail") describes the HP check on turns 2 and 4, not the tail. **Do not let a reviewer turn this into an HP gate.**

### 5.4 How long the tail stays up `[derived]`

From the Raise Tail action (turn 5) to the Drop Tail action (turn 8) is **three of its gauge fills**. At Battle Speed 128 with the canon party that is about `3 * 361` = **1,083 ticks** (core §2.3). In seconds that depends on the unsourced tick rate (core §2.2): at the 30-per-second estimate, about 36 seconds of running time, longer in Recommended or Wait mode because animations pause the gauge `[estimate]`. In party turns: Cloud and Barret each get about three turns while the tail is up `[derived]`.

### 5.5 Counter details

- **Trigger:** Fergusson files Tail Laser under "Counter - General", the wiki under "Counter - if attacked". Every hostile action that hits it while `Stage == 1` (Attack, Bolt, Ice, a Limit) triggers one Tail Laser `[verified: 2 sources]`.
- **Chance:** 100% while the tail is up, never while it is down `[verified: 3 sources]`.
- **A killing blow while the tail is up does not trigger the laser:** the death counter runs instead and only resets the animation `[verified: 2 sources — both scripts have a separate death counter with no attack]`.
- **Not triggering it:** healing your own party, Defend, Item on an ally, and doing nothing `[derived: these never target the boss]`.
- `[unsourced]`: whether a **missed** attack triggers the counter, and whether it counters an attack that did 0 damage. Neither can happen with the canon party (their hit chances are about 100% and nothing they have is resisted) `[derived]`. Our estimate for the engine: any hostile action targeting it triggers the counter, hit or miss, and a test pins that choice.

### 5.6 Targeting edge case `[unsourced]`

The target chosen by Search Scope on turn 1 (or 3) is the one attacked on turn 2 (or 4). What happens if that character is KO'd in between is not in either transcription. Our estimate: pick a random living opponent instead, and say so in the engine's test names.

---

## 6. Staging timeline of one full cycle `[derived]`

With the canon party at default speed, all three combatants fill at almost the same rate (core §2.3), so a cycle of 8 boss turns is roughly 8 Cloud turns and 8 Barret turns. A player who never attacks while the tail is up gets about **5 attacking turns each per cycle** (the boss's turns 8 to 4) and spends 3 each healing, defending or waiting.

---

## 7. The hint line

### 7.1 Verbatim, and who says it

Shown once per battle, on the first Raise Tail. The lines depend on who is alive `[verified: 2 sources — Fergusson EM script, wiki script]`:

| Who is alive | Speaker | Lines (PlayStation English as transcribed; names are the player's chosen names) |
|---|---|---|
| Cloud and Barret | Cloud | "(Barret), be careful!" / "Attack while it's tail's up!" / "It's gonna counterattack with its laser." |
| Cloud only | Cloud | "It's gonna fire that laser..." / "Attack while it's tail's up!" / "It's gonna counterattack with its laser." |
| Barret only | Barret | "I dunno what's goin' on, but..." / "it looks pretty bad." / "Let's see what it does when it's tail's up..." |

The "it's" spelling is the game's (the wiki marks it `sic`).

### 7.2 Why it misleads

The wiki's battle note: Cloud's advice is worded awkwardly and the gap between the two messages makes it misleading; read together they mean "if you attack while its tail is up, it will counterattack with its laser" `[single source: wiki Guard Scorpion "Battle" note]`. The wiki's note words the third line "It'll counterattack with its laser!", while both script transcriptions have "It's gonna counterattack with its laser." `[conflict, minor]`: use the transcriptions (Fergusson preferred). **The Japanese original line was not retrieved** `[unsourced]`; any claim about what it says needs a source first.

### 7.3 For the fan game

The hint is a canon moment and a teaching beat. Whether to keep the misleading English wording, fix it, or show both is a presentation decision for Bailey (rule 9). It is not decided here.

---

## 8. The canon party at the fight

### 8.1 Levels

| | Level | How | Tag |
|---|---|---|---|
| **Cloud** | **7** (8 possible with extra fights) | Starts at Lv 6 with 610 XP; Lv 7 needs 616. The opening battle (two MPs, 16 EXP each) is forced, so every player reaches Lv 7 before the reactor. Lv 8 needs 949, about 300 more EXP from optional reactor fights (Grunt 22, Guard Hound 20, Mono Drive 18, Sweeper 27, 1st Ray 12 each) | `[derived from verified inputs: Fergusson PM §1.1, §1.2 and EM §5.1.1; wiki Cloud table lists 616 / 949]` |
| **Barret** | **6** (7 possible) | Joins at one level below the party average when he is named, which is after the first battle; with Cloud at Lv 7 that is Lv 6 (385 XP). Lv 7 needs 637 | `[verified: 2 sources — Fergusson PM §1.1 "Barret: gains BrXP(Av - 1)"; wiki Barret "joins the party one level lower than Cloud", "after Cloud's first battle"]` |

**Our estimate for the preset: Cloud Lv 7, Barret Lv 6** (the level every player is guaranteed to have). D:\FF7 chose the same.

### 8.2 Stats

Level-ups roll random gains that self-correct toward a curve (Fergusson PM §1.4), so a level has a range, not a value. Ranges are the wiki's per-level tables; the "preset" column is the median of 4,001 simulated runs of Fergusson's level-up algorithm done in the earlier D:\FF7 research (`party.md` §2), which falls inside every wiki range.

| Base stat | Cloud Lv 7 range | Cloud preset | Barret Lv 6 range | Barret preset |
|---|---|---|---|---|
| HP | 323 to 334 | 329 | 313 to 334 | 323 |
| MP | 55 | 55 | 42 to 44 | 43 |
| Str | 20 to 22 | 21 | 17 to 22 | 19 |
| Vit | 16 to 18 | 17 | 16 to 22 | 19 |
| Mag | 19 to 22 | 21 | 14 to 19 | 16 |
| Spr | 17 to 19 | 18 | 12 to 17 | 15 |
| Dex | 7 to 9 | 9 | 6 to 12 | 10 |
| Lck | 14 to 17 | 15 | 13 to 19 | 17 |

Tags: ranges `[single source: wiki Cloud and Barret stat tables]`, consistent with Fergusson's Lv 6 / Lv 1 starting rows `[verified: 2 sources for the starting rows]`; preset `[estimate]` (a median, not a canon value).

### 8.3 Equipment `[verified: 2 sources — Fergusson PM §4.1.1, §4.1.2, §4.2; wiki Cloud and Barret pages]`

| | Cloud | Barret |
|---|---|---|
| Weapon | **Buster Sword**: Att 18, At% 96, Mag +2, slots `O=O`, Cut, melee; cannot be sold or thrown | **Gatling Gun**: Att 14, At% 97, Mag 0, slot `O`, Shoot, **Long Range**; cannot be sold or thrown |
| Armour | **Bronze Bangle**: Def 8, no slots | **Bronze Bangle** |
| Accessory | none | none |

No accessory can be had before this fight `[estimate: none appears in any reactor item list we read]`.

### 8.4 Materia and the derived preset

Owned: **Lightning, Ice** (on Cloud's Buster Sword from the start) and **Restore** (picked up on the walkway just before the boss) `[verified: 2 sources each; core §8.2]`. The only free slot is Barret's, so Restore goes on Barret or stays unequipped unless the player swaps out Ice or Lightning `[derived]`. **Our estimate for the preset: Lightning + Ice on Cloud, Restore on Barret.**

Each of these Materia gives HP -2%, MP +2%, Str -1, Mag +1 (core §8.3). Derived battle stats with that preset `[derived]`:

| | Cloud | Barret |
|---|---|---|
| Max HP | 316 | 317 |
| Max MP | 57 | 43 |
| Att / At% | 37 / 96 | 32 / 97 |
| Def / Df% | 25 / 2 | 27 / 2 |
| MAt / MDf | 25 / 18 | 17 / 15 |
| Commands | Attack, Magic (Bolt 4 MP, Ice 4 MP), Item, Defend, Change | Attack, Magic (Cure 5 MP), Item, Defend, Change |
| Limit | Level 1: **Braver** | Level 1: **Big Shot** |

### 8.5 Rows, Limit gauge, inventory

- **Rows:** the starting rows are `[unsourced]`. The wiki's strategy suggests Barret in the back row, since his gun is Long Range `[single source: wiki]`. Our estimate for the preset: both front, the player may Change.
- **Limit gauge at the boss:** it carries over from earlier fights (core §7.2), so it depends on the run; its value at a new game is `[unsourced]`. Our estimate: start at 0.
- **Inventory:** a player who used nothing has at least **3 Potions and 1 Phoenix Down** (core §8.6) `[verified: 2 sources]`; the new-game inventory itself is `[unsourced]`; MP drops can add Potions. Our estimate for the preset: Potion x3, Phoenix Down x1.

---

## 9. The fight in numbers `[derived]`

Party damage against the boss (core §14, preset stats):

| Action | Tail down (Def 40 / MDf 256) | Tail up (Def 255 / MDf 384), and it triggers Tail Laser |
|---|---|---|
| Cloud Attack | 38 to 41 | 20 to 22 |
| **Cloud Bolt** | **90 to 96** | 44 to 48 |
| Cloud Ice | 45 to 48 | 22 to 24 |
| Cloud Braver | 116 to 124 | 62 to 67 |
| Barret Attack | 32 to 35 | 17 to 19 |
| Barret Big Shot | 105 to 113 | 57 to 61 |

- **Bolt always hits** (Hit% 100, core §3.2). Nine Bolts (36 MP of Cloud's 57) kill it on their own.
- A **tail-down round** (one Cloud Bolt + one Barret Attack) does about 126 on average; 800 HP is about **6 to 7 such rounds**, i.e. one full cycle plus a few turns of the next.
- **Limit fill** (Cloud Max HP 316, LNum 140; Barret 317, LNum 129): a Rifle hit (38) gives Cloud 65 units and Barret 69; a Scorpion Tail (68) gives 117 and 127; a Tail Laser hit (77) gives 133 and 142. A gauge is full at 255, so Cloud needs about 147 HP of damage (46.5% of 316) and Barret about 136 (42.8% of 317): two Tail Lasers, or two Scorpion Tails and a Rifle. Two Scorpion Tails alone leave Cloud at 234 and Barret at 254 (one unit short); three Rifles leave them at 195 and 207.
- **Punishment for attacking while the tail is up:** each hit costs both characters 72 to 77 HP, about a quarter of their Max HP, for half damage or less in return.
- **Cure** from Barret: 232 to 248 HP (5 MP, 8 casts); Potion: 100.

---

## 10. Arena, staging, and what happens around the fight

- **Where:** the core of the No. 1 Reactor, reached by ladders down from the main staircase and piping. The core area is two screens: a walkway with a **save point** (and the Restore Materia), then the core itself, a large tubular structure set into a wall with pipes running to a valve at its base. The battle uses the "reactor 1 core" battle background, distinct from the rest of the reactor `[single source: wiki "No. 1 Reactor (Final Fantasy VII field)"]`. The battle is at the core, not on the walkway or the outside bridge `[derived from the same page]`.
- **Who is there:** Cloud and Barret only `[verified: 2 sources — wiki Guard Scorpion page; wiki field page]`. Biggs and Jessie open the reactor's locked doors earlier and are not in the battle `[single source: wiki field page]`.
- **Before:** a short scene at the core starts the battle `[single source: wiki "No. 1 Reactor Bombing"]`.
- **After:** a countdown timer starts as soon as the boss dies, to escape the reactor; the player frees Jessie on the way out `[verified: 2 sources — wiki quest page; Jegged]`. The timer's length is `[unsourced]` here.
- **1996 demo:** the Guard Scorpion is replaced by an enlarged Sweeper with two Grunts `[single source: wiki]`. Trivia only.
- **Art:** every visual here is a reference for an **original** painting (rule 8). No retail FF7 models, textures, backgrounds or screenshots in the repo. The look needs an options round and Bailey's pick (rule 9).

---

## 11. Music (reference only, never the audio)

The Guard Scorpion battle plays **"Opening ~ Bombing Mission"** (オープニング～爆破ミッション), composed and arranged by **Nobuo Uematsu**, not the usual boss theme "Those Who Fight Further" `[single source: wiki Guard Scorpion page and the track's page]`. Rule 8 forbids shipping it or any recording of it. Any cue for this fight is an original composition, and it needs an audio sketch for Bailey to judge by ear (rule 13 and the end-state rule).

---

## 12. Rewards

| EXP | AP | Gil | Item |
|---|---|---|---|
| 100 | 10 | 100 | Assault Gun (certain) |

`[verified: 3 sources for EXP/AP/gil; 2 for the certain drop]`. Assault Gun: Att 17, At% 98, Mag +1, slots `O=O`, Shoot, Long Range `[single source: Fergusson PM §4.1.2]`. With 100 EXP, Cloud (616 + opening fights) may reach Lv 8 at 949 depending on earlier fights `[derived]`.

---

## 13. Conflicts, open questions, corrections

| # | Item | Status and recommendation |
|---|---|---|
| G1 | Magic defense 300 / 150 / 256 | **Closed: 256 (tail down), 384 (tail up).** §2.2. |
| G2 | Defense 20 vs 40 | **Closed: 40.** The wiki displays halved values. |
| G3 | Drop chance | **Closed: certain.** D:\FF7's 24.7% is a misreading (§2.2). |
| G4 | Gravity: Void vs "Resists" | Fergusson and the wiki say Void. Use Void. Unreachable. |
| G5 | Tail trigger: turns or HP | **Closed: turns** (§5.3). |
| G6 | A missed or 0-damage hit while the tail is up: does it counter? | `[unsourced]`, unreachable with the canon party. Our estimate: yes, any hostile action on it. |
| G7 | Search Scope target KO'd before the attack | `[unsourced]`. Our estimate: retarget a random living opponent. |
| G8 | Third hint line wording | Transcriptions: "It's gonna counterattack with its laser." Wiki note: "It'll counterattack with its laser!" Use the transcriptions. |
| G9 | Japanese hint line | Not retrieved. Say nothing about it until sourced. |
| G10 | Starting rows, starting Limit gauge, new-game inventory | `[unsourced]`. Preset choices in §8.5 are our estimates; show them to Bailey as such. |
| G11 | Tail-up time in seconds | Ticks are sourced; the tick rate is not (core §2.2). |
| G12 | Real-game check | Only with Bailey's go-ahead, and only if Bailey owns a copy; the Steam-copy rule in memory is FFX's. |

**Corrections to D:\FF7 (do not copy):** the drop rate (G3); "Shoot ignores the back row" (it does not; core §15.2); the Restore Materia missing from the party (§8.4); the design proposals in `enemies.md` §1.5 (a 1,600-HP "Encore mode", field generator, legs) are **inventions** drawn from the Remake, not FF7 data, and need Bailey's yes under rule 10 before any of them is built.

---

## Sources

**GameFAQs** (built-in browser pane, 2026-09-27; WebFetch returned HTTP 403)

- Terence Fergusson, *The FF7 Enemy Mechanics* v1.11, updated 2009-07-31, FAQ 31903, §4.1, §4.2, §5.1.1 (MP, Guard Hound, Mono Drive, Grunt, 1st Ray, Sweeper, Guard Scorpion): https://gamefaqs.gamespot.com/ps/197341-final-fantasy-vii/faqs/31903
- Terence Fergusson, *FF7 Party Mechanics*, FAQ 36775, §1.1 to §1.3, §2.1, §3.3.1, §3.3.2, §4.1.1, §4.1.2, §4.2, §5: https://gamefaqs.gamespot.com/pc/130791-final-fantasy-vii/faqs/36775
- Terence Fergusson, *The FF7 Battle Mechanics* v1.10, updated 2009-06-29, FAQ 22395 (formulas used in §4 and §9): https://gamefaqs.gamespot.com/ps/197341-final-fantasy-vii/faqs/22395
- Message board thread "Guard Scorpion Confusion Resolved" (read; not used as a source, it is player opinion): https://gamefaqs.gamespot.com/boards/197341-final-fantasy-vii/52710306

**Final Fantasy Wiki** (`api.php?action=parse&prop=wikitext` from the browser pane, 2026-09-27)

- Guard Scorpion (Final Fantasy VII), revid 4014097: https://finalfantasy.fandom.com/wiki/Guard_Scorpion_(Final_Fantasy_VII)
- Final Fantasy VII enemy abilities, revid 4052059 (Search Scope, Tail Laser rows): https://finalfantasy.fandom.com/wiki/Final_Fantasy_VII_enemy_abilities
- No. 1 Reactor (Final Fantasy VII field), revid 3874852: https://finalfantasy.fandom.com/wiki/No._1_Reactor_(Final_Fantasy_VII_field)
- No. 1 Reactor Bombing, revid 3865377: https://finalfantasy.fandom.com/wiki/No._1_Reactor_Bombing
- Cloud (Final Fantasy VII party member), revid 4042478: https://finalfantasy.fandom.com/wiki/Cloud_(Final_Fantasy_VII_party_member)
- Barret (Final Fantasy VII party member), revid 4026950: https://finalfantasy.fandom.com/wiki/Barret_(Final_Fantasy_VII_party_member)
- Opening - Bombing Mission, revid 3993218: https://finalfantasy.fandom.com/wiki/Opening_~_Bombing_Mission
- Final Fantasy VII battle system, revid 4039023 (drop rule): https://finalfantasy.fandom.com/wiki/Final_Fantasy_VII_battle_system

**Other**

- Gamer Corner Guides, Guard Scorpion (WebFetch, 2026-09-27): https://guides.gamercorner.net/ffvii/monsters/guard-scorpion
- Jegged, *Final Fantasy VII Walkthrough: Train Station, Sector 1 and Sector 8* (no author or date shown): https://jegged.com/Games/Final-Fantasy-VII/Walkthrough/Disc-1/01-Train-Station-Sector-1-Sector-8.html
- Earlier local research, not an independent source: `D:\FF7\docs\research\enemies.md` §1, `party.md` §2 and §4, `scenes.md` §3, `formulas.md` §5.
- Not retrievable this session: FF7 Speedrun Wiki, Guard Scorpion (HTTP 500): https://ff7speedruns.com/index.php/Guard_Scorpion
