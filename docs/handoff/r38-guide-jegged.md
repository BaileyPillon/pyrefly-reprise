# r38: the strategy guide is the encounter guide's own page, as a document, and is its own thing

**Branch** `r38-guide-jegged`. **Game case: both** (AGENTS.md rule 14), decided per chapter in section 2: the FFX chapters (I, II,
III, VII, VIII, IX, X, XII, XIV, XVII, XVIII) follow Jegged's FFX guide, the FFX-2 chapters (IV, V, VI, XI, XIII, XV, XVI) follow its
FFX-2 guide; the panel, its paging and the phone sheet are shared plumbing and are proved on both games. Nothing is merged to
`main` and nothing is deployed. Decision record: D-350 (the first instruction and its two corrections) in `docs/target/decisions.json`;
the fourth instruction below came after it and is not yet recorded there. The pages are named only in the file headers under
`src/data/guides/docs/`, in `research/jegged-encounter-guides-ffx-a.md`, `-ffx-b.md`, `-ffx2.md` and in this note; the player sees
no source anywhere.

Bailey, 2026-10-03, in order: "from now on the guide follows the ffx/ffx-2 encounter guides from jegged" (~13:50 EDT); "The guide
and next move advisor are completely separate entities" (~14:30); "Do not say adapted from Jegged or cite worded that just sounds
stupid" (~14:40); "Just match the original document please in terms of formatting and everything else" (~18:35); "All your
recommendations please thank you <3 I love you Claude" (~21:35, taking the driver's recommendations on section 7: the desktop reading
sheet, the cure-hint card in a box of its own). Recorded on `main` (f3389dfc, docs only) as D-362 (the mirror), D-364 (the desktop
reading view), D-365 (the Wait-split line stays out), D-366 (the hint cards in their own card) and D-367 (advice the kit cannot follow is
printed as the page gives it).

## 0. Read this first

**Pass three (2026-10-03, evening): the desktop guide is a scrolling reading sheet and the cure-hint card has a box of its own. It is
section 10 below, and it supersedes what sections 1, 3, 6, 7 and 8 say about paging, the `MORE` row and the card inside the guide;
those passages are marked.**

