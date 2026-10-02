import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { TransferRequest } from "../models/transferRequest.js";
import { Single } from "../models/single.js";
import { MatchMaker } from "../models/matchMaker.js";
import { asyncHandler, isValidObjectId } from "../utils/http.js";
import { withAge } from "../utils/age.js";

const router = Router();

const MATCHMAKER_SUMMARY = "firstName lastName city";
const SINGLE_SUMMARY = "firstName lastName gender sectors customSector birthDate city";

// Incoming and outgoing transfer requests of the logged-in matchmaker
router.get("/", authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  const [incoming, outgoing] = await Promise.all([
    TransferRequest.find({ to: req.matchMakerId })
      .sort({ createdAt: -1 })
      .populate("single", SINGLE_SUMMARY)
      .populate("from", MATCHMAKER_SUMMARY)
      .lean(),
    TransferRequest.find({ from: req.matchMakerId })
      .sort({ createdAt: -1 })
      .populate("single", SINGLE_SUMMARY)
      .populate("to", MATCHMAKER_SUMMARY)
      .lean(),
  ]);
  // The receiving matchmaker doesn't handle the single yet: age, not birth date
  const shown = (r: any) => (r.single ? { ...r, single: withAge(r.single) } : r);
  res.json({ incoming: incoming.map(shown), outgoing: outgoing.map(shown) });
}));

router.post("/", authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  const { singleId, toMatchMakerId } = req.body ?? {};
  if (!isValidObjectId(singleId) || !isValidObjectId(toMatchMakerId)) {
    return res.status(400).json({ error: "singleId and toMatchMakerId must be valid ids" });
  }
  if (toMatchMakerId === req.matchMakerId) {
    return res.status(400).json({ error: "Cannot send a request to yourself" });
  }
  const single = await Single.findById(singleId);
  if (!single) {
    return res.status(404).json({ error: "Single not found" });
  }
  const owners = single.matchMakers.map((id) => id.toString());
  if (!owners.includes(req.matchMakerId!)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (!(await MatchMaker.exists({ _id: toMatchMakerId }))) {
    return res.status(404).json({ error: "Matchmaker not found" });
  }
  if (owners.includes(toMatchMakerId)) {
    return res.status(400).json({ error: "Matchmaker already handles this single" });
  }
  if (await TransferRequest.exists({ single: singleId, to: toMatchMakerId, status: "pending" })) {
    return res.status(409).json({ error: "A pending request already exists" });
  }
  // A concurrent duplicate still fails on the partial unique index (-> 409)
  const request = await TransferRequest.create({
    single: singleId,
    from: req.matchMakerId!,
    to: toMatchMakerId,
  });
  res.status(201).json(request);
}));

/**
 * Moves a pending request addressed to the current matchmaker to `status`.
 * Only pending requests can change; anything else is a 400.
 */
const decide = async (
  req: AuthRequest,
  status: "approved" | "rejected"
) => {
  const requestDoc = await TransferRequest.findById(req.params.id);
  if (!requestDoc) {
    return { code: 404, body: { error: "Request not found" } };
  }
  if (requestDoc.to.toString() !== req.matchMakerId) {
    return { code: 403, body: { error: "Forbidden" } };
  }
  // Conditional update so two concurrent decisions can't both succeed
  const updated = await TransferRequest.findOneAndUpdate(
    { _id: requestDoc._id, status: "pending" },
    { status },
    { new: true }
  );
  if (!updated) {
    return { code: 400, body: { error: "Only pending requests can be approved or rejected" } };
  }
  return { code: 200, body: updated };
};

router.post("/:id/approve", authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  const result = await decide(req, "approved");
  if (result.code === 200) {
    const requestDoc = result.body as InstanceType<typeof TransferRequest>;
    await Single.updateOne(
      { _id: requestDoc.single },
      { $addToSet: { matchMakers: requestDoc.to } }
    );
  }
  res.status(result.code).json(result.body);
}));

router.post("/:id/reject", authenticate, asyncHandler<AuthRequest>(async (req, res) => {
  const result = await decide(req, "rejected");
  res.status(result.code).json(result.body);
}));

export default router;
