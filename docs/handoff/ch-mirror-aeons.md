# Mirror Aeons: the Dark Magus Sisters and Dark Yojimbo against Yuna's own Magus Sisters and Yojimbo (Chapter XXVII, FFX; listed on the board; "Dark Mirror")

**Status (2026-10-15, phase 2 and the listing, built for Bailey, via the release driver): a finished, LISTED chapter, complete end to end; not merged to main and not deployed; RE's follow-up (the group Zanmato and the seven orders) is merged in; Act II is benched on it, and Act I and the whole chapter wait for RE's last fix (the player's Delta Attack becoming group-type).**
Bailey, relayed by the driver, verbatim: "We need to prioritize the dark Yojimbo and dark magnus sisters chapters over night. It needs to go live over night and not be hidden. It needs to be done and complete end-to-end."
The chapter has a **card on the chapter board** (Chapter XXVII, the last of the FFX group; the board reads "of 19"), its clear, best time and attempts are recorded in the save like every listed chapter's, the typed word
`yojimbo` still opens it, and the whole run was played in a production build with real keys: the card, party prep, the intro, Act I, the seam, the heal, Act II, the post scene, the results, the board with the ribbon, a
retry, on a desktop and on a phone (section 8). **Listing does not touch the save schema** (section 2, `tests/unit/save-mirror-aeons-listed.test.ts`). Built, tested and proved in a production build in a browser. Branch `ch-mirror-aeons` (from
`origin/r49-rc` f939b87f), in a worktree of its own (a sibling folder of the main tree), with the reverse-engineering session's (RE's) work merged: its two notes (`origin/re-ffx-yojimbo-sisters-feasibility` 8892f8f6, the rows,
the formations and the aeon summon rules; `origin/re-ffx-dark-aeons` 36c3cdb8, the five scripts, the tier ladder and the mirror rule) and **lane FFX-K's engine at its FINAL tip, `origin/re-parity-ffx-yojimbo-sisters`
d8fa5b69** (Yuna's Yojimbo and Magus Sisters in the engine; merged in two steps, 42dc0f547 and then d8fa5b69, which added only its handoff note and corrected test comments). Tip: see the last line of this file.

**What phase 2 and the listing added, in one list** (details below): **the listing** (the card, "of 19", the clear recorded in the save, the typed word kept, the Atlas cites, the pause numeral, the plate over the road, the e2e counts);
**Yuna's three Magus Sisters staged on the party's three spots** (they used to pile on one); the Dark Aeons' AI as code (RE's note, every number from it); Yuna's Yojimbo and Sisters in the party build, both summonable in both acts; **the heal between the acts**
(the driver's delegated pick: the party and every aeon whole at Act II); **the difficulty measured and set** (the faithful pair into tier 2 with 17 Phoenix Downs: the advisor wins about three runs in four, a careless line none;
`docs/plans/ch-mirror-aeons-bench.md`); the seam's HUD kept off the screen behind the white-out; the advisor's card kept off the two aeons' menus; the chapter's words, guide and advisor's line follow the new fight; the
bench, the real-key proof and the smoke tool.

**What RE's Zanmato note settled (`research/re-ffx-zanmato-and-orders.md`, merged; the driver's calls, 2026-10-15):**
1. **Dark Yojimbo's Zanmato is the Strength row 0x410A** (power 250, capped at 99,999, no Death), which **cleanses Auto-Life before the death check**, so no revive is queued: the chapter's data uses that row (pinned,
   `mirror-aeons-ai.test.ts`; a cast Auto-Life is taken off and the holder stays down).
2. **The player's Zanmato** (Yuna's Yojimbo, when a Pay or a free attack rolls it) **hits every legal enemy of one group with Death at 255, and Slice does nothing in this build**, so a landed Zanmato **ends a Dark Aeon fight at
   once**. That is faithful and the driver KEEPS it. It is rare: never from the free attack against byte-4 foes, **about 7.8 percent per Pay at the extreme** (5 in 64: all 9,999,999 gil, compatibility 255, byte 4, hire answer
   1), more with a full gauge; the guide card says "a lucky Zanmato can end it". **RE's engine fix for the group effect has LANDED** (`afda2d451`, merged: a landed Zanmato kills every legal foe of the group it picked, reach 1; its odds against a Dark Aeon, hire answer 1, 9,999,999 gil: compatibility 128 gives 3 in 64, or 23 in 64 with a full gauge: RE's lane handoff
   section 10.4). **Act II was re-benched on it and did not move to the seed** (section 4): at compatibility 128 and no full gauge a Pay buys no Zanmato (the advisor's line paid 749 times over 600 fights and never with a full gauge), so **Pay is final for Act II**.
3. **The Sisters' orders.** **All eight work now** (`4256d209a`, merged): Do as you will, One more time, Fight!, Go go!, Help each other!, Defense!, Are you all right? and Combine powers, each with the one event frame RE's handoff section 11.3 lists. The presenter plays all of them
   (`tests/unit/chapters/mirror-aeons-orders-presenter.test.ts`: all eight taken through the real presenter, 83 order turns over eight seeds, each followed by the next menu), and the proof takes an ordinary order with the keys before Combine powers. A Sister's order rows carry short
   words for the command column (`engine/PayRows.ts`). **The advisor's line still plays only Combine powers and Dismiss** (it may use another order only with a measured gain: the driver's call), and **the preset still starts the Sisters with full gauges** (100), a choice made when only Combine
   worked: now that a bar can be filled in the fight, a start at 0 is playable and is the bench's lever to re-read once Act I is re-run. Not touched.

