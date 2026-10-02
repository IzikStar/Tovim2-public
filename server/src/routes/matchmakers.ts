import { Router } from 'express';
import { MatchMaker } from '../models/matchMaker.js';
import { Single } from '../models/single.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { Token } from '../models/token.js';
import { asyncHandler, pick } from '../utils/http.js';

const router = Router();

const MATCHMAKER_FIELDS = [
  'firstName',
  'lastName',
  'phoneNumber',
  'email',
  'password',
  'city',
  'gender',
  'sector',
  'expertSectors',
] as const;

/** What one matchmaker may see about the others (no contacts, no password). */
const OTHER_MATCHMAKER_PROJECTION = {
  firstName: 1,
  lastName: 1,
  city: 1,
  sector: 1,
  expertSectors: 1,
} as const;

router.post('/', asyncHandler(async (req, res) => {
  const matchMaker = await MatchMaker.create(pick(req.body, MATCHMAKER_FIELDS));
  res.status(201).json(matchMaker); // toJSON strips the password
}));

router.put('/:id', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  if (req.matchMakerId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const matchMaker = await MatchMaker.findById(req.params.id);
  if (!matchMaker) {
    return res.status(404).json({ error: 'Not found' });
  }
  // Load + save (not findByIdAndUpdate) so validation and the password-hashing hook run
  matchMaker.set(pick(req.body, MATCHMAKER_FIELDS));
  await matchMaker.save();
  res.json(matchMaker);
}));

router.delete('/:id', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  if (req.matchMakerId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await MatchMaker.findByIdAndDelete(req.params.id);
  await Token.deleteMany({ matchMaker: req.params.id });
  res.json({ message: 'Deleted' });
}));

router.get('/:id/singles', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  if (req.matchMakerId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const singles = await Single.find({ matchMakers: req.params.id });
  res.json(singles);
}));

router.get('/:id/others', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  if (req.matchMakerId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const others = await MatchMaker.find(
    { _id: { $ne: req.params.id } },
    OTHER_MATCHMAKER_PROJECTION
  ).lean();
  res.json(others);
}));

router.post('/:id/add-single/:singleId', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  if (req.matchMakerId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const single = await Single.findById(req.params.singleId);
  if (!single || !single.isPublic) {
    return res.status(404).json({ error: 'Single not found' });
  }
  if (!single.matchMakers.map((id) => id.toString()).includes(req.params.id)) {
    single.matchMakers.push(req.params.id as any);
    await single.save();
  }
  res.json(single);
}));

export default router;
