// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { targetPlateText } from '../../src/ui/ffx2/TargetPlates.ts';
import { menuOwnsCancel } from '../../src/ui/common/menuCancel.ts';
import type {
  AvailableCommand,
  BattleEvent,
  BattleResult,
  BattleState,
  Command,
  FFX2Combatant,
} from '../../src/battle/common/types.ts';

/**
 * PR-0150, the HUD half (critic round 10): the approved Targeting s3 tile
 * (`docs/concepts/targeting/b-ring-and-dim/s3.png`) draws a TARGET plate, an
 * actor/dressphere plate and an ENTER / arrows / ESC controls hint that the
 * FFX-2 build lacked. And a victory that lands under an open Active-ATB menu
 * left the command stack and the reticle standing in the victory shot.
 *
 * FFX-2 only (AGENTS.md rule 14): the tile is the FFX-2 frame, the FFX frames
 * draw none of the three, and only FFX-2's clock runs under an open menu.
 * jsdom does not lay out, so placement is asserted on the pure solver
 * (`targetPlateGeometry.ts`, in `ui-ffx2-target-plate-geometry.test.ts`) and
 * on real screens by the browser pass in `docs/screenshots/pr0150-hud/`.
 */

function unit(id: string, name: string, side: 'party' | 'enemy', extra: Partial<FFX2Combatant> = {}): FFX2Combatant {
  return {
    id,
    name,
    side,
    spriteKey: id,
    stats: { hp: 1000, mp: 100, str: 10, def: 10, mag: 10, mdef: 10, agi: 10, luck: 10, eva: 10, acc: 10, maxHp: 1000, maxMp: 100 },
    hp: 1000,
    mp: 80,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: side === 'party' ? 'player' : 'ai',
    alive: true,
    removed: false,
    slot: 0,
    flags: {},
    level: 10,
    atb: { ticks: 0, required: 16000, gauge: 0, charging: null, recovery: 0 },
    accessories: [],
    chainCount: 0,
    chainWindowTicks: 0,
    ...extra,
  } as FFX2Combatant;
}

function gunnerYuna(): FFX2Combatant {
  return unit('yuna', 'Yuna', 'party', {
    dresspheres: {
      current: 'gunner',
      owned: ['gunner'],
      garmentGrid: { id: 'g1', nodePosition: 0, passedGates: [], wornThisBattle: [] },
      abilitiesLearned: {},
    },
  });
}

function state(): BattleState {
  const yuna = gunnerYuna();
  const boss = unit('vegnagun-leg', 'Vegnagun', 'enemy', { flags: { isBoss: true } });
  const node = unit('node-a', 'Node A', 'enemy', { flags: { isPart: true, partOf: 'vegnagun-leg' } });
  return {
    game: 'ffx2',
    combatants: { yuna, 'vegnagun-leg': boss, 'node-a': node },
    activeIds: ['yuna'],
    reserveIds: [],
    enemyIds: ['vegnagun-leg', 'node-a'],
    aeonId: null,
    turn: 1,
    ticks: 0,
    log: [],
    nextSeq: 1,
    triggers: [],
    firedTriggerIds: [],
    result: null,
    seed: 1,
    flags: {},
  } as BattleState;
}

const ATTACK: AvailableCommand = {
  command: { kind: 'attack', targets: [] },
  label: 'Attack',
  category: 'attack',
  mpCost: 0,
  enabled: true,
  validTargets: ['vegnagun-leg', 'node-a'],
  targeting: 'single-enemy',
} as AvailableCommand;

const RESULT: BattleResult = { outcome: 'victory', turns: 3, elapsedTicks: 9000, elapsedMs: 3000, ap: 0, exp: 10, gil: 0 } as BattleResult;

function key(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
}

describe('what the plates say (targetPlateText)', () => {
  it('names the target from data, tags a part PART, and names the actor with her dressphere', () => {
    const s = state();
    const t = targetPlateText({ ids: ['node-a'], mode: 'single', kind: 'enemy', activeId: 'node-a' }, 2, s, 'yuna');
    expect(t.target).toEqual({ name: 'Node A', tag: 'PART' });
    expect(t.actor).toEqual({ name: 'Yuna', job: 'GUNNER' });
    expect(t.canStep).toBe(true);
    const boss = targetPlateText({ ids: ['vegnagun-leg'], mode: 'single', kind: 'enemy', activeId: 'vegnagun-leg' }, 2, s, 'yuna');
    expect(boss.target).toEqual({ name: 'Vegnagun', tag: null });
  });

  it('drops the change-target key when there is nothing to step to', () => {
    const s = state();
    expect(targetPlateText({ ids: ['vegnagun-leg'], mode: 'single', kind: 'enemy', activeId: 'vegnagun-leg' }, 1, s, 'yuna').canStep).toBe(false);
    const all = targetPlateText({ ids: ['vegnagun-leg', 'node-a'], mode: 'all', kind: 'enemy', activeId: null }, 2, s, 'yuna');
    expect(all.canStep).toBe(false);
    expect(all.target.name).toBe('All enemies');
  });
});

