import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
};

export default errorHandler;
