import { Schema, model } from 'mongoose';
const transferRequestSchema = new Schema({
    single: { type: Schema.Types.ObjectId, ref: 'Single', required: true },
    from: { type: Schema.Types.ObjectId, ref: 'MatchMaker', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'MatchMaker', required: true },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
}, { timestamps: true });
export const TransferRequest = model('TransferRequest', transferRequestSchema);
