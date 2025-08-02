import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Token } from '../models/token';

export interface AuthRequest extends Request {
  matchMakerId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const tokenDoc = await Token.findOne({ token: hashed });
  if (!tokenDoc) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.matchMakerId = tokenDoc.matchMaker.toString();
  next();
};
