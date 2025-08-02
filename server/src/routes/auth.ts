import { Router } from 'express';
import crypto from 'crypto';
import { MatchMaker } from '../models/matchMaker';
import { Token } from '../models/token';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const matchMaker = await MatchMaker.findOne({ email });
  if (!matchMaker) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const hashed = crypto.createHash('sha256').update(password).digest('hex');
  if (hashed !== matchMaker.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await Token.create({ matchMaker: matchMaker._id, token: tokenHash });
  res.json({ token: rawToken, matchMakerId: matchMaker._id });
});

router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization!;
  const token = authHeader.split(' ')[1];
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  await Token.deleteOne({ token: hashed });
  res.json({ message: 'Logged out' });
});

export default router;