describe('the FFX-2 HUD during target select', () => {
  let root: HTMLElement;
  let hud: FFX2BattleHud;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    hud = new FFX2BattleHud();
    hud.mount(root);
    hud.sync(state(), { elapsedMs: 0, bars: [] });
  });

  afterEach(() => {
    hud.unmount();
    root.remove();
  });

  const plate = (role: string): HTMLElement => root.querySelector<HTMLElement>(`[data-role="${role}"]`)!;
  // Up or down by the HUD's own say-so (`hidden`). Whether a plate that is up
  // found room (`ffx2-tplate--off`) needs a layout, which jsdom does not do.
  const shown = (el: HTMLElement): boolean => {
    for (let e: HTMLElement | null = el; e; e = e.parentElement) if (e.hidden) return false;
    return true;
  };

  function openToTarget(): Promise<Command> {
    const done = hud.chooseCommand('yuna', [ATTACK], () => ({ elapsedMs: 0, bars: [] }));
    key('Enter'); // Attack -> target select
    return done;
  }

  it('shows the three plates with real keys, follows the cursor, and takes them down on Esc', () => {
    void openToTarget();
    for (const role of ['target-plate', 'actor-plate', 'controls-hint']) expect(shown(plate(role))).toBe(true);
    expect(plate('actor-plate').textContent).toContain('Yuna');
    expect(plate('actor-plate').textContent).toContain('GUNNER');
    expect(plate('controls-hint').textContent).toMatch(/ENTER CONFIRM.*CHANGE TARGET.*ESC BACK/);
    const first = plate('target-plate').textContent;
    key('ArrowRight');
    const second = plate('target-plate').textContent;
    expect(new Set([first, second])).toEqual(new Set(['TARGETVegnagun', 'TARGETNode APART']));
    key('Escape');
    for (const role of ['target-plate', 'controls-hint']) expect(shown(plate(role))).toBe(false);
  });

  it('draws the plates above the reticle layer, so the petals never paint over them', () => {
    const layers = [...root.querySelector('.ffx2hud')!.children].map((c) => c.className);
    expect(layers.indexOf('ffx2hud__plates')).toBeGreaterThan(layers.indexOf('ffx2hud__overlay'));
    expect(root.querySelector('.ffx2hud__plates [data-role="target-plate"]')).not.toBeNull();
  });

  it('the plates layer is stacked at least as high as the reticle layer, not just later in the DOM', async () => {
    // `.ffx-targeting` carries a z-index, so DOM order alone lost: a petal painted
    // across the actor plate on a portrait phone (repair pass, chapter 4, 390x844).
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const z = (file: string[], selector: string): number => {
      const sheet = readFileSync(join(process.cwd(), 'src', 'ui', ...file), 'utf8');
      const at = sheet.indexOf(`\n${selector} {`);
      if (at < 0) return 0;
      const body = sheet.slice(at, sheet.indexOf('}', at));
      const m = /z-index:\s*(\d+)/.exec(body);
      return m ? Number(m[1]) : 0;
    };
    const reticle = z(['ffx', 'ffx-hud.css'], '.ffx-targeting');
    expect(reticle).toBeGreaterThan(0);
    expect(z(['ffx2', 'target-plates.css'], '.ffx2hud__plates')).toBeGreaterThanOrEqual(reticle);
  });

  it('a victory under an open menu closes the command stack, the reticle and the plates before the shot plays', () => {
    let resolved = false;
    void openToTarget().then(() => (resolved = true));
    expect(root.querySelector('.ffx-targeting')).not.toBeNull();
    expect(menuOwnsCancel()).toBe(true);
    const victory = { type: 'victory', seq: 99, result: RESULT } as BattleEvent;
    hud.onEvent(victory);
    const command = root.querySelector<HTMLElement>('.ffx2hud__command')!;
    expect(command.hidden).toBe(true);
    expect(command.innerHTML).toBe('');
    expect(root.querySelector('.ffx-targeting')).toBeNull();
    expect(shown(plate('target-plate'))).toBe(false);
    expect(root.querySelector<HTMLElement>('.ffx2-atbmode')!.hidden).toBe(true);
    // Esc belongs to the pause key again, and nothing was submitted for her.
    expect(menuOwnsCancel()).toBe(false);
    key('Enter');
    expect(resolved).toBe(false);
  });

  it('a decided state from sync does the same, for a defeat as much as a victory', () => {
    void openToTarget();
    const s = state();
    s.result = { ...RESULT, outcome: 'defeat' };
    hud.sync(s, { elapsedMs: 0, bars: [] });
    expect(root.querySelector<HTMLElement>('.ffx2hud__command')!.hidden).toBe(true);
    expect(root.querySelector('.ffx-targeting')).toBeNull();
    expect(shown(plate('controls-hint'))).toBe(false);
  });
});

describe('the plates keep the HUD type floor', () => {
  it('every font size in target-plates.css renders at 12 px or more at 1600x900 (scale 2.5)', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const sheet = readFileSync(join(process.cwd(), 'src', 'ui', 'ffx2', 'target-plates.css'), 'utf8');
    const sizes = [...sheet.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    for (const px of sizes) expect(px * 2.5).toBeGreaterThanOrEqual(12);
  });
});

describe('FFX never gets the plates (rule 14)', () => {
  it('a mounted FFX HUD has no TARGET plate, actor plate or controls hint', async () => {
    const { FFXBattleHud } = await import('../../src/ui/ffx/FFXBattleHud.ts');
    const root = document.createElement('div');
    document.body.append(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    expect(root.querySelector('.ffx2-tplate, .ffx2-aplate, .ffx2-ctlhint, .ffx2hud__plates')).toBeNull();
    hud.unmount();
    root.remove();
  });
});
