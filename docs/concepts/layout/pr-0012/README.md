# PR-0012 — where does the FFX-2 command help slab go?

**Nothing here is built.** No file under `src/` was touched. These are hard-rule-9
option frames answering the placement Bailey needs to pick before the FFX-2
command-help slab can be switched back on.

**Game case (rule 14): FFX-2 only.** FFX already has this (`src/ui/ffx/commandHelp.ts`
+ its own slab); the two games' command menus are separate components, and this
sheet is about the FFX-2 half only.

## The question Bailey answers

> The FFX-2 command menu never says what the highlighted row does. The
> description logic (`src/ui/ffx2/commandHelp.ts`) is built and correct; the
> slab that would show it is switched off (194fa87) because every placement
> tried inside `.ffx2hud__command`'s cramped right-hand column draws over the
> party rows. FFX-2's own real Config menu has a **Battle Help** entry
> (`research/ffx-vs-ffx2-presentation.md` line ~278), so canon expects a toggle
> for this, not a fixed spot — but the fixed spot has to exist first. Which of
> these four does Bailey want it to be?

`sheet.png` puts all four options side by side, each shown at game size
composited over a real capture (`before.png`, the `_kit`'s `ch4-ffx2-hud.png`,
Chapter 4, Bahamut fight, command menu open with the guide/moves panels also
up). `a.png` / `b.png` / `c.png` / `d.png` are the same frames at full
1920x1080; `a.html` etc. are what rendered them (kit:
`docs/concepts/polish/_kit/`).

## A — one-line slab at the top of the screen (recommended)

A full-width band at `top: 0`, pink bottom rule, printing the highlighted row's
label and description on one line. This is where FFX-2's own real interface
puts its help text per the source above — "FFX-2 has a Battle Help Config
option" and the wiki's menu listing places Battle Help among the HUD-level
toggles, not a per-window widget. It clears the command window and the party
rows with room to spare in every screenshot checked (Chapter 4's boss-scan and
guide panels already occupy the top-left and top-right corners without
touching row 0). Cost: a permanent 52px strip at the top of every FFX-2 battle
frame, whether or not a row is highlighted.

## B — inside the command window, under the rows

The placement 100abe95 shipped and 194fa87 switched off, shown here as the
collision it is: the dashed box marks where the party HP/MP rows already sit
(`right:10px; bottom:10px`, spanning roughly `bottom:10px..100px` at the
680x360 logical grid), and the command stack's own box ends at
`bottom:116.44px`. A slab "under the rows" has nowhere to go that isn't inside
that dashed box. Included to show why this option was gated off, not to
recommend it.

## C — tooltip beside the highlighted row

A pointer-tailed pill floating to the left of the cascade, vertically pinned to
the highlighted row. Clears the command window and the party column, but rides
on top of whatever the battlefield puts there — here it sits over Bahamut's
own body, which will vary by encounter, camera angle and boss size (a small
enemy would leave it over empty background; a screen-filling one could have it
cross a wing or a limb). Also the only option that needs per-row vertical
repositioning as the highlight moves.

## D — keep it off

Today's shipped state (`FFX2_COMMAND_HELP_PLACEMENT_RESOLVED = false`). The
description logic is correct and reachable, wired to nothing the player sees.

## Recommendation

**A.** It is the only option that is both a canon-sourced spot for FFX-2 Battle
Help and clear of both hazards (party rows, battlefield content) without
touching the command window's own geometry. Its only cost is the permanent top
strip. (A recommendation, not a decision; rule 10.)

## Evidence

- `src/ui/ffx2/commandHelp.ts` — the description logic, built and correct.
- `src/ui/ffx2/FFX2BattleHud.ts` — `setCommandHelp`, gated off, and the
  `bottom:10px..100px` party-row note quoted above.
- `src/ui/ffx2/ffx2-hud.css` — `.ffx2hud__command` (`right:12px; bottom:116.44px;
  width:129.78px`) and the party-row rules it collides with.
- `194fa87` — the repair commit that documents the collision and gates the
  slab off pending this pick.
- `research/ffx-vs-ffx2-presentation.md` (~line 278) — the sourced Battle Help
  Config entry in FFX-2's own menu.
- `before.png` — the real capture all four frames are composited over
  (`docs/concepts/polish/_kit/before/ch4-ffx2-hud.png`).
