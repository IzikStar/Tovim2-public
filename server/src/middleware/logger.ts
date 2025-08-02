import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    const level: 'info' | 'error' = statusCode >= 400 ? 'error' : 'info';
    logger[level](`${method} ${originalUrl} ${statusCode} ${duration}ms`);
  });
  next();
};

export default requestLogger;
