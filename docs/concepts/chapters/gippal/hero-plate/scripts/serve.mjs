// Scratch Vite server for the hero-plate captures: HMR off, no watcher, strict port.
//   node serve.mjs <port>     (5820-5839 for this round)
import { createServer } from 'file:///D:/Final%20Fantasy/node_modules/vite/dist/node/index.js';
const PORT = Number(process.argv[2] || 5821);
const server = await createServer({ root: 'D:/Final Fantasy', configFile: 'D:/Final Fantasy/vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false, watch: null }, clearScreen: false });
await server.listen();
console.log('READY', PORT, 'pid', process.pid);
