import { Schema, model, Types } from 'mongoose';

export interface ITransferRequest {
  single: Types.ObjectId;
  from: Types.ObjectId;
  to: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
}

const transferRequestSchema = new Schema<ITransferRequest>({
  single: { type: Schema.Types.ObjectId, ref: 'Single', required: true },
  from: { type: Schema.Types.ObjectId, ref: 'MatchMaker', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'MatchMaker', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

transferRequestSchema.index({ to: 1, status: 1 });
// At most one pending request per single and target matchmaker
transferRequestSchema.index(
  { single: 1, to: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);
transferRequestSchema.index({ from: 1, status: 1 });

export const TransferRequest = model<ITransferRequest>('TransferRequest', transferRequestSchema);
