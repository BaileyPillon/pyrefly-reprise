# r50-fixes: the greyed White Magic row's reason (LV48-1) and the party's Osmose as MP damage

Written 2026-10-15 by a Sonnet sub-agent of the release driver. Branch `r50-fixes`, from `origin/r49-rc` (`f939b87f2`). **Game case: FFX-2 only** for both fixes
(Itchy is FFX-2's status and the FFX command menu is its own component; the Osmose row is FFX-2's game row 0x317b; FFX's Osmose is a different spell and
no FFX text changed, pinned by a test). Merged into release candidate r50-rc (`docs/handoff/r50-rc.md`); nothing is deployed. No shared contract changed (`docs/CONTRACTS.md` lists none of these files).

## 1. LV48-1: under Itchy the greyed White Magic row showed no reason

Source: the r48 live check (`critic/reviews/ea431aa0-live.md`, LV48-1). Reproduced on a production build of `origin/r49-rc` (Chapter IV, seed 2, Itchy set through the
debug API as the review did, so Yuna's menu opens: WHITE MAGIC, CHANGE, ITEM, ESCAPE). Two separate causes, found by measuring the rows in the page:

| where | before | cause |
|---|---|---|
| desktop row, 1600x900 | the reason box is 1.9 px wide with the cursor on the row (30.7 px without); Item's is 151 px, Attack's 124 to 153 px | the RC7 stylesheet rule makes the reason give way to the name (kept). "White Magic" is 188 px of a 283 px line, the group arrow (24 px) and the cursor (13 px) follow it, so almost nothing is left |
| top bar (desktop) and footer line (phone) | "Open the White Magic menu." (Skill and Item the same) where Attack reads "Itchy — spherechange first — Physical damage" | `groupHelpText` (`src/ui/ffx2/commandHelp.ts`) wrote the bare opener for a group of several rows and never read the reason the group row itself shows |

Not an engine or data fault: `buildCommands` greys every White Magic and Item row with `ITCHY_REASON`, which a new test pins on the real registries.

What changed:

- `groupHelpText`: a group with nothing enabled in it leads with its first row's reason, the way a greyed leaf row does: "Itchy — spherechange first — Open the White Magic menu." (also "Silenced — Open the Black Magic menu." and a Cursed Change). The phone footer reads the same DOM line, so it follows.
- `src/ui/ffx2/CommandMenuReason.ts` (new, 50 lines) and `.ffx2cmd--reason-below` in `ffx2-hud.css`: after each render, a greyed row whose reason shows less than a fifth of its text beside the name (measured without the cursor, so moving the highlight never flips a row) puts the reason on its own line under the name, left-aligned like the phone layout, ellipsised only at the row's full width ("ITCHY — SPHERECHA…"). The name keeps every pixel; the RC7 rule is untouched for every other row. Desktop only; the phone already stacks. This is the same device as a Change row's `GRANTS:` line.
- Rows that already showed their reason are unchanged to the decimal: Paine's Attack, Skill and Item on the same build before and after, 1600x900: reasons 124 / 138 / 151.2 px with the cursor on the first, labels 104.9 / 80.4 / 67.2 px.
- Measured after on White Magic: reason on its own line 273 px at 1600x900, 307 px at 2000x1012, 219 px at 1280x720; label text intact; phone unchanged on the row (153 px under the name) and the footer now carries the reason.

A layout call a person may want to see: the stacked row is one line taller than its siblings (frames below). Rule 9 asks for a picture before a new look is built; this is the existing stacked-reason look (phone, Change gate line) applied to the one row that had lost its reason, so it was built as a repair, and the frames are the picture. A different answer (a shorter reason on the row, or no group arrow on a dead row) would give "IT…" at best, which is why they were not taken.

## 2. The party's Osmose reads as MP damage

The r48 text pass (`ffx2-intent-mp-damage.test.ts`) keyed "MP damage" on `extra.mpOnly` or `extra.damagesPool: 'mp'`; the party's Osmose (`x2-shared-osmose`) carries neither, only the `drains-mp` flag, which the HP-and-MP drains share (Gun Mage Absorb, the Core's Leg Absorb), so the flag cannot say which pools it takes. Its game row can: row 0x317b, "MP, formula 9, power 6, one hit, never rolls" (`research/re-ffx2-ai-fallen-trema.md`, the row table), `ffx2Record.damageClass` 2 (1 is HP, 3 both).

- `isMpClassRow` / `damagesMp` in `src/battle/ffx2/intentLead.ts`: a row is MP damage when its game row is class 2, it has a damage formula and it does not heal. The enemy-intent move slab now reads "Magical non-elemental MP damage to anyone." (the Paragon Oversoul's copy of it is the same row).
- `src/engine/tactics/advisor.ts` (`describeAbility`, shared with FFX, gated on `def.game === 'ffx2'`): the advisor line and the party's command help read "Magic MP damage". The same predicate also makes the party's Target MP ("MP damage") and Magicide ("Physical MP damage") say MP in those two places, where they said "damage"; they already carried the keys and were already MP damage in the move slab. Those are the only three party rows that change; no FFX line changes (0 of 490 FFX abilities say MP damage).
- Exactly one row is newly named by the game row and not by the keys: `x2-shared-osmose` (pinned).

**Left open, said plainly (not changed, no game row in our data to read the class from):** Black Mage's MP Absorb, the Thief's Pilfer MP and the Gun Mage's Absorb drain MP and still read "damage" in the move slab and the advisor (`x2-black-mage-mp-absorb`, `x2-thief-pilfer-mp`, `x2-gun-mage-absorb` have `drains-mp` and no `ffx2Record`). Reading them needs their rows from the game files (RE session) or a source for their pools.

No shipped build teaches the party Osmose (it is the Covetous grid's red node and a command of the Oversoul's list), so the frame of it is debug-assisted: the ability put on a girl's learned list.

## Proof

Tests (each fails without its fix, checked by taking the fix out and restoring it):

| file | tests | what |
|---|---|---|
| `tests/unit/ffx2-osmose-mp-damage.test.ts` (new) | 9 | the row is 0x317b class 2; the slab, the advisor line and the party's command help read MP damage; class 1 and 3 copies and an FFX copy do not; the three party rows; FFX untouched. 7 of 9 fail without the fix |
| `tests/unit/ffx2-intent-mp-damage.test.ts` | 17 | the r48 file, its open note closed and the "no other row" test restated to include the game row; the named list gains Osmose |
| `tests/unit/ffx2-itchy-reason.test.ts` (new) | 13 | the real engine's greyed White Magic and Item groups; `groupHelpText`; `onHelp` on the open menu; `reasonStacks` thresholds from the measured rows; `syncReasons` with the measures a layout engine would give (cursor hidden for the measure, phone left alone); the open menu marks White Magic only; the stylesheet rules. 5 of 13 fail without the fix |

## Results

On the merged r50-rc tree: `tsc --noEmit` clean, and the three files above 39 of 39 green (9 + 17 + 13). The frames are under `docs/screenshots/r50-fixes/`, each looked at: the White Magic row before and after at 1600x900 and 390x844,
its siblings before and after (Paine's Attack, Skill and Item unchanged, 1600x900), and the Osmose line after at 1600x900 and 390x844 (no before: no shipped build teaches the party Osmose). The full unit suite, the production build and the
browser walk of both fixes on the release candidate are in `docs/handoff/r50-rc.md`.
