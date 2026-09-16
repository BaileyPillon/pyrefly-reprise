import { Screen } from '../../app/Screen.ts';
import type { InputSnapshot } from '../../app/Input.ts';
import type {
  AtbSnapshot,
  BattleState,
  FFX2Combatant,
  GarmentGridState,
} from '../../battle/common/types.ts';
import { FFX2BattleHud } from './FFX2BattleHud.ts';
import { openSpherechangeWheel, type GarmentGridDef } from './SpherechangeWheel.ts';

/**
 * A **live** (not static) demo of the FFX-2 HUD: real `FFX2BattleHud`
 * instance, fake battle state, driven by key presses so the art direction and
 * the interaction loop can both be screenshotted and eyeballed.
 *
 * | Key | Beat |
 * | --- | --- |
 * | C | pop a chain counter on Bahamut, escalating each press |
 * | T | fire a two-stage telegraph ("Mega Flare") on Bahamut |
 * | G | open the Garment Grid overlay for Yuna |
 * | Enter | open Yuna's command menu (resolves to console.log) |
 * | Esc | back to the title |
 */
export class FFX2HudMockScreen extends Screen {
  readonly name = 'hud2-mock';

  private hud: FFX2BattleHud | null = null;
  private state: BattleState | null = null;
  private atbSnapshot: AtbSnapshot | null = null;
  private chainCount = 0;
  private readonly onKey = (e: KeyboardEvent): void => {
    if (e.code === 'KeyC') this.pumpChain();
    else if (e.code === 'KeyT') this.pumpTelegraph();
    else if (e.code === 'KeyG') void this.openWheel();
    else if (e.code === 'Enter') void this.openCommandMenu();
  };

  override enter(): void {
    this.root.className = 'screen hud2-mock-screen';
    this.root.style.background = 'radial-gradient(circle at 50% 30%, #241030, #0a0410)';

    const { state, snapshot } = buildFakeState();
    this.state = state;
    this.atbSnapshot = snapshot;

    this.hud = new FFX2BattleHud();
    this.hud.mount(this.root);
    this.hud.setProjector((id) => PROJECTED[id] ?? null);
    this.hud.sync(state, snapshot);

    window.addEventListener('keydown', this.onKey);
  }

  override exit(): void {
    window.removeEventListener('keydown', this.onKey);
    this.hud?.unmount();
    this.hud = null;
  }

  override handleInput(input: InputSnapshot): void {
    if (input.consume('cancel')) void this.app.goto('title');
  }

  /** `window.__pyrefly.trigger(name)` hook, so `tools/screenshot.mjs --action=` can drive a beat headlessly. */
  override trigger(name: string): boolean {
    if (name === 'chain') {
      this.pumpChain();
      return true;
    }
    if (name === 'telegraph') {
      this.pumpTelegraph();
      return true;
    }
    if (name === 'wheel') {
      void this.openWheel();
      return true;
    }
    if (name === 'command') {
      void this.openCommandMenu();
      return true;
    }
    return false;
  }

  private pumpChain(): void {
    if (!this.hud) return;
    this.chainCount += 1;
    void this.hud.onEvent({
      seq: this.chainCount,
      type: 'chain',
      targetId: 'bahamut',
      count: this.chainCount,
      multiplier: 1.4 + 0.05 * this.chainCount,
    });
  }

  private pumpTelegraph(): void {
    if (!this.hud) return;
    void this.hud.onEvent({
      seq: 900,
      type: 'charge',
      enemyId: 'bahamut',
      name: 'Mega Flare',
      turnsLeft: 1,
      stage: 2,
    });
  }

  private async openWheel(): Promise<void> {
    if (!this.state) return;
    const yuna = this.state.combatants['yuna'] as FFX2Combatant;
    const grid = SAMPLE_GRID;
    const gridState: GarmentGridState = yuna.dresspheres!.garmentGrid;
    const cmd = await openSpherechangeWheel({
      root: this.root,
      grid,
      state: gridState,
      actorName: yuna.name,
      specialDressphereId: 'floral-fallal',
      onCancel: () => {},
    });
    // eslint-disable-next-line no-console
    console.log('[hud2-mock] spherechange resolved', cmd);
  }

