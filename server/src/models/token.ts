import { Schema, model, Types } from 'mongoose';

export interface IToken {
  matchMaker: Types.ObjectId;
  token: string;
  createdAt: Date;
}

const tokenSchema = new Schema<IToken>({
  matchMaker: { type: Schema.Types.ObjectId, ref: 'MatchMaker', required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '7d' },
});

export const Token = model<IToken>('Token', tokenSchema);
