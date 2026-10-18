/**
 * **A landed Zanmato of the player's Yojimbo ends a possession link at once** (the hidden Last Summoning; **FFX only**; the RE lane FFX-K's engine at its final tip: `docs/handoff/re-parity-ffx-yojimbo-sisters.md` section 10).
 *
 * The game's Zanmato kills every legal foe of the one group it picks, and every foe here is group 0: the possessed twin and both Yu Pagodas. This file runs it on the chapter's real first link and pins what the chapter
 * relies on and what a presenter sees: the foes all fall, the battle is won, and the events come in the order `ko` for each foe, `action-end`, the story's `script-trigger`, then `victory` (the order the release driver gave, with the
 * trigger's place seen on the real engine; checked below, not assumed).
 *
 * The odds are the engine's and are not tuned: with Yojimbo's gauge full (a Grand Summon fills it) and Dream's End's compatibility, a payment of 10,000 gil makes 15 draws of 64 a Zanmato at a Zanmato byte of 4
 * (`research/re-ffx-zanmato-and-orders.md`, handoff section 10.4). The Pagodas count (emulated at battle start: spawn loop sets DC8 for every formation word, selector -15 tests only DC8, DCD and monster slot, getter takes the maximum). After a Pagoda is destroyed it is unproven. L = 4 in every possession link, 5 against Braska (RE review, 2026-10-17). The test walks seeds until one lands and says how many it took.
 *
 * Also pinned: **without a full gauge the same payment cannot be a Zanmato at all** at this compatibility and hire answer, which is why the advisor's line (it calls Yojimbo last and pays without a full gauge) lands none.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleEvent, Decision } from '../../../src/battle/common/types.ts';
import { PAY_ABILITY_ID } from '../../../src/battle/ffx/aeon-commands.ts';
import { buildLastSummoningParty } from '../../../src/data/ffx/builds/last-summoning.ts';
import { firstLinkSetup, newEngine } from '../helpers/lastSummoningDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

function inputFor(engine: BattleEngine, who: string): Input {
  for (let i = 0; i < 600; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') {
      if (d.actorId === who) return d;
      engine.submit({ kind: 'defend', targets: [] });
    } else if (d.kind === 'battle-over') throw new Error('the battle ended');
  }
  throw new Error(`no input for ${who}`);
}

/**
 * The first link (Valefor), Yojimbo summoned, his gauge as given; returns the engine at Yojimbo's own decision, or `null` on a seed where the game's free attack takes his turn for him (with a compatibility of 128 he acts on his
 * own in 32 turns of 256, and his Wakizashi on all can end the link before any menu opens).
 */
async function atYojimbosTurn(seed: number, gauge: number): Promise<{ engine: BattleEngine; turn: Input } | null> {
  const { setup } = await firstLinkSetup(['valefor'], seed);
  const party = buildLastSummoningParty();
  for (const a of party.aeons) if (a.id === 'yojimbo') a.overdriveGauge = gauge;
  const engine = newEngine({ ...setup, party });
  const yuna = inputFor(engine, 'yuna');
  const call = yuna.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.command.id === 'yojimbo')!;
  engine.submit({ ...call.command, targets: [] });
  try {
    return { engine, turn: inputFor(engine, 'yojimbo') };
  } catch (e) {
    if (e instanceof Error && /the battle ended|no input for yojimbo/.test(e.message)) return null; // his own free attacks ended the link, or kept the field without a menu
    throw e;
  }
}

const pay = (turn: Input, gil: number) => {
  const row = turn.commands.find((c) => c.enabled && c.command.kind === 'ability' && c.command.id === PAY_ABILITY_ID)!;
  return { ...row.command, targets: [], gilSpent: gil } as never;
};

describe('a landed Zanmato of the player’s Yojimbo, on the chapter’s first link', () => {
  it('kills the twin and both Pagodas, and the events run ko for each, action-end, the story’s script-trigger, then victory', async () => {
    let landed: { seed: number; events: BattleEvent[] } | undefined;
    for (let seed = 1; seed <= 80 && landed === undefined; seed++) {
      const at = await atYojimbosTurn(seed, 100);
      if (at === null) continue;
      const { engine, turn } = at;
      const before = engine.state().log.length;
      engine.submit(pay(turn, 10_000));
      const events = engine.state().log.slice(before);
      if (events.some((e) => e.type === 'action-start' && e.abilityId === 'zanmato')) landed = { seed, events };
    }
    expect(landed, 'a Zanmato landed within 80 seeds (15 in 64 each)').toBeDefined();
    const ev = landed!.events;
    const start = ev.findIndex((e) => e.type === 'action-start' && e.abilityId === 'zanmato');
    const kos = ev.slice(start).filter((e) => e.type === 'ko');
    expect(new Set(kos.map((e) => (e as { targetId?: string }).targetId))).toEqual(new Set(['possessed-valefor', 'yu-pagoda-left', 'yu-pagoda-right']));
    const lastKo = ev.map((e, i) => (e.type === 'ko' ? i : -1)).reduce((m, i) => Math.max(m, i), -1);
    const actionEnd = ev.findIndex((e, i) => i > lastKo && e.type === 'action-end');
    const victory = ev.findIndex((e) => e.type === 'victory');
    // the order the release driver gave: the last ko, the action's end, then the victory
    expect(lastKo).toBeGreaterThan(start);
    expect(actionEnd).toBeGreaterThan(lastKo);
    expect(victory, 'victory is announced').toBeGreaterThanOrEqual(0);
    expect(victory).toBeGreaterThan(actionEnd);
    // the story's trigger (the fall line of the possessed aeon) runs after the action ends and before the victory is announced: one trigger, in that place
    const triggers = ev.map((e, i) => (e.type === 'script-trigger' ? i : -1)).filter((i) => i >= 0);
    expect(triggers, 'one script-trigger after the Pay').toHaveLength(1);
    expect(triggers[0]).toBeGreaterThan(actionEnd);
    expect(triggers[0]).toBeLessThan(victory);
    console.log(`first Zanmato at seed ${landed!.seed}; events after the Pay: ${ev.slice(start).map((e) => e.type).join(' ')}`);
  }, 120_000);

  it('cannot come from a payment without a full gauge at this compatibility and hire answer (RE: none below 131,072 gil)', async () => {
    for (let seed = 1; seed <= 40; seed++) {
      const at = await atYojimbosTurn(seed, 0);
      if (at === null) continue;
      const { engine, turn } = at;
      const before = engine.state().log.length;
      engine.submit(pay(turn, 50_000));
      expect(engine.state().log.slice(before).some((e) => e.type === 'action-start' && e.abilityId === 'zanmato'), `seed ${seed}`).toBe(false);
    }
  }, 120_000);
});
