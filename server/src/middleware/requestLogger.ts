import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/** One line per HTTP request: method, path, status and duration. */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on('finish', () => {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    };
    if (res.statusCode >= 500) logger.error('HTTP request', meta);
    else if (res.statusCode >= 400) logger.warn('HTTP request', meta);
    else logger.info('HTTP request', meta);
  });
  next();
};
