/**
 * The bench lines for **Chapter XVII** (`sin-fins-core`, links 1 to 3). **FFX only.** Test-only. The
 * advisor-card line lives in the bench file (it needs `critic/bench/advisor-v3/drive.ts`).
 *
 * - **sensible** — `research/ffx-sin.md` §8 rows 1 to 4, 6 and 9 (`docs/plans/sin-two-chapters-plan.md` §5):
 *   - Fins: close in, Armor Break and Mental Break, then pull back (row 1); pull back when the core
 *     charges (row 2); at FAR only Wakka and Lulu reach, so they fire (row 1); Protect the centre and Haste
 *     one, cast at FAR where Negation cannot strip them (row 3); revive, cure and heal between swings.
 *   - Link 3: Genais first, physicals only until it shells (row 4: a spell at it draws Waterga on the caster),
 *     then Fire and Piercing into the shell, then the Core with Armor and Mental Break. `coreFirst` is row 6,
 *     the Core while Genais stands (only Wakka's swing and magic reach it): the bench's variant, not the default.
 *   - Not modelled, named: the Silence Grenade (not in the preset's bag; Wakka's Silence Buster lasts a turn),
 *     row 5 (Bahamut through Gravija), row 7 (Reflect against the Core's counters).
 *   - Front row: the build opens Tidus, Yuna, Auron. A member who is not wanted in front swaps for one who is
 *     (a switch costs no turn): Tidus, Yuna and Auron for a break trip, Tidus, Wakka and Lulu at range.
 * - **naive** — the brief's credibly wrong line: Attack whatever is in reach and Defend otherwise; no orders to
 *   Cid, no Breaks, no status care, no Overdrives; Curaga under 40 %, a Phoenix Down on a KO.
 *
 * Each line is a factory, so a run owns its state (trips made, Mental Break tries). A `Line` returns `null` to
 * press the fallback. Measure, never tune: a line is refined only where it plays worse than the sources' player.
 */

import type { AnyCombatant, BattleEngine, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { type Input, type Line, type LinkNo, linkOf } from './sinFinsBench.ts';

const has = (c: AnyCombatant | undefined, s: string): boolean => (c as FFXCombatant | undefined)?.statuses?.[s as keyof FFXCombatant['statuses']] !== undefined;
const isUp = (c: AnyCombatant | undefined): boolean => !!c && c.hp > 0 && !has(c, 'ko');
const flag = (e: BattleEngine, k: string): unknown => e.state().flags[k];
const combatant = (e: BattleEngine, id: string): FFXCombatant | undefined => e.state().combatants[id] as FFXCombatant | undefined;
const front = (e: BattleEngine): FFXCombatant[] => e.state().activeIds.map((id) => combatant(e, id)).filter((c): c is FFXCombatant => !!c);
const benchIds = (e: BattleEngine): string[] => e.state().reserveIds.filter((id) => isUp(combatant(e, id)));
const defend = (): Command => ({ kind: 'defend', targets: [] });

function row(d: Input, kind: Command['kind'], id: string, target: string): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && c.command.id === id);
  return r && r.validTargets.includes(target) ? ({ ...r.command, targets: [target] } as Command) : null;
}
const item = (d: Input, id: string, target: string) => row(d, 'item', id, target);
const spell = (d: Input, id: string, target: string) => row(d, 'ability', id, target);

/** The first enabled row of `kind` that reaches `target`. */
function reaching(d: Input, kind: Command['kind'], target: string): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === kind && c.validTargets.includes(target));
  return r ? ({ ...r.command, targets: [target] } as Command) : null;
}

function switchTo(d: Input, inId: string): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === 'switch' && (c.command as { extra?: { inId?: string } }).extra?.inId === inId);
  return r ? ({ ...r.command, extra: { outId: d.actorId, inId } } as Command) : null;
}

/** How hurt a member has to be before the line spends a turn on them (`topUp` false = the plain 40 % / 50 % rule). */
function healLines(e: BattleEngine, link: LinkNo, topUp: boolean): { spellAt: number; itemAt: number } {
  if (!topUp) return { spellAt: 0.5, itemAt: 0.4 };
  // Links 1 and 2 at FAR: the Fin only attacks after 7 hits on it, so nothing is pressing and a heal costs nothing.
  if (link !== 3) return flag(e, 'airship.range') === 'far' && flag(e, 'sin.fin.charged') !== true ? { spellAt: 0.9, itemAt: 0.5 } : { spellAt: 0.5, itemAt: 0.4 };
  const genais = combatant(e, 'sinspawn-genais');
  const calm = isUp(genais) && flag(e, 'sin.genais.shelled') !== true; // the Core is inactive while Genais is out
  return calm ? { spellAt: 0.9, itemAt: 0.5 } : { spellAt: 0.65, itemAt: 0.5 };
}

