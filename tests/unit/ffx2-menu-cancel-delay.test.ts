/**
 * **The menu-cancel correction** (`research/ffx2-combat-core.md` §9.2, commit `ea05f877`,
 * `[verified: 2 sources]`, Split_Infinity G1041 / G1042): only an ability with a **Delay effect** or
 * **Action-cancel** closes an open command menu, not every enemy hit. Release 17 (decision sheet
 * 2026-09-25 item 4 A1) closes the menu on any damaging enemy hit. The correction is built as the
 * named OFF switch `constants.ts` MENU_CANCEL_ONLY_DELAY_ABILITIES (`menu-cancel.ts`), with the
 * engine option `menuCancelOnlyDelayAbilities` for measuring. **FFX-2 only** (AGENTS.md rule 14).
 *
 * Proven on the real engine (rule 3): switch off, the logs are byte-identical to the build before
 * the switch existed (hashes taken from `d0d53cb4`); switch on, Bahamut's plain hit leaves the menu
 * open, and a sourced Delay ability (Chapter VI) still closes it.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, CombatantId, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFX2Engine, defaultAbilities } from '../../src/battle/ffx2/index.ts';
import { MENU_CANCEL_ONLY_DELAY_ABILITIES } from '../../src/battle/ffx2/constants.ts';
import { ActingAbilities, carriesMenuCancel } from '../../src/battle/ffx2/menu-cancel.ts';
import type { Ffx2EngineOptions } from '../../src/battle/ffx2/internal.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_CHAIN_ORDER } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { driveChapter4, driveChapter5, driveChapter6, ffx2Options, logHash } from './helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

const ability = (id: string): AbilityDef | undefined =>
  (data.ABILITIES as Record<string, AbilityDef>)[id] ?? defaultAbilities.get(id);

describe('carriesMenuCancel reads the sourced rows (no row is flagged here)', () => {
  it('the FFX-2 chapters\' Delay abilities carry it: Supercollider, Huggles, Mach Fan (Leblanc §4), Vita Brevis (Vegnagun §3.2)', () => {
    for (const id of ['x2-ormi-supercollider', 'x2-ormi-huggles', 'x2-leblanc-mach-fan', 'vita-brevis']) {
      expect(ability(id), id).toBeDefined();
      expect(carriesMenuCancel(ability(id)), id).toBe(true);
    }
  });
  it('a plain hit does not: Attack, Bahamut\'s Mega Flare, Ormi\'s Shield Bash; an unknown ability carries nothing', () => {
    for (const id of ['attack', 'mega-flare', 'x2-ormi-shield-bash']) {
      if (ability(id)) expect(carriesMenuCancel(ability(id)), id).toBe(false);
    }
    expect(carriesMenuCancel(undefined)).toBe(false);
  });
  it('ActingAbilities nests a counter inside a charged action and pops back to it', () => {
    const a = new ActingAbilities();
    a.note({ type: 'action-start', actorId: 'leblanc', command: { kind: 'ability', id: 'x2-leblanc-mach-fan', targets: [] }, abilityId: 'x2-leblanc-mach-fan', targets: [] } as never);
    a.note({ type: 'action-start', actorId: 'leblanc', command: { kind: 'ability', id: 'x2-leblanc-fan-slap', targets: [] }, abilityId: 'x2-leblanc-fan-slap', targets: [] } as never);
    expect(a.current('leblanc')).toBe('x2-leblanc-fan-slap');
    a.note({ type: 'action-end', actorId: 'leblanc' } as never);
    expect(a.current('leblanc')).toBe('x2-leblanc-mach-fan');
    a.note({ type: 'action-end', actorId: 'leblanc' } as never);
    a.note({ type: 'action-end', actorId: 'leblanc' } as never); // an unmatched end is harmless
    expect(a.current('leblanc')).toBeUndefined();
  });
});

describe('switch off (the default): release 17\'s logs, byte for byte', () => {
  // From `d0d53cb4`, before the switch existed (`ffx2ChapterDrive`, human pace: Active 1.5 s a
  // menu, and the Wait split 1.5 s / 0.5 s on the top list).
  const PINNED: Record<string, string> = {
    'IV|active|1': 'd059f64cfe4afce9', 'IV|split|1': 'c9ed16c44755cdd7',
    'IV|active|2': 'f6f806a146e9e13a', 'IV|split|2': 'eee3244f250d5099',
    'IV|active|3': 'f83208beb680732e', 'IV|split|3': '7261df9d93c54c46',
    'V|active|1': 'cccd73412d81d111', 'V|split|1': '36d75afe39f7487e',
    'V|active|2': '1248968158cd4baa', 'V|split|2': '172b35bec210c2b2',
    'V|active|3': '31ebf80e1112a172', 'V|split|3': '488b65aa589d1d7b',
    'VI|active|1': '2479ed7e82b3f22d', 'VI|split|1': 'e3a104259dcaae53',
    'VI|active|2': '8f610b1001a7c91d', 'VI|split|2': '2dced3deffa86083',
    'VI|active|3': '89fde8982efe7a14', 'VI|split|3': '5d55feb0039ead09',
  };
  const DRIVES = { IV: driveChapter4, V: driveChapter5, VI: driveChapter6 } as const;

  it('the switch ships OFF', () => {
    expect(MENU_CANCEL_ONLY_DELAY_ABILITIES).toBe(false);
  });

  it('Chapters IV, V and VI at human pace replay the pre-switch logs; switch on, Chapter IV\'s Active logs move', () => {
    let movedOn = 0;
    for (const [name, drive] of Object.entries(DRIVES)) {
      for (let seed = 1; seed <= 3; seed++) {
        for (const off of [{}, { menuCancelOnlyDelayAbilities: false }] as Array<Partial<Ffx2EngineOptions>>) {
          expect(logHash(drive(seed, 1500, { atbMode: 'active', ...off })), `${name} active ${seed}`).toBe(PINNED[`${name}|active|${seed}`]);
          expect(logHash(drive(seed, 1500, { atbMode: 'wait', waitSplit: true, ...off }, undefined, 500)), `${name} split ${seed}`).toBe(PINNED[`${name}|split|${seed}`]);
        }
        if (name === 'IV' && logHash(drive(seed, 1500, { atbMode: 'active', menuCancelOnlyDelayAbilities: true })) !== PINNED[`IV|active|${seed}`]) movedOn += 1;
      }
    }
    expect(movedOn, 'the switch must change something where Bahamut\'s plain hits closed menus').toBeGreaterThan(0);
  }, 120_000);
});

/** A fresh engine on `group` with `party`, stopped at its first open menu. */
function engineAt(group: EnemyGroupDef, party: typeof bevelleBuild, seed: number, extra: Partial<Ffx2EngineOptions>): { engine: FFX2Engine; menu: Input } {
  const engine = new FFX2Engine(ffx2Options(extra));
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  for (let i = 0; i < 1000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return { engine, menu: d };
    if (d.kind === 'waiting') engine.tick(d.nextEventMs);
    if (d.kind === 'battle-over') break;
  }
  throw new Error('no menu opened');
}

