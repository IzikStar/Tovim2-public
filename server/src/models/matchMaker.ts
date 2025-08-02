import {
  Schema,
  model,
  Document,
  CallbackWithoutResultAndOptionalError,
} from 'mongoose';
import crypto from 'crypto';
import { Gender, Sector } from './enums.js';

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
    password: { type: String, required: true },
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
  { timestamps: true }
);

matchMakerSchema.pre<
  IMatchMaker & Document
>('save', function (this: IMatchMaker & Document, next: CallbackWithoutResultAndOptionalError) {
  if (this.isModified('password')) {
    this.password = crypto
      .createHash('sha256')
      .update(this.password)
      .digest('hex');
  }
  next();
});

export const MatchMaker = model<IMatchMaker>('MatchMaker', matchMakerSchema);
