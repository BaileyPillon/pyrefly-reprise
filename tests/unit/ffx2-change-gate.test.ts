/**
 * The gate on an ordinary Change (FFX-2 only; `src/battle/ffx2/spherechange.ts#ordinaryChangeAllowed`; the review fix pass 3 of the Special Dress Up, 2026-11-10).
 *
 * Fix pass 2 measured that `engine.submit` of a forged `spherechange` (a Special, another girl's Special, even `no-such-dress`, at a node linked to hers) put the dress on her with the
 * `specialDressUp` switch OFF and ON: 27 of 27 (chapter, girl, flag) combinations. No menu builds such a command, only the debug console can. The gate:
 *   G1  an ordinary Change is accepted only when `toDressphere` is the dressphere on node `toNode` of HER OWN grid in this battle;
 *   G2  a Special is worn through the Special path only (switch ON, the row the menu offers), never through the ordinary one.
 *
 * Every FFX-2 chapter build the tree has (23: the listed chapters, the unlisted ones and exp-leblanc) is opened through `setupForChapter` with the switch ABSENT (the shipped default), OFF and ON,
 * and for each girl every forged route is handed to `engine.submit` on a copy of the engine at her first menu. A refusal must read as the engine's own refusal of an unlinked Change (`Not linked`,
 * her turn spent, nothing else), leave the state deep-equal to that refusal's and the random stream where that refusal leaves it; and every ordinary Change to each linked node with the node's
 * own dress must still be accepted. The Special path itself (switch ON) is left alone: its own command still answers `Not ready` when the row is not offered.
 */

import { describe, expect, it } from 'vitest';

import { isSpecialDress } from '../../src/battle/ffx2/special/forms.ts';
import { MODES, extraOf, ffx2Chapters, forgeries, girlsOf, layoutOf, linkedNodes, messagesOf, rngOf, stateOf, toGirl, openIn } from './helpers/changeGate.ts';
import { changeRows, unit } from './helpers/specialDrive.ts';

const chapters = ffx2Chapters();
const SEED = 1;

const spherechanges = (events: Array<{ type: string }>): number => events.filter((e) => e.type === 'spherechange').length;

describe('the chapters this file covers', () => {
  it('are every FFX-2 chapter build the tree has: the listed ones, the unlisted ones and exp-leblanc', () => {
    const ids = chapters.map((c) => c.id);
    expect(ids.length).toBeGreaterThanOrEqual(23);
    for (const id of ['ffx2-bahamut', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc', 'exp-leblanc', 'ffx2-luca-opener', 'ffx2-farplane-cup']) expect(ids, id).toContain(id);
  });
});

describe.each(chapters.map((c) => [c.id, c] as const))('the gate on an ordinary Change, %s', (_id, chapter) => {
  for (const mode of MODES) {
    it(`switch ${mode}: every forged route is refused as an unlinked Change is; every ordinary Change to a linked node is accepted`, () => {
      let exercised = 0;
      for (const girl of girlsOf(chapter)) {
        const base = openIn(chapter, mode, SEED);
        const menu = toGirl(base, girl);
        if (menu === null) continue;
        exercised += 1;
        const sphere = unit(base, girl).dresspheres!;
        const here = sphere.garmentGrid.nodePosition;
        const wearing = sphere.current;
        const layout = layoutOf(chapter, girl, mode);
        const links = linkedNodes(base, girl);
        const rngBefore = rngOf(base);
        const fork = (): ReturnType<typeof openIn> => base.fork(SEED, rngBefore);

        // The reference: the engine's own refusal of a Change to a node that is not linked (to where she stands). Her turn is spent, a `Not linked` message, nothing else.
        const ref = fork();
        const refEvents = ref.submit({ kind: 'spherechange', targets: [], extra: { toDressphere: wearing, toNode: here, gatesCrossed: [] } });
        expect(messagesOf(refEvents), `${girl}: the reference refusal`).toEqual(['Not linked']);
        expect(spherechanges(refEvents)).toBe(0);
        const refState = stateOf(ref);
        const refRng = rngOf(ref);

        // The forged routes: at every node linked to hers, and at the node she stands on (the Special row's own shape).
        for (const link of [...links, { node: here, gates: [] as string[] }]) {
          for (const forged of forgeries(girl, mode, link, layout, sphere.owned)) {
            const f = fork();
            const events = f.submit(forged.command);
            const who = `${girl} (${mode}) ${forged.label}`;
            const after = unit(f, girl).dresspheres!;
            expect(after.current, who).toBe(wearing);
            expect(after.garmentGrid.nodePosition, who).toBe(here);
            expect(after.garmentGrid.passedGates, who).toEqual([]);
            expect(spherechanges(events), who).toBe(0);
            expect(isSpecialDress(after.current), who).toBe(false);
            if (forged.specialPath) {
              // The Special path's own answer to a Special Dress Up the menu did not offer: untouched by the gate.
              expect(messagesOf(events), who).toEqual(['Not ready']);
            } else {
              expect(messagesOf(events), who).toEqual(['Not linked']);
              expect(stateOf(f), `${who}: the state is the reference refusal's`).toEqual(refState);
              expect(rngOf(f), `${who}: the random stream is the reference refusal's`).toEqual(refRng);
            }
          }
        }

        // The ordinary Changes the menu offers: the row IS the node's own dress, and the engine still accepts it.
        const rows = changeRows(menu).filter((r) => extraOf(r).specialDressUp !== true);
        const wanted = links.filter((l) => layout[l.node] != null && !isSpecialDress(layout[l.node] as string));
        expect(rows.map((r) => [extraOf(r).toNode, extraOf(r).toDressphere]).sort(), `${girl} (${mode}): the rows are the node dresses`).toEqual(
          wanted.map((l) => [l.node, layout[l.node]]).sort(),
        );
        for (const l of wanted) {
          const f = fork();
          const to = layout[l.node] as string;
          const events = f.submit({ kind: 'spherechange', targets: [], extra: { toDressphere: to, toNode: l.node, gatesCrossed: l.gates as never } });
          const after = unit(f, girl).dresspheres!;
          expect(after.current, `${girl} (${mode}) accepted ${to} at node ${l.node}`).toBe(to);
          expect(after.garmentGrid.nodePosition).toBe(l.node);
          expect(after.garmentGrid.wornThisBattle).toContain(to);
          expect(spherechanges(events)).toBe(1);
          expect(messagesOf(events)).not.toContain('Not linked');
        }
      }
      expect(exercised, `${chapter.id}: at least one girl reached her first menu`).toBeGreaterThan(0);
    });
  }
});
