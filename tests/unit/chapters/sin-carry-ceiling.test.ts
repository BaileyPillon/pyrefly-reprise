/**
 * **Sin's status carry: the pool ceiling across two seams** (CHECK 3 finding C3-1; FFX only, the carry is
 * shared FFX plumbing that only Sin's `carriesPartyState` links reach).
 *
 * A Stamina or Mana Tonic drunk in link 1 doubles the pool, and the carry keeps the doubled ceiling while the
 * status is on (`sin-carry.test.ts`). When the status comes off in link 2 (a KO clears it), the engine halves the
 * live ceiling back to the base; the seam into link 3 used to take the ceiling from link 2's build, which was
 * already doubled, so link 3 opened at double the base with no status (Auron 12,984 against 6,492). The ceiling
 * without the status is now the live one.
 *
 * Run on the real engine: the Tonic is a submitted command, the seams are `BattleScreenSetup.setupForNextLink`,
 * the KO is the engine's own KO wipe, and each next link is initialised by the engine.
 *
 * **Re-parity W2 (FFX only):** the doubled pool is the game's `pp_BtlApplyDoubleHpMp`, capped at 9,999 HP and 999 MP without Break HP
 * and Break MP Limit (Auron's build wears neither), so "doubled" below is `min(2 * base, cap)`: Auron's 6,492 HP double to 9,999,
 * not 12,984. A capped ceiling cannot be halved back to the base it came from, so the seam carries the BASE maxima with the status
 * and the next link's engine rebuilds the doubled ones, as the game's party-stats builder does at battle start.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEngine, BattleSetup, BattleState, Command, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine, koActor } from '../../../src/battle/ffx/index.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

function engineOn(setup: BattleSetup): BattleEngine {
  const e = createFFXEngine({ content, autoResolveMinigames: true });
  e.init(setup);
  return e;
}

const live = (e: BattleEngine, id: string): FFXCombatant => e.state().combatants[id] as FFXCombatant;

type Pool = 'max-hp-x2' | 'max-mp-x2';

/** Drink `itemId` (a Tonic, `all-allies`) by a real submitted command until Auron carries `status`; the rest Defend. */
function drinkUntil(e: BattleEngine, itemId: string, status: Pool): void {
  for (let i = 0; i < 400 && live(e, 'auron').statuses[status] === undefined; i++) {
    const d = e.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    const item = d.commands.find((c) => c.enabled && c.command.kind === 'item' && 'id' in c.command && c.command.id === itemId);
    e.submit(item && item.validTargets.includes('auron') ? ({ ...item.command, targets: ['auron'] } as Command) : { kind: 'defend', targets: [] });
  }
}

/** The cap of a doubled pool without Break HP / Break MP Limit (`pp_BtlApplyDoubleHpMp`). */
const HP_CAP = 9_999;
const MP_CAP = 999;
const doubled = (base: number, cap: number): number => Math.min(base * 2, cap);

/**
 * Auron is KO'd in link 2 through the engine's own KO (`hp.ts#koActor`, whose wipe puts a doubled pool back to the base the runtime
 * stored when the Tonic first took effect, `statuses.ts#applyPoolFlags`). A real hit is not practical: under Defend the Right Fin never
 * reaches him in 400 turns (the link ends on its liveness escape), and his allies have no command that targets him for damage.
 */
function koAuron(e: BattleEngine): void {
  const ctx = (e as unknown as { ctx: Ctx }).ctx;
  koActor(ctx, ctx.state.combatants['auron'] as FFXCombatant);
}

