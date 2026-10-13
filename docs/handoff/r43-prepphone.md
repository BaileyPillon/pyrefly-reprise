# r43-prepphone: the eight heavy party-prep tabs on a phone, one long page (PR-0295, PREP-A)

Written 2026-10-12 by a Sonnet sub-agent of the release driver. It took over a first sub-agent that froze at 19:04 EDT with the work uncommitted and finished it (the build was
largely done and matched the target well; the rest was the unit tests, the browser proof, four fixes (two the proof showed, the 1 px hidden names and the 320 px row; two a read of the
code found, the breakpoint listener and the idle-frame return), the colours, the commits and these notes). Branch `r43-prepphone`
from origin/main `2868c195` (live `a061e9dc`); worktree `D:/pyrefly-r43-prepphone` (`node_modules` and `public/art` are junctions, both untracked: `cmd /c rmdir` each before ever
removing the tree). **Nothing is merged and nothing is deployed.** Commits: `f060d152` (the build and its unit tests), `e0f66efa` (what the browser proof showed), then the proof frames and these
notes. Source: deep round 25's PR-0295 (major, interface); Bailey's PREP-A pick (2026-10-12, item 59a of the driver's list: "I'll go with all of your recommendations"; the pick approves the
LAYOUT only; D-781 is the standing decision that this layout is built only from a mockup he picks). Frames and numbers: [docs/screenshots/r43-prepphone/](../screenshots/r43-prepphone/README.md). Paper preflight:
[docs/plans/r43-prepphone-review.md](../plans/r43-prepphone-review.md). `node tools/critic-plan.mjs` classes the change DEEP (shared layout and input), so a deploy of it owes a focused review before and the deep
review after (`critic/RUBRIC.md` section 4).

## What round 25 found, and what is true now

PR-0295: on a 390x844 touch phone FFX Stats, Equipment, Items and Overdrive and FFX-2 Dresspheres, Stats, Accessories and Items drew the 640x360 desktop board at 0.61 scale in a band across the middle
of the screen. The smallest text was 2.98 px (3.29 px at 430x932), 43 to 177 text elements under 14 px per tab. Chapter and Sphere Grid had phone pages; these eight did not.

Now each of the eight is one scrolling column built to the PREP-A frames: a tab strip and a row of faces pinned while the page moves under them, the member's name line, then folding sections that keep a
one-line digest of their numbers when folded; START BATTLE pinned with the MORE BELOW cue, as the Chapter page does. Measured the way the round measured it (real touch to open each tab, font-size times every
ancestor's scale, off-screen text included) on the pristine origin/main and on this branch, same machine and art: **smallest text 14 px and 0 elements under 14 on all eight tabs at 390x844, 430x932, 360x740,
320x640 and 599x900**, no sideways scroll, no overprinting, no cut text, every tab fills the width. The table is in the screenshots README.

## What changed (game case per item, AGENTS.md rule 14)

| Item | Case | Why this case |
|---|---|---|
| `src/ui/common/party-prep-phone-tabs.css` (new): the stacked page's frame (one flex column, the strip and the faces pinned, the dock and the cue); `src/app/screens/party-prep/phonePrep.ts` (`data-phone="page"` on `.prep` for the six tab ids, `is-scrolled`, the open tab kept in view, the breakpoint listener) | both | one shell for both games (`.prep.ig--ffx2`); shared plumbing is "both" (`critic/CHECKS.md` CHK-020) |
| `prep-phone-sections.css`, `prep-phone-parts.css` (new), `prepPhoneKit.ts`, `prepPhoneFold.ts` (new): the sections, the rows, the pure markup helpers, the fold, the keys | both | the same shared plumbing: the eight panels draw through one kit |
| `src/ui/ffx/party-prep/phoneViews.ts`, `overdriveText.ts` (new), `panels.ts`: FFX Stats (ten rows in four groups), Equipment (weapon and armour, every slot drawn), Items, Overdrive (the mode rows are tappable) | FFX only | the `.ffxprep-*` panels; seven heads (a round head each); accent gold; slabs lean left; `overdriveText.ts` is the Overdrive words moved out of `panels.ts` unchanged |
| `src/ui/ffx2/party-prep/phoneViews.ts`, `panels.ts`, `StatsPanel.ts`: FFX-2 Dresspheres (worn, learned, Garment Grid, also owned), Stats (the worn block, then nine other spheres as folded rows with up and down counts), Accessories (two slots), Items (the bag and the gil) | FFX-2 only | the `.x2prep-*` panels; three leaning name tabs for the three girls; accent pink; no Equipment or Overdrive tab (the dressphere is her equipment; `research/ffx-vs-ffx2-presentation.md`); stats are dressphere x level only [ffx2-combat-core §5.1]; accessories stop working inside a special dressphere |

No game data was invented: every phone view is a pure function of numbers the desktop sheet already prints (`effectiveStats`, `autoAbilityLabel`, `itemLabel`, `dressphereStats`, `accessoryEffect`, the Garment Grid
and dressphere tables, the bag), and unit tests compare them and the notes character for character. Nothing under `src/battle/**` or the presenter was touched; no shared contract (`docs/CONTRACTS.md`) changed.

## How it works

- Each panel draws its desktop markup exactly as before and appends one hidden host (`<div class="prph">`) beside it in its own container (`appendPhoneHost`); `selectMember` redraws both. Outside the phone media query the host is
  `display: none`; inside it, on `.prep[data-phone='page']`, the host shows and every other child of the panel's container is hidden. A desktop size is unchanged by construction, and a unit test parses the three sheets for it.
- `phonePrep.ts` keeps `data-phone="page"` on `.prep` for `stats, equipment, items, overdrive, dresspheres, accessories` (`isPhonePageTab`). CHAPTER and SPHERE GRID never get it, so they keep their own pages (PR-0127).
- A section's open or folded state lives in the DOM (`is-open`), so a redraw for another member reads it back (`readOpen`) instead of keeping a second copy; a tap on a header folds or opens it (`aria-expanded` follows).
- **Keys.** The shell's stay the shell's (Up and Down walk the party, Left and Right the tabs, Enter and Space begin, Esc goes back). On the stacked page L1 and R1 (PageUp, PageDown, F, R, pad LB and RB) page the page by a screen of its own
  content, and Triangle (Tab, Shift, Q, pad Y) opens every folded section or folds them all, so nothing a fold hides is out of reach of a keyboard or a pad. None is bound on the desktop board and none acts unless `.prep` is the phone-width scroller.
  Enter and Space cannot be a per-section fold key: the game's keymap makes them "begin the battle".
- The Overdrive mode is the one control on these tabs; a tap on its phone row equips it as the board's row click does, and the board and the phone page stay in step.

## Where the build differs from the PREP-A target

Measured on the frames (`profile` of the accent borders and ivory bodies, target against build): every block is within 1 px vertically on the four frames at rest; on the scrolled frame the touch drag rests at 227 px, the target's 230, so the blocks are 2 px
apart. Beyond that:

1. **Colours.** The page uses four shades the Ink & Gold tokens lack: small accent text on ivory (#7f5c0a gold and #9c3267 pink, "deepened to 5.4:1 because the approved on-paper accent is 3.4:1 at this size"), and the up and down counts on a dark plate
   (#7fd09a and #f08a8a); the ivory-body deltas are the shipped FFX-2 Stats tab's own #2f7a46 and #a5323a. The build takes these four from the page (not from the nearest token). The first sub-agent had mapped them to tokens (a lighter, lower-contrast accent text and
   ivory up and down counts); that was reversed because the target and its contrast reasoning are the approved thing. **Bailey did not name colours, only the layout: if he wants the tokens instead, it is one line each in `prep-phone-sections.css` (`--prph-acc-text`, `--prph-good`, `--prph-bad`).**
2. The section plate is the `--ig-ink-panel` token (0.84), the page drew 0.90; the stuck bar's ground is `#04060b` (the Chapter page's), the page drew `#05070c`. Both are invisible on the dark ground.
3. The seven FFX heads are about 45 px and round (the page drew 46 px): seven heads share a 362 px row. At 360 they are 40 px and at 320 35 px; the page was drawn at 390 only.
4. START BATTLE is within 1 px of the frames' (the shell's own button; the text row inside it reads 1 to 2 px lower).
5. **Four tabs have no PREP-A frame** (FFX Items, FFX Overdrive, FFX-2 Dresspheres, FFX-2 Items): the mockup drew five frames. They are built in the same recipe (sections with digests, the same plates, rows and chips) and are Bailey's to see
   ([the side-by-side frames](../screenshots/r43-prepphone/side-by-side/390x844/)). Under hard rule 10 and the "inferred" rule (15) they are the driver's guess at what he would have drawn; ask before building more of them.
