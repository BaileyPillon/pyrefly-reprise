/**
 * **A guest in the party** (FFX only; `FFXGuestSpec`, `docs/plans/ch-gui-review.md` §3): the generic support the hidden Sinspawn Gui chapter's Seymour stands on.
 *
 * Every case runs the real engine on a real shipped party and formation (Chapter X's build and Natus's group; Auron is lent to the line-up as the guest, which is
 * the cheapest way to get a party-side fighter with real stats). Nothing greps (rule 3). What is pinned:
 *
 * 1. **Setup:** an `'ai'` guest is an automatic actor, a `'player'` guest keeps his menu, an ordinary member has no `guest`; the block is copied, not shared.
 * 2. **His turn:** an AI guest takes turns without ever asking the player, aims at the ENEMY side (the fallback used to aim at `livingFriendlies`, i.e. his own),
 *    and runs the script his build names (the script and its hooks are found by `activeScriptId` / `scriptIdOf`).
 * 3. **The loss rule:** the battle is lost when no non-guest member stands, even with the guest on his feet, unless `keepsPartyAlive` says otherwise.
 * 4. **He earns nothing:** no AP, no turns counted, no results row.
 * 5. **Determinism and the look-ahead:** the same seed gives the same log; `fork` (the advisor's private copy) keeps the guest.
 * 6. **Absence:** with no guest anywhere, a battle's log is the one it always was (the 18 chapter digests in `ffx-engine-golden.test.ts` are the wide proof; this
 *    is the narrow one on the same party).
 */
import { describe, expect, it } from 'vitest';
import type { BattleEvent, Command, Decision, FFXCombatant, FFXGuestSpec, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { activeScriptId, registerAiScript } from '../../src/battle/ffx/ai/index.ts';
import { registerScriptHooks, scriptIdOf } from '../../src/battle/ffx/ai/hooks.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { highbridgeBuild } from '../../src/data/ffx/builds/highbridge.ts';
import { buildMemberRows } from '../../src/ui/common/resultsMath.ts';
import { getChapter } from '../../src/data/encounters.ts';

const GROUP = ENEMY_GROUPS_BY_ID['seymour-natus']!;
const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

/** Chapter X's party with Auron lent to the line-up as a guest, last in the slot order (Tidus, Yuna, Auron). */
function partyWithGuest(guest: FFXGuestSpec | null): FFXPartyBuild {
  const build = structuredClone(highbridgeBuild);
  build.activeSlots = ['tidus', 'yuna', 'auron'];
  build.reserve = build.reserve.filter((id) => id !== 'auron');
  if (guest) {
    const auron = build.members.find((m) => m.id === 'auron')!;
    auron.guest = guest;
  }
  return build;
}

function engineOn(party: FFXPartyBuild, seed = 7): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: GROUP, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

const foe = (engine: ReturnType<typeof createFFXEngine>): string => engine.state().enemyIds.find((id) => engine.state().combatants[id]?.alive)!;
/** Party HP to 99,999: Natus ends a real party in a handful of turns, and these cases are about who acts and who counts, not about surviving him. */
function durable(engine: ReturnType<typeof createFFXEngine>): void {
  for (const id of engine.state().activeIds) {
    const c = engine.state().combatants[id]!;
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
  }
}

const attack = (engine: ReturnType<typeof createFFXEngine>): Command => ({ kind: 'attack', targets: [foe(engine)] });
const guestOf = (engine: ReturnType<typeof createFFXEngine>): FFXCombatant => engine.state().combatants['auron'] as FFXCombatant;

/** Drive `steps` decisions, answering every player turn with an Attack at the first living foe; returns every event, in order, and who was asked. */
function drive(engine: ReturnType<typeof createFFXEngine>, steps: number): { events: BattleEvent[]; asked: string[] } {
  const events: BattleEvent[] = [];
  const asked: string[] = [];
  for (let i = 0; i < steps; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'resolved') events.push(...d.events);
    if (d.kind === 'player-input') {
      asked.push(d.actorId);
      events.push(...engine.submit(attack(engine)));
    }
  }
  return { events, asked };
}

