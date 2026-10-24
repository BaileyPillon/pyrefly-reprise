// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { setHudF1Mode } from '../../src/ui/hudf1/HudF1Switch.ts';
import { DamageNumbers } from '../../src/ui/common/DamageNumbers.ts';
import {
  TIER_PCT,
  TIER_SIZE,
  TIER_USUAL,
  UsualBlows,
  glassText,
  proLifetime,
  proOpacity,
  proPop,
  proRise,
  setNumberFacts,
  sizeFactor,
  tierOf,
} from '../../src/ui/common/proNumbers.ts';

/**
 * The glass damage numbers (lane "pro-look", both games, Chapter I and Chapter IV only, off by default): the tiers (share of the target's max HP, and the blow against its attacker's usual blow), the plus on
 * heals, one rising number per multi-hit action that ticks up, and the old numeral untouched when the piece is off.
 */
const FRAME = { width: 1600, height: 900 };

function layer(): DamageNumbers {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const numbers = new DamageNumbers({ root, project: () => ({ x: 700, y: 400 }), scale: () => 2.5, avoid: () => [] });
  numbers.mount();
  numbers.el.getBoundingClientRect = (): DOMRect =>
    ({ x: 0, y: 0, left: 0, top: 0, right: FRAME.width, bottom: FRAME.height, width: FRAME.width, height: FRAME.height, toJSON: () => ({}) }) as DOMRect;
  return numbers;
}
const run = (n: DamageNumbers, ms: number): void => {
  for (let t = 0; t < ms; t += 10) n.update(0.01);
};

beforeEach(() => {
  // r64 (item 200b): the pro look and the F1 HUD are the page's DEFAULT in the demo chapters now (the F1 damage numeral is 1.6 times the glass numeral's); these claims are the glass numeral's own, so each one names its mode.
  setProMode('today');
  setHudF1Mode('today');
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', { configurable: true, get(this: HTMLElement) { return (this.textContent?.length ?? 0) * 9; } });
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  setProMode(null);
  setHudF1Mode(null);
  setProPiece(null);
  setDemoChapter(undefined);
  setNumberFacts(null);
});

describe('the tiers', () => {
  it('a crit is critical; otherwise the larger of the share of max HP and the blow against the usual one', () => {
    expect(tierOf(700, true, 70000, undefined)).toBe('critical');
    expect(tierOf(100, false, 2420, undefined)).toBe('normal'); // 4 percent
    expect(tierOf(2420 * TIER_PCT.big, false, 2420, undefined)).toBe('big');
    expect(tierOf(2420 * TIER_PCT.critical, false, 2420, undefined)).toBe('critical');
    // a boss: 732 is 1 percent of 70,000, so only the usual-blow rule can lift it
    expect(tierOf(732, false, 70000, undefined)).toBe('normal');
    expect(tierOf(732 * (TIER_USUAL.big + 0.1), false, 70000, 732)).toBe('big');
    expect(tierOf(732 * (TIER_USUAL.critical + 0.1), false, 70000, 732)).toBe('critical');
    // the larger wins, never the smaller
    expect(tierOf(2420 * TIER_PCT.critical, false, 2420, 10000)).toBe('critical');
    // no max HP known: the usual-blow rule alone
    expect(tierOf(5000, false, undefined, 1000)).toBe('critical');
    expect(tierOf(5000, false, undefined, undefined)).toBe('normal');
  });

  it("the usual blow is the mean of an attacker's earlier first hits, and none is known before the first", () => {
    const u = new UsualBlows();
    expect(u.of('tidus')).toBeUndefined();
    u.note('tidus', 700);
    u.note('tidus', 900);
    u.note('tidus', 0); // no damage: not a blow
    u.note(undefined, 500);
    expect(u.of('tidus')).toBe(800);
    expect(u.of('seymour')).toBeUndefined();
    u.clear();
    expect(u.of('tidus')).toBeUndefined();
  });

  it('sizes grow with the tier; a heal and the small numerals have their own', () => {
    expect(TIER_SIZE.normal).toBeLessThan(TIER_SIZE.big);
    expect(TIER_SIZE.big).toBeLessThan(TIER_SIZE.critical);
    expect(sizeFactor('damage', 'big')).toBe(TIER_SIZE.big);
    expect(sizeFactor('critical', 'critical')).toBe(TIER_SIZE.critical);
    expect(sizeFactor('heal', 'normal')).toBeGreaterThan(1);
    expect(sizeFactor('miss', 'normal')).toBeGreaterThan(1);
  });

  it('prints a plus on a heal and nothing on damage', () => {
    expect(glassText(648, true)).toBe('+648');
    expect(glassText(-648, true)).toBe('+648');
    expect(glassText(732, false)).toBe('732');
  });

  it('the motion: a pop that settles, a rise with no bounce, a fade at the end of the (extended) life', () => {
    expect(proPop(0, 'normal', false)).toBeCloseTo(1.3, 3);
    expect(proPop(0, 'critical', false)).toBeCloseTo(1.5, 3);
    expect(proPop(0, 'normal', true)).toBeCloseTo(1.15, 3);
    expect(proPop(200, 'big', false)).toBe(1);
    let prev = 0;
    for (let t = 0; t <= 1000; t += 50) {
      const y = proRise(t, 1000).y;
      expect(y).toBeLessThanOrEqual(prev); // only ever up (negative y), never back down
      prev = y;
    }
    expect(proRise(1000, 1000).y).toBeCloseTo(-30, 3);
    expect(proOpacity(100, 1150)).toBe(1);
    expect(proOpacity(1150, 1150)).toBe(0);
    expect(proLifetime('damage')).toBeGreaterThan(900); // longer than the old numeral
  });
});