6. The faces keep each FFX name and level for a screen reader at `opacity: 0` inside the head (the frames show heads only).

## Found, not changed (outside this lane)

- **FFX Overdrive: the desktop board's mode rows do not take a real mouse click** on origin/main either: they inherit `pointer-events: none` from `#ui`, so the click lands on the canvas (`getComputedStyle(row).pointerEvents` is `none`; `elementFromPoint` returns the
  canvas). A `row.click()` still equips the mode, which is why the unit tests pass. On a tablet at 600 px or wider the same rows are untouchable. The phone page's rows set `pointer-events: auto` and take a real tap. Pixel-identical desktop was the brief, so this is for the driver:
  a one-line `pointer-events: auto` on `.ffxprep-mode-row` would fix it (like the shell's own `[data-action]` elements, see `tests/e2e/party-prep-pointer.spec.ts`).
- The Chapter and Sphere Grid phone pages read as overlapping to a sweep that includes off-screen text (the MORE BELOW cue and START BATTLE sit over content that scrolls under them): identical numbers on origin/main. By design, not touched.
- A tap that lands while a drag's momentum is still scrolling only stops the scroll and does not press, as on a real phone (Chrome cancels the fling and drops the tap). The first sub-agent saw taps swallowed right after scripted drags and
  called it a harness artefact; it is this, and not a defect of the page. The proof's drags end at rest (a hold before the release, so no fling), and every tap after a drag works.

## Not done

- Not merged, not deployed, no review run: `critic-plan` says DEEP; the focused review before a deploy and the deep review after it are the driver's. NOW.md, the decisions and actions ledgers (a row for the PREP-A pick, item 59a, and the delivery
  state of D-781) and the targets tile are the records lane's; nothing here edits them.
- A real device was not available: every proof is emulated (Chromium touch emulation at 390x844 and 430x932, Playwright's WebKit for layout). The real-phone feel (momentum scroll, the keyboard's absence) is for Bailey.
- The full `npm test` was not run (the brief named tsc, the prep and layout test files and the orphan check); the prep, CSS-sheet, ink-and-gold and text-floor-adjacent test files pass (see the commits), tsc is clean, `node tools/orphans.mjs` lists nothing new.

## How to re-run the proof

`docs/screenshots/r43-prepphone/scripts/` (Playwright scripts, with a README): serve the branch and a pristine origin/main export on two ports, set `PREP_BASE`, `PREP_WT`, `PYREFLY_BROWSER=gpu` and a `TEMP` that is not C:, run `run-final.sh`, then `finalize.mjs`.
Create `D:/Tools/pyrefly-overnight/PAUSE` first and remove it after (the GPU protocol), and stop every server by its PID.
