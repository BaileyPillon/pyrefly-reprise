// @vitest-environment jsdom
/**
 * Test 18 of the FFX-2 Special look (step D1; game case: FFX-2 only: the way-out row exists only inside a Special form, and the three Special dresspheres exist only in FFX-2).
 *
 * Inside a form the main's one Change row is the engine's way out, a `spherechange` back to the dress she stood on whose `label` is that dress's raw id and whose `help` reads
 * `Leave <Special>`. The command window prints the help line on the row and in the help band. Before the form (the offer) the Special Dress Up row reads `<Special> (Special)` and an
 * ordinary Change row reads the dress's name, as the OFF pin says.
 *
 * Removal check: with `leaveLabelOf` returning `null` the way-out row reads the old dress ("Black Mage", "Gunner").
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { AtbSnapshot, AvailableCommand } from '../../src/battle/common/types.ts';
import { helpLabel, openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import { leaveLabelOf } from '../../src/ui/ffx2/specialLeave.ts';
import { openSpecial, walkTo, nextInput, specialRow, changeRows, type Input } from './helpers/specialDrive.ts';
import { FORM_GIRLS, bahamutGroup, chapterIV, formUp, type FormGirlId } from './helpers/specialFormState.ts';

const EMPTY: AtbSnapshot = { elapsedMs: 0, bars: [] };
const LEAVE: Record<FormGirlId, string> = { yuna: 'Leave Floral Fallal', rikku: 'Leave Machina Maw', paine: 'Leave Full Throttle' };
const OFFER: Record<FormGirlId, string> = { yuna: 'Floral Fallal (Special)', rikku: 'Machina Maw (Special)', paine: 'Full Throttle (Special)' };

beforeEach(() => {
  document.body.innerHTML = '';
});

/** The Change submenu of a decision, as the command window draws it: the labels of its rows. */
function changeSubmenu(commands: AvailableCommand[]): string[] {
  const container = document.createElement('div');
  const targetLayer = document.createElement('div');
  document.body.append(container, targetLayer);
  let close = (): void => {};
  void openCommandMenu({ container, targetLayer, commands, previewRank: () => EMPTY, onPreview: () => {}, project: () => null, actorName: 'Girl', onOpen: (c) => { close = c; } });
  const change = [...container.querySelectorAll<HTMLElement>('.ig-cmd')].find((r) => r.querySelector('.ffx2cmd__label')?.textContent === 'Change');
  expect(change, 'a Change row on the top level').toBeTruthy();
  change!.click();
  const labels = [...container.querySelectorAll('.ffx2cmd__label')].map((e) => e.textContent ?? '');
  close();
  return labels;
}

/** The main's next decision inside her form: the others (and her parts) answer Defend. */
function mainInForm(girl: FormGirlId): Input {
  const up = formUp(girl);
  for (let i = 0; i < 400; i++) {
    const d = nextInput(up.engine);
    if (d === null) break;
    if (d.actorId === girl) return d;
    up.engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error(`${girl}: no decision inside the form`);
}

describe('inside a form: "Leave <Special>"', () => {
  for (const g of FORM_GIRLS) {
    it(`${g.girl}: exactly one Change row, and the row and the help band both read ${LEAVE[g.girl]}`, () => {
      const d = mainInForm(g.girl);
      const rows = changeRows(d);
      expect(rows).toHaveLength(1);
      expect(leaveLabelOf(rows[0]!)).toBe(LEAVE[g.girl]);
      expect(helpLabel(rows[0]!)).toBe(LEAVE[g.girl]);
      expect(rows[0]!.label, 'the engine\'s own label is the old dress id').toMatch(/^[a-z-]+$/);
      expect(changeSubmenu(d.commands)).toEqual([LEAVE[g.girl]]);
    });
  }
});

describe('before the form: the offer and the ordinary Change rows are as they were', () => {
  for (const g of FORM_GIRLS) {
    it(`${g.girl}: the offer reads "${OFFER[g.girl]}", an ordinary Change row reads the dress name, and none reads Leave`, () => {
      const engine = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, immortal: true });
      const walk = walkTo(engine, g.girl, { immortal: true });
      expect(walk.input).not.toBeNull();
      const d = walk.input!;
      expect(specialRow(d)).toBeDefined();
      const labels = changeSubmenu(d.commands);
      expect(labels).toContain(OFFER[g.girl]);
      for (const l of labels) expect(l).not.toMatch(/^Leave /);
      const ordinary = changeRows(d).filter((c) => !(c.command as { extra: { specialDressUp?: boolean } }).extra.specialDressUp);
      expect(ordinary.length).toBeGreaterThan(0);
      for (const c of ordinary) {
        expect(leaveLabelOf(c)).toBeNull();
        expect(helpLabel(c)).toBe(c.label.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      }
      expect(leaveLabelOf(specialRow(d)!)).toBeNull();
    });
  }
});

describe('leaveLabelOf only answers for the way-out row', () => {
  const change = (help: string | undefined, specialDressUp?: boolean): AvailableCommand =>
    ({ command: { kind: 'spherechange', targets: [], extra: { toDressphere: 'gunner', toNode: 0, gatesCrossed: [], ...(specialDressUp ? { specialDressUp } : {}) } }, label: 'gunner', category: 'dressphere', mpCost: 0, enabled: true, validTargets: [], ...(help !== undefined ? { help } : {}) }) as AvailableCommand;

  it('is null for a row with no help, a different help, the Special Dress Up row and any other command', () => {
    expect(leaveLabelOf(change(undefined))).toBeNull();
    expect(leaveLabelOf(change('GRANTS: Red'))).toBeNull();
    expect(leaveLabelOf(change('Leave Floral Fallal', true))).toBeNull();
    expect(leaveLabelOf({ command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: [], help: 'Leave it' })).toBeNull();
    expect(leaveLabelOf(change('Leave Floral Fallal'))).toBe('Leave Floral Fallal');
  });
});
