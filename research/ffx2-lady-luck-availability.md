# FFX-2: when the girls can have Lady Luck, and where our builds put her (2026-10-03)

**Game case: FFX-2 only.** Lady Luck is an X-2 dressphere and the Garment Grids are X-2 data; nothing here touches FFX.
**Why this note exists:** Bailey adopted D-361 ("I'll go with all your recommendations", 2026-10-03): make Lady Luck
selectable, but only where the FFX-2 guides say the girls could have her at that point in the story, with the chapters
read from the sources and not from memory (hard rule 6). Release 37 shipped her reels and the Dud (`ffx2-combat-core.md`
§3.12) but no shipped Garment Grid offered her (critic round 20, PR-0340). **What was built** is in
`docs/handoff/r38-lady-luck-grid.md`; this note is the sourcing and the chapter map. Labels follow AGENTS.md rule 6.

## 0. The answer

| Our chapter | Story point it recreates | Could the girls own Lady Luck there? |
|---|---|---|
| IV `ffx2-bahamut` | FFX-2 Chapter 2, Bevelle Underground (Limbo) | **No.** Her earliest pickup is Chapter 3. |
| V `ffx2-vegnagun-shuyin` | Chapter 5, the Farplane finale | **Yes** (Chapter 3 or the Chapter 5 rematch). |
| VI `ffx2-leblanc` | Chapter 2 mission "Faking and Entering" | **No.** |
| XI `ffx2-fallen-aeons` | Chapter 5, the Road to the Farplane (Shiva, the Magus Sisters, Anima) | **Yes.** |
| XIII `ffx2-trema` | Chapter 5, the Via Infinito (an optional dungeon that opens in Chapter 5) | **Yes.** |
| XV `ffx2-den-of-woe` | Chapter 5, optional | **Yes.** |
| XVI `ffx2-ixion-djose` | the end of Chapter 3, Djose Temple | **Yes, if Shinra was beaten** in the Luca tournament, which is a Chapter 3 event. |

## 1. The facts, and what backs each

