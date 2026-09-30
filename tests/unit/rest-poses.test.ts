// @vitest-environment jsdom
/**
 * The Sleep hunch and the low-HP ("critical") painting (D-296, paintings approved 2026-09-30 as D-298), both
 * games: which painting a party member rests in, its precedence against the other states, the fallback for a
 * figure with no painting, and a real Chapter I battle piped through the status tap (rule 3).
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { AnyCombatant, BattleEvent, BattleState, Command, CombatantId } from '../../src/battle/common/types.ts';
import type { HudPort as Hud } from '../../src/engine/HudPort.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { registerFFXAbilities, registerFFXItems } from '../../src/battle/ffx/registry.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { recommendedCommand } from '../../src/engine/tactics/guide.ts';
import { resetArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';
import { resolvePoseMap } from '../../src/engine/BattlePresenterArt.ts';
import { FFX_HP_YELLOW_BELOW, PartyStatusWindow } from '../../src/ui/ffx/PartyStatusWindow.ts';
import { hpClass } from '../../src/ui/ffx2/PartyRows.ts';
import { REST_POSES, RestPoses, isLowHp, restPoseOf } from '../../src/ui/common/restPoses.ts';
import { withStatusLooks, type StatusLooksApi } from '../../src/ui/common/withStatusLooks.ts';

function member(over: Partial<{ id: string; side: string; hp: number; maxHp: number; alive: boolean; statuses: Record<string, unknown> }> = {}): AnyCombatant {
  const hp = over.hp ?? 1000;
  return {
    id: over.id ?? 'yuna', name: 'Yuna', side: over.side ?? 'party', alive: over.alive ?? hp > 0, removed: false, hp, mp: 0, flags: {},
    stats: { maxHp: over.maxHp ?? 1000, maxMp: 100 }, statuses: over.statuses ?? {},
  } as unknown as AnyCombatant;
}

describe('restPoseOf: the source table, each game its own threshold', () => {
  it('FFX: critical below half of max HP, the HUD yellow digits (research/ffx-combat-core.md V8)', () => {
    expect(FFX_HP_YELLOW_BELOW).toBe(0.5);
    expect(restPoseOf('ffx', member({ hp: 499 }))).toBe('critical');
    expect(restPoseOf('ffx', member({ hp: 500 }))).toBe('idle');
    expect(restPoseOf('ffx', member({ hp: 1 }))).toBe('critical');
  });

  it('FFX-2: critical below a third, the HUD gold digits (hpClass, < 33 %)', () => {
    expect(restPoseOf('ffx2', member({ hp: 329 }))).toBe('critical');
    expect(restPoseOf('ffx2', member({ hp: 330 }))).toBe('idle');
    expect(restPoseOf('ffx2', member({ hp: 400 }))).toBe('idle'); // FFX would slouch here; FFX-2 does not
    expect(restPoseOf('ffx', member({ hp: 400 }))).toBe('critical');
  });

  it('the thresholds agree with the HUDs for every HP value', () => {
    const psw = new PartyStatusWindow();
    for (let hp = 1; hp <= 100; hp++) {
      expect(isLowHp('ffx2', hp, 100), `ffx2 ${hp}`).toBe(hpClass(hp, 100) === 'ffx2-hp--crit');
      psw.render(['y'], { y: member({ id: 'y', hp, maxHp: 100 }) }, null);
      const yellow = !!psw.el.querySelector('.ffx-stat__value--crit, .ffx-stat__value--danger');
      expect(isLowHp('ffx', hp, 100), `ffx ${hp}`).toBe(yellow);
    }
  });

  it('precedence: KO stands aside, Petrify and FFX-2 Stop hold, Sleep over Critical, tints combine', () => {
    expect(restPoseOf('ffx', member({ hp: 0 }))).toBe('idle');
    expect(restPoseOf('ffx', member({ hp: 100, alive: false }))).toBe('idle');
    expect(restPoseOf('ffx', member({ hp: 100, statuses: { petrify: {} } }))).toBe('hold');
    expect(restPoseOf('ffx2', member({ hp: 100, statuses: { petrify: {} } }))).toBe('hold');
    expect(restPoseOf('ffx2', member({ hp: 100, statuses: { stop: {} } }))).toBe('hold');
    expect(restPoseOf('ffx2', member({ hp: 900, statuses: { sleep: {} } }))).toBe('sleep');
    expect(restPoseOf('ffx', member({ hp: 100, statuses: { sleep: {} } }))).toBe('sleep');
    expect(restPoseOf('ffx', member({ hp: 100, statuses: { zombie: {}, berserk: {} } }))).toBe('critical');
    expect(restPoseOf('ffx', member({ hp: 900, statuses: { confuse: {}, curse: {}, poison: {} } }))).toBe('idle');
    // enemies and aeons never take these paintings
    expect(restPoseOf('ffx', member({ side: 'enemy', hp: 1, statuses: { sleep: {} } }))).toBe('idle');
    expect(restPoseOf('ffx', member({ side: 'aeon', hp: 1 }))).toBe('idle');
  });
});

/** A fake painted figure whose setPose lives on its prototype, like PaintedActor's. */
class Fig {
  pose = 'idle';
  calls: string[] = [];
  setPose(name: string): void {
    this.calls.push(name);
    this.pose = name;
  }
}

