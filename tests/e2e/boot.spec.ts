import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    __pyrefly: {
      version: string;
      screen(): string;
      goto(name: string): Promise<boolean>;
      frame(): Promise<void>;
      snapshotState(): Record<string, unknown>;
      setSeed(n: number): void;
      waitReady(): Promise<void>;
    };
    __pyreflyReady?: boolean;
  }
}

test('boots, renders the demo diorama and logs no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto('/');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 30_000 });

  // The debug API is present and complete.
  const api = await page.evaluate(() => ({
    version: window.__pyrefly.version,
    screen: window.__pyrefly.screen(),
    keys: Object.keys(window.__pyrefly).sort(),
  }));
  expect(api.version).toBeTruthy();
  expect(api.screen).toBe('title');
  for (const key of ['app', 'frame', 'goto', 'screen', 'setSeed', 'snapshotState', 'waitReady']) {
    expect(api.keys).toContain(key);
  }

  // A real WebGL context is backing the canvas.
  const hasGl = await page.evaluate(() => {
    const canvas = document.querySelector('#game canvas') as HTMLCanvasElement | null;
    return Boolean(canvas && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  });
  expect(hasGl).toBe(true);

  // Jump to the demo scene and let it settle.
  const ok = await page.evaluate(() => window.__pyrefly.goto('demo'));
  expect(ok).toBe(true);
  await page.evaluate(async () => {
    for (let i = 0; i < 90; i++) await window.__pyrefly.frame();
  });
  await page.waitForTimeout(700);
  await page.evaluate(async () => {
    for (let i = 0; i < 20; i++) await window.__pyrefly.frame();
  });

  const state = await page.evaluate(() => window.__pyrefly.snapshotState());
  expect(state['screen']).toBe('demo');
  expect((state['frameCount'] as number) > 60).toBe(true);

  // The frame is not black: sample the rendered canvas.
  const luminance = await page.evaluate(() => {
    const canvas = document.querySelector('#game canvas') as HTMLCanvasElement;
    const copy = document.createElement('canvas');
    copy.width = 160;
    copy.height = 90;
    const ctx = copy.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0, copy.width, copy.height);
    const data = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let sum = 0;
    let bright = 0;
    for (let i = 0; i < data.length; i += 4) {
      const l = (data[i]! * 0.2126 + data[i + 1]! * 0.7152 + data[i + 2]! * 0.0722) / 255;
      sum += l;
      if (l > 0.35) bright++;
    }
    return { mean: sum / (data.length / 4), brightPixels: bright };
  });
  expect(luminance.mean).toBeGreaterThan(0.02);
  expect(luminance.brightPixels).toBeGreaterThan(50);

  await page.screenshot({ path: 'docs/screenshots/00-demo-scene.png' });

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
});

/**
 * The data tables actually reach the engines.
 *
 * This is the assertion that would have caught the project's worst silent
 * defect on day one. `src/battle/**` may not import `src/data/**`, so the app
 * has to hand each engine its content at boot — and when that wiring was
 * missing, every FFX battle still *looked* fine: actors staged, HUD drawn,
 * turns taken. Underneath, the engine knew only its four structural
 * `CORE_ABILITIES`, so no spell, item or Overdrive existed, every boss could
 * only auto-attack, and Yunalesca's rotation could never resolve at all.
 *
 * A boolean "engine present" check stays green through all of that. A count
 * does not.
 */
test('the ability and item tables are registered with both engines', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 30_000 });

  const wiring = await page.evaluate(
    () =>
      (
        window as unknown as {
          __pyrefly: { wiring(): Promise<Record<string, boolean | number | string>> };
        }
      ).__pyrefly.wiring(),
  );

  expect(wiring['engineFfx'], 'the FFX engine must be constructible').toBe(true);
  expect(wiring['engineFfx2'], 'the FFX-2 engine must be constructible').toBe(true);

  // Generous floors: the real tables are in the hundreds, so these only ever
  // fire when the wiring is genuinely gone, not when content is still growing.
  expect(Number(wiring['abilitiesFfx']), 'FFX abilities registered').toBeGreaterThan(50);
  expect(Number(wiring['itemsFfx']), 'FFX items registered').toBeGreaterThan(5);
  expect(Number(wiring['abilitiesFfx2']), 'FFX-2 abilities registered').toBeGreaterThan(50);
  expect(Number(wiring['itemsFfx2']), 'FFX-2 items registered').toBeGreaterThan(5);
  expect(Number(wiring['dresspheresFfx2']), 'FFX-2 dresspheres registered').toBeGreaterThan(5);
  expect(Number(wiring['garmentGridsFfx2']), 'FFX-2 Garment Grids registered').toBeGreaterThan(5);

  // And the mid-battle story runner is reachable, so `script-trigger` beats play.
  expect(wiring['cutsceneRunner'], 'a mid-battle cutscene runner must be available').toBe(true);
});
