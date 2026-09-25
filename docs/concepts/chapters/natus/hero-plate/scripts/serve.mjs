// Scratch Vite server for the hero-plate captures (Chapters X and XI): HMR off, no watcher.
//   node serve.mjs [port]   (default 5860; the brief's range is 5860-5879). Stop it by its port.
import { createServer } from 'file:///D:/Final%20Fantasy/node_modules/vite/dist/node/index.js';
const port = Number(process.argv[2] || 5860);
const server = await createServer({ root: 'D:/Final Fantasy', configFile: 'D:/Final Fantasy/vite.config.ts',
  server: { port, strictPort: true, hmr: false, watch: null }, clearScreen: false });
await server.listen();
console.log('READY', port, 'pid', process.pid);
