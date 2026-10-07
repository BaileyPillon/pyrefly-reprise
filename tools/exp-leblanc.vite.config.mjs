// The experimental Leblanc chapter's smoke build (`tools/exp-smoke.mjs`): the repo's vite config, built into a scratch folder on D: WITHOUT copying
// public/ (the art is 10 GB). Never used by a release or a deploy: `npm run build` and `tools/deploy-pages.mjs` read `vite.config.ts` alone.
import { mergeConfig } from 'vite';
import factory from '../vite.config.ts';

export default (env) =>
  mergeConfig(factory(env), {
    build: { outDir: process.env.EXP_DIST ?? 'D:/Tools/pyrefly-scratch/exp-leblanc/dist-smoke', emptyOutDir: true, copyPublicDir: false },
  });
