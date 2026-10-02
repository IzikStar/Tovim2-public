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

export interface IProposalEvent {
  status: ProposalStatus;
  at: Date;
  note?: string;
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
    at: { type: Date, default: Date.now },
    note: { type: String, maxlength: 2000 },
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
