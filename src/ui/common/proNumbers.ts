/**
 * THE GLASS DAMAGE NUMBERS, the pure half (conference demo, lane "pro-look"; Bailey 2026-10-22: hits "Ink and light" with "the clean glass damage numbers that come with it": options book G25, number style N2
 * "Glass Sans": a clean, slanted sans in white to ice with a luminous edge instead of an outline; the tiers grow in size and glow, the critical gets a fringe and a long glint, a heal is mint with a plus,
 * one number per multi-hit that ticks up). Pure (no DOM, no `three`); `DamageNumbers.ts` draws, `pro-numbers.css` styles.
 *
 * Off by default: `proPieceOn('numbers')` (`engine/look/pro/ProSwitch.ts`) is false everywhere but the two demo chapters under `?look=pro` / `?pack=demo`, and then the shared numeral code takes its old paths.
 *
 * Game case (rule 14): both games, two skins (FFX ice-blue, FFX-2 pink and lilac: CSS, scoped by the HUD's own layer class). No number the engine deals, no rule and no timing changes; only how an amount is drawn.
 *
 * Sourced vs [ours]: the tiers' thresholds, sizes and motion are [ours] (no source for retail numeral sizes beyond `research/visual-bible.md` §3.6, whose 16 and 24 px base sizes the pro sizes multiply).
 * How a hit's tier is decided is the book's open question 1 (Bailey asked for "percent of max HP"; a 732 hit on a 70,000 HP boss is 1 percent and never reaches the top tiers): the rule here is both,
 * whichever is larger: the share of the target's max HP (as asked), and how big the blow is against that attacker's own usual blow (the book's recommended rule, so bosses tier too).
 */
import { proPieceOn } from '../../engine/look/pro/ProSwitch.ts';

export type NumberTier = 'normal' | 'big' | 'critical';
export const NUMBER_TIERS: readonly NumberTier[] = ['normal', 'big', 'critical'];

/** Share of the target's max HP at which a blow is BIG and at which it is CRITICAL (a crit always is). [ours] */
export const TIER_PCT = { big: 0.12, critical: 0.3 } as const;
/** How many times the attacker's usual blow a hit must be to be BIG and CRITICAL (the usual blow is the mean of its earlier first hits; the first blow of a battle has none and is normal). [ours] */
export const TIER_USUAL = { big: 1.7, critical: 2.6 } as const;
/** The font-size factor of each tier on the old numeral's size (16 px base on the 640x360 grid, 24 for a crit). [ours] */
export const TIER_SIZE: Readonly<Record<NumberTier, number>> = { normal: 1.3, big: 1.75, critical: 2.3 };
/** The factor of a heal, and of the small numerals (MP, MISS, IMMUNE, ABSORBED). [ours] */
export const HEAL_SIZE = 1.35;
export const SMALL_SIZE = 1.15;

/** What the numeral layer may ask of the battle about a target: its max HP. Set by the battle screen while a battle is up. */
export type NumberFacts = (id: string) => { maxHp: number } | undefined;
let facts: NumberFacts | null = null;

export function setNumberFacts(fn: NumberFacts | null): void {
  facts = fn;
}

export function maxHpOf(id: string): number | undefined {
  const v = facts?.(id)?.maxHp;
  return v !== undefined && Number.isFinite(v) && v > 0 ? v : undefined;
}

/** Are the glass numbers drawing now (the pro look's `numbers` piece: on in the two demo chapters, off elsewhere and by default)? */
export function proNumbersOn(): boolean {
  return proPieceOn('numbers');
}

const RANK: Readonly<Record<NumberTier, number>> = { normal: 0, big: 1, critical: 2 };
const maxTier = (a: NumberTier, b: NumberTier): NumberTier => (RANK[a] >= RANK[b] ? a : b);

/** The tier of a blow of `amount`: a crit is CRITICAL; else the larger of the share-of-max-HP tier and the against-the-usual-blow tier (`usual` is the attacker's usual blow, 0 or undefined when none is known yet). */
export function tierOf(amount: number, crit: boolean, maxHp: number | undefined, usual: number | undefined): NumberTier {
  const a = Math.abs(amount);
  if (crit) return 'critical';
  let t: NumberTier = 'normal';
  if (maxHp !== undefined && maxHp > 0) {
    const share = a / maxHp;
    t = share >= TIER_PCT.critical ? 'critical' : share >= TIER_PCT.big ? 'big' : 'normal';
  }
  if (usual !== undefined && usual > 0) {
    const r = a / usual;
    t = maxTier(t, r >= TIER_USUAL.critical ? 'critical' : r >= TIER_USUAL.big ? 'big' : 'normal');
  }
  return t;
}

/** The running mean of each attacker's earlier blows (the first hit of each action, so a multi-hit's later hits do not drag it), for the against-the-usual-blow tier. */
export class UsualBlows {
  private readonly sum = new Map<string, { total: number; n: number }>();

  /** The attacker's usual blow so far, or undefined before its first. */
  of(source: string | undefined): number | undefined {
    const s = source === undefined ? undefined : this.sum.get(source);
    return s && s.n > 0 ? s.total / s.n : undefined;
  }

  /** Note a first hit of an action. */
  note(source: string | undefined, amount: number): void {
    if (source === undefined || !(amount > 0)) return;
    const s = this.sum.get(source) ?? { total: 0, n: 0 };
    s.total += amount;
    s.n += 1;
    this.sum.set(source, s);
  }

  clear(): void {
    this.sum.clear();
  }
}

/** The glass numeral's text: the amount, with a plus for a heal (HP or MP). */
export function glassText(amount: number, heal: boolean): string {
  const n = Math.abs(Math.round(amount));
  return `${heal ? '+' : ''}${n}`;
}

/** The font-size factor of a numeral of a classified kind and tier. */
export function sizeFactor(kind: string, tier: NumberTier): number {
  if (kind === 'damage' || kind === 'critical') return TIER_SIZE[tier];
  if (kind === 'heal') return HEAL_SIZE;
  return SMALL_SIZE;
}

/** A glass numeral's life in ms: a little longer than the old one (900), so the number can be read at booth distance. [ours] */
export function proLifetime(kind: string): number {
  return kind === 'heal' ? 1300 : kind === 'miss' ? 700 : 1150;
}

/** The pop on spawn and on every tick of a multi-hit: starts at `from` times its size and eases to 1 over 140 ms. Tick pops (a later hit of the same action) are 1.15x. [ours] */
export function proPop(sinceMs: number, tier: NumberTier, tick: boolean): number {
  const from = tick ? 1.15 : tier === 'critical' ? 1.5 : 1.3;
  const dur = 140;
  if (sinceMs >= dur) return 1;
  const p = Math.max(0, sinceMs) / dur;
  return from + (1 - from) * (1 - (1 - p) ** 3);
}

/** The rise: straight up 30 logical px with an ease-out (no bounce, no gravity), over the numeral's life. Returns the offset from the spawn point (+y down). */
export function proRise(tMs: number, lifeMs: number): { x: number; y: number } {
  const p = Math.min(1, Math.max(0, tMs) / Math.max(1, lifeMs));
  return { x: 0, y: 0 - 30 * (1 - (1 - p) ** 2.4) };
}

/** Opacity: full until the last 260 ms of the numeral's (possibly extended) life. */
export function proOpacity(tMs: number, lifeMs: number): number {
  const remaining = lifeMs - tMs;
  return remaining >= 260 ? 1 : Math.max(0, remaining / 260);
}

/** How long a numeral lives on after a later hit of its action ticks it up: the hold from that tick. */
export const TICK_HOLD_MS = 900;