**Authority:** Bailey, 2026-10-15, verbatim: "we definitely need an awesome chapter built with yojimbo AND magus sisters that would be so awesome. the most epic encounter ever!!!!!!!!!", then "i like the mirror match but
make the difficulty appropriate not too easy not too hard", "ok let's do each mirror match" and "I'll go with all of your recommendations". The driver's decisions: FFX only, hidden behind a typed word, number 27, two acts,
art provisional, and, delegated to the driver, **the party and the aeons are restored between the acts**. The listing (above) is Bailey's own word, relayed by the driver.

**Game case: FFX only** (AGENTS.md rule 14). The Dark Aeons, Yuna's Yojimbo and Magus Sisters and CTB are FFX's (both RE notes say so); FFX-2's Yojimbo ("Tourist Trap") is another record. The shared plumbing (one registry
row, one door row, one scene row, one trigger condition, a data barrel, one set-up call, one optional group field, one early return in the advisor) is "both" in kind (CHK-020), additive and inert for every other chapter; the
goldens are listed in section 7.

**The mirror is faithful (RE note section 9, 2026-10-15).** Yuna's own Yojimbo and her three Magus Sisters are summonable in BOTH acts, against their dark twins: the game bars nothing. RE's first reading (section 2.2 of its
note) took the formations' unmapped call `ct_7126` for a lock on the matching aeon; section 9 withdraws it. The call sets one byte that only keeps the aeon's loaded model data from being released when it is dismissed or wiped
(a memory pin), shown in the game's own machine code (28 triggers, 840 gate checks, 3,000 summon worlds each way, zero differences); the game's real lock, script call 0x703B, is used by none of the eleven formations.
The evidence is **proved** at the usability gate and in the summon kernel and **not yet seen on screen** (the game was not run: RE 9.6). The chapter therefore bars nothing. Barring the matching aeon would be an addition for
balance or fiction (RE 9.5) and needs Bailey's yes (rule 10).

## 1. What Bailey should see first

1. On the chapter board, **Chapter XXVII Mirror Aeons is the last card of the Final Fantasy X group** (after Sin: the Face), with the painting of Mindy over Mushroom Rock Road; the board reads "0 of 19 beaten", the pip
   strip ends the FFX group with XXVII. Walk to it with the arrow keys and press Enter. **Typing `yojimbo` on the board still opens it** (Y, O, J, I, M, B, O; none is a board key but the M, which is `select` and is claimed
   by the word as a later letter).
2. Party prep says **CHAPTER XXVII** (header "XXVII · MIRROR AEONS"): Tidus, Yuna and Lulu on the field, Auron, Wakka, Kimahri and Rikku on the bench. Its tip: two sisters, no joint attack, every fallen member costs a Phoenix Down, so heal
   early and use spells on Mindy; in the cavern, Cheer first and call Yuna's Yojimbo in before his blade is full.
