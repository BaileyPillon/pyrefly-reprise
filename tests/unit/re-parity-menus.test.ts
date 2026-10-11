// @vitest-environment jsdom
/**
 * **The two menu changes of re-parity lane MENUS** (FFX only; Bailey, 2026-10-09: "Yes, match the game"), run against the real
 * engine and the shipped data (AGENTS.md hard rule 3, no greps):
 *
 *  1. **Cid's Trigger Command on the airship offers one order at a time** (`research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section
 *     2.6, row D-08; Evrae and the Fins): Pull back while the ship is NEAR and nothing stands, Close in (the game's "Move in") while
 *     it is FAR and nothing stands, Cancel while an order stands. No second or redundant order; Cancel is the only change of mind.
 *  2. **Braska's Final Aeon's Talk row follows the game** (`research/re-ffx-ai-yunalesca-bfa.md` section 3.6, row B7): greyed while a
 *     Talk waits on his next turn, the third Talk offered (it only speaks), and then spent.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Trigger Commands and the airship's range are FFX; FFX-2 has no counterpart
 * (`research/ffx-evrae-airship.md` section 0.4) and imports none of this.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, Decision, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ABILITIES, ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { COMMAND_RECORDS } from '../../src/data/ffx/command-records/index.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { fahrenheitBuild } from '../../src/data/ffx/builds/fahrenheit.ts';
import { highbridgeBuild } from '../../src/data/ffx/builds/highbridge.ts';
import { sinFinsCoreBuild } from '../../src/data/ffx/builds/sin-fahrenheit.ts';
import { ORDER_CANCEL, ORDER_CLOSE_IN, ORDER_PULL_BACK, orderOnOffer } from '../../src/battle/ffx/ai/evrae-rules.ts';
import { AirshipOrderWidget } from '../../src/ui/ffx/AirshipOrderWidget.ts';
import { airshipMenuRows } from '../../src/ui/ffx/AirshipOrders.ts';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

type Input = Extract<Decision, { kind: 'player-input' }>;

function engineFor(groupId: string, party: FFXPartyBuild, seed = 1): BattleEngine {
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

/** Keep the party standing: the menu rules are under test, not the fight's difficulty. */
function keepStanding(engine: BattleEngine): void {
  const st = engine.state();
  for (const id of [...st.activeIds, ...st.reserveIds]) {
    const c = st.combatants[id];
    if (c) {
      c.stats.maxHp = 99_999;
      c.hp = 99_999;
    }
  }
}

