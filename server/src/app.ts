import path from 'path';
import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import matchmakerRoutes from './routes/matchmakers.js';
import singleRoutes from './routes/singles.js';
import authRoutes from './routes/auth.js';
import requestRoutes from './routes/requests.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

/**
 * Allowed browser origins, from CLIENT_ORIGIN (comma-separated).
 * Defaults to the Vite dev server.
 */
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Builds the Express app. With `clientDist` (the path to the built client,
 * client/dist) the server also serves the web app on the same origin and the
 * API moves under /api, matching the Vite dev proxy, so client routes such as
 * /singles/:id don't hit the API.
 */
export const createApp = ({ clientDist }: { clientDist?: string } = {}) => {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: allowedOrigins }));
  // Singles carry base64 images, so the limit is higher than the 100kb default
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '10mb' }));

  const api = Router();

  api.use('/auth', authRoutes);
  api.use('/matchmakers', matchmakerRoutes);
  api.use('/singles', singleRoutes);
  api.use('/requests', requestRoutes);

  api.get('/', (_req: Request, res: Response<HelloResponse>) => {
    res.send({ message: 'Hello from Express + TypeScript' });
  });

  if (clientDist) {
    const root = path.resolve(clientDist);
    app.use('/api', api, notFound);
    app.use(express.static(root));
    // Single-page app: any other GET gets index.html and React Router takes over
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(root, 'index.html'));
    });
  } else {
    app.use(api);
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

interface HelloResponse {
  message: string;
}

export const app = createApp({ clientDist: process.env.CLIENT_DIST });

export default app;