3. The opening plays on **Mushroom Rock Road** (eight lines, our own words). The first menu has the party against **Dark Mindy and Dark Sandy** (2,000,000 and 2,500,000 HP, both Overdrive gauges at 0), the guide open and
   Tidus's tip Quick Hit on Sandy. **Yuna's Summon list holds seven: the five story aeons, Yojimbo, and Cindy** (the Sisters are ONE summon of three, offered under Cindy's name; Anima is left out). A Sister's menu is an **Aeon**
   group (the orders the game's menu builder offered: free choice, Cindy's spell and support orders greyed, **Combine for the Delta Attack lit** while all three bars are full) beside Dismiss. The advisor's card is
   deliberately blank on that menu and on Yojimbo's (it cannot price an order or a payment; section 5).
4. Beat the sisters: the **seam** (the sisters go with the light, three plain lines, a white-out with **the road's HUD off the screen**, "Deep in the cavern, a blade was already drawn.") puts the **Cavern of the Stolen Fayth**'s
   plate on the stage and **Act II opens on a whole party and whole aeons** (the heal), against **Dark Yojimbo, tier 2** (his dog beside him, untargetable; a blade that fills +10 a turn, the first Zanmato on his 11th turn).
   Win, and the post scene (eight lines) plays in the cavern.
5. Look at: the two **provisional** backdrops (existing plates), the Dark aeons drawn with the aeons' own paintings (the possessed aeons' convention; red-and-black Dark paintings are Bailey's pick), the music (existing cues by
   reference), the guide card and page.
6. **Yojimbo's Pay is a ladder of amounts** in his Aeon group beside Dismiss (Pay 1,000, 10,000, 100,000, 1,000,000 and Pay all, capped by the gil left; `engine/PayRows.ts`, built from the engine's one Pay row, which pays nothing). A Sister's order
   rows carry short words (Combine, with a help line that says Combine powers and the Delta Attack, not "Combine for the Delta Attack", which the command column cut). **The ladder is a stop-gap for a screen Bailey has not seen** (section 9, item 1). **Do not judge yet:** (a) the Pay ladder itself; (b) the Dark aeons' Overdrive gauges
   are not drawn (the HUD's gauge widget exists only for Chapter IX's Yojimbo); (c) every Act II number that leans on a Pay (RE's Zanmato caveat above); (d) the pause screen's hero art and the card's painting (Mindy over the road: provisional).

## 2. What was built

| Area | Files (all under `src/` unless noted) |
|---|---|
| ids and the formation tables | `data/ffx/mirror-aeons-ids.ts` (the six Sisters formations, the adjusted trio `kino00_70-g0` in `SISTER_ADJUSTED_FORMATIONS`, the five Yojimbo tiers, `MIRROR_ACT_I` = `kino01_72`, `MIRROR_ACT_II` = `nagi05_71`, `SISTER_LADDER`) |
| the bodies, rows, formations | `data/ffx/enemies/dark-aeons.ts` (four records and the dog; `zanmatoLevel` 5 on the four, the game's byte 4 plus 1), `dark-aeons-abilities.ts` (fourteen rows, the game's command records word for word), `dark-aeons-groups.ts` (twelve groups), `hidden-ffx.ts` (one barrel with Biran and Yenke's); items `master-sphere`, `teleport-sphere` in `data/ffx/items/spheres.ts` with records in `command-records/items.ts` |
| **the Dark AI** | `battle/ffx/ai/dark-aeons.ts` (the five scripts and the two hit hooks), `dark-aeons-rules.ts` (every constant with its source), `dark-aeons-seams.ts` (ids, the formation table, the registry status), registered in `ai/index.ts`; `battle/ffx/orders.ts` (the dog's order: the victim is the game's stream-4 pick, `extra.orderedAim`) |
| the party | `data/ffx/builds/mirror-aeons.ts` (preset: Yojimbo and the Sisters in, `yojimbo` and `sisters` fields, the gauges, 17 Phoenix Downs), `builds/endgame-aeons.ts` (the section 6.4 aeon-stat formula as a pure function) |
| **the heal** | `EnemyGroupDef.restoresAeonsOnEntry` (`battle/common/types.ts`), `restoreAeonsOnEntry` in `battle/ffx/line-up.ts`, one call in `battle/ffx/setup.ts`; set on the Act II groups with `restoresPartyOnEntry` |
| chapter and **the listing** | `data/chapter-mirror-aeons.ts` (no `experimental` flag), `chapter-meta-mirror-aeons.ts` (numeral XXVII); in `CHAPTERS` and `CHAPTER_IDS` (`encounters.ts`, `ListedChapterId`) and `CHAPTER_META` (`chapter-meta.ts`), out of `chapters-experiments.ts`; the card's plate alias (`app/screens/frontend/chapterGrid.ts` `BOARD_BACKDROP`: the scene key `mirror-aeons` is a code key, so the card and the plate paint Mushroom Rock Road's backdrop file); `data/art/strip-art.json` (two board masters); `story/registry.ts`; `learn/atlas/cites.ts`; `docs/audio/THEMES.md` (the XXVII row); `critic/runner/lib/sweep.mjs` (the sweep's chapter list: nineteen); `docs/CONTRACT-CHANGES.md` (the listing entry) |
| scene | `scenes/mirror-aeons.ts` (the Mushroom Rock Road stage with this chapter's enemy staging), the Cavern plate's look in `scenes/mushroom-rock-road.ts`; rows in `scenes/experiment-scenes.ts` and `engine/pyreflyCanon.ts`; one departure row (`dark-yojimbo`: the body stays) |
| story, guide | `story/scripts/mirror-aeons.ts`, `data/guides/mirror-aeons.ts` + `docs/mirror-aeons.ts` |
| **the advisor's line and its card** | `engine/tactics/mirror-aeons.ts` (the line: seven rules, each a named constant or switch, `LineOptions`), `engine/tactics/advisor-aeons.ts` + one early return in `advisor.ts` (no card on Yojimbo's or a Sister's menu), index and lookup lines |
| **the seam's HUD** | `app/screens/BattleScreenCutscenes.ts` (the beat's name on the battle root), `ui/common/cutscene.css` (one rule), `app/screens/BattleScreen.ts` (the HUD hidden across a plate link that restores the aeons) |
| the word | `app/screens/frontend/yojimboDoor.ts` and one row in `chapterDoors.ts` (still works: the word opens a listed chapter exactly as it opened the hidden one) |
| **the Pay ladder** | `engine/PayRows.ts` (pure: the engine's one Pay row becomes rows of round amounts and a Pay all row, and a Sister's order rows get short words) and one call in `engine/BattlePresenter.ts` `chooseCommand`, for a person's menu only: the auto strategy, the advisor's line and the bench keep the engine's rows and build their own Pay; tests `pay-rows.test.ts`, `pay-rows-presenter.test.ts` |
| contract | the `all-ko` trigger condition and `EnemyGroupDef.restoresAeonsOnEntry` in `battle/common/types.ts` (`docs/CONTRACT-CHANGES.md`, the chapter's entry) |
| research, plans, tools, tests | `research/ffx-mirror-aeons.md`, `docs/plans/ch-mirror-aeons-review.md`, **`docs/plans/ch-mirror-aeons-bench.md`**; `tools/mirror-aeons-bench.mjs`, `tools/mirror-aeons-proof.mjs`, `tools/mirror-aeons-smoke.mjs`; `tests/unit/chapters/mirror-aeons-{aeon-stats,ai,data,party,engine,dog,flow,chapter,seams,bench}.test.ts`, `tests/unit/yojimbo-door.test.ts`, `tests/unit/helpers/mirrorAeonsDrive.ts`, `mirrorAeonsBench.ts`; edited: the shared tests that enumerate chapters and the Evrae counter's class fixture (section 7) |

No source file added is over 400 lines (hard rule 7); `data/ffx/index.ts` is still **399** (its Biran and Yenke import was folded into the new barrel, so the next hidden FFX chapter joins `enemies/hidden-ffx.ts` and not the
index) and `engine/BattlePresenterDepartures.ts` is **399** (the next departure row needs a fold). One test file is over 400 lines (`yojimbo-door.test.ts`, 447), as many of the repository's are; `engine/tactics/advisor.ts`
(1,950 lines) was long before this lane and gained two lines.

## 3. The data, its sources and tags (rule 6: nothing invented)

**Every enemy number is the game's own**, read by the reverse-engineering session from the game's files: `research/re-ffx-yojimbo-sisters-feasibility.md` ("RE section n") for the records, loot, formations and rows, and
`research/re-ffx-dark-aeons.md` ("RE note section n") which re-reads them, adds the scripts, and corrects the first note in seven places (its section 8 item 9). `[bytes]` means read from the game's files and not run; `[run]` that RE
ran the script's bytecode in its interpreter. `tests/unit/chapters/mirror-aeons-data.test.ts` pins the data file to the first note field by field, and the fourteen command records to the two kernel fixtures **word for word**
(type, both flag words, damage class, rank, shatter, chance and duration bytes, the extra-status word); `mirror-aeons-ai.test.ts` pins the scripts rule by rule.

| Field | Value | Tag |
|---|---|---|
| The four records | Yojimbo 1,600,000 HP, STR 244 DEF 210 MAG 131 MDEF 144, AGI 243 LCK 114 EVA 0 ACC 255; Cindy 3,000,000, 175 / 223 / 171 / 105, 185 / 40 / 0 / 255; Sandy 2,500,000, 186 / 201 / 207 / 168, 201 / 80 / 100 / 255; Mindy 2,000,000, 148 / 187 / 248 / 132, 233 / 130 / 240 / 255; MP 999 each | `[bytes]` RE section 2, RE note 1.2 |
| Immunities, Threaten, Zanmato byte | 255 to Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Slow, Scan, Eject, Auto-Life, Doom; Threaten 0; Sensor, percentage damage, Life, CTB damage, Bribe by flag; **Zanmato byte 4, so `zanmatoLevel` 5** on the four bodies (the data's convention: the byte plus 1; the dog, a helper actor with byte 0, leaves it unset) | `[bytes]` RE sections 1 and 2, RE note 1.2; RE lane FFX-K section 2.4 |
| Rewards | no gil; AP 8,000 (Yojimbo) or 10,000 (each sister), 10,000 / 12,000 on an Overkill, threshold 99,999; one slot, Dark Matter or one time in eight a Master Sphere (x2 on an Overkill); the Steal pairs. **An Overkill is reachable here:** the engine's rule is the game's kernel (the killing action's whole damage to that target reaching the threshold, not its excess over the HP left); RE note 1.2 reads it as effectively unreachable | `[bytes]` RE section 2, RE note 1.3 |
| The fourteen rows | Razzia, Camisade, Passado (15 hits, Death 254), Calamity, Mega Graviton, Delta Attack (formula 15, power 80, 6 hits), Kozuka, Wakizashi (one, all), Zanmato (power 250), Daigoro's bite (Petrify, Poison), the dog's order (no damage), Sandy's and Cindy's Attack | `[bytes]` RE section 2, RE note 6.1 and the kernel fixtures |
| The eleven formations | battle ids, slot order (Mindy, Sandy, Cindy from slot 0), stage ids, launch flag words, Escape and Flee off | `[bytes]` RE section 3, RE note 2.1 |
| The starting gauges | every sister at 100 in the two trio formations; 0 in the other four and for Dark Yojimbo (no script writes them, so the record's 0 stands) | `[bytes]` `[run]` RE section 4.2, RE note 2.5 and 5.1 |
| **The scripts** | Dark Yojimbo: a full gauge is Zanmato on the whole front line; else one draw modulo 3 (Wakizashi on all, Kozuka on one random living, the dog's order); the tier's step (+6, +10, +16, +20, +26) is added after EVERY turn, Zanmato's included, so the gauge restarts at the step; +2 per hit taken. The Sisters: in the two trio formations with all three alive and every gauge 100, Cindy throws the Delta Attack (zeroing all three) and Sandy and Mindy take a basic move; else a full gauge is Mega Graviton (then 0); else a fair coin between two basic moves, +20 a turn; +5 per hit; no counters; a dead sister ends the Delta Attack for good. The dog takes no turns | `[bytes]` `[run]` RE note 4.2, 4.3, 4.4, 5.2, 5.3 |
| Dark Yojimbo's tiers | +6, +10, +16, +20, +26 a turn after every turn of his own, Zanmato's included; +2 per hit taken | `[bytes]` `[run]` RE note 4.2, 4.3 |
| The dog | untargetable, no turns, no part of the victory, bites with Daigoro's row (0x410B) on a living front-line character when ordered, Strength 244; **its other stats are placeholders no rule reads** (the record says HP 100, MP 1, accuracy 30) | `[bytes]` `[run]` RE note 1.4, 4.4; the hit event while it is untargetable was not run (RE note 8 item 4) |
| The Sphere ids | Master Sphere 0x2050, Teleport Sphere 0x2062 (also Return 0x2060, Friend 0x2061, Dark Matter 0x2035, Stamina Tonic 0x2043, Elixir 0x2008) | `[bytes]` (RE note 1.3 gives the same two the build had inferred) |

**Our own estimates, every one a named constant, in one place each:**

| What | Value | Where | Source of the reasoning |
|---|---|---|---|
| The party | Tidus, Yuna, Lulu on the field; every member at HP 9,999, MP 999, every other stat 255, Luck 60 | `data/ffx/builds/mirror-aeons.ts` | Jegged Stat Maxing (caps), GamerGuides ("250 to 255 by now"); Luck: no source gives a number, and the bench shows it is a cliff, not a dial (60 is the edge: 40 wins 32 percent, 20 wins 4) |
| The seats | **Lulu takes the third seat because of Dark Mindy**: her Evasion is 240, and a Luck-60 party's blades land 0 of 35 on her, while a spell never misses (GamerGuides and StrategyWiki both send a mage) | same | RE section 2 and the measurement (bench test) |
| The gear | Auto-Haste, Auto-Phoenix, Auto-Protect, Ribbon on all; Break Damage Limit on every weapon; First Strike on Tidus and Yuna | same | Jegged Best Armor; StrategyWiki's preparation list; the guides' assumption of Break Damage Limit |
| The aeons | nine: the five story aeons, Yojimbo and the three Sisters (Anima left out); rows derived from Yuna's stats at 600 battles by the section 6.4 formula (Cindy 43,827 HP, Sandy 35,862, Mindy 24,913, Yojimbo 19,646 on this Yuna) | `builds/endgame-aeons.ts` | `research/ffx-combat-core.md` section 6.4 `[verified: 3 sources]`; the function reproduces all 270 numbers of the three canonical blocks (a test) |
| **Yojimbo's starting compatibility** | **128: strongly indicated by the owner's saves, live confirmation pending** (the game's files hold no start value; the community also says 128). A fixed per-chapter value: a chain carries it (`yojimbo:compatibility`), nothing persists it across sessions (that would be save data) | `YOJIMBO_START_COMPATIBILITY` | RE lane FFX-K asks the chapter to say so where it gives the value; `[estimate]` until it is confirmed live |
| Yojimbo's hire answer | 2 (the third option, "to defeat the most powerful of enemies") | `YOJIMBO_HIRE_ANSWER` | Jegged Cavern; G08 section 3.5 |
| Gil | 1,500,000 (Pay draws on it; a person pays from the ladder, the advisor's line pays 100,000 a turn, `PAY_GIL`) | `ENDGAME_GIL` | StrategyWiki speaks of paying "upwards of 2 million" |
| **The Sisters' start motivation** | **50 each** (an estimate; RE marks it unsourced). It sets Combine powers' chance (200 plus motivation in RE's kernel: always from 56 up) and the order menu's rolls; a chain does not carry it | `SISTERS_START_MOTIVATION` | named estimate, not measured as a lever |
| **The aeons' start gauges** | the three Sisters **100** (their menu offers Combine powers only while all three bars are full, and the other seven orders that could fill a bar are not built); Yojimbo 0; the five story aeons keep Dream's End's | `SISTERS_START_GAUGE`, `YOJIMBO_START_GAUGE` | estimate; pinned in `mirror-aeons-party.test.ts` |
| **Phoenix Downs in the bag** | **17** (the main difficulty lever, set by the bench) | `ENDGAME_PHOENIX_DOWNS` | the bench (`docs/plans/ch-mirror-aeons-bench.md`); no source gives the endgame stock |
| **The two picks** | Act I the faithful **pair** `kino01_72` (Dark Mindy and Dark Sandy); Act II **tier 2** `nagi05_71` | `MIRROR_ACT_I`, `MIRROR_ACT_II` | the bench: three Act II tiers land in the band with the pair, tier 2 is RE's recommended spacing and avoids tier 1's unmodelled ambushed start |
| Staging | the enemies' spots and heights, the Mushroom Rock Road party slots, the road's daylight grade under the cavern plate | `scenes/mirror-aeons.ts` | framing only |
| Art, music | the aeons' own paintings for the Dark ones; two existing plates; existing cues (`boss-challenge`, then `boss-yojimbo`, the mountain's bed) | | Bailey's picks |

## 4. The difficulty, measured (the table and every sweep are in `docs/plans/ch-mirror-aeons-bench.md`)

**The target** (`docs/plans/ch-mirror-aeons-review.md` section 3; Bailey: "appropriate, not too easy, not too hard"): a full run of both acts with the advisor's line wins **about 70 percent of the time (60 to 80 accepted)**
and a careless line (the plain Attack on the first living enemy, no aeon, no potion) **mostly loses (under 20 percent)**; measured on the real engine, **never tuned by editing a boss row**. Levers: the party preset (Phoenix Downs,
Luck, the stat caps) and WHICH of the game's own formations each act uses.

**The result.** `MIRROR_ACT_I` = the faithful pair `kino01_72`, `MIRROR_ACT_II` = tier 2 `nagi05_71`, 17 Phoenix Downs, the heal between the acts:

| Line (whole chapter, 200 seeds, 17 Phoenix Downs) | Won |
|---|---|
| the advisor's line, **Pay ON (provisional until RE's Zanmato fix)** | **74 percent** (147 of 200; 294 of 400 on the sweep's seeds) |
| the competent line that **never pays Yojimbo and never sends him in (Pay OFF, final)** | **69 percent** (138 of 200) |
| Yojimbo sent in first and never paid (Pay OFF: his own free attacks only; he is dismissed at his first menu and the shield goes) | 20 percent (39 of 200) |
| a careless line | **0 of 200** |

Both honest lines are inside the band, and the Pay-on line is the one RE's fix can move. Act II alone is easy (97 percent) and the chain is hard (about 84 percent of the runs that survive Act I) because the chain arrives with the
Phoenix Downs Act I spent: the heal gives back HP, MP and the aeons, **not the bag**.

**Act II re-benched on RE's follow-up (2026-10-16; the rows above were measured at `d8fa5b69`):** Act II alone, the three tiers, 200 seeds, 17 Phoenix Downs: the advisor's line (Pay on) **97, 97, 100 percent**; Yojimbo sent in and never paid (his free attacks
only) 28, 28, 23; never sent in 96, 97, 100; careless 0. **Identical to the rows above to the seed**: the group Zanmato does not move Act II, because a Pay at compatibility 128 against a Zanmato byte of 4 buys no Zanmato without a full Overdrive gauge (the line paid
749 times over the 600 fights and never with a full gauge; the highest gauge at a Pay was 90) and the first-target kill already ended an Act II fight when Dark Yojimbo was the only legal foe. **Pay is final for Act II. Act I and the whole chapter are NOT re-run:** they wait for RE's Delta Attack
fix (the player's Delta becomes group-type and hits every Dark Sister, which makes Act I easier), and the Phoenix Down stock (17) and the two picks stay PRELIMINARY until then. `node --experimental-transform-types tools/mirror-aeons-bench.mjs --act2 --seeds 200 --lines advisor,nopay,noyojimbo,careless`.

**What was set aside and why** (all measured, 200 seeds): the **faithful trio** `kino00_70` wins **0 of 200** (the Delta Attack is the third enemy action of the battle, its second has no shield because Mindy and Sandy kill a
lone aeon first, and every special move is a one-shot on a 9,999-HP member); the **trio with its gauges at 0** (OUR adjustment, registered as `kino00_70-g0`, **not shipped and named nowhere the player reads**) also **0 of 200**;
the **single sisters** are too easy (the careless line wins Sandy alone and Cindy alone); **tier 1 and tier 3** are in the band too (Pay on 69 and 77 percent) and are the one-constant alternatives.

**The levers, on the pick:** each Phoenix Down is worth 6 to 11 points near 17 (16 gives 66, 17 gives 74, 18 gives 79 on 400 seeds); Luck and a share of the stat caps are cliffs, not dials (Luck 40: 32 percent; the caps at 95 percent:
5 percent). The advisor's seven rules are each load-bearing (the ablations: taking away Cheer costs 52 points, the Auto-Life upkeep 26, the early shield 19, the early heal 19, the spell heals 70). **Questions for Bailey (his
word is "appropriate"):** is 74 (Pay on) or 69 (Pay off) about right, or does he want the cavern harder (tier 3, or 16 Phoenix Downs) or the whole chapter gentler (18)? Each is one constant.

## 5. RE's engine, what the chapter uses of it, and what it still owes

**How the build owns them** (RE's handoff section 2.1; the chapter's build is the example): the aeons in `aeons`, plus `yojimbo: { compatibility, hireAnswer }` and `sisters: { motivation: { cindy, sandy, mindy } }`, or
`buildBattle` throws. **The commands:** Pay `{ kind: 'ability', id: 'yojimbo-pay', targets: [], gilSpent: N }`; orders `sister-order-<name>`; Dismiss the ordinary one; the summon `{ kind: 'summon', id: 'cindy' }` brings all three
(one row for three). **The foes' Zanmato byte:** `zanmatoLevel` = the byte plus 1, which for the Dark Aeons is 5 (set and pinned). The gil and the compatibility ride in `state.flags` and are carried through the chain by
`carryPartyForward`.

**What the chapter does NOT depend on:** RE's two caveats of 2026-10-15 are both closed (the seven orders and the group Zanmato landed: `4256d209a`, `afda2d451`). The advisor's line still uses only Combine powers, Dismiss, Pay and the ordinary rows. **One caveat is open:** the player's Delta Attack row is
single-enemy (6 hits, `[estimate]`) while the game's record is group-type; RE's last fix makes it hit every Dark Sister, and Act I's numbers wait for it.

**The card.** RE's open item 12: the generic advisor knows no Pay or order rows and printed Dismiss as the best move on these aeons' turns (seen in the browser on the Sisters' first menu). The card is now kept off any menu that
carries Pay's id or an order's (`engine/tactics/advisor-aeons.ts`, the one early return in `buildAdvisorView`, a test). The chapter's own line still plays those turns for the Auto strategy and the bench.

**Still owed by RE or the driver:** (a) **the Delta Attack fix** (then the Act I and whole-chapter bench, and the Phoenix Down stock and the picks re-set); (b) whether the advisor's line should use another order, and whether the Sisters should start at 0 (the bench's levers now that the orders work: the driver's calls); (c) Combine powers is `[R]` (read from the code, not run; RE's open item 2); (d) the order of Zanmato and
Auto-Life inside a hit (RE note 8.3) and the dog's hit event while it is untargetable (8.4), both inherited from the first note; (e) Yojimbo's compatibility live reading (128 stays labelled until then); (f) **the Pay amount screen**
(the ladder of rows is built as a stop-gap; the screen Bailey wants is his pick, rule 9; section 9, item 1).

## 6. Disagreements between the guides and the files (the files win; the full table is `research/ffx-mirror-aeons.md` section 6)

C2 Zanmato is a damage hit (power 250, cap 99,999) that strips Auto-Life, not an instant death (StrategyWiki); C3 Kozuka lands the four Breaks and Slow and **no Curse** (StrategyWiki); C4 Delta Attack is MAG-based, six hits, capped at
99,999 each, not a flat 99,999 (StrategyWiki); C5 only the first Yojimbo tier starts ambushed (StrategyWiki says always); C9 "Mindy first" is open to magic only. **C1 is closed:** the dog bites, and RE's note writes up the dog's own
script (4.4). Nothing in the chapter contradicts Jegged, who is the guide's primary source. **The two RE notes against each other:** the second corrects the first in seven places (its section 8 item 9). The chapter's rows are the
game's command records word for word, so they already carry the corrected reading where a row models one (Cindy's 0x412B is a plain physical attack whose record carries the cleanse flag and the buff list: it dispels Shell, Protect, Reflect,
the four Nuls, Regen and Haste, and our row lists no inflicted status; Zanmato, Delta Attack and Razzia carry the cleanse flag with the Auto-Life word); the rest are the AI's. **Open in the notes, so open here:** whether Auto-Life
survives a cleanse row's KO (the order of the cleanse and the death check inside a hit was not traced: RE note 8 item 3); the engine follows its existing kernel.

## 7. Tests, the bench, the suite

(Filled in at the end of the pass: the chapter suites, the door suites, the goldens and the collateral batch.)

## 8. Browser proof

**The proof tool** is `tools/mirror-aeons-proof.mjs` (headless Playwright, real keys at every menu, the advisor's line between them; never the Chrome extension or the built-in pane), run against one production build of the final source
(`BASE_PATH=/`, `vite preview`). `--scenario full` plays the whole chapter and `--scenario retry` loses Act II on purpose. Every check is printed as `check.<name>`; the exit code is 1 on a failed one. **Three runs on the final build, all exit 0:**

| Run | Viewport | Result |
|---|---|---|
| `--scenario full`, seed 2 | desktop 1600 x 900 | **29 of 29 checks**; best time 2:46, one attempt, the clear recorded |
| `--scenario full`, seed 2 | phone 390 x 844, touch | **29 of 29 checks**; the same run on the phone's layout |
| `--scenario retry`, seed 5 | desktop | **22 of 22 checks**: Act II lost on purpose, the results screen reads Defeat, RETRY re-opens Act II on Dark Yojimbo and his dog with a whole party and whole aeons |

**What the full run proves** (each is a check): the board has nineteen cards and reads "of 19"; the cursor reaches the chapter's card with the arrow keys; party prep opens from Enter; the intro plays first (the pre scene, eight lines on the road);
Act I is the pair with both gauges at 0 and the party whole; Yuna's Summon list holds Yojimbo and Cindy beside the five aeons; **Yuna calls the Sisters with the keys** and all three stand on the field; a Sister's menu has **Combine lit** beside
Dismiss; **the Combine plays the Delta Attack** (Cindy throws it, the pair is hurt); Act I is won and **the seam plays** with the road's HUD fully off the screen behind the white-out and back whole after the cut; **Act II opens on a whole party and
whole aeons** (the heal; the gil and the compatibility carried); Dark Yojimbo and his dog are the enemies; the keys take over when his blade is filled; **Yuna calls Yojimbo with the keys, sees the Pay ladder (Pay 1,000, 10,000, 100,000, 1,000,000,
Pay all) and pays 100,000 from it: the party's gil goes down by exactly 100,000**; a Dark Zanmato lands on the aeon (named on the top bar while it plays); Act II is won and the post scene plays in the cavern; the results read CLEARED / Victory /
NEW BEST and lead back to the board; the board then shows the card's ribbon, the best time and "1 of 19", and the save holds the record under the chapter's id; no console errors and no 4xx or 5xx responses.

**Notes.** (1) A run can lose, because the chapter is a fight (the bench puts the advisor's line at about three runs in four): two earlier runs lost Act I or Act II and the tool was run again on another seed; the runs above are the ones on the final build.
(2) The tool takes the keys at a blade of 76 and calls Yojimbo at Yuna's first menu from there; waiting for 88 (the advisor's own line) lost a party on a phone run, and 66 sent the aeon in so early it was struck down before the blow. (3) **Frames** (desktop,
phone and the retry) are in `docs/screenshots/ch-mirror-aeons/`: the card, party prep, the intro, Act I's first menu, the summon list, the Sisters' Combine, the Delta Attack, the seam (four of its twelve), Act II's first menu, the Pay ladder, the Dark
Zanmato, the post scene, the results, the board with the ribbon, and the retry's defeat and re-opened Act II. (4) The phone shows the Pay ladder as a two-column grid, with the amount of the highlighted row in the help line under it.

## 9. Open items and questions

1. **The Pay amount screen (the first thing a player will meet).** The engine's Pay row is a template whose `gilSpent` is 0 ("the screen fills the payment", RE section 2.3), and a payment of nothing is the game's "he leaves, compatibility
   -20" branch; the HUD has no amount screen, and a one-row Aeon group runs straight through to that row, so before the ladder **choosing Pay with the keys paid nothing and Yojimbo left** (seen in the browser). **What is built, to make the chapter
   playable end to end overnight:** the presenter turns that one row into a ladder in the same Aeon group, one row per round amount (1,000, 10,000, 100,000, 1,000,000) the party can pay and a last row, Pay all (the gil left): `engine/PayRows.ts`, no new
   screen and no engine change. **It is provisional.** A new screen is a thing Bailey will feel, so the options he has not seen are still his to pick (AGENTS.md rule 9): this ladder, **a stepper like the Overdrive picker**, or a **fixed payment per chapter**.
   Each is one small change in that file or one screen. The amounts are ours (the roll adds four points for each doubling of the gil from 8 gil: `kernel/yojimbo.ts`); nothing in the engine, the advisor's line or the bench reads them.
2. **RE's two fixes** (section 5): re-run the Pay-on rows when they land and re-pick the Phoenix Down stock if the numbers move.
3. **Dark gauges are not drawn.** Dark Yojimbo's blade and the sisters' bars only exist in the engine and the callout; the HUD's gauge widget is Chapter IX's. Drawing them is a perceivable change (mockup first).
4. **Yojimbo's compatibility and the Sisters' motivation** (section 3): 128 is strongly indicated by the owner's saves, live confirmation pending; 50 is an estimate.
5. **Dark paintings** of the four aeons (red and black), the two backdrops (both existing plates; the Mushroom Rock Road plate is a provisional stand-in), a **cavern grade** (the palette is applied once at the scene's entry, so the
   cavern is lit with the road's daylight), a Dark Yojimbo departure picture, and the **music** (no source names these fights' cues) are Bailey's picks. The chapter is **listed** on the board (his word, relayed 2026-10-15).
6. **The word.** `yojimbo` is built; the brief's `zanmato` cannot be typed on the board (its Z is confirm and a first letter is never claimed). Making a first-letter confirm safe is a change to the board's shared input; say so if
   Bailey wants `zanmato`.
7. **The pause screen's hero art** `pause/ch27-mirror-aeons` is not made (the fallback is Yuna's portrait, `portraits/yuna.png`).
8. **Barring the matching aeon** is possible (RE 9.5: the game's own lock is the aeon's availability flag set to 0 for Yuna) but is an addition, not the Dark Aeons' rule, and needs Bailey's yes. The chapter does not do it.
9. **Not modelled:** the gear drop, the chase that splits the sisters in the guides (the chapter picks a formation instead), the **ambushed start of tier 1** (the one reason tier 1 is not the pick), the Dark Aeons' dialogue, the Save Sphere
   between the five tiers and the five tiers as five fights (the chapter fights one), the start-type roll the game gives the Sisters' formations (RE note 2.2: 12.5 percent preemptive; the bench starts every fight normal), and RE's
   reaction path for the dog's bite (the bite is carried out by the order row through `orders.ts`, the trial Yojimbo's mechanism, with the game's picker for the victim).
10. **The faithful trio is out of reach of the advisor's line** (0 of 200): a human better than the line is not locked out of it by data (`kino00_70` is registered), but it is not an Act. If Bailey wants a trio, the way down is the
    adjusted trio (OUR adjustment, also 0 of 200 today) or a different Act I; both need his yes (rule 10).
11. **Disk:** the production build of the proof is the lane tree's one `dist` (10 GB, regenerable); it is left in place for the driver to look at or delete.

## 10. Merge hot spots (the driver)

**The listing's footprint.** Besides the files below, listing a chapter moves every test that counts the board: about forty files changed their eighteen to nineteen (the door suites, `frontend-chapter-*`, `board-thumbs` (twelve FFX cards now), `chapter-select-c`,
`chapter-numbers`, `chapter-meta`, the save fixtures, `strategy-guide`, `critic-instruments-legibility`, `exp-leblanc`, the experiment-card tests that hand a card in (now twenty) and the per-chapter order tests that read the last positions of `CHAPTERS`). **A
lane that lists another chapter will touch the same lines.** The card is Chapter XXVII and sorts last in the FFX group; the hidden chapters numbered 19 to 26 (Leblanc's preview, the FFX-2 experiment, Sinspawn Gui, Fayth, the Tourist Trap, Besaid, Biran and Yenke, Angra Mainyu) would sort BEFORE it
if listed, and take their own numerals. `story/registry.ts` is 399 lines (the next chapter's rows need a fold). **The save schema is untouched** (`SAVE_VERSION` 1; `tests/unit/save-mirror-aeons-listed.test.ts` loads a real save written before the listing, and the record lands in `SaveData.chapters['mirror-aeons']`).

`encounters.ts`, `chapters-experiments.ts`, `chapter-meta.ts`, `chapterDoors.ts`, `scenes/experiment-scenes.ts`, `scenes/mushroom-rock-road.ts` (the plate table), `engine/pyreflyCanon.ts`, `engine/BattlePresenterDepartures.ts` (399 lines),
`engine/tactics/{index,lookup,advisor}.ts`, `data/guides/{index,docs/index}.ts`, `data/ffx/index.ts` (399 lines), `data/ffx/command-records/{enemies,items}.ts`, `data/ffx/items/spheres.ts`, `battle/ffx/setup.ts`, `battle/ffx/orders.ts`,
`battle/ffx/ai/index.ts`, `battle/ffx/line-up.ts`, `battle/ffx/triggers.ts`, `battle/common/types.ts`, `app/screens/BattleScreen.ts`, `app/screens/BattleScreenCutscenes.ts`, `ui/common/cutscene.css`, `docs/CONTRACT-CHANGES.md` and
`CHANGELOG.md` (this lane adds no changelog entry; it is the driver's at the merge, and `NOW.md` is the driver's too); the tests `chapter-doors`, `chapter-numbers`, `data-ffx-command-records` (three counts and the status list),
`tests/fixtures/parity/ffx/evrae-gaze-classes.json` (the Biran and Yenke lane edits it too: both add lines), `presenter-departures`, `audio-music-batch2-2026-10-12`, `party-stature-chapters`, `exp-fayth`, `gagazet-door`,
`sinspawn-gui-scene`. **The parallel hidden-chapter lanes add lines in the same places** (the hidden chapter numbers 24 to 27 and the door words are already distinct). RE's lane is merged in; its branch is a fast-forward of what
is here.

Tip: see `git log -1 ch-mirror-aeons` (this note is updated in the last commit of the pass).
