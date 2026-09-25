/**
 * The Oversoul look, option B (`docs/concepts/chapters/trema/oversoul/README.md`),
 * and the moment it comes on.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Oversoul exists only in FFX-2;
 * Oversoul Paragon (Chapter XIII) is the only form built.
 *
 * The moment is proved on the real FFX-2 engine (rule 3): Oversoul Paragon's own
 * event log is fed to the looks. That block needs the Oversoul formation to be
 * registered (`ffx2-cloister-paragon-oversoul`); the rest runs on a stand-in
 * figure, because `PaintedActor` needs a DOM canvas to build (its noise map).
 */
import { describe, expect, it } from 'vitest';
import { Color, Group, Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three';
import type { AnyCombatant, BattleEvent, BattleState, Command } from '../../src/battle/common/types.ts';
import {
  OVERSOUL_CAPTION,
  isOversoulForm,
  oversoulCaptionOf,
  oversoulIds,
  oversoulNameOf,
  oversoulTriggeredBy,
} from '../../src/engine/OversoulMoment.ts';
import { OVERSOUL_LOOK, OversoulLook, OversoulLooks, withOversoulLook, type OversoulFigure } from '../../src/engine/OversoulLook.ts';
import { paintedFragmentShader } from '../../src/engine/shaders/PaintedShader.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { FFX2_TREMA } from '../../src/data/chapter-ffx2-trema.ts';

// ------------------------------------------------------------------ helpers

/** A painted figure's shape: two planes sharing the actor's cells, as `PaintedActor` builds them. */
class Figure extends Group implements OversoulFigure {
  alpha = 1;
  readonly height: number;
  readonly cells = {
    desaturate: { value: 0 },
    dissolve: { value: 0 },
    rimColor: { value: new Color(0xbfe0ff) },
    rimStrength: { value: 0.8 },
    rimDir: { value: new Vector2(-1, 0.32) },
  };
  readonly mats: ShaderMaterial[];
  constructor(height = 4.1) {
    super();
    this.height = height;
    this.mats = [0, 1].map(() => new ShaderMaterial({ uniforms: { ...this.cells }, fragmentShader: paintedFragmentShader }));
    for (const m of this.mats) this.add(new Mesh(new PlaneGeometry(1, 1), m));
  }
  setRimLight(colour: number | string, strength: number): void {
    this.cells.rimColor.value.set(colour as never);
    this.cells.rimStrength.value = strength;
  }
}

function castOf(f: Figure): number {
  return (f.mats[0]!.uniforms['castAmount'] as { value: number }).value;
}

/** A combatant as the engines build one: the enemy fields sit under `enemy`. */
function enemy(id: string, name: string, aiScriptId: string, extra: Record<string, unknown> = {}, forms?: unknown[]): AnyCombatant {
  const record = { aiScriptId, formIndex: 0, forms: forms ?? [{ name, spriteKey: id, hp: 1 }] };
  return { id, name, side: 'enemy', removed: false, enemy: record, ...extra } as unknown as AnyCombatant;
}

function stateWith(...cs: AnyCombatant[]): BattleState {
  return { combatants: Object.fromEntries(cs.map((c) => [c.id, c])) } as unknown as BattleState;
}

const OVERSOUL_LINE: BattleEvent = { seq: 1, type: 'message', text: 'Paragon oversouls!', kind: 'system' };

// ------------------------------------------------------------------ the moment

describe('OversoulMoment (pure)', () => {
  it('knows the Oversoul form by its AI script, not by name or sprite (the name does not change)', () => {
    expect(isOversoulForm(enemy('paragon', 'Paragon', 'paragon-oversoul'))).toBe(true);
    expect(isOversoulForm(enemy('paragon', 'Paragon', 'paragon'))).toBe(false);
    expect(isOversoulForm({ ...enemy('p', 'P', 'paragon-oversoul'), side: 'party' } as never)).toBe(false);
    expect(isOversoulForm(null)).toBe(false);
    expect(isOversoulForm({ id: 'x', side: 'enemy' } as never)).toBe(false);
    // A form's own script wins over the enemy's.
    expect(isOversoulForm(enemy('x', 'X', 'x', {}, [{ name: 'X', spriteKey: 'x', hp: 1, aiScriptId: 'paragon-oversoul' }]))).toBe(true);
  });

  it('lists only the Oversoul forms still on the field', () => {
    const s = stateWith(
      enemy('paragon', 'Paragon', 'paragon-oversoul'),
      enemy('trema', 'Trema', 'trema'),
      enemy('gone', 'Gone', 'paragon-oversoul', { removed: true }),
    );
    expect(oversoulIds(s)).toEqual(['paragon']);
    expect(oversoulIds(null)).toEqual([]);
  });

  it('reads the engine line as the moment and captions it "Oversoul!"', () => {
    expect(oversoulNameOf(OVERSOUL_LINE)).toBe('Paragon');
    expect(oversoulCaptionOf(OVERSOUL_LINE)).toEqual({ name: 'Paragon', chip: 'Oversoul!' });
    expect(OVERSOUL_CAPTION).toBe('Oversoul!');
    expect(oversoulNameOf({ seq: 2, type: 'message', text: 'Rikku stole Supreme Gem!', kind: 'system' })).toBeNull();
    expect(oversoulNameOf({ seq: 3, type: 'action-start', actorId: 'paragon' } as BattleEvent)).toBeNull();
  });

  it('triggers the named Oversoul form at the line, and the form itself on its first action', () => {
    const s = stateWith(enemy('paragon', 'Paragon', 'paragon-oversoul'), enemy('trema', 'Trema', 'trema'));
    expect(oversoulTriggeredBy(OVERSOUL_LINE, s)).toEqual(['paragon']);
    expect(oversoulTriggeredBy({ seq: 4, type: 'action-start', actorId: 'paragon' } as BattleEvent, s)).toEqual(['paragon']);
    expect(oversoulTriggeredBy({ seq: 5, type: 'action-start', actorId: 'trema' } as BattleEvent, s)).toEqual([]);
    // Normal Paragon: the same events turn nothing blue.
    const normal = stateWith(enemy('paragon', 'Paragon', 'paragon'));
    expect(oversoulTriggeredBy(OVERSOUL_LINE, normal)).toEqual([]);
    expect(oversoulTriggeredBy(OVERSOUL_LINE, null)).toEqual([]);
  });
});

// ------------------------------------------------------------------ the shader

describe('PaintedShader: the blue cast term', () => {
  it('is option A\'s term, compiled only under PAINTED_CAST, just before the quiet dim', () => {
    const src = paintedFragmentShader;
    for (const u of ['uniform vec3 castColor;', 'uniform float castAmount;', 'uniform float castGain;']) expect(src).toContain(u);
    // Every cast line sits inside a PAINTED_CAST block, so no other figure's program changes.
    const outside = src.replace(/#ifdef PAINTED_CAST[\s\S]*?#endif/g, '');
    expect(outside).not.toMatch(/cast(Color|Amount|Gain)/);
    const cast = src.indexOf('if (castAmount > 0.0)');
    expect(cast).toBeGreaterThan(src.indexOf('// --- flash'));
    expect(cast).toBeLessThan(src.indexOf('// --- the quiet dim'));
    expect(src).toContain('pow(lc, 0.85) * castColor * castGain');
    expect(/\bcast\b\s*=/.test(src)).toBe(false); // `cast` is reserved in GLSL ES
  });
});

// ------------------------------------------------------------------ the look

describe('OversoulLook (option B on one figure)', () => {
  it('adds the cast cells at 0 and changes nothing until it is turned on', () => {
    const scene = new Group();
    const f = new Figure();
    scene.add(f);
    const look = new OversoulLook(f);
    expect(castOf(f)).toBe(0);
    expect(f.mats[1]!.uniforms['castAmount']).toBe(f.mats[0]!.uniforms['castAmount']); // one cell, both planes
    for (const m of f.mats) expect(m.defines['PAINTED_CAST']).toBe('');
    look.update(5);
    expect(castOf(f)).toBe(0);
    expect(f.cells.rimStrength.value).toBe(0.8);
    expect(look.field).toBeNull();
  });

  it('fades in to option B: cast 0.8 in #6fa8ff at gain 2.2, rim #7cc4ff at 0.7, 70 blue motes around the figure', () => {
    const scene = new Group();
    const f = new Figure();
    f.position.set(1, 0, -2);
    scene.add(f);
    const look = new OversoulLook(f);
    look.turnOn();
    expect(castOf(f)).toBe(0);
    look.update(OVERSOUL_LOOK.fadeMs / 2000);
    expect(castOf(f)).toBeGreaterThan(0);
    expect(castOf(f)).toBeLessThan(0.8);
    look.update(OVERSOUL_LOOK.fadeMs / 1000);
    expect(castOf(f)).toBeCloseTo(0.8, 6);
    expect((f.mats[0]!.uniforms['castColor'] as { value: Color }).value.getHex()).toBe(0x6fa8ff);
    expect((f.mats[0]!.uniforms['castGain'] as { value: number }).value).toBe(2.2);
    expect(f.cells.rimColor.value.getHex()).toBe(0x7cc4ff);
    expect(f.cells.rimStrength.value).toBeCloseTo(0.7, 6);
    const motes = look.field!;
    expect(motes.parent).toBe(scene);
    expect(motes.geometry.getAttribute('position').count).toBe(70);
    motes.position.toArray().forEach((v, i) => expect(v).toBeCloseTo([1, 2.2, -1.7][i]!, 6));
    // Every mote is one of the README's five colours.
    const palette = OVERSOUL_LOOK.motes.colors.map((c) => new Color(c));
    const col = motes.geometry.getAttribute('aColor');
    for (let i = 0; i < col.count; i++) {
      expect(palette.some((p) => Math.abs(p.r - col.getX(i)) < 1e-6 && Math.abs(p.g - col.getY(i)) < 1e-6 && Math.abs(p.b - col.getZ(i)) < 1e-6)).toBe(true);
    }
  });

  it('keeps the motes with the figure: they follow it, fade with its alpha and its KO dissolve, and scale with its height', () => {
    const scene = new Group();
    const f = new Figure(8.2);
    scene.add(f);
    const look = new OversoulLook(f);
    look.turnOn(true);
    look.update(0.016);
    const u = (look.field!.material as ShaderMaterial).uniforms;
    expect(u['uOpacity']!.value).toBeCloseTo(0.95, 6);
    expect(look.field!.position.y).toBeCloseTo(4.4, 6); // lift 2.2 at twice the reference height
    f.position.x = 3;
    f.alpha = 0.5;
    look.update(0.016);
    expect(look.field!.position.x).toBe(3);
    expect(u['uOpacity']!.value).toBeCloseTo(0.475, 6);
    f.cells.dissolve.value = 1;
    look.update(0.016);
    expect(u['uOpacity']!.value).toBe(0);
    expect(look.field!.visible).toBe(false);
  });

  it('puts the painting back and frees the motes on dispose', () => {
    const scene = new Group();
    const f = new Figure();
    scene.add(f);
    const look = new OversoulLook(f);
    look.turnOn(true);
    look.update(0.1);
    look.dispose();
    expect(castOf(f)).toBe(0);
    expect(f.cells.rimColor.value.getHex()).toBe(0xbfe0ff);
    expect(f.cells.rimStrength.value).toBeCloseTo(0.8, 6);
    expect(scene.children).toEqual([f]);
    look.turnOn(true);
    expect(castOf(f)).toBe(0);
  });
});

describe('OversoulLooks (the field)', () => {
  function fieldOf(figures: Record<string, Figure>) {
    return () => ({ actor: (id: string) => figures[id] });
  }

  it('does nothing for normal Paragon, and lights Oversoul Paragon only at its moment', () => {
    const scene = new Group();
    const figures = { paragon: new Figure() };
    scene.add(figures.paragon);
    const looks = new OversoulLooks(fieldOf(figures));
    looks.sync(stateWith(enemy('paragon', 'Paragon', 'paragon')));
    looks.onEvent(OVERSOUL_LINE);
    looks.update(2);
    expect(looks.get('paragon')).toBeUndefined();
    expect(figures.paragon.mats[0]!.uniforms['castAmount']).toBeUndefined();
    expect(figures.paragon.mats[0]!.defines?.['PAINTED_CAST']).toBeUndefined();

    looks.sync(stateWith(enemy('paragon', 'Paragon', 'paragon-oversoul')));
    looks.update(2);
    expect(looks.get('paragon')?.isOn).toBe(false);
    expect(castOf(figures.paragon)).toBe(0);
    looks.onEvent(OVERSOUL_LINE);
    looks.update(2);
    expect(castOf(figures.paragon)).toBeCloseTo(0.8, 6);
  });

  it('gives a restaged figure a fresh look, already lit, and lets the old one go', () => {
    const scene = new Group();
    const figures: Record<string, Figure> = { paragon: new Figure() };
    scene.add(figures.paragon!);
    const looks = new OversoulLooks(fieldOf(figures));
    looks.sync(stateWith(enemy('paragon', 'Paragon', 'paragon-oversoul')));
    looks.onEvent(OVERSOUL_LINE);
    looks.update(2);
    const old = figures.paragon!;
    figures.paragon = new Figure();
    scene.add(figures.paragon);
    looks.update(0.016);
    expect(castOf(old)).toBe(0);
    expect(castOf(figures.paragon)).toBeCloseTo(0.8, 6);
    looks.dispose();
    expect(castOf(figures.paragon)).toBe(0);
  });
});

describe('withOversoulLook (the HUD tap)', () => {
  it('returns the same HUD and still calls every wrapped method through', () => {
    const calls: string[] = [];
    const hud = {
      mount: () => calls.push('mount'),
      unmount: () => calls.push('unmount'),
      sync: () => calls.push('sync'),
      syncVitals: () => calls.push('syncVitals'),
      onEvent: () => void calls.push('onEvent'),
      update: () => calls.push('update'),
      chooseCommand: async () => ({ kind: 'defend', targets: [] }) as Command,
      openMinigame: async () => ({}) as never,
      setVisible: () => undefined,
      setProjector: () => undefined,
    } as unknown as HudPort;
    const tapped = withOversoulLook(hud, () => null);
    expect(tapped).toBe(hud);
    tapped.sync(stateWith(), [] as never);
    tapped.syncVitals!(stateWith());
    expect(tapped.onEvent(OVERSOUL_LINE)).toBeUndefined();
    tapped.update!(0.016);
    tapped.unmount();
    expect(calls).toEqual(['sync', 'syncVitals', 'onEvent', 'update', 'unmount']);
  });
});

// ------------------------------------------------------------------ the real engine

const OVERSOUL_GROUP = data.ENEMY_GROUPS_BY_ID['ffx2-cloister-paragon-oversoul'];

describe.skipIf(!OVERSOUL_GROUP)('the real FFX-2 engine: Oversoul Paragon turns blue at its Oversoul line', () => {
  it('stays as painted until the engine says "Paragon oversouls!", then fades in', () => {
    const engine = new FFX2Engine({
      abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
      items: itemRegistryFrom(Object.values(data.ITEMS)),
      dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
      garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
      minigames: false,
      atbMode: 'wait',
    });
    engine.setSeed(1);
    const party = FFX2_TREMA.buildRef;
    engine.init({ game: 'ffx2', party, enemies: OVERSOUL_GROUP!, triggers: [], seed: 1, condition: 'normal', canEscape: false });
    const scene = new Group();
    const figures: Record<string, Figure> = { paragon: new Figure() };
    scene.add(figures.paragon!);
    const looks = new OversoulLooks(() => ({ actor: (id: string) => figures[id] }));
    looks.sync(engine.state());
    expect(oversoulIds(engine.state())).toEqual(['paragon']);

    let seen = 0;
    let line: BattleEvent | undefined;
    for (let i = 0; i < 4000 && !line; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      const from = engine.state().log.length;
      if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      const events = engine.state().log.slice(from);
      for (const e of events) {
        if (oversoulNameOf(e)) {
          expect(castOf(figures.paragon!)).toBe(0); // nothing blue before the line
          line = e;
        }
        looks.onEvent(e);
        seen++;
      }
      looks.update(0.05);
    }
    expect(line, `no Oversoul line in ${seen} events`).toBeDefined();
    looks.update(2);
    expect(castOf(figures.paragon!)).toBeCloseTo(0.8, 6);
    expect(oversoulCaptionOf(line!)).toEqual({ name: 'Paragon', chip: 'Oversoul!' });
  });
});
