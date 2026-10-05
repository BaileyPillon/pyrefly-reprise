# Jegged's FFX-2 encounter guides, read against our seven FFX-2 chapters

**Why this file exists.** Bailey, 2026-10-03 ~13:50 EDT: "from now on the guide follows the ffx/ffx-2 encounter guides from jegged". The in-game strategy guide (NEXT / WATCH / RULES, `src/data/guides/*.ts`, with the NEXT line from each chapter's `intendedStrategy`) is to follow Jegged.com's encounter advice for each boss. This file is the FFX-2 half of that research. The FFX half is separate (`research/jegged-encounter-guides-ffx-a.md` and `-b.md`, other agents).
**Read:** 2026-10-03, every page below, as it stood that day. Jegged's pages carry no revision date.
**Game case (AGENTS.md rule 14):** **FFX-2 only.** Every chapter below is an FFX-2 chapter (4, 5, 6, XI, XIII, XV, XVI), so only Jegged's *Final Fantasy X-2* walkthrough and side-quest pages were used. Nothing here applies to an FFX chapter, and no FFX-2 number is copied across.
**Status:** research only. No guide, tactic or data file was changed. Where a Jegged point would change what the player is told, it is listed under "Proposed guide edits" in each chapter and, per rule 10, built only on a yes.

## 0. Method, and what this file will not do

- **Copyright.** Everything below is paraphrase in our words. The only quoted words are a handful, marked, with attribution to Jegged.com. Jegged's tables are read for facts (HP, move names, trigger numbers), which are game data, and are re-cited, not reproduced.
- **How the pages were read.** WebFetch was tried first on every page and works, but its summariser is a small model and it **got details wrong** on three pages (it invented a Mega-Potion tip and an accessory purpose for Bahamut; it called the Den of Woe's Baralai a Chapter 2 fight; it merged Paragon's two forms). So the facts below were checked against the page text itself, read once into scratch (`D:/Tools/pyrefly-scratch/2026-10-03/jegged/ffx2/`, outside the repo; nothing kept in the project, no browser, no CAPTCHA or bot wall appeared). Anything a WebFetch summary said that the page text did not support is dropped.
- **Jegged is a walkthrough, not a data dump, for the boss advice.** Our numbers come from `research/ffx2-*.md` with their source lines (rule 6). Jegged is used here for the *advice* (preparation, order, what to watch) and as one more source on a number. Where Jegged and our research disagree on a number, nothing is "fixed": it is listed as a `J-n` item in section 9 and left for Bailey (rule 6, and "never tune a boss").
- **Labels.** "As written" = our chapter has what Jegged assumes, so the point holds unchanged. "Our adaptation of Jegged" = the point holds in spirit but our party, bag or engine differs, and the change is stated. "Does not apply" = Jegged assumes something our chapter lacks, with the reason.
- **Jegged has no per-boss page for most of these fights.** The advice sits inside the walkthrough page for the place (Bahamut inside Bevelle, the Vegnagun chain inside the last Farplane page) and the Via Infinito side-quest page. URLs are given in full per chapter.

## 1. The seven FFX-2 chapters and Jegged's coverage

`src/data/encounters.ts` `CHAPTERS` (plus `chapter-ffx2-*.ts`), game `ffx2`:

| # | Chapter id | Boss(es) | Jegged section | Coverage |
|---|---|---|---|---|
| 4 | `ffx2-bahamut` | Bahamut (Bevelle Underground) | Walkthrough, Chapter 2, "28) Bevelle", heading **Bahamut** | Full: pattern, HP, steal, drop |
| 5 | `ffx2-vegnagun-shuyin` | Vegnagun Tail, Leg + Nodes, Core + Bulwarks, Head + Redoubts, Shuyin | Walkthrough, Chapter 5, "63) Heart of the Farplane", five headings | Full, the richest page |
| 6 | `ffx2-leblanc` | Leblanc, Logos, Ormi (Chateau Leblanc, three acts) | Walkthrough, Chapter 2, "27) Guadosalam - Chateau Leblanc", **Hidden Passageway** | **Almost none**: three fights called easy, no numbers |
| XI | `ffx2-fallen-aeons` | Shiva, Magus Sisters, Anima | Walkthrough, Chapter 5, "61) Road to the Farplane and Farplane Abyss", **Aeon Boss Battles** | Full |
| XIII | `ffx2-trema` | Paragon (Oversoul), Trema | Side Quests, Via Infinito, **Boss Battles** page | Full |
| XV | `ffx2-den-of-woe` | Shades of Baralai, Gippal, Nooj (Jegged also covers Rikku and Paine, which our chapter omits) | Walkthrough, Chapter 5, "60) Mushroom Rock Road", **Den of Woe** | Full |
| XVI | `ffx2-ixion-djose` | Ixion (Djose Temple) | Walkthrough, Chapter 3, "40) Djose Temple Revisited", heading **Ixion** | Full, short |

Our chapter numbering is not the game's: Bahamut is the end of the game's Chapter 2, the Syndicate mission is also Chapter 2, Ixion is the end of Chapter 3, and the rest are Chapter 5 or post-game (research files and `docs/handoff/` already say so).

## 2. Chapter 4, Bahamut (FFX-2 only)

**Source.** https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-2/28-Bevelle.html , page "Chapter 2 - Bevelle", section "Labyrinth", boss heading **Bahamut**, directly after the **Baralai** fight. Read 2026-10-03.

**Jegged's plan, in our words.**
- *Preparation.* On the way here the Labyrinth's lift puzzle gives the Dark Knight dressphere; Jegged calls it one of the strongest and says to put a girl in it at once. Save at the Save Sphere before the last platforms, start a Thief so a Steal can take a **Mute Shock** off Bahamut, and optionally put the **Ribbon** from the Bevelle puzzle on a girl (that tip is written for the Baralai fight just before, not for Bahamut). If it goes badly, grind a little beside the Save Sphere to raise the Dark Knights.
- *Pattern.* A fixed loop: a Curse or a plain physical hit first (Curse locks a girl into her current dressphere), two more physical hits, **Impulse** twice, a **Countdown**, then **Mega Flare**, and round again. Impulse takes 37.5% of a girl's HP and, being a percentage like Demi, cannot kill. The warning sign is the first Impulse: Mega Flare is coming, so be fully healed before it.
- *Strategy.* Jegged says the pattern is simple enough that there is "not much more" to say; keep the party healed and level the Dark Knights if short on power.
- *Numbers.* HP 8,400. Steal Mute Shock. Drop Gris-Gris Bag. Clearing it ends the game's Chapter 2.

**Our chapter.** Yuna White Mage Lv 23, Rikku Dark Knight Lv 24, Paine Warrior Lv 25 (`src/data/ffx2/builds/bevelle.ts`; all three girls own Thief). Bag: 60 Potion, 20 Hi-Potion, 20 Phoenix Down, 10 Ether, 8 Remedy, 5 Holy Water, 4 Lunar Curtain, 3 Light Curtain; no Mega-Potion. `intendedStrategy` (`src/engine/tactics/ffx2-bahamut.ts`): Shell first, Magic Break x5 then Mental Break x5 then Armor Break, Darkness for damage, heal into the countdown. The shipped guide's rules are Darkness, Magic Break, Shell first, "physicals are the wrong route", and the countdown as free turns.

**Fit.**
- *As written:* the loop and its order (Jegged's seven entries are our 12-action loop with the five dead countdown turns folded into "Countdown": `research/ffx2-bahamut.md` §2.1); Impulse at 37.5% and unkillable; heal before Mega Flare; Dark Knight as the damage dressphere (it is Rikku's, and Darkness ignores Bahamut's Defense 160, our §3.2); HP 8,400 and the Mute Shock steal and Gris-Gris Bag drop (both modelled in `src/data/ffx2/enemies/bahamut.ts`).
- *Our adaptation of Jegged:* the Steal. Jegged expects a Thief; our line never swaps to Thief, because the chapter is one standalone fight and the Break ladder plus Shell is worth more of the opening turns. Honest reading: a Thief spherechange for one Steal (about a 50% roll, our §1.6) is optional and costs a turn that the five countdown turns can pay for. Our line also adds what Jegged does not say: Shell, Magic Break x5 and the Mega Flare survival arithmetic (research §2.4, §3.3, SinirothX's damage pipeline). Jegged's "heal fully before Mega Flare" is the weaker, correct version of the same point, so the two agree.
- *Does not apply:* the Ribbon and Mute Shock as protection (`src/battle/ffx2/accessories.ts` models stats only, no status-proof accessories; and Jegged's Ribbon tip is about Baralai anyway); Jegged's grinding advice (a standalone fight has no grind); the Mega-Potion that a WebFetch summary credited to Jegged (the page text has none; our Chapter 2 bag has none either).
- *Not covered by Jegged:* Shell, any Break, Magic Defense 10 versus Defense 160, the countdown length. All stay on our research.

**Proposed guide edits (not made).** None needed for correctness. One wording candidate for `ffx2-bahamut.ts` `watch`/`phases`: name the first Impulse as the tell that Countdown and then Mega Flare follow, since Jegged leads with exactly that tell. Our `phases` note already says the loop; the tell is a free addition.

## 3. Chapter 5, Vegnagun and Shuyin (FFX-2 only)

**Source.** https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-5/63-Heart-of-the-Farplane.html , page "Chapter 5 - Heart of the Farplane", under the heading **Vegnagun**: **Vegnagun (Tail)**, **Vegnagun (Leg) and Node A/B/C**, **Vegnagun (Core) and Left/Right Bulwarks**, **Vegnagun (Head) and Right/Left Redoubts**, then **Shuyin**. Read 2026-10-03. (A Jegged video guide of the same fights exists at https://jegged.com/Games/Final-Fantasy-X-2/Videos/Heart-of-the-Farplane.html ; not watched, only the page text was used.)

**Jegged's plan, in our words, per link.**
- *Tail.* No preparation; treat it as a gear and level check. It does nothing on its first turn, then opens with **Noli Me Tangere** (1,250 to everyone) and uses it once more under 25% HP; its **Tail Beam** takes 31.25% of the target's max HP. Two tools: more max HP (Dark Knight dressphere) so the healer has room, and **Protect**, which Jegged says does not soften Tail Beam but halves Noli Me Tangere from 1,250 to 625. Dark Knights hit hard with plain attacks and Darkness. HP 34,200; steal X-Potion (4 or 6), drop Megalixir.
- *Leg and Nodes.* Four targets, but the Leg is the only one that matters. Take Ribbons against Berserk and an elemental-guard accessory before the climb. Leg moves: Vita Brevis (party damage plus a big delay), Break (petrify), Berserk, Slow, Absorb (HP and MP). Nodes cycle red (Missile, Dies Irae), green (heal and buff the Leg) and yellow (Firaga-class spells and Flare); they cannot be turned off, so ignore them. Protect and Shell the party, and use a **Dispel Tonic** on the Leg to strip what the green Nodes put on it. Jegged calls it an attrition test of whether the party out-damages the Leg before the incoming damage wins. Leg 18,220 HP; Nodes 300,000 each.
- *Core and Bulwarks.* Protect against petrify and poison. The Bulwarks answer an attack on the Core by its type: physical costs a girl 31.25% of her max HP, magical drains 18.75% of her max MP, special does 18.75% of max HP and drains 18.75% of max MP. Core moves: **Charge Core** three times, then **Memento Mori** (heavy magic on all); **Full Life** when a Bulwark is down. Kill both Bulwarks first (3,000 HP each; Darkness hits both) and keep them down. Do not bother with Protect or Shell up front because the Left Bulwark's Dispel removes them; use a Warrior's Armor Break on the Core; if Memento Mori is coming, swap a White Mage in for Shell just before it. Core 33,040 HP.
- *Head and Redoubts.* Cover Darkness, petrify, Slow, Silence and poison. A hidden timer ends the fight after Shuyin has spoken seven times, rarely a factor. The Head cannot be targeted until both Redoubts have fallen once; then it revives them (Acta Est Fabula) and becomes targetable for good. From then on, all-target Darkness is the tool, and keeping a Redoubt down keeps the Head busy reviving instead of attacking. Nemo Ante Mortem Beatus fires at 80%, 60%, 40% and 20% of its HP: keep everyone above about 1,500 first, with a White Mage or Alchemist permanently healing. Head 38,420 HP; Redoubts 2,500 each; Pallida Mors about 1,200 (only while the Head is untargetable), Mors Certa 250 with status, Odi Et Amo sixteen hits for about 1,000 in all that also strips buffs.
- *Shuyin.* A spectacle, not a puzzle: five moves (plain attack, Spinning Cut, Run and Slash, Terror of Zanarkand, Force Rain), mostly a damage race with no special preparation. 23,850 HP; steal Hero Drink.
- Jegged adds the post-fight reminder about pressing a button during the flower walk for the better endings; that is a story-flag note for the real game and is not part of our battle guide.

**Our chapter.** Five links with no menu between (one HP, MP and bag across all five). Yuna White Mage Lv 46 with a partial Gun Mage (Mighty Guard, White Wind), Rikku and Paine Dark Knights Lv 48 and 50 (`src/data/ffx2/builds/farplane.ts`). Bag carries 40 Potion to 4 Megalixir, 6 Turbo Ether, 25 Phoenix Down, 5 Mega Phoenix, 15 Remedy, 12 each of Light and Lunar Curtain, 10 Chocobo Feather; **no Dispel Tonic**. `intendedStrategy` (`ffx2-vegnagun-shuyin.ts`): two Dark Knights open on Black Sky while MP lasts then Darkness, single-target on the Leg, Mighty Guard and re-buff after Odi Et Amo, a dedicated healer for Terror of Zanarkand (580 of 600 measured chains won). The guide already says two Dark Knights and one healer, ignore the Nodes, kill both Bulwarks, Charge Core as the watch.

**Fit.**
- *As written:* the chain order; all HP figures; the Tail's first-turn pause and its two Noli Me Tangere uses; Tail Beam 31.25% of max HP; the Nodes' colour cycle and "ignore them"; the Bulwark retaliation table (it is the same 5/16 HP, 3/16 MP, 3/16 of both rule our research §3.3 has); Core's three Charge Cores, Full Life when a Bulwark is down, kill-the-Bulwarks-first; the Head's two phases, Acta Est Fabula, Nemo at 80/60/40/20%, Odi Et Amo's buff strip, the seven-line timer; Shuyin as a race. Darkness on both Dark Knights is Jegged's own recommendation, so the core of our line is Jegged's.
- *Our adaptation of Jegged:*
  - **Core, timing of Shell.** Jegged says do not buff up front (the Left Bulwark Dispels it; our research §3.3 agrees the Left Bulwark's Dispel strips Shell and Protect), and Shell only when Memento Mori is about to land. Our guide's blanket "Shell on all three" hint should, on the Body link, read as "Shell on the third Charge Core, not before, and keep the Bulwarks down so it survives". Our Mighty Guard opener (party Shell and Protect in one action) is the same idea at cost of one action, and the Core's own Charge Core counter tells the player when.
  - **Core, Armor Break.** Jegged suggests a Warrior's Armor Break on the Core. Our party has no Warrior in this chain (all three are Dark Knight or White Mage); Armor Break is reachable only through a spherechange and is not measured. Label: optional, unmeasured.
  - **Leg, Dispel Tonic.** Our bag has none. The item exists in the engine (`src/data/ffx2/items/status.ts`), so adding it is a one-line bag change, but that changes the chain's kit and needs Bailey's yes (rule 10). Until then, our White Mage's own Dispel (learned in the Chapter 5 preset) is the stand-in.
  - **Head, "keep above 1,500".** Jegged's 700 to 1,500 for Nemo is an observed spread from a party that was buffed; our computed 1,490 to 1,685 party-wide (research §3.4, from the damage pipeline) is for an unbuffed hit. The guide should keep our number and Jegged's logic (bank healing before each 20% line).
- *Does not apply:* Ribbons against Berserk and Slow, the Tetra elemental guards, status protection for the Core and Head (the engine models no status-proof accessories; a Remedy is the answer our bag gives); Jegged's "Dark Knights before the Tail" as a deliberate switch (the chain starts in Dark Knight already).
- *Disagrees with our guide, needs a decision:* see J-1 below (Protect against Noli Me Tangere).

**Proposed guide edits (not made).** (1) Body link `phases` note: replace "do not hit a Bulwark twice with the same damage class" as the headline with Jegged's order (Bulwarks down first, stay down; Shell only as the third Charge Core lands). (2) Head link note: add that the Head cannot be hit before both Redoubts fall once, and that a Redoubt left dead keeps the Head reviving, which Jegged states plainly and our research §4.2 already carries. (3) Leg link: mention Dispel (our own) against the green Nodes' buffs. All sourced; none changes data.

## 4. Chapter 6, the Leblanc Syndicate (FFX-2 only)

**Source.** https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-2/27-Guadosalam-Chateau-Leblanc.html , page "Chapter 2 - Guadosalam - Chateau Leblanc", section **Hidden Passageway** (no named boss headings; three plain fights). For the earlier all-three fight at the Floating Ruins (not our chapter): https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-1/02-Mt-Gagazet-Floating-Ruins.html , heading **Leblanc, Logos, Ormi**. Read 2026-10-03.

**Jegged's plan, in our words.**
- Chateau Leblanc: after the disguise and the massage scenes, the hidden passage holds three fights: Ormi with Syndicate grunts at the entrance, Logos and Ormi in Logos's room, then Leblanc, Ormi and Logos in the last room. Jegged calls each "extremely easy", says the Syndicate "forgot to level up" (a joke about the girls out-levelling them), and says the last fight needs no complex strategy. No levels, no HP, no moves, no order.
- The only concrete gameplay facts: Logos drops a **Charm Bangle** (No Encounters) at the end; the mission pays the Reassembled Sphere key item and the **Healing Light** Garment Grid; Crimson Sphere 10 sits in the middle room.
- Floating Ruins (context only): Leblanc 120, Logos 100, Ormi 130 HP, stealing Tiara, White Cape and Gauntlets, with Hi-Potion, Phoenix Down and Potion as drops, and advice to switch the Thief to Gunner or Warrior for damage.

**Our chapter.** Gunner, Thief, Warrior girls at Lv 20, 21, 22 (`src/data/ffx2/builds/chateau.ts`), three acts (entrance with Ormi and goons, Logos's room, the last room with all three). `intendedStrategy`: Logos, then Ormi, then Leblanc; Armor Break on Ormi; Dispel for Not-So-Mighty Guard; bank a heal before Concussive Blast; magic through Ormi's Defense. Guide rules cite `research/ffx2-leblanc-syndicate.md` (SinirothX data, GamerGuides, Split_Infinity).

**Fit.**
- *As written:* only the three-fight shape and the Charm Bangle drop (modelled: `src/data/ffx2/enemies/leblanc-syndicate.ts` has a `charm-bangle` drop) and the Healing Light reward.
- *Our adaptation of Jegged:* none possible. Jegged gives nothing to follow for the fight itself.
- *Does not apply:* "very easy": true for the girls at the game's actual levels with the game's actual EXP, but our Chateau preset is Lv 20 to 22 against Ormi Lv 19 and up, with the Russian Roulette and No Love Lost gags that Jegged never mentions. Jegged's "no strategy needed" is a statement about the real game's level cushion, not about our encounter. The guide keeps our research (this is the one chapter where the rule "follow Jegged" yields no change), and should not water down its kill order or its Dispel rule on the strength of Jegged's tone.

**Proposed guide edits.** None. Note for Bailey: this chapter's guide stays on our own sourced research because Jegged has no content for it.

## 5. Chapter XI, Fallen Aeons: Shiva, the Magus Sisters, Anima (FFX-2 only)

**Source.** https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-5/61-Road-to-the-Farplane-and-Farplane-Abyss.html , page "Chapter 5 - Road to the Farplane and Farplane Abyss", section **Aeon Boss Battles**, headings **Shiva**, **The Magus Sisters**, **Anima**. Read 2026-10-03.

**Jegged's plan, in our words.**
- *Before all three.* The three fight in a row on the same platforms whichever of the five routes is taken, only once. Use a Ribbon against Stop (Shiva's Heavenly Strike and Anima's side effects).
- *Shiva* (easiest of the three; 14,800 HP). Plain hit about 400, a triple hit on three random girls for about 400 each, **Heavenly Strike** (halves one girl's current HP and MP, 30% chance of Stop), Blizzaga, **Diamond Dust** (about 1,000 to all). The faster her HP falls, the more she uses Diamond Dust, so the only real danger is everyone being stopped at once. Absorbs ice, weak to fire. Steal Snow Ring; drop Crystal Gloves or Regal Crown.
- *Magus Sisters* (Sandy 10,330, Mindy 9,788, Cindy 12,240). Sandy: plain hit and Razzia for 150 to 300. Mindy: **Passado** (fifteen hits of 6.25% of current HP, cannot kill) and the four -aga spells. Cindy: Camisade, **Demi** (25% of each girl's current HP), Absorb, Regen, **Not-So-Mighty Guard** (Shell, Protect, Regen on all three), **White Highwind** (full heal, only while all three live and all three are under a quarter HP) and **Delta Attack** (everyone to 1 HP, only while all three live). Take out **Cindy first** (her heal and buffs are the worst), never spread damage evenly (that is how White Highwind arms), and note Sandy and Mindy dodge physicals, so use evasion-ignoring moves (Lady Luck's Four Dice, Dark Knight's Darkness); a Samurai's Spare Change on 75,000 Gil is a 9,999 shortcut on one sister. Steal Potpourri (Sandy), Chaos Shock (Mindy), White Cape (Cindy).
- *Anima* (36,000 HP). A softer fight than the Sisters and easy to hit. Plain hit about 300 and Poison, **Pain** (about 300 plus Silence, Itchy, Poison, and a stat drop that stacks), **Oblivion** (about 16 hits, about 600 in all). Carry Remedies for stacking Pain; heal steadily. Steal Fury Shock; drop Tetra Band.
- Overall: kill priority targets one at a time, keep status protection and HP up. Mega-Potions and Remedies in the bag.

**Our chapter.** Same three links on the Chapter 5 preset (Lv 46/48/50; Yuna White Mage, Rikku and Paine Dark Knights; the bag above), with a Save Sphere between links and a retry from the lost link (Bailey's picks FA2 b, FA3 b). `intendedStrategy` (`ffx2-fallen-aeons.ts`): revive, heal by thresholds, Remedy on Shiva's Stop and Anima's Silence or Darkness, Dispel on the Sisters, Shell then Protect early, Darkness from both Dark Knights. The guide has Shiva: "Fire hurts, Ice heals", Delta Attack gone when any sister dies, Pain's stacking losses, Darkness x2 and a Save Sphere rule.

**Fit.**
- *As written:* all HP figures (equal to our research §3, `[verified: 5 sources]`); Shiva's moves, Diamond Dust quickening as her HP falls (our action counter, §4.1), Fire weak and Ice absorbed; the Sisters' moves and Delta Attack and White Highwind conditions; Sandy and Mindy's evasion (our §3.2: Evasion 33 and 76) and Darkness's answer to it; Anima's three moves and Pain's stacking; Remedy after Pain; Darkness as the evasion-proof damage. Heavenly Strike's 30% Stop chance matches the number we hold (SinirothX, wiki, GamerGuides, Split_Infinity), so Jegged is a fifth source on it and the chance can be printed if Bailey wants the number in the guide.
- *Our adaptation of Jegged:*
  - **Kill Cindy first.** Our research (§4.2) records that guides split on who dies first (the wiki and GamerGuides say Mindy, the weakest; Split_Infinity says Cindy; FFExodus says Mindy then Sandy). Jegged sides with Cindy first, and gives the reason (her Not-So-Mighty Guard, Demi, Absorb, and White Highwind are the burdens), plus "never spread the damage". Darkness hits all three at once by design, so with our two Dark Knights the order is partly out of the player's hands; the adaptation is to aim the single-target or finishing hits at Cindy and to say so. This is the one Jegged point that adds a line our guide lacks: our `DELTA` rule says only that Delta Attack goes when any sister falls.
  - **White Highwind.** Our guide never mentions it (our research has it, §4.2). Jegged's rule is exactly ours: it fires only with all three alive and all under a quarter, so a kill before that line removes it. Candidate to add as a RULE or phase note.
  - **Ribbon against Stop.** Not modelled (stats-only accessories); our answer is Remedy, already the guide's rule.
- *Does not apply:* Samurai's Spare Change (the preset owns Samurai, but no build teaches Spare Change and 75,000 Gil is not in the bag; it is also a Sisters-only shortcut that skips the target-priority puzzle, and unmeasured here); Lady Luck's Four Dice (not equipped); stealing (our line spends no turns on it); Jegged's fire-damage advice for Shiva (the preset learns no Fire ability; Darkness is the line).
- *Holy and Anima:* our research has Anima weak to Holy (§3.3, `[verified: 3 sources]`); Jegged is silent. The guide correctly says nothing, since the preset learns no Holy.

**Proposed guide edits (not made).** (1) `DELTA` rule: add "Cindy first, and do not spread damage". (2) New short rule for White Highwind (only with all three alive and low). (3) Optional: print "30% Stop" on Heavenly Strike now that five sources agree. All sourced.

## 6. Chapter XIII, Trema: Paragon, then Trema (FFX-2 only)

**Source.** https://jegged.com/Games/Final-Fantasy-X-2/Side-Quests/Via-Infinito/Boss-Battles.html , page "Via Infinito Boss Battles", headings **Paragon Oversoul**, **Paragon**, **Trema** (the page names the last floor "Cloister infinity"; our research says Cloister 100, the same floor). Read 2026-10-03.

**Jegged's plan, in our words.**
- *Preparation.* Be well levelled, own the strongest dresspheres (Mascot first), and carry the best accessories (Defense Bracer, Shining Bracer, Rabite's Foot, Crystal Bangle, Invincible). Wear the **Higher Power** Garment Grid: it gives Break HP Limit, and pushing the girls through its gates gives Break Damage Limit. Strongly recommended: fight Paragon in its **Oversoul** form (a trigger via ten Ultima or Omega Weapon kills, then fleeing the next Weapon), because it is easier.
- *Paragon* (200,000 HP). In Oversoul form it does nothing until provoked or until it falls below 40% HP, which gives time to heal, buff and trigger Break Damage Limit; if left alone for about 20 seconds it uses Genesis (cone magic that strips buffs) or Big Bang; it answers healing with Demi, throws Judgment at a girl, and uses a plain attack with no side effects. Normal form: a plain attack that can inflict Poison, Itchy, Confusion, Ignore Defense or Absorb, **Genesis**, and **Big Bang** (up to 25,000) as a counter to special attacks that bypass Protect and Shell. Never use magic, MP Absorb, Supernova or any Arcana except Black Sky on it, since it copies them back. Two Dark Knights and an Alchemist work, as do three Mascots. The point of the fight is to arrive at Trema in shape: nothing is healed between them (HP, MP and statuses carry over).
- *Trema* (999,999 HP). Pure endurance. Moves: Dying Star (three hits), always followed by Falling Leaf (three weak hits) and then Thundering Wave (three hits); Choking Mist (poison), Beguiling Mire (stop), Waning Moon (MP drain), Demi, Flare, **Meteor at 50% and again at 25%**, **Ultima below 16%**. Plan: one girl heals constantly, Stamina Tonic raises everyone's HP ceiling, Protect and Shell up; a level and gear check, with "an element of getting lucky".
- Drops: Supreme Gem and Dark Matter from Paragon, Dark Matter from Trema; steals Supreme Gem, then Ether and Turbo Ether.

**Our chapter.** Lv 99 Yuna and Paine Dark Knights, Rikku Alchemist; shipped option: Oversoul Paragon with Split_Infinity's kit and 3 seconds of action time (Bailey 2026-09-25, "Trema: 1 and 3 at 3 s"). Kit: Crystal Bangle and Rabite's Foot, The End's Break Damage Limit on Paine, Stamina Tonic, Mega-Potion and Megalixir, Soul Spring, Three Stars (`src/data/ffx2/builds/via-infinito*.ts`). `intendedStrategy` (`ffx2-trema.ts`): revive, drain Trema's MP first, kit openers (Stamina Tonic, Three Stars), heal by thresholds, curtains, Remedy, Darkness on Trema, plain Attack on Paragon (never Darkness).

**Fit.**
- *As written:* Oversoul Paragon is our shipped form (so Jegged's strongest recommendation holds with no player work); its quiet start, the idle strike (our research: 20 seconds in SinirothX's script), the copy-back rule (magic comes back at the caster), Demi answering healing, the 40% HP change, Genesis stripping buffs; the carry-over with no heal between; Trema's chain (Dying Star, Falling Leaf, Thundering Wave), Mist, Mire, Moon, Meteor at 1/2 and 1/4, Ultima near 1/6; the Stamina Tonic and curtains approach; "heal one girl, the others hit". HP 200,000 and 999,999.
- *Our adaptation of Jegged:*
  - **Higher Power grid.** Not in the engine (`via-infinito.ts` header says so). Our stand-in is The End on Paine for Break Damage Limit (TR11). Same purpose, one girl instead of rotation.
  - **Mascot.** Jegged's first choice, but the chapter's three paintings are two Dark Knights and an Alchemist; Jegged also says that line works. Not a gap.
  - **Idle time.** Jegged says use Paragon's quiet opening for Stamina Tonics and buffs. The kit has the Tonic and our guide's `OVERSOUL_WAITS` and Stamina Tonic hint say so; stating it as "use the opening" is a wording candidate.
- *Does not apply:* the Weapon-family Oversoul trigger (the chapter is the Oversoul form by construction); Defense and Shining Bracer and Invincible (not in the kit; modelled stats only); a Mascot or three-Mascot party.
- *Jegged is silent on:* draining Trema's MP first (four of our sources, disputed under Spellspring: T-5), his immunities, Rabite's Foot for evasion, Three Stars. These stay on our research.

**Proposed guide edits (not made).** None required. One wording line for the Paragon link: "this is the quiet opening: spend it on Tonic and buffs, because nothing is healed between Paragon and Trema", Jegged's priority for the fight.

## 7. Chapter XV, the Den of Woe (FFX-2 only)

**Source.** https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-5/60-Mushroom-Rock-Road.html , page "Chapter 5 - Mushroom Rock Road", section **Den of Woe**, headings **Rikku**, **Paine**, **Baralai**, **Gippal**, **Nooj**. Read 2026-10-03. The Den needs all ten Crimson Spheres first; Jegged's separate Missable Items page (not read) lists which can be missed.

**Jegged's plan, in our words.**
- *Preparation.* Be fully healed (Yuna fights the first two alone); give Yuna a damaging dressphere reachable on her grid (Gun Mage is good, since she can also learn Blue Bullets), keep a Thief or the Treasure Hunt grid for Steals, and set up one girl on the **Salvation Promised** grid if owned.
- *Rikku* (7,800) and *Paine* (9,200): easy solo duels (Rikku: two quick hits, grenades about 200, level-2 gems about 300 magic; Paine: plain hits about 600).
- *Baralai* (12,220), party fight. Normal attack up to three hits of about 300; **Glint** (hits whoever is clustered); **Looming Glacier** (Stop and MP to zero); **Drill Shot** automatically **after his HP has changed ten times**, aimed at whoever made the last change; Silence on the whole party and Regen on himself; **Not-So-Mighty Guard** on himself; **Absorb**. He drains MP constantly, so rely on Dark Knights and keep healing; teach Drill Shot to a Gun Mage by having her make the tenth change if that is wanted.
- *Gippal* (14,800). Normal attack about 300; **Grinder** about 500; **Bullseye** (56.25% of current HP to each, can hit several); **Flash Bomb** (Darkness), **Hush Grenade** (Silence); **Potion Plus** (heals him 600); **Mortar** only below 33% HP (a cone). Grinder and Mortar ignore defense stats, so spread the party with ranged dresspheres and heal after every Bullseye. Heal before the killing blow. Mortar is learnable only here in the story.
- *Nooj* (23,800), the hardest. Normal shot about 500; **Rippling Chroma** about 1,500 magic on one that ignores Magic Defense; **Greedy Aura** (18.75% of every girl's max HP and max MP); **Lightfall**, 5,000 to everyone, **once**, after his HP is under 3,000. Survive it by high HP on a Dark Knight with Protect and Shell (which do not reduce Lightfall but keep HP up), or the Salvation Promised grid's Auto-Life, or a Dark Matter mixed with any potion for a short party-wide immunity; with luck the party takes him from just over 3,000 to nothing first.
- Rewards: Supreme Light grid, Magical Dances Vol. I; Steals Bushido Lore, Sword Lore, Nature's Lore, White Lore, Arcane Lore.

**Our chapter.** Three links only (Baralai, Gippal, Nooj; no Rikku or Paine duel), HP carried between links, the Chapter 5 preset with Bailey's pick (Lv 54/56/58 `[estimate]`, 3 Hero Drinks `[estimate]`, no Lightfall prep; Bailey 2026-09-26), `intendedStrategy` `ffx2-den-of-woe.ts`: Protect then Shell early, Darkness, Remedy on Stop, Hero Drink for the girl Lightfall would kill.

**Fit.**
- *As written:* HP 12,220 / 14,800 / 23,800 (our research §3, `[verified: 4 to 5 sources]`); Baralai's Stop and MP wipe, constant Absorb and Silence; Gippal's moves, Bullseye 9/16 of current HP (Jegged's 56.25%), Grinder 500 and Mortar ignoring defense, and Mortar only under a third (**Jegged is a second source for 1/3 against Split_Infinity's 75%, which strengthens the G-2 reading**); Nooj's Greedy Aura 3/16 of max HP and MP (18.75%), Lightfall 5,000 once, Dark Knights as the damage.
- *Our adaptation of Jegged:*
  - **Lightfall answer.** Jegged offers three: HP on a defended Dark Knight, Salvation Promised's Auto-Life, a Dark Matter mix for Invincible. The preset has no Alchemist and no Salvation Promised row, so our line already adapts the third into the **Hero Drink** (also Invincible, one girl at a time). That is our adaptation of Jegged and the wiki/GamerGuides, and the guide labels it as such.
  - **Steady HP on Dark Knights before Lightfall** is Jegged's other route; Bailey dropped it (the Lightfall prep, 2026-09-26). The guide must not teach it.
  - **Gippal and Bullseye.** Jegged's "heal after Bullseye, it is easy to lose a girl" matches our hint; the instruction to spread out with ranged dresspheres does not apply (the player has no positioning controls in our battle).
- *Does not apply:* Rikku and Paine duels, Yuna preparation, Thief and Treasure Hunt Steals, the Salvation Promised row, Gun Mage learning of Drill Shot or Mortar (the party-side learning is not in our chapter).
- *Disagrees with our research (open):* **J-3**, Drill Shot's count: Jegged says ten (as Split_Infinity and GamerGuides do); SinirothX and the wiki say eight and our build uses 8 (G-5).

**Proposed guide edits (not made).** None required. Do not move Baralai's Drill Shot count off 8 on Jegged's word (J-3).

## 8. Chapter XVI, Ixion at Djose (FFX-2 only)

**Source.** https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-3/40-Djose-Temple.html , page "Chapter 3 - Djose Temple Revisited", mission "No Way, Djose!", heading **Ixion**. Read 2026-10-03. (The earlier Djose page, 29, has no fight.)

**Jegged's plan, in our words.** A yellow or NulShock ring helps less than expected because only one of his attacks is lightning. Steal Sprint Shoes before he falls. His loop: **Aerospark** four times in a row (each takes 62.5% of one girl's current HP), then he **Recharges** (heals some HP), then **Thor's Hammer** for roughly 700 on the party; be healed before the Hammer. He absorbs lightning and is weak to water (Water, Watera, Waterga, Liquid Steel, Water gems by Mix). Unlike Yojimbo he can be Broken by a Warrior, which helps if the fight drags. HP 12,380; drop Soul of Thamasa; rewards Unwavering Guard grid. After the fight: Yuna falls into the Farplane Abyss, and the game wants four taps on the action button after "I'm all alone" to bring the four whistles.

**Our chapter.** Yuna White Mage Lv 32, Rikku and Paine Dark Knights Lv 33 and 34 (`src/data/ffx2/builds/djose.ts`, levels our estimate IX-14), bag with 5 Mega-Potion, 10 Ether, curtains. `intendedStrategy` (`ffx2-ixion-djose.ts`): Shell and Protect up, heal, **answer the Recharge tell** (Shell, then heal everyone high, before the Hammer), Darkness.

**Fit.**
- *As written:* HP 12,380 (eight sources); Aerospark 62.5% of current HP (our 5/8); Recharge then Thor's Hammer; heal before the Hammer; absorbs lightning, weak to water; Breaks land; Sprint Shoes steal and Soul of Thamasa drop; the four whistles scene (our research Q5, built as a moment). The best match on the page: Jegged's "heal first" is our Recharge rule.
- *Our adaptation of Jegged:*
  - **Water.** Jegged's damage advice is water magic or water gems. Our line is Darkness (it ignores Defense 106) and the guide says water hurts; the party can reach Waterga by a spherechange to Black Mage (all three own it), but that is a turn and is unmeasured. Water gems need an Alchemist Mix; the preset has none. Label: optional, not the NEXT line.
  - **Breaks.** Jegged: Warrior Breaks work. Our party has no Warrior in the chain; same adaptation as above.
- *Does not apply:* Yellow or NulShock Ring (stats-only accessories; and our research's Thor's Hammer element is disputed, IX-2, so no ring claim is safe either way).
- *Disagrees with our research (open):* **J-2**, the loop shape: Jegged says four Aerospark in a row, then Recharge, then the Hammer. Our research (SinirothX plus wiki) has two plain attacks or Thundara per Aerospark under a hidden counter, with Recharge when the counter fills. Split_Infinity wrote the same "four" observation; research conflict IX-5 already resolves it for the counter model. Jegged is a second observer of the "four", so it is worth one real-game look, but the engine is not changed.

**Proposed guide edits (not made).** None. If Bailey wants Jegged-first wording for the loop, the line "two Attacks then Aerospark" stays correct under the counter model, and "four Aerospark" should not be printed.

## 9. Differences and open items for Bailey (nothing here was changed)

| ID | Chapter | Jegged says | Our research / engine says | Standing / what to do |
|---|---|---|---|---|
| **J-1** | 5 (Tail) | **Protect halves Noli Me Tangere**, 1,250 to 625 | `vegnagun-abilities.ts` makes Noli a fixed `damageType: 'other'`; `accessories.ts` and the guide say neither Protect nor Shell touches it ("raw max HP is the only defence"); research §3.1 `[verified: 2 sources]` for the 1,250 constant, silent on Protect | **Conflict, unresolved.** The guide's "buffs do nothing" is stronger than the sources prove. Cheapest fix: a Steam HD look (Bailey prefers real-game checks; ask before taking the screen). Until then, soften the Tail guide line to "max HP is the sure defence". No engine change. |
| **J-2** | XVI (Ixion) | Four Aerospark, then Recharge, then Thor's Hammer | Counter model: two plain attacks or Thundara per Aerospark; Recharge when the counter fills (IX-5) | Second observer for "four" (with Split_Infinity). Engine unchanged; do not print "four" in the guide. |
| **J-3** | XV (Baralai) | Drill Shot after his HP has changed **ten** times, aimed at the one who made the tenth | 8 (SinirothX, wiki; G-5), build uses 8 | Jegged joins the "ten" side. Unresolved; an in-game check is the only real settler. |
| **J-4** | XV (Gippal) | Mortar only below 33% | below 1/3 (SinirothX), Split_Infinity 75% (G-2) | Jegged **supports the 1/3 line**: G-2 is now better supported. Record only. |
| **J-5** | XIII (Paragon) | Oversoul Paragon strikes after about 20 seconds idle | 20 s (SinirothX) vs "about 2.5 minutes" (wiki, NightMare185; T-conflict §12 note 2) | Jegged adds a source for 20 s. Record only. |
| **J-6** | XI (Passado) | Fifteen hits of 6.25% of current HP | F-6 conflict: SinirothX "1/16 x15"; wiki "15/16"; Split_Infinity, GamerGuides "81.5%" | Jegged's reading equals SinirothX's. All agree it cannot kill; record only. |
| **J-7** | 5 (Nemo) | 700 to 1,500 on the party | 1,490 to 1,685, derived (research §3.4) | Not a conflict: Jegged's is an observed, buffed spread. Keep our figure. |
| **J-8** | XI (Magus Sisters) | Cindy first | Guides split: wiki and GamerGuides Mindy, Split_Infinity Cindy, FFExodus Mindy then Sandy (§4.2) | Jegged sides with Cindy. Adopt as the guide's wording (it also matches the White Highwind and Delta rules); no data touched. |

**Other open points.**
- **Leblanc (chapter 6) has nothing from Jegged** to follow: the guide stays on our research, and the rule "the guide follows Jegged" is satisfied only by saying so (section 4).
- **Jegged's tone ("extremely easy")** describes the real game's level cushion; our Chateau chapter is balanced by our own measurement, and the guide should not carry the tone over.
- **Two kit gaps** Jegged assumes and our chapters lack, each needing Bailey's yes before anything is added (rule 10): a **Dispel Tonic** for the Leg (chapter 5) and an item or row for **status-proof accessories** such as Ribbon (chapters 4, 5, XI). Neither is built; this file does not recommend building either.

## 10. Summary of what Jegged changes in our FFX-2 guides

| Chapter | Jegged's plan vs ours, in one line | Guide edit it supports (all unbuilt) |
|---|---|---|
| 4 Bahamut | Same loop and Dark Knight route; Jegged is lighter (heal before Mega Flare); ours adds Shell and Magic Break from the damage pipeline | Name the first Impulse as the tell for Countdown and Mega Flare |
| 5 Vegnagun | Same chain and Darkness plan; Jegged times Shell for Memento Mori only (Dispel kills it earlier) and says Protect halves Noli | Body note: Shell on the third Charge Core; soften "buffs do nothing" (J-1) |
| 6 Leblanc | Jegged has no strategy ("easy", no numbers); ours is our own research | None; say Jegged is silent |
| XI Fallen Aeons | Same three links, same Darkness; Jegged adds Cindy first and White Highwind | Add Cindy-first and a White Highwind rule |
| XIII Trema | Same shipped Oversoul and endurance plan; Jegged wants Higher Power and Mascot, which we do not have | Optional "use the quiet opening" wording |
| XV Den of Woe | Same three shades; Jegged's Lightfall answers (HP, Auto-Life, Dark Matter mix) are adapted into our Hero Drink | None; the drop-the-prep pick stands |
| XVI Ixion | Same loop and heal-before-Hammer; Jegged recommends water and Breaks that our line does not use | None; do not print "four Aerospark" (J-2) |

## Sources

All read 2026-10-03; Jegged pages are undated.
- https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-2/28-Bevelle.html (Bahamut; also Baralai, Dark Knight, Ribbon notes)
- https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-5/63-Heart-of-the-Farplane.html (Vegnagun, Shuyin)
- https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-2/27-Guadosalam-Chateau-Leblanc.html (Syndicate, Chateau)
- https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-1/02-Mt-Gagazet-Floating-Ruins.html (Syndicate, Floating Ruins; context)
- https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-5/61-Road-to-the-Farplane-and-Farplane-Abyss.html (Shiva, Magus Sisters, Anima)
- https://jegged.com/Games/Final-Fantasy-X-2/Side-Quests/Via-Infinito/Boss-Battles.html (Paragon, Trema)
- https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-5/60-Mushroom-Rock-Road.html (Den of Woe)
- https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-3/40-Djose-Temple.html (Ixion)
- Index pages used to find the sections: https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/ and `.../Chapter-1/` to `.../Chapter-5/`, https://jegged.com/Games/Final-Fantasy-X-2/Side-Quests/ and `.../Via-Infinito/`.
- Our own files compared: `research/ffx2-bahamut.md`, `ffx2-vegnagun-shuyin.md`, `ffx2-leblanc-syndicate.md`, `ffx2-fallen-aeons.md`, `ffx2-trema.md`, `ffx2-gippal-den-of-woe.md`, `ffx2-ixion-djose.md`; `src/data/guides/ffx2-*.ts`; `src/engine/tactics/ffx2-*.ts`; `src/data/ffx2/builds/*.ts`; `src/data/encounters.ts`.
