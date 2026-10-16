/**
 * The Magus Sisters' seven orders in the engine (re-parity lane FFX-K, the Sisters' orders of 2026-10-15; **FFX only**): the seam between the proven kernels
 * (`kernel/sister-search.ts` the target search, `kernel/sister-chains.ts` the candidate chains as data, `kernel/sister-orders.ts` the handlers) and the engine's
 * combatants, streams and executor. Nothing here is a rule of its own. Source: `research/re-ffx-zanmato-and-orders.md` Part 2 (final decode `f59c4592`).
 *
 * **Game case: FFX only** (FFX-2 has no Magus Sisters). What an order does, in the engine's terms:
 *
 * 1. The handler runs to the end first, as the script event does: its draws (stream 18 for rolls, stream 4 for a pick among several targets) all come before any command
 *    it queued is carried out, so a second search sees the world as the first left it (Mindy's second spell is searched before the first has cost its MP).
 * 2. The commands it queued are then carried out **in order, each as its own action** through the ordinary executor (`run`): the commands are ordinary abilities, so the
 *    target builder, Reflect, Cover, the hit pipeline and the death check apply to them as to anyone's (Mindy's spells aimed at a Cindy who holds Reflect bounce onto
 *    the enemies, one stream-6 draw each). Group-type commands (Pray, Ultima, NulAll) are aimed at the stored group; the rest command is no action at all.
 * 3. After each action the positive-case test decides the column and the end-of-action step applies the gain pair the handler left (it stays set, so two queued spells
 *    apply it twice: the note's reading, unproved). The turn is charged the rank of the LAST action (unproved: the note does not run the queue).
 * 4. **Combine powers** is the eighth order and the same mechanism: its handler (event 18) searches the Delta Attack FIRST (a target exists and her gauge is full, else
 *    no draw at all), then rolls `200 + motivation`, then stores the group; a pass calls the joint action (`./sisters.ts#jointAction`: Cindy performs the Delta Attack at
 *    the whole stored group, each of them taking all 6 hits) and writes (0, +10); a miss writes (0, -10) and the rest command, which is her last command.
 *
 * **Unproved here, and labelled so for the chapter** (note section 17): the Sisters' starting motivation (the build's estimate), the queue behaviour of Mindy's two
 * spells (the order they run in, the rank the turn is charged, what happens to a command whose target vanished first), and whether the standing order and the sisters'
 * private variables survive into the next battle (here they start at 0 in every battle). "Had a real effect", which only "One more time" reads, is the engine's
 * reading of the game's positive-case test: the HP or MP the command took from (or gave) the other combatants.
 */

import type { CombatantId, Command, FFXCombatant } from '../../common/types.ts';
import { aeonSpecialRequest } from '../kernel/aeon-request.ts';
import { C, type SisterName } from '../kernel/sister-chains.ts';
import { TARGET_GROUP, TARGET_SELF, type OrderHost, type OrderState, runOrder } from '../kernel/sister-orders.ts';
import { type SearchChar, type SearchHost, type SearchWorld, SEARCH_SLOTS, targetSearch } from '../kernel/sister-search.ts';
import { afterAction, increaseMotivation, magusRoll, positiveCaseTest, setMotivationChange, storeStandingOrder } from '../kernel/sisters.ts';
import { type Ctx, abilityOf, enemies, friendlies, has, onField, targetable } from '../state.ts';
import { type OrderRun, jointAction, magusChrOf, points, storeMagusChr } from './sisters.ts';
import { unitOf } from './od-world.ts';
import { slotOf } from './slots.ts';
import { FfxStream } from './streams.ts';
import { chainSlotOf } from './target-world.ts';

/**
 * Our ability id of each command a handler can perform. The sister's own Attack (0x3000) is `cindy-attack`, `sandy-attack` or `mindy-attack`; the others are the engine's
 * player-side abilities whose command record carries that id (`tests/unit/parity-ffx-sister-orders.test.ts` checks every one against the data's own record).
 */
export const SISTER_ABILITY: Readonly<Record<number, string>> = {
  0x3019: 'pray', 0x3020: 'lancet', 0x302b: 'cure', 0x302c: 'cura', 0x302d: 'curaga', 0x3034: 'life', 0x3035: 'full-life-spell', 0x3036: 'haste', 0x303a: 'shell',
  0x303b: 'protect', 0x303c: 'reflect', 0x3040: 'auto-life', 0x3045: 'fira', 0x3046: 'blizzara', 0x3047: 'thundara', 0x3048: 'watera', 0x3049: 'firaga',
  0x304a: 'blizzaga', 0x304b: 'thundaga', 0x304c: 'waterga', 0x304d: 'bio', 0x304f: 'death', 0x3050: 'drain', 0x3051: 'osmose-spell', 0x3052: 'flare',
  0x3053: 'ultima', 0x30e5: 'camisade', 0x30e7: 'razzia', 0x30e9: 'passado', 0x312d: 'nul-all-aeon',
};

