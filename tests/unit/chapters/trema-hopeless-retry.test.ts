/**
 * **PR-0407, the checkpoint rule behind Chapter XIII's Retry** (FFX-2 only), pinned on the pieces: `standingIn`,
 * `hopelessAt`, `checkpointAt` and `resumeSetup` (`app/screens/BattleChainCheckpoint.ts`), the real engine opening
 * the retry's setup, the pause menu's RESTART ENCOUNTER hand-over, and the guarantee that no other formation names the
 * rule. The same loss through the real `GameFlow` is `trema-retry-flow.test.ts`.
 *
 * Game case: FFX-2 only. Trema's link is the one formation that carries `hopelessRetry`; the field is shared plumbing
 * that every other chain leaves absent (Ch XI's Save Sphere links, Ch V's Shuyin, Ch XV's Den of Woe switch, and FFX's
 * Sin link 3 are checked below).
 */

import { describe, expect, it } from 'vitest';

import { checkpointAt, hopelessAt, resumeSetup, standingIn } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { closeRun, openRun } from '../../../src/app/screens/pause/restartCarry.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { BattleSetup, BattleState, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { applyStatus } from '../../../src/battle/ffx2/statuses.ts';
import { ENEMY_GROUPS_BY_ID as FFX_GROUPS } from '../../../src/data/ffx/index.ts';
import { ENEMY_GROUPS_BY_ID as FFX2_GROUPS } from '../../../src/data/ffx2/index.ts';
import { DEN_BARALAI, DEN_GIPPAL, DEN_NOOJ } from '../../../src/data/ffx2/enemies/den-of-woe.ts';
import { sinGenaisCoreGroup } from '../../../src/data/ffx/enemies/sin-genais-core.ts';
import { roadSistersGroup } from '../../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import {
  CLOISTER_PARAGON, CLOISTER_TREMA, HOPELESS_BELOW, TREMA_HOPELESS_RETRY, cloisterTremaGroup, tremaHopelessRetry,
} from '../../../src/data/ffx2/enemies/trema.ts';
import { board } from '../helpers/tremaUnits.ts';
import { runChain } from '../helpers/sinFinsBench.ts';
import { makeSensible } from '../helpers/sinFinsPolicies.ts';
import { group, newEngine } from '../helpers/tremaDrive.ts';

/** The setup Trema's link opens on after Paragon, with the girls in `ko` knocked out and `hp` set (the seam reads live state). */
function seamAfterParagon(ko: readonly string[], hp: Record<string, number> = {}): BattleSetup {
  const b = board('paragon');
  for (const id of ko) {
    const u = b.unit(id);
    u.hp = 0;
    u.alive = false;
    applyStatus(u, { status: 'ko', chance: 255, duration: 0 });
  }
  for (const [id, v] of Object.entries(hp)) b.unit(id).hp = v;
  const first: BattleSetup = { game: 'ffx2', party: viaInfinitoBuild, enemies: group(CLOISTER_PARAGON), triggers: [], seed: 1, condition: 'normal', canEscape: false };
  return setupForNextLink(first, cloisterTremaGroup, b.engine.state() as BattleState, 2);
}

const withAnswer = (answer: 'restore' | 'chapter-start' | 'carry'): EnemyGroupDef => {
  const { hopelessRetry: _shipped, ...plain } = cloisterTremaGroup;
  return { ...plain, ...tremaHopelessRetry(answer) };
};

describe('what is shipped (PR-0407)', () => {
  it("Trema's link restores a Retry that opens with fewer than two girls standing, and says so in one place", () => {
    expect(TREMA_HOPELESS_RETRY).toBe('restore');
    expect(HOPELESS_BELOW).toBe(2);
    expect(cloisterTremaGroup.hopelessRetry).toEqual({ standing: 2, answer: 'restore' });
    expect(cloisterTremaGroup.checkpointOnEntry).toBe(true); // TR5 = b is still the checkpoint
    expect(cloisterTremaGroup.restoresPartyOnEntry).toBeUndefined(); // the first entry restores nothing (research §1.1)
    expect(FFX2_GROUPS[CLOISTER_TREMA]).toBe(cloisterTremaGroup);
  });

  it('no other formation, in either game, names the rule: every other chain retries exactly as it did', () => {
    const named = [...Object.values(FFX_GROUPS), ...Object.values(FFX2_GROUPS)].filter((g) => g.hopelessRetry !== undefined);
    // Trema's link, and the one FFX user: the hidden Sinspawn Gui chapter's second fight (a hopeless retry restores the guest hour's three; FFX only, `ffx-gui-chain.test.ts`).
    expect(named.map((g) => g.id).sort()).toEqual([CLOISTER_TREMA, 'sinspawn-gui-2'].sort());
  });

  it("'carry' is the absence of the rule", () => {
    expect(tremaHopelessRetry('carry')).toEqual({});
    expect(withAnswer('carry').hopelessRetry).toBeUndefined();
  });
});