/** Links 1 -> 2 -> 3 of Chapter XVII with a Tonic drunk in link 1; `lose` KOs Auron at the end of link 2. */
function tonicAcrossTwoSeams(itemId: string, status: Pool, lose: boolean): { base: FFXCombatant['stats']; build3: FFXPartyBuild; e3: BattleEngine } {
  const opened = setupForChapter(getChapter('sin-fins-core')!, 1);
  const party = opened.party as FFXPartyBuild;
  // The Mana Tonic is not in the chapter's bag: the test adds one, and the engine applies it for real.
  const inventory = party.inventory.some((row) => row.itemId === itemId) ? party.inventory : [...party.inventory, { itemId, count: 1 }];
  const first: BattleSetup = { ...opened, party: { ...party, inventory } };
  const e1 = engineOn(first);
  const base = { ...live(e1, 'auron').stats };
  drinkUntil(e1, itemId, status);
  expect(live(e1, 'auron').statuses[status]).toBeDefined();

  const second = setupForNextLink(first, ENEMY_GROUPS_BY_ID['sin-right-fin']!, e1.state() as BattleState, 2);
  const e2 = engineOn(second);
  expect(live(e2, 'auron').statuses[status]).toBeDefined();
  if (lose) {
    koAuron(e2);
    const auron = live(e2, 'auron');
    expect(auron.statuses[status]).toBeUndefined();
    expect([auron.stats.maxHp, auron.stats.maxMp]).toEqual([base.maxHp, base.maxMp]);
  }
  const end2 = structuredClone(e2.state()) as BattleState;
  const third = setupForNextLink(second, ENEMY_GROUPS_BY_ID['sin-genais-core']!, end2, 3);
  return { base, build3: third.party as FFXPartyBuild, e3: engineOn(third) };
}

describe("Sin, C3-1: without its Tonic a member's ceiling at a seam is the live one, never the previous link's doubled build", () => {
  it('a Stamina Tonic kept across both seams opens link 3 doubled, with its status', () => {
    const { base, e3 } = tonicAcrossTwoSeams('stamina-tonic', 'max-hp-x2', false);
    expect(live(e3, 'auron').statuses['max-hp-x2']).toBeDefined();
    expect(live(e3, 'auron').stats.maxHp).toBe(doubled(base.maxHp, HP_CAP));
  });

  it('a Stamina Tonic lost in link 2 (a KO) opens link 3 at the base max HP, not the doubled one', () => {
    const { base, build3, e3 } = tonicAcrossTwoSeams('stamina-tonic', 'max-hp-x2', true);
    expect(build3.members.find((m) => m.id === 'auron')!.stats.maxHp).toBe(base.maxHp);
    expect(live(e3, 'auron').statuses['max-hp-x2']).toBeUndefined();
    expect(live(e3, 'auron').stats.maxHp).toBe(base.maxHp);
  });

  it('a Mana Tonic kept across both seams opens link 3 doubled, with its status', () => {
    const { base, e3 } = tonicAcrossTwoSeams('mana-tonic', 'max-mp-x2', false);
    expect(live(e3, 'auron').statuses['max-mp-x2']).toBeDefined();
    expect(live(e3, 'auron').stats.maxMp).toBe(doubled(base.maxMp, MP_CAP));
  });

  it('a Stamina Tonic kept across both seams and lost in link 3 (a KO) puts back the base it doubled, not half of the capped ceiling', () => {
    // Re-parity W2: Auron's 6,492 double to the cap of 9,999, which is no longer twice anything; the base travels with the status.
    const { base, e3 } = tonicAcrossTwoSeams('stamina-tonic', 'max-hp-x2', false);
    expect(live(e3, 'auron').stats.maxHp).toBe(doubled(base.maxHp, HP_CAP));
    koAuron(e3);
    expect(live(e3, 'auron').statuses['max-hp-x2']).toBeUndefined();
    expect(live(e3, 'auron').stats.maxHp).toBe(base.maxHp);
  });

  it('a Mana Tonic kept across both seams and lost in link 3 (a KO) puts back the base max MP', () => {
    const { base, e3 } = tonicAcrossTwoSeams('mana-tonic', 'max-mp-x2', false);
    koAuron(e3);
    expect(live(e3, 'auron').statuses['max-mp-x2']).toBeUndefined();
    expect(live(e3, 'auron').stats.maxMp).toBe(base.maxMp);
  });

  it('a Mana Tonic lost in link 2 (a KO) opens link 3 at the base max MP, not the doubled one', () => {
    const { base, build3, e3 } = tonicAcrossTwoSeams('mana-tonic', 'max-mp-x2', true);
    expect(build3.members.find((m) => m.id === 'auron')!.stats.maxMp).toBe(base.maxMp);
    expect(live(e3, 'auron').statuses['max-mp-x2']).toBeUndefined();
    expect(live(e3, 'auron').stats.maxMp).toBe(base.maxMp);
  });
});
