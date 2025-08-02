import { Router } from 'express';
import crypto from 'crypto';
import { MatchMaker } from '../models/matchMaker.js';
import { Token } from '../models/token.js';

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

export default router;