/** Run to `who`'s turn; everyone else defends. */
function decisionFor(engine: BattleEngine, who: string): Input {
  for (let i = 0; i < 400; i++) {
    keepStanding(engine);
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error(`the battle ended before ${who} acted`);
    if (d.kind !== 'player-input') continue;
    if (d.actorId === who) return d;
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error(`${who} never acted`);
}

/** The open decision, asked again after the flags moved: the engine recomputes every row from the live state. */
function reask(engine: BattleEngine): Input {
  const d = engine.nextDecision();
  if (d.kind !== 'player-input') throw new Error('no decision is open');
  return d;
}

const ORDER_IDS: readonly string[] = [ORDER_PULL_BACK, ORDER_CLOSE_IN, ORDER_CANCEL];
const orderRows = (d: Input): AvailableCommand[] => d.commands.filter((c) => c.command.kind === 'trigger' && ORDER_IDS.includes(c.command.id));
const idOf = (c: AvailableCommand): string => (c.command as { id: string }).id;
const enabledOrders = (d: Input): string[] => orderRows(d).filter((c) => c.enabled).map(idOf);
const reasonOf = (d: Input, id: string): string | undefined => orderRows(d).find((c) => idOf(c) === id)?.disabledReason;

/** The four boards of the airship: the range, the order standing (`'far'` is Pull back, `'near'` is Close in), and the one on offer. */
const BOARDS: ReadonlyArray<{ name: string; range: 'near' | 'far'; standing: '' | 'near' | 'far'; on: string }> = [
  { name: 'NEAR, nothing standing', range: 'near', standing: '', on: ORDER_PULL_BACK },
  { name: 'FAR, nothing standing', range: 'far', standing: '', on: ORDER_CLOSE_IN },
  { name: 'NEAR, Pull back standing', range: 'near', standing: 'far', on: ORDER_CANCEL },
  { name: 'FAR, Close in standing', range: 'far', standing: 'near', on: ORDER_CANCEL },
];

function setBoard(engine: BattleEngine, range: string, standing: string): void {
  const flags = engine.state().flags as Record<string, unknown>;
  flags['airship.range'] = range;
  flags['airship.order'] = standing;
}

describe("Cid's Trigger Command offers one order at a time (Evrae)", () => {
  it('orderOnOffer is the one question every surface asks: one of three on an airship board, none elsewhere', () => {
    for (const b of BOARDS) expect(orderOnOffer({ 'airship.range': b.range, 'airship.order': b.standing }), b.name).toBe(b.on);
    expect(orderOnOffer({}), 'no airship battle').toBeNull();
    expect(orderOnOffer({ 'airship.range': 'sideways' }), 'not a range').toBeNull();
    expect(orderOnOffer({ 'airship.range': 'far' }), 'an unset order is none standing').toBe(ORDER_CLOSE_IN);
  });

  it("publishes exactly the one order to Tidus and Rikku on every board, and says why the other two are off the menu", () => {
    const engine = engineFor('evrae-airship', fahrenheitBuild);
    decisionFor(engine, 'tidus');
    for (const b of BOARDS) {
      setBoard(engine, b.range, b.standing);
      const d = reask(engine);
      expect(orderRows(d).map(idOf).sort(), `${b.name}: all three rows exist`).toEqual([ORDER_CANCEL, ORDER_CLOSE_IN, ORDER_PULL_BACK]);
      expect(enabledOrders(d), b.name).toEqual([b.on]);
      if (b.on !== ORDER_PULL_BACK) expect(reasonOf(d, ORDER_PULL_BACK), `${b.name}: Pull back`).toBe(b.standing ? 'Order standing' : 'Already far');
      if (b.on !== ORDER_CLOSE_IN) expect(reasonOf(d, ORDER_CLOSE_IN), `${b.name}: Close in`).toBe(b.standing ? 'Order standing' : 'Already near');
      if (b.on !== ORDER_CANCEL) expect(reasonOf(d, ORDER_CANCEL), `${b.name}: Cancel`).toBe('No order to cancel');
    }
  });

  it('gives Wakka (and everyone who cannot give an order) no order row at all', () => {
    const engine = engineFor('evrae-airship', fahrenheitBuild);
    const d = decisionFor(engine, 'wakka');
    expect(orderRows(d)).toEqual([]);
  });

  it('the cascade folds the engine\'s one row into Orders, and the widget lists exactly that row, on every board', () => {
    const engine = engineFor('evrae-airship', fahrenheitBuild);
    decisionFor(engine, 'rikku');
    const label: Record<string, string> = { [ORDER_PULL_BACK]: 'Pull back', [ORDER_CLOSE_IN]: 'Close in', [ORDER_CANCEL]: 'Cancel' };
    for (const b of BOARDS) {
      setBoard(engine, b.range, b.standing);
      const d = reask(engine);
      const flags = engine.state().flags as Record<string, unknown>;
      const orders = airshipMenuRows(d.commands, flags).find((c) => c.label === 'Orders');
      expect(orders?.enabled, b.name).toBe(true);
      expect(orders?.command, b.name).toEqual({ kind: 'trigger', id: b.on, targets: [] });
      const widget = new AirshipOrderWidget();
      document.body.appendChild(widget.el);
      void widget.open(d.commands, 3);
      expect([...widget.el.querySelectorAll('.ffx-cmd--trigger__label')].map((e) => e.textContent), b.name).toEqual([label[b.on]]);
      expect(widget.el.querySelectorAll('.ig-cmd--disabled'), `${b.name}: nothing greyed`).toHaveLength(0);
      widget.dispose();
      widget.el.remove();
    }
  });

  it('refuses an order that is not on offer, and says so (a forced submission cannot queue a second or a redundant order)', () => {
    const engine = engineFor('evrae-airship', fahrenheitBuild);
    for (const b of BOARDS) {
      for (const id of ORDER_IDS.filter((x) => x !== b.on)) {
        // The board is set and the order submitted with nothing in between, so Cid cannot fly an order first.
        decisionFor(engine, 'tidus');
        setBoard(engine, b.range, b.standing);
        reask(engine);
        const events = engine.submit({ kind: 'trigger', id, targets: [] });
        const flags = engine.state().flags as Record<string, unknown>;
        expect([flags['airship.range'], flags['airship.order']], `${b.name}: ${id} changed the board`).toEqual([b.range, b.standing]);
        expect(events.some((e) => e.type === 'message' && /cannot give that order/.test(e.text)), `${b.name}: ${id}`).toBe(true);
      }
    }
  });

  it("Cancel drops the order: the ship stays, Cid's next turn is his own again, and the order on offer follows the range", () => {
    // FAR with Close in standing: cancelling it leaves the ship FAR, so Cid fires his volley instead of closing in, and Close in is offered again.
    const engine = engineFor('evrae-airship', fahrenheitBuild);
    decisionFor(engine, 'tidus');
    setBoard(engine, 'far', 'near');
    reask(engine);
    engine.submit({ kind: 'trigger', id: ORDER_CANCEL, targets: [] });
    const flags = engine.state().flags as Record<string, unknown>;
    expect(flags['airship.order']).toBe('');
    expect(flags['airship.range']).toBe('far');
    let cid: string | undefined;
    let again: string[] = [];
    for (let i = 0; i < 400 && (cid === undefined || again.length === 0); i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') {
        if (d.actorId === 'tidus' || d.actorId === 'rikku') again = again.length === 0 ? enabledOrders(d) : again;
        engine.submit({ kind: 'defend', targets: [] });
      }
      const fired = engine.state().log.find((e) => e.type === 'action-start' && e.actorId === 'cid');
      if (fired && fired.type === 'action-start') cid = fired.abilityId;
    }
    expect(cid, "Cid's first action after the cancel").toBe('cid-guided-missiles');
    expect(flags['airship.range'], 'still FAR: nothing closed in').toBe('far');
    expect(again, 'the order on offer at FAR with nothing standing').toEqual([ORDER_CLOSE_IN]);
  });

  it('the Fin fights offer the same one order: they open FAR, so Close in', () => {
    const engine = engineFor('sin-left-fin', sinFinsCoreBuild, 2);
    const d = decisionFor(engine, 'tidus');
    expect(enabledOrders(d)).toEqual([ORDER_CLOSE_IN]);
    expect(orderRows(d).filter((c) => !c.enabled).map((c) => c.disabledReason).sort()).toEqual(['Already far', 'No order to cancel']);
  });
});

