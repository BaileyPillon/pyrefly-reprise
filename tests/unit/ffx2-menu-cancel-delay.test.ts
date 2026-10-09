/**
 * **The menu-cancel correction** (`research/ffx2-combat-core.md` §9.2, commit `ea05f877`,
 * `[verified: 2 sources]`, Split_Infinity G1041 / G1042): only an ability with a **Delay effect** or
 * **Action-cancel** closes an open command menu, not every enemy hit. Release 17 (decision sheet
 * 2026-09-25 item 4 A1) closed the menu on any damaging enemy hit. The correction is the switch
 * `constants.ts` MENU_CANCEL_ONLY_DELAY_ABILITIES (`menu-cancel.ts`), built OFF and turned **ON** by
 * Bailey on 2026-09-26 ("I'll take all your recommendations", answering "menu correction on (my
 * recommendation), or keep it as is"); the engine option `menuCancelOnlyDelayAbilities: false`
 * replays release 17's rule for measuring. **FFX-2 only** (AGENTS.md rule 14).
 *
 * Proven on the real engine (rule 3): with the option `false`, the logs are byte-identical to the
 * build before the switch existed (hashes taken from `d0d53cb4`); by default (on) they are the logs
 * re-pinned on 2026-09-26, Bahamut's plain hit leaves the menu open, and a sourced Delay ability
 * (Chapter VI) still closes it.
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

describe('the default is ON; the option `false` replays release 17\'s logs, byte for byte', () => {
  // Release 17's rule, from `d0d53cb4` (one row re-pinned for PR-0145, below), before the switch existed (`ffx2ChapterDrive`, human pace:
  // Active 1.5 s a menu, and the Wait split 1.5 s / 0.5 s on the top list).
  // **Re-pinned 2026-10-09 for re-parity W3 (FFX-2 only; reason "game-code parity").** The kernels decide every hit in the game's draw order,
  // so every log moved, and `immuneHitsSkipChain: false` is no longer read (the game's chain byte rises only on a positive HP number, so an
  // immune hit never opens a chain). These eighteen are therefore NOT release 17's logs any more: they are the current engine with the
  // three release-17 options forced off (any damaging hit closes an open menu), pinned so that rule stays reproducible and distinct from the
  // default. The old hashes are in git at 029d49c7. Chapter VI's split run of seed 3 moved once more (here and in ON below) when the monster
  // rows by fight went in (`FFX2MonsterRecord.commands`: Ormi's Concussive Shock, power 4, in the first room; the Fem-Goon's own Attack row).
  const PINNED: Record<string, string> = {
    'IV|active|1': 'aa5dec90f7063d16', 'IV|split|1': '0fa2f4a8edb1be5b',
    'IV|active|2': '6721ef99da65b770', 'IV|split|2': '13763da259186065',
    'IV|active|3': '35678eca69be555b', 'IV|split|3': '0fc033783a4abb68',
    'V|active|1': '9cfe461ad465c311', 'V|split|1': '437c85e81ea08054',
    'V|active|2': 'e7b90b74c53c5a16', 'V|split|2': '94119b09f8fb5da3',
    'V|active|3': 'b84d244db178ad3e', 'V|split|3': 'e70d65bbd193fc3d',
    'VI|active|1': '12d69326e68d09f2', 'VI|split|1': 'cd51b9dbeab47115',
    'VI|active|2': '0eff8835d726e853', 'VI|split|2': '66d3ab577d1b1bcc',
    'VI|active|3': 'b2cfa25eb31ec05a', 'VI|split|3': '6a75d9deb02fa7cf',
  };
  // Switch on (the default since 2026-09-26), recorded on branch `r20-menu-cancel` the same way; re-pinned 2026-10-09 for re-parity W3
  // (same cause as above; old hashes at 029d49c7).
  // All eighteen differ from release 17's: at human pace a plain hit lands on an open menu in each of
  // these runs. `ffx2-atb-golden.test.ts` holds the matching Active re-pin (same first two per chapter).
  const ON: Record<string, string> = {
    'IV|active|1': '5b34258bf8580c9e', 'IV|split|1': 'c66739aca2d893be',
    'IV|active|2': 'a752fe90d9c63afa', 'IV|split|2': '8217379e6a255129',
    'IV|active|3': 'd5c988b268bebc0e', 'IV|split|3': 'ef0bc0517cc943f8',
    'V|active|1': 'fe7ab95d0fbae673', 'V|split|1': '88e40db9940ac6e0',
    'V|active|2': '086e107f235fc649', 'V|split|2': 'a621da560e50e1e9',
    'V|active|3': '0e5f385c8dca4fa7', 'V|split|3': 'ec68335b5d29e5b9',
    'VI|active|1': 'a77a0b4b1dcba113', 'VI|split|1': 'ca1c8bcd80dbf334',
    'VI|active|2': '55c7f457cfc62c2a', 'VI|split|2': 'cad662e72aec12e9',
    'VI|active|3': 'a4912c4e9de351d3', 'VI|split|3': '7c5a4a6680191cd7',
  };
  const DRIVES = { IV: driveChapter4, V: driveChapter5, VI: driveChapter6 } as const;

  it('the switch ships ON (Bailey, 2026-09-26)', () => {
    expect(MENU_CANCEL_ONLY_DELAY_ABILITIES).toBe(true);
  });

  it('Chapters IV, V and VI at human pace: `false` plays release 17\'s rule (any damaging hit closes a menu); the default and `true` play the re-pinned ones', () => {
    for (const [name, drive] of Object.entries(DRIVES)) {
      for (let seed = 1; seed <= 3; seed++) {
        // Release 17 also predates D-242 (2026-09-27): IC-1 and PR-0106 were off, so they are forced off here.
        const r17 = { menuCancelOnlyDelayAbilities: false, immuneHitsSkipChain: false, leblancScriptSinirothX: false };
        expect(logHash(drive(seed, 1500, { atbMode: 'active', ...r17 })), `${name} active ${seed} r17`).toBe(PINNED[`${name}|active|${seed}`]);
        expect(logHash(drive(seed, 1500, { atbMode: 'wait', waitSplit: true, ...r17 }, undefined, 500)), `${name} split ${seed} r17`).toBe(PINNED[`${name}|split|${seed}`]);
        for (const on of [{}, { menuCancelOnlyDelayAbilities: true }] as Array<Partial<Ffx2EngineOptions>>) {
          expect(logHash(drive(seed, 1500, { atbMode: 'active', ...on })), `${name} active ${seed}`).toBe(ON[`${name}|active|${seed}`]);
          expect(logHash(drive(seed, 1500, { atbMode: 'wait', waitSplit: true, ...on }, undefined, 500)), `${name} split ${seed}`).toBe(ON[`${name}|split|${seed}`]);
        }
        expect(ON[`${name}|active|${seed}`]).not.toBe(PINNED[`${name}|active|${seed}`]);
        expect(ON[`${name}|split|${seed}`]).not.toBe(PINNED[`${name}|split|${seed}`]);
      }
    }
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

    // The same seed with the option `false`: release 17's rule closes on the first such hit.
    const { engine, menu } = engineAt(group, bevelleBuild, 1, { atbMode: 'active', menuCancelOnlyDelayAbilities: false });
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