describe('setup', () => {
  it('an AI guest is an automatic actor on the party side; a player guest keeps his menu; an ordinary member has no guest block', () => {
    const ai = engineOn(partyWithGuest({ control: 'ai', aiScriptId: 'no-such-script' }));
    expect(guestOf(ai)).toMatchObject({ side: 'party', controller: 'ai', guest: { control: 'ai', aiScriptId: 'no-such-script' } });
    expect((ai.state().combatants['tidus'] as FFXCombatant).guest).toBeUndefined();
    expect((ai.state().combatants['tidus'] as FFXCombatant).controller).toBe('player');
    expect(ai.state().activeIds).toEqual(['tidus', 'yuna', 'auron']);

    const player = engineOn(partyWithGuest({ control: 'player' }));
    expect(guestOf(player)).toMatchObject({ side: 'party', controller: 'player', guest: { control: 'player' } });
  });

  it('the combatant owns its guest block (a battle never writes through the shipped record)', () => {
    const spec: FFXGuestSpec = { control: 'ai' };
    const party = partyWithGuest(spec);
    const engine = engineOn(party);
    expect(guestOf(engine).guest).not.toBe(party.members.find((m) => m.id === 'auron')!.guest);
    expect(guestOf(engine).guest).toEqual({ control: 'ai' });
  });
});

describe('his turn', () => {
  it('an AI guest takes his turns without ever asking the player, and his fallback Attack lands on the ENEMY side', () => {
    const engine = engineOn(partyWithGuest({ control: 'ai' }));
    durable(engine);
    const { events, asked } = drive(engine, 120);
    expect(asked).not.toContain('auron');
    expect(asked.length).toBeGreaterThan(0);
    const acted = events.filter((e) => e.type === 'action-start' && e.actorId === 'auron');
    expect(acted.length, 'the guest acted').toBeGreaterThan(3);
    // Everything the guest's Attacks touched is an enemy: never Tidus, Yuna or himself.
    const hits = events.filter((e) => e.type === 'damage' && e.sourceId === 'auron');
    expect(hits.length).toBeGreaterThan(0);
    for (const e of hits) expect(engine.state().enemyIds, `target ${(e as { targetId: string }).targetId}`).toContain((e as { targetId: string }).targetId);
  });

  it('a player guest is asked for his command like any member', () => {
    const engine = engineOn(partyWithGuest({ control: 'player' }));
    durable(engine);
    const { asked } = drive(engine, 120);
    expect(asked).toContain('auron');
  });

  it('runs the script his build names, and its hooks: the script id is read from the guest block', () => {
    const calls: string[] = [];
    registerAiScript('test-guest-script', (ai) => {
      calls.push(`turn:${ai.self.id}`);
      return { kind: 'defend', targets: [] };
    });
    registerScriptHooks('test-guest-script', { preTurn: (_ctx, self) => void calls.push(`pre:${self.id}`) });
    const engine = engineOn(partyWithGuest({ control: 'ai', aiScriptId: 'test-guest-script' }));
    durable(engine);
    expect(activeScriptId(guestOf(engine))).toBe('test-guest-script');
    expect(scriptIdOf(guestOf(engine))).toBe('test-guest-script');
    expect(activeScriptId(engine.state().combatants['tidus'] as FFXCombatant)).toBeUndefined();
    drive(engine, 60);
    expect(calls).toContain('turn:auron');
    expect(calls).toContain('pre:auron');
    expect(calls.filter((c) => c.endsWith(':tidus'))).toEqual([]); // nobody else's script ran
  });
});

