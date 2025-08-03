import { Router } from 'express';
import { Single } from '../models/single.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.post('/register/:matchMakerId', async (req, res) => {
    const { matchMakerId } = req.params;
    try {
        const single = await Single.create({
            ...req.body,
            matchMakers: [matchMakerId],
        });
        res.status(201).json(single);
    }
    catch (err) {
        res.status(400).json({ error: 'Failed to create single' });
    }
});
router.post('/', authenticate, async (req, res) => {
    const { matchMakerId, ...data } = req.body;
    if (req.matchMakerId !== matchMakerId) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const single = await Single.create({ ...data, matchMakers: [matchMakerId] });
    res.status(201).json(single);
});
router.post('/bulk', authenticate, async (req, res) => {
    const { matchMakerId, singles } = req.body;
    if (req.matchMakerId !== matchMakerId) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const docs = await Single.insertMany(singles.map((s) => ({ ...s, matchMakers: [matchMakerId] })));
        res.status(201).json(docs);
    }
    catch (err) {
        res.status(400).json({ error: 'Failed to create singles' });
    }
});
router.put('/:id', authenticate, async (req, res) => {
    const single = await Single.findById(req.params.id);
    if (!single) {
        return res.status(404).json({ error: 'Not found' });
    }
    if (!single.matchMakers.map((id) => id.toString()).includes(req.matchMakerId)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    Object.assign(single, req.body);
    await single.save();
    res.json(single);
});
router.delete('/:id', authenticate, async (req, res) => {
    const single = await Single.findById(req.params.id);
    if (!single) {
        return res.status(404).json({ error: 'Not found' });
    }
    if (!single.matchMakers.map((id) => id.toString()).includes(req.matchMakerId)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    await single.deleteOne();
    res.json({ message: 'Deleted' });
});
router.get('/public', async (_req, res) => {
    const singles = await Single.find({
        isPublic: true,
        marriedMatchmaker: { $exists: false },
    });
    res.json(singles);
});
export default router;
