/**
 * **The Spectral Keeper's physical moves play the ATTACK beat on its IDLE painting while its attack painting is held back** (FFX only; r75 fix pass, the driver's decision 219v item 1, under Bailey's delegation).
 *
 * Before: with no `attack` file `poseForAction` gave the Keeper's Berserk Tail, Attack All and aeon Attack the CAST pose (`boss-art-r75-wiring.test.ts` item 5 pins that for any enemy): the spell's cue, the blue flash and
 * the caster's lift, on a creature that is swinging its tail. Now `data/art/physicalOnIdle.ts` lists the Keeper and `BattlePresenterBeats.actionStart` hands that opt-in to `poseForAction`: the pose is `attack`, the pose
 * chain (`attack`, `ready`, `idle`) shows the idle painting, the attack cue plays and there is no cast cue, no flash on the Keeper and no lift. Everything else is unchanged and is proved so below: another FFX enemy
 * (Yojimbo's Kozuka) and an FFX-2 enemy (Aranea's attack) with no attack painting still draw `cast`; the Keeper's own magic-like moves (the Glyph Mine) still draw `cast`.
 *
 * Real rows (`abilityFactsFor('ffx')`), the real Keeper formation (`ENEMY_GROUPS_BY_ID['spectral-keeper']`), the real engine's own Berserk Tail event, the real presenter. Mutation: the Keeper out of the table, or
 * `onIdle` ignored by `poseForAction`, fails the tests marked below.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { abilityFactsFor } from '../../../src/app/screens/battleAbilityFacts.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { SFX_FALLBACKS } from '../../../src/engine/BattlePresenterPorts.ts';
import { artCandidatesFor, characterUrl, resolveArt } from '../../../src/engine/BattlePresenterArt.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { isPhysicalAction, paintedPoses, poseForAction } from '../../../src/engine/EnemyActionPose.ts';
import { PHYSICAL_ON_IDLE_ARTS, physicalOnIdle } from '../../../src/data/art/physicalOnIdle.ts';
import { ENEMY_GROUPS_BY_ID as FFX_GROUPS } from '../../../src/data/ffx/index.ts';
import { ARANEA_ATTACK_ID } from '../../../src/data/ffx2/enemies/fallen-maesters-abilities.ts';
import { SPECTRAL_ROWS } from '../../../src/data/ffx/spectral-keeper-ids.ts';
import { FakeAudio, FakeStage, noSleep } from '../helpers/FakeStage.ts';
import { actor, KEEPER, log, newEngine, runDefending } from '../helpers/keeperDrive.ts';

afterEach(() => resetArtManifest());

const manifestOf = (subjects: Record<string, { states: string[] }>): void => {
  const m = parseArtManifest({ version: 1, generatedAt: 'x', subjects });
  if (!m) throw new Error('manifest did not parse');
  setArtManifest(m);
};

/** The states the install writes for the Keeper: its attack painting is held back. */
const KEEPER_INSTALLED = ['cast', 'hurt', 'idle', 'ko'];
const ffx = abilityFactsFor('ffx');
const ffx2 = abilityFactsFor('ffx2');
/** The sound each beat asks the audio port for (the presenter's cue table). */
const ATTACK_SFX = SFX_FALLBACKS['attack']!;
const CAST_SFX = SFX_FALLBACKS['cast']!;

type Start = Extract<BattleEvent, { type: 'action-start' }>;
const startOf = (actorId: string, abilityId: string): Start =>
  ({ type: 'action-start', seq: 0, actorId, abilityId, command: { kind: 'ability', id: abilityId, targets: [] }, targets: [] }) as Start;

describe('the opt-in table (data/art/physicalOnIdle.ts)', () => {
  it('lists exactly the Spectral Keeper (FFX only); the four Fallen Maesters (FFX-2) and every other enemy are off', () => {
    expect([...PHYSICAL_ON_IDLE_ARTS]).toEqual(['spectral-keeper']);
    expect(physicalOnIdle('spectral-keeper')).toBe(true);
    expect(physicalOnIdle('exp-leblanc-spectral-keeper'), 'a namespaced copy reads its base\'s row').toBe(true);
    for (const art of ['x2-aranea', 'x2-black-elemental', 'x2-concherer', 'x2-chac', 'yojimbo', 'seymour-flux', 'spectral-circle', 'shuyin']) expect(physicalOnIdle(art), art).toBe(false);
    expect(physicalOnIdle(undefined), 'a stage that cannot say which art a figure wears').toBe(false);
  });
});

