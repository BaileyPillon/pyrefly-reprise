/**
 * **The figures' lights, built from the tuning table** (`./look.ts` `LOOK`; the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only): the studio's three suns and its grey world as three.js lights,
 * and the dimming of Chapter IV's own lights that would otherwise swamp them.
 *
 * - {@link figureLights}: `yrp-key`, `yrp-fill` and `yrp-rim` (directional, no shadow, standing along the world-space directions {@link frameALights} fixed from frame A's camera) and `yrp-ambient`. They are on the default
 *   layer and on `LAYER.figure`, because the floor's mirror draws that layer alone and a light that is not on it would leave the reflected figures unlit.
 * - {@link dimRoom}: the chamber's key, fill, rim and ambient scaled by `LOOK.room` once (they are not animated); its four rust practicals and the hole's uplight scaled by `LOOK.room` **every frame** after the scene's own
 *   update (the scene sets their flicker each frame, so a share set once would be lost). The chamber's key stops casting a shadow map: with Chapter IV's deck hidden (`./stageLook.ts`) nothing is left to receive it. The lights'
 *   own flicker, and the `practical` that flashes on a hit or a cast, are not touched.
 *
 * Needs three.js only; no DOM.
 */

import { AmbientLight, Color, DirectionalLight, HemisphereLight, LinearSRGBColorSpace, PointLight, type Light, type Object3D } from 'three';
import type { V3 } from './layout.ts';
import { LAYER, LOOK, SUNS, frameALights, type Rig, type SunName } from './look.ts';

/** How far a sun stands from the figures' middle: a directional light's direction is all that counts (no shadow, no falloff), this only keeps the helper's numbers sane. */
const SUN_DISTANCE = 20;
/** Where the suns look: the middle of the party's row at chest height. */
const SUN_TARGET: V3 = [3.4, 1.3, -1.0];

const linear = (c: V3): Color => new Color().setRGB(c[0], c[1], c[2], LinearSRGBColorSpace);

/** The figures' lights, from `rig` (the table's by default): three directional suns and the ambient. Add them (and each sun's `target`) to a scene group. */
export function figureLights(rig: Rig = LOOK.rig): Light[] {
  const { dir, colour, intensity } = frameALights(rig);
  const lights: Light[] = [];
  for (const name of SUNS) {
    const sun = new DirectionalLight(linear(colour[name]), intensity[name]);
    sun.name = `yrp-${name}`;
    sun.position.set(SUN_TARGET[0] + dir[name][0] * SUN_DISTANCE, SUN_TARGET[1] + dir[name][1] * SUN_DISTANCE, SUN_TARGET[2] + dir[name][2] * SUN_DISTANCE);
    sun.target.position.set(...SUN_TARGET);
    sun.castShadow = false;
    sun.layers.enable(LAYER.figure);
    lights.push(sun);
  }
  const ambient = new AmbientLight(linear(rig.ambient.colour), rig.ambient.intensity);
  ambient.name = 'yrp-ambient';
  ambient.layers.enable(LAYER.figure);
  lights.push(ambient);
  return lights;
}

/** What {@link dimRoom} found of the chamber's lights. */
export interface RoomLights {
  readonly key: DirectionalLight;
  readonly fill: HemisphereLight;
  readonly rim: DirectionalLight;
  readonly ambient: AmbientLight;
}

/** What dimming the room keeps, to apply every frame and to give back. */
export interface RoomDim {
  /** Once a frame, after the scene's own update: the practicals' and the hole's shares of the intensities the scene just set. */
  apply(): void;
  /** Put the chamber's lights back as they were. */
  restore(): void;
}

/**
 * Scale the chamber's own lights by `LOOK.room`. `lights` are the scene's rig (`SceneBuild.lights`), `group` the chamber's group (the practicals and the hole's uplight are found in it by name:
 * `practical-rust`, `hole-uplight`). The four named lights are scaled now; the rest by {@link RoomDim.apply}.
 */
export function dimRoom(group: Object3D, lights: RoomLights, room: Readonly<Record<'key' | 'fill' | 'rim' | 'ambient' | 'practicals' | 'hole', number>> = LOOK.room): RoomDim {
  const was = {
    key: lights.key.intensity,
    fill: lights.fill.intensity,
    rim: lights.rim.intensity,
    ambient: lights.ambient.intensity,
    shadow: lights.key.castShadow,
  };
  lights.key.intensity = was.key * room.key;
  lights.fill.intensity = was.fill * room.fill;
  lights.rim.intensity = was.rim * room.rim;
  lights.ambient.intensity = was.ambient * room.ambient;
  lights.key.castShadow = false;
  const practicals: PointLight[] = [];
  const holes: PointLight[] = [];
  group.traverse((o) => {
    const light = o as PointLight;
    if (!light.isPointLight) return;
    if (o.name === 'practical-rust') practicals.push(light);
    else if (o.name === 'hole-uplight') holes.push(light);
  });
  return {
    apply(): void {
      if (room.practicals !== 1) for (const p of practicals) p.intensity *= room.practicals;
      if (room.hole !== 1) for (const h of holes) h.intensity *= room.hole;
    },
    restore(): void {
      lights.key.intensity = was.key;
      lights.fill.intensity = was.fill;
      lights.rim.intensity = was.rim;
      lights.ambient.intensity = was.ambient;
      lights.key.castShadow = was.shadow;
    },
  };
}

/** Put `rig`'s numbers on lights `figureLights` made (a debug handle's live tuning, a dev server only): directions, colours and intensities; lights of other names are left alone. */
export function setRig(lights: readonly Light[], rig: Rig): void {
  const { dir, colour, intensity } = frameALights(rig);
  for (const light of lights) {
    const name = light.name.replace('yrp-', '');
    if ((SUNS as readonly string[]).includes(name)) {
      const s = name as SunName;
      const sun = light as DirectionalLight;
      sun.color.copy(linear(colour[s]));
      sun.intensity = intensity[s];
      sun.position.set(SUN_TARGET[0] + dir[s][0] * SUN_DISTANCE, SUN_TARGET[1] + dir[s][1] * SUN_DISTANCE, SUN_TARGET[2] + dir[s][2] * SUN_DISTANCE);
    } else if (name === 'ambient') {
      (light as AmbientLight).color.copy(linear(rig.ambient.colour));
      light.intensity = rig.ambient.intensity;
    }
  }
}
