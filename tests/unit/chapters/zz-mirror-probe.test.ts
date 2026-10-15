import { describe, it } from 'vitest';
import type { BattleEngine, BattleEvent, Command } from '../../../src/battle/common/types.ts';
import { mirrorAeons } from '../../../src/engine/tactics/mirror-aeons.ts';
import * as H from '../helpers/mirrorAeonsDrive.ts';

const summarize = (events: readonly BattleEvent[]): string => {
  const bySource = new Map<string, { n: number; sum: number; max: number }>();
  for (const e of events) {
    if (e.type !== 'damage' || e.amount <= 0) continue;
    const key = `${e.sourceId ?? '?'}->${e.targetId.startsWith('dark') ? 'dark' : 'party'}`;
    const s = bySource.get(key) ?? { n: 0, sum: 0, max: 0 };
    s.n++; s.sum += e.amount; s.max = Math.max(s.max, e.amount);
    bySource.set(key, s);
  }
  return [...bySource.entries()].map(([k, v]) => `${k}: n=${v.n} avg=${Math.round(v.sum / v.n)} max=${v.max}`).join('\n');
};

describe('probe', () => {
  it('plays act I with advisor', () => {
    const advisor = (d: H.Input, e: BattleEngine): Command | null => mirrorAeons(d.actorId, d.commands, e);
    const r = H.playOne(1, H.ACT_I_GROUP, advisor);
    console.log(r.outcome, r.inputs, r.turns);
    console.log(summarize(r.events));
    const summons = r.events.filter((e) => e.type === 'summon').length;
    console.log('summons', summons, 'kos', r.events.filter((e) => e.type === 'ko').map((e) => (e as { targetId: string }).targetId).join(','));
  });
  it('plays act II with advisor', () => {
    const advisor = (d: H.Input, e: BattleEngine): Command | null => mirrorAeons(d.actorId, d.commands, e);
    const r = H.playOne(1, H.ACT_II_GROUP, advisor);
    console.log('ACT II', r.outcome, r.inputs, r.turns);
    console.log(summarize(r.events));
  });
});
