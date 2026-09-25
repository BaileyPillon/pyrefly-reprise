# Chapter select v2: real artwork, a fixed list, and three ways to show "beaten"

Options for Bailey's two chapter-select complaints (2026-09-25 ~17:10 EDT, verbatim):

> "Two issues I want fixed: 1. I don't want boss silhouettes anymore I want really nice artwork
> there instead. I need another way of teaching beaten or defeated bosses. 2. There's no enough
> encounter plates. If I click Evrae then click its again it's Yojimbo. That's weird and
> confusing. Preesentation and style really matters in this game."

**Status: OPTIONS. Nothing is built.** Per AGENTS.md rule 9 (end state first), no product code
changes until Bailey picks or mixes. Every picture here is a faked screenshot of the finished screen.
It was made by loading the real game headless (Vite dev, Playwright), recording a clear of Chapter
VIII in the page's own save (`app.save.recordClear('evrae-airship', 4:12.3, 14)`), and rewriting
the page's hero and rail DOM/CSS for the capture only. `src/` is untouched. The mock code is in
`_src/` (`build.js` rewrites the DOM, `common.css` holds what all three options share, and
`a.css`/`b.css`/`c.css` hold each option).

**Game case: both.** Chapter select is the shared board. The only per-game part is the FFX-2
group heading, which keeps its pyre-pink accent. In C, the FFX-2 progress pips light pink rather
than gold.

Start at `overview.jpg`: the live screen in the top row, then A, B and C, each at 1600x900 and at
390x844.

## What every option shares (the fix for complaint 2 and the silhouettes)

**The list is fixed.** The live rail drops the selected chapter from the list, because it has
moved up into the hero plate. Every card below it slides up one place, so a second click on the
same spot lands on the next chapter (Evrae, then Yojimbo). In v2:

- All ten cards are always listed in their places. FFX comes first (I, II, III, VII coming, VIII,
  IX), then FFX-2 (IV, V, VI, XIII). Nothing is removed and nothing shifts. A second click on the
  same card is the same chapter, and it begins it, as the live two-click rule already does.
- The selected card is highlighted where it sits. It gets a gold frame, a gold numeral block, a
  brighter painting, a small nudge left and a gold notch pointing at the plate.
- **The numerals sit beside the names, never over them.** Each card has its own numeral column
  (I, II ... XIII) on the left, and the name is set to the right of it, centred vertically. In the
  live build the numeral sits at the card's top-left and the italic name at its bottom-left. With
  ten short cards the two overlap, which is Bailey's third photo.
- The coming card (Seymour and Anima) sits at its **number's place (VII)**, between III and VIII,
  greyed, dashed, with COMING beside the name. *Agent proposal, not something Bailey named:* the
  live build appends coming cards at the end of their group. Numeric order explains the gap
  between III and VIII. Confirm or reject.
- On a phone (390x844) the screen becomes one scrolling column: the plate, then the whole list
  (all ten cards visible in one screen), then the prose and the dossier below. The live phone
  layout squeezes the rail into a short scrolling box that the long Evrae prose overlaps
  (`before-ch8-390.jpg`).

**No silhouettes anywhere.** The hero plate and every card carry real, installed paintings:

| Chapter | Hero art used | Source and status |
|---|---|---|
| I Seymour Flux | `public/art/pause/ch1-seymour-flux.png` (Tidus, Mortiorchis behind him) | chapter hero plate, in `approved-hashes.json` |
| II Lady Yunalesca | `pause/ch2-yunalesca.png` | chapter hero plate, approved |
| III Braska's Final Aeon | `pause/ch3-braskas-final-aeon.png` | chapter hero plate, approved |
| IV Bahamut | `pause/ch4-ffx2-bahamut.png` | chapter hero plate, approved |
| V Vegnagun | `pause/ch5-ffx2-vegnagun-shuyin.png` | chapter hero plate, approved |
| VI Leblanc | boss painting `characters/leblanc/idle.png` on scene plate `backdrops/leblanc-last-room.png` | her plate `pause/leblanc.png` is CANDIDATE (not in approved-hashes), so the approved boss painting is used on her scene instead |
| VII Seymour and Anima (coming) | `pause/macalania.png`, greyscale and dark | the plate is approved, but the chapter is still locked, so the card stays a COMING card |
| VIII Evrae | boss painting `characters/evrae/idle.png` on scene plate `backdrops/evrae-airship-deck.png` | `pause/evrae-chapter-card.png` is CANDIDATE (its options round was never picked), so the approved Evrae painting is used on the deck |
| IX Yojimbo | `pause/ch9-yojimbo.png` | chapter hero plate, approved (D-074) |
| XIII Trema | `pause/ch13-trema.png` | chapter hero plate B, Bailey's pick of 2026-09-25 |