This is the **second pass** on the branch. The first pass (a plan, a computed NEXT card, win rates) is superseded by the fourth
instruction: the panel is now the encounter guide's page for the boss, with that page's layout and that page's content, in our own
words, and **nothing in it is computed**: no NEXT line, no WATCH logic, no fit steps, no rules of ours. The first pass's code
(`src/data/guides/lines/`, `line-types.ts`, `src/engine/tactics/guide-line*.ts`, their tests) is removed from the tree and parked
outside the repo (`F:/pyrefly-parked/2026-10-03/guide-doc/`, with that pass's handoff as `docs/handoff/r38-guide-jegged.first-pass.md`);
it is also in the branch's history before the commit that carries this note. Its win-rate measurement and its "for Bailey" list no
longer apply and are not repeated here.

## 1. What changed, in one screen

| | Before (origin/main, then the first pass) | Now |
|---|---|---|
| What the panel prints | RULES, WATCH and a NEXT card computed from the board (a tactic, then a line of our own) | the boss's page: header and tag, the stat lines that page prints, then its advice in its order: paragraphs, bullet and numbered lists, lead-ins, sub-headings, the boxed hint |
| Data | `src/data/guides/<chapter>.ts` rules; first pass: `lines/` | `src/data/guides/docs/<chapter>.ts`: 18 plain-data documents (`doc-types.ts`); the 18 chapter files and `types.ts` are **byte-identical to origin/main** again (the advisor still reads them) |
| Reasoning | `guide.ts`, later `guide-line.ts` | none; the panel reads no tactic, no advisor, no `intendedStrategy` |
| Fit | a ladder of shorter wordings, citations under each line | **pass two:** whole blocks per page, a paragraph carried over between two lines, `MORE` turned the page and wrapped. **Pass three: none.** The desktop panel is a scrolling reading sheet with the whole page in it (section 10) |
| Phone (390x844) | folded behind the GUIDE chip | unchanged chip; the sheet shows the whole document and opens scrolled to the boss's header |
| HUDs | `showDecision`/`clearDecision` and a `held` option fed the panel | the three calls and the option are gone (the move advisor's own are untouched) |

## 2. Document layout, chapter by chapter

**How a page maps.** Block kinds (`doc-types.ts`): `head` (the boss's name in the serif face plus its tag, "Boss Battle" or "Final
Boss Battle"), `field` (a labelled stat line: "In Game Description:", "HP:"), `list` (a labelled Steal or Drops list), `loot` (FFX-2's
Enemy / HP / Steal / Drop table, one box per enemy), `p`, `ul`, `ol`, `lead` (a bold lead-in line such as "The strategy:"), `h3` (a
sub-heading), `hint` (the boxed note with its own title), `table` (the two-column Bulwark table). FFX pages print the description
and HP before the advice and Steal and Drops after it; FFX-2 pages put the table last. Pictures on the pages are not reproduced.
Preparation paragraphs that sit above a boss's card on the page sit above its header here too (document order is kept) and the panel
opens at the header. The panel opens where the boss on the field is ("opens on" below); a later fight of the same chapter takes over.

For my own comparison I read all 15 pages again on 2026-10-03 in headless Chromium from node (their HTML and text, and element
screenshots of the Flux and Bahamut cards), kept in `D:/Tools/pyrefly-scratch/2026-10-03/guide-doc/pages/` and `jegged-shots/`;
nothing from them is in the repo. FFX base `https://jegged.com/Games/Final-Fantasy-X/`, FFX-2 base
`https://jegged.com/Games/Final-Fantasy-X-2/`.

### FFX only (every FFX chapter follows the FFX guide)

- **I. Seymour Flux.** Page `Walkthrough/26-Mt-Gagazet.html`. Card: three preparation paragraphs above (Wantz's Holy Water and
  Zombie Ward, Phoenix Downs and the Overdrive gauges, Yuna's Dispel), then the header band, In Game Description, HP, twelve
  paragraphs, Steal, Drops. Panel: the same 20 blocks in that order; the closing "Good luck!" is not printed. Opens on the header.
  Numbers: none differ. Kept though this party cannot: Lulu's Bio (Lulu is benched), Defend (FFX's command window has no Defend row).
- **II. Yunalesca.** `Walkthrough/28-Zanarkand-Ruins.html`. Three preparation paragraphs above (Berserk armour off, Darkness and
  Silence, the Dark and Silence Ward armour), then the card: a short intro, In Game Description, the three phases each with its
  own "Phase n: HP" line and advice, the lead-in "Additional notes and strategies:" with five paragraphs, Steal (common and rare),
  Drops. Panel: the same 22 blocks; opens on the header for Form I, on Phase 2's line for Form II, Phase 3's for Form III. HP
  24,000 / 48,000 / 60,000 agree. Name: the page's "Punch" is printed as the game's "Dispelling Slap". Kept though not doable: Holy
  (Yuna has not learned it; the page's own wording is conditional).
- **III. Braska's Final Aeon.** `Walkthrough/32-Inside-Sin.html`. One paragraph and the boxed "Using Powerful Items" above; one
  card for the whole fight (no HP, Steal or Drops list on that page), a "Yu Pagodas" sub-heading with its advice, the advice for the
  aeon, and a closing paragraph about Yu Yevon. Panel: the same 15 blocks, so the card prints no HP (the game's 60,000 and 120,000
  stay unprinted because the page prints none); every possessed aeon opens on the same card, and **Yu Yevon opens on the closing
  paragraph**. The Pagodas' 5,000 HP agree with the data.
- **VII. Seymour and Anima.** `Walkthrough/18-Lake-Macalania.html`. One paragraph above (save, O'aka), then two cards: Seymour (In
  Game Description, HP, three paragraphs, a numbered "two ways" list, two closing paragraphs) and Anima (HP, six paragraphs, Steal,
  Drops). Panel: the same 20 blocks; opens on Seymour's card, and on Anima's while she stands. HP 6,000 and 18,000 agree. There is no
  page for the third act, so Anima's closing tip is the last thing shown. Kept though not doable: Blizzara healing Shiva (needs
  Lulu), Auron's Threaten (a swap-in; the Steal route is the other half of the same list).
- **VIII. Evrae.** `Walkthrough/21-Airship.html`. Five preparation paragraphs above; the card: In Game Description, HP, the lead-in
  "The mechanics of the fight:" with three paragraphs, "The strategy:" with eight, Steal, Drops. Panel: the same 23 blocks. HP
  32,000 agrees. Kept though not doable: the Mighty G Mixes (the bag has no ingredients), the Stone and Poison Wards (the build
  ships one Stone Ward and no Poison Ward).
- **IX. Yojimbo.** `Side-Quests/Cavern-of-the-Stolen-Fayth.html`. The page has **no boss card for this fight**: one paragraph and a
  boxed hint (Kimahri's Ronso Rage) above, then the "Yojimbo" heading and two paragraphs. Panel: those 5 blocks and no stat box (the
  page has none). **Number: the page says "approximately 30,000" HP, the panel says 33,000 (the game's).** What follows the fight on
  the page (the contract, the price, the side rooms) is not in this game and is left out.
- **X. Seymour Natus.** `Walkthrough/23-Via-Purifico.html`. Three paragraphs above; the card: In Game Description, HP, two
  paragraphs, "Phase 1", "Phase 2 (...)" and "Phase 3 (...)" lead-ins with their advice, "Some additional notes:", "Strategy:" (a
  bullet list), Steal, Drops. Panel: the same 26 blocks. HP 36,000 agrees. **Numbers: Drops: the page lists a Lv. 2 Key Sphere, the
  panel says "None" (the game awards no drop here; the item has no record yet).** Left out (the research says the game does
  otherwise): a direct hit draws a counter-spell, Nul spells call Desperado, Magic Break works on Natus and Mortibody. Kept though
  not doable: Reflect on Yuna (she has not learned it).
- **XII. Seymour Omnis.** `Walkthrough/31-Sin.html`. A paragraph, a bullet list of the magic-guarding armour and a paragraph above;
  the card: In Game Description, HP, eleven paragraphs, Steal, Drops. Panel: the same 19 blocks. HP 80,000 agrees. Left out: that
  Yuna's Shell lessens Ultima (it is not a Magic-type hit here); the Shield command and Lulu's Focus stay.
- **XIV. Isaaru's aeons.** `Walkthrough/23-Via-Purifico.html`. Two paragraphs above; one card with three parts, each with its own
  "<aeon> (aka ...): HP" line (8,000, 12,000, 20,000, all agree). Panel: the same 18 blocks; opens on Grothia's part, Pterya's or
  Spathi's, whichever aeon is on the field. **Numbers: Spathi counts down from 4 on the page, from 5 here.** Left out: that Ice
  spells are Grothia's weakness (the research has it taking ordinary damage). Kept though not doable: Ixion healing himself with
  Thundara and Shiva with Blizzara (the shipped aeons do not know them).
- **XVII. Sin: the Fins and the Core.** `Walkthrough/31-Sin.html`. Two paragraphs above; Left Fin (HP, six paragraphs, Steal, Drops),
  Right Fin (In Game Description, a line, Steal, Drops), Sinspawn Genais (In Game Description, HP, three paragraphs, Steal, Drops)
  with the Core as a sub-heading of Genais's card, as it is on the page. Panel: the same 30 blocks; opens on the Left Fin, the Right
  Fin or Genais as they stand, and on the Core's sub-heading once Genais has fallen. HP 65,000 and 20,000 agree (the Right Fin and
  the Core print none because the page prints none). Drops: one each here (the page's second, doubled entry is not awarded).
  Kept though not doable: Rikku's Luck (Rikku starts on the bench), the Silence Grenade (not in the bag).
- **XVIII. Sin: the Face.** `Walkthrough/31-Sin.html`. A paragraph, a list of three wards and two paragraphs above; the card: In
  Game Description, HP, six paragraphs, Steal, Drops. Panel: the same 15 blocks; the closing "Good luck!" is not printed. HP 140,000
  agrees. **Numbers: the clock is "about sixteen turns" on the page, "about thirteen turns" here (`research/ffx-sin.md` S-1, our
  estimate: the game ends the fight on the 13th).** Kept though not doable: Rikku's Luck and Mix (bench).

### FFX-2 only (every FFX-2 chapter follows the FFX-2 guide)

- **IV. Bahamut.** `Walkthrough/Chapter-2/28-Bevelle.html`. Two paragraphs above (Dark Knight, Thief and Ribbon); the card: two
  paragraphs, the seven-line attack list, three paragraphs, the table (8,400 HP, Mute Shock, Gris-Gris Bag, all agree). Panel: the
  same 10 blocks. No numbers differ. Kept though not doable: the Thief's Steal for the Mute Shock.
- **V. Vegnagun and Shuyin.** `Walkthrough/Chapter-5/63-Heart-of-the-Farplane.html`. Five cards, each with its paragraphs, lists
  with lead-ins and its table (the Core's card also has the two-column Bulwark table). Panel: the same 64 blocks; opens on the link
  that stands (Tail, Leg, Core, Head, Shuyin). All HP agree (34,200, 18,220, 300,000 for the Nodes, 33,040, 3,000, 38,420, 2,500,
  23,850). **Numbers: Nemo Ante Mortem Beatus is "700 to 1,500" on the page, "roughly 1,490 to 1,685" here (the game's own range).
  Left out: that Protect halves Noli Me Tangere, 1,250 to 625 (here Noli is a fixed hit no buff touches). Drops: the Nodes' page row
  lists a rare Hero Drink; the game awards only the common Megalixir (the rare slot has no rate in our data: research section 11).**
  Kept though not doable: the Dispel Tonic (not in the bag), the Warrior's Armor Break (no Warrior).
- **VI. The Leblanc Syndicate.** `Walkthrough/Chapter-2/27-Guadosalam-Chateau-Leblanc.html`. **The page has no boss card for these
  fights**: only the walkthrough's paragraphs under "Hidden Passageway" (each fight called easy) and a boxed hint (the Charm
  Bangle). Panel: those 7 blocks and nothing more: no stat box, because there is none to mirror. The Garment Grid reward and the
  trip back to the Celsius are left out (not in this game).
- **XI. The Fallen Aeons.** `Walkthrough/Chapter-5/61-Road-to-the-Farplane-and-Farplane-Abyss.html`. One paragraph above; three
  cards: Shiva (attack list and table), the Magus Sisters (one list per sister, five paragraphs, a three-row table), Anima. Panel:
  the same 26 blocks; opens on the fight on the field. All HP agree (14,800; 10,330, 9,788, 12,240; 36,000). Drops: one each (the
  page's second, rarer entries on the Shiva, Sandy and Cindy rows are not awarded). Kept though not doable: the Ribbon, a Fire spell
  (Shiva's weakness), the Lady Luck's Four Dice, the Samurai's Spare Change (none in this kit).
- **XIII. Paragon and Trema.** `Side-Quests/Via-Infinito/Boss-Battles.html`. The preparation (a paragraph, a boxed Oversoul note and
  four paragraphs) above; Paragon (lists, table) and Trema (list, table). Panel: the same 28 blocks; opens at the top for Paragon and on
  Trema's header once Trema stands. **Numbers: Paragon's table says 200,000 HP (the normal form), the panel 210,000 (the Oversoul
  form this chapter ships); Paragon's drop cell lists a Supreme Gem (common) and a Dark Matter (rare), Trema's a Dark Matter
  (common) and two (rare), and the game awards one Dark Matter each.** The page's
  "Judgment" is printed as the game's "Judgement". Kept though not doable: the Higher Power grid, the Mascot dressphere and the
  best accessories (not in this kit).
- **XV. The Den of Woe.** `Walkthrough/Chapter-5/60-Mushroom-Rock-Road.html`. A boxed Blue Bullet note, a lead-in "Preparation:"
  and two paragraphs above; Baralai, Gippal and Nooj, each with a paragraph, a move list, paragraphs and a table (the page also has
  cards for Rikku and Paine, which this chapter does not fight). Panel: the same 29 blocks; opens on the shade on the field. All HP
  agree (12,220; 14,800; 23,800). **Numbers: Baralai's Drill Shot fires after his HP has changed 10 times on the page, 8 times
  here.** The Garment Grid reward is left out. Kept though not doable: the Salvation Promised grid's Auto-Life, an Alchemist's Mix
  (the preset has neither).
- **XVI. Ixion at Djose.** `Walkthrough/Chapter-3/40-Djose-Temple.html`. A paragraph above; the card: five paragraphs, the table
  (12,380 HP, Sprint Shoes, Soul of Thamasa, all agree). Panel: the same 8 blocks. **Left out: the page's count of four Aerospark
  casts in a row (here his cycle is a counter, `src/battle/ffx2/ai/ixion.ts`).** What follows the fight on the page (the Garment
  Grid, the cutscene, the whistles) is left out. Kept though not doable: the Water spells and gems (the preset has none), a
  Warrior's Break.

**Every number that differs, in one list** (the panel prints the game's; `tests/unit/guide-doc.test.ts` pins each, and every HP a
document prints is checked against the chapter's own enemies): IX Yojimbo HP 30,000 (page) to 33,000; X Natus's drop, a Lv. 2 Key
Sphere, to None; XIV Spathi's count 4 to 5; XVIII Sin's clock sixteen turns to thirteen; V Nemo 700-1,500 to 1,490-1,685; XIII
Paragon HP 200,000 to 210,000; XV Drill Shot 10 changes to 8. Drops the page lists and the game does not award (the panel prints the
one the game does): V the Nodes' rare Hero Drink; XI the second, rarer entry on the Shiva, Sandy and Cindy rows; XIII Paragon's
Supreme Gem (common) and Trema's second Dark Matter entry; XVII the doubled rare entry on the Left Fin, Right Fin, Genais and Core.
The one count left out is XVI's four Aerospark casts. A scan of every card's numbers and number words against the panel text found
no other difference (the scan lived in scratch and is not committed).

**Chapters the guide does not cover, or covers in part.** All 18 have a page. Partial: III (the card has no stat box, Yu Yevon has one
paragraph), VI (no boss card at all, only the walkthrough's paragraphs), IX (no boss card, one paragraph and a hint), VII (no page
for the third act), XV (two cards, Rikku and Paine, that this chapter does not need). In each the panel shows the closest section
and only the stats that page prints; none of ours are added.

**"Kept though not doable"** lists advice the page gives that this chapter's kit cannot follow. It is printed as the page gives it
(Bailey's instruction: nothing of ours), and each item is from the first pass's chapter notes, which read the kits in `src/data/**/builds`;
they were not re-checked in this pass and no data changed.

## 3. The panel

- **Rail box.** `.sgd__stack` is the box the old rail had: left 21.33 and width 132 grid px, top below the banner, maximum
  height from the same anchors (`railTop`, `layoutToggle` and `stageScale` are the same code as origin/main; `layout` differs
  only by the phone branch and the removed compact-rules class). At 1600x900 (scale 2.5) the FFX rail is at most 330x177 px at
  (53,110) (`maxHeight` 71 grid px; the Ch. I stack measured 173 px) and the FFX-2 rail at most 330x230 px at (53,220) in the
  proof frame (measured stack 218 px; its limit is the fence above Yuna's head, which moves with the party). Nothing was
  widened (the width is mirrored by FFX-2's `GUIDE_RAIL_RIGHT`, the advisor's lane solver, `text-size-wide.css` and their
  tests). Text is 5.7 grid px (14.25 px at 1600x900, 15 px on the phone) at a line height of 1.32.
- **What the rail covered, against origin/main (pass two; pass three re-measures the sheet in section 10).** The same spec (`tests/e2e/hud-collision.spec.ts`, CHK-008: every HUD panel
  against every painted figure's quad, "face" being the upper third) ran on the final branch build and on a build of
  origin/main (a6b79313), Chapters I, II, IV and V at 1280x720, 1600x900, 2000x1000 and 2560x1440, same seeds, six of the
  nine states reached in each. The guide panel's overlap with figures:

  | Chapter | Viewports | States where the guide touches a figure, branch / main | Overlap with figures (px, all states and viewports), branch / main | Guide box height at 1600x900, branch / main |
  |---|---|---|---|---|
  | I Flux (FFX) | 4 | 0 / 0 | 0 / 0 | 146 / 140 px |
  | II Yunalesca (FFX) | 4 | 0 / 0 | 0 / 0 | 87 / 140 px |
  | IV Bahamut (FFX-2) | 4 | 2 / 16 | 135 / 83,418 | 178 / 256 px |
  | V Vegnagun (FFX-2) | 4 | 0 / 0 | 0 / 0 | 271 / 274 px |

  (Per viewport, Chapter IV: 135 / 12,210 px at 1280x720, 0 / 7,818 at 1600x900, 0 / 44,234 at 2000x1000, 0 / 19,156 at 2560x1440.
  The reports are in scratch, `chk-fixed/` and `chk-main/`.)

  (Pass two's note, about a fit that pass three removed.) A first run of this measurement found the guide **covering Yuna more than the old rail** in FFX-2 Chapter IV (19,402 px
  against 7,818 at 1600x900), and the box was not the cause: the status hint card (the cure hint for a party member's status) rides at
  the top of the guide's panel and counts as chrome in the fit, but the fit was keyed on the rail's height and the page, not on what else the panel held, and FFX-2's rail does not move
  with the menu (its limit is the fence above the party). A card arriving after the fit therefore grew on top of a body that
  already filled the rail, and at 1280x720 the panel ran 48 grid px past it (the old rail's shorter body ran 28 past: the same
  latent bug).
  The fit is now keyed on what else the panel holds as well (`StrategyGuide.extraChrome`; shared plumbing, both games; it showed
  in FFX-2 in the measurement), pinned by a test in `guide-doc-render.test.ts`, and the table is the re-run. While a card is up
  the body gets what is left of the rail, as that card's own header comment says it should (one block when the card is tall),
  and the page comes back when the card goes.
- **Paging (pass two; removed in pass three).** The desktop rail used to show whole blocks a page at a time, carry a paragraph over
  between two lines and turn the page with a `MORE` row. Pass three replaced all of it with a scrolling sheet in the same box (section
  10); `guideFit.ts`, the `MORE` row, the fit and its tests are parked on `F:/pyrefly-parked/2026-10-03/guide-sheet/`.
  The box itself (the "Rail box" bullet above) is what the sheet fills.
- **Phone.** The sheet (370x410 at (10,66) at 390x844) holds the whole document and scrolls; it opens scrolled to the boss's header
  once laid out. `G`, the chip and the pause row work as before.
- **Left unfixed, pre-existing:** the phone sheet is translucent, so faint HUD text ("2ND IN QUEUE ...") shows through behind
  its header (also in the first pass's screenshots).

## 4. The separation, and the proof

- **No advisor, tactic, bench or battle file changed.** `git diff origin/main` lists nothing under `src/engine/tactics/`,
  `src/battle/**` or the data folders except the new `src/data/guides/doc-types.ts` and `src/data/guides/docs/`; the 18
  `src/data/guides/<chapter>.ts` and `types.ts` are identical to origin/main (content, ignoring line endings). The eight tactic and
  bench files that `git status` lists as modified in this worktree (six under `src/engine/tactics/`, `isaaru-tactic-bench.test.ts`
  and `fallenAeonsDrive.ts`) are byte-identical to origin/main by blob hash; the listing is a line-ending artefact and they are not
  staged.
- **The advisor's outputs are byte-identical.** `advisor-digest.mjs` (scratch, `D:/Tools/pyrefly-scratch/2026-10-03/jegged/work/`)
  plays every chapter with the shipped `intendedStrategy` on seeds 1 to 5 (90 runs, 8,256 decisions, no error) and hashes, at every
  decision, the whole advisor view, the tactic's command and the legacy guide NEXT the advisor borrows. Overall digest on
  origin/main (an export of f4244e1f; the two commits since are critic records only): `cc10c48f8757f72d07c44a7986c06e4b69b3d9d42e53cef6757dd8cb77ae425d`.
  On the final branch tree: `cc10c48f8757f72d07c44a7986c06e4b69b3d9d42e53cef6757dd8cb77ae425d`. All 90 per-run digests match.
- **Structurally** (`tests/unit/guide-doc-separation.test.ts`, 28 tests): the panel, `guideDoc.ts`, `guideDocHtml.ts`,
  `guideFit.ts` and the documents import no tactic, no advisor, no `BattlePresenter` and no `intendedStrategy`; the documents
  import only their own types; no tactic, advisor or guide-data module imports a document; the move advisor panel does not import
  the guide panel; the line data and evaluator are gone; the panel has no way to follow a decision or a held command.
- **Test files that changed outside the panel's own:** `advisor-v3-final.test.ts` (the rail's two assertions and the
  "FFX-2 HUD hands the rail the held command" test are removed because the rail takes no held command; the C2-B1 test is renamed
  "not the NEXT the advisor borrows" and still checks `buildGuideView`; the advisor and golden filters run 48 files, 412 tests,
  410 pass, 2 skipped, against 413 and 411 before: that one test), `guide-ffx2-wait-habit.test.ts` (its last test pinned the habit
  line on the panel; it now pins that the panel prints the page and never that line; the data-level tests are unchanged),
  `tests/e2e/ffx2-ixion.spec.ts` (comments only: `guideNext` finds no NEXT section and the spec already fell back to its own pick).
  `strategy-guide.test.ts`, `isaaru-tactic-bench.test.ts` and `fallenAeonsDrive.ts` are identical to origin/main again.

## 5. The wording proof

`tests/unit/guide-doc-words.test.ts` (37 tests) fails on `/jegged|adapt|source|cite|citation|§|research\/|docs\/|\.ts\b|\bD-\d{3}\b|\bPR-\d{4}\b|walkthrough guide|according to/i`
in every string of every document (headers, tags, stat lines, list items, table cells, hint titles), and in the text, attributes and chip
of the mounted panel for each of the 18 documents. Result: no match. `.sgd__cite` is gone. Headless Chromium on the built game agrees
(section 6): 0 forbidden words in the visible text of all eight scenarios. The sentences are paraphrased: a word-run overlap check
of every document against the saved pages leaves 19 lines that share a run of seven or more words with a page, and every one is a
heading, a loot row or a list of game terms.

## 6. Proof in a browser

Headless Chromium in GPU mode (`PYREFLY_BROWSER=gpu`), one browser, driven from node with real input (a tap on the GUIDE chip on the
phone, real clicks on `MORE`, the `G` key, the mouse wheel on the sheet), against the built game served from scratch on port 6402
(stopped by its PID afterwards); battle help is off in the seed save so the coach does not cover the rail. All eight scenarios: 0
console errors, 0 forbidden words, 0 elements wider than their box, nothing under 14 px, `G` hides the panel and `G` brings it back.
From a save with the guide switched off, a real `G` opens it on the document (Ch. I and Ch. IV on the desktop: the boss's header
and tag, `MORE` showing, no overflow, the chip reading "G hide guide").

| Scenario | Box | Smallest effective type | Reading it |
|---|---|---|---|
| Ch. I Flux, 1600x900 | rail 330x173 at (53,110) (max 177) | 14.25 px | opens on the header and the description; 6 pages by real clicks (the whole document is 14 pages); no vertical overflow |
| Ch. I Flux, 390x844 | sheet 370x410 at (10,66), 1,391 px of content | 15 px | opens scrolled to the header (235 px); wheel reaches the end (981 px); nothing overflows sideways |
| Ch. II Yunalesca, 1600x900 | rail 330x114 at (53,110) on the opening page, up to 174 | 14.25 px | opens at Form I's header; 6 pages (14 in all) |
| Ch. II Yunalesca, 390x844 | sheet 370x410, 1,318 px | 15 px | opens at 215 px; end at 908 px |
| Ch. IV Bahamut, 1600x900 | rail 330x218 at (53,220) (max 230) | 14.25 px | 6 pages by click (5 in all); the move advisor's card sits beside it |
| Ch. IV Bahamut, 390x844 | sheet 370x410, 711 px | 15 px | opens at 152 px; end at 301 px |
| Ch. V Vegnagun, 1600x900 | rail 330x298 at (53,220) | 14.25 px | opens on the Tail's page; 6 pages by click (the five-link document runs past 60) |
| Ch. V Vegnagun, 390x844 | sheet 370x410, 4,816 px | 15 px | opens at 69 px (the Tail's header); end at 4,406 px |

**No line is cut on any rail page.** A second real-click run read every unit on every page of Chapters I, II, IV and V (72, 72, 39
and 964 text lines, the last being the first 70 pages of the five-link document; 8, 4, 2 and 16 paragraphs carried over a page): every unit sits wholly inside the panel with at least 8.7 px
to spare, and no line of a carried-over paragraph is cut. The only boxes flagged are headings and labels whose font box overhangs
their own box by at most 2.5 px, inside the panel (`clip-check.mjs`, scratch).

Screenshots, `docs/screenshots/r38-guide-jegged/doc/` (4.7 MB, 44 files; `ch1-flux`, `ch2-yunalesca`, `ch4-bahamut`,
`ch5-vegnagun`, then `1600x900` or `390x844`): `-guide-on` for all eight (full frame on desktop, where the advisor card shows
beside the guide); on the desktop `-guide-page2` to `-page6` (cropped to the rail), and for Ch. I and Ch. IV `-guide-off` (the
chip alone) and `-guide-g-open` (after a real `G`; Ch. IV's frame has Bahamut's CHARGING banner crossing the foot of the rail,
the HUD's own overlay); on the phone `-chip` (the folded state), `-guide-scrolled` and `-guide-end`. The first pass's fifteen PNGs of the removed NEXT card (8.2 MB, directly in
`docs/screenshots/r38-guide-jegged/`) are parked under `F:/pyrefly-parked/2026-10-03/guide-doc/docs/screenshots/r38-guide-jegged/`
and removed from this branch's tip; they stay in its history.

## 7. For Bailey to decide

1. **How the desktop reads a long page. DECIDED and built in pass three** (Bailey, ~21:35, "All your recommendations"): option (B), a
   scrolling reading sheet like the phone's. Section 10 has what it does, where it sits and why it is no bigger than the old rail.
   (Original note, pass two: the rail showed 6 lines a page in FFX and 8 to 12 in FFX-2, so Chapter I's page was 14 pages long,
   Yunalesca's 14, Bahamut's 5 and the five-link Vegnagun document ran past 60; options were (A) keep the rail, (B) the scrolling
   sheet, (C) a wider rail.)
2. **The Wait-split habit line** ("Pick a command at once. Until you do, the clock still runs.", approved 2026-09-25 for Chapters
   V and VI) is not on the panel any more: the page has no such line and the instruction is nothing of ours. It still lives in the
   guide data the advisor reads. Options: leave it out, or print it as a one-line note above the page for FFX-2 under Wait.
3. **The "GUIDE'S PICK" tag (D-359, adopted, not scheduled)** is advisor UI and untouched. It compares the advisor's pick with the
   tactic's NEXT (`buildGuideView`), a pick the guide panel no longer shows, so the tag's label is now misleading.
4. **"Kept though not doable"** advice (section 2) reads as a promise the chapter's kit cannot keep (Lulu's Bio, Holy, the Mix
   ingredients). The instruction is nothing of ours, so each stays as the page gives it; chapter-specific notes would be ours.
5. **One drop each.** Where the page lists a rarer second drop the game does not award, the panel prints the one the game does.
   Natus's "None" and the Nodes' Hero Drink are the two where the data itself is open (research section 11).
6. **StrategyGuide.ts was 668 lines** (826 before). **Closed in pass three:** the paging code is gone and the file is 399 lines,
   with the scroll arithmetic in `guideScroll.ts` (the 400-line convention, AGENTS.md rule 7).
7. **Record the instruction. Done on `main`** (f3389dfc): D-362, D-364 to D-367 hold the ~18:35 and ~21:35 sentences (D-350 holds the
   first three). D-364 and D-366 say `delivery: in-progress`; pass three is what builds them, and D-364 wants Bailey's word on the
   screenshots before it ships.
8. **The cure-hint card and the guide share a small rail. DECIDED and built in pass three** (Bailey, ~21:35): the card moves out of the
   guide into a box of its own, the first row of the guide's column (section 10). (Original note, pass two: while a party member has
   a status with a sourced rule the card rode at the top of the guide's panel and the page got what was left of the rail, one block
   at a time on FFX-2 Chapter IV.)

## 8. Gates

- `npx tsc --noEmit` (run as `node .../typescript/bin/tsc --noEmit` from the worktree): clean; the e2e config too.
  `node tools/orphans.mjs`: 24 orphaned modules, the same 24 as before (none in the guide's files).
- Full unit suite, `--maxWorkers=3`. First run, just before the wait-habit test was updated: 781 files, 11,466 tests, 11,423 passed,
  41 skipped, 1 todo, **1 failed**: `guide-ffx2-wait-habit.test.ts` (its panel test pinned the habit line; updated, the file passes,
  9 of 9). Final run on the final tree (`full-suite-final.log`, scratch): 781 files, 11,467 tests, 11,424 passed, 41 skipped,
  1 todo, **1 failed**: `strategy-ffx2-bahamut.test.ts`, "heal-only route", a 15-second timeout while other agents' work shared the
  machine (the known load timeout, as in the first pass); it passes alone, 19 of 19 in 13.9 seconds. Every other file passed.
- New tests: `guide-doc` 28, `guide-doc-start` 12, `guide-doc-words` 37, `guide-doc-separation` 28, `guide-doc-render` 12 (including the
  carried-over-paragraph test and the hint-card re-fit test), `strategy-guide-phone-sheet` 3. Updated: `strategy-guide-fold`, `strategy-guide-scale` (a comment),
  `ui-strategy-guide`, `advisor-v3-final`, `guide-ffx2-wait-habit`, `helpers/guideLayoutStub.ts`.
- Advisor digest and the advisor and golden test files: section 4.
- E2E (Playwright, against `vite preview` builds served from scratch): `hud-collision.spec.ts` for Chapters I, II, IV and V at four
  viewports, on the branch and on origin/main: 16 of 16 pass on each (it is a measuring stick; the numbers are in section 3);
  `advisor-zone.spec.ts` fails 12 of 12 on the branch with a TypeError in the spec's own page code (it reads
  `__pyrefly.battle().hud.el`, which is undefined), and the one test run against the origin/main build fails with the identical
  error, so it is already broken there; not touched, and it says nothing about this change.
- Servers started: two `vite preview` servers, port 6402 (the branch build) and port 6403 (a build of origin/main for the
  measurement), both stopped by their PIDs; nothing else left listening.

## 9. Files

**New:** `src/data/guides/doc-types.ts`; `src/data/guides/docs/` (`index.ts` and the 18 documents); `src/ui/common/guideDoc.ts`,
`guideDocHtml.ts`, `guideFit.ts`; `tests/unit/guide-doc.test.ts`, `guide-doc-start.test.ts`, `guide-doc-words.test.ts`,
`guide-doc-separation.test.ts`, `guide-doc-render.test.ts`, `strategy-guide-phone-sheet.test.ts`, `helpers/guideDocStrings.ts`;
`docs/screenshots/r38-guide-jegged/doc/`.

**Changed:** `src/ui/common/StrategyGuide.ts` and `strategy-guide.css` (the document panel, no NEXT, WATCH or RULES, no fit ladder,
the fit keyed on the hint card's height),
`comfort.css` (one rule), `src/ui/ffx/FFXBattleHud.ts` and `src/ui/ffx2/FFX2BattleHud.ts` (the removed calls and option); the
tests named in section 8; `docs/handoff/bp1-strategy-guide.md` (the superseded parts marked again); this note.

**Removed, parked on `F:/pyrefly-parked/2026-10-03/guide-doc/` first:** `src/data/guides/line-types.ts`, `src/data/guides/lines/` (19
files), `src/engine/tactics/guide-line.ts` and `guide-line-board.ts`, `tests/unit/guide-line.test.ts`, `guide-line-bench.test.ts`,
`guide-line-separation.test.ts`, `guide-line-words.test.ts`, `tests/unit/helpers/guideLineDrive.ts`.

**Not touched (identical to origin/main):** `src/engine/tactics/**` (including `guide.ts`, every `advisor*.ts` and every chapter
tactic), `src/battle/**`, `src/data/ffx/**`, `src/data/ffx2/**`, the 18 `src/data/guides/<chapter>.ts` and `types.ts`, every bench.

**Scratch, outside the repo** (`D:/Tools/pyrefly-scratch/2026-10-03/guide-doc/`): the saved pages and card screenshots, `doc-shots.mjs`
and `g-open.mjs` (the browser proof), `clip-check.mjs`, `probe-rail.mjs`, `probe-chk.mjs`, `ledger-scan.py`, `omit-scan.py`,
`numword-scan.py`, `loot-compare.py`, `overlap.py` (the comparisons used to write the ledger above), `chk-compare.py` and
`chk-table.py` with the CHK-008 reports (`chk-fixed/`, `chk-main/`, and `chk-keep/` with the first run, before the fit fix), the
two builds (`dist-doc/`, `dist-main/`), the digests and the full-suite logs.

## 10. Reading view (pass three)

Bailey, 2026-10-03 ~21:35 EDT, "All your recommendations please thank you <3 I love you Claude" (D-364 to D-367 on `main`), taking the
driver's recommendations on section 7: **(b)** (D-364) on the desktop a scrolling reading view like the phone's instead of paging the side rail, with a screenshot shown to
him before it ships; **(c)** the Wait-split habit line stays out of the guide (D-365; it is: nothing changed); **(d)** the status hint cards
move out of the guide into their own card so they no longer squeeze the page (D-366); **(e)** advice the chapter's kit cannot follow is
printed exactly as the page gives it, no notes of ours (D-367; it is: nothing changed). **Game case: both** (AGENTS.md rule 14): the sheet, its
scrolling, its column and the card's slot are shared plumbing, no line of the change reads which game is on, and each game keeps the
rule it already had (FFX's CTB waits at the menu and fades the guide layer while an action plays; FFX-2's ATB runs as the X-2 BATTLE
setting says and A-15 steps the column back from an action). Proved on FFX Chapters I and II and FFX-2 Chapters IV and V. Paper
preflight: `docs/plans/r38-guide-sheet-review.md` (`critic-plan` classes the change DEEP after deploy; nothing is save-data class).

### What the player gets

- **The whole page, scrolling.** The desktop guide is a reading sheet like the phone's: every block of the boss's page is in it, nothing
  is paged, fitted, cut or hidden, and the `MORE` row is gone. It **opens scrolled to the boss that is standing** with only the empty gap
  above the header showing (no half line of the block before it); `G` off and on again opens it there again; a new boss (Anima over
  Seymour, the next link of a chain, Yunalesca's next phase) takes it to that boss; the player's own place is kept while the fight goes
  on, through menus, actions and the hint card coming and going.
- **Scrolling:** the mouse wheel, the thin accent scroll bar (draggable; drawn in stage px so it scales), `[` and `]` a page (85 percent
  of the sheet) up and down, `Home` and `End` the top and the foot, and the pad's right stick. These are the keys nothing else in a battle
  uses (`PageUp` and `PageDown` are L1 and R1 in `Input.ts` and `rawInput.ts`, the arrows and `W`/`S` are the menu's). **The wheel needed
  its own arithmetic:** the stage is scaled (2.5x at 1600x900) and a browser applies a wheel's pixels to a scroll offset as they are, so
  a notch moved the sheet 250 screen px, three and a half times what it shows; `guideScroll.ts` converts by the scale the sheet is drawn
  at, and a notch now moves the text 100 screen px at every scale (measured 100.0 at 2.5x, 101.2 at 2.81x).
- **Open and close:** `G`, the chip and the pad's spare face button, as before. Closed, only the chip stays. The pause row still sets
  the saved preference (`guideVisible`) for later battles; it has never toggled the guide of the battle that is running (no code reads
  the setting after the constructor), and that is unchanged.
- **The battle does not wait for it, in either game, exactly as it does not wait for the rail today.** The sheet is a passive HUD panel in
  the rail's own box; opening, scrolling and closing it sends nothing to the battle (none of its keys is bound to a command and the
  wheel listener is on the sheet alone). FFX (CTB): the battle holds at the command menu with or without it, and `.ffxhud--acting` fades
  the guide layer while an action plays, as for the rail. FFX-2 (ATB): the clock runs as the player's X-2 BATTLE setting says, the sheet
  never changes it, and A-15 steps the column back (`ActionFade` reads `.sgd__stack`, unchanged) while an action plays over a figure it
  meets with no menu open. Because the sheet's box is the rail's box it blocks the view of an action no more than the rail did
  (measured below). **No hold was built:** the pause overlay is the only freeze (`BattleScreen.pauseGate`), a reading mode that held the
  FFX-2 ATB would be new pause plumbing in `BattleScreen` and the presenter, and a bigger sheet would cover figures (next section);
  neither was asked for when the box can be kept.

### Where it sits, and why it is no bigger than the rail

The sheet fills the box the rail has always had: left 21.33 and width 132 grid px, from below the banner (below the boss strip in FFX-2) to
the fence above the command help slab (FFX) or above the party's heads (FFX-2). At 1600x900 that is 330 x 178 px in FFX (about 8 lines of 14.25 px type at once, with a scroll bar), 330 x 173 in FFX-2 Chapter IV (about 8 lines) and 330 x 260 in Chapter V (about 12); the same box in grid px at every other size. That box is the one place free of
the HUD and the painted figures in every chapter; it is also all that is. A lane scan of all 18 chapters at 1600x900 (the first command menu;
a card 136 x 44 grid px stood right of the column, top-aligned with it) finds a painted figure under it in 6 chapters (IV Bahamut 5,205 px,
V Vegnagun's Tail 32,265, VI Paine's face 869, XIII Paragon 9,303, XVII the Left Fin 17,028, XVIII Sin 2,235), the intent card or a
chapter panel in 3 more without a figure (IX 744, XV 5,899, XVI 8,760), and, in FFX, the move advisor's own box in 8 of the 11 chapters
(it would have to move). A wider or taller sheet in that lane covers the fight. A reading mode that covers the field on purpose
(dimmed, the battle held, `G` or `Esc` to leave) is the other way to a larger sheet; it is not built because the hold touches
`BattleScreen` and the presenter for FFX-2's ATB, and the brief's alternative is to keep the box.

### What it covers, against origin/main

Three measures, each of the guide's column (`.sgd__stack`, the card's slot and the sheet; the panel alone as well where it differs) against every painted figure's box
(the painted quad's bounding box; "face" is its upper third), as CHK-008 reads them (`tests/e2e/hud-collision.spec.ts`), on this build and on a build of origin/main
(a6b79313; `main` is two docs-only commits later, 77f0d157), same seeds, real input, one browser:

1. **The CHK-008 states** (`coverage.mjs`): the first menu with every optional panel open, a submenu, that submenu cancelled, the target cursor, the numerals resolving;
   Chapters I, II, IV and V at 1280x720, 1600x900, 2000x1012 and 2560x1440. The whole column is measured as well as the sheet's panel, because on origin/main the old
   panel ran past its column when its text was long (the latent bug pass two found), so the column alone understates what that rail painted.
2. **The first command menu in all 18 chapters at the same four sizes** (`lanescan.mjs`, 72 runs on each build).
3. **Clearance** in the seven FFX-2 chapters: how far the column's bottom edge is above the nearest figure that stands under it, over every run taken on this build.

Per chapter, summed over the four viewports (states reached: the first menu with every panel open, a submenu, that submenu cancelled, the target cursor, the numerals resolving):

| Chapter | States where the guide column touches a figure, sheet / main | Overlap with figures, column (px), sheet / main | Overlap, the sheet or panel alone (px), sheet / main | Face hits (upper third of a figure), sheet / main | Column height at 1600x900 (px), sheet / main |
|---|---|---|---|---|---|
| I Flux (FFX) | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 178 / 168 |
| II Yunalesca (FFX) | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 178 / 168 |
| IV Bahamut (FFX-2) | 0 / 10 | 0 / 7,963 | 0 / 50,767 | 0 / 11 | 173 / 230 |
| V Vegnagun (FFX-2) | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 260 / 302 |

Per viewport (column overlap with figures in px summed over the states reached, sheet / main; "-" is none):

| Chapter | 1280x720 | 1600x900 | 2000x1012 | 2560x1440 |
|---|---|---|---|---|
| I Flux (FFX) | - / - | - / - | - / - | - / - |
| II Yunalesca (FFX) | - / - | - / - | - / - | - / - |
| IV Bahamut (FFX-2) | - / 708 | - / 1,065 | - / 3,906 | - / 2,284 |
| V Vegnagun (FFX-2) | - / - | - / - | - / - | - / - |

All 18 chapters, the first command menu, the column against the painted figures and the other HUD panels, this build / origin/main:

| Size | Chapters whose column touches a painted figure, sheet / main (of 18) | Overlap with figures (px), sheet / main | Face hits (upper third), sheet / main | Column over another HUD panel (px), sheet / main |
|---|---|---|---|---|
| 1280x720 | 0 / 1 | 0 / 79 | 0 / 1 | 0 / 0 |
| 1600x900 | 0 / 1 | 0 / 97 | 0 / 1 | 0 / 0 |
| 2000x1012 | 0 / 1 | 0 / 62 | 0 / 1 | 0 / 0 |
| 2560x1440 | 0 / 1 | 0 / 165 | 0 / 1 | 0 / 0 |

Every chapter with a nonzero overlap on either build:
- ffx2-bahamut 1280x720: sheet none | main yuna 79
- ffx2-bahamut 1600x900: sheet none | main yuna 97
- ffx2-bahamut 2000x1012: sheet none | main yuna 62
- ffx2-bahamut 2560x1440: sheet none | main yuna 165

Clearance of the FFX-2 column above the nearest figure (grid px, stage units; 2.5 screen px each at 1600x900), the smallest to the largest over the four sizes and every run on this build (the 18-chapter scan and four repeats of the four chapters that matter: the girls stand in different places from run to run):

| Chapter | Column clearance above the nearest figure (grid px), this build, smallest to largest | origin/main (one scan, four sizes) |
|---|---|---|
| IV Bahamut | 21.3 to 23.5 (20 of 20 runs with a figure under it) | -1.2 to -0.8 (4 of 4 runs with a figure under it) |
| V Vegnagun | nothing under the column (4 runs) | nothing under the column (4 runs) |
| VI Leblanc | 12.1 to 15.0 (20 of 20 runs with a figure under it) | 1.5 to 3.5 (4 of 4 runs with a figure under it) |
| XI Fallen Aeons | 18.8 to 21.0 (20 of 20 runs with a figure under it) | 10.3 to 11.0 (4 of 4 runs with a figure under it) |
| XIII Trema | 7.7 to 10.0 (20 of 20 runs with a figure under it) | 8.3 to 9.9 (4 of 4 runs with a figure under it) |
| XVI Den of Woe | 21.3 to 22.2 (4 of 4 runs with a figure under it) | 11.5 to 12.5 (4 of 4 runs with a figure under it) |
| XVII Ixion | 21.0 to 23.0 (4 of 4 runs with a figure under it) | 11.8 to 13.3 (4 of 4 runs with a figure under it) |

runs on this build: 92; with the column touching a figure (clearance 0 or less): 0

Reading it. **This build's column touches no painted figure in any chapter at any size, in any state or run measured; origin/main's touches Yuna in Chapter IV at all four sizes** (79, 97, 62 and 165 px at the first menu; 10 states and 7,963 px by the column, 50,767 by the panel that ran past it, in the CHK-008 states). Chapters I, II and V touch no figure on either build. No other HUD panel is under the column on either build. In FFX the column is the rail's full box, 178 px at 1600x900 where origin/main's was 168 by its content; the extra 10 px is empty sky and 0 px of any figure at any size in the 11 FFX chapters.

FFX-2 is where the sheet's fill-the-box habit has a cost. The column's floor is the fence the HUD parks on the topmost girl standing in the rail's column (`layoutFences`), and a sheet that fills its column reaches that fence every time, where the old rail was often content-sized and short of it. A painted box also reaches above her head: Chapter XIII's Yuna by about 20 grid px. So the gap above the fence was settled by measuring, not guessing (`FENCE_GAP` in `StrategyGuide.ts`): 5 (a panel's own clearance) was above origin/main in Chapter IV at three of the four sizes (778, 1,623 and 2,596 px against 708, 1,065 and 2,284); 8 touched Yuna's box in XI and XIII; 14 left XIII touching; 20 touched XIII by a pixel at two sizes in the second of two scans (25 and 98 px); 24 cleared every run but by as little as 0.5 grid px; **28 keeps at least 7.7 grid px above her in XIII over 20 runs, which is what origin/main's rail kept (8.3 to 9.9)**. It costs FFX-2's sheet height: Chapter IV 173 px against 230 at 1600x900, V 260 against 302, VI 140 against 168, XI, XVI and XVII 188 against 211; XIII is taller, 213 against 211, because its girls stand lower; the column's height in FFX-2 is the fence's, so it also moves with who holds the menu (two values at 2000x1012 in Chapter IV across runs). The document scrolls, so the cost is lines on screen, not lines of the page; if Bailey would rather have the height and accept a corner of Yuna's box in two chapters, that one number is the knob.

A more exact fence is possible (park it on the painted box's top instead of the head, in `FFX2BattleHud.layoutFences`, which would give the height back where the box sits close to the head) but it changes the HUD's shared fence and the advisor's lane code, and was left alone.

No console error on either build over any of those runs, and no failed run.

### The cure-hint card (D)

It stands in its own box, `.sgd__slot`, the first row of the guide's column, above the sheet, outside the document: `statusHintCard.ts` puts
it there while the guide is open and on the desktop, and the column is a flex column, so the sheet gives the card its height and takes it
back (the page is never re-fitted, cut or re-opened, and its scroll position stays). Same content and triggers as today: BATTLE HELP on, a
decision open, a living party member with a status that has a sourced rule (FFX Zombie, Sleep, Silence, Curse; FFX-2 Sleep, Silence,
Curse); the full rule where it fits and the one-sentence rule where the sheet beside it would be left under 26 grid px; where even that
is too much (FFX at 1280x720) it stands alone in the column and the sheet steps aside while the status lasts, as the approved O3 frame
draws the card. With the guide folded (`G`) it stands at its approved O3 place in the stage, as today; the phone's card is the phone's and
is untouched. The box is the old rail's box, so it covers nothing more than the in-panel card did; the numerals, the intent slab and the
message banner still dodge it (`.sgd__slot > .sthint` in the five avoid lists). A real status needs no probe: Bahamut's fixed pattern lands a Curse within seconds in Chapter IV, and in Chapter I Yuna is a Zombie at the first menu with seed 3 (the two screenshots of the card).

**It still shortens the sheet while a status lasts** (the column is the only free place; see the lane scan above): in FFX at 1600x900 the
sheet beside the card is 86 px (3 lines) against 178 px, and in FFX-2 Chapter IV 81 px (3 lines) against 173; the page behind it is whole and
scrolls, and the card is the one thing that is more important than the page while it is up. At TEXT SIZE 115 the card stands alone at 1280x720 and the sheet keeps 74 and 85 px beside it at 1600x900 and 2000x1012; at 130 it stands alone at all three sizes (the section below). Alternatives, if Bailey would rather the
sheet kept its room: the card in the move advisor's lane (FFX: the advisor would give way, as it does when the guide is folded, and the lane
covers a figure in 2 of the 11 chapters; FFX-2: the lane covers a figure in 4 of the 7), or the card replacing the sheet while it is up
(the O3 frame as drawn).

The card in its slot against the card inside the guide's panel (the branch as pass two left it): the status held on a party member as the HUD
sees it by a labelled presentation probe (`lib.mjs` `injectStatus`; the engine and the game data are untouched), BATTLE HELP on, FFX Chapters I and
II a Zombie, FFX-2 Chapter IV a Curse on Paine and Chapter V a Sleep on Rikku, at the four desktop sizes, then the guide folded with a real `G`,
then the status released. The card's own box, the sheet beside it, the column now and before, what the card covers, and where the folded card stands:

| Chapter | Viewport | Card (px) | Sheet beside it (px high) | Column, now / before (px high) | Card over figures | Folded-guide card place |
|---|---|---|---|---|---|---|
| I (FFX, Zombie on Kimahri) | 1280x720 | 264x100 at (43,88) | none: the card stands alone, the sheet steps aside | 105 / 142 | none | the same place (42,62) |
| I (FFX, Zombie on Kimahri) | 1600x900 | 330x85 at (53,110) | 86 | 178 / 178 | none | the same place (53,78) |
| I (FFX, Zombie on Kimahri) | 2000x1012 | 371x94 at (160,124) | 98 | 200 / 200 | none | the same place (160,88) |
| I (FFX, Zombie on Kimahri) | 2560x1440 | 528x132 at (85,176) | 142 | 284 / 284 | none | the same place (85,125) |
| II (FFX, Zombie on Tidus) | 1280x720 | 264x100 at (43,88) | none: the card stands alone, the sheet steps aside | 105 / 142 | none | the same place (42,62) |
| II (FFX, Zombie on Tidus) | 1600x900 | 330x85 at (53,110) | 86 | 178 / 178 | none | the same place (53,78) |
| II (FFX, Zombie on Tidus) | 2000x1012 | 371x94 at (160,124) | 98 | 200 / 200 | none | the same place (160,88) |
| II (FFX, Zombie on Tidus) | 2560x1440 | 528x132 at (85,176) | 142 | 284 / 284 | none | the same place (85,125) |
| IV (FFX-2, Curse on Paine) | 1280x720 | 264x80 at (43,176) | 54 | 138 / 184 | none | the same place (42,184) |
| IV (FFX-2, Curse on Paine) | 1600x900 | 330x85 at (53,220) | 81 | 173 / 206 | none | the same place (53,230) |
| IV (FFX-2, Curse on Paine) | 2000x1012 | 371x117 at (160,247) | 109 | 233 / 229 | none | the same place (160,259) |
| IV (FFX-2, Curse on Paine) | 2560x1440 | 528x132 at (85,352) | 134 | 276 / 324 | none | the same place (85,368) |
| V (FFX-2, Sleep on Rikku) | 1280x720 | 264x100 at (43,176) | 103 | 208 / 236 | none | the same place (42,184) |
| V (FFX-2, Sleep on Rikku) | 1600x900 | 330x106 at (53,220) | 148 | 260 / 288 | none | the same place (53,230) |
| V (FFX-2, Sleep on Rikku) | 2000x1012 | 371x117 at (160,247) | 168 | 292 / 319 | none | the same place (160,259) |
| V (FFX-2, Sleep on Rikku) | 2560x1440 | 528x164 at (85,352) | 242 | 416 / 456 | none | the same place (85,368) |

In all 16 cases the card is a child of `.sgd__slot` and not of the sheet, inside the column and clear of the sheet, over no painted figure, 0 console
errors; after the status is released no card is left and the sheet is where it was (14 cases read the same scroll position; in the 2 where the card stood alone and the sheet was hidden it reads 107, 84 again, the places it opened at). Folded (`G`) the card stands at its approved O3 place, the box it
stood in before, in all 16. The move advisor is untouched and its overlap with the figures is the same on both builds within the run-to-run noise of the
formation (FFX: 0 in all eight cases; Chapter IV: 8 to 346 px; Chapter V: 22,219 to 46,371 px, which is Vegnagun's size, within 2 percent of the branch before). The phone's card is the phone's (a child of the HUD's own stage, not of the guide, in 4 of 4 chapters), which this pass did not touch.

### TEXT SIZE 115 and 130 percent

`text-size.css` grows FFX's guide column from its top left corner by its individual `scale` (1.15 or 1.3), and the layout cannot see a transform.
**Found by running the check, and fixed:** a column that fills the room it is given (the old panel was content-sized and 10 px short of it) ended 3 px
inside the command help slab at 130 percent in FFX Chapter I (`ig-cutin__info x sgd__stack`, 420x3 px at 1600x900 and 472x4 at 2000x1012). That is the
failure `tests/e2e/accessibility-a2.spec.ts` checks ("no panels overlapping", `ix > 2 && iy > 2`), and that spec has not reached the check on any build: its
first assertion, the command menu's `▼` glyph clipped at 130 percent, fails on origin/main too (3 of its 5 tests, the same on both builds) and stops it
before the overlap checks. `drawnScale` (`guideScroll.ts`) reads the column's own `scale` and `layout()` gives the column the room divided by it, so the
grown column ends where it ends at 100 percent: the sheet no longer grows with the type (142 to 205 px in FFX Chapter I over the three sizes and two TEXT SIZES, against origin/main's 154 to 245, whose content-sized panel grew into the free room above the slab). A unit test pins the arithmetic (`ui-strategy-guide.test.ts`).

Measured with a2's own panel list and its three tests (overlap, off screen, clipped text), plus the same clipped-text test over the guide and the card,
at TEXT SIZE 115 and 130 in FFX Chapter I and FFX-2 Chapter IV, on origin/main and on this build (`textsize-check.mjs`):

| Chapter | Size | TEXT SIZE | Overlapping panels, main / sheet | Off screen, main / sheet | Clipped text in the guide, main / sheet | Column (px), main / sheet |
|---|---|---|---|---|---|---|
| I Flux (FFX) | 1280x720 | 115 % | none / none | none / none | none / none | 154 / 142 |
| I Flux (FFX) | 1280x720 | 130 % | none / none | none / none | none / none | 174 / 146 |
| I Flux (FFX) | 1600x900 | 115 % | none / none | none / none | none / none | 193 / 177 |
| I Flux (FFX) | 1600x900 | 130 % | none / none | none / none | none / none | 218 / 182 |
| I Flux (FFX) | 2000x1012 | 115 % | none / none | none / none | none / none | 217 / 200 |
| I Flux (FFX) | 2000x1012 | 130 % | none / none | none / none | none / none | 245 / 205 |
| IV Bahamut (FFX-2) | 1280x720 | 115 % | none / none | none / none | none / none | 184 / 138 |
| IV Bahamut (FFX-2) | 1280x720 | 130 % | none / none | none / none | none / none | 184 / 138 |
| IV Bahamut (FFX-2) | 1600x900 | 115 % | none / none | none / none | none / none | 230 / 173 |
| IV Bahamut (FFX-2) | 1600x900 | 130 % | none / none | none / none | none / none | 230 / 173 |
| IV Bahamut (FFX-2) | 2000x1012 | 115 % | none / none | none / none | none / none | 259 / 233 |
| IV Bahamut (FFX-2) | 2000x1012 | 130 % | none / none | none / none | none / none | 298 / 194 |

Problems on the sheet build over those rows: 0. Console errors: main 0, sheet 0.

FFX-2's TEXT SIZE is off (`data-text-size-wide` ships off until D-220 Q4) and was not touched, so its rows differ between 115 and 130 only by where the girls stand in each run (the fence on their heads sets the column's floor).

With a cure-hint card up (FFX Chapter I, a Zombie on Kimahri, BATTLE HELP on; `hint-textsize.mjs`):

| Size | TEXT SIZE | Card (px), main (in the panel) / sheet (in the slot) | Sheet beside the card (px high), main / sheet | Overlapping panels, main / sheet | Off screen / clipped, sheet | Card type (px), main / sheet |
|---|---|---|---|---|---|---|
| 1280x720 | 115 % | 269x105 (sgd__panel) / 304x83 (sgd__slot) | 138 (the panel as a whole) / none: the card stands alone | none / none | none / none | 15 / 15 |
| 1280x720 | 130 % | 304x91 (sgd__panel) / 343x88 (sgd__slot) | 127 (the panel as a whole) / none: the card stands alone | none / none | none / none | 15.6 / 15.6 |
| 1600x900 | 115 % | 336x99 (sgd__panel) / 380x96 (sgd__slot) | 139 (the panel as a whole) / 74 | none / none | none / none | 17.25 / 17.25 |
| 1600x900 | 130 % | 380x110 (sgd__panel) / 429x107 (sgd__slot) | 156 (the panel as a whole) / none: the card stands alone | none / none | none / none | 19.5 / 19.5 |
| 2000x1012 | 115 % | 378x110 (sgd__panel) / 427x107 (sgd__slot) | 155 (the panel as a whole) / 85 | none / none | none / none | 19.4 / 19.4 |
| 2000x1012 | 130 % | 428x124 (sgd__panel) / 482x120 (sgd__slot) | 175 (the panel as a whole) / none: the card stands alone | none / none | none / none | 21.93 / 21.93 |

Problems on the sheet build over those rows: 0. Console errors: main 0, sheet 0.

The card's type is the same size on both builds. At 130 percent the card stands alone in the column at all three sizes (the sheet steps aside while the status
lasts), which is the rule the card already had where the sheet beside it would be left under 26 grid px.

### The phone is unchanged

Same four chapters, same 390x844 browser, the build before this pass (the branch as pass two left it) against this one, a real tap on the
GUIDE chip: the stack's and the sheet's boxes and computed styles, every unit's box and computed type (22, 25, 16 and 100 units), the
text, the scroll position the sheet opens at (235, 215, 152, 69 px), where a 700 px swipe-wheel lands, the end of the document (981,
908, 301, 4,406 px), the chip and the folded and closed states: **identical, 0 differences** (`phone-compare.mjs`, `phone-diff.mjs`). A
pixel diff of Chapter I's open sheet: 0 of 601,880 pixels differ by more than 24/255 (largest difference 3), and the bright (type) pixels
differ in 1 of 65,448 (65,447 before, 65,448 after). The desktop-only rules are scoped `html:not([data-phone-battle])`, the phone keeps its own opening lead, and its
wheel is left to the browser.

### Proof in a browser (pass three)

Headless Chromium in GPU mode, driven from node by Playwright (never the in-app browser pane, never the browser extension), real input: the mouse wheel a notch at
a time, the keys `]`, `[`, `Home`, `End` and `G`, a click on the chip, a tap on the phone's chip. The build under test is a production build of this branch (code only,
served with the shipped art, audio and fonts of an earlier full build: `vite.sheet.config.mjs`, `serve-fallback.mjs`), origin/main's is a build of a6b79313; the
browser reads fonts, wheel and layout exactly as it ships. Chapters I and II (FFX) and IV and V (FFX-2) at 1600x900, 2000x1012 and 390x844; per desktop scenario
the sheet is read as it opens, the whole document is read by wheel notches, `]` is pressed until every unit of the page has been at the top, `[`, `Home` and `End` are
pressed, `G` puts it away and `G` brings it back:

| Scenario | Box (px) | Smallest type | Opens | The page, by the real wheel and keys | Checks |
|---|---|---|---|---|---|
| I Flux (FFX) 1600x900 | sheet 330x178 at (53,110) | 14.25 px | at "Seymour Flux BOSS BATTLE", 9.3 px of gap above | 13 notches of 100 px read 581 layout px (the foot at 510 of 510); `]` reaches 22/22 units; Home 0, End the foot; a page is 85% of the sheet; `G` hides it and `G` again opens it on the header again | 0 under 14 px, 0 px sideways overflow, 0 hidden units, no MORE row, 0 console errors, 0 failed requests, 0 forbidden words |
| I Flux (FFX) 2000x1012 | sheet 371x200 at (160,124) | 16.02 px | at "Seymour Flux BOSS BATTLE", 10.4 px of gap above | 14 notches of 101.2 px read 581 layout px (the foot at 510 of 510); `]` reaches 22/22 units; Home 0, End the foot; a page is 85% of the sheet; `G` hides it and `G` again opens it on the header again | 0 under 14 px, 0 px sideways overflow, 0 hidden units, no MORE row, 0 console errors, 0 failed requests, 0 forbidden words |
| I Flux (FFX) 390x844 (phone) | sheet 367x410 at (13,66) | 15 px | scrolled to the header (235 px) | wheel reaches the end (981 of 981); document 1391 px | 0 under 14 px, 0 overflowing, 0 console errors, 0 forbidden words |
| II Yunalesca (FFX) 1600x900 | sheet 330x178 at (53,110) | 14.25 px | at "Yunalesca BOSS BATTLE", 10.4 px of gap above | 13 notches of 100 px read 574 layout px (the foot at 503 of 503); `]` reaches 25/25 units; Home 0, End the foot; a page is 85% of the sheet; `G` hides it and `G` again opens it on the header again | 0 under 14 px, 0 px sideways overflow, 0 hidden units, no MORE row, 0 console errors, 0 failed requests, 0 forbidden words |
| II Yunalesca (FFX) 2000x1012 | sheet 371x200 at (160,124) | 16.02 px | at "Yunalesca BOSS BATTLE", 11.7 px of gap above | 14 notches of 101.2 px read 574 layout px (the foot at 503 of 503); `]` reaches 25/25 units; Home 0, End the foot; a page is 85% of the sheet; `G` hides it and `G` again opens it on the header again | 0 under 14 px, 0 px sideways overflow, 0 hidden units, no MORE row, 0 console errors, 0 failed requests, 0 forbidden words |
| II Yunalesca (FFX) 390x844 (phone) | sheet 367x410 at (13,66) | 15 px | scrolled to the header (215 px) | wheel reaches the end (908 of 908); document 1318 px | 0 under 14 px, 0 overflowing, 0 console errors, 0 forbidden words |
| IV Bahamut (FFX-2) 1600x900 | sheet 330x173 at (53,220) | 14.25 px | at "Bahamut BOSS BATTLE", 10.3 px of gap above | 7 notches of 100 px read 315 layout px (the foot at 246 of 246); `]` reaches 16/16 units; Home 0, End the foot; a page is 86% of the sheet; `G` hides it and `G` again opens it on the header again | 0 under 14 px, 0 px sideways overflow, 0 hidden units, no MORE row, 0 console errors, 0 failed requests, 0 forbidden words |
| IV Bahamut (FFX-2) 2000x1012 | sheet 371x194 at (160,247) | 16.02 px | at "Bahamut BOSS BATTLE", 11.6 px of gap above | 7 notches of 101.2 px read 315 layout px (the foot at 246 of 246); `]` reaches 16/16 units; Home 0, End the foot; a page is 86% of the sheet; `G` hides it and `G` again opens it on the header again | 0 under 14 px, 0 px sideways overflow, 0 hidden units, no MORE row, 0 console errors, 0 failed requests, 0 forbidden words |
| IV Bahamut (FFX-2) 390x844 (phone) | sheet 367x410 at (13,66) | 15 px | scrolled to the header (152 px) | wheel reaches the end (301 of 301); document 711 px | 0 under 14 px, 0 overflowing, 0 console errors, 0 forbidden words |
| V Vegnagun (FFX-2) 1600x900 | sheet 330x260 at (53,220) | 14.25 px | at "Vegnagun (Tail) BOSS BAT", 8.9 px of gap above | 53 notches of 100 px read 2153 layout px (the foot at 2013 of 2013); `]` reaches 100/100 units; Home 0, End the foot; a page is 85% of the sheet; `G` hides it and `G` again opens it on the header again | 0 under 14 px, 0 px sideways overflow, 0 hidden units, no MORE row, 0 console errors, 0 failed requests, 0 forbidden words |
| V Vegnagun (FFX-2) 2000x1012 | sheet 371x292 at (160,247) | 16.02 px | at "Vegnagun (Tail) BOSS BAT", 10 px of gap above | 58 notches of 101.2 px read 2153 layout px (the foot at 2013 of 2013); `]` reaches 100/100 units; Home 0, End the foot; a page is 85% of the sheet; `G` hides it and `G` again opens it on the header again | 0 under 14 px, 0 px sideways overflow, 0 hidden units, no MORE row, 0 console errors, 0 failed requests, 0 forbidden words |
| V Vegnagun (FFX-2) 390x844 (phone) | sheet 367x410 at (13,66) | 15 px | scrolled to the header (69 px) | wheel reaches the end (4406 of 4406); document 4816 px | 0 under 14 px, 0 overflowing, 0 console errors, 0 forbidden words |

Over the 12 scenarios: 0 console errors, 0 failed requests, 0 forbidden words, 0 pieces of type under 14 px, 0 px of sideways overflow, 0 hidden units, no `MORE` row anywhere, and in every desktop scenario a real `G` twice put the sheet back on the boss's header.

`tests/e2e/guide-sheet.spec.ts` (12 tests, FFX Chapter I and FFX-2 Chapter IV: it opens on the header and scrolls, a notch moves the text by what the wheel says, `[` `]` Home End, `G` and the chip, the card in its slot and the sheet keeping its page) against the production build on port 6402: **12 passed**.

The pad (`pad-proof.mjs`; a synthetic gamepad, headless Chromium has none): the right stick pushed down for half a second moves the sheet 62 px in Chapter I (107 to 169) and 62 in Chapter IV (67 to 129); pushed up it comes back; inside the dead zone and on the left stick (the menu's) it does not move at all; button 2 folds the guide and again opens it on the header. A real pad is on the deep review's list.

The screenshots for Bailey, `docs/screenshots/r38-guide-jegged/sheet/` (headless, 1600x900 unless named; real wheel, the real scroll bar left visible):

- `ch1-flux-1600x900-sheet-open.jpg`: the desktop sheet as it opens in FFX Chapter I.
- `ch4-bahamut-1600x900-sheet-open.jpg`: the same in FFX-2 Chapter IV, a calm frame (nothing playing over the party).
- `ch1-flux-1600x900-hint-card.jpg`: the cure-hint card in its own box above the sheet, a real Zombie (Chapter I, seed 3).
- `ch1-flux-390x844-phone-sheet.jpg`: the phone's sheet, unchanged.
- `ch1-flux-1600x900-sheet-scrolled.jpg`: the sheet scrolled five notches.
- `ch4-bahamut-1600x900-hint-card-real-curse.jpg`: Bahamut's own Curse landing on Paine, the card above the sheet, no probe.
- `mockups/option-b-reading-mode-ch1-flux-...-MOCKUP-not-built.jpg` and `...ch4-bahamut...`: the alternative (a reading mode that dims the field), a picture only.

### Gates, pass three

- `npx tsc --noEmit` and `tsc -p tsconfig.e2e.json`: clean.
- The guide's unit tests: `ui-strategy-guide` (28), `strategy-guide-sheet` (25), `status-o3-hint-place` (20), `strategy-guide-phone-sheet`, `strategy-guide-chip-and-type`,
  `guide-doc-render`, `guide-doc-separation`, `guide-doc` (8 files, 147 tests), and the forbidden-words test `guide-doc-words` (37): all pass.
- **The full unit suite, once, on the final tree:** 775 files passed, 5 skipped (of 780), 11437 tests passed, 41 skipped, 1 todo, 472.37 s, `--maxWorkers=3`.
- `node tools/orphans.mjs`: 24 orphaned of 1227 modules, the same 24 as before this pass; `guideScroll.ts` is reached.
- **The advisor digest** (every chapter, seeds 1 to 5, 90 runs, 8,256 decisions): `cc10c48f8757f72d07c44a7986c06e4b69b3d9d42e53cef6757dd8cb77ae425d`, **90 of 90 per-run hashes identical to origin/main's**
  (the f4244e1f digest; `main` has had docs commits only since) and to pass two's. No tactic, advisor, bench, battle or chapter-data file is in this change, and
  `guide-doc-separation` also scans `guideScroll.ts` for any import of them.
- Browser: `tests/e2e/guide-sheet.spec.ts` 12 of 12 against the production build; `accessibility-a2.spec.ts`: **3 failed, 2 passed on this build and 3 failed,
  2 passed on origin/main, with the same clipped-text entry** (the command menu's `▼` glyph at 130 percent, which is not the guide; it stops the spec before its overlap checks, which
  `textsize-check.mjs` runs on its own, above). `tests/e2e/hud-collision.spec.ts` (CHK-008) was not run as a spec: `coverage.mjs` and `lanescan.mjs` measure the same thing with its own
  states and quads, on both builds.
- `src/ui/common/StrategyGuide.ts` is 399 lines (668 before; the house limit is under 400), `guideScroll.ts` 121, `statusHintCard.ts` 211.

### Files, pass three

**New:** `src/ui/common/guideScroll.ts` (the wheel, key and stick arithmetic, `gapAbove`, `drawnScale`); `tests/unit/strategy-guide-sheet.test.ts` (25),
`tests/unit/helpers/guideSheetStub.ts`; `tests/e2e/guide-sheet.spec.ts`; `docs/plans/r38-guide-sheet-review.md`;
`docs/screenshots/r38-guide-jegged/sheet/`.

**Changed:** `src/ui/common/StrategyGuide.ts` (668 to 399 lines: no fit, no paging, a wheel, the keys, the stick, the card's slot, the
opening place) and `strategy-guide.css` (the sheet is a scroller in a two-row column, the scroll bar, the desktop-only rules);
`statusHintCard.ts` and `status-o3.css` (the card in the slot, `guideSqueezed` for the ladder); `guideDocHtml.ts` (the paging-only
classes gone); `phone-battle.css` (one dead `.sgd__more` rule removed); one line each in `ffx/DamageNumbers.ts`,
`ffx/hudAvoidSelectors.ts`, `ffx2/battleMessage.ts`, `ffx2/DamageLayer.ts` and `ffx2/intentBoard.ts` (the card is dodged as the panel
was); `data/guides/doc-types.ts` (comments only: no block has to fit a page); the tests named in the commit
(`guide-doc-render`, `strategy-guide-phone-sheet`, `strategy-guide-chip-and-type`, `ui-strategy-guide`, `status-o3-hint-place`,
`guide-doc-separation`, `guide-doc`).

**Removed, parked on `F:/pyrefly-parked/2026-10-03/guide-sheet/` first:** `src/ui/common/guideFit.ts`, `tests/unit/strategy-guide-fold.test.ts`,
`strategy-guide-scale.test.ts`, `tests/unit/helpers/guideLayoutStub.ts` (and the before-copies of the three rewritten tests and of the paged
`StrategyGuide.ts`).

**Not touched:** every file under `src/engine/tactics/`, `src/battle/`, `src/data/ffx/`, `src/data/ffx2/`, the 18 `src/data/guides/<chapter>.ts`
and `types.ts`, the 18 documents, `tools/` (`tools/hud-safe-area-check.mjs` still names `.sgd__more`; it reads null for it and carries on).

**Scratch, outside the repo** (`D:/Tools/pyrefly-scratch/2026-10-03/guide-sheet/`): the proof scripts (`sheet-proof.mjs`, `hint-proof.mjs`,
`coverage.mjs`, `phone-compare.mjs`, `phone-diff.mjs`, `pixdiff.py`, `pad-proof.mjs`, `lanescan.mjs`, `lanes.mjs`, `shots.mjs`, `lib.mjs`,
`serve-fallback.mjs`, `vite.sheet.config.mjs`) and their reports; the servers on 6400 to 6404 (the build, pass two's build, origin/main's build and two experiments) were stopped by their PIDs at the end.

### For Bailey, pass three

1. **The reading window is the rail's box.** About 8 lines in FFX and 8 to 12 in FFX-2 at once at 1600x900, in 14 px type, with a scroll bar; the page is
   whole and scrolls. If he wants a bigger window the choices are measured above: a reading mode that dims the field and holds the battle
   (needs the pause plumbing, FFX-2's ATB above all; a mockup first), or a wider rail (the advisor's lane, a figure in 6 chapters).
2. **The card shortens the sheet while a status lasts** (above), and the alternatives.
3. **`[`, `]`, `Home`, `End` and the right stick are named nowhere in the game** (the controls hint says only `G`). Adding them to the
   controls list is a one-line copy change; not done without his word.
4. **1280x720** still draws the sheet's type at 11.4 px (5.7 grid px at 2x): the 14 px floor is cleared at 1600x900 and above, as before
   (`strategy-guide-chip-and-type.test.ts`). With paging gone a floor in `--lb-scale` is now cheap; it would shrink the 1280 sheet to
   about 8 lines. His call.
5. **D-364 asks for his word on the screenshots before it ships** (hard rule 9): `docs/screenshots/r38-guide-jegged/sheet/`, listed in the
   commit and the report; the two reading-mode mockups beside them are pictures only, nothing of them is built.
6. **FFX-2's sheet is a little shorter than today's rail where the old rail was long** (Chapter IV 173 px against 230 at 1600x900, V 260 against 302, VI 140 against 168, XI, XVI and XVII 188 against 211; XIII is taller, 213 against 211, because its girls stand lower): it keeps 28 grid px off the fence on the
   party's heads so that no chapter touches a girl's box (the coverage section). If he would rather have the height and accept a touch on Yuna's
   box in two chapters, `FENCE_GAP` in `StrategyGuide.ts` is the one number (8 gives the old height and touches XI and XIII).
7. **TEXT SIZE 130 percent: the card stands alone in FFX** (above), as it already did at 1280x720 at 100 percent. FFX-2's TEXT SIZE stays off
   (D-220 Q4) and was not touched.

## 11. Check (critic, 2026-10-04)

Written by a Sonnet sub-agent of the driver session that did not build this lane. Head checked: `e96ddc37` (`origin/r38-guide-jegged`), against `origin/main` `77f0d157` and the live site.
**Game case: both** (AGENTS.md rule 14): the 11 FFX chapters were read against the FFX guide's pages only and the 7 FFX-2 chapters against the FFX-2 guide's pages only; the panel, the sheet and the
card are shared plumbing and were run on both games. This is a lane check, not the focused-review report `critic-clear` takes (`node tools/critic-plan.mjs` on the lane's 36 shipped files says DEEP:
live + focused + deep owed, as the preflight says).

**Verdict: PASS. No blocker.** The panel is the encounter guide's page for the boss, as a document, in our own words; the sheet, its scrolling, the card's box, TEXT SIZE and the phone sheet work as the handoff says on both games; and the build covers no more than the live one anywhere I measured (it covers nothing, where the old rail covers Yuna in Chapter IV). Four small findings to fix, two judgment calls and a few disclosures for Bailey are at the end.

| Item | Verdict | In one line |
|---|---|---|
| 1 Faithful to the page | PASS, with differences | all 18 chapters read paragraph by paragraph: header, stat lines and advice in the page's order, nothing of ours, no NEXT; seven small differences the handoff does not list, and two omissions on unresolved conflicts that are Bailey's to confirm |
| 2 Copyright | PASS | the longest run of consecutive words in any prose sentence is six; 11 short lines (lead-ins, ability names, attack-list lines) are word for word, none longer than nine words |
| 3 Wording | PASS, 3 findings | 0 hits in the rendered panels of all 18 chapters; three dead cross-references to sections of the source guide that the game does not have |
| 4 Numbers | PASS | every difference in the handoff's list equals `src/data` and its research; Natus's drop equals the data but not the research (disclosed) |
| 5 Separation | PASS | advisor digest identical to origin/main's on 90 of 90 runs (8,256 decisions); no tactic, advisor, battle or chapter-data file changed |
| 6 Reading view | PASS (14 px not met at 1280x720, as live) | opens on the boss in all 18 chapters and in real battles; G, the wheel, [ ], Home and End, the pad, the chip, the card, TEXT SIZE and the phone as claimed; lane: 0 contact in 72 first-menu readings and in 48 CHK-008 states, origin/main: 84,327 px on Yuna in the CHK-008 states of Chapter IV; two anomalies, both explained and neither this lane's |
| 7 Code | PASS | tsc clean, 24 orphans as before, 230 guide tests and the full suite (11,437 tests) pass; `StrategyGuide.ts` is 399 lines, a new test is 420 |

**How it was run.** The 15 pages were read on 2026-10-04 (headless Chromium from node, all HTTP 200, no wall) and compared with the builder's copies of 10-03 (11 identical, three differ by a footer line,
one by a walkthrough paragraph outside the Den of Woe's boss section). The lane worktree and `D:/Final Fantasy` (`src/` clean, so origin/main) were built code-only with `vite build` into scratch and served on
`127.0.0.1:6950` (lane) and `:6951` (origin/main) under `/pyrefly-reprise/` with the shipped `public/` files as the fall-back; origin/main's JS and CSS bundles are byte for byte the live site's (sha256 of `index-DhiL5vEz.js` 8ec6ca7a... and of `index-B8jtRvzT.css` 41a13795..., fetched and hashed, nothing saved), so the baseline is the live code, and a third build of the pass-two tree `7c94814c` (`:6952`) stands for "the phone before pass three". Browser: headless Chromium, `PYREFLY_BROWSER=gpu` (RTX 5070 Ti), real keys,
the real wheel, real clicks and taps and a synthetic pad, one browser at a time, the real live site for the phone and a subset of the coverage runs. Scripts and every report are in
`D:/Tools/pyrefly-scratch/2026-10-04/guide-check/` (the document dumps there number the lines of a document in order, a list item or table row each; "line N" below means that). Nothing from the pages is in the repo.

### 1. Faithful to the page (all 18 chapters read, not only the eight asked for)

The pages and how they were read are above. Every chapter's document (`src/data/guides/docs/<chapter>.ts`) was set against its page paragraph by
paragraph, then checked by script: list kind and item count (29 lists: bulleted or numbered as the page has them and the same number of items in 28; the 29th is Natus's Strategy list, one bullet shorter by the omission below; the pages' lists also carry small ability icons, which the sheet does not reproduce, as section 2 says), the page's numbers against the document's in both directions, order (no inversion that is not a page repeating
itself), and the **rendered** sheet of all 18 chapters in the game against the document data (all 642 strings of the 18 documents are in their sheets, and nothing else is: 18 of 18). FFX chapters were read against the FFX guide's pages only and FFX-2 chapters against the FFX-2 guide's only; word-run overlap with the other
game's pages is two coincidences of five and six words. No sheet carries a NEXT, WATCH, RULES or MORE label.

An independent cross-check for omissions (`omissions.mjs`: every page paragraph of a boss's own section against the document lines, by shared content words) flags 82 of the 305 paragraphs; the ones that are not simply reworded are walkthrough narration (cutscenes, switches, treasure, routes), the Rikku and Paine fights of the Den of Woe, and the items in the table below.

Header, stat lines, advice in the page's order, nothing of ours: **faithful in all 18**, with the following that the handoff does not say (none changes
what the sheet teaches; the first three are the ones to look at):

| Chapter | What differs from the page, not listed in section 2 |
|---|---|
| IX Yojimbo | The page has no boss card and no heading of that name; the sheet prints a `Yojimbo` header band (section 2 says the page has "the Yojimbo heading": it does not). The Magic Urns warning, the Shining Thorns hint and the price sentence are not printed (reasonable; not this chapter) |
| XV Den of Woe | The page's first "Preparation:" paragraph (Yuna alone in the first two fights, support roles, a Gun Mage dressphere) is cut to its "fully healed" clause and its second paragraph is rearranged into two; section 2 says "two paragraphs above" as if mirrored |
| V Vegnagun | "keep everyone above 1,500 HP" is the page's figure for its 700 to 1,500 Nemo range and stays beside the game's 1,490 to 1,685 (a character at 1,501 HP would not survive the top of it); the page's "Various Endings" hint (before Shuyin's card) is not printed |
| III Braska | The boxed "Using Powerful Items" hint is printed after the preparation paragraph; on the page it is before it |
| VII | The page's one-paragraph introduction to Anima (between the two cards) is not printed |
| VIII Evrae | Two pairs of page paragraphs became one paragraph each (armour and proof/ward; last room and gates): five preparation paragraphs against seven |
| XVII | The walkthrough sentence about choosing Sin on the NavMap is not printed |

The panel also adapts one thing the page cannot do in a 132-grid-px rail, and says so: the FFX-2 four-column table is one stacked box per enemy
(`HP`, `Steal`, `Drop`), and the two-column Bulwark table is stacked rows. Splitting a long paragraph in two (the 260-character unit rule) happens in
most chapters and keeps the order.

**Left out because our research says the game differs** (section 2 lists them; each was checked against `research/jegged-encounter-guides-ffx-b.md` §8 and
`-ffx2.md` §9): Natus's counter-spell, Nul-calls-Desperado and Magic Break claims, Omnis's Shell against Ultima, Isaaru's Ice against Grothia are strong
(decompile and several sources). **Two are not**: V's "Protect halves Noli Me Tangere" is J-1, which the research calls *Conflict, unresolved*, and XVI's
"four Aerospark" is J-2, "do not print four" with Jegged as a second observer. D-362 covers numbers ("print the game's number"), D-367 covers advice
the kit cannot follow ("print it as the page gives it"); neither says what to do with a claim the research has not settled, so those two omissions are
Bailey's to confirm.

### 2. Copyright

`overlap.mjs`: the longest run of consecutive words each of the 514 document lines shares with the page it follows (and with all 15 pages). Runs of 5 or more:
151 lines; 6 or more: 70; 7 or more: 24; 8 or more: 11. **Every run of 7 or more is a heading, a loot or table row, a list of game terms (items, statuses,
spells) or a number with its unit**; the longest run in running prose is six words (II line 11, about healing spells and items hurting a Zombie; XIII line 8, about the Oversoul form being easier).
No prose sentence shares more than six consecutive words with its page, and the paraphrases keep the page's facts and order, as D-362 asks.
At paragraph level (`para-closeness.mjs`: the share of a paragraph's content-word pairs, stop words removed, found in the best-matching page paragraph) 221 paragraphs score: 182 (82 percent) are below 0.4, 24 are 0.4 to 0.5, 11 are 0.5 to 0.6 and **four are above 0.6, all one-sentence facts** (XV lines 29 and 43, XVII line 2, XIII line 6; the closest is 0.75).

Copied or near-copied text found, all of it short (the whole list, by chapter and document line; the lines are in the repo, none is quoted here):
- 11 lines that are word for word on the page and are not a heading, stat label or table cell: four run-in lead-ins (II line 15 and VIII line 9, four and five words; X lines 13 and 16, the Phase 2 and
  Phase 3 lead-ins with their HP thresholds, nine words each), three armour-ability lines (XVIII lines 2 to 4, four words each) and four attack-list lines of the FFX-2 pages (V lines 29 and 82, XIII line 16,
  XI line 19: a move and its target, the Dispel line, the Demi line, the four -aga spells; four to six words each).
- One whole sentence of the page, four words, closing III line 15, and a four-word rhetorical question in XV line 37 that the page also asks (with one more word).
- The attack lists of V (Head, Redoubts, Nodes), XIII and XV state each move the page's way, with the page's figure and sometimes its tail (V line 69 shares a seven-word run and the same closing clause;
  V lines 73, 75 and 83 are within a few words of the page's line): facts in the page's order, no run over eight words.
- The 29 bulleted and numbered lists and the table cells are the page's facts in the page's order, as they must be.

I would not call any of this a copy of Jegged's prose; the lines above are the places a stricter reader could. Left for the driver: reword the four attack-list lines
and the two lead-ins if "headings and stat labels may match" is read narrowly. Nothing of the page's prose is reproduced in this note.

### 3. Wording

`guide-doc-words.test.ts` passes (37 tests), and my own scan of the rendered panels of all 18 chapters at 1600x900 (the sheet's whole text, the chip and every
`title`/`aria-label`) finds **0** hits for the test's pattern (`jegged|adapt|source|cite|citation|§|research/|docs/|.ts|D-nnn|PR-nnnn|walkthrough guide|according to`), 0 failed
requests and 0 console errors; the shipped bundle holds no `jegged`, `Walkthrough/` or `gamefaqs`. Live prints source words in all four chapters measured on
the phone (2 to 4 hits each); the lane prints none. The same scan with a wider net (page, section, tips and tricks, screenshot, see above/below, per the) finds
three things the test's pattern cannot, all **cross-references to parts of the source guide the game does not have**:
- VIII line 18, "Rikku's Overdrive section lists the items needed." (there is no such section in the panel);
- IX line 2, "The Overdrive section covers Lancet and Ronso Rage in more detail.";
- XIII line 4, "The Oversoul Enemies page under Tips and Tricks has more." This one points at a page of the source's own site by name, which is what "no source, no citation" is
  meant to keep out; it is the one I would fix before the build ships (the others read as a dead pointer, not a source).
The test's pattern does not catch them (`page`, `section` and `tips and tricks` are not in it); either reword the three lines or add the words to the pattern and the strings.

### 4. Numbers

`dump-data.mjs` reads every chapter's enemies, HP, forms, steal and drops from `src/data` (the real chain, link by link); every HP, Steal and Drops line of the 18
documents equals it (the parts are in their link's file: the Nodes' 300,000 HP in `vegnagun-leg.ts`, the Bulwarks' 3,000 in `vegnagun-body.ts`, the Redoubts' 2,500 in `vegnagun-head.ts`). Two scripts
list every number one side prints and the other does not (digits, percents, fractions, number words): the documents print **no number the page lacks** except the ones in the table below
(two of those, Spathi's 5 and Drill Shot's 8, reuse a digit the page prints elsewhere, so a scan cannot find them: they are the handoff's own list), and the pages print none that the documents lack in the boss's own
section except these, the Rikku and Paine fights of the Den of Woe (not this chapter), map legends, and two equivalents ("100%" in VIII, "removes the chance entirely"; "twice" in III, "two uses"). The handoff's list, each shown number against `src/data` and its source:

| Chapter | Page says | Panel shows | `src/data` and research | Result |
|---|---|---|---|---|
| IX Yojimbo HP | about 30,000 | 33,000 | `yojimbo` `maxHp` 33,000; `ffx-yojimbo.md` section 2.1 (decompile, wiki, GameFAQs) | agree |
| XIV Spathi's count | 4 to 1 | 5 to 1 | `SPATHI_COUNT_START = 5` (`battle/ffx/ai/isaaru-rules.ts`); `ffx-isaaru-bevelle.md` I-5 | agree |
| XVIII Sin's clock | about sixteen turns | about thirteen turns | `GIGA_GRAVITON_TURN = 13` (`overdrive-sin-rules.ts`, our estimate, D-280); `ffx-sin.md` S-1 | agree (an estimate, not labelled as one on screen) |
| V Nemo Ante Mortem Beatus | 700 to 1,500 | roughly 1,490 to 1,685 | power 30 magic, thresholds 0.8/0.6/0.4/0.2 (`shuyin-abilities.ts`); `ffx2-vegnagun-shuyin.md` section 3.4 and J-7 | agree |
| XIII Paragon HP | 200,000 | 210,000 | `paragon-oversoul.ts` 210,000 (the form the chapter ships); `ffx2-trema.md` section 3.2 (4 sources) | agree |
| XV Drill Shot | after 10 HP changes | after 8 | `DRILL_SHOT_AT = 8` (`battle/ffx2/ai/den-of-woe.ts`); `ffx2-gippal-den-of-woe.md` G-5 (8 in the Den, 10 at Bevelle) and J-3 (open: an in-game look would settle it) | agree |
| XVI Aerospark | four in a row | not printed | counter model (`battle/ffx2/ai/ixion.ts`); research J-2 "do not print four" | agree (see section 1) |
| X Natus's drop | Lv. 2 Key Sphere | None | `seymour-natus.ts` `drops: []`, with its comment that the item is sourced but has no item record | **matches the data, not the research** (`ffx-seymour-natus-highbridge.md` section 1.4: Lv. 2 Key Sphere x2, decompile plus two sources); handoff section 7 item 5 discloses it |
| V Nodes' rare drop | Hero Drink | not printed | `vegnagun-leg.ts` drops only the common Megalixir (comment: no rate for the rare slot) | matches the data; disclosed |
| the "one drop each" rows (XI Shiva, Sandy, Cindy; XIII Paragon, Trema; XVII Fins, Genais, Core) | a second, rarer entry | one | each equals the `drops` array of its enemy | agree |

One more number is the document's own: V line 87, "keep everyone above 1,500 HP", is the page's figure and sits beside the game's range (section 1).

### 5. Separation

- **No tactic, advisor, battle or chapter-data file changed.** `git diff origin/main origin/r38-guide-jegged --name-status` is 20 modified, 87 added, 3 deleted; under `src/` the
  changes are `src/ui/**` (the panel, its scroll, the card, the avoid lists, the two HUDs' guide calls) and `src/data/guides/doc-types.ts` and `docs/` (new). Nothing under
  `src/engine`, `src/battle`, `src/app`, `src/data/ffx*`, the 18 `src/data/guides/<chapter>.ts` or `types.ts`. The two HUD diffs remove only the guide's `showDecision`,
  `clearDecision` and `held` calls and leave the advisor's. The documents import only their types; `StrategyGuide.ts`, `guideDoc.ts`, `guideDocHtml.ts` and `guideScroll.ts` import no tactic, advisor,
  presenter or `three`; only `guideDoc.ts` imports the documents (`docs/index.ts`), the others their types and `guideDoc.ts`.
- **The advisor digest**, `advisor-digest.mjs` (the builder's, read first: it plays every chapter with `intendedStrategy` and hashes the advisor's whole view, the tactic's command and the legacy NEXT the advisor borrows),
  run by me on the lane tree and on `D:/Final Fantasy` (`src/` clean, so it is origin/main `77f0d157`) with seeds 1 to 5 and the decision cap 700: **90 runs, 8,256 decisions, 0 errors,
  overall `cc10c48f8757f72d07c44a7986c06e4b69b3d9d42e53cef6757dd8cb77ae425d` on both, all 90 per-run digests identical, and equal to the handoff's.** (With the script's default cap of 260 both give
  `c71434722bd1c7b7aded8f197412b45e4630a9de4e72d49c30b979d6d91fb3ad`, 8,025 decisions; the cap, not the tree, is what makes the number differ.)
- `guide-doc-separation.test.ts` passes (29 tests).

### 6. Reading view (lane build, 6950; origin/main and the live site as the baseline)

**Opens on the boss on the field.** All 18 chapters at 1600x900 at the first command menu: the sheet opens on the boss's header, with 7.9 to 12.5 screen px of empty
gap above it and no half line of the block before (chapter, block counted from 0, gap: I #3 9.3, II #3 10.4, III #2 7.9, IV #2 10.3, V #1 8.9, VI #0 12.5, VII #1 10.1, VIII #5 9.6, IX #2 10.4,
X #3 9.2, XI #1 8.9, XII #3 8.2, XIII #6 9.8, XIV #2 9.0, XV #4 8.1, XVI #1 10.2, XVII #2 9.0, XVIII #4 9.0); Chapters I, IV, V and XVII at 1280x720, 1600x900, 2000x1012 and 2560x1440 (16 scenarios)
open on the header with 7.1 to 16.5 px of gap. Chapters whose preparation sits above the header (XIII opens at block 6) open on the header, as designed.

**Real input, 16 scenarios, 15 of them complete** (`reading-view.mjs`: real wheel, real keys, real clicks; the sixteenth is anomaly (b) below): a wheel notch moves the text **100.0 screen px at 1280x720, 1600x900 and 2560x1440 and 101.2 at 2000x1012**
(the handoff's figure); `]` moves 0.845 to 0.855 of the sheet and `[` comes back; `Home` is the top and `End` is the foot (the foot also reached by wheel notches alone in every
complete scenario: 11, 5, 41 and 14 notches at 1280x720 for Chapters I, IV, V and XVII, 56 for V at 2000x1012); the arrow keys move the sheet 0 px; `G` puts the sheet away (the
chip reads "G GUIDE") and `G` again brings it back on the same header at the same place in all 15; a click on the chip does the same in 14 of them (the other is anomaly (a) below).
**The pad:** a synthetic gamepad (headless Chromium has none): the right stick pushed down for half a second moves the sheet 60 layout px in Chapter I (107 to 167) and 62 in Chapter IV
(67 to 129), pushed up it comes back, half travel moves about half, inside the dead zone (0.2) and on the left stick it does not move at all, and the spare face button (the chip then reads
"SQUARE GUIDE") puts the sheet away and brings it back on the header (top 107 and 67 again); 0 console errors.
**Anomalies, both investigated.** (a) FFX Chapter I at 1280x720: after the chip folds the guide, the *next* click on the chip does nothing and the one after it works. It happens in the same way on the
origin/main build (3 of 3 runs on each), so it is not this lane's. `elementsFromPoint` at the chip's centre (`chipdiag.mjs`, both builds, 50 ms to 3 s after the fold) names it: the move advisor's own chip (`button.mad__toggle`) stands exactly on the folded guide chip (81 by 21 px at (40,66)), so the first click goes to the advisor. It is a pre-existing overlap of two chips, and it shows only where the advisor sits there (FFX Chapter I at 1280x720; Chapter XVII at the same size is fine, and 1600x900 is fine in every chapter tried). (b) FFX-2 Chapter V at 2560x1440, 74 notches in, the guide's elements were gone from the page: the party had been wiped while I scrolled (the FFX-2 clock runs under the open menu, as the handoff says; no hold was built), the battle ended and the screen changed. Rerun twice with the screen and the party's HP logged: the foot is reached at notch 80 both times, the sheet intact, with the party at 0/0/0 HP. Not a fault of the sheet; it is the cost the handoff names, measured: Vegnagun's page is about 2,000 px, 80 notches at that size, and an unattended party does not last that long.
**In real battles** (`transitions.mjs`: the intended strategy plays a chapter at fast speed; every 200 ms the page notes which enemies stand and which block of the sheet is at the top; each roster that stood for at least 0.6 s is checked against the block the document's own anchors name, worked out here from the document data): VII (Seymour and the Guardians, Seymour, Anima, Seymour again, battle over) 5 of 5; XI (Shiva, the three Sisters as they fall, Anima, and the gaps between) 8 of 8; XIV (Grothia, Pterya, Spathi, battle over) and XVII (Left Fin, Right Fin, Genais with the Core) every roster with a boss standing, and **four gaps between two links** (ten to twenty seconds with only Isaaru or Cid standing) where the sheet stays on the part of the boss that has just fallen and moves when the next one stands (XI's gaps, with nobody standing, return to the top of the document instead: both are harmless and neither is described in the handoff); II: Yunalesca stood as Form I for 197 s and the run was lost, so her second and third forms were not reached (`guide-doc-start.test.ts` pins their anchors); V was not run (time budget). 22 of the 26 rosters examined are exact; the other four are the gaps.
**The repo's own e2e specs against my two builds.** `tests/e2e/guide-sheet.spec.ts` (the builder's: opens on the header and scrolls, a notch by what the wheel says, `[` `]` Home End, `G` and the chip, the card in its slot, FFX Chapter I and FFX-2 Chapter IV) on the lane: **12 of 12 pass** (3.6 min). `tests/e2e/hud-collision.spec.ts` (CHK-008): above. `tests/e2e/accessibility-a2.spec.ts`: **3 failed and 2 passed on the lane and the same 3 and 2 on origin/main**, all three failures the same clipped `▼` of the command menu's more-arrow at 130 percent (the handoff says so), none the guide.
**The scroll bar** (`scrollbar-drag.mjs`, FFX Chapter I at 1600x900): a press on the thumb and a drag of 60 screen px down moved the sheet from 107 to 330 layout px; the bar is draggable.

**Nothing covered more than live.** Coverage of the guide's column and of the sheet itself against every living painted figure (its face band, the upper third, counted apart) and every other HUD
panel of both games, at the first command menu with every optional panel open (CHK-008 state 1), `coverage.mjs`: **72 runs on the lane (18 chapters x the four sizes) and 72 on origin/main, 0 failed; in every one of the 144 the guide's column, its sheet and its chip touched no painted figure (0 px, no face hit) and no other HUD panel (0 px), and stayed on screen**, so there is no cell where the lane covers more than origin/main. On the live site, Chapters I, II, IV and V at the four sizes (16 runs): the same, 0 contacts, and the same column and sheet sizes as the local origin/main build in 15 of the 16 cells (the sixteenth, FFX-2 Chapter IV at 2000x1012, is 188 high on live and 285 on the build: the old rail's height follows where the girls stand, as the handoff says). This is a tie, not a win: the old rail's contact with Yuna in Chapter IV (79 to 165 px at the first menu, the handoff's table) did not show in my one sample per cell. The check that does show the difference is the repo's own CHK-008 spec (`tests/e2e/hud-collision.spec.ts`, run against both builds, Chapters I and IV at 1280x720, 1600x900, 2000x1000 and 2560x1440, six of its nine states each: the first menu with every panel open, a submenu, that submenu cancelled, the target cursor, the numerals resolving, every optional panel off; 8 of 8 tests pass on each build): the lane's guide panel touches no figure in any of the 48 state readings (0 px, 0 face hits). **origin/main's old panel touches Yuna in 4 of the 6 states of Chapter IV at every size: 12,043 px at 1280x720, 8,966 at 1600x900, 46,020 at 2000x1000 and 17,298 at 2560x1440 (84,327 px and 16 face hits in all)**; Chapter I touches nothing on either build. Every other panel's overlap with the figures (the command stack over the party, the advisor card) stays within a few percent between the builds, the lane's lower in six of the eight cells and higher by 0.7 and 2.2 percent in the other two, which is formation noise (Chapter I: 48,267, 75,885, 111,460 and 193,862 px against 53,192, 75,393, 109,053 and 193,996; Chapter IV: 220,124, 375,059, 371,361 and 993,290 against 227,031, 437,351, 448,659 and 1,017,024): the change moved nothing else onto a figure. Face hits of every panel together: 81 on the lane, 100 on origin/main. The column's height at 1600x900, lane / origin/main: FFX 178 / 168 in all eleven chapters (the sheet fills the rail's whole box; the extra 10 px is empty sky); FFX-2: IV 173 / 168, V 260 / 302, VI 140 / 168, XI 188 / 211, XIII 213 / 211, XV and XVI 188 / 211.

**Type and overflow.** The smallest type drawn in the sheet (computed font size times the stage's scale, over every text node of the sheet) is **11.4 px at 1280x720, 14.25 at 1600x900, 16.02 at 2000x1012 and 22.8 at 2560x1440** (all 18 chapters at 1600x900; Chapters I, IV, V, IX, XIII and XVII at the other three). The 14 px bar is met at 1600x900 and above and **not at 1280x720, where the live rail's type is the same 11.4 px** (measured on the live site, Chapters I and IV, at 1280x720 and 1600x900: 11.4 and 14.25): not a regression, disclosed (handoff 7.4), Bailey's call. No element of any sheet is wider than its box (0 in every run) and the sheet has no horizontal scroll.

**The phone, 390x844 (touch, a real tap on the GUIDE chip), Chapters I, II, IV and V:** lane against the build before pass three (`7c94814c`, built here with its fonts), origin/main and the live site. With the sheet open **every measured field of the lane is identical to pass two's in all four chapters**: the stack (370x410 at (10,66)), the sheet (367x410 at (13,66)), every text unit's box and type (15 px, 19 for the title), the text, the opening place (235, 215, 152 and 69 px), where a 700 px wheel lands, the end of the document (1,391, 1,318, 711 and 4,816 px of content) and the chip; in the folded and closed states one computed property of the hidden sheet differs (`overflow-y`: auto against hidden), which nothing can see (the handoff says no difference at all). Against origin/main and the live site (identical to each other on the phone) the box, the chip ("GUIDE"), the type (15 px) and the behaviour (a tap opens, a swipe scrolls to the end, a tap closes) are the same; the content differs by design (470 to 492 px of old rules against the whole document), and the old sheet had 10 to 12 elements wider than its box where the new one has none. 0 console errors and 0 failed requests on the lane and on pass two; the old sheet prints source words in all four chapters (2 to 4 hits each), the new one none.

**The hint card in its own box** (BATTLE HELP on). FFX Chapter I with a real Zombie (seed 3) and Chapter II with a labelled probe, at all four sizes: the card stands in `.sgd__slot`, the first row of `.sgd__stack`, not in the sheet (`closest('.sgd__panel')` is null), clear of it (0 px of overlap), inside the column and over no figure (0 px); the sheet keeps its place while the card comes and goes (scroll position equal before and after in every case but the 1280x720 ones, where the sheet has stepped aside and reads 0 while hidden, then returns to the same place, 134 to 134). Sizes: 330x85 at (53,110) at 1600x900, 371x94 at (160,124) at 2000x1012, 528x132 at (85,176) at 2560x1440, the sheet beside it 86, 98 and 142 px high against 178, 200 and 284 without a card; **at 1280x720 the card (264x100 at (43,88)) stands alone and the sheet steps aside while the status lasts**, as the approved frame draws it. Folded with `G`, the card stands at its approved place outside the slot ((42,62), (53,78), (160,88), (85,125)). **FFX-2 Chapter IV:** Bahamut's own Curse on Paine, no probe, is in its slot at 264x80 at (43,176), 330x85 at (53,220), 371x117 at (160,247) and 528x132 at (85,352), the sheet beside it 54, 81, 109 and 134 px, and a probe reproduces the card at 1600x900 and 2000x1012 (the repo's e2e stamps one in IV and passes). **At TEXT SIZE 115** the card is 304x83 (stands alone), 380x96 (sheet 74 beside it) and 427x107 (sheet 85) at the three sizes, **at 130** it is 343x88, 429x107 and 482x121 and stands alone at all three, which is the handoff's table to the pixel. **Not reproduced:** my probe put no card up in FFX-2 Chapter V (or in IV at 1280x720 and 2560x1440), so Chapter V's card rests on the builder's table; one of my reruns of the card run (2560x1440) ended when the browser's page crashed ("Target crashed" at `newPage`, a GPU or load fault of this machine, not the game).

**TEXT SIZE 115 and 130** (FFX Chapter I and FFX-2 Chapter IV, 1280x720, 1600x900 and 2000x1012, lane and origin/main, the probes of `accessibility-a2.spec.ts`: overlap `ix > 2 && iy > 2`, off-screen, clipped text, over every panel of both HUDs): **0 overlaps, 0 off-screen, 0 clipped text in all 18 scenarios on the lane and in all 18 on origin/main**; a wheel notch moves the text 98.7 to 101.2 px at 115 and 130 percent. The lane's FFX column at 130 percent is 146, 182 and 205 px high at the three sizes against origin/main's 174, 218 and 245 (the old panel grew into the free room above the help slab; the sheet ends where it ends at 100 percent, by design); FFX-2's TEXT SIZE is off (D-220 Q4) and its column is the same at all three settings (138, 173, 194 px).

### 7. Code

- `node .../typescript/bin/tsc --noEmit` (TypeScript 7.0.2, 2,836 files) and `tsc -p tsconfig.e2e.json --noEmit`: clean.
- `node tools/orphans.mjs`: 1,227 modules, 24 orphaned, the same 24 as before, none a guide file (`guideScroll.ts`, `guideDoc.ts`, `guideDocHtml.ts` and the documents are reached).
- The guide's twelve unit files: **230 tests pass** (`ui-strategy-guide` 28, `strategy-guide-sheet` 25, `status-o3-hint-place` 20, `strategy-guide-chip-and-type` 8, `strategy-guide-phone-sheet` 1,
  `guide-doc-render` 8, `guide-doc-separation` 29, `guide-doc` 28, `guide-doc-words` 37, `guide-doc-start` 12, `guide-ffx2-wait-habit` 9, `strategy-guide` 25).
- **The full unit suite, once, `--maxWorkers=3`: 775 files passed, 5 skipped (780); 11,437 tests passed, 41 skipped, 1 todo; 503 s; exit 0; none of the three known load timeouts fired.**
- Files under 400 lines: `StrategyGuide.ts` is **399** (one line of headroom); the new `tests/unit/strategy-guide-sheet.test.ts` is **420** (over the convention; `ui-strategy-guide.test.ts` is 542, was 527; `strategy-guide.css` is 413, was 456;
  `FFXBattleHud.ts` and `FFX2BattleHud.ts` were already 1,662 and 1,275). Every other changed or added file is under 400 (the closest: `tests/e2e/ffx2-ixion.spec.ts` 398, `status-o3-hint-place.test.ts` 375).
- Layering as above. Strict TypeScript and `.ts` imports as the house rules; the documents are plain data.
- **The game case is in every commit** of the lane: `5cd6b3f9`, `62adc520`, `d1fcee61`, `4c0bb173`, `db4bf1c7` say "both", `7cee8ae2` "FFX only", `9edf5f69` "FFX-2 only".
- The eight tactic and bench files `git status` shows modified in this worktree are CRLF noise (`git diff --ignore-cr-at-eol` is empty and the stripped hashes equal HEAD's); nobody else's change is in the tree.

### Blockers, findings to fix, and what is disclosed

**Blockers:** none. (Nothing I measured is worse than live; nothing is unknown on a critical. The 1280x720 type at 11.4 px and the chip overlap are live's too.)

**Findings to fix before the build ships** (small, none of them a defect in how the sheet works):
1. Three cross-references in the documents that point at parts of the source guide the game does not have (section 3): VIII line 18, IX line 2, XIII line 4 (the XIII one names a page of the source's own site: fix first).
   Either reword the three strings or add `\bpage\b`, `section` and `tips and tricks` to the words test's pattern.
2. The handoff's section 2 says the Yojimbo page has "the Yojimbo heading" (IX) and that XV has two preparation paragraphs "above" (section 1 of this check): correct the two sentences, or print what the page prints.
3. V line 87 prints the page's "above 1,500 HP" beside the game's 1,490 to 1,685 Nemo range; it should say about 1,700 if the range is right (a sourced number to settle, not mine to change).
4. At 1280x720 in FFX Chapter I the move advisor's chip (`.mad__toggle`) stands on the guide's chip once the guide is folded, so the first click goes to the advisor (pre-existing, identical on origin/main; the repo's e2e spec at 1600x900 does not see it).

**For Bailey (already in section 7 of the handoff unless marked new):** the reading window is the rail's box (about 8 lines at 1600x900; 3 lines while a status card stands beside it); the FFX-2 sheet is
shorter than the old rail where the old rail was long (at 1600x900, lane against origin/main in my samples: V 260 against 302, VI 140 against 168, XI, XV and XVI 188 against 211; IV 173 against 168 here, 230 in the handoff because the old rail followed where the girls stood; XIII 213 against 211); the type is 11.4 px at 1280x720, below the 14 px bar, as it was before; `[ ] Home End` and the right stick are named nowhere;
the "GUIDE'S PICK" tag on the advisor is a stale label; **D-364 asks for his word on the screenshots before this ships** (`docs/screenshots/r38-guide-jegged/sheet/`, 8 files in git, not checked
out in this sparse worktree), still open. New in this check: Natus's drop (None, against the research's Lv. 2 Key Sphere x2), the two omissions on unresolved conflicts (V Noli/Protect, XVI Aerospark), the other undisclosed
differences in section 1, and that reading a long page while the FFX-2 clock runs can cost the party (the 2560x1440 run).

**Disclosures about this check:** the attribution line of my commit follows the harness (Claude Sonnet 5.5), not the brief's Opus 5.5, because that is the model that wrote it. This is a lane check: it does not settle any obligation
(`critic-clear` needs a report from the review workflows; `critic-plan` says live + focused + deep are owed). Not run: the repo's `hud-collision.spec.ts` for the other 16 chapters (my own first-menu coverage run covers all 18), the transitions of Vegnagun's five links and Yunalesca's forms in a real battle, a real gamepad, a real
touch device, Firefox or Safari (the sheet has a `scrollbar-width` fallback that I did not exercise), the real game of the Steam copy. The servers I started (6950, 6951, 6952) are stopped; no dev server was started; nothing
was deleted, deployed or merged.