describe('standingIn and hopelessAt', () => {
  it('counts the girls with HP above 0 and no KO; a member with no hp is at full', () => {
    expect(standingIn(seamAfterParagon([]))).toBe(3);
    expect(standingIn(seamAfterParagon(['rikku']))).toBe(2);
    expect(standingIn(seamAfterParagon(['yuna', 'rikku']))).toBe(1);
    expect(standingIn(seamAfterParagon(['yuna', 'rikku', 'paine']))).toBe(0);
    expect(standingIn({ ...seamAfterParagon([]), party: viaInfinitoBuild })).toBe(3); // the preset's own members carry no hp
  });

  it('is hopeless below the rule, and only for a formation that names one', () => {
    const one = seamAfterParagon(['yuna', 'rikku']);
    const two = seamAfterParagon(['rikku']);
    expect(hopelessAt(withAnswer('restore'), one)).toBe(true);
    expect(hopelessAt(withAnswer('restore'), two)).toBe(false);
    expect(hopelessAt(withAnswer('carry'), one)).toBe(false);
    expect(hopelessAt(roadSistersGroup, one)).toBe(false); // Ch XI's Save Sphere link names no rule
  });
});

describe('checkpointAt and resumeSetup', () => {
  it("'restore': the checkpoint is kept and the Retry opens with the Save Sphere's rule, only when fewer than two stand", () => {
    const g = withAnswer('restore');
    const one = seamAfterParagon(['yuna', 'rikku'], { paine: 3000 });
    const cp = checkpointAt(2, g, one)!;
    expect(cp.link).toBe(2);
    const retry = resumeSetup(cp, 41);
    expect(retry.seed).toBe(42);
    expect(retry.enemies.restoresPartyOnEntry).toBe(true);
    expect(cp.setup.enemies.restoresPartyOnEntry).toBeUndefined(); // the saved setup and the formation are never changed
    expect(g.restoresPartyOnEntry).toBeUndefined();
    expect(resumeSetup(cp, 41).enemies.restoresPartyOnEntry).toBe(true); // judged again on the carried state, every retry

    const two = seamAfterParagon(['rikku']);
    const same = resumeSetup(checkpointAt(2, g, two)!, 41);
    expect(same.enemies.restoresPartyOnEntry).toBeUndefined();
    expect(same.party).toBe(two.party); // TR5 b as adopted: replayed exactly as entered
  });

  it("'chapter-start': a hopeless entry makes no checkpoint, so a loss retries from the first formation", () => {
    const g = withAnswer('chapter-start');
    expect(checkpointAt(2, g, seamAfterParagon(['yuna', 'rikku']))).toBeNull();
    expect(checkpointAt(2, g, seamAfterParagon(['rikku']))?.link).toBe(2);
    expect(checkpointAt(2, g, seamAfterParagon([]))?.link).toBe(2);
  });

  it("'carry': the Retry replays the carried state however few stand (what shipped before PR-0407)", () => {
    const g = withAnswer('carry');
    const one = seamAfterParagon(['yuna', 'rikku']);
    const cp = checkpointAt(2, g, one)!;
    expect(resumeSetup(cp, 5)).toEqual({ ...one, seed: 6 });
  });

  it('link 1 is never a checkpoint, with or without the rule', () => {
    expect(checkpointAt(1, withAnswer('restore'), seamAfterParagon(['yuna', 'rikku']))).toBeNull();
  });
});

