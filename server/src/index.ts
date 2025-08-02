import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { Request, Response } from 'express';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

interface HelloResponse {
  message: string;
}

app.get('/', (_req: Request, res: Response<HelloResponse>) => {
  res.send({ message: 'Hello from Express + TypeScript' });
});

// Establish MongoDB connection before starting the server
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });
