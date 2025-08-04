import { Router } from 'express';
import { Single } from '../models/single.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.post('/register/:matchMakerId', async (req, res, next) => {
    const { matchMakerId } = req.params;
    try {
        const single = await Single.create({
            ...req.body,
            matchMakers: [matchMakerId],
        });
        res.status(201).json(single);
    }
    catch (err) {
        next(err);
    }
});
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { matchMakerId, ...data } = req.body;
        if (req.matchMakerId !== matchMakerId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const single = await Single.create({ ...data, matchMakers: [matchMakerId] });
        res.status(201).json(single);
    }
    catch (err) {
        next(err);
    }
});
router.post('/bulk', authenticate, async (req, res, next) => {
    try {
        const { matchMakerId, singles } = req.body;
        if (req.matchMakerId !== matchMakerId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const docs = await Single.insertMany(singles.map((s) => ({ ...s, matchMakers: [matchMakerId] })));
        res.status(201).json(docs);
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', authenticate, async (req, res, next) => {
    try {
        const single = await Single.findById(req.params.id);
        if (!single) {
            return res.status(404).json({ error: 'Not found' });
        }
        if (!single.matchMakers.map((id) => id.toString()).includes(req.matchMakerId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const updateData = { ...req.body };
        if (updateData.isTaken && !updateData.marriedMatchmaker) {
            updateData.marriedMatchmaker = req.matchMakerId;
        }
        const updated = await Single.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const single = await Single.findById(req.params.id);
        if (!single) {
            return res.status(404).json({ error: 'Not found' });
        }
        if (!single.matchMakers.map((id) => id.toString()).includes(req.matchMakerId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        await single.deleteOne();
        res.json({ message: 'Deleted' });
    }
    catch (err) {
        next(err);
    }
});
router.get('/public', async (_req, res, next) => {
    try {
        const singles = await Single.find({
            isPublic: true,
            marriedMatchmaker: { $exists: false },
        });
        res.json(singles);
    }
    catch (err) {
        next(err);
    }
});
export default router;
