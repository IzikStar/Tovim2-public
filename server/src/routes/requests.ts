import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { TransferRequest } from '../models/transferRequest.js';
import { Single } from '../models/single.js';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res) => {
  const { singleId, toMatchMakerId } = req.body;
  const single = await Single.findById(singleId);
  if (!single) {
    return res.status(404).json({ error: 'Single not found' });
  }
  if (!single.matchMakers.map((id) => id.toString()).includes(req.matchMakerId!)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const request = await TransferRequest.create({
    single: singleId,
    from: req.matchMakerId!,
    to: toMatchMakerId,
  });
  res.status(201).json(request);
});

router.post('/:id/approve', authenticate, async (req: AuthRequest, res) => {
  const requestDoc = await TransferRequest.findById(req.params.id);
  if (!requestDoc) {
    return res.status(404).json({ error: 'Request not found' });
  }
  if (requestDoc.to.toString() !== req.matchMakerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (requestDoc.status === 'approved') {
    return res.status(400).json({ error: 'Already approved' });
  }
  requestDoc.status = 'approved';
  await requestDoc.save();
  const single = await Single.findById(requestDoc.single);
  if (
    single &&
    !single.matchMakers.map((id) => id.toString()).includes(req.matchMakerId!)
  ) {
    single.matchMakers.push(requestDoc.to as any);
    await single.save();
  }
  res.json(requestDoc);
});

export default router;
