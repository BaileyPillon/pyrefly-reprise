# The Dark Magus Sisters and Dark Yojimbo, as the community guides give them (the hidden FFX chapter "Mirror Aeons")

**Game case: FFX only.** The Dark Aeons exist only in the International / HD Remaster releases of FFX; FFX-2 has none (Jegged says the same of the original North American release). Nothing here applies to the ATB game. Written 2026-10-15 for
the hidden chapter number 27 (`docs/plans/ch-mirror-aeons-review.md`). This file is the **written-sources half**: what the guides say, in our words, and where the game's own files overrule them. The files are
`research/re-ffx-yojimbo-sisters-feasibility.md` (the reverse-engineering session's note, tags `[bytes]`, `[note]`, `[inferred]`; cited below as "RE section n") and the private coverage note FFX-G08 on the player-side
aeons (kept outside the repository, cited as "G08 section n"). **Where a guide and the files disagree, the files win** (AGENTS.md rule 6; Bailey's standing rule is that the in-game guide follows Jegged's encounter
guides, in our words with citations, and that GameFAQs is his tie-break when sources conflict and nothing in the game settles it).

## How the pages were read

- Read on **2026-10-15**. The text of each page was taken in a headless Chromium started from node (the page's own visible text); nothing was downloaded or saved, and no bot wall met. WebFetch's summaries were not used
  (an earlier digest, `research/jegged-encounter-guides-ffx-a.md`, found its summariser invented lines). The Fandom wiki was **not** read (it needs the built-in browser pane, which this lane did not use). GameFAQs
  was **not** read: no conflict below needed a tie-break that the game's files had not already settled.
- Nothing is copied. The advice is restated in our own words; numbers a page gives are marked with its name; numbers we give come from `research/*.md` or the RE notes with the section named. Where a page is silent
  this file says so.

| Short name | Page (date read 2026-10-15) |
|---|---|
| **Jegged Sisters** | Jegged.com, Final Fantasy X, Side Quests, Dark Aeons, "Dark Magus Sisters" (`/Games/Final-Fantasy-X/Side-Quests/Dark-Aeons/Dark-Magus-Sisters.html`) |
| **Jegged Yojimbo** | the same section, "Dark Yojimbo" (`.../Dark-Aeons/Dark-Yojimbo.html`) |
| **Jegged Dark Aeons** | the section's index (`.../Side-Quests/Dark-Aeons/`) |
| **Jegged Stat Maxing / Best Armor / Cavern / Aeons** | Tips and Tricks "Stat Maxing" and "Best Armor - Customization"; Side Quests "Cavern of the Stolen Fayth"; Aeons "Yojimbo" and "The Magus Sisters" |
| **StrategyWiki** | `strategywiki.org/wiki/Final_Fantasy_X/Dark_Aeons` |
| **GamerGuides** | `gamerguides.com/ffx/guide/side-activities/dark-aeons/` pages "the aeons locations", "dark yojimbo", "the dark magus sisters" (Final Fantasy X HD Remaster) |

## 1. What both fights are, in one paragraph each

**The Dark Magus Sisters** are three superbosses that spring on the party at the Mushroom Rock Road end that faces the Mi'ihen Highroad, called up by disguised Yevon acolytes (Jegged Sisters; GamerGuides locations).
They arrive **together**, but a short chase decides it: run north up the valley and the sisters peel off one at a time, Cindy first and Mindy second (Jegged Sisters), so the player ends up fighting them **one by
one**; get caught and it is all three at once (GamerGuides). Both guides say the same thing about difficulty: all three together is winnable but brutal, each alone is "fairly easy" for a prepared party (Jegged
Sisters). Each has millions of HP and shares an Overdrive with the others (Jegged Sisters; StrategyWiki).

**Dark Yojimbo** waits in the Cavern of the Stolen Fayth once the player owns Yojimbo, and he has to be beaten **five times in a row** while working back out of the cave, healing at the Save Sphere between fights; a
reload, a Game Over, leaving the cave, the teleporter or even opening the Blitzball menu at the sphere resets the count (Jegged Yojimbo; StrategyWiki; GamerGuides locations). Each of the five drops loot, not only the
last (Jegged Yojimbo). One tier is a full-HP fight; the game's own tiers differ in how fast his Overdrive fills (RE section 4.1).

## 2. The Sisters, as the guides play them

- **Stats** (Jegged Sisters; StrategyWiki): HP Cindy 3,000,000, Sandy 2,500,000, Mindy 2,000,000; Overkill 99,999; AP 10,000 (12,000 on an Overkill); no elemental affinity; immune to Sensor. StrategyWiki lists every
  stat; **all of them equal the game's rows** (RE section 2). The guides' one gap is Luck, which they leave as a question mark.
- **Moves** (StrategyWiki; GamerGuides): Cindy has a plain attack that also strips Auto-Life, and Camisade, which hurts HP and MP; Sandy has a plain attack that Petrifies, and Razzia, which strips Auto-Life; Mindy has
  Passado (a many-hit flurry that kills) and Calamity (Poison, Silence, Darkness, Curse and the four Breaks); all three can use **Mega-Graviton** when alone and full, and the joint **Delta Attack** when all three are
  together and full (GamerGuides: six non-elemental hits on everyone, which also removes Auto-Life, so the party has to send an aeon in as fodder).
- **The opener.** The sisters **start every gauge full** when they are together, so the first thing they do is the joint attack (StrategyWiki: cast Haste and Auto-Life and summon an aeon first). The files agree
  (RE section 4.2: the trio formations set every Overdrive gauge to 100).
- **Order and tactics.** StrategyWiki says to take Mindy out first (her Evasion is highest, so Aim is not much help against her); GamerGuides says Quick Hit (Tidus's fast attack) for offence, and Doublecast Flare or
  Ultima as about 40 percent stronger than physical attacks, because the sisters' Magic Defense is lower than their Defense.
- **Preparation** (Jegged Sisters; GamerGuides; StrategyWiki): a fully levelled party with its best gear and stats near the cap (GamerGuides: 250 to 255); Ribbon against the sisters' many ailments; Auto-Haste (it
  also cancels Slow), Auto-Phoenix, Auto-Protect, Auto-Shell, Auto-Potion with only X-Potions in the bag; Auto-Life is not enough against the joint attack.
- **Rewards:** Dark Matter (common) and Master Sphere (rare), a weapon or armour with Break Damage Limit possible on every sister's weapon; Steal Return Sphere (Cindy), Friend Sphere (Sandy), Teleport Sphere (Mindy),
  Elixir (rare) (Jegged Sisters). The files agree (RE section 2 loot rows).

## 3. Dark Yojimbo, as the guides play him

- **Stats** (Jegged Yojimbo; StrategyWiki): HP 1,600,000, Overkill 99,999, no affinity, immune to Sensor. StrategyWiki's other numbers equal the game's row (RE section 2); Jegged adds that his **Luck is extremely
  high**, so most physical attacks miss (a monster's Luck lowers the party's chance to hit), and that a party with high Luck has an easier time; it is not required. The row has Luck 114 and Evasion 0.
- **Moves** (Jegged Yojimbo; StrategyWiki; GamerGuides): **Wakizashi** hits the whole party and is his most used move; **Kozuka** hits one character and lands the four Breaks and Slow; **Daigoro**, the dog, hits one
  character and can Petrify (GamerGuides: and Poison); his **Overdrive Zanmato** hits the whole party and **removes Auto-Life**, so Auto-Life does not save anyone from it. All three guides agree on the answers:
  kill him before he gets to use it, or have Yuna summon an aeon to take it. Auto-Haste answers Kozuka's Slow and stops Dispel from taking Haste off (GamerGuides).
- **Preparation:** Ribbon or Stoneproof for the dog, Auto-Haste, Auto-Phoenix and Auto-Protect, First Strike (StrategyWiki lists it; StrategyWiki also says he always ambushes, but a First Strike weapon still acts
  first), high Strength, Defense and Agility, and spare party members to fill Overdrive gauges with the opening Mixes (GamerGuides).
- **Offence:** Quick Hit for the fastest turns (Jegged Yojimbo; GamerGuides); his Magic Defense is lower than his Defense, so Doublecast Flare or Ultima is the alternative (StrategyWiki; GamerGuides).
- **Rewards:** Dark Matter (common) and Master Sphere (rare) after every one of the five, and a weapon or armour piece with three or four slots each time (Jegged Yojimbo); Steal Stamina Tonic x2, rare Elixir.

## 4. The endgame party the guides expect (for the preset's estimates)

None of the Dark Aeon pages gives a party; they say "fully levelled, best gear, stats near the cap" (Jegged Dark Aeons / Sisters / Yojimbo). The numbers behind that:

- **The caps** (Jegged Stat Maxing): HP 9,999, MP 999, every other stat 255; Luck is possible to max but very slow and "not required for any endgame boss", so raise it as far as is reasonable. GamerGuides' working
  figure for the Sisters is stats of 250 to 255 "by now". Jegged Best Armor ranks the useful armour abilities: must-have **Auto-Haste** and **Auto-Phoenix**; strong **Auto-Protect, Auto-Regen, Auto-Potion, Ribbon,
  Stoneproof, Defense +20%**; Break HP Limit is called unnecessary ("very rarely does HP over 9,999 matter").
- **The weapon:** every Dark Aeon can drop a weapon with **Break Damage Limit**, which lifts a character's damage cap to 99,999 (RE section 2 loot rows; Jegged Sisters, Yojimbo); the guides assume the party has some
  already, since 1.6 to 3 million HP would take hundreds of capped hits otherwise (RE section 8).
- **Time spent:** the guides assume the party has played the whole game plus the optional quests (Jegged: "much higher leveled"). There is no standard "typical endgame stat table" in any page read; the preset's
  numbers are therefore **our estimate** (cited as such in the plan and the data).

## 5. The player's Yojimbo and Magus Sisters (the other side of the mirror)

- **Yojimbo** costs **190,350 gil** at the lowest price, when the third option ("to defeat the most powerful of enemies") is chosen at the Fayth; the asking price starts at 250,000 gil and can be haggled down
  (Jegged Cavern). The files agree on the start price and the answer (G08 section 3.5: the third reply gives 250,000 and the hire answer 2). You pay him each time to act, and what you pay (and his *disposition*, which
  rises as you use him well and falls when you pay nothing, dismiss him at once or let him fall) chooses between Daigoro, Kozuka, Wakizashi and Zanmato (Jegged Yojimbo aeon page; G08 section 3). Past Auron's
  Masamune he can exceed 9,999 damage (Jegged Yojimbo aeon page).
- **The Magus Sisters** are the last optional aeon, need all the others first, and cannot be given orders: Yuna only shouts a suggestion and the three choose (Jegged Magus Sisters aeon page). Cindy casts Reflect and
  Cura-type spells, Mindy casts the high-level spells, Sandy attacks and is the strongest of the three; they use Delta Attack only when all three Overdrive meters are full, and they can break 9,999 damage **as soon
  as you have them** (Jegged Magus Sisters aeon page).
- **Zanmato against these bosses.** StrategyWiki says Yojimbo's Zanmato "will instantly KO" each Dark Aeon; the files say each Dark row has a Zanmato resistance byte of 4 (the guides print "Zanmato Lv. 5"; RE
  section 2), which divides the Pay motivation (G08 section 3.2: for the hire answers 0 and 1 the motivation is divided by that byte plus one, for answer 2 multiplied by 0.4 for bytes 3 to 5). **The odds depend on the hire answer.** For hire answer 1 they are lower without a full gauge (RE's lane handoff section 10.4: 3 in 64 per Pay at 9,999,999 gil and compatibility 128, or 23 in 64 with a full gauge), and StrategyWiki's Dark Valefor page puts the kill near three percent even for two million gil, which is of that order. **For hire answer 2, which the chapter uses (an ESTIMATE: the guides' recommended reply, not read from a save: the community pack behind the compatibility is not Bailey's),** RE's review of 2026-10-16 gives, out of 64 per Pay against a byte-4 foe at compatibility 128, a full gauge in brackets: 1,000 gil 0 (20); 10,000 gil 6 (26); 100,000 gil 11 (31); 1,000,000 gil 16 (36); Pay all, 1,500,000 gil, 17 (37). So the instant kill is a real chance at this reply (about one Pay in four at 1,000,000 gil, better with a full gauge), not a long shot, and still not a plan.

## 6. Conflicts with the files (the files win), and what stays open

| # | A guide says | The files say | Treated as |
|---|---|---|---|
| C1 | Jegged and GamerGuides: Daigoro is one of Dark Yojimbo's attacks, "chosen at random", and Petrifies. | His script rolls the **dog row 0x4086, which deals no damage**, aimed at the second slot (RE section 4.1); the row 0x410B (power 8, Petrify and Poison at 254) is in his command list. The dog's own stand-in script (the Sinscale file m116, read by RE but not written up in the note) answers the order by biting a living front-line character with 0x410B, with Strength 244, when "counter allowed" holds, and takes no turns of its own. | **Agree.** The dog bites. The bite is a row the RE session's AI work owns. |
| C2 | StrategyWiki: Zanmato "inflicts instant death to all". | Zanmato is a damage row (formula 1, power 250, cap 99,999) with the "cleanses" flag and the Auto-Life extra word (RE section 2). | **File wins:** a huge damage hit on the whole front line that removes Auto-Life. |
| C3 | StrategyWiki: Dark Yojimbo's Kozuka also Curses. | Kozuka's record lists the four Breaks and Slow at 254 and an empty extra word (no Curse); Curse belongs to Mindy's Calamity (RE section 2). | **File wins:** no Curse on Kozuka. |
| C4 | StrategyWiki: Delta Attack "causes 99,999 damage with each blast". | Formula 15 (the Magic cube), power 80, six hits, with the 99,999 cap flag (RE section 2). | **File wins:** MAG-based, capped at 99,999 a hit, six hits. |
| C5 | StrategyWiki: Dark Yojimbo "always ambushes the party". | Only the first tier's script sets the ambushed start (RE section 4.1); the other four start normally. | **File wins.** |
| C6 | Jegged: Dark Yojimbo's Luck is "extremely high". | Luck 114; Evasion 0; Accuracy 255 (RE section 2). | **Agree** (114 is high against the party's, and it is the stat that lowers the party's hit chance). |
| C7 | The guides' chase (outrun the acolytes to split the sisters) | In battle, Escape and Flee are disabled in all six sister formations (RE section 3); the chase is a field event the files do not give. | The chapter picks a formation; the chase is not modelled. |
| C8 | Every guide: the sisters, or Yojimbo, are optional extras after the airship | The chapter is a showpiece, not a story beat. | Out of scope. |
| C9 | StrategyWiki: take Mindy out first; GamerGuides: a mage's Doublecast Flare or Ultima beats a blade by about 40 percent. | Mindy's Evasion is **240** and her Luck 130 (RE section 2). Measured on this repository's engine with the chapter's preset (Luck 60, every other stat 255; `docs/handoff/ch-mirror-aeons.md`): a blade of Tidus landed **0 of 55** on Mindy, about 80 percent on Sandy (Evasion 100), **every one** on Cindy (Evasion 0) and about two in five on Dark Yojimbo (Luck 114); a spell never misses. | **Agree, with a correction to the order:** "first" is only available to magic, Overdrives and aeons. Blades go to Cindy and Sandy, a mage's spells to Mindy. The chapter's party seats Lulu for this reason. |

**Measured, not read (the engine, 2026-10-15; a fact about this repository's party, not about the game's pages):** see C9. The hit rule is the game's (the engine's kernels were proved against it), so the guides' repeated advice to bring Luck and magic against Mindy and Yojimbo is the same fact seen from the player's chair.

**Open, and not settled by any page:** Luck of the three Sisters (the guides print a question mark; the files: Cindy 40, Sandy 80, Mindy 130); the player's Yojimbo's **starting compatibility** (the files hold 0; G08 section 3 and the community said 128, StrategyWiki says 25 ordinary battles raise it enough; **since 2026-10-17 it is closed: 128 is the game's own starting value (read at boot, 2026-10-17), with the hire answer 2: before any save was loaded, FFX itself wrote both**); and what a typical endgame stat table looks like (no page gives one).