/** Revive, Soft a Petrify, Remedy a Confuse or Zombie, then heal: Curaga for two or more hurt, else Cura or a potion. */
function upkeep(e: BattleEngine, d: Input, link: LinkNo, topUp: boolean): Command | null {
  const party = front(e);
  for (const c of party) {
    if (c.id === d.actorId) continue;
    if (!isUp(c)) return item(d, 'phoenix-down', c.id) ?? item(d, 'mega-phoenix', c.id);
    if (has(c, 'petrify')) return item(d, 'soft', c.id) ?? item(d, 'remedy', c.id);
    if (has(c, 'confuse')) return item(d, 'remedy', c.id);
    if (has(c, 'zombie')) return item(d, 'holy-water', c.id);
  }
  const { spellAt, itemAt } = healLines(e, link, topUp);
  const frac = (c: FFXCombatant): number => c.hp / c.stats.maxHp;
  const hurt = party.filter((c) => isUp(c) && frac(c) < spellAt);
  const me = combatant(e, d.actorId);
  if (topUp && d.actorId === 'yuna' && me && me.mp < 80) { const mp = item(d, 'ether', me.id) ?? item(d, 'turbo-ether', me.id); if (mp) return mp; }
  if (d.actorId === 'yuna' && hurt.length >= 2) {
    const cast = spell(d, 'curaga', d.actorId);
    if (cast) return cast;
  }
  if (d.actorId === 'yuna' && topUp && hurt.length === 1) {
    const cast = spell(d, 'cura', hurt[0]!.id);
    if (cast) return cast;
  }
  const weak = party.filter((c) => isUp(c) && frac(c) < itemAt).sort((a, b) => frac(a) - frac(b))[0];
  if (weak) {
    if (d.actorId === 'yuna') return spell(d, 'cura', weak.id) ?? item(d, 'x-potion', weak.id) ?? item(d, 'hi-potion', weak.id);
    return item(d, 'x-potion', weak.id) ?? item(d, 'hi-potion', weak.id) ?? item(d, 'elixir', weak.id);
  }
  return null;
}

export interface SensibleOpts {
  /** REVIEW row 6: go for the Core while Genais stands. Default false (row 4, Genais first). */
  coreFirst?: boolean;
  /** A sensitivity, off by default: heal to 90 % in calm turns (FAR in links 1 and 2, Genais out of its shell in link 3) and at 65 % once the Core acts. The default is the plain 40 % / 50 % rule. */
  topUp?: boolean;
  /**
   * A second sensitivity, off by default ("careful"): use the free turns to recover before the resources are spent.
   * At FAR a Fin only attacks after 7 hits on it, so once a Fin is under 15 % HP the line stops hitting it, rotates
   * every wounded member in through Yuna's Curaga and Cura (a switch costs no turn), and only then finishes it. Link 3 is played as it comes:
   * Genais keeps hitting there, so a rest is not free (tried once: it lost every rested link-3 fight). Capped at 90 actions.
   */
  recover?: boolean;
}

const MAX_TRIPS = 2;
const MENTAL_TRIES = 2;
const ORDER_OWNERS = ['tidus', 'rikku'];
const REACH = ['wakka', 'lulu'];

