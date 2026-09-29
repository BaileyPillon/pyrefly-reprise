// @vitest-environment jsdom
/**
 * **Sin on an upright phone** (FFX only; CHECK 4 findings C4-1 and C4-5, r30).
 *
 * - C4-1: at 390x844 the NEAR Fin was out of frame (the slice that keeps the party whole showed sky and a claw tip)
 *   and the FAR cores fell just off the slice. On the phone, while a Fin is bound, the range director dollies and
 *   pans the range's rigs and stands the Fin at its phone spot (`PhoneStaging`, `evrae-airship-subjects.ts`).
 * - C4-5: in Chapter XVIII the clock's slab sat across the party. It now sits above the party chips, and the
 *   director takes `SIN_FACE_PHONE` in link 4 so the party's feet stay above it.
 * - The HUD reads the flags on every event of a burst (the ring said 13 while `sin.turnsLeft` said 12; the Left
 *   Fin's plate said only "NEAR" through the turn its core charged).
 *
 * The desktop, Evrae (Chapter VIII) and every other chapter are unchanged: asserted here on the same director.
 * The framing itself was measured in the running build (`docs/handoff/chapter-sin.md`, "r30 fix").
 */

import { Group, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AtbSnapshot, BattleEvent, BattleState, TurnPreview } from '../../../src/battle/common/types.ts';
import { AirshipRangeDirector } from '../../../src/scenes/evrae-airship-director.ts';
import {
  LEFT_FIN_SUBJECT,
  RIGHT_FIN_SUBJECT,
  SIN_FACE_PHONE,
  evraeSubject,
  phoneRig,
  stagingOf,
} from '../../../src/scenes/evrae-airship-subjects.ts';
import { EVRAE_WORLD_HEIGHT, RANGE_STAGING, type RigNumbers } from '../../../src/scenes/evrae-airship-range.ts';
import type { AirshipDeck } from '../../../src/scenes/evrae-airship-sky.ts';
import { LightRig } from '../../../src/engine/Lighting.ts';
import { resetArtManifest, setArtManifest, type ArtManifest } from '../../../src/engine/ArtManifest.ts';
import { withSinHud, type SinHud } from '../../../src/ui/ffx/SinHud.ts';
import type { HudPort } from '../../../src/engine/HudPort.ts';
import { sinFinsCoreBuild } from '../../../src/data/ffx/builds/sin-fahrenheit.ts';
import { sinLeftFinGroup, sinRightFinGroup } from '../../../src/data/ffx/enemies/sin-fins.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { content, defend, newEngine } from '../helpers/sinUnits.ts';

