/**
 * Pose continuity, the fail-safe runtime (2026-10-16; `docs/plans/pose-continuity-review.md` part 2; both games): **a painting the install never vouched for
 * is not drawn** (`src/engine/PoseTrust.ts`, `PaintedArt.tryLoadMeta`, `PaintedActor`, `KoFallback`).
 *
 * The cases the driver named:
 *  - a Dark-Aeon-shaped fixture (a subject whose `attack` has no registration row) draws the idle and logs once;
 *  - waived, held and ok rows draw as today, and so does a row written before the install wrote statuses (legacy);
 *  - twirl keys and FF7 are exempt;
 *  - a KO with no trusted painting takes the existing no-KO-painting path (`KoFallback`), and the idle slot is never withheld.
 *
 * Game case: both (shared plumbing). The Dark Aeons are FFX; the fixture only has their shape.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaintedActor, painting, reset, type Actor } from './head-lock-fixture.ts';
import type { PoseRegistrationTable } from '../../../src/data/art/poseRegistrationTypes.ts';
import { downWithoutKoPainting, lacksKoPainting } from '../../../src/engine/KoFallback.ts';
import { setShippedArt } from '../../../src/engine/ArtShipped.ts';
import { tryLoadMeta } from '../../../src/engine/PaintedArt.ts';
import { POSE_REGISTRATION } from '../../../src/engine/PoseRegistration.ts';
import { poseTrustExempt, poseTrustOf, poseTrustReport, resetPoseTrustReport, stampPainting, type PoseTrustStamp } from '../../../src/engine/PoseTrust.ts';
import { installPoseTrustDebug } from '../../../src/debug/poseTrustApi.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';

const T: PoseRegistrationTable = {
  lulu: {
    idle: { scale: 1 },
    ready: { scale: 1, status: 'ok', class: 'standing' },
    attack: { scale: 1, status: 'held' },
    hurt: { scale: 1, status: 'waived' },
    critical: { scale: 1, status: 'blocked' },
    follow: { scale: 1 }, // a row written before the install wrote statuses
  },
};

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  resetPoseTrustReport();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  setPaceGame('other');
  setPace('steady');
});
afterEach(() => {
  reset();
  vi.unstubAllGlobals();
  setShippedArt(undefined);
  resetPoseTrustReport();
});

const stamp = (trusted: boolean, why: PoseTrustStamp['why']): PoseTrustStamp => ({ trusted, why });

describe('poseTrustOf: what a registration row says about a painting', () => {
  it('ok, held and waived rows are drawn; blocked is withheld; a row with no status is a legacy row and is drawn as it always was', () => {
    expect(poseTrustOf('lulu', 'ready', T)).toEqual(stamp(true, 'ok'));
    expect(poseTrustOf('lulu', 'attack', T)).toEqual(stamp(true, 'held'));
    expect(poseTrustOf('lulu', 'hurt', T)).toEqual(stamp(true, 'waived'));
    expect(poseTrustOf('lulu', 'critical', T)).toEqual(stamp(false, 'blocked'));
    expect(poseTrustOf('lulu', 'follow', T)).toEqual(stamp(true, 'legacy'));
  });

  it('a pose with no row is absent and withheld, whether its subject has other rows or none at all (the Dark Aeons had no record at all)', () => {
    expect(poseTrustOf('lulu', 'cast', T)).toEqual(stamp(false, 'absent'));
    expect(poseTrustOf('dark-sandy', 'attack', T)).toEqual(stamp(false, 'absent'));
    expect(poseTrustOf('dark-sandy', 'ko', {})).toEqual(stamp(false, 'absent'));
  });

  it('the idle is the reference and is always drawn, registered or not (an unregistered subject is listed, not hidden)', () => {
    expect(poseTrustOf('lulu', 'idle', T)).toEqual(stamp(true, 'reference'));
    expect(poseTrustOf('dark-sandy', 'idle', T)).toEqual(stamp(true, 'unregistered'));
  });

  it('twirl keys and FF7 are exempt, with or without a row', () => {
    for (const pose of ['twirl-start', 'twirl-going', 'twirl-mid', 'twirl-forming', 'twirl-end']) expect(poseTrustOf('paine-lady-luck', pose, {})).toEqual(stamp(true, 'exempt'));
    expect(poseTrustOf('ff7-film-cloud', 'windup', {})).toEqual(stamp(true, 'exempt'));
    expect(poseTrustOf('ff7-film-barret', 'aim', {})).toEqual(stamp(true, 'exempt'));
    expect(poseTrustExempt('ff7-film-cloud', 'idle')).toBe(true);
    expect(poseTrustExempt('paine-lady-luck', 'twirl-start')).toBe(true);
    expect(poseTrustExempt('lulu', 'hurt')).toBe(false);
  });

  it('day one: every row in the compiled tables that carries no status is drawn, and none of them is blocked, so landing this changes no painting that has a row', () => {
    let rows = 0;
    for (const [subject, poses] of Object.entries(POSE_REGISTRATION)) {
      for (const [pose, row] of Object.entries(poses)) {
        rows++;
        const s = poseTrustOf(subject, pose);
        expect(s.trusted, `${subject}/${pose} (${row.status ?? 'no status'}) is ${s.why}`).toBe(row.status !== 'blocked');
      }
    }
    expect(rows).toBeGreaterThan(500);
  });
});

describe('stampPainting: the stamp for the painting a URL names', () => {
  it('is null for anything that is not a character painting (a backdrop, a portrait, a sprite): nothing to judge', () => {
    expect(stampPainting('/art/backdrops/gagazet.png', T)).toBeNull();
    expect(stampPainting('/art/portraits/lulu.png', T)).toBeNull();
    expect(stampPainting('/art/characters/lulu/hurt.1.png', T)).toBeNull(); // a numbered take is not a pose of the table
    expect(warn).not.toHaveBeenCalled();
  });

  it('reads the subject and the pose from the URL, the shipped .webp of a master as its .png', () => {
    expect(stampPainting('/art/characters/lulu/hurt.png', T)).toEqual(stamp(true, 'waived'));
    expect(stampPainting('/art/characters/lulu/hurt.png?v=3', T)).toEqual(stamp(true, 'waived'));
    setShippedArt(['art/characters/lulu/critical.png']);
    expect(stampPainting('/art/characters/lulu/critical.webp', T)).toEqual(stamp(false, 'blocked'));
  });

  it('logs "[pose-trust] subject/pose" ONCE for a withheld painting, however many times it is stamped, and says so for an unregistered subject\'s idle', () => {
    for (let i = 0; i < 3; i++) expect(stampPainting('/art/characters/dark-sandy/attack.png', T)).toEqual(stamp(false, 'absent'));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain('[pose-trust] dark-sandy/attack');
    stampPainting('/art/characters/dark-sandy/idle.png', T);
    stampPainting('/art/characters/dark-sandy/idle.png', T);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[1]![0])).toContain('[pose-trust] dark-sandy/idle');
    stampPainting('/art/characters/lulu/critical.png', T); // blocked
    expect(String(warn.mock.calls[2]![0])).toContain('[pose-trust] lulu/critical');
    stampPainting('/art/characters/lulu/hurt.png', T); // waived: drawn, quiet
    stampPainting('/art/characters/lulu/follow.png', T); // legacy: drawn, quiet
    expect(warn).toHaveBeenCalledTimes(3);
  });

  it('?posereg=off (captures and A/B comparisons size paintings without the table) judges nothing', () => {
    vi.stubGlobal('location', { search: '?posereg=off' });
    expect(stampPainting('/art/characters/dark-sandy/attack.png')).toEqual(stamp(true, 'exempt'));
    expect(warn).not.toHaveBeenCalled();
  });

  it('twirl and FF7 paintings of the real subjects are exempt against the compiled tables', () => {
    expect(stampPainting('/art/characters/paine-lady-luck/twirl-start.png')).toEqual(stamp(true, 'exempt'));
    expect(stampPainting('/art/characters/ff7-film-cloud/windup.png')).toEqual(stamp(true, 'exempt'));
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('poseTrust(): the report the console and the critic read', () => {
  it('lists what a battle loaded that the runtime withholds, sorted, with the counts of every reason and the unregistered subjects', () => {
    stampPainting('/art/characters/dark-sandy/attack.png', T);
    stampPainting('/art/characters/dark-sandy/idle.png', T);
    stampPainting('/art/characters/dark-cindy/ko.png', T);
    stampPainting('/art/characters/lulu/critical.png', T);
    stampPainting('/art/characters/lulu/ready.png', T);
    const api: Record<string, unknown> = {};
    installPoseTrustDebug(api);
    const r = (api['poseTrust'] as (all?: boolean) => ReturnType<typeof poseTrustReport>)();
    expect(r.seen).toBe(5);
    expect(r.withheld.map((e) => `${e.subject}/${e.pose}:${e.why}`)).toEqual(['dark-cindy/ko:absent', 'dark-sandy/attack:absent', 'lulu/critical:blocked']);
    expect(r.counts).toEqual({ absent: 2, blocked: 1, unregistered: 1, ok: 1 });
    expect(r.unregistered).toEqual(['dark-sandy']);
    expect(r.all).toBeUndefined();
    expect((api['poseTrust'] as (all: boolean) => ReturnType<typeof poseTrustReport>)(true).all).toHaveLength(5);
  });

  it('is empty when everything a battle loaded is vouched for', () => {
    stampPainting('/art/characters/lulu/ready.png', T);
    stampPainting('/art/characters/lulu/hurt.png', T);
    expect(poseTrustReport().withheld).toEqual([]);
  });
});

describe('tryLoadMeta stamps every character painting with its trust', () => {
  const sidecar = { width: 1024, height: 1024, baselineY: 1000 };
  const answer = (): Response => new Response(JSON.stringify(sidecar), { status: 200, headers: { 'content-type': 'application/json' } });
  beforeEach(() => vi.stubGlobal('fetch', vi.fn(async () => answer())));

  it('a registered painting is trusted; a Dark-Aeon-shaped one (a subject the table has never heard of) is not, and the idle of it is drawn', async () => {
    const lulu = await tryLoadMeta('/art/characters/lulu/hurt.png');
    expect(lulu?.trust?.trusted).toBe(true);
    const idle = await tryLoadMeta('/art/characters/darkaeon-fixture/idle.png');
    expect(idle?.trust).toEqual(stamp(true, 'unregistered'));
    const attack = await tryLoadMeta('/art/characters/darkaeon-fixture/attack.png');
    expect(attack?.trust).toEqual(stamp(false, 'absent'));
    expect((warn.mock.calls as unknown[][]).some((c) => String(c[0]).includes('[pose-trust] darkaeon-fixture/attack'))).toBe(true);
  });

  it('a backdrop carries no trust at all', async () => {
    const m = await tryLoadMeta('/art/backdrops/gagazet.png');
    expect(m).not.toBeNull();
    expect(m && 'trust' in m).toBe(false);
  });
});

// ------------------------------------------------------------------ the real PaintedActor

const SET = ['idle', 'ready', 'attack', 'follow', 'hurt', 'ko'] as const;

/** Tidus with the trust the test gives each pose (`undefined`: a painting with no stamp, drawn as it always was). */
function figure(trust: Partial<Record<(typeof SET)[number], PoseTrustStamp>>, urls: Partial<Record<(typeof SET)[number], string>> = {}): Actor {
  const a = new PaintedActor({ name: 'tidus', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  const poses: Record<string, ReturnType<typeof painting>> = {};
  for (const p of SET) poses[p] = painting('tidus', p, trust[p] ? { trust: trust[p]! } : {}, urls[p]);
  a.adoptPoses(poses, 'idle');
  a.position.set(-2, 0, 0);
  return a;
}

const OK = stamp(true, 'ok');
const WITHHELD = stamp(false, 'absent');

describe('PaintedActor: a withheld painting is treated as missing, so the pose falls down its chain to the idle', () => {
  it('a Dark-Aeon-shaped figure (an idle and nothing registered besides) draws the idle for attack, cast, hurt and ko, and starts no blend', () => {
    const a = figure({ idle: stamp(true, 'unregistered'), ready: WITHHELD, attack: WITHHELD, follow: WITHHELD, hurt: WITHHELD, ko: WITHHELD });
    for (const name of ['ready', 'attack', 'hurt', 'ko', 'cast', 'victory']) {
      a.setPose(name);
      expect(a.pose, name).toBe('idle');
      expect(a.blending, name).toBe(false);
    }
    expect(a.poseWithheld('attack')).toBe(true);
    expect(a.poseWithheld('idle')).toBe(false);
  });

  it('the chain is the game\'s own: attack falls to ready when ready is vouched for, and hurt and ko to the idle or the hurt that is', () => {
    const a = figure({ idle: OK, ready: OK, attack: WITHHELD, hurt: WITHHELD, ko: WITHHELD });
    a.setPose('attack', { immediate: true });
    expect(a.pose).toBe('ready');
    const b = figure({ idle: OK, ready: WITHHELD, attack: WITHHELD, hurt: OK, ko: WITHHELD });
    b.setPose('ko', { immediate: true });
    expect(b.pose).toBe('hurt'); // ko > hurt > idle
    b.setPose('attack', { immediate: true });
    expect(b.pose).toBe('idle'); // attack > ready > idle, ready withheld
  });

  it('ok, held, waived and legacy paintings are drawn as they always were, and so is a painting that carries no stamp (a stand-in, a hand-made meta)', () => {
    const a = figure({ idle: OK, ready: stamp(true, 'held'), attack: stamp(true, 'waived'), follow: stamp(true, 'legacy'), hurt: OK });
    for (const name of ['ready', 'attack', 'follow', 'hurt']) {
      a.setPose(name, { immediate: true });
      expect(a.pose, name).toBe(name);
      expect(a.poseWithheld(name)).toBe(false);
    }
    const bare = figure({});
    bare.setPose('attack', { immediate: true });
    expect(bare.pose).toBe('attack');
  });

  it('the idle slot is never withheld, whatever painting it holds (a scene puts idle-far, a Fin\'s charge-far or Sin\'s stage-2 there on purpose), and the slots that borrow it follow', () => {
    const stage2 = '/art/characters/overdrive-sin/stage-2.png';
    const a = figure({ idle: WITHHELD, ready: WITHHELD, attack: WITHHELD, hurt: WITHHELD }, { idle: stage2, ready: stage2, attack: stage2, hurt: stage2 });
    expect(a.pose).toBe('idle');
    expect(a.poseWithheld('idle')).toBe(false);
    a.setPose('attack', { immediate: true });
    expect(a.pose).toBe('idle');
    a.setPose('idle', { immediate: true, force: true });
    expect(a.pose).toBe('idle');
  });

  it('a withheld pose that has no chain of its own goes down the presenter chain (follow: attack, ready, idle) or to the idle, rather than being ignored; a pose with no painting at all is answered as before', () => {
    const a = figure({ idle: OK, ready: OK, attack: OK, follow: WITHHELD });
    a.setPose('follow', { immediate: true });
    expect(a.pose).toBe('attack'); // follow is not in the actor's POSE_FALLBACKS: withheld, it shows what a figure with no follow painting shows
    const b = figure({ idle: OK, ready: OK, attack: WITHHELD, follow: WITHHELD });
    b.setPose('follow', { immediate: true });
    expect(b.pose).toBe('ready');
    const c = figure({ idle: OK, ready: WITHHELD, attack: WITHHELD, follow: WITHHELD });
    c.setPose('follow', { immediate: true });
    expect(c.pose).toBe('idle');
    const d = figure({ idle: OK, ready: OK });
    d.setPose('ready', { immediate: true });
    d.setPose('critical', { immediate: true }); // no critical painting loaded, no chain: ignored, as always
    expect(d.pose).toBe('ready');
  });

  it('poseShape of a withheld pose is the idle\'s, so the presenter\'s reach and lunge are sized against a painting that is drawn', () => {
    const a = figure({ idle: OK, ready: WITHHELD, attack: WITHHELD });
    expect(a.poseShape('attack')).toEqual(a.poseShape('idle'));
  });

  it('a withheld pose asked for in the middle of a blend is skipped, and the blend carries on to the pose that is drawn', () => {
    const a = figure({ idle: OK, ready: OK, attack: WITHHELD });
    a.setPose('ready');
    expect(a.blending).toBe(true);
    a.setPose('attack'); // withheld: resolves to ready, which is already on its way in
    for (let i = 0; i < 12; i++) a.update(1 / 60, 1 / 60);
    expect(a.pose).toBe('ready');
    expect(a.blending).toBe(false);
  });
});

describe('KoFallback: a KO with no trusted painting takes the no-KO-painting path', () => {
  it('a vouched-for KO is a KO painting; a withheld one is not, and the figure is laid on the floor with the painting it falls back to', () => {
    const real = figure({ idle: OK, hurt: OK, ko: OK });
    expect(lacksKoPainting(real)).toBe(false);
    const withheld = figure({ idle: OK, hurt: OK, ko: WITHHELD });
    expect(lacksKoPainting(withheld)).toBe(true);
    withheld.setPose('ko', { immediate: true });
    expect(withheld.pose).toBe('hurt');
    const lie = vi.spyOn(withheld, 'lieDown').mockResolvedValue(undefined);
    downWithoutKoPainting(withheld);
    expect(lie).toHaveBeenCalledTimes(1);
    const realLie = vi.spyOn(real, 'lieDown').mockResolvedValue(undefined);
    downWithoutKoPainting(real);
    expect(realLie).not.toHaveBeenCalled();
  });

  it('a KO with no row at all (absent) is the same, and a figure with no pose map to read (a sprite, a test double) is left alone', () => {
    expect(lacksKoPainting(figure({ idle: OK, ko: stamp(false, 'absent') }))).toBe(true);
    expect(lacksKoPainting({})).toBe(false);
  });
});