describe('the numeral layer', () => {
  it('with the piece off (?pack=off / ?look=today) the numeral is the old one: no glass class, today\'s size, today\'s text', () => {
    setDemoChapter('seymour-flux'); // the chapter alone is not enough: the switch is off
    const n = layer();
    const el = n.spawnEvent({ type: 'damage', targetId: 'seymour', amount: 732, hitIndex: 0, hitCount: 1 })!;
    expect(el.classList.contains('dnum--glass')).toBe(false);
    expect(el.className).toBe('dnum dnum--damage');
    expect(el.style.fontSize).toBe('40px'); // 16 x 2.5
    expect(el.textContent).toBe('732');
  });

  it('with the piece on, in a demo chapter: the glass class, the tier class, the tier size; a heal prints its plus', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    setNumberFacts((id) => (id === 'tidus' ? { maxHp: 2420 } : id === 'seymour' ? { maxHp: 70000 } : undefined));
    const n = layer();
    const small = n.spawnEvent({ type: 'damage', targetId: 'seymour', sourceId: 'tidus', amount: 732, hitIndex: 0, hitCount: 1 })!;
    expect(small.classList.contains('dnum--glass')).toBe(true);
    expect(small.classList.contains('dnum--tier-normal')).toBe(true);
    expect(Number.parseFloat(small.style.fontSize)).toBeCloseTo(16 * TIER_SIZE.normal * 2.5, 1);
    // the same attacker's next blow, three times as big as his usual one: BIG on a 70,000 HP boss (a percent rule alone would never lift it)
    const big = n.spawnEvent({ type: 'damage', targetId: 'seymour', sourceId: 'tidus', amount: 732 * 3, hitIndex: 0, hitCount: 1 })!;
    expect(big.classList.contains('dnum--tier-critical') || big.classList.contains('dnum--tier-big')).toBe(true);
    // a party member hit for a third of his HP
    const hurt = n.spawnEvent({ type: 'damage', targetId: 'tidus', sourceId: 'seymour', amount: 900, hitIndex: 0, hitCount: 1 })!;
    expect(hurt.classList.contains('dnum--tier-critical')).toBe(true);
    const crit = n.spawnEvent({ type: 'damage', targetId: 'seymour', amount: 100, crit: true, hitIndex: 0, hitCount: 1 })!;
    expect(crit.classList.contains('dnum--tier-critical')).toBe(true);
    const heal = n.spawnEvent({ type: 'heal', targetId: 'tidus', amount: 648 })!;
    expect(heal.textContent).toBe('+648');
    expect(heal.classList.contains('dnum--heal')).toBe(true);
    const miss = n.spawnEvent({ type: 'miss', targetId: 'seymour' })!;
    expect(miss.textContent).toBe('MISS');
    expect(miss.classList.contains('dnum--glass')).toBe(true);
    // a critical has its streak
    expect(n.el.querySelectorAll('.dnum-glint').length).toBeGreaterThan(0);
  });

  it('one number per multi-hit action: the later hits tick the same numeral up', () => {
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
    const n = layer();
    const first = n.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 142, hitIndex: 0, hitCount: 3 })!;
    run(n, 100);
    const second = n.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 149, hitIndex: 1, hitCount: 3 })!;
    run(n, 100);
    const third = n.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 148, hitIndex: 2, hitCount: 3 })!;
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(n.count).toBe(1);
    expect(first.textContent).toBe(String(142 + 149 + 148));
  });

  it("an old numeral's later hits still ladder (the piece off): three numerals", () => {
    const n = layer();
    n.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 142, hitIndex: 0, hitCount: 3 });
    n.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 149, hitIndex: 1, hitCount: 3 });
    n.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 148, hitIndex: 2, hitCount: 3 });
    expect(n.count).toBe(3);
  });

  it('a heal burst ticks up too, in mint, with its plus; a damage hit does not join a heal', () => {
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
    const n = layer();
    const a = n.spawnEvent({ type: 'heal', targetId: 'yuna', amount: 200 })!;
    const b = n.spawnEvent({ type: 'damage', targetId: 'yuna', amount: -250, hitIndex: 1, hitCount: 2 })!;
    expect(a.textContent?.startsWith('+')).toBe(true);
    expect(b.classList.contains('dnum--heal')).toBe(true);
    const d = n.spawnEvent({ type: 'damage', targetId: 'yuna', amount: 300, hitIndex: 1, hitCount: 2 })!;
    expect(d).not.toBe(a);
    expect(d.classList.contains('dnum--heal')).toBe(false);
  });

  it('a glass numeral lives longer than the old one and is gone after it, with its glint', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const n = layer();
    n.spawnEvent({ type: 'damage', targetId: 'seymour', amount: 100, crit: true, hitIndex: 0, hitCount: 1 });
    run(n, 1000);
    expect(n.count).toBe(1); // the old numeral's 900 ms is over; the glass one holds
    run(n, 400);
    expect(n.count).toBe(0);
    expect(n.el.querySelectorAll('.dnum-glint').length).toBe(0);
  });

  it('a later action does not join an earlier action\'s numeral after the burst gap', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const n = layer();
    const a = n.spawnEvent({ type: 'damage', targetId: 'seymour', amount: 500, hitIndex: 0, hitCount: 2 })!;
    run(n, 1000);
    const b = n.spawnEvent({ type: 'damage', targetId: 'seymour', amount: 500, hitIndex: 1, hitCount: 2 })!;
    expect(b).not.toBe(a);
  });
});
