import { Router } from 'express';
import crypto from 'crypto';
import { MatchMaker } from '../models/matchMaker.js';
import { Token } from '../models/token.js';
import { authenticate, AuthRequest, hashToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { isLegacyHash, verifyPassword } from '../utils/password.js';

const router = Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  // Reject non-string input so query operators like {"$ne": null} can't reach Mongo
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const matchMaker = await MatchMaker.findOne({ email }).select('+password');
  if (!matchMaker || !(await verifyPassword(password, matchMaker.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (isLegacyHash(matchMaker.password)) {
    // Upgrade old unsalted SHA-256 hashes to scrypt on successful login
    matchMaker.password = password;
    await matchMaker.save();
  }
  const rawToken = crypto.randomBytes(32).toString('hex');
  await Token.create({ matchMaker: matchMaker._id, token: hashToken(rawToken) });
  res.json({ token: rawToken, matchMakerId: matchMaker._id });
}));

router.post('/logout', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  await Token.deleteOne({ token: req.tokenHash });
  res.json({ message: 'Logged out' });
}));

export default router;