describe('the engine opens the restored Retry', () => {
  it('one girl standing: the first entry opens as carried, the Retry opens with all three up at full HP and MP, statuses kept', () => {
    const g = withAnswer('restore');
    const seam = seamAfterParagon(['yuna', 'rikku'], { paine: 3000 });
    const first = newEngine();
    first.setSeed(seam.seed);
    first.init(seam);
    let c = first.state().combatants;
    expect([c['yuna']!.alive, c['rikku']!.alive, c['paine']!.alive]).toEqual([false, false, true]);
    expect(c['paine']!.hp).toBe(3000);

    const retry = resumeSetup(checkpointAt(2, g, seam)!, 1);
    const again = newEngine();
    again.setSeed(retry.seed);
    again.init(retry);
    c = again.state().combatants;
    for (const id of ['yuna', 'rikku', 'paine']) {
      expect(c[id]!.alive).toBe(true);
      expect(c[id]!.hp).toBe(c[id]!.stats.maxHp);
      expect(c[id]!.mp).toBe(c[id]!.stats.maxMp);
      expect(c[id]!.statuses.ko).toBeUndefined();
    }
    expect(c['trema']!.hp).toBe(999999); // Trema is untouched: the rule is about the girls' entry state only
    expect(c['trema']!.mp).toBe(999);
  });

  it('a status the girl carried in is not cured by the restore (the Save Sphere rule leaves statuses as they arrive)', () => {
    const b = board('paragon');
    applyStatus(b.unit('yuna'), { status: 'poison', chance: 255, duration: 0 });
    for (const id of ['yuna', 'rikku']) {
      const u = b.unit(id);
      if (id === 'rikku') { u.hp = 0; u.alive = false; applyStatus(u, { status: 'ko', chance: 255, duration: 0 }); }
    }
    b.unit('paine').hp = 0;
    b.unit('paine').alive = false;
    applyStatus(b.unit('paine'), { status: 'ko', chance: 255, duration: 0 });
    const first: BattleSetup = { game: 'ffx2', party: viaInfinitoBuild, enemies: group(CLOISTER_PARAGON), triggers: [], seed: 1, condition: 'normal', canEscape: false };
    const seam = setupForNextLink(first, cloisterTremaGroup, b.engine.state() as BattleState, 2);
    expect(standingIn(seam)).toBe(1);
    const retry = resumeSetup(checkpointAt(2, withAnswer('restore'), seam)!, 1);
    const e = newEngine();
    e.setSeed(retry.seed);
    e.init(retry);
    expect(e.state().combatants['yuna']!.statuses.poison).toBeDefined();
    expect(e.state().combatants['yuna']!.hp).toBe(e.state().combatants['yuna']!.stats.maxHp);
  });
});

describe('the chapters the brief asked about (Ch XV Den of Woe, Ch XVII Sin) do not have the pattern', () => {
  it('Ch XV Den of Woe: GP4 is off, so Gippal and Nooj make no checkpoint and a loss retries from Baralai', () => {
    const entry = seamAfterParagon(['yuna', 'rikku']); // the worst state a seam can hand over; the group, not the state, decides
    for (const id of [DEN_BARALAI, DEN_GIPPAL, DEN_NOOJ]) {
      const g = FFX2_GROUPS[id]!;
      expect(g.checkpointOnEntry, id).toBeUndefined();
      expect(g.hopelessRetry, id).toBeUndefined();
      expect(checkpointAt(id === DEN_NOOJ ? 3 : 2, g, entry), id).toBeNull();
    }
  });

  it('Ch XVII Sin: link 3 is a checkpoint (D-284) but every chain reaches it with all seven on their feet, so no state is hopeless', () => {
    expect(sinGenaisCoreGroup.checkpointOnEntry).toBe(true);
    expect(sinGenaisCoreGroup.hopelessRetry).toBeUndefined();
    // Measured, 200 seeds of the sensible line (docs/handoff/r392-trema.md): 200 of 200 reach link 3 with 7 of 7 standing.
    for (const seed of [1, 2, 3]) {
      const r = runChain(makeSensible(), { seed });
      expect(standingIn(r.link3Entry!), `seed ${seed}`).toBe(7);
    }
  });
});

describe("the pause menu's RESTART ENCOUNTER takes the same road", () => {
  it('an aborted run past the Trema checkpoint is resumed by the restart, and its setup is the restored one', () => {
    const flow = {};
    const seam = seamAfterParagon(['yuna', 'rikku'], { paine: 3000 });
    const cp = checkpointAt(2, cloisterTremaGroup, seam)!;
    const run = { carry: { resumeAt: null, carriedMs: 0 }, attempt: 0, opts: { seed: 7 } };
    closeRun(flow, 'ffx2-trema', run, { checkpoint: cp, elapsedMs: 1000 }, { outcome: 'aborted' });
    const started = openRun(flow, 'ffx2-trema', { skipPrep: true, skipCutscenes: true, restart: true });
    expect(started.carry.resumeAt?.link).toBe(2);
    const retry = resumeSetup(started.carry.resumeAt!, started.opts.seed);
    expect(retry.enemies.restoresPartyOnEntry).toBe(true);
    expect(started.carry.carriedMs).toBe(1000);
  });
});
