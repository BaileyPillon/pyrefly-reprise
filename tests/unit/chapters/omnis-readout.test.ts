// @vitest-environment jsdom
/**
 * **Chapter XII — the disc strip (O-2 B), the intent line (O-4 C) and the red
 * glow as a live effect (O-8).** Bailey adopted every Chapter XII
 * recommendation (D-145); the frames are `docs/concepts/chapters/omnis/
 * o2-discs/b-frame.jpg`, `o4-fight/c-{i,ii,iii}.jpg` and `o1-omnis/
 * a-glow-frame.jpg`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The fight's states come from the
 * real engine on the real Chapter XII data (hard rule 3) wherever the claim is
 * about the fight; the last blocks are the absence tests.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { Color, Group, Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three';
import type { BattleEngine, BattleEvent, BattleState } from '../../../src/battle/common/types.ts';
import { DISC_RING, OMNIS_STATE, omnisDiscs } from '../../../src/battle/ffx/ai/seymour-omnis-rules.ts';
import {
  COLOUR_ORDER_NOTE,
  STRIP_GRID,
  affinityRows,
  intentText,
  omnisIntent,
  volleyOf,
} from '../../../src/ui/ffx/omnisReadoutModel.ts';
import { OmnisReadout, sensorLift, withOmnisReadout } from '../../../src/ui/ffx/OmnisReadout.ts';
import { OMNIS_READOUT_SELECTORS, INTENT_AVOID_SELECTORS, CHAPTER_PANEL_SELECTORS } from '../../../src/ui/ffx/hudAvoidSelectors.ts';
import { OMNIS_GLOW, OMNIS_GLOW_ID, OMNIS_STATE_FLAG, OmnisGlow, OmnisGlowLook, isOmnisGlowLine, omnisGlowsIn, type OmnisGlowFigure } from '../../../src/engine/OmnisGlowLook.ts';
import { paintedFragmentShader } from '../../../src/engine/shaders/PaintedShader.ts';
import { DISC_LAYOUT, GARDEN_IDS } from '../../../src/scenes/garden-of-pain.ts';
import { makeFakeBattleState } from '../../../src/ui/ffx/testFixtures.ts';
import type { HudPort } from '../../../src/engine/HudPort.ts';
import { OMNIS, actor, drive, flags, inputFor, lineUp, makeInvincible, newEngine } from '../helpers/omnisUnits.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');

/** The three sentences on the picked frames (`scripts/gen_mock.py` STATES), word for word. */
const FRAME_I = 'Every disc shows Fire: four Firaga next. He absorbs Fire and is weak to Ice.';
const FRAME_II = 'He glows red: Dispel on the party, then Ultima. After it, every disc turns to the next element.';
const FRAME_III = 'One disc turned to Thunder: three Firaga and one Thundara next. Ice no longer hurts him extra.';

function hitUntil(e: BattleEngine, stop: (e: BattleEngine) => boolean): void {
  drive(e, () => ({ kind: 'ability', id: 'test-hit-500', targets: [OMNIS] }), stop);
}

function mountReadout(): { readout: OmnisReadout; stage: HTMLElement; host: HTMLElement } {
  const host = document.createElement('div');
  host.className = 'ffxhud ig';
  const stage = document.createElement('div');
  stage.className = 'ffxhud__stage';
  host.append(stage);
  document.body.append(host);
  const readout = new OmnisReadout();
  readout.mount(stage, host);
  return { readout, stage, host };
}

afterEach(() => {
  document.body.innerHTML = '';
  delete document.documentElement.dataset['phoneBattle'];
});

// ------------------------------------------------------------------ the words

