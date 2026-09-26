/**
 * **IC-2 and IC-1 (independent check of Chapter XV, 2026-09-26). FFX-2 only** (AGENTS.md rule 14:
 * the FFX engine resolves its own actions and is not touched).
 *
 * IC-2, sourced (`research/ffx2-combat-core.md` §9.1, `[verified: 3 sources]`): an all-target move
 * is defined per character ("damage all characters", "VS all chrs", "to the party"), so each target
 * taken at the start of the action gets its own hits, once. A target KO'd partway takes nothing
 * more and its hits are **not** moved onto someone already hit (the mid-move death case itself is
 * unsourced; skipping is the reading every source's per-target definition gives). Random-target
 * moves keep their per-strike roll among whoever is standing (`[verified: 3 sources]`).
 *
 * IC-1, unsourced (§9.2): whether an immune or Invincible hit opens or extends a chain. The engine
 * keeps its behaviour (it registers); the alternative is built as the named OFF switch
 * `immuneHitsSkipChain` and measured (`docs/plans/ffx2-engine-fixes-2026-09-26.md`).
 *
 * Acta Est Fabula (found by the IC-2 measurement): its sourced target is "both Redoubts"
 * (`research/ffx2-vegnagun-shuyin.md` §3.4); as `all-allies` it also healed the Head for 9,999 a cast.
 * The wrap had hidden that (a Redoubt dying mid-Black-Sky sent its strikes to the Head). Built as the
 * switch `NAMED_TARGETS_ONLY` (on in this branch, Bailey's call before merge).
 *
 * Every claim is run through the real resolver, not grepped (hard rule 3).
 */

import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { abilityRegistryFrom } from '../../src/battle/ffx2/index.ts';
import { resolveAbility, type ResolveContext } from '../../src/battle/ffx2/resolve.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import type { EventDraft, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { IMMUNE_HITS_SKIP_CHAIN, NAMED_TARGETS_ONLY } from '../../src/battle/ffx2/constants.ts';
import { defaultAbilities } from '../../src/battle/ffx2/abilities.ts';
import * as data from '../../src/data/ffx2/index.ts';

const REGISTRY = abilityRegistryFrom(Object.values(data.ABILITIES));
const ability = (id: string) => {
  const a = REGISTRY.get(id);
  if (!a) throw new Error(`${id} missing`);
  return a;
};

function ctxFor(units: Ffx2Unit[], extra: Partial<ResolveContext> = {}): { ctx: ResolveContext; events: EventDraft[] } {
  const events: EventDraft[] = [];
  return {
    ctx: { units, abilities: REGISTRY, rng: new SeededRng(3), emit: (e) => events.push(e), breaksDamageLimit: () => false, ...extra },
    events,
  };
}

/** Three foes; the middle one dies to the first hit it takes. */
function field(side: 'party' | 'enemy'): { user: Ffx2Unit; foes: Ffx2Unit[] } {
  const userSide = side === 'party' ? 'enemy' : 'party';
  const user = aiUnit('caster', userSide, 50000, 0);
  const foes = ['a', 'b', 'c'].map((id, i) => aiUnit(id, side, 50000, i));
  foes[1]!.hp = 1;
  return { user, foes };
}

const hitsOn = (events: EventDraft[], id: string) =>
  events.filter((e) => e.type === 'damage' && (e as { targetId: string }).targetId === id).length;

describe('IC-2: an all-target move hits each target taken at its start, once per strike (§9.1)', () => {
  it('a boss\'s party-wide move: the girl KO\'d mid-move is skipped, nobody is hit twice, the last girl is hit', () => {
    const { user, foes } = field('party');
    const { ctx, events } = ctxFor([user, ...foes]);
    resolveAbility(ctx, user, ability('x2-shared-ultima'), []);
    expect(events.some((e) => e.type === 'miss')).toBe(false);
    expect(foes[1]!.alive).toBe(false);
    expect(foes.map((f) => hitsOn(events, f.id))).toEqual([1, 1, 1]);
  });

  it('the same from the party\'s side: an all-enemies spell with the middle foe dying', () => {
    const { user, foes } = field('enemy');
    const { ctx, events } = ctxFor([user, ...foes]);
    resolveAbility(ctx, user, ability('x2-shared-ultima'), []);
    expect(foes.map((f) => hitsOn(events, f.id))).toEqual([1, 1, 1]);
  });

  it('a two-strike all-target move (Sword Dance, 2 a foe): the dead foe\'s second strike is skipped, not redirected', () => {
    const { user, foes } = field('enemy');
    user.stats.acc = 255; // a physical move rolls; this caster cannot miss, so every strike is a hit
    const { ctx, events } = ctxFor([user, ...foes]);
    resolveAbility(ctx, user, ability('x2-full-throttle-sword-dance'), []);
    expect(events.some((e) => e.type === 'miss')).toBe(false);
    expect(foes.map((f) => hitsOn(events, f.id))).toEqual([2, 1, 2]);
  });

  it('a target dead before the move starts is not in it, and its share is not handed to anyone', () => {
    const { user, foes } = field('party');
    foes[1]!.hp = 0;
    foes[1]!.alive = false;
    const { ctx, events } = ctxFor([user, ...foes]);
    resolveAbility(ctx, user, ability('x2-shared-ultima'), []);
    expect(foes.map((f) => hitsOn(events, f.id))).toEqual([1, 0, 1]);
  });

  it('a random-target multi-hit move still rolls each strike among whoever stands (all 3 on a lone foe)', () => {
    const { user, foes } = field('enemy');
    foes[0]!.hp = 0;
    foes[0]!.alive = false;
    foes[1]!.hp = 0;
    foes[1]!.alive = false;
    const { ctx, events } = ctxFor([user, ...foes]);
    resolveAbility(ctx, user, ability('x2-floral-fallal-heat-whirl'), []);
    expect(hitsOn(events, 'c') + events.filter((e) => e.type === 'miss').length).toBe(3);
  });
});

