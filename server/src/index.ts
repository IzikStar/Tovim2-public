import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import matchmakerRoutes from './routes/matchmakers.js';
import singleRoutes from './routes/singles.js';
import authRoutes from './routes/auth.js';
import requestRoutes from './routes/requests.js';
import { Request, Response } from 'express';
import requestLogger from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled promise rejection', { err });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { err });
  process.exit(1);
});

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

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

app.use(errorHandler);

// Establish MongoDB connection before starting the server
connectDB()
  .then(() => {
    app.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to database', { error: err });
    process.exit(1);
  });
