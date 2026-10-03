/**
 * Lady Luck's reels, **with a human at the overlay** — the path the unit-level
 * reel tests cannot see, because they hand the engine a finished spin.
 *
 * The reels are the only FFX-2 timed input with a charge time (Long `CT`), so
 * their `minigame-request` comes out of `tick()`, not out of `submit()`. This
 * drives the real `BattlePresenter` against the real `FFX2Engine`, with a HUD
 * that picks the reel row and then stops three reels, and asserts the player's
 * symbols are what the engine resolves.
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import type { AvailableCommand, BattleEvent, Command, FFX2PartyBuild, MinigameResult } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeHud, FakeMessageBar, FakeStage, noSleep } from './helpers/FakeStage.ts';

const MAGIC_REELS = 'x2-lady-luck-magic-reels';

function ladyLuckParty(): FFX2PartyBuild {
  const [yuna, rikku, paine] = farplaneBuild.members;
  return { ...farplaneBuild, members: [{ ...yuna, currentDressphere: 'lady-luck' }, rikku, paine] };
}

/** Picks Magic Reels on Yuna's first turn, stops the reels on `symbols`, then walks away. */
class ReelPlayerHud extends FakeHud {
  spins = 0;
  menusAfterSpin = 0;
  stop: () => void = () => undefined;
  constructor(private readonly symbols: [string, string, string]) {
    super();
  }
  override async chooseCommand(...args: unknown[]): Promise<never> {
    const [actorId, commands] = args as [string, AvailableCommand[]];
    if (actorId === 'yuna' && this.spins === 0 && this.minigamesOpened.length === 0 && !this.picked) {
      const row = commands.find((c) => c.command.kind === 'ability' && c.command.id === MAGIC_REELS);
      if (!row) throw new Error('Magic Reels was not offered');
      this.picked = true;
      return { ...row.command, targets: ['vegnagun-tail'] } as never;
    }
    if (this.picked && ++this.menusAfterSpin > 12) this.stop();
    const filler = commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.length > 0)
      ?? commands.find((c) => c.enabled && c.validTargets.length > 0);
    if (!filler) throw new Error('no legal row');
    return { ...filler.command, targets: [filler.validTargets[0]!] } as never;
  }
  picked = false;
  override async openMinigame(kind: string): Promise<never> {
    this.minigamesOpened.push(kind);
    this.spins++;
    const s = this.symbols;
    const result: MinigameResult = {
      kind: 'ladyluck-reels',
      reels: { symbols: s, threeOfAKind: s[0] === s[1] && s[1] === s[2], timeRemainingMs: 9000 },
    };
    return result as never;
  }
}

async function play(symbols: [string, string, string]): Promise<{ hud: ReelPlayerHud; events: BattleEvent[]; submitted: Command[] }> {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    // A human is at the controls: the engine asks for the overlay.
  });
  engine.init({ game: 'ffx2', party: ladyLuckParty(), enemies: data.ENEMY_GROUPS_BY_ID['vegnagun-tail']!, triggers: [], seed: 3, condition: 'normal', canEscape: false });

  const submitted: Command[] = [];
  const realSubmit = engine.submit.bind(engine);
  engine.submit = (command: Command) => {
    submitted.push(command);
    return realSubmit(command);
  };

  const hud = new ReelPlayerHud(symbols);
  const presenter = new BattlePresenter({
    stage: new FakeStage(['yuna', 'rikku', 'paine'], ['vegnagun-tail']),
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    audio: new FakeAudio(),
    cutscenes: new FakeCutscenes(),
    hud,
    sleep: noSleep,
  });
  hud.stop = () => presenter.abort();
  await presenter.run(engine);
  return { hud, events: hud.events, submitted };
}

describe('Lady Luck with a human at the reels [ffx2-combat-core §3.12]', () => {
  it('opens the overlay exactly once, after the charge, and resolves the symbols SHE stopped', async () => {
    const { hud, events, submitted } = await play(['cherry', 'cherry', 'cherry']);

    expect(hud.minigamesOpened, 'the reel overlay never opened for a human').toEqual(['ladyluck-reels']);
    const carried = submitted.filter((c) => c.kind === 'ability' && c.id === MAGIC_REELS && c.extra);
    expect(carried.length, 'her spin never reached the engine').toBe(1);

    // Three Cherries on the Magic Reels is Flare, on the enemy she aimed at — not the
    // engine's own blind roll, which on this seed is a Dud.
    const said = events.filter((e) => e.type === 'message').map((e) => (e as { text: string }).text);
    expect(said).toContain('Flare');
    expect(said).not.toContain('Dud!');
    const flare = events.find((e) => e.type === 'damage' && (e as { sourceId?: string }).sourceId === 'yuna' && (e as { targetId: string }).targetId === 'vegnagun-tail');
    expect(flare, 'Flare dealt nothing').toBeDefined();
  });

  it('a losing spin she stopped herself is a Dud on her own party', async () => {
    const { events } = await play(['hat', 'skull', 'staff']);
    const said = events.filter((e) => e.type === 'message').map((e) => (e as { text: string }).text);
    expect(said).toContain('Dud!');
    const hit = new Set(events.filter((e) => e.type === 'damage' && (e as { sourceId?: string }).sourceId === 'yuna').map((e) => (e as { targetId: string }).targetId));
    expect([...hit].sort()).toEqual(['paine', 'rikku', 'yuna']);
  });
});
