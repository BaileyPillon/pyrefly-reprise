# Fixes for release 28 (branch `fixes-r28`, 2026-09-28)

Five small fixes from the Chapter XVI scenes check, the release 24 focused review (`critic/reviews/bc4e70ee-focused.md`)
and the release 25 focused review (`critic/reviews/79adc4ff-focused.md`). Built on main d89541b6 in the sparse worktree
`D:/pyrefly-fixes-r28`. Nothing merged into main, nothing deployed. Every frame below was driven by real keys (or taps)
in headless Playwright (`PYREFLY_BROWSER=gpu`) against this branch's dev server on 7820. The server was stopped by its PID.

| Item | Game case | What changed | Frames (`docs/screenshots/fixes-r28/`) |
|---|---|---|---|
| IXS-1 / M-01 | FFX-2 only | Chapter XVI on an upright phone: C2's row gains `phoneCentreY -2.2`, so the plate sits 4.5 lower (`djoseCentreY`). Ixion's spot, the slide and every desktop value are unchanged. | `ixs1-390x844-01..04`, `ixs1-1600x900-01..02` |
| IXS-4 | FFX-2 (the chapter); `dsl.ts` is shared | Stale comments: Chapter XVII becomes XVI, "unlisted" becomes Chapter XVI, "stand-in plate" becomes "provisional plate", and `setPose` has its doc comment back (see `CONTRACT-CHANGES.md`). | none |
| FOC24-01 | FFX only | On the FFX phone HUD the open Overdrive overlay goes to z 13, above the Zanmato gauge (z 10) and the enemy-intent panel. A picker list shows 5 rows before it scrolls. | `foc24-01-390x844-picker-row5`, `foc24-01-1600x900-picker-row4` |
| FOC24-02 | FFX only | The aeon's status row uses `aeonChipHtml`, the turn list's own PR-0176 rule (the approved portrait, never the navy Yojimbo, D-054). | `foc24-02-390x844-bahamut-row`, `foc24-02-1600x900-shiva-row` |
| P-01 | FFX only | Chapter III: the folded Sensor chip keeps `AIM_FOLD_CLEAR` (10 grid px) from every bracket and from the aimed target's name plate. | `p01-1600x900-*`, `p01-1280x720-*`, `p01-2000x1012-*` |
| P-02 | FFX only (FFX-2 passes 0) | The phone slide keeps a 16 px margin (`FRAME_COMFORT.ffx`) whenever every figure fits whole inside it. When one does not, the slide is exactly as before. | `p02-390x844-before`, `-after`, `p02-360x780-after` |

## How each was measured

- **IXS-1.** I read the camera, the painting plane and Ixion's quad from the running game. On the phone, the idle camera
  stands at about (-0.37, 3.53, 23.1) after the phone refit, not at z 13.2. So the "per-aspect spot" options would
  have needed Ixion at z -11 or deeper, which shrinks him by about a quarter. Sliding the plane down 4.5 world units puts
  the floor under his hooves at mean luma 149, with 0 percent of pixels under 60. Before, it was 69, with 64 percent
  under 60. It measures the same at 360x780.
  - The lunge and Aerospark frames stand on lit stone.
  - Paine now stands on lit stone too.
  - Yuna and Rikku are still on the pit's near rim. This was disclosed before and has not changed.
  - The pit stays in the slice.
- **FOC24-01.** Chapter IX by real keys at 390x844, with Yuna's gauge set to 100 by the debug API (setup only). The
  list shows Valefor to Bahamut at y 91-201, all inside the list and on top. The selected Bahamut row is visible, and
  Enter summons Bahamut. The 1600x900 picker is unchanged, because the rule only applies under
  `html[data-phone-battle='ffx']`.
- **FOC24-02.** At 390x844 Bahamut's row shows his portrait, and at 1600x900 Shiva's row shows hers. A unit test
  asserts that the status row asks for the same images as the turn tile, and that Yojimbo gets none.
- **P-01.** Attack, then Right through every target. With Braska's Final Aeon aimed, the chip sits this far from its
  bracket and from its name plate:

  | Size | From the bracket | From the name plate |
  |---|---|---|
  | 1600x900 | 72 px | 31 px |
  | 1280x720 | 66 px | 24 px |
  | 2000x1012 | 76 px | 38 px |

  With a Pagoda aimed, the chip is 24 to 34 px from every bracket. It does not touch the guide, the advisor, the
  TARGET plate or the turn list.
- **P-02.** Chapter I at 390x844:

  | | Before | After |
  |---|---|---|
  | Seymour Flux's right edge (of 390) | 380 | 374 |
  | Tidus's left edge | 35 | 21 |

  At 360x780 his right edge is at 346 of 360.

## Gates

- `npx tsc --noEmit` and `npm run typecheck:e2e`: clean.
- Touched tests pass:
  - `ixion-listed` (13)
  - `ui-ffx-ctb-aeon-portraits` (7)
  - `ui-portrait-urls`
  - `ffx-sensor-chip-lift` (5)
  - `phone-battle-hud-repair` and `phone-battle-guard` (24)
- Full suite, run once: 606 files passed and 1 failed. The failure was `strategy-ffx2-bahamut.test.ts` "heal-only route",
  a pure-engine bench that timed out at 15 s under full-suite load (23 s). Run alone it passes, 19 of 19 in 14 s. This
  branch touches no engine code.
- `node tools/orphans.mjs`: 24 orphaned. No file was added under `src/` (14 modified, 0 added), so no new orphan is possible.
- `verify-approved` (ROOT = this worktree): 271 ok, 0 mismatched, 0 missing.

