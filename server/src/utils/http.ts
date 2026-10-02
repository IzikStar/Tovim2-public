import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Types } from 'mongoose';

/**
 * Express 4 does not catch rejected promises from async handlers; this forwards
 * them to the central error handler instead of crashing the process.
 */
export const asyncHandler =
  <Req extends Request = Request>(
    fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler =>
  (req, res, next) => {
    fn(req as Req, res, next).catch(next);
  };

/** Copies only the allowed keys from an untrusted request body. */
export const pick = (
  body: unknown,
  allowed: readonly string[]
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  if (!body || typeof body !== 'object') {
    return result;
  }
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      result[key] = (body as Record<string, unknown>)[key];
    }
  }
  return result;
};

export const isValidObjectId = (value: unknown): value is string =>
  typeof value === 'string' && Types.ObjectId.isValid(value) && /^[a-f0-9]{24}$/i.test(value);