describe('poseForAction with the Keeper\'s real rows and formation', () => {
  const keeperRow = FFX_GROUPS['spectral-keeper']!.enemies.find((e) => e.id === KEEPER)!;

  it('the Keeper\'s own abilities: the physical ones (Berserk Tail, Attack All, the aeon Attack) are physical rows; the Glyph Mine is not', () => {
    expect(keeperRow.abilityIds).toEqual([SPECTRAL_ROWS.tail, SPECTRAL_ROWS.sweep, SPECTRAL_ROWS.mine, SPECTRAL_ROWS.aeonAttack]);
    const physical = keeperRow.abilityIds.filter((id) => isPhysicalAction(ffx(id)));
    expect(physical).toEqual([SPECTRAL_ROWS.tail, SPECTRAL_ROWS.sweep, SPECTRAL_ROWS.aeonAttack]);
  });

  it('with the install\'s art (no attack painting) the physical moves are `attack` and resolve to the IDLE painting; the Glyph Mine stays `cast` (mutation: the table without the Keeper, or `onIdle` ignored, fails this)', async () => {
    manifestOf({ 'spectral-keeper': { states: KEEPER_INSTALLED } });
    const { artId, poses } = await resolveArt(artCandidatesFor(actor(newEngine(5), KEEPER)), 'enemy');
    expect(artId).toBe('spectral-keeper');
    const own = paintedPoses(artId, poses, characterUrl);
    expect(own.has('attack'), 'the attack painting is held back').toBe(false);
    const drawn = keeperRow.abilityIds.map((id) => poseForAction(startOf(KEEPER, id), 'enemy', ffx, (p) => own.has(p), physicalOnIdle(artId)));
    expect(drawn).toEqual(['attack', 'attack', 'cast', 'attack']);
    expect(poses['attack'], 'the attack pose draws the idle painting').toBe(characterUrl('spectral-keeper', 'idle'));
  });

  it('once the attack painting is installed the Keeper draws it exactly as any enemy does (the opt-in changes nothing then)', async () => {
    manifestOf({ 'spectral-keeper': { states: [...KEEPER_INSTALLED, 'attack'] } });
    const { artId, poses } = await resolveArt(['spectral-keeper'], 'enemy');
    const own = paintedPoses(artId, poses, characterUrl);
    expect(poses['attack']).toBe(characterUrl('spectral-keeper', 'attack'));
    for (const onIdle of [true, false]) {
      expect(poseForAction(startOf(KEEPER, SPECTRAL_ROWS.tail), 'enemy', ffx, (p) => own.has(p), onIdle), `onIdle ${onIdle}`).toBe('attack');
    }
  });

  it('the control: with no opt-in (the default) the same Keeper rows draw `cast`, as the handoff pins for any enemy with no attack painting', () => {
    const none = (): boolean => false;
    for (const id of keeperRow.abilityIds) {
      expect(poseForAction(startOf(KEEPER, id), 'enemy', ffx, none), id).toBe('cast');
      expect(poseForAction(startOf(KEEPER, id), 'enemy', ffx, none, false), id).toBe('cast');
    }
  });

  it('the opt-in reaches only an enemy\'s physical moves: party, aeon and magic are unchanged', () => {
    const magic = { damageType: 'magical', formula: 'magic' } as const;
    const facts = (id: string) => (id === 'spell' ? magic : ffx(id));
    expect(poseForAction(startOf(KEEPER, 'spell'), 'enemy', facts, () => false, true), 'magic').toBe('cast');
    expect(poseForAction(startOf('tidus', SPECTRAL_ROWS.tail), 'party', ffx, () => false, true), 'a party member').toBe('cast');
    expect(poseForAction(startOf('ifrit', SPECTRAL_ROWS.tail), 'aeon', ffx, () => false, true), 'an aeon').toBe('cast');
    expect(poseForAction(startOf(KEEPER, SPECTRAL_ROWS.tail), 'enemy', undefined, () => false, true), 'no ability rows').toBe('cast');
  });
});

