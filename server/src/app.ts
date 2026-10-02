import express, { Request, Response } from 'express';
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

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins }));
// Singles carry base64 images, so the limit is higher than the 100kb default
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '10mb' }));

app.use('/auth', authRoutes);
app.use('/matchmakers', matchmakerRoutes);
app.use('/singles', singleRoutes);
app.use('/requests', requestRoutes);

interface HelloResponse {
  message: string;
}

app.get('/', (_req: Request, res: Response<HelloResponse>) => {
  res.send({ message: 'Hello from Express + TypeScript' });
});

app.use(notFound);
app.use(errorHandler);

export default app;
