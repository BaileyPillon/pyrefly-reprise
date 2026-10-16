# Mirror Aeons: the Dark Magus Sisters and Dark Yojimbo against Yuna's own Magus Sisters and Yojimbo (a hidden FFX chapter, number 27, "Dark Mirror")

**Status (2026-10-15, phase 2, built for Bailey, via the release driver): a FIGHT now, not a scaffold; not merged and not deployed.** Built, tested and proved in a production build in a browser. Branch `ch-mirror-aeons` (from
`origin/r49-rc` f939b87f), in a worktree of its own (a sibling folder of the main tree), with the reverse-engineering session's (RE's) work merged: its two notes (`origin/re-ffx-yojimbo-sisters-feasibility` 8892f8f6, the rows,
the formations and the aeon summon rules; `origin/re-ffx-dark-aeons` 36c3cdb8, the five scripts, the tier ladder and the mirror rule) and **lane FFX-K's engine at its FINAL tip, `origin/re-parity-ffx-yojimbo-sisters`
d8fa5b69** (Yuna's Yojimbo and Magus Sisters in the engine; merged in two steps, 42dc0f547 and then d8fa5b69, which added only its handoff note and corrected test comments). Tip: see the last line of this file.

**What phase 2 added, in one list** (details below): the Dark Aeons' AI as code (RE's note, every number from it); Yuna's Yojimbo and Sisters in the party build, both summonable in both acts; **the heal between the acts**
(the driver's delegated pick: the party and every aeon whole at Act II); **the difficulty measured and set** (the faithful pair into tier 2 with 17 Phoenix Downs: the advisor wins about three runs in four, a careless line none;
`docs/plans/ch-mirror-aeons-bench.md`); the seam's HUD kept off the screen behind the white-out; the advisor's card kept off the two aeons' menus; the chapter's words, guide and advisor's line follow the new fight; the
bench, the real-key proof and the smoke tool.

**Two caveats from RE that shape the numbers (the driver's message, 2026-10-15; RE is fixing both on its branch as fast-forwards):**
1. **Zanmato.** Today a landed Zanmato of Yuna's Yojimbo kills only the FIRST target and ignores Death resistance, while every Dark Aeon is immune to Slice and Death and Zanmato's Slice effect is still untraced (RE's open
   item 7). **Every Act II number that lets Yojimbo be paid is therefore provisional until RE's Zanmato fix lands**: the bench carries Pay ON beside Pay OFF and labels the Pay-on rows (section 4). When RE says the fix is in,
   the Pay-on rows are to be re-run (`node --experimental-transform-types tools/mirror-aeons-bench.mjs --lines advisor,nopay,noyojimbo ...`).
2. **The Sisters' orders.** Only **Combine powers** and **Dismiss** work; the seven other orders are listed by the engine but not carried out yet (RE is decoding them). **Nothing here depends on them**: the advisor's line plays
   Combine powers and Dismiss on a Sister's menu, the bench never uses another order, and the preset starts the Sisters with full gauges because without the other orders nothing else can fill them (RE's open item 1).

**Authority:** Bailey, 2026-10-15, verbatim: "we definitely need an awesome chapter built with yojimbo AND magus sisters that would be so awesome. the most epic encounter ever!!!!!!!!!", then "i like the mirror match but
make the difficulty appropriate not too easy not too hard", "ok let's do each mirror match" and "I'll go with all of your recommendations". The driver's decisions: FFX only, hidden behind a typed word, number 27, two acts,
art provisional, listing it on the board waits for Bailey's word; and, delegated to the driver, **the party and the aeons are restored between the acts**.

**Game case: FFX only** (AGENTS.md rule 14). The Dark Aeons, Yuna's Yojimbo and Magus Sisters and CTB are FFX's (both RE notes say so); FFX-2's Yojimbo ("Tourist Trap") is another record. The shared plumbing (one registry
row, one door row, one scene row, one trigger condition, a data barrel, one set-up call, one optional group field, one early return in the advisor) is "both" in kind (CHK-020), additive and inert for every other chapter; the
goldens are listed in section 7.

**The mirror is faithful (RE note section 9, 2026-10-15).** Yuna's own Yojimbo and her three Magus Sisters are summonable in BOTH acts, against their dark twins: the game bars nothing. RE's first reading (section 2.2 of its
note) took the formations' unmapped call `ct_7126` for a lock on the matching aeon; section 9 withdraws it. The call sets one byte that only keeps the aeon's loaded model data from being released when it is dismissed or wiped
(a memory pin), shown in the game's own machine code (28 triggers, 840 gate checks, 3,000 summon worlds each way, zero differences); the game's real lock, script call 0x703B, is used by none of the eleven formations.
The evidence is **proved** at the usability gate and in the summon kernel and **not yet seen on screen** (the game was not run: RE 9.6). The chapter therefore bars nothing. Barring the matching aeon would be an addition for
balance or fiction (RE 9.5) and needs Bailey's yes (rule 10).