  private async openCommandMenu(): Promise<void> {
    if (!this.hud || !this.state) return;
    const cmd = await this.hud.chooseCommand(
      'yuna',
      [
        { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: ['bahamut'] },
        {
          command: { kind: 'ability', id: 'trigger-happy', targets: [] },
          label: 'Trigger Happy',
          category: 'skill',
          mpCost: 0,
          enabled: true,
          validTargets: ['bahamut'],
          opensMinigame: 'gunner-trigger',
        },
        { command: { kind: 'ability', id: 'gunplay', targets: [] }, label: 'Gunplay', category: 'dressphere', mpCost: 4, enabled: true, validTargets: ['bahamut'] },
        { command: { kind: 'ability', id: 'trigger-happy-2', targets: [] }, label: 'Blaster Edge', category: 'dressphere', mpCost: 6, enabled: true, validTargets: ['bahamut'] },
        { command: { kind: 'ability', id: 'aim-shot', targets: [] }, label: 'Aim & Fire', category: 'dressphere', mpCost: 3, enabled: false, disabledReason: 'Silenced', validTargets: ['bahamut'] },
        { command: { kind: 'ability', id: 'g-lock', targets: [] }, label: "G-Lock's Bullet", category: 'dressphere', mpCost: 10, enabled: true, validTargets: ['bahamut'] },
        { command: { kind: 'item', id: 'potion', targets: [] }, label: 'Potion', category: 'item', mpCost: 0, enabled: true, validTargets: ['yuna', 'rikku', 'paine'] },
        // Spherechange always gets its own top-level, always-costs-your-turn
        // row regardless of `category` (it happens to share 'dressphere'
        // with the real skillset abilities above) — see CommandMenu.ts's
        // `isSpherechange` for why that has to be keyed off `command.kind`.
        { command: { kind: 'spherechange', targets: [], extra: { toDressphere: 'thief', toNode: 1, gatesCrossed: [] } }, label: 'Spherechange', category: 'dressphere', mpCost: 0, enabled: true, validTargets: [] },
      ],
      () => this.atbSnapshot ?? { elapsedMs: 0, bars: [] },
    );
    // eslint-disable-next-line no-console
    console.log('[hud2-mock] command resolved', cmd);
  }
}

// --------------------------------------------------------------- fake data

const PROJECTED: Record<string, { x: number; y: number }> = {
  bahamut: { x: 520, y: 160 },
  yuna: { x: 220, y: 300 },
  rikku: { x: 280, y: 310 },
  paine: { x: 340, y: 300 },
};

const SAMPLE_GRID: GarmentGridDef = {
  id: 'heart-of-flame',
  name: 'Heart of Flame',
  nodes: [{ dressphereId: 'gunner' }, { dressphereId: 'thief' }, { dressphereId: 'warrior' }, { dressphereId: null }],
  links: [
    { from: 0, to: 1, gate: 'red', gateEffectLabel: 'Firestrike (this battle)' },
    { from: 1, to: 2 },
    { from: 2, to: 3, gate: 'yellow', gateEffectLabel: 'T-STAT+ (this battle)' },
    { from: 3, to: 0 },
  ],
};

function makeGirl(id: string, name: string, dressphere: string, required: number, hp: number, maxHp: number): FFX2Combatant {
  return {
    id,
    name,
    side: 'party',
    spriteKey: `${id}-${dressphere}`,
    portraitKey: id,
    stats: { hp: maxHp, mp: 200, str: 20, def: 18, mag: 22, mdef: 18, agi: 40, luck: 20, eva: 20, acc: 20, maxHp, maxMp: 200 },
    hp,
    mp: 140,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: 'player',
    alive: true,
    removed: false,
    slot: 0,
    flags: {},
    level: 30,
    dresspheres: {
      current: dressphere,
      owned: ['gunner', 'thief', 'warrior', 'white-mage'],
      garmentGrid: { id: 'heart-of-flame', nodePosition: 0, passedGates: ['red'], wornThisBattle: ['gunner'] },
      abilitiesLearned: {},
    },
    atb: { ticks: 0, required, gauge: 0, charging: null, recovery: 0 },
    accessories: [],
    chainCount: 0,
    chainWindowTicks: 0,
  };
}

function buildFakeState(): { state: BattleState; snapshot: AtbSnapshot } {
  const yuna = makeGirl('yuna', 'Yuna', 'gunner', 16000, 1240, 1980);
  const rikku = makeGirl('rikku', 'Rikku', 'thief', 8000, 980, 1400);
  const paine = makeGirl('paine', 'Paine', 'warrior', 24000, 1600, 2100);
  const bahamut: FFX2Combatant = {
    ...makeGirl('bahamut', 'Bahamut', 'gunner', 30000, 28400, 32000),
    side: 'enemy',
    controller: 'ai',
    dresspheres: undefined,
    enemy: { aiScriptId: 'bahamut', formIndex: 0, forms: [], rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] } },
  };

  const state: BattleState = {
    game: 'ffx2',
    combatants: { yuna, rikku, paine, bahamut },
    activeIds: ['yuna', 'rikku', 'paine'],
    reserveIds: [],
    enemyIds: ['bahamut'],
    aeonId: null,
    turn: 1,
    ticks: 4000,
    log: [],
    nextSeq: 1,
    triggers: [],
    firedTriggerIds: [],
    result: null,
    seed: 1,
    flags: {},
  };

  const snapshot: AtbSnapshot = {
    elapsedMs: 4000,
    bars: [
      { actorId: 'yuna', fill: 0.62, required: 16000, ready: false, charge: null, state: 'normal' },
      { actorId: 'rikku', fill: 1, required: 8000, ready: true, charge: null, state: 'haste' },
      { actorId: 'paine', fill: 0.31, required: 24000, ready: false, charge: 0.2, state: 'normal' },
      { actorId: 'bahamut', fill: 0.8, required: 30000, ready: false, charge: null, state: 'normal' },
    ],
  };

  return { state, snapshot };
}