describe('IC-1: an immune hit and the chain (unsourced, §9.2): built as an OFF switch', () => {
  function invincibleGirl(): { user: Ffx2Unit; girl: Ffx2Unit } {
    const user = aiUnit('nooj', 'enemy', 50000, 0);
    const girl = aiUnit('yuna', 'party', 50000, 0); // survives the damaging hit, so its window stays open
    girl.statuses['invincible'] = { turns: -1 } as never;
    return { user, girl };
  }

  it('the switch ships OFF: the engine keeps registering an immune hit', () => {
    expect(IMMUNE_HITS_SKIP_CHAIN).toBe(false);
    const { user, girl } = invincibleGirl();
    const { ctx, events } = ctxFor([user, girl]);
    resolveAbility(ctx, user, ability('x2-shared-ultima'), []);
    expect(events.some((e) => e.type === 'miss' && (e as { reason?: string }).reason === 'immune')).toBe(true);
    expect(events.some((e) => e.type === 'chain')).toBe(true);
    expect(girl.chainWindowTicks).toBeGreaterThan(0);
  });

  it('switched on: an immune hit opens no window and emits no chain; a damaging hit still does', () => {
    const { user, girl } = invincibleGirl();
    const { ctx, events } = ctxFor([user, girl], { immuneHitsSkipChain: true });
    resolveAbility(ctx, user, ability('x2-shared-ultima'), []);
    expect(events.some((e) => e.type === 'miss' && (e as { reason?: string }).reason === 'immune')).toBe(true);
    expect(events.some((e) => e.type === 'chain')).toBe(false);
    expect(girl.chainWindowTicks).toBe(0);

    delete girl.statuses['invincible'];
    const second = ctxFor([user, girl], { immuneHitsSkipChain: true });
    resolveAbility(second.ctx, user, ability('x2-shared-ultima'), []);
    expect(second.events.some((e) => e.type === 'damage')).toBe(true);
    expect(second.events.some((e) => e.type === 'chain')).toBe(true);
    expect(girl.chainWindowTicks).toBeGreaterThan(0);
  });

  it('switched on, a hit landing inside an open window still counts up the chain (the peek matches registerHit)', () => {
    const user = aiUnit('nooj', 'enemy', 50000, 0);
    const girl = aiUnit('yuna', 'party', 50000, 0);
    const a = ctxFor([user, girl], { immuneHitsSkipChain: true });
    resolveAbility(a.ctx, user, ability('x2-shared-ultima'), []);
    const b = ctxFor([user, girl], { immuneHitsSkipChain: true });
    resolveAbility(b.ctx, user, ability('x2-shared-ultima'), []);
    const chain = b.events.find((e) => e.type === 'chain') as { count: number } | undefined;
    expect(chain?.count).toBe(1);
    expect(girl.chainCount).toBe(1);
  });
});

describe('Acta Est Fabula hits the Redoubts it names, not the Head (§3.4, NAMED_TARGETS_ONLY)', () => {
  function headField(): { head: Ffx2Unit; r: Ffx2Unit; l: Ffx2Unit; units: Ffx2Unit[] } {
    const head = aiUnit('vegnagun-head', 'enemy', 38420, 0);
    head.hp = 10000;
    const r = aiUnit('redoubt-r', 'enemy', 2500, 1);
    const l = aiUnit('redoubt-l', 'enemy', 2500, 2);
    for (const pod of [r, l]) { pod.hp = 0; pod.alive = false; }
    const girl = aiUnit('yuna', 'party', 5000, 0);
    return { head, r, l, units: [head, r, l, girl] };
  }
  const acta = defaultAbilities.get('acta-est-fabula')!;

  it('the row carries the key and the switch is on in this branch', () => {
    expect(acta.targeting).toBe('all-allies');
    expect(acta.extra?.['namedTargetsOnly']).toBe(true);
    expect(NAMED_TARGETS_ONLY).toBe(true);
  });

  it('on: both Redoubts stand up at full HP and the Head keeps its 10,000', () => {
    const { head, r, l, units } = headField();
    const { ctx } = ctxFor(units);
    resolveAbility(ctx, head, acta, [r.id, l.id]);
    expect([r.alive, l.alive]).toEqual([true, true]);
    expect(Math.min(r.hp, l.hp)).toBeGreaterThan(2000); // the whole bar, give or take the randomiser
    expect(head.hp).toBe(10000);
  });

  it('off (the old target set): the Head heals itself 9,999 as well', () => {
    const { head, r, l, units } = headField();
    const { ctx } = ctxFor(units, { namedTargetsOnly: false });
    resolveAbility(ctx, head, acta, [r.id, l.id]);
    expect([r.alive, l.alive]).toEqual([true, true]);
    expect(head.hp).toBe(10000 + 9999);
  });
});
