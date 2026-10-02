import { Router } from 'express';
import {
  Single,
  SINGLE_EDITABLE_FIELDS,
  SINGLE_PUBLIC_PROJECTION,
} from '../models/single.js';
import { MatchMaker } from '../models/matchMaker.js';
import { Proposal } from '../models/proposal.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, isValidObjectId, pick } from '../utils/http.js';
import { withAge } from '../utils/age.js';

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

// Several singles at once (e.g. imported from a spreadsheet); all or nothing
router.post('/bulk', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  const { matchMakerId, singles } = req.body ?? {};
  if (req.matchMakerId !== matchMakerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!Array.isArray(singles) || singles.length === 0 || singles.length > 200) {
    return res.status(400).json({ error: 'singles must be a list of 1-200 profiles' });
  }
  const docs = singles.map((s) => new Single({ ...pick(s, SINGLE_EDITABLE_FIELDS), matchMakers: [matchMakerId] }));
  // Validate everything before writing anything
  await Promise.all(docs.map((d) => d.validate()));
  const created = await Single.insertMany(docs);
  res.status(201).json(created);
}));

router.get('/public', asyncHandler(async (_req, res) => {
  const singles = await Single.find({ isPublic: true, isTaken: { $ne: true } }, SINGLE_PUBLIC_PROJECTION).lean();
  res.json(singles.map(withAge));
}));

// Full profile, for the matchmakers handling this single only
router.get('/:id', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  const single = await Single.findById(req.params.id);
  if (!single) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (!isOwner(single.matchMakers, req.matchMakerId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(single);
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
  // Marking as taken records who made the match; un-marking clears it
  if (typeof req.body?.isTaken === 'boolean') {
    single.isTaken = req.body.isTaken;
    single.marriedMatchmaker = req.body.isTaken ? (req.matchMakerId as any) : undefined;
  }
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
  await Proposal.deleteMany({ 'sides.single': single._id });
  res.json({ message: 'Deleted' });
}));

export default router;
