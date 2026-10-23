// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { BattleState } from '../../src/battle/common/types.ts';
import { dangerPulseFromSearch, setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { setMenuHold } from '../../src/engine/motion/MenuHold.ts';
import { ProFieldMarks } from '../../src/ui/common/ProFieldMarks.ts';
import { PULSE_MS, proHelpLine, rowMarkStyle } from '../../src/ui/common/proMarkers.ts';
import { PRO_FLOWER_SVG, PRO_HAND_SVG } from '../../src/ui/common/proMarkerArt.ts';
import { PartyStatusWindow } from '../../src/ui/ffx/PartyStatusWindow.ts';
import { FfxTargetPlate } from '../../src/ui/ffx/targetPlateFfx.ts';
import { TargetCursor, type TargetEntry } from '../../src/ui/ffx/TargetCursor.ts';

/**
 * The review fixes of lane "pro-look" (adversarial review of 165bfd50d, 2026-10-23): M1 (the KO wash and mark hold under an open FFX-2 command menu, D-357), M2 (the redrawn glove and ring, the flag that
 * carries the damage line, the top TARGET plates standing aside), M4 (the game's own REDUCE MOTION / LOW EFFECTS / REDUCE FLASHES and the Danger pulse's off switch reach the new motions), M6 (a rebuilt
 * row takes the pulse up where it was) and m3 (the pulse and the game's own hurt flash run together).
 */
const BOSS = { x: 900, y: 120, w: 520, h: 700 };
const ENTRY: TargetEntry = { id: 'seymour', name: 'Seymour Flux', kind: 'enemy' };

beforeEach(() => {
  document.body.innerHTML = '';
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 2560 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1440 });
});

afterEach(() => {
  setProMode(null);
  setProPiece(null);
  setDemoChapter(undefined);
  setMenuHold(null);
});

const state = (alive: Record<string, boolean>): BattleState =>
  ({ activeIds: Object.keys(alive), combatants: Object.fromEntries(Object.entries(alive).map(([id, a]) => [id, { id, alive: a }])) }) as unknown as BattleState;
const tick = (m: ProFieldMarks, ms: number): void => {
  for (let t = 0; t < ms; t += 10) m.update(0.01);
};

describe('M1: the KO marks hold under an open command menu (FFX-2, D-357)', () => {
  it('a member who falls behind an open menu gets her wash and mark when it closes, settling from the floor impact, not popping in at once', () => {
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
    let open = true;
    setMenuHold(() => open);
    const m = new ProFieldMarks('ffx2');
    document.body.append(m.el);
    m.setProjector(() => ({ x: 500, y: 800 }));
    m.sync(state({ yuna: true, rikku: false }));
    const wash = m.el.querySelector<HTMLElement>('.pro-ko-wash')!;
    const mark = m.el.querySelector<HTMLElement>('.pro-ko-mark')!;
    tick(m, 6000); // far past the real fall (1600 ms) with the menu still open
    expect(Number(wash.style.opacity)).toBe(0);
    expect(Number(mark.style.opacity)).toBe(0);
    open = false;
    tick(m, 20);
    expect(Number(wash.style.opacity)).toBeLessThan(0.1); // it begins to settle, it does not appear whole
    tick(m, 80);
    expect(Number(mark.style.opacity)).toBe(0); // the mark waits 120 ms after the wash starts
    tick(m, 900);
    expect(Number(wash.style.opacity)).toBeCloseTo(0.9, 1);
    expect(Number(mark.style.opacity)).toBe(1);
  });

  it('a menu that opens after the marks are up does not pull them down (nothing in flight is cancelled)', () => {
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
    const m = new ProFieldMarks('ffx2');
    m.setProjector(() => ({ x: 500, y: 800 }));
    m.sync(state({ rikku: false }));
    tick(m, 2500);
    const wash = m.el.querySelector<HTMLElement>('.pro-ko-wash')!;
    expect(Number(wash.style.opacity)).toBeCloseTo(0.9, 1);
    setMenuHold(() => true);
    tick(m, 500);
    expect(Number(wash.style.opacity)).toBeCloseTo(0.9, 1);
  });

  it('with no menu (FFX, or no probe) the timeline is the real fall as before', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const m = new ProFieldMarks('ffx');
    m.setProjector(() => ({ x: 400, y: 700 }));
    m.sync(state({ tidus: false }));
    const wash = m.el.querySelector<HTMLElement>('.pro-ko-wash')!;
    tick(m, 900);
    expect(Number(wash.style.opacity)).toBe(0);
    tick(m, 700);
    expect(Number(wash.style.opacity)).toBeGreaterThan(0.5);
  });
});