/** One 100 ms step in which enemy hits dealt the standing owner damage: the abilities behind them, and whether her menu was closed after it. */
interface Landed { abilities: Array<string | undefined>; closedAfter: boolean }

const anyDelay = (l: Landed): boolean => l.abilities.some((a) => carriesMenuCancel(ability(a ?? '')));

/** Run the clock under the open menu in 100 ms steps for up to `ms`, listing the steps where an enemy hit landed on the owner. */
function hitsUnderMenu(engine: FFX2Engine, owner: CombatantId, ms: number): Landed[] {
  const acting = new ActingAbilities();
  const landed: Landed[] = [];
  for (let t = 0; t < ms && !engine.state().result; t += 100) {
    const events: BattleEvent[] = engine.tick(100, { throughInput: true });
    const here: Array<string | undefined> = [];
    for (const e of events) {
      acting.note(e as never);
      if (e.type === 'damage' && e.targetId === owner && e.amount > 0 && e.sourceId && engine.state().enemyIds.includes(e.sourceId)) {
        here.push(acting.current(e.sourceId));
      }
    }
    const closed = !engine.inputValid(owner);
    const alive = (engine.state().combatants[owner]?.hp ?? 0) > 0;
    // A status that lands on her (Petrify, Eject, Stop, Sleep, Berserk...) closes the menu on its own
    // rule (`active.ts` inputStillValid), not the hit rule: those steps say nothing about this switch.
    const statused = events.some((e) => (e.type === 'status-add' || e.type === 'ko') && e.targetId === owner);
    if (alive && !statused && here.length > 0 && !engine.state().result) landed.push({ abilities: here, closedAfter: closed });
    if (closed) break;
  }
  return landed;
}

describe('switch on: a plain hit leaves the menu open, a Delay ability closes it (Active)', () => {
  it('Chapter IV: Bahamut\'s hits land on the owner and her menu stays open', () => {
    const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut']!;
    let plain = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const { engine, menu } = engineAt(group, bevelleBuild, seed, { atbMode: 'active', menuCancelOnlyDelayAbilities: true });
      for (const hit of hitsUnderMenu(engine, menu.actorId, 30_000)) {
        expect(anyDelay(hit), `seed ${seed}: ${hit.abilities.join(', ')}`).toBe(false);
        expect(hit.closedAfter, `seed ${seed}: ${hit.abilities.join(', ')} closed the menu`).toBe(false);
        plain += 1;
      }
    }
    expect(plain, 'no Bahamut hit landed under an open menu').toBeGreaterThan(0);

    // The same seeds with the switch off: release 17 closes on the first such hit.
    const { engine, menu } = engineAt(group, bevelleBuild, 1, { atbMode: 'active' });
    const off = hitsUnderMenu(engine, menu.actorId, 30_000);
    expect(off.some((h) => h.closedAfter)).toBe(true);
  });

  it('Chapter VI: a Delay ability that lands on the owner closes her menu; a plain one does not', () => {
    let delayCloses = 0;
    let plainOpen = 0;
    for (const groupId of LEBLANC_CHAIN_ORDER) {
      const group = data.ENEMY_GROUPS_BY_ID[groupId]!;
      for (let seed = 1; seed <= 40; seed++) {
        const { engine, menu } = engineAt(group, chateauBuild, seed, { atbMode: 'active', menuCancelOnlyDelayAbilities: true });
        for (const hit of hitsUnderMenu(engine, menu.actorId, 60_000)) {
          const delay = anyDelay(hit);
          expect(hit.closedAfter, `${groupId} seed ${seed}: ${hit.abilities.join(', ')}`).toBe(delay);
          if (delay) delayCloses += 1;
          else plainOpen += 1;
        }
      }
    }
    expect(delayCloses, 'no Delay ability landed under an open menu in 120 Chapter VI runs').toBeGreaterThan(0);
    expect(plainOpen).toBeGreaterThan(0);
  }, 120_000);
});
