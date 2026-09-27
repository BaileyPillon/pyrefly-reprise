# Iteration 2 B3: paper preflight (rule 15)

`node tools/critic-plan.mjs --paths` classes this batch **deep** (the battle presenter and its
lifecycle: `BattlePresenterEvents.ts`, `BattlePresenterPorts.ts`, `BattlePresenterStage.ts`,
`HudPort.ts`, `BattlePresenterSpellFx.ts`). Written by the B3 builder on 2026-09-27, while the
code stage ran and before any browser check (round 14 held the machine). Honest note: parts of
this were written after the first commits, not before them.

## What changes, and what could break

| Change | Game | Could break | Guard |
|---|---|---|---|
| D-233 specials (`spellfx/effects-specials.ts`, keyed by game) | Spiral Cut FFX; Mega Flare FFX-2 | FFX's own `mega-flare` (the aeon) and `spathi-mega-flare` picking up FFX-2's look; the numeral waiting too long | Per-game table (`SpellFxSpecials.ts`), a test on both FFX ids; per-effect hold cap (0.9 s spells, 1.5 s specials) and a repeat start that keeps a repeat under 1.2 s |
| Effect clock follows the playback speed | both | effects running 3x during a normal-speed beat | The rate is read from the presenter's own speed every frame; `skip` runs them out |
| Crit bloom on drawn effects | both | a crit lighting every figure | Only the copy the crit landed in scales, and only its figure bloom |
| A-5 pyrefly dissolve | both; never a person | a Goon or Leblanc dissolving into pyreflies; lights torn down with the figure | `pyreflyDissolves` = departure `'dissolve'` and not `NEVER_PYREFLIES`; the emitter is the stage's, disposed only with the stage |
| A-6 canon rows and the lens band | per location | pyreflies in a room canon keeps them out of | One cited row per scene key; the band only on `attested` rows |
| D-225 | Leblanc FFX-2, Macalania FFX, Gagazet FFX | Macalania's motes never coming back | Released on the engine's KO of `seymour-macalania` (his body stays, so removal is not the trigger) |
| D-224 phase lighting | per trigger | lighting on a non-canon beat; flashes; a lingering grade into the next battle | The canon table is the whole list; at most 3 starts a second; `reduceFlashes`; the base palette is restored on dispose; no canon beat, no renderer write |
| PR-0095 ring squash | FFX-2 Ch V | Redoubts squashed too | Per-anchor field; only the colossus Bulwarks ask for it |
| PR-0094 key features | FFX-2 Ch V | the slab with nowhere to go | Only the face and weapon boxes are hard; the rest of the part stays soft |
| A-8 contact shadows | both | a black blob on a bright floor; a shadow under a hovering figure | Scenes without a ground mesh keep today's blob; bright floors keep 0.48 navy; hovering figures get no ellipse |

## Stalled items (two failed attempts each)

- **PR-0094.** Tries 1 and 2 moved the slab or the part. Both left the tiered solver free to sit on
  a frame-filling part's soft box. The third try changes the obstacle instead of the placement: the
  part's face and weapon rank with the chrome.
- **PR-0095.** The rings exist since `iter2-vegnagun-a` (render order 11, re-anchored). What was left
  is the picked frame's flat Bulwark rings and the live measure; the builder does not change the
  anchors again.

## Checks before hand-off

- `npx tsc --noEmit`, the vitest files touched, the full suite once, `node tools/orphans.mjs`.
- After round 14's capture: `tools/zz-b3-veg.tmp.mjs` at 1600x900 and 2000x1012 (links 3 and 4,
  rings, plates, key-feature cover), `tools/zz-b3-fx.tmp.mjs` specials / phase / dissolve / lens /
  probe / shadows. Every forced frame is labelled FORCED.