describe('through the real presenter: what the player sees of the Keeper\'s Berserk Tail', () => {
  /** A stage whose Keeper wears `art` and paints the given poses of its own. */
  class ArtStage extends FakeStage {
    constructor(
      private readonly art: string,
      private readonly painted: readonly string[],
      party: string[],
      enemies: string[],
    ) {
      super(party, enemies);
    }
    artOf(): string {
      return this.art;
    }
    paints(_id: string, pose: string): boolean {
      return this.painted.includes(pose);
    }
  }

  /** Play one enemy `action-start` and return what the stage and the audio saw. */
  async function playStart(stage: ArtStage, game: 'ffx' | 'ffx2', event: Start): Promise<{ pose: string; calls: string[]; cues: string[] }> {
    const audio = new FakeAudio();
    const presenter = new BattlePresenter({ stage, audio, sleep: noSleep, abilityFacts: abilityFactsFor(game) });
    const before = stage.calls.length;
    await presenter.play([event]);
    return { pose: stage.actors.get(event.actorId)!.pose, calls: stage.calls.slice(before), cues: audio.cues };
  }

  it('the real engine\'s own Berserk Tail: the pose is `attack` (the idle painting), the attack cue plays, there is no cast cue and no flash on the Keeper (mutation: any of the three fails)', async () => {
    const engine = newEngine(5);
    runDefending(engine, (e) => log(e).some((ev) => ev.type === 'action-start' && ev.actorId === KEEPER && ev.abilityId === SPECTRAL_ROWS.tail));
    const tail = log(engine).find((ev): ev is Start => ev.type === 'action-start' && ev.actorId === KEEPER && ev.abilityId === SPECTRAL_ROWS.tail)!;
    expect(tail).toBeDefined();

    const keeper = await playStart(new ArtStage('spectral-keeper', ['idle', 'cast', 'hurt', 'ko'], ['tidus', 'yuna', 'auron'], [KEEPER]), 'ffx', tail);
    expect(keeper.pose).toBe('attack');
    expect(keeper.cues).toContain(ATTACK_SFX);
    expect(keeper.cues, 'no spell cue').not.toContain(CAST_SFX);
    expect(keeper.calls, 'no blue flash on the Keeper').not.toContain(`flash:${KEEPER}`);
    expect(keeper.calls).toContain(`pose=attack:${KEEPER}`);
    expect(keeper.calls, 'the attack beat\'s lunge').toContain(`lunge:${KEEPER}`);
  });

  it('the control, another FFX enemy with no attack painting (Yojimbo\'s Kozuka, a physical row): still `cast`, with the cast cue and the flash', async () => {
    expect(isPhysicalAction(ffx('yojimbo-kozuka'))).toBe(true);
    const r = await playStart(new ArtStage('yojimbo', ['idle', 'cast'], ['tidus'], ['yojimbo']), 'ffx', startOf('yojimbo', 'yojimbo-kozuka'));
    expect(r.pose).toBe('cast');
    expect(r.cues).toContain(CAST_SFX);
    expect(r.cues).not.toContain(ATTACK_SFX);
    expect(r.calls).toContain('flash:yojimbo');
  });

  it('the control, an FFX-2 enemy with no attack painting (Aranea\'s attack, a physical FFX-2 row): still `cast`, with the cast cue and the flash', async () => {
    expect(isPhysicalAction(ffx2(ARANEA_ATTACK_ID))).toBe(true);
    const r = await playStart(new ArtStage('x2-aranea', ['idle', 'cast'], ['yuna'], ['x2-aranea']), 'ffx2', startOf('x2-aranea', ARANEA_ATTACK_ID));
    expect(r.pose).toBe('cast');
    expect(r.cues).toContain(CAST_SFX);
    expect(r.cues).not.toContain(ATTACK_SFX);
    expect(r.calls).toContain('flash:x2-aranea');
  });

  it('the Keeper\'s Glyph Mine (not a physical row) is still the cast beat', async () => {
    const r = await playStart(new ArtStage('spectral-keeper', ['idle', 'cast'], ['tidus'], [KEEPER]), 'ffx', startOf(KEEPER, SPECTRAL_ROWS.mine));
    expect(r.pose).toBe('cast');
    expect(r.cues).toContain(CAST_SFX);
    expect(r.calls).toContain(`flash:${KEEPER}`);
  });
});