## 1. What Bailey should see first

1. On the chapter board type **`yojimbo`** (Y, O, J, I, M, B, O; none is a board key but the M, which is `select` and is claimed by the word as a later letter). No card appears; the board still says "of 18".
2. Party prep says **EXP** (header "EXP · MIRROR AEONS"): Tidus, Yuna and Lulu on the field, Auron, Wakka, Kimahri and Rikku on the bench. Its tip: two sisters, no joint attack, every fallen member costs a Phoenix Down, so heal
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
6. **Do not judge yet:** (a) **Pay**: the HUD has no payment picker, so its Pay row pays nothing and Yojimbo leaves (the advisor's line pays 100,000 gil directly: section 9, item 1); (b) the Dark aeons' Overdrive gauges
   are not drawn (the HUD's gauge widget exists only for Chapter IX's Yojimbo); (c) every Act II number that leans on a Pay (RE's Zanmato caveat above).

## 2. What was built

| Area | Files (all under `src/` unless noted) |
|---|---|
| ids and the formation tables | `data/ffx/mirror-aeons-ids.ts` (the six Sisters formations, the adjusted trio `kino00_70-g0` in `SISTER_ADJUSTED_FORMATIONS`, the five Yojimbo tiers, `MIRROR_ACT_I` = `kino01_72`, `MIRROR_ACT_II` = `nagi05_71`, `SISTER_LADDER`) |
| the bodies, rows, formations | `data/ffx/enemies/dark-aeons.ts` (four records and the dog; `zanmatoLevel` 5 on the four, the game's byte 4 plus 1), `dark-aeons-abilities.ts` (fourteen rows, the game's command records word for word), `dark-aeons-groups.ts` (twelve groups), `hidden-ffx.ts` (one barrel with Biran and Yenke's); items `master-sphere`, `teleport-sphere` in `data/ffx/items/spheres.ts` with records in `command-records/items.ts` |
| **the Dark AI** | `battle/ffx/ai/dark-aeons.ts` (the five scripts and the two hit hooks), `dark-aeons-rules.ts` (every constant with its source), `dark-aeons-seams.ts` (ids, the formation table, the registry status), registered in `ai/index.ts`; `battle/ffx/orders.ts` (the dog's order: the victim is the game's stream-4 pick, `extra.orderedAim`) |
| the party | `data/ffx/builds/mirror-aeons.ts` (preset: Yojimbo and the Sisters in, `yojimbo` and `sisters` fields, the gauges, 17 Phoenix Downs), `builds/endgame-aeons.ts` (the section 6.4 aeon-stat formula as a pure function) |
| **the heal** | `EnemyGroupDef.restoresAeonsOnEntry` (`battle/common/types.ts`), `restoreAeonsOnEntry` in `battle/ffx/line-up.ts`, one call in `battle/ffx/setup.ts`; set on the Act II groups with `restoresPartyOnEntry` |
| chapter | `data/chapter-mirror-aeons.ts`, `chapter-meta-mirror-aeons.ts`; one line each in `chapters-experiments.ts`, `chapter-meta.ts`, `encounters.ts` |
| scene | `scenes/mirror-aeons.ts` (the Mushroom Rock Road stage with this chapter's enemy staging), the Cavern plate's look in `scenes/mushroom-rock-road.ts`; rows in `scenes/experiment-scenes.ts` and `engine/pyreflyCanon.ts`; one departure row (`dark-yojimbo`: the body stays) |
| story, guide | `story/scripts/mirror-aeons.ts`, `data/guides/mirror-aeons.ts` + `docs/mirror-aeons.ts` |
| **the advisor's line and its card** | `engine/tactics/mirror-aeons.ts` (the line: seven rules, each a named constant or switch, `LineOptions`), `engine/tactics/advisor-aeons.ts` + one early return in `advisor.ts` (no card on Yojimbo's or a Sister's menu), index and lookup lines |
| **the seam's HUD** | `app/screens/BattleScreenCutscenes.ts` (the beat's name on the battle root), `ui/common/cutscene.css` (one rule), `app/screens/BattleScreen.ts` (the HUD hidden across a plate link that restores the aeons) |
| the word | `app/screens/frontend/yojimboDoor.ts` and one row in `chapterDoors.ts` |
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
| Gil | 1,500,000 (Pay draws on it; the advisor's line pays 100,000 a turn, `PAY_GIL`) | `ENDGAME_GIL` | StrategyWiki speaks of paying "upwards of 2 million" |
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

**What the chapter does NOT depend on**, by RE's two caveats: (1) the Sisters' seven other orders (not carried out; the menu lists them greyed with a reason); (2) a landed Zanmato that spares what it should (the Pay-off lines
never roll one). The advisor's line uses Combine powers, Dismiss, Pay (provisional), and the ordinary rows.

**The card.** RE's open item 12: the generic advisor knows no Pay or order rows and printed Dismiss as the best move on these aeons' turns (seen in the browser on the Sisters' first menu). The card is now kept off any menu that
carries Pay's id or an order's (`engine/tactics/advisor-aeons.ts`, the one early return in `buildAdvisorView`, a test). The chapter's own line still plays those turns for the Auto strategy and the bench.

**Still owed by RE or the driver:** (a) the two Zanmato fixes above (then re-run the Pay-on rows); (b) the seven orders; (c) Combine powers is `[R]` (read from the code, not run; RE's open item 2); (d) the order of Zanmato and
Auto-Life inside a hit (RE note 8.3) and the dog's hit event while it is untargetable (8.4), both inherited from the first note; (e) Yojimbo's compatibility live reading (128 stays labelled until then); (f) **the Pay amount screen**
(a new screen: mockup first, rule 9; section 9, item 1).

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

(Filled in at the end of the pass: the real-key proof on a production build, desktop and phone.)

## 9. Open items and questions

1. **The Pay amount screen (the first thing a player will meet).** Yojimbo's menu is Pay and Dismiss, and the engine's Pay row is a template whose `gilSpent` is 0 ("the screen fills the payment", RE section 2.3). The HUD has no
   payment screen, so **choosing Pay with the keys pays nothing: Yojimbo leaves and his compatibility drops by 20**; only the advisor's line (the Auto strategy and the bench) pays, 100,000 a turn. A payment screen is a new screen:
   **a mockup and Bailey's yes come first (AGENTS.md rule 9)**. Options to show him: one row per round amount ("Pay 10,000", "Pay 100,000", "Pay all"), a stepper like the Overdrive picker, or a fixed payment per chapter.
2. **RE's two fixes** (section 5): re-run the Pay-on rows when they land and re-pick the Phoenix Down stock if the numbers move.
3. **Dark gauges are not drawn.** Dark Yojimbo's blade and the sisters' bars only exist in the engine and the callout; the HUD's gauge widget is Chapter IX's. Drawing them is a perceivable change (mockup first).
4. **Yojimbo's compatibility and the Sisters' motivation** (section 3): 128 is strongly indicated by the owner's saves, live confirmation pending; 50 is an estimate.
5. **Dark paintings** of the four aeons (red and black), the two backdrops (both existing plates; the Mushroom Rock Road plate is a provisional stand-in), a **cavern grade** (the palette is applied once at the scene's entry, so the
   cavern is lit with the road's daylight), a Dark Yojimbo departure picture, and the **music** (no source names these fights' cues) are Bailey's picks. Listing the chapter on the board waits for his word.
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

`encounters.ts`, `chapters-experiments.ts`, `chapter-meta.ts`, `chapterDoors.ts`, `scenes/experiment-scenes.ts`, `scenes/mushroom-rock-road.ts` (the plate table), `engine/pyreflyCanon.ts`, `engine/BattlePresenterDepartures.ts` (399 lines),
`engine/tactics/{index,lookup,advisor}.ts`, `data/guides/{index,docs/index}.ts`, `data/ffx/index.ts` (399 lines), `data/ffx/command-records/{enemies,items}.ts`, `data/ffx/items/spheres.ts`, `battle/ffx/setup.ts`, `battle/ffx/orders.ts`,
`battle/ffx/ai/index.ts`, `battle/ffx/line-up.ts`, `battle/ffx/triggers.ts`, `battle/common/types.ts`, `app/screens/BattleScreen.ts`, `app/screens/BattleScreenCutscenes.ts`, `ui/common/cutscene.css`, `docs/CONTRACT-CHANGES.md` and
`CHANGELOG.md` (this lane adds no changelog entry; it is the driver's at the merge, and `NOW.md` is the driver's too); the tests `chapter-doors`, `chapter-numbers`, `data-ffx-command-records` (three counts and the status list),
`tests/fixtures/parity/ffx/evrae-gaze-classes.json` (the Biran and Yenke lane edits it too: both add lines), `presenter-departures`, `audio-music-batch2-2026-10-12`, `party-stature-chapters`, `exp-fayth`, `gagazet-door`,
`sinspawn-gui-scene`. **The parallel hidden-chapter lanes add lines in the same places** (the hidden chapter numbers 24 to 27 and the door words are already distinct). RE's lane is merged in; its branch is a fast-forward of what
is here.

Tip: see `git log -1 ch-mirror-aeons` (this note is updated in the last commit of the pass).