## Left open

- **IXS-3** (the provisional keys `djose-chamber-provisional` and `farplane-abyss-provisional` drop the `ffx2-`
  prefix): **not done**. A rename would move gitignored art, sidecars and the manifest in the shared `public/art`
  (this worktree's is a junction to main's). That is not trivial or safe under the no-deletes rule. It belongs to
  whoever installs Bailey's C and A picks.
- IXS-1 minor 2 (1600x900, the lunging foreleg reaches over the slab): the desktop is untouched, as briefed.
- FOC24-03 (the Grand Summon subtitle runs past the panel edge, and on the phone it is 5.33 px text), FOC24-04 and
  FOC24-05: not in this batch.
- The desktop Chapter XVI framing, and every C1 or C2 and A1 or A2 pick: still Bailey's (rule 9).

## CHECK (independent, 2026-09-28, on cb507601)

An agent that did not build the branch checked it against its own production build (`vite build` into a private
out dir, `vite preview` on 7830, stopped by its PID). Headless Playwright from node (`PYREFLY_BROWSER=gpu`), one
browser at a time, real keys for every step. The only setup was Yuna's or Kimahri's gauge set to 100 through the
debug API. Scratch scripts are `tools/zz-r28chk-*.tmp.mjs` and the frames are in `.r28chk-out-tmp/`, both untracked.

**Verdict: PASS, 0 blockers.** Every item meets its acceptance. Three minors are listed below; none blocks the merge.

| Item | Result | Measured on my build |
|---|---|---|
| IXS-1 (FFX-2 only) | PASS | The floor under Ixion's feet was measured with every figure hidden, in an 80 x 16 px box. At 390x844 the mean luma is 148 with 0 % of pixels under 60, and it stays 148/0 % and 146/0 % on his two actions. At 360x780 it is 148 with 0 % dark on the menu and both actions. At 1600x900 (desktop, code path unchanged) it is 145, 143 and 146, all 0 % dark. Ixion's box on the phone is 169 px wide, so he is not shrunk. |
| IXS-4 | PASS | The diff is comments only: `setPose` has its doc comment back in `dsl.ts`, and the entry is in `CONTRACT-CHANGES.md`. |
| FOC24-01 (FFX only) | PASS | Chapter IX at 390x844: the picker covers y 56-214 and draws above the Zanmato gauge in the frame. All five rows (Valefor to Bahamut, y 91-201) are inside the list. Four Downs and Enter summon **bahamut**. At 1600x900 the list still shows 4 rows (Bahamut scrolls), as before. Three Downs and Enter summon **shiva**. |
| FOC24-02 (FFX only) | PASS | The aeon's status row loads `portraits/bahamut.png` at 390x844 and `portraits/shiva.png` at 1600x900, each over the idle crop, loaded and visible. These are the same images as its turn-list tile. |
| P-01 (FFX only, Chapter III) | PASS | Gaps from the folded chip while aiming at the Final Aeon: 72 px to its bracket and 30 px to its plate at 1600x900; 66 and 24 at 1280x720; 76 and 34 at 2000x1012. With a Pagoda aimed, the chip is at least 24 px from every bracket. It is at least 56 px from the guide, the advisor, the turn list and the TARGET plate. Escape returns to Attack. |
| P-02 (FFX only) | PASS | At the first menu in Chapter I at 390x844, Seymour Flux's right edge is at 374 and Tidus's left edge at 28. At 360x780 his right edge is at 343. See the next row for the other chapters. |
| No regression | PASS | On the phone at 390x844, every staged figure stays inside the window at the menu and while aiming in Chapters II, III, VIII and IX. The ones too wide for the margin fall back to the old slide (Evrae 24-383, Yunalesca 22-382). FFX-2 Chapter IV Bahamut passes 0 and frames 33-380. The desktop paths for IXS-1 and FOC24-01 are gated on the phone query or `html[data-phone-battle='ffx']`. P-01 applies only in the Yu Pagoda fight. |

Gates on my run:

- `tsc --noEmit`: clean.
- `typecheck:e2e`: clean.
- Orphans: 24 (975 modules, 951 reachable).
- `git merge-tree --write-tree origin/main HEAD`: clean, no conflicts.
- Full suite, run once: 606 passed, 1 failed, 5 skipped. The failure was the same `strategy-ffx2-bahamut` "heal-only route" 15 s timeout, under load with a browser running alongside. Run alone, that file passes 19 of 19 in 12.6 s. It is a pre-existing load flake, and this branch changes no engine code.

Minors (disclosed, not blocking):

1. **IXS-1, "Paine now stands on lit stone."** My measurement does not reproduce this. The box under Paine's
   projected feet has a mean luma of 37-58 and is about 80 % dark at 390x844 and 360x780. Zoomed in, she stands on
   the pit's grey rim wall, with dark pit to her left. That is the same party-on-the-rim case already disclosed for
   Yuna and Rikku. Ixion's floor, the item's acceptance, is clearly lit.
2. **FOC24-01 reaches other Overdrive pickers.** The rule changes every FFX phone `.ffx-mg-list` (Grand Summon, Ronso
   Rage, Mix): max-height goes from 92 to 112 and the overlay's z-index to 13. It only makes lists taller and puts
   the overlay on top. In Chapter IX, Kimahri's Overdrive went straight to targeting with no list, and Rikku's Mix
   list was not exercised on the phone.
3. **The full suite still flakes** on `strategy-ffx2-bahamut` under load. This is a test-budget issue, not a problem
   with this branch.