describe('the loss rule', () => {
  function knockOut(engine: ReturnType<typeof createFFXEngine>, ids: string[]): void {
    for (const id of ids) {
      const c = engine.state().combatants[id]!;
      c.hp = 0;
      c.alive = false;
      c.statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    }
  }

  it('is lost when no non-guest member stands, though the guest is on his feet', () => {
    const engine = engineOn(partyWithGuest({ control: 'ai' }));
    durable(engine);
    knockOut(engine, ['tidus', 'yuna']);
    expect(guestOf(engine).alive).toBe(true);
    let over: Decision | null = null;
    for (let i = 0; i < 60 && !over; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') over = d;
      else if (d.kind === 'player-input') engine.submit(attack(engine));
    }
    expect(over).not.toBeNull();
    expect((over as Extract<Decision, { kind: 'battle-over' }>).result.outcome).toBe('defeat');
  });

  it('goes on while only the guest stands when the data says so (keepsPartyAlive)', () => {
    const engine = engineOn(partyWithGuest({ control: 'ai', keepsPartyAlive: true }));
    durable(engine);
    knockOut(engine, ['tidus', 'yuna']);
    // 12 decisions: well inside Natus's first phase (his Break, which petrifies the lone survivor and ends it for real, comes below 24,000 HP: about step 30 on the old turn order, step 22 on the game's own order since the W2 merge).
    for (let i = 0; i < 12; i++) {
      const d = engine.nextDecision();
      expect(d.kind, `step ${i}`).not.toBe('battle-over');
      if (d.kind === 'player-input') engine.submit(attack(engine));
    }
    expect(guestOf(engine).alive).toBe(true);
  });

  it('an ordinary party is lost exactly when everyone is down, as before', () => {
    const engine = engineOn(partyWithGuest(null));
    durable(engine);
    knockOut(engine, ['tidus', 'yuna']);
    for (let i = 0; i < 20; i++) {
      const d = engine.nextDecision();
      expect(d.kind).not.toBe('battle-over'); // Auron, an ordinary member, still stands
      if (d.kind === 'player-input') engine.submit(attack(engine));
    }
  });
});

describe('he earns nothing', () => {
  it('no AP, no turns counted and no results row, while the others earn theirs', () => {
    const party = partyWithGuest({ control: 'ai' });
    const engine = engineOn(party);
    // Win quickly: the foes are brought low so a few attacks finish the fight.
    for (const id of engine.state().enemyIds) {
      const c = engine.state().combatants[id]!;
      c.hp = 1;
    }
    let result: Extract<Decision, { kind: 'battle-over' }>['result'] | null = null;
    for (let i = 0; i < 200 && !result; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') result = d.result;
      else if (d.kind === 'player-input') engine.submit(attack(engine));
    }
    expect(result?.outcome).toBe('victory');
    expect(Object.keys(result!.sphereLevelsGained)).not.toContain('auron');
    expect(Object.keys(result!.turnsTaken ?? {})).not.toContain('auron');
    const chapter = { ...getChapter('seymour-natus')!, buildRef: party };
    const rows = buildMemberRows(chapter, result!);
    expect(rows.map((r) => r.id)).not.toContain('auron');
    expect(rows.map((r) => r.id)).toEqual(expect.arrayContaining(['tidus', 'yuna']));
  });
});

describe('determinism and the look-ahead', () => {
  it('the same seed gives the same battle, event for event', () => {
    const a = drive(engineOn(partyWithGuest({ control: 'ai' }), 11), 150).events;
    const b = drive(engineOn(partyWithGuest({ control: 'ai' }), 11), 150).events;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.length).toBeGreaterThan(50);
  });

  it("fork (the advisor's private copy) keeps the guest, and the copy plays on without touching the original", () => {
    const engine = engineOn(partyWithGuest({ control: 'ai' }));
    drive(engine, 8);
    const before = JSON.stringify(engine.state().combatants);
    const copy = engine.fork(99);
    expect((copy.state().combatants['auron'] as FFXCombatant).guest).toEqual({ control: 'ai' });
    expect((copy.state().combatants['auron'] as FFXCombatant).controller).toBe('ai');
    drive(copy, 60);
    expect(JSON.stringify(engine.state().combatants)).toBe(before);
  });
});

describe('absence', () => {
  it('a party with no guest plays exactly the battle it always did: the same seed, the same log, with and without the (unused) field', () => {
    const plain = drive(engineOn(partyWithGuest(null), 5), 150).events;
    const party = partyWithGuest(null);
    for (const m of party.members) expect(m.guest).toBeUndefined();
    const again = drive(engineOn(party, 5), 150).events;
    expect(JSON.stringify(again)).toBe(JSON.stringify(plain));
  });
});
