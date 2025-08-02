import { Schema, model } from 'mongoose';
import { Gender, Sector } from './enums.js';

const matchMakerSchema = new Schema(
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

export const MatchMaker = model('MatchMaker', matchMakerSchema);
