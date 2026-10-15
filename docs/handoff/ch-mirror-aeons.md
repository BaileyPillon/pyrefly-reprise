# Mirror Aeons: the Dark Magus Sisters and Dark Yojimbo against Yuna's own Magus Sisters and Yojimbo (a hidden FFX chapter, number 27)

**Status (2026-10-15, built for Bailey, via the release driver): a SCAFFOLD that opens, plays and ends; not merged and not deployed.** Built, tested and proved in a production build in a browser. Branch `ch-mirror-aeons` (from
`origin/r49-rc` f939b87f), in a worktree of its own (a sibling folder of the main tree), with the reverse-engineering session's two notes merged: `origin/re-ffx-yojimbo-sisters-feasibility` 8892f8f6 (the rows, the formations and
the aeon summon rules) and `origin/re-ffx-dark-aeons` 36c3cdb8 (the five scripts, the tier ladder and the mirror rule). Tip: see the last line of this file.

**What is NOT in, and so what is not yet a fight:** the Dark aeons' AI and Yuna's Yojimbo and Magus Sisters in the engine are the reverse-engineering session's (RE's) work and **this lane wrote neither**. The Dark AI is
*described* in RE's note (`research/re-ffx-dark-aeons.md`: all five scripts read from the game's bytes and run in a small interpreter) but is not code yet, so the Dark aeons play the engine's fallback, a plain Attack on the
party. RE's summon engine (lane FFX-K, `origin/re-parity-ffx-yojimbo-sisters`, f081ec1a1 when this was written, **final tip pending**) is not merged here, so Yuna's Yojimbo and Sisters can be summoned today only as single
ordinary aeons (no Pay, no orders, no Combine powers). **So the chapter opens, plays and ends, but it is far too easy, and its difficulty cannot be set or judged yet** (section 4).

**Authority:** Bailey, 2026-10-15, verbatim: "we definitely need an awesome chapter built with yojimbo AND magus sisters that would be so awesome. the most epic encounter ever!!!!!!!!!" and then "keep going full speed ahead,
i'll go with all of your recommendations i like the mirror match but make the difficulty appropriate not too easy not too hard". The driver's decisions: FFX only, hidden behind a typed word, number 27, two acts, art
provisional, listing it on the board waits for Bailey's word.

**Game case: FFX only** (AGENTS.md rule 14). The Dark Aeons, Yuna's Yojimbo and Magus Sisters and CTB are FFX's (both RE notes say so); FFX-2's Yojimbo ("Tourist Trap") is another record. The shared plumbing (one registry
row, one door row, one scene row, one trigger condition, a data barrel, one set-up call) is "both" (CHK-020), additive and inert for every other chapter; the goldens are listed in section 7.

**The mirror is faithful (RE note section 9, 2026-10-15).** Yuna's own Yojimbo and her three Magus Sisters are summonable in BOTH acts, against their dark twins: the game bars nothing. RE's first reading (section 2.2 of its
note) took the formations' unmapped call `ct_7126` for a lock on the matching aeon; section 9 withdraws it. The call sets one byte that only keeps the aeon's loaded model data from being released when it is dismissed or wiped
(a memory pin), shown in the game's own machine code (28 triggers, 840 gate checks, 3,000 summon worlds each way, zero differences); the game's real lock, script call 0x703B, is used by none of the eleven formations.
The evidence is **proved** at the usability gate and in the summon kernel and **not yet seen on screen** (the game was not run: RE 9.6). The chapter therefore bars nothing. Barring the matching aeon would be an addition for
balance or fiction (RE 9.5) and needs Bailey's yes (rule 10).

## 1. What Bailey should see first

1. On the chapter board type **`yojimbo`** (Y, O, J, I, M, B, O; none is a board key but the M, which is `select` and is claimed by the word as a later letter). No card appears; the board still says "of 18".
2. Party prep says **EXP** (header "EXP · MIRROR AEONS"): Tidus, Yuna and Lulu on the field, Auron, Wakka, Kimahri and Rikku on the bench; its tip says to call one of Yuna's aeons in first and to use spells on Mindy.
3. The opening plays on **Mushroom Rock Road** (eight lines, our own words); the first menu has the party against **Dark Mindy, Dark Sandy and Dark Cindy**, every Overdrive gauge at 100, the guide open. Tidus's first tip is
   Quick Hit on Cindy; **Yuna's tip on her own turn is the summon** (the advisor sends an aeon in whenever a Dark Aeon's gauge is full). The turn list at that menu shows six party turns before any sister's (the preset is Hasted, AGI 255, with First Strike on Tidus and Yuna).
4. Beat the sisters: the **seam** (the sisters go with the light, three plain lines, a white-out, "Deep in the cavern, a blade was already drawn.") puts the **Cavern of the Stolen Fayth**'s plate on the stage and Act II opens on
   **Dark Yojimbo** (his dog beside him, untargetable). Win, and the post scene (eight lines) plays in the cavern.
5. Look at: the two **provisional** backdrops (existing plates), the Dark aeons drawn with the aeons' own paintings (the possessed aeons' convention; red-and-black Dark paintings are Bailey's pick), the music (existing cues by
   reference), the guide card and page.
6. **Do not judge yet:** the fight's difficulty, what the sisters and Yojimbo do on their turns, and how Yuna's Yojimbo and Sisters play. All three wait for RE (section 5).

