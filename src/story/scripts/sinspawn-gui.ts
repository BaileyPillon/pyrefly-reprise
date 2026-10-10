/** PLACEHOLDER-GUI: scaffold only; the intro and outro are written from the research. */
import type { ChapterScripts } from '../dsl.ts';
import { battleStart, results } from '../dsl.ts';

export const sinspawnGuiScripts: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};

export default sinspawnGuiScripts;
