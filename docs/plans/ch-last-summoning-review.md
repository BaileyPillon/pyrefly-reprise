# Paper preflight: The Last Summoning, hidden FFX chapter 28 (branch `ch-last-summoning`)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15). `node tools/critic-plan.mjs --paths ...` classes this work **DEEP** (the chapter registry, the FFX engine's AI table, the chain loop, the shared
combat-core types, the presenter's summon beat, a scene row and the board's door table are shared systems; obligations live + focused + deep; nothing here deploys). Written 2026-10-15 ~18:20 EDT, before the
chapter's code, by the sub-agent building it for the release driver. One piece of code predates it: the Chapter III pin (`tests/unit/chapters/last-summoning-iii-pin.test.ts`), recorded first on purpose.

**Authority.** Bailey, 2026-10-15, verbatim: "we definitely need an awesome chapter built with yojimbo AND magus sisters ... the most epic encounter ever!!!!!!!!!" and "I'll go with all your
recommendations I like the last summoning". The approved design is concept 2 of `D:/Tools/pyrefly-scratch/2026-10-15/aeons-chapter/concepts.md` (§3); the approved target for the new screen is its
`frame-2b-offering-menu.png` (a new screen whose target was approved through Bailey's delegated pick). Chapter III itself stays **unchanged** (D-651). The driver's later decisions: `public/art` stays on
r49 in this tree (so new paintings, if any, go into the r50 mirror as new files and this tree shows their fallback), and the final art frames are taken later in a tree that points at r50.

**Game case: FFX only** (AGENTS.md rule 14). Aeons, Summon, the Pay-and-free-attack Yojimbo and the Sisters' orders exist only in FFX (`research/ffx-yojimbo.md` §0.3); the possession chain is FFX's
(`research/re-ffx-last-summoning.md`, "Game case: FFX only"). FFX-2's Yojimbo (the Tourist Trap) and its Sisters (the Fallen Aeons road) are other fights and nothing here reads them. Shared plumbing (the
registry row, the door row, one scene row, the chain loop's optional hook, three optional fields of `EnemyGroupDef`, the engine's folding of the Sisters in two lists) is "both" (CHK-020), additive and inert
for every other chapter: the proof is Chapter III's twelve seeds and the 18 FFX goldens, pinned before and after.

