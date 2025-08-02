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
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
}, { timestamps: true });

export const TransferRequest = model<ITransferRequest>('TransferRequest', transferRequestSchema);
