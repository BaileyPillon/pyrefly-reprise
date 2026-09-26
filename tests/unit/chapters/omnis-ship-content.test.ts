/**
 * Chapter XII (Seymour Omnis) ship layer: the registered record (still unlisted), the pause
 * card, the guide and the tactic. The tactic is run on the real engine and the approved build
 * (AGENTS.md rule 3): it must be the bench's intended line, so it must win like it.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import { CHAPTERS, CHAPTER_IDS, UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { SEYMOUR_OMNIS } from '../../../src/data/chapter-seymour-omnis.ts';
import { OMNIS_SCENE_KEY, OMNIS_STAND_IN_CUES, SEYMOUR_OMNIS_SHIPPED } from '../../../src/data/chapter-omnis-ship.ts';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { SEYMOUR_OMNIS_META } from '../../../src/data/chapter-meta-seymour-omnis.ts';
import { guideForChapter } from '../../../src/data/guides/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../../src/data/ffx/index.ts';
import { seymourOmnisScripts } from '../../../src/story/scripts/seymour-omnis.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { SEYMOUR_OMNIS_BOSS_ID, seymourOmnis } from '../../../src/engine/tactics/seymour-omnis.ts';
import { departureKindOf } from '../../../src/engine/BattlePresenterDepartures.ts';
import { SPEAKER_ROLES } from '../../../src/ui/common/speaker-roles.ts';
import { OMNIS, newEngine } from '../helpers/omnisUnits.ts';

describe('the registered record: LISTED (2026-09-25, D-162), with the ship layer on', () => {
  it('getChapter finds it on the Garden of Pain with the story and the stand-in cues; chapter select lists it after Chapter IX', () => {
    const ch = getChapter('seymour-omnis');
    expect(ch).toBe(SEYMOUR_OMNIS_SHIPPED);
    expect(ch?.sceneKey).toBe(OMNIS_SCENE_KEY);
    expect(ch?.scriptsRef).toBe(seymourOmnisScripts);
    expect(ch?.music).toEqual({ ...SEYMOUR_OMNIS.music, ...OMNIS_STAND_IN_CUES });
    expect(ch?.music.battle).toBe('boss-seymour'); // B18's named stand-in until the new cue is picked by ear
    expect(ch?.game).toBe('ffx');
    expect(ch?.number).toBe(12);
    expect(UNLISTED_CHAPTERS).not.toContain(SEYMOUR_OMNIS_SHIPPED);
    expect(CHAPTERS).toContain(SEYMOUR_OMNIS_SHIPPED);
    expect(CHAPTER_IDS.indexOf('seymour-omnis')).toBe(CHAPTER_IDS.indexOf('seymour-natus') + 2); // X listed the same day, XI between them since 2026-09-26
    expect(CHAPTERS.map((c) => c.id)).toEqual(CHAPTER_IDS);
  });

  it('lays the layer over the engine track\'s fight without touching it', () => {
    expect(SEYMOUR_OMNIS_SHIPPED.enemyGroupRef).toBe(SEYMOUR_OMNIS.enemyGroupRef);
    expect(SEYMOUR_OMNIS_SHIPPED.buildRef).toBe(SEYMOUR_OMNIS.buildRef);
    expect(SEYMOUR_OMNIS_SHIPPED.sensorTexts).toBe(SEYMOUR_OMNIS.sensorTexts);
    expect(SEYMOUR_OMNIS.sceneKey).toBe('gagazet'); // the record itself is unchanged
  });

  it('Seymour is held at the blow (the post scene sends him), and he speaks as "Seymour" with a role', () => {
    expect(departureKindOf('seymour-omnis')).toBe('held');
    expect(departureKindOf('mortiphasm-1')).toBe('dissolve'); // never KO'd: an unkillable part
    expect(SPEAKER_ROLES['seymour-omnis']).toBe('Maester');
  });
});

describe('the pause card (listed with the chapter)', () => {
  it('is the listed meta, in FFX\'s voice, numeral XII, on the locked hero plate with the portrait fallback', () => {
    expect(getChapterMeta('seymour-omnis')).toBe(SEYMOUR_OMNIS_META);
    expect(UNLISTED_CHAPTER_META).not.toContain(SEYMOUR_OMNIS_META);
    expect(CHAPTER_META).toContain(SEYMOUR_OMNIS_META);
    expect(SEYMOUR_OMNIS_META).toMatchObject({
      gameLabel: 'FFX',
      numeral: 'XII',
      title: SEYMOUR_OMNIS.title,
      location: SEYMOUR_OMNIS.location,
      heroArt: 'pause/ch12-seymour-omnis',
      heroArtFallback: 'portraits/seymour-omnis.png',
    });
  });

  it('quotes a line the pre scene plays, and lists the cues the chapter plays', () => {
    const pre = seymourOmnisScripts.pre.flatMap((st) => (st.type === 'say' ? [st.text] : []));
    expect(pre).toContain(SEYMOUR_OMNIS_META.quote.text);
    const m = SEYMOUR_OMNIS_SHIPPED.music;
    expect([...SEYMOUR_OMNIS_META.musicKeys]).toEqual([m.scene, m.battle, m.victory]);
  });

  it('every objective names an ability his data has, a quarter that is 20,000 of his HP, or the win', () => {
    const ids = new Set(SEYMOUR_OMNIS.enemyGroupRef.enemies.flatMap((e) => e.abilityIds));
    const omnis = SEYMOUR_OMNIS.enemyGroupRef.enemies.find((e) => e.id === OMNIS)!;
    for (const o of SEYMOUR_OMNIS_META.objectives) {
      if (o.rule.kind === 'survived-ability') expect(ids.has(o.rule.ability), o.id).toBe(true);
      if (o.rule.kind === 'boss-hp-below') expect(o.rule.fraction * omnis.stats.maxHp).toBe(20_000);
    }
    expect(SEYMOUR_OMNIS_META.objectives.at(-1)?.rule.kind).toBe('victory');
  });

  it('never names the ring order or the reset cycle (the two estimates B8 holds the listing on)', () => {
    const text = [SEYMOUR_OMNIS_META.blurb, SEYMOUR_OMNIS_META.tip, SEYMOUR_OMNIS_META.handwritten].join(' ').toLowerCase();
    for (const word of ['clockwise', 'cycle', 'order', 'then water', 'then ice']) expect(text).not.toContain(word);
  });
});

describe('the guide and the tactic (FFX only)', () => {
  const guide = guideForChapter('seymour-omnis')!;

  it('the guide is found by Seymour alone, and every hint names a row the game offers', () => {
    expect(guide.bossIds).toEqual([SEYMOUR_OMNIS_BOSS_ID]);
    expect(SEYMOUR_OMNIS_BOSS_ID).toBe(OMNIS);
    const names = new Set([...ALL_ABILITIES.map((a) => a.name), ...Object.values(ITEMS).map((i) => i.name)]);
    for (const h of guide.hints) for (const label of h.when.labels ?? []) expect(names.has(label), label).toBe(true);
    for (const p of guide.phases) expect(p.aboveHpFraction ?? p.belowHpFraction).toBe(0.25);
  });

  it('the tactic is registered under FFX for this chapter only, and the board finds it', () => {
    expect(CHAPTER_GAME['seymour-omnis']).toBe('ffx');
    expect(TACTICS.filter((t) => t.chapterId === 'seymour-omnis').map((t) => t.bossId)).toEqual([OMNIS]);
    expect(tacticFor(newEngine(1))).toBe(seymourOmnis);
  });

  it('is the bench\'s intended line: on the approved build it wins like it (127 of 200 there)', () => {
    let wins = 0;
    const seeds = 200;
    for (let seed = 1; seed <= seeds; seed++) {
      const engine = newEngine(seed);
      for (let i = 0; i < 8000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') engine.submit(seymourOmnis(d.actorId, d.commands, engine) ?? { kind: 'defend', targets: [] });
      }
      if (engine.state().result?.outcome === 'victory') wins++;
    }
    console.log(`[omnis tactic] ${wins}/${seeds} wins on the Garden of Pain build`);
    expect(wins).toBeGreaterThanOrEqual(110);
    expect(wins).toBeLessThanOrEqual(145);
  }, 180_000); // about 12 s alone: 200 whole fights on the real engine
});
