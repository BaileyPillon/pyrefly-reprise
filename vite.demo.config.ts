// The conference-demo playtest server (Bailey's playtest, 2026-10-22): the repo's own config plus the Tidus T1/T2 art switch (`tools/vite-art-variant.mjs`).
//   node node_modules/vite/bin/vite.js --config vite.demo.config.ts --port 5320
// It changes no source and no junction and is never used by a build, a deploy or a test; the page is then opened as
//   http://127.0.0.1:5320/?demo=1&pack=demo&switchboard=1&tidus=t1   (or &tidus=t2)
import { mergeConfig, type UserConfig, type UserConfigFnObject } from 'vite';
import base from './vite.config.ts';
import { pyreflyArtVariant } from './tools/vite-art-variant.mjs';

export default async (env: Parameters<UserConfigFnObject>[0]): Promise<UserConfig> => {
  const cfg = typeof base === 'function' ? await (base as UserConfigFnObject)(env) : (base as UserConfig);
  return mergeConfig(cfg, { plugins: [pyreflyArtVariant()] });
};
