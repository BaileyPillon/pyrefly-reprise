// @vitest-environment jsdom
/**
 * Test 21, the fight half, of the FFX-2 Special look (step D2), second file: the results page after a victory inside a form, the mounted HUD's party column, the case that the surfaces read the
 * engine and not the HUD's held list, and the pro look's KO marks on the field. FFX-2 only in what is seen: the three Special dresspheres exist only in FFX-2. Moved here whole from
 * `special-surfaces-fight.test.ts` by review fix pass 2 (item O3), which kept both files under 400 lines; no case changed. The first half and the method note are there; what both read is in
 * `helpers/specialFightSurfaces.ts`.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { ResultsScreen } from '../../src/app/screens/ResultsScreen.ts';
import { buildTabs } from '../../src/app/screens/pause/tabs.ts';
import type { BattleResult, BattleState } from '../../src/battle/common/types.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { awayGirlIds } from '../../src/engine/SpecialFormMembers.ts';
import { ProFieldMarks } from '../../src/ui/common/ProFieldMarks.ts';
import { framedIds } from '../../src/ui/common/phoneFraming.ts';
import { buildMemberRows } from '../../src/ui/common/resultsMath.ts';
import { setProMode } from '../../src/engine/look/pro/ProSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { unit } from './helpers/specialDrive.ts';
import { FORM_GIRLS, fell, formUp, playUntilOver } from './helpers/specialFormState.ts';
import { cardOf, GIRL_IDS, guideLine, mountHud, off, useFightHooks } from './helpers/specialFightSurfaces.ts';
import { PLATE_NAMES, walkPlates } from './helpers/specialSurfaces.ts';

useFightHooks();

// ---------------------------------------------------------------------------------------------------------------------------------
// The results page
// ---------------------------------------------------------------------------------------------------------------------------------

function screenRows(result: BattleResult): string[] {
  const save = new SaveStore('d2-surfaces-results', null);
  save.recordAttempt('ffx2-bahamut');
  const screen = new ResultsScreen({ chapterId: 'ffx2-bahamut', result });
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { save, fade: () => Promise.resolve() } as unknown as App;
  screen.root = root;
  void screen.enter();
  screen.update(10);
  return [...root.querySelectorAll<HTMLElement>('.rres__member')].map((m) => m.textContent ?? '');
}

describe('the results page after a victory inside a form', () => {
  for (const { girl } of FORM_GIRLS) {
    it(`${girl}: the engine ends the form silently once the result is built, so the rows are the three girls and never a part`, () => {
      const up = formUp(girl);
      fell(unit(up.engine, 'bahamut'));
      playUntilOver(up.engine);
      const s = up.engine.state() as BattleState;
      expect(s.result?.outcome).toBe('victory');
      expect(s.activeIds).toEqual([...GIRL_IDS]);
      const result = s.result as BattleResult;
      const rows = buildMemberRows(getChapter('ffx2-bahamut'), result);
      expect(rows.map((r) => r.id)).toEqual([...GIRL_IDS]);
      expect(rows.map((r) => r.name)).toEqual(['Yuna', 'Rikku', 'Paine']);
      const text = screenRows(result);
      expect(text).toHaveLength(3);
      for (const [i, name] of ['Yuna', 'Rikku', 'Paine'].entries()) expect(text[i]).toContain(name);
      for (const name of PLATE_NAMES[girl].slice(1)) expect(text.join('|'), name).not.toContain(name);
    });
  }
});

// ---------------------------------------------------------------------------------------------------------------------------------
// The mounted HUD's party column
// ---------------------------------------------------------------------------------------------------------------------------------

describe('the party column of a mounted FFX2BattleHud', () => {
  it('a downed part shows its own KO styling (and the KO pill under the pro look); the main and the other part do not', () => {
    const up = formUp('yuna');
    const s = up.state as BattleState;
    const part = s.activeIds[1]!;
    fell(s.combatants[part] as never);
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
    const { root, ids } = mountHud({ engine: up.engine, state: s, snapshot: up.snapshot, d: null as never });
    expect(ids()).toEqual(s.activeIds);
    const row = (id: string): string => root.querySelector<HTMLElement>(`.ig-stat[data-actor-id="${id}"]`)!.outerHTML;
    expect(row(part)).toContain('ffx2-hp--ko');
    expect(row(part)).toContain('pro-mark--ko');
    expect(row('yuna')).not.toContain('ffx2-hp--ko');
    expect(row(s.activeIds[2]!)).not.toContain('ffx2-hp--ko');
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------
// Whatever list the HUD holds
// ---------------------------------------------------------------------------------------------------------------------------------

describe('whatever list the HUD holds, the surfaces read the engine, not the list', () => {
  it('the tabs, the Guide, the intent slab, the advisor and the phone framing answer the same with the girls, one girl or the three parts held; the HUD column follows the list', () => {
    for (const { girl, parts } of FORM_GIRLS) {
      walkPlates(girl, (m) => {
        const answers = () => ({
          tabs: buildTabs(m.state).map((t) => [t.id, t.label, t.hp, t.ko ?? false]),
          guide: guideLine(m),
          intent: (m.engine.intent()?.estimate?.perTarget ?? []).map((t) => t.targetId),
          advisor: cardOf(m).lines,
          framing: framedIds(m.state, m.d.actorId),
          away: awayGirlIds(m.state),
        });
        const base = answers();
        const { hud, ids } = mountHud(m);
        for (const held of [[...GIRL_IDS], ['yuna'], [...m.state.activeIds]]) {
          hud.holdRows(held);
          hud.sync(m.state, m.snapshot);
          expect(ids(), `${girl}: the HUD column`).toEqual(held);
          expect(answers(), `${girl} at ${m.d.actorId} with ${held.join(',')} held`).toEqual(base);
        }
        hud.holdRows(null);
        expect(ids()).toEqual([girl, ...parts]);
      });
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------
// The pro look's KO marks on the field (off by default: forced on here, as pro-look-markers.test.ts does)
// ---------------------------------------------------------------------------------------------------------------------------------

describe('the pro KO marks on the field', () => {
  beforeEach(() => {
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
  });
  const marksFor = (state: BattleState, figures = false): ProFieldMarks => {
    const m = new ProFieldMarks('ffx2');
    document.body.append(m.el);
    m.setProjector(() => ({ x: 500, y: 700 }));
    if (figures) m.setFigures({ rect: () => ({ x: 400, y: 300, w: 300, h: 500 }), visibility: () => 1 }); // all three plates stand on the one figure
    m.sync(state);
    return m;
  };
  const washes = (m: ProFieldMarks): number => m.el.querySelectorAll('.pro-ko-wash').length;
  const tick = (m: ProFieldMarks, ms: number): void => {
    for (let t = 0; t < ms; t += 10) m.update(0.01);
  };

  for (const { girl, parts } of FORM_GIRLS) {
    it(`${girl}: a downed part adds no KO wash or mark (the figure does not change when a part falls), one part or both`, () => {
      const s = formUp(girl).state as BattleState;
      fell(s.combatants[parts[0]] as never);
      const m = marksFor(s);
      expect(m.count).toBe(0);
      expect(washes(m)).toBe(0);
      expect(m.el.querySelectorAll('.pro-ko-mark')).toHaveLength(0);
      fell(s.combatants[parts[1]] as never);
      m.sync(s);
      expect(m.count).toBe(0);
      expect(m.el.children).toHaveLength(0);
    });
  }

  it('downing a girl outside a form still adds one wash and one mark (OFF)', () => {
    const s = off();
    fell(s.combatants['rikku'] as never);
    const m = marksFor(s);
    expect(m.count).toBe(1);
    expect(washes(m)).toBe(1);
    expect(m.el.querySelectorAll('.pro-ko-mark')).toHaveLength(1);
  });

  it('downing the main inside a form is not skipped, whatever the parts do; her mark stays on the figure and is not pushed aside by her own parts', () => {
    const s = formUp('yuna').state as BattleState;
    fell(s.combatants['yuna'] as never);
    const m = marksFor(s, true);
    expect(m.count).toBe(1);
    expect(washes(m)).toBe(1);
    tick(m, 2500);
    const mark = m.el.querySelector<HTMLElement>('.pro-ko-mark')!;
    expect(mark.style.opacity).toBe('1');
    expect(mark.style.transform).toContain('translate(500.0px'); // the point of her own body, not shifted off the figure the parts also stand on
    fell(s.combatants[s.activeIds[1]!] as never);
    m.sync(s);
    expect(m.count).toBe(1);
  });
});
