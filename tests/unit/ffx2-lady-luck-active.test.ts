/**
 * Lady Luck's reels under **Active ATB with another girl's command menu open** (FFX-2 only).
 *
 * The reels are Long `CT`: their `minigame-request` comes out of the clock. Under Active the clock
 * runs while a command menu is open, and the pump that drives it played the burst and dropped the
 * request, so the engine sat on `awaitingMinigame` forever and the reels never paid. The pump now
 * stops (`interrupted`), the open menu is closed, the overlay opens, the spin is resolved for the
 * girl who spun it, and the menu comes back. This drives the real `BattlePresenter` on the real
 * `FFX2Engine` in Active mode, with a fake clock so the test does not wait in real time.
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

/** Yuna spins first; every later menu of the other two girls stays open until the overlay has opened. */
class HeldMenuHud extends FakeHud {
  picked = false;
  menusHeld = 0;
  menusClosed = 0;
  menusAfter = 0;
  stop: () => void = () => undefined;
  closeCommandMenu(): void {
    this.menusClosed++;
  }
  override async chooseCommand(...args: unknown[]): Promise<never> {
    const [actorId, commands] = args as [string, AvailableCommand[]];
    if (actorId === 'yuna' && !this.picked) {
      const row = commands.find((c) => c.command.kind === 'ability' && c.command.id === MAGIC_REELS);
      if (!row) throw new Error('Magic Reels was not offered');
      this.picked = true;
      return { ...row.command, targets: ['vegnagun-tail'] } as never;
    }
    if (this.picked && this.minigamesOpened.length === 0) {
      this.menusHeld++;
      return new Promise<never>(() => undefined); // her menu stays open while the clock runs
    }
    if (this.picked && ++this.menusAfter > 6) this.stop();
    const filler = commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.length > 0)
      ?? commands.find((c) => c.enabled && c.validTargets.length > 0);
    if (!filler) throw new Error('no legal row');
    return { ...filler.command, targets: [filler.validTargets[0]!] } as never;
  }
  override async openMinigame(kind: string): Promise<never> {
    this.minigamesOpened.push(kind);
    const s: [string, string, string] = ['cherry', 'cherry', 'cherry'];
    const result: MinigameResult = { kind: 'ladyluck-reels', reels: { symbols: s, threeOfAKind: true, timeRemainingMs: 9000 } };
    return result as never;
  }
}

describe('Lady Luck reels while another menu is open under Active ATB', () => {
  it('opens the overlay, resolves the spin as Yuna, and re-offers the menu it closed', async () => {
    const engine = new FFX2Engine({
      // Test knob: a longer wind-up than the shipped Long CT, so a second girl's menu is open while the reels charge
      // (at the shipped length Rikku and Paine are still filling their bars when the reels land).
      abilities: abilityRegistryFrom(Object.values(data.ABILITIES).map((a) => (a.id === MAGIC_REELS ? { ...a, chargeTicks: (a.chargeTicks ?? 0) * 3 } : a))),
      items: itemRegistryFrom(Object.values(data.ITEMS)),
      dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
      garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
      atbMode: 'active',
    });
    engine.init({ game: 'ffx2', party: ladyLuckParty(), enemies: data.ENEMY_GROUPS_BY_ID['vegnagun-tail']!, triggers: [], seed: 3, condition: 'normal', canEscape: false });

    const submitted: Command[] = [];
    const realSubmit = engine.submit.bind(engine);
    engine.submit = (command: Command) => {
      submitted.push(command);
      return realSubmit(command);
    };

    const hud = new HeldMenuHud();
    let clock = 0;
    const presenter = new BattlePresenter({
      stage: new FakeStage(['yuna', 'rikku', 'paine'], ['vegnagun-tail']),
      damageNumbers: new FakeDamageNumbers(),
      messageBar: new FakeMessageBar(),
      audio: new FakeAudio(),
      cutscenes: new FakeCutscenes(),
      hud,
      sleep: noSleep,
      now: () => (clock += 150),
    });
    hud.stop = () => presenter.abort();
    await presenter.run(engine);
    const events: BattleEvent[] = hud.events;

    expect(hud.menusHeld, 'the test never held a menu open while the reels charged').toBeGreaterThan(0);
    expect(hud.minigamesOpened, 'the reels never asked for their overlay under an open menu').toEqual(['ladyluck-reels']);
    expect(hud.menusClosed, 'the open menu was not closed for the overlay').toBeGreaterThan(0);
    const carried = submitted.filter((c) => c.kind === 'ability' && c.id === MAGIC_REELS && c.extra);
    expect(carried.length, 'her spin never reached the engine').toBe(1);

    const said = events.filter((e) => e.type === 'message').map((e) => (e as { text: string }).text);
    expect(said).toContain('Flare');
    expect(said).not.toContain('Dud!');
    const flare = events.find((e) => e.type === 'damage' && (e as { sourceId?: string }).sourceId === 'yuna' && (e as { targetId: string }).targetId === 'vegnagun-tail');
    expect(flare, 'Flare was not resolved as Yuna').toBeDefined();
    expect(hud.menusAfter, 'the menu was not re-offered after the spin').toBeGreaterThan(0);
  });
});