describe('Cancel as shipped data', () => {
  it("is Cid's third Trigger Command: its label, rank 3, and the game's own record (0x3108, the fields of Talk and Pull back)", () => {
    const cancel = ABILITIES['cancel-order'];
    expect(cancel?.name).toBe('Cancel');
    expect(cancel?.rank).toBe(3);
    expect(cancel?.extra?.['resolvesAsCommandKind']).toBe('trigger');
    expect(COMMAND_RECORDS['cancel-order']).toEqual({ ...COMMAND_RECORDS['pull-back'], id: 0x3108 });
  });

  it('Tidus and Rikku learn it with the other two in Chapter VIII, and no later chapter keeps any of the three', () => {
    for (const id of ['tidus', 'rikku']) {
      const learned = fahrenheitBuild.members.find((m) => m.id === id)!.learnedAbilityIds;
      for (const order of ORDER_IDS) expect(learned, `${id} ${order}`).toContain(order);
    }
    for (const m of fahrenheitBuild.members.filter((x) => x.id !== 'tidus' && x.id !== 'rikku')) {
      for (const order of ORDER_IDS) expect(m.learnedAbilityIds, `${m.id} ${order}`).not.toContain(order);
    }
    for (const m of highbridgeBuild.members) for (const order of ORDER_IDS) expect(m.learnedAbilityIds, `highbridge ${m.id} ${order}`).not.toContain(order);
  });
});

