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
stupid" (~14:40); "Just match the original document please in terms of formatting and everything else" (~18:35).

## 0. Read this first

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
| Fit | a ladder of shorter wordings, citations under each line | whole blocks per page, and a paragraph may carry on to the next page **between two lines** (never through one, never one line alone); `MORE` turns the page and wraps |
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
- **What the rail covers, against origin/main.** The same spec (`tests/e2e/hud-collision.spec.ts`, CHK-008: every HUD panel
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

  A first run of this measurement found the guide **covering Yuna more than the old rail** in FFX-2 Chapter IV (19,402 px
  against 7,818 at 1600x900), and the box was not the cause: the status hint card (the cure hint for a party member's status) rides at
  the top of the guide's panel and counts as chrome in the fit, but the fit was keyed on the rail's height and the page, not on what else the panel held, and FFX-2's rail does not move
  with the menu (its limit is the fence above the party). A card arriving after the fit therefore grew on top of a body that
  already filled the rail, and at 1280x720 the panel ran 48 grid px past it (the old rail's shorter body ran 28 past: the same
  latent bug).
  The fit is now keyed on what else the panel holds as well (`StrategyGuide.extraChrome`; shared plumbing, both games; it showed
  in FFX-2 in the measurement), pinned by a test in `guide-doc-render.test.ts`, and the table is the re-run. While a card is up
  the body gets what is left of the rail, as that card's own header comment says it should (one block when the card is tall),
  and the page comes back when the card goes.
- **Paging.** Every block is a unit; a page is as many whole units as fit; a "keep with next" unit (a header, a lead-in, a table
  head, a list label) never ends a page. A paragraph or list item of two or more lines may carry on to the next page: the box is an
  exact multiple of the line pitch, so no line is cut, and a page never shows or leaves one line alone. Where the pitch cannot be
  read (jsdom, `line-height: normal`) units stay whole. The arithmetic is in `src/ui/common/guideFit.ts`; `StrategyGuide.ts` is 668
  lines (826 on origin/main), which is still over the 400-line convention (section 7, item 6).
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

1. **How the desktop reads a long page.** The rail shows 6 lines a page in FFX and 8 to 12 in FFX-2, so Chapter I's page is 14
   pages long, Yunalesca's 14, Bahamut's 5, and the five-link Vegnagun document runs past 60 (a player needs one link of it, a few
   pages). The phone's scrolling sheet has no such cost. I did not widen or lengthen the rail: more height would reach into the
   command menu below it, and more width into the advisor card and the party. Options, each one a mockup before any build:
   **(A)** keep the rail as it is; **(B)** open a scrolling reading sheet like the phone's on the desktop too (`G` closes it), so the
   page scrolls instead of paging; **(C)** a wider rail, shown against the advisor card and the figures first. I recommend (B);
   none is built.
2. **The Wait-split habit line** ("Pick a command at once. Until you do, the clock still runs.", approved 2026-09-25 for Chapters
   V and VI) is not on the panel any more: the page has no such line and the instruction is nothing of ours. It still lives in the
   guide data the advisor reads. Options: leave it out, or print it as a one-line note above the page for FFX-2 under Wait.
3. **The "GUIDE'S PICK" tag (D-359, adopted, not scheduled)** is advisor UI and untouched. It compares the advisor's pick with the
   tactic's NEXT (`buildGuideView`), a pick the guide panel no longer shows, so the tag's label is now misleading.
4. **"Kept though not doable"** advice (section 2) reads as a promise the chapter's kit cannot keep (Lulu's Bio, Holy, the Mix
   ingredients). The instruction is nothing of ours, so each stays as the page gives it; chapter-specific notes would be ours.
5. **One drop each.** Where the page lists a rarer second drop the game does not award, the panel prints the one the game does.
   Natus's "None" and the Nodes' Hero Drink are the two where the data itself is open (research section 11).
6. **StrategyGuide.ts is 668 lines** (826 before); the 400-line convention (AGENTS.md rule 7) would take a further split of the
   paging code into its own module. Not done, to keep the proven panel as it is.
7. **Record the instruction.** The ~18:35 sentence is not yet in `docs/target/decisions.json` (D-350 holds the first three).
8. **The cure-hint card and the guide share a small rail.** While a party member has a status with a sourced rule (Zombie, Sleep,
   Silence, Curse) the hint card rides at the top of the guide's panel and the page gets what is left of the rail: on FFX-2
   Chapter IV that is one block at a time (the old rail showed a longer body and let the panel run past the rail instead, section 3).
   That is how the card's own header says it should work, so I kept it. If you would rather the page keep its room, the card can
   stand outside the guide (it already leaves the guide and stands alone when it would otherwise cover a command row).

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
