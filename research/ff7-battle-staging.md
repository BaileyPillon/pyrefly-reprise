# FINAL FANTASY VII (1997) — battle staging: screen side, facing, camera, rows, and the canon sides of Barret's gun-arm and Cloud's pauldron

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-09-27 ~00:45 EDT: "full speed ahead please. godspeed. ill go with all your recommendations. what is your question about barret?" The recommendation accepted with it: Barret is never mirrored, his gun-arm stays on his right arm, and the party follows FF7's own battle staging (which side it stands on and which way it faces).
**Research date:** 2026-09-27
**Game case (AGENTS.md rule 14):** **FF7 only.** The original *Final Fantasy VII*. Nothing here changes an FFX or FFX-2 chapter; the FFX / FFX-2 facing contract in `docs/ART-PIPELINE.md` §2a stays as it is for those games.
**Rules in force:** rule 6 (every fact sourced or marked), rule 8 (text sources only: no retail frame, model or screenshot was looked at or used for this file), rule 9 (the look still goes through Bailey's pick).
**Companion files:** `research/ff7-guard-scorpion.md` (the boss, the arena §10), `research/ff7-battle-core.md` (rows §5, formations §2.4 and §15).

---

## 0. Provenance and tags

Tags are the same as `research/ff7-battle-core.md` §0.1: `[verified: N sources]`, `[single source]`, `[derived]`, `[estimate]` ("our estimate" to Bailey), `[unsourced]`, `[conflict]`.

**The honest summary first.** No official or technical text found this session states in words which side of the screen FF7's party stands on. The evidence for "party on the right, facing left" is two informal written sources that agree, plus two indirect ones that point the same way. Nothing written contradicts it. For the Guard Scorpion fight specifically, no text source describes the framing at all; it is a Normal formation, so the standard framing applies `[derived]`.

**Sources used here, ranked:**

1. **The official North American *Final Fantasy VII* manual** (PlayStation, digital edition from PlayStation's manual archive, PDF created 2018-11-29), pp. 14 to 18, 27, 30: the battle screen, formations, facing, Change, Order, the Camera Angle option. The most authoritative source here, but it never names a screen side.
2. **Final Fantasy Wiki** (`api.php?action=parse&prop=wikitext`, built-in browser pane, 2026-09-27): "Final Fantasy VII" revid 4042587, "Final Fantasy VII battle system" revid 4039023, "Attack formations" revid 3932181, "Row" revid 4028706, "Menu (Final Fantasy VII)" revid 3873754, "Final Fantasy VII enemy formations" revid 4039444, "Guard Scorpion (Final Fantasy VII)" revid 4014097, "Barret Wallace" revid 4042820, "Cloud Strife" revid 4045701, "Final Fantasy VII statuses" revid 3996722, "Sprint Shoes (Final Fantasy VII)" revid 4042678.
3. **Wikipedia**: "Barret Wallace" (gun-arm side), "Final Fantasy (video game)" (the series convention, FF1 only).
4. **GameFAQs** message-board topic "In battles, why does your party appear on the right of the screen and not left?" (FF7 board, topic 58711198, posts 2011-04-05 to 2011-04-07). Player observation, not a guide; used only because nothing more formal states the screen side.
5. **GamesRadar+**, Connor Sheridan, "Here's what Final Fantasy 7 Remake would look like with the original game's fixed camera", 2022-01-07. A news piece describing a fan recreation of the original's framing.
6. **Jegged**, *Final Fantasy VII: Front and Back Row* (no author or date shown): the Order menu's row display.
7. **D:\FF7 (Lifestream Encore)** `docs/research/*`: searched; it has **nothing** on the original's battle staging. The only blocking in it (`scenes.md` §3, lines 292 to 293 and 412, "Barret upstage right", "wreck downstage left") is a Remake-style cutscene the earlier project invented. Not a source for this file.

Not used: Fergusson's three mechanics FAQs describe no screen layout (they were read for the companion files). StrategyWiki's "Basic combat" page sat behind a bot check, which was not bypassed. The Qhimm modding wiki documents camera and enemy coordinates in `scene.bin` but not the party's placement, so it cannot settle a screen side without running the game.

---

## 1. At a glance

| Question | Answer | Tag |
|---|---|---|
| Which side does the party stand on? | **The right**, with the enemies on the left, in the standard framing | `[verified: 2 sources, both informal — GameFAQs board; GamesRadar]`; consistent with two indirect sources (§2.2) |
| Which way does the party face on screen? | **Left**, toward the enemies | `[derived]` from the row above and "facing the opponents" (§3) |
| Which way do enemies face? | Toward the party (so rightward in that framing) | `[verified: 2 sources — manual p. 15; FF Wiki battle system and Attack formations]` for "facing each other"; the screen direction is `[derived]` |
| Is the framing fixed? | **No.** The default camera moves throughout the battle; the Config menu's Camera Angle can fix it | `[verified: 2 sources — manual p. 30; FF Wiki Menu and "Final Fantasy VII"]` |
| The Guard Scorpion fight | Formation 324, **Normal**, battleground "Reactor Core": the party and the boss face each other, so the standard framing applies | Formation type `[single source: FF Wiki enemy formations]`; the framing `[derived]`; a written description of this fight's framing `[unsourced]` |
| Rows | The front row stands nearer the enemy, the back row further back (on screen, further right in the standard framing) | Physical placement `[verified: 2 sources — manual pp. 18, 27; Jegged]`; screen direction `[derived]` |
| Cloud and Barret's starting row | Both **front** (Aeris is the only character who joins in the back row) | `[single source: FF Wiki Row]`. This settles `research/ff7-guard-scorpion.md` G10 for the rows. |
| Barret's gun-arm | **Right** arm | `[verified: 3 sources — FF Wiki Barret Wallace; FF Wiki "Final Fantasy VII"; Wikipedia Barret Wallace]` (the two FF Wiki pages count once: 2 independent) |
| Cloud's pauldron | **Left** shoulder, single pauldron | `[single source: FF Wiki Cloud Strife]` (several other fan wikis repeat the same sentence; they are copies, not sources) |

---

## 2. Screen side

### 2.1 Direct statements (both informal)

- **GameFAQs board, 2011.** The opening post of topic 58711198 observes that in FF1 through FF7 the player's party is always on the right of the screen, and asks why. A reply (post #3) adds that the position is variable and not every battle has the party on the right (which fits the moving camera, §4, and the Back / Side / Pincer formations, §3.2). A later reply says the series has placed the party on the right since the first game. `[single source each, player observation]`
- **GamesRadar+, 2022-01-07.** Describing a fan video that reframes the Remake with the original's camera, it says the video includes "classic battle scenes, complete with enemies stationed on the left side of the screen". `[single source, secondary: it describes a recreation of the original's look]`

Together: `[verified: 2 sources, both informal]`. They are independent of each other (a 2011 player board and a 2022 news article).

### 2.2 Indirect evidence that points the same way

- **The Order menu.** Changing a character's row makes the portrait slide **right** for the back row and **left** for the front row `[single source: Jegged]`. The menu stages "toward the enemy" as leftward, which matches a party on the right facing left. It is a menu convention, not the battle camera `[derived]`.
- **The series convention.** *Final Fantasy* (1987) "was the first game to show the player's characters on the right side of the screen and the enemies on the left side of the screen" `[single source: Wikipedia, "Final Fantasy (video game)"]`. This is about FF1, not FF7; it explains the convention the board posters describe, and does not count as an FF7 source.

### 2.3 What does not settle it

- The manual describes the battle screen (the triangle over the active character, the command window, the status window at the bottom, reading left to right: HP, max HP, MP, the Limit and Time gauges) but never says where the party stands `[single source: manual pp. 14 to 15]`.
- The FF Wiki pages say the party "stands in a line facing the opponents" and "facing rows of enemies" without naming a side.
- Nothing written was found that contradicts "party on the right". If Bailey wants this settled beyond informal sources, the only stronger check is watching the real game (G12 in the companion file: only with Bailey's go-ahead, and only on a copy Bailey owns).

---

## 3. Facing

### 3.1 Normal battles `[verified: 2 sources — FF Wiki battle system, "Final Fantasy VII"; manual p. 15]`

- "The typical formation in a normal battle is the player's party stands in a line facing the opponents" (FF Wiki battle system). The FF7 main page says the same: party members stand in a row "facing rows of enemies".
- Both sides normally face each other: the manual's formations page warns that "Both your characters and enemies will receive twice as much damage if attacked while their backs are facing opponents", which only makes sense if facing each other is the default.
- An enemy hit from behind turns to face the party afterwards `[single source: FF Wiki Attack formations]`.

### 3.2 The formations that change facing (not the Guard Scorpion fight)

| Formation | What changes | Tag |
|---|---|---|
| Pre-emptive | The enemy starts facing away | `[single source: FF Wiki Attack formations]` |
| Back Attack | The party starts facing away; rows are reversed ("your front defense and your rear defense will be reversed") | `[verified: 2 sources — manual p. 16; FF Wiki]` |
| Side Attack | Enemies stand between the party's members, who attack from both sides | `[verified: 2 sources — manual p. 16; FF Wiki]` |
| Attack From Both Sides (pincer) | The party is caught between two enemy groups | `[verified: 2 sources — manual p. 16; FF Wiki]` |

Sprint Shoes stop the party facing away in a Back Attack `[single source: FF Wiki Sprint Shoes]`. Manipulated enemies "turn cyan and face the opposite way, the same way the players are facing" `[single source: FF Wiki statuses]`.

### 3.3 The Guard Scorpion fight

Formation **324**: Guard Scorpion alone, battleground **Reactor Core**, type **Normal** `[single source: FF Wiki enemy formations, revid 4039444]`; the companion file reached the same "not a special formation" conclusion from Fergusson (`research/ff7-battle-core.md` §2.4, §15). So the party (Cloud and Barret, both front row, §5) faces the boss and the boss faces them `[derived]`. In the standard framing that puts **Guard Scorpion on the left, facing right, and the party on the right, facing left** `[derived]`. No walkthrough read this session (Gamer Guides, Jegged, the FF Wiki boss page) describes the fight's framing in words `[unsourced]`.

---

## 4. The camera

- **It moves by default.** "As the first three-dimensional title in the series, the default camera setting moves it throughout the battle to focus on the command being used and their effects" `[single source for "default": FF Wiki "Final Fantasy VII"]`.
- **The option.** Config, **Camera Angle**: "Auto: The camera angle/view changes constantly, making the battle exciting and realistic. Fixed: The camera angle is fixed to a specific angle when you encounter enemies. The battle continues at this fixed angle." (manual p. 30). The FF Wiki adds that Fix still moves for summon animations `[verified: 2 sources for the two settings — manual p. 30; FF Wiki Menu]`.
- **What the camera looks like** (height, how far behind or beside the party, lens) is `[unsourced]` in text. The only written characterisation is GamesRadar's general "high and wide camera angles favored in the original game", which is about the field screens, not battles.
- **Consequence for us** `[derived]`: "party on the right facing left" is the standard framing a player remembers, not a locked camera. Because the camera swings, a painted billboard that faces left in a 3/4 view is faithful; a strict 90° profile is not implied by anything.

---

## 5. Rows

- **Physical placement.** Change moves a character "from the front line to the rear" (manual p. 18); Order moves them "to the front or the rear of the ranks" (manual p. 27). Back row takes and deals half physical damage unless Long Range (`research/ff7-battle-core.md` §5.1). `[verified: 2 sources — manual; FF Wiki Row]`
- **Screen direction** `[derived]`: with the party on the right facing left, the front row stands nearer the enemy (further left), the back row further right. The Order menu's leftward slide for the front row agrees (§2.2).
- **Starting rows for this fight.** "Aeris is the only character who joins the party being in the back row by default" `[single source: FF Wiki Row]`; Jegged also says Aeris starts in the back row. So **Cloud and Barret start in the front row** `[derived from a single source]`. This replaces the `[estimate]` in `research/ff7-guard-scorpion.md` §8.5 and G10 for the rows (the Limit gauge and inventory there stay open). The wiki's strategy note still suggests moving Barret to the back row, since his gun is Long Range.
- Enemies have rows for targeting and cover, but no back-row damage rule `[single source: FF Wiki statuses and Row]`. Guard Scorpion is alone, so this does not matter here.

---

## 6. Canon sides of the two chiral details

### 6.1 Barret's gun-arm: the **right** arm `[verified: 2 independent sources]`

- FF Wiki, "Barret Wallace": "His right arm has been modified into a firearm"; "a mechanical gun grafted in place of his right arm". The FF Wiki's "Final Fantasy VII" page: "wields a gun on his right arm in place of his injured hand".
- Wikipedia, "Barret Wallace", Conception and design: "His right hand is replaced with a prosthetic gatling gun called a 'Gimmick Arm'".
- Story corroboration: Dyne has the gun on the **opposite** (left) arm; the doctor tells Barret another man had the same operation on his opposite arm `[single source: FF Wiki Barret Wallace, citing the game script]`.
- Also on the FF Wiki page: the skull tattoo is on his **left** shoulder `[single source]`. The FF Wiki notes Barret was once going to have a bowgun on his left hand (a cut early design, not the game).

### 6.2 Cloud's pauldron: the **left** shoulder `[single source: FF Wiki Cloud Strife, revid 4045701]`

- "Cloud also wears brown boots, gauntlets with a pauldron over his left shoulder, and a SOLDIER band on his right wrist." The same page: his uniform leaves out the right pauldron, "while his left pauldron remains".
- Wikipedia's Cloud article does not say which shoulder. Other fan wikis repeat the FF Wiki's sentence; they are copies. So this stays a single source, with no conflict found.

### 6.3 What the facing means for each arm `[derived: geometry, not a game fact]`

A figure facing screen-**left** (straight or turned 3/4 toward the camera) shows its **left** side to the camera. So in FF7's standard framing:

- **Cloud's left pauldron is on the near side**, toward the camera. Good for reading him.
- **Barret's right gun-arm is on the far side.** To keep it readable, paint the gun-arm raised or pointed forward (toward the left edge, at the enemy) so it clears his body, rather than hanging behind him. Never mirror a left-facing Barret to get the gun onto the near side: that puts it on his left arm, which is Dyne's.

A figure facing screen-**right** shows its **right** side to the camera. Note for the art agent: `docs/concepts/ff7-art-2026-09-27/README.md` says a right-facing Cloud has his left pauldron on "the near side" and a right-facing Barret has his right arm on "the far side". By the geometry above both are the wrong way round (facing right, the right side is near). The rule that follows is the same either way: check each render for which arm or shoulder actually carries the detail, not which side of the picture it is on.

---

## 7. For the build (FF7 only)

| Item | Recommendation | Basis |
|---|---|---|
| Party side and facing | Party on the **right**, facing **left**; Guard Scorpion on the **left**, facing **right** | §2, §3.3 |
| Art facing for FF7 | The FFX / FFX-2 contract (`ART-PIPELINE.md` §2a: party left facing right) is reversed for FF7 only: `--facing left` for Cloud and Barret, `--facing right` for Guard Scorpion | §2 `[derived]` |
| Camera | Keep our presenter's camera moves; the original's default camera moves too | §4 |
| Rows | Both front at the start; the player may Change | §5 |
| Barret | Right gun-arm, never mirrored; far side when facing left, so pose it forward | §6.1, §6.3 |
| Cloud | Left pauldron, never mirrored; near side when facing left | §6.2, §6.3 |

---

## 8. Conflicts and open questions

| # | Item | Status |
|---|---|---|
| S1 | Party side of the screen | Two informal written sources agree (right side); no official text states it; nothing contradicts it. **Use "party right, facing left".** Upgrade only by a real-game check with Bailey's go-ahead. |
| S2 | Guard Scorpion framing in words | `[unsourced]`; derived from the Normal formation. |
| S3 | The default camera's exact angle, height and distance | `[unsourced]` in text. |
| S4 | Is Auto the factory default for Camera Angle? | The FF Wiki's "default camera setting moves" implies yes; the manual lists both settings without naming a default. `[single source]` |
| S5 | Cloud's pauldron side | Single source, no conflict. |
| S6 | Near / far side notes in the art README | Reversed for a right-facing figure (§6.3). For the art agent to correct; not changed here. |

---

## Sources

**Official**

- *Final Fantasy VII* instruction manual, North America, PlayStation (digital edition, PDF created 2018-11-29), pp. 14 to 18, 27, 30: https://secure.cdn.us.playstation.com/manuals/classic/games/final-fantasy-vii-manual-en.pdf

**Final Fantasy Wiki** (`api.php?action=parse&prop=wikitext`, built-in browser pane, 2026-09-27; tab closed afterwards)

- Final Fantasy VII, revid 4042587: https://finalfantasy.fandom.com/wiki/Final_Fantasy_VII
- Final Fantasy VII battle system, revid 4039023: https://finalfantasy.fandom.com/wiki/Final_Fantasy_VII_battle_system
- Attack formations, revid 3932181: https://finalfantasy.fandom.com/wiki/Attack_formations
- Row, revid 4028706: https://finalfantasy.fandom.com/wiki/Row
- Menu (Final Fantasy VII), revid 3873754: https://finalfantasy.fandom.com/wiki/Menu_(Final_Fantasy_VII)
- Final Fantasy VII enemy formations, revid 4039444 (formation 324): https://finalfantasy.fandom.com/wiki/Final_Fantasy_VII_enemy_formations
- Guard Scorpion (Final Fantasy VII), revid 4014097: https://finalfantasy.fandom.com/wiki/Guard_Scorpion_(Final_Fantasy_VII)
- Final Fantasy VII statuses, revid 3996722: https://finalfantasy.fandom.com/wiki/Final_Fantasy_VII_statuses
- Sprint Shoes (Final Fantasy VII), revid 4042678: https://finalfantasy.fandom.com/wiki/Sprint_Shoes_(Final_Fantasy_VII)
- Barret Wallace, revid 4042820: https://finalfantasy.fandom.com/wiki/Barret_Wallace
- Cloud Strife, revid 4045701: https://finalfantasy.fandom.com/wiki/Cloud_Strife

**Other**

- Wikipedia, "Barret Wallace" (WebFetch, 2026-09-27): https://en.wikipedia.org/wiki/Barret_Wallace
- Wikipedia, "Final Fantasy (video game)" (WebFetch, 2026-09-27): https://en.wikipedia.org/wiki/Final_Fantasy_(video_game)
- GameFAQs, FF7 board, "In battles, why does your party appear on the right of the screen and not left?", topic 58711198, 2011-04-05 to 2011-04-07 (built-in browser pane): https://gamefaqs.gamespot.com/boards/197341-final-fantasy-vii/58711198
- Connor Sheridan, "Here's what Final Fantasy 7 Remake would look like with the original game's fixed camera", GamesRadar+, 2022-01-07 (built-in browser pane): https://www.gamesradar.com/heres-what-final-fantasy-7-remake-would-look-like-with-the-original-games-fixed-camera/
- Jegged, *Final Fantasy VII: Front and Back Row* (WebFetch): https://jegged.com/Games/Final-Fantasy-VII/Tips-and-Tricks/Front-and-Back-Row.html
- Gamer Guides, Nathan Garvin, "Boss Battle: Guard Scorpion" (updated 2021-03-08; read, describes no framing): https://www.gamerguides.com/final-fantasy-vii/guide/walkthrough-disc-1/midgar/no-1-reactor/boss-battle-guard-scorpion
- Earlier local research, searched, nothing usable: `D:\FF7\docs\research\*.md`.
- Not retrievable: StrategyWiki "Final Fantasy VII/Basic combat" (bot check, not bypassed); RPGamer screenshot archive (images only, not viewed as references).
