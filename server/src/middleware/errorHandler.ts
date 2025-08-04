import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status =
    err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500;
  logger.error(err.message, { stack: err.stack });
  const message = status === 500 ? 'Internal server error' : err.message;
  res.status(status).json({ error: message });
};

export default errorHandler;
