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

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
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
