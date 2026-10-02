import { Schema, model, Types } from "mongoose";
import {
  Gender,
  Sector,
  MarriageStatus,
  Ethnicity,
  Interest,
  ProposePreference,
} from "./enums.js";

const phoneRegex = /^\+?\d{7,15}$/;
const emailRegex = /.+@.+\..+/;
// Images are expected to be sent as base64 data URIs
const base64ImagePrefix = /^data:image\//;

interface AgeRange {
  min: number;
  max: number;
}

export interface ISingle {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  city: string;
  gender: Gender;
  sector: Sector;
  customSector?: string;
  birthYear: number;
  marriageStatus: MarriageStatus;
  numOfChildren: number;
  ethnicity: Ethnicity;
  customEthnicity?: string;
  workAndStudyPlaces: string[];
  currentOccupation?: string;
  basicDescription?: string;
  freeDescription?: string;
  attributes: string[];
  lookingForAttributes: string[];
  nonCompromisableAttributes: string[];
  desiredSectors: Sector[];
  matchMakers: Types.ObjectId[];
  isPublic: boolean;
  /** Married or engaged: hidden from the active lists and the public pool */
  isTaken: boolean;
  /** The matchmaker who made the match, when isTaken */
  marriedMatchmaker?: Types.ObjectId;
  /** Base64-encoded image strings */
  images: string[];
  height?: number;
  appearanceDescription?: string;
  appearanceMustHave?: string;
  appearanceMustNotHave?: string;
  generalDealBreakers?: string;
  interests: Interest[];
  otherInterests: string[];
  futureVision?: string;
  existingMatchProfile?: string;
  shareInWhatsappGroups: boolean;
  proposePreference: ProposePreference;
  referencePhones: string[];
  nameForPrayer?: string;
  referralSource?: string;
  matchmakerExpectations?: string;
  desiredAgeRange?: AgeRange;
  searchText?: string;
}

const ageRangeSchema = new Schema<AgeRange>(
  {
    min: { type: Number, min: 18 },
    max: { type: Number, min: 18 },
  },
  { _id: false }
);

const singleSchema = new Schema<ISingle>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true, match: phoneRegex },
    // Optional (not every single has one); sparse so many singles can leave it empty
    email: {
      type: String,
      unique: true,
      sparse: true,
      match: emailRegex,
      set: (v: unknown) => (v === "" || v === null ? undefined : v),
    },
    city: { type: String, required: true },
    gender: { type: String, enum: Object.values(Gender), required: true },
    sector: { type: String, enum: Object.values(Sector), required: true },
    customSector: { type: String },
    birthYear: { type: Number, required: true },
    marriageStatus: {
      type: String,
      enum: Object.values(MarriageStatus),
      required: true,
    },
    numOfChildren: { type: Number, default: 0 },
    ethnicity: { type: String, enum: Object.values(Ethnicity), required: true },
    customEthnicity: { type: String },
    workAndStudyPlaces: { type: [String], default: [] },
    currentOccupation: { type: String },
    basicDescription: { type: String },
    freeDescription: { type: String },
    attributes: { type: [String], default: [] },
    lookingForAttributes: { type: [String], default: [] },
    nonCompromisableAttributes: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length === 4,
        message: "Exactly four attributes required",
      },
    },
    desiredSectors: {
      type: [String],
      enum: Object.values(Sector),
      default: [],
    },
    matchMakers: [{ type: Types.ObjectId, ref: "MatchMaker" }],
    isPublic: { type: Boolean, default: false },
    isTaken: { type: Boolean, default: false },
    marriedMatchmaker: { type: Types.ObjectId, ref: "MatchMaker" },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) =>
          arr.every((img) => base64ImagePrefix.test(img)),
        message: "Invalid base64 image",
      },
    },
    height: { type: Number, min: 50, max: 250 },
    appearanceDescription: { type: String },
    appearanceMustHave: { type: String },
    appearanceMustNotHave: { type: String },
    generalDealBreakers: { type: String },
    interests: {
      type: [String],
      enum: Object.values(Interest),
      default: [],
    },
    otherInterests: { type: [String], default: [] },
    futureVision: { type: String },
    existingMatchProfile: { type: String },
    shareInWhatsappGroups: { type: Boolean, default: false },
    proposePreference: {
      type: String,
      enum: Object.values(ProposePreference),
      default: ProposePreference.NO_PREFERENCE,
    },
    referencePhones: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.every((p) => phoneRegex.test(p)),
        message: "Invalid phone number",
      },
    },
    nameForPrayer: { type: String },
    referralSource: { type: String },
    matchmakerExpectations: { type: String },
    desiredAgeRange: {
      type: ageRangeSchema,
      validate: {
        // null clears the range; an open-ended range (only min or max) is allowed
        validator: (v: AgeRange | null) =>
          !v || v.min == null || v.max == null || v.min <= v.max,
        message: "desiredAgeRange.min must be <= max",
      },
    },
    searchText: { type: String },
  },
  { timestamps: true }
);

export const Single = model<ISingle>("Single", singleSchema);

/**
 * Fields a matchmaker (or the single, via the public registration form) may set.
 * `matchMakers` is deliberately excluded: ownership only changes through the
 * add-single and transfer-request flows.
 */
export const SINGLE_EDITABLE_FIELDS = [
  "firstName",
  "lastName",
  "phoneNumber",
  "email",
  "city",
  "gender",
  "sector",
  "customSector",
  "birthYear",
  "marriageStatus",
  "numOfChildren",
  "ethnicity",
  "customEthnicity",
  "workAndStudyPlaces",
  "currentOccupation",
  "basicDescription",
  "freeDescription",
  "attributes",
  "lookingForAttributes",
  "nonCompromisableAttributes",
  "desiredSectors",
  "isPublic",
  "images",
  "height",
  "appearanceDescription",
  "appearanceMustHave",
  "appearanceMustNotHave",
  "generalDealBreakers",
  "interests",
  "otherInterests",
  "futureVision",
  "existingMatchProfile",
  "shareInWhatsappGroups",
  "proposePreference",
  "referencePhones",
  "nameForPrayer",
  "referralSource",
  "matchmakerExpectations",
  "desiredAgeRange",
  "searchText",
] as const;

/**
 * Projection for the unauthenticated public database (GET /singles/public).
 * Only enough to decide whether a profile is worth pursuing; nothing that can
 * contact or directly identify the person. Excluded on purpose: last name,
 * phone/email, images, reference phones, name for prayer, free-text fields that
 * tend to contain personal details (freeDescription, appearance*, existing
 * match profile, matchmaker expectations), work/study places and the owning
 * matchmakers. A matchmaker gets the full profile only after adding the single
 * (POST /matchmakers/:id/add-single/:singleId).
 */
export const SINGLE_PUBLIC_PROJECTION = {
  _id: 1,
  firstName: 1,
  gender: 1,
  sector: 1,
  customSector: 1,
  birthYear: 1,
  city: 1,
  marriageStatus: 1,
  numOfChildren: 1,
  ethnicity: 1,
  customEthnicity: 1,
  height: 1,
  currentOccupation: 1,
  basicDescription: 1,
  interests: 1,
  otherInterests: 1,
  desiredSectors: 1,
  desiredAgeRange: 1,
} as const;
