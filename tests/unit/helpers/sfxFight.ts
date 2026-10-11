/**
 * A scripted fight through the REAL presenter and the REAL chapter voice, for the SFX parity pin
 * (`tests/unit/audio-sfx-parity-pin.test.ts`): which cue every kind of action plays, at what volume and delay,
 * and when, in the presenter's own virtual time.
 *
 * The audio port records exactly what the presenter asks for (`key`, `volume`, `delay`, `pan`), never the
 * options the parity work added (`events`, `coveredBy`, `beatMs`): those are asked of the mixer, and the mixer
 * ignores them while no parity pack is listed. So a trace recorded on the build BEFORE the parity integration and
 * the trace of the build after it must be identical, byte for byte, which is what "audible behaviour does not
 * change while `sfxParity.packs` is empty" means for the presenter's half.
 *
 * Time is virtual: `sleep` parks the caller until the clock reaches it, the driver wakes sleepers in time order,
 * and a cue's `t` is the clock plus its own delay. Deterministic, no real timers, no DOM.
 *
 * Game case: both (the script has an FFX half and an FFX-2 half; each plays through its own chapter voice).
 */

import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { BattleMoments } from '../../../src/engine/BattleMoments.ts';
import { setSfxGame } from '../../../src/audio/sfxV2/voicing.ts';
import { sfxVoiceFor } from '../../../src/app/screens/battleSfxVoice.ts';
import { abilityFactsFor } from '../../../src/app/screens/battleAbilityFacts.ts';
import type { AbilityDef, BattleEvent, BattleState } from '../../../src/battle/common/types.ts';
import { ABILITIES as FFX_ABILITIES } from '../../../src/data/ffx/index.ts';
import { ABILITIES as FFX2_ABILITIES } from '../../../src/data/ffx2/index.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage } from './FakeStage.ts';

export type FightGame = 'ffx' | 'ffx2';

/** What the presenter asked the mixer for, and when (ms of virtual time since the scenario began). */
export interface FightCue {
  t: number;
  key: string;
  volume: number | null;
  delay: number | null;
  pan: number | null;
  /** SFX parity's options (`events`, `coveredBy`, `beatMs`): recorded for the events tests, left out of {@link signature} so the pin stays what it was. */
  events?: readonly string[];
  coveredBy?: readonly string[];
  beatMs?: number;
}

interface Sleeper {
  at: number;
  seq: number;
  wake: () => void;
}

/** A clock the presenter's `sleep` runs on: nothing waits in real time. */
class VirtualClock {
  now = 0;
  private sleepers: Sleeper[] = [];
  private seq = 0;

  readonly sleep = (ms: number): Promise<void> =>
    new Promise<void>((wake) => {
      this.sleepers.push({ at: this.now + Math.max(0, ms), seq: this.seq++, wake });
    });

  /** Run until `done` settles, waking sleepers in time order (ties in the order they went to sleep). */
  async drive(done: Promise<unknown>): Promise<void> {
    let finished = false;
    void done.then(
      () => (finished = true),
      () => (finished = true),
    );
    const settleMicrotasks = (): Promise<void> => new Promise<void>((r) => setImmediate(r));
    for (let guard = 0; guard < 100_000; guard++) {
      await settleMicrotasks();
      if (finished) break;
      if (this.sleepers.length === 0) {
        await settleMicrotasks();
        if (finished) break;
        throw new Error('the scripted fight is waiting on nothing');
      }
      this.sleepers.sort((a, b) => a.at - b.at || a.seq - b.seq);
      const next = this.sleepers.shift()!;
      this.now = Math.max(this.now, next.at);
      next.wake();
    }
    await done;
  }
}

// ------------------------------------------------------------------ the cast

interface Cast {
  party: Record<string, { dressphere?: string }>;
  enemies: string[];
  aeons: string[];
}

const FFX_CAST: Cast = {
  party: { tidus: {}, auron: {}, kimahri: {}, wakka: {}, lulu: {}, yuna: {}, rikku: {} },
  enemies: ['dingo', 'seymour-flux', 'yunalesca', 'braskas-final-aeon', 'evrae'],
  aeons: ['valefor'],
};

