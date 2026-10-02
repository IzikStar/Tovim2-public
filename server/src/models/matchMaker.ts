import { Schema, model, Document, UpdateQuery } from 'mongoose';
import { Gender, Sector } from './enums.js';
import { hashPassword, isHashed } from '../utils/password.js';

export interface IMatchMaker {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  city: string;
  gender: Gender;
  sector: Sector;
  expertSectors: Sector[];
}

const matchMakerSchema = new Schema<IMatchMaker>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: {
      type: String,
      required: true,
      match: /^\+?\d{7,15}$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /.+@.+\..+/, 
    },
    // Never selected by default; use .select('+password') where it is really needed
    password: { type: String, required: true, select: false },
    city: { type: String, required: true },
    gender: { type: String, enum: Object.values(Gender), required: true },
    sector: { type: String, enum: Object.values(Sector), required: true },
    expertSectors: {
      type: [String],
      enum: Object.values(Sector),
      default: [],
    },
    // MongoDB provides an _id field by default
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

matchMakerSchema.pre<IMatchMaker & Document>('save', async function () {
  if (this.isModified('password') && !isHashed(this.password)) {
    this.password = await hashPassword(this.password);
  }
});

// Defense in depth: hash passwords passed to query-based updates too
// (findByIdAndUpdate / updateOne bypass the save hook).
matchMakerSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], async function () {
  const update = this.getUpdate() as UpdateQuery<IMatchMaker> | null;
  if (!update || Array.isArray(update)) {
    return;
  }
  for (const target of [update, update.$set]) {
    if (target && typeof target.password === 'string' && !isHashed(target.password)) {
      target.password = await hashPassword(target.password);
    }
  }
});

export const MatchMaker = model<IMatchMaker>('MatchMaker', matchMakerSchema);
