import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const createVerifySolutionMiddleware = (secret?: string) => {
  return (req: any, res: any, next: any) => {
    if (!req.url?.startsWith('/api/verify-solution')) {
      next();
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, message: 'Method not allowed' }));
      return;
    }

    if (!secret) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, message: 'Server password is not configured' }));
      return;
    }

    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      let parsed: { password?: string } = {};
      try {
        parsed = body ? JSON.parse(body) : {};
      } catch {
        // Ignore parse errors and handle as invalid payload.
      }

      const isValid = parsed.password === secret;
      res.statusCode = isValid ? 200 : 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          ok: isValid,
          message: isValid ? 'Password accepted' : 'Invalid password'
        })
      );
    });
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const password = env.SOLUTION_PASSWORD ?? 'aaa123!';

  return {
    plugins: [
      react(),
      {
        name: 'function-guesser-solution-password',
        configureServer(server) {
          server.middlewares.use(createVerifySolutionMiddleware(password));
        },
        configurePreviewServer(server) {
          server.middlewares.use(createVerifySolutionMiddleware(password));
        }
      }
    ]
  };
});
