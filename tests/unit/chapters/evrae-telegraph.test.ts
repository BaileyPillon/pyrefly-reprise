/**
 * **Inhale is shown in a real battle** — the breath-charge painting.
 *
 * Research §3.3 note 4: *Inhale* is a no-damage turn that exists only to give
 * the player one turn of warning before Poison Breath; §12.2: "the throat needs
 * a paintable charging state ... because Inhale is one of only two enemy
 * telegraphs in the whole anthology and the player has exactly one turn to act
 * on it". The art track painted `characters/evrae/breath-charge.png`, the
 * preview showed it, and a real battle never did: the live actor had only
 * idle/attack/cast/hurt/ko (critic, 2026-09-23).
 *
 * The range director already swaps Evrae's resting painting with the range
 * (idle-near / idle-far); it now also swaps it to the breath-charge painting
 * while `airship.breathCharged` stands at NEAR, and back when the breath is
 * spent or dodged. The engine flag is proved to rise on Inhale by the real
 * engine below.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { Group, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import type { BattleEngine } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { fahrenheitBuild } from '../../../src/data/ffx/builds/fahrenheit.ts';
import { LightRig } from '../../../src/engine/Lighting.ts';
import { AirshipRangeDirector } from '../../../src/scenes/evrae-airship-director.ts';
import { breathChargedOf } from '../../../src/scenes/evrae-airship-range.ts';
import type { AirshipDeck } from '../../../src/scenes/evrae-airship-sky.ts';

const palette = { sky: 0x6d8fbd, horizon: 0xc7d3e6, ground: 0x7a8394, key: 0xffe0b0, bounce: 0x8894a8 };

function fakeDeck(): AirshipDeck {
  return {
    group: new Group(),
    layers: [],
    haze: null as never,
    wind: 1,
    setHaze(): void {},
    update(): void {},
    dispose(): void {},
  } as unknown as AirshipDeck;
}

/** Just enough of a `PaintedActor` to watch which paintings it is handed. */
function fakeActor() {
  const loads: Array<Record<string, string>> = [];
  const actor = {
    pose: 'idle',
    u: { rimStrength: { value: 0.7 } },
    lifeState: 'alive',
    position: new Vector3(),
    scale: new Vector3(1, 1, 1),
    poseSize: [10, 10] as [number, number],
    setAlpha(): void {},
    async loadPoses(map: Record<string, string>): Promise<void> {
      loads.push({ ...map });
    },
  };
  return { actor, loads, idle: (): string => loads[loads.length - 1]?.['idle'] ?? '' };
}

const flags = (range: 'near' | 'far', charged: boolean) => ({
  flags: { 'airship.range': range, 'airship.breathCharged': charged },
});

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

describe('the Inhale telegraph', () => {
  it('the engine raises airship.breathCharged when Evrae inhales at NEAR', () => {
    const content = new FFXContentRegistry();
    content.addAbilities(ALL_ABILITIES);
    content.addItems(Object.values(ITEMS));
    const engine: BattleEngine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init({ game: 'ffx', party: fahrenheitBuild, enemies: ENEMY_GROUPS_BY_ID['evrae-airship']!, triggers: [], seed: 1, condition: 'normal', canEscape: false });
    let seen = false;
    for (let i = 0; i < 3000 && !seen; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      seen = breathChargedOf(engine.state());
    }
    expect(seen).toBe(true);
  });

  it('rests Evrae on the breath-charge painting while the breath is charged at NEAR, and back after', async () => {
    const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
    const { actor, idle } = fakeActor();
    await director.bindEvrae(actor as never);
    expect(idle()).toMatch(/\/idle\.png$/);

    director.sync(flags('near', true));
    await settle();
    expect(idle()).toMatch(/\/breath-charge\.png$/);

    director.sync(flags('near', false));
    await settle();
    expect(idle()).toMatch(/\/idle\.png$/);
  });

  it('keeps the FAR painting at FAR: the charge is a NEAR read (the breath whiffs out of range, §3.3 note 4)', async () => {
    const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
    const { actor, idle } = fakeActor();
    await director.bindEvrae(actor as never);
    director.setRange('far', { immediate: true });
    await settle();
    director.sync(flags('far', true));
    await settle();
    expect(idle()).toMatch(/\/idle-far\.png$/);
  });

  it('puts the rim light out on the KO painting, and back after (critic 2026-09-23: blue-white coil rims)', async () => {
    // Measured in the browser (rim on vs off, same frame): the bright rims on
    // the KO coils are the scene's rim light catching every interior alpha
    // edge of a painting that is mostly holes, not the painting itself.
    const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
    const { actor } = fakeActor();
    await director.bindEvrae(actor as never);
    actor.pose = 'ko';
    director.sync(flags('near', false));
    expect(actor.u.rimStrength.value).toBe(0);
    actor.pose = 'idle';
    director.sync(flags('near', false));
    expect(actor.u.rimStrength.value).toBe(0.7);
  });

  it('reads nothing in a battle without the mechanic', () => {
    expect(breathChargedOf({ flags: {} })).toBe(false);
    expect(breathChargedOf(null)).toBe(false);
  });
});
