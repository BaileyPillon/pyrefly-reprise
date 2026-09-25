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