describe("M4: REDUCE MOTION takes the KO mark's pop away", () => {
  it('under a reduce-motion preference the KO mark appears at its rest size, never at the 1.4x pop', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const mq = (matches: boolean) => (q: string) => ({ matches: matches && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
    for (const [reduce, expectPop] of [[false, true], [true, false]] as const) {
      window.matchMedia = mq(reduce);
      const m = new ProFieldMarks('ffx');
      m.setProjector(() => ({ x: 400, y: 700 }));
      m.sync(state({ tidus: false }));
      const mark = m.el.querySelector<HTMLElement>('.pro-ko-mark')!;
      let biggest = 0;
      for (let t = 0; t < 2000; t += 10) {
        m.update(0.01);
        const s = /scale\(([\d.]+)\)/.exec(mark.style.transform)?.[1];
        if (s) biggest = Math.max(biggest, Number(s));
      }
      if (expectPop) expect(biggest).toBeGreaterThan(1.05);
      else expect(biggest).toBe(1);
    }
  });
});

describe('M6: a rebuilt low-HP row takes the pulse up where it was', () => {
  it('the phase is the page clock modulo the pulse, so two builds a moment apart carry the same cycle point', () => {
    expect(PULSE_MS).toBe(1200);
    expect(rowMarkStyle('low', 1300)).toBe(';--pro-phase:-100ms');
    expect(rowMarkStyle('low', 100)).toBe(rowMarkStyle('low', 1300)); // one full pulse later: the same phase
    expect(rowMarkStyle('low', 0)).toBe(';--pro-phase:-0ms');
    expect(rowMarkStyle('ko', 500)).toBe('');
    expect(rowMarkStyle(null, 500)).toBe('');
  });

  it("a low FFX row carries it in its style; a healthy row's style is exactly today's", () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const c = (hp: number): Record<string, unknown> => ({ id: 'tidus', name: 'Tidus', side: 'party', hp, mp: 115, alive: hp > 0, statuses: {}, stats: { maxHp: 2420, maxMp: 115 }, overdrive: { gauge: 20 }, portraitKey: 'tidus', spriteKey: 'tidus' });
    const row = (hp: number): HTMLElement => {
      const w = new PartyStatusWindow();
      w.render(['tidus'], { tidus: c(hp) } as never, null);
      return w.el.querySelector<HTMLElement>('.ig-stat')!;
    };
    expect(row(290).getAttribute('style')).toMatch(/--pro-phase:-\d+ms/);
    expect(row(2420).getAttribute('style')).toBe('margin-right:calc(var(--ig-stat-step) * 0)');
  });
});