## 2. What was built

| Area | Files (all under `src/` unless noted) |
|---|---|
| ids and the two formation tables | `data/ffx/mirror-aeons-ids.ts` (the six Sisters formations and five Yojimbo tiers, `MIRROR_ACT_I`, `MIRROR_ACT_II`, `SISTER_LADDER`) |
| the bodies, rows, formations | `data/ffx/enemies/dark-aeons.ts` (four records and the dog), `dark-aeons-abilities.ts` (fourteen rows, the game's command records word for word), `dark-aeons-groups.ts` (eleven groups), `hidden-ffx.ts` (one barrel with Biran and Yenke's); items `master-sphere`, `teleport-sphere` in `data/ffx/items/spheres.ts` with records in `command-records/items.ts` |
| the party | `data/ffx/builds/mirror-aeons.ts` (preset), `builds/endgame-aeons.ts` (the section 6.4 aeon-stat formula as a pure function) |
| chapter | `data/chapter-mirror-aeons.ts`, `chapter-meta-mirror-aeons.ts`; one line each in `chapters-experiments.ts`, `chapter-meta.ts`, `encounters.ts` |
| scene | `scenes/mirror-aeons.ts` (the Mushroom Rock Road stage with this chapter's enemy staging), the Cavern plate's look in `scenes/mushroom-rock-road.ts`; rows in `scenes/experiment-scenes.ts` and `engine/pyreflyCanon.ts`; one departure row (`dark-yojimbo`: the body stays) |
| story, guide, advisor | `story/scripts/mirror-aeons.ts`, `data/guides/mirror-aeons.ts` + `docs/mirror-aeons.ts`, `engine/tactics/mirror-aeons.ts` (+ index and lookup lines) |
| the word | `app/screens/frontend/yojimboDoor.ts` and one row in `chapterDoors.ts` |
| seams (RE's) | `battle/ffx/ai/dark-aeons-seams.ts` (five `TODO(RE)` markers), `dark-aeons-setup.ts` (called from `battle/ffx/setup.ts`) |
| contract | the `all-ko` trigger condition (`{ type: 'all-ko'; ids: CombatantId[] }`) in `battle/common/types.ts` and `battle/ffx/triggers.ts` (`docs/CONTRACT-CHANGES.md`) |
| research, plan, tools, tests | `research/ffx-mirror-aeons.md`, `docs/plans/ch-mirror-aeons-review.md`; `tools/mirror-aeons-smoke.mjs`; `tests/unit/chapters/mirror-aeons-{aeon-stats,data,party,engine,dog,flow,chapter,seams,bench}.test.ts`, `tests/unit/yojimbo-door.test.ts`, `tests/unit/helpers/mirrorAeonsDrive.ts`; edited: the shared tests that enumerate chapters and the Evrae counter's class fixture (section 7) |

No source file added is over 400 lines (hard rule 7); `data/ffx/index.ts` is still **399** (its Biran and Yenke import was folded into the new barrel, so the next hidden FFX chapter joins `enemies/hidden-ffx.ts` and not the
index) and `engine/BattlePresenterDepartures.ts` is **399** (the next departure row needs a fold). One test file is over 400 lines (`yojimbo-door.test.ts`, 447), as many of the repository's are.

## 3. The data, its sources and tags (rule 6: nothing invented)

**Every enemy number is the game's own**, read by the reverse-engineering session from the game's files: `research/re-ffx-yojimbo-sisters-feasibility.md` ("RE section n") for the records, loot, formations and rows, and
`research/re-ffx-dark-aeons.md` ("RE note section n") which re-reads them, adds the scripts, and corrects the first note in seven places (its section 8 item 9). `[bytes]` means read from the game's files and not run; `[run]` that RE
ran the script's bytecode in its interpreter. `tests/unit/chapters/mirror-aeons-data.test.ts` pins the data file to the first note field by field, and the fourteen command records to the two kernel fixtures **word for word**
(type, both flag words, damage class, rank, shatter, chance and duration bytes, the extra-status word).

| Field | Value | Tag |
|---|---|---|
| The four records | Yojimbo 1,600,000 HP, STR 244 DEF 210 MAG 131 MDEF 144, AGI 243 LCK 114 EVA 0 ACC 255; Cindy 3,000,000, 175 / 223 / 171 / 105, 185 / 40 / 0 / 255; Sandy 2,500,000, 186 / 201 / 207 / 168, 201 / 80 / 100 / 255; Mindy 2,000,000, 148 / 187 / 248 / 132, 233 / 130 / 240 / 255; MP 999 each | `[bytes]` RE section 2, RE note 1.2 |
| Immunities, Threaten, Zanmato byte | 255 to Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Slow, Scan, Eject, Auto-Life, Doom; Threaten 0; Sensor, percentage damage, Life, CTB damage, Bribe by flag; Zanmato byte 4 | `[bytes]` RE sections 1 and 2, RE note 1.2 |
| Rewards | no gil; AP 8,000 (Yojimbo) or 10,000 (each sister), 10,000 / 12,000 on an Overkill, threshold 99,999; one slot, Dark Matter or one time in eight a Master Sphere (x2 on an Overkill); the Steal pairs. **An Overkill is reachable here:** the engine's rule is the game's kernel (the killing action's whole damage to that target reaching the threshold, not its excess over the HP left), and the winning smoke run had one; RE note 1.2 reads it as effectively unreachable | `[bytes]` RE section 2, RE note 1.3 |
| The fourteen rows | Razzia, Camisade, Passado (15 hits, Death 254), Calamity, Mega Graviton, Delta Attack (formula 15, power 80, 6 hits), Kozuka, Wakizashi (one, all), Zanmato (power 250), Daigoro's bite (Petrify, Poison), the dog's order (no damage), Sandy's and Cindy's Attack | `[bytes]` RE section 2, RE note 6.1 and the kernel fixtures |
| The eleven formations | battle ids, slot order (Mindy, Sandy, Cindy from slot 0), stage ids, launch flag words, Escape and Flee off | `[bytes]` RE section 3, RE note 2.1 |
| The starting gauges | every sister at 100 in the two trio formations; 0 in the other four and for Dark Yojimbo (no script writes them, so the record's 0 stands) | `[bytes]` `[run]` RE section 4.2, RE note 2.5 and 5.1 |
| Dark Yojimbo's tiers | +6, +10, +16, +20, +26 a turn after every turn of his own, Zanmato's included; +2 per hit taken | `[bytes]` `[run]` RE note 4.2, 4.3 |
| The dog | untargetable, no turns, no part of the victory, bites with Daigoro's row (0x410B) on a living front-line character when ordered, Strength 244; **its other stats are placeholders no rule reads** (the record says HP 100, MP 1, accuracy 30) | `[bytes]` `[run]` RE note 1.4, 4.4; the hit event while it is untargetable was not run (RE note 8 item 4) |
| The Sphere ids | Master Sphere 0x2050, Teleport Sphere 0x2062 (also Return 0x2060, Friend 0x2061, Dark Matter 0x2035, Stamina Tonic 0x2043, Elixir 0x2008) | **were `[inferred]`; now `[bytes]`** (RE note 1.3 gives the same two the build had inferred) |

**Our own estimates, every one a named constant, in one place each:**

| What | Value | Where | Source of the reasoning |
|---|---|---|---|
| The party | Tidus, Yuna, Lulu on the field; every member at HP 9,999, MP 999, every other stat 255, Luck 60 | `data/ffx/builds/mirror-aeons.ts` | Jegged Stat Maxing (caps), GamerGuides ("250 to 255 by now"); Luck: no source gives a number |
| The seats | **Lulu takes the third seat because of Dark Mindy**: her Evasion is 240, and a Luck-60 party's blades land 0 of 35 on her (section 4); a spell never misses (GamerGuides and StrategyWiki both send a mage) | same | RE section 2 and the measurement |
| The gear | Auto-Haste, Auto-Phoenix, Auto-Protect, Ribbon on all; Break Damage Limit on every weapon; First Strike on Tidus and Yuna | same | Jegged Best Armor; StrategyWiki's preparation list; the guides' assumption of Break Damage Limit |
| The aeons | nine: the five story aeons, Yojimbo and the three Sisters (Anima left out); rows derived from Yuna's stats at 600 battles by the section 6.4 formula (Cindy 43,827 HP, Sandy 35,862, Mindy 24,913, Yojimbo 19,646 on this Yuna) | `builds/endgame-aeons.ts` | `research/ffx-combat-core.md` section 6.4 `[verified: 3 sources]`; the function reproduces all 270 numbers of the three canonical blocks (a test) |
| **Yojimbo's starting compatibility** | **128: strongly indicated by the owner's saves, live confirmation pending** (the game's files hold no start value; the community also says 128) | `YOJIMBO_START_COMPATIBILITY` | RE's lane FFX-K asks the chapter to say so where it gives the value; `[estimate]` until it is confirmed live |
| Yojimbo's hire answer | 2 (the third option, "to defeat the most powerful of enemies") | `YOJIMBO_HIRE_ANSWER` | Jegged Cavern; G08 section 3.5 |
| Gil | 1,500,000 (Pay draws on it) | `ENDGAME_GIL` | StrategyWiki speaks of paying "upwards of 2 million" |
| The two picks | Act I the faithful trio `kino00_70`; Act II tier 3 `nagi05_72` | `MIRROR_ACT_I`, `MIRROR_ACT_II` | the mirror Bailey asked for, and a middle rung chosen before RE's second note; **a pick among the game's own fights, pending the bench** (section 4) |
| Staging | the enemies' spots and heights, the Mushroom Rock Road party slots, the road's daylight grade under the cavern plate | `scenes/mirror-aeons.ts` | framing only |
| Art, music | the aeons' own paintings for the Dark ones; two existing plates; existing cues (`boss-challenge`, then `boss-yojimbo`, the mountain's bed) | | Bailey's picks |

**Not yet sourced, needed when RE's engine lands:** each Magus Sister's **start motivation** (RE marks it unsourced; the chapter must pick a value and call it an estimate; section 5).

## 4. The difficulty: the plan, what is measured today, what is owed

**The target** (`docs/plans/ch-mirror-aeons-review.md` section 3; Bailey: "appropriate, not too easy, not too hard"): with the party preset and the advisor's line a full run of both acts wins **about 70 percent of the time (60 to
80 accepted)** and a careless line (the plain Attack on the first living enemy, no aeon, no potion) **mostly loses (under 20 percent)**; measured on the real engine by `tests/unit/chapters/mirror-aeons-bench.test.ts`, 100 seeds
a line; **never tuned by editing a boss row**.

**The only two levers.**

1. **The party preset** (`data/ffx/builds/mirror-aeons.ts`, all estimates), turned one at a time in the order the bench turns them: Luck (`ENDGAME_LUCK` 60), the fraction of the stat caps, Anima in or out of the aeons, the First Strike
   seats, the gil Pay draws on, the aeons' starting gauges.
2. **Which of the game's own formations and tiers each act uses**, a pick among real fights and not a number of ours. RE's note adds the enemy's STR, MAG and HP among the knobs that exist in the data (6.3); **this chapter turns none of them**.

**Act I, the Dark Magus Sisters** (easiest to hardest by what RE's note says about each opening, RE note 2.6 and 5.4):

| Option | HP | Start gauges | What happens first | Status |
|---|---|---|---|---|
| Singles `kino05_71` Mindy, `kino05_70` Sandy, `kino01_71` Cindy | 2.0M, 2.5M, 3.0M | 0 | five basic turns, then Mega Graviton on her 6th turn (tick 45) | game formations; the ladder's low rungs |
| **The faithful pair** `kino01_72` (Mindy, Sandy) | 4.5M together | 0, 0 | no Delta Attack; both reach Mega Graviton on their 6th turn (tick 45), then every 6 turns | a game formation; **RE's recommended fit** for "not too easy, not too hard"; first fallback |
| **The trio at gauge 0** (the trio's battle id with the three gauges written 0 after setup) | 7.5M | 0, 0, 0 | five rounds of basic turns, then Cindy's Delta Attack at tick 45, then every 6 rounds | **OUR adjustment, not a game formation; it must be disclosed (guide, handoff, changelog) if it is ever used.** Not built: it would be a copy of the trio's row in `DARK_FORMATIONS` and the setup. A smaller departure than scaling the Sisters' damage (RE note 2.6) |
| **The faithful trio** `kino00_70` / `kino01_70` | 7.5M | 100, 100, 100 | Mindy and Sandy attack, then **Delta Attack is the third enemy action of the battle**, inside the first 9 ticks, in the 87.5 percent of starts that are normal or ambushed (a preemptive start, 12.5 percent, lets the party act first; RE note 2.2, 2.6) | **the scaffold's pick**: the three-against-three mirror Bailey asked for, and the hardest rung |

**Act II, Dark Yojimbo** (1,600,000 HP in every tier; only the fill differs; RE note 2.6, 4.5; a turn of his is 9 ticks; "player actions" means one aeon acting every 24 ticks, each action reaching him for +2):

| Tier | Fill a turn | First Zanmato (no hits) | With the player's hits | Reading |
|---|---:|---|---|---|
| 1 `nagi05_70` | +6 | his 18th turn (tick 153) | after about 5 actions, then every 5 to 6 | gentlest; the only tier that also writes the ambushed start; the safe fallback |
| 2 `nagi05_71` | +10 | his 11th turn (tick 90) | after 3, then every 4 | **RE's recommendation** (about four player actions between Zanmatos: the first spacing at which a player can read the gauge and plan) |
| 3 `nagi05_72` | +16 | his 8th turn (tick 63) | after 2, then every 2 | **the scaffold's pick**, made before RE's note |

Tiers 4 and 5 (+20, +26) leave one to two actions and are out of the plan (the bench still plays them as rungs). The tier sets only the Zanmato spacing; the other two thirds of his turns (Wakizashi on all, Kozuka on one, the
dog's bite) are the same in every tier. **The decision to take:** move `MIRROR_ACT_II` to `nagi05_71` per RE (one constant and the one line of `mirror-aeons-data.test.ts` that pins the two picks; the Act II frames would change) or keep tier 3 until
the bench has spoken.

**Why the faithful trio is the risk.** At the game's own numbers every damaging move except Passado and Mega Graviton is an instant KO on a player-side aeon (RE note 6.3), so the fight is decided by who acts first and by what an aeon
is sent in to absorb. The preset's answer is Haste, First Strike on Tidus and Yuna, and Yuna's first turn as the summon (the first menu's turn list shows six party turns before any sister); whether that survives the opener is
**the first thing the real ladder will show**. If the trio is outside the band the pick moves down the ladder (the pair, then the singles) before any party number moves; the trio at gauge 0 is the other way down, with its
disclosure, and **which of the two comes first is the driver's and Bailey's call**.

**Measured today, and it is about reach and not difficulty (the engine's hit rule is the game's):** with the preset, a blade of Tidus lands **0 of 35 on Dark Mindy** (Evasion 240), 30 of 35 on Sandy (100), **35 of 35 on Cindy** (0) and
18 of 40 on Dark Yojimbo (Luck 114: "dodges many physical attacks", Jegged); Lulu's spell lands 35 of 35 on Mindy (the bench's own sampling, five seeds; the lane's first probe read 0 of 55 on Mindy). That is why the advisor sends
blades to Cindy and Sandy and spells to Mindy (the guides' "take Mindy first" is only open to magic, Overdrives and aeons: digest C9). **Under the fallback AI** (a plain Attack from the enemies, so it says nothing about the real
fight; 12 seeds a line through the bench's own helpers, reproduced 2026-10-15 with a throwaway script; the committed bench prints a 3-seed version): the advisor's line wins 12 of 12 on every rung of both ladders (the trio about 135
decisions, a Yojimbo tier about 50, **identical in all five tiers because nothing reads the fill yet**); the careless line wins 0 of 12 on the trio, the pair and Mindy alone, 12 of 12 on Sandy alone and on Cindy alone, and 6 of 12
on every Yojimbo tier. **Too easy, for the reason above.**

**Owed, and who owes it:** (1) RE's scripts and summon rules (section 5), after which the real ladder runs by itself (`describe.skipIf` on `darkAeonsSeamStatus()`) and prints the ladder with the pick the plan's rule gives (`pickRung`).
(2) **The bench plays each rung alone from a fresh party, while the target is the full run of both acts**, and `pickRung` ranks the rungs of both acts in one list: whoever runs the real bench should pick one rung per act and
then measure the chain of the two picks (the flow test already plays the chain through the real chain loop, on one seed). (3) The party's start motivation for the Sisters and the final compatibility value (section 5). (4) **Whether
the party is restored at the seam:** today nothing heals between the acts (the chain carries the party over as Act I left it, and a defeat in the cavern retries it from that state), while in the game the two quests are far apart and its
Save Sphere heals between the Yojimbo tiers; a restore would be a new rule, so it needs Bailey's yes (rule 10), and the bench should measure with and without it. (5) Bailey's reaction to the picks, because "appropriate" is his word.

## 5. The seams for RE (what to write, where it plugs in)

`battle/ffx/ai/dark-aeons-seams.ts` is the one place that says what exists (`darkAeonsSeamStatus()` answers from the live registry); `tests/unit/chapters/mirror-aeons-seams.test.ts` has a block per seam that skips until the seam is
filled and then runs by itself (11 blocks skip today). Five `TODO(RE)` markers in that file name the seams.

| Seam (marker) | Today | What RE writes, or what changes at the merge |
|---|---|---|
| **The four scripts and the dog** (`TODO(RE) 1`; ids `dark-sister-cindy`, `-sandy`, `-mindy`, `dark-yojimbo`, `dark-daigoro`) | every enemy's `aiScriptId` is set; **nothing is registered**, so the engine's fallback plays a plain Attack | `registerAiScript` for each, imported in `ai/index.ts`, branching on the flag `dark.battleId`. The rule lists are in `research/re-ffx-dark-aeons.md` (`origin/re-ffx-dark-aeons` 36c3cdb8): the Sisters 5.2 (the trio test makes Cindy throw Delta Attack once all three gauges are 100; else a full gauge is Mega Graviton; else a coin between two basic moves, +20 a turn, +5 per hit), Dark Yojimbo 4.2 and 4.3 (a full gauge is Zanmato; else one draw modulo 3: Wakizashi on all, Kozuka on a random living character, or the dog's order; the tier's step is added after every turn, Zanmato's included; +2 per hit), the dog 4.4 (the bite on the order when its counter test holds). The note's section 8 item 9 lists its seven corrections to the first note |
| **The starting state** | `ai/dark-aeons-setup.ts` writes the gauges (100 per sister in the trio, else 0; 0 for Dark Yojimbo), the battle id and the tier fill as flags, and marks the dog `ordersOnly` and `nonCombatant` | the scripts' own init may replace it; the numbers are the same (note 2.5, 5.1) |
| **Dark Yojimbo's tier fill and his callout** (`TODO(RE) 2`) | published as the flag `dark.gaugePerTurn`; the story's callout `dark-yojimbo-ready` (the `overdrive` trigger on his gauge) fires only when a script write emits the gauge change | the script reads the flag; the callout then works by itself |
| **The dog's order and bite** | the order row (0x4086, no damage: `extra.ordersActor`, `orderedAbility`, the trial Yojimbo's mechanism) and the bite row (0x410B) are on the enemies; `mirror-aeons-dog.test.ts` proves the chain with a test-only script that does nothing but order | the dog's script (note 4.4): Daigoro's row on a living front-line character when `isCounterattackAllowed()` holds |
| **Tier 1's ambushed start** (`TODO(RE) 5`) | not written | changes the intro only (note 2.2, 4.1) |
| **Yuna's Yojimbo and Magus Sisters in the engine** (`TODO(RE) 3` and `4`; lane FFX-K) | in the build with the catalogue's rows and their own stats; the Sisters arrive one at a time through the ordinary summon; the two named values nothing reads | below |

**What lane FFX-K asks of a build** (read from its diff at f081ec1a1; not merged here, not run here; the tip is not final). A build that lists `yojimbo` in `aeons` must give `FFXPartyBuild.yojimbo = { compatibility,
hireAnswer }`, and one that lists all three Sisters must give `FFXPartyBuild.sisters = { motivation: { cindy, sandy, mindy } }`, **or `buildBattle` throws**. So the merge needs one edit to `data/ffx/builds/mirror-aeons.ts`:
`compatibility` 128 (**strongly indicated by the owner's saves, live confirmation pending**, which RE's contract asks the chapter to say where it gives the value; RE's contract text adds that the owner's own save files read 128 in
every slot from 1 to 84, before recruitment), `hireAnswer` 2, and a start `motivation` for each Sister, 0 to 100, which RE marks **unsourced**: the chapter must pick a value and label it an estimate, and the bench then measures it as one more party lever. The Sisters then
come as ONE summon (the aeon list offers a single Cindy, only while all three can come, and brings all three; `state.aeonIds`), so the four "optional aeon through the real summon" tests in `mirror-aeons-engine.test.ts` need a look (the Sandy and Mindy entries
go) and the advisor's fodder order meets Cindy first. A dry-run merge of that tip onto this branch (git's merge-tree; nothing written to the tree): **one conflict, `docs/CONTRACT-CHANGES.md`**, where both sides add an entry at
the top (keep both); `battle/common/types.ts` and `battle/ffx/setup.ts` merge cleanly.

## 6. Disagreements between the guides and the files (the files win; the full table is `research/ffx-mirror-aeons.md` section 6)

C2 Zanmato is a damage hit (power 250, cap 99,999) that strips Auto-Life, not an instant death (StrategyWiki); C3 Kozuka lands the four Breaks and Slow and **no Curse** (StrategyWiki); C4 Delta Attack is MAG-based, six hits, capped at
99,999 each, not a flat 99,999 (StrategyWiki); C5 only the first Yojimbo tier starts ambushed (StrategyWiki says always); C9 "Mindy first" is open to magic only. **C1 is closed:** the dog bites, and RE's note now writes up the dog's own
script (4.4). Nothing in the chapter contradicts Jegged, who is the guide's primary source. **The two RE notes against each other:** the second corrects the first in seven places (its section 8 item 9). The chapter's rows are the
game's command records word for word, so they already carry the corrected reading where a row models one (Cindy's 0x412B is a plain physical attack whose record carries the cleanse flag and the buff list: it dispels Shell, Protect, Reflect,
the four Nuls, Regen and Haste, and our row lists no inflicted status; Zanmato, Delta Attack and Razzia carry the cleanse flag with the Auto-Life word); the rest are the AI's. **Open in the notes, so open here:** whether Auto-Life
survives a cleanse row's KO (the order of the cleanse and the death check inside a hit was not traced: RE note 8 item 3); the engine follows its existing kernel.

## 7. Tests, the bench, the suite

- **The chapter's own suites** (nine files, **119 tests: 106 pass, 13 skip**; re-run on the merged tree, 2026-10-15): `aeon-stats` 8 (the formula against the three canonical blocks, 270 numbers, and against the first RE note's quoted
  last-tier minima for the four optional aeons), `data` 28 (records, loot, eleven formations, fourteen rows against the fixtures, the battle layer's copies), `party` 11, `engine` 17 (both acts' opening state, the four optional aeons
  through the real summon, the dog, the `all-ko` seam on every fall order, a lone sister, never in Act II), `dog` 2 (with a test-only stand-in script that does nothing but order, Dark Yojimbo's order row makes the dog bite a party
  member with the bite row; the order itself deals nothing), `flow` 7 (the real chain loop, the real presenter and the advisor's line against fake ports: two acts, no results screen between them, the seam once, each act's cue, the
  spoils paid together, Act II the retry checkpoint, a defeat in the cavern retries the cavern), `chapter` 24 (registration, scene, store, story, guide, advisor), `seams` 14 (3 run, **11 skipped until RE's work lands**), `bench`
  8 (6 run, **2 skipped**: the harness, the reach measurement, the fallback smoke).
- **The door suites** (all green): `yojimbo-door` 22 (the real `Input`, the real board and title, every sibling word in both orders, the rejected `zanmato` and its control), `chapter-doors` 10 (ten words), `chapter-numbers` 3, and the
  other nine doors' suites, which also meet the new word: `gagazet` 22, `angra` 22, `daigoro` 19, `exp-leblanc` 44, `fayth` 18, `ff7-secret` 15, `ffx2-experiment` 33, `mushroom` 29, `valefor` 22.
- **The shared tests this chapter edited** (all green): `data-ffx-command-records` 19 (506 / 504 / 2, and 19 known status differences for the extra-word and cleanse bits the kernel reads from the record), `presenter-departures` 11 (the
  kind count is 19), `audio-music-batch2-2026-10-12` 19 (the chapter's row; `boss-challenge` has four owners), `party-stature-chapters` 5, `exp-fayth` 13 (the scene side table), `sinspawn-gui-scene` 5 (the Cavern plate has no masked band).
- **Together: 27 files, 437 tests pass, 13 skip** (the door and shared batch is 18 files, 331 tests). `node node_modules/typescript/bin/tsc --noEmit` clean on the merged tree; `node tools/orphans.mjs`: none of this chapter's modules is listed
  (the list is the repository's own old orphans).
- **Collateral, run in this pass (a risk-based subset, 57 files and 1,298 tests pass, 1 file skipped by its own switch):** the three engine goldens (`ffx-engine-golden` 18, the 18 listed FFX chapters over two seeds, `ff7-golden` 3, `ffx2-atb-golden` 6: **no digest moved**); the tests that enumerate every shipped record, ability, item or enemy, the registries and the music and guide tables (a batch of 45 files, 1,065 tests: `data-ffx-index`, `data-ffx-enemies`, `ffx-unread-riders`, `ffx-overdrive-*`, `ffx-statuses`, `late-aeon-rows`, `spellfx-registry`, `chk023-runtime-proofs`, `guide-status-immunity`, `strategy-guide`, `chapter-meta*`, `story-triggers`, `tactics-lookup`, `trigger-commands`, `audio-cue-reachability`, `audio-music-batch1` and `elevenlabs`, the other hidden chapters' own suites and more), `ui-ffx-guide-folded-scenes` 13, `guide-doc` 35, `data-reward-items-resolve` 20, `natus-bench` 5, `exp-leblanc` 33. **One collateral failure was found and fixed:** `re-parity-ai-evrae` wants the Evrae counter's class table (`tests/fixtures/parity/ffx/evrae-gaze-classes.json`, numbers only) to hold every shipped record, and the chapter's 15 new ones (the two Spheres and the Dark Aeons' thirteen rows) were missing, the same failure that caught the Biran and Yenke lane; the fixture gains them, each class read from the game's command table by the formula-byte rule (formula 1 is class 2, formula 3 is class 1, the rest 0), and the test passes (27). **Under the shared machine's load three advisor suites timed out at the default 15 seconds** (`advisor-floor` 9, `advisor-note` 1, `advisor-menu` 3 failures, each a test that ran past the limit); with a 240-second limit all 73 tests pass, and they iterate the 18 listed chapters, not this hidden one.
- **The full unit suite was NOT run in this pass.** No record of a result from the lane's earlier full-suite run was found (only its temporary folders), and a second attempt in this pass was stopped because the shared machine was saturated by other lanes' runs; it is owed before this branch merges to main or before any push of main (AGENTS.md, Done means).

## 8. Browser proof

Run on 2026-10-15 on a production build of this tree (`vite build` with `BASE_PATH=/`, run from PowerShell: a Git Bash shell turns a bare `/` into its own install path; one `dist` in the lane's worktree, bundle
`index-DsbxSuhe.js`; every source file is older than the build, and the only edits since are comments, one test title and the smoke tool itself), served by `vite preview` on :5541 (stopped by its port afterwards), with the committed tool
`tools/mirror-aeons-smoke.mjs`: headless Chromium from node, real keys, seed 7, never the built-in pane. **A first attempt in the default software-GL mode did not reach Act I's first menu inside the script's 120-second wait (the
scene is too heavy for it; no console errors or 404s up to there); the tool's usage line asks for the real GPU (`PYREFLY_BROWSER=gpu`), and the three runs below used it.** Every run: **zero console errors, zero 4xx or 5xx responses**. To repeat them: build with `BASE_PATH=/` from PowerShell, `vite preview --port 5541`, then `PYREFLY_BROWSER=gpu node tools/mirror-aeons-smoke.mjs --base
http://127.0.0.1:5541/ --stop win` (add `--touch --w 390 --h 844 --tag phone --stop link2` for the phone and `--seam --tag seam --stop link2` for the seam), and stop the preview server by its port afterwards.

- **Desktop 1600x900, from the board to the results: PASS (2 min 18 s).** The board has 18 cards, none for the chapter, "0 of 18 beaten" (`desk-0-board`). Typing `yojimbo` opens party prep, and it holds after the last letter
  (`desk-1-party-prep`). The opening plays by keyboard (`desk-2-pre-scene-sisters`). Act I's first menu: Dark Mindy 2,000,000, Dark Sandy 2,500,000 and Dark Cindy 3,000,000 HP, **every gauge at 100**, the published battle id 14,417,990
  (0x00DC0046, `kino00_70`), Tidus, Yuna and Lulu on the field and four on the bench, the guide open, no placeholder figure (`desk-3a-act-i-menu-clear`). The advisor's line at skip speed won Act I and **Act II began**: Dark Yojimbo at
  1,600,000 HP and gauge 0 with his dog (battle id 28,180,552, the fill 16 a turn: tier 3), the same three on the field, and **the party carried over as Act I left it** (Tidus 2,354, Yuna 4,999 and Lulu 5,199 of 9,999 at that menu:
  nothing heals between the acts) (`desk-5-act-ii-first-menu`). Act II was won with the advisor's line, the post scene played (its first frame is the bare cavern plate, so none is kept), then the results: Victory in 1:19, AP 40,000 (the
  38,000 base of three sisters at 10,000 and Dark Yojimbo at 8,000, plus one Overkill's 2,000), Gil 0, Master Sphere x2 and Dark Matter x3 (`desk-7-results`).
- **A phone, 390x844 touch, to Act II's first menu: PASS (2 min 17 s).** The same checks; party prep (`phone-1-party-prep`), Act I's first menu with the first-time card gone (`phone-3a-act-i-menu-clear`), Act II's first menu
  (`phone-5-act-ii-first-menu`).
- **The seam, with each sister set to 1 HP at the start so Act I is short and plays at normal speed: PASS (2 min 10 s).** Five seam frames were taken and two are kept: the sisters going with the light (`seam-4-seam-2`) and the
  caption over the white-out (`seam-4-seam-4`). Act II then began with Dark Yojimbo and his dog.
- **Earlier in the lane** the first proof runs found two defects, both fixed before this pass: the party-prep tip overflowed its card on the phone (it is now two sentences) and the opening drew a black screen (the scene's key is not a plate; the opening now names the road's plate). In this pass the pause screen also read "Battle 1 of 2" and the objective "Send all three sisters home" in Act I (the frame is not kept).
- **Not exercised in a browser:** a loss and its retry (pinned in `mirror-aeons-flow.test.ts` through the real chain loop), the pause screen's chapter tab, a win by a line other than the advisor's.
- **Frames kept, each looked at, under `docs/screenshots/ch-mirror-aeons/`:** 1600x900 `desk-0-board`, `desk-1-party-prep`, `desk-2-pre-scene-sisters`, `desk-3a-act-i-menu-clear`, `seam-4-seam-2`, `seam-4-seam-4`,
  `desk-5-act-ii-first-menu`, `desk-7-results`; 390x844 `phone-1-party-prep`, `phone-3a-act-i-menu-clear`, `phone-5-act-ii-first-menu` (all `.jpg`; the tool writes them as `<tag>-<name>.jpg`). The frames of the lane's first
  proof run were replaced by these, which come from the runs above.

## 9. Open items and questions

1. **RE's work** (section 5), then the bench, then the two picks and the preset's numbers (section 4). Nothing about difficulty is final. **Questions for the driver or Bailey:** move Act II to tier 2 as RE recommends? which comes first
   under the trio, the pair or the trio at gauge 0 (our adjustment, disclosed)? is the party restored between the acts (a new rule; today it is not)?
2. **Yojimbo's compatibility and the Sisters' motivation** (sections 3 and 5): 128 is strongly indicated by the owner's saves, live confirmation pending; the Sisters' start motivation is unsourced and needs a labelled estimate when RE's
   engine lands.
3. **Dark paintings** of the four aeons (red and black), the two backdrops (both existing plates; the Mushroom Rock Road plate is a provisional stand-in), a **cavern grade** (the palette is applied once at the scene's entry, so the
   cavern is lit with the road's daylight), a Dark Yojimbo departure picture, and the **music** (no source names these fights' cues) are Bailey's picks. Listing the chapter on the board waits for his word.
4. **The word.** `yojimbo` is built; the brief's `zanmato` cannot be typed on the board (its Z is confirm and a first letter is never claimed). Making a first-letter confirm safe is a change to the board's shared input; say so if
   Bailey wants `zanmato`.
5. **The pause screen's hero art** `pause/ch27-mirror-aeons` is not made (the fallback is Yuna's portrait, `portraits/yuna.png`).
6. **Barring the matching aeon** is possible (RE 9.5: the game's own lock is the aeon's availability flag set to 0 for Yuna) but is an addition, not the Dark Aeons' rule, and needs Bailey's yes. The chapter does not do it.
7. **Not modelled:** the gear drop, the chase that splits the sisters in the guides (the chapter picks a formation instead), the ambushed start of tier 1, the Dark Aeons' dialogue, the Save Sphere between the five tiers and the five tiers as
   five fights (the chapter fights one; making it five would multiply Act II by five), the start-type roll the game gives the Sisters' formations (RE note 2.2: 12.5 percent preemptive; the bench starts every fight normal).
8. **What the frames show that is not this chapter's to fix (reported, not changed):** the Act I HUD (the guide card, the advisor's tip, the turn list) stays up behind the seam's white-out, so the tip still reads "Quick Hit -> Dark Cindy"
   until Act II's first menu; the first-time coach card holds each act's first menu until Enter, as in every first fight.
9. **Disk:** the production build of the proof is the lane tree's one `dist` (10 GB, regenerable); it was left in place for the driver to look at or delete.

## 10. Merge hot spots (the driver)

`encounters.ts`, `chapters-experiments.ts`, `chapter-meta.ts`, `chapterDoors.ts`, `scenes/experiment-scenes.ts`, `scenes/mushroom-rock-road.ts` (the plate table), `engine/pyreflyCanon.ts`, `engine/BattlePresenterDepartures.ts` (399 lines),
`engine/tactics/{index,lookup}.ts`, `data/guides/{index,docs/index}.ts`, `data/ffx/index.ts` (399 lines), `data/ffx/command-records/{enemies,items}.ts`, `data/ffx/items/spheres.ts`, `battle/ffx/setup.ts`, `battle/ffx/triggers.ts`,
`battle/common/types.ts`, `docs/CONTRACT-CHANGES.md` and `CHANGELOG.md` (this lane adds no changelog entry; it is the driver's at the merge, and `NOW.md` is the driver's too); the tests `chapter-doors`, `chapter-numbers`,
`data-ffx-command-records` (three counts and the status list), `tests/fixtures/parity/ffx/evrae-gaze-classes.json` (the Biran and Yenke lane edits it too: both add lines), `presenter-departures`, `audio-music-batch2-2026-10-12`, `party-stature-chapters`, `exp-fayth`, `gagazet-door`, `sinspawn-gui-scene`. **The parallel hidden-chapter lanes
add lines in the same places** (the hidden chapter numbers 24 to 27 and the door words are already distinct). **Merging RE's engine** (section 5) also needs the build edit described there.

Tip: code, tests and data at 1bde58276 (the last commit to touch a source file or a test input; before it 282e0b99a, the comment pass, then the merge of RE's second note, 196a52493, on top of the scaffold's seven commits, the last of which is 39e12c32c); the plan's updates are 89fd32944 and 80096e734; the commit that adds this file and the frames follows them and is the branch tip (`git log -1 ch-mirror-aeons`).