const FFX2_CAST: Cast = {
  party: { yuna: { dressphere: 'gunner' }, rikku: { dressphere: 'thief' }, paine: { dressphere: 'warrior' } },
  enemies: ['imp', 'ormi-entrance', 'ormi-logos-room', 'logos-room', 'dr-goon', 'fem-goon', 'leblanc', 'logos', 'ormi', 'ffx2-bahamut', 'x2-shiva', 'vegnagun-leg', 'shuyin'],
  aeons: [],
};

/** The live state the voice reads (a combatant's side and an FFX-2 girl's dressphere). */
function stateOf(cast: Cast, over: Record<string, { dressphere?: string }> = {}): BattleState {
  const combatants: Record<string, unknown> = {};
  for (const [id, c] of Object.entries(cast.party)) combatants[id] = { side: 'party', ...(c.dressphere ? { dresspheres: { current: c.dressphere } } : {}) };
  for (const [id, c] of Object.entries(over)) combatants[id] = { side: 'party', dresspheres: { current: c.dressphere } };
  for (const id of cast.enemies) combatants[id] = { side: 'enemy' };
  for (const id of cast.aeons) combatants[id] = { side: 'aeon' };
  return { combatants } as unknown as BattleState;
}

// ------------------------------------------------------------------ events

type Ev = Record<string, unknown> & { type: string };

const actionStart = (actorId: string, kind: string, extra: { id?: string; abilityId?: string } = {}): Ev => ({
  type: 'action-start',
  actorId,
  command: { kind, targets: [], ...(extra.id ? { id: extra.id } : {}) },
  ...(extra.abilityId ? { abilityId: extra.abilityId, abilityName: extra.abilityId } : {}),
  targets: [],
});
const actionEnd = (actorId: string): Ev => ({ type: 'action-end', actorId });
const damage = (targetId: string, sourceId: string, over: Record<string, unknown> = {}): Ev => ({
  type: 'damage',
  targetId,
  sourceId,
  amount: 500,
  element: 'none',
  crit: false,
  hitIndex: 0,
  hitCount: 1,
  ...over,
});

/** One action as the engine would raise it: start, its blows or statuses, end. */
function action(actorId: string, kind: string, _targetId: string, body: Ev[], extra: { id?: string; abilityId?: string } = {}): Ev[] {
  return [{ type: 'turn-start', actorId, turn: 1, elapsedTicks: 0 }, actionStart(actorId, kind, extra), ...body, actionEnd(actorId)];
}

/** The events one ability produces against `targetId`, read from its own row. */
function abilityBody(def: AbilityDef, actorId: string, targetId: string): Ev[] {
  const body: Ev[] = [];
  const element = def.element.find((e) => e !== 'none') ?? 'none';
  const heals = def.flags.includes('heals');
  if (heals) {
    body.push(damage(targetId, actorId, { amount: -400, element }));
    body.push(damage(targetId, actorId, { amount: -400, element, hitIndex: 1, hitCount: 2 }));
  } else if (def.damageType === 'magical' || def.damageType === 'physical') {
    body.push(damage(targetId, actorId, { element, hitCount: 2 }));
    body.push(damage(targetId, actorId, { element, hitIndex: 1, hitCount: 2 }));
  }
  for (const s of def.statusEffects.slice(0, 2)) body.push({ type: 'status-add', targetId, sourceId: actorId, status: s.status, instance: {} });
  for (const s of def.removesStatuses.slice(0, 1)) body.push({ type: 'status-remove', targetId, status: s, reason: 'cured' });
  return body;
}

export interface Scenario {
  id: string;
  events: Ev[];
  /** A moment the presenter's event loop does not raise (the boss reveal, an Overdrive's opening): played on the battle's own `BattleMoments`. */
  moment?: { kind: 'reveal'; bossId: string } | { kind: 'overdrive-start'; actorId: string };
}

