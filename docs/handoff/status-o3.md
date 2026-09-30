# Status display O3 "Originals + guard rails" (both games)

Branch `status-o3` (from `origin/main` 1a6fd3cc), worktree `D:/pyrefly-advisor-v3`. Not merged,
not pushed, not deployed (the driver does that). Bailey picked O3 on 2026-09-29 ("I'll go with
all of your recommendations please"); target: `docs/concepts/status-display-0929/options/o3-*.jpg`
and the README's coverage table; sources: `research/status-display.md` (looks) and
`research/ffx-combat-core.md` §4.2 / `research/ffx2-combat-core.md` §2.8 (rules and cures).
Paper preflight (rule 15, `critic-plan` says DEEP): `docs/plans/status-o3-review.md`.

## Target vs build

`docs/concepts/status-display-0929/final/`:

| Sheet | Moment |
|---|---|
| `o3-vs-build-ffx-desktop.jpg` | FFX Chapter I, Hi-Potion aimed at the Zombie Kimahri (840 HP), 1600x900 |
| `o3-vs-build-ffx-phone.jpg` | the same, 390x844 |
| `o3-vs-build-x2-desktop.jpg` | FFX-2 Chapter IV, Bahamut (Doom 3), Rikku Poison + Silence, Yuna Sleep, Paine Haste + Curse, 1600x900 |
| `o3-vs-build-x2-phone.jpg` | the same, 390x844 |
| `build-gallery-ffx.jpg`, `build-gallery-x2.jpg` | the other sourced looks the mockups did not stage (not a target; proof they render) |

Top or left is the approved mockup, bottom or right the build. The build frames are the real
game (dev server, headless real GPU), statuses written into the engine state the same way the
mockup's capture did, the aim reached with real keys. The message line is held for the picture
(`statusLooks.message.hold`), as the mockup held it; in play it shows about two seconds.
Scripts: `final/src/cap.mjs` (capture, `CAP_VARIANT=gallery`, `CAP_PERF=1`, `CAP_CPU=1`),
`final/src/sheets.py`, `final/src/play.mjs` (a chapter played to its outcome with the layer on).
Build screenshots also in `docs/screenshots/picks-0929/status-o3/`.

Distance from the target: the same elements in the same places at both sizes. Known small
differences: the smoke and Z's sit 10 to 15 px off the mockup's hand-placed head points (the
field's head anchor plus one shared drop, `HEAD_DROP`); icons on a dimmed party row dim with the
row (the mockup drew them on top); the FFX-2 phone mockup shows Paine's gauge red, the build
caught it at the moment it read full (timing, not this change).

## What is built (game case per status, rule 14)

Code: `src/ui/common/withStatusLooks.ts` (the HUD tap, wired in `BattleScreenWiring.createHud`),
`statusLooks.ts` (the two tables), `statusMarks.ts` + `status-marks.css` (marks on the figures),
`statusFigureTint.ts` (tints, Zombie's glow, Stop's freeze, Pointless's flash), `statusIcons.ts` +
`statusRows.ts` + `status-icons.css` + `status-rows.css` (O2 icons), `statusWords.ts`,
`statusMessageLine.ts`, `statusHintCard.ts`, `statusTargetTags.ts`, `status-o3.css` (O3), and
`src/ui/ffx/statusRailsFfx.ts` (the Zombie forecast).

- **O1 on the figures.** FFX: Zombie green body + held green glow + black smoke; Poison bubbles;
  Sleep Z's; Confuse two stars; Berserk red hue; Curse brown hue; Auto-Life halo; NulBlaze /
  NulFrost / NulShock / NulTide red / white / yellow / blue orbs; Protect's blue shield when a
  physical hit lands; Doom's count now **red** over the head (`ui/ffx/doom-counter.css`).
  FFX-2: Sleep Z's; Poison bubbles; Silence ellipsis bubble; Darkness black cloud; Confuse
  stars; Curse darkened body; Stop frozen figure (thawed for any action or hit that names it, so
  no presenter beat can wait on it); Pointless slow flash; Auto-Life halo; Protect's shield on a
  physical hit; the targeted unit's icons in the top help line ("ATTACK Physical damage |
  Bahamut [icons]"). Haste red / Slow gold gauges were already built.
  **Nothing is drawn** where no source describes a look: FFX Silence, Darkness, Slow, Haste,
  Shell, Reflect, Regen, Provoke, Guard, Defend, the Breaks; FFX-2 Berserk, Shell, Regen,
  Invincible, the Up/Down family; FFX-2 Doom over the head (see question 2).
- **O2 icons.** FFX: round medallions right-aligned under the Overdrive gauge (phone: tabs on
  the card's top edge), and beside each unit's first turn-list row (phone: on the tile's
  corner). FFX-2: square tags in place of the old text chips, and a STATUS tab under a boss's
  bar (phone: the icon inside the boss head, before SCAN). Red rim = harms its holder, teal =
  helps. Every glyph is fresh SVG (rule 8). The old FFX pips (`ui/ffx/statusPips.ts`) and FFX-2
  chips (`ui/ffx2/statusChips.ts`) had no importer left and were moved to
  `F:/pyrefly-parked/2026-09-29/status-o3/` (MOVED.txt there).
- **O3 guard rails.** FFX: a restorative or revival aimed at a living Zombie ally shows the
  engine's own preview (`simulateFFXCommand` on a copy, the fb-0929-hipotion path): a red
  "HI-POTION ON A ZOMBIE −1000 KO" beside the figure, the help slab as a red warning with his HP,
  "✕ HURTS" on the item row, the plate note as a red ZOMBIE tag (its words kept in the title),
  on the phone the same in the target card plus a red rim on the confirm button. Both games:
  DOOM n on the target tag (FFX from the turn countdown; FFX-2 only when the engine carries a
  count, question 1); the guide card's cure hint from each game's own cure table (FFX Zombie,
  Sleep, Silence, Curse; FFX-2 Sleep, Silence, Curse), in the guide's slot or at the top of the
  open guide; a caption where a status **takes the command away** (FFX: ASLEEP, STONE,
  CONFUSED, BERSERK; FFX-2: ASLEEP, STONE, STOPPED, BERSERK; none on the phone cards, as in
  the phone mockups); the one-line message when a status lands or wears off ("Kimahri became a
  Zombie."), merged for several units at once, never on a KO or an overwrite.

## Evidence

- `npx tsc --noEmit` clean (the only errors in this worktree are the untracked advisor-v3
  scratch tests under `tests/unit/zz-scratch/`, not this track's).
- `tests/unit/status-o3-mapping.test.ts` (18): each game's table pinned; an undescribed status
  draws nothing; icon sets, harm/help, captions, words, cure hints per game.
- `tests/unit/status-o3-hud.test.ts` (10): the rows replace the pips and chips; a **real Chapter
  I battle** piped through the tap (lines "Yuna became a Zombie.", "Kimahri became a Zombie.",
  4 Protect shields on seed 1); the forecast on a real zombified-Kimahri board is 1000 and KO at
  840 HP, Phoenix Down KOs, and the board is unchanged afterwards (rule 1); Stop's freeze and its
  thaw.
- `tests/unit/fb0929-zombie-warning.test.ts` updated to the new markup (the Zombie icon leads the
  row in the harm rim; the note's words read from the tag's title).
- Real play, headless GPU (`final/src/play.mjs`): Chapter I auto-played to its outcome with the
  layer on: defeat at turn 38, **identical** to the same seed on main (the tap changes nothing in
  the fight); 8 distinct lines, marks and tints seen, no page errors. FFX-2 Vegnagun 5 minutes:
  Slow and Poison lines, bubbles, 74 shield samples, no errors.
- Performance, 1600x900, the FFX mockup moment (everything up at once): 60 fps held
  (frame mean 16.67 ms, p95 16.7 ms, same as main). CPU profile: the layer's own script
  0.19 ms/frame. The HUD update measures 0.9 to 1.2 ms against main's 0.37 ms because the
  first layout read of the frame lands in it; per-frame reads of the big boxes are cached
  (0.25 to 0.5 s) and writes only happen on change.

## Decided here (flag to Bailey if wrong)

- Captions only where the command is taken away: the approved FFX-2 frame shows ASLEEP on Yuna
  and nothing on Rikku's Silence, so Silence and Curse get the guide hint instead.
- FFX-2 Confuse gets no caption: its source says a confused girl "may use any command she has".
- The message line rides above the targeting reticle (z 40 over its 36) and is mounted on the
  battle root, so the Bahamut reticle no longer covers it.

## Not built

- The README's other O3 rows the brief did not list: "a single-target spell will bounce"
  (Reflect) and "a physical hit shatters" (Petrify). FFX-2 Reflect's shield flash is sourced but
  the FFX-2 engine never bounces a spell, so there is no event to draw it on.
- FFX-2 Stop's gauge colour (gray or white: the sources conflict, research §5).
- The Sensor panel's icon row (README O2 text; neither mockup shows it).
- The Sleep hunch and the low-HP slouch (not approved paintings).
- Dead CSS for the old pips and chips is left in `ffx-hud.css`, `ffx2-hud.css` and the phone
  sheets; a stale comment in `battle/ffx/turnQueue.ts` still names `statusPips.ts` (engine file,
  left untouched).

## Questions for Bailey

1. FFX-2's engine counts Doom as a clock (duration units of 0.53 s), not turns, so in real play
   the tag and the STATUS tab read "DOOM" without a number; the mockup's "3" was staged. Show a
   number derived from the clock, or leave it?
2. `research/ffx2-combat-core.md` §2.8 says FFX-2 Doom is "a red countdown timer over the
   target's head" `[verified: 2 sources]`, while `research/status-display.md` §3 says the
   placement is unsourced. Draw FFX-2's count over the head like FFX's?