1. **How she is obtained.** In Chapter 3 the Luca Sphere Break tournament is run: win three matches, then beat Shinra,
   the champion, and the prize is the Lady Luck dressphere. `[verified: 4 sources]`: Jegged (Lady Luck page, "How to
   Obtain It"); GamerGuides (Lady Luck page, "General Info", and its Chapter 3 Luca walkthrough page); StrategyWiki
   (Dresspheres page, the "How to obtain" table); FFExodus (Lady Luck page, "Location"). Our own older notes say the
   same and cite the FF Wiki's Dressphere page (`ffx2-bahamut.md` §4.3, `ffx2-ixion-djose.md` §5, both `[verified: 2
   sources]`); that page could not be re-read today (§5).
2. **A second chance.** Missed in Chapter 3, Shinra can be found again in the basement of Luca Stadium in Chapter 5, and
   the rematch is harder. `[verified: 2 sources]`: Jegged (same section) and our two notes above (Chapter 3 "or Chapter
   5"). A web search also returned GameFAQs listings that agree on the two chapters; they could not be read, and the
   match quotas their summaries gave disagree with each other, so no number from them is used.
3. **It is a prize for a minigame, so it can be missed.** Nothing earlier than the Chapter 3 tournament can give it,
   and nothing forces a player to win it. A chapter "could have" her when its story point is at or after the Luca
   tournament; none of the sources says she is ever owned by default.
4. **Who can wear her: all three girls.** `[verified: 3 sources]`: GamerGuides lists Yuna, Rikku and Paine under "For
   Whom?"; Jegged says her stats are the same for the three and tells the player to rotate all three through her for
   Double EXP; Jegged's Dresspheres overview says the three share one set of dresspheres, with only the three Special
   Dresspheres (Floral Fallal, Machina Maw, Full Throttle) tied to one girl.
5. **Copies.** One reward, one shared set: no source read says a second or third Lady Luck must be earned or exists.
   More than one girl can wear her at once: GamerGuides' notes on Gillionaire and Double Items say the bonus stacks to
   x2, x4 and x8 for one, two and three users, and `ffx2-combat-core.md` §3.12 says the same (`[verified: 2 sources]`).
   `ffx2-combat-core.md` §4.1 carries an older single-source line, "the same dressphere may sit on several Grids at
   once, provided you own a copy", which this does not settle; the shipped Chapter V build already seats two Dark
   Knights at once (`research/ffx2-vegnagun-shuyin.md` §6.4), and our Chapter XVI research cites a guide whose third
   Dark Knight is the White Mage changing over (`ffx2-ixion-djose.md` §4.5).
6. **How a grid carries her.** A dressphere is not worn directly: it is set on a node of the Garment Grid a girl has
   equipped, and in battle she can change only to a dressphere on that grid, one link away.
   `[verified: 3 sources]`: StrategyWiki (Dresspheres intro); Jegged (Dresspheres overview); `ffx2-combat-core.md` §4.1
   and §4.2 (`[verified: 2 sources]`). **Which** dresspheres a player sets on a grid is the player's choice, and no
   source fixes it for any story point; that is why where she sits on our grids is an `[estimate]` (§3).

## 2. Reading each of our chapters

- **IV and VI are Chapter 2.** `ffx2-bahamut.md` C1 and §4.3 put Bahamut at the end of Chapter 2 and list Samurai,
  Lady Luck, Berserker and Trainer as Chapter 3 pickups the girls cannot own there; `ffx2-leblanc-syndicate.md` §7.2
  lists the same four as Chapter 3 and not owned at the Chateau; the build headers (`bevelle.ts`, `chateau.ts`) say
  Chapter 2. So nothing is added to them.
- **V, XI, XIII and XV are Chapter 5.** The Chapter 5 build already lists Lady Luck among the dresspheres "realistically
  reachable by Ch.5" (`farplane.ts`, citing `ffx2-vegnagun-shuyin.md` §6.4). `ffx2-fallen-aeons.md` §2 puts the Road to
  the Farplane in Chapter 5 and §5 gives the party "every dressphere ... available by Chapter 5"; `ffx2-trema.md` §1.1
  says the Via Infinito opens in Chapter 5 and the party is level 99; `ffx2-gippal-den-of-woe.md` §2 says the Den of
  Woe is Chapter 5, optional. Each of those notes carries its own sources.
- **XVI is the end of Chapter 3.** `djose.ts` and `ffx2-ixion-djose.md` §5 put Ixion at Djose Temple at the end of
  Chapter 3, and §5's table lists Lady Luck as "if won". StrategyWiki's Chapter 3 list (the contents list on the
  Dresspheres page) puts Luca second and Djose Temple last, so the tournament is available before the fight. **This
  is the one judgement call:** Chapter 3's earlier builds left her out because she is conditional. D-361 says "could
  have", and the guides do say she could be owned here, so she is added; the condition is "the party that beat Shinra"
  (the same condition as in Chapter 5). If that reading is not wanted, the commit that adds her to `djose.ts` (it is
  its own commit, with the one test line and the one row of `ffx2-lady-luck-grid.test.ts`) can be reverted alone.

## 3. What the builds do (ours, `[estimate]` unless a line above backs it)

The order of a girl's `owned` list is her node layout (`setup.ts#gridNodeContents`: the worn dressphere on node 0, then
the list), and the grid is a ring (`garment-grids.ts`, itself an estimate), so a girl's worn dressphere has two
neighbours: node 1 and the last node. **Node 1, the first Change row, is left as it was** in every chapter the
autopilot reads (V, XI, XIII, XV): its answer to Itchy takes the first row, so this keeps every shipped line playing
exactly as before (digests and win counts identical, handoff). Lady Luck takes the node of a dressphere the guide pages
for that chapter do not ask for, and the dressphere that sat there is off that grid (still owned). The first build
(`r38-lady-luck-grid`) put her on the last node everywhere it could; **r381-lady-luck** (Bailey's recommendation after
the independent check) moved two placements so a girl keeps the dressphere a guide page names:

