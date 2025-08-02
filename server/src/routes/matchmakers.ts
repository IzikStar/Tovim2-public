import { Router } from 'express';
import { MatchMaker } from '../models/matchMaker';
import { Single } from '../models/single';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Token } from '../models/token';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const matchMaker = await MatchMaker.create(req.body);
    const { password, ...mm } = matchMaker.toObject();
    res.status(201).json(mm);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create matchmaker' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  if (req.matchMakerId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const updated = await MatchMaker.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!updated) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(updated);
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  if (req.matchMakerId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await MatchMaker.findByIdAndDelete(req.params.id);
  await Token.deleteMany({ matchMaker: req.params.id });
  res.json({ message: 'Deleted' });
});

router.get('/:id/singles', authenticate, async (req: AuthRequest, res) => {
  if (req.matchMakerId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const singles = await Single.find({ matchMakers: req.params.id });
  res.json(singles);
});

router.get('/:id/others', authenticate, async (req: AuthRequest, res) => {
  if (req.matchMakerId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const others = await MatchMaker.find({ _id: { $ne: req.params.id } });
  res.json(others);
});

router.post('/:id/add-single/:singleId', authenticate, async (req: AuthRequest, res) => {
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
});

export default router;