**Verdict: PROCEED**, with the engine as the RE session left it (lane FFX-K) and every game number from `research/re-ffx-last-summoning.md`. What no source gives (the Sisters' starting motivation, Yojimbo's
hire answer, the aeons' starting gauges beyond the five story aeons) is a named estimate in one place, labelled where it is set and in the handoff.

## 1. What the chapter is

A hidden variant of Dream's End. Yu Yevon takes the player's aeons **one at a time, in the order the player picks on a new offering screen**; the player holds the **full roster** (Valefor, Ifrit, Ixion,
Shiva, Bahamut, Anima, Yojimbo, the Magus Sisters). The party is Dream's End's Tidus, Yuna and Auron (`dreamsEndBuild`, byte for byte, with the aeon list widened and the two optional states of the engine
added), under the fayth's permanent Auto-Life. **The cost is the drama**: an aeon given is gone for the rest of the chain (Summon shows it greyed, "Taken by Yu Yevon"), and the aeon given is fought next, as the
game builds it (the copy of the player's own: STR, DEF, MAG, MDF, AGI, EVA, ACC and maximum HP, full HP; `re-ffx-last-summoning` §7).

- **Shape.** Eight offerings and nine battles: the offering, a possession link, the offering, ..., the last link, Yu Yevon. Nothing restores HP, MP or statuses between links (RE §2); every link carries the
  party forward as the chain always has. The chain **cannot be lost** except by petrifying the whole party (Auto-Life, Dream's End's own rule); the bench measures length and how each link ends.
- **Start.** The recommendation stands: the chapter starts at the offering screen, after Braska's Final Aeon (Chapter III covers Braska). Argued once and kept: a link with Braska would repeat Chapter III
  for ten minutes before the point of the variant, and the real event (`sins0700`) runs the menu with nothing before it in its own script (RE §2).
- **No default order** (RE §2 point 3): the menu lists the held aeons in ascending id order, any may be chosen first; the cursor opens on the first held aeon (the likely start is inferred, RE §9 item 2).
- **Anima has no fixed place** (RE §3): between Bahamut and Yojimbo in the list, chosen when the player likes.
- **Summons during the chain are allowed** (RE §5): Summon is never disabled; the pool shrinks by one entry per link, and the aeon fought in a link is never one the player can bring in. This is the existing
  duel lock (`EnemyGroupDef.lockedAeons`, Chapter XIV) with one more optional field, the reason's words.

## 2. Where it parts from Chapter III (and why Chapter III cannot move)

| Thing | Chapter III | The Last Summoning |
|---|---|---|
| Order | the five mandatory aeons in acquisition order (`buildPossessedAeonChain`) | the player's, from the offering screen; eight entries, the Sisters one battle |
| Sisters | three separate battles (the shipped builder; **not the game**) | **one** battle, three bodies (`sins07_07`) |
| Yojimbo | not in the chain | possessed Yojimbo (`sins07_06`): Kozuka and Wakizashi, Zanmato 9,999 |
| Braska's Final Aeon | first link | none; Chapter III covers him |
| Pagodas | Power Wave on the possessed aeon | the same; in the Sisters' battle on the living Sister with the lowest gauge |
| Aeons for the player | five, summon list never shrinks | eight, shrinking by the lock |

The code Chapter III shares is changed only **additively** (a new AI branch behind "a Sister is on the field", new records, new optional fields); `tests/unit/chapters/last-summoning-iii-pin.test.ts` pins
its twelve seeds (table digest `a26660257ba2716c`) and `tests/unit/ffx-engine-golden.test.ts` the 18 goldens, before and after.

## 3. The data, source by source (rule 6: nothing invented)

Every game value is from `research/re-ffx-last-summoning.md` ("RE §n", the game's own files read by the RE session) unless it says otherwise. Tags: `[bytes]` read from the game's file; `[note]` taken from a
checked note; `[estimate]` ours, named, in one place.

**The record fixes** (RE §1.4, §4; the possessed Yojimbo and Sisters records the first build left wrong):

| Record | First build | The file (RE) |
|---|---|---|
| Possessed Yojimbo's strikes | Daigoro, power 10, plain Attack allowed | **Kozuka 0x60E0 and Wakizashi 0x60E1**, power 14, one target, rank 3, a coin of two on a random living front-line actor; **no Daigoro, no plain Attack** `[bytes]` |
| Possessed Yojimbo's Zanmato | Death at chance 255 | **fixed 9,999 on each front-line actor** (formula 6, power 200, no status, not a kill) `[bytes]` |
| Camisade (Cindy) | power 30, rank 3 | command 0x30E5: power 21, **rank 5**, shatter 30 `[bytes]` |
| Razzia (Sandy) | power 28, all enemies | command 0x30E7: power 21, **one target**, rank 5, shatter 30 `[bytes]` |
| Delta Attack | power 65, 1 hit | row 0x60E6: **formula 15 (MAG cube), power 10, 6 hits**, the whole front line `[bytes]` |
| Passado (Mindy) | power 2 x 15 | **matches** row 0x60E5 |
| Cindy's list | Camisade, Delta Attack, Curaga | **adds Drain** (below two thirds of her maximum HP) `[bytes]` |
| Mindy's list | Passado | **adds Flare** (a coin with Passado; and on Cindy while she has Reflect) `[bytes]` |
| Zanmato bytes | none | possessed Valefor to Yojimbo 2, the Sisters 3 (the data's `zanmatoLevel` is the byte plus 1) `[bytes]` |

**The two battles and their scripts** (RE §6): Yojimbo opens with a no-damage staging turn, then each turn Zanmato at a full gauge, else Kozuka or Wakizashi on a random living front-line actor; the gauge
gains 0 to 9 on a turn that was not the Overdrive, 0 to 9 per hit reaching him and 5 more from a Pagoda's Power Wave. The Sisters: Cindy has First Strike and the staging turn; then Cindy Delta Attack when all
three are alive with gauges of 100, else Drain under two thirds HP, else Curaga on a Sister at 50 percent or less, else Camisade; Sandy sends the token when all are full, else Reflect on Cindy, else Haste on a
Sister without it, else Razzia; Mindy sends the token when all are full, else Flare on Cindy while she has Reflect, else Passado or Flare on a coin (Passado 48.97 percent). Each Sister's gauge is on a
100-point scale of her own: 0 to 9 a turn, **10 to 19 per hit event, 30 to 39 more from a Power Wave**. The Pagodas' Power Wave in this battle goes to the living Sister with the lowest gauge (ties drawn) and is
skipped when that gauge is 100. One dead Sister makes Delta Attack impossible; the battle ends when all three are dead. `[bytes]`

**Not built from the file, said plainly:** how Sandy and Mindy enter play (RE §9 item 6: untraced; all three Sisters are on the field from the start here), the helper actor and the Sinscale stand-in of the
formations (they never act and are not targetable; omitted), the raw properties 295, 296, 217 and 238 (unmapped).

**Our estimates, each in one place** (`src/data/ffx/builds/last-summoning-roster.ts`, labelled there and in the handoff): Yojimbo's **starting compatibility 128** ("strongly indicated by the owner's saves,
live confirmation pending", the driver's value); his **hire answer 1** (the neutral answer; the game's default for a Yojimbo never hired through the scene is 0, and which answer the player gave is in no
source); the party's **gil 50,000** (Dream's End's own `[estimate]`); **each Sister's starting motivation 50** (the middle of 0 to 100; the engine says "UNSOURCED"); the five extra aeons' **starting
gauges 0** (the five story aeons' are `ffx-seymour-flux` §7.9.2's; nothing sources the others); the stage spots and heights of the possessed Yojimbo and Sisters; the guide's and the story's words.
The five extra aeons' **stats are `research/ffx-combat-core.md` §6.4.3's inside-Sin block** (Anima 4,288 HP ... Mindy 4,105 HP, `[estimate]` in that document's own sense, mechanically derived), the same
block Dream's End's five already use.

**What the engine does not do for the player's Sisters (the RE session's boundary, kept):** only **Combine powers** has a handler (`BUILT_ORDERS`); the other seven orders are offered by the game's menu
builder and listed greyed with a reason. The Sisters are therefore, in this chapter, the aeons that hold the field and fire the Delta Attack when all three gauges are full (a Grand Summon fills them);
every other order waits for the RE session's handlers and will light up with no change here (the menu rows are the engine's). Said in the guide, the handoff and the offering screen's words.

## 4. The pieces, in files

| Piece | Files (new unless marked; all `src/` unless noted) |
|---|---|
| Record fixes, AI, hit scripts | `data/ffx/enemies/braskas-final-aeon-abilities.ts` (records), `battle/ffx/ai/possessed-aeons.ts` (Yojimbo's coin and the new rows), `ai/possessed-sisters.ts` (the three scripts, the gauges, the Pagoda branch), `data/ffx/command-records/enemies.ts` |
| The chapter | `data/ffx/last-summoning-ids.ts`, `data/ffx/builds/last-summoning-roster.ts` + `last-summoning.ts` (the build), `data/ffx/enemies/last-summoning-chain.ts` (link groups and locks), `data/chapter-last-summoning.ts`, `chapter-meta-last-summoning.ts`, one line each in `chapters-experiments.ts`, `chapter-meta.ts`, `encounters.ts` |
| The chain loop | `app/screens/BattleEncounterChain.ts` (one optional hook), `BattleScreen.ts` (the wiring), `BattleScreenSetup.ts` (the link resolver) |
| The offering screen | `ui/ffx/offering/` (a DOM overlay in the Ink and Gold chrome built to frame-2b; its model is pure and tested), its stylesheet |
| Pay and the Sisters | `ui/ffx/YojimboPay.ts` (the amount panel, the one new input the engine's Pay needs), the Sisters' status rows, the three-aeon summon staging (`BattlePresenterBeats.ts`, `ui/ffx/fieldRows.ts`) |
| Story, guide, advisor | `story/scripts/last-summoning.ts`, `data/guides/last-summoning.ts` (+ docs), `engine/tactics/last-summoning.ts` (+ registries) |
| The word | `app/screens/frontend/summonDoor.ts` and one row in `chapterDoors.ts` |
| The stage | `scenes/last-summoning.ts` (a thin derivation of Dream's End's with this chapter's spots), a row in `scenes/experiment-scenes.ts` and `engine/pyreflyCanon.ts` |
| Contract changes | `battle/common/types.ts` (three optional fields of `EnemyGroupDef`), `data/encounters.ts` (the id and 28 on existing lines), `docs/CONTRACT-CHANGES.md` |

## 5. The offering screen (a new screen: end state first, rule 9)

Built to `frame-2b-offering-menu.png`, the approved target: Dream's End's painting as the ground, Yu Yevon above the line "Yu Yevon reaches for one of your aeons.", the eyebrow "THE LAST SUMMONING · DREAM'S
END", the row of eight cards in the game's order (taken cards grey with a red X and "TAKEN"; the held cards in colour; the focused card gold with "SELECT"), the panel with "IF YU YEVON TAKES ..." and "WHAT YOU
LOSE", and the keys strip (the arrows choose, Enter gives). The mockup shows seven cards because it had no Anima; eight fit by narrowing each card. **Differences from the frame, named:** an eighth card (Anima);
the Sisters' card is the three idle paintings side by side (no portrait exists for any Sister); on a phone the row scrolls and the panel stacks. The wording is ours; the real menu's look is not read (RE §9 item 2).
Input is the board's: Left and Right (and A, D) move, Enter, Space or Z gives, a tap selects and a second tap gives; the screen claims the keyboard so the battle HUD behind it hears nothing. Pure model
(`offeringModel.ts`): the cards, their state and the panel's words from the roster and the taken set, tested without a DOM.

## 6. Art

**Reuse, so no new painting.** Dream's End already presents its possessed aeons **from the player's own paintings**: `possessedAeonEnemyDef` gives each `spriteKey = the aeon's own key` (`characters/valefor`
...), with no tint and no shader (grep of `scenes/dreams-end.ts` and the presenter: nothing mentions a possessed look). The same holds for Anima, Yojimbo and the Sisters (`characters/anima`, `yojimbo`, `cindy`,
`sandy`, `mindy`, all present in r49; the Sisters' are tagged FFX-2 only, the design matches the FFX description, and the concept's question (c) is among the recommendations Bailey took). **Gaps, disclosed:** the
possessed Yojimbo has no hurt or KO painting (the presenter holds the idle), Mindy has no attack painting, and no Sister has a portrait (the turn rail falls back to a crop of the idle). A **possessed look** (the
dark img2img pass of the mirror lane) would be an addition for Bailey's yes, not a need: it is listed in the handoff, not built. The scene key `last-summoning` wants a copy of Dream's End's plate as
`backdrops/last-summoning.png` (the pattern of every derived scene: the cutscene screen and the party prep draw `backdrops/<sceneKey>.png`); it is a **new file** for the r50 mirror, so this tree's 2D
screens show the fallback until the mirror is used. Nothing under r49 is written.

## 7. The word

`summon`. Taken: limit, leblanc, experiment, mushroom, fayth, daigoro, valefor, gagazet, angra and chapter 27's yojimbo. Rule (`chapter-doors.test.ts`): no word begins with, ends with or contains another, and no suffix of
one is a prefix of another (the whole word against every word in both directions). `summon` begins with `s` (no word ends in `s`) and ends with `n` (no word begins with `n`), and no longer suffix of it (`on`, `mon`,
`mmon`, `ummon`) starts a word nor does a longer prefix (`su`, `sum`, ...) end one: checked by script against all ten words, in both orders. Letters on the board: **S** is `down` (the first letter moves the cursor
one step, as a first `d` or `a` does elsewhere), U is nothing, **M** is `select` (twice, ignored by the board), O and N are nothing; the later letters are claimed by the word. It is also easy to say.

## 8. Tests (written with the code)

The record fixes against the RE note's rows (a fixture of the rows, field by field); the AI on a stub context with exact draws and on the real engine (every branch of the three Sisters' scripts, Yojimbo's coin,
the staging turn, the gauges, the Pagoda branch, Chapter III unaffected); the chain builder (every order of a small roster is a valid chain; the lock grows; the Sisters are one link; Yu Yevon last; the stat copy
at full HP); the locks in the real engine (Summon greys the taken, Grand Summon never offers them); the offering model; the door; the chapter record, the scene row and the story lint; the guide and advisor
registrations; Chapter III's twelve seeds and the 18 goldens after; a **bench** of the chain (the line and a naive one, several orders, 100 seeds where the chain is short enough, the length and how often each link
ends with the player's aeon standing). Then `tsc --noEmit`, `node tools/orphans.mjs`, the FFX goldens and the chapter and door suites. Browser: a production build on the build drive (vite directly with
`BASE_PATH=/`, from PowerShell), headless Playwright from node with `PYREFLY_BROWSER=gpu`: the offering screen, a Sisters link with Combine powers lit, and the possessed Yojimbo, each at 1600x900 and 390x844.

## 9. Risks and how each is checked

| # | Risk | Closure |
|---|---|---|
| R1 | A record fix reaches Chapter III | the pin test (twelve seeds) and the 18 goldens; new rows have new ids, shared ones are not edited |
| R2 | The Sisters on the field break a surface built for one aeon (status rows, staging, framing) | the browser frames; `aeonIds` folded in the four places that read `aeonId` for the aeon out |
| R3 | The offering screen steals or leaks input | the claim is exclusive; a test drives it with the real `Input` |
| R4 | The lock leaks an aeon (Grand Summon, the Sisters through Sandy) | all three Sisters are locked together; `grandSummonChoices` already reads the lock; a test summons every taken aeon and expects a refusal |
| R5 | The chain is too long or a link stalls | the bench measures; the loop's own link bound is raised for this chapter only (`maxLinks`) |
| R6 | Disk and processes | every build, temp and scratch file on the build drive; servers stopped by port |

## 10. Open questions (for the handoff)

1. The Sisters' other seven orders (the RE session's handlers) and Yojimbo's menu beyond Pay and Dismiss (note's open question 3).
2. Yojimbo's compatibility (live confirmation), his hire answer, the Sisters' motivation, the gauges: Bailey's or the RE session's to settle.
3. A possessed look for the eight paintings, the Sisters' portraits, Yojimbo's hurt and KO paintings, Mindy's attack: art, Bailey's picks.
4. How Sandy and Mindy enter play in the real battle (RE §9 item 6) and whether the Pagodas count for the Zanmato penalty (RE §9 item 4).
5. Listing the chapter on the board waits for Bailey, as for every hidden chapter; the music is existing cues by reference (Bailey's ear).
