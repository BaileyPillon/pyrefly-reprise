/**
 * Release 62, decision 173c (Bailey, 2026-10-22 ~00:00 EDT): a demo fight starts with every party member's Overdrive gauge at 50 percent. Demo mode only; normal play is unchanged.
 * Game case: FFX (Chapter I, Seymour Flux) has the gauge; FFX-2 (Chapter IV, Bahamut) has no Overdrive gauge, so its build must come back untouched.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { FFXPartyBuild } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { setDemoMode, DEMO_SEEDS } from '../../src/app/demoMode.ts';
import { DEMO_START_GAUGE, demoStartGauges } from '../../src/app/demo/demoGauge.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

afterEach(() => setDemoMode(null));

const chapter = (id: string) => CHAPTERS.find((c) => c.id === id)!;
const gauges = (b: FFXPartyBuild): number[] => b.members.map((m) => m.overdrive.gauge);

describe('173c: the demo fight starts on half-full Overdrive gauges', () => {
  it('the number is 50', () => {
    expect(DEMO_START_GAUGE).toBe(50);
  });

  it('demo mode, Chapter I (FFX): every member of the build starts on 50, nothing else in the build moves', () => {
    const c = chapter('seymour-flux');
    const before = gauges(c.buildRef as FFXPartyBuild);
    setDemoMode(true);
    const setup = setupForChapter(c, 7);
    const party = setup.party as FFXPartyBuild;
    expect(party.members.length).toBeGreaterThanOrEqual(3);
    for (const g of gauges(party)) expect(g).toBe(50);
    // the chapter's own data is not written to (the next setup, and every other mode, still read the original)
    expect(gauges(c.buildRef as FFXPartyBuild)).toEqual(before);
    // everything but the gauges is the chapter's build
    party.members.forEach((m, i) => {
      const o = (c.buildRef as FFXPartyBuild).members[i]!;
      expect({ ...m, overdrive: { ...m.overdrive, gauge: 0 } }).toEqual({ ...o, overdrive: { ...o.overdrive, gauge: 0 } });
    });
    expect(party.activeSlots).toBe((c.buildRef as FFXPartyBuild).activeSlots);
    expect(party.aeons).toBe((c.buildRef as FFXPartyBuild).aeons);
  });

  it('WITHOUT demo mode the build is the chapter\'s own object, byte for byte (normal play is unchanged)', () => {
    const c = chapter('seymour-flux');
    const setup = setupForChapter(c, 7);
    expect(setup.party).toBe(c.buildRef);
    expect(demoStartGauges('seymour-flux', c.buildRef)).toBe(c.buildRef);
  });

  it('demo mode, a chapter that is not a demo fight: the same object comes back', () => {
    setDemoMode(true);
    for (const id of ['yunalesca', 'braskas-final-aeon', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc']) {
      const c = CHAPTERS.find((x) => x.id === id);
      if (!c) continue;
      expect(setupForChapter(c, 3).party).toBe(c.buildRef);
    }
  });

  it('demo mode, Chapter IV (FFX-2): there is no Overdrive gauge to set; the build is the chapter\'s own object', () => {
    setDemoMode(true);
    const c = chapter('ffx2-bahamut');
    expect(setupForChapter(c, 56).party).toBe(c.buildRef);
  });

  it("exactly 50, above or below: the chapter has 50, 40 and 100 for the fielded three (Kimahri full is the sourced rule), and a demo sets all of them to the same half", () => {
    const c = chapter('seymour-flux');
    const b = c.buildRef as FFXPartyBuild;
    const own = Object.fromEntries(b.members.map((m) => [m.id, m.overdrive.gauge]));
    expect(own['tidus']).toBe(50);
    expect(own['yuna']).toBe(40);
    expect(own['kimahri']).toBe(100);
    setDemoMode(true);
    const out = demoStartGauges('seymour-flux', b);
    for (const id of b.activeSlots) expect(out.members.find((m) => m.id === id)!.overdrive.gauge).toBe(50);
  });

  it('a retry builds the setup again and starts on 50 again (a fresh object each time, same numbers)', () => {
    setDemoMode(true);
    const c = chapter('seymour-flux');
    const a = setupForChapter(c, 10).party as FFXPartyBuild;
    const b = setupForChapter(c, 12).party as FFXPartyBuild;
    expect(gauges(a)).toEqual(gauges(b));
    expect(new Set(gauges(a))).toEqual(new Set([50]));
  });

  it('the engine takes it: the party combatants hold 50 at the start of the fight, and the demo seeds still open on the party with the shipped line winning', async () => {
    await registerBattleContent();
    setDemoMode(true);
    const c = chapter('seymour-flux');
    for (const seed of DEMO_SEEDS['seymour-flux']!) {
      const setup = setupForChapter(c, seed);
      const e = new FFXEngine({ autoResolveMinigames: true });
      e.setSeed(setup.seed);
      e.init(setup);
      const st0 = e.state();
      const active = st0.activeIds.map((id) => (st0.combatants[id] as unknown as { overdrive?: { gauge: number } }).overdrive?.gauge);
      expect(active.length).toBeGreaterThanOrEqual(3);
      for (const g of active) expect(g).toBe(50);
      let firstActor: string | null = null;
      let enemyActedFirst = false;
      let outcome = 'none';
      for (let step = 0; step < 100_000; step++) {
        const d = e.nextDecision();
        if (d.kind === 'resolved' || d.kind === 'waiting') continue;
        if (d.kind === 'battle-over') {
          outcome = d.result.outcome;
          break;
        }
        if (firstActor === null) {
          firstActor = d.actorId;
          enemyActedFirst = e.state().log.some((ev) => ev.type === 'action-start');
        }
        const row = d.commands.find((r) => r.enabled && r.command.kind === 'attack') ?? d.commands.find((r) => r.enabled);
        const t = row?.validTargets[0];
        e.submit(intendedStrategy(d.actorId, d.commands, e as never) ?? (row ? ({ ...row.command, targets: t ? [t] : [] } as never) : ({ kind: 'defend', targets: [] } as never)));
      }
      expect(firstActor).not.toBeNull();
      expect(enemyActedFirst).toBe(false);
      expect(outcome).toBe('victory');
    }
  }, 180_000);
});
