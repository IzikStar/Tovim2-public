import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { OPEN_STATUSES, Proposal, ProposalEventKind, ProposalStatus, SideResponse } from '../models/proposal.js';
import { Single } from '../models/single.js';
import { suggestMatches } from '../services/suggestions.js';
import { brainstorm, BRAINSTORM_MODES, BrainstormMode } from '../services/brainstorm.js';
import { asyncHandler, isValidObjectId } from '../utils/http.js';
import { ageOn, withAge } from '../utils/age.js';

const router = Router();
router.use(authenticate);

/** Enough to show who the two sides are; no images (large) or contact details. */
const SIDE_FIELDS = 'firstName lastName gender sectors customSector birthDate city currentOccupation matchMakers isPublic';

const isStatus = (v: unknown): v is ProposalStatus =>
  Object.values(ProposalStatus).includes(v as ProposalStatus);
const isResponse = (v: unknown): v is SideResponse =>
  Object.values(SideResponse).includes(v as SideResponse);

/**
 * Hides the last name and exact birth date of singles the matchmaker doesn't
 * handle (pool singles); everyone gets `age`.
 */
const present = (proposal: any, matchMakerId: string) => {
  const p = typeof proposal.toObject === 'function' ? proposal.toObject() : proposal;
  p.sides = p.sides.map((side: any) => {
    const s = side.single;
    if (!s || typeof s !== 'object' || !('firstName' in s)) return side;
    const mine = (s.matchMakers ?? []).some((id: any) => id.toString() === matchMakerId);
    const { matchMakers: _m, lastName, ...rest } = s;
    const shown = mine ? { ...rest, lastName, age: rest.birthDate ? ageOn(rest.birthDate) : undefined } : withAge(rest);
    return { ...side, single: { ...shown, mine } };
  });
  return p;
};

/** Marking a match as married takes both singles off the active lists. */
const markTaken = async (singleIds: unknown[], matchMakerId: string) => {
  await Single.updateMany(
    { _id: { $in: singleIds } },
    { $set: { isTaken: true, marriedMatchmaker: matchMakerId } }
  );
  // Other open ideas of this matchmaker for the same people are no longer relevant
  await Proposal.updateMany(
    {
      matchMaker: matchMakerId,
      status: { $in: OPEN_STATUSES },
      'sides.single': { $in: singleIds },
    },
    {
      $set: { status: ProposalStatus.CLOSED, closeReason: 'התחתנו עם מישהו אחר', hold: null },
      $push: { history: { status: ProposalStatus.CLOSED, at: new Date(), note: 'נסגר אוטומטית: התחתנו' } },
    }
  );
};

// Brainstorm mode: random and off-the-usual-path pairs, to prompt new ideas
router.get('/brainstorm', asyncHandler<AuthRequest>(async (req, res) => {
  const mode = (req.query.mode ?? 'random') as BrainstormMode;
  if (!BRAINSTORM_MODES.includes(mode)) {
    return res.status(400).json({ error: `mode must be one of ${BRAINSTORM_MODES.join(', ')}` });
  }
  const singleId = typeof req.query.single === 'string' ? req.query.single : undefined;
  if (mode === 'single' && !isValidObjectId(singleId)) {
    return res.status(400).json({ error: 'mode=single needs a valid single id' });
  }
  const count = Math.min(Math.max(Number(req.query.count) || 6, 1), 20);
  res.json(await brainstorm(req.matchMakerId!, { mode, count, singleId }));
}));

// Automatic match ideas for the dashboard (optionally for one single)
router.get('/suggestions', asyncHandler<AuthRequest>(async (req, res) => {
  const singleId = typeof req.query.single === 'string' ? req.query.single : undefined;
  if (singleId && !isValidObjectId(singleId)) {
    return res.status(400).json({ error: 'Invalid single id' });
  }
  const limit = Math.min(Number(req.query.limit) || 12, 50);
  res.json(await suggestMatches(req.matchMakerId!, { limit, singleId }));
}));

// The logged-in matchmaker's proposals, newest activity first; ?single= narrows to one person
router.get('/', asyncHandler<AuthRequest>(async (req, res) => {
  const filter: Record<string, unknown> = { matchMaker: req.matchMakerId };
  if (typeof req.query.single === 'string') {
    if (!isValidObjectId(req.query.single)) {
      return res.status(400).json({ error: 'Invalid single id' });
    }
    filter['sides.single'] = req.query.single;
  }
  const proposals = await Proposal.find(filter).sort({ updatedAt: -1 }).populate('sides.single', SIDE_FIELDS).lean();
  res.json(proposals.map((p) => present(p, req.matchMakerId!)));
}));