describe("Braska's Final Aeon: the Talk row follows the game", () => {
  const talkRow = (d: Input): AvailableCommand => {
    const row = d.commands.find((c) => c.label === 'Talk');
    if (!row) throw new Error('Tidus has no Talk row');
    return row;
  };

  it('is on offer, greyed while a Talk waits on his turn ("Waiting for his turn"), offered a third time, then spent', () => {
    const engine = engineFor('braskas-final-aeon', dreamsEndBuild);
    const flags = engine.state().flags as Record<string, unknown>;
    expect(talkRow(decisionFor(engine, 'tidus')).enabled, 'the first Talk').toBe(true);

    flags['bfa.talkUsed'] = 1;
    flags['bfa.talkPending'] = true;
    let row = talkRow(reask(engine));
    expect(row.enabled, 'one Talk waits on his turn').toBe(false);
    expect(row.disabledReason).toBe('Waiting for his turn');

    flags['bfa.talkPending'] = false; // his turn has come and gone (the script re-enables Talk)
    expect(talkRow(reask(engine)).enabled, 'the second Talk').toBe(true);

    flags['bfa.talkUsed'] = 2;
    flags['bfa.talkPending'] = true;
    row = talkRow(reask(engine));
    expect(row.enabled, 'the second Talk waits on his turn').toBe(false);
    expect(row.disabledReason).toBe('Waiting for his turn');

    flags['bfa.talkPending'] = false;
    expect(talkRow(reask(engine)).enabled, 'two used and nothing waiting: the third Talk is offered').toBe(true);

    flags['bfa.talkUsed'] = 3;
    row = talkRow(reask(engine));
    expect(row.enabled, 'the third Talk has been spoken').toBe(false);
    expect(row.disabledReason).toBe('Nothing left to say');
  });

  it('the third Talk, taken, only speaks: nothing waits on his turn and the gauge is not touched', () => {
    const engine = engineFor('braskas-final-aeon', dreamsEndBuild);
    const flags = engine.state().flags as Record<string, unknown>;
    decisionFor(engine, 'tidus');
    flags['bfa.talkUsed'] = 2;
    flags['bfa.talkPending'] = false;
    flags['bfa.gauge'] = 60;
    const row = talkRow(reask(engine));
    expect(row.enabled).toBe(true);
    const events = engine.submit(row.command);
    expect(events.some((e) => e.type === 'message' && /nothing left to say/.test(e.text)), 'it says it has nothing left to say').toBe(true);
    expect(flags['bfa.talkPending']).not.toBe(true);
    expect(flags['bfa.talkUsed']).toBe(3);
    expect(flags['bfa.gauge'], 'the gauge is not touched by a Talk that only speaks').toBe(60);
  });

  it('a Talk waiting on his turn is not a second charge: it clears when he loses the turn, and the charge count is unchanged by the row', () => {
    const engine = engineFor('braskas-final-aeon', dreamsEndBuild);
    const flags = engine.state().flags as Record<string, unknown>;
    const first = decisionFor(engine, 'tidus');
    engine.submit(talkRow(first).command);
    expect(flags['bfa.talkUsed']).toBe(1);
    expect(flags['bfa.talkPending']).toBe(true);
    // Wherever Tidus is asked next the row is open exactly when nothing waits on the boss's turn; once he has lost it, it is open again.
    const st = engine.state();
    let reopened = false;
    for (let i = 0; i < 400 && !reopened; i++) {
      for (const id of [...st.activeIds, ...st.reserveIds]) {
        const c = st.combatants[id];
        if (c) {
          c.stats.maxHp = 99_999;
          c.hp = 99_999;
        }
      }
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      if (d.actorId === 'tidus') {
        const row = talkRow(d);
        expect(row.enabled, `pending ${String(flags['bfa.talkPending'])}`).toBe(flags['bfa.talkPending'] !== true);
        if (!row.enabled) expect(row.disabledReason).toBe('Waiting for his turn');
        else reopened = true;
      }
      engine.submit({ kind: 'defend', targets: [] });
    }
    expect(reopened, 'his turn passed and the row opened again').toBe(true);
    expect(flags['bfa.talkUsed'], 'the row never spent a charge of its own').toBe(1);
  });
});