describe('M2: the flag, the redrawn drawings and the plates that stand aside', () => {
  function cursor(chrome: 'ffx' | 'ffx2'): TargetCursor {
    const c = new TargetCursor();
    c.setChrome(chrome);
    c.setProjector(() => BOSS);
    document.body.append(c.el);
    return c;
  }

  it('the damage line is the first clause of the help text, upper case, kept short', () => {
    expect(proHelpLine('Physical damage')).toBe('PHYSICAL DAMAGE');
    expect(proHelpLine('Fire damage · Hits one enemy')).toBe('FIRE DAMAGE');
    expect(proHelpLine('Restores HP. Hits one ally.')).toBe('RESTORES HP');
    expect(proHelpLine('')).toBe('');
    expect(proHelpLine(undefined)).toBe('');
    expect(proHelpLine('A very long description of an unusually wordy command goes here').length).toBeLessThanOrEqual(30);
  });

  it('on: the flag reads TARGET, the name and the damage line, in both games; the pro drawings are the ones drawn', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const f = cursor('ffx');
    f.setHelpLine('Physical damage');
    f.showSingle([ENTRY]);
    const plate = f.el.querySelector<HTMLElement>('.ffx-target__plate')!;
    expect(plate.querySelector('.ffx-target__lbl')!.textContent).toBe('TARGET');
    expect(plate.querySelector('.ffx-target__line .ffx-target__name')!.textContent).toBe('Seymour Flux');
    expect(plate.querySelector('.ffx-target__help')!.textContent).toBe('PHYSICAL DAMAGE');
    expect(f.el.querySelector('.ffx-target__hand svg')!.classList.contains('pro-glove')).toBe(true);
    f.setHelpLine('Fire damage · Hits one enemy'); // the help arrives after the cursor opens: the flag is drawn again
    expect(f.el.querySelector('.ffx-target__help')!.textContent).toBe('FIRE DAMAGE');

    setDemoChapter('ffx2-bahamut');
    const x = cursor('ffx2');
    x.setHelpLine('Physical damage');
    x.showSingle([ENTRY]);
    expect(x.el.querySelector('.ffx-target__plate .ffx-target__help')!.textContent).toBe('PHYSICAL DAMAGE');
    expect(x.el.querySelector('.ffx-target__flower svg')!.classList.contains('pro-ring')).toBe(true);
    expect(x.el.querySelector('.ffx-target__hand')).toBeNull(); // the two chromes are never mixed
  });

  it("off (the default): today's one-line plate and today's drawings, whatever help line is set", () => {
    const f = cursor('ffx');
    f.setHelpLine('Physical damage');
    f.showSingle([ENTRY]);
    const plate = f.el.querySelector<HTMLElement>('.ffx-target__plate')!;
    expect(plate.querySelector('.ffx-target__lbl')).toBeNull();
    expect(plate.querySelector('.ffx-target__help')).toBeNull();
    expect(f.el.querySelector('.ffx-target__hand svg')!.classList.contains('pro-glove')).toBe(false);
    const x = cursor('ffx2');
    x.showSingle([ENTRY]);
    expect(x.el.querySelector('.ffx-target__flower svg')!.classList.contains('pro-ring')).toBe(false);
  });

  it('the top TARGET plate of FFX stands aside while the pro markers play, and shows again with them off', () => {
    const p = new FfxTargetPlate(true);
    p.show(['Seymour Flux']);
    expect(p.el.hidden).toBe(false);
    setProMode('pro');
    setDemoChapter('seymour-flux');
    p.show(['Seymour Flux']);
    expect(p.el.hidden).toBe(true);
    setProPiece('markers', false);
    p.show(['Seymour Flux']);
    expect(p.el.hidden).toBe(false);
  });

  it('the drawings are real SVG with the hooks the stylesheet and the checks look for', () => {
    expect(PRO_HAND_SVG).toContain('viewBox="0 0 120 52"');
    expect(PRO_HAND_SVG).toContain('proGloveGold'); // the gold cuff
    expect(PRO_FLOWER_SVG).toContain('viewBox="0 0 100 100"');
    expect((PRO_FLOWER_SVG.match(/<path /g) ?? []).length).toBe(12); // six petals, each an ink under-stroke and a light edge
    expect(PRO_FLOWER_SVG).toContain('rgba(8,4,22,0.46)'); // the dark backing disc
  });
});