function fieldOf(painted: Record<string, string[]>) {
  const figs = new Map<CombatantId, Fig>();
  return {
    figs,
    field: {
      actor: (id: CombatantId) => {
        if (!figs.has(id)) figs.set(id, new Fig());
        return figs.get(id)!;
      },
      paints: (id: CombatantId, pose: string) => (painted[id] ?? []).includes(pose),
    },
  };
}

function stateOf(...cs: AnyCombatant[]): BattleState {
  return { combatants: Object.fromEntries(cs.map((c) => [c.id, c])) } as unknown as BattleState;
}

describe('RestPoses: the figure', () => {
  it('a resting figure swaps to its sleep or critical painting and back', () => {
    const { figs, field } = fieldOf({ yuna: ['sleep', 'critical'] });
    const rp = new RestPoses('ffx', () => field);
    rp.sync(stateOf(member({ hp: 900 })));
    expect(figs.get('yuna')!.pose).toBe('idle');
    rp.sync(stateOf(member({ hp: 400 })));
    expect(figs.get('yuna')!.pose).toBe('critical');
    rp.sync(stateOf(member({ hp: 400, statuses: { sleep: {} } })));
    expect(figs.get('yuna')!.pose).toBe('sleep');
    rp.sync(stateOf(member({ hp: 900 })));
    expect(figs.get('yuna')!.pose).toBe('idle');
  });

  it("a figure without the painting keeps today's standing painting (fallback)", () => {
    const { figs, field } = fieldOf({ kimahri: [] });
    const rp = new RestPoses('ffx', () => field);
    rp.sync(stateOf(member({ id: 'kimahri', hp: 100, statuses: { sleep: {} } })));
    const k = figs.get('kimahri')!;
    expect(rp.restOf('kimahri')).toBe('sleep');
    expect(k.pose).toBe('idle');
    k.setPose('attack');
    k.setPose('idle');
    expect(k.pose).toBe('idle');
  });

  it("an action's own poses are never replaced; the return to idle lands on the rest", () => {
    const { figs, field } = fieldOf({ auron: ['critical'] });
    const rp = new RestPoses('ffx', () => field);
    rp.sync(stateOf(member({ id: 'auron', hp: 900 })));
    const a = figs.get('auron')!;
    for (const p of ['ready', 'attack', 'cast', 'item', 'hurt', 'defend', 'victory', 'ko']) {
      a.setPose(p);
      expect(a.pose).toBe(p);
    }
    a.setPose('attack');
    rp.sync(stateOf(member({ id: 'auron', hp: 200 }))); // HP drops mid-action: the action's pose stays
    expect(a.pose).toBe('attack');
    a.setPose('idle'); // the presenter's action-end
    expect(a.pose).toBe('critical');
  });

  it('a stale rest request (a flinch handing back "sleep" after the hit woke her) lands on the current rest', () => {
    const { figs, field } = fieldOf({ yuna: ['sleep', 'critical'] });
    const rp = new RestPoses('ffx', () => field);
    rp.sync(stateOf(member({ hp: 900, statuses: { sleep: {} } })));
    const y = figs.get('yuna')!;
    y.setPose('hurt');
    rp.sync(stateOf(member({ hp: 300 }))); // woken by the physical hit, now low
    y.setPose('sleep');
    expect(y.pose).toBe('critical');
  });

  it('Petrify and Stop hold the painting the figure had', () => {
    const { figs, field } = fieldOf({ paine: ['sleep', 'critical'] });
    const rp = new RestPoses('ffx2', () => field);
    rp.sync(stateOf(member({ id: 'paine', hp: 100 })));
    expect(figs.get('paine')!.pose).toBe('critical');
    rp.sync(stateOf(member({ id: 'paine', hp: 900, statuses: { stop: {} } })));
    expect(figs.get('paine')!.pose).toBe('critical');
    rp.sync(stateOf(member({ id: 'paine', hp: 900, statuses: { petrify: {} } })));
    expect(figs.get('paine')!.pose).toBe('critical');
    rp.sync(stateOf(member({ id: 'paine', hp: 900 })));
    expect(figs.get('paine')!.pose).toBe('idle');
  });

  it('KO: the presenter owns the fall; a revive at low HP rests in the critical painting', () => {
    const { figs, field } = fieldOf({ wakka: ['critical'] });
    const rp = new RestPoses('ffx', () => field);
    rp.sync(stateOf(member({ id: 'wakka', hp: 100 })));
    const w = figs.get('wakka')!;
    w.setPose('ko');
    rp.sync(stateOf(member({ id: 'wakka', hp: 0 })));
    expect(w.pose).toBe('ko');
    rp.sync(stateOf(member({ id: 'wakka', hp: 150 })));
    expect(w.pose).toBe('ko'); // still down until the presenter raises it
    w.setPose('idle'); // the revive
    expect(w.pose).toBe('critical');
  });

  it('dispose puts the prototype setPose back and the standing painting up', () => {
    const { figs, field } = fieldOf({ yuna: ['sleep'] });
    const rp = new RestPoses('ffx', () => field);
    rp.sync(stateOf(member({ statuses: { sleep: {} } })));
    const y = figs.get('yuna')!;
    expect(Object.prototype.hasOwnProperty.call(y, 'setPose')).toBe(true);
    rp.dispose();
    expect(Object.prototype.hasOwnProperty.call(y, 'setPose')).toBe(false);
    expect(y.pose).toBe('idle');
    expect([...REST_POSES].sort()).toEqual(['critical', 'idle', 'sleep']);
  });
});