describe('the intent line says what the frames say (O-4 C), from the real engine', () => {
  it('turn one (c-i): every disc on Fire, four Firaga, absorbs Fire, weak to Ice', () => {
    const e = newEngine(1);
    const { readout } = mountReadout();
    readout.sync(e.state() as BattleState);
    const v = readout.view()!;
    expect(intentText(v.intent)).toBe(FRAME_I);
    expect(v.chips.map((c) => c.name)).toEqual(['Fire', 'Fire', 'Fire', 'Fire']);
    expect(v.affinity).toEqual([{ label: 'Absorbs', elements: ['fire'] }, { label: 'Weak', elements: ['ice'] }]);
    expect(v.glow).toBe(false);
    // The frame's gold words.
    expect(v.intent.filter((r) => r.bold).map((r) => r.text)).toEqual(['Fire', 'Firaga', 'weak to Ice']);
  });

  it("a turned disc (c-iii): Lulu's Blizzara turns the upper-left disc to Thunder; the line and the strip follow the event", () => {
    const e = newEngine(2, lineUp(['wakka', 'lulu', 'tidus']));
    makeInvincible(e);
    const { readout, stage } = mountReadout();
    readout.sync(e.state() as BattleState);
    inputFor(e, 'lulu');
    readout.sync(e.state() as BattleState);
    const events = e.submit({ kind: 'ability', id: 'blizzara', targets: ['mortiphasm-1'] });
    for (const ev of events) readout.onEvent(ev);
    const v = readout.view()!;
    expect(intentText(v.intent)).toBe(FRAME_III);
    // Upper-left chip, outlined (the frame's white outline); the strip's rows say absorbs Fire, halves Thunder.
    expect(v.chips[0]).toMatchObject({ index: 0, name: 'Thunder', turned: true });
    expect(v.affinity).toEqual([{ label: 'Absorbs', elements: ['fire'] }, { label: 'Halves', elements: ['lightning'] }]);
    expect(stage.querySelectorAll('.ffx-omr__chip--turned').length).toBe(1);
    expect(stage.querySelector('.ffx-omr__strip')?.textContent).toContain('Halves');
    // His next turn spends the lesson: the line stops saying "turned".
    readout.onEvent({ seq: 0, type: 'action-start', actorId: OMNIS, command: { kind: 'ability', id: 'omnis-volley', targets: [] }, abilityId: 'omnis-volley', targets: [] } as BattleEvent);
    expect(intentText(readout.view()!.intent)).toBe('The discs show three Fire and one Thunder: three Firaga and one Thundara next.');
  });

  it("Wakka's blow turns a disc left, to Water (B8's ring, our estimate): Watera, and Ice no longer hurts him extra", () => {
    const e = newEngine(2, lineUp(['wakka', 'lulu', 'tidus']));
    makeInvincible(e);
    const { readout } = mountReadout();
    readout.sync(e.state() as BattleState);
    inputFor(e, 'wakka');
    for (const ev of e.submit({ kind: 'attack', targets: ['mortiphasm-1'] })) readout.onEvent(ev);
    expect(intentText(readout.view()!.intent)).toBe('One disc turned to Water: three Firaga and one Watera next. Ice no longer hurts him extra.');
  });

  it('the glow (c-ii): six attacks fill the counter; the line names Dispel, then Ultima; then Ultima alone; then the reset', () => {
    const e = newEngine(1);
    makeInvincible(e);
    const { readout } = mountReadout();
    readout.sync(e.state() as BattleState);
    hitUntil(e, (x) => flags(x)['omnis.state'] === 'red');
    const line = e.state().log.find((ev) => isOmnisGlowLine(ev))!;
    readout.onEvent(line); // the telegraph lights it on its own beat
    expect(intentText(readout.view()!.intent)).toBe(FRAME_II);
    expect(readout.view()!.glow).toBe(true);
    hitUntil(e, (x) => flags(x)['omnis.state'] === 'dispelled');
    readout.sync(e.state() as BattleState);
    expect(intentText(readout.view()!.intent)).toBe('He glows red: Ultima on the party next. After it, every disc turns to the next element.');
    hitUntil(e, (x) => flags(x)['omnis.state'] === 'reset-due');
    readout.sync(e.state() as BattleState);
    expect(intentText(readout.view()!.intent)).toBe('After Ultima, every disc turns to the next element on his next turn.');
    expect(readout.view()!.glow).toBe(false);
  });

  it('no line names a party member (B12: which disc hits whom is an estimate)', () => {
    const names = /Tidus|Yuna|Auron|Wakka|Lulu|Kimahri|Rikku|Valefor|Ifrit|Ixion|Shiva|Bahamut/;
    const all: string[] = [];
    for (const state of ['normal', 'red', 'dispelled', 'reset-due'] as const) {
      for (const discs of [['fire', 'fire', 'fire', 'fire'], ['water', 'fire', 'ice', 'lightning'], ['water', 'water', 'fire', 'fire']] as const) {
        for (const turned of [[], [0], [0, 2]]) all.push(intentText(omnisIntent({ discs, state, living: 3, turned, weakBefore: 'ice' })));
      }
    }
    for (const s of all) expect(s).not.toMatch(names);
  });

  it('the volley counts one spell per living member plus one; the first discs keep theirs (planOmnisVolley)', () => {
    expect(volleyOf(['fire', 'fire', 'fire', 'fire'], 3)).toEqual([['Firaga', 4]]);
    expect(volleyOf(['fire', 'fire', 'fire', 'fire'], 1)).toEqual([['Firaga', 2]]); // an aeon holds the field
    expect(volleyOf(['lightning', 'fire', 'fire', 'fire'], 2)).toEqual([['Firaga', 2], ['Thundara', 1]]);
    expect(volleyOf(['water', 'water', 'ice', 'lightning'], 3)).toEqual([['Watera', 2], ['Blizzara', 1], ['Thundara', 1]]);
  });

  it("two Water discs make him immune to Fire, not Water (B9, faithful): the strip says so", () => {
    expect(affinityRows(['water', 'water', 'ice', 'lightning'])).toEqual([
      { label: 'Immune', elements: ['fire'] },
      { label: 'Halves', elements: ['ice', 'lightning'] },
    ]);
  });
});

