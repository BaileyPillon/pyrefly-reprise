// @vitest-environment jsdom
/**
 * Release 35 interface lane, U5: panels that covered text or figures. The measured proof (rects at the sizes and in the
 * chapters the issues name) is in docs/handoff/r35-fix-ui.md; this pins the rules.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { FFXCombatant } from '../../src/battle/common/types.ts';
import { makeFakeCombatants } from '../../src/ui/ffx/testFixtures.ts';
import { SensorPanel } from '../../src/ui/ffx/SensorPanel.ts';
import { SinHud } from '../../src/ui/ffx/SinHud.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const enemyOf = (): FFXCombatant => Object.values(makeFakeCombatants()).find((c) => c.side === 'enemy') as FFXCombatant;

describe('the Sensor card after a cancel (U5, FFX only)', () => {
  it('a plate the aim opened folds when the aim ends; a Sensor reveal keeps its own lifetime', () => {
    const e = enemyOf();
    const aimed = new SensorPanel();
    aimed.focus(e);
    expect(aimed.isFolded).toBe(false);
    aimed.aimEnded();
    expect(aimed.isFolded).toBe(true);

    const revealed = new SensorPanel();
    revealed.show(e);
    revealed.aimEnded();
    expect(revealed.isFolded).toBe(false); // the reveal reads for its seven seconds

    const byHand = new SensorPanel();
    byHand.focus(e);
    byHand.toggle(); // fold
    byHand.toggle(); // the player opens it
    byHand.aimEnded();
    expect(byHand.isFolded).toBe(false); // pinned open stays
  });
});

describe('the status line steps below the FFX-2 intent card (U5, VP-1001-35, FFX-2 only)', () => {
  it('lists .eint__panel for FFX-2 and not for FFX', () => {
    const src = read('src/ui/common/withStatusLooks.ts');
    const block = src.match(/const MSG_AVOID[^}]*\}/)![0]!;
    const ffx2 = block.match(/ffx2: '([^']*)'/)![1]!;
    const ffx = block.match(/ffx: '([^']*)'/)![1]!;
    expect(ffx2).toContain('.eint__panel:not([hidden])');
    expect(ffx).not.toContain('.eint__panel');
  });
});

describe('the Sin Fin plate sits under the enemy-move card on the phone (U5, FFX only)', () => {
  it('reads the card bottom into --sin-under (and nothing in landscape)', () => {
    const host = document.createElement('div');
    const stage = document.createElement('div');
    const card = document.createElement('div');
    card.className = 'eint__panel';
    host.append(stage, card);
    document.body.append(host);
    host.getBoundingClientRect = () => ({ top: 0, left: 0, right: 390, bottom: 844, width: 390, height: 844 }) as DOMRect;
    card.getBoundingClientRect = () => ({ top: 66, left: 10, right: 380, bottom: 116, width: 370, height: 50 }) as DOMRect;
    const sin = new SinHud();
    sin.mount(stage, host);
    const priv = sin as unknown as { mode: string; el: HTMLElement };
    priv.el.hidden = false;
    priv.mode = 'landscape';
    sin.avoidIntent();
    expect(priv.el.style.getPropertyValue('--sin-under')).toBe('');
    priv.mode = 'phone';
    sin.avoidIntent();
    expect(priv.el.style.getPropertyValue('--sin-under')).toBe('122px'); // 116 + 6
    host.remove();
  });

  it('the stylesheet uses it for the plate and the pill', () => {
    const css = read('src/ui/ffx/sin-hud.css');
    expect(css).toMatch(/\.ffx-sinhud--phone \.ffx-sinfin \{[^}]*top: max\(100px, var\(--sin-under, 0px\)\)/);
    expect(css).toMatch(/\.ffx-sinhud--phone \.ffx-sinhud__gaze \{[^}]*top: max\(100px, var\(--sin-under, 0px\)\)/);
  });
});
