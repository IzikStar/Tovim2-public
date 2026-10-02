import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Token } from '../models/token.js';
import { asyncHandler } from '../utils/http.js';

export interface AuthRequest extends Request {
  matchMakerId?: string;
  /** SHA-256 of the presented bearer token, as stored in the Token collection */
  tokenHash?: string;
}

const BEARER = /^Bearer ([A-Za-z0-9._~+/-]+=*)$/i;

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const authenticate = asyncHandler<AuthRequest>(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const match = BEARER.exec(authHeader);
  if (!match) {
    return res.status(401).json({ error: 'Invalid authorization header' });
  }
  const hashed = hashToken(match[1]);
  const tokenDoc = await Token.findOne({ token: hashed });
  if (!tokenDoc) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.matchMakerId = tokenDoc.matchMaker.toString();
  req.tokenHash = hashed;
  next();
});
