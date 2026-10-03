// DEV-ONLY: the repo's vite config + the preview art overlay, HMR and file watching off (a capture run must not
// reload under the page). PORT and PREVIEW_ART_ROOT come from the environment. Never used by build or deploy.
import { resolve } from 'node:path';
import base from '../../vite.config.ts';
import { previewArtPlugin } from './preview-art-plugin.mjs';

const REPO = resolve(import.meta.dirname, '..', '..');
const port = Number(process.env.PREVIEW_PORT || 6210);
const overlayRoot = process.env.PREVIEW_ART_ROOT || 'D:/Tools/pyrefly-scratch/2026-10-03/visual-options/preview/art-root';

export default (env) => {
  const c = typeof base === 'function' ? base(env) : base;
  return {
    ...c,
    root: REPO,
    plugins: [...(c.plugins ?? []), previewArtPlugin({ overlayRoot, installedRoot: resolve(REPO, 'public', 'art') })],
    cacheDir: `D:/Tools/pyrefly-scratch/2026-10-03/visual-options/vite-cache-${port}`,
    server: { port, host: '127.0.0.1', strictPort: true, hmr: false, watch: { ignored: ['**/*'] }, fs: { strict: false } },
  };
};