/** Every scenario of one game: the basics by hand, then every ability by a party actor and by a foe. */
export function scenarios(game: FightGame): Scenario[] {
  const cast = game === 'ffx' ? FFX_CAST : FFX2_CAST;
  const abilities = (game === 'ffx' ? FFX_ABILITIES : FFX2_ABILITIES) as Record<string, AbilityDef>;
  const party = Object.keys(cast.party);
  const foe = cast.enemies[0]!;
  const out: Scenario[] = [];
  const add = (id: string, events: Ev[], moment?: Scenario['moment']): void => void out.push({ id, events, ...(moment ? { moment } : {}) });

  // Physical attacks by everyone: a blow, a critical, a multi-hit, a miss.
  for (const who of [...party, ...cast.enemies]) {
    const target = party.includes(who) ? foe : party[0]!;
    add(`attack:${who}`, action(who, 'attack', target, [damage(target, who)]));
    add(`attack-crit:${who}`, action(who, 'attack', target, [damage(target, who, { crit: true })]));
    add(`attack-multi:${who}`, action(who, 'attack', target, [0, 1, 2].map((i) => damage(target, who, { hitIndex: i, hitCount: 3 }))));
    add(`attack-miss:${who}`, action(who, 'attack', target, [{ type: 'miss', targetId: target, sourceId: who, reason: 'evaded' }]));
  }

  // Every ability, by a party actor and by a foe (the foe's own row decides the rest).
  const caster = game === 'ffx' ? 'lulu' : 'yuna';
  for (const [id, def] of Object.entries(abilities)) {
    for (const [who, side] of [[caster, 'party'], [foe, 'enemy']] as const) {
      const target = side === 'party' ? foe : caster;
      add(`ability:${who}:${id}`, action(who, 'ability', target, abilityBody(def, who, target), { abilityId: id }));
    }
  }

  // Items, Overdrive and Special commands, the moments with no ability row.
  add('item:potion', action(caster, 'item', caster, [damage(caster, caster, { amount: -300 })], { id: 'potion' }));
  add('item:phoenix-down', action(caster, 'item', caster, [{ type: 'revive', targetId: caster, hp: 100, cause: 'phoenix-down' }], { id: 'phoenix-down' }));
  add('item:no-row', action(caster, 'item', foe, [damage(foe, caster)], { id: 'no-such-item' }));
  add('overdrive:command', action(party[0]!, 'overdrive', foe, [damage(foe, party[0]!)], { abilityId: 'no-such-overdrive' }));
  add('revive:life', action(caster, 'ability', caster, [{ type: 'revive', targetId: caster, hp: 200, cause: 'life' }]));
  add('revive:auto-life', [{ type: 'revive', targetId: caster, hp: 200, cause: 'auto-life' }]);
  add('heal:regen-tick', [{ type: 'heal', targetId: caster, amount: 120, cause: 'regen' }]);
  add('damage:poison-tick', [damage(caster, foe, { sourceId: undefined })]);
  add('mp:tick', [{ type: 'mp-heal', targetId: caster, amount: 10 }]);

  // Statuses landing with and without an action on screen, and after the first one of an action.
  for (const status of ['haste', 'slow', 'protect', 'shell', 'reflect', 'regen', 'poison', 'sleep', 'silence', 'stop', 'darkness', 'berserk', 'confuse', 'curse', 'doom', 'petrify', 'scan', 'zombie', 'ko', 'defend', 'shield', 'boost']) {
    add(`status:${status}`, [{ type: 'status-add', targetId: caster, status, instance: {} }]);
    add(`status-in-action:${status}`, action(foe, 'ability', caster, [{ type: 'status-add', targetId: caster, sourceId: foe, status, instance: {} }, { type: 'status-add', targetId: party[1]!, sourceId: foe, status: 'protect', instance: {} }], { abilityId: 'no-such-ability' }));
  }

  // The flow beats: KOs of every kind, a summon, a charge ladder, a form change, a counter, an Overdrive full.
  for (const who of [...party.slice(0, 2), ...cast.enemies, ...cast.aeons]) add(`ko:${who}`, [{ type: 'ko', targetId: who }]);
  add('summon', [{ type: 'summon', aeonId: cast.aeons[0] ?? 'valefor', combatantId: cast.aeons[0] ?? 'valefor', ownerId: caster }]);
  for (const who of cast.enemies) {
    add(`charge1:${who}`, [{ type: 'charge', enemyId: who, name: 'Charging', turnsLeft: 2, stage: 1 }]);
    add(`charge2:${who}`, [{ type: 'charge', enemyId: who, name: 'Ready', turnsLeft: 0, stage: 2 }]);
    add(`form-change:${who}`, [{ type: 'form-change', enemyId: who, formIndex: 1, name: 'Second form' }]);
  }
  add('counter', [{ type: 'counter', actorId: foe, targetId: caster }]);
  add('overdrive-gauge', [{ type: 'overdrive-gauge', who: party[0]!, from: 90, to: 100 }]);
  if (game === 'ffx2') {
    for (const to of ['floral-fallal', 'machina-maw', 'full-throttle', 'gunner', 'warrior']) add(`spherechange:${to}`, [{ type: 'spherechange', who: 'yuna', from: 'gunner', to, gatesCrossed: [] }]);
  }
  for (const key of ['laser-charge', 'laser-fire', 'explosion', 'breath-attack', 'no-such-key', 'sfx-no-such-thing']) add(`sfx:${key}`, [{ type: 'sfx', key }]);
  add('victory', [{ type: 'victory' }]);

  // The two moments with a cue of their own that the event loop does not raise (`BattleMoments`).
  for (const who of cast.enemies) add(`reveal:${who}`, [], { kind: 'reveal', bossId: who });
  for (const who of party) add(`overdrive-start:${who}`, [], { kind: 'overdrive-start', actorId: who });
  return out;
}

