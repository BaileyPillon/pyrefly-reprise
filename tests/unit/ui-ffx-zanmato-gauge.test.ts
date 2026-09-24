// @vitest-environment jsdom
/**
 * Yojimbo's Zanmato gauge on the FFX HUD (O-5: option A's bar under his name
 * plus option C's full-gauge banner). **Game case: FFX only** [AGENTS.md rule
 * 14]: FFX's Yojimbo fills an enemy Overdrive gauge (research/ffx-yojimbo.md
 * §4); FFX-2's is a different fight. The last blocks are the absence tests.
 *
 * The gauge values come from the real engine and the real Chapter IX data
 * (hard rule 3), never from a hand-built state, wherever the claim is about
 * the fight rather than about painting.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { yojimboCavernBuild } from '../../src/data/ffx/builds/yojimbo-cavern.ts';
import {
  findZanmatoGaugeOwner,
  reachesFull,
  zanmatoBanner,
  zanmatoGaugeView,
} from '../../src/ui/ffx/zanmatoGaugeModel.ts';
import { BANNER_HOLD_MS, PHONE_BAND_MIN, ZanmatoGauge, zanmatoGaugeMode } from '../../src/ui/ffx/ZanmatoGauge.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

function engineFor(groupId: string, seed = 1): ReturnType<typeof createFFXEngine> {
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} missing`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: yojimboCavernBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

/** A live Chapter IX state, gauge moved by the engine's own rules. */
function cavernState(): BattleState {
  return engineFor('yojimbo-cavern').state() as BattleState;
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ------------------------------------------------------------------ the words

describe('zanmatoGaugeView: what the panel prints (the mockups, the sourced bands)', () => {
  it('58 % reads like mockup A mid: bands full to 50, the Wakizashi band 26.7 % in, all three moves open', () => {
    const v = zanmatoGaugeView('Yojimbo', 58);
    expect(v.pctText).toBe('58%');
    expect(v.full).toBe(false);
    expect(v.band).toBe('wakizashi');
    expect(v.segments.map((s) => [s.from, s.to, s.label])).toEqual([
      [0, 25, 'Daigoro'],
      [25, 50, '+ Kozuka'],
      [50, 80, '+ Wakizashi'],
      [80, 100, ''],
    ]);
    expect(v.segments.map((s) => Math.round(s.fill * 1000) / 10)).toEqual([100, 100, 26.7, 0]);
    expect(v.nextText).toBe('Next: Daigoro, Kozuka or Wakizashi');
  });

  it('the Next line follows the sourced pool at each band edge (24 / 25 / 49 / 50 / 99)', () => {
    expect(zanmatoGaugeView('Yojimbo', 0).nextText).toBe('Next: Daigoro');
    expect(zanmatoGaugeView('Yojimbo', 24).nextText).toBe('Next: Daigoro');
    expect(zanmatoGaugeView('Yojimbo', 25).nextText).toBe('Next: Daigoro or Kozuka');
    expect(zanmatoGaugeView('Yojimbo', 49).nextText).toBe('Next: Daigoro or Kozuka');
    expect(zanmatoGaugeView('Yojimbo', 50).nextText).toBe('Next: Daigoro, Kozuka or Wakizashi');
    expect(zanmatoGaugeView('Yojimbo', 99).nextText).toBe('Next: Daigoro, Kozuka or Wakizashi');
    expect(zanmatoGaugeView('Yojimbo', 99).full).toBe(false);
  });

  it('full reads like mockup A full: the chip, every band burnt, Zanmato for 9,999', () => {
    const v = zanmatoGaugeView('Yojimbo', 100);
    expect(v.full).toBe(true);
    expect(v.band).toBe('zanmato');
    expect(v.chipText).toBe('Zanmato · his next turn');
    expect(v.segments.every((s) => s.fill === 1)).toBe(true);
    expect(v.nextText).toBe('Next: Zanmato · 9,999 to each on the field');
    expect(zanmatoBanner('Yojimbo')).toEqual({
      title: 'Zanmato',
      line: 'Yojimbo strikes on his next turn · 9,999 to each on the field',
    });
  });

  it('clamps and rounds whatever arrives (the gauge is 0..100)', () => {
    expect(zanmatoGaugeView('Yojimbo', 130).gauge).toBe(100);
    expect(zanmatoGaugeView('Yojimbo', -4).gauge).toBe(0);
    expect(zanmatoGaugeView('Yojimbo', Number.NaN).gauge).toBe(0);
    expect(zanmatoGaugeView('Yojimbo', 57.6).pctText).toBe('58%');
  });

  it('the banner cue fires only on the move that reaches full', () => {
    expect(reachesFull(97, 100)).toBe(true);
    expect(reachesFull(99, 101)).toBe(true);
    expect(reachesFull(100, 100)).toBe(false);
    expect(reachesFull(null, 100)).toBe(false);
    expect(reachesFull(40, 43)).toBe(false);
  });
});

// ------------------------------------------------------------ the engine gate

describe('findZanmatoGaugeOwner: only Chapter IX publishes the gauge (engine-run)', () => {
  it('the Cavern battle: Yojimbo, starting at 0', () => {
    const owner = findZanmatoGaugeOwner(cavernState());
    expect(owner?.id).toBe('yojimbo');
    expect(owner?.overdrive?.gauge).toBe(0);
  });

  it('a defeated Yojimbo and a decided battle draw nothing', () => {
    const s = structuredClone(cavernState());
    (s.combatants['yojimbo'] as FFXCombatant).alive = false;
    expect(findZanmatoGaugeOwner(s)).toBeNull();
  });

  it('no other FFX enemy group carries it (absence, rule 14)', () => {
    const others = Object.keys(ENEMY_GROUPS_BY_ID).filter((id) => id !== 'yojimbo-cavern');
    expect(others.length).toBeGreaterThan(3);
    let checked = 0;
    for (const id of others) {
      let state: BattleState | null = null;
      try {
        state = engineFor(id).state() as BattleState;
      } catch {
        continue; // a group that needs its own chapter build cannot be set up here; it carries no Yojimbo either
      }
      expect(findZanmatoGaugeOwner(state), id).toBeNull();
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(5); // Chapters 1, 2, 3, 7, 8 at least
  });

  it('the FFX-2 HUD never mounts the widget (absence, rule 14)', () => {
    const dir = join(HERE, '..', '..', 'src', 'ui', 'ffx2');
    const files = readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith('.ts'));
    for (const f of files) expect(readFileSync(join(dir, f), 'utf8'), f).not.toMatch(/ZanmatoGauge|zanmatoGaugeModel/);
  });
});

// --------------------------------------------------------------- the widget

function mountWidget(width = 1280, height = 720): { g: ZanmatoGauge; stage: HTMLElement; host: HTMLElement } {
  const host = document.createElement('div');
  const stage = document.createElement('div');
  host.append(stage);
  document.body.append(host);
  host.getBoundingClientRect = () => ({ width, height, left: 0, top: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  const g = new ZanmatoGauge();
  g.mount(stage, host);
  return { g, stage, host };
}

const gaugeEvent = (from: number, to: number, who = 'yojimbo'): BattleEvent =>
  ({ type: 'overdrive-gauge', who, from, to, cause: 'targeted' }) as BattleEvent;

describe('ZanmatoGauge: the widget', () => {
  it('stays hidden in a battle with no gauge, shows in Chapter IX', () => {
    const { g } = mountWidget();
    g.sync(makeFakeBattleState());
    expect(g.el.hidden).toBe(true);
    g.sync(cavernState());
    expect(g.el.hidden).toBe(false);
    expect(g.panelEl.dataset['gauge']).toBe('0');
    expect(g.panelEl.textContent).toContain('Next: Daigoro');
  });

  it('moves on the overdrive-gauge event for its owner, ignores anyone else\'s', () => {
    const { g } = mountWidget();
    g.sync(cavernState());
    g.onEvent(gaugeEvent(0, 58));
    expect(g.panelEl.dataset['gauge']).toBe('58');
    expect(g.panelEl.querySelector('[data-role="pct"]')?.textContent).toBe('58%');
    g.onEvent(gaugeEvent(0, 99, 'kimahri'));
    expect(g.panelEl.dataset['gauge']).toBe('58');
  });

  it('full: chip replaces the percentage and the one-shot banner comes up, then goes', async () => {
    const { g } = mountWidget();
    g.sync(cavernState());
    g.onEvent(gaugeEvent(0, 97));
    expect(g.bannerEl.hidden).toBe(true);
    g.onEvent(gaugeEvent(97, 100));
    expect(g.panelEl.classList.contains('ffx-zg__panel--full')).toBe(true);
    expect(g.panelEl.querySelector('[data-role="chip"]')?.textContent).toBe('Zanmato · his next turn');
    expect(g.panelEl.querySelector('[data-role="pct"]')).toBeNull();
    expect(g.bannerEl.hidden).toBe(false);
    expect(g.bannerEl.textContent).toContain('Yojimbo strikes on his next turn');
    expect(g.obstacleEls()).toEqual([g.panelEl, g.bannerEl]);
    // A second sync at 100 is not a second banner cue; Zanmato resets it.
    g.onEvent(gaugeEvent(100, 0));
    expect(g.bannerEl.hidden).toBe(true);
    expect(g.obstacleEls()).toEqual([g.panelEl]);
    g.dispose();
  });

  it('the banner holds for BANNER_HOLD_MS and then leaves', async () => {
    const { g } = mountWidget();
    g.sync(cavernState());
    g.onEvent(gaugeEvent(90, 100));
    expect(g.bannerEl.hidden).toBe(false);
    await new Promise((r) => setTimeout(r, BANNER_HOLD_MS + 400));
    expect(g.bannerEl.hidden).toBe(true);
    expect(g.panelEl.classList.contains('ffx-zg__panel--full')).toBe(true); // the panel keeps the full state
  });

  it('a decided battle takes it down', () => {
    const { g } = mountWidget();
    g.sync(cavernState());
    const over = { ...cavernState(), result: { outcome: 'victory' } } as unknown as BattleState;
    g.sync(over);
    expect(g.el.hidden).toBe(true);
    expect(g.obstacleEls()).toEqual([]);
  });

  it('landscape lives in the letterboxed stage; a phone lives in the band above it', () => {
    const wide = mountWidget(1600, 900);
    wide.g.sync(cavernState());
    expect(wide.g.layoutMode).toBe('landscape');
    expect(wide.g.el.parentElement).toBe(wide.stage);
    expect(wide.g.panelEl.querySelector('.ffx-zg__nums')).toBeNull();
    const phone = mountWidget(390, 844);
    phone.g.sync(cavernState());
    expect(phone.g.layoutMode).toBe('phone');
    expect(phone.g.el.parentElement).toBe(phone.host);
    // phone.css: the 25 / 50 / 80 numerals over the bar and the labels under it
    expect([...phone.g.panelEl.querySelectorAll('.ffx-zg__nums span')].map((e) => e.textContent)).toEqual(['25', '50', '80']);
    expect([...phone.g.panelEl.querySelectorAll('.ffx-zg__labels span')].map((e) => (e as HTMLElement).style.left)).toEqual(['0px', '25.5%', '51%']);
  });

  it('zanmatoGaugeMode: the four acceptance viewports', () => {
    expect(zanmatoGaugeMode(1280, 720)).toBe('landscape');
    expect(zanmatoGaugeMode(1600, 900)).toBe('landscape');
    expect(zanmatoGaugeMode(2000, 1012)).toBe('landscape');
    expect(zanmatoGaugeMode(390, 844)).toBe('phone');
    // 390x844 leaves a 312 px band over the 640x360 grid
    expect((844 - 360 * (390 / 640)) / 2).toBeGreaterThanOrEqual(PHONE_BAND_MIN);
  });
});

// ------------------------------------------------------------- the HUD hook

describe('FFXBattleHud mounts it and feeds it', () => {
  it('Chapter IX state: the panel is on the stage; another FFX battle: hidden', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    const el = () => root.querySelector<HTMLElement>('[data-role="zanmato-gauge"]');
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    expect(el()?.hidden).toBe(true);
    const state = cavernState();
    hud.sync(state, []);
    expect(el()?.hidden).toBe(false);
    hud.onEvent(gaugeEvent(0, 26));
    expect(el()?.querySelector('.ffx-zg__panel')?.getAttribute('data-gauge')).toBe('26');
    hud.unmount();
    expect(root.querySelector('[data-role="zanmato-gauge"]')).toBeNull();
  });
});

// ---------------------------------------------------------- the type floor

describe('zanmato-gauge.css: CHK-003 type floor at every checked viewport', () => {
  const sheet = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'ffx', 'zanmato-gauge.css'), 'utf8');
  const landscape = sheet.split('/* -------------------------------------------------------------------- phone */')[0]!;
  const sizes = [...landscape.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
  /** frame 1440 -> grid 640, then `LetterboxStage.ts`'s min(w / 640, h / 360). */
  const effective = (px: number, w: number, h: number): number => px * (640 / 1440) * Math.min(w / 640, h / 360);

  // The two viewports `ffx-hud-css-type-floor.test.ts` holds the in-stage HUD to 12 px at.
  for (const [w, h] of [[1600, 900], [2000, 1012]] as const) {
    it(`every landscape font-size clears 12 px at ${w}x${h}`, () => {
      expect(sizes.length).toBeGreaterThan(5);
      for (const px of sizes) expect(effective(px, w, h), `${px}px`).toBeGreaterThanOrEqual(12);
    });
  }

  it('at 1280x720 nothing in the gauge is smaller than the smallest in-stage label the FFX HUD already ships', () => {
    // The whole 640x360 HUD draws at 2x there, so 12 px is not its floor; parity is.
    const hud = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'ffx', 'ffx-hud.css'), 'utf8');
    const hudMin = Math.min(...[...hud.matchAll(/\.ffxhud [^{}]*\{[^{}]*font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1])));
    expect(hudMin).toBeGreaterThan(0);
    for (const px of sizes) expect(effective(px, 1280, 720), `${px}px`).toBeGreaterThanOrEqual(hudMin * 2);
  });

  it('every phone font-size is at least 12 CSS px', () => {
    const sheet = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'ffx', 'zanmato-gauge.css'), 'utf8');
    const phone = sheet.split('/* -------------------------------------------------------------------- phone */')[1]!;
    for (const m of phone.matchAll(/font-size:\s*([\d.]+)px/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(12);
  });
});
