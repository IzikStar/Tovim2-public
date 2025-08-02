import { Schema, model, Types } from 'mongoose';
import { Gender, Sector } from './enums.js';

const singleSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true }, // TODO: validate phone format
    email: { type: String, required: true, unique: true }, // TODO: add email validation
    city: { type: String, required: true },
    gender: { type: String, enum: Object.values(Gender), required: true },
    sector: { type: String, enum: Object.values(Sector), required: true },
    birthYear: { type: Number, required: true },
    description: { type: String }, // long text description
    attributes: { type: [String], default: [] },
    lookingForAttributes: { type: [String], default: [] },
    nonCompromisableAttributes: { type: [String], default: [] }, // TODO: enforce exactly four items
    desiredSectors: {
      type: [String],
      enum: Object.values(Sector),
      default: [],
    },
    matchMakers: [{ type: Types.ObjectId, ref: 'MatchMaker' }],
    isPublic: { type: Boolean, default: false },
    images: { type: [String], default: [] }, // TODO: store image URLs or actual files
    height: { type: Number }, // TODO: define measurement unit
    appearanceDescription: { type: String },
    searchText: { type: String },
  },
  { timestamps: true }
);

export const Single = model('Single', singleSchema);
