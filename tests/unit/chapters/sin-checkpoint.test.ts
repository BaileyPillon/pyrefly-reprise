/**
 * **Chapter XVII's link-3 checkpoint, an OFF switch** (`SIN_LINK3_CHECKPOINT`, 2026-09-29). **FFX only.**
 *
 * An adaptation offered to Bailey, in D-217's shape (Chapter V's Shuyin): on, a loss at link 3 (Genais and the
 * Core) retries at link 3 on the party state captured on entering it. Off (as shipped), the formation carries no
 * checkpoint and a retry starts the chapter over at the Left Fin, as before. The measurement is
 * `docs/plans/sin-fins-core-bench.md` "Link 3, rested against carried".
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { checkpointAt, resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { SIN_LINK3_CHECKPOINT, sinGenaisCoreGroup, sinLink3Checkpoint } from '../../../src/data/ffx/enemies/sin-genais-core.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { runChain, runWithRetries } from '../helpers/sinFinsBench.ts';
import { makeSensible } from '../helpers/sinFinsPolicies.ts';

/** The setup link 3 is entered on after the sensible line wins links 1 and 2 on `seed`. */
function carriedEntry(seed: number): BattleSetup {
  const r = runChain(makeSensible(), { seed });
  expect(r.link3Entry, `seed ${seed} reaches link 3`).toBeTruthy();
  return r.link3Entry!;
}

describe('the link-3 checkpoint switch (an adaptation, OFF as shipped)', () => {
  it('ships off: link 3 makes no checkpoint, and neither Fin link ever does', () => {
    expect(SIN_LINK3_CHECKPOINT).toBe(false);
    expect(sinGenaisCoreGroup.checkpointOnEntry).not.toBe(true);
    const entry = carriedEntry(1);
    expect(checkpointAt(3, sinGenaisCoreGroup, entry)).toBeNull();
    for (const [n, id] of [[1, 'sin-left-fin'], [2, 'sin-right-fin']] as const) {
      expect(ENEMY_GROUPS_BY_ID[id]?.checkpointOnEntry, id).not.toBe(true);
      expect(checkpointAt(n, ENEMY_GROUPS_BY_ID[id]!, entry), id).toBeNull();
    }
  });

  it('on: link 3 is the checkpoint, and a retry replays the party state it was entered on', () => {
    const on = { ...sinGenaisCoreGroup, ...sinLink3Checkpoint(true) };
    const entry = carriedEntry(2);
    const cp = checkpointAt(3, on, entry);
    expect(cp).toMatchObject({ link: 3 });
    const retry = resumeSetup(cp!, 500);
    expect(retry.seed).toBe(502);
    const party = retry.party as FFXPartyBuild;
    const was = entry.party as FFXPartyBuild;
    // HP, MP, gauges, statuses and the bag exactly as carried in (items spent in links 1 and 2 stay spent).
    expect(party.members.map((m) => [m.id, m.hp, m.mp, m.overdrive.gauge, Object.keys(m.statuses ?? {}).sort()])).toEqual(
      was.members.map((m) => [m.id, m.hp, m.mp, m.overdrive.gauge, Object.keys(m.statuses ?? {}).sort()]),
    );
    expect(party.inventory).toEqual(was.inventory);
    expect(retry.enemies.id).toBe('sin-genais-core');
  });

  it('the bench retries at link 3 with the switch on, and from the Left Fin with it off', () => {
    // The first seed whose first attempt loses link 3 (the carried-state gap makes one near).
    let seed = 1;
    while (runChain(makeSensible(), { seed }).outcome === 'victory') seed++;
    const off = runWithRetries(() => makeSensible(), {}, seed, 2, false);
    const on = runWithRetries(() => makeSensible(), {}, seed, 2, true);
    expect(off.attempts[0]).toMatchObject({ from: 1, endedOn: 3 });
    expect(off.attempts[0]!.outcome).not.toBe('victory');
    expect(on.attempts[0]).toEqual(off.attempts[0]);
    expect(off.attempts[1]?.from).toBe(1);
    expect(on.attempts[1]?.from).toBe(3);
  });
});