describe("M4 and m3: the game's own settings reach the new motion (the stylesheets)", () => {
  const css = readFileSync('src/ui/common/pro-markers.css', 'utf8');
  const numbers = readFileSync('src/ui/common/pro-numbers.css', 'utf8');

  it("the pulse stops under the game's REDUCE MOTION, LOW EFFECTS and REDUCE FLASHES rows and the Danger pulse's off switch, not only the OS query", () => {
    for (const attr of ['data-reduce-motion', 'data-low-effects', 'data-reduce-flashes', "data-danger-pulse='off'"]) {
      expect(css).toContain(`html[${attr}] .ffxhud .ig-stat--pro-low`);
      expect(css).toContain(`html[${attr}] .ffx2hud .ig-stat--pro-low`);
    }
    expect(css).toContain('prefers-reduced-motion: reduce');
  });

  it("the glove's bob and the ring's turn stop under REDUCE MOTION and LOW EFFECTS too, and the critical glint is hidden under all three rows", () => {
    expect(css).toContain('html[data-reduce-motion] .ffx-targeting--pro .ffx-target__hand');
    expect(css).toContain('html[data-low-effects] .ffx-targeting--pro .ffx-target__flower');
    expect(numbers).toContain('html[data-reduce-motion] .dnum-glint, html[data-low-effects] .dnum-glint, html[data-reduce-flashes] .dnum-glint');
  });

  it("the pulse and FFX's own hurt flash run together on one row (the flash used to outrank the glow)", () => {
    expect(css).toMatch(/\.ffxhud \.ig-stat--pro-low\.ffx-stat--hurt \{\s*animation: ffx-hurt-flash 0\.3s ease, pro-low-pulse 1\.2s ease-in-out infinite;/);
    expect(css).toContain('animation-delay: var(--pro-phase, 0ms)');
  });

  it("the Danger pulse's off key reads the address", () => {
    expect(dangerPulseFromSearch('?dangerpulse=off')).toBe('off');
    expect(dangerPulseFromSearch('?pack=demo')).toBe('on');
    expect(dangerPulseFromSearch(undefined)).toBe('on');
  });
});

describe('m2: the critical stance breathes under the pro markers (L1-A / L4-A)', () => {
  it('a figure in the critical pose takes the book\'s slow, deeper breath; any other pose, the piece off and REDUCE MOTION leave it alone', async () => {
    const { CRITICAL_BREATH, proCriticalBreath } = await import('../../src/engine/look/pro/ProBreath.ts');
    const { eyeCandy } = await import('../../src/engine/fx/EyeCandy.ts');
    expect(CRITICAL_BREATH.amplitude).toBe(0.03);
    expect(1 / CRITICAL_BREATH.speed).toBeCloseTo(2.4, 6);
    expect(proCriticalBreath('critical')).toBeNull(); // off (the default)
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
    expect(proCriticalBreath('critical')).toBe(CRITICAL_BREATH);
    expect(proCriticalBreath('idle')).toBeNull();
    const env = eyeCandy.env;
    eyeCandy.env = () => ({ ...env(), reduceMotion: true });
    try {
      expect(proCriticalBreath('critical')).toBeNull();
    } finally {
      eyeCandy.env = env;
    }
    setProPiece('markers', false);
    expect(proCriticalBreath('critical')).toBeNull();
  });
});

describe("m1: the pro arena's rig terms write the grade pass's own uniform bag (a run in the browser caught the cone written to the bold pass's)", () => {
  it('applyProGrade and applyProCone work on the real grade shader uniforms for both rooms, and the rig hands them the grade pass', async () => {
    const { UniformsUtils, Vector2 } = await import('three');
    const { GradeShader } = await import('../../src/engine/shaders/GradeShader.ts');
    const { PRO_ARENA } = await import('../../src/engine/look/pro/ProGrade.ts');
    const { applyProCone, applyProGrade } = await import('../../src/engine/look/pro/ProRigTerms.ts');
    for (const [key, room] of Object.entries(PRO_ARENA)) {
      const g = UniformsUtils.clone(GradeShader.uniforms) as Record<string, { value: unknown }>;
      applyProGrade(g, room, {});
      expect(g['grain']!.value).toBe(room.grain);
      expect(g['vignette']!.value).toBe(room.vignette.amount);
      const scratch = new Vector2();
      applyProCone(g, room, { lightUv: new Vector2(0.2, 0.7), aspect: 16 / 9, time: 0.5, k: 1, camera: {} as never, scratch, project: (_c, out, at) => out.set(at.u, 1 - at.v) });
      const col = g['uConeCol']!.value as { w: number };
      expect(col.w).toBeCloseTo(room.cone!.strength, 6); // the cone is on, at the room's strength (${key})
      applyProCone(g, undefined, { lightUv: scratch, aspect: 1, time: 0, k: 1, camera: {} as never, scratch, project: () => undefined });
      expect(col.w).toBe(0); // no pro room: the cone goes off
    }
    const rig = readFileSync('src/engine/look/LookRig.ts', 'utf8');
    expect(rig).toContain('applyProCone(g, proR,'); // the grade pass's bag (`g`), not the bold pass's (`u`)
    expect(rig.split(/\r?\n/).length).toBeLessThanOrEqual(400); // house rule 7
  });
});
