/**
 * CHK-011: every targetable enemy is visible, promoted from the round scratch
 * probes (thresholds program batch 5, 2026-09-26).
 *
 * Per listed chapter and viewport the spec enters the fight and measures, from
 * `window.__pyrefly.targeting()` (the stage's own painter-order coverage of each
 * projected quad):
 *   - at the first menu, the default framing: each alive enemy's occluded share
 *     (1 - visible) against the 25 percent rule, and its share outside the
 *     viewport (visible - visibleInFrame); party members the same way, since the
 *     rule also covers a party member hidden behind an aeon;
 *   - with a target cursor up (real keys), whether every occluder of the
 *     selected target fades (`dim` > 0);
 *   - at 1600x900 and 390x844 (or every viewport with `CHK_ALL_FORMS=1`), each
 *     later form and chain link: the shipped "intended" auto-strategy plays on at
 *     fast speed and every change of link or alive-enemy roster is measured once
 *     the camera has settled.
 *
 * A measuring stick for batches 2 and 3: a JSON report per chapter and viewport
 * (see `support/stage-measure.ts`), failing only on its own errors unless
 * `CHK_STRICT=1`. `CHK_CHAPTERS=a,b` narrows it. Run against a production build.
 *
 * Both games: shared plumbing (the painted stage is the same in both).
 */
import process from 'node:process';

import { expect, test, type Page } from '@playwright/test';

import {
  STRICT, enterBattle, listedChapters, readActors, rosterSignature, screenName, settle, writeReport, type Actor,
} from './support/stage-measure.ts';

const VIEWPORTS = [
  { width: 1280, height: 720, forms: false },
  { width: 1600, height: 900, forms: true },
  { width: 2000, height: 1000, forms: false },
  { width: 2560, height: 1440, forms: false },
  { width: 390, height: 844, forms: true, phone: true },
] as const;

const MAX_OCCLUDED = 0.25;
const ALL_FORMS = process.env['CHK_ALL_FORMS'] === '1';

interface Sample {
  at: string;
  signature: string;
  enemies: { id: string; occluded: number; offFrame: number; occludedBy: string[] }[];
  party: { id: string; occluded: number; offFrame: number; occludedBy: string[] }[];
  failures: string[];
}

const pct = (n: number): number => Math.round(n * 1000) / 10;

function sampleOf(at: string, signature: string, actors: Actor[]): Sample {
  const row = (a: Actor) => ({ id: a.id, occluded: pct(1 - a.visible), offFrame: pct(Math.max(0, a.visible - a.visibleInFrame)), occludedBy: a.occludedBy });
  const alive = actors.filter((a) => a.alive);
  const enemies = alive.filter((a) => a.side === 'enemy').map(row);
  const party = alive.filter((a) => a.side !== 'enemy').map(row);
  const failures = [...enemies, ...party]
    .filter((r) => r.occluded > MAX_OCCLUDED * 100 || r.occluded + r.offFrame > MAX_OCCLUDED * 100)
    .map((r) => `${r.id} ${r.occluded}% covered${r.offFrame ? `, ${r.offFrame}% off frame` : ''}${r.occludedBy.length ? ` by ${r.occludedBy.join('+')}` : ''}`);
  return { at, signature, enemies, party, failures };
}

async function openTargetCursor(page: Page): Promise<boolean> {
  const selecting = () =>
    page.evaluate(() => (window.__pyrefly!.targeting()?.selection ?? null) !== null || document.querySelectorAll('[data-target-id]').length > 0);
  for (const key of ['ArrowDown', 'ArrowUp']) {
    for (let i = 0; i < 10; i++) {
      const label = await page.evaluate(() => (document.querySelector('.ig-cmd-stack .ig-cmd--selected')?.textContent ?? '').trim());
      if (/^attack/i.test(label)) break;
      await page.keyboard.press(key);
      await page.waitForTimeout(110);
    }
  }
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Enter');
    for (let t = 0; t < 8; t++) {
      await page.waitForTimeout(150);
      if (await selecting()) return true;
    }
  }
  return false;
}

for (const vp of VIEWPORTS) {
  test.describe(`CHK-011 enemy visibility at ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, ...('phone' in vp ? { hasTouch: true, isMobile: true } : {}) });
    for (const ch of listedChapters()) {
      test(`${ch.id}`, async ({ page }) => {
        const forms = vp.forms || ALL_FORMS;
        test.setTimeout(forms ? 420_000 : 180_000);
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        await enterBattle(page, ch.id);

        const samples: Sample[] = [];
        let signature = await rosterSignature(page);
        samples.push(sampleOf('first menu, default framing', signature, await readActors(page)));

        // Occluders fade while targeting.
        let fade: { target: string | null; occluders: { id: string; dim: number }[] } | null = null;
        if (await openTargetCursor(page)) {
          await settle(page, 12);
          const t = await page.evaluate(() => window.__pyrefly!.targeting());
          const target = t?.selectedIds[0] ?? null;
          const occ = target ? (t?.rects[target]?.occludedBy ?? []) : [];
          fade = { target, occluders: occ.map((id) => ({ id, dim: Math.round((t?.rects[id]?.dim ?? 0) * 100) / 100 })) };
          await page.keyboard.press('Escape');
          await page.waitForTimeout(400);
        }

        // Later forms and links, played on by the shipped strategy.
        let played = false;
        if (forms) {
          played = await page.evaluate(() => {
            const api = window.__pyrefly!;
            api.setBattleSpeed('fast');
            return api.autoBattle('intended');
          });
          const deadline = Date.now() + 300_000;
          while (Date.now() < deadline && (await screenName(page)) === 'battle') {
            await page.waitForTimeout(500);
            const next = await rosterSignature(page).catch(() => signature);
            if (next === signature) continue;
            signature = next;
            await page.waitForTimeout(1800); // the seam camera settles
            if ((await screenName(page)) !== 'battle') break;
            samples.push(sampleOf(`after a roster change (${next})`, next, await readActors(page)));
          }
        }

        const failures = samples.flatMap((s) => s.failures.map((f) => `${s.at}: ${f}`));
        const unfaded = (fade?.occluders ?? []).filter((o) => o.dim <= 0).map((o) => o.id);
        const file = writeReport(`enemy-visibility-${ch.id}-${vp.width}x${vp.height}`, {
          check: 'CHK-011', chapter: ch.id, game: ch.game, viewport: `${vp.width}x${vp.height}`, seed: 1, rule: `occluded (and off frame) <= ${MAX_OCCLUDED * 100}%`,
          formsPlayed: played, endScreen: await screenName(page), samples: samples.length, failures, targeting: fade, occludersNotFaded: unfaded, detail: samples, errors,
        });
        console.log(`CHK-011 ${ch.id} ${vp.width}x${vp.height}: ${samples.length} samples, ${failures.length} over ${MAX_OCCLUDED * 100}%, ${unfaded.length} unfaded occluders -> ${file}`);

        expect(samples[0]?.enemies.length ?? 0, 'enemies were projected').toBeGreaterThan(0);
        expect(errors).toEqual([]);
        if (STRICT) {
          expect(failures, 'CHK-011: no targetable enemy or party member more than 25% hidden').toEqual([]);
          expect(unfaded, 'CHK-011: occluders fade while targeting').toEqual([]);
        }
      });
    }
  });
}
