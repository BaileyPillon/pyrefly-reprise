// @vitest-environment jsdom
/**
 * The Fiend Arena Superbosses (the hidden FFX-2 chapter 53): does the FFX-2 battle HUD already show the formation? **FFX-2 only** [AGENTS.md rule 14]. The preflight (section 7) asked for "four HP bars, one per head" and
 * left open whether a seam was needed; this file answers it by RUNNING the real HUD on the real engine's state, and no HUD file was changed in the lane.
 *
 * What it pins:
 * 1. Act 2 opens with FOUR gauges, one per head, in the formation's order (Unum, Duo, Tria, Quattour), each full, each named, none for the body, the pod or the tail (hidden parts: `hidden` and `hideHpBar`).
 * 2. Act 1 opens with ONE gauge, Almighty Shinra's.
 * 3. A head that has fallen keeps its row with an empty bar (the rows below do not jump), the other three are untouched; the fight's other three bars still read full.
 * 4. The HP numerals are the sourced maxima once Sensor has revealed them (555,555 / 666,666 / 666,666 / 777,777; Shinra 275,000), and read the `SCAN` hint until then.
 * 5. The real `FFX2BattleHud` draws the same four gauges into its enemy column (`.ffx2hud__enemies`), and the first menu's Attack offers the four heads as targets (the engine side; stage 1 pinned it as well).
 * 6. The ONE seam the browser smoke found (a CSS rule, no markup, no TS): each head carries Spellspring, which draws a STATUS tab that hangs under its bar and was drawn over the next gauge's name; the rule leaves room for it,
 *    and the rule is keyed on the heads' own actor ids (`x2-numerus-`), so no other chapter's HUD moves whatever status its gauges wear in play (pinned below by laying statuses on every enemy of the 12 other stacked
 *    formations and matching the shipped selector in the document; a first version keyed on structure alone looked only at opening frames and matched all 12 in play, review finding C1).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AtbSnapshot, BattleState, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { fiendSuperbossBuild } from '../../../src/data/ffx2/builds/fiend-superbosses.ts';
import { ENEMY_GROUPS } from '../../../src/data/ffx2/enemies/index.ts';
import { act2NumerusGroup } from '../../../src/data/ffx2/enemies/fiend-superbosses.ts';
import { NUMERUS_HEAD_IDS, NUMERUS_PART_IDS, X2_ALMIGHTY_SHINRA_ID } from '../../../src/data/fiend-superbosses-ids.ts';
import { FFX2BattleHud } from '../../../src/ui/ffx2/FFX2BattleHud.ts';
import { enemyGaugesHtml } from '../../../src/ui/ffx2/BossGauges.ts';
import { nextInput } from '../helpers/angraMainyuDrive.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { openAct, unit } from '../helpers/fiendSuperbossDrive.ts';

const SNAPSHOT: AtbSnapshot = { elapsedMs: 0, bars: [] } as unknown as AtbSnapshot;
const NAMES = ['Unum', 'Duo', 'Tria', 'Quattour'];
const MAX_HP = [555_555, 666_666, 666_666, 777_777];

function draw(state: BattleState, revealed: string[] = []): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = enemyGaugesHtml(state, SNAPSHOT, { revealed: new Set(revealed), charging: new Map() });
  return host;
}

const gauges = (host: HTMLElement): HTMLElement[] => [...host.querySelectorAll<HTMLElement>('.ig-bosshp')];
const fillOf = (g: HTMLElement): string => g.querySelector<HTMLElement>('.ig-bosshp__fill')?.style.width ?? '';

describe('the enemy gauges of act 2 (the Major Numerus)', () => {
  it('draw four gauges in the formation order, each full and named, and none for the hidden body, pod and tail', () => {
    const engine = openAct(2, 1);
    const host = draw(engine.state() as BattleState);
    const list = gauges(host);
    expect(list.map((g) => g.dataset['actorId'])).toEqual([...NUMERUS_HEAD_IDS]);
    expect(list.map((g) => g.querySelector('.ig-bosshp__name')?.textContent)).toEqual(NAMES);
    expect(list.map(fillOf)).toEqual(['100%', '100%', '100%', '100%']);
    for (const part of NUMERUS_PART_IDS) {
      expect(host.querySelector(`[data-actor-id="${part}"]`), part).toBeNull();
      expect(unit(engine, part).flags.hideHpBar, `${part} hides its bar`).toBe(true);
    }
    expect(host.querySelectorAll('.ffx2boss__part').length, 'no part rows under any head').toBe(0);
  });

  it('read the sourced maxima once Sensor has revealed them, and the SCAN hint until then', () => {
    const engine = openAct(2, 1);
    const hidden = draw(engine.state() as BattleState);
    expect(hidden.querySelectorAll('.ffx2boss__hint').length).toBe(4);
    const shown = draw(engine.state() as BattleState, [...NUMERUS_HEAD_IDS]);
    const text = gauges(shown).map((g) => g.querySelector('.ffx2boss__num')?.textContent ?? '');
    expect(text).toEqual(MAX_HP.map((n) => `${n}/${n}`));
  });

  it('keep the row of a head that has fallen with an empty bar, and leave the other three alone', () => {
    const engine = openAct(2, 1);
    const duo = unit(engine, NUMERUS_HEAD_IDS[1]);
    duo.hp = 0; // a rig: the engine's own KO path is pinned by the chapter's engine test
    duo.alive = false;
    const list = gauges(draw(engine.state() as BattleState));
    expect(list).toHaveLength(4);
    expect(list.map(fillOf)).toEqual(['100%', '0%', '100%', '100%']);
  });
});

describe('the enemy gauge of act 1 (Almighty Shinra)', () => {
  it('is one gauge, full, named for him', () => {
    const engine = openAct(1, 1);
    const list = gauges(draw(engine.state() as BattleState, [X2_ALMIGHTY_SHINRA_ID]));
    expect(list).toHaveLength(1);
    expect(list[0]!.dataset['actorId']).toBe(X2_ALMIGHTY_SHINRA_ID);
    expect(list[0]!.querySelector('.ig-bosshp__name')?.textContent).toBe('Almighty Shinra');
    expect(list[0]!.querySelector('.ffx2boss__num')?.textContent).toBe('275000/275000');
  });
});

describe('the real FFX-2 HUD on the real engine', () => {
  let root: HTMLElement;
  let hud: FFX2BattleHud;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    hud = new FFX2BattleHud();
    hud.mount(root);
  });

  afterEach(() => {
    hud.unmount();
    root.remove();
  });

  it('draws the four heads into its enemy column, and the first menu offers the four heads as the Attack targets', () => {
    const engine = openAct(2, 1);
    const first = nextInput(engine);
    expect(first).not.toBeNull();
    const attack = first!.commands.find((c) => c.enabled && c.command.kind === 'attack');
    expect(attack?.validTargets).toEqual([...NUMERUS_HEAD_IDS]);
    hud.sync(engine.state() as BattleState, SNAPSHOT);
    const column = root.querySelector('.ffx2hud__enemies');
    expect(column).not.toBeNull();
    const ids = [...column!.querySelectorAll<HTMLElement>('.ig-bosshp')].map((g) => g.dataset['actorId']);
    expect(ids).toEqual([...NUMERUS_HEAD_IDS]);
  });

  it('draws Shinra alone in act 1', () => {
    const engine = openAct(1, 1);
    hud.sync(engine.state() as BattleState, SNAPSHOT);
    const ids = [...root.querySelectorAll<HTMLElement>('.ffx2hud__enemies .ig-bosshp')].map((g) => g.dataset['actorId']);
    expect(ids).toEqual([X2_ALMIGHTY_SHINRA_ID]);
  });
});

describe('the STATUS tabs of stacked gauges (the one seam the browser smoke found: a CSS rule, no markup)', () => {
  /** The rule's selector and room, read from the stylesheet the HUD ships. */
  const ruleOf = (): { selector: string; px: number } => {
    const css = readFileSync(resolve('src/ui/ffx2/ffx2-hud.css'), 'utf8');
    const rule = css.match(/(html:not\(\[data-phone-battle='ffx2'\]\) \.ffx2hud__enemies > \.ig-bosshp\[data-actor-id\^='x2-numerus-'\]:has\(> \.ststab\):not\(:last-child\)) \{\s*margin-bottom: (\d+)px;\s*\}/);
    expect(rule, 'the rule, keyed on the heads\' own actor ids').not.toBeNull();
    return { selector: rule![1]!, px: Number(rule![2]) };
  };
  /** Every enemy of the formation wears a status that draws a STATUS tab (a haste, a protect, a shell, a regen: what enemies lay on each other in play). */
  const wearStatuses = (engine: FFX2Engine): void => {
    for (const id of engine.state().enemyIds) {
      const u = engine.state().combatants[id] as unknown as { statuses: Record<string, unknown> };
      for (const status of ['haste', 'protect', 'shell', 'regen']) u.statuses[status] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    }
  };
  /** The formation's gauges laid in the HUD's enemy column, in the document, and the ones the rule matches. */
  const matched = (group: EnemyGroupDef, statuses: boolean): { gauges: number; tabbedAbove: number; hit: string[] } => {
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    engine.setSeed(1);
    engine.init({ game: 'ffx2', party: structuredClone(fiendSuperbossBuild), enemies: group, triggers: [], seed: 1, condition: 'normal', canEscape: false });
    if (statuses) wearStatuses(engine);
    const hud = document.createElement('div');
    hud.className = 'ffx2hud';
    hud.innerHTML = `<div class="ffx2hud__enemies">${enemyGaugesHtml(engine.state() as BattleState, SNAPSHOT, { revealed: new Set<string>(), charging: new Map() })}</div>`;
    document.body.appendChild(hud);
    try {
      const list = gauges(hud);
      const tabbedAbove = list.slice(0, -1).filter((g) => g.querySelector(':scope > .ststab') !== null).length;
      const hit = [...document.querySelectorAll<HTMLElement>(ruleOf().selector)].map((g) => g.dataset['actorId'] ?? '');
      return { gauges: list.length, tabbedAbove, hit };
    } finally {
      hud.remove();
    }
  };

  it('act 2 draws a STATUS tab above three of its four gauges as opened (each head carries Spellspring) and the rule matches exactly those three heads', () => {
    const act2 = matched(act2NumerusGroup, false);
    expect(act2.gauges).toBe(4);
    expect(act2.tabbedAbove).toBe(3);
    expect(act2.hit).toEqual(NUMERUS_HEAD_IDS.slice(0, 3));
  });

  it('IN PLAY, no other FFX-2 formation is touched: with a status laid on every enemy of each of the 12 other stacked formations a tab does hang above another gauge in every one, and the rule matches none of them (review finding C1: the old rule, keyed on structure alone, matched all 12)', () => {
    let multi = 0;
    const withTab: string[] = [];
    for (const group of Object.values(ENEMY_GROUPS)) {
      if (group === act2NumerusGroup) continue;
      const opened = matched(group, false);
      const worn = matched(group, true);
      if (opened.gauges >= 2) multi++;
      else continue;
      expect(opened.hit, `${group.id} as opened`).toEqual([]);
      expect(worn.hit, `${group.id} wearing statuses: the rule keys on the heads' actor ids and no other gauge carries one`).toEqual([]);
      if (worn.tabbedAbove > 0) withTab.push(group.id);
    }
    expect(multi, 'twelve other formations stack two or more gauges').toBe(12);
    expect(withTab, 'the status DOES draw a tab above another gauge in each of the twelve (so the proof is not vacuous)').toHaveLength(12);
  });

  it('the rule is in the HUD stylesheet, gives the tab its room, and leaves the phone alone (its layout draws the tab inside the head)', () => {
    const { selector, px } = ruleOf();
    expect(px).toBeGreaterThanOrEqual(10);
    expect(px, 'a tab (13.6px) less the 4px gap, and no more').toBeLessThanOrEqual(12);
    const act2 = act2NumerusGroup;
    const html = document.documentElement;
    html.setAttribute('data-phone-battle', 'ffx2');
    try {
      const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
      engine.setSeed(1);
      engine.init({ game: 'ffx2', party: structuredClone(fiendSuperbossBuild), enemies: act2, triggers: [], seed: 1, condition: 'normal', canEscape: false });
      const hud = document.createElement('div');
      hud.className = 'ffx2hud';
      hud.innerHTML = `<div class="ffx2hud__enemies">${enemyGaugesHtml(engine.state() as BattleState, SNAPSHOT, { revealed: new Set<string>(), charging: new Map() })}</div>`;
      document.body.appendChild(hud);
      expect(document.querySelectorAll(selector).length, 'on the phone layout the rule matches nothing').toBe(0);
      hud.remove();
    } finally {
      html.removeAttribute('data-phone-battle');
    }
  });
});