Installed hero plates by chapter number: 1, 2, 3, 4 (two: `ch4-bahamut` and `ch4-ffx2-bahamut`;
the chapter meta uses the second), 5 (`ch5-ffx2-vegnagun-shuyin`, plus the `ch5-shuyin` alias),
7 (`macalania`), 9, 10 (Natus), 11 (Fallen Aeons), 12 (Omnis), 13 (Trema), 14 (Isaaru) and
15 (Den of Woe). 10, 11, 12, 14 and 15 belong to unlisted chapters and do not appear on the board
today. Chapters 6 and 8 have only CANDIDATE plates.

Each card crops the same painting at the plate's own `focal` point (from its JSON sidecar), and
the painting fades into ink behind the name. The plate composition is unchanged from the approved
board: plate, prose slab, rail, dossier, controls strip, Ink & Gold type and tokens. Only the art,
the list behaviour and the cleared marks change.

## The three ways to show beaten vs not beaten

Each option is shown with **Chapter I selected (not beaten)** and **Chapter VIII selected
(beaten, best 4:12)**. In both saves Chapter VIII is the only chapter beaten, so the list always
shows a beaten card beside unbeaten ones.

### A. The gold seal (`option-A/`)
- **Beaten:** a round gold seal, rotated slightly and pressed onto the plate's top-right corner.
  "CHAPTER CLEARED" runs round the ring and BEST 4:12 sits in the centre. On the card, a small
  gold check disc sits at the right end.
- **Not beaten:** plain. The painting is at full colour and there is no mark.
- Quietest of the three: the painting is the reward and the seal is the receipt.

### B. The veil and the laurel (`option-B/`)
- **Not beaten:** the painting is at full colour under a subtle ink veil (a fine diagonal hatch
  and a soft vignette), with UNDEFEATED in tracked Ink & Gold display type in a band across the top
  of the plate. Unbeaten cards carry the same veil.
- **Beaten:** the veil lifts. A gold laurel wreath carries the record (4:12) with a DEFEATED label
  beneath. The card's painting goes bright, and a small laurel sits at its right end.
- The state reads from across the room: veiled means still to do, bright means done.

### C. The victory ribbon and the progress strip (`option-C/`)
- **Beaten:** a gold sash across the plate's top-right corner reading VICTORY 4:12, and a small
  gold ribbon across the card's top-right corner.
- **Always:** a progress strip under the plate lists every chapter by numeral. It is grouped
  X / X-2 and shows "1 of 9 beaten". Beaten chapters are lit (gold for FFX, pink for FFX-2), the
  coming one is hatched, and the selected one is underlined. On a phone the strip shows only the
  segments and "1/9".
- The only option that teaches overall progress at a glance, not only per chapter. The prose slab
  moves down 32 units to make room.

## Files

- `before-ch1-1600.jpg`, `before-ch8-1600.jpg`, `before-ch1-390.jpg`, `before-ch8-390.jpg`: the
  live screen today (silhouettes, the shifting rail, numerals over names).
- `option-<A|B|C>/<X>-ch1-open-<1600|390>.jpg` and `<X>-ch8-cleared-<1600|390>.jpg`.
- `overview.jpg`: every capture on one sheet.
- `_src/`: the mock scripts and styles (not product code).

## Open for Bailey

1. Pick A, B or C, or mix them (for example, B's veil with C's progress strip).
2. Coming cards: keep them in numeric place (VII between III and VIII, as shown) or at the end of
   their group (as live)?
3. Chapters VI and VIII use the boss painting on its scene because their hero plates are CANDIDATE.
   Should they keep that, or should their plates (`pause/leblanc.png`,
   `pause/evrae-chapter-card.png`) go through an options round?

## Critique (independent design review, 2026-09-25)

An independent reviewer wrote this section after the options were made. It is not the author of
the options. I looked at all 16 captures at full size (the phone captures at 780x1688, which is
390x844 at 2x), with zoomed crops of the rail, the seal, the laurel, the sash and the strip. I
compared them against the approved board target
(`docs/concepts/polish/showpiece-frontend/chapter-select.png`, the "A front end that moves" tile in
`docs/target/targets.json`) and the installed plates in `public/art/pause/`.
Bailey had already said "I'll go with C a victory ribbon" from the description, before this sheet
existed (NOW.md, ~17:20 EDT). That pick is his to confirm against the pictures. This review does
not overrule it.

### What all three get right
- **The list never reshuffles.** All ten cards stay in place, and the selected card lights up where
  it sits (gold numeral block, gold frame, notch). The second click lands on the same chapter.
  Complaint 2 is fully answered, at both sizes.
- **The numerals are clear of the names.** The numeral column (I ... XIII) is clean and legible at
  1600 and at 390, and the italic names never touch it. Bailey's third photo is fixed.
- **No silhouettes anywhere, and no cross-game mix-ups.** The FFX-2 cards carry FFX-2 art: FFX-2
  Yuna for Bahamut, the Songstress for Vegnagun, then Leblanc and Trema. The FFX cards carry FFX
  art. I found no FFX art in an FFX-2 chapter.
- **The Ink & Gold chrome is kept.** The plate, prose slab, dossier, controls strip, type and gold
  rules match the approved board. The only changes are the art, the list behaviour and the marks.
