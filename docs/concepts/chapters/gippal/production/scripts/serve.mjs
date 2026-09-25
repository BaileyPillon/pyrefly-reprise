import { createServer } from 'file:///D:/Final%20Fantasy/node_modules/vite/dist/node/index.js';
const server = await createServer({
  root: 'D:/Final Fantasy', configFile: 'D:/Final Fantasy/vite.config.ts',
  server: { port: 5800, strictPort: true, hmr: false, watch: null }, clearScreen: false,
});
await server.listen();
console.log('READY 5800 pid', process.pid);