export function makeSensible(opts: SensibleOpts = {}): Line {
  let finId = '';
  let trips = 0;
  let mentalTries = 0;
  const spent = new Map<string, number>();

  /** Who should stand in front for this phase (in priority order). */
  function wanted(e: BattleEngine, link: LinkNo, tripNeeded: boolean): string[] {
    if (link === 3) {
      const genais = combatant(e, 'sinspawn-genais');
      if (opts.coreFirst && isUp(genais)) return ['wakka', 'tidus', 'yuna'];
      if (isUp(genais)) return flag(e, 'sin.genais.shelled') === true ? ['tidus', 'yuna', 'lulu'] : ['tidus', 'auron', 'yuna'];
      return ['tidus', 'auron', 'yuna'];
    }
    const near = flag(e, 'airship.range') === 'near';
    return near || tripNeeded ? ['tidus', 'auron', 'yuna'] : ['tidus', 'wakka', 'lulu'];
  }

  /** Swap a member who is not wanted in front for one who is; a switch costs no turn. */
  function swap(e: BattleEngine, d: Input, want: string[]): Command | null {
    if (want.includes(d.actorId)) return null;
    const missing = want.find((id) => !e.state().activeIds.includes(id) && benchIds(e).includes(id));
    return missing ? switchTo(d, missing) : null;
  }

  return (e, d, link) => {
    const me = d.actorId;
    const st = e.state();
    if (st.aeonId === me) return reaching(d, 'overdrive', foeIds(e)[0]!) ?? reaching(d, 'attack', foeIds(e)[0]!) ?? defend();
    const fix = upkeep(e, d, link, opts.topUp === true);
    if (fix) return fix;
    if (opts.recover) { const rest = recovery(e, d, link); if (rest) return rest; }
    if (link === 3) return genaisCore(e, d, swap);
    return fins(e, d, swap);
  };


  /** The careful line's rest: heal everyone to 88 % through Yuna, rotating the wounded in. `null` when nothing is left to do. */
  function recovery(e: BattleEngine, d: Input, link: LinkNo): Command | null {
    const st = e.state();
    let key: string;
    if (link === 3) {
      return null; // not free there: Genais keeps hitting while the party rests (tried: 0 of 200 rested wins), so link 3 is played as it comes
    } else {
      const fin = combatant(e, foeIds(e)[0] ?? '');
      if (!fin || fin.hp > fin.stats.maxHp * 0.15 || flag(e, 'airship.range') !== 'far' || flag(e, 'sin.fin.charged') === true) return null;
      key = fin.id;
    }
    const used = spent.get(key) ?? 0;
    if (used >= 90) return null;
    const everyone = [...st.activeIds, ...st.reserveIds].map((id) => combatant(e, id)).filter((c): c is FFXCombatant => isUp(c));
    const frac = (c: FFXCombatant): number => c.hp / c.stats.maxHp;
    const needy = everyone.filter((c) => frac(c) < 0.88);
    if (needy.length === 0) return null;
    spent.set(key, used + 1);
    const inFront = st.activeIds.includes('yuna');
    if (d.actorId === 'yuna') {
      const hurt = front(e).filter((c) => isUp(c) && frac(c) < 0.88);
      if (hurt.length >= 2) return spell(d, 'curaga', 'yuna') ?? defend();
      if (hurt.length === 1) return spell(d, 'cura', hurt[0]!.id) ?? defend();
      return defend();
    }
    if (!inFront && benchIds(e).includes('yuna')) return switchTo(d, 'yuna') ?? defend();
    const waiting = needy.find((c) => !st.activeIds.includes(c.id));
    if (waiting) return switchTo(d, waiting.id) ?? defend();
    return defend();
  }

  function foeIds(e: BattleEngine): string[] {
    return e.state().enemyIds.filter((id) => id !== 'cid' && isUp(combatant(e, id)));
  }

  function overdriveAt(d: Input, target: string, casterOk = true): Command | null {
    if (!casterOk) return null;
    const r = d.commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes(target));
    return r ? ({ ...r.command, targets: [target] } as Command) : null;
  }

  function fins(e: BattleEngine, d: Input, swap: (e: BattleEngine, d: Input, w: string[]) => Command | null): Command {
    const me = d.actorId;
    const fin = combatant(e, foeIds(e)[0]!)!;
    if (fin.id !== finId) { finId = fin.id; trips = 0; mentalTries = 0; }
    const range = flag(e, 'airship.range');
    const queued = flag(e, 'airship.order');
    const charged = flag(e, 'sin.fin.charged') === true;
    const armored = has(fin, 'armor-break');
    const brokenBoth = armored && (has(fin, 'mental-break') || mentalTries >= MENTAL_TRIES);
    const tripNeeded = !armored && trips < MAX_TRIPS;
    const owner = ORDER_OWNERS.includes(me) && !queued;

    // Row 2 and row 1: the orders, from whoever owns them.
    if (owner && charged && range === 'near') { const pull = orderRow(d, 'pull-back'); if (pull) return pull; }
    if (owner && range === 'far' && !charged && tripNeeded) { const close = orderRow(d, 'close-in'); if (close) { trips++; mentalTries = 0; return close; } }
    if (owner && range === 'near' && !charged && brokenBoth) { const pull = orderRow(d, 'pull-back'); if (pull) return pull; }

    const moved = swap(e, d, wanted(e, linkOf(e), tripNeeded));
    if (moved) return moved;

    if (range === 'near') {
      if (me === 'auron') {
        if (!armored) return spell(d, 'armor-break', fin.id) ?? defend();
        if (!has(fin, 'mental-break') && mentalTries < MENTAL_TRIES) { mentalTries++; return spell(d, 'mental-break', fin.id) ?? defend(); }
      }
      return overdriveAt(d, fin.id) ?? spellAt(e, d, fin.id) ?? reaching(d, 'attack', fin.id) ?? defend();
    }
    // FAR. Row 3, cast where Negation cannot strip it: Protect the centre, Haste one.
    if (!REACH.includes(me)) {
      const centre = e.state().activeIds[1];
      if (me === 'yuna' && centre && !has(combatant(e, centre), 'protect')) { const r = spell(d, 'protect', centre); if (r) return r; }
      if (me === 'tidus' && !front(e).some((c) => has(c, 'haste'))) {
        const pick = front(e).find((c) => REACH.includes(c.id) && isUp(c)) ?? combatant(e, 'tidus')!;
        const r = spell(d, 'haste', pick.id);
        if (r) return r;
      }
      if (tripNeeded && me !== 'tidus' && me !== 'yuna' && me !== 'auron') return defend();
      return overdriveAt(d, fin.id) ?? reaching(d, 'attack', fin.id) ?? defend();
    }
    return overdriveAt(d, fin.id) ?? spellAt(e, d, fin.id) ?? reaching(d, 'attack', fin.id) ?? defend();
  }

  /** Lulu's strongest spell; an Ether when she is dry. */
  function spellAt(e: BattleEngine, d: Input, target: string): Command | null {
    if (d.actorId !== 'lulu') return null;
    return mpFix(e, d) ?? spell(d, 'firaga', target) ?? spell(d, 'fira', target) ?? spell(d, 'fire', target);
  }

  function genaisCore(e: BattleEngine, d: Input, swap: (e: BattleEngine, d: Input, w: string[]) => Command | null): Command {
    const me = d.actorId;
    const genais = combatant(e, 'sinspawn-genais');
    const core = combatant(e, 'sin-core');
    const genaisUp = isUp(genais);
    const moved = swap(e, d, wanted(e, 3, false));
    if (moved) return moved;
    if (genaisUp && opts.coreFirst) {
      if (me === 'wakka') return reaching(d, 'attack', 'sin-core') ?? defend();
      return buffOrDefend(e, d);
    }
    if (genaisUp) {
      const shelled = flag(e, 'sin.genais.shelled') === true;
      if (shelled && me === 'lulu') return mpFix(e, d) ?? spell(d, 'firaga', 'sinspawn-genais') ?? spell(d, 'fira', 'sinspawn-genais') ?? spell(d, 'fire', 'sinspawn-genais') ?? defend();
      // Row 4: physicals only until it shells; a spell at it draws Waterga on the caster.
      return reaching(d, 'attack', 'sinspawn-genais') ?? buffOrDefend(e, d);
    }
    if (core && isUp(core)) {
      if (me === 'auron' && !has(core, 'armor-break')) return spell(d, 'armor-break', core.id) ?? defend();
      if (me === 'auron' && !has(core, 'mental-break')) return spell(d, 'mental-break', core.id) ?? defend();
      return overdriveAt(d, core.id) ?? reaching(d, 'attack', core.id) ?? buffOrDefend(e, d);
    }
    return defend();
  }

  function mpFix(e: BattleEngine, d: Input): Command | null {
    const me = combatant(e, d.actorId);
    if (!me || me.mp >= 60) return null;
    return item(d, 'ether', me.id) ?? item(d, 'turbo-ether', me.id);
  }

  function buffOrDefend(e: BattleEngine, d: Input): Command {
    const centre = e.state().activeIds[1];
    if (d.actorId === 'yuna' && centre && !has(combatant(e, centre), 'protect')) { const r = spell(d, 'protect', centre); if (r) return r; }
    return defend();
  }

  function orderRow(d: Input, id: 'pull-back' | 'close-in'): Command | null {
    const r = d.commands.find((c) => c.enabled && c.command.kind === 'trigger' && c.command.id === id);
    return r ? ({ ...r.command, targets: r.validTargets[0] ? [r.validTargets[0]] : [] } as Command) : null;
  }
}

/** Naive: Attack whatever is in reach, Defend otherwise; Curaga under 40 %; a Phoenix Down on a KO. */
export function makeNaive(): Line {
  return (e, d) => {
    const me = d.actorId;
    for (const c of front(e)) if (c.id !== me && !isUp(c)) return item(d, 'phoenix-down', c.id) ?? defend();
    if (me === 'yuna' && front(e).some((c) => isUp(c) && c.hp < c.stats.maxHp * 0.4)) {
      const cast = spell(d, 'curaga', me);
      if (cast) return cast;
    }
    const foe = e.state().enemyIds.filter((id) => id !== 'cid' && isUp(combatant(e, id)));
    for (const id of foe) {
      const hit = reaching(d, 'attack', id);
      if (hit) return hit;
    }
    return defend();
  };
}
