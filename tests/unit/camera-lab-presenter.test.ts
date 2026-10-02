/**
 * CAMERA LAB (branch camera-lab; a test harness, D-318): the real presenter's beats, through the
 * lab's cut rules, in a real FFX-2 fight (Chapter IV, Bahamut, Active ATB so fiends act under an
 * open menu). Proves the presenter's port delivers menu and action beats in order and that the
 * director never cuts while a girl's menu is open (D-316), only as it opens.
 * Game case (rule 14): FFX-2 (the menu rule is FFX-2's).
 */
import { describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { AvailableCommand, CombatantId, Command } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { LabDirectorCore } from '../../src/engine/lab/LabDirectorCore.ts';
import { LabCamera } from '../../src/engine/lab/LabCamera.ts';
import { DEFAULT_LAB_SWITCHES, type LabBeat } from '../../src/engine/lab/LabTypes.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

describe('camera lab beats from the real presenter (FFX-2, Active)', () => {
  it('cuts the master as each menu opens and never while one is open; actions cut only between menus', async () => {
    const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
    if (!group) throw new Error('ffx2-bahamut missing');
    const engine = new FFX2Engine(ffx2Options());
    engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed: 3, condition: 'normal', canEscape: false });
    const state = engine.state();
    const fake = new FakeStage([...state.activeIds], [...state.enemyIds]);

    let clock = 0;
    const core = new LabDirectorCore({
      game: 'ffx2',
      now: () => clock,
      switches: () => ({ ...DEFAULT_LAB_SWITCHES, style: 'clair' }),
      speedScale: () => 1,
      bossId: () => 'bahamut',
      allPartyRear: () => true,
      sideOf: (id) => fake.sideOf(id) ?? null,
      bigAbility: (id) => id === 'mega-flare',
    });
    const beats: LabBeat[] = [];
    const cuts: Array<{ kind: string; menuOpen: boolean; opening: boolean }> = [];
    let lastBeat: LabBeat | null = null;
    const drain = (): void => {
      const c = core.due();
      if (c) cuts.push({ kind: c.shot.kind, menuOpen: core.menuOpen, opening: lastBeat?.kind === 'menu-open' });
    };
    const port = {
      beat(b: LabBeat): void {
        beats.push(b);
        lastBeat = b;
        core.beat(b);
        drain();
      },
    };
    // As `battleLab.ts` does: the stage stays itself, its camera becomes the lab's.
    Object.defineProperty(fake, 'camera', { value: new LabCamera(fake.camera, { yielding: () => core.yielding }) });
    const stage = fake;

    // The menu answers after the ATB has run a while under it (fiends act meanwhile).
    let menus = 0;
    const hud: HudPort = {
      mount() {},
      unmount() {},
      sync() {},
      syncGauges() {},
      setVisible() {},
      setProjector() {},
      openMinigame: () => new Promise<never>(() => undefined),
      closeCommandMenu() {},
      chooseCommand(_actorId: CombatantId, commands: AvailableCommand[]) {
        menus++;
        const pick = commands.find((c) => c.enabled && c.command.kind !== 'item') ?? commands.find((c) => c.enabled)!;
        const target = pick.validTargets.find((t) => fake.sideOf(t) === 'enemy') ?? pick.validTargets[0];
        const cmd = { ...pick.command, targets: target ? [target] : [] } as Command;
        const at = clock + 2500;
        return new Promise<Command>((resolve) => {
          const wait = (): void => void (clock >= at ? resolve(cmd) : setTimeout(wait, 0));
          wait();
        });
      },
      onEvent() {},
    };
    const presenter = new BattlePresenter({
      stage,
      lab: port,
      hud,
      damageNumbers: new FakeDamageNumbers(),
      messageBar: new FakeMessageBar(),
      audio: new FakeAudio(),
      cutscenes: new FakeCutscenes(),
      sleep: (ms) => {
        clock += ms;
        drain();
        return new Promise((r) => setTimeout(r, 0));
      },
      now: () => clock,
    });
    let ended = false;
    void presenter.run(engine).then(() => (ended = true));
    for (let i = 0; i < 4000 && menus < 6 && !ended; i++) await new Promise((r) => setTimeout(r, 0));
    presenter.abort();

    expect(menus).toBeGreaterThanOrEqual(3);
    const opens = beats.filter((b) => b.kind === 'menu-open').length;
    const closes = beats.filter((b) => b.kind === 'menu-close').length;
    expect(opens).toBeGreaterThanOrEqual(3);
    expect(closes).toBeGreaterThanOrEqual(opens - 1);
    // Fiends acted while a menu was open (Active), and none of those actions cut.
    let open = false;
    let actedUnderMenu = 0;
    for (const b of beats) {
      if (b.kind === 'menu-open') open = true;
      if (b.kind === 'menu-close') open = false;
      if (b.kind === 'action' && open) actedUnderMenu++;
    }
    expect(actedUnderMenu).toBeGreaterThan(0);
    // The rule itself: every cut that landed with a menu open is the master landing as it opened.
    for (const c of cuts.filter((x) => x.menuOpen)) {
      expect(c.opening, JSON.stringify(c)).toBe(true);
      expect(['party-shoulder', 'party-front']).toContain(c.kind);
    }
    // And the girls' own actions did cut, between menus.
    expect(cuts.some((c) => !c.menuOpen && c.kind !== 'party-shoulder')).toBe(true);
    // The presenter's own framing never reached the camera outside a yield.
    expect(fake.calls.filter((c) => c.startsWith('camera:party') || c.startsWith('camera:action')).length).toBe(0);
  });
});
