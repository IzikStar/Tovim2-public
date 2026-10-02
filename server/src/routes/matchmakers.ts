import { Router } from 'express';
import { MatchMaker } from '../models/matchMaker.js';
import { Single } from '../models/single.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { Token } from '../models/token.js';
import { asyncHandler, isValidObjectId, pick } from '../utils/http.js';
import { passwordProblem, verifyPassword } from '../utils/password.js';

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
  'ageRange',
  'priceRange',
  'about',
] as const;

/** What one matchmaker may see about the others (no contacts, no password). */
const OTHER_MATCHMAKER_PROJECTION = {
  firstName: 1,
  lastName: 1,
  city: 1,
  sector: 1,
  expertSectors: 1,
  ageRange: 1,
  priceRange: 1,
  about: 1,
} as const;

/** Shown to anyone holding a registration link. */
const PUBLIC_MATCHMAKER_PROJECTION = {
  firstName: 1,
  lastName: 1,
  city: 1,
} as const;

/** 400 body for a weak password, in the same shape as a validation error. */
const weakPassword = (problem: string) => ({ error: 'Validation failed', fields: { password: problem } });

router.post('/', asyncHandler(async (req, res) => {
  const problem = passwordProblem(req.body?.password);
  if (problem) {
    return res.status(400).json(weakPassword(problem));
  }
  const matchMaker = await MatchMaker.create(pick(req.body, MATCHMAKER_FIELDS));
  res.status(201).json(matchMaker); // toJSON strips the password
}));

// Profile of the logged-in matchmaker (the client only has the token after a reload)
router.get('/me', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  const matchMaker = await MatchMaker.findById(req.matchMakerId);
  if (!matchMaker) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(matchMaker);
}));

/**
 * Public card for a registration link (/register/:matchMakerId): just enough
 * for the single to see whose form they are filling in. No contact details.
 */
router.get('/:id/public', asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Not found' });
  }
  const matchMaker = await MatchMaker.findById(req.params.id, PUBLIC_MATCHMAKER_PROJECTION).lean();
  if (!matchMaker) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(matchMaker);
}));

router.put('/:id', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  if (req.matchMakerId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const changingPassword = req.body?.password !== undefined;
  const matchMaker = await MatchMaker.findById(req.params.id).select(changingPassword ? '+password' : '');
  if (!matchMaker) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (changingPassword) {
    // A stolen session alone must not be enough to take over the account
    const current = req.body.currentPassword;
    if (typeof current !== 'string' || !(await verifyPassword(current, matchMaker.password))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const problem = passwordProblem(req.body.password);
    if (problem) {
      return res.status(400).json(weakPassword(problem));
    }
  }
  // Load + save (not findByIdAndUpdate) so validation and the password-hashing hook run
  matchMaker.set(pick(req.body, MATCHMAKER_FIELDS));
  await matchMaker.save();
  if (changingPassword) {
    // Log out every other device; this one keeps its token
    await Token.deleteMany({ matchMaker: matchMaker._id, token: { $ne: req.tokenHash } });
  }
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
  const singles = await Single.find({ matchMakers: req.params.id, isTaken: { $ne: true } });
  res.json(singles);
}));

// Singles who are now taken: matched by this matchmaker, or handled by them (the "couples" page)
router.get('/:id/married', authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  if (req.matchMakerId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const married = await Single.find({
    $or: [{ marriedMatchmaker: req.params.id }, { matchMakers: req.params.id, isTaken: true }],
  }).sort({ updatedAt: -1 });
  res.json(married);
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