- **V, XI, XV (one shared grid).** Paine keeps her White Mage on the last node and gives up Black Mage instead: the V
  page (Jegged, "Heart of the Farplane", Core and Bulwarks, `research/jegged-encounter-guides-ffx2.md` section 3) says
  that if Memento Mori is coming, swap a White Mage in for Shell just before it, and Paine's is the one grid where a Dark
  Knight has a White Mage a Change away (Yuna is the White Mage and Rikku's ring never held one). Lady Luck takes Black
  Mage's node 4 on her six-node ring, so Paine reaches her by two Changes (Dark Knight, White Mage, Lady Luck); Yuna and
  Rikku are unchanged from the first build (Lady Luck on the last node of their five-node rings, one Change).
- **XVI (Ixion at Djose).** Yuna and Rikku give up Gunner, not Black Mage, so Lady Luck takes node 1, the first Change
  row: the XVI page says Water hurts him, and Watera and Waterga are the Black Mage's (`ffx2-ixion-djose.md` section 4).
  Chapter XVI has no Itchy and no autopilot Change (zero spherechange events in 200 seeds), so node 1 is read by nothing.
  Paine stays as built (node 1 of her four-node Stonehewn, Gunner off; the Warrior stays on her last node).
- **XIII.** As built (Lady Luck on node 4 of the five-node Valiant Lustre ring; node 1 untouched).

Layouts (worn dressphere on node 0):

| Chapters | Yuna | Rikku | Paine |
|---|---|---|---|
| V, XI, XV (`farplane.ts`) | White Mage, Gunner, Thief, Warrior, **Lady Luck** (Black Mage off) | Dark Knight, Gunner, Thief, Warrior, **Lady Luck** (Black Mage off) | Dark Knight, Gunner, Thief, Warrior, **Lady Luck**, White Mage (Black Mage off; **was** Black Mage, Lady Luck with White Mage off) |
| XIII, shipped kit (`via-infinito.ts`) | Dark Knight, White Mage, Gunner, Thief, **Lady Luck** (Warrior off) | Alchemist, Gunner, Thief, Warrior, **Lady Luck** (Songstress off) | Dark Knight, Warrior, Gunner, Thief, **Lady Luck** (Songstress off) |
| XVI (`djose.ts`) | White Mage, **Lady Luck**, Thief, Warrior, Black Mage (Gunner off; **was** Lady Luck on node 4 with Black Mage off) | Dark Knight, **Lady Luck**, Thief, Warrior, Black Mage (Gunner off; **was** Black Mage off) | Dark Knight, **Lady Luck**, Thief, Warrior (Gunner off; unchanged) |

## 4. Not sourced, left alone

- **AP in Lady Luck.** No source gives how much a Chapter 3 or Chapter 5 party has put into her. With no learned list
  the dressphere's whole ability list is offered, as for every dressphere a build lists without one (Samurai, Black Mage
  on most girls). Inventing a learned list would be an invented number (rule 6).
- **Her paintings.** `public/art/characters/` has no Lady Luck painting for any girl, so a girl who changes into her
  shows the procedural placeholder figure until art is made (an art decision for Bailey, not made here).
- **Chapter 5's harder rematch numbers** (see 1.2) are not used.

## 5. Sources (all read 2026-10-03)

Read in full by a headless browser (HTTP 200): Jegged, "Final Fantasy X-2 Dresspheres: Lady Luck",
https://jegged.com/Games/Final-Fantasy-X-2/Dresspheres/Lady-Luck.html (sections "How to Obtain It", "Overview", "Stats");
Jegged, "Final Fantasy X-2 Dresspheres", https://jegged.com/Games/Final-Fantasy-X-2/Dresspheres/ (opening paragraph);
GamerGuides (Damir Kolar), "Lady Luck - Dresspheres - Extras | Final Fantasy X-2 HD Remaster",
https://www.gamerguides.com/final-fantasy-x-2/guide/extras/dresspheres/lady-luck ("General Info", the Gillionaire and
Double Items notes); StrategyWiki, "Final Fantasy X-2/Dresspheres", https://strategywiki.org/wiki/Final_Fantasy_X-2/Dresspheres
(revision 905850, last edited 24 June 2021; the intro and the "How to obtain" table); FFExodus, "Final Fantasy X-2 -
Lady Luck Dressphere", https://finalfantasy.ffexodus.com/ffx2/dress9.php ("Location").

Read through a summarising fetch (the wording is the tool's reading of the page): GamerGuides, "Luca - Chapter 3 -
Walkthrough", https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-3/luca (the champion gives the
dressphere).

**Could not be read, and not worked around:** GameFAQs (the Q&A "How do I get lady luck dressphere?", answers/624181,
and the HD Remaster walkthrough page "Luca Ch 3", faqs/81757) answer a plain fetch with 403 and a headless browser with
a "Just a moment" check; the FF Wiki (finalfantasy.fandom.com, "Lady Luck (Final Fantasy X-2)" and "Dressphere") answers
402 and the same check; Neoseeker and Prima Games gave the check too. Bailey prefers GameFAQs where sources conflict
(`feedback-gamefaqs-preferred-source`); the four sources read agree with each other and with the wiki-backed older
notes, so nothing here needed that tie-break. A web search's own summary of the GameFAQs listings agrees (Chapter 3
or Chapter 5, by beating Shinra); it is a pointer, not a source.

Our own notes read for the story points: `research/ffx2-bahamut.md` C1 and §4.3; `ffx2-leblanc-syndicate.md` §7.2;
`ffx2-ixion-djose.md` §4.5 and §5; `ffx2-fallen-aeons.md` §2 and §5; `ffx2-trema.md` §1.1; `ffx2-gippal-den-of-woe.md`
§2; `ffx2-vegnagun-shuyin.md` §6.4; `ffx2-combat-core.md` §3.12, §4.1 and §4.2; the headers of `src/data/ffx2/builds/*.ts`.