- **The phone layout is a real improvement.** All ten cards fit on the first screen under the plate,
  and nothing overlaps (the live phone rail does overlap).

### Shared fault, and the biggest one: the art mostly does not show the boss
Bailey asked for "really nice artwork" *in place of the boss silhouettes*. The approved board shows
the boss on the chapter's scene. Seven of the ten chapters now use the pause hero plates instead.
Those are close-up party portraits: crying Tidus for Seymour Flux, Yuna for Lady Yunalesca, crying
Tidus again for Braska's Final Aeon, and Yuna for Bahamut and for Vegnagun. The results:
- **The plate stops showing the boss or the place.** "Seymour Flux" is lettered over Tidus's face.
  Mortiorchis is a skull behind his shoulder, and Mt. Gagazet is gone.
- **The cards read as a row of party faces, not encounter plates.** Cards I and III are both a
  crying Tidus close-up and are nearly the same at a glance. Cards II and IV are both a green-eyed
  Yuna close-up. That is a fresh version of complaint 2 ("not enough encounter plates").
- **The styles clash.** Chapters VI and VIII show a full boss painted on its scene. The others are
  saturated anime close-ups. Switching from Chapter I to Chapter VIII changes the style of the
  picture, not only its subject.
- **The card crops are weak.** A 16:9 plate squeezed into a strip about 5.6:1 keeps one horizontal
  band. Trema's face is cut off at the top of his card, so on the phone his black eboshi reads as a
  black block. Leblanc is a small full-body figure pasted into her room. She reads as a sticker next
  to the face close-ups.

**The fix, for whichever option is picked:** use the treatment the options already use for VI and
VIII on every chapter. That is the approved boss painting (`characters/<boss>/idle.png`) on the
chapter's scene plate (`backdrops/*`), in the same place the silhouette stood. It matches the
approved board composition, gives ten distinct boss plates, and keeps one style across both games.
All ten bosses and all the scenes are installed. Each card then gets its own crop box on the boss,
not a single focal band. The party hero plates still belong on the pause screen, which is what
they were approved for. I would show Bailey one extra capture of this before building.

### Option A, the gold seal: 7.0 / 10
- Answers both complaints. The seal is the most finished-looking mark of the three: engraved ring,
  gold on ink, true Ink & Gold. The gold check on the card is the clearest per-card "beaten" at 390.
- Faults: "not beaten" is taught only by absence, plus "Not cleared" in the dossier. That is weaker
  teaching than B or C. The seal sits on Evrae's upper coil and hides part of the painting. The
  lower half of the ring text runs upside down, where a real seal turns it to read left to right.
  There is no overall progress.

### Option B, the veil and the laurel: 5.0 / 10
- The strongest beaten/unbeaten contrast, but it goes against complaint 1: nine of ten chapters
  (every one, on a new save) sit under a diagonal hatch and a darkening veil. The first thing a
  player sees is the "really nice artwork" dimmed and striped. The hatch looks like a moire pattern
  at 1600 and runs across every card on the phone.
- The UNDEFEATED band sits over Tidus's hair at 1600 and across his brow and eyes at 390. The laurel
  is flat, uniform clip-art leaves with no engraving, the cheapest-looking mark here. On the phone
  the card laurel is too small to read.

### Option C, the ribbon and the progress strip: 7.5 / 10
- The only option that teaches progress as well as state: a per-chapter mark plus "1 of 9 beaten"
  across both games (gold for X, pink for X-2), and the sash reads VICTORY 4:12 at a glance. This
  fits Bailey's "teaching" best.
- Faults, all fixable:
  - The sash cuts diagonally across the top-right of the painting, which on Evrae is the upper coil
    and spines.
  - The card ribbon is a gold corner with a tiny black star and no word, and it covers Evrae's head
    on the card.
  - The strip's unlit chips are dark grey on ink with small numerals, so the contrast is low at
    1600. They also look like a second row of buttons that repeats the rail. Either make them
    clickable, or make them flat pips.
  - The strip pushes the prose slab to within about 28 px of the controls strip at 1600.
  - On the phone the strip is unlabeled pips, so it only works together with the "1/9".
- Fixes: move the sash to the plate's top-left corner, or keep it off the boss's focal area. Put
  "VICTORY" or the time on the card ribbon, or use A's check there. Raise the contrast of the unlit
  chips, and make them non-interactive pips. Take the 32 px from the plate's height, not from the
  gap.

### Phone (all options)
The prose slab ends under the fixed controls strip's fade, so its last line is dimmed ("keep it."
on Evrae). The controls strip on a phone still says UP/DOWN and ENTER. Both come from the live
build, but the build should fix them, because every option now pushes the prose below the list.

### Recommendation
**C, with the shared art fix (the boss painted on its scene for all ten chapters) and the sash and
strip fixes above.** It is the only option that teaches both which chapters are beaten and how far
the player has come without veiling the art, and Bailey has already leaned to it. For open question
3: keep boss-on-scene for Leblanc and Evrae, and extend it to every chapter. That also removes the
need for a candidate-plate options round.
