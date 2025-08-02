import { Schema, model } from 'mongoose';
const tokenSchema = new Schema({
    matchMaker: { type: Schema.Types.ObjectId, ref: 'MatchMaker', required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '7d' },
});
export const Token = model('Token', tokenSchema);