describe('the status marks sit on the head of the resting painting', () => {
  it('headOf reads headTop from the sidecar of the painting that is up, and stands aside otherwise', async () => {
    const realFetch = globalThis.fetch;
    const asked: string[] = [];
    globalThis.fetch = (async (u: RequestInfo | URL) => {
      asked.push(String(u));
      return new Response(JSON.stringify({ width: 10, height: 10, headTop: [0.5, 0.25] }), { status: 200 });
    }) as typeof fetch;
    try {
      const { figs, field } = fieldOf({ yuna: ['sleep'] });
      const withArt = { ...field, snapshot: () => [{ id: 'yuna', art: 'yuna' }] };
      const rp = new RestPoses('ffx', () => withArt);
      const rect = { x: 100, y: 200, w: 80, h: 160 };
      rp.sync(stateOf(member({ hp: 900 })));
      expect(rp.headOf('yuna', rect)).toBeNull(); // standing: the field's own head
      rp.sync(stateOf(member({ hp: 900, statuses: { sleep: {} } })));
      expect(figs.get('yuna')!.pose).toBe('sleep');
      expect(rp.headOf('yuna', rect)).toBeNull(); // first ask starts the read
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
      expect(rp.headOf('yuna', rect)).toEqual({ x: 140, y: 240 });
      expect(asked.filter((u) => u.endsWith('/art/characters/yuna/sleep.json'))).toHaveLength(1);
      expect(rp.headOf('yuna', null)).toBeNull();
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});

describe('the pose map: sleep and critical fall back to idle for a figure without them', () => {
  afterEach(() => resetArtManifest());
  it('FFX Yuna and FFX-2 Rikku Thief get their own; Kimahri and Paine Dark Knight stand as today', async () => {
    const subjects = {
      yuna: { states: ['idle', 'attack', 'sleep', 'critical'] },
      kimahri: { states: ['idle', 'attack'] },
      'rikku-thief': { states: ['idle', 'item', 'sleep', 'critical'] },
      'paine-dark-knight': { states: ['idle', 'attack'] },
      'paine-songstress': { states: ['idle', 'cast', 'attack', 'hurt'] },
    };
    setArtManifest({ version: 1, generatedAt: 't', subjects, portraits: [], backdrops: [], pause: [], pause2x: [], title: [], title2x: [] } as never);
    const pose = async (id: string, p: string) => /\/([a-z-]+)\.png$/.exec((await resolvePoseMap(id, 'party'))[p]!)?.[1];
    expect(await pose('yuna', 'sleep')).toBe('sleep');
    expect(await pose('yuna', 'critical')).toBe('critical');
    expect(await pose('kimahri', 'sleep')).toBe('idle');
    expect(await pose('kimahri', 'critical')).toBe('idle');
    expect(await pose('rikku-thief', 'critical')).toBe('critical');
    expect(await pose('paine-dark-knight', 'sleep')).toBe('idle');
    // Paine's Songstress attack and hurt no longer fall back to her standing painting once installed
    expect(await pose('paine-songstress', 'attack')).toBe('attack');
    expect(await pose('paine-songstress', 'hurt')).toBe('hurt');
  });

  it('D-301 (FFX only): once installed, Kimahri rests in his own sleep and critical, at the FFX line (below half)', async () => {
    setArtManifest({ version: 1, generatedAt: 't', subjects: { kimahri: { states: ['idle', 'attack', 'critical', 'sleep'] } }, portraits: [], backdrops: [], pause: [], pause2x: [], title: [], title2x: [] } as never);
    const pose = async (p: string) => /\/([a-z-]+)\.png$/.exec((await resolvePoseMap('kimahri', 'party'))[p]!)?.[1];
    expect(await pose('sleep')).toBe('sleep');
    expect(await pose('critical')).toBe('critical');
    expect(restPoseOf('ffx', member({ id: 'kimahri', hp: 499 }))).toBe('critical');
    expect(restPoseOf('ffx', member({ id: 'kimahri', hp: 500 }))).toBe('idle');
    expect(restPoseOf('ffx', member({ id: 'kimahri', hp: 100, statuses: { sleep: {} } }))).toBe('sleep');
  });
});

// ------------------------------------------------------------------ a real battle (rule 3)

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));
beforeAll(() => {
  registerFFXAbilities(ALL_ABILITIES.filter((a) => a.game === 'ffx'));
  registerFFXItems(Object.values(ITEMS).filter((i) => i.game === 'ffx'));
});

function stubHud(): Hud {
  return {
    mount(root: HTMLElement) {
      const el = document.createElement('div');
      el.dataset['role'] = 'ffx-hud';
      el.innerHTML = '<div class="ffxhud__stage"></div>';
      root.appendChild(el);
    },
    unmount() {},
    sync() {},
    onEvent() {},
    async chooseCommand() { return { kind: 'defend', targets: [] } as Command; },
    setProjector() {},
    setVisible() {},
    update() {},
  } as unknown as Hud;
}

describe('a real Chapter I battle (FFX): every resting figure shows the painting its HP and statuses call for', () => {
  it('the critical painting follows the yellow digits; the fight is unchanged by the tap', () => {
    const painted = { tidus: ['sleep', 'critical'], yuna: ['sleep', 'critical'], auron: ['sleep', 'critical'], wakka: ['sleep', 'critical'], lulu: ['sleep', 'critical'], rikku: ['sleep', 'critical'], kimahri: [] };
    const { figs, field } = fieldOf(painted);
    // the tap wants the tint surface too
    const tintable = {
      ...field,
      actor: (id: CombatantId) => Object.assign(field.actor(id), { setTint() {}, update() {}, traverse() {} }),
    };
    const hud = withStatusLooks(stubHud(), 'ffx', () => tintable as never);
    const root = document.createElement('div');
    document.body.appendChild(root);
    hud.mount(root);
    const api = (hud as Hud & { statusLooks: StatusLooksApi }).statusLooks;

    const run = (tap: boolean): { turns: number; transcript: string; critSeen: number; checks: number } => {
      const chapter = getChapter('seymour-flux')!;
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.setSeed(3);
      engine.init({ game: 'ffx', party: chapter.buildRef, enemies: ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id]!, triggers: [], seed: 3, condition: 'normal', canEscape: false } as never);
      let critSeen = 0;
      let checks = 0;
      const out: string[] = [];
      const feed = (events: BattleEvent[]): void => {
        const s = engine.state() as BattleState;
        if (tap) hud.sync(s, []);
        for (const e of events) {
          out.push(e.type);
          if (!tap) continue;
          hud.onEvent(e);
        }
        if (!tap) return;
        // At rest (the presenter's action-end asks for idle), each member shows exactly what the table says.
        for (const c of Object.values(s.combatants)) {
          if (!c || c.side !== 'party' || !c.alive) continue;
          const fig = figs.get(c.id);
          if (!fig) continue;
          fig.setPose('idle');
          const want = restPoseOf('ffx', c);
          const has: string[] = painted[c.id as keyof typeof painted] ?? [];
          const expected = want === 'hold' ? fig.pose : has.includes(want) ? want : 'idle';
          expect(fig.pose, `${c.id} hp ${c.hp}/${c.stats.maxHp}`).toBe(expected);
          checks++;
          if (fig.pose === 'critical') critSeen++;
        }
      };
      let turns = 0;
      for (let i = 0; i < 300; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'resolved') { feed(d.events); continue; }
        if (d.kind !== 'player-input') continue;
        const state = engine.state() as BattleState;
        if (state.turn > 30) break;
        turns = state.turn;
        feed(engine.submit(recommendedCommand(state, d) ?? ({ kind: 'defend', targets: [] } as Command)));
      }
      return { turns, transcript: out.join(','), critSeen, checks };
    };
    const withTap = run(true);
    const without = run(false);
    console.info(`[rest-poses] Chapter I seed 3: ${withTap.checks} rest checks, ${withTap.critSeen} in the critical painting, turn ${withTap.turns}`);
    expect(withTap.checks).toBeGreaterThan(50);
    expect(withTap.critSeen).toBeGreaterThan(0); // Seymour Flux takes someone under half
    expect(withTap.transcript).toBe(without.transcript); // rule 1: the tap changes nothing in the fight
    expect(api.poses).toBeDefined();
    // Kimahri has no painting: every check of his was the standing one
    expect(figs.get('kimahri')?.calls.every((p) => p === 'idle' || !REST_POSES.has(p))).toBe(true);
    hud.unmount();
  });
});
