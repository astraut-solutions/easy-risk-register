import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const config = defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000
  }
});

const server = await createServer({
  ...config,
  configFile: false, // Don't use vite.config.js
});
await server.listen();
server.printUrls();