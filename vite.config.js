import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const DEV_BODY_LIMIT = 64 * 1024;

/**
 * Dev-only bridge so `npm run dev` can serve the /api functions without the Vercel CLI.
 * It mimics the small part of the Vercel Node runtime we use (req.body, res.status, res.json).
 * `npx vercel dev` handles /api itself and never reaches this middleware.
 */
function devApi() {
  return {
    name: 'utsav-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = /^\/api\/([a-z]+)(?:\?.*)?$/.exec(req.url ?? '');
        if (!match) return next();

        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (payload) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(payload));
        };

        let mod;
        try {
          mod = await server.ssrLoadModule(`/api/${match[1]}.js`);
        } catch {
          return res.status(404).json({ error: 'Not found' });
        }

        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > DEV_BODY_LIMIT) return res.status(413).json({ error: 'Body too large' });
        }
        try {
          req.body = raw ? JSON.parse(raw) : undefined;
        } catch {
          return res.status(400).json({ error: 'Invalid JSON' });
        }

        try {
          await mod.default(req, res);
        } catch (err) {
          server.config.logger.error(`[api] ${err?.name ?? 'Error'}: ${err?.message ?? ''}`);
          if (!res.writableEnded) res.status(500).json({ error: 'Internal error' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Expose only the two server-side vars to the dev /api bridge (never to the client bundle).
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['GEMINI_API_KEY', 'GEMINI_MODEL']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }

  return {
    plugins: [react(), tailwindcss(), devApi()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.js'],
      include: ['tests/**/*.test.{js,jsx}'],
      restoreMocks: true,
      testTimeout: 35000,
    },
  };
});
