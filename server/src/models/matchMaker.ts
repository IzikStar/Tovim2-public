import { Schema, model } from 'mongoose';
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
}

const matchMakerSchema = new Schema<IMatchMaker>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true }, // TODO: validate phone format
    email: { type: String, required: true, unique: true }, // TODO: add email validation
    password: { type: String, required: true }, // TODO: hash password before saving
    city: { type: String, required: true },
    gender: { type: String, enum: Object.values(Gender), required: true },
    sector: { type: String, enum: Object.values(Sector), required: true },
    // MongoDB provides an _id field by default
  },
  { timestamps: true }
);

export const MatchMaker = model<IMatchMaker>('MatchMaker', matchMakerSchema);