/** The ability id of a performed command for a sister. */
export function abilityOfCommand(cmd: number, sister: SisterName): string {
  if (cmd === C.attack) return `${sister}-attack`;
  const id = SISTER_ABILITY[cmd];
  if (id === undefined) throw new Error(`FFX engine: the Sisters' orders have no ability for command 0x${cmd.toString(16)}`);
  return id;
}

/** The 31-slot world the search reads, from the field as it stands: the sisters (the aeons out) and the monsters. */
export function searchWorldOf(ctx: Ctx): { world: SearchWorld; at: Map<number, FFXCombatant> } {
  const world: Array<SearchChar | undefined> = new Array<SearchChar | undefined>(SEARCH_SLOTS).fill(undefined);
  const at = new Map<number, FFXCombatant>();
  for (const c of [...friendlies(ctx), ...enemies(ctx)]) {
    const slot = chainSlotOf(ctx, c);
    if (slot === undefined || at.has(slot)) continue;
    at.set(slot, c);
    world[slot] = {
      inBattle: onField(c),
      removed: false, // a removed combatant is not on the field
      targetable: targetable(c),
      dead: !c.alive || has(c, 'ko'),
      far: c.flags.battleDistance ?? 0,
      group: 0, // the engine has no group numbers: every monster is group 0
      hp: c.hp,
      maxHp: c.stats.maxHp,
      mp: c.mp,
      silence: has(c, 'silence'),
      curse: has(c, 'curse'),
      gauge: points(c),
      gaugeMax: 100 / unitOf(c),
      autoLife: has(c, 'auto-life'),
      shell: has(c, 'shell'),
      protect: has(c, 'protect'),
      reflect: has(c, 'reflect'),
      haste: has(c, 'haste'),
      nulTide: has(c, 'nultide'),
      nulBlaze: has(c, 'nulblaze'),
      nulShock: has(c, 'nulshock'),
      nulFrost: has(c, 'nulfrost'),
    };
  }
  return { world, at };
}

/** One queued command: the ability to run and the combatants it is aimed at. */
interface Queued {
  cmd: number;
  ids: CombatantId[];
}

/** HP and MP of every combatant, to read what a command did. */
function snapshot(ctx: Ctx): Map<CombatantId, { hp: number; mp: number }> {
  return new Map(Object.values(ctx.state.combatants).map((c) => [c.id, { hp: c.hp, mp: c.mp }]));
}

/**
 * The game's three result numbers of a command (HP, MP, CTB), as the positive-case test reads them: what it took from the other combatants (damage, positive) or gave
 * them (healing, negative). The user's own changes are not results.
 */
function resultsOf(ctx: Ctx, before: ReadonlyMap<CombatantId, { hp: number; mp: number }>, user: FFXCombatant, heals: boolean): [number, number, number] {
  let hpLost = 0;
  let hpGained = 0;
  let mpLost = 0;
  let mpGained = 0;
  for (const c of Object.values(ctx.state.combatants)) {
    const was = before.get(c.id);
    if (was === undefined || c.id === user.id) continue;
    if (c.hp < was.hp) hpLost += was.hp - c.hp;
    else hpGained += c.hp - was.hp;
    if (c.mp < was.mp) mpLost += was.mp - c.mp;
    else mpGained += c.mp - was.mp;
  }
  return heals ? [-hpGained, -mpGained, 0] : [hpLost, mpLost, 0];
}

/**
 * Carry out the order `orderCommand` (0x3124 to 0x3129, 0x312A or 0x312B: Combine powers, 0x3129, included) for sister `actor`. `run` carries a command out through the
 * engine's executor. Returns the turn's result: the rank of the last action (3 for the rest command; 0 after a joint action, whose rank Cindy's own counter was charged)
 * and the HP damage dealt.
 */