// ------------------------------------------------------------------ the strip

describe('the strip (O-2 B)', () => {
  it("its grid stands the discs as the Garden does: upper-left, upper-right, lower-left, lower-right", () => {
    const at = DISC_LAYOUT.at;
    const [ul, ur, ll, lr] = STRIP_GRID.map((i) => at[i]!);
    expect(ul!.dx).toBeLessThan(0);
    expect(ll!.dx).toBeLessThan(0);
    expect(ur!.dx).toBeGreaterThan(0);
    expect(lr!.dx).toBeGreaterThan(0);
    expect(ul!.dy).toBeGreaterThan(ll!.dy);
    expect(ur!.dy).toBeGreaterThan(lr!.dy);
    expect([...GARDEN_IDS.discs]).toEqual(['mortiphasm-1', 'mortiphasm-2', 'mortiphasm-3', 'mortiphasm-4']);
  });

  it('prints the colour-order label wherever it shows the colours (B8), and never restates the ring', () => {
    const { readout, stage } = mountReadout();
    readout.sync(newEngine(1).state() as BattleState);
    expect(stage.querySelector('.ffx-omr__note')?.textContent).toBe(COLOUR_ORDER_NOTE);
    expect(COLOUR_ORDER_NOTE).toMatch(/our estimate/);
    const src = readFileSync(join(ROOT, 'src/ui/ffx/omnisReadoutModel.ts'), 'utf8');
    expect(src).not.toMatch(/import[^;]*(DISC_RING|OMNIS_RESET_CYCLE)/); // the single constant stays in the rules
    expect(DISC_RING).toEqual(['fire', 'water', 'ice', 'lightning']);
  });

  it('landscape: the frame space (1600x900) scaled 0.4 into the grid; phone: into the HUD root, marked for the rail', () => {
    const { readout, stage, host } = mountReadout();
    readout.sync(newEngine(1).state() as BattleState);
    expect(readout.layoutMode).toBe('landscape');
    expect(readout.el.parentElement).toBe(stage);
    expect((readout.el.querySelector('.ffx-omr__frame') as HTMLElement).style.transform).toBe('scale(0.4)');
    expect(host.hasAttribute('data-omnis-readout')).toBe(true);
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    readout.sync(newEngine(1).state() as BattleState);
    expect(readout.layoutMode).toBe('phone');
    expect(readout.el.parentElement).toBe(host);
    expect(readout.stripEl.hasAttribute('data-phone-under-rail')).toBe(true);
    expect(readout.stripEl.querySelector('h4')?.textContent).toBe('Discs facing him');
  });

  it('the floating panels dodge it: the intent slab, the numerals and the coach (hudAvoidSelectors)', () => {
    for (const s of OMNIS_READOUT_SELECTORS) {
      expect(INTENT_AVOID_SELECTORS as readonly string[]).toContain(s);
      expect(CHAPTER_PANEL_SELECTORS as readonly string[]).toContain(s);
    }
  });

  it('lifts the Sensor plate clear of the intent line, and only when they share a column', () => {
    const r = (l: number, t: number, rr: number, b: number): DOMRectReadOnly => ({ left: l, top: t, right: rr, bottom: b, width: rr - l, height: b - t, x: l, y: t, toJSON: () => ({}) });
    // 1600x900 (2.5x): the open plate reaches 610, the line starts at 548.
    expect(sensorLift(r(1090, 415, 1340, 610), r(1084, 548, 1544, 640), 2.5)).toBe(-29);
    expect(sensorLift(r(1090, 415, 1340, 530), r(1084, 548, 1544, 640), 2.5)).toBe(0);
    expect(sensorLift(r(600, 415, 800, 610), r(1084, 548, 1544, 640), 2.5)).toBe(0);
    expect(sensorLift(null, r(1084, 548, 1544, 640), 2.5)).toBe(0);
  });
});

