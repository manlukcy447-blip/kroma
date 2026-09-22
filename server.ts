import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app, ensureAdmin } from './server/index.js';

process.env.AIS_MIDDLEWARE = 'true';

const PORT = 3000;

async function startServer() {
  try {
    await ensureAdmin();
  } catch (err: any) {
    console.warn('[AI Studio] Admin bootstrap notice:', err?.message || err);
  }

  const httpServer = http.createServer(app);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Kroma Full-Stack App running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