export function sisterOrder(ctx: Ctx, actor: FFXCombatant, orderCommand: number, run: (who: FFXCombatant, command: Command) => OrderRun): OrderRun {
  const s = ctx.rt.sisters!;
  const sister = actor.id as SisterName;
  const request = aeonSpecialRequest(slotOf(ctx, actor), 0, [orderCommand, 0xffff]);
  if (request === null) throw new Error(`FFX engine: the requester does not map 0x${orderCommand.toString(16)} to an order event`);
  s.parsed[actor.id] = Math.min(255, (s.parsed[actor.id] ?? 0) + 1);

  const memory = s.memory[actor.id]!;
  const me = slotOf(ctx, actor);
  const { world, at } = searchWorldOf(ctx);
  const chr = magusChrOf(ctx, actor);
  const draw = (): number => ctx.rng.on(FfxStream.Magus).int(0, 0x7fffffff);
  const searchHost: SearchHost = {
    get standing() {
      return s.order;
    },
    draw18: draw,
    pick4: (slots) => ctx.rng.on(FfxStream.Picker).pick(slots.map((slot) => ({ slot, id: at.get(slot)?.id }))).slot,
  };
  const idsOf = (mask: number): CombatantId[] => {
    const out: CombatantId[] = [];
    for (let slot = 0; slot < SEARCH_SLOTS; slot++) if (((mask >>> slot) & 1) !== 0 && at.has(slot)) out.push(at.get(slot)!.id);
    return out;
  };

  let stored = 0;
  const queue: Queued[] = [];
  /** Set by the Combine handler's `delta` call: the group the joint action is aimed at (an object, because a closure writes it). */
  const joint: { ids: CombatantId[] | null; mask: number } = { ids: null, mask: 0 };
  const host: OrderHost = {
    roll: (a, b) => magusRoll(a, b, s.order, draw).value === 1,
    search: (cmd, T, P, F, Ch) => {
      const r = targetSearch(world, me, cmd, T, P, F, Ch, searchHost);
      stored = r.stored;
      return r.picked;
    },
    stand: () => s.order,
    setStanding: (v) => void (s.order = storeStandingOrder(v)),
    gain2: (g, m) => increaseMotivation(chr, s.order, g, m),
    gain4: (gp, mp, gn, mn) => setMotivationChange(chr, gp, mp, gn, mn),
    perform: (target, cmd) => {
      const ids = target === TARGET_SELF ? [] : target === TARGET_GROUP ? idsOf(stored) : idsOf(1 << target);
      queue.push({ cmd, ids });
    },
    // Combine powers' search passed: the joint action waits for the end of the handler, like the commands the other handlers queue, and is aimed at the stored group.
    delta: () => {
      joint.ids = idsOf(stored);
      joint.mask = stored;
    },
  };

  const cindy = ctx.rt.aeonRoster.get('cindy');
  const st: OrderState = {
    m: s.motivation[actor.id] ?? 0,
    hp: actor.hp,
    maxHp: Math.max(1, actor.stats.maxHp),
    mp: actor.mp,
    maxMp: Math.max(1, actor.stats.maxMp),
    cindyAlive: cindy !== undefined && cindy.alive && !has(cindy, 'ko'),
    cindyReflect: cindy !== undefined && has(cindy, 'reflect'),
    last: memory.last,
    flag: memory.flag,
    cls: memory.cls,
    list: [memory.list[0], memory.list[1]],
    count: memory.count,
  };
  runOrder(sister, request.kind, st, host);
  memory.last = st.last;
  memory.flag = st.flag;
  memory.cls = st.cls;
  memory.list = [st.list[0], st.list[1]];
  memory.count = st.count;
  storeMagusChr(ctx, actor, chr); // the pair waits for the end of the action

  // The end of an action: the positive-case test decides the column, then the pair is applied (it stays set, so a second action applies it again).
  const endAction = (flags: number, results: [number, number, number]): void => {
    const mine = magusChrOf(ctx, actor);
    positiveCaseTest(mine, flags, results, 0);
    afterAction(mine);
    storeMagusChr(ctx, actor, mine);
  };

  // Combine powers passed its search: the joint action is the one action of the turn (Cindy performs it, whoever gave the order); what it dealt is its result.
  if (joint.ids !== null) {
    const done = jointAction(ctx, joint.ids, joint.mask, run);
    endAction(0, [done.damageDealt, 0, 0]);
    return done;
  }

  // The queued commands, one action each; the rest command is no action but still ends one (the pair is applied after it).
  let result: OrderRun = { rank: 3, damageDealt: 0 };
  let dealt = 0;
  for (const q of queue) {
    let flags = 0;
    let results: [number, number, number] = [0, 0, 0];
    if (q.cmd === C.rest) result = { rank: 3, damageDealt: 0 };
    else {
      const id = abilityOfCommand(q.cmd, sister);
      flags = abilityOf(ctx, id)?.record?.flagsDamage ?? 0;
      const before = snapshot(ctx);
      const done = run(actor, { kind: 'ability', id, targets: q.ids });
      // A command the executor refused (its target went before it started) is a spent turn, not an open one: the script asked for it, the player did not choose it.
      result = done.rank > 0 ? done : { rank: 3, damageDealt: 0 };
      dealt += result.damageDealt;
      results = resultsOf(ctx, before, actor, (flags & 0x10) !== 0);
    }
    endAction(flags, results);
  }
  return { rank: result.rank, damageDealt: dealt };
}
