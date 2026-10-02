import { Schema, model, Types } from 'mongoose';

/** Where a match stands, from a first idea to a wedding. */
export enum ProposalStatus {
  IDEA = 'idea',
  PROPOSED = 'proposed',
  DATING = 'dating',
  ENGAGED = 'engaged',
  MARRIED = 'married',
  CLOSED = 'closed',
}

/** What one side answered when the match was suggested to them. */
export enum SideResponse {
  PENDING = 'pending',
  THINKING = 'thinking',
  YES = 'yes',
  NO = 'no',
}

export interface IProposalSide {
  single: Types.ObjectId;
  response: SideResponse;
  /** What they said about it, in the matchmaker's words */
  note?: string;
  respondedAt?: Date;
}

/** A history entry: a status change, or putting the proposal on hold / back. */
export enum ProposalEventKind {
  STATUS = 'status',
  HOLD = 'hold',
  RESUME = 'resume',
}

export interface IProposalEvent {
  status: ProposalStatus;
  kind?: ProposalEventKind;
  at: Date;
  note?: string;
}

/**
 * Paused because one or both sides aren't available right now (in the army,
 * abroad, dating someone else). The proposal keeps its status and comes back
 * to the matchmaker's attention once `until` passes.
 */
export interface IProposalHold {
  until: Date;
  since: Date;
  /** The sides that aren't available; empty when it's not about one side */
  unavailable: Types.ObjectId[];
  reason?: string;
}

export interface IProposal {
  matchMaker: Types.ObjectId;
  /** Always two singles of opposite gender */
  sides: IProposalSide[];
  status: ProposalStatus;
  notes?: string;
  /** How many times they met, once dating */
  datesCount: number;
  /** Why it ended, when status is closed */
  closeReason?: string;
  history: IProposalEvent[];
  hold?: IProposalHold | null;
}

const sideSchema = new Schema<IProposalSide>(
  {
    single: { type: Schema.Types.ObjectId, ref: 'Single', required: true },
    response: { type: String, enum: Object.values(SideResponse), default: SideResponse.PENDING },
    note: { type: String, maxlength: 2000 },
    respondedAt: { type: Date },
  },
  { _id: false }
);

const eventSchema = new Schema<IProposalEvent>(
  {
    status: { type: String, enum: Object.values(ProposalStatus), required: true },
    kind: { type: String, enum: Object.values(ProposalEventKind), default: ProposalEventKind.STATUS },
    at: { type: Date, default: Date.now },
    note: { type: String, maxlength: 2000 },
  },
  { _id: false }
);

const holdSchema = new Schema<IProposalHold>(
  {
    until: { type: Date, required: true },
    since: { type: Date, default: Date.now },
    unavailable: [{ type: Schema.Types.ObjectId, ref: 'Single' }],
    reason: { type: String, maxlength: 1000 },
  },
  { _id: false }
);

const proposalSchema = new Schema<IProposal>(
  {
    matchMaker: { type: Schema.Types.ObjectId, ref: 'MatchMaker', required: true },
    sides: {
      type: [sideSchema],
      validate: { validator: (v: IProposalSide[]) => v.length === 2, message: 'A proposal has two sides' },
    },
    status: { type: String, enum: Object.values(ProposalStatus), default: ProposalStatus.IDEA },
    notes: { type: String, maxlength: 5000 },
    datesCount: { type: Number, min: 0, default: 0 },
    closeReason: { type: String, maxlength: 2000 },
    history: { type: [eventSchema], default: [] },
    hold: { type: holdSchema, default: null },
  },
  { timestamps: true }
);

proposalSchema.index({ matchMaker: 1, updatedAt: -1 });
proposalSchema.index({ 'sides.single': 1 });

/** Statuses in which a pair is still "in play" (no duplicate proposal allowed). */
export const OPEN_STATUSES = [
  ProposalStatus.IDEA,
  ProposalStatus.PROPOSED,
  ProposalStatus.DATING,
  ProposalStatus.ENGAGED,
];

export const Proposal = model<IProposal>('Proposal', proposalSchema);
