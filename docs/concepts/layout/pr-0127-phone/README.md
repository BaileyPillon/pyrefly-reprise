# PR-0127 at phone width: the party-prep CHAPTER card

**Nothing here is built.** No file under `src/` was changed. These are
option frames (hard rule 9) for the phone half of PR-0127: at 390x844 the
prep screen is today the 16:9 layout scaled to 0.61, so the CHAPTER card
shows only "FFX-2 · VI OBJECT Survive Russian" and its type falls to
4-7 px (baseline: `docs/screenshots/fix12/PR-0127-phone-ch6-baseline.png`).

**Game case (rule 14): both.** The prep card is shared (`src/ui/common/`
chapter panel, FFX and FFX-2 prep shells); each game keeps its own accent
(FFX gold, FFX-2 pink) and its own tabs. Shown for chapter VI (FFX-2,
Leblanc) and chapter I (FFX, Seymour Flux).

## How the frames were made

The running game (private Vite, port 5571, Chromium on the RTX 5070 Ti) was
taken to party prep at 390x844; `_phone-mock.js` then read the card's **real**
text, art, fonts and party from the live DOM and laid them out at native
phone pixels in an overlay, in that scratch session only. Every text node is
12 px or larger; nothing is cut except where an option collapses a row on
purpose.

- `sheet.jpg`: baseline plus the three options for both chapters, 1:1.
- `<chapter>-<option>.jpg`: each frame; `-full.jpg` is the whole scrolled
  page.

## The options

- **A. Stacked cards (scrolls).** Title strip with the hero painting, place,
  story, the three photos with their captions, objectives, TIP, then the
  party, in one column. START BATTLE is pinned to the bottom; a "MORE BELOW"
  cue shows while there is more. Page height ~970 px: one short scroll.
- **B. Tabbed card.** The same header, then two sub-tabs, STORY and
  OBJECTIVES · TIP (L1/R1 or swipe). Fits one screen with no scroll, but the
  objectives and the tip are behind a tab the player must think to open.
- **C. Collapsible rows.** Objectives always open; TIP and STORY collapse to
  one line each (tap to open). Fits one screen closed; opened it scrolls like
  A. The tip, the one sourced piece of advice, is cut to "Dispel her
  Not-So-Mighty Guard t..." until opened.

## Recommendation: A, stacked cards

Everything the critic's acceptance check asks for is readable at once, with
no hidden state and nothing that needs a new control; it is what the critic's
own fix suggests ("stack the card above the party list"), and phones scroll
natively. B is the choice if Bailey wants the prep screen to never scroll.

## Question for Bailey

1. **Phone-width prep card: A, B or C?** *Recommended: A.*
2. If A: keep the three photos at phone width (as shown), or drop them to
   shorten the scroll? *Recommended: keep them.*