router.post('/', asyncHandler<AuthRequest>(async (req, res) => {
  const { singleIds, status = ProposalStatus.IDEA, notes } = req.body ?? {};
  if (!Array.isArray(singleIds) || singleIds.length !== 2 || !singleIds.every(isValidObjectId) || singleIds[0] === singleIds[1]) {
    return res.status(400).json({ error: 'singleIds must be two different single ids' });
  }
  if (!isStatus(status) || status === ProposalStatus.CLOSED) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const singles = await Single.find({ _id: { $in: singleIds } }, 'gender matchMakers isPublic isTaken');
  if (singles.length !== 2) {
    return res.status(404).json({ error: 'Single not found' });
  }
  // Each side must be one of mine or in the shared pool, and at least one must be mine
  const mine = singles.map((s) => s.matchMakers.some((id) => id.toString() === req.matchMakerId));
  if (!mine.some(Boolean) || singles.some((s, i) => !mine[i] && !s.isPublic)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (singles[0].gender === singles[1].gender) {
    return res.status(400).json({ error: 'A proposal needs a man and a woman' });
  }
  if (singles.some((s) => s.isTaken)) {
    return res.status(400).json({ error: 'Single is already taken' });
  }
  const existing = await Proposal.exists({
    matchMaker: req.matchMakerId,
    status: { $in: OPEN_STATUSES },
    $and: singleIds.map((id: string) => ({ 'sides.single': id })),
  });
  if (existing) {
    return res.status(409).json({ error: 'Proposal already exists', id: existing._id });
  }
  const proposal = await Proposal.create({
    matchMaker: req.matchMakerId,
    sides: singleIds.map((id: string) => ({ single: id })),
    status,
    notes,
    history: [{ status, at: new Date() }],
  });
  if (status === ProposalStatus.MARRIED) {
    await markTaken(singleIds, req.matchMakerId!);
  }
  await proposal.populate('sides.single', SIDE_FIELDS);
  res.status(201).json(present(proposal, req.matchMakerId!));
}));

/**
 * Updates status, notes, datesCount, closeReason and each side's response
 * (sides: [{ single, response, note }]). Every status change is recorded in
 * the history with an optional statusNote.
 *
 * hold: { until, unavailable?: singleIds, reason? } puts the proposal on hold
 * until a future date (again, to snooze it further); hold: null takes it off
 * hold. Both go into the history. Closing or marrying clears the hold.
 */
router.put('/:id', asyncHandler<AuthRequest>(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (proposal.matchMaker.toString() !== req.matchMakerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { status, statusNote, notes, datesCount, closeReason, sides, hold } = req.body ?? {};

  if (sides !== undefined) {
    if (!Array.isArray(sides)) {
      return res.status(400).json({ error: 'sides must be a list' });
    }
    for (const update of sides) {
      const side = proposal.sides.find((s) => s.single.toString() === update?.single);
      if (!side) {
        return res.status(400).json({ error: 'Unknown side' });
      }
      if (update.response !== undefined) {
        if (!isResponse(update.response)) {
          return res.status(400).json({ error: 'Invalid response' });
        }
        if (update.response !== side.response) {
          side.response = update.response;
          side.respondedAt = new Date();
        }
      }
      if (update.note !== undefined) side.note = update.note;
    }
  }
  if (notes !== undefined) proposal.notes = notes;
  if (datesCount !== undefined) proposal.datesCount = datesCount;
  if (closeReason !== undefined) proposal.closeReason = closeReason;

  let becameMarried = false;
  if (status !== undefined && status !== proposal.status) {
    if (!isStatus(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    proposal.status = status;
    proposal.history.push({ status, kind: ProposalEventKind.STATUS, at: new Date(), note: statusNote });
    becameMarried = status === ProposalStatus.MARRIED;
  }

  if (hold === null && proposal.hold) {
    proposal.hold = null;
    proposal.history.push({ status: proposal.status, kind: ProposalEventKind.RESUME, at: new Date() });
  } else if (hold !== undefined && hold !== null) {
    if (!OPEN_STATUSES.includes(proposal.status)) {
      return res.status(400).json({ error: 'Only an open proposal can be put on hold' });
    }
    const until = new Date(hold.until);
    if (Number.isNaN(until.getTime()) || until.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'hold.until must be a future date' });
    }
    const unavailable: unknown[] = hold.unavailable ?? [];
    const sideIds = proposal.sides.map((s) => s.single.toString());
    if (!Array.isArray(unavailable) || unavailable.some((id) => !sideIds.includes(String(id)))) {
      return res.status(400).json({ error: 'hold.unavailable must list sides of this proposal' });
    }
    const reason = typeof hold.reason === 'string' ? hold.reason.trim() : undefined;
    proposal.hold = {
      until,
      since: proposal.hold?.since ?? new Date(),
      unavailable: unavailable as any,
      reason: reason || undefined,
    };
    proposal.history.push({
      status: proposal.status,
      kind: ProposalEventKind.HOLD,
      at: new Date(),
      note: reason || undefined,
    });
  }
  if (!OPEN_STATUSES.includes(proposal.status)) {
    proposal.hold = null;
  }
  await proposal.save();
  if (becameMarried) {
    await markTaken(proposal.sides.map((s) => s.single), req.matchMakerId!);
  }
  await proposal.populate('sides.single', SIDE_FIELDS);
  res.json(present(proposal, req.matchMakerId!));
}));

router.delete('/:id', asyncHandler<AuthRequest>(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (proposal.matchMaker.toString() !== req.matchMakerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await proposal.deleteOne();
  res.json({ message: 'Deleted' });
}));

export default router;
