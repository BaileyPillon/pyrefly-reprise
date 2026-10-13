# r43-prepphone: paper preflight (critic/RUBRIC.md section 8, written 2026-10-12 by the lane's continuing sub-agent)

`node tools/critic-plan.mjs --paths <the changed files>` classes this change DEEP ("global layout, input and boot is a shared system":
`src/ui/common/party-prep-phone-tabs.css`, `prep-phone-sections.css`, `prep-phone-parts.css`, `prepPhoneKit.ts` and `prepPhoneFold.ts` are shared by
both games' prep shell). The lane's scope was fixed before the build: round 25's PR-0295 and Bailey's PREP-A pick (2026-10-12, item 59a of the
driver's list; D-781 is the standing decision that this layout is built only from a mockup he picks, and his pick approves the layout only). The
first sub-agent froze mid-build with the work uncommitted; this note is the preflight's content written beside the measurement, not before it.
Result: **PROCEED**, with the narrowings under "What is not touched". No REPAIR cycle was needed inside the lane beyond one defect the browser
proof showed on the first pass (the faces' hidden names read as cut and overprinting text to the sweep) and one narrow-phone fix (320 px: the
seven heads did not fit one row; fixed by letting them shrink).

## Game case (AGENTS.md rule 14), from the sources

| Change | Case | Source of the case |
|---|---|---|
| The prep shell's phone hooks (`phonePrep.ts`: `data-phone`, `is-scrolled`, the strip kept in view), the pinned strip and faces (`party-prep-phone-tabs.css`), the sections, the fold and the keys (`prep-phone-sections.css`, `prep-phone-parts.css`, `prepPhoneKit.ts`, `prepPhoneFold.ts`) | both | one shell and one set of panel hooks for both games (`.prep.ig--ffx2`; `critic/CHECKS.md` CHK-020: shared plumbing is "both") |
| FFX Stats, Equipment, Items, Overdrive phone pages (`src/ui/ffx/party-prep/phoneViews.ts`, `overdriveText.ts`, `panels.ts`) | FFX only | `.ffxprep-*` panels; the FFX roster is seven heads, accent gold, slabs lean left |
| FFX-2 Dresspheres, Stats, Accessories, Items phone pages (`src/ui/ffx2/party-prep/phoneViews.ts`, `panels.ts`, `StatsPanel.ts`) | FFX-2 only | `.x2prep-*` panels; three girls as three name tabs, accent pink, slabs lean right; no Equipment or Overdrive tab (`research/ffx-vs-ffx2-presentation.md`); stats are dressphere x level only [ffx2-combat-core §5.1]; accessories stop working inside a special dressphere |

## Acceptance cases (named before the numbers)

1. A DOM sweep of every prep tab of both games at 390x844 and 430x932 (touch, real taps to open each tab, fresh profile; font-size times every
   ancestor's scale, off-screen text included): **0 text elements under 14 px** on the eight tabs (the round measured 2.98 px and 47 to 181 under 14 per tab).
2. Each of the eight tabs fills the width, has no sideways scroll, no overprinting and no cut text, keeps START BATTLE uncovered, and ends above it.
3. Every function by real touch and by keys: tabs, faces, folds, the Overdrive mode, page scroll with the strip and faces pinned, L1 and R1, Triangle, Esc, START BATTLE.
4. Desktop 1600x900 is pixel-identical to origin/main on every tab of both games (the Sphere Grid's own animation excepted, measured against the same
   build twice); 1280x720 and 600x900 likewise.
5. CHAPTER and SPHERE GRID are unchanged at the phone (same results as origin/main).
6. The page matches the five PREP-A frames; the four tabs with no frame are in the same recipe.

## What could break, and how it was checked

- **A desktop board that shifts.** Every rule is inside one `@media (max-width: 599px)` and keyed on `.prep[data-phone='page']`; the only rule outside is the host's
  `display: none`. A unit test parses the three sheets for that, and the desktop frames are compared pixel by pixel (acceptance case 4).
- **Numbers that differ from the desktop sheet.** The views are pure functions of the same rows (`effectiveStats`, `autoAbilityLabel`, `itemLabel`,
  `dressphereStats`, `accessoryEffect`); unit tests compare every figure and the notes (character for character), and the browser proof compares the phone page to the hidden board for every member.
- **A new tab left a shrunken board.** A contract test mounts every registered panel of both games and requires a phone page on all but CHAPTER and SPHERE GRID.
- **The shell's keys.** Enter and Space stay "begin" (the game's keymap), so a fold header cannot also be a key target; Triangle (Tab, Shift, Q, pad Y) opens or folds every section and
  L1 and R1 page the page, as they page the CHAPTER tab. None is bound on the desktop board and none acts unless the page is the phone-width scroller.
- **Text a sweep cannot tell from cut text.** The faces keep each name for a screen reader; drawn clipped to 1 px they read as cut and overprinting text, so they are `opacity: 0` inside the head's own clip.
- **Narrow phones.** 360x740 and 320x640 were run too (the heads shrink to 40 and 35 px, the girls' names set between 20 and 16 px); a 600 px window is the desktop board.

## What is not touched, and why

- **CHAPTER and SPHERE GRID** (PR-0127 / D-071, PR-0127 / D-295): they ship their own phone pages and keep them byte for byte; a pixel comparison against origin/main at 390x844 confirms it (the Sphere Grid's animated map excepted).
- **The desktop Overdrive rows' mouse click** (found, not caused): the rows inherit `pointer-events: none` from `#ui`, so a real mouse click lands on the canvas on origin/main too.
  Pixel-identical desktop was the brief, so it is reported for the driver, not fixed here. The phone rows set `pointer-events: auto` and take a real tap.
- **Colours beyond the Ink & Gold tokens** (the four shades the PREP-A page uses that the tokens lack are the nearest tokens, as the lane's brief says, commit `98bcc847`; the page's own are a one-line switch each; see the handoff).
- **A Wait or Active choice, a keyboard way to fold one section, or any change to the shell's keymap.** Ideas need a yes (hard rule 10).