// ------------------------------------------------------------------ the glow

/** A painted figure's shape: two planes as `PaintedActor` builds them (the Oversoul test's stand-in). */
class Figure extends Group implements OmnisGlowFigure {
  alpha = 1;
  readonly height = 4.1;
  readonly mats = [0, 1].map(
    () =>
      new ShaderMaterial({
        uniforms: {
          map: { value: null }, opacity: { value: 1 }, desaturate: { value: 0 }, dissolve: { value: 0 },
          rimColor: { value: new Color(0xbfe0ff) }, rimStrength: { value: 0.8 }, rimDir: { value: new Vector2(-1, 0.3) },
        },
        fragmentShader: paintedFragmentShader,
      }),
  );
  constructor() {
    super();
    this.name = OMNIS_GLOW_ID;
    for (const m of this.mats) this.add(new Mesh(new PlaneGeometry(1, 1), m));
  }
}

describe('the red glow as a live effect (O-8)', () => {
  it("the tint and the halo are the picked frame's recipe (omnis_build.py red_glow)", () => {
    expect(OMNIS_GLOW.tint.amount).toBe(0.38);
    expect(OMNIS_GLOW.tint.offset.map((v) => Math.round(v * 255))).toEqual([150, 10, 20]);
    expect(OMNIS_GLOW.tint.slope).toEqual([0.4, 0.25, 0.25]);
    expect(OMNIS_GLOW.halo.alpha).toBe(0.85);
    expect(new Color(OMNIS_GLOW.halo.color).getHex()).toBe(0xff2828);
    expect(paintedFragmentShader).toMatch(/#ifdef PAINTED_GLOW[\s\S]*glowOffset \+ glowSlope \* lm/);
  });

  it('compiles into this figure only, pulses while on, fades after, and puts the painting back', () => {
    const scene = new Group();
    const fig = new Figure();
    scene.add(fig);
    const look = new OmnisGlowLook(fig);
    for (const m of fig.mats) {
      expect(m.defines).toHaveProperty('PAINTED_GLOW');
      expect(m.uniforms['glowAmount']).toBeDefined();
    }
    expect(fig.getObjectsByProperty('name', 'omnis-glow-halo')).toHaveLength(2);
    // The halo shares the plane's texture and opacity cells.
    const halo = fig.getObjectByName('omnis-glow-halo') as Mesh;
    expect((halo.material as ShaderMaterial).uniforms['map']).toBe(fig.mats[0]!.uniforms['map']);
    expect(look.amount).toBe(0);
    look.setOn(true);
    for (let i = 0; i < 40; i++) look.update(0.05);
    expect(look.amount).toBeGreaterThanOrEqual(OMNIS_GLOW.pulse.floor - 0.01);
    expect(look.field?.name).toBe('omnis-glow-embers');
    const seen = new Set<number>();
    for (let i = 0; i < 40; i++) {
      look.update(0.05);
      seen.add(Math.round(look.amount * 100));
    }
    expect(seen.size).toBeGreaterThan(5); // it breathes
    look.setOn(false);
    for (let i = 0; i < 40; i++) look.update(0.05);
    expect(look.amount).toBe(0);
    look.dispose();
    expect(fig.getObjectsByProperty('name', 'omnis-glow-halo')).toHaveLength(0);
    expect(scene.getObjectByName('omnis-glow-embers')).toBeUndefined();
  });

  it('follows the real fight: on at the telegraph, through Dispel, off after Ultima', () => {
    expect(OMNIS_STATE_FLAG).toBe(OMNIS_STATE);
    const e = newEngine(1);
    makeInvincible(e);
    const fig = new Figure();
    new Group().add(fig);
    const glow = new OmnisGlow(() => ({ actor: (id) => (id === OMNIS_GLOW_ID ? fig : undefined) }));
    glow.sync(e.state() as BattleState);
    expect(glow.current?.isOn).toBe(false);
    hitUntil(e, (x) => flags(x)['omnis.state'] === 'red');
    const line = e.state().log.find((ev) => isOmnisGlowLine(ev));
    expect(line).toBeDefined();
    glow.onEvent(line!);
    expect(glow.current?.isOn).toBe(true);
    hitUntil(e, (x) => flags(x)['omnis.state'] === 'dispelled');
    glow.sync(e.state() as BattleState);
    expect(glow.current?.isOn).toBe(true);
    hitUntil(e, (x) => flags(x)['omnis.state'] === 'reset-due');
    glow.sync(e.state() as BattleState);
    expect(glow.current?.isOn).toBe(false);
    expect(actor(e, OMNIS).hp).toBeGreaterThan(0);
  });

  it('omnisGlowsIn reads the state the rules keep', () => {
    expect(omnisGlowsIn({ flags: { 'omnis.state': 'red' } })).toBe(true);
    expect(omnisGlowsIn({ flags: { 'omnis.state': 'dispelled' } })).toBe(true);
    expect(omnisGlowsIn({ flags: { 'omnis.state': 'reset-due' } })).toBe(false);
    expect(omnisGlowsIn({ flags: {} })).toBe(false);
  });
});

// ------------------------------------------------------------------ absence (rule 14)

describe('absence: every other battle is untouched', () => {
  it('the read-out stays hidden without the Omnis disc state, and when the fight is decided', () => {
    const { readout, host } = mountReadout();
    readout.sync(makeFakeBattleState() as BattleState);
    expect(readout.el.hidden).toBe(true);
    expect(readout.view()).toBeNull();
    expect(host.hasAttribute('data-omnis-readout')).toBe(false);
    const st = newEngine(1).state() as BattleState;
    expect(omnisDiscs(st)).toHaveLength(4);
    readout.sync({ ...st, result: { outcome: 'victory' } } as unknown as BattleState);
    expect(readout.el.hidden).toBe(true);
  });

  it('no glow look is made for a battle without the Omnis state', () => {
    const fig = new Figure();
    new Group().add(fig);
    const glow = new OmnisGlow(() => ({ actor: () => fig }));
    glow.sync(makeFakeBattleState() as BattleState);
    glow.update(0.1);
    expect(glow.current).toBeNull();
    expect(fig.mats[0]!.defines ?? {}).not.toHaveProperty('PAINTED_GLOW');
  });

  it('the tap passes the HUD through: sync, events and unmount still reach it', () => {
    const calls: string[] = [];
    const el = document.createElement('div');
    const stage = document.createElement('div');
    stage.className = 'ffxhud__stage';
    el.append(stage);
    const hud = {
      el,
      mount: (root: HTMLElement) => { root.append(el); calls.push('mount'); },
      unmount: () => calls.push('unmount'),
      sync: () => calls.push('sync'),
      onEvent: () => { calls.push('event'); },
    } as unknown as HudPort & { el: HTMLElement };
    const tapped = withOmnisReadout(hud);
    expect(tapped).toBe(hud);
    tapped.mount(document.body);
    tapped.sync(makeFakeBattleState() as BattleState, []);
    tapped.onEvent({ seq: 0, type: 'message', text: 'x', kind: 'system' } as BattleEvent);
    tapped.unmount();
    expect(calls).toEqual(['mount', 'sync', 'event', 'unmount']);
    expect(stage.querySelector('.ffx-omr')).toBeNull();
  });

  it('the wiring puts the read-out and the glow on the FFX HUD only', () => {
    const src = readFileSync(join(ROOT, 'src/app/screens/BattleScreenWiring.ts'), 'utf8');
    expect(src).toContain('withOmnisReadout(withPhoneLayout(new FFXBattleHud(), installFfxPhoneHud))');
    expect(src).toMatch(/game === 'ffx2' \? withOversoulLook\(hud, field\) : withOmnisGlow\(withOmnisDiscs\(hud, field\), field\)/);
    expect(src).not.toMatch(/withOmnisReadout\(new FFX2BattleHud/);
  });
});
