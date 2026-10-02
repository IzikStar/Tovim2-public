import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: number;
  type?: string;
}

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
};

// Central error handler: maps known errors to 4xx and never leaks internals on 500.
export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  if (err instanceof mongoose.Error.ValidationError) {
    const fields = Object.fromEntries(
      Object.entries(err.errors).map(([path, e]) => [path, e.message])
    );
    return res.status(400).json({ error: 'Validation failed', fields });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Invalid value for ${err.path}` });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate value' });
  }
  // Errors raised by body-parser (malformed JSON, payload too large, ...)
  const status = err.status ?? err.statusCode;
  if (status && status >= 400 && status < 500) {
    return res.status(status).json({ error: err.type === 'entity.too.large' ? 'Payload too large' : 'Bad request' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
