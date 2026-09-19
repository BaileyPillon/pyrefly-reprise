// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The Active / Wait indicator's row, and who is allowed to have one.
 *
 * The adversarial verifier's pass 2, MAJOR: `.ffx2-atbmode` ("ACTIVE — ATB
 * RUNNING") was absolutely positioned at 12,10 in the 640x360 grid, straight
 * on top of `.ig-bosshp` at 21.33,17.78 — it clipped "Vegnagun" to "egnagun"
 * in Chapter 5, cut the B off "Bahamut" in Chapter 4, and buried the PAUSE
 * hint, at 1280x720 and at 2000x1000. The approved frame
 * `docs/concepts/targeting/b-ring-and-dim/s3.png` stacks them: chip on its own
 * top row, boss HP bar on its own row below, nothing overlapping.
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX-2 only.** The Active/Wait indicator is
 * a real FFX-2 Config entry — the ATB either keeps counting while a menu is
 * open or holds. FFX's CTB has no such setting and no such chip
 * [research/ffx-vs-ffx2-presentation.md, the ATB/CTB rows], which is what the
 * second half of this file asserts.
 *
 * Read off the stylesheet rather than off a layout, because jsdom does not lay
 * out: these are the authored grid numbers, and the browser pass in
 * `docs/screenshots/fix3/prerelease/targeting/` is what confirms the pixels.
 */

const FFX2_CSS = readFileSync(join(process.cwd(), 'src', 'ui', 'ffx2', 'ffx2-hud.css'), 'utf8');
const FFX_CSS = readFileSync(join(process.cwd(), 'src', 'ui', 'ffx', 'ffx-hud.css'), 'utf8');

function token(name: string): number {
  const m = new RegExp(`--${name}:\\s*([0-9.]+)px`).exec(FFX2_CSS);
  if (!m) throw new Error(`no --${name} token in ffx2-hud.css`);
  return Number(m[1]);
}

describe('the FFX-2 Active/Wait chip has a row of its own', () => {
  it('cannot overlap the boss HP strip', () => {
    const chipTop = token('x2-atbmode-top');
    const chipHeight = token('x2-atbmode-height');
    const stripTop = token('x2-enemies-top');
    expect(stripTop).toBeGreaterThanOrEqual(chipTop + chipHeight);
  });

  it('starts below the PAUSE chip, which is mounted in device px outside the stage', () => {
    // `.battle-pause-chip` is left 22 / top 18 device px with ~22px of height.
    // At 1280x720 the 640x360 stage scales by exactly 2, so that chip covers
    // grid y 9..20. Anything at 17.78 (the strip's old anchor) is under it.
    expect(token('x2-atbmode-top')).toBeGreaterThanOrEqual(21);
  });

  it('shares the boss strip left edge, so the two rows read as one stack', () => {
    const chip = /\.ffx2-atbmode\s*\{[^}]*\}/.exec(FFX2_CSS)?.[0] ?? '';
    expect(chip).toMatch(/left:\s*21\.33px/);
    expect(chip).not.toMatch(/left:\s*12px/);
  });

  it('the strip reads its top from the token, not from the old 17.78 anchor', () => {
    const strip = /\.ffx2hud__enemies\s*\{[^}]*\}/.exec(FFX2_CSS)?.[0] ?? '';
    expect(strip).toMatch(/top:\s*var\(--x2-enemies-top/);
  });
});

describe('FFX chapters never create the indicator (rule 14)', () => {
  it('no FFX source builds or styles a `.ffx2-atbmode`', async () => {
    expect(FFX_CSS).not.toContain('ffx2-atbmode');
    const hud = readFileSync(join(process.cwd(), 'src', 'ui', 'ffx', 'FFXBattleHud.ts'), 'utf8');
    expect(hud).not.toContain('atbmode');
    expect(hud).not.toContain('ATB RUNNING');
    expect(hud).not.toContain('ATB HELD');
  });

  it('a mounted FFX HUD has no Active/Wait chip in its DOM', async () => {
    const { FFXBattleHud } = await import('../../src/ui/ffx/FFXBattleHud.ts');
    const root = document.createElement('div');
    document.body.append(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    expect(root.querySelector('.ffx2-atbmode')).toBeNull();
    // ...and the FFX-2 HUD does have one, so the assertion above is not
    // passing because the class was simply renamed out of existence.
    const { FFX2BattleHud } = await import('../../src/ui/ffx2/FFX2BattleHud.ts');
    const root2 = document.createElement('div');
    document.body.append(root2);
    const hud2 = new FFX2BattleHud();
    hud2.mount(root2);
    expect(root2.querySelector('.ffx2-atbmode')).not.toBeNull();
    hud.unmount();
    hud2.unmount();
  });
});
