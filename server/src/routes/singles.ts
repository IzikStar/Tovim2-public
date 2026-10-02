import { Router } from 'express';
import {
  Single,
  SINGLE_EDITABLE_FIELDS,
  SINGLE_PUBLIC_PROJECTION,
} from '../models/single.js';
import { MatchMaker } from '../models/matchMaker.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, isValidObjectId, pick } from '../utils/http.js';

const router = Router();

const isOwner = (matchMakers: { toString(): string }[], matchMakerId?: string) =>
  matchMakers.map((id) => id.toString()).includes(matchMakerId!);

// Public self-registration form: the single fills it in via a matchmaker's link
router.post('/register/:matchMakerId', asyncHandler(async (req, res) => {
  const { matchMakerId } = req.params;
  if (!isValidObjectId(matchMakerId) || !(await MatchMaker.exists({ _id: matchMakerId }))) {
    return res.status(404).json({ error: 'Matchmaker not found' });
  }
  const single = await Single.create({
    ...pick(req.body, SINGLE_EDITABLE_FIELDS),
    matchMakers: [matchMakerId],
  });
  res.status(201).json(single);
}));

router.post('/', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  const { matchMakerId } = req.body ?? {};
  if (req.matchMakerId !== matchMakerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const single = await Single.create({
    ...pick(req.body, SINGLE_EDITABLE_FIELDS),
    matchMakers: [matchMakerId],
  });
  res.status(201).json(single);
}));

router.get('/public', asyncHandler(async (_req, res) => {
  const singles = await Single.find({ isPublic: true }, SINGLE_PUBLIC_PROJECTION).lean();
  res.json(singles);
}));

router.put('/:id', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  const single = await Single.findById(req.params.id);
  if (!single) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (!isOwner(single.matchMakers, req.matchMakerId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  single.set(pick(req.body, SINGLE_EDITABLE_FIELDS));
  await single.save();
  res.json(single);
}));

router.delete('/:id', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  const single = await Single.findById(req.params.id);
  if (!single) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (!isOwner(single.matchMakers, req.matchMakerId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await single.deleteOne();
  res.json({ message: 'Deleted' });
}));

export default router;
