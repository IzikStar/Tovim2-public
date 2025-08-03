import { Schema, model, Types } from "mongoose";
import { Gender, Sector, MarriageStatus, Ethnicity, Interest, ProposePreference, } from "./enums.js";
const phoneRegex = /^\+?\d{7,15}$/;
const emailRegex = /.+@.+\..+/;
// Images are expected to be sent as base64 data URIs
const base64ImagePrefix = /^data:image\//;
const ageRangeSchema = new Schema({
    min: { type: Number, min: 18 },
    max: { type: Number, min: 18 },
}, { _id: false });
const singleSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true, match: phoneRegex },
    email: { type: String, unique: true, match: emailRegex },
    city: { type: String, required: true },
    gender: { type: String, enum: Object.values(Gender) },
    sectors: { type: [String], enum: Object.values(Sector), default: [] },
    customSector: { type: String },
    birthDate: { type: Date, required: true },
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
            validator: (v) => v.length === 4,
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
    images: {
        type: [String],
        default: [],
        validate: {
            validator: (arr) => arr.every((img) => base64ImagePrefix.test(img)),
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
            validator: (arr) => arr.every((p) => phoneRegex.test(p)),
            message: "Invalid phone number",
        },
    },
    nameForPrayer: { type: String },
    referralSource: { type: String },
    matchmakerExpectations: { type: String },
    desiredAgeRange: {
        type: ageRangeSchema,
        validate: {
            validator: (v) => v.min <= v.max,
            message: "desiredAgeRange.min must be <= max",
        },
    },
    searchText: { type: String },
}, { timestamps: true });
export const Single = model("Single", singleSchema);
