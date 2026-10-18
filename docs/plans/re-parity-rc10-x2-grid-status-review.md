# Paper preflight: RE parity RC10, lane XD1b, the Garment Grids that keep a status or an SOS set (FFX-2 only)

> `critic/RUBRIC.md` section 4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths src/battle/ffx2/adapt/auto-grid.ts,src/battle/ffx2/adapt/auto-layer.ts,src/battle/ffx2/auto-layer.ts,src/battle/ffx2/kit.ts,src/battle/ffx2/spherechange.ts,src/battle/ffx2/setup.ts,src/battle/ffx2/execute.ts,src/battle/ffx2/adapters.ts,src/battle/ffx2/internal.ts,src/battle/ffx2/constants.ts`
> classes this as **DEEP** (FFX-2 ATB engine is a shared system). Written 2026-10-17 before the code, by the lane's agent.
>
> **Owner's words:** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-16 "keep going please all of this reverse engineering needs to be incorporated into our game"; 2026-10-17 "keep going full speed".
> Sources: `FFX2-G04` (3.2 to 3.4, 8, 9), `FFX2-G09` (3.3 to 3.6, 3.8, 4.3), the repo's own kernel tables (`kernel/dressphere-grids.ts`, `kernel/ability-effects.ts`, `kernel/spherechange.ts`, `kernel/sos-layer.ts`), `research/re-ffx2-dressphere.md` 1.6 and 2.4.

## 1. Game case (AGENTS.md rule 14)

**FFX-2 only.** Garment Grids, dresspheres and dress changes exist only in FFX-2. Nothing under `src/battle/ffx`, `src/data/ffx` or `src/audio` is touched, no screen is touched, `ffx-engine-golden` and `ff7-golden` import nothing the lane changes.

## 2. The grids, from the note and from the tables

`FFX2-G04` 3.4 lists ten garment grids that carry an auto-ability row which keeps a status or sets an SOS set. The repo's own plate table (`kernel/dressphere-grids.ts`, 64 rows) read through `applyAbilityEffects` finds exactly the same ten plates (9, 10, 15, 23, 24, 25, 33, 50, 62, 63), so the note and the table agree.
**Three of the ten are grids the engine has** (plates 9 Highroad Winds, 15 Downtrodder, 50 Tempered Will); **seven are not** (10, 23, 24, 25, 33, 62, 63: the engine's data holds 44 of the 64 plates, and a new grid is new content, hard rule 10). The seven stay unwired and are listed in the handoff; the mechanism is keyed by plate number and so already works for them the day a grid with that plate is added.

## 3. What changes, in player words

1. A girl who wears Highroad Winds and has crossed all four of its gates (a dress change that passes the last gate) has SOS Haste: Haste comes on while her HP is under a third and goes off when she is healed past it or knocked out.
2. A girl who wears Downtrodder and has crossed its three gates, or Tempered Will and crosses its green gate, has Double HP for the rest of the battle (Tempered Will's red gate: Double MP). Her maximum doubles in the change that crosses the gate, her HP and MP scale with it as every dress change scales them, a Dispel cannot take it, a Stamina Tonic does not stack on it.
3. Nothing else: a grid with no such row, and every chapter that equips none of these three, plays event for event as before.

## 4. How the game does it, and what the engine does (the questions the lane had to settle)

| Question | The game | Engine |
|---|---|---|
| When is the row held? | An always-on pair (condition 0) is in the ability list as soon as the grid is worn; a gate pair (conditions 1 to 7, 100 to 102) is held once the gate evaluation (`0x005f4170`, landing of a dress change) finds its gates crossed. Order of the list: dressphere, gate slots, grid's always-on pairs, accessories [`kernel/dressphere-abilities.ts#abilityList`, G09 3.5 emulated]. | `adapt/auto-grid.ts` builds the gate state from the girl's crossed colours and the layout's gate-number table, takes the kernel's `gateSlotsAfter` and `plateAbilityGroup`, and `autoAbilityRows` places them in that order. |
| Kept or SOS? | Ordinary row: kept set (always in the effective layer); SOS row: SOS set plus flag, in the layer only while the HP state is 1 [G04 3.2, 3.3, emulated, 89,184 vectors]. | The X2-D layer, unchanged: Highroad Winds' row 0x8078 is an SOS row, Double HP and Double MP (0x8098, 0x8099) are ordinary rows. |
| Lost at a KO, back at a revive? | The SOS set vanishes at HP state 2 and comes back through the SOS check after a result that leaves the state at 1. The kept set stays. **Gate progress is not cleared by a KO or a revive** [G09 3.6, emulated]. | `passedGates` already survives KO and revival (`spherechange.ts` header); the layer is the X2-D one. |
| Every battle? | A battle starts with no walk and no gate bonus [G09 3.6]. | A build starts with `passedGates: []`; the layer starts with the grid's always-on rows only. |
| Stacking with dresspheres and accessories | One list, one table fill: bits OR, counts saturating-add; a row already listed is not listed again unless its row is stackable (special bit 2) [`abilityList`, `isDuplicate`]. | The same list; a Haste Bangle (0x8078) and Highroad Winds give one row. |
| Double HP / Double MP | The maximum recompute (`0x00636560`) reads the merged status word, which ORs in the effective layer (`MsSetStatus`), and doubles under bit 11 / 12, then the dress-change refresh scales HP and MP from the remembered ones with the ratio rule [research 1.6, 2.4; the character rebuild (live `0x625DE0`) is read only: forced copy and merged-word status set, then the recompute, then the ratio step, then a second forced copy]. | `kit.ts#withPoolStatuses` gains a "held by the layer" input; `refreshDerivedStats` and `buildMember` pass the rows' answer, so the maximum doubles in the change that crosses the gate and HP and MP follow the engine's own ratio rule. Doubling is idempotent: a tonic and the layer together double once (one bit). |

