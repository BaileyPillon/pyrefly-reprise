// @vitest-environment jsdom
/**
 * The battle HUD on an upright phone, option B "compact rail" (Bailey,
 * 2026-09-25; target docs/concepts/layout/phone-battle-hud/sheet.jpg row B;
 * preflight docs/plans/phone-battle-hud-review.md). Game case: both (shared
 * plumbing, each game's canon in its own half).
 *
 * jsdom has no layout, so this checks what it can: the mode switch follows the
 * media query and only it sets `html[data-phone-battle]`; the chrome's Back and
 * Confirm send Escape and Enter through `window` (the path a key press takes);
 * a swipe steps the cursor; the advisor line is the advisor's own switch; the
 * wrapper mounts and unmounts with the HUD; each game's reader pulls the right
 * words; and no phone stylesheet can reach a desktop window or print under the
 * 14 px floor (CHK-003). The layout itself is checked in a real browser at
 * 390x844 and 360x780 (docs/screenshots/phone-battle-hud/).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { confirmLabel, installPhoneBattle, PHONE_BATTLE_QUERY, targetHint, withPhoneLayout, type PhoneBattleText } from '../../src/ui/common/phoneBattle.ts';
import { readFfxPhone } from '../../src/ui/ffx/phoneHud.ts';
import { readFfx2Phone } from '../../src/ui/ffx2/phoneHud.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { DamageNumbers } from '../../src/ui/common/DamageNumbers.ts';
import { ZanmatoGauge } from '../../src/ui/ffx/ZanmatoGauge.ts';

type Listener = (e: { matches: boolean }) => void;
let mqMatches = false;
let mqListeners: Listener[] = [];

function stubMatchMedia(): void {
  mqListeners = [];
  (window as unknown as { matchMedia: unknown }).matchMedia = (query: string) => ({
    media: query,
    get matches() { return mqMatches; },
    addEventListener: (_: string, fn: Listener) => mqListeners.push(fn),
    removeEventListener: (_: string, fn: Listener) => { mqListeners = mqListeners.filter((l) => l !== fn); },
  });
}

function flip(on: boolean): void {
  mqMatches = on;
  for (const l of [...mqListeners]) l({ matches: on });
}

const TEXT: PhoneBattleText = {
  actor: 'Tidus', help: 'Physical damage', command: 'Attack', target: 'Mortiorchis',
  targetHp: '', targetFace: '', targeting: false, ally: false, sensor: false,
};

function hudRoot(cls = 'ffxhud'): HTMLElement {
  const hud = document.createElement('div');
  hud.className = cls;
  hud.dataset['role'] = cls === 'ffxhud' ? 'ffx-hud' : 'ffx2-hud';
  document.body.appendChild(hud);
  return hud;
}

function keysOn(win: Window): string[] {
  const seen: string[] = [];
  win.addEventListener('keydown', (e) => seen.push((e as KeyboardEvent).code));
  return seen;
}

beforeEach(() => {
  document.body.innerHTML = '';
  delete document.documentElement.dataset['phoneBattle'];
  mqMatches = false;
  stubMatchMedia();
});
afterEach(() => {
  delete document.documentElement.dataset['phoneBattle'];
});

describe('labels', () => {
  it('names the command and the target on Confirm', () => {
    expect(confirmLabel({ command: 'Attack', target: 'Mortiorchis' })).toBe('Attack → Mortiorchis');
    expect(confirmLabel({ command: '', target: 'Yuna' })).toBe('Confirm → Yuna');
    expect(confirmLabel({ command: '', target: '' })).toBe('Confirm');
  });
  it('calls the FFX-2 party "girls" and FFX\'s "allies" (rule 14)', () => {
    expect(targetHint('ffx2', true)).toContain('girl');
    expect(targetHint('ffx', true)).toContain('ally');
    expect(targetHint('ffx', false)).toContain('enemy');
    expect(targetHint('ffx2', false)).toContain('enemy');
  });
  it('is an upright phone only: under 600 px wide and portrait', () => {
    expect(PHONE_BATTLE_QUERY).toContain('max-width: 599px');
    expect(PHONE_BATTLE_QUERY).toContain('orientation: portrait');
  });
});

describe('installPhoneBattle', () => {
  it('stays off (no html attribute, no step) when the window is not an upright phone', () => {
    const hud = hudRoot();
    const pb = installPhoneBattle(hud, 'ffx', () => TEXT);
    expect(pb.active).toBe(false);
    expect(document.documentElement.dataset['phoneBattle']).toBeUndefined();
    expect(hud.dataset['phoneStep']).toBeUndefined();
    pb.destroy();
  });

  it('turns on with the query, marks the game, prints the footer, and cleans up', () => {
    mqMatches = true;
    const hud = hudRoot();
    let resized = 0;
    window.addEventListener('resize', () => resized++);
    const pb = installPhoneBattle(hud, 'ffx', () => TEXT);
    expect(pb.active).toBe(true);
    expect(document.documentElement.dataset['phoneBattle']).toBe('ffx');
    expect(resized).toBeGreaterThan(0);
    expect(hud.dataset['phoneStep']).toBe('menu');
    expect(hud.querySelector('.phud-foot__who')?.textContent).toBe('Tidus');
    expect(hud.querySelector('.phud-foot__help')?.textContent).toBe('Physical damage');
    // The panel and shade sit under everything the HUD draws.
    expect(hud.firstElementChild?.className).toBe('phud-panel');
    pb.destroy();
    expect(document.documentElement.dataset['phoneBattle']).toBeUndefined();
    expect(hud.querySelector('[class^="phud-"]')).toBeNull();
    expect(hud.dataset['phoneStep']).toBeUndefined();
  });

  it('follows the query when the phone turns sideways and back', () => {
    mqMatches = true;
    const hud = hudRoot('ffx2hud');
    const pb = installPhoneBattle(hud, 'ffx2', () => TEXT);
    expect(document.documentElement.dataset['phoneBattle']).toBe('ffx2');
    flip(false);
    expect(pb.active).toBe(false);
    expect(document.documentElement.dataset['phoneBattle']).toBeUndefined();
    flip(true);
    expect(pb.active).toBe(true);
    expect(document.documentElement.dataset['phoneBattle']).toBe('ffx2');
    pb.destroy();
  });

  it('shows the target step: card, hint and a Confirm that names the move', () => {
    mqMatches = true;
    const hud = hudRoot('ffx2hud');
    const text = { ...TEXT, command: 'Cure', target: 'Yuna', targetHp: 'HP 690 / 690', targeting: true, ally: true };
    const pb = installPhoneBattle(hud, 'ffx2', () => text);
    expect(hud.dataset['phoneStep']).toBe('target');
    expect(hud.querySelector('.phud-card__name')?.textContent).toBe('Yuna');
    expect(hud.querySelector('.phud-card__hp')?.textContent).toBe('HP 690 / 690');
    expect(hud.querySelector('.phud-target__hint')?.textContent).toContain('girl');
    expect(hud.querySelector('.phud-target__go')?.textContent).toBe('Cure → Yuna');
    pb.destroy();
  });

  it('Back and Confirm send Escape and Enter through window, the path a key press takes', () => {
    mqMatches = true;
    const hud = hudRoot();
    const seen = keysOn(window);
    const pb = installPhoneBattle(hud, 'ffx', () => ({ ...TEXT, targeting: true }));
    hud.querySelector<HTMLButtonElement>('.phud-target__back')!.click();
    hud.querySelector<HTMLButtonElement>('.phud-target__go')!.click();
    expect(seen).toEqual(['Escape', 'Enter']);
    pb.destroy();
  });

  it('a swipe across the field steps the cursor, only in the target step', () => {
    mqMatches = true;
    const hud = hudRoot();
    const seen = keysOn(window);
    let targeting = true;
    const pb = installPhoneBattle(hud, 'ffx', () => ({ ...TEXT, targeting }));
    const touch = (type: string, x: number, y: number): void => {
      const e = new Event(type);
      const list = [{ clientX: x, clientY: y }];
      Object.defineProperty(e, type === 'touchend' ? 'changedTouches' : 'touches', { value: list });
      window.dispatchEvent(e);
    };
    touch('touchstart', 300, 200);
    touch('touchend', 200, 205);
    touch('touchstart', 100, 200);
    touch('touchend', 200, 195);
    // A short move is a tap, and a vertical one is a scroll.
    touch('touchstart', 100, 200);
    touch('touchend', 120, 200);
    touch('touchstart', 100, 200);
    touch('touchend', 150, 320);
    expect(seen).toEqual(['ArrowRight', 'ArrowLeft']);
    targeting = false;
    pb.refresh();
    touch('touchstart', 300, 200);
    touch('touchend', 200, 200);
    expect(seen).toEqual(['ArrowRight', 'ArrowLeft']);
    pb.destroy();
  });

  it('a tap on the advisor line is the advisor\'s own switch (no floating HIDE MOVES tab)', () => {
    mqMatches = true;
    const hud = hudRoot();
    hud.innerHTML = '<div class="mad"><button class="mad__toggle"></button><div class="mad__card"><span class="mad__line">Hastega</span></div></div>';
    let toggled = 0;
    hud.querySelector('.mad__toggle')!.addEventListener('click', () => toggled++);
    const pb = installPhoneBattle(hud, 'ffx', () => TEXT);
    hud.querySelector<HTMLElement>('.mad__line')!.click();
    expect(toggled).toBe(1);
    pb.destroy();
    hud.querySelector<HTMLElement>('.mad__line')!.click();
    expect(toggled).toBe(1);
  });

  it('GUIDE opens the guide as a sheet and switches the guide on only if it was off', () => {
    mqMatches = true;
    const hud = hudRoot();
    hud.innerHTML = '<div class="sgd sgd--off"><button class="sgd__toggle"></button></div>';
    let turnedOn = 0;
    hud.querySelector('.sgd__toggle')!.addEventListener('click', () => {
      turnedOn++;
      hud.querySelector('.sgd')!.classList.remove('sgd--off');
    });
    const pb = installPhoneBattle(hud, 'ffx', () => TEXT);
    const guide = hud.querySelector<HTMLButtonElement>('.phud-guide')!;
    guide.click();
    expect(hud.dataset['phoneGuide']).toBe('open');
    guide.click();
    expect(hud.dataset['phoneGuide']).toBe('closed');
    guide.click();
    expect(turnedOn).toBe(1);
    pb.destroy();
  });
});

describe('withPhoneLayout', () => {
  it('installs on the HUD\'s own mount and takes it off on unmount', () => {
    mqMatches = true;
    const root = document.createElement('div');
    document.body.appendChild(root);
    const port = {
      mount(r: HTMLElement) {
        const el = document.createElement('div');
        el.dataset['role'] = 'ffx-hud';
        el.className = 'ffxhud';
        r.appendChild(el);
      },
      unmount() {
        root.innerHTML = '';
      },
    } as unknown as HudPort;
    let installs = 0;
    const wrapped = withPhoneLayout(port, (el) => {
      installs++;
      return installPhoneBattle(el, 'ffx', () => TEXT);
    });
    wrapped.mount(root);
    expect(installs).toBe(1);
    expect(root.querySelector('.phud-foot')).not.toBeNull();
    expect(document.documentElement.dataset['phoneBattle']).toBe('ffx');
    wrapped.unmount();
    expect(document.documentElement.dataset['phoneBattle']).toBeUndefined();
    expect(root.innerHTML).toBe('');
  });
});

describe('readers', () => {
  it('FFX: the acting name, the aimed command, the live bracket, the row\'s HP and face', () => {
    const hud = hudRoot();
    hud.innerHTML = `
      <div class="ig-stat ig-stat--acting" data-actor="tidus"><span class="ig-stat__name">Tidus</span>
        <span class="ig-stat__value">2420 / 2420</span><span class="ig-stat__value ig-stat__value--mp">115</span></div>
      <div class="ig-stat" data-actor="yuna"><div class="ig-stat__face"><img src="/art/yuna.png"></div><span class="ig-stat__name">Yuna</span>
        <span class="ig-stat__value">1500 /  1500</span></div>
      <div class="ffx-cmd-area"><div class="ig-cmd ig-cmd--selected"><span class="ffx-cmd__label">Cure</span></div></div>
      <div class="ffx-cmd-info"><span data-role="text">Restores HP</span></div>
      <div class="ffx-targeting">
        <div class="ffx-target ffx-target--dim" data-target-id="tidus"></div>
        <div class="ffx-target" data-target-id="yuna"><div class="ffx-target__plate"><span class="ffx-target__name">Yuna</span></div></div>
      </div>`;
    const t = readFfxPhone(hud);
    expect(t).toMatchObject({ actor: 'Tidus', help: 'Restores HP', command: 'Cure', target: 'Yuna', targetHp: 'HP 1500 / 1500', targetFace: '/art/yuna.png', targeting: true, ally: true, sensor: false });
  });

  it('FFX: the Sensor card stands in for the target card when it names an enemy target', () => {
    const hud = hudRoot();
    hud.innerHTML = `
      <div class="ffx-sensor"><b class="ffx-sensor__name">Mortiorchis</b><span class="ffx-sensor__hp">HP 4000 / 4000</span></div>
      <div class="ffx-targeting"><div class="ffx-target ffx-target--enemy" data-target-id="m"><div class="ffx-target__plate"><span class="ffx-target__name">Mortiorchis</span></div></div></div>`;
    const t = readFfxPhone(hud);
    expect(t.sensor).toBe(true);
    expect(t.ally).toBe(false);
    expect(t.targetHp).toBe('HP 4000 / 4000');
  });

  it('FFX-2: no turn list to read; the girl\'s row gives HP and face, the plate the name', () => {
    const hud = hudRoot('ffx2hud');
    hud.innerHTML = `
      <div class="ig-stat ig-stat--acting" data-actor-id="yuna"><img class="ffx2stat__face-img" src="/art/yuna2.png">
        <span class="ig-stat__name">Yuna</span><span class="ig-stat__value">690 / 690</span></div>
      <div class="ffx2hud__command"><div class="ig-cmd ig-cmd--selected"><span class="ffx2cmd__label">Cure</span></div></div>
      <div class="ffx2-cmd-info__desc">Restores HP</div>
      <div class="ffx2-tplate__name">Yuna</div>
      <div class="ffx-targeting"><div class="ffx-target" data-target-id="yuna"></div></div>`;
    const t = readFfx2Phone(hud);
    expect(t).toMatchObject({ actor: 'Yuna', help: 'Restores HP', command: 'Cure', target: 'Yuna', targetHp: 'HP 690 / 690', targetFace: '/art/yuna2.png', targeting: true, ally: true, sensor: false });
  });
});

describe('the two hooks outside the phone modules', () => {
  const box = (w: number, h: number) => (): DOMRect => ({ x: 0, y: 0, left: 0, top: 0, right: w, bottom: h, width: w, height: h, toJSON: () => ({}) }) as DOMRect;

  it("damage numerals are drawn 1:1 on the phone HUD, not at the 640x360 grid's 0.56x", () => {
    const size = (): string => {
      const root = document.createElement('div');
      document.body.appendChild(root);
      const n = new DamageNumbers({ root, project: () => ({ x: 180, y: 200 }), scale: () => 360 / 640 });
      n.mount();
      n.el.getBoundingClientRect = box(360, 780);
      const el = n.spawnEvent({ type: 'damage', targetId: 'boss', amount: 245 });
      const px = el?.style.fontSize ?? '';
      n.unmount();
      return px;
    };
    const desktop = parseFloat(size());
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    const phone = parseFloat(size());
    expect(desktop).toBeLessThan(14);
    expect(phone).toBeGreaterThanOrEqual(14);
  });

  it("Yojimbo's gauge takes its phone layout on the phone HUD at 360x780 too", () => {
    const mount = (): ZanmatoGauge => {
      const host = document.createElement('div');
      const stage = document.createElement('div');
      host.append(stage);
      document.body.append(host);
      host.getBoundingClientRect = box(360, 780);
      const g = new ZanmatoGauge();
      g.mount(stage, host);
      return g;
    };
    const before = mount();
    expect(before.layoutMode).toBe('landscape');
    before.dispose();
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    const after = mount();
    expect(after.layoutMode).toBe('phone');
    after.dispose();
  });
});

describe('the phone stylesheets', () => {
  const FILES = [
    'src/ui/common/phone-battle.css',
    'src/ui/common/phone-battle-parts.css',
    'src/ui/ffx/phone-hud.css',
    'src/ui/ffx/phone-hud-parts.css',
    'src/ui/ffx2/phone-hud.css',
  ];
  const rules = (file: string): Array<{ sel: string; body: string }> => {
    const css = readFileSync(join(process.cwd(), file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const out: Array<{ sel: string; body: string }> = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(css))) out.push({ sel: m[1]!.trim(), body: m[2]! });
    return out;
  };

  it('never reach a desktop window: every selector is under html[data-phone-battle] or a phone-only element', () => {
    for (const file of FILES) {
      for (const { sel } of rules(file)) {
        for (const one of sel.split(',').map((s) => s.trim())) {
          const scoped = one.startsWith('html[data-phone-battle');
          const ownChrome = /^\.phud-[a-z-]+$/.test(one);
          expect(scoped || ownChrome, `${file}: ${one}`).toBe(true);
        }
      }
    }
  });

  it('print nothing under 14 px (CHK-003)', () => {
    for (const file of FILES) {
      for (const { sel, body } of rules(file)) {
        for (const m of body.matchAll(/font(?:-size)?\s*:[^;]*?(\d+(?:\.\d+)?)px/g)) {
          expect(Number(m[1]), `${file}: ${sel}`).toBeGreaterThanOrEqual(14);
        }
      }
    }
  });

  it('drop the floating HIDE MOVES tab and the G / E chips on the phone', () => {
    const all = FILES.map((f) => readFileSync(join(process.cwd(), f), 'utf8')).join('\n');
    expect(all).toMatch(/\.mad:not\(\.mad--off\) \.mad__toggle \{\s*display: none !important;/);
    expect(all).toMatch(/\.sgd__toggle \{\s*display: none !important;/);
    expect(all).toMatch(/\.eint:not\(\.eint--off\) \.eint__toggle \{\s*display: none !important;/);
  });

  it('the battle screen wraps both games\' HUDs', () => {
    const src = readFileSync(join(process.cwd(), 'src/app/screens/BattleScreenWiring.ts'), 'utf8');
    expect(src).toContain('withPhoneLayout(new FFXBattleHud(), installFfxPhoneHud)');
    expect(src).toContain('withPhoneLayout(new FFX2BattleHud(), installFfx2PhoneHud)');
  });
});