/** The cues one scenario made, in order. */
export async function playScenario(game: FightGame, scenario: Scenario): Promise<FightCue[]> {
  const cast = game === 'ffx' ? FFX_CAST : FFX2_CAST;
  const state = stateOf(cast);
  const clock = new VirtualClock();
  const cues: FightCue[] = [];
  const stage = new FakeStage(Object.keys(cast.party), [...cast.enemies, ...cast.aeons]);
  for (const id of cast.aeons) stage.sides.set(id, 'aeon');
  const audio = {
    playSfx(key: string, opts?: { volume?: number; delay?: number; pan?: number; events?: readonly string[]; coveredBy?: readonly string[]; beatMs?: number }): void {
      cues.push({
        t: Math.round(clock.now + (opts?.delay ?? 0) * 1000),
        key,
        volume: opts?.volume ?? null,
        delay: opts?.delay ?? null,
        pan: opts?.pan ?? null,
        ...(opts?.events ? { events: opts.events } : {}),
        ...(opts?.coveredBy ? { coveredBy: opts.coveredBy } : {}),
        ...(opts?.beatMs !== undefined ? { beatMs: opts.beatMs } : {}),
      });
    },
    playMusic: (): void => undefined,
    stopMusic: (): void => undefined,
  };
  const presenter = new BattlePresenter({
    stage,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    audio,
    sleep: clock.sleep,
    sfxVoice: sfxVoiceFor(game, () => state),
    abilityFacts: abilityFactsFor(game),
  });
  const events = scenario.events.map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
  setSfxGame(game); // what `sfxChapter` does for the length of a chapter run
  try {
    if (scenario.moment) {
      const moments = new BattleMoments({ stage, moments: null, audio, hud: null, sleep: clock.sleep, speed: () => 'normal' });
      const m = scenario.moment;
      await clock.drive(m.kind === 'reveal' ? moments.revealBoss(m.bossId, m.bossId) : moments.overdriveStart(m.actorId, 'Overdrive'));
    } else {
      await clock.drive(presenter.play(events));
    }
  } finally {
    setSfxGame(null);
  }
  return cues;
}

/** One scenario's cues as a single comparable line: `key@volume+delay#t`, joined with spaces. */
export function signature(cues: readonly FightCue[]): string {
  if (cues.length === 0) return '(silent)';
  return cues.map((c) => `${c.key}@${c.volume ?? '-'}+${c.delay ?? '-'}${c.pan === null ? '' : `~${c.pan}`}#${c.t}`).join(' ');
}

/** Every scenario of a game, grouped by what it played: signature -> the scenario ids that played it. */
export async function fightTrace(game: FightGame): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  for (const scenario of scenarios(game)) {
    const sig = signature(await playScenario(game, scenario));
    (out[sig] ??= []).push(scenario.id);
  }
  return out;
}