## 5. Acceptance cases

1. An oracle that imports no lane code: the ten plates' (condition, row) pairs as numbers from the note's `grids.json`; for every subset of crossed gate numbers, the rows a girl holds on each plate equal the oracle's, and the plate table the kernel holds equals the note's pairs for all 64 plates.
2. Through a real engine: Highroad Winds' SOS Haste off at four gates minus one, on at all four and under a third, off at a heal to a third, off at a KO, back at a revive to under a third; Tempered Will's green gate doubles maximum HP in the change that crosses it, red doubles MP, a Dispel leaves both, a tonic after it changes nothing; Downtrodder needs all three of its gates.
3. A grid with a layout but no row (any of the other 41) and a girl with no gate crossed build exactly as before (no layer where there was none).
4. A mutation pass of about 15 faults; the goldens; the lane's tests; `tsc`; `node tools/orphans.mjs`.
5. Measured: 12 seeds on every FFX-2 chapter before and after (a chapter that equips none of the three grids byte-identical), then 500 seeds at three paces on every chapter that moves, with the cause (ablation: `constants.ts#GRID_AUTO_STATUS = false`).

## 6. Risks and how they are bounded

| Risk | Bound |
|---|---|
| The pool step inside the refresh rests on a reading of the character rebuild (read only) | The reading is the only order the function allows (forced copy and status merge before the HP/MP ratio step); the HP and MP scaling is the engine's existing ratio rule, not new; labelled [R] in the handoff; the ablation shows what it is worth |
| Tempered Will's Yuna in Chapters V and XI changes survivability | measured at 12 and 500 seeds, cause stated in player words; no number tuned |
| `internal.ts` is at 398 lines | one field is added by compressing a comment; nothing else in that file |
| The seven grids the engine lacks | listed, not built; the hard rule 10 decision belongs to Bailey |
| Rollback | `constants.ts#GRID_AUTO_STATUS = false` removes every effect of the lane at once |

## 7. What the deep review should look at

1. A girl in Tempered Will crossing the green gate in a real fight: the maximum doubles, her HP and MP scale to it, and the status plays the generic buff sound. (Corrected after the independent check: there is no Max HP x2 / Max MP x2 icon and no message line; `FFX2_ICONS` in `src/ui/common/statusLooks.ts` and `LANDS` in `src/ui/common/statusWords.ts` have no entry for either. An icon would be a visible change and needs a mockup and Bailey's yes; see the handoff, section 7.)
2. The party-prep and pause screens read the data's node count and colours, which are unchanged.
3. The seven plates left unwired.