const palette = { sky: 0x6d8fbd, horizon: 0xc7d3e6, ground: 0x7a8394, key: 0xffe0b0, bounce: 0x8894a8 };
function fakeDeck(): AirshipDeck {
  return { group: new Group(), layers: [], wind: 1, setHaze(): void {}, update(): void {}, dispose(): void {} } as unknown as AirshipDeck;
}
function fakeActor() {
  return {
    pose: 'idle',
    u: { rimStrength: { value: 0.7 } },
    extents: { maxExtent: 2.2, minExtent: 0.5, proneAspect: 1.15 },
    lifeState: 'alive',
    position: new Vector3(),
    scale: new Vector3(1, 1, 1),
    poseSize: [10, 5] as [number, number],
    setAlpha(): void {},
    async loadPoses(): Promise<void> {},
  };
}
function sinManifest(): ArtManifest {
  const subject = (states: string[]) => ({ states: [...states].sort(), portrait: false, facing: 'front' as const });
  const fin = subject(['idle', 'idle-near', 'idle-far', 'charge-near', 'charge-far']);
  return { version: 1, generatedAt: 'test', subjects: { 'sin-left-fin': fin, 'sin-right-fin': fin, evrae: subject(['idle', 'idle-far', 'breath-charge']) }, portraits: [], backdrops: [], pause: [], pause2x: [] } as unknown as ArtManifest;
}
/** A camera that records the rigs the director installs. */
function fakeCamera() {
  const rigs = new Map<string, RigNumbers>();
  return {
    rigs,
    rigName: 'idle',
    addRig: (name: string, rig: RigNumbers) => rigs.set(name, rig),
    snapTo: vi.fn(),
    moveTo: vi.fn(async () => undefined),
  };
}
function setPhone(on: boolean): void {
  window.matchMedia = ((q: string) => ({ matches: on, media: q })) as unknown as typeof window.matchMedia;
}
async function settle(): Promise<void> {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

afterEach(() => {
  resetArtManifest();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe('the phone staging data (C4-1, C4-5)', () => {
  it('phoneRig dollies about the aim, then pans and tilts the aim; no staging is the rig itself', () => {
    const rig: RigNumbers = { position: [0, 2, 10], lookAt: [1, 1, 0], fov: 34, sway: 0.7 };
    expect(phoneRig(rig, undefined)).toBe(rig);
    expect(phoneRig(rig, { dolly: 1.5, pan: -2, tilt: -0.5 })).toEqual({ position: [-0.5, 2.5, 15], lookAt: [-1, 0.5, 0], fov: 34, sway: 0.7 });
  });

  it('both Fins carry a phone spot at both ranges; Evrae has none, so the phone stages Evrae as the desktop', () => {
    for (const fin of [LEFT_FIN_SUBJECT, RIGHT_FIN_SUBJECT]) {
      expect(fin.phone?.near?.spot).toBeDefined();
      expect(fin.phone?.far?.spot).toBeDefined();
      expect(stagingOf(fin, 'near', false)).toEqual({ spot: fin.spot.near, nearScale: fin.nearScale });
      expect(stagingOf(fin, 'near', true).nearScale).toBeCloseTo(fin.phone!.near!.height! / EVRAE_WORLD_HEIGHT, 9);
    }
    const evrae = evraeSubject();
    expect(evrae.phone).toBeUndefined();
    for (const range of ['near', 'far'] as const) expect(stagingOf(evrae, range, true)).toEqual(stagingOf(evrae, range, false));
    expect(SIN_FACE_PHONE).toEqual({ far: { tilt: -0.5 }, near: { dolly: 1.3 } });
  });
});

describe('the range director on the phone and on the desktop', () => {
  it('phone + Left Fin: the phone rigs and spot at NEAR and FAR; the Right Fin its own; link 3 puts the range rigs back', async () => {
    setArtManifest(sinManifest());
    setPhone(true);
    const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
    const cam = fakeCamera();
    director.bindCamera(cam as never);
    expect(cam.rigs.get('idle')).toEqual(RANGE_STAGING.near.rigs.idle); // Evrae until a Fin is bound
    const actor = fakeActor();
    await director.bindEvrae(actor as never, 'left-fin');
    expect(cam.rigs.get('idle')).toEqual(phoneRig(RANGE_STAGING.near.rigs.idle, LEFT_FIN_SUBJECT.phone!.near));
    expect(actor.position.toArray()).toEqual([...LEFT_FIN_SUBJECT.phone!.near!.spot]);
    expect(actor.scale.x).toBeCloseTo(LEFT_FIN_SUBJECT.phone!.near!.height! / EVRAE_WORLD_HEIGHT, 9);
    director.setRange('far', { immediate: true });
    await settle();
    expect(cam.rigs.get('idle')).toEqual(phoneRig(RANGE_STAGING.far.rigs.idle, LEFT_FIN_SUBJECT.phone!.far));
    expect(actor.position.toArray()).toEqual([...LEFT_FIN_SUBJECT.phone!.far!.spot]);

    const right = fakeActor();
    await director.bindEvrae(right as never, 'right-fin');
    expect(cam.rigs.get('idle')).toEqual(phoneRig(RANGE_STAGING.far.rigs.idle, RIGHT_FIN_SUBJECT.phone!.far));
    expect(right.position.toArray()).toEqual([...RIGHT_FIN_SUBJECT.phone!.far!.spot]);

    await director.bindEvrae(null); // link 3: no Fin
    expect(cam.rigs.get('idle')).toEqual(RANGE_STAGING.far.rigs.idle);
  });

  it('desktop + Left Fin: the range rigs and the desktop spot exactly as before', async () => {
    setArtManifest(sinManifest());
    setPhone(false);
    const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
    const cam = fakeCamera();
    director.bindCamera(cam as never);
    const actor = fakeActor();
    await director.bindEvrae(actor as never, 'left-fin');
    expect(cam.rigs.get('idle')).toEqual(RANGE_STAGING.near.rigs.idle);
    expect(actor.position.toArray()).toEqual([...LEFT_FIN_SUBJECT.spot.near]);
    director.stageFace(SIN_FACE_PHONE); // Chapter XVIII's call is inert off the phone
    expect(cam.rigs.get('idle')).toEqual(RANGE_STAGING.near.rigs.idle);
  });

  it('Chapter VIII on the phone: Evrae keeps the range rigs and its spot (unchanged)', async () => {
    setArtManifest(sinManifest());
    setPhone(true);
    const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
    const cam = fakeCamera();
    director.bindCamera(cam as never);
    const actor = fakeActor();
    await director.bindEvrae(actor as never);
    expect(cam.rigs.get('idle')).toEqual(RANGE_STAGING.near.rigs.idle);
    expect(actor.position.toArray()).toEqual([...RANGE_STAGING.near.evrae]);
    director.setRange('far', { immediate: true });
    expect(cam.rigs.get('idle')).toEqual(RANGE_STAGING.far.rigs.idle);
  });

  it('Chapter XVIII on the phone: SIN_FACE_PHONE at both ranges, and nothing bound', async () => {
    setPhone(true);
    const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
    const cam = fakeCamera();
    director.bindCamera(cam as never);
    await director.bindEvrae(null);
    director.setRange('far', { immediate: true });
    director.stageFace(SIN_FACE_PHONE);
    expect(cam.rigs.get('idle')).toEqual(phoneRig(RANGE_STAGING.far.rigs.idle, SIN_FACE_PHONE.far));
    director.setRange('near', { immediate: true });
    expect(cam.rigs.get('idle')).toEqual(phoneRig(RANGE_STAGING.near.rigs.idle, SIN_FACE_PHONE.near));
    director.stageFace(null);
    expect(cam.rigs.get('idle')).toEqual(RANGE_STAGING.near.rigs.idle);
  });
});

// ---------------------------------------------------------------------------
// The HUD reads the flags on the turn they change
// ---------------------------------------------------------------------------

/** A bare FFX HUD for `withSinHud`, as the Sin HUD test builds one. */
function tappedHud() {
  const el = document.createElement('div');
  const stage = document.createElement('div');
  stage.className = 'ffxhud__stage';
  el.append(stage);
  const base = {
    el,
    mount: (root: HTMLElement) => root.append(el),
    unmount: () => el.remove(),
    sync: (_s: BattleState, _p: TurnPreview[] | AtbSnapshot) => undefined,
    onEvent: (_e: BattleEvent) => undefined,
  } as unknown as HudPort & { el: HTMLElement };
  const hud = withSinHud(base);
  hud.mount(document.body);
  return { hud, sin: (hud as unknown as { sinHud: SinHud }).sinHud };
}

describe('the clock and the plate follow the flags event by event (the ring said 13 while the flag said 12)', () => {
  it("Chapter XVIII, by the engine: the ring shows Sin's new count at the first event of Sin's own turn", () => {
    const { hud, sin } = tappedHud();
    const e = newEngine(1);
    hud.sync(e.state() as BattleState, []);
    expect(sin.view().clock?.left).toBe(13);
    let checked = false;
    for (let i = 0; i < 400 && !checked; i++) {
      const before = e.state().flags['sin.turnsLeft'];
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      const events = d.kind === 'player-input' ? e.submit(defend()) : d.kind === 'resolved' ? d.events : [];
      const after = e.state().flags['sin.turnsLeft'];
      if (after !== before && events.length > 0) {
        // Before: the widget still shows the old count (the full sync comes after the burst has played).
        expect(sin.view().clock?.left).toBe(before);
        hud.onEvent(events[0]!); // the presenter hands the HUD each event as it starts to play
        expect(sin.view().clock?.left).toBe(after);
        expect(sin.clockEl.querySelector('.ffx-sinclock__num')?.textContent).toBe(String(after));
        checked = true;
      }
      hud.sync(e.state() as BattleState, []);
    }
    expect(checked).toBe(true);
  });

  it('both Fins, by the engine: the plate shows "Core charged" at the first event of the turn that charges it', () => {
    for (const group of [sinLeftFinGroup, sinRightFinGroup]) {
      const { hud, sin } = tappedHud();
      const e = createFFXEngine({ content, autoResolveMinigames: true });
      e.init({ game: 'ffx', party: sinFinsCoreBuild, enemies: group, triggers: [], seed: 3, condition: 'normal', canEscape: false });
      hud.sync(e.state() as BattleState, []);
      let checked = false;
      for (let i = 0; i < 600 && !checked; i++) {
        const before = e.state().flags['sin.fin.charged'] === true;
        const d = e.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') {
          // Close in when the order is offered (the core charges only at NEAR), else Defend.
          const close = d.commands.find((c) => c.command.kind === 'trigger' && (c.command as { id?: string }).id === 'close-in' && c.enabled);
          e.submit(close ? close.command : defend());
          hud.sync(e.state() as BattleState, []);
          continue;
        }
        const events = d.kind === 'resolved' ? d.events : [];
        const after = e.state().flags['sin.fin.charged'] === true;
        if (!before && after && events.length > 0) {
          expect(sin.view().fin?.line).not.toBe('charged');
          hud.onEvent(events[0]!);
          expect(sin.view().fin).toMatchObject({ range: 'near', charged: true, line: 'charged' });
          expect(sin.finEl.textContent).toContain('Core charged');
          checked = true;
        }
        hud.sync(e.state() as BattleState, []);
      }
      expect(checked, group.id).toBe(true);
      hud.unmount();
    }
  });

  it('never takes a piece away mid-burst: a battle that has just ended keeps the clock until the full sync', () => {
    const { hud, sin } = tappedHud();
    const e = newEngine(1);
    const state = e.state() as BattleState;
    hud.sync(state, []);
    (state as { result: unknown }).result = { outcome: 'defeat' };
    hud.onEvent({ type: 'defeat' } as unknown as BattleEvent);
    expect(sin.el.hidden).toBe(false);
    hud.sync(state, []);
    expect(sin.el.hidden).toBe(true);
  });
});
